#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as kms from 'aws-cdk-lib/aws-kms';
import { LatticeBucket } from '../src/modules/storage/lattice-bucket';
import { LatticeDatabase } from '../src/modules/database/lattice-database';
import { LatticeIdentity } from '../src/modules/identity/lattice-identity';

/**
 * Example demonstrating the "Escape Hatch" pattern in Lattice constructs.
 *
 * The Problem: Simple JSON Intent abstractions can be too limiting for complex real-world requirements.
 * The Solution: Every Lattice construct exposes the underlying AWS CDK construct via `public readonly instance`.
 *
 * This allows developers to "break glass" when the abstraction doesn't cover their specific needs.
 */
export class EscapeHatchExampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. SIMPLE CASE: Use Lattice's simple JSON intent
    const appBucket = new LatticeBucket(this, 'AppBucket', {
      name: 'my-app-data',
      environment: 'prod',
      encryption: true,
      versioning: true,
      cors: {
        allowedOrigins: ['https://myapp.com'],
        allowedMethods: ['GET', 'POST'],
      },
    });

    // 2. ESCAPE HATCH: Need advanced S3 configuration not covered by Lattice?
    // Access the underlying s3.Bucket directly via the `instance` property

    // Example: Configure advanced CORS with specific headers and expose headers
    appBucket.instance.addCorsRule({
      allowedOrigins: ['https://admin.myapp.com'],
      allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.DELETE],
      allowedHeaders: ['x-amz-server-side-encryption', 'x-amz-request-id'],
      exposedHeaders: ['x-amz-server-side-encryption', 'x-amz-request-id'],
      maxAge: 3600,
    });

    // Example: Add advanced lifecycle configuration
    appBucket.instance.addLifecycleRule({
      id: 'IntelligentTieringRule',
      enabled: true,
      transitions: [
        {
          storageClass: s3.StorageClass.INTELLIGENT_TIERING,
          transitionAfter: cdk.Duration.days(1),
        },
        {
          storageClass: s3.StorageClass.GLACIER_INSTANT_RETRIEVAL,
          transitionAfter: cdk.Duration.days(90),
        },
      ],
      noncurrentVersionTransitions: [
        {
          storageClass: s3.StorageClass.GLACIER,
          transitionAfter: cdk.Duration.days(30),
        },
      ],
    });

    // Example: Configure advanced bucket notifications with filters
    const processingTopic = sns.Topic.fromTopicArn(
      this,
      'ProcessingTopic',
      'arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:processing'
    );

    appBucket.instance.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3n.SnsDestination(processingTopic),
      {
        prefix: 'uploads/',
        suffix: '.jpg',
      }
    );

    // 3. DATABASE ESCAPE HATCH EXAMPLE
    const appDatabase = new LatticeDatabase(this, 'AppDatabase', {
      name: 'my-app-db',
      environment: 'prod',
      engine: 'postgres',
      size: 'large',
      highAvailability: true,
      network: {
        vpcId: 'vpc-12345678',
        subnetIds: ['subnet-12345678', 'subnet-87654321'],
      },
    });

    // Escape hatch: Configure advanced RDS features not in Lattice abstraction

    // Example: Add custom parameter group with specific PostgreSQL settings
    const customParameterGroup = new rds.ParameterGroup(this, 'CustomPostgresParams', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      parameters: {
        // Advanced PostgreSQL tuning
        shared_preload_libraries: 'pg_stat_statements,pg_hint_plan,auto_explain',
        'auto_explain.log_min_duration': '1000',
        'auto_explain.log_analyze': 'true',
        'auto_explain.log_buffers': 'true',
        log_statement: 'ddl',
        log_min_duration_statement: '5000',
        checkpoint_completion_target: '0.9',
        wal_buffers: '16MB',
        effective_cache_size: '24GB',
        random_page_cost: '1.1',
      },
    });

    // Apply the custom parameter group to the RDS instance
    // Note: This requires casting to CfnDBInstance for low-level property access
    const cfnDatabase = appDatabase.instance.node.defaultChild as rds.CfnDBInstance;
    cfnDatabase.dbParameterGroupName = customParameterGroup.ref;

    // Example: Add custom security group rules
    appDatabase.securityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.100.0/24'), // Specific admin subnet
      ec2.Port.tcp(5432),
      'Admin access from management subnet'
    );

    // Example: Configure advanced monitoring
    const enhancedMonitoringRole = new iam.Role(this, 'RDSEnhancedMonitoringRole', {
      assumedBy: new iam.ServicePrincipal('monitoring.rds.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonRDSEnhancedMonitoringRole'),
      ],
    });

    const cfnDatabase2 = appDatabase.instance.node.defaultChild as rds.CfnDBInstance;
    cfnDatabase2.monitoringRoleArn = enhancedMonitoringRole.roleArn;
    cfnDatabase2.monitoringInterval = 15; // 15-second intervals

    // 4. IDENTITY ESCAPE HATCH EXAMPLE
    const appRole = new LatticeIdentity(this, 'AppRole', {
      name: 'my-app-service',
      environment: 'prod',
      role: 'application',
      policies: ['CloudWatchLogsFullAccess'],
    });

    // Escape hatch: Add complex IAM policies not covered by Lattice

    // Example: Add condition-based policy for cross-account access
    appRole.instance.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: [appBucket.instance.arnForObjects('*')],
        conditions: {
          StringEquals: {
            's3:x-amz-server-side-encryption': 'AES256',
          },
          IpAddress: {
            'aws:SourceIp': ['203.0.113.0/24', '198.51.100.0/24'],
          },
        },
      })
    );

    // Example: Add assume role policy for cross-account access
    const crossAccountPrincipal = new iam.AccountPrincipal('123456789012');
    appRole.instance.assumeRolePolicy?.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [crossAccountPrincipal],
        actions: ['sts:AssumeRole'],
        conditions: {
          StringEquals: {
            'sts:ExternalId': 'unique-external-id-12345',
          },
        },
      })
    );

    // 5. DEMONSTRATE THE POWER: Complex real-world scenario

    // Scenario: Need S3 bucket with custom KMS key, inventory configuration, and replication
    const customKmsKey = new kms.Key(this, 'CustomS3Key', {
      description: 'Custom KMS key for S3 bucket encryption',
      enableKeyRotation: true,
    });

    // Use Lattice for basic setup, then escape hatch for advanced features
    const advancedBucket = new LatticeBucket(this, 'AdvancedBucket', {
      name: 'advanced-storage',
      environment: 'prod',
      encryption: true, // This gives us basic encryption
    });

    // Escape hatch: Override with custom KMS key
    const cfnBucket = advancedBucket.instance.node.defaultChild as s3.CfnBucket;
    cfnBucket.bucketEncryption = {
      serverSideEncryptionConfiguration: [
        {
          serverSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: customKmsKey.keyArn,
          },
        },
      ],
    };

    // Escape hatch: Add inventory configuration
    const cfnBucket2 = advancedBucket.instance.node.defaultChild as s3.CfnBucket;
    cfnBucket2.inventoryConfigurations = [
      {
        id: 'EntireBucketInventory',
        enabled: true,
        destination: {
          bucketArn: `arn:aws:s3:::inventory-reports-${this.account}`,
          format: 'CSV',
          prefix: 'inventory-reports/',
        },
        scheduleFrequency: 'Daily',
        includedObjectVersions: 'Current',
        optionalFields: ['Size', 'LastModifiedDate', 'StorageClass', 'ETag'],
      },
    ];

    // Output the escape hatch instances for reference
    new cdk.CfnOutput(this, 'BucketInstanceType', {
      value: 'Direct access via: appBucket.instance (type: s3.Bucket)',
      description: 'The underlying S3 bucket construct for advanced configuration',
    });

    new cdk.CfnOutput(this, 'DatabaseInstanceType', {
      value: 'Direct access via: appDatabase.instance (type: rds.DatabaseInstance)',
      description: 'The underlying RDS instance construct for advanced configuration',
    });

    new cdk.CfnOutput(this, 'RoleInstanceType', {
      value: 'Direct access via: appRole.instance (type: iam.Role)',
      description: 'The underlying IAM role construct for advanced configuration',
    });
  }
}

// Example usage in a real CDK app
const app = new cdk.App();
new EscapeHatchExampleStack(app, 'EscapeHatchExampleStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
