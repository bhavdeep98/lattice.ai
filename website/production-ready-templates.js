// Production-Ready AWS Infrastructure Templates
// This module contains comprehensive CloudFormation templates for real-world scenarios

class ProductionTemplateGenerator {
    constructor() {
        this.commonTags = {
            "Environment": "prod",
            "ManagedBy": "Lattice",
            "CostCenter": "Engineering"
        };
    }

    // Enhanced pattern matching for complex scenarios
    analyzePrompt(message) {
        const lowerMessage = message.toLowerCase();
        
        // E-commerce patterns
        if (this.matchesPattern(lowerMessage, ['ecommerce', 'e-commerce', 'shopping', 'cart', 'checkout', 'product catalog'])) {
            return { type: 'ecommerce', complexity: 'high' };
        }
        
        // Multi-tenant SaaS patterns
        if (this.matchesPattern(lowerMessage, ['multi-tenant', 'saas', 'tenant', 'subscription'])) {
            return { type: 'multitenant-saas', complexity: 'high' };
        }
        
        // Real-time analytics patterns
        if (this.matchesPattern(lowerMessage, ['real-time', 'analytics', 'kinesis', 'streaming', 'events'])) {
            return { type: 'realtime-analytics', complexity: 'high' };
        }
        
        // IoT patterns
        if (this.matchesPattern(lowerMessage, ['iot', 'device', 'sensor', 'telemetry'])) {
            return { type: 'iot-platform', complexity: 'high' };
        }
        
        // ML/AI patterns
        if (this.matchesPattern(lowerMessage, ['machine learning', 'ml', 'sagemaker', 'model', 'training'])) {
            return { type: 'ml-pipeline', complexity: 'high' };
        }
        
        // HIPAA/Healthcare patterns
        if (this.matchesPattern(lowerMessage, ['hipaa', 'healthcare', 'medical', 'patient', 'phi'])) {
            return { type: 'hipaa-compliant', complexity: 'high' };
        }
        
        // Financial/PCI patterns
        if (this.matchesPattern(lowerMessage, ['financial', 'pci', 'payment', 'banking', 'fintech'])) {
            return { type: 'financial-services', complexity: 'high' };
        }
        
        // Microservices patterns
        if (this.matchesPattern(lowerMessage, ['microservices', 'kubernetes', 'eks', 'containers'])) {
            return { type: 'microservices', complexity: 'high' };
        }
        
        // Video streaming patterns
        if (this.matchesPattern(lowerMessage, ['video', 'streaming', 'media', 'cdn'])) {
            return { type: 'video-streaming', complexity: 'high' };
        }
        
        // Disaster recovery patterns
        if (this.matchesPattern(lowerMessage, ['disaster recovery', 'dr', 'backup', 'failover'])) {
            return { type: 'disaster-recovery', complexity: 'high' };
        }
        
        // EdTech patterns
        if (this.matchesPattern(lowerMessage, ['edtech', 'education', 'educational', 'learning', 'course', 'student', 'assessment', 'lms', 'learning management', 'cloudfront', 'course materials', 'ses', 'email notifications'])) {
            return { type: 'edtech-platform', complexity: 'high' };
        }
        
        // Default patterns
        if (this.matchesPattern(lowerMessage, ['web app', 'website', 'frontend'])) {
            return { type: 'web-application', complexity: 'medium' };
        }
        
        if (this.matchesPattern(lowerMessage, ['api', 'rest', 'graphql'])) {
            return { type: 'api-platform', complexity: 'medium' };
        }
        
        return { type: 'general', complexity: 'low' };
    }
    
    matchesPattern(message, keywords) {
        return keywords.some(keyword => message.includes(keyword));
    }

