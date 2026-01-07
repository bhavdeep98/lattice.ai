
import { App } from 'aws-cdk-lib';
import { LatticeStack, LatticeManifest } from '../src';

const app = new App();

/**
 * AI Generated Manifest
 * Generated from user input: "educational-technology-platform"
 */
const manifest: LatticeManifest = {
  "appName": "educational-technology-platform",
  "environment": "prod",
  "threatModel": {
    "enabled": true,
    "projectName": "educational-technology-platform"
  },
  "capabilities": {
    "website": {
      "name": "educational-website",
      "environment": "prod",
      "sourcePath": "./dist",
      "domainName": "www.edtechplatform.com",
      "description": "A global content delivery platform for educational materials."
    },
    "api": {
      "name": "assessment-api",
      "environment": "prod",
      "type": "serverless",
      "size": "medium",
      "runtime": "nodejs18.x",
      "description": "Processes student assessments and returns results."
    },
    "database": {
      "name": "student-course-db",
      "environment": "prod",
      "engine": "postgres",
      "size": "large",
      "highAvailability": true,
      "encryption": true,
      "description": "Stores student and course data securely with RDS PostgreSQL."
    },
    "storage": {
      "name": "course-materials-storage",
      "environment": "prod",
      "encryption": true,
      "versioning": true,
      "publicRead": true,
      "lifecycle": {
        "archiveAfterDays": 365,
        "deleteAfterDays": 1095
      },
      "description": "Hosts video lectures and course materials on S3 with encryption, versioning, and lifecycle policies."
    }
  },
  "_analysis": {
    "detectedDomain": "education",
    "confidence": 0.95,
    "suggestions": [
      "Consider implementing a CDN capability directly within the manifest; currently, we have provisioned a website which could be served through CloudFront for enhanced performance and security.",
      "Explore adding a caching solution like ElastiCache to optimize session management.",
      "Include email notification capabilities with SES by extending the API layer or as a standalone service.",
      "Ensure adequate monitoring and alerting strategy with CloudWatch for proactive platform management."
    ],
    "missingInfo": [
      "No direct mentions of ElastiCache, SES, and CloudWatch in capabilities - consider integrating these AWS services for a comprehensive solution."
    ]
  }
};

/**
 * Create the Lattice Stack
 */
const stack = new LatticeStack(app, 'Educational-technology-platformStack', manifest);

console.log('🚀 Lattice Stack Created Successfully!');
console.log('Stack Name:', stack.stackName);
console.log('Outputs:', stack.outputs);

export { stack };
