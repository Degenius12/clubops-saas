const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize, requireFeature } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// @route   GET /api/dancers
// @desc    Get all dancers for club with license warnings
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const dancers = await prisma.dancer.findMany({
      where: { clubId: req.user.clubId },
      orderBy: { stageName: 'asc' }
    });
    
    // Add license warning flags
    const dancersWithWarnings = dancers.map(dancer => {
      const today = new Date();
      const expiryDate = dancer.licenseExpiryDate ? new Date(dancer.licenseExpiryDate) : null;
      
      let licenseWarning = false;
      let licenseExpired = false;
      
      if (expiryDate) {
        const warningDate = new Date(expiryDate);
        warningDate.setDate(warningDate.getDate() - 14);
        
        licenseWarning = today >= warningDate && today < expiryDate;
        licenseExpired = today >= expiryDate;
      }
      
      return {
        ...dancer,
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
    
    const expiringLicenses = await prisma.dancer.findMany({
      where: {
        clubId: req.user.clubId,
        licenseExpiryDate: {
          gte: today,
          lte: twoWeeksFromNow
        },
        isActive: true
      }
    });
    
    const expiredLicenses = await prisma.dancer.findMany({
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

    const dancer = await prisma.dancer.create({
      data: dancerData
    });

    res.status(201).json(dancer);
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

    const dancer = await prisma.dancer.update({
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

    const dancer = await prisma.dancer.findFirst({
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
          dancerId: dancer.id,
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

// @route   DELETE /api/dancers/:id
// @desc    Deactivate dancer (soft delete)
// @access  Private (Manager+)
router.delete('/:id', auth, authorize('owner', 'manager'), async (req, res) => {
  try {
    const dancer = await prisma.dancer.update({
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