// Complete Patron Count System Test
// Tests all webhook scenarios without requiring JWT tokens

const crypto = require('crypto');
const http = require('http');

const WEBHOOK_SECRET = 'eceab0d5ef50d2c342be55eb45b9cb86ecacd1f205caeeb43d98787f056d33a7';
const CLUB_ID = '1c7cc38f-9d4e-495b-9fe1-9a7b0c63f03d';
const BASE_URL = 'localhost:3001';

function makeRequest(path, method, payload, signature) {
  return new Promise((resolve, reject) => {
    const payloadStr = JSON.stringify(payload);

    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadStr)
      }
    };

    if (signature) {
      options.headers['X-ClubFlow-Signature'] = signature;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.write(payloadStr);
    req.end();
  });
}

function signPayload(payload) {
  return crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
}

async function main() {
  console.log('🚪 Complete Patron Count System Test\n');
  console.log('═══════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  try {
    // Test 1: Single Entry (Facial Recognition Camera)
    console.log('Test 1: Single Entry Event (Facial Recognition)');
    console.log('------------------------------------------------');
    const entryPayload = {
      clubId: CLUB_ID,
      deviceId: 'camera-entrance-1',
      eventType: 'ENTRY',
      count: 1,
      metadata: {
        faceId: 'unique-hash-abc123',
        isReEntry: false,
        gender: 'female',
        ageEstimate: 26
      }
    };

    const entryResult = await makeRequest(
      '/api/patron-count/webhook',
      'POST',
      entryPayload,
      signPayload(entryPayload)
    );

    if (entryResult.status === 200 && entryResult.data.success) {
      console.log('   ✅ Entry event accepted');
      console.log(`   - Previous count: ${entryResult.data.previousCount}`);
      console.log(`   - New count: ${entryResult.data.newCount}`);
      console.log(`   - Delta: +${entryResult.data.delta}\n`);
      passed++;
    } else {
      console.log('   ❌ Entry event failed:', entryResult.status, entryResult.data);
      failed++;
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 2: Batch Update (Infrared Sensor)
    console.log('Test 2: Batch Update (Infrared Sensor)');
    console.log('---------------------------------------');
    const batchPayload = {
      clubId: CLUB_ID,
      deviceId: 'sensor-main-door',
      entries: 5,
      exits: 2,
      metadata: {
        sensorType: 'IR_STEREO',
        interval: '30_SECONDS'
      }
    };

    const batchResult = await makeRequest(
      '/api/patron-count/webhook',
      'POST',
      batchPayload,
      signPayload(batchPayload)
    );

    if (batchResult.status === 200 && batchResult.data.success) {
      console.log('   ✅ Batch update accepted');
      console.log(`   - Entries: 5, Exits: 2`);
      console.log(`   - Previous count: ${batchResult.data.previousCount}`);
      console.log(`   - New count: ${batchResult.data.newCount}`);
      console.log(`   - Delta: +${batchResult.data.delta}\n`);
      passed++;
    } else {
      console.log('   ❌ Batch update failed:', batchResult.status, batchResult.data);
      failed++;
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 3: Exit Event
    console.log('Test 3: Exit Event (Patron Leaving)');
    console.log('------------------------------------');
    const exitPayload = {
      clubId: CLUB_ID,
      deviceId: 'camera-exit-1',
      eventType: 'EXIT',
      count: 1,
      metadata: {
        direction: 'OUT'
      }
    };

    const exitResult = await makeRequest(
      '/api/patron-count/webhook',
      'POST',
      exitPayload,
      signPayload(exitPayload)
    );

    if (exitResult.status === 200 && exitResult.data.success) {
      console.log('   ✅ Exit event accepted');
      console.log(`   - Previous count: ${exitResult.data.previousCount}`);
      console.log(`   - New count: ${exitResult.data.newCount}`);
      console.log(`   - Delta: ${exitResult.data.delta}\n`);
      passed++;
    } else {
      console.log('   ❌ Exit event failed:', exitResult.status, exitResult.data);
      failed++;
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 4: Multi-Zone Entry
    console.log('Test 4: Multi-Zone Entry (VIP Section)');
    console.log('---------------------------------------');
    const zonePayload = {
      clubId: CLUB_ID,
      deviceId: 'camera-vip-entrance',
      eventType: 'ENTRY',
      count: 2,
      zone: 'VIP_SECTION',
      metadata: {
        timestamp: new Date().toISOString()
      }
    };

    const zoneResult = await makeRequest(
      '/api/patron-count/webhook',
      'POST',
      zonePayload,
      signPayload(zonePayload)
    );

    if (zoneResult.status === 200 && zoneResult.data.success) {
      console.log('   ✅ Multi-zone entry accepted');
      console.log(`   - Zone: VIP_SECTION`);
      console.log(`   - Previous count: ${zoneResult.data.previousCount}`);
      console.log(`   - New count: ${zoneResult.data.newCount}`);
      console.log(`   - Delta: +${zoneResult.data.delta}\n`);
      passed++;
    } else {
      console.log('   ❌ Multi-zone entry failed:', zoneResult.status, zoneResult.data);
      failed++;
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 5: Invalid Signature (Security Test)
    console.log('Test 5: Invalid Signature (Security Test)');
    console.log('------------------------------------------');
    const invalidPayload = {
      clubId: CLUB_ID,
      deviceId: 'malicious-device',
      eventType: 'ENTRY',
      count: 100
    };

    const invalidResult = await makeRequest(
      '/api/patron-count/webhook',
      'POST',
      invalidPayload,
      'invalid-signature-12345'
    );

    if (invalidResult.status === 401) {
      console.log('   ✅ Invalid signature correctly rejected');
      console.log(`   - Status: 401 Unauthorized`);
      console.log(`   - Message: ${invalidResult.data.error}\n`);
      passed++;
    } else {
      console.log('   ❌ Security test failed - invalid signature accepted!');
      failed++;
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 6: Missing Signature
    console.log('Test 6: Missing Signature Header');
    console.log('---------------------------------');
    const missingResult = await makeRequest(
      '/api/patron-count/webhook',
      'POST',
      entryPayload,
      null // No signature
    );

    if (missingResult.status === 400 || missingResult.status === 401) {
      console.log('   ✅ Missing signature correctly rejected');
      console.log(`   - Status: ${missingResult.status}`);
      console.log(`   - Message: ${missingResult.data.error}\n`);
      passed++;
    } else {
      console.log('   ❌ Security test failed - missing signature accepted!');
      failed++;
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log(`TEST RESULTS: ${passed}/${passed + failed} PASSED`);
    console.log('═══════════════════════════════════════════════════════\n');

    if (failed === 0) {
      console.log('✅ ALL TESTS PASSED!\n');
      console.log('Webhook Features Verified:');
      console.log('  ✅ Single entry events (facial recognition)');
      console.log('  ✅ Batch updates (infrared sensors)');
      console.log('  ✅ Exit tracking');
      console.log('  ✅ Multi-zone tracking');
      console.log('  ✅ HMAC signature validation');
      console.log('  ✅ Security (invalid/missing signatures rejected)\n');

      console.log('🎯 Patron Count System Ready for Production!\n');
    } else {
      console.log(`❌ ${failed} TESTS FAILED\n`);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

main();
