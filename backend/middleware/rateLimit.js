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

// Create limiters at initialization time (not in request handler)
const limiters = {};
for (const [tier, limits] of Object.entries(RATE_LIMITS)) {
  limiters[tier] = rateLimit({
    windowMs: limits.windowMs,
    max: limits.requests,
    message: `Rate limit exceeded for ${tier} tier. Max ${limits.requests} requests per hour.`,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip if tier doesn't match (let another limiter handle it)
      const requestTier = req.subscriptionTier || 'free';
      return requestTier !== tier;
    }
    // Remove custom keyGenerator to use default (fixes IPv6 issue)
  });
}

const rateLimitMiddleware = (req, res, next) => {
  const tier = req.subscriptionTier || 'free';
  const limiter = limiters[tier];

  if (!limiter) {
    // If tier not found, use free tier as fallback
    limiters.free(req, res, next);
  } else {
    limiter(req, res, next);
  }
};

module.exports = rateLimitMiddleware;