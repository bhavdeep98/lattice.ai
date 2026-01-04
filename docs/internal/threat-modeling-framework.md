# AWS Threat Modeling Framework

## Purpose
This document provides a structured framework for conducting threat modeling on AWS architectures. It serves as a template for generating comprehensive threat models across different AWS deployment patterns.

## Threat Model Template Structure

### 1. Architecture Overview
**Components**: List all AWS services and custom components
**Data Flow**: Map the complete request/response flow
**Why This Architecture**: Business justification and common use cases

### 2. Trust Boundaries (Critical Foundation)
Define security perimeters where privilege levels change:
- **Internet → Entry Point**: Untrusted traffic boundary
- **Service → Service**: Authentication/authorization boundaries  
- **Application → Data**: Data access boundaries
- **AWS Account**: Blast radius containment

### 3. Assets Classification
Rank assets by business impact:
- **Critical**: Customer data, credentials, financial data
- **High**: Application logic, internal systems access
- **Medium**: Logs, metadata, configuration
- **Low**: Public documentation, cached data

### 4. STRIDE Threat Analysis
For each component, analyze:

#### A. Spoofing (Identity Attacks)
- **Threat**: Impersonation of legitimate users/services
- **Attack Paths**: Authentication bypass methods
- **Mitigations**: Identity verification controls

#### B. Tampering (Data/Code Integrity)
- **Threat**: Unauthorized modification of data or logic
- **Attack Paths**: Input validation failures, direct access
- **Mitigations**: Validation, access controls, immutability

#### C. Repudiation (Accountability Gaps)
- **Threat**: Actions without audit trail
- **Attack Paths**: Missing logs, log tampering
- **Mitigations**: Comprehensive logging, log integrity

#### D. Information Disclosure (Data Exposure)
- **Threat**: Unauthorized data access
- **Attack Paths**: Over-permissive access, data leakage
- **Mitigations**: Encryption, least privilege, data classification

#### E. Denial of Service (Availability Attacks)
- **Threat**: Service disruption or resource exhaustion
- **Attack Paths**: Resource flooding, expensive operations
- **Mitigations**: Rate limiting, resource caps, monitoring

#### F. Elevation of Privilege (Permission Escalation)
- **Threat**: Gaining unauthorized elevated access
- **Attack Paths**: IAM misconfigurations, role chaining
- **Mitigations**: Least privilege, regular reviews, monitoring

### 5. Risk Assessment Matrix
**Risk = Likelihood × Impact**

| Risk Level | Severity | Priority | Example |
|------------|----------|----------|---------|
| Critical | High/High | P0 | IAM wildcard permissions |
| High | High/Med or Med/High | P1 | Missing API authentication |
| Medium | Med/Med | P2 | Verbose error messages |
| Low | Low/Any or Any/Low | P3 | Information disclosure in logs |

### 6. AWS Security Review Checklist
- [ ] Trust boundaries clearly defined
- [ ] IAM follows least privilege principle
- [ ] Comprehensive logging enabled
- [ ] Preventive controls implemented
- [ ] Detective controls in place
- [ ] Incident response procedures defined

### 7. Architecture-Specific Considerations
Different AWS patterns require focused analysis:
- **Serverless**: Function permissions, event sources
- **Container**: Image security, orchestration access
- **Data Pipeline**: Data flow security, transformation integrity
- **ML/AI**: Model access, training data protection

---

## Architecture-Specific Threat Models

## Example 1: Serverless Public API

### 1. Architecture Overview
**Components**:
- API Gateway (public endpoint)
- Lambda (business logic)
- DynamoDB (data persistence)
- IAM (access control)
- CloudWatch/CloudTrail (monitoring)

**Data Flow**: 
User → API Gateway → Lambda → DynamoDB → Lambda → API Gateway → User

**Why This Architecture**: 
Widely used for SaaS backends, mobile apps, internal tools. Provides scalability, cost efficiency, and reduced operational overhead.

