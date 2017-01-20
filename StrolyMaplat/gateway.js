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


