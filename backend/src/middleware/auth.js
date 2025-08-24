// Authentication Middleware
// JWT token validation and user context setting

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database with club info
    const user = await prisma.clubUser.findUnique({
      where: { id: decoded.userId },
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
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated.' });
    }

    if (user.club.subscriptionStatus !== 'active' && user.club.subscriptionStatus !== 'trialing') {
      return res.status(403).json({ error: 'Club subscription is not active.' });
    }

    // Set user context for downstream middleware and routes
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      clubId: user.clubId,
      club: user.club
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};

// Role-based access control middleware factory
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    next();
  };
};

// Subscription tier access control
const requireTier = (minTier) => {
  const tierHierarchy = { 'free': 0, 'basic': 1, 'pro': 2, 'enterprise': 3 };
  
  return (req, res, next) => {
    if (!req.user || !req.user.club) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const userTierLevel = tierHierarchy[req.user.club.subscriptionTier] || 0;
    const requiredTierLevel = tierHierarchy[minTier] || 0;

    if (userTierLevel < requiredTierLevel) {
      return res.status(403).json({ 
        error: 'Subscription tier insufficient for this feature.',
        currentTier: req.user.club.subscriptionTier,
        requiredTier: minTier
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  requireRole,
  requireTier
};
