const CACHE_VERSION = 'v5';
const CACHE_NAME = `puzzles-${CACHE_VERSION}`;

const APP_SHELL = [
  '/',
  '/css/reset.css',
  '/css/theme.css',
  '/css/layout.css',
  '/css/numpuz.css',
  '/css/memory.css',
  '/js/app.js',
  '/js/storage.js',
  '/js/timer.js',
  '/js/games/numpuz.js',
  '/js/games/memory.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install: cache app shell, activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

// Activate: clean old caches, take control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: network-first — always try network, cache response, fall back to cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
