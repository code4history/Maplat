# MaplatAppOption

初期化時に渡すオプションオブジェクトの主なプロパティです。

| プロパティ         | 型                        | 説明                                                             |
| ------------------ | ------------------------- | ---------------------------------------------------------------- |
| `appid`            | `string`                  | アプリケーションID（必須に近い識別子）                           |
| `pwaManifest`      | `boolean \| string`       | PWAマニフェストの使用有無またはパス                              |
| `pwaWorker`        | `string \| false \| null` | Service Workerのパス。`false`／`null` で登録しない（注記を参照） |
| `overlay`          | `boolean`                 | オーバーレイモードの有効化                                       |
| `enableHideMarker` | `boolean`                 | マーカー非表示機能の有効化                                       |
| `enableMarkerList` | `boolean`                 | マーカー一覧UI の有効化                                          |
| `enableBorder`     | `boolean`                 | 境界線表示機能の有効化                                           |
| `stateUrl`         | `boolean`                 | URLによる状態管理の有効化                                        |
| `enableShare`      | `boolean`                 | シェア機能の有効化                                               |
| `mapboxToken`      | `string`                  | Mapbox利用時のアクセストークン                                   |

### pwaWorker について

- 未指定・空文字なら `./service-worker.js` を登録する（従来どおり）。空でない文字列ならその URL を登録する。
- `false`・`null` は Service Worker を登録しない。`pwaManifest` を指定していれば manifest の `<link>` と apple-touch-icon は従来どおり足す。
- ブラウザに登録済みの Service Worker は**解除しない**。`false` へ切り替えたサイトでも、以前に訪れたブラウザには古い Service Worker が残る。
- `enableCache` は Service Worker を要する。**`pwaWorker: false` と `enableCache` を一緒に使うとタイルのキャッシュは効かない**（地図は表示される。`pwaManifest: false` で `enableCache: true` にした場合と同じ）。

## 関連

- [MaplatUi クラス](maplat-ui.ja.md) — 静的メソッド・コンストラクタ・インスタンスメソッド
