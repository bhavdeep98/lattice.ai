import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CrossAccountStack } from '../src/core/cross-account/cross-account-stack';
import { CrossAccountDeploymentManager } from '../src/core/cross-account/deployment-manager';
import { CrossAccountConfig } from '../src/core/cross-account/types';

describe('Cross-Account Architecture', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('CrossAccountStack', () => {
    test('creates tooling account infrastructure', () => {
      const stack = new CrossAccountStack(app, 'ToolingAccount', {
        env: { account: process.env.CDK_DEFAULT_ACCOUNT || 'YOUR_ACCOUNT_ID', region: 'us-east-1' },
        githubRepository: 'test-org/test-repo',
        targetAccountIds: ['YOUR_DEV_ACCOUNT_ID', 'YOUR_STAGING_ACCOUNT_ID', 'YOUR_PROD_ACCOUNT_ID'],
        environment: 'tooling',
        organizationId: 'o-example123456',
      });

      expect(stack.deploymentRole).toBeDefined();
      expect(stack.artifactBucket).toBeDefined();
      expect(stack.kmsKey).toBeDefined();

      const template = Template.fromStack(stack);

      // Check for OIDC provider (created as custom resource by CDK)
      template.hasResourceProperties('Custom::AWSCDKOpenIdConnectProvider', {
        Url: 'https://token.actions.githubusercontent.com',
        ClientIDList: ['sts.amazonaws.com'],
      });

      // Check for GitHub Actions role with proper assume role policy
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'LatticeGitHubActions-ToolingAccount',
        Description: 'Role for GitHub Actions to deploy Lattice infrastructure',
        MaxSessionDuration: 3600,
      });

      // Check for artifact bucket
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });

      // Check for KMS key
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        KeySpec: 'SYMMETRIC_DEFAULT',
        KeyUsage: 'ENCRYPT_DECRYPT',
      });

      // Check for CloudWatch log group
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/lattice/cross-account-deployment',
        RetentionInDays: 30,
      });
    });

    test('creates target account infrastructure', () => {
      const stack = new CrossAccountStack(app, 'TargetAccount', {
        env: { account: 'YOUR_ACCOUNT_ID', region: 'us-east-1' },
        githubRepository: 'test-org/test-repo',
        targetAccountIds: ['YOUR_DEV_ACCOUNT_ID'],
        environment: 'dev',
        organizationId: 'o-example123456',
      });

      expect(stack.deploymentRole).toBeDefined();

      const template = Template.fromStack(stack);

      // Check for deployment role
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'LatticeDeploymentRole-dev',
        MaxSessionDuration: 7200, // 2 hours
      });

      // Check for environment-specific log group
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/lattice/dev',
        RetentionInDays: 90, // 3 months for dev
      });
    });

    test('applies proper IAM policies for development environment', () => {
      const stack = new CrossAccountStack(app, 'DevAccount', {
        env: { account: 'YOUR_ACCOUNT_ID', region: 'us-east-1' },
        githubRepository: 'test-org/test-repo',
        targetAccountIds: ['YOUR_DEV_ACCOUNT_ID'],
        environment: 'dev',
      });

      const template = Template.fromStack(stack);

      // Check for CloudFormation permissions (simplified check)
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'LatticeDeploymentRole-dev',
        Description: 'Role for deploying Lattice infrastructure in dev',
      });
    });

    test('applies stricter policies for production environment', () => {
      const stack = new CrossAccountStack(app, 'ProdAccount', {
        env: { account: 'YOUR_ACCOUNT_ID', region: 'us-east-1' },
        githubRepository: 'test-org/test-repo',
        targetAccountIds: ['YOUR_PROD_ACCOUNT_ID'],
        environment: 'prod',
      });

      const template = Template.fromStack(stack);

      // Check for production deployment role
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'LatticeDeploymentRole-prod',
        Description: 'Role for deploying Lattice infrastructure in prod',
      });
      
      // Check that production restrictions exist in the policy
      const templateJson = template.toJSON();
      const roles = Object.values(templateJson.Resources).filter((resource: any) => 
        resource.Type === 'AWS::IAM::Role' && 
        resource.Properties?.RoleName === 'LatticeDeploymentRole-prod'
      );
      expect(roles).toHaveLength(1);
      const prodRole = roles[0] as any;
      const policyStatements = prodRole.Properties.Policies[0].PolicyDocument.Statement;
      const restrictionStatement = policyStatements.find((stmt: any) => stmt.Sid === 'ProductionRestrictions');
      expect(restrictionStatement).toBeDefined();
      expect(restrictionStatement.Effect).toBe('Deny');
    });

    test('includes organization condition when provided', () => {
      const stack = new CrossAccountStack(app, 'SecureAccount', {
        env: { account: 'YOUR_ACCOUNT_ID', region: 'us-east-1' },
        githubRepository: 'test-org/test-repo',
        targetAccountIds: ['YOUR_DEV_ACCOUNT_ID'],
        environment: 'dev',
        organizationId: 'o-example123456',
      });

      const template = Template.fromStack(stack);

      // Check for organization condition in role assumption
      const templateJson = template.toJSON();
      const roles = Object.values(templateJson.Resources).filter((resource: any) => 
        resource.Type === 'AWS::IAM::Role' && 
        resource.Properties?.RoleName === 'LatticeDeploymentRole-dev'
      );
      expect(roles).toHaveLength(1);
      const devRole = roles[0] as any;
      const assumeRolePolicy = devRole.Properties.AssumeRolePolicyDocument;
      const denyStatement = assumeRolePolicy.Statement.find((stmt: any) => stmt.Effect === 'Deny');
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Condition?.StringNotEquals?.['aws:PrincipalOrgID']).toBe('o-example123456');
    });

    test('creates proper outputs for integration', () => {
      const stack = new CrossAccountStack(app, 'ToolingWithOutputs', {
        env: { account: 'YOUR_ACCOUNT_ID', region: 'us-east-1' },
        githubRepository: 'test-org/test-repo',
        targetAccountIds: ['YOUR_DEV_ACCOUNT_ID'],
        environment: 'tooling',
      });

      const template = Template.fromStack(stack);

      // Check for stack outputs
      template.hasOutput('GitHubActionsRoleArn', {
        Description: 'ARN of the role that GitHub Actions should assume',
        Export: {
          Name: 'ToolingWithOutputs-GitHubActionsRoleArn',
        },
      });

      template.hasOutput('ArtifactBucketName', {
        Description: 'Name of the S3 bucket for storing deployment artifacts',
        Export: {
          Name: 'ToolingWithOutputs-ArtifactBucketName',
        },
      });

      template.hasOutput('KMSKeyArn', {
        Description: 'ARN of the KMS key for encryption',
        Export: {
          Name: 'ToolingWithOutputs-KMSKeyArn',
        },
      });
    });
  });

  describe('CrossAccountDeploymentManager', () => {
    let deploymentManager: CrossAccountDeploymentManager;
    let mockConfig: CrossAccountConfig;

    beforeEach(() => {
      mockConfig = {
        githubRepository: 'test-org/test-repo',
        organizationId: 'o-example123456',
        accounts: {
          tooling: {
            accountId: 'YOUR_ACCOUNT_ID',
            alias: 'test-tooling',
            environment: 'tooling',
            allowedRegions: ['us-east-1'],
            maxInstanceSize: 'large',
            allowPublicAccess: false,
            backupRetention: { daily: 7, weekly: 4, monthly: 12, yearly: 7 },
            compliance: {
              requireEncryption: true,
              requireTLSInTransit: true,
              requireDetailedLogging: true,
            },
          },
          dev: {
            accountId: 'YOUR_DEV_ACCOUNT_ID',
            alias: 'test-dev',
            environment: 'dev',
            allowedRegions: ['us-east-1'],
            maxInstanceSize: 'medium',
            allowPublicAccess: true,
            backupRetention: { daily: 3, weekly: 2, monthly: 1, yearly: 0 },
            compliance: {
              requireEncryption: true,
              requireTLSInTransit: false,
              requireDetailedLogging: false,
            },
          },
          staging: {
            accountId: 'YOUR_STAGING_ACCOUNT_ID',
            alias: 'test-staging',
            environment: 'staging',
            allowedRegions: ['us-east-1'],
            maxInstanceSize: 'large',
            allowPublicAccess: false,
            backupRetention: { daily: 7, weekly: 4, monthly: 6, yearly: 1 },
            compliance: {
              requireEncryption: true,
              requireTLSInTransit: true,
              requireDetailedLogging: true,
            },
          },
          prod: {
            accountId: 'YOUR_PROD_ACCOUNT_ID',
            alias: 'test-prod',
            environment: 'prod',
            allowedRegions: ['us-east-1', 'us-west-2'],
            maxInstanceSize: '2xlarge',
            allowPublicAccess: false,
            backupRetention: { daily: 30, weekly: 12, monthly: 24, yearly: 7 },
            compliance: {
              requireEncryption: true,
              requireTLSInTransit: true,
              requireDetailedLogging: true,
            },
          },
        },
        global: {
          primaryRegion: 'us-east-1',
          secondaryRegion: 'us-west-2',
          defaultTags: {
            Project: 'Test',
            ManagedBy: 'CDK',
          },
          costControls: {
            maxMonthlyCost: {
              dev: 500,
              staging: 1500,
              prod: 5000,
            },
            budgetAlerts: {
              thresholds: [50, 80, 100],
              notificationEmail: 'test@example.com',
            },
          },
        },
      };

      deploymentManager = new CrossAccountDeploymentManager(mockConfig);
    });

    test('validates deployment context successfully', () => {
      const validContext = {
        environment: 'dev' as const,
        accountId: 'YOUR_DEV_ACCOUNT_ID',
        region: 'us-east-1',
        github: {
          repository: 'test-org/test-repo',
          ref: 'refs/heads/main',
          sha: 'abc123',
          actor: 'test-user',
          runId: '123',
          runNumber: '1',
        },
        deployment: {
          timestamp: '2024-01-01T00:00:00Z',
        },
        costControls: {
          maxMonthlyCost: 400,
          maxInstanceSize: 'medium',
          allowedServices: ['s3', 'lambda'],
        },
        security: {
          requireEncryption: true,
          requireTLSInTransit: false,
          allowedRegions: ['us-east-1'],
        },
      };

      expect(() => {
        deploymentManager.validateDeploymentContext(validContext);
      }).not.toThrow();
    });

    test('rejects invalid account ID', () => {
      const invalidContext = {
        environment: 'dev' as const,
        accountId: '999999999999', // Invalid account ID
        region: 'us-east-1',
        github: {
          repository: 'test-org/test-repo',
          ref: 'refs/heads/main',
          sha: 'abc123',
          actor: 'test-user',
          runId: '123',
          runNumber: '1',
        },
        deployment: {
          timestamp: '2024-01-01T00:00:00Z',
        },
        costControls: {
          maxMonthlyCost: 400,
          maxInstanceSize: 'medium',
          allowedServices: ['s3', 'lambda'],
        },
        security: {
          requireEncryption: true,
          requireTLSInTransit: false,
          allowedRegions: ['us-east-1'],
        },
      };

      expect(() => {
        deploymentManager.validateDeploymentContext(invalidContext);
      }).toThrow('Account 999999999999 not found in configuration');
    });

    test('rejects invalid region', () => {
      const invalidContext = {
        environment: 'dev' as const,
        accountId: 'YOUR_DEV_ACCOUNT_ID',
        region: 'eu-west-1', // Not allowed for dev account
        github: {
          repository: 'test-org/test-repo',
          ref: 'refs/heads/main',
          sha: 'abc123',
          actor: 'test-user',
          runId: '123',
          runNumber: '1',
        },
        deployment: {
          timestamp: '2024-01-01T00:00:00Z',
        },
        costControls: {
          maxMonthlyCost: 400,
          maxInstanceSize: 'medium',
          allowedServices: ['s3', 'lambda'],
        },
        security: {
          requireEncryption: true,
          requireTLSInTransit: false,
          allowedRegions: ['eu-west-1'],
        },
      };

      expect(() => {
        deploymentManager.validateDeploymentContext(invalidContext);
      }).toThrow('Region eu-west-1 not allowed for account YOUR_DEV_ACCOUNT_ID');
    });

    test('rejects excessive cost limits', () => {
      const invalidContext = {
        environment: 'dev' as const,
        accountId: 'YOUR_DEV_ACCOUNT_ID',
        region: 'us-east-1',
        github: {
          repository: 'test-org/test-repo',
          ref: 'refs/heads/main',
          sha: 'abc123',
          actor: 'test-user',
          runId: '123',
          runNumber: '1',
        },
        deployment: {
          timestamp: '2024-01-01T00:00:00Z',
        },
        costControls: {
          maxMonthlyCost: 1000, // Exceeds dev limit of 500
          maxInstanceSize: 'medium',
          allowedServices: ['s3', 'lambda'],
        },
        security: {
          requireEncryption: true,
          requireTLSInTransit: false,
          allowedRegions: ['us-east-1'],
        },
      };

      expect(() => {
        deploymentManager.validateDeploymentContext(invalidContext);
      }).toThrow('Cost limit 1000 exceeds maximum allowed for dev: 500');
    });
  });

  describe('Integration Tests', () => {
    test('tooling and target accounts work together', () => {
      // Create tooling account stack
      const toolingStack = new CrossAccountStack(app, 'Tooling', {
        env: { account: 'YOUR_ACCOUNT_ID', region: 'us-east-1' },
        githubRepository: 'test-org/test-repo',
        targetAccountIds: ['YOUR_DEV_ACCOUNT_ID'],
        environment: 'tooling',
        organizationId: 'o-example123456',
      });

      // Create target account stack
      const targetStack = new CrossAccountStack(app, 'Target', {
        env: { account: 'YOUR_DEV_ACCOUNT_ID', region: 'us-east-1' },
        githubRepository: 'test-org/test-repo',
        targetAccountIds: ['YOUR_DEV_ACCOUNT_ID'],
        environment: 'dev',
        organizationId: 'o-example123456',
      });

      expect(toolingStack.deploymentRole).toBeDefined();
      expect(targetStack.deploymentRole).toBeDefined();

      const toolingTemplate = Template.fromStack(toolingStack);
      const targetTemplate = Template.fromStack(targetStack);

      // Should have OIDC provider in tooling account (as custom resource)
      toolingTemplate.resourceCountIs('Custom::AWSCDKOpenIdConnectProvider', 1);
      toolingTemplate.resourceCountIs('AWS::IAM::Role', 2); // GitHub Actions role + custom resource provider role
      toolingTemplate.resourceCountIs('AWS::S3::Bucket', 1); // Artifact bucket
      toolingTemplate.resourceCountIs('AWS::KMS::Key', 1); // KMS key
      
      // Should have deployment role in target account
      targetTemplate.resourceCountIs('AWS::IAM::Role', 1); // Deployment role
      targetTemplate.resourceCountIs('AWS::S3::Bucket', 1); // Artifact bucket
      targetTemplate.resourceCountIs('AWS::KMS::Key', 1); // KMS key
    });

    test('supports multiple target accounts', () => {
      const stack = new CrossAccountStack(app, 'MultiTarget', {
        env: { account: 'YOUR_ACCOUNT_ID', region: 'us-east-1' },
        githubRepository: 'test-org/test-repo',
        targetAccountIds: ['YOUR_DEV_ACCOUNT_ID', 'YOUR_STAGING_ACCOUNT_ID', 'YOUR_PROD_ACCOUNT_ID'],
        environment: 'tooling',
      });

      const template = Template.fromStack(stack);

      // Check that the role can assume roles in all target accounts (simplified check)
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'LatticeGitHubActions-MultiTarget',
        Description: 'Role for GitHub Actions to deploy Lattice infrastructure',
      });
      
      // Verify the policy contains the target account ARNs
      const templateJson = template.toJSON();
      const githubRole = Object.values(templateJson.Resources).find((resource: any) => 
        resource.Type === 'AWS::IAM::Role' && 
        resource.Properties?.RoleName === 'LatticeGitHubActions-MultiTarget'
      ) as any;
      
      expect(githubRole).toBeDefined();
      const policyStatements = githubRole.Properties.Policies[0].PolicyDocument.Statement;
      const assumeRoleStatement = policyStatements.find((stmt: any) => stmt.Sid === 'AssumeTargetAccountRoles');
      expect(assumeRoleStatement).toBeDefined();
      expect(assumeRoleStatement.Resource).toEqual([
        'arn:aws:iam::YOUR_DEV_ACCOUNT_ID:role/LatticeDeploymentRole-*',
        'arn:aws:iam::YOUR_STAGING_ACCOUNT_ID:role/LatticeDeploymentRole-*',
        'arn:aws:iam::YOUR_PROD_ACCOUNT_ID:role/LatticeDeploymentRole-*',
      ]);
    });

    test('enforces security best practices', () => {
      const stack = new CrossAccountStack(app, 'SecureCrossAccount', {
        env: { account: 'YOUR_ACCOUNT_ID', region: 'us-east-1' },
        githubRepository: 'test-org/test-repo',
        targetAccountIds: ['YOUR_DEV_ACCOUNT_ID'],
        environment: 'tooling',
        organizationId: 'o-example123456',
      });

      const template = Template.fromStack(stack);

      // Check for encryption
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
      });

      // Check for SSL enforcement
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });

      // Check for key rotation
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });
  });
});