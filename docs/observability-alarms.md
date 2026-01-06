# Observability & Alarms in Lattice

## The Problem

Building infrastructure without monitoring is like installing pipes without sensors. You have no visibility into what's happening, no early warning of problems, and no way to understand system behavior.

**The Gap**: Lattice builds the infrastructure (pipes) but not the monitoring (sensors).

**The Risk**: Production incidents go undetected, performance issues remain hidden, and troubleshooting becomes reactive instead of proactive.

## The Solution

Lattice now provides comprehensive **Observability & Alarms** with:

1. **Automatic CloudWatch Alarms** for all resources
2. **Role-based Dashboards** for different personas
3. **Environment-appropriate Thresholds** 
4. **Centralized Notification Management**
5. **Comprehensive Metrics Coverage**

## Key Features

### 1. Automatic Alarm Creation

Every Lattice construct automatically creates relevant CloudWatch alarms:

**LatticeCompute Alarms:**
- **EC2**: High CPU, Status Check Failed, High Memory
- **ECS**: High CPU, High Memory, Task Count
- **Lambda**: Errors, Duration, Throttles

**LatticeDatabase Alarms:**
- High CPU Utilization
- Low Freeable Memory (Critical)
- High Database Connections
- Low Free Storage Space (Critical)

**LatticeBucket Alarms:**
- High Request Rate
- High 4xx Error Rate (Critical)

**LatticeNetwork Alarms:**
- NAT Gateway Error Port Allocation (Critical)
- NAT Gateway Packet Drop Count

### 2. Role-Based Dashboards

Different personas need different views of the same data:

**Developer Dashboard:**
- Detailed technical metrics
- CPU, memory, latency charts
- Error rates and performance data
- Debugging-focused widgets

**SRE Dashboard:**
- Operational health metrics
- Resource utilization trends
- System availability indicators
- Infrastructure-focused views

**CTO Dashboard:**
- High-level business metrics
- Availability and uptime summaries
- Cost and resource efficiency
- Executive-level KPIs

**Security Dashboard:**
- Security event logs
- Access patterns
- Anomaly detection
- Compliance metrics

### 3. Environment-Appropriate Thresholds

Alarms adapt to the environment to balance sensitivity with noise:

| Environment | Sensitivity | Evaluation Periods | Use Case |
|-------------|-------------|-------------------|----------|
| **Production** | High (strict thresholds) | 1-2 periods | Fast detection, minimal tolerance |
| **Staging** | Moderate | 2-3 periods | Balanced detection, some tolerance |
| **Development** | Low (relaxed thresholds) | 3-5 periods | Reduce noise, focus on major issues |

### 4. Severity-Based Configuration

Alarms are categorized by severity with appropriate response times:

**Critical Alarms:**
- 1 evaluation period
- 1 datapoint to alarm
- Immediate notification
- Examples: Status check failed, out of memory

**Warning Alarms:**
- 2 evaluation periods
- 2 datapoints to alarm
- Standard notification
- Examples: High CPU, high connections

**Info Alarms:**
- 3 evaluation periods
- 2 datapoints to alarm
- Low-priority notification
- Examples: Moderate resource usage

## Usage Examples

### Basic Usage (Automatic Monitoring)

```typescript
// Production Lambda with comprehensive monitoring
const prodLambda = new LatticeCompute(this, 'ProdLambda', {
  name: 'api-handler',
  environment: 'prod',
  type: 'serverless',
  size: 'medium',
  network: { /* ... */ },
  // Observability enabled by default for production
  enableObservability: true,
  enableAlarms: true,
  enableDashboards: true,
});

// Automatically creates:
// - Lambda Errors alarm (threshold: 5 errors in 5 minutes)
// - Lambda Duration alarm (threshold: 30 seconds)
// - Lambda Throttles alarm (threshold: 1 throttle)
// - Developer, SRE, CTO, Security dashboards
```

### Custom Notification Configuration

