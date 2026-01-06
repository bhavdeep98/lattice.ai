import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as sns from 'aws-cdk-lib/aws-sns';
import { LatticeBucket } from '../src/modules/storage/lattice-bucket';
import { LatticeDatabase } from '../src/modules/database/lattice-database';
import { LatticeCompute } from '../src/modules/compute/lattice-compute';
import { LatticeObservabilityManager } from '../src/core/observability';

describe('Observability & Alarms', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let mockVpc: ec2.IVpc;
  let notificationTopic: sns.Topic;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' }
    });
    
    // Create a mock VPC to avoid lookup issues in tests
    mockVpc = new ec2.Vpc(stack, 'TestVpc', {
      maxAzs: 2,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
    });

    // Create notification topic
    notificationTopic = new sns.Topic(stack, 'TestTopic', {
      topicName: 'test-notifications',
    });
  });

  describe('LatticeObservabilityManager', () => {
    test('creates observability manager with default configuration', () => {
      const observabilityManager = LatticeObservabilityManager.create(stack, 'TestObservability', {
        environment: 'prod',
      });

      expect(observabilityManager).toBeDefined();
      expect(observabilityManager.alarmManager).toBeDefined();
      expect(observabilityManager.dashboardManager).toBeDefined();
    });

    test('creates notification topic when not provided', () => {
      const observabilityManager = LatticeObservabilityManager.create(stack, 'TestObservability', {
        environment: 'prod',
      });

      const template = Template.fromStack(stack);
      // Should create exactly 1 notification topic (the test setup already creates 1)
      template.resourceCountIs('AWS::SNS::Topic', 2); // 1 from test setup + 1 from observability
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Lattice Observability Notifications',
      });
    });

    test('creates role-based dashboards', () => {
      const observabilityManager = LatticeObservabilityManager.create(stack, 'TestObservability', {
        environment: 'prod',
        roles: ['developer', 'sre', 'cto'],
      });

      const dashboards = observabilityManager.getAllDashboards();
      expect(dashboards.size).toBe(3);
      expect(dashboards.has('developer')).toBe(true);
      expect(dashboards.has('sre')).toBe(true);
      expect(dashboards.has('cto')).toBe(true);
    });
  });

  describe('LatticeBucket Observability', () => {
    test('production bucket creates alarms automatically', () => {
      const bucket = new LatticeBucket(stack, 'ProdBucket', {
        name: 'test-bucket',
        environment: 'prod',
        encryption: true,
        enableObservability: true,
        notificationTopic,
      });

      // Should create alarms
      expect(bucket.alarms.length).toBeGreaterThan(0);

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::CloudWatch::Alarm', bucket.alarms.length);
      
      // Check for S3-specific alarms
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'Lattice-prod-test-bucket-prod-HighRequestRate',
        MetricName: 'AllRequests',
        Namespace: 'AWS/S3',
      });
    });

    test('development bucket can disable observability', () => {
      const bucket = new LatticeBucket(stack, 'DevBucket', {
        name: 'test-bucket',
        environment: 'dev',
        encryption: true,
        enableObservability: false,
      });

      // Should not create alarms
      expect(bucket.alarms.length).toBe(0);

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 0);
    });

    test('bucket alarms use environment-appropriate thresholds', () => {
      const prodBucket = new LatticeBucket(stack, 'ProdBucket', {
        name: 'prod-bucket',
        environment: 'prod',
        encryption: true,
        enableObservability: true,
        notificationTopic,
      });

      const devBucket = new LatticeBucket(stack, 'DevBucket', {
        name: 'dev-bucket',
        environment: 'dev',
        encryption: true,
        enableObservability: true,
        notificationTopic,
      });

      // Production should have stricter thresholds
      expect(prodBucket.alarms.length).toBeGreaterThan(0);
      // Development environment disables alarms by default, but we explicitly enabled them
      expect(devBucket.alarms.length).toBeGreaterThan(0);

      const template = Template.fromStack(stack);
      
      // Check that production has lower threshold (more sensitive)
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'Lattice-prod-prod-bucket-prod-HighRequestRate',
        Threshold: 1000, // Production threshold
      });
    });
  });

  describe('LatticeDatabase Observability', () => {
    test('production database creates comprehensive alarms', () => {
      const database = new LatticeDatabase(stack, 'ProdDatabase', {
        name: 'test-db',
        environment: 'prod',
        engine: 'postgres',
        size: 'large',
        vpc: mockVpc,
        network: {
          vpcId: 'vpc-12345678',
          subnetIds: ['subnet-1', 'subnet-2'],
        },
        enableObservability: true,
        notificationTopic,
      });

      // Should create multiple database-specific alarms
      expect(database.alarms.length).toBeGreaterThan(0);

      const template = Template.fromStack(stack);
      
      // Check for RDS-specific alarms
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/RDS',
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'FreeableMemory',
        Namespace: 'AWS/RDS',
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'DatabaseConnections',
        Namespace: 'AWS/RDS',
      });
    });

    test('database alarms include critical and warning severities', () => {
      const database = new LatticeDatabase(stack, 'TestDatabase', {
        name: 'test-db',
        environment: 'prod',
        engine: 'postgres',
        size: 'medium',
        vpc: mockVpc,
        network: {
          vpcId: 'vpc-12345678',
          subnetIds: ['subnet-1', 'subnet-2'],
        },
        enableObservability: true,
        notificationTopic,
      });

      const template = Template.fromStack(stack);
      
      // Critical alarm (low memory)
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'FreeableMemory',
        ComparisonOperator: 'LessThanThreshold',
        EvaluationPeriods: 1, // Critical alarms should trigger faster
      });

      // Warning alarm (high CPU)
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2, // Warning alarms can be less sensitive
      });
    });
  });

  describe('LatticeCompute Observability', () => {
    test('Lambda function creates appropriate alarms', () => {
      const lambda = new LatticeCompute(stack, 'TestLambda', {
        name: 'test-function',
        environment: 'prod',
        type: 'serverless',
        size: 'medium',
        network: {
          vpcId: 'vpc-12345678',
          subnetIds: ['subnet-1', 'subnet-2'],
        },
        enableObservability: true,
        notificationTopic,
      });

      expect(lambda.alarms.length).toBeGreaterThan(0);

      const template = Template.fromStack(stack);
      
      // Lambda-specific alarms
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Duration',
        Namespace: 'AWS/Lambda',
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Throttles',
        Namespace: 'AWS/Lambda',
      });
    });

    test('EC2 instance creates system-level alarms', () => {
      const ec2Instance = new LatticeCompute(stack, 'TestEC2', {
        name: 'test-instance',
        environment: 'prod',
        type: 'vm',
        size: 'medium',
        vpc: mockVpc,
        network: {
          vpcId: 'vpc-12345678',
          subnetIds: ['subnet-1', 'subnet-2'],
        },
        enableObservability: true,
        notificationTopic,
      });

      expect(ec2Instance.alarms.length).toBeGreaterThan(0);

      const template = Template.fromStack(stack);
      
      // EC2-specific alarms
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'StatusCheckFailed',
        Namespace: 'AWS/EC2',
      });
    });

    test('ECS service creates container-specific alarms', () => {
      const ecsService = new LatticeCompute(stack, 'TestECS', {
        name: 'test-service',
        environment: 'prod',
        type: 'container',
        size: 'large',
        vpc: mockVpc,
        network: {
          vpcId: 'vpc-12345678',
          subnetIds: ['subnet-1', 'subnet-2'],
        },
        containerImage: 'nginx:latest',
        enableObservability: true,
        notificationTopic,
      });

      expect(ecsService.alarms.length).toBeGreaterThan(0);

      const template = Template.fromStack(stack);
      
      // ECS-specific alarms
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/ECS',
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'RunningTaskCount',
        Namespace: 'AWS/ECS',
      });
    });
  });

  describe('Environment-Based Alarm Configuration', () => {
    test('production environment has stricter alarm thresholds', () => {
      const prodBucket = new LatticeBucket(stack, 'ProdBucket', {
        name: 'test-bucket',
        environment: 'prod',
        encryption: true,
        enableObservability: true,
        notificationTopic,
      });

      const template = Template.fromStack(stack);
      
      // Production should have lower thresholds (more sensitive)
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Threshold: 1000, // Production S3 request threshold
        EvaluationPeriods: 2, // Faster detection
      });
    });

    test('development environment has relaxed alarm thresholds', () => {
      const devBucket = new LatticeBucket(stack, 'DevBucket', {
        name: 'test-bucket',
        environment: 'dev',
        encryption: true,
        enableObservability: true, // Explicitly enable for dev to test thresholds
        notificationTopic,
      });

      const template = Template.fromStack(stack);
      
      // Development should have higher thresholds (less sensitive)
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Threshold: 2000, // Development S3 request threshold
        EvaluationPeriods: 5, // Slower detection to reduce noise
      });
    });

    test('staging environment balances sensitivity and noise', () => {
      const stagingBucket = new LatticeBucket(stack, 'StagingBucket', {
        name: 'test-bucket',
        environment: 'staging',
        encryption: true,
        enableObservability: true,
        notificationTopic,
      });

      const template = Template.fromStack(stack);
      
      // Staging should have moderate settings
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        EvaluationPeriods: 3, // Balanced detection speed
        DatapointsToAlarm: 2, // Moderate sensitivity
      });
    });
  });

  describe('Dashboard Creation', () => {
    test('creates role-specific dashboards', () => {
      const observabilityManager = LatticeObservabilityManager.create(stack, 'TestObservability', {
        environment: 'prod',
        roles: ['developer', 'sre', 'cto'],
      });

      // Add a resource to trigger dashboard creation
      observabilityManager.addComputeObservability('test-lambda', 'lambda');

      const template = Template.fromStack(stack);
      
      // Should create dashboards for each role
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 3);
      
      // Check that dashboard names start with the expected prefix (allowing for timestamp suffix)
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('Lattice-prod-Developer-\\d+'),
      });

      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('Lattice-prod-Sre-\\d+'),
      });

      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('Lattice-prod-Cto-\\d+'),
      });
    });

    test('dashboards can be disabled while keeping alarms', () => {
      const bucket = new LatticeBucket(stack, 'TestBucket', {
        name: 'test-bucket',
        environment: 'prod',
        encryption: true,
        enableObservability: true,
        enableAlarms: true,
        enableDashboards: false,
        notificationTopic,
      });

      expect(bucket.alarms.length).toBeGreaterThan(0);

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::CloudWatch::Alarm', bucket.alarms.length);
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 0);
    });
  });

  describe('Notification Integration', () => {
    test('alarms are connected to notification topics', () => {
      const bucket = new LatticeBucket(stack, 'TestBucket', {
        name: 'test-bucket',
        environment: 'prod',
        encryption: true,
        enableObservability: true,
        notificationTopic,
      });

      const template = Template.fromStack(stack);
      
      // Alarms should have SNS actions
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmActions: [{ Ref: 'TestTopic339EC197' }], // SNS topic reference
        OKActions: [{ Ref: 'TestTopic339EC197' }],
      });
    });

    test('creates default notification topic when none provided', () => {
      const bucket = new LatticeBucket(stack, 'TestBucket', {
        name: 'test-bucket',
        environment: 'prod',
        encryption: true,
        enableObservability: true,
        // No notification topic provided
      });

      const template = Template.fromStack(stack);
      
      // Should create a default notification topic
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Lattice Observability Notifications',
      });
    });
  });
});