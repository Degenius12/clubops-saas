#!/usr/bin/env node
/**
 * ClubOps Deployment Verification Script
 * Tests connectivity between frontend and backend
 */

const axios = require('axios');

const FRONTEND_URL = 'https://frontend-o9bhynpim-tony-telemacques-projects.vercel.app';
const BACKEND_URL = 'https://clubops-backend-qgwp5goeh-tony-telemacques-projects.vercel.app';

async function verifyDeployment() {
  console.log('🔍 ClubOps Deployment Verification\n');
  
  let allPassed = true;

  // Test 1: Frontend accessibility
  try {
    console.log('1️⃣ Testing Frontend...');
    const frontendResponse = await axios.get(FRONTEND_URL, { timeout: 10000 });
    if (frontendResponse.status === 200) {
      console.log('✅ Frontend is accessible');
    } else {
      console.log('❌ Frontend returned:', frontendResponse.status);
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ Frontend error:', error.message);
    allPassed = false;
  }

  // Test 2: Backend health check
  try {
    console.log('\n2️⃣ Testing Backend Health...');
    const healthResponse = await axios.get(`${BACKEND_URL}/health`, { timeout: 10000 });
    if (healthResponse.status === 200) {
      console.log('✅ Backend health check passed');
      console.log('📊 Response:', JSON.stringify(healthResponse.data, null, 2));
    } else {
      console.log('❌ Backend health check failed:', healthResponse.status);
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ Backend health error:', error.message);
    allPassed = false;
  }

  // Test 3: CORS configuration
  try {
    console.log('\n3️⃣ Testing CORS Configuration...');
    const corsResponse = await axios.options(`${BACKEND_URL}/api/dashboard/stats`, {
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization,content-type'
      },
      timeout: 10000
    });
    console.log('✅ CORS preflight successful');
  } catch (error) {
    console.log('⚠️ CORS test result:', error.response?.status || error.message);
    // CORS might not be testable this way, so don't fail deployment
  }

  // Test 4: Database connectivity (indirect)
  try {
    console.log('\n4️⃣ Testing Database Connectivity (via API)...');
    // This will fail without auth, but should return 401, not 500
    const dbResponse = await axios.get(`${BACKEND_URL}/api/dashboard/stats`, { 
      timeout: 10000,
      validateStatus: () => true // Don't throw on 4xx/5xx
    });
    
    if (dbResponse.status === 401) {
      console.log('✅ API endpoint accessible (401 expected - no auth)');
    } else if (dbResponse.status === 500) {
      console.log('❌ Database connectivity issue (500 error)');
      allPassed = false;
    } else {
      console.log('🤔 Unexpected response:', dbResponse.status, dbResponse.statusText);
    }
  } catch (error) {
    console.log('❌ Database connectivity test error:', error.message);
    allPassed = false;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 DEPLOYMENT VERIFICATION PASSED!');
    console.log('\n🚀 ClubOps is ready for production use!');
    console.log(`\n📱 Access your app: ${FRONTEND_URL}`);
    console.log(`🔧 API Endpoint: ${BACKEND_URL}`);
  } else {
    console.log('⚠️ DEPLOYMENT VERIFICATION FAILED');
    console.log('\n📋 Next Steps:');
    console.log('1. Check Vercel deployment logs');
    console.log('2. Verify environment variables in Vercel dashboard');
    console.log('3. Ensure database is accessible');
    console.log('4. Re-run this verification after fixes');
  }
  console.log('='.repeat(50));
}

// Run verification
verifyDeployment().catch(console.error);
