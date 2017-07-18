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

turf.kinks = function(featureIn) {
    var coordinates;
    var feature;
    var results = {
        type: 'FeatureCollection',
        features: []
    };
    if (featureIn.type === 'Feature') {
        feature = featureIn.geometry;
    } else {
        feature = featureIn;
    }
    if (feature.type === 'LineString') {
        coordinates = [feature.coordinates];
    } else if (feature.type === 'MultiLineString') {
        coordinates = feature.coordinates;
    } else if (feature.type === 'MultiPolygon') {
        coordinates = [].concat.apply([], feature.coordinates);
    } else if (feature.type === 'Polygon') {
        coordinates = feature.coordinates;
    } else {
        throw new Error('Input must be a LineString, MultiLineString, ' +
            'Polygon, or MultiPolygon Feature or Geometry');
    }
    coordinates.forEach(function (segment1) {
        coordinates.forEach(function (segment2) {
            for (var i = 0; i < segment1.length - 1; i++) {
                for (var k = 0; k < segment2.length - 1; k++) {
                    // don't check adjacent sides of a given segment, since of course they intersect in a vertex.
                    if (segment1 === segment2 && (Math.abs(i - k) === 1 || Math.abs(i - k) === segment1.length - 2)) {
                        continue;
                    }

                    var intersection = lineIntersects(segment1[i][0], segment1[i][1], segment1[i + 1][0], segment1[i + 1][1],
                        segment2[k][0], segment2[k][1], segment2[k + 1][0], segment2[k + 1][1]);
                    if (intersection) {
                        results.features.push(turf.point([intersection[0], intersection[1]]));
                    }
                }
            }
        });
    });
    return results;
};

function lineIntersects(line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY) {
    // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
    var denominator, a, b, numerator1, numerator2,
        result = {
            x: null,
            y: null,
            onLine1: false,
            onLine2: false
        };
    denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
    if (denominator === 0) {
        if (result.x !== null && result.y !== null) {
            return result;
        } else {
            return false;
        }
    }
    a = line1StartY - line2StartY;
    b = line1StartX - line2StartX;
    numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
    numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
    a = numerator1 / denominator;
    b = numerator2 / denominator;

    // if we cast these lines infinitely in both directions, they intersect here:
    result.x = line1StartX + (a * (line1EndX - line1StartX));
    result.y = line1StartY + (a * (line1EndY - line1StartY));

    // if line1 is a segment and line2 is infinite, they intersect if:
    var smallVal = Math.pow(10, -10);
    if (a >= 0 && a <= 1) {
        result.onLine1 = true;
    }
    if (a < smallVal || Math.abs(1 - a) < smallVal) {
        result.onEnd1 = true;
    }
    // if line2 is a segment and line1 is infinite, they intersect if:
    if (b >= 0 && b <= 1) {
        result.onLine2 = true;
    }
    if (b < smallVal || Math.abs(1 - b) < smallVal) {
        result.onEnd2 = true;
    }
    // if line1 and line2 are segments, they intersect if both of the above are true
    if (result.onLine1 && result.onLine2 && !(result.onEnd1 && result.onEnd2)) {
        // console.log(a + ' : ' + b);
        return [result.x, result.y];
    } else {
        return false;
    }
}

