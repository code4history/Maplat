// 地図情報（「i」ボタン）に、表示中の地図ごとの帰属表記が全文で出ることを、Core の <maplat-app> の上で確かめる。
//   - 前面がベースマップ: そのベースマップの題名の見出しと attr
//   - 前面が古地図: 古地図の attr は「地図画像帰属」の行、背面のベースマップは見出しを付けて別の行
//   - 前面が重ね地図: 重ね地図 → 下のベースマップの順
//   - attr の無い Google の地図: 提供元の申告（Map Tiles API の表示範囲の copyright）を全文で出す
//   - 地図の右下の出典は 2 行で切れても、地図情報では切らない
// 資料: e2e/fixtures/mapinfo-attribution.html（設定ファイルはこの試験が route で返す）。
// 外への要求は出さない: タイル・Map Tiles API は作った応答で返し、それ以外の localhost 以外の要求は止めて数える。
// 写真の保存先は環境変数 MAPLAT_UI_SHOTS_DIR（無ければ test-results/element/mapinfo-attribution-shots）。
import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

/* eslint-disable @typescript-eslint/no-explicit-any */

const SHOTS =
  process.env.MAPLAT_UI_SHOTS_DIR ||
  resolve(process.cwd(), "test-results/element/mapinfo-attribution-shots");
const PAGE = "/e2e/fixtures/mapinfo-attribution.html";

// 地図の右下では 2 行を超えて「…」になる長さの帰属表記（地図情報では切らずに全文を出す）
const LONG_ATTR = `${"Very long attribution text of the overlay owner. ".repeat(20)}END`;
const GOOGLE_COPYRIGHT =
  "Map data ©2026 Google, Imagery ©2026 Example Provider, ZENRIN";

const SETTING = {
  appName: "Map information attributions",
  lang: "en",
  homePosition: [139.5321, 36.249302],
  defaultZoom: 17,
  startFrom: "tatebayashi_ojozu",
  sources: [
    // 古地図（public/maps/tatebayashi_ojozu.json。attr は国立国会図書館）
    { mapID: "tatebayashi_ojozu", label: "Tatebayashi" },
    {
      mapID: "kanto_rapid",
      maptype: "overlay",
      label: "Rapid Survey Map",
      title: { ja: "関東迅速測図", en: "Rapid Survey Map of Kanto Plain" },
      attr: { ja: `農研機構 ${LONG_ATTR}`, en: `NARO ${LONG_ATTR}` },
      url: "https://tiles.example.org/overlay/{z}/{x}/{y}.png",
      maxZoom: 18,
      envelopeLngLats: [
        [139.45, 36.2],
        [139.63, 36.2],
        [139.63, 36.29],
        [139.45, 36.29]
      ]
    },
    {
      mapID: "osm",
      maptype: "base",
      label: "OSM",
      title: { ja: "オープンストリートマップ", en: "OpenStreetMap" },
      attr: "©︎ OpenStreetMap contributors",
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      maxZoom: 19
    },
    // attr の無い Google の地図（出典は Map Tiles API の copyright だけ）
    {
      mapID: "google",
      maptype: "google",
      label: "Google",
      title: { ja: "Google の地図", en: "Google roadmap" }
    }
  ]
};

const TILE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "base64"
);
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS"
};

