// src/sw.js
// 1. Impor skrip Workbox (bukan 'import' ES6, karena ini untuk InjectManifest)
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (workbox) {
  console.log(`Workbox berhasil dimuat.`);
  
  // 2. Mengambil alih siklus hidup SW
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  // 3. Ini adalah bagian yang akan "disuntik" oleh InjectManifest
  // Ini menggantikan seluruh logika 'install' dan 'activate' Anda
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);
  // Ini untuk menyimpan cache panggilan API data Anda
  workbox.routing.registerRoute(
    // Tangkap semua request ke API Dicoding
    ({ url }) => url.href.startsWith('https://story-api.dicoding.dev'),
    
    // Gunakan strategi NetworkFirst
    new workbox.strategies.NetworkFirst({
      cacheName: 'story-api-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50, // Simpan 50 request terakhir
          maxAgeSeconds: 5 * 60, // Simpan selama 5 Menit
        }),
      ],
    })
  );

} else {
  console.log(`Workbox gagal dimuat.`);
}

// 4. Logika PUSH EVENT baru (sesuai permintaan reviewer)
// Ini adalah versi yang JAUH LEBIH SEDERHANA
self.addEventListener("push", (event) => {
  console.log("Service worker pushing...");
  
  const promiseChain = async () => {
    // Anda bisa mengganti teks ini dengan data dari event.data.json()
    // tapi ini adalah kode yang diminta reviewer:
    await self.registration.showNotification("Ada laporan baru untuk Anda!", {
      body: "Terjadi kerusakan lampu jalan di Jl. Melati",
      icon: 'favicon.png' // Pastikan ikon ini ada
    });
  }

  event.waitUntil(promiseChain());
});