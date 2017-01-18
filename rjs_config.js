({
    baseUrl: 'js',
    name: 'app',
    out: 'js/app-built.js',
    paths: {
        'jquery': 'empty:',
        'jui': 'empty:',
        'i18n': 'empty:',
        'ji18n': 'empty:',
        'i18nxhr': 'i18nextXHRBackend.min',
        'turf': 'empty:',
        'slick': 'empty:',
        'ol3': 'ol-debug',
        'ol-custom': 'ol-custom',
        // "ol3css" : "../css/ol",
        'bootstrap': 'empty:',
        // "bootstrapcss" : "//maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min",
        'tps': 'empty:'
    },
    shim: {
        'jquery': {
            exports: '$'
        },
        'jui': {
            deps: ['jquery']
        },
        'slick': {
            deps: ['jquery']
        },
        'ol': {
            exports: 'ol'
        },
        'tps': {
            exports: 'ThinPlateSpline'
        },
        'bootstrap': {
            deps: ['jquery']
        },
        'app': {
            deps: ['histmap', 'histmap_tps', 'histmap_tin', 'histmap_stroly', 'histmap_drumsey']
        }
    }
})
