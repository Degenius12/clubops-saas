const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const { clubId } = req.user;

    // Get basic counts
    const [totalDancers, activeDancers, queueCount, activeVipSessions, todayRevenue, licenseAlerts] = await Promise.all([
      // Total dancers
      prisma.dancers.count({
        where: { clubId, isActive: true }
      }),
      
      // Active dancers (checked in today)
      prisma.financialTransactions.count({
        where: {
          clubId,
          transactionType: 'bar_fee',
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        },
        distinct: ['dancerId']
      }),
      
      // DJ Queue count
      prisma.djQueue.count({
        where: { 
          clubId,
          status: { in: ['queued', 'on_stage'] }
        }
      }),
      
      // Active VIP sessions
      prisma.vipSessions.count({
        where: {
          clubId,
          status: 'active'
        }
      }),
      
      // Today's revenue
      prisma.financialTransactions.aggregate({
        _sum: { amount: true },
        where: {
          clubId,
          isPaid: true,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      
      // License alerts (expiring in 14 days)
      prisma.dancers.count({
        where: {
          clubId,
          isActive: true,
          licenseExpiryDate: {
            lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            gte: new Date()
          }
        }
      })
    ]);

    // Calculate VIP room availability
    const totalVipRooms = await prisma.vipRooms.count({
      where: { clubId, isAvailable: true }
    });

    const stats = {
      totalDancers,
      activeDancers,
      queueCount,
      vipOccupied: activeVipSessions,
      vipTotal: totalVipRooms,
      vipOccupancyRate: totalVipRooms > 0 ? ((activeVipSessions / totalVipRooms) * 100).toFixed(1) : '0.0',
      dailyRevenue: todayRevenue._sum.amount || 0,
      licenseAlerts
    };

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// @route   GET /api/dashboard/activity
// @desc    Get recent activity feed
// @access  Private
router.get('/activity', async (req, res) => {
  try {
    const { clubId } = req.user;

    // Get recent transactions and activities
    const [recentTransactions, recentVipSessions, recentQueueItems] = await Promise.all([
      // Recent financial transactions
      prisma.financialTransactions.findMany({
        where: { clubId },
        include: {
          dancer: {
            select: { stageName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      
      // Recent VIP sessions
      prisma.vipSessions.findMany({
        where: { clubId },
        include: {
          dancer: {
            select: { stageName: true }
          },
          room: {
            select: { roomName: true }
          }
        },
        orderBy: { startedAt: 'desc' },
        take: 3
      }),
      
      // Recent DJ queue activity
      prisma.djQueue.findMany({
        where: { 
          clubId,
          status: { in: ['completed', 'on_stage'] }
        },
        include: {
          dancer: {
            select: { stageName: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 3
      })
    ]);

    // Format activity feed
    const activities = [];

    // Add transaction activities
    recentTransactions.forEach(tx => {
      activities.push({
        id: tx.id,
        type: 'transaction',
        message: `${tx.dancer?.stageName || 'Unknown'} - ${tx.transactionType.replace('_', ' ')} $${tx.amount}`,
        timestamp: tx.createdAt,
        amount: tx.amount
      });
    });

    // Add VIP activities
    recentVipSessions.forEach(session => {
      const status = session.status === 'active' ? 'started' : 'completed';
      activities.push({
        id: session.id,
        type: 'vip',
        message: `${session.dancer.stageName} ${status} VIP session in ${session.room.roomName}`,
        timestamp: session.startedAt,
        duration: session.durationMinutes
      });
    });

    // Add DJ queue activities
    recentQueueItems.forEach(item => {
      activities.push({
        id: item.id,
        type: 'queue',
        message: `${item.dancer.stageName} ${item.status === 'on_stage' ? 'on stage' : 'completed set'} - ${item.stageName}`,
        timestamp: item.updatedAt,
        stage: item.stageName
      });
    });

    // Sort by timestamp and limit to 10 most recent
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentActivity = activities.slice(0, 10);

    res.json(recentActivity);
  } catch (error) {
    console.error('Dashboard activity error:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

module.exports = router;