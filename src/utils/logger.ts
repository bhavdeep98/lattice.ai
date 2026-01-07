/**
 * Minimal Lattice Framework Logging
 * Simple, focused logging for Lattice operations
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  AUDIT = 'audit'
}

export interface LatticeLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: {
    operation?: string;
    resourceType?: string;
    resourceId?: string;
  };
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  duration?: number;
  metadata?: Record<string, any>;
}

export class LatticeLogger {
  private static instance: LatticeLogger;
  private currentStep = 0;
  private totalSteps = 0;

  private constructor() {}

  public static getInstance(): LatticeLogger {
    if (!LatticeLogger.instance) {
      LatticeLogger.instance = new LatticeLogger();
    }
    return LatticeLogger.instance;
  }

  // Simple step logging with progress
  public step(message: string, step?: number, total?: number): void {
    if (step !== undefined && total !== undefined) {
      this.currentStep = step;
      this.totalSteps = total;
    } else {
      this.currentStep++;
    }

    const progress = this.totalSteps > 0 ? `[${this.currentStep}/${this.totalSteps}]` : '';
    console.log(`🔧 LATTICE ${progress} ${message}`);
  }

  // Success logging
  public success(message: string): void {
    console.log(`✅ LATTICE ${message}`);
  }

  // Error logging
  public error(message: string, error?: Error, metadata?: Record<string, any>): void {
    console.error(`❌ LATTICE ${message}${error ? ': ' + error.message : ''}`);
  }

  // Warning logging
  public warn(message: string, metadata?: Record<string, any>): void {
    console.warn(`⚠️  LATTICE ${message}`);
  }

  // Info logging
  public info(message: string, metadata?: Record<string, any>): void {
    console.log(`ℹ️  LATTICE ${message}`);
  }

  // Resource creation
  public resource(type: string, id: string): void {
    console.log(`📦 LATTICE Created ${type}: ${id}`);
  }

  // Start operation
  public start(operation: string, totalSteps?: number): void {
    this.currentStep = 0;
    this.totalSteps = totalSteps || 0;
    console.log(`🚀 LATTICE Starting ${operation}${totalSteps ? ` (${totalSteps} steps)` : ''}`);
  }

  // Complete operation
  public complete(operation: string, duration?: number): void {
    const time = duration ? ` in ${duration}ms` : '';
    console.log(`🎉 LATTICE Completed ${operation}${time}`);
  }

  // Legacy methods for backward compatibility
  public debug(message: string): void {
    console.debug(`🐛 LATTICE ${message}`);
  }

  public audit(message: string, metadata?: Record<string, any>): void {
    console.log(`📋 LATTICE ${message}`);
  }

  // Simplified utility methods
  public logResourceCreation(type: string, id: string, metadata?: Record<string, any>): void {
    this.resource(type, id);
  }

  public logInfrastructureChange(action: string, type: string, id: string): void {
    console.log(`🔄 LATTICE ${action} ${type}: ${id}`);
  }

  public logSecurityEvent(event: string, severity: string, metadata?: Record<string, any>): void {
    const icon = severity === 'critical' ? '🚨' : severity === 'high' ? '⚠️' : 'ℹ️';
    console.log(`${icon} LATTICE Security: ${event}`);
  }

  public logApiRequest(method: string, path: string, status: number, duration: number): void {
    const icon = status >= 400 ? '❌' : '✅';
    console.log(`${icon} LATTICE API ${method} ${path} ${status} (${duration}ms)`);
  }

  public logDatabaseOperation(operation: string, duration?: number): void {
    const time = duration ? ` (${duration}ms)` : '';
    console.log(`🗄️  LATTICE DB ${operation}${time}`);
  }

  // Simplified context methods (no-op for minimal logging)
  public setContext(context?: Record<string, any>): void {}
  public clearContext(): void {}
  
  public startOperation(operation: string, metadata?: Record<string, any>): string {
    this.start(operation);
    return Date.now().toString();
  }
  
  public endOperation(id: string, success: boolean, metadata?: any): void {
    const icon = success ? '✅' : '❌';
    console.log(`${icon} LATTICE Operation ${success ? 'completed' : 'failed'}`);
  }

  public logPerformanceMetric(metric?: string, value?: number, unit?: string, metadata?: Record<string, any>): void {} // No-op for minimal logging
}

// Export singleton instance
export const logger = LatticeLogger.getInstance();

// Utility functions for common logging patterns
export function withLogging<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const correlationId = logger.startOperation(operation);
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      logger.endOperation(correlationId, true, { duration });
      resolve(result);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(`Operation failed: ${operation}`, error as Error);
      logger.endOperation(correlationId, false, { duration });
      reject(error);
    }
  });
}

export function logExecutionTime<T>(
  target: any,
  propertyName: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const startTime = Date.now();
    const className = this.constructor.name;
    const methodName = propertyName;
    
    logger.debug(`Executing ${className}.${methodName}`);
    
    try {
      const result = await originalMethod.apply(this, args);
      const duration = Date.now() - startTime;
      
      logger.debug(`Completed ${className}.${methodName} in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(`Failed ${className}.${methodName} after ${duration}ms`, error as Error);
      throw error;
    }
  };

  return descriptor;
}