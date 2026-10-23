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
 *
 * Stage 3（一本化。旧 API は `<maplat-ui>` の上の互換層）での移植:
 *   旧 UI の `.base-swiper .swiper-slide[data=…]`（文書の DOM・Swiper の実物）を、`<maplat-ui>` の
 *   shadow root の `[part="map-slider"][data-kind="base"] [part~="map-slide"][data-map-id=…]` へ移した。
 *   中央のカードは `host.slider('base').slots` の offset 0（`@internal`。設計 v2 §4.7.3 の対応表）。
 *   確かめる中身（タグにならない・属性注入が起きない・javascript: は画像にしない・項目がはみ出さない）は変えない。
 *   言い換えた期待値は各テストのコメントに書いた（AC4 の「画像なし」の表し方・属性の数、AC1 (c) の描き方）。
 */

/** `<maplat-ui>` の shadow root の中の base のスライダー（文書の DOM には無い） */
const BASE_SLIDES = '[part="map-slider"][data-kind="base"] [part~="map-slide"]';

async function openFixture(page: Page) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/e2e/fixtures/nov26-m5-t1-swiper-xss.html');
  await page.waitForFunction(() => document.getElementById('status')?.textContent === 'READY', null, {
    timeout: 90000
  });
  await page.waitForFunction(
    sel => (document.querySelector('maplat-ui')?.shadowRoot?.querySelectorAll(sel).length ?? 0) > 0,
    BASE_SLIDES,
    { timeout: 30000 }
  );
  // 初期化の遷移が落ち着くのを待つ（oct26-m9-t1 の e2e と同じ扱い）
  await page.waitForTimeout(3000);
  return page.evaluate(() => (window as any).__nov26m5t1Payload as { P: string; M: string });
}

