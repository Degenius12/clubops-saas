// Test script for Fee Tracking features (#24-25)
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

// Demo owner/manager credentials
const MANAGER_EMAIL = 'manager@demo.clubflow.com';
const MANAGER_PASSWORD = 'demo123';

let authToken = '';
let clubId = '';
let testEntertainerId = '';
let testCheckInId = '';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function login() {
  console.log('\n🔐 Logging in as manager...');
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: MANAGER_EMAIL,
      password: MANAGER_PASSWORD
    });

    authToken = response.data.token;
    clubId = response.data.user.clubId;
    console.log('✅ Login successful');
    console.log(`   Club ID: ${clubId}`);
    console.log(`   Role: ${response.data.user.role}`);
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function getOrCreateTestEntertainer() {
  console.log('\n👤 Finding or creating test entertainer...');
  try {
    // Try to find existing test entertainer
    const response = await axios.get(`${API_BASE_URL}/api/dancers`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const entertainers = response.data;
    let entertainer = entertainers.find(e => e.stage_name?.includes('Test Fee'));

    if (!entertainer && entertainers.length > 0) {
      // Use first available entertainer
      entertainer = entertainers[0];
      console.log(`   Using existing entertainer: ${entertainer.stage_name}`);
    }

    if (!entertainer) {
      // Create new test entertainer
      const createResponse = await axios.post(
        `${API_BASE_URL}/api/dancers`,
        {
          legalName: 'Test Fee Tracker',
          stageName: 'Test Fee Star',
          email: `test-fee-${Date.now()}@example.com`,
          phone: '(555) 999-8888',
          licenseNumber: `TEST-FEE-${Date.now()}`
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

// ============================================================================
// TEST FEATURE #24: Automatic House Fee Calculation
// ============================================================================

async function testAutomaticHouseFeeCalculation() {
  console.log('\n\n════════════════════════════════════════════════════');
  console.log('  TEST FEATURE #24: Automatic House Fee Calculation');
  console.log('════════════════════════════════════════════════════\n');

  try {
    const entertainer = await getOrCreateTestEntertainer();

    // Step 1: Check in the entertainer
    console.log('Step 1: Checking in entertainer...');
    const checkInResponse = await axios.post(
      `${API_BASE_URL}/api/dancers/${testEntertainerId}/checkIn`,
      {
        barFeePaid: false // Don't pay bar fee at check-in to test house fee creation
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    testCheckInId = checkInResponse.data.check_in_id;
    console.log(`✅ Checked in: ${entertainer.stage_name}`);
    console.log(`   Check-in ID: ${testCheckInId}`);

    // Wait 3 seconds to simulate shift time
    console.log('\nWaiting 3 seconds to simulate shift...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 2: Check out the entertainer (should automatically calculate house fee)
    console.log('\nStep 2: Checking out entertainer...');
    const checkOutResponse = await axios.post(
      `${API_BASE_URL}/api/dancers/${testEntertainerId}/check-out`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    console.log('✅ Checked out successfully');
    console.log(`   Shift Duration: ${checkOutResponse.data.shift_duration_hours} hours`);
    console.log(`   House Fee Calculated: $${checkOutResponse.data.house_fee_calculated}`);
    console.log(`   House Fee Status: ${checkOutResponse.data.house_fee_status}`);

    // Step 3: Verify house fee transaction was created
    console.log('\nStep 3: Verifying house fee transaction...');
    const feesResponse = await axios.get(
      `${API_BASE_URL}/api/fees/entertainer/${testEntertainerId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    console.log('✅ Fee details retrieved');
    console.log(`   Total Pending: $${feesResponse.data.pending.total}`);
    console.log(`   Pending Transactions: ${feesResponse.data.pending.transactions.length}`);

    if (feesResponse.data.pending.transactions.length > 0) {
      const houseFee = feesResponse.data.pending.transactions.find(t =>
        t.type === 'HOUSE_FEE' || t.description.includes('House fee')
      );

      if (houseFee) {
        console.log(`\n   ✅ FEATURE #24 PASSING: House fee automatically created`);
        console.log(`      Amount: $${houseFee.amount}`);
        console.log(`      Description: ${houseFee.description}`);
        return true;
      } else {
        console.log('\n   ⚠️  No house fee found in pending transactions');
        return false;
      }
    } else {
      console.log('\n   ⚠️  No pending transactions found');
      return false;
    }

  } catch (error) {
    console.error('\n❌ Feature #24 test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// ============================================================================
// TEST FEATURE #25: Collect and Record Tip-Out
// ============================================================================

async function testTipOutCollection() {
  console.log('\n\n════════════════════════════════════════════════════');
  console.log('  TEST FEATURE #25: Collect and Record Tip-Out');
  console.log('════════════════════════════════════════════════════\n');

  try {
    // Step 1: Get pending fees for entertainer
    console.log('Step 1: Getting pending fees...');
    const feesResponse = await axios.get(
      `${API_BASE_URL}/api/fees/entertainer/${testEntertainerId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    console.log(`✅ Pending fees retrieved: $${feesResponse.data.pending.total}`);
    console.log(`   Transactions: ${feesResponse.data.pending.transactions.length}`);

    if (feesResponse.data.pending.transactions.length === 0) {
      console.log('\n   ⚠️  No pending transactions to collect. Creating test transaction...');

      // Create a manual transaction for testing
      await axios.post(
        `${API_BASE_URL}/api/fees/collect-payment`,
        {
          entertainerId: testEntertainerId,
          amount: 50.00,
          paymentMethod: 'cash',
          notes: 'Test tip-out payment'
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      console.log('   ✅ Created test transaction');
    }

    // Step 2: Collect all pending payments
    console.log('\nStep 2: Collecting all pending payments...');
    const collectResponse = await axios.post(
      `${API_BASE_URL}/api/fees/collect-payment`,
      {
        entertainerId: testEntertainerId,
        collectAll: true,
        paymentMethod: 'cash',
        notes: 'End of shift tip-out collection'
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    console.log('✅ Payment collected successfully');
    console.log(`   Amount Collected: $${collectResponse.data.payment.amount}`);
    console.log(`   Payment Method: ${collectResponse.data.payment.paymentMethod}`);
    console.log(`   Transactions Updated: ${collectResponse.data.payment.transactionCount}`);

    // Step 3: Verify all fees are now paid
    console.log('\nStep 3: Verifying fees are marked as paid...');
    const verifyResponse = await axios.get(
      `${API_BASE_URL}/api/fees/entertainer/${testEntertainerId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    console.log(`✅ Verification complete`);
    console.log(`   Pending After Collection: $${verifyResponse.data.pending.total}`);
    console.log(`   Total Paid: $${verifyResponse.data.paid.total}`);

    if (verifyResponse.data.pending.total < 0.01) {
      console.log(`\n   ✅ FEATURE #25 PASSING: Tip-out collection working correctly`);
      return true;
    } else {
      console.log(`\n   ⚠️  Still have pending fees after collection`);
      return false;
    }

  } catch (error) {
    console.error('\n❌ Feature #25 test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// ============================================================================
// ADDITIONAL TESTS: Fee Management Endpoints
// ============================================================================

async function testFeeManagementEndpoints() {
  console.log('\n\n════════════════════════════════════════════════════');
  console.log('  ADDITIONAL TESTS: Fee Management Endpoints');
  console.log('════════════════════════════════════════════════════\n');

  try {
    // Test 1: Fee Summary
    console.log('Test 1: Get fee summary...');
    const summaryResponse = await axios.get(
      `${API_BASE_URL}/api/fees/summary`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    console.log('✅ Fee summary retrieved');
    console.log(`   Total Collected: $${summaryResponse.data.summary.collected}`);
    console.log(`   Total Pending: $${summaryResponse.data.summary.pending}`);
    console.log(`   Entertainers: ${summaryResponse.data.byEntertainer.length}`);

    // Test 2: All Pending Fees
    console.log('\nTest 2: Get all pending fees...');
    const pendingResponse = await axios.get(
      `${API_BASE_URL}/api/fees/pending`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    console.log('✅ Pending fees retrieved');
    console.log(`   Total Pending: $${pendingResponse.data.totalPending}`);
    console.log(`   Entertainer Count: ${pendingResponse.data.entertainerCount}`);
    console.log(`   Transaction Count: ${pendingResponse.data.transactionCount}`);

    // Test 3: Manual Fee Calculation
    if (testCheckInId) {
      console.log('\nTest 3: Manual house fee calculation...');
      const calcResponse = await axios.post(
        `${API_BASE_URL}/api/fees/calculate-house-fee`,
        { checkInId: testCheckInId },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      console.log('✅ Fee calculated manually');
      console.log(`   Amount: $${calcResponse.data.fee.amount}`);
      console.log(`   Calculation: ${calcResponse.data.fee.calculation}`);
      console.log(`   Type: ${calcResponse.data.fee.type}`);
    }

    console.log('\n✅ All additional endpoints working correctly');
    return true;

  } catch (error) {
    console.error('\n❌ Additional tests failed:', error.response?.data || error.message);
    return false;
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Fee Tracking Test Suite');
  console.log('  Testing Features #24 and #25');
  console.log('═══════════════════════════════════════════════════');

  const results = {
    feature24: false,
    feature25: false,
    additional: false
  };

  try {
    await login();

    results.feature24 = await testAutomaticHouseFeeCalculation();
    results.feature25 = await testTipOutCollection();
    results.additional = await testFeeManagementEndpoints();

    console.log('\n\n═══════════════════════════════════════════════════');
    console.log('  TEST RESULTS SUMMARY');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Feature #24 (House Fee Calculation): ${results.feature24 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Feature #25 (Tip-Out Collection):    ${results.feature25 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Additional Endpoints:                ${results.additional ? '✅ PASS' : '❌ FAIL'}`);
    console.log('═══════════════════════════════════════════════════\n');

    if (results.feature24 && results.feature25) {
      console.log('✅ ALL CRITICAL FEATURES PASSING - Ready to update feature_list.json');
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
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };
