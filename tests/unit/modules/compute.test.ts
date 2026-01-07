/**
 * Unit tests for LatticeCompute module
 */

import { Stack, App } from 'aws-cdk-lib';
import { LatticeCompute } from '../../../src/modules/compute/lattice-compute';

describe('LatticeCompute', () => {
  let app: App;
  let stack: Stack;

  beforeEach(() => {
    app = new App();
    // Create stack with environment to avoid VPC lookup issues
    stack = new Stack(app, 'TestStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
  });

  describe('Basic Construction', () => {
    test('should validate compute type', () => {
      expect(() => {
        new LatticeCompute(stack, 'InvalidCompute', {
          name: 'invalid',
          environment: 'dev',
          type: 'invalid' as any,
          size: 'small',
          network: {
            vpcId: 'vpc-12345',
            subnetIds: ['subnet-12345'],
          },
        });
      }).toThrow('Unsupported compute type');
    });

    test('should accept serverless compute type', () => {
      expect(() => {
        new LatticeCompute(stack, 'ServerlessCompute', {
          name: 'test-serverless',
          environment: 'dev',
          type: 'serverless',
          size: 'small',
          network: {
            vpcId: 'vpc-12345',
            subnetIds: ['subnet-12345'],
          },
        });
      }).not.toThrow();
    });
  });

  describe('Compute Configuration', () => {
    test('should support different compute sizes', () => {
      const sizes = ['small', 'medium', 'large', 'xlarge'];

      sizes.forEach((size) => {
        expect(() => {
          new LatticeCompute(stack, `${size}Compute`, {
            name: `test-${size}`,
            environment: 'dev',
            type: 'serverless',
            size: size as any,
            network: {
              vpcId: 'vpc-12345',
              subnetIds: ['subnet-12345'],
            },
          });
        }).not.toThrow();
      });
    });

    test('should support auto scaling configuration', () => {
      expect(() => {
        new LatticeCompute(stack, 'AutoScaleCompute', {
          name: 'autoscale-service',
          environment: 'prod',
          type: 'container',
          size: 'large',
          autoScaling: true,
          network: {
            vpcId: 'vpc-12345',
            subnetIds: ['subnet-12345'],
          },
          containerImage: 'my-app:latest',
        });
      }).not.toThrow();
    });
  });

  describe('Environment Handling', () => {
    test('should handle different environments', () => {
      const environments = ['dev', 'staging', 'prod'];

      environments.forEach((env) => {
        expect(() => {
          new LatticeCompute(stack, `${env}Compute`, {
            name: `test-${env}`,
            environment: env as any,
            type: 'serverless',
            size: 'small',
            network: {
              vpcId: 'vpc-12345',
              subnetIds: ['subnet-12345'],
            },
          });
        }).not.toThrow();
      });
    });
  });

  describe('Network Configuration', () => {
    test('should require network configuration', () => {
      const compute = new LatticeCompute(stack, 'NetworkCompute', {
        name: 'network-test',
        environment: 'dev',
        type: 'serverless',
        size: 'small',
        network: {
          vpcId: 'vpc-12345',
          subnetIds: ['subnet-12345', 'subnet-67890'],
          securityGroupIds: ['sg-12345'],
        },
      });

      expect(compute).toBeDefined();
      expect(compute.output).toBeDefined();
    });
  });
});
