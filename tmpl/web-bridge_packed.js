var MaplatUi = require('../src/index_packed').MaplatUi;

var Maplat = window.Maplat = {};
Maplat.createObject = function(option) {
    return new Promise(function(resolve) {
        var app = new MaplatUi(option);
        app.waitReady.then(function() {
            resolve(app);
        });
    });
};