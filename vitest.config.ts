import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
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
