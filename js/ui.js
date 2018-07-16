define(['core', 'sprintf', 'swiper', 'ol3', 'bootstrap'], function(Core, sprintf, Swiper, ol, bsn) {
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

        ui.core.addEventListener('uiPrepare', function(evt) {
            // Check Splash data
            var splash = false;
            if (ui.core.appData.splash) splash = true;

            var modalElm = ui.core.mapDivDocument.querySelector('#modalBase');
            var modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
            ui.core.mapDivDocument.querySelector('#modal_load_title').innerText = ui.core.translate(ui.core.appData.app_name);
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
        });

        ui.core.addEventListener('sourceLoaded', function(evt) {
            var sources = evt.detail;

            ui.splashPromise.then(function(){
                var modalElm = ui.core.mapDivDocument.querySelector('#modalBase');
                var modal = new bsn.Modal(modalElm, {'root': ui.core.mapDivDocument});
                modalSetting('load');
                modal.hide();
            });

            for (var i=0; i<sources.length; i++) {
                var source = sources[i];
                if (source instanceof ol.source.NowMap && !(source instanceof ol.source.TmsMap)) {
                    ui.baseSwiper.appendSlide('<div class="swiper-slide" data="' + source.sourceID + '">' +
                        '<img crossorigin="anonymous" src="' + source.thumbnail + '"><div>' + source.label + '</div></div>');
                } else {
                    ui.overlaySwiper.appendSlide('<div class="swiper-slide" data="' + source.sourceID + '">' +
                        '<img crossorigin="anonymous" src="' + source.thumbnail + '"><div>' + source.label + '</div></div>');
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
            ui.core.mapDivDocument.querySelector('.map-title span').innerText = title;
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
                        ui.core.mapDivDocument.querySelector('#modal_title').innerText = ui.core.t('app.out_of_map');
                        ui.core.mapDivDocument.querySelector('#modal_gpsD_content').innerText = ui.core.t('app.out_of_map_desc');
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
                    var from = ui.core.from; // app.mapObject.getSource();

                    if (!ol.source.META_KEYS.reduce(function(prev, curr) {
                        if (curr == 'title') return prev;
                        return from[curr] || prev;
                    }, false)) return;

                    ui.core.mapDivDocument.querySelector('#modal_title').innerText = from.officialTitle || from.title;
                    ol.source.META_KEYS.map(function(key) {
                        if (key == 'title' || key == 'officialTitle') return;
                        if (!from[key] || from[key] == '') {
                            ui.core.mapDivDocument.querySelector('#' + key + '_div').classList.add('hide');
                        } else {
                            ui.core.mapDivDocument.querySelector('#' + key + '_div').classList.remove('hide');
                            ui.core.mapDivDocument.querySelector('#' + key).innerHTML =
                                (key == 'license' || key == 'dataLicense') ?
                                    '<img src="parts/' + from[key].toLowerCase().replace(/ /g, '_') + '.png">' :
                                    from[key];
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
                var newElem = Core.createElement(sprintf(ui.core.t('app.fake_explanation'), ui.core.translate(fakeCenter), fakeRadius))[0];
                var elem = ui.core.mapDivDocument.querySelector('#modal_gpsW_content');
                elem.appendChild(newElem);
            } else {
                var newElem = Core.createElement(ui.core.t('app.acquiring_gps_desc'))[0];
                var elem = ui.core.mapDivDocument.querySelector('#modal_gpsW_content');
                elem.appendChild(newElem);
            }



        });



    };

    ol.inherits(MaplatUi, ol.events.EventTarget);

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
