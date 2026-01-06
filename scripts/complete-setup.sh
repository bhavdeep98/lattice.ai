#!/bin/bash

# Complete GitHub OIDC Setup Script
# This script creates a temporary IAM user, sets up OIDC, then cleans up

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Complete GitHub Actions OIDC Setup for AWS${NC}"
echo -e "${YELLOW}This script will:${NC}"
echo -e "  1. Create a temporary IAM user with minimal permissions"
echo -e "  2. Set up GitHub OIDC provider and role"
echo -e "  3. Clean up the temporary user and access keys"
echo

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq is not installed. Please install it first.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured or invalid.${NC}"
    echo -e "${YELLOW}Please run 'aws configure' with your AWS credentials first.${NC}"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS Account ID: $ACCOUNT_ID${NC}"

# Get GitHub repository
if [ -z "$GITHUB_REPOSITORY" ]; then
    echo -e "${YELLOW}📝 Please enter your GitHub repository (format: owner/repo):${NC}"
    read -r GITHUB_REPOSITORY
fi

if [ -z "$GITHUB_REPOSITORY" ]; then
    echo -e "${RED}❌ GitHub repository is required${NC}"
    exit 1
fi

echo -e "${GREEN}✅ GitHub Repository: $GITHUB_REPOSITORY${NC}"

# Step 1: Create temporary IAM user using CloudFormation
echo -e "${BLUE}🔧 Step 1: Creating temporary IAM user...${NC}"

STACK_NAME="lattice-setup-user-stack"

# Deploy the CloudFormation stack
aws cloudformation deploy \
    --template-file scripts/setup-iam-user.yaml \
    --stack-name "$STACK_NAME" \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --tags Purpose=GitHubOIDCSetup Temporary=true

echo -e "${GREEN}✅ Temporary IAM user created${NC}"

# Get the access keys from CloudFormation outputs
echo -e "${BLUE}🔑 Retrieving temporary access keys...${NC}"

TEMP_ACCESS_KEY=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`AccessKeyId`].OutputValue' \
    --output text)

TEMP_SECRET_KEY=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`SecretAccessKey`].OutputValue' \
    --output text)

if [ -z "$TEMP_ACCESS_KEY" ] || [ -z "$TEMP_SECRET_KEY" ]; then
    echo -e "${RED}❌ Failed to retrieve access keys from CloudFormation${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Temporary access keys retrieved${NC}"

# Step 2: Configure AWS CLI with temporary credentials
echo -e "${BLUE}🔧 Step 2: Configuring temporary AWS credentials...${NC}"

# Backup current AWS credentials
if [ -f ~/.aws/credentials ]; then
    cp ~/.aws/credentials ~/.aws/credentials.backup
    echo -e "${YELLOW}📋 Backed up existing AWS credentials${NC}"
fi

# Set temporary credentials
export AWS_ACCESS_KEY_ID="$TEMP_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$TEMP_SECRET_KEY"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}"

# Verify temporary credentials work
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Temporary credentials are not working${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Temporary credentials configured${NC}"

# Step 3: Set up OIDC provider and role
echo -e "${BLUE}🔧 Step 3: Setting up GitHub OIDC provider and role...${NC}"

# Check if OIDC provider already exists
PROVIDER_ARN="arn:aws:iam::$ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"

if aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$PROVIDER_ARN" &>/dev/null; then
    echo -e "${YELLOW}⚠️ OIDC provider already exists: $PROVIDER_ARN${NC}"
else
    echo -e "${BLUE}🔧 Creating OIDC provider...${NC}"
    aws iam create-open-id-connect-provider \
        --url https://token.actions.githubusercontent.com \
        --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 1c58a3a8518e8759bf075b76b750d4f2df264fcd \
        --client-id-list sts.amazonaws.com \
        --tags Key=Project,Value=Lattice Key=Component,Value=CI/CD
    
    echo -e "${GREEN}✅ OIDC provider created: $PROVIDER_ARN${NC}"
fi

# Create trust policy
TRUST_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "$PROVIDER_ARN"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:$GITHUB_REPOSITORY:*"
        }
      }
    }
  ]
}
EOF
)

# Create IAM role
ROLE_NAME="LatticeGitHubActions-CrossAccount"
echo -e "${BLUE}🔧 Creating IAM role: $ROLE_NAME${NC}"

