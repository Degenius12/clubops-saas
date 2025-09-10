#!/usr/bin/env node

/**
 * ClubOps SaaS - Enhanced Deployment Verification & Fix Script
 * Verifies both frontend and backend are working correctly
 */

const https = require('https');
const http = require('http');

const config = {
  frontendUrl: 'https://frontend-o9bhynpim-tony-telemacques-projects.vercel.app',
  backendUrl: 'https://clubops-backend-qgwp5goeh-tony-telemacques-projects.vercel.app',
  timeout: 15000
};

// ANSI color codes for beautiful console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

function makeRequest(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.get(url, { timeout: config.timeout }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          success: true,
          status: res.statusCode,
          headers: res.headers,
          data: data.slice(0, 500) // First 500 chars
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.abort();
      resolve({
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

async function testEndpoint(name, url, expectedContent = null) {
  log(`\n${colors.cyan}Testing ${name}...${colors.reset}`);
  log(`URL: ${url}`);
  
  const result = await makeRequest(url);
  
  if (result.success) {
    if (result.status === 200) {
      log(`✅ ${colors.green}SUCCESS: ${name} responding (${result.status})${colors.reset}`);
      
      if (expectedContent && result.data.includes(expectedContent)) {
        log(`✅ ${colors.green}Content check passed${colors.reset}`);
      } else if (expectedContent) {
        log(`⚠️  ${colors.yellow}Content check failed - expected: ${expectedContent}${colors.reset}`);
      }
      
      return true;
    } else {
      log(`❌ ${colors.red}FAILED: ${name} returned status ${result.status}${colors.reset}`);
      if (result.data) {
        log(`Response preview: ${result.data.slice(0, 200)}...`);
      }
      return false;
    }
  } else {
    log(`❌ ${colors.red}FAILED: ${name} - ${result.error}${colors.reset}`);
    return false;
  }
}

async function testAuthentication() {
  log(`\n${colors.cyan}Testing Authentication Flow...${colors.reset}`);
  
  const loginData = JSON.stringify({
    email: 'admin@clubops.com',
    password: 'password'
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'clubops-backend-qgwp5goeh-tony-telemacques-projects.vercel.app',
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      },
      timeout: config.timeout
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            if (response.token) {
              log(`✅ ${colors.green}Authentication working - Token received${colors.reset}`);
              resolve(true);
            } else {
              log(`⚠️  ${colors.yellow}Authentication response missing token${colors.reset}`);
              resolve(false);
            }
          } catch (e) {
            log(`❌ ${colors.red}Authentication failed - Invalid JSON response${colors.reset}`);
            resolve(false);
          }
        } else {
          log(`❌ ${colors.red}Authentication failed - Status: ${res.statusCode}${colors.reset}`);
          log(`Response: ${data.slice(0, 200)}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      log(`❌ ${colors.red}Authentication request failed: ${error.message}${colors.reset}`);
      resolve(false);
    });

    req.on('timeout', () => {
      req.abort();
      log(`❌ ${colors.red}Authentication request timeout${colors.reset}`);
      resolve(false);
    });

    req.write(loginData);
    req.end();
  });
}

async function main() {
  log(`${colors.bright}${colors.magenta}`);
  log('🚀 ClubOps SaaS - Deployment Verification & Health Check');
  log('================================================================');
  log(`${colors.reset}`);
  
  const results = {
    frontend: false,
    backendHealth: false,
    backendAuth: false
  };

  // Test Frontend
  results.frontend = await testEndpoint(
    'Frontend Application', 
    config.frontendUrl,
    'ClubOps'
  );

  // Test Backend Health
  results.backendHealth = await testEndpoint(
    'Backend Health Check',
    `${config.backendUrl}/health`,
    'ok'
  );

  // Test Backend Authentication
  if (results.backendHealth) {
    results.backendAuth = await testAuthentication();
  } else {
    log(`\n${colors.yellow}Skipping authentication test - backend health check failed${colors.reset}`);
  }

  // Summary Report
  log(`\n${colors.bright}${colors.blue}DEPLOYMENT STATUS SUMMARY${colors.reset}`);
  log('================================');
  
  log(`Frontend:       ${results.frontend ? colors.green + '✅ WORKING' : colors.red + '❌ FAILED'}${colors.reset}`);
  log(`Backend Health: ${results.backendHealth ? colors.green + '✅ WORKING' : colors.red + '❌ FAILED'}${colors.reset}`);
  log(`Authentication: ${results.backendAuth ? colors.green + '✅ WORKING' : colors.red + '❌ FAILED'}${colors.reset}`);

  const allWorking = results.frontend && results.backendHealth && results.backendAuth;
  
  if (allWorking) {
    log(`\n${colors.bright}${colors.green}🎉 SUCCESS: ClubOps SaaS is fully operational!${colors.reset}`);
    log(`\n${colors.cyan}Next Steps:${colors.reset}`);
    log(`1. Visit: ${config.frontendUrl}`);
    log(`2. Login with: admin@clubops.com / password`);
    log(`3. Test the "Add New Dancer" functionality`);
    log(`4. Your SaaS platform is ready for customers! 🚀`);
  } else {
    log(`\n${colors.bright}${colors.red}⚠️  ISSUES DETECTED - Troubleshooting Guide:${colors.reset}`);
    
    if (!results.frontend) {
      log(`\n${colors.yellow}Frontend Issues:${colors.reset}`);
      log(`- Check Vercel frontend deployment status`);
      log(`- Verify build completed successfully`);
      log(`- Check for any build errors in Vercel dashboard`);
    }
    
    if (!results.backendHealth) {
      log(`\n${colors.yellow}Backend Issues:${colors.reset}`);
      log(`- Environment variables may not be set correctly`);
      log(`- Check Vercel backend deployment logs`);
      log(`- Verify DATABASE_URL is accessible`);
      log(`- Redeploy backend after environment variable updates`);
    }
    
    if (!results.backendAuth && results.backendHealth) {
      log(`\n${colors.yellow}Authentication Issues:${colors.reset}`);
      log(`- JWT_SECRET may not be configured`);
      log(`- Check CORS settings in backend`);
      log(`- Verify authentication endpoints are working`);
    }
  }

  log(`\n${colors.cyan}Support URLs:${colors.reset}`);
  log(`Frontend: ${config.frontendUrl}`);
  log(`Backend:  ${config.backendUrl}`);
  log(`Health:   ${config.backendUrl}/health`);
  
  process.exit(allWorking ? 0 : 1);
}

// Run the verification
main().catch(console.error);
