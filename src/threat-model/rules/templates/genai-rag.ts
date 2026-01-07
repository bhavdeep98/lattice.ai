/**
 * GenAI/RAG threat template
 */

import { ThreatItem } from '../../model';

export function genaiRagThreats(ctx: {
  hasBedrock: boolean;
  hasSageMaker: boolean;
  hasVectorStore: boolean;
  hasS3: boolean;
  hasApiGateway: boolean;
}): ThreatItem[] {
  const threats: ThreatItem[] = [];

  threats.push({
    id: 'AI-1',
    stride: 'Spoofing',
    title: 'Prompt injection via user input',
    scenario:
      'Attacker crafts malicious prompts to manipulate AI model behavior, bypass safety controls, or extract training data.',
    affectedAssets: ['AI model responses', 'System prompts', 'Retrieved context'],
    likelihood: 'High',
    impact: 'High',
    risk: 'Critical',
    mitigations: [
      {
        control: 'Implement input sanitization and prompt validation',
        awsServices: ['Lambda', 'API Gateway'],
      },
      {
        control: 'Use system prompts with clear boundaries and instructions',
        awsServices: ['Bedrock', 'SageMaker'],
      },
      {
        control: 'Implement output filtering and content moderation',
        awsServices: ['Bedrock', 'Comprehend'],
      },
    ],
    detections: [
      {
        signal: 'Monitor for suspicious prompt patterns and model behavior anomalies',
        awsServices: ['CloudWatch', 'Bedrock'],
      },
    ],
  });

  threats.push({
    id: 'AI-2',
    stride: 'InformationDisclosure',
    title: 'Cross-tenant data leakage via retrieval',
    scenario:
      'RAG system retrieves and exposes documents from other tenants due to insufficient access controls.',
    affectedAssets: ['Document corpus', 'Vector embeddings', 'Retrieved context'],
    likelihood: 'Medium',
    impact: 'High',
    risk: 'High',
    mitigations: [
      {
        control: 'Implement tenant isolation in vector store with metadata filtering',
        awsServices: ['OpenSearch', 'Pinecone'],
      },
      {
        control: 'Use separate vector indices per tenant or customer',
        awsServices: ['OpenSearch', 'S3'],
      },
      {
        control: 'Validate document access permissions before retrieval',
        awsServices: ['Lambda', 'IAM'],
      },
    ],
    detections: [
      {
        signal: 'Monitor cross-tenant access attempts and retrieval patterns',
        awsServices: ['CloudTrail', 'CloudWatch'],
      },
    ],
  });

  threats.push({
    id: 'AI-3',
    stride: 'Tampering',
    title: 'Vector store poisoning',
    scenario:
      'Attacker injects malicious documents or embeddings to manipulate retrieval results and AI responses.',
    affectedAssets: ['Vector embeddings', 'Document corpus', 'AI responses'],
    likelihood: 'Medium',
    impact: 'High',
    risk: 'High',
    mitigations: [
      {
        control: 'Implement document validation and content scanning before ingestion',
        awsServices: ['Textract', 'Comprehend', 'Macie'],
      },
      {
        control: 'Use versioning and audit trails for document changes',
        awsServices: ['S3', 'OpenSearch'],
      },
      {
        control: 'Restrict document ingestion to authorized sources only',
        awsServices: ['IAM', 'S3'],
      },
    ],
    detections: [
      {
        signal: 'Monitor document ingestion patterns and embedding quality metrics',
        awsServices: ['CloudWatch', 'CloudTrail'],
      },
    ],
  });

  threats.push({
    id: 'AI-4',
    stride: 'DenialOfService',
    title: 'Model inference cost abuse',
    scenario:
      'Attacker floods the system with expensive inference requests to exhaust budget or cause service degradation.',
    affectedAssets: ['AI model capacity', 'Cost budget', 'Service availability'],
    likelihood: 'High',
    impact: 'Medium',
    risk: 'High',
    mitigations: [
      {
        control: 'Implement rate limiting and request throttling',
        awsServices: ['API Gateway', 'Lambda'],
      },
      {
        control: 'Set cost budgets and alerts for AI service usage',
        awsServices: ['Cost Explorer', 'Budgets'],
      },
      {
        control: 'Use caching for common queries and responses',
        awsServices: ['ElastiCache', 'DynamoDB'],
      },
    ],
    detections: [
      {
        signal: 'Monitor inference request patterns and cost anomalies',
        awsServices: ['CloudWatch', 'Cost Anomaly Detection'],
      },
    ],
  });

  threats.push({
    id: 'AI-5',
    stride: 'InformationDisclosure',
    title: 'Sensitive data in logs and traces',
    scenario:
      'User queries, AI responses, or retrieved context containing PII/sensitive data are logged in plaintext.',
    affectedAssets: ['CloudWatch Logs', 'X-Ray traces', 'Application logs'],
    likelihood: 'High',
    impact: 'High',
    risk: 'Critical',
    mitigations: [
      {
        control: 'Implement data redaction in logging and tracing',
        awsServices: ['Lambda', 'CloudWatch'],
      },
      {
        control: 'Use structured logging with field-level encryption',
        awsServices: ['KMS', 'CloudWatch Logs'],
      },
      {
        control: 'Minimize logging of user inputs and AI responses',
        awsServices: ['Lambda', 'API Gateway'],
      },
    ],
    detections: [
      {
        signal: 'Scan logs for PII and sensitive data patterns',
        awsServices: ['Macie', 'CloudWatch Insights'],
      },
    ],
  });

  if (ctx.hasSageMaker) {
    threats.push({
      id: 'AI-6',
      stride: 'ElevationOfPrivilege',
      title: 'Model endpoint privilege escalation',
      scenario:
        'Compromised model endpoint gains access to training data or other AWS resources beyond intended scope.',
      affectedAssets: ['Training data', 'Model artifacts', 'AWS resources'],
      likelihood: 'Low',
      impact: 'High',
      risk: 'Medium',
      mitigations: [
        {
          control: 'Use least-privilege IAM roles for SageMaker endpoints',
          awsServices: ['IAM', 'SageMaker'],
        },
        {
          control: 'Isolate model endpoints in separate VPC subnets',
          awsServices: ['VPC', 'SageMaker'],
        },
      ],
      detections: [
        {
          signal: 'Monitor unusual API calls from model endpoints',
          awsServices: ['CloudTrail', 'GuardDuty'],
        },
      ],
    });
  }

  return threats;
}
