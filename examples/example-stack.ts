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

/**
 * Example stack demonstrating Lattice AWS CDK usage
 */
export class ExampleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // 🛡️ STEP 1: Apply guardrails FIRST - The "Final Inspector"
    applyLatticeAspects(this, {
      environment: 'dev',
      projectName: 'LatticeExample',
      owner: 'Engineering',
      additionalTags: {
        'CostCenter': '12345',
        'Team': 'Platform',
      },
      costLimits: {
        maxInstanceSize: 'large',
      },
      securityConfig: {
        enforceEncryption: true,
        enforceVersioning: true,
        enforceBackups: true,
      },
    });

    // STEP 2: Create infrastructure (now automatically secured!)

    // AI generates this simple JSON
    const networkIntent = {
      name: 'example-network',
      environment: 'dev' as const,
      cidr: '10.0.0.0/16',
      highAvailability: true,
      enhancedSecurity: true,
    };

    const storageIntent = {
      name: 'example-storage',
      environment: 'dev' as const,
      encryption: true,
      versioning: true,
      cors: {
        allowedOrigins: ['https://example.com'],
        allowedMethods: ['GET', 'POST'],
      },
    };

    const identityIntent = {
      name: 'example-service',
      environment: 'dev' as const,
      role: 'application' as const,
      programmaticAccess: true,
    };

    // Lattice handles the complex AWS implementation
    const network = new LatticeNetwork(this, 'Network', networkIntent);
    
    const storage = new LatticeBucket(this, 'Storage', storageIntent);
    
    const identity = new LatticeIdentity(this, 'Identity', identityIntent);

    const database = new LatticeDatabase(this, 'Database', {
      name: 'example-db',
      environment: 'dev',
      engine: 'postgres',
      size: 'small', // Appropriate for dev environment
      network: {
        vpcId: network.output.vpcId,
        subnetIds: network.output.privateSubnetIds,
      },
    });

    const compute = new LatticeCompute(this, 'Compute', {
      name: 'example-app',
      environment: 'dev',
      type: 'container',
      size: 'small', // Cost-controlled for dev
      autoScaling: false, // Disabled for dev
      network: {
        vpcId: network.output.vpcId,
        subnetIds: network.output.privateSubnetIds,
      },
      identity: {
        roleArn: identity.output.roleArn,
      },
    });

    // ✅ All resources are now:
    // 🛡️ Secured (encryption, versioning, access controls)
    // 💰 Cost-controlled (appropriate sizes for environment)
    // 🏷️ Tagged (project, owner, environment, cost center)
  }
}