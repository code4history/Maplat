require(["jquery", "histmap", "bootstrap"], function($, ol) {//"css!bootstrapcss", "css!ol3css"], function($, ol, tps) {
    /*var tps;
    var tpsPromise = new Promise(function(resolve, reject) {
        tps = new ThinPlateSpline({
            'use_worker'         : true,
            'transform_callback' : function(coord, isRev, options) {
                //var tgtxy = tps.transform([srcxy.x,srcxy.y],target);
                var tgtll = map[isRev].xy2ll(new L.Point(coord[0],coord[1]));
                if (!options) {
                    /*if (marker[isRev]) {
                        marker[isRev].setLatLng(tgtll);
                    } else {
                        marker[isRev] = L.marker(tgtll).addTo(map[isRev]);
                    }* /
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
                    var data = poi_data[options.index];
                    marker[1][options.index] = L.marker(tgtll).addTo(map[1]);
                    marker[1][options.index].on("click",function(){
                        showInfo(data);
                    });
                }
            }
        });
        tps.on_serialized = function() {
            resolve();
        };
        tps.load_serial('../bin/NaraOldMap1.bin');
    });*/

    var nowSourcePromise = ol.source.nowMap.createAsync({
        map_option: {
            div: "nowmap",
            default_center: [0,0],
            default_zoom: 2,
            default_rotation: 1
        }
    });
    var histSourcePromise = ol.source.histMap.createAsync({
        attributions: [
            new ol.Attribution({
                html: '奈良市鳥瞰図 (1868年以降) Cartography Associates CC-BY-NC-SA 3.0'
            })
        ],
        mapID: 'NaraOldMap1',
        width: 9618,
        height: 6786,
        tps_serial: '../bin/NaraOldMap1.bin',
        map_option: {
            div: "histmap",
            default_center: [-20037508, 20037508],
            default_zoom: 2
        }        
    });

    Promise.all([nowSourcePromise, histSourcePromise]).then(function(sources) {
        var nowMapSource = sources[0];
        var histMapSource = sources[1];

        var nowmap = nowMapSource.getMap();
        var histmap = histMapSource.getMap();

        $(".year_change").on( 'click', function () {
            var year = $(this).data('year');
            changeYear(year);
        } );
        changeYear(2015);
        function changeYear(year) {
            var fromSource;
            var toSource;
            var fromMap;
            var toMap;
            var fromDiv;
            var toDiv;
            if (year == 2015) {
                fromDiv    = "#histmapcontainer";
                toDiv      = "#nowmapcontainer";
                fromSource = histMapSource;
                toSource   = nowMapSource;
                fromMap    = histmap;
                toMap      = nowmap;
            } else {
                fromDiv    = "#nowmapcontainer";
                toDiv      = "#histmapcontainer";
                fromSource = nowMapSource;
                toSource   = histMapSource;
                fromMap    = nowmap;
                toMap      = histmap;
            }
            if ($(toDiv).is(':visible') && $(fromDiv).is(':hidden')) {
                return;
            }
            fromSource.size2MercsAsync().then(function(mercs){
                toSource.mercs2SizeAsync(mercs).then(function(size){
                    var view = toMap.getView();
                    view.setCenter(size[0]);
                    view.setZoom(size[1]);
                    view.setRotation(size[2]);
                    $(toDiv).show();
                    $(fromDiv).hide();
                    toMap.updateSize();
                    toMap.renderSync();
                });
            });
        }

    //年スライダー関連
    /*$("#slider").on( 'input', function () {
        changeYear();
    } );
    $("#slider").val(2015);
    changeYear();
    function changeYear() {
        console.log();
        var year = $("#slider").val();
        $("#year").text(year);
        if (year >= 1868) {
            $("#nowmapcontainer").show();
            $("#histmapcontainer").hide();
            nowmap.updateSize();
            nowmap.renderSync();
        } else {
            $("#histmapcontainer").show();
            $("#nowmapcontainer").hide();
            histmap.updateSize();
            histmap.renderSync();
        }
    }*/
    });
});