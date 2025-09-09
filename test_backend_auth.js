// Direct Backend Authentication Test
const https = require('https');

function testBackendAuth() {
  const postData = JSON.stringify({
    email: 'admin@clubops.com',
    password: 'password'
  });

  const options = {
    hostname: 'clubops-backend-vercel-kmhv.vercel.app',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('🔄 Testing backend authentication...');
  console.log('URL:', `https://${options.hostname}${options.path}`);
  console.log('Payload:', postData);

  const req = https.request(options, (res) => {
    console.log(`📊 Status Code: ${res.statusCode}`);
    console.log('📋 Headers:', res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('📦 Response Body:', data);
      try {
        const parsed = JSON.parse(data);
        if (res.statusCode === 200) {
          console.log('✅ Authentication successful!');
          console.log('🎟️ Token received:', parsed.token ? 'YES' : 'NO');
          console.log('👤 User data:', parsed.user);
        } else {
          console.log('❌ Authentication failed!');
          console.log('💥 Error:', parsed.error);
        }
      } catch (e) {
        console.log('❌ Failed to parse response:', e.message);
        console.log('📄 Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('🚨 Request error:', error);
  });

  req.write(postData);
  req.end();
}

// Test both credentials
function testBothCredentials() {
  console.log('='.repeat(50));
  console.log('🧪 BACKEND AUTHENTICATION TEST');
  console.log('='.repeat(50));
  
  testBackendAuth();
  
  // Test manager credentials too
  setTimeout(() => {
    console.log('\n' + '-'.repeat(30));
    console.log('Testing manager credentials...');
    console.log('-'.repeat(30));
    
    const postData = JSON.stringify({
      email: 'manager@clubops.com',
      password: 'password'
    });

    const options = {
      hostname: 'clubops-backend-vercel-kmhv.vercel.app',
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      console.log(`📊 Manager Status Code: ${res.statusCode}`);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📦 Manager Response:', data);
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('✅ Manager authentication successful!');
          } else {
            console.log('❌ Manager authentication failed!');
            console.log('💥 Error:', parsed.error);
          }
        } catch (e) {
          console.log('❌ Failed to parse manager response');
        }
      });
    });

    req.on('error', (error) => {
      console.error('🚨 Manager request error:', error);
    });

    req.write(postData);
    req.end();
  }, 2000);
}

testBothCredentials();