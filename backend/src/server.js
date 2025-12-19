// ClubOps SaaS - Main Server
// Premium club management backend with multi-tenant SaaS capabilities

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

// Database connection
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware imports
const authMiddleware = require('../middleware/auth');
const multiTenantMiddleware = require('../middleware/multiTenant');
const rateLimitMiddleware = require('../middleware/rateLimit');
const errorHandler = require('../middleware/errorHandler');

// Route imports
const authRoutes = require('../routes/auth');
const dashboardRoutes = require('../routes/dashboard');
const dancerRoutes = require('../routes/dancers');
const djQueueRoutes = require('../routes/dj-queue');
const musicRoutes = require('../routes/music');
const vipRoomRoutes = require('../routes/vip-rooms');
const financialRoutes = require('../routes/financial');
const subscriptionRoutes = require('../routes/subscriptions');
const analyticsRoutes = require('../routes/analytics');
const webhookRoutes = require('../routes/webhooks');

// Fraud Prevention Routes
const shiftRoutes = require('../routes/shifts');
const doorStaffRoutes = require('../routes/door-staff');
const vipHostRoutes = require('../routes/vip-host');
const securityRoutes = require('../routes/security');

// Queue Routes (alias for dj-queue)
const queueRoutes = require('../routes/queue');

const app = express();
const server = http.createServer(app);

// Socket.IO for real-time features
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "https://www.clubflowapp.com",
      "https://clubflowapp.com",
      "https://frontend-o9bhynpim-tony-telemacques-projects.vercel.app",
      "https://frontend-6v4tpr1qa-tony-telemacques-projects.vercel.app",
      "http://localhost:3000",
      "http://localhost:3002",
      "http://localhost:3003",
      "http://localhost:3004",
      "http://localhost:3005",
      "http://localhost:3006",
      "http://localhost:3007",
      "http://localhost:5173"
    ],
    methods: ["GET", "POST"]
  }
});

// Basic middleware
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
    process.env.FRONTEND_URL || "http://localhost:3000",
    "https://www.clubflowapp.com",
    "https://clubflowapp.com",
    "https://frontend-o9bhynpim-tony-telemacques-projects.vercel.app",
    "https://frontend-6v4tpr1qa-tony-telemacques-projects.vercel.app",
    "http://localhost:3000",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004",
    "http://localhost:3005",
    "http://localhost:3006",
    "http://localhost:3007",
    "http://localhost:5173"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Rate limiting (tier-based)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use('/api/', generalLimiter);

// Raw body parsing for webhooks (Stripe)
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

// JSON parsing for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Public routes (no auth required)
app.use('/api/auth', authRoutes);
app.use('/api/webhooks', webhookRoutes);

// Protected routes with authentication and multi-tenant isolation
app.use('/api', authMiddleware.auth);
app.use('/api', multiTenantMiddleware);
app.use('/api', rateLimitMiddleware);

// Core business routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/dancers', dancerRoutes);
app.use('/api/dj-queue', djQueueRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/vip-rooms', vipRoomRoutes);
app.use('/api/financial', financialRoutes);

// SaaS management routes
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes);

// Fraud Prevention & Role-Based Routes
app.use('/api/shifts', shiftRoutes);
app.use('/api/door-staff', doorStaffRoutes);
app.use('/api/vip-host', vipHostRoutes);
app.use('/api/security', securityRoutes);

// Queue Routes (frontend uses /api/queue)
app.use('/api/queue', queueRoutes);

// Make io accessible to routes for real-time updates
app.set('io', io);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join club-specific room for multi-tenant isolation
  socket.on('join-club', (clubId) => {
    socket.join(`club-${clubId}`);
    console.log(`Socket ${socket.id} joined club-${clubId}`);
  });

  // DJ Queue updates
  socket.on('queue-update', (data) => {
    socket.to(`club-${data.clubId}`).emit('queue-updated', data);
  });

  // VIP Room status updates
  socket.on('vip-update', (data) => {
    socket.to(`club-${data.clubId}`).emit('vip-updated', data);
  });

  // Dancer status updates
  socket.on('dancer-update', (data) => {
    socket.to(`club-${data.clubId}`).emit('dancer-updated', data);
  });

  // ==== FRAUD PREVENTION REAL-TIME EVENTS ====
  
  // Door Staff Events
  socket.on('dancer-check-in', (data) => {
    socket.to(`club-${data.clubId}`).emit('dancer-checked-in', data);
  });

  socket.on('dancer-check-out', (data) => {
    socket.to(`club-${data.clubId}`).emit('dancer-checked-out', data);
  });

  // VIP Host Events
  socket.on('vip-session-start', (data) => {
    socket.to(`club-${data.clubId}`).emit('vip-session-started', data);
  });

  socket.on('vip-session-end', (data) => {
    socket.to(`club-${data.clubId}`).emit('vip-session-ended', data);
  });

  socket.on('vip-song-count', (data) => {
    socket.to(`club-${data.clubId}`).emit('vip-song-count-updated', data);
  });

  // Alert Events
  socket.on('verification-alert', (data) => {
    socket.to(`club-${data.clubId}`).emit('new-alert', data);
  });

  // Shift Events
  socket.on('shift-start', (data) => {
    socket.to(`club-${data.clubId}`).emit('shift-started', data);
  });

  socket.on('shift-end', (data) => {
    socket.to(`club-${data.clubId}`).emit('shift-ended', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

const PORT = process.env.PORT || 5000;

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 ClubOps Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

module.exports = { app, io, prisma };