define(['histmap_tin'], function(ol) {
    var tileSize = 256;

    ol.source.HistMap_external = function(optOptions) {
        var options = optOptions || {};

        ol.source.HistMap_tin.call(this, options);
    };
    ol.inherits(ol.source.HistMap_external, ol.source.HistMap_tin);

    ol.source.HistMap_external.createAsync = function(options) {
        var xhr = new XMLHttpRequest();
        return new Promise(function(resolve, reject) {
            var url = 'http://localhost:3000/' + options.maptype + '/dat/' + options.mapID;
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
            options.title = dat.title;
            options.attributions = [
                new ol.Attribution({
                    html: dat.attr
                })
            ];
            // options.home_position = georef.center;

            /* var tileUrl = 'https://cors-anywhere.herokuapp.com/' + georef.pyramid.url;
            options.tileUrlFunction = function(coord) {
                var z = coord[0];
                var x = coord[1];
                var y = -1 * coord[2] - 1;
                if (x * tileSize * Math.pow(2, this.maxZoom - z) >= this.width ||
                    y * tileSize * Math.pow(2, this.maxZoom - z) >= this.height ||
                    x < 0 || y < 0 ) {
                    return ol.source.HistMap.getTransPng();
                }
                var level = this.maxZoom - z;
                var powLevel = Math.pow(2, level);
                var left = x * 256 * powLevel;
                var top = y * 256 * powLevel;
                var right = left + 256 * powLevel;
                var bottom = top + 256 * powLevel;
                if (right > this.width) right = this.width;
                if (bottom > this.height) bottom = this.height;
                var xcenter = (left + right) / 2;
                var ycenter = (top + bottom) / 2;
                var width = Math.floor((right - left) / powLevel);
                var height = Math.floor((bottom - top) / powLevel);
                return tileUrl + '&x=' + xcenter + '&y=' + ycenter + '&width=' + width + '&height=' + height + '&level=' + level;
            };*/

            options.url = 'http://localhost:3000/' + options.maptype + '/img/' + options.mapID + '/{z}/{x}/{y}';
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
