// Quick test script to verify subscription page loads correctly
const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Testing Subscription Page Fix...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Login
    console.log('📝 Step 1: Logging in...');
    await page.goto('https://clubops-saas-frontend.vercel.app/login');
    await page.fill('input[type="email"]', 'admin@clubops.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Login successful\n');

    // Step 2: Navigate to subscription page
    console.log('📝 Step 2: Navigating to subscription page...');
    await page.goto('https://clubops-saas-frontend.vercel.app/subscription');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    console.log('✅ Page loaded\n');

    // Step 3: Check for React errors
    console.log('📝 Step 3: Checking for React errors...');
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    if (consoleErrors.length > 0) {
      console.log('❌ Console errors detected:');
      consoleErrors.forEach(err => console.log('  -', err));
    } else {
      console.log('✅ No console errors detected\n');
    }

    // Step 4: Verify key elements render
    console.log('📝 Step 4: Verifying page elements...');

    const checks = [
      { selector: 'h1:has-text("Subscription")', name: 'Page title' },
      { selector: 'text=Starter', name: 'Starter plan' },
      { selector: 'text=Professional', name: 'Professional plan' },
      { selector: 'text=Business', name: 'Business plan' },
      { selector: 'text=Enterprise', name: 'Enterprise plan' },
      { selector: 'text=Dancers', name: 'Dancers usage stat' },
      { selector: 'text=VIP Booths', name: 'VIP Booths usage stat' },
      { selector: 'text=Storage Used', name: 'Storage usage stat' }
    ];

    let allPassed = true;
    for (const check of checks) {
      const element = await page.locator(check.selector).first();
      const isVisible = await element.isVisible().catch(() => false);

      if (isVisible) {
        console.log(`  ✅ ${check.name}`);
      } else {
        console.log(`  ❌ ${check.name} not found`);
        allPassed = false;
      }
    }

    // Step 5: Take screenshot
    console.log('\n📝 Step 5: Taking screenshot...');
    await page.screenshot({ path: 'subscription-page-test.png', fullPage: true });
    console.log('✅ Screenshot saved: subscription-page-test.png\n');

    // Final result
    console.log('═══════════════════════════════════════');
    if (allPassed && consoleErrors.length === 0) {
      console.log('🎉 SUBSCRIPTION PAGE TEST: PASSED ✅');
      console.log('═══════════════════════════════════════');
      console.log('\n✨ The subscription page React Error #31 has been fixed!');
      console.log('✨ All elements render correctly');
      console.log('✨ No console errors detected');
    } else {
      console.log('⚠️  SUBSCRIPTION PAGE TEST: ISSUES FOUND');
      console.log('═══════════════════════════════════════');
      if (!allPassed) console.log('❌ Some elements failed to render');
      if (consoleErrors.length > 0) console.log('❌ Console errors detected');
    }

  } catch (error) {
    console.log('\n❌ Test failed with error:', error.message);
  } finally {
    await browser.close();
  }
})();