```typescript
// Create notification topics for different severities
const criticalAlarms = new sns.Topic(this, 'CriticalAlarms', {
  topicName: 'critical-alerts',
});

const warningAlarms = new sns.Topic(this, 'WarningAlarms', {
  topicName: 'warning-alerts',
});

// Production database with custom notifications
const prodDatabase = new LatticeDatabase(this, 'ProdDatabase', {
  name: 'app-db',
  environment: 'prod',
  engine: 'postgres',
  size: 'large',
  network: { /* ... */ },
  // Custom notification configuration
  notificationTopic: criticalAlarms,
});

// Automatically creates:
// - High CPU alarm (threshold: 75% for 2 periods)
// - Low Memory alarm (threshold: 100MB, critical)
// - High Connections alarm (threshold: 80 connections)
// - Low Storage alarm (threshold: 2GB, critical)
```

### Development Environment (Minimal Monitoring)

```typescript
// Development resources with reduced monitoring
const devBucket = new LatticeBucket(this, 'DevBucket', {
  name: 'dev-data',
  environment: 'dev',
  encryption: true,
  // Minimal observability to reduce noise and costs
  enableObservability: true,
  enableAlarms: false, // No alarms to avoid noise
  enableDashboards: true, // Keep dashboards for debugging
});
```

### Role-Specific Dashboard Access

```typescript
// Create observability manager with specific roles
const observability = LatticeObservabilityManager.create(this, 'Observability', {
  environment: 'prod',
  roles: ['developer', 'sre', 'cto'], // Only create these dashboards
});

// Access role-specific dashboards
const developerDashboard = observability.getDashboard('developer');
const sreDashboard = observability.getDashboard('sre');
const ctoDashboard = observability.getDashboard('cto');
```

## Alarm Specifications

### Compute Alarms

#### EC2 Instance Alarms
```typescript
{
  'HighCPU': {
    metric: 'CPUUtilization',
    namespace: 'AWS/EC2',
    threshold: { prod: 80, staging: 85, dev: 90 },
    severity: 'warning',
    period: '5 minutes'
  },
  'StatusCheckFailed': {
    metric: 'StatusCheckFailed',
    namespace: 'AWS/EC2', 
    threshold: 1,
    severity: 'critical',
    period: '1 minute'
  },
  'HighMemory': {
    metric: 'MemoryUtilization',
    namespace: 'CWAgent',
    threshold: { prod: 85, staging: 90, dev: 95 },
    severity: 'warning',
    period: '5 minutes'
  }
}
```

#### Lambda Function Alarms
```typescript
{
  'Errors': {
    metric: 'Errors',
    namespace: 'AWS/Lambda',
    threshold: { prod: 5, staging: 10, dev: 20 },
    severity: 'critical',
    period: '5 minutes'
  },
  'Duration': {
    metric: 'Duration', 
    namespace: 'AWS/Lambda',
    threshold: 30000, // 30 seconds
    severity: 'warning',
    period: '5 minutes'
  },
  'Throttles': {
    metric: 'Throttles',
    namespace: 'AWS/Lambda',
    threshold: 1,
    severity: 'critical',
    period: '1 minute'
  }
}
```

#### ECS Service Alarms
```typescript
{
  'HighCPU': {
    metric: 'CPUUtilization',
    namespace: 'AWS/ECS',
    threshold: { prod: 75, staging: 80, dev: 85 },
    severity: 'warning',
    period: '5 minutes'
  },
  'HighMemory': {
    metric: 'MemoryUtilization',
    namespace: 'AWS/ECS',
    threshold: { prod: 80, staging: 85, dev: 90 },
    severity: 'warning',
    period: '5 minutes'
  },
  'TaskCount': {
    metric: 'RunningTaskCount',
    namespace: 'AWS/ECS',
    threshold: 1,
    comparisonOperator: 'LessThanThreshold',
    severity: 'critical',
    period: '1 minute'
  }
}
```

### Database Alarms

#### RDS Instance Alarms
```typescript
{
  'HighCPU': {
    metric: 'CPUUtilization',
    namespace: 'AWS/RDS',
    threshold: { prod: 75, staging: 80, dev: 85 },
    severity: 'warning',
    period: '5 minutes'
  },
  'LowFreeableMemory': {
    metric: 'FreeableMemory',
    namespace: 'AWS/RDS',
    threshold: 100000000, // 100MB in bytes
    comparisonOperator: 'LessThanThreshold',
    severity: 'critical',
    period: '5 minutes'
  },
  'HighConnections': {
    metric: 'DatabaseConnections',
    namespace: 'AWS/RDS',
    threshold: { prod: 80, staging: 85, dev: 90 },
    severity: 'warning',
    period: '5 minutes'
  },
  'LowFreeStorageSpace': {
    metric: 'FreeStorageSpace',
    namespace: 'AWS/RDS',
    threshold: 2000000000, // 2GB in bytes
    comparisonOperator: 'LessThanThreshold',
    severity: 'critical',
    period: '5 minutes'
  }
}
```

