define(['histmap', 'i18n', 'i18nxhr'], function(ol, i18n, i18nxhr) {
    var browserLanguage = function() {
        var ua = window.navigator.userAgent.toLowerCase();
        try {
            // Chrome
            if( ua.indexOf( 'chrome' ) != -1 ) {
                var lang = (navigator.languages[0] || navigator.browserLanguage || navigator.language || navigator.userLanguage).split(';');
                return lang[0];
            }
            // Other
            else {
                var lang = (navigator.browserLanguage || navigator.language || navigator.userLanguage).split(';');
                return lang[0];
            }
        }
        catch( e ) {
            return undefined;
        }
    };

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
                            return console.log.bind(console);
                        }
                    )(key);
                }else{
                    Logger.prototype[key]=(
                        function(k) {
                            return console.log.apply(console, arguments);
                        }
                    )(key);
                }
            }else{
                Logger.prototype[key]=function() {
                };
            }
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

        for (; i < tmp.childNodes.length; i++) {
            // ダミーのDIV要素からHTML要素としてchildNodesで取り出せる
            var node = tmp.childNodes[i];

            // SCRIPT要素は新たに生成し直さなければ実行されない
            if (node.tagName && node.tagName.toLowerCase() === 'script') {
                var script = context.createElement('script');
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

    var CustomEvent = function(event, data) {
        var evt = document.createEvent( 'CustomEvent' );
        evt.initCustomEvent(event, false, false, data);
        return evt;
    };
    CustomEvent.prototype = window.Event.prototype;

    var normalizeDegree = function(degree) {
        while (1) {
            if (degree <= 180 && degree > -180) break;
            var times = degree > 0 ? -1.0 : 1.0;
            degree = degree + times * 360.0;
        }
        return degree;
    };

    // Maplat App Class
    var MaplatApp = function(appOption) {
        var app = this;
        app.initialRestore = {};

        ol.events.EventTarget.call(app);

        var appid = app.appid = appOption.appid || 'sample';
        app.mapDiv = appOption.div || 'map_div';
        app.mapDivDocument = document.querySelector('#' + app.mapDiv);
        app.mapDivDocument.classList.add('maplat');
        app.logger = new Logger(appOption.debug ? LoggerLevel.ALL : LoggerLevel.INFO);
        app.cacheEnable = appOption.cache_enable || false;
        app.stateBuffer = {};
        var setting = appOption.setting;
        var lang = appOption.lang;
        if (!lang) {
            lang = browserLanguage();
        }
        if (lang.toLowerCase() == 'zh-hk' || lang.toLowerCase() == 'zh-hant') lang = 'zh-TW';

        if (appOption.restore) {
            if (appOption.restore_session) app.restoreSession = true;
            app.initialRestore = appOption.restore;
        } else if (appOption.restore_session) {
            app.restoreSession = true;
            var lastEpoch = parseInt(localStorage.getItem('epoch') || 0);
            var currentTime = Math.floor(new Date().getTime() / 1000);
            if (lastEpoch && currentTime - lastEpoch < 3600) {
                app.initialRestore.sourceID = localStorage.getItem('sourceID');
                app.initialRestore.backgroundID = localStorage.getItem('backgroundID') || localStorage.getItem('backID');
                app.initialRestore.position = {
                    x: parseFloat(localStorage.getItem('x')),
                    y: parseFloat(localStorage.getItem('y')),
                    zoom: parseFloat(localStorage.getItem('zoom')),
                    rotation: parseFloat(localStorage.getItem('rotation'))
                };
                app.initialRestore.transparency = parseFloat(localStorage.getItem('transparency') || 0);
            }
        }

        // Add UI HTML Element
        var newElems = createElement('<img id="center_circle" class="prevent-default" ' +
            'style="position:absolute;top:50%;left:50%;margin-top:-10px;' +
            'margin-left:-10px;" src="./parts/redcircle.png">');
        for (var i=newElems.length - 1; i >= 0; i--) {
            app.mapDivDocument.insertBefore(newElems[i], app.mapDivDocument.firstChild);
        }
        var prevDefs = app.mapDivDocument.querySelectorAll('.prevent-default');
        for (var i=0; i<prevDefs.length; i++) {
            var target = prevDefs[i];
            target.addEventListener('touchstart', function(evt) {
                evt.preventDefault();
            });
        }

        var overlay = 'overlay' in appOption ? appOption.overlay : true;
        var noRotate = appOption.no_rotate || false;
        if (overlay) {
            app.mapDivDocument.classList.add('with-opacity');
        }
        var appPromise = setting ? Promise.resolve(setting) :
            new Promise(function(resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', 'apps/' + appid + '.json', true);
                xhr.responseType = 'json';

                xhr.onload = function(e) {
                    var value = this.response;
                    if (typeof value != 'object') value = JSON.parse(value);
                    resolve(value);
                    /* if (this.status == 200) {
                        resolve(this.response);
                    } else {
                        resolve(this.response);
                    }*/
                };
                xhr.send();
            });

        app.waitReady = appPromise.then(function(result) {
            app.appData = result;

            if (!lang && app.appData.lang) {
                lang = app.appData.lang;
            }

            var i18nPromise = new Promise(function(resolve, reject) {
                i18n.use(i18nxhr).init({
                    lng: lang,
                    fallbackLng: ['en'],
                    backend: {
                        loadPath: 'locales/{{lng}}/{{ns}}.json'
                    }
                }, function(err, t) {
                    resolve([t, i18n]);
                });
            });

            return i18nPromise.then(function(result) {
                app.i18n = result[1];
                app.t = result[0];

                app.mercBuffer = null;
                var homePos = app.appData.home_position;
                var defZoom = app.appData.default_zoom;
                var zoomRestriction = app.appData.zoom_restriction;
                var mercMinZoom = app.appData.min_zoom;
                var mercMaxZoom = app.appData.max_zoom;
                app.appName = app.appData.app_name;
                var fakeGps = appOption.fake ? app.appData.fake_gps : false;
                var fakeRadius = appOption.fake ? app.appData.fake_radius : false;
                app.appLang = app.appData.lang || 'ja';
                app.currentPosition = null;
                app.backMap = null;
                app.__init = true;

                app.dispatchEvent(new CustomEvent('uiPrepare'));

                var frontDiv = app.mapDiv + '_front';
                var newElem = createElement('<div id="' + frontDiv + '" class="map" style="top:0; left:0; right:0; bottom:0; ' +
                    'position:absolute;"></div>')[0];
                app.mapDivDocument.insertBefore(newElem, app.mapDivDocument.firstChild);
                app.mapObject = new ol.MaplatMap({
                    div: frontDiv,
                    controls: app.appData.controls || [],
                    interactions: ol.interaction.defaults().extend([
                        new ol.interaction.DragRotateAndZoom({
                            condition: ol.events.condition.altKeyOnly
                        })
                    ]),
                    off_rotation: noRotate ? true : false
                });

                var backDiv = null;
                if (overlay) {
                    backDiv = app.mapDiv + '_back';
                    newElem = createElement('<div id="' + backDiv + '" class="map" style="top:0; left:0; right:0; bottom:0; ' +
                        'position:absolute;"></div>')[0];
                    app.mapDivDocument.insertBefore(newElem, app.mapDivDocument.firstChild);
                    app.backMap = new ol.MaplatMap({
                        off_control: true,
                        div: backDiv
                    });
                }

                app.startFrom = app.appData.start_from;
                app.lines = [];

                var pois = app.appData.pois || [];
                var poisWait;
                if (typeof pois == 'string') {
                    poisWait = new Promise(function(resolve, reject) {
                        var url = pois.match(/\//) ? pois : 'pois/' + pois;

                        var xhr = new XMLHttpRequest();
                        xhr.open('GET', url, true);
                        xhr.responseType = 'json';

                        xhr.onload = function (e) {
                            if (this.status == 200 || this.status == 0) { // 0 for UIWebView
                                try {
                                    var resp = this.response;
                                    if (typeof resp != 'object') resp = JSON.parse(resp);
                                    app.pois = resp;
                                    resolve();
                                } catch (err) {
                                    reject(err);
                                }
                            } else {
                                reject('Fail to load poi json');
                            }
                        };
                        xhr.send();
                    });
                } else {
                    app.pois = pois;
                    poisWait = Promise.resolve();
                }

                return poisWait.then(function() {
                    var dataSource = app.appData.sources;
                    var sourcePromise = [];
                    var commonOption = {
                        home_position: homePos,
                        merc_zoom: defZoom,
                        zoom_restriction: zoomRestriction,
                        merc_min_zoom: mercMinZoom,
                        merc_max_zoom: mercMaxZoom,
                        fake_gps: fakeGps ? fakeRadius : false,
                        cache_enable: app.cacheEnable,
                        translator: function(fragment) {
                            return app.translate(fragment);
                        }
                    };
                    for (var i = 0; i < dataSource.length; i++) {
                        var option = dataSource[i];
                        sourcePromise.push(ol.source.HistMap.createAsync(option, commonOption));
                    }

                    return Promise.all(sourcePromise).then(function (sources) {
                        app.mercSrc = sources.reduce(function (prev, curr) {
                            if (prev) return prev;
                            if (curr instanceof ol.source.NowMap) return curr;
                        }, null);

                        var cache = [];
                        app.cacheHash = {};
                        for (var i = 0; i < sources.length; i++) {
                            var source = sources[i];
                            source._map = app.mapObject;
                            cache.push(source);
                            app.cacheHash[source.sourceID] = source;
                        }

                        app.dispatchEvent(new CustomEvent('sourceLoaded', sources));

                        var initial = app.initialRestore.sourceID || app.startFrom || cache[cache.length - 1].sourceID;
                        app.from = cache.reduce(function (prev, curr) {
                            if (prev) {
                                return !(prev instanceof ol.source.HistMap) && curr.sourceID != initial ? curr : prev;
                            }
                            if (curr.sourceID != initial) return curr;
                            return prev;
                        }, null);
                        app.changeMap(initial, app.initialRestore);

                        app.mapObject.on('click', function(evt) {
                            app.logger.debug(evt.pixel);
                            var feature = this.forEachFeatureAtPixel(evt.pixel,
                                function (feature) {
                                    app.logger.debug(evt.pixel);
                                    if (feature.get('datum')) return feature;
                                });
                            if (feature) {
                                app.dispatchEvent(new CustomEvent('clickMarker', feature.get('datum')));
                            } else {
                                var xy = evt.coordinate;
                                app.dispatchEvent(new CustomEvent('clickMapXy', xy));
                                app.from.xy2MercAsync(xy).then(function (merc) {
                                    app.dispatchEvent(new CustomEvent('clickMapMerc', merc));
                                    var lnglat = ol.proj.transform(merc, 'EPSG:3857', 'EPSG:4326');
                                    app.dispatchEvent(new CustomEvent('clickMap', {
                                        longitude: lnglat[0],
                                        latitude: lnglat[1]
                                    }));
                                });
                            }
                        });

                        var xyBuffer;
                        var waiting = false;
                        var dragging = false;
                        var pointerCounter = {};
                        var pointermoveHandler = function(xy) {
                            app.dispatchEvent(new CustomEvent('pointerMoveOnMapXy', xy));
                            app.from.xy2MercAsync(xy).then(function(merc) {
                                app.dispatchEvent(new CustomEvent('pointerMoveOnMapMerc', merc));
                                if (xyBuffer) {
                                    var next = xyBuffer;
                                    xyBuffer = false;
                                    pointermoveHandler(next);
                                } else {
                                    waiting = false;
                                }
                            });
                        }

                        app.mapObject.on('pointermove', function(evt) {
                            if (dragging) return;
                            if (waiting) {
                                xyBuffer = evt.coordinate;
                            } else {
                                waiting = true;
                                pointermoveHandler(evt.coordinate);
                            }
                        });
                        app.mapObject.on('pointerdown', function(evt) {
                            if (evt.originalEvent && evt.originalEvent.pointerId != null) {
                                pointerCounter[evt.originalEvent.pointerId] = true;
                            }
                            dragging = true;
                        });
                        app.mapObject.on('pointerdrag', function(evt) {
                            if (evt.originalEvent && evt.originalEvent.pointerId != null) {
                                pointerCounter[evt.originalEvent.pointerId] = true;
                            }
                            dragging = true;
                        });
                        app.mapObject.on('pointerup', function(evt) {
                            // Android
                            if (evt.originalEvent && evt.originalEvent.pointerId != null) {
                                delete pointerCounter[evt.originalEvent.pointerId];
                                if (Object.keys(pointerCounter).length == 0) {
                                    dragging = false;
                                }
                            // iOS
                            } else if (evt.originalEvent && evt.originalEvent.touches) {
                                if (evt.originalEvent.touches.length == 0) {
                                    dragging = false;
                                }
                            } else {
                                dragging = false;
                            }
                        });

                        // MapUI on off
                        var timer;
                        app.mapObject.on('click', function () {
                            if (timer) {
                                clearTimeout(timer);
                                delete timer;
                            }
                            var ctls = app.mapDivDocument.querySelectorAll('.ol-control');
                            for (var i = 0; i < ctls.length; i++) {
                                ctls[i].classList.remove('fade');
                            }
                        });
                        app.mapObject.on('pointerdrag', function () {
                            if (timer) {
                                clearTimeout(timer);
                                delete timer;
                            }
                            var ctls = app.mapDivDocument.querySelectorAll('.ol-control');
                            for (var i = 0; i < ctls.length; i++) {
                                ctls[i].classList.add('fade');
                            }
                        });
                        app.mapObject.on('moveend', function () {
                            if (timer) {
                                clearTimeout(timer);
                                delete timer;
                            }
                            timer = setTimeout(function () {
                                delete timer;
                                var ctls = app.mapDivDocument.querySelectorAll('.ol-control');
                                for (var i = 0; i < ctls.length; i++) {
                                    ctls[i].classList.remove('fade');
                                }
                            }, 3000);
                        });

                        // change mouse cursor when over marker
                        var moveHandler = function (evt) {
                            var pixel = this.getEventPixel(evt.originalEvent);
                            var hit = this.hasFeatureAtPixel(pixel);
                            var target = this.getTarget();
                            if (hit) {
                                var feature = this.forEachFeatureAtPixel(evt.pixel,
                                    function (feature) {
                                        if (feature.get('datum')) return feature;
                                    });
                                app.mapDivDocument.querySelector('#' + target).style.cursor = feature ? 'pointer' : '';
                                return;
                            }
                            app.mapDivDocument.querySelector('#' + target).style.cursor = '';
                        };
                        app.mapObject.on('pointermove', moveHandler);

                        var mapOutHandler = function (evt) {
                            var histCoord = evt.frameState.viewState.center;
                            var source = app.from;
                            if (!source.insideCheckHistMapCoords(histCoord)) {
                                histCoord = source.modulateHistMapCoordsInside(histCoord);
                                this.getView().setCenter(histCoord);
                            }
                        };
                        app.mapObject.on('moveend', mapOutHandler);

                        var backMapMove = function (evt) {
                            if (!app.backMap) return;
                            if (this._backMapMoving) {
                                app.logger.debug('Backmap moving skipped');
                                return;
                            }
                            var backSrc = app.backMap.getSource();
                            if (backSrc) {
                                this._backMapMoving = true;
                                app.logger.debug('Backmap moving started');
                                var self = this;
                                app.convertParametersFromCurrent(backSrc, function (size) {
                                    var view = app.backMap.getView();
                                    view.setCenter(size[0]);
                                    view.setZoom(size[1]);
                                    view.setRotation(size[2]);
                                    app.logger.debug('Backmap moving ended');
                                    self._backMapMoving = false;
                                });
                            }
                        };
                        app.mapObject.on('postrender', backMapMove);

                        app.mapObject.on('postrender', function (evt) {
                            var view = app.mapObject.getView();
                            var center = view.getCenter();
                            var zoom = view.getDecimalZoom();
                            var rotation = normalizeDegree(view.getRotation() * 180 / Math.PI);
                            app.from.size2MercsAsync().then(function (mercs) {
                                return app.mercSrc.mercs2SizeAsync(mercs);
                            }).then(function (size) {
                                if (app.mobileMapMoveBuffer && app.mobileMapMoveBuffer[0][0] == size[0][0] &&
                                    app.mobileMapMoveBuffer[0][1] == size[0][1] &&
                                    app.mobileMapMoveBuffer[1] == size[1] &&
                                    app.mobileMapMoveBuffer[2] == size[2]) {
                                    return;
                                }
                                app.mobileMapMoveBuffer = size;
                                var ll = ol.proj.transform(size[0], 'EPSG:3857', 'EPSG:4326');
                                var direction = normalizeDegree(size[2] * 180 / Math.PI);
                                app.dispatchEvent(new CustomEvent('changeViewpoint', {
                                    x: center[0],
                                    y: center[1],
                                    longitude: ll[0],
                                    latitude: ll[1],
                                    mercator_x: size[0][0],
                                    mercator_y: size[0][1],
                                    zoom: zoom,
                                    mercZoom: size[1],
                                    direction: direction,
                                    rotation: rotation
                                }));
                                if (app.restoreSession) {
                                    var currentTime = Math.floor(new Date().getTime() / 1000);
                                    localStorage.setItem('epoch', currentTime);
                                    localStorage.setItem('x', center[0]);
                                    localStorage.setItem('y', center[1]);
                                    localStorage.setItem('zoom', zoom);
                                    localStorage.setItem('rotation', rotation);
                                }
                                app.requestUpdateState({
                                    position: {
                                        x: center[0],
                                        y: center[1],
                                        zoom: zoom,
                                        rotation: rotation
                                    }
                                });
                            });
                        });
                    });
                });
            });
        });
    };

    MaplatApp.createElement = createElement;
    MaplatApp.customEvent = CustomEvent;
    ol.inherits(MaplatApp, ol.events.EventTarget);

    var createMapInfo = function(source) {
        if (!source) return;
        var ret = {
            sourceID: source.sourceID
        };
        for (var i = 0; i < ol.source.META_KEYS.length; i++) {
            var key = ol.source.META_KEYS[i];
            if (source[key]) {
                ret[key] = source[key];
            }
        }
        return ret;
    }

    MaplatApp.prototype.currentMapInfo = function() {
        var app = this;
        return createMapInfo(app.from);
    };

    MaplatApp.prototype.mapInfo = function(sourceID) {
        var app = this;
        return createMapInfo(app.cacheHash[sourceID]);
    };

    MaplatApp.prototype.setMarker = function(data) {
        var app = this;
        app.logger.debug(data);
        var lnglat = data.lnglat || [data.lng || data.longitude, data.lat || data.latitude];
        var x = data.x;
        var y = data.y;
        var coords = data.coordinates;
        var src = app.from;
        var promise = coords ?
            (function() {
                return src.merc2XyAsync(coords);
            })() :
            (x && y) ?
            new Promise(function(resolve) {
                resolve(src.xy2HistMapCoords([x, y]));
            }) :
            (function() {
                var merc = ol.proj.transform(lnglat, 'EPSG:4326', 'EPSG:3857');
                return src.merc2XyAsync(merc);
            })();
        promise.then(function(xy) {
            if (src.insideCheckHistMapCoords(xy)) {
                app.mapObject.setMarker(xy, {'datum': data}, data.icon);
            }
        });
    };

    MaplatApp.prototype.resetMarker = function() {
        this.mapObject.resetMarker();
    };

    MaplatApp.prototype.setLine = function(data) {
        var app = this;
        app.logger.debug(data);

        var xyPromises;
        if (data.coordinates) {
            xyPromises = data.coordinates.map(function(coord) {
                return app.from.merc2XyAsync(coord);
            });
        } else {
            xyPromises = data.lnglats.map(function(lnglat) {
                var merc = ol.proj.transform(lnglat, 'EPSG:4326', 'EPSG:3857');
                return app.from.merc2XyAsync(merc);
            });
        }

        Promise.all(xyPromises).then(function(xys) {
            app.mapObject.setLine(xys, data.stroke);
        });
    };

    MaplatApp.prototype.resetLine = function() {
        this.mapObject.resetLine();
    };

    MaplatApp.prototype.addMarker = function(data) {
        this.pois.push(data);
        this.setMarker(data);
    };

    MaplatApp.prototype.clearMarker = function() {
        this.pois = [];
        this.resetMarker();
    };

    MaplatApp.prototype.addLine = function(data) {
        this.lines.push(data);
        this.setLine(data);
    };

    MaplatApp.prototype.clearLine = function() {
        this.lines = [];
        this.resetLine();
    };

    MaplatApp.prototype.setGPSMarker = function(position) {
        this.currentPosition = position;
        this.from.setGPSMarker(position, true);
    };

    MaplatApp.prototype.changeMap = function(sourceID, restore) {
        var app = this;
        if (!restore) restore = {};
        var now = app.cacheHash['osm'];
        var to = app.cacheHash[sourceID];

        if (!app.changeMapSeq) {
            app.changeMapSeq = Promise.resolve();
        }

        app.changeMapSeq = app.changeMapSeq.then(function() {
            return new Promise(function(resolve, reject) {
                app.convertParametersFromCurrent(to, function(size) {
                    var backSrc = null;
                    var backTo = null;
                    var backRestore = restore.backgroundID ? app.cacheHash[restore.backgroundID] : undefined;

                    if (app.backMap) {
                        // Overlay = true case:
                        backSrc = app.backMap.getSource(); // Get current source of background map
                        if (!(to instanceof ol.source.NowMap)) {
                            // If new foreground source is nonlinear map:
                            if (backRestore) {
                                backTo = backRestore;
                                app.backMap.exchangeSource(backTo);
                            } else {
                                if (!backSrc) {
                                    // If current background source is not set, specify it
                                    backTo = now;
                                    if (app.from instanceof ol.source.NowMap) {
                                        backTo = app.from instanceof ol.source.TmsMap ?
                                            app.mapObject.getSource() :
                                            // If current foreground is TMS overlay, set current basemap as new background
                                            app.from; // If current foreground source is basemap, set current foreground as new background
                                    }
                                    app.backMap.exchangeSource(backTo);
                                } else {
                                    // If current background source is set, use it again
                                    backTo = backSrc;
                                }
                            }
                            if (app.restoreSession) {
                                var currentTime = Math.floor(new Date().getTime() / 1000);
                                localStorage.setItem('epoch', currentTime);
                                localStorage.setItem('backgroundID', backTo.sourceID);
                            }
                            app.requestUpdateState({backgroundID: backTo.sourceID});
                        } else if (to instanceof ol.source.NowMap) {
                            // If new foreground source is basemap or TMS overlay, remove source from background map
                            app.backMap.exchangeSource();
                        }
                        // Overlay = true case: end
                    }
                    if (to instanceof ol.source.TmsMap) {
                        // Foreground is TMS overlay case: set TMS as Layer
                        app.mapObject.setLayer(to);
                        // If current foreground is basemap then set it as basemap layer
                        if (backRestore) {
                            app.mapObject.exchangeSource(backRestore);
                        } else if (!(app.from instanceof ol.source.NowMap)) {
                            var backToLocal = backSrc || now;
                            app.mapObject.exchangeSource(backToLocal);
                        }
                        if (app.restoreSession) {
                            var currentTime = Math.floor(new Date().getTime() / 1000);
                            localStorage.setItem('epoch', currentTime);
                            localStorage.setItem('backgroundID', app.mapObject.getSource().sourceID);
                        }
                        app.requestUpdateState({backgroundID: app.mapObject.getSource().sourceID});
                    } else {
                        // Remove overlay from foreground and set current source to foreground
                        app.mapObject.setLayer();
                        app.mapObject.exchangeSource(to);
                    }
                    if (app.restoreSession) {
                        var currentTime = Math.floor(new Date().getTime() / 1000);
                        localStorage.setItem('epoch', currentTime);
                        localStorage.setItem('sourceID', to.sourceID);
                    }
                    var updateState = {
                        sourceID: to.sourceID
                    };
                    if (to instanceof ol.source.NowMap && !(to instanceof ol.source.TmsMap)) {
                        updateState.backgroundID = '____delete____';
                    }
                    app.requestUpdateState(updateState);

                    // This must be here: Because, render process works after view.setCenter,
                    // and Changing "from" content must be finished before "postrender" event
                    app.from = to;

                    var view = app.mapObject.getView();
                    if (app.appData.zoom_restriction) {
                        view.setMaxZoom(to.maxZoom);
                        view.setMinZoom(to.minZoom || 0);
                    }
                    if (to.insideCheckHistMapCoords(size[0])) {
                        view.setCenter(size[0]);
                        view.setZoom(size[1]);
                        view.setRotation(size[2]);
                    } else if (!app.__init) {
                        app.dispatchEvent(new CustomEvent('outOfMap', {}));
                        to.goHome();
                    }
                    to.setGPSMarker(app.currentPosition, true);
                    app.resetMarker();
                    for (var i = 0; i < app.pois.length; i++) {
                        (function(data) {
                            app.setMarker(data);
                        })(app.pois[i]);
                    }
                    if (to.pois) {
                        for (var i = 0; i < to.pois.length; i++) {
                            (function(data) {
                                app.setMarker(data);
                            })(to.pois[i]);
                        }
                    }
                    app.resetLine();
                    for (var i = 0; i < app.lines.length; i++) {
                        (function(data) {
                            app.setLine(data);
                        })(app.lines[i]);
                    }
                    app.dispatchEvent(new CustomEvent('mapChanged', app.getMapMeta(to.sourceID)));

                    app.mapObject.updateSize();
                    app.mapObject.renderSync();

                    if (restore.position) {
                        app.__init = false;
                        to.setViewpoint(restore.position);
                    }
                    if (restore.transparency) {
                        app.setTransparency(restore.transparency);
                    }
                    if (app.__init == true) {
                        app.__init = false;
                        to.goHome();
                    } else if (app.backMap && backTo) {
                        app.convertParametersFromCurrent(backTo, function (size) {
                            var view = app.backMap.getView();
                            view.setCenter(size[0]);
                            view.setZoom(size[1]);
                            view.setRotation(size[2]);
                            app.backMap.updateSize();
                            app.backMap.renderSync();
                        });
                    }
                    resolve();
                });
            });
        });
    };

    MaplatApp.prototype.requestUpdateState = function(data) {
        var app = this;
        app.stateBuffer = Object.assign(app.stateBuffer, data);
        if (app.stateBuffer.backgroundID == '____delete____') {
            delete app.stateBuffer.backgroundID;
        }
        if (app.timer) clearTimeout(app.timer);
        app.timer = setTimeout(function() {
            app.timer = undefined;
            app.dispatchEvent(new CustomEvent('updateState', app.stateBuffer));
        }, 50);
    };

    MaplatApp.prototype.setTransparency = function(percentage) {
        this.transparency_ = percentage;
        this.mapObject.setTransparency(percentage);
        if (this.restoreSession) {
            var currentTime = Math.floor(new Date().getTime() / 1000);
            localStorage.setItem('epoch', currentTime);
            localStorage.setItem('transparency', percentage);
        }
        this.requestUpdateState({transparency: percentage});
    };

    MaplatApp.prototype.getTransparency = function() {
        return this.transparency_ == null ? 0 : this.transparency_;
    };

    MaplatApp.prototype.setViewpoint = function(cond) {
        this.from.setViewpoint(cond);
    };

    MaplatApp.prototype.getMapMeta = function(sourceID) {
        var app = this;
        var source;
        if (!sourceID) {
            source = app.from;
        } else {
            source = app.cacheHash[sourceID];
        }
        if (!source) return;

        return ol.source.META_KEYS.reduce(function(prev, curr) {
            prev[curr] = source[curr];
            return prev;
        }, {
            sourceID: source.sourceID,
            label: source.label
        });
    };

    MaplatApp.prototype.getMapTileCacheSizeAsync = function(sourceID) {
        var app = this;
        var source;
        if (!sourceID) {
            source = app.from;
        } else {
            source = app.cacheHash[sourceID];
        }
        if (!source) return Promise.resolve(0);

        return source.getTileCacheSizeAsync();
    };

    MaplatApp.prototype.clearMapTileCacheAsync = function(sourceID, reopen) {
        var app = this;
        var source;
        if (!sourceID) {
            source = app.from;
        } else {
            source = app.cacheHash[sourceID];
        }
        if (!source) return Promise.resolve();

        return source.clearTileCacheAsync(reopen);
    };

    MaplatApp.prototype.convertParametersFromCurrent = function(to, callback) {
        var app = this;
        var view = app.mapObject.getView();
        var fromPromise = app.from.size2MercsAsync();
        var current = ol.MathEx.recursiveRound([
            view.getCenter(), view.getZoom(), view.getRotation()
        ], 10);
        if (app.mercBuffer && app.mercBuffer.mercs && app.mercBuffer.buffer[app.from.sourceID]) {
            var buffer = app.mercBuffer.buffer[app.from.sourceID];
            if (buffer[0][0] == current[0][0] && buffer[0][1] == current[0][1] &&
                buffer[1] == current[1] && buffer[2] == current[2]) {
                app.logger.debug(buffer);
                app.logger.debug(current);
                app.logger.debug('From: Use buffer');
                fromPromise = new Promise(function(res, rej) {
                    res(app.mercBuffer.mercs);
                });
            } else {
                app.mercBuffer = {
                    buffer: {}
                };
                app.mercBuffer.buffer[app.from.sourceID] = current;
            }
        } else {
            app.mercBuffer = {
                buffer: {}
            };
            app.mercBuffer.buffer[app.from.sourceID] = current;
        }
        app.logger.debug('From: Center: ' + current[0] + ' Zoom: ' + current[1] + ' Rotation: ' + current[2]);
        app.logger.debug('From: ' + app.from.sourceID);
        fromPromise.then(function(mercs) {
            app.mercBuffer.mercs = mercs;
            app.logger.debug('Mercs: ' + mercs);
            var toPromise = to.mercs2SizeAsync(mercs);
            var key = to.sourceID;
            if (app.mercBuffer.buffer[key]) {
                app.logger.debug('To: Use buffer');
                toPromise = new Promise(function(res, rej) {
                    res(app.mercBuffer.buffer[key]);
                });
            }
            toPromise.then(function(size) {
                app.logger.debug('To: Center: ' + size[0] + ' Zoom: ' + size[1] + ' Rotation: ' + size[2]);
                app.logger.debug('To: ' + to.sourceID);
                app.mercBuffer.buffer[to.sourceID] = ol.MathEx.recursiveRound(size, 10);
                callback(size);
            }).catch(function(err) {
                throw err;
            });
        }).catch(function(err) {
            throw err;
        });
    };

    MaplatApp.prototype.translate = function(dataFragment) {
        var app = this;
        if (!dataFragment || typeof dataFragment != 'object') return dataFragment;
        var langs = Object.keys(dataFragment);
        var key = langs.reduce(function(prev, curr, idx, arr) {
            if (curr == app.appLang) {
                prev = [dataFragment[curr], true];
            } else if (!prev || (curr == 'en' && !prev[1])) {
                prev = [dataFragment[curr], false];
            }
            if (idx == arr.length - 1) return prev[0];
            return prev;
        }, null);
        key = (typeof key == 'string') ? key : key + '';
        if (app.i18n.exists(key, {ns: 'translation', nsSeparator: '__X__yX__X__'}))
            return app.t(key, {ns: 'translation', nsSeparator: '__X__yX__X__'});
        for (var i = 0; i < langs.length; i++) {
            var lang = langs[i];
            app.i18n.addResource(lang, 'translation', key, dataFragment[lang]);
        }
        return app.t(key, {ns: 'translation', nsSeparator: '__X__yX__X__'});
    };

    return MaplatApp;
});
