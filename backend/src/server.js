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
const revenueRoutes = require('../routes/revenue');
const feesRoutes = require('../routes/fees');
const discrepancyRoutes = require('../routes/discrepancy');

// Fraud Prevention Routes
const shiftRoutes = require('../routes/shifts');
const doorStaffRoutes = require('../routes/door-staff');
const vipHostRoutes = require('../routes/vip-host');
const securityRoutes = require('../routes/security');

// Shift Management Routes (POS-style shift levels)
const shiftManagementRoutes = require('../routes/shift-management');

// Shift Scheduling Routes (Features #21-23)
const scheduleRoutes = require('../routes/schedule');

// Late Fee Routes (Feature #26)
const lateFeeRoutes = require('../routes/lateFees');

// Reporting Routes (Feature #27)
const reportsRoutes = require('../routes/reports');

// Multi-Club Routes (Features #29-30)
const multiClubRoutes = require('../routes/multi-club');

// Settings Routes (Features #35-36)
const settingsRoutes = require('../routes/settings');

// Compliance & Contract Routes (Contract/Onboarding Module)
const complianceRoutes = require('../routes/compliance');
const contractsRoutes = require('../routes/contracts');
const onboardingRoutes = require('../routes/onboarding');

// Patron Count Routes (Feature #49 - Door Count Integration)
const patronCountRoutes = require('../routes/patron-count');

// Club Onboarding Routes (Feature #50 - Club Setup Wizard)
const clubOnboardingRoutes = require('../routes/club-onboarding');

// Push Notification Routes (Feature #34)
const pushNotificationRoutes = require('../routes/push-notifications');

// Automated Backup Routes (Feature #40)
const backupRoutes = require('../routes/backups');

// Berg POS Integration Routes (Feature #48)
const bergIntegrationRoutes = require('../routes/berg-integration');

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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Pragma'],
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

// Patron Count webhook (public, uses HMAC auth instead of JWT)
app.use('/api/patron-count', patronCountRoutes.public);

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
app.use('/api/revenue', revenueRoutes); // Revenue analytics for owner dashboard
app.use('/api/fees', feesRoutes); // Fee tracking and tip-out collection
app.use('/api/discrepancy', discrepancyRoutes); // Tip-out discrepancy tracking (Feature #16)

// SaaS management routes
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes);

// Fraud Prevention & Role-Based Routes
app.use('/api/shifts', shiftRoutes);
app.use('/api/door-staff', doorStaffRoutes);
app.use('/api/vip-host', vipHostRoutes);
app.use('/api/security', securityRoutes);

// Shift Management (POS-style shift levels)
app.use('/api/shift-management', shiftManagementRoutes);

// Shift Scheduling (Features #21-23)
const scheduledShiftsRoutes = require('../routes/scheduled-shifts');
app.use('/api/schedule', scheduleRoutes);
app.use('/api/scheduled-shifts', scheduledShiftsRoutes);

// Late Fee Management (Feature #26)
app.use('/api/late-fees', lateFeeRoutes);

// Reporting System (Feature #27)
app.use('/api/reports', reportsRoutes);

// Multi-Club Management (Features #29-30)
app.use('/api/multi-club', multiClubRoutes);

// Club Settings (Features #35-36)
app.use('/api/settings', settingsRoutes);

// Compliance & Contract Management (Contract/Onboarding Module)
app.use('/api/compliance', complianceRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/onboarding', onboardingRoutes);

// Club Onboarding System (Feature #50 - Club Setup Wizard)
app.use('/api/club-onboarding', clubOnboardingRoutes);

// Push Notification System (Feature #34)
app.use('/api/push-notifications', pushNotificationRoutes);

// Automated Backup System (Feature #40)
app.use('/api/backups', backupRoutes);

// Berg POS Integration (Feature #48)
app.use('/api/berg-integration', bergIntegrationRoutes);

// Patron Count System (Feature #49 - Door Count Integration - protected routes)
app.use('/api/patron-count', patronCountRoutes.protected);

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

  // Revenue Events (Feature #20 - Real-time dashboard updates)
  socket.on('revenue-update', (data) => {
    socket.to(`club-${data.clubId}`).emit('revenue-updated', data);
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

// Initialize scheduled jobs (Feature #26)
const { initializeScheduledJobs, stopAllJobs } = require('../jobs/scheduler');
let scheduledJobs;

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (scheduledJobs) stopAllJobs(scheduledJobs);
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  if (scheduledJobs) stopAllJobs(scheduledJobs);
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

  // Start scheduled jobs
  scheduledJobs = initializeScheduledJobs();
});

module.exports = { app, io, prisma };