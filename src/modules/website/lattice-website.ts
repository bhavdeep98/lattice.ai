import { Construct } from 'constructs';
import { RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { LatticeWebsiteProps, LatticeWebsiteConstruct } from './types';

/**
 * LatticeWebsite - Static Website Hosting abstraction
 * Automatically configures S3 (Private) + CloudFront (OAC) + Deployment
 */
export class LatticeWebsite extends Construct implements LatticeWebsiteConstruct {
    public readonly output: {
        bucketName: string;
        distributionId: string;
        domainName: string;
        websiteUrl: string;
    };

    constructor(scope: Construct, id: string, props: LatticeWebsiteProps) {
        super(scope, id);

        const {
            name,
            environment,
            sourcePath,
            domainName,
            errorPage = 'index.html',
        } = props;

        // 1. Create S3 Bucket (Private, Encrypted)
        const bucket = new s3.Bucket(this, 'WebsiteBucket', {
            bucketName: `${name}-${environment}-content`,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // Secure by default
            enforceSSL: true,
            removalPolicy: environment === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
            autoDeleteObjects: environment !== 'prod',
        });

        // 2. Create CloudFront Distribution
        const distribution = new cloudfront.Distribution(this, 'Distribution', {
            comment: `Lattice Website: ${name} (${environment})`,
            defaultBehavior: {
                origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                compress: true,
            },
            errorResponses: [
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: `/${errorPage}`,
                },
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: `/${errorPage}`,
                },
            ],
            // (Optional) Domain mapping would go here if domainName is provided
            // ignoring complex Route53 setup for simplicity in this iteration
        });

        // 3. Deploy Content
        new s3deploy.BucketDeployment(this, 'DeployContent', {
            sources: [s3deploy.Source.asset(sourcePath)],
            destinationBucket: bucket,
            distribution,
            distributionPaths: ['/*'], // Invalidate cache
        });

        // 4. Output
        this.output = {
            bucketName: bucket.bucketName,
            distributionId: distribution.distributionId,
            domainName: distribution.distributionDomainName,
            websiteUrl: `https://${distribution.distributionDomainName}`,
        };

        new CfnOutput(this, 'WebsiteUrl', { value: this.output.websiteUrl });
    }
}
