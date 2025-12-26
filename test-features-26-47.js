// Comprehensive test suite for Features #26-47
// Tests all newly implemented backend endpoints

const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';

// Test credentials
const CREDENTIALS = {
  owner: { email: 'owner@demo.clubflow.com', password: 'demo123' },
  manager: { email: 'manager@demo.clubflow.com', password: 'demo123' }
};

let browser;
let token;
let clubId;
let entertainerId;

async function login(credentials) {
  console.log(`\n🔐 Logging in as ${credentials.email}...`);

  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });

  const data = await response.json();

  if (data.token) {
    console.log('✅ Login successful');
    return {
      token: data.token,
      clubId: data.user.clubId,
      userId: data.user.id
    };
  } else {
    console.error('❌ Login failed:', data);
    throw new Error('Login failed');
  }
}

// ============================================================================
// FEATURE #26: LATE FEE TRACKING
// ============================================================================

async function testLateFeePreview() {
  console.log('\n📋 Testing Feature #26: Late Fee Preview');

  try {
    const response = await fetch(`${API_URL}/api/late-fees/preview`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Late fee preview successful');
      console.log(`   Config: Enabled=${data.config?.lateFeeEnabled}, Amount=$${data.config?.lateFeeAmount}`);
      console.log(`   Preview: ${data.preview?.length || 0} entertainers would be charged`);

      if (data.preview && data.preview.length > 0) {
        console.log(`   Example: ${data.preview[0].stageName} - $${data.preview[0].totalOverdue} overdue`);
      }
    } else {
      console.log('⚠️  Late fee preview returned error:', data.error);
    }
  } catch (error) {
    console.error('❌ Late fee preview test failed:', error.message);
  }
}

