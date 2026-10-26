// 一本化: 旧 API のデモ `demo/dev.ts`（`/index.html`）が互換層の上で起動し、
// 地図・スライダー・ボタン・POI と `app.addEventListener("clickMarker")` が動くことの確認。
//
// - 旧 API の `MaplatUi.createObject(option)` が解決し、`#status` が `READY appid=sample lang=ja` になる
// - 地図（子の `<maplat-app>` の canvas）が 0 でない大きさで描かれる（旧 Core と同じく、地図の箱は
//   いちばん近い位置指定の祖先を埋める）
// - スライダー（`part="map-slider"`）のカードを押すと地図が替わる
// - ボタン（`part="zoom"` 等）が見えていて、ズームと一覧（`part="marker-list"`）が動く
// - 地図の POI を実クリックすると、POI の画面（`part="poi-modal"`）が開き、デモの
//   `app.addEventListener("clickMarker", e => console.log(e))` が呼ばれる（互換層の再送出）
//
// 実行（dev サーバーは playwright.config.ts の webServer が立てる）:
//   PLAYWRIGHT_SKIP_BROWSER_GC=1 node_modules/.bin/playwright test --workers=1 e2e/legacy-demo.spec.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, type Page } from "@playwright/test";

// デモは pwaManifest: true（Service Worker を登録する）。dev サーバーで SW を効かせると読み込みが揺れるので止める
test.use({ serviceWorkers: "block" });

