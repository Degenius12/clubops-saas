const webpush = require('web-push');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// VAPID keys for web push (in production, these should be environment variables)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BBT9Q6q-i7KIaDODfK8MporhkttsUF7dOFbtz9zI_JPKs-jPixTdig6zhuLTBML-X2mJ9rxtuqpuOCmu8INpnfg';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'r7vrkxpg3QquS8h1bCjhX1-g4cmMizVjN6zBtlaPYgk';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'admin@clubflowapp.com';

// Configure web-push
webpush.setVapidDetails(
  `mailto:${VAPID_EMAIL}`,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

class PushNotificationService {
  /**
   * Send a push notification to a specific user
   */
  async sendToUser(userId, clubId, notification) {
    try {
      // Get active subscriptions for the user
      const subscriptions = await prisma.pushSubscription.findMany({
        where: {
          userId,
          clubId,
          enabled: true,
          failureCount: { lt: 5 } // Skip subscriptions with too many failures
        }
      });

      if (subscriptions.length === 0) {
        console.log(`No active push subscriptions found for user ${userId}`);
        return { success: false, reason: 'No active subscriptions' };
      }

      const results = [];
      
      for (const subscription of subscriptions) {
        try {
          const result = await this.sendToSubscription(subscription, notification);
          results.push(result);
        } catch (error) {
          console.error(`Failed to send push to subscription ${subscription.id}:`, error);
          await this.handleFailure(subscription.id, error.message);
        }
      }

      return {
        success: true,
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      };
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to all users with specific preferences
   */
  async sendToClub(clubId, notification, preferences = {}) {
    try {
      const where = {
        clubId,
        enabled: true,
        failureCount: { lt: 5 }
      };

      // Apply preference filters
      if (preferences.shiftUpdates !== undefined) {
        where.shiftUpdates = preferences.shiftUpdates;
      }
      if (preferences.swapRequests !== undefined) {
        where.swapRequests = preferences.swapRequests;
      }
      if (preferences.emergencyAlerts !== undefined) {
        where.emergencyAlerts = preferences.emergencyAlerts;
      }
      if (preferences.generalUpdates !== undefined) {
        where.generalUpdates = preferences.generalUpdates;
      }

      const subscriptions = await prisma.pushSubscription.findMany({ where });

      if (subscriptions.length === 0) {
        console.log(`No matching subscriptions found for club ${clubId}`);
        return { success: false, reason: 'No matching subscriptions' };
      }

      const results = [];
      
      // Send notifications in batches to avoid overwhelming the service
      const batchSize = 100;
      for (let i = 0; i < subscriptions.length; i += batchSize) {
        const batch = subscriptions.slice(i, i + batchSize);
        const batchPromises = batch.map(subscription => 
          this.sendToSubscription(subscription, notification)
            .catch(error => {
              console.error(`Failed to send push to subscription ${subscription.id}:`, error);
              this.handleFailure(subscription.id, error.message);
              return { success: false, error: error.message };
            })
        );
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      return {
        success: true,
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        totalSubscriptions: subscriptions.length,
        results
      };
    } catch (error) {
      console.error('Error sending push notification to club:', error);
      throw error;
    }
  }

  /**
   * Send push notification to a specific subscription
   */
  async sendToSubscription(subscription, notification) {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dhKey,
          auth: subscription.authKey
        }
      };

      // Build notification payload
      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/icons/icon-192x192.png',
        badge: notification.badge || '/icons/badge-72x72.png',
        image: notification.image,
        url: notification.url || '/',
        tag: notification.tag,
        requireInteraction: notification.requireInteraction || false,
        actions: notification.actions || [],
        data: {
          ...notification.data,
          notificationId: notification.notificationId,
          timestamp: Date.now()
        }
      });

      // Send the notification
      const response = await webpush.sendNotification(pushSubscription, payload);

      // Log successful delivery
      await this.logNotification(subscription, notification, 'SENT');

      // Update subscription last used time
      await prisma.pushSubscription.update({
        where: { id: subscription.id },
        data: { lastUsedAt: new Date() }
      });

      return {
        success: true,
        subscriptionId: subscription.id,
        response: {
          statusCode: response.statusCode,
          headers: response.headers
        }
      };
    } catch (error) {
      await this.logNotification(subscription, notification, 'FAILED', error.message);
      throw error;
    }
  }

  /**
   * Handle subscription failure (expired, invalid, etc.)
   */
  async handleFailure(subscriptionId, reason) {
    try {
      const subscription = await prisma.pushSubscription.findUnique({
        where: { id: subscriptionId }
      });

      if (!subscription) return;

      const failureCount = subscription.failureCount + 1;
      
      // If too many failures, disable the subscription
      const shouldDisable = failureCount >= 5;

      await prisma.pushSubscription.update({
        where: { id: subscriptionId },
        data: {
          failureCount,
          lastFailureAt: new Date(),
          enabled: !shouldDisable
        }
      });

      if (shouldDisable) {
        console.log(`Disabled push subscription ${subscriptionId} after ${failureCount} failures`);
      }
    } catch (error) {
      console.error('Error handling subscription failure:', error);
    }
  }

  /**
   * Log notification delivery
   */
  async logNotification(subscription, notification, status, failureReason = null) {
    try {
      await prisma.pushNotificationLog.create({
        data: {
          clubId: subscription.clubId,
          subscriptionId: subscription.id,
          title: notification.title,
          body: notification.body,
          icon: notification.icon,
          image: notification.image,
          url: notification.url,
          notificationType: notification.type || 'GENERAL',
          relatedEntityType: notification.relatedEntityType,
          relatedEntityId: notification.relatedEntityId,
          status,
          failureReason,
          metadata: notification.data || {}
        }
      });
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  /**
   * Send shift-related notification
   */
  async sendShiftNotification(type, shiftData) {
    const { shift, clubId, entertainerId } = shiftData;
    
    const notifications = {
      SHIFT_SCHEDULED: {
        title: '📅 New Shift Scheduled',
        body: `You have a shift on ${new Date(shift.shiftDate).toLocaleDateString()} from ${shift.startTime} to ${shift.endTime}`,
        url: '/shift-scheduling',
        type: 'SHIFT_SCHEDULED',
        actions: [
          { action: 'view_shift', title: 'View Shift' },
          { action: 'view_dashboard', title: 'Dashboard' }
        ]
      },
      SHIFT_REMINDER: {
        title: '⏰ Shift Reminder',
        body: `Your shift starts in 30 minutes (${shift.startTime})`,
        url: '/shift-scheduling',
        type: 'SHIFT_REMINDER',
        requireInteraction: true
      },
      SHIFT_CANCELLED: {
        title: '❌ Shift Cancelled',
        body: `Your shift on ${new Date(shift.shiftDate).toLocaleDateString()} has been cancelled`,
        url: '/shift-scheduling',
        type: 'SHIFT_CANCELLED'
      },
      SWAP_REQUEST: {
        title: '🔄 Shift Swap Request',
        body: 'A new shift swap request needs your review',
        url: '/shift-swaps',
        type: 'SWAP_REQUEST',
        actions: [
          { action: 'view_swaps', title: 'Review Swaps' }
        ]
      },
      SWAP_APPROVED: {
        title: '✅ Shift Swap Approved',
        body: 'Your shift swap request has been approved',
        url: '/shift-swaps',
        type: 'SWAP_APPROVED'
      },
      SWAP_DENIED: {
        title: '❌ Shift Swap Denied',
        body: 'Your shift swap request has been denied',
        url: '/shift-swaps',
        type: 'SWAP_DENIED'
      }
    };

    const notification = notifications[type];
    if (!notification) {
      throw new Error(`Unknown shift notification type: ${type}`);
    }

    // Add shift-specific data
    notification.data = {
      shiftId: shift.id,
      entertainerId,
      shiftDate: shift.shiftDate
    };
    notification.relatedEntityType = 'shift';
    notification.relatedEntityId = shift.id;

    // Generate unique notification ID
    notification.notificationId = `${type}_${shift.id}_${Date.now()}`;

    if (type === 'SWAP_REQUEST') {
      // Send to managers
      const managers = await prisma.clubUser.findMany({
        where: {
          clubId,
          role: { in: ['MANAGER', 'SUPER_MANAGER', 'OWNER'] },
          isActive: true
        }
      });

      const results = [];
      for (const manager of managers) {
        const result = await this.sendToUser(manager.id, clubId, notification);
        results.push(result);
      }
      return results;
    } else {
      // Send to specific entertainer
      const entertainerUser = await prisma.clubUser.findFirst({
        where: {
          clubId,
          // You might need to add a relation or field to link entertainers to users
        }
      });

      if (entertainerId && entertainerUser) {
        return await this.sendToUser(entertainerUser.id, clubId, notification);
      }
      
      return { success: false, reason: 'No user account found for entertainer' };
    }
  }

  /**
   * Send emergency alert to all users
   */
  async sendEmergencyAlert(clubId, message, url = '/dashboard') {
    const notification = {
      title: '🚨 Emergency Alert',
      body: message,
      url,
      type: 'EMERGENCY',
      requireInteraction: true,
      tag: 'emergency',
      actions: [
        { action: 'view_dashboard', title: 'Go to Dashboard' }
      ],
      data: { priority: 'high' },
      notificationId: `emergency_${clubId}_${Date.now()}`
    };

    return await this.sendToClub(clubId, notification, { emergencyAlerts: true });
  }

  /**
   * Get VAPID public key for frontend
   */
  getVapidPublicKey() {
    return VAPID_PUBLIC_KEY;
  }
}

module.exports = new PushNotificationService();