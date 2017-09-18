require.config({
    baseUrl: 'js',
    paths: {
        'i18nxhr': 'i18nextXHRBackend.min',
        'ol3': 'ol-debug',
        'ol-custom': 'ol-custom',
        'tps': 'thinplatespline',
        'i18n': '//cdnjs.cloudflare.com/ajax/libs/i18next/8.4.2/i18next.min',
        'turf': '//npmcdn.com/@turf/turf@4.7.3/turf.min',
        'swiper': '//cdnjs.cloudflare.com/ajax/libs/Swiper/3.4.2/js/swiper.min',
        'bootstrap': 'bootstrap-native',
        'aigle': 'aigle-es5.min'
    },
    shim: {
        'i18nxhr': {
            deps: ['i18n']
        },
        'turf': {
            exports: 'turf'
        },
        'aigle': {
            exports: 'Promise'
        },
        'tps': {
            exports: 'ThinPlateSpline'
        }
    }
});
(function() {
    if ( typeof window.CustomEvent === 'function' ) return false;

    var CustomEvent = function(event, params) {
        params = params || {bubbles: false, cancelable: false, detail: undefined};
        var evt = document.createEvent( 'CustomEvent' );
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    }

    CustomEvent.prototype = window.Event.prototype;

    window.CustomEvent = CustomEvent;
})();
require(['app'], function(app) {
    var event = new CustomEvent('loadMaplat', {detail: app});
    document.dispatchEvent(event);
});
