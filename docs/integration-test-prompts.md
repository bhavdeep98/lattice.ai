# AWS Infrastructure Integration Test Prompts

This document contains real-world AWS infrastructure scenarios based on common job requirements for AWS Infrastructure Engineers. These prompts can be used to test the Lattice AI interface demo and validate various architecture patterns.

## 🏢 Enterprise Web Applications

### E-commerce Platform

```
Create a scalable e-commerce platform with:
- Frontend hosted on CloudFront and S3
- API Gateway with Lambda functions for product catalog, cart, and checkout
- RDS PostgreSQL for product data and user accounts
- ElastiCache Redis for session management
- SQS for order processing queue
- SNS for order notifications
- Auto-scaling based on traffic patterns
```

### Multi-tenant SaaS Application

```
Build a multi-tenant SaaS application infrastructure with:
- Application Load Balancer with SSL termination
- ECS Fargate containers for the application tier
- RDS Aurora with read replicas for tenant data isolation
- ElastiCache for application caching
- S3 for file uploads and static assets
- CloudWatch for monitoring and alerting
- WAF for security protection
```

### Corporate Intranet Portal

```
Design a corporate intranet portal with:
- VPC with private and public subnets across 3 AZs
- EC2 instances in Auto Scaling Groups
- Application Load Balancer with health checks
- RDS MySQL Multi-AZ for employee data
- EFS for shared file storage
- Active Directory integration via AWS Directory Service
- VPN Gateway for remote access
```

## 📊 Data & Analytics Platforms

### Real-time Analytics Pipeline

```
Create a real-time analytics pipeline for processing user events:
- Kinesis Data Streams for event ingestion
- Kinesis Analytics for real-time processing
- Lambda functions for data transformation
- S3 data lake with partitioning by date
- Redshift for data warehousing
- QuickSight for business intelligence dashboards
- Glue for ETL jobs and data catalog
```

### IoT Data Processing Platform

```
Build an IoT data processing platform with:
- IoT Core for device connectivity
- Kinesis Data Firehose for data delivery
- S3 for raw data storage with lifecycle policies
- Lambda for data processing and alerts
- DynamoDB for device metadata
- CloudWatch for monitoring device health
- SNS for critical alerts
```

### Machine Learning Pipeline

```
Design a machine learning pipeline infrastructure:
- S3 for training data and model artifacts
- SageMaker for model training and deployment
- Lambda for data preprocessing
- Step Functions for workflow orchestration
- ECR for custom ML container images
- API Gateway for model inference endpoints
- CloudWatch for model performance monitoring
```

## 🔒 Security & Compliance

### HIPAA Compliant Healthcare Platform

```
Create a HIPAA compliant healthcare platform with:
- VPC with strict network segmentation
- EC2 instances with encrypted EBS volumes
- RDS with encryption at rest and in transit
- S3 with server-side encryption and access logging
- CloudTrail for audit logging
- Config for compliance monitoring
- KMS for key management
- WAF and Shield for DDoS protection
```

### Financial Services Infrastructure

```
Build a PCI DSS compliant financial services platform:
- Multi-AZ VPC with DMZ, application, and database tiers
- EC2 instances with hardened AMIs
- RDS with automated backups and point-in-time recovery
- ElastiCache with encryption in transit
- CloudHSM for cryptographic operations
- GuardDuty for threat detection
- Inspector for vulnerability assessments
```

### Government Cloud Infrastructure

```
Design a FedRAMP compliant government cloud infrastructure:
- GovCloud VPC with strict access controls
- EC2 instances with FIPS 140-2 compliance
- RDS with automated patching and monitoring
- S3 with MFA delete and versioning
- CloudTrail with log file validation
- Config rules for compliance automation
- Systems Manager for patch management
```

## 🚀 DevOps & CI/CD

### Microservices Platform

