#!/usr/bin/env node

/**
 * Inject Backend URL into Frontend
 * This script updates the frontend configuration with the deployed backend URL
 */

const fs = require('fs');
const path = require('path');

function injectBackendUrl(backendUrl) {
  console.log(`🔧 Injecting backend URL: ${backendUrl}`);
  
  // Update config.js
  const configPath = path.join(__dirname, '../website/config.js');
  let configContent = fs.readFileSync(configPath, 'utf8');
  
  // Replace the placeholder with actual backend URL
  configContent = configContent.replace(
    /window\.LATTICE_BACKEND_URL \|\| '[^']*'/g,
    `'${backendUrl}'`
  );
  
  fs.writeFileSync(configPath, configContent);
  console.log('✅ Updated config.js');
  
  // Update HTML meta tag
  const htmlFiles = [
    'website/real-lattice-demo.html',
    'website/interactive-demo.html'
  ];
  
  htmlFiles.forEach(htmlFile => {
    const htmlPath = path.join(__dirname, '..', htmlFile);
    if (fs.existsSync(htmlPath)) {
      let htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      // Update meta tag
      htmlContent = htmlContent.replace(
        /<meta name="lattice-backend-url" content="[^"]*" \/>/g,
        `<meta name="lattice-backend-url" content="${backendUrl}" />`
      );
      
      fs.writeFileSync(htmlPath, htmlContent);
      console.log(`✅ Updated ${htmlFile}`);
    }
  });
  
  // Create a JavaScript file with the backend URL for runtime
  const runtimeConfigPath = path.join(__dirname, '../website/runtime-config.js');
  const runtimeConfig = `
// Runtime configuration injected during deployment
window.LATTICE_BACKEND_URL = '${backendUrl}';
console.log('Lattice Backend URL configured:', '${backendUrl}');
`;
  
  fs.writeFileSync(runtimeConfigPath, runtimeConfig);
  console.log('✅ Created runtime-config.js');
}

// Get backend URL from command line argument or environment
const backendUrl = process.argv[2] || process.env.LATTICE_BACKEND_URL;

if (!backendUrl) {
  console.error('❌ Backend URL is required');
  console.error('Usage: node inject-backend-url.js <backend-url>');
  console.error('   or: LATTICE_BACKEND_URL=<url> node inject-backend-url.js');
  process.exit(1);
}

injectBackendUrl(backendUrl);
console.log('🎉 Backend URL injection complete!');