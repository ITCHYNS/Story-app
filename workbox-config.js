// workbox-config.js
module.exports = {
  globDirectory: 'dist/',
  globPatterns: [
    '**/*.{html,js,css,png,jpg,jpeg,gif,svg,ico,json}'
  ],
  swDest: 'dist/sw.js',
  globIgnores: [
    '**/node_modules/**/*',
    '**/workbox-config.js'
  ],
  runtimeCaching: [{
    urlPattern: /^https:\/\/story-api\.dicoding\.dev\/.*/,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'api-cache',
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 5 * 60 // 5 minutes
      },
      networkTimeoutSeconds: 10
    }
  }, {
    urlPattern: /^https:\/\/unpkg\.com\/.*/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'cdn-cache',
      expiration: {
        maxEntries: 20,
        maxAgeSeconds: 7 * 24 * 60 * 60 // 1 week
      }
    }
  }, {
    urlPattern: /^https:\/\/\{s\}\.tile\.openstreetmap\.org\/.*/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'map-tiles-cache',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      }
    }
  }]
};