![Maplat Logo](https://code4history.github.io/Maplat/page_imgs/maplat.png)

[![CI](https://github.com/code4history/Maplat/actions/workflows/ci.yml/badge.svg)](https://github.com/code4history/Maplat/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@maplat/ui)](https://www.npmjs.com/package/@maplat/ui)
[![License](https://img.shields.io/npm/l/@maplat/ui)](LICENSE)


# Maplat
Maplatは古地図/絵地図を歪める事なくGPSや正確な地図と連携させられるオープンソースプラットフォームです。  
他のソリューションにない特徴として、各地図の座標変換において非線形かつ同相な投影変換が定義可能という点が挙げられます。  
このプロジェクトは国土交通省主催の2018年ジオアクティビティコンテストにおいて、最優秀賞、教育効果賞、来場者賞をいただきました。

## 目次
- [Maplat](#maplat)
  - [目次](#目次)
  - [動作要件](#動作要件)
  - [インストール](#インストール)
    - [npm/pnpmでのインストール](#npmpnpmでのインストール)
      - [Peer Dependencies (必要な外部依存)](#peer-dependencies-必要な外部依存)
    - [ブラウザでのCDN利用](#ブラウザでのcdn利用)
  - [利用方法](#利用方法)
    - [ESM (EcmaScript Modules)](#esm-ecmascript-modules)
  - [APIドキュメント](#apiドキュメント)
    - [MaplatUi](#maplatui)
      - [静的メソッド](#静的メソッド)
      - [コンストラクタ](#コンストラクタ)
      - [主なメソッド](#主なメソッド)
    - [MaplatAppOption](#maplatappoption)
  - [データ作成](#データ作成)
  - [開発](#開発)
    - [準備](#準備)
    - [開発サーバー](#開発サーバー)
    - [ビルド](#ビルド)
    - [テスト](#テスト)
  - [Contributors](#contributors)
  - [Backers](#backers)
  - [Sponsors](#sponsors)

## 動作要件
package.jsonの`engines`フィールドに基づきます。

- **Node.js**: v20, v22以上推奨 (GitHub Actionsでのテスト環境)
- **pnpm**: v9.0.0以上

## インストール

### npm/pnpmでのインストール
本プロジェクトではパッケージマネージャーとして **pnpm** を推奨しています。

```bash
pnpm add @maplat/ui
```
または npm を使用する場合：
```bash
npm install @maplat/ui
```

#### Peer Dependencies (必要な外部依存)
Maplat UIは以下のライブラリに依存していますが、これらはPeer Dependenciesとして定義されているため、利用者が明示的にインストールする必要があります。

- **ol** (OpenLayers): v9.0.0 または v10.0.0 以上

```bash
pnpm add ol
```

また、Vector Tileを使用する場合は、Mapbox GL JS または MapLibre GL JS が必要になる場合があります。

- mapbox-gl: ^1.0.0 || ^2.0.0 || ^3.0.0
- maplibre-gl: ^3.0.0 || ^4.0.0

### ブラウザでのCDN利用

バンドルされていない単体のビルドファイルも提供されています。ブラウザで直接利用する場合は、依存関係（OpenLayers）を先に読み込む必要があります。Maplat Coreはバンドルに含まれているため、個別の読み込みは不要です。

```html
<!-- OpenLayers -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@10/ol.min.css">
<script src="https://cdn.jsdelivr.net/npm/ol@10/dist/ol.min.js"></script>

<!-- Maplat UI -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@maplat/ui@0.11.5/dist/maplat_ui.css">
<script src="https://cdn.jsdelivr.net/npm/@maplat/ui@0.11.5/dist/maplat_ui.umd.js"></script>

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

## 利用方法

### ESM (EcmaScript Modules)
```javascript
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

## APIドキュメント

### MaplatUi
メインクラスです。

#### 静的メソッド
- **`createObject(option: MaplatAppOption): Promise<MaplatUi>`**
  MaplatUiのインスタンスを作成し、初期化が完了するのを待ってから返します。推奨されるインスタンス化の方法です。

#### コンストラクタ
- **`new MaplatUi(option: MaplatAppOption)`**
  インスタンスを作成しますが、初期化の完了は待ちません。`waitReady` プロパティで待機する必要があります。

#### 主なメソッド
- **`remove()`**: アプリケーションを破棄し、リソースを解放します。
- **`updateUrl()`**: 現在の状態に合わせてURLを更新します（`stateUrl`オプション有効時）。

### MaplatAppOption
初期化時に渡すオプションオブジェクトです（主なもの）。

| プロパティ         | 型                  | 説明                                   |
| ------------------ | ------------------- | -------------------------------------- |
| `appid`            | `string`            | アプリケーションID（必須に近い識別子） |
| `pwaManifest`      | `boolean \| string` | PWAマニフェストの使用有無またはパス    |
| `pwaWorker`        | `string`            | Service Workerのパス                   |
| `overlay`          | `boolean`           | オーバーレイモードの有効化             |
| `enableHideMarker` | `boolean`           | マーカー非表示機能の有効化             |
| `enableMarkerList` | `boolean`           | マーカーリスト機能の有効化             |
| `enableBorder`     | `boolean`           | 境界線表示機能の有効化                 |
| `stateUrl`         | `boolean`           | URLによる状態管理の有効化              |
| `enableShare`      | `boolean`           | シェア機能の有効化                     |
| `mapboxToken`      | `string`            | Mapbox利用時のアクセストークン         |

## データ作成
データの作成には[MaplatEditor](https://github.com/code4history/MaplatEditor/)を利用してください。

## 開発

### 準備
リポジトリをクローンし、依存関係をインストールします。
```bash
git clone https://github.com/code4history/Maplat.git
cd Maplat
pnpm install
```

### 開発サーバー
ホットリロード対応の開発サーバーを起動します。
```bash
pnpm dev
```
ブラウザで `http://localhost:5173/` にアクセスしてください。

### ビルド
```bash
pnpm build        # npmパッケージのビルド (dist/)
pnpm build:demo   # デモアプリのビルド (dist-demo/)
```

### テスト
```bash
pnpm test         # テストの実行 (Vitest)
pnpm typecheck    # 型チェック (TypeScript)
pnpm lint         # リントとフォーマット (ESLint/Prettier)
```

## Contributors

This project exists thanks to all the people who contribute. <!--[[Contribute](CONTRIBUTING.md)].-->
<a href="https://github.com/code4history/Maplat/graphs/contributors"><img src="https://opencollective.com/maplat/contributors.svg?width=890&button=false" /></a>


## Backers

Thank you to all our backers! 🙏 [[Become a backer](https://opencollective.com/maplat#backer)]

<a href="https://opencollective.com/maplat#backers" target="_blank"><img src="https://opencollective.com/maplat/backers.svg?width=890"></a>


## Sponsors
Maplat is supported by 
<a href="https://www.locazing.com/" target="_blank"><img src="https://code4history.github.io/Maplat/img/locazing.png" width="150"></a>
<a href="https://www.thedesignium.com/" target="_blank"><img src="https://code4history.github.io/Maplat/img/logo_TheDesignium.png" width="150"></a>
<a href="https://www.browserstack.com/" target="_blank"><img src="https://code4history.github.io/Maplat/img/browserstack-logo-600x315.png" width="150"></a>
<a href="https://zender.co.jp/" target="_blank"><img src="https://code4history.github.io/Maplat/img/Zender_logo_y_color.png" width="150"></a>
<a href="https://www.webimpact.co.jp/" target="_blank"><img src="https://code4history.github.io/Maplat/img/webimpact.jpg" width="150"></a>

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [[Become a sponsor](https://opencollective.com/maplat#sponsor)]

Copyright (c) 2024-2026 Code for History
