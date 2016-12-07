define(["histmap", "turf"], function(ol, turf) {
    ol.source.histMap_tin = function (opt_options) {
        var options = opt_options || {};

        ol.source.histMap.call(this, options);
    };
    ol.inherits(ol.source.histMap_tin, ol.source.histMap);

    ol.source.histMap_tin.createAsync = function(options) {
        var promise = new Promise(function(resolve, reject) {
            var obj;
            var url = options.tin_points_url;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'json';

            xhr.onload = function(e) {
                if (this.status == 200) {
                    var points = JSON.parse(this.response);
                    obj.setTinPoints(points);
                    resolve(obj);
                } else {
                    //self.postMessage({'event':'cannotLoad'});
                }
            };
            xhr.send();
            obj = new ol.source.histMap_tin(options);
        });
        return promise;
    };

    ol.source.histMap_tin.prototype.xy2MercAsync_ = function(xy) {
        var self = this;
        var promise = new Promise(function(resolve, reject) {
            var x = (xy[0]  + ol.const.MERC_MAX) * self._maxxy / (2*ol.const.MERC_MAX);
            var y = (-xy[1] + ol.const.MERC_MAX) * self._maxxy / (2*ol.const.MERC_MAX);
            var merc = transform_arr(turf.point([x,y]), this.for_tins, this.for_points);
            resolve(merc);
        });
        return promise;
    };
    ol.source.histMap_tin.prototype.merc2XyAsync_ = function(merc) {
        var self = this;
        var promise = new Promise(function(resolve, reject) {
            var xy = transform_arr(turf.point(merc), this.bak_tins, this.bak_points);
            var x =       xy[0] * (2*ol.const.MERC_MAX) / self._maxxy - ol.const.MERC_MAX;
            var y = -1 * (xy[1] * (2*ol.const.MERC_MAX) / self._maxxy - ol.const.MERC_MAX);
            resolve([x,y]);
        });
        return promise;
    };
    ol.source.histMap_tin.prototype.setTinPoints = function(points_set) {
        var bbox = [
            [0,0],
            [this.width,0],
            [this.width,this.height],
            [0,this.height]
        ];
        var for_arr = [];
        var bak_arr = [];
        for (var i=0; i<points_set.length; i++) {
            var mapxy = points_set[i][0];
            var mercs = points_set[i][1];
            for_arr.push(createPoint(mapxy,mercs));
            bak_arr.push(createPoint(mercs,mapxy));
        }
        var for_points = turf.featureCollection(for_arr);
        var bak_points = turf.featureCollection(bak_arr);

        bbox.map(function(vertex){
            var vertex_ft = turf.point(vertex);
            var vertex_mc = nearest7_arr(vertex_ft,for_points);
            return [createPoint(vertex,vertex_mc),createPoint(vertex_mc,vertex)];
        }).map(function(vertex){
            for_points.features.push(vertex[0]);
            bak_points.features.push(vertex[1]);
        });

        this.for_points = for_points;
        this.bak_points = bak_points;
        this.for_tins   = turf.tin(for_points, 'target');
        this.bak_tins   = turf.tin(bak_points, 'target');
    };

    function createPoint(xy,target) {
        return turf.point(xy,{'target':target});
    }

    function transform_tin (of, tri) {
        return turf.point(transform_tin_arr(of, tri));
    }
    function transform_tin_arr (of, tri) {
        var a  = tri.geometry.coordinates[0][0];
        var b  = tri.geometry.coordinates[0][1];
        var c  = tri.geometry.coordinates[0][2];
        var o  = of.geometry.coordinates;
        var ad = tri.properties.a;
        var bd = tri.properties.b;
        var cd = tri.properties.c;

        var ab  = [ b[0] -a[0], b[1] -a[1]];
        var ac  = [ c[0] -a[0], c[1] -a[1]];
        var ao  = [ o[0] -a[0], o[1] -a[1]];
        var abd = [bd[0]-ad[0],bd[1]-ad[1]];
        var acd = [cd[0]-ad[0],cd[1]-ad[1]];

        var abv = (ac[1]*ao[0]-ac[0]*ao[1])/(ab[0]*ac[1]-ab[1]*ac[0]);
        var acv = (ab[0]*ao[1]-ab[1]*ao[0])/(ab[0]*ac[1]-ab[1]*ac[0]);
        var od  = [abv*abd[0]+acv*acd[0]+ad[0],abv*abd[1]+acv*acd[1]+ad[1]];
        return od;
    }

    function nearest7 (o,points,number) {
        return turf.point(nearest7_arr(o,points,number));
    }
    function nearest7_arr (o,points,number) {
        var work = points;
        var nearests = [];
        if (!number) number = 7;
        for (var i=0;i<number;i++) {
            var nearest = turf.nearest(o, work);
            nearests.push(nearest);
            work = turf.featureCollection(work.features.filter(function(val){return val!=nearest}));
        }
        var nearests_fc = turf.featureCollection(nearests);

        var tin = turf.tin(nearests_fc,"target");

        var od = tin.features.map(function(tri){
            return transform_tin_arr (o, tri);
        }).reduce(function(prev,curr,index,arr){
            var ret = [prev[0]+curr[0],prev[1]+curr[1]].map(function(val){
                return index == arr.length - 1 ? val / arr.length : val;
            });
            return ret;
        },[0,0]);
        return od;
    }

    function hit(point,tins) {
        for (var i=0; i< tins.features.length;i++) {
            var inside = turf.inside(point, tins.features[i]);
            if (inside) {
                return tins.features[i];
            }
        }
    }

    function transform(point, tins, forfallback) {
        return turf.point(transform_arr(point, tins, forfallback));
    }
    function transform_arr(point, tins, forfallback) {
        var tin = hit(point, tins);
        return tin ? transform_tin_arr(point,tin) : nearest7_arr(point,forfallback);
    }
});