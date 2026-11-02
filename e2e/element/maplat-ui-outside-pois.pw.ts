// <maplat-ui> の確認ページ（demo/element.html?app=outside-pois-sample）で、古地図の紙の外にある POI を確かめる。
//   - hide-outside-pois の 4 つの出し方（属性・プロパティ・appOption・旧 API の option）で、範囲外の POI が押せなくなる
//   - 指定が無ければ、範囲外の POI をクリック・タップすると吹き出しが開く（範囲内の POI と同じ部品）
//   - 範囲外の POI を開いた状態 URL（om:）を開き直すと、同じ POI が開く
// 資料: public/apps/outside-pois-sample.json・public/pois/outside-pois-sample.geojson。
// 外部への要求は出さない（タイルは単色の PNG に差し替え、それ以外の localhost 以外の要求は止めて数える）。
import { test, expect, type Page } from "@playwright/test";

/* eslint-disable @typescript-eslint/no-explicit-any */

const TILE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "base64"
);
const EXTERNAL_TILES =
  /t\.tilemap\.jp|cyberjapandata\.gsi\.go\.jp|tile\.openstreetmap\.org/;

const PAGE = "/demo/element.html?app=outside-pois-sample";
const LEGACY_PAGE = "/e2e/fixtures/legacy-outside-pois.html";

// 資料の POI（public/pois/outside-pois-sample.geojson と同じ値）
const INSIDE = { lng: 139.5416, lat: 36.248, name: "範囲内の見本" };
const OUTSIDE = { lng: 139.541583, lat: 36.23833, name: "範囲外の見本" };
const FAR = { id: "outside-far-sample", name: "遠くの範囲外の見本" };

// 紙の外が画面に入るように引いた縮尺（この縮尺で範囲外の見本は紙のすぐ外・画面の中に来る）
const ZOOMED_OUT = 14;
// ピンは下端が地点。頭の丸の中心（地点の 36 px 上）を押す
const PIN_HEAD = 36;

/** localhost 以外への要求を止めて数える受け皿と、タイルの差し替えを置く（受け皿を先に登録する＝最後に動く）。 */
async function guardNetwork(page: Page) {
  // 確認ページの <maplat-ui>（旧 API のページでは互換層が作った要素）を返す口
  await page.addInitScript(() => {
    (window as any).__ui = () =>
      (window as any).__maplatUiElement || (window as any).__maplatUi;
  });
  const strayHits: string[] = [];
  await page.route("**/*", route => {
    const url = route.request().url();
    if (
      url.startsWith("http://localhost:") ||
      url.startsWith("http://127.0.0.1:")
    ) {
      return route.continue();
    }
    strayHits.push(url);
    return route.abort();
  });
  await page.route(EXTERNAL_TILES, route =>
    route.fulfill({ status: 200, contentType: "image/png", body: TILE_PNG })
  );
  return strayHits;
}

async function openElementPage(page: Page, url = PAGE) {
  await page.goto(url);
  await expect(page.getByTestId("status")).toHaveAttribute(
    "data-state",
    "ready",
    { timeout: 90_000 }
  );
}

async function openLegacyPage(page: Page, query = "") {
  await page.goto(`${LEGACY_PAGE}${query}`);
  await expect(page.locator("#status")).toHaveText("READY", {
    timeout: 90_000
  });
  await page.evaluate(() => {
    (window as any).__maplatUiElement = document.querySelector("maplat-ui");
  });
}

/** 視点が止まるまで待つ（連続 3 回、同じ視点を読めたら止まったとみなす）。 */
async function waitViewSettled(page: Page) {
  let last = "";
  let stable = 0;
  for (let i = 0; i < 60 && stable < 3; i++) {
    await page.waitForTimeout(250);
    const now = await page.evaluate(() =>
      JSON.stringify((window as any).__ui().app.viewpoint)
    );
    if (now === last) stable++;
    else {
      stable = 0;
      last = now;
    }
  }
}

async function zoomOut(page: Page) {
  await page.evaluate(
    z => (window as any).__ui().app.setViewpoint({ mercZoom: z }),
    ZOOMED_OUT
  );
  await waitViewSettled(page);
}

