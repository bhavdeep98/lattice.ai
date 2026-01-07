# Lattice Framework Logging Guide

## Overview

The Lattice framework includes comprehensive logging specifically designed to track the complete journey from user intent to deployed infrastructure. Every step of the Lattice process is logged with clear phase transitions, step-by-step progress, and detailed context about what the framework is doing.

## Lattice-Specific Logging Features

### 1. Operation Tracking

- **Intent Analysis**: Domain detection, confidence scoring, component analysis
- **Manifest Generation**: Base manifest creation, domain pattern application, capability configuration
- **CDK Code Generation**: Stack initialization, resource creation, aspect application
- **Synthesis**: CloudFormation template generation and validation
- **Deployment**: Infrastructure deployment monitoring and verification

### 2. Phase-Based Logging

Each Lattice operation progresses through distinct phases:

- **Initialization**: Setting up the operation context
- **Analysis**: Understanding user intent and requirements
- **Generation**: Creating manifests and code
- **Validation**: Checking generated artifacts
- **Synthesis**: Converting to CloudFormation
- **Deployment**: Deploying infrastructure
- **Completion**: Finalizing and cleanup

### 3. Step-by-Step Visibility

Detailed logging for every step within each phase:

- Parsing user input
- Detecting domain patterns
- Calculating confidence scores
- Creating base manifests
- Applying domain-specific patterns
- Initializing CDK stacks
- Creating individual resources (VPC, database, compute, etc.)
- Running synthesis
- Validating templates

### 4. Progress Tracking

- Current step vs total steps
- Percentage completion
- Duration tracking for each operation
- Resource creation counts

## Lattice Log Schema

### Lattice-Specific Log Entry

```json
{
  "timestamp": "2024-01-06T10:30:00.000Z",
  "level": "info",
  "message": "[LATTICE STEP: creating-vpc] Creating network infrastructure foundation",
  "context": {
    "correlationId": "lattice-1704537000000-abc123",
    "operation": "infrastructure-deployment",
    "phase": "deployment",
    "step": "creating-vpc",
    "environment": "production",
    "appName": "mlops-platform",
    "stackId": "MLOpsPlatformStack"
  },
  "metadata": {
    "latticeStep": "creating-vpc",
    "stepProgress": {
      "current": 2,
      "total": 8,
      "percentage": 25
    },
    "reason": "Required for compute and database resources",
    "cidr": "10.0.0.0/16"
  },
  "latticeSpecific": {
    "operation": "infrastructure-deployment",
    "phase": "deployment",
    "step": "creating-vpc",
    "progress": {
      "current": 2,
      "total": 8,
      "percentage": 25
    },
    "resourcesCreated": ["vpc-12345", "subnet-67890"],
    "estimatedCost": 45.5
  }
}
```

### Phase Transition Log

```json
{
  "timestamp": "2024-01-06T10:30:00.000Z",
  "level": "info",
  "message": "[LATTICE PHASE] analysis → generation",
  "context": {
    "correlationId": "lattice-1704537000000-abc123",
    "operation": "manifest-generation",
    "phase": "generation"
  },
  "metadata": {
    "phaseTransition": true,
    "fromPhase": "analysis",
    "toPhase": "generation",
    "detectedDomain": "mlops",
    "confidence": 0.85
  }
}
```

## Usage Examples

### Complete Lattice Operation Logging

