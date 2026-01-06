import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { 
  ObservabilityConfig, 
  ObservabilityRole,
  DashboardWidget,
  RoleDashboardConfig,
  MetricDefinition 
} from './types';

/**
 * Role-based dashboard management for Lattice constructs
 * Creates different dashboards for different personas (Developer, SRE, CTO, Security)
 */
export class LatticeObservabilityDashboard extends Construct {
  private readonly config: ObservabilityConfig;
  private readonly dashboards: Map<ObservabilityRole, cloudwatch.Dashboard> = new Map();
  private readonly widgets: Map<ObservabilityRole, DashboardWidget[]> = new Map();

  constructor(scope: Construct, id: string, config: ObservabilityConfig) {
    super(scope, id);
    
    this.config = config;
    
    // Initialize widget collections for each role
    this.initializeRoleWidgets();
    
    // Create dashboards if enabled
    if (this.shouldCreateDashboards()) {
      this.createRoleDashboards();
    }
  }

  /**
   * Add widgets for a specific resource
   */
  public addResourceWidgets(resourceType: string, resourceId: string, resourceData: any): void {
    if (!this.shouldCreateDashboards()) return;

    switch (resourceType) {
      case 'compute':
        this.addComputeWidgets(resourceId, resourceData);
        break;
      case 'database':
        this.addDatabaseWidgets(resourceId, resourceData);
        break;
      case 'storage':
        this.addStorageWidgets(resourceId, resourceData);
        break;
      case 'network':
        this.addNetworkWidgets(resourceId, resourceData);
        break;
    }

    // Refresh dashboards with new widgets
    this.refreshDashboards();
  }

  /**
   * Get dashboard for a specific role
   */
  public getDashboard(role: ObservabilityRole): cloudwatch.Dashboard | undefined {
    return this.dashboards.get(role);
  }

  /**
   * Get all dashboards
   */
  public getAllDashboards(): Map<ObservabilityRole, cloudwatch.Dashboard> {
    return new Map(this.dashboards);
  }

  private shouldCreateDashboards(): boolean {
    return this.config.enableDashboards !== false;
  }

  private initializeRoleWidgets(): void {
    const roles: ObservabilityRole[] = this.config.roles || ['developer', 'sre', 'cto', 'security'];
    roles.forEach(role => {
      this.widgets.set(role, []);
    });
  }

  private createRoleDashboards(): void {
    const roles: ObservabilityRole[] = this.config.roles || ['developer', 'sre', 'cto', 'security'];
    
    roles.forEach(role => {
      const dashboardName = this.generateDashboardName(role);
      const dashboard = new cloudwatch.Dashboard(this, `${role}Dashboard`, {
        dashboardName,
        defaultInterval: Duration.minutes(5),
      });
      
      this.dashboards.set(role, dashboard);
    });
  }

  private refreshDashboards(): void {
    this.dashboards.forEach((dashboard, role) => {
      const widgets = this.widgets.get(role) || [];
      const cloudwatchWidgets = widgets.map(widget => this.createCloudWatchWidget(widget));
      
      // Clear existing widgets and add new ones
      dashboard.addWidgets(...cloudwatchWidgets);
    });
  }

  private generateDashboardName(role: ObservabilityRole): string {
    const prefix = this.config.dashboardPrefix || 'Lattice';
    const roleTitle = role.charAt(0).toUpperCase() + role.slice(1);
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits for uniqueness
    return `${prefix}-${this.config.environment}-${roleTitle}-${timestamp}`;
  }

  private createCloudWatchWidget(widget: DashboardWidget): cloudwatch.IWidget {
    const metrics = widget.metrics.map(metric => this.createCloudWatchMetric(metric));

    switch (widget.type) {
      case 'line':
        return new cloudwatch.GraphWidget({
          title: widget.title,
          left: metrics,
          width: widget.width || 12,
          height: widget.height || 6,
          period: widget.period || Duration.minutes(5),
          leftAnnotations: widget.annotations,
        });

      case 'number':
        return new cloudwatch.SingleValueWidget({
          title: widget.title,
          metrics: metrics,
          width: widget.width || 6,
          height: widget.height || 3,
          period: widget.period || Duration.minutes(5),
        });

      case 'gauge':
        return new cloudwatch.GaugeWidget({
          title: widget.title,
          metrics: metrics,
          width: widget.width || 6,
          height: widget.height || 6,
          period: widget.period || Duration.minutes(5),
        });

      case 'log':
        return new cloudwatch.LogQueryWidget({
          title: widget.title,
          logGroupNames: ['/aws/lambda/default'], // Default log group, would be customized based on resource
          width: widget.width || 12,
          height: widget.height || 6,
          queryLines: [
            'fields @timestamp, @message',
            'sort @timestamp desc',
            'limit 100'
          ],
        });

      default:
        return new cloudwatch.GraphWidget({
          title: widget.title,
          left: metrics,
          width: widget.width || 12,
          height: widget.height || 6,
        });
    }
  }