### 2. Trust Boundaries
| Boundary | Security Significance |
|----------|----------------------|
| Internet → API Gateway | Untrusted traffic enters system |
| API Gateway → Lambda | Authentication & validation boundary |
| Lambda → DynamoDB | Data access privilege boundary |
| AWS Account | Blast-radius containment boundary |

### 3. Assets Classification
| Asset | Value | Justification |
|-------|-------|---------------|
| User data in DynamoDB | Critical | Core business asset, regulatory compliance |
| Lambda execution role | Critical | Can access all system resources |
| API endpoints | High | Business logic exposure |
| CloudWatch logs | Medium | May contain sensitive debugging info |

### 4. STRIDE Analysis

#### A. Spoofing
**Threat**: Attacker impersonates legitimate user or service
**Attack Paths**:
- Unauthenticated API endpoints
- Stolen/leaked API keys
- Session hijacking

**Mitigations**:
- Implement Cognito User Pools or IAM authentication
- Use short-lived tokens with refresh mechanism
- Enforce HTTPS with proper certificate validation
- Implement request signing for service-to-service calls

#### B. Tampering
**Threat**: Malicious modification of data or application logic
**Attack Paths**:
- Unvalidated JSON payloads causing injection
- Direct DynamoDB access bypassing business logic
- Lambda code modification through deployment pipeline compromise

**Mitigations**:
- Strict input validation with schema enforcement
- DynamoDB access only through Lambda with proper IAM roles
- Code signing and deployment pipeline security
- Immutable infrastructure patterns

#### C. Repudiation
**Threat**: Actions performed without accountability
**Attack Paths**:
- Missing or incomplete audit logs
- Log tampering or deletion
- Anonymous API access

**Mitigations**:
- Enable CloudTrail for all regions and services
- Configure API Gateway access logging
- Implement request correlation IDs
- Use CloudWatch Logs with retention policies
- Enable log file integrity validation

#### D. Information Disclosure
**Threat**: Unauthorized access to sensitive information
**Attack Paths**:
- Over-permissive IAM policies
- Sensitive data in logs or error messages
- Misconfigured API responses
- DynamoDB table scanning

**Mitigations**:
- Enable DynamoDB encryption at rest (KMS)
- Implement least-privilege IAM policies
- Sanitize error responses and logs
- Use VPC endpoints for private communication
- Implement proper data classification and handling

#### E. Denial of Service
**Threat**: Service unavailability or cost explosion
**Attack Paths**:
- API Gateway flooding
- Expensive Lambda operations
- DynamoDB throttling through excessive requests
- Memory/timeout exhaustion

**Mitigations**:
- Configure API Gateway throttling and usage plans
- Implement AWS WAF with rate limiting rules
- Set appropriate Lambda timeout and memory limits
- Use DynamoDB auto-scaling and on-demand billing
- Enable AWS Shield Standard (automatic)

#### F. Elevation of Privilege
**Threat**: Gaining unauthorized elevated permissions
**Attack Paths**:
- Lambda role with excessive permissions (wildcards)
- IAM role assumption chains
- Cross-account access misconfigurations
- Resource-based policy bypasses

**Mitigations**:
- Implement single-purpose Lambda roles
- Avoid wildcard permissions in IAM policies
- Use IAM Access Analyzer for permission reviews
- Regular access reviews and cleanup
- Implement permission boundaries

### 5. Risk Assessment
| Risk | Severity | Likelihood | Business Impact | Priority |
|------|----------|------------|-----------------|----------|
| IAM misconfiguration | Critical | High | Data breach, compliance violation | P0 |
| Missing API authentication | High | High | Unauthorized access, data exposure | P0 |
| Excessive Lambda permissions | High | Medium | Lateral movement, privilege escalation | P1 |
| DoS attacks | Medium | Medium | Service disruption, cost impact | P2 |
| DynamoDB direct exposure | Low | Low | Data access (if misconfigured) | P3 |

