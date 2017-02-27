define(['histmap', 'tin', 'aigle'], function(ol, Tin, Promise) {
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
                    obj.finalizeCreateAsync_(this.response, resolve);
                } else {
                    // self.postMessage({'event':'cannotLoad'});
                }
            };
            xhr.send();
            obj = new ol.source.HistMap_tin(options);
        });
    };

    ol.source.HistMap_tin.prototype.finalizeCreateAsync_ = function(points, resolve) {
        this.tin.setPoints(points);
        this.tin.updateTin();
        resolve(this);
    };

    ol.source.HistMap_tin.prototype.xy2MercAsync_ = function(xy) {
        var self = this;
        return new Promise(function(resolve, reject) {
            resolve(self.tin.transform(xy, false));
        });
    };
    ol.source.HistMap_tin.prototype.merc2XyAsync_ = function(merc) {
        var self = this;
        return new Promise(function(resolve, reject) {
            resolve(self.tin.transform(merc, true));
        });
    };

    return ol;
});
