const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');
const pushNotificationService = require('../services/pushNotificationService');

const prisma = new PrismaClient();
const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// ==============================================
// SUBSCRIPTION MANAGEMENT
// ==============================================

// @route   GET /api/push-notifications/vapid-public-key
// @desc    Get VAPID public key for frontend subscription
// @access  Private
router.get('/vapid-public-key', (req, res) => {
  try {
    const publicKey = pushNotificationService.getVapidPublicKey();
    res.json({ publicKey });
  } catch (error) {
    console.error('Error getting VAPID key:', error);
    res.status(500).json({ error: 'Failed to get VAPID key' });
  }
});

// @route   POST /api/push-notifications/subscribe
// @desc    Subscribe to push notifications
// @access  Private
router.post('/subscribe', async (req, res) => {
  try {
    const { id: userId, clubId } = req.user;
    const { 
      endpoint, 
      keys, 
      preferences = {},
      deviceInfo = {}
    } = req.body;

    // Validate required fields
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ 
        error: 'Missing required subscription data' 
      });
    }

    // Check if subscription already exists
    const existingSubscription = await prisma.pushSubscription.findFirst({
      where: {
        userId,
        endpoint
      }
    });

    if (existingSubscription) {
      // Update existing subscription
      const updatedSubscription = await prisma.pushSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          p256dhKey: keys.p256dh,
          authKey: keys.auth,
          userAgent: deviceInfo.userAgent,
          deviceType: deviceInfo.deviceType,
          browserName: deviceInfo.browserName,
          browserVersion: deviceInfo.browserVersion,
          enabled: true,
          shiftUpdates: preferences.shiftUpdates !== false,
          swapRequests: preferences.swapRequests !== false,
          emergencyAlerts: preferences.emergencyAlerts !== false,
          generalUpdates: preferences.generalUpdates === true,
          lastUsedAt: new Date(),
          failureCount: 0, // Reset failure count
          lastFailureAt: null
        }
      });

      return res.json({
        message: 'Subscription updated successfully',
        subscription: updatedSubscription
      });
    }

    // Create new subscription
    const subscription = await prisma.pushSubscription.create({
      data: {
        clubId,
        userId,
        endpoint,
        p256dhKey: keys.p256dh,
        authKey: keys.auth,
        userAgent: deviceInfo.userAgent,
        deviceType: deviceInfo.deviceType,
        browserName: deviceInfo.browserName,
        browserVersion: deviceInfo.browserVersion,
        shiftUpdates: preferences.shiftUpdates !== false,
        swapRequests: preferences.swapRequests !== false,
        emergencyAlerts: preferences.emergencyAlerts !== false,
        generalUpdates: preferences.generalUpdates === true
      }
    });

    res.status(201).json({
      message: 'Subscribed to push notifications successfully',
      subscription
    });
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    res.status(500).json({ error: 'Failed to subscribe to push notifications' });
  }
});

