require(["jquery", "histmap", "bootstrap"], function($, ol) {//"css!bootstrapcss", "css!ol3css"], function($, ol, tps) {
    $("#all").show();
    $("#info").hide();

    var from;
    var gps_process;
    var gps_callback = function(e) {
        gps_process(e);
    };
    var home_process;
    var home_callback = function(e) {
        home_process(e);
    };
    var home_pos = [141.149989,39.699952];

    var nowSourcePromise = ol.source.nowMap.createAsync({
        map_option: {
            div: "nowmap",
            default_center: [0,0],
            default_zoom: 2
        },
        gps_callback: gps_callback,
        home_callback: home_callback
    });
    var hist1SourcePromise = ol.source.histMap.createAsync({
        attributions: [
            new ol.Attribution({
                html: '安政年間上田城下町絵図 上田市マルチメディア情報センター'
            })
        ],
        mapID: 'sanada_ansei_1855_60',
        width: 8182,
        height: 6368,
        tps_serial: '../bin/sanada_ansei_1855_60.bin',
        tps_points: '../json/sanada_ansei_1855_60_points.json',
        map_option: {
            div: "hist1map",
            default_center: [-9365402.485897185, 9276725.549371911],
            default_zoom: 5,
        },
        gps_callback: gps_callback,
        home_callback: home_callback      
    });

    var hist2SourcePromise = ol.source.histMap.createAsync({
        attributions: [
            new ol.Attribution({
                html: '仙石氏在城時代上田城下町図 上田市マルチメディア情報センター'
            })
        ],
        mapID: 'sanada_genroku15_1702r',
        width: 6164,
        height: 4144,
        tps_serial: '../bin/sanada_genroku15_1702r.bin',
        tps_points: '../json/sanada_genroku15_1702r_points.json',
        map_option: {
            div: "hist2map",
            default_center: [-9365402.485897185, 9276725.549371911],
            default_zoom: 5
        },
        gps_callback: gps_callback,
        home_callback: home_callback        
    });

    var hist3SourcePromise = ol.source.histMap.createAsync({
        attributions: [
            new ol.Attribution({
                html: '仙石氏家臣屋敷割図（写） 上田市マルチメディア情報センター'
            })
        ],
        mapID: 'sanada_genroku15_1702yashikiwari',
        width: 5941,
        height: 4054,
        tps_serial: '../bin/sanada_genroku15_1702yashikiwari.bin',
        tps_points: '../json/sanada_genroku15_1702yashikiwari_points.json',
        map_option: {
            div: "hist3map",
            default_center: [-9365402.485897185, 9276725.549371911],
            default_zoom: 5
        },
        gps_callback: gps_callback,
        home_callback: home_callback        
    });

    var hist4SourcePromise = ol.source.histMap.createAsync({
        attributions: [
            new ol.Attribution({
                html: '本丸二の丸図（写） 上田市マルチメディア情報センター'
            })
        ],
        mapID: 'sanada_edomakki',
        width: 5516,
        height: 4459,
        tps_serial: '../bin/sanada_edomakki.bin',
        tps_points: '../json/sanada_edomakki_points.json',
        map_option: {
            div: "hist4map",
            default_center: [-9365402.485897185, 9276725.549371911],
            default_zoom: 5
        },
        gps_callback: gps_callback,
        home_callback: home_callback        
    });

    Promise.all([nowSourcePromise, hist1SourcePromise, hist2SourcePromise, hist3SourcePromise, hist4SourcePromise]).then(function(sources) {
        var nowMapSource = sources[0];
        var hist1MapSource = sources[1];
        var hist2MapSource = sources[2];
        var hist3MapSource = sources[3];
        var hist4MapSource = sources[4];

        var nowmap = nowMapSource.getMap();
        var hist1map = hist1MapSource.getMap();
        var hist2map = hist2MapSource.getMap();
        var hist3map = hist3MapSource.getMap();
        var hist4map = hist4MapSource.getMap();

        var nowgps = new ol.source.Vector({});
        var hist1gps = new ol.source.Vector({});
        var hist2gps = new ol.source.Vector({});
        var hist3gps = new ol.source.Vector({});
        var hist4gps = new ol.source.Vector({});        
        var cache = [
            [nowMapSource,   nowmap,   "#nowmapcontainer"],
            [hist1MapSource, hist1map, "#hist1mapcontainer"],
            [hist2MapSource, hist2map, "#hist2mapcontainer"],
            [hist3MapSource, hist3map, "#hist3mapcontainer"],
            [hist4MapSource, hist4map, "#hist4mapcontainer"]
        ];

        gps_process = function(e) {
            var geolocation = new ol.Geolocation({tracking:true});
            // listen to changes in position
            $('#gpsWait').modal();
            geolocation.once('change', function(evt) {
                var lnglat = geolocation.getPosition();
                lnglat = [home_pos[0] + (Math.random() - 0.5) / 1000,home_pos[1] + (Math.random() - 0.5) / 1000];
                geolocation.setTracking(false);
                var merc = ol.proj.transform(lnglat, "EPSG:4326", "EPSG:3857");
                for (var i=0;i<cache.length;i++) {
                    (function(){
                        var target = cache[i];
                        var source = target[0];
                        var view   = target[1].getView();
                        source.merc2XyAsync(merc).then(function(xy){
                            if (target == from) view.setCenter(xy);
                            source.setGPSPosition(xy);
                        });
                    })();
                }
                $('#gpsWait').modal('hide');
            });
        };

        home_process = function(e) {
            var merc = ol.proj.transform(home_pos, "EPSG:4326", "EPSG:3857");
            var source = from[0];
            var view   = from[1].getView();
            source.merc2XyAsync(merc).then(function(xy){
                view.setCenter(xy);
                view.setRotation(0);
            });
        }

        $(".year_change").on( 'click', function () {
            var year = $(this).data('year');
            changeYear(year);
        } );

        from = cache[1];

        var init = false;        
        changeYear(2016);

        function changeYear(year) {
            var to = cache[year == 2016 ? 0 : year == 1735 ? 2 : 1];
            if (to == from) return;
            if ($(to[2]).is(':visible') && $(from[2]).is(':hidden')) {
                return;
            }
            from[0].size2MercsAsync().then(function(mercs){
                console.log("CheckCheck;;;;;; " + mercs);
                to[0].mercs2SizeAsync(mercs).then(function(size){
                    var view = to[1].getView();
                    view.setCenter(size[0]);
                    view.setZoom(size[1]);
                    view.setRotation(size[2]);
                    $(to[2]).show();
                    for (var i=0;i<cache.length;i++) {
                        var div = cache[i];
                        if (div != to) {
                            $(div[2]).hide();
                        }
                    }
                    to[1].updateSize();
                    to[1].renderSync();
                    from = to;
                    if (init == false) {
                        init = true;
                        home_process();
                    }
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
                    var hist2XyAsync = hist2MapSource.merc2XyAsync(merc);
                    var hist3XyAsync = hist3MapSource.merc2XyAsync(merc);
                    var hist4XyAsync = hist4MapSource.merc2XyAsync(merc);
                    Promise.all([nowXyAsync, hist1XyAsync, hist2XyAsync, hist3XyAsync, hist4XyAsync]).then(function(xys){
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
                        hist2map.addOverlay(new ol.Overlay({
                            position: xys[2],
                            element: $('<img src="img/marker-blue.png">')
                                .css({marginTop: '-200%', marginLeft: '-50%', cursor: 'pointer'})
                                .on("click", function(){
                                    showInfo(datum);
                                })
                        }));
                        hist3map.addOverlay(new ol.Overlay({
                            position: xys[3],
                            element: $('<img src="img/marker-blue.png">')
                                .css({marginTop: '-200%', marginLeft: '-50%', cursor: 'pointer'})
                                .on("click", function(){
                                    showInfo(datum);
                                })
                        }));
                        hist4map.addOverlay(new ol.Overlay({
                            position: xys[4],
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