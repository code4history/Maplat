require(["jquery", "ol-custom", "tps", "histmap", "bootstrap"], function($, ol, tps) {//"css!bootstrapcss", "css!ol3css"], function($, ol, tps) {
    var tps;
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
    });

    tpsPromise.then(function(result) {

        var histMapSource = new ol.source.histMap({
            attributions: [
                new ol.Attribution({
                    html: '奈良市鳥瞰図 (1868年以降) Cartography Associates CC-BY-NC-SA 3.0'
                })
            ],
            mapID: 'NaraOldMap1',
            width: 9618,
            height: 6786
        });

        console.log(histMapSource.getMapID());

        var histMapLayer = new ol.layer.Tile({
            source: histMapSource
        });

        var histmap = new ol.Map({
            layers: [
                histMapLayer
            ],
            target: 'histmap',
            //controls: ol.control.defaults({
            //    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
            //        collapsible: false
            //    })
            //}),
            view: new ol.View({
                //center: [-25860000, 4130000],
                center: [-20037508, 20037508],
                //center: [0,0],
                //rotation: Math.PI / 6,
                zoom: 2
            })
        });

        var nowmap = new ol.Map({
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            target: 'nowmap',
            view: new ol.View({
                center: [0, 0],
                zoom: 2,
                rotation: 1
            })
        });

        $(".year_change").on( 'click', function () {
            var year = $(this).data('year');
            console.log(year);
            changeYear(year);
        } );
        changeYear(2015);
        function changeYear(year) {
            if (year == 2015) {
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