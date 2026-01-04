# Lattice AWS CDK

Contract-First AWS Infrastructure with CDK - AI generates simple JSON "intents", Lattice handles the complex AWS implementation with built-in guardrails for security, cost control, and governance.

## 🚀 Quick Start

```typescript
import { LatticeNetwork, LatticeBucket, applyLatticeAspects } from 'lattice-aws-cdk';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // 🛡️ Apply guardrails FIRST - The "Final Inspector"
    applyLatticeAspects(this, {
      environment: 'prod',
      projectName: 'MyApp',
      owner: 'DevTeam'
    });

    // AI generates this simple JSON
    const networkIntent = {
      cidr: '10.0.0.0/16',
      environment: 'prod',
      highAvailability: true,
    };

    const storageIntent = {
      name: 'app-data',
      environment: 'prod',
      encryption: true,
    };

    // Lattice handles the rest + aspects ensure security
    const network = new LatticeNetwork(this, 'Network', networkIntent);
    const storage = new LatticeBucket(this, 'Storage', storageIntent);
    // ✅ Automatically secured, cost-controlled, and tagged!
  }
}
```

## 🎯 Why Lattice AWS CDK?

- **Contract-First**: AI generates simple JSON intents, Lattice handles AWS complexity
- **Built-in Guardrails**: Automatic security, cost control, and governance
- **AWS Native**: Leverages AWS CDK for type safety and AWS best practices
- **AI-Friendly**: Simple interfaces perfect for AI code generation

## 🛡️ Lattice Aspects - Infrastructure Guardrails

Lattice Aspects act as the "Final Inspector" - they automatically apply security, cost, and governance policies to ALL resources.

- **Security Aspect**: Enforces encryption, secure defaults, and access controls
- **Cost Aspect**: Validates resource sizes and prevents cost overruns
- **Tagging Aspect**: Ensures consistent resource tagging and organization

## 📦 Available Modules

- ✅ **Network Module**: VPC abstraction with subnets, NAT gateways, and security groups
- ✅ **Storage Module**: S3 bucket abstraction with encryption, versioning, and lifecycle
- ✅ **Identity Module**: IAM roles and policies with least-privilege access
- ✅ **Database Module**: RDS abstraction with high availability and security
- ✅ **Compute Module**: EC2/ECS/Lambda abstraction with auto-scaling

## 🚦 Getting Started

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Deploy your infrastructure:
```bash
npm run deploy
```

## 📚 Documentation

See the `examples/` directory for complete usage examples.

## 🤝 Contributing

We welcome contributions! Please see our Contributing Guide for details.

## 📄 License

Apache 2.0 - see LICENSE file for details.