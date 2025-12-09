import 'swiper';

declare module 'swiper' {
    interface Swiper {
        slideToMapID(mapID: any): void;
        setSlideMapID(mapID: any): void;
        setSlideIndex(index: number): void;
        setSlideIndexAsSelected(index: number): void;
        setSlideMapIDAsSelected(mapID: any): void;
        slideToIndex(index: number): void;
        $el: any;
    }
}
