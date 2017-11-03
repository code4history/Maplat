({
    baseUrl: 'js',
    name: 'config',
    out: 'js/maplat.js',
    include: ['require.min'],
    paths: {
        'i18n': 'i18next.min',
        'i18nxhr': 'i18nextXHRBackend.min',
        'turf': 'turf_maplat.min',
        'swiper': 'swiper.min',
        'ol3': 'ol-debug',
        'ol-custom': 'ol-custom',
        'bootstrap': 'bootstrap-native',
        'aigle': 'aigle-es5.min',
        'mapshaper': 'mapshaper_maplat'
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
