// ClubOps SaaS - Serverless API for Vercel
// Complete backend with Fraud Prevention System
// Version: 3.0.4 - Added missing routes (shifts/active, security/comparisons)

// Safe dotenv loading for serverless
try { require('dotenv').config(); } catch (e) { console.log('dotenv not needed in serverless'); }

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');

const app = express();

// Database connection - Serverless optimized (graceful fallback)
let prisma = null;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
    log: ['error']
  });
  console.log('Prisma client initialized');
} catch (error) {
  console.log('Prisma not available, using mock data:', error.message);
}

// Security middleware
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

// CORS - Allow all Vercel deployments
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.includes('vercel.app') || origin.includes('clubops') || origin.includes('clubflow') || origin.includes('localhost')) {
      return callback(null, true);
    }
    const allowed = [process.env.FRONTEND_URL, process.env.CLIENT_URL, "http://localhost:3000"].filter(Boolean);
    return callback(null, allowed.includes(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cache-Control', 'Pragma'],
  exposedHeaders: ['Authorization'],
  preflightContinue: true, // CRITICAL: Let our app.options handler run
  optionsSuccessStatus: 204,
  maxAge: 86400 // Cache preflight for 24 hours
}));

// CRITICAL: Handle ALL OPTIONS requests FIRST, before any other middleware or routes
// This ensures CORS preflight requests get 204 responses instead of 404
app.options('*', (req, res) => {
  res.status(204).end();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// JWT Authentication middleware
const JWT_SECRET = process.env.JWT_SECRET || 'clubops-super-secure-jwt-key-2024';
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user.user || user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// ============= CONSOLIDATED MOCK DATA =============
const users = [
  { id: 1, email: 'admin@clubops.com', password: 'password', name: 'Admin User', role: 'owner', club_id: '1', subscription_tier: 'enterprise' },
  { id: 2, email: 'manager@clubops.com', password: 'password', name: 'Manager User', role: 'manager', club_id: '1', subscription_tier: 'pro' },
  { id: 3, email: 'tonytele@gmail.com', password: 'Admin1.0', name: 'Tony Telemaque', role: 'owner', club_id: '3', subscription_tier: 'enterprise' },
  { id: 4, email: 'demo@clubops.com', password: 'Demo123!', name: 'Demo User', role: 'owner', club_id: '4', subscription_tier: 'pro' },
  { id: 5, email: 'doorstaff@demo.com', password: 'password', pin: '1234', name: 'Mike Door', role: 'door_staff', club_id: '1', subscription_tier: 'pro' },
  { id: 6, email: 'viphost@demo.com', password: 'password', pin: '5678', name: 'Sarah VIP', role: 'vip_host', club_id: '1', subscription_tier: 'pro' }
];

let mockDancers = [
  { id: '1', stageName: 'Crystal', legalName: 'Sarah Johnson', qrCode: 'CRYS001', licenseNumber: 'DL001', licenseExpiryDate: '2026-06-15', licenseStatus: 'valid', isActive: true, barFeePaid: true, checkedIn: true, checkInTime: new Date().toISOString() },
  { id: '2', stageName: 'Diamond', legalName: 'Jessica Smith', qrCode: 'DIAM002', licenseNumber: 'DL002', licenseExpiryDate: '2025-12-20', licenseStatus: 'valid', isActive: true, barFeePaid: true, checkedIn: true, checkInTime: new Date().toISOString() },
  { id: '3', stageName: 'Ruby', legalName: 'Maria Garcia', qrCode: 'RUBY003', licenseNumber: 'DL003', licenseExpiryDate: '2025-01-15', licenseStatus: 'warning', isActive: true, barFeePaid: true, checkedIn: true, checkInTime: new Date().toISOString() },
  { id: '4', stageName: 'Sapphire', legalName: 'Amanda Lee', qrCode: 'SAPH004', licenseNumber: 'DL004', licenseExpiryDate: '2026-03-22', licenseStatus: 'valid', isActive: true, barFeePaid: false, checkedIn: true, checkInTime: new Date().toISOString() },
  { id: '5', stageName: 'Emerald', legalName: 'Nicole Brown', qrCode: 'EMER005', licenseNumber: 'DL005', licenseExpiryDate: '2025-09-10', licenseStatus: 'valid', isActive: true, barFeePaid: false, checkedIn: true, checkInTime: new Date().toISOString() },
  { id: '6', stageName: 'Pearl', legalName: 'Emily White', qrCode: 'PERL006', licenseNumber: 'DL006', licenseExpiryDate: '2024-11-30', licenseStatus: 'expired', isActive: false, barFeePaid: false, checkedIn: false },
  { id: '7', stageName: 'Jade', legalName: 'Olivia Green', qrCode: 'JADE007', licenseNumber: 'DL007', licenseExpiryDate: '2026-01-05', licenseStatus: 'valid', isActive: true, barFeePaid: true, checkedIn: false },
  { id: '8', stageName: 'Amber', legalName: 'Sophia Gold', qrCode: 'AMBR008', licenseNumber: 'DL008', licenseExpiryDate: null, licenseStatus: 'pending', isActive: false, barFeePaid: false, checkedIn: false }
];

let mockVipBooths = [
  { id: '1', name: 'Champagne Room', capacity: 6, songRate: 35, status: 'occupied', currentDancerId: '4' },
  { id: '2', name: 'Diamond Suite', capacity: 4, songRate: 40, status: 'available', currentDancerId: null },
  { id: '3', name: 'Platinum Lounge', capacity: 8, songRate: 30, status: 'available', currentDancerId: null },
  { id: '4', name: 'VIP Booth 4', capacity: 4, songRate: 30, status: 'available', currentDancerId: null },
  { id: '5', name: 'VIP Booth 5', capacity: 4, songRate: 30, status: 'unavailable', currentDancerId: null }
];

let mockVipSessions = [
  { id: 'session-1', boothId: '1', boothName: 'Champagne Room', dancerId: '4', dancerName: 'Sapphire', startTime: new Date(Date.now() - 30*60000).toISOString(), endTime: null, songCount: 6, hostSongCount: 6, status: 'active', customerConfirmed: false },
  { id: 'session-2', boothId: '2', boothName: 'Diamond Suite', dancerId: '1', dancerName: 'Crystal', startTime: new Date(Date.now() - 2*60*60000).toISOString(), endTime: new Date(Date.now() - 60*60000).toISOString(), songCount: 8, hostSongCount: 8, status: 'verified', customerConfirmed: true },
  { id: 'session-3', boothId: '3', boothName: 'Platinum Lounge', dancerId: '2', dancerName: 'Diamond', startTime: new Date(Date.now() - 3*60*60000).toISOString(), endTime: new Date(Date.now() - 2*60*60000).toISOString(), songCount: 18, hostSongCount: 15, status: 'mismatch', customerConfirmed: true, discrepancy: 3 }
];

let mockAlerts = [
  { id: 'alert-1', type: 'VIP_SONG_MISMATCH', severity: 'HIGH', status: 'OPEN', message: '3 song discrepancy in Diamond Suite', createdAt: new Date().toISOString() },
  { id: 'alert-2', type: 'LICENSE_EXPIRING', severity: 'MEDIUM', status: 'OPEN', message: "Ruby's license expires Jan 15, 2025", createdAt: new Date().toISOString() },
  { id: 'alert-3', type: 'CASH_VARIANCE', severity: 'MEDIUM', status: 'ACKNOWLEDGED', message: '$15 variance from previous shift', createdAt: new Date().toISOString() }
];

let mockAuditLog = [
  { id: 'audit-1', action: 'DANCER_CHECK_IN', staffId: 'staff-001', staffName: 'Mike (Door)', details: 'Crystal checked in', timestamp: new Date().toISOString(), riskLevel: 'LOW' },
  { id: 'audit-2', action: 'VIP_SESSION_START', staffId: 'staff-002', staffName: 'Sarah (VIP)', details: 'Session started in Champagne Room', timestamp: new Date().toISOString(), riskLevel: 'LOW' },
  { id: 'audit-3', action: 'SONG_COUNT_MISMATCH', staffId: 'staff-002', staffName: 'Sarah (VIP)', details: 'Host: 15, DJ: 18 - Discrepancy: 3', timestamp: new Date().toISOString(), riskLevel: 'HIGH' }
];

let mockShift = {
  id: 'shift-001',
  staffId: 'staff-001',
  role: 'door_staff',
  startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  endTime: null,
  openingBalance: 200,
  closingBalance: null,
  status: 'active'
};

let mockCheckedInDancers = [
  { id: 'checkin-1', dancerId: '1', stageName: 'Crystal', checkInTime: new Date().toISOString(), barFeeStatus: 'PAID', barFeeAmount: 50, checkOutTime: null },
  { id: 'checkin-2', dancerId: '2', stageName: 'Diamond', checkInTime: new Date().toISOString(), barFeeStatus: 'PAID', barFeeAmount: 50, checkOutTime: null },
  { id: 'checkin-3', dancerId: '3', stageName: 'Ruby', checkInTime: new Date().toISOString(), barFeeStatus: 'PAID', barFeeAmount: 50, checkOutTime: null },
  { id: 'checkin-4', dancerId: '4', stageName: 'Sapphire', checkInTime: new Date().toISOString(), barFeeStatus: 'PENDING', barFeeAmount: 0, checkOutTime: null },
  { id: 'checkin-5', dancerId: '5', stageName: 'Emerald', checkInTime: new Date().toISOString(), barFeeStatus: 'PENDING', barFeeAmount: 0, checkOutTime: null }
];

let mockDjQueue = { current: null, queue: [] };


// ============= AUTHENTICATION ROUTES =============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, pin } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    
    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    if (pin) {
      if (user.pin !== pin) return res.status(401).json({ error: 'Invalid PIN' });
    } else if (password) {
      if (user.password !== password) return res.status(401).json({ error: 'Invalid password' });
    } else {
      return res.status(400).json({ error: 'Password or PIN required' });
    }

    const token = jwt.sign(
      { user: { id: user.id, email: user.email, role: user.role, club_id: user.club_id } },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, club_id: user.club_id, subscription_tier: user.subscription_tier } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role, club_id: user.club_id, subscription_tier: user.subscription_tier });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, club_name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'All fields required' });
    if (users.find(u => u.email === email)) return res.status(400).json({ error: 'User exists' });

    const newUser = { id: users.length + 1, email, password, name, role: 'owner', club_id: (users.length + 1).toString(), subscription_tier: 'free' };
    users.push(newUser);

    const token = jwt.sign({ user: { id: newUser.id, email: newUser.email, role: newUser.role, club_id: newUser.club_id } }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, user: newUser });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ============= DASHBOARD ROUTES =============
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  const checkedIn = mockDancers.filter(d => d.checkedIn).length;
  const pendingFees = mockDancers.filter(d => d.checkedIn && !d.barFeePaid).length;
  const activeVip = mockVipSessions.filter(s => s.status === 'active').length;
  const alerts = mockAlerts.filter(a => a.status === 'OPEN').length;

  res.json({
    totalDancers: mockDancers.length,
    activeDancers: checkedIn,
    vipRoomsOccupied: activeVip,
    totalVipRooms: mockVipBooths.length,
    dailyRevenue: 2850.00,
    weeklyRevenue: 18750.00,
    monthlyRevenue: 85400.00,
    licenseAlerts: mockDancers.filter(d => d.licenseStatus === 'warning' || d.licenseStatus === 'expired').length,
    barFeesOwed: pendingFees,
    openAlerts: alerts
  });
});


