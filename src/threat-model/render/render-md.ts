/**
 * Markdown threat model renderer
 */

import { ThreatModelDoc } from '../model';

export function renderThreatModelMd(model: ThreatModelDoc): string {
  const sections: string[] = [];

  // Title and metadata
  sections.push(`# Threat Model: ${model.meta.projectName || 'AWS Architecture'}`);
  sections.push('');
  sections.push(`**Generated:** ${model.meta.generatedAt}`);
  sections.push(`**Workload Type:** ${model.workloadType}`);
  if (model.meta.latticeVersion) {
    sections.push(`**Lattice Version:** ${model.meta.latticeVersion}`);
  }
  sections.push('');

  // Executive Summary
  sections.push('## Executive Summary');
  sections.push('');
  const criticalThreats = model.threats.filter((t) => t.risk === 'Critical').length;
  const highThreats = model.threats.filter((t) => t.risk === 'High').length;
  const mediumThreats = model.threats.filter((t) => t.risk === 'Medium').length;
  const lowThreats = model.threats.filter((t) => t.risk === 'Low').length;

  sections.push(
    `This threat model identifies **${model.threats.length} potential threats** across the architecture:`
  );
  sections.push('');
  if (criticalThreats > 0) {
    sections.push(`- 🔴 **${criticalThreats} Critical** risk threats`);
  }
  if (highThreats > 0) {
    sections.push(`- 🟠 **${highThreats} High** risk threats`);
  }
  if (mediumThreats > 0) {
    sections.push(`- 🟡 **${mediumThreats} Medium** risk threats`);
  }
  if (lowThreats > 0) {
    sections.push(`- 🟢 **${lowThreats} Low** risk threats`);
  }
  sections.push('');

  // Architecture Overview
  sections.push('## Architecture Overview');
  sections.push('');
  sections.push(
    `**Services:** ${model.inventory.length} AWS resources across ${new Set(model.inventory.map((r) => r.service)).size} service types`
  );
  sections.push(
    `**Entry Points:** ${model.entryPoints.length} (${model.entryPoints.filter((ep) => ep.isPublic).length} public)`
  );
  sections.push(`**Data Stores:** ${model.dataStores.length}`);
  sections.push(`**Trust Boundaries:** ${model.boundaries.length}`);
  sections.push('');

  // Inventory Summary
  sections.push('### Resource Inventory');
  sections.push('');
  const serviceGroups = model.inventory.reduce(
    (acc, resource) => {
      if (!acc[resource.service]) {
        acc[resource.service] = [];
      }
      acc[resource.service].push(resource);
      return acc;
    },
    {} as Record<string, typeof model.inventory>
  );

  Object.keys(serviceGroups)
    .sort()
    .forEach((service) => {
      const resources = serviceGroups[service];
      sections.push(`**${service.toUpperCase()}** (${resources.length})`);
      resources
        .sort((a, b) => a.id.localeCompare(b.id))
        .forEach((resource) => {
          sections.push(`- \`${resource.id}\` (${resource.type})`);
        });
      sections.push('');
    });

  // Trust Boundaries
  sections.push('### Trust Boundaries');
  sections.push('');
  model.boundaries
    .sort((a, b) => a.id.localeCompare(b.id))
    .forEach((boundary) => {
      sections.push(`**${boundary.name}** (\`${boundary.type}\`)`);
      sections.push(`${boundary.description}`);
      sections.push('');
    });

  // Data Flows
  if (model.flows.length > 0) {
    sections.push('### Data Flows');
    sections.push('');
    model.flows
      .sort((a, b) => a.from.localeCompare(b.from))
      .forEach((flow) => {
        sections.push(`- \`${flow.from}\` → \`${flow.to}\`: ${flow.label}`);
      });
    sections.push('');
  }

  // Threats by STRIDE
  sections.push('## Threat Analysis');
  sections.push('');

  const strideCategories = [
    'Spoofing',
    'Tampering',
    'Repudiation',
    'InformationDisclosure',
    'DenialOfService',
    'ElevationOfPrivilege',
  ] as const;

  strideCategories.forEach((stride) => {
    const strideThreats = model.threats.filter((t) => t.stride === stride);
    if (strideThreats.length === 0) {
      return;
    }

    sections.push(`### ${stride}`);
    sections.push('');

    strideThreats
      .sort((a, b) => a.id.localeCompare(b.id))
      .forEach((threat) => {
        const riskEmoji = getRiskEmoji(threat.risk);
        sections.push(`#### ${riskEmoji} ${threat.title} (\`${threat.id}\`)`);
        sections.push('');
        sections.push(
          `**Risk Level:** ${threat.risk} (${threat.likelihood} likelihood × ${threat.impact} impact)`
        );
        sections.push('');
        sections.push(`**Scenario:** ${threat.scenario}`);
        sections.push('');

        if (threat.affectedAssets.length > 0) {
          sections.push(`**Affected Assets:** ${threat.affectedAssets.join(', ')}`);
          sections.push('');
        }

        if (threat.mitigations.length > 0) {
          sections.push('**Mitigations:**');
          threat.mitigations.forEach((mitigation) => {
            sections.push(`- ${mitigation.control}`);
            if (mitigation.awsServices && mitigation.awsServices.length > 0) {
              sections.push(`  - *AWS Services:* ${mitigation.awsServices.join(', ')}`);
            }
          });
          sections.push('');
        }

        if (threat.detections.length > 0) {
          sections.push('**Detection & Monitoring:**');
          threat.detections.forEach((detection) => {
            sections.push(`- ${detection.signal}`);
            if (detection.awsServices && detection.awsServices.length > 0) {
              sections.push(`  - *AWS Services:* ${detection.awsServices.join(', ')}`);
            }
          });
          sections.push('');
        }
      });
  });

  // Security Controls Checklist
  sections.push('## Security Controls Checklist');
  sections.push('');
  if (model.checklist.length > 0) {
    model.checklist.forEach((item) => {
      const statusEmoji = item.status === 'Pass' ? '✅' : item.status === 'Warn' ? '⚠️' : '❓';
      sections.push(`${statusEmoji} ${item.item}`);
      if (item.details) {
        sections.push(`   *${item.details}*`);
      }
    });
  } else {
    sections.push('*No automated checks available for this architecture.*');
  }
  sections.push('');

  // Open Questions
  if (model.openQuestions.length > 0) {
    sections.push('## Open Questions');
    sections.push('');
    sections.push('The following questions should be addressed during security review:');
    sections.push('');
    model.openQuestions.forEach((question, index) => {
      sections.push(`${index + 1}. ${question}`);
    });
    sections.push('');
  }

  // Footer
  sections.push('---');
  sections.push('');
  sections.push(
    '*This threat model was automatically generated by Lattice. Review and customize as needed for your specific security requirements.*'
  );

  return sections.join('\n');
}

function getRiskEmoji(risk: string): string {
  switch (risk) {
    case 'Critical':
      return '🔴';
    case 'High':
      return '🟠';
    case 'Medium':
      return '🟡';
    case 'Low':
      return '🟢';
    default:
      return '⚪';
  }
}
