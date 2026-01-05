import { Construct } from 'constructs';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { LatticeBucketProps, LatticeBucketConstruct } from './types';
import { StorageOutput } from '../../core/types';
import { createStatefulnessPolicy } from '../../core/statefulness';
import { LatticeObservabilityManager } from '../../core/observability';

/**
 * LatticeBucket - S3 bucket abstraction with security and lifecycle best practices
 */
export class LatticeBucket extends Construct implements LatticeBucketConstruct {
  public readonly output: StorageOutput;
  
  // Escape hatch: Direct access to underlying AWS CDK construct
  public readonly instance: s3.Bucket;
  
  // Observability: Alarms and dashboards for monitoring
  public readonly alarms: cloudwatch.Alarm[] = [];
  
  private readonly bucket: s3.Bucket;
  private readonly observabilityManager?: LatticeObservabilityManager;

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

    // Create statefulness policy for proper operations management
    const statefulnessPolicy = createStatefulnessPolicy({
      environment,
      forceRetain: props.forceRetain,
      enableBackups: props.enableBackups,
      backupRetentionDays: props.backupRetentionDays,
    });

    // Create observability manager if monitoring is enabled
    if (props.enableObservability !== false) {
      this.observabilityManager = LatticeObservabilityManager.create(this, 'Observability', {
        environment,
        enableAlarms: props.enableAlarms,
        enableDashboards: props.enableDashboards,
        notificationTopic: props.notificationTopic,
      });
    }

    // Create S3 bucket with security and operations best practices
    this.bucket = new s3.Bucket(this, 'Bucket', {
      bucketName: `${name}-${environment}`,
      encryption: encryption ? s3.BucketEncryption.S3_MANAGED : undefined,
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
      // CRITICAL: Use statefulness policy to prevent accidental data loss
      removalPolicy: statefulnessPolicy.getRemovalPolicy(),
      autoDeleteObjects: statefulnessPolicy.shouldAutoDeleteObjects(),
      enforceSSL: true,
    });

    // Expose underlying construct for escape hatch scenarios
    this.instance = this.bucket;

    // Add observability after bucket creation
    this.addObservability(name);

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

  /**
   * Add observability (alarms and dashboards) for the S3 bucket
   */
  private addObservability(bucketName: string): void {
    if (!this.observabilityManager) {
      return;
    }

    // Use the static bucket name to avoid token resolution issues
    // The actual bucket name will be used in the metric dimensions
    const observability = this.observabilityManager.addStorageObservability(
      bucketName,
      {
        bucketName,
        actualBucketName: this.bucket.bucketName, // Pass the actual bucket name for metrics
      }
    );

    // Store alarms for external access
    this.alarms.push(...observability.alarms);
  }
}