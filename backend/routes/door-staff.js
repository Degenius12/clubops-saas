// ClubOps - Door Staff Routes
// Handles dancer check-ins, bar fees, and cross-verification alerts

const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');
const crypto = require('crypto');

const prisma = new PrismaClient();
const router = express.Router();

// ===========================================
// DANCER CHECK-IN OPERATIONS
// ===========================================

// @route   GET /api/door-staff/checked-in
// @desc    Get all dancers currently checked in today
// @access  Private (Door Staff, Manager, Owner)
router.get('/checked-in', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkIns = await prisma.dancerCheckIn.findMany({
      where: {
        clubId: req.user.clubId,
        checkedInAt: { gte: today },
        status: { in: ['CHECKED_IN', 'CHECKED_OUT'] }
      },
      include: {
        dancer: {
          select: {
            id: true,
            stageName: true,
            legalName: true,
            photoUrl: true,
            licenseStatus: true,
            licenseExpiryDate: true,
            qrBadgeCode: true
          }
        },
        performedBy: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { checkedInAt: 'desc' }
    });

    // Separate currently present vs checked out
    const present = checkIns.filter(c => c.status === 'CHECKED_IN');
    const departed = checkIns.filter(c => c.status === 'CHECKED_OUT');

    res.json({
      currentlyPresent: present.length,
      totalCheckIns: checkIns.length,
      checkIns,
      present,
      departed
    });
  } catch (error) {
    console.error('Get checked-in dancers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/door-staff/dancer/search
// @desc    Search dancers by name or badge code
// @access  Private
router.get('/dancer/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    
    console.log('🔍 Search request:', { q, userClubId: req.user?.clubId, userId: req.user?.userId });
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const dancers = await prisma.dancer.findMany({
      where: {
        clubId: req.user.clubId,
        isActive: true,
        OR: [
          { stageName: { contains: q, mode: 'insensitive' } },
          { legalName: { contains: q, mode: 'insensitive' } },
          { qrBadgeCode: { equals: q, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        stageName: true,
        legalName: true,
        photoUrl: true,
        licenseStatus: true,
        licenseExpiryDate: true,
        qrBadgeCode: true
      },
      take: 10
    });

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dancerIds = dancers.map(d => d.id);
    const todayCheckIns = await prisma.dancerCheckIn.findMany({
      where: {
        clubId: req.user.clubId,
        dancerId: { in: dancerIds },
        checkedInAt: { gte: today },
        status: 'CHECKED_IN'
      },
      select: { dancerId: true }
    });

    const checkedInIds = new Set(todayCheckIns.map(c => c.dancerId));

    const results = dancers.map(d => ({
      ...d,
      isCheckedIn: checkedInIds.has(d.id),
      licenseWarning: d.licenseExpiryDate && 
        new Date(d.licenseExpiryDate) <= new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      licenseExpired: d.licenseExpiryDate && 
        new Date(d.licenseExpiryDate) < new Date()
    }));

    res.json(results);
  } catch (error) {
    console.error('Search dancers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/door-staff/dancer/qr/:code
// @desc    Look up dancer by QR badge code
// @access  Private
router.get('/dancer/qr/:code', auth, async (req, res) => {
  try {
    const dancer = await prisma.dancer.findFirst({
      where: {
        clubId: req.user.clubId,
        qrBadgeCode: req.params.code,
        isActive: true
      },
      select: {
        id: true,
        stageName: true,
        legalName: true,
        photoUrl: true,
        licenseStatus: true,
        licenseExpiryDate: true,
        qrBadgeCode: true
      }
    });

    if (!dancer) {
      return res.status(404).json({ error: 'Dancer not found with this badge code' });
    }

    // Check if already checked in
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingCheckIn = await prisma.dancerCheckIn.findFirst({
      where: {
        clubId: req.user.clubId,
        dancerId: dancer.id,
        checkedInAt: { gte: today },
        status: 'CHECKED_IN'
      }
    });

    res.json({
      ...dancer,
      isCheckedIn: !!existingCheckIn,
      licenseWarning: dancer.licenseExpiryDate && 
        new Date(dancer.licenseExpiryDate) <= new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      licenseExpired: dancer.licenseExpiryDate && 
        new Date(dancer.licenseExpiryDate) < new Date()
    });
  } catch (error) {
    console.error('QR lookup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/door-staff/checkin
// @desc    Check in a dancer with bar fee
// @access  Private (Door Staff, Manager, Owner)
router.post('/checkin', [
  auth,
  body('dancerId').notEmpty().isUUID(),
  body('checkInMethod').isIn(['QR_SCAN', 'NAME_SEARCH', 'ID_SCAN']),
  body('barFeeStatus').isIn(['PAID', 'DEFERRED', 'WAIVED']),
  body('paymentMethod').optional().isIn(['CASH', 'CARD'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { dancerId, checkInMethod, barFeeStatus, paymentMethod, notes, waivedReason } = req.body;

    // Get dancer details
    const dancer = await prisma.dancer.findFirst({
      where: {
        id: dancerId,
        clubId: req.user.clubId,
        isActive: true
      }
    });

    if (!dancer) {
      return res.status(404).json({ error: 'Dancer not found' });
    }

    // Check license status
    const licenseExpired = dancer.licenseExpiryDate && 
      new Date(dancer.licenseExpiryDate) < new Date();
    
    if (licenseExpired) {
      return res.status(403).json({
        error: 'License expired',
        message: 'Cannot check in dancer with expired license. Please update license first.',
        licenseExpiry: dancer.licenseExpiryDate
      });
    }

    // Check for duplicate check-in
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingCheckIn = await prisma.dancerCheckIn.findFirst({
      where: {
        clubId: req.user.clubId,
        dancerId,
        checkedInAt: { gte: today },
        status: 'CHECKED_IN'
      }
    });

    if (existingCheckIn) {
      // Create alert for duplicate attempt
      await prisma.verificationAlert.create({
        data: {
          clubId: req.user.clubId,
          alertType: 'DUPLICATE_CHECK_IN',
          severity: 'MEDIUM',
          entityType: 'DANCER_CHECK_IN',
          title: `Duplicate check-in attempt: ${dancer.stageName}`,
          description: `Dancer already checked in at ${existingCheckIn.checkedInAt.toLocaleTimeString()}`,
          involvedDancerId: dancerId,
          involvedUserId: req.user.id
        }
      });

      return res.status(400).json({
        error: 'Already checked in',
        message: `${dancer.stageName} is already checked in today`,
        existingCheckIn
      });
    }

    // Get club settings for bar fee amount
    const club = await prisma.club.findUnique({
      where: { id: req.user.clubId },
      select: { barFeeAmount: true }
    });

    const barFeeAmount = parseFloat(club.barFeeAmount);

    // Get active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        clubId: req.user.clubId,
        userId: req.user.id,
        status: 'ACTIVE'
      }
    });

    // License alert check
    const licenseAlert = dancer.licenseExpiryDate && 
      new Date(dancer.licenseExpiryDate) <= new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      ? 'EXPIRING_SOON' : null;

    // Create check-in record
    const checkIn = await prisma.$transaction(async (tx) => {
      const newCheckIn = await tx.dancerCheckIn.create({
        data: {
          clubId: req.user.clubId,
          dancerId,
          shiftId: activeShift?.id,
          performedById: req.user.id,
          checkInMethod,
          barFeeAmount,
          barFeeStatus,
          barFeePaidAt: barFeeStatus === 'PAID' ? new Date() : null,
          barFeeWaivedBy: barFeeStatus === 'WAIVED' ? req.user.id : null,
          barFeeWaivedReason: barFeeStatus === 'WAIVED' ? waivedReason : null,
          licenseVerified: !licenseExpired,
          licenseAlert,
          notes
        },
        include: {
          dancer: {
            select: { stageName: true, legalName: true, photoUrl: true }
          }
        }
      });

      // Create financial transaction for paid bar fees
      if (barFeeStatus === 'PAID') {
        await tx.financialTransaction.create({
          data: {
            clubId: req.user.clubId,
            dancerId,
            transactionType: 'BAR_FEE',
            category: 'BAR_FEE',
            amount: barFeeAmount,
            description: `Bar fee - ${dancer.stageName}`,
            paymentMethod: paymentMethod || 'CASH',
            status: 'PAID',
            paidAt: new Date(),
            sourceType: 'CHECK_IN',
            sourceId: newCheckIn.id,
            recordedBy: req.user.id
          }
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          clubId: req.user.clubId,
          userId: req.user.id,
          action: 'CREATE',
          entityType: 'DANCER_CHECK_IN',
          entityId: newCheckIn.id,
          newData: {
            dancerId,
            stageName: dancer.stageName,
            checkInMethod,
            barFeeAmount,
            barFeeStatus
          },
          ipAddress: req.ip,
          currentHash: crypto.createHash('sha256')
            .update(JSON.stringify({ checkInId: newCheckIn.id, timestamp: Date.now() }))
            .digest('hex')
        }
      });

      return newCheckIn;
    });

    // Emit socket event for real-time updates
    if (req.app.get('io')) {
      req.app.get('io').to(`club-${req.user.clubId}`).emit('dancer-checked-in', {
        checkIn,
        dancerId,
        stageName: dancer.stageName
      });
    }

    res.status(201).json({
      message: 'Dancer checked in successfully',
      checkIn,
      licenseAlert
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/door-staff/checkout/:checkInId
// @desc    Check out a dancer
// @access  Private
router.post('/checkout/:checkInId', auth, async (req, res) => {
  try {
    const checkIn = await prisma.dancerCheckIn.findFirst({
      where: {
        id: req.params.checkInId,
        clubId: req.user.clubId,
        status: 'CHECKED_IN'
      },
      include: {
        dancer: { select: { stageName: true } }
      }
    });

    if (!checkIn) {
      return res.status(404).json({ error: 'Check-in record not found' });
    }

    const updated = await prisma.dancerCheckIn.update({
      where: { id: req.params.checkInId },
      data: {
        status: 'CHECKED_OUT',
        checkedOutAt: new Date()
      }
    });

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').to(`club-${req.user.clubId}`).emit('dancer-checked-out', {
        checkInId: req.params.checkInId,
        dancerId: checkIn.dancerId,
        stageName: checkIn.dancer.stageName
      });
    }

    res.json({
      message: 'Dancer checked out successfully',
      checkIn: updated
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===========================================
// BAR FEE MANAGEMENT
// ===========================================

// @route   POST /api/door-staff/barfee/collect/:checkInId
// @desc    Collect deferred bar fee
// @access  Private
router.post('/barfee/collect/:checkInId', [
  auth,
  body('paymentMethod').isIn(['CASH', 'CARD'])
], async (req, res) => {
  try {
    const checkIn = await prisma.dancerCheckIn.findFirst({
      where: {
        id: req.params.checkInId,
        clubId: req.user.clubId,
        barFeeStatus: 'DEFERRED'
      },
      include: {
        dancer: { select: { stageName: true } }
      }
    });

    if (!checkIn) {
      return res.status(404).json({ 
        error: 'Check-in not found or fee already collected' 
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.dancerCheckIn.update({
        where: { id: req.params.checkInId },
        data: {
          barFeeStatus: 'PAID',
          barFeePaidAt: new Date()
        }
      });

      await tx.financialTransaction.create({
        data: {
          clubId: req.user.clubId,
          dancerId: checkIn.dancerId,
          transactionType: 'BAR_FEE',
          category: 'BAR_FEE',
          amount: checkIn.barFeeAmount,
          description: `Deferred bar fee collected - ${checkIn.dancer.stageName}`,
          paymentMethod: req.body.paymentMethod,
          status: 'PAID',
          paidAt: new Date(),
          sourceType: 'CHECK_IN',
          sourceId: checkIn.id,
          recordedBy: req.user.id
        }
      });

      return updated;
    });

    res.json({
      message: 'Bar fee collected successfully',
      checkIn: result
    });
  } catch (error) {
    console.error('Collect bar fee error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===========================================
// CROSS-VERIFICATION ALERTS
// ===========================================

// @route   GET /api/door-staff/alerts
// @desc    Get verification alerts for door staff
// @access  Private
router.get('/alerts', auth, async (req, res) => {
  try {
    const alerts = await prisma.verificationAlert.findMany({
      where: {
        clubId: req.user.clubId,
        status: { in: ['OPEN', 'ACKNOWLEDGED'] },
        alertType: {
          in: [
            'DUPLICATE_CHECK_IN',
            'LICENSE_EXPIRING',
            'LICENSE_EXPIRED',
            'DJ_QUEUE_NOT_CHECKED_IN'
          ]
        }
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 50
    });

    res.json(alerts);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/door-staff/alerts/:id/acknowledge
// @desc    Acknowledge an alert
// @access  Private
router.post('/alerts/:id/acknowledge', auth, async (req, res) => {
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

    res.json({ message: 'Alert acknowledged', alert });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/door-staff/alerts/:id/dismiss
// @desc    Dismiss an alert
// @access  Private (Manager, Owner)
router.post('/alerts/:id/dismiss', auth, authorize('MANAGER', 'OWNER'), async (req, res) => {
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
        resolution: req.body.reason || 'Dismissed by manager'
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
// SHIFT SUMMARY FOR DOOR STAFF
// ===========================================

// @route   GET /api/door-staff/summary
// @desc    Get current shift summary for door staff
// @access  Private
router.get('/summary', auth, async (req, res) => {
  try {
    // Get active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        clubId: req.user.clubId,
        userId: req.user.id,
        status: 'ACTIVE'
      },
      include: {
        cashDrawer: true,
        checkIns: true
      }
    });

    if (!activeShift) {
      return res.json({
        hasActiveShift: false,
        summary: null
      });
    }

    // Calculate stats
    const checkIns = activeShift.checkIns;
    const currentlyPresent = checkIns.filter(c => c.status === 'CHECKED_IN').length;
    const totalCheckIns = checkIns.length;
    const totalCheckOuts = checkIns.filter(c => c.status === 'CHECKED_OUT').length;

    // Calculate bar fees
    const paidCash = checkIns
      .filter(c => c.barFeeStatus === 'PAID')
      .reduce((sum, c) => sum + parseFloat(c.barFeeAmount), 0);
    const deferred = checkIns
      .filter(c => c.barFeeStatus === 'DEFERRED')
      .reduce((sum, c) => sum + parseFloat(c.barFeeAmount), 0);
    const waived = checkIns
      .filter(c => c.barFeeStatus === 'WAIVED')
      .reduce((sum, c) => sum + parseFloat(c.barFeeAmount), 0);

    // Get alert count
    const alertCount = await prisma.verificationAlert.count({
      where: {
        clubId: req.user.clubId,
        status: 'OPEN'
      }
    });

    res.json({
      hasActiveShift: true,
      shift: {
        id: activeShift.id,
        startedAt: activeShift.startedAt,
        role: activeShift.role
      },
      summary: {
        currentlyPresent,
        totalCheckIns,
        totalCheckOuts,
        barFees: {
          cash: paidCash,
          card: 0, // TODO: track payment methods separately
          deferred,
          waived,
          total: paidCash + deferred + waived
        },
        cashDrawer: activeShift.cashDrawer ? {
          openingBalance: parseFloat(activeShift.cashDrawer.openingBalance),
          currentBalance: parseFloat(activeShift.cashDrawer.openingBalance) + paidCash
        } : null,
        alertCount
      }
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
