/**
 * Email Testing with Ethereal Email (Test SMTP Service)
 * This creates a temporary test email account and sends a test email
 */

const nodemailer = require('nodemailer');

async function testEmailWithEthereal() {
  console.log('🧪 Testing Email with Ethereal Email (Test SMTP)...\n');

  try {
    // Create a test account with Ethereal Email
    console.log('🔧 Creating test email account...');
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('✅ Test account created:');
    console.log(`📧 Email: ${testAccount.user}`);
    console.log(`🔑 Password: ${testAccount.pass}`);
    console.log(`🌐 SMTP Server: ${testAccount.smtp.host}:${testAccount.smtp.port}`);
    console.log('');

    // Create transporter with test account
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    // Test contact form data
    const testData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      company: 'Test Company Inc.',
      plan: 'starter',
      message: 'This is a test message to verify email functionality works correctly.'
    };

    // Create email content (same format as the real backend)
    const emailSubject = `Test Lattice Demo Request - ${testData.plan} Plan`;
    const emailBody = `
New demo request received:

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
      from: testAccount.user,
      to: 'bhavdeepsachdeva@gmail.com',
      subject: emailSubject,
      text: emailBody,
      replyTo: testData.email
    };

    console.log('📤 Sending test email...');
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    console.log('');
    console.log('📋 Email Content Preview:');
    console.log('Subject:', emailSubject);
    console.log('To: bhavdeepsachdeva@gmail.com');
    console.log('Reply-To:', testData.email);
    console.log('Body:');
    console.log(emailBody);

    console.log('\n🎉 Email functionality test completed successfully!');
    console.log('💡 The preview URL above shows exactly how your email will look.');
    console.log('📧 When you set up Gmail, emails will be sent to your actual inbox.');

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
}

// Run the test
testEmailWithEthereal().catch(console.error);