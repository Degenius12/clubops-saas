#!/bin/bash

# Simple patron count API test using curl
# Tests the webhook endpoint without authentication

BACKEND_URL="http://localhost:3001"
CLUB_ID="1c7cc38f-9d4e-495b-9fe1-9a7b0c63f03d"

echo "🚪 Testing Patron Count Webhook (Simulated Hardware)"
echo "===================================================="
echo ""

# Test 1: Entry event (facial recognition camera)
echo "Test 1: Entry event (facial recognition camera simulation)"
echo "Payload: 1 patron enters, face ID detected, not a re-entry"
echo ""

# Generate a simple payload (no signature - we'll need to bypass auth for testing)
curl -X POST "${BACKEND_URL}/api/patron-count/webhook" \
  -H "Content-Type: application/json" \
  -H "X-ClubFlow-Signature: test-signature-bypass" \
  -d "{
    \"clubId\": \"${CLUB_ID}\",
    \"deviceId\": \"camera-entrance-1\",
    \"eventType\": \"ENTRY\",
    \"count\": 1,
    \"confidence\": 0.97,
    \"metadata\": {
      \"faceId\": \"abc123xyz\",
      \"isReEntry\": false,
      \"gender\": \"female\",
      \"ageEstimate\": 26
    }
  }"

echo ""
echo ""

# Test 2: Batch entry/exit (infrared sensor)
echo "Test 2: Batch update (infrared sensor simulation)"
echo "Payload: 5 people entered, 2 people exited (net +3)"
echo ""

curl -X POST "${BACKEND_URL}/api/patron-count/webhook" \
  -H "Content-Type: application/json" \
  -H "X-ClubFlow-Signature: test-signature-bypass" \
  -d "{
    \"clubId\": \"${CLUB_ID}\",
    \"deviceId\": \"sensor-main-door\",
    \"entries\": 5,
    \"exits\": 2,
    \"metadata\": {
      \"sensorType\": \"IR_STEREO\",
      \"direction\": \"BIDIRECTIONAL\"
    }
  }"

echo ""
echo ""
echo "✅ Tests complete!"
echo "Check backend logs for results"
