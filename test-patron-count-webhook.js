// Test Patron Count Webhook with HMAC Authentication
// Simulates hardware device sending entry/exit events

const crypto = require('crypto');
const fs = require('fs');

const BACKEND_URL = 'http://localhost:3001';
const CLUB_ID = '1c7cc38f-9d4e-495b-9fe1-9a7b0c63f03d';

// Read webhook secret
const WEBHOOK_SECRET = fs.readFileSync('.webhook-secret', 'utf8').trim();

function signPayload(payload) {
  return crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
}

async function testWebhook() {
  console.log('🚪 Testing Patron Count Webhook\\n');
  console.log('═══════════════════════════════════════════════════════\\n');

  // Test 1: Single entry (facial recognition camera)
  console.log('Test 1: Single Entry Event (Facial Recognition)');
  console.log('------------------------------------------------');
  const entryPayload = {
    clubId: CLUB_ID,
    deviceId: 'camera-entrance-1',
    eventType: 'ENTRY',
    count: 1,
    confidence: 0.97,
    metadata: {
      faceId: 'unique-hash-abc123',
      isReEntry: false,
      gender: 'female',
      ageEstimate: 26
    }
  };

  const entrySignature = signPayload(entryPayload);

  try {
    const response1 = await fetch(`${BACKEND_URL}/api/patron-count/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ClubFlow-Signature': entrySignature
      },
      body: JSON.stringify(entryPayload)
    });

    const data1 = await response1.json();

    if (response1.ok) {
      console.log('✅ Entry processed successfully');
      console.log(`   Previous: ${data1.previousCount} → New: ${data1.newCount} (${data1.delta > 0 ? '+' : ''}${data1.delta})`);
    } else {
      console.log(`❌ Entry failed: ${response1.status} - ${data1.error}`);
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }

  console.log('\\n');

  // Test 2: Batch entry/exit (infrared sensor)
  console.log('Test 2: Batch Update (Infrared Sensor)');
  console.log('---------------------------------------');
  const batchPayload = {
    clubId: CLUB_ID,
    deviceId: 'sensor-main-door',
    entries: 5,
    exits: 2,
    metadata: {
      sensorType: 'IR_STEREO',
      direction: 'BIDIRECTIONAL'
    }
  };

  const batchSignature = signPayload(batchPayload);

  try {
    const response2 = await fetch(`${BACKEND_URL}/api/patron-count/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ClubFlow-Signature': batchSignature
      },
      body: JSON.stringify(batchPayload)
    });

    const data2 = await response2.json();

    if (response2.ok) {
      console.log('✅ Batch update processed successfully');
      console.log(`   Previous: ${data2.previousCount} → New: ${data2.newCount} (${data2.delta > 0 ? '+' : ''}${data2.delta})`);
      console.log(`   (5 entries - 2 exits = net +3)`);
    } else {
      console.log(`❌ Batch update failed: ${response2.status} - ${data2.error}`);
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }

  console.log('\\n');

  // Test 3: Get current count
  console.log('Test 3: Get Current Count');
  console.log('-------------------------');

  try {
    const response3 = await fetch(`${BACKEND_URL}/api/patron-count/current/${CLUB_ID}`);
    const data3 = await response3.json();

    if (response3.ok) {
      console.log('✅ Current count retrieved');
      console.log(`   Current Patrons: ${data3.currentCount}`);
      console.log(`   Capacity: ${data3.capacityLimit}`);
      console.log(`   Percent Full: ${data3.percentFull ? data3.percentFull.toFixed(1) + '%' : 'N/A'}`);
      console.log(`   Trend: ${data3.trend}`);
    } else {
      console.log(`❌ Get current failed: ${response3.status} - ${data3.error}`);
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }

  console.log('\\n');

  // Test 4: Invalid signature (security test)
  console.log('Test 4: Invalid Signature (Security Test)');
  console.log('------------------------------------------');

  const invalidPayload = {
    clubId: CLUB_ID,
    deviceId: 'malicious-device',
    eventType: 'ENTRY',
    count: 100 // Trying to add 100 patrons at once
  };

  const invalidSignature = 'this-is-not-a-valid-signature';

  try {
    const response4 = await fetch(`${BACKEND_URL}/api/patron-count/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ClubFlow-Signature': invalidSignature
      },
      body: JSON.stringify(invalidPayload)
    });

    const data4 = await response4.json();

    if (!response4.ok && response4.status === 401) {
      console.log('✅ Invalid signature correctly rejected');
      console.log(`   Error: ${data4.error}`);
    } else {
      console.log(`❌ Security flaw: Invalid signature was accepted!`);
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }

  console.log('\\n═══════════════════════════════════════════════════════');
  console.log('✅ WEBHOOK TESTS COMPLETE');
  console.log('═══════════════════════════════════════════════════════\\n');
}

testWebhook();
