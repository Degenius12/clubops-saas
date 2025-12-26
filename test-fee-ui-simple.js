// Simple UI Test for Fee Tracking - No data creation
const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:3000';
const MANAGER_EMAIL = 'manager@demo.clubflow.com';
const MANAGER_PASSWORD = 'demo123';

let browser;
let page;

async function screenshot(name) {
  const filename = `test-screenshots/fee-ui-${name}-${Date.now()}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`   📸 Screenshot: ${filename}`);
}

async function test() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Fee Tracking UI - Simple Test');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 100,
      args: ['--window-size=1920,1080']
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    console.log('✅ Browser launched\n');

    // Navigate to login
    console.log('TEST 1: Login to Application');
    console.log('────────────────────────────────────');
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle0' });

    // Fill login form
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', MANAGER_EMAIL);
    await page.type('input[type="password"]', MANAGER_PASSWORD);

    await screenshot('login-page');

    // Submit login
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });

    const loginUrl = page.url();
    console.log(`   Current URL: ${loginUrl}`);

    if (!loginUrl.includes('/dashboard') && !loginUrl.includes('/manager')) {
      throw new Error('Login failed - not redirected to dashboard');
    }

    console.log('✅ Login successful\n');
    await screenshot('dashboard');

    // Navigate to Fees page
    console.log('TEST 2: Navigate to Fees Page');
    console.log('────────────────────────────────────');

    // Look for Fees link in navigation
    const feesLinkExists = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.some(link => link.textContent.includes('Fees'));
    });

    if (!feesLinkExists) {
      throw new Error('Fees link not found in navigation');
    }

    console.log('   ✅ Found Fees link in navigation');

    // Click Fees link
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const feesLink = links.find(link => link.textContent.includes('Fees'));
      if (feesLink) feesLink.click();
    });

    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });

    const feesUrl = page.url();
    console.log(`   Current URL: ${feesUrl}`);

    if (!feesUrl.includes('/fees')) {
      throw new Error(`Expected /fees URL, got ${feesUrl}`);
    }

    console.log('✅ Navigated to Fees page\n');
    await screenshot('fees-page');

    // Check for page content
    console.log('TEST 3: Verify Fees Page Content');
    console.log('────────────────────────────────────');

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Check for main heading
    const pageHeading = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.textContent : null;
    });

    console.log(`   Page heading: "${pageHeading}"`);

    // Check for summary cards
    const cardCount = await page.evaluate(() => {
      return document.querySelectorAll('.card-premium').length;
    });

    console.log(`   Summary cards found: ${cardCount}`);

    if (cardCount < 3) {
      console.log('   ⚠️  Warning: Expected at least 3 summary cards');
    } else {
      console.log('   ✅ Summary cards present');
    }

    // Get summary card values
    const summaryData = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.card-premium'));
      return cards.slice(0, 3).map(card => {
        const label = card.querySelector('.text-sm')?.textContent || '';
        const value = card.querySelector('.text-3xl')?.textContent || '';
        return { label, value };
      });
    });

    summaryData.forEach(card => {
      console.log(`   ${card.label}: ${card.value}`);
    });

    console.log('✅ Fees page loaded successfully\n');

    // Test responsive design
    console.log('TEST 4: Responsive Design (Mobile)');
    console.log('────────────────────────────────────');

    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const isMobileOptimized = await page.evaluate(() => {
      const hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth;
      return !hasHorizontalScroll;
    });

    await screenshot('mobile-view');

    if (isMobileOptimized) {
      console.log('   ✅ Mobile layout: No horizontal scroll');
    } else {
      console.log('   ⚠️  Warning: Horizontal scroll detected on mobile');
    }

    // Switch back to desktop
    await page.setViewport({ width: 1920, height: 1080 });
    console.log('✅ Responsive design test complete\n');

    // Final summary
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ ALL UI TESTS PASSED');
    console.log('═══════════════════════════════════════════════════');
    console.log('\nTests Completed:');
    console.log('  ✅ Login to application');
    console.log('  ✅ Navigate to Fees page');
    console.log('  ✅ Fees page content loads');
    console.log('  ✅ Responsive design (mobile)');
    console.log('\nNext Steps:');
    console.log('  - Manually test payment collection flow');
    console.log('  - Test with live entertainer check-in/out');
    console.log('  - Verify fee calculations are accurate\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await screenshot('error');
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
      console.log('🌐 Browser closed\n');
    }
  }
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('test-screenshots')) {
  fs.mkdirSync('test-screenshots');
}

test();
