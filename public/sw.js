// Service Worker for Empire Spare Parts Admin Dashboard PWA
const CACHE_NAME = 'empire-admin-v4';
const ADMIN_ROUTES = [
  '/admin',
  '/admin/orders',
  '/admin/products',
  '/admin/categories',
  '/admin/invoices',
];

const STATIC_ASSETS = [
  '/Empire Car Ac  Logo Design.jpg',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/favicon-32x32.png',
  '/manifest.json',
];

// Install event - cache essential admin assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing v4...');
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
  console.log('[Service Worker] Activating v4...');
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
self.addEventListener('push', (event) => {
  console.log('[Service Worker] ===== PUSH EVENT RECEIVED =====');
  console.log('[Service Worker] Time:', new Date().toISOString());
  console.log('[Service Worker] Event:', event);
  console.log('[Service Worker] Has data:', !!event.data);
  
  let notificationData = {
    title: 'Empire Car A/C',
    body: 'New notification',
    url: '/admin'
  };

  if (event.data) {
    try {
      const rawData = event.data.text();
      console.log('[Service Worker] Raw push data:', rawData);
      notificationData = JSON.parse(rawData);
      console.log('[Service Worker] Parsed push data:', notificationData);
    } catch (error) {
      console.error('[Service Worker] Error parsing push data:', error);
      // Use default notification if parsing fails
    }
  } else {
    console.log('[Service Worker] No data in push event - using defaults');
  }

  const options = {
    body: notificationData.body || notificationData.message || 'New notification',
    icon: '/Empire Car Ac  Logo Design.jpg',
    badge: '/favicon-32x32.png',
    image: notificationData.image,
    vibrate: [300, 100, 200, 100, 300],
    tag: 'empire-notification',
    requireInteraction: true,
    renotify: true,
    silent: false,
    data: {
      url: notificationData.url || notificationData.link || '/admin',
      notificationId: notificationData.id,
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'View'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ],
    timestamp: notificationData.timestamp || Date.now(),
  };

  console.log('[Service Worker] Notification options:', JSON.stringify(options, null, 2));

  // CRITICAL: Must use event.waitUntil to keep service worker alive
  event.waitUntil(
    Promise.resolve()
      .then(() => {
        console.log('[Service Worker] About to show notification...');
        return self.registration.showNotification(
          notificationData.title || 'Empire Car A/C', 
          options
        );
      })
      .then(() => {
        console.log('[Service Worker] ✅ Notification displayed successfully at', new Date().toISOString());
        // Send a message to all clients that notification was received
        return self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
      })
      .then(clients => {
        console.log('[Service Worker] Found', clients.length, 'clients to notify');
        clients.forEach(client => {
          client.postMessage({
            type: 'PUSH_RECEIVED',
            notification: notificationData
          });
        });
      })
      .catch(error => {
        console.error('[Service Worker] ❌ Error in push handler:', error);
        console.error('[Service Worker] Error stack:', error.stack);
        // Try to show a basic notification as fallback
        return self.registration.showNotification('Empire Car A/C', {
          body: 'You have a new notification',
          icon: '/Empire Car Ac  Logo Design.jpg'
        });
      })
  );

  console.log('[Service Worker] ===== PUSH EVENT HANDLER COMPLETE =====');
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
