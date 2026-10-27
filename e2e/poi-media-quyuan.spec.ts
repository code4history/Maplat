// 旧 API の経路（`/index.html` = `demo/dev.ts` の `MaplatUi.createObject`）で、POI のメディアが
// Quyuan のスライダー（qy-swiper）で描けることの確認。
//
// - 起動の後に `cc-swiper` と `qy-swiper` の両方が登録されている（互換層が起動時に Quyuan を読み、
//   Quyuan が同梱の Chuci の cc-* を登録する ∴ 旧 API の利用者は起動の後も cc-swiper を使える）
// - media で指定した POI（m1-t3-swiper-a）を `openMarker` で開くと qy-swiper で描け、画像を押すとビューアが開く
// - テンプレート（poiTemplate）が <qy-swiper> を書いた POI を地図のマーカーから開くと、POI の html の
//   入れ子の Shadow DOM の中に qy-swiper が描け、高さが付き、画像を押すとビューアが開く
//   （テンプレートはマーカーを描くときに評価され、クリックの detail に html が載る）
//
// 実行（dev サーバーは playwright-ci.config.ts の webServer が立てる）:
//   node_modules/.bin/playwright test --config playwright-ci.config.ts e2e/poi-media-quyuan.spec.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, type Page } from "@playwright/test";

// デモは pwaManifest: true（Service Worker を登録する）。dev サーバーで SW を効かせると読み込みが揺れるので止める
test.use({ serviceWorkers: "block" });

// メディアの画像はネットワークに依らないよう 1×1 の PNG に差し替える
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
  "base64"
);
const MEDIA_IMAGES = /t\.tilemap\.jp\/maplat\/img\/|code4history\.dev\//;

const MEDIA_POI_ID = "m1-t3-swiper-a";
const TEMPLATE_POI = { longitude: 139.5385, latitude: 36.2505 };

async function openDemo(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(String(e.message ?? e)));
  await page.route(MEDIA_IMAGES, route =>
    route.fulfill({ status: 200, contentType: "image/png", body: PNG_1X1 })
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/index.html?appid=sample&lang=ja");
  await expect(page.locator("#status")).toHaveText(
    /^READY appid=sample lang=ja$/,
    { timeout: 120_000 }
  );
  await page.waitForFunction(
    () =>
      (document.querySelector("maplat-ui") as any)?.ready?.then?.(() => true),
    null,
    { timeout: 120_000 }
  );
  return errors;
}

const uiApp = <T>(page: Page, fn: string, ...args: unknown[]) =>
  page.evaluate(
    ([f, a]) => {
      const el = (document.querySelector("maplat-ui") as any).app;
      return el[f as string](...(a as unknown[]));
    },
    [fn, args] as const
  ) as Promise<T>;

/** 点 (lng, lat) のマーカーを押す（アイコンの当たり判定に合うまで少しずらして押し直す）。 */
async function clickMarkerAt(
  page: Page,
  lnglat: { longitude: number; latitude: number },
  opened: ReturnType<Page["locator"]>
): Promise<boolean> {
  for (const dy of [-14, -8, -20, -3, -26]) {
    const pt = await uiApp<{ x: number; y: number } | null>(
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

/** スライダーの画像を押してビューア（qy-viewer。文書の body）が開き、閉じられることを確かめる。 */
async function expectViewerOpens(
  page: Page,
  swiper: ReturnType<Page["locator"]>
) {
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
    .toBeGreaterThanOrEqual(3);
  const box = await swiper.boundingBox();
  expect(box!.height).toBeGreaterThan(200);
  await swiper.locator(".swiper-slide-active img.viewer").click();
  const viewerImage = page.locator("qy-viewer cc-viewer cc-viewer-image");
  await expect(viewerImage.locator(".backdrop")).toBeVisible({
    timeout: 15_000
  });
  await viewerImage.locator(".nav-close").click();
  await expect(viewerImage.locator(".backdrop")).toBeHidden({
    timeout: 10_000
  });
}

test("旧 API の経路: POI のメディアとテンプレートの <qy-swiper> が Quyuan のスライダーで描ける", async ({
  page
}) => {
  test.setTimeout(240_000);
  const errors = await openDemo(page);
  const ui = page.locator("maplat-ui");
  const poiModal = ui.locator('[part="poi-modal"]');

  // 起動の後に cc-swiper（同梱の Chuci）と qy-swiper の両方が使える
  await expect
    .poll(
      () =>
        page.evaluate(() => [
          !!customElements.get("cc-swiper"),
          !!customElements.get("qy-swiper")
        ]),
      { timeout: 30_000 }
    )
    .toEqual([true, true]);

  // ---- media で指定した POI ----
  await page.evaluate(
    id => (document.querySelector("maplat-ui") as any).openMarker(id),
    MEDIA_POI_ID
  );
  await expect(poiModal).toBeVisible();
  const mediaSwiper = ui.locator('[part="poi-swiper"]');
  expect(await mediaSwiper.evaluate((el: Element) => el.localName)).toBe(
    "qy-swiper"
  );
  expect(
    await mediaSwiper
      .locator("qy-swiper-slide")
      .evaluateAll(els => els.map(el => el.getAttribute("image-type")))
  ).toEqual(["image", "image", "image", "youtube"]);
  await expectViewerOpens(page, mediaSwiper);
  await ui.locator('[part="poi-close"]').click();
  await expect(poiModal).toBeHidden();

  // ---- テンプレートが <qy-swiper> を書いた POI（地図のマーカーから開く）----
  await uiApp(page, "setViewpoint", { ...TEMPLATE_POI, mercZoom: 18 });
  await page.waitForTimeout(1500);
  expect(
    await clickMarkerAt(page, TEMPLATE_POI, poiModal),
    "clicking the template POI should open the info window"
  ).toBe(true);
  const tplSwiper = ui.locator('[part="poi-html"] qy-swiper');
  await expect(tplSwiper).toHaveCount(1);
  await expect(tplSwiper.locator("qy-swiper-slide")).toHaveCount(3);
  await expectViewerOpens(page, tplSwiper);
  await ui.locator('[part="poi-close"]').click();

  expect(errors, errors.join("\n")).toEqual([]);
});
