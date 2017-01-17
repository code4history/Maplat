define(['histmap_tin'], function(ol) {
    ol.source.HistMap_drumsey = function(optOptions) {
        var options = optOptions || {};

        ol.source.HistMap_tin.call(this, options);
    };
    ol.inherits(ol.source.HistMap_drumsey, ol.source.HistMap_tin);

    ol.source.HistMap_drumsey.createAsync = function(options) {
        var xhr = new XMLHttpRequest();
        return new Promise(function(resolve, reject) {
            var url = 'https://cors-anywhere.herokuapp.com/http://rumsey.georeferencer.com/map/' + options.mapID + '/';
            xhr.open('GET', url, true);
            xhr.responseType = 'document';

            xhr.onload = function(e) {
                if (this.status == 200) {
                    var doc = this.responseXML;
                    resolve(doc);
                } else {
                    console.log('error');
                }
            };
            xhr.send();
        }).then(function(doc) {
            var accPage = document.evaluate('//a[text()="Accuracy"]/@href',
                doc, null, XPathResult.STRING_TYPE, null).stringValue;

            var url = 'https://cors-anywhere.herokuapp.com/http://rumsey.georeferencer.com' + accPage;
            return new Promise(function(resolve, reject) {
                xhr.open('GET', url, true);
                xhr.responseType = 'document';

                xhr.onload = function(e) {
                    if (this.status == 200) {
                        var doc = this.responseXML;
                        resolve(doc);
                    } else {
                        console.log('error');
                    }
                };
                xhr.send();
            });
        }).then(function(doc) {
            var coords = [];
            var scripts = document.evaluate('//script[@type="text/javascript" and @charset="utf-8"]', doc,
                null, XPathResult.STRING_TYPE, null).stringValue;
            eval(scripts);
            var points = georef.control_points;
            for (var i = 0; i < points.length; i++) {
                var point = points[i];
                var illsCoord = [point.pixel_x, point.pixel_y];
                var mercCoord = ol.proj.fromLonLat([point.longitude,point.latitude]);
                coords.push([illsCoord, mercCoord]);
            }
            options.width = georef.pyramid.width;
            options.height = georef.pyramid.height;
            options.title = georef.title;
            options.attributions = [
                new ol.Attribution({
                    html: ATTRIBUTION
                })
            ];
            options.home_position = georef.center;

            options.url = options.url || '' + 'https://cors-anywhere.herokuapp.com/https://' +
                's3.illustmap.org/tiles/' + options.mapID + '/' +
                options.mapID + '-{z}_{x}_{y}.jpg';
            options.thumbnail = 'https://cors-anywhere.herokuapp.com/' + georef.thumbnail_url + '=s50';

            return coords;
        }).then(function(points) {
            var obj = new ol.source.HistMap_drumsey(options);
            obj.tin.setPoints(points);
            obj.tin.updateTin();
            return obj;
        });
    };

    return ol;
});
