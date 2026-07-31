import { defineConfig, devices } from '@playwright/test';

// CI環境用の最小限の設定
export default defineConfig({
  testDir: './e2e',
  // m1-t4 のブラウザ E2E は monorepo 専用である。
  // 単独 clone の CI は @maplat/core を npm 公開版（0.13.2）から引くが、
  // 公開版には sanitizeHtml / buildSlideAttrs も spec/fixtures も存在しない
  // （実測: npm pack で確認）。ここで走らせても検証対象が無く無意味なため除外する。
  // monorepo 側は `pnpm --filter @maplat/ui run test:e2e:m1-t4` が正本の実行経路であり、
  // AC5b はそちらで担保する。m9 の一斉publish 後にこの除外を撤去すること。
  testIgnore: ['**/m1-t4-sanitize-browser.spec.ts'],
  fullyParallel: true,
  forbidOnly: true,
  retries: 2,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5176',
    trace: 'on-first-retry',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--use-angle=swiftshader', '--use-gl=angle']
        }
      },
    },
  ],
  webServer: {
    command: 'pnpm run dev:e2e',
    url: 'http://localhost:5176',
    reuseExistingServer: true,
  },
});
