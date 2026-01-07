/**
 * Main ruleset that decides which templates to apply and merges threats
 */

import { ThreatFactsCollector } from '../collectors/collect-inventory';
import { ThreatItem } from '../model';
import { dataPipelineThreats } from './templates/data-pipeline';
import { genaiRagThreats } from './templates/genai-rag';
import { serverlessApiThreats } from './templates/serverless-api';
import { generalCloudThreats } from './templates/general';

export function generateThreats(facts: ThreatFactsCollector, workloadType: string): ThreatItem[] {
  const services = new Set(facts.inventory.map((r) => r.service));
  const threats: ThreatItem[] = [];

  // Apply workload-specific templates
  switch (workloadType) {
    case 'data-pipeline':
      threats.push(
        ...dataPipelineThreats({
          hasS3: services.has('s3'),
          hasGlue: services.has('glue'),
          hasStepFunctions: services.has('stepfunctions'),
          hasKinesis: services.has('kinesis'),
          hasRedshift: services.has('redshift'),
          hasEMR: services.has('emr'),
        })
      );
      break;

    case 'genai-rag':
      threats.push(
        ...genaiRagThreats({
          hasBedrock: services.has('bedrock'),
          hasSageMaker: services.has('sagemaker'),
          hasVectorStore: services.has('opensearch') || services.has('pinecone'),
          hasS3: services.has('s3'),
          hasApiGateway: services.has('apigateway'),
        })
      );
      break;

    case 'serverless-api':
      threats.push(
        ...serverlessApiThreats({
          hasApiGateway: services.has('apigateway'),
          hasLambda: services.has('lambda'),
          hasDynamoDB: services.has('dynamodb'),
          hasS3: services.has('s3'),
          hasCognito: services.has('cognito'),
        })
      );
      break;

    case 'container-app':
    case 'three-tier':
    case 'general':
    default:
      // Apply general cloud threats as fallback
      threats.push(
        ...generalCloudThreats({
          hasPublicEndpoints: facts.entryPoints.some((ep) => ep.isPublic),
          hasDataStores: facts.dataStores.length > 0,
          hasCompute: services.has('lambda') || services.has('ec2') || services.has('ecs'),
          hasIAM: true, // Always assume IAM is involved
        })
      );
      break;
  }

  // Always add some general threats regardless of workload type
  if (workloadType !== 'general') {
    const generalThreats = generalCloudThreats({
      hasPublicEndpoints: facts.entryPoints.some((ep) => ep.isPublic),
      hasDataStores: facts.dataStores.length > 0,
      hasCompute: services.has('lambda') || services.has('ec2') || services.has('ecs'),
      hasIAM: true,
    });

    // Add only non-duplicate general threats
    const existingIds = new Set(threats.map((t) => t.id));
    const additionalThreats = generalThreats.filter((t) => !existingIds.has(t.id));
    threats.push(...additionalThreats);
  }

  // Apply risk scoring
  return threats.map((threat) => ({
    ...threat,
    risk: calculateRisk(threat.likelihood, threat.impact),
  }));
}

function calculateRisk(
  likelihood: 'Low' | 'Medium' | 'High',
  impact: 'Low' | 'Medium' | 'High'
): 'Low' | 'Medium' | 'High' | 'Critical' {
  // Simple deterministic matrix
  if (likelihood === 'High' && impact === 'High') {
    return 'Critical';
  }
  if (
    (likelihood === 'High' && impact === 'Medium') ||
    (likelihood === 'Medium' && impact === 'High')
  ) {
    return 'High';
  }
  if (likelihood === 'Medium' && impact === 'Medium') {
    return 'High';
  }
  if (
    (likelihood === 'High' && impact === 'Low') ||
    (likelihood === 'Low' && impact === 'High') ||
    (likelihood === 'Medium' && impact === 'Low') ||
    (likelihood === 'Low' && impact === 'Medium')
  ) {
    return 'Medium';
  }
  return 'Low';
}
