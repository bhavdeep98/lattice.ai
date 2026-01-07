const OpenAI = require('openai');

class LatticeAIAgent {
  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Generate a Lattice Manifest from user input
   * @param {string} userInput
   * @returns {Promise<object>} LatticeManifest
   */
  async generateManifest(userInput) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview', // Use a capable model
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an expert Cloud Architect AI for the "Lattice" framework. 
Your goal is to translate natural language requirements into a valid "Lattice Manifest" JSON object.

The Lattice Manifest Schema is as follows:

\`\`\`typescript
interface LatticeManifest {
    appName: string; // Kebab-case name, e.g., "my-healthcare-app"
    environment: 'dev' | 'prod';
    threatModel: {
        enabled: boolean;
        projectName?: string;
    };
    capabilities: {
        website?: {
            name: string;
            environment: string;
            sourcePath: string; // e.g., "./dist"
            domainName?: string;
            description?: string;
        };
        api?: {
            name: string;
            environment: string;
            type: 'container' | 'serverless';
            size: 'small' | 'medium' | 'large' | 'xlarge';
            runtime: 'nodejs18.x' | 'python3.9' | 'go1.x';
            description?: string;
        };
        database?: {
            name: string;
            environment: string;
            engine: 'postgres' | 'mysql';
            size: 'small' | 'medium' | 'large' | 'xlarge';
            highAvailability: boolean;
            encryption: boolean;
            description?: string;
        };
        queue?: {
            name: string;
            environment: string;
            type: 'standard' | 'fifo';
            dlq: boolean;
            description?: string;
        };
        storage?: {
            name: string;
            environment: string;
            encryption: boolean;
            versioning: boolean;
            publicRead: boolean;
            lifecycle?: {
                archiveAfterDays: number;
                deleteAfterDays: number;
            };
            description?: string;
        };
    };
    _analysis?: {
        detectedDomain: string;
        confidence: number; // MUST be between 0.0 and 1.0 (decimal, not percentage)
        suggestions: string[];
        missingInfo: string[];
    };
}
\`\`\`

Rules:
1. ALWAYS return a valid JSON object matching this schema.
2. Infer 'appName' from the user input if possible, otherwise generate a relevant one.
3. Default 'environment' to 'prod' unless specified otherwise.
4. Populate '_analysis' with your reasoning.
5. BE SMART about resource sizing and features based on the domain (e.g., Healthcare needs encryption and backups).
6. CRITICAL: confidence MUST be a decimal between 0.0 and 1.0 (e.g., 0.85 for 85% confidence, NOT 85).
`,
          },
          {
            role: 'user',
            content: userInput,
          },
        ],
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error('No content received from AI');
      }

      const manifest = JSON.parse(content);
      
      // Validate and fix confidence if needed
      if (manifest._analysis && manifest._analysis.confidence) {
        // If confidence is > 1, assume it's in percentage form and convert to decimal
        if (manifest._analysis.confidence > 1) {
          manifest._analysis.confidence = Math.min(manifest._analysis.confidence / 100, 1.0);
        }
        // Ensure it's between 0 and 1
        manifest._analysis.confidence = Math.max(0, Math.min(1, manifest._analysis.confidence));
      }

      return manifest;
    } catch (error) {
      console.error('AI Agent Error:', error);
      throw error; // Let the caller handle fallback
    }
  }
}

module.exports = LatticeAIAgent;