/** POI のピンの頭の画面の位置（Core の公開面 lngLatToClientPoint の点から PIN_HEAD 上）。 */
async function pinHead(page: Page, poi: { lng: number; lat: number }) {
  const pt = await page.evaluate(
    ([lng, lat]) => (window as any).__ui().app.lngLatToClientPoint(lng, lat),
    [poi.lng, poi.lat] as const
  );
  expect(pt, "the POI must be on the screen").not.toBeNull();
  const viewport = page.viewportSize()!;
  const point = { x: pt.x, y: pt.y - PIN_HEAD };
  expect(point.x).toBeGreaterThan(0);
  expect(point.x).toBeLessThan(viewport.width);
  expect(point.y).toBeGreaterThan(0);
  expect(point.y).toBeLessThan(viewport.height);
  return point;
}

const modalOf = (page: Page) => page.locator('[part="poi-modal"]');

async function closeModal(page: Page) {
  await page.locator('[part="poi-close"]').click();
  await expect(modalOf(page)).toBeHidden();
}

/** 押した後、吹き出しが開かないこと（開く場合の待ちと同じ長さだけ待つ）。 */
async function expectStaysClosed(page: Page) {
  await page.waitForTimeout(2500);
  await expect(modalOf(page)).toBeHidden();
}

/** 吹き出しの中の part の並び（範囲内と範囲外で同じ部品かを比べる）。 */
const modalParts = (page: Page) =>
  modalOf(page).evaluate(modal =>
    Array.from(modal.querySelectorAll("[part]")).map(
      el => `${el.tagName.toLowerCase()}[${el.getAttribute("part")}]`
    )
  );

test.describe("hide-outside-pois", () => {
  test("attribute: the child receives it and the outside POI cannot be pressed", async ({
    page
  }) => {
    const strayHits = await guardNetwork(page);
    await openElementPage(page);
    await page.evaluate(() =>
      (window as any).__maplatUi.setAttribute("hide-outside-pois", "")
    );
    expect(
      await page.evaluate(() =>
        (window as any).__maplatUi
          .querySelector("maplat-app")
          .hasAttribute("hide-outside-pois")
      )
    ).toBe(true);
    await zoomOut(page);
    const outside = await pinHead(page, OUTSIDE);
    await page.mouse.click(outside.x, outside.y);
    await expectStaysClosed(page);
    // 範囲内の POI は影響を受けない
    const inside = await pinHead(page, INSIDE);
    await page.mouse.click(inside.x, inside.y);
    await expect(modalOf(page)).toBeVisible();
    await expect(page.locator('[part="poi-title"]')).toContainText(INSIDE.name);
    expect(strayHits).toEqual([]);
  });

  test("property: the child receives it and the outside POI cannot be pressed", async ({
    page
  }) => {
    const strayHits = await guardNetwork(page);
    await openElementPage(page);
    await page.evaluate(() => {
      (window as any).__maplatUi.hideOutsidePois = true;
    });
    expect(
      await page.evaluate(() => {
        const ui = (window as any).__maplatUi;
        return [
          ui.hasAttribute("hide-outside-pois"),
          ui.querySelector("maplat-app").hasAttribute("hide-outside-pois")
        ];
      })
    ).toEqual([true, true]);
    await zoomOut(page);
    const outside = await pinHead(page, OUTSIDE);
    await page.mouse.click(outside.x, outside.y);
    await expectStaysClosed(page);
    expect(strayHits).toEqual([]);
  });

  test("appOption: the child receives it and the outside POI cannot be pressed", async ({
    page
  }) => {
    const strayHits = await guardNetwork(page);
    await openElementPage(page);
    // 起動時だけ効くキーなので、新しい要素を作り、DOM に足す前に appOption を渡す
    await page.evaluate(async () => {
      const old = (window as any).__maplatUi as HTMLElement;
      const ui = document.createElement("maplat-ui") as any;
      ui.setAttribute("app-id", "outside-pois-sample");
      ui.setAttribute("lang", "ja");
      ui.style.height = "100%";
      const app = document.createElement("maplat-app");
      app.setAttribute("slot", "map");
      ui.appendChild(app);
      ui.appOption = { hideOutsidePois: true };
      old.replaceWith(ui);
      (window as any).__maplatUi = ui;
      await ui.ready;
    });
    expect(
      await page.evaluate(
        () =>
          (window as any).__maplatUi.querySelector("maplat-app").appOption
            ?.hideOutsidePois
      )
    ).toBe(true);
    await zoomOut(page);
    const outside = await pinHead(page, OUTSIDE);
    await page.mouse.click(outside.x, outside.y);
    await expectStaysClosed(page);
    expect(strayHits).toEqual([]);
  });

  test("legacy option: MaplatUi with hideOutsidePois makes the outside POI unpressable", async ({
    page
  }) => {
    const strayHits = await guardNetwork(page);
    await openLegacyPage(page);
    await zoomOut(page);
    const outside = await pinHead(page, OUTSIDE);
    await page.mouse.click(outside.x, outside.y);
    await expectStaysClosed(page);
    expect(strayHits).toEqual([]);
  });

  test("legacy option: without hideOutsidePois the outside POI opens", async ({
    page
  }) => {
    const strayHits = await guardNetwork(page);
    await openLegacyPage(page, "?hideOutsidePois=0");
    await zoomOut(page);
    const outside = await pinHead(page, OUTSIDE);
    await page.mouse.click(outside.x, outside.y);
    await expect(modalOf(page)).toBeVisible();
    await expect(page.locator('[part="poi-title"]')).toContainText(
      OUTSIDE.name
    );
    expect(strayHits).toEqual([]);
  });
});

