#!/usr/local/bin/node

var fs       = require('fs'),
    path     = require('path'),
    argv     = require('argv'),
    readline = require('readline');

var args = argv.option( [{
    name: 'source',
    short: 's',
    type: 'path',
    description: 'Defines source points file. QGIS or Maplat format file can be set.',
    example: "'datacreator.js --source=path' or 'datacreator.js -s path'"
},{
    name: 'output',
    short: 'o',
    type: 'path',
    description: 'Defines output Maplat format points file.',
    example: "'datacreator.js --output=path' or 'datacreator.js -o path'"
},{
    name: 'tps',
    short: 't',
    type: 'path',
    description: 'Defines whether Thinplate Spline binary need or not. output file name can be set.',
    example: "'datacreator.js --tps[=path]' or 'datacreator.js -t [path]'"
}] ).run();

var source   = args.options.source;
var output   = args.options.output;
var tps_opt  = args.options.tps;
var basename = path.basename(source).split(".")[0].replace(/_points$/,"");
if (!source) stop('Source option is mandatory.');
if (!output)
    output = path.resolve(basename + "_points.json");
var tps_out = !tps_opt ? null :
    tps_opt.split("/").slice(-1)[0] == 'true' ?
        path.resolve(basename + ".bin") :
        tps_opt;

var tps;
if (tps_out) {
    var ThinPlateSpline = require("../js/thinplatespline");
    tps = new ThinPlateSpline({});
}

var rs = fs.ReadStream(source);
var rl = readline.createInterface({'input': rs, 'output': {}});
var filebuf = null;
var points = [];
rl.on('line', function (line) {
    if (!filebuf) {
        if (line.indexOf("mapX,mapY,") == 0) {
            filebuf = "qgis";
        } else if (line.indexOf("[") == 0) {
            if (!tps_out) {
                stop('Source file is already Maplat format.');
            }
            filebuf = line;
        } else stop("Source file format is not match");
    } else {
        if (filebuf == "qgis") {
            var values = line.split(",").map(function(val){return parseFloat(val)});
            var point = [[values[2],-1.0*values[3]], [values[0], values[1]]];
            points.push(point);
            if (tps_out) tps.add_point(point[0],point[1]);
        } else filebuf = filebuf + line;
    }
});
rl.on('close', function (line) {
    if (filebuf != "qgis") {
        points = JSON.parse(filebuf);
        if (tps_out) tps.push_points(points);
    }
    for (var i=0;i<points.length;i++) {
        if (i==0) fs.writeFileSync(output,"[\n");
        fs.appendFileSync(output, "    " + JSON.stringify(points[i]));
        if (i==points.length-1) fs.appendFileSync(output, "\n]\n");
        else fs.appendFileSync(output, ",\n");
    }
    if (tps_out) {
        tps.solve();
        fs.writeFile(tps_out, new Buffer(tps.serialize()), function (err) {
            if (err) stop(err);
        });
    }
});
rl.resume();

function stop (message) {
    console.log(message);
    process.exit(1);
}
