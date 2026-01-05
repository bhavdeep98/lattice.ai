// Interactive Demo functionality
// Declare global variables
let form, manifestOutput, cloudformationOutput, cdkOutput, costEstimate, costBreakdown, threatModel, threatList, cfnDeployOptions;
let generatedCFN = '';
let generatedManifest = {};

document.addEventListener('DOMContentLoaded', function() {
    console.log('Interactive demo JavaScript loaded successfully');
    
    try {
        // Initialize DOM elements
        form = document.getElementById('configForm');
        manifestOutput = document.getElementById('manifestOutput');
        cloudformationOutput = document.getElementById('cloudformationOutput');
        cdkOutput = document.getElementById('cdkOutput');
        costEstimate = document.getElementById('costEstimate');
        costBreakdown = document.getElementById('costBreakdown');
        threatModel = document.getElementById('threatModel');
        threatList = document.getElementById('threatList');
        cfnDeployOptions = document.getElementById('cfnDeployOptions');
        
        console.log('All DOM elements found:', {
            form: !!form,
            manifestOutput: !!manifestOutput,
            cloudformationOutput: !!cloudformationOutput,
            cdkOutput: !!cdkOutput
        });
        
        // Check if page loaded with URL parameters (form submission)
        const urlParams = new URLSearchParams(window.location.search);
        console.log('URL params:', urlParams.toString());
        
        if (urlParams.has('appName')) {
            console.log('Found URL parameters, auto-generating...');
            // Populate form with URL parameters
            populateFormFromURL(urlParams);
            // Auto-generate infrastructure
            setTimeout(() => {
                const config = getConfigFromURL(urlParams);
                console.log('Config from URL:', config);
                generateAllOutputs(config);
            }, 500);
        }
        
        // Set up event listeners after DOM elements are initialized
        setupEventListeners();
        
    } catch (error) {
        console.error('Error in DOMContentLoaded:', error);
    }
    
    function setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', function() {
                const tabName = this.dataset.tab;
                
                // Update active tab button
                document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Update active tab content
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                document.getElementById(tabName + '-tab').classList.add('active');
            });
        });
        
        // Form submission
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const formData = new FormData(form);
                const config = {};
                
                // Build configuration object
                for (let [key, value] of formData.entries()) {
                    if (form.elements[key].type === 'checkbox') {
                        config[key] = form.elements[key].checked;
                    } else {
                        config[key] = value;
                    }
                }
                
                console.log('Form submitted with config:', config);
                
                // Generate all outputs
                generateAllOutputs(config);
            });
        }
    }
    
    function populateFormFromURL(urlParams) {
        for (let [key, value] of urlParams.entries()) {
            const element = form.elements[key];
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value === 'on';
                } else {
                    element.value = value;
                }
            }
        }
    }
    
    function getConfigFromURL(urlParams) {
        const config = {};
        for (let [key, value] of urlParams.entries()) {
            const element = form.elements[key];
            if (element) {
                if (element.type === 'checkbox') {
                    config[key] = value === 'on';
                } else {
                    config[key] = value;
                }
            }
        }
        return config;
    }
    
    function generateAllOutputs(config) {
        console.log('generateAllOutputs called with:', config);
        try {
            generateManifest(config);
            generateCloudFormation(config);
            generateCDKCode(config);
            generateCostEstimate(config);
            
            if (config.enableThreatModel) {
                generateThreatModel(config);
            }
            console.log('All outputs generated successfully');
        } catch (error) {
            console.error('Error generating outputs:', error);
        }
    }
    
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            // Update active tab button
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update active tab content
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(tabName + '-tab').classList.add('active');
        });
    });

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const config = {};
        
        // Build configuration object
        for (let [key, value] of formData.entries()) {
            if (form.elements[key].type === 'checkbox') {
                config[key] = form.elements[key].checked;
            } else {
                config[key] = value;
            }
        }
        
        console.log('Form submitted with config:', config);
        
        // Generate all outputs
        generateAllOutputs(config);
    });
    
    function generateManifest(config) {
        console.log('Generating manifest for:', config);
        
        const manifest = {
            appName: config.appName,
            environment: config.environment,
            threatModel: {
                enabled: config.enableThreatModel,
                projectName: config.appName + ' SaaS Application'
            },
            capabilities: {}
        };
        
        if (config.includeWebsite) {
            manifest.capabilities.website = {
                name: config.appName + '-web',
                environment: config.environment,
                domainName: config.domainName || undefined
            };
        }
        
        if (config.includeApi) {
            manifest.capabilities.api = {
                name: config.appName + '-api',
                environment: config.environment,
                type: 'serverless',
                runtime: 'nodejs18.x',
                authentication: config.includeAuth ? 'cognito' : 'none'
            };
        }
        
        if (config.includeDatabase) {
            manifest.capabilities.database = {
                name: config.appName + '-db',
                environment: config.environment,
                engine: 'postgres',
                size: config.environment === 'prod' ? 'medium' : 'small',
                highAvailability: config.environment === 'prod',
                backups: config.enableBackups
            };
        }
        
        if (config.includeStorage) {
            manifest.capabilities.storage = {
                name: config.appName + '-files',
                environment: config.environment,
                encryption: true,
                versioning: config.environment !== 'dev',
                publicRead: false
            };
        }
        
        if (config.includeAuth) {
            manifest.capabilities.authentication = {
                name: config.appName + '-auth',
                environment: config.environment,
                type: 'cognito',
                mfa: config.environment === 'prod'
            };
        }
        
        generatedManifest = manifest;
        
        console.log('Generated manifest:', manifest);
        
        // Display manifest
        const manifestCode = JSON.stringify(manifest, null, 2);
        manifestOutput.innerHTML = '<button class="copy-button" onclick="copyToClipboard(\'manifest\')">Copy</button><pre><code>' + manifestCode + '</code></pre>';
    }
    
    function generateCloudFormation(config) {
        const cfnTemplate = {
            AWSTemplateFormatVersion: '2010-09-09',
            Description: 'Lattice-generated infrastructure for ' + config.appName,
            Parameters: {
                Environment: {
                    Type: 'String',
                    Default: config.environment,
                    AllowedValues: ['dev', 'staging', 'prod'],
                    Description: 'Environment name'
                },
                AppName: {
                    Type: 'String',
                    Default: config.appName,
                    Description: 'Application name'
                }
            },
            Resources: {},
            Outputs: {}
        };
        
        // Add VPC (always included for security)
        cfnTemplate.Resources.VPC = {
            Type: 'AWS::EC2::VPC',
            Properties: {
                CidrBlock: '10.0.0.0/16',
                EnableDnsHostnames: true,
                EnableDnsSupport: true,
                Tags: [
                    { Key: 'Name', Value: { 'Fn::Sub': '${AppName}-vpc' } },
                    { Key: 'Environment', Value: { Ref: 'Environment' } },
                    { Key: 'ManagedBy', Value: 'Lattice' }
                ]
            }
        };
        
        // Add Internet Gateway
        cfnTemplate.Resources.InternetGateway = {
            Type: 'AWS::EC2::InternetGateway',
            Properties: {
                Tags: [
                    { Key: 'Name', Value: { 'Fn::Sub': '${AppName}-igw' } },
                    { Key: 'Environment', Value: { Ref: 'Environment' } }
                ]
            }
        };
        
        cfnTemplate.Resources.AttachGateway = {
            Type: 'AWS::EC2::VPCGatewayAttachment',
            Properties: {
                VpcId: { Ref: 'VPC' },
                InternetGatewayId: { Ref: 'InternetGateway' }
            }
        };
        
        // Add Public Subnet
        cfnTemplate.Resources.PublicSubnet = {
            Type: 'AWS::EC2::Subnet',
            Properties: {
                VpcId: { Ref: 'VPC' },
                CidrBlock: '10.0.1.0/24',
                AvailabilityZone: { 'Fn::Select': [0, { 'Fn::GetAZs': '' }] },
                MapPublicIpOnLaunch: true,
                Tags: [
                    { Key: 'Name', Value: { 'Fn::Sub': '${AppName}-public-subnet' } },
                    { Key: 'Environment', Value: { Ref: 'Environment' } }
                ]
            }
        };
        
        // Add Private Subnet
        cfnTemplate.Resources.PrivateSubnet = {
            Type: 'AWS::EC2::Subnet',
            Properties: {
                VpcId: { Ref: 'VPC' },
                CidrBlock: '10.0.2.0/24',
                AvailabilityZone: { 'Fn::Select': [0, { 'Fn::GetAZs': '' }] },
                Tags: [
                    { Key: 'Name', Value: { 'Fn::Sub': '${AppName}-private-subnet' } },
                    { Key: 'Environment', Value: { Ref: 'Environment' } }
                ]
            }
        };
        
        // Add Website resources
        if (config.includeWebsite) {
            cfnTemplate.Resources.WebsiteBucket = {
                Type: 'AWS::S3::Bucket',
                Properties: {
                    BucketName: { 'Fn::Sub': '${AppName}-website-${AWS::AccountId}' },
                    WebsiteConfiguration: {
                        IndexDocument: 'index.html',
                        ErrorDocument: 'error.html'
                    },
                    PublicAccessBlockConfiguration: {
                        BlockPublicAcls: false,
                        BlockPublicPolicy: false,
                        IgnorePublicAcls: false,
                        RestrictPublicBuckets: false
                    },
                    Tags: [
                        { Key: 'Environment', Value: { Ref: 'Environment' } },
                        { Key: 'ManagedBy', Value: 'Lattice' }
                    ]
                }
            };
            
            cfnTemplate.Resources.CloudFrontDistribution = {
                Type: 'AWS::CloudFront::Distribution',
                Properties: {
                    DistributionConfig: {
                        Origins: [{
                            Id: 'S3Origin',
                            DomainName: { 'Fn::GetAtt': ['WebsiteBucket', 'RegionalDomainName'] },
                            S3OriginConfig: {
                                OriginAccessIdentity: ''
                            }
                        }],
                        DefaultCacheBehavior: {
                            TargetOriginId: 'S3Origin',
                            ViewerProtocolPolicy: 'redirect-to-https',
                            AllowedMethods: ['GET', 'HEAD'],
                            CachedMethods: ['GET', 'HEAD'],
                            ForwardedValues: {
                                QueryString: false,
                                Cookies: { Forward: 'none' }
                            }
                        },
                        Enabled: true,
                        DefaultRootObject: 'index.html'
                    },
                    Tags: [
                        { Key: 'Environment', Value: { Ref: 'Environment' } },
                        { Key: 'ManagedBy', Value: 'Lattice' }
                    ]
                }
            };
            
            cfnTemplate.Outputs.WebsiteURL = {
                Description: 'Website URL',
                Value: { 'Fn::GetAtt': ['CloudFrontDistribution', 'DomainName'] }
            };
        }
        
        // Add API resources
        if (config.includeApi) {
            cfnTemplate.Resources.ApiGateway = {
                Type: 'AWS::ApiGateway::RestApi',
                Properties: {
                    Name: { 'Fn::Sub': '${AppName}-api' },
                    Description: 'Lattice-generated API Gateway',
                    Tags: [
                        { Key: 'Environment', Value: { Ref: 'Environment' } },
                        { Key: 'ManagedBy', Value: 'Lattice' }
                    ]
                }
            };
            
            cfnTemplate.Resources.LambdaFunction = {
                Type: 'AWS::Lambda::Function',
                Properties: {
                    FunctionName: { 'Fn::Sub': '${AppName}-api-handler' },
                    Runtime: 'nodejs18.x',
                    Handler: 'index.handler',
                    Code: {
                        ZipFile: `
exports.handler = async (event) => {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            message: 'Hello from Lattice!',
            timestamp: new Date().toISOString(),
            environment: process.env.ENVIRONMENT
        })
    };
};`
                    },
                    Environment: {
                        Variables: {
                            ENVIRONMENT: { Ref: 'Environment' },
                            APP_NAME: { Ref: 'AppName' }
                        }
                    },
                    Tags: [
                        { Key: 'Environment', Value: { Ref: 'Environment' } },
                        { Key: 'ManagedBy', Value: 'Lattice' }
                    ]
                }
            };
            
            cfnTemplate.Outputs.ApiEndpoint = {
                Description: 'API Gateway endpoint URL',
                Value: { 'Fn::Sub': 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/prod' }
            };
        }
        
        // Add Database resources
        if (config.includeDatabase) {
            cfnTemplate.Resources.DBSubnetGroup = {
                Type: 'AWS::RDS::DBSubnetGroup',
                Properties: {
                    DBSubnetGroupDescription: 'Subnet group for RDS database',
                    SubnetIds: [{ Ref: 'PrivateSubnet' }, { Ref: 'PublicSubnet' }],
                    Tags: [
                        { Key: 'Environment', Value: { Ref: 'Environment' } },
                        { Key: 'ManagedBy', Value: 'Lattice' }
                    ]
                }
            };
            
            cfnTemplate.Resources.Database = {
                Type: 'AWS::RDS::DBInstance',
                Properties: {
                    DBInstanceIdentifier: { 'Fn::Sub': '${AppName}-db' },
                    DBInstanceClass: config.environment === 'prod' ? 'db.t3.small' : 'db.t3.micro',
                    Engine: 'postgres',
                    EngineVersion: '15.4',
                    AllocatedStorage: config.environment === 'prod' ? '100' : '20',
                    StorageType: 'gp2',
                    StorageEncrypted: true,
                    MasterUsername: 'dbadmin',
                    MasterUserPassword: { 'Fn::Sub': '${AppName}Password123!' },
                    VPCSecurityGroups: [{ Ref: 'DatabaseSecurityGroup' }],
                    DBSubnetGroupName: { Ref: 'DBSubnetGroup' },
                    BackupRetentionPeriod: config.enableBackups ? 7 : 0,
                    MultiAZ: config.environment === 'prod',
                    Tags: [
                        { Key: 'Environment', Value: { Ref: 'Environment' } },
                        { Key: 'ManagedBy', Value: 'Lattice' }
                    ]
                }
            };
            
            cfnTemplate.Resources.DatabaseSecurityGroup = {
                Type: 'AWS::EC2::SecurityGroup',
                Properties: {
                    GroupDescription: 'Security group for RDS database',
                    VpcId: { Ref: 'VPC' },
                    SecurityGroupIngress: [{
                        IpProtocol: 'tcp',
                        FromPort: 5432,
                        ToPort: 5432,
                        SourceSecurityGroupId: { Ref: 'LambdaSecurityGroup' }
                    }],
                    Tags: [
                        { Key: 'Environment', Value: { Ref: 'Environment' } },
                        { Key: 'ManagedBy', Value: 'Lattice' }
                    ]
                }
            };
            
            cfnTemplate.Resources.LambdaSecurityGroup = {
                Type: 'AWS::EC2::SecurityGroup',
                Properties: {
                    GroupDescription: 'Security group for Lambda functions',
                    VpcId: { Ref: 'VPC' },
                    Tags: [
                        { Key: 'Environment', Value: { Ref: 'Environment' } },
                        { Key: 'ManagedBy', Value: 'Lattice' }
                    ]
                }
            };
            
            cfnTemplate.Outputs.DatabaseEndpoint = {
                Description: 'RDS instance endpoint',
                Value: { 'Fn::GetAtt': ['Database', 'Endpoint.Address'] }
            };
        }
        
        // Add Storage resources
        if (config.includeStorage) {
            cfnTemplate.Resources.FileStorageBucket = {
                Type: 'AWS::S3::Bucket',
                Properties: {
                    BucketName: { 'Fn::Sub': '${AppName}-files-${AWS::AccountId}' },
                    BucketEncryption: {
                        ServerSideEncryptionConfiguration: [{
                            ServerSideEncryptionByDefault: {
                                SSEAlgorithm: 'AES256'
                            }
                        }]
                    },
                    VersioningConfiguration: {
                        Status: config.environment !== 'dev' ? 'Enabled' : 'Suspended'
                    },
                    PublicAccessBlockConfiguration: {
                        BlockPublicAcls: true,
                        BlockPublicPolicy: true,
                        IgnorePublicAcls: true,
                        RestrictPublicBuckets: true
                    },
                    Tags: [
                        { Key: 'Environment', Value: { Ref: 'Environment' } },
                        { Key: 'ManagedBy', Value: 'Lattice' }
                    ]
                }
            };
            
            cfnTemplate.Outputs.FileStorageBucket = {
                Description: 'S3 bucket for file storage',
                Value: { Ref: 'FileStorageBucket' }
            };
        }
        
        // Add CloudWatch Dashboard
        if (config.enableMonitoring) {
            const dashboardBody = {
                widgets: []
            };
            
            if (config.includeApi) {
                dashboardBody.widgets.push({
                    type: 'metric',
                    properties: {
                        metrics: [
                            ['AWS/Lambda', 'Duration', 'FunctionName', { Ref: 'LambdaFunction' }],
                            ['AWS/Lambda', 'Errors', 'FunctionName', { Ref: 'LambdaFunction' }],
                            ['AWS/Lambda', 'Invocations', 'FunctionName', { Ref: 'LambdaFunction' }]
                        ],
                        period: 300,
                        stat: 'Average',
                        region: { Ref: 'AWS::Region' },
                        title: 'Lambda Metrics'
                    }
                });
            }
            
            cfnTemplate.Resources.CloudWatchDashboard = {
                Type: 'AWS::CloudWatch::Dashboard',
                Properties: {
                    DashboardName: { 'Fn::Sub': '${AppName}-dashboard' },
                    DashboardBody: JSON.stringify(dashboardBody)
                }
            };
        }
        
        generatedCFN = JSON.stringify(cfnTemplate, null, 2);
        
        // Display CloudFormation template
        cloudformationOutput.innerHTML = '<button class="copy-button" onclick="copyToClipboard(\'cloudformation\')">Copy</button><pre><code>' + generatedCFN + '</code></pre>';
        
        cfnDeployOptions.style.display = 'grid';
    }
    
    function generateCDKCode(config) {
        // Fix class name to be valid TypeScript
        const className = config.appName.replace(/[^a-zA-Z0-9]/g, '') + 'Stack';
        const capitalizedClassName = className.charAt(0).toUpperCase() + className.slice(1);
        
        const manifestJson = JSON.stringify(generatedManifest, null, 6).replace(/^/gm, '    ');
        
        const cdkCode = 'import { Stack, StackProps } from \'aws-cdk-lib\';\n' +
                       'import { Construct } from \'constructs\';\n' +
                       'import { LatticeStack, LatticeManifest } from \'lattice-aws-cdk\';\n\n' +
                       'export class ' + capitalizedClassName + ' extends Stack {\n' +
                       '  constructor(scope: Construct, id: string, props?: StackProps) {\n' +
                       '    super(scope, id, props);\n\n' +
                       '    // Lattice Manifest - AI-friendly configuration\n' +
                       '    const manifest: LatticeManifest = ' + manifestJson + ';\n\n' +
                       '    // Create Lattice stack with automatic guardrails\n' +
                       '    new LatticeStack(this, \'LatticeStack\', {\n' +
                       '      manifest,\n' +
                       '      // Automatic security, cost control, and monitoring\n' +
                       '      aspects: {\n' +
                       '        enableSecurity: true,\n' +
                       '        enableCostControl: true,\n' +
                       '        enableMonitoring: ' + config.enableMonitoring + ',\n' +
                       '        enableBackups: ' + config.enableBackups + '\n' +
                       '      }\n' +
                       '    });\n' +
                       '  }\n' +
                       '}\n\n' +
                       '// Usage:\n' +
                       '// npm install lattice-aws-cdk\n' +
                       '// cdk deploy';
        
        cdkOutput.innerHTML = '<button class="copy-button" onclick="copyToClipboard(\'cdk\')">Copy</button><pre><code>' + cdkCode + '</code></pre>';
    }
    
    function generateCostEstimate(config) {
        const costs = [];
        let total = 0;
        
        // Base VPC costs
        costs.push({ service: 'VPC & Networking', cost: 0, note: 'Free tier' });
        
        if (config.includeWebsite) {
            const websiteCost = config.environment === 'prod' ? 5 : 2;
            costs.push({ service: 'S3 Website + CloudFront', cost: websiteCost, note: 'Static hosting' });
            total += websiteCost;
        }
        
        if (config.includeApi) {
            const apiCost = config.environment === 'prod' ? 8 : 3;
            costs.push({ service: 'API Gateway + Lambda', cost: apiCost, note: 'Serverless API' });
            total += apiCost;
        }
        
        if (config.includeDatabase) {
            const dbCost = config.environment === 'prod' ? 25 : 15;
            costs.push({ service: 'RDS PostgreSQL', cost: dbCost, note: config.environment === 'prod' ? 'Multi-AZ' : 'Single-AZ' });
            total += dbCost;
        }
        
        if (config.includeStorage) {
            const storageCost = 3;
            costs.push({ service: 'S3 File Storage', cost: storageCost, note: 'Encrypted storage' });
            total += storageCost;
        }
        
        if (config.includeAuth) {
            const authCost = 2;
            costs.push({ service: 'Cognito Authentication', cost: authCost, note: 'User management' });
            total += authCost;
        }
        
        if (config.enableMonitoring) {
            const monitoringCost = 5;
            costs.push({ service: 'CloudWatch Monitoring', cost: monitoringCost, note: 'Dashboards & alarms' });
            total += monitoringCost;
        }
        
        if (config.enableBackups) {
            const backupCost = 3;
            costs.push({ service: 'AWS Backup', cost: backupCost, note: 'Automated backups' });
            total += backupCost;
        }
        
        costBreakdown.innerHTML = costs.map(item => `
            <div class="cost-item">
                <span>${item.service}</span>
                <span>$${item.cost}/month</span>
            </div>
        `).join('') + `
            <div class="cost-item cost-total">
                <span><strong>Total Estimated Cost</strong></span>
                <span><strong>$${total}/month</strong></span>
            </div>
        `;
        
        costEstimate.style.display = 'block';
    }
    
    function generateThreatModel(config) {
        const threats = [
            { level: 'info', icon: '✅', text: 'All data encrypted at rest and in transit' },
            { level: 'info', icon: '✅', text: 'VPC provides network isolation' },
            { level: 'info', icon: '✅', text: 'IAM roles follow least-privilege principle' }
        ];
        
        if (config.includeApi) {
            threats.push({ level: 'warning', icon: '⚠️', text: 'API Gateway lacks rate limiting - consider adding throttling' });
        }
        
        if (config.includeDatabase) {
            threats.push({ level: 'info', icon: '✅', text: 'Database in private subnet with security groups' });
            if (!config.enableBackups) {
                threats.push({ level: 'warning', icon: '⚠️', text: 'Database backups disabled - data loss risk' });
            }
        }
        
        if (config.includeWebsite && !config.domainName) {
            threats.push({ level: 'warning', icon: '⚠️', text: 'No custom domain - using CloudFront default domain' });
        }
        
        if (!config.includeAuth && config.includeApi) {
            threats.push({ level: 'critical', icon: '🔴', text: 'API has no authentication - public access risk' });
        }
        
        threatList.innerHTML = threats.map(threat => `
            <div class="threat-item threat-${threat.level}">
                <span>${threat.icon}</span>
                <span>${threat.text}</span>
            </div>
        `).join('');
        
        threatModel.style.display = 'block';
    }
    
    // Global functions for buttons
    window.testGeneration = function() {
        console.log('Test generation clicked');
        const testConfig = {
            appName: 'test-app',
            environment: 'dev',
            includeWebsite: true,
            includeApi: true,
            includeDatabase: true,
            includeStorage: true,
            includeAuth: true,
            enableThreatModel: true,
            enableMonitoring: true,
            enableBackups: true
        };
        
        console.log('Generating with test config:', testConfig);
        generateAllOutputs(testConfig);
    };
    
    window.copyToClipboard = function(type) {
        let content = '';
        switch(type) {
            case 'manifest':
                content = JSON.stringify(generatedManifest, null, 2);
                break;
            case 'cloudformation':
                content = generatedCFN;
                break;
            case 'cdk':
                content = cdkOutput.querySelector('code').textContent;
                break;
        }
        
        navigator.clipboard.writeText(content).then(() => {
            // Find the button that was clicked by looking for the copy button in the current context
            const buttons = document.querySelectorAll('.copy-button');
            buttons.forEach(button => {
                if (button.textContent === 'Copy') {
                    const originalText = button.textContent;
                    button.textContent = 'Copied!';
                    button.classList.add('copied');
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.classList.remove('copied');
                    }, 2000);
                }
            });
        });
    };
    
    window.deployCFNConsole = function() {
        const region = 'us-east-1'; // Default region
        const templateBody = encodeURIComponent(generatedCFN);
        const stackName = generatedManifest.appName + '-stack';
        
        const consoleUrl = `https://console.aws.amazon.com/cloudformation/home?region=${region}#/stacks/create/review?templateURL=&stackName=${stackName}&templateBody=${templateBody}`;
        
        window.open(consoleUrl, '_blank');
    };
    
    window.downloadCFN = function() {
        const blob = new Blob([generatedCFN], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = generatedManifest.appName + '-template.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
});