define(['histmap_tin', 'aigle'], function(ol, Promise) {
    ol.source.HistMap_external = function(optOptions) {
        var options = optOptions || {};

        ol.source.HistMap_tin.call(this, options);
    };
    ol.inherits(ol.source.HistMap_external, ol.source.HistMap_tin);

    ol.source.HistMap_external.createAsync = function(options) {
        var xhr = new XMLHttpRequest();
        var apiEp = window.location.hostname.match(/localhost/) ? 'http://localhost:3000/' :
            'https://mlgw.tilemap.jp/';
        return new Promise(function(resolve, reject) {
            var url = apiEp + options.maptype + '/dat/' + options.mapID;
            xhr.open('GET', url, true);
            xhr.responseType = 'json';

            xhr.onload = function(e) {
                if (this.status == 200) {
                    var doc = this.response;
                    resolve(doc);
                } else {
                    console.log('error');
                }
            };
            xhr.send();
        }).then(function(dat) {
            options.width = dat.width;
            options.height = dat.height;
            options.title = options.label = dat.title;

            options.attributions = [
                new ol.Attribution({
                    html: dat.attr
                })
            ];

            options.url = apiEp + options.maptype + '/img/' + options.mapID + '/{z}/{x}/{y}';
            options.thumbnail = dat.thumbnail;

            return dat.coords;
        }).then(function(points) {
            return new Promise(function(resolve, reject) {
                var obj = new ol.source.HistMap_external(options);
                obj.finalizeCreateAsync_(points, resolve);
            });
        });
    };

    ol.source.HistMap_external.prototype.setupTileLoadFunction = function(xy) {
        var self = this;
        this.setTileLoadFunction((function() {
            var numLoadingTiles = 0;
            var tileLoadFn = self.getTileLoadFunction();
            return function(tile, src) {
                if (numLoadingTiles === 0) {
                    // console.log('loading');
                }
                ++numLoadingTiles;
                var xhr = new XMLHttpRequest();
                xhr.open('GET', src, true);
                xhr.responseType = 'text';

                xhr.onload = function(e) {
                    if (this.status == 200) {
                        var doc = this.response;
                        tileLoadFn(tile, doc);
                    } else {
                        console.log('error');
                    }
                    --numLoadingTiles;
                    if (numLoadingTiles === 0) {
                        // console.log('idle');
                    }
                };
                xhr.send();
            };
        })());
    };

    return ol;
});
