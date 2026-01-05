import { Construct } from 'constructs';
import { Stack, StackProps, Duration, CfnOutput } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface CrossAccountStackProps extends StackProps {
  /**
   * The GitHub repository in format "owner/repo"
   */
  githubRepository: string;
  
  /**
   * List of target AWS account IDs that this tooling account can deploy to
   */
  targetAccountIds: string[];
  
  /**
   * The environment this stack is for (tooling, dev, staging, prod)
   */
  environment: 'tooling' | 'dev' | 'staging' | 'prod';
  
  /**
   * Organization ID for additional security
   */
  organizationId?: string;
  
  /**
   * Additional conditions for role assumption
   */
  additionalConditions?: Record<string, any>;
}

/**
 * Cross-Account Deployment Stack
 * 
 * This stack sets up the necessary infrastructure for secure cross-account
 * deployments using GitHub Actions OIDC and role assumption chains.
 */
export class CrossAccountStack extends Stack {
  public readonly artifactBucket: s3.Bucket;
  public readonly kmsKey: kms.Key;
  
  private deploymentRoleInternal?: iam.Role;
  
  constructor(scope: Construct, id: string, props: CrossAccountStackProps) {
    super(scope, id, props);
    
    const { githubRepository, targetAccountIds, environment, organizationId } = props;
    
    // Create KMS key for encryption
    this.kmsKey = this.createKmsKey(environment);
    
    // Create artifact bucket for storing deployment artifacts
    this.artifactBucket = this.createArtifactBucket(environment);
    
    if (environment === 'tooling') {
      // Tooling account setup
      this.setupToolingAccount(githubRepository, targetAccountIds, organizationId);
    } else {
      // Target account setup (dev, staging, prod)
      this.setupTargetAccount(environment, organizationId);
    }
  }
  
  public get deploymentRole(): iam.Role | undefined {
    return this.deploymentRoleInternal;
  }
  
