import { BaseResourceProps, DatabaseOutput } from '../../core/types';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as sns from 'aws-cdk-lib/aws-sns';

export type DatabaseEngine = 'postgres' | 'mysql' | 'mariadb' | 'oracle' | 'sqlserver';
export type DatabaseSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface DatabaseNetworkConfig {
  vpcId: string;
  subnetIds: string[];
  securityGroupIds?: string[];
}

export interface LatticeDatabaseProps extends BaseResourceProps {
  /**
   * Optional existing VPC object. If provided, prevents Vpc.fromLookup.
   */
  vpc?: ec2.IVpc;
  engine: DatabaseEngine;
  size: DatabaseSize;
  highAvailability?: boolean;
  network: DatabaseNetworkConfig;
  backupRetention?: number;
  deletionProtection?: boolean;
  performanceInsights?: boolean;
  monitoring?: boolean;
  useGraviton?: boolean;
  // Statefulness and operations options
  forceRetain?: boolean; // Override removal policy to SNAPSHOT/RETAIN
  enableBackups?: boolean; // Enable AWS Backup integration (default: true for prod)
  backupRetentionDays?: number; // AWS Backup retention period (overrides backupRetention)
  // Observability options
  enableObservability?: boolean; // Enable monitoring and alerting (default: true)
  enableAlarms?: boolean; // Enable CloudWatch alarms (default: true)
  enableDashboards?: boolean; // Enable CloudWatch dashboards (default: true)
  notificationTopic?: sns.ITopic; // SNS topic for alarm notifications
}

export interface LatticeDatabaseConstruct {
  readonly output: DatabaseOutput;
}