# The Escape Hatch Pattern in Lattice

## The Problem

Lattice provides a "Simple JSON Intent" abstraction layer over AWS CDK constructs. For example:

```typescript
const bucket = new LatticeBucket(this, 'MyBucket', {
  name: 'app-data',
  encryption: true,
  versioning: true,
  cors: {
    allowedOrigins: ['https://myapp.com'],
    allowedMethods: ['GET', 'POST']
  }
});
```

This is great for 80% of use cases, but what happens when you need:
- Custom KMS key configuration
- Advanced CORS rules with specific headers
- S3 Inventory Configuration
- Cross-region replication
- Custom RDS parameter groups
- Complex IAM condition policies

**Without an escape hatch, you're blocked.** The abstraction becomes a limitation instead of a productivity boost.

## The Solution: Public Instance Properties

Every Lattice construct now exposes the underlying AWS CDK construct as a **public readonly property** called `instance`:

```typescript
// ✅ GOOD: Direct access to underlying construct
bucket.instance.addCorsRule({ /* advanced config */ });
database.instance.addPropertyOverride('MonitoringInterval', 15);
role.instance.addToPolicy(complexPolicyStatement);

// ❌ BAD: Method-based access creates friction
bucket.getBucket().addCorsRule({ /* config */ });
```

## Implementation Pattern

### Before (Limited)
```typescript
export class LatticeBucket extends Construct {
  private readonly bucket: s3.Bucket;
  
  // Only basic methods exposed
  public grantRead(grantee: any): void {
    this.bucket.grantRead(grantee);
  }
}
```

### After (Escape Hatch Enabled)
```typescript
export class LatticeBucket extends Construct {
  // Escape hatch: Direct access to underlying construct
  public readonly instance: s3.Bucket;
  
  private readonly bucket: s3.Bucket;
  
  constructor(scope: Construct, id: string, props: LatticeBucketProps) {
    super(scope, id);
    
    this.bucket = new s3.Bucket(this, 'Bucket', {
      // ... Lattice's opinionated defaults
    });
    
    // Expose for escape hatch scenarios
    this.instance = this.bucket;
  }
}
```

## Real-World Examples

### 1. Advanced S3 Configuration

```typescript
// Start with Lattice's simple intent
const bucket = new LatticeBucket(this, 'DataBucket', {
  name: 'analytics-data',
  environment: 'prod',
  encryption: true
});

// Escape hatch: Add advanced features
bucket.instance.addCorsRule({
  allowedOrigins: ['https://admin.myapp.com'],
  allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.DELETE],
  allowedHeaders: ['x-amz-server-side-encryption'],
  exposedHeaders: ['x-amz-request-id'],
  maxAge: 3600
});

bucket.instance.addLifecycleRule({
  id: 'IntelligentTiering',
  transitions: [{
    storageClass: s3.StorageClass.INTELLIGENT_TIERING,
    transitionAfter: Duration.days(1)
  }]
});
```

### 2. Custom RDS Configuration

```typescript
// Start with Lattice's database abstraction
const database = new LatticeDatabase(this, 'AppDB', {
  name: 'app-database',
  environment: 'prod',
  engine: 'postgres',
  size: 'large'
});

// Escape hatch: Advanced PostgreSQL tuning
const customParams = new rds.ParameterGroup(this, 'CustomParams', {
  engine: rds.DatabaseInstanceEngine.postgres({
    version: rds.PostgresEngineVersion.VER_15_4
  }),
  parameters: {
    'shared_preload_libraries': 'pg_stat_statements,auto_explain',
    'auto_explain.log_min_duration': '1000',
    'log_statement': 'ddl'
  }
});

database.instance.addPropertyOverride('DBParameterGroupName', customParams.parameterGroupName);
```

### 3. Complex IAM Policies

```typescript
// Start with Lattice's role abstraction
const role = new LatticeIdentity(this, 'ServiceRole', {
  name: 'api-service',
  environment: 'prod',
  role: 'application'
});

// Escape hatch: Add condition-based cross-account access
role.instance.addToPolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ['s3:GetObject'],
  resources: ['arn:aws:s3:::shared-bucket/*'],
  conditions: {
    'StringEquals': {
      's3:x-amz-server-side-encryption': 'AES256'
    },
    'IpAddress': {
      'aws:SourceIp': ['203.0.113.0/24']
    }
  }
}));
```

## Benefits

### 1. **Progressive Enhancement**
- Start simple with Lattice's JSON intent
- Add complexity only when needed
- No need to abandon Lattice for edge cases

### 2. **Zero Lock-in**
- Full access to underlying AWS CDK constructs
- Can use any CDK feature or method
- Future-proof against new AWS features

### 3. **Team Productivity**
- Junior developers use simple Lattice interface
- Senior developers can access advanced features
- No context switching between abstraction layers

### 4. **Maintainability**
- Clear separation between "simple" and "advanced" usage
- Easy to identify where escape hatches are used
- Can gradually move advanced patterns back into Lattice

## Best Practices

### 1. **Use Sparingly**
Only use escape hatches when Lattice's abstraction is genuinely insufficient:

```typescript
// ✅ GOOD: Lattice covers this use case
const bucket = new LatticeBucket(this, 'Bucket', {
  cors: { allowedOrigins: ['*'] }
});

// ❌ BAD: Unnecessary escape hatch
bucket.instance.addCorsRule({
  allowedOrigins: ['*'],
  allowedMethods: [s3.HttpMethods.GET]
});
```

### 2. **Document Why**
Always comment why you're using an escape hatch:

```typescript
// Escape hatch: Need custom KMS key for compliance requirements
// Lattice's encryption: true only provides S3-managed encryption
bucket.instance.addPropertyOverride('BucketEncryption', {
  ServerSideEncryptionConfiguration: [{
    ServerSideEncryptionByDefault: {
      SSEAlgorithm: 'aws:kms',
      KMSMasterKeyID: complianceKey.keyArn
    }
  }]
});
```

### 3. **Consider Contributing Back**
If you find yourself using the same escape hatch pattern repeatedly, consider contributing it back to Lattice:

```typescript
// This pattern could become:
// encryption: { type: 'kms', keyArn: 'arn:aws:kms:...' }
```

## Available Escape Hatches

| Lattice Construct | Instance Property | Underlying Type |
|-------------------|-------------------|-----------------|
| `LatticeBucket` | `instance` | `s3.Bucket` |
| `LatticeDatabase` | `instance` | `rds.DatabaseInstance` |
| `LatticeDatabase` | `securityGroup` | `ec2.SecurityGroup` |
| `LatticeIdentity` | `instance` | `iam.Role` |
| `LatticeCompute` | `instance` | `ec2.Instance \| autoscaling.AutoScalingGroup \| ecs.FargateService \| lambda.Function` |

## Migration Guide

If you have existing Lattice constructs using getter methods, migrate to the instance property:

```typescript
// Before
const bucket = latticeBucket.getBucket();
const database = latticeDatabase.getDatabase();
const role = latticeIdentity.getRole();

// After
const bucket = latticeBucket.instance;
const database = latticeDatabase.instance;
const role = latticeIdentity.instance;
```

The getter methods are still available for backward compatibility but are deprecated.

## Conclusion

The escape hatch pattern ensures that Lattice's abstractions enhance rather than limit your AWS CDK development. You get the best of both worlds:

- **Simplicity** for common use cases
- **Full power** when you need it
- **Zero lock-in** to Lattice's opinions

This pattern is critical for any abstraction layer that aims to be both productive and flexible.