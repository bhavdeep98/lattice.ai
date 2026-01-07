import { Stack, StackProps, RemovalPolicy, CfnOutput, Duration, Size } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';

export interface LatticeWebsiteStackProps extends StackProps {
  domainName?: string;
  certificateArn?: string;
}

export class LatticeWebsiteStack extends Stack {
  public readonly distribution: cloudfront.Distribution;
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: LatticeWebsiteStackProps) {
    super(scope, id, props);

    // S3 Bucket for website content
    this.bucket = new s3.Bucket(this, 'LatticeWebsiteBucket', {
      bucketName: `lattice-website-${this.account}-${this.region}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true, // Enable versioning for rollbacks
    });

    // Origin Access Control for CloudFront
    const originAccessControl = new cloudfront.S3OriginAccessControl(this, 'OAC', {
      description: 'Lattice Website Origin Access Control',
    });

    // CloudFront Distribution Configuration
    let distributionProps: cloudfront.DistributionProps = {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket, {
          originAccessControl,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      },
      additionalBehaviors: {
        // Cache API responses for shorter time
        '/api/*': {
          origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket, {
            originAccessControl,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, // Don't cache API responses
          compress: true,
        },
        // Cache static assets longer
        '*.js': {
          origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket, {
            originAccessControl,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS,
          compress: true,
        },
        '*.css': {
          origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket, {
            originAccessControl,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS,
          compress: true,
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.minutes(5),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // US, Canada, Europe
      comment: 'Lattice AWS CDK Website - Production Distribution',
      enableIpv6: true,
    };

    // Add custom domain if provided
    if (props?.domainName && props?.certificateArn) {
      const certificate = acm.Certificate.fromCertificateArn(
        this,
        'Certificate',
        props.certificateArn
      );
      
      distributionProps = {
        ...distributionProps,
        domainNames: [props.domainName],
        certificate,
      };
    }

    // Create CloudFront Distribution
    this.distribution = new cloudfront.Distribution(this, 'LatticeDistribution', distributionProps);

    // Deploy website content
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('./website')],
      destinationBucket: this.bucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
      memoryLimit: 512, // Increase memory for faster deployments
      ephemeralStorageSize: Size.mebibytes(1024), // Increase storage for large assets
    });

    // Outputs
    new CfnOutput(this, 'WebsiteURL', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'Lattice Website URL',
      exportName: 'LatticeWebsiteURL',
    });

    new CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront Distribution ID',
      exportName: 'LatticeDistributionId',
    });

    new CfnOutput(this, 'S3BucketName', {
      value: this.bucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: 'LatticeS3Bucket',
    });

    if (props?.domainName) {
      new CfnOutput(this, 'CustomDomainURL', {
        value: `https://${props.domainName}`,
        description: 'Custom Domain URL',
        exportName: 'LatticeCustomDomainURL',
      });
    }
  }
}