const CACHE_NAME = 'dream-library-cache-v1-0-8';
const CORE_ASSETS = [
  './',
  './manifest.webmanifest',
  './favicon.png',
  './assets/backgrounds/storybook-login.png',
  './assets/backgrounds/library-hall.png',
  './assets/characters/librarian-momo.png',
  './assets/characters/forgotten-spirit.png',
  './assets/objects/magic-book.png',
  './assets/effects/hit-burst.png',
  './assets/effects/combo-flash.png',
  './assets/effects/magic-wave.png',
  './assets/ui/hp-frame.png'
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
