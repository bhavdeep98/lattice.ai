/**
 * Test the Contact API Endpoint
 */

async function testContactAPI() {
  console.log('🧪 Testing Contact API Endpoint...\n');

  const testData = {
    name: 'Jane Smith',
    email: 'jane.smith@testcompany.com',
    company: 'Test Company LLC',
    plan: 'growth',
    message: 'We are interested in implementing Lattice for our infrastructure needs. Please send us more information about the Growth plan.'
  };

  try {
    console.log('📤 Sending POST request to /api/contact...');
    console.log('📋 Test Data:', JSON.stringify(testData, null, 2));
    console.log('');

    const response = await fetch('http://localhost:3001/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log('📨 Response Body:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ Contact API test successful!');
      console.log('📧 Email should be sent to: bhavdeepsachdeva@gmail.com');
      console.log('💡 Check your email inbox for the contact form submission.');
    } else {
      console.log('\n❌ Contact API test failed');
      console.log('🔍 This might be expected if Gmail credentials are not configured');
    }

  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

// Test health endpoint first
async function testHealthAPI() {
  console.log('🏥 Testing Health API Endpoint...\n');
  
  try {
    const response = await fetch('http://localhost:3001/api/health');
    const result = await response.json();
    
    console.log(`📊 Health Status: ${response.status} ${response.statusText}`);
    console.log('📨 Health Data:', JSON.stringify(result, null, 2));
    console.log('');
    
    return response.ok;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  const healthOk = await testHealthAPI();
  
  if (healthOk) {
    await testContactAPI();
  } else {
    console.log('❌ Server health check failed. Make sure the server is running on port 3001.');
  }
}

runTests().catch(console.error);