test.describe('nov26-m5-t1 地図切り替えスワイパーの無害化（B-UI-4）', () => {
  test('陽性対照: READY になり base のスライドが並ぶ', async ({ page }) => {
    await openFixture(page);
    // 旧は Swiper の複製を含めた枚数。新は 5 スロット（base は 5 枚なので 5 枚とも並ぶ。N>=2 のスロットは 5。設計 v2 §4.7.3 の括弧書き）
    const n = await page.evaluate(
      sel => document.querySelector('maplat-ui')!.shadowRoot!.querySelectorAll(sel).length,
      BASE_SLIDES
    );
    expect(n).toBeGreaterThanOrEqual(5);
  });

  test('AC2: label の HTML はタグにならず文字のまま表示される', async ({ page }) => {
    const { P } = await openFixture(page);
    // Playwright の CSS locator は shadow root を貫く（旧の .swiper-wrapper → 新のスライダーの帯）
    expect(await page.locator('.map-slider-track img[onerror]').count()).toBe(0);
    await page.waitForTimeout(2000);
    expect(await page.evaluate(() => (window as any).__nov26m5t1)).toBeUndefined();
    // 名前の div は初期化の後に ui_utils.ts の ellips() が innerText を 1 文字ずつ <span> に包み直し、
    // 末尾に「…」の span（.omit-mark）を足す（innerText なので先頭の空白は落ちる）。
    // ∴ .omit-mark を除いた span の文字を連結したものが P と一致することで「文字のまま表示」を判定する。
    // （ellips を通る前の DOM が ` ${P}` であることは単体 spec/nov26-m5-t1-safe-image-url.spec.ts で確かめる）
    // 新しい見出しは `src/shared/text.ts` の ellipsize（旧 ellips と同じ「1 文字ずつ span＋.omit-mark」）
    const texts = await page.evaluate(sel =>
      [
        ...document
          .querySelector('maplat-ui')!
          .shadowRoot!.querySelectorAll(`${sel}[data-map-id="m5t1_label"] [part="map-slide-label"]`)
      ].map(d => [...d.querySelectorAll('span:not(.omit-mark)')].map(s => s.textContent).join('')),
      BASE_SLIDES
    );
    expect(texts.length).toBeGreaterThan(0);
    for (const t of texts) expect(t).toBe(P);
  });

  test('AC3: mapID の属性注入が起きず、クリックで元の mapID に切り替わる', async ({ page }) => {
    const { M } = await openFixture(page);
    expect(await page.locator('.map-slider-track [onmouseover]').count()).toBe(0);
    // 旧の `data` 属性 → 新の `data-map-id`（dataset に入れるので元の文字列のまま）
    const count = await page.evaluate(
      ({ M, sel }) =>
        [...document.querySelector('maplat-ui')!.shadowRoot!.querySelectorAll<HTMLElement>(sel)].filter(
          s => s.dataset.mapId === M
        ).length,
      { M, sel: BASE_SLIDES }
    );
    expect(count).toBeGreaterThanOrEqual(1);

    // 中央へ寄せる（旧 API の baseSwiper facade の slideToMapID。互換層が新しいスライダーへ委譲する）
    await page.evaluate(M => (window as any).__maplatUi.baseSwiper.slideToMapID(M), M);
    await page.waitForFunction(
      M =>
        (document.querySelector('maplat-ui') as any)
          .slider('base')
          .slots.find((s: any) => s.offset === 0)?.element.dataset.mapId === M,
      M,
      { timeout: 8000 }
    );
    await page.waitForTimeout(1200);
    // 中央のカードの上端寄り（矢印を避ける位置。oct26-m9-t1 の e2e と同じ求め方）。
    // 当たり判定は shadow root の elementFromPoint（文書の elementFromPoint はホストを返す）
    const center = await page.evaluate(() => {
      const host = document.querySelector('maplat-ui') as any;
      const sr = host.shadowRoot as ShadowRoot;
      const root = sr.querySelector('[part="map-slider"][data-kind="base"]') as HTMLElement;
      const act = host.slider('base').slots.find((s: any) => s.offset === 0).element as HTMLElement;
      const r = act.getBoundingClientRect();
      const cr = root.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = Math.max(r.top, cr.top) + 6;
      return { x, y, hit: sr.elementFromPoint(x, y)?.closest('[part~="map-slide"]') === act };
    });
    expect(center.hit).toBe(true);
    // hover（実マウス）と、M のスライド全部への mouseover の発火
    await page.mouse.move(center.x, center.y);
    await page.evaluate(
      ({ M, sel }) => {
        document
          .querySelector('maplat-ui')!
          .shadowRoot!.querySelectorAll<HTMLElement>(sel)
          .forEach(s => {
            if (s.dataset.mapId === M) s.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
          });
      },
      { M, sel: BASE_SLIDES }
    );
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => (window as any).__nov26m5t1m)).toBeUndefined();

    await page.mouse.click(center.x, center.y);
    await page.waitForFunction(M => (window as any).__maplatUi.core.from?.mapID === M, M, { timeout: 15000 });
    expect(await page.evaluate(() => (window as any).__maplatUi.core.from.mapID)).toBe(M);
  });

  test('AC4: thumbnail の javascript: は「画像なし」になり、属性注入は起きない', async ({ page }) => {
    // 引用符を含む thumbnail は相対 URL として要求される。新しいスライダーは読めなかった画像を頭文字の
    // プレースホルダに替える（壊れた画像を出さない）ので、要求に PNG を返して <img> のまま残し、src の値を読む
    await page.route(
      url => url.pathname.includes('onerror'),
      route => route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        'base64'
      ) })
    );
    await openFixture(page);
    // 言い換え: 旧は javascript: を「no_image.png の <img>」にしていた。新は「<img> を作らず、画像なしの
    // プレースホルダ（span.thumb.none。<maplat-ui> の #thumbPlaceholder）を置く」。判定の中身＝javascript: を
    // 画像の URL にしない・画像なしの絵が出る、は変えない（img があれば src に javascript: を含まないことも見る）
    const js = await page.evaluate(sel => {
      const cards = [
        ...document
          .querySelector('maplat-ui')!
          .shadowRoot!.querySelectorAll<HTMLElement>(`${sel}[data-map-id="m5t1_thumb_js"]`)
      ];
      return cards.map(card => ({
        srcs: [...card.querySelectorAll('img')].map(i => i.getAttribute('src')),
        placeholder: !!card.querySelector('.thumb.none'),
        html: card.innerHTML.includes('javascript:')
      }));
    }, BASE_SLIDES);
    expect(js.length).toBeGreaterThan(0);
    for (const card of js) {
      for (const src of card.srcs) {
        expect(src).toBeTruthy();
        expect(src!).not.toContain('javascript:');
      }
      expect(card.placeholder, '画像なしの絵（プレースホルダ）が出る').toBe(true);
      expect(card.html, 'javascript: が DOM のどこにも入らない').toBe(false);
    }
    // 引用符を含む thumbnail は相対 URL として通り、src の値そのものになる（属性は増えない）。
    // 言い換え: 旧の `attrs: 2` は旧のスライドの <img> の属性の数。新の <img> は class・part・alt・src を持つので、
    // 「普通のサムネイル（m5t1_plain）の <img> と同じ属性の名前の組」で「注入で属性が増えない」を判定する
    const attrImgs = await page.evaluate(sel => {
      const sr = document.querySelector('maplat-ui')!.shadowRoot!;
      const names = (i: Element) => [...i.attributes].map(a => a.name).sort();
      const plain = sr.querySelector(`${sel}[data-map-id="m5t1_plain"] img`);
      return {
        plain: plain ? names(plain) : null,
        imgs: [...sr.querySelectorAll(`${sel}[data-map-id="m5t1_thumb_attr"] img`)].map(i => ({
          src: i.getAttribute('src'),
          names: names(i)
        }))
      };
    }, BASE_SLIDES);
    expect(attrImgs.plain).toBeTruthy();
    expect(attrImgs.imgs.length).toBeGreaterThan(0);
    for (const a of attrImgs.imgs)
      expect(a).toEqual({ src: 'x" onerror="window.__nov26m5t1t=1', names: attrImgs.plain });
    expect(await page.locator('.map-slider-track img[onerror]').count()).toBe(0);
    await page.waitForTimeout(2000);
    expect(await page.evaluate(() => (window as any).__nov26m5t1t)).toBeUndefined();
    expect(await page.evaluate(() => (window as any).__nov26m5t1j)).toBeUndefined();
  });
});