### 6. AWS Security Review Expectations
**Required Elements**:
- Clear trust boundary documentation
- IAM least privilege implementation
- Comprehensive logging strategy
- Both preventive and detective controls
- Regular threat model updates with architecture changes
- Incident response procedures

**Common Review Findings**:
- Overly broad IAM permissions
- Missing authentication on public APIs
- Insufficient logging and monitoring
- Lack of input validation
- Missing encryption in transit/at rest

### 7. Scalability Considerations
This threat modeling approach scales to:
- **Container architectures** (EKS/ECS): Focus on image security, network policies
- **EC2-based systems**: Emphasize OS hardening, network segmentation
- **Data pipelines**: Analyze data flow integrity, transformation security
- **ML/AI workloads**: Consider model security, training data protection

The core STRIDE methodology and trust boundary analysis remain consistent across all AWS architectures.

---

## Example 2: Data Pipeline Architecture

### 1. Architecture Overview
**Components**:
- **Data Ingestion**: AWS S3, Kinesis Data Streams, API Gateway
- **Transformation**: AWS Glue, EMR, Lambda functions
- **Storage**: Amazon S3 Data Lake, Redshift, DynamoDB
- **Analytics/ML**: SageMaker, Athena, QuickSight
- **Governance**: Lake Formation, IAM, KMS
- **Monitoring**: CloudWatch, CloudTrail, GuardDuty

**Data Flow**: 
External Sources → S3/Kinesis → Glue/EMR → Data Lake/Redshift → SageMaker/Athena → Analytics/Apps

**Why This Architecture**: 
Secure AWS analytics and ML pipeline pattern. Enables data-driven insights while maintaining governance and compliance. Common for enterprise data platforms and ML workflows.

### 2. Trust Boundaries
| Boundary | Security Significance |
|----------|----------------------|
| External data sources → Ingestion | Untrusted to trusted data transition |
| Processing cluster → Data stores | Execution authority and data access change |
| Analytics/ML → Sensitive data | Algorithmic access to PII and business data |
| Data plane → Control plane | Operational vs data access separation |

### 3. Assets Classification
| Asset | Value | Justification |
|-------|-------|---------------|
| Raw customer data in S3 | Critical | Contains PII, business-critical information |
| Processed datasets | Critical | Derived insights, competitive advantage |
| ML models and algorithms | High | Intellectual property, business logic |
| Data processing roles | Critical | Can access entire data pipeline |
| Analytics outputs | Medium | Business intelligence, may contain aggregated sensitive data |

### 4. STRIDE Analysis

#### A. Spoofing
**Threat**: Fake data submission pretending to be trusted source
**Attack Paths**:
- Unauthenticated data ingestion endpoints
- Compromised external data source credentials
- Man-in-the-middle attacks on data feeds

**Mitigations**:
- API Gateway with IAM roles for data ingestion
- VPC endpoints for internal data producers
- TLS with mutual authentication for external sources
- Source validation and digital signatures

#### B. Tampering
**Threat**: Data corruption during ingestion or processing
**Attack Paths**:
- Malicious data injection during ingestion
- Processing job manipulation
- Storage corruption attacks
- Pipeline configuration tampering

**Mitigations**:
- S3 Object Lock and versioning enabled
- Checksums and hash validation at every pipeline stage
- Immutable infrastructure for processing jobs
- Code signing for Glue/EMR jobs
- Input validation and schema enforcement

#### C. Repudiation
**Threat**: Inability to trace data lineage and changes
**Attack Paths**:
- Missing audit logs for data operations
- Incomplete data lineage tracking
- Anonymous data access

**Mitigations**:
- CloudTrail for all API calls and data access
- S3 access logging for object-level operations
- Data lineage tracking in Lake Formation
- GuardDuty for automated threat detection
- Correlation IDs across pipeline stages

#### D. Information Disclosure
**Threat**: Unauthorized access to sensitive data
**Attack Paths**:
- Over-permissive IAM policies
- Unencrypted data at rest or in transit
- Data leakage through logs or error messages
- Unauthorized analytics access

