# Changelog

このプロジェクトの主な変更を記録します。版数は [Semantic Versioning](https://semver.org/) に従います。

## [Unreleased]

### Changed
- UI の表示を `<maplat-ui>`（Shadow DOM open）に一本化した。旧 API `MaplatUi` は互換層として残り、`createObject`・`waitReady`・公開メソッド 19 本・公開フィールド・`uiHooks` の 7 段階・`ui.core`（Core の `MaplatApp`）の外形は変わらない。ただし互換層は Core の `<maplat-app>` の上だけで動く。旧 UI の DOM の class 名（`.ol-*`・`.swiper-*`・`.modal_*` など）は無くなり、スタイルは `::part()` と CSS 変数で当てる（R4 のスタイリング変更。[移行ガイド](docs/api/migration-ui-shadow-dom.md)）
- 旧 UI の CSS（bootstrap を含む `src/styles/ui.scss`）を入口から読まなくなった。地図（OpenLayers）の CSS は従来どおり入口が読み込む
- `ui.contextMenu`・`ui.baseSwiper`・`ui.overlaySwiper`・`ui.sliderNew`・`ui.i18n` は限定 facade になった。旧 UI が使っていた口（`extend`/`clear`/`on`・`slides`・`get`/`set("slidervalue")`・`language`/`t`/`exists`/`changeLanguage`）は動くが、実物の Swiper・i18next・OL Control ではない
- 設定ファイルの機能系キーは、旧 API の経路（`MaplatUi`）では従来どおり設定ファイルから読む。`noRotate`・`northUp`・`homeMarginPixels`・`controls`・`fakeGps`・`fakeRadius` は Core の互換モード（子の `<maplat-app>` が読む）、`tapDuration`・`tapUIVanish` は互換層が設定ファイルの中身（`appData`）から読んで `<maplat-ui>` の属性へ流す（option で与えたときは option が勝つ）。`<maplat-ui>` を直接使う場合は属性・プロパティで与える
- `ui.addEventListener(type, fn)` に層 A のイベント（`mapChanged`・`clickMarker`・`clickMap`・`lifecycle:*` など。`uiReady` を除く）が `{ type, detail }` の形で届くようになった。旧 `MaplatUi` は自分ではイベントを配っていなかった（`ui.core.addEventListener` は従来どおり）
- `ui.showContextMenu([{icon, text, callback}])` の `text` は、サニタイズを通した HTML として入る（スクリプト・イベント属性は落ちる）。`ui.lastClickPixel` が無いときは、開かない代わりに最後に地図を押した位置（それも無ければ地図の中央）に出る
- 旧 API の型が変わった: `ui.i18n` は i18next の `i18n` から限定 facade（`LegacyI18n`）に、`ui._t` は i18next の `TFunction` から `(key, option?) => string` に、`ui.sliderNew` は OL の Control（`SliderNew`）から `LegacySliderFacade` に、`ui.contextMenu` は ol-contextmenu の fork（`ContextMenu`）から `LegacyContextMenuFacade` に（どちらも旧の呼び手が使う口だけを持つ限定 facade。`instanceof` や OL の Control のメソッドは無い）。`ui._t`・`ui.i18n` への代入は警告して無視する（例外にはしない）。`ui.lang` への代入は `<maplat-ui>` の `lang` 属性へ流れる
- 旧 API のホスト（`<maplat-ui>`）は旧の地図と同じく `position: absolute; top/left/right/bottom: 0` で、いちばん近い位置指定の祖先いっぱいに広がる
- POI のメディア（Chuci）の色は `--maplat-poi-media-theme-color`・`--maplat-poi-media-navigation-color` で変える（Shadow DOM の中なので、Chuci の `--cc-slider-*` をページで指定しても効かない）
- 状態 URL の書き込みは `history.replaceState`（履歴を増やさない）。旧 UI の page.js は `pushState` だった
- `<maplat-ui>` の文字の大きさ・行の高さ・色は、書体と同じくページから継承する（旧 UI と同じ。旧は bootstrap を `.maplat` の下に閉じ込めていたので body の 14px・#333 は当たらず、操作ボタン・スライダーの容器・モーダルの本文はページの文字を継いでいた）。題名（18px・白）・地図切り替えのカード（18px）・モーダルの見出し（18px）・スプラッシュの題名（18px）・共有ボタンと地図情報のキャッシュのボタン（旧 bootstrap の `.btn` の 14px・行の高さ 1.42857）・地図情報の項目名と値の行の高さ（旧 bootstrap の `dt, dd` の 1.42857）など、旧も自分で決めていたものは従来どおり。一本化の途中の版では `:host` で 14px・#333 を決めていたため、文字の大きさを指定したページで旧と見た目がずれていた
- `package.json` に `exports` を足した（`.`・`./element`・`./dist/*`）。`require("@maplat/ui")` は `default` の ES 版（`dist/maplat_ui.es.js`）に解決され、Node 20.19 / 22.12 以降の `require(esm)` とバンドラーで読める。1.1.0 では `main` の `dist/maplat_ui.umd.js` が `"type": "module"` の下で ES モジュールとして読まれ、UMD の包みが `exports` も `require("ol")` も使えずに空の名前空間を返していたが、この問題も解消した。`exports` が付いたので、`src/`・`assets/` の深いパスは Node とバンドラーから読めなくなった（`./dist/*` 経由なら読める）。`dist/maplat_ui.umd.js` の名前と置き場所は変えていない（`<script>` と `main` は従来どおり）

### Added
- `pwaWorker: false`（`null` も同じ）で Service Worker を登録しないようにした。manifest の `<link>` と apple-touch-icon は従来どおり足す。登録済みの Service Worker は解除しない（MaplatEditor#106）
- POI の吹き出しの本文（html・url）の組み立てを `src/element/poi-html.ts` に集約した。`<maplat-ui>` と、実ブラウザで隔離を確かめる probe（`e2e/fixtures/poi-html-probe.ts`）が同じ関数を読む

### Removed
- **旧 UI の実装を削除した**。画面を描く経路は `<maplat-ui>` の 1 つだけになり、旧 API `MaplatUi` は互換層（`src/legacy/`）だけを通る（二重実装の解消）。消したファイル: `src/index.legacy.ts`・`ui_init.ts`・`ui_marker.ts`・`ui_utils.ts`・`maplat_control.ts`・`contextmenu.ts`・`src/contextmenu/`（7 ファイル）・`swiper_ex.ts`・`swiper_loop.ts`・`swiper_augment.d.ts`・`pwa_init.ts`・`pointer_images.ts`・`function.ts`。旧 API の互換層と旧 UI の SCSS（`src/styles/`）は 1.x の間は残す（削除はメジャー版）
- 依存から `swiper`・`@turf/turf`・`bootstrap.native`・`i18next`・`i18next-http-backend`・`page`・`@types/page` を外した。`@c4h/weiwudi` は Service Worker のビルド（`src/service-worker/`）で使うため残す。`pnpm install` で lockfile が更新される
- 旧 UI 本体をなぞる e2e・probe を整理した。`e2e/fixtures/legacy-api-old-impl.html`（旧の実装を読む fixture）と `e2e/element/maplat-ui-legacy-side-by-side.pw.ts`（旧 UI と並べる比較）を削除し、`e2e/element/maplat-ui-baseline-compare.pw.ts` からは「旧 UI の画面をその場で開いて比べる」比較（ボタンのアイコン・タッチ端末の操作ボタンの配置）を外した（基準 JSON に比べる矩形が無いため）。P3（地図が 1 枚のスライダー）は基準 JSON の容器の矩形と比べる形に置き換えた
- 旧 UI の実装を直接 import していた単体テスト 15 ファイル（`ui_utils`・`function`・`swiper_loop`・`swiper_ex`・`contextmenu-*`・`ui_init` の配線・`ui_marker`・`pwa_init` が対象）を削除した。新しい実装に同じ働きがあるもの（`ui_utils`・`contextmenu-*`・`ui_marker`・`pwa_init`・ライセンス欄など）は互換層・`<maplat-ui>` の等価な検証へ移した。旧の Swiper のループの補正（`swiper_loop`・`swiper_ex`）と `ui_init` の配線は、新しい実装に対象が無いので移していない（地図の切り替えは `<maplat-ui>` のスライダーの単体と e2e が確かめる）
- 旧 UI の画面の HTML を文字列で組み立てる関数（`src/poi_safe.ts` の `escapeHtml`・`layerListItemHtml`・`poiListItemHtml`・`swiperThumbUrl`・`swiperSlideHtml`）を削除した（呼び手が無くなった。公開の入口からは出していない）。URL の検査（`safeWebUrl`・`safeImageUrl`）は残す
- 旧 UI の見た目の基準を採るスクリプト `e2e/legacy-baseline-capture.spec.ts` を削除した（旧 UI が無いので採れず、凍結した基準 JSON を新 UI の値で上書きしうるため。基準 JSON は残す）

### Fixed
- 地図切り替えスライダーで、主スレッドが止まって遷移の開始と終わりの通知が遅れたとき（負荷の高い機械での矢印の連打など）に、保険が固定の時間で早く確定して遷移を消し、1 枚分跳んで見えることがあったのを直した。最後の保険は時間ではなく「遷移が実際に進んでいるか」（`getAnimations()` の進み具合）で判断し、進んでいるあいだは残りの時間だけ待ち直す（上限回数つき。待ち続ける経路は無い）
- 地図切り替えスライダーで、読めなかったサムネイルの記録が地図の一覧を入れ替えても残り、一時的に読めなかった画像がページを開き直すまで頭文字のままだったのを直した（一覧の入れ替えで記録を消し、同じ URL でも読み直す）
- `vite.config.js` の入れ子の UMD ビルド（`configFile: false`）に外側と同じ CSS（SCSS）の設定を渡すようにした（`silenceDeprecations` を 1 か所で持つ。ビルドの出力は変わらない）
- 共有（Twitter・Facebook）と POI の `directgo`（`blank`）の `window.open` に `noreferrer` を戻した（`noopener,noreferrer`。1.1.0 と同じ。一本化の途中で `noopener` だけになっていた。SR-NOV26-B-3）
- 旧 API の `ui.xyToMapIDs(xy)` が必ず reject していたのを直した（層 A の `sysCoord2MercAsync` の戻り値の扱いの誤り）。判定は `<maplat-ui>` の `mapsAt` に一本化した
- 旧 API の `ui.showContextMenu` のメニューが、地図の箱が画面の左上に無いページで、ホストの位置のぶん左上へずれていたのを直した
- 旧 API の `ui.sliderNew.get("slidervalue")`・`propertychange` が、利用者がスライダーを動かした値を返さなかったのを直した
- 地図切り替えスワイパーで、地図設定の `mapID`・`thumbnail`・`label` を無害化して表示するようにした（NayutaProducts#28 B-UI-4）。**地図 JSON の `label` に書いた HTML はタグとして解釈されず、文字のまま表示される。** `thumbnail` は http/https・相対 URL・`data:image/` だけを使い、それ以外は「画像なし」の絵になる
- 重なったマーカーのメニューで、POI の `icon` を CSS の文字列へ生のまま入れていたのをやめ、画像の URL として検査してから設定するようにした（#274）
- 開発用デモ（`code4history.dev/Maplat/`）が URL のクエリから受け付けるキーを `appid`・`lang` に限り、値の形を検査するようにした。以前はすべてのキーを設定に入れており、`?poiTemplate=…` で任意のスクリプトが動いた（反射型 XSS・NayutaProducts#28 B-UI-5）。npm の配布物には影響しない

### Security
- PWA の `<link rel="manifest">`・`<link rel="apple-touch-icon">` を HTML 文字列ではなく DOM の組み立てで作るようにした（`pwaManifest` と manifest の `icons` の値が要素として解釈されない）

## [1.1.0] - 2026-10-05

1.1.0-rc.1 と同じ内容の正式版です。版番号と、依存 `@maplat/core`・`@c4h/weiwudi`・`@c4h/chuci` の指定を RC から正式版（`^1.1.0`・`^1.1.0`・`^1.0.1`）へ戻したことだけが違います。変更点は 1.1.0-rc.1 までの各項を参照してください。

## [1.1.0-rc.1] - 2026-09-28

### Changed
- 同梱する `@maplat/core` を 1.1.0-rc.1 へ追随。UMD 版は `@maplat/transform` 1.1 を含むため、三角形内を純アフィンで変換し変換結果が変わる。`@c4h/chuci` 1.0.1-rc.1・`@c4h/weiwudi` 1.1.0-rc.1 へ追随
- 依存関係を更新

### Fixed
- 地図切り替えスワイパーが 2〜4 枚でループしない退行を修正し、カードのクリックでそのカードが中央へ 1 枚分スライドするようにした（#259）
- `#!` 状態の復元後に地図切り替えスワイパーの位置合わせが地図と食い違う件を修正
- POI 一覧の name・icon を無害化し、url・directgo を http/https に限る。重なったマーカーのコンテキストメニューで POI の name を実体参照化する（セキュリティ修正）
- PWA の Service Worker 登録の Promise 拒否を捕捉し、未捕捉 rejection をなくす