### Storage Alarms

#### S3 Bucket Alarms
```typescript
{
  'HighRequestRate': {
    metric: 'AllRequests',
    namespace: 'AWS/S3',
    threshold: { prod: 1000, staging: 1500, dev: 2000 },
    severity: 'warning',
    period: '5 minutes',
    statistic: 'Sum'
  },
  'HighErrorRate': {
    metric: '4xxErrors',
    namespace: 'AWS/S3',
    threshold: { prod: 10, staging: 15, dev: 20 },
    severity: 'critical',
    period: '5 minutes',
    statistic: 'Sum'
  }
}
```

### Network Alarms

#### NAT Gateway Alarms
```typescript
{
  'ErrorPortAllocation': {
    metric: 'ErrorPortAllocation',
    namespace: 'AWS/NatGateway',
    threshold: 1,
    severity: 'critical',
    period: '1 minute',
    statistic: 'Sum'
  },
  'PacketsDropCount': {
    metric: 'PacketsDropCount',
    namespace: 'AWS/NatGateway',
    threshold: { prod: 100, staging: 300, dev: 500 },
    severity: 'warning',
    period: '5 minutes',
    statistic: 'Sum'
  }
}
```

## Dashboard Widgets by Role

### Developer Dashboard Widgets

**Compute Resources:**
- CPU & Memory utilization charts
- Request/response latency graphs
- Error rate trends
- Throughput metrics

**Database Resources:**
- Query performance metrics
- Connection pool status
- Read/write latency
- Lock wait times

**Storage Resources:**
- Request patterns
- Error rates by operation
- Transfer metrics
- Access patterns

### SRE Dashboard Widgets

**System Health:**
- Overall availability metrics
- Resource utilization summaries
- Alert status overview
- Capacity planning data

**Infrastructure:**
- Network performance
- Storage capacity trends
- Compute resource efficiency
- Cost optimization opportunities

### CTO Dashboard Widgets

**Business Metrics:**
- System availability (uptime %)
- User experience indicators
- Cost efficiency trends
- Capacity vs. demand

**Strategic Indicators:**
- Performance vs. SLA targets
- Resource utilization efficiency
- Incident frequency trends
- Growth capacity indicators

### Security Dashboard Widgets

**Security Events:**
- Authentication failures
- Access pattern anomalies
- Network security events
- Compliance violations

**Audit Information:**
- Access logs summary
- Permission changes
- Security group modifications
- Encryption status

## Configuration Options

### Observability Configuration

```typescript
interface ObservabilityConfig {
  environment: Environment;
  enableAlarms?: boolean; // Default: true
  enableDashboards?: boolean; // Default: true
  notificationTopic?: sns.ITopic; // Custom notification topic
  alarmPrefix?: string; // Default: 'Lattice'
  dashboardPrefix?: string; // Default: 'Lattice'
  roles?: ObservabilityRole[]; // Default: all roles
}
```

### Alarm Configuration

```typescript
interface AlarmConfig {
  enabled?: boolean; // Default: environment-dependent
  threshold?: number; // Override default threshold
  evaluationPeriods?: number; // Default: severity-dependent
  datapointsToAlarm?: number; // Default: severity-dependent
  comparisonOperator?: ComparisonOperator;
  treatMissingData?: TreatMissingData;
  alarmDescription?: string;
}
```

## Best Practices

### 1. Environment-Specific Configuration

```typescript
// Production: Strict monitoring
const prodConfig = {
  environment: 'prod',
  enableAlarms: true,
  enableDashboards: true,
  roles: ['developer', 'sre', 'cto', 'security'],
};

// Development: Minimal monitoring
const devConfig = {
  environment: 'dev',
  enableAlarms: false, // Reduce noise
  enableDashboards: true, // Keep for debugging
  roles: ['developer'], // Only developer dashboard
};
```

### 2. Notification Strategy