```
Create a microservices platform with:
- EKS cluster with managed node groups
- Application Load Balancer with path-based routing
- ECR for container image registry
- RDS Aurora Serverless for database per service
- ElastiCache for distributed caching
- X-Ray for distributed tracing
- CloudWatch Container Insights for monitoring
```

### CI/CD Pipeline Infrastructure

```
Build a comprehensive CI/CD pipeline with:
- CodeCommit for source control
- CodeBuild for compilation and testing
- CodeDeploy for automated deployments
- CodePipeline for workflow orchestration
- S3 for artifact storage
- CloudFormation for infrastructure as code
- Parameter Store for configuration management
```

### Blue-Green Deployment Platform

```
Design a blue-green deployment platform:
- Route 53 for DNS-based traffic switching
- Application Load Balancer with target groups
- ECS with blue and green service definitions
- RDS with read replicas for database switching
- CloudWatch alarms for automated rollback
- Lambda for deployment automation
- SNS for deployment notifications
```

## 🌐 Content & Media

### Video Streaming Platform

```
Create a video streaming platform with:
- CloudFront for global content delivery
- S3 for video storage with intelligent tiering
- MediaConvert for video transcoding
- MediaPackage for video packaging
- API Gateway for content management APIs
- Lambda for video processing workflows
- DynamoDB for metadata and user preferences
```

### Content Management System

```
Build a scalable CMS infrastructure:
- CloudFront with custom origins
- S3 for static asset storage
- EC2 with Auto Scaling for dynamic content
- RDS for content database
- ElastiSearch for content search
- Lambda for image processing
- CloudWatch for performance monitoring
```

### Global News Website

```
Design a global news website infrastructure:
- Multi-region deployment with Route 53 latency routing
- CloudFront with edge locations worldwide
- S3 for article storage and images
- ElastiCache for article caching
- RDS with cross-region read replicas
- Lambda@Edge for content personalization
- CloudWatch for real-time metrics
```

## 🏭 Enterprise Integration

### Hybrid Cloud Architecture

```
Create a hybrid cloud architecture with:
- Direct Connect for dedicated network connection
- VPN Gateway for backup connectivity
- Transit Gateway for multi-VPC connectivity
- Storage Gateway for hybrid storage
- DataSync for data transfer
- Systems Manager for hybrid management
- CloudWatch for unified monitoring
```

### Legacy System Migration

```
Design a legacy system migration platform:
- Application Migration Service for server migration
- Database Migration Service for data migration
- DataSync for file system migration
- Lambda for data transformation
- S3 for migration staging
- CloudFormation for infrastructure provisioning
- CloudWatch for migration monitoring
```

### API Integration Platform

```
Build an API integration platform with:
- API Gateway with custom authorizers
- Lambda functions for API orchestration
- SQS for asynchronous processing
- DynamoDB for API metadata
- ElastiCache for API response caching
- CloudWatch for API monitoring
- X-Ray for API tracing
```

## 💰 Cost Optimization Scenarios

### Development Environment Automation

```
Create cost-optimized development environments:
- EC2 Spot Instances with Auto Scaling
- Lambda for environment start/stop automation
- CloudWatch Events for scheduling
- S3 for development data with lifecycle policies
- RDS with automated start/stop
- Cost Explorer integration for budget alerts
- Trusted Advisor for cost recommendations
```

### Multi-Environment Cost Management

```
Design a multi-environment cost management system:
- Separate AWS accounts for dev/staging/prod
- Organizations for consolidated billing
- Cost allocation tags for resource tracking
- Budgets with automated alerts
- Lambda for cost optimization automation
- CloudWatch for cost monitoring
- Reserved Instance recommendations
```

## 🔧 Operational Excellence

### Disaster Recovery Platform

```
Create a comprehensive disaster recovery solution:
- Multi-region architecture with automated failover
- RDS with cross-region automated backups
- S3 with cross-region replication
- Route 53 health checks for failover
- Lambda for DR automation
- CloudFormation for infrastructure recreation
- Systems Manager for runbook automation
```

