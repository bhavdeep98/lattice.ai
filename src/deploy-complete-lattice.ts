#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LatticeWebsiteStack } from './website-deployment-stack';
import { LatticeBackendStack } from './lattice-backend-stack';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = new cdk.App();

// Get configuration from context or environment
const environment = app.node.tryGetContext('environment') || 'prod';
const domainName = app.node.tryGetContext('domainName');
const certificateArn = app.node.tryGetContext('certificateArn');
const openaiApiKey = app.node.tryGetContext('openaiApiKey') || process.env.OPENAI_API_KEY;

if (!openaiApiKey || openaiApiKey === 'your-openai-key-here') {
  console.error('❌ OPENAI_API_KEY is required. Please set it in your .env file:');
  console.error('   OPENAI_API_KEY=your-actual-openai-api-key');
  console.error('   Get your key from: https://platform.openai.com/api-keys');
  process.exit(1);
}

// Stack configuration
const stackProps: cdk.StackProps = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Lattice Complete Platform - Frontend + Backend',
  tags: {
    Project: 'Lattice',
    Environment: environment,
    Component: 'Complete-Platform',
    Owner: 'Lattice Team',
    CostCenter: 'Product',
  },
};

// Deploy backend first
const backendStack = new LatticeBackendStack(app, `LatticeBackend-${environment}`, {
  ...stackProps,
  openaiApiKey,
});

// Deploy frontend
const frontendStack = new LatticeWebsiteStack(app, `LatticeFrontend-${environment}`, {
  ...stackProps,
  domainName,
  certificateArn,
});

// Add dependency
frontendStack.addDependency(backendStack);

// Cross-stack references
new cdk.CfnOutput(frontendStack, 'CompletePlatformSummary', {
  value: JSON.stringify({
    frontend: frontendStack.distribution.distributionDomainName,
    backend: backendStack.api.url,
    environment: environment,
  }),
  description: 'Complete Lattice Platform URLs',
});