const CACHE_NAME = 'dream-library-cache-v1.0.86';
const CORE_ASSETS = [
  './',
  './manifest.webmanifest',
  './favicon.png',
  './assets/backgrounds/storybook-login.webp',
  './assets/backgrounds/imported-moon-library.webp',
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
  './assets/meta/texture-atlas-manifest-v1.0.86.json',
  './assets/meta/texture-atlas-manifest-v1.0.85.json',
  './assets/meta/texture-atlas-manifest-v1.0.84.json',
  './assets/meta/texture-atlas-manifest-v1.0.83.json',
  './assets/meta/texture-atlas-manifest-v1.0.82.json',
  './assets/meta/texture-atlas-manifest-v1.0.81.json',
  './assets/meta/texture-atlas-manifest-v1.0.80.json',
  './assets/meta/texture-atlas-manifest-v1.0.79.json',
  './assets/meta/texture-atlas-manifest-v1.0.78.json',
  './assets/meta/texture-atlas-manifest-v1.0.77.json',
  './assets/meta/texture-atlas-manifest-v1.0.76.json',
  './assets/meta/texture-atlas-manifest-v1.0.75.json',
  './assets/meta/texture-atlas-manifest-v1.0.74.json',
  './assets/meta/texture-atlas-manifest-v1.0.73.json',
  './assets/meta/texture-atlas-manifest-v1.0.72.json',
  './assets/meta/texture-atlas-manifest-v1.0.71.json',
  './assets/meta/texture-atlas-manifest-v1.0.70.json',
  './assets/meta/texture-atlas-manifest-v1.0.69.json',
  './assets/meta/texture-atlas-manifest-v1.0.68.json',
  './assets/meta/texture-atlas-manifest-v1.0.67.json',
  './assets/meta/texture-atlas-manifest-v1.0.66.json',
  './assets/meta/texture-atlas-manifest-v1.0.65.json',
  './assets/meta/texture-atlas-manifest-v1.0.64.json',
  './assets/meta/texture-atlas-manifest-v1.0.63.json',
  './assets/meta/texture-atlas-manifest-v1.0.62.json',
  './assets/meta/texture-atlas-manifest-v1.0.61.json',
  './assets/meta/texture-atlas-manifest-v1.0.60.json',
  './assets/meta/texture-atlas-manifest-v1.0.59.json',
  './assets/meta/texture-atlas-manifest-v1.0.58.json',
  './assets/meta/texture-atlas-manifest-v1.0.57.json',
  './assets/meta/texture-atlas-manifest-v1.0.56.json',
  './assets/meta/texture-atlas-manifest-v1.0.55.json',
  './assets/meta/texture-atlas-manifest-v1.0.54.json',
  './assets/meta/texture-atlas-manifest-v1.0.53.json',
  './assets/meta/texture-atlas-manifest-v1.0.52.json',
  './assets/meta/texture-atlas-manifest-v1.0.51.json',
  './assets/meta/texture-atlas-manifest-v1.0.50.json',
  './assets/meta/texture-atlas-manifest-v1.0.49.json',
  './assets/meta/texture-atlas-manifest-v1.0.48.json',
  './assets/meta/texture-atlas-manifest-v1.0.47.json',
  './assets/ui/frame-library-v2.webp',
  './assets/ui/frame-library-v2.png',
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
