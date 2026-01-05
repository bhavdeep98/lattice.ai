import { Environment } from '../types';

/**
 * Cross-account deployment configuration
 */
export interface CrossAccountConfig {
  /**
   * GitHub repository in format "owner/repo"
   */
  githubRepository: string;
  
  /**
   * AWS Organization ID for additional security
   */
  organizationId?: string;
  
  /**
   * Account configuration for each environment
   */
  accounts: {
    tooling: AccountConfig;
    dev: AccountConfig;
    staging: AccountConfig;
    prod: AccountConfig;
    security?: AccountConfig;
    sharedServices?: AccountConfig;
  };
  
  /**
   * Global settings
   */
  global: {
    /**
     * Primary AWS region
     */
    primaryRegion: string;
    
    /**
     * Secondary AWS region for disaster recovery
     */
    secondaryRegion?: string;
    
    /**
     * Default tags applied to all resources
     */
    defaultTags: Record<string, string>;
    
    /**
     * Cost control settings
     */
    costControls: {
      /**
       * Maximum monthly cost per environment
       */
      maxMonthlyCost: {
        dev: number;
        staging: number;
        prod: number;
      };
      
      /**
       * Budget alerts
       */
      budgetAlerts: {
        thresholds: number[]; // Percentage thresholds (e.g., [50, 80, 100])
        notificationEmail: string;
      };
    };
  };
}

/**
 * Configuration for a specific AWS account
 */
export interface AccountConfig {
  /**
   * AWS Account ID
   */
  accountId: string;
  
  /**
   * Account alias for easier identification
   */
  alias: string;
  
  /**
   * Environment type
   */
  environment: Environment | 'tooling' | 'security' | 'shared-services';
  
  /**
   * AWS regions where resources can be deployed
   */
  allowedRegions: string[];
  
  /**
   * Maximum instance sizes allowed in this account
   */
  maxInstanceSize: 'nano' | 'micro' | 'small' | 'medium' | 'large' | 'xlarge' | '2xlarge';
  
  /**
   * Whether this account allows public internet access
   */
  allowPublicAccess: boolean;
  
  /**
   * Backup retention settings
   */
  backupRetention: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  
  /**
   * Compliance requirements
   */
  compliance: {
    /**
     * Whether encryption at rest is required
     */
    requireEncryption: boolean;
    
    /**
     * Whether all traffic must be encrypted in transit
     */
    requireTLSInTransit: boolean;
    
    /**
     * Whether detailed logging is required
     */
    requireDetailedLogging: boolean;
    
    /**
     * Data residency requirements
     */
    dataResidency?: string[];
  };
  
  /**
   * Network configuration
   */
  network?: {
    /**
     * VPC CIDR blocks
     */
    vpcCidrs: string[];
    
    /**
     * Whether to enable VPC Flow Logs
     */
    enableFlowLogs: boolean;
    
    /**
     * Whether to enable AWS Config
     */
    enableConfig: boolean;
  };
}

/**
 * Deployment context passed to CDK stacks
 */
export interface DeploymentContext {
  /**
   * Target environment
   */
  environment: Environment;
  
  /**
   * Target AWS account ID
   */
  accountId: string;
  
  /**
   * Target AWS region
   */
  region: string;
  
  /**
   * GitHub context
   */
  github: {
    repository: string;
    ref: string;
    sha: string;
    actor: string;
    runId: string;
    runNumber: string;
  };
  
  /**
   * Deployment metadata
   */
  deployment: {
    timestamp: string;
    version?: string;
    changesetId?: string;
  };
  
  /**
   * Cost controls for this deployment
   */
  costControls: {
    maxMonthlyCost: number;
    maxInstanceSize: string;
    allowedServices: string[];
  };
  
  /**
   * Security context
   */
  security: {
    requireEncryption: boolean;
    requireTLSInTransit: boolean;
    allowedRegions: string[];
    organizationId?: string;
  };
}

/**
 * Cross-account role assumption result
 */
export interface AssumeRoleResult {
  /**
   * Temporary AWS credentials
   */
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
    expiration: Date;
  };
  
  /**
   * Assumed role ARN
   */
  assumedRoleArn: string;
  
  /**
   * Session name
   */
  sessionName: string;
}

/**
 * Deployment artifact information
 */
export interface DeploymentArtifact {
  /**
   * Artifact type
   */
  type: 'cloudformation-template' | 'lambda-code' | 'docker-image' | 'static-assets';
  
  /**
   * S3 location of the artifact
   */
  s3Location: {
    bucket: string;
    key: string;
    version?: string;
  };
  
  /**
   * Artifact metadata
   */
  metadata: {
    size: number;
    checksum: string;
    createdAt: string;
    createdBy: string;
  };
  
  /**
   * Encryption information
   */
  encryption: {
    kmsKeyId: string;
    algorithm: string;
  };
}

/**
 * Cross-account deployment status
 */
export interface DeploymentStatus {
  /**
   * Deployment ID
   */
  deploymentId: string;
  
  /**
   * Current status
   */
  status: 'pending' | 'in-progress' | 'succeeded' | 'failed' | 'cancelled';
  
  /**
   * Target environment
   */
  environment: Environment;
  
  /**
   * Start time
   */
  startTime: string;
  
  /**
   * End time (if completed)
   */
  endTime?: string;
  
  /**
   * Error message (if failed)
   */
  error?: string;
  
  /**
   * Deployed stacks
   */
  stacks: {
    name: string;
    status: string;
    outputs?: Record<string, string>;
  }[];
  
  /**
   * Deployment artifacts
   */
  artifacts: DeploymentArtifact[];
  
  /**
   * Cost estimation
   */
  costEstimate?: {
    monthly: number;
    currency: string;
    breakdown: Record<string, number>;
  };
}

/**
 * Account bootstrap status
 */
export interface BootstrapStatus {
  /**
   * Account ID
   */
  accountId: string;
  
  /**
   * Environment
   */
  environment: Environment;
  
  /**
   * Bootstrap status
   */
  status: 'not-bootstrapped' | 'bootstrapping' | 'bootstrapped' | 'failed';
  
  /**
   * CDK Toolkit version
   */
  cdkVersion?: string;
  
  /**
   * Bootstrap stack version
   */
  bootstrapVersion?: number;
  
  /**
   * Last updated
   */
  lastUpdated?: string;
  
  /**
   * Error message (if failed)
   */
  error?: string;
}