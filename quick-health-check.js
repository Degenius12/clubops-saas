// Quick Backend Health Check - Post Deployment
// Run this after new deployment completes

console.log('🔍 Testing ClubOps Backend After Deployment...\n');

const https = require('https');

function quickHealthCheck() {
  const options = {
    hostname: 'clubops-backend-qgwp5goeh-tony-telemacques-projects.vercel.app',
    path: '/health',
    method: 'GET',
    timeout: 10000
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`📊 Status Code: ${res.statusCode}`);
      console.log(`🔧 Response: ${data}`);
      
      if (res.statusCode === 200) {
        console.log('\n✅ BACKEND IS WORKING!');
        console.log('🎉 ClubOps-SaaS is now fully operational!');
        console.log('\n🌐 Frontend: https://frontend-o9bhynpim-tony-telemacques-projects.vercel.app');
        console.log('🔧 Backend: https://clubops-backend-qgwp5goeh-tony-telemacques-projects.vercel.app');
      } else {
        console.log('\n❌ Still having issues. Check Vercel deployment logs.');
      }
    });
  });

  req.on('error', (err) => {
    console.log(`❌ Connection Error: ${err.message}`);
    console.log('⏱️  Deployment might still be in progress. Wait 1-2 minutes and try again.');
  });

  req.end();
}

quickHealthCheck();
