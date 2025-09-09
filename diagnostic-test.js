// ClubOps SaaS Diagnostic Test
// Tests both frontend and backend deployment status

const https = require('https');
const http = require('http');

const FRONTEND_URL = 'https://frontend-o9bhynpim-tony-telemacques-projects.vercel.app';
const BACKEND_URL = 'https://clubops-backend-qgwp5goeh-tony-telemacques-projects.vercel.app';

function testEndpoint(url, description) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    protocol.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          description,
          status: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 300,
          headers: res.headers,
          data: data.substring(0, 500) // First 500 chars
        });
      });
    }).on('error', (error) => {
      resolve({
        url,
        description,
        status: 'ERROR',
        success: false,
        error: error.message
      });
    });
  });
}

async function runDiagnostics() {
  console.log('🔍 CLUBOPS SAAS DIAGNOSTIC TEST');
  console.log('='.repeat(50));
  
  const tests = [
    { url: `${FRONTEND_URL}`, description: 'Frontend Root' },
    { url: `${FRONTEND_URL}/login`, description: 'Frontend Login Page' },
    { url: `${BACKEND_URL}`, description: 'Backend Root' },
    { url: `${BACKEND_URL}/health`, description: 'Backend Health Check' },
    { url: `${BACKEND_URL}/api/dashboard/stats`, description: 'Dashboard API (requires auth)' }
  ];

  const results = await Promise.all(tests.map(test => testEndpoint(test.url, test.description)));
  
  console.log('\n📊 TEST RESULTS:');
  console.log('-'.repeat(50));
  
  let passedTests = 0;
  let totalTests = results.length;
  
  results.forEach((result, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${result.description}: ${status}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Status: ${result.status}`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    if (result.success) {
      passedTests++;
      if (result.data && result.data.includes('{"')) {
        try {
          const jsonData = JSON.parse(result.data);
          console.log(`   Response: ${JSON.stringify(jsonData, null, 2).substring(0, 200)}...`);
        } catch (e) {
          console.log(`   Response: ${result.data.substring(0, 100)}...`);
        }
      } else {
        console.log(`   Response: ${result.data.substring(0, 100)}...`);
      }
    }
    
    console.log('');
  });
  
  console.log(`\n🎯 SUMMARY: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('✅ All systems operational!');
  } else {
    console.log('❌ Issues detected - see details above');
  }
  
  console.log('\n🔧 NEXT STEPS:');
  if (passedTests < totalTests) {
    console.log('- Check Vercel deployment logs');
    console.log('- Verify environment variables');
    console.log('- Test API endpoints individually');
    console.log('- Check CORS configuration');
  } else {
    console.log('- System appears to be working correctly');
    console.log('- Test authentication flow');
    console.log('- Verify all features work end-to-end');
  }
}

runDiagnostics().catch(console.error);
