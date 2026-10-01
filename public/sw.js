// The Lunar Grimoire's service worker: keeps a copy of the app on the
// device so it opens and works offline. Your data is never touched here —
// it lives in localStorage, not in this cache.

const CACHE = "lunar-grimoire-v17";
/** Potion names for reminder text, written by the app only if names are allowed in reminders. */
const LABELS = "lunar-grimoire-labels";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(self.registration.scope)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE && key !== LABELS) await caches.delete(key);
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

// The reminder bell rings with no content; the words come from this device.
// Potion names are used only if they were allowed in reminders; otherwise
// the reminder stays private.
const GRACE_MINUTES = 6;

async function reminderText() {
  try {
    const response = await (await caches.open(LABELS)).match("labels.json");
    if (response) {
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const names = [
        ...new Set(
          (await response.json())
            .filter((l) => {
              const late = nowMin - (Number(l.time.slice(0, 2)) * 60 + Number(l.time.slice(3)));
              return late >= 0 && late <= GRACE_MINUTES && (l.days.length === 0 || l.days.includes(now.getDay()));
            })
            .map((l) => l.label),
        ),
      ];
      if (names.length) return { title: names.length > 1 ? "Your potions await ✨" : `${names[0]} awaits ✨`, body: names.join(", ") };
    }
  } catch {
    // Fall back to the private wording.
  }
  return { title: "Potion time ✨", body: "A potion awaits you. Tap to open your Grimoire." };
}

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      const { title, body } = await reminderText();
      const icon = new URL("icons/icon-192.png", self.registration.scope).href;
      await self.registration.showNotification(title, { body, icon, badge: icon, tag: "potion-reminder", renotify: true });
    })(),
  );
});

// Tapping a potion reminder brings the Grimoire forward (or opens it).
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const open = windows.find((w) => w.url.startsWith(self.registration.scope));
      if (open) return open.focus();
      return self.clients.openWindow(self.registration.scope);
    })(),
  );
});
