require.config({
    baseUrl: 'js',
    // map: {
    //    '*' : {
    //        'css' : "//cdnjs.cloudflare.com/ajax/libs/require-css/0.1.8/css.min.js"
    //    }
    // },
    paths: {
        // 'jquery': 'jquery-1.11.2.min',
        // 'i18n': 'i18next.min',
        // 'ji18n': 'jquery-i18next.min',
        'i18nxhr': 'i18nextXHRBackend.min',
        // "jui" : "jquery-ui.min",
        // 'turf': 'turf.min',
        // 'slick': 'slick.min',
        'ol3': 'ol-debug',
        'ol-custom': 'ol-custom',
        // 'bootstrap': 'bootstrap.min',
        'tps': 'thinplatespline',
        'jquery': '//code.jquery.com/jquery-1.11.2.min',
        'i18n': '//cdnjs.cloudflare.com/ajax/libs/i18next/4.1.4/i18next.min',
        'ji18n': '//cdnjs.cloudflare.com/ajax/libs/jquery-i18next/1.2.0/jquery-i18next.min',
        // "jui" : "//code.jquery.com/ui/1.10.3/jquery-ui.min",
        'turf': '//npmcdn.com/@turf/turf@3.7.0/turf.min',
        'slick': '//cdn.jsdelivr.net/jquery.slick/1.6.0/slick.min',
        // "ol3" : "ol-debug",
        // "ol-custom" : "ol-custom",
        // "ol3css" : "../css/ol",
        'bootstrap': '//maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min',
        'aigle': 'aigle-es5.min',
        'app': 'app-built'
    },
    shim: {
        'jquery': {
            exports: '$'
        },
        'ji18n': {
            deps: ['i18n', 'jquery']
        },
        'i18nxhr': {
            deps: ['i18n']
        },
        'jui': {
            deps: ['jquery']
        },
        'turf': {
            exports: 'turf'
        },
        'slick': {
            deps: ['jquery']
        },
        'ol': {
            exports: 'ol'
        },
        'aigle': {
            exports: 'Promise'
        },
        'tps': {
            exports: 'ThinPlateSpline'
        },
        'bootstrap': {
            deps: ['jquery']
        }
    }
});
