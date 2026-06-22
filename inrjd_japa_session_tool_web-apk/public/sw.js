'use strict';
/**
 * sw.js — Japa Session Tool Service Worker
 *
 * Strategy:
 *   • Static shell (HTML, manifest, bell)  → Cache-first, versioned
 *   • Images (NRJD_Pics/)                  → Cache on first load, serve from cache
 *   • image-list.json                       → Network-first (1s timeout), fall back to cache
 *   • /api/*                                → Network-only (always live)
 *   • Google Fonts                          → Cache-first (long TTL)
 *   • Everything else                       → Network-first, fall back to cache
 */

/* ── Version — bump this to force cache refresh on all clients ── */
const CACHE_VER   = 'japa-v5';
const FONT_CACHE  = 'japa-fonts-v1';
const IMG_CACHE   = 'japa-images-v1';

/* Static assets to pre-cache on install */
const PRECACHE = [
  '/',
  '/index.html',
  '/stopwatch.html',
  '/counter.html',
  '/manifest.json',
  '/Temple_Bell_Sound.mp3',
  '/image-list.json',          // may 404 on fresh installs — handled gracefully
  '/narashima-image-list.json',
];

/* ─── Install ──────────────────────────────────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VER).then(cache =>
      Promise.allSettled(
        PRECACHE.map(url =>
          cache.add(url).catch(err => console.warn(`[SW] Pre-cache miss: ${url}`, err))
        )
      )
    ).then(() => self.skipWaiting())
  );
});

/* ─── Activate ─────────────────────────────────────────────── */
self.addEventListener('activate', event => {
  const keep = new Set([CACHE_VER, FONT_CACHE, IMG_CACHE]);
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !keep.has(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* ─── Fetch ────────────────────────────────────────────────── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  /* Skip non-GET and browser-extension requests */
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  /* 1. API calls — network only, no caching */
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } })
      )
    );
    return;
  }

  /* 2. image-list.json — network-first with fast fallback */
  if (url.pathname === '/image-list.json') {
    event.respondWith(networkFirst(request, CACHE_VER, 1500));
    return;
  }

  if (url.pathname === '/narashima-image-list.json') {
    event.respondWith(networkFirst(request, CACHE_VER, 1500));
    return;
  }

  /* 3. NRJD_Pics images — cache-first (images don't change during a session) */
  if (url.pathname.startsWith('/NRJD_Pics/')) {
    event.respondWith(cacheFirst(request, IMG_CACHE));
    return;
  }

  if (url.pathname.startsWith('/NarashimaDev_pics/')) {
    event.respondWith(cacheFirst(request, IMG_CACHE));
    return;
  }

  /* 4. Google Fonts — cache-first, long TTL */
  if (url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  /* 5. Everything else — network-first, fall back to cache */
  event.respondWith(networkFirst(request, CACHE_VER));
});

/* ─── Strategy Helpers ─────────────────────────────────────── */

/**
 * Cache-first: return cached version immediately if available;
 * otherwise fetch from network and store in cache.
 */
async function cacheFirst(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      cache.put(request, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch {
    return new Response('Offline — resource not cached', { status: 503 });
  }
}

/**
 * Network-first: try to fetch from network within `timeoutMs`;
 * if it fails or is too slow, fall back to cache.
 */
async function networkFirst(request, cacheName, timeoutMs = 4000) {
  const cache = await caches.open(cacheName);

  const networkPromise = fetch(request).then(resp => {
    if (resp.ok) {
      cache.put(request, resp.clone()).catch(() => {});
    }
    return resp;
  });

  const timeoutPromise = new Promise(resolve =>
    setTimeout(async () => {
      const cached = await cache.match(request);
      if (cached) resolve(cached);
    }, timeoutMs)
  );

  try {
    return await Promise.race([networkPromise, timeoutPromise])
        || await networkPromise;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

/* ─── Message: manual cache flush ─────────────────────────── */
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();

  if (event.data === 'CLEAR_IMAGES') {
    caches.delete(IMG_CACHE).then(() =>
      event.source?.postMessage({ type: 'IMAGES_CLEARED' })
    );
  }
});