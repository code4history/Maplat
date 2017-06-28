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
    },
    shim: {
        'app': {
            deps: [
                'css!../common/css/bootstrap.min',
                'css!../css/non-responsive',
                'css!../common/css/bootstrap-theme.min',
                'css!../common/css/ol',
                'css!../css/theme.css'
            ]
        }
    }
});
