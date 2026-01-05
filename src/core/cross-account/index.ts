/**
 * Cross-Account Deployment Module
 * 
 * Provides enterprise-grade cross-account AWS deployment capabilities
 * using OIDC authentication and secure role assumption chains.
 */

export { CrossAccountStack } from './cross-account-stack';
export { CrossAccountDeploymentManager } from './deployment-manager';
export * from './types';

// Re-export commonly used types
export type {
  CrossAccountConfig,
  AccountConfig,
  DeploymentContext,
  AssumeRoleResult,
  DeploymentArtifact,
  DeploymentStatus,
  BootstrapStatus,
} from './types';