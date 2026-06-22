// Calico Service Worker
// Caches all pages for offline use 🐱

const CACHE_NAME = 'calico-academy-v4';

const PAGES_TO_CACHE = [
  '/',
  '/index.html',
  '/japanese-flashcards.html',
  '/korean-flashcards.html',
  '/manifest.json'
];

// Install: cache all pages
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Calico: caching pages for offline use 🐱');
      return cache.addAll(PAGES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache, fall back to network
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Serve from cache, but also update cache in background
        const networkFetch = fetch(event.request).then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, response.clone());
            });
          }
          return response;
        }).catch(() => {});
        return cached;
      }

      // Not in cache — try network
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        // Cache the new resource
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone());
        });
        return response;
      }).catch(() => {
        // Fully offline and not cached — return a friendly offline message
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
