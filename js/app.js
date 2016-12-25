require(['jquery', 'ol-custom', 'bootstrap', 'slick'], function($, ol) {
    var appJson = 'json/' + appid + '.json';
    $.get(appJson, function(appData) {
        $('#all').show();
        $('#loadWait').modal();
        $('.slick-class').slick({
            prevArrow: '',
            nextArrow: '',
            centerMode: true,
            focusOnSelect: true,
            slidesToScroll: 3,
            centerPadding: '40px'
        });

        var from;
        var mercBuffer = null;
        var gpsProcess;
        var gpsCallback = function(e) {
            gpsProcess(e);
        };
        var homeProcess;
        var homeCallback = function(e) {
            homeProcess(e);
        };
        var homePos = appData.home_position;
        var defZoom = appData.default_zoom;
        var appName = appData.app_name;
        var fakeGps = appData.fake_gps;
        var fakeCenter = appData.fake_center;
        var fakeRadius = appData.fake_radius;
        var makeBinary = appData.make_binary;
        if (fakeGps) {
            $('#gps_etc').append('※' + fakeCenter + '中心より' + fakeRadius +
                'km以上離れている場合は、' + fakeCenter + '中心周辺の疑似経緯度を発行します');
        } else {
            $('#gps_etc').append('GPSデータ取得中です');
        }
        var pois = appData.pois;

        $('title').html(appName);

        var dataSource = appData.sources;
        var dataHash = {};

        var sourcePromise = [];
        for (var i = 0; i <= dataSource.length; i++) {
            var div = 'map' + i;
            if (i == dataSource.length) {
                div = 'mapNow';
                sourcePromise.push(ol.source.NowMap.createAsync({
                    map_option: {
                        div: div
                    },
                    sourceID: 'osm',
                    gps_callback: gpsCallback,
                    home_callback: homeCallback
                }));
                $('.slick-class').slick('slickAdd', '<div class="slick-item" data="osm">' +
                    '<img src="./tmbs/osm_menu.jpg"><div>OSM(現在)</div></div>');
                $('.slick-class').slick('slickGoTo', dataSource.length);
            } else {
                var data = dataSource[i];
                if (!data.maptype) data.maptype = 'maplat';
                if (!data.algorythm) data.algorythm = appArgo || 'tin';
                if (data.maptype == 'base') div = null;
                (function(data, div) {
                    if (data.maptype == 'base') {
                        data.sourceID = data.mapID;
                        sourcePromise.push(ol.source.NowMap.createAsync({
                            map_option: {
                                div: 'mapNow'
                            },
                            attributions: [
                                new ol.Attribution({
                                    html: data.attr
                                })
                            ],
                            url: data.url,
                            sourceID: data.sourceID,
                            gps_callback: gpsCallback,
                            home_callback: homeCallback
                        }));
                    } else if (data.maptype == 'overlay') {
                        data.sourceID = data.mapID;
                        sourcePromise.push(ol.source.TmsMap.createAsync({
                            map_option: {
                                div: 'mapNow'
                            },
                            attributions: [
                                new ol.Attribution({
                                    html: data.attr
                                })
                            ],
                            url: data.url,
                            sourceID: data.sourceID,
                            gps_callback: gpsCallback,
                            home_callback: homeCallback
                        }));
                    } else {
                        data.sourceID = data.mapID + ':' + data.maptype + ':' + data.algorythm;
                        sourcePromise.push(new Promise(function(res, rej) {
                            var laterLogic = function() {
                                dataHash[data.sourceID] = data;
                                var option = {
                                    attributions: [
                                        new ol.Attribution({
                                            html: data.attr
                                        })
                                    ],
                                    mapID: data.mapID,
                                    width: data.width,
                                    height: data.height,
                                    maptype: data.maptype,
                                    algorythm: data.algorythm,
                                    sourceID: data.sourceID,
                                    map_option: {
                                        div: div
                                    },
                                    gps_callback: gpsCallback,
                                    home_callback: homeCallback
                                };
                                if (data.algorythm == 'tin') {
                                    option.tin_points_url = 'json/' + data.mapID + '_points.json';
                                } else {
                                    if (makeBinary) {
                                        option.tps_serial = data.mapID + '.bin';
                                        option.tps_points = '../json/' + data.mapID + '_points.json';
                                    } else {
                                        option.tps_serial = '../bin/' + data.mapID + '.bin';
                                    }
                                }
                                res(ol.source.HistMap.createAsync(option));
                            };
                            if (data.maptype == 'maplat') require(['histmap_' + data.algorythm], laterLogic);
                            else laterLogic();
                        }));
                    }
                    $('.slick-class').slick('slickAdd', '<div class="slick-item" data="' + data.sourceID + '">' +
                        '<img src="./tmbs/' + data.mapID + '_menu.jpg"><div>' + (data.label || data.year) + '</div></div>');
                })(data, div);
            }
            if (div) {
                $('<div id="' + div + 'container" class="col-xs-12 h100p mapcontainer w100p"><div id="' + div +
                    '" class="map h100p"></div></div>').insertBefore('#center_circle');
            }
        }

        Promise.all(sourcePromise).then(function(sources) {
            $('#loadWait').modal('hide');

            var cache = [];
            var cacheHash = {};
            var clickAvoid = false;
            var nowMap = null;
            for (var i=0; i<sources.length; i++) {
                var source = sources[i];
                var item;
                if (source instanceof ol.source.NowMap) {
                    if (!nowMap && !(source instanceof ol.source.TmsMap)) {
                        nowMap = source.getMap();
                    }
                    source._map = nowMap;
                    item = [source, nowMap, '#mapNowcontainer'];
                    if (!(source instanceof ol.source.TmsMap)) {
                        nowMap.exchangeSource(source);
                    }
                } else {
                    var map = source.getMap();
                    item = [source, map, '#map' + i + 'container'];
                }
                cache.push(item);
                cacheHash[source.sourceID] = item;
            }

            gpsProcess = function(e) {
                var geolocation = new ol.Geolocation({tracking: true});
                // listen to changes in position
                $('#gpsWait').modal();
                var handleGps = function(lnglat, acc) {
                    var mercs = null;
                    var filterBuffer = [];
                    for (var i=0; i<cache.length; i++) {
                        if (filterBuffer.indexOf(cache[i][1]) >= 0) continue;
                        filterBuffer.push(cache[i][1]);
                        (function() {
                            var target = cache[i];
                            var source = target[0];
                            var map = target[1];
                            var view = map.getView();
                            if (!mercs) {
                                mercs = source.mercsFromGPSValue(lnglat, acc);
                            }
                            Promise.all(mercs.map(function(merc, index) {
                                if (index == 5) return merc;
                                return source.merc2XyAsync(merc);
                            })).then(function(xys) {
                                var center = xys[0];
                                var news = xys.slice(1);

                                var ave = news.reduce(function(prev, curr, index) {
                                    var ret = prev + Math.sqrt(Math.pow(curr[0]-center[0], 2)+Math.pow(curr[1]-center[1], 2));
                                    return index==3 ? ret / 4.0 : ret;
                                }, 0);
                                if (target[1] == from[1]) view.setCenter(center);
                                map.setGPSPosition(center, ave);
                            });
                        })();
                    }
                };
                geolocation.once('change', function(evt) {
                    var lngLat = geolocation.getPosition();
                    var acc = geolocation.getAccuracy();
                    if (fakeGps && ol.MathEx.getDistance(homePos, lngLat) > fakeRadius) {
                        lngLat = [ol.MathEx.randomFromCenter(homePos[0], 0.001), ol.MathEx.randomFromCenter(homePos[1], 0.001)];
                        acc = ol.MathEx.randomFromCenter(15.0, 10);
                    }
                    geolocation.setTracking(false);
                    handleGps(lngLat, acc);
                    $('#gpsWait').modal('hide');
                });
                geolocation.once('error', function(evt) {
                    geolocation.setTracking(false);
                    if (fakeGps) {
                        var lnglat = [ol.MathEx.randomFromCenter(homePos[0], 0.001), ol.MathEx.randomFromCenter(homePos[1], 0.001)];
                        var acc = ol.MathEx.randomFromCenter(15.0, 10);
                        handleGps(lnglat, acc);
                    }
                    $('#gpsWait').modal('hide');
                });
            };

            homeProcess = function(e) {
                var merc = ol.proj.transform(homePos, 'EPSG:4326', 'EPSG:3857');
                var source = from[0];
                var view = from[1].getView();
                var mercs = source.mercsFromGivenZoom(merc, defZoom);
                source.mercs2SizeAsync(mercs).then(function(size) {
                    view.setCenter(size[0]);
                    view.setZoom(size[1]);
                    view.setRotation(0);
                });
            };

            $('.slick-item').on('click', function() {
                if (!clickAvoid) {
                    changeMap(false, $(this).attr('data'));
                }
            });
            $('.slick-class').on('beforeChange', function(ev, slick, currentSlide, nextSlide) {
                clickAvoid = currentSlide != nextSlide;
            });
            $('.slick-class').on('afterChange', function(ev, slick, currentSlide) {
                clickAvoid = false;
            });

            from = cache.reduce(function(prev, curr) {
                if (prev) return prev;
                if (curr[0] instanceof ol.source.HistMap) return curr;
                return prev;
            }, null);
            changeMap(true, 'osm');

            function changeMap(init, sourceID) {
                var now = cacheHash['osm'];
                var to = cacheHash[sourceID];
                if ((to == from) && (to != now)) return;
                /* if (from == now) {
                    var layers = from[1].getLayers();
                    //ここで以前はタイルマップを削除していた、POIレイヤを削除してしまうため一時保留、後日直す
                    //while (layers.getLength() > 2) {
                    //    layers.removeAt(1);
                    //}
                    if (init == true) {
                        home_process();
                    }
                } */
                if (to != from) {
                    var view = from[1].getView();
                    console.log('From: Center: ' + view.getCenter() + ' Zoom: ' + view.getZoom() + ' Rotation: ' + view.getRotation());
                    var fromPromise = from[0].size2MercsAsync();
                    if (mercBuffer && mercBuffer.mercs && mercBuffer.buffer[from[0].sourceID]) {
                        var buffer = mercBuffer.buffer[from[0].sourceID];
                        var current = ol.MathEx.recursiveRound([
                            view.getCenter(), view.getZoom(), view.getRotation()
                        ], 10);
                        if (buffer[0][0] == current[0][0] && buffer[0][1] == current[0][1] &&
                            buffer[1] == current[1] && buffer[2] == current[2]) {
                            console.log('From: Use buffer');
                            fromPromise = new Promise(function(res, rej) {
                                res(mercBuffer.mercs);
                            });
                        } else {
                            mercBuffer = {
                                buffer: {}
                            };
                        }
                    } else {
                        mercBuffer = {
                            buffer: {}
                        };
                    }

                    fromPromise.then(function(mercs) {
                        mercBuffer.mercs = mercs;
                        var view = from[1].getView();
                        mercBuffer.buffer[from[0].sourceID] = ol.MathEx.recursiveRound([
                            view.getCenter(), view.getZoom(), view.getRotation()
                        ], 10);
                        console.log('Mercs: ' + mercs);
                        var toPromise = to[0].mercs2SizeAsync(mercs);
                        var key = to[0].sourceID;
                        if (mercBuffer.buffer[key]) {
                            console.log('To: Use buffer');
                            toPromise = new Promise(function(res, rej) {
                                res(mercBuffer.buffer[key]);
                            });
                        }
                        toPromise.then(function(size) {
                            console.log('To: Center: ' + [size[0][0], size[0][1]] + ' Zoom: ' + size[1] + ' Rotation: ' + size[2]);
                            var toSrc = to[0];
                            var toMap = to[1];
                            var toDiv = to[2];
                            mercBuffer.buffer[toSrc.sourceID] = ol.MathEx.recursiveRound(size, 10);
                            if (toSrc instanceof ol.source.NowMap) {
                                if (toSrc instanceof ol.source.TmsMap) {
                                    toMap.setLayer(toSrc);
                                } else {
                                    toMap.setLayer();
                                    toMap.exchangeSource(toSrc);
                                }
                            }
                            var view = toMap.getView();
                            view.setCenter(size[0]);
                            view.setZoom(size[1]);
                            view.setRotation(size[2]);
                            $(toDiv).show();
                            for (var i=0; i<cache.length; i++) {
                                var div = cache[i];
                                if (div[2] != toDiv) {
                                    $(div[2]).hide();
                                }
                            }
                            toMap.updateSize();
                            toMap.renderSync();
                            from = to;
                            if (init == true) {
                                homeProcess();
                            }
                        });
                    });
                }
            }

            function showInfo(data) {
                $('#poi_name').text(data.name);
                $('#poi_img').attr('src', 'img/' + data.image);
                $('#poi_address').text(data.address);
                $('#poi_desc').html(data.desc.replace(/\n/g, '<br>'));
                $('#poi_info').modal();
            }

            $('#poi_back').on('click', function() {
                $('#all').show();
                $('#info').hide();
            });

            for (var i=0; i < pois.length; i++) {
                (function(datum) {
                    var lngLat = [datum.lng, datum.lat];
                    var merc = ol.proj.transform(lngLat, 'EPSG:4326', 'EPSG:3857');
                    var filterBuffer = [];
                    var filtered = cache.filter(function(item) {
                        if (filterBuffer.indexOf(item[1]) >= 0) return false;
                        filterBuffer.push(item[1]);
                        return true;
                    });
                    var promise = filtered.map(function(item) {
                        return item[0].merc2XyAsync(merc);
                    });
                    Promise.all(promise).then(function(xys) {
                        filtered.map(function(item, index) {
                            item[1].setMarker(xys[index], {'datum': datum});
                        });
                    });
                })(pois[i]);
            }

            for (var i = 0; i < cache.length; i++) {
                var map = cache[i][1];
                var clickHandler = (function(map) {
                    return function(evt) {
                        var feature = map.forEachFeatureAtPixel(evt.pixel,
                            function(feature) {
                                if (feature.get('datum')) return feature;
                            });
                        if (feature) {
                            showInfo(feature.get('datum'));
                        }
                    };
                })(map);
                map.on('click', clickHandler);

                // change mouse cursor when over marker
                var moveHandler = (function(map) {
                    return function(e) {
                        var pixel = map.getEventPixel(e.originalEvent);
                        var hit = map.hasFeatureAtPixel(pixel);
                        var target = map.getTarget();
                        if (hit) {
                            var feature = map.forEachFeatureAtPixel(e.pixel,
                                function(feature) {
                                    if (feature.get('datum')) return feature;
                                });
                            $('#' + target).css('cursor', feature ? 'pointer' : '');
                            return;
                        }
                        $('#' + target).css('cursor', '');
                    };
                })(map);
                map.on('pointermove', moveHandler);
            }
        });
    }, 'json');
});
