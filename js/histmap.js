define(['ol-custom'], function(ol) {
    for (var z = 0; z < 9; z++) {
        var key = 'ZOOM:' + z;
        var maxxy = 256 * Math.pow(2, z);

        (function(key, maxxy) {
            var projection = new ol.proj.Projection({
                code: key,
                // The extent is used to determine zoom level 0. Recommended values for a
                // projection's validity extent can be found at https://epsg.io/.
                extent: [0.0, 0.0, maxxy, maxxy],
                units: 'm'
            });
            ol.proj.addProjection(projection);

            // We also declare EPSG:21781/EPSG:4326 transform functions. These functions
            // are necessary for the ScaleLine control and when calling ol.proj.transform
            // for setting the view's initial center (see below).

            ol.proj.addCoordinateTransforms('EPSG:3857', projection,
                function(coordinate) {
                    var x = (coordinate[0] + ol.const.MERC_MAX) * maxxy / (2 * ol.const.MERC_MAX);
                    var y = (-coordinate[1] + ol.const.MERC_MAX) * maxxy / (2 * ol.const.MERC_MAX);
                    return [x, y];
                },
                function(coordinate) {
                    var x = coordinate[0] * (2 * ol.const.MERC_MAX) / maxxy - ol.const.MERC_MAX;
                    var y = -1 * (coordinate[1] * (2 * ol.const.MERC_MAX) / maxxy - ol.const.MERC_MAX);
                    return [x, y];
                });
        })(key, maxxy);
    }
    // 透明PNG定義
    var transPng = 'data:image/png;base64,'+
        'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAMAAABrrFhUAAAAB3RJTUUH3QgIBToaSbAjlwAAABd0'+
        'RVh0U29mdHdhcmUAR0xEUE5HIHZlciAzLjRxhaThAAAACHRwTkdHTEQzAAAAAEqAKR8AAAAEZ0FN'+
        'QQAAsY8L/GEFAAAAA1BMVEX///+nxBvIAAAAAXRSTlMAQObYZgAAAFRJREFUeNrtwQEBAAAAgJD+'+
        'r+4ICgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'+
        'AAAAAAAAAAAAABgBDwABHHIJwwAAAABJRU5ErkJggg==';
    // タイル画像サイズ
    var tileSize = 256;
    // canvasのテンプレート
    var canvBase = '<canvas width="' + tileSize + '" height="' + tileSize + '" src="' + transPng + '"></canvas>';
    var baseDict = {
        osm: {
            mapID: 'osm',
            title: {
                ja: 'オープンストリートマップ',
                en: 'OpenStreetMap'
            },
            label: {
                ja: 'OSM(現在)',
                en: 'OSM(Now)'
            },
            attr: '©︎ OpenStreetMap contributors',
            maptype: 'base'
        },
        gsi: {
            mapID: 'gsi',
            title: {
                ja: '地理院地図',
                en: 'Geospatial Information Authority of Japan Map'
            },
            label: {
                ja: '地理院地図',
                en: 'GSI Map'
            },
            attr: {
                ja: '国土地理院',
                en: 'The Geospatial Information Authority of Japan'
            },
            maptype: 'base',
            url: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',
            maxZoom: 18
        },
        gsi_ortho: {
            mapID: 'gsi_ortho',
            title: {
                ja: '地理院地図オルソ航空写真',
                en: 'Geospatial Information Authority of Japan Ortho aerial photo'
            },
            label: {
                ja: '地理院オルソ',
                en: 'GSI Ortho'
            },
            attr: {
                ja: '国土地理院',
                en: 'The Geospatial Information Authority of Japan'
            },
            maptype: 'base',
            url: 'https://cyberjapandata.gsi.go.jp/xyz/ort/{z}/{x}/{y}.jpg',
            maxZoom: 18
    },
    };

    ol.source.HistMap = function(optOptions) {
        var options = optOptions || {};
        options.wrapX = false;
        if (!options.imageExtention) options.imageExtention = 'jpg';
        if (options.mapID) {
            this.mapID = options.mapID;
            options.url = options.url || 'tiles/' + options.mapID + '/{z}/{x}/{y}.' + options.imageExtention;
        }

        if (options.urls) {
            this._tileUrlFunction =
                ol.TileUrlFunction.createFromTemplates(
                    options.urls);
        } else if (options.url) {
            this._tileUrlFunction =
                ol.TileUrlFunction.createFromTemplates(
                    ol.TileUrlFunction.expandUrl(options.url));
        }

        this.width = options.width;
        this.height = options.height;
        var zW = Math.log2(this.width/tileSize);
        var zH = Math.log2(this.height/tileSize);
        this.maxZoom = options.maxZoom = Math.ceil(Math.max(zW, zH));
        this._maxxy = Math.pow(2, this.maxZoom) * tileSize;
        options.tileUrlFunction = options.tileUrlFunction || function(coord) {
            var z = coord[0];
            var x = coord[1];
            var y = -1 * coord[2] - 1;
            if (x * tileSize * Math.pow(2, this.maxZoom - z) >= this.width ||
                y * tileSize * Math.pow(2, this.maxZoom - z) >= this.height ||
                x < 0 || y < 0 ) {
                return transPng;
            }
            return this._tileUrlFunction(coord);
        };

        ol.source.XYZ.call(this, options);
        ol.source.setCustomInitialize(this, options);

        this.setupTileLoadFunction();
    };

    ol.inherits(ol.source.HistMap, ol.source.XYZ);

    ol.source.HistMap.getTransPng = function() {
        return transPng;
    };

    ol.source.HistMap.createAsync = function(options, commonOptions) {
        if (typeof options === 'string') {
            options = baseDict[options];
        }
        options = Object.assign(options, commonOptions);
        if (!options.maptype) options.maptype = 'maplat';
        options.label = ol.source.translate(options.label || options.year);
        if (options.attr) {
            options.attributions = [
                new ol.Attribution({
                    html: ol.source.translate(options.attr)
                })
            ];
        }
        if (options.maptype == 'base' || options.maptype == 'overlay') {
            options.sourceID = options.mapID;
            var targetSrc = options.maptype == 'base' ? ol.source.NowMap : ol.source.TmsMap;
            return targetSrc.createAsync(Object.assign({
                url: options.url,
                sourceID: options.sourceID,
                label: options.label
            }, options)).catch(function(err) {
                throw err;
            });
        }

        return new Promise(function(resolve, reject) {
            requirejs(['histmap_tin'], resolve);
        }).then(function() {
            return ol.source.HistMap_tin.createAsync(Object.assign({
                title: options.title || options.era,
                mapID: options.mapID,
                width: options.width,
                height: options.height,
                maptype: options.maptype,
                sourceID: options.sourceID || options.mapID,
                label: options.label
            }, options))
                .then(function(obj) {
                    return new Promise(function(resolve, reject) {
                        if (options.noload) {
                            /* MaplatEditor用 なくさない */
                            resolve(obj);
                            return;
                        }
                        obj.mapSize2MercSize(resolve);
                    });
                }).catch(function(err) {
                    throw err;
                });
        }).catch(function(err) {
            throw err;
        });
    };
    ol.source.setCustomFunction(ol.source.HistMap);

    ol.source.HistMap.prototype.setupTileLoadFunction = function(xy) {
        var self = this;
        this.setTileLoadFunction((function() {
            var numLoadingTiles = 0;
            var tileLoadFn = self.getTileLoadFunction();
            return function(tile, src) {
                if (numLoadingTiles === 0) {
                    // console.log('loading');
                }
                ++numLoadingTiles;
                var image = tile.getImage();
                var tImage = tile.tImage;
                if (!tImage) {
                    tImage = document.createElement('img');
                    tImage.crossOrigin = 'Anonymous';
                    tile.tImage = tImage;
                }
                tImage.onload = tImage.onerror = function() {
                    if (tImage.width && tImage.height) {
                        if (tImage.width != tileSize || tImage.height != tileSize) {
                            var tmp = document.createElement('div');
                            tmp.innerHTML = canvBase;
                            var tCanv = tmp.childNodes[0];
                            var ctx = tCanv.getContext('2d');
                            ctx.drawImage(tImage, 0, 0);
                            var dataUrl = tCanv.toDataURL();
                            image.crossOrigin=null;
                            tileLoadFn(tile, dataUrl);
                            tCanv = tImage = ctx = null;
                        } else {
                            image.crossOrigin='Anonymous';
                            tileLoadFn(tile, src);
                        }
                    }
                    --numLoadingTiles;
                    if (numLoadingTiles === 0) {
                        // console.log('idle');
                    }
                };
                tImage.src = src;
            };
        })());
    };

    ol.source.HistMap.prototype.xy2MercAsync = function(xy) {
        var convertXy = this.histMapCoords2Xy(xy);
        return this.xy2MercAsync_(convertXy);
    };
    ol.source.HistMap.prototype.merc2XyAsync = function(merc) {
        var self = this;
        return this.merc2XyAsync_(merc).then(function(convertXy) {
            return self.xy2HistMapCoords(convertXy);
        }).catch(function(err) { throw err; });
    };

    ol.source.HistMap.prototype.mapSize2MercSize = function(callback) {
        var xy = [this.width / 2, this.height / 2];
        var self = this;
        Promise.all([[xy[0] - 150, xy[1]], [xy[0] + 150, xy[1]], [xy[0], xy[1] - 150], [xy[0],
            xy[1] + 150], [xy[0], xy[1]]].map(function(coord) {
            return self.xy2MercAsync_(coord);
        })).then(function(mercs) {
            var delta1 = Math.sqrt(Math.pow(mercs[0][0] - mercs[1][0], 2) + Math.pow(mercs[0][1] - mercs[1][1], 2));
            var delta2 = Math.sqrt(Math.pow(mercs[2][0] - mercs[3][0], 2) + Math.pow(mercs[2][1] - mercs[3][1], 2));
            var delta = (delta1 + delta2) / 2;
            self.merc_zoom = Math.log(300 * (2*ol.const.MERC_MAX) / 256 / delta) / Math.log(2) - 3;
            self.home_position = ol.proj.toLonLat(mercs[4]);
            callback(self);
        }).catch(function(err) { throw err; });
    };

    ol.source.HistMap.prototype.histMapCoords2Xy = function(histCoords) {
        var x = (histCoords[0] + ol.const.MERC_MAX) * this._maxxy / (2*ol.const.MERC_MAX);
        var y = (-histCoords[1] + ol.const.MERC_MAX) * this._maxxy / (2*ol.const.MERC_MAX);
        return [x, y];
    };

    ol.source.HistMap.prototype.xy2HistMapCoords = function(xy) {
        var histX = xy[0] * (2*ol.const.MERC_MAX) / this._maxxy - ol.const.MERC_MAX;
        var histY = -1 * (xy[1] * (2*ol.const.MERC_MAX) / this._maxxy - ol.const.MERC_MAX);
        return [histX, histY];
    };

    ol.source.HistMap.prototype.insideCheckXy = function(xy) {
        return !(xy[0] < 0 || xy[0] > this.width || xy[1] < 0 || xy[1] > this.height);
    };

    ol.source.HistMap.prototype.insideCheckHistMapCoords = function(histCoords) {
        return this.insideCheckXy(this.histMapCoords2Xy(histCoords));
    };

    ol.source.HistMap.prototype.modulateXyInside = function(xy) {
        var dx = xy[0] / (this.width / 2) - 1;
        var dy = xy[1] / (this.height / 2) - 1;
        var da = Math.max(Math.abs(dx), Math.abs(dy));
        return [(dx / da + 1) * this.width / 2, (dy / da + 1) * this.height / 2];
    };

    ol.source.HistMap.prototype.modulateHistMapCoordsInside = function(histCoords) {
        var xy = this.histMapCoords2Xy(histCoords);
        var ret = this.modulateXyInside(xy);
        return this.xy2HistMapCoords(ret);
    };

    return ol;
});
