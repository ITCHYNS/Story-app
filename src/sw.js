// src/sw.js - VERSI LEBIH TANGGUH
const CACHE_NAME = 'story-map-v4'; // Naikkan versi cache!
const urlsToCache = [
  '.',
  'index.html',
  'app.bundle.js',
  'styles.css',
  'favicon.png',
  'icon-256.png'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker installed, skipping waiting.');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Cache addAll failed:', error);
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
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated, claiming clients.');
      return self.clients.claim();
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

// --- BAGIAN INI DIPERBARUI ---
// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push received with no data');
    return;
  }

  let title = 'Story Map';
  let body = 'You have a new notification.';
  const icon = '/favicon.png';
  let dataUrl = '/';

  try {
    // Coba baca sebagai JSON (dari API Dicoding)
    const data = event.data.json();
    title = data.title || title;
    body = data.body || body;
    dataUrl = data.url || dataUrl;
  } catch (e) {
    // Jika gagal, berarti ini plain text (dari DevTools)
    console.log('Push data is not JSON, treating as text.');
    body = event.data.text(); // Gunakan teks sebagai body
  }

  const options = {
    body: body,
    icon: icon,
    badge: icon,
    tag: 'story-map-notification',
    data: {
      url: dataUrl
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
// --- AKHIR BAGIAN YANG DIPERBARUI ---

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});