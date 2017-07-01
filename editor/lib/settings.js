'use strict';

const storage = require('electron-json-storage');
const os = require('os');
const path = require('path');
const app = require('electron').app;
const fs = require('fs-extra');
var electron = require('electron');
var BrowserWindow = electron.BrowserWindow;
var json;

var protect = [
    'tmpFolder'
];

var settings = {
    init: function() {
        if (json) return;
        storage.getAll(function(error, data) {
            if (error) throw error;

            if (Object.keys(data).length === 0) {
                json = {
                    saveFolder: path.resolve(app.getPath('documents') + path.sep + app.getName())
                };
                storage.set('saveFolder', json.saveFolder);
                fs.ensureDir(json.saveFolder, function(err) {});
            } else {
                json = data;
            }
            json.tmpFolder = path.resolve(app.getPath('temp') + path.sep + app.getName());
            fs.ensureDir(json.tmpFolder, function(err) {});
        });
    },
    getSetting: function(key) {
        return json[key];
    },
    getSettings: function() {
        return json;
    },
    setSetting: function(key, value) {
        if (protect.indexOf(key) >= 0) throw '"' + key + '" is protected.';
        json[key] = value;
        storage.set(key, value);
    },
    showSaveFolderDialog: function(oldSetting) {
        var dialog = require('electron').dialog;
        var focused = BrowserWindow.getFocusedWindow();
        dialog.showOpenDialog({ defaultPath: oldSetting, properties: ['openDirectory']}, function (baseDir){
            if(baseDir && baseDir[0]) {
                focused.webContents.send('saveFolderSelected',baseDir[0]);
            }
        });
    }
};
settings.init();

module.exports = settings;
