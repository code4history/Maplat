// ページ内の window・MaplatUi を evaluate で読むため any を使う（e2e は lint の対象外だが、本ファイルは明示して通す）
/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, type Page } from '@playwright/test';

/**
 * nov26-m5-t1 — 実ブラウザ（Chromium）での無害化の確認
 *
 * 設計書: docs/superpowers/specs/2026-10-11-nov26-m5-t1-task-design.md v2 §7
 * fixture: e2e/fixtures/nov26-m5-t1-swiper-xss.html
 *
 * - AC2（B-UI-4・label）: label の HTML がタグにならず文字のまま表示され、onerror が発火しない
 * - AC3（B-UI-4・mapID）: mapID の属性注入が起きず、data 属性は元の文字列で、クリックで core.changeMap に元の mapID が渡る
 * - AC4（B-UI-4・thumbnail）: javascript: は「画像なし」の絵になり、属性注入は起きない
 * - AC1 (c)（Maplat#274）: 重なったマーカーのメニュー項目の icon が他の CSS プロパティへはみ出さない
 *
 * 陽性対照（是正の前後とも緑）: ページが READY になる・base のスライドが並ぶ。
 */

async function openFixture(page: Page) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/e2e/fixtures/nov26-m5-t1-swiper-xss.html');
  await page.waitForFunction(() => document.getElementById('status')?.textContent === 'READY', null, {
    timeout: 90000
  });
  await page.waitForFunction(() => (document.querySelector('.base-swiper') as any)?.swiper, null, {
    timeout: 30000
  });
  // 初期化の遷移が落ち着くのを待つ（oct26-m9-t1 の e2e と同じ扱い）
  await page.waitForTimeout(3000);
  return page.evaluate(() => (window as any).__nov26m5t1Payload as { P: string; M: string });
}

