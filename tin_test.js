var turf = require('@turf/turf');
var wkt = require('wellknown');
var path = require("path");
var userHome = process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME'];
var docFolder = path.join(userHome, 'Documents');
var gcps = require(path.join(docFolder, 'MaplatEditor/maps/nara_ezuya.json')).gcps;
var isClockwise = turf.booleanClockwise;
var fs = require('fs');

var pointArr = gcps.map(function(gcp, index) {
    return turf.point(gcp[0], {target: {index: index, geom: gcp[1]}});
});
var points = turf.featureCollection(pointArr);

var tin = turf.tin(points, 'target');

fs.writeFileSync('Forward_true.json',JSON.stringify(tin, null, 2));
console.log('Forward_true');

var bakTin = turf.featureCollection(tin.features.map(function(tri) {
    return counterTri(tri);
}));

fs.writeFileSync('Backward_true.json',JSON.stringify(bakTin, null, 2));
console.log('Backward_true');

var triSearchIndex = {}; 
tin.features.map(function(forTri, index) {
	var bakTri = bakTin.features[index];
	insertSearchIndex(triSearchIndex, { forw: forTri, bakw: bakTri });
});

//console.log(JSON.stringify(Object.keys(triSearchIndex), null, 2));

var overlapped = overlapCheck(triSearchIndex);
console.log('Mid: ' + JSON.stringify(overlapped, null, 2));

var tins = {forw: tin, bakw: bakTin}
Object.keys(overlapped.bakw).map(function(key) {
	if (overlapped.bakw[key] == 'Not include case') return;
	var trises = triSearchIndex[key];
	var forUnion = turf.union(trises[0].forw, trises[1].forw);
	var forConvex = turf.convex(turf.featureCollection([trises[0].forw, trises[1].forw]));
	var forDiff = turf.difference(forConvex, forUnion);
	if (forDiff) {
		console.log(key + ': ignore by foraward case');
		return;
	} else {
		console.log(key + ': OK go ahead');
		if (key == 'aa442-508') {
			console.log(JSON.stringify(trises[0].forw));
			console.log(JSON.stringify(trises[1].forw));		
			console.log(JSON.stringify(forUnion));
			console.log(JSON.stringify(forConvex));
			console.log(JSON.stringify(forDiff));
		}
	}
	var sharedVtx = key.split('-').map(function(val) { 
		var index = parseFloat(val);
		return ['a','b','c'].map(function(alpha, index) {
			var prop = trises[0].bakw.properties[alpha];
			var geom = trises[0].bakw.geometry.coordinates[0][index];
			return {geom: geom, prop: prop};
		}).filter(function (vtx) {
			return vtx.prop.index == index;
		})[0];
	});
	// console.log('WRAP: ' + JSON.stringify(wrapVtx));
	var nonSharedVtx = trises.map(function(tris) {
		return ['a','b','c'].map(function(alpha, index) {
			var prop = tris.bakw.properties[alpha];
			var geom = tris.bakw.geometry.coordinates[0][index];
			return {geom: geom, prop: prop};
		}).filter(function (vtx) {
			return vtx.prop.index != sharedVtx[0].prop.index &&
				vtx.prop.index != sharedVtx[1].prop.index;
		})[0];
	});
	// console.log('UNWRAP: ' + JSON.stringify(unwrapVtx));
	removeSearchIndex(triSearchIndex, trises[0], tins);
	removeSearchIndex(triSearchIndex, trises[1], tins);
	sharedVtx.map(function(sVtx) {
		var newTriCoords = [sVtx.geom, nonSharedVtx[0].geom, nonSharedVtx[1].geom, sVtx.geom];
		var cwCheck = isClockwise(newTriCoords);
		if (!cwCheck) newTriCoords = [sVtx.geom, nonSharedVtx[1].geom, nonSharedVtx[0].geom, sVtx.geom];
		var newTriProp = cwCheck ? {a: sVtx.prop, b:nonSharedVtx[0].prop, c:nonSharedVtx[1].prop } :
			{a: sVtx.prop, b:nonSharedVtx[1].prop, c:nonSharedVtx[0].prop };
		var newBakTri = turf.polygon([newTriCoords], newTriProp);
		var newForTri = counterTri(newBakTri);
		insertSearchIndex(triSearchIndex, {forw: newForTri, bakw: newBakTri}, tins);
	});
});
var newResult = overlapCheck(triSearchIndex);
console.log('Final: ' + JSON.stringify(newResult, null, 2));
fs.writeFileSync('Backward_true_after.json',JSON.stringify(bakTin, null, 2));

