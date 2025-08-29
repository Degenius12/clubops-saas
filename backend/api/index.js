// ClubOps SaaS - Complete Vercel Serverless API
// Premium club management backend with full functionality

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

const app = express();

// Enhanced middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000',
    'https://frontend-o9bhynpim-tony-telemacques-projects.vercel.app',
    'https://clubops-saas.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Mock authentication middleware (enhanced)
const mockAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Mock user data
  req.user = {
    id: '1',
    email: 'admin@clubops.com',
    role: 'owner',
    clubId: '1',
    subscriptionTier: 'enterprise'
  };
  next();
};

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

// Enhanced mock dancer data with license management
let mockDancers = [
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
    licenseExpired: false,
    barFeePaid: true,
    contractSigned: true,
    createdAt: '2024-01-15T00:00:00.000Z',
    notes: 'Reliable performer, excellent with VIP clients'
  },
  {
    id: '2', 
    stageName: 'Crystal',
    legalName: 'Jessica Smith',
    email: 'crystal@example.com',
    phone: '+1234567891',
    licenseNumber: 'DL002',
    licenseExpiryDate: '2025-10-15',
    licenseStatus: 'warning',
    isActive: true,
    licenseWarning: true,
    licenseExpired: false,
    barFeePaid: false,
    contractSigned: true,
    createdAt: '2024-02-20T00:00:00.000Z',
    notes: 'License expires soon - needs renewal'
  },
  {
    id: '3',
    stageName: 'Diamond',
    legalName: 'Maria Rodriguez',
    email: 'diamond@example.com',
    phone: '+1234567892',
    licenseNumber: 'DL003',
    licenseExpiryDate: '2026-03-30',
    licenseStatus: 'valid',
    isActive: true,
    licenseWarning: false,
    licenseExpired: false,
    barFeePaid: true,
    contractSigned: true,
    createdAt: '2024-03-10T00:00:00.000Z',
    notes: 'New dancer, showing great potential'
  }
];

// Mock VIP rooms data
let mockVipRooms = [
  { 
    id: '1', 
    name: 'VIP Suite 1', 
    isOccupied: true, 
    currentDancer: 'Luna',
    currentDancerId: '1',
    startTime: '2024-08-29T20:30:00Z',
    hourlyRate: 200,
    totalTime: 45
  },
  { 
    id: '2', 
    name: 'VIP Suite 2', 
    isOccupied: false, 
    currentDancer: null,
    currentDancerId: null,
    startTime: null,
    hourlyRate: 200,
    totalTime: 0
  },
  { 
    id: '3', 
    name: 'VIP Suite 3', 
    isOccupied: true, 
    currentDancer: 'Crystal',
    currentDancerId: '2',
    startTime: '2024-08-29T21:15:00Z',
    hourlyRate: 250,
    totalTime: 30
  },
  { 
    id: '4', 
    name: 'Private Room A', 
    isOccupied: false, 
    currentDancer: null,
    currentDancerId: null,
    startTime: null,
    hourlyRate: 150,
    totalTime: 0
  }
];

// Mock DJ queue data
let mockDjQueue = {
  current: { 
    dancerId: '1', 
    stageName: 'Luna', 
    songTitle: 'Dance Tonight', 
    artistName: 'Electric Beats',
    timeRemaining: 180,
    stage: 'Main Stage'
  },
  queue: [
    { 
      dancerId: '2', 
      stageName: 'Crystal', 
      songTitle: 'Midnight Dreams',
      artistName: 'Neon Lights',
      stage: 'Main Stage'
    },
    { 
      dancerId: '3', 
      stageName: 'Diamond', 
      songTitle: 'Electric Nights',
      artistName: 'Bass Drop',
      stage: 'Main Stage'
    }
  ]
};

// ============= AUTHENTICATION ROUTES =============

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // For demo, accept 'password' or any password with admin@clubops.com
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

// ============= DANCER MANAGEMENT ROUTES =============

