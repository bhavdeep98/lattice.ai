# Lattice CI/CD Pipeline

The Lattice CI/CD pipeline provides automated infrastructure deployment with built-in security analysis, cost controls, and multi-environment support.

## 🎯 **Overview**

The pipeline automatically:
- ✅ **Validates code quality** (TypeScript, linting, tests)
- 🔒 **Generates threat models** for security analysis
- 💰 **Estimates costs** and applies environment limits
- 🚀 **Deploys to multiple environments** (dev, staging, prod)
- 📊 **Provides detailed feedback** via PR comments and reports

## 🔄 **Pipeline Triggers**

| Trigger | Environment | Action |
|---------|-------------|--------|
| Pull Request | Development | Deploy ephemeral environment |
| Push to `main` | Staging | Deploy to staging |
| Release Tag | Production | Deploy to production (with approval) |
| Schedule | All | Security scans |

## 🏗️ **Pipeline Phases**

### **Phase 1: Validation** ⏱️ ~5-8 minutes
```bash
# Code quality checks
npm run build          # TypeScript compilation
npm run lint           # ESLint validation
npm run format:check   # Prettier formatting
npm run test           # Jest test suite

# Infrastructure validation
npm run synth          # CDK synthesis
npm run pipeline:analyze-threats  # Security analysis
npm run pipeline:estimate-costs   # Cost estimation
```

### **Phase 2: Security Analysis** ⏱️ ~2-3 minutes
- 🔍 **Threat Model Analysis**: Parse generated threat models
- 🚨 **Security Gates**: Fail on critical threats in production
- 💰 **Cost Controls**: Validate against environment limits
- 📋 **Compliance Checks**: Verify required security controls

### **Phase 3: Environment Deployment** ⏱️ ~10-20 minutes
- 🧪 **Development**: Ephemeral environments for PRs
- 🎯 **Staging**: Stable environment for testing
- 🏭 **Production**: Approved releases only

### **Phase 4: Testing & Validation** ⏱️ ~5-10 minutes
- 🧪 **Integration Tests**: API and service connectivity
- 💨 **Smoke Tests**: Basic functionality verification
- ⚡ **Performance Tests**: Load and response time validation

## 🌍 **Environment Configuration**

### **Development Environment**
```yaml
environment: development
cost_limit: $100/month
max_instance_size: medium
auto_cleanup: 7 days
approval_required: false
```

**Features:**
- Ephemeral environments per PR
- Automatic cleanup after PR closure
- Cost-optimized resource sizes
- Relaxed security gates

### **Staging Environment**
```yaml
environment: staging
cost_limit: $500/month
max_instance_size: large
auto_cleanup: 30 days
approval_required: false
```

**Features:**
- Production-like configuration
- Performance testing enabled
- Moderate security gates
- Longer retention period

### **Production Environment**
```yaml
environment: production
cost_limit: $2000/month
max_instance_size: xlarge
auto_cleanup: never
approval_required: true
min_approvers: 2
```

**Features:**
- Strict security gates (zero critical threats)
- Manual approval required
- Full monitoring and alerting
- Rollback capabilities

## 🔒 **Security Integration**

### **Threat Model Analysis**
Every deployment includes automatic threat modeling:

```bash
# Analyze security threats
npm run pipeline:analyze-threats production

# Example output:
{
  "canDeploy": false,
  "warnings": ["❌ Cannot deploy with 2 critical threats"],
  "stats": {
    "critical": 2,
    "high": 5,
    "securityWarnings": 3
  }
}
```

### **Security Gates by Environment**

| Environment | Critical Threats | High Threats | Action |
|-------------|------------------|--------------|--------|
| Development | ≤ 5 | Any | Warn only |
| Staging | ≤ 2 | ≤ 10 | Block deployment |
| Production | 0 | ≤ 5 | Block deployment |

### **Required Security Controls**
- ✅ Encryption at rest
- ✅ Network isolation (VPC)
- ✅ IAM least privilege
- ✅ Audit logging enabled

## 💰 **Cost Management**

