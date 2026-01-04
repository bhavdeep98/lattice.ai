import { BaseResourceProps, ComputeOutput } from '../../core/types';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

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
  /**
   * Optional existing VPC object. If provided, prevents Vpc.fromLookup.
   */
  vpc?: ec2.IVpc;
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