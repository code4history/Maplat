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
        'i18nxhr': 'i18nextXHRBackend.min',
        // 'swiper': 'swiper.min',
        // 'turf': 'turf.min',
        'ol3': 'ol-debug',
        'ol-custom': 'ol-custom',
        // 'bootstrap': 'bootstrap-native.min',
        'tps': 'thinplatespline',
        'jquery': '//code.jquery.com/jquery-1.11.2.min',
        'i18n': '//cdnjs.cloudflare.com/ajax/libs/i18next/4.1.4/i18next.min',
        'turf': '//npmcdn.com/@turf/turf@3.7.0/turf.min',
        'swiper': '//cdnjs.cloudflare.com/ajax/libs/Swiper/3.4.2/js/swiper.min',
        // "ol3" : "ol-debug",
        // "ol-custom" : "ol-custom",
        // "ol3css" : "../css/ol",
        'bootstrap': '//cdnjs.cloudflare.com/ajax/libs/bootstrap.native/2.0.10/bootstrap-native.min',
        'aigle': 'aigle-es5.min',
        'app': 'app-built'
    },
    shim: {
        'jquery': {
            exports: '$'
        },
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
