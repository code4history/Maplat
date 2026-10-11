// <maplat-ui> の確認ページ（demo/element.html: Core の <maplat-app> の上）の e2e。
// 操作一式: 地図が出る・ズーム・ホーム・コンパス・地図の切り替え・POI をクリックして吹き出し・GPS。
// ページの操作は <maplat-ui> の Shadow DOM（open）の部品と、層 A・層 B の公開面だけを使う。
// 外部タイル（t.tilemap.jp・地理院・OSM）は単色の PNG に差し替える（ネットワークに依らない）。
import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/* eslint-disable @typescript-eslint/no-explicit-any */

// 256 角の淡色のタイル（左上に 1 px の線）。MAPLAT_UI_REAL_TILES=1 なら差し替えない（目視用）
const TILE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAIAAADTED8xAAACD0lEQVR42u3TQQ0AIAwEwfqXUhU8EYGBftBQBOCgk8wZuGRjr4Sx4u3WgZkEgAAcgQBAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAAAhAAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACQABeQAAgABAACAAEAAIAAYAAQAAgABAACAAEAAIAAYAAQAAgABAACAAEAAIAAYAAQAAgABAACAAEAAIAAYAAQAAgABAACAAEAAIAAYAAQAAgABAACAAEAAIAAYAAQAAgAAQgAATgCAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAkAAAkAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACgJ8GcPkm8F11ptMAAAAASUVORK5CYII=",
  "base64"
);
const realTiles = process.env.MAPLAT_UI_REAL_TILES === "1";
const EXTERNAL_TILES =
  /t\.tilemap\.jp|cyberjapandata\.gsi\.go\.jp|tile\.openstreetmap\.org|api\.mapbox\.com|mt\d?\.google/;
// 尾曳稲荷神社（public/pois/tatebayashi.json。説明・住所・画像を持つ POI）
const POI = {
  longitude: 139.547491,
  latitude: 36.244844,
  name: "尾曳稲荷神社"
};
const PAGE = "/demo/element.html";
const LABEL = "core";

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

async function openPage(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("pageerror", err => errors.push(String(err.stack ?? err)));
  if (!realTiles) {
    await page.route(EXTERNAL_TILES, route =>
      route.fulfill({ status: 200, contentType: "image/png", body: TILE_PNG })
    );
  }
  await page.goto(PAGE);
  await expect(page.getByTestId("status")).toHaveAttribute(
    "data-state",
    "ready",
    { timeout: 90_000 }
  );
  return errors;
}

const viewpoint = (page: Page) =>
  page.evaluate(() => (window as any).__maplatUi.app.viewpoint);
const app = <T>(page: Page, fn: string, ...args: unknown[]) =>
  page.evaluate(
    ([f, a]) => {
      const el = (window as any).__maplatUi.app;
      return el[f as string](...(a as unknown[]));
    },
    [fn, args] as const
  ) as Promise<T>;

/** 同梱ベースマップ（地理院地図・地理院オルソ）のサムネイルが画像として出ている（読めずに頭文字の代替へ替わっていない）。 */
async function expectBundledThumbnails(menu: ReturnType<Page["locator"]>) {
  for (const id of ["gsi", "gsi_ortho"]) {
    const item = menu.locator(`[part="map-menu-item"][data-map-id="${id}"]`);
    await item.scrollIntoViewIfNeeded();
    const thumb = item.locator("img.thumb");
    await expect(
      thumb,
      `${id}: the thumbnail <img> was replaced by the placeholder`
    ).toHaveCount(1);
    await expect
      .poll(
        () =>
          thumb.evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0
          ),
        { timeout: 10_000 }
      )
      .toBe(true);
  }
}

/** clickMarker / clickMarkers の detail を記録する（JSON にできる形で写す）。 */
async function recordMarkerClicks(page: Page) {
  await page.evaluate(() => {
    const w = window as any;
    w.__markerClicks = [];
    for (const type of ["clickMarker", "clickMarkers"]) {
      w.__maplatUi.addEventListener(type, (e: CustomEvent) =>
        w.__markerClicks.push({
          type,
          detail: JSON.parse(JSON.stringify(e.detail))
        })
      );
    }
  });
}

