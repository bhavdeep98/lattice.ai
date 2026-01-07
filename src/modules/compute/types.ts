import { BaseResourceProps, ComputeOutput } from '../../core/types';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as sns from 'aws-cdk-lib/aws-sns';

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
  // Observability options
  enableObservability?: boolean; // Enable monitoring and alerting (default: true)
  enableAlarms?: boolean; // Enable CloudWatch alarms (default: true)
  enableDashboards?: boolean; // Enable CloudWatch dashboards (default: true)
  notificationTopic?: sns.ITopic; // SNS topic for alarm notifications
}

export interface LatticeComputeConstruct {
  readonly output: ComputeOutput;
}
