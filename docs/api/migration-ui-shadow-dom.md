# 旧 UI の DOM からの移行（Shadow DOM 化）

`@maplat/ui` の UI は `<maplat-ui>`（**Shadow DOM open**）に一本化しました。旧 API `MaplatUi` は
互換層として残っており、`new MaplatUi(option)`・`createObject`・`waitReady`・`uiHooks`・`ui.core`
などの外形は変わりません。変わるのは**見た目を当てる場所**です。

- 旧 UI の class 名（`.ol-zoom`・`.swiper-slide`・`.modal_poi`・`.map-title span` など）と、
  `#map_div` の直下に組み立てられていた DOM は**無くなりました**。
- UI の内部は Shadow DOM の中なので、ページの CSS セレクタ（`.modal_poi .title` など）は届きません。
  スタイルは **`::part()`** と **CSS 変数**で当ててください。
- 旧 API の互換層は **Core の `<maplat-app>`（層 A）の上だけで動きます**。Pro など別の層 A 実装との
  組み合わせは対象外です（`<maplat-ui>` 自体は層 A を選びません）。
- 地図（OpenLayers）は `<maplat-ui>` の light DOM の子 `<maplat-app slot="map">` に居ます。子の要素は
  light DOM なので、ページの CSS から `maplat-ui > maplat-app` で当てられます（`::slotted()` は
  Shadow DOM の中の書き方で、ページの CSS には使いません。内部は層 A の DOM です）。

## 対応表（旧 DOM / class → `::part` / 属性）

`part` 名は `src/element/maplat-ui.ts`・`src/element/slider.ts` が正本です（ここは主なものだけ）。

| 旧（DOM / class） | 新（`::part` / 属性） | 備考 |
| --- | --- | --- |
| `.maplat`（`#map_div` 全体） | `maplat-ui::part(frame)` | 枠。位置は `:host` が基準 |
| `.map-title` / `.map-title span` | `::part(map-title)` | 内部の `.text` に part は無い（文字だけ変えるなら `map-title` の `color`・`font`） |
| `.ol-zoom` / `.ol-zoom-in` / `.ol-zoom-out` | `::part(zoom)` / `::part(zoom-in)` / `::part(zoom-out)` | |
| `.home` | `::part(home)` | |
| `.ol-compass`（コンパス） | `::part(compass)` | |
| `.gps` | `::part(gps)` | |
| 地図情報のボタン | `::part(info)` | |
| `.border`（枠線のボタン） | `::part(border)` | 地図の上の範囲の線の色は地図ごとに要素が決める（CSS 変数では変えられない） |
| `.hide_marker` | `::part(hide-marker)` | |
| マーカー一覧のボタン / 画面 | `::part(marker-list)` / `::part(marker-list-modal)` | 一覧の行は `::part(marker-list-layer)`・`::part(marker-list-poi)` |
| 共有のボタン / 画面 | `::part(share)` / `::part(share-modal)` | `::part(share-button)` は画面の中の SNS・コピーのボタン。QR は `::part(share-qr-app)`・`::part(share-qr-view)`（QR の SVG 自体は `::part(qr-code)`） |
| `.ol-slidernew input`（透過度） | `::part(slider)` | `<input type="range">` |
| `.base-swiper` / `.overlay-swiper` | `::part(map-slider)` | カードは `::part(map-slide)`（選択中は `map-slide map-slide-selected`）。前後のボタンは `::part(map-slider-prev)` / `::part(map-slider-next)` |
| `.swiper-slide` | `::part(map-slide)` | Swiper の DOM ではない（カードはボタン） |
| `.ol-ctx-menu-container`（右クリックメニュー） | `::part(poi-menu)` | 項目は `::part(poi-menu-item)`。重なった POI の選択も同じ部品 |
| `.modal_poi` など `.modalBase` | `::part(poi-modal)`・`::part(share-modal)`・`::part(help-modal)`・`::part(map-info-modal)`・`::part(marker-list-modal)`・`::part(gps-modal)`・`::part(splash)` | 旧は 1 つのモーダルの class を付け替えていた |
| `.modal_poi .title` | `::part(poi-title)` | ほかに `share-title`・`help-title`・`map-info-title`・`marker-list-title`・`gps-title` |
| `.modal_poi .body` | `::part(poi-body)` | |
| POI のメディア（Quyuan のスライダー `qy-swiper`。中身は Chuci） | `::part(poi-media)` / `::part(poi-swiper)` | |
| POI の `html` / `url` の本文 | `::part(poi-html)` / `::part(poi-iframe)` | `html` の本文は `poi-html`、`url` の本文は iframe の `poi-iframe` |
| `.custom-toast` | `::part(toast)` | |
| 地図情報のメタデータ | `::part(map-meta)` | 行は `part="map-meta-<キー>"` |
| キャッシュの欄 | `::part(map-cache)`・`::part(cache-heading)`・`::part(cache-size)`・`::part(cache-fetch)`・`::part(cache-delete)` | |

