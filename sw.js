// === FinTrack Premium - Service Worker (PWA Offline) ===
const CACHE_NAME = 'fintrack-v15';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './js/i18n.js',
  './js/currency.js',
  './js/data.js',
  './js/helpers.js',
  './js/router.js',
  './js/dashboard.js',
  './js/transactions.js',
  './js/investments.js',
  './js/goals.js',
  './js/analytics.js',
  './js/reports.js',
  './js/ai.js',
  './js/settings.js',
  './js/init.js',
  './manifest.json'
];

// Install: cache all app shell assets
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: serve from cache first, fallback to network
self.addEventListener('fetch', function(e) {
  // Skip non-GET and external requests
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        // Cache new requests dynamically
        if (response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
        }
        return response;
      }).catch(function() {
        // Offline fallback
        return caches.match('./index.html');
      });
    })
  );
});
