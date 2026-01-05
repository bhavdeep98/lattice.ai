# Threat Modeling Guide

## Overview

This document provides a comprehensive threat modeling framework for AWS production architectures. Security teams and AWS reviews expect this level of analysis for production deployments.

## Architecture Example: Serverless Public API

### Why This Architecture?
This pattern is widely used for:
- SaaS backends
- Mobile applications
- Internal tools
- Startup platforms

### Components
- **API Gateway** – public entry point
- **Lambda** – business logic
- **DynamoDB** – primary data store
- **IAM** – identity and permissions
- **CloudWatch/CloudTrail** – logging

### Data Flow
```
User → API Gateway → Lambda → DynamoDB → Lambda → API Gateway → User
```

## Trust Boundaries (Critical Foundation)

Threat modeling starts with identifying trust boundaries - where attackers attempt to cross security perimeters.

| Boundary | Why It Matters |
|----------|----------------|
| Internet → API Gateway | Untrusted traffic enters |
| API Gateway → Lambda | Auth & validation boundary |
| Lambda → DynamoDB | Privilege boundary |
| AWS Account | Blast-radius boundary |

## Assets to Protect

| Asset | Value | Risk Level |
|-------|-------|------------|
| User data in DynamoDB | High | Critical |
| Lambda execution role | Very High | Critical |
| API endpoints | Medium-High | Important |
| Logs (CloudWatch) | Medium | Moderate |

## Threat Identification (STRIDE Framework)

### A. Spoofing (Fake Identity)

**Threat**: Attacker calls API pretending to be a real user or service

**Attack Paths**:
- No authentication on API Gateway
- Stolen API keys
- Compromised credentials

**Mitigations**:
- Cognito/IAM authentication on API Gateway
- No hard-coded secrets
- Short-lived credentials only
- Multi-factor authentication where applicable

### B. Tampering (Data or Code Modification)

**Threat**: Malicious input alters logic or data

**Attack Paths**:
- Unvalidated JSON payloads
- Direct DynamoDB access
- Code injection attacks

**Mitigations**:
- Strict input validation in Lambda
- DynamoDB access only via Lambda role
- No public DynamoDB endpoints
- Parameter validation and sanitization

### C. Repudiation (No Accountability)

**Threat**: Attacker performs actions without traceability

**Attack Paths**:
- Missing logs
- Log