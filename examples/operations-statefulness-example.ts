#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import { LatticeBucket } from '../src/modules/storage/lattice-bucket';
import { LatticeDatabase } from '../src/modules/database/lattice-database';
import { createStatefulnessPolicy } from '../src/core/statefulness';

/**
 * Example demonstrating Operations & Statefulness best practices in Lattice.
 *
 * The Problem: Naive implementations can cause data loss during stack deletion.
 * The Solution: Environment-aware removal policies and comprehensive backup strategies.
 *
 * Key Features:
 * 1. Automatic retention policies based on environment
 * 2. AWS Backup integration with compliance reporting
 * 3. Cross-region backup for production
 * 4. Point-in-time recovery for databases
 * 5. Validation to prevent unsafe configurations
 */
export class OperationsStatefulnessExampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create SNS topic for backup notifications
    const backupNotificationTopic = new sns.Topic(this, 'BackupNotifications', {
      topicName: 'lattice-backup-notifications',
      displayName: 'Lattice Backup Notifications',
    });

    // 1. DEVELOPMENT ENVIRONMENT - Optimized for speed and cost
    this.createDevelopmentResources(backupNotificationTopic);

    // 2. PRODUCTION ENVIRONMENT - Optimized for data protection and compliance
    this.createProductionResources(backupNotificationTopic);

    // 3. DEMONSTRATE STATEFULNESS POLICY VALIDATION
    this.demonstrateValidation();
  }

  private createDevelopmentResources(notificationTopic: sns.Topic): void {
    // Development S3 bucket - optimized for rapid iteration
    const devBucket = new LatticeBucket(this, 'DevBucket', {
      name: 'app-data',
      environment: 'dev',
      encryption: true,
      versioning: false, // Disabled for dev to save costs
      // Statefulness: Will use DESTROY removal policy and disable backups
    });

    // Development database - minimal backup requirements
    const devDatabase = new LatticeDatabase(this, 'DevDatabase', {
      name: 'app-db',
      environment: 'dev',
      engine: 'postgres',
      size: 'small',
      highAvailability: false, // Single AZ for dev
      network: {
        vpcId: 'vpc-dev123456',
        subnetIds: ['subnet-dev1', 'subnet-dev2'],
      },
      backupRetention: 1, // Minimal backup retention
      // Statefulness: Will use DESTROY removal policy
      // Backups disabled by default for dev environment
    });

    // Output development resource information
    new cdk.CfnOutput(this, 'DevBucketPolicy', {
      value: 'RemovalPolicy: DESTROY, AutoDeleteObjects: true, Backups: disabled',
      description: 'Development bucket configured for rapid iteration',
    });

    new cdk.CfnOutput(this, 'DevDatabasePolicy', {
      value: 'RemovalPolicy: DESTROY, DeletionProtection: false, Backups: disabled',
      description: 'Development database configured for rapid iteration',
    });
  }

  private createProductionResources(notificationTopic: sns.Topic): void {
    // Production S3 bucket - maximum data protection
    const prodBucket = new LatticeBucket(this, 'ProdBucket', {
      name: 'app-data',
      environment: 'prod',
      encryption: true,
      versioning: true, // Required for production
      enableBackups: true, // Explicit backup enablement
      backupRetentionDays: 90, // Extended retention for compliance
      cors: {
        allowedOrigins: ['https://app.example.com'],
        allowedMethods: ['GET', 'POST'],
      },
      // Statefulness: Will use RETAIN removal policy and enable comprehensive backups
    });

    // Production database - comprehensive backup and protection
    const prodDatabase = new LatticeDatabase(this, 'ProdDatabase', {
      name: 'app-db',
      environment: 'prod',
      engine: 'postgres',
      size: 'large',
      highAvailability: true, // Multi-AZ for production
      network: {
        vpcId: 'vpc-prod123456',
        subnetIds: ['subnet-prod1', 'subnet-prod2', 'subnet-prod3'],
      },
      backupRetention: 30, // Extended RDS backup retention
      enableBackups: true, // AWS Backup integration
      backupRetentionDays: 365, // 1 year retention for compliance
      performanceInsights: true,
      monitoring: true,
      // Statefulness: Will use SNAPSHOT removal policy and enable comprehensive backups
    });

    // Critical production bucket with forced retention
    const criticalBucket = new LatticeBucket(this, 'CriticalBucket', {
      name: 'critical-data',
      environment: 'prod',
      encryption: true,
      versioning: true,
      forceRetain: true, // Force RETAIN even if environment changes
      enableBackups: true,
      backupRetentionDays: 2555, // 7 years for regulatory compliance
    });

    // Output production resource information
    new cdk.CfnOutput(this, 'ProdBucketPolicy', {
      value: 'RemovalPolicy: RETAIN, AutoDeleteObjects: false, AWS Backup: enabled (90 days)',
      description: 'Production bucket with comprehensive data protection',
    });

    new cdk.CfnOutput(this, 'ProdDatabasePolicy', {
      value: 'RemovalPolicy: SNAPSHOT, DeletionProtection: true, AWS Backup: enabled (365 days)',
      description: 'Production database with comprehensive backup strategy',
    });

    new cdk.CfnOutput(this, 'CriticalBucketPolicy', {
      value: 'RemovalPolicy: RETAIN (forced), AWS Backup: enabled (7 years)',
      description: 'Critical bucket with maximum data protection',
    });
  }

  private demonstrateValidation(): void {
    // This section demonstrates the validation features that prevent unsafe configurations

    try {
      // This would throw an error: Cannot disable backups for production
      createStatefulnessPolicy({
        environment: 'prod',
        enableBackups: false, // This will cause validation to fail
      });
    } catch (error) {
      new cdk.CfnOutput(this, 'ValidationExample1', {
        value: 'PREVENTED: Disabling backups for production environment',
        description: 'Statefulness validation prevents unsafe production configurations',
      });
    }

    try {
      // This would throw an error: Backup retention too short for production
      createStatefulnessPolicy({
        environment: 'prod',
        backupRetentionDays: 3, // Less than 7 days minimum
      });
    } catch (error) {
      new cdk.CfnOutput(this, 'ValidationExample2', {
        value: 'PREVENTED: Backup retention less than 7 days for production',
        description: 'Statefulness validation enforces minimum backup retention',
      });
    }

    // Valid production configuration
    const validProdPolicy = createStatefulnessPolicy({
      environment: 'prod',
      enableBackups: true,
      backupRetentionDays: 30,
    });

    new cdk.CfnOutput(this, 'ValidProdPolicy', {
      value: `RemovalPolicy: ${validProdPolicy.getRemovalPolicy()}, Backups: ${validProdPolicy.shouldEnableBackups()}`,
      description: 'Valid production statefulness policy',
    });
  }
}

