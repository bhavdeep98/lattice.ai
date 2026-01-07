import { Stack, StackProps, Duration, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface LatticeBackendStackProps extends StackProps {
  openaiApiKey: string;
}

export class LatticeBackendStack extends Stack {
  public readonly api: apigateway.RestApi;
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LatticeBackendStackProps) {
    super(scope, id, props);

    // Lambda function for the Lattice demo backend
    this.lambdaFunction = new lambda.Function(this, 'LatticeBackendFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('website/lambda-dist'),
      timeout: Duration.seconds(30),
      memorySize: 512,
      environment: {
        OPENAI_API_KEY: props.openaiApiKey,
        NODE_ENV: 'production',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'Lattice Demo Backend - AI-powered infrastructure generation',
    });

    // API Gateway
    this.api = new apigateway.RestApi(this, 'LatticeBackendApi', {
      restApiName: 'Lattice Demo API',
      description: 'API for Lattice infrastructure generation demo',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
    });

    // Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(this.lambdaFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    // API routes
    const apiResource = this.api.root.addResource('api');
    
    // Health check
    const healthResource = apiResource.addResource('health');
    healthResource.addMethod('GET', lambdaIntegration);

    // Generate infrastructure
    const generateResource = apiResource.addResource('generate');
    generateResource.addMethod('POST', lambdaIntegration);

    // Get demo by ID
    const demoResource = apiResource.addResource('demo');
    const demoIdResource = demoResource.addResource('{id}');
    demoIdResource.addMethod('GET', lambdaIntegration);

    // List demos
    const demosResource = apiResource.addResource('demos');
    demosResource.addMethod('GET', lambdaIntegration);

    // Grant necessary permissions
    this.lambdaFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: ['*'],
      })
    );

    // Outputs
    new CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'Lattice Backend API URL',
      exportName: 'LatticeBackendApiUrl',
    });

    new CfnOutput(this, 'ApiId', {
      value: this.api.restApiId,
      description: 'API Gateway ID',
      exportName: 'LatticeBackendApiId',
    });
  }
}