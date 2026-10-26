// `<maplat-ui>` がページの文字（大きさ・色・書体）を継承することの e2e（積み残し「字の大きさと色をページから継承する」）。
//
// 旧 UI は bootstrap を `.maplat` の下に閉じ込めていたので、body の規則（14px・#333）は当たらず、
// 操作ボタン・スライダーの容器・透過度のスライダー・モーダルの本文はページの文字を継いでいた
// （基準 JSON `spec/fixtures/legacy-baseline/*.json` の 16px・黒・normal はページ既定の値）。
// 題名（18px・白）・カード（18px）・モーダルの見出し（18px）・共有とキャッシュのボタン（bootstrap の .btn の 14px）・
// スプラッシュの題名（18px）は旧も自分で決めていたので、ページに依らない。
//
// ここでは、ページが `html { font-size: 20px; color: rgb(10, 40, 120) }` を指定したとき:
//   - 継ぐもの: 操作ボタンの文字 20px（タッチなら 1.5em）・位置の .5em が 10px・容器の色がページの色・
//     モーダルの本文 20px＋ページの色
//   - 継がないもの: 題名 18px・白、カードの見出し 18px、モーダルの見出し 18px、
//     共有ボタンとキャッシュのボタン 14px・1.42857（旧 .btn）、スプラッシュの題名 18px
//   - 地図情報の項目名と値（dt・dd）はページの大きさで、行の高さは 1.42857（旧 bootstrap の dt, dd）
// を実測し、画面の写しを 1 枚残す（MAPLAT_UI_SHOTS_DIR か test-results）。
//
// 実行:
//   PLAYWRIGHT_SKIP_BROWSER_GC=1 node_modules/.bin/playwright test \
//     --config playwright-element.config.ts --workers=1 \
//     e2e/element/maplat-ui-inherit-font.pw.ts
import { test, expect, type Page } from "@playwright/test";
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
const FIXTURE = "/e2e/fixtures/element-baseline.html";
const PAGE_FONT_PX = 20;
const PAGE_COLOR = "rgb(10, 40, 120)";
const shotsDir = process.env.MAPLAT_UI_SHOTS_DIR;

async function openFixture(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", err => errors.push(String(err.stack ?? err)));
  await page.setViewportSize({ width: 1280, height: 800 });
  if (!realTiles) {
    await page.route(EXTERNAL_TILES, route =>
      route.fulfill({ status: 200, contentType: "image/png", body: TILE_PNG })
    );
  }
  await page.goto(`${FIXTURE}?buttons=1&base=3&overlay=3`);
  await expect(page.locator("#status")).toHaveAttribute("data-state", "ready", {
    timeout: 90_000
  });
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            (window as any).__maplatUi?.shadowRoot?.querySelector(
              '[part="map-title"] .text'
            )?.textContent ?? ""
        ),
      { timeout: 30_000 }
    )
    .not.toBe("");
  return errors;
}

/** 計算値の line-height を px にする（描かれていない要素では数のまま返ることがある） */
function lineHeightPx(value: string, fontSizePx: number): number {
  return value.endsWith("px")
    ? parseFloat(value)
    : parseFloat(value) * fontSizePx;
}

/** Shadow DOM の中の要素の計算値（部品は part で引く） */
async function computed(
  page: Page,
  selector: string,
  props: string[]
): Promise<Record<string, string> | null> {
  return page.evaluate(
    ({ selector, props }) => {
      const el = (window as any).__maplatUi.shadowRoot.querySelector(
        selector
      ) as Element | null;
      if (!el) return null;
      const cs = getComputedStyle(el);
      return Object.fromEntries(props.map(p => [p, (cs as any)[p]]));
    },
    { selector, props }
  );
}

