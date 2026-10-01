// The Lunar Grimoire's service worker: keeps a copy of the app on the
// device so it opens and works offline. Your data is never touched here —
// it lives in localStorage, not in this cache.

const CACHE = "lunar-grimoire-v3";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(self.registration.scope)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

// The page sends the files it already loaded, so the very first visit is enough to work offline.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "precache" || !Array.isArray(event.data.urls)) return;
  const sameOrigin = event.data.urls.filter((url) => new URL(url).origin === self.location.origin);
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.allSettled(sameOrigin.map((url) => cache.add(url)))));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  // Pages: try the network first so updates arrive; fall back to the saved copy offline.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        } catch {
          return (await caches.match(request)) ?? (await caches.match(self.registration.scope)) ?? Response.error();
        }
      })(),
    );
    return;
  }

  // Everything else (scripts, styles, fonts, icons): serve the saved copy, refresh it in the background.
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached ?? Response.error());
      return cached ?? network;
    })(),
  );
});
