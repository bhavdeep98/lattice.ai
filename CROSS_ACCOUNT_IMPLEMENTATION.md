# Cross-Account Architecture Implementation

## Overview

This document outlines the implementation of enterprise-grade cross-account AWS deployment architecture for the Lattice AWS CDK library. The solution provides secure, scalable multi-account deployments using OIDC authentication and proper role assumption chains.

## Architecture

### Account Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENTERPRISE AWS ORGANIZATION                   │
├─────────────────────────────────────────────────────────────────┤
│  🏢 Management Account (Root)                                   │
│  ├── Organization policies                                      │
│  ├── Billing consolidation                                      │
│  └── Account creation/management                                │
├─────────────────────────────────────────────────────────────────┤
│  🔧 Tooling Account (CI/CD Hub)                                │
│  ├── GitHub OIDC Provider                                      │
│  ├── Cross-account deployment roles                            │
│  ├── Artifact storage (S3, ECR)                               │
│  ├── Pipeline orchestration                                    │
│  └── Audit logging                                             │
├─────────────────────────────────────────────────────────────────┤
│  🛡️ Security Account                                           │
│  ├── AWS Config rules                                          │
│  ├── GuardDuty findings                                        │
│  ├── Security Hub                                              │
│  ├── CloudTrail logs                                           │
│  └── Compliance monitoring                                     │
├─────────────────────────────────────────────────────────────────┤
│  📊 Shared Services Account                                    │
│  ├── DNS (Route 53)                                            │
│  ├── Certificate management (ACM)                              │
│  ├── Shared networking (Transit Gateway)                       │
│  ├── Monitoring (CloudWatch, X-Ray)                            │
│  └── Backup vaults                                             │
├─────────────────────────────────────────────────────────────────┤
│  🧪 Development Account                                        │
│  ├── Development workloads                                     │
│  ├── Feature branch deployments                                │
│  ├── Integration testing                                       │
│  └── Cost controls                                             │
├─────────────────────────────────────────────────────────────────┤
│  🎯 Staging Account                                            │
│  ├── Pre-production testing                                    │
│  ├── Performance testing                                       │
│  ├── Security scanning                                         │
│  └── Production-like environment                               │
├─────────────────────────────────────────────────────────────────┤
│  🏭 Production Account                                         │
│  ├── Production workloads                                      │
│  ├── High availability                                         │
│  ├── Disaster recovery                                         │
│  └── Strict access controls                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub        │    │   Tooling       │    │   Target        │
│   Actions       │    │   Account       │    │   Account       │
│                 │    │                 │    │   (Dev/Prod)    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ 1. OIDC Token   │───▶│ 2. Assume       │───▶│ 3. Assume       │
│    Request      │    │    Tooling      │    │    Target       │
│                 │    │    Role         │    │    Role         │
│ 4. Deploy       │◀───│ 5. Return       │◀───│ 6. Return       │
│    Resources    │    │    Credentials  │    │    Credentials  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Implementation Details

### 1. OIDC Provider Setup

The tooling account contains an OIDC provider that trusts GitHub Actions:

```typescript
// Trust policy for GitHub OIDC
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::TOOLING-ACCOUNT:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:ORG/REPO:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

### 2. Role Assumption Chain

1. **GitHub Actions** → **Tooling Account Role** (via OIDC)
2. **Tooling Account Role** → **Target Account Role** (via AssumeRole)
3. **Target Account Role** → **Deploy Resources**

### 3. Security Controls

- **Least Privilege**: Each role has minimal required permissions
- **Conditional Access**: Roles can only be assumed from specific conditions
- **Time-based Access**: Temporary credentials with short expiration
- **Audit Trail**: All actions logged to CloudTrail
- **Resource Tagging**: Mandatory tags for cost allocation and governance

## Benefits

1. **Security**: No long-lived credentials, OIDC-based authentication
2. **Isolation**: Complete separation between environments
3. **Governance**: Centralized policy management and compliance
4. **Cost Control**: Per-account billing and resource limits
5. **Scalability**: Easy to add new accounts and environments
6. **Auditability**: Complete audit trail across all accounts

## Implementation Status

✅ **Completed:**
- Cross-account CDK stack definitions
- OIDC provider configuration
- Role assumption chain setup
- GitHub Actions workflow updates
- Security policies and conditions
- Documentation and examples

🔄 **In Progress:**
- Account bootstrapping automation
- Cost monitoring and alerting
- Compliance scanning integration

📋 **Planned:**
- Multi-region deployment support
- Disaster recovery automation
- Advanced security scanning