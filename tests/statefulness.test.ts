import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { RemovalPolicy } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { LatticeBucket } from '../src/modules/storage/lattice-bucket';
import { LatticeDatabase } from '../src/modules/database/lattice-database';
import { createStatefulnessPolicy, StatefulnessPolicy } from '../src/core/statefulness';

describe('Operations & Statefulness', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let mockVpc: ec2.IVpc;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' }
    });
    
    // Create a mock VPC to avoid lookup issues in tests
    mockVpc = new ec2.Vpc(stack, 'TestVpc', {
      maxAzs: 2,
      cidr: '10.0.0.0/16',
    });
  });

  describe('StatefulnessPolicy', () => {
    test('production environment enforces RETAIN removal policy', () => {
      const policy = createStatefulnessPolicy({ environment: 'prod' });
      
      expect(policy.getRemovalPolicy()).toBe(RemovalPolicy.RETAIN);
      expect(policy.getDatabaseRemovalPolicy()).toBe(RemovalPolicy.SNAPSHOT);
      expect(policy.shouldEnableDeletionProtection()).toBe(true);
      expect(policy.shouldAutoDeleteObjects()).toBe(false);
      expect(policy.shouldEnableBackups()).toBe(true);
      expect(policy.getBackupRetentionDays()).toBe(30);
    });

    test('development environment allows DESTROY removal policy', () => {
      const policy = createStatefulnessPolicy({ environment: 'dev' });
      
      expect(policy.getRemovalPolicy()).toBe(RemovalPolicy.DESTROY);
      expect(policy.getDatabaseRemovalPolicy()).toBe(RemovalPolicy.DESTROY);
      expect(policy.shouldEnableDeletionProtection()).toBe(false);
      expect(policy.shouldAutoDeleteObjects()).toBe(true);
      expect(policy.shouldEnableBackups()).toBe(false);
      expect(policy.getBackupRetentionDays()).toBe(7);
    });

    test('staging environment enforces RETAIN removal policy', () => {
      const policy = createStatefulnessPolicy({ environment: 'staging' });
      
      expect(policy.getRemovalPolicy()).toBe(RemovalPolicy.RETAIN);
      expect(policy.getDatabaseRemovalPolicy()).toBe(RemovalPolicy.SNAPSHOT);
      expect(policy.shouldEnableDeletionProtection()).toBe(false);
      expect(policy.shouldAutoDeleteObjects()).toBe(false);
      expect(policy.shouldEnableBackups()).toBe(true);
      expect(policy.getBackupRetentionDays()).toBe(14);
    });

    test('forceRetain overrides environment settings', () => {
      const policy = createStatefulnessPolicy({ 
        environment: 'dev',
        forceRetain: true 
      });
      
      expect(policy.getRemovalPolicy()).toBe(RemovalPolicy.RETAIN);
      expect(policy.getDatabaseRemovalPolicy()).toBe(RemovalPolicy.SNAPSHOT);
      expect(policy.shouldEnableDeletionProtection()).toBe(true);
      expect(policy.shouldAutoDeleteObjects()).toBe(false);
    });

    test('validates production backup requirements', () => {
      expect(() => {
        createStatefulnessPolicy({
          environment: 'prod',
          enableBackups: false,
        });
      }).toThrow('CRITICAL: Backups cannot be disabled for production environment');
    });

    test('validates production backup retention minimum', () => {
      expect(() => {
        createStatefulnessPolicy({
          environment: 'prod',
          backupRetentionDays: 3,
        });
      }).toThrow('CRITICAL: Production backup retention must be at least 7 days');
    });

    test('unknown environment defaults to safe settings', () => {
      const policy = new StatefulnessPolicy({ environment: 'unknown' as any });
      
      expect(policy.getRemovalPolicy()).toBe(RemovalPolicy.RETAIN);
      expect(policy.getDatabaseRemovalPolicy()).toBe(RemovalPolicy.SNAPSHOT);
    });
  });

  describe('LatticeBucket Statefulness', () => {
    test('production bucket uses RETAIN removal policy', () => {
      const bucket = new LatticeBucket(stack, 'ProdBucket', {
        name: 'test-bucket',
        environment: 'prod',
        encryption: true,
      });

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'test-bucket-prod',
      });

      // Check that autoDeleteObjects is not set (should be false for prod)
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Retain',
        Properties: {
          BucketName: 'test-bucket-prod',
        },
      });
    });

    test('development bucket uses DESTROY removal policy', () => {
      const bucket = new LatticeBucket(stack, 'DevBucket', {
        name: 'test-bucket',
        environment: 'dev',
        encryption: true,
      });

      const template = Template.fromStack(stack);
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        Properties: {
          BucketName: 'test-bucket-dev',
        },
      });
    });

    test('forceRetain overrides environment for bucket', () => {
      const bucket = new LatticeBucket(stack, 'ForcedBucket', {
        name: 'test-bucket',
        environment: 'dev',
        forceRetain: true,
        encryption: true,
      });

      const template = Template.fromStack(stack);
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Retain',
        Properties: {
          BucketName: 'test-bucket-dev',
        },
      });
    });
  });

  describe('LatticeDatabase Statefulness', () => {
    test('production database uses SNAPSHOT removal policy and deletion protection', () => {
      const database = new LatticeDatabase(stack, 'ProdDatabase', {
        name: 'test-db',
        environment: 'prod',
        engine: 'postgres',
        size: 'small',
        vpc: mockVpc, // Use mock VPC instead of lookup
        network: {
          vpcId: 'vpc-12345678',
          subnetIds: ['subnet-1', 'subnet-2'],
        },
      });

      const template = Template.fromStack(stack);
      template.hasResource('AWS::RDS::DBInstance', {
        DeletionPolicy: 'Snapshot',
        Properties: {
          DBInstanceIdentifier: 'test-db-prod',
          DeletionProtection: true,
        },
      });

      // Should create backup vault and plan for production
      template.resourceCountIs('AWS::Backup::BackupVault', 1);
      template.resourceCountIs('AWS::Backup::BackupPlan', 1);
    });

    test('development database uses DESTROY removal policy', () => {
      const database = new LatticeDatabase(stack, 'DevDatabase', {
        name: 'test-db',
        environment: 'dev',
        engine: 'postgres',
        size: 'small',
        vpc: mockVpc, // Use mock VPC instead of lookup
        network: {
          vpcId: 'vpc-12345678',
          subnetIds: ['subnet-1', 'subnet-2'],
        },
      });

      const template = Template.fromStack(stack);
      template.hasResource('AWS::RDS::DBInstance', {
        DeletionPolicy: 'Delete',
        Properties: {
          DBInstanceIdentifier: 'test-db-dev',
          DeletionProtection: false,
        },
      });

      // Should not create backup infrastructure for development
      template.resourceCountIs('AWS::Backup::BackupVault', 0);
      template.resourceCountIs('AWS::Backup::BackupPlan', 0);
    });

    test('database respects custom backup retention', () => {
      const database = new LatticeDatabase(stack, 'CustomBackupDatabase', {
        name: 'test-db',
        environment: 'prod',
        engine: 'postgres',
        size: 'small',
        vpc: mockVpc, // Use mock VPC instead of lookup
        network: {
          vpcId: 'vpc-12345678',
          subnetIds: ['subnet-1', 'subnet-2'],
        },
        backupRetention: 14,
        backupRetentionDays: 90, // AWS Backup retention
      });

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 90, // Should use the higher value
      });
    });

    test('staging database enables backups with moderate retention', () => {
      const database = new LatticeDatabase(stack, 'StagingDatabase', {
        name: 'test-db',
        environment: 'staging',
        engine: 'postgres',
        size: 'small',
        vpc: mockVpc, // Use mock VPC instead of lookup
        network: {
          vpcId: 'vpc-12345678',
          subnetIds: ['subnet-1', 'subnet-2'],
        },
      });

      const template = Template.fromStack(stack);
      template.hasResource('AWS::RDS::DBInstance', {
        DeletionPolicy: 'Snapshot',
        Properties: {
          DBInstanceIdentifier: 'test-db-staging',
          DeletionProtection: false, // Staging doesn't need deletion protection
        },
      });

      // Should create backup infrastructure for staging
      template.resourceCountIs('AWS::Backup::BackupVault', 1);
      template.resourceCountIs('AWS::Backup::BackupPlan', 1);
    });
  });

  describe('Backup Integration', () => {
    test('production resources are added to backup plan', () => {
      const database = new LatticeDatabase(stack, 'ProdDatabase', {
        name: 'test-db',
        environment: 'prod',
        engine: 'postgres',
        size: 'small',
        vpc: mockVpc, // Use mock VPC instead of lookup
        network: {
          vpcId: 'vpc-12345678',
          subnetIds: ['subnet-1', 'subnet-2'],
        },
      });

      const template = Template.fromStack(stack);
      
      // Should create backup selection for the database
      template.resourceCountIs('AWS::Backup::BackupSelection', 1);
      
      // Check that backup selection exists (name might be generated)
      template.hasResourceProperties('AWS::Backup::BackupSelection', {
        BackupSelection: {
          SelectionName: 'rds-postgres-selection',
        },
      });
    });

    test('backup plan includes multiple rules for production', () => {
      const database = new LatticeDatabase(stack, 'ProdDatabase', {
        name: 'test-db',
        environment: 'prod',
        engine: 'postgres',
        size: 'small',
        vpc: mockVpc, // Use mock VPC instead of lookup
        network: {
          vpcId: 'vpc-12345678',
          subnetIds: ['subnet-1', 'subnet-2'],
        },
      });

      const template = Template.fromStack(stack);
      
      // Should create backup plan with multiple rules for production
      template.hasResourceProperties('AWS::Backup::BackupPlan', {
        BackupPlan: {
          BackupPlanName: 'lattice-backup-plan-prod',
          BackupPlanRule: [
            {
              RuleName: 'DailyBackups',
              ScheduleExpression: 'cron(0 2 * * ? *)',
            },
            {
              RuleName: 'WeeklyBackups',
              ScheduleExpression: 'cron(0 3 ? * SUN *)',
            },
            {
              RuleName: 'MonthlyBackups',
              ScheduleExpression: 'cron(0 4 1 * ? *)',
            },
          ],
        },
      });
    });
  });
});