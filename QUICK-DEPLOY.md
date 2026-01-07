# ⚡ Quick Deploy: Complete Lattice Platform

Get your complete Lattice platform live on AWS in 3 simple steps!

## 🚀 3-Step Deployment

### Step 1: Setup Environment
```bash
npm run setup
# This will help you configure your OpenAI API key
```

### Step 2: Configure AWS
```bash
aws configure
# Enter your AWS credentials if not already done
```

### Step 3: Deploy Everything
```bash
npm run deploy:complete
# Deploys both frontend and backend with AI functionality
```

## 🎯 What You Get

After deployment, you'll have:

- 🌐 **Live Website**: `https://d1234567890.cloudfront.net`
- 🤖 **AI-Powered Demo**: Fully functional infrastructure generation
- 🔗 **Serverless API**: `https://abc123.execute-api.us-east-1.amazonaws.com/prod/`
- 🔒 **HTTPS & CDN**: Global, secure, fast delivery
- 💰 **Cost-Effective**: ~$2-4/month total

## 🧪 Test Your Platform

1. **Visit your website**: Click the frontend URL
2. **Try the AI demo**: Go to `/real-lattice-demo.html`
3. **Generate infrastructure**: Enter "I need an MLOps platform"
4. **See real results**: Get actual CDK code and CloudFormation

## 📊 Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Users         │────│   CloudFront     │────│   S3 Website    │
│   (Global)      │    │   (Global CDN)   │    │   (Frontend)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   API Gateway    │────│   Lambda        │
                       │   (REST API)     │    │   (Backend)     │
                       └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   OpenAI API    │
                                               │   (AI Engine)   │
                                               └─────────────────┘
```

## 🔧 Configuration Files

- **`.env`**: Your OpenAI API key (kept secure, not in git)
- **`website/config.js`**: Frontend configuration
- **`website/runtime-config.js`**: Runtime backend URL injection

## 🛠️ Management Commands

```bash
# Update everything
npm run deploy:complete

# Update frontend only
npm run deploy:website

# Update backend only
cdk deploy LatticeBackend-prod

# View logs
aws logs tail /aws/lambda/LatticeBackend-prod-LatticeBackendFunction --follow
```

## 💡 Pro Tips

1. **Custom Domain**: Add your domain in the deployment script
2. **Monitoring**: Check AWS CloudWatch for metrics and logs
3. **Costs**: Monitor AWS billing dashboard
4. **Updates**: Re-run deployment to update code
5. **Scaling**: Lambda auto-scales, no server management needed

## 🚨 Troubleshooting

### "OpenAI API key not configured"
```bash
npm run setup
# Follow the prompts to add your API key
```

### "AWS credentials not found"
```bash
aws configure
# Add your AWS access keys
```

### "Demo not working"
- Check that both stacks deployed successfully
- Verify API Gateway URL is accessible
- Check Lambda logs for errors

## 🎉 Success Metrics

Your platform is working when:
- ✅ Website loads at the CloudFront URL
- ✅ Demo page generates infrastructure code
- ✅ API health check returns 200 OK
- ✅ AI responses are generated (not fallback patterns)

**🚀 Ready to go live? Run `npm run setup` and then `npm run deploy:complete`!**