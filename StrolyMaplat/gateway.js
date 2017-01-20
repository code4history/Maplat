'use strict';
var request = require('request');
var xpath = require('xpath');
var Dom = require('xmldom').DOMParser;
var AWS = require('aws-sdk');
var select = xpath.useNamespaces({
    'kml': 'http://earth.google.com/kml/2.1',
    'dcterms': 'http://purl.org/dc/terms/',
    'illustmap': 'http://illustmap.org/ns/2.0',
    'xml': 'http://www.w3.org/XML/1998/namespace'
});
var gm = require('gm').subClass({imageMagick: true});
var warperpass = require('./warperpass.json');
var dynamodb = null;
var trans = gm('data:image/png;base64,'+
    'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAMAAABrrFhUAAAAB3RJTUUH3QgIBToaSbAjlwAAABd0'+
    'RVh0U29mdHdhcmUAR0xEUE5HIHZlciAzLjRxhaThAAAACHRwTkdHTEQzAAAAAEqAKR8AAAAEZ0FN'+
    'QQAAsY8L/GEFAAAAA1BMVEX///+nxBvIAAAAAXRSTlMAQObYZgAAAFRJREFUeNrtwQEBAAAAgJD+'+
    'r+4ICgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'+
    'AAAAAAAAAAAAABgBDwABHHIJwwAAAABJRU5ErkJggg==');

var setDynamoClient = function(event) {
    if ('isOffline' in event && event.isOffline) {
        dynamodb = new AWS.DynamoDB.DocumentClient({
            region: 'localhost',
            endpoint: 'http://localhost:8000'
        });
    } else {
        dynamodb = new AWS.DynamoDB.DocumentClient();
    }
};

var parseCoord = function(pathString, target) {
    return select('.//' + pathString + '/text()', target).toString()
        .split(',').map(function(val) {
            return parseFloat(val);
        });
};

var getDataItem = function(maptype, mapid, callback) {
    var dbmapid = maptype + ':' + mapid;
    var params = {
        TableName: 'gw_data',
        Key: {
            mapid: dbmapid
        }
    };
    dynamodb.get(params, function(err, dbres) {
        if (err) callback('Err');
        if (!('Item' in dbres)) {
            var urlAccessFunc = urlAccess[maptype];
            urlAccessFunc(mapid).then(function(content) {
                if (content == 'Err') {
                    callback('Err');
                } else {
                    var epoch = content.epoch;
                    var analyzeDataFunc = analyzeData[maptype];
                    var result = analyzeDataFunc(mapid, content);

                    var putParams = {
                        TableName: 'gw_data',
                        Item: {
                            mapid: dbmapid,
                            epoch: epoch,
                            content: content,
                            object: result
                        }
                    };
                    dynamodb.put(putParams, function(err) {
                        if (err) console.log(err);
                    });
                    callback(result);
                }
            });
        } else {
            callback(dbres.Item.object);
        }
    });
};

var urlAccess = {};

var analyzeData = {};

urlAccess.stroly = function(mapid) {
    var errNum = 0;
    var promises = ['cs', 'od'].map(function(sv) {
        var url = 'https://' + sv +'s3.illustmap.org/' + mapid + '.kml';
        return new Promise(function(resolve, reject) {
            var reqOpt = {
                url: url,
                method: 'GET'
            };
            request(reqOpt, function(err, resp, body) {
                if (err || body.match(/<Message>Access Denied/)) {
                    errNum++;
                    if (errNum == 2) resolve('Err');
                    return;
                }
                var epoch = new Date(resp.headers['last-modified']).getTime() / 1000;
                resolve({
                    server: sv,
                    epoch: epoch,
                    body: body
                });
            });
        });
    });

    return Promise.race(promises);
};

urlAccess.warper = function(mapid) {
    return new Promise(function(resolve, reject) {
        var reqOpt = {
            url: 'http://mapwarper.net/session?email=' + warperpass.email + '&password=' + warperpass.password + '&commit=Log in',
            method: 'POST',
            jar: true,
            followAllRedirects: true,
        };
        request(reqOpt, function(err, resp, body) {
            if (err) {
                resolve('Err');
                return;
            }
            var reqOpt = {
                url: 'http://mapwarper.net/maps/warp/' + mapid,
                method: 'GET',
                jar: true
            }
            request(reqOpt, function(err, resp, body) {
                if (err) resolve('Err');
                else {
                    resolve({
                        body: body
                    });
                }
            });
        });
    });
};

