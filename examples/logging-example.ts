/**
 * Lattice Framework Logging Example
 * Demonstrates comprehensive logging usage across different scenarios
 */

import { logger, withLogging } from '../src/utils/logger';
import { performanceMonitor, monitorPerformance, withPerformanceMonitoring } from '../src/utils/performance-monitor';
import { getLoggingConfig } from '../src/config/logging';

// Example: Infrastructure deployment with logging
async function deployInfrastructure() {
  // Set context for the entire deployment
  logger.setContext({
    operation: 'infrastructure-deployment',
    environment: 'production',
    deploymentId: 'deploy-2024-001'
  });

  logger.audit('Starting infrastructure deployment', {
    timestamp: new Date().toISOString(),
    initiatedBy: 'ci-cd-pipeline',
    targetEnvironment: 'production'
  });

  try {
    // Step 1: Create network infrastructure
    logger.info('Creating network infrastructure');
    await simulateNetworkCreation();

    // Step 2: Create database
    logger.info('Creating database infrastructure');
    await simulateDatabaseCreation();

    // Step 3: Create compute resources
    logger.info('Creating compute infrastructure');
    await simulateComputeCreation();

    logger.audit('Infrastructure deployment completed successfully', {
      duration: '5m 30s',
      resourcesCreated: 15,
      estimatedMonthlyCost: 450.00
    });

  } catch (error) {
    logger.error('Infrastructure deployment failed', error as Error, {
      failurePoint: 'database-creation',
      rollbackRequired: true
    });
    throw error;
  } finally {
    logger.clearContext();
  }
}

// Example: Network creation with performance monitoring
@monitorPerformance('network-creation')
async function simulateNetworkCreation(): Promise<void> {
  logger.info('Validating network configuration');
  
  // Simulate validation
  await new Promise(resolve => setTimeout(resolve, 500));
  
  logger.info('Creating VPC and subnets');
  
  // Simulate VPC creation
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  logger.logResourceCreation('vpc', 'vpc-12345', {
    cidr: '10.0.0.0/16',
    availabilityZones: 3,
    publicSubnets: 3,
    privateSubnets: 3
  });

  logger.info('Configuring security groups');
  
  // Simulate security group creation
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  logger.logResourceCreation('security-group', 'sg-67890', {
    name: 'default-sg',
    rules: [
      { type: 'ingress', port: 443, protocol: 'tcp', source: '0.0.0.0/0' },
      { type: 'ingress', port: 80, protocol: 'tcp', source: '0.0.0.0/0' }
    ]
  });

  logger.logSecurityEvent('Security group created with public access', 'low', {
    securityGroupId: 'sg-67890',
    publicPorts: [80, 443],
    justification: 'Web application requires public access'
  });
}

// Example: Database creation with detailed logging
async function simulateDatabaseCreation(): Promise<void> {
  const operationId = logger.startOperation('database-creation', {
    engine: 'postgresql',
    version: '14.9',
    instanceClass: 'db.r5.large'
  });

  try {
    logger.info('Validating database configuration');
    
    // Simulate configuration validation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    logger.info('Creating database subnet group');
    
    // Simulate subnet group creation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    logger.info('Creating database parameter group');
    
    // Simulate parameter group creation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    logger.info('Creating database instance');
    
    // Simulate database instance creation (longer operation)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    logger.logResourceCreation('rds-instance', 'prod-db-001', {
      engine: 'postgresql',
      version: '14.9',
      instanceClass: 'db.r5.large',
      allocatedStorage: 100,
      storageEncrypted: true,
      multiAZ: true,
      backupRetentionPeriod: 7
    });

    // Simulate database connection test
    logger.info('Testing database connectivity');
    await simulateDatabaseQuery();

    logger.endOperation(operationId, true, {
      instanceId: 'prod-db-001',
      endpoint: 'prod-db-001.cluster-xyz.us-east-1.rds.amazonaws.com',
      port: 5432
    });

  } catch (error) {
    logger.endOperation(operationId, false, {
      error: (error as Error).message
    });
    throw error;
  }
}

// Example: Database operations with performance tracking
async function simulateDatabaseQuery(): Promise<void> {
  const result = await withPerformanceMonitoring('database-connectivity-test', async () => {
    // Simulate database connection and query
    await new Promise(resolve => setTimeout(resolve, 200));
    
    logger.logDatabaseOperation('SELECT', 'SELECT 1', 45, 1);
    
    return { connected: true, latency: 45 };
  }, {
    host: 'prod-db-001.cluster-xyz.us-east-1.rds.amazonaws.com',
    database: 'production'
  });

  logger.info('Database connectivity test completed', result);
}

// Example: Compute creation with error handling
async function simulateComputeCreation(): Promise<void> {
  logger.info('Creating compute infrastructure');

  try {
    // Simulate Lambda function creation
    await withLogging('lambda-creation', async () => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      logger.logResourceCreation('lambda-function', 'api-handler', {
        runtime: 'nodejs18.x',
        memorySize: 512,
        timeout: 30,
        environment: 'production'
      });
    }, {
      functionName: 'api-handler',
      runtime: 'nodejs18.x'
    });

    // Simulate ECS service creation
    await withLogging('ecs-service-creation', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      logger.logResourceCreation('ecs-service', 'web-service', {
        cluster: 'production-cluster',
        taskDefinition: 'web-app:1',
        desiredCount: 3,
        launchType: 'FARGATE'
      });
    }, {
      serviceName: 'web-service',
      cluster: 'production-cluster'
    });

  } catch (error) {
    logger.error('Compute creation failed', error as Error, {
      step: 'ecs-service-creation',
      rollbackRequired: true
    });
    throw error;
  }
}

