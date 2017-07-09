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

var maplist = {
    request: function() {
        var saveFolder = settings.getSetting('saveFolder');
        mapFolder = saveFolder + path.sep + 'maps';
        fs.ensureDir(mapFolder, function(err) {});
        tileFolder = saveFolder + path.sep + 'tiles';
        fs.ensureDir(tileFolder, function(err) {});
        var focused = BrowserWindow.getFocusedWindow();

        new Promise(function(resolve, reject) {
            fs.readdir(mapFolder, function(err, files) {
                resolve(files.map(function(file) {
                    var fullPath = mapFolder + path.sep + file;
                    var mapID = path.parse(fullPath).name;
                    return { fullPath: fullPath, mapID: mapID };
                }).filter(function(file) {
                    return fs.statSync(file.fullPath).isFile() && /.*\.json$/.test(file.fullPath);
                }));
            });
        }).then(function(files) {
            for (var i=0; i<files.length; i++) {
                var tmp = files[i];
                new Promise(function(resolve, reject) {
                    var file = tmp;
                    fs.readFile(file.fullPath, 'utf8', function(err, data) {
                        if (err) throw err;
                        var json = JSON.parse(data);
                        if (json.title == null || json.attr == null) resolve();
                        file.title = json.title;
                        file.width = json.width;
                        file.height = json.height;
                        resolve(file);
                    });
                }).then(function(file) {
                    if (!file) return;
                    if (!file.width || !file.height) return file;
                    var thumbFolder = tileFolder + path.sep + file.mapID + path.sep + '0' + path.sep + '0';
                    return new Promise(function(resolve, reject) {
                        fs.readdir(thumbFolder, function(err, thumbs) {
                            if (!thumbs) {
                                resolve(file);
                                return;
                            }
                            for (var i=0; i<thumbs.length; i++) {
                                var thumb = thumbs[i];
                                if (/^0\.(?:jpg|jpeg|png)$/.test(thumb)) {
                                    var thumbURL = fileUrl(thumbFolder + path.sep + thumb);
                                    file.thumbnail = thumbURL;
                                }
                            }
                            resolve(file);
                        });
                    });
                }).then(function(file) {
                    if (!file) return;
                    focused.webContents.send('mapListAdd', file);
                });
            }
        });
    }
};

module.exports = maplist;
