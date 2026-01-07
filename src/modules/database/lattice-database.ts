import { Construct } from 'constructs';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import {
  LatticeDatabaseProps,
  LatticeDatabaseConstruct,
  DatabaseEngine,
  DatabaseSize,
} from './types';
import { DatabaseOutput } from '../../core/types';
import { createStatefulnessPolicy } from '../../core/statefulness';
import { LatticeBackupManager } from '../../core/backup-manager';
import { LatticeObservabilityManager } from '../../core/observability';
import { logger, logExecutionTime } from '../../utils/logger';

/**
 * LatticeDatabase - RDS abstraction with security and high availability best practices
 */
export class LatticeDatabase extends Construct implements LatticeDatabaseConstruct {
  public readonly output: DatabaseOutput;

  // Escape hatch: Direct access to underlying AWS CDK constructs
  public readonly instance: rds.DatabaseInstance;
  public readonly securityGroup: ec2.SecurityGroup;

  // Observability: Alarms and dashboards for monitoring
  public readonly alarms: cloudwatch.Alarm[] = [];

  private readonly database: rds.DatabaseInstance;
  private readonly backupManager?: LatticeBackupManager;
  private readonly observabilityManager?: LatticeObservabilityManager;

  constructor(scope: Construct, id: string, props: LatticeDatabaseProps) {
    super(scope, id);

    const {
      name,
      environment,
      engine,
      size,
      highAvailability = false,
      network,
      backupRetention = 7,
      deletionProtection = environment === 'prod',
      performanceInsights = true,
      monitoring = true,
      useGraviton = true,
      vpc: existingVpc,
    } = props;

    logger.info(`Creating ${engine} database: ${name}`);

    // Create statefulness policy for proper operations management
    const statefulnessPolicy = createStatefulnessPolicy({
      environment,
      forceRetain: props.forceRetain,
      enableBackups: props.enableBackups,
      backupRetentionDays: props.backupRetentionDays,
    });

    // Create observability manager if monitoring is enabled
    if (props.enableObservability !== false) {
      this.observabilityManager = LatticeObservabilityManager.create(this, 'Observability', {
        environment,
        enableAlarms: props.enableAlarms,
        enableDashboards: props.enableDashboards,
        notificationTopic: props.notificationTopic,
      });
    }

    // Create backup manager if backups are enabled
    if (statefulnessPolicy.shouldEnableBackups()) {
      logger.info(`Enabling backups with ${backupRetention} day retention`);
      this.backupManager = new LatticeBackupManager(this, 'BackupManager', {
        policy: statefulnessPolicy,
        backupVaultName: `${name}-${environment}-db-backup-vault`,
        enableCrossRegionBackup: statefulnessPolicy.shouldEnableCrossRegionBackups(),
        enableComplianceReporting: environment === 'prod',
      });
    }

    // Get VPC from props or network configuration
    const vpc =
      existingVpc ||
      ec2.Vpc.fromLookup(this, 'Vpc', {
        vpcId: network.vpcId,
      });

    // Create security group for database
    this.securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      description: `Security group for ${name} database`,
      securityGroupName: `${name}-${environment}-db-sg`,
    });

    // Add ingress rules for database port
    const port = this.getDatabasePort(engine);
    this.securityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(port),
      `Allow ${engine} access from VPC`
    );

    // Create database subnet group
    const subnetGroup = new rds.SubnetGroup(this, 'SubnetGroup', {
      description: `Subnet group for ${name} database`,
      vpc,
      subnetGroupName: `${name}-${environment}-subnet-group`,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Add existing security groups if provided
    const securityGroups: ec2.ISecurityGroup[] = [this.securityGroup];
    if (network.securityGroupIds) {
      network.securityGroupIds.forEach((sgId) => {
        securityGroups.push(
          ec2.SecurityGroup.fromSecurityGroupId(this, `ExistingSG-${sgId}`, sgId)
        );
      });
    }

    // Create database credentials secret
    logger.info('Creating database credentials');
    const credentials = new secretsmanager.Secret(this, 'DatabaseCredentials', {
      secretName: `${name}-${environment}-db-credentials`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
    });

    // Create RDS instance with comprehensive backup and operations configuration
    this.database = new rds.DatabaseInstance(this, 'Database', {
      instanceIdentifier: `${name}-${environment}`,
      engine: this.getRdsEngine(engine),
      instanceType: this.getInstanceType(size, useGraviton && this.supportsGraviton(engine)),
      credentials: rds.Credentials.fromSecret(credentials),
      vpc,
      subnetGroup,
      securityGroups,
      multiAz: highAvailability,
      storageEncrypted: true,
      // CRITICAL: Use statefulness policy for backup retention
      backupRetention: Duration.days(
        Math.max(backupRetention, statefulnessPolicy.getBackupRetentionDays())
      ),
      // CRITICAL: Use statefulness policy for deletion protection
      deletionProtection: statefulnessPolicy.shouldEnableDeletionProtection(),
      enablePerformanceInsights: performanceInsights,
      monitoringInterval: monitoring ? Duration.seconds(60) : undefined,
      // CRITICAL: Use database-specific removal policy (SNAPSHOT for better recovery)
      removalPolicy: statefulnessPolicy.getDatabaseRemovalPolicy(),
      allocatedStorage: this.getStorageSize(size),
      maxAllocatedStorage: this.getMaxStorageSize(size),
      allowMajorVersionUpgrade: false,
      autoMinorVersionUpgrade: true,
      parameterGroup: this.createParameterGroup(engine),
      // Enable point-in-time recovery for production
      deleteAutomatedBackups: !statefulnessPolicy.shouldEnablePointInTimeRecovery(),
    });

    // Expose underlying constructs for escape hatch scenarios
    this.instance = this.database;

    // Add database to backup plan if backup manager exists
    if (this.backupManager) {
      this.backupManager.addResource(this.database.instanceArn, `rds-${engine}`);
    }

    // Add observability after database creation
    this.addObservability(name, engine);

    // Set output
    this.output = {
      endpoint: this.database.instanceEndpoint.hostname,
      port: this.database.instanceEndpoint.port,
      securityGroupId: this.securityGroup.securityGroupId,
    };
  }

  /**
   * Add observability (alarms and dashboards) for the database
   */
  private addObservability(databaseName: string, engine: DatabaseEngine): void {
    if (!this.observabilityManager) {
      return;
    }

    // Create observability resources using static name for alarm naming
    const observability = this.observabilityManager.addDatabaseObservability(databaseName, engine, {
      databaseName,
      engine,
      actualInstanceId: this.database.instanceIdentifier, // Pass actual instance ID for metrics
    });

    // Store alarms for external access
    this.alarms.push(...observability.alarms);
  }

  private supportsGraviton(engine: DatabaseEngine): boolean {
    return ['postgres', 'mysql', 'mariadb'].includes(engine);
  }

  private getDatabasePort(engine: DatabaseEngine): number {
    const ports = {
      postgres: 5432,
      mysql: 3306,
      mariadb: 3306,
      oracle: 1521,
      sqlserver: 1433,
    };
    return ports[engine];
  }

  private getRdsEngine(engine: DatabaseEngine): rds.IInstanceEngine {
    switch (engine) {
      case 'postgres':
        return rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15_4,
        });
      case 'mysql':
        return rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0_35,
        });
      case 'mariadb':
        return rds.DatabaseInstanceEngine.mariaDb({
          version: rds.MariaDbEngineVersion.VER_10_11_5,
        });
      case 'oracle':
        return rds.DatabaseInstanceEngine.oracleEe({
          version: rds.OracleEngineVersion.VER_19_0_0_0_2023_04_R1,
        });
      case 'sqlserver':
        return rds.DatabaseInstanceEngine.sqlServerEx({
          version: rds.SqlServerEngineVersion.VER_15_00_4236_7_V1,
        });
      default:
        throw new Error(`Unsupported database engine: ${engine}`);
    }
  }

  private getInstanceType(size: DatabaseSize, useGraviton: boolean): ec2.InstanceType {
    if (useGraviton) {
      const gravitonTypes = {
        small: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
        medium: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.SMALL),
        large: ec2.InstanceType.of(ec2.InstanceClass.M6G, ec2.InstanceSize.LARGE),
        xlarge: ec2.InstanceType.of(ec2.InstanceClass.M6G, ec2.InstanceSize.XLARGE),
      };
      return gravitonTypes[size];
    }

    const instanceTypes = {
      small: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      medium: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      large: ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE),
      xlarge: ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.XLARGE),
    };
    return instanceTypes[size];
  }

  private getStorageSize(size: DatabaseSize): number {
    const storageSizes = {
      small: 20,
      medium: 100,
      large: 500,
      xlarge: 1000,
    };
    return storageSizes[size];
  }

  private getMaxStorageSize(size: DatabaseSize): number {
    const maxStorageSizes = {
      small: 100,
      medium: 500,
      large: 2000,
      xlarge: 5000,
    };
    return maxStorageSizes[size];
  }

  private createParameterGroup(engine: DatabaseEngine): rds.IParameterGroup | undefined {
    // Create engine-specific parameter groups with optimized settings
    switch (engine) {
      case 'postgres':
        return new rds.ParameterGroup(this, 'PostgresParameterGroup', {
          engine: rds.DatabaseInstanceEngine.postgres({
            version: rds.PostgresEngineVersion.VER_15_4,
          }),
          parameters: {
            shared_preload_libraries: 'pg_stat_statements',
            log_statement: 'all',
            log_min_duration_statement: '1000',
          },
        });
      case 'mysql':
        return new rds.ParameterGroup(this, 'MySQLParameterGroup', {
          engine: rds.DatabaseInstanceEngine.mysql({
            version: rds.MysqlEngineVersion.VER_8_0_35,
          }),
          parameters: {
            slow_query_log: '1',
            long_query_time: '2',
          },
        });
      default:
        return undefined;
    }
  }

  /**
   * Get the RDS instance construct for advanced use cases
   */
  public getDatabase(): rds.DatabaseInstance {
    return this.database;
  }

  /**
   * Get the database security group
   */
  public getSecurityGroup(): ec2.SecurityGroup {
    return this.securityGroup;
  }

  /**
   * Grant connect access to a principal
   */
  public grantConnect(grantee: any): void {
    this.database.grantConnect(grantee);
  }
}
