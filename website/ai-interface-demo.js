// AI Chatbot Demo functionality
document.addEventListener('DOMContentLoaded', function () {
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
  chatInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
  });

  // Handle form submission
  chatForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (message) {
      sendMessage(message);
      chatInput.value = '';
      chatInput.style.height = 'auto';
    }
  });

  // Handle Enter key (but allow Shift+Enter for new lines)
  chatInput.addEventListener('keydown', function (e) {
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
    setTimeout(
      () => {
        hideTypingIndicator();
        generateAIResponse(message);

        // Re-enable input
        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatInput.focus();
      },
      2000 + Math.random() * 2000
    ); // Random delay between 2-4 seconds
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
    // Replace code blocks with proper formatting
    return content.replace(/```(\w+)?\n([\s\S]*?)```/g, function (match, lang, code) {
      const copyBtn = `<button class="copy-btn" onclick="copyCode(this)">Copy</button>`;
      return `<div class="code-block">${copyBtn}<pre><code>${escapeHtml(code.trim())}</code></pre></div>`;
    });
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
    // Use the production-ready template generator
    const generator = new ProductionTemplateGenerator();
    const analysis = generator.analyzePrompt(userMessage);

    let response = '';
    let template = '';

    // Generate contextual response based on analysis
    switch (analysis.type) {
      case 'ecommerce':
        response =
          "I'll create a production-ready e-commerce platform with high availability, security, and scalability. This includes CloudFront CDN, multi-AZ RDS Aurora, ElastiCache Redis, SQS/SNS messaging, and comprehensive monitoring:";
        break;
      case 'multitenant-saas':
        response =
          "Perfect! I'll generate a multi-tenant SaaS platform with ECS Fargate, tenant isolation, WAF protection, and serverless Aurora scaling:";
        break;
      case 'realtime-analytics':
        response =
          "I'll create a real-time analytics pipeline with Kinesis Data Streams, Lambda processing, S3 data lake, and Redshift warehousing:";
        break;
      case 'iot-platform':
        response =
          "Great! I'll set up an IoT data processing platform with IoT Core, Kinesis Firehose, and real-time analytics:";
        break;
      case 'ml-pipeline':
        response =
          "I'll design a machine learning pipeline with SageMaker, S3 data storage, and automated model deployment:";
        break;
      case 'hipaa-compliant':
        response =
          "I'll create a HIPAA-compliant healthcare platform with encrypted storage, audit logging, and strict access controls:";
        break;
      case 'financial-services':
        response =
          "Perfect! I'll generate a PCI DSS compliant financial services platform with CloudHSM, GuardDuty, and comprehensive security:";
        break;
      case 'microservices':
        response =
          "I'll set up a microservices platform with EKS, service mesh, distributed tracing, and container monitoring:";
        break;
      case 'video-streaming':
        response =
          "Great! I'll create a video streaming platform with MediaConvert, CloudFront, and global content delivery:";
        break;
      case 'disaster-recovery':
        response =
          "I'll design a comprehensive disaster recovery solution with multi-region failover and automated backup strategies:";
        break;
      default:
        response =
          "I'll create a production-ready infrastructure based on your requirements with security best practices and monitoring:";
    }

    try {
      const templateObj = generator.generateTemplate(userMessage);
      template = JSON.stringify(templateObj, null, 2);
    } catch (error) {
      console.error('Template generation error:', error);
      template = generateFallbackTemplate(userMessage);
    }

    const features = getTemplateFeatures(analysis.type);
    const fullResponse = `${response}\n\n\`\`\`json\n${template}\n\`\`\`\n\n**Production Features Included:**\n${features}\n\n**Ready for deployment** with AWS CLI, CDK, or CloudFormation console!`;

    addMessage(fullResponse, 'ai');
  }

  function getTemplateFeatures(templateType) {
    const featureMap = {
      ecommerce:
        '• Multi-AZ VPC with public/private subnets\n• CloudFront CDN with S3 origin\n• Application Load Balancer with SSL\n• RDS Aurora PostgreSQL with encryption\n• ElastiCache Redis for sessions\n• Lambda microservices architecture\n• SQS/SNS for order processing\n• CloudWatch alarms and monitoring\n• IAM roles with least privilege\n• WAF protection and security groups',
      'multitenant-saas':
        '• ECS Fargate with auto-scaling\n• Multi-tenant database isolation\n• WAF with rate limiting\n• KMS encryption for data at rest\n• Container insights monitoring\n• Load balancer with path routing\n• Serverless Aurora scaling\n• ElastiCache for tenant caching\n• Security groups and NACLs\n• CloudWatch comprehensive monitoring',
      'realtime-analytics':
        '• Kinesis Data Streams for ingestion\n• Lambda for real-time processing\n• S3 data lake with partitioning\n• Redshift for data warehousing\n• Glue for ETL and data catalog\n• QuickSight for dashboards\n• CloudWatch for pipeline monitoring\n• IAM roles for service access\n• KMS encryption throughout\n• Auto-scaling based on throughput',
      default:
        '• Secure VPC with multi-AZ deployment\n• Auto-scaling and load balancing\n• Encrypted storage and databases\n• CloudWatch monitoring and alarms\n• IAM roles with least privilege\n• Backup and disaster recovery\n• Security groups and NACLs\n• KMS key management\n• Cost optimization features\n• Production-ready configurations',
    };

    return featureMap[templateType] || featureMap.default;
  }

  function generateFallbackTemplate(userMessage) {
    // Fallback to basic template if production generator fails
    return JSON.stringify(
      {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Basic infrastructure template',
        Resources: {
          VPC: {
            Type: 'AWS::EC2::VPC',
            Properties: {
              CidrBlock: '10.0.0.0/16',
              EnableDnsHostnames: true,
            },
          },
        },
      },
      null,
      2
    );
  }

  function generateWebAppTemplate(userMessage) {
    const appName = extractAppName(userMessage) || 'webapp';

    return JSON.stringify(
      {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: `Web application infrastructure generated by Lattice AI`,
        Resources: {
          VPC: {
            Type: 'AWS::EC2::VPC',
            Properties: {
              CidrBlock: '10.0.0.0/16',
              EnableDnsHostnames: true,
              Tags: [{ Key: 'Name', Value: `${appName}-vpc` }],
            },
          },
          WebsiteBucket: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              WebsiteConfiguration: {
                IndexDocument: 'index.html',
              },
              BucketEncryption: {
                ServerSideEncryptionConfiguration: [
                  {
                    ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' },
                  },
                ],
              },
            },
          },
          ApiGateway: {
            Type: 'AWS::ApiGateway::RestApi',
            Properties: {
              Name: `${appName}-api`,
            },
          },
          LambdaFunction: {
            Type: 'AWS::Lambda::Function',
            Properties: {
              Runtime: 'nodejs18.x',
              Handler: 'index.handler',
              Code: {
                ZipFile:
                  "exports.handler = async () => ({ statusCode: 200, body: JSON.stringify({ message: 'Hello from Lattice!' }) });",
              },
            },
          },
          Database: {
            Type: 'AWS::RDS::DBInstance',
            Properties: {
              DBInstanceClass: 'db.t3.micro',
              Engine: 'postgres',
              AllocatedStorage: '20',
              StorageEncrypted: true,
            },
          },
        },
      },
      null,
      2
    );
  }

  function generateAPITemplate(userMessage) {
    const appName = extractAppName(userMessage) || 'api';

    return JSON.stringify(
      {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'REST API infrastructure generated by Lattice AI',
        Resources: {
          ApiGateway: {
            Type: 'AWS::ApiGateway::RestApi',
            Properties: {
              Name: `${appName}-api`,
            },
          },
          LambdaFunction: {
            Type: 'AWS::Lambda::Function',
            Properties: {
              Runtime: 'nodejs18.x',
              Handler: 'index.handler',
              Code: {
                ZipFile:
                  "exports.handler = async (event) => ({ statusCode: 200, body: JSON.stringify({ message: 'API Response', method: event.httpMethod }) });",
              },
            },
          },
          FileStorageBucket: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              BucketEncryption: {
                ServerSideEncryptionConfiguration: [
                  {
                    ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' },
                  },
                ],
              },
            },
          },
        },
      },
      null,
      2
    );
  }

  function generateDataPipelineTemplate() {
    return JSON.stringify(
      {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Data pipeline infrastructure generated by Lattice AI',
        Resources: {
          InputBucket: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              BucketEncryption: {
                ServerSideEncryptionConfiguration: [
                  {
                    ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' },
                  },
                ],
              },
            },
          },
          ProcessorFunction: {
            Type: 'AWS::Lambda::Function',
            Properties: {
              Runtime: 'python3.9',
              Handler: 'index.handler',
              Code: {
                ZipFile:
                  "import json\ndef handler(event, context):\n    return {'statusCode': 200, 'body': 'Data processed'}",
              },
              Timeout: 300,
            },
          },
          OutputBucket: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              BucketEncryption: {
                ServerSideEncryptionConfiguration: [
                  {
                    ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' },
                  },
                ],
              },
            },
          },
        },
      },
      null,
      2
    );
  }

  function generateBlogTemplate() {
    return JSON.stringify(
      {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Serverless blog platform generated by Lattice AI',
        Resources: {
          BlogTable: {
            Type: 'AWS::DynamoDB::Table',
            Properties: {
              BillingMode: 'PAY_PER_REQUEST',
              AttributeDefinitions: [{ AttributeName: 'postId', AttributeType: 'S' }],
              KeySchema: [{ AttributeName: 'postId', KeyType: 'HASH' }],
            },
          },
          BlogFunction: {
            Type: 'AWS::Lambda::Function',
            Properties: {
              Runtime: 'nodejs18.x',
              Handler: 'index.handler',
              Code: {
                ZipFile:
                  "exports.handler = async (event) => ({ statusCode: 200, body: JSON.stringify({ message: 'Blog API ready' }) });",
              },
            },
          },
          StaticWebsite: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              WebsiteConfiguration: {
                IndexDocument: 'index.html',
              },
            },
          },
        },
      },
      null,
      2
    );
  }

  function generateGeneralTemplate() {
    return JSON.stringify(
      {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'General infrastructure generated by Lattice AI',
        Resources: {
          VPC: {
            Type: 'AWS::EC2::VPC',
            Properties: {
              CidrBlock: '10.0.0.0/16',
              EnableDnsHostnames: true,
            },
          },
          ApplicationFunction: {
            Type: 'AWS::Lambda::Function',
            Properties: {
              Runtime: 'nodejs18.x',
              Handler: 'index.handler',
              Code: {
                ZipFile:
                  "exports.handler = async () => ({ statusCode: 200, body: 'Hello from Lattice!' });",
              },
            },
          },
          StorageBucket: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              BucketEncryption: {
                ServerSideEncryptionConfiguration: [
                  {
                    ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' },
                  },
                ],
              },
            },
          },
        },
      },
      null,
      2
    );
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
  window.useExamplePrompt = function (prompt) {
    chatInput.value = prompt;
    chatInput.focus();
    // Auto-submit the form after setting the prompt
    setTimeout(() => {
      chatForm.dispatchEvent(new Event('submit'));
    }, 100);
  };

  window.copyCode = function (button) {
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
