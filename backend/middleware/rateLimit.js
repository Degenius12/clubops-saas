// ClubOps - Subscription-based Rate Limiting
// Enforces API limits based on subscription tier

const rateLimit = require('express-rate-limit');

// Tier-based rate limits (per hour)
const RATE_LIMITS = {
  free: { requests: 100, windowMs: 60 * 60 * 1000 },
  basic: { requests: 500, windowMs: 60 * 60 * 1000 },
  pro: { requests: 2000, windowMs: 60 * 60 * 1000 },
  enterprise: { requests: 10000, windowMs: 60 * 60 * 1000 }
};

// Create a single rate limiter at initialization (not per-tier to avoid complexity)
const defaultLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req) => {
    // Dynamically set max based on subscription tier
    const tier = req.subscriptionTier || 'free';
    return RATE_LIMITS[tier]?.requests || RATE_LIMITS.free.requests;
  },
  message: (req) => {
    const tier = req.subscriptionTier || 'free';
    const limit = RATE_LIMITS[tier]?.requests || RATE_LIMITS.free.requests;
    return `Rate limit exceeded for ${tier} tier. Max ${limit} requests per hour.`;
  },
  standardHeaders: true,
  legacyHeaders: false
  // Use default keyGenerator (fixes IPv6 issue)
});

// Export the limiter directly - it's already configured to handle all tiers
module.exports = defaultLimiter;