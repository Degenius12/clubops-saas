// ClubOps API - Full Version with Authentication
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
  origin: process.env.CLIENT_URL || process.env.FRONTEND_URL || "https://frontend-o9bhynpim-tony-telemacques-projects.vercel.app",
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

// Test database connection (temporarily mock)
app.get('/api/test-db', async (req, res) => {
  try {
    // For now, let's test if we can import Prisma without connecting
    const { PrismaClient } = require('@prisma/client');
    
    res.json({ 
      status: 'ok',
      message: 'Prisma client imported successfully',
      prismaVersion: 'Available'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: 'Prisma client import failed',
      error: error.message
    });
  }
});

// Mock user storage for testing (replace with database later)
const mockUsers = [
  {
    id: 1,
    email: 'admin@clubops.com',
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMye.IACBhGhLfhQPwjJJK7.C8xhA2mFOEC', // "password"
    firstName: 'Admin',
    lastName: 'User',
    role: 'owner',
    clubId: 1,
    clubName: 'Demo Club',
    subdomain: 'demo'
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

// Auth routes
app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user in mock storage
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        clubId: user.clubId
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
            clubName: user.clubName,
            subdomain: user.subdomain
          }
        });
      }
    );

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Register endpoint (simplified)
app.post('/api/auth/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName } = req.body;

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
      firstName,
      lastName,
      role: 'owner',
      clubId: mockUsers.length + 1,
      clubName: `${firstName}'s Club`,
      subdomain: `club${mockUsers.length + 1}`
    };

    mockUsers.push(newUser);

    // Generate JWT
    const payload = {
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        clubId: newUser.clubId
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
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role,
            clubId: newUser.clubId,
            clubName: newUser.clubName,
            subdomain: newUser.subdomain
          }
        });
      }
    );

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Protected route example
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
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

module.exports = app;