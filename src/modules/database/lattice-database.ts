import { Construct } from 'constructs';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { LatticeDatabaseProps, LatticeDatabaseConstruct, DatabaseEngine, DatabaseSize } from './types';
import { DatabaseOutput } from '../../core/types';

/**
 * LatticeDatabase - RDS abstraction with security and high availability best practices
 */
export class LatticeDatabase extends Construct implements LatticeDatabaseConstruct {
  public readonly output: DatabaseOutput;
  private readonly database: rds.DatabaseInstance;
  private readonly securityGroup: ec2.SecurityGroup;

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
    } = props;

    // Get VPC from network configuration
    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', {
      vpcId: network.vpcId,
    });

    // Create database subnet group
    const subnetGroup = new rds.SubnetGroup(this, 'SubnetGroup', {
      description: `Subnet group for ${name} database`,
      vpc,
      subnetGroupName: `${name}-${environment}-subnet-group`,
      vpcSubnets: {
        subnets: network.subnetIds.map(subnetId =>
          ec2.Subnet.fromSubnetId(this, `Subnet-${subnetId}`, subnetId)
        ),
      },
    });

    // Create security group for database
    this.securityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: `Security group for ${name} database`,
      allowAllOutbound: false,
    });

    // Add ingress rules for database port
    const port = this.getDatabasePort(engine);
    this.securityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(port),
      `Allow ${engine} access from VPC`
    );

    // Add existing security groups if provided
    const securityGroups: ec2.ISecurityGroup[] = [this.securityGroup];
    if (network.securityGroupIds) {
      network.securityGroupIds.forEach(sgId => {
        securityGroups.push(
          ec2.SecurityGroup.fromSecurityGroupId(this, `ExistingSG-${sgId}`, sgId)
        );
      });
    }

    // Create database credentials secret
    const credentials = new secretsmanager.Secret(this, 'DatabaseCredentials', {
      secretName: `${name}-${environment}-db-credentials`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
    });

    // Create RDS instance
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
      backupRetention: Duration.days(backupRetention),
      deletionProtection,
      enablePerformanceInsights: performanceInsights,
      monitoringInterval: monitoring ? Duration.seconds(60) : undefined,
      removalPolicy: environment === 'prod' ? RemovalPolicy.SNAPSHOT : RemovalPolicy.DESTROY,
      allocatedStorage: this.getStorageSize(size),
      maxAllocatedStorage: this.getMaxStorageSize(size),
      allowMajorVersionUpgrade: false,
      autoMinorVersionUpgrade: true,
      parameterGroup: this.createParameterGroup(engine),
    });

    // Set output
    this.output = {
      endpoint: this.database.instanceEndpoint.hostname,
      port: this.database.instanceEndpoint.port,
      securityGroupId: this.securityGroup.securityGroupId,
    };
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
            'shared_preload_libraries': 'pg_stat_statements',
            'log_statement': 'all',
            'log_min_duration_statement': '1000',
          },
        });
      case 'mysql':
        return new rds.ParameterGroup(this, 'MySQLParameterGroup', {
          engine: rds.DatabaseInstanceEngine.mysql({
            version: rds.MysqlEngineVersion.VER_8_0_35,
          }),
          parameters: {
            'slow_query_log': '1',
            'long_query_time': '2',
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