# Check if role already exists
if aws iam get-role --role-name "$ROLE_NAME" &>/dev/null; then
    echo -e "${YELLOW}⚠️ Role already exists, updating trust policy...${NC}"
    aws iam update-assume-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-document "$TRUST_POLICY"
else
    # Create the role
    aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document "$TRUST_POLICY" \
        --description "Role for GitHub Actions to deploy Lattice infrastructure" \
        --max-session-duration 7200 \
        --tags Key=Project,Value=Lattice Key=Component,Value=CI/CD
    
    echo -e "${GREEN}✅ IAM role created: $ROLE_NAME${NC}"
fi

# Attach policies to the role
echo -e "${BLUE}🔧 Attaching policies to the role...${NC}"

# Attach PowerUserAccess for general AWS operations
aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/PowerUserAccess"

# Create and attach custom policy for cross-account operations
CROSS_ACCOUNT_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sts:AssumeRole",
        "sts:TagSession"
      ],
      "Resource": [
        "arn:aws:iam::*:role/LatticeDeploymentRole-*",
        "arn:aws:iam::*:role/OrganizationAccountAccessRole"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "organizations:DescribeOrganization",
        "organizations:ListAccounts"
      ],
      "Resource": "*"
    }
  ]
}
EOF
)

POLICY_NAME="LatticeGitHubActions-CrossAccountPolicy"
POLICY_ARN="arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME"

# Check if policy exists
if aws iam get-policy --policy-arn "$POLICY_ARN" &>/dev/null; then
    echo -e "${YELLOW}⚠️ Policy already exists, updating...${NC}"
    # Create a new version
    aws iam create-policy-version \
        --policy-arn "$POLICY_ARN" \
        --policy-document "$CROSS_ACCOUNT_POLICY" \
        --set-as-default
else
    # Create the policy
    aws iam create-policy \
        --policy-name "$POLICY_NAME" \
        --policy-document "$CROSS_ACCOUNT_POLICY" \
        --description "Cross-account permissions for Lattice GitHub Actions"
fi

# Attach the custom policy
aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "$POLICY_ARN"

echo -e "${GREEN}✅ Policies attached successfully${NC}"

# Step 4: Clean up temporary resources
echo -e "${BLUE}🧹 Step 4: Cleaning up temporary resources...${NC}"

# Unset temporary environment variables
unset AWS_ACCESS_KEY_ID
unset AWS_SECRET_ACCESS_KEY

# Restore original AWS credentials if they existed
if [ -f ~/.aws/credentials.backup ]; then
    mv ~/.aws/credentials.backup ~/.aws/credentials
    echo -e "${GREEN}✅ Original AWS credentials restored${NC}"
fi

# Delete the CloudFormation stack (this will delete the IAM user and access keys)
echo -e "${BLUE}🗑️ Deleting temporary IAM user and access keys...${NC}"
aws cloudformation delete-stack --stack-name "$STACK_NAME"

# Wait for stack deletion to complete
echo -e "${YELLOW}⏳ Waiting for cleanup to complete...${NC}"
aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" || {
    echo -e "${YELLOW}⚠️ Stack deletion timeout, but continuing...${NC}"
}

echo -e "${GREEN}✅ Temporary resources cleaned up${NC}"

# Output the results
ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME"
echo
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo
echo -e "${BLUE}📋 Configuration Summary:${NC}"
echo -e "   OIDC Provider: $PROVIDER_ARN"
echo -e "   IAM Role: $ROLE_ARN"
echo -e "   GitHub Repository: $GITHUB_REPOSITORY"
echo -e "   Account ID: $ACCOUNT_ID"
echo
echo -e "${YELLOW}📝 Your GitHub Actions workflow is now configured with:${NC}"
echo -e "   ${BLUE}GITHUB_ROLE_ARN: '$ROLE_ARN'${NC}"
echo -e "   ${BLUE}TOOLING_ACCOUNT_ID: '$ACCOUNT_ID'${NC}"
echo
echo -e "${GREEN}✅ Your GitHub Actions should now be able to authenticate with AWS using OIDC!${NC}"
echo -e "${GREEN}✅ All temporary access keys have been securely deleted.${NC}"
echo
echo -e "${YELLOW}🚀 Next steps:${NC}"
echo -e "1. Push a commit or create a PR to test the GitHub Actions workflow"
echo -e "2. Monitor the workflow run to ensure OIDC authentication works"
echo -e "3. If you need separate AWS accounts for dev/staging/prod, update the account IDs in your workflow"