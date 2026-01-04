import { BaseResourceProps, ComputeOutput } from '../../core/types';

export type ComputeType = 'vm' | 'container' | 'serverless';
export type ComputeSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface ComputeNetworkConfig {
  vpcId: string;
  subnetIds: string[];
  securityGroupIds?: string[];
}

export interface ComputeIdentityConfig {
  roleArn: string;
}

export interface LatticeComputeProps extends BaseResourceProps {
  type: ComputeType;
  size: ComputeSize;
  autoScaling?: boolean;
  network: ComputeNetworkConfig;
  identity?: ComputeIdentityConfig;
  userData?: string;
  containerImage?: string;
  functionCode?: string;
  runtime?: string;
}

export interface LatticeComputeConstruct {
  readonly output: ComputeOutput;
}