```typescript
import { logger, LatticeOperation, LatticePhase, LatticeStep } from '../utils/logger';

// Start a complete Lattice infrastructure generation
const correlationId = logger.startLatticeOperation(
  LatticeOperation.INTENT_ANALYSIS,
  LatticePhase.INITIALIZATION,
  { userRequest: 'MLOps platform' }
);

// Phase 1: Intent Analysis
logger.logLatticePhaseTransition(LatticePhase.INITIALIZATION, LatticePhase.ANALYSIS);

logger.logLatticeStep(
  LatticeStep.PARSING_USER_INPUT,
  'Processing user input for infrastructure requirements',
  { inputLength: userInput.length },
  { current: 1, total: 5 }
);

logger.logLatticeStep(LatticeStep.DETECTING_DOMAIN, 'Analyzing domain patterns and components', {
  patterns: ['mlops', 'model-serving', 'data-processing'],
});

logger.logLatticeStep(
  LatticeStep.CALCULATING_CONFIDENCE,
  'Domain detection completed with high confidence',
  {
    detectedDomain: 'mlops',
    confidence: 0.92,
    componentsFound: ['modelServing', 'modelRegistry', 'monitoring'],
  },
  { current: 1, total: 5 }
);

// Phase 2: Manifest Generation
logger.logLatticePhaseTransition(LatticePhase.ANALYSIS, LatticePhase.GENERATION, {
  detectedDomain: 'mlops',
  confidence: 0.92,
});

logger.logLatticeStep(
  LatticeStep.CREATING_BASE_MANIFEST,
  'Generating Lattice manifest for MLOps platform',
  { targetDomain: 'mlops' },
  { current: 2, total: 5 }
);

logger.logLatticeStep(
  LatticeStep.CONFIGURING_CAPABILITIES,
  'Configuring MLOps-specific capabilities',
  {
    capabilities: ['api', 'database', 'storage'],
    apiType: 'container',
    databaseEngine: 'postgres',
    storageType: 's3',
  }
);

// Phase 3: CDK Generation
logger.logLatticePhaseTransition(LatticePhase.GENERATION, LatticePhase.VALIDATION);

logger.logLatticeStep(
  LatticeStep.INITIALIZING_STACK,
  'Initializing CDK stack for MLOps platform',
  { stackName: 'MLOpsPlatformStack' },
  { current: 3, total: 5 }
);

// Resource creation logging
logger.logLatticeResourceCreation('vpc', 'vpc-12345', LatticeStep.CONFIGURING_VPC, {
  cidr: '10.0.0.0/16',
  availabilityZones: 3,
  publicSubnets: 3,
  privateSubnets: 3,
});

logger.logLatticeResourceCreation('database', 'mlops-db-001', LatticeStep.CREATING_DB_INSTANCE, {
  engine: 'postgres',
  version: '14.9',
  instanceClass: 'db.r5.large',
  multiAZ: true,
  encrypted: true,
});

// Complete the operation
logger.endLatticeOperation(correlationId, true, {
  manifestGenerated: true,
  cdkCodeGenerated: true,
  resourcesCreated: 15,
  estimatedMonthlyCost: 450.0,
});
```

### Infrastructure Deployment Logging

```typescript
// Stack deployment with detailed resource tracking
export class LatticeStack extends Stack {
  constructor(scope: Construct, id: string, manifest: LatticeManifest) {
    super(scope, id);

    // Set Lattice context
    logger.setContext({
      operation: LatticeOperation.INFRASTRUCTURE_DEPLOYMENT,
      phase: LatticePhase.DEPLOYMENT,
      stackId: id,
      appName: manifest.appName,
    });

    logger.logLatticeStep(
      LatticeStep.INITIALIZING_STACK,
      `Deploying Lattice stack: ${manifest.appName}`,
      {
        environment: manifest.environment,
        capabilities: Object.keys(manifest.capabilities),
      }
    );

    // Network creation
    if (needsNetwork) {
      logger.logLatticeStep(LatticeStep.CREATING_NETWORK, 'Creating network foundation', {
        cidr: '10.0.0.0/16',
      });

      const network = new LatticeNetwork(this, 'Network', {
        name: `${manifest.appName}-net`,
        environment: manifest.environment,
        cidr: '10.0.0.0/16',
      });

      logger.logLatticeStep(LatticeStep.CONFIGURING_VPC, 'VPC and subnets created successfully', {
        vpcId: network.output.vpcId,
        publicSubnets: network.output.publicSubnetIds.length,
        privateSubnets: network.output.privateSubnetIds.length,
      });
    }

    // Database creation
    if (manifest.capabilities.database) {
      logger.logLatticeStep(LatticeStep.CREATING_DATABASE, 'Creating database infrastructure', {
        engine: manifest.capabilities.database.engine,
        size: manifest.capabilities.database.size,
      });

      const database = new LatticeDatabase(this, 'Database', {
        ...manifest.capabilities.database,
        network: networkOutput,
      });

      logger.logLatticeStep(
        LatticeStep.CREATING_DB_INSTANCE,
        'Database instance created successfully',
        {
          instanceId: database.output.instanceId,
          endpoint: database.output.endpoint,
          encrypted: true,
        }
      );
    }
  }
}
```

