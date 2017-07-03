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
    }
};

module.exports = mapedit;
