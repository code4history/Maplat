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
    var i18n;
    var t = function(arg) { return arg; };
    // canvasのテンプレート
    var canvBase = '<canvas width="' + tileSize + '" height="' + tileSize + '" src="' + transPng + '"></canvas>';
    var baseDict = {
        osm: {
            mapID: 'osm',
            label: {
                ja: 'OSM(現在)',
                en: 'OSM(Now)'
            },
            maptype: 'base'
        },
        gsi: {
            mapID: 'gsi',
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
        }
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

        for (var i = 0; i < ol.source.HistMap.META_KEYS.length; i++) {
            var key = ol.source.HistMap.META_KEYS[i];
            this[key] = options[key];
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

    ol.source.HistMap.setI18n = function(i18n_, t_) {
        i18n = i18n_;
        t = t_;
    };

    ol.source.HistMap.translate = function(dataFragment, defLang) {
        if (!dataFragment || typeof dataFragment != 'object') return dataFragment;
        if (!i18n) return dataFragment; // For MaplatEditor
        var langs = Object.keys(dataFragment);
        var key = langs.reduce(function(prev, curr, idx, arr) {
            if (curr == defLang) {
                prev = [dataFragment[curr], true];
            } else if (!prev || (curr == 'en' && !prev[1])) {
                prev = [dataFragment[curr], false];
            }
            if (idx == arr.length - 1) return prev[0];
            return prev;
        }, null);
        key = (typeof key == 'string') ? key : key + '';
        if (i18n.exists(key, {ns: 'translation', nsSeparator: '__X__yX__X__'}))
            return t(key, {ns: 'translation', nsSeparator: '__X__yX__X__'});
        for (var i = 0; i < langs.length; i++) {
            var lang = langs[i];
            i18n.addResource(lang, 'translation', key, dataFragment[lang]);
        }
        return t(key, {ns: 'translation', nsSeparator: '__X__yX__X__'});
    };

    ol.source.HistMap.createAsync = function(options, commonOptions) {
        if (typeof options === 'string') {
            options = baseDict[options];
        }
        options = Object.assign(options, commonOptions);
        if (!options.maptype) options.maptype = 'maplat';
        if (!options.algorythm) options.algorythm = 'tin';
        options.label = ol.source.HistMap.translate(options.label || options.year);
        if (options.attr) {
            options.attributions = [
                new ol.Attribution({
                    html: ol.source.HistMap.translate(options.attr)
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

        var algorythm = options.algorythm || 'tin';
        return new Promise(function(resolve, reject) {
            requirejs(['histmap_' + algorythm], resolve);
        }).then(function() {
            return ol.source['HistMap_' + algorythm].createAsync(Object.assign({
                title: options.title || options.era,
                mapID: options.mapID,
                width: options.width,
                height: options.height,
                maptype: options.maptype,
                algorythm: options.algorythm,
                sourceID: options.sourceID || options.mapID + ':' + options.maptype + ':' + options.algorythm,
                label: options.label
            }, options))
                .then(function(obj) {
                    return new Promise(function(resolve, reject) {
                        if (!options.gcps || options.gcps.length < 3) resolve(obj);
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

    ol.source.HistMap.META_KEYS = ['title', 'officialTitle', 'author', 'createdAt', 'era',
        'contributor', 'mapper', 'license', 'dataLicense', 'attr', 'dataAttr',
        'reference', 'description'];

    return ol;
});
