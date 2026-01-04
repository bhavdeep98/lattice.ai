import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import { applyLatticeAspects } from '../src';

/**
 * Example 1: Serverless API - demonstrates API Gateway + Lambda + DynamoDB pattern
 */
export class ServerlessApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Enable threat modeling
    applyLatticeAspects(this, {
      environment: 'prod',
      projectName: 'ServerlessAPI',
      owner: 'Engineering',
      threatModel: {
        enabled: true,
        formats: ['md', 'json'],
        projectName: 'E-commerce API'
      }
    });

    // Create a typical serverless API architecture
    const table = new dynamodb.Table(this, 'UserTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true
    });

    const handler = new lambda.Function(this, 'ApiHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          // API logic here
          return { statusCode: 200, body: JSON.stringify({ message: 'Hello' }) };
        };
      `),
      handler: 'index.handler',
      environment: {
        TABLE_NAME: table.tableName
      }
    });

    table.grantReadWriteData(handler);

    const api = new apigateway.RestApi(this, 'UserApi', {
      restApiName: 'User Service',
      description: 'API for user management'
    });

    const integration = new apigateway.LambdaIntegration(handler);
    api.root.addMethod('ANY', integration);
  }
}

/**
 * Example 2: Data Pipeline - demonstrates S3 + Glue + Step Functions pattern
 */
export class DataPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    applyLatticeAspects(this, {
      environment: 'prod',
      projectName: 'DataPipeline',
      owner: 'DataEngineering',
      threatModel: {
        enabled: true,
        formats: ['md', 'json'],
        projectName: 'Customer Analytics Pipeline'
      }
    });

    // Raw data bucket
    const rawDataBucket = new s3.Bucket(this, 'RawDataBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      lifecycleRules: [{
        id: 'DeleteOldVersions',
        noncurrentVersionExpiration: { noncurrentDays: 30 }
      }]
    });

    // Processed data bucket
    const processedDataBucket = new s3.Bucket(this, 'ProcessedDataBucket', {
      encryption: s3.BucketEncryption.KMS_MANAGED,
      versioned: true
    });

    // Glue job for data processing
    const glueJob = new glue.CfnJob(this, 'DataProcessingJob', {
      name: 'customer-data-etl',
      role: 'arn:aws:iam::123456789012:role/GlueServiceRole', // Would be created properly
      command: {
        name: 'glueetl',
        scriptLocation: 's3://my-scripts/etl-script.py'
      },
      defaultArguments: {
        '--TempDir': 's3://my-temp-bucket/temp/',
        '--job-bookmark-option': 'job-bookmark-enable'
      }
    });

    // Step Functions for orchestration
    const stateMachine = new stepfunctions.StateMachine(this, 'DataPipelineOrchestrator', {
      definition: stepfunctions.Chain.start(
        new stepfunctions.Pass(this, 'StartProcessing', {
          result: stepfunctions.Result.fromString('Pipeline started')
        })
      )
    });
  }
}

/**
 * Example 3: GenAI RAG - demonstrates Bedrock + OpenSearch + S3 pattern
 */
export class GenAIRagStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    applyLatticeAspects(this, {
      environment: 'prod',
      projectName: 'GenAIRAG',
      owner: 'AITeam',
      threatModel: {
        enabled: true,
        formats: ['md', 'json'],
        projectName: 'Document Q&A Assistant'
      }
    });

    // Document storage
    const documentBucket = new s3.Bucket(this, 'DocumentBucket', {
      encryption: s3.BucketEncryption.KMS_MANAGED,
      versioned: true,
      publicReadAccess: false
    });

    // Vector store (using OpenSearch)
    // Note: This is a simplified example - real implementation would need proper OpenSearch domain
    const vectorStore = new s3.Bucket(this, 'VectorStore', {
      encryption: s3.BucketEncryption.KMS_MANAGED,
      bucketName: 'vector-embeddings-store'
    });

    // API for RAG queries
    const ragHandler = new lambda.Function(this, 'RagHandler', {
      runtime: lambda.Runtime.PYTHON_3_11,
      code: lambda.Code.fromInline(`
import json
import boto3

def lambda_handler(event, context):
    # RAG logic:
    # 1. Process user query
    # 2. Retrieve relevant documents
    # 3. Call Bedrock for generation
    # 4. Return response
    
    return {
        'statusCode': 200,
        'body': json.dumps({'response': 'AI-generated answer'})
    }
      `),
      handler: 'index.lambda_handler',
      environment: {
        DOCUMENT_BUCKET: documentBucket.bucketName,
        VECTOR_STORE_BUCKET: vectorStore.bucketName
      }
    });

    documentBucket.grantRead(ragHandler);
    vectorStore.grantReadWrite(ragHandler);

    const ragApi = new apigateway.RestApi(this, 'RagApi', {
      restApiName: 'Document Q&A API',
      description: 'RAG-powered document question answering'
    });

    const ragIntegration = new apigateway.LambdaIntegration(ragHandler);
    ragApi.root.addResource('query').addMethod('POST', ragIntegration);

    // Bedrock would be configured here in a real implementation
    // For now, we'll simulate with a placeholder that the threat model will detect
  }
}