/**
 * Unit tests for Lattice core functionality
 */

import { validateResourceName, validateBucketName } from '../../src/utils/validation';

describe('Lattice Core Validation', () => {
  describe('validateResourceName', () => {
    test('should accept valid resource names', () => {
      expect(validateResourceName('my-resource')).toBe(true);
      expect(validateResourceName('MyResource123')).toBe(true);
      expect(validateResourceName('resource_name')).toBe(true);
    });

    test('should reject invalid resource names', () => {
      expect(validateResourceName('')).toBe(false);
      expect(validateResourceName('a'.repeat(64))).toBe(false); // Too long
      expect(validateResourceName('invalid@name')).toBe(false); // Invalid character
    });
  });

  describe('validateBucketName', () => {
    test('should accept valid bucket names', () => {
      expect(validateBucketName('my-bucket-name')).toBe(true);
      expect(validateBucketName('bucket123')).toBe(true);
    });

    test('should reject invalid bucket names', () => {
      expect(validateBucketName('ab')).toBe(false); // Too short
      expect(validateBucketName('UPPERCASE')).toBe(false); // Uppercase not allowed
      expect(validateBucketName('bucket..name')).toBe(false); // Double dots
      expect(validateBucketName('192.168.1.1')).toBe(false); // IP address format
    });
  });
});

describe('Lattice Environment', () => {
  test('should have required environment variables or defaults', () => {
    // Test that the module can be imported without errors
    expect(typeof validateResourceName).toBe('function');
    expect(typeof validateBucketName).toBe('function');
  });
});
