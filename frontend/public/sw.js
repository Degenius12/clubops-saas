// ClubFlow Service Worker
// Handles push notifications and background sync

const CACHE_NAME = 'clubflow-v1';
const urlsToCache = [
  '/',
  '/manifest.json'
];

// Install service worker and cache resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installed');
        return self.skipWaiting();
      })
  );
});

// Activate service worker and cleanup old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated');
      return self.clients.claim();
    })
  );
});

// Handle push notifications
self.addEventListener('push', event => {
  console.log('Service Worker: Push notification received', event);

  if (!event.data) {
    console.log('Push event has no data');
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (e) {
    console.error('Error parsing push data:', e);
    notificationData = {
      title: 'ClubFlow',
      body: event.data.text(),
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png'
    };
  }

  const {
    title = 'ClubFlow',
    body = 'New notification',
    icon = '/icons/icon-192x192.png',
    badge = '/icons/badge-72x72.png',
    image,
    url = '/',
    tag,
    requireInteraction = false,
    actions = [],
    data = {}
  } = notificationData;

  const notificationOptions = {
    body,
    icon,
    badge,
    image,
    tag,
    requireInteraction,
    actions,
    data: {
      ...data,
      url,
      timestamp: Date.now()
    },
    vibrate: [200, 100, 200], // Vibration pattern for mobile
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification click received', event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  // Handle different actions
  if (action === 'view_shift') {
    event.waitUntil(
      clients.openWindow(data.url || '/shift-scheduling')
    );
  } else if (action === 'view_swaps') {
    event.waitUntil(
      clients.openWindow(data.url || '/shift-swaps')
    );
  } else if (action === 'view_dashboard') {
    event.waitUntil(
      clients.openWindow(data.url || '/dashboard')
    );
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow(data.url || '/')
    );
  }

  // Track notification interaction
  if (data.notificationId) {
    fetch('/api/notifications/interaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        notificationId: data.notificationId,
        action: action || 'click',
        timestamp: Date.now()
      })
    }).catch(err => {
      console.error('Failed to track notification interaction:', err);
    });
  }
});

// Handle notification close
self.addEventListener('notificationclose', event => {
  console.log('Service Worker: Notification closed', event);
  
  const data = event.notification.data || {};
  
  // Track notification dismissal
  if (data.notificationId) {
    fetch('/api/notifications/interaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        notificationId: data.notificationId,
        action: 'dismiss',
        timestamp: Date.now()
      })
    }).catch(err => {
      console.error('Failed to track notification dismissal:', err);
    });
  }
});

// Handle background sync
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'background-notification-sync') {
    event.waitUntil(syncNotifications());
  }
});

// Sync notifications in background
async function syncNotifications() {
  try {
    console.log('Service Worker: Syncing notifications...');
    
    // Get pending notifications from IndexedDB or cache
    const pendingNotifications = await getPendingNotifications();
    
    for (const notification of pendingNotifications) {
      try {
        await fetch('/api/notifications/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(notification)
        });
        
        // Remove from pending list
        await removePendingNotification(notification.id);
      } catch (err) {
        console.error('Failed to sync notification:', err);
      }
    }
    
    console.log('Service Worker: Notification sync completed');
  } catch (error) {
    console.error('Service Worker: Sync failed', error);
  }
}

// Helper function to get pending notifications
async function getPendingNotifications() {
  // This would typically read from IndexedDB
  return [];
}

// Helper function to remove pending notification
async function removePendingNotification(id) {
  // This would typically remove from IndexedDB
  console.log('Removing pending notification:', id);
}

// Handle fetch events (for offline support)
self.addEventListener('fetch', event => {
  // Only intercept GET requests for better performance
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // Otherwise fetch from network
        return fetch(event.request).then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response for caching
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      }).catch(() => {
        // Return offline fallback for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

console.log('Service Worker: Script loaded');