  /**
   * Create KMS key for encryption
   */
  private createKmsKey(environment: string): kms.Key {
    return new kms.Key(this, 'CrossAccountKey', {
      alias: `lattice-cross-account-${environment}`,
      description: `KMS key for Lattice cross-account deployments in ${environment}`,
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      policy: new iam.PolicyDocument({
        statements: [
          // Allow root account to manage the key
          new iam.PolicyStatement({
            sid: 'EnableRootAccess',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          // Allow cross-account access for deployment
          new iam.PolicyStatement({
            sid: 'AllowCrossAccountAccess',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
            actions: [
              'kms:Decrypt',
              'kms:GenerateDataKey',
              'kms:ReEncrypt*',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });
  }
  
  /**
   * Create artifact bucket for storing deployment artifacts
   */
  private createArtifactBucket(environment: string): s3.Bucket {
    return new s3.Bucket(this, 'ArtifactBucket', {
      bucketName: `lattice-artifacts-${environment}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: Duration.days(30),
        },
        {
          id: 'DeleteIncompleteUploads',
          enabled: true,
          abortIncompleteMultipartUploadAfter: Duration.days(1),
        },
      ],
      serverAccessLogsPrefix: 'access-logs/',
    });
  }
  
  /**
   * Setup tooling account infrastructure
   */
  private setupToolingAccount(
    githubRepository: string,
    targetAccountIds: string[],
    organizationId?: string
  ): void {
    // Create OIDC provider for GitHub Actions
    const oidcProvider = new iam.OpenIdConnectProvider(this, 'GitHubOIDCProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
      thumbprints: [
        '6938fd4d98bab03faadb97b34396831e3780aea1', // GitHub's thumbprint
        '1c58a3a8518e8759bf075b76b750d4f2df264fcd', // Backup thumbprint
      ],
    });
    
    // Create deployment role that GitHub Actions can assume
    this.deploymentRoleInternal = new iam.Role(this, 'GitHubActionsRole', {
      roleName: `LatticeGitHubActions-${this.stackName}`,
      description: 'Role for GitHub Actions to deploy Lattice infrastructure',
      assumedBy: new iam.WebIdentityPrincipal(
        oidcProvider.openIdConnectProviderArn,
        {
          StringEquals: {
            'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          },
          StringLike: {
            'token.actions.githubusercontent.com:sub': [
              `repo:${githubRepository}:ref:refs/heads/main`,
              `repo:${githubRepository}:ref:refs/heads/develop`,
              `repo:${githubRepository}:pull_request`,
            ],
          },
        }
      ),
      maxSessionDuration: Duration.hours(1),
      inlinePolicies: {
        CrossAccountDeployment: new iam.PolicyDocument({
          statements: [
            // Allow assuming roles in target accounts
            new iam.PolicyStatement({
              sid: 'AssumeTargetAccountRoles',
              effect: iam.Effect.ALLOW,
              actions: ['sts:AssumeRole'],
              resources: targetAccountIds.map(
                accountId => `arn:aws:iam::${accountId}:role/LatticeDeploymentRole-*`
              ),
              conditions: organizationId ? {
                StringEquals: {
                  'aws:PrincipalOrgID': organizationId,
                },
              } : undefined,
            }),
            // Access to artifact bucket
            new iam.PolicyStatement({
              sid: 'ArtifactBucketAccess',
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              resources: [
                this.artifactBucket.bucketArn,
                `${this.artifactBucket.bucketArn}/*`,
              ],
            }),
            // KMS access for artifact encryption
            new iam.PolicyStatement({
              sid: 'KMSAccess',
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:GenerateDataKey',
                'kms:ReEncrypt*',
                'kms:DescribeKey',
              ],
              resources: [this.kmsKey.keyArn],
            }),
            // CloudFormation access for CDK deployments
            new iam.PolicyStatement({
              sid: 'CloudFormationAccess',
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudformation:DescribeStacks',
                'cloudformation:DescribeStackEvents',
                'cloudformation:DescribeStackResources',
                'cloudformation:GetTemplate',
              ],
              resources: ['*'],
            }),
            // SSM access for parameter store
            new iam.PolicyStatement({
              sid: 'SSMAccess',
              effect: iam.Effect.ALLOW,
              actions: [
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:GetParametersByPath',
              ],
              resources: [
                `arn:aws:ssm:*:${this.account}:parameter/lattice/*`,
              ],
            }),
          ],
        }),
      },
    });
    
    // Create CloudWatch log group for deployment logs
    new logs.LogGroup(this, 'DeploymentLogs', {
      logGroupName: `/aws/lattice/cross-account-deployment`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: this.kmsKey,
    });
    
    // Output important values
    new CfnOutput(this, 'GitHubActionsRoleArn', {
      value: this.deploymentRoleInternal!.roleArn,
      description: 'ARN of the role that GitHub Actions should assume',
      exportName: `${this.stackName}-GitHubActionsRoleArn`,
    });
    
    new CfnOutput(this, 'ArtifactBucketName', {
      value: this.artifactBucket.bucketName,
      description: 'Name of the S3 bucket for storing deployment artifacts',
      exportName: `${this.stackName}-ArtifactBucketName`,
    });
    
    new CfnOutput(this, 'KMSKeyArn', {
      value: this.kmsKey.keyArn,
      description: 'ARN of the KMS key for encryption',
      exportName: `${this.stackName}-KMSKeyArn`,
    });
  }
  
  /**
   * Setup target account infrastructure (dev, staging, prod)
   */
  private setupTargetAccount(environment: string, organizationId?: string): void {
    // Create deployment role that can be assumed from tooling account
    this.deploymentRoleInternal = new iam.Role(this, 'DeploymentRole', {
      roleName: `LatticeDeploymentRole-${environment}`,
      description: `Role for deploying Lattice infrastructure in ${environment}`,
      assumedBy: new iam.CompositePrincipal(
        // Allow assumption from tooling account
        new iam.AccountPrincipal(this.account), // This would be the tooling account ID in practice
      ),
      maxSessionDuration: Duration.hours(2),
      inlinePolicies: {
        DeploymentPolicy: this.createDeploymentPolicy(environment),
      },
    });
    
    // Add organization condition if provided
    if (organizationId) {
      this.deploymentRoleInternal!.assumeRolePolicy?.addStatements(
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          principals: [new iam.AnyPrincipal()],
          actions: ['sts:AssumeRole'],
          conditions: {
            StringNotEquals: {
              'aws:PrincipalOrgID': organizationId,
            },
          },
        })
      );
    }
    
    // Create CloudWatch log group for this environment
    new logs.LogGroup(this, 'EnvironmentLogs', {
      logGroupName: `/aws/lattice/${environment}`,
      retention: environment === 'prod' 
        ? logs.RetentionDays.ONE_YEAR 
        : logs.RetentionDays.THREE_MONTHS,
      encryptionKey: this.kmsKey,
    });
    
    // Output the deployment role ARN
    new CfnOutput(this, 'DeploymentRoleArn', {
      value: this.deploymentRoleInternal!.roleArn,
      description: `ARN of the deployment role for ${environment}`,
      exportName: `${this.stackName}-DeploymentRoleArn`,
    });
  }
  
  /**
   * Create deployment policy based on environment
   */
  private createDeploymentPolicy(environment: string): iam.PolicyDocument {
    const basePermissions = [
      // CloudFormation permissions
      new iam.PolicyStatement({
        sid: 'CloudFormationAccess',
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudformation:CreateStack',
          'cloudformation:UpdateStack',
          'cloudformation:DeleteStack',
          'cloudformation:DescribeStacks',
          'cloudformation:DescribeStackEvents',
          'cloudformation:DescribeStackResources',
          'cloudformation:GetTemplate',
          'cloudformation:ValidateTemplate',
          'cloudformation:CreateChangeSet',
          'cloudformation:DescribeChangeSet',
          'cloudformation:ExecuteChangeSet',
          'cloudformation:DeleteChangeSet',
        ],
        resources: [
          `arn:aws:cloudformation:*:${this.account}:stack/lattice-*/*`,
          `arn:aws:cloudformation:*:${this.account}:stack/CDKToolkit/*`,
        ],
      }),
      
      // IAM permissions (limited)
      new iam.PolicyStatement({
        sid: 'IAMAccess',
        effect: iam.Effect.ALLOW,
        actions: [
          'iam:CreateRole',
          'iam:UpdateRole',
          'iam:DeleteRole',
          'iam:GetRole',
          'iam:PassRole',
          'iam:AttachRolePolicy',
          'iam:DetachRolePolicy',
          'iam:PutRolePolicy',
          'iam:DeleteRolePolicy',
          'iam:GetRolePolicy',
          'iam:CreateInstanceProfile',
          'iam:DeleteInstanceProfile',
          'iam:AddRoleToInstanceProfile',
          'iam:RemoveRoleFromInstanceProfile',
        ],
        resources: [
          `arn:aws:iam::${this.account}:role/lattice-*`,
          `arn:aws:iam::${this.account}:instance-profile/lattice-*`,
        ],
      }),
      
      // S3 permissions
      new iam.PolicyStatement({
        sid: 'S3Access',
        effect: iam.Effect.ALLOW,
        actions: [
          's3:CreateBucket',
          's3:DeleteBucket',
          's3:GetBucketLocation',
          's3:GetBucketPolicy',
          's3:PutBucketPolicy',
          's3:DeleteBucketPolicy',
          's3:GetBucketVersioning',
          's3:PutBucketVersioning',
          's3:GetBucketEncryption',
          's3:PutBucketEncryption',
          's3:GetBucketPublicAccessBlock',
          's3:PutBucketPublicAccessBlock',
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:ListBucket',
        ],
        resources: [
          `arn:aws:s3:::lattice-*`,
          `arn:aws:s3:::lattice-*/*`,
          `arn:aws:s3:::cdk-*`,
          `arn:aws:s3:::cdk-*/*`,
        ],
      }),
      
      // Lambda permissions
      new iam.PolicyStatement({
        sid: 'LambdaAccess',
        effect: iam.Effect.ALLOW,
        actions: [
          'lambda:CreateFunction',
          'lambda:UpdateFunctionCode',
          'lambda:UpdateFunctionConfiguration',
          'lambda:DeleteFunction',
          'lambda:GetFunction',
          'lambda:InvokeFunction',
          'lambda:AddPermission',
          'lambda:RemovePermission',
          'lambda:CreateEventSourceMapping',
          'lambda:DeleteEventSourceMapping',
          'lambda:UpdateEventSourceMapping',
        ],
        resources: [
          `arn:aws:lambda:*:${this.account}:function:lattice-*`,
        ],
      }),
      
      // EC2 permissions
      new iam.PolicyStatement({
        sid: 'EC2Access',
        effect: iam.Effect.ALLOW,
        actions: [
          'ec2:CreateVpc',
          'ec2:DeleteVpc',
          'ec2:DescribeVpcs',
          'ec2:CreateSubnet',
          'ec2:DeleteSubnet',
          'ec2:DescribeSubnets',
          'ec2:CreateSecurityGroup',
          'ec2:DeleteSecurityGroup',
          'ec2:DescribeSecurityGroups',
          'ec2:AuthorizeSecurityGroupIngress',
          'ec2:AuthorizeSecurityGroupEgress',
          'ec2:RevokeSecurityGroupIngress',
          'ec2:RevokeSecurityGroupEgress',
          'ec2:CreateTags',
          'ec2:DescribeTags',
        ],
        resources: ['*'],
      }),
      
      // RDS permissions
      new iam.PolicyStatement({
        sid: 'RDSAccess',
        effect: iam.Effect.ALLOW,
        actions: [
          'rds:CreateDBInstance',
          'rds:DeleteDBInstance',
          'rds:DescribeDBInstances',
          'rds:ModifyDBInstance',
          'rds:CreateDBSubnetGroup',
          'rds:DeleteDBSubnetGroup',
          'rds:DescribeDBSubnetGroups',
          'rds:AddTagsToResource',
          'rds:ListTagsForResource',
        ],
        resources: [
          `arn:aws:rds:*:${this.account}:db:lattice-*`,
          `arn:aws:rds:*:${this.account}:subgrp:lattice-*`,
        ],
      }),
      
      // CloudWatch permissions
      new iam.PolicyStatement({
        sid: 'CloudWatchAccess',
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudwatch:PutMetricAlarm',
          'cloudwatch:DeleteAlarms',
          'cloudwatch:DescribeAlarms',
          'cloudwatch:PutDashboard',
          'cloudwatch:DeleteDashboards',
          'cloudwatch:GetDashboard',
          'cloudwatch:ListDashboards',
          'logs:CreateLogGroup',
          'logs:DeleteLogGroup',
          'logs:DescribeLogGroups',
          'logs:PutRetentionPolicy',
        ],
        resources: ['*'],
      }),
      
      // KMS permissions
      new iam.PolicyStatement({
        sid: 'KMSAccess',
        effect: iam.Effect.ALLOW,
        actions: [
          'kms:CreateKey',
          'kms:DeleteKey',
          'kms:DescribeKey',
          'kms:GetKeyPolicy',
          'kms:PutKeyPolicy',
          'kms:CreateAlias',
          'kms:DeleteAlias',
          'kms:UpdateAlias',
          'kms:Decrypt',
          'kms:GenerateDataKey',
        ],
        resources: ['*'],
        conditions: {
          StringLike: {
            'kms:AliasName': 'alias/lattice-*',
          },
        },
      }),
    ];
    
    // Add environment-specific permissions
    if (environment === 'prod') {
      // Production has additional restrictions
      basePermissions.push(
        new iam.PolicyStatement({
          sid: 'ProductionRestrictions',
          effect: iam.Effect.DENY,
          actions: [
            'rds:DeleteDBInstance',
            's3:DeleteBucket',
          ],
          resources: ['*'],
          conditions: {
            StringNotEquals: {
              'aws:RequestedRegion': ['us-east-1', 'us-west-2'], // Restrict regions
            },
          },
        })
      );
    }
    
    return new iam.PolicyDocument({
      statements: basePermissions,
    });
  }
}