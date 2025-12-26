const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// ============================================================================
// TIP-OUT DISCREPANCY TRACKING (Feature #16)
// ============================================================================

/**
 * Calculate discrepancy between reported earnings and tip-outs
 *
 * Algorithm:
 * 1. Get shift data with all financial transactions
 * 2. Calculate total earnings (VIP sessions, tips, bonuses)
 * 3. Calculate total tip-outs paid
 * 4. Compare and flag discrepancies exceeding threshold
 */

const DISCREPANCY_THRESHOLD_PERCENT = 10; // 10% variance
const DISCREPANCY_THRESHOLD_AMOUNT = 50; // $50 variance

/**
 * @route   GET /api/discrepancy/entertainer/:entertainerId
 * @desc    Get tip-out discrepancy report for specific entertainer (Feature #16)
 * @access  Private (Manager+)
 */
router.get('/entertainer/:entertainerId', [
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER')
], async (req, res) => {
  try {
    const { clubId } = req.user;
    const { entertainerId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify entertainer belongs to this club
    const entertainer = await prisma.entertainer.findFirst({
      where: {
        id: entertainerId,
        clubId
      }
    });

    if (!entertainer) {
      return res.status(404).json({ error: 'Entertainer not found' });
    }

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        checkedInAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = {
        checkedInAt: {
          gte: thirtyDaysAgo
        }
      };
    }

    // Get all check-ins for this entertainer
    const checkIns = await prisma.entertainerCheckIn.findMany({
      where: {
        clubId,
        entertainerId,
        status: 'CHECKED_OUT', // Only completed shifts
        ...dateFilter
      },
      include: {
        shift: {
          select: {
            id: true,
            shiftName: true,
            startedAt: true,
            endedAt: true
          }
        }
      },
      orderBy: {
        checkedInAt: 'desc'
      }
    });

    // Get all financial transactions for this entertainer
    const transactions = await prisma.financialTransaction.findMany({
      where: {
        clubId,
        entertainerId,
        ...(dateFilter.checkedInAt && { createdAt: dateFilter.checkedInAt })
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get VIP sessions for earnings calculation
    const vipSessions = await prisma.vipSession.findMany({
      where: {
        clubId,
        entertainerId,
        ...(dateFilter.checkedInAt && { startTime: dateFilter.checkedInAt })
      },
      select: {
        id: true,
        manualSongCount: true,
        djSongCount: true,
        songRate: true,
        totalCharge: true,
        status: true,
        startTime: true
      }
    });

    // Calculate earnings by shift
    const shiftReports = checkIns.map(checkIn => {
      const shiftTransactions = transactions.filter(tx =>
        tx.sourceId === checkIn.id ||
        (tx.createdAt >= checkIn.checkedInAt &&
         (!checkIn.checkedOutAt || tx.createdAt <= checkIn.checkedOutAt))
      );

      const shiftVipSessions = vipSessions.filter(vip =>
        vip.startTime >= checkIn.checkedInAt &&
        (!checkIn.checkedOutAt || vip.startTime <= checkIn.checkedOutAt)
      );

      // Calculate total earnings (what entertainer should report)
      const vipEarnings = shiftVipSessions.reduce((sum, vip) => {
        // Entertainer typically gets portion of VIP charge
        const vipTotal = parseFloat(vip.totalCharge || 0);
        // Assuming 70% goes to entertainer (club settings can override)
        return sum + (vipTotal * 0.7);
      }, 0);

      const tipTransactions = shiftTransactions.filter(tx =>
        tx.transactionType === 'TIP' || tx.category === 'TIP'
      );
      const tipEarnings = tipTransactions.reduce((sum, tx) =>
        sum + parseFloat(tx.amount), 0
      );

      const bonusTransactions = shiftTransactions.filter(tx =>
        tx.transactionType === 'BONUS' || tx.category === 'BONUS'
      );
      const bonusEarnings = bonusTransactions.reduce((sum, tx) =>
        sum + parseFloat(tx.amount), 0
      );

      const totalExpectedEarnings = vipEarnings + tipEarnings + bonusEarnings;

      // Calculate tip-outs (what entertainer paid to house)
      const tipOutTransactions = shiftTransactions.filter(tx =>
        tx.transactionType === 'TIP_OUT' || tx.category === 'TIP_OUT'
      );
      const totalTipOuts = tipOutTransactions.reduce((sum, tx) =>
        sum + parseFloat(tx.amount), 0
      );

      const barFeeAmount = parseFloat(checkIn.barFeeAmount || 0);
      const barFeePaid = checkIn.barFeeStatus === 'PAID';

      const totalHouseFees = barFeeAmount +
        shiftTransactions
          .filter(tx => tx.category === 'VIP_HOUSE_FEE' || tx.category === 'BAR_FEE')
          .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

      // Calculate discrepancy
      // Expected tip-out should be a percentage of earnings (e.g., 20%)
      const expectedTipOutRate = 0.20; // 20% is common industry standard
      const expectedTipOut = totalExpectedEarnings * expectedTipOutRate;
      const discrepancyAmount = Math.abs(expectedTipOut - totalTipOuts);
      const discrepancyPercent = totalExpectedEarnings > 0
        ? (discrepancyAmount / totalExpectedEarnings) * 100
        : 0;

      const isFlagged = discrepancyAmount >= DISCREPANCY_THRESHOLD_AMOUNT &&
                       discrepancyPercent >= DISCREPANCY_THRESHOLD_PERCENT;

      return {
        checkInId: checkIn.id,
        shiftId: checkIn.shiftId,
        shiftName: checkIn.shift?.shiftName || 'Unknown',
        date: checkIn.checkedInAt,
        checkedInAt: checkIn.checkedInAt,
        checkedOutAt: checkIn.checkedOutAt,
        earnings: {
          vip: vipEarnings,
          tips: tipEarnings,
          bonuses: bonusEarnings,
          total: totalExpectedEarnings
        },
        tipOuts: {
          collected: totalTipOuts,
          houseFees: totalHouseFees,
          barFee: barFeeAmount,
          barFeePaid: barFeePaid,
          total: totalTipOuts + totalHouseFees
        },
        discrepancy: {
          expected: expectedTipOut,
          actual: totalTipOuts,
          amount: discrepancyAmount,
          percent: discrepancyPercent,
          isFlagged: isFlagged,
          severity: discrepancyPercent > 25 ? 'HIGH' :
                   discrepancyPercent > 10 ? 'MEDIUM' : 'LOW'
        },
        vipSessionCount: shiftVipSessions.length,
        transactionCount: shiftTransactions.length
      };
    });

    // Calculate summary statistics
    const totalShifts = shiftReports.length;
    const flaggedShifts = shiftReports.filter(r => r.discrepancy.isFlagged).length;
    const totalEarnings = shiftReports.reduce((sum, r) => sum + r.earnings.total, 0);
    const totalTipOuts = shiftReports.reduce((sum, r) => sum + r.tipOuts.collected, 0);
    const totalDiscrepancy = shiftReports.reduce((sum, r) => sum + r.discrepancy.amount, 0);

    res.json({
      entertainer: {
        id: entertainer.id,
        stageName: entertainer.stageName,
        legalName: entertainer.legalName
      },
      dateRange: {
        startDate: startDate || 'Last 30 days',
        endDate: endDate || 'Today'
      },
      summary: {
        totalShifts,
        flaggedShifts,
        flaggedPercent: totalShifts > 0 ? (flaggedShifts / totalShifts) * 100 : 0,
        totalEarnings: totalEarnings.toFixed(2),
        totalTipOuts: totalTipOuts.toFixed(2),
        totalDiscrepancy: totalDiscrepancy.toFixed(2),
        complianceRate: totalShifts > 0
          ? ((totalShifts - flaggedShifts) / totalShifts * 100).toFixed(1)
          : 100
      },
      shifts: shiftReports.map(r => ({
        ...r,
        earnings: {
          vip: parseFloat(r.earnings.vip.toFixed(2)),
          tips: parseFloat(r.earnings.tips.toFixed(2)),
          bonuses: parseFloat(r.earnings.bonuses.toFixed(2)),
          total: parseFloat(r.earnings.total.toFixed(2))
        },
        tipOuts: {
          collected: parseFloat(r.tipOuts.collected.toFixed(2)),
          houseFees: parseFloat(r.tipOuts.houseFees.toFixed(2)),
          barFee: parseFloat(r.tipOuts.barFee.toFixed(2)),
          barFeePaid: r.tipOuts.barFeePaid,
          total: parseFloat(r.tipOuts.total.toFixed(2))
        },
        discrepancy: {
          expected: parseFloat(r.discrepancy.expected.toFixed(2)),
          actual: parseFloat(r.discrepancy.actual.toFixed(2)),
          amount: parseFloat(r.discrepancy.amount.toFixed(2)),
          percent: parseFloat(r.discrepancy.percent.toFixed(1)),
          isFlagged: r.discrepancy.isFlagged,
          severity: r.discrepancy.severity
        }
      }))
    });

  } catch (error) {
    console.error('Get entertainer discrepancy error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   GET /api/discrepancy/all
 * @desc    Get tip-out discrepancy report for all entertainers (Feature #16)
 * @access  Private (Manager+)
 */
router.get('/all', [
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER')
], async (req, res) => {
  try {
    const { clubId } = req.user;
    const { startDate, endDate, flaggedOnly = 'false' } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        checkedInAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    } else {
      // Default to last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      dateFilter = {
        checkedInAt: {
          gte: sevenDaysAgo
        }
      };
    }

    // Get all entertainers
    const entertainers = await prisma.entertainer.findMany({
      where: {
        clubId,
        isActive: true
      },
      select: {
        id: true,
        stageName: true,
        legalName: true
      }
    });

    // Get all check-ins in date range
    const checkIns = await prisma.entertainerCheckIn.findMany({
      where: {
        clubId,
        status: 'CHECKED_OUT',
        ...dateFilter
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

    // Get all transactions in date range
    const transactions = await prisma.financialTransaction.findMany({
      where: {
        clubId,
        ...(dateFilter.checkedInAt && { createdAt: dateFilter.checkedInAt })
      }
    });

    // Get all VIP sessions in date range
    const vipSessions = await prisma.vipSession.findMany({
      where: {
        clubId,
        ...(dateFilter.checkedInAt && { startTime: dateFilter.checkedInAt })
      }
    });

    // Calculate discrepancies by entertainer
    const entertainerReports = [];

    for (const entertainer of entertainers) {
      const entertainerCheckIns = checkIns.filter(c => c.entertainerId === entertainer.id);
      const entertainerTransactions = transactions.filter(t => t.entertainerId === entertainer.id);
      const entertainerVipSessions = vipSessions.filter(v => v.entertainerId === entertainer.id);

      if (entertainerCheckIns.length === 0) continue;

      // Calculate totals
      const totalEarnings = entertainerVipSessions.reduce((sum, vip) => {
        return sum + (parseFloat(vip.totalCharge || 0) * 0.7);
      }, 0) + entertainerTransactions
        .filter(tx => tx.transactionType === 'TIP' || tx.transactionType === 'BONUS')
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

      const totalTipOuts = entertainerTransactions
        .filter(tx => tx.transactionType === 'TIP_OUT')
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

      const expectedTipOut = totalEarnings * 0.20;
      const discrepancyAmount = Math.abs(expectedTipOut - totalTipOuts);
      const discrepancyPercent = totalEarnings > 0
        ? (discrepancyAmount / totalEarnings) * 100
        : 0;

      const isFlagged = discrepancyAmount >= DISCREPANCY_THRESHOLD_AMOUNT &&
                       discrepancyPercent >= DISCREPANCY_THRESHOLD_PERCENT;

      // Skip if not flagged and flaggedOnly is true
      if (flaggedOnly === 'true' && !isFlagged) continue;

      entertainerReports.push({
        entertainerId: entertainer.id,
        stageName: entertainer.stageName,
        legalName: entertainer.legalName,
        shiftCount: entertainerCheckIns.length,
        totalEarnings: parseFloat(totalEarnings.toFixed(2)),
        totalTipOuts: parseFloat(totalTipOuts.toFixed(2)),
        expectedTipOut: parseFloat(expectedTipOut.toFixed(2)),
        discrepancyAmount: parseFloat(discrepancyAmount.toFixed(2)),
        discrepancyPercent: parseFloat(discrepancyPercent.toFixed(1)),
        isFlagged: isFlagged,
        severity: discrepancyPercent > 25 ? 'HIGH' :
                 discrepancyPercent > 10 ? 'MEDIUM' : 'LOW',
        lastShiftDate: entertainerCheckIns[0]?.checkedInAt
      });
    }

    // Sort by discrepancy amount (highest first)
    entertainerReports.sort((a, b) => b.discrepancyAmount - a.discrepancyAmount);

    // Calculate overall summary
    const totalFlagged = entertainerReports.filter(r => r.isFlagged).length;
    const totalDiscrepancy = entertainerReports.reduce((sum, r) => sum + r.discrepancyAmount, 0);

    res.json({
      dateRange: {
        startDate: startDate || 'Last 7 days',
        endDate: endDate || 'Today'
      },
      summary: {
        totalEntertainers: entertainerReports.length,
        flaggedEntertainers: totalFlagged,
        totalDiscrepancy: totalDiscrepancy.toFixed(2),
        highSeverityCount: entertainerReports.filter(r => r.severity === 'HIGH').length,
        mediumSeverityCount: entertainerReports.filter(r => r.severity === 'MEDIUM').length
      },
      entertainers: entertainerReports
    });

  } catch (error) {
    console.error('Get all discrepancies error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   POST /api/discrepancy/create-alert
 * @desc    Create verification alert for tip-out discrepancy
 * @access  Private (Manager+)
 */
router.post('/create-alert', [
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER')
], async (req, res) => {
  try {
    const { clubId, id: managerId } = req.user;
    const {
      entertainerId,
      checkInId,
      expectedAmount,
      actualAmount,
      discrepancyAmount,
      notes
    } = req.body;

    if (!entertainerId || !expectedAmount || !actualAmount) {
      return res.status(400).json({
        error: 'entertainerId, expectedAmount, and actualAmount are required'
      });
    }

    const entertainer = await prisma.entertainer.findFirst({
      where: { id: entertainerId, clubId }
    });

    if (!entertainer) {
      return res.status(404).json({ error: 'Entertainer not found' });
    }

    const alert = await prisma.verificationAlert.create({
      data: {
        clubId,
        alertType: 'TIP_OUT_DISCREPANCY',
        severity: discrepancyAmount > 100 ? 'HIGH' : 'MEDIUM',
        status: 'OPEN',
        entityType: 'EntertainerCheckIn',
        entityId: checkInId,
        title: `Tip-out discrepancy for ${entertainer.stageName}`,
        description: notes || `Expected tip-out: $${expectedAmount}, Actual: $${actualAmount}, Discrepancy: $${discrepancyAmount}`,
        expectedValue: expectedAmount.toString(),
        actualValue: actualAmount.toString(),
        discrepancy: discrepancyAmount.toString(),
        involvedEntertainerId: entertainerId
      }
    });

    res.json({
      success: true,
      alert: {
        id: alert.id,
        alertType: alert.alertType,
        severity: alert.severity,
        status: alert.status,
        title: alert.title,
        description: alert.description,
        createdAt: alert.createdAt
      }
    });

  } catch (error) {
    console.error('Create discrepancy alert error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
