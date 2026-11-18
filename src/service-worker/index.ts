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

import { skipWaiting, clientsClaim, type WorkboxPlugin } from "workbox-core";
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
  /^resourcesCache-(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})$/;
const RESOURCE_MAX_AGE_SECONDS = 86400;

type CachedResource = {
  cacheName: string;
  response: Response;
  responseDate?: number;
  cacheDate?: number;
};

function responseDate(response: Response): number | undefined {
  const dateHeader = response.headers.get("date");
  if (!dateHeader) return undefined;

  const timestamp = Date.parse(dateHeader);
  return Number.isNaN(timestamp) ? undefined : timestamp;
}

function legacyCacheDate(cacheName: string): number | undefined {
  const match = LEGACY_RESOURCES_CACHE_PATTERN.exec(cacheName);
  if (!match) return undefined;

  const [, year, month, day, hour, minute] = match;
  if (!year || !month || !day || !hour || !minute) return undefined;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute)
  ).getTime();
}

function isResourceFresh(response: Response): boolean {
  const date = responseDate(response);
  return (
    date === undefined || date >= Date.now() - RESOURCE_MAX_AGE_SECONDS * 1000
  );
}

function isNewerCandidate(
  candidate: CachedResource,
  current: CachedResource
): boolean {
  // A date-less fixed-cache entry is fresh under Workbox's current rule, and
  // there is no timestamp that proves a legacy entry is newer than it.
  if (
    current.cacheName === RESOURCES_CACHE &&
    current.responseDate === undefined
  ) {
    return false;
  }

  const candidateDate = candidate.responseDate ?? candidate.cacheDate;
  const currentDate = current.responseDate ?? current.cacheDate;
  if (candidateDate === undefined) return false;
  if (currentDate === undefined || candidateDate > currentDate) return true;

  return (
    candidateDate === currentDate &&
    candidate.cacheName !== RESOURCES_CACHE &&
    current.cacheName !== RESOURCES_CACHE &&
    candidate.cacheDate !== undefined &&
    current.cacheDate !== undefined &&
    candidate.cacheDate > current.cacheDate
  );
}

const legacyCacheFallbackPlugin: WorkboxPlugin = {
  async cachedResponseWillBeUsed({ request, cachedResponse }) {
    let selected: CachedResource | undefined;
    if (cachedResponse && isResourceFresh(cachedResponse)) {
      selected = {
        cacheName: RESOURCES_CACHE,
        response: cachedResponse,
        responseDate: responseDate(cachedResponse)
      };
    }

    const cacheNames = await caches.keys();
    const legacyCacheNames = cacheNames
      .filter(cacheName => LEGACY_RESOURCES_CACHE_PATTERN.test(cacheName))
      .sort();
    for (const cacheName of legacyCacheNames) {
      const cache = await caches.open(cacheName);
      const response = await cache.match(request);
      if (!response || !isResourceFresh(response)) continue;

      const candidate: CachedResource = {
        cacheName,
        response,
        responseDate: responseDate(response),
        cacheDate: legacyCacheDate(cacheName)
      };
      if (!selected || isNewerCandidate(candidate, selected)) {
        selected = candidate;
      }
    }

    if (!selected) return null;
    if (selected.cacheName !== RESOURCES_CACHE) {
      try {
        const resourcesCache = await caches.open(RESOURCES_CACHE);
        await resourcesCache.put(request, selected.response.clone());
      } catch {
        // Keep serving the old response if the origin has no room for a copy.
      }
    }
    return selected.response;
  }
};

registerRoute(
  /(?:maps\/.+\.json|pwa\/.+|pois\/.+\.json|apps\/.+\.json|tmbs\/.+\.jpg|images\/.+\.(?:png|jpg))$/,

  new StaleWhileRevalidate({
    cacheName: RESOURCES_CACHE,
    plugins: [
      legacyCacheFallbackPlugin,
      new ExpirationPlugin({
        maxAgeSeconds: RESOURCE_MAX_AGE_SECONDS,
        purgeOnQuotaError: false
      })
    ]
  }),
  "GET"
);
