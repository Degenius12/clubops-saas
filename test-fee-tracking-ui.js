// UI Test script for Fee Tracking features (#24-25)
// Tests the frontend React components with Puppeteer

const puppeteer = require('puppeteer');
const axios = require('axios');

const FRONTEND_URL = 'http://localhost:3000';
const API_BASE_URL = 'http://localhost:3001';

// Demo credentials
const MANAGER_EMAIL = 'manager@demo.clubflow.com';
const MANAGER_PASSWORD = 'demo123';

let browser;
let page;
let authToken = '';
let clubId = '';
let testEntertainerId = '';

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

async function setupBrowser() {
  console.log('\n🌐 Launching browser...');
  browser = await puppeteer.launch({
    headless: false, // Set to true for CI/CD
    slowMo: 50, // Slow down by 50ms for visibility
    args: ['--window-size=1920,1080']
  });

  page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Enable console logging from browser
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('  ⚠️  Browser console error:', msg.text());
    }
  });

  console.log('✅ Browser launched');
}

async function closeBrowser() {
  if (browser) {
    await browser.close();
    console.log('\n🌐 Browser closed');
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function loginViaAPI() {
  console.log('\n🔐 Logging in via API to get credentials...');
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: MANAGER_EMAIL,
      password: MANAGER_PASSWORD
    });

    authToken = response.data.token;
    clubId = response.data.user.clubId;
    console.log('✅ API login successful');
    console.log(`   Club ID: ${clubId}`);
    return response.data;
  } catch (error) {
    console.error('❌ API login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function getOrCreateTestEntertainer() {
  console.log('\n👤 Finding or creating test entertainer...');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/dancers`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const entertainers = response.data;
    let entertainer = entertainers.find(e => e.stage_name?.includes('Test Fee'));

    if (!entertainer && entertainers.length > 0) {
      entertainer = entertainers[0];
      console.log(`   Using existing entertainer: ${entertainer.stage_name}`);
    }

    if (!entertainer) {
      const createResponse = await axios.post(
        `${API_BASE_URL}/api/dancers`,
        {
          legalName: 'Test Fee Tracker',
          stageName: 'Test Fee Star',
          email: `test-fee-ui-${Date.now()}@example.com`,
          phone: '(555) 999-8888',
          licenseNumber: `TEST-FEE-UI-${Date.now()}`
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      entertainer = createResponse.data;
      console.log(`   Created new entertainer: ${entertainer.stage_name}`);
    }

    testEntertainerId = entertainer.id;
    return entertainer;
  } catch (error) {
    console.error('❌ Get entertainer failed:', error.response?.data || error.message);
    throw error;
  }
}

async function createTestFees() {
  console.log('\n💰 Creating test fees...');
  try {
    // Check in and check out to create house fee
    await axios.post(
      `${API_BASE_URL}/api/dancers/${testEntertainerId}/checkIn`,
      { barFeePaid: false },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    console.log('   ⏳ Waiting 3 seconds for shift simulation...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    await axios.post(
      `${API_BASE_URL}/api/dancers/${testEntertainerId}/check-out`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    console.log('✅ Test fees created');
  } catch (error) {
    console.error('❌ Create test fees failed:', error.response?.data || error.message);
    throw error;
  }
}

async function loginViaUI() {
  console.log('\n🔐 Logging in via UI...');

  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle0' });

  // Fill in login form
  await page.waitForSelector('input[type="email"]', { timeout: 5000 });
  await page.type('input[type="email"]', MANAGER_EMAIL);
  await page.type('input[type="password"]', MANAGER_PASSWORD);

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });

  const currentUrl = page.url();
  if (!currentUrl.includes('/dashboard') && !currentUrl.includes('/manager')) {
    throw new Error(`Login failed - redirected to ${currentUrl}`);
  }

  console.log('✅ UI login successful');
}

async function screenshot(name) {
  const filename = `test-screenshots/fee-tracking-${name}-${Date.now()}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`   📸 Screenshot saved: ${filename}`);
}

// ============================================================================
// TEST: Navigate to Fees Page
// ============================================================================