/** 外への要求を止め（止めた URL を返す）、タイルと Map Tiles API は作った応答で返す。設定ファイルも返す。 */
async function guardNetwork(page: Page, setting: unknown = SETTING) {
  const blocked: string[] = [];
  await page.route(
    url => !["127.0.0.1", "localhost"].includes(url.hostname),
    route => {
      blocked.push(route.request().url());
      return route.abort();
    }
  );
  const tile = {
    status: 200,
    headers: CORS,
    contentType: "image/png",
    body: TILE_PNG
  };
  await page.route(/tile\.openstreetmap\.org\//, route => route.fulfill(tile));
  await page.route(/t\.tilemap\.jp\//, route => route.fulfill(tile));
  await page.route(/tiles\.example\.org\//, route => route.fulfill(tile));
  await page.route(/tile\.googleapis\.com\//, route => {
    const url = new URL(route.request().url());
    if (route.request().method() === "OPTIONS")
      return route.fulfill({ status: 204, headers: CORS });
    if (url.pathname === "/v1/createSession") {
      const expiry = String(Math.floor(Date.now() / 1000) + 3600);
      return route.fulfill({
        status: 200,
        headers: CORS,
        contentType: "application/json",
        body: JSON.stringify({
          session: "example-session",
          expiry,
          tileWidth: 256,
          tileHeight: 256,
          imageFormat: "png"
        })
      });
    }
    if (url.pathname === "/tile/v1/viewport") {
      return route.fulfill({
        status: 200,
        headers: CORS,
        contentType: "application/json",
        body: JSON.stringify({ copyright: GOOGLE_COPYRIGHT })
      });
    }
    return route.fulfill(tile);
  });
  await page.route(/\/apps\/mapinfo-attribution\.json$/, route =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(setting)
    })
  );
  return blocked;
}

async function openPage(page: Page, lang = "en", setting: unknown = SETTING) {
  await page.setViewportSize({ width: 1280, height: 800 });
  const blocked = await guardNetwork(page, setting);
  await page.goto(`${PAGE}?lang=${lang}`);
  await expect(page.getByTestId("status")).toHaveAttribute(
    "data-state",
    "ready",
    { timeout: 90_000 }
  );
  return blocked;
}

async function changeMap(page: Page, mapID: string) {
  await page.evaluate(
    id => (window as any).__maplatUi.app.changeMap(id),
    mapID
  );
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).__maplatUi.app.currentMapId)
    )
    .toBe(mapID);
}

async function openMapInfo(page: Page) {
  await page.locator('[part="info"] button').click();
  await expect(page.locator('[part="map-info-modal"]')).toBeVisible();
}

/** 帰属表記の行の、地図ごとの組（見出し・本文の文字）。行が無ければ null。 */
function attributionSections(page: Page) {
  return page.evaluate(() => {
    const root = (window as any).__maplatUi.shadowRoot as ShadowRoot;
    const cell = root.querySelector('[part="map-meta-attributions"]');
    if (!cell) return null;
    return [...cell.querySelectorAll("section.attribution-map")].map(s => ({
      mapID: (s as HTMLElement).dataset.mapId,
      heading: s.querySelector("h4")?.textContent ?? "",
      items: [...s.querySelectorAll(".attribution-item")].map(
        i => i.textContent ?? ""
      )
    }));
  });
}

/** メタデータの行の項目名（dt）。 */
function metaLabels(page: Page) {
  return page.evaluate(() => {
    const root = (window as any).__maplatUi.shadowRoot as ShadowRoot;
    return [...root.querySelectorAll('[part="map-meta"] dt')].map(
      dt => dt.textContent
    );
  });
}

async function shoot(page: Page, name: string) {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: resolve(SHOTS, name) });
}

