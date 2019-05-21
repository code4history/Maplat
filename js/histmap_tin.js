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
                        var projKey = 'Illst:' + obj.mapID + '#' + index;
                        var tin = obj.tins[index] = new Tin({
                            bounds: sub_map.bounds,
                            strictMode: options.strictMode,
                            vertexMode: options.vertexMode,
                            importance: sub_map.importance,
                            priority: sub_map.priority
                        });
                        var proj = new ol.proj.Projection({
                            code: projKey,
                            extent: [tin.xy[0], tin.xy[1], tin.wh[0], tin.wh[1]],
                            units: 'm'
                        });
                        ol.proj.addProjection(proj);
                        ol.proj.addCoordinateTransforms(proj, 'EPSG:3857', function(xy) {
                            return tin.transform(xy, false);
                        }, function(merc) {
                            return tin.transform(merc, true);
                        });
                        ol.proj.transformDirect('EPSG:4326', proj);
                        if (sub_map.compiled) {
                            tin.setCompiled(sub_map.compiled);
                            return Promise.resolve();
                        } else {
                            tin.setPoints(sub_map.gcps);
                            return tin.updateTinAsync();
                        }
                        var xyBounds = Object.assign([], sub_map.bounds);
                        xyBounds.push(sub_map.bounds[0]);
                        var mercBounds = xy_



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

    ol.source.HistMap_tin.prototype.xy2MercAsync_specifyLayer = function(xy, layerId) {
        var self = this;
        var layerKey = 'Illst:' + self.mapID + (layerId ? '#' + layerId : '');
        return new Promise(function(resolve, reject) {
            resolve(ol.proj.transformDirect(xy, layerKey, 'EPSG:3857'));
        }).catch(function(err) {
            throw err;
        });
    };
    ol.source.HistMap_tin.prototype.merc2XyAsync_specifyLayer = function(merc, layerId) {
        var self = this;
        var layerKey = 'Illst:' + self.mapID + (layerId ? '#' + layerId : '');
        return new Promise(function(resolve, reject) {
            resolve(ol.proj.transformDirect(merc, 'EPSG:3857', layerKey));
        }).catch(function(err) {
            throw err;
        });
    };

    ol.source.HistMap_tin.prototype.xy2MercAsync_returnLayer = function(xy) {
        var self = this;
        var tin_sorted = self.tins.map(function(tin, index) {
            return [index, tin];
        }).sort(function(a, b) {
            return a[1].priority < b[1].priority ? 1 : -1;
        });

        for (var i = 0; i < tin_sorted.length - 1; i++) {
            if (tin_sorted[i][1].bounds_polygon) {

            }
        }

        return new Promise(function(resolve, reject) {
            resolve(ol.proj.transformDirect(xy, 'Illst:' + self.mapID, 'EPSG:3857'));
        }).catch(function(err) {
            throw err;
        });
    };
    ol.source.HistMap_tin.prototype.merc2XyAsync_returnLayer = function(merc) {
        var self = this;
        return new Promise(function(resolve, reject) {
            resolve(ol.proj.transformDirect(merc, 'EPSG:3857', 'Illst:' + self.mapID));
        }).catch(function(err) {
            throw err;
        });
    };

    ol.source.HistMap_tin.prototype.xy2MercAsync_ = function(xy, layer_id) {
        var self = this;
        return new Promise(function(resolve, reject) {
            resolve(ol.proj.transformDirect(xy, 'Illst:' + self.mapID, 'EPSG:3857'));
        }).catch(function(err) {
            throw err;
        });
    };
    ol.source.HistMap_tin.prototype.merc2XyAsync_ = function(merc, layer_id) {
        var self = this;
        return new Promise(function(resolve, reject) {
            resolve(ol.proj.transformDirect(merc, 'EPSG:3857', 'Illst:' + self.mapID));
        }).catch(function(err) {
            throw err;
        });
    };

    return ol;
});
