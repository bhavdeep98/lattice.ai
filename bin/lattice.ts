#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SimpleTestStack } from '../examples/simple-test-stack';

const app = new cdk.App();

// Use simple test stack for CI/CD testing
new SimpleTestStack(app, 'LatticeTestStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || 'YOUR_ACCOUNT_ID',
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});