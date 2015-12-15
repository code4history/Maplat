define(["ol-custom", "tps"], function(ol, tps) {
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
            options.url = 'tiles/' + options.mapID + '-{z}_{x}_{y}.jpg';
        }

        ol.source.OSM.call(this, options) ;

        this.setTileLoadFunction((function() { 
            var numLoadingTiles = 0; 
            var tileLoadFn = self.getTileLoadFunction(); 
            return function(tile, src) { 
                if (numLoadingTiles === 0) { 
                    console.log('loading'); 
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
                    --numLoadingTiles; 
                    if (numLoadingTiles === 0) { 
                        console.log('idle'); 
                    } 
                };
                tImage.src = src;
            }; 
        })());
    }

    ol.inherits(ol.source.histMap, ol.source.OSM);
    ol.source.histMap.prototype.getMapID = function() {
        return this.mapID;
    };

    return ol.source.histMap;
});