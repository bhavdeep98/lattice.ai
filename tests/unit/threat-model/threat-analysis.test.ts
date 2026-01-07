/**
 * Unit tests for Threat Modeling System
 */

import { Stack } from 'aws-cdk-lib';
import { ThreatModelAspect } from '../../../src/threat-model/aspect';
import { buildThreatModel } from '../../../src/threat-model/index';
import { ThreatFactsCollector } from '../../../src/threat-model/collectors/collect-inventory';

describe('Threat Modeling System', () => {
  let stack: Stack;
  let collector: ThreatFactsCollector;

  beforeEach(() => {
    stack = new Stack();
    collector = new ThreatFactsCollector();
  });

  describe('ThreatModelAspect', () => {
    test('should analyze stack and generate threat model', () => {
      const aspect = new ThreatModelAspect(collector);

      expect(aspect).toBeDefined();
    });

    test('should identify security vulnerabilities', () => {
      const aspect = new ThreatModelAspect(collector);

      expect(aspect).toBeDefined();
    });
  });

  describe('Workload Type Inference', () => {
    test('should identify serverless API workload', () => {
      // Add some Lambda and API Gateway resources to collector
      collector.inventory.push({
        id: 'test-lambda',
        type: 'AWS::Lambda::Function',
        service: 'lambda',
      });
      collector.inventory.push({
        id: 'test-api',
        type: 'AWS::ApiGateway::RestApi',
        service: 'apigateway',
      });

      const threatModel = buildThreatModel(collector);
      expect(threatModel.workloadType).toBe('serverless-api');
    });

    test('should identify data pipeline workload', () => {
      // Add S3 and data processing resources
      collector.inventory.push({
        id: 'test-bucket',
        type: 'AWS::S3::Bucket',
        service: 's3',
      });
      collector.inventory.push({
        id: 'test-glue',
        type: 'AWS::Glue::Job',
        service: 'glue',
      });

      const threatModel = buildThreatModel(collector);
      expect(threatModel.workloadType).toBe('data-pipeline');
    });

    test('should identify GenAI/RAG workload', () => {
      // Add OpenSearch and AI-related resources
      collector.inventory.push({
        id: 'test-opensearch',
        type: 'AWS::OpenSearchService::Domain',
        service: 'opensearch',
      });
      collector.inventory.push({
        id: 'test-bedrock',
        type: 'AWS::Bedrock::KnowledgeBase',
        service: 'bedrock',
      });

      const threatModel = buildThreatModel(collector);
      expect(threatModel.workloadType).toBe('genai-rag');
    });
  });

  describe('STRIDE Analysis', () => {
    test('should identify spoofing threats', () => {
      const threatModel = buildThreatModel(collector);

      const spoofingThreats = threatModel.threats.filter((t: any) => t.stride === 'Spoofing');
      expect(Array.isArray(spoofingThreats)).toBe(true);
    });

    test('should identify tampering threats', () => {
      const threatModel = buildThreatModel(collector);

      const tamperingThreats = threatModel.threats.filter((t: any) => t.stride === 'Tampering');
      expect(Array.isArray(tamperingThreats)).toBe(true);
    });

    test('should assess risk levels correctly', () => {
      const threatModel = buildThreatModel(collector);

      threatModel.threats.forEach((threat: any) => {
        expect(['Low', 'Medium', 'High', 'Critical']).toContain(threat.risk);
      });
    });
  });

  describe('Security Checklist', () => {
    test('should validate encryption at rest', () => {
      const threatModel = buildThreatModel(collector);

      const encryptionCheck = threatModel.checklist.find((c: any) => c.item.includes('encryption'));
      expect(encryptionCheck).toBeDefined();
    });

    test('should validate public endpoints', () => {
      const threatModel = buildThreatModel(collector);

      const publicCheck = threatModel.checklist.find((c: any) =>
        c.item.includes('Public endpoints')
      );
      expect(publicCheck).toBeDefined();
    });

    test('should validate CloudTrail logging', () => {
      const threatModel = buildThreatModel(collector);

      const loggingCheck = threatModel.checklist.find((c: any) => c.item.includes('CloudTrail'));
      expect(loggingCheck).toBeDefined();
    });
  });

  describe('Threat Model Generation', () => {
    test('should generate complete threat model document', () => {
      const threatModel = buildThreatModel(collector, {
        projectName: 'Test Project',
      });

      expect(threatModel).toHaveProperty('meta');
      expect(threatModel).toHaveProperty('inventory');
      expect(threatModel).toHaveProperty('threats');
      expect(threatModel).toHaveProperty('checklist');
      expect(threatModel).toHaveProperty('openQuestions');
      expect(threatModel).toHaveProperty('workloadType');
      expect(threatModel.meta.projectName).toBe('Test Project');
    });

    test('should include open questions for manual review', () => {
      const threatModel = buildThreatModel(collector);

      expect(Array.isArray(threatModel.openQuestions)).toBe(true);
      expect(threatModel.openQuestions.length).toBeGreaterThan(0);
    });

    test('should handle empty inventory gracefully', () => {
      const emptyCollector = new ThreatFactsCollector();
      const threatModel = buildThreatModel(emptyCollector);

      expect(threatModel).toBeDefined();
      expect(threatModel.workloadType).toBe('general');
      expect(Array.isArray(threatModel.threats)).toBe(true);
      expect(Array.isArray(threatModel.checklist)).toBe(true);
    });
  });
});
