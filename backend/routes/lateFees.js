// Late Fee Management API (Feature #26)
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');
const { processLateFeeManual } = require('../jobs/lateFeeProcessor');

const prisma = new PrismaClient();
const router = express.Router();

// ============================================================================
// LATE FEE CONFIGURATION
// ============================================================================

// @route   GET /api/late-fees/config
// @desc    Get club's late fee configuration
// @access  Private (Manager+)
router.get('/config', [
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER')
], async (req, res) => {
  try {
    const { clubId } = req.user;

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        lateFeeEnabled: true,
        lateFeeAmount: true,
        lateFeeGraceDays: true,
        lateFeeFrequency: true
      }
    });

    res.json({
      success: true,
      config: club
    });

  } catch (error) {
    console.error('Error fetching late fee config:', error);
    res.status(500).json({ error: 'Failed to fetch late fee configuration' });
  }
});

// @route   PUT /api/late-fees/config
// @desc    Update club's late fee configuration
// @access  Private (Owner only)
router.put('/config', [
  auth,
  authorize('OWNER')
], async (req, res) => {
  try {
    const { clubId } = req.user;
    const { lateFeeEnabled, lateFeeAmount, lateFeeGraceDays, lateFeeFrequency } = req.body;

    // Validate inputs
    if (lateFeeAmount !== undefined && lateFeeAmount < 0) {
      return res.status(400).json({ error: 'Late fee amount cannot be negative' });
    }

    if (lateFeeGraceDays !== undefined && lateFeeGraceDays < 0) {
      return res.status(400).json({ error: 'Grace period cannot be negative' });
    }

    if (lateFeeFrequency && !['ONE_TIME', 'DAILY'].includes(lateFeeFrequency)) {
      return res.status(400).json({ error: 'Invalid late fee frequency. Must be ONE_TIME or DAILY' });
    }

    const updateData = {};
    if (lateFeeEnabled !== undefined) updateData.lateFeeEnabled = lateFeeEnabled;
    if (lateFeeAmount !== undefined) updateData.lateFeeAmount = lateFeeAmount;
    if (lateFeeGraceDays !== undefined) updateData.lateFeeGraceDays = lateFeeGraceDays;
    if (lateFeeFrequency !== undefined) updateData.lateFeeFrequency = lateFeeFrequency;

    const club = await prisma.club.update({
      where: { id: clubId },
      data: updateData,
      select: {
        lateFeeEnabled: true,
        lateFeeAmount: true,
        lateFeeGraceDays: true,
        lateFeeFrequency: true
      }
    });

    res.json({
      success: true,
      message: 'Late fee configuration updated',
      config: club
    });

  } catch (error) {
    console.error('Error updating late fee config:', error);
    res.status(500).json({ error: 'Failed to update late fee configuration' });
  }
});

// ============================================================================
// LATE FEE PROCESSING
// ============================================================================

// @route   POST /api/late-fees/process
// @desc    Manually trigger late fee processing for current club
// @access  Private (Owner, Super Manager)
router.post('/process', [
  auth,
  authorize('OWNER', 'SUPER_MANAGER')
], async (req, res) => {
  try {
    const { clubId } = req.user;

    const result = await processLateFeeManual(clubId);

    res.json({
      success: true,
      message: `Late fee processing complete. Added ${result.feesAdded} fees affecting ${result.entertainersAffected} entertainers.`,
      ...result
    });

  } catch (error) {
    console.error('Error processing late fees:', error);
    res.status(500).json({ error: error.message || 'Failed to process late fees' });
  }
});

