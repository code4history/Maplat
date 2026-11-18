/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app and you should
 * disable HTTP caching for this file too.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */

import { skipWaiting, clientsClaim } from "workbox-core";
import { precacheAndRoute, PrecacheEntry } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import "@c4h/weiwudi/sw";

skipWaiting();
clientsClaim();

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
precacheAndRoute((self as any).__WB_MANIFEST as (string | PrecacheEntry)[], {});

const RESOURCES_CACHE = "resourcesCache";
const LEGACY_RESOURCES_CACHE_PATTERN =
  /^resourcesCache-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}$/;

interface ServiceWorkerLifecycleEvent extends Event {
  waitUntil(promise: Promise<unknown>): void;
}

self.addEventListener("activate", event => {
  (event as ServiceWorkerLifecycleEvent).waitUntil(
    migrateLegacyResourcesCaches()
  );
});

async function migrateLegacyResourcesCaches(): Promise<void> {
  const cacheNames = await caches.keys();
  const legacyCacheNames = cacheNames
    .filter(cacheName => LEGACY_RESOURCES_CACHE_PATTERN.test(cacheName))
    .sort();

  if (legacyCacheNames.length === 0) return;

  const resourcesCache = await caches.open(RESOURCES_CACHE);
  for (const cacheName of legacyCacheNames) {
    const legacyCache = await caches.open(cacheName);
    for (const request of await legacyCache.keys()) {
      if (await resourcesCache.match(request)) continue;

      const response = await legacyCache.match(request);
      if (response) await resourcesCache.put(request, response);
    }
    await caches.delete(cacheName);
  }
}

registerRoute(
  /(?:maps\/.+\.json|pwa\/.+|pois\/.+\.json|apps\/.+\.json|tmbs\/.+\.jpg|images\/.+\.(?:png|jpg))$/,

  new StaleWhileRevalidate({
    cacheName: RESOURCES_CACHE,
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 86400,
        purgeOnQuotaError: false
      })
    ]
  }),
  "GET"
);
