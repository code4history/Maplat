import { absoluteUrl } from './absolute_url';
import { Swiper } from './swiper_ex';
import EventTarget from 'ol/events/Target';
import page from '../legacy/page';
import bsn from '../legacy/bootstrap-native';
import { MaplatApp as Core, createElement } from '@maplat/core';
import iziToast from '../legacy/iziToast';
import QRCode from '../legacy/qrcode';
import { point, polygon } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import sprintf from '../legacy/sprintf';
import { META_KEYS, NowMap, TmsMap } from '@maplat/core/src/source_ex';
import { Copyright, CompassRotate, SetGPS, GoHome, Maplat, Border, HideMarker, SliderCommon, Share } from './maplat_control';
import { Zoom } from 'ol/control';
import { asArray } from 'ol/color';
import { HistMap } from '@maplat/core/src/histmap';

// Maplat UI Class
export class MaplatUi extends EventTarget {
    constructor(appOption) {
        super();

        const ui = this;
        ui.html_id_seed = `${Math.floor( Math.random() * 9000 ) + 1000}`;

        if (appOption.state_url) {
            page((ctx, next) => { // eslint-disable-line no-unused-vars
                let pathes = ctx.canonicalPath.split('#!');
                let path = pathes.length > 1 ? pathes[1] : pathes[0];
                pathes = path.split('?');
                path = pathes[0];
                if (path == ui.pathThatSet) {
                    delete ui.pathThatSet;
                    return;
                }
                const restore = {
                    transparency: 0,
                    position: {
                        rotation: 0
                    }
                };
                path.split('/').map((state) => {
                    const line = state.split(':');
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
                                const modalElm = ui.core.mapDivDocument.querySelector('.modalBase');
                                const modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
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
                    ui.core.waitReady.then(() => {
                        ui.core.changeMap(restore.sourceID, restore);
                    });
                }
            });
            page({
                hashbang: true
            });
            page();
            ui.waitReady = new Promise(((resolve, reject) => { // eslint-disable-line no-unused-vars
                ui.waitReadyBridge = resolve;
            }));
        } else {
            ui.initializer(appOption);
        }
    }

    initializer(appOption) {
        const ui = this;
        appOption.translate_ui = true;
        ui.core = new Core(appOption);

        if (appOption.restore) {
            ui.setShowBorder(appOption.restore.showBorder || false);
            if (appOption.restore.hideMarker) {
                ui.core.mapDivDocument.classList.add('hide-marker');
            }
        } else if (appOption.restore_session) {
            const lastEpoch = parseInt(localStorage.getItem('epoch') || 0); // eslint-disable-line no-undef
            const currentTime = Math.floor(new Date().getTime() / 1000);
            if (lastEpoch && currentTime - lastEpoch < 3600) {
                ui.setShowBorder(parseInt(localStorage.getItem('showBorder') || '0') ? true : false); // eslint-disable-line no-undef
            }
            if (ui.core.initialRestore.hideMarker) {
                ui.core.mapDivDocument.classList.add('hide-marker');
            }
        } else {
            ui.setShowBorder(false);
        }

        const enableSplash = ui.core.initialRestore.sourceID ? false : true;
        const restoreTransparency = ui.core.initialRestore.transparency;
        const enableOutOfMap = appOption.presentation_mode ? false : true;

        // Modal記述の動作を調整する関数
        const modalSetting = function(target) {
            const modalElm = ui.core.mapDivDocument.querySelector('.modalBase');
            ['poi', 'map', 'load', 'gpsW', 'gpsD', 'help', 'share', 'hide_marker'].map((target_) => {
                const className = `modal_${target_}`;
                if (target == target_) {
                    modalElm.classList.add(className);
                } else {
                    modalElm.classList.remove(className);
                }
            });
        };

        if (appOption.enable_share) {
            ui.core.mapDivDocument.classList.add('enable_share');
            ui.enableShare = true;
        }
        if (appOption.state_url) {
            ui.core.mapDivDocument.classList.add('state_url');
        }
        if (ui.core.enableCache) {
            ui.core.mapDivDocument.classList.add('enable_cache');
        }
        if ('ontouchstart' in window) { // eslint-disable-line no-undef
            ui.core.mapDivDocument.classList.add('ol-touch');
        }
        if (appOption.mobile_if) {
            appOption.debug = true;
        }

        let pwaManifest = appOption.pwa_manifest;
        let pwaWorker = appOption.pwa_worker;

        // Add UI HTML Element
        let newElems = createElement('<div class="ol-control map-title"><span></span></div>' +
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
        for (let i=newElems.length - 1; i >= 0; i--) {
            ui.core.mapDivDocument.insertBefore(newElems[i], ui.core.mapDivDocument.firstChild);
        }
        const prevDefs = ui.core.mapDivDocument.querySelectorAll('.prevent-default-ui');
        for (let i=0; i<prevDefs.length; i++) {
            const target = prevDefs[i];
            target.addEventListener('touchstart', (evt) => {
                evt.preventDefault();
            });
        }

        newElems = createElement(`${'<div class="modal modalBase" tabindex="-1" role="dialog" ' +
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
            '<h4 data-i18n="html.share_app_title"></h4><div id="___maplat_app_toast_'}${ui.html_id_seed}"></div>` +
            `<div class="recipient row">` +
            `<div class="form-group col-xs-4 text-center"><button title="Copy to clipboard" class="share btn btn-light" data="cp_app"><i class="fa fa-clipboard"></i>&nbsp;<small data-i18n="html.share_copy"></small></button></div>` +
            `<div class="form-group col-xs-4 text-center"><button title="Twitter" class="share btn btn-light" data="tw_app"><i class="fa fa-twitter"></i>&nbsp;<small>Twitter</small></button></div>` +
            `<div class="form-group col-xs-4 text-center"><button title="Facebook" class="share btn btn-light" data="fb_app"><i class="fa fa-facebook"></i>&nbsp;<small>Facebook</small></button></div></div>` +
            `<div class="qr_app center-block" style="width:128px;"></div>` +
            `<div class="modal_share_state">` +
            `<h4 data-i18n="html.share_state_title"></h4><div id="___maplat_view_toast_${ui.html_id_seed}"></div>` +
            `<div class="recipient row">` +
            `<div class="form-group col-xs-4 text-center"><button title="Copy to clipboard" class="share btn btn-light" data="cp_view"><i class="fa fa-clipboard"></i>&nbsp;<small data-i18n="html.share_copy"></small></button></div>` +
            `<div class="form-group col-xs-4 text-center"><button title="Twitter" class="share btn btn-light" data="tw_view"><i class="fa fa-twitter"></i>&nbsp;<small>Twitter</small></button></div>` +
            `<div class="form-group col-xs-4 text-center"><button title="Facebook" class="share btn btn-light" data="fb_view"><i class="fa fa-facebook"></i>&nbsp;<small>Facebook</small></button></div></div>` +
            `<div class="qr_view center-block" style="width:128px;"></div>` +
            `</div>` +
            `<p><img src="" height="0px" width="0px"></p>` +
            `</div>` +

            `<div class="modal_map_content">${ 

            META_KEYS.map((key) => {
                if (key == 'title' || key == 'officialTitle') return '';

                return `<div class="recipients ${key}_div"><dl class="dl-horizontal">` +
                    `<dt data-i18n="html.${key}"></dt>` +
                    `<dd class="${key}_dd"></dd>` +
                    `</dl></div>`;
            }).join('') 

            }<div class="recipients" class="modal_cache_content"><dl class="dl-horizontal">` +
            `<dt data-i18n="html.cache_handle"></dt>` +
            `<dd><span class="cache_size"></span>` +
            `<a class="cache_delete btn btn-default pull-right" href="#" data-i18n="html.cache_delete"></a></dd>` +
            `</dl></div>` +

            `</div>` +

            `<div class="modal_load_content">` +
            `<p class="recipient"><img src="parts/loading.png"><span data-i18n="html.app_loading_body"></span></p>` +
            `<div class="splash_div hide row"><p class="col-xs-12 poi_img"><img class="splash_img" src=""></p></div>` +
            `<p><img src="" height="0px" width="0px"></p>` +
            `</div>` +

            `<div class="modal_hide_marker_content">` +
            `<ul class="list-group">` +
            `</ul>` +
            `</div>` +

            `<p class="modal_gpsD_content" class="recipient"></p>` +
            `<p class="modal_gpsW_content" class="recipient"></p>` +

            `</div>` +
            `</div>` +
            `</div>` +
            `</div>`);
        for (let i=newElems.length - 1; i >= 0; i--) {
            ui.core.mapDivDocument.insertBefore(newElems[i], ui.core.mapDivDocument.firstChild);
        }

        const shareBtns = ui.core.mapDivDocument.querySelectorAll('.btn.share');
        for (let i=0; i<shareBtns.length; i++) {
            const shareBtn = shareBtns[i];
            shareBtn.addEventListener('click', (evt) => {
                let btn = evt.target;
                if (!btn.classList.contains('share')) btn = btn.parentElement;
                const cmd = btn.getAttribute('data');
                const cmds = cmd.split('_');
                const base = evt.target.baseURI;
                const div1 = base.split('#!');
                const path = div1.length > 1 ? (div1[1].split('?'))[0] : '';
                const div2 = div1[0].split('?');
                let uri = div2[0];
                const query = div2.length > 1 ? div2[1].split('&').filter((qs) => (qs == 'pwa') ? false : true).join('&') : '';

                if (query) uri = `${uri}?${query}`;
                if (cmds[1] == 'view') {
                    if (path) uri = `${uri}#!${path}`;
                }
                if (cmds[0] == 'cp') {
                    const copyFrom = document.createElement('textarea'); // eslint-disable-line no-undef
                    copyFrom.textContent = uri;

                    const bodyElm = document.querySelector('body'); // eslint-disable-line no-undef
                    bodyElm.appendChild(copyFrom);

                    if (/iP(hone|(o|a)d)/.test(navigator.userAgent)) { // eslint-disable-line no-undef
                        const range = document.createRange(); // eslint-disable-line no-undef
                        range.selectNode(copyFrom);
                        window.getSelection().addRange(range); // eslint-disable-line no-undef
                    } else {
                        copyFrom.select();
                    }

                    document.execCommand('copy'); // eslint-disable-line no-undef
                    bodyElm.removeChild(copyFrom);
                    const toastParent = `#___maplat_${cmds[1]}_toast_${ui.html_id_seed}`;
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
                    const twuri = `https://twitter.com/share?url=${encodeURIComponent(uri)}&hashtags=Maplat`;
                    window.open(twuri, '_blank', 'width=650,height=450,menubar=no,toolbar=no,scrollbars=yes'); // eslint-disable-line no-undef
                } else if (cmds[0] == 'fb') {
                    // https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fdevelopers.facebook.com%2Fdocs%2Fplugins%2Fshare-button%2F&display=popup&ref=plugin&src=like&kid_directed_site=0&app_id=113869198637480
                    const fburi = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(uri) 
                        }&display=popup&ref=plugin&src=like&kid_directed_site=0`;
                    window.open(fburi, '_blank', 'width=650,height=450,menubar=no,toolbar=no,scrollbars=yes'); // eslint-disable-line no-undef
                }
            });
        }

        // PWA対応: 非同期処理
        if (pwaManifest) {
            if (pwaManifest === true) {
                pwaManifest = `./pwa/${ui.core.appid}_manifest.json`;
            }
            if (!pwaWorker) {
                pwaWorker = './service-worker.js';
            }

            const head = document.querySelector('head'); // eslint-disable-line no-undef
            if (!head.querySelector('link[rel="manifest"]')) {
                head.appendChild((createElement(`<link rel="manifest" href="${pwaManifest}">`))[0]);
            }
            // service workerが有効なら、service-worker.js を登録します
            if ('serviceWorker' in navigator) { // eslint-disable-line no-undef
                navigator.serviceWorker.register(pwaWorker).then((reg) => { // eslint-disable-line no-undef
                    console.log('Service Worker Registered'); // eslint-disable-line no-undef
                    reg.onupdatefound = function() {
                        console.log('Found Service Worker update'); // eslint-disable-line no-undef
                        reg.update().catch((e) => {
                            throw e;
                        });
                    };
                }).catch((err) => {
                    console.log(err); // eslint-disable-line no-undef
                });
            }

            if (!head.querySelector('link[rel="apple-touch-icon"]')) {
                const xhr = new XMLHttpRequest(); // eslint-disable-line no-undef
                xhr.open('GET', pwaManifest, true);
                xhr.responseType = 'json';

                xhr.onload = function(e) { // eslint-disable-line no-unused-vars
                    let value = this.response;
                    if (!value) return;
                    if (typeof value != 'object') value = JSON.parse(value);

                    if (value.icons) {
                        for (let i = 0; i < value.icons.length; i++) {
                            const src = absoluteUrl(pwaManifest, value.icons[i].src);
                            const sizes = value.icons[i].sizes;
                            const tag = `<link rel="apple-touch-icon" sizes="${sizes}" href="${src}">`;
                            head.appendChild((createElement(tag))[0]);
                        }
                    }
                };
                xhr.send();
            }
        }

        ui.core.addEventListener('uiPrepare', (evt) => { // eslint-disable-line no-unused-vars
            let i18nTargets = ui.core.mapDivDocument.querySelectorAll('[data-i18n]');
            for (let i=0; i<i18nTargets.length; i++) {
                const target = i18nTargets[i];
                const key = target.getAttribute('data-i18n');
                target.innerText = ui.core.t(key);
            }
            i18nTargets = ui.core.mapDivDocument.querySelectorAll('[data-i18n-html]');
            for (let i=0; i<i18nTargets.length; i++) {
                const target = i18nTargets[i];
                const key = target.getAttribute('data-i18n-html');
                target.innerHTML = ui.core.t(key);
            }

            const options = {reverse: true, tipLabel: ui.core.t('control.trans', {ns: 'translation'})};
            if (restoreTransparency) {
                options.initialValue = restoreTransparency / 100;
            }
            ui.sliderCommon = new SliderCommon(options);
            ui.core.appData.controls = [
                new Copyright({tipLabel: ui.core.t('control.info', {ns: 'translation'})}),
                new CompassRotate({tipLabel: ui.core.t('control.compass', {ns: 'translation'})}),
                new Zoom({tipLabel: ui.core.t('control.zoom', {ns: 'translation'})}),
                new SetGPS({tipLabel: ui.core.t('control.gps', {ns: 'translation'})}),
                new GoHome({tipLabel: ui.core.t('control.home', {ns: 'translation'})}),
                ui.sliderCommon,
                new Maplat({tipLabel: ui.core.t('control.help', {ns: 'translation'})}),
                new Border({tipLabel: ui.core.t('control.border', {ns: 'translation'})}),
                new HideMarker({tipLabel: ui.core.t('control.hide_marker', {ns: 'translation'})})
            ];
            if (ui.enableShare) {
                ui.core.appData.controls.push(new Share({tipLabel: ui.core.t('control.share', {ns: 'translation'})}));
            }
            if (ui.core.mapObject) {
                ui.core.appData.controls.map((control) => {
                    ui.core.mapObject.addControl(control);
                });
            }

            ui.sliderCommon.on('propertychange', (evt) => {
                if (evt.key === 'slidervalue') {
                    ui.core.setTransparency(ui.sliderCommon.get(evt.key) * 100);
                }
            });

            if (enableSplash) {
                // Check Splash data
                let splash = false;
                if (ui.core.appData.splash) splash = true;

                const modalElm = ui.core.mapDivDocument.querySelector('.modalBase');
                const modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
                ui.core.mapDivDocument.querySelector('.modal_load_title').innerText = ui.core.translate(ui.core.appData.app_name);
                if (splash) {
                    ui.core.mapDivDocument.querySelector('.splash_img').setAttribute('src', `img/${ui.core.appData.splash}`);
                    ui.core.mapDivDocument.querySelector('.splash_div').classList.remove('hide');
                }
                modalSetting('load');
                modal.show();

                const fadeTime = splash ? 1000 : 200;
                ui.splashPromise = new Promise(((resolve) => {
                    setTimeout(() => { // eslint-disable-line no-undef
                        resolve();
                    }, fadeTime);
                }));
            }

            document.querySelector('title').innerHTML = ui.core.translate(ui.core.appName); // eslint-disable-line no-undef
        });

        ui.core.addEventListener('sourceLoaded', (evt) => {
            const sources = evt.detail;

            const colors = ['maroon', 'deeppink', 'indigo', 'olive', 'royalblue',
                'red', 'hotpink', 'green', 'yellow', 'navy',
                'saddlebrown', 'fuchsia', 'darkslategray', 'yellowgreen', 'blue',
                'mediumvioletred', 'purple', 'lime', 'darkorange', 'teal',
                'crimson', 'darkviolet', 'darkolivegreen', 'steelblue', 'aqua'];
            let cIndex = 0;
            for (let i=0; i<sources.length; i++) {
                const source = sources[i];
                if (source.envelope) {
                    source.envelopeColor = colors[cIndex];
                    cIndex = cIndex + 1;
                    if (cIndex == colors.length) cIndex = 0;

                    const xys = source.envelope.geometry.coordinates[0];
                    source.envelopeAreaIndex = 0.5 * Math.abs([0, 1, 2, 3].reduce((prev, curr, i) => {
                        const xy1 = xys[i];
                        const xy2 = xys[i+1];
                        return prev + (xy1[0] - xy2[0]) * (xy1[1] + xy2[1]);
                    }, 0));
                }
            }

            if (ui.splashPromise) {
                ui.splashPromise.then(() => {
                    const modalElm = ui.core.mapDivDocument.querySelector('.modalBase');
                    const modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
                    modalSetting('load');
                    modal.hide();
                });
            }

            const baseSources= [];
            const overlaySources = [];
            for (let i=0; i<sources.length; i++) {
                const source = sources[i];
                if (source instanceof NowMap && !(source instanceof TmsMap)) {
                    baseSources.push(source);
                } else {
                    overlaySources.push(source);
                }
            }

            const baseSwiper = ui.baseSwiper = new Swiper('.base-swiper', {
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
            baseSwiper.on('click', (e) => {
                e.preventDefault();
                if (!baseSwiper.clickedSlide) return;
                const slide = baseSwiper.clickedSlide;
                ui.core.changeMap(slide.getAttribute('data'));
                delete ui.selectCandidate;
                delete ui._selectCandidateSource;
                baseSwiper.setSlideIndexAsSelected(slide.getAttribute('data-swiper-slide-index'));
            });
            if (baseSources.length < 2) {
                ui.core.mapDivDocument.querySelector('.base-swiper').classList.add('single-map');
            }
            const overlaySwiper = ui.overlaySwiper = new Swiper('.overlay-swiper', {
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
            overlaySwiper.on('click', (e) => {
                e.preventDefault();
                if (!overlaySwiper.clickedSlide) return;
                const slide = overlaySwiper.clickedSlide;
                ui.core.changeMap(slide.getAttribute('data'));
                delete ui.selectCandidate;
                delete ui._selectCandidateSource;
                overlaySwiper.setSlideIndexAsSelected(slide.getAttribute('data-swiper-slide-index'));
            });
            if (overlaySources.length < 2) {
                ui.core.mapDivDocument.querySelector('.overlay-swiper').classList.add('single-map');
            }

            for (let i=0; i<baseSources.length; i++) {
                const source = baseSources[i];
                const colorCss = source.envelope ? ` ${source.envelopeColor}` : ''; // eslint-disable-line no-unused-vars
                baseSwiper.appendSlide(`<div class="swiper-slide" data="${source.sourceID}">` +
                    `<img crossorigin="anonymous" src="${source.thumbnail}"><div>${ui.core.translate(source.label)}</div></div>`);
            }
            for (let i=0; i<overlaySources.length; i++) {
                const source = overlaySources[i];
                const colorCss = source.envelope ? ` ${source.envelopeColor}` : '';
                overlaySwiper.appendSlide(`<div class="swiper-slide${colorCss}" data="${source.sourceID}">` +
                    `<img crossorigin="anonymous" src="${source.thumbnail}"><div>${ui.core.translate(source.label)}</div></div>`);
            }

            baseSwiper.on;
            overlaySwiper.on;
            baseSwiper.slideToLoop(0);
            overlaySwiper.slideToLoop(0);
            ui.ellips();
        });

        ui.core.addEventListener('mapChanged', (evt) => {
            const map = evt.detail;

            ui.baseSwiper.setSlideMapID(map.sourceID);
            ui.overlaySwiper.setSlideMapID(map.sourceID);

            const title = map.officialTitle || map.title || map.label;
            ui.core.mapDivDocument.querySelector('.map-title span').innerText = ui.core.translate(title);

            if (ui.checkOverlayID(map.sourceID)) {
                ui.sliderCommon.setEnable(true);
            } else {
                ui.sliderCommon.setEnable(false);
            }
            const transparency = ui.sliderCommon.get('slidervalue') * 100;
            ui.core.mapObject.setTransparency(transparency);

            ui.updateEnvelope();
        });

        ui.core.addEventListener('poi_number', (evt) => {
            const number = evt.detail;
            if (number) {
                ui.core.mapDivDocument.classList.remove('no_poi');
            } else {
                ui.core.mapDivDocument.classList.add('no_poi');
            }
        });

        ui.core.addEventListener('outOfMap', (evt) => { // eslint-disable-line no-unused-vars
            if (enableOutOfMap) {
                ui.core.mapDivDocument.querySelector('.modal_title').innerText = ui.core.t('app.out_of_map');
                ui.core.mapDivDocument.querySelector('.modal_gpsD_content').innerText = ui.core.t('app.out_of_map_area');
                const modalElm = ui.core.mapDivDocument.querySelector('.modalBase');
                const modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
                modalSetting('gpsD');
                modal.show();
            }
        });

        ui.core.mapDivDocument.addEventListener('mouseout', (evt) => { // eslint-disable-line no-unused-vars
            delete ui.selectCandidate;
            if (ui._selectCandidateSource) {
                ui.core.mapObject.removeEnvelope(ui._selectCandidateSource);
                delete ui._selectCandidateSource;
            }
        });

        ui.core.addEventListener('pointerMoveOnMapXy', (evt) => {
            if (!ui.core.stateBuffer.showBorder) {
                delete ui.selectCandidate;
                if (ui._selectCandidateSource) {
                    ui.core.mapObject.removeEnvelope(ui._selectCandidateSource);
                    delete ui._selectCandidateSource;
                }
                return;
            }

            ui.xyToSourceID(evt.detail, (sourceID) => {
                ui.showFillEnvelope(sourceID);
            });
        });

        ui.core.addEventListener('clickMapXy', (evt) => {
            if (!ui.core.stateBuffer.showBorder) {
                return;
            }

            ui.xyToSourceID(evt.detail, (sourceID) => {
                if (ui.selectCandidate && ui.selectCandidate == sourceID) {
                    ui.core.changeMap(ui.selectCandidate);
                    delete ui.selectCandidate;
                    delete ui._selectCandidateSource;
                } else {
                    ui.showFillEnvelope(sourceID);
                }
            });
        });

        ui.core.addEventListener('clickMarker', (evt) => {
            const data = evt.detail;

            if (data.directgo) {
                let blank = false;
                let href = '';
                if (typeof data.directgo == 'string') {
                    href = data.directgo;
                } else {
                    href = data.directgo.href;
                    blank = data.directgo.blank || false;
                }
                if (blank) {
                    window.open(href, '_blank'); // eslint-disable-line no-undef
                } else {
                    window.location.href = href; // eslint-disable-line no-undef
                }
                return;
            }

            ui.core.mapDivDocument.querySelector('.modal_title').innerText = ui.core.translate(data.name);
            if (data.url || data.html) {
                ui.core.mapDivDocument.querySelector('.poi_web').classList.remove('hide');
                ui.core.mapDivDocument.querySelector('.poi_data').classList.add('hide');
                const iframe = ui.core.mapDivDocument.querySelector('.poi_iframe');
                if (data.html) {
                    iframe.addEventListener('load', function loadEvent(event) {
                        event.currentTarget.removeEventListener(event.type, loadEvent);
                        const cssLink = createElement('<style type="text/css">html, body { height: 100vh; }\n img { width: 100vw; }</style>');
                        console.log(cssLink); // eslint-disable-line no-undef
                        iframe.contentDocument.head.appendChild(cssLink[0]);
                    });
                    iframe.removeAttribute('src');
                    iframe.setAttribute('srcdoc', ui.core.translate(data.html));
                } else {
                    iframe.removeAttribute('srcdoc');
                    iframe.setAttribute('src', ui.core.translate(data.url));
                }
            } else {
                ui.core.mapDivDocument.querySelector('.poi_data').classList.remove('hide');
                ui.core.mapDivDocument.querySelector('.poi_web').classList.add('hide');

                const img = ui.core.mapDivDocument.querySelector('.poi_img_tag');
                if (data.image && data.image != '') {
                    img.setAttribute('src', ui.resolveRelativeLink(data.image, 'img'));
                } else {
                    img.setAttribute('src', 'parts/no_image.png');
                }
                ui.core.mapDivDocument.querySelector('.poi_address').innerText = ui.core.translate(data.address);
                ui.core.mapDivDocument.querySelector('.poi_desc').innerHTML = ui.core.translate(data.desc).replace(/\n/g, '<br>');
            }
            const modalElm = ui.core.mapDivDocument.querySelector('.modalBase');
            const modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
            ui.core.selectMarker(data.namespace_id);
            const hideFunc = function(event) { // eslint-disable-line no-unused-vars
                modalElm.removeEventListener('hide.bs.modal', hideFunc, false);
                ui.core.unselectMarker();
            };
            const hiddenFunc = function(event) { // eslint-disable-line no-unused-vars
                modalElm.removeEventListener('hidden.bs.modal', hiddenFunc, false);
                const img = ui.core.mapDivDocument.querySelector('.poi_img_tag');
                img.setAttribute('src', 'parts/loading_image.png');
            };
            modalElm.addEventListener('hide.bs.modal', hideFunc, false);
            modalElm.addEventListener('hidden.bs.modal', hiddenFunc, false);
            modalSetting('poi');
            modal.show();
        });

        if (appOption.state_url) {
            ui.core.addEventListener('updateState', (evt) => {
                const value = evt.detail;
                if (!value.position || !value.sourceID) return;
                let link = `s:${value.sourceID}`;
                if (value.backgroundID) link = `${link}/b:${value.backgroundID}`;
                if (value.transparency) link = `${link}/t:${value.transparency}`;
                link = `${link}/x:${value.position.x}/y:${value.position.y}`;
                link = `${link}/z:${value.position.zoom}`;
                if (value.position.rotation) link = `${link}/r:${value.position.rotation}`;
                if (value.showBorder) link = `${link}/sb:${value.showBorder}`;
                if (value.hideMarker) link = `${link}/hm:${value.hideMarker}`;
                if (value.hideLayer) link = `${link}/hl:${value.hideLayer}`;

                ui.pathThatSet = link;
                page(link);
            });
        }

        ui.waitReady = ui.core.waitReady.then(() => {
            const fakeGps = appOption.fake ? ui.core.appData.fake_gps : false;
            const fakeCenter = appOption.fake ? ui.core.appData.fake_center : false;
            const fakeRadius = appOption.fake ? ui.core.appData.fake_radius : false;

            let shown = false;
            let gpsWaitPromise = null;
            function showGPSresult(result) {
                if (result && result.error) {
                    ui.core.currentPosition = null;
                    if (result.error == 'gps_out' && shown) {
                        shown = false;
                        const modalElm = ui.core.mapDivDocument.querySelector('.modalBase');
                        const modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
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
                    const modalElm = ui.core.mapDivDocument.querySelector('.modalBase');
                    const modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
                    modal.hide();
                }
            }
            ui.core.mapObject.on('gps_request', () => {
                gpsWaitPromise = 'gps_request';
                const promises = [
                    new Promise(((resolve) => {
                        if (gpsWaitPromise != 'gps_request') {
                            resolve(gpsWaitPromise);
                        } else gpsWaitPromise = resolve;
                    }))
                ];
                shown = true;
                const modalElm = ui.core.mapDivDocument.querySelector('.modalBase');
                const modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
                modalSetting('gpsW');
                modal.show();
                // 200m秒以上最低待たないと、Modalがうまく動かない場合がある
                promises.push(new Promise(((resolve) => {
                    setTimeout(resolve, 200); // eslint-disable-line no-undef
                })));
                Promise.all(promises).then((results) => {
                    showGPSresult(results[0]);
                });
            });
            ui.core.mapObject.on('gps_result', (evt) => {
                if (gpsWaitPromise == 'gps_request') {
                    gpsWaitPromise = evt.frameState;
                } else if (gpsWaitPromise) {
                    gpsWaitPromise(evt.frameState);
                    gpsWaitPromise = null;
                } else if (!shown) {
                    showGPSresult(evt.frameState);
                }
            });

            let qr_app;
            let qr_view;
            ui.core.mapObject.on('click_control', (evt) => {
                const control = evt.frameState.control;
                const modalElm = ui.core.mapDivDocument.querySelector('.modalBase');
                const modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
                if (control == 'copyright') {
                    const from = ui.core.getMapMeta();

                    if (!META_KEYS.reduce((prev, curr) => {
                        if (curr == 'title') return prev;
                        return from[curr] || prev;
                    }, false)) return;

                    ui.core.mapDivDocument.querySelector('.modal_title').innerText = ui.core.translate(from.officialTitle || from.title);
                    META_KEYS.map((key) => {
                        if (key == 'title' || key == 'officialTitle') return;
                        if (!from[key] || from[key] == '') {
                            ui.core.mapDivDocument.querySelector(`.${key}_div`).classList.add('hide');
                        } else {
                            ui.core.mapDivDocument.querySelector(`.${key}_div`).classList.remove('hide');
                            ui.core.mapDivDocument.querySelector(`.${key}_dd`).innerHTML =
                                (key == 'license' || key == 'dataLicense') ?
                                    `<img src="parts/${from[key].toLowerCase().replace(/ /g, '_')}.png">` :
                                    ui.core.translate(from[key]);
                        }
                    });

                    const putTileCacheSize = function(size) {
                        let unit = 'Bytes';
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
                        ui.core.mapDivDocument.querySelector('.cache_size').innerHTML = `${size} ${unit}`;
                    };

                    modalSetting('map');
                    const deleteButton = document.querySelector('.cache_delete'); // eslint-disable-line no-undef
                    const deleteFunc = function(evt) {
                        evt.preventDefault();
                        const from = ui.core.getMapMeta();
                        ui.core.clearMapTileCacheAsync(from.sourceID, true).then(() => {
                            ui.core.getMapTileCacheSizeAsync(from.sourceID).then(putTileCacheSize);
                        });
                    };
                    const hideFunc = function(event) { // eslint-disable-line no-unused-vars
                        deleteButton.removeEventListener('click', deleteFunc, false);
                        modalElm.removeEventListener('hide.bs.modal', hideFunc, false);
                    };
                    modalElm.addEventListener('hide.bs.modal', hideFunc, false);

                    ui.core.getMapTileCacheSizeAsync(from.sourceID).then(putTileCacheSize);

                    modal.show();
                    setTimeout(() => { // eslint-disable-line no-undef
                        deleteButton.addEventListener('click', deleteFunc, false);
                    }, 100);
                } else if (control == 'help') {
                    modalSetting('help');
                    modal.show();
                } else if (control == 'share') {
                    modalSetting('share');

                    const base = location.href; // eslint-disable-line no-undef
                    const div1 = base.split('#!');
                    const path = div1.length > 1 ? (div1[1].split('?'))[0] : '';
                    const div2 = div1[0].split('?');
                    let uri = div2[0];
                    const query = div2.length > 1 ? div2[1].split('&').filter((qs) => (qs == 'pwa') ? false : true).join('&') : '';

                    if (query) uri = `${uri}?${query}`;
                    let view = uri;
                    if (path) view = `${view}#!${path}`;
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
                    const flag = !ui.core.stateBuffer.showBorder;
                    ui.setShowBorder(flag);
                } else if (control == 'hideMarker') {
                    const flag = !ui.core.stateBuffer.hideMarker;
                    ui.setHideMarker(flag);
                } else if (control == 'hideLayer') {
                    modalSetting('hide_marker');
                    const layers = ui.core.listPoiLayers(false, true);
                    const elem = ui.core.mapDivDocument.querySelector('ul.list-group');
                    const modalElm = ui.core.mapDivDocument.querySelector('.modalBase');
                    elem.innerHTML = '';
                    layers.map((layer, index) => {
                        const icon = layer.icon || 'parts/defaultpin.png';
                        const title = ui.core.translate(layer.name);
                        const check = !layer.hide;
                        const id = layer.namespace_id;
                        const newElems = createElement(`${'<li class="list-group-item">' +
                            '<div class="row">' +
                            '<div class="col-sm-1"><img class="markerlist" src="'}${icon}"></div>` +
                            `<div class="col-sm-9">${title}</div>` +
                            `<div class="col-sm-2">` +
                            `<input type="checkbox" class="markerlist" data="${id 
                            }" id="___maplat_marker_${index}_${ui.html_id_seed}"${check ? ' checked' : ''}/>` +
                            `<label class="check" for="___maplat_marker_${index}_${ui.html_id_seed}"><div></div></label>` +
                            `</div>` +
                            `</div>` +
                            `</li>`);
                        for (let i = 0; i < newElems.length; i++) {
                            elem.appendChild(newElems[i]);
                        }
                        const checkbox = ui.core.mapDivDocument.querySelector(`#___maplat_marker_${index}_${ui.html_id_seed}`);
                        const checkFunc = function(event) {
                            const id = event.target.getAttribute('data');
                            const checked = event.target.checked;
                            if (checked) ui.core.showPoiLayer(id);
                            else ui.core.hidePoiLayer(id);
                        };
                        const hideFunc = function(event) { // eslint-disable-line no-unused-vars
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
                const newElem = createElement(sprintf(ui.core.t('app.fake_explanation'), ui.core.translate(fakeCenter), fakeRadius))[0];
                const elem = ui.core.mapDivDocument.querySelector('.modal_gpsW_content');
                elem.appendChild(newElem);
            } else {
                const newElem = createElement(ui.core.t('app.acquiring_gps_desc'))[0];
                const elem = ui.core.mapDivDocument.querySelector('.modal_gpsW_content');
                elem.appendChild(newElem);
            }
            if (ui.waitReadyBridge) {
                ui.waitReadyBridge();
                delete ui.waitReadyBridge;
            }
        });
    }

    showFillEnvelope(sourceID) {
        const ui = this;
        if (sourceID && sourceID !== ui.core.from.sourceID) {
            if (ui.selectCandidate != sourceID) {
                if (ui._selectCandidateSource) {
                    ui.core.mapObject.removeEnvelope(ui._selectCandidateSource);
                }
                const source = ui.core.cacheHash[sourceID];
                const xyPromises = source.envelope.geometry.coordinates[0].map((coord) => ui.core.from.merc2XyAsync(coord));
                const hexColor = source.envelopeColor;
                let color = asArray(hexColor);
                color = color.slice();
                color[3] = 0.2;
                Promise.all(xyPromises).then((xys) => {
                    ui._selectCandidateSource = ui.core.mapObject.setFillEnvelope(xys, null, {color});
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
    }

    xyToSourceID(xy, callback) {
        const ui = this;
        const point_ = point(xy);
        Promise.all(Object.keys(ui.core.cacheHash).filter((key) => ui.core.cacheHash[key].envelope).map((key) => {
            const source = ui.core.cacheHash[key];
            return Promise.all([
                Promise.resolve(source),
                Promise.all(source.envelope.geometry.coordinates[0].map((coord) => ui.core.from.merc2XyAsync(coord)))
            ]);
        })).then((sources) => {
            let areaIndex;
            const sourceID = sources.reduce((prev, curr) => {
                const source = curr[0];
                const mercXys = curr[1];
                if (source.sourceID == ui.core.from.sourceID) return prev;
                const polygon_ = polygon([mercXys]);
                if (booleanPointInPolygon(point_, polygon_)) {
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
    }

    setShowBorder(flag) {
        this.core.requestUpdateState({showBorder: flag ? 1 : 0});
        this.updateEnvelope();
        if (flag) {
            this.core.mapDivDocument.classList.add('show-border');
        } else {
            this.core.mapDivDocument.classList.remove('show-border');
        }
        if (this.core.restoreSession) {
            const currentTime = Math.floor(new Date().getTime() / 1000);
            localStorage.setItem('epoch', currentTime); // eslint-disable-line no-undef
            localStorage.setItem('showBorder', flag ? 1 : 0); // eslint-disable-line no-undef
        }
    }

    setHideMarker(flag) {
        if (flag) {
            this.core.hideAllMarkers();
            this.core.mapDivDocument.classList.add('hide-marker');
        } else {
            this.core.showAllMarkers();
            this.core.mapDivDocument.classList.remove('hide-marker');
        }
    }

    updateEnvelope() {
        const ui = this;
        if (!ui.core.mapObject) return;

        ui.core.mapObject.resetEnvelope();
        delete ui.selectCandidate;
        delete ui._selectCandidateSource;

        if (ui.core.stateBuffer.showBorder) {
            Object.keys(ui.core.cacheHash).filter((key) => ui.core.cacheHash[key].envelope).map((key) => {
                const source = ui.core.cacheHash[key];
                const xyPromises = (key == ui.core.from.sourceID) && (source instanceof HistMap) ?
                    [[0, 0], [source.width, 0], [source.width, source.height], [0, source.height], [0, 0]].map((xy) => Promise.resolve(source.xy2HistMapCoords(xy))) :
                    source.envelope.geometry.coordinates[0].map((coord) => ui.core.from.merc2XyAsync(coord));

                Promise.all(xyPromises).then((xys) => {
                    ui.core.mapObject.setEnvelope(xys, {
                        color: source.envelopeColor,
                        width: 2,
                        lineDash: [6, 6]
                    });
                });
            });
        }
    }

    resolveRelativeLink(file, fallbackPath) {
        if (!fallbackPath) fallbackPath = '.';
        return file.match(/\//) ? file : `${fallbackPath}/${file}`;
    }

    checkOverlayID(mapID) {
        const ui = this;
        const swiper = ui.overlaySwiper;
        const sliders = swiper.$el[0].querySelectorAll('.swiper-slide');
        for (let i=0; i<sliders.length; i++) {
            const slider = sliders[i];
            if (slider.getAttribute('data') == mapID) {
                return true;
            }
        }
        return false;
    }

    ellips() {
        const ui = this;
        const omitMark = '…';
        const omitLine = 2;
        const stringSplit = function(element) {
            const splitArr = element.innerText.split('');
            let joinString = '';
            for (let i = 0; i < splitArr.length; i++) {
                joinString += `<span>${splitArr[i]}</span>`;
            }
            joinString += `<span class="omit-mark">${omitMark}</span>`;
            element.innerHTML = joinString;
        };
        const omitCheck = function(element) {
            const thisSpan = element.querySelectorAll('span');
            const omitSpan = element.querySelector('.omit-mark');
            let lineCount = 0;
            let omitCount;

            if(omitLine <= 0) {
                return;
            }

            thisSpan[0].style.display = '';
            for (let i=1; i < thisSpan.length; i++) {
                thisSpan[i].style.display = 'none';
            }
            omitSpan.style.display = '';
            let divHeight = element.offsetHeight;
            let minimizeFont = false;
            for (let i = 1; i < thisSpan.length - 1; i++) {
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
            for (let i = omitCount; i < thisSpan.length - 1; i++) {
                thisSpan[i].style.display = 'none';
            }
        };
        const swiperItems = ui.core.mapDivDocument.querySelectorAll('.swiper-slide div');
        for (let i = 0; i < swiperItems.length; i++) {
            const swiperItem = swiperItems[i];
            stringSplit(swiperItem);
            omitCheck(swiperItem);
        }
    }

    remove() {
        this.core.remove();
        delete this.core;
    }
}
