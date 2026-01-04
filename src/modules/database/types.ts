import { BaseResourceProps, DatabaseOutput } from '../../core/types';

export type DatabaseEngine = 'postgres' | 'mysql' | 'mariadb' | 'oracle' | 'sqlserver';
export type DatabaseSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface DatabaseNetworkConfig {
  vpcId: string;
  subnetIds: string[];
  securityGroupIds?: string[];
}

export interface LatticeDatabaseProps extends BaseResourceProps {
  engine: DatabaseEngine;
  size: DatabaseSize;
  highAvailability?: boolean;
  network: DatabaseNetworkConfig;
  backupRetention?: number;
  deletionProtection?: boolean;
  performanceInsights?: boolean;
  monitoring?: boolean;
}

export interface LatticeDatabaseConstruct {
  readonly output: DatabaseOutput;
}