analyzeData.stroly = function(mapid, value) {
    var content = value.body;
    var server = value.server;
    var result = {
        coords: [],
        maptype: 'stroly',
        mapid: mapid,
        server: server
    };
    var doc = new Dom().parseFromString(content);
    var nodes = select('//kml:Folder[@type="illustmap"]', doc);
    var points = select('./kml:Placemark', nodes[0]);
    for (var i = 0; i < points.length; i++) {
        var point = points[i];
        var illsCoord = parseCoord('illustmap:xy', point);
        var mercCoord = parseCoord('illustmap:mercator_xy', point);
        result.coords.push([illsCoord, mercCoord]);
    }
    var wh = parseCoord('illustmap:wh', doc);
    result.width = wh[0];
    result.height = wh[1];
    result.maxZoom = Math.ceil(Math.log(Math.max(result.width, result.height) / 256) / Math.log(2));
    result.title = select('//illustmap:title[@xml:lang="ja"]/text()', doc).toString();
    var museum = select('//dcterms:contributor[@xml:lang="ja"]/text()', doc).toString();
    result.attr = result.title + ' - ' + museum;
    // var sw = parseCoord('illustmap:sw', doc);
    // var ne = parseCoord('illustmap:ne', doc);
    // body.home_position = [ (sw[0] + ne[0]) / 2, (sw[1] + ne[1]) / 2 ];

    return result;
};

analyzeData.warper = function(mapid, value) {
    var content = value.body;
    var result = {
        coords: [],
        maptype: 'warper',
        mapid: mapid
    };
    /* var doc = new Dom().parseFromString(content);
    var nodes = select('//script[@type="text/javascript"]', doc);
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        console.log(node.toString());
    }*/
    var res = content.match(/var image_width = ([0-9]+)/m);
    result.width = parseInt(res[1]);
    res = content.match(/var image_height = ([0-9]+)/m);
    result.height = parseInt(res[1]);
    result.maxZoom = Math.ceil(Math.log(Math.max(result.width, result.height) / 256) / Math.log(2));
    var re = /populate_gcps\(\s*[0-9]+[,\s]+([\-0-9\.]+)[,\s]+([\-0-9\.]+)[,\s]+([\-0-9\.]+)[,\s]+([\-0-9\.]+)[,\s]+[\-0-9\.]+\);/gm;
    var re2 = /populate_gcps\(\s*[0-9]+[,\s]+([\-0-9\.]+)[,\s]+([\-0-9\.]+)[,\s]+([\-0-9\.]+)[,\s]+([\-0-9\.]+)[,\s]+[\-0-9\.]+\);/;
    res = content.match(re);
    for (var i = 0; i < res.length; i++) {
        var line = res[i];
        var match = line.match(re2);
        console.log(match);
        result.coords.push([[parseFloat(match[1]), parseFloat(match[2])],
            [parseFloat(match[3]) * 6378137 * Math.PI / 180,
                6378137 * Math.log(Math.tan(Math.PI / 360 * (90 + parseFloat(match[4]))))]]);
    }
    res = content.match(/var\s+title\s+=\s+'(.+)';/m);
    result.title = result.attr = decodeURIComponent(res[1]);
    // populate_gcps(173950, 1548.5939947773, 204.0613577033, -71.2425076933, 42.3684689865, 10.31041522918661);

    return result;
};

module.exports.strolydata = function(event, context, callback) {
    var mapid = event.pathParameters.mapid;
    setDynamoClient(event);
    getDataItem('stroly', mapid, function(content) {
        var err = content =='Err';
        var stat = err ? 404 : 200;
        var body = err ? 'Kml not found' : content;
        callback(null, {
            statusCode: stat,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body)
        });
    });
};