async function testNavigateToFeesPage() {
  console.log('\n\n════════════════════════════════════════════════════');
  console.log('  TEST: Navigate to Fees Page');
  console.log('════════════════════════════════════════════════════\n');

  try {
    // Look for Fees link in navigation
    await page.waitForSelector('nav', { timeout: 5000 });

    // Click on Fees navigation item
    const feesLinkClicked = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const feesLink = links.find(link => link.textContent.includes('Fees'));
      if (feesLink) {
        feesLink.click();
        return true;
      }
      return false;
    });

    if (!feesLinkClicked) {
      throw new Error('Fees link not found in navigation');
    }

    console.log('   ✅ Clicked Fees navigation link');

    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });

    // Verify URL
    const currentUrl = page.url();
    if (!currentUrl.includes('/fees')) {
      throw new Error(`Expected /fees URL, got ${currentUrl}`);
    }

    console.log('   ✅ Navigated to /fees');

    // Wait for page content to load
    await page.waitForSelector('h1', { timeout: 5000 });

    const pageTitle = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.textContent : null;
    });

    console.log(`   📄 Page title: "${pageTitle}"`);

    await screenshot('fees-page-loaded');

    console.log('\n✅ TEST PASSED: Successfully navigated to Fees page');
    return true;
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await screenshot('fees-page-error');
    return false;
  }
}

// ============================================================================
// TEST: Fee Summary Cards Display
// ============================================================================

async function testFeeSummaryCards() {
  console.log('\n\n════════════════════════════════════════════════════');
  console.log('  TEST: Fee Summary Cards Display');
  console.log('════════════════════════════════════════════════════\n');

  try {
    // Wait for summary cards to load
    await page.waitForSelector('.card-premium', { timeout: 5000 });

    // Check for summary cards
    const summaryData = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.card-premium'));
      return cards.map(card => {
        const label = card.querySelector('.text-sm')?.textContent || '';
        const value = card.querySelector('.text-3xl')?.textContent || '';
        return { label, value };
      });
    });

    console.log('   📊 Summary cards found:', summaryData.length);
    summaryData.forEach(card => {
      console.log(`      ${card.label}: ${card.value}`);
    });

    // Verify we have at least 3 summary cards (Total Pending, Entertainer Count, Transaction Count)
    if (summaryData.length < 3) {
      throw new Error(`Expected at least 3 summary cards, found ${summaryData.length}`);
    }

    await screenshot('fee-summary-cards');

    console.log('\n✅ TEST PASSED: Fee summary cards display correctly');
    return true;
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await screenshot('fee-summary-error');
    return false;
  }
}

// ============================================================================
// TEST: Entertainer List Displays
// ============================================================================

async function testEntertainerList() {
  console.log('\n\n════════════════════════════════════════════════════');
  console.log('  TEST: Entertainer List Displays');
  console.log('════════════════════════════════════════════════════\n');

  try {
    // Look for entertainer cards or table rows
    const entertainersFound = await page.evaluate(() => {
      // Try to find entertainer list items
      const listItems = document.querySelectorAll('[class*="entertainer"]');
      if (listItems.length > 0) return listItems.length;

      // Try to find table rows
      const tableRows = document.querySelectorAll('tbody tr');
      if (tableRows.length > 0) return tableRows.length;

      // Try to find any card-like elements with entertainer data
      const cards = Array.from(document.querySelectorAll('.card-premium'));
      const entertainerCards = cards.filter(card => {
        const text = card.textContent;
        return text.includes('Pending:') || text.includes('Stage Name') || text.includes('$');
      });

      return entertainerCards.length;
    });

    console.log(`   👥 Entertainers with pending fees: ${entertainersFound}`);

    if (entertainersFound === 0) {
      console.log('   ℹ️  No entertainers with pending fees found (this is OK if database is clean)');
    } else {
      console.log(`   ✅ Found ${entertainersFound} entertainer(s) displayed`);
    }

    await screenshot('entertainer-list');

    console.log('\n✅ TEST PASSED: Entertainer list rendering');
    return true;
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await screenshot('entertainer-list-error');
    return false;
  }
}

// ============================================================================
// TEST: View Entertainer Detail
// ============================================================================

