// src/sw.js - VERSI BARU DENGAN WORKBOX
// 1. Impor library Workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (workbox) {
  console.log(`Workbox berhasil dimuat!`);

  // 2. Mengambil alih siklus hidup Service Worker
  // Ini menggantikan self.skipWaiting() dan self.clients.claim() manual Anda
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  // 3. Ini adalah bagian inti dari InjectManifest
  // Webpack akan mengganti self.__WB_MANIFEST dengan daftar file
  // yang akan di-precache (index.html, bundle.js, styles.css, dll.)
  // Ini menggantikan const CACHE_NAME dan const urlsToCache Anda
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

  // 4. (OPSIONAL TAPI DISARANKAN) Runtime Caching untuk API
  // Ini akan menyimpan cache panggilan API ke Dicoding
  workbox.routing.registerRoute(
    ({ url }) => url.href.startsWith('https://story-api.dicoding.dev'),
    new workbox.strategies.NetworkFirst({
      cacheName: 'story-api-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50, // Hanya simpan 50 respons terakhir
          maxAgeSeconds: 5 * 60, // 5 Menit
        }),
      ],
    }),
  );

  // 5. (OPSIONAL TAPI DISARANKAN) Runtime Caching untuk Gambar
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'image-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60, // Simpan 60 gambar
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Hari
        }),
      ],
    }),
  );

} else {
  console.log(`Workbox gagal dimuat.`);
}

// -----------------------------------------------------------------
// LOGIKA PUSH NOTIFICATION ANDA (TETAP SAMA, JANGAN DIUBAH)
// -----------------------------------------------------------------
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push received with no data');
    return;
  }

  let title = 'Story Map';
  let body = 'You have a new notification.';
  const icon = 'favicon.png'; // Pastikan path ini benar setelah build
  let dataUrl = '.';

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

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '.';
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