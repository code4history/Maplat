define(['histmap', 'tin'], function(ol, Tin) {
    ol.source.HistMap_tin = function(optOptions) {
        var options = optOptions || {};

        ol.source.HistMap.call(this, options);

        this.tin = new Tin({
            wh: [this.width, this.height],
            strictMode: options.strictMode,
            vertexMode: options.vertexMode
        });
    };
    ol.inherits(ol.source.HistMap_tin, ol.source.HistMap);

    ol.source.HistMap_tin.createAsync = function(options) {
        return new Promise(function(resolve, reject) {
            var obj = new ol.source.HistMap_tin(options);
            var proj = new ol.proj.Projection({
                code: 'Illst:' + obj.mapID,
                extent: [0.0, 0.0, obj.width, obj.height],
                units: 'm'
            });
            ol.proj.addProjection(proj);
            ol.proj.addCoordinateTransforms(proj, 'EPSG:3857', function(xy) {
                return obj.tin.transform(xy, false);
            }, function(merc) {
                return obj.tin.transform(merc, true);
            });
            ol.proj.transformDirect('EPSG:4326', proj);
            if (options.compiled) {
                obj.tin.setCompiled(options.compiled);
                resolve(obj);
            } else {
                obj.finalizeCreateAsync_(options.gcps, resolve);
            }
        });
    };

    ol.source.HistMap_tin.prototype.finalizeCreateAsync_ = function(points, resolve) {
        var self = this;
        this.tin.setPoints(points);
        this.tin.updateTinAsync()
            .then(function() {
                resolve(self);
            });
    };

    ol.source.HistMap_tin.prototype.xy2MercAsync_ = function(xy) {
        var self = this;
        return new Promise(function(resolve, reject) {
            resolve(ol.proj.transformDirect(xy, 'Illst:' + self.mapID, 'EPSG:3857'));
        }).catch(function(err) {
            throw err;
        });
    };
    ol.source.HistMap_tin.prototype.merc2XyAsync_ = function(merc) {
        var self = this;
        return new Promise(function(resolve, reject) {
            resolve(ol.proj.transformDirect(merc, 'EPSG:3857', 'Illst:' + self.mapID));
        }).catch(function(err) {
            throw err;
        });
    };

    return ol;
});
