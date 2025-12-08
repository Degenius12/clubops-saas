# ClubOps Comprehensive Testing Plan

## Overview

| Phase | Description | Duration |
|-------|-------------|----------|
| 1 | Environment Verification | ~5 min |
| 2 | Backend API Testing | ~15 min |
| 3 | Frontend Component Testing | ~15 min |
| 4 | Integration Testing | ~20 min |
| 5 | End-to-End User Flows | ~25 min |
| 6 | Edge Cases & Error Handling | ~10 min |
| 7 | Report Generation | ~5 min |

**Total: ~95 minutes**

---

## Production URLs

- **Frontend**: https://clubops-saas-platform.vercel.app
- **Backend**: https://clubops-backend.vercel.app

---

## PHASE 1: Environment Verification

### Tests to Run:
1. Frontend accessibility (HTTP 200)
2. Backend health endpoint
3. CORS configuration validation
4. Database connectivity check

### Commands:
```bash
curl -I https://clubops-saas-platform.vercel.app
curl https://clubops-backend.vercel.app/api/health
```

---

## PHASE 2: Backend API Testing

### 2.1 Authentication Endpoints
- POST /api/auth/register - User registration
- POST /api/auth/login - User login (expect token)
- GET /api/auth/me - Token validation
- Invalid token rejection (expect 401)

### 2.2 Dancer Management
- GET /api/dancers - List all dancers
- POST /api/dancers - Create dancer
- GET /api/dancers/expiring-licenses - License alerts
- POST /api/dancers/:id/check-in - Dancer check-in
- POST /api/dancers/:id/bar-fee - Bar fee payment

### 2.3 DJ Queue
- GET /api/queue - Get active queue
- POST /api/queue - Add to queue
- PUT /api/queue/reorder - Reorder queue (drag-drop)

### 2.4 VIP Rooms
- GET /api/vip-rooms - Room status
- POST /api/vip-rooms/sessions - Start session
- PUT /api/vip-rooms/sessions/:id/end - End session
- Timer accuracy validation

### 2.5 Financials
- GET /api/financials/daily - Daily summary
- GET /api/financials/revenue - Revenue report
- GET /api/financials/bar-fees - Bar fee report

---

## PHASE 3: Frontend Component Testing

### 3.1 Authentication UI
- Login page renders (email, password, submit)
- Dark theme verification
- Successful login redirects to dashboard
- Invalid credentials show error

### 3.2 Dashboard UI
- Revenue widget visible
- Active dancers count visible
- Navigation sidebar functional
- Links work (Dancers, DJ Queue, VIP, Reports)

### 3.3 DJ Queue Interface
- Queue container displays
- Draggable items present
- Music player controls (play, volume)
- Drag-and-drop reorders queue

### 3.4 VIP Room Management
- Room cards with status indicators
- Real-time timer displays
- Start session workflow
- End session workflow

### 3.5 Dancer Management
- Page loads without JS errors (KNOWN ISSUE)
- License expiry alerts visible
- Add dancer form opens
- Check-in flow works
- Bar fee payment modal functions

---

## PHASE 4: Integration Testing

### 4.1 Socket.io Real-Time
- Socket connection establishes
- Queue update broadcasts received
- VIP timer ticks broadcast

### 4.2 Database Integration
- Connection test
- Schema integrity (required fields exist)
- Transaction rollback works

### 4.3 API-Frontend Integration
- Dashboard loads data from API
- Dancer updates reflect in UI immediately

---

## PHASE 5: End-to-End User Flows

### Flow 1: Manager Night Shift Setup
1. Login
2. Review dashboard metrics
3. Check license expiry alerts
4. Navigate to DJ queue
5. Check VIP room availability

### Flow 2: Dancer Check-in and Bar Fee Payment
1. Login
2. Navigate to dancers
3. Check-in a dancer
4. Process bar fee payment

### Flow 3: DJ Queue Management
1. Login
2. Navigate to DJ queue
3. Add dancer to queue
4. Verify music player controls

### Flow 4: VIP Room Session Lifecycle
1. Login
2. Navigate to VIP rooms
3. Select available room
4. Start session with dancer
5. Verify timer running
6. End session

### Flow 5: Financial Reporting
1. Login
2. Navigate to financials/reports
3. Verify charts/graphs display
4. Check revenue metrics
5. Check bar fee totals

---

## PHASE 6: Edge Cases & Error Handling

- API timeout handling
- 500 server error graceful handling
- Empty state displays
- Expired license blocks queue addition
- Session recovery after disconnect
- Duplicate submission prevention

---

## PHASE 7: Report Generation

Output files to save:
- `test-results/phase1-environment.md`
- `test-results/phase2-api-tests.md`
- `test-results/phase3-ui-tests.md`
- `test-results/phase4-integration.md`
- `test-results/phase5-e2e-flows.md`
- `test-results/phase6-edge-cases.md`
- `test-results/MASTER-REPORT.md`

---

## Test Credentials

```
Email: admin@clubops.com
Password: admin123
```

---

## Execution Strategy

1. Run in phased segments (15-20 min each)
2. Save results to files after EACH phase
3. Summarize before proceeding
4. Use minimal Playwright snapshots (token-heavy)
5. Checkpoint with user between phases

---

## Known Issues to Verify

From project memory:
- JavaScript runtime errors on Dancers page
- CORS configuration mismatches
- Authentication token persistence issues
- "Dancers paying bar fees" functionality needs testing
