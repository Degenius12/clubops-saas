const express = require('express');
const { body, validationResult } = require('express-validator');
const Dancer = require('../models/Dancer');
const { auth, authorize, requireSubscription } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dancers
// @desc    Get all dancers for club with license warnings
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const dancers = await Dancer.find({ clubId: req.user.clubId });
    
    // Add license warning flags
    const dancersWithWarnings = dancers.map(dancer => {
      const today = new Date();
      const expiryDate = new Date(dancer.license.expiryDate);
      const warningDate = new Date(expiryDate);
      warningDate.setDate(warningDate.getDate() - 14);
      
      return {
        ...dancer.toObject(),
        licenseWarning: today >= warningDate && today < expiryDate,
        licenseExpired: today >= expiryDate
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
router.get('/license-alerts', auth, async (req, res) => {
  try {
    const today = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(today.getDate() + 14);
    
    const expiringLicenses = await Dancer.find({
      clubId: req.user.clubId,
      'license.expiryDate': {
        $gte: today,
        $lte: twoWeeksFromNow
      }
    });
    
    const expiredLicenses = await Dancer.find({
      clubId: req.user.clubId,
      'license.expiryDate': { $lt: today }
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
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty(),
  body('license.number').notEmpty(),
  body('license.expiryDate').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if dancer limit is reached based on subscription
    const currentDancerCount = await Dancer.countDocuments({ 
      clubId: req.user.clubId,
      employmentStatus: 'active'
    });

    if (currentDancerCount >= req.club.limits.maxDancers) {
      return res.status(403).json({ 
        error: 'Dancer limit reached',
        message: `Your ${req.club.subscription.tier} plan allows up to ${req.club.limits.maxDancers} dancers`,
        currentCount: currentDancerCount,
        limit: req.club.limits.maxDancers
      });
    }

    const dancerData = {
      ...req.body,
      clubId: req.user.clubId
    };

    const dancer = new Dancer(dancerData);
    await dancer.save();

    res.status(201).json(dancer);
  } catch (error) {
    console.error('Add dancer error:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'License number already exists' });
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

    const dancer = await Dancer.findOne({
      _id: req.params.id,
      clubId: req.user.clubId
    });

    if (!dancer) {
      return res.status(404).json({ error: 'Dancer not found' });
    }

    // Check license status
    const today = new Date();
    if (new Date(dancer.license.expiryDate) <= today) {
      return res.status(403).json({ 
        error: 'License expired',
        message: 'Cannot check in dancer with expired license',
        licenseExpiry: dancer.license.expiryDate
      });
    }

    // Update check-in status
    dancer.currentShift = {
      isCheckedIn: true,
      checkInTime: new Date(),
      barFeePaid: req.body.barFeePaid,
      amountPaid: req.body.amountPaid || dancer.fees.standardBarFee,
      paymentMethod: req.body.paymentMethod || 'cash'
    };

    // Update financial tracking if fee was paid
    if (req.body.barFeePaid && req.body.amountPaid) {
      dancer.fees.totalFeesCollected += req.body.amountPaid;
    }

    await dancer.save();

    res.json({
      message: 'Dancer checked in successfully',
      dancer,
      checkedInAt: dancer.currentShift.checkInTime
    });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;