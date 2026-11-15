const CACHE = 'peso-scan-shell-v8';
const APP_CACHE_PREFIX = 'peso-scan-shell-';
const PRECACHE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-512-maskable.png',
  '/apple-touch-icon.png',
  '/currency-samples/php-50-polymer-front.jpg',
  '/currency-samples/php-50-polymer-back.jpg',
  '/currency-samples/php-100-polymer-front.jpg',
  '/currency-samples/php-100-polymer-back.jpg',
  '/currency-samples/php-500-polymer-front.jpg',
  '/currency-samples/php-500-polymer-back.jpg',
  '/currency-samples/php-1000-polymer-front.jpg',
  '/currency-samples/php-1000-polymer-back.jpg',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const replacingExistingApp = keys.some(key => key.startsWith(APP_CACHE_PREFIX) && key !== CACHE);
    await Promise.all(keys
      .filter(key => key.startsWith(APP_CACHE_PREFIX) && key !== CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
    if (replacingExistingApp) {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      await Promise.all(windows.map(client => client.navigate(client.url).catch(() => undefined)));
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (request.cache === 'no-store') return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    const revalidate = request.cache === 'no-cache' || request.cache === 'reload';
    if (cached && !revalidate) return cached;

    try {
      const response = await fetch(request);
      const cacheControl = response.headers.get('Cache-Control')?.toLowerCase() ?? '';
      if (response.ok && !cacheControl.includes('no-store') && !cacheControl.includes('private')) {
        try {
          await caches.open(CACHE).then(cache => cache.put(request, response.clone()));
        } catch {
          // A storage quota or cache write failure must not break the network response.
        }
      }
      return response;
    } catch (error) {
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const shell = await caches.match('/');
        if (shell) return shell;
      }
      throw error;
    }
  })());
});