module.exports.strolyimage= function(event, context, callback) {
    var mapid = event.pathParameters.mapid;
    var zoom = parseInt(event.pathParameters.zoom);
    var x = parseInt(event.pathParameters.x);
    var y = parseInt(event.pathParameters.y);
    setDynamoClient(event);
    getDataItem('stroly', mapid, function(content) {
        var width = parseInt(content.width);
        var height = parseInt(content.height);
        var maxZoom = parseInt(content.maxZoom);
        var needTransCover = ((x+1) * Math.pow(2, maxZoom - zoom) * 256 > width || (y+1) * Math.pow(2, maxZoom - zoom) * 256 > height);
        var err = content == 'Err';
        if (err) {
            callback(null, {
                statusCode: 404,
                headers: {'Content-Type': 'application/json'},
                body: 'Image not found'
            });
        } else {
            var url = 'https://' + content.server + 's3.illustmap.org/tiles/' + mapid + '/' + mapid + '-' + zoom +
                '_' + x + '_' + y + '.jpg';
            var reqOpt = {
                url: url,
                method: 'GET',
                encoding: null
            };
            request(reqOpt, function(err, resp, body) {
                var ctype = resp.headers['content-type'];
                new Promise(function(resolve, reject) {
                    if (needTransCover) {
                        gm(body).background('transparent').extent(256, 256)
                            .toBuffer('PNG', function(err, buffer) {
                                ctype = 'image/png';
                                resolve(buffer.toString('base64'));
                            });
                    } else {
                        resolve(body.toString('base64'));
                    }
                }).then(function(base64) {
                    if (err || base64.match(/^PD94bWwgdmVyc2lvb/)) {
                        callback(null, {
                            statusCode: 404,
                            headers: {'Content-Type': 'application/json'},
                            body: 'Image not found'
                        });
                        return;
                    }
                    callback(null, {
                        statusCode: 200,
                        headers: {'Content-Type': 'application/json'},
                        body: 'data:' + ctype + ';base64,' + base64
                    });
                });
            });
        }
    });
};

module.exports.warperdata = function(event, context, callback) {
    var mapid = event.pathParameters.mapid;
    setDynamoClient(event);
    getDataItem('warper', mapid, function(content) {
        var err = content =='Err';
        var stat = err ? 404 : 200;
        var body = err ? 'Url not found' : content;
        callback(null, {
            statusCode: stat,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body)
        });
    });
};

module.exports.warperimage= function(event, context, callback) {
    var mapid = event.pathParameters.mapid;
    var zoom = parseInt(event.pathParameters.zoom);
    var x = parseInt(event.pathParameters.x);
    var y = parseInt(event.pathParameters.y);
    setDynamoClient(event);
    getDataItem('warper', mapid, function(content) {
        var height = parseInt(content.height);
        var maxZoom = parseInt(content.maxZoom);
        var err = content == 'Err';
        if (err) {
            callback(null, {
                statusCode: 404,
                headers: {'Content-Type': 'application/json'},
                body: 'Image not found'
            });
        } else {
            var xMin = x * 256 * Math.pow(2, maxZoom - zoom);
            var xMax = xMin + 256 * Math.pow(2, maxZoom - zoom);
            var yMax = height - y * 256 * Math.pow(2, maxZoom - zoom);
            var yMin = yMax - 256 * Math.pow(2, maxZoom - zoom);
            var url = 'http://mapwarper.net/maps/wms/' + mapid + '?FORMAT=image%2Fpng&STATUS=unwarped&' +
                'SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&EXCEPTIONS=application%2Fvnd.ogc.se_inimage&' +
                'SRS=EPSG%3A4326&BBOX=' + xMin + ',' + yMin + ',' + xMax + ',' + yMax + '&WIDTH=256&HEIGHT=256';
            var reqOpt = {
                url: url,
                method: 'GET',
                encoding: null
            };
            request(reqOpt, function(err, resp, body) {
                var ctype = resp.headers['content-type'];
                if (err) {
                    callback(null, {
                        statusCode: 404,
                        headers: {'Content-Type': 'application/json'},
                        body: 'Image not found'
                    });
                    return;
                }
                var base64 = body.toString('base64');
                callback(null, {
                    statusCode: 200,
                    headers: {'Content-Type': 'application/json'},
                    body: 'data:' + ctype + ';base64,' + base64
                });
            });
        }
    });
};