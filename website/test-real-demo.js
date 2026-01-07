/**
 * Test script for the Real Lattice Demo
 */

const http = require('http');

async function testDemo() {
  console.log('🧪 Testing Real Lattice Demo...\n');

  // Test 1: Health Check
  console.log('1. Testing backend health...');
  try {
    const healthResponse = await makeRequest('GET', '/api/health');
    console.log('✅ Backend is healthy:', healthResponse.status);
  } catch (error) {
    console.log('❌ Backend health check failed:', error.message);
    return;
  }

  // Test 2: Generate Infrastructure
  console.log('\n2. Testing infrastructure generation...');
  try {
    const generateResponse = await makeRequest('POST', '/api/generate', {
      userInput: 'I need a simple web app with a database',
    });

    console.log('✅ Generation successful!');
    console.log('   App Name:', generateResponse.manifest.appName);
    console.log('   Environment:', generateResponse.manifest.environment);
    console.log('   Capabilities:', Object.keys(generateResponse.manifest.capabilities));
    console.log('   CDK Code Length:', generateResponse.cdkCode.length, 'characters');
  } catch (error) {
    console.log('❌ Generation failed:', error.message);
    return;
  }

  // Test 3: List Demos
  console.log('\n3. Testing demo listing...');
  try {
    const listResponse = await makeRequest('GET', '/api/demos');
    console.log('✅ Demo listing successful!');
    console.log('   Total demos:', listResponse.length);
  } catch (error) {
    console.log('❌ Demo listing failed:', error.message);
    return;
  }

  console.log('\n🎉 All tests passed! Real Lattice Demo is working correctly.');
  console.log('\n🌐 Visit: http://localhost:8001/real-lattice-demo.html');
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Run the test
testDemo().catch(console.error);
