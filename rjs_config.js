({
    baseUrl: 'js',
    name: 'config',
    out: 'dist/maplat_withoutpromise.js',
    include: ['require.min'],
    paths: {
        'i18n': 'i18next.min',
        'i18nxhr': 'i18nextXHRBackend.min',
        'turf': 'turf_maplat.min',
        'swiper': 'swiper.min',
        'ol3': 'ol-debug',
        'ol-custom': 'ol-custom',
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
        },
        'app': {
            deps: ['histmap', 'histmap_tin']
        }
    }
})
