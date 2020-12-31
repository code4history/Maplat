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

// eslint-disable-next-line no-undef
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/5.1.4/workbox-sw.js"
);
// eslint-disable-next-line no-undef
importScripts("https://cdn.jsdelivr.net/npm/weiwudi@0.1.2/src/weiwudi_sw.js");

workbox.core.skipWaiting(); // eslint-disable-line no-undef

workbox.core.clientsClaim(); // eslint-disable-line no-undef

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
// eslint-disable-next-line no-undef
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST, {});
// eslint-disable-next-line no-undef
workbox.routing.registerRoute(
  /(?:maps\/.+\.json|pwa\/.+|pois\/.+\.json|apps\/.+\.json|tmbs\/.+\.jpg|images\/.+\.(?:png|jpg)|fonts\/.+\.woff|locales\/.+\/.+\.json)$/,
  // eslint-disable-next-line no-undef
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: "resourcesCache",
    plugins: [
      // eslint-disable-next-line no-undef
      new workbox.expiration.ExpirationPlugin({
        maxAgeSeconds: 86400,
        purgeOnQuotaError: false
      })
    ]
  }),
  "GET"
);
