import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["spec/**/*.test.ts", "spec/**/*.spec.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"],
    // m19-t9 実装レビュー MNR-t9-1: vitest は vite.config.js より vitest.config.ts を
    // 優先して読むため、本ファイルの新設により vite.config.js:109-114 の既存 test ブロック
    // （globals: true 込み）がプロジェクト全体のテスト設定として暗黙に上書きされていた。
    // 既存7 spec はいずれも "vitest" から describe/it/expect を明示 import しており
    // globals には依存していなかったため実害はなかったが、設定の等価性を保つため
    // ここに globals: true を引き継ぐ（対応(a)。vite.config.js 側は触らない＝触り先を増やさない）。
    globals: true,
    // @maplat/coreのプリビルドESMは"ol/proj"等のディレクトリimportを含み
    // Node ESMの素の解決では読めないため、Vitestのモジュールグラフに
    // インライン化してViteのリゾルバで解決させる
    server: {
      deps: {
        inline: [/@maplat\/core/]
      }
    }
  },
  resolve: {
    alias: {
      // m19-t9: @maplat/core（MaplatCore submodule）は package.json の exports map で
      // "./dist/functions" サブパスを公開していない。src/function.ts のテストのみを
      // 目的として、テスト専用スタブへ差し替える。本番ビルド用の vite.config.js には
      // 一切影響しない（別ファイル。設計書 §5.2 参照）。
      "@maplat/core/dist/functions": fileURLToPath(
        new URL("./spec/support/maplat-core-functions.stub.ts", import.meta.url)
      )
    }
  }
});
