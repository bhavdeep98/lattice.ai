import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { LatticeBucket } from '../src/modules/storage/lattice-bucket';
import { LatticeIdentity } from '../src/modules/identity/lattice-identity';

describe('Escape Hatch Pattern', () => {
  let app: cdk.App;
  let stack: cdk.Stack;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
  });

  test('LatticeBucket exposes underlying s3.Bucket via instance property', () => {
    // Create Lattice bucket
    const latticeBucket = new LatticeBucket(stack, 'TestBucket', {
      name: 'test-bucket',
      environment: 'dev',
      encryption: true,
    });

    // Verify escape hatch exists and is correct type
    expect(latticeBucket.instance).toBeDefined();
    expect(latticeBucket.instance).toBeInstanceOf(s3.Bucket);

    // Verify we can use escape hatch for advanced configuration
    latticeBucket.instance.addCorsRule({
      allowedOrigins: ['https://example.com'],
      allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST],
      allowedHeaders: ['x-custom-header'],
      exposedHeaders: ['x-amz-request-id'],
      maxAge: 3600,
    });

    // Verify the CORS rule was added to the CloudFormation template
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      CorsConfiguration: {
        CorsRules: [
          {
            AllowedOrigins: ['https://example.com'],
            AllowedMethods: ['GET', 'POST'],
            AllowedHeaders: ['x-custom-header'],
            ExposedHeaders: ['x-amz-request-id'],
            MaxAge: 3600,
          },
        ],
      },
    });
  });

  test('LatticeIdentity exposes underlying iam.Role via instance property', () => {
    // Create Lattice identity
    const latticeIdentity = new LatticeIdentity(stack, 'TestRole', {
      name: 'test-role',
      environment: 'dev',
      role: 'application',
    });

    // Verify escape hatch exists and is correct type
    expect(latticeIdentity.instance).toBeDefined();
    expect(latticeIdentity.instance).toBeInstanceOf(iam.Role);

    // Verify we can use escape hatch for advanced IAM policies
    latticeIdentity.instance.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject'],
      resources: ['arn:aws:s3:::example-bucket/*'],
      conditions: {
        'StringEquals': {
          's3:x-amz-server-side-encryption': 'AES256',
        },
      },
    }));

    // Verify the role was created and we can access its properties
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'test-role-dev-role',
      Description: 'Lattice application role for test-role in dev',
    });
    
    // Verify that a policy was created (the exact content may vary due to merging)
    template.resourceCountIs('AWS::IAM::Policy', 1);
  });

  test('Escape hatch allows breaking glass when abstraction is insufficient', () => {
    // Scenario: Need S3 bucket with intelligent tiering that Lattice doesn't support
    const latticeBucket = new LatticeBucket(stack, 'IntelligentBucket', {
      name: 'intelligent-bucket',
      environment: 'prod',
      encryption: true,
    });

    // Use escape hatch to add intelligent tiering lifecycle rule
    latticeBucket.instance.addLifecycleRule({
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
    });

    // Verify the lifecycle rule was added
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      LifecycleConfiguration: {
        Rules: [
          {
            Id: 'IntelligentTieringRule',
            Status: 'Enabled',
            Transitions: [
              {
                StorageClass: 'INTELLIGENT_TIERING',
                TransitionInDays: 1,
              },
              {
                StorageClass: 'GLACIER_IR',
                TransitionInDays: 90,
              },
            ],
          },
        ],
      },
    });
  });

  test('Lattice abstraction and escape hatch work together seamlessly', () => {
    // Use Lattice for basic setup
    const bucket = new LatticeBucket(stack, 'HybridBucket', {
      name: 'hybrid-bucket',
      environment: 'prod',
      encryption: true,
      versioning: true,
      cors: {
        allowedOrigins: ['https://app.example.com'],
        allowedMethods: ['GET'],
      },
    });

    // Use escape hatch for advanced features
    bucket.instance.addCorsRule({
      allowedOrigins: ['https://admin.example.com'],
      allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.DELETE],
      allowedHeaders: ['authorization', 'content-type'],
    });

    // Verify both Lattice and escape hatch configurations are present
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      // Lattice configuration
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
      VersioningConfiguration: {
        Status: 'Enabled',
      },
      // Both CORS rules (Lattice + escape hatch)
      CorsConfiguration: {
        CorsRules: [
          {
            AllowedOrigins: ['https://app.example.com'],
            AllowedMethods: ['GET'],
          },
          {
            AllowedOrigins: ['https://admin.example.com'],
            AllowedMethods: ['PUT', 'DELETE'],
            AllowedHeaders: ['authorization', 'content-type'],
          },
        ],
      },
    });
  });
});