const CACHE_NAME = 'dream-library-cache-v1.0.56';
const CACHE_SLIM_POLICY = 'v1052-cache-shop-reward-mobile-store';
const PREVIOUS_CACHE_SLIM_POLICY = 'v1042-cache-slim-account-time-pressure';
const LEGACY_QA_CACHE_ANCHORS = ['dream-library-cache-v1.0.56', 'dream-library-cache-v1.0.55', 'dream-library-cache-v1.0.54', 'dream-library-cache-v1.0.53', 'dream-library-cache-v1.0.52', 'dream-library-cache-v1.0.51', 'dream-library-cache-v1.0.50', 'dream-library-cache-v1.0.49', 'dream-library-cache-v1.0.48', 'dream-library-cache-v1.0.47', 'texture-atlas-manifest-v1.0.56.json', 'texture-atlas-manifest-v1.0.55.json', 'texture-atlas-manifest-v1.0.54.json', 'texture-atlas-manifest-v1.0.53.json', 'texture-atlas-manifest-v1.0.52.json', 'texture-atlas-manifest-v1.0.51.json', 'texture-atlas-manifest-v1.0.50.json', 'texture-atlas-manifest-v1.0.49.json', 'texture-atlas-manifest-v1.0.48.json', 'texture-atlas-manifest-v1.0.47.json'];
const LEGACY_AUTH_MODAL_CACHE_SLIM_POLICY = 'v1043-cache-slim-auth-modal-boss-role';
const CORE_ASSETS = [
  './',
  './manifest.webmanifest',
  './favicon.png',
  './assets/backgrounds/storybook-login.png',
  './assets/backgrounds/library-hall.png',
  './assets/backgrounds/moon-library-v2.webp',
  './assets/backgrounds/gothic-window-v2.webp',
  './assets/backgrounds/bookshelf-v2.webp',
  './assets/characters/mascot-scholar-v2.png',
  './assets/characters/forgotten-spirit.png',
  './assets/characters/shadow-librarian.png',
  './assets/characters/sealed-page-golem.png',
  './assets/atlas/v2-tiles.webp',
  './assets/atlas/v2-tiles.png',
  './assets/atlas/v2-tiles.atlas.json',
  './assets/atlas/boss-frames-v2.webp',
  './assets/atlas/boss-frames-v2.png',
  './assets/atlas/boss-frames-v2.atlas.json',
  './assets/ui/keys-v2/back-normal.png',
  './assets/ui/keys-v2/hint-normal.png',
  './assets/effects/import-vfx-01.png',
  './assets/effects/import-vfx-02.png',
  './assets/effects/import-vfx-04.png',
  './assets/effects/import-vfx-06.png',
  './assets/meta/texture-atlas-manifest-v1.0.56.json',
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
