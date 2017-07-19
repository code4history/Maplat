requirejs.config({
    baseUrl: 'js',
    map: {
        '*': {
            'css': 'common/js/css.min.js'
        }
    },
    paths: {
        'ol3': '../common/js/ol-debug',
        'bootstrap': '../common/js/bootstrap-native.min',
        'backbone': 'backbone-min',
        'underscore': 'underscore-min',
        'jquery': 'dummy-jq', // Dummy
        'histmap': '../common/js/histmap',
        'aigle': '../common/js/aigle-es5.min',
        'ol-custom': '../common/js/ol-custom',
        'histmap_tin': '../common/js/histmap_tin',
        'tin': '../common/js/tin',
        'turf': '../common/js/turf.min',
        'mapshaper': '../node_modules/mapshaper/mapshaper',
        'contextmenu': 'ol3-contextmenu',
        'geocoder': 'ol3-geocoder-debug',
        'switcher': 'ol3-layerswitcher'
    },
    shim: {
        'turf': {
            exports: 'turf'
        },
        'aigle': {
            exports: 'Promise'
        },
        'contextmenu': {
            deps: ['ol3']
        },
        'geocoder': {
            deps: ['ol3']
        },
        'switcher': {
            deps: ['ol3']
        }
    }
});
