import Swiper from 'swiper';

Swiper.prototype.slideToMapID = function(mapID) {
    const slide = this.$el[0].querySelector('.swiper-slide-active');
    if (slide.getAttribute('data') == mapID) return;

    const sliders = this.$el[0].querySelectorAll('.swiper-slide');
    for (let i=0; i<sliders.length; i++) {
        const slider = sliders[i];
        if (slider.getAttribute('data') == mapID) {
            return this.slideToLoop(parseInt(slider.getAttribute('data-swiper-slide-index')));
        }
    }
};

Swiper.prototype.slideToIndex = function(index) {
    const slide = this.$el[0].querySelector('.swiper-slide-active');
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
    const sliders = this.$el[0].querySelectorAll('.swiper-slide');
    for (let i=0; i<sliders.length; i++) {
        const slider = sliders[i];
        if (slider.getAttribute('data-swiper-slide-index') == index) {
            slider.classList.add('selected');
        } else {
            slider.classList.remove('selected');
        }
    }
};

Swiper.prototype.setSlideMapIDAsSelected = function(mapID) {
    const sliders = this.$el[0].querySelectorAll('.swiper-slide');
    for (let i=0; i<sliders.length; i++) {
        const slider = sliders[i];
        if (slider.getAttribute('data') == mapID) {
            slider.classList.add('selected');
        } else {
            slider.classList.remove('selected');
        }
    }
};

export {Swiper};
