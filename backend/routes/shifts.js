// ClubOps - Shift Management Routes
// Handles employee shifts and cash drawer management

const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// ===========================================
// SHIFT MANAGEMENT
// ===========================================

// @route   GET /api/shifts/active
// @desc    Get active shift for current user
// @access  Private
router.get('/active', auth, async (req, res) => {
  try {
    const activeShift = await prisma.shift.findFirst({
      where: {
        clubId: req.user.clubId,
        userId: req.user.id,
        status: 'ACTIVE'
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, role: true }
        },
        cashDrawer: true
      }
    });

    if (!activeShift) {
      return res.json({ hasActiveShift: false, shift: null });
    }

    res.json({ hasActiveShift: true, shift: activeShift });
  } catch (error) {
    console.error('Get active shift error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/shifts
// @desc    Get all shifts (with filters)
// @access  Private (Manager+)
router.get('/', auth, authorize('OWNER', 'MANAGER'), async (req, res) => {
  try {
    const { status, userId, startDate, endDate, limit = 50 } = req.query;

    const where = { clubId: req.user.clubId };
    
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.startedAt = {};
      if (startDate) where.startedAt.gte = new Date(startDate);
      if (endDate) where.startedAt.lte = new Date(endDate);
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        user: {
          select: { firstName: true, lastName: true, role: true, email: true }
        },
        cashDrawer: true,
        _count: {
          select: { checkIns: true, vipSessions: true }
        }
      },
      orderBy: { startedAt: 'desc' },
      take: parseInt(limit)
    });

    res.json(shifts);
  } catch (error) {
    console.error('Get shifts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/shifts/start
// @desc    Start a new shift
// @access  Private
router.post('/start', [
  auth,
  body('station').optional().isIn(['DOOR', 'VIP', 'BAR', 'DJ']),
  body('openingCashBalance').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check for existing active shift
    const existingShift = await prisma.shift.findFirst({
      where: {
        clubId: req.user.clubId,
        userId: req.user.id,
        status: 'ACTIVE'
      }
    });

    if (existingShift) {
      return res.status(400).json({
        error: 'Active shift exists',
        message: 'Please end your current shift before starting a new one',
        shift: existingShift
      });
    }

    // Create shift and cash drawer in transaction
    const result = await prisma.$transaction(async (tx) => {
      const shift = await tx.shift.create({
        data: {
          clubId: req.user.clubId,
          userId: req.user.id,
          role: req.user.role,
          status: 'ACTIVE'
        }
      });

      // Create cash drawer if opening balance provided
      let cashDrawer = null;
      if (req.body.openingCashBalance !== undefined) {
        cashDrawer = await tx.cashDrawer.create({
          data: {
            clubId: req.user.clubId,
            shiftId: shift.id,
            userId: req.user.id,
            station: req.body.station || 'DOOR',
            openingBalance: parseFloat(req.body.openingCashBalance)
          }
        });
      }

      return { shift, cashDrawer };
    });

    res.status(201).json({
      message: 'Shift started successfully',
      ...result
    });
  } catch (error) {
    console.error('Start shift error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/shifts/end
// @desc    End current active shift
// @access  Private
router.post('/end', [
  auth,
  body('closingCashBalance').optional().isNumeric(),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Find active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        clubId: req.user.clubId,
        userId: req.user.id,
        status: 'ACTIVE'
      },
      include: {
        cashDrawer: true,
        checkIns: true,
        vipSessions: true
      }
    });

    if (!activeShift) {
      return res.status(400).json({
        error: 'No active shift',
        message: 'You do not have an active shift to end'
      });
    }

    // Calculate shift summary
    const totalCheckIns = activeShift.checkIns.length;
    const totalVipSessions = activeShift.vipSessions.length;
    
    // Calculate total collected from check-ins
    const paidCheckIns = activeShift.checkIns.filter(c => c.barFeeStatus === 'PAID');
    const totalCollected = paidCheckIns.reduce((sum, c) => sum + parseFloat(c.barFeeAmount), 0);
    
    // Calculate deferred fees
    const deferredCheckIns = activeShift.checkIns.filter(c => c.barFeeStatus === 'DEFERRED');
    const totalDeferred = deferredCheckIns.reduce((sum, c) => sum + parseFloat(c.barFeeAmount), 0);

    // End shift in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update cash drawer if exists
      let cashDrawer = null;
      let variance = null;
      
      if (activeShift.cashDrawer) {
        const openingBalance = parseFloat(activeShift.cashDrawer.openingBalance);
        const closingBalance = req.body.closingCashBalance 
          ? parseFloat(req.body.closingCashBalance) 
          : null;
        
        // Calculate expected balance
        const expectedBalance = openingBalance + totalCollected;
        
        if (closingBalance !== null) {
          variance = closingBalance - expectedBalance;
        }

        cashDrawer = await tx.cashDrawer.update({
          where: { id: activeShift.cashDrawer.id },
          data: {
            closingBalance,
            closedAt: new Date(),
            expectedBalance,
            actualBalance: closingBalance,
            variance
          }
        });

        // Create variance alert if significant
        if (variance && Math.abs(variance) > 10) {
          await tx.verificationAlert.create({
            data: {
              clubId: req.user.clubId,
              alertType: 'CASH_VARIANCE',
              severity: Math.abs(variance) > 50 ? 'HIGH' : 'MEDIUM',
              entityType: 'CASH_DRAWER',
              entityId: cashDrawer.id,
              title: `Cash Drawer Variance: $${Math.abs(variance).toFixed(2)}`,
              description: `${variance > 0 ? 'Overage' : 'Shortage'} detected at shift end`,
              expectedValue: expectedBalance.toFixed(2),
              actualValue: closingBalance?.toFixed(2),
              discrepancy: variance.toFixed(2),
              involvedUserId: req.user.id
            }
          });
        }
      }

      // Update shift
      const shift = await tx.shift.update({
        where: { id: activeShift.id },
        data: {
          status: 'COMPLETED',
          endedAt: new Date(),
          totalCheckIns,
          totalVipSessions,
          totalCollected,
          totalDeferred,
          discrepancyCount: variance && Math.abs(variance) > 10 ? 1 : 0,
          notes: req.body.notes
        }
      });

      return { shift, cashDrawer, variance };
    });

    res.json({
      message: 'Shift ended successfully',
      summary: {
        totalCheckIns,
        totalVipSessions,
        totalCollected,
        totalDeferred,
        variance: result.variance
      },
      ...result
    });
  } catch (error) {
    console.error('End shift error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/shifts/:id
// @desc    Get shift details by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const shift = await prisma.shift.findFirst({
      where: {
        id: req.params.id,
        clubId: req.user.clubId
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, role: true, email: true }
        },
        cashDrawer: true,
        checkIns: {
          include: {
            dancer: { select: { stageName: true, photoUrl: true } }
          }
        },
        vipSessions: {
          include: {
            dancer: { select: { stageName: true } },
            booth: { select: { boothName: true, boothNumber: true } }
          }
        }
      }
    });

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    res.json(shift);
  } catch (error) {
    console.error('Get shift error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
