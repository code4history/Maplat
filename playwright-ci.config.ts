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
  //
  // oct26-m9-t1 の AC-10（Chuci の cc-swiper の矢印の見た目）も monorepo 専用である。`@c4h/chuci` が
  // workspace link で修正済み Chuci の dist を解決する状態でのみ PASS し、単独 clone の CI は npm の
  // `@c4h/chuci@1.0.0`（修正前）を解決して必ず FAIL する。lock が `@c4h/chuci@1.0.1` 以降を解決した時点で外す
  // （設計 docs/superpowers/specs/2026-09-14-oct26-m9-t1-design.md §9.4 の申し送り）。
  testIgnore: [
    "**/m1-t4-sanitize-browser.spec.ts",
    "**/oct26-m9-t1-chuci-arrow.spec.ts"
  ],
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
