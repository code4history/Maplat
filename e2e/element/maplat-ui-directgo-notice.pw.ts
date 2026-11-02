// POI の directgo（吹き出しを出さずに開くリンク）の e2e。demo/element.html（Core の <maplat-app> の上）で、
// 安全でない URL の directgo を開くと遷移も吹き出しも無く「このリンクは開けません」の知らせが 1 回出ること、
// https の directgo は今までどおり遷移して知らせが出ないことを確かめる。
// 外部タイルは単色の PNG に差し替える（ネットワークに依らない）。
import { test, expect, type Page } from "@playwright/test";

/* eslint-disable @typescript-eslint/no-explicit-any */

const TILE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4//8/AwAI/AL+XJ/PQAAAAABJRU5ErkJggg==",
  "base64"
);
const EXTERNAL_TILES =
  /t\.tilemap\.jp|cyberjapandata\.gsi\.go\.jp|tile\.openstreetmap\.org|api\.mapbox\.com|mt\d?\.google/;

const PAGE = "/demo/element.html";
const TARGET = "https://directgo.example.com/target.html";

const ui = (page: Page) => page.locator("maplat-ui#ui");
const toast = (page: Page) => ui(page).locator('[part="toast"]');
const poiModal = (page: Page) => ui(page).locator('[part="poi-modal"]');
/** 状態 URL（ハッシュ）は視点に合わせて書き換わるので、遷移の有無はハッシュの前だけで見る。 */
const pageAddress = (page: Page) => page.url().split("#")[0];
const t = (page: Page, key: string) =>
  page.evaluate(k => (window as any).__maplatUi.t(k) as string, key);

async function openPage(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("pageerror", err => errors.push(String(err.stack ?? err)));
  await page.route(EXTERNAL_TILES, route =>
    route.fulfill({ status: 200, contentType: "image/png", body: TILE_PNG })
  );
  await page.goto(PAGE);
  await expect(page.getByTestId("status")).toHaveAttribute(
    "data-state",
    "ready",
    { timeout: 90_000 }
  );
  return errors;
}

/**
 * トーストの文が書き換わるたびに Node 側へ記録する。exposeFunction はページを移っても残るので、
 * 遷移の直前に出た知らせも取りこぼさない。
 */
async function recordToasts(page: Page): Promise<string[]> {
  const seen: string[] = [];
  await page.exposeFunction("__toastSeen", (text: string) => seen.push(text));
  await page.evaluate(() => {
    const el = (window as any).__maplatUi.shadowRoot.querySelector(
      '[part="toast"]'
    ) as HTMLElement;
    new MutationObserver(() =>
      (window as any).__toastSeen(el.textContent ?? "")
    ).observe(el, { childList: true });
  });
  return seen;
}

/** directgo を持つ POI を足して開く（地図のマーカーを押したときと同じ経路）。 */
async function openDirectgoPoi(page: Page, directgo: unknown) {
  const id = await page.evaluate(
    d =>
      (window as any).__maplatUi.app.addMarker(
        { lnglat: [139.537, 36.249], name: "directgo", directgo: d },
        "main"
      ),
    directgo
  );
  expect(id).toBeTruthy();
  await page.evaluate(
    i => (window as any).__maplatUi.openMarker(i),
    String(id)
  );
}

test("安全でない URL の directgo は遷移せず、開けない知らせを 1 回出す", async ({
  page
}) => {
  const errors = await openPage(page);
  const dialogs: string[] = [];
  page.on("dialog", dialog => {
    dialogs.push(dialog.message());
    void dialog.dismiss();
  });
  const popups: string[] = [];
  page.on("popup", popup => popups.push(popup.url()));
  const before = pageAddress(page);
  const seen = await recordToasts(page);
  const expected = await t(page, "app.cannot_open_link");
  expect(expected).toBe("このリンクは開けません");

  await openDirectgoPoi(page, "javascript:alert(1)");
  await expect(toast(page)).toHaveText(expected);
  await expect(toast(page)).toBeVisible();
  await expect(poiModal(page)).toBeHidden();
  // 知らせはトーストの 1 回だけ（ほかの文やモーダルは出ない）
  await page.waitForTimeout(500);
  expect(seen).toEqual([expected]);
  expect(pageAddress(page)).toBe(before);
  expect(dialogs).toEqual([]);

  // blank 指定でも同じ（新しいタブも開かない）
  await openDirectgoPoi(page, { href: "javascript:alert(1)", blank: true });
  await page.waitForTimeout(500);
  expect(seen).toEqual([expected, expected]);
  await expect(poiModal(page)).toBeHidden();
  expect(popups).toEqual([]);
  expect(pageAddress(page)).toBe(before);
  expect(dialogs).toEqual([]);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("https の directgo は今までどおり遷移し、知らせは出ない", async ({
  page
}) => {
  await page.route(TARGET, route =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><title>target</title><p>target</p>"
    })
  );
  const errors = await openPage(page);
  const seen = await recordToasts(page);
  await openDirectgoPoi(page, TARGET);
  await page.waitForURL(TARGET);
  expect(seen).toEqual([]);
  expect(errors, errors.join("\n")).toEqual([]);
});
