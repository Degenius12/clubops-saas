interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPreferences {
  shiftUpdates: boolean;
  swapRequests: boolean;
  emergencyAlerts: boolean;
  generalUpdates: boolean;
}

interface DeviceInfo {
  userAgent: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browserName: string;
  browserVersion: string;
}

class PushNotificationService {
  private vapidPublicKey: string | null = null;
  private subscription: PushSubscription | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.checkSupport();
  }

  /**
   * Check if push notifications are supported
   */
  private checkSupport(): boolean {
    this.isSupported = 'serviceWorker' in navigator && 
                      'PushManager' in window && 
                      'Notification' in window;
    return this.isSupported;
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  /**
   * Check if notifications are supported and enabled
   */
  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
    } else if (permission === 'denied') {
      console.log('Notification permission denied');
    } else {
      console.log('Notification permission dismissed');
    }

    return permission;
  }

  /**
   * Register service worker
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Workers are not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', registration);
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Get VAPID public key from server
   */
  async getVapidPublicKey(): Promise<string> {
    if (this.vapidPublicKey) {
      return this.vapidPublicKey;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/push-notifications/vapid-public-key', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get VAPID public key');
      }

      const data = await response.json();
      this.vapidPublicKey = data.publicKey;
      return this.vapidPublicKey;
    } catch (error) {
      console.error('Error getting VAPID public key:', error);
      throw error;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(preferences: Partial<NotificationPreferences> = {}): Promise<boolean> {
    try {
      // Check permissions
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission not granted');
      }

      // Register service worker
      const registration = await this.registerServiceWorker();
      
      // Get VAPID public key
      const vapidKey = await this.getVapidPublicKey();
      
      // Convert VAPID key to Uint8Array
      const convertedVapidKey = this.urlBase64ToUint8Array(vapidKey);
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      // Get device info
      const deviceInfo = this.getDeviceInfo();

      // Send subscription to server
      const token = localStorage.getItem('token');
      const response = await fetch('/api/push-notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
            auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
          },
          preferences: {
            shiftUpdates: preferences.shiftUpdates !== false,
            swapRequests: preferences.swapRequests !== false,
            emergencyAlerts: preferences.emergencyAlerts !== false,
            generalUpdates: preferences.generalUpdates === true
          },
          deviceInfo
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription to server');
      }

      this.subscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };

      console.log('Successfully subscribed to push notifications');
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        console.log('No service worker registration found');
        return true;
      }

      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        console.log('No push subscription found');
        return true;
      }

      // Unsubscribe from browser
      const success = await subscription.unsubscribe();
      
      if (success) {
        // Remove subscription from server
        const token = localStorage.getItem('token');
        await fetch('/api/push-notifications/unsubscribe', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint
          })
        });

        this.subscription = null;
        console.log('Successfully unsubscribed from push notifications');
      }

      return success;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: NotificationPreferences): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/push-notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ preferences })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to update preferences:', error);
      return false;
    }
  }

  /**
   * Get user's current subscriptions
   */
  async getSubscriptions(): Promise<any[]> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/push-notifications/subscriptions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get subscriptions');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get subscriptions:', error);
      return [];
    }
  }

  /**
   * Send a test notification (owner only)
   */
  async sendTestNotification(): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/push-notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return false;
    }
  }

  /**
   * Send custom notification (manager+ only)
   */
  async sendCustomNotification(
    title: string, 
    body: string, 
    options: {
      url?: string;
      icon?: string;
      image?: string;
      recipients?: 'all' | 'managers' | string[];
      requireInteraction?: boolean;
    } = {}
  ): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/push-notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          body,
          ...options
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send custom notification:', error);
      return false;
    }
  }

  /**
   * Send emergency alert (manager+ only)
   */
  async sendEmergencyAlert(message: string, url?: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/push-notifications/emergency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message, url })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send emergency alert:', error);
      return false;
    }
  }

  /**
   * Check if user is currently subscribed
   */
  async isSubscribed(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return false;

      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    
    // Detect device type
    let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop';
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      deviceType = /iPad|Android(?=.*Mobile)/i.test(userAgent) ? 'tablet' : 'mobile';
    }

    // Detect browser
    let browserName = 'Unknown';
    let browserVersion = '';
    
    if (userAgent.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
      browserVersion = userAgent.match(/Chrome\/(\d+\.\d+)/)?.[1] || '';
    } else if (userAgent.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
      browserVersion = userAgent.match(/Firefox\/(\d+\.\d+)/)?.[1] || '';
    } else if (userAgent.indexOf('Safari') > -1) {
      browserName = 'Safari';
      browserVersion = userAgent.match(/Version\/(\d+\.\d+)/)?.[1] || '';
    } else if (userAgent.indexOf('Edge') > -1) {
      browserName = 'Edge';
      browserVersion = userAgent.match(/Edge\/(\d+\.\d+)/)?.[1] || '';
    }

    return {
      userAgent,
      deviceType,
      browserName,
      browserVersion
    };
  }

  /**
   * Convert URL-safe base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const binary = String.fromCharCode(...bytes);
    return window.btoa(binary);
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;
export type { NotificationPreferences, DeviceInfo };