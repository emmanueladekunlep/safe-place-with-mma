// ============================================
// SERVICE WORKER FOR A SAFE PLACE WITH MMA
// Enables offline access and push notifications
// ============================================

const CACHE_NAME = 'safe-place-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/about.html',
  '/reading.html',
  '/community.html',
  '/contact.html',
  '/css/style.css',
  '/js/main.js',
  '/assets/images/logo.png',
  '/assets/images/favicon.png',
  '/assets/images/icon-72x72.png',
  '/assets/images/icon-96x96.png',
  '/assets/images/icon-128x128.png',
  '/assets/images/icon-144x144.png',
  '/assets/images/icon-152x152.png',
  '/assets/images/icon-192x192.png',
  '/assets/images/icon-384x384.png',
  '/assets/images/icon-512x512.png',
  '/manifest.json'
];

// Install the service worker
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Cache opened successfully');
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.log('Cache addAll failed:', error);
      })
  );
});

// Fetch from cache when offline
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // Otherwise, fetch from network
        return fetch(event.request).catch(function() {
          // If both cache and network fail, show offline page
          return caches.match('/index.html');
        });
      })
  );
});

// Activate the service worker
self.addEventListener('activate', function(event) {
  const cacheWhitelist = ['safe-place-v1'];
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// ============================================
// PUSH NOTIFICATIONS (Optional)
// ============================================
self.addEventListener('push', function(event) {
  const data = event.data.json();
  const options = {
    body: data.body || 'Start your daily devotional today.',
    icon: 'assets/images/icon-192x192.png',
    badge: 'assets/images/favicon.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/reading.html'
    }
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'A Safe Place With Mma',
      options
    )
  );
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/reading.html';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(windowClients) {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});