// Example: API request simulation with logging
async function simulateApiRequests(): Promise<void> {
  logger.info('Simulating API requests for logging demonstration');

  // Simulate successful API requests
  for (let i = 0; i < 5; i++) {
    const correlationId = `req-${Date.now()}-${i}`;
    logger.setContext({ correlationId, operation: 'api-request' });

    const startTime = Date.now();
    
    // Simulate API processing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
    
    const duration = Date.now() - startTime;
    const statusCode = Math.random() > 0.1 ? 200 : 500; // 90% success rate
    
    logger.logApiRequest('GET', `/api/users/${i}`, statusCode, duration, `user-${i}`);
    
    if (statusCode === 500) {
      logger.error('API request failed', new Error('Internal server error'), {
        endpoint: `/api/users/${i}`,
        statusCode,
        duration
      });
    }

    logger.clearContext();
  }
}

// Example: Security event simulation
async function simulateSecurityEvents(): Promise<void> {
  logger.info('Simulating security events for logging demonstration');

  // Simulate various security events
  logger.logSecurityEvent('Failed login attempt', 'medium', {
    sourceIP: '192.168.1.100',
    username: 'admin',
    attemptCount: 3,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  logger.logSecurityEvent('Suspicious API access pattern', 'high', {
    sourceIP: '10.0.0.50',
    endpoint: '/api/admin/users',
    requestCount: 100,
    timeWindow: '5 minutes',
    rateLimitExceeded: true
  });

  logger.logSecurityEvent('Unauthorized resource access attempt', 'critical', {
    userId: 'user-123',
    resource: '/admin/system-config',
    action: 'READ',
    denied: true,
    reason: 'Insufficient permissions'
  });
}

// Example: Performance monitoring demonstration
async function demonstratePerformanceMonitoring(): Promise<void> {
  logger.info('Starting performance monitoring demonstration');

  // Start periodic system metrics collection
  const metricsInterval = performanceMonitor.startPeriodicMetrics(10000); // Every 10 seconds

  // Simulate various operations with different performance characteristics
  const operations = [
    { name: 'fast-operation', duration: 50 },
    { name: 'medium-operation', duration: 200 },
    { name: 'slow-operation', duration: 1000 },
    { name: 'variable-operation', duration: Math.random() * 500 + 100 }
  ];

  for (const op of operations) {
    await withPerformanceMonitoring(op.name, async () => {
      await new Promise(resolve => setTimeout(resolve, op.duration));
      
      // Simulate some memory allocation
      const data = new Array(1000).fill('test data');
      return data.length;
    }, {
      expectedDuration: op.duration,
      operationType: 'simulation'
    });
  }

  // Get and log performance statistics
  for (const op of operations) {
    const stats = performanceMonitor.getOperationStats(op.name);
    logger.info(`Performance stats for ${op.name}`, stats);
  }

  // Stop periodic metrics collection
  clearInterval(metricsInterval);
}

// Main demonstration function
async function runLoggingDemo(): Promise<void> {
  console.log('🚀 Starting Lattice Framework Logging Demonstration\n');

  // Get logging configuration
  const config = getLoggingConfig('development');
  logger.info('Logging system initialized', {
    config: {
      level: config.level,
      enableStructuredLogging: config.enableStructuredLogging,
      enablePerformanceMetrics: config.enablePerformanceMetrics
    }
  });

  try {
    // 1. Infrastructure deployment simulation
    console.log('📦 Simulating infrastructure deployment...');
    await deployInfrastructure();
    console.log('✅ Infrastructure deployment completed\n');

    // 2. API requests simulation
    console.log('🌐 Simulating API requests...');
    await simulateApiRequests();
    console.log('✅ API requests simulation completed\n');

    // 3. Security events simulation
    console.log('🔒 Simulating security events...');
    await simulateSecurityEvents();
    console.log('✅ Security events simulation completed\n');

    // 4. Performance monitoring demonstration
    console.log('📊 Demonstrating performance monitoring...');
    await demonstratePerformanceMonitoring();
    console.log('✅ Performance monitoring demonstration completed\n');

    // 5. Show final statistics
    const activeOps = performanceMonitor.getActiveOperations();
    const completedOps = performanceMonitor.getCompletedOperations(10);
    
    logger.info('Logging demonstration completed', {
      activeOperations: activeOps.length,
      completedOperations: completedOps.length,
      totalDuration: completedOps.reduce((sum, op) => sum + (op.duration || 0), 0)
    });

    console.log('🎉 Lattice Framework Logging Demonstration completed successfully!');
    console.log(`📈 Completed ${completedOps.length} operations`);
    console.log(`⏱️  Total processing time: ${completedOps.reduce((sum, op) => sum + (op.duration || 0), 0)}ms`);

  } catch (error) {
    logger.error('Logging demonstration failed', error as Error);
    console.error('❌ Demonstration failed:', (error as Error).message);
    process.exit(1);
  }
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
  runLoggingDemo().catch(console.error);
}

export {
  deployInfrastructure,
  simulateApiRequests,
  simulateSecurityEvents,
  demonstratePerformanceMonitoring,
  runLoggingDemo
};