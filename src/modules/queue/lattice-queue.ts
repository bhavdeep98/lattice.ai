import { Construct } from 'constructs';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { LatticeQueueProps, LatticeQueueConstruct } from './types';

/**
 * LatticeQueue - SQS abstraction
 * Automatically configures DLQ and best practices.
 */
export class LatticeQueue extends Construct implements LatticeQueueConstruct {
  public readonly output: {
    queueUrl: string;
    queueArn: string;
    dlqArn?: string;
  };
  public readonly queue: sqs.Queue;
  public readonly dlq?: sqs.Queue;

  constructor(scope: Construct, id: string, props: LatticeQueueProps) {
    super(scope, id);

    const { name, environment, type = 'standard', dlq = true, visibilityTimeout = 30 } = props;

    const isFifo = type === 'fifo';
    const queueName = isFifo ? `${name}-${environment}.fifo` : `${name}-${environment}`;

    // 1. Create DLQ (if enabled)
    let deadLetterQueue: sqs.DeadLetterQueue | undefined;

    if (dlq) {
      this.dlq = new sqs.Queue(this, 'DLQ', {
        queueName: `${queueName}-dlq`,
        fifo: isFifo,
        encryption: sqs.QueueEncryption.KMS_MANAGED,
        retentionPeriod: Duration.days(14), // Keep failed messages longer
        removalPolicy: environment === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      });

      deadLetterQueue = {
        queue: this.dlq,
        maxReceiveCount: 3, // Retry 3 times before moving to DLQ
      };
    }

    // 2. Create Main Queue
    this.queue = new sqs.Queue(this, 'Queue', {
      queueName,
      fifo: isFifo,
      contentBasedDeduplication: isFifo, // Enable auto-dedup for FIFO
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      visibilityTimeout: Duration.seconds(visibilityTimeout),
      deadLetterQueue,
      removalPolicy: environment === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    // 3. Output
    this.output = {
      queueUrl: this.queue.queueUrl,
      queueArn: this.queue.queueArn,
      dlqArn: this.dlq?.queueArn,
    };
  }
}
