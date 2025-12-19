// Debug test to check what's actually rendering on subscription page
const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Debugging Subscription Page...\n');

  const browser = await chromium.launch({ headless: false }); // Show browser
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Track console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log(`❌ Console Error: ${text}`);
    } else if (type === 'warning') {
      console.log(`⚠️  Console Warning: ${text}`);
    }
  });

  // Track page errors
  page.on('pageerror', error => {
    console.log(`❌ Page Error: ${error.message}`);
  });

  try {
    // Login
    console.log('📝 Logging in...');
    await page.goto('https://clubops-saas-frontend.vercel.app/login');
    await page.fill('input[type="email"]', 'admin@clubops.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    console.log('✅ Logged in\n');

    // Navigate to subscription
    console.log('📝 Navigating to /subscription...');
    await page.goto('https://clubops-saas-frontend.vercel.app/subscription');

    // Wait for network to be idle
    console.log('⏳ Waiting for page to load...');
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(3000); // Extra wait for React to render

    // Check page title
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);

    // Get HTML body content length
    const bodyHTML = await page.content();
    console.log(`📏 Page HTML length: ${bodyHTML.length} characters`);

    // Check if React root rendered
    const reactRoot = await page.locator('#root').count();
    console.log(`🌳 React root elements: ${reactRoot}`);

    // Check for specific text
    const checks = [
      'Subscription',
      'Starter',
      'Professional',
      'Business',
      'Enterprise',
      'Dancers',
      'VIP Booths'
    ];

    console.log('\n📊 Checking for text content:');
    for (const text of checks) {
      const found = await page.getByText(text, { exact: false }).count();
      console.log(`  ${found > 0 ? '✅' : '❌'} "${text}": ${found} matches`);
    }

    // Get all visible text
    console.log('\n📝 Visible text on page:');
    const visibleText = await page.locator('body').innerText();
    console.log(visibleText.substring(0, 500)); // First 500 chars

    // Take screenshot
    await page.screenshot({ path: 'subscription-debug.png', fullPage: true });
    console.log('\n📸 Screenshot saved: subscription-debug.png');

    console.log('\n⏸️  Keeping browser open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.log(`\n❌ Error: ${error.message}`);
  } finally {
    await browser.close();
  }
})();
