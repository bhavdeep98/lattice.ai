import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { ObservabilityConfig, ObservabilityRole } from './types';
import { LatticeAlarmManager } from './alarm-manager';
import { LatticeObservabilityDashboard } from './dashboard-manager';

/**
 * Centralized observability management for Lattice constructs
 * Coordinates alarms and dashboards for comprehensive monitoring
 */
export class LatticeObservabilityManager extends Construct {
  public readonly alarmManager: LatticeAlarmManager;
  public readonly dashboardManager: LatticeObservabilityDashboard;
  private readonly config: ObservabilityConfig;

  constructor(scope: Construct, id: string, config: ObservabilityConfig) {
    super(scope, id);
    
    this.config = config;

    // Create alarm manager
    this.alarmManager = new LatticeAlarmManager(this, 'AlarmManager', config);

    // Create dashboard manager
    this.dashboardManager = new LatticeObservabilityDashboard(this, 'DashboardManager', config);
  }

  /**
   * Add observability for a compute resource
   */
  public addComputeObservability(
    resourceId: string, 
    resourceType: 'ec2' | 'ecs' | 'lambda',
    additionalData?: any
  ): {
    alarms: cloudwatch.Alarm[];
    dashboard?: cloudwatch.Dashboard;
  } {
    // Create alarms
    const alarms = this.alarmManager.createComputeAlarms(resourceId, resourceType, additionalData);

    // Add dashboard widgets
    this.dashboardManager.addResourceWidgets('compute', resourceId, {
      type: resourceType,
      ...additionalData,
    });

    return {
      alarms,
      dashboard: this.dashboardManager.getDashboard('developer'),
    };
  }

  /**
   * Add observability for a database resource
   */
  public addDatabaseObservability(
    instanceId: string,
    engine: string,
    additionalData?: any
  ): {
    alarms: cloudwatch.Alarm[];
    dashboard?: cloudwatch.Dashboard;
  } {
    // Create alarms
    const alarms = this.alarmManager.createDatabaseAlarms(instanceId, engine, additionalData);

    // Add dashboard widgets
    this.dashboardManager.addResourceWidgets('database', instanceId, {
      engine,
      ...additionalData,
    });

    return {
      alarms,
      dashboard: this.dashboardManager.getDashboard('developer'),
    };
  }

  /**
   * Add observability for a storage resource
   */
  public addStorageObservability(
    bucketName: string,
    additionalData?: any
  ): {
    alarms: cloudwatch.Alarm[];
    dashboard?: cloudwatch.Dashboard;
  } {
    // Create alarms
    const alarms = this.alarmManager.createStorageAlarms(bucketName, additionalData);

    // Add dashboard widgets
    this.dashboardManager.addResourceWidgets('storage', bucketName, additionalData);

    return {
      alarms,
      dashboard: this.dashboardManager.getDashboard('developer'),
    };
  }

  /**
   * Add observability for network resources
   */
  public addNetworkObservability(
    vpcId: string,
    natGatewayIds?: string[],
    additionalData?: any
  ): {
    alarms: cloudwatch.Alarm[];
    dashboard?: cloudwatch.Dashboard;
  } {
    // Create alarms
    const alarms = this.alarmManager.createNetworkAlarms(vpcId, natGatewayIds);

    // Add dashboard widgets
    this.dashboardManager.addResourceWidgets('network', vpcId, {
      natGatewayIds,
      ...additionalData,
    });

    return {
      alarms,
      dashboard: this.dashboardManager.getDashboard('sre'),
    };
  }

  /**
   * Get all alarms created by this manager
   */
  public getAllAlarms(): cloudwatch.Alarm[] {
    return this.alarmManager.getAlarms();
  }

  /**
   * Get dashboard for a specific role
   */
  public getDashboard(role: ObservabilityRole): cloudwatch.Dashboard | undefined {
    return this.dashboardManager.getDashboard(role);
  }

  /**
   * Get all dashboards
   */
  public getAllDashboards(): Map<ObservabilityRole, cloudwatch.Dashboard> {
    return this.dashboardManager.getAllDashboards();
  }

  /**
   * Create a notification topic for alarms if not provided
   */
  public static createNotificationTopic(scope: Construct, id: string, topicName?: string): sns.Topic {
    return new sns.Topic(scope, id, {
      topicName: topicName || 'lattice-observability-notifications',
      displayName: 'Lattice Observability Notifications',
    });
  }

  /**
   * Factory method to create observability manager with sensible defaults
   */
  public static create(
    scope: Construct, 
    id: string, 
    config: Partial<ObservabilityConfig> & { environment: string }
  ): LatticeObservabilityManager {
    // Create notification topic if not provided
    let notificationTopic = config.notificationTopic;
    
    if (!notificationTopic) {
      // Try to find existing topic first to avoid duplicates
      try {
        notificationTopic = scope.node.tryFindChild('ObservabilityNotificationTopic') as sns.Topic;
      } catch (error) {
        // Topic doesn't exist, create new one
      }
      
      if (!notificationTopic) {
        notificationTopic = LatticeObservabilityManager.createNotificationTopic(
          scope, 
          'ObservabilityNotificationTopic'
        );
      }
    }

    const fullConfig: ObservabilityConfig = {
      enableAlarms: true,
      enableDashboards: true,
      roles: ['developer', 'sre', 'cto', 'security'],
      alarmPrefix: 'Lattice',
      dashboardPrefix: 'Lattice',
      notificationTopic,
      ...config,
      environment: config.environment as any,
    };

    return new LatticeObservabilityManager(scope, id, fullConfig);
  }
}