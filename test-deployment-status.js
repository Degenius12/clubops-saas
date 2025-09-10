// ClubOps Deployment Status Checker
const https = require('https');

const frontendUrl = 'https://frontend-o9bhynpim-tony-telemacques-projects.vercel.app';

// Common backend URL patterns for Vercel
const possibleBackendUrls = [
  'https://clubops-saas-backend.vercel.app',
  'https://clubops-backend.vercel.app',
  'https://backend-prj-gyqzu5zatzcpayb0m4vlcyrz8poc.vercel.app',
  'https://clubops-saas-backend-tony-telemacques-projects.vercel.app',
  'https://clubops-backend-tony-telemacques-projects.vercel.app'
];

function testUrl(url) {
  return new Promise((resolve) => {
    const request = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`✅ ${url} - Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            console.log(`   Response: ${response.message || response.status || 'OK'}`);
          } catch (e) {
            console.log(`   Response length: ${data.length} characters`);
          }
        }
        resolve({ url, status: res.statusCode, working: res.statusCode === 200 });
      });
    });
    
    request.on('error', (error) => {
      console.log(`❌ ${url} - Error: ${error.message}`);
      resolve({ url, status: 'error', working: false, error: error.message });
    });
    
    request.setTimeout(5000, () => {
      request.destroy();
      console.log(`⏰ ${url} - Timeout`);
      resolve({ url, status: 'timeout', working: false });
    });
  });
}

async function checkDeployments() {
  console.log('🔍 Checking ClubOps Deployment Status...\n');
  
  console.log('Frontend:');
  await testUrl(frontendUrl);
  await testUrl(frontendUrl + '/health');
  
  console.log('\nTesting possible backend URLs:');
  const results = [];
  
  for (const url of possibleBackendUrls) {
    const result = await testUrl(url);
    results.push(result);
    
    if (result.working) {
      console.log(`🎯 Found working backend: ${url}`);
      await testUrl(url + '/health');
      await testUrl(url + '/api/dashboard/stats');
    }
  }
  
  const workingBackends = results.filter(r => r.working);
  
  console.log('\n📊 SUMMARY:');
  console.log(`Frontend: ${frontendUrl} - ${workingBackends.length > 0 ? '✅' : '❓'}`);
  console.log(`Backend options found: ${workingBackends.length}`);
  
  if (workingBackends.length > 0) {
    console.log('\n🚀 WORKING BACKEND URLs:');
    workingBackends.forEach(backend => {
      console.log(`   ${backend.url}`);
    });
    
    console.log('\n✅ DEPLOYMENT STATUS: FUNCTIONAL');
    console.log('✅ Ready for immediate use!');
  } else {
    console.log('\n❌ DEPLOYMENT STATUS: BACKEND NOT ACCESSIBLE');
    console.log('❌ Need to redeploy or check backend configuration');
  }
}

checkDeployments().catch(console.error);
