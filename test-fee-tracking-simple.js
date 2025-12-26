// Simple test script for Fee Tracking - Backend API only
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';
const MANAGER_EMAIL = 'manager@demo.clubflow.com';
const MANAGER_PASSWORD = 'demo123';

let authToken = '';
let clubId = '';

async function login() {
  console.log('\n🔐 Logging in as manager...');
  const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
    email: MANAGER_EMAIL,
    password: MANAGER_PASSWORD
  });

  authToken = response.data.token;
  clubId = response.data.user.clubId;
  console.log('✅ Login successful');
  console.log(`   Club ID: ${clubId}`);
  console.log(`   Role: ${response.data.user.role}\n`);
}

async function testFeeSummary() {
  console.log('TEST 1: Get Fee Summary');
  console.log('────────────────────────────────────');

  const response = await axios.get(
    `${API_BASE_URL}/api/fees/summary`,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );

  console.log(`✅ Total Collected: $${response.data.summary.collected}`);
  console.log(`   Total Pending: $${response.data.summary.pending}`);
  console.log(`   Entertainers with fees: ${response.data.byEntertainer.length}\n`);
}

async function testPendingFees() {
  console.log('TEST 2: Get All Pending Fees');
  console.log('────────────────────────────────────');

  const response = await axios.get(
    `${API_BASE_URL}/api/fees/pending`,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );

  console.log(`✅ Total Pending: $${response.data.totalPending}`);
  console.log(`   Entertainer Count: ${response.data.entertainerCount}`);
  console.log(`   Transaction Count: ${response.data.transactionCount}\n`);
}

async function testEntertainerFees() {
  console.log('TEST 3: Get Entertainer-Specific Fees');
  console.log('────────────────────────────────────');

  // First, get list of entertainers
  const entertainersResponse = await axios.get(
    `${API_BASE_URL}/api/dancers`,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );

  const entertainers = entertainersResponse.data;
  if (entertainers.length === 0) {
    console.log('⚠️  No entertainers found in system\n');
    return;
  }

  const testEntertainer = entertainers[0];
  console.log(`   Testing with entertainer: ${testEntertainer.stage_name} (ID: ${testEntertainer.id})`);

  const feesResponse = await axios.get(
    `${API_BASE_URL}/api/fees/entertainer/${testEntertainer.id}`,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );

  console.log(`✅ Pending Total: $${feesResponse.data.pending.total}`);
  console.log(`   Pending Transactions: ${feesResponse.data.pending.transactions.length}`);
  console.log(`   Paid Total: $${feesResponse.data.paid.total}`);
  console.log(`   Paid Transactions: ${feesResponse.data.paid.transactions.length}`);
  console.log(`   Lifetime Total: $${feesResponse.data.summary.lifetimeTotal}\n`);
}

async function testAPI() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Fee Tracking API - Simple Test');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    await login();
    await testFeeSummary();
    await testPendingFees();
    await testEntertainerFees();

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ ALL API TESTS PASSED');
    console.log('═══════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('   Details:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testAPI();
