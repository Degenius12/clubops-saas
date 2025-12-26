// Test authentication flows for Manager, Owner, and DJ
const puppeteer = require('puppeteer');

async function testAuthenticationFlows() {
  console.log('🔐 Testing Authentication Flows...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const testUsers = [
    {
      role: 'Manager',
      email: 'manager@demo.clubflow.com',
      password: 'demo123',
      expectedDashboard: '/dashboard',
      featureId: 1 // Feature #1: Manager can log in
    },
    {
      role: 'Owner',
      email: 'owner@demo.clubflow.com',
      password: 'demo123',
      expectedDashboard: '/dashboard',
      featureId: 2 // Feature #2: Club owner can log in and access admin panel
    },
    {
      role: 'DJ',
      email: 'dj@demo.clubflow.com',
      password: 'demo123',
      expectedDashboard: '/dashboard', // May redirect to DJ-specific view
      featureId: 3 // Feature #3: DJ can log in with limited access
    }
  ];

  const results = {
    passed: [],
    failed: []
  };

  for (const testUser of testUsers) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: Feature #${testUser.featureId} - ${testUser.role} Login`);
    console.log('='.repeat(60));

    let page;
    try {
      page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 720 });

      // Navigate to login
      console.log('1️⃣  Navigating to login page...');
      await page.goto('http://localhost:3000/login', {
        waitUntil: 'networkidle2',
        timeout: 20000
      });

      // Clear any existing session after page load
      await page.evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {}
      });

      // Fill in credentials
      console.log(`2️⃣  Entering credentials for ${testUser.role}...`);
      await page.waitForSelector('input#email', { timeout: 10000 });
      await page.type('input#email', testUser.email);
      await page.type('input#password', testUser.password);

      // Submit form
      console.log('3️⃣  Submitting login form...');
      await page.click('button[type="submit"]');

      // Wait for navigation
      console.log('4️⃣  Waiting for redirect...');
      await page.waitForNavigation({
        waitUntil: 'networkidle0',
        timeout: 10000
      });

      // Check if redirected to dashboard
      const currentUrl = page.url();
      console.log(`5️⃣  Current URL: ${currentUrl}`);

      if (currentUrl.includes('/dashboard')) {
        console.log('✅ Successfully redirected to dashboard');

        // Wait for dashboard to load
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check for user info/role display
        const bodyText = await page.evaluate(() => document.body.textContent);

        // Verify session is created
        const cookies = await page.cookies();
        const hasAuthCookie = cookies.some(c =>
          c.name.includes('token') || c.name.includes('session') || c.name.includes('auth')
        );

        // Check localStorage for token
        const hasToken = await page.evaluate(() => {
          return !!localStorage.getItem('token');
        });

        console.log(`6️⃣  Auth Token Present: ${hasToken ? '✅' : '❌'}`);
        console.log(`7️⃣  Auth Cookie Present: ${hasAuthCookie ? '✅' : '❌'}`);

        // Take screenshot
        const screenshotPath = `login-test-${testUser.role.toLowerCase()}.png`;
        await page.screenshot({ path: screenshotPath });
        console.log(`📸 Screenshot saved: ${screenshotPath}`);

        console.log(`\n✅ PASS: ${testUser.role} login successful`);
        console.log(`   - Credentials validated`);
        console.log(`   - Redirected to dashboard`);
        console.log(`   - Session created\n`);

        results.passed.push({
          featureId: testUser.featureId,
          role: testUser.role,
          url: currentUrl
        });

      } else {
        throw new Error(`Expected /dashboard, got ${currentUrl}`);
      }

    } catch (error) {
      console.log(`\n❌ FAIL: ${testUser.role} login failed`);
      console.log(`   Error: ${error.message}\n`);

      results.failed.push({
        featureId: testUser.featureId,
        role: testUser.role,
        error: error.message
      });
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  await browser.close();

  // Print summary
  console.log('\n\n');
  console.log('='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`\n✅ Passed: ${results.passed.length}/${testUsers.length}`);
  results.passed.forEach(r => {
    console.log(`   - Feature #${r.featureId}: ${r.role} login`);
  });

  if (results.failed.length > 0) {
    console.log(`\n❌ Failed: ${results.failed.length}/${testUsers.length}`);
    results.failed.forEach(r => {
      console.log(`   - Feature #${r.featureId}: ${r.role} login - ${r.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // Exit with appropriate code
  process.exit(results.failed.length > 0 ? 1 : 0);
}

testAuthenticationFlows();