**Mitigations**:
- KMS encryption for S3, Redshift, and processing volumes
- Fine-grained IAM with Lake Formation permissions
- Data masking and anonymization before storage
- VPC endpoints for private data flows
- Column-level security in analytics tools

#### E. Denial of Service
**Threat**: Pipeline overwhelm or resource exhaustion
**Attack Paths**:
- Massive data ingestion spikes
- Resource-intensive processing jobs
- Storage quota exhaustion
- Analytics query flooding

**Mitigations**:
- Kinesis throttling and backpressure controls
- Glue worker limits and job retries
- S3 request rate optimization
- Auto-scaling for processing resources
- Query result caching and limits

#### F. Elevation of Privilege
**Threat**: Processing jobs accessing unauthorized data
**Attack Paths**:
- Over-privileged processing roles
- Cross-account access misconfigurations
- Service role assumption chains
- Data lake permission bypasses

**Mitigations**:
- Least-privilege IAM per processing job
- Attribute-based access controls
- Regular permission audits with Access Analyzer
- Resource-based policies for fine-grained control

### 5. Risk Assessment
| Risk | Severity | Likelihood | Business Impact | Priority |
|------|----------|------------|-----------------|----------|
| PII exposure in data lake | Critical | Medium | Regulatory fines, reputation damage | P0 |
| Processing role over-privilege | High | High | Data breach, lateral movement | P0 |
| Unencrypted sensitive data | High | Medium | Compliance violation, data theft | P1 |
| Data pipeline DoS | Medium | Medium | Business disruption, cost impact | P2 |
| Incomplete audit logging | Medium | Low | Compliance gaps, forensic challenges | P2 |

### 6. Data Pipeline Security Controls
**Data Protection**:
- Minimize PII collection and mask before storage
- Use VPC endpoints for all internal data flows
- Implement data classification and handling policies

**Operational Visibility**:
- Combine CloudWatch metrics, CloudTrail logs, GuardDuty insights
- Configure alerts for anomalous data access patterns
- Monitor processing job resource consumption

**Lifecycle & Compliance**:
- Automated data retention and cleanup policies
- Regular compliance audits with AWS Config rules
- Data lineage documentation and governance

---

## Example 3: Generative AI Application

### 1. Architecture Overview
**Components**:
- **Frontend/API**: API Gateway, Application Load Balancer
- **Authentication**: IAM, Cognito User Pools
- **AI Engine**: Amazon Bedrock, SageMaker LLM endpoints
- **Vector Database**: OpenSearch, Pinecone, or custom vector store
- **Document Store**: S3, DynamoDB for RAG context
- **Monitoring**: CloudWatch, CloudTrail, custom metrics
- **Networking**: VPC, PrivateLink, NAT Gateway

**Data Flow**: 
User/App → API Gateway → Lambda/ECS → Bedrock/SageMaker → Vector DB → RAG Context → Response

**Why This Architecture**: 
Modern LLM-enabled application pattern. Provides secure, scalable AI capabilities with retrieval-augmented generation (RAG) for enhanced accuracy and context.

### 2. Trust Boundaries
| Boundary | Security Significance |
|----------|----------------------|
| Client → API layer | Untrusted user input validation |
| API → LLM endpoint | Authenticated AI service invocation |
| LLM → Vector/Document store | RAG context access control |
| Data plane → Control plane | Model invocation vs configuration management |
| User context → System context | Prompt isolation and sandboxing |

### 3. Assets Classification
| Asset | Value | Justification |
|-------|-------|---------------|
| LLM model access | Critical | Expensive compute, potential for abuse |
| Vector database content | High | Proprietary knowledge, competitive advantage |
| User conversation history | High | Privacy sensitive, business intelligence |
| RAG document corpus | High | Intellectual property, confidential information |
| API credentials and tokens | Critical | Gateway to all AI services |

### 4. STRIDE Analysis

