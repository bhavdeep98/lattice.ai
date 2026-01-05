// Playground functionality
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('intentForm');
    const resourceTypeSelect = document.getElementById('resourceType');
    const outputCode = document.getElementById('outputCode');
    const costEstimate = document.getElementById('costEstimate');
    const costBreakdown = document.getElementById('costBreakdown');
    
    // Show/hide options based on resource type
    resourceTypeSelect.addEventListener('change', function() {
        const resourceType = this.value;
        
        // Hide all option groups
        document.getElementById('storageOptions').style.display = 'none';
        document.getElementById('databaseOptions').style.display = 'none';
        document.getElementById('computeOptions').style.display = 'none';
        
        // Show relevant options
        switch(resourceType) {
            case 'storage':
                document.getElementById('storageOptions').style.display = 'block';
                break;
            case 'database':
                document.getElementById('databaseOptions').style.display = 'block';
                break;
            case 'compute':
                document.getElementById('computeOptions').style.display = 'block';
                break;
        }
    });
    
    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const intent = {};
        
        // Build intent object
        for (let [key, value] of formData.entries()) {
            intent[key] = value;
        }
        
        // Generate code based on intent
        generateLatticeCode(intent);
        generateCostEstimate(intent);
    });
    
    function generateLatticeCode(intent) {
        const { resourceType, resourceName, environment, encryption, engine, runtime } = intent;
        
        let code = '';
        let importStatement = '';
        let constructorCode = '';
        let intentJson = '';
        
        switch(resourceType) {
            case 'storage':
                importStatement = `import { LatticeBucket, applyLatticeAspects } from 'lattice-aws-cdk';`;
                intentJson = JSON.stringify({
                    name: resourceName,
                    environment: environment,
                    encryption: encryption === 'true',
                    versioning: environment === 'prod',
                    lifecycle: environment === 'prod' ? {
                        archiveAfterDays: 30,
                        deleteAfterDays: 365
                    } : undefined
                }, null, 2);
                constructorCode = `
    // 🛡️ Apply guardrails FIRST - The "Final Inspector"
    applyLatticeAspects(this, {
      environment: '${environment}',
      projectName: 'MyApp',
      owner: 'DevTeam'
    });

    // AI generates this simple JSON intent
    const storageIntent = ${intentJson};

    // Lattice handles the complex AWS implementation
    const storage = new LatticeBucket(this, 'Storage', storageIntent);
    
    // ✅ Automatically secured, cost-controlled, monitored, and backed up!
    // - Encryption: ${encryption === 'true' ? 'Enabled' : 'Disabled'}
    // - Versioning: ${environment === 'prod' ? 'Enabled' : 'Disabled'}
    // - Lifecycle: ${environment === 'prod' ? 'Archive after 30 days' : 'Basic'}
    // - Monitoring: ${environment === 'prod' ? 'Comprehensive alarms' : 'Basic monitoring'}
    // - Backups: ${environment === 'prod' ? 'Daily with 30-day retention' : 'Minimal'}`;
                break;
                
            case 'database':
                importStatement = `import { LatticeDatabase, applyLatticeAspects } from 'lattice-aws-cdk';`;
                intentJson = JSON.stringify({
                    name: resourceName,
                    environment: environment,
                    engine: engine,
                    size: environment === 'prod' ? 'large' : environment === 'staging' ? 'medium' : 'small',
                    multiAz: environment === 'prod',
                    backups: environment !== 'dev'
                }, null, 2);
                constructorCode = `
    // 🛡️ Apply guardrails FIRST - The "Final Inspector"
    applyLatticeAspects(this, {
      environment: '${environment}',
      projectName: 'MyApp',
      owner: 'DevTeam'
    });

    // AI generates this simple JSON intent
    const databaseIntent = ${intentJson};

    // Lattice handles the complex AWS implementation
    const database = new LatticeDatabase(this, 'Database', databaseIntent);
    
    // ✅ Automatically secured, cost-controlled, monitored, and backed up!
    // - Engine: ${engine.toUpperCase()}
    // - Size: ${environment === 'prod' ? 'Large (production-grade)' : environment === 'staging' ? 'Medium (balanced)' : 'Small (cost-optimized)'}
    // - Multi-AZ: ${environment === 'prod' ? 'Enabled for high availability' : 'Disabled for cost savings'}
    // - Encryption: Always enabled
    // - Monitoring: CPU, memory, connections, storage alarms
    // - Backups: ${environment !== 'dev' ? 'Automated daily backups' : 'Minimal backup strategy'}`;
                break;
                
            case 'compute':
                importStatement = `import { LatticeCompute, applyLatticeAspects } from 'lattice-aws-cdk';`;
                intentJson = JSON.stringify({
                    name: resourceName,
                    environment: environment,
                    type: 'serverless',
                    runtime: runtime,
                    size: environment === 'prod' ? 'large' : 'medium',
                    timeout: environment === 'prod' ? 30 : 15
                }, null, 2);
                constructorCode = `
    // 🛡️ Apply guardrails FIRST - The "Final Inspector"
    applyLatticeAspects(this, {
      environment: '${environment}',
      projectName: 'MyApp',
      owner: 'DevTeam'
    });

    // AI generates this simple JSON intent
    const computeIntent = ${intentJson};

    // Lattice handles the complex AWS implementation
    const compute = new LatticeCompute(this, 'Compute', computeIntent);
    
    // ✅ Automatically secured, cost-controlled, monitored, and backed up!
    // - Runtime: ${runtime.charAt(0).toUpperCase() + runtime.slice(1)}
    // - Memory: ${environment === 'prod' ? '1024MB (high performance)' : '512MB (balanced)'}
    // - Timeout: ${environment === 'prod' ? '30 seconds' : '15 seconds'}
    // - Monitoring: Errors, duration, throttles alarms
    // - Security: Least-privilege IAM role
    // - Cost Control: Environment-appropriate sizing`;
                break;
                
            case 'network':
                importStatement = `import { LatticeNetwork, applyLatticeAspects } from 'lattice-aws-cdk';`;
                intentJson = JSON.stringify({
                    cidr: '10.0.0.0/16',
                    environment: environment,
                    highAvailability: environment !== 'dev',
                    natGateways: environment === 'prod' ? 2 : 1
                }, null, 2);
                constructorCode = `
    // 🛡️ Apply guardrails FIRST - The "Final Inspector"
    applyLatticeAspects(this, {
      environment: '${environment}',
      projectName: 'MyApp',
      owner: 'DevTeam'
    });

    // AI generates this simple JSON intent
    const networkIntent = ${intentJson};

    // Lattice handles the complex AWS implementation
    const network = new LatticeNetwork(this, 'Network', networkIntent);
    
    // ✅ Automatically secured, cost-controlled, monitored, and backed up!
    // - CIDR: 10.0.0.0/16 (65,536 IP addresses)
    // - Availability Zones: ${environment !== 'dev' ? 'Multi-AZ for high availability' : 'Single AZ for cost savings'}
    // - NAT Gateways: ${environment === 'prod' ? '2 (redundant)' : '1 (cost-optimized)'}
    // - Security Groups: Least-privilege access rules
    // - Monitoring: NAT Gateway error and packet drop alarms`;
                break;
        }
        
        code = `${importStatement}
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class MyLatticeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
${constructorCode}
  }
}`;

        // Display the generated code with proper formatting
        outputCode.innerHTML = `
            <button class="copy-button" id="copyButton">Copy Code</button>
            <pre><code></code></pre>
        `;
        
        // Set the code content properly to preserve formatting
        const codeElement = outputCode.querySelector('code');
        codeElement.textContent = code;
        
        // Apply syntax highlighting
        applySyntaxHighlighting();
        
        // Add copy functionality
        const copyButton = document.getElementById('copyButton');
        copyButton.addEventListener('click', function() {
            navigator.clipboard.writeText(code).then(() => {
                copyButton.textContent = 'Copied!';
                copyButton.classList.add('copied');
                setTimeout(() => {
                    copyButton.textContent = 'Copy Code';
                    copyButton.classList.remove('copied');
                }, 2000);
            });
        });
    }
    
    function generateCostEstimate(intent) {
        const { resourceType, environment } = intent;
        
        let monthlyCost = 0;
        let breakdown = [];
        
        switch(resourceType) {
            case 'storage':
                const storageCost = environment === 'prod' ? 5 : environment === 'staging' ? 3 : 1;
                monthlyCost = storageCost;
                breakdown = [
                    `S3 Storage (50GB): $${storageCost}`,
                    `CloudWatch Monitoring: $2`,
                    `AWS Backup: ${environment === 'prod' ? '$3' : environment === 'staging' ? '$1' : '$0'}`,
                    `Total: $${monthlyCost + 2 + (environment === 'prod' ? 3 : environment === 'staging' ? 1 : 0)}`
                ];
                monthlyCost += 2 + (environment === 'prod' ? 3 : environment === 'staging' ? 1 : 0);
                break;
                
            case 'database':
                const dbCost = environment === 'prod' ? 45 : environment === 'staging' ? 25 : 15;
                monthlyCost = dbCost;
                breakdown = [
                    `RDS Instance: $${dbCost}`,
                    `Storage (20GB): $5`,
                    `Backups: ${environment !== 'dev' ? '$8' : '$0'}`,
                    `CloudWatch Monitoring: $3`,
                    `Total: $${monthlyCost + 5 + (environment !== 'dev' ? 8 : 0) + 3}`
                ];
                monthlyCost += 5 + (environment !== 'dev' ? 8 : 0) + 3;
                break;
                
            case 'compute':
                const computeCost = environment === 'prod' ? 8 : environment === 'staging' ? 5 : 2;
                monthlyCost = computeCost;
                breakdown = [
                    `Lambda Execution (1M requests): $${computeCost}`,
                    `CloudWatch Logs: $2`,
                    `CloudWatch Monitoring: $1`,
                    `Total: $${monthlyCost + 3}`
                ];
                monthlyCost += 3;
                break;
                
            case 'network':
                const networkCost = environment === 'prod' ? 90 : environment === 'staging' ? 45 : 45;
                monthlyCost = networkCost;
                breakdown = [
                    `NAT Gateway: $${networkCost}`,
                    `Data Transfer: $5`,
                    `CloudWatch Monitoring: $2`,
                    `Total: $${monthlyCost + 7}`
                ];
                monthlyCost += 7;
                break;
        }
        
        // Show cost estimate
        costEstimate.style.display = 'block';
        costBreakdown.innerHTML = breakdown.map(item => `<div>${item}</div>`).join('');
        
        // Show infrastructure preview
        generateInfrastructurePreview(intent);
    }
    
    function generateInfrastructurePreview(intent) {
        const { resourceType, environment } = intent;
        const infrastructurePreview = document.getElementById('infrastructurePreview');
        const previewContent = document.getElementById('previewContent');
        
        let resources = [];
        
        switch(resourceType) {
            case 'storage':
                resources = [
                    { icon: '🪣', name: 'S3 Bucket', details: `Encrypted, ${environment === 'prod' ? 'Versioned' : 'Basic'}` },
                    { icon: '📊', name: 'CloudWatch Alarms', details: 'Request rate, Error rate monitoring' },
                    { icon: '🏷️', name: 'Resource Tags', details: 'Environment, Project, Owner tags' },
                ];
                if (environment === 'prod') {
                    resources.push({ icon: '💾', name: 'AWS Backup', details: 'Daily backups, 30-day retention' });
                }
                break;
                
            case 'database':
                resources = [
                    { icon: '🗄️', name: 'RDS Instance', details: `${environment === 'prod' ? 'Multi-AZ' : 'Single-AZ'}, Encrypted` },
                    { icon: '🔒', name: 'Security Group', details: 'Database access rules' },
                    { icon: '📊', name: 'CloudWatch Alarms', details: 'CPU, Memory, Connections monitoring' },
                    { icon: '🏷️', name: 'Resource Tags', details: 'Environment, Project, Owner tags' },
                ];
                if (environment !== 'dev') {
                    resources.push({ icon: '💾', name: 'Automated Backups', details: 'Point-in-time recovery enabled' });
                }
                break;
                
            case 'compute':
                resources = [
                    { icon: '⚡', name: 'Lambda Function', details: `${environment === 'prod' ? '1024MB' : '512MB'} memory` },
                    { icon: '🔐', name: 'IAM Role', details: 'Least-privilege execution role' },
                    { icon: '📊', name: 'CloudWatch Alarms', details: 'Errors, Duration, Throttles monitoring' },
                    { icon: '📝', name: 'CloudWatch Logs', details: 'Function execution logs' },
                    { icon: '🏷️', name: 'Resource Tags', details: 'Environment, Project, Owner tags' },
                ];
                break;
                
            case 'network':
                resources = [
                    { icon: '🌐', name: 'VPC', details: '10.0.0.0/16 CIDR block' },
                    { icon: '🔗', name: 'Subnets', details: `${environment !== 'dev' ? 'Multi-AZ' : 'Single-AZ'} public/private` },
                    { icon: '🚪', name: 'Internet Gateway', details: 'Public internet access' },
                    { icon: '🔄', name: 'NAT Gateway', details: `${environment === 'prod' ? '2 (redundant)' : '1 (cost-optimized)'}` },
                    { icon: '🛡️', name: 'Security Groups', details: 'Network access controls' },
                    { icon: '📊', name: 'CloudWatch Alarms', details: 'NAT Gateway monitoring' },
                    { icon: '🏷️', name: 'Resource Tags', details: 'Environment, Project, Owner tags' },
                ];
                break;
        }
        
        previewContent.innerHTML = resources.map(resource => `
            <div class="aws-resource">
                <span class="resource-icon">${resource.icon}</span>
                <div>
                    <strong>${resource.name}</strong><br>
                    <small>${resource.details}</small>
                </div>
            </div>
        `).join('');
        
        infrastructurePreview.style.display = 'block';
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function applySyntaxHighlighting() {
        // Simple syntax highlighting
        const codeElement = outputCode.querySelector('code');
        if (codeElement) {
            let html = codeElement.textContent;
            
            // Escape HTML first
            html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            
            // Keywords
            html = html.replace(/\b(import|export|class|constructor|const|from|new|this|super)\b/g, '<span style="color: #569cd6;">$1</span>');
            
            // Strings
            html = html.replace(/'([^']*)'/g, '<span style="color: #ce9178;">\'$1\'</span>');
            html = html.replace(/"([^"]*)"/g, '<span style="color: #ce9178;">"$1"</span>');
            
            // Comments
            html = html.replace(/\/\/ (.*)/g, '<span style="color: #6a9955;">// $1</span>');
            
            // Class names and types
            html = html.replace(/\b(Lattice\w+|Stack|Construct|StackProps)\b/g, '<span style="color: #4ec9b0;">$1</span>');
            
            // Properties and variables
            html = html.replace(/\b(environment|projectName|owner|name|encryption|versioning|lifecycle)\b/g, '<span style="color: #9cdcfe;">$1</span>');
            
            // Booleans and numbers
            html = html.replace(/\b(true|false)\b/g, '<span style="color: #569cd6;">$1</span>');
            html = html.replace(/\b(\d+)\b/g, '<span style="color: #b5cea8;">$1</span>');
            
            codeElement.innerHTML = html;
        }
    }
    
    // Initialize with storage options visible
    document.getElementById('storageOptions').style.display = 'block';
});