## CSS 変数

| 変数 | 効く場所 |
| --- | --- |
| `--maplat-poi-media-theme-color` / `--maplat-poi-media-navigation-color` | POI のメディア（Quyuan のスライダー `qy-swiper`）の色。中で Chuci の `--cc-slider-theme-color` / `--cc-slider-navigation-color` に渡す（既定 `#007aff`）。Chuci の変数を直接ページで指定しても、Shadow DOM の中の指定が勝つので効かない |
| `--maplat-envelope-color` | 枠線の表示中の、範囲を持つ地図のカード（`::part(map-slide)`）の点線の**既定色**だけ。地図ごとの色（要素が割り当てる 25 色）があればそちらが勝つので、ふつうは見えない（範囲を持つカードには必ず付くので、今の版ではページで指定した値は見えない）。`::part(border)` のボタンにも、地図の上の範囲の線にも効かない |
| `--maplat-ui-control-gap` | 操作ボタンの列（左上・左下・右下）の、隣り合うボタンの間隔。既定は `7px`。タッチ端末も同じ値を使う。`<maplat-ui>` に指定する |

## 例

```css
/* 操作ボタンの見た目 */
maplat-ui::part(zoom),
maplat-ui::part(home),
maplat-ui::part(gps) {
  background: rgba(0, 0, 0, 0.75);
}

/* 地図の題名 */
maplat-ui::part(map-title) {
  font-family: "Clarendon", serif;
  color: #402;
}

/* POI のメディア（Quyuan のスライダー）の色 */
maplat-ui {
  --maplat-poi-media-theme-color: #a00;
  --maplat-poi-media-navigation-color: #a00;
}

/* 地図の切り替えのカード */
maplat-ui::part(map-slide-selected) {
  outline: 2px solid #a00;
}
```

## 旧 API（`MaplatUi`）を使い続ける場合

- `new MaplatUi(option)`・`MaplatUi.createObject(option)`・`waitReady`・`ui.core`（Core の
  `MaplatApp`）・`uiHooks` の 7 段階はそのままです。地図の大きさは、旧と同じくページの CSS で決めてください。
  `<maplat-ui>` のホストは旧の地図と同じく `position: absolute; top/left/right/bottom: 0` で、
  **いちばん近い位置指定の祖先いっぱい**に広がります（`#map_div` 自体の高さが 0 でもよいのは旧と同じ）。
- `ui.contextMenu` は限定 facade です。`extend`・`clear`・`on("open"/"close")` は動きますが、
  `contextMenu.container` は旧の class 名（`.ol-ctx-menu-container`）を持ちません。
- `ui.baseSwiper`・`ui.overlaySwiper` は限定 facade です。`slides` は旧と同じ形の**見かけの配列**で、
  実物の DOM（Swiper の `.swiper-slide`）ではありません。
- `ui.i18n` は限定 facade（`language`・`t`・`exists`・`changeLanguage`）です。i18next の
  `addResourceBundle` などは警告して無視します。
- `ui.sliderNew` は透過度の facade です。`set("slidervalue", 0..1)` は `<maplat-ui>` の `transparency` 属性
  （0 が不透明・100 が透明）を書き、`get("slidervalue")` と `on("propertychange")` は利用者の操作も含めた
  今の値（子の `<maplat-app>` が書き戻す `transparency`）を返します。`setEnable` は `<maplat-ui>` へ委譲します。
- `ui.addEventListener(type, fn)` に、層 A のイベント（`mapChanged`・`clickMarker`・`clickMap`・
  `lifecycle:*` など）が `{ type, detail }` の形で届くようになりました（旧 `MaplatUi` は配っていませんでした。
  `ui.core.addEventListener` も従来どおり使えます）。