test.describe("map information shows the full attributions of the displayed maps", () => {
  test("old map in front: the old map's attr row stays, the base map behind gets its own heading", async ({
    page
  }) => {
    const blocked = await openPage(page);
    // 古地図を前面に、背面のベースマップは OSM にする
    await changeMap(page, "osm");
    await changeMap(page, "tatebayashi_ojozu");
    expect(
      await page.evaluate(
        () => (window as any).__maplatUi.app.state.backgroundID
      )
    ).toBe("osm");
    await openMapInfo(page);
    const root = page.locator("#ui");
    await expect(root.locator('[part="map-meta-attr"]')).toHaveText(
      "Contributed by National Diet Library of Japan"
    );
    expect(await attributionSections(page)).toEqual([
      {
        mapID: "osm",
        heading: "OpenStreetMap",
        items: ["©︎ OpenStreetMap contributors"]
      }
    ]);
    // 帰属表記の行はメタデータの行（古地図の「地図画像帰属」を含む）の後
    const labels = await metaLabels(page);
    expect(labels.at(-1)).toBe("Attributions of the displayed maps");
    expect(labels.indexOf("Map image attribution")).toBeGreaterThanOrEqual(0);
    await shoot(page, "mapinfo-old-map-front.png");
    expect(blocked).toEqual([]);
  });

  test("base map in front: the base map's title and attr, without the map image attribution row", async ({
    page
  }) => {
    const blocked = await openPage(page, "ja");
    await changeMap(page, "osm");
    await openMapInfo(page);
    expect(await attributionSections(page)).toEqual([
      {
        mapID: "osm",
        heading: "オープンストリートマップ",
        items: ["©︎ OpenStreetMap contributors"]
      }
    ]);
    const labels = await metaLabels(page);
    expect(labels).toContain("表示中の地図の帰属表記");
    expect(labels).not.toContain("地図画像帰属");
    await shoot(page, "mapinfo-base-map-only.png");
    expect(blocked).toEqual([]);
  });

  test("overlay in front: the overlay then the base map under it, the long attr in full", async ({
    page
  }) => {
    const blocked = await openPage(page);
    await changeMap(page, "osm");
    await changeMap(page, "kanto_rapid");
    // 地図の右下の重ね地図の箱は 2 行で切れる（Core の表示。中身は全文で、見た目だけが切れる）
    const clamped = await page.evaluate(() => {
      const box = document.querySelector(
        "maplat-app .maplat-attribution-overlay"
      ) as HTMLElement | null;
      return box ? box.scrollHeight > box.clientHeight + 1 : null;
    });
    expect(clamped).toBe(true);
    await openMapInfo(page);
    expect(await attributionSections(page)).toEqual([
      {
        mapID: "kanto_rapid",
        heading: "Rapid Survey Map of Kanto Plain",
        items: [`NARO ${LONG_ATTR}`]
      },
      {
        mapID: "osm",
        heading: "OpenStreetMap",
        items: ["©︎ OpenStreetMap contributors"]
      }
    ]);
    // 地図情報の中では切らない（最後の語まで見える）
    const lastWordVisible = await page.evaluate(() => {
      const root = (window as any).__maplatUi.shadowRoot as ShadowRoot;
      const item = root.querySelector(
        '[part="map-meta-attributions"] section[data-map-id="kanto_rapid"] .attribution-item'
      ) as HTMLElement;
      return item.scrollHeight <= item.clientHeight + 1;
    });
    expect(lastWordVisible).toBe(true);
    await shoot(page, "mapinfo-overlay-front.png");
    expect(blocked).toEqual([]);
  });

  test("Google map without attr: the provider-declared copyright from the Map Tiles API, in full", async ({
    page
  }) => {
    const blocked = await openPage(page);
    await changeMap(page, "google");
    // Core が読んだ提供元の申告（地図の右下と同じ値）
    await expect
      .poll(
        () =>
          page.evaluate(
            () => (window as any).__maplatUi.app.providerAttributions
          ),
        { timeout: 30_000 }
      )
      .toEqual([{ mapID: "google", attributions: [GOOGLE_COPYRIGHT] }]);
    await openMapInfo(page);
    expect(await attributionSections(page)).toEqual([
      { mapID: "google", heading: "Google roadmap", items: [GOOGLE_COPYRIGHT] }
    ]);
    await shoot(page, "mapinfo-google-provider.png");
    expect(blocked).toEqual([]);
  });

  test("a map with neither attr nor a provider declaration shows nothing", async ({
    page
  }) => {
    // 古地図の attr を外す（地図の設定の JSON を取って書き換える）
    await page.route(/\/maps\/tatebayashi_ojozu\.json$/, async route => {
      const response = await route.fetch();
      const json = await response.json();
      delete json.attr;
      return route.fulfill({ response, body: JSON.stringify(json) });
    });
    const withoutAttr = {
      ...SETTING,
      sources: SETTING.sources.map(source =>
        source.mapID === "osm" ? { ...source, attr: undefined } : source
      )
    };
    const blocked = await openPage(page, "en", withoutAttr);
    await changeMap(page, "osm");
    await changeMap(page, "tatebayashi_ojozu");
    // Core も申告を持たない（ライブラリの既定値で埋めていない）
    expect(
      await page.evaluate(
        () => (window as any).__maplatUi.app.providerAttributions
      )
    ).toEqual([]);
    await openMapInfo(page);
    expect(await attributionSections(page)).toBeNull();
    const labels = await metaLabels(page);
    expect(labels).not.toContain("Map image attribution");
    expect(labels).not.toContain("Attributions of the displayed maps");
    await shoot(page, "mapinfo-no-attribution.png");
    expect(blocked).toEqual([]);
  });

  test("attributionChanged keeps the focus on the credit the user is on", async ({
    page
  }) => {
    // 出典のリンクのフォーカスを確かめるため、OSM の attr にリンクを 2 つ入れる
    const linked = {
      ...SETTING,
      sources: SETTING.sources.map(source =>
        source.mapID === "osm"
          ? {
              ...source,
              attr: '<a href="https://example.org/credits">Map data credits</a> and <a href="https://example.org/terms">Terms of use</a>'
            }
          : source
      )
    };
    const blocked = await openPage(page, "en", linked);
    await changeMap(page, "osm");
    await openMapInfo(page);
    // 「Terms of use」のリンクにフォーカスし、その要素に印（属性でなく JS の持ち物）を付けて覚える
    expect(
      await page.evaluate(() => {
        const root = (window as any).__maplatUi.shadowRoot as ShadowRoot;
        const link = root.querySelector(
          '[part="map-meta-attributions"] a[href="https://example.org/terms"]'
        ) as any;
        link.probe = "keep";
        link.focus();
        return root.activeElement?.getAttribute("href");
      })
    ).toBe("https://example.org/terms");

    // 中身が変わらない attributionChanged: DOM を差し替えず、フォーカスも動かさない
    await page.evaluate(() => {
      const app = (window as any).__maplatUi.app as HTMLElement;
      app.dispatchEvent(new Event("attributionChanged"));
    });
    expect(
      await page.evaluate(() => {
        const root = (window as any).__maplatUi.shadowRoot as ShadowRoot;
        const link = root.querySelector(
          '[part="map-meta-attributions"] a[href="https://example.org/terms"]'
        ) as any;
        return {
          probe: link.probe ?? null,
          focus: root.activeElement?.getAttribute("href") ?? null
        };
      })
    ).toEqual({ probe: "keep", focus: "https://example.org/terms" });

    // 提供元の申告が届いて中身が変わる: 差し替えても同じ URL のリンクにフォーカスが戻る
    await page.evaluate(() => {
      const app = (window as any).__maplatUi.app as HTMLElement;
      Object.defineProperty(app, "providerAttributions", {
        configurable: true,
        get: () => [
          {
            mapID: "osm",
            attributions: [
              '<a href="https://example.org/extra">Extra credit</a>'
            ]
          }
        ]
      });
      app.dispatchEvent(new Event("attributionChanged"));
    });
    expect(
      await page.evaluate(() => {
        const root = (window as any).__maplatUi.shadowRoot as ShadowRoot;
        const link = root.querySelector(
          '[part="map-meta-attributions"] a[href="https://example.org/terms"]'
        ) as any;
        return {
          probe: link.probe ?? null,
          focus: root.activeElement?.getAttribute("href") ?? null,
          extra: !!root.querySelector(
            '[part="map-meta-attributions"] a[href="https://example.org/extra"]'
          )
        };
      })
    ).toEqual({
      probe: null,
      focus: "https://example.org/terms",
      extra: true
    });

    // フォーカスのあった申告が消えたときは、モーダルの中に留める（閉じるボタンへ）
    await page.evaluate(() => {
      const root = (window as any).__maplatUi.shadowRoot as ShadowRoot;
      (
        root.querySelector(
          '[part="map-meta-attributions"] a[href="https://example.org/extra"]'
        ) as HTMLElement
      ).focus();
      const app = (window as any).__maplatUi.app as HTMLElement;
      Object.defineProperty(app, "providerAttributions", {
        configurable: true,
        get: () => [
          { mapID: "osm", attributions: ["Plain credit without a link"] }
        ]
      });
      app.dispatchEvent(new Event("attributionChanged"));
    });
    expect(
      await page.evaluate(() => {
        const root = (window as any).__maplatUi.shadowRoot as ShadowRoot;
        return root.activeElement?.getAttribute("part") ?? null;
      })
    ).toBe("map-info-close");
    expect(blocked).toEqual([]);
  });
});
