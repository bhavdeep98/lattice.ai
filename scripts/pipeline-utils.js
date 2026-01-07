#!/usr/bin/env node

/**
 * Lattice Pipeline Utilities
 * Helper scripts for CI/CD pipeline operations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PipelineUtils {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      const configPath = path.join(process.cwd(), '.lattice', 'pipeline-config.yml');
      if (fs.existsSync(configPath)) {
        // In a real implementation, we'd use a YAML parser
        console.log('📋 Pipeline configuration loaded');
        return {};
      }
    } catch (error) {
      console.warn('⚠️ Could not load pipeline config, using defaults');
    }
    return {};
  }

  /**
   * Analyze threat model and determine if deployment should proceed
   */
  analyzeThreatModel(environment = 'development') {
    console.log(`🔍 Analyzing threat model for ${environment} environment...`);

    const threatModelPath = path.join(process.cwd(), 'cdk.out', 'threat-model.json');

    if (!fs.existsSync(threatModelPath)) {
      console.log('⚠️ No threat model found - skipping security analysis');
      return { canDeploy: true, warnings: ['No threat model generated'] };
    }

    try {
      const threatModel = JSON.parse(fs.readFileSync(threatModelPath, 'utf8'));

      const criticalThreats = threatModel.threats.filter((t) => t.risk === 'Critical');
      const highThreats = threatModel.threats.filter((t) => t.risk === 'High');
      const securityWarnings = threatModel.checklist.filter((c) => c.status === 'Warn');

      console.log(`📊 Threat Analysis Results:`);
      console.log(`  🔴 Critical: ${criticalThreats.length}`);
      console.log(`  🟠 High: ${highThreats.length}`);
      console.log(`  ⚠️ Security Warnings: ${securityWarnings.length}`);

      // Environment-specific rules
      let canDeploy = true;
      const warnings = [];

      if (environment === 'production') {
        if (criticalThreats.length > 0) {
          canDeploy = false;
          warnings.push(
            `❌ Cannot deploy to production with ${criticalThreats.length} critical threats`
          );
        }
        if (highThreats.length > 5) {
          warnings.push(`⚠️ High number of high-risk threats: ${highThreats.length}`);
        }
      } else if (environment === 'staging') {
        if (criticalThreats.length > 2) {
          canDeploy = false;
          warnings.push(`❌ Too many critical threats for staging: ${criticalThreats.length}`);
        }
      } else {
        // Development - more lenient
        if (criticalThreats.length > 5) {
          warnings.push(`⚠️ Many critical threats in development: ${criticalThreats.length}`);
        }
      }

      return {
        canDeploy,
        warnings,
        stats: {
          critical: criticalThreats.length,
          high: highThreats.length,
          securityWarnings: securityWarnings.length,
        },
        criticalThreats: criticalThreats.map((t) => ({
          id: t.id,
          title: t.title,
          scenario: t.scenario,
        })),
      };
    } catch (error) {
      console.error('❌ Error analyzing threat model:', error.message);
      return { canDeploy: false, warnings: ['Failed to analyze threat model'] };
    }
  }

  /**
   * Estimate infrastructure costs based on resources
   */
  estimateCosts() {
    console.log('💰 Estimating infrastructure costs...');

    try {
      const cdkOutDir = path.join(process.cwd(), 'cdk.out');
      const templateFiles = fs
        .readdirSync(cdkOutDir)
        .filter((file) => file.endsWith('.template.json'))
        .filter((file) => !file.includes('asset'));

      let totalResources = 0;
      const resourceTypes = new Set();

      templateFiles.forEach((file) => {
        const template = JSON.parse(fs.readFileSync(path.join(cdkOutDir, file), 'utf8'));
        const resources = template.Resources || {};

        totalResources += Object.keys(resources).length;

        Object.values(resources).forEach((resource) => {
          resourceTypes.add(resource.Type);
        });
      });

      // Simple cost estimation logic
      let estimatedMonthlyCost = 0;

      resourceTypes.forEach((type) => {
        switch (true) {
          case type.includes('RDS'):
            estimatedMonthlyCost += 50; // Base RDS cost
            break;
          case type.includes('LoadBalancer'):
            estimatedMonthlyCost += 25; // ALB cost
            break;
          case type.includes('Lambda'):
            estimatedMonthlyCost += 5; // Lambda base cost
            break;
          case type.includes('S3'):
            estimatedMonthlyCost += 10; // S3 storage
            break;
          case type.includes('DynamoDB'):
            estimatedMonthlyCost += 15; // DynamoDB
            break;
          case type.includes('EC2'):
            estimatedMonthlyCost += 75; // EC2 instance
            break;
          default:
            estimatedMonthlyCost += 2; // Other resources
        }
      });

      console.log(`📊 Cost Estimation:`);
      console.log(`  📦 Total Resources: ${totalResources}`);
      console.log(`  🏷️ Resource Types: ${resourceTypes.size}`);
      console.log(`  💰 Estimated Monthly Cost: $${estimatedMonthlyCost}`);

      return {
        totalResources,
        resourceTypes: Array.from(resourceTypes),
        estimatedMonthlyCost,
        breakdown: this.getCostBreakdown(resourceTypes),
      };
    } catch (error) {
      console.error('❌ Error estimating costs:', error.message);
      return { estimatedMonthlyCost: 0, error: error.message };
    }
  }

  getCostBreakdown(resourceTypes) {
    const breakdown = {};
    resourceTypes.forEach((type) => {
      const service = type.split('::')[1] || 'Unknown';
      breakdown[service] = breakdown[service] || 0;
      breakdown[service] += 1;
    });
    return breakdown;
  }

  /**
   * Generate deployment summary
   */
  generateDeploymentSummary(environment, threatAnalysis, costEstimate) {
    const summary = {
      environment,
      timestamp: new Date().toISOString(),
      security: {
        canDeploy: threatAnalysis.canDeploy,
        criticalThreats: threatAnalysis.stats?.critical || 0,
        highThreats: threatAnalysis.stats?.high || 0,
        securityWarnings: threatAnalysis.stats?.securityWarnings || 0,
      },
      cost: {
        estimatedMonthlyCost: costEstimate.estimatedMonthlyCost,
        totalResources: costEstimate.totalResources,
      },
      warnings: threatAnalysis.warnings || [],
    };

    // Write summary to file
    const summaryPath = path.join(process.cwd(), 'deployment-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    console.log('📋 Deployment summary generated');
    return summary;
  }

  /**
   * Check if changes are documentation-only
   */
  isDocumentationOnlyChange() {
    try {
      const changedFiles = execSync('git diff --name-only HEAD~1', { encoding: 'utf8' })
        .split('\n')
        .filter((file) => file.trim());

      const docExtensions = ['.md', '.txt', '.rst', '.adoc'];
      const docPaths = ['docs/', 'README', 'CHANGELOG', 'LICENSE'];

      const isDocOnly = changedFiles.every((file) => {
        return (
          docExtensions.some((ext) => file.endsWith(ext)) ||
          docPaths.some((path) => file.includes(path))
        );
      });

      console.log(`📝 Documentation-only change: ${isDocOnly}`);
      return isDocOnly;
    } catch (error) {
      console.log('⚠️ Could not determine change type, assuming code changes');
      return false;
    }
  }
}

