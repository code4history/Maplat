var turf = require('turf');
var wkt = require('wellknown');
var path = require("path");
var userHome = process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME'];
var docFolder = path.join(userHome, 'Documents');
var gcps = require(path.join(docFolder, 'MaplatEditor/maps/nara_ezuya.json')).gcps;
var isClockwise = require('turf-is-clockwise');
var fs = require('fs');

var pointArr = gcps.map(function(gcp, index) {
    return turf.point(gcp[1], {target: {index: index, geom: gcp[0]}});
});
var points = turf.featureCollection(pointArr);

var tin = turf.tin(points, 'target');

fs.writeFileSync('Forward.json',JSON.stringify(tin, null, 2));
console.log('Forward');
tin.features.forEach(function(tri, index) {
	// console.log(tri.geometry.coordinates[0]);
    // console.log(index + ' : ' + isClockwise(tri.geometry.coordinates[0]));
});

var backTin = turf.featureCollection(tin.features.map(function(tri) {
    var coordinates = ['a', 'c', 'b', 'a'].map(function(key) {
        return tri.properties[key].geom;
    });
    //console.log(coordinates);
    var geoms = tri.geometry.coordinates[0];
    var props = tri.properties;
    var properties = {
    	a: {geom: geoms[0], index: props['a'].index},
    	b: {geom: geoms[2], index: props['c'].index},
    	c: {geom: geoms[1], index: props['b'].index}
    };
    //console.log(properties);
    return turf.polygon([coordinates], properties);
}));

fs.writeFileSync('Backward.json',JSON.stringify(backTin, null, 2));
console.log('Backward');
backTin.features.forEach(function(tri, index) {
	// console.log(tri.geometry.coordinates[0]);
    if (!isClockwise(tri.geometry.coordinates[0])) 
    	console.log(index + ' : ' + isClockwise(tri.geometry.coordinates[0]));
});

var triSearchIndex = {}; 
backTin.features.forEach(function(tri) {
	insertSearchIndex(triSearchIndex, tri);
});

var overlapped = overlapCheck(triSearchIndex);
console.log('Mid: ' + JSON.stringify(overlapped, null, 2));

Object.keys(overlapped).map(function(key) {
	if (overlapped[key] == 'Not include case') return;
	var tris = triSearchIndex[key];
	var wrapVtx = key.split('-').map(function(val) { 
		var index = parseFloat(val);
		return ['a','b','c'].map(function(alpha, index) {
			var prop = tris[0].properties[alpha];
			var geom = tris[0].geometry.coordinates[0][index];
			return {geom: geom, prop: prop};
		}).filter(function (vtx) {
			return vtx.prop.index == index;
		})[0];
	});
	// console.log('WRAP: ' + JSON.stringify(wrapVtx));
	var unwrapVtx = tris.map(function(tri) {
		return ['a','b','c'].map(function(alpha, index) {
			var prop = tri.properties[alpha];
			var geom = tri.geometry.coordinates[0][index];
			return {geom: geom, prop: prop};
		}).filter(function (vtx) {
			return vtx.prop.index != wrapVtx[0].prop.index &&
				vtx.prop.index != wrapVtx[1].prop.index;
		})[0];
	});
	// console.log('UNWRAP: ' + JSON.stringify(unwrapVtx));
	removeSearchIndex(triSearchIndex, tris[0], backTin);
	removeSearchIndex(triSearchIndex, tris[1], backTin);
	wrapVtx.map(function(wVtx) {
		var newTriCoords = [wVtx.geom, unwrapVtx[0].geom, unwrapVtx[1].geom, wVtx.geom];
		var cwCheck = isClockwise(newTriCoords);
		if (!cwCheck) newTriCoords = [wVtx.geom, unwrapVtx[1].geom, unwrapVtx[0].geom, wVtx.geom];
		var newTriProp = cwCheck ? {a: wVtx.prop, b:unwrapVtx[0].prop, c:unwrapVtx[1].prop } :
			{a: wVtx.prop, b:unwrapVtx[1].prop, c:unwrapVtx[0].prop };
		var newTri = turf.polygon([newTriCoords], newTriProp);
		insertSearchIndex(triSearchIndex, newTri, backTin);
	});
});
var newResult = overlapCheck(triSearchIndex);
console.log('Final: ' + JSON.stringify(newResult, null, 2));
fs.writeFileSync('newBackward.json',JSON.stringify(backTin, null, 2));

function overlapCheck(searchIndex) {
	return Object.keys(searchIndex).reduce(function(prev, key) {
		var searchResult = searchIndex[key];
		if (searchResult.length < 2) return prev;
		var result = turf.intersect(searchResult[0], searchResult[1]);
		if (!result || result.geometry.type == 'Point' || result.geometry.type == 'LineString') return prev;
		var diff1 = turf.difference(searchResult[0], result);
		var diff2 = turf.difference(searchResult[1], result);
		//console.log(JSON.stringify(result));
		//console.log(JSON.stringify(searchResult[0]));
		//console.log(JSON.stringify(searchResult[1]));
		//console.log(key);
		//console.log('Diff1: ' + diff1);
		//console.log('Diff2: ' + diff2);
		if (!turf.difference(searchResult[0], result) || !turf.difference(searchResult[1], result)) {
			prev[key] = "Include case";
		} else {
			prev[key] = "Not include case";
		}
		return prev;
	}, {});
}

function insertSearchIndex(searchIndex, tri, tin) {
	var vtx = ['a','b','c'].map(function(key) {
		return tri.properties[key].index;
	});
	[[0, 1], [0, 2], [1, 2], [0, 1, 2]].forEach(function(set) {
		var index = set.map(function(i) {
			return vtx[i];
		}).sort(function(a, b) {
			return a - b;
		}).join('-');
		if (!searchIndex[index]) searchIndex[index] = [];
		searchIndex[index].push(tri);
	});
	if (tin) tin.features.push(tri);
}

function removeSearchIndex(searchIndex, tri, tin) {
	var vtx = ['a','b','c'].map(function(key) {
		return tri.properties[key].index;
	});
	[[0, 1], [0, 2], [1, 2], [0, 1, 2]].forEach(function(set) {
		var index = set.map(function(i) {
			return vtx[i];
		}).sort(function(a, b) {
			return a - b;
		}).join('-');
		var newArray = searchIndex[index].filter(function(eachTri) {
			return eachTri != tri;
		});
		if (newArray.length == 0) delete searchIndex[index];
		else searchIndex[index] = newArray;
	});
	if (tin) {
		var newArray = tin.features.filter(function(eachTri) {
			return eachTri != tri;
		});
		tin.features = newArray;
	}
}



/*for (var i = 0; i < backTin.features.length; i++) {
	var target1 = backTin.features[i];
	for (var j = i + 1; j < backTin.features.length; j++) {
		var target2 = backTin.features[j];
		var result = turf.intersect(target1, target2);
		if (result && (result.geometry.type == 'Point' || result.geometry.type == 'LineString')) result = undefined;
		if (result) console.log(i + " and " + j + " : " + JSON.stringify(result));
	}
}*/

/*var convex = turf.convex(backTin);
console.log(wkt.stringify(convex));

var union = backTin.features.reduce(function(prev, curr) {
	if (!prev) return curr;
	return turf.union(prev, curr);
}, null)
console.log(wkt.stringify(union));

var diff = turf.difference(convex, union);
console.log(JSON.stringify(diff));*/