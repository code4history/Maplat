'use strict';
var path = require('path');
var settings = require('./settings');
var fs = require('fs-extra');
var fileUrl = require('file-url');
var electron = require('electron');
var BrowserWindow = electron.BrowserWindow;

settings.init();

var mapFolder;
var tileFolder;
var focused;

var mapedit = {
    init: function() {
        var saveFolder = settings.getSetting('saveFolder');
        mapFolder = saveFolder + path.sep + 'maps';
        fs.ensureDir(mapFolder, function(err) {});
        tileFolder = saveFolder + path.sep + 'tiles';
        fs.ensureDir(tileFolder, function(err) {});
        focused = BrowserWindow.getFocusedWindow();
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
    }
};

module.exports = mapedit;
