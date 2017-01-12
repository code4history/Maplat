(function(loader) {
    loader(function _commonDefine(turf) {
        var Tin = function(options) {
            this.points = options.points;
            this.wh = options.wh;
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
                    [0, 0], [this.wh[0] * 0.5, 0], [this.wh[0], 0],
                    [0, this.wh[1] * 0.5], [this.wh[0], this.wh[1] * 0.5],
                    [0, this.wh[1]], [this.wh[0] * 0.5, this.wh[1]], [this.wh[0], this.wh[1]]
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

            bbox.map(function(vertex) {
                var vertexFt = turf.point(vertex);
                var vertexMc = nearest7Arr(vertexFt, forPoints, 11);
                return [createPoint(vertex, vertexMc), createPoint(vertexMc, vertex)];
            }).map(function(vertex) {
                forPoints.features.push(vertex[0]);
                bakPoints.features.push(vertex[1]);
            });

            this.for_points = forPoints;
            this.bak_points = bakPoints;
            this.for_tins = turf.tin(forPoints, 'target');
            this.bak_tins = turf.tin(bakPoints, 'target');
        };

        Tin.prototype.transform = function(point, backward) {
            if (!this.bak_tins || !this.for_tins) this.updateTin();
            var tpoint = turf.point(point);
            var tins = backward ? this.bak_tins : this.for_tins;
            var points = backward ? this.bak_points : this.for_points;
            return transformArr(tpoint, tins, points);
        };

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

        function nearest7(o, points, number) {
            return turf.point(nearest7Arr(o, points, number));
        }
        function nearest7Arr(o, points, number) {
            var work = points;
            var nearests = [];
            if (!number) number = 7;
            for (var i=0; i<number; i++) {
                var nearest = turf.nearest(o, work);
                nearests.push(nearest);
                work = turf.featureCollection(work.features.filter(function(val) {
                    return val!=nearest;
                }));
                if (work.features.length == 0) break;
            }
            var nearestsFc = turf.featureCollection(nearests);

            var tin = turf.tin(nearestsFc, 'target');

            var od = tin.features.map(function(tri) {
                return transformTinArr(o, tri);
            }).reduce(function(prev, curr, index, arr) {
                return [prev[0]+curr[0], prev[1]+curr[1]].map(function(val) {
                    return index == arr.length - 1 ? val / arr.length : val;
                });
            }, [0, 0]);
            return od;
        }

        function hit(point, tins) {
            for (var i=0; i< tins.features.length; i++) {
                var inside = turf.inside(point, tins.features[i]);
                if (inside) {
                    return tins.features[i];
                }
            }
        }

        function transform(point, tins, forfallback) {
            return turf.point(transformArr(point, tins, forfallback));
        }
        function transformArr(point, tins, forfallback) {
            var tin = hit(point, tins);
            return tin ? transformTinArr(point, tin) : nearest7Arr(point, forfallback, 11);
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
