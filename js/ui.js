define(['core', 'swiper', 'ol3'], function(Core, Swiper, ol) {
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

        // Add UI HTML Element
        var newElems = Core.createElement('<div class="swiper-container ol-control base-swiper prevent-default-ui">' +
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
            var id = evt.detail;

            ui.baseSwiper.setSlideMapID(id);
            ui.overlaySwiper.setSlideMapID(id);
        });



        ui.waitReady = ui.core.waitReady.then(function(){

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
