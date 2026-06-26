const CACHE_NAME = 'dream-library-cache-v1.0.2';
const scopeUrl = new URL(self.registration.scope);
const basePath = scopeUrl.pathname.endsWith('/') ? scopeUrl.pathname : `${scopeUrl.pathname}/`;
const tileNames = [
  'magic-book', 'gold-key', 'candle', 'hourglass', 'crystal-orb', 'rune', 'ink', 'scroll',
  'crown', 'feather', 'potion', 'star', 'music-box', 'dragon-egg', 'relic', 'moon',
  'gem', 'shield', 'flower', 'comet', 'bell', 'map', 'castle', 'spark'
];
const PRECACHE_URLS = [
  basePath,
  `${basePath}manifest.webmanifest`,
  `${basePath}favicon.svg`,
  `${basePath}assets/backgrounds/library-hall.svg`,
  `${basePath}assets/backgrounds/memory-mist.svg`,
  `${basePath}assets/ui/panel-frame.svg`,
  `${basePath}assets/meta/tile-manifest.json`,
  ...tileNames.map((name) => `${basePath}assets/tiles/${name}.svg`)
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => null)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => null);
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match(basePath)))
  );
});
