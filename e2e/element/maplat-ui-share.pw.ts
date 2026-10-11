// <maplat-ui> の「共有と状態の保存」の e2e（demo/element.html: Core の <maplat-app> の上。enable-share・state-url 付き）。
//   - 共有のモーダル（アプリの URL・今の表示の URL の QR）・コピーと知らせ
//   - 状態 URL: 地図を切り替える・透過度・視点を変えると URL（#!…）が変わり、その URL で開き直すと同じ状態になる
//   - 吹き出しの共有（開いた POI を含む URL の QR）と、その URL で開き直すと吹き出しも開く
//   - PWA（?pwa で pwa-manifest を付けて開く）: manifest の link と Service Worker の登録（1 件だけ）
// ページの操作は <maplat-ui> の Shadow DOM（open）の部品と、層 A・層 B の公開面だけを使う。
// 外部タイルは単色の PNG に差し替える（maplat-ui-element.pw.ts と同じ）。
import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

/* eslint-disable @typescript-eslint/no-explicit-any */

const TILE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAIAAADTED8xAAACD0lEQVR42u3TQQ0AIAwEwfqXUhU8EYGBftBQBOCgk8wZuGRjr4Sx4u3WgZkEgAAcgQBAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAAAhAAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACQABeQAAgABAACAAEAAIAAYAAQAAgABAACAAEAAIAAYAAQAAgABAACAAEAAIAAYAAQAAgABAACAAEAAIAAYAAQAAgABAACAAEAAIAAYAAQAAgABAACAAEAAIAAYAAQAAgAAQgAATgCAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAkAAAkAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACgJ8GcPkm8F11ptMAAAAASUVORK5CYII=",
  "base64"
);
const realTiles = process.env.MAPLAT_UI_REAL_TILES === "1";
const EXTERNAL_TILES =
  /t\.tilemap\.jp|cyberjapandata\.gsi\.go\.jp|tile\.openstreetmap\.org|api\.mapbox\.com|mt\d?\.google/;
// 尾曳稲荷神社（public/pois/tatebayashi.json）
const POI = {
  longitude: 139.547491,
  latitude: 36.244844,
  name: "尾曳稲荷神社"
};
const PAGE = "/demo/element.html";
const LABEL = "core";
// 切り替え先の古地図（起動時の地図 tatebayashi_ojozu とは別のもの）
const TARGET_MAP = "tatebayashi_castle_akimoto";

const shotsDir = process.env.MAPLAT_UI_SHOTS_DIR;

async function shot(
  page: Page,
  name: string,
  testInfo: { outputPath: (n: string) => string }
) {
  await page.waitForTimeout(800);
  const path = shotsDir
    ? join(shotsDir, `${LABEL}-${name}.png`)
    : testInfo.outputPath(`${LABEL}-${name}.png`);
  if (shotsDir) mkdirSync(shotsDir, { recursive: true });
  await page.screenshot({ path });
}

async function openPage(page: Page, url = PAGE): Promise<string[]> {
  const errors: string[] = [];
  page.on("pageerror", err => errors.push(String(err.stack ?? err)));
  if (!realTiles) {
    await page.route(EXTERNAL_TILES, route =>
      route.fulfill({ status: 200, contentType: "image/png", body: TILE_PNG })
    );
  }
  await page.goto(url);
  await expect(page.getByTestId("status")).toHaveAttribute(
    "data-state",
    "ready",
    { timeout: 90_000 }
  );
  return errors;
}

async function newPage(context: BrowserContext, url: string) {
  const page = await context.newPage();
  const errors = await openPage(page, url);
  return { page, errors };
}

const appState = (page: Page) =>
  page.evaluate(() => {
    const app = (window as any).__maplatUi.app;
    return {
      mapID: app.currentMapId as string,
      transparency: app.getTransparency() as number,
      viewpoint: app.viewpoint as {
        x: number;
        y: number;
        zoom: number;
        rotation: number;
      }
    };
  });
const app = <T>(page: Page, fn: string, ...args: unknown[]) =>
  page.evaluate(
    ([f, a]) => {
      const el = (window as any).__maplatUi.app;
      return el[f as string](...(a as unknown[]));
    },
    [fn, args] as const
  ) as Promise<T>;
/** URL の "#!" の後ろ（% を解いたもの）。 */
const statePath = (page: Page) =>
  page.evaluate(() =>
    location.hash.startsWith("#!")
      ? decodeURIComponent(location.hash.slice(2))
      : ""
  );

