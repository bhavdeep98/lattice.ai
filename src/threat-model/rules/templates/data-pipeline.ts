/**
 * Data pipeline threat template
 */

import { ThreatItem } from "../../model";

export function dataPipelineThreats(ctx: {
  hasS3: boolean;
  hasGlue: boolean;
  hasStepFunctions: boolean;
  hasKinesis: boolean;
  hasRedshift: boolean;
  hasEMR: boolean;
}): ThreatItem[] {
  const threats: ThreatItem[] = [];

  threats.push({
    id: "DP-1",
    stride: "Spoofing",
    title: "Untrusted source can inject fake data into ingestion",
    scenario: "A producer impersonates a trusted data source and writes malicious or incorrect events/objects.",
    affectedAssets: ["Raw data", "Downstream datasets", "Analytics outputs"],
    likelihood: "Medium",
    impact: "High",
    risk: "High",
    mitigations: [
      { 
        control: "Authenticate producers (IAM, signed requests) and restrict ingestion endpoints", 
        awsServices: ["IAM", "API Gateway", "VPC Endpoints"] 
      },
      { 
        control: "Use per-source buckets/prefixes and separate roles per source", 
        awsServices: ["S3", "IAM"] 
      }
    ],
    detections: [
      { 
        signal: "Alert on anomalous write patterns and new principals writing to raw zones", 
        awsServices: ["CloudTrail", "GuardDuty", "Security Hub"] 
      }
    ]
  });

  threats.push({
    id: "DP-2",
    stride: "Tampering",
    title: "Data tampering in raw/processed zones",
    scenario: "An attacker modifies objects or intermediate outputs to poison analytics/ML results.",
    affectedAssets: ["S3 objects", "ETL outputs"],
    likelihood: "Medium",
    impact: "High",
    risk: "High",
    mitigations: [
      { 
        control: "Enable S3 versioning; consider Object Lock for immutability in raw zone", 
        awsServices: ["S3"] 
      },
      { 
        control: "Use checksums/hashes across stage boundaries", 
        awsServices: ["Glue", "Lambda"] 
      }
    ],
    detections: [
      { 
        signal: "Detect object overwrite/delete spikes in raw prefixes", 
        awsServices: ["CloudTrail", "CloudWatch"] 
      }
    ]
  });

  threats.push({
    id: "DP-3",
    stride: "InformationDisclosure",
    title: "PII/sensitive data exposure in processing logs",
    scenario: "Processing jobs log sensitive data values, exposing them in CloudWatch Logs or job outputs.",
    affectedAssets: ["CloudWatch Logs", "Job outputs", "Error messages"],
    likelihood: "High",
    impact: "High",
    risk: "Critical",
    mitigations: [
      { 
        control: "Implement data masking/redaction in processing code", 
        awsServices: ["Glue", "Lambda"] 
      },
      { 
        control: "Use structured logging with field-level controls", 
        awsServices: ["CloudWatch Logs"] 
      }
    ],
    detections: [
      { 
        signal: "Scan logs for PII patterns using automated tools", 
        awsServices: ["Macie", "CloudWatch Insights"] 
      }
    ]
  });

  threats.push({
    id: "DP-4",
    stride: "DenialOfService",
    title: "Resource exhaustion from malformed/large data",
    scenario: "Malicious or malformed input data causes processing jobs to consume excessive resources or fail.",
    affectedAssets: ["Processing capacity", "Cost budget", "Downstream systems"],
    likelihood: "Medium",
    impact: "Medium",
    risk: "Medium",
    mitigations: [
      { 
        control: "Implement input validation and size limits", 
        awsServices: ["Glue", "Lambda"] 
      },
      { 
        control: "Set resource limits and timeouts on processing jobs", 
        awsServices: ["Glue", "EMR", "Step Functions"] 
      }
    ],
    detections: [
      { 
        signal: "Monitor job duration and resource consumption anomalies", 
        awsServices: ["CloudWatch", "Cost Explorer"] 
      }
    ]
  });

  if (ctx.hasRedshift) {
    threats.push({
      id: "DP-5",
      stride: "ElevationOfPrivilege",
      title: "Over-privileged data warehouse access",
      scenario: "Processing roles have excessive permissions to data warehouse, enabling unauthorized data access.",
      affectedAssets: ["Data warehouse", "Historical data", "Analytics results"],
      likelihood: "Medium",
      impact: "High",
      risk: "High",
      mitigations: [
        { 
          control: "Use least-privilege IAM roles for each processing stage", 
          awsServices: ["IAM", "Redshift"] 
        },
        { 
          control: "Implement row-level security in Redshift", 
          awsServices: ["Redshift"] 
        }
      ],
      detections: [
        { 
          signal: "Monitor unusual query patterns and data access", 
          awsServices: ["Redshift", "CloudTrail"] 
        }
      ]
    });
  }

  return threats;
}