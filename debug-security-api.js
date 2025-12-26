/**
 * Debug Security API - Check what data is being returned
 */

const puppeteer = require('puppeteer');

async function debugSecurityAPI() {
  console.log('🔍 Debugging Security API responses...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Capture all network responses
    const apiResponses = {};
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/security/')) {
        const endpoint = url.split('/api/security/')[1].split('?')[0];
        try {
          const data = await response.json();
          apiResponses[endpoint] = {
            status: response.status(),
            data: data
          };
        } catch (e) {
          apiResponses[endpoint] = {
            status: response.status(),
            error: 'Could not parse JSON'
          };
        }
      }
    });

    // Login as owner
    console.log('1️⃣  Logging in as owner...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await page.waitForSelector('input#email');
    await page.type('input#email', 'owner@demo.clubflow.com');
    await page.type('input#password', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('   ✅ Logged in\n');

    // Navigate to security dashboard
    console.log('2️⃣  Navigating to /security...');
    await page.goto('http://localhost:3000/security', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('   ✅ Page loaded\n');

    // Print API responses
    console.log('='.repeat(60));
    console.log('📡 API RESPONSES');
    console.log('='.repeat(60));

    for (const [endpoint, response] of Object.entries(apiResponses)) {
      console.log(`\n🔸 /${endpoint}`);
      console.log(`   Status: ${response.status}`);

      if (response.error) {
        console.log(`   ❌ Error: ${response.error}`);
      } else if (response.data) {
        // Show data structure
        if (response.data.entries) {
          console.log(`   📋 entries: ${response.data.entries.length} items`);
        }
        if (response.data.alerts) {
          console.log(`   🚨 alerts: ${response.data.alerts.length} items`);
        }
        if (response.data.comparisons) {
          console.log(`   🎵 comparisons: ${response.data.comparisons.length} items`);
        }
        if (response.data.total !== undefined) {
          console.log(`   📊 total: ${response.data.total}`);
        }
        if (response.data.integrityScore !== undefined) {
          console.log(`   🛡️  integrityScore: ${response.data.integrityScore}`);
        }

        // Show full data for small responses
        const dataStr = JSON.stringify(response.data, null, 2);
        if (dataStr.length < 500) {
          console.log(`   Data:\n${dataStr.split('\n').map(l => '      ' + l).join('\n')}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));

    // Check for React errors in console
    const browserLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Error') || text.includes('error') || text.includes('failed')) {
        browserLogs.push(text);
      }
    });

    if (browserLogs.length > 0) {
      console.log('\n⚠️  Browser Console Errors:');
      browserLogs.forEach(log => console.log(`   - ${log.substring(0, 150)}`));
    }

    // Keep browser open
    console.log('\n👀 Browser left open for inspection. Press Ctrl+C to close.\n');
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  }
}

debugSecurityAPI();
