// Test owner login specifically
const puppeteer = require('puppeteer');

async function testOwnerLogin() {
  console.log('🔐 Testing Owner Login...\n');

  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 100
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    console.log('1️⃣  Navigating to login page...');
    await page.goto('http://localhost:3000/login', {
      waitUntil: 'load',
      timeout: 30000
    });

    console.log('2️⃣  Page loaded, waiting for email input...');
    await page.waitForSelector('input#email', { timeout: 15000, visible: true });

    console.log('3️⃣  Typing email...');
    await page.type('input#email', 'owner@demo.clubflow.com', { delay: 50 });

    console.log('4️⃣  Typing password...');
    await page.type('input#password', 'demo123', { delay: 50 });

    console.log('5️⃣  Clicking submit...');
    await page.click('button[type="submit"]');

    console.log('6️⃣  Waiting for navigation...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });

    const currentUrl = page.url();
    console.log(`7️⃣  Current URL: ${currentUrl}`);

    if (currentUrl.includes('/dashboard')) {
      console.log('\n✅ SUCCESS: Owner login working!');

      await new Promise(resolve => setTimeout(resolve, 2000));
      await page.screenshot({ path: 'owner-login-success.png', fullPage: true });
      console.log('📸 Screenshot saved: owner-login-success.png\n');
    } else {
      console.log('\n❌ FAIL: Expected /dashboard, got', currentUrl);
    }

    await new Promise(resolve => setTimeout(resolve, 5000)); // Keep browser open for inspection

  } catch (error) {
    console.error('\n❌ Error:', error.message);

    try {
      await page.screenshot({ path: 'owner-login-error.png', fullPage: true });
      console.log('📸 Error screenshot saved: owner-login-error.png');
    } catch (e) {}
  } finally {
    await browser.close();
  }
}

testOwnerLogin();