#### A. Spoofing
**Threat**: Unauthenticated access to LLM APIs
**Attack Paths**:
- API key theft or sharing
- Session hijacking
- Service impersonation
- Bypassing authentication controls

**Mitigations**:
- API Gateway with Cognito/IAM authentication
- Short-lived tokens with refresh mechanisms
- VPC and PrivateLink for private model access
- Request signing and validation
- Multi-factor authentication for admin access

#### B. Tampering
**Threat**: Prompt injection and input manipulation
**Attack Paths**:
- Malicious prompt injection attacks
- System prompt override attempts
- RAG context poisoning
- Model fine-tuning attacks

**Mitigations**:
- Input sanitization and validation
- Prompt templates and abstraction layers
- OWASP LLM security controls
- Separate user and system contexts
- Content filtering and safety checks

#### C. Repudiation
**Threat**: Untraceable AI interactions
**Attack Paths**:
- Missing conversation logs
- Anonymous model invocations
- Lack of audit trails
- Deleted interaction history

**Mitigations**:
- CloudTrail for all API calls
- Comprehensive LLM invocation logging
- Request correlation IDs
- User session tracking
- Immutable audit logs

#### D. Information Disclosure
**Threat**: Sensitive data exposure through AI responses
**Attack Paths**:
- Model memorization of training data
- RAG context leakage to unauthorized users
- Sensitive information in conversation logs
- Cross-user data bleeding

**Mitigations**:
- Role-based access control for vector stores
- Output filtering and content moderation
- Data masking in logs and responses
- User context isolation
- Regular model safety evaluations

#### E. Denial of Service
**Threat**: Resource exhaustion and service disruption
**Attack Paths**:
- API flooding attacks
- Expensive model invocation abuse
- Vector database overload
- Token limit exhaustion

**Mitigations**:
- API Gateway throttling and usage plans
- AWS Shield for DDoS protection
- Model invocation quotas and limits
- Circuit breakers and backpressure
- Cost monitoring and alerts

#### F. Elevation of Privilege
**Threat**: Unauthorized access to AI services or data
**Attack Paths**:
- Over-privileged service roles
- Cross-tenant data access
- Model configuration tampering
- Administrative function abuse

**Mitigations**:
- Least-privilege IAM policies
- Zero-trust networking with VPC isolation
- Separate roles for different AI functions
- Regular permission reviews
- Administrative action logging

### 5. Risk Assessment
| Risk | Severity | Likelihood | Business Impact | Priority |
|------|----------|------------|-----------------|----------|
| Prompt injection attacks | High | High | Data exposure, service abuse | P0 |
| Unauthorized model access | Critical | Medium | Cost explosion, data breach | P0 |
| RAG context leakage | High | Medium | Confidential data exposure | P1 |
| AI service DoS | Medium | High | Service disruption, user impact | P1 |
| Conversation data breach | High | Low | Privacy violation, compliance | P2 |

### 6. GenAI-Specific Security Controls
**Prompt Security**:
- Input validation and sanitization libraries
- Prompt templates to prevent injection
- System/user context separation
- Content filtering for harmful outputs

**Model Protection**:
- Private model endpoints via PrivateLink
- Model access logging and monitoring
- Fine-tuning data validation and isolation
- Regular model safety assessments

**Data Governance**:
- Vector database access controls
- RAG document classification and handling
- Conversation data retention policies
- Cross-user data isolation verification

**Monitoring & Quality**:
- Real-time model performance metrics
- Conversation quality and safety monitoring
- Cost and usage tracking
- Anomaly detection for unusual patterns

---

## Threat Model Summary Tables

### Data Pipeline Threat Matrix
| Threat Category | Impact Level | Example Attack | Primary Mitigation |
|-----------------|--------------|----------------|-------------------|
| Spoofing | High | Fake data source | API Gateway + IAM authentication |
| Tampering | Critical | Data corruption | S3 Object Lock + checksums |
| Repudiation | Medium | Missing audit trail | CloudTrail + data lineage |
| Information Disclosure | Critical | PII exposure | KMS encryption + data masking |
| Denial of Service | Medium | Pipeline overload | Throttling + resource limits |
| Elevation of Privilege | High | Over-privileged roles | Least privilege + regular audits |

