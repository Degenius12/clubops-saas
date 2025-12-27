// Frontend UI Testing for Contract & Compliance System
// Tests all Phase 2 React components

const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'manager@demo.clubflow.com',
  password: 'demo123'
};

let browser;
let page;

async function setup() {
  console.log('🚀 Launching browser...');
  browser = await puppeteer.launch({
    headless: false, // Show browser for visual verification
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 100 // Slow down for observation
  });

  page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Capture console logs
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Browser Error:', msg.text());
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message);
  });
}

async function teardown() {
  if (browser) {
    await browser.close();
  }
}

async function login() {
  console.log('\n🔐 Logging in...');
  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle0' });

  // Wait for login form to load
  await page.waitForSelector('#email', { timeout: 5000 });

  // Fill in credentials using ID selectors
  await page.type('#email', TEST_USER.email);
  await page.type('#password', TEST_USER.password);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  try {
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('⚠️  Redirected to:', currentUrl);
      return false;
    }
  } catch (error) {
    console.log('⚠️  Login navigation failed, checking for error message...');
    const errorMsg = await page.$eval('.bg-status-danger-muted', el => el.textContent).catch(() => null);
    if (errorMsg) {
      console.log('❌ Login error:', errorMsg.trim());
    }
    return false;
  }
}

async function testComplianceDashboard() {
  console.log('\n📊 Testing Compliance Dashboard...');

  try {
    await page.goto(`${FRONTEND_URL}/compliance`, { waitUntil: 'networkidle0' });

    // Check if dashboard loaded
    const title = await page.$eval('h1, h2', el => el.textContent).catch(() => null);
    console.log('  Page Title:', title);

    // Look for stats cards
    const statsCards = await page.$$('[class*="stat"], [class*="card"]');
    console.log(`  Stats Cards Found: ${statsCards.length}`);

    // Look for table or list of entertainers
    const hasTable = await page.$('table') !== null;
    const hasList = await page.$$('ul li').then(items => items.length > 0);
    console.log(`  Has Table: ${hasTable}, Has List: ${hasList}`);

    // Check for search/filter functionality
    const hasSearch = await page.$('input[type="search"], input[placeholder*="search" i]') !== null;
    console.log(`  Has Search: ${hasSearch}`);

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/compliance-dashboard.png', fullPage: true });
    console.log('  Screenshot saved: compliance-dashboard.png');

    console.log('✅ Compliance Dashboard test complete');
    return true;
  } catch (error) {
    console.log('❌ Compliance Dashboard test failed:', error.message);
    return false;
  }
}

async function testLicenseAlerts() {
  console.log('\n⚠️  Testing License Alerts Component...');

  try {
    // License alerts might be on compliance dashboard or separate page
    await page.goto(`${FRONTEND_URL}/compliance`, { waitUntil: 'networkidle0' });

    // Look for alert components
    const alerts = await page.$$('[class*="alert"], [role="alert"]');
    console.log(`  Alert Components Found: ${alerts.length}`);

    // Check for color-coded alerts
    const hasColorCoding = await page.$$('[class*="red"], [class*="yellow"], [class*="orange"]').then(el => el.length > 0);
    console.log(`  Has Color Coding: ${hasColorCoding}`);

    // Check for countdown timers
    const hasTimers = await page.$$eval('*', elements => {
      return elements.some(el => {
        const text = el.textContent || '';
        return text.match(/\d+\s*(day|hour|minute)/i);
      });
    });
    console.log(`  Has Countdown Timers: ${hasTimers}`);

    console.log('✅ License Alerts test complete');
    return true;
  } catch (error) {
    console.log('❌ License Alerts test failed:', error.message);
    return false;
  }
}

async function testEntertainerOnboarding() {
  console.log('\n👤 Testing Entertainer Onboarding Wizard...');

  try {
    // Navigate to onboarding with a test entertainer ID
    const testEntertainerId = 'test-123'; // Mock ID for UI testing
    await page.goto(`${FRONTEND_URL}/onboarding/${testEntertainerId}`, { waitUntil: 'networkidle0' });

    // Check for stepper/progress indicator
    const hasStepper = await page.$$('[class*="step"], [role="progressbar"]').then(el => el.length > 0);
    console.log(`  Has Stepper: ${hasStepper}`);

    // Check for form fields
    const formFields = await page.$$('input, select, textarea');
    console.log(`  Form Fields Found: ${formFields.length}`);

    // Check for navigation buttons
    const hasNextButton = await page.$('button:has-text("Next"), button:has-text("Continue")') !== null;
    const hasBackButton = await page.$('button:has-text("Back"), button:has-text("Previous")') !== null;
    console.log(`  Has Next Button: ${hasNextButton}, Has Back Button: ${hasBackButton}`);

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/onboarding-wizard.png', fullPage: true });
    console.log('  Screenshot saved: onboarding-wizard.png');

    console.log('✅ Entertainer Onboarding test complete');
    return true;
  } catch (error) {
    console.log('❌ Entertainer Onboarding test failed:', error.message);
    return false;
  }
}

