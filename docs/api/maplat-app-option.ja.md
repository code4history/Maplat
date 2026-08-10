# MaplatAppOption

初期化時に渡すオプションオブジェクトの主なプロパティです。

| プロパティ         | 型                  | 説明                                   |
| ------------------ | ------------------- | -------------------------------------- |
| `appid`            | `string`            | アプリケーションID（必須に近い識別子） |
| `pwaManifest`      | `boolean \| string` | PWAマニフェストの使用有無またはパス    |
| `pwaWorker`        | `string`            | Service Workerのパス                   |
| `overlay`          | `boolean`           | オーバーレイモードの有効化             |
| `enableHideMarker` | `boolean`           | マーカー非表示機能の有効化             |
| `enableMarkerList` | `boolean`           | マーカー一覧UI の有効化                |
| `enableBorder`     | `boolean`           | 境界線表示機能の有効化                 |
| `stateUrl`         | `boolean`           | URLによる状態管理の有効化              |
| `enableShare`      | `boolean`           | シェア機能の有効化                     |
| `mapboxToken`      | `string`            | Mapbox利用時のアクセストークン         |

## 関連

- [MaplatUi クラス](maplat-ui.ja.md) — 静的メソッド・コンストラクタ・インスタンスメソッド
