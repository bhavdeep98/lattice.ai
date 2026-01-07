#!/bin/bash

# Complete Lattice Platform Deployment Script
# Deploys both frontend (website) and backend (API) to AWS

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
FRONTEND_STACK="LatticeFrontend-${ENVIRONMENT}"
BACKEND_STACK="LatticeBackend-${ENVIRONMENT}"

echo -e "${BLUE}🚀 Deploying Complete Lattice Platform to AWS${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Region: ${REGION}${NC}"
echo -e "${BLUE}Frontend Stack: ${FRONTEND_STACK}${NC}"
echo -e "${BLUE}Backend Stack: ${BACKEND_STACK}${NC}"
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

# Check for OpenAI API key
if [ -z "$OPENAI_API_KEY" ]; then
    # Try to load from root .env file first
    if [ -f ".env" ]; then
        echo -e "${YELLOW}📄 Loading environment variables from .env${NC}"
        export $(grep -v '^#' .env | grep -v '^$' | xargs)
    fi
    
    # Then try website/.env as fallback
    if [ -z "$OPENAI_API_KEY" ] && [ -f "website/.env" ]; then
        echo -e "${YELLOW}📄 Loading environment variables from website/.env${NC}"
        export $(grep -v '^#' website/.env | grep -v '^$' | xargs)
    fi
    
    # Check again after loading .env files
    if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "your-openai-key-here" ]; then
        echo -e "${RED}❌ OPENAI_API_KEY not configured properly.${NC}"
        echo -e "${YELLOW}Please update your OpenAI API key in .env or website/.env:${NC}"
        echo -e "${YELLOW}OPENAI_API_KEY=your-actual-openai-api-key${NC}"
        echo ""
        echo -e "${YELLOW}Get your API key from: https://platform.openai.com/api-keys${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ OpenAI API key loaded from .env file${NC}"
    fi
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

# Synthesize the stacks
echo -e "${YELLOW}🔄 Synthesizing CDK stacks...${NC}"
cdk synth -a "node lib/deploy-complete-lattice.js" \
    --context environment=$ENVIRONMENT \
    --context openaiApiKey=$OPENAI_API_KEY

# Deploy the stacks
echo -e "${YELLOW}🚀 Deploying to AWS...${NC}"
echo -e "${YELLOW}This will deploy both frontend and backend...${NC}"

cdk deploy -a "node lib/deploy-complete-lattice.js" \
    --all \
    --context environment=$ENVIRONMENT \
    --context openaiApiKey=$OPENAI_API_KEY \
    --require-approval never \
    --outputs-file complete-lattice-outputs.json

# Get the deployment outputs
if [ -f "complete-lattice-outputs.json" ]; then
    FRONTEND_URL=$(cat complete-lattice-outputs.json | jq -r ".[\"$FRONTEND_STACK\"].WebsiteURL // empty")
    BACKEND_URL=$(cat complete-lattice-outputs.json | jq -r ".[\"$BACKEND_STACK\"].ApiUrl // empty")
    DISTRIBUTION_ID=$(cat complete-lattice-outputs.json | jq -r ".[\"$FRONTEND_STACK\"].DistributionId // empty")
    
    # Inject backend URL into frontend and redeploy
    if [ ! -z "$BACKEND_URL" ]; then
        echo -e "${YELLOW}🔧 Updating frontend with backend URL...${NC}"
        node scripts/inject-backend-url.js "$BACKEND_URL"
        
        # Redeploy frontend with updated configuration
        echo -e "${YELLOW}🔄 Redeploying frontend with backend configuration...${NC}"
        cdk deploy -a "node lib/deploy-complete-lattice.js" $FRONTEND_STACK \
            --context environment=$ENVIRONMENT \
            --context openaiApiKey=$OPENAI_API_KEY \
            --require-approval never \
            --outputs-file frontend-redeploy-outputs.json
        
        echo -e "${GREEN}✅ Frontend updated with backend URL${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Complete Lattice Platform Deployed Successfully!${NC}"
    echo ""
    echo -e "${GREEN}🌐 Frontend (Website): ${FRONTEND_URL}${NC}"
    echo -e "${GREEN}🔗 Backend (API): ${BACKEND_URL}${NC}"
    echo -e "${GREEN}📊 CloudFront Distribution ID: ${DISTRIBUTION_ID}${NC}"
    echo ""
    echo -e "${BLUE}📋 What's Live:${NC}"
    echo -e "${BLUE}✅ Landing page with full Lattice showcase${NC}"
    echo -e "${BLUE}✅ Interactive demo with AI-powered infrastructure generation${NC}"
    echo -e "${BLUE}✅ Real Lattice framework demo (fully functional)${NC}"
    echo -e "${BLUE}✅ Documentation and pricing pages${NC}"
    echo -e "${BLUE}✅ Serverless backend with OpenAI integration${NC}"
    echo -e "${BLUE}✅ Global CDN with HTTPS${NC}"
    echo ""
    echo -e "${BLUE}🧪 Test Your Platform:${NC}"
    echo -e "${BLUE}1. Visit: ${FRONTEND_URL}${NC}"
    echo -e "${BLUE}2. Try the demo: ${FRONTEND_URL}/real-lattice-demo.html${NC}"
    echo -e "${BLUE}3. Test API health: ${BACKEND_URL}api/health${NC}"
    echo ""
    
    # Save deployment info
    cat > complete-deployment-info.json << EOF
{
  "environment": "$ENVIRONMENT",
  "region": "$REGION",
  "frontendStack": "$FRONTEND_STACK",
  "backendStack": "$BACKEND_STACK",
  "frontendUrl": "$FRONTEND_URL",
  "backendUrl": "$BACKEND_URL",
  "distributionId": "$DISTRIBUTION_ID",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "openaiConfigured": true
}
EOF
    
    echo -e "${GREEN}💾 Deployment info saved to complete-deployment-info.json${NC}"
    
    # Test the backend
    echo -e "${YELLOW}🧪 Testing backend health...${NC}"
    if curl -s "${BACKEND_URL}api/health" > /dev/null; then
        echo -e "${GREEN}✅ Backend is responding${NC}"
    else
        echo -e "${YELLOW}⚠️ Backend might still be starting up (this is normal)${NC}"
    fi
    
else
    echo -e "${RED}❌ Could not retrieve deployment outputs${NC}"
    exit 1
fi

# Optional: Open website in browser (macOS/Linux)
if command -v open &> /dev/null; then
    read -p "🌐 Open your live Lattice platform in browser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$FRONTEND_URL"
    fi
elif command -v xdg-open &> /dev/null; then
    read -p "🌐 Open your live Lattice platform in browser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open "$FRONTEND_URL"
    fi
fi

echo ""
echo -e "${GREEN}✨ Complete Lattice Platform is now live on AWS! ✨${NC}"
echo -e "${GREEN}🎯 Share your live demo: ${FRONTEND_URL}${NC}"
echo -e "${GREEN}💰 Estimated monthly cost: \$2-5 (frontend + backend)${NC}"