### Monitoring and Alerting System

```
Build a comprehensive monitoring system:
- CloudWatch for metrics and logs
- X-Ray for application tracing
- GuardDuty for security monitoring
- Config for compliance monitoring
- SNS for alert notifications
- Lambda for custom metrics
- QuickSight for operational dashboards
```

### Backup and Archive Solution

```
Design an enterprise backup and archive solution:
- S3 with multiple storage classes
- Glacier for long-term archival
- AWS Backup for centralized backup management
- Lambda for backup automation
- DynamoDB for backup metadata
- CloudWatch for backup monitoring
- SNS for backup notifications
```

## 🎯 Industry-Specific Solutions

### Gaming Platform Infrastructure

```
Create a gaming platform with:
- GameLift for game server hosting
- DynamoDB for player data and leaderboards
- ElastiCache for session management
- CloudFront for game asset delivery
- Kinesis for real-time game analytics
- Lambda for game logic processing
- API Gateway for game APIs
```

### EdTech Learning Platform

```
Build an educational technology platform:
- CloudFront for global content delivery
- S3 for course materials and videos
- RDS for student and course data
- ElastiCache for session management
- Lambda for assessment processing
- SES for email notifications
- CloudWatch for platform monitoring
```

### Healthcare Data Platform

```
Design a healthcare data platform with:
- S3 with HIPAA compliance for medical records
- RDS with encryption for patient data
- Lambda for data processing and analytics
- API Gateway with OAuth for secure access
- CloudTrail for audit logging
- KMS for encryption key management
- GuardDuty for threat detection
```

## 🧪 Testing Scenarios

### Load Testing Infrastructure

```
Create a load testing infrastructure:
- EC2 instances for load generation
- Application Load Balancer for traffic distribution
- CloudWatch for performance monitoring
- Lambda for test automation
- S3 for test results storage
- SNS for test completion notifications
- Auto Scaling for dynamic load adjustment
```

### Chaos Engineering Platform

```
Build a chaos engineering platform:
- Lambda for fault injection
- Systems Manager for infrastructure manipulation
- CloudWatch for impact monitoring
- SNS for incident notifications
- S3 for experiment results
- Step Functions for experiment orchestration
- API Gateway for experiment control
```

## 📝 Usage Instructions

1. **Copy any prompt** from the sections above
2. **Paste into the AI interface demo** at the website
3. **Submit the prompt** to see the generated CloudFormation template
4. **Analyze the response** for completeness and accuracy
5. **Test variations** by modifying requirements

## 🎯 Testing Objectives

Each prompt tests different aspects of the AI system:

- **Resource Selection**: Does it choose appropriate AWS services?
- **Security**: Are security best practices included?
- **Scalability**: Does it include auto-scaling and load balancing?
- **Monitoring**: Are CloudWatch alarms and dashboards included?
- **Cost Optimization**: Are cost-effective configurations used?
- **Compliance**: Are regulatory requirements addressed?
- **Integration**: Do services work together properly?

## 📊 Expected Outcomes

For each prompt, the AI should generate:

1. **Complete CloudFormation template** with all necessary resources
2. **Security configurations** including encryption and access controls
3. **Monitoring setup** with CloudWatch alarms and dashboards
4. **Scalability features** like Auto Scaling and load balancing
5. **Best practices** following AWS Well-Architected Framework
6. **Cost considerations** with appropriate instance sizes and storage classes

## 🔄 Continuous Improvement

Use these prompts to:

- **Validate new features** as they're added to the system
- **Test edge cases** and complex scenarios
- **Benchmark performance** of the AI generation
- **Identify gaps** in the knowledge base
- **Improve response quality** through iterative testing

---

_This document serves as a comprehensive test suite for validating AWS infrastructure generation capabilities across various real-world scenarios commonly encountered by AWS Infrastructure Engineers._
