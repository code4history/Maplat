# 旧 e2e の仕分け（M7・再レビュー D4）

- 収録日: 2026-10-23（HEAD `fc8d5914` の作業ツリー。行番号はその時点のもの）
- 対象: **着手時点の** `e2e/*.spec.ts` 8 ファイル（`playwright.config.ts` の `testDir: ./e2e` が拾うもの）。
  今回追加した `e2e/legacy-api.spec.ts`（上の API 判定の実ブラウザ版）と
  `e2e/legacy-baseline-capture.spec.ts`（見た目の採取。旧 UI の実装を消したので、その後に消した）は、この仕分けの**結果**なので対象に含めない。`e2e/element/*.pw.ts` は
  `playwright-element.config.ts`（`testMatch: /\.pw\.ts$/`）で走る**新 UI の**テストなので、この仕分けの対象外。
- 目的: `MaplatUi` を `<maplat-ui>` の互換層に差し替えたあと、**書き換えずに緑にすべきもの**を
  API 水準で確定させる（R5 の合格判定）。DOM のセレクタに依るものは「移植して緑」（R2 の判定）であって
  R5 の証明には数えない。

## 0. 区分の定義

| 区分 | 意味 | 移行後の扱い |
|---|---|---|
| **API** | 旧 API の公開面（`createObject`・`waitReady`・`ui.core`・イベント・URL・題名の文字・戻り値）だけで判定しており、旧 UI の DOM の構造・class 名・Swiper の実物を読まない | **書き換えずに緑**（R5 の本命）。`spec/legacy-api.spec.ts`（単体）と `e2e/legacy-api.spec.ts`（実 Core）へ同じ判定を写す |
| **DOM** | `.base-swiper`・`.swiper-slide-active`・`.ol-*`・`.modal_*`・`window.__maplatUi.baseSwiper` など、旧 UI の DOM・Swiper の実物に依る | セレクタだけを `::part` / `shadowRoot` へ移植し、期待値（振る舞い）は変えない。R5 の証明には数えない |
| **対象外** | 旧 UI を起動していない（Core だけ・PWA の登録だけ・デモのクエリだけ）。どちらにも数えない | そのまま（UI 一本化の影響を受けない） |

## 1. 一覧（ファイル:行・判定・根拠）

### `e2e/oct26-m9-t1-swiper-loop.spec.ts`（847 行。旧 UI のスワイパーの主判定）

