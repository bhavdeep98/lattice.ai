/**
 * Real Lattice Backend
 * This backend actually uses the Lattice framework to generate real infrastructure
 */

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI client
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('🤖 OpenAI client initialized');
} else {
  console.log('⚠️ No OpenAI API Key found. AI generation will be disabled.');
}

// Store for demo results
const demoResults = new Map();

/**
 * AI Agent for generating Lattice manifests
 */
class LatticeAIAgent {
  constructor(apiKey) {
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async generateManifest(userInput) {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Please provide a valid API key.');
    }

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an expert Cloud Architect AI for the "Lattice" framework. 
Your goal is to translate natural language requirements into a valid "Lattice Manifest" JSON object.

The Lattice Manifest Schema (MUST match exactly):

{
  "appName": "string", // Kebab-case name, e.g., "my-app"
  "environment": "dev" | "prod",
  "threatModel": {
    "enabled": boolean,
    "projectName": "string"
  },
  "capabilities": {
    "website": {
      "name": "string",
      "environment": "string", 
      "sourcePath": "string", // e.g., "./dist"
      "domainName": "string", // optional
      "errorPage": "string" // optional, default "index.html"
    },
    "api": {
      "name": "string",
      "environment": "string",
      "type": "vm" | "container" | "serverless",
      "size": "small" | "medium" | "large" | "xlarge", 
      "runtime": "string", // optional
      "autoScaling": boolean, // optional
      "enableObservability": boolean, // optional, default true
      "enableAlarms": boolean, // optional, default true
      "enableDashboards": boolean // optional, default true
    },
    "database": {
      "name": "string",
      "environment": "string",
      "engine": "postgres" | "mysql" | "mariadb" | "oracle" | "sqlserver",
      "size": "small" | "medium" | "large" | "xlarge",
      "highAvailability": boolean, // optional
      "backupRetention": number, // optional
      "deletionProtection": boolean, // optional
      "performanceInsights": boolean, // optional
      "monitoring": boolean, // optional
      "enableObservability": boolean, // optional, default true
      "enableAlarms": boolean, // optional, default true
      "enableDashboards": boolean // optional, default true
    },
    "storage": {
      "name": "string", 
      "environment": "string",
      "encryption": boolean, // optional
      "versioning": boolean, // optional
      "publicRead": boolean, // optional
      "lifecycle": {
        "archiveAfterDays": number,
        "deleteAfterDays": number
      } // optional
    },
    "queue": {
      "name": "string",
      "environment": "string", 
      "type": "standard" | "fifo",
      "dlq": boolean // optional
    }
  }
}

CRITICAL RULES:
1. ALWAYS return valid JSON matching this EXACT schema
2. Do NOT add properties not listed above (like "description")
3. Infer appName from input, use kebab-case
4. Default environment to "prod" 
5. Only include capabilities that are actually needed
6. Be smart about sizing and features based on requirements
7. Do not include domain-specific assumptions - be generic and flexible

Respond with ONLY the JSON manifest.`,
        },
        {
          role: 'user',
          content: userInput,
        },
      ],
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from AI');
    }

    const manifest = JSON.parse(content);
    
    // Validate manifest structure
    if (!manifest.appName || !manifest.capabilities) {
      throw new Error('Invalid manifest structure');
    }

    return manifest;
  }
}

/**
 * Generate real CDK code using the Lattice framework
 */
function generateCDKCode(manifest) {
  return `import { App } from 'aws-cdk-lib';
import { LatticeStack, LatticeManifest } from '../src';

const app = new App();

/**
 * AI Generated Manifest
 * Generated from user input for: "${manifest.appName}"
 */
const manifest: LatticeManifest = ${JSON.stringify(manifest, null, 2)};

/**
 * Create the Lattice Stack
 * This uses the real Lattice framework with built-in:
 * - Security aspects and threat modeling
 * - Automatic monitoring and dashboards  
 * - Production-ready configurations
 * - Cross-capability dependencies
 */
const stack = new LatticeStack(app, '${manifest.appName.charAt(0).toUpperCase() + manifest.appName.slice(1)}Stack', manifest);

console.log('🚀 Lattice Stack Created Successfully!');
console.log('Stack Name:', stack.stackName);
console.log('Capabilities:', Object.keys(manifest.capabilities));

export { stack };`;
}

/**
 * Synthesize using real CDK and Lattice framework
 */
async function synthesizeWithLattice(manifest) {
  try {
    // First, ensure the Lattice framework is built
    console.log('🔧 Building Lattice framework...');
    
    const buildResult = await new Promise((resolve) => {
      const buildProcess = spawn('npm', ['run', 'build'], {
        cwd: path.join(__dirname, '..'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let buildOutput = '';
      let buildError = '';

      buildProcess.stdout.on('data', (data) => {
        buildOutput += data.toString();
      });

      buildProcess.stderr.on('data', (data) => {
        buildError += data.toString();
      });

      buildProcess.on('close', (code) => {
        resolve({ code, output: buildOutput, error: buildError });
      });
    });

    if (buildResult.code !== 0) {
      console.warn('⚠️ Build failed, but continuing with synthesis attempt');
    }

    // Create a synthesis app in the project root
    const projectRoot = path.join(__dirname, '..');
    const synthFile = path.join(projectRoot, `synth-${Date.now()}.ts`);
    
    const synthCode = `import { App } from 'aws-cdk-lib';
import { LatticeStack, LatticeManifest } from './src';

const app = new App();

const manifest: LatticeManifest = ${JSON.stringify(manifest, null, 2)};

const stack = new LatticeStack(app, '${manifest.appName.charAt(0).toUpperCase() + manifest.appName.slice(1)}Stack', manifest);

// Synthesize the app - this will output CloudFormation to stdout
app.synth();
`;

    await fs.writeFile(synthFile, synthCode);

    // Run synthesis to get CloudFormation template
    console.log('🔄 Running CDK synthesis to generate CloudFormation...');
    
    const synthResult = await new Promise((resolve) => {
      // Use cdk synth with output to file to separate logs from template
      const outputFile = path.join(projectRoot, `cdk-output-${Date.now()}.yaml`);
      
      const synthProcess = spawn('npx', ['cdk', 'synth', '--no-staging', '--output', outputFile], {
        cwd: projectRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          CDK_DEFAULT_REGION: 'us-east-1',
          CDK_DEFAULT_ACCOUNT: '123456789012'
        }
      });

      let stdout = '';
      let stderr = '';

      synthProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        // Log Lattice framework output to terminal
        console.log(data.toString().trim());
      });

      synthProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        // Log CDK messages to terminal
        console.log('CDK:', data.toString().trim());
      });

      synthProcess.on('close', async (code) => {
        let cloudFormationTemplate = '';
        
        try {
          // Read the synthesized CloudFormation template from the output directory
          const outputDir = path.join(outputFile);
          const files = await fs.readdir(outputDir);
          
          // Find the CloudFormation template file (usually ends with .template.yaml or .template.json)
          const templateFile = files.find(file => 
            file.endsWith('.template.yaml') || 
            file.endsWith('.template.json')
          );
          
          if (templateFile) {
            const templatePath = path.join(outputDir, templateFile);
            cloudFormationTemplate = await fs.readFile(templatePath, 'utf8');
            console.log(`📄 Found CloudFormation template: ${templateFile}`);
          } else {
            console.log('📁 Available files:', files);
            // If no .template file found, look for any .yaml or .json file
            const yamlFile = files.find(file => file.endsWith('.yaml') || file.endsWith('.yml'));
            const jsonFile = files.find(file => file.endsWith('.json'));
            
            if (yamlFile) {
              const templatePath = path.join(outputDir, yamlFile);
              cloudFormationTemplate = await fs.readFile(templatePath, 'utf8');
              console.log(`📄 Using YAML file: ${yamlFile}`);
            } else if (jsonFile) {
              const templatePath = path.join(outputDir, jsonFile);
              cloudFormationTemplate = await fs.readFile(templatePath, 'utf8');
              console.log(`📄 Using JSON file: ${jsonFile}`);
            }
          }
          
          // Clean up output directory
          await fs.rmdir(outputDir, { recursive: true });
        } catch (error) {
          console.warn('Failed to read synthesized template:', error.message);
        }

        // Clean up synthesis file
        try {
          await fs.unlink(synthFile);
        } catch (e) {
          console.warn('Failed to clean up synthesis file:', e.message);
        }

        resolve({ code, stdout, stderr, cloudFormationTemplate });
      });
    });

    if (synthResult.code === 0 && synthResult.cloudFormationTemplate) {
      console.log('✅ CloudFormation template extracted successfully');

      return {
        success: true,
        cloudFormation: synthResult.cloudFormationTemplate,
        message: 'Successfully synthesized using real Lattice framework'
      };
    } else {
      return {
        success: false,
        error: 'CDK synthesis failed',
        details: synthResult.stderr,
        message: 'Synthesis failed - this is expected in demo environment. The Lattice framework requires proper AWS setup and dependencies.'
      };
    }

  } catch (error) {
    return {
      success: false,
      error: 'Synthesis preparation failed',
      details: error.message,
      message: 'Failed to prepare synthesis environment'
    };
  }
}

// API Endpoints

/**
 * Generate infrastructure using real Lattice framework
 */
app.post('/api/generate', async (req, res) => {
  const startTime = Date.now();

  try {
    const { userInput } = req.body;

    if (!userInput) {
      return res.status(400).json({ error: 'User input is required' });
    }

    console.log(`🔍 Generating infrastructure for: "${userInput}"`);

    // Step 1: Generate manifest using AI
    let manifest;
    
    if (openai) {
      try {
        const aiAgent = new LatticeAIAgent(process.env.OPENAI_API_KEY);
        manifest = await aiAgent.generateManifest(userInput);
        console.log('✅ AI manifest generation successful');
      } catch (aiError) {
        console.error('❌ AI generation failed:', aiError.message);
        return res.status(500).json({
          error: 'AI manifest generation failed',
          details: aiError.message
        });
      }
    } else {
      return res.status(500).json({
        error: 'OpenAI API key not configured',
        details: 'Please set OPENAI_API_KEY environment variable'
      });
    }

    // Step 2: Generate CDK code
    console.log('🏗️ Generating CDK code...');
    const cdkCode = generateCDKCode(manifest);

    // Step 3: Synthesize with real Lattice framework
    console.log('☁️ Synthesizing CloudFormation with Lattice...');
    const synthesisResult = await synthesizeWithLattice(manifest);

    // Store result
    const demoId = Date.now().toString();
    demoResults.set(demoId, {
      userInput,
      manifest,
      cdkCode,
      synthesisResult,
      timestamp: new Date().toISOString(),
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Generated ${Object.keys(manifest.capabilities).length} capabilities in ${duration}ms`);

    res.json({
      demoId,
      userInput,
      manifest,
      cdkCode,
      synthesisResult,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Infrastructure generation failed:', error);

    res.status(500).json({
      error: 'Failed to generate Lattice infrastructure',
      details: error.message,
    });
  }
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0-real-lattice',
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    framework: 'Real Lattice Framework',
    demos: demoResults.size,
  });
});

/**
 * Get demo by ID
 */
app.get('/api/demo/:id', (req, res) => {
  const demoId = req.params.id;
  const demo = demoResults.get(demoId);
  
  if (!demo) {
    return res.status(404).json({ error: 'Demo not found' });
  }

  res.json(demo);
});

/**
 * List all demos
 */
app.get('/api/demos', (req, res) => {
  const demos = Array.from(demoResults.entries()).map(([id, demo]) => ({
    id,
    appName: demo.manifest.appName,
    timestamp: demo.timestamp,
    capabilities: Object.keys(demo.manifest.capabilities),
  }));

  res.json(demos);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Real Lattice Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎯 Framework: Using real Lattice framework from ../src`);
  console.log(`🤖 AI: ${openai ? 'Enabled' : 'Disabled'}`);
});

module.exports = app;