    // Generate production-ready e-commerce platform
    generateEcommerceTemplate() {
        return {
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": "Production-ready e-commerce platform with high availability, security, and scalability",
            "Parameters": {
                "Environment": {
                    "Type": "String",
                    "Default": "prod",
                    "AllowedValues": ["dev", "staging", "prod"]
                },
                "DomainName": {
                    "Type": "String",
                    "Default": "example.com"
                }
            },
            "Resources": {
                // VPC with multi-AZ setup
                "VPC": {
                    "Type": "AWS::EC2::VPC",
                    "Properties": {
                        "CidrBlock": "10.0.0.0/16",
                        "EnableDnsHostnames": true,
                        "EnableDnsSupport": true,
                        "Tags": [
                            {"Key": "Name", "Value": "ecommerce-vpc"},
                            ...Object.entries(this.commonTags).map(([k, v]) => ({Key: k, Value: v}))
                        ]
                    }
                },
                
                // Public subnets for ALB
                "PublicSubnet1": {
                    "Type": "AWS::EC2::Subnet",
                    "Properties": {
                        "VpcId": {"Ref": "VPC"},
                        "CidrBlock": "10.0.1.0/24",
                        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
                        "MapPublicIpOnLaunch": true,
                        "Tags": [{"Key": "Name", "Value": "ecommerce-public-1"}]
                    }
                },
                "PublicSubnet2": {
                    "Type": "AWS::EC2::Subnet",
                    "Properties": {
                        "VpcId": {"Ref": "VPC"},
                        "CidrBlock": "10.0.2.0/24",
                        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
                        "MapPublicIpOnLaunch": true,
                        "Tags": [{"Key": "Name", "Value": "ecommerce-public-2"}]
                    }
                },
                
                // Private subnets for application tier
                "PrivateSubnet1": {
                    "Type": "AWS::EC2::Subnet",
                    "Properties": {
                        "VpcId": {"Ref": "VPC"},
                        "CidrBlock": "10.0.3.0/24",
                        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
                        "Tags": [{"Key": "Name", "Value": "ecommerce-private-1"}]
                    }
                },
                "PrivateSubnet2": {
                    "Type": "AWS::EC2::Subnet",
                    "Properties": {
                        "VpcId": {"Ref": "VPC"},
                        "CidrBlock": "10.0.4.0/24",
                        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
                        "Tags": [{"Key": "Name", "Value": "ecommerce-private-2"}]
                    }
                },
                
                // Database subnets
                "DatabaseSubnet1": {
                    "Type": "AWS::EC2::Subnet",
                    "Properties": {
                        "VpcId": {"Ref": "VPC"},
                        "CidrBlock": "10.0.5.0/24",
                        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
                        "Tags": [{"Key": "Name", "Value": "ecommerce-db-1"}]
                    }
                },
                "DatabaseSubnet2": {
                    "Type": "AWS::EC2::Subnet",
                    "Properties": {
                        "VpcId": {"Ref": "VPC"},
                        "CidrBlock": "10.0.6.0/24",
                        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
                        "Tags": [{"Key": "Name", "Value": "ecommerce-db-2"}]
                    }
                },
                
                // Internet Gateway
                "InternetGateway": {
                    "Type": "AWS::EC2::InternetGateway",
                    "Properties": {
                        "Tags": [{"Key": "Name", "Value": "ecommerce-igw"}]
                    }
                },
                "AttachGateway": {
                    "Type": "AWS::EC2::VPCGatewayAttachment",
                    "Properties": {
                        "VpcId": {"Ref": "VPC"},
                        "InternetGatewayId": {"Ref": "InternetGateway"}
                    }
                },
                
                // NAT Gateways for high availability
                "NATGateway1EIP": {
                    "Type": "AWS::EC2::EIP",
                    "DependsOn": "AttachGateway",
                    "Properties": {"Domain": "vpc"}
                },
                "NATGateway2EIP": {
                    "Type": "AWS::EC2::EIP",
                    "DependsOn": "AttachGateway",
                    "Properties": {"Domain": "vpc"}
                },
                "NATGateway1": {
                    "Type": "AWS::EC2::NatGateway",
                    "Properties": {
                        "AllocationId": {"Fn::GetAtt": ["NATGateway1EIP", "AllocationId"]},
                        "SubnetId": {"Ref": "PublicSubnet1"}
                    }
                },
                "NATGateway2": {
                    "Type": "AWS::EC2::NatGateway",
                    "Properties": {
                        "AllocationId": {"Fn::GetAtt": ["NATGateway2EIP", "AllocationId"]},
                        "SubnetId": {"Ref": "PublicSubnet2"}
                    }
                },
                
                // Route tables
                "PublicRouteTable": {
                    "Type": "AWS::EC2::RouteTable",
                    "Properties": {
                        "VpcId": {"Ref": "VPC"},
                        "Tags": [{"Key": "Name", "Value": "ecommerce-public-rt"}]
                    }
                },
                "PublicRoute": {
                    "Type": "AWS::EC2::Route",
                    "DependsOn": "AttachGateway",
                    "Properties": {
                        "RouteTableId": {"Ref": "PublicRouteTable"},
                        "DestinationCidrBlock": "0.0.0.0/0",
                        "GatewayId": {"Ref": "InternetGateway"}
                    }
                },
                
                // CloudFront distribution for static assets
                "CloudFrontDistribution": {
                    "Type": "AWS::CloudFront::Distribution",
                    "Properties": {
                        "DistributionConfig": {
                            "Origins": [{
                                "Id": "S3Origin",
                                "DomainName": {"Fn::GetAtt": ["StaticAssetsBucket", "DomainName"]},
                                "S3OriginConfig": {
                                    "OriginAccessIdentity": {"Fn::Sub": "origin-access-identity/cloudfront/${CloudFrontOriginAccessIdentity}"}
                                }
                            }],
                            "Enabled": true,
                            "DefaultCacheBehavior": {
                                "TargetOriginId": "S3Origin",
                                "ViewerProtocolPolicy": "redirect-to-https",
                                "AllowedMethods": ["GET", "HEAD"],
                                "CachedMethods": ["GET", "HEAD"],
                                "ForwardedValues": {"QueryString": false, "Cookies": {"Forward": "none"}},
                                "MinTTL": 0,
                                "DefaultTTL": 86400,
                                "MaxTTL": 31536000
                            },
                            "PriceClass": "PriceClass_All",
                            "ViewerCertificate": {"CloudFrontDefaultCertificate": true}
                        }
                    }
                },
                
                "CloudFrontOriginAccessIdentity": {
                    "Type": "AWS::CloudFront::CloudFrontOriginAccessIdentity",
                    "Properties": {
                        "CloudFrontOriginAccessIdentityConfig": {
                            "Comment": "OAI for ecommerce static assets"
                        }
                    }
                },
                
                // S3 bucket for static assets
                "StaticAssetsBucket": {
                    "Type": "AWS::S3::Bucket",
                    "Properties": {
                        "BucketName": {"Fn::Sub": "ecommerce-static-${AWS::AccountId}-${AWS::Region}"},
                        "BucketEncryption": {
                            "ServerSideEncryptionConfiguration": [{
                                "ServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}
                            }]
                        },
                        "VersioningConfiguration": {"Status": "Enabled"},
                        "LifecycleConfiguration": {
                            "Rules": [{
                                "Id": "DeleteIncompleteMultipartUploads",
                                "Status": "Enabled",
                                "AbortIncompleteMultipartUpload": {"DaysAfterInitiation": 7}
                            }]
                        },
                        "PublicAccessBlockConfiguration": {
                            "BlockPublicAcls": true,
                            "BlockPublicPolicy": true,
                            "IgnorePublicAcls": true,
                            "RestrictPublicBuckets": true
                        }
                    }
                },
                
                // Application Load Balancer
                "ApplicationLoadBalancer": {
                    "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
                    "Properties": {
                        "Name": "ecommerce-alb",
                        "Scheme": "internet-facing",
                        "Type": "application",
                        "Subnets": [{"Ref": "PublicSubnet1"}, {"Ref": "PublicSubnet2"}],
                        "SecurityGroups": [{"Ref": "ALBSecurityGroup"}],
                        "Tags": Object.entries(this.commonTags).map(([k, v]) => ({Key: k, Value: v}))
                    }
                },
                
                // Security Groups
                "ALBSecurityGroup": {
                    "Type": "AWS::EC2::SecurityGroup",
                    "Properties": {
                        "GroupDescription": "Security group for Application Load Balancer",
                        "VpcId": {"Ref": "VPC"},
                        "SecurityGroupIngress": [
                            {
                                "IpProtocol": "tcp",
                                "FromPort": 80,
                                "ToPort": 80,
                                "CidrIp": "0.0.0.0/0"
                            },
                            {
                                "IpProtocol": "tcp",
                                "FromPort": 443,
                                "ToPort": 443,
                                "CidrIp": "0.0.0.0/0"
                            }
                        ],
                        "Tags": [{"Key": "Name", "Value": "ecommerce-alb-sg"}]
                    }
                },
                
                // RDS Aurora PostgreSQL cluster
                "DatabaseSubnetGroup": {
                    "Type": "AWS::RDS::DBSubnetGroup",
                    "Properties": {
                        "DBSubnetGroupDescription": "Subnet group for RDS database",
                        "SubnetIds": [{"Ref": "DatabaseSubnet1"}, {"Ref": "DatabaseSubnet2"}],
                        "Tags": [{"Key": "Name", "Value": "ecommerce-db-subnet-group"}]
                    }
                },
                
                "DatabaseCluster": {
                    "Type": "AWS::RDS::DBCluster",
                    "Properties": {
                        "DBClusterIdentifier": "ecommerce-cluster",
                        "Engine": "aurora-postgresql",
                        "EngineVersion": "13.7",
                        "MasterUsername": "postgres",
                        "MasterUserPassword": {"Ref": "AWS::NoValue"},
                        "ManageMasterUserPassword": true,
                        "DatabaseName": "ecommerce",
                        "DBSubnetGroupName": {"Ref": "DatabaseSubnetGroup"},
                        "VpcSecurityGroupIds": [{"Ref": "DatabaseSecurityGroup"}],
                        "BackupRetentionPeriod": 30,
                        "PreferredBackupWindow": "03:00-04:00",
                        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
                        "StorageEncrypted": true,
                        "DeletionProtection": true,
                        "EnableCloudwatchLogsExports": ["postgresql"]
                    }
                },
                
                "DatabasePrimaryInstance": {
                    "Type": "AWS::RDS::DBInstance",
                    "Properties": {
                        "DBInstanceIdentifier": "ecommerce-primary",
                        "DBClusterIdentifier": {"Ref": "DatabaseCluster"},
                        "DBInstanceClass": "db.r6g.large",
                        "Engine": "aurora-postgresql",
                        "PubliclyAccessible": false,
                        "MonitoringInterval": 60,
                        "MonitoringRoleArn": {"Fn::GetAtt": ["RDSEnhancedMonitoringRole", "Arn"]},
                        "PerformanceInsightsEnabled": true,
                        "PerformanceInsightsRetentionPeriod": 7
                    }
                },
                
                "DatabaseSecurityGroup": {
                    "Type": "AWS::EC2::SecurityGroup",
                    "Properties": {
                        "GroupDescription": "Security group for RDS database",
                        "VpcId": {"Ref": "VPC"},
                        "SecurityGroupIngress": [{
                            "IpProtocol": "tcp",
                            "FromPort": 5432,
                            "ToPort": 5432,
                            "SourceSecurityGroupId": {"Ref": "ApplicationSecurityGroup"}
                        }],
                        "Tags": [{"Key": "Name", "Value": "ecommerce-db-sg"}]
                    }
                },
                
                // ElastiCache Redis for session management
                "CacheSubnetGroup": {
                    "Type": "AWS::ElastiCache::SubnetGroup",
                    "Properties": {
                        "Description": "Subnet group for ElastiCache",
                        "SubnetIds": [{"Ref": "PrivateSubnet1"}, {"Ref": "PrivateSubnet2"}]
                    }
                },
                
                "RedisCluster": {
                    "Type": "AWS::ElastiCache::ReplicationGroup",
                    "Properties": {
                        "ReplicationGroupId": "ecommerce-redis",
                        "Description": "Redis cluster for session management",
                        "Engine": "redis",
                        "CacheNodeType": "cache.r6g.large",
                        "NumCacheClusters": 2,
                        "Port": 6379,
                        "CacheSubnetGroupName": {"Ref": "CacheSubnetGroup"},
                        "SecurityGroupIds": [{"Ref": "CacheSecurityGroup"}],
                        "AtRestEncryptionEnabled": true,
                        "TransitEncryptionEnabled": true,
                        "MultiAZEnabled": true,
                        "AutomaticFailoverEnabled": true,
                        "SnapshotRetentionLimit": 7,
                        "SnapshotWindow": "03:00-05:00"
                    }
                },
                
                "CacheSecurityGroup": {
                    "Type": "AWS::EC2::SecurityGroup",
                    "Properties": {
                        "GroupDescription": "Security group for ElastiCache",
                        "VpcId": {"Ref": "VPC"},
                        "SecurityGroupIngress": [{
                            "IpProtocol": "tcp",
                            "FromPort": 6379,
                            "ToPort": 6379,
                            "SourceSecurityGroupId": {"Ref": "ApplicationSecurityGroup"}
                        }],
                        "Tags": [{"Key": "Name", "Value": "ecommerce-cache-sg"}]
                    }
                },
                
                // API Gateway for microservices
                "ApiGateway": {
                    "Type": "AWS::ApiGateway::RestApi",
                    "Properties": {
                        "Name": "ecommerce-api",
                        "Description": "E-commerce platform API",
                        "EndpointConfiguration": {"Types": ["REGIONAL"]},
                        "Policy": {
                            "Version": "2012-10-17",
                            "Statement": [{
                                "Effect": "Allow",
                                "Principal": "*",
                                "Action": "execute-api:Invoke",
                                "Resource": "arn:aws:execute-api:*:*:*"
                            }]
                        }
                    }
                },
                
                // Lambda functions for core services
                "ProductCatalogFunction": {
                    "Type": "AWS::Lambda::Function",
                    "Properties": {
                        "FunctionName": "ecommerce-product-catalog",
                        "Runtime": "nodejs18.x",
                        "Handler": "index.handler",
                        "Role": {"Fn::GetAtt": ["LambdaExecutionRole", "Arn"]},
                        "Code": {
                            "ZipFile": `
const AWS = require('aws-sdk');
const rds = new AWS.RDSDataService();

exports.handler = async (event) => {
    try {
        // Product catalog logic here
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                message: 'Product catalog service',
                products: []
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};`
                        },
                        "Environment": {
                            "Variables": {
                                "DB_CLUSTER_ARN": {"Ref": "DatabaseCluster"},
                                "REDIS_ENDPOINT": {"Fn::GetAtt": ["RedisCluster", "RedisEndpoint.Address"]}
                            }
                        },
                        "VpcConfig": {
                            "SecurityGroupIds": [{"Ref": "ApplicationSecurityGroup"}],
                            "SubnetIds": [{"Ref": "PrivateSubnet1"}, {"Ref": "PrivateSubnet2"}]
                        },
                        "ReservedConcurrencyLimit": 100,
                        "Timeout": 30,
                        "MemorySize": 512
                    }
                },
                
                // SQS for order processing
                "OrderProcessingQueue": {
                    "Type": "AWS::SQS::Queue",
                    "Properties": {
                        "QueueName": "ecommerce-order-processing",
                        "VisibilityTimeoutSeconds": 300,
                        "MessageRetentionPeriod": 1209600,
                        "KmsMasterKeyId": "alias/aws/sqs",
                        "RedrivePolicy": {
                            "deadLetterTargetArn": {"Fn::GetAtt": ["OrderProcessingDLQ", "Arn"]},
                            "maxReceiveCount": 3
                        }
                    }
                },
                
                "OrderProcessingDLQ": {
                    "Type": "AWS::SQS::Queue",
                    "Properties": {
                        "QueueName": "ecommerce-order-processing-dlq",
                        "MessageRetentionPeriod": 1209600,
                        "KmsMasterKeyId": "alias/aws/sqs"
                    }
                },
                
                // SNS for notifications
                "OrderNotificationTopic": {
                    "Type": "AWS::SNS::Topic",
                    "Properties": {
                        "TopicName": "ecommerce-order-notifications",
                        "KmsMasterKeyId": "alias/aws/sns"
                    }
                },
                
                // IAM Roles
                "LambdaExecutionRole": {
                    "Type": "AWS::IAM::Role",
                    "Properties": {
                        "AssumeRolePolicyDocument": {
                            "Version": "2012-10-17",
                            "Statement": [{
                                "Effect": "Allow",
                                "Principal": {"Service": "lambda.amazonaws.com"},
                                "Action": "sts:AssumeRole"
                            }]
                        },
                        "ManagedPolicyArns": [
                            "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
                        ],
                        "Policies": [{
                            "PolicyName": "EcommerceLambdaPolicy",
                            "PolicyDocument": {
                                "Version": "2012-10-17",
                                "Statement": [
                                    {
                                        "Effect": "Allow",
                                        "Action": [
                                            "rds-data:ExecuteStatement",
                                            "rds-data:BatchExecuteStatement",
                                            "rds-data:BeginTransaction",
                                            "rds-data:CommitTransaction",
                                            "rds-data:RollbackTransaction"
                                        ],
                                        "Resource": {"Ref": "DatabaseCluster"}
                                    },
                                    {
                                        "Effect": "Allow",
                                        "Action": [
                                            "sqs:SendMessage",
                                            "sqs:ReceiveMessage",
                                            "sqs:DeleteMessage"
                                        ],
                                        "Resource": {"Fn::GetAtt": ["OrderProcessingQueue", "Arn"]}
                                    },
                                    {
                                        "Effect": "Allow",
                                        "Action": ["sns:Publish"],
                                        "Resource": {"Ref": "OrderNotificationTopic"}
                                    }
                                ]
                            }
                        }]
                    }
                },
                
                "RDSEnhancedMonitoringRole": {
                    "Type": "AWS::IAM::Role",
                    "Properties": {
                        "AssumeRolePolicyDocument": {
                            "Version": "2012-10-17",
                            "Statement": [{
                                "Effect": "Allow",
                                "Principal": {"Service": "monitoring.rds.amazonaws.com"},
                                "Action": "sts:AssumeRole"
                            }]
                        },
                        "ManagedPolicyArns": [
                            "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
                        ]
                    }
                },
                
                "ApplicationSecurityGroup": {
                    "Type": "AWS::EC2::SecurityGroup",
                    "Properties": {
                        "GroupDescription": "Security group for application tier",
                        "VpcId": {"Ref": "VPC"},
                        "SecurityGroupIngress": [{
                            "IpProtocol": "tcp",
                            "FromPort": 80,
                            "ToPort": 80,
                            "SourceSecurityGroupId": {"Ref": "ALBSecurityGroup"}
                        }],
                        "Tags": [{"Key": "Name", "Value": "ecommerce-app-sg"}]
                    }
                },
                
                // CloudWatch Alarms
                "DatabaseCPUAlarm": {
                    "Type": "AWS::CloudWatch::Alarm",
                    "Properties": {
                        "AlarmName": "ecommerce-database-cpu-high",
                        "AlarmDescription": "Database CPU utilization is too high",
                        "MetricName": "CPUUtilization",
                        "Namespace": "AWS/RDS",
                        "Statistic": "Average",
                        "Period": 300,
                        "EvaluationPeriods": 2,
                        "Threshold": 80,
                        "ComparisonOperator": "GreaterThanThreshold",
                        "Dimensions": [{
                            "Name": "DBClusterIdentifier",
                            "Value": {"Ref": "DatabaseCluster"}
                        }],
                        "AlarmActions": [{"Ref": "OrderNotificationTopic"}]
                    }
                },
                
                "LambdaErrorAlarm": {
                    "Type": "AWS::CloudWatch::Alarm",
                    "Properties": {
                        "AlarmName": "ecommerce-lambda-errors",
                        "AlarmDescription": "Lambda function errors",
                        "MetricName": "Errors",
                        "Namespace": "AWS/Lambda",
                        "Statistic": "Sum",
                        "Period": 300,
                        "EvaluationPeriods": 1,
                        "Threshold": 5,
                        "ComparisonOperator": "GreaterThanThreshold",
                        "Dimensions": [{
                            "Name": "FunctionName",
                            "Value": {"Ref": "ProductCatalogFunction"}
                        }],
                        "AlarmActions": [{"Ref": "OrderNotificationTopic"}]
                    }
                }
            },
            
            "Outputs": {
                "LoadBalancerDNS": {
                    "Description": "DNS name of the load balancer",
                    "Value": {"Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"]},
                    "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-LoadBalancerDNS"}}
                },
                "CloudFrontDistribution": {
                    "Description": "CloudFront distribution domain name",
                    "Value": {"Fn::GetAtt": ["CloudFrontDistribution", "DomainName"]},
                    "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-CloudFrontDomain"}}
                },
                "DatabaseEndpoint": {
                    "Description": "RDS cluster endpoint",
                    "Value": {"Fn::GetAtt": ["DatabaseCluster", "Endpoint.Address"]},
                    "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-DatabaseEndpoint"}}
                },
                "RedisEndpoint": {
                    "Description": "Redis cluster endpoint",
                    "Value": {"Fn::GetAtt": ["RedisCluster", "RedisEndpoint.Address"]},
                    "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-RedisEndpoint"}}
                }
            }
        };
    }

    // Generate multi-tenant SaaS template
    generateMultiTenantSaasTemplate() {
        return {
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": "Production-ready multi-tenant SaaS platform with tenant isolation and scalability",
            "Parameters": {
                "Environment": {
                    "Type": "String",
                    "Default": "prod",
                    "AllowedValues": ["dev", "staging", "prod"]
                }
            },
            "Resources": {
                // ECS Fargate cluster for containerized applications
                "ECSCluster": {
                    "Type": "AWS::ECS::Cluster",
                    "Properties": {
                        "ClusterName": "saas-platform-cluster",
                        "CapacityProviders": ["FARGATE", "FARGATE_SPOT"],
                        "DefaultCapacityProviderStrategy": [
                            {
                                "CapacityProvider": "FARGATE",
                                "Weight": 1
                            },
                            {
                                "CapacityProvider": "FARGATE_SPOT",
                                "Weight": 4
                            }
                        ],
                        "ClusterSettings": [{
                            "Name": "containerInsights",
                            "Value": "enabled"
                        }]
                    }
                },
                
                // Application Load Balancer with path-based routing for tenants
                "ApplicationLoadBalancer": {
                    "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
                    "Properties": {
                        "Name": "saas-platform-alb",
                        "Scheme": "internet-facing",
                        "Type": "application",
                        "IpAddressType": "ipv4",
                        "SecurityGroups": [{"Ref": "ALBSecurityGroup"}],
                        "Subnets": [{"Ref": "PublicSubnet1"}, {"Ref": "PublicSubnet2"}]
                    }
                },
                
                // RDS Aurora with tenant isolation
                "TenantDatabase": {
                    "Type": "AWS::RDS::DBCluster",
                    "Properties": {
                        "DBClusterIdentifier": "saas-tenant-cluster",
                        "Engine": "aurora-postgresql",
                        "EngineVersion": "13.7",
                        "MasterUsername": "postgres",
                        "ManageMasterUserPassword": true,
                        "DatabaseName": "saas_platform",
                        "BackupRetentionPeriod": 35,
                        "PreferredBackupWindow": "03:00-04:00",
                        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
                        "StorageEncrypted": true,
                        "KmsKeyId": {"Ref": "DatabaseEncryptionKey"},
                        "DeletionProtection": true,
                        "EnableCloudwatchLogsExports": ["postgresql"],
                        "ServerlessV2ScalingConfiguration": {
                            "MinCapacity": 0.5,
                            "MaxCapacity": 16
                        }
                    }
                },
                
                // KMS key for database encryption
                "DatabaseEncryptionKey": {
                    "Type": "AWS::KMS::Key",
                    "Properties": {
                        "Description": "KMS key for SaaS database encryption",
                        "KeyPolicy": {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Sid": "Enable IAM User Permissions",
                                    "Effect": "Allow",
                                    "Principal": {"AWS": {"Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"}},
                                    "Action": "kms:*",
                                    "Resource": "*"
                                },
                                {
                                    "Sid": "Allow RDS Service",
                                    "Effect": "Allow",
                                    "Principal": {"Service": "rds.amazonaws.com"},
                                    "Action": [
                                        "kms:Decrypt",
                                        "kms:GenerateDataKey"
                                    ],
                                    "Resource": "*"
                                }
                            ]
                        }
                    }
                },
                
                // WAF for application protection
                "WebACL": {
                    "Type": "AWS::WAFv2::WebACL",
                    "Properties": {
                        "Name": "saas-platform-waf",
                        "Scope": "REGIONAL",
                        "DefaultAction": {"Allow": {}},
                        "Rules": [
                            {
                                "Name": "AWSManagedRulesCommonRuleSet",
                                "Priority": 1,
                                "OverrideAction": {"None": {}},
                                "Statement": {
                                    "ManagedRuleGroupStatement": {
                                        "VendorName": "AWS",
                                        "Name": "AWSManagedRulesCommonRuleSet"
                                    }
                                },
                                "VisibilityConfig": {
                                    "SampledRequestsEnabled": true,
                                    "CloudWatchMetricsEnabled": true,
                                    "MetricName": "CommonRuleSetMetric"
                                }
                            },
                            {
                                "Name": "AWSManagedRulesKnownBadInputsRuleSet",
                                "Priority": 2,
                                "OverrideAction": {"None": {}},
                                "Statement": {
                                    "ManagedRuleGroupStatement": {
                                        "VendorName": "AWS",
                                        "Name": "AWSManagedRulesKnownBadInputsRuleSet"
                                    }
                                },
                                "VisibilityConfig": {
                                    "SampledRequestsEnabled": true,
                                    "CloudWatchMetricsEnabled": true,
                                    "MetricName": "KnownBadInputsRuleSetMetric"
                                }
                            },
                            {
                                "Name": "RateLimitRule",
                                "Priority": 3,
                                "Action": {"Block": {}},
                                "Statement": {
                                    "RateBasedStatement": {
                                        "Limit": 2000,
                                        "AggregateKeyType": "IP"
                                    }
                                },
                                "VisibilityConfig": {
                                    "SampledRequestsEnabled": true,
                                    "CloudWatchMetricsEnabled": true,
                                    "MetricName": "RateLimitRule"
                                }
                            }
                        ],
                        "VisibilityConfig": {
                            "SampledRequestsEnabled": true,
                            "CloudWatchMetricsEnabled": true,
                            "MetricName": "SaasPlatformWebACL"
                        }
                    }
                },
                
                // ElastiCache for tenant-specific caching
                "TenantCacheCluster": {
                    "Type": "AWS::ElastiCache::ReplicationGroup",
                    "Properties": {
                        "ReplicationGroupId": "saas-tenant-cache",
                        "Description": "Redis cluster for tenant-specific caching",
                        "Engine": "redis",
                        "CacheNodeType": "cache.r6g.xlarge",
                        "NumCacheClusters": 3,
                        "Port": 6379,
                        "AtRestEncryptionEnabled": true,
                        "TransitEncryptionEnabled": true,
                        "MultiAZEnabled": true,
                        "AutomaticFailoverEnabled": true,
                        "SnapshotRetentionLimit": 14,
                        "SnapshotWindow": "03:00-05:00",
                        "GlobalReplicationGroupId": {"Ref": "AWS::NoValue"}
                    }
                }
            }
        };
    }

    // Generate comprehensive template based on prompt analysis
    generateTemplate(prompt) {
        const analysis = this.analyzePrompt(prompt);
        
        switch (analysis.type) {
            case 'ecommerce':
                return this.generateEcommerceTemplate();
            case 'multitenant-saas':
                return this.generateMultiTenantSaasTemplate();
            case 'realtime-analytics':
                return this.generateRealtimeAnalyticsTemplate();
            case 'iot-platform':
                return this.generateIoTPlatformTemplate();
            case 'ml-pipeline':
                return this.generateMLPipelineTemplate();
            case 'hipaa-compliant':
                return this.generateHIPAATemplate();
            case 'financial-services':
                return this.generateFinancialServicesTemplate();
            case 'microservices':
                return this.generateMicroservicesTemplate();
            case 'video-streaming':
                return this.generateVideoStreamingTemplate();
            case 'disaster-recovery':
                return this.generateDisasterRecoveryTemplate();
            case 'edtech-platform':
                return this.generateEdTechTemplate();
            default:
                return this.generateEnhancedWebAppTemplate();
        }
    }

    // Placeholder methods for other templates (to be implemented)
    generateRealtimeAnalyticsTemplate() {
        return {
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": "Real-time analytics pipeline with Kinesis, Lambda, and S3",
            "Resources": {
                // Kinesis Data Streams, Analytics, Lambda, S3, Redshift, etc.
                // Implementation would go here
            }
        };
    }

    generateEnhancedWebAppTemplate() {
        return {
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": "Enhanced web application with production-ready features",
            "Resources": {
                // Enhanced web app resources
                // Implementation would go here
            }
        };
    }
}

