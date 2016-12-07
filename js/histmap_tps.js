define(["histmap", "tps"], function(ol, ThinPlateSpline) {
    ol.source.histMap_tps = function(opt_options) {
        var options = opt_options || {};

        ol.source.histMap.call(this, options) ;

        if (options.tps_points || options.tps_serial) {
            var tps_option = {
                'use_worker' : true,
                'transform_callback' : options.transform_callback,
                'error_callback' : options.error_callback,
                'web_fallback' : options.web_fallback,
                'on_solved' : options.on_solved,
                'on_serialized' : options.on_serialized
            };

            this.tps = new ThinPlateSpline(tps_option);
            if (options.tps_points) {
                this.tps.load_points(options.tps_points);
            } else {
                this.tps.load_serial(options.tps_serial);
            }
        }
    };
    ol.inherits(ol.source.histMap_tps, ol.source.histMap);

    ol.source.histMap_tps.createAsync = function(options) {
        var promise = new Promise(function(resolve, reject) {
            var obj;
            options.on_serialized = function() {
                if (options.tps_points) {
                    var a = document.createElement("a");
                    document.body.appendChild(a);
                    a.style = "display: none";
                    var blob = new Blob([ obj.tps.serialize() ]),
                        url = window.URL.createObjectURL(blob);
                    a.href = url;
                    a.download = options.tps_serial;
                    a.click();
                    window.URL.revokeObjectURL(url);
                }
                resolve(obj);
            };
            options.transform_callback = function(coord, isRev, tf_options) {
                if (tf_options.callback) {
                    tf_options.callback(coord);
                }
            };
            obj = new ol.source.histMap_tps(options);
        });
        return promise;
    };

    ol.source.histMap_tps.prototype.xy2MercAsync_ = function(xy) {
        var self = this;
        var promise = new Promise(function(resolve, reject) {
            var x = (xy[0]  + ol.const.MERC_MAX) * self._maxxy / (2*ol.const.MERC_MAX);
            var y = (-xy[1] + ol.const.MERC_MAX) * self._maxxy / (2*ol.const.MERC_MAX);
            self.tps.transform([x,y], false, {
                callback: function(merc) {
                    resolve(merc);
                }
            });
        });
        return promise;
    };
    ol.source.histMap_tps.prototype.merc2XyAsync_ = function(merc) {
        var self = this;
        var promise = new Promise(function(resolve, reject) {
            self.tps.transform(merc, true, {
                callback: function(xy) {
                    var x =       xy[0] * (2*ol.const.MERC_MAX) / self._maxxy - ol.const.MERC_MAX;
                    var y = -1 * (xy[1] * (2*ol.const.MERC_MAX) / self._maxxy - ol.const.MERC_MAX);
                    resolve([x,y]);
                }
            });
        });
        return promise;
    };

    return ol;
});