### Generative AI Threat Matrix
| Threat Category | Impact Level | Example Attack | Primary Mitigation |
|-----------------|--------------|----------------|-------------------|
| Spoofing | High | API abuse | Cognito/IAM authentication |
| Tampering | High | Prompt injection | Input sanitization + templates |
| Repudiation | Medium | Untraceable prompts | Comprehensive logging |
| Information Disclosure | Critical | Sensitive output | RBAC + output filtering |
| Denial of Service | Medium | Cost/service outage | Rate limits + quotas |
| Elevation of Privilege | High | Model data misuse | IAM least privilege + isolation |

---

## Lattice-Specific Implementation Guidance

### For Data Pipelines
- Treat each pipeline stage as separate trust boundary
- Implement encryption at rest and in transit by default
- Use AWS data governance tools (Lake Formation, IAM) consistently
- Automate compliance checks and data quality validation
- Design for auditability from ingestion to analytics

### For Generative AI Applications
- Layer traditional security (network/IAM) with AI-specific controls
- Implement prompt validation, monitoring, and output safety
- Design for user context isolation and data privacy
- Monitor both technical metrics and AI safety indicators
- Plan for model updates and security patch management

### Cross-Architecture Principles
- Zero-trust networking with VPC isolation
- Comprehensive logging and monitoring strategy
- Automated security scanning and compliance checks
- Regular threat model updates with architecture evolution
- Incident response procedures for each architecture type

---

## Training Data Format Notes
This document structure provides:
1. **Consistent template** for different architectures
2. **Detailed examples** showing complete analysis
3. **Scalable framework** applicable to various AWS services
4. **Real-world focus** on practical security concerns
5. **Structured output** suitable for model training

Each architecture should follow this template while adapting the specific threats, mitigations, and risk assessments to the unique characteristics of the deployment pattern.

## Ready-to-Use Threat Model Templates

### CSV Export Format
```csv
Architecture,Component,Threat_Type,Threat_Description,Attack_Path,Impact_Level,Likelihood,Mitigation,Priority
Serverless_API,API_Gateway,Spoofing,Unauthenticated API access,Stolen API keys,High,High,Cognito authentication,P0
Serverless_API,Lambda,Tampering,Malicious payload injection,Unvalidated JSON input,High,Medium,Input validation + schema,P1
Serverless_API,DynamoDB,Information_Disclosure,Unauthorized data access,Over-permissive IAM,Critical,Medium,Least privilege IAM,P0
Data_Pipeline,S3_Ingestion,Spoofing,Fake data source submission,Unauthenticated endpoints,High,Medium,API Gateway + IAM roles,P1
Data_Pipeline,Glue_Processing,Tampering,Data corruption during transformation,Malicious processing logic,Critical,Low,Code signing + validation,P0
Data_Pipeline,Data_Lake,Information_Disclosure,PII exposure in storage,Unencrypted sensitive data,Critical,Medium,KMS encryption + masking,P0
GenAI_App,API_Gateway,Spoofing,Unauthenticated LLM access,API key theft,High,High,Cognito + IAM auth,P0
GenAI_App,Bedrock_Model,Tampering,Prompt injection attacks,Malicious user prompts,High,High,Input sanitization + templates,P0
GenAI_App,Vector_DB,Information_Disclosure,RAG context leakage,Cross-user data access,High,Medium,RBAC + context isolation,P1
```

