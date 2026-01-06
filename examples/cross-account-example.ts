#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CrossAccountStack } from '../src/core/cross-account/cross-account-stack';
import { CrossAccountConfig } from '../src/core/cross-account/types';

/**
 * Example: Cross-Account Deployment Setup
 * 
 * This example demonstrates how to set up enterprise-grade cross-account
 * AWS deployments using OIDC authentication and secure role assumption chains.
 */

// Cross-account configuration
const crossAccountConfig: CrossAccountConfig = {
  githubRepository: 'your-org/your-repo', // Replace with your GitHub repository
  organizationId: 'o-example123456', // Replace with your AWS Organization ID
  
  accounts: {
    tooling: {
      accountId: 'YOUR_TOOLING_ACCOUNT_ID', // Replace with your tooling account ID
      alias: 'lattice-tooling',
      environment: 'tooling',
      allowedRegions: ['us-east-1', 'us-west-2'],
      maxInstanceSize: 'large',
      allowPublicAccess: false,
      backupRetention: {
        daily: 7,
        weekly: 4,
        monthly: 12,
        yearly: 7,
      },
      compliance: {
        requireEncryption: true,
        requireTLSInTransit: true,
        requireDetailedLogging: true,
        dataResidency: ['US'],
      },
      network: {
        vpcCidrs: ['10.0.0.0/16'],
        enableFlowLogs: true,
        enableConfig: true,
      },
    },
    
    dev: {
      accountId: 'YOUR_DEV_ACCOUNT_ID', // Replace with your dev account ID
      alias: 'lattice-development',
      environment: 'dev',
      allowedRegions: ['us-east-1', 'us-west-2'],
      maxInstanceSize: 'medium',
      allowPublicAccess: true, // Allow for testing
      backupRetention: {
        daily: 3,
        weekly: 2,
        monthly: 1,
        yearly: 0,
      },
      compliance: {
        requireEncryption: true,
        requireTLSInTransit: false, // Relaxed for dev
        requireDetailedLogging: false,
        dataResidency: ['US'],
      },
      network: {
        vpcCidrs: ['10.1.0.0/16'],
        enableFlowLogs: false,
        enableConfig: false,
      },
    },
    
    staging: {
      accountId: 'YOUR_STAGING_ACCOUNT_ID', // Replace with your staging account ID
      alias: 'lattice-staging',
      environment: 'staging',
      allowedRegions: ['us-east-1', 'us-west-2'],
      maxInstanceSize: 'large',
      allowPublicAccess: false,
      backupRetention: {
        daily: 7,
        weekly: 4,
        monthly: 6,
        yearly: 1,
      },
      compliance: {
        requireEncryption: true,
        requireTLSInTransit: true,
        requireDetailedLogging: true,
        dataResidency: ['US'],
      },
      network: {
        vpcCidrs: ['10.2.0.0/16'],
        enableFlowLogs: true,
        enableConfig: true,
      },
    },
    
    prod: {
      accountId: 'YOUR_PROD_ACCOUNT_ID', // Replace with your prod account ID
      alias: 'lattice-production',
      environment: 'prod',
      allowedRegions: ['us-east-1', 'us-west-2'],
      maxInstanceSize: '2xlarge',
      allowPublicAccess: false,
      backupRetention: {
        daily: 30,
        weekly: 12,
        monthly: 24,
        yearly: 7,
      },
      compliance: {
        requireEncryption: true,
        requireTLSInTransit: true,
        requireDetailedLogging: true,
        dataResidency: ['US'],
      },
      network: {
        vpcCidrs: ['10.3.0.0/16'],
        enableFlowLogs: true,
        enableConfig: true,
      },
    },
    
    security: {
      accountId: 'YOUR_SECURITY_ACCOUNT_ID', // Replace with your security account ID
      alias: 'lattice-security',
      environment: 'security',
      allowedRegions: ['us-east-1', 'us-west-2'],
      maxInstanceSize: 'medium',
      allowPublicAccess: false,
      backupRetention: {
        daily: 30,
        weekly: 12,
        monthly: 24,
        yearly: 10,
      },
      compliance: {
        requireEncryption: true,
        requireTLSInTransit: true,
        requireDetailedLogging: true,
        dataResidency: ['US'],
      },
      network: {
        vpcCidrs: ['10.4.0.0/16'],
        enableFlowLogs: true,
        enableConfig: true,
      },
    },
    
    sharedServices: {
      accountId: 'YOUR_SHARED_SERVICES_ACCOUNT_ID', // Replace with your shared services account ID
      alias: 'lattice-shared-services',
      environment: 'shared-services',
      allowedRegions: ['us-east-1', 'us-west-2'],
      maxInstanceSize: 'xlarge',
      allowPublicAccess: false,
      backupRetention: {
        daily: 30,
        weekly: 12,
        monthly: 24,
        yearly: 7,
      },
      compliance: {
        requireEncryption: true,
        requireTLSInTransit: true,
        requireDetailedLogging: true,
        dataResidency: ['US'],
      },
      network: {
        vpcCidrs: ['10.5.0.0/16'],
        enableFlowLogs: true,
        enableConfig: true,
      },
    },
  },
  
  global: {
    primaryRegion: 'us-east-1',
    secondaryRegion: 'us-west-2',
    defaultTags: {
      Project: 'Lattice',
      ManagedBy: 'CDK',
      Environment: 'multi-account',
      CostCenter: 'Engineering',
      Owner: 'Platform-Team',
      Compliance: 'Required',
    },
    costControls: {
      maxMonthlyCost: {
        dev: 500,
        staging: 1500,
        prod: 5000,
      },
      budgetAlerts: {
        thresholds: [50, 80, 100],
        notificationEmail: 'platform-team@company.com',
      },
    },
  },
};

