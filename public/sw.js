const CACHE_NAME = 'dream-library-cache-v1-0-11';
const CORE_ASSETS = [
  './',
  './manifest.webmanifest',
  './favicon.png',
  './assets/backgrounds/storybook-login.png',
  './assets/backgrounds/library-hall.png',
  './assets/characters/librarian-momo.png',
  './assets/characters/librarian-cat.png',
  './assets/characters/forgotten-spirit.png',
  './assets/characters/shadow-librarian.png',
  './assets/characters/sealed-page-golem.png',
  './assets/objects/magic-book.png',
  './assets/objects/gold-key.png',
  './assets/objects/crystal-orb.png',
  './assets/effects/hit-burst.png',
  './assets/effects/combo-flash.png',
  './assets/effects/magic-wave.png',
  './assets/effects/particle-star.png',
  './assets/meta/restoration-shelf.png',
  './assets/meta/daily-badge.png',
  './assets/meta/browser-handoff.png',
  './assets/meta/collection-codex.png',
  './assets/meta/asset-codex.png',
  './assets/meta/asset-pack-manifest.json',
  './assets/ui/hp-frame.png',
  './assets/ui/logo-art.png',
  './assets/ui/start-button-art.png'
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
