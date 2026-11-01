// <maplat-ui> の操作ボタンの間隔と、ヘルプの冒頭の全体の図の e2e。
// デモ（demo/element.html）を幅 1280（タッチでない）と 375（タッチ端末）で開き、
// 左上（ズーム・GPS・ホーム）・左下（ヘルプ・共有）・右下（地図情報・マーカー一覧）の
// 隣り合うボタンの隙間を実測して、すべて同じ（±1px）ことを確かめる。
// ヘルプの図は、開いたときに見えること・有効でないボタンを描かないことを確かめる。
import { test, expect, type Page } from "@playwright/test";

/* eslint-disable @typescript-eslint/no-explicit-any */

const PAGE = "/demo/element.html";

async function openPage(page: Page) {
  await page.goto(PAGE);
  await expect(page.getByTestId("status")).toHaveAttribute(
    "data-state",
    "ready",
    { timeout: 90_000 }
  );
}

/**
 * 各列の、隣り合うボタンの隙間（px）。列は flex で、隠れているボタンは詰めて積まれる。
 * 上下に並ぶので、上から順に「次のボタンの上端 - 前のボタンの下端」を返す。
 */
async function measureGaps(page: Page) {
  return page.evaluate(() => {
    const root = (window as any).__maplatUi?.shadowRoot as ShadowRoot | null;
    if (!root) return null;
    const columns = ["top-left", "bottom-left", "bottom-right"] as const;
    const result: Record<string, number[]> = {};
    for (const name of columns) {
      const column = root.querySelector(`.ctl-column-${name}`);
      if (!column) {
        result[name] = [];
        continue;
      }
      const rects = Array.from(column.querySelectorAll(":scope > .ctl"))
        .map(el => el.getBoundingClientRect())
        .filter(rect => rect.width > 0 && rect.height > 0)
        .sort((a, b) => a.top - b.top);
      result[name] = rects
        .slice(1)
        .map((rect, index) => rect.top - rects[index].bottom);
    }
    return result;
  });
}

/** 右下の列に 2 つ以上のボタンが出る（マーカー一覧は POI の読み込み後に出る）まで待つ。 */
async function waitForColumns(page: Page) {
  await expect
    .poll(
      async () => {
        const gaps = await measureGaps(page);
        if (!gaps) return 0;
        return Object.values(gaps).filter(list => list.length > 0).length;
      },
      { timeout: 30_000 }
    )
    .toBe(3);
}

function expectSameGaps(gaps: Record<string, number[]>) {
  const all = Object.values(gaps).flat();
  // 左上 2（3 つ）・左下 1・右下 1 が既定。タッチ端末は左上 1（ズームを隠す）
  expect(all.length).toBeGreaterThanOrEqual(3);
  for (const gap of all) {
    expect(
      Math.abs(gap - all[0]),
      `gaps: ${JSON.stringify(gaps)}`
    ).toBeLessThanOrEqual(1);
  }
  // 既定の値（CSS 変数 --maplat-ui-control-gap の 7px）
  expect(
    Math.abs(all[0] - 7),
    `gaps: ${JSON.stringify(gaps)}`
  ).toBeLessThanOrEqual(1);
}

test.describe("幅 1280（タッチでない）", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("左上・左下・右下の隣り合うボタンの隙間がすべて同じ", async ({
    page
  }) => {
    await openPage(page);
    await waitForColumns(page);
    const gaps = await measureGaps(page);
    expect(gaps).not.toBeNull();
    expectSameGaps(gaps!);
  });

  test("ヘルプを開くと全体の図が見える（有効なボタンだけ）", async ({
    page
  }) => {
    await openPage(page);
    const ui = page.locator("maplat-ui#ui");
    await ui.locator('[part="help"] button').click();
    const figure = ui.locator('[part="help-body"] .help-figure');
    await expect(figure).toBeVisible();
    await expect(figure).toHaveAttribute("aria-hidden", "true");
    await expect(figure.locator(".help-phone")).toBeVisible();
    // デモは enable-share・enable-marker-list。enable-border は無いので枠線は描かない
    await expect(figure.locator('[data-control="share"]')).toBeVisible();
    await expect(figure.locator('[data-control="marker-list"]')).toBeVisible();
    await expect(figure.locator('[data-control="border"]')).toHaveCount(0);
    // 背景は今の地図を写した canvas（地図が描かれた後に開いたので、サムネイルには戻らない）
    const map = figure.locator(".help-phone-map");
    await expect(map).toHaveCount(1);
    const info = await map.evaluate(el => ({
      tag: el.tagName,
      width: (el as HTMLCanvasElement).width,
      height: (el as HTMLCanvasElement).height
    }));
    expect(info.tag).toBe("CANVAS");
    expect(info.width).toBeGreaterThan(0);
    expect(info.height).toBeGreaterThan(0);
  });
});

test.describe("幅 375（タッチ端末）", () => {
  test.use({
    viewport: { width: 375, height: 800 },
    hasTouch: true,
    isMobile: true
  });

  test("タッチ端末でも左上・左下・右下の隣り合うボタンの隙間がすべて同じ", async ({
    page
  }) => {
    await openPage(page);
    await waitForColumns(page);
    const gaps = await measureGaps(page);
    expect(gaps).not.toBeNull();
    // タッチ端末はズームを隠すので、左上は GPS とホームの 1 か所
    expect(gaps!["top-left"].length).toBe(1);
    expectSameGaps(gaps!);
  });
});
