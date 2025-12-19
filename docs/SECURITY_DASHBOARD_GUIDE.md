# Security Dashboard - Owner Guide

## Overview

The **Security Dashboard** is your complete fraud prevention and monitoring center. It provides real-time visibility into all club operations with automated anomaly detection and comprehensive audit trails.

**Access:** Navigate to **Security** in the main sidebar menu (shield icon)

---

## Dashboard Sections

### 1. Overview Tab

#### Integrity Score Cards
Four real-time metrics showing system health:

- **Overall Integrity (0-100%)** - Combined health score
- **Song Count Match (%)** - VIP session accuracy across all sources
- **Revenue Accuracy (%)** - Financial transaction consistency
- **Check-In Compliance (%)** - Proper entry procedures followed

**Color Coding:**
- 🟢 Green (95%+): Excellent - No action needed
- 🔵 Blue (85-95%): Good - Monitor
- 🟡 Yellow (70-85%): Warning - Review flagged items
- 🔴 Red (<70%): Critical - Immediate attention required

#### Recent Anomalies Widget
Shows latest 3 anomaly alerts with:
- Alert title and message
- Severity (LOW, MEDIUM, HIGH, CRITICAL)
- Entity type (VIP Session, Check-In, etc.)
- Timestamp
- Current status (PENDING, ACKNOWLEDGED, RESOLVED)

#### Flagged Activity Widget
Displays recent high-risk actions:
- Manual overrides
- Voided transactions
- Deleted records
- Who performed the action
- When it occurred
- What was changed

#### Song Count Comparison Preview
Quick view of recent VIP sessions showing:
- Manual count (VIP host)
- DJ sync count (automated)
- Time-based calculation
- Variance between sources
- Match status

---

### 2. Data Comparisons Tab

**Purpose:** Detailed analysis of VIP session song counts from multiple sources

#### Summary Cards
- **Matching** - All counts agree (≤2 song variance)
- **Minor Variance** - 2-5 song difference
- **Significant** - 5-8 song difference
- **Critical** - >8 songs or flagged by system

#### Full Comparison Table
Columns:
- **Session Details** - Dancer name, date, duration
- **Booth** - VIP room location
- **Host** - Staff member managing session
- **Manual Count** - VIP host's reported count
- **DJ Sync** - Automated count from DJ system
- **By Time** - Calculated from session duration
- **Final** - Amount actually billed
- **Variance** - Difference between counts
- **Status** - Match/Minor/Significant/Critical
- **Verified** - Customer confirmation checkbox

**Actions:**
- Click rows for detailed drill-down
- Export to CSV/JSON for further analysis
- Filter by variance level
- Sort by any column

---

### 3. Audit Log Tab

**Purpose:** Complete immutable record of all significant system actions

#### Filters
- **All** - Every action logged
- **Flagged** - Only high-risk actions (overrides, voids, deletes)
- **Overrides** - Manual count adjustments
- **Voids** - Cancelled transactions
- **Deletes** - Removed records

#### Search
Search by:
- Employee name
- Entity type (VIP Session, Check-In, etc.)
- Action type

