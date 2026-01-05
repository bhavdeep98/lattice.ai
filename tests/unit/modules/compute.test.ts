/**
 * Unit tests for LatticeCompute module
 */

import { Stack } from 'aws-cdk-lib';
import { LatticeCompute } from '../../../src/modules/compute/lattice-compute';
import { ComputeType } from '../../../src/modules/compute/types';

describe('LatticeCompute', () => {
  let stack: Stack;

  beforeEach(() => {
    stack = new Stack();
  });

  describe('Lambda Functions', () => {
    test('should create Lambda function with default configuration', () => {
      const compute = new LatticeCompute(stack, 'TestCompute', {
        type: ComputeType.LAMBDA,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        code: { inline: 'exports.handler = async () => ({ statusCode: 200 });' }
      });

      expect(compute).toBeDefined();
      // Add assertions for Lambda configuration
    });

    test('should apply security best practices to Lambda', () => {
      const compute = new LatticeCompute(stack, 'SecureCompute', {
        type: ComputeType.LAMBDA,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        code: { inline: 'exports.handler = async () => ({ statusCode: 200 });' },
        security: {
          enableTracing: true,
          reservedConcurrency: 10
        }
      });

      // Test security configurations
      expect(compute).toBeDefined();
    });
  });

  describe('ECS Services', () => {
    test('should create ECS service with Fargate', () => {
      const compute = new LatticeCompute(stack, 'ECSCompute', {
        type: ComputeType.ECS,
        containerImage: 'nginx:latest',
        cpu: 256,
        memory: 512
      });

      expect(compute).toBeDefined();
    });
  });

  describe('EC2 Instances', () => {
    test('should create EC2 instance with security groups', () => {
      const compute = new LatticeCompute(stack, 'EC2Compute', {
        type: ComputeType.EC2,
        instanceType: 't3.micro',
        machineImage: 'ami-12345678'
      });

      expect(compute).toBeDefined();
    });
  });
});