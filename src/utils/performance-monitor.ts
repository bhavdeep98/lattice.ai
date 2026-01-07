/**
 * Performance Monitoring Utility for Lattice Framework
 * Tracks resource creation times, memory usage, and system performance
 */

import { logger } from './logger';

export interface PerformanceMetrics {
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryBefore?: NodeJS.MemoryUsage;
  memoryAfter?: NodeJS.MemoryUsage;
  memoryDelta?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  metadata?: Record<string, any>;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private activeOperations: Map<string, PerformanceMetrics> = new Map();
  private completedOperations: PerformanceMetrics[] = [];
  private maxHistorySize = 1000;

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public startOperation(operationName: string, metadata?: Record<string, any>): string {
    const operationId = `${operationName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const metrics: PerformanceMetrics = {
      operationName,
      startTime: Date.now(),
      memoryBefore: process.memoryUsage(),
      metadata
    };

    this.activeOperations.set(operationId, metrics);
    
    logger.logPerformanceMetric('operation_started', 1, 'count', {
      operationId,
      operationName,
      memoryBefore: metrics.memoryBefore
    });

    return operationId;
  }

  public endOperation(operationId: string, metadata?: Record<string, any>): PerformanceMetrics | null {
    const metrics = this.activeOperations.get(operationId);
    if (!metrics) {
      logger.warn('Attempted to end unknown operation', { operationId });
      return null;
    }

    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.memoryAfter = process.memoryUsage();
    
    if (metrics.memoryBefore && metrics.memoryAfter) {
      metrics.memoryDelta = {
        heapUsed: metrics.memoryAfter.heapUsed - metrics.memoryBefore.heapUsed,
        heapTotal: metrics.memoryAfter.heapTotal - metrics.memoryBefore.heapTotal,
        external: metrics.memoryAfter.external - metrics.memoryBefore.external,
        rss: metrics.memoryAfter.rss - metrics.memoryBefore.rss
      };
    }

    if (metadata) {
      metrics.metadata = { ...metrics.metadata, ...metadata };
    }

    // Log performance metrics
    logger.logPerformanceMetric('operation_duration', metrics.duration, 'milliseconds', {
      operationId,
      operationName: metrics.operationName,
      memoryDelta: metrics.memoryDelta
    });

    logger.logPerformanceMetric('memory_heap_delta', metrics.memoryDelta?.heapUsed || 0, 'bytes', {
      operationId,
      operationName: metrics.operationName
    });

    // Move to completed operations
    this.activeOperations.delete(operationId);
    this.completedOperations.push(metrics);

    // Maintain history size
    if (this.completedOperations.length > this.maxHistorySize) {
      this.completedOperations.shift();
    }

    return metrics;
  }

  public getActiveOperations(): PerformanceMetrics[] {
    return Array.from(this.activeOperations.values());
  }

  public getCompletedOperations(limit?: number): PerformanceMetrics[] {
    const operations = this.completedOperations.slice();
    return limit ? operations.slice(-limit) : operations;
  }

  public getOperationStats(operationName?: string): {
    count: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    totalMemoryDelta: number;
  } {
    const operations = operationName 
      ? this.completedOperations.filter(op => op.operationName === operationName)
      : this.completedOperations;

    if (operations.length === 0) {
      return {
        count: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        totalMemoryDelta: 0
      };
    }

    const durations = operations.map(op => op.duration || 0);
    const memoryDeltas = operations.map(op => op.memoryDelta?.heapUsed || 0);

    return {
      count: operations.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      totalMemoryDelta: memoryDeltas.reduce((a, b) => a + b, 0)
    };
  }

  public logSystemMetrics(): void {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    logger.logPerformanceMetric('system_memory_heap_used', memoryUsage.heapUsed, 'bytes');
    logger.logPerformanceMetric('system_memory_heap_total', memoryUsage.heapTotal, 'bytes');
    logger.logPerformanceMetric('system_memory_rss', memoryUsage.rss, 'bytes');
    logger.logPerformanceMetric('system_memory_external', memoryUsage.external, 'bytes');
    
    logger.logPerformanceMetric('system_cpu_user', cpuUsage.user, 'microseconds');
    logger.logPerformanceMetric('system_cpu_system', cpuUsage.system, 'microseconds');
    
    logger.info('System metrics logged', {
      memoryUsage,
      cpuUsage,
      uptime: process.uptime(),
      activeOperations: this.activeOperations.size,
      completedOperations: this.completedOperations.length
    });
  }

  public startPeriodicMetrics(intervalMs: number = 60000): NodeJS.Timeout {
    logger.info('Starting periodic system metrics collection', { intervalMs });
    
    return setInterval(() => {
      this.logSystemMetrics();
    }, intervalMs);
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Decorator for automatic performance monitoring
export function monitorPerformance(operationName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const opName = operationName || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      const operationId = performanceMonitor.startOperation(opName, {
        className: target.constructor.name,
        methodName: propertyName,
        argsCount: args.length
      });

      try {
        const result = await originalMethod.apply(this, args);
        performanceMonitor.endOperation(operationId, { success: true });
        return result;
      } catch (error) {
        performanceMonitor.endOperation(operationId, { 
          success: false, 
          error: (error as Error).message 
        });
        throw error;
      }
    };

    return descriptor;
  };
}

// Utility function for manual performance monitoring
export async function withPerformanceMonitoring<T>(
  operationName: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const operationId = performanceMonitor.startOperation(operationName, metadata);
  
  try {
    const result = await fn();
    performanceMonitor.endOperation(operationId, { success: true });
    return result;
  } catch (error) {
    performanceMonitor.endOperation(operationId, { 
      success: false, 
      error: (error as Error).message 
    });
    throw error;
  }
}