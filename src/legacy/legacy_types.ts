// 旧 API の型。
//
// 互換層は旧 UI の実装ファイルを **実行時に** import しないが、公開型は同じものを出す必要が
// あるので、ここで `src/types.ts` から型だけを再輸出する（`import type` は実行時に消える）。
//
// 旧 UI の実装を削除したときに地図切り替え部品と OpenLayers の Control 層への依存を消したので、旧 API の外形として
// 残す `SwiperInstance` は、その部品のクラス型ではなく、互換層が返す限定 facade の形（構造型）として
// ここで定義する（旧の呼び手が読む口だけ）。`ui.sliderNew` の型は `LegacySliderFacade`（`legacy_slider.ts`）、
// `ui.contextMenu` の型は `LegacyContextMenuFacade`（`legacy_context_menu.ts`）。

import type {
  ContextMenuItem,
  ContextMenuOptions,
  MaplatAppOption,
  MaplatUiHooks,
  RestoreState
} from "../types";
import type { MaplatMenuItem } from "../element";
import type { LegacySwiper } from "./legacy_swiper";

/**
 * 旧 `ui.baseSwiper` / `ui.overlaySwiper` の型（旧は Swiper のインスタンス）。
 * 互換層は Swiper の実物ではなく、`MapSlider` へ委譲する限定 facade（`LegacySwiper`）を返す。
 */
export type SwiperInstance = LegacySwiper;

export type {
  ContextMenuItem,
  ContextMenuOptions,
  MaplatAppOption,
  MaplatUiHooks,
  RestoreState,
  MaplatMenuItem
};

/**
 * 旧 `MaplatUi(option)` が受けていた形。
 *
 * `setting`（設定ファイルの中身を直接渡す）と `div`（地図を置く要素。id か要素）は旧 Core の
 * `MaplatAppOption` だったが、層 A の要素の公開型には無い（要素では `setting` プロパティ・
 * `div` は要素自身が作る）。互換層が受けて層 A へ渡す。
 */
export interface MaplatUiLegacyOption extends MaplatAppOption {
  /** 設定ファイルの中身（渡すとファイルを読まない。旧 Core の `setting`） */
  setting?: unknown;
  /** 地図を置く要素、またはその id（旧 Core の `div`。既定は `#map_div`） */
  div?: HTMLElement | string;
  /** 旧 UI のフック（`uiHooks`。互換層は onUiConfigure だけ i18n を待ってから呼ぶ） */
  uiHooks?: MaplatUiHooks;
  /**
   * 地図の ID（旧 API の文書には無いキー）。互換層は `map-id` 属性には**流さない**。子へ渡す `appOption` の
   * 複製にそのまま残るだけで、Core 1.x はこのキーを読まない（起動時の地図は設定ファイルの `startFrom`・`restore`）
   */
  mapID?: string;
}

/** 旧 API のイベントの購読（`ol/events/Target` の外形に合わせる）。 */
export type LegacyListener = (event: unknown) => void;
