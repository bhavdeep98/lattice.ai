/**
 * Serverless API threat template
 */

import { ThreatItem } from '../../model';

export function serverlessApiThreats(ctx: {
  hasApiGateway: boolean;
  hasLambda: boolean;
  hasDynamoDB: boolean;
  hasS3: boolean;
  hasCognito: boolean;
}): ThreatItem[] {
  const threats: ThreatItem[] = [];

  threats.push({
    id: 'API-1',
    stride: 'Spoofing',
    title: 'Unauthenticated API access',
    scenario: 'Attacker bypasses authentication mechanisms to access protected API endpoints.',
    affectedAssets: ['API endpoints', 'Backend data', 'User accounts'],
    likelihood: 'High',
    impact: 'High',
    risk: 'Critical',
    mitigations: [
      {
        control: 'Implement proper authentication (JWT, API keys, IAM)',
        awsServices: ['API Gateway', 'Cognito', 'IAM'],
      },
      {
        control: 'Use API Gateway authorizers for custom authentication logic',
        awsServices: ['API Gateway', 'Lambda'],
      },
    ],
    detections: [
      {
        signal: 'Monitor failed authentication attempts and suspicious access patterns',
        awsServices: ['CloudWatch', 'WAF'],
      },
    ],
  });

  threats.push({
    id: 'API-2',
    stride: 'Tampering',
    title: 'SQL/NoSQL injection in Lambda functions',
    scenario:
      'Malicious input in API requests leads to injection attacks against database queries.',
    affectedAssets: ['Database records', 'Application logic', 'Data integrity'],
    likelihood: 'Medium',
    impact: 'High',
    risk: 'High',
    mitigations: [
      {
        control: 'Use parameterized queries and ORM/ODM libraries',
        awsServices: ['Lambda', 'DynamoDB'],
      },
      {
        control: 'Implement input validation and sanitization',
        awsServices: ['API Gateway', 'Lambda'],
      },
    ],
    detections: [
      {
        signal: 'Monitor database error patterns and unusual query structures',
        awsServices: ['CloudWatch', 'X-Ray'],
      },
    ],
  });

  threats.push({
    id: 'API-3',
    stride: 'DenialOfService',
    title: 'API rate limiting bypass and resource exhaustion',
    scenario:
      'Attacker overwhelms API with requests, causing service degradation or Lambda timeout/memory issues.',
    affectedAssets: ['API availability', 'Lambda concurrency', 'Cost budget'],
    likelihood: 'High',
    impact: 'Medium',
    risk: 'High',
    mitigations: [
      {
        control: 'Implement API Gateway throttling and usage plans',
        awsServices: ['API Gateway'],
      },
      {
        control: 'Set Lambda reserved concurrency and timeout limits',
        awsServices: ['Lambda'],
      },
      {
        control: 'Use AWS WAF for additional rate limiting and filtering',
        awsServices: ['WAF', 'API Gateway'],
      },
    ],
    detections: [
      {
        signal: 'Monitor API request rates and Lambda error/timeout patterns',
        awsServices: ['CloudWatch', 'X-Ray'],
      },
    ],
  });

  threats.push({
    id: 'API-4',
    stride: 'InformationDisclosure',
    title: 'Sensitive data exposure in API responses',
    scenario:
      'API accidentally exposes sensitive user data, internal system information, or error details.',
    affectedAssets: ['User PII', 'System internals', 'Error messages'],
    likelihood: 'Medium',
    impact: 'High',
    risk: 'High',
    mitigations: [
      {
        control: 'Implement response filtering and data minimization',
        awsServices: ['Lambda', 'API Gateway'],
      },
      {
        control: 'Use structured error handling without sensitive details',
        awsServices: ['Lambda'],
      },
    ],
    detections: [
      {
        signal: 'Scan API responses for PII and sensitive data patterns',
        awsServices: ['Macie', 'CloudWatch Insights'],
      },
    ],
  });

  threats.push({
    id: 'API-5',
    stride: 'ElevationOfPrivilege',
    title: 'Lambda function privilege escalation',
    scenario:
      'Compromised Lambda function uses excessive IAM permissions to access unintended AWS resources.',
    affectedAssets: ['AWS resources', 'Other Lambda functions', 'Data stores'],
    likelihood: 'Medium',
    impact: 'High',
    risk: 'High',
    mitigations: [
      {
        control: 'Apply least-privilege IAM roles to Lambda functions',
        awsServices: ['IAM', 'Lambda'],
      },
      {
        control: 'Use resource-based policies for fine-grained access control',
        awsServices: ['IAM', 'S3', 'DynamoDB'],
      },
    ],
    detections: [
      {
        signal: 'Monitor unusual AWS API calls from Lambda functions',
        awsServices: ['CloudTrail', 'GuardDuty'],
      },
    ],
  });

  if (ctx.hasDynamoDB) {
    threats.push({
      id: 'API-6',
      stride: 'Repudiation',
      title: 'Insufficient audit logging for data changes',
      scenario:
        'Lack of proper audit trails makes it impossible to track who made what changes to data.',
      affectedAssets: ['Data integrity', 'Compliance records', 'Audit trails'],
      likelihood: 'Medium',
      impact: 'Medium',
      risk: 'Medium',
      mitigations: [
        {
          control: 'Enable DynamoDB Streams for change tracking',
          awsServices: ['DynamoDB', 'Lambda'],
        },
        {
          control: 'Implement comprehensive application-level audit logging',
          awsServices: ['CloudWatch Logs', 'Lambda'],
        },
      ],
      detections: [
        {
          signal: 'Monitor data change patterns and access anomalies',
          awsServices: ['CloudWatch', 'DynamoDB Insights'],
        },
      ],
    });
  }

  return threats;
}
