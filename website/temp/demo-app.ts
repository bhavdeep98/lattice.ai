
import { App } from 'aws-cdk-lib';
import { LatticeStack, LatticeManifest } from '../src';

const app = new App();

/**
 * AI Generated Manifest
 * Generated from user input: "load-testing-infra"
 */
const manifest: LatticeManifest = {
  "appName": "load-testing-infra",
  "environment": "prod",
  "threatModel": {
    "enabled": false
  },
  "capabilities": {
    "api": {
      "name": "load-generator",
      "environment": "prod",
      "type": "container",
      "size": "large",
      "runtime": "nodejs18.x",
      "description": "EC2 instances for load generation, managed within containers for scalability."
    },
    "storage": {
      "name": "test-results-storage",
      "environment": "prod",
      "encryption": true,
      "versioning": true,
      "publicRead": false,
      "lifecycle": {
        "archiveAfterDays": 30,
        "deleteAfterDays": 365
      },
      "description": "S3 bucket for secure and version-controlled storage of test results."
    },
    "queue": {
      "name": "test-completion-notifications",
      "environment": "prod",
      "type": "standard",
      "dlq": true,
      "description": "SNS topic for triggering notifications upon test completions."
    }
  },
  "_analysis": {
    "detectedDomain": "testing-infra",
    "confidence": 0.8,
    "suggestions": [
      "Consider integrating a database if persisting test data for reports insights is required.",
      "Review the need for a dedicated security layer or VPNs for secure access to the testing environment.",
      "Ensure proper IAM roles and policies are in place for secure and least privileged access."
    ],
    "missingInfo": [
      "Specific runtimes for Lambda functions for test automation were not provided. Assumed default.",
      "Detailed requirements regarding the Application Load Balancer, CloudWatch, and Auto Scaling setups were not specified. Recommendations on those services are broad and could be refined with more context."
    ]
  }
};

/**
 * Create the Lattice Stack
 */
const stack = new LatticeStack(app, 'Load-testing-infraStack', manifest);

console.log('🚀 Lattice Stack Created Successfully!');
console.log('Stack Name:', stack.stackName);
console.log('Outputs:', stack.outputs);

export { stack };
