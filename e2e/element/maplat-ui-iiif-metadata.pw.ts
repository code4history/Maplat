// <maplat-ui> の確認ページ（demo/element.html?app=iiif-bibliography-sample）で、IIIF の書誌の表を確かめる。
//   - アプリの設定で iiifMetadata: "all" とした地図だけ、地図情報の下に書誌の表が出る
//   - 表の値はサニタイズされる（項目名は文字のまま）。形の合わない要素があっても地図情報は開く
//   - IIIF の画像の地図ではキャッシュの節が出ない・使えない地図は一覧に出ない
//   - Viewer は Manifest を取りに行かない
// 資料: public/apps/iiif-bibliography-sample.json・public/maps/iiif_bibliography_*.json。
// IIIF の info.json とタイルはこの試験の中で返す（e2e/fixtures/ndl-948741-r1.info.json の @id だけを差し替える）。
// localhost 以外の要求は外へ出さずに止めて数える。
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/* eslint-disable @typescript-eslint/no-explicit-any */

const PAGE = "/demo/element.html?app=iiif-bibliography-sample";
const IIIF_BASE = "https://dl.ndl.go.jp/api/iiif/948741/R0000003";
const IIIF_BROKEN = "https://dl.ndl.go.jp/api/iiif/948741/R0000003-broken";
const MANIFEST_URL = "https://dl.ndl.go.jp/api/iiif/948741/manifest.json";
const EXTERNAL_TILES =
  /t\.tilemap\.jp|cyberjapandata\.gsi\.go\.jp|tile\.openstreetmap\.org/;
const TILE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "base64"
);

const SHOWN = "iiif_bibliography_sample";
const UNSAFE = "iiif_bibliography_unsafe_sample";
const BROKEN = "iiif_bibliography_broken_sample";
const NOT_SHOWN = [
  "iiif_bibliography_unspecified_sample",
  "iiif_bibliography_hidden_sample",
  "iiif_bibliography_upper_sample"
];

function infoJson(): string {
  const info = JSON.parse(
    readFileSync(
      resolve(process.cwd(), "e2e/fixtures/ndl-948741-r1.info.json"),
      "utf-8"
    )
  ) as Record<string, unknown>;
  // 資料の @id は R0000001。地図の配信の URL は R0000003 なので、@id だけを差し替える
  info["@id"] = IIIF_BASE;
  return JSON.stringify(info);
}

/**
 * 受け皿（localhost 以外を止めて数える）を最初に登録し、差し替えと Manifest を数える route をその後に登録する
 * （後に登録した route が先に動く）。
 */
async function guardNetwork(page: Page) {
  const net = { strayHits: [] as string[], manifestHits: 0 };
  await page.route("**/*", route => {
    const url = route.request().url();
    if (
      url.startsWith("http://localhost:") ||
      url.startsWith("http://127.0.0.1:")
    ) {
      return route.continue();
    }
    net.strayHits.push(url);
    return route.abort();
  });
  await page.route(EXTERNAL_TILES, route =>
    route.fulfill({ status: 200, contentType: "image/png", body: TILE_PNG })
  );
  // enable-cache のときタイルのキャッシュ（Weiwudi）が Service Worker の有無を確かめる仮の URL。
  // 実在のホストではなく Service Worker が受ける口なので、SW の無いこの試験では 404 を返す
  await page.route("https://weiwudi.example.com/**", route =>
    route.fulfill({ status: 404, body: "" })
  );
  const info = infoJson();
  const cors = { "access-control-allow-origin": "*" };
  await page.route(`${IIIF_BROKEN}/**`, route =>
    route.fulfill({ status: 404, headers: cors, body: "not found" })
  );
  await page.route(`${IIIF_BASE}/**`, route => {
    const url = route.request().url();
    if (url === `${IIIF_BASE}/info.json`) {
      return route.fulfill({
        status: 200,
        headers: { ...cors, "content-type": "application/json" },
        body: info
      });
    }
    return route.fulfill({
      status: 200,
      headers: { ...cors, "content-type": "image/png" },
      body: TILE_PNG
    });
  });
  await page.route(MANIFEST_URL, route => {
    net.manifestHits++;
    return route.abort();
  });
  return net;
}

