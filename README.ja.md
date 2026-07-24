<!-- SECTION 1: Header (logo, badges, title) -->
<p align="center">
  <img src="https://code4history.github.io/Maplat/page_imgs/maplat.png" alt="Maplat ロゴ" width="200" />
</p>

<h1 align="center">Maplat</h1>

<p align="center">
  <a href="https://github.com/code4history/Maplat/actions/workflows/ci.yml"><img src="https://github.com/code4history/Maplat/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://www.npmjs.com/package/@maplat/ui"><img src="https://img.shields.io/npm/v/@maplat/ui" alt="npm version" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/npm/l/@maplat/ui" alt="License" /></a>
</p>

<!-- SECTION 2: Elevator Pitch -->
## Maplat について

Maplat は古地図 / 絵地図を歪めることなく GPS や正確な地図と連携させられるビューアです。
各地図の座標変換において非線形かつ同相な投影変換が定義可能で、元の地図画像を歪めずに
連携できるのが他のソリューションにない特徴です。
データ作成ツールは別プロジェクト [MaplatEditor](https://github.com/code4history/MaplatEditor/)
として提供しています。
本プロジェクトは国土交通省主催の 2018年ジオアクティビティコンテストにおいて、
最優秀賞・教育効果賞・来場者賞をいただきました。

Maplat は Apache License 2.0（バージョン 0.12.2 以降）のオープンソースソフトウェアです。

<!-- SECTION 3: Language switch link -->
**[英語版はこちら / Read this document in English](README.md)**

<!-- SECTION 4: Key Features -->
## 主な特徴

- 古地図 / 絵地図を歪めずに表示できるビューア（非線形かつ同相な座標変換）
- 元の地図画像を歪めずに GPS・正確な地図と連携
- OpenLayers ベースの切替可能なベースマップ（Vector Tile で Mapbox GL JS / MapLibre GL JS をオプション扱い）
- PWA 対応アプリケーションシェル（マニフェスト・Service Worker・シェア・URL 状態管理）
- Apache 2.0（バージョン 0.12.2 以降）のオープンソース・デスクトップ向けデータ作成ツール MaplatEditor が併設

<!-- SECTION 5: Quick Start -->
## クイックスタート

> 特定リリースに紐づく情報（ADR-0012）。下記のバージョン `0.12.2` は現在の
> リリース値です。リリースごとに更新してください。

### インストール

```bash
# pnpm（推奨）
pnpm add @maplat/ui

# npm
npm install @maplat/ui
```

### 最小利用例

```typescript
import { MaplatUi } from '@maplat/ui';
import '@maplat/ui/dist/maplat_ui.css'; // スタイルのインポート

const option = {
  appid: 'myMark',
  // ...
};

MaplatUi.createObject(option).then(app => {
  // アプリケーション初期化完了
});
```

### CDN（jsDelivr）

バンドルせずにブラウザで直接利用する場合は、依存関係（OpenLayers）を先に読み込む
必要があります。Maplat Core はバンドルに含まれているため、個別の読み込みは不要です。

```html
<!-- OpenLayers -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@10/ol.min.css">
<script src="https://cdn.jsdelivr.net/npm/ol@10/dist/ol.min.js"></script>

<!-- Maplat UI -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@maplat/ui@0.12.2/dist/maplat_ui.css">
<script src="https://cdn.jsdelivr.net/npm/@maplat/ui@0.12.2/dist/maplat_ui.umd.js"></script>

<div id="map_div"></div>
<script>
  var appOption = {
    appid: "tm",
    // ... options
  };
  MaplatUi.createObject(appOption).then(function(app) {
    console.log("Maplat initialized");
  });
</script>
```

※ バージョン番号は適宜最新のものに置き換えてください。

### ライフサイクル

- フェーズや uiHooks については [docs/ui-core-lifecycle.ja.md](docs/ui-core-lifecycle.ja.md) を参照してください。

### API リファレンス

- **API シグネチャ**（リリース依存）: [`docs/api/`](docs/api/) を参照
- **概念解説**（リリース非依存）:
  [Wiki API-Reference](https://github.com/code4history/Maplat/wiki/API-Reference) を参照

### 開発

#### 準備
リポジトリをクローンし、依存関係をインストールします。

```bash
git clone https://github.com/code4history/Maplat.git
cd Maplat
pnpm install
```

#### 開発サーバー
ホットリロード対応の開発サーバーを起動します。

```bash
pnpm dev
```

ブラウザで `http://localhost:5173/` にアクセスしてください。

#### ビルド

```bash
pnpm build        # npmパッケージのビルド (dist/)
pnpm build:demo   # デモアプリのビルド (dist-demo/)
```

#### テスト

```bash
pnpm test         # テストの実行 (Vitest)
pnpm typecheck    # 型チェック (TypeScript)
pnpm lint         # リントとフォーマット (ESLint/Prettier)
```

<!-- SECTION 6: Prerequisites -->
## 動作環境

> `package.json` の `engines` フィールドから自動抽出（ADR-0012: 特定リリースに紐づく）。

- Node.js: v20 or v22（GitHub Actions で検証済みの LTS）
- pnpm: `>=9.0.0`（必須・`package.json` が pnpm を強制）

<!-- SECTION 7: Peer Dependencies -->
## Peer Dependencies

Maplat UI は以下のライブラリを peer dependency として要求します。利用者が明示的に
インストールする必要があります。

- **OpenLayers (`ol`)** — `^9.0.0 || ^10.0.0`（Maplat `@maplat/ui` と
  MaplatCore `@maplat/core` の peer dependency）

```bash
pnpm add ol
```

Vector Tile を使用する場合は、Mapbox GL JS または MapLibre GL JS も必要になる場合があります。

- `mapbox-gl`: `^1.0.0 || ^2.0.0 || ^3.0.0`
- `maplibre-gl`: `^3.0.0 || ^4.0.0`

<!-- SECTION 8: Ecosystem / Related Repositories -->
## エコシステム

Maplat は [Code for History](https://github.com/code4history) が運営する
Maplat エコシステムの一部です。全容は下記エコシステム図を参照してください。

📖 **エコシステム図** — *（図は現在外部非公開の計画リポジトリにあります。
公開ビューアからは下記の姉妹リポジトリ表で代替します）*

### 姉妹リポジトリ

| リポジトリ | ライセンス | npm | 役割 |
|---|---|---|---|
| [Maplat](https://github.com/code4history/Maplat) | Apache 2.0 | `@maplat/ui` | メインビューア |
| [MaplatCore](https://github.com/code4history/MaplatCore) | Apache 2.0 | `@maplat/core` | コアライブラリ |
| [MaplatTin](https://github.com/code4history/MaplatTin) | Apache 2.0 | `@maplat/tin` | TIN 変換 |
| [MaplatTransform](https://github.com/code4history/MaplatTransform) | Apache 2.0 | `@maplat/transform` | 座標変換 |
| [MaplatEditor](https://github.com/code4history/MaplatEditor) | Apache 2.0 | — | データ作成ツール（デスクトップ） |

> MaplatEditor は上記ビューアライブラリが描画する地図・POI を作成する
> データ作成ツールです。Maplat エコシステムはエンドツーエンド:
> MaplatEditor で作成し、いずれかのビューアライブラリで公開、という流れになります。

<!-- SECTION 9: Nayuta links -->
## リンク

| 対象 | リンク | 用途 |
|---|---|---|
| プロジェクト情報・機能紹介・事例 | <https://www.maplat.jp/> | 製品サイト |
| 支援企業・案件問い合わせ | <https://www.nayuta-inc.co.jp/> | コーポレートサイト（那由多社） |

> ADR-0013: Apache ライセンスのリポジトリ（本リポジトリ）は両サイトへリンクします。
> MIT ライセンスの姉妹リポジトリ（Weiwudi / Quyuan / Chuci）へは那由多社リンクを置きません。

<!-- SECTION 10: License -->
## License

Apache License 2.0 — 詳細は [LICENSE](LICENSE) を参照。

```
Copyright 2019-2026 Kohei Otsuka, Code for History / Nayuta, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

> **特許注記**: Maplat の座標変換技術は日本国内で特許登録されています
> （Patent No. 6684776）。

> **過去のバージョン**: 0.12.2 より前のバージョンは Maplat Limited License 1.1 の
> もとで配布されていました。Apache 2.0 へのライセンス復帰はバージョン 0.12.2 以降に
> 適用されます。npmjs.com で公開されている過去のバージョンは、それぞれ元の
> 制限ライセンスの条件が維持されます。

<!-- SECTION 11: Contributors / Sponsors -->
## Contributors

This project exists thanks to all the people who contribute. <!--[[Contribute](CONTRIBUTING.md)].-->
<a href="https://github.com/code4history/Maplat/graphs/contributors"><img src="https://opencollective.com/maplat/contributors.svg?width=890&button=false" /></a>

## Sponsors

Maplat is supported by
<a href="https://www.locazing.com/" target="_blank"><img src="https://code4history.github.io/Maplat/img/locazing.png" width="150"></a>
<a href="https://www.thedesignium.com/" target="_blank"><img src="https://code4history.github.io/Maplat/img/logo_TheDesignium.png" width="150"></a>
<a href="https://www.browserstack.com/" target="_blank"><img src="https://code4history.github.io/Maplat/img/browserstack-logo-600x315.png" width="150"></a>
<a href="https://zender.co.jp/" target="_blank"><img src="https://code4history.github.io/Maplat/img/Zender_logo_y_color.png" width="150"></a>
<a href="https://www.webimpact.co.jp/" target="_blank"><img src="https://code4history.github.io/Maplat/img/webimpact.jpg" width="150"></a>

Thank you to all our backers! 🙏 [[Become a backer](https://opencollective.com/maplat#backer)]
<a href="https://opencollective.com/maplat#backers" target="_blank"><img src="https://opencollective.com/maplat/backers.svg?width=890"></a>

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [[Become a sponsor](https://opencollective.com/maplat#sponsor)]