  private createCloudWatchMetric(metric: MetricDefinition): cloudwatch.Metric {
    return new cloudwatch.Metric({
      metricName: metric.metricName,
      namespace: metric.namespace,
      dimensionsMap: metric.dimensionMap,
      statistic: metric.statistic || cloudwatch.Statistic.AVERAGE,
      period: metric.period || Duration.minutes(5),
      label: metric.label,
      unit: metric.unit,
    });
  }

  private addComputeWidgets(resourceId: string, resourceData: any): void {
    const computeType = resourceData.type || 'ec2';

    // Developer widgets - detailed technical metrics
    this.addWidgetToRole('developer', {
      title: `${resourceId} - CPU & Memory`,
      type: 'line',
      metrics: [
        {
          metricName: 'CPUUtilization',
          namespace: computeType === 'lambda' ? 'AWS/Lambda' : computeType === 'ecs' ? 'AWS/ECS' : 'AWS/EC2',
          dimensionMap: this.getComputeDimensions(resourceId, computeType),
          label: 'CPU %',
        },
        ...(computeType !== 'lambda' ? [{
          metricName: 'MemoryUtilization',
          namespace: computeType === 'ecs' ? 'AWS/ECS' : 'CWAgent',
          dimensionMap: this.getComputeDimensions(resourceId, computeType),
          label: 'Memory %',
        }] : []),
      ],
      width: 12,
      height: 6,
    });

    if (computeType === 'lambda') {
      this.addWidgetToRole('developer', {
        title: `${resourceId} - Lambda Metrics`,
        type: 'line',
        metrics: [
          {
            metricName: 'Duration',
            namespace: 'AWS/Lambda',
            dimensionMap: { FunctionName: resourceId },
            label: 'Duration (ms)',
          },
          {
            metricName: 'Errors',
            namespace: 'AWS/Lambda',
            dimensionMap: { FunctionName: resourceId },
            label: 'Errors',
            statistic: cloudwatch.Statistic.SUM,
          },
          {
            metricName: 'Invocations',
            namespace: 'AWS/Lambda',
            dimensionMap: { FunctionName: resourceId },
            label: 'Invocations',
            statistic: cloudwatch.Statistic.SUM,
          },
        ],
        width: 12,
        height: 6,
      });
    }

    // SRE widgets - operational metrics
    this.addWidgetToRole('sre', {
      title: `${resourceId} - Health Overview`,
      type: 'number',
      metrics: [
        {
          metricName: 'CPUUtilization',
          namespace: computeType === 'lambda' ? 'AWS/Lambda' : computeType === 'ecs' ? 'AWS/ECS' : 'AWS/EC2',
          dimensionMap: this.getComputeDimensions(resourceId, computeType),
          label: 'Avg CPU %',
        },
      ],
      width: 6,
      height: 3,
    });

    // CTO widgets - high-level business metrics
    this.addWidgetToRole('cto', {
      title: `Compute Resources - Availability`,
      type: 'gauge',
      metrics: [
        {
          metricName: computeType === 'lambda' ? 'Errors' : 'StatusCheckFailed',
          namespace: computeType === 'lambda' ? 'AWS/Lambda' : 'AWS/EC2',
          dimensionMap: this.getComputeDimensions(resourceId, computeType),
          label: 'Health Score',
        },
      ],
      width: 6,
      height: 6,
    });

    // Security widgets - security-related metrics
    this.addWidgetToRole('security', {
      title: `${resourceId} - Security Events`,
      type: 'log',
      metrics: [],
      width: 12,
      height: 6,
    });
  }

