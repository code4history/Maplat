(function(loader) {
    loader(function _commonDefine(turf, mapshaper) {
        constrainedTinInit(turf);
        if (!turf.point) {
            var helpers = Object.keys(turf.helpers);
            helpers.map(function(key) {
                turf[key] = turf.helpers[key];
            });
            var invariant = Object.keys(turf.invariant);
            invariant.map(function(key) {
                turf[key] = turf.invariant[key];
            });
        }
        var internal = mapshaper.internal;
        var Tin = function(options) {
            options = options || {};
            if (options.bounds) {
                this.setBounds(options.bounds);
            } else {
                this.setWh(options.wh);
                this.vertexMode = options.vertexMode || Tin.VERTEX_PLAIN;
            }
            this.strictMode = options.strictMode || Tin.MODE_AUTO;
            this.yaxisMode = options.yaxisMode || Tin.YAXIS_INVERT;
            this.importance = options.importance || 0;
            this.priority = options.priority || 0;
            if (options.points) {
                this.setPoints(options.points);
            }
            if (options.edges) {
                this.setEdges(options.edges);
            }
        };
        Tin.VERTEX_PLAIN = 'plain';
        Tin.VERTEX_BIRDEYE = 'birdeye';
        Tin.MODE_STRICT = 'strict';
        Tin.MODE_AUTO = 'auto';
        Tin.MODE_LOOSE = 'loose';
        Tin.STATUS_STRICT = 'strict';
        Tin.STATUS_ERROR = 'strict_error';
        Tin.STATUS_LOOSE = 'loose';
        Tin.YAXIS_FOLLOW = 'follow';
        Tin.YAXIS_INVERT = 'invert';

        Tin.setTurf = function(turf_) {
            turf = turf_;
        };

        Tin.prototype.setPoints = function(points) {
            if (this.yaxisMode == Tin.YAXIS_FOLLOW) {
                points = points.map(function(point) {
                    return [point[0], [point[1][0], -1 * point[1][1]]];
                });
            }
            this.points = points;
            this.tins = undefined;
        };

        Tin.prototype.setEdges = function(edges) {
            if (!edges) edges = [];
            this.edges = edges;
            this.edgeNodes = undefined;
            this.tins = undefined;
        };

        Tin.prototype.setBounds = function(bounds) {
            this.bounds = bounds;
            var minx, miny, maxx, maxy, coords;
            for (var i=0; i<bounds.length; i++) {
                var xy = bounds[i];
                if (i==0) {
                    minx = maxx = xy[0];
                    miny = maxy = xy[1];
                    coords = [xy];
                } else {
                    if (xy[0] < minx) minx = xy[0];
                    if (xy[0] > maxx) maxx = xy[0];
                    if (xy[1] < miny) miny = xy[1];
                    if (xy[1] > maxy) maxy = xy[1];
                    coords.push(xy);
                }
            }
            coords.push(bounds[0]);
            this.boundsPolygon = turf.polygon([coords]);
            this.xy = [minx, miny];
            this.wh = [maxx - minx, maxy - miny];
            this.vertexMode = Tin.VERTEX_PLAIN;
            this.tins = undefined;
        };

        Tin.prototype.setCompiled = function(compiled) {
            if (!compiled.tins && compiled.points && compiled.tins_points) {
                // 新コンパイルロジック
                // pointsはそのままpoints, weightBufferも
                this.points = compiled.points;
                this.pointsWeightBuffer = compiled.weight_buffer;
                // kinksやtinsの存在状況でstrict_statusを判定
                if (compiled.strict_status) {
                    this.strict_status = compiled.strict_status;
                } else if (compiled.kinks_points) {
                    this.strict_status = Tin.STATUS_ERROR;
                } else if (compiled.tins_points.length == 2) {
                    this.strict_status = Tin.STATUS_LOOSE;
                } else {
                    this.strict_status = Tin.STATUS_STRICT;
                }
                // vertices_paramsを復元
                this.vertices_params = {
                    'forw' : [ compiled.vertices_params[0] ],
                    'bakw' : [ compiled.vertices_params[1] ]
                };
                this.vertices_params.forw[1] = [0, 1, 2, 3].map(function(idx) {
                    var idxNxt = (idx + 1) % 4;
                    var tri = indexesToTri(['cent', 'bbox' + idx, 'bbox' + idxNxt], compiled.points,
                        compiled.edgeNodes || [], compiled.centroid_point, compiled.vertices_points, false);
                    return turf.featureCollection([tri]);
                });
                this.vertices_params.bakw[1] = [0, 1, 2, 3].map(function(idx) {
                    var idxNxt = (idx + 1) % 4;
                    var tri = indexesToTri(['cent', 'bbox' + idx, 'bbox' + idxNxt], compiled.points,
                        compiled.edgeNodes || [], compiled.centroid_point, compiled.vertices_points, true);
                    return turf.featureCollection([tri]);
                });
                // centroidを復元
                this.centroid = {
                    'forw': turf.point(compiled.centroid_point[0], {'target': {'geom': compiled.centroid_point[1], 'index': 'cent'}}),
                    'bakw': turf.point(compiled.centroid_point[1], {'target': {'geom': compiled.centroid_point[0], 'index': 'cent'}})
                };
                // edgesを復元
                this.edges = compiled.edges || [];
                this.edgeNodes = compiled.edgeNodes || [];
                // tinsを復元
                var bakwI = compiled.tins_points.length == 1 ? 0 : 1;
                this.tins = {
                    'forw': turf.featureCollection(compiled.tins_points[0].map(function(idxes) {
                        return indexesToTri(idxes, compiled.points, compiled.edgeNodes || [], compiled.centroid_point, compiled.vertices_points, false);
                    })),
                    'bakw': turf.featureCollection(compiled.tins_points[bakwI].map(function(idxes) {
                        return indexesToTri(idxes, compiled.points, compiled.edgeNodes || [], compiled.centroid_point, compiled.vertices_points, true);
                    }))
                }
                // kinksを復元
                if (compiled.kinks_points) {
                    this.kinks = {
                        'bakw': turf.featureCollection(compiled.kinks_points.map(function(coord) {
                            return turf.point(coord)
                        }))
                    };
                }
                // yaxisModeを復元
                if (compiled.yaxisMode) {
                    this.yaxisMode = compiled.yaxisMode;
                } else {
                    this.yaxisMode = Tin.YAXIS_INVERT;
                }
                // boundsを復元
                if (compiled.bounds) {
                    this.bounds = compiled.bounds;
                    this.boundsPolygon = compiled.boundsPolygon;
                    this.xy = compiled.xy;
                    this.wh = compiled.wh;
                } else {
                    this.xy = [0, 0];
                    if (compiled.xy) this.wh = compiled.wh;
                    this.bounds = undefined;
                    this.boundsPolygon = undefined;
                }
            } else {
                // 旧コンパイルロジック
                this.tins = compiled.tins;
                this.strict_status = compiled.strict_status;
                this.pointsWeightBuffer = compiled.weight_buffer;
                this.vertices_params = compiled.vertices_params;
                this.centroid = compiled.centroid;
                this.kinks = compiled.kinks;
                var points = [];
                for (var i = 0; i < this.tins.forw.features.length; i++) {
                    var tri = this.tins.forw.features[i];
                    ['a', 'b', 'c'].map(function(key, idx) {
                        var forw = tri.geometry.coordinates[0][idx];
                        var bakw = tri.properties[key].geom;
                        var pIdx = tri.properties[key].index;
                        points[pIdx] = [forw, bakw];
                    });
                }
                this.points = points;
            }

            // 翻訳したオブジェクトを返す
            return {
                'tins' : this.tins,
                'strict_status' : this.strict_status,
                'weight_buffer' : this.pointsWeightBuffer,
                'vertices_params' : this.vertices_params,
                'centroid' : this.centroid,
                'kinks' : this.kinks
            };
        };

        Tin.prototype.getCompiled = function() {
            var compiled = {};
            /* old logic
            compiled.tins = this.tins;
            compiled.strict_status = this.strict_status;
            compiled.weight_buffer = this.pointsWeightBuffer;
            compiled.vertices_params = this.vertices_params;
            compiled.centroid = this.centroid;
            compiled.kinks = this.kinks;*/

            // 新compileロジック
            // points, weightBufferはそのまま保存
            compiled.points = this.points;
            compiled.weight_buffer = this.pointsWeightBuffer;
            // centroidは座標の対応のみ保存
            compiled.centroid_point = [this.centroid.forw.geometry.coordinates,
                this.centroid.forw.properties.target.geom];
            // vertices_paramsの最初の値はそのまま保存
            compiled.vertices_params = [this.vertices_params.forw[0], this.vertices_params.bakw[0]];
            // vertices_paramsの2番目の値（セントロイドと地図頂点の三角形ポリゴン）は、地図頂点座標のみ記録
            compiled.vertices_points = [];
            var vertices = this.vertices_params.forw[1];
            [0, 1, 2, 3].map(function(i) {
                var vertex_data = vertices[i].features[0];
                var forw = vertex_data.geometry.coordinates[0][1];
                var bakw = vertex_data.properties.b.geom;
                compiled.vertices_points[i] = [forw, bakw];
            });
            compiled.strict_status = this.strict_status;
            // tinは座標インデックスのみ記録
            compiled.tins_points = [[]];
            this.tins.forw.features.map(function(tin) {
                compiled.tins_points[0].push(['a', 'b', 'c'].map(function(idx) {
                    return tin.properties[idx].index;
                }));
            });
            // 自動モードでエラーがある時（loose）は、逆方向のtinも記録。
            // 厳格モードでエラーがある時（strict_error）は、エラー点情報(kinks)を記録。
            if (this.strict_status == Tin.STATUS_LOOSE) {
                compiled.tins_points[1] = [];
                this.tins.bakw.features.map(function(tin) {
                    compiled.tins_points[1].push(['a', 'b', 'c'].map(function(idx) {
                        return tin.properties[idx].index;
                    }));
                });
            } else if (this.strict_status == Tin.STATUS_ERROR) {
                compiled.kinks_points = this.kinks.bakw.features.map(function(kink) {
                    return kink.geometry.coordinates;
                });
            }

            // yaxisMode対応
            if (this.yaxisMode == Tin.YAXIS_FOLLOW) {
                compiled.yaxisMode = Tin.YAXIS_FOLLOW;
            }
            // bounds対応
            if (this.bounds) {
                compiled.bounds = this.bounds;
                compiled.boundsPolygon = this.boundsPolygon;
                compiled.xy = this.xy;
                compiled.wh = this.wh;
            } else {
                compiled.wh = this.wh;
            }
            // edge対応
            compiled.edges = this.edges;
            compiled.edgeNodes = this.edgeNodes;
            return compiled;
        };

        Tin.prototype.setWh = function(wh) {
            this.wh = wh;
            this.xy = [0, 0];
            this.bounds = undefined;
            this.boundsPolygon = undefined;
            this.tins = undefined;
        };

        Tin.prototype.setVertexMode = function(mode) {
            this.vertexMode = mode;
            this.tins = undefined;
        };

        Tin.prototype.setStrictMode = function(mode) {
            this.strictMode = mode;
            this.tins = undefined;
        };

        Tin.prototype.calcurateStrictTinAsync = function() {
            var self = this;
            var edges = self.pointsSet.edges;
            return Promise.all(self.tins.forw.features.map(function(tri) {
                return Promise.resolve(counterTri(tri));
            })).then(function(tris) {
                self.tins.bakw = turf.featureCollection(tris);
            }).then(function() {
                var searchIndex = {};
                return Promise.all(self.tins.forw.features.map(function(forTri, index) {
                    var bakTri = self.tins.bakw.features[index];
                    return Promise.resolve(insertSearchIndex(searchIndex, {forw: forTri, bakw: bakTri}));
                })).then(function() {
                    return searchIndex;
                }).catch(function(err) {
                    throw err;
                });
            }).then(function(searchIndex) {
                return [overlapCheckAsync(searchIndex), searchIndex];
            }).then(function(prevResult) {
                var overlapped = prevResult[0];
                var searchIndex = prevResult[1];
                if (overlapped.bakw) Object.keys(overlapped.bakw).map(function(key) {
                    if (overlapped.bakw[key] == 'Not include case') return;
                    var trises = searchIndex[key];
                    var forUnion = turf.union(trises[0].forw, trises[1].forw);
                    var forConvex = turf.convex(turf.featureCollection([trises[0].forw, trises[1].forw]));
                    var forDiff = turf.difference(forConvex, forUnion);
                    if (forDiff) return;
                    var splittedKey = key.split('-');
                    if (splittedKey[0].match(/^[0-9]+$/) && splittedKey[1].match(/^[0-9]+$/)) {
                        var numberKey = splittedKey.map(function(key) { return parseInt(key) })
                            .sort(function(a, b) { return a < b ? -1 : 1 });
                        for (var i = 0; i < edges.length - 1; i++) {
                            if (numberKey[0] == edges[i][0] && numberKey[1] == edges[i][1]) return;
                        }
                    }
                    var sharedVtx = splittedKey.map(function(val) {
                        return ['a', 'b', 'c'].map(function(alpha, index) {
                            var prop = trises[0].bakw.properties[alpha];
                            var geom = trises[0].bakw.geometry.coordinates[0][index];
                            return {geom: geom, prop: prop};
                        }).filter(function(vtx) {
                            return vtx.prop.index == val;
                        })[0];
                    });
                    var nonSharedVtx = trises.map(function(tris) {
                        return ['a', 'b', 'c'].map(function(alpha, index) {
                            var prop = tris.bakw.properties[alpha];
                            var geom = tris.bakw.geometry.coordinates[0][index];
                            return {geom: geom, prop: prop};
                        }).filter(function(vtx) {
                            return vtx.prop.index != sharedVtx[0].prop.index &&
                                vtx.prop.index != sharedVtx[1].prop.index;
                        })[0];
                    });
                    removeSearchIndex(searchIndex, trises[0], self.tins);
                    removeSearchIndex(searchIndex, trises[1], self.tins);
                    sharedVtx.map(function(sVtx) {
                        var newTriCoords = [sVtx.geom, nonSharedVtx[0].geom, nonSharedVtx[1].geom, sVtx.geom];
                        var newTriProp = {a: sVtx.prop, b: nonSharedVtx[0].prop, c: nonSharedVtx[1].prop};
                        var newBakTri = turf.polygon([newTriCoords], newTriProp);
                        var newForTri = counterTri(newBakTri);
                        insertSearchIndex(searchIndex, {forw: newForTri, bakw: newBakTri}, self.tins);
                    });
                });

                return Promise.all(['forw', 'bakw'].map(function(direc) {
                    return new Promise(function(resolve) {
                        var coords = self.tins[direc].features.map(function(poly) { return poly.geometry.coordinates[0]; });
                        var xy = findIntersections(coords);
                        var retXy = internal.dedupIntersections(xy).reduce(function(prev, point, index, array) {
                            if (!prev) prev = {};
                            prev[point.x + ':' + point.y] = point;
                            if (index != array.length - 1) return prev;
                            return Object.keys(prev).map(function(key) {
                                return turf.point([prev[key].x, prev[key].y]);
                            });
                        }, []);
                        resolve(retXy);
                    }).catch(function(err) {
                        throw err;
                    });
                })).then(function(result) {
                    if (result[0].length == 0 && result[1].length == 0) {
                        self.strict_status = Tin.STATUS_STRICT;
                        delete self.kinks;
                    } else {
                        self.strict_status = Tin.STATUS_ERROR;
                        self.kinks = {};
                        if (result[0].length > 0) self.kinks.forw = turf.featureCollection(result[0]);
                        if (result[1].length > 0) self.kinks.bakw = turf.featureCollection(result[1]);
                    }
                }).catch(function(err) {
                    throw err;
                });
            }).catch(function(err) {
                throw err;
            });
        };

        Tin.prototype.generatePointsSet = function() {
            var self = this;
            var pointsArray = {forw: [], bakw: []};
            for (var i=0; i < self.points.length; i++) {
                var mapxy = self.points[i][0];
                var mercs = self.points[i][1];
                var forPoint = createPoint(mapxy, mercs, i);
                pointsArray.forw.push(forPoint);
                pointsArray.bakw.push(counterPoint(forPoint));
            }
            var edges = [];
            var edgeNodeIndex = 0;
            self.edgeNodes = [];
            for (var i=0; i < self.edges.length; i++) {
                var startEnd = self.edges[i].startEnd;
                var illstNodes = Object.assign([], self.edges[i].illstNodes);
                var mercNodes = Object.assign([], self.edges[i].mercNodes);
                if (illstNodes.length === 0 && mercNodes.length === 0) {
                    edges.push(startEnd);
                    continue;
                }
                illstNodes.unshift(self.points[startEnd[0]][0]);
                illstNodes.push(self.points[startEnd[1]][0]);
                mercNodes.unshift(self.points[startEnd[0]][1]);
                mercNodes.push(self.points[startEnd[1]][1]);
                var lengths = [illstNodes, mercNodes].map(function(nodes, i) {
                    var eachLengths = nodes.map(function(node, index, arr) {
                        if (index === 0) return 0;
                        var prev = arr[index - 1];
                        return Math.sqrt(Math.pow(node[0] - prev[0], 2) + Math.pow(node[1] - prev[1], 2));
                    });
                    var sumLengths = eachLengths.reduce(function(prev, node, index) {
                        if (index === 0) return [0];
                        prev.push(prev[index - 1] + node);
                        return prev;
                    }, []);
                    return sumLengths.map(function(eachSum, index, arr) {
                        var ratio = eachSum / arr[arr.length -1];
                        return [nodes[index], eachLengths[index], sumLengths[index], ratio];
                    });
                });
                lengths.map(function(thisLengths, i) {
                    var anotherLengths = lengths[i ? 0 : 1];
                    return thisLengths.filter(function(val, index) {
                        return index === 0 || index === thisLengths.length - 1 || val[4] === 'handled' ? false : true;
                    }).map(function(lengthItem) {
                        var node = lengthItem[0];
                        var ratio = lengthItem[3];
                        var anotherSets = anotherLengths.reduce(function(prev, item, index, arr) {
                            if (prev) return prev;
                            var next = arr[index + 1];
                            if (item[3] === ratio) {
                                item[4] = 'handled';
                                return [item];
                            }
                            if (item[3] < ratio && next[3] > ratio) return [item, next];
                            return;
                        }, undefined);
                        if (anotherSets.length === 1) {
                            return i === 0 ? [node, anotherSets[0][0], ratio] : [anotherSets[0][0], node, ratio];
                        } else {
                            var anotherPrev = anotherSets[0];
                            var anotherNext = anotherSets[1];
                            var ratioDelta = ratio - anotherPrev[3];
                            var ratioAnother = anotherNext[3] - anotherPrev[3];
                            var ratioInEdge = ratioDelta / ratioAnother;
                            var anotherNode = [(anotherNext[0][0] - anotherPrev[0][0]) * ratioInEdge + anotherPrev[0][0],
                                (anotherNext[0][1] - anotherPrev[0][1]) * ratioInEdge + anotherPrev[0][1]];
                            return i === 0 ? [node, anotherNode, ratio] : [anotherNode, node, ratio];
                        }
                    });
                }).reduce(function(prev, nodes) {
                    return prev.concat(nodes);
                }, []).sort(function(a, b) {
                    return a[2] < b[2] ? -1 : 1;
                }).map(function(node, index, arr) {
                    self.edgeNodes[edgeNodeIndex] = [node[0], node[1]];
                    var forPoint = createPoint(node[0], node[1], 'edgeNode' + edgeNodeIndex);
                    edgeNodeIndex++;
                    pointsArray.forw.push(forPoint);
                    pointsArray.bakw.push(counterPoint(forPoint));
                    if (index === 0) {
                        edges.push([startEnd[0], pointsArray.forw.length - 1]);
                    } else {
                        edges.push([pointsArray.forw.length - 2, pointsArray.forw.length - 1]);
                    }
                    if (index === arr.length - 1) {
                        edges.push([pointsArray.forw.length - 1, startEnd[1]]);
                    }
                });
            }
            return {forw: turf.featureCollection(pointsArray.forw), bakw: turf.featureCollection(pointsArray.bakw), edges: edges};
        };

        Tin.prototype.updateTinAsync = function() {
            var self = this;
            var strict = this.strictMode;
            var minx = self.xy[0] - 0.05 * self.wh[0];
            var maxx = self.xy[0] + 1.05 * self.wh[0];
            var miny = self.xy[1] - 0.05 * self.wh[1];
            var maxy = self.xy[1] + 1.05 * self.wh[1];

            var insideCheck = this.bounds ? function(xy) {
                return turf.booleanPointInPolygon(xy, self.boundsPolygon);
            } : function(xy) {
                return xy[0] >= self.xy[0] && xy[0] <= self.xy[0] + self.wh[0] && xy[1] >= self.xy[1] && xy[1] <= self.xy[1] + self.wh[1];
            };
            var inside = this.points.reduce(function(prev, curr) {
                return prev && insideCheck(curr[0]);
            }, true);
            if (!inside) {
                return new Promise(function(resolve, reject) {
                    reject('SOME POINTS OUTSIDE');
                });
            }

            return new Promise(function(resolve, reject) {
                if (strict != Tin.MODE_STRICT && strict != Tin.MODE_LOOSE) strict = Tin.MODE_AUTO;

                var bbox = [];
                if (self.wh) {
                    bbox = [
                        [minx, miny], [maxx, miny],
                        [minx, maxy], [maxx, maxy]
                    ];
                }
                var pointsSet = self.generatePointsSet();
                resolve([pointsSet, bbox]);
            }).then(function(prevResults) {
                var pointsSet = prevResults[0];

                // Forward TIN for calcurating Backward Centroid and Backward Vertices
                return Promise.all([
                    new Promise(function(resolve) {
                        resolve(turf.constrainedTin(pointsSet.forw, pointsSet.edges, 'target'));
                    }),
                    new Promise(function(resolve) {
                        resolve(turf.constrainedTin(pointsSet.bakw, pointsSet.edges, 'target'));
                    }),
                    new Promise(function(resolve) {
                        resolve(turf.centroid(pointsSet.forw));
                    }),
                    Promise.resolve(prevResults)
                ]).catch(function(err) {
                    throw err;
                });
            }).then(function(prevResults) {
                var tinForCentroid = prevResults[0];
                var tinBakCentroid = prevResults[1];
                var forCentroidFt = prevResults[2];
                var pointsSetBbox = prevResults[3];
                var pointsSet = pointsSetBbox[0];
                if (tinForCentroid.features.length == 0 || tinBakCentroid.features.length == 0) throw 'TOO LINEAR1';

                // Calcurating Forward/Backward Centroid
                var centroid = {forw: forCentroidFt.geometry.coordinates};
                centroid.bakw = transformArr(forCentroidFt, tinForCentroid);
                self.centroid = {forw: createPoint(centroid.forw, centroid.bakw, 'cent')};
                self.centroid.bakw = counterPoint(self.centroid.forw);

                var convexBuf = {};
                return Promise.all([
                    new Promise(function(resolve) {
                        var forConvex = turf.convex(pointsSet.forw).geometry.coordinates[0];
                        var convex;
                        try {
                            convex = forConvex.map(function(forw) {return {forw: forw,
                                bakw: transformArr(turf.point(forw), tinForCentroid)}; });
                        } catch(e) {
                            throw 'TOO LINEAR2';
                        }
                        convex.map(function(vertex) { convexBuf[vertex.forw[0] + ':' + vertex.forw[1]] = vertex; });
                        resolve();
                    }),
                    new Promise(function(resolve) {
                        var bakConvex = turf.convex(pointsSet.bakw).geometry.coordinates[0];
                        var convex;
                        try {
                            convex = bakConvex.map(function(bakw) {return {bakw: bakw,
                                forw: transformArr(turf.point(bakw), tinBakCentroid)}; });
                        } catch(e) {
                            throw 'TOO LINEAR2';
                        }
                        convex.map(function(vertex) { convexBuf[vertex.forw[0] + ':' + vertex.forw[1]] = vertex; });
                        resolve();
                    })
                ]).then(function() {
                    return [centroid, convexBuf, pointsSetBbox];
                }).catch(function(err) {
                    throw err;
                });
            }).then(function(prevResults) {
                var centroid = prevResults[0];
                var convexBuf = prevResults[1];
                var pointsSetBbox = prevResults[2];

                // Calcurating Convex full to get Convex full polygon's vertices
                var expandConvex = Object.keys(convexBuf).reduce(function(prev, key, index, array) {
                    var forVertex = convexBuf[key].forw;
                    var bakVertex = convexBuf[key].bakw;
                    // Convexhullの各頂点に対し、重心からの差分を取る
                    var vertexDelta = {forw: [forVertex[0] - centroid.forw[0], forVertex[1] - centroid.forw[1]]};
                    vertexDelta.bakw = [bakVertex[0] - centroid.bakw[0], bakVertex[1] - centroid.bakw[1]];
                    // X軸方向、Y軸方向それぞれに対し、地図外郭XY座標との重心との比を取る
                    var xRate = vertexDelta.forw[0] == 0 ? Infinity :
                        ((vertexDelta.forw[0] < 0 ? minx : maxx) - centroid.forw[0]) / vertexDelta.forw[0];
                    var yRate = vertexDelta.forw[1] == 0 ? Infinity :
                        ((vertexDelta.forw[1] < 0 ? miny : maxy) - centroid.forw[1]) / vertexDelta.forw[1];
                    // xRate, yRateが同じ値であれば重心と地図頂点を結ぶ線上に乗る
                    if (Math.abs(xRate) / Math.abs(yRate) < 1.1 ) {
                        var point = {forw: [vertexDelta.forw[0] * xRate + centroid.forw[0], vertexDelta.forw[1] * xRate + centroid.forw[1]],
                            bakw: [vertexDelta.bakw[0] * xRate + centroid.bakw[0], vertexDelta.bakw[1] * xRate + centroid.bakw[1]]};
                        if (vertexDelta.forw[0] < 0) prev[3].push(point);
                        else prev[1].push(point);
                    }
                    if (Math.abs(yRate) / Math.abs(xRate) < 1.1 ) {
                        var point = {forw: [vertexDelta.forw[0] * yRate + centroid.forw[0], vertexDelta.forw[1] * yRate + centroid.forw[1]],
                            bakw: [vertexDelta.bakw[0] * yRate + centroid.bakw[0], vertexDelta.bakw[1] * yRate + centroid.bakw[1]]};
                        if (vertexDelta.forw[1] < 0) prev[0].push(point);
                        else prev[2].push(point);
                    }
                    return prev;
                }, [[], [], [], []]);

                // Calcurating Average scaling factors and rotation factors per orthants
                var orthant = Object.keys(convexBuf).reduce(function(prev, key, idx, array) {
                    var forVertex = convexBuf[key].forw;
                    var bakVertex = convexBuf[key].bakw;
                    var vertexDelta = {forw: [forVertex[0] - centroid.forw[0], forVertex[1] - centroid.forw[1]]};
                    vertexDelta.bakw = [bakVertex[0] - centroid.bakw[0], centroid.bakw[1] - bakVertex[1]];

                    if (vertexDelta.forw[0] == 0 || vertexDelta.forw[1] == 0) return prev;
                    var index = 0;
                    if (vertexDelta.forw[0] > 0) index += 1;
                    if (vertexDelta.forw[1] > 0) index += 2;
                    prev[index].push([vertexDelta.forw, vertexDelta.bakw]);
                    if (idx == array.length -1) {
                        // If some orthants have no Convex full polygon's vertices, use same average factor to every orthants
                        return (prev.length == prev.filter(function(val) {
                            return val.length > 0;
                        }).length && self.vertexMode == Tin.VERTEX_BIRDEYE) ? prev : prev.reduce(function(pre, cur) {
                                var ret = [pre[0].concat(cur)];
                                return ret;
                            }, [[]]);
                    }
                    return prev;
                }, [[], [], [], []]).map(function(item) {
                    // Finalize calcuration of Average scaling factors and rotation factors
                    return item.reduce(function(prev, curr, index, arr) {
                        if (!prev) prev = [Infinity, 0, 0];
                        // if (!prev) prev = [0, 0, 0];
                        // var distanceSum = prev[0] + Math.sqrt(Math.pow(curr[0][0], 2) + Math.pow(curr[0][1], 2)) /
                        //     Math.sqrt(Math.pow(curr[1][0], 2) + Math.pow(curr[1][1], 2));
                        var distanceSum = Math.sqrt(Math.pow(curr[0][0], 2) + Math.pow(curr[0][1], 2)) /
                            Math.sqrt(Math.pow(curr[1][0], 2) + Math.pow(curr[1][1], 2));
                        distanceSum = distanceSum < prev[0] ? distanceSum : prev[0];
                        var thetaDelta = Math.atan2(curr[0][0], curr[0][1]) - Math.atan2(curr[1][0], curr[1][1]);
                        var sumThetaX = prev[1] + Math.cos(thetaDelta);
                        var sumThetaY = prev[2] + Math.sin(thetaDelta);
                        if (index == arr.length - 1) {
                            // return [distanceSum / arr.length, Math.atan2(sumThetaY, sumThetaX)];
                            return [distanceSum, Math.atan2(sumThetaY, sumThetaX)];
                        }
                        return [distanceSum, sumThetaX, sumThetaY];
                    }, null);
                });

                // "Using same average factor to every orthants" case
                if (orthant.length == 1) orthant = [orthant[0], orthant[0], orthant[0], orthant[0]];

                return [orthant, centroid, expandConvex, pointsSetBbox];
            }).then(function(prevResults) {
                var orthant = prevResults[0];
                var centroid = prevResults[1];
                var expandConvex = prevResults[2];
                var pointsSet = prevResults[3][0];
                var bbox = prevResults[3][1];

                // Calcurating Backward Bounding box of map
                var verticesSet = orthant.map(function(delta, index) {
                    var forVertex = bbox[index];
                    var forDelta = [forVertex[0] - centroid.forw[0], forVertex[1] - centroid.forw[1]];
                    var forDistance = Math.sqrt(Math.pow(forDelta[0], 2) + Math.pow(forDelta[1], 2));
                    var bakDistance = forDistance / delta[0];

                    var forTheta = Math.atan2(forDelta[0], forDelta[1]);
                    var bakTheta = forTheta - delta[1];

                    var bakVertex = [centroid.bakw[0] + bakDistance * Math.sin(bakTheta),
                        centroid.bakw[1] - bakDistance * Math.cos(bakTheta)];

                    return {forw: forVertex, bakw: bakVertex};
                });
                var swap = verticesSet[2];
                verticesSet[2] = verticesSet[3];
                verticesSet[3] = swap;

                // Bounding Boxの頂点を、全てのgcpが内部に入るように引き延ばす
                var expandRate = [1, 1, 1, 1];
                for (var i = 0; i < 4; i++) {
                    var j = (i + 1) % 4;
                    var side = turf.lineString([verticesSet[i].bakw, verticesSet[j].bakw]);
                    var expands = expandConvex[i];
                    expands.map(function (expand) {
                        var expandLine = turf.lineString([centroid.bakw, expand.bakw]);
                        var intersect = turf.lineIntersect(side, expandLine);
                        if (intersect.features.length > 0 && intersect.features[0].geometry) {
                            var intersect = intersect.features[0];
                            var expandDist = Math.sqrt(Math.pow(expand.bakw[0] - centroid.bakw[0], 2) +
                                Math.pow(expand.bakw[1] - centroid.bakw[1], 2));
                            var onSideDist = Math.sqrt(Math.pow(intersect.geometry.coordinates[0] - centroid.bakw[0], 2) +
                                Math.pow(intersect.geometry.coordinates[1] - centroid.bakw[1], 2));
                            var rate = expandDist / onSideDist;
                            if (rate > expandRate[i]) expandRate[i] = rate;
                            if (rate > expandRate[j]) expandRate[j] = rate;
                        }
                    });
                }
                verticesSet = verticesSet.map(function(vertex, index) {
                    var rate = expandRate[index];
                    var point = [(vertex.bakw[0] - centroid.bakw[0]) * rate + centroid.bakw[0],
                        (vertex.bakw[1] - centroid.bakw[1]) * rate + centroid.bakw[1]];
                    return {forw: vertex.forw, bakw: point};
                });
                return [verticesSet, pointsSet];
            }).then(function(prevResults) {
                var verticesSet = prevResults[0];
                var pointsSet = prevResults[1];

                var verticesList = {forw: [], bakw: []};

                for (var i = 0; i < verticesSet.length; i++ ) {
                    var forVertex = verticesSet[i].forw;
                    var bakVertex = verticesSet[i].bakw;
                    var forVertexFt = createPoint(forVertex, bakVertex, 'bbox' + i);
                    var bakVertexFt = counterPoint(forVertexFt);
                    pointsSet.forw.features.push(forVertexFt);
                    pointsSet.bakw.features.push(bakVertexFt);
                    verticesList.forw.push(forVertexFt);
                    verticesList.bakw.push(bakVertexFt);
                }

                self.pointsSet = pointsSet;
                self.tins = {forw: rotateVerticesTriangle(turf.constrainedTin(pointsSet.forw, pointsSet.edges, 'target'))};
                var prom;
                if (strict == Tin.MODE_STRICT || strict == Tin.MODE_AUTO) {
                    prom = self.calcurateStrictTinAsync();
                } else {
                    prom = Promise.resolve();
                }
                return prom.then(function() {
                    if (strict == Tin.MODE_LOOSE || (strict == Tin.MODE_AUTO && self.strict_status == Tin.STATUS_ERROR)) {
                        self.tins.bakw = rotateVerticesTriangle(turf.constrainedTin(pointsSet.bakw, pointsSet.edges, 'target'));
                        delete self.kinks;
                        self.strict_status = Tin.STATUS_LOOSE;
                    }
                    self.vertices_params = {forw: vertexCalc(verticesList.forw, self.centroid.forw),
                        bakw: vertexCalc(verticesList.bakw, self.centroid.bakw)};

                    return self.calculatePointsWeightAsync();
                }).catch(function(err) {
                    throw err;
                });
            }).catch(function(err) {
                throw err;
            });
        };

        Tin.prototype.transform = function(point, backward, ignoreBounds) {
            if (backward && this.strict_status == Tin.STATUS_ERROR) throw 'Backward transform is not allowed if strict_status == "strict_error"';
            // if (!this.tins) this.updateTin();
            if (this.yaxisMode == Tin.YAXIS_FOLLOW && backward) {
                point = [point[0], -1 * point[1]];
            }
            var tpoint = turf.point(point);
            if (this.bounds && !backward && !ignoreBounds) {
                if (!turf.booleanPointInPolygon(tpoint, this.boundsPolygon)) return false;
            }
            var tins = backward ? this.tins.bakw : this.tins.forw;
            var verticesParams = backward ? this.vertices_params.bakw : this.vertices_params.forw;
            var centroid = backward ? this.centroid.bakw : this.centroid.forw;
            var weightBuffer = backward ? this.pointsWeightBuffer.bakw : this.pointsWeightBuffer.forw;
            var ret = transformArr(tpoint, tins, verticesParams, centroid, weightBuffer);
            if (this.bounds && backward && !ignoreBounds) {
                var rpoint = turf.point(ret);
                if (!turf.booleanPointInPolygon(rpoint, this.boundsPolygon)) return false;
            } else if (this.yaxisMode == Tin.YAXIS_FOLLOW && !backward) {
                ret = [ret[0], -1 * ret[1]];
            }
            return ret;
        };

        Tin.prototype.calculatePointsWeightAsync = function() {
            var self = this;
            var calcTargets = ['forw'];
            if (self.strict_status == Tin.STATUS_LOOSE) calcTargets.push('bakw');
            var weightBuffer = {};
            return Promise.all(calcTargets.map(function(target) {
                weightBuffer[target] = {};
                var alreadyChecked = {};
                var tin = self.tins[target];
                return Promise.all(tin.features.map(function(tri) {
                    var vtxes = ['a', 'b', 'c'];
                    return new Promise(function(resolve) {
                        for (var i = 0; i < 3; i++) {
                            var j = (i + 1) % 3;
                            var vi = vtxes[i];
                            var vj = vtxes[j];
                            var indexi = tri.properties[vi].index;
                            var indexj = tri.properties[vj].index;
                            var key = [indexi, indexj].sort().join('-');
                            if (!alreadyChecked[key]) {
                                var fromi = tri.geometry.coordinates[0][i];
                                var fromj = tri.geometry.coordinates[0][j];
                                var toi = tri.properties[vi].geom;
                                var toj = tri.properties[vj].geom;
                                alreadyChecked[key] = 1;

                                var weight = Math.sqrt(Math.pow(toi[0] - toj[0], 2) + Math.pow(toi[1] - toj[1], 2)) /
                                    Math.sqrt(Math.pow(fromi[0] - fromj[0], 2) + Math.pow(fromi[1] - fromj[1], 2));

                                if (!weightBuffer[target][indexi]) weightBuffer[target][indexi] = {};
                                if (!weightBuffer[target][indexj]) weightBuffer[target][indexj] = {};
                                weightBuffer[target][indexi][key] = weight;
                                weightBuffer[target][indexj][key] = weight;
                            }
                        }
                        resolve();
                    });
                })).catch(function(err) {
                    throw err;
                });
            })).then(function() {
                var pointsWeightBuffer = {};
                calcTargets.map(function(target) {
                    pointsWeightBuffer[target] = {};
                    if (self.strict_status == Tin.STATUS_STRICT) pointsWeightBuffer['bakw'] = {};
                    Object.keys(weightBuffer[target]).map(function(vtx) {
                        pointsWeightBuffer[target][vtx] = Object.keys(weightBuffer[target][vtx]).reduce(function(prev, key, idx, arr) {
                            prev = prev + weightBuffer[target][vtx][key];
                            return idx == arr.length - 1 ? prev / arr.length : prev;
                        }, 0);
                        if (self.strict_status == Tin.STATUS_STRICT) pointsWeightBuffer['bakw'][vtx] = 1 / pointsWeightBuffer[target][vtx];
                    });
                    pointsWeightBuffer[target]['cent'] = [0, 1, 2, 3].reduce(function(prev, curr) {
                        var key = 'bbox' + curr;
                        prev = prev + pointsWeightBuffer[target][key];
                        return curr == 3 ? prev / 4 : prev;
                    }, 0);
                    if (self.strict_status == Tin.STATUS_STRICT) pointsWeightBuffer['bakw']['cent'] = 1 / pointsWeightBuffer[target]['cent'];
                });
                self.pointsWeightBuffer = pointsWeightBuffer;
            }).catch(function(err) {
                throw err;
            });
        };

        function rotateVerticesTriangle(tins) {
            var features = tins.features;
            for (var i=0; i<features.length; i++) {
                var feature = features[i];
                if ((feature.properties.a.index + '').substring(0, 4) == 'bbox' &&
                    (feature.properties.b.index + '').substring(0, 4) == 'bbox') {
                    features[i] = {
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [feature.geometry.coordinates[0][2], feature.geometry.coordinates[0][0], feature.geometry.coordinates[0][1],
                                    feature.geometry.coordinates[0][2]]
                            ]
                        },
                        properties: {
                            a: {
                                geom: feature.properties.c.geom,
                                index: feature.properties.c.index
                            },
                            b: {
                                geom: feature.properties.a.geom,
                                index: feature.properties.a.index
                            },
                            c: {
                                geom: feature.properties.b.geom,
                                index: feature.properties.b.index
                            }
                        },
                        type: 'Feature'
                    };
                } else if ((feature.properties.c.index + '').substring(0, 4) == 'bbox' &&
                    (feature.properties.a.index + '').substring(0, 4) == 'bbox') {
                    features[i] = {
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [feature.geometry.coordinates[0][1], feature.geometry.coordinates[0][2], feature.geometry.coordinates[0][0],
                                    feature.geometry.coordinates[0][1]]
                            ]
                        },
                        properties: {
                            a: {
                                geom: feature.properties.b.geom,
                                index: feature.properties.b.index
                            },
                            b: {
                                geom: feature.properties.c.geom,
                                index: feature.properties.c.index
                            },
                            c: {
                                geom: feature.properties.a.geom,
                                index: feature.properties.a.index
                            }
                        },
                        type: 'Feature'
                    };
                }
            }
            return tins;
        }

        function findIntersections(coords) {
            var arcs = new internal.ArcCollection(coords);
            return internal.findSegmentIntersections(arcs);
        }

        function vertexCalc(list, centroid) {
            var centCoord = centroid.geometry.coordinates;
            return [0, 1, 2, 3].map(function(i) {
                var j = (i + 1) % 4;
                var itemi = list[i];
                var itemj = list[j];
                var coord = itemi.geometry.coordinates;
                var radian = Math.atan2(coord[0] - centCoord[0], coord[1] - centCoord[1]);
                var coordinates = [centroid, itemi, itemj, centroid].map(function(point) {
                    return point.geometry.coordinates;
                });
                var properties = {
                    a: {geom: centroid.properties.target.geom, index: centroid.properties.target.index},
                    b: {geom: itemi.properties.target.geom, index: itemi.properties.target.index},
                    c: {geom: itemj.properties.target.geom, index: itemj.properties.target.index}
                };
                var tin = turf.featureCollection([turf.polygon([coordinates], properties)]);

                return [radian, tin];
            }).reduce(function(prev, curr) {
                prev[0].push(curr[0]);
                prev[1].push(curr[1]);
                return prev;
            }, [[], []]);
        }

        function normalizeRadian(target, noNegative) {
            var rangeFunc = noNegative ? function(val) {
                    return !(val >= 0 && val < Math.PI * 2);
                } : function(val) {
                    return !(val > -1 * Math.PI && val <= Math.PI);
                };
            while (rangeFunc(target)) {
                target = target + 2 * Math.PI * (target > 0 ? -1 : 1);
            }
            return target;
        }

        function decideUseVertex(radian, radianList) {
            var idel = normalizeRadian(radian - radianList[0]);
            var minTheta = Math.PI * 2;
            var minIndex;
            for (var i = 0; i < radianList.length; i++) {
                var j = (i + 1) % radianList.length;
                var jdel = normalizeRadian(radian - radianList[j]);
                var minDel = Math.min(Math.abs(idel), Math.abs(jdel));
                if (idel * jdel <= 0 && minDel < minTheta) {
                    minTheta = minDel;
                    minIndex = i;
                }
                idel = jdel;
            }
            return minIndex;
        }

        function createPoint(xy, geom, index) {
            return turf.point(xy, {target: {geom: geom, index: index}});
        }

        function counterPoint(point) {
            return turf.point(point.properties.target.geom, {target: {geom: point.geometry.coordinates,
                index: point.properties.target.index}});
        }

        function transformTin(of, tri, weightBuffer) {
            return turf.point(transformTinArr(of, tri, weightBuffer));
        }
        function transformTinArr(of, tri, weightBuffer) {
            var a = tri.geometry.coordinates[0][0];
            var b = tri.geometry.coordinates[0][1];
            var c = tri.geometry.coordinates[0][2];
            var o = of.geometry.coordinates;
            var ad = tri.properties.a.geom;
            var bd = tri.properties.b.geom;
            var cd = tri.properties.c.geom;

            var ab = [b[0] -a[0], b[1] -a[1]];
            var ac = [c[0] -a[0], c[1] -a[1]];
            var ao = [o[0] -a[0], o[1] -a[1]];
            var abd = [bd[0]-ad[0], bd[1]-ad[1]];
            var acd = [cd[0]-ad[0], cd[1]-ad[1]];

            var abv = (ac[1]*ao[0]-ac[0]*ao[1])/(ab[0]*ac[1]-ab[1]*ac[0]);
            var acv = (ab[0]*ao[1]-ab[1]*ao[0])/(ab[0]*ac[1]-ab[1]*ac[0]);

            // Considering weight
            if (weightBuffer) {
                var aW = weightBuffer[tri.properties.a.index];
                var bW = weightBuffer[tri.properties.b.index];
                var cW = weightBuffer[tri.properties.c.index];

                var nabv;
                if (abv < 0 || acv < 0 || 1 - abv - acv < 0) {
                    var normB = abv / (abv + acv);
                    var normC = acv / (abv + acv);
                    nabv = abv / bW / (normB / bW + normC / cW);
                    acv = acv / cW / (normB / bW + normC / cW);
                } else {
                    nabv = abv / bW / (abv / bW + acv / cW + (1 - abv - acv) / aW);
                    acv = acv / cW / (abv / bW + acv / cW + (1 - abv - acv) / aW);
                }
                abv = nabv;
            }
            var od = [abv*abd[0]+acv*acd[0]+ad[0], abv*abd[1]+acv*acd[1]+ad[1]];
            return od;
        }

        function useVertices(o, verticesParams, centroid, weightBuffer) {
            return turf.point(useVerticesArr(o, verticesParams, centroid));
        }
        function useVerticesArr(o, verticesParams, centroid, weightBuffer) {
            var coord = o.geometry.coordinates;
            var centCoord = centroid.geometry.coordinates;
            var radian = Math.atan2(coord[0] - centCoord[0], coord[1] - centCoord[1]);
            var index = decideUseVertex(radian, verticesParams[0]);
            var tin = verticesParams[1][index];
            return transformTinArr(o, tin.features[0], weightBuffer);
        }

        function hit(point, tins) {
            for (var i=0; i< tins.features.length; i++) {
                var inside = turf.booleanPointInPolygon(point, tins.features[i]);
                if (inside) {
                    return tins.features[i];
                }
            }
        }

        function transform(point, tins, verticesParams, centroid, weightBuffer) {
            return turf.point(transformArr(point, tins, verticesParams, centroid, weightBuffer));
        }
        function transformArr(point, tins, verticesParams, centroid, weightBuffer) {
            var tin = hit(point, tins);
            return tin ? transformTinArr(point, tin, weightBuffer) : useVerticesArr(point, verticesParams, centroid, weightBuffer);
        }

        function counterTri(tri) {
            var coordinates = ['a', 'b', 'c', 'a'].map(function(key) {
                return tri.properties[key].geom;
            });
            var geoms = tri.geometry.coordinates[0];
            var props = tri.properties;
            var properties = {
                a: {geom: geoms[0], index: props['a'].index},
                b: {geom: geoms[1], index: props['b'].index},
                c: {geom: geoms[2], index: props['c'].index}
            };
            return turf.polygon([coordinates], properties);
        }

        function buildTri(points) {
            var coordinates = [0, 1, 2, 0].map(function(i) {
                return points[i][0][0];
            });
            var properties = {
                a: {geom: points[0][0][1], index: points[0][1]},
                b: {geom: points[1][0][1], index: points[1][1]},
                c: {geom: points[2][0][1], index: points[2][1]}
            };
            return turf.polygon([coordinates], properties);
        }

        function indexesToTri(indexes, points, edgeNodes, cent, bboxes, bakw) {
            var points = indexes.map(function(index) {
                var point_base = isFinite(index) ? points[index] :
                        index == 'cent' ? cent :
                            index == 'bbox0' ? bboxes[0] :
                                index == 'bbox1' ? bboxes[1] :
                                    index == 'bbox2' ? bboxes[2] :
                                        index == 'bbox3' ? bboxes[3] :
                                            (function() {
                                                var match = index.match(/edgeNode(\d+)/);
                                                if (match) {
                                                    var nodeIndex = parseInt(match[1]);
                                                    return edgeNodes[nodeIndex];
                                                }
                                                return undefined;
                                            })();
                return bakw ? [[point_base[1], point_base[0]], index] :
                    [[point_base[0], point_base[1]], index];
            });
            return buildTri(points);
        }

        function overlapCheckAsync(searchIndex) {
            var retValue = {forw: {}, bakw: {}};
            return Promise.all(Object.keys(searchIndex).map(function(key) {
                return new Promise(function(resolve) {
                    var searchResult = searchIndex[key];
                    if (searchResult.length < 2) return resolve();
                    ['forw', 'bakw'].map(function(dir) {
                        var result = turf.intersect(searchResult[0][dir], searchResult[1][dir]);
                        if (!result || result.geometry.type == 'Point' || result.geometry.type == 'LineString') return resolve();
                        var diff1 = turf.difference(searchResult[0][dir], result);
                        var diff2 = turf.difference(searchResult[1][dir], result);
                        /* if (!diff1 || !diff2) {
                            searchResult[dir][key] = 'Include case';
                        } else {
                            searchResult[dir][key] = 'Not include case';
                        }*/
                        resolve();
                    });
                });
            })).then(function() {
                if (Object.keys(retValue.forw).length == 0) delete retValue.forw;
                if (Object.keys(retValue.bakw).length == 0) delete retValue.bakw;
                return retValue;
            }).catch(function(err) {
                throw err;
            });
        }

        function insertSearchIndex(searchIndex, tris, tins) {
            var keys = calcSearchKeys(tris.forw);
            var bakKeys = calcSearchKeys(tris.bakw);
            if (JSON.stringify(keys) != JSON.stringify(bakKeys))
                throw JSON.stringify(tris, null, 2) + '\n' + JSON.stringify(keys) + '\n' + JSON.stringify(bakKeys);

            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                if (!searchIndex[key]) searchIndex[key] = [];
                searchIndex[key].push(tris);
            }
            if (tins) {
                tins.forw.features.push(tris.forw);
                tins.bakw.features.push(tris.bakw);
            }
        }

        function removeSearchIndex(searchIndex, tris, tins) {
            var keys = calcSearchKeys(tris.forw);
            var bakKeys = calcSearchKeys(tris.bakw);
            if (JSON.stringify(keys) != JSON.stringify(bakKeys))
                throw JSON.stringify(tris, null, 2) + '\n' + JSON.stringify(keys) + '\n' + JSON.stringify(bakKeys);

            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var newArray = searchIndex[key].filter(function(eachTris) {
                    return eachTris.forw != tris.forw;
                });
                if (newArray.length == 0) delete searchIndex[key];
                else searchIndex[key] = newArray;
            }
            if (tins) {
                var newArray = tins.forw.features.filter(function(eachTri) {
                    return eachTri != tris.forw;
                });
                tins.forw.features = newArray;
                newArray = tins.bakw.features.filter(function(eachTri) {
                    return eachTri != tris.bakw;
                });
                tins.bakw.features = newArray;
            }
        }

        function calcSearchKeys(tri) {
            var vtx = ['a', 'b', 'c'].map(function(key) {
                return tri.properties[key].index;
            });
            return [[0, 1], [0, 2], [1, 2], [0, 1, 2]].map(function(set) {
                var index = set.map(function(i) {
                    return vtx[i];
                }).sort().join('-');
                return index;
            }).sort();
        }

        return Tin;
    });
})(
// Already defined turf
    'function' === typeof turf
    ? function _loaderForReady(commonDefine) {
        this.Tin = commonDefine(this.turf, this.mapshaper);
    }
// AMD RequireJS
    : 'function' === typeof define && define.amd
        ? function _loaderForRequirejs(commonDefine) {
            define(['turf', 'mapshaper'], function(turf, mapshaper) {
                return commonDefine(turf, mapshaper);
            });
        }
// CommonJS NodeJS
        : 'undefined' !== typeof module && module.exports &&
            'function' === typeof require
            ? function _loaderForCommonjs(commonDefine) {
                var turf;
                var mapshaper;
                try {
                    turf = require('@turf/turf');
                    mapshaper = require('mapshaper');
                } catch (e) {}
                module.exports = commonDefine(turf, mapshaper);
            }
// this === window
            : function _loaderForWindow(commonDefine) {
                if (! this.turf )
                    throw new Error('"turf" not found');

                this.Tin = commonDefine(this.turf, this.mapshaper);
            }
);

