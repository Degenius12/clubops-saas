// Multi-Club Management API (Features #29-30)
const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// ============================================================================
// MULTI-CLUB SWITCHING (Feature #29)
// ============================================================================

// @route   GET /api/multi-club/owned-clubs
// @desc    Get list of clubs owned by the current user
// @access  Private (Owner only)
router.get('/owned-clubs', [
  auth,
  authorize('OWNER')
], async (req, res) => {
  try {
    const { email } = req.user;

    // Find all clubs where this user is an owner
    const userClubs = await prisma.clubUser.findMany({
      where: {
        email,
        role: 'OWNER',
        isActive: true
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            subscriptionTier: true,
            subscriptionStatus: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        club: {
          name: 'asc'
        }
      }
    });

    const clubs = userClubs.map(uc => ({
      ...uc.club,
      isCurrentClub: uc.clubId === req.user.clubId
    }));

    res.json({
      success: true,
      count: clubs.length,
      currentClubId: req.user.clubId,
      clubs
    });

  } catch (error) {
    console.error('Get owned clubs error:', error);
    res.status(500).json({ error: 'Failed to fetch owned clubs' });
  }
});

// @route   POST /api/multi-club/switch
// @desc    Switch to a different owned club
// @access  Private (Owner only)
router.post('/switch', [
  auth,
  authorize('OWNER')
], async (req, res) => {
  try {
    const { email, id: currentUserId } = req.user;
    const { clubId } = req.body;

    if (!clubId) {
      return res.status(400).json({ error: 'Club ID is required' });
    }

    // Verify the user owns this club
    const targetClubUser = await prisma.clubUser.findFirst({
      where: {
        email,
        clubId,
        role: 'OWNER',
        isActive: true
      },
      include: {
        club: true
      }
    });

    if (!targetClubUser) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have owner access to this club'
      });
    }

    if (targetClubUser.club.subscriptionStatus === 'cancelled') {
      return res.status(403).json({
        error: 'Club subscription inactive',
        message: 'This club\'s subscription has been cancelled'
      });
    }

    // Generate new JWT token for the new club
    const payload = {
      user: {
        id: targetClubUser.id,
        clubId: targetClubUser.clubId,
        email: targetClubUser.email,
        role: targetClubUser.role
      }
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: `Switched to ${targetClubUser.club.name}`,
      token,
      user: {
        id: targetClubUser.id,
        email: targetClubUser.email,
        role: targetClubUser.role,
        clubId: targetClubUser.clubId,
        clubName: targetClubUser.club.name
      }
    });

  } catch (error) {
    console.error('Switch club error:', error);
    res.status(500).json({ error: 'Failed to switch clubs' });
  }
});

// ============================================================================
// AGGREGATE MULTI-CLUB DATA (Feature #30)
// ============================================================================

