define(['histmap', 'tin', 'histmap_tin'], function(ol, Tin) {
    ol.source.HistMap_stroly = function(optOptions) {
        var options = optOptions || {};
        options.url = options.url || '' + 'https://cors-anywhere.herokuapp.com/https://' +
            options.stroly_server + 's3.illustmap.org/tiles/' + options.mapID + '/' +
            options.mapID + '-{z}_{x}_{y}.jpg';
        options.thumbnail = 'https://cors-anywhere.herokuapp.com/https://' +
            options.stroly_server + 's3.illustmap.org/' +
            options.mapID + '_t.jpg';
        var xhr = new XMLHttpRequest();
        xhr.open('GET', options.thumbnail, true);
        xhr.send();

        ol.source.HistMap_tin.call(this, options);
    };
    ol.inherits(ol.source.HistMap_stroly, ol.source.HistMap_tin);

    ol.source.HistMap_stroly.createAsync = function(options) {
        return new Promise(function(resolve, reject) {
            var obj;
            if (options.stroly_points) {
                obj = new ol.source.HistMap_stroly(options);
                obj.tin.setPoints(options.stroly_points);
                obj.tin.updateTin();
                resolve(obj);
            } else {
                var url = options.stroly_url;
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.responseType = 'json';

                xhr.onload = function(e) {
                    if (this.status == 200) {
                        var points = this.response;
                        obj.tin.setPoints(points);
                        obj.tin.updateTin();
                        resolve(obj);
                    } else {
                        // self.postMessage({'event':'cannotLoad'});
                    }
                };
                xhr.send();
                obj = new ol.source.HistMap_stroly(options);
            }
        });
    };
});
