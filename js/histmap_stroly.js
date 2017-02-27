define(['histmap_tin', 'aigle'], function(ol, Promise) {
    var nsResolver = function(prefix) {
        var ns = {
            'kml': 'http://earth.google.com/kml/2.1',
            'dcterms': 'http://purl.org/dc/terms/',
            'illustmap': 'http://illustmap.org/ns/2.0',
            'xml': 'http://www.w3.org/XML/1998/namespace'
        };
        return ns[prefix] || null;
    };

    var parseCoord = function(path, doc) {
        return document.evaluate('.//' + path + '/text()', doc, nsResolver, XPathResult.STRING_TYPE, null)
            .stringValue.split(',').map(function(val) {
                return parseFloat(val);
            });
    };

    ol.source.HistMap_stroly = function(optOptions) {
        var options = optOptions || {};

        ol.source.HistMap_tin.call(this, options);
    };
    ol.inherits(ol.source.HistMap_stroly, ol.source.HistMap_tin);

    ol.source.HistMap_stroly.createAsync = function(options) {
        var errNum = 0;
        var xhr = new XMLHttpRequest();
        var promises = ['cs', 'od'].map(function(sv) {
            var url = 'https://cors-anywhere.herokuapp.com/https://' + sv +'s3.illustmap.org/' + options.mapID + '.kml';
            return new Promise(function(resolve, reject) {
                xhr.open('GET', url, true);
                xhr.responseType = 'document';

                xhr.onload = function(e) {
                    if (this.status == 200) {
                        var doc = this.responseXML;
                        resolve([doc, sv]);
                    } else {
                        errNum++;
                        console.log('error');
                        if (errNum == 2) console.log('all error');
                    }
                };
                xhr.send();
            });
        });

        return Promise.race(promises).then(function(result) {
            var doc = result[0];
            var server = result[1];
            var coords = [];

            var node = document.evaluate('//kml:Folder[@type="illustmap"]',
                doc, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            var points = document.evaluate('.//kml:Placemark', node.singleNodeValue,
                nsResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            for (var i = 0; i < points.snapshotLength; i++) {
                var point = points.snapshotItem(i);
                var illsCoord = parseCoord('illustmap:xy', point);
                var mercCoord = parseCoord('illustmap:mercator_xy', point);
                coords.push([illsCoord, mercCoord]);
            }

            var wh = parseCoord('illustmap:wh', doc);
            options.width = wh[0];
            options.height = wh[1];
            var title = document.evaluate('//illustmap:title[@xml:lang="ja"]/text()',
                doc, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
            options.title = title;
            var museum = document.evaluate('//dcterms:contributor[@xml:lang="ja"]/text()',
                doc, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
            options.attributions = [
                new ol.Attribution({
                    html: title + ' - ' + museum
                })
            ];
            var sw = parseCoord('illustmap:sw', doc);
            var ne = parseCoord('illustmap:ne', doc);
            options.home_position = [(sw[0] + ne[0]) / 2, (sw[1] + ne[1]) / 2];

            options.url = options.url || '' + 'https://cors-anywhere.herokuapp.com/https://' +
                server + 's3.illustmap.org/tiles/' + options.mapID + '/' +
                options.mapID + '-{z}_{x}_{y}.jpg';
            options.thumbnail = 'https://cors-anywhere.herokuapp.com/https://' +
                server + 's3.illustmap.org/' +
                options.mapID + '_t.jpg';

            return coords;
        }).then(function(points) {
            return new Promise(function(resolve, reject) {
                var obj = new ol.source.HistMap_stroly(options);
                obj.finalizeCreateAsync_(points, resolve);
            });
        });
    };

    return ol;
});
