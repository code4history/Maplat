// <maplat-ui>（src/element/）の確認ページ demo/element.html の e2e（Core の <maplat-app> の上で動かす）。
// 実行: pnpm exec playwright test --config playwright-element.config.ts
// 既定の playwright.config.ts（testDir ./e2e）に拾われないよう、spec は e2e/element/*.pw.ts に置く。
// スクリーンショットの保存先は環境変数 MAPLAT_UI_SHOTS_DIR（無ければ test-results の下）。
import { defineConfig, devices } from "@playwright/test";

const PORT = 5198;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e/element",
  testMatch: /\.pw\.ts$/,
  outputDir: "./test-results/element",
  timeout: 120_000,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    serviceWorkers: "block",
    viewport: { width: 1280, height: 800 }
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        launchOptions: { args: ["--use-angle=swiftshader", "--use-gl=angle"] }
      }
    }
  ],
  webServer: {
    command: `node_modules/.bin/vite --port ${PORT} --strictPort`,
    url: `${baseURL}/demo/element.html`,
    reuseExistingServer: false,
    timeout: 120_000
  }
});
