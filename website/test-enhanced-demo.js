/**
 * Test Enhanced Pattern Recognition
 */

const http = require('http');

const testCases = [
  {
    name: 'MLOps Platform (Original Problem)',
    input:
      'This role builds and operates an internal Agentic AI / LLM platform used by enterprises. Concretely, it is a shared MLOps/runtime platform that hosts LLM-powered services and agents, handling model deployment, prompt/version management, observability, cost control, and secure multi-environment isolation on AWS.',
    expectedDomain: 'mlops',
    expectedConfidence: '> 0.8',
  },
  {
    name: 'Healthcare Platform',
    input: 'Build a healthcare platform with HIPAA compliance for patient data management',
    expectedDomain: 'healthcare',
    expectedConfidence: '> 0.4',
  },
  {
    name: 'E-commerce Platform',
    input: 'Create an e-commerce platform with payment processing and inventory management',
    expectedDomain: 'ecommerce',
    expectedConfidence: '> 0.4',
  },
  {
    name: 'Data Analytics Platform',
    input: 'I need a data analytics platform with real-time processing and dashboard',
    expectedDomain: 'dataplatform',
    expectedConfidence: '> 0.4',
  },
  {
    name: 'Generic Web App',
    input: 'I need a simple web app with a database',
    expectedDomain: 'null',
    expectedConfidence: '< 0.4',
  },
];

async function runTests() {
  console.log('🧪 Testing Enhanced Pattern Recognition\n');

  for (const testCase of testCases) {
    console.log(`📋 Testing: ${testCase.name}`);
    console.log(`   Input: "${testCase.input.substring(0, 60)}..."`);

    try {
      const result = await makeRequest('POST', '/api/generate', {
        userInput: testCase.input,
      });

      const analysis = result.manifest._analysis || {};
      const capabilities = Object.keys(result.manifest.capabilities);

      console.log(
        `   ✅ Domain: ${analysis.detectedDomain || 'null'} (expected: ${testCase.expectedDomain})`
      );
      console.log(
        `   ✅ Confidence: ${Math.round((analysis.confidence || 0) * 100)}% (expected: ${testCase.expectedConfidence})`
      );
      console.log(`   ✅ Capabilities: [${capabilities.join(', ')}]`);

      if (analysis.suggestions && analysis.suggestions.length > 0) {
        console.log(`   💡 Suggestions: ${analysis.suggestions.length} provided`);
      }

      if (analysis.missingInfo && analysis.missingInfo.length > 0) {
        console.log(`   ❓ Missing Info: ${analysis.missingInfo.length} items identified`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    console.log('');
  }

  console.log('🎉 Enhanced Pattern Recognition Test Complete!');
  console.log('\n🌐 Visit: http://localhost:8001/real-lattice-demo.html');
  console.log('   Try the original MLOps example to see the improvements!');
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

runTests().catch(console.error);