async function openDemo(page: Page) {
  const errors: string[] = [];
  const events: string[] = [];
  page.on("pageerror", e => errors.push(String(e.message ?? e)));
  // デモの listener は console.log(evt) する。evt は互換層が出し直した { type, detail, target }
  page.on("console", async msg => {
    if (msg.type() !== "log") return;
    const arg = msg.args()[0];
    if (!arg) return;
    try {
      const type = await arg.evaluate((o: any) =>
        o && typeof o === "object" && typeof o.type === "string" && "detail" in o
          ? `${o.type}:${o.detail?.name ?? o.detail?.id ?? ""}`
          : null
      );
      if (type) events.push(type);
    } catch {
      // 破棄済みのハンドル等は読まない
    }
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/index.html?appid=sample&lang=ja");
  await expect(page.locator("#status")).toHaveText(/^READY appid=sample lang=ja$/, {
    timeout: 120_000
  });
  // 地図の準備（<maplat-ui> の ready）まで待つ
  await page.waitForFunction(
    () => (document.querySelector("maplat-ui") as any)?.ready?.then?.(() => true),
    null,
    { timeout: 120_000 }
  );
  return { errors, events };
}

const shadowCount = (page: Page, selector: string) =>
  page.evaluate(
    sel => document.querySelector("maplat-ui")?.shadowRoot?.querySelectorAll(sel).length ?? 0,
    selector
  );

const currentMap = (page: Page) =>
  page.evaluate(() => (document.querySelector("maplat-app") as any)?.app?.from?.mapID ?? null);

test("旧 API のデモ（demo/dev.ts）: 地図・スライダー・ボタン・POI と clickMarker", async ({ page }) => {
  test.setTimeout(300_000);
  const { errors, events } = await openDemo(page);

  // 地図: 子の <maplat-app> の canvas が 0 でない大きさで描かれる
  const map = await page.evaluate(() => {
    const host = document.querySelector("maplat-ui") as HTMLElement;
    const app = document.querySelector("maplat-app") as HTMLElement;
    const canvas = app?.querySelector("canvas") as HTMLCanvasElement | null;
    const r = (el: Element | null | undefined) => {
      const b = el?.getBoundingClientRect();
      return b ? { w: Math.round(b.width), h: Math.round(b.height) } : null;
    };
    return { host: r(host), app: r(app), canvas: r(canvas), parent: app?.parentElement?.localName };
  });
  expect(map.parent).toBe("maplat-ui");
  expect(map.host!.w).toBeGreaterThan(300);
  expect(map.host!.h).toBeGreaterThan(300);
  expect(map.canvas!.w).toBeGreaterThan(300);
  expect(map.canvas!.h).toBeGreaterThan(300);

  // ボタン: 地図の操作ボタンと、デモが有効にした共有・枠線・マーカー非表示・一覧のボタンが見えている
  for (const part of ["zoom", "gps", "home", "compass", "info", "share", "border", "hide-marker", "marker-list"]) {
    await expect(page.locator(`[part="${part}"]`).first(), `button ${part}`).toBeVisible();
  }
  // ズームの + で地図のズームが 1 上がる
  const zoom0 = await page.evaluate(() => (document.querySelector("maplat-app") as any).app.mapObject.getView().getZoom());
  await page.locator('[part="zoom-in"]').click();
  await expect
    .poll(() => page.evaluate(() => (document.querySelector("maplat-app") as any).app.mapObject.getView().getZoom()), {
      timeout: 10_000
    })
    .toBeGreaterThan(zoom0 + 0.5);
  await page.locator('[part="zoom-out"]').click();
  await page.waitForTimeout(800);
  // 一覧のボタンで一覧の画面が開き、層が並ぶ。閉じる
  await page.locator('[part="marker-list"] button').click();
  await expect(page.locator('[part="marker-list-modal"]')).toBeVisible();
  expect(await shadowCount(page, '[part="marker-list-layer"]')).toBeGreaterThan(0);
  await page.locator('[part="marker-list-close"]').click();
  await expect(page.locator('[part="marker-list-modal"]')).toBeHidden();

  // スライダー: 重ねる地図のカードが並び、覗いているカードを押すと地図が替わる
  expect(await shadowCount(page, '[part="map-slider"][data-kind="overlay"] [part~="map-slide"]')).toBeGreaterThan(1);
  expect(await shadowCount(page, '[part="map-slider"][data-kind="base"] [part~="map-slide"]')).toBeGreaterThan(1);
  const before = await currentMap(page);
  const peek = await page.evaluate(() => {
    const host = document.querySelector("maplat-ui") as any;
    const sr = host.shadowRoot as ShadowRoot;
    const slider = host.slider("overlay");
    const el = slider.slots.find((s: any) => s.offset === 1).element as HTMLElement;
    const root = sr.querySelector('[part="map-slider"][data-kind="overlay"]') as HTMLElement;
    const pr = el.getBoundingClientRect();
    const cr = root.getBoundingClientRect();
    // 矢印を避けて、見えている部分の上端寄り
    for (let y = Math.max(pr.top, cr.top) + 2; y < Math.min(pr.bottom, cr.bottom) - 1; y++)
      for (let x = Math.max(pr.left, cr.left) + 1; x < Math.min(pr.right, cr.right) - 1; x++)
        if (sr.elementFromPoint(x, y)?.closest('[part~="map-slide"]') === el)
          return { x, y, id: el.dataset.mapId };
    return null;
  });
  expect(peek).toBeTruthy();
  await page.mouse.click(peek!.x, peek!.y);
  await expect.poll(() => currentMap(page), { timeout: 30_000 }).toBe(peek!.id);
  expect(peek!.id).not.toBe(before);
  await page.waitForTimeout(1500);

  // POI: 地図の上の POI を実クリックすると POI の画面が開き、clickMarker がデモの listener に届く。
  // 地図の切り替えの後の視点の移動が止まってから、候補の POI を順に押す（位置は押す直前に求め直す）
  await page.waitForFunction(
    () => !(document.querySelector("maplat-app") as any).app.mapObject.getView().getAnimating(),
    null,
    { timeout: 20_000 }
  );
  await page.waitForTimeout(1000);
  const candidates = (index: number) =>
    page.evaluate(index => {
      const core = (document.querySelector("maplat-app") as any).app;
      const map = core.mapObject;
      const vp = (map.getViewport() as HTMLElement).getBoundingClientRect();
      const host = (document.querySelector("maplat-ui") as HTMLElement).getBoundingClientRect();
      const features: any[] = [];
      map.getLayers().forEach((layer: any) => {
        const walk = (l: any) => {
          if (l.getLayers) l.getLayers().forEach(walk);
          else if (l.getVisible?.() !== false && l.getSource?.()?.getFeatures) features.push(...l.getSource().getFeatures());
        };
        walk(layer);
      });
      const hits: { x: number; y: number }[] = [];
      for (const f of features) {
        const geom = f.getGeometry?.();
        if (!geom || geom.getType() !== "Point" || !f.get("datum")) continue;
        const px = map.getPixelFromCoordinate(geom.getCoordinates());
        if (!px) continue;
        const x = vp.left + px[0];
        const y = vp.top + px[1];
        // 操作ボタン（左右の端）・スライダー（下）・題名（上）に掛からない中ほど
        if (x < host.left + 120 || x > host.right - 120 || y < host.top + 120 || y > host.bottom - 200) continue;
        hits.push({ x, y });
      }
      return { total: features.length, hit: hits[index] ?? null, count: hits.length };
    }, index);
  let opened = false;
  let tried = 0;
  const modal = page.locator('[part="poi-modal"]');
  const poiMenu = page.locator('[part="poi-menu"]');
  for (let i = 0; i < 6 && !opened; i++) {
    const c = await candidates(i);
    if (i === 0) expect(c.count, `中ほどに POI がある（全 ${c.total}）`).toBeGreaterThan(0);
    if (!c.hit) break;
    // 目印の画像は点の上に立つ（下端が点）。点の少し上を押す
    for (const dy of [-12, -6, -18]) {
      tried++;
      await page.mouse.click(c.hit.x, c.hit.y + dy);
      // 1 件なら吹き出し、重なっていれば選択メニュー（旧 UI と同じ）。メニューなら先頭を選ぶ
      await expect
        .poll(async () => (await modal.isVisible()) || (await poiMenu.isVisible()), { timeout: 3_000 })
        .toBe(true)
        .catch(() => undefined);
      if (await poiMenu.isVisible()) await page.locator('[part="poi-menu-item"]').first().click();
      try {
        await expect(modal).toBeVisible({ timeout: 3_000 });
        opened = true;
        break;
      } catch {
        // 当たらなかった: 次の高さ・次の POI
      }
    }
  }
  expect(opened, `POI の画面が開く（${tried} 回押した）`).toBe(true);
  expect(await page.locator('[part="poi-title"]').innerText()).not.toBe("");
  await expect.poll(() => events.filter(e => e.startsWith("clickMarker:")).length, { timeout: 10_000 }).toBeGreaterThan(0);

  expect(errors, errors.join("\n")).toEqual([]);
});
