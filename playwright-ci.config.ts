import { defineConfig, devices } from "@playwright/test";

// CI環境用の最小限の設定
export default defineConfig({
  testDir: "./e2e",
  // m1-t4 のブラウザ E2E は monorepo 専用である。spec が fixtures を隣接 checkout
  // （../MaplatCore/spec/fixtures/xss-payloads）から import しており、spec/ は npm 梱包に
  // 含まれないため、単独 clone の CI では 1.0.0-rc1 公開後も解決できない（2026-08-07 実測:
  // 旧注記の「一斉publish 後に撤去」は publish だけが障害という誤前提で、撤去したところ
  // Cannot find module で fail した）。AC5b は monorepo 側の
  // `pnpm --filter @maplat/ui run test:e2e:m1-t4` が正本の実行経路として担保する。
  testIgnore: ["**/m1-t4-sanitize-browser.spec.ts"],
  fullyParallel: true,
  forbidOnly: true,
  retries: 2,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5176",
    trace: "on-first-retry",
    headless: true
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: ["--use-angle=swiftshader", "--use-gl=angle"]
        }
      }
    }
  ],
  webServer: {
    command: "pnpm run dev:e2e",
    url: "http://localhost:5176",
    reuseExistingServer: true
  }
});