test("共有のモーダル・QR・コピー・状態 URL（切り替えて URL が変わり、その URL で開き直すと同じ状態）", async ({
  page,
  context
}, testInfo) => {
  test.setTimeout(240_000);
  const errors = await openPage(page);
  const ui = page.locator("maplat-ui#ui");

  // ---- 起動したら今の状態を URL に書く ----
  const start = await appState(page);
  await expect
    .poll(() => statePath(page), { timeout: 15_000 })
    .toMatch(
      new RegExp(`^s:${start.mapID}/(b:[^/]+/)?x:[-0-9.e]+/y:[-0-9.e]+/z:`)
    );

  // ---- 共有のモーダル（アプリの URL と今の表示の URL の QR）----
  const shareButton = ui.locator('[part="share"]');
  await expect(shareButton).toBeVisible();
  await shareButton.locator("button").click();
  const modal = ui.locator('[part="share-modal"]');
  await expect(modal).toBeVisible();
  await expect(ui.locator('[part="share-title"]')).toHaveText("共有");
  const qrApp = ui.locator('[part="share-qr-app"] svg');
  await expect(qrApp).toBeVisible({ timeout: 15_000 });
  const origin = new URL(page.url()).origin;
  await expect(qrApp).toHaveAttribute("data-url", `${origin}${PAGE}`);
  const box = await qrApp.boundingBox();
  expect(Math.round(box!.width)).toBe(128);
  await expect(ui.locator('[part="share-view"]')).toBeVisible();
  const qrView = ui.locator('[part="share-qr-view"] svg');
  await expect(qrView).toBeVisible();
  expect(await qrView.getAttribute("data-url")).toBe(page.url());
  expect(page.url()).toContain("#!s:");
  await shot(page, "share-1-modal", testInfo);

  // ---- コピー（Clipboard API）と知らせ ----
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin
  });
  await modal.locator('[data-share="cp_view"]').click();
  const toast = ui.locator('[part="toast"]');
  await expect(toast).toHaveClass(/show/);
  await expect(toast).toHaveText("クリップボードにコピーされました");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    page.url()
  );
  await shot(page, "share-2-copied", testInfo);
  await ui.locator('[part="share-close"]').click();
  await expect(modal).toBeHidden();

  // ---- 地図を切り替えると URL の地図（s:）が変わる ----
  await ui.locator('[part="map-title-button"]').click();
  await ui
    .locator(`[part="map-menu-item"][data-map-id="${TARGET_MAP}"]`)
    .click();
  await expect
    .poll(() => statePath(page), { timeout: 20_000 })
    .toMatch(new RegExp(`^s:${TARGET_MAP}/`));
  // 透過度（スライダー）→ t:
  await ui.locator('[part="slider"]').fill("70");
  await expect
    .poll(() => statePath(page), { timeout: 10_000 })
    .toContain("/t:30/");
  // 視点（位置・zoom・回転）→ x・y・z・r
  await app(page, "setViewpoint", {
    longitude: POI.longitude,
    latitude: POI.latitude,
    mercZoom: 17,
    rotation: 30
  });
  await expect.poll(() => statePath(page), { timeout: 15_000 }).toMatch(/\/r:/);
  await page.waitForTimeout(1000);
  const before = await appState(page);
  const url = page.url();
  // 旧 updateUrl と同じ並び（b: は背景地図が今の地図と違うときだけ）
  const path = await statePath(page);
  expect(path.startsWith(`s:${TARGET_MAP}/`)).toBe(true);
  expect(
    path.endsWith(
      `/t:30/x:${before.viewpoint.x}/y:${before.viewpoint.y}/z:${before.viewpoint.zoom}/r:${before.viewpoint.rotation}`
    )
  ).toBe(true);
  await shot(page, "state-1-before-reopen", testInfo);

  // ---- その URL で開き直すと同じ状態 ----
  const second = await newPage(context, url);
  await expect
    .poll(async () => (await appState(second.page)).mapID, { timeout: 20_000 })
    .toBe(TARGET_MAP);
  await expect
    .poll(
      async () => {
        const s = await appState(second.page);
        return Math.hypot(
          s.viewpoint.x - before.viewpoint.x,
          s.viewpoint.y - before.viewpoint.y
        );
      },
      { timeout: 20_000 }
    )
    .toBeLessThan(1e-6 * Math.max(1, Math.abs(before.viewpoint.x)));
  const after = await appState(second.page);
  expect(after.transparency).toBe(30);
  expect(after.viewpoint.zoom).toBeCloseTo(before.viewpoint.zoom, 6);
  expect(after.viewpoint.rotation).toBeCloseTo(before.viewpoint.rotation, 4);
  await expect(second.page.locator('maplat-ui#ui [part="slider"]')).toHaveValue(
    "70"
  );
  await shot(second.page, "state-2-reopened", testInfo);
  await second.page.close();

  expect(errors, errors.join("\n")).toEqual([]);
  expect(second.errors, second.errors.join("\n")).toEqual([]);
});

