#!/usr/local/bin/node

var async = require('async'),
    im = require('imagemagick'),
    argv = require('argv'),
    path = require('path'),
    fs = require('fs-extra');

var args = argv.option( [{
    name: 'source',
    short: 's',
    type: 'string',
    description: 'Source image file to be tiles',
    example: "'imagecutter.js --source=path' or 'imagecutter.js -s path'"
},{
    name: 'extension',
    short: 'e',
    type: 'string',
    description: 'Specify tile image\'s extension',
    example: "'imagecutter.js --extension=jpg' or 'imagecutter.js -e jpg'"
},{
    name: 'output',
    short: 'o',
    type: 'string',
    description: 'Defines output folder',
    example: "'imagecutter.js --output=path' or 'imagecutter.js -o path'"
}] ).run();

var srcFile = path.resolve(args.options.source);
var extKey = args.options.extension;
var outFolder = path.resolve(args.options.output);
if (!srcFile) stop('Source option is mandatory.');
if (!outFolder) {
    outFolder = path.resolve('./tiles');
}
doCrop(srcFile);

function doCrop(srcFile) {
  var parsed = path.parse(srcFile);
  var fileKey = parsed.name;
  if (!extKey) {
    extKey = parsed.ext.replace(/\./, '');
  }
  try {
    fs.statSync(path.resolve(outFolder + '/' + fileKey));
  } catch (e) {
    fs.mkdirSync(path.resolve(outFolder + '/' + fileKey), 0777);
  }
  im.identify(srcFile, function(err, features){
    if (err) throw err;

    var width = features.width;
    var height = features.height;
    var format = features.format;

    var xZoom = Math.ceil(Math.log(width / 256) / Math.log(2));
    var yZoom = Math.ceil(Math.log(height / 256) / Math.log(2));
    var zoom = xZoom > yZoom ? xZoom : yZoom;
    if (zoom < 0) zoom = 0;

    var parallel = [];

    for (var z=zoom; z>=0; z--) {
      var args = [srcFile];
      var zw, zh;
      if (z != zoom) {
        zw = Math.round(width / Math.pow(2, zoom-z));
        zh = Math.round(height / Math.pow(2, zoom-z));
        args.push('-geometry');
        args.push(zw + 'x' + zh + '!');
      } else {
        zw = width;
        zh = height;
      }
      args.push('-crop');
      args.push('256x256');
      args.push(outFolder + '/' + fileKey + '/' + fileKey + '-' + z + '.' + extKey);

      (function() {
        var _args = args;
        var _z = z;
        var _zw = zw;
        var _zh = zh;
        var func = function(callback) {
          console.log('Zoom ' + _z + ' tiling is start.');
          im.convert(_args, function(err, stdout, stderr) {
            console.log('Zoom ' + _z + ' tiling is end.');

            var zi = 0;
            for (var zy = 0; zy*256 < _zh; zy++) {
              for (var zx = 0; zx*256 < _zw; zx++) {
                var origName;
                if (_z == 0) {
                  origName = outFolder + '/' + fileKey + '/' + fileKey + '-0.' + extKey;
                } else {
                  origName = outFolder + '/' + fileKey + '/' + fileKey + '-' + _z + '-' + zi +'.' + extKey;
                }
                fs.mkdirsSync(outFolder + '/' + fileKey +'/' + _z + '/' + zx);
                var changeName = outFolder + '/' + fileKey + '/' + _z + '/' + zx + '/' + zy +'.' + extKey;

                fs.renameSync(origName, changeName);

                zi++;
              }
            }

            callback(null, _z);
          });
        };

        parallel.push(func);
      })();
    }

    async.series(parallel, function(err, results) {
      if (err) throw err;
      console.log('All done. ' + results);
    });
  });
}

function stop(message) {
    console.log(message);
    process.exit(1);
}

