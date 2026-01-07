#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { LatticeBucket } from '../src/modules/storage/lattice-bucket';
import { LatticeDatabase } from '../src/modules/database/lattice-database';
import { LatticeCompute } from '../src/modules/compute/lattice-compute';
import { LatticeObservabilityManager } from '../src/core/observability';

/**
 * Example demonstrating comprehensive observability in Lattice constructs.
 *
 * The Problem: Infrastructure without monitoring is like pipes without sensors.
 * The Solution: Automatic CloudWatch alarms and role-based dashboards.
 *
 * Key Features:
 * 1. Automatic alarm creation for all resources
 * 2. Role-based dashboards (Developer, SRE, CTO, Security)
 * 3. Environment-appropriate thresholds
 * 4. Centralized notification management
 * 5. Comprehensive metrics coverage
 */
export class ObservabilityExampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. CREATE NOTIFICATION INFRASTRUCTURE
    this.createNotificationInfrastructure();

    // 2. PRODUCTION ENVIRONMENT - Comprehensive monitoring
    this.createProductionResources();

    // 3. DEVELOPMENT ENVIRONMENT - Minimal monitoring
    this.createDevelopmentResources();

    // 4. DEMONSTRATE ROLE-BASED DASHBOARDS
    this.demonstrateRoleBasedDashboards();

    // 5. SHOW CUSTOM OBSERVABILITY CONFIGURATION
    this.demonstrateCustomObservability();
  }

  private createNotificationInfrastructure(): void {
    // Create SNS topics for different severity levels
    const criticalAlarmsTopic = new sns.Topic(this, 'CriticalAlarms', {
      topicName: 'lattice-critical-alarms',
      displayName: 'Lattice Critical Alarms',
    });

    const warningAlarmsTopic = new sns.Topic(this, 'WarningAlarms', {
      topicName: 'lattice-warning-alarms',
      displayName: 'Lattice Warning Alarms',
    });

    // Add email subscriptions (in real world, these would be actual email addresses)
    criticalAlarmsTopic.addSubscription(new subscriptions.EmailSubscription('oncall@example.com'));

    warningAlarmsTopic.addSubscription(new subscriptions.EmailSubscription('alerts@example.com'));

    // Output topic ARNs for reference
    new cdk.CfnOutput(this, 'CriticalAlarmsTopicArn', {
      value: criticalAlarmsTopic.topicArn,
      description: 'SNS topic for critical alarms',
    });

    new cdk.CfnOutput(this, 'WarningAlarmsTopicArn', {
      value: warningAlarmsTopic.topicArn,
      description: 'SNS topic for warning alarms',
    });
  }

  private createProductionResources(): void {
    // Production notification topic
    const prodNotificationTopic = new sns.Topic(this, 'ProdNotifications', {
      topicName: 'lattice-prod-notifications',
    });

    // Production S3 bucket with comprehensive monitoring
    const prodBucket = new LatticeBucket(this, 'ProdBucket', {
      name: 'app-data',
      environment: 'prod',
      encryption: true,
      versioning: true,
      // Observability enabled by default for production
      enableObservability: true,
      enableAlarms: true,
      enableDashboards: true,
      notificationTopic: prodNotificationTopic,
    });

    // Production database with comprehensive monitoring
    const prodDatabase = new LatticeDatabase(this, 'ProdDatabase', {
      name: 'app-db',
      environment: 'prod',
      engine: 'postgres',
      size: 'large',
      highAvailability: true,
      network: {
        vpcId: 'vpc-prod123456',
        subnetIds: ['subnet-prod1', 'subnet-prod2'],
      },
      // Observability configuration
      enableObservability: true,
      enableAlarms: true,
      enableDashboards: true,
      notificationTopic: prodNotificationTopic,
    });

    // Production Lambda function with monitoring
    const prodLambda = new LatticeCompute(this, 'ProdLambda', {
      name: 'api-handler',
      environment: 'prod',
      type: 'serverless',
      size: 'medium',
      network: {
        vpcId: 'vpc-prod123456',
        subnetIds: ['subnet-prod1', 'subnet-prod2'],
      },
      functionCode: `
        exports.handler = async (event) => {
          console.log('Processing request:', JSON.stringify(event));
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Success' }),
          };
        };
      `,
      runtime: 'nodejs18.x',
      // Observability configuration
      enableObservability: true,
      enableAlarms: true,
      enableDashboards: true,
      notificationTopic: prodNotificationTopic,
    });

    // Output production monitoring information
    new cdk.CfnOutput(this, 'ProdBucketAlarms', {
      value: `${prodBucket.alarms.length} alarms created`,
      description: 'Number of alarms created for production S3 bucket',
    });

    new cdk.CfnOutput(this, 'ProdDatabaseAlarms', {
      value: `${prodDatabase.alarms.length} alarms created`,
      description: 'Number of alarms created for production database',
    });

    new cdk.CfnOutput(this, 'ProdLambdaAlarms', {
      value: `${prodLambda.alarms.length} alarms created`,
      description: 'Number of alarms created for production Lambda',
    });
  }

  private createDevelopmentResources(): void {
    // Development resources with minimal monitoring
    const devBucket = new LatticeBucket(this, 'DevBucket', {
      name: 'app-data',
      environment: 'dev',
      encryption: true,
      versioning: false,
      // Observability disabled for development to save costs
      enableObservability: false,
    });

    const devDatabase = new LatticeDatabase(this, 'DevDatabase', {
      name: 'app-db',
      environment: 'dev',
      engine: 'postgres',
      size: 'small',
      network: {
        vpcId: 'vpc-dev123456',
        subnetIds: ['subnet-dev1', 'subnet-dev2'],
      },
      // Minimal observability for development
      enableObservability: true,
      enableAlarms: false, // No alarms to avoid noise
      enableDashboards: true, // Keep dashboards for debugging
    });

    // Output development monitoring information
    new cdk.CfnOutput(this, 'DevBucketAlarms', {
      value: `${devBucket.alarms.length} alarms created (expected: 0)`,
      description: 'Development bucket has no alarms to reduce noise',
    });

    new cdk.CfnOutput(this, 'DevDatabaseAlarms', {
      value: `${devDatabase.alarms.length} alarms created (expected: 0)`,
      description: 'Development database has no alarms to reduce noise',
    });
  }

  private demonstrateRoleBasedDashboards(): void {
    // Create a standalone observability manager to show role-based dashboards
    const observabilityManager = LatticeObservabilityManager.create(this, 'RoleDashboards', {
      environment: 'prod',
      enableAlarms: false, // Only create dashboards
      enableDashboards: true,
      roles: ['developer', 'sre', 'cto', 'security'],
    });

    // Add sample resources to demonstrate different dashboard views
    observabilityManager.addComputeObservability('sample-lambda', 'lambda', {
      resourceName: 'sample-function',
    });

    observabilityManager.addDatabaseObservability('sample-db', 'postgres', {
      databaseName: 'sample-database',
    });

    observabilityManager.addStorageObservability('sample-bucket', {
      bucketName: 'sample-storage',
    });

    // Output dashboard information
    const dashboards = observabilityManager.getAllDashboards();
    dashboards.forEach((dashboard, role) => {
      new cdk.CfnOutput(this, `${role}DashboardName`, {
        value: dashboard.dashboardName,
        description: `CloudWatch dashboard for ${role} role`,
      });
    });
  }

  private demonstrateCustomObservability(): void {
    // Create custom notification topic
    const customTopic = new sns.Topic(this, 'CustomNotifications', {
      topicName: 'custom-observability-notifications',
    });

    // Create resource with custom observability configuration
    const customBucket = new LatticeBucket(this, 'CustomBucket', {
      name: 'custom-monitored-bucket',
      environment: 'prod',
      encryption: true,
      // Custom observability settings
      enableObservability: true,
      enableAlarms: true,
      enableDashboards: true,
      notificationTopic: customTopic,
    });

    // Demonstrate access to individual alarms
    customBucket.alarms.forEach((alarm, index) => {
      new cdk.CfnOutput(this, `CustomBucketAlarm${index}`, {
        value: alarm.alarmName,
        description: `Custom bucket alarm ${index + 1}`,
      });
    });

    // Show how to access the observability manager for advanced configuration
    new cdk.CfnOutput(this, 'CustomObservabilityNote', {
      value: 'Custom observability configuration applied successfully',
      description: 'Demonstrates custom notification topics and alarm access',
    });
  }
}

