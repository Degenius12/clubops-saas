/**
 * Scheduled Anomaly Detection Job
 *
 * Runs statistical anomaly detection automatically at scheduled intervals
 * Creates alerts for detected anomalies
 * Can be triggered manually or via cron
 */

const { PrismaClient } = require('@prisma/client');
const anomalyDetection = require('../services/anomalyDetection');

const prisma = new PrismaClient();

class AnomalyDetectionJob {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.runCount = 0;
    this.stats = {
      totalAnomaliesDetected: 0,
      totalAlertsCreated: 0,
      totalClubsProcessed: 0
    };
  }

  /**
   * Run anomaly detection for all active clubs
   */
  async runForAllClubs(options = {}) {
    if (this.isRunning) {
      console.log('[AnomalyJob] Already running, skipping...');
      return { skipped: true };
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('[AnomalyJob] Starting scheduled anomaly detection...');

      // Get all active clubs
      const clubs = await prisma.club.findMany({
        where: {
          active: true,
          subscriptionStatus: { in: ['ACTIVE', 'TRIAL'] }
        },
        select: {
          id: true,
          name: true
        }
      });

      console.log(`[AnomalyJob] Processing ${clubs.length} clubs...`);

      const results = {
        startTime: new Date(startTime),
        endTime: null,
        duration: null,
        clubsProcessed: 0,
        totalAnomalies: 0,
        totalAlerts: 0,
        clubResults: []
      };

      // Process each club
      for (const club of clubs) {
        try {
          const clubResult = await this.runForClub(club.id, club.name, options);
          results.clubResults.push(clubResult);
          results.clubsProcessed++;
          results.totalAnomalies += clubResult.anomaliesDetected;
          results.totalAlerts += clubResult.alertsCreated;
        } catch (error) {
          console.error(`[AnomalyJob] Error processing club ${club.id}:`, error);
          results.clubResults.push({
            clubId: club.id,
            clubName: club.name,
            error: error.message,
            success: false
          });
        }
      }

      results.endTime = new Date();
      results.duration = Date.now() - startTime;

      // Update stats
      this.stats.totalAnomaliesDetected += results.totalAnomalies;
      this.stats.totalAlertsCreated += results.totalAlerts;
      this.stats.totalClubsProcessed += results.clubsProcessed;
      this.lastRun = results.endTime;
      this.runCount++;

      console.log(`[AnomalyJob] Completed in ${results.duration}ms. Found ${results.totalAnomalies} anomalies, created ${results.totalAlerts} alerts.`);

      return results;
    } catch (error) {
      console.error('[AnomalyJob] Fatal error:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run anomaly detection for a single club
   */
  async runForClub(clubId, clubName = null, options = {}) {
    const {
      period = 7, // Look at last 7 days by default
      createAlerts = true
    } = options;

    console.log(`[AnomalyJob] Processing club ${clubId} (${clubName || 'unknown'})...`);

    try {
      // Run anomaly detection
      const detectionResults = await anomalyDetection.detectAnomalies(clubId, {
        period,
        skipCache: true
      });

      const result = {
        clubId,
        clubName,
        timestamp: new Date(),
        period,
        anomaliesDetected: detectionResults.anomalies.length,
        anomaliesBySeverity: detectionResults.stats.bySeverity,
        anomaliesByType: detectionResults.stats.byType,
        alertsCreated: 0,
        alertsSkipped: 0,
        success: true
      };

      // Create alerts for detected anomalies
      if (createAlerts && detectionResults.anomalies.length > 0) {
        const created = [];

        for (const anomaly of detectionResults.anomalies) {
          // Check if alert already exists
          const existing = await prisma.verificationAlert.findFirst({
            where: {
              clubId,
              alertType: anomaly.type,
              entityType: anomaly.entityType,
              entityId: anomaly.entityId,
              status: { in: ['OPEN', 'ACKNOWLEDGED'] }
            }
          });

          if (!existing) {
            try {
              const alert = await prisma.verificationAlert.create({
                data: {
                  clubId,
                  alertType: anomaly.type,
                  severity: anomaly.severity,
                  status: 'OPEN',
                  title: anomaly.title,
                  message: anomaly.message,
                  entityType: anomaly.entityType,
                  entityId: anomaly.entityId,
                  details: anomaly.details || {},
                  isHighRisk: anomaly.severity === 'CRITICAL' || anomaly.severity === 'HIGH',
                  flaggedReason: anomaly.recommendedAction
                }
              });
              created.push(alert);
            } catch (error) {
              console.error(`[AnomalyJob] Error creating alert:`, error);
            }
          }
        }

        result.alertsCreated = created.length;
        result.alertsSkipped = detectionResults.anomalies.length - created.length;

        console.log(`[AnomalyJob] Club ${clubId}: ${result.anomaliesDetected} anomalies, ${result.alertsCreated} new alerts`);
      }

      return result;
    } catch (error) {
      console.error(`[AnomalyJob] Error processing club ${clubId}:`, error);
      return {
        clubId,
        clubName,
        timestamp: new Date(),
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Run detection for high-priority entities only (faster)
   */
  async runQuickScan(clubId, options = {}) {
    const {
      period = 1, // Last 24 hours
      onlyCritical = true
    } = options;

    try {
      const results = await anomalyDetection.detectAnomalies(clubId, {
        period,
        skipCache: true
      });

      // Filter to critical/high only if requested
      if (onlyCritical) {
        results.anomalies = results.anomalies.filter(a =>
          a.severity === 'CRITICAL' || a.severity === 'HIGH'
        );
      }

      // Create alerts for critical issues
      const alertsCreated = [];
      for (const anomaly of results.anomalies) {
        const existing = await prisma.verificationAlert.findFirst({
          where: {
            clubId,
            alertType: anomaly.type,
            entityId: anomaly.entityId,
            status: { in: ['OPEN', 'ACKNOWLEDGED'] }
          }
        });

        if (!existing) {
          const alert = await prisma.verificationAlert.create({
            data: {
              clubId,
              alertType: anomaly.type,
              severity: anomaly.severity,
              status: 'OPEN',
              title: anomaly.title,
              message: anomaly.message,
              entityType: anomaly.entityType,
              entityId: anomaly.entityId,
              details: anomaly.details || {},
              isHighRisk: true,
              flaggedReason: anomaly.recommendedAction
            }
          });
          alertsCreated.push(alert);
        }
      }

      return {
        clubId,
        scanType: 'quick',
        timestamp: new Date(),
        anomaliesFound: results.anomalies.length,
        alertsCreated: alertsCreated.length,
        criticalIssues: results.anomalies.filter(a => a.severity === 'CRITICAL').length,
        highIssues: results.anomalies.filter(a => a.severity === 'HIGH').length
      };
    } catch (error) {
      console.error('[AnomalyJob] Quick scan error:', error);
      throw error;
    }
  }

  /**
   * Get job statistics
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      runCount: this.runCount,
      uptime: this.lastRun ? Date.now() - this.lastRun.getTime() : null
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalAnomaliesDetected: 0,
      totalAlertsCreated: 0,
      totalClubsProcessed: 0
    };
    this.runCount = 0;
    console.log('[AnomalyJob] Statistics reset');
  }
}

// Create singleton instance
const anomalyDetectionJob = new AnomalyDetectionJob();

// Schedule automatic runs (if cron is configured)
if (process.env.ENABLE_ANOMALY_DETECTION_CRON === 'true') {
  const cron = require('node-cron');
  const schedule = process.env.ANOMALY_DETECTION_SCHEDULE || '0 */6 * * *'; // Every 6 hours by default

  console.log(`[AnomalyJob] Scheduling automatic runs: ${schedule}`);

  cron.schedule(schedule, async () => {
    console.log('[AnomalyJob] Cron trigger - starting scheduled run...');
    try {
      await anomalyDetectionJob.runForAllClubs();
    } catch (error) {
      console.error('[AnomalyJob] Cron run failed:', error);
    }
  });
}

module.exports = anomalyDetectionJob;
