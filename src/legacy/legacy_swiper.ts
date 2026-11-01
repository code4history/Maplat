// 旧 `ui.baseSwiper` / `ui.overlaySwiper`（Swiper のインスタンス）の限定 facade。
//
// 旧 UI の地図の切り替えは Swiper 12 だった。層 B の `<maplat-ui>` は Swiper を使わず
// （`src/element/slider.ts` の `MapSlider`）、`part="map-slide"` のボタンを並べる。
// 互換層は **Swiper を import せず**（`spec/legacy-deps.spec.ts`）、旧 UI が使っていた口だけを
// `MapSlider` へ委譲する。`slides` は旧 Swiper の `slides` と同じ形（`getAttribute("data")`・
// `dataset.swiperSlideIndex`・`classList.contains("selected")`）の**見かけの**配列を返す。

import type { MaplatUiElement } from "../element";
import type { MapSlider, MapSliderItem } from "../element/slider";

export type LegacySliderKind = "base" | "overlay";

/** 旧 `swiper.slides[i]` として読まれていた形（DOM の要素そのものではない）。 */
export interface LegacySlide {
  readonly mapID: string;
  readonly dataset: { swiperSlideIndex: string };
  readonly classList: { contains: (token: string) => boolean };
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

export function createLegacySwiper(
  host: () => MaplatUiElement | null,
  kind: LegacySliderKind
): LegacySwiper {
  const slider = (): MapSlider | null => host()?.slider(kind) ?? null;
  const items = (): ReadonlyArray<MapSliderItem> => slider()?.items ?? [];
  const selected = (): string | null => slider()?.selectedMapID ?? null;

  const facade: LegacySwiper = {
    get el() {
      return slider()?.element ?? null;
    },
    get slides() {
      const current = selected();
      return items().map((item, index) => {
        const isSelected = current === item.mapID;
        return {
          mapID: item.mapID,
          dataset: { swiperSlideIndex: `${index}` },
          classList: {
            contains: (token: string) =>
              token === "selected" ? isSelected : false
          },
          getAttribute: (name: string) => (name === "data" ? item.mapID : null)
        };
      });
    },
    get activeIndex() {
      return slider()?.activeIndex ?? 0;
    },
    get count() {
      return items().length;
    },
    // 旧 Swiper の `destroyed`。層 B のスライダーは破棄しない（地図の切り替えで作り直す）
    destroyed: false,
    slideToMapID: mapID => slider()?.setSelectedMapID(mapID),
    setSlideMapID: mapID => slider()?.setSelectedMapID(mapID),
    setSlideMapIDAsSelected: mapID => slider()?.setSelectedOnly(mapID),
    slideToIndex: index => {
      const item = items()[index];
      if (item) slider()?.setSelectedMapID(item.mapID);
    },
    setSlideIndex: index => {
      const item = items()[index];
      if (item) slider()?.setSelectedMapID(item.mapID);
    },
    setSlideIndexAsSelected: index => {
      const item = items()[index];
      slider()?.setSelectedOnly(item ? item.mapID : null);
    },
    // 旧 UI は「次の地図 / 前の地図」を 1 つ送っていた（`step` は端で止まる）
    slideNext: () => void slider()?.step(1),
    slidePrev: () => void slider()?.step(-1),
    update: () => slider()?.refresh(),
    destroy: () => {
      // 何もしない（部品は <maplat-ui> が持つ。facade は旧 API の外形なので残す）
    }
  };
  return facade;
}
