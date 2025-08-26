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

const rateLimitMiddleware = (req, res, next) => {
  const tier = req.subscriptionTier || 'free';
  const limits = RATE_LIMITS[tier];

  const limiter = rateLimit({
    windowMs: limits.windowMs,
    max: limits.requests,
    message: `Rate limit exceeded for ${tier} tier. Max ${limits.requests} requests per hour.`,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return `${req.clubId}-${req.ip}`;
    }
  });

  limiter(req, res, next);
};

module.exports = rateLimitMiddleware;