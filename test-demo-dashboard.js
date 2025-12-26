const puppeteer = require('puppeteer');

async function testDemoDashboard() {
  console.log('🧪 Testing ClubFlow Demo Dashboard...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--start-maximized']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // 1. Navigate to login
    console.log('1️⃣  Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });

    // 2. Login as Super Manager
    console.log('2️⃣  Logging in as Super Manager...');
    await page.type('input#email', 'supermanager@demo.clubflow.com');
    await page.type('input#password', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    console.log('✅ Successfully logged in!\n');

    // 3. Check for demo data on dashboard
    console.log('3️⃣  Checking dashboard for demo data...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take a screenshot
    await page.screenshot({ path: 'dashboard-demo-data.png', fullPage: true });
    console.log('📸 Screenshot saved: dashboard-demo-data.png\n');

    // 4. Check for shift history
    console.log('4️⃣  Checking shift history...');
    const shiftHistory = await page.evaluate(() => {
      const historySection = document.querySelector('[class*="shift"]') ||
                            document.querySelector('[class*="history"]');
      return historySection ? 'Found shift history section' : 'No shift history found';
    });
    console.log('   ', shiftHistory);

    // 5. Check for revenue data
    console.log('5️⃣  Checking for revenue data...');
    const revenueData = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasRevenue = text.includes('$') || text.includes('revenue') || text.includes('Revenue');
      return hasRevenue ? 'Found revenue indicators' : 'No revenue data visible';
    });
    console.log('   ', revenueData);

    // 6. Log page content for debugging
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('\n📄 Dashboard Content Preview:');
    console.log('─'.repeat(60));
    console.log(pageText.substring(0, 500));
    console.log('─'.repeat(60));

    console.log('\n✅ Demo dashboard test completed!');
    console.log('💡 Browser window left open for manual inspection');
    console.log('   Press Ctrl+C when done reviewing\n');

    // Keep browser open for manual inspection
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await browser.close();
    process.exit(1);
  }
}

testDemoDashboard();
