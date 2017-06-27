'use strict';

var exec = require('child_process').exec;
var path = require('path');

var sourceFile = path.resolve(path.__dirname + '/../../original/morioka.jpg');
var cutOutDirectory = path.resolve(__dirname + '/../out');
var imageCutterTool = path.resolve(__dirname + '/../common/tools/imagecutter.js');

var imagecut = {
    cutImageToTile: function(cb) {
        console.log(imageCutterTool);
        console.log(sourceFile);
        exec('node ' + imageCutterTool + ' -s ' + sourceFile + ' -o ' + cutOutDirectory, function(err, stdout, stderr) {
            if (err) { console.log(err); }
            console.log(stdout);
        });
    }
};

module.exports = imagecut;
