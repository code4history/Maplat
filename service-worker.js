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

importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.4.1/workbox-sw.js");

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [
  {
    "url": "."
  },
  {
    "url": "dist/maplat.js",
    "revision": "ffcf6b182993e50c30ef9355256cb7c7"
  },
  {
    "url": "dist/maplat.css",
    "revision": "42a12630138c672a32b045cafc0588f2"
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
    "url": "parts/bluedot.png",
    "revision": "fa10ac01a2b93a61c78da31c8412752d"
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
    "url": "parts/help.png",
    "revision": "dcae0d7d90782d7ec5126c48158f2757"
  },
  {
    "url": "parts/home.png",
    "revision": "8793f7f3c3c8ad97ab0721c9abc0f27a"
  },
  {
    "url": "parts/hotoke.png",
    "revision": "08050d7cb88c2d125ecf1ffc48f8608b"
  },
  {
    "url": "parts/jinja.png",
    "revision": "d302d698e99b6c85e82bdf966ee96f8c"
  },
  {
    "url": "parts/jizo.png",
    "revision": "2ea68998967bac3f9328f71e1cef6052"
  },
  {
    "url": "parts/loading.gif",
    "revision": "9e34e033ec7749c0ee473c1879fe4a96"
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
    "url": "parts/redcircle.png",
    "revision": "3bb615256d903d1c7f14e169f35ae6f9"
  },
  {
    "url": "parts/slider.png",
    "revision": "31b399f580e564dca55ede0edfd014d7"
  },
  {
    "url": "locales/en/translation.json",
    "revision": "c3e0a7fba37ba10b4963f195562f4786"
  },
  {
    "url": "locales/ja/translation.json",
    "revision": "12df987353f88427c3c11daccca20ea4"
  },
  {
    "url": "fonts/clarenbd-webfont.eot",
    "revision": "7a3f8c05eb924cccdde0874dd522268e"
  },
  {
    "url": "fonts/clarenbd-webfont.svg",
    "revision": "877daf82b367b4f2967fa7da9d13d747"
  },
  {
    "url": "fonts/clarenbd-webfont.ttf",
    "revision": "f2d7485a4f532b7ad6bd14fc6afd55bb"
  },
  {
    "url": "fonts/clarenbd-webfont.woff",
    "revision": "98ac5855d26c334c24e50ed178ce3e39"
  },
  {
    "url": "fonts/clarenbd-webfont.woff2",
    "revision": "5537c950cd889a13c0a685c106401bd8"
  },
  {
    "url": "fonts/fontawesome-webfont.eot",
    "revision": "674f50d287a8c48dc19ba404d20fe713"
  },
  {
    "url": "fonts/fontawesome-webfont.svg",
    "revision": "912ec66d7572ff821749319396470bde"
  },
  {
    "url": "fonts/fontawesome-webfont.ttf",
    "revision": "b06871f281fee6b241d60582ae9369b9"
  },
  {
    "url": "fonts/fontawesome-webfont.woff",
    "revision": "fee66e712a8a08eef5805a46892932ad"
  },
  {
    "url": "fonts/fontawesome-webfont.woff2",
    "revision": "af7ae505a9eed503f8b8e6982036873e"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

workbox.routing.registerRoute(/(?:maps\/.+\.json|apps\/.+\.json|tmbs\/.+_menu\.jpg|img\/.+\.(?:png|jpg))$/, workbox.strategies.networkFirst({ cacheName: "resourcesCache", plugins: [new workbox.expiration.Plugin({"maxAgeSeconds":86400,"purgeOnQuotaError":false})] }), 'GET');
workbox.routing.registerRoute(/^https?:.+\/[0-9]+\/[0-9]+\/[0-9]\.(?:jpg|png)$/, workbox.strategies.staleWhileRevalidate({ cacheName: "tileCache", plugins: [new workbox.expiration.Plugin({"maxAgeSeconds":2592000,"purgeOnQuotaError":false})] }), 'GET');
