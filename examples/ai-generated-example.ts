/**
 * Example of AI-generated infrastructure using Lattice
 * This demonstrates how an AI system would generate simple JSON intents
 * and Lattice would handle the complex AWS implementation
 */

import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  LatticeNetwork,
  LatticeBucket,
  LatticeIdentity,
  LatticeDatabase,
  LatticeCompute,
  applyLatticeAspects,
} from '../src';

// AI System Prompt Example:
// "Create a production web application infrastructure on AWS with high availability"

// AI Output (JSON):
const aiGeneratedInfrastructure = {
  network: {
    name: 'webapp-network',
    environment: 'prod',
    cidr: '10.0.0.0/16',
    highAvailability: true,
    enhancedSecurity: true,
    publicSubnets: 3,
    privateSubnets: 3,
  },
  storage: {
    name: 'webapp-assets',
    environment: 'prod',
    encryption: true,
    versioning: true,
    cors: {
      allowedOrigins: ['https://myapp.com'],
      allowedMethods: ['GET'],
    },
    lifecycle: {
      archiveAfterDays: 90,
      deleteAfterDays: 365,
    },
  },
  identity: {
    name: 'webapp-service',
    environment: 'prod',
    role: 'application',
    programmaticAccess: true,
  },
  database: {
    name: 'webapp-db',
    environment: 'prod',
    engine: 'postgres',
    size: 'large',
    highAvailability: true,
  },
  compute: {
    name: 'webapp-servers',
    environment: 'prod',
    type: 'container',
    size: 'large',
    autoScaling: true,
  },
};

export class AIGeneratedStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Apply Lattice guardrails
    applyLatticeAspects(this, {
      environment: 'prod',
      projectName: 'WebApp',
      owner: 'ProductTeam',
      additionalTags: {
        'Application': 'WebApp',
        'Tier': 'Production',
      },
    });

    // Lattice transforms AI intents into secure AWS infrastructure
    const network = new LatticeNetwork(this, 'Network', {
      ...aiGeneratedInfrastructure.network,
      environment: 'prod',
    });

    const storage = new LatticeBucket(this, 'Storage', {
      ...aiGeneratedInfrastructure.storage,
      environment: 'prod',
    });

    const identity = new LatticeIdentity(this, 'Identity', {
      ...aiGeneratedInfrastructure.identity,
      environment: 'prod',
      role: 'application',
    });

    const database = new LatticeDatabase(this, 'Database', {
      ...aiGeneratedInfrastructure.database,
      environment: 'prod',
      engine: 'postgres',
      size: 'large',
      network: {
        vpcId: network.output.vpcId,
        subnetIds: network.output.privateSubnetIds,
      },
    });

    const compute = new LatticeCompute(this, 'Compute', {
      ...aiGeneratedInfrastructure.compute,
      environment: 'prod',
      type: 'container',
      size: 'large',
      network: {
        vpcId: network.output.vpcId,
        subnetIds: network.output.privateSubnetIds,
      },
      identity: {
        roleArn: identity.output.roleArn,
      },
    });

    // Result: Production-ready, secure, cost-controlled infrastructure
    // automatically generated from simple AI intents!
  }
}