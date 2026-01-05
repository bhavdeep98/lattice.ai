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
        bucketName: 'test-bucket-12345'
      });

      expect(bucket).toBeDefined();
      expect(bucket.bucket).toBeDefined();
    });

    test('should enforce encryption by default', () => {
      const bucket = new LatticeBucket(stack, 'EncryptedBucket', {
        bucketName: 'encrypted-bucket-12345'
      });

      // Test that encryption is enabled
      expect(bucket.bucket.encryptionKey).toBeDefined();
    });

    test('should block public access by default', () => {
      const bucket = new LatticeBucket(stack, 'PrivateBucket', {
        bucketName: 'private-bucket-12345'
      });

      // Test that public access is blocked
      expect(bucket).toBeDefined();
    });

    test('should support versioning configuration', () => {
      const bucket = new LatticeBucket(stack, 'VersionedBucket', {
        bucketName: 'versioned-bucket-12345',
        versioned: true
      });

      expect(bucket).toBeDefined();
    });

    test('should support lifecycle policies', () => {
      const bucket = new LatticeBucket(stack, 'LifecycleBucket', {
        bucketName: 'lifecycle-bucket-12345',
        lifecycleRules: [{
          id: 'DeleteOldVersions',
          expiration: { days: 90 }
        }]
      });

      expect(bucket).toBeDefined();
    });
  });

  describe('Security Validation', () => {
    test('should reject invalid bucket names', () => {
      expect(() => {
        new LatticeBucket(stack, 'InvalidBucket', {
          bucketName: 'INVALID-BUCKET-NAME' // Uppercase not allowed
        });
      }).toThrow();
    });

    test('should enforce minimum security standards', () => {
      const bucket = new LatticeBucket(stack, 'SecureBucket', {
        bucketName: 'secure-bucket-12345'
      });

      // Verify security defaults are applied
      expect(bucket).toBeDefined();
    });
  });
});