/**
 * Staging environment example - balanced monitoring approach
 */
export class StagingObservabilityStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Staging notification topic
    const stagingTopic = new sns.Topic(this, 'StagingNotifications', {
      topicName: 'lattice-staging-notifications',
    });

    // Staging resources with balanced monitoring
    const stagingBucket = new LatticeBucket(this, 'StagingBucket', {
      name: 'app-data',
      environment: 'staging',
      encryption: true,
      versioning: true,
      // Balanced observability for staging
      enableObservability: true,
      enableAlarms: true, // Enable alarms but with relaxed thresholds
      enableDashboards: true,
      notificationTopic: stagingTopic,
    });

    const stagingDatabase = new LatticeDatabase(this, 'StagingDatabase', {
      name: 'app-db',
      environment: 'staging',
      engine: 'postgres',
      size: 'medium',
      network: {
        vpcId: 'vpc-staging123456',
        subnetIds: ['subnet-staging1', 'subnet-staging2'],
      },
      enableObservability: true,
      enableAlarms: true,
      enableDashboards: true,
      notificationTopic: stagingTopic,
    });

    // Output staging monitoring summary
    new cdk.CfnOutput(this, 'StagingMonitoringSummary', {
      value: `Bucket: ${stagingBucket.alarms.length} alarms, Database: ${stagingDatabase.alarms.length} alarms`,
      description: 'Staging environment monitoring summary',
    });
  }
}

// Example usage in a real CDK app
const app = new cdk.App();

new ObservabilityExampleStack(app, 'ObservabilityExampleStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

new StagingObservabilityStack(app, 'StagingObservabilityStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
