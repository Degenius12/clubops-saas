#!/bin/bash
# Test patron count webhook with curl

BACKEND_URL="http://localhost:3001"
CLUB_ID="1c7cc38f-9d4e-495b-9fe1-9a7b0c63f03d"
WEBHOOK_SECRET="eceab0d5ef50d2c342be55eb45b9cb86ecacd1f205caeeb43d98787f056d33a7"

# Test payload
PAYLOAD='{"clubId":"1c7cc38f-9d4e-495b-9fe1-9a7b0c63f03d","deviceId":"camera-entrance-1","eventType":"ENTRY","count":1,"metadata":{"faceId":"test-123"}}'

# Calculate HMAC signature
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | sed 's/^.* //')

echo "Testing webhook with HMAC signature..."
echo "Signature: $SIGNATURE"
echo ""

# Send request
curl -X POST "$BACKEND_URL/api/patron-count/webhook" \
  -H "Content-Type: application/json" \
  -H "X-ClubFlow-Signature: $SIGNATURE" \
  -d "$PAYLOAD" \
  -w "\nHTTP Status: %{http_code}\n"
