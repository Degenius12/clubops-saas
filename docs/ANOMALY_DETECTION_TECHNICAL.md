# Statistical Anomaly Detection - Technical Documentation

## Overview

The ClubOps Statistical Anomaly Detection System uses advanced algorithms to automatically detect fraud, errors, and suspicious patterns in club operations. It analyzes multiple data sources to identify outliers, trends, and systematic issues.

---

## Architecture

### Core Components

1. **Anomaly Detection Service** (`backend/services/anomalyDetection.js`)
   - Statistical analysis algorithms
   - Pattern recognition
   - Outlier detection
   - 950+ lines of production-ready code

2. **Security API Routes** (`backend/routes/security.js`)
   - `/api/security/detect-anomalies` - Run detection
   - `/api/security/anomaly-analysis/:sessionId` - Session analysis
   - `/api/security/employee-risk-score/:employeeId` - Risk scoring

3. **Scheduled Job** (`backend/jobs/anomalyDetectionJob.js`)
   - Automatic detection every 6 hours (configurable)
   - Multi-club processing
   - Alert auto-creation

---

## Detection Algorithms

### 1. Song Count Anomaly Detection

**Purpose:** Detect VIP session fraud and manual count manipulation

**Algorithm:** Z-Score Analysis + Percentile Ranking

```javascript
variance = |songCountFinal - songCountByTime|
zScore = (variance - meanVariance) / stdDevVariance
percentile = rank(variance, allVariances)
```

**Triggers:**
- **CRITICAL** (Severity): variance > 8 songs OR zScore > 3.5
- **HIGH**: variance > 5 songs OR zScore > 2.5
- **MEDIUM**: variance > 2 songs AND percentile > 95th
- **Pattern Escalation**: Manual override applied + variance > 2
- **DJ Mismatch**: |manual - djSync| > 5 songs

**Statistical Methods:**
- Baseline calculated from all sessions in period
- Mean variance computed across club
- Standard deviation determines normal range
- Percentile ranking identifies outliers
- Z-score normalizes across different clubs

**Example Output:**
```json
{
  "type": "VIP_SONG_MISMATCH",
  "severity": "CRITICAL",
  "title": "Song Count Variance: Critical Mismatch",
  "message": "Critical Mismatch: VIP session has 10 song variance (Manual: 15, DJ: 5, Time: 5) - Manual override applied",
  "details": {
    "sessionId": "abc123",
    "variance": 10,
    "zScore": 3.8,
    "percentile": 0.98,
    "vipHostName": "John Doe",
    "overridden": true
  },
  "confidence": 0.95,
  "recommendedAction": "Immediate investigation required - possible fraud"
}
```

---

### 2. Employee Behavior Anomaly Detection

**Purpose:** Identify problematic staff patterns and systematic fraud

**Algorithm:** Multi-Metric Performance Analysis

**Metrics Calculated:**
```javascript
avgVariance = mean(session.variances)
varianceTrend = compareTrend(firstHalf, secondHalf)
collectionRate = (collected / total) * 100
flaggedCount = count(variance > 5)
```

**Triggers:**

**High Variance Pattern:**
- avgVariance > 6 AND sessionCount >= 5
- Severity: HIGH if avgVariance > 8, else MEDIUM
- Confidence: 80%

**Worsening Trend:**
- varianceTrend === 'worsening' AND sessionCount >= 10
- Indicates declining accuracy over time
- Severity: MEDIUM
- Confidence: 75%

**Low Collection Rate:**
- collectionRate < 95% AND checkInCount >= 10
- Severity: HIGH if < 90%, else MEDIUM
- Confidence: 85%

**Repeated Violations:**
- flaggedCount >= 3
- Severity: CRITICAL if >= 5, else HIGH
- Confidence: 90%

**Trend Calculation:**
```javascript
function calculateTrend(sessions) {
  const half = floor(sessions.length / 2);
  const firstHalfAvg = mean(sessions.slice(0, half));
  const secondHalfAvg = mean(sessions.slice(half));
  const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

  if (change > 15) return 'worsening';
  if (change < -15) return 'improving';
  return 'stable';
}
```

---

### 3. Revenue Anomaly Detection

**Purpose:** Detect missing transactions and billing errors

**Algorithm:** Time-Series Analysis with Z-Score

