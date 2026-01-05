# Operations & Statefulness in Lattice

## The Problem

Naive CDK implementations can cause **catastrophic data loss** during stack deletion. Without proper statefulness policies, a simple `cdk destroy` command can permanently delete production databases and S3 buckets containing critical business data.

## The Solution

Lattice implements comprehensive **Operations & Statefulness** management that:

1. **Prevents accidental data loss** with environment-aware removal policies
2. **Enforces backup requirements** with AWS Backup integration
3. **Validates configurations** to prevent unsafe production settings
4. **Provides compliance reporting** for regulatory requirements

## Key Features

### 1. Environment-Aware Removal Policies

Lattice automatically sets appropriate removal policies based on the environment:

| Environment | S3 Buckets | RDS Databases | Rationale |
|-------------|------------|---------------|-----------|
| `prod` | `RETAIN` | `SNAPSHOT` | Maximum data protection |
| `staging` | `RETAIN` | `SNAPSHOT` | Staging data may be valuable |
| `dev` | `DESTROY` | `DESTROY` | Fast iteration, cost optimization |

### 2. AWS Backup Integration

Production and staging environments automatically get:
- **Daily backups** with configurable retention
- **Weekly backups** (production only) for long-term retention
- **Monthly backups** (production only) for compliance
- **Cross-region backups** (production only) for disaster recovery
- **Point-in-time recovery** for databases
- **Compliance reporting** for audit requirements

### 3. Configuration Validation

Lattice prevents unsafe configurations:
- ❌ Cannot disable backups for production environments
- ❌ Cannot set backup retention below 7 days for production
- ❌ Cannot use `DESTROY` removal policy for production stateful resources

### 4. Force Retention Override

Critical resources can use `forceRetain: true` to ensure `RETAIN` policy regardless of environment.

## Usage Examples

### Basic Usage (Automatic Policies)

```typescript
// Development - optimized for speed and cost
const devBucket = new LatticeBucket(this, 'DevBucket', {
  name: 'app-data',
  environment: 'dev', // Will use DESTROY removal policy
  encryption: true,
});

// Production - optimized for data protection
const prodBucket = new LatticeBucket(this, 'ProdBucket', {
  name: 'app-data',
  environment: 'prod', // Will use RETAIN removal policy + backups
  encryption: true,
});
```

### Advanced Configuration

```typescript
// Critical production bucket with extended retention
const criticalBucket = new LatticeBucket(this, 'CriticalBucket', {
  name: 'critical-data',
  environment: 'prod',
  encryption: true,
  forceRetain: true, // Force RETAIN even if environment changes
  enableBackups: true,
  backupRetentionDays: 2555, // 7 years for regulatory compliance
});

// Production database with comprehensive backup strategy
const prodDatabase = new LatticeDatabase(this, 'ProdDatabase', {
  name: 'app-db',
  environment: 'prod',
  engine: 'postgres',
  size: 'large',
  highAvailability: true,
  network: { /* ... */ },
  enableBackups: true, // AWS Backup integration
  backupRetentionDays: 365, // 1 year retention
});
```

### Validation Examples

```typescript
// ❌ This will throw an error
try {
  createStatefulnessPolicy({
    environment: 'prod',
    enableBackups: false, // Cannot disable backups for production
  });
} catch (error) {
  console.log('PREVENTED: Unsafe production configuration');
}

// ❌ This will also throw an error
try {
  createStatefulnessPolicy({
    environment: 'prod',
    backupRetentionDays: 3, // Below 7-day minimum
  });
} catch (error) {
  console.log('PREVENTED: Insufficient backup retention');
}
```

## Implementation Details

### StatefulnessPolicy Class

The core of the system is the `StatefulnessPolicy` class:

```typescript
const policy = createStatefulnessPolicy({
  environment: 'prod',
  forceRetain: false,
  enableBackups: true,
  backupRetentionDays: 30,
});

// Get appropriate removal policies
const s3RemovalPolicy = policy.getRemovalPolicy(); // RETAIN
const dbRemovalPolicy = policy.getDatabaseRemovalPolicy(); // SNAPSHOT

// Check backup requirements
const shouldBackup = policy.shouldEnableBackups(); // true
const retentionDays = policy.getBackupRetentionDays(); // 30
```

### LatticeBackupManager

Handles comprehensive backup strategy:

```typescript
const backupManager = new LatticeBackupManager(this, 'BackupManager', {
  policy: statefulnessPolicy,
  backupVaultName: 'my-app-backup-vault',
  enableCrossRegionBackup: true,
  enableComplianceReporting: true,
});

// Add resources to backup plan
backupManager.addResource(database.instanceArn, 'rds-postgres');
```

### Backup Rules by Environment

