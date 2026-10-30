# `<maplat-ui>` 要素 API シグネチャ

> `@maplat/ui` の Custom Element `<maplat-ui>` のリリース依存シグネチャ。
> 対象リリースは [README](../../README.ja.md#クイックスタート) のリリースブロックに
> 記載しています。
> 旧 `MaplatUi` クラスは [`maplat-ui.ja.md`](maplat-ui.ja.md) を参照してください。
> `::part()` の名前と CSS 変数は
> [移行ガイド](migration-ui-shadow-dom.md) を参照してください。
> 概念解説は [Wiki API-Reference](https://github.com/code4history/Maplat/wiki/API-Reference) を参照してください。

`<maplat-ui>` は Maplat のビューア（「層 B」）の要素の形です。ビューア（地図の題名・
2 本の地図の切り替えスライダー・操作ボタン・POI の吹き出し・各画面・知らせ）を、
`<maplat-app>` 要素（「層 A」＝地図そのもの）の上に重ね、その要素の**公開面だけ**を
使います。そのため `<maplat-app>` のどちらの実装の上でも動きます: MaplatCore
（`@maplat/core/element`、`implementation: "core"`）と、有償の MaplatCore-Pro
（`implementation: "core-pro"`）です。どちらと組むかは、ページが何を import するかで
決まります。

旧 `MaplatUi` クラスは 1.x の間も、この要素の上の互換層として使えます。
[`MaplatUi` クラスとの関係](#maplatui-クラスとの関係) を参照してください。

## 使い方

```typescript
import 'ol/ol.css';               // 必須: OpenLayers CSS（MaplatCore の場合）
import '@maplat/core/element';    // 層 A: <maplat-app> を登録する（Core。Core-Pro ならその入口）
import '@maplat/ui/element';      // 層 B: <maplat-ui> を登録する（副作用 import）
```

```html
<!-- 最小。設定ファイル apps/morioka.json を読み、子の <maplat-app> は要素が作る -->
<maplat-ui app-id="morioka" lang="en" enable-share enable-border></maplat-ui>

<script type="module">
  const ui = document.querySelector('maplat-ui');
  ui.poiTemplate = '<h3>{{ name }}</h3>';       // プロパティのみのキー。子へ渡る
  await ui.ready;
  ui.addEventListener('mapChanged', (e) => console.log(e.detail.mapID)); // 層 A のイベントが泡立って届く
  console.log(ui.app.currentMapId, ui.currentLang);
</script>
```

```html
<!-- 子の <maplat-app> を自分で置く場合（slot="map" が要る） -->
<maplat-ui lang="ja" enable-share state-url>
  <maplat-app slot="map" app-id="morioka" map-id="morioka_ndl" transparency="30" north-up="false"></maplat-app>
</maplat-ui>
```

- `@maplat/ui/element` は ES モジュールの入口（`dist/element/index.js`）で、要素の
  UMD ビルドはありません。`@maplat/core/common`（と、POI のメディアの
  `@c4h/chuci`・共有の QR の `qrcode` を遅延 import）を import するので、
  バンドラーか import map が必要です。層 A の実装は import **しません**: ページが
  `@maplat/core/element`（か Core-Pro の入口）を自分で import します。要素は
  OpenLayers を使いません。`ol/ol.css` と `ol`・`mapbox-gl`・`maplibre-gl` の peer
  dependency は層 A の実装のものです（パッケージは旧クラスの入口のぶんも宣言しています）。
- 要素は自分の部品を **Shadow DOM（`mode: "open"`）** に描きます。地図は light DOM の
  子 `<maplat-app slot="map">` です: その子があれば使い、無ければ要素が自分の light DOM の
  子として作ります（ページの CSS と、子に書いた層 A のキーがそのまま効くように）。
  `slot="map"` の無い `<maplat-app>` の子は使わず、要素がもう 1 つ
  `<maplat-app slot="map">` を作ります（**地図が 2 つになります**）。自分で置く子には
  必ず `slot="map"` を付けてください。子を探すのは**要素が文書に繋がったときだけ**で、
  あとから子が変わっても見ません。子を替えるときは、要素を外して子を差し替え、付け直して
  ください。HTML の解析中に繋がったときは、子を探す前に `DOMContentLoaded` を待ちます。
  要素は子の中身に手を入れません。
- 要素はビューアの箱です。既定のスタイル（Shadow DOM の中）:
  `:host { display: block; position: relative; height: 400px; overflow: hidden }` と
  `:host([hidden]) { display: none }`。書体・文字の大きさ・色は**ページから継承**します
  （要素はどれも決めません。操作ボタンの大きさもページの文字の大きさに従います）。子の
  `<maplat-app>` は箱いっぱいに広げます（`position: absolute; inset: 0;
  width: 100%; height: 100%` に `!important`）。地図の大きさは `<maplat-ui>` の
  大きさで決めてください。
- `ready` は、子の `ready` の後、言語ファイルを読み終え、部品（地図の一覧・題名・
  ボタン）が揃ったときに解決します。それより前は、状態の 3 つのメソッド
  （`setShowBorder`・`setHideMarker`・`openMarker`）は何もせず、`mapsAt` は `[]` に
  解決し、ほかの 4 つのメソッドは動きます。プロパティへの代入はいつでも受け付けます。
- 要素を文書から外すと子から切り離します（子も文書から外れるので地図を破棄します）。
  同じタスクの中での移動では切り離しません。`el.remove()` は標準の
  `HTMLElement.remove()` です。付け直すと子を繋ぎ直し、新しい `ready` の Promise を
  返します。
- 別の実装が既に `<maplat-ui>` を登録していれば、この import は上書きせず警告します
  （`<maplat-ui> is already defined by another implementation; …`）。1 文書に載る層 B の
  実装は 1 つです。
- TypeScript: `import type { MaplatUiElement } from '@maplat/ui/element'` が要素の
  クラスです（下の全キー）。`@maplat/core/common` も `MaplatUiElement` の interface を
  export していますが、あちらは層 B の面だけです（層 A のキーと `compassAction` は
  ありません）。`HTMLElementTagNameMap` は拡張していないので、
  `document.querySelector('maplat-ui') as MaplatUiElement` と書いてください。
- `MaplatUiElement` は**値**（クラスそのもの）としても export しています。`instanceof` や
  `customElements.get("maplat-ui") === MaplatUiElement` に使えます。
- `@maplat/ui/element` からはほかに `MAPLAT_UI_VERSION`（パッケージの版）、
  `defineMaplatUi(tagName = "maplat-ui"): boolean`（タグ名を指定して登録する。既定のタグは
  import が登録済みなので、別の名前で呼びます。使うのは別の層 B の実装が既定のタグを持って
  いるときです。import の後に同じコンストラクタを別名で登録すると `NotSupportedError` に
  なります）、型 `CompassAction`・`MaplatMenuItem`・`MaplatMenuOptions` を export します。

## 属性とプロパティ

属性にはそれぞれ camelCase のプロパティがあり、**同じ 1 つの値**を読み書きします。
属性の値の解釈は `<maplat-app>` とまったく同じです
（[`maplat-app.ja.md`](https://github.com/code4history/MaplatCore/blob/master/docs/api/maplat-app.ja.md#属性の値の解釈)
を参照）: 真偽属性は有無でなく**値**で解釈し（`""`・`"true"`・属性名と同じ値＝`true`、
`"false"`＝`false`、属性なし＝未指定）、数は `Number()`、`""` は未指定、プロパティに
`null` を代入すると属性を外します。`pwa-manifest` だけは真偽と文字列の両方を取るキーで、
`""`・`"true"`・属性名と同じ値＝`true`、`"false"`＝`false`、それ以外は URL です。

要素のキーは 2 つの組に分かれます: 要素自身のキー（層 B）と、子へ流す層 A のキーです。

### 層 B のキー（属性と同期）

| 属性 | プロパティ | 型 | 既定値 | 起動時 | 起動後に変えたら |
|---|---|---|---|---|---|
| `lang` | `lang`（HTML のグローバルなプロパティ） | string | 解決した値（[言語](#言語) を参照） | いいえ | 言語ファイルを読んで文言を描き直す（非同期。`currentLang` はすぐ変わる） |
| `enable-share` | `enableShare` | boolean | `false` | いいえ | 共有のボタン・ヘルプの共有の行・POI の吹き出しの QR を出し入れする。偽にすると共有の画面も閉じる |
| `enable-border` | `enableBorder` | boolean | `false` | いいえ | 枠線のボタンを出し入れする（子が `supports("envelopes")` のときだけ）。偽にすると描いた枠線も消す（`setShowBorder(false)`） |
| `enable-hide-marker` | `enableHideMarker` | boolean | `false` | いいえ | マーカー非表示のボタンを出し入れする |
| `enable-marker-list` | `enableMarkerList` | boolean | `false` | いいえ | マーカー一覧のボタンを出し入れする（地図に POI がある間だけ出す）。偽にすると一覧も閉じる |
| `enable-poi-html-no-scroll` | `enablePoiHtmlNoScroll` | boolean | `false` | いいえ | 次に開く POI から、`html`・`url` の本文に内部のスクロールを持たせない |
| `presentation-mode` | `presentationMode` | boolean | `false` | いいえ | `true` は `outOfMap` と、`always-gps-on` の GPS ボタンで出すトーストを止める（`gps_out` の結果のトーストと、GPS のエラーの画面は止めない） |
| `compass-action` | `compassAction` | `"auto"` \| `"north"` \| `"rotation"` | `"auto"` | いいえ | コンパスのボタンを押したときの動き: `north`＝`resetDirection()`（北を上に）、`rotation`＝`resetRotation()`（画面の回転を 0 に）、`auto`＝子の `north-up` が `true` なら `north`、そうでなければ `rotation`。ほかの値は 1 回警告して `auto` として扱う |
| `tap-duration` | `tapDuration` | number（ms） | `3000`（`0` も有効） | いいえ | 次の操作ボタンの自動非表示から |
| `tap-ui-vanish` | `tapUiVanish` | boolean | `false` | いいえ | 地図のドラッグ中は、このキーに関係なく操作ボタンを常に隠し、地図が止まってから `tap-duration` の後に戻す。このキーが決めるのは地図の**タップ**で隠すかどうかだけ: `true` ならタップでも隠れる（`tap-duration` の後か、隠れている間の次のタップで戻る） |
| `set-document-title` | `setDocumentTitle` | boolean | `true` | いいえ | `document.title` を設定ファイルの `appName`（今の言語）にするかどうか |
| `state-url` | `stateUrl` | boolean | `false` | **はい** | —（`location.hash` の状態を読み書きする。[状態 URL](#状態-url) を参照） |
| `pwa-manifest` | `pwaManifest` | boolean または string | 未指定（PWA は無効） | **はい** | —（`true`＝`./pwa/${appId}_manifest.json`、文字列＝manifest の URL） |
| `pwa-worker` | `pwaWorker` | string | `./service-worker.js` | **はい** | — |
| `pwa-scope` | `pwaScope` | string | `./` | **はい** | — |
| `app-envelope` | `appEnvelope` | boolean | `false` | **はい** | —（開発用。範囲を持つ全地図の包囲矩形を 1 回だけ console に出す。`This app's envelope is: …`） |

`enable-*`・`presentation-mode` のキーは、旧 UI だけが使っていた `appOption` のキー
です。`tap-duration`・`tap-ui-vanish` は旧の層 A（Core）の機能系のキーです
（`tapUIVanish` は `tap-ui-vanish` になりました）。`set-document-title` と
`compass-action` は要素で新しく足したキーです（`compass-action` は契約の層 B のキーの
表には無く、コンパスがどちらのメソッドを呼ぶかをこの実装が決めています）。

### 層 B のキー（プロパティのみ）

| プロパティ | 型 | 起動時 | 備考 |
|---|---|---|---|
| `restore` | `Restore` ＋ `showBorder?: boolean`・`openedMarker?: string` | はい | `Restore` の層 A のキー（`mapID`・`backgroundID`・`position`・`transparency`・`hideMarker`・`hideLayer`）は子へ渡します。`showBorder` と `openedMarker` は要素が起動時に当てます（`restore-session` で `restore` が無いときは、保存された `showBorder`・`hideMarker` を使います）。起動後に拡張キーを代入すると 1 回警告して無視します（`… are read only at startup; the change was ignored (use setShowBorder() / openMarker()).`）。層 A のぶんはそのまま渡り、子自身の規則に従います。`state-url` のときは、URL の状態が `restore` を**丸ごと置き換えます** |
| `appOption` | object | はい | 移行用の口: 旧オプションのオブジェクトを丸ごと。子の `appOption`（層 A のキー）へ**そのまま**渡します。要素自身が読むのは `lang`（言語の解決）と `appid`・`appId`（`pwa-manifest` の既定のパス）だけです。中の UI のキー（`enableShare`・`tapDuration` など）は**効きません**。属性で与えてください。次のメジャー版で閉じます |

### 子へ流す層 A のキー

`<maplat-app>` の全キーを `<maplat-ui>` に書けます。要素はそれを子へ渡します。属性と
同期するキー（18 個）: `app-id`・`app-src`・`map-id`・`transparency`・`no-rotate`・
`north-up`・`home-margin-pixels`・`always-gps-on`・`fake`・`enable-cache`・
`restore-session`・`overlay`・`debug`・`icon`・`selected-icon`・`no-center-marker`・
`center-marker-src` と、Pro 専用の `display-mode`。プロパティのみのキー（12 個）:
`setting`・`restore`・`restoreExtensionKeys`・`googleApiKey`・`mapboxToken`・
`maplibregl`・`mapboxgl`・`uiHooks`・`appOption`・`poiTemplate`・`poiStyle`・
`iconTemplate`。意味・既定値・起動時の規則は
[`maplat-app.ja.md`](https://github.com/code4history/MaplatCore/blob/master/docs/api/maplat-app.ja.md#属性とプロパティ)
のとおりです。

流し方の規則:

- **近い方が勝つ。** 子が自分で持つキーには層 B は触れません。子が持たないキーだけを
  流します。「子が持つか」は、属性と同期するキーは子の**属性**で、プロパティのみのキーは
  子の**プロパティ**（`undefined` でない）で判定します。状態のキー（`map-id`・
  `transparency`・`display-mode`）は子が自分の属性へ書き戻すので、「子が持つか」は最初に
  繋いだ時点で決めます。
- 属性で表せるキーは**属性**で、プロパティのみのキーは**プロパティ**で渡します（子の
  「プロパティ ＞ 属性」の優先順位を崩さないため）。
- 層 B が流したキーは覚えます: あとで `<maplat-ui>` 側の値を変えると新しい値を流し
  直し、外す（または `null` を代入する）と子からも外します。
- **書き戻しの反映。** 子が状態のキーを書き戻したとき（`map-id` は地図が替わるたび、
  `transparency` は描画 1 回につき 1 回、`display-mode` は Core-Pro）、層 B がそのキーを
  流していて**かつ `<maplat-ui>` 自身がその属性を持っている**ときだけ、要素は新しい値を
  自分の属性へ写します（`ui.mapId` が今の値のままになるように）。`<maplat-ui>` に書かれて
  いない状態のキーは写しません（要素は属性を足しません）。子が自分で持つキーも写しません
  — `ui.app` から読んでください。
- 層 A の起動時だけ効くキーは**子**が固定します: 起動後に `<maplat-ui>` に書くと値は
  渡り、子が 1 回警告して無視し、`ui.app.appId` は起動時の値のままです。
- 子へ渡す `restoreExtensionKeys` にはいつも `"showBorder"` が入ります（`restore-session`
  が枠線の状態を `localStorage` から戻せるように）。
- 流したキーは、流した相手の子に結び付きます。子を探すのは要素が繋がったときだけです
  （[使い方](#使い方) を参照）。要素を付け直して別の子に繋いだときは、その子へ流します。

設定ファイルを読むのは**子の 1 回だけ**です。要素は子の `appData` から `appName`
（題名と文書の題名）・`lang`（言語）・`splash`（`img/` の下のスプラッシュ画像）を
読みます。設定ファイルの機能系（プレゼンテーション）のキー — `tapDuration`・
`tapUIVanish`・`controls`・`noRotate`・`northUp`・`homeMarginPixels` など — は
**読みません**。`<maplat-ui>` か子の属性・プロパティで与えてください。設定ファイルに
そうしたキーが残っていると、子（MaplatCore）がキーごとに 1 回、機能系の設定として
無視する旨の警告を出します。設定ファイルから読み続けるのは旧クラスの経路だけで、
廃止の警告が出ます。

### 要素の起動時だけ効くキー

要素が起動時に固定するのは 5 つのキーです: `stateUrl`・`pwaManifest`・`pwaWorker`・
`pwaScope`・`appEnvelope`。要素が起動した（最初に繋がった）後でこれらを変えると
（属性でもプロパティでも）**警告して無視**します。警告はキーごとに 1 回です:

```
<maplat-ui>: attribute "state-url" is fixed at startup and cannot be changed after the UI has started; the change was ignored.
```

プロパティは起動時の値を返し続けます。登録した Service Worker は取り消しません。
変えたいときは要素を置き直してください。

`restore` の層 B の拡張キー（`showBorder`・`openedMarker`）も起動時にだけ読み、起動後に
代入すると同じように警告します。`appOption` を固定するのは子で、警告も子が出します。

## 操作ボタンと画面

要素が何をいつ出すか。各項目は `::part()` です（名前は括弧の中）。主な部品は
[移行ガイド](migration-ui-shadow-dom.md) にあります。

| 項目 | 出す条件 | すること |
|---|---|---|
| 地図の題名（`map-title`） | `ready` の後 | 今の地図の `officialTitle`・`title`・`label` を今の言語で |
| 地図の切り替えスライダー（`map-slider` の `data-kind="base"`・`"overlay"`、`map-slide` など） | `ready` の後に中身が入る | 左: 背景の地図、右: 古地図・重ねる地図（`listMaps()` の順）。カードを選ぶと `changeMap()`。今の地図は `map-slide-selected`。`overlay="false"` でもスライダーは隠れない |
| ズーム（`zoom`・`zoom-in`・`zoom-out`） | 常時。タッチ端末では隠す | `zoomBy(±1)` |
| ホーム（`home`） | 常時 | `goHome()` |
| コンパス（`compass`） | 常時 | `compass-action` に従い `resetDirection()` か `resetRotation()`。針は実世界の方位を指す。押しても変わらない状態では薄く出す |
| GPS（`gps`） | 常時 | `handleGPS()`（切り替え。`always-gps-on` なら常に開始）。GPS が切れている間は薄く出す |
| 透過度のスライダー（`slider`） | `ready` の後、子の `overlay` が `false` のとき以外。背景の地図の表示中は使えない | `setTransparency()`（スライダーの値 100 が不透明） |
| 地図情報（`info`）＋画面（`map-info-modal`） | ボタンは `ready` の後 | メタデータ（`map-meta`）・ライセンスと、3 つがそろったときのタイルキャッシュの欄（`map-cache`）: 子が `supports("tile-cache")`・子の `enable-cache` が真・今の地図で `getMapCacheEnable()` が真 |
| 枠線（`border`） | `ready` の後、`enable-border` かつ `supports("envelopes")` | `setShowBorder()`。`setEnvelopes()` で各地図の範囲を描く（`listMaps()` の順に 25 色） |
| マーカー非表示（`hide-marker`） | `ready` の後、`enable-hide-marker` | `setHideMarker()` |
| マーカー一覧（`marker-list`）＋画面（`marker-list-modal`） | `enable-marker-list` かつ地図に POI がある | POI のレイヤー（`marker-list-layer`）と POI（`marker-list-poi`）を並べる。レイヤーの切り替えは `showPoiLayer`・`hidePoiLayer`、POI の行は吹き出しを開く |
| 共有（`share`）＋画面（`share-modal`） | `ready` の後、`enable-share` | [共有](#共有) を参照 |
| ヘルプ（`help`）＋画面（`help-modal`） | 常時（ボタンは最初から出るが、画面が開くのは `ready` の後） | ヘルプの本文。共有・枠線・マーカー非表示・マーカー一覧の行は、対応する `enable-*` のときに出す |
| POI の吹き出し（`poi-modal`・`poi-title`・`poi-body`・`poi-media`） | POI が 1 件の `clickMarker`・`clickMarkers`、`openMarker()`、一覧 | 名前・メディア（Chuci のスワイパー）・住所・説明、または POI の `html`・`url`。`directgo` の POI は遷移する。地図のマーカーを選ぶ |
| POI のメニュー（`poi-menu`・`poi-menu-item`） | POI が複数の `clickMarkers` | 重なった POI から 1 つ選ぶ |
| GPS のエラーの画面（`gps-modal`） | GPS のエラー（拒否・未取得・タイムアウト） | 題名と本文 |
| スプラッシュ（`splash`） | 起動時、地図を復元しないとき（`initialRestore.mapID` が空）だけ | `appName` と `splash` の画像。地図の準備ができたら 200 ms（画像ありは 1000 ms）で隠す |
| 知らせ（`toast`） | `showToast()` と共有の URL を写した後 | 1.5 秒。画面の下の中央（コピーの知らせはボタンの近く） |
| 範囲外の知らせ（`toast`） | `outOfMap`（`presentation-mode` のとき以外）、`gps_out` の結果、`always-gps-on` で範囲外のときの GPS ボタン（`presentation-mode` のとき以外） | 3 秒。`<maplat-ui>` の下端の中央。開いている画面は閉じず、フォーカスも動かさない。文は実際の動きを表す（標準位置に戻る・GPS を切る・範囲外であることだけ） |

操作ボタン・透過度のスライダー・題名・地図の切り替えスライダーは、自動非表示の対象です:
地図のドラッグ中は常に隠れ、`tap-ui-vanish` のときは地図のタップでも隠れます。地図が
止まってから `tap-duration` の後に戻ります。

## 状態（読み取り専用プロパティ）

- `ready: Promise<void>`
  - ビューアの準備ができたときに解決します（[使い方](#使い方) を参照）。子の `ready` が
    reject すると reject します。要素を付け直すと（そのとき子を探し直します）、新しい
    Promise になります。
- `implementation: "ui" | "ui-pro"`
  - 実装の名前（このパッケージは `"ui"`）。
- `version: string`
  - 実装の版（`@maplat/ui` の版。`MAPLAT_UI_VERSION`）。
- `app: MaplatAppElement | null`
  - 使っている子の `<maplat-app>`（公開面だけ）。子を見つける・作る前は `null`。
- `currentLang: string`
  - 解決した言語（[言語](#言語) を参照）。

## メソッド（`MAPLAT_UI_METHODS`）

公開メソッドは 8 つです。`ready` より前は、`setShowBorder`・`setHideMarker`・
`openMarker` は何もせず、`mapsAt` は `[]` に解決し、`translateText`・`t`・
`getShareUrl`・`showToast` は動きます。

- `translateText(fragment?: Localized): string | undefined`
  - 多言語の文字列（`"text"` または `{ ja: "…", en: "…" }`）から `currentLang` の値を
    選びます: 今の言語 → `en` → 最初の空でない言語。`null`・`undefined` は `undefined`。
    （旧 `MaplatUi.translate`。`HTMLElement.translate` と衝突しないよう改名しました。）
- `t(key: string, option?: object): string`
  - UI の文言をキー（`"control.zoom_in"`・`"html.share_title"` など）で、今の言語で
    返します。`option` で `{{name}}` を差し込みます。知らないキーはキーをそのまま返し
    ます。言語ファイルを読み終えるまでは、内蔵の辞書（`ja`・`en`）が答えます。
- `setShowBorder(flag: boolean): void`
  - 地図の範囲の表示を切り替えます（子の `setEnvelopes()`。`supports("envelopes")` の
    無い子では何も描きません）。状態には拡張キー `showBorder` として載ります
    （`updateState`・`restore-session`・状態 URL の `sb:` に乗ります）。
- `setHideMarker(flag: boolean): void`
  - 子の `hideAllMarkers()`・`showAllMarkers()` を呼びます（子の状態の `hideMarker` が
    真実で、状態 URL の `hm:` もそれに従います）。
- `openMarker(id: string): void`
  - マーカー `id` の POI の吹き出しを開きます（子の `getMarker(id)`）。知らない id では
    何もしません。（旧 `handleMarkerActionById`。）
- `mapsAt(point: LngLat, threshold = 10): Promise<string[]>`
  - `point`（`{ longitude, latitude }`）を含む範囲を持つ地図の mapID を、範囲の狭い順に
    返します。今の地図は外し、範囲の面積が画面の面積の `threshold` 倍以上ある地図も
    外します（画面の 4 隅を経緯度に直せないときは空）。子の `getViewExtent()` と
    `getMapEnvelope()` から求めます。（旧 `xyToMapIDs(xy, threshold)`。旧は地図座標を
    取りました。）
- `getShareUrl(type: "app" | "view"): string`
  - `"app"`: クエリとハッシュを落とした `location.href`。`"view"`: 今の URL
    （`state-url` のときは、今の状態を書いてから読みます）。
- `showToast(message: string, target?: HTMLElement): void`
  - Shadow DOM の中に `message` を 1.5 秒出します。`target` を渡すとその中央、無ければ
    下の中央です。

ここに載っていない要素クラスのメンバーは内部用です（旧 `MaplatUi` の互換層が使います）。
予告なく変わることがあります。

MaplatCore-Pro と組んだときは、ページは `ui.app` を通して子の Pro 専用のメソッドを呼べます
（例: `ui.app.setDisplayMode(…)`）。先に `ui.app.supports("display-mode")` で確かめてください
（MaplatCore の要素には無いメソッドです）。

## イベント（`MAPLAT_UI_EVENTS`）

| イベント | `detail` | いつ |
|---|---|---|
| `uiReady` | `{}` | `ready` の解決と同時（`bubbles: true`・`composed: false`） |
| 層 A の全イベント（`mapChanged`・`changeViewpoint`・`clickMarker`・`lifecycle:*` など） | [`maplat-app.ja.md`](https://github.com/code4history/MaplatCore/blob/master/docs/api/maplat-app.ja.md#イベントmaplat_app_eventselement_own_events) の「イベント」のとおり | 子が出し、`<maplat-ui>` を**泡立って通ります**（要素は出し直しません）。`<maplat-ui>` か `ui.app` で聞いてください |

要素が公開のイベントとして出すのはこれだけです。

## 見た目の変え方（`::part()` と CSS 変数）

部品は Shadow DOM の中にあるので、ページのセレクタは届きません。
`maplat-ui::part(name)` と CSS 変数で当ててください。旧の class 名からの対応・部品の
一覧・CSS 変数は [移行ガイド](migration-ui-shadow-dom.md) にあります（主な部品だけです）。
`part` 名の正本は `src/element/maplat-ui.ts`・`src/element/slider.ts`・
`src/element/share.ts`（`qr-code`）・`src/element/poi-html.ts`（`poi-html`・`poi-iframe`）
です。CSS 変数は
`--maplat-poi-media-theme-color`・`--maplat-poi-media-navigation-color`（POI のメディアの
スワイパーの色。既定 `#007aff`）と `--maplat-envelope-color`（枠線の表示中、地図の
切り替えのカードの点線の既定色。範囲を持つカードには、要素が地図ごとの色を必ず付けて
それが勝つので、今の版ではページで指定した値は見えません。移行ガイドを参照）と
`--maplat-ui-control-gap`（操作ボタンの列（左上・左下・右下）の、隣り合うボタンの
間隔。既定 `7px`。タッチ端末も同じ値）です。子の地図は `maplat-ui > maplat-app` で当てられ
ます（中は層 A の DOM です）。

```css
maplat-ui { width: 100%; height: 100vh; --maplat-poi-media-theme-color: #a00; }
maplat-ui::part(zoom), maplat-ui::part(home), maplat-ui::part(gps) { background: rgba(0, 0, 0, 0.75); }
maplat-ui::part(map-slide-selected) { outline: 2px solid #a00; }
```

## 言語

UI の文言は 11 言語あります: `de`・`en`・`es`・`fr`・`id`・`ja`・`ko`・`th`・`vi`・
`zh`・`zh-TW`。言語はこの順に解決します（`currentLang`）:

```
<maplat-ui> の lang 属性  ＞  appOption.lang  ＞  設定ファイルの lang  ＞  ブラウザの言語  ＞  "en"
```

要素は**自分の** `lang` 属性だけを見ます。`<html lang>` などの祖先は継ぎません。
`lang` は層 B のキーで、子へは渡しません（子は設定ファイルの `lang` のままです）。
`currentLang` はその値の `zh-hk`・`zh-hant` を `zh-TW` に寄せたものです。言語**ファイル**
は大文字小文字を無視して探し、知らない地域は基底の言語（`en-US` → `en`）、知らない言語は
`en` に落とします。

言語ファイルは初めて要るときに言語ごとに動的 `import()` します（1 言語 1 チャンク）。
読み終えるまでは内蔵の `ja`・`en` の文言を出し、読み込みに失敗した言語は警告して英語に
落とします。起動後に `lang` を変えると、文言・題名・開いている画面・開いている吹き出しを
新しい言語で描き直します。

## 共有・状態 URL・PWA

### 共有

`enable-share` のとき、共有のボタンはアプリの URL（`getShareUrl("app")`）— クリップボード
へのコピー・Twitter・Facebook・QR コード（`share-qr-app`）— と、`state-url` のときに
今の表示の URL（`getShareUrl("view")`・`share-qr-view`）の画面を開きます。
`enable-share` かつ `state-url` のときは、POI の吹き出しにも今の表示の URL の QR コード
（`poi-share`・`poi-qr`）を出します（開いている POI を含みます）。QR の符号化の
ライブラリは初めて要るときに読みます。

### 状態 URL

`state-url` のとき、要素はビューアの状態を `location.hash` に、旧 UI と同じ書式で
保ちます。片方で作った URL をもう片方で開け、Core・Core-Pro と UI のどの組み合わせでも
同じように動きます:

```
#!s:<mapID>/b:<backgroundID>/t:<transparency>/x:<x>/y:<y>/z:<zoom>/r:<rotation>/sb:1/hm:1/hl:<hidden layers>/om:<opened POI>
```

- 起動時に URL の状態を読み、子の `restore` として渡します。URL の状態は、要素に与えた
  `restore`・`map-id`・`transparency` より**強い**です。その結果の地図と透過度を要素の
  属性へ写すのは、`<maplat-ui>` に書かれていたキーだけです。子が `restore` を自分で
  持つ、または子の作成が先に始まっていたときは、`ready` の後に `changeMap()` で当て
  ます。
- `hashchange`（戻る・進む・URL の書き換え）で、ビューアをその状態へ移します。
- URL は、地図の切り替え・状態の変化・移動の終わり・枠線の切り替え・POI の開閉のたびに
  `history.replaceState` で書き直します（履歴は増やしません）。

### PWA

`pwa-manifest` のとき、要素は起動時に（要素につき 1 回。文書の link と登録は二重に
しません）:

- `<head>` に `<link rel="manifest" href="…">` を、無ければ足します
  （`pwa-manifest=""`・`"true"` → `./pwa/${appId}_manifest.json`。`appId` は子の
  `app-id`、無ければ `appOption.appid`、それも無ければ `"sample"`）;
- Service Worker `pwa-worker`（既定 `./service-worker.js`）を scope `pwa-scope`（既定
  `./`）で登録します。旧 UI と同じ worker ファイル（タイルキャッシュの受け口を含む）な
  ので、`<maplat-app enable-cache>` との関係は変わりません（`enable-cache` だけでは
  何も登録しません。同じ worker・scope は二重に登録しません）。失敗は
  `Failed to register service worker: …` と記録し、ビューアは止めません;
- manifest の `icons` から `<link rel="apple-touch-icon">` を、無ければ足します。

3 つの URL は `http(s)` か相対 URL でなければならず、そうでなければ警告して PWA を
有効にしません。

## `MaplatUi` クラスとの関係

1.x の `@maplat/ui` は、旧 `MaplatUi` クラスと要素の両方を出します。**クラスは
`<maplat-ui>` の上の互換層**です: 画面を描く経路は 1 つで、クラスは外形
（`new MaplatUi(option)`・`createObject`・`waitReady`・メソッドとフィールド・
`uiHooks`・`ui.core`）を保ちます。要素と違う点は 2 つです:

- クラスは **Core の `<maplat-app>` の上でだけ**動きます（`ui.core` は Core の
  `MaplatApp`）。Core-Pro は要素の API だけを出すので、Core-Pro のページは
  `<maplat-ui>` を直接使います。
- クラスは設定ファイルの機能系のキー（`tapDuration`・`tapUIVanish`・`noRotate`・
  `northUp` など）を、廃止の警告を出しながら読み続けます。要素は読みません。

クラスは廃止で、**次のメジャー版（2.0）で閉じます**。残るのは要素の API だけです。

| `MaplatUi` クラス | `<maplat-ui>` |
|---|---|
| `MaplatUi.createObject({ appid, div, enableShare, … })`・`new MaplatUi(option)` | `<maplat-ui app-id="…" enable-share>` ＋ 属性・プロパティ。`await ui.ready` |
| `ui.waitReady` | `ui.ready` |
| `appOption.div` | 要素そのもの |
| `ui.core`（`MaplatApp`） | `ui.app`（`<maplat-app>` 要素。公開面だけ） |
| `appOption` の UI のキー（`enableShare`・`tapUIVanish`・`stateUrl`・`pwaManifest` など） | [層 B の表](#層-b-のキー属性と同期) の属性（`tapUIVanish` → `tap-ui-vanish`） |
| `ui.translate(fragment)` | `ui.translateText(fragment)`（クラスは `translate` のまま） |
| `ui.t`・`setShowBorder`・`setHideMarker`・`getShareUrl`・`showToast` | 同じ名前 |
| `ui.handleMarkerActionById(id)` | `ui.openMarker(id)` |
| `ui.xyToMapIDs(xy, threshold)`（地図座標） | `ui.mapsAt({ longitude, latitude }, threshold)` |
| `ui.updateUrl()` | `state-url` で自動（`getShareUrl("view")` も書きます） |
| `ui.remove()` | 要素を文書から外す |
| `ui.addEventListener(type, fn)`（`{ type, detail }`） | `<maplat-ui>` の DOM の `addEventListener`（層 A のイベントが泡立って通ります） |
| `ui.sliderNew`・`ui.contextMenu`・`ui.baseSwiper` / `overlaySwiper`・`ui.i18n`・`showContextMenu`・`modalSetting` など | 要素には無い（内部） |
| 設定ファイルの機能系のキー: 読み、廃止の警告を出す | 読まない |