async function openPage(page: Page, query = "", mapID?: string) {
  await page.goto(`${PAGE}${query}${mapID ? `#!s:${mapID}` : ""}`);
  await expect(page.getByTestId("status")).toHaveAttribute(
    "data-state",
    "ready",
    { timeout: 90_000 }
  );
}

const currentMapId = (page: Page) =>
  page.evaluate(() => (window as any).__maplatUi.app.currentMapId as string);

const iiifMeta = (page: Page, mapID: string) =>
  page.evaluate(
    id => (window as any).__maplatUi.app.getMapMeta(id)?.iiif ?? null,
    mapID
  );

async function openMapInfo(page: Page) {
  await page.locator('[part="info"] button').click();
  await expect(page.locator('[part="map-info-modal"]')).toBeVisible();
}

test.describe("iiif-metadata-table", () => {
  test("the table follows the copied metadata and the Viewer does not fetch the manifest", async ({
    page
  }) => {
    const net = await guardNetwork(page);
    await openPage(page);
    expect(await currentMapId(page)).toBe(SHOWN);
    const iiif = await iiifMeta(page, SHOWN);
    expect(iiif?.display).toBe("all");
    const entries = (iiif.metadata as Array<{ from: string }>).filter(
      e => e && (e.from === "manifest" || e.from === "canvas")
    );
    const manifestCount = entries.filter(e => e.from === "manifest").length;
    const canvasCount = entries.filter(e => e.from === "canvas").length;
    expect(manifestCount).toBeGreaterThan(0);

    await openMapInfo(page);
    const section = page.locator('[part="map-meta-iiif"]');
    await expect(section).toHaveCount(1);
    await expect(
      section.locator('[part="iiif-manifest"] tbody tr')
    ).toHaveCount(manifestCount);
    await expect(section.locator('[part="iiif-canvas"]')).toHaveCount(
      canvasCount > 0 ? 1 : 0
    );
    await expect(section.locator("tbody tr")).toHaveCount(entries.length);
    await expect(section.locator('[part="iiif-copied-at"]')).toContainText(
      iiif.copiedAt
    );
    const link = section.locator('[part="iiif-manifest-link"]');
    await expect(link).toHaveCount(1);
    expect(await link.getAttribute("href")).toMatch(/^https?:\/\//);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    // 既存の地図情報の行は今どおり出る（表は最後の行）
    const lastPart = await page
      .locator('[part="map-info-modal"] dl.map-meta > dd')
      .last()
      .getAttribute("part");
    expect(lastPart).toBe("map-meta-iiif");

    expect(net.manifestHits).toBe(0);
    expect(net.strayHits).toEqual([]);
  });

  test("both groups are shown under their own headings", async ({ page }) => {
    const net = await guardNetwork(page);
    await openPage(page, "", UNSAFE);
    expect(await currentMapId(page)).toBe(UNSAFE);
    const iiif = await iiifMeta(page, UNSAFE);
    const entries = iiif.metadata as Array<{ from: string }>;
    await openMapInfo(page);
    const section = page.locator('[part="map-meta-iiif"]');
    await expect(
      section.locator('[part="iiif-manifest"] tbody tr')
    ).toHaveCount(entries.filter(e => e.from === "manifest").length);
    await expect(section.locator('[part="iiif-canvas"] tbody tr')).toHaveCount(
      entries.filter(e => e.from === "canvas").length
    );
    await expect(section.locator("h4")).toHaveText([
      "Manifest の書誌",
      "canvas の書誌"
    ]);
    expect(net.manifestHits).toBe(0);
    expect(net.strayHits).toEqual([]);
  });

  test("a 375 px wide screen has no horizontal scroll in the map information", async ({
    page
  }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    const net = await guardNetwork(page);
    await openPage(page, "", UNSAFE);
    await openMapInfo(page);
    const section = page.locator('[part="map-meta-iiif"]');
    await expect(section).toHaveCount(1);
    for (const selector of [
      '[part="map-meta-iiif"]',
      '[part="map-info-modal"] dl.map-meta',
      '[part="map-info-modal"] .body'
    ]) {
      const [scroll, client] = await page
        .locator(selector)
        .evaluate(el => [el.scrollWidth, el.clientWidth]);
      expect(scroll, selector).toBeLessThanOrEqual(client);
    }
    expect(net.strayHits).toEqual([]);
  });

  for (const mapID of NOT_SHOWN) {
    test(`no table for ${mapID}`, async ({ page }) => {
      const net = await guardNetwork(page);
      await openPage(page, "", mapID);
      expect(await currentMapId(page)).toBe(mapID);
      const iiif = await iiifMeta(page, mapID);
      // 書誌の写しは持っているが、表は出さない設定
      expect(iiif?.display).toBe("hidden");
      expect(iiif?.metadata?.length).toBeGreaterThan(0);
      await openMapInfo(page);
      await expect(page.locator('[part="map-meta-iiif"]')).toHaveCount(0);
      expect(
        await page.locator('dd[part^="map-meta-"]').count()
      ).toBeGreaterThan(0);
      expect(net.manifestHits).toBe(0);
      expect(net.strayHits).toEqual([]);
    });
  }
});

test.describe("iiif-metadata-sanitize", () => {
  test("values are sanitized, labels stay text and malformed entries do not break the dialog", async ({
    page
  }) => {
    const net = await guardNetwork(page);
    await openPage(page, "", UNSAFE);
    expect(await currentMapId(page)).toBe(UNSAFE);
    await openMapInfo(page);
    const section = page.locator('[part="map-meta-iiif"]');
    await expect(section).toHaveCount(1);
    await expect(section.locator("script, img, div")).toHaveCount(0);
    await expect(section.locator("[onerror], [onclick]")).toHaveCount(0);
    await expect(section.locator('a[href^="javascript:"]')).toHaveCount(0);
    // 安全なリンクは残る
    await expect(
      section.locator('td a[href="https://example.com/"]')
    ).toHaveCount(1);

    // 複数の値は <br> でつながり、"<br>" の文字は出ない
    const multi = section.locator("tr", { hasText: "Multiple values" });
    await expect(multi.locator("td br")).toHaveCount(1);
    expect(await multi.locator("td").textContent()).not.toContain("<br>");

    // 項目名はタグとして解釈しない
    const boldRow = section.locator("tr").first();
    await expect(boldRow.locator("th")).toHaveText("<b>Bold label</b>");
    await expect(boldRow.locator("th b")).toHaveCount(0);

    // 言語つきの項目は表示の言語で選ぶ
    await expect(
      section.locator("tr", { hasText: "言語つきの項目" }).locator("td")
    ).toHaveText("言語つきの値");

    // 形の合わない要素が混ざっていても、既存の地図情報の行は出る
    expect(
      await page.locator('[part="map-info-modal"] dl.map-meta > dt').count()
    ).toBeGreaterThan(1);
    // 複数の値の題名に "<br>" の文字が出ない
    expect(
      await page.locator('[part="map-info-title"]').textContent()
    ).not.toContain("<br>");

    expect(await page.evaluate(() => (window as any).__iiifXss)).toBe(
      undefined
    );
    expect(net.manifestHits).toBe(0);
    expect(net.strayHits).toEqual([]);
  });
});

test.describe("cache-section", () => {
  test("an IIIF image map keeps the cache section hidden even with enable-cache", async ({
    page
  }) => {
    const net = await guardNetwork(page);
    await openPage(page, "&cache=1");
    expect(
      await page.evaluate(() =>
        (window as any).__maplatUi.hasAttribute("enable-cache")
      )
    ).toBe(true);
    expect(await currentMapId(page)).toBe(SHOWN);
    expect(
      await page.evaluate(
        id => (window as any).__maplatUi.app.getMapCacheEnable(id),
        SHOWN
      )
    ).toBe(false);
    await openMapInfo(page);
    await expect(page.locator('[part="map-cache"]')).toBeHidden();
    expect(net.strayHits).toEqual([]);
  });

  test("an unusable map is not listed and cannot be the starting map", async ({
    page
  }) => {
    const net = await guardNetwork(page);
    await openPage(page, "", BROKEN);
    const ids = await page.evaluate(() =>
      (window as any).__maplatUi.app
        .listMaps()
        .map((m: { mapID: string }) => m.mapID)
    );
    expect(ids).toContain(SHOWN);
    expect(ids).not.toContain(BROKEN);
    expect(await currentMapId(page)).not.toBe(BROKEN);
    await openMapInfo(page);
    await expect(page.locator('[part="map-info-title"]')).not.toHaveText("");
    expect(net.strayHits).toEqual([]);
  });
});
