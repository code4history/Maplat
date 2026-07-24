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

## 関連

- [MaplatAppOption](maplat-app-option.ja.md) — オプションオブジェクトのプロパティ
- [UI コアライフサイクル](../ui-core-lifecycle.ja.md) — ライフサイクルフェーズと uiHooks
