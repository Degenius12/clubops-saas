// ClubOps - Multi-tenant Middleware
// Ensures data isolation between clubs

const multiTenantMiddleware = async (req, res, next) => {
  try {
    // Skip multi-tenant for auth and webhook routes
    if (req.path.includes('/auth') || req.path.includes('/webhooks')) {
      return next();
    }

    // Extract club info from authenticated user
    if (req.user && req.user.clubId) {
      req.clubId = req.user.clubId;
      req.subscriptionTier = req.user.club?.subscriptionTier || 'free';
    } else {
      return res.status(401).json({ error: 'Club context required' });
    }

    next();
  } catch (error) {
    console.error('Multi-tenant middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

module.exports = multiTenantMiddleware;