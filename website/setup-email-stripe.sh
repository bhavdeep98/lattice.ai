#!/bin/bash

echo "🚀 Setting up Email and Stripe integration for Lattice website..."

# Install new dependencies
echo "📦 Installing nodemailer and stripe..."
npm install nodemailer stripe

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual credentials:"
    echo "   - EMAIL_USER: Your Gmail address"
    echo "   - EMAIL_APP_PASSWORD: Your Gmail app password"
    echo "   - STRIPE_SECRET_KEY: Your Stripe secret key"
    echo "   - STRIPE_PUBLISHABLE_KEY: Your Stripe publishable key"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🔧 Setup complete! Next steps:"
echo "1. Edit the .env file with your credentials"
echo "2. Set up Gmail App Password (see .env.example for instructions)"
echo "3. Set up Stripe account and get API keys"
echo "4. Run 'npm start' to start the backend server"
echo ""
echo "📧 Email will be sent to: bhavdeepsachdeva@gmail.com"
echo "💳 Payment plans configured:"
echo "   - Starter: $299/month"
echo "   - Growth: $799/month"
echo "   - Enterprise: Custom pricing (contact only)"