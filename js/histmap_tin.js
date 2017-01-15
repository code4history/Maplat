define(['histmap', 'tin'], function(ol, Tin) {
    ol.source.HistMap_tin = function(optOptions) {
        var options = optOptions || {};

        ol.source.HistMap.call(this, options);

        this.tin = new Tin({
            wh: [this.width, this.height]
        });
    };
    ol.inherits(ol.source.HistMap_tin, ol.source.HistMap);

    ol.source.HistMap_tin.createAsync = function(options) {
        return new Promise(function(resolve, reject) {
            var obj;
            var url = options.tin_points_url || 'json/' + options.mapID + '_points.json';
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'json';

            xhr.onload = function(e) {
                if (this.status == 200) {
                    var points = this.response;
                    obj.tin.setPoints(points);
                    obj.tin.updateTin();
                    resolve(obj);
                } else {
                    // self.postMessage({'event':'cannotLoad'});
                }
            };
            xhr.send();
            obj = new ol.source.HistMap_tin(options);
        });
    };

    ol.source.HistMap_tin.prototype.xy2MercAsync_ = function(histMapCoords) {
        var self = this;
        return new Promise(function(resolve, reject) {
            var xy = self.histMapCoords2Xy(histMapCoords);
            var merc = self.tin.transform(xy, false);
            resolve(merc);
        });
    };
    ol.source.HistMap_tin.prototype.merc2XyAsync_ = function(merc) {
        var self = this;
        return new Promise(function(resolve, reject) {
            var xy = self.tin.transform(merc, true);
            var histMapCoords = self.xy2HistMapCoords(xy);
            resolve(histMapCoords);
        });
    };
});
