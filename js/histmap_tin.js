define(['histmap', 'tin', 'turf'], function(ol, Tin, turf) {
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
                        var prom;
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
                            prom = Promise.resolve();
                        } else {
                            tin.setPoints(sub_map.gcps);
                            prom = tin.updateTinAsync();
                        }
                        return prom.then(function() {
                            var xyBounds = Object.assign([], sub_map.bounds);
                            xyBounds.push(sub_map.bounds[0]);
                            var mercBounds = xyBounds.map(function(xy) {
                                return tin.transform(xy, false);
                            });
                            var xyBoundsPolygon = turf.helpers.polygon(xyBounds);
                            var mercBoundsPolygon = turf.helpers.polygon(mercBounds);
                            tin.xyBounds = xyBoundsPolygon;
                            tin.mercBounds = mercBoundsPolygon;
                        });
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
        return new Promise(function(resolve, reject) {
            var tinSorted = self.tins.map(function(tin, index) {
                return [index, tin];
            }).sort(function(a, b) {
                return a[1].priority < b[1].priority ? 1 : -1;
            });

            for (var i = 0; i < tinSorted.length; i++) {
                var index = tinSorted[i][0];
                var tin = tinSorted[i][1];
                if (index == 0 || turf.booleanPointInPolygon(xy, tin.xyBounds)) {
                    self.xy2MercAsync_specifyLayer(xy, index).then(function(merc) {
                        resolve([index, merc]);
                    }).catch(function(err) {
                        reject(err);
                    });
                    break;
                }
            }
        }).catch(function(err) {
            throw err;
        });
    };
    ol.source.HistMap_tin.prototype.merc2XyAsync_returnLayer = function(merc) {
        var self = this;
        return Promise.all(self.tins.map(function(tin, index) {
            return new Promise(function(resolve, reject) {
                self.merc2XyAsync_specifyLayer(merc, index).then(function(xy) {
                    if (index == 0 || turf.booleanPointInPolygon(xy, tin.xyBounds)) {
                        resolve([tin, index, xy]);
                    } else {
                        resolve([tin, index]);
                    }
                }).catch(function(err) {
                    reject(err);
                });
            });
        })).then(function(results) {
            return results.sort(function(a, b) {
                return a[0].importance < b[0].importance ? 1 : -1;
            }).reduce(function(ret, result, impIndex, arry) {
                var tin = result[0];
                var index = result[1];
                var xy = result[2];
                if (!xy) return false;
                var type;
                for (var i=0; i<impIndex; i++) {
                    if (i == impIndex) continue;
                    var targetTin = arry[i][0];
                    var targetIndex = arry[i][1];
                    if (targetTin.priority < tin.priority) continue;
                    if (targetIndex == 0 || turf.booleanPointInPolygon(xy, targetTin.xyBounds)) {
                        if (i < impIndex) {
                            return false;
                        } else {
                            type = 'hide';
                            break;
                        }
                    }
                }
                if (!type) {
                    type = ret.length == 0 ? 'main' : 'sub';
                }
                ret.push([index, xy, type]);
                return ret;
            }, []);
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