test.describe("outside-poi-bubble", () => {
  test("click: the outside POI opens the same bubble as an inside POI", async ({
    page
  }) => {
    const strayHits = await guardNetwork(page);
    await openElementPage(page);
    await zoomOut(page);

    const inside = await pinHead(page, INSIDE);
    await page.mouse.click(inside.x, inside.y);
    await expect(modalOf(page)).toBeVisible();
    await expect(page.locator('[part="poi-title"]')).toContainText(INSIDE.name);
    const insideParts = await modalParts(page);
    await closeModal(page);

    // 吹き出しを開くと中心がその POI へ寄るので、引き直してから押す
    await zoomOut(page);
    const outside = await pinHead(page, OUTSIDE);
    await page.mouse.click(outside.x, outside.y);
    await expect(modalOf(page)).toBeVisible();
    await expect(page.locator('[part="poi-title"]')).toContainText(
      OUTSIDE.name
    );
    expect(await modalParts(page)).toEqual(insideParts);
    expect(strayHits).toEqual([]);
  });

  test.describe("touch", () => {
    test.use({ hasTouch: true });

    test("tap: the outside POI opens the bubble", async ({ page }) => {
      const strayHits = await guardNetwork(page);
      await openElementPage(page);
      await zoomOut(page);
      const outside = await pinHead(page, OUTSIDE);
      await page.touchscreen.tap(outside.x, outside.y);
      await expect(modalOf(page)).toBeVisible();
      await expect(page.locator('[part="poi-title"]')).toContainText(
        OUTSIDE.name
      );
      expect(strayHits).toEqual([]);
    });
  });
});

test.describe("outside-poi-state-url", () => {
  test("the opened outside POI is written to the URL and reopens from it", async ({
    page,
    context
  }) => {
    const strayHits = await guardNetwork(page);
    await openElementPage(page);
    await zoomOut(page);
    const outside = await pinHead(page, OUTSIDE);
    await page.mouse.click(outside.x, outside.y);
    await expect(modalOf(page)).toBeVisible();
    await expect.poll(() => page.url()).toMatch(/\/om:[^/]+/);
    const url = page.url();
    const opened = /\/om:([^/]+)/.exec(url)![1];
    expect(decodeURIComponent(opened)).toContain("outside-near-sample");

    // 同じ URL を別のタブで開き直す
    const again = await context.newPage();
    const strayAgain = await guardNetwork(again);
    await openElementPage(again, url.replace(/^https?:\/\/[^/]+/, ""));
    await expect(modalOf(again)).toBeVisible();
    await expect(again.locator('[part="poi-title"]')).toContainText(
      OUTSIDE.name
    );

    // 画面に入らない遠くの範囲外の POI も、URL で開ける
    const farUrl = url.replace(
      /\/om:[^/]+/,
      `/om:${opened.replace("outside-near-sample", FAR.id)}`
    );
    const far = await context.newPage();
    const strayFar = await guardNetwork(far);
    await openElementPage(far, farUrl.replace(/^https?:\/\/[^/]+/, ""));
    await expect(modalOf(far)).toBeVisible();
    await expect(far.locator('[part="poi-title"]')).toContainText(FAR.name);

    expect([...strayHits, ...strayAgain, ...strayFar]).toEqual([]);
  });
});
