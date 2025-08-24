// Multi-Tenant Middleware
// Ensures data isolation between clubs (tenants)

const multiTenantMiddleware = (req, res, next) => {
  try {
    // Ensure user context is available (should be set by auth middleware)
    if (!req.user || !req.user.clubId) {
      return res.status(401).json({ error: 'Club context not available. Please authenticate.' });
    }

    // Add club context helper functions to request
    req.tenant = {
      clubId: req.user.clubId,
      
      // Helper to add club_id filter to Prisma queries
      addClubFilter: (query) => {
        if (!query.where) query.where = {};
        query.where.clubId = req.user.clubId;
        return query;
      },

      // Helper to validate that a record belongs to current club
      validateOwnership: async (model, recordId) => {
        const prisma = require('@prisma/client');
        const client = new prisma.PrismaClient();
        
        try {
          const record = await client[model].findFirst({
            where: {
              id: recordId,
              clubId: req.user.clubId
            },
            select: { id: true }
          });
          
          return !!record;
        } catch (error) {
          console.error('Ownership validation error:', error);
          return false;
        } finally {
          await client.$disconnect();
        }
      },

      // Helper to create records with automatic club_id
      createWithClubId: (data) => {
        return {
          ...data,
          clubId: req.user.clubId
        };
      }
    };

    // Validate club_id in request body/params if present
    if (req.body && req.body.clubId && req.body.clubId !== req.user.clubId) {
      return res.status(403).json({ 
        error: 'Access denied. Cannot access data from different club.' 
      });
    }

    if (req.params && req.params.clubId && req.params.clubId !== req.user.clubId) {
      return res.status(403).json({ 
        error: 'Access denied. Cannot access data from different club.' 
      });
    }

    next();
  } catch (error) {
    console.error('Multi-tenant middleware error:', error);
    res.status(500).json({ error: 'Internal server error in tenant isolation.' });
  }
};

// Middleware to validate resource ownership before operations
const validateResourceOwnership = (model) => {
  return async (req, res, next) => {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const resourceId = req.params.id || req.params.dancerId || req.params.queueId || req.params.roomId;
      
      if (!resourceId) {
        return res.status(400).json({ error: 'Resource ID is required.' });
      }

      // Check if the resource belongs to the user's club
      const resource = await prisma[model].findFirst({
        where: {
          id: resourceId,
          clubId: req.user.clubId
        },
        select: { id: true }
      });

      if (!resource) {
        return res.status(404).json({ 
          error: 'Resource not found or access denied.',
          resourceType: model,
          resourceId: resourceId
        });
      }

      // Add resource validation info to request
      req.validatedResource = {
        id: resourceId,
        model: model,
        exists: true
      };

      await prisma.$disconnect();
      next();
    } catch (error) {
      console.error('Resource ownership validation error:', error);
      res.status(500).json({ error: 'Internal server error during resource validation.' });
    }
  };
};

module.exports = {
  multiTenantMiddleware,
  validateResourceOwnership
};