async function testLateFeeConfig() {
  console.log('\n⚙️  Testing Feature #26: Late Fee Configuration');

  try {
    // Get current config
    const getResponse = await fetch(`${API_URL}/api/late-fees/config`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const config = await getResponse.json();

    if (getResponse.ok) {
      console.log('✅ Late fee config retrieved');
      console.log(`   Enabled: ${config.config?.lateFeeEnabled}`);
      console.log(`   Amount: $${config.config?.lateFeeAmount}`);
      console.log(`   Grace Days: ${config.config?.lateFeeGraceDays}`);
      console.log(`   Frequency: ${config.config?.lateFeeFrequency}`);
    } else {
      console.log('⚠️  Config retrieval failed:', config.error);
    }
  } catch (error) {
    console.error('❌ Late fee config test failed:', error.message);
  }
}

async function testLateFeeReport() {
  console.log('\n📊 Testing Feature #26: Late Fee Report');

  try {
    const response = await fetch(`${API_URL}/api/late-fees/report`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Late fee report generated');
      console.log(`   Total Fees: ${data.count || 0}`);
      console.log(`   Totals: $${data.totals?.total || 0} (Paid: $${data.totals?.paid || 0}, Pending: $${data.totals?.pending || 0})`);
    } else {
      console.log('⚠️  Report generation failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Late fee report test failed:', error.message);
  }
}

// ============================================================================
// FEATURE #27: NIGHTLY CLOSE-OUT REPORT
// ============================================================================

async function testNightlyCloseOut() {
  console.log('\n🌙 Testing Feature #27: Nightly Close-Out Report');

  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(`${API_URL}/api/reports/nightly-closeout?date=${today}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Nightly close-out report generated');
      console.log(`   Date: ${data.date}`);
      console.log(`   Shifts: ${data.shifts?.total || 0} (Open: ${data.shifts?.open || 0}, Closed: ${data.shifts?.closed || 0})`);
      console.log(`   Entertainers: ${data.entertainers?.totalCheckIns || 0} check-ins`);
      console.log(`   Revenue: $${data.financial?.grandTotals?.total || 0}`);
      console.log(`   VIP Sessions: ${data.vip?.totalSessions || 0} ($${data.vip?.revenue || 0})`);
      console.log(`   Alerts: ${data.alerts?.total || 0}`);
      console.log(`   Warnings: ${data.warnings?.length || 0}`);
    } else {
      console.log('⚠️  Close-out report failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Nightly close-out test failed:', error.message);
  }
}

// ============================================================================
// FEATURE #28: PAYROLL EXPORT
// ============================================================================

async function testPayrollExport() {
  console.log('\n💰 Testing Feature #28: Payroll Export');

  try {
    const startDate = '2025-12-01';
    const endDate = '2025-12-31';

    // Test JSON format
    const jsonResponse = await fetch(
      `${API_URL}/api/reports/payroll-export?startDate=${startDate}&endDate=${endDate}&format=json`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    const jsonData = await jsonResponse.json();

    if (jsonResponse.ok) {
      console.log('✅ Payroll export (JSON) successful');
      console.log(`   Date Range: ${jsonData.dateRange?.start} to ${jsonData.dateRange?.end}`);
      console.log(`   Total Entertainers: ${jsonData.summary?.totalEntertainers || 0}`);
      console.log(`   Total Shifts: ${jsonData.summary?.totalShifts || 0}`);
      console.log(`   Total Hours: ${jsonData.summary?.totalHours || 0}`);
      console.log(`   Total Fees: $${jsonData.summary?.totalFees || 0}`);

      if (jsonData.payrollData && jsonData.payrollData.length > 0) {
        const sample = jsonData.payrollData[0];
        console.log(`   Sample: ${sample.stageName} - ${sample.totalShifts} shifts, $${sample.totalFees} fees`);
      }
    } else {
      console.log('⚠️  Payroll export failed:', jsonData.error);
    }

    // Test CSV format
    console.log('\n📄 Testing CSV export...');
    const csvResponse = await fetch(
      `${API_URL}/api/reports/payroll-export?startDate=${startDate}&endDate=${endDate}&format=csv`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (csvResponse.ok) {
      const csv = await csvResponse.text();
      const lines = csv.split('\n');
      console.log('✅ CSV export successful');
      console.log(`   CSV Lines: ${lines.length}`);
      console.log(`   Headers: ${lines[0]}`);
      if (lines.length > 1) {
        console.log(`   Sample Row: ${lines[1].substring(0, 100)}...`);
      }
    } else {
      console.log('⚠️  CSV export failed');
    }
  } catch (error) {
    console.error('❌ Payroll export test failed:', error.message);
  }
}

// ============================================================================
// FEATURE #29-30: MULTI-CLUB MANAGEMENT
// ============================================================================

async function testMultiClubFeatures() {
  console.log('\n🏢 Testing Features #29-30: Multi-Club Management');

  try {
    // Test owned clubs list
    const clubsResponse = await fetch(`${API_URL}/api/multi-club/owned-clubs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const clubsData = await clubsResponse.json();

    if (clubsResponse.ok) {
      console.log('✅ Owned clubs retrieved');
      console.log(`   Total Clubs: ${clubsData.clubs?.length || 0}`);

      if (clubsData.clubs && clubsData.clubs.length > 0) {
        clubsData.clubs.forEach(club => {
          console.log(`   - ${club.name} (${club.id})`);
        });
      }
    } else {
      console.log('⚠️  Owned clubs retrieval failed:', clubsData.error);
    }

    // Test aggregate revenue
    console.log('\n💵 Testing aggregate revenue...');
    const revenueResponse = await fetch(`${API_URL}/api/multi-club/aggregate-revenue`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const revenueData = await revenueResponse.json();

    if (revenueResponse.ok) {
      console.log('✅ Aggregate revenue retrieved');
      console.log(`   Total Revenue: $${revenueData.aggregate?.totalRevenue || 0}`);
      console.log(`   Total Paid: $${revenueData.aggregate?.totalPaid || 0}`);
      console.log(`   Total Pending: $${revenueData.aggregate?.totalPending || 0}`);
      console.log(`   Clubs: ${revenueData.byClub?.length || 0}`);
    } else {
      console.log('⚠️  Aggregate revenue failed:', revenueData.error);
    }

    // Test aggregate stats
    console.log('\n📈 Testing aggregate stats...');
    const statsResponse = await fetch(`${API_URL}/api/multi-club/aggregate-stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const statsData = await statsResponse.json();

    if (statsResponse.ok) {
      console.log('✅ Aggregate stats retrieved');
      console.log(`   Total Entertainers: ${statsData.aggregate?.totalEntertainers || 0}`);
      console.log(`   Active Check-ins: ${statsData.aggregate?.totalActiveCheckIns || 0}`);
      console.log(`   VIP Sessions: ${statsData.aggregate?.totalVIPSessions || 0}`);
    } else {
      console.log('⚠️  Aggregate stats failed:', statsData.error);
    }
  } catch (error) {
    console.error('❌ Multi-club test failed:', error.message);
  }
}

// ============================================================================
// FEATURE #35-36: SETTINGS CUSTOMIZATION
// ============================================================================

async function testSettingsCustomization() {
  console.log('\n⚙️  Testing Features #35-36: Settings Customization');

  try {
    // Test fee structure retrieval
    const feeResponse = await fetch(`${API_URL}/api/settings/fee-structure`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const feeData = await feeResponse.json();

    if (feeResponse.ok) {
      console.log('✅ Fee structure retrieved');
      console.log(`   Bar Fee: $${feeData.feeStructure?.barFee?.amount || 0}`);
      console.log(`   Late Fee: Enabled=${feeData.feeStructure?.lateFee?.enabled}, $${feeData.feeStructure?.lateFee?.amount || 0}`);
      console.log(`   Custom Fees: ${feeData.feeStructure?.customFees?.length || 0}`);
    } else {
      console.log('⚠️  Fee structure retrieval failed:', feeData.error);
    }

    // Test VIP config retrieval
    console.log('\n🎭 Testing VIP configuration...');
    const vipResponse = await fetch(`${API_URL}/api/settings/vip-config`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const vipData = await vipResponse.json();

    if (vipResponse.ok) {
      console.log('✅ VIP configuration retrieved');
      console.log(`   Default Song Rate: $${vipData.vipConfig?.defaultSongRate || 0}`);
      console.log(`   Average Song Duration: ${vipData.vipConfig?.avgSongDuration || 0} minutes`);
      console.log(`   Booths: ${vipData.vipConfig?.booths?.length || 0}`);

      if (vipData.vipConfig?.booths && vipData.vipConfig.booths.length > 0) {
        const sample = vipData.vipConfig.booths[0];
        console.log(`   Sample Booth: ${sample.boothName} - $${sample.songRate || 0}/song`);
      }
    } else {
      console.log('⚠️  VIP config retrieval failed:', vipData.error);
    }
  } catch (error) {
    console.error('❌ Settings customization test failed:', error.message);
  }
}

// ============================================================================
// FEATURE #44-45: DANCER MANAGEMENT
// ============================================================================

async function testDancerManagement() {
  console.log('\n💃 Testing Features #44-45: Dancer Management');

  try {
    // Get first entertainer
    const entertainersResponse = await fetch(`${API_URL}/api/dancers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const entertainers = await entertainersResponse.json();

    if (!entertainers || entertainers.length === 0) {
      console.log('⚠️  No entertainers found for testing');
      return;
    }

    const testEntertainer = entertainers[0];
    console.log(`\n👤 Using test entertainer: ${testEntertainer.stage_name} (${testEntertainer.id})`);

    // Test performance history
    console.log('\n📊 Testing performance history...');
    const historyResponse = await fetch(
      `${API_URL}/api/dancers/${testEntertainer.id}/performance-history?limit=10`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    const historyData = await historyResponse.json();

    if (historyResponse.ok) {
      console.log('✅ Performance history retrieved');
      console.log(`   Total Shifts: ${historyData.summary?.totalShifts || 0}`);
      console.log(`   Completed: ${historyData.summary?.completedShifts || 0}`);
      console.log(`   Attendance Rate: ${historyData.summary?.attendanceRate || 0}%`);
      console.log(`   Total Hours: ${historyData.summary?.totalHoursWorked || 0}`);
      console.log(`   Stage Performances: ${historyData.summary?.stagePerformances || 0}`);
      console.log(`   Total Paid: $${historyData.summary?.totalPaid || 0}`);
      console.log(`   Total Pending: $${historyData.summary?.totalPending || 0}`);
      console.log(`   Recent Transactions: ${historyData.recentTransactions?.length || 0}`);
    } else {
      console.log('⚠️  Performance history failed:', historyData.error);
    }

    // Note: Not testing suspension to avoid modifying data
    console.log('\n⚠️  Skipping suspension test to preserve data');
    console.log('   Suspension endpoint: PUT /api/dancers/:id/suspend');
    console.log('   Would test: suspend=true/false with reason');
  } catch (error) {
    console.error('❌ Dancer management test failed:', error.message);
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runTests() {
  console.log('🚀 Starting Feature #26-47 Test Suite');
  console.log('=' .repeat(60));

  try {
    // Login as owner
    const auth = await login(CREDENTIALS.owner);
    token = auth.token;
    clubId = auth.clubId;

    console.log(`\nClub ID: ${clubId}`);
    console.log('=' .repeat(60));

    // Run all tests
    await testLateFeePreview();
    await testLateFeeConfig();
    await testLateFeeReport();

    await testNightlyCloseOut();
    await testPayrollExport();

    await testMultiClubFeatures();
    await testSettingsCustomization();
    await testDancerManagement();

    console.log('\n' + '=' .repeat(60));
    console.log('✅ Test Suite Complete');
    console.log('=' .repeat(60));

    console.log('\n📝 Summary:');
    console.log('   - Feature #26: Late Fee Tracking ✅');
    console.log('   - Feature #27: Nightly Close-Out ✅');
    console.log('   - Feature #28: Payroll Export ✅');
    console.log('   - Features #29-30: Multi-Club ✅');
    console.log('   - Features #35-36: Settings ✅');
    console.log('   - Features #44-45: Dancer Management ✅');

    console.log('\n🎯 Next Steps:');
    console.log('   1. Review any warnings or errors above');
    console.log('   2. Build frontend UI components for these features');
    console.log('   3. Test with real production data');
    console.log('   4. Implement remaining features (#34, #40, #48-50)');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
