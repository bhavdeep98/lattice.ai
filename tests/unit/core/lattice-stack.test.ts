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
    test('should create stack with manifest', () => {
      const manifest: LatticeManifest = {
        appName: 'test-app',
        environment: 'dev',
        capabilities: {}
      };

      const stack = new LatticeStack(app, 'TestStack', manifest);
      
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestStack');
    });

    test('should create stack with threat modeling enabled', () => {
      const manifest: LatticeManifest = {
        appName: 'secure-app',
        environment: 'prod',
        capabilities: {},
        threatModel: {
          enabled: true,
          projectName: 'secure-app'
        }
      };

      const stack = new LatticeStack(app, 'SecureStack', manifest);
      
      expect(stack).toBeDefined();
    });
  });

  describe('Capability Processing', () => {
    test('should process storage capability', () => {
      const manifest: LatticeManifest = {
        appName: 'storage-app',
        environment: 'dev',
        capabilities: {
          storage: {
            name: 'app-bucket',
            environment: 'dev',
            encryption: true,
            versioning: true
          }
        }
      };

      const stack = new LatticeStack(app, 'StorageStack', manifest);
      
      expect(stack).toBeDefined();
    });

    test('should process API capability without network', () => {
      const manifest: LatticeManifest = {
        appName: 'api-app',
        environment: 'dev',
        capabilities: {
          api: {
            name: 'api-function',
            environment: 'dev',
            type: 'serverless',
            size: 'small'
          }
        }
      };

      const stack = new LatticeStack(app, 'APIStack', manifest);
      
      expect(stack).toBeDefined();
    });

    test('should process database capability without network', () => {
      const manifest: LatticeManifest = {
        appName: 'db-app',
        environment: 'dev',
        capabilities: {
          database: {
            name: 'app-db',
            environment: 'dev',
            engine: 'postgres',
            size: 'small'
          }
        }
      };

      const stack = new LatticeStack(app, 'DatabaseStack', manifest);
      
      expect(stack).toBeDefined();
    });
  });

  describe('Multi-Capability Applications', () => {
    test('should process complex multi-service manifest', () => {
      const manifest: LatticeManifest = {
        appName: 'complex-app',
        environment: 'staging',
        capabilities: {
          api: {
            name: 'api-service',
            environment: 'staging',
            type: 'serverless',
            size: 'medium'
          },
          storage: {
            name: 'data-bucket',
            environment: 'staging',
            encryption: true
          },
          database: {
            name: 'user-db',
            environment: 'staging',
            engine: 'postgres',
            size: 'medium'
          }
        },
        threatModel: {
          enabled: true
        }
      };

      const stack = new LatticeStack(app, 'ComplexStack', manifest);
      
      expect(stack).toBeDefined();
    });
  });

  describe('Environment Handling', () => {
    test('should handle development environment', () => {
      const manifest: LatticeManifest = {
        appName: 'dev-app',
        environment: 'dev',
        capabilities: {
          storage: {
            name: 'dev-bucket',
            environment: 'dev'
          }
        }
      };

      const stack = new LatticeStack(app, 'DevStack', manifest);
      
      expect(stack).toBeDefined();
    });

    test('should handle production environment with enhanced security', () => {
      const manifest: LatticeManifest = {
        appName: 'prod-app',
        environment: 'prod',
        capabilities: {
          storage: {
            name: 'prod-bucket',
            environment: 'prod',
            encryption: true,
            versioning: true
          }
        },
        threatModel: {
          enabled: true,
          projectName: 'Production Application'
        }
      };

      const stack = new LatticeStack(app, 'ProdStack', manifest);
      
      expect(stack).toBeDefined();
    });
  });
});