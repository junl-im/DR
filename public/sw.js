const CACHE_NAME = 'dream-library-cache-v1-0-16';
const CORE_ASSETS = [
  './',
  './manifest.webmanifest',
  './favicon.png',
  './assets/backgrounds/storybook-login.png',
  './assets/backgrounds/library-hall.png',
  './assets/backgrounds/world-map.png',
  './assets/backgrounds/imported-moon-library.png',
  './assets/characters/librarian-momo.png',
  './assets/characters/forgotten-spirit.png',
  './assets/characters/shadow-librarian.png',
  './assets/characters/sealed-page-golem.png',
  './assets/characters/boss-import-01.png',
  './assets/objects/magic-book.png',
  './assets/objects/premium-01.png',
  './assets/objects/premium-12.png',
  './assets/objects/premium-24.png',
  './assets/effects/hit-burst.png',
  './assets/effects/combo-flash.png',
  './assets/effects/magic-wave.png',
  './assets/effects/import-vfx-01.png',
  './assets/effects/import-vfx-06.png',
  './assets/effects/particles-01.png',
  './assets/meta/restoration-shelf.png',
  './assets/meta/daily-badge.png',
  './assets/meta/browser-handoff.png',
  './assets/meta/collection-codex.png',
  './assets/meta/asset-import-v1.0.11.json',
  './assets/meta/texture-atlas-manifest-v1.0.16.json',
  './assets/ui/hp-frame.png',
  './assets/ui/icon-back.png',
  './assets/ui/icon-home.png',
  './assets/ui/icon-settings.png',
  './assets/ui/icon-hint.png'
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
