require.config({
    baseUrl: "js",
    //map: {
    //    '*' : {
    //        'css' : "//cdnjs.cloudflare.com/ajax/libs/require-css/0.1.8/css.min.js"
    //    }
    //},
    paths: {
        "jquery" : "jquery-1.11.2.min",
        //"jui" : "jquery-ui.min",
        "turf" : "turf.min",
        "slick" : "slick.min",
        "ol3" : "ol-debug",
        "ol-custom" : "ol-custom",
        "bootstrap" : "bootstrap.min",
        "tps" : "thinplatespline"
        //"jquery" : "//code.jquery.com/jquery-1.11.2.min",
        //"jui" : "//code.jquery.com/ui/1.10.3/jquery-ui.min",
        //"turf" : "//npmcdn.com/@turf/turf@3.7.0/turf.min",
        //"slick" : "//cdn.jsdelivr.net/jquery.slick/1.6.0/slick.min",
        //"ol3" : "ol-debug",
        //"ol-custom" : "ol-custom",
        //"ol3css" : "../css/ol",
        //"bootstrapcss" : "//maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min",
    },
    shim: {
        'jquery' : {
            exports: '$'
        },
        'jui' : { 
            deps: ['jquery'] 
        },
        'turf' : {
            exports: 'turf'
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
});
