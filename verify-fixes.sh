#!/bin/bash

echo "=== CLUBOPS DEPLOYMENT VERIFICATION ==="
echo ""

# 1. Check CORS Preflight
echo "1. Testing CORS Preflight..."
CORS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "https://clubops-backend.vercel.app/api/auth/login" \
  -H "Origin: https://www.clubflowapp.com" \
  -H "Access-Control-Request-Method: POST")

if [ "$CORS_STATUS" = "204" ] || [ "$CORS_STATUS" = "200" ]; then
  echo "   ✅ CORS Preflight returns $CORS_STATUS"
else
  echo "   ❌ CORS Preflight failed with status $CORS_STATUS"
fi

# 2. Check Backend Version
echo ""
echo "2. Testing Backend Version..."
VERSION=$(curl -s "https://clubops-backend.vercel.app/health" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
if [ "$VERSION" = "3.0.8" ]; then
  echo "   ✅ Backend version: $VERSION"
else
  echo "   ⚠️  Backend version: $VERSION (expected 3.0.8)"
fi

# 3. Check Login
echo ""
echo "3. Testing Login Endpoint..."
LOGIN_RESPONSE=$(curl -s -X POST "https://clubops-backend.vercel.app/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clubops.com","password":"password"}')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
  echo "   ✅ Login successful - token received"
else
  echo "   ❌ Login failed"
  echo "   Response: $LOGIN_RESPONSE"
fi

# 4. Check Audit Log Structure
echo ""
echo "4. Testing Audit Log Structure..."
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  AUDIT_RESPONSE=$(curl -s "https://clubops-backend.vercel.app/api/security/audit-log" \
    -H "Authorization: Bearer $TOKEN")

  if echo "$AUDIT_RESPONSE" | grep -q '"entries"' && echo "$AUDIT_RESPONSE" | grep -q '"total"'; then
    ENTRY_COUNT=$(echo "$AUDIT_RESPONSE" | grep -o '"entries":\[[^]]*\]' | grep -o '{' | wc -l)
    TOTAL=$(echo "$AUDIT_RESPONSE" | grep -o '"total":[0-9]*' | cut -d':' -f2)
    echo "   ✅ Audit log structure correct"
    echo "   - Entries: $ENTRY_COUNT"
    echo "   - Total: $TOTAL"
  else
    echo "   ❌ Audit log structure incorrect"
    echo "   Response: $AUDIT_RESPONSE"
  fi
else
  echo "   ⚠️  Skipped - no auth token"
fi

echo ""
echo "=== VERIFICATION COMPLETE ==="
