'use strict';
var path = require('path');
var settings = require('./settings');
var fs = require('fs-extra');
var fileUrl = require('file-url');
var electron = require('electron');
var BrowserWindow = electron.BrowserWindow;
var turf = require('@turf/turf');
var Tin = require('../common/js/tin');
var wkt = require('wellknown');
var isClockwise = turf.booleanClockwise;
const {ipcMain} = require('electron');
var internal = require('mapshaper').internal;

settings.init();

var mapFolder;
var tileFolder;
var focused;
var tinObject;

var mapedit = {
    init: function() {
        var saveFolder = settings.getSetting('saveFolder');
        mapFolder = saveFolder + path.sep + 'maps';
        fs.ensureDir(mapFolder, function(err) {});
        tileFolder = saveFolder + path.sep + 'tiles';
        fs.ensureDir(tileFolder, function(err) {});
        focused = BrowserWindow.getFocusedWindow();
        var self = this;
        ipcMain.on('updateTin', function(event, arg) {
            self.updateTin(arg);
        });
        tinObject = new Tin({});
    },
    request: function(mapID) {
        var self = this;
        var mapFile = mapFolder + path.sep + mapID + '.json';

        fs.readFile(mapFile, 'utf8', function(err, data) {
            if (err) throw err;
            var json = JSON.parse(data);
            if (!json.width || !json.height) {
                focused.webContents.send('mapData', json);
                return;
            }
            var thumbFolder = tileFolder + path.sep + mapID + path.sep + '0' + path.sep + '0';
            fs.readdir(thumbFolder, function(err, thumbs) {
                if (!thumbs) {
                    focused.webContents.send('mapData', json);
                    return;
                }
                for (var i=0; i<thumbs.length; i++) {
                    var thumb = thumbs[i];
                    if (/^0\.(?:jpg|jpeg|png)$/.test(thumb)) {
                        var thumbURL = fileUrl(thumbFolder + path.sep + thumb);
                        thumbURL = thumbURL.replace(/\/0\/0\/0\./, '/{z}/{x}/{y}.');
                        json.url = thumbURL;
                        self.setWh([json.width, json.height]);
                        focused.webContents.send('mapData', json);
                    }
                }
            });
        });
    },
    setWh: function(wh) {
        tinObject.setWh(wh);
    },
    save: function(mapObject) {
        var status = mapObject.status;
        var mapID = mapObject.mapID;
        var url = mapObject.url;
        delete mapObject.status;
        delete mapObject.mapID;
        delete mapObject.url;
        var content = JSON.stringify(mapObject, null, '  ');
        var mapFile = mapFolder + path.sep + mapID + '.json';
        Promise.all([
            new Promise(function(resolve, reject) {
                if (status != 'Update') {
                    try {
                        fs.statSync(mapFile);
                        reject('Exist');
                        return;
                    } catch(err) {
                    }
                    if (status.match(/^(Change|Copy):(.+)$/)) {
                        var isCopy = RegExp.$1 == 'Copy';
                        var oldMapID = RegExp.$2;
                        var oldMapFile = mapFolder + path.sep + oldMapID + '.json';
                        var oldTile = tileFolder + path.sep + oldMapID;
                        var newTile = tileFolder + path.sep + mapID;
                        fs.writeFile(mapFile, content, function(err) {
                            if (err) {
                                reject('Error');
                                return;
                            }
                            Promise.all([
                                new Promise(function(resolve_, reject_) {
                                    if (isCopy) {
                                        resolve_();
                                    } else {
                                        fs.unlink(oldMapFile, function (err) {
                                            if (err) reject_(err);
                                            resolve_();
                                        });
                                    }
                                }),
                                new Promise(function(resolve_, reject_) {
                                    var process = isCopy ? fs.copy : fs.rename;
                                    process(oldTile, newTile, function(err) {
                                        if (err) reject_(err);
                                        resolve_();
                                    });
                                })
                            ]).then(function() {
                                resolve('Success');
                            }).catch(function(e) {
                                reject('Error');
                            });
                        });
                        return;
                    } else {
                        fs.writeFile(mapFile, content, function(err) {
                            if (err) {
                                reject('Error');
                                return;
                            } else {
                                resolve('Success');
                            }
                        });
                    }
                } else {
                    fs.writeFile(mapFile, content, function(err) {
                        if (err) reject('Error');
                        else resolve('Success');
                    });
                }
            }),
            new Promise(function(resolve, reject) {
                var tmpFolder = settings.getSetting('tmpFolder') + path.sep + 'tiles';
                var tmpUrl = fileUrl(tmpFolder);
                var newTile = tileFolder + path.sep + mapID;
                var regex = new RegExp('^' + tmpUrl);
                if (url && url.match(regex)) {
                    try {
                        fs.statSync(newTile);
                        fs.removeSync(newTile);
                    } catch(err) {
                    }
                    fs.rename(tmpFolder, newTile, function(err) {
                        if (err) reject(err);
                        resolve();
                    });
                } else {
                    resolve();
                }
            })
        ]).then(function() {
            focused.webContents.send('saveResult', 'Success');
        }).catch(function(err) {
            focused.webContents.send('saveResult', err);
        });
    },
    updateTin: function(gcps) {
        tinObject.setPoints(gcps);
        tinObject.updateTin('strict');

        var tins = JSON.parse(JSON.stringify(tinObject.tins));
        var kinks = tinObject.kinks;

        if (kinks && kinks.forw) Array.prototype.push.apply(tins.forw.features, kinks.forw.features);
        if (kinks && kinks.bakw) Array.prototype.push.apply(tins.bakw.features, kinks.bakw.features);

        focused.webContents.send('updatedTin', tins);
    }
};

