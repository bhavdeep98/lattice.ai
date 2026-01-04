/**
 * Trust boundary inference
 */

import { ThreatFactsCollector } from "../collectors/collect-inventory";
import { TrustBoundary } from "../model";

export function inferTrustBoundaries(facts: ThreatFactsCollector): TrustBoundary[] {
  const boundaries: TrustBoundary[] = [];

  // Always include account boundary
  boundaries.push({
    id: "account-boundary",
    name: "AWS Account Boundary",
    type: "AccountBoundary",
    description: "Boundary between this AWS account and external entities"
  });

  // Internet → AWS entry points boundary if any entrypoint is public
  const hasPublicEntryPoints = facts.entryPoints.some(ep => ep.isPublic);
  if (hasPublicEntryPoints) {
    boundaries.push({
      id: "internet-aws-boundary",
      name: "Internet to AWS",
      type: "InternetToAWS",
      description: "Boundary between public internet and AWS services"
    });
  }

  // VPC boundary if VPC exists
  const hasVPC = facts.inventory.some(r => r.type === "AWS::EC2::VPC");
  if (hasVPC) {
    boundaries.push({
      id: "vpc-boundary",
      name: "VPC Network Boundary",
      type: "VPCBoundary",
      description: "Boundary between VPC and other AWS services"
    });
  }

  // Service-to-service boundaries for each major service interaction
  const services = new Set(facts.inventory.map(r => r.service));
  
  if (services.has("lambda") && services.has("dynamodb")) {
    boundaries.push({
      id: "lambda-dynamodb-boundary",
      name: "Lambda to DynamoDB",
      type: "ServiceToService",
      description: "Boundary between Lambda functions and DynamoDB tables"
    });
  }

  if (services.has("apigateway") && services.has("lambda")) {
    boundaries.push({
      id: "apigw-lambda-boundary",
      name: "API Gateway to Lambda",
      type: "ServiceToService",
      description: "Boundary between API Gateway and Lambda functions"
    });
  }

  if (services.has("lambda") && services.has("s3")) {
    boundaries.push({
      id: "lambda-s3-boundary",
      name: "Lambda to S3",
      type: "ServiceToService",
      description: "Boundary between Lambda functions and S3 buckets"
    });
  }

  return boundaries;
}