import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { 
  ObservabilityConfig, 
  AlarmDefinition, 
  AlarmConfig,
  DEFAULT_ALARM_CONFIGS,
  SEVERITY_CONFIGS 
} from './types';

/**
 * Centralized alarm management for Lattice constructs
 * Automatically creates CloudWatch alarms with environment-appropriate configurations
 */
export class LatticeAlarmManager extends Construct {
  private readonly config: ObservabilityConfig;
  private readonly alarms: cloudwatch.Alarm[] = [];
  private readonly notificationTopic?: sns.ITopic;

  constructor(scope: Construct, id: string, config: ObservabilityConfig) {
    super(scope, id);
    
    this.config = config;
    this.notificationTopic = config.notificationTopic;
  }

  /**
   * Create an alarm from definition
   */
  public createAlarm(definition: AlarmDefinition, customConfig?: AlarmConfig): cloudwatch.Alarm | undefined {
    if (!this.shouldCreateAlarm()) {
      return undefined;
    }

    // Merge configurations: severity + environment defaults + custom
    // For critical alarms, severity should take precedence over environment
    const severityConfig = SEVERITY_CONFIGS[definition.severity] || {};
    const envConfig = DEFAULT_ALARM_CONFIGS[this.config.environment] || {};
    
    let finalConfig: AlarmConfig;
    if (definition.severity === 'critical') {
      // Critical alarms: severity overrides environment
      finalConfig = { ...envConfig, ...severityConfig, ...customConfig };
    } else {
      // Non-critical alarms: environment overrides severity
      finalConfig = { ...severityConfig, ...envConfig, ...customConfig };
    }

    // If observability is explicitly enabled, override environment default but keep other settings
    if (this.config.enableAlarms !== false) {
      finalConfig.enabled = true;
    }

    if (finalConfig.enabled === false) {
      return undefined;
    }

    // Create metric
    const metric = new cloudwatch.Metric({
      metricName: definition.metricName,
      namespace: definition.namespace,
      dimensionsMap: definition.dimensionMap,
      statistic: definition.statistic || 'Average',
      period: definition.period || Duration.minutes(5),
      unit: definition.unit,
      label: definition.label,
    });

    // Create alarm
    const alarm = new cloudwatch.Alarm(this, this.generateAlarmId(definition.alarmName), {
      alarmName: this.generateAlarmName(definition.alarmName),
      alarmDescription: definition.alarmDescription || `${definition.alarmName} alarm for ${this.config.environment}`,
      metric,
      threshold: finalConfig.threshold ?? definition.threshold,
      comparisonOperator: finalConfig.comparisonOperator ?? definition.comparisonOperator,
      evaluationPeriods: finalConfig.evaluationPeriods ?? definition.evaluationPeriods ?? 2,
      datapointsToAlarm: finalConfig.datapointsToAlarm ?? definition.datapointsToAlarm ?? 2,
      treatMissingData: finalConfig.treatMissingData ?? cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Add notification actions if topic is provided
    if (this.notificationTopic) {
      alarm.addAlarmAction(new cloudwatchActions.SnsAction(this.notificationTopic));
      alarm.addOkAction(new cloudwatchActions.SnsAction(this.notificationTopic));
    }

    this.alarms.push(alarm);
    return alarm;
  }

  /**
   * Create multiple alarms from definitions
   */
  public createAlarms(definitions: AlarmDefinition[], customConfig?: AlarmConfig): cloudwatch.Alarm[] {
    return definitions
      .map(def => this.createAlarm(def, customConfig))
      .filter((alarm): alarm is cloudwatch.Alarm => alarm !== undefined);
  }

  /**
   * Create compute-specific alarms
   */
  public createComputeAlarms(resourceId: string, resourceType: 'ec2' | 'ecs' | 'lambda', additionalData?: any): cloudwatch.Alarm[] {
    // Use actual resource ID for metrics if provided
    const actualResourceId = additionalData?.actualResourceId || resourceId;
    const definitions = this.getComputeAlarmDefinitions(resourceId, resourceType, actualResourceId);
    return this.createAlarms(definitions);
  }

  /**
   * Create database-specific alarms
   */
  public createDatabaseAlarms(instanceId: string, engine: string, additionalData?: any): cloudwatch.Alarm[] {
    // Use actual instance ID for metrics if provided
    const actualInstanceId = additionalData?.actualInstanceId || instanceId;
    const definitions = this.getDatabaseAlarmDefinitions(instanceId, engine, actualInstanceId);
    return this.createAlarms(definitions);
  }

  /**
   * Create storage-specific alarms
   */
  public createStorageAlarms(bucketName: string, additionalData?: any): cloudwatch.Alarm[] {
    // Use actual bucket name for metrics if provided
    const actualBucketName = additionalData?.actualBucketName || bucketName;
    const definitions = this.getStorageAlarmDefinitions(bucketName, actualBucketName);
    return this.createAlarms(definitions);
  }

  /**
   * Create network-specific alarms
   */
  public createNetworkAlarms(vpcId: string, natGatewayIds?: string[]): cloudwatch.Alarm[] {
    const definitions = this.getNetworkAlarmDefinitions(vpcId, natGatewayIds);
    return this.createAlarms(definitions);
  }

  /**
   * Get all created alarms
   */
  public getAlarms(): cloudwatch.Alarm[] {
    return [...this.alarms];
  }

  private shouldCreateAlarm(): boolean {
    return this.config.enableAlarms !== false;
  }

  private generateAlarmId(alarmName: string): string {
    return `${alarmName}Alarm`;
  }

  private generateAlarmName(alarmName: string): string {
    const prefix = this.config.alarmPrefix || 'Lattice';
    // Use a static name for testing compatibility - avoid tokens in alarm names
    return `${prefix}-${this.config.environment}-${alarmName}`;
  }

  private getComputeAlarmDefinitions(resourceId: string, resourceType: 'ec2' | 'ecs' | 'lambda', actualResourceId?: string): AlarmDefinition[] {
    // Use static resource name for alarm naming to avoid token resolution issues
    const staticResourceId = resourceId.replace(/\$\{.*?\}/g, 'resource');
    // Use actual resource ID for metrics, fallback to static name
    const metricResourceId = actualResourceId || resourceId;
    
    switch (resourceType) {
      case 'ec2':
        return [
          {
            alarmName: `${staticResourceId}-HighCPU`,
            metricName: 'CPUUtilization',
            namespace: 'AWS/EC2',
            dimensionMap: { InstanceId: metricResourceId },
            threshold: this.config.environment === 'prod' ? 80 : 90,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarmDescription: `High CPU utilization on EC2 instance ${resourceId}`,
            severity: 'warning',
            statistic: 'Average',
            period: Duration.minutes(5),
          },
          {
            alarmName: `${staticResourceId}-StatusCheckFailed`,
            metricName: 'StatusCheckFailed',
            namespace: 'AWS/EC2',
            dimensionMap: { InstanceId: metricResourceId },
            threshold: 1,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            alarmDescription: `Status check failed for EC2 instance ${resourceId}`,
            severity: 'critical',
            statistic: 'Maximum',
            period: Duration.minutes(1),
          },
          {
            alarmName: `${staticResourceId}-HighMemory`,
            metricName: 'MemoryUtilization',
            namespace: 'CWAgent',
            dimensionMap: { InstanceId: metricResourceId },
            threshold: this.config.environment === 'prod' ? 85 : 95,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarmDescription: `High memory utilization on EC2 instance ${resourceId}`,
            severity: 'warning',
            statistic: 'Average',
            period: Duration.minutes(5),
          },
        ];

      case 'ecs':
        return [
          {
            alarmName: `${staticResourceId}-HighCPU`,
            metricName: 'CPUUtilization',
            namespace: 'AWS/ECS',
            dimensionMap: { ServiceName: metricResourceId },
            threshold: this.config.environment === 'prod' ? 75 : 85,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarmDescription: `High CPU utilization on ECS service ${resourceId}`,
            severity: 'warning',
            statistic: 'Average',
            period: Duration.minutes(5),
          },
          {
            alarmName: `${staticResourceId}-HighMemory`,
            metricName: 'MemoryUtilization',
            namespace: 'AWS/ECS',
            dimensionMap: { ServiceName: metricResourceId },
            threshold: this.config.environment === 'prod' ? 80 : 90,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarmDescription: `High memory utilization on ECS service ${resourceId}`,
            severity: 'warning',
            statistic: 'Average',
            period: Duration.minutes(5),
          },
          {
            alarmName: `${staticResourceId}-TaskCount`,
            metricName: 'RunningTaskCount',
            namespace: 'AWS/ECS',
            dimensionMap: { ServiceName: metricResourceId },
            threshold: 1,
            comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
            alarmDescription: `No running tasks for ECS service ${resourceId}`,
            severity: 'critical',
            statistic: 'Average',
            period: Duration.minutes(1),
          },
        ];

      case 'lambda':
        return [
          {
            alarmName: `${staticResourceId}-Errors`,
            metricName: 'Errors',
            namespace: 'AWS/Lambda',
            dimensionMap: { FunctionName: metricResourceId },
            threshold: this.config.environment === 'prod' ? 5 : 10,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarmDescription: `High error rate for Lambda function ${resourceId}`,
            severity: 'critical',
            statistic: 'Sum',
            period: Duration.minutes(5),
          },
          {
            alarmName: `${staticResourceId}-Duration`,
            metricName: 'Duration',
            namespace: 'AWS/Lambda',
            dimensionMap: { FunctionName: metricResourceId },
            threshold: 30000, // 30 seconds
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarmDescription: `High duration for Lambda function ${resourceId}`,
            severity: 'warning',
            statistic: 'Average',
            period: Duration.minutes(5),
          },
          {
            alarmName: `${staticResourceId}-Throttles`,
            metricName: 'Throttles',
            namespace: 'AWS/Lambda',
            dimensionMap: { FunctionName: metricResourceId },
            threshold: 1,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            alarmDescription: `Throttling detected for Lambda function ${resourceId}`,
            severity: 'critical',
            statistic: 'Sum',
            period: Duration.minutes(1),
          },
        ];

      default:
        return [];
    }
  }

  private getDatabaseAlarmDefinitions(instanceId: string, engine: string, actualInstanceId?: string): AlarmDefinition[] {
    // Use static instance name for alarm naming to avoid token resolution issues
    const staticInstanceId = instanceId.replace(/\$\{.*?\}/g, 'db-instance');
    // Use actual instance ID for metrics, fallback to static name
    const metricInstanceId = actualInstanceId || instanceId;
    
    return [
      {
        alarmName: `${staticInstanceId}-HighCPU`,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        dimensionMap: { DBInstanceIdentifier: metricInstanceId },
        threshold: this.config.environment === 'prod' ? 75 : 85,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        alarmDescription: `High CPU utilization on RDS instance ${instanceId}`,
        severity: 'warning',
        statistic: 'Average',
        period: Duration.minutes(5),
      },
      {
        alarmName: `${staticInstanceId}-LowFreeableMemory`,
        metricName: 'FreeableMemory',
        namespace: 'AWS/RDS',
        dimensionMap: { DBInstanceIdentifier: metricInstanceId },
        threshold: 100000000, // 100MB in bytes
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        alarmDescription: `Low freeable memory on RDS instance ${instanceId}`,
        severity: 'critical',
        statistic: 'Average',
        period: Duration.minutes(5),
      },
      {
        alarmName: `${staticInstanceId}-HighConnections`,
        metricName: 'DatabaseConnections',
        namespace: 'AWS/RDS',
        dimensionMap: { DBInstanceIdentifier: metricInstanceId },
        threshold: this.config.environment === 'prod' ? 80 : 90,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        alarmDescription: `High database connections on RDS instance ${instanceId}`,
        severity: 'warning',
        statistic: 'Average',
        period: Duration.minutes(5),
      },
      {
        alarmName: `${staticInstanceId}-LowFreeStorageSpace`,
        metricName: 'FreeStorageSpace',
        namespace: 'AWS/RDS',
        dimensionMap: { DBInstanceIdentifier: metricInstanceId },
        threshold: 2000000000, // 2GB in bytes
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        alarmDescription: `Low free storage space on RDS instance ${instanceId}`,
        severity: 'critical',
        statistic: 'Average',
        period: Duration.minutes(5),
      },
    ];
  }

  private getStorageAlarmDefinitions(bucketName: string, actualBucketName?: string): AlarmDefinition[] {
    // Use static bucket name for alarm naming to avoid token resolution issues
    const staticBucketName = bucketName.replace(/\$\{.*?\}/g, 'bucket');
    // Use actual bucket name for metrics, fallback to static name
    const metricBucketName = actualBucketName || bucketName;
    
    return [
      {
        alarmName: `${staticBucketName}-${this.config.environment}-HighRequestRate`,
        metricName: 'AllRequests',
        namespace: 'AWS/S3',
        dimensionMap: { BucketName: metricBucketName },
        threshold: this.config.environment === 'prod' ? 1000 : 2000,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        alarmDescription: `High request rate for S3 bucket ${bucketName}`,
        severity: 'warning',
        statistic: 'Sum',
        period: Duration.minutes(5),
      },
      {
        alarmName: `${staticBucketName}-${this.config.environment}-HighErrorRate`,
        metricName: '4xxErrors',
        namespace: 'AWS/S3',
        dimensionMap: { BucketName: metricBucketName },
        threshold: this.config.environment === 'prod' ? 10 : 20,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        alarmDescription: `High 4xx error rate for S3 bucket ${bucketName}`,
        severity: 'critical',
        statistic: 'Sum',
        period: Duration.minutes(5),
      },
    ];
  }

  private getNetworkAlarmDefinitions(vpcId: string, natGatewayIds?: string[]): AlarmDefinition[] {
    const definitions: AlarmDefinition[] = [];

    // NAT Gateway alarms
    if (natGatewayIds) {
      natGatewayIds.forEach((natGatewayId, index) => {
        // Use static NAT Gateway name for alarm naming to avoid token resolution issues
        const staticNatGatewayId = `nat-gateway-${index}`;
        
        definitions.push(
          {
            alarmName: `${staticNatGatewayId}-ErrorPortAllocation`,
            metricName: 'ErrorPortAllocation',
            namespace: 'AWS/NatGateway',
            dimensionMap: { NatGatewayId: natGatewayId },
            threshold: 1,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            alarmDescription: `Port allocation errors on NAT Gateway ${natGatewayId}`,
            severity: 'critical',
            statistic: 'Sum',
            period: Duration.minutes(1),
          },
          {
            alarmName: `${staticNatGatewayId}-PacketsDropCount`,
            metricName: 'PacketsDropCount',
            namespace: 'AWS/NatGateway',
            dimensionMap: { NatGatewayId: natGatewayId },
            threshold: this.config.environment === 'prod' ? 100 : 500,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarmDescription: `High packet drop count on NAT Gateway ${natGatewayId}`,
            severity: 'warning',
            statistic: 'Sum',
            period: Duration.minutes(5),
          }
        );
      });
    }

    return definitions;
  }
}