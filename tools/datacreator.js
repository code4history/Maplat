#!/usr/local/bin/node

var fs = require('fs');
var path = require('path');
var argv = require('argv');
var csvSync = require('csv-parse/lib/sync');

var args = argv.option( [{
    name: 'source',
    short: 's',
    type: 'path',
    description: 'Defines source points file. QGIS or Maplat format file can be set.',
    example: "'datacreator.js --source=path' or 'datacreator.js -s path'"
}, {
    name: 'output',
    short: 'o',
    type: 'path',
    description: 'Defines output Maplat format points file.',
    example: "'datacreator.js --output=path' or 'datacreator.js -o path'"
}, {
    name: 'backward',
    short: 'b',
    type: 'path',
    description: 'Defines whether backward QGIS format points file is need or not. output file name can be set.',
    example: "'datacreator.js --backward[=path]' or 'datacreator.js -b [path]'"
}, {
    name: 'tps',
    short: 'T',
    type: 'path',
    description: 'Defines whether Thinplate Spline binary is need or not. output file name can be set.',
    example: "'datacreator.js --tps[=path]' or 'datacreator.js -t [path]'"
}, {
    name: 'title',
    short: 't',
    type: 'string',
    description: 'Defines map data title. If transformation is forward, this option or "-O" option must be set.',
    example: "'datacreator.js --title[=string]' or 'datacreator.js -t [string]'"
}, {
    name: 'size',
    short: 'S',
    type: 'csv,int',
    description: 'Defines map size as "x,y". If transformation is forward, this option or "-O" option must be set.',
    example: "'datacreator.js --size[=int,int]' or 'datacreator.js -S [int,int]'"
}, {
    name: 'year',
    short: 'y',
    type: 'int',
    description: 'Defines map created year. If transformation is forward, this option or "-O" option must be set.',
    example: "'datacreator.js --year[=int]' or 'datacreator.js -y [int]'"
}, {
    name: 'attr',
    short: 'a',
    type: 'string',
    description: 'Defines map attribution. If transformation is forward, this option or "-O" option must be set.',
    example: "'datacreator.js --attr[=string]' or 'datacreator.js -a [string]'"
}, {
    name: 'oldvalue',
    short: 'O',
    type: 'string',
    description: 'Defines old value from previous file. If transformation is forward, this option or "-t,-S,-y,-a" options must be set.',
    example: "'datacreator.js --oldvalue[=path]' or 'datacreator.js -O [path]'"
}] ).run();

var source = args.options.source;
var output = args.options.output;
var oldvalue = args.options.oldvalue;
var title = args.options.title;
var size = args.options.size;
var year = args.options.year;
var attr = args.options.attr;

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

var content = fs.readFileSync(source);
var sourcedata;
if (content.indexOf('mapX,mapY,') == 0) {
    if (bakOut) {
        stop('Source file is already QGIS format.');
    }
    sourcedata = parseCSV(content);
} else if (content.indexOf('{') == 0) {
    bakIn = true;
    if (!tpsOut && !bakOut) {
        stop('Source file is already Maplat format.');
    }
    sourcedata = parseJSON(content);
} else stop('Source file format is not match');
if (tpsOut) tps.push_points(sourcedata.gcps);

if (oldvalue) {
    var olddata = JSON.parse(fs.readFileSync(oldvalue));
    olddata.gcps = sourcedata.gcps;
    sourcedata = olddata;
}
if (title) sourcedata.title = title;
if (size) {
    console.log(size);
    sourcedata.width = size[0];
    sourcedata.height = size[1];
}
if (attr) sourcedata.attr = attr;
if (year) sourcedata.year = year;

if (!bakOut) {
    if (!bakIn) {
        var outdata = {};
        for (var key of ['title', 'attr', 'width', 'height', 'year', 'gcps']) {
            outdata[key] = sourcedata[key];
        }
        fs.writeFileSync(output, JSON.stringify(outdata, null, '  '));
    }
} else {
    var points = sourcedata.gcps;
    for (var i=0; i<points.length; i++) {
        if (i==0) fs.writeFileSync(bakOut, 'mapX,mapY,pixelX,pixelY,enable\n');
        fs.appendFileSync(bakOut, points[i][1][0] + ',' + points[i][1][1] + ',' +
            points[i][0][0] + ',' + (-1.0*points[i][0][1]) + ',1\n');
    }
}
if (tpsOut) {
    tps.solve();
    fs.writeFile(tpsOut, new Buffer(tps.serialize()), function(err) {
        if (err) stop(err);
    });
}

function stop(message) {
    console.log(message);
    process.exit(1);
}

function parseCSV(value) {
    var res = csvSync(value, {
        auto_parse: true, from: 2
    });
    var points = [];
    for (var i = 0; i < res.length; i++) {
        var values = res[i];
        var point = [[values[2], -1.0*values[3]], [values[0], values[1]]];
        points.push(point);
    }
    var ret = {
        gcps: points
    };
    return ret;
}

function parseJSON(value) {
    return JSON.parse(value);
}