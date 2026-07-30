import { defineConfig, devices } from '@playwright/test';

// CI環境用の最小限の設定
export default defineConfig({
  testDir: './e2e',
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
