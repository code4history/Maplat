import { MaplatUiElement } from '../element';
export type LegacySliderKind = "base" | "overlay";
/** 旧 `swiper.slides[i]` として読まれていた形（DOM の要素そのものではない）。 */
export interface LegacySlide {
    readonly mapID: string;
    readonly dataset: {
        swiperSlideIndex: string;
    };
    readonly classList: {
        contains: (token: string) => boolean;
    };
    getAttribute: (name: string) => string | null;
}
export interface LegacySwiper {
    /** 旧 `swiper.el`（スライダーの根。無ければ null） */
    readonly el: HTMLElement | null;
    /** 旧 `swiper.slides` */
    readonly slides: LegacySlide[];
    /** 旧 `swiper.activeIndex` */
    readonly activeIndex: number;
    readonly count: number;
    readonly destroyed: boolean;
    slideToMapID: (mapID: string) => void;
    setSlideMapID: (mapID: string) => void;
    setSlideMapIDAsSelected: (mapID: string) => void;
    slideToIndex: (index: number) => void;
    setSlideIndex: (index: number) => void;
    setSlideIndexAsSelected: (index: number) => void;
    slideNext: () => void;
    slidePrev: () => void;
    update: () => void;
    destroy: () => void;
}
export declare function createLegacySwiper(host: () => MaplatUiElement | null, kind: LegacySliderKind): LegacySwiper;
