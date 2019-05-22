define(['core', 'sprintf', 'swiper', 'ol-ui-custom', 'bootstrap', 'page', 'iziToast', 'qrcode', 'turf'],
    function(Core, sprintf, Swiper, ol, bsn, page, iziToast, QRCode, turf) {
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
        ui.html_id_seed = '' + (Math.floor( Math.random() * 9000 ) + 1000);

        if (appOption.state_url) {
            page(function(ctx, next) {
                var pathes = ctx.canonicalPath.split('#!');
                var path = pathes.length > 1 ? pathes[1] : pathes[0];
                pathes = path.split('?');
                path = pathes[0];
                if (path == ui.pathThatSet) {
                    delete ui.pathThatSet;
                    return;
                }
                var restore = {
                    transparency: 0,
                    position: {
                        rotation: 0
                    }
                };
                path.split('/').map(function(state) {
                    var line = state.split(':');
                    switch (line[0]) {
                        case 's':
                            restore.sourceID = line[1];
                            break;
                        case 'b':
                            restore.backgroundID = line[1];
                            break;
                        case 't':
                            restore.transparency = parseFloat(line[1]);
                            break;
                        case 'r':
                            restore.position.rotation = parseFloat(line[1]);
                            break;
                        case 'z':
                            restore.position.zoom = parseFloat(line[1]);
                            break;
                        case 'x':
                        case 'y':
                            restore.position[line[0]] = parseFloat(line[1]);
                            break;
                        case 'sb':
                            restore.showBorder = parseInt(line[1]) ? true : false;
                            break;
                        case 'hm':
                            restore.hideMarker = parseInt(line[1]) ? true : false;
                            break;
                        case 'hl':
                            restore.hideLayer = line[1];
                            break;
                        case 'c':
                            if (ui.core) {
                                var modalElm = ui.core.mapDivDocument.querySelector('.modalBase');
                                var modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
                                modal.hide();
                            }
                    }
                });
                if (!ui.core) {
                    if (restore.sourceID) {
                        appOption.restore = restore;
                    }
                    ui.initializer(appOption);
                } else if (restore.sourceID) {
                    ui.core.waitReady.then(function() {
                        ui.core.changeMap(restore.sourceID, restore);
                    });
                }
            });
            page({
                hashbang: true
            });
            page();
            ui.waitReady = new Promise(function(resolve, reject) {
                ui.waitReadyBridge = resolve;
            });
        } else {
            ui.initializer(appOption);
        }
    };

    ol.inherits(MaplatUi, ol.events.EventTarget);

    MaplatUi.prototype.initializer = function(appOption) {
        var ui = this;
        ui.core = new Core(appOption);

        if (appOption.restore) {
            ui.setShowBorder(appOption.restore.showBorder || false);
            if (appOption.restore.hideMarker) {
                ui.core.mapDivDocument.classList.add('hide-marker');
            }
        } else if (appOption.restore_session) {
            var lastEpoch = parseInt(localStorage.getItem('epoch') || 0);
            var currentTime = Math.floor(new Date().getTime() / 1000);
            if (lastEpoch && currentTime - lastEpoch < 3600) {
                ui.setShowBorder(parseInt(localStorage.getItem('showBorder') || '0') ? true : false);
            }
            if (ui.core.initialRestore.hideMarker) {
                ui.core.mapDivDocument.classList.add('hide-marker');
            }
        } else {
            ui.setShowBorder(false);
        }

        var enableSplash = ui.core.initialRestore.sourceID ? false : true;
        var restoreTransparency = ui.core.initialRestore.transparency;
        var enableOutOfMap = appOption.presentation_mode ? false : true;

        // Modal記述の動作を調整する関数
        var modalSetting = function(target) {
            var modalElm = ui.core.mapDivDocument.querySelector('.modalBase');
            ['poi', 'map', 'load', 'gpsW', 'gpsD', 'help', 'share', 'hide_marker'].map(function(target_) {
                var className = 'modal_' + target_;
                if (target == target_) {
                    modalElm.classList.add(className);
                } else {
                    modalElm.classList.remove(className);
                }
            });
        };

        if (appOption.share_enable) {
            ui.core.mapDivDocument.classList.add('share_enable');
            ui.shareEnable = true;
        }
        if (appOption.state_url) {
            ui.core.mapDivDocument.classList.add('state_url');
        }
        if (ui.core.cacheEnable) {
            ui.core.mapDivDocument.classList.add('cache_enable');
        }
        if ('ontouchstart' in window) {
            ui.core.mapDivDocument.classList.add('ol-touch');
        }
        if (appOption.mobile_if) {
            appOption.debug = true;
        }

        var pwaManifest = appOption.pwa_manifest;
        var pwaWorker = appOption.pwa_worker;

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

        var newElems = Core.createElement('<div class="modal modalBase" tabindex="-1" role="dialog" ' +
            'aria-labelledby="staticModalLabel" aria-hidden="true" data-show="true" data-keyboard="false" ' +
            'data-backdrop="static">' +
            '<div class="modal-dialog">' +
            '<div class="modal-content">' +
            '<div class="modal-header">' +
            '<button type="button" class="close" data-dismiss="modal">' +
            '<span aria-hidden="true">&#215;</span><span class="sr-only" data-i18n="html.close"></span>' +
            '</button>' +
            '<h4 class="modal-title">' +

            '<span class="modal_title"></span>' +
            '<span class="modal_load_title"></span>' +
            '<span class="modal_gpsW_title" data-i18n="html.acquiring_gps"></span>' +
            '<span class="modal_help_title" data-i18n="html.help_title"></span>' +
            '<span class="modal_share_title" data-i18n="html.share_title"></span>' +
            '<span class="modal_hide_marker_title" data-i18n="html.hide_marker_title"></span>' +

            '</h4>' +
            '</div>' +
            '<div class="modal-body">' +

            '<div class="modal_help_content">' +
            '<div class="help_content">' +
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
            '<span class="share_help"><li data-i18n-html="html.help_share_help" class="recipient"></li></span>' +
            '<li data-i18n-html="html.help_etc_border" class="recipient"></li>' +
            '<li data-i18n-html="html.help_etc_hide_marker" class="recipient"></li>' +
            '<li data-i18n-html="html.help_etc_slider" class="recipient"></li>' +
            '</ul>' +
            '<p><a href="https://github.com/code4nara/Maplat/wiki" target="_blank">Maplat</a>' +
            ' © 2015- Kohei Otsuka, Code for Nara, RekishiKokudo project</p>' +
            '</div>' +
            '</div>' +

            '<div class="modal_poi_content">' +
            '<div class="poi_web embed-responsive embed-responsive-60vh">' +
            '<iframe class="poi_iframe iframe_poi" frameborder="0" src=""></iframe>' +
            '</div>' +
            '<div class="poi_data hide">' +
            '<p class="col-xs-12 poi_img"><img class="poi_img_tag" src="parts/loading_image.png"></p>' +
            '<p class="recipient poi_address"></p>' +
            '<p class="recipient poi_desc"></p>' +
            '</div>' +
            '</div>' +

            '<div class="modal_share_content">' +
            '<h4 data-i18n="html.share_app_title"></h4><div id="___maplat_app_toast_' + ui.html_id_seed + '"></div>' +
            '<div class="recipient row">' +
            '<div class="form-group col-xs-4 text-center"><button title="Copy to clipboard" class="share btn btn-light" data="cp_app"><i class="fa fa-clipboard"></i>&nbsp;<small data-i18n="html.share_copy"></small></button></div>' +
            '<div class="form-group col-xs-4 text-center"><button title="Twitter" class="share btn btn-light" data="tw_app"><i class="fa fa-twitter"></i>&nbsp;<small>Twitter</small></button></div>' +
            '<div class="form-group col-xs-4 text-center"><button title="Facebook" class="share btn btn-light" data="fb_app"><i class="fa fa-facebook"></i>&nbsp;<small>Facebook</small></button></div></div>' +
            '<div class="qr_app center-block" style="width:128px;"></div>' +
            '<div class="modal_share_state">' +
            '<h4 data-i18n="html.share_state_title"></h4><div id="___maplat_view_toast_' + ui.html_id_seed + '"></div>' +
            '<div class="recipient row">' +
            '<div class="form-group col-xs-4 text-center"><button title="Copy to clipboard" class="share btn btn-light" data="cp_view"><i class="fa fa-clipboard"></i>&nbsp;<small data-i18n="html.share_copy"></small></button></div>' +
            '<div class="form-group col-xs-4 text-center"><button title="Twitter" class="share btn btn-light" data="tw_view"><i class="fa fa-twitter"></i>&nbsp;<small>Twitter</small></button></div>' +
            '<div class="form-group col-xs-4 text-center"><button title="Facebook" class="share btn btn-light" data="fb_view"><i class="fa fa-facebook"></i>&nbsp;<small>Facebook</small></button></div></div>' +
            '<div class="qr_view center-block" style="width:128px;"></div>' +
            '</div>' +
            '<p><img src="" height="0px" width="0px"></p>' +
            '</div>' +

            '<div class="modal_map_content">' +

            ol.source.META_KEYS.map(function(key) {
                if (key == 'title' || key == 'officialTitle') return '';

                return '<div class="recipients ' + key + '_div"><dl class="dl-horizontal">' +
                    '<dt data-i18n="html.' + key + '"></dt>' +
                    '<dd class="' + key + '_dd"></dd>' +
                    '</dl></div>';
            }).join('') +

            '<div class="recipients" class="modal_cache_content"><dl class="dl-horizontal">' +
            '<dt data-i18n="html.cache_handle"></dt>' +
            '<dd><span class="cache_size"></span>' +
            '<a class="cache_delete btn btn-default pull-right" href="#" data-i18n="html.cache_delete"></a></dd>' +
            '</dl></div>' +

            '</div>' +

            '<div class="modal_load_content">' +
            '<p class="recipient"><img src="parts/loading.png"><span data-i18n="html.app_loading_body"></span></p>' +
            '<div class="splash_div hide row"><p class="col-xs-12 poi_img"><img class="splash_img" src=""></p></div>' +
            '<p><img src="" height="0px" width="0px"></p>' +
            '</div>' +

            '<div class="modal_hide_marker_content">' +
            '<ul class="list-group">' +
            '</ul>' +
            '</div>' +

            '<p class="modal_gpsD_content" class="recipient"></p>' +
            '<p class="modal_gpsW_content" class="recipient"></p>' +

            '</div>' +
            '</div>' +
            '</div>' +
            '</div>');
        for (var i=newElems.length - 1; i >= 0; i--) {
            ui.core.mapDivDocument.insertBefore(newElems[i], ui.core.mapDivDocument.firstChild);
        }

        var shareBtns = ui.core.mapDivDocument.querySelectorAll('.btn.share');
        for (var i=0; i<shareBtns.length; i++) {
            var shareBtn = shareBtns[i];
            shareBtn.addEventListener('click', function(evt) {
                var btn = evt.target;
                if (!btn.classList.contains('share')) btn = btn.parentElement;
                var cmd = btn.getAttribute('data');
                var cmds = cmd.split('_');
                var base = evt.target.baseURI;
                var div1 = base.split('#!');
                var path = div1.length > 1 ? (div1[1].split('?'))[0] : '';
                var div2 = div1[0].split('?');
                var uri = div2[0];
                var query = div2.length > 1 ? div2[1].split('&').filter(function(qs) {
                    return (qs == 'pwa') ? false : true;
                }).join('&') : '';

                if (query) uri = uri + '?' + query;
                if (cmds[1] == 'view') {
                    if (path) uri = uri + '#!' + path;
                }
                if (cmds[0] == 'cp') {
                    var copyFrom = document.createElement('textarea');
                    copyFrom.textContent = uri;

                    var bodyElm = document.querySelector('body');
                    bodyElm.appendChild(copyFrom);

                    if (/iP(hone|(o|a)d)/.test(navigator.userAgent)) {
                        var range = document.createRange();
                        range.selectNode(copyFrom);
                        window.getSelection().addRange(range);
                    } else {
                        copyFrom.select();
                    }

                    document.execCommand('copy');
                    bodyElm.removeChild(copyFrom);
                    var toastParent = '#___maplat_' + cmds[1] + '_toast_' + ui.html_id_seed;
                    iziToast.show(
                        {
                            message: ui.core.t('app.copy_toast', {ns: 'translation'}),
                            close: false,
                            pauseOnHover: false,
                            timeout: 1000,
                            progressBar: false,
                            target: toastParent
                        }
                    );
                } else if (cmds[0] == 'tw') {
                    var twuri = 'https://twitter.com/share?url=' + encodeURIComponent(uri) + '&hashtags=Maplat';
                    window.open(twuri, '_blank', 'width=650,height=450,menubar=no,toolbar=no,scrollbars=yes');
                } else if (cmds[0] == 'fb') {
                    // https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fdevelopers.facebook.com%2Fdocs%2Fplugins%2Fshare-button%2F&display=popup&ref=plugin&src=like&kid_directed_site=0&app_id=113869198637480
                    var fburi = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(uri) +
                        '&display=popup&ref=plugin&src=like&kid_directed_site=0';
                    window.open(fburi, '_blank', 'width=650,height=450,menubar=no,toolbar=no,scrollbars=yes');
                }
            });
        }

        // PWA対応: 非同期処理
        if (pwaManifest) {
            if (pwaManifest === true) {
                pwaManifest = './pwa/' + ui.core.appid + '_manifest.json';
            }
            if (!pwaWorker) {
                pwaWorker = './service-worker.js';
            }

            var head = document.querySelector('head');
            if (!head.querySelector('link[rel="manifest"]')) {
                head.appendChild((Core.createElement('<link rel="manifest" href="' + pwaManifest + '">'))[0]);
            }
            // service workerが有効なら、service-worker.js を登録します
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register(pwaWorker).then(function(reg) {
                    console.log('Service Worker Registered');
                    reg.onupdatefound = function() {
                        console.log('Found Service Worker update');
                        reg.update().catch(function(e) {
                            throw e;
                        });
                    };
                }).catch(function(err) {
                    console.log(err);
                });
            }

            if (!head.querySelector('link[rel="apple-touch-icon"]')) {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', pwaManifest, true);
                xhr.responseType = 'json';

                xhr.onload = function(e) {
                    var value = this.response;
                    if (!value) return;
                    if (typeof value != 'object') value = JSON.parse(value);

                    if (value.icons) {
                        for (var i = 0; i < value.icons.length; i++) {
                            var src = absoluteUrl(pwaManifest, value.icons[i].src);
                            var sizes = value.icons[i].sizes;
                            var tag = '<link rel="apple-touch-icon" sizes="' + sizes + '" href="' + src + '">';
                            head.appendChild((Core.createElement(tag))[0]);
                        }
                    }
                };
                xhr.send();
            }
        }

        var i18nPromise;

        ui.core.addEventListener('uiPrepare', function(evt) {
            var i18nTargets = ui.core.mapDivDocument.querySelectorAll('[data-i18n]');
            for (var i=0; i<i18nTargets.length; i++) {
                var target = i18nTargets[i];
                var key = target.getAttribute('data-i18n');
                target.innerText = ui.core.t(key);
            }
            var i18nTargets = ui.core.mapDivDocument.querySelectorAll('[data-i18n-html]');
            for (var i=0; i<i18nTargets.length; i++) {
                var target = i18nTargets[i];
                var key = target.getAttribute('data-i18n-html');
                target.innerHTML = ui.core.t(key);
            }

            var options = {reverse: true, tipLabel: ui.core.t('control.trans', {ns: 'translation'})};
            if (restoreTransparency) {
                options.initialValue = restoreTransparency / 100;
            }
            ui.sliderCommon = new ol.control.SliderCommon(options);
            ui.core.appData.controls = [
                new ol.control.Copyright({tipLabel: ui.core.t('control.info', {ns: 'translation'})}),
                new ol.control.CompassRotate({tipLabel: ui.core.t('control.compass', {ns: 'translation'})}),
                new ol.control.Zoom({tipLabel: ui.core.t('control.zoom', {ns: 'translation'})}),
                new ol.control.SetGPS({tipLabel: ui.core.t('control.gps', {ns: 'translation'})}),
                new ol.control.GoHome({tipLabel: ui.core.t('control.home', {ns: 'translation'})}),
                ui.sliderCommon,
                new ol.control.Maplat({tipLabel: ui.core.t('control.help', {ns: 'translation'})}),
                new ol.control.Border({tipLabel: ui.core.t('control.border', {ns: 'translation'})}),
                new ol.control.HideMarker({tipLabel: ui.core.t('control.hide_marker', {ns: 'translation'})})
            ];
            if (ui.shareEnable) {
                ui.core.appData.controls.push(new ol.control.Share({tipLabel: ui.core.t('control.share', {ns: 'translation'})}));
            }
            if (ui.core.mapObject) {
                ui.core.appData.controls.map(function(control) {
                    ui.core.mapObject.addControl(control);
                });
            }

            ui.sliderCommon.on('propertychange', function(evt) {
                if (evt.key === 'slidervalue') {
                    ui.core.setTransparency(ui.sliderCommon.get(evt.key) * 100);
                }
            });

            if (enableSplash) {
                // Check Splash data
                var splash = false;
                if (ui.core.appData.splash) splash = true;

                var modalElm = ui.core.mapDivDocument.querySelector('.modalBase');
                var modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
                ui.core.mapDivDocument.querySelector('.modal_load_title').innerText = ui.core.translate(ui.core.appData.app_name);
                if (splash) {
                    ui.core.mapDivDocument.querySelector('.splash_img').setAttribute('src', 'img/' + ui.core.appData.splash);
                    ui.core.mapDivDocument.querySelector('.splash_div').classList.remove('hide');
                }
                modalSetting('load');
                modal.show();

                var fadeTime = splash ? 1000 : 200;
                ui.splashPromise = new Promise(function (resolve) {
                    setTimeout(function () {
                        resolve();
                    }, fadeTime);
                });
            }

            document.querySelector('title').innerHTML = ui.core.translate(ui.core.appName);
        });

        ui.core.addEventListener('sourceLoaded', function(evt) {
            var sources = evt.detail;

            var colors = ['maroon', 'deeppink', 'indigo', 'olive', 'royalblue',
                'red', 'hotpink', 'green', 'yellow', 'navy',
                'saddlebrown', 'fuchsia', 'darkslategray', 'yellowgreen', 'blue',
                'mediumvioletred', 'purple', 'lime', 'darkorange', 'teal',
                'crimson', 'darkviolet', 'darkolivegreen', 'steelblue', 'aqua'];
            var cIndex = 0;
            for (var i=0; i<sources.length; i++) {
                var source = sources[i];
                if (source.envelope) {
                    source.envelopeColor = colors[cIndex];
                    cIndex = cIndex + 1;
                    if (cIndex == colors.length) cIndex = 0;

                    var xys = source.envelope.geometry.coordinates[0];
                    source.envelopeAreaIndex = 0.5 * Math.abs([0, 1, 2, 3].reduce(function(prev, curr, i) {
                        var xy1 = xys[i];
                        var xy2 = xys[i+1];
                        return prev + (xy1[0] - xy2[0]) * (xy1[1] + xy2[1]);
                    }, 0));
                }
            }

            if (ui.splashPromise) {
                ui.splashPromise.then(function() {
                    var modalElm = ui.core.mapDivDocument.querySelector('.modalBase');
                    var modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
                    modalSetting('load');
                    modal.hide();
                });
            }

            var baseSources= [];
            var overlaySources = [];
            for (var i=0; i<sources.length; i++) {
                var source = sources[i];
                if (source instanceof ol.source.NowMap && !(source instanceof ol.source.TmsMap)) {
                    baseSources.push(source);
                } else {
                    overlaySources.push(source);
                }
            }

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
                loop: baseSources.length < 2 ? false : true
            });
            baseSwiper.on('click', function(e) {
                e.preventDefault();
                if (!baseSwiper.clickedSlide) return;
                var slide = baseSwiper.clickedSlide;
                ui.core.changeMap(slide.getAttribute('data'));
                delete ui.selectCandidate;
                delete ui._selectCandidateSource;
                baseSwiper.setSlideIndexAsSelected(slide.getAttribute('data-swiper-slide-index'));
            });
            if (baseSources.length < 2) {
                ui.core.mapDivDocument.querySelector('.base-swiper').classList.add('single-map');
            }
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
                loop: overlaySources.length < 2 ? false : true
            });
            overlaySwiper.on('click', function(e) {
                e.preventDefault();
                if (!overlaySwiper.clickedSlide) return;
                var slide = overlaySwiper.clickedSlide;
                ui.core.changeMap(slide.getAttribute('data'));
                delete ui.selectCandidate;
                delete ui._selectCandidateSource;
                overlaySwiper.setSlideIndexAsSelected(slide.getAttribute('data-swiper-slide-index'));
            });
            if (overlaySources.length < 2) {
                ui.core.mapDivDocument.querySelector('.overlay-swiper').classList.add('single-map');
            }

            for (var i=0; i<baseSources.length; i++) {
                var source = baseSources[i];
                var colorCss = source.envelope ? ' ' + source.envelopeColor : '';
                baseSwiper.appendSlide('<div class="swiper-slide" data="' + source.sourceID + '">' +
                    '<img crossorigin="anonymous" src="' + source.thumbnail + '"><div>' + ui.core.translate(source.label) + '</div></div>');
            }
            for (var i=0; i<overlaySources.length; i++) {
                var source = overlaySources[i];
                var colorCss = source.envelope ? ' ' + source.envelopeColor : '';
                overlaySwiper.appendSlide('<div class="swiper-slide' + colorCss + '" data="' + source.sourceID + '">' +
                    '<img crossorigin="anonymous" src="' + source.thumbnail + '"><div>' + ui.core.translate(source.label) + '</div></div>');
            }

            baseSwiper.on;
            overlaySwiper.on;
            baseSwiper.slideToLoop(0);
            overlaySwiper.slideToLoop(0);
            ui.ellips();
        });

        ui.core.addEventListener('mapChanged', function(evt) {
            var map = evt.detail;

            ui.baseSwiper.setSlideMapID(map.sourceID);
            ui.overlaySwiper.setSlideMapID(map.sourceID);

            var title = map.officialTitle || map.title || map.label;
            ui.core.mapDivDocument.querySelector('.map-title span').innerText = ui.core.translate(title);

            if (ui.checkOverlayID(map.sourceID)) {
                ui.sliderCommon.setEnable(true);
            } else {
                ui.sliderCommon.setEnable(false);
            }
            var transparency = ui.sliderCommon.get('slidervalue') * 100;
            ui.core.mapObject.setTransparency(transparency);

            ui.updateEnvelope();
        });

        ui.core.addEventListener('poi_number', function(evt) {
            var number = evt.detail;
            if (number) {
                ui.core.mapDivDocument.classList.remove('no_poi');
            } else {
                ui.core.mapDivDocument.classList.add('no_poi');
            }
        });

        ui.core.addEventListener('outOfMap', function(evt) {
            if (enableOutOfMap) {
                ui.core.mapDivDocument.querySelector('.modal_title').innerText = ui.core.t('app.out_of_map');
                ui.core.mapDivDocument.querySelector('.modal_gpsD_content').innerText = ui.core.t('app.out_of_map_area');
                var modalElm = ui.core.mapDivDocument.querySelector('.modalBase');
                var modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
                modalSetting('gpsD');
                modal.show();
            }
        });

        ui.core.mapDivDocument.addEventListener('mouseout', function(evt){
            delete ui.selectCandidate;
            if (ui._selectCandidateSource) {
                ui.core.mapObject.removeEnvelope(ui._selectCandidateSource);
                delete ui._selectCandidateSource;
            }
        });

        ui.core.addEventListener('pointerMoveOnMapXy', function(evt) {
            if (!ui.core.stateBuffer.showBorder) {
                delete ui.selectCandidate;
                if (ui._selectCandidateSource) {
                    ui.core.mapObject.removeEnvelope(ui._selectCandidateSource);
                    delete ui._selectCandidateSource;
                }
                return;
            }

            ui.xyToSourceID(evt.detail, function(sourceID) {
                ui.showFillEnvelope(sourceID);
            });
        });

        ui.core.addEventListener('clickMapXy', function(evt) {
            if (!ui.core.stateBuffer.showBorder) {
                return;
            }

            ui.xyToSourceID(evt.detail, function(sourceID) {
                if (ui.selectCandidate && ui.selectCandidate == sourceID) {
                    ui.core.changeMap(ui.selectCandidate);
                    delete ui.selectCandidate;
                    delete ui._selectCandidateSource;
                } else {
                    ui.showFillEnvelope(sourceID);
                }
            });
        });

        ui.core.addEventListener('clickMarker', function(evt) {
            var data = evt.detail;

            if (data.directgo) {
                var blank = false;
                var href = '';
                if (typeof data.directgo == 'string') {
                    href = data.directgo;
                } else {
                    href = data.directgo.href;
                    blank = data.directgo.blank || false;
                }
                if (blank) {
                    window.open(href, '_blank');
                } else {
                    window.location.href = href;
                }
                return;
            }

            ui.core.mapDivDocument.querySelector('.modal_title').innerText = ui.core.translate(data.name);
            if (data.url || data.html) {
                ui.core.mapDivDocument.querySelector('.poi_web').classList.remove('hide');
                ui.core.mapDivDocument.querySelector('.poi_data').classList.add('hide');
                if (data.html) {
                    ui.core.mapDivDocument.querySelector('.poi_iframe').setAttribute('srcdoc', ui.core.translate(data.html));
                } else {
                    ui.core.mapDivDocument.querySelector('.poi_iframe').setAttribute('src', ui.core.translate(data.url));
                }
            } else {
                ui.core.mapDivDocument.querySelector('.poi_data').classList.remove('hide');
                ui.core.mapDivDocument.querySelector('.poi_web').classList.add('hide');

                var img = ui.core.mapDivDocument.querySelector('.poi_img_tag');
                if (data.image && data.image != '') {
                    img.setAttribute('src', ui.resolveRelativeLink(data.image, 'img'));
                } else {
                    img.setAttribute('src', 'parts/no_image.png');
                }
                ui.core.mapDivDocument.querySelector('.poi_address').innerText = ui.core.translate(data.address);
                ui.core.mapDivDocument.querySelector('.poi_desc').innerHTML = ui.core.translate(data.desc).replace(/\n/g, '<br>');
            }
            var modalElm = ui.core.mapDivDocument.querySelector('.modalBase');
            var modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
            ui.core.selectMarker(data.namespace_id);
            var hideFunc = function(event) {
                modalElm.removeEventListener('hide.bs.modal', hideFunc, false);
                ui.core.unselectMarker();
            };
            var hiddenFunc = function(event) {
                modalElm.removeEventListener('hidden.bs.modal', hiddenFunc, false);
                var img = ui.core.mapDivDocument.querySelector('.poi_img_tag');
                img.setAttribute('src', 'parts/loading_image.png');
            };
            modalElm.addEventListener('hide.bs.modal', hideFunc, false);
            modalElm.addEventListener('hidden.bs.modal', hiddenFunc, false);
            modalSetting('poi');
            modal.show();
        });

        if (appOption.state_url) {
            ui.core.addEventListener('updateState', function(evt) {
                var value = evt.detail;
                if (!value.position || !value.sourceID) return;
                var link = 's:' + value.sourceID;
                if (value.backgroundID) link = link + '/b:' + value.backgroundID;
                if (value.transparency) link = link + '/t:' + value.transparency;
                link = link + '/x:' + value.position.x + '/y:' + value.position.y;
                link = link + '/z:' + value.position.zoom;
                if (value.position.rotation) link = link + '/r:' + value.position.rotation;
                if (value.showBorder) link = link + '/sb:' + value.showBorder;
                if (value.hideMarker) link = link + '/hm:' + value.hideMarker;
                if (value.hideLayer) link = link + '/hl:' + value.hideLayer;

                ui.pathThatSet = link;
                page(link);
            });
        }

        ui.waitReady = ui.core.waitReady.then(function() {
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
                        var modalElm = ui.core.mapDivDocument.querySelector('.modalBase');
                        var modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
                        ui.core.mapDivDocument.querySelector('.modal_title').innerText = ui.core.t('app.out_of_map');
                        ui.core.mapDivDocument.querySelector('.modal_gpsD_content').innerText = ui.core.t('app.out_of_map_desc');
                        modalSetting('gpsD');
                        modal.show();
                    }
                } else {
                    ui.core.currentPosition = result;
                }
                if (shown) {
                    shown = false;
                    var modalElm = ui.core.mapDivDocument.querySelector('.modalBase');
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
                var modalElm = ui.core.mapDivDocument.querySelector('.modalBase');
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

            var qr_app;
            var qr_view;
            ui.core.mapObject.on('click_control', function(evt) {
                var control = evt.frameState.control;
                var modalElm = ui.core.mapDivDocument.querySelector('.modalBase');
                var modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
                if (control == 'copyright') {
                    var from = ui.core.getMapMeta();

                    if (!ol.source.META_KEYS.reduce(function(prev, curr) {
                        if (curr == 'title') return prev;
                        return from[curr] || prev;
                    }, false)) return;

                    ui.core.mapDivDocument.querySelector('.modal_title').innerText = ui.core.translate(from.officialTitle || from.title);
                    ol.source.META_KEYS.map(function(key) {
                        if (key == 'title' || key == 'officialTitle') return;
                        if (!from[key] || from[key] == '') {
                            ui.core.mapDivDocument.querySelector('.' + key + '_div').classList.add('hide');
                        } else {
                            ui.core.mapDivDocument.querySelector('.' + key + '_div').classList.remove('hide');
                            ui.core.mapDivDocument.querySelector('.' + key + '_dd').innerHTML =
                                (key == 'license' || key == 'dataLicense') ?
                                    '<img src="parts/' + from[key].toLowerCase().replace(/ /g, '_') + '.png">' :
                                    ui.core.translate(from[key]);
                        }
                    });

                    var putTileCacheSize = function(size) {
                        var unit = 'Bytes';
                        if (size > 1024) {
                            size = Math.round(size * 10 / 1024) / 10;
                            unit = 'KBytes';
                        }
                        if (size > 1024) {
                            size = Math.round(size * 10 / 1024) / 10;
                            unit = 'MBytes';
                        }
                        if (size > 1024) {
                            size = Math.round(size * 10 / 1024) / 10;
                            unit = 'GBytes';
                        }
                        ui.core.mapDivDocument.querySelector('.cache_size').innerHTML = size + ' ' + unit;
                    };

                    modalSetting('map');
                    var deleteButton = document.querySelector('.cache_delete');
                    var deleteFunc = function(evt) {
                        evt.preventDefault();
                        var from = ui.core.getMapMeta();
                        ui.core.clearMapTileCacheAsync(from.sourceID, true).then(function() {
                            ui.core.getMapTileCacheSizeAsync(from.sourceID).then(putTileCacheSize);
                        });
                    };
                    var hideFunc = function(event) {
                        deleteButton.removeEventListener('click', deleteFunc, false);
                        modalElm.removeEventListener('hide.bs.modal', hideFunc, false);
                    };
                    modalElm.addEventListener('hide.bs.modal', hideFunc, false);

                    ui.core.getMapTileCacheSizeAsync(from.sourceID).then(putTileCacheSize);

                    modal.show();
                    setTimeout(function() {
                        deleteButton.addEventListener('click', deleteFunc, false);
                    }, 100);
                } else if (control == 'help') {
                    modalSetting('help');
                    modal.show();
                } else if (control == 'share') {
                    modalSetting('share');

                    var base = location.href;
                    var div1 = base.split('#!');
                    var path = div1.length > 1 ? (div1[1].split('?'))[0] : '';
                    var div2 = div1[0].split('?');
                    var uri = div2[0];
                    var query = div2.length > 1 ? div2[1].split('&').filter(function(qs) {
                        return (qs == 'pwa') ? false : true;
                    }).join('&') : '';

                    if (query) uri = uri + '?' + query;
                    var view = uri;
                    if (path) view = view + '#!' + path;
                    if (!qr_app) {
                        qr_app = new QRCode(ui.core.mapDivDocument.querySelector('.qr_app'), {
                            text: uri,
                            width: 128,
                            height: 128,
                            colorDark: '#000000',
                            colorLight: '#ffffff',
                            correctLevel: QRCode.CorrectLevel.H
                        });
                    } else {
                        qr_app.makeCode(uri);
                    }
                    if (!qr_view) {
                        qr_view = new QRCode(ui.core.mapDivDocument.querySelector('.qr_view'), {
                            text: view,
                            width: 128,
                            height: 128,
                            colorDark: '#000000',
                            colorLight: '#ffffff',
                            correctLevel: QRCode.CorrectLevel.H
                        });
                    } else {
                        qr_view.makeCode(view);
                    }

                    modal.show();
                } else if (control == 'border') {
                    var flag = !ui.core.stateBuffer.showBorder;
                    ui.setShowBorder(flag);
                } else if (control == 'hideMarker') {
                    var flag = !ui.core.stateBuffer.hideMarker;
                    ui.setHideMarker(flag);
                } else if (control == 'hideLayer') {
                    modalSetting('hide_marker');
                    var layers = ui.core.listPoiLayers(false, true);
                    var elem = ui.core.mapDivDocument.querySelector('ul.list-group');
                    var modalElm = ui.core.mapDivDocument.querySelector('.modalBase');
                    elem.innerHTML = '';
                    layers.map(function(layer, index) {
                        var icon = layer.icon || 'parts/defaultpin.png';
                        var title = ui.core.translate(layer.name);
                        var check = !layer.hide;
                        var id = layer.namespace_id;
                        var newElems = Core.createElement('<li class="list-group-item">' +
                            '<div class="row">' +
                            '<div class="col-sm-1"><img class="markerlist" src="' + icon + '"></div>' +
                            '<div class="col-sm-9">' + title + '</div>' +
                            '<div class="col-sm-2">' +
                            '<input type="checkbox" class="markerlist" data="' + id +
                            '" id="___maplat_marker_' + index + '_' + ui.html_id_seed + '"' + (check ? ' checked' : '') + '/>' +
                            '<label class="check" for="___maplat_marker_' + index + '_' + ui.html_id_seed + '"><div></div></label>' +
                            '</div>' +
                            '</div>' +
                            '</li>');
                        for (var i = 0; i < newElems.length; i++) {
                            elem.appendChild(newElems[i]);
                        }
                        var checkbox = ui.core.mapDivDocument.querySelector('#___maplat_marker_' + index + '_' + ui.html_id_seed);
                        var checkFunc = function(event) {
                            var id = event.target.getAttribute('data');
                            var checked = event.target.checked;
                            if (checked) ui.core.showPoiLayer(id);
                            else ui.core.hidePoiLayer(id);
                        };
                        var hideFunc = function(event) {
                            modalElm.removeEventListener('hide.bs.modal', hideFunc, false);
                            checkbox.removeEventListener('change', checkFunc, false);
                        };
                        modalElm.addEventListener('hide.bs.modal', hideFunc, false);
                        checkbox.addEventListener('change', checkFunc, false);
                    });
                    modal.show();
                }
            });
            if (fakeGps) {
                var newElem = Core.createElement(sprintf(ui.core.t('app.fake_explanation'), ui.core.translate(fakeCenter), fakeRadius))[0];
                var elem = ui.core.mapDivDocument.querySelector('.modal_gpsW_content');
                elem.appendChild(newElem);
            } else {
                var newElem = Core.createElement(ui.core.t('app.acquiring_gps_desc'))[0];
                var elem = ui.core.mapDivDocument.querySelector('.modal_gpsW_content');
                elem.appendChild(newElem);
            }
            if (ui.waitReadyBridge) {
                ui.waitReadyBridge();
                delete ui.waitReadyBridge;
            }
        });
    };

    MaplatUi.prototype.showFillEnvelope = function(sourceID) {
        var ui = this;
        if (sourceID && sourceID !== ui.core.from.sourceID) {
            if (ui.selectCandidate != sourceID) {
                if (ui._selectCandidateSource) {
                    ui.core.mapObject.removeEnvelope(ui._selectCandidateSource);
                }
                var source = ui.core.cacheHash[sourceID];
                var xyPromises = source.envelope.geometry.coordinates[0].map(function(coord) {
                    return ui.core.from.merc2XyAsync(coord);
                });
                var hexColor = source.envelopeColor;
                var color = ol.color.asArray(hexColor);
                color = color.slice();
                color[3] = 0.2;
                Promise.all(xyPromises).then(function(xys) {
                    ui._selectCandidateSource = ui.core.mapObject.setFillEnvelope(xys, null, {color: color});
                });
                ui.overlaySwiper.slideToMapID(sourceID);
            }
            ui.selectCandidate = sourceID;
        } else {
            if (ui._selectCandidateSource) {
                ui.core.mapObject.removeEnvelope(ui._selectCandidateSource);
                delete ui._selectCandidateSource;
            }
            delete ui.selectCandidate;
        }
    };

    MaplatUi.prototype.xyToSourceID = function(xy, callback) {
        var ui = this;
        var point = turf.point(xy);
        Promise.all(Object.keys(ui.core.cacheHash).filter(function(key) {
            return ui.core.cacheHash[key].envelope;
        }).map(function(key) {
            var source = ui.core.cacheHash[key];
            return Promise.all([
                Promise.resolve(source),
                Promise.all(source.envelope.geometry.coordinates[0].map(function(coord) {
                    return ui.core.from.merc2XyAsync(coord);
                }))
            ]);
        })).then(function(sources) {
            var areaIndex;
            var sourceID = sources.reduce(function(prev, curr) {
                var source = curr[0];
                var mercXys = curr[1];
                if (source.sourceID == ui.core.from.sourceID) return prev;
                var polygon = turf.polygon([mercXys]);
                if (turf.booleanPointInPolygon(point, polygon)) {
                    if (!areaIndex || source.envelopeAreaIndex < areaIndex) {
                        areaIndex = source.envelopeAreaIndex;
                        return source.sourceID;
                    } else {
                        return prev;
                    }
                } else {
                    return prev;
                }
            }, null);
            callback(sourceID);
        });
    };

    MaplatUi.prototype.setShowBorder = function(flag) {
        this.core.requestUpdateState({showBorder: flag ? 1 : 0});
        this.updateEnvelope();
        if (flag) {
            this.core.mapDivDocument.classList.add('show-border');
        } else {
            this.core.mapDivDocument.classList.remove('show-border');
        }
        if (this.core.restoreSession) {
            var currentTime = Math.floor(new Date().getTime() / 1000);
            localStorage.setItem('epoch', currentTime);
            localStorage.setItem('showBorder', flag ? 1 : 0);
        }
    };

    MaplatUi.prototype.setHideMarker = function(flag) {
        if (flag) {
            this.core.hideAllMarkers();
            this.core.mapDivDocument.classList.add('hide-marker');
        } else {
            this.core.showAllMarkers();
            this.core.mapDivDocument.classList.remove('hide-marker');
        }
    };

    MaplatUi.prototype.updateEnvelope = function() {
        var ui = this;
        if (!ui.core.mapObject) return;

        ui.core.mapObject.resetEnvelope();
        delete ui.selectCandidate;
        delete ui._selectCandidateSource;

        if (ui.core.stateBuffer.showBorder) {
            Object.keys(ui.core.cacheHash).filter(function(key) {
                return ui.core.cacheHash[key].envelope;
            }).map(function(key) {
                var source = ui.core.cacheHash[key];
                var xyPromises = (key == ui.core.from.sourceID) && (source instanceof ol.source.HistMap) ?
                    [[0, 0], [source.width, 0], [source.width, source.height], [0, source.height], [0, 0]].map(function(xy) {
                        return Promise.resolve(source.xy2HistMapCoords(xy));
                    }) :
                    source.envelope.geometry.coordinates[0].map(function(coord) {
                        return ui.core.from.merc2XyAsync(coord);
                    });

                Promise.all(xyPromises).then(function(xys) {
                    ui.core.mapObject.setEnvelope(xys, {
                        color: source.envelopeColor,
                        width: 2,
                        lineDash: [6, 6]
                    });
                });
            });
        }
    };

    MaplatUi.prototype.resolveRelativeLink = function(file, fallbackPath) {
        if (!fallbackPath) fallbackPath = '.';
        return file.match(/\//) ? file : fallbackPath + '/' + file;
    };

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

    return MaplatUi;
});