// @route   GET /api/multi-club/aggregate-revenue
// @desc    Get aggregate revenue across all owned clubs
// @access  Private (Owner only)
router.get('/aggregate-revenue', [
  auth,
  authorize('OWNER')
], async (req, res) => {
  try {
    const { email } = req.user;
    const { startDate, endDate } = req.query;

    // Get all clubs owned by this user
    const userClubs = await prisma.clubUser.findMany({
      where: {
        email,
        role: 'OWNER',
        isActive: true
      },
      select: {
        clubId: true,
        club: {
          select: {
            id: true,
            name: true,
            subdomain: true
          }
        }
      }
    });

    const clubIds = userClubs.map(uc => uc.clubId);

    if (clubIds.length === 0) {
      return res.json({
        success: true,
        clubs: [],
        aggregate: {
          totalRevenue: 0,
          totalTransactions: 0,
          totalPaid: 0,
          totalPending: 0
        },
        byClub: []
      });
    }

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.lte = end;
      }
    }

    // Get all financial transactions across all owned clubs
    const transactions = await prisma.financialTransaction.findMany({
      where: {
        clubId: { in: clubIds },
        ...dateFilter
      },
      select: {
        clubId: true,
        amount: true,
        status: true,
        category: true,
        createdAt: true
      }
    });

    // Aggregate by club
    const byClub = clubIds.map(clubId => {
      const clubTransactions = transactions.filter(t => t.clubId === clubId);
      const clubInfo = userClubs.find(uc => uc.clubId === clubId);

      const summary = clubTransactions.reduce((acc, tx) => {
        const amount = parseFloat(tx.amount);
        acc.total += amount;
        acc.count++;

        if (tx.status === 'PAID') {
          acc.paid += amount;
        } else if (tx.status === 'PENDING') {
          acc.pending += amount;
        }

        // By category
        const category = tx.category || 'OTHER';
        if (!acc.byCategory[category]) {
          acc.byCategory[category] = 0;
        }
        acc.byCategory[category] += amount;

        return acc;
      }, {
        total: 0,
        paid: 0,
        pending: 0,
        count: 0,
        byCategory: {}
      });

      return {
        clubId,
        clubName: clubInfo.club.name,
        clubSubdomain: clubInfo.club.subdomain,
        revenue: parseFloat(summary.total.toFixed(2)),
        paid: parseFloat(summary.paid.toFixed(2)),
        pending: parseFloat(summary.pending.toFixed(2)),
        transactionCount: summary.count,
        byCategory: Object.entries(summary.byCategory).reduce((acc, [key, value]) => {
          acc[key] = parseFloat(value.toFixed(2));
          return acc;
        }, {})
      };
    });

    // Calculate aggregate totals
    const aggregate = byClub.reduce((acc, club) => {
      acc.totalRevenue += club.revenue;
      acc.totalPaid += club.paid;
      acc.totalPending += club.pending;
      acc.totalTransactions += club.transactionCount;
      return acc;
    }, {
      totalRevenue: 0,
      totalPaid: 0,
      totalPending: 0,
      totalTransactions: 0
    });

    // Round aggregate totals
    aggregate.totalRevenue = parseFloat(aggregate.totalRevenue.toFixed(2));
    aggregate.totalPaid = parseFloat(aggregate.totalPaid.toFixed(2));
    aggregate.totalPending = parseFloat(aggregate.totalPending.toFixed(2));

    res.json({
      success: true,
      dateRange: {
        start: startDate || null,
        end: endDate || null
      },
      clubs: userClubs.map(uc => ({
        id: uc.club.id,
        name: uc.club.name,
        subdomain: uc.club.subdomain
      })),
      aggregate,
      byClub: byClub.sort((a, b) => b.revenue - a.revenue) // Sort by revenue descending
    });

  } catch (error) {
    console.error('Aggregate revenue error:', error);
    res.status(500).json({ error: 'Failed to fetch aggregate revenue' });
  }
});

// @route   GET /api/multi-club/aggregate-stats
// @desc    Get aggregate statistics across all owned clubs
// @access  Private (Owner only)
router.get('/aggregate-stats', [
  auth,
  authorize('OWNER')
], async (req, res) => {
  try {
    const { email } = req.user;
    const { startDate, endDate } = req.query;

    // Get all clubs owned by this user
    const userClubs = await prisma.clubUser.findMany({
      where: {
        email,
        role: 'OWNER',
        isActive: true
      },
      select: {
        clubId: true,
        club: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const clubIds = userClubs.map(uc => uc.clubId);

    if (clubIds.length === 0) {
      return res.json({
        success: true,
        aggregate: {
          totalEntertainers: 0,
          totalCheckIns: 0,
          totalVIPSessions: 0,
          totalAlerts: 0
        },
        byClub: []
      });
    }

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.lte = end;
      }
    }

    // Get stats for each club
    const statsPromises = clubIds.map(async (clubId) => {
      const clubInfo = userClubs.find(uc => uc.clubId === clubId);

      const [
        entertainerCount,
        checkInCount,
        vipSessionCount,
        alertCount
      ] = await Promise.all([
        prisma.entertainer.count({ where: { clubId, isActive: true } }),
        prisma.entertainerCheckIn.count({
          where: { clubId, ...(startDate || endDate ? { checkInTime: dateFilter.createdAt } : {}) }
        }),
        prisma.vipSession.count({
          where: { clubId, ...(startDate || endDate ? { startTime: dateFilter.createdAt } : {}) }
        }),
        prisma.verificationAlert.count({ where: { clubId, ...dateFilter } })
      ]);

      return {
        clubId,
        clubName: clubInfo.club.name,
        totalEntertainers: entertainerCount,
        totalCheckIns: checkInCount,
        totalVIPSessions: vipSessionCount,
        totalAlerts: alertCount
      };
    });

    const byClub = await Promise.all(statsPromises);

    // Calculate aggregates
    const aggregate = byClub.reduce((acc, club) => {
      acc.totalEntertainers += club.totalEntertainers;
      acc.totalCheckIns += club.totalCheckIns;
      acc.totalVIPSessions += club.totalVIPSessions;
      acc.totalAlerts += club.totalAlerts;
      return acc;
    }, {
      totalEntertainers: 0,
      totalCheckIns: 0,
      totalVIPSessions: 0,
      totalAlerts: 0
    });

    res.json({
      success: true,
      dateRange: {
        start: startDate || null,
        end: endDate || null
      },
      aggregate,
      byClub
    });

  } catch (error) {
    console.error('Aggregate stats error:', error);
    res.status(500).json({ error: 'Failed to fetch aggregate stats' });
  }
});

module.exports = router;
