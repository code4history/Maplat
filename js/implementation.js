var map    = [];
var marker = [[],[]];
var hereMarker = [];
var poi_data;

var hereIcon = L.icon({
    iconUrl: 'img/bluedot.png',
    iconSize: [34, 34],
    iconAnchor: [17, 17]
});

var tps = new ThinPlateSpline({
    'use_worker'         : true,
    'transform_callback' : function(coord, isRev, options) {
        //var tgtxy = tps.transform([srcxy.x,srcxy.y],target);
        var tgtll = map[isRev].xy2ll(new L.Point(coord[0],coord[1]));
        if (!options) {
            /*if (marker[isRev]) {
                marker[isRev].setLatLng(tgtll);
            } else {
                marker[isRev] = L.marker(tgtll).addTo(map[isRev]);
            }*/
        } else if (options.target == "here") {
            if (hereMarker[1]) {
                hereMarker[1].setLatLng(tgtll);
            } else {
                hereMarker[1] = L.marker(tgtll,{icon:hereIcon}).addTo(map[1]);
                map[1].setView(tgtll,5);
            }
        } else if (options.target == "drag") {
            map[isRev].panTo(tgtll);
        } else if (options.target == "marker") {
            var i = options.index;
            marker[1][i] = L.marker(tgtll).addTo(map[1]);
            marker[1][i].on("click",function(){
                showInfo(i);
            });
        }
    }
});

tps.load_points('../json/NaraOldMap1_points.json');
//tps.load_serial('kishiwada_resolved.bin');

var xyLayer = L.TileLayer.extend({
    // continuousWorld を trueにしたいだけ
    options: {
        minZoom: 0,
        maxZoom: 18,
        tileSize: 256,
        subdomains: 'abc',
        errorTileUrl: '',
        attribution: '',
        zoomOffset: 0,
        opacity: 1,
        continuousWorld: true,
        unloadInvisibleTiles: L.Browser.mobile,
        updateWhenIdle: L.Browser.mobile
    },

    _createTile: function () {
        var tile = L.DomUtil.create('img', 'leaflet-tile');
        //tile.style.width = tile.style.height = this._getTileSize() + 'px';
        tile.galleryimg = 'no';

        tile.onselectstart = tile.onmousemove = L.Util.falseFn;

        if (L.Browser.ielt9 && this.options.opacity !== undefined) {
            L.DomUtil.setOpacity(tile, this.options.opacity);
        }
        // without this hack, tiles disappear after zoom on Chrome for Android
        // https://github.com/Leaflet/Leaflet/issues/2078
        if (L.Browser.mobileWebkit3d) {
            tile.style.WebkitBackfaceVisibility = 'hidden';
        }
        return tile;
    },

    // just not to set image styles
    _createTileProto: function() {
        var img = this._tileImg = L.DomUtil.create('img', 'leaflet-tile');
        img.galleryimg = 'no';
    }
});

var myCrs = L.Util.extend({}, L.CRS, {
    code: 'XYMAP:0001',

    projection: {
        project: function(latlng) {
            return new L.Point(latlng.lng / 10, latlng.lat / 10);
        },
        unproject: function(point, unbounded) {
            return new L.LatLng(point.y * 10, point.x * 10, true);
        },
        fromXY2LL:function(point,maxPixelWidth,maxPixelHeight){
            var x_mod = point.x / maxPixelWidth;
            var lng = 10 * x_mod ;
            var y_mod = point.y / maxPixelHeight;
            var lat = 10 *  y_mod ;
            var rtn = new L.LatLng(lat,lng,true);
            return rtn;
        },
        fromLL2XY:function(ll,maxPixelWidth,maxPixelHeight){
            var rtn = new L.Point(
            (ll.lng / 10) * maxPixelWidth,
            (ll.lat / 10) * maxPixelHeight);
            return rtn;
        }
    },
    transformation: new L.Transformation(1,0,1,0)

});

var myMap = L.Map.extend({
    xy2ll:function(a,b){
        var point;
        if (a instanceof L.Point) {
            point = a;
        }else if (isArray(a)) {
            point = new L.Point(a[0], a[1]);
        }
        return this.options.crs.projection.fromXY2LL(point,this.options.maxPixelSize,this.options.maxPixelSize);
    },
    ll2xy:function(a,b){
        var ll;
        if (a instanceof L.LatLng) {
            ll = a;
        }else if (isArray(a)) {
            ll = new L.LatLng(a[0], a[1]);
        }
        return this.options.crs.projection.fromLL2XY(ll,this.options.maxPixelSize,this.options.maxPixelSize);
    }
});

var merMap = L.Map.extend({
	merc_max: 20037508.34,
	xy2ll:function(a, b) {
		var x, y;
        if (a instanceof L.Point) {
            y = a.y;
            x = a.x;
        }else if (isArray(a)) {
            y = a[1];
            x = a[0];
        }else {
        	y = b;
        	x = a;
        }
		x = (x / this.merc_max) * 180;
		y = (y / this.merc_max) * 180;
		y = 180 / Math.PI * (2 * Math.atan(Math.exp(y * Math.PI / 180)) - Math.PI / 2);
		return new L.LatLng(y,x,true);
	},
	ll2xy:function (a, b) {
		var x, y;
        if (a instanceof L.LatLng) {
            y = a.lat;
            x = a.lng;
        }else if (isArray(a)) {
            y = a[0];
            x = a[1];
        } else {
            y = a;
            x = b;
        }
		x = x * this.merc_max / 180;
		y = Math.log(Math.tan((90 + y) * Math.PI / 360)) / (Math.PI / 180);
		y *= this.merc_max / 180;
		return new L.Point(x,y);
	}
});

