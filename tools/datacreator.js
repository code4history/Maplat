#!/usr/local/bin/node

var fs = require('fs');
var path = require('path');
var argv = require('argv');
var readline = require('readline');
var csvSync = require('csv-parse/lib/sync');

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
    name: 'backward',
    short: 'b',
    type: 'path',
    description: 'Defines whether backward QGIS format points file is need or not. output file name can be set.',
    example: "'datacreator.js --backward[=path]' or 'datacreator.js -b [path]'"
},{
    name: 'tps',
    short: 't',
    type: 'path',
    description: 'Defines whether Thinplate Spline binary is need or not. output file name can be set.',
    example: "'datacreator.js --tps[=path]' or 'datacreator.js -t [path]'"
}] ).run();

var source = args.options.source;
var output = args.options.output;
var tpsOpt = args.options.tps;
var backward = args.options.backward;
var basename = path.basename(source).split('.')[0].replace(/_points$/, '');
if (!source) stop('Source option is mandatory.');
if (!output)
    output = path.resolve(basename + '.json');
var tpsOut = !tpsOpt ? null :
    tpsOpt.split('/').slice(-1)[0] == 'true' ?
        path.resolve(basename + '.bin') :
        tpsOpt;
var bakOut = !backward ? null :
    backward.split('/').slice(-1)[0] == 'true' ?
        path.resolve(basename + '.jpg.points') :
        backward;
var bakIn = false;

var tps;
if (tpsOut) {
    var ThinPlateSpline = require('../js/thinplatespline');
    tps = new ThinPlateSpline({});
}

var rs = fs.ReadStream(source);
var rl = readline.createInterface({'input': rs, 'output': {}});
var filebuf = null;
var points = [];
rl.on('line', function(line) {
    if (!filebuf) {
        if (line.indexOf('mapX,mapY,') == 0) {
            if (bakOut) {
                stop('Source file is already QGIS format.');
            }
            filebuf = 'qgis';
        } else if (line.indexOf('{') == 0) {
            bakIn = true;
            if (!tpsOut && !bakOut) {
                stop('Source file is already Maplat format.');
            }
            filebuf = line;
        } else stop('Source file format is not match');
    } else {
        if (filebuf == 'qgis') {
            var values = line.split(',').map(function(val){
                return parseFloat(val);
            });
            var point = [[values[2], -1.0*values[3]], [values[0], values[1]]];
            points.push(point);
            if (tpsOut) tps.add_point(point[0], point[1]);
        } else filebuf = filebuf + line;
    }
});
rl.on('close', function(line) {
    if (filebuf != 'qgis') {
        var jval = JSON.parse(filebuf);
        points = jval.gcps;
        console.log(points);
        if (tpsOut) tps.push_points(points);
    }
    if (!bakOut) {
        if (!bakIn) {
            for (var i = 0; i < points.length; i++) {
                if (i == 0) fs.writeFileSync(output, '[\n');
                fs.appendFileSync(output, '    ' + JSON.stringify(points[i]));
                if (i == points.length - 1) fs.appendFileSync(output, '\n]\n');
                else fs.appendFileSync(output, ',\n');
            }
        }
    } else {
        for (var i=0; i<points.length; i++) {
            if (i==0) fs.writeFileSync(bakOut, 'mapX,mapY,pixelX,pixelY,enable\n');
            fs.appendFileSync(bakOut, points[i][1][0] + ',' + points[i][1][1] + ',' +
                points[i][0][0] + ',' + (-1.0*points[i][0][1]) + ',1\n');
        }
    }
    if (tpsOut) {
        tps.solve();
        fs.writeFile(tpsOut, new Buffer(tps.serialize()), function (err) {
            if (err) stop(err);
        });
    }
});
rl.resume();

function stop(message) {
    console.log(message);
    process.exit(1);
}