| 位置 | 何を判定しているか | 区分 | 根拠（判定に使っているもの） | 移行後の扱い |
|---|---|---|---|---|
| `:342-500`（AC-6・AC-1・AC-2・AC-3・AC-4） | 初期配置・矢印の実クリック・ドラッグ・1 枚 | DOM | `.base-swiper`/`.overlay-swiper` の `.swiper-slide-active` の `data`、`swiper.animating`、`.swiper-button-lock`（`:97-130` の `activeData`・`selectedData`・`waitActive`）、Swiper Loop Warning の文字列（`:74-78`） | `::part(map-slide)` 等へ移植（期待値は変えない） |
| `:434-449`（AC-4・AC-6 n=6） | 6 枚でも警告なし・隣が同じ地図にならない | DOM | 同上＋`repeatCount` | 移植。ループの概念が無くなるので「警告 0」は自明になる（判定は残す） |
| `:452-493`（AC-3 n=1） | 1 枚はループしない・矢印が lock | DOM | `.swiper-button-lock`・`swiper.allowSlideNext` | 移植（`single-map`）。**注意: P1 により幅ごとの枚数は意図して旧と違う**（後述の「幅ごとの枚数について」） |
| `:495-583`（AC-5 (a)(a')(b)(c)） | カードのクリック・`setSlideMapID`・`core.changeMap` の後の active と `.selected`、**地図タイトルの文字** | DOM（大半） | `.swiper-slide.selected`（`:128`）、`.swiper-slide-active`、`root.swiper.translate`、`window.__maplatUi[k+"Swiper"].setSlideMapID`（`:543`）。ただし `core.changeMap` の呼び出しと `mapChanged` の受信（`:551-576`）は API 水準 | `.selected` と translate は移植。`changeMap`→`mapChanged`→（スライダーの選択が追随）と題名は `e2e/legacy-api.spec.ts` の API 判定へ写す |
| `:584-610`（AC-12） | 覗いているカードの実クリックで、その側へ 1 枚分動いて押した要素が中央 | DOM | `elementFromPoint`・`transitionrun`・`wrapperEl.getAnimations()`・`data-m9-mark` | `::part(map-slide)` とフォーカスで移植（D5 の「押したらすぐ `onSelect`」は API 判定を `spec/slider.spec.ts` に置く） |
| `:611-696`（破壊試験 w=1280） | 遷移中の連打・ドラッグ直後・矢印直後 | DOM | `changeMap` を包んで呼び出しを記録（`:86-93`）＋`.swiper-slide-active` / `.selected` / `.map-title span` | 移植（連打の期待値＝「最後のクリックの地図に揃う」は変えない） |
| `:697-768`（AC-12 補助） | 保留中の `onResize` とカードのクリックの競合 | DOM | Swiper の `slideToLoop` を包む（`:735-760`） | 移植しない（Swiper 固有の不具合の回帰。`T16` の「`onResize` 競合を作らない」を新しい実装の単体で担保する） |
| `:769-846`（AC-13） | URL の `#!` 復元の後に active が目的の地図 | DOM＋API | `#!s:<id>` を書いて `changeMap` の呼び出しを記録（`:827`・`:838`＝API）、active は `.swiper-slide-active`（`:840`）、題名は `titleState`（`:133-166`。`.map-title span`） | **URL の書式と `changeMap` が呼ばれること（API）は `e2e/legacy-api.spec.ts` へ写す**。active の追随は移植 |

- このファイルは **fixture `e2e/fixtures/swiper-loop.html`**（`MaplatUi.createObject`・`stateUrl=1` で `#!` を有効化。`e2e/oct26-m9-t1-swiper-loop.spec.ts:72`）で走る。
  新しい `e2e/legacy-api.spec.ts` が使うのは `e2e/fixtures/legacy-api.html` で、**別の fixture**（下の「API 水準の抜き出し」の注記）。
  スワイパーそのものは Swiper であり、Swiper の CSS を叩く判定（`wrapperEl`・`transitionrun`）は自前スライダーには
  存在しない概念なので移植時に書き換えが必要になる（＝R5 の証明には使えない）。

### `e2e/nov26-m5-t1-swiper-xss.spec.ts`（154 行。旧 UI のスワイパーの無害化）

| 位置 | 何を判定しているか | 区分 | 根拠 | 移行後の扱い |
|---|---|---|---|---|
| `:34-38`（陽性対照） | READY になり `.base-swiper` のスライドが並ぶ | DOM | `.base-swiper`・`.swiper-slide`（`:25`・`:36`） | 移植（`::part(map-slide)`） |
| `:40-57`（AC2・label） | label の HTML がタグにならず文字のまま | DOM | `span:not(.omit-mark)` を連結し `P` と比較（`:50-56`。旧 `ellips` の span 分割を前提） | 移植時に `part(map-slide-label)` の `textContent` で判定する（`ellipsize` の作りが変わっても文字の同一性は保つ） |
| `:58-102`（AC3・mapID） | 属性注入が起きず、クリックで元の mapID に切り替わる | DOM＋API | `.swiper-slide[data=...]`（`:60-97`）＝DOM。**`__maplatUi.core.from.mapID`（`:99-100`）＝API** | `data-map-id` の保持と `core.from.mapID` の一致を移植。API の部分は `e2e/legacy-api.spec.ts` に写せる |
| `:103-132`（AC4・thumbnail） | `javascript:` は画像なし・属性注入なし | DOM | `img` の `src` を読む（`:106-125`） | 移植（判定は `poi_safe.ts` の `safeImageUrl`。旧の `swiperThumbUrl` は旧 UI の実装の削除の仕上げで消した） |
| `:133-153`（AC1 (c)・icon） | 重なったマーカーのメニュー項目の icon がほかの CSS へはみ出さない | DOM | `window.__maplatUi.contextMenu.container`（`:137`）・`li`/`span`（`:140-141`）・`getComputedStyle` | 汎用メニューの part（D1: `map-menu` 以外。今の `poi-menu`／`poi-menu-item` を引き継いだ）へ移植。`map-menu`・`map-menu-item` は地図の切り替えメニューとともに消えた。`showContextMenu({icon,text,callback})` が項目を出すこと自体は `spec/legacy-api.spec.ts` で固定する |

### `e2e/nov26-m5-t2-demo-query.spec.ts`（96 行。デモのクエリ）

| 位置 | 何を判定しているか | 区分 | 根拠 | 移行後の扱い |
|---|---|---|---|---|
| `:37-47`（`C1`〜`C2` 等の表） | `?lang=`・`?app=` 等のクエリで fixture が READY/ERROR になる | 対象外（fixture の起動だけ） | `#status` の文字（`:41`）と `pageerror`。fixture は `MaplatUi.createObject`（`nov26-m5-t2-poitemplate-control.html:28,53`）だが、判定しているのは**クエリの許可リスト** | 旧 API のデモのまま（旧 API が互換層になっても同じクエリで同じ結果になることだけ見る） |
| `:48-75`（C3-control） | `poiTemplate` を直接入れると payload が発火する（陽性対照） | 対象外 | `pageerror` の観測 | そのまま |
| `:76-95`（C4） | `#lang-select` を変えると URL と `#status` が追随 | DOM（デモの UI） | `#lang-select`・`#app-select`（`:91-92`） | そのまま（デモのページの遊び。UI 一本化の対象外） |

### `e2e/nov26-m5-t3-pwa-worker.spec.ts`（83 行。PWA の登録）

| 位置 | 何を判定しているか | 区分 | 根拠 | 移行後の扱い |
|---|---|---|---|---|
| `:52-67`（(i)） | `pwa.worker` の指定で `register` の呼び出し回数・SW スクリプトの要求が変わる。manifest と apple-touch-icon が足される | API（`navigator.serviceWorker.register` の記録）＋DOM（`link[rel=manifest]`・`link[rel=apple-touch-icon]`:62-63） | `window.__pwa` 相当の記録と `#status`（`:44`） | API の部分（register の回数）はそのまま。`link` の部分は旧 `pwa_init.ts` → `element/pwa.ts` の移植で同じ結果になることを見る（R5 の証明ではなく R2） |
| `:68-76`（(ii)） | 陽性対照 | 同上 | 同上 | 同上 |
| `:77-82`（(iii)） | `worker=false&cache=1` で READY・pageerror 0・register 0 | API（pageerror・register） | `#status`（`:44`） | そのまま |

### `e2e/m18-t6-marker-list-layer-toggle.spec.ts`（154 行。マーカー一覧のレイヤ切り替え）

| 位置 | 何を判定しているか | 区分 | 根拠 | 移行後の扱い |
|---|---|---|---|---|
| `:65-77`（E-1） | マーカー一覧にアプリのレイヤと地図由来のレイヤが出る | DOM | `.ol-marker-list button`（`:23`）・`.modal_marker_list_content .list-group-item.layer label.check`（`:57`） | `::part` へ移植。振る舞い（レイヤの表示・非表示）は `ui.core.hidePoiLayer` 等の API で読めるようにして期待値を変えない |
| `:78-102`（E-2）・`:103-123`（E-3）・`:124-153`（E-4） | 地図由来のレイヤの切り替えが他へ影響しない | DOM（＋地図のレイヤ状態） | 同上のセレクタで操作し、`label.checked` を読む | 移植（同じファイルをセレクタだけ書き換えて緑に） |

### `e2e/oct26-m9-t1-chuci-arrow.spec.ts`（67 行。Chuci の矢印）

| 位置 | 何を判定しているか | 区分 | 根拠 | 移行後の扱い |
|---|---|---|---|---|
| `:17-66`（AC-10） | `cc-swiper` のナビゲーションの矢印が 1 本（`::after` の chevron だけ） | DOM（CC0 部品。旧 UI の DOM ではない） | `#divPrevious svg.swiper-navigation-icon`・`getComputedStyle(b, "::after")`（`:52-64`）。旧 UI は `@c4h/chuci` の登録元としてだけ使われる（`:15` のコメント） | そのまま（旧 UI のスワイパーとは無関係。移行後も `cc-swiper` の見た目の判定として要る） |

### `e2e/m1-t4-sanitize-browser.spec.ts`（110 行）・`e2e/m1-t5-poi-html-isolation.spec.ts`（163 行）

| 位置 | 何を判定しているか | 区分 | 根拠 | 移行後の扱い |
|---|---|---|---|---|
| m1-t4 `:41-109` | サニタイズ（`sanitizeHtml`）のブラウザ差 | 対象外 | probe ページ（`e2e/fixtures/sanitize-probe.html`）で `@maplat/core` の関数を直接呼ぶ。UI を起動しない | そのまま |
| m1-t5 `:19-162` | POI の HTML の隔離（iframe・`shadowRoot`） | 対象外 | probe ページ（`e2e/fixtures/poi-html-probe.html`）。UI を起動しない | 旧 UI の実装の削除の仕上げで probe の読み先を `src/element/poi-html.ts`（`<maplat-ui>` が使う組み立て）へ替えた。判定の中身（隔離・no-scroll・url の許可リスト）は変えない |

## 2. API 水準の抜き出し（移行後に書き換えずに緑にすべき判定）

上の一覧から、**旧 UI の DOM を読まずに成り立つ**判定だけを抜き出した。これが R5 の判定であり、
`spec/legacy-api.spec.ts`（単体・実物の層 A）と `e2e/legacy-api.spec.ts`（実 Core・実ブラウザ）に置く。

| # | 判定 | 旧 e2e での出所 | 新しい置き場所 |
|---|---|---|---|
| A1 | `MaplatUi.createObject(option)` が解決し、`waitReady()` が `MaplatUi` を返す | 全 fixture の起動（`nov26-m5-t1-swiper-xss.html:69` 等） | `spec` A1・`e2e` A1 |
| A2 | 解決したとき `ui.core` が非 null（stateUrl なし・ありの両方） | `swiper-loop.html` の `window.__maplatUi`（`:126-128`）で全テストが前提にしている | `spec` A2・`e2e` A2 |
| A3 | `ui.core.changeMap(id)` が `mapChanged` を出し、`ui.core.from.mapID` が一致する | swiper-loop `:551-576`（AC-5(c)）・m5-t1 `:99-100`（AC3） | `e2e` A3 |
| A4 | URL の `#!s:<id>` が `changeMap(<id>)` を呼ぶ | swiper-loop `:827`・`:838`（AC-13 (2)） | `e2e` A4 |
| A5 | 地図の題名の文字が切り替わった地図のものになる | swiper-loop `:133-166`（`titleState`）・`:514`・`:631` | `e2e` A5（文書全体と shadow root の文字で判定） |
| A6 | `uiHooks` の 7 段階がこの順に呼ばれる | どの e2e も見ていない（単体の担当） | `spec` A6 |
| A7 | `showContextMenu([{icon,text,callback}])` が項目を出し、押すと `callback` が呼ばれる | m5-t1 `:133-153`（DOM 側だけ移植） | `spec` A7・`e2e` A7 |
| A8 | 設定ファイルの機能系キー（`noRotate` 等）が効く | どの e2e も見ていない（m5-t2 の陽性対照が近い） | `spec` A8 |
| A9 | `ui.setShowBorder`・`ui.setHideMarker`・`ui.updateUrl`・`ui.showToast`・`ui.remove()` が例外を投げない（＋ `updateUrl()` が新しい状態を `#!` に書く。N4） | 間接的に全 e2e が使う | `e2e` A9 |

- **A3・A4・A5 は実ブラウザでしか判定できない**（`changeMap` はタイルの読込と地図の準備を待つため）。
  `e2e/legacy-api.spec.ts` は専用の `e2e/fixtures/legacy-api.html`（`window.__maplatUi` を置き、
  題名とカードの見出しを別の文字列にしてある）を使い、**セレクタではなく `ui.core` とイベントと URL と文字**で判定する。
  旧 e2e の `swiper-loop.html` は使わない。
- **A6〜A8 は jsdom で判定できる**（`spec/legacy-api.spec.ts`。層 A は実物、地図は `sources: []`）。
- A9 は「例外を投げない」ことに加えて、**`updateUrl()` が新しい状態の `#!` を書くこと**を見る（N4）。
  旧の内部フィールド（`pathThatSet`）には触らない: 起動時のハッシュを控えて消し、地図を替えてから
  `updateUrl()` を呼び、ハッシュが新しい地図の状態になることだけを確かめる（互換層が書き込みを省く
  正しい実装でも通る）。見た目は `e2e/legacy-baseline-capture.spec.ts` の基準 JSON が持つ。

## 3. 幅ごとの枚数について（P1 の決定との関係。既知の意図差分）

- 旧 e2e（swiper-loop `:452`・`:495`・`:586` 等）は、**今の Swiper の設定**（`src/ui_init.ts` の
  `breakpoints`。幅 480px 以上で `slidesPerView: 1.4`・`spaceBetween: 10`、480px 未満で `2`・`15`）を前提に
  している。この「480px 以上で 1.4 枚」は 2025-12-12 の Swiper v6 移行（`4c267793`）以後の状態であり、
  v4 時代（`git show 4c267793^:src/index.ts:852-856`）は「480px 以下で 1.4 枚・それより広いと 2 枚」だった（再レビュー D3）。
- 人間の決定 **P1** は「v4 時代の見た目に戻す」なので、新しい実装は **481px 以上で `2`・`gap 15`、
  480px 以下で `1.4`・`gap 10`** になる（`src/element/slider.ts` の `MapSlider`）。
  **この 481〜640px の差は意図した差分**であり、旧 e2e の期待値（1.4 枚）を新しい実装へ写すときは
  書き換える（R5 の判定には数えない）。
- したがって `e2e/legacy-baseline-capture.spec.ts` の出力（`spec/fixtures/legacy-baseline/<幅>.json`）には、
  幅ごとに **実際に描かれている枚数**（`perViewMeasured`）と**旧の設定の枚数**（`perView`。スクリプトが読む
  `swiper.params` の値で、`perViewLegacy` という項目は無い）を入れておき、
  あとで「意図した差分」の一覧に載せられるようにする。
- 対応表（旧の値の出所は `src/ui_init.ts:553-565`・`:591-603`。480px **以上**で 1.4 枚・gap 10、
  480px **未満**で 2 枚・gap 15）:

| 幅 | 旧（今の e2e の前提） | 新（P1 の決定） | 扱い |
|---|---|---|---|
| 1280 | 1.4 枚・gap 10 | 2 枚・gap 15 | **意図した差分** |
| 640 | 1.4 枚・gap 10 | 2 枚・gap 15 | **意図した差分** |
| 481 | 1.4 枚・gap 10 | 2 枚・gap 15 | **意図した差分** |
| 480 | 1.4 枚・gap 10 | 1.4 枚・gap 10 | **差分ではない**（旧も 480 以上なので 1.4。`src/ui_init.ts:560-565` の `breakpoints: {480: …}` は 480px 以上に効く） |
| 375 | 2 枚・gap 15 | 1.4 枚・gap 10 | **意図した差分** |
| 320 | 2 枚・gap 15 | 1.4 枚・gap 10 | **意図した差分** |

## 4. この仕分けの限界

- 「API 水準」の判定でも、**fixture の HTML が `window.__maplatUi` を置いていること**自体は旧 UI の実装に依る。
  `e2e/legacy-api.spec.ts` は `window.__maplatUi` を入口に使うが、**判定に使うのは `ui.core` と `ui.addEventListener`
  と `ui.showToast`／`ui.setShowBorder` などの公開面だけ**であり、`.swiper-*` は読まない（互換層でも同じフィールドが残る）。
- `#!` の復元（A4）は、「子の `host.ready` の後に復元」になっても「`changeMap(id)` が呼ばれる」ことは変わらない。
  呼ばれる**順序**（復元 → スライダーの追随）は変わってよい。
- `e2e/element/*.pw.ts`（新 UI）はこの仕分けの対象外。地図の切り替えメニューの `map-menu`・`map-menu-item` part を
  使っていたが、スライダーの操作（カードを押す）へ移植済み（D1）。
