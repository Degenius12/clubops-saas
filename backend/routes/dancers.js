const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize, requireFeature } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// @route   GET /api/dancers
// @desc    Get all entertainers for club with license warnings
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const dancers = await prisma.entertainer.findMany({
      where: { clubId: req.user.clubId },
      orderBy: { stageName: 'asc' }
    });

    // Add license warning flags and format for frontend
    const dancersWithWarnings = dancers.map(dancer => {
      const today = new Date();
      const expiryDate = dancer.licenseExpiryDate ? new Date(dancer.licenseExpiryDate) : null;

      let licenseWarning = false;
      let licenseExpired = false;
      let licenseStatus = 'valid';

      if (expiryDate) {
        const warningDate = new Date(expiryDate);
        warningDate.setDate(warningDate.getDate() - 14);

        licenseWarning = today >= warningDate && today < expiryDate;
        licenseExpired = today >= expiryDate;

        if (licenseExpired) {
          licenseStatus = 'expired';
        } else if (licenseWarning) {
          licenseStatus = 'expiring';
        }
      }

      return {
        id: dancer.id,
        name: dancer.legalName,
        stage_name: dancer.stageName,
        email: dancer.email,
        phone: dancer.phone,
        license_number: dancer.licenseNumber,
        license_expiry: dancer.licenseExpiryDate,
        licenseStatus: licenseStatus,
        complianceStatus: licenseStatus,
        status: dancer.isActive ? 'active' : 'inactive',
        is_checked_in: false, // Will be determined by checking EntertainerCheckIn records
        bar_fee_paid: false,
        bar_fee_amount: 0,
        contract_signed: true,
        created_at: dancer.createdAt.toISOString(),
        updated_at: dancer.updatedAt.toISOString(),
        licenseWarning,
        licenseExpired
      };
    });

    res.json(dancersWithWarnings);
  } catch (error) {
    console.error('Get dancers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/dancers/license-alerts
// @desc    Get dancers with expiring licenses (next 2 weeks)
// @access  Private
router.get('/license-alerts', auth, requireFeature('license_compliance'), async (req, res) => {
  try {
    const today = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(today.getDate() + 14);
    
    const expiringLicenses = await prisma.entertainer.findMany({
      where: {
        clubId: req.user.clubId,
        licenseExpiryDate: {
          gte: today,
          lte: twoWeeksFromNow
        },
        isActive: true
      }
    });
    
    const expiredLicenses = await prisma.entertainer.findMany({
      where: {
        clubId: req.user.clubId,
        licenseExpiryDate: { lt: today },
        isActive: true
      }
    });
    
    res.json({
      expiring: expiringLicenses,
      expired: expiredLicenses,
      totalAlerts: expiringLicenses.length + expiredLicenses.length
    });
  } catch (error) {
    console.error('License alerts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/dancers
// @desc    Add new dancer
// @access  Private (Manager+)
router.post('/', [
  auth,
  authorize('owner', 'manager'),
  body('stageName').notEmpty().trim(),
  body('legalName').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional(),
  body('licenseNumber').optional(),
  body('licenseExpiryDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const dancerData = {
      ...req.body,
      clubId: req.user.clubId,
      licenseExpiryDate: req.body.licenseExpiryDate ? new Date(req.body.licenseExpiryDate) : null,
      licenseStatus: 'valid',
      emergencyContact: req.body.emergencyContact || {},
      preferredMusic: req.body.preferredMusic || [],
      isActive: true
    };

    const dancer = await prisma.entertainer.create({
      data: dancerData
    });

    // Format response for frontend
    res.status(201).json({
      id: dancer.id,
      name: dancer.legalName,
      stage_name: dancer.stageName,
      email: dancer.email,
      phone: dancer.phone,
      license_number: dancer.licenseNumber,
      license_expiry: dancer.licenseExpiryDate,
      licenseStatus: dancer.licenseStatus,
      complianceStatus: dancer.licenseStatus,
      status: 'active',
      is_checked_in: false,
      bar_fee_paid: false,
      bar_fee_amount: 0,
      contract_signed: true,
      created_at: dancer.createdAt.toISOString(),
      updated_at: dancer.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Add dancer error:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'License number already exists' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// @route   PUT /api/dancers/:id
// @desc    Update dancer information
// @access  Private (Manager+)
router.put('/:id', [
  auth,
  authorize('owner', 'manager'),
  body('stageName').optional().notEmpty().trim(),
  body('legalName').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('licenseExpiryDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updateData = { ...req.body };
    if (req.body.licenseExpiryDate) {
      updateData.licenseExpiryDate = new Date(req.body.licenseExpiryDate);
    }

    const dancer = await prisma.entertainer.update({
      where: {
        id: req.params.id,
        clubId: req.user.clubId
      },
      data: updateData
    });

    res.json(dancer);
  } catch (error) {
    console.error('Update dancer error:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Dancer not found' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// @route   POST /api/dancers/:id/checkin
// @desc    Check in dancer with bar fee collection
// @access  Private
router.post('/:id/checkin', [
  auth,
  body('barFeePaid').isBoolean(),
  body('amountPaid').optional().isNumeric(),
  body('paymentMethod').optional().isIn(['cash', 'card', 'deferred'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const dancer = await prisma.entertainer.findFirst({
      where: {
        id: req.params.id,
        clubId: req.user.clubId
      }
    });

    if (!dancer) {
      return res.status(404).json({ error: 'Dancer not found' });
    }

    // Check license status
    const today = new Date();
    if (dancer.licenseExpiryDate && new Date(dancer.licenseExpiryDate) <= today) {
      return res.status(403).json({ 
        error: 'License expired',
        message: 'Cannot check in dancer with expired license',
        licenseExpiry: dancer.licenseExpiryDate
      });
    }

    // Create financial transaction if bar fee is paid
    if (req.body.barFeePaid && req.body.amountPaid) {
      await prisma.financialTransaction.create({
        data: {
          clubId: req.user.clubId,
          entertainerId: dancer.id,
          transactionType: 'bar_fee',
          amount: parseFloat(req.body.amountPaid),
          description: `Bar fee for ${dancer.stageName}`,
          paymentMethod: req.body.paymentMethod || 'cash',
          isPaid: true,
          recordedBy: req.user.id
        }
      });
    }

    res.json({
      message: 'Dancer checked in successfully',
      dancer,
      checkedInAt: new Date(),
      barFeePaid: req.body.barFeePaid,
      amountPaid: req.body.amountPaid
    });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/dancers/:id/check-in
// @desc    Check in dancer (kebab-case alias)
// @access  Private
router.post('/:id/check-in', [
  auth,
  body('bar_fee_amount').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const dancer = await prisma.entertainer.findFirst({
      where: {
        id: req.params.id,
        clubId: req.user.clubId
      }
    });

    if (!dancer) {
      return res.status(404).json({ error: 'Dancer not found' });
    }

    // Check license status
    const today = new Date();
    if (dancer.licenseExpiryDate && new Date(dancer.licenseExpiryDate) <= today) {
      return res.status(403).json({
        error: 'License expired',
        message: 'Cannot check in dancer with expired license',
        licenseExpiry: dancer.licenseExpiryDate
      });
    }

    // Get current active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        clubId: req.user.clubId,
        status: 'ACTIVE'
      }
    });

    // Create check-in record
    const checkIn = await prisma.entertainerCheckIn.create({
      data: {
        clubId: req.user.clubId,
        entertainerId: dancer.id,
        shiftId: activeShift?.id || null,
        performedById: req.user.id,
        status: 'CHECKED_IN',
        checkInMethod: 'NAME_SEARCH',
        barFeeAmount: req.body.bar_fee_amount || 0,
        barFeeStatus: req.body.bar_fee_amount > 0 ? 'PAID' : 'PENDING',
        licenseVerified: true
      }
    });

    // Create financial transaction if bar fee is paid
    if (req.body.bar_fee_amount && req.body.bar_fee_amount > 0) {
      await prisma.financialTransaction.create({
        data: {
          clubId: req.user.clubId,
          entertainerId: dancer.id,
          transactionType: 'bar_fee',
          amount: parseFloat(req.body.bar_fee_amount),
          description: `Bar fee for ${dancer.stageName}`,
          paymentMethod: 'cash',
          isPaid: true,
          recordedBy: req.user.id
        }
      });
    }

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`club-${req.user.clubId}`).emit('dancer-checked-in', {
        checkIn,
        dancer
      });
    }

    res.json({
      id: dancer.id,
      name: dancer.legalName,
      stage_name: dancer.stageName,
      email: dancer.email,
      phone: dancer.phone,
      license_number: dancer.licenseNumber,
      license_expiry: dancer.licenseExpiryDate,
      status: 'active',
      is_checked_in: true,
      check_in_time: checkIn.checkedInAt.toISOString(),
      bar_fee_paid: checkIn.barFeeStatus === 'PAID',
      bar_fee_amount: parseFloat(checkIn.barFeeAmount.toString()),
      contract_signed: true,
      created_at: dancer.createdAt.toISOString(),
      updated_at: dancer.updatedAt.toISOString()
    });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/dancers/:id/check-out
// @desc    Check out dancer
// @access  Private
router.post('/:id/check-out', auth, async (req, res) => {
  try {
    const dancer = await prisma.entertainer.findFirst({
      where: {
        id: req.params.id,
        clubId: req.user.clubId
      }
    });

    if (!dancer) {
      return res.status(404).json({ error: 'Dancer not found' });
    }

    // Find the active check-in for this dancer
    const activeCheckIn = await prisma.entertainerCheckIn.findFirst({
      where: {
        entertainerId: dancer.id,
        clubId: req.user.clubId,
        status: 'CHECKED_IN'
      },
      orderBy: {
        checkedInAt: 'desc'
      }
    });

    if (!activeCheckIn) {
      return res.status(400).json({ error: 'Dancer is not currently checked in' });
    }

    const now = new Date();

    // Get club fee structure for automatic house fee calculation (Feature #24)
    const club = await prisma.club.findUnique({
      where: { id: req.user.clubId }
    });

    // Calculate shift duration
    const checkedInAt = new Date(activeCheckIn.checkedInAt);
    const durationMs = now - checkedInAt;
    const durationHours = durationMs / (1000 * 60 * 60);

    // Calculate house fee based on club settings
    const feeStructure = club.settings?.feeStructure || {
      type: 'flat',
      flatRate: 50.00
    };

    let houseFee = 0;
    switch (feeStructure.type) {
      case 'flat':
        houseFee = feeStructure.flatRate || parseFloat(club.barFeeAmount) || 50.00;
        break;
      case 'hourly':
        houseFee = durationHours * (feeStructure.hourlyRate || 15.00);
        break;
      case 'tiered':
        const tier = feeStructure.tiers?.find(t => durationHours <= t.maxHours)
          || feeStructure.tiers[feeStructure.tiers.length - 1];
        houseFee = tier.rate;
        break;
      default:
        houseFee = parseFloat(club.barFeeAmount) || 50.00;
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Update check-in status to CHECKED_OUT
      const updatedCheckIn = await tx.entertainerCheckIn.update({
        where: {
          id: activeCheckIn.id
        },
        data: {
          status: 'CHECKED_OUT',
          checkedOutAt: now
        }
      });

      // Create house fee transaction if not already paid at check-in
      let houseFeeTransaction = null;
      if (activeCheckIn.barFeeStatus !== 'PAID') {
        houseFeeTransaction = await tx.financialTransaction.create({
          data: {
            clubId: req.user.clubId,
            entertainerId: dancer.id,
            transactionType: 'HOUSE_FEE',
            category: 'HOUSE_FEE',
            amount: houseFee,
            description: `House fee for ${durationHours.toFixed(2)} hour shift - ${dancer.stageName}`,
            paymentMethod: 'PENDING',
            status: 'PENDING',
            recordedBy: req.user.id,
            sourceType: 'CHECK_OUT',
            sourceId: activeCheckIn.id
          }
        });
      }

      return { updatedCheckIn, houseFeeTransaction };
    });

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`club-${req.user.clubId}`).emit('dancer-checked-out', {
        checkIn: result.updatedCheckIn,
        dancer,
        houseFee: result.houseFeeTransaction ? parseFloat(result.houseFeeTransaction.amount) : 0
      });
    }

    res.json({
      id: dancer.id,
      name: dancer.legalName,
      stage_name: dancer.stageName,
      email: dancer.email,
      phone: dancer.phone,
      license_number: dancer.licenseNumber,
      license_expiry: dancer.licenseExpiryDate,
      status: 'inactive',
      is_checked_in: false,
      check_in_time: null,
      bar_fee_paid: result.updatedCheckIn.barFeeStatus === 'PAID',
      bar_fee_amount: parseFloat(result.updatedCheckIn.barFeeAmount.toString()),
      house_fee_calculated: result.houseFeeTransaction ? parseFloat(result.houseFeeTransaction.amount) : 0,
      house_fee_status: result.houseFeeTransaction ? 'PENDING' : 'PAID',
      shift_duration_hours: durationHours.toFixed(2),
      contract_signed: true,
      created_at: dancer.createdAt.toISOString(),
      updated_at: dancer.updatedAt.toISOString()
    });

  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/dancers/:id
// @desc    Deactivate dancer (soft delete)
// @access  Private (Manager+)
router.delete('/:id', auth, authorize('owner', 'manager'), async (req, res) => {
  try {
    const dancer = await prisma.entertainer.update({
      where: {
        id: req.params.id,
        clubId: req.user.clubId
      },
      data: { isActive: false }
    });

    res.json({ message: 'Dancer deactivated successfully' });
  } catch (error) {
    console.error('Delete dancer error:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Dancer not found' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

module.exports = router;