**Data Processing:**
```javascript
// Group transactions by day
dailyRevenue = groupByDay(transactions);
amounts = dailyRevenue.map(d => d.total);

// Calculate statistics
meanRevenue = mean(amounts);
stdDev = standardDeviation(amounts);

// Detect outliers
zScore = (dailyTotal - meanRevenue) / stdDev;
```

**Triggers:**

**Unusually Low Revenue:**
- zScore < -2.0 AND total < mean * 0.5
- Severity: CRITICAL if zScore < -3.0, else HIGH
- Possible causes: Missing entries, system down, theft

**Unusually High Revenue:**
- zScore > 3.0
- Severity: MEDIUM
- Possible causes: Double-charging, data entry errors

**Minimum Data Requirement:**
- Needs at least 7 days of transaction data
- Otherwise skips analysis

---

### 4. Cash Drawer Anomaly Detection

**Purpose:** Detect cash handling discrepancies

**Algorithm:** Variance Threshold Analysis

```javascript
variance = |actualBalance - expectedBalance|
varianceType = actualBalance > expectedBalance ? 'overage' : 'shortage'
```

**Triggers:**
- **WARNING**: variance > $10
- **CRITICAL**: variance > $50

**Data Tracked:**
- Opening balance
- Expected balance (calculated from transactions)
- Actual balance (counted by staff)
- Employee who closed drawer
- Timestamp

**Alert Details:**
```json
{
  "type": "CASH_VARIANCE",
  "severity": "CRITICAL",
  "title": "Cash Drawer Variance: $75.00",
  "message": "Drawer closed by Jane Smith has variance of $75.00 (shortage)",
  "details": {
    "employeeId": "xyz789",
    "employeeName": "Jane Smith",
    "openingBalance": 200.00,
    "expectedBalance": 325.00,
    "actualBalance": 250.00,
    "variance": 75.00,
    "varianceType": "shortage"
  },
  "confidence": 0.95,
  "recommendedAction": "Immediate investigation - count cash again and review all transactions"
}
```

---

### 5. Pattern Anomaly Detection

**Purpose:** Detect systematic fraud and manipulation patterns

**Algorithm:** Frequency Analysis + Bias Detection

**Patterns Detected:**

**Systematic Over-Reporting:**
```javascript
positiveCount = variances.filter(v => v > 2).length;
percentage = positiveCount / totalVariances;

if (positiveCount >= 3 && percentage > 0.7) {
  // Employee consistently inflates song counts
  severity = 'CRITICAL';
  confidence = 0.95;
}
```

**Consistent Rounding Up:**
```javascript
roundedUp = sessions.filter(s =>
  s.songCountFinal > s.songCountByTime &&
  s.songCountFinal === Math.ceil(s.songCountByTime)
).length;

if (roundedUp >= 5 && roundedUp / sessions.length > 0.8) {
  // Employee always rounds up (never down)
  severity = 'MEDIUM';
  confidence = 0.75;
}
```

**Why This Matters:**
- Random errors should be evenly distributed
- Consistent positive bias indicates intentional fraud
- Pattern detection catches what single-session analysis misses

---

### 6. Time-Based Anomaly Detection

**Purpose:** Detect timing errors and duration manipulation

**Algorithm:** Duration Outlier Detection + Logic Validation

**Duration Outliers:**
```javascript
durations = sessions.map(s => s.duration);
meanDuration = mean(durations);
stdDuration = standardDeviation(durations);

zScore = (session.duration - meanDuration) / stdDuration;

if (zScore > 3.0) {
  // Session unusually long
}
```

**Duration/Count Mismatch:**
```javascript
if (duration < 10 && songCountFinal > 3) {
  // Physically impossible - 10 minute session charged for 4+ songs
  severity = 'HIGH';
}
```

**Triggers:**
- **Unusually Long**: zScore > 3.0
- **Duration/Count Mismatch**: Short duration but high song count

---

## Statistical Methods

### Mean (Average)

```javascript
mean(arr) {
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}
```

### Standard Deviation

```javascript
standardDeviation(arr, mean) {
  const squareDiffs = arr.map(val => Math.pow(val - mean, 2));
  const avgSquareDiff = mean(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}
```

### Percentile Ranking

