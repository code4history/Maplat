'use strict';

var exec = require('child_process').exec;
var path = require('path');

var sourceFile = path.resolve(path.__dirname + '/../../original/morioka.jpg');
var cutOutDirectory = path.resolve(__dirname + '/../out');
var imageCutterTool = path.resolve(__dirname + '/../common/tools/imagecutter.js');

var imagecut = {
    cutImageToTile: function(cb) {
        exec('node ' + imageCutterTool + ' -s ' + sourceFile + ' -o ' + cutOutDirectory, function(err, stdout, stderr) {
            if (err) cb(false, err);
            console.log(stdout);
            if (stdout.match(/All done/gm)) {
                cb(true, null);
            } else {
                cb(false, 'Some error occurred');
            }
        });
    }
};

module.exports = imagecut;
