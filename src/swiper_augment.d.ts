import "swiper";

declare module "swiper" {
  interface Swiper {
    slideToMapID(mapID: string): void;
    setSlideMapID(mapID: string): void;
    setSlideIndex(index: number): void;
    setSlideIndexAsSelected(index: number): void;
    setSlideMapIDAsSelected(mapID: string): void;
    slideToIndex(index: number): void;
    $el: HTMLElement[];
  }
}
