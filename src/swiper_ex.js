import SwiperOrigin from '../legacy/swiper';

export class Swiper extends SwiperOrigin {
    slideToMapID(mapID) {
        const slide = this.$el[0].querySelector('.swiper-slide-active');
        if (slide.getAttribute('data') == mapID) return;

        const sliders = this.$el[0].querySelectorAll('.swiper-slide');
        for (let i=0; i<sliders.length; i++) {
            const slider = sliders[i];
            if (slider.getAttribute('data') == mapID) {
                return this.slideToLoop(parseInt(slider.getAttribute('data-swiper-slide-index')));
            }
        }
    }

    slideToIndex(index) {
        const slide = this.$el[0].querySelector('.swiper-slide-active');
        if (parseInt(slide.getAttribute('data-swiper-slide-index')) == index) return;

        this.slideToLoop(index);
    }

    setSlideMapID(mapID) {
        this.slideToMapID(mapID);
        this.setSlideMapIDAsSelected(mapID);
    }

    setSlideIndex(index) {
        this.slideToIndex(index);
        this.setSlideIndexAsSelected(index);
    }

    setSlideIndexAsSelected(index) {
        const sliders = this.$el[0].querySelectorAll('.swiper-slide');
        for (let i=0; i<sliders.length; i++) {
            const slider = sliders[i];
            if (slider.getAttribute('data-swiper-slide-index') == index) {
                slider.classList.add('selected');
            } else {
                slider.classList.remove('selected');
            }
        }
    }

    setSlideMapIDAsSelected(mapID) {
        const sliders = this.$el[0].querySelectorAll('.swiper-slide');
        for (let i=0; i<sliders.length; i++) {
            const slider = sliders[i];
            if (slider.getAttribute('data') == mapID) {
                slider.classList.add('selected');
            } else {
                slider.classList.remove('selected');
            }
        }
    }
}
