/**
 * Utility functions for validating Lattice configurations
 */

import { Environment } from '../core/types';

export function validateEnvironment(environment: string): environment is Environment {
  return ['dev', 'staging', 'prod'].includes(environment);
}

export function validateCidr(cidr: string): boolean {
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  if (!cidrRegex.test(cidr)) {
    return false;
  }

  const [ip, prefix] = cidr.split('/');
  const prefixNum = parseInt(prefix, 10);

  if (prefixNum < 8 || prefixNum > 28) {
    return false;
  }

  const octets = ip.split('.').map(Number);
  return octets.every((octet) => octet >= 0 && octet <= 255);
}

export function validateResourceName(name: string): boolean {
  // AWS resource naming constraints
  return /^[a-zA-Z0-9-_]+$/.test(name) && name.length >= 1 && name.length <= 63;
}

export function validateBucketName(name: string): boolean {
  // S3 bucket naming rules
  const bucketRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
  return (
    bucketRegex.test(name) &&
    name.length >= 3 &&
    name.length <= 63 &&
    !name.includes('..') &&
    !name.match(/^\d+\.\d+\.\d+\.\d+$/)
  );
}

export function validatePort(port: number): boolean {
  return port >= 1 && port <= 65535;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
