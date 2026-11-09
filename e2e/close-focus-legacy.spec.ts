/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "block" });
test("F10: 旧 API の起動経路でもスクリプトのフォーカスに囲いを出さない", async ({
  page
}) => {
  test.setTimeout(120_000);
  await page.route("**/*", route =>
    ["localhost", "127.0.0.1"].includes(new URL(route.request().url()).hostname)
      ? route.continue()
      : route.abort()
  );
  await page.goto("/index.html?appid=sample&lang=ja");
  await expect(page.locator("#status")).toHaveText(
    /^READY appid=sample lang=ja$/,
    { timeout: 90_000 }
  );
  await page.evaluate(async () => {
    const ui = document.querySelector("maplat-ui") as any;
    await ui.ready;
    ui.openMarker("poi-template-nunjucks");
  });
  const close = page.locator('maplat-ui [part="poi-close"]');
  await expect(close).toBeFocused();
  await expect(close).toHaveCSS("outline-style", "none");
  await expect(close).toHaveCSS("opacity", "0.2");
});