```javascript
calculatePercentile(value, sortedArray) {
  const sorted = [...sortedArray].sort((a, b) => a - b);
  const index = sorted.findIndex(v => v >= value);
  return index / sorted.length;
}
```

### Z-Score

```javascript
zScore = (value - mean) / standardDeviation
```

**Interpretation:**
- |Z| < 1.0: Within 1 std dev (normal)
- |Z| < 2.0: Within 2 std dev (acceptable)
- |Z| > 2.5: Outlier (flag)
- |Z| > 3.0: Extreme outlier (critical)

---

## API Endpoints

### Run Anomaly Detection

```http
POST /api/security/detect-anomalies
Authorization: Bearer {token}
Content-Type: application/json

{
  "period": 30,
  "employeeId": "optional-employee-id",
  "sessionId": "optional-session-id",
  "createAlerts": true
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2024-12-18T12:00:00Z",
  "clubId": "club-123",
  "period": 30,
  "anomalies": [
    {
      "type": "VIP_SONG_MISMATCH",
      "severity": "HIGH",
      "title": "Song Count Variance: Significant Variance",
      "message": "...",
      "details": {...},
      "confidence": 0.85,
      "recommendedAction": "..."
    }
  ],
  "stats": {
    "total": 5,
    "bySeverity": {
      "LOW": 1,
      "MEDIUM": 2,
      "HIGH": 2,
      "CRITICAL": 0
    },
    "byType": {
      "VIP_SONG_MISMATCH": 3,
      "PATTERN_ANOMALY": 1,
      "CASH_VARIANCE": 1
    },
    "avgConfidence": 0.82
  },
  "alertsCreated": 3,
  "alertsSkipped": 2,
  "message": "Detected 5 anomalies across 30 days"
}
```

### Session Analysis

```http
GET /api/security/anomaly-analysis/{sessionId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "sessionId": "session-abc",
  "hasAnomalies": true,
  "session": {
    "id": "session-abc",
    "songCountManual": 15,
    "songCountDjSync": 10,
    "songCountByTime": 12,
    "songCountFinal": 15,
    "startedBy": {...},
    "endedBy": {...}
  },
  "anomalies": [...],
  "stats": {...}
}
```

### Employee Risk Score

```http
GET /api/security/employee-risk-score/{employeeId}?period=30
Authorization: Bearer {token}
```

**Response:**
```json
{
  "employee": {
    "id": "emp-123",
    "name": "John Doe",
    "role": "VIP_HOST",
    "active": true
  },
  "riskScore": 45,
  "riskLevel": "MEDIUM",
  "anomalyCount": 8,
  "anomaliesBySeverity": {
    "CRITICAL": 0,
    "HIGH": 2,
    "MEDIUM": 4,
    "LOW": 2
  },
  "anomaliesByType": {
    "VIP_SONG_MISMATCH": 5,
    "PATTERN_ANOMALY": 3
  },
  "recentAnomalies": [...],
  "recommendedAction": "Monitor closely and provide additional training",
  "period": 30
}
```

**Risk Score Calculation:**
```javascript
weights = {
  CRITICAL: 25,
  HIGH: 15,
  MEDIUM: 8,
  LOW: 3
};

riskScore = anomalies.reduce((sum, a) => sum + weights[a.severity], 0);
riskScore = Math.min(riskScore, 100);

if (riskScore >= 75) riskLevel = 'CRITICAL';
else if (riskScore >= 50) riskLevel = 'HIGH';
else if (riskScore >= 25) riskLevel = 'MEDIUM';
else riskLevel = 'LOW';
```

---

## Scheduled Jobs

### Automatic Detection

**Configuration** (`.env`):
```bash
ENABLE_ANOMALY_DETECTION_CRON=true
ANOMALY_DETECTION_SCHEDULE="0 */6 * * *"  # Every 6 hours
```

**Cron Schedule Examples:**
```
"0 */6 * * *"   # Every 6 hours
"0 0 * * *"     # Daily at midnight
"0 */1 * * *"   # Every hour
"*/30 * * * *"  # Every 30 minutes
```

### Manual Trigger