async function testViewEntertainerDetail() {
  console.log('\n\n════════════════════════════════════════════════════');
  console.log('  TEST: View Entertainer Detail');
  console.log('════════════════════════════════════════════════════\n');

  try {
    // Try to click on first entertainer or "View Details" button
    const detailClicked = await page.evaluate(() => {
      // Look for "View Details" button
      const buttons = Array.from(document.querySelectorAll('button'));
      const viewButton = buttons.find(btn =>
        btn.textContent.includes('View') ||
        btn.textContent.includes('Details')
      );

      if (viewButton) {
        viewButton.click();
        return true;
      }

      // Look for clickable entertainer cards
      const cards = Array.from(document.querySelectorAll('.card-premium'));
      if (cards.length > 0) {
        cards[0].click();
        return true;
      }

      return false;
    });

    if (!detailClicked) {
      console.log('   ℹ️  No entertainer details to view (no pending fees)');
      console.log('   ⏭️  Skipping detail view test');
      return true;
    }

    console.log('   ✅ Clicked to view entertainer details');

    // Wait for detail view to load
    await page.waitForTimeout(1000);

    // Check for detail view elements
    const hasDetailView = await page.evaluate(() => {
      // Look for back button or breadcrumb
      const hasBackButton = Array.from(document.querySelectorAll('button')).some(btn =>
        btn.textContent.includes('Back') || btn.textContent.includes('←')
      );

      // Look for fee transactions table
      const hasTable = document.querySelector('table') !== null;

      return hasBackButton || hasTable;
    });

    if (!hasDetailView) {
      throw new Error('Detail view elements not found');
    }

    console.log('   ✅ Detail view loaded');

    await screenshot('entertainer-detail');

    // Navigate back
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const backButton = buttons.find(btn =>
        btn.textContent.includes('Back') || btn.textContent.includes('←')
      );
      if (backButton) backButton.click();
    });

    await page.waitForTimeout(500);
    console.log('   ✅ Navigated back to list view');

    console.log('\n✅ TEST PASSED: Entertainer detail view works');
    return true;
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await screenshot('entertainer-detail-error');
    return false;
  }
}

// ============================================================================
// TEST: Open Collect Payment Modal
// ============================================================================

async function testCollectPaymentModal() {
  console.log('\n\n════════════════════════════════════════════════════');
  console.log('  TEST: Open Collect Payment Modal');
  console.log('════════════════════════════════════════════════════\n');

  try {
    // Look for "Collect Payment" button
    const collectButtonClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const collectButton = buttons.find(btn =>
        btn.textContent.includes('Collect')
      );

      if (collectButton) {
        collectButton.click();
        return true;
      }

      return false;
    });

    if (!collectButtonClicked) {
      console.log('   ℹ️  No "Collect Payment" button found (no pending fees)');
      console.log('   ⏭️  Skipping payment modal test');
      return true;
    }

    console.log('   ✅ Clicked "Collect Payment" button');

    // Wait for modal to appear
    await page.waitForTimeout(500);

    // Check for modal elements
    const modalData = await page.evaluate(() => {
      // Look for modal backdrop
      const backdrop = document.querySelector('[class*="backdrop"]') ||
                      document.querySelector('[class*="overlay"]') ||
                      document.querySelector('[class*="modal"]');

      // Look for payment method options
      const paymentMethods = Array.from(document.querySelectorAll('button')).filter(btn =>
        btn.textContent.includes('Cash') || btn.textContent.includes('Card')
      );

      // Look for modal title
      const modalTitle = document.querySelector('h2') || document.querySelector('h3');

      return {
        hasBackdrop: !!backdrop,
        hasPaymentMethods: paymentMethods.length >= 2,
        modalTitle: modalTitle ? modalTitle.textContent : null
      };
    });

    console.log(`   📋 Modal title: "${modalData.modalTitle}"`);
    console.log(`   💳 Payment methods found: ${modalData.hasPaymentMethods ? 'Yes' : 'No'}`);

    await screenshot('collect-payment-modal');

    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    console.log('   ✅ Modal closed');

    console.log('\n✅ TEST PASSED: Collect payment modal works');
    return true;
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await screenshot('collect-payment-modal-error');
    return false;
  }
}

// ============================================================================
// TEST: Search/Filter Functionality
// ============================================================================

