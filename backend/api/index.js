// ClubOps API - Vercel Serverless Version
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Mock Prisma client for now (since we don't have database connected)
const mockPrisma = {
  dancer: {
    findMany: async () => [],
    create: async (data) => ({ id: 'mock-id', ...data.data }),
    update: async (params) => ({ id: params.where.id, ...params.data }),
  },
  financialTransaction: {
    create: async () => ({ id: 'mock-transaction' })
  }
};

// Mock auth middleware
const mockAuth = (req, res, next) => {
  req.user = {
    id: '1',
    email: 'admin@clubops.com',
    role: 'owner',
    clubId: '1'
  };
  next();
};

const mockAuthorize = (...roles) => (req, res, next) => next();
const mockRequireFeature = (feature) => (req, res, next) => next();

// Route imports with mock Prisma
const createDancerRoutes = () => {
  const express = require('express');
  const { body, validationResult } = require('express-validator');
  const router = express.Router();

  // Get all dancers
  router.get('/', mockAuth, async (req, res) => {
    try {
      const dancers = [
        {
          id: '1',
          stageName: 'Luna',
          legalName: 'Sarah Johnson',
          email: 'luna@example.com',
          phone: '+1234567890',
          licenseNumber: 'DL001',
          licenseExpiryDate: '2025-12-31',
          licenseStatus: 'valid',
          isActive: true,
          licenseWarning: false,
          licenseExpired: false
        },
        {
          id: '2', 
          stageName: 'Crystal',
          legalName: 'Jessica Smith',
          email: 'crystal@example.com',
          phone: '+1234567891',
          licenseNumber: 'DL002',
          licenseExpiryDate: '2025-10-15',
          licenseStatus: 'valid',
          isActive: true,
          licenseWarning: true,
          licenseExpired: false
        }
      ];
      
      res.json(dancers);
    } catch (error) {
      console.error('Get dancers error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Add new dancer
  router.post('/', [
    mockAuth,
    body('stageName').notEmpty().trim(),
    body('legalName').optional().trim(),
    body('email').optional().isEmail().normalizeEmail(),
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const newDancer = {
        id: Date.now().toString(),
        stageName: req.body.stageName,
        legalName: req.body.legalName || '',
        email: req.body.email || '',
        phone: req.body.phone || '',
        licenseNumber: req.body.licenseNumber || '',
        licenseExpiryDate: req.body.licenseExpiryDate || null,
        licenseStatus: 'valid',
        isActive: true,
        clubId: req.user.clubId,
        createdAt: new Date().toISOString()
      };

      res.status(201).json(newDancer);
    } catch (error) {
      console.error('Add dancer error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Update dancer
  router.put('/:id', [
    mockAuth,
    body('stageName').optional().notEmpty().trim(),
    body('legalName').optional().trim(),
  ], async (req, res) => {
    try {
      const updatedDancer = {
        id: req.params.id,
        ...req.body,
        updatedAt: new Date().toISOString()
      };

      res.json(updatedDancer);
    } catch (error) {
      console.error('Update dancer error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Delete dancer (soft delete)
  router.delete('/:id', mockAuth, async (req, res) => {
    try {
      res.json({ message: 'Dancer deactivated successfully' });
    } catch (error) {
      console.error('Delete dancer error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
};

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000',
    'https://frontend-145s5avoo-tony-telemacques-projects.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));

// Test users for authentication
const users = [
  {
    id: 1,
    email: 'admin@clubops.com',
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMye.IACBhGhLfhQPwjJJK7.C8xhA2mFOEC',
    name: 'Admin User',
    role: 'owner',
    club_id: '1',
    subscription_tier: 'enterprise'
  }
];

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // For demo, accept any password with admin@clubops.com
    if (email === 'admin@clubops.com' || password === 'password') {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { user: { id: user.id, email: user.email, role: user.role } },
        'secret123',
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          club_id: user.club_id,
          subscription_tier: user.subscription_tier
        }
      });
    } else {
      res.status(400).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Mount dancer routes
app.use('/api/dancers', createDancerRoutes());

// Dashboard route
app.get('/api/dashboard/stats', mockAuth, (req, res) => {
  res.json({
    totalDancers: 15,
    activeDancers: 8,
    vipRoomsOccupied: 3,
    totalVipRooms: 6,
    dailyRevenue: 2850.00,
    weeklyRevenue: 18750.00,
    monthlyRevenue: 85400.00,
    licenseAlerts: 2
  });
});

// VIP Rooms routes
app.get('/api/vip-rooms', mockAuth, (req, res) => {
  res.json([
    { id: '1', name: 'VIP 1', isOccupied: true, currentDancer: 'Luna', startTime: '2024-08-29T20:30:00Z' },
    { id: '2', name: 'VIP 2', isOccupied: false, currentDancer: null, startTime: null },
    { id: '3', name: 'VIP 3', isOccupied: true, currentDancer: 'Crystal', startTime: '2024-08-29T21:15:00Z' }
  ]);
});

// DJ Queue routes  
app.get('/api/dj-queue', mockAuth, (req, res) => {
  res.json({
    current: { dancerId: '1', stageName: 'Luna', songTitle: 'Dance Tonight', timeRemaining: 180 },
    queue: [
      { dancerId: '2', stageName: 'Crystal', songTitle: 'Midnight Dreams' },
      { dancerId: '3', stageName: 'Diamond', songTitle: 'Electric Nights' }
    ]
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'ClubOps API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'ClubOps SaaS API', 
    version: '1.0.0',
    endpoints: [
      'POST /api/auth/login',
      'GET /api/dancers',
      'POST /api/dancers', 
      'GET /api/dashboard/stats',
      'GET /api/vip-rooms',
      'GET /api/dj-queue'
    ]
  });
});

// Error handling
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;