// @route   GET /api/late-fees/preview
// @desc    Preview which entertainers would be charged late fees (without actually charging)
// @access  Private (Manager+)
router.get('/preview', [
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER')
], async (req, res) => {
  try {
    const { clubId } = req.user;

    // Get club config
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        lateFeeEnabled: true,
        lateFeeAmount: true,
        lateFeeGraceDays: true,
        lateFeeFrequency: true
      }
    });

    if (!club.lateFeeEnabled) {
      return res.json({
        success: true,
        message: 'Late fees are not enabled for this club',
        preview: []
      });
    }

    // Calculate the cutoff date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const gracePeriodDate = new Date(today);
    gracePeriodDate.setDate(gracePeriodDate.getDate() - club.lateFeeGraceDays);

    // Find all overdue pending transactions
    const overdueTransactions = await prisma.financialTransaction.findMany({
      where: {
        clubId,
        status: 'PENDING',
        dueDate: {
          lte: gracePeriodDate
        },
        NOT: {
          category: 'LATE_FEE'
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

    // Group by entertainer
    const entertainerMap = new Map();

    for (const transaction of overdueTransactions) {
      if (!transaction.entertainerId) continue;

      if (!entertainerMap.has(transaction.entertainerId)) {
        entertainerMap.set(transaction.entertainerId, {
          entertainer: transaction.entertainer,
          overdueTransactions: [],
          totalOverdue: 0
        });
      }

      const data = entertainerMap.get(transaction.entertainerId);
      data.overdueTransactions.push({
        id: transaction.id,
        amount: parseFloat(transaction.amount),
        dueDate: transaction.dueDate,
        description: transaction.description,
        category: transaction.category
      });
      data.totalOverdue += parseFloat(transaction.amount);
    }

    // Convert to array for response
    const preview = Array.from(entertainerMap.values()).map(data => ({
      entertainerId: data.entertainer.id,
      stageName: data.entertainer.stageName,
      legalName: data.entertainer.legalName,
      overdueCount: data.overdueTransactions.length,
      totalOverdue: data.totalOverdue,
      lateFeeAmount: parseFloat(club.lateFeeAmount),
      overdueTransactions: data.overdueTransactions
    }));

    res.json({
      success: true,
      config: club,
      cutoffDate: gracePeriodDate.toISOString().split('T')[0],
      preview
    });

  } catch (error) {
    console.error('Error previewing late fees:', error);
    res.status(500).json({ error: 'Failed to preview late fees' });
  }
});

// ============================================================================
// LATE FEE REPORTING
// ============================================================================

// @route   GET /api/late-fees/report
// @desc    Get report of all late fees charged
// @access  Private (Manager+)
router.get('/report', [
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER')
], async (req, res) => {
  try {
    const { clubId } = req.user;
    const { startDate, endDate, entertainerId, status } = req.query;

    const where = {
      clubId,
      category: 'LATE_FEE'
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (entertainerId) {
      where.entertainerId = entertainerId;
    }

    if (status) {
      where.status = status;
    }

    const lateFees = await prisma.financialTransaction.findMany({
      where,
      include: {
        entertainer: {
          select: {
            id: true,
            stageName: true,
            legalName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate totals
    const totals = lateFees.reduce((acc, fee) => {
      const amount = parseFloat(fee.amount);
      acc.total += amount;

      if (fee.status === 'PAID') {
        acc.paid += amount;
        acc.paidCount++;
      } else {
        acc.pending += amount;
        acc.pendingCount++;
      }

      return acc;
    }, {
      total: 0,
      paid: 0,
      pending: 0,
      paidCount: 0,
      pendingCount: 0
    });

    res.json({
      success: true,
      count: lateFees.length,
      totals,
      lateFees: lateFees.map(fee => ({
        id: fee.id,
        entertainerId: fee.entertainerId,
        stageName: fee.entertainer?.stageName,
        legalName: fee.entertainer?.legalName,
        amount: parseFloat(fee.amount),
        description: fee.description,
        status: fee.status,
        createdAt: fee.createdAt,
        paidAt: fee.paidAt
      }))
    });

  } catch (error) {
    console.error('Error fetching late fee report:', error);
    res.status(500).json({ error: 'Failed to fetch late fee report' });
  }
});

module.exports = router;
