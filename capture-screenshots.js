/**
 * ClubOps Screenshot Capture Script
 * Automated screenshot generation for Operations Manual
 * Uses Playwright to capture all major features
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://clubops-saas-frontend.vercel.app';
const CREDENTIALS = {
  email: 'admin@clubops.com',
  password: 'password'
};

const SCREENSHOT_DIR = path.join(__dirname, 'docs', 'manual', 'screenshots');
const MOBILE_DIR = path.join(SCREENSHOT_DIR, 'mobile');

// Ensure directories exist
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}
if (!fs.existsSync(MOBILE_DIR)) {
  fs.mkdirSync(MOBILE_DIR, { recursive: true });
}

// Screenshot configurations
const SCREENSHOTS = [
  {
    name: '00-login',
    path: '/login',
    requiresAuth: false,
    description: 'Login Page - Authentication Portal'
  },
  {
    name: '01-dashboard',
    path: '/dashboard',
    requiresAuth: true,
    description: 'Main Dashboard - Overview & Metrics'
  },
  {
    name: '02-dancers',
    path: '/dancers',
    requiresAuth: true,
    description: 'Dancer Management - Roster & Compliance'
  },
  {
    name: '03-dj-queue',
    path: '/queue',
    requiresAuth: true,
    description: 'DJ Queue - Stage Management'
  },
  {
    name: '04-vip-booths',
    path: '/vip',
    requiresAuth: true,
    description: 'VIP Booths - Session Tracking'
  },
  {
    name: '05-revenue',
    path: '/revenue',
    requiresAuth: true,
    description: 'Revenue Dashboard - Financial Analytics'
  },
  {
    name: '06-settings',
    path: '/settings',
    requiresAuth: true,
    description: 'Settings - Configuration & Preferences'
  },
  {
    name: '07-subscription',
    path: '/subscription',
    requiresAuth: true,
    description: 'Subscription Plans - Billing & Upgrades'
  }
];

async function captureScreenshots() {
  console.log('🚀 Starting ClubOps Screenshot Capture...\n');

  const browser = await chromium.launch({
    headless: false, // Show browser for visual confirmation
    slowMo: 500 // Slow down for page loads
  });

  try {
    // Desktop screenshots
    console.log('📸 Capturing Desktop Screenshots...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });
    const desktopPage = await desktopContext.newPage();
    let isAuthenticated = false;

    for (const screenshot of SCREENSHOTS) {
      console.log(`  → ${screenshot.name}: ${screenshot.description}`);

      // Navigate to the page
      await desktopPage.goto(`${BASE_URL}${screenshot.path}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Handle authentication if needed
      if (screenshot.requiresAuth && !isAuthenticated) {
        console.log('    🔐 Logging in...');

        // Wait for login form
        await desktopPage.waitForSelector('input[type="email"]', { timeout: 5000 });

        // Fill login form
        await desktopPage.fill('input[type="email"]', CREDENTIALS.email);
        await desktopPage.fill('input[type="password"]', CREDENTIALS.password);

        // Click login button
        await desktopPage.click('button[type="submit"]');

        // Wait for redirect to dashboard
        await desktopPage.waitForURL('**/dashboard', { timeout: 10000 });

        isAuthenticated = true;
        console.log('    ✅ Authenticated');

        // Navigate to the actual page after login
        if (screenshot.path !== '/dashboard') {
          await desktopPage.goto(`${BASE_URL}${screenshot.path}`, {
            waitUntil: 'networkidle',
            timeout: 30000
          });
        }
      }

      // Wait for content to load
      await desktopPage.waitForTimeout(2000);

      // Take screenshot
      const desktopPath = path.join(SCREENSHOT_DIR, `${screenshot.name}.png`);
      await desktopPage.screenshot({
        path: desktopPath,
        fullPage: false // Capture viewport only for consistency
      });

      console.log(`    ✅ Saved: ${desktopPath}`);
    }

    await desktopContext.close();

    // Mobile screenshots
    console.log('\n📱 Capturing Mobile Screenshots...');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 }, // iPhone X/11/12 size
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });
    const mobilePage = await mobileContext.newPage();
    isAuthenticated = false;

    // Select key pages for mobile
    const mobilePages = SCREENSHOTS.filter(s =>
      ['00-login', '01-dashboard', '02-dancers', '04-vip-booths'].includes(s.name)
    );

    for (const screenshot of mobilePages) {
      const mobileName = `mobile-${screenshot.name}`;
      console.log(`  → ${mobileName}: ${screenshot.description}`);

      // Navigate
      await mobilePage.goto(`${BASE_URL}${screenshot.path}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Handle authentication
      if (screenshot.requiresAuth && !isAuthenticated) {
        console.log('    🔐 Logging in (mobile)...');

        await mobilePage.waitForSelector('input[type="email"]', { timeout: 5000 });
        await mobilePage.fill('input[type="email"]', CREDENTIALS.email);
        await mobilePage.fill('input[type="password"]', CREDENTIALS.password);
        await mobilePage.click('button[type="submit"]');
        await mobilePage.waitForURL('**/dashboard', { timeout: 10000 });

        isAuthenticated = true;
        console.log('    ✅ Authenticated (mobile)');

        if (screenshot.path !== '/dashboard') {
          await mobilePage.goto(`${BASE_URL}${screenshot.path}`, {
            waitUntil: 'networkidle',
            timeout: 30000
          });
        }
      }

      await mobilePage.waitForTimeout(2000);

      // Take mobile screenshot
      const mobilePath = path.join(MOBILE_DIR, `${mobileName}.png`);
      await mobilePage.screenshot({
        path: mobilePath,
        fullPage: false
      });

      console.log(`    ✅ Saved: ${mobilePath}`);
    }

    await mobileContext.close();

    console.log('\n✅ All screenshots captured successfully!');
    console.log(`📁 Desktop screenshots: ${SCREENSHOT_DIR}`);
    console.log(`📁 Mobile screenshots: ${MOBILE_DIR}`);

  } catch (error) {
    console.error('\n❌ Error capturing screenshots:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the script
captureScreenshots()
  .then(() => {
    console.log('\n🎉 Screenshot capture complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Screenshot capture failed:', error);
    process.exit(1);
  });