/** 記録した detail を保存し、共通の型 MaplatPoi（@maplat/core/common）の形を確かめる。 */
async function checkMarkerClicks(
  page: Page,
  testInfo: { outputPath: (n: string) => string }
) {
  const clicks = (await page.evaluate(
    () => (window as any).__markerClicks
  )) as Array<{ type: string; detail: any }>;
  const name = `${LABEL}-click-marker-detail.json`;
  const path = shotsDir ? join(shotsDir, name) : testInfo.outputPath(name);
  if (shotsDir) mkdirSync(shotsDir, { recursive: true });
  writeFileSync(path, `${JSON.stringify(clicks, null, 2)}\n`);
  const one = clicks.find(c => c.type === "clickMarker")?.detail;
  const all = clicks.find(c => c.type === "clickMarkers")?.detail;
  expect(one, "clickMarker was not dispatched").toBeTruthy();
  expect(typeof one.namespaceID).toBe("string");
  expect(["string", "number"]).toContain(typeof one.id);
  expect(one.lnglat).toHaveLength(2);
  expect(one.name).toBeTruthy();
  expect(
    Array.isArray(all) && all.length >= 1,
    "clickMarkers is not a non-empty array"
  ).toBe(true);
  expect(all[0]).toEqual(one);
}

test("Core の <maplat-app> の上で <maplat-ui> の操作一式が動く", async ({
  page
}, testInfo) => {
  const errors = await openPage(page);
  const ui = page.locator("maplat-ui#ui");

  // ---- 形: 層 A は light DOM の子・層 B の部品は open の Shadow DOM ----
  const shape = await page.evaluate(() => {
    const el = (window as any).__maplatUi as HTMLElement & {
      app: any;
      shadowRoot: ShadowRoot;
    };
    return {
      shadow: el.shadowRoot?.mode,
      appIsChild: el.app?.parentElement === el,
      slot: el.app?.getAttribute("slot"),
      implementation: el.app?.implementation,
      uiImplementation: (el as any).implementation,
      appId: el.app?.getAttribute("app-id")
    };
  });
  expect(shape).toMatchObject({
    shadow: "open",
    appIsChild: true,
    slot: "map",
    implementation: "core",
    uiImplementation: "ui",
    appId: "sample"
  });
  // 地図の canvas は最初の描画のフレームで作られる（ready は描画の完了を約束しない）ので待つ
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            (window as any).__maplatUi.app?.querySelectorAll("canvas").length ??
            0
        ),
      { timeout: 15_000 }
    )
    .toBeGreaterThan(0);
  await expect(ui.locator('[part="map-title-button"] .text')).not.toHaveText(
    ""
  );
  for (const name of [
    "zoom-in",
    "zoom-out",
    "home",
    "compass",
    "gps",
    "slider"
  ]) {
    await expect(ui.locator(`[part="${name}"]`)).toBeVisible();
  }
  await shot(page, "1-map", testInfo);

  // ---- ズーム（zoomBy）----
  const z0 = (await viewpoint(page)).zoom as number;
  await ui.locator('[part="zoom-in"]').click();
  await expect
    .poll(async () => (await viewpoint(page)).zoom, { timeout: 15_000 })
    .toBeGreaterThan(z0 + 0.5);
  const z1 = (await viewpoint(page)).zoom as number;
  await ui.locator('[part="zoom-out"]').click();
  await expect
    .poll(async () => (await viewpoint(page)).zoom, { timeout: 15_000 })
    .toBeLessThan(z1 - 0.5);

  // ---- ホーム（goHome）: 視点を動かしてから戻す ----
  await ui.locator('[part="home"] button').click();
  await page.waitForTimeout(1000);
  const home = await viewpoint(page);
  await app(page, "setViewpoint", {
    longitude: home.longitude + 0.01,
    latitude: home.latitude + 0.005
  });
  await expect
    .poll(
      async () => Math.abs((await viewpoint(page)).longitude - home.longitude),
      { timeout: 15_000 }
    )
    .toBeGreaterThan(0.005);
  await ui.locator('[part="home"] button').click();
  await expect
    .poll(
      async () => {
        const vp = await viewpoint(page);
        return Math.hypot(
          vp.longitude - home.longitude,
          vp.latitude - home.latitude
        );
      },
      { timeout: 15_000 }
    )
    .toBeLessThan(0.0005);

  // ---- コンパス: 回して、押したら戻る（north-up が無いので resetRotation）----
  const compass = ui.locator('[part="compass"]');
  await expect(compass).toHaveClass(/disable/);
  await app(page, "setViewpoint", { rotation: 60 });
  await expect
    .poll(async () => Math.abs((await viewpoint(page)).rotation), {
      timeout: 15_000
    })
    .toBeGreaterThan(30);
  await expect(compass).not.toHaveClass(/disable/);
  await expect(compass).toHaveAttribute("data-action", "rotation");
  await shot(page, "2-rotated", testInfo);
  await compass.locator("button").click();
  await expect
    .poll(async () => Math.abs((await viewpoint(page)).rotation), {
      timeout: 15_000
    })
    .toBeLessThan(0.5);
  await expect(compass).toHaveClass(/disable/);

  // ---- 地図の切り替えメニュー（listMaps・changeMap）----
  const startMap = await page.evaluate(
    () => (window as any).__maplatUi.app.currentMapId
  );
  const titleButton = ui.locator('[part="map-title-button"]');
  await titleButton.click();
  const menu = ui.locator('[part="map-menu"]');
  await expect(menu).toBeVisible();
  const items = menu.locator('[part="map-menu-item"]');
  expect(await items.count()).toBeGreaterThan(3);
  await expect(
    menu.locator(`[part="map-menu-item"][data-map-id="${startMap}"]`)
  ).toHaveAttribute("aria-current", "true");
  await expectBundledThumbnails(menu);
  await shot(page, "3-menu", testInfo);
  await menu.locator('[part="map-menu-item"][data-map-id="gsi"]').click();
  await expect(menu).toBeHidden();
  await expect
    .poll(
      () => page.evaluate(() => (window as any).__maplatUi.app.currentMapId),
      { timeout: 20_000 }
    )
    .toBe("gsi");
  await expect(ui.locator('[part="slider"]')).toBeDisabled();
  await shot(page, "4-gsi", testInfo);
  await titleButton.click();
  await menu
    .locator('[part="map-menu-item"][data-map-id="tatebayashi_castle_akimoto"]')
    .click();
  await expect
    .poll(
      () => page.evaluate(() => (window as any).__maplatUi.app.currentMapId),
      { timeout: 20_000 }
    )
    .toBe("tatebayashi_castle_akimoto");
  await expect(ui.locator('[part="slider"]')).toBeEnabled();
  // 透過度のスライダー（setTransparency）
  await ui.locator('[part="slider"]').fill("60");
  await expect
    .poll(() => app<number>(page, "getTransparency"), { timeout: 10_000 })
    .toBe(40);

  // ---- POI をクリックして吹き出し（clickMarker）----
  await app(page, "setViewpoint", {
    longitude: POI.longitude,
    latitude: POI.latitude,
    mercZoom: 18
  });
  await page.waitForTimeout(1500);
  const modal = ui.locator('[part="poi-modal"]');
  await recordMarkerClicks(page);
  let opened = false;
  for (const dy of [-14, -8, -20, -3, -26]) {
    const pt = await app<{ x: number; y: number } | null>(
      page,
      "lngLatToClientPoint",
      POI.longitude,
      POI.latitude
    );
    expect(pt).not.toBeNull();
    await page.mouse.click(pt!.x, pt!.y + dy);
    try {
      await expect(modal).toBeVisible({ timeout: 2500 });
      opened = true;
      break;
    } catch {
      // アイコンの当たり判定を外したら少しずらして押し直す
    }
  }
  expect(opened, "clicking the POI icon should open the POI dialog").toBe(true);
  await expect(ui.locator('[part="poi-title"]')).toContainText(POI.name);
  await expect(ui.locator('[part="poi-body"] .poi-desc')).not.toBeEmpty();
  await expect(ui.locator('[part="poi-body"] .poi-address')).toContainText(
    "館林市"
  );
  await checkMarkerClicks(page, testInfo);
  await shot(page, "5-poi", testInfo);
  await ui.locator('[part="poi-close"]').click();
  await expect(modal).toBeHidden();

  expect(errors, errors.join("\n")).toEqual([]);
});

