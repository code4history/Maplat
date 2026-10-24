// <maplat-ui> の Shadow DOM の CSS。見た目は旧 UI（src/styles/maplat-specific.scss の
// .ol-control・.ol-slidernew・.map-title・.modal・マーカー一覧（.list-group-item.layer 等）、
// src/styles/contextmenu.scss の .ol-ctx-menu-container、OpenLayers の ol.css の .ol-control）に寄せた。
//
// 規則（仕様 §4.6-3）: 層 A（<maplat-app>）の中身の DOM・class には CSS を当てない。当てるのは
// スロットに差した要素そのものの箱（::slotted）だけ。
//
// 地図の切り替えスライダーの見た目は、Stage 1 の `slider.ts` の暫定の `<style>` からここへ移した
// （設計 §6.3・§4.5）。数値は `SLIDER_TUNING` から埋め込む（1 か所。Minor 5）。
// 注意（P2 の調整のとき）: 埋め込みはこのモジュールを読み込んだ時の値で 1 回だけ行う。実行中に
// `SLIDER_TUNING` を書き換えると、JS の側（幅の境界の判定・枚数・時間）だけが変わり CSS とずれる。
// 数値を試すときは値を変えてから読み込み直す（ページを開き直す）。
import { SLIDER_TUNING } from "./slider";

