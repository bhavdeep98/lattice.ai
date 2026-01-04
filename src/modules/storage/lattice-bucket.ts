import { Construct } from 'constructs';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import { LatticeBucketProps, LatticeBucketConstruct } from './types';
import { StorageOutput } from '../../core/types';

/**
 * LatticeBucket - S3 bucket abstraction with security and lifecycle best practices
 */
export class LatticeBucket extends Construct implements LatticeBucketConstruct {
  public readonly output: StorageOutput;
  private readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: LatticeBucketProps) {
    super(scope, id);

    const {
      name,
      environment,
      encryption = true,
      versioning = true,
      publicRead = false,
      cors,
      lifecycle,
      notifications,
    } = props;

    // Create S3 bucket with security best practices
    this.bucket = new s3.Bucket(this, 'Bucket', {
      bucketName: `${name}-${environment}`,
      encryption: encryption ? s3.BucketEncryption.S3_MANAGED : s3.BucketEncryption.UNENCRYPTED,
      versioned: versioning,
      blockPublicAccess: publicRead ?
        new s3.BlockPublicAccess({
          blockPublicAcls: false,
          blockPublicPolicy: false,
          ignorePublicAcls: false,
          restrictPublicBuckets: false,
        }) :
        s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: publicRead,
      removalPolicy: environment === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      autoDeleteObjects: environment !== 'prod',
      enforceSSL: true,
    });

    // Configure CORS if specified
    if (cors) {
      this.bucket.addCorsRule({
        allowedOrigins: cors.allowedOrigins,
        allowedMethods: cors.allowedMethods.map(method =>
          s3.HttpMethods[method.toUpperCase() as keyof typeof s3.HttpMethods]
        ),
        allowedHeaders: cors.allowedHeaders || ['*'],
      });
    }

    // Configure lifecycle rules if specified
    if (lifecycle) {
      const lifecycleRules: s3.LifecycleRule[] = [];

      if (lifecycle.archiveAfterDays) {
        lifecycleRules.push({
          id: 'ArchiveRule',
          enabled: true,
          transitions: [{
            storageClass: s3.StorageClass.GLACIER,
            transitionAfter: Duration.days(lifecycle.archiveAfterDays),
          }],
        });
      }

      if (lifecycle.deleteAfterDays) {
        lifecycleRules.push({
          id: 'DeleteRule',
          enabled: true,
          expiration: Duration.days(lifecycle.deleteAfterDays),
        });
      }

      lifecycleRules.forEach(rule => this.bucket.addLifecycleRule(rule));
    }

    // Configure notifications if specified
    if (notifications) {
      if (notifications.lambdaArn) {
        const lambdaFunction = lambda.Function.fromFunctionArn(
          this,
          'NotificationLambda',
          notifications.lambdaArn
        );
        this.bucket.addEventNotification(
          s3.EventType.OBJECT_CREATED,
          new s3n.LambdaDestination(lambdaFunction)
        );
      }

      if (notifications.sqsArn) {
        const queue = sqs.Queue.fromQueueArn(
          this,
          'NotificationQueue',
          notifications.sqsArn
        );
        this.bucket.addEventNotification(
          s3.EventType.OBJECT_CREATED,
          new s3n.SqsDestination(queue)
        );
      }

      if (notifications.snsArn) {
        const topic = sns.Topic.fromTopicArn(
          this,
          'NotificationTopic',
          notifications.snsArn
        );
        this.bucket.addEventNotification(
          s3.EventType.OBJECT_CREATED,
          new s3n.SnsDestination(topic)
        );
      }
    }

    // Set output
    this.output = {
      bucketName: this.bucket.bucketName,
      bucketArn: this.bucket.bucketArn,
    };
  }

  /**
   * Get the S3 bucket construct for advanced use cases
   */
  public getBucket(): s3.Bucket {
    return this.bucket;
  }

  /**
   * Grant read access to a principal
   */
  public grantRead(grantee: any): void {
    this.bucket.grantRead(grantee);
  }

  /**
   * Grant write access to a principal
   */
  public grantWrite(grantee: any): void {
    this.bucket.grantWrite(grantee);
  }

  /**
   * Grant read/write access to a principal
   */
  public grantReadWrite(grantee: any): void {
    this.bucket.grantReadWrite(grantee);
  }
}