// 旧 API の互換層のレビューの直しを実地図で確かめる e2e。
//
//  `ui.xyToMapIDs(画面の中心の sys 座標)` が reject せず、その点に重なる別の地図の mapID を返す
//      （今の地図は入らない。地図の外の点は空）。結果は層 B の `mapsAt` と同じ
//  地図の箱が画面の左上に無いページ（左 120px・上 80px の余白）でも、`showContextMenu` が
//      押した位置（`lastClickPixel`）に出る
//  m1: 透過度のスライダーを利用者が動かすと、`sliderNew.get("slidervalue")` と `propertychange` に映る
//
// fixture は凍結の `e2e/fixtures/legacy-api.html`（中身は変えない。開いた後にページの余白を足す）。
// 実行: PLAYWRIGHT_SKIP_BROWSER_GC=1 node_modules/.bin/playwright test --workers=1 e2e/legacy-review-fixes.spec.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, type Page } from "@playwright/test";

const FIXTURE = "/e2e/fixtures/legacy-api.html";
const OVERLAYS = ["tatebayashi_ojozu", "tatebayashi_castle_akimoto", "tatebayashi_kaei_jokamachi"];

async function open(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(String(e.message ?? e)));
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(FIXTURE);
  await expect(page.locator("#status")).toHaveText("READY", { timeout: 120_000 });
  await page.waitForFunction(() => (document.querySelector("maplat-ui") as any)?.ready?.then?.(() => true), null, {
    timeout: 120_000
  });
  return errors;
}

test("xyToMapIDs は実地図で reject せず、重なる別の地図を範囲の狭い順に返す", async ({ page }) => {
  test.setTimeout(180_000);
  const errors = await open(page);
  // 重ねる地図の範囲（envelope）は、地図の準備（ready）の後も各地図の設定ファイルを読み終えるまで揃わない
  // （旧の cacheHash と同じ）。揃うまで待ってから比べる（揃わなければ 30 秒で失敗）
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const ui = (window as any).__maplatUi;
          const ids: string[] = await ui.xyToMapIDs(ui.core.mapObject.getView().getCenter());
          return ids.length;
        }),
      { timeout: 30_000 }
    )
    .toBeGreaterThan(0);
  const result = await page.evaluate(async () => {
    const ui = (window as any).__maplatUi;
    const host = document.querySelector("maplat-ui") as any;
    const center = ui.core.mapObject.getView().getCenter();
    const ids: string[] = await ui.xyToMapIDs(center);
    // 同じ点を層 B の mapsAt に経緯度で渡した結果（互換層は直して渡すだけ）
    const merc = await ui.core.from.sysCoord2MercAsync(center);
    const R = 6378137;
    const lngLat = {
      longitude: ((merc[0] / R) * 180) / Math.PI,
      latitude: ((2 * Math.atan(Math.exp(merc[1] / R)) - Math.PI / 2) * 180) / Math.PI
    };
    const direct: string[] = await host.mapsAt(lngLat, 10);
    // 地図の外（画面の中心から大きく離れた点）は空
    const far: string[] = await ui.xyToMapIDs([center[0] + 1e9, center[1] + 1e9]);
    return { current: ui.core.from.mapID, ids, direct, far };
  });
  expect(result.current).toBe("tatebayashi_ojozu");
  expect(Array.isArray(result.ids)).toBe(true);
  expect(result.ids).toEqual(result.direct);
  expect(result.ids.length, JSON.stringify(result)).toBeGreaterThan(0);
  expect(result.ids).not.toContain(result.current);
  for (const id of result.ids) expect(OVERLAYS).toContain(id);
  expect(result.far).toEqual([]);
  expect(errors).toEqual([]);
});

test("地図の箱が左上に無いページでも、showContextMenu は押した位置に出る", async ({ page }) => {
  test.setTimeout(180_000);
  const errors = await open(page);
  // 地図の箱（.mainview）を左 120px・上 80px ずらす（fixture のファイルは変えない）
  await page.addStyleTag({ content: ".mainview { left: 120px !important; top: 80px !important; }" });
  await page.waitForTimeout(500);
  const host = page.locator("maplat-ui");
  const box = (await host.boundingBox())!;
  expect(box.x).toBeCloseTo(120, 0);
  expect(box.y).toBeCloseTo(80, 0);
  // 地図の上を実際に押して lastClickPixel を記録させる（ホストの中の (300, 200)）
  await page.mouse.click(box.x + 300, box.y + 200);
  await page.waitForTimeout(300);
  const pixel = await page.evaluate(() => (window as any).__maplatUi.lastClickPixel);
  expect(pixel).toEqual([300, 200]);
  await page.evaluate(() =>
    (window as any).__maplatUi.showContextMenu([{ text: "位置の確認", callback: () => undefined }])
  );
  const menu = page.locator('[part="poi-menu"]');
  await expect(menu).toBeVisible();
  const m = (await menu.boundingBox())!;
  // メニューの左上が押した点（ホストの (300, 200) ＝ 画面の (420, 280)）に来る
  expect(Math.round(m.x)).toBe(Math.round(box.x + 300));
  expect(Math.round(m.y)).toBe(Math.round(box.y + 200));
  expect(errors).toEqual([]);
});

test("m1: 透過度のスライダーを動かすと sliderNew.get と propertychange に映る", async ({ page }) => {
  test.setTimeout(180_000);
  const errors = await open(page);
  await page.evaluate(() => {
    const ui = (window as any).__maplatUi;
    (window as any).__pc = [];
    ui.sliderNew.on("propertychange", (e: any) => (window as any).__pc.push(e.newValue));
  });
  const slider = page.locator('[part="slider"]');
  await expect(slider).toBeVisible();
  await expect(slider).toBeEnabled();
  // 利用者の操作と同じ input イベント（値 70 ＝ 透過度 30）
  await slider.evaluate((el: HTMLInputElement) => {
    el.value = "70";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect
    .poll(() => page.evaluate(() => (window as any).__maplatUi.sliderNew.get("slidervalue")), { timeout: 10_000 })
    .toBeCloseTo(0.3, 5);
  await expect.poll(() => page.evaluate(() => (window as any).__pc.at(-1)), { timeout: 10_000 }).toBeCloseTo(0.3, 5);
  expect(await page.evaluate(() => (window as any).__maplatUi.core.getTransparency())).toBeCloseTo(30, 5);
  // setEnable(false) で使えなくなる（要素への委譲）
  await page.evaluate(() => (window as any).__maplatUi.sliderNew.setEnable(false));
  await expect(slider).toBeDisabled();
  expect(errors).toEqual([]);
});