const app = new cdk.App();

// Get deployment context from environment or CDK context
const deploymentContext = app.node.tryGetContext('deploymentContext');
const environment = app.node.tryGetContext('environment') || 'dev';
const crossAccount = app.node.tryGetContext('crossAccount') || false;
const targetAccountId = app.node.tryGetContext('targetAccountId');
const toolingAccountId = app.node.tryGetContext('toolingAccountId');

if (crossAccount && targetAccountId) {
  // Cross-account deployment mode
  console.log(`🔄 Cross-account deployment mode`);
  console.log(`   Environment: ${environment}`);
  console.log(`   Target Account: ${targetAccountId}`);
  console.log(`   Tooling Account: ${toolingAccountId}`);
  
  // Find account configuration
  const accountConfig = Object.values(crossAccountConfig.accounts).find(
    account => account.accountId === targetAccountId
  );
  
  if (!accountConfig) {
    throw new Error(`Account configuration not found for ${targetAccountId}`);
  }
  
  // Create cross-account stack in target account
  new CrossAccountStack(app, `LatticeCrossAccount-${accountConfig.environment}`, {
    env: {
      account: targetAccountId,
      region: crossAccountConfig.global.primaryRegion,
    },
    githubRepository: crossAccountConfig.githubRepository,
    targetAccountIds: [targetAccountId],
    environment: accountConfig.environment as any,
    organizationId: crossAccountConfig.organizationId,
    description: `Lattice cross-account infrastructure for ${accountConfig.environment}`,
    tags: {
      ...crossAccountConfig.global.defaultTags,
      Environment: accountConfig.environment,
      Account: accountConfig.alias,
      DeploymentType: 'cross-account',
    },
  });
  
} else {
  // Setup mode - create infrastructure in all accounts
  console.log(`🏗️ Cross-account setup mode`);
  console.log(`   Creating infrastructure in all accounts`);
  
  // Create tooling account stack
  new CrossAccountStack(app, 'LatticeToolingAccount', {
    env: {
      account: crossAccountConfig.accounts.tooling.accountId,
      region: crossAccountConfig.global.primaryRegion,
    },
    githubRepository: crossAccountConfig.githubRepository,
    targetAccountIds: [
      crossAccountConfig.accounts.dev.accountId,
      crossAccountConfig.accounts.staging.accountId,
      crossAccountConfig.accounts.prod.accountId,
    ],
    environment: 'tooling',
    organizationId: crossAccountConfig.organizationId,
    description: 'Lattice tooling account for cross-account deployments',
    tags: {
      ...crossAccountConfig.global.defaultTags,
      Environment: 'tooling',
      Account: 'lattice-tooling',
      Purpose: 'cicd-orchestration',
    },
  });
  
  // Create target account stacks
  const targetEnvironments = ['dev', 'staging', 'prod'] as const;
  
  for (const env of targetEnvironments) {
    const accountConfig = crossAccountConfig.accounts[env];
    
    new CrossAccountStack(app, `LatticeTargetAccount-${env}`, {
      env: {
        account: accountConfig.accountId,
        region: crossAccountConfig.global.primaryRegion,
      },
      githubRepository: crossAccountConfig.githubRepository,
      targetAccountIds: [accountConfig.accountId],
      environment: env,
      organizationId: crossAccountConfig.organizationId,
      description: `Lattice ${env} account infrastructure`,
      tags: {
        ...crossAccountConfig.global.defaultTags,
        Environment: env,
        Account: accountConfig.alias,
        Purpose: 'application-hosting',
      },
    });
  }
}

// Add stack-level tags
cdk.Tags.of(app).add('Project', 'Lattice');
cdk.Tags.of(app).add('ManagedBy', 'CDK');
cdk.Tags.of(app).add('DeploymentModel', 'CrossAccount');
cdk.Tags.of(app).add('CreatedAt', new Date().toISOString());

// Validate configuration
console.log(`✅ Cross-account configuration validated`);
console.log(`   Organization: ${crossAccountConfig.organizationId}`);
console.log(`   GitHub Repository: ${crossAccountConfig.githubRepository}`);
console.log(`   Primary Region: ${crossAccountConfig.global.primaryRegion}`);
console.log(`   Accounts: ${Object.keys(crossAccountConfig.accounts).length}`);

export { crossAccountConfig };