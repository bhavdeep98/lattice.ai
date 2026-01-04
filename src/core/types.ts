/**
 * Common types and interfaces for Lattice AWS CDK
 */

export type Environment = 'dev' | 'staging' | 'prod';

export interface LatticeAspectsConfig {
  environment: Environment;
  projectName: string;
  owner: string;
  additionalTags?: Record<string, string>;
  costLimits?: {
    maxInstanceSize?: string;
    maxStorageSize?: number;
  };
  securityConfig?: {
    enforceEncryption?: boolean;
    enforceVersioning?: boolean;
    enforceBackups?: boolean;
  };
}

export interface BaseResourceProps {
  name: string;
  environment: Environment;
  tags?: Record<string, string>;
}

export interface NetworkOutput {
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  securityGroupId: string;
}

export interface StorageOutput {
  bucketName: string;
  bucketArn: string;
}

export interface IdentityOutput {
  roleArn: string;
  roleName: string;
}

export interface DatabaseOutput {
  endpoint: string;
  port: number;
  securityGroupId: string;
}

export interface ComputeOutput {
  instanceIds?: string[];
  clusterArn?: string;
  functionArn?: string;
}