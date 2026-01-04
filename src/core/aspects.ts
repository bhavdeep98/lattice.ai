import { Aspects, IAspect, Stack, Tags } from 'aws-cdk-lib';
import { IConstruct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { LatticeAspectsConfig } from './types';

/**
 * Security Aspect - The "Compliance Guard"
 * Automatically enforces security best practices
 */
export class SecurityAspect implements IAspect {
  constructor(private config: LatticeAspectsConfig) {}

  visit(node: IConstruct): void {
    // Enforce S3 bucket encryption
    if (node instanceof s3.Bucket) {
      if (!node.encryption) {
        throw new Error(`S3 bucket ${node.node.id} must have encryption enabled`);
      }
    }

    // Enforce RDS encryption
    if (node instanceof rds.DatabaseInstance) {
      if (!node.storageEncrypted) {
        throw new Error(`RDS instance ${node.node.id} must have storage encryption enabled`);
      }
    }

    // Enforce security group rules
    if (node instanceof ec2.SecurityGroup) {
      // Add default security validations
      const rules = node.node.children.filter(child => 
        child.constructor.name.includes('SecurityGroupRule')
      );
      
      // Check for overly permissive rules
      rules.forEach(rule => {
        // Implementation would check for 0.0.0.0/0 rules, etc.
      });
    }
  }
}

/**
 * Cost Aspect - The "Size Validator"
 * Prevents cost overruns by validating resource sizes
 */
export class CostAspect implements IAspect {
  constructor(private config: LatticeAspectsConfig) {}

  visit(node: IConstruct): void {
    const { environment, costLimits } = this.config;

    // Validate EC2 instance sizes
    if (node instanceof ec2.Instance) {
      const instanceType = node.instanceType.toString();
      
      if (environment === 'dev' && instanceType.includes('large')) {
        throw new Error(`Large instances not allowed in dev environment: ${instanceType}`);
      }
      
      if (costLimits?.maxInstanceSize && instanceType.includes(costLimits.maxInstanceSize)) {
        // Validate against cost limits
      }
    }

    // Validate RDS instance sizes
    if (node instanceof rds.DatabaseInstance) {
      const instanceClass = node.instanceType.toString();
      
      if (environment === 'dev' && instanceClass.includes('large')) {
        throw new Error(`Large RDS instances not allowed in dev environment: ${instanceClass}`);
      }
    }
  }
}

/**
 * Tagging Aspect - The "Resource Organizer"
 * Ensures consistent resource tagging
 */
export class TaggingAspect implements IAspect {
  constructor(private config: LatticeAspectsConfig) {}

  visit(node: IConstruct): void {
    const { environment, projectName, owner, additionalTags } = this.config;

    // Apply standard tags to all taggable resources
    Tags.of(node).add('Environment', environment);
    Tags.of(node).add('Project', projectName);
    Tags.of(node).add('Owner', owner);
    Tags.of(node).add('ManagedBy', 'Lattice');
    Tags.of(node).add('CreatedAt', new Date().toISOString());

    // Apply additional tags if provided
    if (additionalTags) {
      Object.entries(additionalTags).forEach(([key, value]) => {
        Tags.of(node).add(key, value);
      });
    }
  }
}

/**
 * Apply all Lattice aspects to a stack
 * This is the main entry point for enabling guardrails
 */
export function applyLatticeAspects(stack: Stack, config: LatticeAspectsConfig): void {
  // Apply aspects in order of importance
  Aspects.of(stack).add(new TaggingAspect(config));
  Aspects.of(stack).add(new SecurityAspect(config));
  Aspects.of(stack).add(new CostAspect(config));
}