## Log Analysis and Monitoring

### CloudWatch Queries for Lattice Operations

```sql
-- Track complete Lattice operations
fields @timestamp, message, context.operation, context.phase, metadata.latticeStep
| filter context.operation like /lattice/
| sort @timestamp desc
| limit 100

-- Monitor infrastructure generation success rate
fields @timestamp, metadata.success, context.appName, metadata.error
| filter metadata.operationEnd = true
| stats count() by metadata.success

-- Track resource creation by type
fields @timestamp, metadata.resourceType, metadata.resourceId
| filter metadata.resourceCreation = true
| stats count() by metadata.resourceType

-- Monitor phase transitions and duration
fields @timestamp, metadata.fromPhase, metadata.toPhase, duration
| filter metadata.phaseTransition = true
| stats avg(duration) by bin(5m)

-- Track step-by-step progress
fields @timestamp, metadata.latticeStep, metadata.stepProgress.percentage
| filter metadata.stepProgress.percentage exists
| sort @timestamp desc
```

### Performance Analysis

```sql
-- Average time per Lattice operation
fields @timestamp, context.operation, duration
| filter metadata.operationEnd = true
| stats avg(duration) by context.operation

-- Resource creation performance
fields @timestamp, metadata.latticeStep, duration
| filter metadata.resourceCreation = true
| stats avg(duration), max(duration), min(duration) by metadata.latticeStep

-- Identify slow steps
fields @timestamp, metadata.latticeStep, duration
| filter duration > 5000
| sort duration desc
```

## Best Practices for Lattice Logging

### 1. Always Use Lattice-Specific Methods

```typescript
// Good - Lattice-specific logging
logger.logLatticeStep(LatticeStep.CREATING_VPC, 'Creating VPC with security best practices', {
  cidr: '10.0.0.0/16',
  enhancedSecurity: true,
});

// Avoid - Generic logging
logger.info('Creating VPC');
```

### 2. Include Progress Information

```typescript
logger.logLatticeStep(
  LatticeStep.CREATING_DATABASE,
  'Database creation in progress',
  { engine: 'postgres', size: 'large' },
  { current: 3, total: 8 } // Progress tracking
);
```

### 3. Log Phase Transitions

```typescript
logger.logLatticePhaseTransition(LatticePhase.GENERATION, LatticePhase.VALIDATION, {
  manifestReady: true,
  resourceCount: 5,
});
```

### 4. Track Resource Creation

```typescript
logger.logLatticeResourceCreation('database', 'prod-db-001', LatticeStep.CREATING_DB_INSTANCE, {
  engine: 'postgres',
  version: '14.9',
  multiAZ: true,
  encrypted: true,
});
```

### 5. Use Correlation IDs

```typescript
const correlationId = logger.startLatticeOperation(
  LatticeOperation.INFRASTRUCTURE_DEPLOYMENT,
  LatticePhase.INITIALIZATION
);

// All subsequent logs will include this correlation ID
// until endLatticeOperation is called
```

This logging system provides complete visibility into the Lattice framework's operation, making it easy to understand exactly what the system is doing at each step and troubleshoot any issues that arise.
