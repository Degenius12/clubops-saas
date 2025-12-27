// Simple Frontend Component Testing
// Just checks if components render without errors

const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:3000';

async function testComponentRendering() {
  console.log('🚀 Testing Frontend Component Rendering...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 50
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const errors = [];
  const consoleMessages = [];

  // Capture errors
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  try {
    console.log('📱 Loading homepage...');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle0', timeout: 30000 });

    await page.screenshot({ path: 'test-screenshots/homepage.png' });
    console.log('✅ Homepage loaded');
    console.log(`   URL: ${page.url()}`);

    // Check for React root
    const hasReactRoot = await page.$('#root') !== null;
    console.log(`   Has React Root: ${hasReactRoot}`);

    // Get page title
    const title = await page.title();
    console.log(`   Page Title: ${title}`);

    // Check for any text content
    const bodyText = await page.$eval('body', el => el.textContent.slice(0, 100));
    console.log(`   Body Text (first 100 chars): ${bodyText.trim().substring(0, 100)}...`);

    // Show errors
    if (errors.length > 0) {
      console.log(`\n❌ JavaScript Errors Found: ${errors.length}`);
      errors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err}`);
      });
    } else {
      console.log(`\n✅ No JavaScript errors`);
    }

    // Show console messages
    const errorMessages = consoleMessages.filter(m => m.type === 'error');
    if (errorMessages.length > 0) {
      console.log(`\n⚠️  Console Errors: ${errorMessages.length}`);
      errorMessages.forEach((msg, i) => {
        console.log(`   ${i + 1}. ${msg.text}`);
      });
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testComponentRendering().catch(console.error);
