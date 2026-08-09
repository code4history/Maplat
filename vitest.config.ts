import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["spec/**/*.test.ts", "spec/**/*.spec.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"],
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