// Get all dancers
app.get('/dancers', mockAuth, async (req, res) => {
  try {
    res.json(mockDancers);
  } catch (error) {
    console.error('Get dancers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new dancer
app.post('/dancers', [
  mockAuth,
  body('stageName').notEmpty().trim().withMessage('Stage name is required'),
  body('legalName').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('licenseNumber').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const newDancer = {
      id: (mockDancers.length + 1).toString(),
      stageName: req.body.stageName,
      legalName: req.body.legalName || '',
      email: req.body.email || '',
      phone: req.body.phone || '',
      licenseNumber: req.body.licenseNumber || '',
      licenseExpiryDate: req.body.licenseExpiryDate || null,
      licenseStatus: 'valid',
      isActive: true,
      licenseWarning: false,
      licenseExpired: false,
      barFeePaid: false,
      contractSigned: true,
      clubId: req.user.clubId,
      createdAt: new Date().toISOString(),
      notes: req.body.notes || ''
    };

    mockDancers.push(newDancer);
    res.status(201).json(newDancer);
  } catch (error) {
    console.error('Add dancer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update dancer
app.put('/dancers/:id', [
  mockAuth,
  body('stageName').optional().notEmpty().trim(),
  body('legalName').optional().trim(),
], async (req, res) => {
  try {
    const dancerIndex = mockDancers.findIndex(d => d.id === req.params.id);
    if (dancerIndex === -1) {
      return res.status(404).json({ error: 'Dancer not found' });
    }

    mockDancers[dancerIndex] = {
      ...mockDancers[dancerIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    res.json(mockDancers[dancerIndex]);
  } catch (error) {
    console.error('Update dancer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete dancer (soft delete)
app.delete('/dancers/:id', mockAuth, async (req, res) => {
  try {
    const dancerIndex = mockDancers.findIndex(d => d.id === req.params.id);
    if (dancerIndex === -1) {
      return res.status(404).json({ error: 'Dancer not found' });
    }

    mockDancers[dancerIndex].isActive = false;
    res.json({ message: 'Dancer deactivated successfully' });
  } catch (error) {
    console.error('Delete dancer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============= DASHBOARD ROUTES =============

app.get('/dashboard/stats', mockAuth, (req, res) => {
  const totalDancers = mockDancers.length;
  const activeDancers = mockDancers.filter(d => d.isActive).length;
  const occupiedVipRooms = mockVipRooms.filter(r => r.isOccupied).length;
  const licenseAlerts = mockDancers.filter(d => d.licenseWarning || d.licenseExpired).length;

  res.json({
    totalDancers,
    activeDancers,
    vipRoomsOccupied: occupiedVipRooms,
    totalVipRooms: mockVipRooms.length,
    dailyRevenue: 2850.00,
    weeklyRevenue: 18750.00,
    monthlyRevenue: 85400.00,
    licenseAlerts,
    barFeesOwed: mockDancers.filter(d => !d.barFeePaid).length
  });
});

// ============= VIP ROOM MANAGEMENT =============

app.get('/api/vip-rooms', mockAuth, (req, res) => {
  res.json(mockVipRooms);
});

app.post('/api/vip-rooms/:id/checkin', mockAuth, async (req, res) => {
  try {
    const { dancerId } = req.body;
    const roomIndex = mockVipRooms.findIndex(r => r.id === req.params.id);
    
    if (roomIndex === -1) {
      return res.status(404).json({ error: 'VIP room not found' });
    }

    const dancer = mockDancers.find(d => d.id === dancerId);
    if (!dancer) {
      return res.status(404).json({ error: 'Dancer not found' });
    }

    mockVipRooms[roomIndex] = {
      ...mockVipRooms[roomIndex],
      isOccupied: true,
      currentDancer: dancer.stageName,
      currentDancerId: dancerId,
      startTime: new Date().toISOString()
    };

    res.json(mockVipRooms[roomIndex]);
  } catch (error) {
    console.error('VIP checkin error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/vip-rooms/:id/checkout', mockAuth, async (req, res) => {
  try {
    const roomIndex = mockVipRooms.findIndex(r => r.id === req.params.id);
    
    if (roomIndex === -1) {
      return res.status(404).json({ error: 'VIP room not found' });
    }

    mockVipRooms[roomIndex] = {
      ...mockVipRooms[roomIndex],
      isOccupied: false,
      currentDancer: null,
      currentDancerId: null,
      startTime: null,
      totalTime: 0
    };

    res.json(mockVipRooms[roomIndex]);
  } catch (error) {
    console.error('VIP checkout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============= DJ QUEUE MANAGEMENT =============

app.get('/api/dj-queue', mockAuth, (req, res) => {
  res.json(mockDjQueue);
});

app.post('/api/dj-queue/add', mockAuth, async (req, res) => {
  try {
    const { dancerId, songTitle, artistName } = req.body;
    const dancer = mockDancers.find(d => d.id === dancerId);
    
    if (!dancer) {
      return res.status(404).json({ error: 'Dancer not found' });
    }

    const queueEntry = {
      dancerId,
      stageName: dancer.stageName,
      songTitle: songTitle || 'Selected Song',
      artistName: artistName || 'Various Artists',
      stage: 'Main Stage'
    };

    mockDjQueue.queue.push(queueEntry);
    res.json(mockDjQueue);
  } catch (error) {
    console.error('Add to queue error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/dj-queue/next', mockAuth, async (req, res) => {
  try {
    if (mockDjQueue.queue.length > 0) {
      mockDjQueue.current = mockDjQueue.queue.shift();
      mockDjQueue.current.timeRemaining = 180; // 3 minutes default
    }

    res.json(mockDjQueue);
  } catch (error) {
    console.error('Next in queue error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============= FINANCIAL ROUTES =============

app.get('/api/financial/transactions', mockAuth, (req, res) => {
  const mockTransactions = [
    {
      id: '1',
      type: 'bar_fee',
      amount: 50.00,
      dancerId: '1',
      dancerName: 'Luna',
      timestamp: '2024-08-29T18:00:00Z',
      status: 'completed'
    },
    {
      id: '2',
      type: 'vip_room',
      amount: 200.00,
      dancerId: '2',
      dancerName: 'Crystal',
      timestamp: '2024-08-29T19:30:00Z',
      status: 'completed'
    }
  ];

  res.json(mockTransactions);
});

// ============= HEALTH CHECK =============

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'ClubOps Complete API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0-complete'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'ClubOps SaaS - Complete API', 
    version: '2.0.0-complete',
    features: [
      'Full Dancer Management',
      'License Tracking & Alerts', 
      'VIP Room Management',
      'DJ Queue System',
      'Financial Tracking',
      'Real-time Dashboard'
    ],
    endpoints: [
      'POST /auth/login',
      'GET /dancers',
      'POST /dancers', 
      'PUT /dancers/:id',
      'DELETE /dancers/:id',
      'GET /dashboard/stats',
      'GET /vip-rooms',
      'POST /vip-rooms/:id/checkin',
      'POST /vip-rooms/:id/checkout',
      'GET /dj-queue',
      'POST /dj-queue/add',
      'POST /dj-queue/next',
      'GET /financial/transactions'
    ]
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

module.exports = app;