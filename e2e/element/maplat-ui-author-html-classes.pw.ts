// 地図の作り手が書いた HTML（ここでは帰属表記の attr）に、<maplat-ui> 自身の CSS が使う class が付いていても、
// 部品の見た目（位置・重なり）が当たらないことを、実ブラウザで確かめる。作り手の class は残る。
// 単体は spec/element-author-html-classes.spec.ts・spec/author-html.spec.ts。
// 資料: e2e/fixtures/mapinfo-attribution.html（設定ファイルはこの試験が route で返す）。
// 外への要求は出さない（タイルは作った応答で返す）。
// 写真の保存先は環境変数 MAPLAT_UI_SHOTS_DIR（無ければ test-results/element/author-html-classes-shots）。
import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

/* eslint-disable @typescript-eslint/no-explicit-any */

const SHOTS =
  process.env.MAPLAT_UI_SHOTS_DIR ||
  resolve(process.cwd(), "test-results/element/author-html-classes-shots");
const PAGE = "/e2e/fixtures/mapinfo-attribution.html";

const SETTING = {
  appName: "Author HTML classes",
  lang: "en",
  homePosition: [139.5321, 36.249302],
  defaultZoom: 17,
  startFrom: "tatebayashi_ojozu",
  sources: [
    { mapID: "tatebayashi_ojozu", label: "Tatebayashi" },
    {
      mapID: "osm",
      maptype: "base",
      label: "OSM",
      title: "OpenStreetMap",
      // 作り手の class（my-credit）と、<maplat-ui> の CSS が使う class（splash・modal）が混ざった HTML
      attr:
        '<a href="https://example.org/" class="my-credit splash">Example credit</a> ' +
        '<span class="modal my-note">and a note</span>',
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      maxZoom: 19
    }
  ]
};

const TILE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "base64"
);

async function openPage(page: Page) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.route(
    url => !["127.0.0.1", "localhost"].includes(url.hostname),
    route => route.abort()
  );
  const tile = {
    status: 200,
    headers: { "access-control-allow-origin": "*" },
    contentType: "image/png",
    body: TILE_PNG
  };
  await page.route(/tile\.openstreetmap\.org\//, route => route.fulfill(tile));
  await page.route(/t\.tilemap\.jp\//, route => route.fulfill(tile));
  await page.route(/\/apps\/mapinfo-attribution\.json$/, route =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(SETTING)
    })
  );
  await page.goto(`${PAGE}?lang=en`);
  await expect(page.getByTestId("status")).toHaveAttribute(
    "data-state",
    "ready",
    { timeout: 90_000 }
  );
}

test("作り手の HTML に <maplat-ui> の部品の見た目が当たらない（作り手の class は残る）", async ({
  page
}) => {
  mkdirSync(SHOTS, { recursive: true });
  await openPage(page);
  await page.evaluate(() => (window as any).__maplatUi.app.changeMap("osm"));
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).__maplatUi.app.currentMapId)
    )
    .toBe("osm");
  await page.locator('[part="info"] button').click();
  const modal = page.locator('[part="map-info-modal"]');
  await expect(modal).toBeVisible();

  const result = await page.evaluate(() => {
    const root = (window as any).__maplatUi.shadowRoot as ShadowRoot;
    const item = root.querySelector(
      '[part="map-meta-attributions"] .attribution-item'
    )!;
    const dialog = root
      .querySelector('[part="map-info-modal"] .dialog')!
      .getBoundingClientRect();
    return [...item.querySelectorAll("a, span")].map(el => {
      const style = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      return {
        text: el.textContent,
        className: el.getAttribute("class"),
        position: style.position,
        display: style.display,
        // ダイアログに占める面積の割合（被さっていれば 1 に近い）
        cover: (box.width * box.height) / (dialog.width * dialog.height)
      };
    });
  });
  await page.screenshot({
    path: resolve(SHOTS, "author-html-classes-map-info.png")
  });

  expect(result.map(r => r.text)).toEqual(["Example credit", "and a note"]);
  // 作り手の class は残り、<maplat-ui> の CSS が使う class は外れる
  expect(result.map(r => r.className)).toEqual(["my-credit", "my-note"]);
  for (const r of result) {
    expect(r.position).toBe("static");
    expect(r.display).toBe("inline");
    expect(r.cover).toBeLessThan(0.1);
  }
  // ダイアログの閉じるボタンは、作り手の HTML に覆われずに押せる
  await modal.locator(".close").click();
  await expect(modal).toBeHidden();
});