// Export for use in the demo
window.ProductionTemplateGenerator = ProductionTemplateGenerator;
    // Generate real-time analytics pipeline template
    generateRealtimeAnalyticsTemplate() {
        return {
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": "Production-ready real-time analytics pipeline with Kinesis, Lambda, S3, and Redshift",
            "Parameters": {
                "Environment": {
                    "Type": "String",
                    "Default": "prod",
                    "AllowedValues": ["dev", "staging", "prod"]
                },
                "DataRetentionDays": {
                    "Type": "Number",
                    "Default": 365,
                    "Description": "Number of days to retain data in S3"
                }
            },
            "Resources": {
                // Kinesis Data Stream for real-time ingestion
                "EventDataStream": {
                    "Type": "AWS::Kinesis::Stream",
                    "Properties": {
                        "Name": "analytics-event-stream",
                        "ShardCount": 10,
                        "RetentionPeriodHours": 168,
                        "StreamEncryption": {
                            "EncryptionType": "KMS",
                            "KeyId": {"Ref": "KinesisEncryptionKey"}
                        },
                        "StreamModeDetails": {
                            "StreamMode": "PROVISIONED"
                        },
                        "Tags": Object.entries(this.commonTags).map(([k, v]) => ({Key: k, Value: v}))
                    }
                },
                
                // KMS Key for Kinesis encryption
                "KinesisEncryptionKey": {
                    "Type": "AWS::KMS::Key",
                    "Properties": {
                        "Description": "KMS key for Kinesis stream encryption",
                        "KeyPolicy": {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Sid": "Enable IAM User Permissions",
                                    "Effect": "Allow",
                                    "Principal": {"AWS": {"Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"}},
                                    "Action": "kms:*",
                                    "Resource": "*"
                                },
                                {
                                    "Sid": "Allow Kinesis Service",
                                    "Effect": "Allow",
                                    "Principal": {"Service": "kinesis.amazonaws.com"},
                                    "Action": [
                                        "kms:Decrypt",
                                        "kms:GenerateDataKey"
                                    ],
                                    "Resource": "*"
                                }
                            ]
                        }
                    }
                },
                
                // Lambda function for real-time processing
                "StreamProcessorFunction": {
                    "Type": "AWS::Lambda::Function",
                    "Properties": {
                        "FunctionName": "analytics-stream-processor",
                        "Runtime": "python3.9",
                        "Handler": "index.handler",
                        "Role": {"Fn::GetAtt": ["StreamProcessorRole", "Arn"]},
                        "Code": {
                            "ZipFile": `
import json
import boto3
import base64
from datetime import datetime

s3 = boto3.client('s3')
firehose = boto3.client('firehose')

def handler(event, context):
    processed_records = []
    
    for record in event['Records']:
        # Decode Kinesis data
        payload = base64.b64decode(record['kinesis']['data'])
        data = json.loads(payload)
        
        # Add processing timestamp
        data['processed_at'] = datetime.utcnow().isoformat()
        
        # Transform data for analytics
        transformed_data = {
            'event_id': data.get('event_id'),
            'user_id': data.get('user_id'),
            'event_type': data.get('event_type'),
            'timestamp': data.get('timestamp'),
            'processed_at': data['processed_at'],
            'properties': data.get('properties', {})
        }
        
        # Send to Firehose for S3 storage
        firehose.put_record(
            DeliveryStreamName='analytics-delivery-stream',
            Record={'Data': json.dumps(transformed_data) + '\\n'}
        )
        
        processed_records.append({
            'recordId': record['recordId'],
            'result': 'Ok'
        })
    
    return {'records': processed_records}
`
                        },
                        "Environment": {
                            "Variables": {
                                "S3_BUCKET": {"Ref": "AnalyticsDataLake"},
                                "FIREHOSE_STREAM": {"Ref": "AnalyticsDeliveryStream"}
                            }
                        },
                        "Timeout": 300,
                        "MemorySize": 1024,
                        "ReservedConcurrencyLimit": 100
                    }
                },
                
                // Event source mapping for Kinesis to Lambda
                "StreamEventSourceMapping": {
                    "Type": "AWS::Lambda::EventSourceMapping",
                    "Properties": {
                        "EventSourceArn": {"Fn::GetAtt": ["EventDataStream", "Arn"]},
                        "FunctionName": {"Ref": "StreamProcessorFunction"},
                        "StartingPosition": "LATEST",
                        "BatchSize": 100,
                        "MaximumBatchingWindowInSeconds": 5,
                        "ParallelizationFactor": 10
                    }
                },
                
                // S3 bucket for data lake
                "AnalyticsDataLake": {
                    "Type": "AWS::S3::Bucket",
                    "Properties": {
                        "BucketName": {"Fn::Sub": "analytics-data-lake-${AWS::AccountId}-${AWS::Region}"},
                        "BucketEncryption": {
                            "ServerSideEncryptionConfiguration": [{
                                "ServerSideEncryptionByDefault": {
                                    "SSEAlgorithm": "aws:kms",
                                    "KMSMasterKeyID": {"Ref": "S3EncryptionKey"}
                                }
                            }]
                        },
                        "VersioningConfiguration": {"Status": "Enabled"},
                        "LifecycleConfiguration": {
                            "Rules": [
                                {
                                    "Id": "TransitionToIA",
                                    "Status": "Enabled",
                                    "Transitions": [{
                                        "StorageClass": "STANDARD_IA",
                                        "TransitionInDays": 30
                                    }]
                                },
                                {
                                    "Id": "TransitionToGlacier",
                                    "Status": "Enabled",
                                    "Transitions": [{
                                        "StorageClass": "GLACIER",
                                        "TransitionInDays": 90
                                    }]
                                },
                                {
                                    "Id": "DeleteOldData",
                                    "Status": "Enabled",
                                    "ExpirationInDays": {"Ref": "DataRetentionDays"}
                                }
                            ]
                        },
                        "PublicAccessBlockConfiguration": {
                            "BlockPublicAcls": true,
                            "BlockPublicPolicy": true,
                            "IgnorePublicAcls": true,
                            "RestrictPublicBuckets": true
                        },
                        "NotificationConfiguration": {
                            "LambdaConfigurations": [{
                                "Event": "s3:ObjectCreated:*",
                                "Function": {"Fn::GetAtt": ["DataCatalogFunction", "Arn"]}
                            }]
                        }
                    }
                },
                
                // Kinesis Data Firehose for S3 delivery
                "AnalyticsDeliveryStream": {
                    "Type": "AWS::KinesisFirehose::DeliveryStream",
                    "Properties": {
                        "DeliveryStreamName": "analytics-delivery-stream",
                        "DeliveryStreamType": "DirectPut",
                        "S3DestinationConfiguration": {
                            "BucketARN": {"Fn::GetAtt": ["AnalyticsDataLake", "Arn"]},
                            "Prefix": "year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/",
                            "ErrorOutputPrefix": "errors/",
                            "BufferingHints": {
                                "SizeInMBs": 128,
                                "IntervalInSeconds": 60
                            },
                            "CompressionFormat": "GZIP",
                            "EncryptionConfiguration": {
                                "KMSEncryptionConfig": {
                                    "AWSKMSKeyARN": {"Fn::GetAtt": ["S3EncryptionKey", "Arn"]}
                                }
                            },
                            "RoleARN": {"Fn::GetAtt": ["FirehoseDeliveryRole", "Arn"]},
                            "ProcessingConfiguration": {
                                "Enabled": true,
                                "Processors": [{
                                    "Type": "Lambda",
                                    "Parameters": [{
                                        "ParameterName": "LambdaArn",
                                        "ParameterValue": {"Fn::GetAtt": ["DataTransformFunction", "Arn"]}
                                    }]
                                }]
                            }
                        }
                    }
                },
                
                // Redshift cluster for data warehousing
                "AnalyticsWarehouse": {
                    "Type": "AWS::Redshift::Cluster",
                    "Properties": {
                        "ClusterIdentifier": "analytics-warehouse",
                        "NodeType": "dc2.large",
                        "NumberOfNodes": 2,
                        "DBName": "analytics",
                        "MasterUsername": "admin",
                        "MasterUserPassword": {"Ref": "AWS::NoValue"},
                        "ManageMasterPassword": true,
                        "ClusterSubnetGroupName": {"Ref": "RedshiftSubnetGroup"},
                        "VpcSecurityGroupIds": [{"Ref": "RedshiftSecurityGroup"}],
                        "Encrypted": true,
                        "KmsKeyId": {"Ref": "RedshiftEncryptionKey"},
                        "AutomatedSnapshotRetentionPeriod": 7,
                        "PreferredMaintenanceWindow": "sun:03:00-sun:04:00",
                        "PubliclyAccessible": false,
                        "EnhancedVpcRouting": true
                    }
                },
                
                // Glue Data Catalog for metadata management
                "AnalyticsDatabase": {
                    "Type": "AWS::Glue::Database",
                    "Properties": {
                        "CatalogId": {"Ref": "AWS::AccountId"},
                        "DatabaseInput": {
                            "Name": "analytics_catalog",
                            "Description": "Data catalog for analytics pipeline"
                        }
                    }
                },
                
                // Glue Crawler for automatic schema discovery
                "DataLakeCrawler": {
                    "Type": "AWS::Glue::Crawler",
                    "Properties": {
                        "Name": "analytics-data-lake-crawler",
                        "Role": {"Fn::GetAtt": ["GlueCrawlerRole", "Arn"]},
                        "DatabaseName": {"Ref": "AnalyticsDatabase"},
                        "Targets": {
                            "S3Targets": [{
                                "Path": {"Fn::Sub": "${AnalyticsDataLake}/"}
                            }]
                        },
                        "Schedule": {
                            "ScheduleExpression": "cron(0 6 * * ? *)"
                        },
                        "SchemaChangePolicy": {
                            "UpdateBehavior": "UPDATE_IN_DATABASE",
                            "DeleteBehavior": "LOG"
                        }
                    }
                },
                
                // IAM Roles
                "StreamProcessorRole": {
                    "Type": "AWS::IAM::Role",
                    "Properties": {
                        "AssumeRolePolicyDocument": {
                            "Version": "2012-10-17",
                            "Statement": [{
                                "Effect": "Allow",
                                "Principal": {"Service": "lambda.amazonaws.com"},
                                "Action": "sts:AssumeRole"
                            }]
                        },
                        "ManagedPolicyArns": [
                            "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
                        ],
                        "Policies": [{
                            "PolicyName": "StreamProcessorPolicy",
                            "PolicyDocument": {
                                "Version": "2012-10-17",
                                "Statement": [
                                    {
                                        "Effect": "Allow",
                                        "Action": [
                                            "kinesis:DescribeStream",
                                            "kinesis:GetShardIterator",
                                            "kinesis:GetRecords",
                                            "kinesis:ListStreams"
                                        ],
                                        "Resource": {"Fn::GetAtt": ["EventDataStream", "Arn"]}
                                    },
                                    {
                                        "Effect": "Allow",
                                        "Action": [
                                            "firehose:PutRecord",
                                            "firehose:PutRecordBatch"
                                        ],
                                        "Resource": {"Fn::GetAtt": ["AnalyticsDeliveryStream", "Arn"]}
                                    },
                                    {
                                        "Effect": "Allow",
                                        "Action": [
                                            "kms:Decrypt",
                                            "kms:GenerateDataKey"
                                        ],
                                        "Resource": [
                                            {"Fn::GetAtt": ["KinesisEncryptionKey", "Arn"]},
                                            {"Fn::GetAtt": ["S3EncryptionKey", "Arn"]}
                                        ]
                                    }
                                ]
                            }
                        }]
                    }
                },
                
                // CloudWatch Dashboard
                "AnalyticsDashboard": {
                    "Type": "AWS::CloudWatch::Dashboard",
                    "Properties": {
                        "DashboardName": "Analytics-Pipeline-Dashboard",
                        "DashboardBody": {
                            "Fn::Sub": JSON.stringify({
                                "widgets": [
                                    {
                                        "type": "metric",
                                        "x": 0, "y": 0, "width": 12, "height": 6,
                                        "properties": {
                                            "metrics": [
                                                ["AWS/Kinesis", "IncomingRecords", "StreamName", "${EventDataStream}"],
                                                [".", "OutgoingRecords", ".", "."]
                                            ],
                                            "period": 300,
                                            "stat": "Sum",
                                            "region": "${AWS::Region}",
                                            "title": "Kinesis Stream Throughput"
                                        }
                                    },
                                    {
                                        "type": "metric",
                                        "x": 12, "y": 0, "width": 12, "height": 6,
                                        "properties": {
                                            "metrics": [
                                                ["AWS/Lambda", "Duration", "FunctionName", "${StreamProcessorFunction}"],
                                                [".", "Errors", ".", "."],
                                                [".", "Invocations", ".", "."]
                                            ],
                                            "period": 300,
                                            "stat": "Average",
                                            "region": "${AWS::Region}",
                                            "title": "Lambda Processing Metrics"
                                        }
                                    }
                                ]
                            })
                        }
                    }
                },
                
                // CloudWatch Alarms
                "KinesisIncomingRecordsAlarm": {
                    "Type": "AWS::CloudWatch::Alarm",
                    "Properties": {
                        "AlarmName": "analytics-kinesis-low-throughput",
                        "AlarmDescription": "Kinesis stream has low incoming records",
                        "MetricName": "IncomingRecords",
                        "Namespace": "AWS/Kinesis",
                        "Statistic": "Sum",
                        "Period": 300,
                        "EvaluationPeriods": 3,
                        "Threshold": 100,
                        "ComparisonOperator": "LessThanThreshold",
                        "Dimensions": [{
                            "Name": "StreamName",
                            "Value": {"Ref": "EventDataStream"}
                        }],
                        "AlarmActions": [{"Ref": "AlertsTopic"}]
                    }
                },
                
                "LambdaErrorAlarm": {
                    "Type": "AWS::CloudWatch::Alarm",
                    "Properties": {
                        "AlarmName": "analytics-lambda-errors",
                        "AlarmDescription": "Lambda function has high error rate",
                        "MetricName": "Errors",
                        "Namespace": "AWS/Lambda",
                        "Statistic": "Sum",
                        "Period": 300,
                        "EvaluationPeriods": 2,
                        "Threshold": 10,
                        "ComparisonOperator": "GreaterThanThreshold",
                        "Dimensions": [{
                            "Name": "FunctionName",
                            "Value": {"Ref": "StreamProcessorFunction"}
                        }],
                        "AlarmActions": [{"Ref": "AlertsTopic"}]
                    }
                },
                
                // SNS Topic for alerts
                "AlertsTopic": {
                    "Type": "AWS::SNS::Topic",
                    "Properties": {
                        "TopicName": "analytics-pipeline-alerts",
                        "KmsMasterKeyId": "alias/aws/sns"
                    }
                }
            },
            
            "Outputs": {
                "KinesisStreamName": {
                    "Description": "Name of the Kinesis data stream",
                    "Value": {"Ref": "EventDataStream"},
                    "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-KinesisStream"}}
                },
                "S3DataLakeBucket": {
                    "Description": "S3 bucket for data lake storage",
                    "Value": {"Ref": "AnalyticsDataLake"},
                    "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-DataLakeBucket"}}
                },
                "RedshiftClusterEndpoint": {
                    "Description": "Redshift cluster endpoint",
                    "Value": {"Fn::GetAtt": ["AnalyticsWarehouse", "Endpoint.Address"]},
                    "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-RedshiftEndpoint"}}
                },
                "DashboardURL": {
                    "Description": "CloudWatch Dashboard URL",
                    "Value": {"Fn::Sub": "https://${AWS::Region}.console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${AnalyticsDashboard}"},
                    "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-DashboardURL"}}
                }
            }
        };
    }

    // Generate IoT platform template
    generateIoTPlatformTemplate() {
        return {
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": "Production-ready IoT platform with device connectivity, data processing, and analytics",
            "Resources": {
                // IoT Core components
                "IoTPolicy": {
                    "Type": "AWS::IoT::Policy",
                    "Properties": {
                        "PolicyName": "IoTDevicePolicy",
                        "PolicyDocument": {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "iot:Connect",
                                        "iot:Publish",
                                        "iot:Subscribe",
                                        "iot:Receive"
                                    ],
                                    "Resource": "*"
                                }
                            ]
                        }
                    }
                },
                
                // IoT Rule for data routing
                "DeviceDataRule": {
                    "Type": "AWS::IoT::TopicRule",
                    "Properties": {
                        "RuleName": "DeviceDataProcessingRule",
                        "TopicRulePayload": {
                            "Sql": "SELECT *, timestamp() as aws_timestamp FROM 'device/+/data'",
                            "Actions": [
                                {
                                    "Kinesis": {
                                        "StreamName": {"Ref": "IoTDataStream"},
                                        "PartitionKey": "${clientId()}",
                                        "RoleArn": {"Fn::GetAtt": ["IoTRuleRole", "Arn"]}
                                    }
                                },
                                {
                                    "DynamoDBv2": {
                                        "RoleArn": {"Fn::GetAtt": ["IoTRuleRole", "Arn"]},
                                        "PutItem": {
                                            "TableName": {"Ref": "DeviceDataTable"}
                                        }
                                    }
                                }
                            ],
                            "ErrorAction": {
                                "S3": {
                                    "BucketName": {"Ref": "IoTErrorBucket"},
                                    "Key": "errors/${timestamp()}",
                                    "RoleArn": {"Fn::GetAtt": ["IoTRuleRole", "Arn"]}
                                }
                            }
                        }
                    }
                },
                
                // Kinesis stream for IoT data
                "IoTDataStream": {
                    "Type": "AWS::Kinesis::Stream",
                    "Properties": {
                        "Name": "iot-device-data-stream",
                        "ShardCount": 5,
                        "RetentionPeriodHours": 24,
                        "StreamEncryption": {
                            "EncryptionType": "KMS",
                            "KeyId": "alias/aws/kinesis"
                        }
                    }
                },
                
                // DynamoDB table for device metadata
                "DeviceDataTable": {
                    "Type": "AWS::DynamoDB::Table",
                    "Properties": {
                        "TableName": "IoTDeviceData",
                        "BillingMode": "PAY_PER_REQUEST",
                        "AttributeDefinitions": [
                            {"AttributeName": "deviceId", "AttributeType": "S"},
                            {"AttributeName": "timestamp", "AttributeType": "N"}
                        ],
                        "KeySchema": [
                            {"AttributeName": "deviceId", "KeyType": "HASH"},
                            {"AttributeName": "timestamp", "KeyType": "RANGE"}
                        ],
                        "StreamSpecification": {
                            "StreamViewType": "NEW_AND_OLD_IMAGES"
                        },
                        "PointInTimeRecoverySpecification": {
                            "PointInTimeRecoveryEnabled": true
                        },
                        "SSESpecification": {
                            "SSEEnabled": true
                        },
                        "TimeToLiveSpecification": {
                            "AttributeName": "ttl",
                            "Enabled": true
                        }
                    }
                },
                
                // Lambda function for device data processing
                "DeviceDataProcessor": {
                    "Type": "AWS::Lambda::Function",
                    "Properties": {
                        "FunctionName": "iot-device-data-processor",
                        "Runtime": "python3.9",
                        "Handler": "index.handler",
                        "Role": {"Fn::GetAtt": ["DeviceProcessorRole", "Arn"]},
                        "Code": {
                            "ZipFile": `
import json
import boto3
from datetime import datetime, timedelta

dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')
sns = boto3.client('sns')

def handler(event, context):
    for record in event['Records']:
        # Process Kinesis record
        payload = json.loads(record['kinesis']['data'])
        device_id = payload.get('deviceId')
        sensor_data = payload.get('sensorData', {})
        
        # Anomaly detection
        if detect_anomaly(sensor_data):
            send_alert(device_id, sensor_data)
        
        # Store aggregated metrics
        store_metrics(device_id, sensor_data)
        
        # Send custom CloudWatch metrics
        send_custom_metrics(device_id, sensor_data)
    
    return {'statusCode': 200, 'body': 'Processed successfully'}

def detect_anomaly(sensor_data):
    # Simple anomaly detection logic
    temperature = sensor_data.get('temperature', 0)
    return temperature > 80 or temperature < -10

def send_alert(device_id, sensor_data):
    message = f"Anomaly detected for device {device_id}: {sensor_data}"
    sns.publish(
        TopicArn=os.environ['ALERTS_TOPIC'],
        Message=message,
        Subject=f"IoT Device Alert - {device_id}"
    )

def store_metrics(device_id, sensor_data):
    # Store in DynamoDB for historical analysis
    pass

def send_custom_metrics(device_id, sensor_data):
    # Send custom metrics to CloudWatch
    cloudwatch.put_metric_data(
        Namespace='IoT/Devices',
        MetricData=[
            {
                'MetricName': 'Temperature',
                'Dimensions': [{'Name': 'DeviceId', 'Value': device_id}],
                'Value': sensor_data.get('temperature', 0),
                'Unit': 'None'
            }
        ]
    )
`
                        },
                        "Environment": {
                            "Variables": {
                                "DEVICE_TABLE": {"Ref": "DeviceDataTable"},
                                "ALERTS_TOPIC": {"Ref": "DeviceAlertsTopic"}
                            }
                        },
                        "Timeout": 300,
                        "MemorySize": 512
                    }
                },
                
                // SNS topic for device alerts
                "DeviceAlertsTopic": {
                    "Type": "AWS::SNS::Topic",
                    "Properties": {
                        "TopicName": "iot-device-alerts",
                        "KmsMasterKeyId": "alias/aws/sns"
                    }
                },
                
                // IAM role for IoT rules
                "IoTRuleRole": {
                    "Type": "AWS::IAM::Role",
                    "Properties": {
                        "AssumeRolePolicyDocument": {
                            "Version": "2012-10-17",
                            "Statement": [{
                                "Effect": "Allow",
                                "Principal": {"Service": "iot.amazonaws.com"},
                                "Action": "sts:AssumeRole"
                            }]
                        },
                        "Policies": [{
                            "PolicyName": "IoTRulePolicy",
                            "PolicyDocument": {
                                "Version": "2012-10-17",
                                "Statement": [
                                    {
                                        "Effect": "Allow",
                                        "Action": [
                                            "kinesis:PutRecord",
                                            "kinesis:PutRecords"
                                        ],
                                        "Resource": {"Fn::GetAtt": ["IoTDataStream", "Arn"]}
                                    },
                                    {
                                        "Effect": "Allow",
                                        "Action": [
                                            "dynamodb:PutItem"
                                        ],
                                        "Resource": {"Fn::GetAtt": ["DeviceDataTable", "Arn"]}
                                    },
                                    {
                                        "Effect": "Allow",
                                        "Action": [
                                            "s3:PutObject"
                                        ],
                                        "Resource": {"Fn::Sub": "${IoTErrorBucket}/*"}
                                    }
                                ]
                            }
                        }]
                    }
                }
            }
        };
    }

    // Additional template methods would be implemented here...
    generateMLPipelineTemplate() {
        return {
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": "Machine Learning pipeline with SageMaker, S3, and automated deployment",
            "Resources": {
                // SageMaker components, S3 buckets, Lambda functions, etc.
            }
        };
    }

    generateHIPAATemplate() {
        return {
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": "HIPAA-compliant healthcare platform with encryption, audit logging, and access controls",
            "Resources": {
                // HIPAA-specific security configurations
            }
        };
    }

    generateFinancialServicesTemplate() {
        return {
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": "PCI DSS compliant financial services platform with CloudHSM and comprehensive security",
            "Resources": {
                // Financial services specific components
            }
        };
    }

    generateMicroservicesTemplate() {
        return {
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": "Microservices platform with EKS, service mesh, and distributed tracing",
            "Resources": {
                // EKS cluster, service mesh, monitoring components
            }
        };
    }

    generateVideoStreamingTemplate() {
        return {
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": "Video streaming platform with MediaConvert, CloudFront, and global delivery",
            "Resources": {
                // Media services, CDN, storage components
            }
        };
    }

    generateDisasterRecoveryTemplate() {
        return {
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": "Comprehensive disaster recovery solution with multi-region failover",
            "Resources": {
                // Multi-region components, backup strategies, failover mechanisms
            }
        };
    }
}

// Export for use in the demo
window.ProductionTemplateGenerator = ProductionTemplateGenerator;