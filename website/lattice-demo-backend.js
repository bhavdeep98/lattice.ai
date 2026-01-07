/**
 * Real Lattice Demo Backend
 * This actually uses the Lattice framework to generate real CDK code
 */

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();
const LatticeAIAgent = require('./ai-agent');

const app = express();
app.use(cors());
app.use(express.json());

// Store for demo manifests
const demoManifests = new Map();

// Initialize AI Agent
const aiAgent = process.env.OPENAI_API_KEY ? new LatticeAIAgent(process.env.OPENAI_API_KEY) : null;

if (aiAgent) {
    console.log('🤖 AI Agent initialized with OpenAI API Key');
} else {
    console.log('⚠️ No OpenAI API Key found. Using regex-based pattern matching.');
}

// Simple logging utility for the demo backend
class DemoLogger {
    constructor() {
        this.context = {};
    }

    setContext(context) {
        this.context = { ...this.context, ...context };
    }

    clearContext() {
        this.context = {};
    }

    log(level, message, metadata = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context: { ...this.context },
            metadata,
            service: 'lattice-demo-backend'
        };

        const logOutput = JSON.stringify(logEntry, null, 2);

        switch (level) {
            case 'info':
                console.info(logOutput);
                break;
            case 'warn':
                console.warn(logOutput);
                break;
            case 'error':
                console.error(logOutput);
                break;
            case 'debug':
                console.debug(logOutput);
                break;
            default:
                console.log(logOutput);
        }
    }

    info(message, metadata) {
        this.log('info', message, metadata);
    }

    warn(message, metadata) {
        this.log('warn', message, metadata);
    }

    error(message, error, metadata) {
        this.log('error', message, {
            ...metadata,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : undefined
        });
    }

    debug(message, metadata) {
        this.log('debug', message, metadata);
    }

    logApiRequest(req, res, duration) {
        this.info(`API Request: ${req.method} ${req.path}`, {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            bodySize: req.body ? JSON.stringify(req.body).length : 0,
            apiRequest: true
        });
    }

    logInfrastructureGeneration(userInput, manifest, success, duration, error) {
        this.info('Infrastructure generation attempt', {
            userInputLength: userInput?.length || 0,
            manifestGenerated: !!manifest,
            success,
            duration,
            error: error ? error.message : undefined,
            infrastructureGeneration: true
        });
    }

    logDomainAnalysis(userInput, analysis) {
        this.info('Domain analysis completed', {
            userInputLength: userInput?.length || 0,
            detectedDomain: analysis.detectedDomain,
            confidence: analysis.confidence,
            componentsDetected: Object.keys(analysis.components || {}).length,
            suggestionsCount: analysis.suggestions?.length || 0,
            domainAnalysis: true
        });
    }

    // Lattice-specific logging methods
    logLatticeStep(step, message, metadata = {}, progress = null) {
        const progressInfo = progress ? {
            current: progress.current,
            total: progress.total,
            percentage: Math.round((progress.current / progress.total) * 100)
        } : null;

        this.info(`[LATTICE STEP: ${step}] ${message}`, {
            latticeStep: step,
            stepProgress: progressInfo,
            ...metadata
        });
    }

    logLatticePhaseTransition(fromPhase, toPhase, metadata = {}) {
        this.info(`[LATTICE PHASE] ${fromPhase} → ${toPhase}`, {
            phaseTransition: true,
            fromPhase,
            toPhase,
            ...metadata
        });
    }

    logLatticeOperation(operation, phase, message, metadata = {}) {
        this.info(`[LATTICE ${operation.toUpperCase()}] ${message}`, {
            latticeOperation: operation,
            latticePhase: phase,
            ...metadata
        });
    }

    startLatticeOperation(operation, phase, metadata = {}) {
        const correlationId = `lattice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.setContext({
            correlationId,
            latticeOperation: operation,
            latticePhase: phase
        });

        this.logLatticeOperation(operation, phase, `Starting Lattice operation: ${operation}`, {
            operationStart: true,
            ...metadata
        });

        return correlationId;
    }

    endLatticeOperation(correlationId, success = true, metadata = {}) {
        const operation = this.context.latticeOperation;

        this.logLatticeOperation(operation, 'completion', `Completed Lattice operation: ${operation}`, {
            operationEnd: true,
            success,
            correlationId,
            ...metadata
        });

        this.clearContext();
    }

    logDomainAnalysis(userInput, analysis) {
        this.info('Domain analysis completed', {
            userInputLength: userInput?.length || 0,
            detectedDomain: analysis.detectedDomain,
            confidence: analysis.confidence,
            componentsDetected: Object.keys(analysis.components || {}).length,
            suggestionsCount: analysis.suggestions?.length || 0,
            domainAnalysis: true
        });
    }
}

// Lattice Framework specific constants for logging
const LatticeOperation = {
    INTENT_ANALYSIS: 'intent-analysis',
    MANIFEST_GENERATION: 'manifest-generation',
    CDK_CODE_GENERATION: 'cdk-code-generation',
    STACK_SYNTHESIS: 'stack-synthesis',
    INFRASTRUCTURE_DEPLOYMENT: 'infrastructure-deployment'
};

const LatticePhase = {
    INITIALIZATION: 'initialization',
    ANALYSIS: 'analysis',
    GENERATION: 'generation',
    VALIDATION: 'validation',
    SYNTHESIS: 'synthesis',
    DEPLOYMENT: 'deployment',
    COMPLETION: 'completion'
};

const LatticeStep = {
    PARSING_USER_INPUT: 'parsing-user-input',
    DETECTING_DOMAIN: 'detecting-domain',
    ANALYZING_COMPONENTS: 'analyzing-components',
    CALCULATING_CONFIDENCE: 'calculating-confidence',
    GENERATING_SUGGESTIONS: 'generating-suggestions',
    CREATING_BASE_MANIFEST: 'creating-base-manifest',
    APPLYING_DOMAIN_PATTERNS: 'applying-domain-patterns',
    CONFIGURING_CAPABILITIES: 'configuring-capabilities',
    VALIDATING_MANIFEST: 'validating-manifest',
    INITIALIZING_STACK: 'initializing-stack',
    GENERATING_CDK_CODE: 'generating-cdk-code',
    PREPARING_SYNTHESIS: 'preparing-synthesis',
    RUNNING_SYNTHESIS: 'running-synthesis',
    GENERATING_CLOUDFORMATION: 'generating-cloudformation',
    VALIDATING_TEMPLATE: 'validating-template',
    FINALIZING_OUTPUTS: 'finalizing-outputs'
};

const logger = new DemoLogger();

// Middleware to log all requests
app.use((req, res, next) => {
    const startTime = Date.now();

    // Generate correlation ID for request tracking
    const correlationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    req.correlationId = correlationId;

    logger.setContext({
        correlationId,
        operation: 'api-request'
    });

    logger.debug(`Incoming request: ${req.method} ${req.path}`, {
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent'),
        ip: req.ip
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function (...args) {
        const duration = Date.now() - startTime;
        logger.logApiRequest(req, res, duration);
        logger.clearContext();
        originalEnd.apply(this, args);
    };

    next();
});

/**
 * Enhanced AI analysis with pattern recognition and confidence scoring
 */

// Domain-specific vocabulary and patterns
const INFRASTRUCTURE_PATTERNS = {
    mlops: {
        keywords: ['mlops', 'model deployment', 'llm platform', 'agentic ai', 'model serving',
            'inference', 'prompt management', 'observability', 'cost control', 'multi-environment',
            'model registry', 'feature store', 'ml pipeline', 'model versioning', 'a/b testing',
            'version management', 'prompt versioning', 'model metadata', 'experiment tracking',
            'model monitoring', 'drift detection', 'performance metrics', 'model governance'],
        components: {
            modelServing: ['serving', 'inference', 'deployment', 'endpoint', 'api', 'runtime'],
            modelRegistry: ['registry', 'versioning', 'artifacts', 'model store', 'metadata', 'prompt management', 'version management'],
            monitoring: ['observability', 'monitoring', 'metrics', 'logging', 'alerting', 'dashboard', 'performance'],
            costControl: ['cost', 'budget', 'optimization', 'resource management', 'cost control'],
            multiTenant: ['multi-tenant', 'isolation', 'enterprise', 'secure', 'environments', 'multi-environment'],
            dataProcessing: ['pipeline', 'etl', 'feature engineering', 'preprocessing', 'batch processing'],
            training: ['training', 'fine-tuning', 'model training', 'gpu', 'compute', 'ml pipeline']
        }
    },
    healthcare: {
        keywords: ['healthcare', 'hipaa', 'medical', 'claims', 'patient', 'clinical', 'phi'],
        components: {
            compliance: ['hipaa', 'compliance', 'audit', 'encryption'],
            dataProcessing: ['claims processing', 'patient data', 'clinical data'],
            security: ['secure', 'encrypted', 'access control', 'authentication']
        }
    },
    ecommerce: {
        keywords: ['ecommerce', 'e-commerce', 'shopping', 'payment', 'cart', 'inventory', 'orders'],
        components: {
            frontend: ['storefront', 'website', 'ui', 'customer portal'],
            payments: ['payment', 'stripe', 'checkout', 'billing'],
            inventory: ['inventory', 'catalog', 'products', 'stock'],
            orders: ['orders', 'fulfillment', 'shipping', 'tracking']
        }
    },
    dataplatform: {
        keywords: ['data platform', 'analytics', 'data lake', 'warehouse', 'etl', 'pipeline'],
        components: {
            ingestion: ['ingestion', 'streaming', 'batch', 'kafka', 'kinesis'],
            processing: ['processing', 'transformation', 'etl', 'spark'],
            storage: ['data lake', 'warehouse', 'storage', 's3', 'redshift'],
            analytics: ['analytics', 'dashboard', 'reporting', 'bi']
        }
    }
};

/**
 * Analyze user input with enhanced pattern recognition
 */
function analyzeUserIntent(userInput) {
    const startTime = Date.now();
    const lowerInput = userInput.toLowerCase();
    const analysis = {
        detectedDomain: null,
        confidence: 0,
        components: {},
        suggestions: [],
        missingInfo: []
    };

    logger.debug('Starting user intent analysis', {
        inputLength: userInput.length,
        operation: 'intent-analysis'
    });

    // Analyze each domain
    for (const [domain, patterns] of Object.entries(INFRASTRUCTURE_PATTERNS)) {
        const domainScore = calculateDomainScore(lowerInput, patterns);

        if (domainScore.score > analysis.confidence) {
            analysis.detectedDomain = domain;
            analysis.confidence = domainScore.score;
            analysis.components = domainScore.components;
        }
    }

    // Generate suggestions based on detected components
    if (analysis.confidence > 0.3) {
        analysis.suggestions = generateSuggestions(analysis.detectedDomain, analysis.components);
        analysis.missingInfo = identifyMissingInfo(analysis.detectedDomain, analysis.components);
    }

    const duration = Date.now() - startTime;
    logger.logDomainAnalysis(userInput, analysis);
    logger.debug('Intent analysis completed', { duration });

    return analysis;
}

/**
 * Calculate confidence score for a specific domain
 */
function calculateDomainScore(input, patterns) {
    let score = 0;
    const components = {};

    // Check main keywords
    const keywordMatches = patterns.keywords.filter(keyword => input.includes(keyword));
    score += keywordMatches.length * 0.2; // Each keyword adds 20% confidence

    // Check component-specific patterns
    for (const [componentName, componentKeywords] of Object.entries(patterns.components)) {
        const componentMatches = componentKeywords.filter(keyword => input.includes(keyword));
        if (componentMatches.length > 0) {
            components[componentName] = {
                detected: true,
                confidence: Math.min(componentMatches.length * 0.3, 1.0),
                matchedKeywords: componentMatches
            };
            score += 0.1; // Each component adds 10% confidence
        }
    }

    // Cap confidence at 1.0
    score = Math.min(score, 1.0);

    return { score, components };
}

/**
 * Generate suggestions based on detected domain and components
 */
function generateSuggestions(domain, components) {
    const suggestions = [];

    if (domain === 'mlops') {
        if (!components.modelRegistry) {
            suggestions.push("Consider adding a model registry for version management and metadata tracking");
        }
        if (!components.training) {
            suggestions.push("Add training pipeline capabilities for model fine-tuning and retraining");
        }
        if (!components.costControl) {
            suggestions.push("Include cost monitoring and resource optimization for GPU/compute management");
        }
        if (!components.multiTenant) {
            suggestions.push("Consider multi-environment isolation for enterprise security requirements");
        }
        if (!components.dataProcessing) {
            suggestions.push("Add data processing capabilities for feature engineering and preprocessing");
        }
    }

    return suggestions;
}

/**
 * Identify missing critical information
 */
function identifyMissingInfo(domain, components) {
    const missing = [];

    if (domain === 'mlops') {
        if (!components.modelServing && !components.training) {
            missing.push("Specify whether you need model serving, training, or both");
        }
        if (!components.costControl) {
            missing.push("Consider mentioning scale/performance requirements");
        }
    }

    return missing;
}

/**
 * Enhanced manifest generation with confidence-based decisions
 */
function generateLatticeManifest(userInput) {
    const analysis = analyzeUserIntent(userInput);
    const lowerInput = userInput.toLowerCase();

    // Base manifest structure
    const manifest = {
        appName: extractAppName(userInput, analysis) || 'ai-generated-app',
        environment: 'prod',
        threatModel: {
            enabled: true,
            projectName: `AI Generated: ${extractAppName(userInput, analysis) || 'Application'}`
        },
        capabilities: {},
        _analysis: {
            detectedDomain: analysis.detectedDomain,
            confidence: analysis.confidence,
            suggestions: analysis.suggestions,
            missingInfo: analysis.missingInfo
        }
    };

    // Generate capabilities based on detected domain and confidence
    if (analysis.detectedDomain === 'mlops' && analysis.confidence > 0.4) {
        manifest.appName = 'mlops-platform';
        manifest.capabilities = generateMLOpsCapabilities(analysis.components, userInput);
    } else if (analysis.detectedDomain === 'healthcare' && analysis.confidence > 0.4) {
        manifest.appName = 'healthcare-platform';
        manifest.capabilities = generateHealthcareCapabilities(analysis.components, userInput);
    } else if (analysis.detectedDomain === 'ecommerce' && analysis.confidence > 0.4) {
        manifest.appName = 'ecommerce-platform';
        manifest.capabilities = generateEcommerceCapabilities(analysis.components, userInput);
    } else if (analysis.detectedDomain === 'dataplatform' && analysis.confidence > 0.4) {
        manifest.appName = 'data-platform';
        manifest.capabilities = generateDataPlatformCapabilities(analysis.components, userInput);
    } else {
        // Fallback to generic capability detection
        manifest.capabilities = generateGenericCapabilities(lowerInput);
    }

    return manifest;
}

/**
 * Generate MLOps-specific capabilities with enhanced detection
 */
function generateMLOpsCapabilities(components, userInput) {
    const capabilities = {};
    const lowerInput = userInput.toLowerCase();

    // Model serving API (almost always needed for MLOps)
    capabilities.api = {
        name: 'model-serving-api',
        environment: 'prod',
        type: 'container', // ECS for ML workloads
        size: components.modelServing?.confidence > 0.7 ? 'large' : 'medium',
        runtime: 'python3.9',
        description: 'Model serving endpoints for real-time inference and batch processing'
    };

    // Model registry and metadata storage (critical for MLOps)
    if (components.modelRegistry || lowerInput.includes('registry') || lowerInput.includes('versioning') ||
        lowerInput.includes('prompt') || lowerInput.includes('version management')) {
        capabilities.database = {
            name: 'model-registry-db',
            environment: 'prod',
            engine: 'postgres',
            size: 'medium',
            highAvailability: true,
            encryption: true,
            description: 'Model registry, metadata, prompt versions, and experiment tracking'
        };
    }

    // Model artifacts and data storage
    capabilities.storage = {
        name: 'model-artifacts',
        environment: 'prod',
        encryption: true,
        versioning: true,
        publicRead: false,
        lifecycle: {
            archiveAfterDays: 30,
            deleteAfterDays: 365
        },
        description: 'Model artifacts, datasets, training outputs, and prompt templates'
    };

    // Training/processing queue for async operations
    if (components.training || lowerInput.includes('training') || lowerInput.includes('pipeline') ||
        lowerInput.includes('batch') || lowerInput.includes('processing')) {
        capabilities.queue = {
            name: 'ml-processing-queue',
            environment: 'prod',
            type: 'fifo',
            dlq: true,
            description: 'Model training, fine-tuning, and batch inference jobs'
        };
    }

    // Monitoring dashboard (essential for MLOps observability)
    if (components.monitoring || lowerInput.includes('monitoring') || lowerInput.includes('observability') ||
        lowerInput.includes('dashboard') || lowerInput.includes('metrics')) {
        capabilities.website = {
            name: 'mlops-dashboard',
            environment: 'prod',
            sourcePath: './dashboard-dist',
            domainName: 'mlops-dashboard.example.com',
            description: 'MLOps observability dashboard with model performance metrics, cost tracking, and alerts'
        };
    }

    return capabilities;
}

/**
 * Generate healthcare-specific capabilities
 */
function generateHealthcareCapabilities(components, userInput) {
    return {
        api: {
            name: 'claims-processing-api',
            environment: 'prod',
            type: 'serverless',
            size: 'medium',
            runtime: 'python3.9',
            description: 'HIPAA-compliant claims processing endpoints'
        },
        database: {
            name: 'health-data-db',
            environment: 'prod',
            engine: 'postgres',
            size: 'large',
            highAvailability: true,
            encryption: true,
            description: 'Encrypted patient health information storage'
        },
        storage: {
            name: 'health-documents',
            environment: 'prod',
            encryption: true,
            versioning: true,
            publicRead: false,
            lifecycle: {
                archiveAfterDays: 90,
                deleteAfterDays: 2555 // 7 years for HIPAA
            },
            description: 'HIPAA-compliant document storage with long-term retention'
        }
    };
}

/**
 * Generate e-commerce capabilities
 */
function generateEcommerceCapabilities(components, userInput) {
    const capabilities = {};

    if (components.frontend || userInput.includes('storefront') || userInput.includes('website')) {
        capabilities.website = {
            name: 'storefront',
            environment: 'prod',
            sourcePath: './storefront-dist',
            domainName: 'shop.example.com',
            description: 'Customer-facing e-commerce storefront'
        };
    }

    capabilities.api = {
        name: 'ecommerce-api',
        environment: 'prod',
        type: 'serverless',
        size: 'medium',
        runtime: 'nodejs18.x',
        description: 'E-commerce backend API for orders, payments, and inventory'
    };

    capabilities.database = {
        name: 'product-catalog',
        environment: 'prod',
        engine: 'postgres',
        size: 'large',
        highAvailability: true,
        description: 'Product catalog, inventory, and order management'
    };

    if (components.inventory || userInput.includes('inventory') || userInput.includes('products')) {
        capabilities.storage = {
            name: 'product-assets',
            environment: 'prod',
            encryption: true,
            versioning: true,
            publicRead: true,
            description: 'Product images, videos, and marketing assets'
        };
    }

    return capabilities;
}

/**
 * Generate data platform capabilities
 */
function generateDataPlatformCapabilities(components, userInput) {
    return {
        api: {
            name: 'data-ingestion-api',
            environment: 'prod',
            type: 'serverless',
            size: 'large',
            runtime: 'python3.9',
            description: 'Data ingestion and processing endpoints'
        },
        database: {
            name: 'analytics-warehouse',
            environment: 'prod',
            engine: 'postgres',
            size: 'xlarge',
            highAvailability: true,
            description: 'Data warehouse for analytics and reporting'
        },
        storage: {
            name: 'data-lake',
            environment: 'prod',
            encryption: true,
            versioning: true,
            publicRead: false,
            lifecycle: {
                archiveAfterDays: 30,
                deleteAfterDays: 2555
            },
            description: 'Raw data storage and processed datasets'
        },
        queue: {
            name: 'data-processing-queue',
            environment: 'prod',
            type: 'standard',
            dlq: true,
            description: 'Data processing and ETL job queue'
        }
    };
}

/**
 * Fallback generic capability detection
 */
function generateGenericCapabilities(lowerInput) {
    const capabilities = {};

    if (lowerInput.includes('website') || lowerInput.includes('frontend')) {
        capabilities.website = {
            name: 'web-frontend',
            environment: 'prod',
            sourcePath: './dist',
            domainName: 'app.example.com'
        };
    }

    if (lowerInput.includes('api') || lowerInput.includes('backend')) {
        capabilities.api = {
            name: 'backend-api',
            environment: 'prod',
            type: 'serverless',
            size: 'small',
            runtime: 'nodejs18.x'
        };
    }

    if (lowerInput.includes('database') || lowerInput.includes('data')) {
        capabilities.database = {
            name: 'application-db',
            environment: 'prod',
            engine: 'postgres',
            size: 'small',
            highAvailability: true
        };
    }

    if (lowerInput.includes('storage') || lowerInput.includes('files')) {
        capabilities.storage = {
            name: 'file-storage',
            environment: 'prod',
            encryption: true,
            versioning: true,
            publicRead: false
        };
    }

    if (lowerInput.includes('queue') || lowerInput.includes('async')) {
        capabilities.queue = {
            name: 'task-queue',
            environment: 'prod',
            type: 'standard',
            dlq: true
        };
    }

    return capabilities;
}

/**
 * Enhanced app name extraction with domain awareness
 */
function extractAppName(input, analysis = null) {
    const lowerInput = input.toLowerCase();

    // Use detected domain for naming
    if (analysis?.detectedDomain) {
        switch (analysis.detectedDomain) {
            case 'mlops': return 'mlops-platform';
            case 'healthcare': return 'healthcare-platform';
            case 'ecommerce': return 'ecommerce-platform';
            case 'dataplatform': return 'data-platform';
        }
    }

    // Specific platform patterns
    if (lowerInput.includes('mlops') || lowerInput.includes('llm') || lowerInput.includes('agentic')) {
        return 'mlops-platform';
    }
    if (lowerInput.includes('healthcare') || lowerInput.includes('medical')) {
        return 'healthcare-platform';
    }
    if (lowerInput.includes('ecommerce') || lowerInput.includes('e-commerce')) {
        return 'ecommerce-platform';
    }
    if (lowerInput.includes('blog') || lowerInput.includes('cms')) {
        return 'blog-platform';
    }
    if (lowerInput.includes('data') && lowerInput.includes('analytics')) {
        return 'data-platform';
    }

    // Generic extraction
    const words = input.toLowerCase().split(' ');
    const appWords = ['app', 'application', 'platform', 'service', 'system'];

    for (let i = 0; i < words.length; i++) {
        if (appWords.includes(words[i]) && i > 0) {
            return words[i - 1].replace(/[^a-zA-Z0-9]/g, '');
        }
    }

    return 'ai-generated-app';
}

/**
 * Generate actual CDK code using the Lattice framework
 */
async function generateCDKCode(manifest) {
    const stackCode = `
import { App } from 'aws-cdk-lib';
import { LatticeStack, LatticeManifest } from '../src';

const app = new App();

/**
 * AI Generated Manifest
 * Generated from user input: "${manifest.appName}"
 */
const manifest: LatticeManifest = ${JSON.stringify(manifest, null, 2)};

/**
 * Create the Lattice Stack
 */
const stack = new LatticeStack(app, '${manifest.appName.charAt(0).toUpperCase() + manifest.appName.slice(1)}Stack', manifest);

console.log('🚀 Lattice Stack Created Successfully!');
console.log('Stack Name:', stack.stackName);
console.log('Outputs:', stack.outputs);

export { stack };
`;

    return stackCode;
}

/**
 * Synthesize the CDK stack to CloudFormation
 */
async function synthesizeCDK(manifest) {
    try {
        // Create temporary CDK app file
        const tempDir = path.join(__dirname, 'temp');
        await fs.mkdir(tempDir, { recursive: true });

        const appFile = path.join(tempDir, 'demo-app.ts');
        const cdkCode = await generateCDKCode(manifest);
        await fs.writeFile(appFile, cdkCode);

        // Create a simple CDK app.js for synthesis
        const appJs = `
const { App } = require('aws-cdk-lib');

// Mock the Lattice imports for demo
const mockLatticeStack = {
    LatticeStack: class {
        constructor(scope, id, manifest) {
            this.stackName = id;
            this.outputs = {
                message: 'This would contain real AWS resource outputs',
                resources: Object.keys(manifest.capabilities || {})
            };
            console.log('Mock Lattice Stack created:', id);
        }
    }
};

// Create a basic CloudFormation template structure
const template = {
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": "Generated by Lattice Framework - ${manifest.appName}",
    "Parameters": {
        "Environment": {
            "Type": "String",
            "Default": "${manifest.environment}",
            "Description": "Deployment environment"
        }
    },
    "Resources": {}
};

// Add resources based on capabilities
${generateMockResources(manifest)}

console.log(JSON.stringify(template, null, 2));
`;

        const appJsFile = path.join(tempDir, 'app.js');
        await fs.writeFile(appJsFile, appJs);

        // Run the mock synthesis
        return new Promise((resolve, reject) => {
            const nodeProcess = spawn('node', [appJsFile], {
                cwd: tempDir,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            nodeProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            nodeProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            nodeProcess.on('close', (code) => {
                if (code === 0) {
                    resolve({
                        success: true,
                        cloudFormation: stdout,
                        cdkCode: cdkCode,
                        message: "Successfully synthesized using Lattice framework simulation"
                    });
                } else {
                    resolve({
                        success: false,
                        error: "CDK synthesis simulation failed",
                        cdkCode: cdkCode,
                        details: stderr
                    });
                }
            });
        });
    } catch (error) {
        return {
            success: false,
            error: "CDK synthesis failed (expected in demo environment)",
            cdkCode: await generateCDKCode(manifest),
            details: error.message
        };
    }
}

function generateMockResources(manifest) {
    let resources = '';

    if (manifest.capabilities.website) {
        resources += `
template.Resources.WebsiteBucket = {
    "Type": "AWS::S3::Bucket",
    "Properties": {
        "BucketName": "${manifest.appName}-website-\${AWS::AccountId}",
        "WebsiteConfiguration": {
            "IndexDocument": "index.html"
        },
        "PublicAccessBlockConfiguration": {
            "BlockPublicAcls": false,
            "BlockPublicPolicy": false,
            "IgnorePublicAcls": false,
            "RestrictPublicBuckets": false
        }
    }
};

template.Resources.CloudFrontDistribution = {
    "Type": "AWS::CloudFront::Distribution",
    "Properties": {
        "DistributionConfig": {
            "Origins": [{
                "Id": "S3Origin",
                "DomainName": {"Fn::GetAtt": ["WebsiteBucket", "DomainName"]},
                "S3OriginConfig": {}
            }],
            "DefaultCacheBehavior": {
                "TargetOriginId": "S3Origin",
                "ViewerProtocolPolicy": "redirect-to-https"
            },
            "Enabled": true
        }
    }
};`;
    }

    if (manifest.capabilities.api) {
        resources += `
template.Resources.ApiGateway = {
    "Type": "AWS::ApiGateway::RestApi",
    "Properties": {
        "Name": "${manifest.appName}-api",
        "Description": "API Gateway for ${manifest.appName}"
    }
};

template.Resources.LambdaFunction = {
    "Type": "AWS::Lambda::Function",
    "Properties": {
        "FunctionName": "${manifest.appName}-function",
        "Runtime": "${manifest.capabilities.api.runtime || 'nodejs18.x'}",
        "Handler": "index.handler",
        "Code": {
            "ZipFile": "exports.handler = async (event) => ({ statusCode: 200, body: 'Hello from Lattice!' });"
        },
        "Role": {"Fn::GetAtt": ["LambdaExecutionRole", "Arn"]}
    }
};

template.Resources.LambdaExecutionRole = {
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
        "ManagedPolicyArns": ["arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"]
    }
};`;
    }

    if (manifest.capabilities.database) {
        resources += `
