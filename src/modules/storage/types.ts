import { BaseResourceProps, StorageOutput } from '../../core/types';
import * as sns from 'aws-cdk-lib/aws-sns';

export interface LatticeBucketProps extends BaseResourceProps {
  encryption?: boolean;
  versioning?: boolean;
  publicRead?: boolean;
  cors?: {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders?: string[];
  };
  lifecycle?: {
    archiveAfterDays?: number;
    deleteAfterDays?: number;
  };
  notifications?: {
    lambdaArn?: string;
    sqsArn?: string;
    snsArn?: string;
  };
  // Statefulness and operations options
  forceRetain?: boolean; // Override removal policy to RETAIN
  enableBackups?: boolean; // Enable AWS Backup integration
  backupRetentionDays?: number; // Backup retention period
  // Observability options
  enableObservability?: boolean; // Enable monitoring and alerting (default: true)
  enableAlarms?: boolean; // Enable CloudWatch alarms (default: true)
  enableDashboards?: boolean; // Enable CloudWatch dashboards (default: true)
  notificationTopic?: sns.ITopic; // SNS topic for alarm notifications
}

export interface LatticeBucketConstruct {
  readonly output: StorageOutput;
}