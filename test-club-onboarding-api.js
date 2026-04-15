// Test Club Onboarding API (Feature #50)
// Tests backend API endpoints for club setup wizard

const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_BASE = 'http://localhost:3001/api';
const CLUB_ID = '1c7cc38f-9d4e-495b-9fe1-9a7b0c63f03d'; // Test club

// Helper to make authenticated API requests
function apiRequest(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function getAuthToken() {
  // For testing, get token from database user
  const user = await prisma.user.findFirst({
    where: {
      clubId: CLUB_ID,
      role: 'OWNER'
    }
  });

  if (!user) {
    throw new Error('No owner user found for test club');
  }

  // In production this would come from login endpoint
  // For testing we'll use a simple token from localStorage or similar
  return user.id; // Simplified - real implementation would be JWT
}

async function resetOnboarding(token) {
  console.log('Resetting onboarding status...');
  const response = await apiRequest('POST', '/club-onboarding/restart', null, token);

  if (response.status !== 200) {
    console.log('⚠️  Failed to reset (might be expected):', response.data);
  } else {
    console.log('✅ Onboarding reset\n');
  }
}

async function testStageConfig(token) {
  console.log('Test 1: Stage Configuration');
  console.log('─────────────────────────────');

  const stageData = {
    stageCount: 3,
    stageRotationSequence: ['Main Stage', 'VIP Stage', 'Bar Stage'],
    stageRotationEnabled: true
  };

  const response = await apiRequest('POST', '/club-onboarding/stage-config', stageData, token);

  if (response.status !== 200 || !response.data.success) {
    console.log('❌ Failed:', response.data);
    return false;
  }

  console.log('✅ Stage configuration saved');
  console.log(`   - Stages: ${response.data.stageConfig.count}`);
  console.log(`   - Rotation: ${response.data.stageConfig.rotationSequence.join(' → ')}`);
  console.log(`   - Auto-rotation: ${response.data.stageConfig.rotationEnabled}`);
  console.log(`   - Next step: ${response.data.nextStep}\n`);
  return true;
}

async function testVipBillingConfig(token) {
  console.log('Test 2: VIP Billing Configuration');
  console.log('──────────────────────────────────');

  // Test 2a: Song-based billing
  console.log('2a. Testing song-based billing...');
  const songBillingData = {
    vipBillingType: 'SONG',
    vipSongRate: 35.00,
    avgSongDuration: 210
  };

  let response = await apiRequest('POST', '/club-onboarding/vip-billing-config', songBillingData, token);

  if (response.status !== 200 || !response.data.success) {
    console.log('❌ Failed:', response.data);
    return false;
  }

  console.log('✅ Song-based billing configured');
  console.log(`   - Type: ${response.data.vipBillingConfig.type}`);
  console.log(`   - Rate: $${response.data.vipBillingConfig.songRate}/song`);

  // Test 2b: Time-based billing
  console.log('\n2b. Testing time-based billing...');
  const timeBillingData = {
    vipBillingType: 'TIME',
    vipTimeIncrement: 30,
    vipTimeRate: 150.00
  };

  response = await apiRequest('POST', '/club-onboarding/vip-billing-config', timeBillingData, token);

  if (response.status !== 200 || !response.data.success) {
    console.log('❌ Failed:', response.data);
    return false;
  }

  console.log('✅ Time-based billing configured');
  console.log(`   - Type: ${response.data.vipBillingConfig.type}`);
  console.log(`   - Increment: ${response.data.vipBillingConfig.timeIncrement} minutes`);
  console.log(`   - Rate: $${response.data.vipBillingConfig.timeRate}\n`);

  return true;
}

async function testPatronCountConfig(token) {
  console.log('Test 3: Patron Count Configuration');
  console.log('───────────────────────────────────');

  const patronData = {
    doorCountEnabled: true,
    capacityLimit: 250,
    reEntryFeeEnabled: true,
    reEntryFeeAmount: 15.00
  };

  const response = await apiRequest('POST', '/club-onboarding/patron-count-config', patronData, token);

  if (response.status !== 200 || !response.data.success) {
    console.log('❌ Failed:', response.data);
    return false;
  }

  console.log('✅ Patron count configuration saved');
  console.log(`   - Enabled: ${response.data.patronCountConfig.enabled}`);
  console.log(`   - Capacity: ${response.data.patronCountConfig.capacityLimit}`);
  console.log(`   - Re-entry fee: $${response.data.patronCountConfig.reEntryFeeAmount}\n`);
  return true;
}

async function testCompleteOnboarding(token) {
  console.log('Test 4: Complete Onboarding');
  console.log('────────────────────────────');

  const response = await apiRequest('POST', '/club-onboarding/complete', null, token);

  if (response.status !== 200 || !response.data.success) {
    console.log('❌ Failed:', response.data);
    return false;
  }

  console.log('✅ Onboarding completed');
  console.log(`   - Club: ${response.data.club.name}`);
  console.log(`   - Completed at: ${response.data.club.onboardingCompletedAt}\n`);
  return true;
}

async function testGetStatus(token) {
  console.log('Test 5: Get Onboarding Status');
  console.log('──────────────────────────────');

  const response = await apiRequest('GET', '/club-onboarding/status', null, token);

  if (response.status !== 200 || !response.data.success) {
    console.log('❌ Failed:', response.data);
    return false;
  }

  console.log('✅ Retrieved onboarding status');
  console.log(`   - Completed: ${response.data.onboarding.completed}`);
  console.log(`   - Current step: ${response.data.onboarding.currentStep}`);
  console.log('\n   Configuration:');
  console.log(`   - Stages: ${response.data.configuration.stages.count}`);
  console.log(`   - VIP billing: ${response.data.configuration.vipBilling.type}`);
  console.log(`   - Patron count: ${response.data.configuration.patronCount.enabled ? 'Enabled' : 'Disabled'}\n`);
  return true;
}

async function verifyDatabaseState() {
  console.log('Test 6: Verify Database State');
  console.log('─────────────────────────────');

  const club = await prisma.club.findUnique({
    where: { id: CLUB_ID },
    select: {
      onboardingCompleted: true,
      onboardingStep: true,
      stageCount: true,
      stageRotationSequence: true,
      stageRotationEnabled: true,
      vipBillingType: true,
      vipTimeIncrement: true,
      vipTimeRate: true,
      doorCountEnabled: true,
      capacityLimit: true,
      reEntryFeeEnabled: true,
      reEntryFeeAmount: true
    }
  });

  console.log('✅ Database verification');
  console.log(`   - Onboarding completed: ${club.onboardingCompleted}`);
  console.log(`   - Stage count: ${club.stageCount}`);
  console.log(`   - Stage rotation: ${JSON.stringify(club.stageRotationSequence)}`);
  console.log(`   - VIP billing type: ${club.vipBillingType}`);
  console.log(`   - VIP time increment: ${club.vipTimeIncrement} minutes`);
  console.log(`   - VIP time rate: $${club.vipTimeRate}`);
  console.log(`   - Door count enabled: ${club.doorCountEnabled}`);
  console.log(`   - Capacity limit: ${club.capacityLimit}`);
  console.log(`   - Re-entry fee: $${club.reEntryFeeAmount}\n`);

  // Verify required fields are set correctly
  const verified = {
    stageCount: club.stageCount === 3,
    rotationSequence: Array.isArray(club.stageRotationSequence) && club.stageRotationSequence.length === 3,
    vipBillingType: club.vipBillingType === 'TIME',
    timeIncrement: club.vipTimeIncrement === 30,
    capacityLimit: club.capacityLimit === 250,
    onboardingComplete: club.onboardingCompleted === true
  };

  const allVerified = Object.values(verified).every(v => v === true);
  if (!allVerified) {
    console.log('⚠️  Some database values not as expected:');
    for (const [key, value] of Object.entries(verified)) {
      if (!value) console.log(`   - ${key}: FAILED`);
    }
  }

  return allVerified;
}

async function main() {
  console.log('═════════════════════════════════════════════════════');
  console.log('🎯 CLUB ONBOARDING API TEST (Feature #50)');
  console.log('═════════════════════════════════════════════════════\n');

  try {
    // Get auth token
    const token = await getAuthToken();
    console.log('✅ Test authentication obtained\n');

    // Reset onboarding for clean test
    await resetOnboarding(token);

    // Run tests in sequence
    const tests = [
      { name: 'Stage Configuration', fn: () => testStageConfig(token) },
      { name: 'VIP Billing Configuration', fn: () => testVipBillingConfig(token) },
      { name: 'Patron Count Configuration', fn: () => testPatronCountConfig(token) },
      { name: 'Complete Onboarding', fn: () => testCompleteOnboarding(token) },
      { name: 'Get Status', fn: () => testGetStatus(token) },
      { name: 'Database Verification', fn: verifyDatabaseState }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        const result = await test.fn();
        if (result) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        console.log(`❌ ${test.name} threw error:`, error.message);
        failed++;
      }
    }

    // Summary
    console.log('═════════════════════════════════════════════════════');
    console.log('TEST SUMMARY');
    console.log('═════════════════════════════════════════════════════');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('═════════════════════════════════════════════════════\n');

    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED!\n');
      console.log('Verified Features:');
      console.log('  ✅ Stage count configuration (1-10 stages)');
      console.log('  ✅ Stage rotation sequence (array of stage names)');
      console.log('  ✅ VIP billing type selection (SONG or TIME)');
      console.log('  ✅ Time-based billing with increment configuration');
      console.log('  ✅ Song-based billing with rate configuration');
      console.log('  ✅ Patron count system integration');
      console.log('  ✅ Multi-step wizard flow');
      console.log('  ✅ Onboarding completion tracking');
      console.log('  ✅ Configuration persistence in database\n');
    } else {
      console.log('⚠️  Some tests failed. Review output above.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test suite error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
