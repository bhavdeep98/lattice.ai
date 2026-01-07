/**
 * Main threat model builder
 */

import { ThreatFactsCollector } from './collectors/collect-inventory';
import { ThreatModelDoc } from './model';
import { inferWorkloadType } from './inference/infer-workload-type';
import { inferTrustBoundaries } from './inference/infer-boundaries';
import { inferDataFlows } from './inference/infer-flows';
import { generateThreats } from './rules/ruleset';

export interface ThreatModelOptions {
  projectName?: string;
  latticeVersion?: string;
}

export function buildThreatModel(
  collector: ThreatFactsCollector,
  options: ThreatModelOptions = {}
): ThreatModelDoc {
  // Infer workload characteristics
  const workloadType = inferWorkloadType(collector);
  const boundaries = inferTrustBoundaries(collector);
  const flows = inferDataFlows(collector);

  // Generate threats based on workload type and facts
  const threats = generateThreats(collector, workloadType);

  // Generate security checklist
  const checklist = generateSecurityChecklist(collector);

  // Generate open questions
  const openQuestions = generateOpenQuestions(collector, workloadType);

  return {
    meta: {
      projectName: options.projectName,
      generatedAt: new Date().toISOString(),
      latticeVersion: options.latticeVersion,
    },
    inventory: collector.inventory,
    entryPoints: collector.entryPoints,
    dataStores: collector.dataStores,
    boundaries,
    flows,
    threats,
    checklist,
    openQuestions,
    workloadType,
  };
}

function generateSecurityChecklist(collector: ThreatFactsCollector) {
  const checklist: { item: string; status: 'Pass' | 'Warn' | 'Unknown'; details?: string }[] = [];

  // Check encryption at rest
  const unencryptedStores = collector.dataStores.filter((ds) => ds.encryptionAtRest === 'none');
  checklist.push({
    item: 'All data stores have encryption at rest enabled',
    status: unencryptedStores.length === 0 ? 'Pass' : 'Warn',
    details:
      unencryptedStores.length > 0
        ? `${unencryptedStores.length} stores without encryption`
        : undefined,
  });

  // Check for public endpoints
  const publicEndpoints = collector.entryPoints.filter((ep) => ep.isPublic);
  checklist.push({
    item: 'Public endpoints are properly secured',
    status: publicEndpoints.length === 0 ? 'Pass' : 'Unknown',
    details:
      publicEndpoints.length > 0 ? `${publicEndpoints.length} public endpoints found` : undefined,
  });

  // Check for IAM wildcards (simplified heuristic)
  const hasIAM = collector.inventory.some((r) => r.service === 'iam');
  if (hasIAM) {
    checklist.push({
      item: 'IAM policies follow least-privilege principle',
      status: 'Unknown',
      details: 'Manual review required for IAM policies',
    });
  }

  // Check for logging/monitoring
  const hasCloudTrail = collector.inventory.some((r) => r.type === 'AWS::CloudTrail::Trail');
  checklist.push({
    item: 'CloudTrail logging is enabled',
    status: hasCloudTrail ? 'Pass' : 'Warn',
    details: hasCloudTrail ? undefined : 'No CloudTrail found in architecture',
  });

  return checklist;
}

function generateOpenQuestions(collector: ThreatFactsCollector, workloadType: string): string[] {
  const questions: string[] = [];

  // Always ask about data classification
  if (collector.dataStores.length > 0) {
    questions.push(
      'What types of sensitive data (PII, PHI, financial) will be stored in this system?'
    );
    questions.push('What are the data retention and deletion requirements?');
  }

  // Ask about authentication for public endpoints
  const publicEndpoints = collector.entryPoints.filter((ep) => ep.isPublic);
  if (publicEndpoints.length > 0) {
    questions.push(
      'What authentication and authorization mechanisms will be implemented for public endpoints?'
    );
    questions.push('Are there rate limiting requirements for public APIs?');
  }

  // Workload-specific questions
  switch (workloadType) {
    case 'genai-rag':
      questions.push('What measures will prevent prompt injection and model abuse?');
      questions.push('How will you ensure tenant isolation in multi-tenant RAG scenarios?');
      questions.push('What content filtering and moderation will be applied to AI outputs?');
      break;

    case 'data-pipeline':
      questions.push('What data validation and quality checks will be implemented?');
      questions.push('How will you handle PII discovery and masking in data pipelines?');
      questions.push('What are the disaster recovery requirements for data processing?');
      break;

    case 'serverless-api':
      questions.push('What input validation will be performed on API requests?');
      questions.push('How will you prevent SQL/NoSQL injection in database queries?');
      break;
  }

  // Ask about compliance if multiple data stores
  if (collector.dataStores.length > 1) {
    questions.push('What compliance frameworks (SOC2, HIPAA, PCI-DSS) apply to this system?');
  }

  // Ask about incident response
  questions.push('What is the incident response plan for security events?');
  questions.push('Who are the security contacts and escalation procedures?');

  return questions;
}

// Re-export key types and functions
export * from './model';
export * from './aspect';
export * from './collectors/collect-inventory';
export * from './render/render-md';
export * from './render/render-json';
