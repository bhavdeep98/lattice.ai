/**
 * Email Testing Script
 * This script tests the email functionality with different configurations
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailConfiguration() {
  console.log('🧪 Testing Email Configuration...\n');

  // Test data
  const testData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    company: 'Test Company Inc.',
    plan: 'starter',
    message: 'This is a test message from the email testing script.'
  };

  console.log('📧 Test Contact Form Data:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('\n');

  // Check environment variables
  console.log('🔧 Environment Variables:');
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER || 'NOT SET'}`);
  console.log(`EMAIL_APP_PASSWORD: ${process.env.EMAIL_APP_PASSWORD ? 'SET (hidden)' : 'NOT SET'}`);
  console.log('\n');

  // Test 1: Create transporter (without sending)
  console.log('🔌 Test 1: Creating Email Transporter...');
  
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      }
    });

    console.log('✅ Transporter created successfully');

    // Test 2: Verify connection (if credentials are provided)
    if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD && 
        process.env.EMAIL_APP_PASSWORD !== 'your_gmail_app_password_here') {
      
      console.log('\n🔍 Test 2: Verifying SMTP Connection...');
      
      try {
        await transporter.verify();
        console.log('✅ SMTP connection verified successfully');
        
        // Test 3: Send actual test email
        console.log('\n📤 Test 3: Sending Test Email...');
        
        const emailSubject = `Test Lattice Demo Request - ${testData.plan} Plan`;
        const emailBody = `
Test email from Lattice website contact form:

Name: ${testData.name}
Email: ${testData.email}
Company: ${testData.company}
Interested Plan: ${testData.plan}

Message:
${testData.message}

---
Submitted at: ${new Date().toISOString()}
From: Lattice Website Contact Form (TEST)
        `;

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: 'bhavdeepsachdeva@gmail.com',
          subject: emailSubject,
          text: emailBody,
          replyTo: testData.email
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Test email sent successfully!');
        console.log(`📧 Message ID: ${result.messageId}`);
        console.log(`📬 Email sent to: bhavdeepsachdeva@gmail.com`);
        
      } catch (error) {
        console.log('❌ SMTP verification failed:', error.message);
        console.log('\n💡 This is expected if you haven\'t set up Gmail App Password yet.');
      }
      
    } else {
      console.log('\n⚠️  Skipping SMTP verification - credentials not configured');
      console.log('💡 To test actual email sending, you need to:');
      console.log('   1. Set up Gmail App Password');
      console.log('   2. Update EMAIL_APP_PASSWORD in .env file');
    }

  } catch (error) {
    console.log('❌ Failed to create transporter:', error.message);
  }

  // Test 4: Test the API endpoint format
  console.log('\n🌐 Test 4: API Endpoint Format Test...');
  
  const apiTestData = {
    method: 'POST',
    url: '/api/contact',
    headers: {
      'Content-Type': 'application/json'
    },
    body: testData
  };

  console.log('📡 Expected API Request:');
  console.log(JSON.stringify(apiTestData, null, 2));

  console.log('\n✅ Email testing complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Set up Gmail App Password (see EMAIL-STRIPE-SETUP.md)');
  console.log('2. Update .env file with your app password');
  console.log('3. Start the backend server: npm start');
  console.log('4. Test the contact form on your website');
}

// Run the test
testEmailConfiguration().catch(console.error);