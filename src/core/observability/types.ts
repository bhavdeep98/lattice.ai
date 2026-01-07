import { Duration } from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Environment } from '../types';

/**
 * Observability types and interfaces for Lattice constructs
 */

export type ObservabilityRole = 'developer' | 'sre' | 'cto' | 'security';

export interface AlarmConfig {
  enabled?: boolean;
  threshold?: number;
  evaluationPeriods?: number;
  datapointsToAlarm?: number;
  comparisonOperator?: cloudwatch.ComparisonOperator;
  treatMissingData?: cloudwatch.TreatMissingData;
  alarmDescription?: string;
}

export interface ObservabilityConfig {
  environment: Environment;
  enableAlarms?: boolean;
  enableDashboards?: boolean;
  notificationTopic?: sns.ITopic;
  alarmPrefix?: string;
  dashboardPrefix?: string;
  roles?: ObservabilityRole[];
}

export interface MetricDefinition {
  metricName: string;
  namespace: string;
  dimensionMap?: Record<string, string>;
  statistic?: string; // Use string instead of deprecated cloudwatch.Statistic
  period?: Duration;
  label?: string;
  unit?: cloudwatch.Unit;
}

export interface AlarmDefinition extends MetricDefinition {
  alarmName: string;
  threshold: number;
  comparisonOperator: cloudwatch.ComparisonOperator;
  evaluationPeriods?: number;
  datapointsToAlarm?: number;
  treatMissingData?: cloudwatch.TreatMissingData;
  alarmDescription?: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface DashboardWidget {
  title: string;
  metrics: MetricDefinition[];
  type: 'line' | 'number' | 'gauge' | 'log';
  width?: number;
  height?: number;
  period?: Duration;
  region?: string;
  annotations?: cloudwatch.HorizontalAnnotation[];
}

export interface RoleDashboardConfig {
  role: ObservabilityRole;
  dashboardName: string;
  widgets: DashboardWidget[];
  refreshInterval?: Duration;
}

/**
 * Predefined alarm configurations for different environments
 */
export const DEFAULT_ALARM_CONFIGS: Record<Environment, Partial<AlarmConfig>> = {
  prod: {
    enabled: true,
    evaluationPeriods: 2,
    datapointsToAlarm: 2,
    treatMissingData: cloudwatch.TreatMissingData.BREACHING,
  },
  staging: {
    enabled: true,
    evaluationPeriods: 3,
    datapointsToAlarm: 2,
    treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
  },
  dev: {
    enabled: false,
    evaluationPeriods: 5,
    datapointsToAlarm: 3,
    treatMissingData: cloudwatch.TreatMissingData.IGNORE,
  },
};

/**
 * Severity-based alarm configurations
 */
export const SEVERITY_CONFIGS: Record<string, Partial<AlarmConfig>> = {
  critical: {
    evaluationPeriods: 1,
    datapointsToAlarm: 1,
    treatMissingData: cloudwatch.TreatMissingData.BREACHING,
  },
  warning: {
    evaluationPeriods: 2,
    datapointsToAlarm: 2,
    treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
  },
  info: {
    evaluationPeriods: 3,
    datapointsToAlarm: 2,
    treatMissingData: cloudwatch.TreatMissingData.IGNORE,
  },
};
