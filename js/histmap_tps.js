define(['histmap', 'tps', 'aigle'], function(ol, ThinPlateSpline, Promise) {
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
        var metaUrl = options.setting_file || 'json/' + options.mapID + '.json';
        options.tps_serial = options.tps_serial || '../bin/' + options.mapID + '.bin';

        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', metaUrl, true);
            xhr.responseType = 'json';

            xhr.onload = function(e) {
                if (this.status == 200) {
                    var resp = this.response;
                    options.title = options.title || resp.title;
                    options.width = options.width || resp.width;
                    options.height = options.height || resp.height;
                    options.label = options.label || resp.label || resp.year;
                    options.attr = options.attr || resp.attr;
                    if (options.attr && !options.attributions) {
                        options.attributions = [
                            new ol.Attribution({
                                html: options.attr
                            })
                        ];
                    }
                    resolve(options);
                } else {
                    // self.postMessage({'event':'cannotLoad'});
                }
            };
            xhr.send();
        }).then(function(options) {
            return new Promise(function(resolve, reject) {
                var obj;
                options.on_serialized = function() {
                    resolve(obj);
                };
                options.transform_callback = function(coord, isRev, tfOptions) {
                    if (tfOptions.callback) {
                        tfOptions.callback(coord);
                    }
                };
                obj = new ol.source.HistMap_tps(options);
            });
        });
    };

    ol.source.HistMap_tps.prototype.xy2MercAsync_ = function(xy) {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.tps.transform(xy, false, {
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
                    resolve(xy);
                }
            });
        });
    };

    return ol;
});