- `ui.showContextMenu([{icon, text, callback}])` の `text` は、サニタイズを通した HTML として入ります
  （スクリプト・イベント属性は落ちます）。`ui.lastClickPixel` が無いときは、旧のように開かないのではなく
  最後に地図を押した位置（それも無ければ地図の中央）に出ます。
- **型の変化**（旧の実装を消したので、型は互換層が自前で定義しています）:
  - `ui.i18n` は i18next のインスタンス（型 `i18n`）ではなく限定 facade（型 `LegacyI18n`）、
    `ui._t` は i18next の `TFunction` ではなく `(key, option?) => string` です。`ui._t = …`・`ui.i18n = …` の
    代入は警告して無視します（例外にはしません）。`ui.lang = "en"` は `<maplat-ui>` の `lang` 属性へ流れ、
    表示の言語が切り替わります（**起動前**の `ui.lang = …` は起動するまでの読み値だけで、起動後の言語は
    要素が決めます。旧も起動時に言語を決め直していたので振る舞いは同じです）。
  - `ui.sliderNew` の型は `LegacySliderFacade` です（`element`・`get`・`set`・`setValue`・`setEnable`・
    `on`/`off`/`un("propertychange")`。ほかに互換層だけが使う `attach`・`detach`）。旧は OL の Control
    （`SliderNew`）でしたが、いまは限定 facade なので `instanceof` や OL の Control のメソッド
    （`setMap`・`getMap` など）はありません。
  - `ui.contextMenu` の型は `LegacyContextMenuFacade` です。旧は ol-contextmenu の fork（`ContextMenu`）でした。
    facade が持つ口は `container`・`Internal`（`openMenu`・`closeMenu`・`opened`）・`extend`・`clear`・
    `push`・`pop`・`shift`・`countItems`・`isOpen`・`close`・`updatePosition`・`on`/`un`/`off`
    （ほかに互換層だけが使う `attach`・`detach`）だけです。ふつうのオブジェクトなので、これ以外の名前
    （旧の `getDefaultItems` など）は警告なしに `undefined` で、呼ぶと `TypeError` になります。
  - `ui.baseSwiper`・`ui.overlaySwiper` の型は `SwiperInstance`（= `LegacySwiper`）です。`slides` の
    1 枚は本物の DOM 要素ではなく、`dataset.swiperSlideIndex` と `classList.contains("selected")` を
    持つ**見かけの**オブジェクトです（`el`・`slides`・`activeIndex`・`slideTo` などは動きます）。
- 旧 UI の CSS（`src/styles/ui.scss` の bootstrap・`ol/ol.css` の UI 部分）は同梱されなくなりました。
  地図（OpenLayers）の CSS は従来どおり入口（`@maplat/ui`）が読み込みます。
  `src/styles/*.scss`（`maplat-specific.scss`・`ui.scss`・`contextmenu.scss`）はリポジトリに残していますが、
  これは**旧 API の後方互換のためだけ**のもので、`<maplat-ui>` の見た目には効きません（新 UI は Shadow DOM
  の中に自分の CSS を持ちます）。配布物の `dist/maplat_ui.css` はもう OpenLayers の CSS だけ（約 5 KB。以前は
  旧 UI の CSS を含めて約 494 KB）で、旧の SCSS が利用者に届くのは、パッケージに同梱される原稿
  （`files` の `src/`）としてだけです。削除はメジャー版で行います。
- **旧 UI の実装そのものは消しました**（`src/ui_init.ts`・`ui_marker.ts`・`ui_utils.ts`・
  `maplat_control.ts`・`contextmenu/`・`swiper_*`・`pwa_init.ts`・`pointer_images.ts`・`function.ts`・
  `index.legacy.ts`）。同じ画面を描く経路は `<maplat-ui>` の 1 つだけで、旧 API はその上の互換層です。
  依存からも `swiper`・`@turf/turf`・`bootstrap.native`・`i18next`・`i18next-http-backend`・`page` を外しました
  （`@c4h/weiwudi` は Service Worker のビルドで使うので残しています）。

## 参考

- [`<maplat-ui>` 要素の API](maplat-ui-element.ja.md)
- [旧 `MaplatUi` クラス](maplat-ui.ja.md)
- ライフサイクル: [`docs/ui-core-lifecycle.ja.md`](../ui-core-lifecycle.ja.md)
- `part` 名の正本: `src/element/maplat-ui.ts`・`src/element/slider.ts`
