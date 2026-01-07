/**
 * Real Lattice Demo Frontend
 * Connects to the actual Lattice framework backend
 */

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('demoForm');
  const userInput = document.getElementById('userInput');
  const generateBtn = document.getElementById('generateBtn');
  const outputContent = document.getElementById('outputContent');

  // Get backend URL from configuration
  const BACKEND_URL = window.LatticeConfig ? window.LatticeConfig.backendUrl : 'http://localhost:3001';
  
  console.log('Backend URL configured as:', BACKEND_URL);

  // Handle form submission
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const input = userInput.value.trim();

    if (!input) {
      showError('Please describe what you want to build');
      return;
    }

    await generateInfrastructure(input);
  });

  /**
   * Generate infrastructure using the real Lattice framework
   */
  async function generateInfrastructure(input) {
    try {
      // Show loading state
      showLoading();
      generateBtn.disabled = true;

      // Call the real Lattice backend
      const response = await fetch(`${BACKEND_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInput: input }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      showResult(result);
    } catch (error) {
      console.error('Generation error:', error);
      
      // Provide helpful error messages based on the error type
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        if (BACKEND_URL.includes('localhost')) {
          showError('Cannot connect to local backend.\n\nMake sure the Lattice demo backend is running:\n1. cd website\n2. npm start\n\nOr deploy the complete platform: npm run deploy:complete');
        } else {
          showError('Cannot connect to backend API.\n\nThe backend may not be deployed yet.\nTo deploy the complete platform:\n1. Set your OpenAI API key in .env\n2. Run: npm run deploy:complete');
        }
      } else {
        showError(`Failed to generate infrastructure: ${error.message}`);
      }
    } finally {
      generateBtn.disabled = false;
    }
  }

  /**
   * Show loading state
   */
  function showLoading() {
    outputContent.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <span>Lattice framework is analyzing your requirements...</span>
            </div>
        `;
  }

  /**
   * Show error message
   */
  function showError(message) {
    outputContent.innerHTML = `
            <div class="error">
                <strong>Error:</strong> ${message}
                <br><br>
                <small>Make sure the Lattice demo backend is running on port 3001</small>
            </div>
        `;
  }

  /**
   * Show the generated result with enhanced analysis
   */
  function showResult(result) {
    const { manifest, cdkCode, synthesisResult } = result;
    const analysis = manifest._analysis || {};

    outputContent.innerHTML = `
            <!-- Analysis Summary -->
            ${
              analysis.confidence
                ? `
            <div class="output-section">
                <div class="section-header">
                    🎯 AI Analysis Summary
                </div>
                <div style="background: ${analysis.confidence > 0.7 ? '#f0fdf4' : analysis.confidence > 0.4 ? '#fefce8' : '#fef2f2'}; 
                           padding: 1rem; border-radius: 8px; margin-bottom: 1rem;
                           border-left: 4px solid ${analysis.confidence > 0.7 ? '#10b981' : analysis.confidence > 0.4 ? '#f59e0b' : '#ef4444'};">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <strong>Detected Domain:</strong> 
                        <span style="background: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">
                            ${analysis.detectedDomain || 'generic'}
                        </span>
                        <strong>Confidence:</strong> 
                        <span style="font-weight: 600; color: ${analysis.confidence > 0.7 ? '#059669' : analysis.confidence > 0.4 ? '#d97706' : '#dc2626'};">
                            ${Math.round(analysis.confidence * 100)}%
                        </span>
                    </div>
                    ${
                      analysis.suggestions && analysis.suggestions.length > 0
                        ? `
                        <div style="margin-top: 0.75rem;">
                            <strong>💡 Suggestions:</strong>
                            <ul style="margin: 0.5rem 0 0 1.5rem; color: #374151;">
                                ${analysis.suggestions.map((s) => `<li>${s}</li>`).join('')}
                            </ul>
                        </div>
                    `
                        : ''
                    }
                    ${
                      analysis.missingInfo && analysis.missingInfo.length > 0
                        ? `
                        <div style="margin-top: 0.75rem;">
                            <strong>❓ Consider Specifying:</strong>
                            <ul style="margin: 0.5rem 0 0 1.5rem; color: #374151;">
                                ${analysis.missingInfo.map((m) => `<li>${m}</li>`).join('')}
                            </ul>
                        </div>
                    `
                        : ''
                    }
                </div>
            </div>
            `
                : ''
            }

            <!-- Step 1: AI Intent Analysis -->
            <div class="output-section">
                <div class="step-indicator">
                    <div class="step-number">1</div>
                    <div class="step-title">AI Intent Generated</div>
                </div>
                <div class="section-header">
                    📋 Lattice Manifest
                </div>
                <p style="color: #666; margin-bottom: 1rem;">
                    The Lattice framework analyzed your input and generated this structured manifest:
                </p>
                <div class="capabilities-list">
                    ${Object.keys(manifest.capabilities)
                      .map((cap) => {
                        const capability = manifest.capabilities[cap];
                        const description = capability.description
                          ? ` - ${capability.description}`
                          : '';
                        return `<span class="capability-tag" title="${capability.description || ''}">${cap}${description}</span>`;
                      })
                      .join('')}
                </div>
                <div class="code-block">
                    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
                    <pre><code>${JSON.stringify(
                      {
                        appName: manifest.appName,
                        environment: manifest.environment,
                        threatModel: manifest.threatModel,
                        capabilities: manifest.capabilities,
                      },
                      null,
                      2
                    )}</code></pre>
                </div>
            </div>

            <!-- Step 2: CDK Code Generation -->
            <div class="output-section">
                <div class="step-indicator">
                    <div class="step-number">2</div>
                    <div class="step-title">CDK Code Generated</div>
                </div>
                <div class="section-header">
                    🏗️ TypeScript CDK Code
                </div>
                <p style="color: #666; margin-bottom: 1rem;">
                    Real TypeScript code using the Lattice framework:
                </p>
                <div class="code-block">
                    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
                    <pre><code>${escapeHtml(cdkCode)}</code></pre>
                </div>
            </div>

            <!-- Step 3: CloudFormation Synthesis -->
            <div class="output-section">
                <div class="step-indicator">
                    <div class="step-number">3</div>
                    <div class="step-title">CloudFormation Synthesis</div>
                </div>
                <div class="section-header">
                    ☁️ AWS CloudFormation Template
                </div>
                ${
                  synthesisResult.success
                    ? `
                    <div class="success">
                        ✅ ${synthesisResult.message || 'Successfully synthesized CloudFormation template!'}
                    </div>
                    <p style="color: #666; margin-bottom: 1rem;">
                        Complete, deployable CloudFormation template generated by the Lattice framework:
                    </p>
                    <div class="code-block">
                        <button class="copy-btn" onclick="copyCode(this)">Copy</button>
                        <pre><code>${escapeHtml(synthesisResult.cloudFormation)}</code></pre>
                    </div>
                `
                    : `
                    <div class="error">
                        ⚠️ ${synthesisResult.error}
                        <br><br>
                        <small>${synthesisResult.details || 'This is expected in the demo environment. In a real setup with proper AWS CDK dependencies, this would generate the complete CloudFormation template.'}</small>
                    </div>
                `
                }
            </div>

            <!-- What You Get -->
            <div class="output-section">
                <div class="section-header">
                    🎯 What Lattice Provides
                </div>
                <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #007AFF;">
                    <ul style="margin: 0; padding-left: 1.5rem; color: #374151;">
                        <li><strong>Enhanced AI Analysis:</strong> ${analysis.confidence ? `${Math.round(analysis.confidence * 100)}% confidence` : 'Pattern recognition'} with domain-specific understanding</li>
                        <li><strong>Type-Safe Infrastructure:</strong> Full TypeScript support with compile-time validation</li>
                        <li><strong>Automatic Dependencies:</strong> No missing resources or broken references</li>
                        <li><strong>Built-in Security:</strong> Encryption, IAM policies, and security groups automatically configured</li>
                        <li><strong>Environment Awareness:</strong> Different configurations for dev/staging/prod</li>
                        <li><strong>Threat Modeling:</strong> Automated security analysis and documentation</li>
                        <li><strong>Production Ready:</strong> High availability, backups, and monitoring included</li>
                    </ul>
                </div>
            </div>
        `;
  }

  /**
   * Use example prompt
   */
  window.useExample = function (example) {
    userInput.value = example;
    userInput.focus();
  };

  /**
   * Copy code to clipboard
   */
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

  /**
   * Escape HTML for display
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Check backend health on load
  checkBackendHealth();

  async function checkBackendHealth() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health`);
      if (response.ok) {
        console.log('✅ Lattice demo backend is running');
      }
    } catch (error) {
      console.warn('⚠️ Lattice demo backend not available at:', BACKEND_URL);
      
      // Show different messages based on environment
      if (BACKEND_URL.includes('localhost')) {
        showError('Demo backend not available. Please start the Lattice demo backend first.\nMake sure the Lattice demo backend is running on port 3001');
      } else {
        showError('Backend API not available. The Lattice backend may not be deployed yet.\n\nTo deploy the complete platform with backend:\n1. Set your OpenAI API key in .env\n2. Run: npm run deploy:complete');
      }
    }
  }
});
