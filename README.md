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
- **Threat Modeling Aspect**: Generates security threat analysis at synth-time

### 🔒 Automated Threat Modeling

Lattice automatically generates comprehensive threat models for your AWS architectures:

```typescript
applyLatticeAspects(this, {
  environment: 'prod',
  projectName: 'MyApp',
  owner: 'DevTeam',
  threatModel: {
    enabled: true,
    formats: ['md', 'json'],
    projectName: 'Customer API'
  }
});
```

**Features:**
- **Workload Detection**: Automatically identifies serverless-api, data-pipeline, genai-rag patterns
- **STRIDE Analysis**: Complete threat coverage across all 6 categories
- **AWS-Specific**: Contextual mitigations using AWS services
- **Dual Output**: Human-readable reports + machine-readable JSON
- **CI/CD Ready**: Deterministic output for security automation

**Outputs:**
- `cdk.out/THREAT_MODEL.md` - Security report for humans
- `cdk.out/threat-model.json` - Data for automation/CI gates

See [docs/threat-modeling.md](docs/threat-modeling.md) for complete documentation.

### 🚀 Automated CI/CD Pipeline

Lattice includes a production-ready CI/CD pipeline with security-first deployment:

```yaml
# Automatic triggers
- Pull Request → Deploy to Development
- Push to main → Deploy to Staging  
- Release tag → Deploy to Production (with approval)
```

**Pipeline Features:**
- 🔍 **Automated Security Analysis**: Every deployment includes threat modeling
- 💰 **Cost Controls**: Environment-specific limits and optimization
- 🧪 **Multi-Environment**: Dev, staging, production with different policies
- 📊 **Detailed Reporting**: PR comments with security and cost analysis
- 🛡️ **Security Gates**: Block deployments with critical threats
- ⚡ **Fast Feedback**: Complete validation in ~5-10 minutes

**Example Pipeline Output:**
```markdown
## 🚀 Development Deployment Complete
**Environment:** Development (PR #123)
**Estimated Cost:** $45/month
### 🔒 Security Analysis
- ✅ No critical threats detected
- ⚠️ 2 Security warnings - See threat model
```

See [docs/cicd-pipeline.md](docs/cicd-pipeline.md) for complete documentation.

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

Business Source License 1.1 - see LICENSE file for details.

For commercial licensing inquiries, please contact [your-email@example.com].