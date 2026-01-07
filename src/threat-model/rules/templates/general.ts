/**
 * General cloud application threats (fallback template)
 */

import { ThreatItem } from '../../model';

export function generalCloudThreats(ctx: {
  hasPublicEndpoints: boolean;
  hasDataStores: boolean;
  hasCompute: boolean;
  hasIAM: boolean;
}): ThreatItem[] {
  const threats: ThreatItem[] = [];

  if (ctx.hasPublicEndpoints) {
    threats.push({
      id: 'GEN-1',
      stride: 'Spoofing',
      title: 'Unauthorized access to public endpoints',
      scenario: 'Attacker gains access to public-facing services without proper authentication.',
      affectedAssets: ['Public endpoints', 'Backend services', 'Data'],
      likelihood: 'High',
      impact: 'High',
      risk: 'Critical',
      mitigations: [
        {
          control: 'Implement strong authentication and authorization',
          awsServices: ['IAM', 'Cognito', 'API Gateway'],
        },
        {
          control: 'Use AWS WAF for additional protection',
          awsServices: ['WAF', 'CloudFront'],
        },
      ],
      detections: [
        {
          signal: 'Monitor failed authentication attempts and access patterns',
          awsServices: ['CloudWatch', 'GuardDuty'],
        },
      ],
    });
  }

  if (ctx.hasDataStores) {
    threats.push({
      id: 'GEN-2',
      stride: 'InformationDisclosure',
      title: 'Data exposure due to misconfiguration',
      scenario:
        'Sensitive data is exposed due to misconfigured storage services or overly permissive access policies.',
      affectedAssets: ['Stored data', 'Database contents', 'File storage'],
      likelihood: 'Medium',
      impact: 'High',
      risk: 'High',
      mitigations: [
        {
          control: 'Enable encryption at rest for all data stores',
          awsServices: ['KMS', 'S3', 'DynamoDB', 'RDS'],
        },
        {
          control: 'Implement least-privilege access policies',
          awsServices: ['IAM', 'S3', 'DynamoDB'],
        },
        {
          control: 'Use AWS Config for compliance monitoring',
          awsServices: ['Config', 'Security Hub'],
        },
      ],
      detections: [
        {
          signal: 'Monitor data access patterns and policy changes',
          awsServices: ['CloudTrail', 'Macie'],
        },
      ],
    });

    threats.push({
      id: 'GEN-3',
      stride: 'Tampering',
      title: 'Unauthorized data modification',
      scenario: 'Attacker modifies stored data without authorization, compromising data integrity.',
      affectedAssets: ['Database records', 'File contents', 'Configuration data'],
      likelihood: 'Medium',
      impact: 'High',
      risk: 'High',
      mitigations: [
        {
          control: 'Enable versioning and backup for critical data stores',
          awsServices: ['S3', 'DynamoDB', 'RDS'],
        },
        {
          control: 'Implement data integrity checks and validation',
          awsServices: ['Lambda', 'CloudWatch'],
        },
      ],
      detections: [
        {
          signal: 'Monitor data modification patterns and integrity violations',
          awsServices: ['CloudTrail', 'CloudWatch'],
        },
      ],
    });
  }

  if (ctx.hasCompute) {
    threats.push({
      id: 'GEN-4',
      stride: 'ElevationOfPrivilege',
      title: 'Compute service privilege escalation',
      scenario:
        'Compromised compute resources gain excessive permissions to access other AWS services.',
      affectedAssets: ['AWS resources', 'Service accounts', 'Data stores'],
      likelihood: 'Medium',
      impact: 'High',
      risk: 'High',
      mitigations: [
        {
          control: 'Apply least-privilege IAM roles to all compute resources',
          awsServices: ['IAM', 'Lambda', 'EC2', 'ECS'],
        },
        {
          control: 'Use instance profiles and service-linked roles',
          awsServices: ['IAM'],
        },
      ],
      detections: [
        {
          signal: 'Monitor unusual AWS API calls from compute resources',
          awsServices: ['CloudTrail', 'GuardDuty'],
        },
      ],
    });

    threats.push({
      id: 'GEN-5',
      stride: 'DenialOfService',
      title: 'Resource exhaustion and cost abuse',
      scenario:
        'Attacker causes excessive resource consumption leading to service degradation or unexpected costs.',
      affectedAssets: ['Service availability', 'Cost budget', 'Resource capacity'],
      likelihood: 'Medium',
      impact: 'Medium',
      risk: 'Medium',
      mitigations: [
        {
          control: 'Set resource limits and auto-scaling policies',
          awsServices: ['Auto Scaling', 'Lambda', 'ECS'],
        },
        {
          control: 'Implement cost budgets and alerts',
          awsServices: ['Budgets', 'Cost Explorer'],
        },
      ],
      detections: [
        {
          signal: 'Monitor resource utilization and cost anomalies',
          awsServices: ['CloudWatch', 'Cost Anomaly Detection'],
        },
      ],
    });
  }

  threats.push({
    id: 'GEN-6',
    stride: 'Repudiation',
    title: 'Insufficient audit logging',
    scenario:
      'Lack of comprehensive logging makes it difficult to investigate security incidents or prove compliance.',
    affectedAssets: ['Audit trails', 'Compliance records', 'Incident response'],
    likelihood: 'High',
    impact: 'Medium',
    risk: 'High',
    mitigations: [
      {
        control: 'Enable comprehensive CloudTrail logging',
        awsServices: ['CloudTrail', 'S3'],
      },
      {
        control: 'Implement centralized log aggregation and retention',
        awsServices: ['CloudWatch Logs', 'S3'],
      },
    ],
    detections: [
      {
        signal: 'Monitor log completeness and retention compliance',
        awsServices: ['Config', 'Security Hub'],
      },
    ],
  });

  return threats;
}
