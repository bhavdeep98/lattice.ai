# Lattice AWS CDK

Contract-First AWS Infrastructure with CDK - AI generates simple JSON "intents", Lattice handles the complex AWS implementation with built-in guardrails for security, cost control, governance, and comprehensive observability.

## 🚀 Quick Start

```typescript
import {
  LatticeNetwork,
  LatticeBucket,
  LatticeDatabase,
  applyLatticeAspects,
} from 'lattice-aws-cdk';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // 🛡️ Apply guardrails FIRST - The "Final Inspector"
    applyLatticeAspects(this, {
      environment: 'prod',
      projectName: 'MyApp',
      owner: 'DevTeam',
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

    const databaseIntent = {
      name: 'app-db',
      environment: 'prod',
      engine: 'postgres',
      size: 'large',
    };

    // Lattice handles the rest + aspects ensure security
    const network = new LatticeNetwork(this, 'Network', networkIntent);
    const storage = new LatticeBucket(this, 'Storage', storageIntent);
    const database = new LatticeDatabase(this, 'Database', databaseIntent);

    // ✅ Automatically secured, cost-controlled, monitored, and backed up!
  }
}
```

## 🎯 Why Lattice AWS CDK?

- **Contract-First**: AI generates simple JSON intents, Lattice handles AWS complexity
- **Built-in Guardrails**: Automatic security, cost control, and governance
- **Comprehensive Observability**: Automatic monitoring, alarms, and dashboards
- **Operations-Ready**: Built-in backup strategies and data protection
- **AWS Native**: Leverages AWS CDK for type safety and AWS best practices
- **AI-Friendly**: Simple interfaces perfect for AI code generation
- **Escape Hatches**: Full access to underlying CDK constructs when needed

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
    projectName: 'Customer API',
  },
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

### 📊 Comprehensive Observability & Monitoring

Lattice automatically creates monitoring, alarms, and dashboards for all infrastructure:

```typescript
// Automatic monitoring for production
const database = new LatticeDatabase(this, 'DB', {
  name: 'app-database',
  environment: 'prod', // Enables comprehensive monitoring
  engine: 'postgres',
  size: 'large',
});

// Result: 4+ alarms + 4 role-based dashboards created automatically
```

**Features:**

- **Automatic Alarms**: CPU, memory, errors, duration for all resource types
- **Role-Based Dashboards**: Developer, SRE, CTO, and Security views
- **Environment-Aware Thresholds**: Strict for prod, relaxed for dev
- **Severity Configuration**: Critical, Warning, Info classifications
- **SNS Integration**: Custom notification topics

**Resource Coverage:**

- **Compute**: EC2, ECS, Lambda monitoring with performance alarms
- **Database**: RDS monitoring with connection and storage alarms
- **Storage**: S3 monitoring with request rate and error alarms
- **Network**: NAT Gateway monitoring with error detection

See [docs/observability-alarms.md](docs/observability-alarms.md) for complete documentation.

### 🔄 Operations & Data Protection

Lattice ensures your data is protected with environment-aware policies:

```typescript
// Production automatically gets data protection
const bucket = new LatticeBucket(this, 'CriticalData', {
  name: 'customer-data',
  environment: 'prod', // RETAIN policy + backups enabled
  encryption: true,
});

// Development uses cost-optimized policies
const devBucket = new LatticeBucket(this, 'DevData', {
  name: 'dev-data',
  environment: 'dev', // DESTROY policy + no backups
  encryption: true,
});
```

**Features:**

- **Environment-Aware Removal Policies**: RETAIN for prod, DESTROY for dev
- **Comprehensive Backup Strategy**: Daily, weekly, monthly backups
- **Cross-Region Disaster Recovery**: Production backup replication
- **Configuration Validation**: Prevents unsafe production settings
- **Compliance Reporting**: Automatic audit trail generation

**Protection Levels:**

- **Production**: RETAIN/SNAPSHOT policies, comprehensive backups, maximum protection
- **Staging**: RETAIN policies, moderate backups, balanced protection
- **Development**: DESTROY policies, minimal backups, cost-optimized

