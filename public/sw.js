// Service Worker for Impress Enterprise Admin Dashboard PWA
// VERSION 7 - Updated with Impress Enterprise branding
const CACHE_NAME = 'impress-admin-v7';
const SW_VERSION = '7.0.0';

// Log immediately when service worker script runs
console.log('[Service Worker] Script loaded, version:', SW_VERSION);
console.log('[Service Worker] Self registration scope:', self.registration?.scope);

const ADMIN_ROUTES = [
  '/admin',
  '/admin/orders',
  '/admin/products',
  '/admin/categories',
  '/admin/invoices',
];

const STATIC_ASSETS = [
  '/impress_enterprise_logo.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/favicon-32x32.png',
  '/manifest.json',
];

// Install event - cache essential admin assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing v5...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.error('[Service Worker] Failed to cache assets:', err);
      });
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating v5...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all pages immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle admin routes
  if (!url.pathname.startsWith('/admin')) {
    return;
  }

  // API requests - network only (always get fresh data)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503,
        });
      })
    );
    return;
  }

  // Admin pages - network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone response to cache it
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If not in cache, return offline page
          return caches.match('/admin').then((adminPage) => {
            return adminPage || new Response('Offline - Admin Dashboard', {
              headers: { 'Content-Type': 'text/html' },
            });
          });
        });
      })
  );
});

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    console.log('[Service Worker] Syncing orders...');
    // Add sync logic here in the future
  }
});

// Keep service worker alive with periodic sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-notifications') {
    console.log('[Service Worker] Periodic sync triggered');
    event.waitUntil(
      // This keeps the service worker alive
      Promise.resolve()
    );
  }
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLAIM_CLIENTS') {
    self.clients.claim();
  }
  
  // Respond to ping to test if service worker is alive
  if (event.data && event.data.type === 'PING') {
    console.log('[Service Worker] Responding to ping');
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ pong: true, timestamp: Date.now() });
    }
  }
});

// Push notification handler with sound and vibration
self.addEventListener('push', function(event) {
  console.log('[Service Worker] ===== PUSH EVENT RECEIVED =====');
  console.log('[Service Worker] Time:', new Date().toISOString());
  console.log('[Service Worker] Registration scope:', self.registration?.scope);
  
  // CRITICAL: Parse notification data immediately in synchronous context
  let notificationData = {
    title: 'Empire Car A/C',
    body: 'New notification',
    url: '/admin'
  };

  if (event.data) {
    try {
      // Use text() which is synchronous-ish in this context
      const rawData = event.data.text();
      console.log('[Service Worker] Raw push data:', rawData);
      const parsed = JSON.parse(rawData);
      notificationData = {
        title: parsed.title || 'Empire Car A/C',
        body: parsed.body || parsed.message || 'New notification',
        url: parsed.url || parsed.link || '/admin',
        tag: parsed.tag,
        id: parsed.id,
        timestamp: parsed.timestamp
      };
      console.log('[Service Worker] Parsed notification:', notificationData);
    } catch (error) {
      console.error('[Service Worker] Error parsing push data:', error);
    }
  }

  // Notification options - keep it simple for reliability
  const options = {
    body: notificationData.body,
    icon: '/icons/icon-192x192.png', // Use standard PWA icon
    badge: '/icons/icon-72x72.png',  // Use standard PWA icon for badge
    vibrate: [300, 100, 200, 100, 300],
    tag: notificationData.tag || 'empire-' + Date.now(),
    requireInteraction: true, // Keep notification on screen until user interacts
    renotify: true,
    silent: false,
    data: {
      url: notificationData.url,
      notificationId: notificationData.id,
      timestamp: Date.now(),
      dateOfArrival: Date.now()
    },
    actions: [
      { action: 'open', title: 'View' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  console.log('[Service Worker] Showing notification with title:', notificationData.title);

  // CRITICAL: Must use event.waitUntil with the showNotification promise
  const promiseChain = self.registration.showNotification(notificationData.title, options)
    .then(() => {
      console.log('[Service Worker] ✅ Notification displayed successfully');
    })
    .catch((error) => {
      console.error('[Service Worker] ❌ showNotification failed:', error);
      // Fallback: try with minimal options
      return self.registration.showNotification('Empire Car A/C', {
        body: 'You have a new notification',
        icon: '/icons/icon-192x192.png'
      });
    });

  event.waitUntil(promiseChain);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    // User dismissed the notification
    return;
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const url = event.notification.data.url || '/admin';
        
        // Check if there's already a window open
        for (let client of clientList) {
          if (client.url.includes('/admin') && 'focus' in client) {
            return client.focus().then(() => {
              // Navigate to the notification URL
              return client.navigate(url);
            });
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Handle push subscription changes (renewal, expiration)
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[Service Worker] Push subscription changed!');
  console.log('[Service Worker] Old subscription:', event.oldSubscription);
  console.log('[Service Worker] New subscription:', event.newSubscription);
  
  // Re-subscribe automatically
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: event.oldSubscription?.options?.applicationServerKey
    })
    .then(subscription => {
      console.log('[Service Worker] Re-subscribed successfully');
      // Note: In production, you'd want to send this to your server
      return subscription;
    })
    .catch(err => {
      console.error('[Service Worker] Failed to re-subscribe:', err);
    })
  );
});

// Log that service worker is ready for push
console.log('[Service Worker] Push notification handler registered');
console.log('[Service Worker] Ready to receive push messages');
