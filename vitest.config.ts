import { defineConfig } from "vitest/config";

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
  }
});
