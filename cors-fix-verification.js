// ClubOps CORS Fix Verification Test
console.log('🔧 TESTING CLUBOPS CORS FIX');
console.log('===========================');

async function testCorsConnection() {
  const backendUrl = 'https://clubops-backend-d24eqemzy-tony-telemacques-projects.vercel.app';
  const frontendUrl = 'https://frontend-qe12enymq-tony-telemacques-projects.vercel.app';
  
  try {
    // Test 1: Health Check
    console.log('🏥 Testing Backend Health...');
    const healthResponse = await fetch(`${backendUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData.status);
    
    // Test 2: CORS Preflight for Auth Endpoint
    console.log('🔐 Testing CORS for Auth Endpoint...');
    const corsResponse = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': frontendUrl,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    if (corsResponse.ok) {
      console.log('✅ CORS Preflight: SUCCESS');
      console.log('✅ Access-Control-Allow-Origin:', corsResponse.headers.get('Access-Control-Allow-Origin'));
    } else {
      console.log('❌ CORS Preflight Failed');
    }
    
    // Test 3: Actual Login Attempt (will fail with credentials, but CORS should work)
    console.log('🧪 Testing Actual Login Request...');
    const loginResponse = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': frontendUrl
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test'
      })
    });
    
    if (loginResponse.status === 401) {
      console.log('✅ LOGIN REQUEST SUCCESS (Expected 401 - Invalid Credentials)');
      console.log('✅ CORS IS WORKING - No network errors!');
    } else {
      console.log('📊 Login Response Status:', loginResponse.status);
    }
    
  } catch (error) {
    if (error.message.includes('CORS')) {
      console.log('❌ CORS Error Still Present:', error.message);
    } else {
      console.log('🔍 Other Error:', error.message);
    }
  }
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Open Frontend URL and try login/registration');
  console.log('2. Use test credentials: admin@clubops.com / password');
  console.log('3. Check browser console for any remaining errors');
  
  console.log('\n🌐 FRONTEND:', frontendUrl);
  console.log('⚡ BACKEND:', backendUrl);
}

testCorsConnection();