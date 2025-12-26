const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// ============================================================================
// FEE CALCULATION ENDPOINTS
// ============================================================================

// @route   GET /api/fees/entertainer/:entertainerId
// @desc    Get all fees owed by an entertainer (Feature #24)
// @access  Private (Manager+)
router.get('/entertainer/:entertainerId', [
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER')
], async (req, res) => {
  try {
    const { clubId } = req.user;
    const { entertainerId } = req.params;

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

    // Get all pending transactions for this entertainer
    const pendingTransactions = await prisma.financialTransaction.findMany({
      where: {
        clubId,
        entertainerId,
        status: 'PENDING'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get all paid transactions
    const paidTransactions = await prisma.financialTransaction.findMany({
      where: {
        clubId,
        entertainerId,
        status: 'PAID'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Last 20 paid transactions
    });

    // Calculate totals by category
    const calculateTotals = (transactions) => {
      return transactions.reduce((acc, tx) => {
        const amount = parseFloat(tx.amount);
        const txType = tx.transactionType.toLowerCase();

        if (txType.includes('bar_fee') || txType.includes('bar fee')) {
          acc.barFees += amount;
        } else if (txType.includes('vip') || txType.includes('house')) {
          acc.vipHouseFees += amount;
        } else if (txType.includes('late') || txType.includes('penalty')) {
          acc.lateFees += amount;
        } else if (txType.includes('tip')) {
          acc.tipOuts += amount;
        } else {
          acc.other += amount;
        }

        acc.total += amount;
        return acc;
      }, {
        barFees: 0,
        vipHouseFees: 0,
        lateFees: 0,
        tipOuts: 0,
        other: 0,
        total: 0
      });
    };

    const pending = calculateTotals(pendingTransactions);
    const paid = calculateTotals(paidTransactions);

    res.json({
      entertainerId,
      stageName: entertainer.stageName,
      legalName: entertainer.legalName,
      pending: {
        ...pending,
        transactions: pendingTransactions.map(tx => ({
          id: tx.id,
          type: tx.transactionType,
          category: tx.category,
          amount: parseFloat(tx.amount),
          description: tx.description,
          dueDate: tx.dueDate,
          createdAt: tx.createdAt
        }))
      },
      paid: {
        ...paid,
        transactions: paidTransactions.map(tx => ({
          id: tx.id,
          type: tx.transactionType,
          category: tx.category,
          amount: parseFloat(tx.amount),
          description: tx.description,
          paidAt: tx.paidAt,
          paymentMethod: tx.paymentMethod
        }))
      },
      summary: {
        totalOwed: pending.total,
        totalPaid: paid.total,
        lifetimeTotal: pending.total + paid.total
      }
    });

  } catch (error) {
    console.error('Get entertainer fees error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/fees/calculate-house-fee
// @desc    Calculate house fee for a shift (Feature #24)
// @access  Private (Manager+)
router.post('/calculate-house-fee', [
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER')
], async (req, res) => {
  try {
    const { clubId } = req.user;
    const { checkInId } = req.body;

    if (!checkInId) {
      return res.status(400).json({ error: 'checkInId is required' });
    }

    // Get the check-in record
    const checkIn = await prisma.entertainerCheckIn.findFirst({
      where: {
        id: checkInId,
        clubId
      },
      include: {
        entertainer: true
      }
    });

    if (!checkIn) {
      return res.status(404).json({ error: 'Check-in record not found' });
    }

    if (checkIn.status !== 'CHECKED_OUT') {
      return res.status(400).json({
        error: 'Cannot calculate fees for active shift. Check out entertainer first.'
      });
    }

    // Get club fee structure
    const club = await prisma.club.findUnique({
      where: { id: clubId }
    });

    // Calculate shift duration in hours
    const checkedInAt = new Date(checkIn.checkedInAt);
    const checkedOutAt = new Date(checkIn.checkedOutAt);
    const durationMs = checkedOutAt - checkedInAt;
    const durationHours = durationMs / (1000 * 60 * 60);

    // Get fee structure from club settings or use defaults
    const feeStructure = club.settings?.feeStructure || {
      type: 'flat', // 'flat', 'hourly', 'tiered'
      flatRate: 50.00,
      hourlyRate: 15.00,
      tiers: [
        { maxHours: 4, rate: 40.00 },
        { maxHours: 8, rate: 60.00 },
        { maxHours: Infinity, rate: 80.00 }
      ]
    };

    let houseFee = 0;
    let calculation = '';

    switch (feeStructure.type) {
      case 'flat':
        houseFee = feeStructure.flatRate || 50.00;
        calculation = `Flat rate: $${houseFee}`;
        break;

      case 'hourly':
        houseFee = durationHours * (feeStructure.hourlyRate || 15.00);
        calculation = `${durationHours.toFixed(2)} hours × $${feeStructure.hourlyRate} = $${houseFee.toFixed(2)}`;
        break;

      case 'tiered':
        const tier = feeStructure.tiers?.find(t => durationHours <= t.maxHours)
          || feeStructure.tiers[feeStructure.tiers.length - 1];
        houseFee = tier.rate;
        calculation = `Tiered rate for ${durationHours.toFixed(2)} hours: $${houseFee}`;
        break;

      default:
        houseFee = parseFloat(club.barFeeAmount) || 50.00;
        calculation = `Default bar fee: $${houseFee}`;
    }

    res.json({
      checkInId: checkIn.id,
      entertainerId: checkIn.entertainerId,
      stageName: checkIn.entertainer.stageName,
      shift: {
        checkedInAt,
        checkedOutAt,
        durationHours: durationHours.toFixed(2),
        durationMinutes: Math.round(durationHours * 60)
      },
      fee: {
        amount: parseFloat(houseFee.toFixed(2)),
        calculation,
        type: feeStructure.type,
        alreadyPaid: checkIn.barFeeStatus === 'PAID'
      }
    });

  } catch (error) {
    console.error('Calculate house fee error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================================
// TIP-OUT COLLECTION ENDPOINTS
// ============================================================================

// @route   POST /api/fees/collect-payment
// @desc    Collect and record entertainer tip-out/payment (Feature #25)
// @access  Private (Manager+)
router.post('/collect-payment', [
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER')
], async (req, res) => {
  try {
    const { clubId, id: managerId } = req.user;
    const {
      entertainerId,
      amount,
      paymentMethod = 'cash',
      transactionIds = [],
      notes,
      collectAll = false
    } = req.body;

    // Validation
    if (!entertainerId) {
      return res.status(400).json({ error: 'entertainerId is required' });
    }

    if (!collectAll && (!amount || amount <= 0)) {
      return res.status(400).json({ error: 'amount must be greater than 0' });
    }

    // Verify entertainer
    const entertainer = await prisma.entertainer.findFirst({
      where: {
        id: entertainerId,
        clubId
      }
    });

    if (!entertainer) {
      return res.status(404).json({ error: 'Entertainer not found' });
    }

    // Get pending transactions
    let transactionsToUpdate;

    if (collectAll) {
      // Collect all pending transactions
      transactionsToUpdate = await prisma.financialTransaction.findMany({
        where: {
          clubId,
          entertainerId,
          status: 'PENDING'
        }
      });
    } else if (transactionIds.length > 0) {
      // Collect specific transactions
      transactionsToUpdate = await prisma.financialTransaction.findMany({
        where: {
          id: { in: transactionIds },
          clubId,
          entertainerId,
          status: 'PENDING'
        }
      });
    } else {
      // Create new payment transaction
      transactionsToUpdate = [];
    }

    const now = new Date();
    const results = await prisma.$transaction(async (tx) => {
      const updated = [];
      let totalCollected = 0;

      // Update existing pending transactions
      for (const transaction of transactionsToUpdate) {
        const updatedTx = await tx.financialTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'PAID',
            paidAt: now,
            paymentMethod,
            notes: notes || transaction.notes
          }
        });
        updated.push(updatedTx);
        totalCollected += parseFloat(updatedTx.amount);
      }

      // If amount specified doesn't match existing transactions, create a new one
      if (amount && Math.abs(amount - totalCollected) > 0.01) {
        const newTx = await tx.financialTransaction.create({
          data: {
            clubId,
            entertainerId,
            transactionType: 'TIP_OUT',
            category: 'TIP_OUT',
            amount: amount,
            description: notes || `Tip-out payment from ${entertainer.stageName}`,
            paymentMethod,
            status: 'PAID',
            paidAt: now,
            recordedBy: managerId
          }
        });
        updated.push(newTx);
        totalCollected = amount;
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          clubId,
          userId: managerId,
          action: 'COLLECT_PAYMENT',
          entityType: 'FinancialTransaction',
          entityId: updated[0]?.id || 'MULTIPLE',
          oldData: { status: 'PENDING' },
          newData: {
            status: 'PAID',
            amount: totalCollected,
            paymentMethod,
            transactionCount: updated.length
          },
          ipAddress: req.ip
        }
      });

      return { updated, totalCollected };
    });

    // Emit real-time revenue update (Feature #20)
    const io = req.app.get('io');
    if (io) {
      io.to(`club-${clubId}`).emit('revenue-updated', {
        clubId,
        type: 'payment_collected',
        amount: results.totalCollected,
        entertainerId,
        stageName: entertainer.stageName,
        timestamp: now.toISOString()
      });
    }

    res.json({
      success: true,
      message: `Collected $${results.totalCollected.toFixed(2)} from ${entertainer.stageName}`,
      payment: {
        entertainerId,
        stageName: entertainer.stageName,
        amount: results.totalCollected,
        paymentMethod,
        transactionCount: results.updated.length,
        paidAt: now
      },
      transactions: results.updated.map(tx => ({
        id: tx.id,
        type: tx.transactionType,
        amount: parseFloat(tx.amount),
        status: tx.status
      }))
    });

  } catch (error) {
    console.error('Collect payment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/fees/waive
// @desc    Waive a fee with reason (Manager override)
// @access  Private (Manager+)
router.post('/waive', [
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER')
], async (req, res) => {
  try {
    const { clubId, id: managerId } = req.user;
    const { transactionId, reason } = req.body;

    if (!transactionId || !reason) {
      return res.status(400).json({ error: 'transactionId and reason are required' });
    }

    const transaction = await prisma.financialTransaction.findFirst({
      where: {
        id: transactionId,
        clubId,
        status: 'PENDING'
      },
      include: {
        entertainer: true
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Pending transaction not found' });
    }

    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      // Update transaction to WAIVED
      const updated = await tx.financialTransaction.update({
        where: { id: transactionId },
        data: {
          status: 'WAIVED',
          paidAt: now,
          notes: `WAIVED: ${reason}`
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          clubId,
          userId: managerId,
          action: 'WAIVE_FEE',
          entityType: 'FinancialTransaction',
          entityId: transactionId,
          oldData: {
            status: 'PENDING',
            amount: parseFloat(transaction.amount)
          },
          newData: {
            status: 'WAIVED',
            reason,
            waivedBy: managerId
          },
          ipAddress: req.ip,
          isHighRisk: parseFloat(transaction.amount) > 100
        }
      });

      return updated;
    });

    res.json({
      success: true,
      message: `Fee waived for ${transaction.entertainer?.stageName}`,
      transaction: {
        id: result.id,
        type: result.transactionType,
        amount: parseFloat(result.amount),
        status: result.status,
        reason
      }
    });

  } catch (error) {
    console.error('Waive fee error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================================
// FEE REPORTING ENDPOINTS
// ============================================================================

// @route   GET /api/fees/summary
// @desc    Get fee collection summary for current shift or date range
// @access  Private (Manager+)
router.get('/summary', [
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER')
], async (req, res) => {
  try {
    const { clubId } = req.user;
    const { startDate, endDate } = req.query;

    let dateFilter;
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    } else {
      // Default to today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      dateFilter = {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      };
    }

    // Get all transactions in date range
    const transactions = await prisma.financialTransaction.findMany({
      where: {
        clubId,
        ...dateFilter
      },
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

    // Calculate summary by status
    const summary = transactions.reduce((acc, tx) => {
      const amount = parseFloat(tx.amount);

      if (tx.status === 'PAID') {
        acc.collected += amount;
        acc.collectedCount += 1;
      } else if (tx.status === 'PENDING') {
        acc.pending += amount;
        acc.pendingCount += 1;
      } else if (tx.status === 'WAIVED') {
        acc.waived += amount;
        acc.waivedCount += 1;
      }

      acc.total += amount;
      acc.totalCount += 1;

      return acc;
    }, {
      collected: 0,
      collectedCount: 0,
      pending: 0,
      pendingCount: 0,
      waived: 0,
      waivedCount: 0,
      total: 0,
      totalCount: 0
    });

    // Group by entertainer
    const byEntertainer = {};
    transactions.forEach(tx => {
      if (!tx.entertainerId) return;

      if (!byEntertainer[tx.entertainerId]) {
        byEntertainer[tx.entertainerId] = {
          entertainerId: tx.entertainerId,
          stageName: tx.entertainer?.stageName || 'Unknown',
          collected: 0,
          pending: 0,
          total: 0
        };
      }

      const amount = parseFloat(tx.amount);
      if (tx.status === 'PAID') {
        byEntertainer[tx.entertainerId].collected += amount;
      } else if (tx.status === 'PENDING') {
        byEntertainer[tx.entertainerId].pending += amount;
      }
      byEntertainer[tx.entertainerId].total += amount;
    });

    res.json({
      summary,
      byEntertainer: Object.values(byEntertainer),
      dateRange: {
        startDate: startDate || 'today',
        endDate: endDate || 'today'
      }
    });

  } catch (error) {
    console.error('Fee summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/fees/pending
// @desc    Get all pending fees across all entertainers
// @access  Private (Manager+)
router.get('/pending', [
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER')
], async (req, res) => {
  try {
    const { clubId } = req.user;

    const pendingTransactions = await prisma.financialTransaction.findMany({
      where: {
        clubId,
        status: 'PENDING'
      },
      include: {
        entertainer: {
          select: {
            id: true,
            stageName: true,
            legalName: true,
            phone: true
          }
        }
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Group by entertainer
    const byEntertainer = {};
    pendingTransactions.forEach(tx => {
      if (!tx.entertainerId) return;

      if (!byEntertainer[tx.entertainerId]) {
        byEntertainer[tx.entertainerId] = {
          entertainerId: tx.entertainerId,
          stageName: tx.entertainer?.stageName || 'Unknown',
          legalName: tx.entertainer?.legalName,
          phone: tx.entertainer?.phone,
          transactions: [],
          totalOwed: 0
        };
      }

      byEntertainer[tx.entertainerId].transactions.push({
        id: tx.id,
        type: tx.transactionType,
        category: tx.category,
        amount: parseFloat(tx.amount),
        description: tx.description,
        dueDate: tx.dueDate,
        createdAt: tx.createdAt,
        isOverdue: tx.dueDate && new Date(tx.dueDate) < new Date()
      });

      byEntertainer[tx.entertainerId].totalOwed += parseFloat(tx.amount);
    });

    const entertainers = Object.values(byEntertainer);
    const totalPending = entertainers.reduce((sum, e) => sum + e.totalOwed, 0);

    res.json({
      totalPending,
      entertainerCount: entertainers.length,
      transactionCount: pendingTransactions.length,
      entertainers
    });

  } catch (error) {
    console.error('Get pending fees error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