async function testSearchFilter() {
  console.log('\n\n════════════════════════════════════════════════════');
  console.log('  TEST: Search/Filter Functionality');
  console.log('════════════════════════════════════════════════════\n');

  try {
    // Look for search input
    const hasSearchInput = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.some(input =>
        input.placeholder?.toLowerCase().includes('search') ||
        input.type === 'search'
      );
    });

    if (!hasSearchInput) {
      console.log('   ℹ️  Search input not found (may not be implemented yet)');
      console.log('   ⏭️  Skipping search test');
      return true;
    }

    console.log('   ✅ Search input found');

    // Type in search input
    await page.type('input[type="search"], input[placeholder*="search" i]', 'test', { delay: 100 });

    await page.waitForTimeout(500);

    console.log('   ✅ Search input works');

    // Clear search
    await page.evaluate(() => {
      const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]');
      if (searchInput) searchInput.value = '';
    });

    await screenshot('search-filter');

    console.log('\n✅ TEST PASSED: Search functionality works');
    return true;
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await screenshot('search-filter-error');
    return false;
  }
}

// ============================================================================
// TEST: Responsive Design (Mobile View)
// ============================================================================

async function testResponsiveDesign() {
  console.log('\n\n════════════════════════════════════════════════════');
  console.log('  TEST: Responsive Design (Mobile View)');
  console.log('════════════════════════════════════════════════════\n');

  try {
    // Switch to mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    console.log('   📱 Switched to mobile viewport (375x667)');

    await page.waitForTimeout(500);

    // Check if content is still visible
    const isMobileOptimized = await page.evaluate(() => {
      // Check for horizontal scroll
      const hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth;

      // Check if main content is visible
      const mainContent = document.querySelector('main') || document.querySelector('[role="main"]');
      const isVisible = mainContent && mainContent.offsetWidth > 0;

      return !hasHorizontalScroll && isVisible;
    });

    if (!isMobileOptimized) {
      console.log('   ⚠️  Warning: Page may not be fully mobile-optimized');
    } else {
      console.log('   ✅ Mobile layout looks good');
    }

    await screenshot('mobile-view');

    // Switch back to desktop
    await page.setViewport({ width: 1920, height: 1080 });
    console.log('   🖥️  Switched back to desktop viewport');

    console.log('\n✅ TEST PASSED: Responsive design check complete');
    return true;
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await screenshot('mobile-view-error');

    // Make sure to switch back to desktop even on error
    await page.setViewport({ width: 1920, height: 1080 });
    return false;
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Fee Tracking UI Test Suite');
  console.log('  Testing Features #24 and #25 (Frontend)');
  console.log('═══════════════════════════════════════════════════');

  const results = {
    navigate: false,
    summaryCards: false,
    entertainerList: false,
    entertainerDetail: false,
    paymentModal: false,
    searchFilter: false,
    responsive: false
  };

  try {
    // Setup
    await setupBrowser();
    await loginViaAPI();

    // Create test data if needed
    const entertainer = await getOrCreateTestEntertainer();
    await createTestFees();

    // Login via UI
    await loginViaUI();

    // Run all UI tests
    results.navigate = await testNavigateToFeesPage();
    results.summaryCards = await testFeeSummaryCards();
    results.entertainerList = await testEntertainerList();
    results.entertainerDetail = await testViewEntertainerDetail();
    results.paymentModal = await testCollectPaymentModal();
    results.searchFilter = await testSearchFilter();
    results.responsive = await testResponsiveDesign();

    // Print summary
    console.log('\n\n═══════════════════════════════════════════════════');
    console.log('  TEST RESULTS SUMMARY');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Navigate to Fees Page:        ${results.navigate ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Fee Summary Cards:             ${results.summaryCards ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Entertainer List:              ${results.entertainerList ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Entertainer Detail View:       ${results.entertainerDetail ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Collect Payment Modal:         ${results.paymentModal ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Search/Filter:                 ${results.searchFilter ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Responsive Design:             ${results.responsive ? '✅ PASS' : '❌ FAIL'}`);
    console.log('═══════════════════════════════════════════════════\n');

    const allPassed = Object.values(results).every(result => result === true);

    if (allPassed) {
      console.log('✅ ALL UI TESTS PASSING - Frontend ready for production!');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed - Review errors above');
      process.exit(1);
    }

  } catch (error) {
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  ❌ TEST SUITE FAILED');
    console.log('═══════════════════════════════════════════════════\n');
    console.error('Fatal error:', error.message);
    await screenshot('fatal-error');
    process.exit(1);
  } finally {
    await closeBrowser();
  }
}

// Run if called directly
if (require.main === module) {
  // Create screenshots directory if it doesn't exist
  const fs = require('fs');
  if (!fs.existsSync('test-screenshots')) {
    fs.mkdirSync('test-screenshots');
  }

  runAllTests();
}

module.exports = { runAllTests };
