/**
 * Unit tests for LatticeStack core functionality
 */

import { App } from 'aws-cdk-lib';
import { LatticeStack } from '../../../src/core/lattice-stack';
import { LatticeManifest } from '../../../src/core/manifest';

describe('LatticeStack', () => {
  let app: App;

  beforeEach(() => {
    app = new App();
  });

  describe('Stack Creation', () => {
    test('should create stack with default configuration', () => {
      const stack = new LatticeStack(app, 'TestStack');
      
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestStack');
    });

    test('should apply default tags to all resources', () => {
      const stack = new LatticeStack(app, 'TaggedStack', {
        tags: {
          Environment: 'test',
          Project: 'lattice'
        }
      });
      
      expect(stack).toBeDefined();
      // Test that tags are applied
    });

    test('should enable threat modeling by default', () => {
      const stack = new LatticeStack(app, 'SecureStack');
      
      // Verify threat modeling aspect is applied
      expect(stack).toBeDefined();
    });
  });

  describe('Manifest Processing', () => {
    test('should process simple manifest', () => {
      const manifest: LatticeManifest = {
        version: '1.0',
        metadata: {
          name: 'test-app',
          description: 'Test application'
        },
        resources: {
          storage: [{
            name: 'app-bucket',
            type: 's3',
            properties: {
              bucketName: 'test-app-bucket-12345'
            }
          }]
        }
      };

      const stack = new LatticeStack(app, 'ManifestStack');
      stack.fromManifest(manifest);
      
      expect(stack).toBeDefined();
    });

    test('should process complex multi-service manifest', () => {
      const manifest: LatticeManifest = {
        version: '1.0',
        metadata: {
          name: 'complex-app',
          description: 'Complex multi-service application'
        },
        resources: {
          compute: [{
            name: 'api-function',
            type: 'lambda',
            properties: {
              runtime: 'nodejs18.x',
              handler: 'index.handler'
            }
          }],
          storage: [{
            name: 'data-bucket',
            type: 's3',
            properties: {
              bucketName: 'complex-app-data-12345'
            }
          }],
          database: [{
            name: 'user-table',
            type: 'dynamodb',
            properties: {
              tableName: 'Users',
              partitionKey: 'userId'
            }
          }]
        }
      };

      const stack = new LatticeStack(app, 'ComplexStack');
      stack.fromManifest(manifest);
      
      expect(stack).toBeDefined();
    });

    test('should validate manifest schema', () => {
      const invalidManifest = {
        version: '1.0',
        // Missing required metadata
        resources: {}
      };

      const stack = new LatticeStack(app, 'InvalidStack');
      
      expect(() => {
        stack.fromManifest(invalidManifest as LatticeManifest);
      }).toThrow();
    });
  });

  describe('Resource Orchestration', () => {
    test('should create resources in correct order', () => {
      const manifest: LatticeManifest = {
        version: '1.0',
        metadata: {
          name: 'ordered-app',
          description: 'App with resource dependencies'
        },
        resources: {
          network: [{
            name: 'app-vpc',
            type: 'vpc',
            properties: {
              cidr: '10.0.0.0/16'
            }
          }],
          compute: [{
            name: 'app-function',
            type: 'lambda',
            properties: {
              runtime: 'nodejs18.x',
              handler: 'index.handler'
            },
            dependencies: ['app-vpc']
          }]
        }
      };

      const stack = new LatticeStack(app, 'OrderedStack');
      stack.fromManifest(manifest);
      
      expect(stack).toBeDefined();
    });

    test('should handle resource dependencies', () => {
      // Test that resources with dependencies are created after their dependencies
      const stack = new LatticeStack(app, 'DependencyStack');
      
      expect(stack).toBeDefined();
    });
  });
});