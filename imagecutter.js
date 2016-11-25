#!/usr/local/bin/node

var async = require('async'),
    im    = require('imagemagick'),
    opts  = require('opts'),
    path  = require('path'),
    fs    = require('fs');

opts.parse([
  {
    'short': 'f',
    'long': 'file',
    'description': 'Source image file to be tiles',
    'value': true,
    'required': true
  }, {
    'short': 'e',
    'long': 'extension',
    'description': 'Specify tile image\'s extension',
    'value': true,
    'required': false
  },
]);

var srcFile = opts.get('file');
var extKey  = opts.get('extension');

doCrop(srcFile);

function doCrop(srcFile) {
  var regex   =  new RegExp('^(.+)\\.([^\\.]+)$');
  var fileKey;
  if (srcFile.match(regex)) {
    fileKey = RegExp.$1;
    if (!extKey) {
      extKey  = RegExp.$2;
    }
  }

  try {
    fs.statSync(fileKey);
  } catch (e) {
    fs.mkdirSync(fileKey, 0777);
  }

  im.identify(srcFile, function(err, features){
    if (err) throw err;

    var width  = features.width;
    var height = features.height;
    var format = features.format;

    var xZoom  = Math.ceil(Math.log(width / 256)  / Math.log(2));
    var yZoom  = Math.ceil(Math.log(height / 256) / Math.log(2));
    var zoom   = xZoom > yZoom ? xZoom : yZoom;
    if (zoom < 0) zoom = 0;
    console.log(width + ' ' + height + ' ' + xZoom + ' ' + yZoom + ' ' + zoom);

    var parallel = [];

    for (var z=zoom;z>=0;z--) {
      console.log(z);
      var args = [srcFile];
      var zw,zh;
      if (z != zoom) {
        zw = Math.round(width  / Math.pow(2,zoom-z));
        zh = Math.round(height / Math.pow(2,zoom-z));
        args.push('-geometry');
        args.push(zw + 'x' + zh + '!');
      } else {
        zw = width;
        zh = height;
      }
      args.push('-crop');
      args.push('256x256');
      args.push(fileKey + '/' + fileKey + '-' + z + '.' + extKey);
      //console.log(args);
      
      (function(){
        var _args = args;
        var _z    = z;
        var _zw   = zw;
        var _zh   = zh;
        var func = function(callback) {
          //console.log("Inside: " + _args);
          console.log('Zoom ' + _z + ' tiling is start.');
          im.convert(_args,function(err, stdout, stderr) {
            console.log('Zoom ' + _z + ' tiling is end.');
           
            var zi = 0;
            for (var zy = 0; zy*256 < _zh; zy++) {
              for (var zx = 0; zx*256 < _zw; zx++) {
                var origName;
                if (_z == 0) {
                  origName   = fileKey + '/' + fileKey + '-0.' + extKey;
                } else {
                  origName   = fileKey + '/' + fileKey + '-' + _z + '-' + zi +'.' + extKey;
                }
                var changeName = fileKey + '/' + fileKey + '-' + _z + '_' + zx + '_' + zy +'.' + extKey;

                fs.renameSync(origName,changeName);

                zi++;
              }
            }
            
            callback(null,_z);
          });
        };
      
        parallel.push(func);
      })();
    }
    
    async.series(parallel,function(err,results) {
      if (err) throw err;
      console.log('All done. ' + results);
    });
  });
}



