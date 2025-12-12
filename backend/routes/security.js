// ClubOps - Security Routes (Owner Dashboard)
// Handles audit logs, anomaly detection, employee performance, and fraud prevention

const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// All routes require OWNER role
router.use(auth, authorize('OWNER'));

// ===========================================
// INTEGRITY OVERVIEW
// ===========================================

// @route   GET /api/security/integrity
// @desc    Get overall integrity metrics
// @access  Private (Owner only)
router.get('/integrity', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get VIP sessions for song count accuracy
    const vipSessions = await prisma.vipSession.findMany({
      where: {
        clubId: req.user.clubId,
        status: 'COMPLETED',
        endedAt: { gte: startDate }
      },
      select: {
        songCountManual: true,
        songCountByTime: true,
        songCountFinal: true,
        verificationStatus: true,
        customerConfirmed: true,
        customerDisputed: true
      }
    });

    // Calculate song count match percentage
    const sessionsWithTimeEstimate = vipSessions.filter(s => s.songCountByTime !== null);
    const matchingSessions = sessionsWithTimeEstimate.filter(s => 
      Math.abs((s.songCountFinal || s.songCountManual) - s.songCountByTime) <= 2
    );
    const songCountMatchPercent = sessionsWithTimeEstimate.length > 0
      ? Math.round((matchingSessions.length / sessionsWithTimeEstimate.length) * 100)
      : 100;

    // Get check-ins for compliance
    const checkIns = await prisma.dancerCheckIn.findMany({
      where: {
        clubId: req.user.clubId,
        checkedInAt: { gte: startDate }
      },
      select: {
        licenseVerified: true,
        barFeeStatus: true
      }
    });

    const verifiedCheckIns = checkIns.filter(c => c.licenseVerified);
    const checkInCompliancePercent = checkIns.length > 0
      ? Math.round((verifiedCheckIns.length / checkIns.length) * 100)
      : 100;

    // Get financial transactions for revenue accuracy
    const transactions = await prisma.financialTransaction.findMany({
      where: {
        clubId: req.user.clubId,
        createdAt: { gte: startDate },
        sourceType: { in: ['VIP_SESSION', 'CHECK_IN'] }
      },
      select: {
        amount: true,
        status: true
      }
    });

    const paidTransactions = transactions.filter(t => t.status === 'PAID');
    const revenueAccuracyPercent = transactions.length > 0
      ? Math.round((paidTransactions.length / transactions.length) * 100)
      : 100;

    // Get alert counts
    const alertCounts = await prisma.verificationAlert.groupBy({
      by: ['status'],
      where: {
        clubId: req.user.clubId,
        createdAt: { gte: startDate }
      },
      _count: { id: true }
    });

    const openAlerts = alertCounts.find(a => a.status === 'OPEN')?._count.id || 0;
    const totalAlerts = alertCounts.reduce((sum, a) => sum + a._count.id, 0);

    // Calculate overall integrity score
    const overallScore = Math.round(
      (songCountMatchPercent * 0.4) +
      (checkInCompliancePercent * 0.3) +
      (revenueAccuracyPercent * 0.3)
    );

    // Previous period comparison
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - parseInt(days));
    
    const prevSessions = await prisma.vipSession.count({
      where: {
        clubId: req.user.clubId,
        status: 'COMPLETED',
        endedAt: { gte: prevStartDate, lt: startDate },
        verificationStatus: 'VERIFIED'
      }
    });

    res.json({
      overall: {
        score: overallScore,
        status: overallScore >= 90 ? 'excellent' : overallScore >= 75 ? 'good' : overallScore >= 60 ? 'warning' : 'critical',
        trend: matchingSessions.length > prevSessions ? 'up' : matchingSessions.length < prevSessions ? 'down' : 'stable'
      },
      metrics: {
        songCountMatch: {
          score: songCountMatchPercent,
          status: songCountMatchPercent >= 90 ? 'excellent' : songCountMatchPercent >= 75 ? 'good' : 'warning',
          trend: 'stable'
        },
        checkInCompliance: {
          score: checkInCompliancePercent,
          status: checkInCompliancePercent >= 95 ? 'excellent' : checkInCompliancePercent >= 85 ? 'good' : 'warning',
          trend: 'stable'
        },
        revenueAccuracy: {
          score: revenueAccuracyPercent,
          status: revenueAccuracyPercent >= 95 ? 'excellent' : revenueAccuracyPercent >= 85 ? 'good' : 'warning',
          trend: 'stable'
        }
      },
      alerts: {
        open: openAlerts,
        total: totalAlerts
      },
      period: {
        days: parseInt(days),
        startDate,
        endDate: new Date()
      }
    });
  } catch (error) {
    console.error('Get integrity error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===========================================
// AUDIT LOG
// ===========================================

// @route   GET /api/security/audit-log
// @desc    Get audit log entries
// @access  Private (Owner only)
router.get('/audit-log', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      action, 
      entityType, 
      userId, 
      flaggedOnly,
      search,
      limit = 100 
    } = req.query;

    const where = { clubId: req.user.clubId };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (userId) where.userId = userId;
    if (flaggedOnly === 'true') where.isHighRisk = true;
    if (search) {
      where.OR = [
        { changesSummary: { contains: search, mode: 'insensitive' } }
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { firstName: true, lastName: true, role: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    // Get counts by action type
    const actionCounts = await prisma.auditLog.groupBy({
      by: ['action'],
      where: { clubId: req.user.clubId },
      _count: { id: true }
    });

    res.json({
      logs,
      summary: {
        total: logs.length,
        byAction: actionCounts.reduce((acc, a) => ({ ...acc, [a.action]: a._count.id }), {})
      }
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===========================================
// DATA COMPARISONS
// ===========================================

// @route   GET /api/security/comparisons
// @desc    Get song count comparisons (DJ vs VIP Host vs Time)
// @access  Private (Owner only)
router.get('/comparisons', async (req, res) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;
    
    const where = { 
      clubId: req.user.clubId,
      status: 'COMPLETED'
    };
    
    if (startDate || endDate) {
      where.endedAt = {};
      if (startDate) where.endedAt.gte = new Date(startDate);
      if (endDate) where.endedAt.lte = new Date(endDate);
    }

    const sessions = await prisma.vipSession.findMany({
      where,
      include: {
        booth: { select: { boothName: true, boothNumber: true } },
        dancer: { select: { stageName: true } },
        shift: {
          select: { startedAt: true }
        },
        startedBy: { select: { firstName: true, lastName: true } }
      },
      orderBy: { endedAt: 'desc' },
      take: parseInt(limit)
    });

    // Format comparisons
    const comparisons = sessions.map(s => {
      const manual = s.songCountManual || 0;
      const dj = s.songCountDjSync || null;
      const time = s.songCountByTime || 0;
      const final = s.songCountFinal || manual;

      // Calculate variance
      const maxCount = Math.max(manual, dj || manual, time);
      const minCount = Math.min(manual, dj || manual, time);
      const variance = maxCount - minCount;
      const variancePercent = maxCount > 0 ? Math.round((variance / maxCount) * 100) : 0;

      let status = 'matching';
      if (variance > 5 || variancePercent > 25) status = 'critical';
      else if (variance > 2 || variancePercent > 15) status = 'significant';
      else if (variance > 0) status = 'minor';

      return {
        id: s.id,
        date: s.endedAt,
        shift: s.shift?.startedAt,
        booth: s.booth.boothName,
        dancer: s.dancer.stageName,
        attendant: `${s.startedBy.firstName} ${s.startedBy.lastName}`,
        counts: {
          manual,
          dj,
          time,
          final
        },
        variance,
        variancePercent,
        status,
        verificationStatus: s.verificationStatus,
        customerConfirmed: s.customerConfirmed,
        customerDisputed: s.customerDisputed
      };
    });

    // Summary stats
    const matching = comparisons.filter(c => c.status === 'matching').length;
    const minor = comparisons.filter(c => c.status === 'minor').length;
    const significant = comparisons.filter(c => c.status === 'significant').length;
    const critical = comparisons.filter(c => c.status === 'critical').length;

    res.json({
      comparisons,
      summary: {
        total: comparisons.length,
        matching,
        minor,
        significant,
        critical
      }
    });
  } catch (error) {
    console.error('Get comparisons error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===========================================
// ANOMALY ALERTS
// ===========================================

// @route   GET /api/security/anomalies
// @desc    Get all anomaly alerts
// @access  Private (Owner only)
router.get('/anomalies', async (req, res) => {
  try {
    const { status, severity, alertType, limit = 100 } = req.query;

    const where = { clubId: req.user.clubId };
    
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (alertType) where.alertType = alertType;

    const alerts = await prisma.verificationAlert.findMany({
      where,
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ],
      take: parseInt(limit)
    });

    // Status summary
    const statusCounts = await prisma.verificationAlert.groupBy({
      by: ['status'],
      where: { clubId: req.user.clubId },
      _count: { id: true }
    });

    res.json({
      alerts,
      summary: statusCounts.reduce((acc, s) => ({ ...acc, [s.status]: s._count.id }), {})
    });
  } catch (error) {
    console.error('Get anomalies error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/security/anomalies/:id/investigate
// @desc    Mark alert as under investigation
// @access  Private (Owner only)
router.post('/anomalies/:id/investigate', async (req, res) => {
  try {
    const alert = await prisma.verificationAlert.update({
      where: {
        id: req.params.id,
        clubId: req.user.clubId
      },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedById: req.user.id,
        acknowledgedAt: new Date()
      }
    });

    res.json({ message: 'Alert marked for investigation', alert });
  } catch (error) {
    console.error('Investigate alert error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/security/anomalies/:id/resolve
// @desc    Resolve an alert
// @access  Private (Owner only)
router.post('/anomalies/:id/resolve', [
  body('resolution').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const alert = await prisma.verificationAlert.update({
      where: {
        id: req.params.id,
        clubId: req.user.clubId
      },
      data: {
        status: 'RESOLVED',
        resolvedById: req.user.id,
        resolvedAt: new Date(),
        resolution: req.body.resolution
      }
    });

    res.json({ message: 'Alert resolved', alert });
  } catch (error) {
    console.error('Resolve alert error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/security/anomalies/:id/dismiss
// @desc    Dismiss an alert
// @access  Private (Owner only)
router.post('/anomalies/:id/dismiss', async (req, res) => {
  try {
    const alert = await prisma.verificationAlert.update({
      where: {
        id: req.params.id,
        clubId: req.user.clubId
      },
      data: {
        status: 'DISMISSED',
        resolvedById: req.user.id,
        resolvedAt: new Date(),
        resolution: req.body.reason || 'Dismissed by owner'
      }
    });

    res.json({ message: 'Alert dismissed', alert });
  } catch (error) {
    console.error('Dismiss alert error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// ===========================================
// EMPLOYEE PERFORMANCE
// ===========================================

// @route   GET /api/security/employee-performance
// @desc    Get employee performance metrics for fraud detection
// @access  Private (Owner only)
router.get('/employee-performance', async (req, res) => {
  try {
    const { days = 30, role } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const where = { clubId: req.user.clubId, isActive: true };
    if (role) where.role = role;

    const employees = await prisma.clubUser.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        email: true,
        lastLogin: true
      }
    });

    // Get performance data for each employee
    const performanceData = await Promise.all(employees.map(async (emp) => {
      // Get shifts
      const shifts = await prisma.shift.findMany({
        where: {
          userId: emp.id,
          startedAt: { gte: startDate },
          status: 'COMPLETED'
        }
      });

      // Get VIP sessions (for VIP hosts)
      const vipSessions = await prisma.vipSession.findMany({
        where: {
          startedById: emp.id,
          endedAt: { gte: startDate },
          status: 'COMPLETED'
        }
      });

      // Calculate VIP variance
      const sessionsWithVariance = vipSessions.filter(s => s.songCountByTime !== null);
      const totalVariance = sessionsWithVariance.reduce((sum, s) => {
        return sum + Math.abs((s.songCountFinal || s.songCountManual) - s.songCountByTime);
      }, 0);
      const avgVariance = sessionsWithVariance.length > 0
        ? (totalVariance / sessionsWithVariance.length).toFixed(2)
        : 0;

      // Get check-ins (for door staff)
      const checkIns = await prisma.dancerCheckIn.findMany({
        where: {
          performedById: emp.id,
          checkedInAt: { gte: startDate }
        }
      });

      // Calculate collection rate
      const paidCheckIns = checkIns.filter(c => c.barFeeStatus === 'PAID');
      const collectionRate = checkIns.length > 0
        ? Math.round((paidCheckIns.length / checkIns.length) * 100)
        : 100;

      // Get flagged incidents
      const flaggedAlerts = await prisma.verificationAlert.count({
        where: {
          clubId: req.user.clubId,
          involvedUserId: emp.id,
          createdAt: { gte: startDate }
        }
      });

      // Calculate variance trend
      const midDate = new Date(startDate);
      midDate.setDate(midDate.getDate() + parseInt(days) / 2);
      
      const firstHalfSessions = sessionsWithVariance.filter(s => s.endedAt < midDate);
      const secondHalfSessions = sessionsWithVariance.filter(s => s.endedAt >= midDate);
      
      const firstHalfAvg = firstHalfSessions.length > 0
        ? firstHalfSessions.reduce((sum, s) => sum + Math.abs((s.songCountFinal || s.songCountManual) - s.songCountByTime), 0) / firstHalfSessions.length
        : 0;
      const secondHalfAvg = secondHalfSessions.length > 0
        ? secondHalfSessions.reduce((sum, s) => sum + Math.abs((s.songCountFinal || s.songCountManual) - s.songCountByTime), 0) / secondHalfSessions.length
        : 0;

      let varianceTrend = 'stable';
      if (secondHalfAvg < firstHalfAvg - 0.5) varianceTrend = 'improving';
      else if (secondHalfAvg > firstHalfAvg + 0.5) varianceTrend = 'worsening';

      return {
        employee: emp,
        metrics: {
          shiftsWorked: shifts.length,
          vipSessions: vipSessions.length,
          checkIns: checkIns.length,
          avgVariance: parseFloat(avgVariance),
          varianceTrend,
          collectionRate,
          flaggedIncidents: flaggedAlerts
        },
        lastShift: shifts[0]?.startedAt || null,
        status: flaggedAlerts > 5 ? 'concern' : avgVariance > 3 ? 'monitor' : 'good'
      };
    }));

    // Sort by concern level
    performanceData.sort((a, b) => {
      const statusOrder = { concern: 0, monitor: 1, good: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });

    res.json({
      employees: performanceData,
      period: {
        days: parseInt(days),
        startDate,
        endDate: new Date()
      }
    });
  } catch (error) {
    console.error('Get employee performance error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===========================================
// ANOMALY REPORTS (Statistical Analysis)
// ===========================================

// @route   GET /api/security/reports
// @desc    Get statistical anomaly reports
// @access  Private (Owner only)
router.get('/reports', async (req, res) => {
  try {
    const { startDate, endDate, analysisType, limit = 30 } = req.query;

    const where = { clubId: req.user.clubId };
    
    if (startDate || endDate) {
      where.reportDate = {};
      if (startDate) where.reportDate.gte = new Date(startDate);
      if (endDate) where.reportDate.lte = new Date(endDate);
    }
    if (analysisType) where.analysisType = analysisType;

    const reports = await prisma.anomalyReport.findMany({
      where,
      orderBy: { reportDate: 'desc' },
      take: parseInt(limit)
    });

    res.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/security/reports/:id/viewed
// @desc    Mark report as viewed by owner
// @access  Private (Owner only)
router.post('/reports/:id/viewed', async (req, res) => {
  try {
    const report = await prisma.anomalyReport.update({
      where: {
        id: req.params.id,
        clubId: req.user.clubId
      },
      data: {
        ownerViewed: true,
        ownerViewedAt: new Date()
      }
    });

    res.json({ message: 'Report marked as viewed', report });
  } catch (error) {
    console.error('Mark report viewed error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// ===========================================
// EXPORT FUNCTIONS
// ===========================================

// @route   GET /api/security/export/audit
// @desc    Export audit log data
// @access  Private (Owner only)
router.get('/export/audit', async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    const where = { clubId: req.user.clubId };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { firstName: true, lastName: true, role: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (format === 'csv') {
      // Convert to CSV
      const headers = ['Date', 'User', 'Role', 'Action', 'Entity Type', 'Entity ID', 'Changes', 'IP Address', 'Flagged'];
      const rows = logs.map(log => [
        log.createdAt.toISOString(),
        log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
        log.user?.role || '',
        log.action,
        log.entityType,
        log.entityId || '',
        log.changesSummary || '',
        log.ipAddress || '',
        log.isHighRisk ? 'YES' : ''
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-log.csv');
      return res.send(csv);
    }

    res.json({
      exportDate: new Date(),
      period: { startDate, endDate },
      recordCount: logs.length,
      data: logs
    });
  } catch (error) {
    console.error('Export audit error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/security/export/comparisons
// @desc    Export song count comparison data
// @access  Private (Owner only)
router.get('/export/comparisons', async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    const where = { 
      clubId: req.user.clubId,
      status: 'COMPLETED'
    };
    if (startDate || endDate) {
      where.endedAt = {};
      if (startDate) where.endedAt.gte = new Date(startDate);
      if (endDate) where.endedAt.lte = new Date(endDate);
    }

    const sessions = await prisma.vipSession.findMany({
      where,
      include: {
        booth: { select: { boothName: true } },
        dancer: { select: { stageName: true } },
        startedBy: { select: { firstName: true, lastName: true } }
      },
      orderBy: { endedAt: 'desc' }
    });

    if (format === 'csv') {
      const headers = ['Date', 'Booth', 'Dancer', 'Attendant', 'Manual Count', 'DJ Count', 'Time Estimate', 'Final Count', 'Variance', 'Status', 'Customer Confirmed'];
      const rows = sessions.map(s => {
        const variance = Math.abs((s.songCountFinal || s.songCountManual || 0) - (s.songCountByTime || 0));
        return [
          s.endedAt?.toISOString() || '',
          s.booth.boothName,
          s.dancer.stageName,
          `${s.startedBy.firstName} ${s.startedBy.lastName}`,
          s.songCountManual || 0,
          s.songCountDjSync || '',
          s.songCountByTime || 0,
          s.songCountFinal || 0,
          variance,
          s.verificationStatus,
          s.customerConfirmed ? 'YES' : 'NO'
        ];
      });

      const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=song-comparisons.csv');
      return res.send(csv);
    }

    res.json({
      exportDate: new Date(),
      period: { startDate, endDate },
      recordCount: sessions.length,
      data: sessions
    });
  } catch (error) {
    console.error('Export comparisons error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
