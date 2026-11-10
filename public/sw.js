/* gymbro service worker — plain JS, no build step.
 *
 * Strategy
 *  - App shell / pages: network-first, fall back to cache, then to "/".
 *  - Next static assets (/_next/static, hashed): cache-first.
 *  - Exercise catalog (/data/*.json): stale-while-revalidate.
 *  - Exercise media (GIF/JPG from the dataset host): cache-first, trimmed LRU.
 *
 * Bump VERSION to drop old caches after a breaking change.
 */
const VERSION = "v3";
const SHELL = `gymbro-shell-${VERSION}`;
const STATIC = `gymbro-static-${VERSION}`;
const DATA = `gymbro-data-${VERSION}`;
const MEDIA = `gymbro-media-${VERSION}`;
const MEDIA_LIMIT = 400;

const PRECACHE = ["/", "/plans", "/exercises", "/history", "/settings", "/data/exercises.json", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      await Promise.allSettled(PRECACHE.map((u) => cache.add(u)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL, STATIC, DATA, MEDIA]);
      for (const key of await caches.keys()) if (!keep.has(key)) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/_next/static/")) return event.respondWith(cacheFirst(STATIC, req));
    if (url.pathname.startsWith("/data/")) return event.respondWith(staleWhileRevalidate(DATA, req));
    if (req.mode === "navigate") return event.respondWith(networkFirstNavigation(req));
    if (url.pathname.startsWith("/_next/")) return; // RSC payloads etc.: let the browser decide
    return event.respondWith(staleWhileRevalidate(SHELL, req));
  }

  if (/\.(gif|jpe?g|png|webp)$/i.test(url.pathname)) {
    return event.respondWith(cacheFirst(MEDIA, req, MEDIA_LIMIT));
  }
});

/*
 * Media is requested with CORS (crossOrigin="anonymous" / fetch mode "cors"),
 * so responses are readable and only real 200s are cached. Opaque responses
 * are never stored: browsers pad each one to several MB of quota, and running
 * out of quota can get the whole origin evicted, workout logs included.
 */
async function cacheFirst(name, req, limit) {
  const cache = await caches.open(name);
  const hit = await cache.match(req, { ignoreVary: true });
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok) {
      cache.put(req, res.clone()).then(() => limit && trim(cache, limit)).catch(() => undefined);
    }
    return res;
  } catch {
    return Response.error();
  }
}

async function staleWhileRevalidate(name, req) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  const refresh = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => undefined);
  return hit || (await refresh) || Response.error();
}

async function networkFirstNavigation(req) {
  const cache = await caches.open(SHELL);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req)) || (await cache.match("/")) || Response.error();
  }
}

async function trim(cache, limit) {
  const keys = await cache.keys();
  if (keys.length <= limit) return;
  for (const key of keys.slice(0, keys.length - limit)) await cache.delete(key);
}