```typescript
// Separate topics by severity
const criticalTopic = new sns.Topic(this, 'Critical', {
  topicName: 'critical-alerts',
});
criticalTopic.addSubscription(new subscriptions.EmailSubscription('oncall@company.com'));

const warningTopic = new sns.Topic(this, 'Warning', {
  topicName: 'warning-alerts', 
});
warningTopic.addSubscription(new subscriptions.EmailSubscription('alerts@company.com'));
```

### 3. Dashboard Organization

```typescript
// Create role-specific observability managers
const devObservability = LatticeObservabilityManager.create(this, 'DevObservability', {
  environment: 'prod',
  roles: ['developer'],
  dashboardPrefix: 'Dev',
});

const opsObservability = LatticeObservabilityManager.create(this, 'OpsObservability', {
  environment: 'prod', 
  roles: ['sre', 'cto'],
  dashboardPrefix: 'Ops',
});
```

### 4. Alarm Tuning

```typescript
// Custom alarm configuration for specific resources
const criticalDatabase = new LatticeDatabase(this, 'CriticalDB', {
  name: 'critical-db',
  environment: 'prod',
  engine: 'postgres',
  size: 'xlarge',
  network: { /* ... */ },
  // Custom observability for critical resource
  enableObservability: true,
  enableAlarms: true,
  notificationTopic: criticalTopic,
});

// Access individual alarms for fine-tuning
criticalDatabase.alarms.forEach(alarm => {
  if (alarm.alarmName.includes('HighCPU')) {
    // Lower threshold for critical database
    alarm.addPropertyOverride('Threshold', 60);
  }
});
```

## Troubleshooting

### Common Issues

1. **Too Many Alarms**: Use environment-specific configuration to reduce noise in dev/staging
2. **Missing Notifications**: Ensure notification topics are properly configured
3. **Dashboard Not Updating**: Check that resources are being added to observability manager
4. **Alarm Flapping**: Adjust evaluation periods and datapoints to alarm

### Monitoring the Monitors

```typescript
// Create meta-monitoring for the observability system
const metaAlarm = new cloudwatch.Alarm(this, 'ObservabilityHealth', {
  alarmName: 'Lattice-Observability-Health',
  metric: new cloudwatch.Metric({
    metricName: 'NumberOfMessagesPublished',
    namespace: 'AWS/SNS',
    dimensionsMap: {
      TopicName: notificationTopic.topicName,
    },
  }),
  threshold: 100, // Alert if too many notifications
  comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
});
```

## Migration Guide

### From Manual CloudWatch Setup

```typescript
// Before: Manual alarm creation
const manualAlarm = new cloudwatch.Alarm(this, 'ManualAlarm', {
  alarmName: 'manual-cpu-alarm',
  metric: new cloudwatch.Metric({
    metricName: 'CPUUtilization',
    namespace: 'AWS/EC2',
    dimensionsMap: { InstanceId: 'i-1234567890abcdef0' },
  }),
  threshold: 80,
  comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
});

// After: Automatic with Lattice
const compute = new LatticeCompute(this, 'Compute', {
  name: 'app-server',
  environment: 'prod',
  type: 'vm',
  size: 'medium',
  network: { /* ... */ },
  // Automatic CPU alarm creation with environment-appropriate threshold
});
```

### From Basic Monitoring

```typescript
// Before: No monitoring
const basicBucket = new s3.Bucket(this, 'BasicBucket');

// After: Comprehensive monitoring
const monitoredBucket = new LatticeBucket(this, 'MonitoredBucket', {
  name: 'app-data',
  environment: 'prod',
  encryption: true,
  // Automatic alarms and dashboards
});
```

## Conclusion

Lattice's Observability & Alarms system transforms infrastructure monitoring from an afterthought into a first-class citizen. By automatically creating appropriate alarms and role-based dashboards, you get production-ready monitoring out of the box.

Key benefits:
- **Proactive Detection**: Issues are caught before they impact users
- **Role-Based Visibility**: Everyone sees the metrics they need
- **Environment Awareness**: Appropriate sensitivity for each environment
- **Zero Configuration**: Works out of the box with sensible defaults
- **Full Customization**: Escape hatches for advanced requirements

This comprehensive observability ensures that your Lattice infrastructure is not just built right, but monitored right from day one.