test.describe('nov26-m5-t1 重なったマーカーのメニューの icon（Maplat#274）', () => {
  test('AC1 (c): icon の注入値で項目が position: fixed にならず、宣言が 1 つ以下', async ({ page }) => {
    await openFixture(page);
    const INJ = 'x);position:fixed;inset:0;z-index:99999;background:url(y';
    // 言い換え: 旧 contextmenu は extend の時点で文書の container に li を描き、icon を li の
    // background-image に入れていた。新は <maplat-ui> の汎用メニュー（part="poi-menu"）で、開いたときに
    // li > button[part=poi-menu-item] > img.icon を描く。そこで extend の後に開いて、項目の li・button・img の
    // どれも position: fixed にならず、インラインの宣言が 1 つ以下（あれば background-image）であることを見る
    const r = await page.evaluate(INJ => {
      const cm = (window as any).__maplatUi.contextMenu;
      cm.clear();
      cm.extend([{ icon: INJ, text: 'p' }]);
      cm.Internal.openMenu([40, 40]);
      const lis = [...(cm.container as HTMLElement).querySelectorAll('li')].filter(li =>
        li.querySelector('span')?.textContent === 'p'
      );
      return lis.map(li =>
        [li, ...li.querySelectorAll<HTMLElement>('*')].map(el => ({
          tag: el.tagName,
          position: getComputedStyle(el).position,
          length: el.style.length,
          first: el.style.length ? el.style.item(0) : null
        }))
      );
    }, INJ);
    expect(r.length).toBe(1);
    for (const el of r[0]) {
      expect(el.position, el.tag).not.toBe('fixed');
      expect(el.length, el.tag).toBeLessThanOrEqual(1);
      if (el.length === 1) expect(el.first, el.tag).toBe('background-image');
    }
  });
});
