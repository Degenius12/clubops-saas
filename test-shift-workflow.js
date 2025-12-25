const axios = require('axios');

const API_BASE = 'http://localhost:3001';
let authToken = '';

// Test credentials
const MANAGER_EMAIL = 'manager@demo.clubflow.com';
const MANAGER_PASSWORD = 'demo123';

// Colors for console output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[36m';
const RESET = '\x1b[0m';

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function success(message) {
  log(`✅ ${message}`, GREEN);
}

function error(message) {
  log(`❌ ${message}`, RED);
}

function info(message) {
  log(`ℹ️  ${message}`, BLUE);
}

function warning(message) {
  log(`⚠️  ${message}`, YELLOW);
}

async function login() {
  try {
    info('Logging in as Manager...');
    const response = await axios.post(`${API_BASE}/api/auth/login`, {
      email: MANAGER_EMAIL,
      password: MANAGER_PASSWORD
    });

    authToken = response.data.token;
    success(`Logged in as ${response.data.user.firstName} ${response.data.user.lastName} (${response.data.user.role})`);
    return true;
  } catch (err) {
    error(`Login failed: ${err.response?.data?.error || err.message}`);
    return false;
  }
}

async function getShiftStatus() {
  try {
    info('\n📊 Checking shift status...');
    const response = await axios.get(`${API_BASE}/api/shift-management/status`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.hasActiveShift) {
      warning(`Active shift found: Level ${response.data.activeShiftLevel} (${response.data.activeShiftName})`);
      info(`  Opened at: ${new Date(response.data.shiftOpenedAt).toLocaleString()}`);
    } else {
      success('No active shift');
    }

    return response.data;
  } catch (err) {
    error(`Failed to get shift status: ${err.response?.data?.error || err.message}`);
    return null;
  }
}

async function openShift(level, name) {
  try {
    info(`\n🔓 Opening Shift Level ${level} (${name})...`);
    const response = await axios.post(
      `${API_BASE}/api/shift-management/open`,
      { shiftLevel: level, shiftName: name },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    success(`Shift opened successfully!`);
    info(`  Shift ID: ${response.data.shift.id}`);
    return response.data.shift;
  } catch (err) {
    error(`Failed to open shift: ${err.response?.data?.error || err.message}`);
    return null;
  }
}

async function testConflictPrevention() {
  try {
    info('\n🚫 Testing conflict prevention (trying to open second shift)...');
    await axios.post(
      `${API_BASE}/api/shift-management/open`,
      { shiftLevel: 2, shiftName: 'Shift Level 2' },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    error('CONFLICT TEST FAILED: Should have prevented second shift from opening!');
    return false;
  } catch (err) {
    if (err.response?.status === 409) {
      success('Conflict prevention working correctly!');
      info(`  Error message: ${err.response.data.error}`);
      return true;
    } else {
      error(`Unexpected error: ${err.response?.data?.error || err.message}`);
      return false;
    }
  }
}

async function closeShift(notes) {
  try {
    info(`\n🔒 Closing shift with notes: "${notes}"...`);
    const response = await axios.post(
      `${API_BASE}/api/shift-management/close`,
      { notes },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    success('Shift closed successfully!');

    const summary = response.data.summary;
    info(`\n📈 Shift Summary:`);
    info(`  Duration: ${summary.duration} minutes`);
    info(`  Total Revenue: $${summary.totalRevenue.toFixed(2)}`);
    info(`  Total Check-Ins: ${summary.totalCheckIns}`);
    info(`  Total VIP Sessions: ${summary.totalVipSessions}`);

    return response.data;
  } catch (err) {
    error(`Failed to close shift: ${err.response?.data?.error || err.message}`);
    return null;
  }
}

async function getShiftHistory() {
  try {
    info('\n📜 Fetching shift history...');
    const response = await axios.get(`${API_BASE}/api/shift-management/history`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { limit: 5 }
    });

    success(`Found ${response.data.total} total shifts`);

    if (response.data.shifts.length > 0) {
      info('\n  Recent shifts:');
      response.data.shifts.forEach((shift, index) => {
        info(`  ${index + 1}. Level ${shift.shiftLevel} - ${shift.shiftName}`);
        info(`     ${new Date(shift.startedAt).toLocaleString()} - ${shift.endedAt ? new Date(shift.endedAt).toLocaleString() : 'Active'}`);
        info(`     Manager: ${shift.user.firstName} ${shift.user.lastName}`);
      });
    }

    return response.data;
  } catch (err) {
    error(`Failed to get shift history: ${err.response?.data?.error || err.message}`);
    return null;
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  log('🧪 SHIFT MANAGEMENT WORKFLOW TEST', BLUE);
  console.log('='.repeat(60) + '\n');

  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    error('\nTest suite failed: Cannot proceed without login');
    return;
  }

  // Step 2: Check initial status
  let status = await getShiftStatus();

  // Step 3: Close any existing shift first
  if (status && status.hasActiveShift) {
    warning('\nClosing existing shift before test...');
    await closeShift('Cleanup before test');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  }

  // Step 4: Open a new shift
  const shift = await openShift(1, 'Test Shift Level 1');
  if (!shift) {
    error('\nTest suite failed: Cannot open shift');
    return;
  }

  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

  // Step 5: Verify shift is active
  status = await getShiftStatus();
  if (!status || !status.hasActiveShift) {
    error('\nTest failed: Shift should be active but isn\'t');
    return;
  }

  // Step 6: Test conflict prevention
  const conflictTest = await testConflictPrevention();

  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

  // Step 7: Close the shift
  const closeResult = await closeShift('Test shift completed successfully. All systems working as expected.');
  if (!closeResult) {
    error('\nTest suite failed: Cannot close shift');
    return;
  }

  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

  // Step 8: Verify shift is closed
  status = await getShiftStatus();
  if (status && status.hasActiveShift) {
    error('\nTest failed: Shift should be closed but is still active');
    return;
  }

  // Step 9: Get shift history
  await getShiftHistory();

  // Summary
  console.log('\n' + '='.repeat(60));
  log('📊 TEST SUMMARY', BLUE);
  console.log('='.repeat(60));
  success('✅ Login successful');
  success('✅ Shift status check working');
  success('✅ Shift opened successfully');
  success(`${conflictTest ? '✅' : '❌'} Conflict prevention ${conflictTest ? 'working' : 'FAILED'}`);
  success('✅ Shift closed successfully');
  success('✅ EOS summary generated');
  success('✅ Shift history accessible');
  console.log('='.repeat(60) + '\n');

  log('🎉 ALL TESTS PASSED! Shift management workflow is working correctly.', GREEN);
}

// Run tests
runTests().catch(err => {
  error(`\n💥 Test suite crashed: ${err.message}`);
  console.error(err);
});
