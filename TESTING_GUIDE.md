# Testing Guide - Features #26-47

Quick guide for testing the newly implemented backend features.

## Quick Start (Windows)

### Option 1: Automated (One-Click)
```bash
# Double-click this file or run:
start-and-test.bat
```
This will:
1. Start the backend server in a new window
2. Wait 10 seconds
3. Run the automated test suite
4. Show results

### Option 2: Manual
```bash
# Terminal 1: Start backend
start-backend.bat
# Or manually: cd backend && npm start

# Terminal 2: Run tests (after backend starts)
node test-features-26-47.js
```

## What Gets Tested

✅ **Feature #26: Late Fee Tracking**
- Preview late fees (without charging)
- Get late fee configuration
- Generate late fee report

✅ **Feature #27: Nightly Close-Out Report**
- Complete shift summary
- Revenue breakdown
- VIP session summary
- Alert counts

✅ **Feature #28: Payroll Export**
- JSON format export
- CSV format export
- Date range filtering

✅ **Features #29-30: Multi-Club Management**
- List owned clubs
- Aggregate revenue across clubs
- Aggregate statistics

✅ **Features #35-36: Settings Customization**
- Fee structure retrieval
- VIP configuration retrieval

✅ **Features #44-45: Dancer Management**
- Performance history with analytics
- Suspension capability (not tested to preserve data)

## Manual API Testing

### Get Authentication Token

1. Start the backend: `cd backend && npm start`
2. Login via curl:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"owner@demo.clubflow.com\",\"password\":\"demo123\"}"
```
3. Copy the `token` from the response
4. Set it as a variable:
```bash
set TOKEN=your-token-here
```

### Test Individual Endpoints

#### Late Fee System
```bash
# Preview (no charges)
curl http://localhost:5000/api/late-fees/preview -H "Authorization: Bearer %TOKEN%"

# Get config
curl http://localhost:5000/api/late-fees/config -H "Authorization: Bearer %TOKEN%"

# Get report
curl http://localhost:5000/api/late-fees/report -H "Authorization: Bearer %TOKEN%"
```

#### Nightly Close-Out
```bash
curl "http://localhost:5000/api/reports/nightly-closeout?date=2025-12-26" -H "Authorization: Bearer %TOKEN%"
```

#### Payroll Export
```bash
# JSON
curl "http://localhost:5000/api/reports/payroll-export?startDate=2025-12-01&endDate=2025-12-31&format=json" -H "Authorization: Bearer %TOKEN%"

# CSV
curl "http://localhost:5000/api/reports/payroll-export?startDate=2025-12-01&endDate=2025-12-31&format=csv" -H "Authorization: Bearer %TOKEN%" -o payroll.csv
```

#### Multi-Club
```bash
# List clubs
curl http://localhost:5000/api/multi-club/owned-clubs -H "Authorization: Bearer %TOKEN%"

# Aggregate revenue
curl http://localhost:5000/api/multi-club/aggregate-revenue -H "Authorization: Bearer %TOKEN%"

# Aggregate stats
curl http://localhost:5000/api/multi-club/aggregate-stats -H "Authorization: Bearer %TOKEN%"
```

#### Settings
```bash
# Fee structure
curl http://localhost:5000/api/settings/fee-structure -H "Authorization: Bearer %TOKEN%"

# VIP config
curl http://localhost:5000/api/settings/vip-config -H "Authorization: Bearer %TOKEN%"
```

#### Dancer Management
```bash
# Get dancer ID first
curl http://localhost:5000/api/dancers -H "Authorization: Bearer %TOKEN%"

# Performance history (replace DANCER_ID)
curl "http://localhost:5000/api/dancers/DANCER_ID/performance-history?limit=30" -H "Authorization: Bearer %TOKEN%"

# Suspend (replace DANCER_ID)
curl -X PUT "http://localhost:5000/api/dancers/DANCER_ID/suspend" \
  -H "Authorization: Bearer %TOKEN%" \
  -H "Content-Type: application/json" \
  -d "{\"suspend\":true,\"reason\":\"Test suspension\"}"
```

## Expected Results

### With Test Data
If you have demo data seeded, you should see:
- ✅ Late fee preview with entertainers list
- ✅ Close-out report with shifts and revenue
- ✅ Payroll data with hours and fees
- ✅ Multi-club data (if owner has multiple clubs)
- ✅ Settings configurations
- ✅ Dancer performance history

### Without Test Data
If database is empty, you'll see:
- ⚠️ Empty arrays/lists
- ⚠️ Zero totals
- ⚠️ But endpoints should return 200 OK status

## Troubleshooting

### "Connection refused" error
**Problem**: Backend server isn't running
**Solution**:
```bash
cd backend
npm start
```

### "Unauthorized" error
**Problem**: Invalid or expired token
**Solution**: Login again to get a new token

### "Club not found" error
**Problem**: User doesn't have a club assigned
**Solution**: Check database or seed demo data

### Empty results
**Problem**: No test data in database
**Solution**: Run demo data seeder:
```bash
cd backend
node scripts/seedDemoData.js
```

## Next Steps After Testing

1. **If tests pass**: Move to frontend UI implementation
2. **If tests fail**: Debug specific endpoints with curl
3. **Review warnings**: Check for data issues or missing features

## Test Data Setup (Optional)

Create test data for more comprehensive testing:

```bash
# Seed demo data
cd backend
node scripts/seedDemoData.js

# This creates:
# - 10 entertainers
# - 5 VIP booths
# - Past shifts with transactions
# - Revenue data
```

## Frontend Testing (Next Phase)

After backend tests pass:
1. Start frontend: `cd frontend && npm start`
2. Navigate to new features:
   - Late Fees: http://localhost:3000/late-fees (needs UI)
   - Reports: http://localhost:3000/reports (needs UI)
   - Settings: http://localhost:3000/settings (needs UI)

## Support

- Test script: `test-features-26-47.js`
- Implementation docs: `REMAINING_FEATURES.md`
- Session summary: `FEATURE_26_TO_50_SESSION_SUMMARY.md`
