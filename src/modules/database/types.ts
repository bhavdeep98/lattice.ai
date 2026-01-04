import { BaseResourceProps, DatabaseOutput } from '../../core/types';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

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
}

export interface LatticeDatabaseConstruct {
  readonly output: DatabaseOutput;
}