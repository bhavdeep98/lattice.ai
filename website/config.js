/**
 * Lattice Frontend Configuration
 * Automatically detects backend URL based on environment
 */

window.LatticeConfig = (function() {
  
  function getBackendUrl() {
    // If running locally, use localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    
    // If deployed, try to get backend URL from meta tag first
    const backendMeta = document.querySelector('meta[name="lattice-backend-url"]');
    if (backendMeta && backendMeta.content) {
      return backendMeta.content;
    }
    
    // Fallback: construct backend URL based on current domain
    // This assumes the backend is deployed to the same AWS account
    // and follows the naming convention
    const currentDomain = window.location.hostname;
    
    // If it's a CloudFront domain, construct the API Gateway URL
    if (currentDomain.includes('.cloudfront.net')) {
      // For demo purposes, we'll use a placeholder
      // In production, this would be dynamically injected during deployment
      return 'https://juoxe6h2zg.execute-api.us-east-1.amazonaws.com/prod/';
    }
    
    // Default fallback
    return 'https://api.lattice-demo.com';
  }
  
  function getEnvironment() {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
    
    if (hostname.includes('staging') || hostname.includes('dev')) {
      return 'staging';
    }
    
    return 'production';
  }
  
  const config = {
    backendUrl: getBackendUrl(),
    environment: getEnvironment(),
    version: '1.0.0',
    features: {
      aiGeneration: true,
      realTimeDemo: true,
      analytics: getEnvironment() === 'production'
    }
  };
  
  console.log('Lattice Config:', config);
  
  return config;
})();