# UI/Core Lifecycle (Maplat UI)

## 概要
Maplat UI は MaplatCore のライフサイクルフェーズに沿って初期化します。
カスタム UI も `appOption.uiHooks` でフェーズに接続できます。

## フェーズ順序
1. `lifecycle:setting-loaded`
2. `lifecycle:appdata-ready`
3. `lifecycle:ui-configure`
4. `lifecycle:core-dom-ready`
5. `lifecycle:ui-dom-ready`
6. `lifecycle:core-ready`
7. `lifecycle:ui-ready`

## Maplat UI のフェーズ対応
- `appdata-ready`: UI 状態の初期化（フラグ、restore、DOM 基盤）
- `ui-configure`: i18n 初期化
- `ui-dom-ready`: DOM 翻訳、モーダル初期化、スプラッシュ、タイトル設定
- `core-ready`: コントロール、地図イベント、GPS の接続

## フック (uiHooks)
`appOption.uiHooks` で以下を登録できます。
- `onSettingLoaded`
- `onAppdataReady`
- `onUiConfigure`
- `onCoreDomReady`
- `onUiDomReady`
- `onCoreReady`
- `onUiReady`

フックは値または Promise を返せます。例外時は `lifecycle:error` が発火し、
以降のフェーズは停止します。

## 移行メモ
旧イベント（`appdata` / `uiPrepare`）は標準 UI では使用しません。