function counterTri(tri) {
    var coordinates = ['a', 'b', 'c', 'a'].map(function(key) {
        return tri.properties[key].geom;
    });
	var cwCheck = isClockwise(coordinates);
	if (cwCheck) coordinates = ['a', 'c', 'b', 'a'].map(function(key) {
        return tri.properties[key].geom;
    });
    //console.log(coordinates);
    var geoms = tri.geometry.coordinates[0];
    var props = tri.properties;
    var properties = !cwCheck ? {
    	a: {geom: geoms[0], index: props['a'].index},
    	b: {geom: geoms[1], index: props['b'].index},
    	c: {geom: geoms[2], index: props['c'].index}
    } : {
    	a: {geom: geoms[0], index: props['a'].index},
    	b: {geom: geoms[2], index: props['c'].index},
    	c: {geom: geoms[1], index: props['b'].index}
    };
    //console.log(properties);
    return turf.polygon([coordinates], properties);
}


function overlapCheck(searchIndex) {
	return Object.keys(searchIndex).reduce(function(prev, key) {
		var searchResult = searchIndex[key];
		if (searchResult.length < 2) return prev;
		['forw', 'bakw'].map(function (dir) {
			var result = turf.intersect(searchResult[0][dir], searchResult[1][dir]);
			if (!result || result.geometry.type == 'Point' || result.geometry.type == 'LineString') return;
			if (!prev[dir]) prev[dir] = {};
			var diff1 = turf.difference(searchResult[0][dir], result);
			var diff2 = turf.difference(searchResult[1][dir], result);
			if (!diff1 || !diff2) {
				prev[dir][key] = "Include case";
			} else {
				prev[dir][key] = "Not include case";
			}
		});
		return prev;
	}, {});
}

function insertSearchIndex(searchIndex, tris, tins) {
	var keys = calcSearchKeys(tris.forw);
	var bakKeys = calcSearchKeys(tris.bakw);
	if (JSON.stringify(keys) != JSON.stringify(bakKeys)) 
		throw JSON.stringify(tris, null, 2) + '\n' + JSON.stringify(keys) + '\n' + JSON.stringify(bakKeys);

	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		if (!searchIndex[key]) searchIndex[key] = [];
		searchIndex[key].push(tris);
	}
	if (tins) {
		tins.forw.features.push(tris.forw);
		tins.bakw.features.push(tris.bakw);
	}
}

function removeSearchIndex(searchIndex, tris, tins) {
	var keys = calcSearchKeys(tris.forw);
	var bakKeys = calcSearchKeys(tris.bakw);
	if (JSON.stringify(keys) != JSON.stringify(bakKeys)) 
		throw JSON.stringify(tris, null, 2) + '\n' + JSON.stringify(keys) + '\n' + JSON.stringify(bakKeys);

	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		var newArray = searchIndex[key].filter(function(eachTris) {
			return eachTris.forw != tris.forw;
		});
		if (newArray.length == 0) delete searchIndex[key];
		else searchIndex[key] = newArray;
	}
	if (tins) {
		var newArray = tins.forw.features.filter(function(eachTri) {
			return eachTri != tris.forw;
		});
		tins.forw.features = newArray;
		newArray = tins.bakw.features.filter(function(eachTri) {
			return eachTri != tris.bakw;
		});
		tins.bakw.features = newArray;
	}
}

function calcSearchKeys(tri) {
	var vtx = ['a','b','c'].map(function(key) {
		return tri.properties[key].index;
	});	
	return [[0, 1], [0, 2], [1, 2], [0, 1, 2]].map(function(set) {
		var index = set.map(function(i) {
			return vtx[i];
		}).sort(function(a, b) {
			return a - b;
		}).join('-');
		return index;
	}).sort();
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