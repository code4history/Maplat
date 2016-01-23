require(["jquery", "histmap", "jui", "bootstrap"], function($, ol) {//"css!bootstrapcss", "css!ol3css"], function($, ol, tps) {
    $("#all").show();
    $("#info").hide();
    $('#loadWait').modal();

    var from;
    var gps_process;
    var gps_callback = function(e) {
        gps_process(e);
    };
    var home_process;
    var home_callback = function(e) {
        home_process(e);
    };
    var home_pos = [136.188948,35.943469];

    function getDistance(lnglat1, lnglat2) {
        function radians(deg){
            return deg * Math.PI / 180;
        }

        return 6378.14 * Math.acos(Math.cos(radians(lnglat1[1]))* 
            Math.cos(radians(lnglat2[1]))*
            Math.cos(radians(lnglat2[0])-radians(lnglat1[0]))+
            Math.sin(radians(lnglat1[1]))*
            Math.sin(radians(lnglat2[1])));
    }

    var dataSource = [
        {
            "attr" : "住居表示実施前の町名 越前鯖江５万石 ふるさと史跡紹介 (2002年 鯖江地区まちづくり推進協議会 発行)",
            "mapID" : "sabae001",
            "width" : 1573,
            "height" : 2387,
            "era" : 1963
        },{
            "attr" : "平成14年現在の町名 越前鯖江５万石 ふるさと史跡紹介 (2002年 鯖江地区まちづくり推進協議会 発行)",
            "mapID" : "sabae003",
            "width" : 1655,
            "height" : 2440,
            "era" : 2002
        },{
            "attr" : "間部家入封以前の鯖江圖 越前鯖江５万石 ふるさと史跡紹介 (2002年 鯖江地区まちづくり推進協議会 発行)",
            "mapID" : "sabae004",
            "width" : 1649,
            "height" : 2450,
            "era" : 1720
        },{
            "attr" : "間部家入封經營落成後の鯖江圖 越前鯖江５万石 ふるさと史跡紹介 (2002年 鯖江地区まちづくり推進協議会 発行)",
            "mapID" : "sabae005",
            "width" : 1679,
            "height" : 2414,
            "era" : 1735
        },{
            "attr" : "明治維新前の鯖江圖 越前鯖江５万石 ふるさと史跡紹介 (2002年 鯖江地区まちづくり推進協議会 発行)",
            "mapID" : "sabae006",
            "width" : 1649,
            "height" : 2491,
            "era" : 1867
        },{
            "attr" : "大正三年頃の鯖江圖 越前鯖江５万石 ふるさと史跡紹介 (2002年 鯖江地区まちづくり推進協議会 発行)",
            "mapID" : "sabae007",
            "width" : 1640,
            "height" : 2475,
            "era" : 1914
        }
    ];
    var dataHash = {};

    var sourcePromise = [
        ol.source.nowMap.createAsync({
            map_option: {
                div: "nowmap",
                default_center: [0,0],
                default_zoom: 2
            },
            gps_callback: gps_callback,
            home_callback: home_callback
        })
    ];
    for (var i = 1; i <= dataSource.length; i++) {
        var data = dataSource[i-1];
        dataHash[data.era] = data;
        sourcePromise.push(
            ol.source.histMap.createAsync({
                attributions: [
                    new ol.Attribution({
                        html: data.attr
                    })
                ],
                mapID: data.mapID,
                width: data.width,
                height: data.height,
                tps_serial: '../bin/' + data.mapID + '.bin',
                //tps_points: '../json/' + data.mapID + '_points.json',
                map_option: {
                    div: "hist" + i + "map",
                    default_center: [-9365402.485897185, 9276725.549371911],
                    default_zoom: 4,
                },
                gps_callback: gps_callback,
                home_callback: home_callback      
            })
        );
    }

    Promise.all(sourcePromise).then(function(sources) {
        $('#loadWait').modal('hide');

        var cache = [];
        var cache_hash = {};
        for (var i=0; i<sources.length; i++) {
            var source = sources[i];
            var map = source.getMap();
            var cont = "#" + ( i == 0 ? "now" : "hist" + i ) + "mapcontainer";
            var item = [source, map, cont];
            cache.push(item);
            var data = i == 0 ? {"era" : 2016} : dataSource[i-1];
            cache_hash[data.era] = item;
        }

        gps_process = function(e) {
            var geolocation = new ol.Geolocation({tracking:true});
            // listen to changes in position
            $('#gpsWait').modal();
            geolocation.once('change', function(evt) {
                var lnglat = geolocation.getPosition();
                if (getDistance(home_pos,lnglat) > 10) {
                    lnglat = [home_pos[0] + (Math.random() - 0.5) / 1000,home_pos[1] + (Math.random() - 0.5) / 1000];
                }
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
        };

        $('#era_select').slider({
            min: 0,
            max: 6,
            step: 1,
            value: 6,
            change: function(e, ui) {
                changeMap();
            },
            // 4スライダーの初期化時に、その値をテキストボックスにも反映
            create: function(e, ui) {
                from = cache[1];
                changeMap(true);
            }
        });

        $("#map_type").change(function(){
            changeMap();
        });

        function changeMap(init) {
            var y_idx = $('#era_select').slider( "value" );
            var year = y_idx == 0 ? 1720 :
                       y_idx == 1 ? 1735 :
                       y_idx == 2 ? 1867 :
                       y_idx == 3 ? 1914 :
                       y_idx == 4 ? 1963 :
                       y_idx == 5 ? 2002 :
                                    2016;
            var type = $("#map_type").val();
            $("#era_show").val(year + "年");
            var now = cache_hash[2016];
            var to = type == "plat" ? cache_hash[year] : now;
            if (((to == from) || ($(to[2]).is(':visible') && $(from[2]).is(':hidden'))) && (to != now)) return;
            console.log(from[1].getLayers());
            console.log(to[1].getLayers());
            if (from == now) {
                var layers = from[1].getLayers();
                while (layers.getLength() > 2) {
                    layers.removeAt(1);
                    console.log("Remove!");
                }
            }
            if (to != from) {
                from[0].size2MercsAsync().then(function(mercs){
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
                        if (init == true) {
                            home_process();
                        }
                    });
                });
            }
            if (to == now && year != 2016) {
                var data = dataHash[year];
                var layers = to[1].getLayers();
                var layer = new ol.layer.Tile({
                    source: new ol.source.XYZ({
                        url: 'tiles/' + data.mapID + '_' + type + '/{z}/{x}/{-y}.png'
                    })
                });
                layers.insertAt(1, layer);
            }
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

        $.get("json/sabaepoi.json", function(data) {
            for (var i=0; i < data.length; i++) {
                (function(datum){
                    var lnglat = [datum.lng,datum.lat];
                    var merc = ol.proj.transform(lnglat, "EPSG:4326", "EPSG:3857");
                    var promise = [];
                    for (var i=0; i < cache.length; i++) {
                        promise.push(
                            cache[i][0].merc2XyAsync(merc)
                        );
                    }
                    Promise.all(promise).then(function(xys){
                        for (var i = 0; i < cache.length; i++) {
                            var map = cache[i][1];
                            map.addOverlay(new ol.Overlay({
                                position: xys[i],
                                element: $('<img src="img/marker-blue.png">')
                                    .css({marginTop: '-200%', marginLeft: '-50%', cursor: 'pointer'})
                                    .on("click", function(){
                                        showInfo(datum);
                                    })
                            }));
                        }
                    });
                })(data[i]);          
            }
        }, "json");
    });
});