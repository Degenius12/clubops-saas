const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// CORS with all origins for testing
app.use(cors());
app.use(express.json());

// Test data
const testUsers = [
  {
    id: 1,
    email: 'admin@clubops.com',
    // Pre-hashed "password"
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMye.IACBhGhLfhQPwjJJK7.C8xhA2mFOEC',
    name: 'Admin User',
    role: 'owner',
    club_id: '1',
    subscription_tier: 'enterprise'
  }
];

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'ClubOps Backend Working!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', time: new Date().toISOString() });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = testUsers.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { user: { id: user.id, email: user.email } },
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
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;