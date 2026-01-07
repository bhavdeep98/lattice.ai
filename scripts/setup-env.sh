#!/bin/bash

# Lattice Environment Setup Script
# Helps users configure their OpenAI API key

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Lattice Environment Setup${NC}"
echo ""

# Check if .env already exists
if [ -f ".env" ]; then
    echo -e "${YELLOW}📄 .env file already exists${NC}"
    
    # Check if OpenAI key is configured
    if grep -q "OPENAI_API_KEY=your-openai-key-here" .env || ! grep -q "OPENAI_API_KEY=" .env; then
        echo -e "${YELLOW}⚠️ OpenAI API key needs to be configured${NC}"
        NEEDS_SETUP=true
    else
        echo -e "${GREEN}✅ OpenAI API key appears to be configured${NC}"
        NEEDS_SETUP=false
    fi
else
    echo -e "${YELLOW}📄 Creating .env file...${NC}"
    cp .env.example .env 2>/dev/null || cat > .env << 'EOF'
# Lattice AWS CDK Environment Variables

# OpenAI API Key for Lattice AI Agent
# Get your key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=your-openai-key-here

# AWS Configuration (optional - uses AWS CLI config by default)
# AWS_DEFAULT_REGION=us-east-1
# AWS_PROFILE=default

# Deployment Configuration
# ENVIRONMENT=prod
EOF
    NEEDS_SETUP=true
fi

if [ "$NEEDS_SETUP" = true ]; then
    echo ""
    echo -e "${YELLOW}🔑 OpenAI API Key Setup${NC}"
    echo -e "${BLUE}1. Go to: https://platform.openai.com/api-keys${NC}"
    echo -e "${BLUE}2. Create a new API key${NC}"
    echo -e "${BLUE}3. Copy the key${NC}"
    echo ""
    
    read -p "Enter your OpenAI API key: " -r OPENAI_KEY
    
    if [ ! -z "$OPENAI_KEY" ] && [ "$OPENAI_KEY" != "your-openai-key-here" ]; then
        # Update .env file
        if grep -q "OPENAI_API_KEY=" .env; then
            # Replace existing line
            sed -i.bak "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$OPENAI_KEY/" .env
        else
            # Add new line
            echo "OPENAI_API_KEY=$OPENAI_KEY" >> .env
        fi
        
        echo -e "${GREEN}✅ OpenAI API key configured successfully${NC}"
        
        # Clean up backup file
        rm -f .env.bak
    else
        echo -e "${YELLOW}⚠️ No API key entered. You can edit .env manually later.${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Environment setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "${BLUE}1. Verify your AWS credentials: aws sts get-caller-identity${NC}"
echo -e "${BLUE}2. Deploy Lattice: npm run deploy:complete${NC}"
echo ""
echo -e "${YELLOW}💡 Your .env file contains sensitive information and is excluded from git${NC}"