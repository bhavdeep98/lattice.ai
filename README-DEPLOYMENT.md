# 🚀 Lattice Website Deployment Guide

This guide will help you deploy the Lattice website to AWS using CDK.

## 🎯 Quick Start

### Option 1: Automated Script (Recommended)
```bash
# Deploy to production
npm run deploy:website

# Deploy to staging
npm run deploy:website:staging
```

### Option 2: Manual CDK Commands
```bash
# Build and deploy
npm run build
cdk deploy -a "node bin/deploy-website.js" LatticeWebsite-prod
```

## 📋 Prerequisites

### 1. AWS Account Setup
- AWS account with appropriate permissions
- AWS CLI installed and configured
- CDK CLI installed globally: `npm install -g aws-cdk`

### 2. Required AWS Permissions
Your AWS user/role needs these permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:*",
        "cloudfront:*",
        "iam:*",
        "cloudformation:*",
        "lambda:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3. Environment Setup
```bash
# Install dependencies
npm install

# Configure AWS credentials
aws configure
# OR set environment variables:
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
export AWS_DEFAULT_REGION=us-east-1
```

## 🏗️ Architecture

The deployment creates:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudFront    │────│   S3 Bucket      │────│   Website       │
│   Distribution  │    │   (Private)      │    │   Files         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│   Users         │
│   (Global)      │
└─────────────────┘
```

### Components:
- **S3 Bucket**: Stores website files (private, no public access)
- **CloudFront**: Global CDN for fast content delivery
- **Origin Access Control**: Secure access from CloudFront to S3
- **SSL Certificate**: Automatic HTTPS via AWS Certificate Manager

## 💰 Cost Breakdown

| Component | Monthly Cost | Details |
|-----------|--------------|---------|
| S3 Storage | ~$0.001 | 50MB website files |
| S3 Requests | ~$0.0004 | GET requests |
| CloudFront | ~$0.85 | 10GB data transfer |
| **Total** | **~$0.85/month** | For typical startup traffic |

## 🚀 Deployment Steps

### Step 1: Initial Deployment
```bash
# Clone and setup
git clone <your-repo>
cd lattice-aws-cdk
npm install

# Deploy website
npm run deploy:website
```

### Step 2: Verify Deployment
```bash
# The script will output:
# ✅ Website URL: https://d1234567890.cloudfront.net
# ✅ Distribution ID: E1234567890ABC

# Test the website
curl -I https://your-cloudfront-url.cloudfront.net
```

### Step 3: Custom Domain (Optional)
```bash
# Deploy with custom domain
cdk deploy -a "node bin/deploy-website.js" LatticeWebsite-prod \
  --context domainName=lattice.dev \
  --context certificateArn=arn:aws:acm:us-east-1:123456789:certificate/abc-123
```

## 🔄 CI/CD Deployment

### GitHub Actions Setup
1. **Add AWS credentials to GitHub Secrets:**
   ```
   AWS_ACCESS_KEY_ID
   AWS_SECRET_ACCESS_KEY
   ```

2. **Or use OIDC (Recommended):**
   ```
   AWS_ROLE_ARN: arn:aws:iam::123456789:role/GitHubActionsRole
   ```

3. **Push to main branch:**
   ```bash
   git add .
   git commit -m "Deploy Lattice website"
   git push origin main
   ```

The GitHub Action will automatically:
- ✅ Build the project
- ✅ Deploy to AWS
- ✅ Test the deployment
- ✅ Comment with the live URL

## 🛠️ Management Commands

### Update Website Content
```bash
# After making changes to website/ folder
npm run deploy:website
```

### View Stack Information
```bash
# List all stacks
cdk list -a "node bin/deploy-website.js"

# View stack details
aws cloudformation describe-stacks --stack-name LatticeWebsite-prod
```

### Invalidate CloudFront Cache
```bash
# Get distribution ID from deployment output
DISTRIBUTION_ID="E1234567890ABC"

# Invalidate all files
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

### Monitor Costs
```bash
# View S3 costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

## 🔧 Troubleshooting

### Common Issues

**1. CDK Bootstrap Error**
```bash
# Solution: Bootstrap CDK
cdk bootstrap aws://ACCOUNT-ID/REGION
```

**2. Permission Denied**
```bash
# Solution: Check AWS credentials
aws sts get-caller-identity
```

**3. S3 Bucket Already Exists**
```bash
# Solution: The bucket name is auto-generated with account ID
# If still conflicts, modify bucket name in website-deployment-stack.ts
```

**4. CloudFront Takes Time to Deploy**
```bash
# CloudFront distributions take 15-20 minutes to deploy
# This is normal AWS behavior
```

### Debugging Commands
```bash
# View CDK diff
cdk diff -a "node bin/deploy-website.js" LatticeWebsite-prod

# View synthesized template
cdk synth -a "node bin/deploy-website.js" LatticeWebsite-prod

# View stack events
aws cloudformation describe-stack-events --stack-name LatticeWebsite-prod
```

## 🔒 Security Best Practices

### Implemented Security Features:
- ✅ S3 bucket is private (no public access)
- ✅ CloudFront Origin Access Control (OAC)
- ✅ HTTPS redirect enforced
- ✅ Security headers configured
- ✅ Versioning enabled for rollbacks

### Additional Security (Optional):
```bash
# Enable AWS Config for compliance
# Set up CloudTrail for audit logging
# Configure AWS WAF for DDoS protection
```

## 📊 Monitoring & Alerts

### CloudWatch Metrics
The deployment automatically creates metrics for:
- CloudFront requests and errors
- S3 storage and requests
- Data transfer costs

### Set Up Alerts (Optional)
```bash
# Create cost alert
aws budgets create-budget \
  --account-id 123456789 \
  --budget file://budget-config.json
```

## 🌍 Custom Domain Setup

### Step 1: Get SSL Certificate
```bash
# Request certificate in us-east-1 (required for CloudFront)
aws acm request-certificate \
  --domain-name lattice.dev \
  --subject-alternative-names www.lattice.dev \
  --validation-method DNS \
  --region us-east-1
```

### Step 2: Deploy with Domain
```bash
cdk deploy -a "node bin/deploy-website.js" LatticeWebsite-prod \
  --context domainName=lattice.dev \
  --context certificateArn=arn:aws:acm:us-east-1:123:certificate/abc-123
```

### Step 3: Update DNS
```bash
# Point your domain to CloudFront distribution
# CNAME: lattice.dev -> d1234567890.cloudfront.net
```

## 🚀 Next Steps

After successful deployment:

1. **Test Everything**: Visit all pages and test functionality
2. **Set Up Monitoring**: CloudWatch dashboards and alerts
3. **Configure Analytics**: Google Analytics or AWS analytics
4. **SEO Optimization**: Submit sitemap, meta tags
5. **Performance Testing**: Load testing and optimization
6. **Backup Strategy**: Automated backups and disaster recovery

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review AWS CloudFormation events
3. Check GitHub Actions logs (if using CI/CD)
4. Contact: bhavdeepsachdeva@gmail.com

---

**🎉 Congratulations! Your Lattice website is now live on AWS with enterprise-grade infrastructure!**