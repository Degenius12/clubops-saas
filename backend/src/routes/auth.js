// Authentication Routes
// User registration, login, and club management

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Generate JWT token
const generateToken = (userId, clubId) => {
  return jwt.sign(
    { userId, clubId },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Handle CORS preflight for register
router.options('/register', (req, res) => {
  res.status(200).end();
});

// Club Registration (SaaS Signup)
router.post('/register', [
  body('clubName').trim().isLength({ min: 2, max: 255 }).withMessage('Club name must be 2-255 characters'),
  body('subdomain').trim().isLength({ min: 3, max: 50 }).isAlphanumeric().withMessage('Subdomain must be 3-50 alphanumeric characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').trim().isLength({ min: 1, max: 100 }).withMessage('First name required'),
  body('lastName').trim().isLength({ min: 1, max: 100 }).withMessage('Last name required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { clubName, subdomain, email, password, firstName, lastName } = req.body;

    // Check if subdomain is available
    const existingClub = await prisma.club.findUnique({
      where: { subdomain: subdomain.toLowerCase() }
    });

    if (existingClub) {
      return res.status(400).json({ error: 'Subdomain already taken' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create club and owner user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create club
      const club = await tx.club.create({
        data: {
          name: clubName,
          subdomain: subdomain.toLowerCase(),
          subscriptionTier: 'free',
          subscriptionStatus: 'trialing'
        }
      });

      // Create owner user
      const user = await tx.clubUser.create({
        data: {
          clubId: club.id,
          email: email.toLowerCase(),
          passwordHash,
          role: 'owner',
          firstName,
          lastName
        }
      });

      // Create initial subscription record
      await tx.subscription.create({
        data: {
          clubId: club.id,
          status: 'trialing',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
          trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        }
      });

      return { club, user };
    });

    // Generate token
    const token = generateToken(result.user.id, result.club.id);

    res.status(201).json({
      message: 'Club registered successfully',
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role
      },
      club: {
        id: result.club.id,
        name: result.club.name,
        subdomain: result.club.subdomain,
        subscriptionTier: result.club.subscriptionTier,
        subscriptionStatus: result.club.subscriptionStatus
      }
    });

  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email or subdomain already exists' });
    }
    
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Handle CORS preflight for login
router.options('/login', (req, res) => {
  res.status(200).end();
});

// User Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
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
        email: email.toLowerCase(),
        isActive: true
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            subscriptionTier: true,
            subscriptionStatus: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if club subscription is active
    if (user.club.subscriptionStatus !== 'active' && user.club.subscriptionStatus !== 'trialing') {
      return res.status(403).json({ error: 'Club subscription is not active' });
    }

    // Update last login
    await prisma.clubUser.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate token
    const token = generateToken(user.id, user.clubId);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      club: user.club
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.clubUser.findUnique({
      where: { id: req.user.id },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            subscriptionTier: true,
            subscriptionStatus: true,
            settings: true
          }
        }
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
        lastLogin: user.lastLogin
      },
      club: user.club
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', [
  authMiddleware,
  body('firstName').optional().trim().isLength({ min: 1, max: 100 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 100 }),
  body('email').optional().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = {};
    if (req.body.firstName) updates.firstName = req.body.firstName;
    if (req.body.lastName) updates.lastName = req.body.lastName;
    if (req.body.email) updates.email = req.body.email.toLowerCase();

    const updatedUser = await prisma.clubUser.update({
      where: { id: req.user.id },
      data: updates,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
