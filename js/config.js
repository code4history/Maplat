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
window.Maplat = {};
Maplat.onLoad = function(func) {
    Maplat.__func = func;
    if (Maplat.__app) func(Maplat.__app);
};
require(['app'], function(app) {
    Maplat.__app = app;
    if (Maplat.__func) Maplat.__func(app);
});
