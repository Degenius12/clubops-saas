// Test fraud prevention UI - Features #14 & #15
const puppeteer = require('puppeteer');

async function testFraudPreventionUI() {
  console.log('🔐 Testing Fraud Prevention UI (Features #14 & #15)...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 100
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Step 1: Login as owner
    console.log('1️⃣  Logging in as owner...');
    await page.goto('http://localhost:3000/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await page.waitForSelector('input#email', { timeout: 15000 });
    await page.type('input#email', 'owner@demo.clubflow.com', { delay: 50 });
    await page.type('input#password', 'demo123', { delay: 50 });
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    console.log('✅ Owner logged in successfully\n');

    // Step 2: Navigate to /security dashboard
    console.log('2️⃣  Navigating to /security dashboard...');

    // Listen to ALL console logs from the browser
    const browserLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      browserLogs.push(text);
      // Show errors immediately
      if (text.includes('error') || text.includes('Error') || text.includes('failed') || text.includes('Failed') || text.includes('401') || text.includes('403')) {
        console.log(`   [Browser] ${text.substring(0, 200)}`);
      }
    });

    await page.goto('http://localhost:3000/security', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for dashboard to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    if (!currentUrl.includes('/security')) {
      throw new Error(`Expected /security, but got ${currentUrl}`);
    }
    console.log('✅ Security dashboard loaded\n');

    // Step 3: Check for fraud alerts section
    console.log('3️⃣  Checking for fraud alerts section...');
    const bodyText = await page.evaluate(() => document.body.textContent);

    const hasAlerts = bodyText.includes('Fraud Alerts') ||
                     bodyText.includes('Security Alerts') ||
                     bodyText.includes('Verification Alerts');

    if (!hasAlerts) {
      console.log('⚠️  No alerts section found in page text');
      console.log('   Page content preview:', bodyText.substring(0, 500));
    } else {
      console.log('✅ Alerts section found\n');
    }

    // Step 4: Check for alert cards with our test data
    console.log('4️⃣  Looking for CRITICAL alert cards...');

    // Look for alert indicators
    const alertElements = await page.evaluate(() => {
      const elements = [];

      // Look for common alert patterns
      const possibleAlerts = document.querySelectorAll(
        '[class*="alert"], [class*="Alert"], [class*="card"], [class*="Card"]'
      );

      possibleAlerts.forEach(el => {
        const text = el.textContent;
        if (text.includes('CRITICAL') ||
            text.includes('Jane Smith') ||
            text.includes('Sarah Johnson') ||
            text.includes('$500')) {
          elements.push({
            text: text.substring(0, 200),
            classes: el.className
          });
        }
      });

      return elements;
    });

    if (alertElements.length > 0) {
      console.log(`✅ Found ${alertElements.length} potential alert card(s):`);
      alertElements.forEach((el, i) => {
        console.log(`   Alert ${i + 1}:`, el.text.substring(0, 100));
      });
    } else {
      console.log('⚠️  No CRITICAL alert cards found');
      console.log('   This may mean alerts aren\'t rendering or test data wasn\'t loaded');
    }
    console.log('');

    // Step 5: Test alert resolution workflow
    console.log('5️⃣  Testing alert resolution workflow...');

    // Look for resolve/dismiss buttons
    const hasResolveButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn =>
        btn.textContent.toLowerCase().includes('resolve') ||
        btn.textContent.toLowerCase().includes('dismiss') ||
        btn.textContent.toLowerCase().includes('clear')
      );
    });

    if (hasResolveButton) {
      console.log('✅ Alert resolution controls found');
    } else {
      console.log('⚠️  No resolution controls found');
      console.log('   Expected buttons with "Resolve", "Dismiss", or "Clear"');
    }
    console.log('');

    // Step 6: Check for dashboard sections
    console.log('6️⃣  Verifying dashboard sections...');
    const sections = {
      stats: bodyText.includes('Alert') && bodyText.includes('Total'),
      anomalyDetection: bodyText.includes('Anomaly') || bodyText.includes('Detection'),
      recentActivity: bodyText.includes('Recent') || bodyText.includes('Activity'),
      timeline: bodyText.includes('Timeline') || bodyText.includes('History')
    };

    Object.entries(sections).forEach(([section, found]) => {
      console.log(`   ${found ? '✅' : '⚠️ '} ${section}: ${found ? 'Found' : 'Not found'}`);
    });
    console.log('');

    // Take screenshots
    console.log('7️⃣  Capturing screenshots...');
    await page.screenshot({
      path: 'fraud-prevention-dashboard.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: fraud-prevention-dashboard.png\n');

    // Summary
    console.log('=' .repeat(60));
    console.log('TEST SUMMARY - Features #14 & #15');
    console.log('='.repeat(60));

    const results = {
      login: true,
      navigation: currentUrl.includes('/security'),
      alertsSection: hasAlerts,
      resolutionControls: hasResolveButton
    };

    const passCount = Object.values(results).filter(v => v).length;
    const totalCount = Object.keys(results).length;

    console.log(`\n✅ Passed: ${passCount}/${totalCount} checks`);
    Object.entries(results).forEach(([check, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${check}`);
    });

    if (passCount === totalCount) {
      console.log('\n🎉 All checks passed! Features #14 & #15 are COMPLETE');
    } else {
      console.log(`\n⚠️  Some checks failed (${totalCount - passCount}/${totalCount})`);
      console.log('   Review screenshots and page content above');
    }

    // Print API-related logs
    console.log('\n📋 Browser Console - API Requests:');
    const apiLogs = browserLogs.filter(log => log.includes('Making request') || log.includes('Response') || log.includes('/api/') || log.includes('401') || log.includes('500'));
    if (apiLogs.length > 0) {
      apiLogs.slice(0, 15).forEach(log => {
        console.log(`   ${log.substring(0, 150)}`);
      });
    } else {
      console.log('   No API requests found in browser console');
    }

    // Check for error responses
    console.log('\n📋 Browser Console - Errors:');
    const errorLogs = browserLogs.filter(log => log.includes('💥') || log.includes('Request failed') || log.includes('unauthorized') || log.includes('Unauthorized'));
    if (errorLogs.length > 0) {
      errorLogs.slice(0, 10).forEach(log => {
        console.log(`   ${log.substring(0, 150)}`);
      });
    } else {
      console.log('   No error logs found');
    }

    console.log('\n' + '='.repeat(60));

    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    try {
      await page.screenshot({
        path: 'fraud-prevention-error.png',
        fullPage: true
      });
      console.log('📸 Error screenshot saved: fraud-prevention-error.png');
    } catch (e) {}
    throw error;
  } finally {
    await browser.close();
  }
}

testFraudPreventionUI();
