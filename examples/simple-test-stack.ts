import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LatticeBucket } from '../src/modules/storage/lattice-bucket';

/**
 * Simple test stack for CI/CD testing
 * This stack only creates resources that don't require VPC lookups
 */
export class SimpleTestStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Get environment from context, default to 'dev'
    const environment = this.node.tryGetContext('environment') || 'dev';

    // Simple S3 bucket - no VPC dependencies
    new LatticeBucket(this, 'TestBucket', {
      name: 'lattice-test-bucket',
      environment,
      encryption: true,
      versioning: true,
      publicRead: false,
    });

    // Another bucket for testing patterns
    new LatticeBucket(this, 'DataBucket', {
      name: 'lattice-data-bucket',
      environment,
      encryption: true,
      lifecycle: {
        archiveAfterDays: 30,
        deleteAfterDays: 90,
      },
    });
  }
}
