# Changelog

このプロジェクトの主な変更を記録します。版数は [Semantic Versioning](https://semver.org/) に従います。

## [1.1.0-rc.1] - 2026-09-28

### Changed
- 同梱する `@maplat/core` を 1.1.0-rc.1 へ追随。UMD 版は `@maplat/transform` 1.1 を含むため、三角形内を純アフィンで変換し変換結果が変わる。`@c4h/chuci` 1.0.1-rc.1・`@c4h/weiwudi` 1.1.0-rc.1 へ追随
- 依存関係を更新

### Fixed
- 地図切り替えスワイパーが 2〜4 枚でループしない退行を修正し、カードのクリックでそのカードが中央へ 1 枚分スライドするようにした（#259）
- `#!` 状態の復元後に地図切り替えスワイパーの位置合わせが地図と食い違う件を修正
- POI 一覧の name・icon を無害化し、url・directgo を http/https に限る。重なったマーカーのコンテキストメニューで POI の name を実体参照化する（セキュリティ修正）
- PWA の Service Worker 登録の Promise 拒否を捕捉し、未捕捉 rejection をなくす
