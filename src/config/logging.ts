/**
 * Logging Configuration for Lattice Framework
 * Centralized configuration for all logging behavior
 */

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error' | 'audit';
  enableConsole: boolean;
  enableCloudWatch: boolean;
  enableStructuredLogging: boolean;
  enablePerformanceMetrics: boolean;
  enableSecurityAudit: boolean;
  enableInfrastructureTracking: boolean;
  correlationIdHeader: string;
  maxLogEntrySize: number;
  sensitiveFields: string[];
  cloudWatch?: {
    logGroupName: string;
    logStreamName: string;
    region: string;
  };
  filters?: {
    excludePatterns: string[];
    includePatterns: string[];
  };
}

export const DEFAULT_LOGGING_CONFIG: LoggingConfig = {
  level: process.env.LOG_LEVEL as any || 'info',
  enableConsole: true,
  enableCloudWatch: process.env.NODE_ENV === 'production',
  enableStructuredLogging: true,
  enablePerformanceMetrics: true,
  enableSecurityAudit: true,
  enableInfrastructureTracking: true,
  correlationIdHeader: 'x-correlation-id',
  maxLogEntrySize: 32768, // 32KB
  sensitiveFields: [
    'password',
    'token',
    'secret',
    'key',
    'credential',
    'authorization',
    'cookie',
    'session'
  ],
  cloudWatch: {
    logGroupName: process.env.CLOUDWATCH_LOG_GROUP || '/lattice/application',
    logStreamName: process.env.CLOUDWATCH_LOG_STREAM || 'default',
    region: process.env.AWS_REGION || 'us-east-1'
  },
  filters: {
    excludePatterns: [
      'health-check',
      'ping',
      'favicon.ico'
    ],
    includePatterns: []
  }
};

export const ENVIRONMENT_CONFIGS: Record<string, Partial<LoggingConfig>> = {
  development: {
    level: 'debug',
    enableCloudWatch: false,
    enablePerformanceMetrics: true
  },
  staging: {
    level: 'info',
    enableCloudWatch: true,
    enablePerformanceMetrics: true,
    enableSecurityAudit: true
  },
  production: {
    level: 'warn',
    enableCloudWatch: true,
    enablePerformanceMetrics: true,
    enableSecurityAudit: true,
    enableInfrastructureTracking: true
  }
};

export function getLoggingConfig(environment?: string): LoggingConfig {
  const env = environment || process.env.NODE_ENV || 'development';
  const envConfig = ENVIRONMENT_CONFIGS[env] || {};
  
  return {
    ...DEFAULT_LOGGING_CONFIG,
    ...envConfig
  };
}

export const LOGGING_PATTERNS = {
  // Infrastructure operations
  RESOURCE_CREATION: 'resource_creation',
  RESOURCE_DELETION: 'resource_deletion',
  RESOURCE_UPDATE: 'resource_update',
  STACK_DEPLOYMENT: 'stack_deployment',
  
  // API operations
  API_REQUEST: 'api_request',
  API_RESPONSE: 'api_response',
  API_ERROR: 'api_error',
  
  // Database operations
  DB_QUERY: 'db_query',
  DB_CONNECTION: 'db_connection',
  DB_TRANSACTION: 'db_transaction',
  
  // Security events
  SECURITY_VIOLATION: 'security_violation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  COMPLIANCE_CHECK: 'compliance_check',
  
  // Performance metrics
  PERFORMANCE_METRIC: 'performance_metric',
  SYSTEM_METRIC: 'system_metric',
  OPERATION_TIMING: 'operation_timing',
  
  // Business logic
  BUSINESS_EVENT: 'business_event',
  USER_ACTION: 'user_action',
  WORKFLOW_STEP: 'workflow_step'
};

export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  AUDIT: 4
} as const;

export function shouldLog(configLevel: string, messageLevel: string): boolean {
  const configLevelNum = LOG_LEVELS[configLevel.toUpperCase() as keyof typeof LOG_LEVELS] ?? LOG_LEVELS.INFO;
  const messageLevelNum = LOG_LEVELS[messageLevel.toUpperCase() as keyof typeof LOG_LEVELS] ?? LOG_LEVELS.INFO;
  
  return messageLevelNum >= configLevelNum;
}

export function sanitizeLogData(data: any, sensitiveFields: string[]): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeLogData(item, sensitiveFields));
  }

  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveFields.some(field => 
      lowerKey.includes(field.toLowerCase())
    );
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value, sensitiveFields);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

export function truncateLogEntry(entry: any, maxSize: number): any {
  const serialized = JSON.stringify(entry);
  
  if (serialized.length <= maxSize) {
    return entry;
  }
  
  // Truncate message and metadata if too large
  const truncated = { ...entry };
  
  if (truncated.message && truncated.message.length > maxSize / 2) {
    truncated.message = truncated.message.substring(0, maxSize / 2) + '... [TRUNCATED]';
  }
  
  if (truncated.metadata) {
    const metadataStr = JSON.stringify(truncated.metadata);
    if (metadataStr.length > maxSize / 2) {
      truncated.metadata = { 
        ...truncated.metadata, 
        _truncated: true,
        _originalSize: metadataStr.length 
      };
      
      // Remove large fields
      for (const key of Object.keys(truncated.metadata)) {
        if (JSON.stringify(truncated.metadata[key]).length > 1000) {
          truncated.metadata[key] = '[LARGE_FIELD_TRUNCATED]';
        }
      }
    }
  }
  
  return truncated;
}