({
    baseUrl: 'js',
    name: 'config',
    out: 'js/app-built.js',
    paths: {
        'i18n': 'empty:',
        'i18nxhr': 'i18nextXHRBackend.min',
        'turf': 'empty:',
        'swiper': 'empty:',
        'ol3': 'ol-debug',
        'ol-custom': 'ol-custom',
        'bootstrap': 'empty:',
        'aigle': 'aigle-es5.min',
        'tps': 'empty:',
        'buffer': 'buffer'
    },
    shim: {
        'aigle': {
            exports: 'Promise'
        },
        'tps': {
            exports: 'ThinPlateSpline'
        },
        'app': {
            deps: ['histmap', 'histmap_tps', 'histmap_tin', 'histmap_external']
        },
        'buffer': {
            exports: 'exports'
        }
    }
})
