/**
 * Lattice Demo Backend - AWS Lambda Version
 * Serverless backend that mirrors the real Lattice backend behavior
 */

const { OpenAI } = require('openai');

// Initialize OpenAI client
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// In-memory storage for demo (in production, use DynamoDB)
const demoManifests = new Map();

/**
 * AI Agent for generating Lattice manifests - IDENTICAL to real backend
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
    
    // Validate and fix confidence if needed (same as real backend)
    if (manifest._analysis && manifest._analysis.confidence) {
      if (manifest._analysis.confidence > 1) {
        manifest._analysis.confidence = Math.min(manifest._analysis.confidence / 100, 1.0);
      }
      manifest._analysis.confidence = Math.max(0, Math.min(1, manifest._analysis.confidence));
    }

    return manifest;
  }
}

/**
 * Generate CDK code from manifest - IDENTICAL to real backend
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
}

/**
 * Generate mock CloudFormation template
 */
function generateCloudFormation(manifest) {
  const template = {
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": `Generated by Lattice Framework - ${manifest.appName}`,
    "Parameters": {
      "Environment": {
        "Type": "String",
        "Default": manifest.environment,
        "Description": "Deployment environment"
      }
    },
    "Resources": {},
    "Outputs": {}
  };

  // Add resources based on capabilities
  let resourceCount = 0;

  if (manifest.capabilities.website) {
    template.Resources.WebsiteBucket = {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": `${manifest.appName}-website-\${AWS::AccountId}`,
        "WebsiteConfiguration": { "IndexDocument": "index.html" },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": false,
          "BlockPublicPolicy": false,
          "IgnorePublicAcls": false,
          "RestrictPublicBuckets": false
        }
      }
    };
    
    template.Resources.CloudFrontDistribution = {
      "Type": "AWS::CloudFront::Distribution",
      "Properties": {
        "DistributionConfig": {
          "Origins": [{
            "Id": "S3Origin",
            "DomainName": {"Fn::GetAtt": ["WebsiteBucket", "DomainName"]},
            "S3OriginConfig": {}
          }],
          "DefaultCacheBehavior": {
            "TargetOriginId": "S3Origin",
            "ViewerProtocolPolicy": "redirect-to-https"
          },
          "Enabled": true
        }
      }
    };
    
    template.Outputs.WebsiteURL = {
      "Value": {"Fn::GetAtt": ["CloudFrontDistribution", "DomainName"]},
      "Description": "Website URL"
    };
    
    resourceCount += 2;
  }

  if (manifest.capabilities.api) {
    template.Resources.ApiGateway = {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Name": `${manifest.appName}-api`,
        "Description": `API Gateway for ${manifest.appName}`
      }
    };
    
    template.Resources.LambdaFunction = {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": `${manifest.appName}-function`,
        "Runtime": manifest.capabilities.api.runtime || 'nodejs18.x',
        "Handler": "index.handler",
        "Code": {
          "ZipFile": "exports.handler = async (event) => ({ statusCode: 200, body: JSON.stringify({ message: 'Hello from Lattice!' }) });"
        },
        "Role": {"Fn::GetAtt": ["LambdaExecutionRole", "Arn"]}
      }
    };
    
    template.Resources.LambdaExecutionRole = {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Action": "sts:AssumeRole"
          }]
        },
        "ManagedPolicyArns": ["arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"]
      }
    };
    
    template.Outputs.ApiURL = {
      "Value": {"Fn::Sub": "https://\${ApiGateway}.execute-api.\${AWS::Region}.amazonaws.com/prod"},
      "Description": "API Gateway URL"
    };
    
    resourceCount += 3;
  }

  if (manifest.capabilities.database) {
    template.Resources.VPC = {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true
      }
    };
    
    template.Resources.Database = {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": `${manifest.appName}-db`,
        "DBInstanceClass": "db.t3.micro",
        "Engine": manifest.capabilities.database.engine || 'postgres',
        "AllocatedStorage": "20",
        "StorageEncrypted": manifest.capabilities.database.encryption || true,
        "MultiAZ": manifest.capabilities.database.highAvailability || false
      }
    };
    
    resourceCount += 2;
  }

  if (manifest.capabilities.storage) {
    template.Resources.StorageBucket = {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": `${manifest.appName}-storage-\${AWS::AccountId}`,
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [{
            "ServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}
          }]
        },
        "VersioningConfiguration": {
          "Status": manifest.capabilities.storage.versioning ? 'Enabled' : 'Suspended'
        }
      }
    };
    
    resourceCount += 1;
  }

  if (manifest.capabilities.queue) {
    template.Resources.Queue = {
      "Type": "AWS::SQS::Queue",
      "Properties": {
        "QueueName": `${manifest.appName}-queue`,
        "FifoQueue": manifest.capabilities.queue.type === 'fifo'
      }
    };
    
    if (manifest.capabilities.queue.dlq) {
      template.Resources.DeadLetterQueue = {
        "Type": "AWS::SQS::Queue",
        "Properties": {
          "QueueName": `${manifest.appName}-dlq`
        }
      };
      resourceCount += 1;
    }
    
    resourceCount += 1;
  }

  template.Outputs.ResourceCount = {
    "Value": resourceCount.toString(),
    "Description": "Total number of AWS resources created"
  };

  return template;
}

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const { httpMethod, path, body } = event;
    const pathParts = path.split('/').filter(p => p);

    // Handle CORS preflight
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'CORS preflight' })
      };
    }

    // Health check
    if (httpMethod === 'GET' && pathParts[1] === 'health') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'production',
          openaiConfigured: !!process.env.OPENAI_API_KEY
        })
      };
    }

    // Generate infrastructure
    if (httpMethod === 'POST' && pathParts[1] === 'generate') {
      const requestBody = JSON.parse(body || '{}');
      const { userInput } = requestBody;

      if (!userInput) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'User input is required' })
        };
      }

      console.log(`Generating infrastructure for: "${userInput}"`);

      let manifest;
      
      // Try AI generation
      if (openai) {
        try {
          const aiAgent = new LatticeAIAgent(process.env.OPENAI_API_KEY);
          manifest = await aiAgent.generateManifest(userInput);
          console.log('Used AI generation');
        } catch (error) {
          console.error('AI generation failed:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              error: 'AI manifest generation failed',
              details: error.message
            })
          };
        }
      } else {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'OpenAI API key not configured',
            details: 'Please set OPENAI_API_KEY environment variable'
          })
        };
      }

      // Generate CDK code
      const cdkCode = generateCDKCode(manifest);
      
      // Generate CloudFormation template - simulate real backend behavior
      const cloudFormation = generateCloudFormation(manifest);
      
      const synthesisResult = {
        success: false, // Lambda can't do real synthesis like local backend
        cloudFormation: JSON.stringify(cloudFormation, null, 2),
        message: 'Synthesis failed - this is expected in demo environment. The Lattice framework requires proper AWS setup and dependencies.'
      };

      const demoId = Date.now().toString();
      
      // Store demo (in production, use DynamoDB)
      demoManifests.set(demoId, {
        userInput,
        manifest,
        cdkCode,
        synthesisResult,
        timestamp: new Date().toISOString()
      });

      console.log(`Generated ${Object.keys(manifest.capabilities).length} capabilities for ${manifest.appName}`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          demoId,
          userInput,
          manifest,
          cdkCode,
          synthesisResult
        })
      };
    }

    // Get demo by ID
    if (httpMethod === 'GET' && pathParts[1] === 'demo' && pathParts[2]) {
      const demoId = pathParts[2];
      const demo = demoManifests.get(demoId);
      
      if (!demo) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Demo not found' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(demo)
      };
    }

    // List demos
    if (httpMethod === 'GET' && pathParts[1] === 'demos') {
      const demos = Array.from(demoManifests.entries()).map(([id, demo]) => ({
        id,
        appName: demo.manifest.appName,
        timestamp: demo.timestamp,
        capabilities: Object.keys(demo.manifest.capabilities)
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(demos)
      };
    }

    // Route not found
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Route not found' })
    };

  } catch (error) {
    console.error('Lambda error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};