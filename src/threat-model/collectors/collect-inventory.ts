/**
 * Inventory collector - gathers security-relevant facts from CDK constructs
 */

import { IConstruct } from 'constructs';
import { CfnResource } from 'aws-cdk-lib';
import { ResourceRef, EntryPoint, DataStore } from '../model';

export class ThreatFactsCollector {
  inventory: ResourceRef[] = [];
  entryPoints: EntryPoint[] = [];
  dataStores: DataStore[] = [];
  iamFindings: any[] = [];
  networkFindings: any[] = [];

  onCfnResource(res: CfnResource) {
    const type = res.cfnResourceType; // e.g., AWS::S3::Bucket
    const service = type.split('::')[1]?.toLowerCase() ?? 'unknown';

    this.inventory.push({
      id: res.node.path,
      type,
      service,
      props: this.pickSmallProps(res, type),
    });

    // Collect entry points
    this.collectEntryPoints(res, type);

    // Collect data stores
    this.collectDataStores(res, type);
  }

  onConstruct(node: IConstruct) {
    // Optional: detect L2 constructs for better context
    const constructType = node.constructor.name;

    // Handle common L2 constructs
    if (constructType.includes('RestApi') || constructType.includes('HttpApi')) {
      this.entryPoints.push({
        id: node.node.path,
        kind: 'apigw',
        isPublic: true, // heuristic - could be refined
        notes: `L2 construct: ${constructType}`,
      });
    }
  }

  private collectEntryPoints(res: CfnResource, type: string) {
    switch (type) {
      case 'AWS::ApiGateway::RestApi':
      case 'AWS::ApiGatewayV2::Api':
        this.entryPoints.push({
          id: res.node.path,
          kind: 'apigw',
          isPublic: true, // heuristic
        });
        break;
      case 'AWS::ElasticLoadBalancingV2::LoadBalancer':
        this.entryPoints.push({
          id: res.node.path,
          kind: 'alb',
          isPublic: this.isLoadBalancerPublic(res),
        });
        break;
      case 'AWS::CloudFront::Distribution':
        this.entryPoints.push({
          id: res.node.path,
          kind: 'cloudfront',
          isPublic: true,
        });
        break;
      case 'AWS::S3::Bucket':
        if (this.isBucketWebsite(res)) {
          this.entryPoints.push({
            id: res.node.path,
            kind: 'public-s3-website',
            isPublic: true,
          });
        }
        break;
    }
  }

  private collectDataStores(res: CfnResource, type: string) {
    switch (type) {
      case 'AWS::S3::Bucket':
        this.dataStores.push({
          id: res.node.path,
          kind: 's3',
          containsSensitiveDataLikely: true, // conservative heuristic
          encryptionAtRest: this.getS3Encryption(res),
        });
        break;
      case 'AWS::DynamoDB::Table':
        this.dataStores.push({
          id: res.node.path,
          kind: 'dynamodb',
          containsSensitiveDataLikely: true,
          encryptionAtRest: this.getDynamoEncryption(res),
        });
        break;
      case 'AWS::RDS::DBInstance':
      case 'AWS::RDS::DBCluster':
        this.dataStores.push({
          id: res.node.path,
          kind: 'rds',
          containsSensitiveDataLikely: true,
          encryptionAtRest: this.getRDSEncryption(res),
        });
        break;
      case 'AWS::Redshift::Cluster':
        this.dataStores.push({
          id: res.node.path,
          kind: 'redshift',
          containsSensitiveDataLikely: true,
          encryptionAtRest: 'unknown', // would need to check properties
        });
        break;
      case 'AWS::OpenSearchService::Domain':
        this.dataStores.push({
          id: res.node.path,
          kind: 'opensearch',
          containsSensitiveDataLikely: true,
          encryptionAtRest: 'unknown',
        });
        break;
    }
  }

  private pickSmallProps(res: CfnResource, type: string): Record<string, any> {
    // IMPORTANT: avoid dumping huge tokenized / rendered CFN.
    // Pick a small curated subset based on type.
    const props: Record<string, any> = {};

    try {
      const cfnProps = (res as any).cfnProperties || {};

      switch (type) {
        case 'AWS::S3::Bucket':
          if (cfnProps.BucketName) {
            props.bucketName = cfnProps.BucketName;
          }
          if (cfnProps.PublicAccessBlockConfiguration) {
            props.publicAccess = 'blocked';
          }
          break;
        case 'AWS::Lambda::Function':
          if (cfnProps.Runtime) {
            props.runtime = cfnProps.Runtime;
          }
          if (cfnProps.MemorySize) {
            props.memorySize = cfnProps.MemorySize;
          }
          break;
        case 'AWS::DynamoDB::Table':
          if (cfnProps.TableName) {
            props.tableName = cfnProps.TableName;
          }
          if (cfnProps.BillingMode) {
            props.billingMode = cfnProps.BillingMode;
          }
          break;
      }
    } catch (e) {
      // Ignore errors in property extraction
    }

    return props;
  }

  private isLoadBalancerPublic(res: CfnResource): boolean {
    try {
      const props = (res as any).cfnProperties || {};
      return props.Scheme === 'internet-facing';
    } catch {
      return false; // conservative default
    }
  }

  private isBucketWebsite(res: CfnResource): boolean {
    try {
      const props = (res as any).cfnProperties || {};
      return !!props.WebsiteConfiguration;
    } catch {
      return false;
    }
  }

  private getS3Encryption(res: CfnResource): 'kms' | 'aws-managed' | 'none' | 'unknown' {
    try {
      const props = (res as any).cfnProperties || {};
      const encryption = props.BucketEncryption?.ServerSideEncryptionConfiguration?.[0];
      if (!encryption) {
        return 'none';
      }

      const algorithm = encryption.ServerSideEncryptionByDefault?.SSEAlgorithm;
      if (algorithm === 'aws:kms') {
        return 'kms';
      }
      if (algorithm === 'AES256') {
        return 'aws-managed';
      }
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private getDynamoEncryption(res: CfnResource): 'kms' | 'aws-managed' | 'none' | 'unknown' {
    try {
      const props = (res as any).cfnProperties || {};
      const encryption = props.SSESpecification;
      if (!encryption || !encryption.SSEEnabled) {
        return 'none';
      }

      if (encryption.KMSMasterKeyId) {
        return 'kms';
      }
      return 'aws-managed';
    } catch {
      return 'unknown';
    }
  }

  private getRDSEncryption(res: CfnResource): 'kms' | 'aws-managed' | 'none' | 'unknown' {
    try {
      const props = (res as any).cfnProperties || {};
      if (props.StorageEncrypted === true) {
        return props.KmsKeyId ? 'kms' : 'aws-managed';
      }
      return 'none';
    } catch {
      return 'unknown';
    }
  }
}
