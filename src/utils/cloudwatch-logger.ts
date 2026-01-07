/**
 * CloudWatch Logging Integration for Lattice Framework
 * Sends structured logs to AWS CloudWatch Logs
 */

import { CloudWatchLogsClient, PutLogEventsCommand, CreateLogGroupCommand, CreateLogStreamCommand } from '@aws-sdk/client-cloudwatch-logs';
import { LogEntry, LogLevel } from './logger';
import { LoggingConfig } from '../config/logging';

export interface CloudWatchLogEvent {
  timestamp: number;
  message: string;
}

export class CloudWatchLogger {
  private client: CloudWatchLogsClient;
  private config: LoggingConfig['cloudWatch'];
  private sequenceToken?: string;
  private logBuffer: CloudWatchLogEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private maxBufferSize = 100;
  private flushIntervalMs = 5000; // 5 seconds

  constructor(config: LoggingConfig['cloudWatch']) {
    if (!config) {
      throw new Error('CloudWatch configuration is required');
    }
    
    this.config = config;
    this.client = new CloudWatchLogsClient({ region: config.region });
    
    // Initialize log group and stream
    this.initializeLogGroup();
    
    // Start periodic flush
    this.startPeriodicFlush();
  }

  private async initializeLogGroup(): Promise<void> {
    try {
      // Create log group if it doesn't exist
      await this.client.send(new CreateLogGroupCommand({
        logGroupName: this.config!.logGroupName
      }));
    } catch (error: any) {
      // Log group might already exist
      if (error.name !== 'ResourceAlreadyExistsException') {
        console.warn('Failed to create CloudWatch log group:', error.message);
      }
    }

    try {
      // Create log stream if it doesn't exist
      await this.client.send(new CreateLogStreamCommand({
        logGroupName: this.config!.logGroupName,
        logStreamName: this.config!.logStreamName
      }));
    } catch (error: any) {
      // Log stream might already exist
      if (error.name !== 'ResourceAlreadyExistsException') {
        console.warn('Failed to create CloudWatch log stream:', error.message);
      }
    }
  }

  public async log(entry: LogEntry): Promise<void> {
    const logEvent: CloudWatchLogEvent = {
      timestamp: new Date(entry.timestamp).getTime(),
      message: JSON.stringify(entry)
    };

    this.logBuffer.push(logEvent);

    // Flush if buffer is full
    if (this.logBuffer.length >= this.maxBufferSize) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return;
    }

    try {
      // Sort events by timestamp
      const sortedEvents = this.logBuffer.sort((a, b) => a.timestamp - b.timestamp);

      const command = new PutLogEventsCommand({
        logGroupName: this.config!.logGroupName,
        logStreamName: this.config!.logStreamName,
        logEvents: sortedEvents,
        sequenceToken: this.sequenceToken
      });

      const response = await this.client.send(command);
      this.sequenceToken = response.nextSequenceToken;
      
      // Clear buffer after successful send
      this.logBuffer = [];
      
    } catch (error: any) {
      console.error('Failed to send logs to CloudWatch:', error.message);
      
      // If sequence token is invalid, reset it
      if (error.name === 'InvalidSequenceTokenException') {
        this.sequenceToken = undefined;
      }
      
      // Keep logs in buffer for retry (but limit buffer size)
      if (this.logBuffer.length > this.maxBufferSize * 2) {
        this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
      }
    }
  }

  private startPeriodicFlush(): void {
    this.flushInterval = setInterval(async () => {
      await this.flush();
    }, this.flushIntervalMs);
  }

  public async close(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    // Flush remaining logs
    await this.flush();
  }
}

export class CloudWatchMetrics {
  private client: CloudWatchLogsClient;
  private namespace: string;

  constructor(region: string, namespace: string = 'Lattice/Application') {
    this.client = new CloudWatchLogsClient({ region });
    this.namespace = namespace;
  }

  public async putMetric(
    metricName: string, 
    value: number, 
    unit: string = 'Count',
    dimensions?: Record<string, string>
  ): Promise<void> {
    try {
      // For this implementation, we'll log metrics as structured log entries
      // In a full implementation, you'd use CloudWatch Metrics API
      const metricEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message: `Metric: ${metricName}`,
        context: {
          operation: 'metric-collection',
          resourceType: 'metric'
        },
        metadata: {
          metricName,
          value,
          unit,
          dimensions,
          namespace: this.namespace,
          isMetric: true
        }
      };

      console.log(JSON.stringify(metricEntry));
      
    } catch (error) {
      console.error('Failed to put CloudWatch metric:', error);
    }
  }

  public async putCustomMetrics(metrics: Array<{
    name: string;
    value: number;
    unit?: string;
    dimensions?: Record<string, string>;
  }>): Promise<void> {
    for (const metric of metrics) {
      await this.putMetric(
        metric.name, 
        metric.value, 
        metric.unit, 
        metric.dimensions
      );
    }
  }
}

// Utility functions for common CloudWatch operations
export function createCloudWatchLogger(config: LoggingConfig): CloudWatchLogger | null {
  if (!config.enableCloudWatch || !config.cloudWatch) {
    return null;
  }

  try {
    return new CloudWatchLogger(config.cloudWatch);
  } catch (error) {
    console.error('Failed to create CloudWatch logger:', error);
    return null;
  }
}

export function createCloudWatchMetrics(region?: string): CloudWatchMetrics {
  return new CloudWatchMetrics(region || process.env.AWS_REGION || 'us-east-1');
}

// Enhanced logging for infrastructure events
export async function logInfrastructureEvent(
  cloudWatchLogger: CloudWatchLogger | null,
  eventType: string,
  resourceType: string,
  resourceId: string,
  metadata?: Record<string, any>
): Promise<void> {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: LogLevel.AUDIT,
    message: `Infrastructure event: ${eventType} ${resourceType}`,
    context: {
      operation: 'infrastructure-event',
      resourceType,
      resourceId
    },
    metadata: {
      eventType,
      resourceType,
      resourceId,
      ...metadata,
      isInfrastructureEvent: true
    }
  };

  if (cloudWatchLogger) {
    await cloudWatchLogger.log(logEntry);
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

// Enhanced logging for security events
export async function logSecurityEvent(
  cloudWatchLogger: CloudWatchLogger | null,
  eventType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  metadata?: Record<string, any>
): Promise<void> {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: severity === 'critical' ? LogLevel.ERROR : LogLevel.WARN,
    message: `Security event: ${eventType}`,
    context: {
      operation: 'security-event',
      resourceType: 'security'
    },
    metadata: {
      eventType,
      severity,
      ...metadata,
      isSecurityEvent: true
    }
  };

  if (cloudWatchLogger) {
    await cloudWatchLogger.log(logEntry);
  } else {
    console.log(JSON.stringify(logEntry));
  }
}