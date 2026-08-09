// m19-t9: @maplat/core（MaplatCore submodule）は package.json の exports map で
// "./dist/functions" サブパスを公開していない。src/function.ts のテストのみを目的として、
// 実体を模したスタブへ差し替える（MaplatCore 側は一切変更しない。設計書 §5 参照）。
//
// このファイルは *.spec.ts ではないため vitest の include には引っかからず、
// テストスイートとしては実行されない。vitest.config.ts の resolve.alias 経由でのみ使われる。
//
// このスタブは「@maplat/core 側の normalizeArg の実装」を模倣する責務を持たない。
// src/function.ts 自身が持つロジック（旧キー検出と Error 送出）だけを単体分離してテストする
// ための、標準的な依存差し替えである。
export function normalizeArg(
  options: Record<string, unknown>
): Record<string, unknown> {
  return options;
}
