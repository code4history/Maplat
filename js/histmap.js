define(["ol-custom", "tps"], function(ol, ThinPlateSpline) {
    //透明PNG定義
    var transPng = 'data:image/png;base64,'+
        'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAMAAABrrFhUAAAAB3RJTUUH3QgIBToaSbAjlwAAABd0'+
        'RVh0U29mdHdhcmUAR0xEUE5HIHZlciAzLjRxhaThAAAACHRwTkdHTEQzAAAAAEqAKR8AAAAEZ0FN'+
        'QQAAsY8L/GEFAAAAA1BMVEX///+nxBvIAAAAAXRSTlMAQObYZgAAAFRJREFUeNrtwQEBAAAAgJD+'+
        'r+4ICgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'+
        'AAAAAAAAAAAAABgBDwABHHIJwwAAAABJRU5ErkJggg==';
    // タイル画像サイズ
    var tileSize    = 256;
    // canvasのテンプレート
    var canvBase = "<canvas width=\"" + tileSize +"\" height=\"" + tileSize + "\" src=\"" + transPng + "\"></canvas>";

    ol.source.histMap = function(opt_options) {
        var self = this;
        var options = opt_options || {};
        options.wrapX = false;
        if (options.mapID) {
            this.mapID = options.mapID
            options.url = 'tiles/' + options.mapID + '/{z}/{x}/{y}.jpg';
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

        this.width   = options.width;
        this.height  = options.height;
        var zW       = Math.log2(this.width/tileSize);
        var zH       = Math.log2(this.height/tileSize);
        this.maxZoom = options.maxZoom = Math.ceil(Math.max(zW,zH));
        this._maxxy  = Math.pow(2,this.maxZoom) * tileSize;
        options.tileUrlFunction = function(coord) {
            var z = coord[0];
            var x = coord[1];
            var y = -1 * coord[2] - 1;
            if (x * tileSize * Math.pow(2,this.maxZoom - z) > this.width || 
                y * tileSize * Math.pow(2,this.maxZoom - z) > this.height ||
                x < 0 || y < 0 ) {
                return transPng;
            }
            return this._tileUrlFunction(coord);
        };

        ol.source.XYZ.call(this, options) ;
        ol.source.setCustomInitialize(this, options);

        if (options.tps_points || options.tps_serial) {
            var tps_option = {
                'use_worker' : true,
                'transform_callback' : options.transform_callback,
                'error_callback' : options.error_callback,
                'web_fallback' : options.web_fallback,
                'on_solved' : options.on_solved,
                'on_serialized' : options.on_serialized
            };

            this.tps = new ThinPlateSpline(tps_option);
            if (options.tps_points) {
                this.tps.load_points(options.tps_points);
            } else {
                this.tps.load_serial(options.tps_serial);
            }
        }

        this.setTileLoadFunction((function() { 
            var numLoadingTiles = 0; 
            var tileLoadFn = self.getTileLoadFunction(); 
            return function(tile, src) {
                if (numLoadingTiles === 0) { 
                    //console.log('loading'); 
                } 
                ++numLoadingTiles; 
                var image = tile.getImage();
                var tImage = tile.tImage;
                if (!tImage) {
                    tImage = $('<img>').get(0);
                    tImage.crossOrigin = "Anonymous";
                    tile.tImage = tImage;
                }
                tImage.onload = tImage.onerror = function() {
                    if (tImage.width && tImage.height) {
                        if (tImage.width != tileSize || tImage.height != tileSize) {
                            var tCanv = $(canvBase).get(0);
                            var ctx = tCanv.getContext('2d');
                            ctx.drawImage(tImage, 0, 0);
                            var dataUrl = tCanv.toDataURL();
                            image.crossOrigin=null;
                            tileLoadFn(tile, dataUrl);          
                            tCanv = tImage = ctx = null;
                        } else {
                            image.crossOrigin="Anonymous";
                            tileLoadFn(tile, src); 
                        }
                    }
                    --numLoadingTiles; 
                    if (numLoadingTiles === 0) { 
                        //console.log('idle'); 
                    } 
                };
                tImage.src = src;
            }; 
        })());
    };

    ol.inherits(ol.source.histMap, ol.source.XYZ);

    ol.source.histMap.createAsync = function(options) {
        var promise = new Promise(function(resolve, reject) {
            var obj;
            options.on_serialized = function() {
                if (options.tps_points) {
                    var a = document.createElement("a");
                    document.body.appendChild(a);
                    a.style = "display: none";
                    var blob = new Blob([ obj.tps.serialize() ]),
                        url = window.URL.createObjectURL(blob);
                    a.href = url;
                    a.download = options.tps_serial;
                    a.click();
                    window.URL.revokeObjectURL(url);
                }
                resolve(obj);
            };
            options.transform_callback = function(coord, isRev, tf_options) {
                if (tf_options.callback) {
                    tf_options.callback(coord);
                }
            };
            obj = new ol.source.histMap(options);
        });
        return promise;
    };
    ol.source.setCustomFunction(ol.source.histMap);
    ol.source.histMap.prototype.xy2MercAsync = function(xy) {
        var self = this;
        var promise = new Promise(function(resolve, reject) {
            var x = (xy[0]  + ol.const.MERC_MAX) * self._maxxy / (2*ol.const.MERC_MAX);
            var y = (-xy[1] + ol.const.MERC_MAX) * self._maxxy / (2*ol.const.MERC_MAX);
            self.tps.transform([x,y], false, {
                callback: function(merc) {
                    resolve(merc);
                }
            });
        });
        return promise;        
    };
    ol.source.histMap.prototype.merc2XyAsync = function(merc) {
        var self = this;
        var promise = new Promise(function(resolve, reject) {
            self.tps.transform(merc, true, {
                callback: function(xy) {
                    var x =       xy[0] * (2*ol.const.MERC_MAX) / self._maxxy - ol.const.MERC_MAX;
                    var y = -1 * (xy[1] * (2*ol.const.MERC_MAX) / self._maxxy - ol.const.MERC_MAX);
                    resolve([x,y]);
                }
            });
        });
        return promise;
    }; 


    return ol;
});