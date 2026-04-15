// Simple webhook test - just check if route is working
const crypto = require('crypto');
const http = require('http');

const WEBHOOK_SECRET = 'eceab0d5ef50d2c342be55eb45b9cb86ecacd1f205caeeb43d98787f056d33a7';
const CLUB_ID = '1c7cc38f-9d4e-495b-9fe1-9a7b0c63f03d';

const payload = {
  clubId: CLUB_ID,
  deviceId: 'test-camera-1',
  eventType: 'ENTRY',
  count: 1,
  metadata: { test: true }
};

const payloadStr = JSON.stringify(payload);
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(payloadStr)
  .digest('hex');

console.log('🧪 Testing Patron Count Webhook\n');
console.log('Payload:', payloadStr);
console.log('Signature:', signature);
console.log('\nSending request to http://localhost:3001/api/patron-count/webhook\n');

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
  console.log(`Status Code: ${res.statusCode}`);
  console.log('Headers:', res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\nResponse:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));

      if (res.statusCode === 200) {
        console.log('\n✅ Webhook test PASSED!');
      } else {
        console.log('\n❌ Webhook test FAILED');
      }
    } catch (err) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(payloadStr);
req.end();
