#!/bin/bash

# Test Lattice Website Deployment
# This script tests the deployment without actually deploying

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🧪 Testing Lattice Website Deployment Setup${NC}"
echo ""

# Test 1: Check if all required files exist
echo -e "${YELLOW}📋 Checking required files...${NC}"

required_files=(
    "website/index.html"
    "src/website-deployment-stack.ts"
    "src/deploy-website.ts"
    "scripts/deploy-website.sh"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file (missing)${NC}"
        exit 1
    fi
done

# Test 2: Check Node.js dependencies
echo -e "${YELLOW}📦 Checking dependencies...${NC}"
if [ -f "package.json" ]; then
    echo -e "${GREEN}✅ package.json found${NC}"
    
    # Check if aws-cdk-lib is in dependencies
    if grep -q "aws-cdk-lib" package.json; then
        echo -e "${GREEN}✅ aws-cdk-lib dependency found${NC}"
    else
        echo -e "${RED}❌ aws-cdk-lib dependency missing${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ package.json not found${NC}"
    exit 1
fi

# Test 3: Check TypeScript compilation
echo -e "${YELLOW}🏗️ Testing TypeScript compilation...${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
else
    echo -e "${RED}❌ TypeScript compilation failed${NC}"
    echo "Run 'npm run build' to see detailed errors"
    exit 1
fi

# Test 4: Check CDK synthesis (dry run)
echo -e "${YELLOW}🔄 Testing CDK synthesis...${NC}"
if npx cdk synth -a "node lib/deploy-website.js" LatticeWebsite-test --context environment=test > /dev/null 2>&1; then
    echo -e "${GREEN}✅ CDK synthesis successful${NC}"
else
    echo -e "${RED}❌ CDK synthesis failed${NC}"
    echo "Run the synthesis command manually to see errors:"
    echo "npx cdk synth -a 'node lib/deploy-website.js' LatticeWebsite-test --context environment=test"
    exit 1
fi

# Test 5: Check website files
echo -e "${YELLOW}🌐 Checking website files...${NC}"
website_files=(
    "website/index.html"
    "website/styles.css"
    "website/script.js"
    "website/real-lattice-demo.html"
    "website/documentation.html"
)

for file in "${website_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${YELLOW}⚠️ $file (optional)${NC}"
    fi
done

# Test 6: Estimate deployment size
echo -e "${YELLOW}📊 Analyzing website size...${NC}"
if [ -d "website" ]; then
    WEBSITE_SIZE=$(du -sh website | cut -f1)
    echo -e "${GREEN}✅ Website size: $WEBSITE_SIZE${NC}"
    
    # Count files
    FILE_COUNT=$(find website -type f | wc -l)
    echo -e "${GREEN}✅ Total files: $FILE_COUNT${NC}"
else
    echo -e "${RED}❌ Website directory not found${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All tests passed! Ready for deployment.${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo -e "${YELLOW}1. Configure AWS credentials: aws configure${NC}"
echo -e "${YELLOW}2. Deploy to AWS: npm run deploy:website${NC}"
echo -e "${YELLOW}3. Test your live website${NC}"
echo ""
echo -e "${GREEN}💰 Estimated AWS cost: \$0.50-\$2.00/month${NC}"