/**
 * Staging environment example - balanced approach
 */
export class StagingEnvironmentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Staging resources - balance between dev speed and prod safety
    const stagingBucket = new LatticeBucket(this, 'StagingBucket', {
      name: 'app-data',
      environment: 'staging',
      encryption: true,
      versioning: true,
      enableBackups: true, // Enable backups for staging
      backupRetentionDays: 14, // Moderate retention
    });

    const stagingDatabase = new LatticeDatabase(this, 'StagingDatabase', {
      name: 'app-db',
      environment: 'staging',
      engine: 'postgres',
      size: 'medium',
      highAvailability: false, // Single AZ for cost savings
      network: {
        vpcId: 'vpc-staging123456',
        subnetIds: ['subnet-staging1', 'subnet-staging2'],
      },
      enableBackups: true,
      backupRetentionDays: 14,
    });

    new cdk.CfnOutput(this, 'StagingPolicy', {
      value: 'RemovalPolicy: RETAIN, Backups: enabled (14 days), DeletionProtection: false',
      description: 'Staging environment balances safety and cost',
    });
  }
}

// Example usage in a real CDK app
const app = new cdk.App();

new OperationsStatefulnessExampleStack(app, 'OperationsStatefulnessExampleStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

new StagingEnvironmentStack(app, 'StagingEnvironmentStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