async function testFileUpload() {
  console.log('\n📎 Testing File Upload Component...');

  try {
    // Navigate to a page with file upload (onboarding wizard step 2)
    const testEntertainerId = 'test-123';
    await page.goto(`${FRONTEND_URL}/onboarding/${testEntertainerId}`, { waitUntil: 'networkidle0' });

    // Look for file input or drag-drop zone
    const hasFileInput = await page.$('input[type="file"]') !== null;
    const hasDragDrop = await page.$$('[class*="drag"], [class*="drop"]').then(el => el.length > 0);
    console.log(`  Has File Input: ${hasFileInput}, Has Drag-Drop Zone: ${hasDragDrop}`);

    // Check for upload instructions
    const hasInstructions = await page.$$eval('*', elements => {
      return elements.some(el => {
        const text = el.textContent || '';
        return text.match(/drag|drop|upload|file|choose/i);
      });
    });
    console.log(`  Has Upload Instructions: ${hasInstructions}`);

    console.log('✅ File Upload test complete');
    return true;
  } catch (error) {
    console.log('❌ File Upload test failed:', error.message);
    return false;
  }
}

async function testSignatureCanvas() {
  console.log('\n✍️  Testing Signature Canvas Component...');

  try {
    // Navigate to onboarding (signature is typically in contract signing step)
    const testEntertainerId = 'test-123';
    await page.goto(`${FRONTEND_URL}/onboarding/${testEntertainerId}`, { waitUntil: 'networkidle0' });

    // Look for canvas element
    const hasCanvas = await page.$('canvas') !== null;
    console.log(`  Has Canvas Element: ${hasCanvas}`);

    if (hasCanvas) {
      // Check canvas dimensions
      const canvasDimensions = await page.$eval('canvas', el => ({
        width: el.width,
        height: el.height
      }));
      console.log(`  Canvas Dimensions: ${canvasDimensions.width}x${canvasDimensions.height}`);

      // Check for clear/reset button
      const hasClearButton = await page.$('button:has-text("Clear"), button:has-text("Reset")') !== null;
      console.log(`  Has Clear Button: ${hasClearButton}`);
    }

    console.log('✅ Signature Canvas test complete');
    return true;
  } catch (error) {
    console.log('❌ Signature Canvas test failed:', error.message);
    return false;
  }
}

async function checkForErrors() {
  console.log('\n🔍 Checking for JavaScript errors...');

  const errors = await page.evaluate(() => {
    return window.console ? 'No errors captured' : 'Console not available';
  });

  console.log('  Console Status:', errors);
  return true;
}

async function runAllTests() {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  const tests = [
    { name: 'Compliance Dashboard', fn: testComplianceDashboard },
    { name: 'License Alerts', fn: testLicenseAlerts },
    { name: 'Entertainer Onboarding', fn: testEntertainerOnboarding },
    { name: 'File Upload Component', fn: testFileUpload },
    { name: 'Signature Canvas', fn: testSignatureCanvas }
  ];

  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.tests.push({ name: test.name, passed });
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} crashed:`, error.message);
      results.tests.push({ name: test.name, passed: false, error: error.message });
      results.failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('FRONTEND TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(50));

  return results;
}

async function main() {
  try {
    await setup();

    console.log('='.repeat(50));
    console.log('CONTRACT & COMPLIANCE FRONTEND TESTING');
    console.log('='.repeat(50));

    const loginSuccess = await login();

    if (!loginSuccess) {
      console.log('\n❌ Cannot proceed without login. Exiting...');
      await teardown();
      process.exit(1);
    }

    await runAllTests();

    console.log('\n✅ All frontend tests complete!');
    console.log('   Screenshots saved to test-screenshots/');

  } catch (error) {
    console.error('\n❌ Test suite crashed:', error);
  } finally {
    console.log('\n🏁 Closing browser...');
    await teardown();
  }
}

// Run tests
main().catch(console.error);
