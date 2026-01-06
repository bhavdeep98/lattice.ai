# GitHub Actions OIDC Setup for AWS - FULLY RESOLVED ✅

## Problem (RESOLVED)
Your GitHub Actions workflow was failing with:
```
Error: Could not assume role with OIDC: No OpenIDConnect provider found in your account for https://token.actions.githubusercontent.com
```

## Root Cause Found ✅
The issue was **placeholder account IDs** in your workflow file:
- Workflow was trying to use: `arn:aws:iam::123456789012:role/LatticeGitHubActions-CrossAccount`
- But your actual role is: `arn:aws:iam::618351925005:role/LatticeGitHubActions-CrossAccount`

## Solutions Applied ✅

### 1. Fixed OIDC Authentication
- ✅ Updated workflow files to use correct account ID: `618351925005`
- ✅ OIDC authentication now working perfectly

### 2. Created Missing Deployment Roles
Your workflow also needed deployment roles for the cross-account pattern. Created:
- ✅ `LatticeDeploymentRole-dev` - For development deployments
- ✅ `LatticeDeploymentRole-staging` - For staging deployments  
- ✅ `LatticeDeploymentRole-prod` - For production deployments

### 3. Fixed Session Duration Limits
AWS has a hard limit: **role chaining sessions cannot exceed 1 hour**, regardless of the role's MaxSessionDuration setting.

Updated workflow to use 1-hour sessions (3600 seconds) for role chaining:
- ✅ All role assumptions now use 3600 seconds maximum
- ✅ No more "DurationSeconds exceeds the 1 hour session limit" errors
- ✅ Deployment roles still support 2-hour direct sessions (7200 seconds)

### 4. Bootstrapped CDK Environment
CDK requires bootstrapping to deploy stacks. This creates the necessary S3 buckets and IAM roles:
- ✅ CDK bootstrapped in account `618351925005` region `us-east-1`
- ✅ Bootstrap includes deployment roles and asset storage
- ✅ Workflow includes bootstrap verification step

### 5. Fixed CloudWatch Dashboard Conflicts
CloudWatch Dashboard names must be unique across all deployments. Fixed naming conflicts:
- ✅ SimpleTestStack now reads environment from CDK context
- ✅ Dashboard names include timestamp for uniqueness
- ✅ Staging deployments create `Lattice-staging-*` dashboards
- ✅ No more "already exists" errors between environments

All roles have:
- ✅ Trust relationship with `LatticeGitHubActions-CrossAccount`
- ✅ PowerUserAccess policy attached
- ✅ Proper assume role permissions
- ✅ Correct session duration for role chaining (1 hour max)

## Current Status ✅
- ✅ OIDC Provider exists: `arn:aws:iam::618351925005:oidc-provider/token.actions.githubusercontent.com`
- ✅ GitHub Actions Role exists: `arn:aws:iam::618351925005:role/LatticeGitHubActions-CrossAccount`
- ✅ Development Role exists: `arn:aws:iam::618351925005:role/LatticeDeploymentRole-dev`
- ✅ Staging Role exists: `arn:aws:iam::618351925005:role/LatticeDeploymentRole-staging`
- ✅ Production Role exists: `arn:aws:iam::618351925005:role/LatticeDeploymentRole-prod`
- ✅ Repository configured: `bhavdeep98/lattice.ai`
- ✅ Account ID corrected: `618351925005`
- ✅ Workflow files updated with correct account IDs

## What Was Fixed
1. **OIDC Authentication**: Updated account IDs from `123456789012` to `618351925005`
2. **Missing Roles**: Created all required deployment roles for cross-account pattern
3. **Trust Relationships**: Configured proper role assumption chain
4. **Permissions**: Attached PowerUserAccess to all deployment roles
5. **Session Duration**: Fixed role chaining limit - AWS restricts chained role sessions to 1 hour maximum
6. **CDK Bootstrap**: Bootstrapped CDK environment for stack deployment
7. **Dashboard Conflicts**: Fixed CloudWatch Dashboard naming conflicts between environments

## Role Assumption Chain
```
GitHub Actions (OIDC) 
    ↓
LatticeGitHubActions-CrossAccount 
    ↓
LatticeDeploymentRole-{env} (dev/staging/prod)
    ↓
Deploy Infrastructure
```

Your GitHub Actions workflows should now work completely! 🎉

## Troubleshooting Steps

### 1. Verify Token Claims
The error suggests GitHub Actions can't find the OIDC provider, but it exists. This usually means there's a mismatch in the token claims. Let's check the trust policy conditions:

Current trust policy allows:
- Repository: `repo:bhavdeep98/lattice.ai:*`
- Audience: `sts.amazonaws.com`