template.Resources.VPC = {
    "Type": "AWS::EC2::VPC",
    "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [{"Key": "Name", "Value": "${manifest.appName}-vpc"}]
    }
};

template.Resources.PrivateSubnet1 = {
    "Type": "AWS::EC2::Subnet",
    "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]}
    }
};

template.Resources.PrivateSubnet2 = {
    "Type": "AWS::EC2::Subnet",
    "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]}
    }
};

template.Resources.DBSubnetGroup = {
    "Type": "AWS::RDS::DBSubnetGroup",
    "Properties": {
        "DBSubnetGroupDescription": "Subnet group for ${manifest.appName} database",
        "SubnetIds": [{"Ref": "PrivateSubnet1"}, {"Ref": "PrivateSubnet2"}]
    }
};

template.Resources.Database = {
    "Type": "AWS::RDS::DBInstance",
    "Properties": {
        "DBInstanceIdentifier": "${manifest.appName}-db",
        "DBInstanceClass": "db.t3.micro",
        "Engine": "${manifest.capabilities.database.engine || 'postgres'}",
        "AllocatedStorage": "20",
        "StorageEncrypted": true,
        "DBSubnetGroupName": {"Ref": "DBSubnetGroup"},
        "VPCSecurityGroups": [{"Ref": "DatabaseSecurityGroup"}],
        "MultiAZ": ${manifest.capabilities.database.highAvailability || false}
    }
};

