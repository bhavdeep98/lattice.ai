/**
 * CDK Aspect for threat model data collection
 */

import { IAspect } from "aws-cdk-lib";
import { IConstruct } from "constructs";
import { CfnResource } from "aws-cdk-lib";
import { ThreatFactsCollector } from "./collectors/collect-inventory";

export class ThreatModelAspect implements IAspect {
  constructor(private readonly collector: ThreatFactsCollector) {}

  visit(node: IConstruct): void {
    // Collect inventory from CFN resources
    if (node instanceof CfnResource) {
      this.collector.onCfnResource(node);
    }

    // Also collect higher-level L2 constructs when helpful
    // e.g., apigateway.RestApi, cloudfront.Distribution, etc.
    this.collector.onConstruct(node);
  }
}