function findIntersections(coords) {
    var arcs = new internal.ArcCollection(coords);
    return internal.findSegmentIntersections(arcs);
}

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
    },
    request: function(mapID) {
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
                        focused.webContents.send('mapData', json);
                    }
                }
            });
        });
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
        setTimeout(function () {
        var pointArr = gcps.map(function(gcp, index) {
            return turf.point(gcp[0], {target: {index: index, geom: gcp[1]}});
        });
        var points = turf.featureCollection(pointArr);

        var tins = {forw: turf.tin(points, 'target')};

        tins.bakw = turf.featureCollection(tins.forw.features.map(function(tri) {
            return counterTri(tri);
        }));

        var searchIndex = {};
        tins.forw.features.map(function(forTri, index) {
            var bakTri = tins.bakw.features[index];
            insertSearchIndex(searchIndex, {forw: forTri, bakw: bakTri});
        });

        var overlapped = overlapCheck(searchIndex);

        Object.keys(overlapped.bakw).map(function(key) {
            if (overlapped.bakw[key] == 'Not include case') return;
            var trises = searchIndex[key];
            var forUnion = turf.union(trises[0].forw, trises[1].forw);
            var forConvex = turf.convex(turf.featureCollection([trises[0].forw, trises[1].forw]));
            var forDiff = turf.difference(forConvex, forUnion);
            if (forDiff) return;
            var sharedVtx = key.split('-').map(function(val) {
                var index = parseFloat(val);
                return ['a', 'b', 'c'].map(function(alpha, index) {
                    var prop = trises[0].bakw.properties[alpha];
                    var geom = trises[0].bakw.geometry.coordinates[0][index];
                    return {geom: geom, prop: prop};
                }).filter(function(vtx) {
                    return vtx.prop.index == index;
                })[0];
            });
            var nonSharedVtx = trises.map(function(tris) {
                return ['a', 'b', 'c'].map(function(alpha, index) {
                    var prop = tris.bakw.properties[alpha];
                    var geom = tris.bakw.geometry.coordinates[0][index];
                    return {geom: geom, prop: prop};
                }).filter(function(vtx) {
                    return vtx.prop.index != sharedVtx[0].prop.index &&
                        vtx.prop.index != sharedVtx[1].prop.index;
                })[0];
            });
            removeSearchIndex(searchIndex, trises[0], tins);
            removeSearchIndex(searchIndex, trises[1], tins);
            sharedVtx.map(function(sVtx) {
                var newTriCoords = [sVtx.geom, nonSharedVtx[0].geom, nonSharedVtx[1].geom, sVtx.geom];
                var cwCheck = isClockwise(newTriCoords);
                if (cwCheck) newTriCoords = [sVtx.geom, nonSharedVtx[1].geom, nonSharedVtx[0].geom, sVtx.geom];
                var newTriProp = !cwCheck ? {a: sVtx.prop, b: nonSharedVtx[0].prop, c: nonSharedVtx[1].prop} :
                    {a: sVtx.prop, b: nonSharedVtx[1].prop, c: nonSharedVtx[0].prop};
                var newBakTri = turf.polygon([newTriCoords], newTriProp);
                var newForTri = counterTri(newBakTri);
                insertSearchIndex(searchIndex, {forw: newForTri, bakw: newBakTri}, tins);
            });
        });
        // var newResult = overlapCheck(triSearchIndex);
        focused.webContents.send('updatedTin', tins);
        // var fkinks = turf.kinks(turf.multiPolygon(tins.forw.features.map(function(poly) { return poly.geometry.coordinates; })));
        // var bkinks = turf.kinks(turf.multiPolygon(tins.bakw.features.map(function(poly) { return poly.geometry.coordinates; })));
        // focused.webContents.send('updatedKinks', {forw: fkinks, bakw: bkinks});

        var coords = tins.bakw.features.map(function(poly) { return poly.geometry.coordinates[0]; });
        var xy = findIntersections(coords);
        var xy2 = internal.dedupIntersections(xy).map(function(point) { return [point.x, point.y] });
        focused.webContents.send('updatedKinks', [coords, xy2]);

        //fs.writeFileSync('Kinks.json',JSON.stringify(kinks, null, 2));
        /*var forArray = [];
        var bakArray = [];
        for (var i = 0; i < tins.forw.features.length - 1; i++) {
            for (var j = i + 1; j < tins.forw.features.length; j++ ) {
                var forResult = turf.lineIntersect(tins.forw.features[i], tins.forw.features[j]);
                var bakResult = turf.lineIntersect(tins.bakw.features[i], tins.bakw.features[j]);
                Array.prototype.push.apply(forArray, forResult.features);
                Array.prototype.push.apply(bakArray, bakResult.features);
            }
        }
        focused.webContents.send('updatedKinks', {forw: forArray, bakw:bakArray});*/
        }, 1);
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