function counterTri(tri) {
    var coordinates = ['a', 'b', 'c', 'a'].map(function(key) {
        return tri.properties[key].geom;
    });
    var cwCheck = isClockwise(coordinates);
    if (cwCheck) coordinates = ['a', 'c', 'b', 'a'].map(function(key) {
        return tri.properties[key].geom;
    });
    var geoms = tri.geometry.coordinates[0];
    var props = tri.properties;
    var properties = !cwCheck ? {
        a: {geom: geoms[0], index: props['a'].index},
        b: {geom: geoms[1], index: props['b'].index},
        c: {geom: geoms[2], index: props['c'].index}
    } : {
        a: {geom: geoms[0], index: props['a'].index},
        b: {geom: geoms[2], index: props['c'].index},
        c: {geom: geoms[1], index: props['b'].index}
    };
    return turf.polygon([coordinates], properties);
}

function overlapCheck(searchIndex) {
    return Object.keys(searchIndex).reduce(function(prev, key) {
        var searchResult = searchIndex[key];
        if (searchResult.length < 2) return prev;
        ['forw', 'bakw'].map(function(dir) {
            var result = turf.intersect(searchResult[0][dir], searchResult[1][dir]);
            if (!result || result.geometry.type == 'Point' || result.geometry.type == 'LineString') return;
            if (!prev[dir]) prev[dir] = {};
            try {
                var diff1 = turf.difference(searchResult[0][dir], result);
                var diff2 = turf.difference(searchResult[1][dir], result);
                if (!diff1 || !diff2) {
                    prev[dir][key] = 'Include case';
                } else {
                    prev[dir][key] = 'Not include case';
                }
            } catch(e) {
                prev[dir][key] = 'Not include case';
            }
        });
        return prev;
    }, {});
}

function insertSearchIndex(searchIndex, tris, tins) {
    var keys = calcSearchKeys(tris.forw);
    var bakKeys = calcSearchKeys(tris.bakw);
    if (JSON.stringify(keys) != JSON.stringify(bakKeys))
        throw JSON.stringify(tris, null, 2) + '\n' + JSON.stringify(keys) + '\n' + JSON.stringify(bakKeys);

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (!searchIndex[key]) searchIndex[key] = [];
        searchIndex[key].push(tris);
    }
    if (tins) {
        tins.forw.features.push(tris.forw);
        tins.bakw.features.push(tris.bakw);
    }
}

function removeSearchIndex(searchIndex, tris, tins) {
    var keys = calcSearchKeys(tris.forw);
    var bakKeys = calcSearchKeys(tris.bakw);
    if (JSON.stringify(keys) != JSON.stringify(bakKeys))
        throw JSON.stringify(tris, null, 2) + '\n' + JSON.stringify(keys) + '\n' + JSON.stringify(bakKeys);

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var newArray = searchIndex[key].filter(function(eachTris) {
            return eachTris.forw != tris.forw;
        });
        if (newArray.length == 0) delete searchIndex[key];
        else searchIndex[key] = newArray;
    }
    if (tins) {
        var newArray = tins.forw.features.filter(function(eachTri) {
            return eachTri != tris.forw;
        });
        tins.forw.features = newArray;
        newArray = tins.bakw.features.filter(function(eachTri) {
            return eachTri != tris.bakw;
        });
        tins.bakw.features = newArray;
    }
}

function calcSearchKeys(tri) {
    var vtx = ['a', 'b', 'c'].map(function(key) {
        return tri.properties[key].index;
    });
    return [[0, 1], [0, 2], [1, 2], [0, 1, 2]].map(function(set) {
        var index = set.map(function(i) {
            return vtx[i];
        }).sort(function(a, b) {
            return a - b;
        }).join('-');
        return index;
    }).sort();
}

module.exports = mapedit;