  private addDatabaseWidgets(resourceId: string, resourceData: any): void {
    // Developer widgets
    this.addWidgetToRole('developer', {
      title: `${resourceId} - Database Performance`,
      type: 'line',
      metrics: [
        {
          metricName: 'CPUUtilization',
          namespace: 'AWS/RDS',
          dimensionMap: { DBInstanceIdentifier: resourceId },
          label: 'CPU %',
        },
        {
          metricName: 'DatabaseConnections',
          namespace: 'AWS/RDS',
          dimensionMap: { DBInstanceIdentifier: resourceId },
          label: 'Connections',
        },
        {
          metricName: 'ReadLatency',
          namespace: 'AWS/RDS',
          dimensionMap: { DBInstanceIdentifier: resourceId },
          label: 'Read Latency (ms)',
        },
        {
          metricName: 'WriteLatency',
          namespace: 'AWS/RDS',
          dimensionMap: { DBInstanceIdentifier: resourceId },
          label: 'Write Latency (ms)',
        },
      ],
      width: 12,
      height: 6,
    });

    // SRE widgets
    this.addWidgetToRole('sre', {
      title: `${resourceId} - Resource Utilization`,
      type: 'line',
      metrics: [
        {
          metricName: 'FreeableMemory',
          namespace: 'AWS/RDS',
          dimensionMap: { DBInstanceIdentifier: resourceId },
          label: 'Free Memory (bytes)',
        },
        {
          metricName: 'FreeStorageSpace',
          namespace: 'AWS/RDS',
          dimensionMap: { DBInstanceIdentifier: resourceId },
          label: 'Free Storage (bytes)',
        },
      ],
      width: 12,
      height: 6,
    });

    // CTO widgets
    this.addWidgetToRole('cto', {
      title: `Database - Availability`,
      type: 'number',
      metrics: [
        {
          metricName: 'DatabaseConnections',
          namespace: 'AWS/RDS',
          dimensionMap: { DBInstanceIdentifier: resourceId },
          label: 'Active Connections',
        },
      ],
      width: 6,
      height: 3,
    });
  }

  private addStorageWidgets(resourceId: string, resourceData: any): void {
    // Developer widgets
    this.addWidgetToRole('developer', {
      title: `${resourceId} - S3 Request Metrics`,
      type: 'line',
      metrics: [
        {
          metricName: 'AllRequests',
          namespace: 'AWS/S3',
          dimensionMap: { BucketName: resourceId },
          label: 'Total Requests',
          statistic: cloudwatch.Statistic.SUM,
        },
        {
          metricName: '4xxErrors',
          namespace: 'AWS/S3',
          dimensionMap: { BucketName: resourceId },
          label: '4xx Errors',
          statistic: cloudwatch.Statistic.SUM,
        },
        {
          metricName: '5xxErrors',
          namespace: 'AWS/S3',
          dimensionMap: { BucketName: resourceId },
          label: '5xx Errors',
          statistic: cloudwatch.Statistic.SUM,
        },
      ],
      width: 12,
      height: 6,
    });

    // CTO widgets
    this.addWidgetToRole('cto', {
      title: `Storage - Request Volume`,
      type: 'number',
      metrics: [
        {
          metricName: 'AllRequests',
          namespace: 'AWS/S3',
          dimensionMap: { BucketName: resourceId },
          label: 'Daily Requests',
          statistic: cloudwatch.Statistic.SUM,
        },
      ],
      width: 6,
      height: 3,
    });
  }

  private addNetworkWidgets(resourceId: string, resourceData: any): void {
    const natGatewayIds = resourceData.natGatewayIds || [];

    if (natGatewayIds.length > 0) {
      // SRE widgets
      this.addWidgetToRole('sre', {
        title: `NAT Gateway - Error Metrics`,
        type: 'line',
        metrics: natGatewayIds.flatMap((natId: string) => [
          {
            metricName: 'ErrorPortAllocation',
            namespace: 'AWS/NatGateway',
            dimensionMap: { NatGatewayId: natId },
            label: `${natId} Port Errors`,
            statistic: cloudwatch.Statistic.SUM,
          },
          {
            metricName: 'PacketsDropCount',
            namespace: 'AWS/NatGateway',
            dimensionMap: { NatGatewayId: natId },
            label: `${natId} Dropped Packets`,
            statistic: cloudwatch.Statistic.SUM,
          },
        ]),
        width: 12,
        height: 6,
      });
    }
  }

  private addWidgetToRole(role: ObservabilityRole, widget: DashboardWidget): void {
    const roleWidgets = this.widgets.get(role) || [];
    roleWidgets.push(widget);
    this.widgets.set(role, roleWidgets);
  }

  private getComputeDimensions(resourceId: string, computeType: string): Record<string, string> {
    switch (computeType) {
      case 'lambda':
        return { FunctionName: resourceId };
      case 'ecs':
        return { ServiceName: resourceId };
      case 'ec2':
      default:
        return { InstanceId: resourceId };
    }
  }
}