### JSON Export Format
```json
{
  "threat_models": [
    {
      "architecture": "serverless_api",
      "components": [
        {
          "name": "api_gateway",
          "threats": [
            {
              "stride_category": "spoofing",
              "threat": "Unauthenticated API access",
              "attack_paths": ["Stolen API keys", "Session hijacking"],
              "impact": "high",
              "likelihood": "high",
              "mitigations": ["Cognito User Pools", "Short-lived tokens", "HTTPS enforcement"],
              "priority": "P0"
            }
          ]
        }
      ]
    },
    {
      "architecture": "data_pipeline",
      "components": [
        {
          "name": "s3_ingestion",
          "threats": [
            {
              "stride_category": "spoofing",
              "threat": "Fake data source submission",
              "attack_paths": ["Unauthenticated endpoints", "Compromised credentials"],
              "impact": "high",
              "likelihood": "medium",
              "mitigations": ["API Gateway + IAM", "VPC endpoints", "TLS mutual auth"],
              "priority": "P1"
            }
          ]
        }
      ]
    },
    {
      "architecture": "genai_application",
      "components": [
        {
          "name": "llm_endpoint",
          "threats": [
            {
              "stride_category": "tampering",
              "threat": "Prompt injection attacks",
              "attack_paths": ["Malicious prompts", "System prompt override"],
              "impact": "high",
              "likelihood": "high",
              "mitigations": ["Input sanitization", "Prompt templates", "Content filtering"],
              "priority": "P0"
            }
          ]
        }
      ]
    }
  ]
}
```

### Architecture Pattern Templates

#### Serverless API Pattern
```yaml
architecture: serverless_api
trust_boundaries:
  - internet_to_api_gateway
  - api_gateway_to_lambda
  - lambda_to_database
critical_assets:
  - user_data
  - lambda_execution_role
  - api_endpoints
common_threats:
  - unauthenticated_access
  - injection_attacks
  - privilege_escalation
standard_mitigations:
  - cognito_authentication
  - input_validation
  - least_privilege_iam
```

#### Data Pipeline Pattern
```yaml
architecture: data_pipeline
trust_boundaries:
  - external_sources_to_ingestion
  - processing_to_storage
  - analytics_to_sensitive_data
critical_assets:
  - raw_customer_data
  - processed_datasets
  - processing_roles
common_threats:
  - data_poisoning
  - unauthorized_access
  - pipeline_disruption
standard_mitigations:
  - source_validation
  - encryption_at_rest
  - comprehensive_logging
```

#### GenAI Application Pattern
```yaml
architecture: genai_application
trust_boundaries:
  - client_to_api
  - api_to_llm
  - llm_to_vector_store
critical_assets:
  - model_access
  - conversation_history
  - rag_documents
common_threats:
  - prompt_injection
  - model_abuse
  - data_leakage
standard_mitigations:
  - input_sanitization
  - output_filtering
  - context_isolation
```

## Model Training Instructions

### Data Preparation
1. **Normalize Architecture Names**: Use consistent naming (serverless_api, data_pipeline, genai_application)
2. **Standardize Threat Categories**: Always use STRIDE framework (Spoofing, Tampering, Repudiation, Information_Disclosure, Denial_of_Service, Elevation_of_Privilege)
3. **Consistent Impact Levels**: Use Critical, High, Medium, Low
4. **Priority Mapping**: P0 (Critical), P1 (High), P2 (Medium), P3 (Low)

### Training Features
- **Architecture Type**: Primary classification feature
- **Component Name**: AWS service or custom component
- **Trust Boundary**: Security perimeter context
- **Asset Criticality**: Business impact classification
- **Threat Pattern**: Common attack scenarios per architecture
- **Mitigation Strategy**: Standard security controls

### Expected Outputs
The trained model should generate:
1. **Complete STRIDE analysis** for any AWS architecture
2. **Risk-prioritized threat list** with business impact
3. **Architecture-specific mitigations** aligned with AWS best practices
4. **Structured threat model** in consistent format
5. **Implementation guidance** for security controls

### Validation Criteria
- **Completeness**: All STRIDE categories covered
- **Accuracy**: Threats match architecture reality
- **Practicality**: Mitigations are implementable
- **Consistency**: Format matches template structure
- **Relevance**: Focuses on high-impact, likely threats