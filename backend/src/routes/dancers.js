// Dancer Management Routes
// Core dancer check-in, license tracking, and compliance features

const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requireRole, requireTier } = require('../middleware/auth');
const { validateResourceOwnership } = require('../middleware/multiTenant');

const router = express.Router();
const prisma = new PrismaClient();

// Get all dancers for the club
router.get('/', [
  query('status').optional().isIn(['active', 'inactive', 'all']).withMessage('Status must be active, inactive, or all'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search term too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status = 'active', search } = req.query;

    // Build where clause
    const where = { clubId: req.user.clubId };
    
    if (status !== 'all') {
      where.isActive = status === 'active';
    }

    if (search) {
      where.OR = [
        { stageName: { contains: search, mode: 'insensitive' } },
        { legalName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const dancers = await prisma.dancer.findMany({
      where,
      orderBy: { stageName: 'asc' },
      select: {
        id: true,
        stageName: true,
        legalName: true,
        phone: true,
        email: true,
        licenseNumber: true,
        licenseExpiryDate: true,
        licenseStatus: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Add license compliance status
    const currentDate = new Date();
    const twoWeeksFromNow = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    const dancersWithCompliance = dancers.map(dancer => ({
      ...dancer,
      licenseCompliance: {
        status: dancer.licenseStatus,
        isExpired: dancer.licenseExpiryDate && new Date(dancer.licenseExpiryDate) < currentDate,
        isExpiringSoon: dancer.licenseExpiryDate && 
          new Date(dancer.licenseExpiryDate) > currentDate && 
          new Date(dancer.licenseExpiryDate) < twoWeeksFromNow,
        daysUntilExpiry: dancer.licenseExpiryDate ? 
          Math.ceil((new Date(dancer.licenseExpiryDate) - currentDate) / (1000 * 60 * 60 * 24)) : null
      }
    }));

    res.json({
      dancers: dancersWithCompliance,
      total: dancers.length
    });

  } catch (error) {
    console.error('Fetch dancers error:', error);
    res.status(500).json({ error: 'Failed to fetch dancers' });
  }
});

// Get compliance alerts (licenses expiring soon or expired)
router.get('/compliance-alerts', requireTier('basic'), async (req, res) => {
  try {
    const currentDate = new Date();
    const twoWeeksFromNow = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    const alerts = await prisma.dancer.findMany({
      where: {
        clubId: req.user.clubId,
        isActive: true,
        OR: [
          {
            licenseExpiryDate: { lt: currentDate },
            licenseStatus: { not: 'expired' }
          },
          {
            licenseExpiryDate: { 
              gte: currentDate,
              lte: twoWeeksFromNow
            },
            licenseStatus: 'valid'
          }
        ]
      },
      select: {
        id: true,
        stageName: true,
        licenseNumber: true,
        licenseExpiryDate: true,
        licenseStatus: true
      },
      orderBy: { licenseExpiryDate: 'asc' }
    });

    const alertsWithStatus = alerts.map(dancer => ({
      ...dancer,
      alertType: new Date(dancer.licenseExpiryDate) < currentDate ? 'expired' : 'expiring_soon',
      daysUntilExpiry: Math.ceil((new Date(dancer.licenseExpiryDate) - currentDate) / (1000 * 60 * 60 * 24))
    }));

    res.json({
      alerts: alertsWithStatus,
      total: alerts.length,
      expired: alertsWithStatus.filter(a => a.alertType === 'expired').length,
      expiringSoon: alertsWithStatus.filter(a => a.alertType === 'expiring_soon').length
    });

  } catch (error) {
    console.error('Compliance alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch compliance alerts' });
  }
});

// Get single dancer
router.get('/:id', validateResourceOwnership('dancer'), async (req, res) => {
  try {
    const dancer = await prisma.dancer.findUnique({
      where: { 
        id: req.params.id,
        clubId: req.user.clubId
      }
    });

    if (!dancer) {
      return res.status(404).json({ error: 'Dancer not found' });
    }

    // Add compliance information
    const currentDate = new Date();
    const twoWeeksFromNow = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    const dancerWithCompliance = {
      ...dancer,
      licenseCompliance: {
        status: dancer.licenseStatus,
        isExpired: dancer.licenseExpiryDate && new Date(dancer.licenseExpiryDate) < currentDate,
        isExpiringSoon: dancer.licenseExpiryDate && 
          new Date(dancer.licenseExpiryDate) > currentDate && 
          new Date(dancer.licenseExpiryDate) < twoWeeksFromNow,
        daysUntilExpiry: dancer.licenseExpiryDate ? 
          Math.ceil((new Date(dancer.licenseExpiryDate) - currentDate) / (1000 * 60 * 60 * 24)) : null
      }
    };

    res.json(dancerWithCompliance);

  } catch (error) {
    console.error('Fetch dancer error:', error);
    res.status(500).json({ error: 'Failed to fetch dancer' });
  }
});

// Create new dancer
router.post('/', [
  requireRole(['owner', 'manager']),
  body('stageName').trim().isLength({ min: 1, max: 100 }).withMessage('Stage name is required (1-100 chars)'),
  body('legalName').optional().trim().isLength({ max: 200 }).withMessage('Legal name too long'),
  body('phone').optional().trim().isMobilePhone().withMessage('Invalid phone number'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Invalid email'),
  body('licenseNumber').optional().trim().isLength({ max: 100 }).withMessage('License number too long'),
  body('licenseExpiryDate').optional().isISO8601().toDate().withMessage('Invalid license expiry date'),
  body('emergencyContact').optional().isObject().withMessage('Emergency contact must be an object'),
  body('preferredMusic').optional().isArray().withMessage('Preferred music must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const dancerData = req.tenant.createWithClubId({
      stageName: req.body.stageName,
      legalName: req.body.legalName || null,
      phone: req.body.phone || null,
      email: req.body.email?.toLowerCase() || null,
      licenseNumber: req.body.licenseNumber || null,
      licenseExpiryDate: req.body.licenseExpiryDate || null,
      licenseStatus: req.body.licenseExpiryDate ? 'valid' : 'pending',
      emergencyContact: req.body.emergencyContact || {},
      preferredMusic: req.body.preferredMusic || []
    });

    const dancer = await prisma.dancer.create({
      data: dancerData
    });

    // Track analytics
    await prisma.usageAnalytics.create({
      data: {
        clubId: req.user.clubId,
        eventType: 'dancer_created',
        eventData: { dancerId: dancer.id, stageName: dancer.stageName },
        userId: req.user.id
      }
    });

    res.status(201).json({
      message: 'Dancer created successfully',
      dancer
    });

  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Stage name already exists for this club' });
    }
    
    console.error('Create dancer error:', error);
    res.status(500).json({ error: 'Failed to create dancer' });
  }
});

// Update dancer
router.put('/:id', [
  requireRole(['owner', 'manager']),
  validateResourceOwnership('dancer'),
  body('stageName').optional().trim().isLength({ min: 1, max: 100 }),
  body('legalName').optional().trim().isLength({ max: 200 }),
  body('phone').optional().trim().isMobilePhone(),
  body('email').optional().isEmail().normalizeEmail(),
  body('licenseNumber').optional().trim().isLength({ max: 100 }),
  body('licenseExpiryDate').optional().isISO8601().toDate(),
  body('licenseStatus').optional().isIn(['valid', 'expired', 'pending', 'suspended']),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = {};
    const allowedFields = ['stageName', 'legalName', 'phone', 'email', 'licenseNumber', 
                          'licenseExpiryDate', 'licenseStatus', 'emergencyContact', 
                          'preferredMusic', 'isActive'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (req.body.email) {
      updates.email = req.body.email.toLowerCase();
    }

    const dancer = await prisma.dancer.update({
      where: { 
        id: req.params.id,
        clubId: req.user.clubId
      },
      data: updates
    });

    // Track analytics
    await prisma.usageAnalytics.create({
      data: {
        clubId: req.user.clubId,
        eventType: 'dancer_updated',
        eventData: { dancerId: dancer.id, updatedFields: Object.keys(updates) },
        userId: req.user.id
      }
    });

    res.json({
      message: 'Dancer updated successfully',
      dancer
    });

  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Stage name already exists for this club' });
    }
    
    console.error('Update dancer error:', error);
    res.status(500).json({ error: 'Failed to update dancer' });
  }
});

// Dancer check-in (key feature)
router.post('/:id/check-in', [
  requireRole(['security', 'manager', 'owner']),
  validateResourceOwnership('dancer')
], async (req, res) => {
  try {
    const dancer = await prisma.dancer.findUnique({
      where: { 
        id: req.params.id,
        clubId: req.user.clubId
      }
    });

    // License compliance check
    const currentDate = new Date();
    const isExpired = dancer.licenseExpiryDate && new Date(dancer.licenseExpiryDate) < currentDate;

    if (isExpired || dancer.licenseStatus === 'expired') {
      return res.status(403).json({ 
        error: 'Cannot check-in dancer with expired license',
        licenseStatus: dancer.licenseStatus,
        licenseExpiryDate: dancer.licenseExpiryDate,
        compliance: {
          canCheckIn: false,
          reason: 'expired_license'
        }
      });
    }

    // Track analytics
    await prisma.usageAnalytics.create({
      data: {
        clubId: req.user.clubId,
        eventType: 'dancer_checkin',
        eventData: { 
          dancerId: dancer.id, 
          stageName: dancer.stageName,
          checkedInBy: req.user.id 
        },
        userId: req.user.id
      }
    });

    res.json({
      message: 'Dancer checked in successfully',
      dancer: {
        id: dancer.id,
        stageName: dancer.stageName,
        licenseStatus: dancer.licenseStatus,
        canCheckIn: true
      },
      checkedInAt: new Date().toISOString(),
      checkedInBy: req.user.firstName + ' ' + req.user.lastName
    });

  } catch (error) {
    console.error('Dancer check-in error:', error);
    res.status(500).json({ error: 'Failed to check-in dancer' });
  }
});

module.exports = router;
