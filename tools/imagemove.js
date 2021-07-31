#!/usr/local/bin/node

var async = require('async'),
    opts  = require('opts'),
    path  = require('path'),
    fs    = require('fs-extra');

var folder = "../tiles";

fs.readdir(folder, function(err, files){
    if (err) throw err;
    files.filter(function(file){
        return fs.statSync(folder + "/" + file).isFile() && /^(.+)\-(\d+)_(\d+)_(\d+)\.(jpg|png)$/.test(file); //絞り込み
    }).forEach(function (file) {
        /^(.+)\-(\d+)_(\d+)_(\d+)\.(jpg|png)$/.test(file);
        console.log(RegExp.$1 + "  " + RegExp.$2 + "  " + RegExp.$3 + "  " + RegExp.$4 + "  " + RegExp.$5);
        fs.mkdirsSync(folder +'/' + RegExp.$1 + '/' + RegExp.$2 + '/' + RegExp.$3);
        fs.move(folder + "/" + file,
            folder +'/' + RegExp.$1 + '/' + RegExp.$2 + '/' + RegExp.$3 + '/' + RegExp.$4 + '.' + RegExp.$5, function (err) {
            if (err) return console.error(err);
        })
    });
});

