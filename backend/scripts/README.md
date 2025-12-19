# Security Dashboard Seed Scripts

These scripts populate your database with realistic test data to showcase all security and fraud detection features.

## Quick Start

### Step 1: Find Your Club ID

```bash
node backend/scripts/getClubId.js
```

This will display all clubs in your database with their IDs.

### Step 2: Seed Security Data

```bash
node backend/scripts/seedSecurityData.js <CLUB_ID>
```

Replace `<CLUB_ID>` with the ID from Step 1.

## What Gets Created

### Employees (6)
- **3 VIP Hosts**: Marcus Thompson, James Anderson, Robert Taylor
- **2 Door Staff**: Michael Wilson, David Moore
- **1 Manager**: Chris Jackson

All employees have password: `password123`

### Dancers (12)
- Diamond, Crystal, Star, Sapphire, Ruby, Pearl, Jade, Amber, Onyx, Velvet, Nova, Phoenix
- Each with realistic license data and expiry dates
- QR badge codes for check-in testing

### VIP Booths (5)
- Champagne, Diamond, Gold, Platinum, Ruby
- Different hourly rates ($300-500)
- $25 per song rate

### VIP Sessions (60)
Distribution designed to test anomaly detection:
- **60%** (36 sessions) - Accurate: 0-2 song variance
- **20%** (12 sessions) - Minor variance: 3-5 songs
- **15%** (9 sessions) - Significant variance: 6-8 songs
- **5%** (3 sessions) - **CRITICAL**: >8 songs 🚨 (fraud indicators)

Song counts calculated from:
- **Manual count** (VIP host entry)
- **DJ sync count** (automated from DJ software)
- **Time-based** (duration ÷ 3.5 min avg)
- **Final count** (what was charged)

### Dancer Check-Ins (40)
- 30-day history
- 10% have license verification issues
- 15% have deferred bar fees
- 5% have waived bar fees
- Mix of cash and card payments

### Audit Log Entries (~140)
- Hash-chained for immutability
- Session creation/completion events
- Manual override entries (flagged)
- Proper audit trail for compliance

### Verification Alerts (~10)
- Created for sessions with significant variance
- Severity based on variance amount:
  - MEDIUM: 6-8 songs variance
  - HIGH: 8-10 songs variance
  - CRITICAL: >10 songs variance

## After Seeding

### View Security Dashboard
1. Navigate to `/security` in your app
2. You should now see:
   - **Overview Tab**: Integrity scores, recent anomalies, flagged activity
   - **Data Comparisons**: All 60 VIP sessions with variance analysis
   - **Audit Log**: ~140 entries with filtering
   - **Anomaly Alerts**: ~10 alerts requiring action
   - **Employee Performance**: 3 VIP hosts with performance metrics

### Trigger Anomaly Detection
The anomaly detection cron runs every 6 hours, but you can trigger it manually:

```bash
# Via API (requires authentication)
POST /api/security/detect-anomalies
{
  "period": 30,
  "createAlerts": true
}
```

Or wait for the automatic cron job to run.

### Test Features

**Test Integrity Scores:**
- Song Count Match should be around 80% (60% perfect + 20% minor variance)
- Some sessions will be flagged for review

**Test Anomaly Detection:**
- Look for CRITICAL alerts from sessions with >8 song variance
- Check employee performance for VIP hosts with high average variance
- Review pattern detection for systematic over-reporting

**Test Audit Log:**
- Filter by "Flagged" to see manual overrides
- Search for specific employee names
- Export to CSV/JSON for external analysis

**Test Employee Performance:**
- Compare VIP hosts' average variance
- Check for "worsening" trends
- Review flagged incident counts

## Clean Up (Optional)

To remove all seeded data:

```bash
# Delete all VIP sessions
npx prisma studio
# Then manually delete records from tables: VipSession, DancerCheckIn, AuditLog, VerificationAlert
```

Or delete and recreate the entire database:

```bash
npx prisma migrate reset
npx prisma migrate deploy
```

**⚠️ Warning**: This will delete ALL data, not just test data!

## Troubleshooting

### "Club with ID ... not found"
Run `node backend/scripts/getClubId.js` to verify the club ID is correct.

### "No clubs found"
You need to create a club first:
1. Sign up via the app UI (`/register`)
2. Or use Prisma Studio: `npx prisma studio`

### Prisma connection errors
Check your `DATABASE_URL` in `backend/.env`

### Missing dependencies
```bash
cd backend
npm install
```

## Tips

- Run the seed script multiple times with different club IDs to test multi-club scenarios
- Modify variance percentages in `seedSecurityData.js` to create more/fewer anomalies
- Adjust date ranges to test different time periods
- Create additional employees with specific patterns to test detection algorithms

## Next Steps

After seeding data, read the full documentation:
- [docs/ANOMALY_DETECTION_TECHNICAL.md](../../docs/ANOMALY_DETECTION_TECHNICAL.md) - Technical details on detection algorithms
- [docs/SECURITY_DASHBOARD_GUIDE.md](../../docs/SECURITY_DASHBOARD_GUIDE.md) - User guide for the Security Dashboard

Enjoy testing the fraud detection features! 🎉
