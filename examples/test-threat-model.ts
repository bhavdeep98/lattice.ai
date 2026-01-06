#!/usr/bin/env node

/**
 * Simple test script to demonstrate threat modeling
 * Run with: npx ts-node examples/test-threat-model.ts
 */

import { App } from 'aws-cdk-lib';
import { ServerlessApiStack, DataPipelineStack, GenAIRagStack } from './threat-model-examples';

const app = new App();

// Create different workload types to test threat modeling
new ServerlessApiStack(app, 'ServerlessApiStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' }
});

new DataPipelineStack(app, 'DataPipelineStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' }
});

new GenAIRagStack(app, 'GenAIRagStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' }
});

console.log('🔍 Threat modeling examples created!');
console.log('📝 Run "cdk synth" to generate threat models in cdk.out/');
console.log('');
console.log('Expected outputs:');
console.log('- cdk.out/THREAT_MODEL.md (human-readable)');
console.log('- cdk.out/threat-model.json (machine-readable)');
console.log('');
console.log('Each stack will generate different threats based on its workload type:');
console.log('- ServerlessApiStack: API authentication, injection, rate limiting');
console.log('- DataPipelineStack: Data tampering, PII exposure, resource exhaustion');
console.log('- GenAIRagStack: Prompt injection, cross-tenant leakage, cost abuse');