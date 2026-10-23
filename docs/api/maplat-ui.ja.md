# MaplatUi

`@maplat/ui` のメインクラスです。

## 静的メソッド

- **`createObject(option: MaplatAppOption): Promise<MaplatUi>`**
  MaplatUi のインスタンスを作成し、初期化が完了するのを待ってから返します。推奨されるインスタンス化の方法です。

## コンストラクタ

- **`new MaplatUi(option: MaplatAppOption)`**
  インスタンスを作成しますが、初期化の完了は待ちません。`waitReady` プロパティで待機する必要があります。

## 主なメソッド

- **`remove()`**: アプリケーションを破棄し、リソースを解放します。
- **`updateUrl()`**: 現在の状態に合わせて URL を更新します（`stateUrl` オプション有効時）。

## 注意（Shadow DOM 化）

UI の表示は `<maplat-ui>`（Shadow DOM open）に移りました。`MaplatUi` の外形（`createObject`・`waitReady`・
`uiHooks`・`ui.core` など）は変わりませんが、旧 UI の DOM の class 名（`.ol-*`・`.swiper-*`・`.modal_*` など）は
無くなり、スタイルは `::part()` と CSS 変数で当てる形になりました。また、旧 API の互換層は Core の
`<maplat-app>` の上だけで動きます。移行の手順と対応表は
[旧 UI の DOM からの移行（Shadow DOM 化）](migration-ui-shadow-dom.md) を参照してください。

旧 UI の実装（`src/ui_init.ts` など）は削除済みで、このクラスは `<maplat-ui>` の上の**互換層**だけです
（同じ画面を描く経路は 1 つ）。`ui.sliderNew`・`ui.contextMenu`・`ui.baseSwiper`/`ui.overlaySwiper`・`ui.i18n`・
`ui._t` の型は限定 facade になっています（くわしくは移行ガイドの「型の変化」）。

## 関連

- [MaplatAppOption](maplat-app-option.ja.md) — オプションオブジェクトのプロパティ
- [UI コアライフサイクル](../ui-core-lifecycle.ja.md) — ライフサイクルフェーズと uiHooks
- [旧 UI の DOM からの移行（Shadow DOM 化）](migration-ui-shadow-dom.md) — `::part` の対応表
