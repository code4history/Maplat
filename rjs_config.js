({
    baseUrl: 'js',
    name: 'app',
    out: 'js/built.js',
    paths: {
        "jquery" : "//code.jquery.com/jquery-1.11.2.min",
        "jui" : "//code.jquery.com/ui/1.10.3/jquery-ui.min",
        "slick" : "//cdn.jsdelivr.net/jquery.slick/1.6.0/slick.min",
        "ol3" : "ol-debug",
        "ol-custom" : "ol-custom",
        //"ol3css" : "../css/ol",
        "bootstrap" : "//maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min",
        //"bootstrapcss" : "//maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min",
        "tps" : "thinplatespline"
    },
    shim: {
        'jquery' : {
            exports: '$'
        },
        'jui' : { 
            deps: ['jquery'] 
        },
        'slick' : {
            deps: ['jquery']
        },
        'ol' : {
            exports: 'ol'
        },
        'tps' : {
            exports: 'ThinPlateSpline'
        },
        'bootstrap' : { 
            deps: ['jquery'] 
        }
    }
})
