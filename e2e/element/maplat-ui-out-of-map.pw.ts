// 範囲外の知らせ（トースト）の e2e。demo/element.html（Core の <maplat-app> の上）で、実際の GPS の emulate と
// 地図の切り替えから知らせが出ること、GPS のエラーはモーダルのままであることを確かめる。
// ページの操作は <maplat-ui> の Shadow DOM（open）の部品と、層 A・層 B の公開面だけを使う。
// 外部タイルは単色の PNG に差し替える（ネットワークに依らない）。
import { test, expect, type BrowserContext, type Page } from "@playwright/test";

/* eslint-disable @typescript-eslint/no-explicit-any */

const TILE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4//8/AwAI/AL+XJ/PQAAAAABJRU5ErkJggg==",
  "base64"
);
const EXTERNAL_TILES =
  /t\.tilemap\.jp|cyberjapandata\.gsi\.go\.jp|tile\.openstreetmap\.org|api\.mapbox\.com|mt\d?\.google/;

const PAGE = "/demo/element.html";
/** 地図の範囲の中（館林）と外（東京駅）。 */
const INSIDE = { longitude: 139.5321, latitude: 36.2493, accuracy: 10 };
const OUTSIDE = { longitude: 139.7671, latitude: 35.6812, accuracy: 10 };
/** 広い地図の上のこの位置から狭い地図へ切り替えると、視点が行き先の範囲の外になる。 */
const WIDE_MAP = "kanto_rapid-900913";
const NARROW_MAP = "zendoji_garan";
const FAR_FROM_NARROW = { longitude: 139.47, latitude: 36.27, mercZoom: 14 };

const ui = (page: Page) => page.locator("maplat-ui#ui");
const toast = (page: Page) => ui(page).locator('[part="toast"]');
const gpsModal = (page: Page) => ui(page).locator('[part="gps-modal"]');
const gpsButton = (page: Page) =>
  ui(page).locator('[part="gps"]').locator("button");
const t = (page: Page, key: string) =>
  page.evaluate(k => (window as any).__maplatUi.t(k) as string, key);
const gpsEnabled = (page: Page) =>
  page.evaluate(() => (window as any).__maplatUi.app.gpsEnabled as boolean);
const center = (page: Page) =>
  page.evaluate(() => {
    const { x, y } = (window as any).__maplatUi.app.viewpoint;
    return { x, y } as { x: number; y: number };
  });

/** gps_result の detail を起動前から記録する（ページの準備後に購読すると最初の 1 回を取り逃がす）。 */
async function recordGpsResults(page: Page) {
  await page.addInitScript(() => {
    const w = window as any;
    w.__gpsResults = [];
    const dispatch = EventTarget.prototype.dispatchEvent;
    EventTarget.prototype.dispatchEvent = function (event: Event) {
      if (event.type === "gps_result")
        w.__gpsResults.push((event as CustomEvent).detail);
      return dispatch.call(this, event);
    };
  });
}
const gpsResults = (page: Page) =>
  page.evaluate(() => (window as any).__gpsResults as { error?: string }[]);

async function openPage(page: Page, query = ""): Promise<string[]> {
  const errors: string[] = [];
  page.on("pageerror", err => errors.push(String(err.stack ?? err)));
  await page.route(EXTERNAL_TILES, route =>
    route.fulfill({ status: 200, contentType: "image/png", body: TILE_PNG })
  );
  await page.goto(`${PAGE}${query}`);
  await expect(page.getByTestId("status")).toHaveAttribute(
    "data-state",
    "ready",
    { timeout: 90_000 }
  );
  return errors;
}

async function placeUser(
  context: BrowserContext,
  position: typeof INSIDE
): Promise<void> {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation(position);
}