// @route   PUT /api/push-notifications/preferences
// @desc    Update notification preferences
// @access  Private
router.put('/preferences', async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { preferences } = req.body;

    const updatedSubscriptions = await prisma.pushSubscription.updateMany({
      where: { userId },
      data: {
        shiftUpdates: preferences.shiftUpdates,
        swapRequests: preferences.swapRequests,
        emergencyAlerts: preferences.emergencyAlerts,
        generalUpdates: preferences.generalUpdates
      }
    });

    res.json({
      message: 'Preferences updated successfully',
      updatedCount: updatedSubscriptions.count
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// @route   DELETE /api/push-notifications/unsubscribe
// @desc    Unsubscribe from push notifications
// @access  Private
router.delete('/unsubscribe', async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { endpoint } = req.body;

    if (endpoint) {
      // Unsubscribe specific endpoint
      await prisma.pushSubscription.deleteMany({
        where: {
          userId,
          endpoint
        }
      });
    } else {
      // Unsubscribe all user's subscriptions
      await prisma.pushSubscription.deleteMany({
        where: { userId }
      });
    }

    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

// @route   GET /api/push-notifications/subscriptions
// @desc    Get user's subscriptions
// @access  Private
router.get('/subscriptions', async (req, res) => {
  try {
    const { id: userId } = req.user;

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
      select: {
        id: true,
        endpoint: true,
        deviceType: true,
        browserName: true,
        browserVersion: true,
        enabled: true,
        shiftUpdates: true,
        swapRequests: true,
        emergencyAlerts: true,
        generalUpdates: true,
        createdAt: true,
        lastUsedAt: true,
        failureCount: true
      }
    });

    res.json(subscriptions);
  } catch (error) {
    console.error('Error getting subscriptions:', error);
    res.status(500).json({ error: 'Failed to get subscriptions' });
  }
});

// ==============================================
// NOTIFICATION SENDING (Manager+ only)
// ==============================================

// @route   POST /api/push-notifications/send
// @desc    Send custom push notification
// @access  Manager, Super Manager, Owner only
router.post('/send', authorize('MANAGER', 'SUPER_MANAGER', 'OWNER'), async (req, res) => {
  try {
    const { clubId } = req.user;
    const { 
      title, 
      body, 
      url = '/dashboard',
      icon,
      image,
      recipients = 'all', // 'all', 'managers', or array of user IDs
      preferences = {},
      requireInteraction = false,
      actions = []
    } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const notification = {
      title,
      body,
      url,
      icon,
      image,
      requireInteraction,
      actions,
      type: 'CUSTOM',
      notificationId: `custom_${clubId}_${Date.now()}`,
      data: {
        source: 'manager',
        timestamp: Date.now()
      }
    };

    let result;

    if (recipients === 'all') {
      // Send to all club members
      result = await pushNotificationService.sendToClub(clubId, notification, preferences);
    } else if (recipients === 'managers') {
      // Send to managers only
      const managers = await prisma.clubUser.findMany({
        where: {
          clubId,
          role: { in: ['MANAGER', 'SUPER_MANAGER', 'OWNER'] },
          isActive: true
        }
      });

      const results = [];
      for (const manager of managers) {
        const managerResult = await pushNotificationService.sendToUser(manager.id, clubId, notification);
        results.push(managerResult);
      }

      result = {
        success: true,
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      };
    } else if (Array.isArray(recipients)) {
      // Send to specific users
      const results = [];
      for (const userId of recipients) {
        const userResult = await pushNotificationService.sendToUser(userId, clubId, notification);
        results.push(userResult);
      }

      result = {
        success: true,
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      };
    } else {
      return res.status(400).json({ error: 'Invalid recipients parameter' });
    }

    res.json({
      message: 'Notification sent successfully',
      ...result
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// @route   POST /api/push-notifications/emergency
// @desc    Send emergency alert to all users
// @access  Manager, Super Manager, Owner only
router.post('/emergency', authorize('MANAGER', 'SUPER_MANAGER', 'OWNER'), async (req, res) => {
  try {
    const { clubId } = req.user;
    const { message, url = '/dashboard' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required for emergency alert' });
    }

    const result = await pushNotificationService.sendEmergencyAlert(clubId, message, url);

    res.json({
      message: 'Emergency alert sent successfully',
      ...result
    });
  } catch (error) {
    console.error('Error sending emergency alert:', error);
    res.status(500).json({ error: 'Failed to send emergency alert' });
  }
});

// ==============================================
// NOTIFICATION HISTORY & ANALYTICS
// ==============================================

// @route   GET /api/push-notifications/history
// @desc    Get notification history
// @access  Manager, Super Manager, Owner only
router.get('/history', authorize('MANAGER', 'SUPER_MANAGER', 'OWNER'), async (req, res) => {
  try {
    const { clubId } = req.user;
    const { 
      page = 1, 
      limit = 50, 
      type, 
      status, 
      startDate, 
      endDate 
    } = req.query;

    const where = { clubId };

    if (type) where.notificationType = type;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.sentAt = {};
      if (startDate) where.sentAt.gte = new Date(startDate);
      if (endDate) where.sentAt.lte = new Date(endDate);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total] = await Promise.all([
      prisma.pushNotificationLog.findMany({
        where,
        include: {
          subscription: {
            select: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              deviceType: true,
              browserName: true
            }
          }
        },
        orderBy: { sentAt: 'desc' },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.pushNotificationLog.count({ where })
    ]);

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting notification history:', error);
    res.status(500).json({ error: 'Failed to get notification history' });
  }
});

// @route   GET /api/push-notifications/analytics
// @desc    Get notification analytics
// @access  Manager, Super Manager, Owner only
router.get('/analytics', authorize('MANAGER', 'SUPER_MANAGER', 'OWNER'), async (req, res) => {
  try {
    const { clubId } = req.user;
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get notification stats
    const stats = await prisma.pushNotificationLog.groupBy({
      by: ['status', 'notificationType'],
      where: {
        clubId,
        sentAt: { gte: startDate }
      },
      _count: true
    });

    // Get daily breakdown
    const dailyStats = await prisma.pushNotificationLog.findMany({
      where: {
        clubId,
        sentAt: { gte: startDate }
      },
      select: {
        sentAt: true,
        status: true,
        notificationType: true,
        clickedAt: true
      }
    });

    // Process daily stats
    const dailyBreakdown = {};
    dailyStats.forEach(notification => {
      const date = notification.sentAt.toISOString().split('T')[0];
      if (!dailyBreakdown[date]) {
        dailyBreakdown[date] = { sent: 0, delivered: 0, clicked: 0, failed: 0 };
      }
      
      dailyBreakdown[date].sent++;
      if (notification.status === 'DELIVERED') dailyBreakdown[date].delivered++;
      if (notification.status === 'FAILED') dailyBreakdown[date].failed++;
      if (notification.clickedAt) dailyBreakdown[date].clicked++;
    });

    // Get subscription stats
    const subscriptionStats = await prisma.pushSubscription.groupBy({
      by: ['deviceType', 'enabled'],
      where: { clubId },
      _count: true
    });

    res.json({
      stats: stats.reduce((acc, stat) => {
        const key = `${stat.notificationType}_${stat.status}`;
        acc[key] = stat._count;
        return acc;
      }, {}),
      dailyBreakdown,
      subscriptionStats: subscriptionStats.reduce((acc, stat) => {
        const key = `${stat.deviceType}_${stat.enabled ? 'enabled' : 'disabled'}`;
        acc[key] = stat._count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error getting notification analytics:', error);
    res.status(500).json({ error: 'Failed to get notification analytics' });
  }
});

// ==============================================
// INTERACTION TRACKING
// ==============================================

// @route   POST /api/push-notifications/interaction
// @desc    Track notification interaction (click, dismiss)
// @access  Private (called from service worker)
router.post('/interaction', async (req, res) => {
  try {
    const { notificationId, action, timestamp } = req.body;

    if (!notificationId || !action) {
      return res.status(400).json({ error: 'Notification ID and action are required' });
    }

    // Find notification log by notification ID
    const notification = await prisma.pushNotificationLog.findFirst({
      where: {
        id: notificationId
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Update interaction data
    const updateData = {
      action
    };

    if (action === 'click') {
      updateData.clickedAt = new Date(timestamp || Date.now());
      updateData.status = 'DELIVERED'; // Mark as delivered if clicked
    } else if (action === 'dismiss') {
      updateData.dismissedAt = new Date(timestamp || Date.now());
    }

    await prisma.pushNotificationLog.update({
      where: { id: notification.id },
      data: updateData
    });

    res.json({ message: 'Interaction tracked successfully' });
  } catch (error) {
    console.error('Error tracking notification interaction:', error);
    res.status(500).json({ error: 'Failed to track interaction' });
  }
});

// ==============================================
// TEST ENDPOINTS (Development only)
// ==============================================

// @route   POST /api/push-notifications/test
// @desc    Send test notification (development only)
// @access  Owner only
router.post('/test', authorize('OWNER'), async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Test endpoint not available in production' });
    }

    const { id: userId, clubId } = req.user;

    const testNotification = {
      title: '🧪 Test Notification',
      body: 'This is a test push notification from ClubFlow',
      url: '/dashboard',
      type: 'TEST',
      notificationId: `test_${Date.now()}`,
      actions: [
        { action: 'view_dashboard', title: 'View Dashboard' }
      ],
      data: { test: true }
    };

    const result = await pushNotificationService.sendToUser(userId, clubId, testNotification);

    res.json({
      message: 'Test notification sent',
      result
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

module.exports = router;