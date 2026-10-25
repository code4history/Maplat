import { defineConfig } from "vitest/config";
import { readFileSync } from "node:fs";

// <maplat-ui> の版（src/element/maplat-ui.ts の __MAPLAT_UI_VERSION__）。vite.config.js と同じく package.json から入れる
const PACKAGE_VERSION = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8")
).version;

export default defineConfig({
  define: { __MAPLAT_UI_VERSION__: JSON.stringify(PACKAGE_VERSION) },
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
  }
});
