import { App } from 'aws-cdk-lib';
import { LatticeStack, LatticeManifest } from '../src';

const app = new App();

/**
 * Example: The "AI Generated" Manifest
 * This object represents what an AI Agent would output after conversing with a user.
 */
const manifest: LatticeManifest = {
  appName: 'start-up-demo',
  environment: 'prod',
  threatModel: {
    enabled: true,
    projectName: 'StartUp Demo MVP',
  },
  capabilities: {
    // "I need a website"
    website: {
      name: 'landing-page',
      environment: 'prod',
      sourcePath: './website-dist', // Mock path
      domainName: 'demo.lattice.dev',
    },
    // "I need an API"
    api: {
      name: 'backend-api',
      environment: 'prod',
      type: 'serverless',
      size: 'small',
      runtime: 'nodejs18.x',
    },
    // "I need to store user data"
    database: {
      name: 'users-db',
      environment: 'prod',
      engine: 'postgres',
      size: 'small',
      highAvailability: true,
    },
    // "I need to process orders asynchronously"
    queue: {
      name: 'orders-queue',
      environment: 'prod',
      type: 'standard',
      dlq: true,
    },
  },
};

/**
 * The Lattice Engine takes the manifest and builds the stack.
 */
new LatticeStack(app, 'StartUpStack', manifest);

console.log('🚀 Lattice Stack Synthesized!');
