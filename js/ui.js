define(['core', 'sprintf', 'swiper', 'ol3', 'bootstrap', 'i18n', 'i18nxhr'],
    function(Core, sprintf, Swiper, ol, bsn, i18n, i18nxhr) {

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

    Swiper.prototype.slideToMapID = function(mapID) {
        var slide = this.$el[0].querySelector('.swiper-slide-active');
        if (slide.getAttribute('data') == mapID) return;

        var sliders = this.$el[0].querySelectorAll('.swiper-slide');
        for (var i=0; i<sliders.length; i++) {
            var slider = sliders[i];
            if (slider.getAttribute('data') == mapID) {
                return this.slideToLoop(parseInt(slider.getAttribute('data-swiper-slide-index')));
            }
        }
    };

    Swiper.prototype.slideToIndex = function(index) {
        var slide = this.$el[0].querySelector('.swiper-slide-active');
        if (parseInt(slide.getAttribute('data-swiper-slide-index')) == index) return;

        this.slideToLoop(index);
    };

    Swiper.prototype.setSlideMapID = function(mapID) {
        this.slideToMapID(mapID);
        this.setSlideMapIDAsSelected(mapID);
    };

    Swiper.prototype.setSlideIndex = function(index) {
        this.slideToIndex(index);
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

    Swiper.prototype.setSlideMapIDAsSelected = function(mapID) {
        var sliders = this.$el[0].querySelectorAll('.swiper-slide');
        for (var i=0; i<sliders.length; i++) {
            var slider = sliders[i];
            if (slider.getAttribute('data') == mapID) {
                slider.classList.add('selected');
            } else {
                slider.classList.remove('selected');
            }
        }
    };

    // Maplat UI Class
    var MaplatUi = function(appOption) {
        var ui = this;
        ui.core = new Core(appOption);

        // Modal記述の動作を調整する関数
        var modalSetting = function(target) {
            var modalElm = ui.core.mapDivDocument.querySelector('#modalBase');
            ['poi', 'map', 'load', 'gpsW', 'gpsD', 'help'].map(function(target_) {
                var className = 'modal_' + target_;
                if (target == target_) {
                    modalElm.classList.add(className);
                } else {
                    modalElm.classList.remove(className);
                }
            });
        };

        if ('ontouchstart' in window) {
            ui.core.mapDivDocument.classList.add('ol-touch');
        }
        if (appOption.mobile_if) {
            appOption.debug = true;
        }
        var lang = appOption.lang;
        if (!lang) {
            lang = browserLanguage();
        }
        var pwaManifest = appOption.pwa_manifest || './pwa/' + ui.core.appid + '_manifest.json';
        var pwaWorker = appOption.pwa_worker || './service-worker.js';

        // Add UI HTML Element
        var newElems = Core.createElement('<div class="ol-control map-title"><span></span></div>' +
            '<div class="swiper-container ol-control base-swiper prevent-default-ui">' +
            '<i class="fa fa-chevron-left swiper-left-icon" aria-hidden="true"></i>' +
            '<i class="fa fa-chevron-right swiper-right-icon" aria-hidden="true"></i>' +
            '<div class="swiper-wrapper"></div>' +
            '</div>' +
            '<div class="swiper-container ol-control overlay-swiper prevent-default-ui">' +
            '<i class="fa fa-chevron-left swiper-left-icon" aria-hidden="true"></i>' +
            '<i class="fa fa-chevron-right swiper-right-icon" aria-hidden="true"></i>' +
            '<div class="swiper-wrapper"></div>' +
            '</div>');
        for (var i=newElems.length - 1; i >= 0; i--) {
            ui.core.mapDivDocument.insertBefore(newElems[i], ui.core.mapDivDocument.firstChild);
        }
        var prevDefs = ui.core.mapDivDocument.querySelectorAll('.prevent-default-ui');
        for (var i=0; i<prevDefs.length; i++) {
            var target = prevDefs[i];
            target.addEventListener('touchstart', function(evt) {
                evt.preventDefault();
            });
        }

        var newElems = Core.createElement('<div class="modal" id="modalBase" tabindex="-1" role="dialog" ' +
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
            '<span id="modal_load_title"></span>' +
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
            ui.core.mapDivDocument.insertBefore(newElems[i], ui.core.mapDivDocument.firstChild);
        }

        var i18nPromise = new Promise(function(resolve, reject) {
            i18n.use(i18nxhr).init({
                lng: lang,
                fallbackLng: ['en'],
                backend: {
                    loadPath: 'locales/{{lng}}/{{ns}}.json'
                }
            }, function(err, t) {
                var i18nTargets = ui.core.mapDivDocument.querySelectorAll('[data-i18n]');
                for (var i=0; i<i18nTargets.length; i++) {
                    var target = i18nTargets[i];
                    var key = target.getAttribute('data-i18n');
                    target.innerText = t(key);
                }
                var i18nTargets = ui.core.mapDivDocument.querySelectorAll('[data-i18n-html]');
                for (var i=0; i<i18nTargets.length; i++) {
                    var target = i18nTargets[i];
                    var key = target.getAttribute('data-i18n-html');
                    target.innerHTML = t(key);
                }
                resolve([t, i18n]);
            });
        });

        // PWA対応: 非同期処理
        var xhr = new XMLHttpRequest();
        xhr.open('GET', pwaManifest, true);
        xhr.responseType = 'json';

        xhr.onload = function(e) {
            var value = this.response;
            if (!value) return;
            if (typeof value != 'object') value = JSON.parse(value);

            var head = document.querySelector('head');
            head.appendChild((Core.createElement('<link rel="manifest" href="' + pwaManifest + '">'))[0]);
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
                    head.appendChild((Core.createElement(tag))[0]);
                }
            }
        };
        xhr.send();

        ui.core.addEventListener('uiPrepare', function(evt) {
            i18nPromise.then(function(result){
                ui.i18n = result[1];
                ui.t = result[0];

                ui.sliderCommon = new ol.control.SliderCommon({reverse: true, tipLabel: ui.t('control.trans', {ns: 'translation'})});
                ui.core.appData.controls = [
                    new ol.control.Copyright({tipLabel: ui.t('control.info', {ns: 'translation'})}),
                    new ol.control.CompassRotate({tipLabel: ui.t('control.compass', {ns: 'translation'})}),
                    new ol.control.Zoom({tipLabel: ui.t('control.zoom', {ns: 'translation'})}),
                    new ol.control.SetGPS({tipLabel: ui.t('control.gps', {ns: 'translation'})}),
                    new ol.control.GoHome({tipLabel: ui.t('control.home', {ns: 'translation'})}),
                    ui.sliderCommon,
                    new ol.control.Maplat({tipLabel: ui.t('control.help', {ns: 'translation'})})
                ];
                if (ui.core.mapObject) {
                    ui.core.appData.controls.map(function(control) {
                        ui.core.mapObject.addControl(control);
                    });
                }

                ui.sliderCommon.on('propertychange', function(evt) {
                    if (evt.key === 'slidervalue') {
                        ui.core.mapObject.setOpacity(ui.sliderCommon.get(evt.key) * 100);
                    }
                });

                // Check Splash data
                var splash = false;
                if (ui.core.appData.splash) splash = true;

                var modalElm = ui.core.mapDivDocument.querySelector('#modalBase');
                var modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
                ui.core.mapDivDocument.querySelector('#modal_load_title').innerText = ui.translate(ui.core.appData.app_name);
                if (splash) {
                    ui.core.mapDivDocument.querySelector('#splash_img').setAttribute('src', 'img/' + ui.core.appData.splash);
                    ui.core.mapDivDocument.querySelector('#splash_div').classList.remove('hide');
                }
                modalSetting('load');
                modal.show();

                var fadeTime = splash ? 1000 : 200;
                ui.splashPromise = new Promise(function(resolve) {
                    setTimeout(function() {
                        resolve();
                    }, fadeTime);
                });

                var baseSwiper, overlaySwiper;
                baseSwiper = ui.baseSwiper = new Swiper('.base-swiper', {
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
                    threshold: 2,
                    loop: true
                });
                baseSwiper.on('click', function(e) {
                    e.preventDefault();
                    if (!baseSwiper.clickedSlide) return;
                    var slide = baseSwiper.clickedSlide;
                    ui.core.changeMap(slide.getAttribute('data'));
                    baseSwiper.setSlideIndexAsSelected(slide.getAttribute('data-swiper-slide-index'));
                });
                overlaySwiper = ui.overlaySwiper = new Swiper('.overlay-swiper', {
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
                    threshold: 2,
                    loop: true
                });
                overlaySwiper.on('click', function(e) {
                    e.preventDefault();
                    if (!overlaySwiper.clickedSlide) return;
                    var slide = overlaySwiper.clickedSlide;
                    ui.core.changeMap(slide.getAttribute('data'));
                    overlaySwiper.setSlideIndexAsSelected(slide.getAttribute('data-swiper-slide-index'));
                });

                document.querySelector('title').innerHTML = ui.translate(ui.core.appName);
            });
        });

        ui.core.addEventListener('sourceLoaded', function(evt) {
            var sources = evt.detail;

            ui.splashPromise.then(function() {
                var modalElm = ui.core.mapDivDocument.querySelector('#modalBase');
                var modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
                modalSetting('load');
                modal.hide();
            });

            for (var i=0; i<sources.length; i++) {
                var source = sources[i];
                if (source instanceof ol.source.NowMap && !(source instanceof ol.source.TmsMap)) {
                    ui.baseSwiper.appendSlide('<div class="swiper-slide" data="' + source.sourceID + '">' +
                        '<img crossorigin="anonymous" src="' + source.thumbnail + '"><div>' + ui.translate(source.label) + '</div></div>');
                } else {
                    ui.overlaySwiper.appendSlide('<div class="swiper-slide" data="' + source.sourceID + '">' +
                        '<img crossorigin="anonymous" src="' + source.thumbnail + '"><div>' + ui.translate(source.label) + '</div></div>');
                }
            }
            ui.baseSwiper.on;
            ui.overlaySwiper.on;
            ui.baseSwiper.slideToLoop(0);
            ui.overlaySwiper.slideToLoop(0);
            ui.ellips();
        });

        ui.core.addEventListener('mapChanged', function(evt) {
            var map = evt.detail;

            ui.baseSwiper.setSlideMapID(map.sourceID);
            ui.overlaySwiper.setSlideMapID(map.sourceID);

            var title = map.officialTitle || map.title || map.label;
            ui.core.mapDivDocument.querySelector('.map-title span').innerText = ui.translate(title);

            if (ui.checkOverlayID(map.sourceID)) {
                ui.sliderCommon.setEnable(true);
            } else {
                ui.sliderCommon.setEnable(false);
            }
            var opacity = ui.sliderCommon.get('slidervalue') * 100;
            ui.core.mapObject.setOpacity(opacity);
        });

        ui.core.addEventListener('outOfMap', function(evt) {
            ui.core.mapDivDocument.querySelector('#modal_title').innerText = ui.t('app.out_of_map');
            ui.core.mapDivDocument.querySelector('#modal_gpsD_content').innerText = ui.t('app.out_of_map_area');
            var modalElm = ui.core.mapDivDocument.querySelector('#modalBase');
            var modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
            modalSetting('gpsD');
            modal.show();
        });

        ui.core.addEventListener('clickMarker', function(evt) {
            var data = evt.detail;
            ui.core.mapDivDocument.querySelector('#modal_title').innerText = ui.translate(data.name);
            if (data.url || data.html) {
                ui.core.mapDivDocument.querySelector('#poi_web').classList.remove('hide');
                ui.core.mapDivDocument.querySelector('#poi_data').classList.add('hide');
                if (data.html) {
                    ui.core.mapDivDocument.querySelector('#poi_iframe').setAttribute('srcdoc', ui.translate(data.html));
                } else {
                    ui.core.mapDivDocument.querySelector('#poi_iframe').setAttribute('src', ui.translate(data.url));
                }
            } else {
                ui.core.mapDivDocument.querySelector('#poi_data').classList.remove('hide');
                ui.core.mapDivDocument.querySelector('#poi_web').classList.add('hide');

                if (data.image && data.image != '') {
                    ui.core.mapDivDocument.querySelector('#poi_img').setAttribute('src',
                        data.image.match(/^http/) ? data.image : 'img/' + data.image);
                } else {
                    ui.core.mapDivDocument.querySelector('#poi_img').setAttribute('src', 'parts/no_image.png');
                }
                ui.core.mapDivDocument.querySelector('#poi_address').innerText = ui.translate(data.address);
                ui.core.mapDivDocument.querySelector('#poi_desc').innerHTML = ui.translate(data.desc).replace(/\n/g, '<br>');
            }
            var modalElm = ui.core.mapDivDocument.querySelector('#modalBase');
            var modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
            modalSetting('poi');
            modal.show();
        });

        ui.waitReady = ui.core.waitReady.then(function(){
            var fakeGps = appOption.fake ? ui.core.appData.fake_gps : false;
            var fakeCenter = appOption.fake ? ui.core.appData.fake_center : false;
            var fakeRadius = appOption.fake ? ui.core.appData.fake_radius : false;

            var shown = false;
            var gpsWaitPromise = null;
            function showGPSresult(result) {
                if (result && result.error) {
                    ui.core.currentPosition = null;
                    if (result.error == 'gps_out' && shown) {
                        shown = false;
                        var modalElm = ui.core.mapDivDocument.querySelector('#modalBase');
                        var modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
                        ui.core.mapDivDocument.querySelector('#modal_title').innerText = ui.t('app.out_of_map');
                        ui.core.mapDivDocument.querySelector('#modal_gpsD_content').innerText = ui.t('app.out_of_map_desc');
                        modalSetting('gpsD');
                        modal.show();
                    }
                } else {
                    ui.core.currentPosition = result;
                }
                if (shown) {
                    shown = false;
                    var modalElm = ui.core.mapDivDocument.querySelector('#modalBase');
                    var modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
                    modal.hide();
                }
            }
            ui.core.mapObject.on('gps_request', function() {
                gpsWaitPromise = 'gps_request';
                var promises = [
                    new Promise(function(resolve) {
                        if (gpsWaitPromise != 'gps_request') {
                            resolve(gpsWaitPromise);
                        } else gpsWaitPromise = resolve;
                    })
                ];
                shown = true;
                var modalElm = ui.core.mapDivDocument.querySelector('#modalBase');
                var modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
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
            ui.core.mapObject.on('gps_result', function(evt) {
                if (gpsWaitPromise == 'gps_request') {
                    gpsWaitPromise = evt.frameState;
                } else if (gpsWaitPromise) {
                    gpsWaitPromise(evt.frameState);
                    gpsWaitPromise = null;
                } else if (!shown) {
                    showGPSresult(evt.frameState);
                }
            });
            ui.core.mapObject.on('click_control', function(evt) {
                var control = evt.frameState.control;
                if (control == 'copyright') {
                    var from = ui.core.getMapMeta();

                    if (!ol.source.META_KEYS.reduce(function(prev, curr) {
                        if (curr == 'title') return prev;
                        return from[curr] || prev;
                    }, false)) return;

                    ui.core.mapDivDocument.querySelector('#modal_title').innerText = ui.translate(from.officialTitle || from.title);
                    ol.source.META_KEYS.map(function(key) {
                        if (key == 'title' || key == 'officialTitle') return;
                        if (!from[key] || from[key] == '') {
                            ui.core.mapDivDocument.querySelector('#' + key + '_div').classList.add('hide');
                        } else {
                            ui.core.mapDivDocument.querySelector('#' + key + '_div').classList.remove('hide');
                            ui.core.mapDivDocument.querySelector('#' + key).innerHTML =
                                (key == 'license' || key == 'dataLicense') ?
                                    '<img src="parts/' + from[key].toLowerCase().replace(/ /g, '_') + '.png">' :
                                    ui.translate(from[key]);
                        }
                    });
                    var modalElm = ui.core.mapDivDocument.querySelector('#modalBase');
                    var modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
                    modalSetting('map');
                    modal.show();
                } else {
                    var modalElm = ui.core.mapDivDocument.querySelector('#modalBase');
                    var modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
                    modalSetting('help');
                    modal.show();
                }
            });
            if (fakeGps) {
                var newElem = Core.createElement(sprintf(ui.t('app.fake_explanation'), ui.translate(fakeCenter), fakeRadius))[0];
                var elem = ui.core.mapDivDocument.querySelector('#modal_gpsW_content');
                elem.appendChild(newElem);
            } else {
                var newElem = Core.createElement(ui.t('app.acquiring_gps_desc'))[0];
                var elem = ui.core.mapDivDocument.querySelector('#modal_gpsW_content');
                elem.appendChild(newElem);
            }
        });
    };

    ol.inherits(MaplatUi, ol.events.EventTarget);

    MaplatUi.prototype.checkOverlayID = function(mapID) {
        var ui = this;
        var swiper = ui.overlaySwiper;
        var sliders = swiper.$el[0].querySelectorAll('.swiper-slide');
        for (var i=0; i<sliders.length; i++) {
            var slider = sliders[i];
            if (slider.getAttribute('data') == mapID) {
                return true;
            }
        }
        return false;
    };

    MaplatUi.prototype.ellips = function() {
        var ui = this;
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
        var swiperItems = ui.core.mapDivDocument.querySelectorAll('.swiper-slide div');
        for (var i = 0; i < swiperItems.length; i++) {
            var swiperItem = swiperItems[i];
            stringSplit(swiperItem);
            omitCheck(swiperItem);
        }
    };

    MaplatUi.prototype.translate = function(dataFragment) {
        var ui = this;
        if (!dataFragment || typeof dataFragment != 'object') return dataFragment;
        var langs = Object.keys(dataFragment);
        var key = langs.reduce(function(prev, curr, idx, arr) {
            if (curr == ui.core.appLang) {
                prev = [dataFragment[curr], true];
            } else if (!prev || (curr == 'en' && !prev[1])) {
                prev = [dataFragment[curr], false];
            }
            if (idx == arr.length - 1) return prev[0];
            return prev;
        }, null);
        key = (typeof key == 'string') ? key : key + '';
        if (ui.i18n.exists(key, {ns: 'translation', nsSeparator: '__X__yX__X__'}))
            return ui.t(key, {ns: 'translation', nsSeparator: '__X__yX__X__'});
        for (var i = 0; i < langs.length; i++) {
            var lang = langs[i];
            ui.i18n.addResource(lang, 'translation', key, dataFragment[lang]);
        }
        return ui.t(key, {ns: 'translation', nsSeparator: '__X__yX__X__'});
    };

    return MaplatUi;
});
