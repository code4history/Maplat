# Changelog

このプロジェクトの主な変更を記録します。版数は [Semantic Versioning](https://semver.org/) に従います。

## [Unreleased]

### Added
- `pwaWorker: false`（`null` も同じ）で Service Worker を登録しないようにした。manifest の `<link>` と apple-touch-icon は従来どおり足す。登録済みの Service Worker は解除しない（MaplatEditor#106）

### Fixed
- 地図切り替えスワイパーで、地図設定の `mapID`・`thumbnail`・`label` を無害化して表示するようにした（NayutaProducts#28 B-UI-4）。**地図 JSON の `label` に書いた HTML はタグとして解釈されず、文字のまま表示される。** `thumbnail` は http/https・相対 URL・`data:image/` だけを使い、それ以外は「画像なし」の絵になる
- 重なったマーカーのメニューで、POI の `icon` を CSS の文字列へ生のまま入れていたのをやめ、画像の URL として検査してから設定するようにした（#274）

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
