define(['aigle', 'histmap', 'sprintf', 'i18n', 'i18nxhr', 'swiper', 'bootstrap'],
    function(Promise, ol, sprintf, i18n, i18nxhr, swiper, bsn) {
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

    if ('ontouchstart' in window) {
        document.querySelector('body').classList.add('ol-touch');
    }

    Swiper.prototype.setSlideIndex = function(index) {
        this.slideTo(index + this.params.slidesPerView); // <= Maybe bug of swiper;
        this.setSlideIndexAsSelected(index);
    };
    Swiper.prototype.setSlideIndexAsSelected = function(index) {
        var sliders = this.container[0].querySelectorAll('.swiper-slide');
        for (var i=0; i<sliders.length; i++) {
            var slider = sliders[i];
            if (slider.getAttribute('data-swiper-slide-index') == index) {
                slider.classList.add('selected');
            } else {
                slider.classList.remove('selected');
            }
        }
    };

    var ellips = function() {
        var omitMark = '…';
        var omitLine = 2;
        var stringSplit = function(element) {
            var splitArr = element.innerText.split('');
            var joinString = '';
            for (var i = 0; i < splitArr.length; i++) {
                joinString += '<span>' + splitArr[i] + '</span>';
            }
            joinString += '<span class="omit-mark">' + omitMark + '</span>';
            element.innerHTML = joinString;
        };
        var omitCheck = function(element) {
            var thisSpan = element.querySelectorAll('span');
            var omitSpan = element.querySelector('.omit-mark');
            var lineCount = 0;
            var omitCount;

            if(omitLine <= 0) {
                return;
            }

            thisSpan[0].style.display = null;
            for (var i=1; i < thisSpan.length; i++) {
                thisSpan[i].style.display = 'none';
            }
            omitSpan.style.display = null;
            var divHeight = element.offsetHeight;
            var minimizeFont = false;
            for (var i = 1; i < thisSpan.length - 1; i++) {
                thisSpan[i].style.display = null;
                if(element.offsetHeight > divHeight) {
                    if (!minimizeFont) {
                        minimizeFont = true;
                        element.classList.add('minimize');
                    } else {
                        divHeight = element.offsetHeight;
                        lineCount++;
                    }
                }
                if(lineCount >= omitLine) {
                    omitCount = i - 2;
                    break;
                }
                if(i >= thisSpan.length - 2) {
                    omitSpan.style.display ='none';
                    return;
                }
            }
            for (var i = omitCount; i < thisSpan.length - 1; i++) {
                thisSpan[i].style.display = 'none';
            }
        };
        var swiperItems = document.querySelectorAll('.swiper-slide div');
        for (var i = 0; i < swiperItems.length; i++) {
            var swiperItem = swiperItems[i];
            stringSplit(swiperItem);
            omitCheck(swiperItem);
        }
    };
    var createElement = function(domStr) {
        var context = document,
            fragment = context.createDocumentFragment(),
            nodes = [],
            i = 0, tmp;

        // ダミーのDIV要素を作成して中にテキストを挿入
        tmp = fragment.appendChild( context.createElement('div'));
        tmp.innerHTML = domStr;

        for ( ; i < tmp.childNodes.length; i++) {
            // ダミーのDIV要素からHTML要素としてchildNodesで取り出せる
            var node = tmp.childNodes[i];

            // SCRIPT要素は新たに生成し直さなければ実行されない
            if (node.tagName && node.tagName.toLowerCase() === 'script') {
                var script = document.createElement('script');
                if (node.type) {
                    script.type = node.type;
                }
                if (node.src) {
                    script.src = node.src;
                } else {
                    script.text = node.text;
                }
                nodes[i] = script;
            } else {
                // SCRIPT以外の要素
                nodes[i] = node;
            }
        }

        // HTML要素配列を返す
        return nodes;
    };
    return function(appOption) {
        var mapType = appOption.stroly ? 'stroly' : appOption.drumsey ? 'drumsey' : appOption.warper ? 'warper' : null;
        var appid = appOption.appid || (mapType ? appOption[mapType] : 'sample');
        var mobileIF = false;
        var noUI = appOption.no_ui || false;
        if (appOption.mobile_if) {
            mobileIF = true;
            noUI = true;
            appOption.debug = true;
        }
        var logger = new Logger(appOption.debug ? LoggerLevel.ALL : LoggerLevel.INFO);
        var lang = appOption.lang || 'ja';
        var overlay = appOption.overlay || false;
        var noRotate = appOption.no_rotate || false;
        if (overlay) {
            document.querySelector('body').classList.add('with-opacity');
        }
        if (noUI) {
            document.querySelector('.swiper-container').style.display = 'none';
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
                var xhr = new XMLHttpRequest();
                xhr.open('GET', 'apps/' + appid + '.json', true);
                xhr.responseType = 'json';

                xhr.onload = function(e) {
                    if (this.status == 200) {
                        resolve(this.response);
                    } else {
                        resolve(this.response);
                    }
                };
                xhr.send();
            });

        var i18nPromise = new Promise(function(resolve, reject) {
            i18n.use(i18nxhr).init({
                lng: lang,
                fallbackLng: ['en'],
                backend: {
                    loadPath: 'locales/{{lng}}/{{ns}}.json'
                }
            }, function(err, t) {
                var i18nTargets =document.querySelectorAll('[data-i18n]');
                for (var i=0; i<i18nTargets.length; i++) {
                    var target = i18nTargets[i];
                    var key = target.getAttribute('data-i18n');
                    target.innerText = t(key);
                }

                resolve([t, i18n]);
            });
        });

        var promises = Promise.all([i18nPromise, appPromise]);

        return promises.then(function(result) {
            var appData = result[1];
            var i18n = result[0][1];
            var t = result[0][0];
            var baseSwiper, overlaySwiper;
            var changeMapCache;
            ol.source.HistMap.setI18n(i18n, t);

            document.querySelector('#all').style.display = null;
            if (!noUI) {
                var lwModalElm = document.getElementById('loadWait');
                var lwModal = new bsn.Modal(lwModalElm);
                lwModal.show();
                var slidesPerView = 1.4;
                baseSwiper = new Swiper('.base-swiper', {
                    slidesPerView: slidesPerView,
                    centeredSlides: true,
                    spaceBetween: 10,
                    loop: true,
                    onClick: function(sw, e) {
                        e.preventDefault();
                        if (!sw.clickedSlide) return;
                        var slide = sw.clickedSlide;
                        changeMapCache(false, slide.getAttribute('data'));
                        sw.setSlideIndexAsSelected(slide.getAttribute('data-swiper-slide-index'));
                    }
                });
                overlaySwiper = new Swiper('.overlay-swiper', {
                    slidesPerView: slidesPerView,
                    centeredSlides: true,
                    spaceBetween: 10,
                    loop: true,
                    onClick: function(sw, e) {
                        e.preventDefault();
                        if (!sw.clickedSlide) return;
                        var slide = sw.clickedSlide;
                        changeMapCache(false, slide.getAttribute('data'));
                        sw.setSlideIndexAsSelected(slide.getAttribute('data-swiper-slide-index'));
                    }
                });
            }

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
            var newElem = createElement('<div id="' + frontDiv + '" class="map" style="top:0; left:0; right:0; bottom:0; ' +
                'position:absolute;"></div>')[0];
            var elem = document.querySelector('#' + mapDiv);
            elem.insertBefore(newElem, elem.firstChild);
            var mapObject = new ol.MaplatMap({
                div: frontDiv,
                off_control: noUI ? true : false,
                off_rotation: noRotate ? true : false
            });
            var sliderCommon = mapObject.sliderCommon;
            sliderCommon.setEnable(false);

            var backDiv = null;
            if (overlay) {
                backDiv = mapDiv + '_back';
                var newElem = createElement('<div id="' + backDiv + '" class="map" style="top:0; left:0; right:0; bottom:0; ' +
                    'position:absolute;"></div>')[0];
                var elem = document.querySelector('#' + mapDiv);
                elem.insertBefore(newElem, elem.firstChild);
                backMap = new ol.MaplatMap({
                    off_control: true,
                    div: backDiv
                });
            }
            if (!noUI) {
                var shown = false;
                mapObject.on('gps_request', function() {
                    shown = true;
                    var gwModalElm = document.getElementById('gpsWait');
                    var gwModal = new bsn.Modal(gwModalElm);
                    gwModal.show();
                });
                mapObject.on('gps_result', function(evt) {
                    var result = evt.frameState;
                    if (result && result.error) {
                        currentPosition = null;
                        if (result.error == 'gps_out' && shown) {
                            shown = false;
                            var gwModalElm = document.getElementById('gpsWait');
                            var gwModal = new bsn.Modal(gwModalElm);
                            gwModal.hide();
                            document.querySelector('#gpsDialogTitle').innerText = t('app.out_of_map');
                            document.querySelector('#gpsDialogBody').innerText = t('app.out_of_map_desc');
                            var gdModalElm = document.getElementById('gpsDialog');
                            var gdModal = new bsn.Modal(gdModalElm);
                            gdModal.show();
                        }
                    } else {
                        currentPosition = result;
                    }
                    if (shown) {
                        shown = false;
                        var gwModalElm = document.getElementById('gpsWait');
                        var gwModal = new bsn.Modal(gwModalElm);
                        gwModal.hide();
                    }
                });
                if (fakeGps) {
                    var newElem = createElement(sprintf(t('app.fake_explanation'), fakeCenter, fakeRadius))[0];
                    var elem = document.querySelector('#gps_etc');
                    elem.appendChild(newElem);
                } else {
                    var newElem = createElement(t('app.acquiring_gps_desc'))[0];
                    var elem = document.querySelector('#gps_etc');
                    elem.appendChild(newElem);
                }
            }
            var pois = appData.pois;

            document.querySelector('title').innerHTML = appName;

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

            return Promise.all(sourcePromise).then(function(sources) {
                if (!noUI) {
                    var lwModalElm = document.getElementById('loadWait');
                    var lwModal = new bsn.Modal(lwModalElm);
                    lwModal.hide();
                }

                if (mapType) {
                    var index = sources.length - 1;
                    homePos = sources[index].home_position;
                    defZoom = sources[index].merc_zoom;
                    document.querySelector('title').innerHTML = sources[index].title;
                }

                var cache = [];
                var cacheHash = {};
                for (var i=0; i<sources.length; i++) {
                    var source = sources[i];
                    if (!noUI) {
                        if (source instanceof ol.source.NowMap && !(source instanceof ol.source.TmsMap)) {
                            baseSwiper.appendSlide('<div class="swiper-slide" data="' + source.sourceID + '">' +
                                '<img crossorigin="anonymous" src="' + source.thumbnail + '"><div>' + source.label + '</div></div>');
                        } else {
                            overlaySwiper.appendSlide('<div class="swiper-slide" data="' + source.sourceID + '">' +
                                '<img crossorigin="anonymous" src="' + source.thumbnail + '"><div>' + source.label + '</div></div>');
                        }
                    }
                    if (mapType) {
                        source.home_position = homePos;
                        source.merc_zoom = defZoom;
                    }
                    source._map = mapObject;
                    cache.push(source);
                    cacheHash[source.sourceID] = source;
                }
                if (!noUI) {
                    baseSwiper.on;
                    overlaySwiper.on;
                    //swiper.setSlideIndex(sources.length - 1);
                    ellips();
                }

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
                                // Overlay = true case:
                                backSrc = backMap.getSource(); // Get current source of background map
                                if (!(to instanceof ol.source.NowMap)) {
                                    // If new foreground source is nonlinear map:
                                    if (!backSrc) {
                                        // If current background source is not set, specify it
                                        backTo = now;
                                        if (from instanceof ol.source.NowMap) {
                                            backTo = from instanceof ol.source.TmsMap ?
                                                mapObject.getSource() :
                                                // If current foreground is TMS overlay, set current basemap as new background
                                                from; // If current foreground source is basemap, set current foreground as new background
                                        }
                                        backMap.exchangeSource(backTo);
                                    } else {
                                        // If current background source is set, use it again
                                        backTo = backSrc;
                                    }
                                } else if (to instanceof ol.source.NowMap) {
                                    // If new foreground source is basemap or TMS overlay, remove source from background map
                                    backMap.exchangeSource();
                                }
                                if (!(to instanceof ol.source.NowMap) || to instanceof ol.source.TmsMap) {
                                    // If new foreground is nonlinear map or TMS overlay, enable opacity slider
                                    sliderCommon.setEnable(true);
                                } else {
                                    // If new foreground is basemap, disable opacity slider
                                    sliderCommon.setEnable(false);
                                }
                                // Overlay = true case: end
                            }
                            if (to instanceof ol.source.TmsMap) {
                                // Foreground is TMS overlay case: set TMS as Layer
                                mapObject.setLayer(to);
                                // If current foreground is basemap then set it as basemap layer
                                if (!(from instanceof ol.source.NowMap)) mapObject.exchangeSource(backSrc || now);
                                sliderCommon.setEnable(true);
                            } else {
                                // Remove overlay from foreground and set current source to foreground
                                mapObject.setLayer();
                                mapObject.exchangeSource(to);
                            }

                            // This must be here: Because, render process works after view.setCenter,
                            // and Changing "from" content must be finished before "postrender" event
                            from = to;

                            var opacity = sliderCommon.get('slidervalue') * 100;
                            mapObject.setOpacity(opacity);
                            var view = mapObject.getView();
                            if (to.insideCheckHistMapCoords(size[0])) {
                                view.setCenter(size[0]);
                                view.setZoom(size[1]);
                                view.setRotation(size[2]);
                            } else if (!init) {
                                document.querySelector('#gpsDialogTitle').innerText = t('app.out_of_map');
                                document.querySelector('#gpsDialogBody').innerText = t('app.out_of_map_area');
                                var gdModalElm = document.getElementById('gpsDialog');
                                var gdModal = new bsn.Modal(gdModalElm);
                                gdModal.show();
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
                changeMapCache = changeMap;

                function showInfo(data) {
                    if (mobileIF) {
                        logger.debug(data);
                        var json = JSON.stringify(data);
                        jsBridge.callWeb2App('poiClick', json);
                    } else {
                        document.querySelector('#poi_name').innerText = data.name;
                        if (data.url) {
                            document.querySelector('#poi_web').classList.remove('hide');
                            document.querySelector('#poi_data').classList.add('hide');

                            document.querySelector('#poi_iframe').setAttribute('src', data.url);
                        } else {
                            document.querySelector('#poi_data').classList.remove('hide');
                            document.querySelector('#poi_web').classList.add('hide');

                            if (data.image && data.image != '') {
                                document.querySelector('#poi_img').setAttribute('src',
                                    data.image.match(/^http/) ? data.image : 'img/' + data.image);
                            } else {
                                document.querySelector('#poi_img').setAttribute('src', 'parts/no_image.png');
                            }
                            document.querySelector('#poi_address').innerText = data.address;
                            document.querySelector('#poi_desc').innerHTML = data.desc.replace(/\n/g, '<br>');
                        }
                        var piModalElm = document.getElementById('poi_info');
                        var piModal = new bsn.Modal(piModalElm);
                        piModal.show();
                    }
                }

                var clickHandler = function(evt) {
                    logger.debug(evt.pixel);
                    var feature = this.forEachFeatureAtPixel(evt.pixel,
                        function(feature) {
                            logger.debug(evt.pixel);
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
                        document.querySelector('#' + target).style.cursor = feature ? 'pointer' : '';
                        return;
                    }
                    document.querySelector('#' + target).style.cursor = '';
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

                sliderCommon.on('propertychange', function(evt) {
                    if (evt.key === 'slidervalue') {
                        mapObject.setOpacity(sliderCommon.get(evt.key) * 100);
                    }
                });

                if (mobileIF) return {
                    'setMarker': function(dataStr) {
                        logger.debug(dataStr);
                        var data = JSON.parse(dataStr);
                        var lat = data.latitude;
                        var long = data.longitude;
                        var x = data.x;
                        var y = data.y;
                        var src = mapObject.getSource();
                        var promise = (x && y) ?
                            new Promise(function(resolve) {
                                resolve(src.xy2HistMapCoords([x, y]));
                            }):
                            (function() {
                                var merc = ol.proj.transform([long, lat], 'EPSG:4326', 'EPSG:3857');
                                return src.merc2XyAsync(merc);
                            })();
                        var datum = data.data;
                        promise.then(function(xy) {
                            mapObject.setMarker(xy, {'datum': datum}, datum.icon);
                        });
                    }

                };
            });
        });
    };
});