$(window).load(function(){
    $("#all").show();
    $("#info").hide();

    var baseLayer = new L.BingLayer("AgodEAYOPBDvCgvgOTnoo47nj-TQ1_vkjH6761FXyBGBYTiNf8gfluRvNEHoysig",{ type: 'Road' });
    //var tpsLayer  = new L.TileLayer('http://t.tilemap.jp/kishiwada/tps/{z}/{x}/{y}.png',{ tms: true, attribution: '和泉国岸和田城図 国立公文書館蔵' });;
    //var hlmLayer  = new L.TileLayer('http://t.tilemap.jp/kishiwada/hlm/{z}/{x}/{y}.png',{ tms: true, attribution: '和泉国岸和田城図 国立公文書館蔵' });;
    map[0] = new merMap('map1',
    {
        minZoom:13,
        maxZoom:17
    }).fitBounds([map1SW, map1NE]).addLayer(baseLayer);
    //map[0].on('click', function(e) { onMapClick(0,e); });
    map[0].on('dragend', function(e) { onMapDrag(0,e); });

    var xyMapUrl = "tiles/NaraOldMap1-{z}_{x}_{y}.jpg",
    xyMapAttr = '奈良市鳥瞰図 (1868年以降) Cartography Associates CC-BY-NC-SA 3.0';
    var xyMapLayer = new xyLayer(xyMapUrl,{minZoom: 0, maxZoom: map2MaxZoom, attribution: xyMapAttr});
    map[1] = new myMap('map2',
    {
        crs:myCrs,
        minZoom:0,
        maxZoom:map2MaxZoom,
        maxPixelSize: 256 * (1 << map2MaxZoom)
    }
    );
    map[1].addLayer(xyMapLayer);
    map[1].fitBounds([map[1].xy2ll(map2SW),map[1].xy2ll(map2NE)]);
    //map[1].on('click', function(e) { onMapClick(1,e); });
    map[1].on('dragend', function(e) { onMapDrag(1,e); });

    /*function onMapClick(clicked,e) {
        var target = 1 - clicked;
        if (marker[clicked]) {
            marker[clicked].setLatLng(e.latlng);
        } else {
            marker[clicked] = L.marker(e.latlng).addTo(map[clicked]);
        }
        var srcxy = map[clicked].ll2xy(e.latlng);
        var tgtxy = tps.transform([srcxy.x,srcxy.y],target);
    }*/

    function onMapDrag(dragged,e) {
        var target = 1 - dragged;
        var srcxy = map[dragged].ll2xy(map[dragged].getCenter());
        var tgtxy = tps.transform([srcxy.x,srcxy.y],target,{"target":"drag"});
    }


    $("#slider").on( 'input', function () {
        changeYear();
    } );
    $("#slider").val(2015);
    changeYear();

    navigator.geolocation.watchPosition(function(position){
        var latlng = new L.LatLng(position.coords.latitude,position.coords.longitude);
        if (hereMarker[0]) {
            hereMarker[0].setLatLng(latlng);
        } else {
            hereMarker[0] = L.marker(latlng,{icon:hereIcon}).addTo(map[0]);
            map[0].setView(latlng,17);
        }
        var merc = map[0].ll2xy(latlng);
        var tgtxy = tps.transform([merc.x,merc.y],1,{"target":"here"});            
    });

    var srcxy = map[0].ll2xy(map[0].getCenter());
    var tgtxy = tps.transform([srcxy.x,srcxy.y],1,{"target":"drag"});

    $.get("json/poi.json", function(data) {
        poi_data = data;
        for (var i=0; i < data.length; i++) {
            var latlng = new L.LatLng(data[i].lat,data[i].lng);
            var idx = i;
            marker[0][idx] = L.marker(latlng).addTo(map[0]);
            marker[0][idx].on("click",function(){
                showInfo(idx);
            });
            var merc = map[0].ll2xy(latlng);
            var tgtxy = tps.transform([merc.x,merc.y],1,{"target":"marker","index":idx});              
        }
    }, "json");



    $("#poi_back").on("click",function(){
        $("#all").show();
        $("#info").hide();
    });
});

function isArray(o){ 
    return Object.prototype.toString.call(o) === '[object Array]';
}

function changeYear() {
    var year = $("#slider").val();
    $("#year").text(year);
    if (year >= 1868) {
        $("#map1").show();
        $("#map2").hide();
    } else {
        $("#map2").show();
        $("#map1").hide();
    }
}

function showInfo(index) {
    var data = poi_data[index];
    $("#poi_name").text(data.name);
    $("#poi_img").src = data.image;
    $("#poi_address").text(data.address);
    $("#poi_desc").text(data.desc);
    $("#info").show();
    $("#all").hide();
}