#### Audit Entry Details
Each entry shows:
- **Action Type** - What happened (CREATE, UPDATE, DELETE, OVERRIDE, VOID)
- **Entity** - What was affected (VIP Session #12345)
- **User** - Who performed it (name + role)
- **Timestamp** - Exact date/time
- **IP Address** - Where it came from
- **Previous Data** - Before state (for updates)
- **New Data** - After state (for updates)
- **Hash** - Cryptographic verification

**Security Features:**
- Hash chain prevents tampering
- Cannot be edited or deleted
- Export with hash verification
- Suitable for legal/compliance use

---

### 4. Anomaly Alerts Tab

**Purpose:** Automated detection of suspicious patterns and discrepancies

#### Status Summary Cards
- **Pending** (🔴) - New alerts requiring investigation
- **Investigating** (🟡) - Currently being reviewed
- **Resolved** (🟢) - Issue addressed and closed
- **Dismissed** (⚪) - False positive or not actionable

#### Alert Types Detected

**VIP_SONG_MISMATCH**
- Large variance between manual and automated counts
- Severity based on variance size
- May indicate manual entry errors or fraud

**CHECK_IN_MISMATCH**
- Duplicate check-in attempts
- Banned dancers trying to enter
- License compliance issues

**CASH_VARIANCE**
- Cash drawer discrepancies
- Opening vs closing balance issues
- Triggered when variance > $10 (HIGH if > $50)

**PATTERN_DETECTED**
- Unusual employee behavior patterns
- Statistical anomalies
- Repeated issues from same staff member

**ACCESS_VIOLATION**
- Unauthorized access attempts
- Role permission violations

#### Alert Details
Each alert shows:
- Title and description
- Severity level with color coding
- Current status
- Creation timestamp
- Entity type and ID
- Supporting data (counts, amounts, etc.)
- Resolution notes (if resolved)

#### Actions
- **Investigate** - Mark as under review
- **Mark Resolved** - Add resolution notes and close
- **Dismiss** - Ignore false positive

---

### 5. Employee Performance Tab

**Purpose:** Monitor staff accuracy, efficiency, and flag problematic behavior

#### Performance Cards
Individual staff member cards showing:

**Avg Variance**
- Average song count variance across all VIP sessions
- 🟢 ≤3%: Excellent
- 🟡 3-6%: Acceptable
- 🔴 >6%: Concerning

**Collection Rate**
- Percentage of bar fees successfully collected
- 🟢 ≥98%: Excellent
- 🔵 95-98%: Good
- 🟡 <95%: Needs improvement

**Shifts Worked**
- Total shifts in period
- Context for other metrics

**Flagged Incidents**
- Number of times involved in anomalies
- 🟢 0: Clean record
- 🟡 1-2: Monitor
- 🔴 ≥3: Serious concern

**Variance Trend**
- ↓ Improving: Getting more accurate
- → Stable: Consistent performance
- ↑ Worsening: Declining accuracy

**Status Badge**
- **Excellent** - Top performer, no issues
- **Good** - Solid performance
- **Monitor** - Minor concerns, watch closely
- **Concern** - Serious issues, consider action

#### Comparison Table
Side-by-side view of all employees:
- Sortable by any metric
- Quickly identify top/bottom performers
- Compare trends across team
- Export for HR review

---

## Real-Time Features

### Live Connection Status
Top-right indicator shows:
- 🟢 **Live** - Connected, receiving real-time updates
- 🔴 **Offline** - Reconnecting, data may be stale

### Auto-Refresh
Data automatically updates when:
- New VIP sessions end
- Check-ins occur
- Anomalies detected
- Audit log entries created

### Alert Badges
Header shows active alerts:
- 🔴 **X Pending** - Unresolved anomalies
- 🟡 **X Flagged** - Variances needing review

---

## Export & Reporting

### Export Modal
Access via **Export** button in header

**Available Exports:**
✓ Audit Log Entries (with hash verification)
✓ Song Count Comparisons
✓ Anomaly Alerts
✓ Employee Performance

**Formats:**
- **CSV** - Excel-compatible, easy filtering
- **JSON** - Full data with all fields

**Use Cases:**
- Compliance audits
- Legal investigations
- HR reviews
- Financial reconciliation
- Insurance claims

---

## Date Range Filtering

### Quick Filters
- **Today** - Current day only
- **Last 7 Days** - Rolling week
- **Last 30 Days** - Rolling month
- **Custom Range** - Manual date selection

All sections respond to date filter:
- Overview metrics recalculate
- Audit log filters
- Comparisons filter
- Anomalies filter
- Employee stats filter

---

## Best Practices

### Daily Review (5 minutes)
1. Check Overall Integrity score
2. Review any pending anomalies
3. Scan recent flagged activity

### Weekly Deep Dive (30 minutes)
1. Review full comparison report
2. Check employee performance trends
3. Resolve all pending anomalies
4. Export audit log for records

### Monthly Analysis (1 hour)
1. Compare metrics month-over-month
2. Review employee performance rankings
3. Identify pattern changes
4. Export all data for backup
5. Review with management team

### Incident Response
When you see a CRITICAL alert:
1. **Investigate immediately** - Click alert for details
2. **Review audit log** - Find related actions
3. **Check comparisons** - Verify source data
4. **Contact employee** - Get their explanation
5. **Document resolution** - Add detailed notes
6. **Mark resolved** or escalate to HR/legal

---

## Fraud Prevention Workflow

### VIP Song Count Variance
**If variance > 5 songs:**
1. Check if customer confirmed count
2. Review start/end photos (if available)
3. Compare all three count sources
4. Check if override was properly authorized
5. Interview VIP host if pattern emerges
6. Document resolution or disciplinary action

### Cash Drawer Discrepancy
**If variance > $10:**
1. Alert automatically created
2. Review shift summary for employee
3. Check all transactions during shift
4. Verify if bar fees match check-ins
5. Count physical cash if employee still on shift
6. Interview employee
7. Document in resolution notes

### Repeated Employee Issues
**If employee flagged 3+ times:**
1. System shows "CONCERN" status
2. Review all incidents in detail
3. Check variance trend (improving/worsening)
4. Consider retraining vs discipline
5. Document action plan
6. Monitor closely for 30 days

---

## Technical Details

### Data Sources
- **Manual Counts** - VIP Host tablet interface
- **DJ Sync** - Automated from DJ software
- **Time-Based** - Calculated: (duration ÷ avg_song_length)
- **Financial** - POS transaction records
- **Check-Ins** - Door staff tablet entries

### Security
- All data hash-chained for integrity
- Audit log immutable after creation
- IP address logged for all actions
- Session tracking across devices
- Export includes verification hashes

### Performance
- Real-time WebSocket updates
- Cached metrics for speed
- Pagination for large datasets
- Optimized queries on backend
- Automatic reconnection on disconnect

---

## Troubleshooting

### "Offline" Status
**Cause:** Lost WebSocket connection
**Fix:** Dashboard auto-reconnects. Manual refresh if needed.

### Missing Data
**Cause:** Date filter too narrow or no activity
**Fix:** Expand date range or check other tabs

### High Variance Normal?
**Cause:** DJ sync may be inaccurate during rush hours
**Fix:** Use manual + time-based as backup sources

### Export Not Working
**Cause:** Too much data selected
**Fix:** Narrow date range or export one section at a time

---

## API Endpoints (Technical Reference)

```
GET  /api/security/integrity?clubId=X&period=30
GET  /api/security/audit-log?clubId=X&startDate=...&endDate=...
GET  /api/security/comparisons?clubId=X&flaggedOnly=false
GET  /api/security/anomalies?clubId=X&status=PENDING
GET  /api/security/employee-performance?clubId=X&period=30
POST /api/security/anomalies/:id/investigate
POST /api/security/anomalies/:id/resolve
POST /api/security/anomalies/:id/dismiss
GET  /api/security/audit-log/export?format=csv
GET  /api/security/comparisons/export?format=json
```

---

## Support

### Questions?
- Review this guide first
- Check audit log for specific actions
- Contact ClubOps support: support@clubops.com
- Emergency fraud hotline: 1-800-CLUBOPS

### Feature Requests
- Email: features@clubops.com
- Include specific use case
- Screenshots helpful

---

**Last Updated:** December 2024
**Dashboard Version:** 1.0
**Documentation Version:** 1.0
