require(["jquery", "histmap", "bootstrap", "slick"], function($, ol) {//"css!bootstrapcss", "css!ol3css"], function($, ol, tps) {
    var app_json = "json/" + appid + ".json";
    $.get(app_json, function(app_data) {
        $("#all").show();
        $('#loadWait').modal();

        var from;
        var merc_buffer = null;
        var gps_process;
        var gps_callback = function(e) {
            gps_process(e);
        };
        var home_process;
        var home_callback = function(e) {
            home_process(e);
        };
        var home_pos = app_data.home_position;
        var def_zoom = app_data.default_zoom;
        var now_year = app_data.now_year;
        var now_era = app_data.now_era;
        var app_name = app_data.app_name;
        var fake_gps = app_data.fake_gps;
        var fake_center = app_data.fake_center;
        var fake_radius = app_data.fake_radius;
        var make_binary = app_data.make_binary;
        if (fake_gps) {
            $("#gps_etc").append("※" + fake_center + "中心より" + fake_radius + "km以上離れている場合は、" + fake_center + "中心周辺の疑似経緯度を発行します");
        } else {
            $("#gps_etc").append("GPSデータ取得中です");
        }
        var pois = app_data.pois;

        $("title").html(app_name);

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

        var dataSource = app_data.sources;
        var dataHash = {};

        var sourcePromise = [];
        for (var i = 0; i <= dataSource.length; i++) {
            var div = "map" + i;
            if (i == dataSource.length) {
                sourcePromise.push(ol.source.nowMap.createAsync({
                    map_option: {
                        div: div
                    },
                    gps_callback: gps_callback,
                    home_callback: home_callback
                }));
                $("#era_select").append('<option value="' + now_year + '" selected>' + now_era + '</option>');
            } else {
                var data = dataSource[i];
                dataHash[data.year] = data;
                var option = {
                    attributions: [
                        new ol.Attribution({
                            html: data.attr
                        })
                    ],
                    mapID: data.mapID,
                    width: data.width,
                    height: data.height,
                    map_option: {
                        div: div
                    },
                    gps_callback: gps_callback,
                    home_callback: home_callback      
                };
                if (make_binary) {
                    option.tps_serial = data.mapID + ".bin";
                    option.tps_points = '../json/' + data.mapID + '_points.json';
                } else {
                    option.tps_serial = '../bin/' + data.mapID + '.bin';
                }
                sourcePromise.push(ol.source.histMap.createAsync(option));
                $("#era_select").append('<option value="' + data.year + '">' + data.era + '</option>');
            }
            $('<div id="' + div + 'container" class="col-xs-12 h100p mapcontainer w100p"><div id="' + div + '" class="map h100p"></div></div>').insertBefore('#center_circle');
        }

        Promise.all(sourcePromise).then(function(sources) {
            $('.slick-class').slick({
                prevArrow: '',
                nextArrow: '',
                centerMode: true,
                focusOnSelect: true
            });

            $('#loadWait').modal('hide');

            var cache = [];
            var cache_hash = {};
            for (var i=0; i<sources.length; i++) {
                var source = sources[i];
                var map = source.getMap();
                map.on("movestart",function(){
                   console.log("Clear buffer");
                   merc_buffer = null;
                });
                var cont = "#map" + i + "container";
                var item = [source, map, cont];
                cache.push(item);
                var year = i == sources.length - 1 ? now_year : dataSource[i].year;
                cache_hash[year] = item;
            }

            gps_process = function(e) {
                var geolocation = new ol.Geolocation({tracking:true});
                // listen to changes in position
                $('#gpsWait').modal();
                geolocation.once('change', function(evt) {
                    var lnglat = geolocation.getPosition();
                    var acc    = geolocation.getAccuracy();
                    if (fake_gps && getDistance(home_pos,lnglat) > fake_radius) {
                        lnglat = [home_pos[0] + (Math.random() - 0.5) / 1000,home_pos[1] + (Math.random() - 0.5) / 1000];
                        acc    = 15.0 + (Math.random() -0.5) * 10;
                    }
                    geolocation.setTracking(false);
                    var mercs = null;
                    for (var i=0;i<cache.length;i++) {
                        (function(){
                            var target = cache[i];
                            var source = target[0];
                            var view   = target[1].getView();
                            if (!mercs) {
                                mercs = source.mercsFromGPSValue(lnglat,acc);
                            }
                            source.mercs2SizeAsync(mercs).then(function(size){
                                if (target == from) view.setCenter(size[0]);
                                source.setGPSPosition(size[0]);
                                view.setZoom(size[1]);
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
                var mercs  = source.mercsFromGivenZoom(merc, def_zoom);
                source.mercs2SizeAsync(mercs).then(function(size){
                    view.setCenter(size[0]);
                    view.setZoom(size[1]);
                    view.setRotation(0);
                });

                //source.merc2XyAsync(merc).then(function(xy){
                //    view.setCenter(xy);
                //    view.setRotation(0);
                //    view.setZoom(def_zoom);
                //});
            };

            $("#era_select").change(function(){
                changeMap();
            });

            $("#map_type").change(function(){
                changeMap();
            });

            from = cache[1];
            changeMap(true);

            function changeMap(init) {
                var year = $("#era_select").val();
                var type = $("#map_type").val();
                var now = cache_hash[now_year];
                var to = type == "plat" ? cache_hash[year] : now;
                //if (((to == from) || ($(to[2]).is(':visible') && $(from[2]).is(':hidden'))) && (to != now)) return;
                if ((to == from) && (to != now)) return;
                if (from == now) {
                    var layers = from[1].getLayers();
                    //ここで以前はタイルマップを削除していた、POIレイヤを削除してしまうため一時保留、後日直す
                    //while (layers.getLength() > 2) {
                    //    layers.removeAt(1);
                    //}
                    if (init == true) {
                        home_process();
                    }
                }
                if (to != from) {
                    var view = from[1].getView();
                    console.log("From: Center: " + view.getCenter() + " Zoom: " + view.getZoom() + " Rotation: " + view.getRotation());
                    var fromPromise = from[0].size2MercsAsync();
                    if (merc_buffer && merc_buffer.mercs) {
                        console.log("From: Use buffer");
                        fromPromise = new Promise(function(res, rej){
                            res(merc_buffer.mercs);
                        });
                    } else {
                        merc_buffer = {
                            buffer:{}
                        };
                    }

                    fromPromise.then(function(mercs){
                        merc_buffer.mercs = mercs;
                        var view = from[1].getView();
                        merc_buffer.buffer[from[0].mapID ? from[0].mapID : 'nowMap'] = [
                            view.getCenter(), view.getZoom(), view.getRotation()
                        ];
                        console.log("Mercs: " + mercs);
                        var toPromise = to[0].mercs2SizeAsync(mercs);
                        var key = to[0].mapID ? to[0].mapID : 'nowMap';
                        if (merc_buffer.buffer[key]) {
                            console.log("To: Use buffer");
                            toPromise = new Promise(function(res, rej){
                                res(merc_buffer.buffer[key]);
                            });
                        } else {
                            to[1].AvoidFirstMoveStart = true;
                        }
                        toPromise.then(function(size){
                            console.log("To: Center: " + size[0] + " Zoom: " + size[1] + " Rotation: " + size[2]);
                            var view = to[1].getView();
                            view.setCenter(size[0]);
                            view.setZoom(size[1]);
                            view.setRotation(size[2]);
                            $(to[2]).show();
                            //$(to[2]).css("z-index", 100);
                            for (var i=0;i<cache.length;i++) {
                                var div = cache[i];
                                if (div != to) {
                                    $(div[2]).hide();
                                    //$(div[2]).css("z-index", 0);
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
                if (to == now && year != now_year) {
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
                $("#poi_desc").html(data.desc.replace(/\n/g,"<br>"));
                $('#poi_info').modal();
            }

            $("#poi_back").on("click", function(){
                $("#all").show();
                $("#info").hide();
            });

            for (var i=0; i < pois.length; i++) {
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
                            var map = cache[i][0];
                            map.setMarker(xys[i],{"datum":datum});
                        }
                    });
                })(pois[i]);          
            }

            for (var i = 0; i < cache.length; i++) {
                var map = cache[i][1];
                var click_handler = (function(map){
                    return function(evt) {
                        var feature = map.forEachFeatureAtPixel(evt.pixel,
                            function (feature) {
                                if (feature.get('datum')) return feature;
                            });
                        if (feature) {
                            showInfo(feature.get('datum'));
                        }
                    };
                })(map);
                map.on('click', click_handler);

                // change mouse cursor when over marker
                var move_handler = (function(map){
                    return function(e) {
                        var pixel = map.getEventPixel(e.originalEvent);
                        var hit = map.hasFeatureAtPixel(pixel);
                        var target = map.getTarget();
                        $("#"+target).css("cursor", hit ? 'pointer' : '');
                    };
                })(map);
                map.on('pointermove', move_handler);
            }            
        });

    }, "json");
});