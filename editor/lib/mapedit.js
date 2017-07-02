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
            focused.webContents.send('mapData', json);
        });
    }
};

module.exports = mapedit;