test("ページの文字の大きさと色を継ぐ（操作ボタン・容器・モーダルの本文）。題名・カード・見出しは旧と同じく自分で決める", async ({
  page
}, testInfo) => {
  test.setTimeout(240_000);
  const errors = await openFixture(page);
  // ページが文字を指定する（旧 UI でも効いていた経路＝継承）
  await page.addStyleTag({
    content: `html { font-size: ${PAGE_FONT_PX}px; color: ${PAGE_COLOR}; }`
  });
  const px = (v: string | undefined) => parseFloat(v ?? "NaN");

  // 操作ボタン: 文字はページの 20px（UA の button の 13.333px ではない）・容器の .5em は 10px
  const zoom = await computed(page, '[part="zoom"]', [
    "fontSize",
    "top",
    "left",
    "color"
  ]);
  expect(zoom, "zoom control").not.toBeNull();
  expect(px(zoom!.fontSize)).toBeCloseTo(PAGE_FONT_PX, 1);
  expect(zoom!.color).toBe(PAGE_COLOR);
  // 左上のボタンは列（.ctl-column-top-left）に積むので、.5em の位置は列が持つ
  const topLeft = await computed(page, ".ctl-column-top-left", ["fontSize", "top", "left"]);
  expect(topLeft, "top-left column").not.toBeNull();
  expect(px(topLeft!.fontSize)).toBeCloseTo(PAGE_FONT_PX, 1);
  expect(px(topLeft!.top)).toBeCloseTo(PAGE_FONT_PX * 0.5, 1);
  expect(px(topLeft!.left)).toBeCloseTo(PAGE_FONT_PX * 0.5, 1);
  const zoomIn = await computed(page, '[part="zoom-in"]', [
    "fontSize",
    "color",
    "height"
  ]);
  expect(px(zoomIn!.fontSize)).toBeCloseTo(PAGE_FONT_PX, 1);
  // ボタンの文字の色は旧 .ol-control button と同じく白のまま（継がない）
  expect(zoomIn!.color).toBe("rgb(255, 255, 255)");
  expect(px(zoomIn!.height)).toBeCloseTo(PAGE_FONT_PX * 2.0625, 1);
  for (const part of [
    "info",
    "border",
    "hide-marker",
    "share",
    "help",
    "gps",
    "home",
    "compass"
  ]) {
    const button = await computed(page, `[part="${part}"] button`, [
      "fontSize"
    ]);
    expect(button, part).not.toBeNull();
    expect(px(button!.fontSize), part).toBeCloseTo(PAGE_FONT_PX, 1);
  }

  // 透過度のスライダー（<input>）: 旧は bootstrap の input { font-size: inherit } でページの大きさ
  const transparency = await computed(page, '[part="slider"]', [
    "fontSize",
    "bottom"
  ]);
  expect(px(transparency!.fontSize)).toBeCloseTo(PAGE_FONT_PX, 1);
  expect(px(transparency!.bottom)).toBeCloseTo(PAGE_FONT_PX * 0.5, 1);

  // 地図の切り替えスライダーの容器はページの大きさ（.5em の bottom）。カードの見出しは旧と同じ 18px
  for (const kind of ["base", "overlay"]) {
    const container = await computed(
      page,
      `[part="map-slider"][data-kind="${kind}"]`,
      ["fontSize", "bottom", "color"]
    );
    expect(px(container!.fontSize), `${kind} slider`).toBeCloseTo(
      PAGE_FONT_PX,
      1
    );
    expect(px(container!.bottom), `${kind} slider bottom`).toBeCloseTo(
      PAGE_FONT_PX * 0.5,
      1
    );
    // 容器の文字の色は旧 .swiper と同じく白（継がない）
    expect(container!.color, `${kind} slider color`).toBe("rgb(255, 255, 255)");
    const card = await computed(
      page,
      `[part="map-slider"][data-kind="${kind}"] [part~="map-slide"]`,
      ["fontSize"]
    );
    expect(px(card!.fontSize), `${kind} card`).toBeCloseTo(18, 1);
    // 見出しはカードの 18px を基準に 1em（1 行に収まらなければ .8em の `minimize`＝14.4px）。ページの 20px は使わない
    const label = await computed(
      page,
      `[part="map-slider"][data-kind="${kind}"] [part="map-slide-label"]`,
      ["fontSize", "color"]
    );
    expect(
      [18, 14.4].some(v => Math.abs(px(label!.fontSize) - v) < 0.05),
      `${kind} label: ${label!.fontSize}`
    ).toBe(true);
    expect(label!.color, `${kind} label color`).toBe("rgb(255, 255, 255)");
  }

  // 題名: 旧 .map-title と同じく 18px・白（ページに依らない）。top の .5em は自身の 18px で 9px
  const title = await computed(page, '[part="map-title"]', [
    "fontSize",
    "color",
    "top"
  ]);
  expect(px(title!.fontSize)).toBeCloseTo(18, 1);
  expect(title!.color).toBe("rgb(255, 255, 255)");
  expect(px(title!.top)).toBeCloseTo(9, 1);

  // モーダル（地図情報）: 見出しは 18px、本文はページの大きさと色
  await page.locator('[part="info"] button').click();
  const dialog = page.locator('[part="map-info-modal"]');
  await expect(dialog).toBeVisible({ timeout: 20_000 });
  const heading = await computed(page, '[part="map-info-modal"] .title', [
    "fontSize"
  ]);
  expect(px(heading!.fontSize)).toBeCloseTo(18, 1);
  const body = await computed(page, '[part="map-info-modal"] .body', [
    "fontSize",
    "color"
  ]);
  expect(px(body!.fontSize)).toBeCloseTo(PAGE_FONT_PX, 1);
  expect(body!.color).toBe(PAGE_COLOR);
  // 地図情報の項目名と値: 大きさはページの 20px、行の高さは旧 bootstrap の dt, dd と同じ 1.42857
  for (const tag of ["dt", "dd"]) {
    const cell = await computed(
      page,
      `[part="map-info-modal"] dl.map-meta ${tag}`,
      ["fontSize", "lineHeight"]
    );
    expect(cell, `map-meta ${tag}`).not.toBeNull();
    expect(px(cell!.fontSize), `map-meta ${tag}`).toBeCloseTo(PAGE_FONT_PX, 1);
    expect(
      lineHeightPx(cell!.lineHeight, px(cell!.fontSize)),
      `map-meta ${tag} line-height: ${cell!.lineHeight}`
    ).toBeCloseTo(PAGE_FONT_PX * 1.42857, 1);
  }
  // キャッシュのボタン（旧 btn btn-default）と共有ボタン（旧 share btn btn-light）: 旧 .btn と同じく 14px・1.42857
  // （ページの 20px は使わない）
  for (const selector of [
    '[part="cache-fetch"]',
    '[part="cache-delete"]',
    '[part="share-button"]'
  ]) {
    const button = await computed(page, selector, ["fontSize", "lineHeight"]);
    expect(button, selector).not.toBeNull();
    expect(px(button!.fontSize), selector).toBeCloseTo(14, 1);
    expect(
      lineHeightPx(button!.lineHeight, 14),
      `${selector} line-height: ${button!.lineHeight}`
    ).toBeCloseTo(14 * 1.42857, 1);
  }
  // スプラッシュの題名: 旧 h4.modal-title 内の .modal_load_title と同じ 18px
  const splashTitle = await computed(page, '[part="splash-title"]', [
    "fontSize"
  ]);
  expect(px(splashTitle!.fontSize)).toBeCloseTo(18, 1);

  // 画面の写し（字の大きさを変えたページでの見え方）
  await page.waitForTimeout(500);
  const shotPath = shotsDir
    ? join(shotsDir, "inherit-font-20px.png")
    : testInfo.outputPath("inherit-font-20px.png");
  if (shotsDir) mkdirSync(shotsDir, { recursive: true });
  await page.screenshot({ path: shotPath });
  console.log(`screenshot: ${shotPath}`);
  expect(errors, errors.join("\n")).toEqual([]);
});
