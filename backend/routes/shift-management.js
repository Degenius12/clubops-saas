const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

// @route   GET /api/shift-management/status
// @desc    Get current shift status
// @access  Private
router.get('/status', async (req, res) => {
  try {
    const { clubId } = req.user;

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        activeShiftId: true,
        activeShiftLevel: true,
        activeShiftName: true,
        shiftOpenedAt: true,
        shiftOpenedBy: true
      }
    });

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Get active shift details if one is open
    let activeShift = null;
    if (club.activeShiftId) {
      activeShift = await prisma.shift.findUnique({
        where: { id: club.activeShiftId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        }
      });
    }

    res.json({
      hasActiveShift: !!club.activeShiftId,
      activeShiftLevel: club.activeShiftLevel,
      activeShiftName: club.activeShiftName,
      shiftOpenedAt: club.shiftOpenedAt,
      activeShift
    });
  } catch (error) {
    console.error('Shift status error:', error);
    res.status(500).json({ error: 'Failed to get shift status' });
  }
});

// @route   POST /api/shift-management/open
// @desc    Open a new shift
// @access  Manager, Super Manager, Owner only
router.post('/open', async (req, res) => {
  try {
    const { id: userId, clubId, role } = req.user;
    const { shiftLevel, shiftName } = req.body;

    // Check role permissions
    if (!['MANAGER', 'SUPER_MANAGER', 'OWNER'].includes(role)) {
      return res.status(403).json({ error: 'Insufficient permissions to open shift' });
    }

    // Validate input
    if (!shiftLevel || !shiftName) {
      return res.status(400).json({ error: 'Shift level and name are required' });
    }

    // Check if there's already an active shift
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        activeShiftId: true,
        activeShiftLevel: true,
        activeShiftName: true
      }
    });

    if (club.activeShiftId) {
      return res.status(409).json({
        error: `Cannot open Shift Level ${shiftLevel}. Shift Level ${club.activeShiftLevel} (${club.activeShiftName}) is still active. Please close the current shift before opening a new one.`
      });
    }

    // Create new shift
    const newShift = await prisma.shift.create({
      data: {
        clubId,
        userId,
        role,
        shiftLevel,
        shiftName,
        status: 'ACTIVE'
      }
    });

    // Update club with active shift info
    await prisma.club.update({
      where: { id: clubId },
      data: {
        activeShiftId: newShift.id,
        activeShiftLevel: shiftLevel,
        activeShiftName: shiftName,
        shiftOpenedAt: new Date(),
        shiftOpenedBy: userId
      }
    });

    res.json({
      success: true,
      message: `Shift Level ${shiftLevel} (${shiftName}) opened successfully`,
      shift: newShift
    });
  } catch (error) {
    console.error('Shift open error:', error);
    res.status(500).json({ error: 'Failed to open shift' });
  }
});

// @route   POST /api/shift-management/close
// @desc    Close the active shift
// @access  Manager, Super Manager, Owner only
router.post('/close', async (req, res) => {
  try {
    const { id: userId, clubId, role } = req.user;
    const { notes, eosReport } = req.body;

    // Check role permissions
    if (!['MANAGER', 'SUPER_MANAGER', 'OWNER'].includes(role)) {
      return res.status(403).json({ error: 'Insufficient permissions to close shift' });
    }

    // Get active shift
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        activeShiftId: true,
        activeShiftLevel: true
      }
    });

    if (!club.activeShiftId) {
      return res.status(400).json({ error: 'No active shift to close' });
    }

    // Get shift transactions for summary
    const shift = await prisma.shift.findUnique({
      where: { id: club.activeShiftId },
      include: {
        checkIns: true,
        vipSessions: true
      }
    });

    // Calculate shift totals
    const totalCheckIns = shift.checkIns.length;
    const totalVipSessions = shift.vipSessions.length;

    // Get revenue for this shift
    const revenueData = await prisma.financialTransaction.aggregate({
      _sum: { amount: true },
      where: {
        clubId,
        createdAt: {
          gte: shift.startedAt
        }
      }
    });

    const totalRevenue = revenueData._sum.amount || 0;

    // Update shift with summary data
    const closedShift = await prisma.shift.update({
      where: { id: club.activeShiftId },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        closedBy: userId,
        totalCheckIns,
        totalVipSessions,
        totalRevenue,
        notes,
        eosReport: eosReport || {}
      }
    });

    // Clear active shift from club
    await prisma.club.update({
      where: { id: clubId },
      data: {
        activeShiftId: null,
        activeShiftLevel: null,
        activeShiftName: null,
        shiftOpenedAt: null,
        shiftOpenedBy: null
      }
    });

    res.json({
      success: true,
      message: `Shift Level ${club.activeShiftLevel} closed successfully`,
      shift: closedShift,
      summary: {
        totalCheckIns,
        totalVipSessions,
        totalRevenue: parseFloat(totalRevenue),
        duration: Math.round((new Date() - shift.startedAt) / (1000 * 60)) // minutes
      }
    });
  } catch (error) {
    console.error('Shift close error:', error);
    res.status(500).json({ error: 'Failed to close shift' });
  }
});

// @route   GET /api/shift-management/history
// @desc    Get shift history (filtered by role)
// @access  Private
router.get('/history', async (req, res) => {
  try {
    const { id: userId, clubId, role } = req.user;
    const { limit = 10, offset = 0 } = req.query;

    let whereClause = { clubId };

    // Role-based filtering
    if (role === 'MANAGER') {
      // Managers can only see shifts they managed
      whereClause.userId = userId;
    }
    // SUPER_MANAGER and OWNER can see all shifts

    const shifts = await prisma.shift.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            role: true
          }
        }
      },
      orderBy: { startedAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.shift.count({ where: whereClause });

    res.json({
      shifts,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Shift history error:', error);
    res.status(500).json({ error: 'Failed to get shift history' });
  }
});

// @route   GET /api/shift-management/report/:shiftId
// @desc    Get EOS report for a specific shift
// @access  Private (role-based filtering)
router.get('/report/:shiftId', async (req, res) => {
  try {
    const { id: userId, clubId, role } = req.user;
    const { shiftId } = req.params;

    const shift = await prisma.shift.findFirst({
      where: {
        id: shiftId,
        clubId
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    // Role-based access control
    if (role === 'MANAGER' && shift.userId !== userId) {
      return res.status(403).json({ error: 'You can only view reports for shifts you managed' });
    }

    res.json({
      shift,
      eosReport: shift.eosReport || {}
    });
  } catch (error) {
    console.error('Shift report error:', error);
    res.status(500).json({ error: 'Failed to get shift report' });
  }
});

module.exports = router;
