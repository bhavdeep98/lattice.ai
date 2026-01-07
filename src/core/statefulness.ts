import { RemovalPolicy } from 'aws-cdk-lib';
import { Environment } from './types';

/**
 * Centralized statefulness and operations policies for Lattice constructs
 */

export interface StatefulnessConfig {
  environment: Environment;
  forceRetain?: boolean; // Override for critical resources
  enableBackups?: boolean; // Default: true for prod, false for dev
  backupRetentionDays?: number; // Default: 30 for prod, 7 for dev
}

export class StatefulnessPolicy {
  private readonly config: StatefulnessConfig;

  constructor(config: StatefulnessConfig) {
    this.config = config;
  }

  /**
   * Get removal policy for stateful resources (S3, RDS, etc.)
   * CRITICAL: Prevents accidental data loss in production
   */
  getRemovalPolicy(): RemovalPolicy {
    if (this.config.forceRetain) {
      return RemovalPolicy.RETAIN;
    }

    switch (this.config.environment) {
      case 'prod':
        return RemovalPolicy.RETAIN;
      case 'staging':
        return RemovalPolicy.RETAIN; // Staging should also be protected
      case 'dev':
        return RemovalPolicy.DESTROY;
      default:
        // Fail safe: default to RETAIN for unknown environments
        return RemovalPolicy.RETAIN;
    }
  }

  /**
   * Get removal policy specifically for databases
   * Uses SNAPSHOT for better recovery options
   */
  getDatabaseRemovalPolicy(): RemovalPolicy {
    if (this.config.forceRetain) {
      return RemovalPolicy.SNAPSHOT;
    }

    switch (this.config.environment) {
      case 'prod':
        return RemovalPolicy.SNAPSHOT; // Better than RETAIN for databases
      case 'staging':
        return RemovalPolicy.SNAPSHOT; // Staging data might be valuable
      case 'dev':
        return RemovalPolicy.DESTROY;
      default:
        return RemovalPolicy.SNAPSHOT; // Fail safe
    }
  }

  /**
   * Whether to enable deletion protection
   */
  shouldEnableDeletionProtection(): boolean {
    return this.config.environment === 'prod' || this.config.forceRetain === true;
  }

  /**
   * Whether to enable automatic backups
   */
  shouldEnableBackups(): boolean {
    if (this.config.enableBackups !== undefined) {
      return this.config.enableBackups;
    }

    // Default: enable backups for prod and staging
    return this.config.environment === 'prod' || this.config.environment === 'staging';
  }

  /**
   * Get backup retention period in days
   */
  getBackupRetentionDays(): number {
    if (this.config.backupRetentionDays !== undefined) {
      return this.config.backupRetentionDays;
    }

    switch (this.config.environment) {
      case 'prod':
        return 30; // 30 days for production
      case 'staging':
        return 14; // 14 days for staging
      case 'dev':
        return 7; // 7 days for dev (if backups enabled)
      default:
        return 30; // Fail safe
    }
  }

  /**
   * Whether to enable point-in-time recovery
   */
  shouldEnablePointInTimeRecovery(): boolean {
    return this.config.environment === 'prod' || this.config.environment === 'staging';
  }

  /**
   * Whether to enable cross-region backups
   */
  shouldEnableCrossRegionBackups(): boolean {
    return this.config.environment === 'prod';
  }

  /**
   * Get auto-delete objects setting for S3
   * CRITICAL: Must be false for production to prevent data loss
   */
  shouldAutoDeleteObjects(): boolean {
    if (this.config.forceRetain) {
      return false;
    }

    return this.config.environment === 'dev';
  }

  /**
   * Validate statefulness configuration
   * Throws error if configuration is unsafe for production
   */
  validate(): void {
    if (this.config.environment === 'prod') {
      if (this.config.enableBackups === false) {
        throw new Error(
          'CRITICAL: Backups cannot be disabled for production environment. ' +
            'This violates data protection requirements.'
        );
      }

      if (this.config.backupRetentionDays !== undefined && this.config.backupRetentionDays < 7) {
        throw new Error(
          'CRITICAL: Production backup retention must be at least 7 days. ' +
            'Current setting violates data protection requirements.'
        );
      }
    }
  }
}

/**
 * Factory function to create statefulness policy
 */
export function createStatefulnessPolicy(config: StatefulnessConfig): StatefulnessPolicy {
  const policy = new StatefulnessPolicy(config);
  policy.validate(); // Validate on creation
  return policy;
}
