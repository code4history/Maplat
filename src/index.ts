// パッケージの入口（設計 v2 §2.3.1 (1)・§6.4 Stage 3・Stage 4）。
//
// 旧 API `MaplatUi` は、いまは `<maplat-ui>`（層 B）の上の互換層（`src/legacy/maplat_ui_compat.ts`）が
// 出す。外形（`new MaplatUi(option)`・`createObject`・`waitReady`・19 メソッド・41 フィールド・
// `uiHooks` の 7 段階・`ui.core`）は旧と同じで、中は層 B と層 A（`<maplat-app>`）に委譲する。
// 旧の実装そのものは Stage 4 で消した（git の履歴から読める）。同じ画面を描く経路は
// `<maplat-ui>` の 1 つだけになった（二重実装の解消。`spec/stage4-removal.spec.ts`）。
//
// 地図は OpenLayers なので、旧の入口と同じく `ol/ol.css` を読み込む（層 A の要素は CSS を
// 同梱しない）。旧 UI のスタイル（`./styles/ui.scss`）は Shadow DOM 化で不要になったので読まない
// （移行は `docs/api/migration-ui-shadow-dom.md`）。

import "ol/ol.css";

export { MaplatUi } from "./legacy/maplat_ui_compat";
export type {
  MaplatAppOption,
  MaplatUiHooks,
  RestoreState
} from "./legacy/legacy_types";