function constrainedTinInit(turf) {
    // A fast algorithm for generating constrained delaunay triangulations
    // https://www.sciencedirect.com/science/article/pii/004579499390239A
    // A robust efficient algorithm for point location in triangulations
    // https://www.cl.cam.ac.uk/techreports/UCAM-CL-TR-728.pdf
    // https://savithru-j.github.io/cdt-js/
    // Copyright 2018 Savithru Jayasinghe
    // Licensed under the MIT License

    var Point = function(x, y) {
        this.x = x;
        this.y = y;
    };
    Point.prototype.dot = function(p1) {
        return (this.x*p1.x + this.y*p1.y);
    };
    Point.prototype.add = function(p1) {
        return new Point(this.x + p1.x, this.y + p1.y);
    };
    Point.prototype.sub = function(p1) {
        return new Point(this.x - p1.x, this.y - p1.y);
    };
    Point.prototype.scale = function(s) {
        return new Point(this.x*s, this.y*s);
    };
    Point.prototype.sqDistanceTo = function(p1) {
        return (this.x - p1.x)*(this.x - p1.x) + (this.y - p1.y)*(this.y - p1.y);
    };
    Point.prototype.toStr = function() {
        return "(" + this.x.toFixed(3) + ", " + this.y.toFixed(3) + ")";
    };
    Point.prototype.copyFrom = function(p) {
        this.x = p.x;
        this.y = p.y;
    };

    function cross(vec0, vec1)
    {
        return (vec0.x*vec1.y - vec0.y*vec1.x);
    }

    function getPointOrientation(edge, p)
    {
        var vec_edge01 = edge[1].sub(edge[0]);
        var vec_edge0_to_p = p.sub(edge[0]);
        return cross(vec_edge01, vec_edge0_to_p);
    }

//Some variables for rendering

    var fieldOrigin = new Point(0.0, 0.0);//new Point(-16000000, -16000000);
    var fieldSize = 1.0;//32000000;
    var boundingTriangleSize = 1000;//1000000000;

    function binSorter(a, b)
    {
        if (a.bin == b.bin) {
            return 0;
        } else {
            return a.bin < b.bin ? -1 : 1;
        }
    }

    function isQuadConvex(p0, p1, p2, p3)
    {
        var diag0 = [p0, p2];
        var diag1 = [p1, p3];

        return isEdgeIntersecting(diag0, diag1);
    }

    function isSameEdge(edge0, edge1)
    {
        return ((edge0[0] == edge1[0] && edge0[1] == edge1[1]) ||
            (edge0[1] == edge1[0] && edge0[0] == edge1[1]))
    }

    function isEdgeIntersecting(edgeA, edgeB)
    {
        var vecA0A1 = edgeA[1].sub(edgeA[0]);
        var vecA0B0 = edgeB[0].sub(edgeA[0]);
        var vecA0B1 = edgeB[1].sub(edgeA[0]);

        var AxB0 = cross(vecA0A1, vecA0B0);
        var AxB1 = cross(vecA0A1, vecA0B1);

        //Check if the endpoints of edgeB are on the same side of edgeA
        if ((AxB0 > 0 && AxB1 > 0) || (AxB0 < 0 && AxB1 < 0))
            return false;

        var vecB0B1 = edgeB[1].sub(edgeB[0]);
        var vecB0A0 = edgeA[0].sub(edgeB[0]);
        var vecB0A1 = edgeA[1].sub(edgeB[0]);

        var BxA0 = cross(vecB0B1, vecB0A0);
        var BxA1 = cross(vecB0B1, vecB0A1);

        //Check if the endpoints of edgeA are on the same side of edgeB
        if ((BxA0 > 0 && BxA1 > 0) || (BxA0 < 0 && BxA1 < 0))
            return false;

        //Special case of colinear edges
        if (Math.abs(AxB0) < 1e-14 && Math.abs(AxB1) < 1e-14)
        {
            //Separated in x
            if ( (Math.max(edgeB[0].x, edgeB[1].x) < Math.min(edgeA[0].x, edgeA[1].x)) ||
                (Math.min(edgeB[0].x, edgeB[1].x) > Math.max(edgeA[0].x, edgeA[1].x)) )
                return false;

            //Separated in y
            if ( (Math.max(edgeB[0].y, edgeB[1].y) < Math.min(edgeA[0].y, edgeA[1].y)) ||
                (Math.min(edgeB[0].y, edgeB[1].y) > Math.max(edgeA[0].y, edgeA[1].y)) )
                return false;
        }

        return true;
    }

    function setupDelaunay(meshData)
    {
        var nVertex = meshData.vert.length;
        var nBinsX = Math.round(Math.pow(nVertex, 0.25));
        var nBins = nBinsX*nBinsX;

        //Compute scaled vertex coordinates and assign each vertex to a bin
        var scaledverts = [];
        var bin_index = [];
        for(var i = 0; i < nVertex; i++)
        {
            var scaled_x = (meshData.vert[i].x - fieldOrigin.x)/fieldSize;
            var scaled_y = (meshData.vert[i].y - fieldOrigin.y)/fieldSize;
            scaledverts.push(new Point(scaled_x, scaled_y));

            var ind_i = Math.round((nBinsX-1)*scaled_x);
            var ind_j = Math.round((nBinsX-1)*scaled_y);

            var bin_id;
            if (ind_j % 2 === 0)
            {
                bin_id = ind_j*nBinsX + ind_i;
            }
            else
            {
                bin_id = (ind_j+1)*nBinsX - ind_i - 1;
            }
            bin_index.push({ind:i,bin:bin_id});
        }


        //Add super-triangle vertices (far away)
        var D = boundingTriangleSize;
        scaledverts.push(new Point(-D+0.5, -D/Math.sqrt(3) + 0.5));
        scaledverts.push(new Point( D+0.5, -D/Math.sqrt(3) + 0.5));
        scaledverts.push(new Point(   0.5, 2*D/Math.sqrt(3) + 0.5));

        for (var i = nVertex; i < nVertex+3; i++)
            meshData.vert.push(new Point(fieldSize*scaledverts[i].x + fieldOrigin.x, fieldSize*scaledverts[i].y + fieldOrigin.y));

        //Sort the vertices in ascending bin order
        bin_index.sort(binSorter);

        meshData.scaled_vert = scaledverts;
        meshData.bin = bin_index;

        //Super-triangle connectivity
        meshData.tri = [[nVertex, (nVertex+1), (nVertex+2)]];
        meshData.adj = [[-1, -1, -1]];

        meshData.vert_to_tri = [];
    }

//Function for computing the unconstrained Delaunay triangulation
    function delaunay(meshData)
    {
        //Sort input vertices and setup super-triangle
        setupDelaunay(meshData);

        var verts = meshData.scaled_vert;
        var bins = meshData.bin;
        var triangles = meshData.tri;
        var adjacency = meshData.adj;

        var N = verts.length - 3; //vertices includes super-triangle nodes

        var ind_tri = 0; //points to the super-triangle
        var nhops_total = 0;

        for (var i = 0; i < N; i++)
        {
            var new_i = bins[i].ind;

            var res = findEnclosingTriangle(verts[new_i], meshData, ind_tri);
            ind_tri = res[0];
            nhops_total += res[1];

            if (ind_tri === -1)
                throw "Could not find a triangle containing the new vertex!";

            var cur_tri = triangles[ind_tri]; //vertex indices of triangle containing new point
            var new_tri0 = [cur_tri[0], cur_tri[1], new_i];
            var new_tri1 = [new_i, cur_tri[1], cur_tri[2]];
            var new_tri2 = [cur_tri[0], new_i, cur_tri[2]];

            //Replace the triangle containing the point with new_tri0, and
            //fix its adjacency
            triangles[ind_tri] = new_tri0;

            var N_tri = triangles.length;
            var cur_tri_adj = adjacency[ind_tri]; //neighbors of cur_tri
            adjacency[ind_tri] = [N_tri, N_tri+1, cur_tri_adj[2]];

            //Add the other two new triangles to the list
            triangles.push(new_tri1); //triangle index N_tri
            triangles.push(new_tri2); //triangle index (N_tri+1)

            adjacency.push([cur_tri_adj[0], N_tri+1, ind_tri]); //adj for triangle N_tri
            adjacency.push([N_tri, cur_tri_adj[1], ind_tri]); //adj for triangle (N_tri+1)

            //stack of triangles which need to be checked for Delaunay condition
            //each element contains: [index of tri to check, adjncy index to goto triangle that contains new point]
            var stack = [];

            if (cur_tri_adj[2] >= 0) //if triangle cur_tri's neighbor exists
            {
                //Find the index for cur_tri in the adjacency of the neighbor
                var neigh_adj_ind = adjacency[cur_tri_adj[2]].indexOf(ind_tri);

                //No need to update adjacency, but push the neighbor on to the stack
                stack.push([cur_tri_adj[2], neigh_adj_ind]);
            }
            if (cur_tri_adj[0] >= 0) //if triangle N_tri's neighbor exists
            {
                //Find the index for cur_tri in the adjacency of the neighbor
                var neigh_adj_ind = adjacency[cur_tri_adj[0]].indexOf(ind_tri);
                adjacency[cur_tri_adj[0]][neigh_adj_ind] = N_tri;
                stack.push([cur_tri_adj[0], neigh_adj_ind]);
            }

            if (cur_tri_adj[1] >= 0) //if triangle (N_tri+1)'s neighbor exists
            {
                //Find the index for cur_tri in the adjacency of the neighbor
                var neigh_adj_ind = adjacency[cur_tri_adj[1]].indexOf(ind_tri);
                adjacency[cur_tri_adj[1]][neigh_adj_ind] = N_tri+1;
                stack.push([cur_tri_adj[1], neigh_adj_ind]);
            }

            restoreDelaunay(new_i, meshData, stack);

        } //loop over vertices

        removeBoundaryTriangles(meshData);
    }

//Uses edge orientations - based on Peter Brown's Technical Report 1997
    function findEnclosingTriangle(target_vertex, meshData, ind_tri_cur)
    {
        var vertices = meshData.scaled_vert;
        var triangles = meshData.tri;
        var adjacency = meshData.adj;
        var max_hops = Math.max(10, adjacency.length);

        var nhops = 0;
        var found_tri = false;
        var path = [];

        while (!found_tri && nhops < max_hops)
        {
            if (ind_tri_cur === -1) //target is outside triangulation
                return [ind_tri_cur, nhops];

            var tri_cur = triangles[ind_tri_cur];

            //Orientation of target wrt each edge of triangle (positive if on left of edge)
            var orients = [getPointOrientation([vertices[tri_cur[1]],  vertices[tri_cur[2]]], target_vertex),
                getPointOrientation([vertices[tri_cur[2]],  vertices[tri_cur[0]]], target_vertex),
                getPointOrientation([vertices[tri_cur[0]],  vertices[tri_cur[1]]], target_vertex)];

            if (orients[0] >= 0 && orients[1] >= 0 && orients[2] >= 0) //target is to left of all edges, so inside tri
                return [ind_tri_cur, nhops];

            var base_ind = -1;
            for (var iedge = 0; iedge < 3; iedge++)
            {
                if (orients[iedge] >= 0)
                {
                    base_ind = iedge;
                    break;
                }
            }
            var base_p1_ind = (base_ind + 1) % 3;
            var base_p2_ind = (base_ind + 2) % 3;

            if (orients[base_p1_ind] >= 0 && orients[base_p2_ind] < 0)
            {
                ind_tri_cur = adjacency[ind_tri_cur][base_p2_ind]; //should move to the triangle opposite base_p2_ind
                path[nhops] = vertices[tri_cur[base_ind]].add(vertices[tri_cur[base_p1_ind]]).scale(0.5);
            }
            else if (orients[base_p1_ind] < 0 && orients[base_p2_ind] >= 0)
            {
                ind_tri_cur = adjacency[ind_tri_cur][base_p1_ind]; //should move to the triangle opposite base_p1_ind
                path[nhops] = vertices[tri_cur[base_p2_ind]].add(vertices[tri_cur[base_ind]]).scale(0.5);
            }
            else
            {
                var vec0 = vertices[tri_cur[base_p1_ind]].sub(vertices[tri_cur[base_ind]]); //vector from base_ind to base_p1_ind
                var vec1 = target_vertex.sub(vertices[tri_cur[base_ind]]); //vector from base_ind to target_vertex
                if (vec0.dot(vec1) > 0)
                {
                    ind_tri_cur = adjacency[ind_tri_cur][base_p2_ind]; //should move to the triangle opposite base_p2_ind
                    path[nhops] = vertices[tri_cur[base_ind]].add(vertices[tri_cur[base_p1_ind]]).scale(0.5);
                }
                else
                {
                    ind_tri_cur = adjacency[ind_tri_cur][base_p1_ind]; //should move to the triangle opposite base_p1_ind
                    path[nhops] = vertices[tri_cur[base_p2_ind]].add(vertices[tri_cur[base_ind]]).scale(0.5);
                }
            }

            nhops++;
        }

        if(!found_tri)
        {
            throw "Could not locate the triangle that encloses (" + target_vertex.x + ", " + target_vertex.y + ")!";
        }

        return [ind_tri_cur, (nhops-1)];
    }

    function restoreDelaunay(ind_vert, meshData, stack)
    {
        var vertices = meshData.scaled_vert;
        var triangles = meshData.tri;
        var adjacency = meshData.adj;
        var v_new = vertices[ind_vert];

        while(stack.length > 0)
        {
            var ind_tri_pair = stack.pop(); //[index of tri to check, adjncy index to goto triangle that contains new point]
            var ind_tri = ind_tri_pair[0];

            var ind_tri_vert = triangles[ind_tri]; //vertex indices of the triangle
            var v_tri = [];
            for (var i = 0; i < 3; i++)
                v_tri[i] = vertices[ind_tri_vert[i]];

            if (!isDelaunay2(v_tri, v_new))
            {
                //v_new lies inside the circumcircle of the triangle, so need to swap diagonals

                var outernode_tri = ind_tri_pair[1]; // [0,1,2] node-index of vertex that's not part of the common edge
                var ind_tri_neigh = adjacency[ind_tri][outernode_tri];

                if (ind_tri_neigh < 0)
                    throw "negative index";

                //Swap the diagonal between the adjacent triangles
                swapDiagonal(meshData, ind_tri, ind_tri_neigh);

                //Add the triangles opposite the new vertex to the stack
                var new_node_ind_tri = triangles[ind_tri].indexOf(ind_vert);
                var ind_tri_outerp2 = adjacency[ind_tri][new_node_ind_tri];
                if (ind_tri_outerp2 >= 0)
                {
                    var neigh_node = adjacency[ind_tri_outerp2].indexOf(ind_tri);
                    stack.push([ind_tri_outerp2, neigh_node]);
                }

                var new_node_ind_tri_neigh = triangles[ind_tri_neigh].indexOf(ind_vert);
                var ind_tri_neigh_outer = adjacency[ind_tri_neigh][new_node_ind_tri_neigh];
                if (ind_tri_neigh_outer >= 0)
                {
                    var neigh_node = adjacency[ind_tri_neigh_outer].indexOf(ind_tri_neigh);
                    stack.push([ind_tri_neigh_outer, neigh_node]);
                }

            } //is not Delaunay
        }
    }

//Swaps the diagonal of adjacent triangles A and B
    function swapDiagonal(meshData, ind_triA, ind_triB)
    {
        var triangles = meshData.tri;
        var adjacency = meshData.adj;
        var vert2tri = meshData.vert_to_tri;

        //Find the node index of the outer vertex in each triangle
        var outernode_triA = adjacency[ind_triA].indexOf(ind_triB);
        var outernode_triB = adjacency[ind_triB].indexOf(ind_triA);

        //Indices of nodes after the outernode (i.e. nodes of the common edge)
        var outernode_triA_p1 = (outernode_triA + 1) % 3;
        var outernode_triA_p2 = (outernode_triA + 2) % 3;

        var outernode_triB_p1 = (outernode_triB + 1) % 3;
        var outernode_triB_p2 = (outernode_triB + 2) % 3;

        //Update triangle nodes
        triangles[ind_triA][outernode_triA_p2] = triangles[ind_triB][outernode_triB];
        triangles[ind_triB][outernode_triB_p2] = triangles[ind_triA][outernode_triA];

        //Update adjacencies for triangle opposite outernode
        adjacency[ind_triA][outernode_triA] = adjacency[ind_triB][outernode_triB_p1];
        adjacency[ind_triB][outernode_triB] = adjacency[ind_triA][outernode_triA_p1];

        //Update adjacency of neighbor opposite triangle A's (outernode+1) node
        var ind_triA_neigh_outerp1 = adjacency[ind_triA][outernode_triA_p1];
        if (ind_triA_neigh_outerp1 >= 0)
        {
            var neigh_node = adjacency[ind_triA_neigh_outerp1].indexOf(ind_triA);
            adjacency[ind_triA_neigh_outerp1][neigh_node] = ind_triB;
        }

        //Update adjacency of neighbor opposite triangle B's (outernode+1) node
        var ind_triB_neigh_outerp1 = adjacency[ind_triB][outernode_triB_p1];
        if (ind_triB_neigh_outerp1 >= 0)
        {
            var neigh_node = adjacency[ind_triB_neigh_outerp1].indexOf(ind_triB);
            adjacency[ind_triB_neigh_outerp1][neigh_node] = ind_triA;
        }

        //Update adjacencies for triangles opposite the (outernode+1) node
        adjacency[ind_triA][outernode_triA_p1] = ind_triB;
        adjacency[ind_triB][outernode_triB_p1] = ind_triA;

        //Update vertex to triangle connectivity, if data structure exists
        if (vert2tri.length > 0)
        {
            //The original outernodes will now be part of both triangles
            vert2tri[triangles[ind_triA][outernode_triA]].push(ind_triB);
            vert2tri[triangles[ind_triB][outernode_triB]].push(ind_triA);

            //Remove triangle B from the triangle set of outernode_triA_p1
            var local_ind = vert2tri[triangles[ind_triA][outernode_triA_p1]].indexOf(ind_triB);
            vert2tri[triangles[ind_triA][outernode_triA_p1]].splice(local_ind, 1);

            //Remove triangle A from the triangle set of outernode_triB_p1
            local_ind = vert2tri[triangles[ind_triB][outernode_triB_p1]].indexOf(ind_triA);
            vert2tri[triangles[ind_triB][outernode_triB_p1]].splice(local_ind, 1);
        }
    }

    function removeBoundaryTriangles(meshData)
    {
        var verts = meshData.scaled_vert;
        var triangles = meshData.tri;
        var adjacency = meshData.adj;
        var N = verts.length - 3;

        var del_count = 0;
        var indmap = [];
        for (var i = 0; i < triangles.length; i++)
        {
            var prev_del_count = del_count;
            for (var j = i; j < triangles.length; j++)
            {
                if (triangles[j][0] < N && triangles[j][1] < N && triangles[j][2] < N)
                {
                    indmap[i+del_count] = i;
                    break;
                }
                else
                {
                    indmap[i+del_count] = -1;
                    del_count++;
                }
            }

            var del_length = del_count - prev_del_count;
            if (del_length > 0)
            {
                triangles.splice(i, del_length);
                adjacency.splice(i, del_length);
            }
        }

        //Update adjacencies
        for (var i = 0; i < adjacency.length; i++)
            for (var j = 0; j < 3; j++)
                adjacency[i][j] = indmap[adjacency[i][j]];

        //Delete super-triangle nodes
        meshData.scaled_vert.splice(-3,3);
        meshData.vert.splice(-3,3);
    }

    function isDelaunay2(v_tri, p)
    {
        var vecp0 = v_tri[0].sub(p);
        var vecp1 = v_tri[1].sub(p);
        var vecp2 = v_tri[2].sub(p);

        var p0_sq = vecp0.x*vecp0.x + vecp0.y*vecp0.y;
        var p1_sq = vecp1.x*vecp1.x + vecp1.y*vecp1.y;
        var p2_sq = vecp2.x*vecp2.x + vecp2.y*vecp2.y;

        var det = vecp0.x * (vecp1.y * p2_sq - p1_sq * vecp2.y)
            -vecp0.y * (vecp1.x * p2_sq - p1_sq * vecp2.x)
            + p0_sq  * (vecp1.x * vecp2.y - vecp1.y * vecp2.x);

        if (det > 0) //p is inside circumcircle of v_tri
            return false;
        else
            return true;
    }

    function constrainEdges(meshData)
    {
        if (meshData.con_edge.length == 0)
            return;

        buildVertexConnectivity(meshData);

        var con_edges = meshData.con_edge;
        var triangles = meshData.tri;
        var verts = meshData.scaled_vert;
        var adjacency = meshData.adj;
        var vert2tri = meshData.vert_to_tri;

        var newEdgeList = [];

        for (var iedge = 0; iedge < con_edges.length; iedge++)
        {
            var intersections = getEdgeIntersections(meshData, iedge);

            var iter = 0;
            var maxIter = Math.max(intersections.length, 1);
            while (intersections.length > 0 && iter < maxIter)
            {
                fixEdgeIntersections(meshData, intersections, iedge, newEdgeList);
                intersections = getEdgeIntersections(meshData, iedge);
                iter++;
            }

            if (intersections.length > 0)
                throw "Could not add edge " + iedge + " to triangulation after " + maxIter + " iterations!";

        } //loop over constrained edges


        //Restore Delaunay
        while (true)
        {
            var num_diagonal_swaps = 0;
            for (var iedge = 0; iedge < newEdgeList.length; iedge++)
            {
                var new_edge_nodes = newEdgeList[iedge];

                //Check if the new edge is a constrained edge
                var is_con_edge = false
                for (var jedge = 0; jedge < con_edges.length; jedge++)
                {
                    if (isSameEdge(new_edge_nodes, con_edges[jedge]))
                    {
                        is_con_edge = true;
                        break;
                    };
                }

                if (is_con_edge)
                    continue; //cannot change this edge if it's constrained

                var tri_around_v0 = vert2tri[new_edge_nodes[0]];
                var tri_count = 0;
                var tri_ind_pair = [-1, -1]; //indices of the triangles on either side of this edge
                for (var itri = 0; itri < tri_around_v0.length; itri++)
                {
                    var cur_tri = triangles[tri_around_v0[itri]];
                    if (cur_tri[0] == new_edge_nodes[1] || cur_tri[1] == new_edge_nodes[1] || cur_tri[2] == new_edge_nodes[1])
                    {
                        tri_ind_pair[tri_count] = tri_around_v0[itri];
                        tri_count++;

                        if (tri_count == 2)
                            break; //found both neighboring triangles
                    }
                }

                if (tri_ind_pair[0] == -1)
                    continue; //this edge no longer exists, so nothing to do.

                var triA_verts = [verts[triangles[tri_ind_pair[0]][0]],
                    verts[triangles[tri_ind_pair[0]][1]],
                    verts[triangles[tri_ind_pair[0]][2]]];

                var outer_nodeB_ind = adjacency[tri_ind_pair[1]].indexOf(tri_ind_pair[0]);
                var triB_vert = verts[triangles[tri_ind_pair[1]][outer_nodeB_ind]];

                if (!isDelaunay2(triA_verts, triB_vert))
                {
                    var outer_nodeA_ind = adjacency[tri_ind_pair[0]].indexOf(tri_ind_pair[1]);

                    //Swap the diagonal between the pair of triangles
                    swapDiagonal(meshData, tri_ind_pair[0], tri_ind_pair[1]);
                    num_diagonal_swaps++;

                    //Replace current new edge with the new diagonal
                    newEdgeList[iedge] = [triangles[tri_ind_pair[0]][outer_nodeA_ind],
                        triangles[tri_ind_pair[1]][outer_nodeB_ind]];
                }

            } //loop over new edges

            if (num_diagonal_swaps == 0)
                break; //no further swaps, we're done.
        }
    }

    function buildVertexConnectivity(meshData)
    {
        var triangles = meshData.tri;
        meshData.vert_to_tri = [];
        var vConnectivity = meshData.vert_to_tri;

        for (var itri = 0; itri < triangles.length; itri++)
        {
            for (var node = 0; node < 3; node++)
            {
                if (vConnectivity[triangles[itri][node]] == undefined)
                    vConnectivity[triangles[itri][node]] = [itri];
                else
                    vConnectivity[triangles[itri][node]].push(itri);
            }
        }
    }

    function getEdgeIntersections(meshData, iedge)
    {
        var triangles = meshData.tri;
        var verts = meshData.scaled_vert;
        var adjacency = meshData.adj;
        var con_edges = meshData.con_edge;
        var vert2tri = meshData.vert_to_tri;

        var edge_v0_ind = con_edges[iedge][0];
        var edge_v1_ind = con_edges[iedge][1];
        var edge_coords = [verts[edge_v0_ind], verts[edge_v1_ind]];

        var tri_around_v0 = vert2tri[edge_v0_ind];

        var edge_in_triangulation = false;

        //stores the index of tri that intersects current edge,
        //and the edge-index of intersecting edge in triangle
        var intersections = [];

        for (var itri = 0; itri < tri_around_v0.length; itri++)
        {
            var cur_tri = triangles[tri_around_v0[itri]];
            var v0_node = cur_tri.indexOf(edge_v0_ind);
            var v0p1_node = (v0_node+1) % 3;
            var v0p2_node = (v0_node+2) % 3;

            if ( edge_v1_ind == cur_tri[v0p1_node] )
            {
                //constrained edge is an edge of the current tri (node v0_node to v0_node+1)
                edge_in_triangulation = true;
                break;
            }
            else if ( edge_v1_ind == cur_tri[v0p2_node] )
            {
                //constrained edge is an edge of the current tri (node v0_node to v0_node+2)
                edge_in_triangulation = true;
                break;
            }

            var opposite_edge_coords = [verts[cur_tri[v0p1_node]], verts[cur_tri[v0p2_node]]];
            if (isEdgeIntersecting(edge_coords, opposite_edge_coords))
            {
                intersections.push([tri_around_v0[itri], v0_node]);
                break;
            }
        }

        if (!edge_in_triangulation)
        {
            if (intersections.length == 0)
                throw "Cannot have no intersections!";

            while (true)
            {
                var prev_intersection = intersections[intersections.length - 1]; //[tri ind][node ind for edge]
                var tri_ind = adjacency[prev_intersection[0]][prev_intersection[1]];

                if ( triangles[tri_ind][0] == edge_v1_ind ||
                    triangles[tri_ind][1] == edge_v1_ind ||
                    triangles[tri_ind][2] == edge_v1_ind )
                {
                    break; //found the end node of the edge
                }

                //Find the index of the edge from which we came into this triangle
                var prev_edge_ind = adjacency[tri_ind].indexOf(prev_intersection[0]);
                if (prev_edge_ind == -1)
                    throw "Could not find edge!";

                var cur_tri = triangles[tri_ind];

                //Loop over the other two edges in this triangle,
                //and check if they intersect the constrained edge
                for (var offset = 1; offset < 3; offset++)
                {
                    var v0_node = (prev_edge_ind+offset+1) % 3;
                    var v1_node = (prev_edge_ind+offset+2) % 3;
                    var cur_edge_coords = [verts[cur_tri[v0_node]], verts[cur_tri[v1_node]]];

                    if (isEdgeIntersecting(edge_coords, cur_edge_coords))
                    {
                        intersections.push([tri_ind, (prev_edge_ind+offset) % 3]);
                        break;
                    }
                }

            } //while intersections not found
        } //if edge not in triangulation

        return intersections;
    }

    function fixEdgeIntersections(meshData, intersectionList, con_edge_ind, newEdgeList)
    {
        var triangles = meshData.tri;
        var verts = meshData.scaled_vert;
        var adjacency = meshData.adj;
        var con_edges = meshData.con_edge;

        //Node indices and endpoint coords of current constrained edge
        var con_edge_nodes = con_edges[con_edge_ind];
        var cur_con_edge_coords = [verts[con_edge_nodes[0]], verts[con_edge_nodes[1]]];

        var nIntersections = intersectionList.length;
        for (var i = 0; i < nIntersections; i++)
        {
            //Looping in reverse order is important since then the
            //indices in intersectionList remain unaffected by any diagonal swaps
            var tri0_ind = intersectionList[nIntersections - 1 - i][0];
            var tri0_node = intersectionList[nIntersections - 1 - i][1];

            var tri1_ind = adjacency[tri0_ind][tri0_node];
            var tri1_node = adjacency[tri1_ind].indexOf(tri0_ind);

            var quad_v0 = verts[triangles[tri0_ind][tri0_node]];
            var quad_v1 = verts[triangles[tri0_ind][(tri0_node + 1) % 3]];
            var quad_v2 = verts[triangles[tri1_ind][tri1_node]];
            var quad_v3 = verts[triangles[tri0_ind][(tri0_node + 2) % 3]];

            var isConvex = isQuadConvex(quad_v0, quad_v1, quad_v2, quad_v3);

            if (isConvex)
            {
                swapDiagonal(meshData, tri0_ind, tri1_ind);

                var newDiagonal_nodes = [triangles[tri0_ind][tri0_node], triangles[tri1_ind][tri1_node]];

                var newDiagonal_coords = [quad_v0, quad_v2];
                var hasCommonNode = (newDiagonal_nodes[0] == con_edge_nodes[0] || newDiagonal_nodes[0] == con_edge_nodes[1] ||
                    newDiagonal_nodes[1] == con_edge_nodes[0] || newDiagonal_nodes[1] == con_edge_nodes[1]);
                if (hasCommonNode || !isEdgeIntersecting(cur_con_edge_coords, newDiagonal_coords))
                {
                    newEdgeList.push([newDiagonal_nodes[0], newDiagonal_nodes[1]]);
                }

            } //is convex

        } //loop over intersections
    }

    function loadEdges(meshData, edges)
    {
        var nVertex = meshData.vert.length;

        meshData.con_edge = [];

        for(var i = 0; i < edges.length; i++)
        {
            var edge = edges[i];

            if (edge[0] < 0 || edge[0] >= nVertex ||
                edge[1] < 0 || edge[1] >= nVertex)
            {
                throw ("Vertex indices of edge " + i + " need to be non-negative and less than the number of input vertices.");
                meshData.con_edge = [];
                break;
            }

            if (edge[0] === edge[1])
            {
                throw("Edge " + i + " is degenerate!");
                meshData.con_edge = [];
                break;
            }

            if (!isEdgeValid(edge, meshData.con_edge, meshData.vert))
            {
                throw("Edge " + i + " already exists or intersects with an existing edge!");
                meshData.con_edge = [];
                break;
            }

            meshData.con_edge.push([edge[0], edge[1]]);
        }
    }

    function isEdgeValid(newEdge, edgeList, vertices)
    {
        var new_edge_verts = [vertices[newEdge[0]], vertices[newEdge[1]]];

        for (var i = 0; i < edgeList.length; i++)
        {
            //Not valid if edge already exists
            if ( (edgeList[i][0] == newEdge[0] && edgeList[i][1] == newEdge[1]) ||
                (edgeList[i][0] == newEdge[1] && edgeList[i][1] == newEdge[0]) )
                return false;

            var hasCommonNode = (edgeList[i][0] == newEdge[0] || edgeList[i][0] == newEdge[1] ||
                edgeList[i][1] == newEdge[0] || edgeList[i][1] == newEdge[1]);

            var edge_verts = [vertices[edgeList[i][0]], vertices[edgeList[i][1]]];

            if (!hasCommonNode && isEdgeIntersecting(edge_verts, new_edge_verts))
                return false;
        }

        return true;
    }

    turf.constrainedTin = function(points, edges, z) {
        if (!edges) edges = [];
        if (typeof points !== "object" || points.type !== "FeatureCollection") throw "Argument points must be FeatureCollection";
        if (!Array.isArray(edges)) throw "Argument points must be Array of Array";
        if (z && typeof z !== "string") throw "Argument z must be string";
        var isPointZ = false;
        // Caluculating scale factor
        // Original cdt-js not working well with coordinates between (0,0)-(1,1)
        // So points must be normalized
        var xyzs = points.features.reduce(function(prev, point) {
            var xy = point.geometry.coordinates;
            prev[0].push(xy[0]);
            prev[1].push(xy[1]);
            if (z) {
                prev[2].push(point.properties[z]);
            } else if (xy.length === 3) {
                isPointZ = true;
                prev[2].push(point.geometry.coordinates[2]);
            }
            return prev;
        }, [[], [], []]);
        var xMax = Math.max.apply(null, xyzs[0]);
        var xMin = Math.min.apply(null, xyzs[0]);
        var yMax = Math.max.apply(null, xyzs[1]);
        var yMin = Math.min.apply(null, xyzs[1]);
        var xDiff = xMax - xMin;
        var xCenter = (xMax + xMin) / 2.0;
        var yDiff = yMax - yMin;
        var yCenter = (yMax + yMin) / 2.0;
        var maxDiff = Math.max(xDiff, yDiff) * 1.1;
        // Normalize points
        var normPoints = points.features.map(function(point) {
            var xy = point.geometry.coordinates;
            var normXy = [
                (xy[0] - xCenter) / maxDiff + 0.5,
                (xy[1] - yCenter) / maxDiff + 0.5
            ];
            return new Point(normXy[0], normXy[1]);
        });
        // Create data structure for cdt-js
        var meshData = {
            vert: normPoints
        };
        // Load edges to data structure, with checking error
        loadEdges(meshData, edges);
        // Calculating Delaunay
        delaunay(meshData);
        // Applying edges constrain
        constrainEdges(meshData);
        // Unnormalize points and create output results
        var keys = ['a', 'b', 'c'];
        return turf.helpers.featureCollection(meshData.tri.map(function(indices) {
            var properties = {};
            var coords = indices.map(function(index, i) {
                var coord = [xyzs[0][index], xyzs[1][index]];
                if (xyzs[2][index] !== undefined) {
                    if (isPointZ) {
                        coord[2] = xyzs[2][index];
                    } else {
                        properties[keys[i]] = xyzs[2][index];
                    }
                }
                return coord;
            })
            coords[3] = coords[0];
            return turf.helpers.polygon([coords], properties);
        }));
    };
}
