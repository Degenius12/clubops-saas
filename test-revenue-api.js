const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001';

// Demo owner credentials
const OWNER_EMAIL = 'owner@test.com';
const OWNER_PASSWORD = 'password123';

let authToken = '';
let clubId = '';

async function login() {
  console.log('\n🔐 Logging in as owner...');
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD
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

async function testRevenueSummary() {
  console.log('\n📊 Testing GET /api/revenue/summary (Feature #17)...');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/revenue/summary`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ Revenue Summary Endpoint');
    console.log('   Response:', JSON.stringify(response.data, null, 2));

    // Verify structure
    if (response.data.today && response.data.yesterday && response.data.comparison) {
      console.log('✅ Response structure is correct');
      console.log(`   Today's Total: $${response.data.today.total}`);
      console.log(`   Revenue Breakdown:`);
      console.log(`     - Bar Fees: $${response.data.today.breakdown.bar_fees}`);
      console.log(`     - VIP Fees: $${response.data.today.breakdown.vip_fees}`);
      console.log(`     - Cover Charges: $${response.data.today.breakdown.cover_charges}`);
      console.log(`     - Other: $${response.data.today.breakdown.other}`);
      console.log(`   Comparison: ${response.data.comparison.percent}% (${response.data.comparison.trend})`);
    } else {
      console.log('⚠️  Response structure is incorrect');
    }
  } catch (error) {
    console.error('❌ Revenue Summary failed:', error.response?.data || error.message);
  }
}

async function testWeeklyRevenue() {
  console.log('\n📈 Testing GET /api/revenue/weekly (Feature #18)...');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/revenue/weekly`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ Weekly Revenue Endpoint');
    console.log('   Response:', JSON.stringify(response.data, null, 2));

    // Verify structure
    if (response.data.daily && Array.isArray(response.data.daily)) {
      console.log('✅ Response structure is correct');
      console.log(`   Weekly Total: $${response.data.weekly_total}`);
      console.log(`   Previous Week: $${response.data.previous_week_total}`);
      console.log(`   Change: ${response.data.change_percent}% (${response.data.trend})`);
      console.log(`   Daily Breakdown (${response.data.daily.length} days):`);
      response.data.daily.forEach(day => {
        console.log(`     - ${day.day} (${day.date}): $${day.total}`);
      });
    } else {
      console.log('⚠️  Response structure is incorrect');
    }
  } catch (error) {
    console.error('❌ Weekly Revenue failed:', error.response?.data || error.message);
  }
}

async function testMonthlyRevenue() {
  console.log('\n📅 Testing GET /api/revenue/monthly...');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/revenue/monthly`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ Monthly Revenue Endpoint');
    console.log('   Response:', JSON.stringify(response.data, null, 2));

    // Verify structure
    if (response.data.total !== undefined) {
      console.log('✅ Response structure is correct');
      console.log(`   Month: ${response.data.month}`);
      console.log(`   Total: $${response.data.total}`);
      console.log(`   Previous Month: $${response.data.previous_month_total}`);
      console.log(`   Change: ${response.data.change_percent}% (${response.data.trend})`);
    } else {
      console.log('⚠️  Response structure is incorrect');
    }
  } catch (error) {
    console.error('❌ Monthly Revenue failed:', error.response?.data || error.message);
  }
}

async function testAllRevenue() {
  console.log('\n🌍 Testing GET /api/revenue/all...');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/revenue/all`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ All Revenue Endpoint');
    console.log('   Response:', JSON.stringify(response.data, null, 2));

    // Verify structure
    if (response.data.today !== undefined) {
      console.log('✅ Response structure is correct');
      console.log(`   Today: $${response.data.today}`);
      console.log(`   Week: $${response.data.week}`);
      console.log(`   Month: $${response.data.month}`);
      console.log(`   Year: $${response.data.year}`);
    } else {
      console.log('⚠️  Response structure is incorrect');
    }
  } catch (error) {
    console.error('❌ All Revenue failed:', error.response?.data || error.message);
  }
}

async function testUnauthorizedAccess() {
  console.log('\n🔒 Testing unauthorized access (should fail)...');
  try {
    await axios.get(`${API_BASE_URL}/api/revenue/summary`);
    console.log('⚠️  Unauthorized access was allowed (security issue!)');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Unauthorized access correctly blocked (401)');
    } else {
      console.log('⚠️  Unexpected error:', error.response?.status, error.response?.data);
    }
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Revenue Dashboard API Test Suite');
  console.log('  Testing Features #17 and #18');
  console.log('═══════════════════════════════════════════════════');

  try {
    await login();
    await testRevenueSummary();
    await testWeeklyRevenue();
    await testMonthlyRevenue();
    await testAllRevenue();
    await testUnauthorizedAccess();

    console.log('\n═══════════════════════════════════════════════════');
    console.log('  ✅ All Revenue API Tests Complete');
    console.log('═══════════════════════════════════════════════════\n');
  } catch (error) {
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  ❌ Tests Failed');
    console.log('═══════════════════════════════════════════════════\n');
  }
}

runTests();
