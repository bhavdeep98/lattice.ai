#!/bin/bash

# Lattice Website Deployment Script
# This script deploys the Lattice website to AWS using CDK

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-prod}
REGION=${AWS_DEFAULT_REGION:-us-east-1}
STACK_NAME="LatticeWebsite-${ENVIRONMENT}"

echo -e "${BLUE}🚀 Deploying Lattice Website to AWS${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Region: ${REGION}${NC}"
echo -e "${BLUE}Stack: ${STACK_NAME}${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check if AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure'.${NC}"
    exit 1
fi

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo -e "${YELLOW}⚠️ CDK not found. Installing...${NC}"
    npm install -g aws-cdk
fi

# Check if Node.js dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

echo -e "${GREEN}✅ Prerequisites check complete${NC}"
echo ""

# Build the project
echo -e "${YELLOW}🏗️ Building project...${NC}"
npm run build

# Bootstrap CDK (if needed)
echo -e "${YELLOW}🔧 Checking CDK bootstrap...${NC}"
if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region $REGION &> /dev/null; then
    echo -e "${YELLOW}🚀 Bootstrapping CDK...${NC}"
    cdk bootstrap aws://$(aws sts get-caller-identity --query Account --output text)/$REGION
else
    echo -e "${GREEN}✅ CDK already bootstrapped${NC}"
fi

# Synthesize the stack
echo -e "${YELLOW}🔄 Synthesizing CDK stack...${NC}"
cdk synth -a "node lib/deploy-website.js" $STACK_NAME --context environment=$ENVIRONMENT

# Deploy the stack
echo -e "${YELLOW}🚀 Deploying to AWS...${NC}"
cdk deploy -a "node lib/deploy-website.js" $STACK_NAME \
    --context environment=$ENVIRONMENT \
    --require-approval never \
    --outputs-file website-outputs.json

# Get the website URL
if [ -f "website-outputs.json" ]; then
    WEBSITE_URL=$(cat website-outputs.json | jq -r ".[\"$STACK_NAME\"].WebsiteURL // empty")
    DISTRIBUTION_ID=$(cat website-outputs.json | jq -r ".[\"$STACK_NAME\"].DistributionId // empty")
    
    echo ""
    echo -e "${GREEN}🎉 Deployment successful!${NC}"
    echo -e "${GREEN}🌐 Website URL: ${WEBSITE_URL}${NC}"
    echo -e "${GREEN}📊 Distribution ID: ${DISTRIBUTION_ID}${NC}"
    echo ""
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo -e "${BLUE}1. Visit your website: ${WEBSITE_URL}${NC}"
    echo -e "${BLUE}2. Test all pages and functionality${NC}"
    echo -e "${BLUE}3. Set up monitoring and alerts${NC}"
    echo -e "${BLUE}4. Configure custom domain (optional)${NC}"
    echo ""
    
    # Save deployment info
    cat > deployment-info.json << EOF
{
  "environment": "$ENVIRONMENT",
  "region": "$REGION",
  "stackName": "$STACK_NAME",
  "websiteUrl": "$WEBSITE_URL",
  "distributionId": "$DISTRIBUTION_ID",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
    
    echo -e "${GREEN}💾 Deployment info saved to deployment-info.json${NC}"
else
    echo -e "${RED}❌ Could not retrieve deployment outputs${NC}"
    exit 1
fi

# Optional: Open website in browser (macOS/Linux)
if command -v open &> /dev/null; then
    read -p "🌐 Open website in browser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$WEBSITE_URL"
    fi
elif command -v xdg-open &> /dev/null; then
    read -p "🌐 Open website in browser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open "$WEBSITE_URL"
    fi
fi

echo -e "${GREEN}✨ Lattice is now live on AWS! ✨${NC}"