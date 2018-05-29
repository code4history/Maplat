define(['histmap', 'sprintf', 'i18n', 'i18nxhr', 'swiper', 'bootstrap'],
    function(ol, sprintf, i18n, i18nxhr, Swiper, bsn) {
    var browserLanguage = function() {
        var ua = window.navigator.userAgent.toLowerCase();
        try {
            // Chrome
            if( ua.indexOf( 'chrome' ) != -1 ) {
                return ( navigator.languages[0] || navigator.browserLanguage || navigator.language || navigator.userLanguage).substr(0, 2);
            }
            // Other
            else {
                return ( navigator.browserLanguage || navigator.language || navigator.userLanguage).substr(0, 2);
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

    Swiper.prototype.setSlideIndex = function(index) {
        // this.slideTo(index + this.params.slidesPerView); // <= Maybe bug of swiper;
        this.slideToLoop(index);
        this.setSlideIndexAsSelected(index);
    };
    Swiper.prototype.setSlideIndexAsSelected = function(index) {
        var sliders = this.$el[0].querySelectorAll('.swiper-slide');
        for (var i=0; i<sliders.length; i++) {
            var slider = sliders[i];
            if (slider.getAttribute('data-swiper-slide-index') == index) {
                slider.classList.add('selected');
            } else {
                slider.classList.remove('selected');
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

    var absoluteUrl = function(base, relative) {
        var stack = base.split('/');
        var parts = relative.split('/');
        stack.pop(); // remove current file name (or empty string)
        // (omit if "base" is the current folder without trailing slash)
        for (var i=0; i<parts.length; i++) {
            if (parts[i] == '.')
                continue;
            if (parts[i] == '..')
                stack.pop();
            else
                stack.push(parts[i]);
        }
        return stack.join('/');
    };

    var modalSetting;

    // Maplat App Class
    var MaplatApp = function(appOption) {
        var app = this;

        // Modal記述の動作を調整する関数
        modalSetting = function(target) {
            var modalElm = app.mapDivDocument.querySelector('#modalBase');
            ['poi', 'map', 'load', 'gpsW', 'gpsD', 'help'].map(function(target_) {
                var className = 'modal_' + target_;
                if (target == target_) {
                    modalElm.classList.add(className);
                } else {
                    modalElm.classList.remove(className);
                }
            });
        };

        ol.events.EventTarget.call(app);
        var mapType = appOption.stroly ? 'stroly' : appOption.drumsey ? 'drumsey' : appOption.warper ? 'warper' : null;
        var appid = appOption.appid || (mapType ? appOption[mapType] : 'sample');
        app.mobileIF = false;
        app.mapDiv = appOption.div || 'map_div';
        app.mapDivDocument = document.querySelector('#' + app.mapDiv);
        app.mapDivDocument.classList.add('maplat');
        if ('ontouchstart' in window) {
            app.mapDivDocument.classList.add('ol-touch');
        }
        var noUI = appOption.no_ui || false;
        if (appOption.mobile_if) {
            app.mobileIF = true;
            noUI = true;
            appOption.debug = true;
        }
        app.logger = new Logger(appOption.debug ? LoggerLevel.ALL : LoggerLevel.INFO);
        var lang = appOption.lang;
        if (!lang) {
            lang = browserLanguage();
        }
        var setting = appOption.setting;
        var pwaManifest = appOption.pwa_manifest || './pwa/' + appid + '_manifest.json';
        var pwaWorker = appOption.pwa_worker || './service-worker.js';

        // Add UI HTML Element
        var newElems = createElement('<div class="ol-control map-title"><span></span></div>' +
            '<img id="center_circle" class="prevent-default" style="position:absolute;top:50%;left:50%;margin-top:-10px;' +
            'margin-left:-10px;" src="./parts/redcircle.png">' +
            '<div class="swiper-container ol-control base-swiper prevent-default">' +
            '<i class="fa fa-chevron-left swiper-left-icon" aria-hidden="true"></i>' +
            '<i class="fa fa-chevron-right swiper-right-icon" aria-hidden="true"></i>' +
            '<div class="swiper-wrapper"></div>' +
            '</div>' +
            '<div class="swiper-container ol-control overlay-swiper prevent-default">' +
            '<i class="fa fa-chevron-left swiper-left-icon" aria-hidden="true"></i>' +
            '<i class="fa fa-chevron-right swiper-right-icon" aria-hidden="true"></i>' +
            '<div class="swiper-wrapper"></div>' +
            '</div>');
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

        var newElems = createElement('<div class="modal" id="modalBase" tabindex="-1" role="dialog" ' +
            'aria-labelledby="staticModalLabel" aria-hidden="true" data-show="true" data-keyboard="false" ' +
            'data-backdrop="static">' +
            '<div class="modal-dialog">' +
            '<div class="modal-content">' +
            '<div class="modal-header">' +
            '<button type="button" class="close" data-dismiss="modal">' +
            '<span aria-hidden="true">&#215;</span><span class="sr-only" data-i18n="html.close"></span>' +
            '</button>' +
            '<h4 class="modal-title">' +

            '<span id="modal_title"></span>' +
            '<span id="modal_load_title" data-i18n="html.app_loading_title"></span>' +
            '<span id="modal_gpsW_title" data-i18n="html.acquiring_gps"></span>' +
            '<span id="modal_help_title" data-i18n="html.help_title"></span>' +

            '</h4>' +
            '</div>' +
            '<div class="modal-body">' +

            '<div id="modal_help_content">' +
            '<div id="help_content">' +
            '<span data-i18n-html="html.help_using_maplat"></span>' +
            '<p class="col-xs-12 help_img"><img src="parts/fullscreen.png"></p>' +
            '<h4 data-i18n="html.help_operation_title"></h4>' +
            '<p data-i18n-html="html.help_operation_content" class="recipient"></p>' +
            '<h4 data-i18n="html.help_selection_title"></h4>' +
            '<p data-i18n-html="html.help_selection_content" class="recipient"></p>' +
            '<h4 data-i18n="html.help_gps_title"></h4>' +
            '<p data-i18n-html="html.help_gps_content" class="recipient"></p>' +
            '<h4 data-i18n="html.help_poi_title"></h4>' +
            '<p data-i18n-html="html.help_poi_content" class="recipient"></p>' +
            '<h4 data-i18n="html.help_etc_title"></h4>' +
            '<ul>' +
            '<li data-i18n-html="html.help_etc_attr" class="recipient"></li>' +
            '<li data-i18n-html="html.help_etc_help" class="recipient"></li>' +
            '<li data-i18n-html="html.help_etc_slider" class="recipient"></li>' +
            '</ul>' +
            '<p><a href="https://github.com/code4nara/Maplat/wiki" target="_blank">Maplat</a>' +
            ' © 2015- Kohei Otsuka, Code for Nara, RekishiKokudo project</p>' +
            '</div>' +
            '</div>' +

            '<div id="modal_poi_content">' +
            '<div id="poi_web" class="embed-responsive embed-responsive-60vh">' +
            '<iframe id="poi_iframe" class="iframe_poi" frameborder="0" src=""></iframe>' +
            '</div>' +
            '<div id="poi_data" class="hide">' +
            '<p class="col-xs-12 poi_img"><img id="poi_img" src=""></p>' +
            '<p class="recipient" id="poi_address"></p>' +
            '<p class="recipient" id="poi_desc"></p>' +
            '</div>' +
            '</div>' +

            '<div id="modal_map_content">' +

            ol.source.META_KEYS.map(function(key) {
                if (key == 'title' || key == 'officialTitle') return '';

                return '<div class="recipients" id="' + key + '_div"><dl class="dl-horizontal">' +
                    '<dt data-i18n="html.' + key + '"></dt>' +
                    '<dd id="' + key + '"></dd>' +
                    '</dl></div>';
            }).join('') +

            '</div>' +

            '<div id="modal_load_content">' +
            '<p class="recipient"><img src="parts/loading.gif"><span data-i18n="html.app_loading_body"></span></p>' +
            '<div id="splash_div" class="hide"><p class="col-xs-12 poi_img"><img id="splash_img" src=""></p>' +
            '<p class="recipient">　</p></div>' +
            '</div>' +

            '<p id="modal_gpsD_content" class="recipient"></p>' +
            '<p id="modal_gpsW_content" class="recipient"></p>' +

            '</div>' +
            '</div>' +
            '</div>' +
            '</div>');
        for (var i=newElems.length - 1; i >= 0; i--) {
            app.mapDivDocument.insertBefore(newElems[i], app.mapDivDocument.firstChild);
        }

        var overlay = appOption.overlay || false;
        var noRotate = appOption.no_rotate || false;
        if (overlay) {
            app.mapDivDocument.classList.add('with-opacity');
        }
        if (noUI) {
            app.mapDivDocument.querySelector('.base-swiper').style.display = 'none';
            app.mapDivDocument.querySelector('.overlay-swiper').style.display = 'none';
            app.mapDivDocument.querySelector('.map-title').style.display = 'none';
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
            }) : setting ? Promise.resolve(setting) :
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

        var i18nPromise = new Promise(function(resolve, reject) {
            i18n.use(i18nxhr).init({
                lng: lang,
                fallbackLng: ['en'],
                backend: {
                    loadPath: 'locales/{{lng}}/{{ns}}.json'
                }
            }, function(err, t) {
                var i18nTargets = app.mapDivDocument.querySelectorAll('[data-i18n]');
                for (var i=0; i<i18nTargets.length; i++) {
                    var target = i18nTargets[i];
                    var key = target.getAttribute('data-i18n');
                    target.innerText = t(key);
                }
                var i18nTargets = app.mapDivDocument.querySelectorAll('[data-i18n-html]');
                for (var i=0; i<i18nTargets.length; i++) {
                    var target = i18nTargets[i];
                    var key = target.getAttribute('data-i18n-html');
                    target.innerHTML = t(key);
                }
                resolve([t, i18n]);
            });
        });

        var promises = Promise.all([i18nPromise, appPromise]);

        // PWA対応: 非同期処理
        var xhr = new XMLHttpRequest();
        xhr.open('GET', pwaManifest, true);
        xhr.responseType = 'json';

        xhr.onload = function(e) {
            var value = this.response;
            if (!value) return;
            if (typeof value != 'object') value = JSON.parse(value);

            var head = document.querySelector('head');
            head.appendChild((createElement('<link rel="manifest" href="' + pwaManifest + '">'))[0]);
            // service workerが有効なら、service-worker.js を登録します
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register(pwaWorker).then(function() {
                    console.log('Service Worker Registered');
                });
            }
            if (value.icons) {
                for (var i=0; i<value.icons.length; i++) {
                    var src = absoluteUrl(pwaManifest, value.icons[i].src);
                    var sizes = value.icons[i].sizes;
                    var tag = '<link rel="apple-touch-icon" sizes="' + sizes + '" href="' + src + '">';
                    head.appendChild((createElement(tag))[0]);
                }
            }
        };
        xhr.send();

        app.waitReady = promises.then(function(result) {
            app.appData = result[1];
            app.i18n = result[0][1];
            app.t = result[0][0];
            var baseSwiper, overlaySwiper;
            ol.source.setI18n(app.i18n, app.t);

            // Check Splash data
            var splash = false;
            if (app.appData.splash) splash = true;

            if (!noUI) {
                var modalElm = app.mapDivDocument.querySelector('#modalBase');
                var modal = new bsn.Modal(modalElm, {'root': app.mapDivDocument});
                if (splash) {
                    app.mapDivDocument.querySelector('#splash_img').setAttribute('src', 'img/' + app.appData.splash);
                    app.mapDivDocument.querySelector('#splash_div').classList.remove('hide');
                }
                modalSetting('load');
                modal.show();
                baseSwiper = new Swiper('.base-swiper', {
                    slidesPerView: 2,
                    spaceBetween: 15,
                    breakpoints: {
                        // when window width is <= 480px
                        480: {
                            slidesPerView: 1.4,
                            spaceBetween: 10
                        }
                    },
                    centeredSlides: true,
                    loop: true
                });
                baseSwiper.on('click', function(e) {
                    e.preventDefault();
                    if (!baseSwiper.clickedSlide) return;
                    var slide = baseSwiper.clickedSlide;
                    app.changeMap(slide.getAttribute('data'));
                    baseSwiper.setSlideIndexAsSelected(slide.getAttribute('data-swiper-slide-index'));
                });
                overlaySwiper = new Swiper('.overlay-swiper', {
                    slidesPerView: 2,
                    spaceBetween: 15,
                    breakpoints: {
                        // when window width is <= 480px
                        480: {
                            slidesPerView: 1.4,
                            spaceBetween: 10
                        }
                    },
                    centeredSlides: true,
                    loop: true
                });
                overlaySwiper.on('click', function(e) {
                    e.preventDefault();
                    if (!overlaySwiper.clickedSlide) return;
                    var slide = overlaySwiper.clickedSlide;
                    app.changeMap(slide.getAttribute('data'));
                    overlaySwiper.setSlideIndexAsSelected(slide.getAttribute('data-swiper-slide-index'));
                });
            }

            app.mercBuffer = null;
            var homePos = app.appData.home_position;
            var defZoom = app.appData.default_zoom;
            var appName = app.appData.app_name;
            var fakeGps = appOption.fake ? app.appData.fake_gps : false;
            var fakeCenter = appOption.fake ? app.appData.fake_center : false;
            var fakeRadius = appOption.fake ? app.appData.fake_radius : false;
            app.appLang = app.appData.lang || 'ja';
            app.currentPosition = null;
            app.backMap = null;
            app.__init = true;
            var frontDiv = app.mapDiv + '_front';
            var newElem = createElement('<div id="' + frontDiv + '" class="map" style="top:0; left:0; right:0; bottom:0; ' +
                'position:absolute;"></div>')[0];
            app.mapDivDocument.insertBefore(newElem, app.mapDivDocument.firstChild);
            app.mapObject = new ol.MaplatMap({
                div: frontDiv,
                off_control: noUI ? true : false,
                off_rotation: noRotate ? true : false
            });
            app.sliderCommon = app.mapObject.sliderCommon;
            app.sliderCommon.setEnable(false);

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
            if (!noUI) {
                var shown = false;
                var gpsWaitPromise = null;
                function showGPSresult(result) {
                    if (result && result.error) {
                        app.currentPosition = null;
                        if (result.error == 'gps_out' && shown) {
                            shown = false;
                            var modalElm = app.mapDivDocument.querySelector('#modalBase');
                            var modal = new bsn.Modal(modalElm, {'root': app.mapDivDocument});
                            app.mapDivDocument.querySelector('#modal_title').innerText = app.t('app.out_of_map');
                            app.mapDivDocument.querySelector('#modal_gpsD_content').innerText = app.t('app.out_of_map_desc');
                            modalSetting('gpsD');
                            modal.show();
                        }
                    } else {
                        app.currentPosition = result;
                    }
                    if (shown) {
                        shown = false;
                        var modalElm = app.mapDivDocument.querySelector('#modalBase');
                        var modal = new bsn.Modal(modalElm, {'root': app.mapDivDocument});
                        modal.hide();
                    }
                }
                app.mapObject.on('gps_request', function() {
                    gpsWaitPromise = 'gps_request';
                    var promises = [
                        new Promise(function(resolve) {
                            if (gpsWaitPromise != 'gps_request') {
                                resolve(gpsWaitPromise);
                            } else gpsWaitPromise = resolve;
                        })
                    ];
                    shown = true;
                    var modalElm = app.mapDivDocument.querySelector('#modalBase');
                    var modal = new bsn.Modal(modalElm, {'root': app.mapDivDocument});
                    modalSetting('gpsW');
                    modal.show();
                    // 200m秒以上最低待たないと、Modalがうまく動かない場合がある
                    promises.push(new Promise(function(resolve) {
                        setTimeout(resolve, 200);
                    }));
                    Promise.all(promises).then(function(results) {
                        showGPSresult(results[0]);
                    });
                });
                app.mapObject.on('gps_result', function(evt) {
                    if (gpsWaitPromise == 'gps_request') {
                        gpsWaitPromise = evt.frameState;
                    } else if (gpsWaitPromise) {
                        gpsWaitPromise(evt.frameState);
                        gpsWaitPromise = null;
                    } else if (!shown) {
                        showGPSresult(evt.frameState);
                    }
                });
                app.mapObject.on('click_control', function(evt) {
                    var control = evt.frameState.control;
                    if (control == 'copyright') {
                        var from = app.from; // app.mapObject.getSource();

                        if (!ol.source.META_KEYS.reduce(function(prev, curr) {
                                if (curr == 'title') return prev;
                                return from[curr] || prev;
                            }, false)) return;

                        app.mapDivDocument.querySelector('#modal_title').innerText = from.officialTitle || from.title;
                        ol.source.META_KEYS.map(function(key) {
                            if (key == 'title' || key == 'officialTitle') return;
                            if (!from[key] || from[key] == '') {
                                app.mapDivDocument.querySelector('#' + key + '_div').classList.add('hide');
                            } else {
                                app.mapDivDocument.querySelector('#' + key + '_div').classList.remove('hide');
                                app.mapDivDocument.querySelector('#' + key).innerHTML =
                                    (key == 'license' || key == 'dataLicense') ?
                                        '<img src="parts/' + from[key].toLowerCase().replace(/ /g, '_') + '.png">' :
                                        from[key];
                            }
                        });
                        var modalElm = app.mapDivDocument.querySelector('#modalBase');
                        var modal = new bsn.Modal(modalElm, {'root': app.mapDivDocument});
                        modalSetting('map');
                        modal.show();
                    } else {
                        var modalElm = app.mapDivDocument.querySelector('#modalBase');
                        var modal = new bsn.Modal(modalElm, {'root': app.mapDivDocument});
                        modalSetting('help');
                        modal.show();
                    }
                });
                if (fakeGps) {
                    var newElem = createElement(sprintf(app.t('app.fake_explanation'), app.translate(fakeCenter), fakeRadius))[0];
                    var elem = app.mapDivDocument.querySelector('#modal_gpsW_content');
                    elem.appendChild(newElem);
                } else {
                    var newElem = createElement(app.t('app.acquiring_gps_desc'))[0];
                    var elem = app.mapDivDocument.querySelector('#modal_gpsW_content');
                    elem.appendChild(newElem);
                }
            }
            app.pois = app.appData.pois;
            app.lines = [];

            document.querySelector('title').innerHTML = app.translate(appName);

            var dataSource = app.appData.sources;

            var fadeTime = splash ? 1000 : 200;
            var sourcePromise = noUI ? [] : [
                new Promise(function(resolve) {
                    setTimeout(function() {
                        resolve();
                    }, fadeTime);
                })
            ];
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
                app.mercSrc = sources.reduce(function(prev, curr) {
                    if (prev) return prev;
                    if (curr instanceof ol.source.NowMap) return curr;
                }, null);

                if (!noUI) {
                    sources.shift();
                    var modalElm = app.mapDivDocument.querySelector('#modalBase');
                    var modal = new bsn.Modal(modalElm, {'root': app.mapDivDocument});
                    modalSetting('load');
                    modal.hide();
                }

                if (mapType) {
                    var index = sources.length - 1;
                    homePos = sources[index].home_position;
                    defZoom = sources[index].merc_zoom;
                    document.querySelector('title').innerHTML = sources[index].title;
                }

                var cache = [];
                app.cacheHash = {};
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
                    source._map = app.mapObject;
                    cache.push(source);
                    app.cacheHash[source.sourceID] = source;
                }
                if (!noUI) {
                    baseSwiper.on;
                    overlaySwiper.on;
                    // baseSwiper.setSlideIndex(baseSwiper.slides.length - 1);
                    // overlaySwiper.setSlideIndex(overlaySwiper.slides.length - 1);
                    app.ellips();
                }

                var initial = cache[cache.length - 1];
                app.from = cache.reduce(function(prev, curr) {
                    if (prev) {
                        return !(prev instanceof ol.source.HistMap) && curr !== initial ? curr : prev;
                    }
                    if (curr !== initial) return curr;
                    return prev;
                }, null);
                app.changeMap(initial.sourceID);

                function showInfo(data) {
                    app.dispatchEvent(new CustomEvent('clickMarker', data));
                    if (!app.mobileIF) {
                        app.mapDivDocument.querySelector('#modal_title').innerText = app.translate(data.name);
                        if (data.url || data.html) {
                            app.mapDivDocument.querySelector('#poi_web').classList.remove('hide');
                            app.mapDivDocument.querySelector('#poi_data').classList.add('hide');
                            if (data.html) {
                                app.mapDivDocument.querySelector('#poi_iframe').setAttribute('srcdoc', app.translate(data.html));
                            } else {
                                app.mapDivDocument.querySelector('#poi_iframe').setAttribute('src', app.translate(data.url));
                            }
                        } else {
                            app.mapDivDocument.querySelector('#poi_data').classList.remove('hide');
                            app.mapDivDocument.querySelector('#poi_web').classList.add('hide');

                            if (data.image && data.image != '') {
                                app.mapDivDocument.querySelector('#poi_img').setAttribute('src',
                                    data.image.match(/^http/) ? data.image : 'img/' + data.image);
                            } else {
                                app.mapDivDocument.querySelector('#poi_img').setAttribute('src', 'parts/no_image.png');
                            }
                            app.mapDivDocument.querySelector('#poi_address').innerText = app.translate(data.address);
                            app.mapDivDocument.querySelector('#poi_desc').innerHTML = app.translate(data.desc).replace(/\n/g, '<br>');
                        }
                        var modalElm = app.mapDivDocument.querySelector('#modalBase');
                        var modal = new bsn.Modal(modalElm, {'root': app.mapDivDocument});
                        modalSetting('poi');
                        modal.show();
                    }
                }

                var clickHandler = function(evt) {
                    app.logger.debug(evt.pixel);
                    var feature = this.forEachFeatureAtPixel(evt.pixel,
                        function(feature) {
                            app.logger.debug(evt.pixel);
                            if (feature.get('datum')) return feature;
                        });
                    if (feature) {
                        showInfo(feature.get('datum'));
                    } else {
                        if (app.mobileIF) {
                            var xy = evt.coordinate;
                            app.from.xy2MercAsync(xy).then(function(merc){
                                var lnglat = ol.proj.transform(merc, 'EPSG:3857', 'EPSG:4326');
                                app.dispatchEvent(new CustomEvent('clickMap', {
                                    longitude: lnglat[0],
                                    latitude: lnglat[1]
                                }));
                            });
                        }
                    }
                };
                app.mapObject.on('click', clickHandler);

                // MapUI on off
                var timer;
                app.mapObject.on('click', function() {
                    if (timer) {
                        clearTimeout(timer);
                        delete timer;
                    }
                    var ctls = app.mapDivDocument.querySelectorAll('.ol-control');
                    for (var i = 0; i < ctls.length; i++) {
                        ctls[i].classList.remove('fade');
                    }
                });
                app.mapObject.on('pointerdrag', function() {
                    if (timer) {
                        clearTimeout(timer);
                        delete timer;
                    }
                    var ctls = app.mapDivDocument.querySelectorAll('.ol-control');
                    for (var i = 0; i < ctls.length; i++) {
                        ctls[i].classList.add('fade');
                    }
                });
                app.mapObject.on('moveend', function() {
                    if (timer) {
                        clearTimeout(timer);
                        delete timer;
                    }
                    timer = setTimeout(function() {
                        delete timer;
                        var ctls = app.mapDivDocument.querySelectorAll('.ol-control');
                        for (var i = 0; i < ctls.length; i++) {
                            ctls[i].classList.remove('fade');
                        }
                    }, 3000);
                });

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
                        app.mapDivDocument.querySelector('#' + target).style.cursor = feature ? 'pointer' : '';
                        return;
                    }
                    app.mapDivDocument.querySelector('#' + target).style.cursor = '';
                };
                app.mapObject.on('pointermove', moveHandler);

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
                app.mapObject.on('moveend', mapOutHandler);

                var backMapMove = function(evt) {
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
                        app.convertParametersFromCurrent(backSrc, function(size) {
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

                if (app.mobileIF) {
                    app.mapObject.on('postrender', function(evt) {
                        var view = app.mapObject.getView();
                        var rotation = normalizeDegree(view.getRotation() * 180 / Math.PI);
                        app.from.size2MercsAsync().then(function(mercs) {
                            return app.mercSrc.mercs2SizeAsync(mercs);
                        }).then(function(size) {
                            if (app.mobileMapMoveBuffer && app.mobileMapMoveBuffer[0][0] == size[0][0] &&
                                app.mobileMapMoveBuffer[0][1] == size[0][1] &&
                                app.mobileMapMoveBuffer[1] == size[1] &&
                                app.mobileMapMoveBuffer[2] == size[2]) {
                                return;
                            }
                            app.mobileMapMoveBuffer = size;
                            var ll = ol.proj.transform(size[0], 'EPSG:3857', 'EPSG:4326');
                            app.dispatchEvent(new CustomEvent('changeViewpoint', {
                                longitude: ll[0],
                                latitude: ll[1],
                                mercator: size[0],
                                zoom: size[1],
                                direction: normalizeDegree(size[2] * 180 / Math.PI),
                                rotation: rotation
                            }));
                        });
                    });
                }

                app.sliderCommon.on('propertychange', function(evt) {
                    if (evt.key === 'slidervalue') {
                        app.mapObject.setOpacity(app.sliderCommon.get(evt.key) * 100);
                    }
                });
            });
        });
    };

    ol.inherits(MaplatApp, ol.events.EventTarget);

    MaplatApp.prototype.setMarker = function(data) {
        var app = this;
        app.logger.debug(data);
        var lnglat = data.lnglat || [data.lng || data.longitude, data.lat || data.latitude];
        var x = data.x;
        var y = data.y;
        var src = app.from;
        var promise = (x && y) ?
            new Promise(function(resolve) {
                resolve(src.xy2HistMapCoords([x, y]));
            }):
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

        var xyPromises = data.lnglats.map(function(lnglat){
            var merc = ol.proj.transform(lnglat, 'EPSG:4326', 'EPSG:3857');
            return app.from.merc2XyAsync(merc);
        });
        Promise.all(xyPromises).then(function(xys){
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
        this.mapObject.setGPSMarker(position, true);
    };

    MaplatApp.prototype.changeMap = function(sourceID) {
        var app = this;
        var now = app.cacheHash['osm'];
        var to = app.cacheHash[sourceID];
        if ((to == app.from) && (to != now)) return;
        if (to != app.from) {
            app.convertParametersFromCurrent(to, function(size) {
                var backSrc = null;
                var backTo = null;

                if (app.backMap) {
                    // Overlay = true case:
                    backSrc = app.backMap.getSource(); // Get current source of background map
                    if (!(to instanceof ol.source.NowMap)) {
                        // If new foreground source is nonlinear map:
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
                    } else if (to instanceof ol.source.NowMap) {
                        // If new foreground source is basemap or TMS overlay, remove source from background map
                        app.backMap.exchangeSource();
                    }
                    if (!(to instanceof ol.source.NowMap) || to instanceof ol.source.TmsMap) {
                        // If new foreground is nonlinear map or TMS overlay, enable opacity slider
                        app.sliderCommon.setEnable(true);
                    } else {
                        // If new foreground is basemap, disable opacity slider
                        app.sliderCommon.setEnable(false);
                    }
                    // Overlay = true case: end
                }
                if (to instanceof ol.source.TmsMap) {
                    // Foreground is TMS overlay case: set TMS as Layer
                    app.mapObject.setLayer(to);
                    // If current foreground is basemap then set it as basemap layer
                    if (!(app.from instanceof ol.source.NowMap)) app.mapObject.exchangeSource(backSrc || now);
                    app.sliderCommon.setEnable(true);
                } else {
                    // Remove overlay from foreground and set current source to foreground
                    app.mapObject.setLayer();
                    app.mapObject.exchangeSource(to);
                }

                // This must be here: Because, render process works after view.setCenter,
                // and Changing "from" content must be finished before "postrender" event
                app.from = to;

                var opacity = app.sliderCommon.get('slidervalue') * 100;
                app.mapObject.setOpacity(opacity);
                var view = app.mapObject.getView();
                if (to.insideCheckHistMapCoords(size[0])) {
                    view.setCenter(size[0]);
                    view.setZoom(size[1]);
                    view.setRotation(size[2]);
                } else if (!app.__init) {
                    if (app.mobileIF) {
                        app.dispatchEvent(new CustomEvent('outOfMap', {}));
                    } else {
                        app.mapDivDocument.querySelector('#modal_title').innerText = app.t('app.out_of_map');
                        app.mapDivDocument.querySelector('#modal_gpsD_content').innerText = app.t('app.out_of_map_area');
                        var modalElm = app.mapDivDocument.querySelector('#modalBase');
                        var modal = new bsn.Modal(modalElm, {'root': app.mapDivDocument});
                        modalSetting('gpsD');
                        modal.show();
                    }
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

                app.mapObject.updateSize();
                app.mapObject.renderSync();

                var title = to.officialTitle || to.title || to.label;
                app.mapDivDocument.querySelector('.map-title span').innerText = title;

                if (app.__init == true) {
                    app.__init = false;
                    to.goHome();
                } else if (app.backMap && backTo) {
                    app.convertParametersFromCurrent(backTo, function(size) {
                        var view = app.backMap.getView();
                        view.setCenter(size[0]);
                        view.setZoom(size[1]);
                        view.setRotation(size[2]);
                        app.backMap.updateSize();
                        app.backMap.renderSync();
                    });
                }
            });
        }
    };

    MaplatApp.prototype.moveTo = function(cond) {
        this.from.moveTo(cond);
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

    MaplatApp.prototype.ellips = function() {
        var app = this;
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

            thisSpan[0].style.display = '';
            for (var i=1; i < thisSpan.length; i++) {
                thisSpan[i].style.display = 'none';
            }
            omitSpan.style.display = '';
            var divHeight = element.offsetHeight;
            var minimizeFont = false;
            for (var i = 1; i < thisSpan.length - 1; i++) {
                thisSpan[i].style.display = '';
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
        var swiperItems = app.mapDivDocument.querySelectorAll('.swiper-slide div');
        for (var i = 0; i < swiperItems.length; i++) {
            var swiperItem = swiperItems[i];
            stringSplit(swiperItem);
            omitCheck(swiperItem);
        }
    };

    return MaplatApp;
});
