define(['jquery', 'histmap', 'sprintf', 'i18n', 'i18nxhr', 'ji18n', 'bootstrap', 'slick'],
    function($, ol, sprintf, i18n, i18nxhr, ji18n) {
    $.fn.nodoubletapzoom = function() {
        $(this).bind('touchstart', function preventZoom(e) {
            var t2 = e.timeStamp;
            var t1 = $(this).data('lastTouch') || t2;
            var dt = t2 - t1;
            var fingers = e.originalEvent.touches.length;
            $(this).data('lastTouch', t2);
            if (!dt || dt > 500 || fingers > 1) {
                return; // not double-tap
            }
            e.preventDefault(); // double tap - prevent the zoom
            // also synthesize click events we just swallowed up
            $(e.target).trigger('click');
        });
    };
    $('body').nodoubletapzoom();
    return function(appOption) {
        var appid = appOption.appid || appOption.stroly ? appOption.stroly : 'sample';
        var debug = appOption.debug ? function(val) {
            console.log(val);
        } : function() {};
        var lang = appOption.lang || 'ja';
        var overlay = appOption.overlay || false;
        if (overlay) {
            $('body').addClass('with-opacity');
            $('.opacity-slider').removeClass('hide');
            $('.opacity-slider input').prop('disabled', true);
        }
        var promises = [
            new Promise(function(resolve, reject) {
                if (appOption.stroly) {
                    var appData = {
                        fake_gps: false,
                        default_zoom: 17,
                        now_year: 2017,
                        now_era: '現在',
                        sources: [
                            {
                                attr: '国土地理院',
                                label: '地理院',
                                mapID: 'gsi',
                                maptype: 'base',
                                url: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'
                            },
                            {
                                mapID: appid,
                                maptype: 'stroly',
                                algorythm: 'tin',
                                label: '古地図'
                            }
                        ],
                        pois: []
                    };
                    resolve(appData);
                } else {
                    $.get('json/' + appid + '.json', function(appData) {
                        resolve(appData);
                    }, 'json').fail(function() {
                        console.log( "error" );
                    });
                }
            }),
            new Promise(function(res, rej) {
                i18n.use(i18nxhr).init({
                    lng: lang,
                    fallbackLng: ['en'],
                    backend: {
                        loadPath: 'locales/{{lng}}/{{ns}}.json'
                    }
                }, function(err, t) {
                    ji18n.init(i18n, $);
                    $('body').localize();
                    res(t);
                });
            })
        ];


        Promise.all(promises).then(function(result) {
            var appData = result[0];
            var t = result[1];

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
            var backMap = null;
            var mapDiv = 'map_div';
            var backDiv = null;
            if (overlay) {
                $('<div id="map_div_back" class="map" style="top:0; left:0; right:0; bottom:0; ' +
                    'position:absolute;"></div>').insertBefore('#center_circle');
                $('<div id="map_div_front" class="map" style="top:0; left:0; right:0; bottom:0; ' +
                    'position:absolute;"></div>').insertBefore('#center_circle');
                mapDiv = 'map_div_front';
                backDiv = 'map_div_back';
                backMap = new ol.MaplatMap({
                    off_control: true,
                    div: backDiv
                });
            }
            if (fakeGps) {
                $('#gps_etc').append(sprintf(t('app.fake_explanation'), fakeCenter, fakeRadius));
            } else {
                $('#gps_etc').append(t('app.acquiring_gps_desc'));
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
                        sourceID: 'osm',
                        label: t('app.osm_now')
                    }, commonOption)));
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
                                sourceID: data.sourceID,
                                label: data.label || data.year
                            }, commonOption)));
                        } else {
                            data.sourceID = data.mapID + ':' + data.maptype + ':' + data.algorythm;
                            sourcePromise.push(new Promise(function(resolve, reject) {
                                dataHash[data.sourceID] = data;
                                var option = Object.assign({
                                    attributions: [
                                        new ol.Attribution({
                                            html: data.attr
                                        })
                                    ],
                                    title: data.title || data.era,
                                    mapID: data.mapID,
                                    width: data.width,
                                    height: data.height,
                                    maptype: data.maptype,
                                    algorythm: data.algorythm,
                                    sourceID: data.sourceID,
                                    make_binary: makeBinary,
                                    label: data.label || data.year
                                }, commonOption);
                                resolve(ol.source.HistMap.createAsync(option));
                            }));
                        }
                    })(data);
                }
            }

            Promise.all(sourcePromise).then(function(sources) {
                $('#loadWait').modal('hide');

                if (appOption.stroly) {
                    homePos = sources[1].home_position;
                    $('title').html(sources[1].title);
                }

                var cache = [];
                var cacheHash = {};
                var clickAvoid = false;
                for (var i=0; i<sources.length; i++) {
                    var source = sources[i];
                    $('.slick-class').slick('slickAdd', '<div class="slick-item" data="' + source.sourceID + '">' +
                        '<img src="' + source.thumbnail + '"><div>' + source.label + '</div></div>');
                    if (i == sources.length - 1) $('.slick-class').slick('slickGoTo', sources.length - 1);
                    if (appOption.stroly) {
                        source.home_position = homePos;
                    }
                    if (!mapObject && !(source instanceof ol.source.TmsMap)) {
                        mapObject = source.getMap();
                        mapObject.on('gps_request', function() {
                            $('#gpsWait').modal();
                        });
                        mapObject.on('gps_result', function(evt) {
                            var shown = ($('#gpsWait').data('bs.modal') || {isShown: false}).isShown;
                            var result = evt.frameState;
                            if (result && result.error) {
                                currentPosition = null;
                                if (result.error == 'gps_out' && shown) {
                                    $('#gpsWait').modal('hide');
                                    $('#gpsDialogTitle').text(t('app.out_of_map'));
                                    $('#gpsDialogBody').text(t('app.out_of_map_desc'));
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

                function convertParametersFromCurrent(to, callback) {
                    var view = mapObject.getView();
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
                        debug('From: Center: ' + view.getCenter() + ' Zoom: ' + view.getZoom() + ' Rotation: ' + view.getRotation());
                        debug('From: ' + from.sourceID);
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
                            debug('To: ' + to.sourceID);
                            mercBuffer.buffer[to.sourceID] = ol.MathEx.recursiveRound(size, 10);
                            callback(size);
                        });
                    });
                }

                function changeMap(init, sourceID) {
                    var now = cacheHash['osm'];
                    var to = cacheHash[sourceID];
                    if ((to == from) && (to != now)) return;
                    if (to != from) {
                        convertParametersFromCurrent(to, function(size) {
                            var backSrc = null;
                            var backTo = null;
                            if (backMap) {
                                backSrc = backMap.getSource();
                                if (!(to instanceof ol.source.NowMap)) {
                                    if (!backSrc) {
                                        backTo = now;
                                        if (from instanceof ol.source.NowMap) {
                                            backTo = from instanceof ol.source.TmsMap ?
                                                mapObject.getSource() :
                                                from;
                                        }
                                        backMap.exchangeSource(backTo);
                                    } else {
                                        backTo = backSrc;
                                    }
                                } else if (to instanceof ol.source.NowMap) {
                                    backMap.exchangeSource();
                                }
                                if (!(to instanceof ol.source.NowMap) || to instanceof ol.source.TmsMap) {
                                    $('.opacity-slider input').removeProp('disabled');
                                } else {
                                    $('.opacity-slider input').prop('disabled', true);
                                }
                            }
                            if (to instanceof ol.source.TmsMap) {
                                mapObject.setLayer(to);
                                if (!(from instanceof ol.source.NowMap)) mapObject.exchangeSource(backSrc || now);
                                $('.opacity-slider input').removeProp('disabled');
                            } else {
                                mapObject.setLayer();
                                mapObject.exchangeSource(to);
                            }

                            // This must be here: Because, render process works after view.setCenter,
                            // and Changing "from" content must be finished before "postrender" event
                            from = to;

                            mapObject.setOpacity($('.opacity-slider input').val());
                            var view = mapObject.getView();
                            if (to.insideCheckHistMapCoords(size[0])) {
                                view.setCenter(size[0]);
                                view.setZoom(size[1]);
                                view.setRotation(size[2]);
                            } else {
                                $('#gpsDialogTitle').text(t('app.out_of_map'));
                                $('#gpsDialogBody').text(t('app.out_of_map_area'));
                                $('#gpsDialog').modal();
                                to.goHome();
                            }
                            to.setGPSMarker(currentPosition, true);
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
                            if (init == true) {
                                to.goHome();
                            }
                            if (backMap && backTo) {
                                convertParametersFromCurrent(backTo, function(size) {
                                    var view = backMap.getView();
                                    view.setCenter(size[0]);
                                    view.setZoom(size[1]);
                                    view.setRotation(size[2]);
                                    backMap.updateSize();
                                    backMap.renderSync();
                                });
                            }
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
                                function(feature) {
                                    if (feature.get('datum')) return feature;
                                });
                            $('#' + target).css('cursor', feature ? 'pointer' : '');
                            return;
                        }
                        $('#' + target).css('cursor', '');
                    };
                })(mapObject);
                mapObject.on('pointermove', moveHandler);

                var mapOutHandler = (function(map) {
                    return function(e) {
                        var histCoord = e.frameState.viewState.center;
                        var source = map.getSource();
                        if (!source.insideCheckHistMapCoords(histCoord)) {
                            var xy = source.histMapCoords2Xy(histCoord);
                            var dx = xy[0] / (source.width / 2) - 1;
                            var dy = xy[1] / (source.height / 2) - 1;
                            var da = Math.max(Math.abs(dx), Math.abs(dy));
                            xy = [(dx / da + 1) * source.width / 2, (dy / da + 1) * source.height / 2];
                            histCoord = source.xy2HistMapCoords(xy);
                            map.getView().setCenter(histCoord);
                        }
                    };
                })(mapObject);
                mapObject.on('moveend', mapOutHandler);

                var backMapMove = (function(map) {
                    return function(e) {
                        if (!backMap) return;
                        if (map._backMapMoving) {
                            debug('Backmap moving skipped');
                            return;
                        }
                        var backSrc = backMap.getSource();
                        if (backSrc) {
                            map._backMapMoving = true;
                            debug('Backmap moving started');
                            convertParametersFromCurrent(backSrc, function(size) {
                                var view = backMap.getView();
                                view.setCenter(size[0]);
                                view.setZoom(size[1]);
                                view.setRotation(size[2]);
                                debug('Backmap moving ended');
                                map._backMapMoving = false;
                            });
                        }
                    };
                })(mapObject);
                mapObject.on('postrender', backMapMove);

                var opacityChange = function() {
                    mapObject.setOpacity($('.opacity-slider input').val());
                };
                $('.opacity-slider input').on('input', opacityChange);
                $('.opacity-slider input').on('change', opacityChange);
            });
        });
    };
});