#### Development
- **Daily backups**: 7-day retention
- **No cross-region backup**
- **No compliance reporting**
- **Backups disabled by default** (can be enabled)

#### Staging
- **Daily backups**: 14-day retention
- **No cross-region backup**
- **No compliance reporting**
- **Backups enabled by default**

#### Production
- **Daily backups**: 30-day retention with cold storage transition
- **Weekly backups**: 1-year retention
- **Monthly backups**: 7-year retention
- **Cross-region backup**: Available
- **Compliance reporting**: Enabled
- **Point-in-time recovery**: Enabled

## Best Practices

### 1. Environment Naming

Use consistent environment names:
- `dev` - Development environment
- `staging` - Staging/testing environment  
- `prod` - Production environment

### 2. Critical Resource Protection

For business-critical resources, always use `forceRetain`:

```typescript
const criticalBucket = new LatticeBucket(this, 'CriticalBucket', {
  name: 'customer-data',
  environment: 'prod',
  forceRetain: true, // Extra protection
  enableBackups: true,
  backupRetentionDays: 2555, // 7 years
});
```

### 3. Backup Validation

Always validate your backup strategy:

```typescript
// Test backup restoration procedures
// Monitor backup job success rates
// Verify cross-region backup replication
// Review compliance reports regularly
```

### 4. Cost Optimization

Balance data protection with cost:

```typescript
// Development: Fast iteration, minimal backups
const devResources = {
  environment: 'dev',
  enableBackups: false, // Save costs
};

// Staging: Moderate protection
const stagingResources = {
  environment: 'staging',
  backupRetentionDays: 14, // Balanced retention
};

// Production: Maximum protection
const prodResources = {
  environment: 'prod',
  backupRetentionDays: 365, // Long retention
  enableCrossRegionBackup: true,
};
```

## Migration Guide

### From Basic CDK

If you have existing CDK resources without statefulness policies:

```typescript
// Before: Risky
const bucket = new s3.Bucket(this, 'Bucket', {
  removalPolicy: RemovalPolicy.DESTROY, // ❌ Dangerous for production
});

// After: Safe
const bucket = new LatticeBucket(this, 'Bucket', {
  name: 'my-bucket',
  environment: 'prod', // ✅ Automatic RETAIN policy
  encryption: true,
});
```

### From Manual Backup Configuration

```typescript
// Before: Manual backup setup
const database = new rds.DatabaseInstance(this, 'Database', {
  // ... configuration
  backupRetention: Duration.days(7), // Manual setting
});

// Manual AWS Backup setup (complex)
const backupVault = new backup.BackupVault(/* ... */);
const backupPlan = new backup.BackupPlan(/* ... */);
// ... many more lines

// After: Automatic backup integration
const database = new LatticeDatabase(this, 'Database', {
  name: 'my-db',
  environment: 'prod',
  engine: 'postgres',
  size: 'large',
  network: { /* ... */ },
  // ✅ Automatic AWS Backup integration with best practices
});
```

## Compliance and Auditing

### Backup Compliance Reports

Production environments automatically generate compliance reports:

- **Backup job reports**: Success/failure rates
- **Recovery point objectives**: RTO/RPO metrics
- **Cross-region replication**: Status and lag
- **Retention compliance**: Policy adherence

### Audit Trail

All statefulness decisions are logged:

```typescript
// Logs show policy decisions
console.log(`Removal policy for ${environment}: ${policy.getRemovalPolicy()}`);
console.log(`Backup enabled: ${policy.shouldEnableBackups()}`);
console.log(`Retention days: ${policy.getBackupRetentionDays()}`);
```

## Troubleshooting

### Common Issues

1. **"Cannot disable backups for production"**
   - Solution: Remove `enableBackups: false` for production environments

2. **"Backup retention must be at least 7 days"**
   - Solution: Increase `backupRetentionDays` to 7 or higher

3. **"VPC lookup failed"**
   - Solution: Provide explicit VPC object or ensure environment context

### Monitoring

Monitor your backup strategy:

```bash
# Check backup job status
aws backup list-backup-jobs --by-state COMPLETED

# Verify cross-region replication
aws backup list-copy-jobs --by-state COMPLETED

# Review compliance reports
aws backup get-backup-plan --backup-plan-id <plan-id>
```

## Conclusion

Lattice's Operations & Statefulness system ensures that your AWS infrastructure is production-ready from day one. By automatically applying environment-appropriate policies and comprehensive backup strategies, you can focus on building features instead of worrying about data loss.

The system is designed to be:
- **Safe by default**: Production resources are protected automatically
- **Cost-effective**: Development resources use minimal backup strategies
- **Compliant**: Built-in reporting for regulatory requirements
- **Flexible**: Override policies when needed with escape hatches

This approach eliminates the most common cause of production incidents: accidental data deletion during infrastructure changes.