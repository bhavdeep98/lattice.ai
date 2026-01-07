# Email & Stripe Integration Setup

This guide will help you set up email notifications and Stripe payment processing for your Lattice website contact form.

## 🚀 Quick Setup

1. **Install dependencies:**
   ```bash
   cd website
   ./setup-email-stripe.sh
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Start the backend:**
   ```bash
   npm start
   ```

## 📧 Email Configuration

### Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `.env` file

3. **Update .env file:**
   ```env
   EMAIL_USER=your_email@gmail.com
   EMAIL_APP_PASSWORD=your_16_character_app_password
   ```

### Alternative Email Services

You can also use other email services by modifying the transporter configuration in `lattice-demo-backend.js`:

```javascript
// For Outlook/Hotmail
const emailTransporter = nodemailer.createTransporter({
  service: 'hotmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

// For custom SMTP
const emailTransporter = nodemailer.createTransporter({
  host: 'smtp.your-provider.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

## 💳 Stripe Configuration

### 1. Create Stripe Account
- Sign up at [https://stripe.com](https://stripe.com)
- Complete account verification

### 2. Get API Keys
- Go to Stripe Dashboard → Developers → API keys
- Copy your **Publishable key** and **Secret key**
- Use **test keys** for development

### 3. Update .env file:
```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

### 4. Plan Pricing
Current pricing configuration:
- **Starter Plan**: $299/month
- **Growth Plan**: $799/month  
- **Enterprise Plan**: Custom pricing (contact only)

To modify pricing, edit the `planPricing` object in `lattice-demo-backend.js`:

```javascript
const planPricing = {
  starter: 29900, // $299 in cents
  growth: 79900,  // $799 in cents
  enterprise: 0   // Custom pricing
};
```

## 🔧 API Endpoints

### Contact Form Submission
```
POST /api/contact
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@company.com", 
  "company": "Acme Corp",
  "plan": "starter",
  "message": "Interested in your services"
}
```

### Payment Intent Creation
```
POST /api/create-payment-intent
Content-Type: application/json

{
  "plan": "starter",
  "email": "john@company.com",
  "name": "John Doe", 
  "company": "Acme Corp"
}
```

## 🧪 Testing

### Test Email Functionality
1. Fill out the contact form on your website
2. Check that email arrives at `bhavdeepsachdeva@gmail.com`
3. Verify email contains all form data and proper formatting

### Test Payment Flow
1. Select a paid plan (Starter or Growth)
2. Submit contact form
3. Confirm payment modal appears
4. Check Stripe Dashboard for payment intent creation

## 🔒 Security Notes

- Never commit `.env` file to version control
- Use test Stripe keys in development
- Enable Stripe webhooks for production payment handling
- Consider rate limiting for contact form submissions
- Validate and sanitize all form inputs

## 🚀 Production Deployment

### Environment Variables
Set these in your production environment:
```env
EMAIL_USER=your_production_email@gmail.com
EMAIL_APP_PASSWORD=your_production_app_password
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
```

### Additional Production Setup
1. **Stripe Webhooks**: Set up webhooks to handle payment confirmations
2. **Email Templates**: Consider using HTML email templates
3. **Database**: Store contact submissions and payment records
4. **Monitoring**: Add logging and error tracking
5. **Rate Limiting**: Implement rate limiting for form submissions

## 🐛 Troubleshooting

### Email Issues
- **"Invalid login"**: Check app password is correct (not regular password)
- **"Less secure app access"**: Use app password instead of enabling less secure apps
- **Emails not sending**: Check Gmail SMTP settings and firewall

### Stripe Issues  
- **"No such payment_intent"**: Verify secret key is correct
- **"Invalid API key"**: Ensure you're using the right key for your environment
- **Payment modal not showing**: Check browser console for JavaScript errors

### General Issues
- **CORS errors**: Ensure backend is running and accessible
- **Form not submitting**: Check network tab for API call failures
- **Environment variables not loading**: Verify `.env` file location and format

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Check backend logs for error messages  
3. Verify all environment variables are set correctly
4. Test with curl commands to isolate frontend vs backend issues

For additional help, contact: bhavdeepsachdeva@gmail.com