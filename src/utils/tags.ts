/**
 * Utility functions for consistent resource tagging
 */

import { Environment } from '../core/types';

export interface StandardTags {
  Environment: Environment;
  Project: string;
  Owner: string;
  ManagedBy: string;
  CreatedAt: string;
}

export function createStandardTags(
  environment: Environment,
  projectName: string,
  owner: string,
  additionalTags?: Record<string, string>
): Record<string, string> {
  const standardTags: Record<string, string> = {
    Environment: environment,
    Project: projectName,
    Owner: owner,
    ManagedBy: 'Lattice',
    CreatedAt: new Date().toISOString(),
  };

  return {
    ...standardTags,
    ...additionalTags,
  };
}

export function validateTagValue(value: string): boolean {
  // AWS tag value constraints
  return value.length <= 256 && !/[<>&"']/.test(value);
}

export function validateTagKey(key: string): boolean {
  // AWS tag key constraints
  return key.length <= 128 && /^[a-zA-Z0-9\s_.:/=+\-@]*$/.test(key);
}
