// === FinTrack Premium - Service Worker (PWA Offline + Auto-Update) ===
// IMPORTANT: Bump this version string on EVERY deploy to trigger update
const CACHE_NAME = 'fintrack-v15.3';

// Listen for skip waiting message from the app
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

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

// Install: cache all app shell assets, skip waiting immediately
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean ALL old caches, claim clients immediately
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      // Notify all open tabs that update is active
      return self.clients.matchAll().then(function(clients) {
        clients.forEach(function(client) {
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_NAME });
        });
      });
    })
  );
  self.clients.claim();
});

// Fetch: Stale-While-Revalidate for app shell (fast + always fresh next load)
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  // For navigation requests (HTML pages): network-first for freshness
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(function(response) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
        return response;
      }).catch(function() {
        return caches.match(e.request).then(function(cached) {
          return cached || caches.match('./index.html');
        });
      })
    );
    return;
  }

  // For other assets: stale-while-revalidate
  e.respondWith(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.match(e.request).then(function(cached) {
        var fetchPromise = fetch(e.request).then(function(response) {
          if (response.status === 200) {
            cache.put(e.request, response.clone());
          }
          return response;
        }).catch(function() { return cached; });

        // Return cached immediately if available, else wait for network
        return cached || fetchPromise;
      });
    })
  );
});
