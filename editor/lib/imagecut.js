'use strict';

var exec = require('child_process').exec;

var sourceFile = __dirname + '/../../original/morioka.jpg';
var cutOutDirectory = __dirname + '/../out';
var imageCutterTool = __dirname + '/../common/tools/imagecutter.js';

var imagecut = {
    cutImageToTile: function(cb) {
        exec(imageCutterTool + ' -s ' + sourceFile + ' -o ' + cutOutDirectory, function(err, stdout, stderr) {
            if (err) { console.log(err); }
            console.log(stdout);
        });
    }
};

module.exports = imagecut;
