({
    baseUrl: 'js',
    name: 'config_{name}',
    out: 'dist/maplat_{out}withoutpromise.js',
    include: ['../lib/require.min'],
    paths: {
        'i18n': '../lib/i18next.min',
        'i18nxhr': '../lib/i18nextXHRBackend.min',
        'turf': '../lib/turf_maplat.min',
        'swiper': '../lib/swiper',
        'ol3': '../lib/ol-maplat',
        'ol-custom': 'ol-custom',
        'bootstrap': '../lib/bootstrap-native',
        'mapshaper': '../lib/mapshaper_maplat',
        'resize': '../lib/detect-element-resize',
        'sprintf': '../lib/sprintf'
    },
    shim: {
        'i18nxhr': {
            deps: ['i18n']
        },
        'ol3': {
            exports: 'ol'
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