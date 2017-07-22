(function(loader) {
    loader(function _commonDefine(turf, mapshaper) {
        var isClockwise = turf.booleanClockwise;
        var internal = mapshaper.internal;
        var Tin = function(options) {
            this.points = options.points;
            this.wh = options.wh;

            // for turf inside patch

            turf.inside = function input(point, polygon) {
                var pt = turf.getCoord(point);
                var polys = polygon.geometry.coordinates;
                // normalize to multipolygon
                if (polygon.geometry.type === 'Polygon') polys = [polys];

                for (var i = 0, insidePoly = false; i < polys.length && !insidePoly; i++) {
                    // check if it is in the outer ring first
                    if (turf.inRing(pt, polys[i][0])) {
                        var inHole = false;
                        var k = 1;
                        // check for the point in any of the holes
                        while (k < polys[i].length && !inHole) {
                            if (turf.inRing(pt, polys[i][k], true)) {
                                inHole = true;
                            }
                            k++;
                        }
                        if (!inHole) insidePoly = true;
                    }
                }
                return insidePoly;
            };

            // pt is [x,y] and ring is [[x,y], [x,y],..]
            turf.inRing = function(pt, ring, ignoreBoundary) {
                var isInside = false;
                if (ring[0][0] == ring[ring.length-1][0] && ring[0][1] == ring[ring.length-1][1]) ring = ring.slice(0, ring.length-1);

                for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
                    var xi = ring[i][0];
                    var yi = ring[i][1];
                    var xj = ring[j][0];
                    var yj = ring[j][1];
                    var onBoundary = (pt[1] * (xi - xj) + yi * (xj - pt[0]) + yj * (pt[0] - xi) == 0) &&
                        ((xi - pt[0]) * (xj - pt[0]) <= 0) && ((yi - pt[1]) * (yj - pt[1]) <= 0);
                    if (onBoundary) return !ignoreBoundary;
                    var intersect = ((yi > pt[1]) !== (yj > pt[1])) &&
                        (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi);
                    if (intersect) isInside = !isInside;
                }
                return isInside;
            };
        };

        Tin.setTurf = function(turf_) {
            turf = turf_;
        };

        Tin.prototype.setPoints = function(points) {
            this.points = points;
            this.tins = undefined;
        };

        Tin.prototype.setWh = function(wh) {
            this.wh = wh;
            this.tins = undefined;
        };

        Tin.prototype.calcurateStrictTin = function() {
            var self = this;
            this.tins.bakw = turf.featureCollection(this.tins.forw.features.map(function(tri) {
                return counterTri(tri);
            }));
            var searchIndex = {};
            this.tins.forw.features.map(function(forTri, index) {
                var bakTri = self.tins.bakw.features[index];
                insertSearchIndex(searchIndex, {forw: forTri, bakw: bakTri});
            });

            var overlapped = overlapCheck(searchIndex);

            if (overlapped.bakw) Object.keys(overlapped.bakw).map(function(key) {
                if (overlapped.bakw[key] == 'Not include case') return;
                var trises = searchIndex[key];
                var forUnion = turf.union(trises[0].forw, trises[1].forw);
                var forConvex = turf.convex(turf.featureCollection([trises[0].forw, trises[1].forw]));
                var forDiff = turf.difference(forConvex, forUnion);
                if (forDiff) return;
                var sharedVtx = key.split('-').map(function(val) {
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
                removeSearchIndex(searchIndex, trises[0], this.tins);
                removeSearchIndex(searchIndex, trises[1], this.tins);
                sharedVtx.map(function(sVtx) {
                    var newTriCoords = [sVtx.geom, nonSharedVtx[0].geom, nonSharedVtx[1].geom, sVtx.geom];
                    var cwCheck = isClockwise(newTriCoords);
                    if (cwCheck) newTriCoords = [sVtx.geom, nonSharedVtx[1].geom, nonSharedVtx[0].geom, sVtx.geom];
                    var newTriProp = !cwCheck ? {a: sVtx.prop, b: nonSharedVtx[0].prop, c: nonSharedVtx[1].prop} :
                        {a: sVtx.prop, b: nonSharedVtx[1].prop, c: nonSharedVtx[0].prop};
                    var newBakTri = turf.polygon([newTriCoords], newTriProp);
                    var newForTri = counterTri(newBakTri);
                    insertSearchIndex(searchIndex, {forw: newForTri, bakw: newBakTri}, this.tins);
                });
            });

            var bakCoords = this.tins.bakw.features.map(function(poly) { return poly.geometry.coordinates[0]; });
            var forCoords = this.tins.forw.features.map(function(poly) { return poly.geometry.coordinates[0]; });
            var bakXy = findIntersections(bakCoords);
            var forXy = findIntersections(forCoords);
            var bakXy2 = internal.dedupIntersections(bakXy).map(function(point) {
                return turf.point([point.x, point.y]);
            });
            var forXy2 = internal.dedupIntersections(forXy).map(function(point) {
                return turf.point([point.x, point.y]);
            });

            if (bakXy2.length == 0 && forXy2.length == 0) {
                this.strict_status = 'strict';
                delete this.kinks;
            } else {
                this.strict_status = 'strict_error';
                this.kinks = {};
                if (bakXy2.length > 0) this.kinks.bakw = turf.featureCollection(bakXy2);
                if (forXy2.length > 0) this.kinks.forw = turf.featureCollection(forXy2);
            }
        };

        Tin.prototype.updateTin = function(strict) {
            if (strict != 'strict' || strict != 'loose') strict = 'auto';
            var self = this;
            var bbox = [];
            if (this.wh) {
                bbox = [
                    [0, 0], [this.wh[0], 0],
                    [0, this.wh[1]], [this.wh[0], this.wh[1]]
                ];
            }
            var pointsArray = {forw: [], bakw: []};
            for (var i=0; i<this.points.length; i++) {
                var mapxy = this.points[i][0];
                var mercs = this.points[i][1];
                var forPoint = createPoint(mapxy, mercs, i);
                pointsArray.forw.push(forPoint);
                pointsArray.bakw.push(counterPoint(forPoint));
            }
            var pointsSet = {forw: turf.featureCollection(pointsArray.forw), bakw: turf.featureCollection(pointsArray.bakw)};

            // Forward TIN for calcurating Backward Centroid and Backward Vertices
            var tinForCentroid = turf.tin(pointsSet.forw, 'target');
            var tinBakCentroid = turf.tin(pointsSet.bakw, 'target');
            var forCentroidFt = turf.centroid(pointsSet.forw);

            // Calcurating Forward/Backward Centroid
            var centroid = {forw: forCentroidFt.geometry.coordinates};
            centroid.bakw = transformArr(forCentroidFt, tinForCentroid);
            this.centroid = {forw: createPoint(centroid.forw, centroid.bakw, 'cent')};
            this.centroid.bakw = counterPoint(this.centroid.forw);

            var forConvex = turf.convex(pointsSet.forw).geometry.coordinates[0];
            var bakConvex = turf.convex(pointsSet.bakw).geometry.coordinates[0];
            var convex1 = forConvex.map(function(forw) {return {forw: forw, bakw: transformArr(turf.point(forw), tinForCentroid)}; });
            var convex2 = bakConvex.map(function(bakw) {return {bakw: bakw, forw: transformArr(turf.point(bakw), tinBakCentroid)}; });
            var convexBuf = {};
            convex1.map(function(vertex) { convexBuf[vertex.forw[0] + ':' + vertex.forw[1]] = vertex; });
            convex2.map(function(vertex) { convexBuf[vertex.forw[0] + ':' + vertex.forw[1]] = vertex; });

            // Calcurating Convex full to get Convex full polygon's vertices
            var expandConvex = Object.keys(convexBuf).reduce(function(prev, key, index, array) {
                var forVertex = convexBuf[key].forw;
                var bakVertex = convexBuf[key].bakw;
                var vertexDelta = {forw: [forVertex[0] - centroid.forw[0], forVertex[1] - centroid.forw[1]]};
                vertexDelta.bakw = [bakVertex[0] - centroid.bakw[0], bakVertex[1] - centroid.bakw[1]];
                // var deltaDist = {forw: Math.sqrt(Math.pow(vertexDelta.forw[0], 2) + Math.pow(vertexDelta.forw[1], 2)),
                //     bakw: Math.sqrt(Math.pow(vertexDelta.bakw[0], 2) + Math.pow(vertexDelta.bakw[1], 2))};
                var xRate = vertexDelta.forw[0] == 0 ? Infinity :
                    ((vertexDelta.forw[0] < 0 ? 0 : self.wh[0]) - centroid.forw[0]) / vertexDelta.forw[0];
                var yRate = vertexDelta.forw[1] == 0 ? Infinity :
                    ((vertexDelta.forw[1] < 0 ? 0 : self.wh[1]) - centroid.forw[1]) / vertexDelta.forw[1];
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
                    }).length) ? prev : prev.reduce(function(pre, cur) {
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

            // Calcurating Backward Bounding box of map
            var verticesSet = orthant.map(function(delta, index) {
                var forVertex = bbox[index];
                var forDelta = [forVertex[0] - centroid.forw[0], forVertex[1] - centroid.forw[1]];
                var forDistance = Math.sqrt(Math.pow(forDelta[0], 2) + Math.pow(forDelta[1], 2));
                var bakDistance = forDistance / delta[0];

                var forTheta = Math.atan2(forDelta[0], forDelta[1]);
                var bakTheta = forTheta - delta[1];

                var bakVertex = [centroid.bakw[0] + bakDistance * Math.sin(bakTheta), centroid.bakw[1] - bakDistance * Math.cos(bakTheta)];

                return {forw: forVertex, bakw: bakVertex};
            });
            var swap = verticesSet[2];
            verticesSet[2] = verticesSet[3];
            verticesSet[3] = swap;

            var expandRate = [1, 1, 1, 1];
            for(var i = 0; i < 4; i++) {
                var j = (i + 1) % 4;
                var side = turf.lineString([verticesSet[i].bakw, verticesSet[j].bakw]);
                var expands = expandConvex[i];
                expands.map(function(expand) {
                    var expandLine = turf.lineString([centroid.bakw, expand.bakw]);
                    var intersect = turf.intersect(side, expandLine);
                    if (intersect) {
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
            })

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

            this.pointsSet = pointsSet;
            this.tins = {forw: turf.tin(pointsSet.forw, 'target')};
            if (strict == 'strict' || strict == 'auto') {
                this.calcurateStrictTin();
            }
            if (strict == 'loose' || (strict == 'auto' && this.strict_status == 'strict_error')) {
                this.tins.bakw = turf.tin(pointsSet.bakw, 'target');
                delete this.kinks;
                this.strict_status = 'loose';
            }

            this.vertices_params = {forw: vertexCalc(verticesList.forw, this.centroid.forw),
                bakw: vertexCalc(verticesList.bakw, this.centroid.bakw)};
        };

        Tin.prototype.transform = function(point, backward) {
            if (!this.tins) this.updateTin();
            var tpoint = turf.point(point);
            var tins = backward ? this.tins.bakw : this.tins.forw;
            var verticesParams = backward ? this.vertices_params.bakw : this.vertices_params.forw;
            var centroid = backward ? this.centroid.bakw : this.centroid.forw;
            return transformArr(tpoint, tins, verticesParams, centroid);
        };

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
                var tin = turf.tin(turf.featureCollection([centroid, itemi, itemj]), 'target');
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
                var minDel = Math.min(Math.abs(idel),Math.abs(jdel));
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

        function transformTin(of, tri) {
            return turf.point(transformTinArr(of, tri));
        }
        function transformTinArr(of, tri) {
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

            var od = [abv*abd[0]+acv*acd[0]+ad[0], abv*abd[1]+acv*acd[1]+ad[1]];
            return od;
        }

        function useVertices(o, verticesParams, centroid) {
            return turf.point(useVerticesArr(o, verticesParams, centroid));
        }
        function useVerticesArr(o, verticesParams, centroid) {
            var coord = o.geometry.coordinates;
            var centCoord = centroid.geometry.coordinates;
            var radian = Math.atan2(coord[0] - centCoord[0],coord[1] - centCoord[1]);
            var index = decideUseVertex(radian, verticesParams[0]);
            var tin = verticesParams[1][index];
            return transformTinArr(o, tin.features[0]);
        }

        function hit(point, tins) {
            for (var i=0; i< tins.features.length; i++) {
                var inside = turf.inside(point, tins.features[i]);
                if (inside) {
                    return tins.features[i];
                }
            }
        }

        function transform(point, tins, verticesParams, centroid) {
            return turf.point(transformArr(point, tins, verticesParams, centroid));
        }
        function transformArr(point, tins, verticesParams, centroid) {
            var tin = hit(point, tins);
            return tin ? transformTinArr(point, tin) : useVerticesArr(point, verticesParams, centroid);
        }

        function counterTri(tri) {
            var coordinates = ['a', 'b', 'c', 'a'].map(function(key) {
                return tri.properties[key].geom;
            });
            var cwCheck = isClockwise(coordinates);
            if (cwCheck) coordinates = ['a', 'c', 'b', 'a'].map(function(key) {
                return tri.properties[key].geom;
            });
            var geoms = tri.geometry.coordinates[0];
            var props = tri.properties;
            var properties = !cwCheck ? {
                a: {geom: geoms[0], index: props['a'].index},
                b: {geom: geoms[1], index: props['b'].index},
                c: {geom: geoms[2], index: props['c'].index}
            } : {
                a: {geom: geoms[0], index: props['a'].index},
                b: {geom: geoms[2], index: props['c'].index},
                c: {geom: geoms[1], index: props['b'].index}
            };
            return turf.polygon([coordinates], properties);
        }

        function overlapCheck(searchIndex) {
            return Object.keys(searchIndex).reduce(function(prev, key) {
                var searchResult = searchIndex[key];
                if (searchResult.length < 2) return prev;
                ['forw', 'bakw'].map(function(dir) {
                    var result = turf.intersect(searchResult[0][dir], searchResult[1][dir]);
                    if (!result || result.geometry.type == 'Point' || result.geometry.type == 'LineString') return;
                    if (!prev[dir]) prev[dir] = {};
                    try {
                        var diff1 = turf.difference(searchResult[0][dir], result);
                        var diff2 = turf.difference(searchResult[1][dir], result);
                        if (!diff1 || !diff2) {
                            prev[dir][key] = 'Include case';
                        } else {
                            prev[dir][key] = 'Not include case';
                        }
                    } catch(e) {
                        prev[dir][key] = 'Not include case';
                    }
                });
                return prev;
            }, {});
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
