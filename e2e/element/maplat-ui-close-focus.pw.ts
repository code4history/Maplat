/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, type Page, type Locator } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const TEMPLATE_POI_ID = "poi-template-nunjucks";
const ui = (page: Page) => page.locator("maplat-ui#ui");
const close = (page: Page, prefix = "poi") =>
  ui(page).locator(`[part="${prefix}-close"]`);
const button = (page: Page, name: string) =>
  ui(page).locator(`button[part="${name}"], [part="${name}"] button`);
const openPoi = (page: Page) =>
  page.evaluate(
    id => (window as any).__maplatUi.openMarker(id),
    TEMPLATE_POI_ID
  );
async function openPage(page: Page, url = "/demo/element.html") {
  await page.route("**/*", route => {
    const url = new URL(route.request().url());
    return ["localhost", "127.0.0.1"].includes(url.hostname)
      ? route.continue()
      : route.abort();
  });
  await page.goto(url);
  await expect(page.getByTestId("status")).toHaveAttribute(
    "data-state",
    "ready",
    { timeout: 90_000 }
  );
  // 読み込み中の覆い（splash）が消えるまで待つ。ready の直後は覆いが操作ボタンの上に残り、
  // 座標で押したクリックが覆いに当たる（遅い環境で起きる）。
  await expect(ui(page).locator('[part="splash"]')).toBeHidden();
}
async function tabTo(page: Page, target: Locator) {
  for (let i = 0; i < 100; i++) {
    await page.keyboard.press("Tab");
    if (await target.evaluate(el => el.matches(":focus"))) return;
  }
  throw new Error(`Tab で到達できません: ${target}`);
}
async function keyboardPoi(page: Page) {
  await tabTo(page, button(page, "marker-list"));
  await page.keyboard.press("Enter");
  const layer = ui(page).locator(
    '[part="marker-list-layer"][data-layer-key="poi_template_nunjucks_demo"]'
  );
  await tabTo(page, layer.locator('[part="marker-list-layer-label"]'));
  await page.keyboard.press("Enter");
  await tabTo(
    page,
    layer.locator(`[part="marker-list-poi"][data-poi-id$="${TEMPLATE_POI_ID}"]`)
  );
  await page.keyboard.press("Enter");
}
async function ring(target: Locator) {
  return target.evaluate(el => {
    const s = getComputedStyle(el);
    return {
      style: s.outlineStyle,
      width: s.outlineWidth,
      color: s.outlineColor,
      offset: s.outlineOffset,
      opacity: s.opacity,
      fv: el.matches(":focus-visible")
    };
  });
}
async function expectRing(target: Locator, keyboard = false) {
  await expect(target).toBeFocused();
  await expect
    .poll(() => ring(target))
    .toMatchObject(
      keyboard
        ? {
            style: "solid",
            width: "2px",
            color: "rgba(120, 5, 8, 0.9)",
            offset: "1px",
            opacity: "1",
            fv: true
          }
        : { style: "none", opacity: "0.2" }
    );
}
async function shot(page: Page, name: string) {
  const dir = process.env.MAPLAT_UI_SHOTS_DIR;
  if (!dir) return;
  await mkdir(dir, { recursive: true });
  await ui(page)
    .locator('[part="poi-modal"] .header')
    .screenshot({ path: join(dir, `${name}.png`) });
  console.log(name, JSON.stringify(await ring(close(page))));
}

test("スクリプトで開くと囲いを出さずフォーカスを保つ", async ({ page }) => {
  await openPage(page);
  await openPoi(page);
  await shot(page, "script");
  await expectRing(close(page));
});
test("状態 URL から復元しても囲いを出さない", async ({ page, browser }) => {
  await openPage(page);
  await openPoi(page);
  const url = await page.evaluate(() =>
    (window as any).__maplatUi.getShareUrl("view")
  );
  expect(decodeURIComponent(url)).toContain("/om:");
  const fresh = await browser.newContext({ serviceWorkers: "block" });
  try {
    const restored = await fresh.newPage();
    await openPage(restored, url);
    await expectRing(close(restored));
  } finally {
    await fresh.close();
  }
});
test("フォーカスできるボタンを押した後も囲いを出さない", async ({ page }) => {
  await openPage(page);
  const control = button(page, "zoom-in");
  const box = await control.boundingBox();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await expect(control).toBeFocused();
  await openPoi(page);
  await expectRing(close(page));
});
test("地図 canvas を押しただけの後も囲いを出さない", async ({ page }) => {
  await openPage(page);
  const canvas = ui(page).locator("maplat-app canvas").first();
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(
    "BODY"
  );
  await openPoi(page);
  await shot(page, "canvas");
  await expectRing(close(page));
});
test("Tab と Enter で一覧から開くと共通の囲いを出す", async ({ page }) => {
  await openPage(page);
  await keyboardPoi(page);
  await shot(page, "keyboard");
  await expectRing(close(page), true);
});
test("Tab で離れて Shift+Tab で戻ると囲いを出す", async ({ page }) => {
  await openPage(page);
  await openPoi(page);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await shot(page, "tab-return");
  await expectRing(close(page), true);
});
test("フォーカスを残したまま矢印キーで囲いを出す", async ({ page }) => {
  await openPage(page);
  await openPoi(page);
  await page.keyboard.press("ArrowRight");
  await expectRing(close(page), true);
});
test("Shift だけでは囲いを出さない", async ({ page }) => {
  await openPage(page);
  await openPoi(page);
  await page.keyboard.press("Shift");
  await expectRing(close(page));
});
for (const [prefix, control, legacy] of [
  ["poi", "", ""],
  ["marker-list", "marker-list", "marker_list"],
  ["share", "share", "share"],
  ["map-info", "info", "map"],
  ["gps", "gps", "gpsW"],
  ["help", "help", "help"]
]) {
  for (const keyboard of [false, true]) {
    test(`ダイアログ: ${prefix} を${keyboard ? "キーボード" : "スクリプト"}で開く`, async ({
      page
    }) => {
      await openPage(page);
      if (keyboard) {
        if (prefix === "poi") await keyboardPoi(page);
        else {
          await tabTo(page, button(page, control));
          await page.keyboard.press("Enter");
        }
      } else if (prefix === "poi") await openPoi(page);
      else if (prefix === "gps")
        await page.evaluate(() =>
          (window as any).__maplatUi.app.dispatchEvent(
            new CustomEvent("gps_result", { detail: { error: "gps_miss" } })
          )
        );
      else
        await page.evaluate(
          name => (window as any).__maplatUi.openModalByLegacyName(name),
          legacy
        );
      await expectRing(close(page, prefix), keyboard);
    });
  }
}
test("Escape で閉じて開き直しても属性が残らず例外もない", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  await openPage(page);
  await openPoi(page);
  await page.keyboard.press("Escape");
  await expect(ui(page).locator('[part="poi-modal"]')).toBeHidden();
  await expect(close(page)).not.toHaveAttribute("data-focus-origin");
  // ポインタ操作へ戻してから、再びスクリプトで開く。
  await button(page, "zoom-in").click();
  await openPoi(page);
  await expectRing(close(page));
  expect(errors).toEqual([]);
});
test("hover は属性を解除せず、濃さを 0.5 にする", async ({ page }) => {
  await openPage(page);
  await openPoi(page);
  const before = await close(page).getAttribute("data-focus-origin");
  await close(page).hover();
  await expect(close(page)).toHaveCSS("opacity", "0.5");
  expect(await close(page).getAttribute("data-focus-origin")).toBe(before);
});
