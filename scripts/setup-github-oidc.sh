#!/bin/bash

# Setup GitHub Actions OIDC Provider for AWS
# This script creates the necessary OIDC provider and IAM role for GitHub Actions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Setting up GitHub Actions OIDC Provider for AWS${NC}"
echo

# Check if required tools are installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq is not installed. Please install it first.${NC}"
    exit 1
fi

# Get current AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")
if [ -z "$ACCOUNT_ID" ]; then
    echo -e "${RED}❌ Unable to get AWS account ID. Please check your AWS credentials.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS Account ID: $ACCOUNT_ID${NC}"

# Get GitHub repository from environment or prompt
if [ -z "$GITHUB_REPOSITORY" ]; then
    echo -e "${YELLOW}📝 Please enter your GitHub repository (format: owner/repo):${NC}"
    read -r GITHUB_REPOSITORY
fi

if [ -z "$GITHUB_REPOSITORY" ]; then
    echo -e "${RED}❌ GitHub repository is required${NC}"
    exit 1
fi

echo -e "${GREEN}✅ GitHub Repository: $GITHUB_REPOSITORY${NC}"

# Check if OIDC provider already exists
echo -e "${BLUE}🔍 Checking if OIDC provider already exists...${NC}"
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

# Output the role ARN
ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME"
echo
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo
echo -e "${BLUE}📋 Configuration Summary:${NC}"
echo -e "   OIDC Provider: $PROVIDER_ARN"
echo -e "   IAM Role: $ROLE_ARN"
echo -e "   GitHub Repository: $GITHUB_REPOSITORY"
echo
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo -e "1. Update your GitHub Actions workflow with the correct role ARN:"
echo -e "   ${BLUE}GITHUB_ROLE_ARN: '$ROLE_ARN'${NC}"
echo
echo -e "2. Update your account IDs in the workflow:"
echo -e "   ${BLUE}TOOLING_ACCOUNT_ID: '$ACCOUNT_ID'${NC}"
echo
echo -e "3. Set up deployment roles in your target accounts (dev, staging, prod)"
echo
echo -e "${GREEN}✅ Your GitHub Actions should now be able to authenticate with AWS using OIDC!${NC}"