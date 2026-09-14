import { test, expect } from '@playwright/test';

/**
 * oct26-m9-t1 AC-10: Chuci（@c4h/chuci）の cc-swiper のナビゲーション矢印が 1 本ずつであること（見た目の判定）
 *
 * 設計書: docs/superpowers/specs/2026-09-14-oct26-m9-t1-design.md v2 §6・§8.2 AC-10
 *
 * swiper 12 の Navigation は空のボタンに <svg class="swiper-navigation-icon"> を挿入し、cc-swiper は ::after に
 * chevron を描くため、修正前は矢印が 2 本ずつ描かれる。修正後は svg が display: none で、::after の chevron（44px）だけが残る。
 *
 * monorepo 専用: `@c4h/chuci` が workspace link で修正済み Chuci の dist を解決する状態でのみ PASS する。
 * 単独 clone の CI は npm の `@c4h/chuci@1.0.0`（修正前）を解決して必ず FAIL するため、playwright-ci.config.ts の
 * testIgnore に入れている。lock が `@c4h/chuci@1.0.1` 以降を解決した時点で testIgnore から外す（設計 §9.4）。
 */
test('AC-10: cc-swiper の左右の矢印は ::after の chevron だけが描かれ、swiper 12 の SVG アイコンは非表示', async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1280, height: 800 });
  // Maplat UI（ui_marker.ts）が @c4h/chuci を import して cc-swiper を登録する
  await page.goto('/e2e/fixtures/swiper-loop.html?base=1&overlay=1');
  await page.waitForFunction(() => document.getElementById('status')?.textContent === 'READY', null, { timeout: 90000 });
  await page.waitForFunction(() => !!customElements.get('cc-swiper'), null, { timeout: 30000 });
  await page.evaluate(() => {
    const d = document.createElement('div');
    d.id = 'm9-cc-probe';
    d.style.cssText = 'position:fixed;top:0;left:0;width:400px;height:300px;z-index:99999;background:#fff';
    d.innerHTML =
      '<cc-swiper style="height:300px">' +
      '<cc-swiper-slide image-url="img/aoume.jpg" thumbnail-url="img/aoume.jpg"></cc-swiper-slide>' +
      '<cc-swiper-slide image-url="img/atago_shrine.jpg" thumbnail-url="img/atago_shrine.jpg"></cc-swiper-slide>' +
      '</cc-swiper>';
    document.body.appendChild(d);
  });
  // cc-swiper の Swiper 初期化（Navigation が SVG を挿入する）を待つ
  await page.waitForFunction(
    () => {
      const root = (document.querySelector('#m9-cc-probe cc-swiper') as any)?.shadowRoot;
      return !!root && ['#divPrevious', '#divNext'].every(sel => root.querySelector(`${sel} svg.swiper-navigation-icon`));
    },
    null,
    { timeout: 30000 }
  );
  await page.waitForTimeout(500);
  const buttons = await page.evaluate(() => {
    const root = (document.querySelector('#m9-cc-probe cc-swiper') as any).shadowRoot as ShadowRoot;
    return ['#divPrevious', '#divNext'].map(sel => {
      const b = root.querySelector(sel) as HTMLElement;
      const svg = b.querySelector('svg.swiper-navigation-icon') as SVGElement | null;
      const after = getComputedStyle(b, '::after');
      return {
        sel,
        svgDisplay: svg ? getComputedStyle(svg).display : null,
        afterContent: after.content,
        afterBackgroundImage: after.backgroundImage.slice(0, 40),
        afterWidth: after.width,
        afterHeight: after.height
      };
    });
  });
  test.info().annotations.push({ type: 'm9-arrow', description: JSON.stringify(buttons) });
  console.log(`[oct26-m9-t1 AC-10] ${JSON.stringify(buttons)}`);
  for (const b of buttons) {
    expect.soft(b.svgDisplay, `${b.sel} の swiper 12 の SVG アイコン`).toBe('none');
    expect.soft(b.afterBackgroundImage, `${b.sel} の ::after の chevron`).not.toBe('none');
    expect.soft(b.afterBackgroundImage, `${b.sel} の ::after の chevron`).toMatch(/^url\("data:image\/svg\+xml/);
    expect.soft([b.afterWidth, b.afterHeight], `${b.sel} の ::after の寸法`).toEqual(['44px', '44px']);
  }
});
