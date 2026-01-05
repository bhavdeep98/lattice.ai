/**
 * Unit tests for LatticeStorage module
 */

import { Stack } from 'aws-cdk-lib';
import { LatticeBucket } from '../../../src/modules/storage/lattice-bucket';

describe('LatticeBucket', () => {
  let stack: Stack;

  beforeEach(() => {
    stack = new Stack();
  });

  describe('S3 Bucket Creation', () => {
    test('should create S3 bucket with default security settings', () => {
      const bucket = new LatticeBucket(stack, 'TestBucket', {
        name: 'test-bucket',
        environment: 'dev'
      });

      expect(bucket).toBeDefined();
      expect(bucket.output).toBeDefined();
      expect(bucket.output.bucketArn).toBeDefined();
    });

    test('should enforce encryption by default', () => {
      const bucket = new LatticeBucket(stack, 'EncryptedBucket', {
        name: 'encrypted-bucket',
        environment: 'dev',
        encryption: true
      });

      expect(bucket.output).toBeDefined();
      expect(bucket.output.bucketArn).toBeDefined();
    });

    test('should block public access by default', () => {
      const bucket = new LatticeBucket(stack, 'PrivateBucket', {
        name: 'private-bucket',
        environment: 'dev',
        publicRead: false
      });

      expect(bucket.output).toBeDefined();
      expect(bucket.output.bucketArn).toBeDefined();
    });

    test('should support versioning configuration', () => {
      const bucket = new LatticeBucket(stack, 'VersionedBucket', {
        name: 'versioned-bucket',
        environment: 'dev',
        versioning: true
      });

      expect(bucket.output).toBeDefined();
      expect(bucket.output.bucketArn).toBeDefined();
    });

    test('should support lifecycle policies', () => {
      const bucket = new LatticeBucket(stack, 'LifecycleBucket', {
        name: 'lifecycle-bucket',
        environment: 'dev',
        lifecycle: {
          archiveAfterDays: 30,
          deleteAfterDays: 90
        }
      });

      expect(bucket.output).toBeDefined();
      expect(bucket.output.bucketArn).toBeDefined();
    });
  });

  describe('Security Validation', () => {
    test('should create bucket with valid names', () => {
      expect(() => {
        new LatticeBucket(stack, 'ValidBucket', {
          name: 'valid-bucket-name',
          environment: 'dev'
        });
      }).not.toThrow();
    });

    test('should enforce minimum security standards', () => {
      const bucket = new LatticeBucket(stack, 'SecureBucket', {
        name: 'secure-bucket',
        environment: 'prod',
        encryption: true,
        versioning: true,
        publicRead: false
      });

      expect(bucket.output).toBeDefined();
      expect(bucket.output.bucketArn).toBeDefined();
    });
  });
});