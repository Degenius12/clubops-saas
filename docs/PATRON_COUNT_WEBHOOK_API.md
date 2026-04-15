# ClubFlow Patron Count Webhook API Documentation

**Version**: 1.0
**Feature**: #49 - Door Count Integration
**Last Updated**: December 29, 2025

---

## Overview

The ClubFlow Patron Count Webhook API allows hardware devices (facial recognition cameras, infrared sensors, mobile check-in systems) to send real-time patron entry and exit events to ClubFlow. This enables automated capacity monitoring, compliance tracking, and real-time analytics.

### Key Features

- **HMAC-SHA256 Authentication** - Secure webhook signatures prevent unauthorized updates
- **Real-time Updates** - WebSocket broadcast to all connected clients
- **Capacity Alerts** - Automatic warnings at 80% and alerts at 100% capacity
- **Multi-Zone Support** - Track different areas within the venue
- **Audit Trail** - Complete logging of all count changes with source tracking
- **Flexible Hardware Support** - Works with any device that can make HTTPS requests

---

## Quick Start

### 1. Obtain Webhook Credentials

Contact ClubFlow support or use the Club Settings API to configure:
- `doorCountEnabled`: Set to `true`
- `capacityLimit`: Maximum allowed patrons (e.g., `200`)
- `doorCountWebhookSecret`: Your unique signing key (generated automatically)

### 2. Test Connectivity

```bash
curl https://api.clubflowapp.com/api/patron-count/webhook \
  -H "Content-Type: application/json" \
  -H "X-ClubFlow-Signature: test" \
  -d '{"test": true}'
```

Expected Response: `401 Unauthorized` (proves endpoint is reachable)

### 3. Send Your First Event

