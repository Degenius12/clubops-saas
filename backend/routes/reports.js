// Reporting API (Feature #27 - Nightly Close-Out Report)
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// ============================================================================
// NIGHTLY CLOSE-OUT REPORT (Feature #27)
// ============================================================================

// @route   GET /api/reports/nightly-closeout
// @desc    Generate comprehensive nightly close-out report
// @access  Private (Manager+)
router.get('/nightly-closeout', [
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER')
], async (req, res) => {
  try {
    const { clubId } = req.user;
    const { date } = req.query;

    // Default to today if no date provided
    const reportDate = date ? new Date(date) : new Date();
    reportDate.setHours(0, 0, 0, 0);

    const endDate = new Date(reportDate);
    endDate.setHours(23, 59, 59, 999);

    // ===== SHIFT INFORMATION =====
    const shifts = await prisma.shift.findMany({
      where: {
        clubId,
        openedAt: {
          gte: reportDate,
          lte: endDate
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      },
      orderBy: {
        openedAt: 'asc'
      }
    });

    // Check if all shifts are closed
    const openShifts = shifts.filter(s => s.status === 'ACTIVE');
    const allShiftsClosed = openShifts.length === 0;

    // ===== ENTERTAINER CHECK-INS =====
    const checkIns = await prisma.entertainerCheckIn.findMany({
      where: {
        clubId,
        checkInTime: {
          gte: reportDate,
          lte: endDate
        }
      },
      include: {
        entertainer: {
          select: {
            id: true,
            stageName: true,
            legalName: true
          }
        }
      }
    });

    const totalCheckIns = checkIns.length;
    const activeCheckIns = checkIns.filter(c => c.status === 'CHECKED_IN').length;
    const completedCheckIns = checkIns.filter(c => c.status === 'CHECKED_OUT').length;

    // Calculate average shift duration
    const completedWithDuration = checkIns.filter(c =>
      c.status === 'CHECKED_OUT' && c.checkInTime && c.checkOutTime
    );

    const avgDuration = completedWithDuration.length > 0
      ? completedWithDuration.reduce((sum, c) => {
          const duration = (new Date(c.checkOutTime) - new Date(c.checkInTime)) / (1000 * 60); // minutes
          return sum + duration;
        }, 0) / completedWithDuration.length
      : 0;

    // ===== FINANCIAL SUMMARY =====
    const transactions = await prisma.financialTransaction.findMany({
      where: {
        clubId,
        createdAt: {
          gte: reportDate,
          lte: endDate
        }
      },
      include: {
        entertainer: {
          select: {
            id: true,
            stageName: true
          }
        }
      }
    });

    // Group transactions by category
    const financialSummary = transactions.reduce((acc, tx) => {
      const amount = parseFloat(tx.amount);
      const category = tx.category || 'OTHER';
      const status = tx.status;

      if (!acc[category]) {
        acc[category] = { total: 0, paid: 0, pending: 0, count: 0 };
      }

      acc[category].total += amount;
      acc[category].count++;

      if (status === 'PAID') {
        acc[category].paid += amount;
      } else if (status === 'PENDING') {
        acc[category].pending += amount;
      }

      return acc;
    }, {});

    // Calculate grand totals
    const grandTotals = Object.values(financialSummary).reduce((acc, cat) => {
      acc.total += cat.total;
      acc.paid += cat.paid;
      acc.pending += cat.pending;
      acc.count += cat.count;
      return acc;
    }, { total: 0, paid: 0, pending: 0, count: 0 });

    // ===== VIP SESSIONS =====
    const vipSessions = await prisma.vipSession.findMany({
      where: {
        clubId,
        startTime: {
          gte: reportDate,
          lte: endDate
        }
      },
      include: {
        booth: {
          select: {
            boothName: true,
            boothNumber: true
          }
        },
        entertainer: {
          select: {
            id: true,
            stageName: true
          }
        },
        items: true
      }
    });

    const vipSummary = {
      totalSessions: vipSessions.length,
      activeSessions: vipSessions.filter(s => s.status === 'ACTIVE').length,
      completedSessions: vipSessions.filter(s => s.status === 'COMPLETED').length,
      totalRevenue: vipSessions.reduce((sum, s) => sum + parseFloat(s.totalAmount || 0), 0),
      totalSongs: vipSessions.reduce((sum, s) => sum + (s.totalSongs || 0), 0),
      avgSessionDuration: 0
    };

    // Calculate average session duration
    const completedVipSessions = vipSessions.filter(s =>
      s.status === 'COMPLETED' && s.startTime && s.endTime
    );

    if (completedVipSessions.length > 0) {
      vipSummary.avgSessionDuration = completedVipSessions.reduce((sum, s) => {
        const duration = (new Date(s.endTime) - new Date(s.startTime)) / (1000 * 60); // minutes
        return sum + duration;
      }, 0) / completedVipSessions.length;
    }

    // ===== FRAUD/VERIFICATION ALERTS =====
    const verificationAlerts = await prisma.verificationAlert.findMany({
      where: {
        clubId,
        createdAt: {
          gte: reportDate,
          lte: endDate
        }
      }
    });

    const alertSummary = {
      total: verificationAlerts.length,
      critical: verificationAlerts.filter(a => a.severity === 'CRITICAL').length,
      high: verificationAlerts.filter(a => a.severity === 'HIGH').length,
      medium: verificationAlerts.filter(a => a.severity === 'MEDIUM').length,
      low: verificationAlerts.filter(a => a.severity === 'LOW').length,
      resolved: verificationAlerts.filter(a => a.status === 'RESOLVED').length,
      open: verificationAlerts.filter(a => a.status === 'OPEN').length
    };

    // ===== AUDIT LOG SUMMARY =====
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        clubId,
        timestamp: {
          gte: reportDate,
          lte: endDate
        }
      },
      select: {
        action: true,
        entityType: true
      }
    });

    const auditSummary = {
      totalActions: auditLogs.length,
      byAction: auditLogs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {}),
      byEntity: auditLogs.reduce((acc, log) => {
        acc[log.entityType] = (acc[log.entityType] || 0) + 1;
        return acc;
      }, {})
    };

    // ===== CASH DRAWER SUMMARY =====
    const cashDrawers = await prisma.cashDrawer.findMany({
      where: {
        clubId,
        OR: [
          {
            openedAt: {
              gte: reportDate,
              lte: endDate
            }
          },
          {
            closedAt: {
              gte: reportDate,
              lte: endDate
            }
          }
        ]
      },
      orderBy: {
        openedAt: 'asc'
      }
    });

    const cashSummary = {
      totalDrawers: cashDrawers.length,
      closedDrawers: cashDrawers.filter(d => d.closedAt).length,
      openDrawers: cashDrawers.filter(d => !d.closedAt).length,
      totalExpectedCash: cashDrawers.reduce((sum, d) => sum + parseFloat(d.expectedCash || 0), 0),
      totalActualCash: cashDrawers.reduce((sum, d) => sum + parseFloat(d.actualCash || 0), 0),
      totalDiscrepancies: 0
    };

    cashSummary.totalDiscrepancies = cashSummary.totalActualCash - cashSummary.totalExpectedCash;

    // ===== COMPILE REPORT =====
    const report = {
      reportDate: reportDate.toISOString().split('T')[0],
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.id,
      clubId,

      // Validation
      allShiftsClosed,
      openShiftCount: openShifts.length,
      warnings: [],

      // Shift Summary
      shifts: {
        total: shifts.length,
        open: openShifts.length,
        closed: shifts.filter(s => s.status === 'COMPLETED').length,
        shifts: shifts.map(s => ({
          id: s.id,
          level: s.shiftLevel,
          name: s.shiftName,
          openedAt: s.openedAt,
          closedAt: s.closedAt,
          status: s.status,
          openedBy: `${s.user.firstName} ${s.user.lastName}`,
          openingCash: parseFloat(s.openingCash || 0),
          closingCash: parseFloat(s.closingCash || 0)
        }))
      },

      // Entertainer Summary
      entertainers: {
        totalCheckIns,
        active: activeCheckIns,
        completed: completedCheckIns,
        avgShiftDuration: Math.round(avgDuration),
        checkIns: checkIns.map(c => ({
          id: c.id,
          stageName: c.entertainer.stageName,
          checkInTime: c.checkInTime,
          checkOutTime: c.checkOutTime,
          status: c.status,
          duration: c.checkOutTime
            ? Math.round((new Date(c.checkOutTime) - new Date(c.checkInTime)) / (1000 * 60))
            : null
        }))
      },

      // Financial Summary
      financial: {
        summary: financialSummary,
        grandTotals,
        transactionCount: transactions.length
      },

      // VIP Summary
      vip: vipSummary,

      // Alerts Summary
      alerts: alertSummary,

      // Audit Summary
      audit: auditSummary,

      // Cash Summary
      cash: cashSummary
    };

    // Add warnings
    if (!allShiftsClosed) {
      report.warnings.push(`${openShifts.length} shift(s) still open`);
    }

    if (activeCheckIns > 0) {
      report.warnings.push(`${activeCheckIns} entertainer(s) still checked in`);
    }

    if (vipSummary.activeSessions > 0) {
      report.warnings.push(`${vipSummary.activeSessions} VIP session(s) still active`);
    }

    if (cashSummary.openDrawers > 0) {
      report.warnings.push(`${cashSummary.openDrawers} cash drawer(s) still open`);
    }

    if (Math.abs(cashSummary.totalDiscrepancies) > 0.01) {
      report.warnings.push(`Cash discrepancy: $${cashSummary.totalDiscrepancies.toFixed(2)}`);
    }

    res.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Nightly close-out report error:', error);
    res.status(500).json({ error: 'Failed to generate close-out report' });
  }
});

// ============================================================================
// REPORT HISTORY
// ============================================================================

// @route   GET /api/reports/history
// @desc    Get list of previously generated reports
// @access  Private (Manager+)
router.get('/history', [
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER')
], async (req, res) => {
  try {
    const { clubId } = req.user;
    const { limit = 30 } = req.query;

    // Get unique dates from shifts
    const shifts = await prisma.shift.findMany({
      where: {
        clubId,
        status: 'COMPLETED'
      },
      select: {
        openedAt: true
      },
      orderBy: {
        openedAt: 'desc'
      },
      take: parseInt(limit) * 2 // Get more to ensure we have enough unique dates
    });

    // Extract unique dates
    const uniqueDates = [...new Set(shifts.map(s => {
      const date = new Date(s.openedAt);
      date.setHours(0, 0, 0, 0);
      return date.toISOString().split('T')[0];
    }))].slice(0, parseInt(limit));

    res.json({
      success: true,
      dates: uniqueDates.map(date => ({
        date,
        reportUrl: `/api/reports/nightly-closeout?date=${date}`
      }))
    });

  } catch (error) {
    console.error('Report history error:', error);
    res.status(500).json({ error: 'Failed to fetch report history' });
  }
});

module.exports = router;
