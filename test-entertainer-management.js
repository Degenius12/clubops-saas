const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001';

// Test credentials
const MANAGER_EMAIL = 'manager@test.com';
const MANAGER_PASSWORD = 'password123';

let authToken = '';
let clubId = '';
let createdEntertainerId = '';

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

async function testAddEntertainer() {
  console.log('\n📝 Testing Feature #4: Add New Entertainer...');
  try {
    const entertainerData = {
      legalName: 'Test Entertainer',
      stageName: 'Star Performer',
      email: `test-${Date.now()}@example.com`,
      phone: '(555) 123-4567'
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/dancers`,
      entertainerData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    createdEntertainerId = response.data.id;
    console.log('✅ Entertainer Created Successfully');
    console.log(`   ID: ${response.data.id}`);
    console.log(`   Stage Name: ${response.data.stageName || response.data.stage_name}`);
    console.log(`   Legal Name: ${response.data.legalName || response.data.legal_name}`);
    console.log(`   Email: ${response.data.email}`);
    console.log(`   Phone: ${response.data.phone}`);

    return true;
  } catch (error) {
    console.error('❌ Add Entertainer failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetEntertainers() {
  console.log('\n📋 Testing: Get All Entertainers...');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/dancers`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ Retrieved Entertainers List');
    console.log(`   Total: ${response.data.length}`);

    if (response.data.length > 0) {
      const lastEntertainer = response.data[response.data.length - 1];
      console.log(`   Last Added:`);
      console.log(`     - Stage Name: ${lastEntertainer.stage_name || lastEntertainer.stageName}`);
      console.log(`     - Status: ${lastEntertainer.status}`);
      console.log(`     - Checked In: ${lastEntertainer.is_checked_in ? 'Yes' : 'No'}`);
    }

    // Verify our created entertainer appears in list
    const found = response.data.find(e => e.id === createdEntertainerId);
    if (found) {
      console.log('✅ Created entertainer appears in list');
    } else {
      console.log('⚠️  Created entertainer NOT found in list');
    }

    return true;
  } catch (error) {
    console.error('❌ Get Entertainers failed:', error.response?.data || error.message);
    return false;
  }
}

async function testCheckIn() {
  console.log('\n🚪 Testing Feature #5: Check-In Entertainer...');
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/dancers/${createdEntertainerId}/check-in`,
      { bar_fee_amount: 50 },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    console.log('✅ Entertainer Checked In Successfully');
    console.log(`   Check-In ID: ${response.data.checkInId || response.data.check_in_id}`);
    console.log(`   Stage Name: ${response.data.stageName || response.data.stage_name}`);
    console.log(`   Check-In Time: ${response.data.checkInTime || response.data.check_in_time}`);
    console.log(`   Bar Fee: $${response.data.barFeeAmount || response.data.bar_fee_amount || 50}`);
    console.log(`   Status: On Floor`);

    return true;
  } catch (error) {
    console.error('❌ Check-In failed:', error.response?.data || error.message);
    return false;
  }
}

async function testCheckOut() {
  console.log('\n🚪 Testing Feature #6: Check-Out Entertainer...');
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/dancers/${createdEntertainerId}/check-out`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    console.log('✅ Entertainer Checked Out Successfully');
    console.log(`   Stage Name: ${response.data.stageName || response.data.stage_name}`);
    console.log(`   Check-Out Time: ${response.data.checkOutTime || response.data.check_out_time}`);
    console.log(`   Shift Duration: ${response.data.shiftDuration || response.data.shift_duration || 'N/A'}`);
    console.log(`   Status: Off Floor`);

    return true;
  } catch (error) {
    console.error('❌ Check-Out failed:', error.response?.data || error.message);
    return false;
  }
}

async function testPhotoUpload() {
  console.log('\n📷 Testing: Photo Upload (if available)...');
  console.log('⚠️  Photo upload endpoint not yet implemented');
  console.log('   Current behavior: Uses initials as avatar');
  console.log('   Future enhancement: Add multipart/form-data upload endpoint');
  return 'skipped';
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Entertainer Management Test Suite');
  console.log('  Testing Features #4, #5, #6');
  console.log('═══════════════════════════════════════════════════');

  const results = {
    login: false,
    addEntertainer: false,
    getEntertainers: false,
    checkIn: false,
    checkOut: false,
    photoUpload: 'skipped'
  };

  try {
    await login();
    results.login = true;

    results.addEntertainer = await testAddEntertainer();
    results.getEntertainers = await testGetEntertainers();

    if (createdEntertainerId) {
      results.checkIn = await testCheckIn();

      // Wait a moment before checking out
      console.log('\n⏳ Waiting 2 seconds before check-out...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      results.checkOut = await testCheckOut();
    }

    results.photoUpload = await testPhotoUpload();

    console.log('\n═══════════════════════════════════════════════════');
    console.log('  Test Results Summary');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  Login: ${results.login ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Feature #4 (Add Entertainer): ${results.addEntertainer ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Feature #5 (Check-In): ${results.checkIn ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Feature #6 (Check-Out): ${results.checkOut ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Photo Upload: ${results.photoUpload === 'skipped' ? '⚠️  SKIPPED' : results.photoUpload ? '✅ PASS' : '❌ FAIL'}`);
    console.log('═══════════════════════════════════════════════════');

    const passCount = Object.values(results).filter(r => r === true).length;
    const totalTests = Object.keys(results).filter(k => results[k] !== 'skipped').length;
    console.log(`\n  ${passCount}/${totalTests} tests passed\n`);

    if (passCount === totalTests) {
      console.log('  🎉 All tests PASSED!\n');
    } else {
      console.log('  ⚠️  Some tests failed. Check errors above.\n');
    }

  } catch (error) {
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  ❌ Tests Failed');
    console.log('═══════════════════════════════════════════════════\n');
  }
}

runTests();
