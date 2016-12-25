define(['histmap', 'tps'], function(ol, ThinPlateSpline) {
    ol.source.HistMap_tps = function(optOptions) {
        var options = optOptions || {};

        ol.source.HistMap.call(this, options);

        if (options.tps_points || options.tps_serial) {
            var tpsOption = {
                use_worker: true,
                transform_callback: options.transform_callback,
                error_callback: options.error_callback,
                web_fallback: options.web_fallback,
                on_solved: options.on_solved,
                on_serialized: options.on_serialized
            };

            this.tps = new ThinPlateSpline(tpsOption);
            if (options.tps_points) {
                this.tps.load_points(options.tps_points);
            } else {
                this.tps.load_serial(options.tps_serial);
            }
        }
    };
    ol.inherits(ol.source.HistMap_tps, ol.source.HistMap);

    ol.source.HistMap_tps.createAsync = function(options) {
        return new Promise(function(resolve, reject) {
            var obj;
            options.on_serialized = function() {
                if (options.tps_points) {
                    var a = document.createElement('a');
                    document.body.appendChild(a);
                    a.style = 'display: none';
                    var blob = new Blob([obj.tps.serialize()]);
                    var url = window.URL.createObjectURL(blob);
                    a.href = url;
                    a.download = options.tps_serial;
                    a.click();
                    window.URL.revokeObjectURL(url);
                }
                resolve(obj);
            };
            options.transform_callback = function(coord, isRev, tfOptions) {
                if (tfOptions.callback) {
                    tfOptions.callback(coord);
                }
            };
            obj = new ol.source.HistMap_tps(options);
        });
    };

    ol.source.HistMap_tps.prototype.xy2MercAsync_ = function(xy) {
        var self = this;
        return new Promise(function(resolve, reject) {
            var x = (xy[0] + ol.const.MERC_MAX) * self._maxxy / (2*ol.const.MERC_MAX);
            var y = (-xy[1] + ol.const.MERC_MAX) * self._maxxy / (2*ol.const.MERC_MAX);
            self.tps.transform([x, y], false, {
                callback: function(merc) {
                    resolve(merc);
                }
            });
        });
    };
    ol.source.HistMap_tps.prototype.merc2XyAsync_ = function(merc) {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.tps.transform(merc, true, {
                callback: function(xy) {
                    var x = xy[0] * (2*ol.const.MERC_MAX) / self._maxxy - ol.const.MERC_MAX;
                    var y = -1 * (xy[1] * (2*ol.const.MERC_MAX) / self._maxxy - ol.const.MERC_MAX);
                    resolve([x, y]);
                }
            });
        });
    };

    return ol;
});