test("GPS ボタン（handleGPS・gpsEnabledChanged）", async ({
  page,
  context
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({
    longitude: 139.5321,
    latitude: 36.2493,
    accuracy: 10
  });
  const errors = await openPage(page);
  const gps = page.locator("maplat-ui#ui").locator('[part="gps"]');
  await expect(gps).toHaveClass(/disable/);
  await gps.locator("button").click();
  await expect
    .poll(
      () => page.evaluate(() => (window as any).__maplatUi.app.gpsEnabled),
      { timeout: 20_000 }
    )
    .toBe(true);
  await expect(gps).not.toHaveClass(/disable/);
  await gps.locator("button").click();
  await expect
    .poll(
      () => page.evaluate(() => (window as any).__maplatUi.app.gpsEnabled),
      { timeout: 20_000 }
    )
    .toBe(false);
  await expect(gps).toHaveClass(/disable/);
  expect(errors, errors.join("\n")).toEqual([]);
});

// ---- POI まわり（マーカー一覧・重なった POI の選択メニュー・メディア）----

// public/pois/m1-t3-swiper-demo.json（画像 3 枚＋YouTube／動画・3D・点群の POI）
const MEDIA_LAYER = "m1_t3_swiper_demo";
const MEDIA_POI_A = {
  id: "m1-t3-swiper-a",
  longitude: 139.539,
  latitude: 36.251
};
const MEDIA_POI_B = "m1-t3-swiper-b";
// 重なった POI の選択メニューの確かめに、同じ点へ 2 つ置く（既存の POI の無いところ）
const OVERLAP = { longitude: 139.5352, latitude: 36.2468 };
const MEDIA_HOSTS = /code4history\.dev|w3schools\.com/;

/** POI のスワイパーのスライドの種類（cc-swiper-slide の image-type）。 */
const slideTypes = (page: Page) =>
  page.evaluate(() =>
    Array.from(
      (window as any).__maplatUi.shadowRoot.querySelectorAll(
        '[part="poi-swiper"] > cc-swiper-slide'
      )
    ).map((s: any) => s.getAttribute("image-type"))
  );

/** 点 (lng, lat) のマーカーを押す（アイコンの当たり判定に合うまで少しずらして押し直す）。 */
async function clickMarkerAt(
  page: Page,
  lnglat: { longitude: number; latitude: number },
  opened: ReturnType<Page["locator"]>
): Promise<boolean> {
  for (const dy of [-14, -8, -20, -3, -26]) {
    const pt = await app<{ x: number; y: number } | null>(
      page,
      "lngLatToClientPoint",
      lnglat.longitude,
      lnglat.latitude
    );
    expect(pt).not.toBeNull();
    await page.mouse.click(pt!.x, pt!.y + dy);
    try {
      await expect(opened).toBeVisible({ timeout: 2500 });
      return true;
    } catch {
      // 外したら押し直す
    }
  }
  return false;
}

test("POI まわり: マーカー一覧・重なった POI の選択メニュー・メディア付きの吹き出し", async ({
  page
}, testInfo) => {
  test.setTimeout(240_000);
  if (!realTiles) {
    await page.route(MEDIA_HOSTS, route =>
      route.fulfill({ status: 200, contentType: "image/png", body: TILE_PNG })
    );
  }
  const errors = await openPage(page);
  const ui = page.locator("maplat-ui#ui");
  const poiModal = ui.locator('[part="poi-modal"]');

  // ---- マーカー一覧（enable-marker-list・listPoiLayers）----
  const listButton = ui.locator('[part="marker-list"]');
  await expect(listButton).toBeVisible();
  await listButton.locator("button").click();
  const list = ui.locator('[part="marker-list-modal"]');
  await expect(list).toBeVisible();
  await expect(ui.locator('[part="marker-list-title"]')).toHaveText(
    "マーカー一覧表示"
  );
  const expectedKeys = await page.evaluate(() =>
    (window as any).__maplatUi.app
      .listPoiLayers(false, true)
      .filter((l: any) => l.pois.length > 0)
      .map((l: any) => l.namespaceID)
  );
  expect(expectedKeys.length).toBeGreaterThanOrEqual(2);
  const layerRows = list.locator('[part="marker-list-layer"]');
  await expect(layerRows).toHaveCount(expectedKeys.length);
  expect(
    await layerRows.evaluateAll(rows =>
      rows.map(r => (r as HTMLElement).dataset.layerKey)
    )
  ).toEqual(expectedKeys);
  await shot(page, "6-marker-list", testInfo);

  // 層の表示・非表示（hidePoiLayer / showPoiLayer。層 A の state の hideLayer に載る）
  const mediaRow = list.locator(
    `[part="marker-list-layer"][data-layer-key="${MEDIA_LAYER}"]`
  );
  const mediaSwitch = mediaRow.locator('[part="marker-list-layer-switch"]');
  await expect(mediaSwitch).toBeChecked();
  await mediaSwitch.click();
  await expect(mediaSwitch).not.toBeChecked();
  await expect
    .poll(
      () =>
        page.evaluate(
          id => (window as any).__maplatUi.app.getPoiLayer(id)?.hide === true,
          MEDIA_LAYER
        ),
      { timeout: 10_000 }
    )
    .toBe(true);
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          String((window as any).__maplatUi.app.state.hideLayer ?? "")
        ),
      { timeout: 10_000 }
    )
    .toContain(MEDIA_LAYER);
  await mediaSwitch.click();
  await expect(mediaSwitch).toBeChecked();
  await expect
    .poll(
      () =>
        page.evaluate(
          id => !(window as any).__maplatUi.app.getPoiLayer(id)?.hide,
          MEDIA_LAYER
        ),
      { timeout: 10_000 }
    )
    .toBe(true);

  // 層を開いて POI を選ぶ → 一覧を閉じて吹き出し・その POI へ視点が移る（selectMarker）
  await mediaRow.locator('[part="marker-list-layer-label"]').click();
  const poiItem = mediaRow.locator(
    `[part="marker-list-poi"][data-poi-id$="${MEDIA_POI_A.id}"]`
  );
  await expect(poiItem).toBeVisible();
  await shot(page, "7-marker-list-open", testInfo);
  await poiItem.click();
  await expect(list).toBeHidden();
  await expect(poiModal).toBeVisible();
  await expect(ui.locator('[part="poi-title"]')).toContainText("swiper確認A");
  await expect
    .poll(
      async () => {
        const vp = await viewpoint(page);
        return Math.hypot(
          vp.longitude - MEDIA_POI_A.longitude,
          vp.latitude - MEDIA_POI_A.latitude
        );
      },
      { timeout: 15_000 }
    )
    .toBeLessThan(0.0005);

  // ---- メディア（Chuci の cc-swiper。<maplat-ui> の Shadow DOM の中で Chuci の Shadow DOM が動く）----
  expect(await slideTypes(page)).toEqual([
    "image",
    "image",
    "image",
    "youtube"
  ]);
  const swiper = ui.locator('[part="poi-swiper"]');
  await expect(swiper).toBeVisible();
  await expect
    .poll(
      () =>
        swiper.evaluate(
          (el: any) =>
            el.shadowRoot?.querySelectorAll(".swiper-slide img.viewer")
              .length ?? 0
        ),
      { timeout: 20_000 }
    )
    .toBeGreaterThanOrEqual(4);
  const box = await swiper.boundingBox();
  expect(box!.height).toBeGreaterThan(200);
  await page.waitForTimeout(1000);
  await shot(page, "8-poi-media", testInfo);
  // 中央の画像を押すと Chuci のビューア（文書の body に置かれる）が吹き出しの上に開く
  await swiper.locator(".swiper-slide-active img.viewer").click();
  const viewerImage = page.locator("cc-viewer cc-viewer-image");
  await expect(viewerImage.locator(".backdrop")).toBeVisible({
    timeout: 15_000
  });
  await shot(page, "9-media-viewer", testInfo);
  await viewerImage.locator(".nav-close").click();
  await expect(viewerImage.locator(".backdrop")).toBeHidden({
    timeout: 10_000
  });
  await expect(poiModal).toBeVisible();
  // 動画・3D・点群の POI（openMarker）
  await page.evaluate(
    id => (window as any).__maplatUi.openMarker(id),
    MEDIA_POI_B
  );
  await expect(ui.locator('[part="poi-title"]')).toContainText("swiper確認B");
  expect(await slideTypes(page)).toEqual(["video", "3dmodel", "gaussian"]);
  await ui.locator('[part="poi-close"]').click();
  await expect(poiModal).toBeHidden();

  // ---- 重なった POI の選択メニュー（clickMarkers が複数）----
  const ids = await page.evaluate(o => {
    const a = (window as any).__maplatUi.app;
    return [
      a.addMarker(
        {
          lnglat: [o.longitude, o.latitude],
          name: { ja: "重なり甲", en: "Overlap A" }
        },
        "main"
      ),
      a.addMarker(
        {
          lnglat: [o.longitude, o.latitude],
          name: { ja: "重なり乙", en: "Overlap B" }
        },
        "main"
      )
    ];
  }, OVERLAP);
  expect(ids.every(Boolean)).toBe(true);
  await app(page, "setViewpoint", { ...OVERLAP, mercZoom: 18 });
  await page.waitForTimeout(1500);
  const menu = ui.locator('[part="poi-menu"]');
  expect(
    await clickMarkerAt(page, OVERLAP, menu),
    "clicking overlapping markers should open the candidate menu"
  ).toBe(true);
  await expect(poiModal).toBeHidden();
  const items = menu.locator('[part="poi-menu-item"]');
  const names = await items.locator(".name").allTextContents();
  expect(names).toEqual(expect.arrayContaining(["重なり甲", "重なり乙"]));
  // メニューは押した位置の近く（<maplat-ui> の枠の中）
  const menuBox = await menu.boundingBox();
  const pt = await app<{ x: number; y: number }>(
    page,
    "lngLatToClientPoint",
    OVERLAP.longitude,
    OVERLAP.latitude
  );
  expect(Math.abs(menuBox!.x - pt.x)).toBeLessThan(200);
  expect(Math.abs(menuBox!.y - pt.y)).toBeLessThan(200);
  await shot(page, "10-poi-menu", testInfo);
  // 地図の次の押下で閉じる（その押下は地図へ渡さない＝吹き出しも開かない）
  await page.mouse.click(pt.x - 150, pt.y + 120);
  await expect(menu).toBeHidden();
  await expect(poiModal).toBeHidden();
  // 開き直して候補を選ぶ → その POI の吹き出し
  expect(await clickMarkerAt(page, OVERLAP, menu)).toBe(true);
  await items.filter({ hasText: "重なり乙" }).click();
  await expect(menu).toBeHidden();
  await expect(poiModal).toBeVisible();
  await expect(ui.locator('[part="poi-title"]')).toHaveText("重なり乙");
  await shot(page, "11-poi-from-menu", testInfo);
  await ui.locator('[part="poi-close"]').click();

  expect(errors, errors.join("\n")).toEqual([]);
});
