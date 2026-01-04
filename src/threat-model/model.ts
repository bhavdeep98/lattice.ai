/**
 * Core data model for threat modeling
 * Stable, JSON-friendly types for threat model artifacts
 */

export type Stride =
  | "Spoofing"
  | "Tampering"
  | "Repudiation"
  | "InformationDisclosure"
  | "DenialOfService"
  | "ElevationOfPrivilege";

export interface ResourceRef {
  id: string;                // construct.node.path
  type: string;              // e.g., "AWS::Lambda::Function"
  service: string;           // e.g., "lambda"
  props?: Record<string, any>; // small, curated subset (no giant blobs)
}

export interface EntryPoint {
  id: string;
  kind: "apigw" | "alb" | "cloudfront" | "public-s3-website" | "other";
  isPublic: boolean;
  notes?: string;
}

export interface DataStore {
  id: string;
  kind: "s3" | "dynamodb" | "rds" | "redshift" | "opensearch" | "efs" | "other";
  containsSensitiveDataLikely: boolean; // heuristic
  encryptionAtRest?: "kms" | "aws-managed" | "none" | "unknown";
}

export interface TrustBoundary {
  id: string;
  name: string;
  type: "InternetToAWS" | "VPCBoundary" | "AccountBoundary" | "ServiceToService";
  description: string;
}

export interface DataFlow {
  from: string; // resource id or boundary id
  to: string;
  label: string;
}

export interface ThreatItem {
  id: string;
  stride: Stride;
  title: string;
  scenario: string;
  affectedAssets: string[];
  likelihood: "Low" | "Medium" | "High";
  impact: "Low" | "Medium" | "High";
  risk: "Low" | "Medium" | "High" | "Critical";
  mitigations: { control: string; awsServices?: string[] }[];
  detections: { signal: string; awsServices?: string[] }[];
}

export interface ThreatModelDoc {
  meta: {
    projectName?: string;
    generatedAt: string;
    latticeVersion?: string;
  };
  inventory: ResourceRef[];
  entryPoints: EntryPoint[];
  dataStores: DataStore[];
  boundaries: TrustBoundary[];
  flows: DataFlow[];
  threats: ThreatItem[];
  checklist: { item: string; status: "Pass" | "Warn" | "Unknown"; details?: string }[];
  openQuestions: string[];
  workloadType: string; // "data-pipeline" | "genai-rag" | ...
}