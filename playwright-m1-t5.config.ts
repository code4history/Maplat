import { defineConfig, devices } from "@playwright/test";

// M1-T5 専用の Playwright 設定。
//
// なぜ既定の playwright.config.ts を使わないか（実装レビュー Phase 1 の根本原因）:
//   既定は baseURL/webServer とも 5176 で reuseExistingServer: !CI である。
//   worktree を並行運用していると、**別 worktree（m1-t4）が起動した 5176 の Vite**を
//   同一プロジェクトのサーバーとみなして再利用してしまう。
//   その結果 t5 の probe asset を要求しても t4 側の index.html が返り、
//   `<script src>` として評価されて "Unexpected token '<'" になっていた。
//
// 対策:
//   - t5 専用ポート 5178 を使う（既定の 5176 と衝突させない）
//   - `--strictPort` により、ポートが埋まっていれば**黙って別サーバーへ繋がず明確に失敗する**
//   - 既存サーバーの再利用は PLAYWRIGHT_USE_EXISTING_SERVER=1 の明示があるときだけ許す
const PORT = 5178;
const REUSE = process.env.PLAYWRIGHT_USE_EXISTING_SERVER === "1";

export default defineConfig({
  testDir: "./e2e",
  testMatch: ["**/m1-t5-poi-html-isolation.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
    headless: !!process.env.CI || !process.env.DISPLAY
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
    command: `vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: REUSE
  }
});
