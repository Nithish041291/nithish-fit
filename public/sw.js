// Nithish Fit service worker: caches the app shell so the PWA opens offline, and serves a
// stale-while-revalidate strategy for same-origin GET requests. Application data itself is
// stored in IndexedDB (see lib/data/localDb.ts), not here — this only caches the shell.

const CACHE_NAME = "nithish-fit-shell-v2";
const APP_SHELL = ["/today", "/workout", "/food", "/progress", "/more"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never cache API/data calls, or the manifest/icons — those must always reflect the
  // current deployment (e.g. app icon changes), and the browser's install/update flow reads
  // them directly rather than benefiting from offline app-shell caching.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/data/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname.startsWith("/icons/")
  ) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const networkFetch = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
