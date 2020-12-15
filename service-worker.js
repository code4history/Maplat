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

importScripts("https://storage.googleapis.com/workbox-cdn/releases/5.1.4/workbox-sw.js");  // eslint-disable-line no-undef
importScripts("https://cdn.jsdelivr.net/npm/weiwudi@0.0.12/src/weiwudi_sw.js");  // eslint-disable-line no-undef

workbox.core.skipWaiting(); // eslint-disable-line no-undef

workbox.core.clientsClaim(); // eslint-disable-line no-undef

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
workbox.precaching.precacheAndRoute([{"revision":"aa89a4b06faa57b6bc72bb3e33ea75fd","url":"index.html"},{"revision":"f532cb61a93bab741df93092b0702d97","url":"dist/maplat.js"},{"revision":"b93003e8c1c507d9940ed17f4bc68cb4","url":"dist/maplat.css"},{"revision":"7a6230d181b42042b80df3c321d5198e","url":"parts/all_right_reserved.png"},{"revision":"721f9c3cf45df9e397d8af648fe8d8da","url":"parts/attr.png"},{"revision":"d6eb2a24c9db8612a9e1ebfe1e749c94","url":"parts/basemap.png"},{"revision":"3f0a27365f8197ee4e28acb2b6d4c9d9","url":"parts/blue_marker.png"},{"revision":"86df29046e4ebed91eec8234a176ab61","url":"parts/bluedot_small.png"},{"revision":"73d040fd36725ee4e8334cc94c90ca17","url":"parts/bluedot_transparent.png"},{"revision":"fa10ac01a2b93a61c78da31c8412752d","url":"parts/bluedot.png"},{"revision":"0b5a096113128f9c5240ad5d591bde7e","url":"parts/border.png"},{"revision":"d85a33fe3f3d910f23d9033bcaa6fa33","url":"parts/cc_by-nc-nd.png"},{"revision":"802bada55988e7bc600dd63c678a57f9","url":"parts/cc_by-nc-sa.png"},{"revision":"d845dfb491962a5c7f6c521fc1846f11","url":"parts/cc_by-nc.png"},{"revision":"ab35e0d022a6c2ec119e1013d6bb7fc0","url":"parts/cc_by-nd.png"},{"revision":"5d9c749cca3aaef6b4dfabe9a38285e9","url":"parts/cc_by-sa.png"},{"revision":"4e91db59fb6c2a5e5ae85b10d5a8f7df","url":"parts/cc_by.png"},{"revision":"ff44bbde2ec314d94ed1ca8c6ecbaa1e","url":"parts/cc0.png"},{"revision":"e77f58c849942a4738967e01d35af3b6","url":"parts/compass.png"},{"revision":"5a59a47efbff1f339a8a72acf5875354","url":"parts/defaultpin_selected.png"},{"revision":"914de2be384fd0a7c10edba093102ab4","url":"parts/defaultpin.png"},{"revision":"a80eedc91fa1edf82a6b6f188360a95c","url":"parts/favicon.png"},{"revision":"88642e7dfd903889494780dc7bcb4001","url":"parts/fullscreen.png"},{"revision":"3412cde5c94f55664fec8e21c6ade49b","url":"parts/gps.png"},{"revision":"38f4240db353696ab2c78792c2ea4e33","url":"parts/gsi_ortho.jpg"},{"revision":"990dacb3d6fccfcc02c5bedbc411cb82","url":"parts/gsi.jpg"},{"revision":"dcae0d7d90782d7ec5126c48158f2757","url":"parts/help.png"},{"revision":"733de5cdee50bd4a793ebedeca2d8090","url":"parts/hide_marker.png"},{"revision":"8793f7f3c3c8ad97ab0721c9abc0f27a","url":"parts/home.png"},{"revision":"192f06bfd1c723d52c96f2b2c7515604","url":"parts/loading_image.png"},{"revision":"617a6e8f8d4e2f7b1f5b8b6392d1a6fd","url":"parts/loading.png"},{"revision":"3e2697d021dfcbd0a14907c135c27d50","url":"parts/Maplat.png"},{"revision":"18dffca80c33c2dfd50d7653675ec986","url":"parts/minus.png"},{"revision":"3eca7da567c5dcc0f0542e404feb6ecb","url":"parts/no_image.png"},{"revision":"6e73458310b44ea10ba8d4470a57ea2a","url":"parts/osm.jpg"},{"revision":"bb91fb788e85eb2f80901951fd6790cc","url":"parts/overlay.png"},{"revision":"e243e609b6cf5e588d8c3b4dc023a963","url":"parts/pd.png"},{"revision":"7c5bd95e2ed638c542b7684cc5a52724","url":"parts/plus.png"},{"revision":"7f5a919a8d17390929bb92f3dc480cee","url":"parts/red_marker.png"},{"revision":"3bb615256d903d1c7f14e169f35ae6f9","url":"parts/redcircle.png"},{"revision":"937996de5ce7069a563a075039cbf66c","url":"parts/share.png"},{"revision":"31b399f580e564dca55ede0edfd014d7","url":"parts/slider.png"},{"revision":"0dd53e891cb14462d03632a211d7593b","url":"locales/en/translation.json"},{"revision":"4abfcf4d8d29b1ccc6a465f2e199fb09","url":"locales/ja/translation.json"},{"revision":"ad0717663a4ff7bdb5e9788f459c06f6","url":"locales/ko/translation.json"},{"revision":"e1cd2a44f3b332ca442bc4ee7538bf67","url":"locales/zh-TW/translation.json"},{"revision":"ba7302a1e53698a65ad4384c818445c8","url":"locales/zh/translation.json"},{"revision":"98ac5855d26c334c24e50ed178ce3e39","url":"fonts/clarenbd-webfont.woff"},{"revision":"1a78f1d571ba278ae1f9cdd54f5579f2","url":"fonts/fontawesome-webfont.woff"}], {}); // eslint-disable-line no-undef
workbox.routing.registerRoute(/(?:maps\/.+\.json|pwa\/.+|pois\/.+\.json|apps\/.+\.json|tmbs\/.+_menu\.jpg|img\/.+\.(?:png|jpg))$/, new workbox.strategies.StaleWhileRevalidate({ "cacheName":"resourcesCache", plugins: [new workbox.expiration.ExpirationPlugin({ maxAgeSeconds: 86400, purgeOnQuotaError: false })] }), 'GET'); // eslint-disable-line no-undef