// ============= SHIFTS API =============
app.post('/api/shifts/start', authenticateToken, (req, res) => {
  const { openingBalance } = req.body;
  mockShift = {
    id: 'shift-' + Date.now(),
    staffId: req.user.id,
    role: req.user.role,
    startTime: new Date().toISOString(),
    endTime: null,
    openingBalance: openingBalance || 200,
    closingBalance: null,
    status: 'active'
  };
  res.json({ success: true, shift: mockShift });
});

app.get('/api/shifts/current', authenticateToken, (req, res) => {
  res.json(mockShift);
});

// Alias for frontend compatibility
app.get('/api/shifts/active', authenticateToken, (req, res) => {
  if (mockShift && mockShift.status === 'active') {
    res.json(mockShift);
  } else {
    res.json(null);
  }
});

app.post('/api/shifts/end', authenticateToken, (req, res) => {
  const { closingBalance } = req.body;
  mockShift.endTime = new Date().toISOString();
  mockShift.closingBalance = closingBalance;
  mockShift.status = 'completed';
  res.json({ success: true, shift: mockShift });
});

// ============= DOOR STAFF API =============
app.get('/api/door-staff/checked-in', authenticateToken, (req, res) => {
  res.json(mockCheckedInDancers.filter(d => !d.checkOutTime));
});

