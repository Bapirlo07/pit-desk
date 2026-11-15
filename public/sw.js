/*
 * Pit Desk service worker: makes the app work offline.
 * - Pages (navigations): network first, fall back to the cached copy when offline.
 * - Built assets (/assets/*, hashed file names): cache first, they never change.
 * On install it reads index.html and pre-caches the JS/CSS it references,
 * so the very first visit is enough to work offline afterwards.
 */
const CACHE = 'pit-desk-v2';
const SCOPE = new URL(self.registration.scope).pathname; // e.g. /pit-desk/
const CORE = ['', 'index.html', 'manifest.webmanifest', 'favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'].map(
  (p) => SCOPE + p,
);

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(CORE);
      const html = await (await fetch(SCOPE + 'index.html', { cache: 'no-store' })).text();
      const assets = [...html.matchAll(/(?:src|href)="([^"]+\/assets\/[^"]+)"/g)].map((m) => m[1]);
      await cache.addAll(assets);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE);
          cache.put(SCOPE + 'index.html', fresh.clone());
          return fresh;
        } catch {
          return (await caches.match(SCOPE + 'index.html')) || Response.error();
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && url.pathname.startsWith(SCOPE)) {
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone());
      }
      return response;
    })(),
  );
});
