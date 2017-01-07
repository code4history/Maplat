define(['jquery', 'ol-custom', 'bootstrap', 'slick'], function($, ol) {
    return function(appOption) {
        var appid = appOption.appid || 'sample';
        var appJson = 'json/' + appid + '.json';
        var debug = appOption.debug ? function(val) {
            console.log(val);
        } : function() {};
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
            var homePos = appData.home_position;
            var defZoom = appData.default_zoom;
            var appName = appData.app_name;
            var fakeGps = appOption.fake ? appData.fake_gps : false;
            var fakeCenter = appOption.fake ? appData.fake_center : false;
            var fakeRadius = appOption.fake ? appData.fake_radius :false;
            var makeBinary = appData.make_binary;
            var currentPosition = null;
            var mapObject = null;
            var mapDiv = 'map_div';
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
            var commonOption = {
                map_option: {
                    div: mapDiv
                },
                home_position: homePos,
                merc_zoom: defZoom,
                fake_gps: fakeGps ? fakeRadius : false
            };
            for (var i = 0; i <= dataSource.length; i++) {
                if (i == dataSource.length) {
                    sourcePromise.push(ol.source.NowMap.createAsync(Object.assign({
                        sourceID: 'osm'
                    }, commonOption)));
                    $('.slick-class').slick('slickAdd', '<div class="slick-item" data="osm">' +
                        '<img src="./tmbs/osm_menu.jpg"><div>OSM(現在)</div></div>');
                    $('.slick-class').slick('slickGoTo', dataSource.length);
                } else {
                    var data = dataSource[i];
                    if (!data.maptype) data.maptype = 'maplat';
                    if (!data.algorythm) data.algorythm = appOption.algorythm || 'tin';
                    (function(data) {
                        if (data.maptype == 'base' || data.maptype == 'overlay') {
                            data.sourceID = data.mapID;
                            var targetSrc = data.maptype == 'base' ? ol.source.NowMap : ol.source.TmsMap;
                            sourcePromise.push(targetSrc.createAsync(Object.assign({
                                attributions: [
                                    new ol.Attribution({
                                        html: data.attr
                                    })
                                ],
                                url: data.url,
                                sourceID: data.sourceID
                            }, commonOption)));
                        } else {
                            data.sourceID = data.mapID + ':' + data.maptype + ':' + data.algorythm;
                            sourcePromise.push(new Promise(function(res, rej) {
                                var laterLogic = function() {
                                    dataHash[data.sourceID] = data;
                                    var option = Object.assign({
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
                                        sourceID: data.sourceID
                                    }, commonOption);
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
                    })(data);
                }
            }

            Promise.all(sourcePromise).then(function(sources) {
                $('#loadWait').modal('hide');

                var cache = [];
                var cacheHash = {};
                var clickAvoid = false;
                for (var i=0; i<sources.length; i++) {
                    var source = sources[i];
                    if (!mapObject && !(source instanceof ol.source.TmsMap)) {
                        mapObject = source.getMap();
                        mapObject.on('gps_request', function () {
                            $('#gpsWait').modal();
                        });
                        mapObject.on('gps_result', function (evt) {
                            var shown = ($('#gpsWait').data('bs.modal') || {isShown: false}).isShown;
                            var result = evt.frameState;
                            if (result.error) {
                                currentPosition = null;
                                if (result.error == 'gps_out' && shown) {
                                    $('#gpsWait').modal('hide');
                                    $('#gpsDialogTitle').text('地図範囲外');
                                    $('#gpsDialogBody').text('GPSの取得結果が地図範囲外です。GPS機能をオフにします。');
                                    $('#gpsDialog').modal();
                                }
                            } else {
                                currentPosition = result;
                            }
                            if (shown) {
                                $('#gpsWait').modal('hide');
                            }
                        });
                    }
                    source._map = mapObject;
                    cache.push(source);
                    cacheHash[source.sourceID] = source;
                }

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
                    if (curr instanceof ol.source.HistMap) return curr;
                    return prev;
                }, null);
                changeMap(true, 'osm');

                function changeMap(init, sourceID) {
                    var now = cacheHash['osm'];
                    var to = cacheHash[sourceID];
                    if ((to == from) && (to != now)) return;
                    if (to != from) {
                        var view = mapObject.getView();
                        debug('From: Center: ' + view.getCenter() + ' Zoom: ' + view.getZoom() + ' Rotation: ' + view.getRotation());
                        var fromPromise = from.size2MercsAsync();
                        if (mercBuffer && mercBuffer.mercs && mercBuffer.buffer[from.sourceID]) {
                            var buffer = mercBuffer.buffer[from.sourceID];
                            var current = ol.MathEx.recursiveRound([
                                view.getCenter(), view.getZoom(), view.getRotation()
                            ], 10);
                            if (buffer[0][0] == current[0][0] && buffer[0][1] == current[0][1] &&
                                buffer[1] == current[1] && buffer[2] == current[2]) {
                                debug('From: Use buffer');
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
                            var view = mapObject.getView();
                            mercBuffer.buffer[from.sourceID] = ol.MathEx.recursiveRound([
                                view.getCenter(), view.getZoom(), view.getRotation()
                            ], 10);
                            debug('Mercs: ' + mercs);
                            var toPromise = to.mercs2SizeAsync(mercs);
                            var key = to.sourceID;
                            if (mercBuffer.buffer[key]) {
                                debug('To: Use buffer');
                                toPromise = new Promise(function(res, rej) {
                                    res(mercBuffer.buffer[key]);
                                });
                            }
                            toPromise.then(function(size) {
                                debug('To: Center: ' + [size[0][0], size[0][1]] + ' Zoom: ' + size[1] + ' Rotation: ' + size[2]);
                                mercBuffer.buffer[to.sourceID] = ol.MathEx.recursiveRound(size, 10);
                                if (to instanceof ol.source.TmsMap) {
                                    mapObject.setLayer(to);
                                    if (!(from instanceof ol.source.NowMap)) mapObject.exchangeSource(now);
                                } else {
                                    mapObject.setLayer();
                                    mapObject.exchangeSource(to);
                                }
                                var view = mapObject.getView();
                                if (to.insideCheckHistMapCoords(size[0])) {
                                    view.setCenter(size[0]);
                                    view.setZoom(size[1]);
                                    view.setRotation(size[2]);
                                    to.setGPSMarker(currentPosition, true);
                                } else {
                                    $('#gpsDialogTitle').text('地図範囲外');
                                    $('#gpsDialogBody').text('表示位置が地図範囲外です。地図標準位置に戻します。');
                                    $('#gpsDialog').modal();
                                    to.goHome();
                                }
                                mapObject.resetMarker();
                                for (var i = 0; i < pois.length; i++) {
                                    (function(datum) {
                                        var lngLat = [datum.lng, datum.lat];
                                        var merc = ol.proj.transform(lngLat, 'EPSG:4326', 'EPSG:3857');

                                        to.merc2XyAsync(merc).then(function(xy) {
                                            if (to.insideCheckHistMapCoords(xy)) {
                                                mapObject.setMarker(xy, {'datum': datum});
                                            }
                                        });
                                    })(pois[i]);
                                }
                                mapObject.updateSize();
                                mapObject.renderSync();
                                from = to;
                                if (init == true) {
                                    to.goHome();
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
                })(mapObject);
                mapObject.on('click', clickHandler);

                // change mouse cursor when over marker
                var moveHandler = (function(map) {
                    return function(e) {
                        var pixel = map.getEventPixel(e.originalEvent);
                        var hit = map.hasFeatureAtPixel(pixel);
                        var target = map.getTarget();
                        if (hit) {
                            var feature = map.forEachFeatureAtPixel(e.pixel,
                                function (feature) {
                                    if (feature.get('datum')) return feature;
                                });
                            $('#' + target).css('cursor', feature ? 'pointer' : '');
                            return;
                        }
                        $('#' + target).css('cursor', '');
                    };
                })(mapObject);
                mapObject.on('pointermove', moveHandler);
            });
        }, 'json');
    };
});
