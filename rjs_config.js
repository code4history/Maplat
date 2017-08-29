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
        'bootstrap': 'bootstrap-native',
        'aigle': 'aigle-es5.min'
    },
    shim: {
        'aigle': {
            exports: 'Promise'
        },
        'app': {
            deps: ['histmap', 'histmap_tin']
        }
    }
})
