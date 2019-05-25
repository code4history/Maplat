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
                            return tin.transform(xy, false, true);
                        }, function(merc) {
                            return tin.transform(merc, true, true);
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
                            var xyBoundsPolygon = turf.helpers.polygon([xyBounds]);
                            var mercBoundsPolygon = turf.helpers.polygon([mercBounds]);
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
                return a[0].priority < b[0].priority ? 1 : -1;
            }).reduce(function(ret, result, priIndex, arry) {
                var tin = result[0];
                var index = result[1];
                var xy = result[2];
                if (!xy) return ret;
                for (var i=0; i<priIndex; i++) {
                    var targetTin = arry[i][0];
                    var targetIndex = arry[i][1];
                    if (targetIndex == 0 || turf.booleanPointInPolygon(xy, targetTin.xyBounds)) {
                        if (ret.length) {
                            var hide = !ret[0];
                            var storedTin = hide ? ret[1][2] : ret[0][2];
                            if (!hide || tin.importance < storedTin.importance) {
                                return ret;
                            } else {
                                return [, [index, xy, tin]];
                            }
                        } else {
                            return [, [index, xy, tin]];
                        }
                    }
                }
                if (!ret.length || !ret[0]) {
                    return [[index, xy, tin]];
                } else {
                    ret.push([index, xy, tin]);
                    return ret.sort(function(a, b) {
                        return a[2].importance < b[2].importance ? 1 : -1;
                    }).filter(function(row, i) {
                        return i < 2 ? true : false;
                    });
                }
            }, []).map(function(row) {
                if (!row) return;
                return [row[0], row[1]];
            });
        }).catch(function(err) {
            throw err;
        });
    };

    ol.source.HistMap_tin.prototype.mapSize2MercSize = function(callback) {
        var xy = [this.width / 2, this.height / 2];
        var self = this;
        self.xy2MercAsync_returnLayer(xy).then(function(results) {
            var index = results[0];
            var mercCenter = results[1];
            var dir4 = [[xy[0] - 150, xy[1]], [xy[0] + 150, xy[1]], [xy[0], xy[1] - 150], [xy[0], xy[1] + 150]];
            var envelope = [[0, 0], [self.width, 0], [self.width, self.height], [0, self.height]];
            var proms = [];
            for (var i=0; i<9; i++) {
                var prom = i < 4 ? self.xy2MercAsync_specifyLayer(dir4[i], index) :
                    i == 4 ? Promise.resolve(mercCenter) :
                        self.xy2MercAsync_specifyLayer(envelope[i-5], 0);
                proms.push(prom);
            }
            Promise.all(proms).then(function(mercs) {
                var delta1 = Math.sqrt(Math.pow(mercs[0][0] - mercs[1][0], 2) + Math.pow(mercs[0][1] - mercs[1][1], 2));
                var delta2 = Math.sqrt(Math.pow(mercs[2][0] - mercs[3][0], 2) + Math.pow(mercs[2][1] - mercs[3][1], 2));
                var delta = (delta1 + delta2) / 2;
                self.merc_zoom = Math.log(300 * (2*ol.const.MERC_MAX) / 256 / delta) / Math.log(2) - 3;
                self.home_position = ol.proj.toLonLat(mercs[4]);
                self.envelope = turf.helpers.polygon([[mercs[5], mercs[6], mercs[7], mercs[8], mercs[5]]]);
                callback(self);
            }).catch(function(err) {
                throw err;
            });
        }).catch(function(err) {
            throw err;
        });
    };

    // 画面サイズと地図ズームから、メルカトル座標上での5座標を取得する。zoom, rotate無指定の場合は自動取得
    ol.source.HistMap_tin.prototype.size2MercsAsync = function(center, zoom, rotate) {
        var self = this;
        var cross = this.size2Xys(center, zoom, rotate).map(function(xy, index) {
            if (index == 5) return xy;
            return self.histMapCoords2Xy(xy);
        });
        var promise = self.xy2MercAsync_returnLayer(cross[0]);
        return promise.then(function(results) {
            var index = results[0];
            var centerMerc = results[1];
            var promises = cross.map(function(val, i) {
                if (i == 5) return val;
                if (i == 0) return Promise.resolve(centerMerc);
                return self.xy2MercAsync_specifyLayer(val, index);
            });
            return Promise.all(promises).catch(function(err) { throw err; });
        }).catch(function(err) { throw err; });
    };

    // メルカトル5地点情報から地図サイズ情報（中心座標、サイズ、回転）を得る
    ol.source.HistMap_tin.prototype.mercs2SizeAsync = function(mercs, asMerc) {
        var self = this;
        var promises
        if (asMerc) {
            promises = Promise.resolve(mercs);
        } else {
            promises = self.merc2XyAsync_returnLayer(mercs[0]).then(function(results) {
                var result = results[0] || results[1];
                var index = result[0];
                var centerXy = result[1];
                return Promise.all(mercs.map(function(merc, i) {
                    if (i == 5) return merc;
                    if (i == 0) return Promise.resolve(centerXy);
                    return self.merc2XyAsync_specifyLayer(merc, index);
                }));
            });
        }
        return promises.then(function(xys) {
            if (!asMerc) {
                xys = xys.map(function(xy, i) {
                    if (i == 5) return xy;
                    return self.xy2HistMapCoords(xy);
                });
            }
            return self.xys2Size(xys);
        }).catch(function(err) { throw err; });
    };

    ol.source.HistMap_tin.prototype.mercs2XysAsync = function(mercs) {
        var self = this;
        promises = self.merc2XyAsync_returnLayer(mercs[0]).then(function(results) {
            var hide = false;
            return Promise.all(results.map(function(result, i) {
                if (!result) {
                    hide = true;
                    return;
                }
                var index = result[0];
                var centerXy = result[1];
                if (i != 0 && !hide) return Promise.resolve([centerXy]);
                return Promise.all(mercs.map(function(merc, j) {
                    if (j == 5) return merc;
                    if (j == 0) return Promise.resolve(centerXy);
                    return self.merc2XyAsync_specifyLayer(merc, index);
                }));
            }));
        });
        return promises.then(function(results) {
            return results.map(function(result) {
                if (!result) {
                    return;
                }
                return result.map(function(xy, i) {
                    if (i == 5) return xy;
                    return self.xy2HistMapCoords(xy);
                });
            });
        }).catch(function(err) { throw err; });
    };

    ol.source.HistMap.prototype.xy2MercAsync = function(xy) {
        var convertXy = this.histMapCoords2Xy(xy);
        return this.xy2MercAsync_returnLayer(convertXy).then(function(ret) {
            return ret[1];
        });
    };
    ol.source.HistMap.prototype.merc2XyAsync = function(merc) {
        var self = this;
        return this.merc2XyAsync_returnLayer(merc).then(function(ret){
            var convertXy = !ret[0] ? ret[1][1] : ret[0][1];
            return self.xy2HistMapCoords(convertXy);
        }).catch(function(err) { throw err; });
    };

    return ol;
});
