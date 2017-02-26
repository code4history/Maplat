#!/usr/local/bin/node

var request = require('request');
var fs = require('fs');
var icons = {
    '地蔵': 'parts/jizo.png',
    '石仏等': 'parts/hotoke.png',
    '小祠': 'parts/jinja.png'
};


var retdata = {
    "app_name" : "地蔵プロジェクト",
    "sources" : [
        "gsi",
        "osm",
        {
            "era" : "和州奈良之図 (1844年)",
            "attr" : "和州奈良之図 (1844年) 絵図屋庄八 国土地理院 古地図コレクション",
            "mapID" : "nara_ezuya",
            "width" : 16242,
            "height" : 12368,
            "year" : 1844
        }
    ], 
    "pois" :[
    ]
};

request({
    uri: 'https://raw.githubusercontent.com/code4nara/JizoProject/master/jizo_projects.geojson',
    json: true
}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        var features = body.features;
        for (var i = 0; i < features.length; i++) {
            var poi_src = features[i];
            var poi = {
                name: poi_src.properties.title,
                lat: poi_src.geometry.coordinates[1],
                lng: poi_src.geometry.coordinates[0],
                desc: poi_src.properties.description,
                image: poi_src.properties.thumbnail,
                icon: icons[poi_src.properties.type]
            };
            retdata.pois.push(poi);
        }
        fs.writeFileSync('json/jizoapp.json',JSON.stringify(retdata, null, '  '));
    }
});

/*var fs       = require('fs'),
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

var source   = args.options.source;
var output   = args.options.output;
var tps_opt  = args.options.tps;
var backward = args.options.backward;
var basename = path.basename(source).split(".")[0].replace(/_points$/,"");
if (!source) stop('Source option is mandatory.');
if (!output)
    output = path.resolve(basename + "_points.json");
var tps_out = !tps_opt ? null :
    tps_opt.split("/").slice(-1)[0] == 'true' ?
        path.resolve(basename + ".bin") :
        tps_opt;
var bak_out = !backward ? null :
    backward.split("/").slice(-1)[0] == 'true' ?
        path.resolve(basename + ".jpg.points") :
        backward;

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
            if (bak_out) {
                stop('Source file is already QGIS format.');
            }
            filebuf = "qgis";
        } else if (line.indexOf("[") == 0) {
            if (!tps_out && !bak_out) {
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
    if (!bak_out) {
        for (var i = 0; i < points.length; i++) {
            if (i == 0) fs.writeFileSync(output, "[\n");
            fs.appendFileSync(output, "    " + JSON.stringify(points[i]));
            if (i == points.length - 1) fs.appendFileSync(output, "\n]\n");
            else fs.appendFileSync(output, ",\n");
        }
    } else {
        for (var i=0;i<points.length;i++) {
            if (i==0) fs.writeFileSync(bak_out,"mapX,mapY,pixelX,pixelY,enable\n");
            fs.appendFileSync(bak_out, points[i][1][0] + "," + points[i][1][1] + "," + points[i][0][0] + "," + (-1.0*points[i][0][1]) + ",1\n" );
        }
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
}*/
