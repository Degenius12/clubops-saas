/**
 * Statistical Anomaly Detection Service
 *
 * Implements intelligent pattern recognition algorithms to detect:
 * - Song count fraud and systematic variance patterns
 * - Employee behavior anomalies
 * - Revenue discrepancies and unusual patterns
 * - Time-series outliers
 * - Cash handling irregularities
 *
 * Uses statistical methods including:
 * - Z-score analysis for outlier detection
 * - Moving averages for trend analysis
 * - Standard deviation thresholds
 * - Pattern matching and clustering
 * - Time-series decomposition
 */

const { VipSession, DancerCheckIn, FinancialTransaction, Shift, CashDrawer, User } = require('../models');
const { Op } = require('sequelize');

class AnomalyDetectionService {
  constructor() {
    // Statistical thresholds
    this.THRESHOLDS = {
      Z_SCORE_OUTLIER: 2.5,           // Standard deviations from mean
      VARIANCE_MINOR: 2,               // Songs difference
      VARIANCE_SIGNIFICANT: 5,
      VARIANCE_CRITICAL: 8,
      COLLECTION_RATE_MIN: 95,         // Percentage
      CASH_VARIANCE_WARNING: 10,       // Dollars
      CASH_VARIANCE_CRITICAL: 50,
      PATTERN_MIN_OCCURRENCES: 3,      // Times pattern must repeat
      OUTLIER_PERCENTILE: 0.95,        // 95th percentile
    };

    // Cache for performance
    this.statsCache = new Map();
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Main anomaly detection entry point
   * Runs all detection algorithms and returns consolidated results
   */
  async detectAnomalies(clubId, options = {}) {
    const {
      period = 30, // days
      employeeId = null,
      sessionId = null,
      skipCache = false
    } = options;

    const results = {
      timestamp: new Date(),
      clubId,
      period,
      anomalies: [],
      stats: {}
    };

    try {
      // Run all detection algorithms in parallel
      const [
        songCountAnomalies,
        employeeAnomalies,
        revenueAnomalies,
        cashAnomalies,
        patternAnomalies,
        timeAnomalies
      ] = await Promise.all([
        this.detectSongCountAnomalies(clubId, period, sessionId),
        this.detectEmployeeBehaviorAnomalies(clubId, period, employeeId),
        this.detectRevenueAnomalies(clubId, period),
        this.detectCashDrawerAnomalies(clubId, period),
        this.detectPatternAnomalies(clubId, period, employeeId),
        this.detectTimeBasedAnomalies(clubId, period)
      ]);

      // Consolidate results
      results.anomalies = [
        ...songCountAnomalies,
        ...employeeAnomalies,
        ...revenueAnomalies,
        ...cashAnomalies,
        ...patternAnomalies,
        ...timeAnomalies
      ];

      // Calculate summary statistics
      results.stats = this.calculateSummaryStats(results.anomalies);

      return results;
    } catch (error) {
      console.error('[AnomalyDetection] Error detecting anomalies:', error);
      throw error;
    }
  }

  /**
   * Detect VIP song count anomalies using statistical analysis
   */
  async detectSongCountAnomalies(clubId, period, sessionId = null) {
    const anomalies = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    try {
      // Get VIP sessions with all count sources
      const where = {
        clubId,
        endedAt: { [Op.gte]: startDate },
        verificationStatus: { [Op.ne]: 'VERIFIED' } // Skip already verified
      };

      if (sessionId) where.id = sessionId;

      const sessions = await VipSession.findAll({
        where,
        include: [
          { model: User, as: 'startedBy', attributes: ['id', 'name', 'email', 'role'] },
          { model: User, as: 'endedBy', attributes: ['id', 'name', 'email', 'role'] }
        ],
        order: [['endedAt', 'DESC']]
      });

      if (sessions.length === 0) return anomalies;

      // Calculate baseline statistics from all sessions
      const stats = this.calculateSongCountStats(sessions);

      // Analyze each session
      for (const session of sessions) {
        const analysis = this.analyzeSongCountSession(session, stats);

        if (analysis.isAnomaly) {
          anomalies.push({
            type: 'VIP_SONG_MISMATCH',
            severity: analysis.severity,
            sessionId: session.id,
            entityType: 'VipSession',
            entityId: session.id,
            title: `Song Count Variance: ${analysis.varianceType}`,
            message: analysis.message,
            details: {
              sessionId: session.id,
              boothName: session.boothName,
              dancerName: session.dancerName,
              duration: session.duration,
              songCountManual: session.songCountManual,
              songCountDjSync: session.songCountDjSync,
              songCountByTime: session.songCountByTime,
              songCountFinal: session.songCountFinal,
              variance: analysis.variance,
              zScore: analysis.zScore,
              percentile: analysis.percentile,
              vipHostId: session.startedById,
              vipHostName: session.startedBy?.name,
              overridden: !!session.overrideById,
              overrideReason: session.overrideReason
            },
            confidence: analysis.confidence,
            recommendedAction: analysis.recommendedAction
          });
        }
      }

      return anomalies;
    } catch (error) {
      console.error('[AnomalyDetection] Song count analysis error:', error);
      return [];
    }
  }

  /**
   * Analyze individual session for song count anomalies
   */
  analyzeSongCountSession(session, baselineStats) {
    const variance = Math.abs(session.songCountFinal - session.songCountByTime);
    const zScore = (variance - baselineStats.meanVariance) / baselineStats.stdDevVariance;
    const percentile = this.calculatePercentile(variance, baselineStats.allVariances);

    let severity = 'LOW';
    let isAnomaly = false;
    let varianceType = 'Normal';
    let confidence = 0;
    let recommendedAction = 'Monitor';

    // Critical variance
    if (variance > this.THRESHOLDS.VARIANCE_CRITICAL || zScore > this.THRESHOLDS.Z_SCORE_OUTLIER + 1) {
      severity = 'CRITICAL';
      isAnomaly = true;
      varianceType = 'Critical Mismatch';
      confidence = 0.95;
      recommendedAction = 'Immediate investigation required - possible fraud';
    }
    // Significant variance
    else if (variance > this.THRESHOLDS.VARIANCE_SIGNIFICANT || zScore > this.THRESHOLDS.Z_SCORE_OUTLIER) {
      severity = 'HIGH';
      isAnomaly = true;
      varianceType = 'Significant Variance';
      confidence = 0.85;
      recommendedAction = 'Review with VIP host and check security footage';
    }
    // Minor variance but statistically unusual
    else if (variance > this.THRESHOLDS.VARIANCE_MINOR && percentile > this.THRESHOLDS.OUTLIER_PERCENTILE) {
      severity = 'MEDIUM';
      isAnomaly = true;
      varianceType = 'Statistical Outlier';
      confidence = 0.70;
      recommendedAction = 'Flag for review if pattern emerges';
    }

    // Check for systematic manipulation patterns
    if (session.overrideById && variance > this.THRESHOLDS.VARIANCE_MINOR) {
      severity = this.escalateSeverity(severity);
      isAnomaly = true;
      confidence = Math.min(confidence + 0.10, 1.0);
      recommendedAction = 'Verify manager override authorization';
    }

    // DJ sync vs Manual large difference suggests manual entry manipulation
    if (session.songCountDjSync && Math.abs(session.songCountManual - session.songCountDjSync) > 5) {
      severity = this.escalateSeverity(severity);
      confidence = Math.min(confidence + 0.15, 1.0);
      recommendedAction = 'Manual count significantly differs from DJ system - investigate';
    }

    const message = this.buildSongCountMessage(session, variance, zScore, varianceType);

    return {
      isAnomaly,
      severity,
      varianceType,
      variance,
      zScore,
      percentile,
      confidence,
      message,
      recommendedAction
    };
  }

  /**
   * Calculate baseline statistics for song count analysis
   */
  calculateSongCountStats(sessions) {
    const variances = sessions.map(s =>
      Math.abs(s.songCountFinal - s.songCountByTime)
    ).filter(v => !isNaN(v));

    const meanVariance = this.mean(variances);
    const stdDevVariance = this.standardDeviation(variances, meanVariance);

    return {
      totalSessions: sessions.length,
      meanVariance,
      stdDevVariance,
      allVariances: variances
    };
  }

  /**
   * Detect employee behavior anomalies
   */
  async detectEmployeeBehaviorAnomalies(clubId, period, employeeId = null) {
    const anomalies = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    try {
      // Get all employees (or specific employee)
      const employeeWhere = { clubId };
      if (employeeId) employeeWhere.id = employeeId;

      const employees = await User.findAll({
        where: employeeWhere,
        attributes: ['id', 'name', 'email', 'role']
      });

      for (const employee of employees) {
        const employeeAnalysis = await this.analyzeEmployeePerformance(employee, clubId, startDate);

        if (employeeAnalysis.anomalies.length > 0) {
          anomalies.push(...employeeAnalysis.anomalies);
        }
      }

      return anomalies;
    } catch (error) {
      console.error('[AnomalyDetection] Employee behavior analysis error:', error);
      return [];
    }
  }

  /**
   * Analyze individual employee performance
   */
  async analyzeEmployeePerformance(employee, clubId, startDate) {
    const anomalies = [];

    try {
      // Get employee's VIP sessions
      const vipSessions = await VipSession.findAll({
        where: {
          clubId,
          endedAt: { [Op.gte]: startDate },
          [Op.or]: [
            { startedById: employee.id },
            { endedById: employee.id }
          ]
        }
      });

      // Get employee's check-ins (if door staff)
      const checkIns = await DancerCheckIn.findAll({
        where: {
          clubId,
          checkedInAt: { [Op.gte]: startDate },
          performedById: employee.id
        }
      });

      // Calculate metrics
      const metrics = {
        vipSessionCount: vipSessions.length,
        checkInCount: checkIns.length,
        avgVariance: 0,
        varianceTrend: 'stable',
        collectionRate: 0,
        flaggedCount: 0
      };

      // VIP variance analysis
      if (vipSessions.length > 0) {
        const variances = vipSessions.map(s =>
          Math.abs(s.songCountFinal - s.songCountByTime)
        );
        metrics.avgVariance = this.mean(variances);
        metrics.varianceTrend = this.calculateTrend(vipSessions, 'variance');

        // Count flagged sessions
        metrics.flaggedCount = vipSessions.filter(s =>
          Math.abs(s.songCountFinal - s.songCountByTime) > this.THRESHOLDS.VARIANCE_SIGNIFICANT
        ).length;
      }

      // Collection rate analysis
      if (checkIns.length > 0) {
        const collected = checkIns.filter(c => c.barFeeStatus === 'PAID').length;
        metrics.collectionRate = (collected / checkIns.length) * 100;
      }

      // Detect anomalies

      // High variance employee
      if (metrics.avgVariance > 6 && vipSessions.length >= 5) {
        anomalies.push({
          type: 'PATTERN_ANOMALY',
          severity: metrics.avgVariance > 8 ? 'HIGH' : 'MEDIUM',
          entityType: 'User',
          entityId: employee.id,
          title: `High Variance Pattern: ${employee.name}`,
          message: `Employee has consistently high song count variance (avg ${metrics.avgVariance.toFixed(1)} songs) across ${vipSessions.length} sessions`,
          details: {
            employeeId: employee.id,
            employeeName: employee.name,
            employeeRole: employee.role,
            avgVariance: metrics.avgVariance,
            sessionCount: vipSessions.length,
            flaggedSessions: metrics.flaggedCount,
            trend: metrics.varianceTrend
          },
          confidence: 0.80,
          recommendedAction: 'Retrain on VIP session procedures or investigate for systematic fraud'
        });
      }

      // Worsening trend
      if (metrics.varianceTrend === 'worsening' && vipSessions.length >= 10) {
        anomalies.push({
          type: 'PATTERN_ANOMALY',
          severity: 'MEDIUM',
          entityType: 'User',
          entityId: employee.id,
          title: `Declining Performance: ${employee.name}`,
          message: `Employee's variance is increasing over time - accuracy declining`,
          details: {
            employeeId: employee.id,
            employeeName: employee.name,
            trend: metrics.varianceTrend,
            avgVariance: metrics.avgVariance,
            sessionCount: vipSessions.length
          },
          confidence: 0.75,
          recommendedAction: 'Performance review and retraining recommended'
        });
      }

      // Low collection rate
      if (metrics.collectionRate < this.THRESHOLDS.COLLECTION_RATE_MIN && checkIns.length >= 10) {
        anomalies.push({
          type: 'PATTERN_ANOMALY',
          severity: metrics.collectionRate < 90 ? 'HIGH' : 'MEDIUM',
          entityType: 'User',
          entityId: employee.id,
          title: `Low Collection Rate: ${employee.name}`,
          message: `Employee collecting bar fees at only ${metrics.collectionRate.toFixed(1)}% rate (expected ≥${this.THRESHOLDS.COLLECTION_RATE_MIN}%)`,
          details: {
            employeeId: employee.id,
            employeeName: employee.name,
            collectionRate: metrics.collectionRate,
            checkInCount: checkIns.length,
            missed: checkIns.length - checkIns.filter(c => c.barFeeStatus === 'PAID').length
          },
          confidence: 0.85,
          recommendedAction: 'Review procedures with employee - possible revenue leakage'
        });
      }

      // Multiple flagged incidents
      if (metrics.flaggedCount >= 3) {
        anomalies.push({
          type: 'PATTERN_ANOMALY',
          severity: metrics.flaggedCount >= 5 ? 'CRITICAL' : 'HIGH',
          entityType: 'User',
          entityId: employee.id,
          title: `Repeated Violations: ${employee.name}`,
          message: `Employee has ${metrics.flaggedCount} flagged incidents out of ${vipSessions.length} sessions`,
          details: {
            employeeId: employee.id,
            employeeName: employee.name,
            flaggedCount: metrics.flaggedCount,
            totalSessions: vipSessions.length,
            flaggedPercentage: ((metrics.flaggedCount / vipSessions.length) * 100).toFixed(1)
          },
          confidence: 0.90,
          recommendedAction: metrics.flaggedCount >= 5
            ? 'Immediate disciplinary review - possible intentional fraud'
            : 'Formal warning and mandatory retraining'
        });
      }

      return { employee, metrics, anomalies };
    } catch (error) {
      console.error('[AnomalyDetection] Employee analysis error:', error);
      return { employee, metrics: {}, anomalies: [] };
    }
  }

  /**
   * Detect revenue anomalies using time-series analysis
   */
  async detectRevenueAnomalies(clubId, period) {
    const anomalies = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    try {
      // Get daily revenue totals
      const transactions = await FinancialTransaction.findAll({
        where: {
          clubId,
          createdAt: { [Op.gte]: startDate }
        },
        attributes: ['amount', 'paymentMethod', 'sourceType', 'createdAt'],
        order: [['createdAt', 'ASC']]
      });

      if (transactions.length < 7) return anomalies; // Need at least a week of data

      // Group by day
      const dailyRevenue = this.groupByDay(transactions);
      const amounts = Object.values(dailyRevenue).map(d => d.total);

      // Calculate statistics
      const meanRevenue = this.mean(amounts);
      const stdDev = this.standardDeviation(amounts, meanRevenue);

      // Detect outliers
      Object.entries(dailyRevenue).forEach(([date, data]) => {
        const zScore = (data.total - meanRevenue) / stdDev;

        // Unusually low revenue day
        if (zScore < -2.0 && data.total < meanRevenue * 0.5) {
          anomalies.push({
            type: 'REVENUE_ANOMALY',
            severity: zScore < -3.0 ? 'CRITICAL' : 'HIGH',
            entityType: 'Financial',
            entityId: date,
            title: `Unusually Low Revenue: ${date}`,
            message: `Revenue $${data.total.toFixed(2)} is ${Math.abs(zScore).toFixed(1)} std deviations below average of $${meanRevenue.toFixed(2)}`,
            details: {
              date,
              revenue: data.total,
              expectedRevenue: meanRevenue,
              variance: data.total - meanRevenue,
              zScore,
              transactionCount: data.count
            },
            confidence: 0.85,
            recommendedAction: 'Review transactions for missing entries or system issues'
          });
        }

        // Unusually high revenue day (potential double-charging)
        if (zScore > 3.0) {
          anomalies.push({
            type: 'REVENUE_ANOMALY',
            severity: 'MEDIUM',
            entityType: 'Financial',
            entityId: date,
            title: `Unusually High Revenue: ${date}`,
            message: `Revenue $${data.total.toFixed(2)} is ${zScore.toFixed(1)} std deviations above average`,
            details: {
              date,
              revenue: data.total,
              expectedRevenue: meanRevenue,
              variance: data.total - meanRevenue,
              zScore,
              transactionCount: data.count
            },
            confidence: 0.70,
            recommendedAction: 'Verify transactions for duplicates or data entry errors'
          });
        }
      });

      return anomalies;
    } catch (error) {
      console.error('[AnomalyDetection] Revenue analysis error:', error);
      return [];
    }
  }

  /**
   * Detect cash drawer anomalies
   */
  async detectCashDrawerAnomalies(clubId, period) {
    const anomalies = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    try {
      const drawers = await CashDrawer.findAll({
        where: {
          clubId,
          closedAt: { [Op.gte]: startDate }
        },
        include: [
          { model: User, as: 'openedBy', attributes: ['id', 'name', 'role'] },
          { model: User, as: 'closedBy', attributes: ['id', 'name', 'role'] }
        ]
      });

      for (const drawer of drawers) {
        const variance = Math.abs(drawer.actualBalance - drawer.expectedBalance);

        if (variance > this.THRESHOLDS.CASH_VARIANCE_WARNING) {
          const severity = variance > this.THRESHOLDS.CASH_VARIANCE_CRITICAL ? 'CRITICAL' : 'HIGH';

          anomalies.push({
            type: 'CASH_VARIANCE',
            severity,
            entityType: 'CashDrawer',
            entityId: drawer.id,
            title: `Cash Drawer Variance: $${variance.toFixed(2)}`,
            message: `Drawer closed by ${drawer.closedBy?.name} has variance of $${variance.toFixed(2)} (${drawer.actualBalance > drawer.expectedBalance ? 'overage' : 'shortage'})`,
            details: {
              drawerId: drawer.id,
              shiftId: drawer.shiftId,
              employeeId: drawer.closedById,
              employeeName: drawer.closedBy?.name,
              openingBalance: drawer.openingBalance,
              expectedBalance: drawer.expectedBalance,
              actualBalance: drawer.actualBalance,
              variance,
              varianceType: drawer.actualBalance > drawer.expectedBalance ? 'overage' : 'shortage',
              closedAt: drawer.closedAt
            },
            confidence: 0.95,
            recommendedAction: variance > this.THRESHOLDS.CASH_VARIANCE_CRITICAL
              ? 'Immediate investigation - count cash again and review all transactions'
              : 'Document variance and review with employee'
          });
        }
      }

      return anomalies;
    } catch (error) {
      console.error('[AnomalyDetection] Cash drawer analysis error:', error);
      return [];
    }
  }

  /**
   * Detect repeating patterns that indicate systematic fraud
   */
  async detectPatternAnomalies(clubId, period, employeeId = null) {
    const anomalies = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    try {
      // Look for repeating variance patterns by employee
      const sessions = await VipSession.findAll({
        where: {
          clubId,
          endedAt: { [Op.gte]: startDate },
          ...(employeeId && { startedById: employeeId })
        },
        include: [
          { model: User, as: 'startedBy', attributes: ['id', 'name'] }
        ],
        order: [['endedAt', 'ASC']]
      });

      // Group by employee
      const byEmployee = {};
      sessions.forEach(session => {
        const empId = session.startedById;
        if (!byEmployee[empId]) {
          byEmployee[empId] = {
            employee: session.startedBy,
            sessions: []
          };
        }
        byEmployee[empId].sessions.push(session);
      });

      // Detect patterns
      Object.entries(byEmployee).forEach(([empId, data]) => {
        if (data.sessions.length < this.THRESHOLDS.PATTERN_MIN_OCCURRENCES) return;

        const variances = data.sessions.map(s => s.songCountFinal - s.songCountByTime);

        // Detect consistent positive bias (always over-reporting)
        const positiveCount = variances.filter(v => v > 2).length;
        if (positiveCount >= this.THRESHOLDS.PATTERN_MIN_OCCURRENCES &&
            positiveCount / variances.length > 0.7) {

          anomalies.push({
            type: 'PATTERN_DETECTED',
            severity: 'CRITICAL',
            entityType: 'User',
            entityId: empId,
            title: `Systematic Over-Reporting: ${data.employee?.name}`,
            message: `Employee consistently reports ${(positiveCount / variances.length * 100).toFixed(0)}% of sessions higher than calculated - possible systematic fraud`,
            details: {
              employeeId: empId,
              employeeName: data.employee?.name,
              totalSessions: data.sessions.length,
              overReportedCount: positiveCount,
              percentage: (positiveCount / variances.length * 100).toFixed(1),
              avgOverage: this.mean(variances.filter(v => v > 0))
            },
            confidence: 0.95,
            recommendedAction: 'Immediate investigation - strong indicator of intentional fraud'
          });
        }

        // Detect consistent rounding pattern (always rounds up)
        const roundedUp = data.sessions.filter(s =>
          s.songCountFinal > s.songCountByTime &&
          s.songCountFinal === Math.ceil(s.songCountByTime)
        ).length;

        if (roundedUp >= 5 && roundedUp / data.sessions.length > 0.8) {
          anomalies.push({
            type: 'PATTERN_DETECTED',
            severity: 'MEDIUM',
            entityType: 'User',
            entityId: empId,
            title: `Rounding Pattern: ${data.employee?.name}`,
            message: `Employee consistently rounds song counts up in ${(roundedUp / data.sessions.length * 100).toFixed(0)}% of sessions`,
            details: {
              employeeId: empId,
              employeeName: data.employee?.name,
              totalSessions: data.sessions.length,
              roundedUpCount: roundedUp
            },
            confidence: 0.75,
            recommendedAction: 'Retrain on proper rounding procedures - may indicate lack of training or intentional inflation'
          });
        }
      });

      return anomalies;
    } catch (error) {
      console.error('[AnomalyDetection] Pattern detection error:', error);
      return [];
    }
  }

  /**
   * Detect time-based anomalies (unusual activity times, duration outliers)
   */
  async detectTimeBasedAnomalies(clubId, period) {
    const anomalies = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    try {
      const sessions = await VipSession.findAll({
        where: {
          clubId,
          endedAt: { [Op.gte]: startDate }
        }
      });

      if (sessions.length < 10) return anomalies;

      // Calculate duration statistics
      const durations = sessions.map(s => s.duration).filter(d => d > 0);
      const meanDuration = this.mean(durations);
      const stdDuration = this.standardDeviation(durations, meanDuration);

      // Find duration outliers
      sessions.forEach(session => {
        if (!session.duration || session.duration === 0) return;

        const zScore = (session.duration - meanDuration) / stdDuration;

        // Unusually long session
        if (zScore > 3.0) {
          anomalies.push({
            type: 'TIME_ANOMALY',
            severity: 'MEDIUM',
            entityType: 'VipSession',
            entityId: session.id,
            title: `Unusually Long Session: ${session.duration} minutes`,
            message: `Session duration ${zScore.toFixed(1)} std deviations above average of ${meanDuration.toFixed(0)} minutes`,
            details: {
              sessionId: session.id,
              duration: session.duration,
              avgDuration: meanDuration,
              zScore,
              boothName: session.boothName,
              dancerName: session.dancerName
            },
            confidence: 0.70,
            recommendedAction: 'Verify session end time was recorded correctly'
          });
        }

        // Unusually short session
        if (session.duration < 10 && session.songCountFinal > 3) {
          anomalies.push({
            type: 'TIME_ANOMALY',
            severity: 'HIGH',
            entityType: 'VipSession',
            entityId: session.id,
            title: `Duration/Count Mismatch`,
            message: `Session only ${session.duration} minutes but charged for ${session.songCountFinal} songs`,
            details: {
              sessionId: session.id,
              duration: session.duration,
              songCount: session.songCountFinal,
              boothName: session.boothName
            },
            confidence: 0.85,
            recommendedAction: 'Verify timing - possible timer error or billing mistake'
          });
        }
      });

      return anomalies;
    } catch (error) {
      console.error('[AnomalyDetection] Time-based analysis error:', error);
      return [];
    }
  }

  // ==================== UTILITY FUNCTIONS ====================

  mean(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  standardDeviation(arr, mean) {
    if (arr.length === 0) return 0;
    const squareDiffs = arr.map(val => Math.pow(val - mean, 2));
    const avgSquareDiff = this.mean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }

  calculatePercentile(value, sortedArray) {
    const sorted = [...sortedArray].sort((a, b) => a - b);
    const index = sorted.findIndex(v => v >= value);
    return index / sorted.length;
  }

  calculateTrend(sessions, metric) {
    if (sessions.length < 5) return 'stable';

    const half = Math.floor(sessions.length / 2);
    const firstHalf = sessions.slice(0, half);
    const secondHalf = sessions.slice(half);

    const firstAvg = this.mean(firstHalf.map(s =>
      Math.abs(s.songCountFinal - s.songCountByTime)
    ));
    const secondAvg = this.mean(secondHalf.map(s =>
      Math.abs(s.songCountFinal - s.songCountByTime)
    ));

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (change > 15) return 'worsening';
    if (change < -15) return 'improving';
    return 'stable';
  }

  escalateSeverity(currentSeverity) {
    const severityOrder = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const currentIndex = severityOrder.indexOf(currentSeverity);
    return severityOrder[Math.min(currentIndex + 1, 3)];
  }

  groupByDay(transactions) {
    const grouped = {};

    transactions.forEach(txn => {
      const date = new Date(txn.createdAt).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { total: 0, count: 0 };
      }
      grouped[date].total += txn.amount;
      grouped[date].count += 1;
    });

    return grouped;
  }

  buildSongCountMessage(session, variance, zScore, varianceType) {
    let msg = `${varianceType}: VIP session has ${variance} song variance`;

    if (session.songCountDjSync) {
      msg += ` (Manual: ${session.songCountManual}, DJ: ${session.songCountDjSync}, Time: ${session.songCountByTime})`;
    } else {
      msg += ` (Manual: ${session.songCountManual}, Time: ${session.songCountByTime})`;
    }

    if (session.overrideById) {
      msg += ` - Manual override applied`;
    }

    return msg;
  }

  calculateSummaryStats(anomalies) {
    return {
      total: anomalies.length,
      bySeverity: {
        LOW: anomalies.filter(a => a.severity === 'LOW').length,
        MEDIUM: anomalies.filter(a => a.severity === 'MEDIUM').length,
        HIGH: anomalies.filter(a => a.severity === 'HIGH').length,
        CRITICAL: anomalies.filter(a => a.severity === 'CRITICAL').length
      },
      byType: anomalies.reduce((acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
      }, {}),
      avgConfidence: anomalies.length > 0
        ? this.mean(anomalies.map(a => a.confidence || 0))
        : 0
    };
  }
}

module.exports = new AnomalyDetectionService();
