# Maplat API リファレンス

本ディレクトリは `@maplat/ui` のリリース依存の API シグネチャを格納します。
概念解説・利用パターンは
[Wiki API-Reference](https://github.com/code4history/Maplat/wiki/API-Reference)
（リリース非依存の読み物）を参照してください。

## リファレンス

- [`<maplat-ui>` 要素](maplat-ui-element.ja.md) — 属性とプロパティ・状態・メソッド・
  イベント・`::part()` と CSS 変数、`MaplatUi` クラス（次のメジャー版で閉じる）との関係
- [MaplatUi クラス](maplat-ui.ja.md) — 静的メソッド・コンストラクタ・インスタンスメソッド
- [MaplatAppOption](maplat-app-option.ja.md) — オプションオブジェクトのプロパティ
- [旧 UI の DOM からの移行（Shadow DOM 化）](migration-ui-shadow-dom.md) — `::part` / CSS 変数の対応表

## 関連

- [UI コアライフサイクル](../ui-core-lifecycle.ja.md) — ライフサイクルフェーズと uiHooks
- [メイン README](../../README.ja.md) — インストール / クイックスタート / エコシステム
