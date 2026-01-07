# 🚀 Deploy Complete Lattice Platform

Deploy both frontend and backend to AWS with full AI functionality.

## 📋 Prerequisites

### 1. OpenAI API Key (Required)
Add your OpenAI API key to the `.env` file:

```bash
# Edit .env file
OPENAI_API_KEY=your-actual-openai-api-key-here
```

Get your API key from: https://platform.openai.com/api-keys

### 2. AWS Credentials
```bash
aws configure
# Enter your AWS credentials
```

## 🚀 Deploy Complete Platform

```bash
# Deploy both frontend and backend
npm run deploy:complete

# The script will automatically:
# ✅ Read your OpenAI API key from .env file
# ✅ Deploy serverless backend (Lambda + API Gateway)
# ✅ Deploy frontend (S3 + CloudFront)
# ✅ Configure frontend to use deployed backend
# ✅ Set up HTTPS and global CDN
# ✅ Enable AI-powered infrastructure generation
```

## 🎯 What Gets Deployed

### Backend (AWS Lambda + API Gateway)
- **Serverless API** for infrastructure generation
- **OpenAI integration** for AI-powered responses
- **CORS enabled** for frontend access
- **Auto-scaling** and cost-effective

### Frontend (S3 + CloudFront)
- **Static website** with global CDN
- **HTTPS enabled** with SSL certificates
- **Optimized caching** for fast loading
- **Connected to live backend**

## 💰 Cost Estimate

| Component | Monthly Cost |
|-----------|--------------|
| Frontend (S3 + CloudFront) | ~$0.85 |
| Backend (Lambda + API Gateway) | ~$1-3 |
| **Total** | **~$2-4/month** |

## 🧪 After Deployment

The script will output:
```
🌐 Frontend (Website): https://d1234567890.cloudfront.net
🔗 Backend (API): https://abc123.execute-api.us-east-1.amazonaws.com/prod/
```

### Test Your Platform:
1. **Visit the website**: Click the frontend URL
2. **Try the demo**: Go to `/real-lattice-demo.html`
3. **Test AI generation**: Enter "I need an MLOps platform"
4. **Check API health**: Visit `{backend-url}/api/health`

## 🔧 Configuration

The deployment automatically:
- ✅ Injects backend URL into frontend
- ✅ Configures CORS for cross-origin requests
- ✅ Sets up proper error handling
- ✅ Enables logging and monitoring

## 🛠️ Management

### Update Backend Code
```bash
# After changing Lambda code:
npm run deploy:complete
```

### Update Frontend Only
```bash
npm run deploy:website
```

### View Logs
```bash
# Backend logs
aws logs tail /aws/lambda/LatticeBackend-prod-LatticeBackendFunction --follow

# Frontend access logs (CloudFront)
# Available in AWS Console
```

## 🚨 Troubleshooting

### "OpenAI API Key not set"
```bash
export OPENAI_API_KEY=your-key-here
npm run deploy:complete
```

### "Demo backend not available"
- Check that backend deployed successfully
- Verify API Gateway URL is accessible
- Check Lambda function logs for errors

### "CORS errors"
- The deployment automatically configures CORS
- If issues persist, check API Gateway CORS settings

## 🎉 Success!

Your complete Lattice platform is now live with:
- 🌍 **Global CDN** for fast worldwide access
- 🤖 **AI-powered** infrastructure generation
- 🔒 **Secure HTTPS** with automatic certificates
- ⚡ **Serverless backend** that scales automatically
- 💰 **Cost-effective** at ~$2-4/month

**Share your live demo and start getting users!** 🚀