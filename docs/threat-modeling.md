# Lattice Threat Modeling

Lattice automatically generates threat models for your AWS architectures at synth-time, providing both human-readable reports and machine-readable artifacts for security automation.

## Overview

When you enable threat modeling in Lattice, every `cdk synth` operation will:

1. **Analyze your architecture** - Collect security-relevant facts from CDK constructs
2. **Infer workload patterns** - Detect if you're building a serverless API, data pipeline, GenAI/RAG system, etc.
3. **Generate contextual threats** - Apply STRIDE methodology with workload-specific threat templates
4. **Output artifacts** - Create both Markdown reports and JSON for automation

## Quick Start

Enable threat modeling in your Lattice aspects configuration:

```typescript
import { applyLatticeAspects } from 'lattice-aws-cdk';

applyLatticeAspects(stack, {
  environment: 'prod',
  projectName: 'MyApp',
  owner: 'Engineering',
  threatModel: {
    enabled: true,
    formats: ['md', 'json'],
    projectName: 'Customer API',
  },
});
```

Run synthesis to generate threat models:

```bash
cdk synth
```

Find your threat models in:

- `cdk.out/THREAT_MODEL.md` - Human-readable report
- `cdk.out/threat-model.json` - Machine-readable data

## Supported Workload Types

Lattice automatically detects and applies specialized threat templates for:

### 🚀 Serverless API

**Pattern:** API Gateway + Lambda + DynamoDB
**Key Threats:** Authentication bypass, injection attacks, rate limiting, privilege escalation

### 📊 Data Pipeline

**Pattern:** S3 + Glue/EMR + Step Functions + Redshift
**Key Threats:** Data tampering, PII exposure, source spoofing, resource exhaustion

### 🤖 GenAI/RAG

**Pattern:** Bedrock/SageMaker + Vector Store + S3
**Key Threats:** Prompt injection, cross-tenant leakage, vector poisoning, cost abuse

### 🏗️ General Cloud App

**Fallback:** Any other architecture pattern
**Key Threats:** Basic cloud security fundamentals

## Threat Model Structure

Each generated threat model includes:

### 📋 Executive Summary

- Risk distribution (Critical/High/Medium/Low)
- Architecture overview
- Resource inventory

### 🛡️ STRIDE Analysis

Threats organized by category:

- **Spoofing** - Identity verification failures
- **Tampering** - Data integrity violations
- **Repudiation** - Audit trail gaps
- **Information Disclosure** - Data exposure risks
- **Denial of Service** - Availability threats
- **Elevation of Privilege** - Access control bypasses

### ✅ Security Checklist

Automated checks for:

- Encryption at rest status
- Public endpoint security
- CloudTrail logging
- IAM policy compliance

### ❓ Open Questions

Context-aware questions for security review:

- Data classification requirements
- Compliance framework applicability
- Incident response procedures

## Configuration Options

```typescript
threatModel: {
  enabled: boolean;           // Enable/disable threat modeling
  outputDir?: string;         // Output directory (default: "cdk.out")
  formats?: ("md" | "json")[]; // Output formats (default: ["md"])
  projectName?: string;       // Custom project name for reports
}
```

## Integration with CI/CD

### Basic Integration

```bash
# Generate threat models during build
cdk synth

# Check for critical threats
if grep -q "🔴.*Critical" cdk.out/THREAT_MODEL.md; then
  echo "❌ Critical threats found - review required"
  exit 1
fi
```

### Advanced Integration

```javascript
// Parse JSON for automated security gates
const threatModel = JSON.parse(fs.readFileSync('cdk.out/threat-model.json'));
const criticalThreats = threatModel.threats.filter((t) => t.risk === 'Critical');

if (criticalThreats.length > 0) {
  console.error(`❌ ${criticalThreats.length} critical threats found`);
  process.exit(1);
}
```

## Examples

See `examples/threat-model-examples.ts` for complete examples of:

- Serverless API with authentication threats
- Data pipeline with PII exposure risks
- GenAI RAG with prompt injection concerns

## Customization

The threat modeling system is designed to be:

- **Deterministic** - Same architecture = same threats
- **Extensible** - Add custom threat templates
- **Stable** - Consistent output for diffing/automation

For custom threat templates or advanced configuration, see the source code in `src/threat-model/`.

## Best Practices

1. **Enable early** - Add threat modeling from the start of your project
2. **Review regularly** - Threat models change as architecture evolves
3. **Integrate with security review** - Use open questions to guide manual review
4. **Automate gates** - Fail builds on critical threats without mitigations
5. **Version control** - Track threat model changes alongside code

## Limitations

Current limitations (contributions welcome!):

- Heuristic-based workload detection (not perfect)
- Limited to AWS CDK constructs (no runtime analysis)
- Generic threat templates (not application-specific)
- No custom threat rule engine (yet)

The goal is "good enough" threat modeling that's better than none, generated automatically at synth-time.
