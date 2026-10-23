// <maplat-ui> の Shadow DOM の CSS。見た目は旧 UI（src/styles/maplat-specific.scss の
// .ol-control・.ol-slidernew・.map-title・.modal・マーカー一覧（.list-group-item.layer 等）、
// src/styles/contextmenu.scss の .ol-ctx-menu-container、OpenLayers の ol.css の .ol-control）に寄せた。
//
// 規則（仕様 §4.6-3）: 層 A（<maplat-app>）の中身の DOM・class には CSS を当てない。当てるのは
// スロットに差した要素そのものの箱（::slotted）だけ。
export const MAPLAT_UI_CSS = `
:host {
  display: block;
  position: relative;
  height: 400px;
  overflow: hidden;
  font: 14px/1.42857 "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif;
  color: #333;
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

/* ---- 操作ボタン（旧 .ol-control） ---- */
.ctl {
  position: absolute;
  z-index: 2;
  background-color: rgba(255, 255, 255, .4);
  border-radius: 4px;
  padding: 2px;
}
.ctl button {
  display: block;
  margin: 1px;
  padding: 0;
  height: 2.0625em;
  width: 2.0625em;
  font-size: 1.14em;
  font-weight: bold;
  line-height: 1;
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
/* アイコンは旧 UI の src/icons.ts の SVG（1em 角。旧 "fa-lg" 相当に大きくする） */
.ctl .icon { display: inline-block; font-size: 1.2em; line-height: 1; }
.ctl-zoom { top: .5em; left: .5em; left: calc(.5em + env(safe-area-inset-left)); }
.ctl-zoom button { font-size: 1.4em; font-weight: normal; height: 1.68em; width: 1.68em; }
.ctl-gps { top: 6.2em; left: .5em; left: calc(.5em + env(safe-area-inset-left)); }
.ctl-home { top: 9.2em; left: .5em; left: calc(.5em + env(safe-area-inset-left)); }
.ctl-compass { top: .5em; right: .5em; right: calc(.5em + env(safe-area-inset-right)); }
.ctl-compass .needle { display: inline-block; will-change: transform; }
.ctl-compass .needle svg { transform: rotate(-33deg); }
/* 右下のボタンの列（旧 .ol-copyright・.ol-border・.ol-hide-marker・.ol-marker-list の積み方）。
   下から 地図情報・枠線・マーカーの非表示・マーカー一覧 の順（R4）。列は flex なので、隠れている
   ボタンの分だけ詰めて積まれる（旧 UI と同じく隙間を空けない）。 */
.ctl-column {
  position: absolute;
  z-index: 2;
  right: .5em;
  right: calc(.5em + env(safe-area-inset-right));
  bottom: 2.6em;
  bottom: calc(2.6em + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column-reverse;
  gap: 6px;
}
.ctl-column > .ctl {
  position: relative;
  top: auto;
  right: auto;
  bottom: auto;
  left: auto;
}
/* 共有のボタン（旧 .ol-share: 左下。旧はスワイパーの上、ここはマーカー一覧の列と同じ高さ） */
.ctl-share { left: .5em; left: calc(.5em + env(safe-area-inset-left)); bottom: 2.6em; bottom: calc(2.6em + env(safe-area-inset-bottom)); }
/* ヘルプのボタン（旧 .ol-maplat: 左下。旧は共有のボタンの下） */
.ctl-help { left: .5em; left: calc(.5em + env(safe-area-inset-left)); bottom: .5em; bottom: calc(.5em + env(safe-area-inset-bottom)); }
/* 押されている状態（旧は class の付け替えで表していた） */
.ctl button[aria-pressed="true"] { background-color: rgba(120, 5, 8, .9); }
/* 操作ボタンの自動非表示（旧 .ol-control.fade / .ol-slidercommon.fade） */
.ctl.fade,
.slider.fade { display: none; }
/* タッチ端末ではズームのボタンを隠す（旧 &.ol-touch .ol-zoom { display: none; }） */
.frame.touch .ctl-zoom { display: none; }
/* タッチ端末はズームを隠した分、GPS とホームを上へ詰め、ボタンを指で押せる大きさにする
   （旧 ol-touch: src/styles/maplat-specific.scss の .gps / .home の top と、
   node_modules/ol/ol.css の .ol-touch .ol-control button { font-size: 1.5em }） */
.frame.touch .ctl-gps { top: .5em; }
.frame.touch .ctl-home { top: calc(.5em + 3em); }
.frame.touch .ctl button { font-size: 1.5em; }
/* タッチ端末はボタンが大きくなるので、共有をヘルプの上へずらす（n1。共有とヘルプが重ならない）。
   ボタンの高さ = 2.0625em（.ctl button の height）× 1.5em（タッチの文字の大きさ）= 3.09375em。
   .5em（ヘルプの下端）+ 3.09375em（ボタンの高さ）+ .5em（すき間）。 */
.frame.touch .ctl-share { bottom: 4.09375em; bottom: calc(4.09375em + env(safe-area-inset-bottom)); }

/* ---- 透過度のスライダー（旧 .ol-slidernew） ---- */
.slider {
  position: absolute;
  z-index: 2;
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
}
.slider[disabled] { background: rgba(255, 255, 255, .7); }
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 21px;
  background-color: rgba(120, 5, 8, .5);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.slider::-moz-range-thumb {
  width: 20px;
  height: 21px;
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

/* ---- 地図の題名と切り替えメニュー（旧 .map-title。旧 UI のスワイパーの代わり） ---- */
.map-title {
  position: absolute;
  z-index: 2;
  top: .5em;
  left: 50%;
  transform: translateX(-50%);
  width: 500px;
  max-width: calc(100% - 7.5em);
}
.map-title button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .4em;
  width: 100%;
  min-height: 2.2em;
  padding: .3em .8em;
  border: none;
  border-radius: 4px;
  background-color: rgba(32, 32, 32, .5);
  color: #fff;
  font: inherit;
  font-size: 1.1em;
  cursor: pointer;
}
.map-title .text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.map-title .caret { flex: none; font-size: .8em; opacity: .85; }
.map-title button[aria-expanded="true"] .caret { transform: rotate(180deg); }
.map-menu {
  position: absolute;
  z-index: 3;
  top: 3.3em;
  left: 50%;
  transform: translateX(-50%);
  width: 500px;
  max-width: calc(100% - 1em);
  max-height: calc(100% - 4.5em);
  overflow-y: auto;
  box-sizing: border-box;
  padding: .5em;
  background: rgba(255, 255, 255, .96);
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, .3);
}
.map-menu h3 { margin: .3em .2em .4em; font-size: .9em; color: #555; }
.map-menu ul {
  list-style: none;
  margin: 0 0 .4em;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 6px;
}
.map-menu li button {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 4px;
  background: #f4f4f4;
  color: #222;
  font: inherit;
  font-size: .85em;
  cursor: pointer;
  overflow: hidden;
}
.map-menu li button:hover { border-color: rgba(120, 5, 8, .4); }
.map-menu li button[aria-current="true"] { border-color: rgba(120, 5, 8, .9); background: #fff0f0; }
.map-menu .thumb {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  background: #ddd;
}
.map-menu .thumb.none {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  font-size: 1.6em;
}
.map-menu .label { padding: 3px 4px; line-height: 1.25; text-align: center; overflow-wrap: anywhere; }
/* 範囲を持つ地図の印（枠線と同じ色。旧 UI のスライドの枠と同じ役） */
/* 色の印は枠線の表示中だけ出す（旧 .show-border のスライドの枠。N1） */
.map-menu .swatch { display: none; height: 4px; margin: 0 4px 4px; border-radius: 2px; }
.map-menu.show-border .swatch { display: block; }

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
  --cc-slider-theme-color: #007aff;
  --cc-slider-navigation-color: #007aff;
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
.splash-title { margin: 0 0 .6em; font-size: 1.4em; font-weight: bold; }
.splash-loading { margin: 0; color: #555; }
.splash-image { margin: .8em 0 0; }
.splash-image img { max-width: 100%; max-height: 60vh; }

.sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); border: 0; }
`;
