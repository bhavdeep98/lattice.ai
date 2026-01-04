/**
 * Workload type inference based on resource patterns
 */

import { ThreatFactsCollector } from "../collectors/collect-inventory";

export function inferWorkloadType(facts: ThreatFactsCollector): string {
  const types = new Set(facts.inventory.map(r => r.type));

  const has = (t: string) => types.has(t);
  const any = (prefix: string) => [...types].some(x => x.startsWith(prefix));

  // GenAI / RAG heuristics
  if (has("AWS::Bedrock::Agent") || 
      has("AWS::Bedrock::KnowledgeBase") || 
      any("AWS::SageMaker::Endpoint") ||
      has("AWS::SageMaker::Model")) {
    return "genai-rag";
  }

  // Data pipeline heuristics
  const pipelineSignals =
    has("AWS::Glue::Job") ||
    has("AWS::Glue::Crawler") ||
    has("AWS::EMR::Cluster") ||
    has("AWS::StepFunctions::StateMachine") ||
    has("AWS::Kinesis::Stream") ||
    has("AWS::KinesisFirehose::DeliveryStream") ||
    has("AWS::DataPipeline::Pipeline");
  
  if (pipelineSignals) return "data-pipeline";

  // Serverless API
  if (has("AWS::ApiGateway::RestApi") || 
      has("AWS::ApiGatewayV2::Api") ||
      has("AWS::Lambda::Function")) {
    return "serverless-api";
  }

  // Container workload
  if (has("AWS::ECS::Service") ||
      has("AWS::ECS::TaskDefinition") ||
      has("AWS::EKS::Cluster") ||
      has("AWS::ElasticLoadBalancingV2::LoadBalancer")) {
    return "container-app";
  }

  // Three-tier web app
  if (has("AWS::ElasticLoadBalancingV2::LoadBalancer") &&
      (has("AWS::EC2::Instance") || has("AWS::AutoScaling::AutoScalingGroup")) &&
      (has("AWS::RDS::DBInstance") || has("AWS::RDS::DBCluster"))) {
    return "three-tier";
  }

  return "general";
}