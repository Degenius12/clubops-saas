// ClubOps-SaaS Deployment Verification & Fix Script
// Tests backend API and provides specific fix instructions

const https = require('https');

const BACKEND_URL = 'https://clubops-backend-qgwp5goeh-tony-telemacques-projects.vercel.app';
const FRONTEND_URL = 'https://frontend-o9bhynpim-tony-telemacques-projects.vercel.app';

console.log('🔍 ClubOps-SaaS Deployment Verification');
console.log('=' .repeat(50));

// Test health endpoint
function testHealthEndpoint() {
  return new Promise((resolve) => {
    const req = https.get(`${BACKEND_URL}/health`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Backend Health Check: PASSED');
          console.log(`   Status: ${response.status}`);
          console.log(`   Version: ${response.version}`);
          console.log(`   Environment: ${response.environment}`);
          console.log(`   Database Connected: ${response.database_connected}`);
          resolve(true);
        } catch (error) {
          console.log('❌ Backend Health Check: FAILED (Invalid JSON)');
          console.log(`   Response: ${data}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Backend Health Check: FAILED');
      console.log(`   Error: ${error.message}`);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      console.log('❌ Backend Health Check: TIMEOUT');
      req.destroy();
      resolve(false);
    });
  });
}

// Test authentication endpoint
function testAuthEndpoint() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      email: 'admin@clubops.com',
      password: 'password'
    });
    
    const options = {
      hostname: 'clubops-backend-qgwp5goeh-tony-telemacques-projects.vercel.app',
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Authentication Test: PASSED');
          console.log('   Login successful');
          resolve(true);
        } else {
          console.log('❌ Authentication Test: FAILED');
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Response: ${data}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Authentication Test: FAILED');
      console.log(`   Error: ${error.message}`);
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

// Main verification function
async function runVerification() {
  console.log('\n📊 Running comprehensive deployment tests...\n');
  
  const healthStatus = await testHealthEndpoint();
  console.log('');
  
  const authStatus = await testAuthEndpoint();
  console.log('');
  
  console.log('📋 VERIFICATION SUMMARY');
  console.log('=' .repeat(30));
  console.log(`Backend Health: ${healthStatus ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Authentication: ${authStatus ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  
  if (!healthStatus || !authStatus) {
    console.log('\n🔧 REQUIRED FIXES:');
    console.log('1. Open Vercel Dashboard');
    console.log('2. Go to clubops-backend project');
    console.log('3. Settings → Environment Variables');
    console.log('4. Update these variables:');
    console.log(`   CLIENT_URL=${FRONTEND_URL}`);
    console.log(`   FRONTEND_URL=${FRONTEND_URL}`);
    console.log('   NODE_ENV=production');
    console.log('5. Redeploy backend');
    console.log('\n⚡ Then run this script again to verify');
  } else {
    console.log('\n🎉 ALL SYSTEMS OPERATIONAL!');
    console.log('✅ ClubOps-SaaS is fully functional');
    console.log('✅ Ready for customer onboarding');
  }
}

runVerification().catch(console.error);