test.describe('nov26-m5-t1 地図切り替えスワイパーの無害化（B-UI-4）', () => {
  test('陽性対照: READY になり base のスライドが並ぶ', async ({ page }) => {
    await openFixture(page);
    const n = await page.evaluate(() => document.querySelectorAll('.base-swiper .swiper-slide').length);
    expect(n).toBeGreaterThanOrEqual(5);
  });

  test('AC2: label の HTML はタグにならず文字のまま表示される', async ({ page }) => {
    const { P } = await openFixture(page);
    expect(await page.locator('.swiper-wrapper img[onerror]').count()).toBe(0);
    await page.waitForTimeout(2000);
    expect(await page.evaluate(() => (window as any).__nov26m5t1)).toBeUndefined();
    // 名前の div は初期化の後に ui_utils.ts の ellips() が innerText を 1 文字ずつ <span> に包み直し、
    // 末尾に「…」の span（.omit-mark）を足す（innerText なので先頭の空白は落ちる）。
    // ∴ .omit-mark を除いた span の文字を連結したものが P と一致することで「文字のまま表示」を判定する。
    // （ellips を通る前の DOM が ` ${P}` であることは単体 spec/nov26-m5-t1-safe-image-url.spec.ts で確かめる）
    const texts = await page.evaluate(() =>
      [...document.querySelectorAll('.base-swiper .swiper-slide[data="m5t1_label"] > div')].map(d =>
        [...d.querySelectorAll('span:not(.omit-mark)')].map(s => s.textContent).join('')
      )
    );
    expect(texts.length).toBeGreaterThan(0);
    for (const t of texts) expect(t).toBe(P);
  });

  test('AC3: mapID の属性注入が起きず、クリックで元の mapID に切り替わる', async ({ page }) => {
    const { M } = await openFixture(page);
    expect(await page.locator('.swiper-wrapper [onmouseover]').count()).toBe(0);
    const count = await page.evaluate(
      M => [...document.querySelectorAll('.base-swiper .swiper-slide')].filter(s => s.getAttribute('data') === M).length,
      M
    );
    expect(count).toBeGreaterThanOrEqual(1);

    // 中央へ寄せる
    await page.evaluate(M => (window as any).__maplatUi.baseSwiper.slideToMapID(M), M);
    await page.waitForFunction(
      M => document.querySelector('.base-swiper .swiper-slide-active')?.getAttribute('data') === M,
      M,
      { timeout: 8000 }
    );
    await page.waitForTimeout(1200);
    // 中央のカードの上端寄り（矢印を避ける位置。oct26-m9-t1 の e2e と同じ求め方）
    const center = await page.evaluate(() => {
      const root = document.querySelector('.base-swiper') as HTMLElement;
      const act = root.querySelector('.swiper-slide-active') as HTMLElement;
      const r = act.getBoundingClientRect();
      const cr = root.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = Math.max(r.top, cr.top) + 6;
      return { x, y, hit: document.elementFromPoint(x, y)?.closest('.swiper-slide') === act };
    });
    expect(center.hit).toBe(true);
    // hover（実マウス）と、M のスライド全部への mouseover の発火
    await page.mouse.move(center.x, center.y);
    await page.evaluate(M => {
      document
        .querySelectorAll('.base-swiper .swiper-slide')
        .forEach(s => {
          if (s.getAttribute('data') === M) s.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        });
    }, M);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => (window as any).__nov26m5t1m)).toBeUndefined();

    await page.mouse.click(center.x, center.y);
    await page.waitForFunction(M => (window as any).__maplatUi.core.from?.mapID === M, M, { timeout: 15000 });
    expect(await page.evaluate(() => (window as any).__maplatUi.core.from.mapID)).toBe(M);
  });

  test('AC4: thumbnail の javascript: は「画像なし」になり、属性注入は起きない', async ({ page }) => {
    await openFixture(page);
    const srcs = await page.evaluate(() =>
      [...document.querySelectorAll('.base-swiper .swiper-slide[data="m5t1_thumb_js"] img')].map(i =>
        i.getAttribute('src')
      )
    );
    expect(srcs.length).toBeGreaterThan(0);
    for (const src of srcs) {
      expect(src).toBeTruthy();
      expect(src!).not.toContain('javascript:');
      expect(/no_image\.png(\?.*)?$/.test(src!) || src!.startsWith('data:image/png')).toBe(true);
    }
    // 引用符を含む thumbnail は相対 URL として通り、実体参照化されて src の値そのものになる（属性は増えない）
    const attrImgs = await page.evaluate(() =>
      [...document.querySelectorAll('.base-swiper .swiper-slide[data="m5t1_thumb_attr"] img')].map(i => ({
        src: i.getAttribute('src'),
        attrs: i.attributes.length
      }))
    );
    expect(attrImgs.length).toBeGreaterThan(0);
    for (const a of attrImgs) expect(a).toEqual({ src: 'x" onerror="window.__nov26m5t1t=1', attrs: 2 });
    expect(await page.locator('.swiper-wrapper img[onerror]').count()).toBe(0);
    await page.waitForTimeout(2000);
    expect(await page.evaluate(() => (window as any).__nov26m5t1t)).toBeUndefined();
    expect(await page.evaluate(() => (window as any).__nov26m5t1j)).toBeUndefined();
  });
});

test.describe('nov26-m5-t1 重なったマーカーのメニューの icon（Maplat#274）', () => {
  test('AC1 (c): icon の注入値で項目が position: fixed にならず、宣言が 1 つ以下', async ({ page }) => {
    await openFixture(page);
    const INJ = 'x);position:fixed;inset:0;z-index:99999;background:url(y';
    const r = await page.evaluate(INJ => {
      const cm = (window as any).__maplatUi.contextMenu;
      cm.clear();
      cm.extend([{ icon: INJ, text: 'p' }]);
      const lis = [...(cm.container as HTMLElement).querySelectorAll('li')].filter(li =>
        li.querySelector('span')?.textContent === 'p'
      );
      return lis.map(li => ({
        position: getComputedStyle(li).position,
        length: li.style.length,
        first: li.style.length ? li.style.item(0) : null
      }));
    }, INJ);
    expect(r.length).toBe(1);
    expect(r[0].position).not.toBe('fixed');
    expect(r[0].length).toBeLessThanOrEqual(1);
    if (r[0].length === 1) expect(r[0].first).toBe('background-image');
  });
});