```javascript
const anomalyJob = require('./backend/jobs/anomalyDetectionJob');

// Run for all clubs
const results = await anomalyJob.runForAllClubs({
  period: 7,
  createAlerts: true
});

// Run for specific club
const clubResult = await anomalyJob.runForClub('club-123', 'Club Name', {
  period: 7,
  createAlerts: true
});

// Quick scan (critical only)
const quickScan = await anomalyJob.runQuickScan('club-123', {
  period: 1,
  onlyCritical: true
});
```

### Job Statistics

```javascript
const stats = anomalyJob.getStats();
// {
//   totalAnomaliesDetected: 150,
//   totalAlertsCreated: 89,
//   totalClubsProcessed: 12,
//   isRunning: false,
//   lastRun: "2024-12-18T06:00:00Z",
//   runCount: 24,
//   uptime: 21600000
// }
```

---

## Performance Optimization

### Caching Strategy

```javascript
// Cache statistics for 5 minutes
this.statsCache = new Map();
this.CACHE_TTL = 5 * 60 * 1000;
```

### Batch Processing

- Process clubs sequentially to avoid DB overload
- Use transactions for alert creation
- Limit query results with date ranges

### Query Optimization

```javascript
// Only select needed fields
select: {
  songCountManual: true,
  songCountByTime: true,
  songCountFinal: true
}

// Use indexed fields for WHERE clauses
where: {
  clubId: clubId,  // Indexed
  endedAt: { gte: startDate }  // Indexed
}
```

---

## Testing

### Unit Tests

```javascript
// Test statistical functions
describe('AnomalyDetection', () => {
  it('should calculate mean correctly', () => {
    const result = anomalyDetection.mean([1, 2, 3, 4, 5]);
    expect(result).toBe(3);
  });

  it('should detect high variance', () => {
    const session = {
      songCountFinal: 15,
      songCountByTime: 5,
      songCountManual: 15,
      songCountDjSync: 6
    };
    const stats = { meanVariance: 2, stdDevVariance: 1.5 };
    const result = anomalyDetection.analyzeSongCountSession(session, stats);
    expect(result.severity).toBe('CRITICAL');
  });
});
```

### Integration Tests

```javascript
// Test full detection flow
describe('Anomaly Detection API', () => {
  it('should detect anomalies via API', async () => {
    const response = await request(app)
      .post('/api/security/detect-anomalies')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ period: 30, createAlerts: true });

    expect(response.status).toBe(200);
    expect(response.body.anomalies).toBeInstanceOf(Array);
  });
});
```

---

## Troubleshooting

### No Anomalies Detected

**Possible Causes:**
1. Not enough data (need min 5-10 sessions)
2. All variances within normal range
3. Date range too narrow

**Solution:**
- Expand period parameter
- Check if VIP sessions exist in timeframe
- Verify songCountByTime is being calculated

### Too Many False Positives

**Possible Causes:**
1. DJ sync unreliable
2. Thresholds too sensitive
3. Different song length averages

**Solution:**
- Adjust thresholds in service
- Use manual + time-based as primary sources
- Calibrate per club if needed

### High Memory Usage

**Possible Causes:**
1. Processing too many clubs at once
2. Large result sets not paginated

**Solution:**
- Process clubs sequentially
- Add pagination to queries
- Increase cache TTL

---

## Future Enhancements

### Machine Learning Integration

- Train model on historical fraud cases
- Predict fraud probability score
- Anomaly clustering for pattern groups

### Advanced Statistical Methods

- ARIMA for time-series forecasting
- Isolation Forest for multivariate outliers
- Markov chains for behavior prediction

### Real-Time Detection

- Stream processing with WebSockets
- Instant alerts on session end
- Live dashboard updates

---

## Security Considerations

### Data Privacy

- Anomaly details contain PII (employee names)
- Restrict access to OWNER role only
- Audit log all detection runs

### Alert Fatigue

- Consolidate duplicate alerts
- Smart grouping by employee/type
- Configurable severity thresholds

### Performance Impact

- Run during off-peak hours
- Use read replicas for queries
- Implement rate limiting on API

---

## References

### Statistical Methods
- Z-Score: Standard score in statistics
- Percentile: Ranking in distribution
- Standard Deviation: Measure of variance

### Fraud Detection
- Benford's Law: Digit distribution analysis
- CUSUM: Cumulative sum control chart
- EWMA: Exponentially weighted moving average

---

**Last Updated:** December 2024
**Version:** 1.0
**Author:** ClubOps Engineering Team