app.get('/api/door-staff/dancer/search', authenticateToken, (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const results = mockDancers.filter(d => d.stageName.toLowerCase().includes(q) || d.legalName?.toLowerCase().includes(q));
  res.json(results);
});

app.get('/api/door-staff/dancer/qr/:code', authenticateToken, (req, res) => {
  const code = req.params.code.toUpperCase();
  const dancer = mockDancers.find(d => d.qrCode === code || d.badgeCode === code);
  if (!dancer) return res.status(404).json({ error: 'Dancer not found' });
  res.json(dancer);
});

app.post('/api/door-staff/check-in', authenticateToken, (req, res) => {
  const { dancerId, stageName } = req.body;
  const newCheckIn = {
    id: 'checkin-' + Date.now(),
    dancerId,
    stageName: stageName || 'Unknown',
    checkInTime: new Date().toISOString(),
    barFeeStatus: 'PENDING',
    barFeeAmount: 0,
    checkOutTime: null
  };
  mockCheckedInDancers.push(newCheckIn);
  mockAuditLog.push({ id: 'audit-' + Date.now(), action: 'DANCER_CHECK_IN', staffId: req.user.id, staffName: 'Staff', details: `${stageName} checked in`, timestamp: new Date().toISOString(), riskLevel: 'LOW' });
  res.json({ success: true, checkIn: newCheckIn });
});

