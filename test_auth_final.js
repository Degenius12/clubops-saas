// ClubOps Authentication Final Test
// This tests the direct backend connection and verifies the fix

const axios = require('axios');

const BACKEND_URL = 'https://clubops-backend-vercel-kmhv.vercel.app';
const TEST_CREDENTIALS = [
  { email: 'admin@clubops.com', password: 'password' },
  { email: 'manager@clubops.com', password: 'password' }
];

async function testBackendConnection() {
  console.log('🔍 Testing Backend Connection...');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/health`, {
      timeout: 10000
    });
    
    console.log('✅ Backend Health Check:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Backend Health Check Failed:', error.message);
    return false;
  }
}

async function testAuthentication() {
  console.log('\n🔑 Testing Authentication...');
  
  for (const credentials of TEST_CREDENTIALS) {
    console.log(`\nTesting: ${credentials.email}`);
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, credentials, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Login successful:', {
        email: credentials.email,
        token: response.data.token ? 'Token received' : 'No token',
        user: response.data.user ? response.data.user.name : 'No user data'
      });
      
    } catch (error) {
      console.error('❌ Login failed:', {
        email: credentials.email,
        status: error.response?.status,
        error: error.response?.data?.error || error.message
      });
    }
  }
}

async function runTests() {
  console.log('🚀 ClubOps Authentication Final Test\n');
  console.log('Backend URL:', BACKEND_URL);
  
  const backendOnline = await testBackendConnection();
  
  if (backendOnline) {
    await testAuthentication();
  }
  
  console.log('\n🏁 Test Complete');
  console.log('\n📋 Next Steps:');
  console.log('1. Restart the frontend development server (npm run dev)');
  console.log('2. Clear browser cache and refresh');
  console.log('3. Try logging in with admin@clubops.com / password');
}

runTests().catch(console.error);