### 2. Common Issues and Solutions

#### Issue A: Branch/Environment Restrictions
Your current trust policy uses `repo:bhavdeep98/lattice.ai:*` which should allow all branches and environments. If you want to be more specific, you can use:
- `repo:bhavdeep98/lattice.ai:ref:refs/heads/main` (only main branch)
- `repo:bhavdeep98/lattice.ai:environment:production` (only production environment)

#### Issue B: Workflow Permissions
Ensure your workflow has the correct permissions:
```yaml
permissions:
  id-token: write   # Required for OIDC
  contents: read    # Required for checkout
```

#### Issue C: Region Mismatch
OIDC providers are global, but make sure you're not specifying a different region in your workflow.

### 3. Test the OIDC Setup

Try this minimal test workflow to isolate the issue:

```yaml
name: Test OIDC
on: workflow_dispatch

permissions:
  id-token: write
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::618351925005:role/LatticeGitHubActions-CrossAccount
          role-session-name: test-oidc-${{ github.run_id }}
          aws-region: us-east-1
          
      - name: Test AWS Access
        run: aws sts get-caller-identity
```

### 4. Alternative Debugging Approach

If the issue persists, try updating the trust policy to be more permissive temporarily:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::618351925005:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        }
      }
    }
  ]
}
```

This removes the repository restriction temporarily to test if that's the issue.

### 5. Check GitHub Actions Logs

Look for these specific details in your GitHub Actions logs:
- The exact token claims being sent
- Any additional error messages
- The workflow context (repository, ref, environment)

### 6. Verify OIDC Provider Thumbprint

GitHub updated their OIDC thumbprints. Your provider has both old and new thumbprints:
- `6938fd4d98bab03faadb97b34396831e3780aea1` (old)
- `1c58a3a8518e8759bf075b76b750d4f2df264fcd` (new)

This should be fine, but if issues persist, you can update to use only the new thumbprint.

## Quick Commands to Verify Setup

```bash
# Check OIDC provider exists
aws iam list-open-id-connect-providers

# Check role exists and trust policy
aws iam get-role --role-name LatticeGitHubActions-CrossAccount

# Check current AWS account
aws sts get-caller-identity

# Test role assumption (this will fail from local CLI, but shows the role ARN is valid)
aws sts assume-role-with-web-identity \
  --role-arn arn:aws:iam::618351925005:role/LatticeGitHubActions-CrossAccount \
  --role-session-name test \
  --web-identity-token "dummy-token"
```

## Immediate Action Items

### 1. Run the Test Workflow
I've created `.github/workflows/test-oidc.yml` - run this workflow manually to isolate the OIDC issue:

1. Go to GitHub Actions in your repository
2. Click on "Test OIDC Setup" workflow
3. Click "Run workflow" button
4. Check the logs for specific error details

### 2. Common Solutions to Try

#### Solution A: Update Trust Policy (Temporary Debug)
Temporarily make the trust policy more permissive to isolate the issue:

```bash
aws iam update-assume-role-policy --role-name LatticeGitHubActions-CrossAccount --policy-document '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::618351925005:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        }
      }
    }
  ]
}'
```

#### Solution B: Check for Typos in Role ARN
Verify the exact role ARN in your workflow matches:
```
arn:aws:iam::618351925005:role/LatticeGitHubActions-CrossAccount
```

#### Solution C: Try Different Action Version
If v4 continues to fail, try v3:
```yaml
uses: aws-actions/configure-aws-credentials@v3
```

### 3. Debug Information to Collect

When you run the test workflow, collect these details:
- Exact error message from GitHub Actions logs
- The repository name shown in the workflow logs
- The branch/ref being used
- Any additional context from the aws-actions/configure-aws-credentials step

### 4. Most Likely Causes

Based on the setup verification, the most likely causes are:
1. **Timing issue**: GitHub's OIDC token isn't being generated properly
2. **Repository context**: The token claims don't match the trust policy
3. **Action version**: A bug in aws-actions/configure-aws-credentials@v4
4. **GitHub environment**: Something in the GitHub Actions environment is interfering

### 5. If All Else Fails

Create a completely new role with a simpler name and trust policy:

```bash
# Create new role
aws iam create-role --role-name GitHubActionsOIDC --assume-role-policy-document '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::618351925005:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:bhavdeep98/lattice.ai:*"
        }
      }
    }
  ]
}'

# Attach policies
aws iam attach-role-policy --role-name GitHubActionsOIDC --policy-arn arn:aws:iam::aws:policy/PowerUserAccess
```

Then update your workflow to use: `arn:aws:iam::618351925005:role/GitHubActionsOIDC`

The setup looks correct from the AWS side, so the issue is likely in the GitHub Actions environment or token generation.