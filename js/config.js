require.config({
    baseUrl: 'js',
    map: {
        '*': {
            'css': '//cdnjs.cloudflare.com/ajax/libs/require-css/0.1.8/css.min.js'
        }
    },
    paths: {
        'i18nxhr': 'i18nextXHRBackend.min',
        'ol3': 'ol-debug',
        'ol-custom': 'ol-custom',
        'tps': 'thinplatespline',
        'i18n': '//cdnjs.cloudflare.com/ajax/libs/i18next/8.4.2/i18next.min',
        'turf': '//npmcdn.com/@turf/turf@4.4.0/turf.min',
        'swiper': '//cdnjs.cloudflare.com/ajax/libs/Swiper/3.4.2/js/swiper.min',
        'bootstrap': '//cdnjs.cloudflare.com/ajax/libs/bootstrap.native/2.0.10/bootstrap-native.min',
        'aigle': 'aigle-es5.min',
        'app': 'app-built'
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
        }/* ,
        'app': {
            deps: [
                'css!//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min',
                'css!//cdnjs.cloudflare.com/ajax/libs/Swiper/3.4.2/css/swiper.min',
                'css!//maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min',
                'css!../css/ol', 'css!../css/app'
            ]
        }*/
    }
});
