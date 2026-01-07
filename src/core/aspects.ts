import { Aspects, IAspect, Stack, Tags } from 'aws-cdk-lib';
import { IConstruct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as fs from 'fs';
import * as path from 'path';
import { LatticeAspectsConfig } from './types';
import {
  ThreatFactsCollector,
  ThreatModelAspect,
  buildThreatModel,
  renderThreatModelMd,
  renderThreatModelJson,
} from '../threat-model';
import { logger } from '../utils/logger';
/**
 * Security Aspect - The "Compliance Guard"
 * Automatically enforces security best practices
 */
export class SecurityAspect implements IAspect {
  constructor(private config: LatticeAspectsConfig) {}

  visit(node: IConstruct): void {
    // Set logging context for security aspect
    logger.setContext({
      operation: 'security-aspect-validation',
      resourceType: 'aspect',
      environment: this.config.environment,
    });

    // Enforce S3 bucket encryption
    if (node instanceof s3.Bucket) {
      const cfnBucket = node.node.defaultChild as s3.CfnBucket;
      if (cfnBucket && !cfnBucket.bucketEncryption) {
        const error = new Error(`S3 bucket ${node.node.id} must have encryption enabled`);
        logger.logSecurityEvent('S3 bucket encryption validation failed', 'critical', {
          bucketId: node.node.id,
          violation: 'missing_encryption',
        });
        throw error;
      } else {
        logger.logSecurityEvent('S3 bucket encryption validated', 'low', {
          bucketId: node.node.id,
          compliance: 'encryption_enabled',
        });
      }
    }

    // Enforce RDS encryption
    if (node instanceof rds.DatabaseInstance) {
      // Check the underlying CloudFormation resource
      const cfnDb = node.node.defaultChild as rds.CfnDBInstance;
      if (cfnDb && !cfnDb.storageEncrypted) {
        const error = new Error(
          `RDS instance ${node.node.id} must have storage encryption enabled`
        );
        logger.logSecurityEvent('RDS encryption validation failed', 'critical', {
          instanceId: node.node.id,
          violation: 'missing_storage_encryption',
        });
        throw error;
      } else {
        logger.logSecurityEvent('RDS encryption validated', 'low', {
          instanceId: node.node.id,
          compliance: 'storage_encryption_enabled',
        });
      }
    }

    // Enforce security group rules
    if (node instanceof ec2.SecurityGroup) {
      // Add default security validations
      const rules = node.node.children.filter((child) =>
        child.constructor.name.includes('SecurityGroupRule')
      );

      logger.info(`Validating security group rules for ${node.node.id}`, {
        rulesCount: rules.length,
      });

      // Check for overly permissive rules
      rules.forEach((rule) => {
        // Check for overly permissive CIDR blocks
        const ruleNode = rule.node;
        if (ruleNode.tryFindChild('CidrIp')) {
          const cidrIp = (ruleNode.tryFindChild('CidrIp') as any)?.value;
          if (cidrIp === '0.0.0.0/0') {
            logger.logSecurityEvent('Overly permissive security group rule detected', 'medium', {
              securityGroupId: node.node.id,
              ruleId: rule.node.id,
              cidr: cidrIp,
              violation: 'open_to_world',
            });
            console.warn(
              `⚠️ Security warning: Rule ${rule.node.id} allows access from anywhere (0.0.0.0/0)`
            );
          }
        }
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

    // Set logging context for cost aspect
    logger.setContext({
      operation: 'cost-aspect-validation',
      resourceType: 'aspect',
      environment,
    });

    // Validate EC2 instance sizes
    if (node instanceof ec2.Instance) {
      const instanceType = (node as any).instanceType?.toString();

      logger.info(`Validating EC2 instance size: ${instanceType}`, {
        instanceId: node.node.id,
        environment,
      });

      if (environment === 'dev' && instanceType && instanceType.includes('large')) {
        const error = new Error(`Large instances not allowed in dev environment: ${instanceType}`);
        logger.logSecurityEvent('Cost validation failed for EC2 instance', 'medium', {
          instanceId: node.node.id,
          instanceType,
          environment,
          violation: 'oversized_for_environment',
        });
        throw error;
      }

      if (
        costLimits?.maxInstanceSize &&
        instanceType &&
        instanceType.includes(costLimits.maxInstanceSize)
      ) {
        logger.info('Instance size validated against cost limits', {
          instanceType,
          maxAllowed: costLimits.maxInstanceSize,
        });
      }
    }

    // Validate RDS instance sizes
    if (node instanceof rds.DatabaseInstance) {
      const instanceClass = (node as any).instanceType?.toString();

      logger.info(`Validating RDS instance size: ${instanceClass}`, {
        instanceId: node.node.id,
        environment,
      });

      if (environment === 'dev' && instanceClass && instanceClass.includes('large')) {
        const error = new Error(
          `Large RDS instances not allowed in dev environment: ${instanceClass}`
        );
        logger.logSecurityEvent('Cost validation failed for RDS instance', 'medium', {
          instanceId: node.node.id,
          instanceClass,
          environment,
          violation: 'oversized_for_environment',
        });
        throw error;
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

    // Set logging context for tagging aspect
    logger.setContext({
      operation: 'tagging-aspect-application',
      resourceType: 'aspect',
      environment,
    });

    // Apply standard tags to all resources
    const standardTags = {
      Environment: environment,
      Project: projectName,
      Owner: owner || 'Unknown',
      ManagedBy: 'Lattice-CDK',
      CreatedAt: new Date().toISOString(),
      ...additionalTags,
    };

    logger.info(`Applying standard tags to resource: ${node.node.id}`, {
      resourceId: node.node.id,
      tagsCount: Object.keys(standardTags).length,
      tags: standardTags,
    });

    // Apply tags using CDK Tags utility
    Object.entries(standardTags).forEach(([key, value]) => {
      Tags.of(node).add(key, value);
    });

    logger.audit('Resource tags applied', {
      resourceId: node.node.id,
      resourceType: node.constructor.name,
      appliedTags: standardTags,
    });

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
 * Monitoring Aspect - The "Observability Guard"
 * Automatically creates dashboards for resources
 */
export class MonitoringAspect implements IAspect {
  private dashboard: cloudwatch.Dashboard | undefined;

  constructor(private config: LatticeAspectsConfig) {}

  visit(node: IConstruct): void {
    if (!this.config.enableMonitoring) {
      return;
    }

    // Create dashboard if it doesn't exist (only once per stack)
    if (!this.dashboard && node instanceof Stack) {
      this.dashboard = new cloudwatch.Dashboard(node, 'LatticeDashboard', {
        dashboardName: `${this.config.projectName}-${this.config.environment}-dashboard`,
      });
    }

    if (!this.dashboard) {
      return;
    }

    // Add RDS metrics
    if (node instanceof rds.DatabaseInstance) {
      const cpuWidget = new cloudwatch.GraphWidget({
        title: `DB CPU Utilization (${node.node.id})`,
        left: [node.metricCPUUtilization()],
      });
      const connectionsWidget = new cloudwatch.GraphWidget({
        title: `DB Connections (${node.node.id})`,
        left: [node.metricDatabaseConnections()],
      });
      this.dashboard.addWidgets(cpuWidget, connectionsWidget);
    }

    // Add S3 metrics
    if (node instanceof s3.Bucket) {
      const requestsWidget = new cloudwatch.GraphWidget({
        title: `S3 Requests (${node.node.id})`,
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/S3',
            metricName: 'AllRequests',
            dimensionsMap: { BucketName: node.bucketName },
          }),
        ],
      });
      this.dashboard.addWidgets(requestsWidget);
    }
  }
}

/**
 * Apply all Lattice aspects to a stack
 * This is the main entry point for enabling guardrails
 */
export function applyLatticeAspects(stack: Stack, config: LatticeAspectsConfig): void {
  // 1. Apply Tags (Cascading)
  const { environment, projectName, owner, additionalTags } = config;
  Tags.of(stack).add('Environment', environment);
  Tags.of(stack).add('Project', projectName);
  Tags.of(stack).add('Owner', owner);
  Tags.of(stack).add('ManagedBy', 'Lattice');

  if (additionalTags) {
    Object.entries(additionalTags).forEach(([key, value]) => {
      Tags.of(stack).add(key, value);
    });
  }

  // 2. Apply Aspects
  Aspects.of(stack).add(new SecurityAspect(config));
  Aspects.of(stack).add(new CostAspect(config));
  Aspects.of(stack).add(new MonitoringAspect(config));

  // Add threat modeling if enabled
  if (config.threatModel?.enabled) {
    const collector = new ThreatFactsCollector();
    Aspects.of(stack).add(new ThreatModelAspect(collector));

    // Hook after synthesis to generate threat model files
    stack.node.addValidation({
      validate: () => {
        try {
          const model = buildThreatModel(collector, {
            projectName: config.threatModel?.projectName ?? config.projectName,
            latticeVersion: '1.0.0', // TODO: get from package.json
          });

          const outDir = config.threatModel?.outputDir ?? 'cdk.out';
          if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
          }

          const formats = config.threatModel?.formats ?? ['md'];
          if (formats.includes('md')) {
            fs.writeFileSync(
              path.join(outDir, 'THREAT_MODEL.md'),
              renderThreatModelMd(model),
              'utf8'
            );
          }
          if (formats.includes('json')) {
            fs.writeFileSync(
              path.join(outDir, 'threat-model.json'),
              renderThreatModelJson(model),
              'utf8'
            );
          }

          console.log(`✅ Threat model generated in ${outDir}/`);
        } catch (e) {
          return [`Threat model generation failed: ${(e as Error).message}`];
        }
        return [];
      },
    });
  }
}
