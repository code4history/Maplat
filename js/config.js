require.config({
    baseUrl: 'js',
    paths: {
        'i18nxhr': 'i18nextXHRBackend.min',
        'ol3': 'ol-debug',
        'ol-custom': 'ol-custom',
        'tps': 'thinplatespline',
        'i18n': 'i18next.min', //8.4.2
        'turf': 'turf_maplat.min', //4.7.3
        'swiper': 'swiper.min', //3.4.2
        'bootstrap': 'bootstrap-native',
        'aigle': 'aigle-es5.min',
        'mapshaper': 'mapshaper_maplat'
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
