define(['ol-custom'], function(ol) {
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

    ol.source.HistMap = function(optOptions) {
        var self = this;
        var options = optOptions || {};
        options.wrapX = false;
        if (options.mapID) {
            this.mapID = options.mapID;
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

        this.width = options.width;
        this.height = options.height;
        var zW = Math.log2(this.width/tileSize);
        var zH = Math.log2(this.height/tileSize);
        this.maxZoom = options.maxZoom = Math.ceil(Math.max(zW, zH));
        this._maxxy = Math.pow(2, this.maxZoom) * tileSize;
        options.tileUrlFunction = function(coord) {
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
                    tImage = $('<img>').get(0);
                    tImage.crossOrigin = 'Anonymous';
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

    ol.inherits(ol.source.HistMap, ol.source.XYZ);

    ol.source.HistMap.createAsync = function(options) {
        var algorythm = options.algorythm || 'tin';
        return ol.source['HistMap_' + algorythm].createAsync(options);
    };
    ol.source.setCustomFunction(ol.source.HistMap);
    ol.source.HistMap.prototype.xy2MercAsync = function(xy) {
        return this.xy2MercAsync_(xy);
    };
    ol.source.HistMap.prototype.merc2XyAsync = function(merc) {
        return this.merc2XyAsync_(merc);
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

    return ol;
});
