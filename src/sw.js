// src/sw.js - Simplified version
const CACHE_NAME = 'story-map-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.bundle.js',
  '/styles.css',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Push notification event (basic)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const options = {
    body: 'New notification from Story Map',
    icon: '/images/icon-192x192.png',
    badge: '/images/icon-72x72.png',
    tag: 'story-map-notification'
  };

  event.waitUntil(
    self.registration.showNotification('Story Map', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('/') && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});