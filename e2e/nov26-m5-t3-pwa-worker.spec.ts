// nov26-m5-t3 AC4: 実ブラウザで pwaWorker: false / null のとき Service Worker を登録しない。
// 設計: NayutaProducts docs/superpowers/specs/2026-10-11-nov26-m5-t3-task-design.md（v2）§7 AC4
//
// 観測: page.addInitScript で navigator.serviceWorker.register を包み、呼ばれた URL を
// window.__swRegisterCalls に積んでから元の関数を呼ぶ。陽性対照（worker=default）で
// 呼び出しが記録されることを毎回確かめる（これが赤なら (i) の 0 件は根拠にならない）。
// 陽性対照は登録の成否・getRegistrations に依存しない（R-T3-4: dev サーバで workbox の
// install が失敗しうる）。
import { test, expect, type Page } from "@playwright/test";

declare global {
  interface Window {
    __swRegisterCalls: string[];
  }
}

const FIXTURE = "/e2e/fixtures/nov26-m5-t3-pwa.html";

const wrapRegister = () => {
  window.__swRegisterCalls = [];
  const sw = navigator.serviceWorker;
  if (!sw) return;
  const original = sw.register.bind(sw);
  sw.register = ((scriptURL: string | URL, options?: RegistrationOptions) => {
    window.__swRegisterCalls.push(String(scriptURL));
    return original(scriptURL, options);
  }) as typeof sw.register;
};

const openFixture = async (page: Page, query: string) => {
  const swRequests: string[] = [];
  const onRequest = (req: { url(): string }) => {
    if (new URL(req.url()).pathname.endsWith("service-worker.js")) {
      swRequests.push(req.url());
    }
  };
  page.on("request", onRequest);
  page.context().on("request", onRequest);
  const pageErrors: Error[] = [];
  page.on("pageerror", err => pageErrors.push(err));

  await page.addInitScript(wrapRegister);
  await page.goto(`${FIXTURE}?${query}`);
  await expect(page.locator("#status")).toHaveText("READY", {
    timeout: 60_000
  });
  await page.waitForTimeout(2_000);
  return { swRequests, pageErrors };
};

for (const worker of ["false", "null"]) {
  test(`(i) worker=${worker}: register を呼ばず、登録・SW スクリプトの要求が 0、manifest と apple-touch-icon は足す`, async ({
    page
  }) => {
    const { swRequests } = await openFixture(page, `worker=${worker}`);
    expect(await page.evaluate(() => window.__swRegisterCalls)).toEqual([]);
    expect(
      await page.evaluate(
        async () => (await navigator.serviceWorker.getRegistrations()).length
      )
    ).toBe(0);
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(2);
    expect(swRequests).toEqual([]);
  });
}

test("(ii) 陽性対照 worker=default: register の呼び出しが記録される", async ({
  page
}) => {
  await openFixture(page, "worker=default");
  const calls = await page.evaluate(() => window.__swRegisterCalls);
  expect(calls.filter(u => u.endsWith("/service-worker.js")).length)
    .toBeGreaterThanOrEqual(1);
});

test("(iii) worker=false&cache=1: 地図は READY になり、pageerror 0・register 0", async ({
  page
}) => {
  const { pageErrors } = await openFixture(page, "worker=false&cache=1");
  expect(pageErrors).toEqual([]);
  expect(await page.evaluate(() => window.__swRegisterCalls)).toEqual([]);
});
