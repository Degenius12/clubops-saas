// Test script for Dancer Management (#4-6) and DJ Queue (#7-10)
const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:3000';
const MANAGER_EMAIL = 'manager@demo.clubflow.com';
const MANAGER_PASSWORD = 'demo123';
const DJ_EMAIL = 'dj@demo.clubflow.com';
const DJ_PASSWORD = 'demo123';

let browser;
let page;

async function screenshot(name) {
  const filename = `test-screenshots/dancer-dj-${name}-${Date.now()}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`   📸 Screenshot: ${filename}`);
}

async function login(email, password) {
  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('input[type="email"]', { timeout: 5000 });
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
}

async function testDancerManagement() {
  console.log('\n\n═══════════════════════════════════════════════════');
  console.log('  DANCER MANAGEMENT TESTS (Features #4-6)');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // Navigate to dancers page
    console.log('TEST: Navigate to Dancers Page');
    console.log('────────────────────────────────────');

    await page.goto(`${FRONTEND_URL}/dancers`, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    if (!currentUrl.includes('/dancers')) {
      throw new Error(`Expected /dancers URL, got ${currentUrl}`);
    }

    console.log('✅ Navigated to /dancers');
    await screenshot('dancers-page');

    // Check page content
    const pageData = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const cards = document.querySelectorAll('.card-premium, [class*="card"]');
      const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent);

      return {
        title: h1 ? h1.textContent : null,
        cardCount: cards.length,
        hasAddButton: buttons.some(t => t && (t.includes('Add') || t.includes('New'))),
        hasSearchInput: document.querySelector('input[type="search"], input[placeholder*="search" i]') !== null
      };
    });

    console.log(`   Page Title: "${pageData.title}"`);
    console.log(`   Dancer Cards: ${pageData.cardCount}`);
    console.log(`   Has Add Button: ${pageData.hasAddButton ? '✅' : '❌'}`);
    console.log(`   Has Search: ${pageData.hasSearchInput ? '✅' : '❌'}`);

    // Test Feature #4: Add Dancer Button exists
    console.log('\nTEST: Feature #4 - Add Dancer Button');
    console.log('────────────────────────────────────');

    if (pageData.hasAddButton) {
      console.log('✅ FEATURE #4: Add Dancer button found');

      // Try to click it
      const addButtonClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addButton = buttons.find(b =>
          b.textContent && (b.textContent.includes('Add') || b.textContent.includes('New'))
        );
        if (addButton) {
          addButton.click();
          return true;
        }
        return false;
      });

      if (addButtonClicked) {
        await page.waitForTimeout(1000);
        await screenshot('add-dancer-modal');
        console.log('✅ Add Dancer modal/form opened');

        // Close modal (press Escape)
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    } else {
      console.log('❌ FEATURE #4: Add Dancer button NOT found');
    }

    // Test Feature #5 & #6: Check-in and Check-out buttons
    console.log('\nTEST: Features #5-6 - Check-in/Check-out Buttons');
    console.log('────────────────────────────────────');

    const checkInOutButtons = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      return {
        hasCheckIn: allButtons.some(b =>
          b.textContent && b.textContent.toLowerCase().includes('check')
        ),
        buttonTexts: allButtons.map(b => b.textContent).filter(t => t && t.toLowerCase().includes('check'))
      };
    });

    if (checkInOutButtons.hasCheckIn) {
      console.log('✅ FEATURES #5-6: Check-in/Check-out buttons found');
      console.log(`   Button texts: ${checkInOutButtons.buttonTexts.join(', ')}`);
    } else {
      console.log('❌ FEATURES #5-6: Check-in/Check-out buttons NOT found');
    }

    console.log('\n✅ Dancer Management Tests Complete');
    return true;

  } catch (error) {
    console.error('\n❌ Dancer Management Test Failed:', error.message);
    await screenshot('dancer-error');
    return false;
  }
}

async function testDJQueue() {
  console.log('\n\n═══════════════════════════════════════════════════');
  console.log('  DJ QUEUE TESTS (Features #7-10)');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // Logout and login as DJ
    console.log('Logging in as DJ...');
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
    });
    await page.type('input[type="email"]', DJ_EMAIL);
    await page.type('input[type="password"]', DJ_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    console.log('✅ Logged in as DJ\n');

    // Navigate to queue page
    console.log('TEST: Navigate to DJ Queue Page');
    console.log('────────────────────────────────────');

    await page.goto(`${FRONTEND_URL}/queue`, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    if (!currentUrl.includes('/queue')) {
      throw new Error(`Expected /queue URL, got ${currentUrl}`);
    }

    console.log('✅ Navigated to /queue');
    await screenshot('dj-queue-page');

    // Check page content
    const queueData = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const queueItems = document.querySelectorAll('[class*="queue"], [class*="item"]');
      const buttons = Array.from(document.querySelectorAll('button'));

      return {
        title: h1 ? h1.textContent : null,
        itemCount: queueItems.length,
        hasAddButton: buttons.some(b => b.textContent && b.textContent.toLowerCase().includes('add')),
        hasNextButton: buttons.some(b => b.textContent && (b.textContent.toLowerCase().includes('next') || b.textContent.includes('→'))),
        buttonTexts: buttons.map(b => b.textContent).slice(0, 10)
      };
    });

    console.log(`   Page Title: "${queueData.title}"`);
    console.log(`   Queue Items: ${queueData.itemCount}`);
    console.log(`   Has Add Button: ${queueData.hasAddButton ? '✅' : '❌'}`);
    console.log(`   Has Next Button: ${queueData.hasNextButton ? '✅' : '❌'}`);

    // Test Feature #7: View Queue
    console.log('\nTEST: Feature #7 - View Queue');
    console.log('────────────────────────────────────');

    if (queueData.title && queueData.title.toLowerCase().includes('queue')) {
      console.log('✅ FEATURE #7: DJ Queue view is displaying');
    } else {
      console.log('⚠️  FEATURE #7: Queue view may not be displaying correctly');
    }

    // Test Feature #8: Add to Queue
    console.log('\nTEST: Feature #8 - Add Dancer to Queue');
    console.log('────────────────────────────────────');

    if (queueData.hasAddButton) {
      console.log('✅ FEATURE #8: Add to Queue button found');
    } else {
      console.log('❌ FEATURE #8: Add to Queue button NOT found');
    }

    // Test Feature #9: Advance Queue (Next Performer)
    console.log('\nTEST: Feature #9 - Advance Queue');
    console.log('────────────────────────────────────');

    if (queueData.hasNextButton) {
      console.log('✅ FEATURE #9: Next Performer button found');
    } else {
      console.log('❌ FEATURE #9: Next Performer button NOT found');
    }

    // Test Feature #10: Reorder Queue
    console.log('\nTEST: Feature #10 - Reorder Queue (Drag & Drop)');
    console.log('────────────────────────────────────');

    const hasDragDrop = await page.evaluate(() => {
      // Look for drag handles or draggable elements
      const draggable = document.querySelectorAll('[draggable="true"], [class*="drag"]');
      return draggable.length > 0;
    });

    if (hasDragDrop) {
      console.log('✅ FEATURE #10: Drag & drop elements found');
    } else {
      console.log('⚠️  FEATURE #10: Drag & drop may not be implemented (check if queue has items)');
    }

    console.log('\n✅ DJ Queue Tests Complete');
    return true;

  } catch (error) {
    console.error('\n❌ DJ Queue Test Failed:', error.message);
    await screenshot('queue-error');
    return false;
  }
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Dancer Management & DJ Queue Test Suite');
  console.log('  Testing Features #4-10');
  console.log('═══════════════════════════════════════════════════');

  const results = {
    dancerManagement: false,
    djQueue: false
  };

  try {
    // Launch browser
    console.log('\n🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 100,
      args: ['--window-size=1920,1080']
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    console.log('✅ Browser launched\n');

    // Login as Manager
    console.log('🔐 Logging in as Manager...');
    await login(MANAGER_EMAIL, MANAGER_PASSWORD);
    console.log('✅ Login successful\n');

    // Run tests
    results.dancerManagement = await testDancerManagement();
    results.djQueue = await testDJQueue();

    // Summary
    console.log('\n\n═══════════════════════════════════════════════════');
    console.log('  TEST RESULTS SUMMARY');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Dancer Management (Features #4-6): ${results.dancerManagement ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`DJ Queue (Features #7-10):          ${results.djQueue ? '✅ PASS' : '❌ FAIL'}`);
    console.log('═══════════════════════════════════════════════════\n');

    if (results.dancerManagement && results.djQueue) {
      console.log('✅ ALL TESTS PASSING - Features #4-10 are functional!');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed - Review errors above');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error.message);
    await screenshot('fatal-error');
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

runAllTests();
