# 🚀 Quick Start: Deploy Lattice to AWS

Get your Lattice website live on AWS in under 10 minutes!

## ⚡ Super Quick Deployment

### Step 1: AWS Setup (2 minutes)
```bash
# Install AWS CLI (if not installed)
# macOS:
brew install awscli

# Configure AWS credentials
aws configure
# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key  
# - Default region: us-east-1
# - Output format: json
```

### Step 2: Deploy (5 minutes)
```bash
# Deploy Lattice website to AWS
npm run deploy:website

# That's it! 🎉
# The script will:
# ✅ Build the project
# ✅ Bootstrap CDK (if needed)
# ✅ Deploy to AWS
# ✅ Give you the live URL
```

### Step 3: Visit Your Live Site
```bash
# The deployment will output something like:
# 🌐 Website URL: https://d1234567890.cloudfront.net
# 
# Your Lattice website is now live! 🚀
```

## 🔧 What Gets Created

Your AWS deployment includes:

| Service | Purpose | Cost/Month |
|---------|---------|------------|
| **S3 Bucket** | Stores website files | ~$0.001 |
| **CloudFront** | Global CDN for fast delivery | ~$0.85 |
| **SSL Certificate** | HTTPS security | FREE |
| **Total** | Professional website hosting | **~$0.85** |

## 🌍 Features You Get

- ✅ **Global CDN**: Fast loading worldwide
- ✅ **HTTPS**: Automatic SSL certificates
- ✅ **Compression**: Optimized file delivery
- ✅ **Caching**: Smart cache policies
- ✅ **Security**: Private S3 + secure access
- ✅ **Scalability**: Handles traffic spikes automatically

## 🎯 Next Steps

### 1. Test Your Website
```bash
# Visit all pages:
# - Landing page: https://your-url.cloudfront.net
# - Demo: https://your-url.cloudfront.net/real-lattice-demo.html
# - Docs: https://your-url.cloudfront.net/documentation.html
```

### 2. Custom Domain (Optional)
```bash
# Get SSL certificate for your domain
aws acm request-certificate \
  --domain-name lattice.dev \
  --validation-method DNS \
  --region us-east-1

# Deploy with custom domain
cdk deploy -a "node lib/deploy-website.js" LatticeWebsite-prod \
  --context domainName=lattice.dev \
  --context certificateArn=arn:aws:acm:us-east-1:123:certificate/abc-123
```

### 3. Set Up CI/CD (Optional)
```bash
# Add AWS credentials to GitHub Secrets:
# AWS_ACCESS_KEY_ID
# AWS_SECRET_ACCESS_KEY

# Push to main branch - auto-deploys! 🚀
git push origin main
```

## 🛠️ Management Commands

### Update Website
```bash
# After making changes to website files:
npm run deploy:website
```

### View Deployment Info
```bash
# Check what's deployed:
cat deployment-info.json

# View AWS resources:
aws cloudformation describe-stacks --stack-name LatticeWebsite-prod
```

### Invalidate Cache (Force Update)
```bash
# Get distribution ID from deployment output
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"
```

## 🚨 Troubleshooting

### "AWS credentials not configured"
```bash
aws configure
# Enter your AWS access keys
```

### "CDK not found"
```bash
npm install -g aws-cdk
```

### "Permission denied"
```bash
# Your AWS user needs these permissions:
# - S3 (full access)
# - CloudFront (full access)
# - IAM (for CDK roles)
# - CloudFormation (for deployments)
```

### "Bucket already exists"
```bash
# The bucket name is auto-generated with your account ID
# This error is rare, but if it happens, the deployment will retry
```

## 💰 Cost Monitoring

### View Current Costs
```bash
# Check AWS billing dashboard
# Or use CLI:
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

### Set Up Cost Alerts
```bash
# Create budget alert for $5/month
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget '{
    "BudgetName": "LatticeWebsite",
    "BudgetLimit": {"Amount": "5", "Unit": "USD"},
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }'
```

## 🎉 Success!

Your Lattice website is now:
- 🌍 **Live globally** with CloudFront CDN
- 🔒 **Secure** with HTTPS and private S3
- ⚡ **Fast** with optimized caching
- 💰 **Cost-effective** at ~$0.85/month
- 🚀 **Scalable** to handle any traffic

**Share your live Lattice website and start getting users!** 

---

**Need help?** Contact: bhavdeepsachdeva@gmail.com