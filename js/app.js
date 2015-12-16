require(["jquery", "histmap", "bootstrap"], function($, ol) {//"css!bootstrapcss", "css!ol3css"], function($, ol, tps) {
    $("#all").show();
    $("#info").hide();

    var nowSourcePromise = ol.source.nowMap.createAsync({
        map_option: {
            div: "nowmap",
            default_center: [0,0],
            default_zoom: 2
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
            default_center: [-9365402.485897185, 9276725.549371911],
            default_zoom: 6
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

        function showInfo(data) {
            $("#poi_name").text(data.name);
            $("#poi_img").attr("src","img/" + data.image);
            $("#poi_address").text(data.address);
            $("#poi_desc").text(data.desc);
            $("#info").show();
            $("#all").hide();
        }

        $("#poi_back").on("click", function(){
            $("#all").show();
            $("#info").hide();
        });

        $.get("json/poi.json", function(data) {
            for (var i=0; i < data.length; i++) {
                (function(datum){
                    var lnglat = [datum.lng,datum.lat];
                    var merc = ol.proj.transform(lnglat, "EPSG:4326", "EPSG:3857");
                    var nowXyAsync = nowMapSource.merc2XyAsync(merc);
                    var histXyAsync = histMapSource.merc2XyAsync(merc);
                    Promise.all([nowXyAsync, histXyAsync]).then(function(xys){
                        nowmap.addOverlay(new ol.Overlay({
                            position: xys[0],
                            element: $('<img src="img/marker-blue.png">')
                                .css({marginTop: '-200%', marginLeft: '-50%', cursor: 'pointer'})
                                .on("click", function(){
                                    showInfo(datum);
                                })
                        }));
                        histmap.addOverlay(new ol.Overlay({
                            position: xys[1],
                            element: $('<img src="img/marker-blue.png">')
                                .css({marginTop: '-200%', marginLeft: '-50%', cursor: 'pointer'})
                                .on("click", function(){
                                    showInfo(datum);
                                })
                        }));                    
                    });
                })(data[i]);          
            }
        }, "json");
    });
});