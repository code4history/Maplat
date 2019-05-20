define(['histmap', 'tin'], function(ol, Tin) {
    ol.source.HistMap_tin = function(optOptions) {
        var options = optOptions || {};

        ol.source.HistMap.call(this, options);

        this.tins = [new Tin({
            wh: [this.width, this.height],
            strictMode: options.strictMode,
            vertexMode: options.vertexMode,
            importance: 0,
            priority: 0
        })];
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
                return obj.tins[0].transform(xy, false);
            }, function(merc) {
                return obj.tins[0].transform(merc, true);
            });
            ol.proj.transformDirect('EPSG:4326', proj);
            var prom;
            if (options.compiled) {
                obj.tins[0].setCompiled(options.compiled);
                prom = Promise.resolve();
            } else {
                obj.tins[0].setPoints(options.gcps);
                prom = obj.tins[0].updateTinAsync();
            }
            prom.then(function() {
                var proms;
                if (options.sub_maps) {
                    var promarray = options.sub_maps.map(function(sub_map, i) {
                        var index = i + 1;
                        var tin = obj.tins[index] = new Tin({
                            bounds: sub_map.bounds,
                            strictMode: options.strictMode,
                            vertexMode: options.vertexMode,
                            importance: sub_map.importance,
                            priority: sub_map.priority
                        });
                        var proj = new ol.proj.Projection({
                            code: 'Illst:' + obj.mapID + '#' + index,
                            extent: [tin.xy[0], tin.xy[1], tin.wh[0], tin.wh[1]],
                            units: 'm'
                        });
                        ol.proj.addProjection(proj);
                        ol.proj.addCoordinateTransforms(proj, 'EPSG:3857', function(xy) {
                            return obj.tins[index].transform(xy, false);
                        }, function(merc) {
                            return obj.tins[index].transform(merc, true);
                        });
                        ol.proj.transformDirect('EPSG:4326', proj);
                        if (sub_map.compiled) {
                            obj.tins[index].setCompiled(sub_map.compiled);
                            return Promise.resolve();
                        } else {
                            obj.tins[index].setPoints(sub_map.gcps);
                            return obj.tins[index].updateTinAsync();
                        }
                    });
                    proms = Promise.all(promarray);
                } else {
                    proms = Promise.resolve();
                }
                proms.then(function() {
                    resolve(obj);
                });
            });
        });
    };

    ol.source.HistMap_tin.prototype.xy2MercAsync_ = function(xy, ) {
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
