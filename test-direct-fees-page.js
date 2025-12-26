// Test direct navigation to /fees page
const puppeteer = require('puppeteer');

async function test() {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100
  });

  const page = await browser.newPage();

  // Login first
  await page.goto('http://localhost:3000/login');
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'manager@demo.clubflow.com');
  await page.type('input[type="password"]', 'demo123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });

  console.log('✅ Logged in');

  // Try navigating directly to /fees
  await page.goto('http://localhost:3000/fees', { waitUntil: 'networkidle0' });

  console.log(`Current URL: ${page.url()}`);

  // Wait a bit to see what renders
  await page.waitForTimeout(5000);

  // Check what's on the page
  const pageContent = await page.evaluate(() => {
    return {
      title: document.title,
      h1: document.querySelector('h1')?.textContent,
      bodyText: document.body.textContent.substring(0, 200)
    };
  });

  console.log('Page content:', pageContent);

  // Take screenshot
  const fs = require('fs');
  if (!fs.existsSync('test-screenshots')) {
    fs.mkdirSync('test-screenshots');
  }
  await page.screenshot({ path: 'test-screenshots/direct-fees-page.png', fullPage: true });
  console.log('📸 Screenshot saved');

  // Keep browser open for 30 seconds
  console.log('\nBrowser will stay open for 30 seconds...');
  await page.waitForTimeout(30000);

  await browser.close();
}

test().catch(console.error);
