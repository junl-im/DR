const CACHE_NAME = 'dream-library-cache-current';
const CORE_ASSETS = [
  './',
  './manifest.webmanifest',
  './favicon.svg',
  './assets/backgrounds/dream-library-25d.svg',
  './assets/characters/librarian-momo.svg',
  './assets/objects/magic-book.svg',
  './assets/effects/hit-burst.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
