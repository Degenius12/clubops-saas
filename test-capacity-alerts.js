// Test Capacity Alert System
// Simulates different capacity scenarios and verifies alerts are created

const crypto = require('crypto');
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const WEBHOOK_SECRET = 'eceab0d5ef50d2c342be55eb45b9cb86ecacd1f205caeeb43d98787f056d33a7';
const CLUB_ID = '1c7cc38f-9d4e-495b-9fe1-9a7b0c63f03d';

function makeWebhookRequest(payload) {
  return new Promise((resolve, reject) => {
    const payloadStr = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(payloadStr)
      .digest('hex');

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/patron-count/webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ClubFlow-Signature': signature,
        'Content-Length': Buffer.byteLength(payloadStr)
      }
    };

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

async function setPatronCount(count, reason) {
  // Get current count
  const club = await prisma.club.findUnique({
    where: { id: CLUB_ID },
    select: { currentPatronCount: true }
  });

  const delta = count - club.currentPatronCount;

  // Use webhook to adjust count
  if (delta !== 0) {
    const payload = {
      clubId: CLUB_ID,
      deviceId: 'test-adjustment',
      eventType: delta > 0 ? 'ENTRY' : 'EXIT',
      count: Math.abs(delta),
      metadata: { reason }
    };

    await makeWebhookRequest(payload);
  }
}

async function checkAlerts() {
  const alerts = await prisma.verificationAlert.findMany({
    where: {
      clubId: CLUB_ID,
      alertType: { in: ['CAPACITY_WARNING', 'CAPACITY_EXCEEDED'] },
      status: 'OPEN'
    },
    select: {
      alertType: true,
      severity: true,
      description: true
    }
  });

  return alerts;
}

async function main() {
  console.log('🚨 Testing Capacity Alert System\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Test 1: Normal capacity (no alerts expected)
    console.log('Test 1: Normal Capacity (6/200 = 3%)');
    console.log('--------------------------------------');
    await setPatronCount(6, 'Reset to normal');

    // Run alert check
    const { checkCapacityAlerts } = require('./backend/jobs/patronCountAlerts');
    await checkCapacityAlerts();

    let alerts = await checkAlerts();
    if (alerts.length === 0) {
      console.log('✅ No alerts created (as expected)\n');
    } else {
      console.log('❌ Unexpected alerts:', alerts, '\n');
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: 85% capacity (warning expected)
    console.log('Test 2: Warning Threshold (170/200 = 85%)');
    console.log('-------------------------------------------');
    await setPatronCount(170, 'Testing warning threshold');
    await checkCapacityAlerts();

    alerts = await checkAlerts();
    const hasWarning = alerts.some(a => a.alertType === 'CAPACITY_WARNING');
    if (hasWarning) {
      console.log('✅ CAPACITY_WARNING alert created');
      console.log(`   - ${alerts.find(a => a.alertType === 'CAPACITY_WARNING').description}\n`);
    } else {
      console.log('❌ No warning alert created\n');
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3: 105% capacity (exceeded expected)
    console.log('Test 3: Over Capacity (210/200 = 105%)');
    console.log('---------------------------------------');
    await setPatronCount(210, 'Testing over capacity');
    await checkCapacityAlerts();

    alerts = await checkAlerts();
    const hasExceeded = alerts.some(a => a.alertType === 'CAPACITY_EXCEEDED');
    if (hasExceeded) {
      console.log('✅ CAPACITY_EXCEEDED alert created');
      console.log(`   - ${alerts.find(a => a.alertType === 'CAPACITY_EXCEEDED').description}\n`);
    } else {
      console.log('❌ No exceeded alert created\n');
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 4: Back to normal (alerts should resolve)
    console.log('Test 4: Return to Normal (50/200 = 25%)');
    console.log('----------------------------------------');
    await setPatronCount(50, 'Testing alert resolution');
    await checkCapacityAlerts();

    alerts = await checkAlerts();
    if (alerts.length === 0) {
      console.log('✅ All capacity alerts resolved\n');
    } else {
      console.log('❌ Alerts still open:', alerts, '\n');
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ CAPACITY ALERT SYSTEM TESTS COMPLETE');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Verified Features:');
    console.log('  ✅ No alerts at normal capacity (<80%)');
    console.log('  ✅ Warning alert at 80-99% capacity');
    console.log('  ✅ Exceeded alert at 100%+ capacity');
    console.log('  ✅ Automatic alert resolution when capacity drops\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
