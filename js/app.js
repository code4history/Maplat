define(['jquery', 'aigle', 'histmap', 'sprintf', 'i18n', 'i18nxhr', 'ji18n', 'bootstrap', 'slick'],
    function($, Promise, ol, sprintf, i18n, i18nxhr, ji18n) {
    (function() {
        var mapDiv = document.getElementById('map_div');
        var lastTouch = 0;
        function preventZoom(e) {
            var t2 = e.timeStamp;
            var t1 = lastTouch || t2;
            var dt = t2 - t1;
            var fingers = e.touches.length;
            lastTouch = t2;

            if (!dt || dt >= 300 || fingers > 1) {
                return;
            }
            resetPreventZoom();
            e.preventDefault();
            e.target.click();
        }
        function resetPreventZoom() {
            lastTouch = 0;
        }

        mapDiv.addEventListener('touchstart', preventZoom, false);
        mapDiv.addEventListener('touchmove', resetPreventZoom, false);
    })();
    var LoggerLevel={
        ALL: -99,
        DEBUG: -1,
        INFO: 0,
        WARN: 1,
        ERROR: 2,
        OFF: 99
    };
    var Logger=function(level) {
        var self=this;
        self.level=isNaN(level) ? LoggerLevel.INFO : level;
        self.make();
    };
    Logger.prototype.make=function() {
        var self=this;
        for (var key in console) {
            var l=LoggerLevel[key.toUpperCase()];
            if(!l) {
                // l=LoggerLevel.OFF;
                continue;
            }
            if(self.level<=l) {
                if(Function.bind) {
                    Logger.prototype[key]=(
                        function(k) {
                            return console[k].bind(console);
                        }
                    )(key);
                }else{
                    Logger.prototype[key]=(
                        function(k) {
                            return console[k].apply(console, arguments);
                        }
                    )(key);
                }
            }else{
                Logger.prototype[key]=function() {
                };
            }
        }
    };
    var ellips = function() {
        var omitMark = '…';
        var omitLine = 2;
        var stringSplit = function(element) {
            var splitArr = element.text().split('');
            var joinString = '';
            for (var i = 0; i < splitArr.length; i++) {
                joinString += '<span>' + splitArr[i] + '</span>';
            }
            joinString += '<span class="omit-mark">' + omitMark + '</span>';
            element.html(joinString);
        };
        var omitCheck = function(element) {
            var thisSpan = element.children('span');
            var omitSpan = element.children('.omit-mark');
            var lineCount = 0;
            var omitCount;

            if(omitLine <= 0) {
                return;
            }

            thisSpan.hide();
            thisSpan.eq(0).show();
            omitSpan.show();
            var divHeight = element.height();
            var minimizeFont = false;
            for (var i = 1; i < thisSpan.length - 1; i++) {
                thisSpan.eq(i).show();
                if(element.height() > divHeight) {
                    if (!minimizeFont) {
                        minimizeFont = true;
                        element.addClass('minimize');
                    } else {
                        divHeight = element.height();
                        lineCount++;
                    }
                }
                if(lineCount >= omitLine) {
                    omitCount = i - 2;
                    break;
                }
                if(i >= thisSpan.length - 2) {
                    omitSpan.hide();
                    return;
                }
            }
            for (var i = omitCount; i < thisSpan.length - 1; i++) {
                thisSpan.eq(i).hide();
            }
        };
        for (var i = 0; i < $('.slick-item div').length; i++) {
            var element = $('.slick-item div').eq(i);
            stringSplit(element);
            omitCheck(element);
        }
    };
    return function(appOption) {
        var mapType = appOption.stroly ? 'stroly' : appOption.drumsey ? 'drumsey' : appOption.warper ? 'warper' : null;
        var appid = appOption.appid || (mapType ? appOption[mapType] : 'sample');
        var logger = new Logger(appOption.debug ? LoggerLevel.ALL : LoggerLevel.INFO);
        var lang = appOption.lang || 'ja';
        var overlay = appOption.overlay || false;
        if (overlay) {
            $('body').addClass('with-opacity');
            $('.opacity-slider').removeClass('hide');
            $('.opacity-slider input').prop('disabled', true);
        }
        var appPromise = mapType ?
            new Promise(function(resolve, reject) {
                var appData = {
                    fake_gps: false,
                    default_zoom: 17,
                    sources: [
                        'gsi',
                        'osm',
                        {
                            mapID: appid,
                            maptype: mapType,
                            algorythm: 'tin'
                        }
                    ],
                    pois: []
                };
                resolve(appData);
            }) : new Promise(function(resolve, reject) {
                $.get('json/' + appid + '.json', function(appData) {
                    resolve(appData);
                }, 'json').fail(function() {
                    console.log('error');
                });
            });

        var i18nPromise = new Promise(function(resolve, reject) {
            i18n.use(i18nxhr).init({
                lng: lang,
                fallbackLng: ['en'],
                backend: {
                    loadPath: 'locales/{{lng}}/{{ns}}.json'
                }
            }, function(err, t) {
                ji18n.init(i18n, $);
                $('body').localize();
                resolve([t, i18n]);
            });
        });

        var promises = Promise.all([i18nPromise, appPromise]);

        promises.then(function(result) {
            var appData = result[1];
            var i18n = result[0][1];
            var t = result[0][0];
            ol.source.HistMap.setI18n(i18n, t);

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
            var fakeRadius = appOption.fake ? appData.fake_radius : false;
            var currentPosition = null;
            var backMap = null;
            var mapDiv = 'map_div';
            var frontDiv = mapDiv + '_front';
            $('#' + mapDiv).prepend('<div id="' + frontDiv + '" class="map" style="top:0; left:0; right:0; bottom:0; ' +
                'position:absolute;"></div>');
            var mapObject = new ol.MaplatMap({
                div: frontDiv
            });
            var backDiv = null;
            if (overlay) {
                backDiv = mapDiv + '_back';
                $('#' + mapDiv).prepend('<div id="' + backDiv + '" class="map" style="top:0; left:0; right:0; bottom:0; ' +
                    'position:absolute;"></div>');
                backMap = new ol.MaplatMap({
                    off_control: true,
                    div: backDiv
                });
            }
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
            if (fakeGps) {
                $('#gps_etc').append(sprintf(t('app.fake_explanation'), fakeCenter, fakeRadius));
            } else {
                $('#gps_etc').append(t('app.acquiring_gps_desc'));
            }
            var pois = appData.pois;

            $('title').html(appName);

            var dataSource = appData.sources;

            var sourcePromise = [];
            var commonOption = {
                home_position: homePos,
                merc_zoom: defZoom,
                fake_gps: fakeGps ? fakeRadius : false
            };
            for (var i = 0; i < dataSource.length; i++) {
                var option = dataSource[i];
                sourcePromise.push(ol.source.HistMap.createAsync(option, commonOption));
            }

            Promise.all(sourcePromise).then(function(sources) {
                $('#loadWait').modal('hide');

                if (mapType) {
                    var index = sources.length - 1;
                    homePos = sources[index].home_position;
                    defZoom = sources[index].merc_zoom;
                    $('title').html(sources[index].title);
                }

                var cache = [];
                var cacheHash = {};
                var clickAvoid = false;
                for (var i=0; i<sources.length; i++) {
                    var source = sources[i];
                    $('.slick-class').slick('slickAdd', '<div class="slick-item" data="' + source.sourceID + '">' +
                        '<img crossorigin="anonymous" src="' + source.thumbnail + '"><div>' + source.label + '</div></div>');
                    if (i == sources.length - 1) $('.slick-class').slick('slickGoTo', sources.length - 1);
                    if (mapType) {
                        source.home_position = homePos;
                        source.merc_zoom = defZoom;
                    }
                    source._map = mapObject;
                    cache.push(source);
                    cacheHash[source.sourceID] = source;
                }
                ellips();

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

                var initial = cache[cache.length - 1];
                from = cache.reduce(function(prev, curr) {
                    if (prev) {
                        return !(prev instanceof ol.source.HistMap) && curr !== initial ? curr : prev;
                    }
                    if (curr !== initial) return curr;
                    return prev;
                }, null);
                changeMap(true, initial.sourceID);

                function convertParametersFromCurrent(to, callback) {
                    var view = mapObject.getView();
                    var fromPromise = from.size2MercsAsync();
                    var current = ol.MathEx.recursiveRound([
                        view.getCenter(), view.getZoom(), view.getRotation()
                    ], 10);
                    if (mercBuffer && mercBuffer.mercs && mercBuffer.buffer[from.sourceID]) {
                        var buffer = mercBuffer.buffer[from.sourceID];
                        if (buffer[0][0] == current[0][0] && buffer[0][1] == current[0][1] &&
                            buffer[1] == current[1] && buffer[2] == current[2]) {
                            logger.debug(buffer);
                            logger.debug(current);
                            logger.debug('From: Use buffer');
                            fromPromise = new Promise(function(res, rej) {
                                res(mercBuffer.mercs);
                            });
                        } else {
                            mercBuffer = {
                                buffer: {}
                            };
                            mercBuffer.buffer[from.sourceID] = current;
                        }
                    } else {
                        mercBuffer = {
                            buffer: {}
                        };
                        mercBuffer.buffer[from.sourceID] = current;
                    }
                    logger.debug('From: Center: ' + current[0] + ' Zoom: ' + current[1] + ' Rotation: ' + current[2]);
                    logger.debug('From: ' + from.sourceID);
                    fromPromise.then(function(mercs) {
                        mercBuffer.mercs = mercs;
                        logger.debug('Mercs: ' + mercs);
                        var toPromise = to.mercs2SizeAsync(mercs);
                        var key = to.sourceID;
                        if (mercBuffer.buffer[key]) {
                            logger.debug('To: Use buffer');
                            toPromise = new Promise(function(res, rej) {
                                res(mercBuffer.buffer[key]);
                            });
                        }
                        toPromise.then(function(size) {
                            logger.debug('To: Center: ' + size[0] + ' Zoom: ' + size[1] + ' Rotation: ' + size[2]);
                            logger.debug('To: ' + to.sourceID);
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
                            } else if (!init) {
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
                                            mapObject.setMarker(xy, {'datum': datum}, datum.icon);
                                        }
                                    });
                                })(pois[i]);
                            }
                            mapObject.updateSize();
                            mapObject.renderSync();
                            if (init == true) {
                                to.goHome();
                            } else if (backMap && backTo) {
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
                    $('#poi_img').attr('src',
                        data.image.match(/^http/) ? data.image : 'img/' + data.image);
                    $('#poi_address').text(data.address);
                    $('#poi_desc').html(data.desc.replace(/\n/g, '<br>'));
                    $('#poi_info').modal();
                }

                var clickHandler = function(evt) {
                    var feature = this.forEachFeatureAtPixel(evt.pixel,
                        function(feature) {
                            if (feature.get('datum')) return feature;
                        });
                    if (feature) {
                        showInfo(feature.get('datum'));
                    }
                };
                mapObject.on('click', clickHandler);

                // change mouse cursor when over marker
                var moveHandler = function(evt) {
                    var pixel = this.getEventPixel(evt.originalEvent);
                    var hit = this.hasFeatureAtPixel(pixel);
                    var target = this.getTarget();
                    if (hit) {
                        var feature = this.forEachFeatureAtPixel(evt.pixel,
                            function(feature) {
                                if (feature.get('datum')) return feature;
                            });
                        $('#' + target).css('cursor', feature ? 'pointer' : '');
                        return;
                    }
                    $('#' + target).css('cursor', '');
                };
                mapObject.on('pointermove', moveHandler);

                var mapOutHandler = function(evt) {
                    var histCoord = evt.frameState.viewState.center;
                    var source = this.getSource();
                    if (!source.insideCheckHistMapCoords(histCoord)) {
                        var xy = source.histMapCoords2Xy(histCoord);
                        var dx = xy[0] / (source.width / 2) - 1;
                        var dy = xy[1] / (source.height / 2) - 1;
                        var da = Math.max(Math.abs(dx), Math.abs(dy));
                        xy = [(dx / da + 1) * source.width / 2, (dy / da + 1) * source.height / 2];
                        histCoord = source.xy2HistMapCoords(xy);
                        this.getView().setCenter(histCoord);
                    }
                };
                mapObject.on('moveend', mapOutHandler);

                var backMapMove = function(evt) {
                    if (!backMap) return;
                    if (this._backMapMoving) {
                        logger.debug('Backmap moving skipped');
                        return;
                    }
                    var backSrc = backMap.getSource();
                    if (backSrc) {
                        this._backMapMoving = true;
                        logger.debug('Backmap moving started');
                        var self = this;
                        convertParametersFromCurrent(backSrc, function(size) {
                            var view = backMap.getView();
                            view.setCenter(size[0]);
                            view.setZoom(size[1]);
                            view.setRotation(size[2]);
                            logger.debug('Backmap moving ended');
                            self._backMapMoving = false;
                        });
                    }
                };
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
