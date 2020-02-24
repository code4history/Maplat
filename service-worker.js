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

importScripts("https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js");

workbox.core.skipWaiting();

workbox.core.clientsClaim();

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [
  {
    "url": ".",
    "revision": "93215d9aeefaabdb8d3102f4acca0b9c8720aea0"
  },
  {
    "url": "dist/maplat.js",
    "revision": "334603ceee1b3a1cc8e51f7bbc307e80"
  },
  {
    "url": "dist/maplat.css",
    "revision": "b93003e8c1c507d9940ed17f4bc68cb4"
  },
  {
    "url": "parts/all_right_reserved.png",
    "revision": "7a6230d181b42042b80df3c321d5198e"
  },
  {
    "url": "parts/attr.png",
    "revision": "721f9c3cf45df9e397d8af648fe8d8da"
  },
  {
    "url": "parts/basemap.png",
    "revision": "d6eb2a24c9db8612a9e1ebfe1e749c94"
  },
  {
    "url": "parts/blue_marker.png",
    "revision": "3f0a27365f8197ee4e28acb2b6d4c9d9"
  },
  {
    "url": "parts/bluedot_small.png",
    "revision": "86df29046e4ebed91eec8234a176ab61"
  },
  {
    "url": "parts/bluedot_transparent.png",
    "revision": "73d040fd36725ee4e8334cc94c90ca17"
  },
  {
    "url": "parts/bluedot.png",
    "revision": "fa10ac01a2b93a61c78da31c8412752d"
  },
  {
    "url": "parts/border.png",
    "revision": "0b5a096113128f9c5240ad5d591bde7e"
  },
  {
    "url": "parts/cc_by-nc-nd.png",
    "revision": "d85a33fe3f3d910f23d9033bcaa6fa33"
  },
  {
    "url": "parts/cc_by-nc-sa.png",
    "revision": "802bada55988e7bc600dd63c678a57f9"
  },
  {
    "url": "parts/cc_by-nc.png",
    "revision": "d845dfb491962a5c7f6c521fc1846f11"
  },
  {
    "url": "parts/cc_by-nd.png",
    "revision": "ab35e0d022a6c2ec119e1013d6bb7fc0"
  },
  {
    "url": "parts/cc_by-sa.png",
    "revision": "5d9c749cca3aaef6b4dfabe9a38285e9"
  },
  {
    "url": "parts/cc_by.png",
    "revision": "4e91db59fb6c2a5e5ae85b10d5a8f7df"
  },
  {
    "url": "parts/cc0.png",
    "revision": "ff44bbde2ec314d94ed1ca8c6ecbaa1e"
  },
  {
    "url": "parts/compass.png",
    "revision": "e77f58c849942a4738967e01d35af3b6"
  },
  {
    "url": "parts/defaultpin_selected.png",
    "revision": "5a59a47efbff1f339a8a72acf5875354"
  },
  {
    "url": "parts/defaultpin.png",
    "revision": "914de2be384fd0a7c10edba093102ab4"
  },
  {
    "url": "parts/favicon.png",
    "revision": "a80eedc91fa1edf82a6b6f188360a95c"
  },
  {
    "url": "parts/fullscreen.png",
    "revision": "88642e7dfd903889494780dc7bcb4001"
  },
  {
    "url": "parts/gps.png",
    "revision": "3412cde5c94f55664fec8e21c6ade49b"
  },
  {
    "url": "parts/gsi_ortho.jpg",
    "revision": "38f4240db353696ab2c78792c2ea4e33"
  },
  {
    "url": "parts/gsi.jpg",
    "revision": "990dacb3d6fccfcc02c5bedbc411cb82"
  },
  {
    "url": "parts/help.png",
    "revision": "dcae0d7d90782d7ec5126c48158f2757"
  },
  {
    "url": "parts/hide_marker.png",
    "revision": "733de5cdee50bd4a793ebedeca2d8090"
  },
  {
    "url": "parts/home.png",
    "revision": "8793f7f3c3c8ad97ab0721c9abc0f27a"
  },
  {
    "url": "parts/loading_image.png",
    "revision": "192f06bfd1c723d52c96f2b2c7515604"
  },
  {
    "url": "parts/loading.png",
    "revision": "617a6e8f8d4e2f7b1f5b8b6392d1a6fd"
  },
  {
    "url": "parts/Maplat.png",
    "revision": "3e2697d021dfcbd0a14907c135c27d50"
  },
  {
    "url": "parts/minus.png",
    "revision": "18dffca80c33c2dfd50d7653675ec986"
  },
  {
    "url": "parts/no_image.png",
    "revision": "3eca7da567c5dcc0f0542e404feb6ecb"
  },
  {
    "url": "parts/osm.jpg",
    "revision": "6e73458310b44ea10ba8d4470a57ea2a"
  },
  {
    "url": "parts/overlay.png",
    "revision": "bb91fb788e85eb2f80901951fd6790cc"
  },
  {
    "url": "parts/pd.png",
    "revision": "e243e609b6cf5e588d8c3b4dc023a963"
  },
  {
    "url": "parts/plus.png",
    "revision": "7c5bd95e2ed638c542b7684cc5a52724"
  },
  {
    "url": "parts/red_marker.png",
    "revision": "7f5a919a8d17390929bb92f3dc480cee"
  },
  {
    "url": "parts/redcircle.png",
    "revision": "3bb615256d903d1c7f14e169f35ae6f9"
  },
  {
    "url": "parts/share.png",
    "revision": "937996de5ce7069a563a075039cbf66c"
  },
  {
    "url": "parts/slider.png",
    "revision": "31b399f580e564dca55ede0edfd014d7"
  },
  {
    "url": "locales/en/translation.json",
    "revision": "51c737eb68e17da165fbf5da4cf05a8b"
  },
  {
    "url": "locales/ja/translation.json",
    "revision": "00e22b59db6c62129ddca328320e7199"
  },
  {
    "url": "locales/ko/translation.json",
    "revision": "5fafee636f68ae4e7322ebb9068de093"
  },
  {
    "url": "locales/zh-TW/translation.json",
    "revision": "e5b3837886875a774d74f91080d60ccb"
  },
  {
    "url": "locales/zh/translation.json",
    "revision": "3a1daeda323e89e1947dc7e071bf757e"
  },
  {
    "url": "fonts/clarenbd-webfont.woff",
    "revision": "98ac5855d26c334c24e50ed178ce3e39"
  },
  {
    "url": "fonts/fontawesome-webfont.woff",
    "revision": "1a78f1d571ba278ae1f9cdd54f5579f2"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

workbox.routing.registerRoute(/(?:maps\/.+\.json|pwa\/.+|pois\/.+\.json|apps\/.+\.json|tmbs\/.+_menu\.jpg|img\/.+\.(?:png|jpg))$/, new workbox.strategies.StaleWhileRevalidate({ "cacheName":"resourcesCache", plugins: [new workbox.expiration.Plugin({ maxAgeSeconds: 86400, purgeOnQuotaError: false })] }), 'GET');
