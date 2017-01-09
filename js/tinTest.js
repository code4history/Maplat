var turf = require('./turf.min');
var Tin = require('./tin2');
Tin.setTurf(turf);
var points = require('../json/morioka_points.json');

var recursiveRound = function(val, decimal) {
    if (val instanceof Array) return val.map(function(item) {
        return recursiveRound(item, decimal);
    });
    var decVal = Math.pow(10, decimal);
    return Math.round(val * decVal) / decVal;
};

var pt = turf.point([ 15712800, 4821900 ]);
var poly = turf.polygon([[
    [ 15712400, 4821900 ],
    [ 15712600, 4822000 ],
    [ 15712800, 4821900 ],
    [ 15712400, 4821900 ]
]]);

var isInside = inside(pt, poly);
console.log(isInside);

//pt = turf.point([ 80, 80 ]);
//poly = turf.polygon([[
//    [ 40, 80 ],
//    [ 60, 90 ],
//    [ 80, 80 ],
//    [ 40, 80 ]
//]]);

var pt1 = turf.point([ 10, 10 ]);
var pt2 = turf.point([ 30, 20 ]);
var pt3 = turf.point([ 50, 10 ]);
poly = turf.polygon([[
    [ 10, 10 ],
    [ 30, 20 ],
    [ 50, 10 ],
    [ 10, 10 ]
]]);

isInside = inside(pt1, poly);
console.log(inside(pt1, poly) + " " + inside(pt2, poly) + " " + inside(pt3, poly));

function inside(point, polygon) {
    var pt = turf.getCoord(point);
    var polys = polygon.geometry.coordinates;
    // normalize to multipolygon
    if (polygon.geometry.type === 'Polygon') polys = [polys];

    for (var i = 0, insidePoly = false; i < polys.length && !insidePoly; i++) {
        // check if it is in the outer ring first
        if (inRing(pt, polys[i][0])) {
            var inHole = false;
            var k = 1;
            // check for the point in any of the holes
            while (k < polys[i].length && !inHole) {
                if (inRing(pt, polys[i][k])) {
                    inHole = true;
                }
                k++;
            }
            if (!inHole) insidePoly = true;
        }
    }
    return insidePoly;
};

// pt is [x,y] and ring is [[x,y], [x,y],..]
function inRing(pt, ring) {
    var isInside = false;
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        var xi = ring[i][0], yi = ring[i][1];
        var xj = ring[j][0], yj = ring[j][1];
        var intersect = ((yi > pt[1]) !== (yj >= pt[1])) &&
            (pt[0] <= (xj - xi) * (pt[1] - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }
    return isInside;
}


//var tin = new Tin({points: recursiveRound(points, -2), wh: [6144, 4096]});
//tin.updateTin2();
// console.log(tin);

