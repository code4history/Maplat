# Maplat openspec 時代の開発履歴索引

> 本ファイルは openspec ワークフロー（〜2026年）時代に作成された開発提案・記録を、那由多開発サイクル形式の履歴として集約した索引です。
> 原文は `docs/history/openspec-legacy/<change-id>/` 配下にそのまま保存されています（内容は変更していません）。
> 那由多開発サイクルについては `docs/superpowers/`（存在する場合）を参照してください。
>
> 「推定時期」は、各 change の `proposal.md` に対して `git log --follow --diff-filter=A -1` を実行して得た**作成日**（そのファイルが最初にリポジトリへ追加されたコミットの日付）を記載しています。archive 化の際にディレクトリ名へ日付プレフィックスが付与される・リネームされるケースがあるため、ディレクトリ単位ではなくファイル単位で `--follow` を適用し、archive 日ではなく作成日を実測しています。

## 開発提案一覧（openspec/changes、archive済み + 未archive、計9件）

| change-id | 由来 | 推定時期 | 目的 | 実装状況 | 現在の扱い | 原文 |
|---|---|---|---|---|---|---|
| 2025-12-11-modernization | archive済み | 2025-12-09（94f62b9d） | 古い依存関係（UMD形式・分離実装のGPSロジック等）を刷新し、ESM/TS/Vite・Vitestへ移行、`@maplat/core` と整合させる。 | 完了 | 完了・削除対象 | [原文](openspec-legacy/2025-12-11-modernization/) |
| 2025-12-15-harden-security | archive済み | 2025-12-15（399b04de） | pnpm移行後のセキュリティ強化。`ignore-scripts` 既定化・`onlyBuiltDependencies` によるビルドスクリプト許可リスト化で多層防御を確立する。 | 完了 | 完了・削除対象 | [原文](openspec-legacy/2025-12-15-harden-security/) |
| 2025-12-15-optimize-build-assets | archive済み | 2025-12-15（399b04de） | ビルド方式を刷新し、CommonJSを廃してESM/UMD出力に一本化、フォント・ロケールの取り扱いを簡素化する。 | 完了 | 完了・削除対象 | [原文](openspec-legacy/2025-12-15-optimize-build-assets/) |
| 2025-12-15-share-qrcode | archive済み | 2025-12-11（b8d61244） | 地図URLをQRコードでモバイル端末へ共有する旧機能（v0.10.x相当）を復元し、フィールドワーク時の利便性を回復する。 | 完了 | 完了・削除対象 | [原文](openspec-legacy/2025-12-15-share-qrcode/) |
| 2025-12-18-weiwudi-vite-pnpm | archive済み | 2025-12-18（fe53c84c） | `package.json` の npm スクリプトが内部で `npm run` を実行しておりpnpm強制方針と矛盾していたため、スクリプトをpnpmへ統一する。 | 完了 | 完了・削除対象 | [原文](openspec-legacy/2025-12-18-weiwudi-vite-pnpm/) |
| 2025-12-21-upgrade-turf-eslint | archive済み | 2025-12-21（10bb0445） | Issue #234対応として `@turf/turf` をv7へ更新し、ESLint v9のFlat Config（`eslint.config.js`）へ移行する。 | 完了 | 完了・削除対象 | [原文](openspec-legacy/2025-12-21-upgrade-turf-eslint/) |
| function-for-border-button | archive済み | 2025-12-15（d1b4eca8） | 境界ボタンのUIをラスター画像からSVGへ刷新し、アクティブなオーバーレイ地図の視覚的フィードバックを改善する。 | 完了 | 完了・削除対象 | [原文](openspec-legacy/function-for-border-button/) |
| marker-list-function | archive済み | 2025-12-17（02c3955c） | 「マーカー一覧」ボタン・モーダルのUI基盤は存在するが中身が空だった状態を解消し、POIを一覧表示して探索・移動できるようにする。 | 完了 | 完了・削除対象 | [原文](openspec-legacy/marker-list-function/) |
| standardize-repo-structure | 未archive | 2025-12-25（ced4a999） | Maplat Harmonyエコシステム全体で定めたリポジトリ構造標準（`dist/` の成果物分離・CI/CDワークフロー・devサーバ設定等）への準拠を図る。 | ほぼ完了（19/22。`package.json` に `build`/`build:demo` の分離コマンドが実在し主要実装は完了済み。残タスクはdevサーバ動作確認・CI稼働確認・GitHub Pagesデプロイ確認という手動検証チェックリストのみ） | 完了・削除対象 | [原文](openspec-legacy/standardize-repo-structure/) |

## 当時のプロジェクト概要（参考・陳腐化済み）

| 項目 | 推定時期 | 目的 | 現状との乖離 | 原文 |
|---|---|---|---|---|
| project.md | 2025-12-09（94f62b9d） | openspecワークフロー導入時点でのMaplatプロジェクト概要・規約を記述したもの。 | 那由多開発サイクル移行（本索引作成）により、開発プロセス・ドキュメント体系は本ファイル群へ置き換わっている。参考情報として保存。 | [原文](openspec-legacy/_project-snapshot/project.md) |
| specs/marker-list/spec.md | 2025-12-17（02c3955c） | マーカー一覧機能の仕様。 | marker-list-function 完了により実装へ反映済み。現行実装の正本ではなく当時の仕様記録として保存。 | [原文](openspec-legacy/_project-snapshot/specs/marker-list/spec.md) |
| specs/security/spec.md | 2025-12-15（399b04de） | pnpmセキュリティ強化（harden-security）の仕様。 | harden-security 完了により実装へ反映済み。当時の仕様記録として保存。 | [原文](openspec-legacy/_project-snapshot/specs/security/spec.md) |
| specs/package-manager/spec.md | 2025-12-18（fe53c84c） | pnpmスクリプト統一（weiwudi-vite-pnpm）の仕様。 | 完了済み変更の仕様記録として保存。 | [原文](openspec-legacy/_project-snapshot/specs/package-manager/spec.md) |
| specs/development/spec.md | 2025-12-21（10bb0445） | `@turf/turf` v7・ESLint Flat Config移行（upgrade-turf-eslint）の仕様。 | 完了済み変更の仕様記録として保存。 | [原文](openspec-legacy/_project-snapshot/specs/development/spec.md) |
