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
    },
    shim: {}
});
