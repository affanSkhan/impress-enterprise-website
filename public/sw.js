// Service Worker for Empire Spare Parts Admin Dashboard PWA
const CACHE_NAME = 'empire-admin-v1';
const ADMIN_ROUTES = [
  '/admin',
  '/admin/orders',
  '/admin/products',
  '/admin/categories',
  '/admin/invoices',
];

const STATIC_ASSETS = [
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json',
];

// Install event - cache essential admin assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
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

// Push notification handler with sound and vibration
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received!');
  console.log('[Service Worker] Push event:', event);
  
  if (!event.data) {
    console.log('[Service Worker] No data in push event');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[Service Worker] Push data:', data);
    
    const options = {
      body: data.body || data.message || 'New notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      image: data.image,
      vibrate: [300, 100, 200, 100, 300], // Vibration pattern
      tag: data.tag || 'notification-' + Date.now(),
      requireInteraction: true, // Keeps notification visible until user interacts
      renotify: true, // Re-alert even if same tag
      silent: false, // Play sound
      data: {
        url: data.url || data.link || '/admin',
        notificationId: data.id,
      },
      actions: [
        {
          action: 'open',
          title: 'View',
          icon: '/icons/icon-72x72.png'
        },
        {
          action: 'close',
          title: 'Dismiss',
          icon: '/icons/icon-72x72.png'
        }
      ],
      // Additional options for better mobile support
      timestamp: data.timestamp || Date.now(),
    };

    console.log('[Service Worker] Showing notification with options:', options);

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'Empire Car A/C', 
        options
      ).then(() => {
        console.log('[Service Worker] Notification displayed successfully');
      }).catch(error => {
        console.error('[Service Worker] Error showing notification:', error);
      })
    );
  } catch (error) {
    console.error('[Service Worker] Error parsing push data:', error);
  }
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
