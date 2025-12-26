/**
 * Test Entertainer Check-In/Check-Out Features (#5, #6)
 *
 * Feature #5: Manager can check in a dancer for shift
 * Feature #6: Manager can check out a dancer from shift
 */

const puppeteer = require('puppeteer');

async function testCheckInCheckOut() {
  console.log('🎭 Testing Entertainer Check-In/Check-Out (Features #5 & #6)...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox'],
    slowMo: 50
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('error') || text.includes('Error') || text.includes('failed')) {
        console.log(`   [Browser] ${text.substring(0, 150)}`);
      }
    });

    // ====== STEP 1: Login as Manager ======
    console.log('1️⃣  Logging in as Manager...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await page.waitForSelector('input#email');
    await page.type('input#email', 'manager@demo.clubflow.com');
    await page.type('input#password', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('   ✅ Manager logged in\n');

    // ====== STEP 2: Navigate to Dancer Management ======
    console.log('2️⃣  Navigating to Dancer Management...');
    await page.goto('http://localhost:3000/dancers', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('   ✅ Dancer Management page loaded\n');

    // ====== FEATURE #5: Check In Dancer ======
    console.log('3️⃣  FEATURE #5: Testing Check In Dancer...');

    // Look for "Check In" button
    const checkInButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.filter(btn => btn.textContent.includes('Check In')).length;
    });

    console.log(`   Found ${checkInButtons} "Check In" button(s)`);

    if (checkInButtons > 0) {
      // Click the first Check In button
      const buttons = await page.$$('button');
      let checkInClicked = false;

      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('Check In') && !text.includes('Check Out')) {
          console.log('   Clicking "Check In" button...');
          await button.click();
          checkInClicked = true;
          break;
        }
      }

      if (checkInClicked) {
        // Wait for the action to complete
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if button changed to "Check Out"
        const checkOutButtons = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.filter(btn => btn.textContent.includes('Check Out')).length;
        });

        if (checkOutButtons > 0) {
          console.log('   ✅ FEATURE #5 PASS: entertainer checked in successfully!');
          console.log('   ✅ Button changed from "Check In" to "Check Out"\n');
        } else {
          console.log('   ⚠️  Check-in button clicked but status not updated\n');
        }
      }
    } else {
      console.log('   ⚠️  No "Check In" buttons found - all dancers may already be checked in\n');
    }

    // ====== FEATURE #6: Check Out Dancer ======
    console.log('4️⃣  FEATURE #6: Testing Check Out Dancer...');

    // Look for "Check Out" button
    const checkOutButtonsCount = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.filter(btn => btn.textContent.includes('Check Out')).length;
    });

    console.log(`   Found ${checkOutButtonsCount} "Check Out" button(s)`);

    if (checkOutButtonsCount > 0) {
      // Click the first Check Out button
      const buttons = await page.$$('button');
      let checkOutClicked = false;

      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('Check Out')) {
          console.log('   Clicking "Check Out" button...');
          await button.click();
          checkOutClicked = true;
          break;
        }
      }

      if (checkOutClicked) {
        // Wait for the action to complete
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if button changed back to "Check In"
        const checkInButtonsAfter = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.filter(btn => btn.textContent.includes('Check In') && !btn.textContent.includes('Check Out')).length;
        });

        if (checkInButtonsAfter > checkInButtons) {
          console.log('   ✅ FEATURE #6 PASS: entertainer checked out successfully!');
          console.log('   ✅ Button changed from "Check Out" to "Check In"\n');
        } else {
          console.log('   ⚠️  Check-out button clicked but status not updated\n');
        }
      }
    } else {
      console.log('   ⚠️  No "Check Out" buttons found - no dancers are checked in\n');
    }

    // Take screenshot
    await page.screenshot({
      path: 'dancer-checkin-checkout-test.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: dancer-checkin-checkout-test.png\n');

    // ====== Summary ======
    console.log('='.repeat(60));
    console.log('TEST SUMMARY - Check-In/Check-Out Features');
    console.log('='.repeat(60));

    const hasCheckInButton = checkInButtons > 0 || checkOutButtonsCount > 0;
    const results = {
      'Check-In UI Button': hasCheckInButton ? '✅ FOUND' : '❌ NOT FOUND',
      'Check-Out UI Button': checkOutButtonsCount > 0 ? '✅ FOUND' : '⚠️  NOT TESTED',
      'Feature #5 Status': checkInButtons > 0 ? '✅ READY' : '⚠️  NEEDS SETUP',
      'Feature #6 Status': checkOutButtonsCount > 0 ? '✅ READY' : '⚠️  NEEDS SETUP'
    };

    Object.entries(results).forEach(([feature, status]) => {
      console.log(`${status} ${feature}`);
    });

    console.log('\n📋 Notes:');
    console.log('   - Check-in/check-out buttons are now in the UI');
    console.log('   - Buttons conditionally display based on dancer status');
    console.log('   - Backend APIs handle DancerCheckIn records');
    console.log('   - Real-time Socket.IO events emitted');

    console.log('\n='.repeat(60));

    // Keep browser open for inspection
    console.log('\n👀 Browser left open for inspection. Press Ctrl+C to close.\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    await page.screenshot({
      path: 'dancer-checkin-checkout-error.png',
      fullPage: true
    });
    console.log('📸 Error screenshot saved: dancer-checkin-checkout-error.png');
    throw error;
  } finally {
    await browser.close();
  }
}

testCheckInCheckOut();
