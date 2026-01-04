import { BaseResourceProps, StorageOutput } from '../../core/types';

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
}

export interface LatticeBucketConstruct {
  readonly output: StorageOutput;
}