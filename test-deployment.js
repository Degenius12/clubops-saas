// ClubOps SaaS - Quick API Test
// Test the deployment after fixes

const testUrls = [
  'https://clubops-backend-qgwp5goeh-tony-telemacques-projects.vercel.app/health',
  'https://clubops-backend-qgwp5goeh-tony-telemacques-projects.vercel.app',
  'https://frontend-o9bhynpim-tony-telemacques-projects.vercel.app'
];

async function testAPI() {
  console.log('🧪 Testing ClubOps SaaS APIs...\n');
  
  for (const url of testUrls) {
    try {
      console.log(`Testing: ${url}`);
      const response = await fetch(url);
      const data = await response.json();
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Response:`, data);
      console.log('---\n');
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log('---\n');
    }
  }
}

// Test authentication
async function testAuth() {
  console.log('🔐 Testing Authentication...\n');
  
  try {
    const response = await fetch('https://clubops-backend-qgwp5goeh-tony-telemacques-projects.vercel.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@clubops.com',
        password: 'password'
      })
    });
    
    const data = await response.json();
    console.log(`✅ Auth Status: ${response.status}`);
    console.log(`🎫 Token received:`, !!data.token);
    console.log(`👤 User:`, data.user);
  } catch (error) {
    console.log(`❌ Auth Error: ${error.message}`);
  }
}

if (typeof window !== 'undefined') {
  // Browser environment
  testAPI().then(() => testAuth());
} else {
  // Node.js environment
  const fetch = require('node-fetch');
  testAPI().then(() => testAuth());
}
