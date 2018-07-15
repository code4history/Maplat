;

window.Maplat = {};
Maplat.onLoad = function(func) {
    Maplat.__func = func;
    if (Maplat.__app) func(Maplat.__app);
};
require(['{app}'], function(app) {
    Maplat.__app = app;
    if (Maplat.__func) Maplat.__func(app);
});
Maplat.createObject = function(option) {
    return new Promise(function(resolve) {
        Maplat.onLoad(function(MaplatApp) {
            var app = new MaplatApp(option);
            app.waitReady.then(function() {
                resolve(app);
            });
        });
    });
};
