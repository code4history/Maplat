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
    var hist1SourcePromise = ol.source.histMap.createAsync({
        attributions: [
            new ol.Attribution({
                html: '南部領盛岡平城絵図 (1644年) 国立公文書館'
            })
        ],
        mapID: 'morioka_ndl',
        width: 5287,
        height: 4631,
        tps_serial: '../bin/morioka_ndl.bin',
        //tps_points: '../json/morioka_ndl_points.json',
        map_option: {
            div: "hist1map",
            default_center: [-9365402.485897185, 9276725.549371911],
            default_zoom: 5
        }        
    });

    Promise.all([nowSourcePromise, hist1SourcePromise]).then(function(sources) {
        var nowMapSource = sources[0];
        var hist1MapSource = sources[1];

        var nowmap = nowMapSource.getMap();
        var hist1map = hist1MapSource.getMap();

        $(".year_change").on( 'click', function () {
            var year = $(this).data('year');
            changeYear(year);
        } );
        changeYear(2016);
        function changeYear(year) {
            var fromSource;
            var toSource;
            var fromMap;
            var toMap;
            var fromDiv;
            var toDiv;
            if (year == 2016) {
                fromDiv    = "#hist1mapcontainer";
                toDiv      = "#nowmapcontainer";
                fromSource = hist1MapSource;
                toSource   = nowMapSource;
                fromMap    = hist1map;
                toMap      = nowmap;
            } else {
                fromDiv    = "#nowmapcontainer";
                toDiv      = "#hist1mapcontainer";
                fromSource = nowMapSource;
                toSource   = hist1MapSource;
                fromMap    = nowmap;
                toMap      = hist1map;
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

        $.get("json/iwatepoi.json", function(data) {
            for (var i=0; i < data.length; i++) {
                (function(datum){
                    var lnglat = [datum.lng,datum.lat];
                    var merc = ol.proj.transform(lnglat, "EPSG:4326", "EPSG:3857");
                    var nowXyAsync = nowMapSource.merc2XyAsync(merc);
                    var hist1XyAsync = hist1MapSource.merc2XyAsync(merc);
                    Promise.all([nowXyAsync, hist1XyAsync]).then(function(xys){
                        nowmap.addOverlay(new ol.Overlay({
                            position: xys[0],
                            element: $('<img src="img/marker-blue.png">')
                                .css({marginTop: '-200%', marginLeft: '-50%', cursor: 'pointer'})
                                .on("click", function(){
                                    showInfo(datum);
                                })
                        }));
                        hist1map.addOverlay(new ol.Overlay({
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