### **Cost Estimation**
```bash
npm run pipeline:estimate-costs

# Example output:
{
  "estimatedMonthlyCost": 245,
  "totalResources": 15,
  "breakdown": {
    "RDS": 1,
    "Lambda": 3,
    "S3": 2,
    "DynamoDB": 1
  }
}
```

### **Cost Controls**
- 🚨 **Alert Thresholds**: Warn when approaching limits
- 🛑 **Hard Limits**: Block deployment if over budget
- 📊 **Resource Optimization**: Suggest cost-saving measures
- 🕐 **Auto-shutdown**: Dev environments outside business hours

## 📊 **Pipeline Outputs**

### **PR Comments**
Every PR gets a detailed deployment summary:

```markdown
## 🚀 Development Deployment Complete

**Environment:** Development (PR #123)
**Deployment URL:** https://dev-pr-123.lattice-demo.com
**Estimated Cost:** $45/month

### 🔒 Security Analysis
- ✅ No critical threats detected
- ⚠️ 2 Security warnings - See threat model

### 📊 Infrastructure Summary
- ✅ All resources deployed successfully
- ✅ Integration tests passed
- ✅ Cost controls applied
```

### **Artifacts**
- 📋 **Threat Model**: `THREAT_MODEL.md` and `threat-model.json`
- 📊 **Deployment Summary**: `deployment-summary.json`
- 🔍 **Security Report**: `security-report.md`
- 📝 **CDK Synthesis**: Complete CloudFormation templates

## 🛠️ **Local Development**

### **Pre-commit Validation**
```bash
npm run pre-commit
# Runs: lint + format:check + test
```

### **Pre-deployment Check**
```bash
npm run pre-deploy
# Runs: build + test + synth + analyze-threats
```

### **Manual Security Scan**
```bash
npm run security:scan
# Runs: audit + analyze-threats
```

## 🚨 **Troubleshooting**

### **Common Issues**

**❌ Critical threats blocking deployment**
```bash
# View threat details
cat cdk.out/THREAT_MODEL.md

# Fix security issues and re-run
npm run pipeline:analyze-threats production
```

**❌ Cost limit exceeded**
```bash
# Check cost breakdown
npm run pipeline:estimate-costs

# Optimize resources or increase limit
```

**❌ Tests failing**
```bash
# Run tests locally
npm run test

# Run specific test types
npm run test:integration
npm run test:smoke
```

### **Pipeline Configuration**

Edit `.lattice/pipeline-config.yml` to customize:
- Environment settings
- Security thresholds
- Cost limits
- Notification preferences

### **Environment Variables**

Required secrets in GitHub:
```bash
AWS_DEV_ACCESS_KEY_ID
AWS_DEV_SECRET_ACCESS_KEY
AWS_STAGING_ACCESS_KEY_ID
AWS_STAGING_SECRET_ACCESS_KEY
AWS_PROD_ACCESS_KEY_ID
AWS_PROD_SECRET_ACCESS_KEY
```

Optional:
```bash
SLACK_WEBHOOK_URL      # For notifications
NOTIFICATION_EMAIL     # For alerts
```

## 📈 **Metrics & Monitoring**

The pipeline tracks:
- 📊 **Deployment Success Rate**: % of successful deployments
- ⏱️ **Pipeline Duration**: Time from commit to deployment
- 🔒 **Security Posture**: Threat trends over time
- 💰 **Cost Trends**: Infrastructure cost changes
- 🧪 **Test Coverage**: Code and infrastructure testing

## 🔄 **Continuous Improvement**

The pipeline automatically:
- 📊 **Collects metrics** on deployment performance
- 🔍 **Identifies bottlenecks** and optimization opportunities
- 📈 **Tracks security improvements** over time
- 💡 **Suggests optimizations** for cost and performance

## 🤝 **Contributing**

To improve the pipeline:
1. Update workflow files in `.github/workflows/`
2. Modify configuration in `.lattice/pipeline-config.yml`
3. Enhance utilities in `scripts/pipeline-utils.js`
4. Test changes in development environment first

The CI/CD pipeline is designed to be:
- **Secure by default**: Every deployment includes security analysis
- **Cost-aware**: Automatic cost controls and optimization
- **Developer-friendly**: Fast feedback and clear error messages
- **Production-ready**: Robust deployment with rollback capabilities