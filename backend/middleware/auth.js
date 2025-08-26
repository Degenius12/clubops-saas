const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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
    const user = await prisma.clubUser.findUnique({
      where: { id: req.user.id },
      include: {
        club: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Verify club has active subscription
    if (!user.club || user.club.subscriptionStatus === 'cancelled') {
      return res.status(403).json({ error: 'Club subscription inactive' });
    }

    // Add full user and club info to request
    req.fullUser = user;
    req.club = user.club;
    
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

// Subscription tier middleware with feature flag checking
const requireSubscription = (...tiers) => {
  return async (req, res, next) => {
    try {
      if (!req.club) {
        return res.status(403).json({ error: 'No club information' });
      }

      const { subscriptionTier, subscriptionStatus } = req.club;
      
      // Check if subscription is active
      if (subscriptionStatus === 'cancelled' || subscriptionStatus === 'past_due') {
        return res.status(403).json({ 
          error: 'Subscription required',
          message: 'Please update your subscription to access this feature'
        });
      }

      // Check if subscription tier allows access
      if (!tiers.includes(subscriptionTier)) {
        return res.status(403).json({ 
          error: 'Subscription upgrade required',
          message: `This feature requires: ${tiers.join(' or ')} subscription`,
          currentTier: subscriptionTier,
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

// Feature flag middleware - checks if feature is enabled for subscription tier
const requireFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      if (!req.club) {
        return res.status(403).json({ error: 'No club information' });
      }

      // Get feature flag
      const feature = await prisma.featureFlag.findUnique({
        where: { featureName }
      });

      if (!feature) {
        return res.status(404).json({ error: 'Feature not found' });
      }

      const tier = req.club.subscriptionTier;
      let hasAccess = false;

      switch (tier) {
        case 'free':
          hasAccess = feature.freeTier;
          break;
        case 'basic':
          hasAccess = feature.basicTier;
          break;
        case 'pro':
          hasAccess = feature.proTier;
          break;
        case 'enterprise':
          hasAccess = feature.enterpriseTier;
          break;
      }

      if (!hasAccess) {
        return res.status(403).json({
          error: 'Feature not available',
          message: `${featureName} is not available in your ${tier} plan`,
          feature: featureName,
          currentTier: tier
        });
      }

      next();
    } catch (error) {
      console.error('Feature flag middleware error:', error);
      res.status(500).json({ error: 'Server error in feature check' });
    }
  };
};

module.exports = { auth, authorize, requireSubscription, requireFeature };