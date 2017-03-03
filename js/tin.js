(function(loader) {
    loader(function _commonDefine(turf) {
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
            this.for_tins = undefined;
            this.bak_tins = undefined;
        };

        Tin.prototype.setWh = function(wh) {
            this.wh = wh;
            this.for_tins = undefined;
            this.bak_tins = undefined;
        };

        Tin.prototype.updateTin = function() {
            var bbox = [];
            var pointsSet = this.points;
            if (this.wh) {
                bbox = [
                    [0, 0], [this.wh[0], 0],
                    [0, this.wh[1]], [this.wh[0], this.wh[1]]
                ];
            }
            var forArr = [];
            var bakArr = [];
            for (var i=0; i<pointsSet.length; i++) {
                var mapxy = pointsSet[i][0];
                var mercs = pointsSet[i][1];
                forArr.push(createPoint(mapxy, mercs));
                bakArr.push(createPoint(mercs, mapxy));
            }
            var forPoints = turf.featureCollection(forArr);
            var bakPoints = turf.featureCollection(bakArr);

            var tinForCentroid = turf.tin(forPoints, 'target');
            var forCentroidFt = turf.centroid(forPoints);
            var forCentroid = forCentroidFt.geometry.coordinates;
            var bakCentroid = transformArr(forCentroidFt, tinForCentroid);
            this.for_centroid = createPoint(forCentroid, bakCentroid);
            this.bak_centroid = createPoint(bakCentroid, forCentroid);

            var convex = turf.convex(forPoints).geometry.coordinates[0];
            var orthant = convex.reduce(function(prev, forVertex, idx, array) {
                var bakVertex = transformArr(turf.point(forVertex), tinForCentroid);
                var forVertexDelta = [forVertex[0] - forCentroid[0], forVertex[1] - forCentroid[1]];
                var bakVertexDelta = [bakVertex[0] - bakCentroid[0], bakCentroid[1] - bakVertex[1]];

                if (forVertexDelta[0] == 0 || forVertexDelta[1] == 0) return prev;
                var index = 0;
                if (forVertexDelta[0] > 0) index += 1;
                if (forVertexDelta[1] > 0) index += 2;
                prev[index].push([forVertexDelta, bakVertexDelta]);
                if (idx == array.length -1) {
                    return (prev.length == prev.filter(function(val) {
                        return val.length > 0;
                    }).length) ? prev : prev.reduce(function(pre, cur) {
                            var ret = [pre[0].concat(cur)];
                            return ret;
                        }, [[]]);
                }
                return prev;
            }, [[], [], [], []]).map(function(item) {
                return item.reduce(function(prev, curr, index, arr) {
                    if (!prev) prev = [0, 0, 0];
                    var distanceSum = prev[0] + Math.sqrt(Math.pow(curr[0][0], 2) + Math.pow(curr[0][1], 2)) /
                        Math.sqrt(Math.pow(curr[1][0], 2) + Math.pow(curr[1][1], 2));
                    var thetaDelta = Math.atan2(curr[0][0], curr[0][1]) - Math.atan2(curr[1][0], curr[1][1]);
                    var sumThetaX = prev[1] + Math.cos(thetaDelta);
                    var sumThetaY = prev[2] + Math.sin(thetaDelta);
                    if (index == arr.length - 1) {
                        return [distanceSum / arr.length, Math.atan2(sumThetaY, sumThetaX)];
                    }
                    return [distanceSum, sumThetaX, sumThetaY];
                }, null);
            });
            if (orthant.length == 1) orthant = [orthant[0], orthant[0], orthant[0], orthant[0]];

            var verticesSet = orthant.map(function(delta, index) {
                var forVertex = bbox[index];
                var forDelta = [forVertex[0] - forCentroid[0], forVertex[1] - forCentroid[1]];
                var forDistance = Math.sqrt(Math.pow(forDelta[0], 2) + Math.pow(forDelta[1], 2));
                var bakDistance = forDistance / delta[0];

                var forTheta = Math.atan2(forDelta[0], forDelta[1]);
                var bakTheta = forTheta - delta[1];

                var bakVertex = [bakCentroid[0] + bakDistance * Math.sin(bakTheta), bakCentroid[1] - bakDistance * Math.cos(bakTheta)];

                return [forVertex, bakVertex];
            });
            var swap = verticesSet[2];
            verticesSet[2] = verticesSet[3];
            verticesSet[3] = swap;

            var forVerticesList = [];
            var bakVerticesList = [];

            for (var i = 0; i < verticesSet.length; i++ ) {
                var n = (i + 1) % verticesSet.length;
                var forVertex = verticesSet[i][0];
                var bakVertex = verticesSet[i][1];
                var forBound = [(forVertex[0] + verticesSet[n][0][0]) / 2, (forVertex[1] + verticesSet[n][0][1]) / 2];
                var bakBound = [(bakVertex[0] + verticesSet[n][1][0]) / 2, (bakVertex[1] + verticesSet[n][1][1]) / 2];
                forPoints.features.push(createPoint(forVertex, bakVertex));
                bakPoints.features.push(createPoint(bakVertex, forVertex));
                forVerticesList.push(createPoint(forVertex, bakVertex));
                bakVerticesList.push(createPoint(bakVertex, forVertex));
                forPoints.features.push(createPoint(forBound, bakBound));
                bakPoints.features.push(createPoint(bakBound, forBound));
            }

            this.for_points = forPoints;
            this.bak_points = bakPoints;
            this.for_tins = turf.tin(forPoints, 'target');
            this.bak_tins = turf.tin(bakPoints, 'target');

            var forVertexCalc = vertexCalc(forVerticesList, this.for_centroid);
            this.for_vertices_params = forVertexCalc;
            var bakVertexCalc = vertexCalc(bakVerticesList, this.bak_centroid);
            this.bak_vertices_params = bakVertexCalc;
        };

        Tin.prototype.transform = function(point, backward) {
            if (!this.bak_tins || !this.for_tins) this.updateTin();
            var tpoint = turf.point(point);
            var tins = backward ? this.bak_tins : this.for_tins;
            var verticesParams = backward ? this.bak_vertices_params : this.for_vertices_params;
            var centroid = backward ? this.bak_centroid : this.for_centroid;
            return transformArr(tpoint, tins, verticesParams, centroid);
        };

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

        function createPoint(xy, target) {
            return turf.point(xy, {target: target});
        }

        function transformTin(of, tri) {
            return turf.point(transformTinArr(of, tri));
        }
        function transformTinArr(of, tri) {
            var a = tri.geometry.coordinates[0][0];
            var b = tri.geometry.coordinates[0][1];
            var c = tri.geometry.coordinates[0][2];
            var o = of.geometry.coordinates;
            var ad = tri.properties.a;
            var bd = tri.properties.b;
            var cd = tri.properties.c;

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

        return Tin;
    });
})(
// Already defined turf
    'function' === typeof turf
    ? function _loaderForReady(commonDefine) {
        this.Tin = commonDefine(this.turf);
    }
// AMD RequireJS
    : 'function' === typeof define && define.amd
        ? function _loaderForRequirejs(commonDefine) {
            define(['turf'], function(turf) {
                return commonDefine(turf);
            });
        }
// CommonJS NodeJS
        : 'undefined' !== typeof module && module.exports &&
            'function' === typeof require
            ? function _loaderForCommonjs(commonDefine) {
                var turf;
                try {
                    turf = require('turf');
                } catch (e) {}
                module.exports = commonDefine(turf);
            }
// this === window
            : function _loaderForWindow(commonDefine) {
                if (! this.turf )
                    throw new Error('"turf" not found');

                this.Tin = commonDefine(this.turf);
            }
);
