const CACHE_NAME = 'dream-library-cache-v1.0.32';
const CORE_ASSETS = [
  './',
  './manifest.webmanifest',
  './favicon.png',
  './assets/backgrounds/storybook-login.png',
  './assets/backgrounds/library-hall.png',
  './assets/backgrounds/world-map.png',
  './assets/backgrounds/imported-moon-library.png',
  './assets/backgrounds/moon-library-v2.png',
  './assets/backgrounds/moon-library-v2.webp',
  './assets/backgrounds/gothic-window-v2.png',
  './assets/backgrounds/gothic-window-v2.webp',
  './assets/backgrounds/bookshelf-v2.png',
  './assets/backgrounds/bookshelf-v2.webp',
  './assets/characters/mascot-scholar-v2.png',
  './assets/characters/mascot-companions-v2.png',
  './assets/characters/boss-motion-sheet-v2.png',
  './assets/characters/boss-motion-v2/frame-01.png',
  './assets/characters/boss-motion-v2/frame-05.png',
  './assets/characters/boss-motion-v2/frame-09.png',
  './assets/atlas/v2-tiles.png',
  './assets/atlas/v2-tiles.webp',
  './assets/atlas/v2-tiles.atlas.json',
  './assets/atlas/boss-frames-v2.png',
  './assets/atlas/boss-frames-v2.webp',
  './assets/atlas/boss-frames-v2.atlas.json',
  './assets/ui/logo-dream-library-v2.png',
  './assets/ui/keys-v2/back-normal.png',
  './assets/ui/keys-v2/hint-normal.png',
  './assets/objects/v2-state/v2-tile-01-normal.png',
  './assets/objects/v2-state/v2-tile-01-selected.png',
  './assets/effects/v2-fragments/v2-fragment-01.png',
  './assets/meta/asset-import-v1.0.17.json',
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
  './assets/meta/texture-atlas-manifest-v1.0.32.json',
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
  const request = event.request;
  const url = new URL(request.url);
  const isNavigation = request.mode === 'navigate' || request.destination === 'document';
  const isAppCode = request.destination === 'script' || request.destination === 'style' || url.pathname.includes('/assets/index-');
  if (isNavigation || isAppCode) {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      return response;
    }).catch(() => caches.match(request).then((cached) => cached || caches.match('./'))));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
    return response;
  })));
});