See [Usage Examples](#usage-examples) below for code samples.

---

## Authentication

### HMAC-SHA256 Signature

All webhook requests **must** include an `X-ClubFlow-Signature` header containing an HMAC-SHA256 signature of the request body.

**Algorithm**:
```
signature = HMAC_SHA256(webhook_secret, JSON.stringify(request_body))
```

**Example** (Node.js):
```javascript
const crypto = require('crypto');

const payload = {
  clubId: "uuid-here",
  deviceId: "camera-1",
  eventType: "ENTRY",
  count: 1
};

const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');

// Include as header: X-ClubFlow-Signature: <signature>
```

**Example** (Python):
```python
import hmac
import hashlib
import json

payload = {
    "clubId": "uuid-here",
    "deviceId": "camera-1",
    "eventType": "ENTRY",
    "count": 1
}

signature = hmac.new(
    WEBHOOK_SECRET.encode('utf-8'),
    json.dumps(payload).encode('utf-8'),
    hashlib.sha256
).hexdigest()

# Include as header: X-ClubFlow-Signature: <signature>
```

---

## Endpoint Reference

### POST /api/patron-count/webhook

Send patron entry/exit events to ClubFlow.

**URL**: `https://api.clubflowapp.com/api/patron-count/webhook`

**Method**: `POST`

**Headers**:
```
Content-Type: application/json
X-ClubFlow-Signature: <hmac_sha256_signature>
```

---

## Request Formats

### Single Entry Event (Facial Recognition)

Best for: Facial recognition cameras tracking unique individuals

```json
{
  "clubId": "1c7cc38f-9d4e-495b-9fe1-9a7b0c63f03d",
  "deviceId": "camera-entrance-1",
  "eventType": "ENTRY",
  "count": 1,
  "metadata": {
    "faceId": "unique-hash-abc123",
    "isReEntry": false,
    "gender": "female",
    "ageEstimate": 26,
    "confidence": 0.97
  }
}
```

**Fields**:
- `clubId` (required, string): Your ClubFlow club UUID
- `deviceId` (required, string): Unique identifier for your hardware device
- `eventType` (required, string): `"ENTRY"` or `"EXIT"`
- `count` (required, number): Number of patrons (usually `1` for facial recognition)
- `metadata` (optional, object): Device-specific data (see below)

**Metadata Fields** (all optional):
- `faceId`: Unique hash for re-entry detection
- `isReEntry`: Boolean indicating if patron was seen before today
- `gender`: Estimated gender for demographics
- `ageEstimate`: Estimated age for demographics
- `confidence`: Recognition confidence (0.0 - 1.0)

---

### Batch Update (Infrared/Laser Sensors)

Best for: Directional sensors counting bulk movement

```json
{
  "clubId": "1c7cc38f-9d4e-495b-9fe1-9a7b0c63f03d",
  "deviceId": "sensor-main-door",
  "entries": 5,
  "exits": 2,
  "metadata": {
    "sensorType": "IR_STEREO",
    "interval": "30_SECONDS",
    "accuracy": 0.89
  }
}
```

**Fields**:
- `clubId` (required, string): Your ClubFlow club UUID
- `deviceId` (required, string): Unique identifier for your hardware device
- `entries` (optional, number): Number of entries detected (default: 0)
- `exits` (optional, number): Number of exits detected (default: 0)
- `metadata` (optional, object): Sensor-specific data

**Metadata Fields** (all optional):
- `sensorType`: Type of sensor (e.g., `"IR_STEREO"`, `"LASER"`, `"ULTRASONIC"`)
- `interval`: Reporting interval (e.g., `"30_SECONDS"`, `"1_MINUTE"`)
- `accuracy`: Reported accuracy (0.0 - 1.0)

---

### Multi-Zone Event

Best for: Venues tracking different areas (VIP section, main floor, outdoor patio)

```json
{
  "clubId": "1c7cc38f-9d4e-495b-9fe1-9a7b0c63f03d",
  "deviceId": "camera-vip-entrance",
  "eventType": "ENTRY",
  "count": 2,
  "zone": "VIP_SECTION",
  "metadata": {
    "timestamp": "2025-12-29T08:00:00.000Z"
  }
}
```

**Fields**:
- `clubId` (required, string): Your ClubFlow club UUID
- `deviceId` (required, string): Unique identifier for your hardware device
- `eventType` (required, string): `"ENTRY"` or `"EXIT"`
- `count` (required, number): Number of patrons
- `zone` (required, string): Zone identifier (e.g., `"VIP_SECTION"`, `"MAIN_FLOOR"`, `"OUTDOOR_PATIO"`)
- `metadata` (optional, object): Additional data

---

### Mobile Check-In

Best for: Software-only solutions using QR codes or mobile apps

```json
{
  "clubId": "1c7cc38f-9d4e-495b-9fe1-9a7b0c63f03d",
  "deviceId": "mobile-app-v1",
  "eventType": "ENTRY",
  "count": 1,
  "metadata": {
    "userId": "patron-uuid-here",
    "checkInMethod": "QR_CODE",
    "appVersion": "1.2.3"
  }
}
```

---

## Response Format

### Success Response

**HTTP Status**: `200 OK`

```json
{
  "success": true,
  "previousCount": 45,
  "newCount": 46,
  "delta": 1,
  "timestamp": "2025-12-29T08:15:30.123Z",
  "capacityWarning": false
}
```

**Fields**:
- `success`: Always `true` on success
- `previousCount`: Patron count before this update
- `newCount`: Patron count after this update
- `delta`: Change in count (positive for entries, negative for exits)
- `timestamp`: Server timestamp of the update
- `capacityWarning`: Boolean indicating if club is at/over capacity

---

### Error Responses

#### Invalid Signature

**HTTP Status**: `401 Unauthorized`

```json
{
  "error": "Invalid webhook signature"
}
```

**Fix**: Verify your `WEBHOOK_SECRET` and signature calculation.

---

#### Missing clubId

**HTTP Status**: `400 Bad Request`

```json
{
  "error": "Missing clubId in request body"
}
```

**Fix**: Ensure `clubId` field is included in your JSON payload.

---

#### Invalid Event Type

**HTTP Status**: `400 Bad Request`

```json
{
  "error": "Invalid eventType. Must be 'ENTRY' or 'EXIT'"
}
```

**Fix**: Use `"ENTRY"` or `"EXIT"` for the `eventType` field.

---

#### Internal Server Error

**HTTP Status**: `500 Internal Server Error`

```json
{
  "error": "Internal server error"
}
```

**Fix**: Check server logs or contact ClubFlow support if persists.

---

## Usage Examples

### Node.js (Full Implementation)

```javascript
const crypto = require('crypto');
const https = require('https');

class ClubFlowPatronCounter {
  constructor(clubId, webhookSecret, deviceId) {
    this.clubId = clubId;
    this.webhookSecret = webhookSecret;
    this.deviceId = deviceId;
    this.apiUrl = 'api.clubflowapp.com';
  }

  signPayload(payload) {
    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  sendEvent(eventType, count = 1, metadata = {}) {
    return new Promise((resolve, reject) => {
      const payload = {
        clubId: this.clubId,
        deviceId: this.deviceId,
        eventType,
        count,
        metadata: {
          timestamp: new Date().toISOString(),
          ...metadata
        }
      };

      const payloadStr = JSON.stringify(payload);
      const signature = this.signPayload(payload);

      const options = {
        hostname: this.apiUrl,
        port: 443,
        path: '/api/patron-count/webhook',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payloadStr),
          'X-ClubFlow-Signature': signature
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(payloadStr);
      req.end();
    });
  }

  async recordEntry(count = 1, metadata = {}) {
    return this.sendEvent('ENTRY', count, metadata);
  }

  async recordExit(count = 1, metadata = {}) {
    return this.sendEvent('EXIT', count, metadata);
  }

  async recordBatch(entries, exits, metadata = {}) {
    const payload = {
      clubId: this.clubId,
      deviceId: this.deviceId,
      entries,
      exits,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };

    const payloadStr = JSON.stringify(payload);
    const signature = this.signPayload(payload);

    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.apiUrl,
        port: 443,
        path: '/api/patron-count/webhook',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payloadStr),
          'X-ClubFlow-Signature': signature
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(payloadStr);
      req.end();
    });
  }
}

// Usage
const counter = new ClubFlowPatronCounter(
  '1c7cc38f-9d4e-495b-9fe1-9a7b0c63f03d',
  'your-webhook-secret-here',
  'camera-entrance-1'
);

// Record single entry
counter.recordEntry(1, { faceId: 'hash123', confidence: 0.95 })
  .then(response => console.log('Entry recorded:', response))
  .catch(error => console.error('Error:', error));

// Record batch update every 30 seconds
setInterval(async () => {
  const entries = getEntriesFromSensor(); // Your sensor code
  const exits = getExitsFromSensor();

  if (entries > 0 || exits > 0) {
    try {
      const response = await counter.recordBatch(entries, exits, {
        sensorType: 'IR_STEREO',
        interval: '30_SECONDS'
      });
      console.log('Batch update:', response);
    } catch (error) {
      console.error('Batch update failed:', error);
    }
  }
}, 30000);
```

---

### Python (Requests Library)

```python
import hmac
import hashlib
import json
import requests
from datetime import datetime

class ClubFlowPatronCounter:
    def __init__(self, club_id, webhook_secret, device_id):
        self.club_id = club_id
        self.webhook_secret = webhook_secret
        self.device_id = device_id
        self.api_url = 'https://api.clubflowapp.com'

    def sign_payload(self, payload):
        payload_str = json.dumps(payload)
        signature = hmac.new(
            self.webhook_secret.encode('utf-8'),
            payload_str.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return signature

    def send_event(self, event_type, count=1, metadata=None):
        if metadata is None:
            metadata = {}

        payload = {
            'clubId': self.club_id,
            'deviceId': self.device_id,
            'eventType': event_type,
            'count': count,
            'metadata': {
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                **metadata
            }
        }

        signature = self.sign_payload(payload)

        headers = {
            'Content-Type': 'application/json',
            'X-ClubFlow-Signature': signature
        }

        response = requests.post(
            f'{self.api_url}/api/patron-count/webhook',
            json=payload,
            headers=headers,
            timeout=10
        )

        response.raise_for_status()
        return response.json()

    def record_entry(self, count=1, metadata=None):
        return self.send_event('ENTRY', count, metadata)

    def record_exit(self, count=1, metadata=None):
        return self.send_event('EXIT', count, metadata)

    def record_batch(self, entries, exits, metadata=None):
        if metadata is None:
            metadata = {}

        payload = {
            'clubId': self.club_id,
            'deviceId': self.device_id,
            'entries': entries,
            'exits': exits,
            'metadata': {
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                **metadata
            }
        }

        signature = self.sign_payload(payload)

        headers = {
            'Content-Type': 'application/json',
            'X-ClubFlow-Signature': signature
        }

        response = requests.post(
            f'{self.api_url}/api/patron-count/webhook',
            json=payload,
            headers=headers,
            timeout=10
        )

        response.raise_for_status()
        return response.json()

# Usage
counter = ClubFlowPatronCounter(
    club_id='1c7cc38f-9d4e-495b-9fe1-9a7b0c63f03d',
    webhook_secret='your-webhook-secret-here',
    device_id='camera-entrance-1'
)

# Record entry
response = counter.record_entry(1, {
    'faceId': 'hash123',
    'confidence': 0.95
})
print('Entry recorded:', response)

# Record batch (runs every 30 seconds)
import time
while True:
    entries = get_entries_from_sensor()  # Your sensor code
    exits = get_exits_from_sensor()

    if entries > 0 or exits > 0:
        response = counter.record_batch(entries, exits, {
            'sensorType': 'IR_STEREO',
            'interval': '30_SECONDS'
        })
        print('Batch update:', response)

    time.sleep(30)
```

---

## Testing & Development

### Test Mode

For development/testing, ClubFlow provides a sandbox environment:

**Test API URL**: `https://api-staging.clubflowapp.com`

**Test Club ID**: Contact support for a test club

---

### Webhook Testing Tools

#### 1. cURL

```bash
WEBHOOK_SECRET="your-secret-here"
CLUB_ID="your-club-id"

PAYLOAD='{"clubId":"'$CLUB_ID'","deviceId":"test-device","eventType":"ENTRY","count":1}'

SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | sed 's/^.* //')

curl -X POST https://api.clubflowapp.com/api/patron-count/webhook \
  -H "Content-Type: application/json" \
  -H "X-ClubFlow-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

#### 2. Postman

1. Create new POST request to `{{API_URL}}/api/patron-count/webhook`
2. Set header: `Content-Type: application/json`
3. In **Pre-request Script**, add:

```javascript
const payload = pm.request.body.raw;
const secret = pm.environment.get('WEBHOOK_SECRET');
const signature = CryptoJS.HmacSHA256(payload, secret).toString();
pm.request.headers.add({
    key: 'X-ClubFlow-Signature',
    value: signature
});
```

4. Set environment variables: `API_URL`, `WEBHOOK_SECRET`, `CLUB_ID`

---

## Best Practices

### 1. Retry Logic

Implement exponential backoff for failed requests:

```javascript
async function sendWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### 2. Batch Updates

For high-traffic venues, batch updates every 30-60 seconds instead of sending individual events:

```javascript
let entriesBuffer = 0;
let exitsBuffer = 0;

// Accumulate counts
onPersonDetected((direction) => {
  if (direction === 'IN') entriesBuffer++;
  if (direction === 'OUT') exitsBuffer++;
});

// Flush every 30 seconds
setInterval(async () => {
  if (entriesBuffer > 0 || exitsBuffer > 0) {
    await counter.recordBatch(entriesBuffer, exitsBuffer);
    entriesBuffer = 0;
    exitsBuffer = 0;
  }
}, 30000);
```

### 3. Error Handling

Always handle network errors gracefully:

```javascript
try {
  await counter.recordEntry(1, metadata);
} catch (error) {
  console.error('Failed to record entry:', error.message);
  // Log to file/queue for later retry
  logFailedEvent('ENTRY', 1, metadata);
}
```

### 4. Secret Rotation

Rotate your webhook secret periodically (recommended: every 90 days):

1. Generate new secret in ClubFlow settings
2. Update your hardware devices with new secret
3. Old secret remains valid for 24 hours during transition

---

## Hardware Recommendations

### Budget: ~$800 (User Requirement)

#### Option 1: Infrared Stereo Sensors (85-90% accuracy)
- **Product**: Xovis PC2S People Counter
- **Price**: ~$500-700
- **Pros**: Easy installation, good accuracy, works in all lighting
- **Cons**: Cannot detect re-entries (counts all movement)
- **Best For**: Entry-only tracking, capacity compliance

#### Option 2: Facial Recognition Camera (95%+ accuracy)
- **Product**: Hikvision DS-2CD6825G0 + DeepinMind NVR
- **Price**: ~$800-1500
- **Pros**: Can detect re-entries, demographic data, very accurate
- **Cons**: More expensive, privacy considerations
- **Best For**: Full patron analytics, re-entry fee enforcement

#### Option 3: Mobile Check-In (Software Only)
- **Product**: Custom mobile app or QR code system
- **Price**: Development cost only
- **Pros**: Zero hardware cost, 100% accuracy, patron data
- **Cons**: Requires patron cooperation, slower entry
- **Best For**: Members-only venues, consent-based tracking

---

## FAQ

### Q: How often should I send updates?

**A**: For real-time tracking (facial recognition), send immediately. For sensors, batch every 30-60 seconds.

### Q: What happens if my device loses internet connection?

**A**: Buffer events locally and replay them when connection is restored. ClubFlow will accept backdated events within 24 hours.

### Q: Can I send negative counts?

**A**: No, use `eventType: "EXIT"` with positive counts instead.

### Q: Do I need different `deviceId` for entry and exit sensors?

**A**: Yes, if they're physically separate devices. Use descriptive names like `camera-entrance-1` and `camera-exit-1`.

### Q: How do I handle re-entries?

**A**: If using facial recognition, include `isReEntry: true` in metadata. ClubFlow can charge re-entry fees if enabled.

### Q: What's the rate limit?

**A**: 60 requests per minute per device. Contact support for higher limits.

---

## Support

- **Technical Support**: [email protected]
- **Sales/Hardware Consulting**: [email protected]
- **API Status**: https://status.clubflowapp.com
- **GitHub Issues**: https://github.com/clubflow/patron-count-api/issues

---

## Changelog

### v1.0 (2025-12-29)
- Initial release
- HMAC-SHA256 authentication
- Support for entry/exit events, batch updates, multi-zone tracking
- Real-time WebSocket broadcasts
- Capacity alert system

---

## License

This API documentation is provided for ClubFlow hardware integration partners. The API itself is proprietary and requires a valid ClubFlow subscription.

**© 2025 ClubFlow. All rights reserved.**
