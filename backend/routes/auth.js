const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register new club owner and create club
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('clubName').notEmpty().trim(),
  body('subdomain').notEmpty().trim(),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, clubName, subdomain, firstName, lastName } = req.body;

    // Check if subdomain is taken
    const existingClub = await prisma.club.findUnique({
      where: { subdomain }
    });
    if (existingClub) {
      return res.status(400).json({ error: 'Subdomain already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create club with owner in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create club
      const club = await tx.club.create({
        data: {
          name: clubName,
          subdomain,
          subscriptionTier: 'free',
          subscriptionStatus: 'trialing',
          settings: {}
        }
      });

      // Check if user email already exists for this club
      const existingUser = await tx.clubUser.findUnique({
        where: {
          clubId_email: {
            clubId: club.id,
            email
          }
        }
      });

      if (existingUser) {
        throw new Error('User already exists');
      }

      // Create owner user
      const user = await tx.clubUser.create({
        data: {
          clubId: club.id,
          email,
          passwordHash: hashedPassword,
          role: 'owner',
          firstName,
          lastName,
          isActive: true
        }
      });

      // Create initial subscription
      const subscription = await tx.subscription.create({
        data: {
          clubId: club.id,
          status: 'trialing',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
          trialEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      return { club, user, subscription };
    });

    // Generate JWT token
    const payload = {
      user: {
        id: result.user.id,
        clubId: result.club.id,
        role: result.user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({
          token,
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            role: result.user.role,
            clubId: result.club.id,
            clubName: result.club.name,
            subdomain: result.club.subdomain,
            subscriptionTier: result.club.subscriptionTier
          }
        });
      }
    );

  } catch (error) {
    console.error('Registration error:', error);
    if (error.message === 'User already exists') {
      return res.status(400).json({ error: 'User already exists' });
    }
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user with club info
    const user = await prisma.clubUser.findFirst({
      where: { 
        email,
        isActive: true 
      },
      include: {
        club: true
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await prisma.clubUser.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT token
    const payload = {
      user: {
        id: user.id,
        clubId: user.clubId,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            clubId: user.clubId,
            clubName: user.club.name,
            subdomain: user.club.subdomain,
            subscriptionTier: user.club.subscriptionTier,
            subscriptionStatus: user.club.subscriptionStatus
          }
        });
      }
    );

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private (handled by auth middleware)
router.get('/me', async (req, res) => {
  try {
    const user = await prisma.clubUser.findUnique({
      where: { id: req.user.id },
      include: {
        club: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        clubId: user.clubId,
        clubName: user.club.name,
        subdomain: user.club.subdomain,
        subscriptionTier: user.club.subscriptionTier,
        subscriptionStatus: user.club.subscriptionStatus,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;