/** ms の間、トーストとモーダルが一度でも出たかを 100ms ごとに見る（消えた後に見て見逃さないように）。 */
const noticeSeenDuring = (page: Page, ms: number) =>
  page.evaluate(async duration => {
    const root = (window as any).__maplatUi.shadowRoot as ShadowRoot;
    const shown = () =>
      root.querySelector('[part="toast"]')!.classList.contains("show") ||
      !(root.querySelector('[part="gps-modal"]') as HTMLElement).hidden;
    const end = performance.now() + duration;
    while (performance.now() < end) {
      if (shown()) return true;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return shown();
  }, ms);

/** 広い地図で範囲の外へ動かしてから狭い地図へ切り替え、視点が範囲外になる操作をする。 */
async function switchToNarrowMapFromFar(page: Page) {
  await page.evaluate(async id => {
    await (window as any).__maplatUi.app.changeMap(id);
  }, WIDE_MAP);
  await page.evaluate(view => {
    (window as any).__maplatUi.app.setViewpoint(view);
  }, FAR_FROM_NARROW);
  await page.waitForTimeout(500);
  const far = await center(page);
  await page.evaluate(async id => {
    await (window as any).__maplatUi.app.changeMap(id);
  }, NARROW_MAP);
  return far;
}

test("地図の切り替えで視点が範囲外になると、トーストで知らせて標準位置へ動く", async ({
  page
}) => {
  const errors = await openPage(page);
  await page.evaluate(async id => {
    await (window as any).__maplatUi.app.changeMap(id);
  }, NARROW_MAP);
  await page.waitForTimeout(1000);
  const home = await center(page);
  const far = await switchToNarrowMapFromFar(page);
  expect(Math.hypot(far.x - home.x, far.y - home.y)).toBeGreaterThan(100);
  await expect(toast(page)).toHaveClass(/show/);
  await expect(toast(page)).toHaveText(await t(page, "app.out_of_map_area"));
  await expect(gpsModal(page)).toBeHidden();
  await expect
    .poll(
      async () => {
        const now = await center(page);
        return Math.hypot(now.x - home.x, now.y - home.y);
      },
      { timeout: 20_000 }
    )
    .toBeLessThan(1);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("GPS が範囲外のとき、トーストで知らせて GPS を切り、地図は動かさない", async ({
  page,
  context
}) => {
  await placeUser(context, OUTSIDE);
  const errors = await openPage(page);
  const before = await center(page);
  await gpsButton(page).click();
  await expect(toast(page)).toHaveClass(/show/, { timeout: 20_000 });
  await expect(toast(page)).toHaveText(await t(page, "app.out_of_map_desc"));
  await expect.poll(() => gpsEnabled(page)).toBe(false);
  await expect(ui(page).locator('[part="gps"]')).toHaveClass(/disable/);
  await expect(gpsModal(page)).toBeHidden();
  expect(await center(page)).toEqual(before);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("always-gps-on の範囲外: 起動時は何も出さず、ボタンを押すたびにトーストを出す", async ({
  page,
  context
}) => {
  await placeUser(context, OUTSIDE);
  await recordGpsResults(page);
  const errors = await openPage(page, "?always-gps");
  await expect
    .poll(async () => (await gpsResults(page)).map(r => r.error), {
      timeout: 30_000
    })
    .toContain("gps_out_hide");
  expect(await noticeSeenDuring(page, 5000)).toBe(false);

  const expected = await t(page, "app.out_of_map");
  await gpsButton(page).click();
  await expect(toast(page)).toHaveClass(/show/);
  await expect(toast(page)).toHaveText(expected);
  await expect(gpsModal(page)).toBeHidden();
  await expect(toast(page)).not.toHaveClass(/show/, { timeout: 10_000 });

  await gpsButton(page).click();
  await expect(toast(page)).toHaveClass(/show/);
  await expect(toast(page)).toHaveText(expected);
  await expect(gpsModal(page)).toBeHidden();
  expect(errors, errors.join("\n")).toEqual([]);
});

test("対比: 範囲内の GPS ではトーストを出さない", async ({ page, context }) => {
  await placeUser(context, INSIDE);
  await recordGpsResults(page);
  const errors = await openPage(page);
  await gpsButton(page).click();
  await expect
    .poll(async () => (await gpsResults(page)).length, { timeout: 20_000 })
    .toBeGreaterThan(0);
  expect(await gpsEnabled(page)).toBe(true);
  expect(await noticeSeenDuring(page, 1000)).toBe(false);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("対比: presentation-mode のとき、地図の切り替えの範囲外でトーストを出さない", async ({
  page
}) => {
  const errors = await openPage(page);
  await page.evaluate(() => {
    const w = window as any;
    w.__outOfMap = 0;
    w.__maplatUi.presentationMode = true;
    w.__maplatUi.app.addEventListener("outOfMap", () => (w.__outOfMap += 1));
  });
  await switchToNarrowMapFromFar(page);
  await expect
    .poll(() => page.evaluate(() => (window as any).__outOfMap))
    .toBe(1);
  expect(await noticeSeenDuring(page, 1000)).toBe(false);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("対比: 位置情報の拒否は今までどおりモーダルで、トーストにしない", async ({
  page
}) => {
  const errors = await openPage(page);
  await gpsButton(page).click();
  await expect(gpsModal(page)).toBeVisible({ timeout: 20_000 });
  await expect(ui(page).locator('[part="gps-title"]')).toHaveText(
    await t(page, "app.gps_error")
  );
  await expect(ui(page).locator('[part="gps-message"]')).toHaveText(
    await t(page, "app.user_gps_deny")
  );
  await expect(toast(page)).not.toHaveClass(/show/);
  await ui(page).locator('[part="gps-close"]').click();
  await page.evaluate(() =>
    (window as any).__maplatUi.openModalByLegacyName("gpsD")
  );
  await expect(gpsModal(page)).toBeVisible();
  expect(errors, errors.join("\n")).toEqual([]);
});

test("開いている吹き出しを閉じず、URL の om: もフォーカスも動かさない", async ({
  page,
  context
}) => {
  await placeUser(context, OUTSIDE);
  const errors = await openPage(page);
  await page.evaluate(() => {
    const u = (window as any).__maplatUi;
    const layers: { pois?: { namespaceID: string }[] }[] = u.app.listPoiLayers(
      false,
      true
    );
    u.openMarker(layers.flatMap(layer => layer.pois ?? [])[0].namespaceID);
  });
  const modal = ui(page).locator('[part="poi-modal"]');
  await expect(modal).toBeVisible({ timeout: 20_000 });
  await expect
    .poll(() => page.evaluate(() => decodeURIComponent(location.hash)))
    .toContain("/om:");
  const close = ui(page).locator('[part="poi-close"]');
  await close.focus();
  await page.evaluate(() => (window as any).__maplatUi.app.handleGPS(true));
  await expect(toast(page)).toHaveClass(/show/, { timeout: 20_000 });
  await expect(toast(page)).toHaveText(await t(page, "app.out_of_map_desc"));
  await expect(modal).toBeVisible();
  await expect(close).toBeFocused();
  expect(
    await page.evaluate(() => decodeURIComponent(location.hash))
  ).toContain("/om:");
  expect(errors, errors.join("\n")).toEqual([]);
});

test.describe("細い枠でもトーストが <maplat-ui> の箱の内側に収まる", () => {
  /** ドイツ語にして最長の文（app.out_of_map_area）を出し、トーストと枠の矩形を返す。 */
  async function longestToast(page: Page) {
    await page.evaluate(async () => {
      const u = (window as any).__maplatUi;
      u.setAttribute("lang", "de");
      await new Promise(resolve => setTimeout(resolve, 300));
      u.app.dispatchEvent(new CustomEvent("outOfMap", { detail: {} }));
    });
    await expect(toast(page)).toHaveClass(/show/);
    await expect(toast(page)).toHaveText(
      "Angezeigter Bereich ist außerhalb der Karte. Die Karte wird auf die Standardposition verschoben."
    );
    return page.evaluate(() => {
      const u = (window as any).__maplatUi as HTMLElement;
      const box = (e: Element) => {
        const { left, right, top, bottom } = e.getBoundingClientRect();
        return { left, right, top, bottom };
      };
      return {
        frame: box(u),
        toast: box(u.shadowRoot!.querySelector('[part="toast"]')!)
      };
    });
  }
  const expectInside = (rects: Awaited<ReturnType<typeof longestToast>>) => {
    expect(rects.toast.left).toBeGreaterThanOrEqual(rects.frame.left);
    expect(rects.toast.right).toBeLessThanOrEqual(rects.frame.right);
    expect(rects.toast.top).toBeGreaterThanOrEqual(rects.frame.top);
    expect(rects.toast.bottom).toBeLessThanOrEqual(rects.frame.bottom);
  };

  test("幅 320px の画面", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    const errors = await openPage(page);
    expectInside(await longestToast(page));
    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("幅 400px で右に寄せて埋め込んだページ", async ({ page }) => {
    const errors = await openPage(page);
    await page.addStyleTag({
      content:
        "main { display: flex; justify-content: flex-end; } maplat-ui { width: 400px; flex: none; }"
    });
    expectInside(await longestToast(page));
    expect(errors, errors.join("\n")).toEqual([]);
  });
});