test("吹き出しの共有（開いた POI を含む URL の QR）と、その URL で開き直すと吹き出しも開く", async ({
  page,
  context
}, testInfo) => {
  test.setTimeout(240_000);
  const errors = await openPage(page);
  const ui = page.locator("maplat-ui#ui");
  const id = await page.evaluate(name => {
    const app = (window as any).__maplatUi.app;
    for (const layer of app.listPoiLayers(false, true)) {
      for (const poi of layer.pois ?? []) {
        const n = typeof poi.name === "string" ? poi.name : poi.name?.ja;
        if (typeof n === "string" && n.includes(name))
          return poi.namespaceID as string;
      }
    }
    return null;
  }, POI.name);
  expect(id, "the sample POI should exist").not.toBeNull();
  await page.evaluate(i => (window as any).__maplatUi.openMarker(i), id!);
  const modal = ui.locator('[part="poi-modal"]');
  await expect(modal).toBeVisible();
  await expect(ui.locator('[part="poi-title"]')).toContainText(POI.name);
  await expect.poll(() => statePath(page)).toContain(`/om:${id}`);
  const share = ui.locator('[part="poi-share"]');
  await expect(share).toBeVisible();
  await expect(share.locator('[data-share="cp_view"]')).toBeVisible();
  const qr = ui.locator('[part="poi-qr"] svg');
  await expect(qr).toBeVisible({ timeout: 15_000 });
  const qrUrl = (await qr.getAttribute("data-url"))!;
  expect(decodeURIComponent(qrUrl)).toContain(`/om:${id}`);
  await ui.locator('[part="poi-qr"]').scrollIntoViewIfNeeded();
  await shot(page, "share-3-poi", testInfo);

  const second = await newPage(context, qrUrl);
  await expect(
    second.page.locator('maplat-ui#ui [part="poi-modal"]')
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    second.page.locator('maplat-ui#ui [part="poi-title"]')
  ).toContainText(POI.name);
  await shot(second.page, "state-3-poi-reopened", testInfo);
  // 閉じると URL から om が消える
  await second.page.locator('maplat-ui#ui [part="poi-close"]').click();
  await expect.poll(() => statePath(second.page)).not.toContain("/om:");
  await second.page.close();

  expect(errors, errors.join("\n")).toEqual([]);
  expect(second.errors, second.errors.join("\n")).toEqual([]);
});

test.describe("PWA（pwa-manifest）", () => {
  test.use({ serviceWorkers: "allow" });

  test("manifest の link を足し、Service Worker を 1 件だけ登録する", async ({
    page
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", msg => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    const errors = await openPage(page, `${PAGE}?pwa`);
    const manifest = await page.evaluate(
      () =>
        document.head
          .querySelector('link[rel="manifest"]')
          ?.getAttribute("href") ?? null
    );
    expect(manifest).toBe("./pwa/sample_manifest.json");
    await expect
      .poll(
        () =>
          page.evaluate(async () =>
            (await navigator.serviceWorker.getRegistrations()).map(r => ({
              scope: r.scope,
              script: (r.installing ?? r.waiting ?? r.active)?.scriptURL ?? null
            }))
          ),
        { timeout: 30_000 }
      )
      .toEqual([
        {
          scope: new URL("/", page.url()).href,
          script: new URL("/service-worker.js", page.url()).href
        }
      ])
      .catch((err: Error) => {
        throw new Error(
          `${err.message}\nconsole errors: ${consoleErrors.join(" | ")}`
        );
      });
    // manifest の icons から apple-touch-icon を足す
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.head.querySelectorAll('link[rel="apple-touch-icon"]')
              .length
        )
      )
      .toBeGreaterThan(0);
    expect(errors, errors.join("\n")).toEqual([]);
  });
});