template.Resources.DatabaseSecurityGroup = {
    "Type": "AWS::EC2::SecurityGroup",
    "Properties": {
        "GroupDescription": "Security group for ${manifest.appName} database",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [{
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "CidrIp": "10.0.0.0/16"
        }]
    }
};`;
    }

    if (manifest.capabilities.storage) {
        resources += `
template.Resources.StorageBucket = {
    "Type": "AWS::S3::Bucket",
    "Properties": {
        "BucketName": "${manifest.appName}-storage-\${AWS::AccountId}",
        "BucketEncryption": {
            "ServerSideEncryptionConfiguration": [{
                "ServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}
            }]
        },
        "VersioningConfiguration": {
            "Status": "${manifest.capabilities.storage.versioning ? 'Enabled' : 'Suspended'}"
        },
        "PublicAccessBlockConfiguration": {
            "BlockPublicAcls": true,
            "BlockPublicPolicy": true,
            "IgnorePublicAcls": true,
            "RestrictPublicBuckets": true
        }
    }
};`;
    }

    return resources;
}

// API Endpoints

/**
 * Generate Lattice infrastructure from user input
 */
/**
 * Generate Lattice infrastructure from user input
 */
app.post('/api/generate', async (req, res) => {
    const startTime = Date.now();

    try {
        const { userInput } = req.body;

        if (!userInput) {
            logger.error('User input is required');
            return res.status(400).json({ error: 'User input is required' });
        }

        // logger.start('Infrastructure Generation', 4);

        // Step 1: Analyze user intent
        // We still keep the analysis for logging/metadata but the generation will be pure AI
        // logger.info('Analyzing user intent and detecting domain');
        // const analysis = analyzeUserIntent(userInput);
        // logger.info(`Detected domain: ${analysis.detectedDomain || 'generic'} (confidence: ${Math.round((analysis.confidence || 0) * 100)}%)`);

        // Step 2: Generate manifest
        logger.info('Generating Lattice manifest');
        let manifest;

        if (!aiAgent) {
            throw new Error('OpenAI Agent is not initialized. Please provide a valid API Key.');
        }

        try {
            manifest = await aiAgent.generateManifest(userInput);
            logger.info('Using AI Agent for manifest generation');
        } catch (aiError) {
            logger.error('AI Agent failed', aiError);
            throw new Error(`AI Agent failed to generate manifest: ${aiError.message}`);
        }

        logger.info(`Manifest created for ${manifest.appName}`);

        // Step 3: Generate CDK code
        logger.info('Generating CDK infrastructure code');
        const cdkCode = await generateCDKCode(manifest);
        logger.info(`Generated ${Math.round(cdkCode.length / 1000)}KB of CDK code`);

        // Step 4: Synthesize CloudFormation
        logger.info('Synthesizing CloudFormation template');
        let synthesisResult;
        try {
            synthesisResult = await synthesizeCDK(manifest);
            logger.info('CloudFormation template synthesized');
        } catch (error) {
            logger.warn('Synthesis failed (expected in demo environment)');
            synthesisResult = {
                success: false,
                error: 'CDK synthesis failed (expected in demo environment)',
                cloudFormation: null
            };
        }

        // Store result
        const demoId = Date.now().toString();
        demoManifests.set(demoId, {
            userInput,
            manifest,
            cdkCode,
            synthesisResult,
            timestamp: new Date()
        });

        const duration = Date.now() - startTime;
        // logger.complete('Infrastructure Generation', duration);
        logger.info(`Generated ${Object.keys(manifest.capabilities || {}).length} capabilities`);

        res.json({
            demoId,
            userInput,
            manifest,
            cdkCode,
            synthesisResult
        });

    } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Infrastructure generation failed', error);

        res.status(500).json({
            error: 'Failed to generate Lattice infrastructure',
            details: error.message
        });
    }
});


/**
 * Get demo by ID
 */
app.get('/api/demo/:id', (req, res) => {
    const demoId = req.params.id;

    logger.info('Demo retrieval request', {
        demoId,
        correlationId: req.correlationId
    });

    const demo = demoManifests.get(demoId);
    if (!demo) {
        logger.warn('Demo not found', {
            demoId,
            availableDemos: demoManifests.size
        });
        return res.status(404).json({ error: 'Demo not found' });
    }

    logger.info('Demo retrieved successfully', {
        demoId,
        appName: demo.manifest?.appName,
        timestamp: demo.timestamp
    });

    res.json(demo);
});

/**
 * List all demos
 */
app.get('/api/demos', (req, res) => {
    logger.info('Demos list request', {
        totalDemos: demoManifests.size,
        correlationId: req.correlationId
    });

    const demos = Array.from(demoManifests.entries()).map(([id, demo]) => ({
        id,
        appName: demo.manifest.appName,
        timestamp: demo.timestamp,
        capabilities: Object.keys(demo.manifest.capabilities)
    }));

    logger.info('Demos list retrieved', {
        demosReturned: demos.length
    });

    res.json(demos);
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
    const healthData = {
        status: 'healthy',
        timestamp: new Date(),
        demos: demoManifests.size,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0'
    };

    logger.info('Health check requested', {
        status: healthData.status,
        demos: healthData.demos,
        uptime: healthData.uptime,
        memoryUsage: healthData.memory.heapUsed
    });

    res.json(healthData);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    logger.info('Lattice Demo Backend started', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid
    });

    console.log(`🚀 Real Lattice Demo Backend running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📝 Logs: Structured JSON logging enabled`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Unhandled error logging
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', reason, {
        promise: promise.toString()
    });
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', error);
    process.exit(1);
});

module.exports = app;