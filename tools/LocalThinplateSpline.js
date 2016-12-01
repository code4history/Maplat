var fs       = require('fs'),
    path     = require('path'),
    argv     = require('argv'),
    readline = require('readline');
var ThinPlateSpline = require("../js/thinplatespline");

var args = argv.option( [{
    name: 'source',
    short: 's',
    type: 'path',
    description: 'Defines source points file',
    example: "'LocalThinplateSpline.js --source=path' or 'LocalThinplateSpline.js -s path'"
},{
    name: 'output',
    short: 'o',
    type: 'path',
    description: 'Defines output binary file',
    example: "'LocalThinplateSpline.js --output=path' or 'LocalThinplateSpline.js -o path'"
}] ).run();

var tps = new ThinPlateSpline({});

var source = args.options.source;
var output = args.options.output;
if (!source) stop('Source option is mandatory.');
if (!output) {
    var basename = path.basename(source).split(".")[0].replace(/_points$/,"");
    output = path.resolve(basename + ".bin");
}

var rs = fs.ReadStream(source);
var rl = readline.createInterface({'input': rs, 'output': {}});
var filebuf = null;
rl.on('line', function (line) {
    if (!filebuf) {
        if (line.indexOf("mapX,mapY,") == 0) {
            filebuf = "qgis";
        } else if (line.indexOf("[") == 0) {
            filebuf = line;
        } else stop("Source file format is not match");
    } else {
        if (filebuf == "qgis") {
            var values = line.split(",").map(function(val){return parseFloat(val)});
            tps.add_point([values[2],-1.0*values[3]], [values[0], values[1]]);
        } else filebuf = filebuf + line;
    }
});
rl.on('close', function (line) {
    if (filebuf != "qgis") {
        var points = JSON.parse(filebuf);
        tps.push_points(points);
    }
    tps.solve();
    fs.writeFile(output, new Buffer(tps.serialize()), function (err) {
        if (err) stop(err);
    });
});
rl.resume();

function stop (message) {
    console.log(message);
    process.exit(1);
}