See [docs/operations-statefulness.md](docs/operations-statefulness.md) for complete documentation.

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

## 🔧 Escape Hatch Pattern

Need advanced AWS features? Lattice provides full access to underlying CDK constructs:

```typescript
// Start with simple Lattice intent
const bucket = new LatticeBucket(this, 'DataBucket', {
  name: 'analytics-data',
  environment: 'prod',
  encryption: true,
});

// Escape hatch: Add advanced S3 features
bucket.instance.addCorsRule({
  allowedOrigins: ['https://admin.myapp.com'],
  allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.DELETE],
  allowedHeaders: ['x-amz-server-side-encryption'],
  maxAge: 3600,
});

bucket.instance.addLifecycleRule({
  id: 'IntelligentTiering',
  transitions: [
    {
      storageClass: s3.StorageClass.INTELLIGENT_TIERING,
      transitionAfter: Duration.days(1),
    },
  ],
});
```

**Benefits:**

- **Progressive Enhancement**: Start simple, add complexity when needed
- **Zero Lock-in**: Full access to AWS CDK features
- **Team Productivity**: Junior devs use simple interface, seniors access advanced features

See [docs/escape-hatch-pattern.md](docs/escape-hatch-pattern.md) for complete documentation.

## 🚦 Getting Started

1. Install dependencies:

```bash
npm install lattice-aws-cdk
```

2. Build your first stack:

```typescript
import { LatticeBucket, applyLatticeAspects } from 'lattice-aws-cdk';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Apply guardrails first
    applyLatticeAspects(this, {
      environment: 'prod',
      projectName: 'MyApp',
      owner: 'DevTeam',
    });

    // Create infrastructure with simple JSON
    const storage = new LatticeBucket(this, 'Storage', {
      name: 'my-app-data',
      environment: 'prod',
      encryption: true,
      versioning: true,
    });
  }
}
```

3. Deploy your infrastructure:

```bash
npm run build
npm run deploy
```

## 📚 Documentation

### Core Documentation

- [Threat Modeling](docs/threat-modeling.md) - Automated security analysis
- [Observability & Alarms](docs/observability-alarms.md) - Monitoring and alerting
- [Operations & Statefulness](docs/operations-statefulness.md) - Data protection and backups
- [Escape Hatch Pattern](docs/escape-hatch-pattern.md) - Advanced AWS features
- [CI/CD Pipeline](docs/cicd-pipeline.md) - Automated deployment pipeline
- [Testing Strategy](docs/testing-strategy.md) - Comprehensive testing approach

### Examples

- [Simple Test Stack](examples/simple-test-stack.ts) - Basic usage patterns
- [AI-Friendly Demo](examples/ai-friendly-demo.ts) - AI code generation examples
- [Observability Example](examples/observability-example.ts) - Monitoring setup
- [Operations Example](examples/operations-statefulness-example.ts) - Data protection
- [Escape Hatch Example](examples/escape-hatch-example.ts) - Advanced features

## 🏢 Commercial Use

Lattice AWS CDK is available under the Business Source License 1.1:

- **Open Source**: Free for non-commercial use, research, and development
- **Commercial License**: Required for commercial use and hosted services
- **Future Open Source**: Automatically becomes Apache 2.0 in 2029

### Commercial License Options

- **Startup License**: $99/month - Up to 10 developers
- **Business License**: $299/month - Up to 50 developers
- **Enterprise License**: Custom pricing - Unlimited developers + support

For commercial licensing inquiries, contact: bhavdeepsachdeva@gmail.com

## 👨‍💻 Author

**Bhavdeep Singh Sachdeva**

- Website: [https://bhavdeep98.github.io](https://bhavdeep98.github.io)
- Email: bhavdeepsachdeva@gmail.com

## 🤝 Contributing

We welcome contributions! Please see our Contributing Guide for details.

## 📄 License

Business Source License 1.1 - see LICENSE file for details.

For commercial licensing inquiries, please contact bhavdeepsachdeva@gmail.com.
