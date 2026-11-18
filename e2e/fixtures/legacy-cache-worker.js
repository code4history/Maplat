const CACHE_NAME = "resourcesCache-2026-11-18-20-08";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", event => {
  if (!new URL(event.request.url).pathname.endsWith("/maps/offline.json")) {
    return;
  }

  event.respondWith(
    fetch(event.request).then(async response => {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(event.request, response.clone());
      return response;
    })
  );
});
