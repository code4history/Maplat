import { test, expect } from '@playwright/test';

/**
 * oct26-m9-t1 AC-10: Chuci の cc-swiper のナビゲーション矢印が 1 本ずつであること（見た目の判定）
 *
 * 設計書: docs/superpowers/specs/2026-09-14-oct26-m9-t1-design.md v2 §6・§8.2 AC-10
 *
 * swiper 12 の Navigation は空のボタンに <svg class="swiper-navigation-icon"> を挿入し、cc-swiper は ::after に
 * chevron を描くため、修正前は矢印が 2 本ずつ描かれる。修正後は svg が display: none で、::after の chevron（44px）だけが残る。
 *
 * UI は POI のメディアに Quyuan の qy-swiper（cc-swiper を継承し CSS も同じ）を使う ∴ 同じ検査を qy-swiper でも行う。
 * cc-swiper の側は「旧 API の起動の後に cc-swiper を使える」（Quyuan が同梱の Chuci の cc-* を登録する）の実ブラウザの
 * 検査を兼ねる。lock は修正済みの Chuci を同梱する Quyuan を解決するので、単独 clone の CI でも走る。
 */
for (const tag of ['cc-swiper', 'qy-swiper'] as const) {
  test(`AC-10: ${tag} の左右の矢印は ::after の chevron だけが描かれ、swiper 12 の SVG アイコンは非表示`, async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1280, height: 800 });
    // 旧 API の互換層が起動時に <maplat-ui> の preloadMediaViewer() で @c4h/quyuan を読み、qy-swiper と（同梱の Chuci の）cc-swiper を登録する
    await page.goto('/e2e/fixtures/swiper-loop.html?base=1&overlay=1');
    await page.waitForFunction(() => document.getElementById('status')?.textContent === 'READY', null, { timeout: 90000 });
    await page.waitForFunction(
      () => !!customElements.get('cc-swiper') && !!customElements.get('qy-swiper'),
      null,
      { timeout: 30000 }
    );
    await page.evaluate(t => {
      const d = document.createElement('div');
      d.id = 'm9-cc-probe';
      d.style.cssText = 'position:fixed;top:0;left:0;width:400px;height:300px;z-index:99999;background:#fff';
      d.innerHTML =
        `<${t} style="height:300px">` +
        `<${t}-slide image-url="img/aoume.jpg" thumbnail-url="img/aoume.jpg"></${t}-slide>` +
        `<${t}-slide image-url="img/atago_shrine.jpg" thumbnail-url="img/atago_shrine.jpg"></${t}-slide>` +
        `</${t}>`;
      document.body.appendChild(d);
    }, tag);
    // スライダーの Swiper 初期化（Navigation が SVG を挿入する）を待つ
    await page.waitForFunction(
      t => {
        const root = (document.querySelector(`#m9-cc-probe ${t}`) as any)?.shadowRoot;
        return !!root && ['#divPrevious', '#divNext'].every(sel => root.querySelector(`${sel} svg.swiper-navigation-icon`));
      },
      tag,
      { timeout: 30000 }
    );
    await page.waitForTimeout(500);
    const buttons = await page.evaluate(t => {
      const root = (document.querySelector(`#m9-cc-probe ${t}`) as any).shadowRoot as ShadowRoot;
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
    }, tag);
    test.info().annotations.push({ type: 'm9-arrow', description: JSON.stringify(buttons) });
    console.log(`[oct26-m9-t1 AC-10 ${tag}] ${JSON.stringify(buttons)}`);
    for (const b of buttons) {
      expect.soft(b.svgDisplay, `${b.sel} の swiper 12 の SVG アイコン`).toBe('none');
      expect.soft(b.afterBackgroundImage, `${b.sel} の ::after の chevron`).not.toBe('none');
      expect.soft(b.afterBackgroundImage, `${b.sel} の ::after の chevron`).toMatch(/^url\("data:image\/svg\+xml/);
      expect.soft([b.afterWidth, b.afterHeight], `${b.sel} の ::after の寸法`).toEqual(['44px', '44px']);
    }
  });
}