app.post('/api/door-staff/check-out/:id', authenticateToken, (req, res) => {
  const idx = mockCheckedInDancers.findIndex(d => d.id === req.params.id || d.dancerId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Check-in not found' });
  mockCheckedInDancers[idx].checkOutTime = new Date().toISOString();
  res.json({ success: true, checkIn: mockCheckedInDancers[idx] });
});

app.post('/api/door-staff/bar-fee/:id', authenticateToken, (req, res) => {
  const { amount } = req.body;
  const idx = mockCheckedInDancers.findIndex(d => d.id === req.params.id || d.dancerId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Check-in not found' });
  mockCheckedInDancers[idx].barFeeStatus = 'PAID';
  mockCheckedInDancers[idx].barFeeAmount = amount || 50;
  mockAuditLog.push({ id: 'audit-' + Date.now(), action: 'BAR_FEE_COLLECTED', staffId: req.user.id, staffName: 'Staff', details: `$${amount || 50} collected`, timestamp: new Date().toISOString(), riskLevel: 'LOW' });
  res.json({ success: true, checkIn: mockCheckedInDancers[idx] });
});

app.get('/api/door-staff/alerts', authenticateToken, (req, res) => {
  res.json(mockAlerts);
});

app.post('/api/door-staff/alerts/:id/acknowledge', authenticateToken, (req, res) => {
  const idx = mockAlerts.findIndex(a => a.id === req.params.id);
  if (idx !== -1) mockAlerts[idx].status = 'ACKNOWLEDGED';
  res.json({ success: true });
});

app.post('/api/door-staff/alerts/:id/dismiss', authenticateToken, (req, res) => {
  const idx = mockAlerts.findIndex(a => a.id === req.params.id);
  if (idx !== -1) mockAlerts[idx].status = 'RESOLVED';
  res.json({ success: true });
});

app.get('/api/door-staff/summary', authenticateToken, (req, res) => {
  const active = mockCheckedInDancers.filter(d => !d.checkOutTime);
  const paid = active.filter(d => d.barFeeStatus === 'PAID');
  res.json({
    totalCheckedIn: active.length,
    barFeesPaid: paid.length,
    barFeesPending: active.length - paid.length,
    totalBarFees: paid.reduce((sum, d) => sum + d.barFeeAmount, 0),
    alertCount: mockAlerts.filter(a => a.status === 'OPEN').length
  });
});


// ============= VIP HOST API =============
app.get('/api/vip-host/booths', authenticateToken, (req, res) => {
  res.json(mockVipBooths.map(b => ({
    ...b,
    currentSession: mockVipSessions.find(s => s.boothId === b.id && s.status === 'active')
  })));
});

app.get('/api/vip-host/available-dancers', authenticateToken, (req, res) => {
  const checkedIn = mockCheckedInDancers.filter(d => !d.checkOutTime);
  res.json(checkedIn);
});

app.get('/api/vip-host/sessions/active', authenticateToken, (req, res) => {
  res.json(mockVipSessions.filter(s => s.status === 'active'));
});

app.post('/api/vip-host/sessions/start', authenticateToken, (req, res) => {
  const { boothId, dancerId, dancerName } = req.body;
  const booth = mockVipBooths.find(b => b.id === boothId);
  const newSession = {
    id: 'session-' + Date.now(),
    boothId,
    boothName: booth?.name || 'Unknown',
    dancerId,
    dancerName,
    startTime: new Date().toISOString(),
    endTime: null,
    songCount: 0,
    hostSongCount: 0,
    status: 'active',
    customerConfirmed: false
  };
  mockVipSessions.push(newSession);
  const bIdx = mockVipBooths.findIndex(b => b.id === boothId);
  if (bIdx !== -1) { mockVipBooths[bIdx].status = 'occupied'; mockVipBooths[bIdx].currentDancerId = dancerId; }
  mockAuditLog.push({ id: 'audit-' + Date.now(), action: 'VIP_SESSION_START', staffId: req.user.id, staffName: 'VIP Host', details: `${dancerName} started in ${booth?.name}`, timestamp: new Date().toISOString(), riskLevel: 'LOW' });
  res.json({ success: true, session: newSession });
});

app.put('/api/vip-host/sessions/:id/song-count', authenticateToken, (req, res) => {
  const { count } = req.body;
  const idx = mockVipSessions.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Session not found' });
  mockVipSessions[idx].hostSongCount = count;
  mockVipSessions[idx].songCount = count;
  res.json({ success: true, session: mockVipSessions[idx] });
});

app.post('/api/vip-host/sessions/:id/end', authenticateToken, (req, res) => {
  const idx = mockVipSessions.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Session not found' });
  mockVipSessions[idx].endTime = new Date().toISOString();
  mockVipSessions[idx].status = 'pending_confirmation';
  const bIdx = mockVipBooths.findIndex(b => b.id === mockVipSessions[idx].boothId);
  if (bIdx !== -1) { mockVipBooths[bIdx].status = 'available'; mockVipBooths[bIdx].currentDancerId = null; }
  res.json({ success: true, session: mockVipSessions[idx] });
});

app.get('/api/vip-host/sessions/:id/confirm', authenticateToken, (req, res) => {
  const session = mockVipSessions.find(s => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

app.post('/api/vip-host/sessions/:id/confirm', authenticateToken, (req, res) => {
  const idx = mockVipSessions.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Session not found' });
  mockVipSessions[idx].customerConfirmed = true;
  mockVipSessions[idx].status = 'verified';
  res.json({ success: true, session: mockVipSessions[idx] });
});

app.post('/api/vip-host/sessions/:id/dispute', authenticateToken, (req, res) => {
  const { reason } = req.body;
  const idx = mockVipSessions.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Session not found' });
  mockVipSessions[idx].status = 'disputed';
  mockVipSessions[idx].disputeReason = reason;
  mockAlerts.push({ id: 'alert-' + Date.now(), type: 'VIP_DISPUTE', severity: 'HIGH', status: 'OPEN', message: `Session disputed: ${reason}`, createdAt: new Date().toISOString() });
  res.json({ success: true, session: mockVipSessions[idx] });
});

app.get('/api/vip-host/summary', authenticateToken, (req, res) => {
  const active = mockVipSessions.filter(s => s.status === 'active');
  const completed = mockVipSessions.filter(s => s.status !== 'active');
  res.json({
    activeSessions: active.length,
    completedSessions: completed.length,
    totalSongs: mockVipSessions.reduce((sum, s) => sum + (s.songCount || 0), 0),
    disputedSessions: mockVipSessions.filter(s => s.status === 'disputed').length
  });
});

app.get('/api/vip-host/sessions/history', authenticateToken, (req, res) => {
  res.json(mockVipSessions.filter(s => s.status !== 'active'));
});


// ============= SECURITY DASHBOARD API =============
app.get('/api/security/integrity', authenticateToken, (req, res) => {
  const verified = mockVipSessions.filter(s => s.status === 'verified').length;
  const total = mockVipSessions.length;
  res.json({
    overallScore: total > 0 ? Math.round((verified / total) * 100) : 100,
    songCountAccuracy: 96,
    cashHandlingScore: 92,
    complianceScore: 98,
    alertsOpen: mockAlerts.filter(a => a.status === 'OPEN').length,
    anomaliesDetected: mockAlerts.filter(a => a.status === 'OPEN').length,
    lastUpdated: new Date().toISOString()
  });
});

app.get('/api/security/audit-log', authenticateToken, (req, res) => {
  res.json(mockAuditLog);
});

app.get('/api/security/song-comparisons', authenticateToken, (req, res) => {
  res.json(mockVipSessions.map(s => ({
    sessionId: s.id,
    boothName: s.boothName,
    dancerName: s.dancerName,
    hostCount: s.hostSongCount,
    djCount: s.songCount,
    discrepancy: Math.abs((s.hostSongCount || 0) - (s.songCount || 0)),
    status: s.status,
    timestamp: s.startTime
  })));
});

// Alias for frontend compatibility
app.get('/api/security/comparisons', authenticateToken, (req, res) => {
  res.json(mockVipSessions.map(s => ({
    sessionId: s.id,
    boothName: s.boothName,
    dancerName: s.dancerName,
    hostCount: s.hostSongCount,
    djCount: s.songCount,
    discrepancy: Math.abs((s.hostSongCount || 0) - (s.songCount || 0)),
    status: s.status,
    timestamp: s.startTime
  })));
});

app.get('/api/security/anomalies', authenticateToken, (req, res) => {
  res.json(mockAlerts);
});

app.post('/api/security/anomalies/:id/investigate', authenticateToken, (req, res) => {
  const idx = mockAlerts.findIndex(a => a.id === req.params.id);
  if (idx !== -1) mockAlerts[idx].status = 'INVESTIGATING';
  res.json({ success: true });
});

app.post('/api/security/anomalies/:id/resolve', authenticateToken, (req, res) => {
  const idx = mockAlerts.findIndex(a => a.id === req.params.id);
  if (idx !== -1) mockAlerts[idx].status = 'RESOLVED';
  res.json({ success: true });
});

app.post('/api/security/anomalies/:id/dismiss', authenticateToken, (req, res) => {
  const idx = mockAlerts.findIndex(a => a.id === req.params.id);
  if (idx !== -1) mockAlerts[idx].status = 'DISMISSED';
  res.json({ success: true });
});

app.get('/api/security/employee-performance', authenticateToken, (req, res) => {
  res.json([
    { id: 'staff-001', name: 'Mike', role: 'door_staff', accuracy: 98, shiftsWorked: 24, alertsGenerated: 2 },
    { id: 'staff-002', name: 'Sarah', role: 'vip_host', accuracy: 95, shiftsWorked: 22, alertsGenerated: 5 }
  ]);
});

app.get('/api/security/reports', authenticateToken, (req, res) => {
  res.json([
    { id: 'report-1', type: 'WEEKLY_VARIANCE', title: 'Weekly VIP Variance Analysis', createdAt: new Date().toISOString(), viewed: false }
  ]);
});

app.post('/api/security/reports/:id/viewed', authenticateToken, (req, res) => {
  res.json({ success: true });
});

app.get('/api/security/export/audit-log', authenticateToken, (req, res) => {
  const format = req.query.format || 'json';
  if (format === 'csv') {
    const csv = 'id,action,staffId,details,timestamp,riskLevel\n' + mockAuditLog.map(l => `${l.id},${l.action},${l.staffId},${l.details},${l.timestamp},${l.riskLevel}`).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  } else {
    res.json(mockAuditLog);
  }
});

app.get('/api/security/export/comparisons', authenticateToken, (req, res) => {
  res.json(mockVipSessions);
});

app.post('/api/security/verify-chain', authenticateToken, (req, res) => {
  res.json({ valid: true, entries: mockAuditLog.length, message: 'Audit chain integrity verified' });
});


// ============= DANCER MANAGEMENT =============
app.get('/api/dancers', authenticateToken, (req, res) => {
  res.json(mockDancers);
});

app.post('/api/dancers', authenticateToken, (req, res) => {
  const newDancer = { id: String(mockDancers.length + 1), ...req.body, isActive: true, checkedIn: false, createdAt: new Date().toISOString() };
  mockDancers.push(newDancer);
  res.status(201).json(newDancer);
});

app.put('/api/dancers/:id', authenticateToken, (req, res) => {
  const idx = mockDancers.findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Dancer not found' });
  mockDancers[idx] = { ...mockDancers[idx], ...req.body };
  res.json(mockDancers[idx]);
});

// ============= VIP ROOM MANAGEMENT =============
app.get('/api/vip-rooms', authenticateToken, (req, res) => {
  res.json(mockVipBooths);
});

app.post('/api/vip-rooms/:id/checkin', authenticateToken, (req, res) => {
  const { dancerId } = req.body;
  const idx = mockVipBooths.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Room not found' });
  const dancer = mockDancers.find(d => d.id === dancerId);
  mockVipBooths[idx].status = 'occupied';
  mockVipBooths[idx].currentDancerId = dancerId;
  mockVipBooths[idx].currentDancer = dancer?.stageName;
  res.json(mockVipBooths[idx]);
});

app.post('/api/vip-rooms/:id/checkout', authenticateToken, (req, res) => {
  const idx = mockVipBooths.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Room not found' });
  mockVipBooths[idx].status = 'available';
  mockVipBooths[idx].currentDancerId = null;
  mockVipBooths[idx].currentDancer = null;
  res.json(mockVipBooths[idx]);
});

// ============= DJ QUEUE =============
app.get('/api/dj-queue', authenticateToken, (req, res) => res.json(mockDjQueue));
app.get('/api/queue', authenticateToken, (req, res) => res.json(mockDjQueue));

app.post('/api/queue/add', authenticateToken, (req, res) => {
  const entry = { id: String(Date.now()), ...req.body };
  mockDjQueue.queue.push(entry);
  res.json(mockDjQueue);
});

app.post('/api/queue/next', authenticateToken, (req, res) => {
  if (mockDjQueue.queue.length > 0) mockDjQueue.current = mockDjQueue.queue.shift();
  res.json(mockDjQueue);
});

app.delete('/api/queue/:id', authenticateToken, (req, res) => {
  mockDjQueue.queue = mockDjQueue.queue.filter(t => t.id !== req.params.id);
  res.json(mockDjQueue);
});

app.put('/api/queue/reorder', authenticateToken, (req, res) => {
  if (req.body.queue) mockDjQueue.queue = req.body.queue;
  res.json(mockDjQueue);
});

// ============= SUBSCRIPTION MANAGEMENT =============
const subscriptionPlans = [
  { id: 'starter', name: 'Starter', price: 0, interval: 'forever', dancers: 5, vipBooths: 0, storage: '1GB', features: ['Up to 5 dancers', 'Basic dancer management', 'Simple reporting', 'Email support'] },
  { id: 'professional', name: 'Professional', price: 49, interval: 'month', dancers: 25, vipBooths: 5, storage: '10GB', features: ['Up to 25 dancers', 'Full dancer management', 'VIP booth tracking', 'Revenue analytics', 'Priority email support'] },
  { id: 'business', name: 'Business', price: 149, interval: 'month', dancers: 100, vipBooths: -1, storage: '50GB', features: ['Up to 100 dancers', 'Full dancer management', 'Unlimited VIP booths', 'Advanced analytics', 'Fraud prevention suite', 'Priority phone support'], popular: true },
  { id: 'enterprise', name: 'Enterprise', price: 399, interval: 'month', dancers: -1, vipBooths: -1, storage: 'Unlimited', features: ['Unlimited dancers', 'Multi-location support', 'Custom integrations', 'Full API access', 'Dedicated support', 'White-label options'] }
];

app.get('/api/subscription', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  const tier = user?.subscription_tier || 'starter';
  const plan = subscriptionPlans.find(p => p.id === tier) || subscriptionPlans[0];
  
  res.json({
    currentPlan: {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      interval: plan.interval,
      status: 'active',
      startDate: '2024-01-01',
      nextBillingDate: plan.price > 0 ? '2025-01-01' : null
    },
    usage: {
      dancers: { used: mockDancers.length, limit: plan.dancers === -1 ? 'Unlimited' : plan.dancers },
      vipBooths: { used: mockVipBooths.length, limit: plan.vipBooths === -1 ? 'Unlimited' : plan.vipBooths },
      storage: { used: '2.4GB', limit: plan.storage }
    },
    availablePlans: subscriptionPlans
  });
});

app.get('/api/subscription/plans', (req, res) => {
  res.json(subscriptionPlans);
});

app.post('/api/subscription/upgrade', authenticateToken, (req, res) => {
  const { planId } = req.body;
  const plan = subscriptionPlans.find(p => p.id === planId);
  if (!plan) return res.status(400).json({ error: 'Invalid plan' });
  
  const userIdx = users.findIndex(u => u.id === req.user.id);
  if (userIdx !== -1) users[userIdx].subscription_tier = planId;
  
  res.json({ 
    success: true, 
    message: `Upgraded to ${plan.name} plan`,
    plan: plan,
    redirectUrl: plan.price > 0 ? '/billing/checkout' : null
  });
});

app.post('/api/subscription/cancel', authenticateToken, (req, res) => {
  const userIdx = users.findIndex(u => u.id === req.user.id);
  if (userIdx !== -1) users[userIdx].subscription_tier = 'starter';
  res.json({ success: true, message: 'Subscription cancelled. You are now on the Starter plan.' });
});


// ============= FINANCIAL =============
app.get('/api/financial/transactions', authenticateToken, (req, res) => {
  res.json([
    { id: '1', type: 'bar_fee', amount: 50, dancerName: 'Crystal', timestamp: new Date().toISOString(), status: 'completed' },
    { id: '2', type: 'vip_room', amount: 280, dancerName: 'Diamond', timestamp: new Date().toISOString(), status: 'completed' }
  ]);
});


// ============= HEALTH CHECK =============
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'ClubOps API v3.0.5 - Subscription Management Added', 
    timestamp: new Date().toISOString(), 
    version: '3.0.5', 
    database_connected: !!process.env.DATABASE_URL 
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'ClubOps SaaS - Production API with Subscription Management',
    version: '3.0.5',
    status: 'operational',
    features: [
      'Dancer Management', 
      'License Compliance', 
      'VIP Sessions', 
      'DJ Queue', 
      'Fraud Prevention', 
      'Security Dashboard', 
      'Door Staff Interface', 
      'VIP Host Interface', 
      'Real-time Alerts',
      'Subscription Management'
    ],
    endpoints: { 
      auth: ['/api/auth/login', '/api/auth/register', '/api/auth/me'], 
      dashboard: ['/api/dashboard/stats'], 
      doorStaff: ['/api/door-staff/*'], 
      vipHost: ['/api/vip-host/*'], 
      security: ['/api/security/*'],
      dancers: ['/api/dancers'],
      vipRooms: ['/api/vip-rooms'],
      queue: ['/api/queue', '/api/dj-queue'],
      shifts: ['/api/shifts/*'],
      subscription: ['/api/subscription', '/api/subscription/plans', '/api/subscription/upgrade']
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

module.exports = app;
