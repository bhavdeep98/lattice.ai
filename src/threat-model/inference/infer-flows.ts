/**
 * Data flow inference using heuristics
 */

import { ThreatFactsCollector } from '../collectors/collect-inventory';
import { DataFlow } from '../model';

export function inferDataFlows(facts: ThreatFactsCollector): DataFlow[] {
  const flows: DataFlow[] = [];
  const services = new Set(facts.inventory.map((r) => r.service));

  // API Gateway → Lambda flow
  if (services.has('apigateway') && services.has('lambda')) {
    const apigwResources = facts.inventory.filter((r) => r.service === 'apigateway');
    const lambdaResources = facts.inventory.filter((r) => r.service === 'lambda');

    apigwResources.forEach((apigw) => {
      lambdaResources.forEach((lambda) => {
        flows.push({
          from: apigw.id,
          to: lambda.id,
          label: 'HTTP requests',
        });
      });
    });
  }

  // Lambda → DynamoDB flow
  if (services.has('lambda') && services.has('dynamodb')) {
    const lambdaResources = facts.inventory.filter((r) => r.service === 'lambda');
    const dynamoResources = facts.inventory.filter((r) => r.service === 'dynamodb');

    lambdaResources.forEach((lambda) => {
      dynamoResources.forEach((dynamo) => {
        flows.push({
          from: lambda.id,
          to: dynamo.id,
          label: 'Database operations',
        });
      });
    });
  }

  // Lambda → S3 flow
  if (services.has('lambda') && services.has('s3')) {
    const lambdaResources = facts.inventory.filter((r) => r.service === 'lambda');
    const s3Resources = facts.inventory.filter((r) => r.service === 's3');

    lambdaResources.forEach((lambda) => {
      s3Resources.forEach((s3) => {
        flows.push({
          from: lambda.id,
          to: s3.id,
          label: 'Object operations',
        });
      });
    });
  }

  // S3 → Glue flow (data pipeline pattern)
  if (services.has('s3') && services.has('glue')) {
    const s3Resources = facts.inventory.filter((r) => r.service === 's3');
    const glueResources = facts.inventory.filter((r) => r.service === 'glue');

    s3Resources.forEach((s3) => {
      glueResources.forEach((glue) => {
        flows.push({
          from: s3.id,
          to: glue.id,
          label: 'Data ingestion',
        });
      });
    });

    // Glue → S3 (processed data)
    glueResources.forEach((glue) => {
      s3Resources.forEach((s3) => {
        flows.push({
          from: glue.id,
          to: s3.id,
          label: 'Processed data output',
        });
      });
    });
  }

  // Glue → Redshift flow
  if (services.has('glue') && services.has('redshift')) {
    const glueResources = facts.inventory.filter((r) => r.service === 'glue');
    const redshiftResources = facts.inventory.filter((r) => r.service === 'redshift');

    glueResources.forEach((glue) => {
      redshiftResources.forEach((redshift) => {
        flows.push({
          from: glue.id,
          to: redshift.id,
          label: 'Data warehouse loading',
        });
      });
    });
  }

  // GenAI/RAG patterns
  if (services.has('bedrock') || services.has('sagemaker')) {
    const aiResources = facts.inventory.filter(
      (r) => r.service === 'bedrock' || r.service === 'sagemaker'
    );
    const vectorStores = facts.inventory.filter(
      (r) => r.service === 'opensearch' || r.service === 'pinecone'
    );

    // API → AI Service
    if (services.has('apigateway')) {
      const apigwResources = facts.inventory.filter((r) => r.service === 'apigateway');
      apigwResources.forEach((apigw) => {
        aiResources.forEach((ai) => {
          flows.push({
            from: apigw.id,
            to: ai.id,
            label: 'AI/ML requests',
          });
        });
      });
    }

    // AI Service ↔ Vector Store
    aiResources.forEach((ai) => {
      vectorStores.forEach((vs) => {
        flows.push({
          from: ai.id,
          to: vs.id,
          label: 'Vector similarity search',
        });
        flows.push({
          from: vs.id,
          to: ai.id,
          label: 'Retrieved context',
        });
      });
    });
  }

  return flows;
}