export const MAPLAT_UI_CSS = `
:host {
  display: block;
  position: relative;
  height: 400px;
  overflow: hidden;
  /* 書体・文字の大きさ・行の高さ・色はページから継承する（旧 UI と同じ。旧の bootstrap は .maplat の
     下に閉じ込めてあり、body の規則（14px・1.42857・#333）は当たらない＝操作ボタン・スライダーの容器・
     モーダルの本文はページの文字を継ぐ。基準 JSON の計算値は 16px・黒・normal＝ページ既定。
     レビュー Major 3・積み残し「字の大きさと色をページから継承する」）。
     ここでは何も決めない。大きさを決めるのは、旧も自分で決めていたもの（題名 18px・カード 18px・
     モーダルの見出し 18px・POI のメニュー 13px・知らせ 17px）だけ */
  -webkit-tap-highlight-color: transparent;
}
:host([hidden]) { display: none; }
.frame { position: absolute; inset: 0; }
/* 地図（light DOM の <maplat-app>）を枠いっぱいに置く。文書側の既定の箱
   (:where(maplat-app){height:400px}) より強くするため important（Shadow DOM の important は外に勝つ） */
::slotted(maplat-app) {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
}
[hidden] { display: none !important; }

/* ---- 操作ボタン（旧 .ol-control・node_modules/ol/ol.css と src/styles/maplat-specific.scss） ----
   位置は設計 §5.2 の旧 CSS の px/em をそのまま使う。em の基準は旧と同じ 16px（下の .ctl）。 */
/* 旧 .ol-control の文字はページから継ぐ（基準 JSON の 16px はページ既定の 16px）。位置の .5em も
   ページの文字の大きさに従う（ページが 20px なら 10px。旧と同じ）。容器には何も置かない */
.ctl {
  position: absolute;
  background-color: rgba(128, 128, 128, .25);
  border-radius: 4px;
}
.ctl button {
  display: block;
  margin: 0;
  padding: 0;
  height: 2.0625em;
  width: 2.0625em;
  /* 旧 bootstrap の .maplat button は font-family・font-size・line-height とも inherit（行の高さは normal）。
     旧 ol.css の .ol-control button も font-size: inherit。UA の button の 13.333px を受けず、容器（＝ページ）
     の大きさを継ぐ */
  font-family: inherit;
  font-size: inherit;
  font-weight: normal;
  line-height: normal;
  color: rgb(255, 255, 255);
  background-color: rgba(120, 5, 8, .5);
  border: none;
  border-radius: 2px;
  cursor: pointer;
  text-align: center;
  touch-action: manipulation;
}
.ctl button:focus-visible { outline: 2px solid rgba(120, 5, 8, .9); outline-offset: 1px; }
@media (hover: hover) {
  .ctl button:hover { background-color: rgba(120, 5, 8, .7); }
}
.ctl.disable button,
.ctl button:disabled {
  color: rgba(255, 255, 255, .7);
  background-color: rgba(120, 5, 8, .2);
}
/* アイコンは旧 UI と同じ src/icons.ts の SVG（1em 角）。旧は getIcon(…, "far fa-lg") の class を付けるが、
   旧 CSS に .fa-lg の規則は無いので、実際の大きさはボタンの文字の大きさ（16px・タッチ 24px）と同じ 1em。
   新も 1em にする（仕上げで実測。旧 16×16・ボタンの左上から 8.5px/7.5px） */
.ctl .icon { display: inline-block; font-size: 1em; line-height: 1; }
.ctl-zoom { top: .5em; left: .5em; left: calc(.5em + env(safe-area-inset-left)); }
.ctl-zoom button { height: 2.0625em; width: 2.0625em; font-weight: normal; }
.ctl-zoom button:first-child { border-radius: 2px 2px 0 0; }
.ctl-zoom button:last-child { border-radius: 0 0 2px 2px; }
.ctl-gps { top: 80px; left: .5em; left: calc(.5em + env(safe-area-inset-left)); }
.ctl-home { top: 120px; left: .5em; left: calc(.5em + env(safe-area-inset-left)); }
.ctl-compass { top: .5em; right: .5em; right: calc(.5em + env(safe-area-inset-right)); }
.ctl-compass .needle { display: inline-block; will-change: transform; }
.ctl-compass .needle svg { transform: rotate(-33deg); }
/* 右下のボタンの列（旧 .ol-copyright・.ol-border・.ol-hide-marker・.ol-marker-list の積み方）。
   下から 地図情報・枠線・マーカーの非表示・マーカー一覧 の順（R4）。列は flex なので、隠れている
   ボタンの分だけ詰めて積まれる（旧 UI と同じく隙間を空けない）。旧の間隔は 40px（33px + 7px）。 */
.ctl-column {
  position: absolute;
  right: .5em;
  right: calc(.5em + env(safe-area-inset-right));
  bottom: calc(65px + .5em);
  bottom: calc(65px + .5em + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column-reverse;
  gap: 7px;
}
.ctl-column > .ctl {
  position: relative;
  top: auto;
  right: auto;
  bottom: auto;
  left: auto;
}
/* 共有のボタン（旧 .ol-share: 左下。共有のボタンの上にヘルプ） */
.ctl-share { left: .5em; left: calc(.5em + env(safe-area-inset-left)); bottom: calc(105px + .5em); bottom: calc(105px + .5em + env(safe-area-inset-bottom)); }
/* ヘルプのボタン（旧 .ol-maplat: 左下） */
.ctl-help { left: .5em; left: calc(.5em + env(safe-area-inset-left)); bottom: calc(65px + .5em); bottom: calc(65px + .5em + env(safe-area-inset-bottom)); }
/* 押されている状態（旧は class の付け替えで表していた） */
.ctl button[aria-pressed="true"] { background-color: rgba(120, 5, 8, .9); }
/* 操作ボタンの自動非表示（旧 .ol-control.fade / .ol-slidercommon.fade） */
.ctl.fade,
.slider.fade,
.map-title.fade,
.map-slider.fade { display: none; }
/* タッチ端末ではズームのボタンを隠す（旧 &.ol-touch .ol-zoom { display: none; }） */
.frame.touch .ctl-zoom { display: none; }
/* タッチ端末はズームを隠した分、GPS とホームを上へ詰め、ボタンを指で押せる大きさにする
   （旧 ol-touch: src/styles/maplat-specific.scss の .gps / .home の top と、
   node_modules/ol/ol.css の .ol-touch .ol-control button { font-size: 1.5em }＝ページ既定の 16px なら 24px）。
   右列は flex の自動積みで旧の 115px+.5em / 165px+.5em / 215px+.5em に寄せる（ボタン 49.5px）。 */
.frame.touch .ctl-gps { top: .5em; }
.frame.touch .ctl-home { top: calc(.5em + 50px); }
.frame.touch .ctl button { font-size: 1.5em; }
/* bottom は基本の規則（65px + .5em + 安全領域）のまま。ここで書くと安全領域が消える（レビュー Major 2） */
.frame.touch .ctl-column { gap: .5px; }
.frame.touch .ctl-share { bottom: calc(115px + .5em); bottom: calc(115px + .5em + env(safe-area-inset-bottom)); }

/* ---- 透過度のスライダー（旧 .ol-slidernew） ---- */
.slider {
  position: absolute;
  appearance: none;
  -webkit-appearance: none;
  margin: 0;
  bottom: .5em;
  bottom: calc(.5em + env(safe-area-inset-bottom));
  left: calc(50% - 80px);
  width: 160px;
  height: 25px;
  background: rgba(255, 255, 255, .5);
  border: 2px solid #666;
  border-radius: 4px;
  box-sizing: border-box;
  /* <input> は UA の 13.333px を持つ。旧は bootstrap の input の font-size: inherit でページの大きさ
     （基準 JSON の 16px はページ既定）を継いでいたので、新も継ぐ（bottom の .5em はページに従う） */
  font-size: inherit;
}
.slider[disabled] { background: rgba(255, 255, 255, .7); }
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 25px;
  background-color: rgba(120, 5, 8, .5);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.slider::-moz-range-thumb {
  width: 20px;
  height: 25px;
  background-color: rgba(120, 5, 8, .5);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.slider[disabled]::-webkit-slider-thumb { background-color: rgba(120, 5, 8, .2); cursor: default; }
.slider[disabled]::-moz-range-thumb { background-color: rgba(120, 5, 8, .2); cursor: default; }
@media (hover: hover) {
  .slider:not([disabled])::-webkit-slider-thumb:hover { background-color: rgba(120, 5, 8, .7); }
  .slider:not([disabled])::-moz-range-thumb:hover { background-color: rgba(120, 5, 8, .7); }
}
@media screen and (max-width: 640px) {
  .slider { left: 37.5%; width: 25%; }
}
@media screen and (max-width: 320px) {
  .slider { left: 120px; width: 80px; }
}

/* ---- 地図の題名（旧 .map-title。旧 UI と同じく div + span） ---- */
.map-title {
  position: absolute;
  top: .5em;
  left: calc(50% - 250px);
  width: 500px;
  margin: auto;
  background-color: rgba(32, 32, 32, .5);
  border-radius: 4px;
  color: #fff;
  font-size: 18px;
  text-align: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
/* 旧 .map-title は高さも line-height も指定せず normal（ページの書体の normal）。新も同じにする */
.map-title,
.map-title .text { line-height: normal; }
.map-title .text { display: inline; }
@media screen and (max-width: 600px) {
  .map-title { width: calc(100% - 100px); left: 50px; }
  .frame.touch .map-title { width: calc(100% - 130px); left: 65px; }
}

/* ---- 地図の切り替えスライダー（旧 .base-swiper / .overlay-swiper。設計 §4.5・§5.2 B12/B13） ----
   位置は旧 CSS の値をそのまま使う（左＝背景の地図、右＝重ねる地図）。P3: overlay: false でも
   隠さない。地図が 1 枚しかないスライダーは枠（背景）を描かないが、位置と幅は変えないので
   左右の釣り合いは保たれる。 */
.map-switcher { position: absolute; inset: 0; pointer-events: none; }
.map-slider {
  position: absolute;
  z-index: 1;
  bottom: .5em;
  bottom: calc(.5em + env(safe-area-inset-bottom));
  height: ${SLIDER_TUNING.cardHeightPx}px;
  width: 224px;
  background-color: rgba(32, 32, 32, .5);
  border-radius: 4px;
  color: #fff;
  /* 旧 .swiper の容器はページの文字を継ぐ（基準 JSON の 16px はページ既定。bottom の .5em はページに従う）。
     カード（.swiper-slide）は旧が自分で 18px を決めていたので、下の .map-slide で 18px */
  -webkit-user-select: none;
  user-select: none;
  touch-action: pan-y;
  pointer-events: auto;
}
.map-slider[data-kind="base"] { left: calc(50% - 312px); }
.map-slider[data-kind="overlay"] { left: calc(50% + 88px); }
/* 1 枚（と 0 枚）のスライダーは枠を描かない（P3。位置は動かさない） */
.map-slider.single-map { background-color: transparent; }
.map-slider:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.map-slider-viewport { position: relative; overflow: hidden; width: 100%; height: 100%; }
.map-slider-track { position: absolute; top: 0; left: 0; width: 100%; height: 100%; will-change: transform; }
/* カードは <button>。UA の button の文字（13.333px）を受けず、旧 .swiper-slide と同じ 18px にする */
.map-slide { position: absolute; top: 0; left: 0; height: 100%; margin: 0; padding: 0; border: 0; box-sizing: border-box; font: inherit; font-size: 18px; background-color: rgba(0, 0, 0, 0); display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer; }
.map-slide:focus-visible { outline: 2px solid #fff; outline-offset: -2px; }
.map-slide-thumb { position: absolute; top: 0; right: 0; bottom: 0; left: 0; margin: auto; z-index: 0; max-width: 100%; max-height: 100%; }
/* 旧 #thumbPlaceholder と同じ見た目（頭文字）。要素の 1 つだけを使い、2 つ目を作らない */
.map-slide .thumb.none { position: absolute; top: 0; right: 0; bottom: 0; left: 0; width: 52px; height: 52px; max-width: 100%; max-height: 100%; margin: auto; z-index: 0; display: flex; align-items: center; justify-content: center; color: rgba(255, 255, 255, .75); font-size: 1.6em; }
.map-slide-label { position: absolute; right: 0; bottom: .1em; left: 0; margin: auto; z-index: 1; font-size: 1em; line-height: normal; color: #fff; background-color: rgba(32, 32, 32, .5); text-align: center; }
.map-slide-label.minimize { font-size: .8em; }
@media screen and (max-width: ${SLIDER_TUNING.breakpointWidth}px) {
  .map-slider.touch .map-slide-label { font-size: .8em; }
  .map-slider.touch .map-slide-label.minimize { font-size: .6em; }
}
.map-slide.selected { background-color: rgba(0, 0, 255, .1); }
/* 範囲を持つ地図の枠（旧 .show-border .swiper-slide.<色>）。色は要素が割り当てた 12 色 */
.map-slider.show-border .map-slide.has-envelope { border: 2px dashed var(--maplat-envelope-color, maroon); }
/* 矢印（旧 .base-prev 等＋旧ライブラリ v12 の .swiper-button-prev/next）。箱は 18×30・top 15px、
   形は旧ライブラリの山形の SVG、色は旧の既定の #007aff（旧の swiper-button-white は v12 では効かない） */
.map-slider-nav { position: absolute; top: 15px; width: 18px; height: 30px; margin: 0; padding: 0; border: 0; background-color: transparent; display: flex; align-items: center; justify-content: center; color: #007aff; z-index: 10; cursor: pointer; }
.map-slider-nav.prev { left: 4px; }
.map-slider-nav.next { left: calc(100% - 22px); }
.map-slider-nav-icon { width: 100%; height: 100%; object-fit: contain; transform-origin: center; fill: currentColor; pointer-events: none; }
.map-slider-nav.prev .map-slider-nav-icon { transform: rotate(180deg); }
.map-slider-nav[hidden] { display: none; }
.map-slider.single-map .map-slider-nav { display: none; }
.map-slider.disabled .map-slide { cursor: default; }
.map-slider-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media screen and (max-width: 640px) {
  .map-slider { width: 35%; }
  .map-slider[data-kind="base"] { left: 1.25%; }
  .map-slider[data-kind="overlay"] { left: 63.75%; }
}
@media screen and (max-width: 320px) {
  .map-slider { width: 112px; }
  .map-slider[data-kind="base"] { left: 4px; }
  .map-slider[data-kind="overlay"] { left: 204px; }
}
@media (prefers-reduced-motion: reduce) { .map-slider-track { transition: none !important; } }

/* ---- POI の吹き出し（旧 .modal / .modal_poi） ---- */
.modal {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  background: rgba(0, 0, 0, .5);
}
.modal .dialog {
  position: relative;
  box-sizing: border-box;
  width: 600px;
  max-width: calc(100% - 20px);
  margin: 30px 10px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, .2);
  border-radius: 6px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, .5);
}
@media (max-width: 767px) {
  .modal .dialog { margin: 10px; }
}
.modal .header {
  display: flex;
  align-items: flex-start;
  gap: .5em;
  padding: 15px;
  border-bottom: 1px solid #e5e5e5;
}
.modal .title { flex: 1; margin: 0; font-size: 18px; font-weight: 500; line-height: 1.42857; overflow-wrap: anywhere; }
.modal .close {
  flex: none;
  margin: -6px -4px 0 0;
  padding: 0 4px;
  border: 0;
  background: transparent;
  font-size: 32px;
  font-weight: bold;
  line-height: 1;
  color: #000;
  opacity: .2;
  cursor: pointer;
}
.modal .close:hover { opacity: .5; }
.modal .body { padding: 15px; overflow-wrap: anywhere; }
.poi-html { display: block; width: 100%; }
.poi-html.scroll { max-height: 60vh; overflow-y: auto; }
.poi-iframe { width: 100%; min-height: 50vh; border: 0; }
.poi-iframe.no-scroll { min-height: 0; height: 60vh; }
/* POI のメディア（旧 .poi_img_swiper と、旧が文書の head に入れていた cc-swiper の style） */
.poi-media { margin-bottom: 10px; }
.poi-media cc-swiper {
  display: block;
  height: 300px;
  /* ページから変えられるよう、層 B の CSS 変数で公開する（Shadow DOM の中で直接指定すると外から上書きできない。
     Stage 3 のレビュー m5）。既定は旧と同じ #007aff */
  --cc-slider-theme-color: var(--maplat-poi-media-theme-color, #007aff);
  --cc-slider-navigation-color: var(--maplat-poi-media-navigation-color, #007aff);
}
.poi-address { color: #555; margin: 0 0 10px; }
.poi-desc { margin: 0 0 10px; }
/* ---- マーカー一覧（旧 .modal_marker_list・.list-group-item.layer / .poi） ---- */
.marker-list-modal .body { padding: 0; }
.marker-list-modal ul { list-style: none; margin: 0; padding: 0; }
.marker-list-modal li.layer { border-bottom: 1px solid #ddd; }
.marker-list-modal li.layer:last-child { border-bottom: 0; }
.marker-list-modal .layer-row { display: flex; align-items: center; justify-content: space-between; }
.marker-list-modal button.layer-label,
.marker-list-modal button.poi {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 8px;
  margin: 0;
  padding: 8px 10px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.marker-list-modal ul.pois { padding-inline-start: 15px; }
.marker-list-modal ul.pois li { border-top: 1px solid #eee; }
@media (hover: hover) {
  .marker-list-modal button.layer-label:hover,
  .marker-list-modal button.poi:hover { background-color: #ccc; }
}
.marker-list-modal button.layer-label:active,
.marker-list-modal button.poi:active { background-color: #ccc; }
.marker-list-modal .icon { flex: none; width: 32px; height: 32px; object-fit: contain; }
.marker-list-modal .name { overflow-wrap: anywhere; }
/* 旧 .dli-chevron（閉じて右向き・開いて下向き） */
.marker-list-modal .chevron {
  flex: none;
  display: inline-block;
  width: .7em;
  height: .7em;
  margin: 0 4px;
  border: .1em solid #333;
  border-left: 0;
  border-bottom: 0;
  box-sizing: border-box;
  transform: rotate(45deg);
}
.marker-list-modal li.layer.open > .layer-row .chevron { transform: rotate(135deg); }
/* 旧 input.markerlist + label.check（ON/OFF の切り替え） */
.marker-list-modal .switch { flex: none; position: relative; display: inline-block; width: 60px; height: 28px; margin: 0 15px 0 8px; cursor: pointer; }
.marker-list-modal .switch input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
.marker-list-modal .switch .track {
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  border: 1px solid #a3a3a3;
  border-radius: 3px;
  background-color: #fff;
  color: #969696;
  pointer-events: none;
}
.marker-list-modal .switch .track::before { content: "OFF"; position: absolute; top: 4px; right: 6px; }
.marker-list-modal .switch .track::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 22px;
  box-sizing: border-box;
  border: 1px solid #a3a3a3;
  border-radius: 3px;
  background-color: #fff;
  transition: .2s;
}
.marker-list-modal .switch input:checked + .track { border-color: #4db4e4; background-color: #4db4e4; }
.marker-list-modal .switch input:checked + .track::before { content: "ON"; left: 6px; right: auto; color: #fff; }
.marker-list-modal .switch input:checked + .track::after { border-color: transparent; left: 44px; }
.marker-list-modal .switch input:focus-visible + .track { outline: 2px solid rgba(120, 5, 8, .9); outline-offset: 1px; }

/* ---- 重なった POI の選択メニュー（旧 .ol-ctx-menu-container・幅 170px） ---- */
.poi-menu {
  position: absolute;
  z-index: 5;
  width: 170px;
  box-sizing: border-box;
  padding: 8px;
  background: #fff;
  color: #222;
  font-size: 13px;
  border-radius: 5px;
  box-shadow: rgba(0, 0, 0, .2) 3px 3px 5px;
}
.poi-menu ul { list-style: none; margin: 0; padding: 0; max-height: 50vh; overflow-y: auto; }
.poi-menu button {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  margin: 0;
  padding: 2px 5px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  line-height: 20px;
  text-align: left;
  cursor: pointer;
}
.poi-menu button:hover,
.poi-menu button:focus-visible { background-color: #333; color: #eee; outline: none; }
.poi-menu .icon { flex: none; width: auto; height: 20px; }
.poi-menu .name { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

/* ---- 共有（旧 .modal_share・.poi_share_buttons・.qr_view 等。旧は Bootstrap の btn-light を 3 列に並べていた） ---- */
.share-section + .share-section { margin-top: 15px; padding-top: 10px; border-top: 1px solid #e5e5e5; }
.share-heading { margin: 0 0 10px; font-size: 18px; font-weight: 500; }
.share-buttons { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 10px; }
.share-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .35em;
  padding: 6px 12px;
  border: 1px solid #f8f9fa;
  border-radius: 4px;
  background-color: #f8f9fa;
  color: #212529;
  font: inherit;
  /* 旧 .btn（bootstrap の button-size の $font-size-base・$line-height-base）は文字を自分で決めていた */
  font-size: 14px;
  line-height: 1.42857;
  cursor: pointer;
}
.share-button:hover { background-color: #e2e6ea; border-color: #dae0e5; }
.share-button:focus-visible { outline: 2px solid rgba(120, 5, 8, .9); outline-offset: 1px; }
.share-button svg { width: 14px; height: 14px; flex: none; }
.qr { display: block; width: 128px; min-height: 128px; margin: 0 auto; }
.qr svg { display: block; width: 128px; height: 128px; }
.poi-share { padding: 0 15px 15px; }
/* 知らせ（旧 .custom-toast。旧は document.body に置いていた） */
.toast {
  position: fixed;
  z-index: 30;
  visibility: hidden;
  min-width: 250px;
  box-sizing: border-box;
  padding: 16px;
  border-radius: 2px;
  background-color: #333;
  color: #fff;
  font-size: 17px;
  text-align: center;
  opacity: 0;
  transition: opacity .3s;
  pointer-events: none;
}
.toast.show { visibility: visible; opacity: 1; }

/* ---- 地図情報（旧 .modal_map・modal_cache_content。旧は Bootstrap の dl-horizontal と btn を並べていた） ---- */
.map-info-modal .body { padding: 15px; }
.map-info-modal dl.map-meta {
  display: grid;
  grid-template-columns: 9em 1fr;
  gap: .35em .9em;
  margin: 0;
}
.map-info-modal dl.map-meta dt { color: #555; font-weight: bold; }
.map-info-modal dl.map-meta dd { margin: 0; min-width: 0; }
/* 旧 bootstrap の dt, dd { line-height: $line-height-base } は .maplat の下でも当たっていた */
.map-info-modal dl.map-meta dt,
.map-info-modal dl.map-meta dd { line-height: 1.42857; }
.map-info-modal img.license { display: block; max-height: 2.2em; max-width: 100%; }
/* アイコンの無い語彙は文言だけを出す（相対 URL の画像を取りに行かない） */
.map-info-modal .license-text { display: block; }
.map-info-modal .license_note { margin-top: .3em; font-size: .85em; color: #555; }
.map-info-modal .map-cache { margin-top: 15px; padding-top: 10px; border-top: 1px solid #e5e5e5; }
.map-info-modal .cache-heading { margin: 0 0 .4em; font-size: .95em; font-weight: bold; color: #555; }
.map-info-modal .cache-size { margin: 0 0 .6em; overflow-wrap: anywhere; }
.map-info-modal .cache-buttons { margin: 0; text-align: right; }
.map-info-modal .cache-buttons button {
  margin-left: .5em;
  padding: .3em .9em;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f4f4f4;
  color: #212529;
  font: inherit;
  /* 旧 .btn（bootstrap の button-size の $font-size-base・$line-height-base）は文字を自分で決めていた */
  font-size: 14px;
  line-height: 1.42857;
  cursor: pointer;
}
.map-info-modal .cache-buttons button:hover:not([disabled]) { background-color: #e2e6ea; border-color: #dae0e5; }
.map-info-modal .cache-buttons button:focus-visible { outline: 2px solid rgba(120, 5, 8, .9); outline-offset: 1px; }
.map-info-modal .cache-buttons button.btn-danger { background-color: #d9534f; border-color: #d43f3a; color: #fff; }
.map-info-modal .cache-buttons button.btn-danger:hover:not([disabled]) { background-color: #c9302c; border-color: #ac2925; }
.map-info-modal .cache-buttons button[disabled] { opacity: .5; cursor: default; }

/* ---- ヘルプ（旧 .modal_help_content・.help_content・.help_img） ---- */
.help-modal .help-body { max-height: 70vh; overflow-y: auto; }
.help-modal .help-text { margin: 0 0 .6em; }
.help-modal h4 { margin: 1em 0 .3em; font-size: 1em; font-weight: bold; color: #333; }
.help-modal .help-list { margin: 0 0 .6em; padding-inline-start: 1.4em; }
.help-modal .help-list li { margin: 0 0 .4em; }
.help-modal .help-icon { display: inline-block; height: 1em; width: 1em; vertical-align: -0.125em; }
.help-modal .help-icon svg { height: 1em; width: 1em; }
.help-modal .help-img { max-height: 1.4em; width: auto; vertical-align: middle; }
.help-modal .help-key {
  display: inline-block;
  min-width: 1.2em;
  padding: 0 .3em;
  border: 1px solid #999;
  border-radius: 3px;
  background: #eee;
  font-weight: bold;
  line-height: 1.4;
  text-align: center;
  vertical-align: middle;
}
.help-modal .help-slider {
  display: inline-block;
  width: 2.2em;
  height: .8em;
  border: 2px solid #666;
  border-radius: 4px;
  background: rgba(255, 255, 255, .6);
  vertical-align: middle;
}
.help-modal .help-footer { margin: 1em 0 0; font-size: .9em; color: #555; }

/* ---- 範囲外・GPS のエラー（旧 modal_gpsD。題名と本文だけ） ---- */
.gps-modal .gps-message { margin: 0; line-height: 1.6; }

/* ---- スプラッシュ（旧 initSplash・.modal_load_content・.splash_div） ---- */
.splash {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, .92);
  text-align: center;
}
.splash-inner { max-width: 90%; max-height: 90%; overflow: hidden; }
/* 旧は h4.modal-title 内の .modal_load_title（18px） */
.splash-title { margin: 0 0 .6em; font-size: 18px; font-weight: bold; }
.splash-loading { margin: 0; color: #555; }
.splash-image { margin: .8em 0 0; }
.splash-image img { max-width: 100%; max-height: 60vh; }

.sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); border: 0; }
`;
