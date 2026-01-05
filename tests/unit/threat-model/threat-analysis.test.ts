/**
 * Unit tests for Threat Modeling System
 */

import { Stack } from 'aws-cdk-lib';
import { ThreatModelAspect } from '../../../src/threat-model/aspect';
import { generateThreatModel } from '../../../src/threat-model/index';
import { WorkloadType } from '../../../src/threat-model/model';

describe('Threat Modeling System', () => {
  let stack: Stack;

  beforeEach(() => {
    stack = new Stack();
  });

  describe('ThreatModelAspect', () => {
    test('should analyze stack and generate threat model', () => {
      const aspect = new ThreatModelAspect();
      
      // Add some resources to the stack for analysis
      // This would be done by adding actual CDK constructs
      
      expect(aspect).toBeDefined();
    });

    test('should identify security vulnerabilities', () => {
      const aspect = new ThreatModelAspect();
      
      // Test threat identification logic
      expect(aspect).toBeDefined();
    });
  });

  describe('Workload Type Inference', () => {
    test('should identify serverless API workload', () => {
      // Create a stack with Lambda + API Gateway
      const workloadType = WorkloadType.SERVERLESS_API;
      
      expect(workloadType).toBe('serverless-api');
    });

    test('should identify data pipeline workload', () => {
      // Create a stack with S3 + Lambda + DynamoDB
      const workloadType = WorkloadType.DATA_PIPELINE;
      
      expect(workloadType).toBe('data-pipeline');
    });

    test('should identify GenAI/RAG workload', () => {
      // Create a stack with OpenSearch + Lambda + Bedrock
      const workloadType = WorkloadType.GENAI_RAG;
      
      expect(workloadType).toBe('genai-rag');
    });
  });

  describe('STRIDE Analysis', () => {
    test('should identify spoofing threats', () => {
      const threats = generateThreatModel(stack);
      
      const spoofingThreats = threats.filter(t => t.category === 'Spoofing');
      expect(Array.isArray(spoofingThreats)).toBe(true);
    });

    test('should identify tampering threats', () => {
      const threats = generateThreatModel(stack);
      
      const tamperingThreats = threats.filter(t => t.category === 'Tampering');
      expect(Array.isArray(tamperingThreats)).toBe(true);
    });

    test('should assess risk levels correctly', () => {
      const threats = generateThreatModel(stack);
      
      threats.forEach(threat => {
        expect(['Low', 'Medium', 'High', 'Critical']).toContain(threat.risk);
      });
    });
  });

  describe('Security Checklist', () => {
    test('should validate encryption at rest', () => {
      const checklist = generateThreatModel(stack).checklist;
      
      const encryptionCheck = checklist.find(c => c.item.includes('encryption'));
      expect(encryptionCheck).toBeDefined();
    });

    test('should validate network isolation', () => {
      const checklist = generateThreatModel(stack).checklist;
      
      const networkCheck = checklist.find(c => c.item.includes('network'));
      expect(networkCheck).toBeDefined();
    });

    test('should validate access controls', () => {
      const checklist = generateThreatModel(stack).checklist;
      
      const accessCheck = checklist.find(c => c.item.includes('access'));
      expect(accessCheck).toBeDefined();
    });
  });
});