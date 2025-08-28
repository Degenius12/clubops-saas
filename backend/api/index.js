// ClubOps API - Ultra Simple Working Version
const express = require('express');
const cors = require('cors');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Test accounts
const users = [
  {
    id: 1,
    email: 'admin@clubops.com',
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMye.IACBhGhLfhQPwjJJK7.C8xhA2mFOEC', // "password"
    name: 'Admin User',
    role: 'owner',
    club_id: '1',
    subscription_tier: 'enterprise'
  },
  {
    id: 2,
    email: 'test@test.com',
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMye.IACBhGhLfhQPwjJJK7.C8xhA2mFOEC', // "password" 
    name: 'Test User',
    role: 'manager',
    club_id: '2',
    subscription_tier: 'pro'
  }
];

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'ClubOps API running' });
});

app.get('/', (req, res) => {
  res.json({ message: 'ClubOps API', version: '1.0.0' });
});

// Login
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

    const isValid = await bcryptjs.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, clubName, ownerName } = req.body;
    
    if (!email || !password || !clubName || !ownerName) {
      return res.status(400).json({ error: 'All fields required' });
    }

    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    
    const newUser = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      name: ownerName,
      role: 'owner',
      club_id: (users.length + 1).toString(),
      subscription_tier: 'free'
    };

    users.push(newUser);

    const token = jwt.sign(
      { user: { id: newUser.id, email: newUser.email, role: newUser.role } },
      'secret123',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        club_id: newUser.club_id,
        subscription_tier: newUser.subscription_tier
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

module.exports = app;