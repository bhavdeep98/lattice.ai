#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LatticeWebsiteStack } from './website-deployment-stack';

const app = new cdk.App();

// Get configuration from context or environment
const environment = app.node.tryGetContext('environment') || 'prod';
const domainName = app.node.tryGetContext('domainName');
const certificateArn = app.node.tryGetContext('certificateArn');

// Stack configuration
const stackProps: cdk.StackProps = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Lattice AWS CDK Website - Production Infrastructure',
  tags: {
    Project: 'Lattice',
    Environment: environment,
    Component: 'Website',
    Owner: 'Lattice Team',
    CostCenter: 'Marketing',
  },
};

// Create the website stack
new LatticeWebsiteStack(app, `LatticeWebsite-${environment}`, {
  ...stackProps,
  domainName,
  certificateArn,
});