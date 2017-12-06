/* IE polyfills */
/* CustomEvent */
(function() {
  if (typeof window.CustomEvent === "function") return false

  function CustomEvent(event, params) {
    params = params || { bubbles: false, cancelable: false, detail: undefined }
    var evt = document.createEvent("CustomEvent")
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail)
    return evt
  }

  CustomEvent.prototype = window.Event.prototype

  window.CustomEvent = CustomEvent
})();
/* Object.assign */
if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(target) {
      'use strict';
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert first argument to object');
      }

      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i];
        if (nextSource === undefined || nextSource === null) {
          continue;
        }
        nextSource = Object(nextSource);

        var keysArray = Object.keys(Object(nextSource));
        for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
          var nextKey = keysArray[nextIndex];
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
      return to;
    }
  });
}
/* Math.log2 */
if (!Math.log2) {
    Math.log2 = function(x) {
        return Math.log(x) / Math.log(2);
    };
}

require.config({
    baseUrl: 'js',
    paths: {
        'i18nxhr': 'i18nextXHRBackend.min',
        'ol3': 'ol-debug',
        'ol-custom': 'ol-custom',
        'i18n': 'i18next.min', //8.4.2
        'turf': 'turf_maplat.min', //4.7.3
        'swiper': 'swiper.min', //3.4.2
        'bootstrap': 'bootstrap-native',
        'mapshaper': 'mapshaper_maplat',
        'resize': 'detect-element-resize'
    },
    shim: {
        'i18nxhr': {
            deps: ['i18n']
        },
        'turf': {
            exports: 'turf'
        },
        'resize': {
            exports: 'addResizeListener'
        }
    }
});
window.Maplat = {};
Maplat.onLoad = function(func) {
    Maplat.__func = func;
    if (Maplat.__app) func(Maplat.__app);
};
require(['app'], function(app) {
    Maplat.__app = app;
    if (Maplat.__func) Maplat.__func(app);
});
Maplat.createObject = function(option) {
    return new Promise(function(resolve) {
        Maplat.onLoad(function(MaplatApp) {
            var app = new MaplatApp(option);
            app.waitReady.then(function() {
                resolve(app);
            });
        })
    });
};
