const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Club = require('../models/Club');

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization');
    
    if (!token || !token.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    // Extract token from Bearer format
    const authToken = token.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'fallback_secret_key');
    
    // Add user to request
    req.user = decoded.user;
    
    // Verify user still exists and is active
    const user = await User.findById(req.user.id).populate('clubId');
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Verify club is active and subscription is valid
    if (!user.clubId || !user.clubId.isActive) {
      return res.status(403).json({ error: 'Club inactive or subscription suspended' });
    }

    // Add full user and club info to request
    req.fullUser = user;
    req.club = user.clubId;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(500).json({ error: 'Server error in authentication' });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: `Requires one of: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Subscription tier middleware
const requireSubscription = (...tiers) => {
  return async (req, res, next) => {
    try {
      if (!req.club || !req.club.subscription) {
        return res.status(403).json({ error: 'No subscription information' });
      }

      const { subscription } = req.club;
      
      // Check if subscription is active
      if (subscription.status !== 'active' && subscription.status !== 'trial') {
        return res.status(403).json({ 
          error: 'Subscription required',
          message: 'Please upgrade your subscription to access this feature'
        });
      }

      // Check if subscription tier allows access
      if (!tiers.includes(subscription.tier)) {
        return res.status(403).json({ 
          error: 'Subscription upgrade required',
          message: `This feature requires: ${tiers.join(' or ')} subscription`,
          currentTier: subscription.tier,
          requiredTiers: tiers
        });
      }

      next();
    } catch (error) {
      console.error('Subscription middleware error:', error);
      res.status(500).json({ error: 'Server error in subscription check' });
    }
  };
};

module.exports = { auth, authorize, requireSubscription };