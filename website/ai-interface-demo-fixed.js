// AI Chatbot Demo functionality - Fixed Version
document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chatMessages');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const typingIndicator = document.getElementById('typingIndicator');

    // Check if all elements exist
    if (!chatMessages || !chatForm || !chatInput || !sendBtn || !typingIndicator) {
        console.error('Missing required elements');
        return;
    }

    // Auto-resize textarea
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    // Handle form submission
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (message) {
            sendMessage(message);
            chatInput.value = '';
            chatInput.style.height = 'auto';
        }
    });

    // Handle Enter key (but allow Shift+Enter for new lines)
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });

    function sendMessage(message) {
        // Add user message
        addMessage(message, 'user');
        
        // Disable input while processing
        chatInput.disabled = true;
        sendBtn.disabled = true;
        
        // Show typing indicator
        showTypingIndicator();
        
        // Simulate AI processing and generate response
        setTimeout(() => {
            hideTypingIndicator();
            generateAIResponse(message);
            
            // Re-enable input
            chatInput.disabled = false;
            sendBtn.disabled = false;
            chatInput.focus();
        }, 2000 + Math.random() * 2000); // Random delay between 2-4 seconds
    }

    function addMessage(content, sender) {
        // Clear welcome message on first user message
        if (sender === 'user') {
            const welcomeMessage = chatMessages.querySelector('.welcome-message');
            if (welcomeMessage) {
                welcomeMessage.remove();
            }
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = sender === 'ai' ? '🤖' : '👤';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (sender === 'ai' && content.includes('```')) {
            // Handle code blocks
            messageContent.innerHTML = formatAIResponse(content);
        } else {
            messageContent.textContent = content;
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function formatAIResponse(content) {
        // First handle markdown headers
        content = content.replace(/^## (.*$)/gm, '<h3 class="ai-section-header">$1</h3>');
        content = content.replace(/^### (.*$)/gm, '<h4 class="ai-subsection-header">$1</h4>');
        
        // Handle bold text
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Handle checkmarks and emojis in lists
        content = content.replace(/^✅ \*\*(.*?)\*\*: (.*$)/gm, '<div class="guardrail-item">✅ <strong>$1</strong>: $2</div>');
        content = content.replace(/^🚀 \*\*(.*?)\*\*: (.*$)/gm, '<div class="deployment-note">🚀 <strong>$1</strong>: $2</div>');
        
        // Handle module descriptions
        content = content.replace(/^\*\*(🌐|🗄️|🔐|🗃️|⚙️) (.*?)\*\*: (.*$)/gm, '<div class="module-description"><span class="module-icon">$1</span> <strong>$2</strong>: $3</div>');
        
        // Replace code blocks with proper formatting
        content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, lang, code) {
            const copyBtn = `<button class="copy-btn" onclick="copyCode(this)">Copy</button>`;
            return `<div class="code-block">${copyBtn}<pre><code>${escapeHtml(code.trim())}</code></pre></div>`;
        });
        
        // Convert line breaks to HTML
        content = content.replace(/\n/g, '<br>');
        
        return content;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showTypingIndicator() {
        typingIndicator.classList.add('active');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function hideTypingIndicator() {
        typingIndicator.classList.remove('active');
    }

    function generateAIResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        let response = '';
        let template = '';
        let features = [];
        let intent = {};

        // Enhanced analysis of user requirements
        if (lowerMessage.includes('healthcare') || lowerMessage.includes('health') || lowerMessage.includes('claims') || lowerMessage.includes('medical')) {
            response = "I'll create a HIPAA-compliant healthcare platform infrastructure. Let me show you how Lattice transforms your request:";
            template = generateHealthcareTemplate(userMessage);
            intent = {
                name: 'healthcare-platform',
                environment: 'prod',
                compliance: 'HIPAA',
                highAvailability: true,
                encryption: 'required',
                components: ['claims-processing', 'health-data', 'identity-management', 'reporting', 'integration']
            };
            features = [
                "HIPAA-compliant VPC with private subnets",
                "Encrypted databases and storage (AES-256)",
                "Identity and access management with MFA",
                "Secure API Gateway with WAF protection",
                "Claims processing workflows with Step Functions",
                "Health data analytics with encrypted data lakes",
                "Audit logging and compliance monitoring",
                "Backup and disaster recovery across regions"
            ];
        } else if (lowerMessage.includes('e-commerce') || lowerMessage.includes('ecommerce') || lowerMessage.includes('shopping') || lowerMessage.includes('payment')) {
            response = "I'll build a scalable e-commerce platform. Here's how Lattice processes your request:";
            template = generateEcommerceTemplate(userMessage);
            intent = {
                name: 'ecommerce-platform',
                environment: 'prod',
                highAvailability: true,
                components: ['web-frontend', 'payment-processing', 'inventory', 'analytics']
            };
            features = [
                "Auto-scaling web application infrastructure",
                "Secure payment processing integration",
                "Product catalog and inventory management",
                "Customer analytics and recommendation engine",
                "CDN for fast global content delivery",
                "Multi-region deployment for high availability"
            ];
        } else if ((lowerMessage.includes('web app') || lowerMessage.includes('website')) && !lowerMessage.includes('simple')) {
            response = "I'll create a comprehensive web application infrastructure. Let me show you the Lattice process:";
            template = generateWebAppTemplate(userMessage);
            intent = {
                name: extractAppName(userMessage) || 'webapp',
                environment: 'prod',
                highAvailability: true,
                components: ['frontend', 'api', 'database']
            };
            features = [
                "Secure VPC with public and private subnets",
                "Auto-scaling application servers",
                "Managed database with automated backups",
                "CDN for static content delivery",
                "Load balancing and health checks",
                "Comprehensive monitoring and alerting"
            ];
        } else if (lowerMessage.includes('api') || lowerMessage.includes('rest') || lowerMessage.includes('microservice')) {
            response = "Perfect! I'll generate a production-ready REST API infrastructure. Here's the Lattice workflow:";
            template = generateAPITemplate(userMessage);
            intent = {
                name: extractAppName(userMessage) || 'api',
                environment: 'prod',
                components: ['api-gateway', 'lambda', 'storage', 'monitoring']
            };
            features = [
                "Serverless Lambda functions for scalability",
                "API Gateway with rate limiting and caching",
                "Secure file storage with S3",
                "CloudWatch monitoring and custom dashboards",
                "Automated deployment pipeline",
                "Error tracking and performance monitoring"
            ];
        } else if (lowerMessage.includes('data') && (lowerMessage.includes('pipeline') || lowerMessage.includes('processing') || lowerMessage.includes('analytics'))) {
            response = "I'll create a robust data processing pipeline. Let me demonstrate the Lattice approach:";
            template = generateDataPipelineTemplate();
            intent = {
                name: 'data-pipeline',
                environment: 'prod',
                components: ['ingestion', 'processing', 'storage', 'analytics']
            };
            features = [
                "Scalable data ingestion with S3 and Kinesis",
                "Serverless data processing with Lambda",
                "Data warehouse with Redshift or Athena",
                "Real-time analytics and dashboards",
                "Data quality monitoring and validation",
                "Automated data lifecycle management"
            ];
        } else if (lowerMessage.includes('blog') || lowerMessage.includes('cms') || lowerMessage.includes('content')) {
            response = "Great! I'll set up a serverless blog platform. Here's how Lattice works:";
            template = generateBlogTemplate();
            intent = {
                name: 'blog-platform',
                environment: 'prod',
                components: ['cms', 'cdn', 'auth', 'analytics']
            };
            features = [
                "Serverless content management system",
                "Global CDN for fast content delivery",
                "User authentication and authorization",
                "Comment system with moderation",
                "Analytics and visitor tracking",
                "SEO optimization and social sharing"
            ];
        } else {
            response = "I'll create a flexible, general-purpose infrastructure. Let me show you the Lattice process:";
            template = generateGeneralTemplate();
            intent = {
                name: 'general-app',
                environment: 'prod',
                components: ['compute', 'storage', 'networking']
            };
            features = [
                "Secure VPC with configurable subnets",
                "Scalable compute resources",
                "Encrypted storage solutions",
                "Basic monitoring and logging",
                "Security groups and access controls",
                "Foundation for future expansion"
            ];
        }

        const featureList = features.map(feature => `• ${feature}`).join('\n');
        
        const fullResponse = `${response}

## Step 1: AI Intent Generation
First, I analyze your request and generate a simple JSON intent:

\`\`\`json
${JSON.stringify(intent, null, 2)}
\`\`\`

## Step 2: Lattice Framework Processing
The Lattice framework takes this intent and generates AWS CDK constructs through our 5 core modules:

**🌐 Network Module**: Creates secure VPC, subnets, and routing
**🗄️ Storage Module**: Sets up encrypted S3 buckets and databases  
**🔐 Identity Module**: Configures IAM roles and Cognito authentication
**🗃️ Database Module**: Provisions RDS instances with backups
**⚙️ Compute Module**: Deploys Lambda functions and EC2 instances

## Step 3: Guardrails Applied
Lattice Aspects automatically enforce security, cost controls, and compliance:

✅ **Security Aspect**: All resources encrypted, proper IAM policies
✅ **Cost Aspect**: Right-sized instances, lifecycle policies
✅ **Tagging Aspect**: Consistent resource organization
✅ **Compliance Aspect**: Industry-specific requirements (HIPAA, SOC2)

## Final CloudFormation Template

\`\`\`json
${template}
\`\`\`

## What You Get:
${featureList}

**🚀 Ready to Deploy**: This template is production-ready and can be deployed directly to AWS!`;
        
        addMessage(fullResponse, 'ai');
    }

    function generateHealthcareTemplate(userMessage) {
        const appName = extractAppName(userMessage) || 'healthcare-platform';
        
        return JSON.stringify({
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": "HIPAA-compliant healthcare platform infrastructure generated by Lattice AI",
            "Resources": {
                "VPC": {
                    "Type": "AWS::EC2::VPC",
                    "Properties": {
                        "CidrBlock": "10.0.0.0/16",
                        "EnableDnsHostnames": true,
                        "EnableDnsSupport": true,
                        "Tags": [{"Key": "Name", "Value": `${appName}-vpc`}, {"Key": "Compliance", "Value": "HIPAA"}]
                    }
                },
                "PrivateSubnet1": {
                    "Type": "AWS::EC2::Subnet",
                    "Properties": {
                        "VpcId": {"Ref": "VPC"},
                        "CidrBlock": "10.0.1.0/24",
                        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
                        "Tags": [{"Key": "Name", "Value": `${appName}-private-subnet-1`}]
                    }
                },
                "PrivateSubnet2": {
                    "Type": "AWS::EC2::Subnet",
                    "Properties": {
                        "VpcId": {"Ref": "VPC"},
                        "CidrBlock": "10.0.2.0/24",
                        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
                        "Tags": [{"Key": "Name", "Value": `${appName}-private-subnet-2`}]
                    }
                },
                "DatabaseSubnetGroup": {
                    "Type": "AWS::RDS::DBSubnetGroup",
                    "Properties": {
                        "DBSubnetGroupDescription": "Subnet group for healthcare database",
                        "SubnetIds": [{"Ref": "PrivateSubnet1"}, {"Ref": "PrivateSubnet2"}],
                        "Tags": [{"Key": "Name", "Value": `${appName}-db-subnet-group`}]
                    }
                },
                "DatabaseSecurityGroup": {
                    "Type": "AWS::EC2::SecurityGroup",
                    "Properties": {
                        "GroupDescription": "Security group for healthcare database",
                        "VpcId": {"Ref": "VPC"},
                        "SecurityGroupIngress": [{
                            "IpProtocol": "tcp",
                            "FromPort": 5432,
                            "ToPort": 5432,
                            "SourceSecurityGroupId": {"Ref": "LambdaSecurityGroup"}
                        }],
                        "Tags": [{"Key": "Name", "Value": `${appName}-db-sg`}]
                    }
                },
                "LambdaSecurityGroup": {
                    "Type": "AWS::EC2::SecurityGroup",
                    "Properties": {
                        "GroupDescription": "Security group for Lambda functions",
                        "VpcId": {"Ref": "VPC"},
                        "SecurityGroupEgress": [{
                            "IpProtocol": "-1",
                            "CidrIp": "0.0.0.0/0"
                        }],
                        "Tags": [{"Key": "Name", "Value": `${appName}-lambda-sg`}]
                    }
                },
                "HealthDataKMSKey": {
                    "Type": "AWS::KMS::Key",
                    "Properties": {
                        "Description": "KMS Key for healthcare data encryption",
                        "KeyPolicy": {
                            "Statement": [{
                                "Effect": "Allow",
                                "Principal": {"AWS": {"Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"}},
                                "Action": "kms:*",
                                "Resource": "*"
                            }]
                        },
                        "Tags": [{"Key": "Name", "Value": `${appName}-kms-key`}]
                    }
                },
                "HealthDataDatabase": {
                    "Type": "AWS::RDS::DBInstance",
                    "Properties": {
                        "DBInstanceClass": "db.r5.large",
                        "Engine": "postgres",
                        "AllocatedStorage": "100",
                        "StorageEncrypted": true,
                        "KmsKeyId": {"Ref": "HealthDataKMSKey"},
                        "VPCSecurityGroups": [{"Ref": "DatabaseSecurityGroup"}],
                        "DBSubnetGroupName": {"Ref": "DatabaseSubnetGroup"},
                        "BackupRetentionPeriod": 30,
                        "MultiAZ": true,
                        "DeletionProtection": true,
                        "Tags": [{"Key": "Name", "Value": `${appName}-database`}]
                    }
                },
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
                            "PolicyName": "HealthcareDataAccess",
                            "PolicyDocument": {
                                "Version": "2012-10-17",
                                "Statement": [{
                                    "Effect": "Allow",
                                    "Action": ["kms:Decrypt", "kms:Encrypt", "kms:GenerateDataKey"],
                                    "Resource": {"Fn::GetAtt": ["HealthDataKMSKey", "Arn"]}
                                }]
                            }
                        }]
                    }
                },
                "ClaimsProcessingFunction": {
                    "Type": "AWS::Lambda::Function",
                    "Properties": {
                        "Runtime": "python3.9",
                        "Handler": "claims.handler",
                        "Role": {"Fn::GetAtt": ["LambdaExecutionRole", "Arn"]},
                        "Code": {
                            "ZipFile": "import json\\ndef handler(event, context):\\n    # Claims processing logic\\n    return {'statusCode': 200, 'body': json.dumps({'message': 'Claim processed securely'})}"
                        },
                        "Environment": {
                            "Variables": {
                                "ENCRYPTION_KEY": {"Ref": "HealthDataKMSKey"}
                            }
                        },
                        "VpcConfig": {
                            "SecurityGroupIds": [{"Ref": "LambdaSecurityGroup"}],
                            "SubnetIds": [{"Ref": "PrivateSubnet1"}, {"Ref": "PrivateSubnet2"}]
                        },
                        "Tags": [{"Key": "Name", "Value": `${appName}-claims-function`}]
                    }
                },
                "StepFunctionRole": {
                    "Type": "AWS::IAM::Role",
                    "Properties": {
                        "AssumeRolePolicyDocument": {
                            "Version": "2012-10-17",
                            "Statement": [{
                                "Effect": "Allow",
                                "Principal": {"Service": "states.amazonaws.com"},
                                "Action": "sts:AssumeRole"
                            }]
                        },
                        "Policies": [{
                            "PolicyName": "LambdaInvokePolicy",
                            "PolicyDocument": {
                                "Version": "2012-10-17",
                                "Statement": [{
                                    "Effect": "Allow",
                                    "Action": "lambda:InvokeFunction",
                                    "Resource": {"Fn::GetAtt": ["ClaimsProcessingFunction", "Arn"]}
                                }]
                            }
                        }]
                    }
                },
                "IdentityProvider": {
                    "Type": "AWS::Cognito::UserPool",
                    "Properties": {
                        "UserPoolName": `${appName}-identity`,
                        "MfaConfiguration": "ON",
                        "Policies": {
                            "PasswordPolicy": {
                                "MinimumLength": 12,
                                "RequireUppercase": true,
                                "RequireLowercase": true,
                                "RequireNumbers": true,
                                "RequireSymbols": true
                            }
                        },
                        "Schema": [{
                            "Name": "email",
                            "Required": true,
                            "Mutable": false
                        }],
                        "UserPoolTags": {"Name": `${appName}-user-pool`}
                    }
                },
                "APIGateway": {
                    "Type": "AWS::ApiGateway::RestApi",
                    "Properties": {
                        "Name": `${appName}-api`,
                        "EndpointConfiguration": {
                            "Types": ["PRIVATE"]
                        },
                        "Policy": {
                            "Statement": [{
                                "Effect": "Allow",
                                "Principal": "*",
                                "Action": "execute-api:Invoke",
                                "Resource": "*",
                                "Condition": {
                                    "StringEquals": {
                                        "aws:sourceVpc": {"Ref": "VPC"}
                                    }
                                }
                            }]
                        },
                        "Tags": [{"Key": "Name", "Value": `${appName}-api`}]
                    }
                },
                "ReportingPipeline": {
                    "Type": "AWS::StepFunctions::StateMachine",
                    "Properties": {
                        "StateMachineName": `${appName}-reporting`,
                        "DefinitionString": JSON.stringify({
                            "Comment": "Healthcare reporting pipeline",
                            "StartAt": "ProcessHealthData",
                            "States": {
                                "ProcessHealthData": {
                                    "Type": "Task",
                                    "Resource": {"Fn::GetAtt": ["ClaimsProcessingFunction", "Arn"]},
                                    "End": true
                                }
                            }
                        }),
                        "RoleArn": {"Fn::GetAtt": ["StepFunctionRole", "Arn"]},
                        "Tags": [{"Key": "Name", "Value": `${appName}-reporting-pipeline`}]
                    }
                },
                "AuditLogGroup": {
                    "Type": "AWS::Logs::LogGroup",
                    "Properties": {
                        "LogGroupName": `/aws/healthcare/${appName}/audit`,
                        "RetentionInDays": 2555,
                        "KmsKeyId": {"Fn::GetAtt": ["HealthDataKMSKey", "Arn"]},
                        "Tags": [{"Key": "Name", "Value": `${appName}-audit-logs`}]
                    }
                }
            }
        }, null, 2);
    }

    function generateEcommerceTemplate(userMessage) {
        const appName = extractAppName(userMessage) || 'ecommerce-platform';
        
        return JSON.stringify({
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": "Scalable e-commerce platform infrastructure generated by Lattice AI",
            "Resources": {
                "VPC": {
                    "Type": "AWS::EC2::VPC",
                    "Properties": {
                        "CidrBlock": "10.0.0.0/16",
                        "EnableDnsHostnames": true,
                        "Tags": [{"Key": "Name", "Value": `${appName}-vpc`}]
                    }
                },
                "ProductCatalogDatabase": {
                    "Type": "AWS::RDS::DBInstance",
                    "Properties": {
                        "DBInstanceClass": "db.r5.xlarge",
                        "Engine": "postgres",
                        "AllocatedStorage": "200",
                        "StorageEncrypted": true,
                        "MultiAZ": true,
                        "BackupRetentionPeriod": 7
                    }
                },
                "PaymentProcessingFunction": {
                    "Type": "AWS::Lambda::Function",
                    "Properties": {
                        "Runtime": "nodejs18.x",
                        "Handler": "payment.handler",
                        "Code": {
                            "ZipFile": "exports.handler = async (event) => {\n  // Secure payment processing\n  return { statusCode: 200, body: JSON.stringify({ message: 'Payment processed' }) };\n};"
                        },
                        "Environment": {
                            "Variables": {
                                "STRIPE_SECRET_KEY": "{{resolve:secretsmanager:stripe-key:SecretString:secret_key}}"
                            }
                        }
                    }
                },
                "InventoryTable": {
                    "Type": "AWS::DynamoDB::Table",
                    "Properties": {
                        "TableName": `${appName}-inventory`,
                        "BillingMode": "PAY_PER_REQUEST",
                        "AttributeDefinitions": [
                            {"AttributeName": "productId", "AttributeType": "S"}
                        ],
                        "KeySchema": [
                            {"AttributeName": "productId", "KeyType": "HASH"}
                        ],
                        "StreamSpecification": {
                            "StreamViewType": "NEW_AND_OLD_IMAGES"
                        }
                    }
                },
                "StaticAssetsBucket": {
                    "Type": "AWS::S3::Bucket",
                    "Properties": {
                        "BucketEncryption": {
                            "ServerSideEncryptionConfiguration": [{
                                "ServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}
                            }]
                        },
                        "PublicAccessBlockConfiguration": {
                            "BlockPublicAcls": true,
                            "BlockPublicPolicy": true,
                            "IgnorePublicAcls": true,
                            "RestrictPublicBuckets": true
                        },
                        "Tags": [{"Key": "Name", "Value": `${appName}-static-assets`}]
                    }
                },
                "CDNDistribution": {
                    "Type": "AWS::CloudFront::Distribution",
                    "Properties": {
                        "DistributionConfig": {
                            "Origins": [{
                                "Id": "S3Origin",
                                "DomainName": {"Fn::GetAtt": ["StaticAssetsBucket", "DomainName"]},
                                "S3OriginConfig": {}
                            }],
                            "DefaultCacheBehavior": {
                                "TargetOriginId": "S3Origin",
                                "ViewerProtocolPolicy": "redirect-to-https",
                                "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
                            },
                            "Enabled": true
                        }
                    }
                }
            }
        }, null, 2);
    }

    function generateWebAppTemplate(userMessage) {
        const appName = extractAppName(userMessage) || 'webapp';
        
        return JSON.stringify({
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": `Web application infrastructure generated by Lattice AI`,
            "Resources": {
                "VPC": {
                    "Type": "AWS::EC2::VPC",
                    "Properties": {
                        "CidrBlock": "10.0.0.0/16",
                        "EnableDnsHostnames": true,
                        "Tags": [{"Key": "Name", "Value": `${appName}-vpc`}]
                    }
                },
                "WebsiteBucket": {
                    "Type": "AWS::S3::Bucket",
                    "Properties": {
                        "WebsiteConfiguration": {
                            "IndexDocument": "index.html"
                        },
                        "BucketEncryption": {
                            "ServerSideEncryptionConfiguration": [{
                                "ServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}
                            }]
                        }
                    }
                },
                "ApiGateway": {
                    "Type": "AWS::ApiGateway::RestApi",
                    "Properties": {
                        "Name": `${appName}-api`
                    }
                },
                "LambdaFunction": {
                    "Type": "AWS::Lambda::Function",
                    "Properties": {
                        "Runtime": "nodejs18.x",
                        "Handler": "index.handler",
                        "Code": {
                            "ZipFile": "exports.handler = async () => ({ statusCode: 200, body: JSON.stringify({ message: 'Hello from Lattice!' }) });"
                        }
                    }
                },
                "Database": {
                    "Type": "AWS::RDS::DBInstance",
                    "Properties": {
                        "DBInstanceClass": "db.t3.micro",
                        "Engine": "postgres",
                        "AllocatedStorage": "20",
                        "StorageEncrypted": true
                    }
                }
            }
        }, null, 2);
    }

    function generateAPITemplate(userMessage) {
        const appName = extractAppName(userMessage) || 'api';
        
        return JSON.stringify({
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": "REST API infrastructure generated by Lattice AI",
            "Resources": {
                "ApiGateway": {
                    "Type": "AWS::ApiGateway::RestApi",
                    "Properties": {
                        "Name": `${appName}-api`
                    }
                },
                "LambdaFunction": {
                    "Type": "AWS::Lambda::Function",
                    "Properties": {
                        "Runtime": "nodejs18.x",
                        "Handler": "index.handler",
                        "Code": {
                            "ZipFile": "exports.handler = async (event) => ({ statusCode: 200, body: JSON.stringify({ message: 'API Response', method: event.httpMethod }) });"
                        }
                    }
                },
                "FileStorageBucket": {
                    "Type": "AWS::S3::Bucket",
                    "Properties": {
                        "BucketEncryption": {
                            "ServerSideEncryptionConfiguration": [{
                                "ServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}
                            }]
                        }
                    }
                },
                "MonitoringDashboard": {
                    "Type": "AWS::CloudWatch::Dashboard",
                    "Properties": {
                        "DashboardName": `${appName}-monitoring`,
                        "DashboardBody": JSON.stringify({
                            "widgets": [{
                                "type": "metric",
                                "properties": {
                                    "metrics": [["AWS/Lambda", "Duration", "FunctionName", {"Ref": "LambdaFunction"}]],
                                    "period": 300,
                                    "stat": "Average",
                                    "region": "us-east-1",
                                    "title": "Lambda Duration"
                                }
                            }]
                        })
                    }
                }
            }
        }, null, 2);
    }

    function generateDataPipelineTemplate() {
        return JSON.stringify({
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": "Data pipeline infrastructure generated by Lattice AI",
            "Resources": {
                "InputBucket": {
                    "Type": "AWS::S3::Bucket",
                    "Properties": {
                        "BucketEncryption": {
                            "ServerSideEncryptionConfiguration": [{
                                "ServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}
                            }]
                        }
                    }
                },
                "ProcessorFunction": {
                    "Type": "AWS::Lambda::Function",
                    "Properties": {
                        "Runtime": "python3.9",
                        "Handler": "index.handler",
                        "Code": {
                            "ZipFile": "import json\ndef handler(event, context):\n    return {'statusCode': 200, 'body': 'Data processed'}"
                        },
                        "Timeout": 300
                    }
                },
                "OutputBucket": {
                    "Type": "AWS::S3::Bucket",
                    "Properties": {
                        "BucketEncryption": {
                            "ServerSideEncryptionConfiguration": [{
                                "ServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}
                            }]
                        }
                    }
                }
            }
        }, null, 2);
    }

    function generateBlogTemplate() {
        return JSON.stringify({
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": "Serverless blog platform generated by Lattice AI",
            "Resources": {
                "BlogTable": {
                    "Type": "AWS::DynamoDB::Table",
                    "Properties": {
                        "BillingMode": "PAY_PER_REQUEST",
                        "AttributeDefinitions": [
                            {"AttributeName": "postId", "AttributeType": "S"}
                        ],
                        "KeySchema": [
                            {"AttributeName": "postId", "KeyType": "HASH"}
                        ]
                    }
                },
                "BlogFunction": {
                    "Type": "AWS::Lambda::Function",
                    "Properties": {
                        "Runtime": "nodejs18.x",
                        "Handler": "index.handler",
                        "Code": {
                            "ZipFile": "exports.handler = async (event) => ({ statusCode: 200, body: JSON.stringify({ message: 'Blog API ready' }) });"
                        }
                    }
                },
                "StaticWebsite": {
                    "Type": "AWS::S3::Bucket",
                    "Properties": {
                        "WebsiteConfiguration": {
                            "IndexDocument": "index.html"
                        }
                    }
                }
            }
        }, null, 2);
    }

    function generateGeneralTemplate() {
        return JSON.stringify({
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": "General infrastructure generated by Lattice AI",
            "Resources": {
                "VPC": {
                    "Type": "AWS::EC2::VPC",
                    "Properties": {
                        "CidrBlock": "10.0.0.0/16",
                        "EnableDnsHostnames": true
                    }
                },
                "ApplicationFunction": {
                    "Type": "AWS::Lambda::Function",
                    "Properties": {
                        "Runtime": "nodejs18.x",
                        "Handler": "index.handler",
                        "Code": {
                            "ZipFile": "exports.handler = async () => ({ statusCode: 200, body: 'Hello from Lattice!' });"
                        }
                    }
                },
                "StorageBucket": {
                    "Type": "AWS::S3::Bucket",
                    "Properties": {
                        "BucketEncryption": {
                            "ServerSideEncryptionConfiguration": [{
                                "ServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}
                            }]
                        }
                    }
                }
            }
        }, null, 2);
    }

    function extractAppName(message) {
        const words = message.toLowerCase().split(' ');
        const appWords = ['app', 'application', 'platform', 'service'];
        
        for (let i = 0; i < words.length; i++) {
            if (appWords.includes(words[i]) && i > 0) {
                return words[i - 1].replace(/[^a-zA-Z0-9]/g, '');
            }
        }
        return 'myapp';
    }

    // Global functions
    window.useExamplePrompt = function(prompt) {
        chatInput.value = prompt;
        chatInput.focus();
        // Auto-submit the form after setting the prompt
        setTimeout(() => {
            chatForm.dispatchEvent(new Event('submit'));
        }, 100);
    };

    window.copyCode = function(button) {
        const code = button.nextElementSibling.querySelector('code');
        navigator.clipboard.writeText(code.textContent).then(() => {
            button.textContent = 'Copied!';
            button.classList.add('copied');
            setTimeout(() => {
                button.textContent = 'Copy';
                button.classList.remove('copied');
            }, 2000);
        });
    };
});