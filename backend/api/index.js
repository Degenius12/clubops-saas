// ClubOps API - Working Version with Mock Authentication
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: [
    'https://frontend-145s5avoo-tony-telemacques-projects.vercel.app',
    'https://frontend-o9bhynpim-tony-telemacques-projects.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    message: 'ClubOps API is running'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'ClubOps API',
    version: '1.0.0',
    status: 'running',
    endpoints: ['/health', '/api/auth/login', '/api/auth/register']
  });
});

// Mock user storage - Pre-hashed passwords for testing
const mockUsers = [
  {
    id: 1,
    email: 'admin@clubops.com',
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMye.IACBhGhLfhQPwjJJK7.C8xhA2mFOEC', // "password"
    name: 'Admin User',
    firstName: 'Admin',
    lastName: 'User',
    role: 'owner',
    club_id: '1',
    subscription_tier: 'enterprise',
    clubName: 'Demo Club',
    subdomain: 'demo'
  },
  {
    id: 2,
    email: 'test@test.com',
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMye.IACBhGhLfhQPwjJJK7.C8xhA2mFOEC', // "password"
    name: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    role: 'manager',
    club_id: '2',
    subscription_tier: 'pro',
    clubName: 'Test Club',
    subdomain: 'test'
  }
];

// Authentication middleware
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization');
  
  if (!token || !token.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    const authToken = token.split(' ')[1];
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'fallback_secret_key');
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Find user in mock storage
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for:', email);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log('Login successful for:', email);

    // Generate JWT
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        club_id: user.club_id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) {
          console.error('JWT sign error:', err);
          throw err;
        }
        res.json({
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            club_id: user.club_id,
            subscription_tier: user.subscription_tier,
            ownerName: user.firstName + ' ' + user.lastName,
            clubName: user.clubName,
            phoneNumber: user.phoneNumber || ''
          }
        });
      }
    );

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
app.post('/api/auth/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('clubName').notEmpty().trim(),
  body('ownerName').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { email, password, clubName, ownerName, phoneNumber } = req.body;
    console.log('Registration attempt for:', email);

    // Check if user exists
    if (mockUsers.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const newUser = {
      id: mockUsers.length + 1,
      email,
      password: hashedPassword,
      name: ownerName,
      firstName: ownerName.split(' ')[0] || ownerName,
      lastName: ownerName.split(' ')[1] || '',
      role: 'owner',
      club_id: (mockUsers.length + 1).toString(),
      subscription_tier: 'free',
      clubName,
      subdomain: `club${mockUsers.length + 1}`,
      phoneNumber: phoneNumber || ''
    };

    mockUsers.push(newUser);
    console.log('User registered successfully:', email);

    // Generate JWT
    const payload = {
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        club_id: newUser.club_id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) {
          console.error('JWT sign error:', err);
          throw err;
        }
        res.status(201).json({
          token,
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role,
            club_id: newUser.club_id,
            subscription_tier: newUser.subscription_tier,
            ownerName: newUser.name,
            clubName: newUser.clubName,
            phoneNumber: newUser.phoneNumber
          }
        });
      }
    );

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = mockUsers.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      club_id: user.club_id,
      subscription_tier: user.subscription_tier,
      ownerName: user.firstName + ' ' + user.lastName,
      clubName: user.clubName,
      phoneNumber: user.phoneNumber || ''
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Protected dashboard endpoint
app.get('/api/dashboard', authMiddleware, (req, res) => {
  res.json({
    message: 'Dashboard data',
    user: req.user,
    data: {
      totalDancers: 25,
      activeVipRooms: 3,
      todayRevenue: 2450.00,
      queueLength: 8
    }
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('404 for path:', req.originalUrl);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// For serverless deployment
module.exports = app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Available test accounts:');
    console.log('- admin@clubops.com / password');
    console.log('- test@test.com / password');
  });
}