// CLI interface
if (require.main === module) {
  const utils = new PipelineUtils();
  const command = process.argv[2];
  const environment = process.argv[3] || 'development';

  switch (command) {
    case 'analyze-threats':
      const threatAnalysis = utils.analyzeThreatModel(environment);
      console.log(JSON.stringify(threatAnalysis, null, 2));
      process.exit(threatAnalysis.canDeploy ? 0 : 1);
      break;

    case 'estimate-costs':
      const costEstimate = utils.estimateCosts();
      console.log(JSON.stringify(costEstimate, null, 2));
      break;

    case 'deployment-summary':
      const threats = utils.analyzeThreatModel(environment);
      const costs = utils.estimateCosts();
      const summary = utils.generateDeploymentSummary(environment, threats, costs);
      console.log(JSON.stringify(summary, null, 2));
      break;

    case 'check-doc-only':
      const isDocOnly = utils.isDocumentationOnlyChange();
      process.exit(isDocOnly ? 0 : 1);
      break;

    default:
      console.log('Usage: node pipeline-utils.js <command> [environment]');
      console.log('Commands:');
      console.log('  analyze-threats [env]  - Analyze threat model');
      console.log('  estimate-costs         - Estimate infrastructure costs');
      console.log('  deployment-summary [env] - Generate deployment summary');
      console.log('  check-doc-only         - Check if changes are documentation only');
      process.exit(1);
  }
}

module.exports = PipelineUtils;
