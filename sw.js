// === FinTrack Premium Service Worker (V2.0.3) ===
// IMPORTANT: Bump this version string on EVERY deploy to trigger update
const CACHE_NAME = 'fintrack-v2.0.6-b1790680705';

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
  './js/accounts.js',
  './js/dashboard.js',
  './js/transactions.js',
  './js/investments.js',
  './js/goals.js',
  './js/analytics.js',
  './js/reports.js',
  './js/ai.js',
  './js/settings.js',
  './js/supabase.js',
  './js/init.js',
  './manifest.json'
];

// Install: cache all app shell assets, skip waiting immediately
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // V2.0.4: cache 'reload' skips the browser's HTTP cache, so a new version never mixes old + new files
      // V2.0.5 (DATA-15): cache each file on its own. One missing file no longer blocks the whole update,
      // but index.html + the core scripts MUST be cached or install fails (old version keeps running).
      var CORE = ['./index.html', './js/data.js', './js/helpers.js', './js/init.js'];
      return Promise.all(ASSETS.map(function(u) {
        return cache.add(new Request(u, { cache: 'reload' })).catch(function(err) {
          console.warn('[SW] Could not cache', u, err);
          if (CORE.indexOf(u) !== -1) throw err;
        });
      }));
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

// V2.0.5 (DATA-15): only the app's own files are stored in the cache (fixed list), so it can't grow forever
var ASSET_PATHS = ASSETS.map(function(u) { return new URL(u, self.location.href).pathname; });
function ftIsShellAsset(url) { return ASSET_PATHS.indexOf(new URL(url).pathname) !== -1; }
// A real "you're offline" answer instead of undefined (undefined = the browser shows a broken request)
function ftOfflineResponse() {
  return new Response('Offline: this file is not saved on your device yet.', { status: 503, statusText: 'Offline', headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

// Fetch: Stale-While-Revalidate for app shell (fast + always fresh next load)
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  // For navigation requests (HTML pages): network-first for freshness
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(function(response) {
        // Only a good page replaces the saved index.html (a 404/500 page must not overwrite it)
        if (response && response.ok) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put('./index.html', clone); });
        }
        return response;
      }).catch(function() {
        return caches.match('./index.html', { cacheName: CACHE_NAME }).then(function(cached) {
          return cached || caches.match('./', { cacheName: CACHE_NAME });
        }).then(function(cached) { return cached || ftOfflineResponse(); });
      })
    );
    return;
  }

  // For other assets: stale-while-revalidate
  e.respondWith(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.match(e.request, { ignoreSearch: true }).then(function(cached) {
        var fetchPromise = fetch(e.request).then(function(response) {
          if (response && response.status === 200 && ftIsShellAsset(e.request.url)) {
            cache.put(e.request, response.clone());
          }
          return response;
        }).catch(function() { return cached || ftOfflineResponse(); });

        // Return cached immediately if available, else wait for network
        return cached || fetchPromise;
      });
    })
  );
});
