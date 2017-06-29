'use strict';

const storage = require('electron-json-storage');
const os = require('os');
const path = require('path');
const app = require('electron').app;
const fs = require('fs-extra');
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
                    saveFolder: path.resolve(app.getPath('documents') + path.sep + app.getName()), // path.resolve(os.homedir() + '/MaplatEditor'),
                    tmpFolder: path.resolve(app.getPath('temp') + path.sep + app.getName()) // path.resolve(os.tmpdir() + '/MaplatEditor')
                };
                storage.set('saveFolder', json.saveFolder);
                storage.set('tmpFolder', json.tmpFolder);
                fs.ensureDir(json.tmpFolder, function(err) {});
            } else {
                json = data;
            }
        });
    },
    getSetting: function(key) {
        return json[key];
    },
    setSetting: function(key, value) {
        if (protect.indexOf(key) >= 0) throw '"' + key + '" is protected.';
        json[key] = value;
        storage.set(key, value);
    }
};
settings.init();

module.exports = settings;
