import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * oct26-m9-t1: 地図切り替えスワイパーの少数枚ループ（code4history/Maplat#259）— 実 UI E2E
 *
 * 設計書: docs/superpowers/specs/2026-09-14-oct26-m9-t1-design.md v2 §8
 * fixture: e2e/fixtures/swiper-loop.html?base=<n>&overlay=<n>
 *
 * - AC-1（主判定）: 矢印の実クリックで active mapID が正順 / 逆順の巡回と完全一致（幅 1280・375）
 * - AC-2: スワイパー中央（上端寄りの高さ）からの実ドラッグ（1 枚分の 0.75 倍の距離）で同上
 * - AC-3: 1 枚は巡回しない・single-map・矢印は非表示・ドラッグで不変
 * - AC-4: 全ページで Swiper Loop Warning が 0 件
 * - AC-5: 右のカードの実クリック・setSlideMapID・core.changeMap 後の active mapID と .selected（(c) は既知の遷移を含め常に判定）
 * - AC-6: 初期配置で隣り合うカードが同じ地図にならない・枚数（perView）・左右に別の地図が覗く
 * - AC-12: 覗いているカードの実クリックで、クリックした側へ 1 枚分アニメーションし、クリックした要素が中央に来る
 * - 破壊試験（R2 MIN-R2-2）: 遷移中の連打・ドラッグ直後・矢印直後のクリックで、地図・選択表示・タイトルが正しい
 * - AC-12 補助（IR1 MAJ-1）: 保留中の再配置があってもカードのクリック後に中央のカードと地図が揃う
 * - AC-13（人間の指示による範囲追加・OF-1）: 状態復元（URL の #! 経由の changeMap）の後にスワイパーの active が目的の地図に合う
 *
 * 環境変数 M9_RECORD_DIR を与えると、各テストの観測記録（JSON）をそのディレクトリへ書く（証跡用。CI では不要）。
 *
 * ── 一本化での移植（M4(d)・M7）──────────────────────────────
 * 旧 API の `MaplatUi` は `<maplat-ui>` の上の互換層になり、スワイパーは Swiper ではなく
 * `<maplat-ui>` の shadow root の中の自前のスライダー（`src/element/slider.ts`。5 スロットの循環）になった。
 *   旧 `.base-swiper .swiper-slide[data]`   → `[part="map-slider"][data-kind="base"] [part~="map-slide"][data-map-id]`
 *   旧 `.swiper-slide-active`               → `host.slider(k).slots` の offset 0 の要素（押した要素と同じノード）
 *   旧 `.swiper-slide-next` / `-prev`       → 同じく offset +1 / -1 の要素
 *   旧 `.swiper-slide.selected`             → `[part~="map-slide"].selected`（一致する全スロット）
 *   旧 `swiper.animating`                   → `host.slider(k).animating`（`@internal`。テスト専用）
 *   旧 `swiper.params.slidesPerView`        → `host.slider(k).perView`
 *   旧 `swiper.wrapperEl`・`swiper.translate` → スライダーの帯 `.map-slider-track` とその transform
 *   旧 `.map-title span`                    → `[part="map-title"] .text`
 *   旧 `.base-next` / `.base-prev`          → `[part="map-slider-next"]` / `[part="map-slider-prev"]`
 *   `document.elementFromPoint` はホストを返すので、当たり判定は shadow root の `elementFromPoint` で行う。
 * 期待値の言い換え（Swiper の複製の数に依るもの。各所のコメントにも書いた）:
 *   - `.selected` の数: 旧 `repeatCount(n)`（Swiper の複製の数）→ `selectedCount(n)`（offset -2..+2 のうち
 *     `offset mod n == 0` の数。N=1 は 1・N=2 は 3・N>=3 は 1）
 *   - AC-6 の総スライド数: 旧 `n * repeatCount(n)` → スロットの数（N=1 は 1・N>=2 は 5）。
 *     「巡回で隣り合う同じ地図が 0」は「見えている 3 スロット（offset -1・0・+1）が N>=3 で全部異なる・
 *     N=2 で中央と両隣が異なる」へ
 *   - AC-6 の枚数: 旧 `width >= 480 ? 1.4 : 2`（Swiper v6 以後の設定）→ `width <= 480 ? 1.4 : 2`
 *     （幅 480px 以下で 1.4 枚・gap 10／481px 以上で 2 枚・gap 15。`spec/fixtures/legacy-e2e-classification.md` の「意図した差分」。
 *     旧の式はそのまま写さず、`slider.ts` の `perViewFor` に従った）
 *   - AC-3: 旧 `params.loop === false`・`swiper-button-lock` → `single-map` class・矢印の `hidden`
 *     （display: none）・`step()` が何もしない・ドラッグで不変
 *   - AC-12 補助・AC-13 の「競合の順序を作る」注入: 旧は Swiper の `observerUpdate`（onResize の保留）を
 *     発火していた。新は同じ時点でスライダーの再配置（`refresh()`。ResizeObserver が呼ぶもの）を割り込ませる
 */

const OVERLAY_IDS = [
  'tatebayashi_ojozu',
  'tatebayashi_castle_akimoto',
  'tatebayashi_kaei_jokamachi',
  'zendoji_garan',
  'tatebayashi_bunkazai_center',
  'tatebayashi_bunkazai_zeniki'
];
const BASE_IDS = ['osm', 'gsi', 'gsi_ortho', 'm9_base_4', 'm9_base_5'];
const KINDS = ['base', 'overlay'] as const;
type Kind = (typeof KINDS)[number];
type Side = 'next' | 'prev';
const WIDTHS = [1280, 375];
const CLICK_ORDER: Side[] = ['next', 'next', 'prev', 'prev', 'next', 'prev', 'next', 'next', 'prev', 'prev'];

/**
 * AC-5 (c)（外部からの core.changeMap 後に active mapID が合う）: 旧の Swiper 版では既知の不具合（M9T1-OF-1）を
 * 直したあと、既知の遷移（tatebayashi_kaei_jokamachi → zendoji_garan）を含めて常に判定する。
 */

/**
 * 言い換え（AC-12・M4(d)）: 選択中の地図が中央にあるとき、`.selected` が付くスロットの数。
 * 5 スロット（offset -2..+2）のうち `offset mod n == 0` のもの（N=1 は 1 スロットだけ）。
 * 旧は Swiper の複製の数 `repeatCount(n) = n < 2 ? 1 : ceil(5 / n)` だった。
 */
const selectedCount = (n: number) => (n < 2 ? 1 : [-2, -1, 0, 1, 2].filter(o => o % n === 0).length);
const idsOf = (k: Kind, n: number) => (k === 'base' ? BASE_IDS : OVERLAY_IDS).slice(0, n);
/** スライダーの根（shadow root の中）。Playwright の CSS locator は shadow root を貫く */
const sliderSel = (k: Kind) => `[part="map-slider"][data-kind="${k}"]`;

function record(name: string, data: unknown) {
  const dir = process.env.M9_RECORD_DIR;
  if (!dir) return;
  fs.mkdirSync(dir, { recursive: true });
  const info = test.info();
  const suffix = `r${info.repeatEachIndex}-retry${info.retry}`;
  fs.writeFileSync(path.join(dir, `${name.replace(/[^\w.=-]+/g, '_')}${suffix}.json`), JSON.stringify(data, null, 1));
}

async function openFixture(page: Page, width: number, base: number, overlay: number) {
  const warns: string[] = [];
  // AC-4: listener は goto の前に付ける
  page.on('console', m => {
    if (/Swiper Loop Warning/i.test(m.text())) warns.push(m.text().slice(0, 120));
  });
  await page.setViewportSize({ width, height: 800 });
  await page.goto(`/e2e/fixtures/swiper-loop.html?base=${base}&overlay=${overlay}`);
  await page.waitForFunction(() => document.getElementById('status')?.textContent === 'READY', null, {
    timeout: 90000
  });
  // 旧: 両方の .{k}-swiper に swiper が付く → 新: 両方のスライダーがカードを持つ
  await page.waitForFunction(
    () => {
      const host = document.querySelector('maplat-ui') as any;
      return ['base', 'overlay'].every(k => (host?.slider?.(k)?.slots?.length ?? 0) > 0);
    },
    null,
    { timeout: 30000 }
  );
  // 初期化の位置合わせが終わるのを待つ（2 秒では 1 回目の操作が遷移の途中になる回があった）
  await page.waitForTimeout(4000);
  // changeMap の呼び出しを記録する（破壊試験で「最後に選ばれた地図」を知るため。呼び出しはそのまま通す）。
  // <maplat-ui> は子の <maplat-app> の changeMap を呼び、子は中身（ui.core）の changeMap を呼ぶので、ここで拾える
  await page.evaluate(() => {
    const ui = (window as any).__maplatUi;
    const w = window as any;
    w.__m9changeMap = [];
    // 地図タイトルの期待値は mapChanged の detail から旧 ui_init.ts applyMapChanged と同じ式で求める
    w.__m9titles = {};
    ui.core.addEventListener('mapChanged', (evt: any) => {
      const map = evt.detail;
      w.__m9titles[map.mapID] = ui.translate(map.officialTitle || map.title || map.label) || '';
    });
    const orig = ui.core.changeMap.bind(ui.core);
    ui.core.changeMap = (...args: any[]) => {
      w.__m9changeMap.push(args[0]);
      return orig(...args);
    };
  });
  return warns;
}

/** 中央（offset 0）のカードの mapID（旧 `.swiper-slide-active` の `data`） */
const activeData = (page: Page, k: Kind) =>
  page.evaluate(
    k =>
      ((document.querySelector('maplat-ui') as any).slider(k)?.slots.find((s: any) => s.offset === 0)?.element
        .dataset.mapId as string | undefined) ?? null,
    k
  );

const waitNotAnimating = (page: Page, k: Kind) =>
  page.waitForFunction(k => !(document.querySelector('maplat-ui') as any).slider(k).animating, k, { timeout: 5000 });

/** 期待値を期限付きで待ち、settle ms 置いても同値かを返す（§8.1・R1 MIN-1） */
async function waitActive(page: Page, k: Kind, id: string, timeout: number, settle: number) {
  let reached = true;
  try {
    await page.waitForFunction(
      ({ k, id }) =>
        (document.querySelector('maplat-ui') as any).slider(k)?.slots.find((s: any) => s.offset === 0)?.element
          .dataset.mapId === id,
      { k, id },
      { timeout }
    );
  } catch {
    reached = false;
  }
  await page.waitForTimeout(settle);
  const stable = (await activeData(page, k)) === id;
  return { reached, stable };
}

const selectedData = (page: Page, k: Kind) =>
  page.evaluate(
    sel =>
      [
        ...document
          .querySelector('maplat-ui')!
          .shadowRoot!.querySelectorAll<HTMLElement>(`${sel} [part~="map-slide"].selected`)
      ].map(e => e.dataset.mapId ?? null),
    sliderSel(k)
  );

/** 地図タイトルの期待値（mapChanged の detail から旧 ui_init.ts applyMapChanged と同じ式で求めたもの）と実際の表示 */
const titleState = (page: Page, id: string) =>
  page.evaluate(id => {
    const expected = (window as any).__m9titles?.[id];
    const el = document.querySelector('maplat-ui')?.shadowRoot?.querySelector('[part="map-title"] .text') as
      | HTMLElement
      | null
      | undefined;
    return {
      expected: expected === undefined ? null : expected,
      actual: el?.innerText ?? null
    };
  }, id);

/**
 * 覗いているカード（offset +1 / -1）の「見えていてカードに当たる点」を求め、印を付ける。
 * locator.click() は矩形の中心を押し、覗いているカードの中心は容器の外（地図の canvas の上）なので使えない（設計 §8.1）。
 * 走査: まずカードの縦の中央の行を、容器の内側の端から横に 1px ずつ。見つからなければ交わりの矩形全体を上の行から
 * 走査する。shadow root の `elementFromPoint(x, y).closest('[part~=map-slide]')` がそのカード自身の点だけを採る
 * （矢印ボタンなど他の要素に覆われた点は採らない）。
 */
const markPeek = (page: Page, k: Kind, side: Side) =>
  page.evaluate(
    ({ k, side, sel }) => {
      const host = document.querySelector('maplat-ui') as any;
      const sr = host.shadowRoot as ShadowRoot;
      const slider = host.slider(k);
      const root = sr.querySelector(sel) as HTMLElement;
      root.querySelectorAll('[part~="map-slide"]').forEach((e: Element) => e.removeAttribute('data-m9-mark'));
      const at = (o: number) => (slider.slots.find((s: any) => s.offset === o)?.element as HTMLElement) ?? null;
      const peek = at(side === 'next' ? 1 : -1);
      const act = at(0);
      if (!peek || !act) return null;
      peek.setAttribute('data-m9-mark', '1');
      const cr = root.getBoundingClientRect();
      const pr = peek.getBoundingClientRect();
      const ar = act.getBoundingClientRect();
      const lo = Math.max(pr.left, cr.left) + 1;
      const hi = Math.min(pr.right, cr.right) - 1;
      const top = Math.max(pr.top, cr.top) + 1;
      const bottom = Math.min(pr.bottom, cr.bottom) - 1;
      const hits = (x: number, y: number) => sr.elementFromPoint(x, y)?.closest('[part~="map-slide"]') === peek;
      const xs: number[] = [];
      for (let i = 0; i <= Math.floor(hi - lo); i++) xs.push(side === 'next' ? lo + i : hi - i);
      let pt: { x: number; y: number } | null = null;
      const midY = pr.top + pr.height / 2;
      for (const x of xs) if (hits(x, midY)) { pt = { x, y: midY }; break; }
      for (let y = top; !pt && y <= bottom; y++) for (const x of xs) if (hits(x, y)) { pt = { x, y }; break; }
      return {
        id: peek.dataset.mapId ?? null,
        from: act.dataset.mapId ?? null,
        point: pt,
        step: ar.width + (slider.gap || 0),
        peekCx0: pr.left + pr.width / 2,
        containerCx: cr.left + cr.width / 2
      };
    },
    { k, side, sel: sliderSel(k) }
  );

/**
 * 遷移中など offset と画面上の位置がまだ一致しないときに使う。
 * 容器の右端（side=next）/ 左端（side=prev）から内側 60px の帯を走査し、その瞬間に見えていて
 * `elementFromPoint` がカードに当たる最初の点を返す（そのカードに印を付ける）。
 */
const markEdgeCard = (page: Page, k: Kind, side: Side) =>
  page.evaluate(
    ({ side, sel }) => {
      const sr = document.querySelector('maplat-ui')!.shadowRoot!;
      const root = sr.querySelector(sel) as HTMLElement;
      root.querySelectorAll('[part~="map-slide"]').forEach((e: Element) => e.removeAttribute('data-m9-mark'));
      const cr = root.getBoundingClientRect();
      for (let y = Math.ceil(cr.top) + 1; y < cr.bottom - 1; y += 2) {
        for (let i = 1; i < 60; i++) {
          const x = side === 'next' ? cr.right - i : cr.left + i;
          const slide = sr.elementFromPoint(x, y)?.closest('[part~="map-slide"]') as HTMLElement | null;
          if (slide && root.contains(slide)) {
            slide.setAttribute('data-m9-mark', '1');
            return { id: slide.dataset.mapId ?? null, point: { x, y } };
          }
        }
      }
      return null;
    },
    { side, sel: sliderSel(k) }
  );

/**
 * スライダーの帯（旧 wrapperEl）の transform の CSS transition を記録する
 * （循環のつなぎ目の付け替えは transition: none で transition を生まない。旧 loopFix の duration 0 と同じ）
 */
const hookTransitions = (page: Page, k: Kind) =>
  page.evaluate(
    ({ k, sel }) => {
      const track = document.querySelector('maplat-ui')!.shadowRoot!.querySelector(`${sel} .map-slider-track`) as HTMLElement;
      const w = window as any;
      w.__m9runs = w.__m9runs || {};
      w.__m9runs[k] = [];
      w.__m9hooked = w.__m9hooked || {};
      if (w.__m9hooked[k] === track) return;
      w.__m9hooked[k] = track;
      const px = (v: string) => {
        const m = /translate3d\(\s*(-?[\d.e+-]+)px/.exec(v || '');
        if (m) return Number(m[1]);
        const mm = /matrix\(([^)]+)\)/.exec(v || '');
        return mm ? Number(mm[1].split(',')[4]) : NaN;
      };
      track.addEventListener('transitionrun', (ev: TransitionEvent) => {
        if (ev.target !== track || ev.propertyName !== 'transform') return;
        for (const a of track.getAnimations()) {
          if ((a as any).transitionProperty !== 'transform') continue;
          const kf = (a.effect as KeyframeEffect).getKeyframes();
          w.__m9runs[k].push(Math.round(px(kf[kf.length - 1].transform as string) - px(kf[0].transform as string)));
        }
      });
    },
    { k, sel: sliderSel(k) }
  );

/** AC-12 の 1 クリック分の観測と判定 */
async function clickPeekAndJudge(page: Page, k: Kind, side: Side, n: number) {
  const pre = await markPeek(page, k, side);
  if (!pre || !pre.point) return { k, side, ok: false, reason: pre ? 'no clickable point' : 'no peek slide', pre };
  await hookTransitions(page, k);
  // 補助の読み取り軸: requestAnimationFrame ごとに、印を付けたカードの中心 x と帯の実行中アニメーション数を記録する
  const sampling = page.evaluate(
    sel =>
      new Promise<{ t: number; x: number; anim: number }[]>(resolve => {
        const root = document.querySelector('maplat-ui')!.shadowRoot!.querySelector(sel) as HTMLElement;
        const track = root.querySelector('.map-slider-track') as HTMLElement;
        const t0 = performance.now();
        const w = window as any;
        w.__m9stop = false;
        const out: { t: number; x: number; anim: number }[] = [];
        const tick = () => {
          const m = root.querySelector('[data-m9-mark="1"]') as HTMLElement;
          const r = m.getBoundingClientRect();
          out.push({ t: Math.round(performance.now() - t0), x: r.left + r.width / 2, anim: track.getAnimations().length });
          // クリック後の待ち（期待値の到達 → 1.2 秒）が終わるまで採る（上限 15 秒）
          if (!w.__m9stop && performance.now() - t0 < 15000) requestAnimationFrame(tick);
          else resolve(out);
        };
        requestAnimationFrame(tick);
      }),
    sliderSel(k)
  );
  await page.mouse.click(pre.point.x, pre.point.y);
  const wait = await waitActive(page, k, pre.id!, 8000, 1200);
  await page.evaluate(() => { (window as any).__m9stop = true; });
  const frames = await sampling;
  const post = await page.evaluate(
    ({ k, sel }) => {
      const host = document.querySelector('maplat-ui') as any;
      const sr = host.shadowRoot as ShadowRoot;
      const root = sr.querySelector(sel) as HTMLElement;
      const cr = root.getBoundingClientRect();
      const mark = root.querySelector('[data-m9-mark="1"]') as HTMLElement;
      const r = mark.getBoundingClientRect();
      const hit = sr.elementFromPoint(cr.left + cr.width / 2, cr.top + cr.height / 2)?.closest('[part~="map-slide"]');
      const act = host.slider(k).slots.find((s: any) => s.offset === 0)?.element;
      return {
        runs: ((window as any).__m9runs[k] as number[]).slice(),
        markCx: r.left + r.width / 2,
        centerIsMark: hit === mark,
        activeIsMark: act === mark,
        selected: [...root.querySelectorAll<HTMLElement>('[part~="map-slide"].selected')].map(e => e.dataset.mapId ?? null)
      };
    },
    { k, sel: sliderSel(k) }
  );
  const sign = side === 'next' ? -1 : 1;
  const animSum = post.runs.reduce((a, b) => a + b, 0);
  const markMove = post.markCx - pre.peekCx0;
  const dirOk = post.runs.length > 0 && post.runs.every(d => Math.sign(d) === sign);
  const amountOk = Math.abs(animSum - sign * pre.step) <= 3;
  const visualOk = Math.abs(markMove - animSum) <= 3;
  const centerOk = post.centerIsMark && post.activeIsMark;
  // 言い換え: 期待数は旧の repeatCount(n) ではなく selectedCount(n)（AC-12）
  const selectedOk = post.selected.length === selectedCount(n) && post.selected.every(s => s === pre.id);
  // transitionrun 軸（(i) 向き・(ii) 量・(iii) 見た目の移動）
  const transitionOk = dirOk && amountOk && visualOk;
  // rAF 軸: 正味の移動が 1 枚分・逆向きに 3px を超えて出ない・アニメーションが走らない 2 フレーム間で 0.6 枚分を超えて飛ばない・アニメーションが 1 回は走る
  const x0 = frames[0]?.x ?? pre.peekCx0;
  const net = (frames[frames.length - 1]?.x ?? x0) - x0;
  const rafNetOk = Math.abs(net - sign * pre.step) <= 3;
  const rafReverse = frames.some(f => sign * (f.x - x0) < -3);
  const rafJump = frames.some((f, i) => i > 0 && f.anim === 0 && frames[i - 1].anim === 0 && Math.abs(f.x - frames[i - 1].x) > 0.6 * pre.step);
  const rafAnimSeen = frames.some(f => f.anim > 0);
  const rafOk = rafNetOk && !rafReverse && !rafJump && rafAnimSeen;
  await page.waitForTimeout(300);
  return {
    k,
    side,
    from: pre.from,
    clicked: pre.id,
    step: Math.round(pre.step),
    runs: post.runs,
    animSum,
    markMove: Math.round(markMove),
    wait,
    selected: post.selected,
    dirOk,
    amountOk,
    visualOk,
    transitionOk,
    raf: { net: Math.round(net), rafNetOk, rafReverse, rafJump, rafAnimSeen, rafOk, trace: frames.map(f => `${f.t}:${Math.round(f.x)}${f.anim ? '*' : ''}`).join(' ') },
    centerOk,
    selectedOk,
    // 動きの判定は transitionrun 軸と rAF 軸のどちらかで成立すればよい（一方の観測の取りこぼしで偽の FAIL にしない）。
    // 逆向き・アニメーション無しの跳躍・移動量の誤りは、両軸とも FAIL になる（実装記録の H-6 計測・設計逸脱として記録）。
    ok: (transitionOk || rafOk) && centerOk && selectedOk && wait.reached && wait.stable
  };
}

/** スワイパー中央から横へドラッグする。y は既定で縦の中央、'upper' で上端から 8px（矢印ボタンの高さを避ける） */
async function drag(page: Page, k: Kind, dx: number, row: 'middle' | 'upper' = 'middle') {
  const box = (await page.locator(sliderSel(k)).boundingBox())!;
  const x0 = box.x + box.width / 2;
  const y = row === 'upper' ? box.y + 8 : box.y + box.height / 2;
  await page.mouse.move(x0, y);
  await page.mouse.down();
  await page.mouse.move(x0 + dx, y, { steps: 8 });
  await page.mouse.up();
}

const cyclic = (ids: string[], start: string, dir: 1 | -1, count: number) => {
  const s = ids.indexOf(start);
  return Array.from({ length: count }, (_, i) => ids[(((s + dir * (i + 1)) % ids.length) + ids.length) % ids.length]);
};

/** AC-6: 初期配置・perView・覗き */
const initialLayout = (page: Page, k: Kind) =>
  page.evaluate(
    ({ k, sel }) => {
      const host = document.querySelector('maplat-ui') as any;
      const slider = host.slider(k);
      const root = host.shadowRoot.querySelector(sel) as HTMLElement;
      const cr = root.getBoundingClientRect();
      const overlapW = (el: Element | null) => {
        if (!el) return -1;
        const r = el.getBoundingClientRect();
        return Math.min(r.right, cr.right) - Math.max(r.left, cr.left);
      };
      const slots = [...slider.slots].sort((a: any, b: any) => a.offset - b.offset);
      const at = (o: number) => (slots.find((s: any) => s.offset === o)?.element as HTMLElement) ?? null;
      const prev = at(-1);
      const next = at(1);
      const act = at(0);
      return {
        // 左から順（offset -2..+2）の mapID
        order: slots.map((s: any) => s.element.dataset.mapId ?? null),
        perView: slider.perView,
        active: act?.dataset.mapId ?? null,
        prev: prev?.dataset.mapId ?? null,
        next: next?.dataset.mapId ?? null,
        prevOverlap: overlapW(prev),
        nextOverlap: overlapW(next)
      };
    },
    { k, sel: sliderSel(k) }
  );

/**
 * 言い換え（AC-6）: 旧の「巡回で隣り合う同じ地図の数 = 0」（Swiper の複製の並び）を、
 * 「見えている 3 スロット（offset -1・0・+1）が N>=3 で全部異なる・N=2 で中央と両隣が異なる」にする。
 * 返り値は「満たさない組の数」（0 で合格）。
 */
const visibleSameCount = (lay: { prev: string | null; active: string | null; next: string | null }, n: number) => {
  let bad = 0;
  if (lay.prev === lay.active) bad++;
  if (lay.next === lay.active) bad++;
  if (n >= 3 && lay.prev === lay.next) bad++;
  return bad;
};
/**
 * 言い換え（AC-6）: 総スライド数は旧 `n * repeatCount(n)`（Swiper の複製を含む数）→ スロットの数
 * （N=1 は 1・N>=2 は 5。同じ行の式 `min(5, n)` はこの数と食い違う書き誤りで、
 * `slider.ts` の `#slotCount()` も N>=2 で 5）
 */
const slotTotal = (n: number) => (n < 2 ? 1 : 5);
/** 言い換え（AC-6・P1）: 旧 `width >= 480 ? 1.4 : 2` → `width <= 480 ? 1.4 : 2` */
const perViewOf = (width: number) => (width <= 480 ? 1.4 : 2);

for (const width of WIDTHS) {
  for (const n of [2, 3, 4, 5]) {
    test(`AC-1 AC-2 AC-4 AC-6 w=${width} n=${n}: 矢印とドラッグで左右とも巡回し、初期配置で隣が同じ地図にならない`, async ({ page }) => {
      test.setTimeout(240000);
      const warns = await openFixture(page, width, n, n);
      const rec: any = { width, n };
      for (const k of KINDS) {
        const ids = idsOf(k, n);
        // AC-6
        const lay = await initialLayout(page, k);
        rec[`${k}Layout`] = lay;
        expect.soft(lay.order.length, `AC-6 ${k} 総スライド数`).toBe(slotTotal(n));
        expect.soft(visibleSameCount(lay, n), `AC-6 ${k} 見えている 3 枚で隣り合う同じ地図の数 order=${lay.order.join(',')}`).toBe(0);
        expect.soft(lay.perView, `AC-6 ${k} perView`).toBe(perViewOf(width));
        expect.soft(lay.prevOverlap, `AC-6 ${k} 左のカードが容器内に覗く`).toBeGreaterThanOrEqual(1);
        expect.soft(lay.nextOverlap, `AC-6 ${k} 右のカードが容器内に覗く`).toBeGreaterThanOrEqual(1);
        expect.soft(lay.prev !== null && lay.prev !== lay.active, `AC-6 ${k} 左は active と別の地図 (${lay.prev}/${lay.active})`).toBe(true);
        expect.soft(lay.next !== null && lay.next !== lay.active, `AC-6 ${k} 右は active と別の地図 (${lay.next}/${lay.active})`).toBe(true);

        // AC-1（主判定）: 矢印の実クリック
        for (const [dir, sign] of [['next', 1], ['prev', -1]] as const) {
          const start = (await activeData(page, k))!;
          const seq: (string | null)[] = [];
          for (let i = 0; i < 2 * n + 1; i++) {
            await page.locator(`${sliderSel(k)} [part="map-slider-${dir}"]`).click({ timeout: 5000 });
            await waitNotAnimating(page, k);
            seq.push(await activeData(page, k));
          }
          rec[`${k}Arrow_${dir}`] = { start, seq };
          expect.soft(seq, `AC-1 ${k} ${dir} 矢印 ${2 * n + 1} 回の active mapID 列`).toEqual(cyclic(ids, start, sign, 2 * n + 1));
        }

        // AC-2: 実ドラッグ（左へ = 次へ、右へ = 前へ）
        // 距離は 1 枚分（中央のカードの幅 + 間隔）の 0.75 倍、縦位置は上端から 8px（旧と同じ。旧の理由は Swiper の
        // long swipe と矢印ボタンの上で離したときの分岐。新しいスライダーでも同じ点で離す）。
        const dist = await page.evaluate(k => {
          const slider = (document.querySelector('maplat-ui') as any).slider(k);
          const act = slider.slots.find((s: any) => s.offset === 0).element as HTMLElement;
          return Math.round((act.getBoundingClientRect().width + (slider.gap || 0)) * 0.75);
        }, k);
        rec[`${k}DragDistance`] = dist;
        for (const [dx, sign, label] of [[-dist, 1, 'left'], [dist, -1, 'right']] as const) {
          const start = (await activeData(page, k))!;
          const seq: (string | null)[] = [];
          for (let i = 0; i < n + 1; i++) {
            await drag(page, k, dx, 'upper');
            await waitNotAnimating(page, k);
            await page.waitForTimeout(100);
            seq.push(await activeData(page, k));
          }
          rec[`${k}Drag_${label}`] = { start, seq };
          expect.soft(seq, `AC-2 ${k} ${label} ドラッグ ${n + 1} 回の active mapID 列`).toEqual(cyclic(ids, start, sign, n + 1));
        }
      }
      rec.warns = warns;
      record(test.info().title, rec);
      expect(warns, 'AC-4 Swiper Loop Warning').toEqual([]);
    });
  }
}

test('AC-4 AC-6 n=6: base 5 枚・overlay 6 枚でも警告が無く隣が同じ地図にならない', async ({ page }) => {
  test.setTimeout(120000);
  const warns = await openFixture(page, 1280, 5, 6);
  const rec: any = {};
  for (const k of KINDS) {
    const lay = await initialLayout(page, k);
    rec[k] = lay;
    const n = k === 'base' ? 5 : 6;
    expect.soft(lay.order.length, `AC-6 ${k} 総スライド数`).toBe(slotTotal(n));
    expect.soft(visibleSameCount(lay, n), `AC-6 ${k} 見えている 3 枚で隣り合う同じ地図の数`).toBe(0);
    // 5 スロットに出ている地図はどれも異なる（n >= 5 なので offset -2..+2 は全部別の地図）
    expect.soft(new Set(lay.order).size, `AC-6 ${k} 5 スロットの地図が全部異なる order=${lay.order.join(',')}`).toBe(5);
  }
  rec.warns = warns;
  record(test.info().title, rec);
  expect(warns, 'AC-4 Swiper Loop Warning').toEqual([]);
});

for (const width of WIDTHS) {
  test(`AC-3 AC-4 w=${width} n=1: 1 枚は巡回しない・矢印は非表示・ドラッグで不変`, async ({ page }) => {
    test.setTimeout(120000);
    const warns = await openFixture(page, width, 1, 1);
    const rec: any = {};
    for (const k of KINDS) {
      // 言い換え（AC-3）: 旧の params.loop === false と swiper-button-lock は存在しない。
      // single-map class・矢印の hidden（display: none）・step() が何もしない、で判定する
      const info = await page.evaluate(
        sel => {
          const host = document.querySelector('maplat-ui') as any;
          const root = host.shadowRoot.querySelector(sel) as HTMLElement;
          const btn = (s: string) => {
            const b = root.querySelector(`[part="map-slider-${s}"]`) as HTMLElement;
            return { hidden: b.hidden, display: getComputedStyle(b).display };
          };
          return {
            single: root.classList.contains('single-map'),
            slides: root.querySelectorAll('[part~="map-slide"]').length,
            next: btn('next'),
            prev: btn('prev')
          };
        },
        sliderSel(k)
      );
      expect.soft(info.single, `AC-3 ${k} single-map`).toBe(true);
      expect.soft(info.slides, `AC-3 ${k} スライド数`).toBe(1);
      for (const s of ['next', 'prev'] as const) {
        expect.soft(info[s].hidden, `AC-3 ${k}-${s} hidden（旧 swiper-button-lock）`).toBe(true);
        expect.soft(info[s].display, `AC-3 ${k}-${s} display`).toBe('none');
      }
      const before = await activeData(page, k);
      // step() は何もしない（旧 params.loop === false の言い換え。1 枚は動かない）
      const stepped = await page.evaluate(async k => {
        const slider = (document.querySelector('maplat-ui') as any).slider(k);
        await slider.step(1);
        await slider.step(-1);
        return { animating: slider.animating, active: slider.activeMapID };
      }, k);
      expect.soft(stepped, `AC-3 ${k} step() の後も動かない`).toEqual({ animating: false, active: before });
      await drag(page, k, -80);
      await page.waitForTimeout(800);
      const afterLeft = await activeData(page, k);
      await drag(page, k, 80);
      await page.waitForTimeout(800);
      const afterRight = await activeData(page, k);
      rec[k] = { info, before, stepped, afterLeft, afterRight };
      expect.soft([afterLeft, afterRight], `AC-3 ${k} ドラッグ後の active`).toEqual([before, before]);
    }
    rec.warns = warns;
    record(test.info().title, rec);
    expect(warns, 'AC-4 Swiper Loop Warning').toEqual([]);
  });
}

/** 帯（旧 wrapperEl）の今の transform（旧 swiper.translate の言い換え） */
const trackTranslate = (page: Page, k: Kind) =>
  page.evaluate(
    sel =>
      getComputedStyle(
        document.querySelector('maplat-ui')!.shadowRoot!.querySelector(`${sel} .map-slider-track`) as HTMLElement
      ).transform,
    sliderSel(k)
  );

for (const n of [2, 3, 4, 5]) {
  test(`AC-4 AC-5 w=1280 n=${n}: カードのクリック・setSlideMapID・changeMap 後の active と選択表示`, async ({ page }) => {
    test.setTimeout(240000);
    const warns = await openFixture(page, 1280, n, n);
    const rec: any = { n };
    for (const k of KINDS) {
      const ids = idsOf(k, n);
      const r: any = {};
      // (a) 右のカードの実クリック
      const pre = await markPeek(page, k, 'next');
      expect.soft(pre?.point, `AC-5 (a) ${k} 右のカードの押せる点`).toBeTruthy();
      if (pre?.point) {
        await page.mouse.click(pre.point.x, pre.point.y);
        const wait = await waitActive(page, k, pre.id!, 8000, 700);
        const sel = await selectedData(page, k);
        const title = await titleState(page, pre.id!);
        r.a = { clicked: pre.id, from: pre.from, wait, sel, title };
        expect.soft(pre.id !== pre.from, `AC-5 (a) ${k} クリック対象は操作前の active と異なる`).toBe(true);
        expect.soft(wait, `AC-5 (a) ${k} active = クリックした mapID`).toEqual({ reached: true, stable: true });
        expect.soft(sel, `AC-5 (a) ${k} .selected`).toEqual(Array(selectedCount(n)).fill(pre.id));
        expect.soft(title.actual, `AC-5 (a) ${k} 地図タイトル`).toBe(title.expected);
      }
      // (a') 中央のカードのクリックでは動かない（R2 Info 2）
      {
        const center = await page.evaluate(
          ({ k, sel }) => {
            const host = document.querySelector('maplat-ui') as any;
            const sr = host.shadowRoot as ShadowRoot;
            const root = sr.querySelector(sel) as HTMLElement;
            const act = host.slider(k).slots.find((s: any) => s.offset === 0).element as HTMLElement;
            const r = act.getBoundingClientRect();
            const cr = root.getBoundingClientRect();
            const x = r.left + r.width / 2;
            const y = Math.max(r.top, cr.top) + 6;
            return { x, y, id: act.dataset.mapId ?? null, hit: sr.elementFromPoint(x, y)?.closest('[part~="map-slide"]') === act };
          },
          { k, sel: sliderSel(k) }
        );
        const translate0 = await trackTranslate(page, k);
        expect.soft(center.hit, `AC-5 (a') ${k} 中央のカードの押せる点`).toBe(true);
        await page.mouse.click(center.x, center.y);
        await page.waitForTimeout(1200);
        const after = { translate: await trackTranslate(page, k), active: await activeData(page, k) };
        r.center = { center, translate0, after };
        expect.soft(after, `AC-5 (a') ${k} 中央のカードのクリック後に translate と active が変わらない`).toEqual({ translate: translate0, active: center.id });
        expect.soft(await selectedData(page, k), `AC-5 (a') ${k} .selected`).toEqual(Array(selectedCount(n)).fill(center.id));
      }
      // (b) setSlideMapID（旧 API の baseSwiper / overlaySwiper facade。互換層が新しいスライダーへ委譲する）
      r.b = [];
      for (const id of [...ids.slice(1), ids[0]]) {
        const cur = await activeData(page, k);
        if (cur === id) continue; // 期待値が操作前と同じ回は判定から外す（偽 PASS を避ける）
        await page.evaluate(({ k, id }) => (window as any).__maplatUi[`${k}Swiper`].setSlideMapID(id), { k, id });
        const wait = await waitActive(page, k, id, 5000, 700);
        const sel = await selectedData(page, k);
        r.b.push({ id, from: cur, wait, sel });
        expect.soft(wait, `AC-5 (b) ${k} setSlideMapID(${id})`).toEqual({ reached: true, stable: true });
        expect.soft(sel, `AC-5 (b) ${k} setSlideMapID(${id}) の .selected`).toEqual(Array(selectedCount(n)).fill(id));
      }
      expect.soft(r.b.length, `AC-5 (b) ${k} 判定した id の数`).toBeGreaterThanOrEqual(n - 1);
      // (c) core.changeMap
      r.c = [];
      for (const id of [...ids.slice(1), ids[0]]) {
        const cur = await activeData(page, k);
        if (cur === id) continue;
        await page.evaluate(id => {
          const ui = (window as any).__maplatUi;
          const w = window as any;
          const t0 = performance.now();
          const ev: string[] = (w.__m9cev = []);
          const h = (e: any) => ev.push(`mapChanged:${e.detail.mapID}@${Math.round(performance.now() - t0)}`);
          ui.core.addEventListener('mapChanged', h);
          setTimeout(() => ui.core.removeEventListener('mapChanged', h), 9000);
          Promise.resolve(ui.core.changeMap(id)).then(
            () => ev.push(`resolved@${Math.round(performance.now() - t0)}`),
            (e: unknown) => ev.push(`rejected:${String(e)}@${Math.round(performance.now() - t0)}`)
          );
        }, id);
        const wait = await waitActive(page, k, id, 8000, 700);
        const events = await page.evaluate(() => (window as any).__m9cev.slice());
        r.c.push({ id, from: cur, wait, events });
        expect.soft(events.some((e: string) => e.startsWith(`mapChanged:${id}@`)), `AC-5 (c) ${k} changeMap(${id}) の mapChanged`).toBe(true);
        expect.soft(wait, `AC-5 (c) ${k} changeMap(${id}) from ${cur}`).toEqual({ reached: true, stable: true });
      }
      expect.soft(r.c.length, `AC-5 (c) ${k} 判定した id の数`).toBeGreaterThanOrEqual(n - 1);
      rec[k] = r;
    }
    rec.warns = warns;
    record(test.info().title, rec);
    expect(warns, 'AC-4 Swiper Loop Warning').toEqual([]);
  });
}

for (const width of WIDTHS) {
  for (const n of [2, 3, 4, 5]) {
    test(`AC-4 AC-12 w=${width} n=${n}: 覗いているカードのクリックで、その側へ 1 枚分動いてクリックした要素が中央に来る`, async ({ page }) => {
      test.setTimeout(300000);
      const warns = await openFixture(page, width, n, n);
      const rec: any[] = [];
      for (const k of KINDS) {
        for (const side of CLICK_ORDER) {
          const r = await clickPeekAndJudge(page, k, side, n);
          rec.push(r);
        }
      }
      record(test.info().title, { width, n, warns, rec });
      const failed = rec.filter(r => !r.ok).map(r => `${r.k}:${r.side}:${r.clicked ?? r.reason}`);
      expect.soft(failed, `AC-12 満たさなかったクリック（${rec.filter(r => r.ok).length}/${rec.length} が満たした）`).toEqual([]);
      expect(warns, 'AC-4 Swiper Loop Warning').toEqual([]);
    });
  }
}

/**
 * 破壊試験（R2 MIN-R2-2・設計 §4.1-3 の 4 点目・§9.3）
 * 遷移中の連打・ドラッグ直後・矢印直後のカードのクリックで、最後に選ばれた地図（changeMap の最後の引数）に
 * active mapID・.selected・地図タイトルが揃うことを固定する。
 * 「中央に来るのがクリックした要素か」は記録だけする（旧と同じ。旧は複製の別ノードになりうる既知の限界だった）。
 */
for (const n of [2, 3]) {
  test(`破壊試験 w=1280 n=${n}: 遷移中の連打・ドラッグ直後・矢印直後のクリックで地図・選択表示・タイトルが揃う`, async ({ page }) => {
    test.setTimeout(240000);
    const warns = await openFixture(page, 1280, n, n);
    const rec: any[] = [];
    const settleAndJudge = async (k: Kind, scenario: string, extra: any) => {
      const calls: string[] = await page.evaluate(() => (window as any).__m9changeMap.slice());
      // 押したカードが押す前の地図と同じなら changeMap は呼ばれない（同じ地図へは切り替えない）。
      // そのときは押したカードを「最後に選ばれた地図」として判定する
      const last = calls[calls.length - 1] ?? (extra.sameAsCurrent ? extra.clicked : undefined);
      const wait = last ? await waitActive(page, k, last, 8000, 1200) : { reached: false, stable: false };
      const sel = await selectedData(page, k);
      const title = last ? await titleState(page, last) : { expected: null, actual: null };
      const centerIsMark = await page.evaluate(sel => {
        const sr = document.querySelector('maplat-ui')!.shadowRoot!;
        const root = sr.querySelector(sel) as HTMLElement;
        const cr = root.getBoundingClientRect();
        const hit = sr.elementFromPoint(cr.left + cr.width / 2, cr.top + cr.height / 2)?.closest('[part~="map-slide"]');
        return hit ? hit.getAttribute('data-m9-mark') === '1' : null;
      }, sliderSel(k));
      rec.push({ k, scenario, calls, last, wait, sel, title, centerIsClickedElement: centerIsMark, ...extra });
      if (!extra.sameAsCurrent)
        expect.soft(calls.length, `${scenario} ${k}: カードのクリックが changeMap まで届いた`).toBeGreaterThan(0);
      expect.soft(wait, `${scenario} ${k}: active mapID = 最後に選ばれた地図 ${last}`).toEqual({ reached: true, stable: true });
      expect.soft(sel, `${scenario} ${k}: .selected`).toEqual(Array(selectedCount(n)).fill(last));
      expect.soft(title.actual, `${scenario} ${k}: 地図タイトル`).toBe(title.expected);
      await page.evaluate(() => { (window as any).__m9changeMap.length = 0; });
      await page.waitForTimeout(300);
    };
    for (const k of KINDS) {
      // D1: 右のカードを 60ms 間隔で 2 回（同じ点）
      {
        const p = await markPeek(page, k, 'next');
        expect.soft(p?.point, `D1 ${k}: 押せる点`).toBeTruthy();
        if (p?.point) {
          await page.mouse.click(p.point.x, p.point.y);
          await page.waitForTimeout(60);
          await page.mouse.click(p.point.x, p.point.y);
          await settleAndJudge(k, 'D1 連打（同じ点）', { first: p.id });
        }
      }
      // D2: 右のカード → 50ms 後にその時点の右隣
      {
        const p = await markPeek(page, k, 'next');
        if (p?.point) {
          await page.mouse.click(p.point.x, p.point.y);
          await page.waitForTimeout(50);
          const q = await markEdgeCard(page, k, 'next');
          if (q?.point) await page.mouse.click(q.point.x, q.point.y);
          await settleAndJudge(k, 'D2 連打（その時点の右隣）', { first: p.id, second: q?.id ?? null });
        }
      }
      // D3: 左へドラッグして離した直後（遷移中）に、その時点の右隣をクリック
      {
        await drag(page, k, -80);
        const q = await markEdgeCard(page, k, 'next');
        expect.soft(q?.point, `D3 ${k}: ドラッグ直後の押せる点`).toBeTruthy();
        if (q?.point) {
          // drag は地図を変えないので、n=2 では 1 枚動かした先の右端が今の地図のカードになる
          const before = await page.evaluate(() => (window as any).__maplatUi.core.from?.mapID);
          await page.mouse.click(q.point.x, q.point.y);
          await settleAndJudge(k, 'D3 ドラッグ直後', { clicked: q.id, sameAsCurrent: q.id === before });
        }
      }
      // D4: 矢印を押した 40ms 後（遷移中）に、その時点の右隣をクリック
      {
        await page.locator(`${sliderSel(k)} [part="map-slider-next"]`).click({ timeout: 5000 });
        await page.waitForTimeout(40);
        const q = await markEdgeCard(page, k, 'next');
        expect.soft(q?.point, `D4 ${k}: 矢印直後の押せる点`).toBeTruthy();
        if (q?.point) {
          await page.mouse.click(q.point.x, q.point.y);
          await settleAndJudge(k, 'D4 矢印直後', { clicked: q.id });
        }
      }
      // D5: 左のカードを 60ms 間隔で 2 回（その時点の左隣）
      {
        const p = await markPeek(page, k, 'prev');
        if (p?.point) {
          await page.mouse.click(p.point.x, p.point.y);
          await page.waitForTimeout(60);
          const q = await markEdgeCard(page, k, 'prev');
          if (q?.point) await page.mouse.click(q.point.x, q.point.y);
          await settleAndJudge(k, 'D5 連打（その時点の左隣）', { first: p.id, second: q?.id ?? null });
        }
      }
    }
    record(test.info().title, { n, warns, rec });
    expect(warns, 'AC-4 Swiper Loop Warning').toEqual([]);
  });
}

/**
 * AC-12 補助（実装レビュー IR1 MAJ-1）: 保留中の再配置とカードのクリックの競合
 *
 * 旧は Swiper の observeParents が拾った親要素の変化（onResize → slideToLoop の rAF の保留）とカードのクリックが
 * 競合して、中央のカードと地図が食い違っていた。新しいスライダーでは同じ役割を ResizeObserver → `refresh()`
 * （配置の計算し直し）が持つ。
 *
 * 言い換え: 実クリックの pointerup の直前（window の capture）で、旧の `sw.emit('observerUpdate')` の代わりに
 * スライダー自身の `refresh()` を割り込ませ、再配置とクリックが同じ拍に来る状態を毎回作る。
 * クリックは実マウス（page.mouse.click）で、pointerup → click → `<maplat-ui>` の onSelect の実経路を通す。
 * 判定（変えない）: 毎回、active mapID がクリックした地図に到達し 1 秒後も同値・.selected・地図タイトルが揃う。
 */
for (const n of [2, 5]) {
  test(`AC-12 補助 w=375 n=${n}: 保留中の再配置があってもカードのクリック後に中央のカードと地図が揃う（IR1 MAJ-1）`, async ({ page }) => {
    test.setTimeout(300000);
    const warns = await openFixture(page, 375, n, n);
    const rec: any[] = [];
    for (const k of KINDS) {
      for (const side of CLICK_ORDER) {
        const pre = await markPeek(page, k, side);
        expect.soft(pre?.point, `MAJ-1 ${k} ${side}: 押せる点`).toBeTruthy();
        if (!pre?.point) continue;
        await page.evaluate(k => {
          const slider = (document.querySelector('maplat-ui') as any).slider(k);
          const w = window as any;
          w.__m9resize = 0;
          const once = () => {
            window.removeEventListener('pointerup', once, true);
            // ResizeObserver が大きさの変化を拾ったときと同じ再配置（旧 swiper の observerUpdate の言い換え）
            slider.refresh();
            w.__m9resize++;
          };
          window.addEventListener('pointerup', once, true);
        }, k);
        await page.mouse.click(pre.point.x, pre.point.y);
        const injected = await page.evaluate(() => (window as any).__m9resize);
        const wait = await waitActive(page, k, pre.id!, 8000, 1000);
        const sel = await selectedData(page, k);
        const title = await titleState(page, pre.id!);
        const ok =
          injected === 1 &&
          wait.reached &&
          wait.stable &&
          sel.length === selectedCount(n) &&
          sel.every(s => s === pre.id) &&
          title.actual === title.expected;
        rec.push({ k, side, from: pre.from, clicked: pre.id, injected, wait, sel, title, now: await activeData(page, k), ok });
        await page.waitForTimeout(300);
      }
    }
    record(test.info().title, { n, warns, rec });
    const failed = rec.filter(r => !r.ok).map(r => `${r.k}:${r.side}:${r.clicked}(now ${r.now})`);
    expect.soft(failed, `MAJ-1 満たさなかったクリック（${rec.filter(r => r.ok).length}/${rec.length} が満たした）`).toEqual([]);
    expect(warns, 'AC-4 Swiper Loop Warning').toEqual([]);
  });
}

/**
 * AC-13（人間の指示による範囲追加・OF-1）: 状態復元（URL の #! 経由の core.changeMap）の後に、スワイパーの active が目的の地図に合う
 *
 * 経路: `<maplat-ui>` の状態 URL（state-url）→ 子の changeMap(restore.mapID) → mapChanged → スライダーの setSelectedMapID。
 * 旧の OF-1 の競合は「位置合わせの直後に、地図の切り替えで親要素が変わって onResize が後から積まれる」ことで起きた。
 * 言い換え: 旧は Maplat の slideToMapID が呼んだ slideToLoop の直後に Swiper の observerUpdate を発火していた。新は
 * スライダーの setSelectedMapID（位置合わせ）が呼ばれた同じタスクの中で、スライダー自身の `refresh()`（再配置）を
 * 1 回だけ割り込ませる。setSelectedMapID の包みは観測用で、元の関数をそのまま呼ぶ。
 * 判定（変えない）: 毎回、active mapID が目的の地図に到達し 1 秒後も同値・地図タイトル・changeMap が URL から呼ばれたこと。
 * 加えて、#! 付きの URL を新しく開いた（初期化時の復元）場合も active が目的の地図になることを確かめる。
 */
for (const n of [4, 5]) {
  test(`AC-13 w=1280 n=${n}: URL の #! による状態復元の後にスワイパーの active が目的の地図に合う（OF-1）`, async ({ page }) => {
    test.setTimeout(300000);
    const warns: string[] = [];
    page.on('console', m => {
      if (/Swiper Loop Warning/i.test(m.text())) warns.push(m.text().slice(0, 120));
    });
    await page.setViewportSize({ width: 1280, height: 800 });
    const rec: any = { n, initial: null, hash: [] };
    // (1) 初期化時の復元: #!s:zendoji_garan を付けて開く
    {
      const target = 'zendoji_garan';
      await page.goto(`/e2e/fixtures/swiper-loop.html?base=${n}&overlay=${n}&stateUrl=1#!s:${target}`);
      await page.waitForFunction(() => document.getElementById('status')?.textContent === 'READY', null, { timeout: 90000 });
      const wait = await waitActive(page, 'overlay', target, 15000, 1000);
      rec.initial = { target, wait };
      expect.soft(wait, `AC-13 (1) 初期化時の復元 #!s:${target} の overlay active`).toEqual({ reached: true, stable: true });
    }
    await page.waitForTimeout(3000);
    await page.evaluate(() => {
      const ui = (window as any).__maplatUi;
      const w = window as any;
      w.__m9changeMap = [];
      w.__m9titles = {};
      ui.core.addEventListener('mapChanged', (evt: any) => {
        const map = evt.detail;
        w.__m9titles[map.mapID] = ui.translate(map.officialTitle || map.title || map.label) || '';
      });
      const orig = ui.core.changeMap.bind(ui.core);
      ui.core.changeMap = (...args: any[]) => {
        w.__m9changeMap.push(args[0]);
        return orig(...args);
      };
    });
    // (2) 読み込み後の #! の変更（戻る・進む・URL の編集と同じ経路）。既知の遷移 kaei_jokamachi → zendoji_garan を含む
    const plan: [Kind, string][] = [
      ...(['tatebayashi_castle_akimoto', 'tatebayashi_kaei_jokamachi', 'zendoji_garan', 'tatebayashi_ojozu', ...(n >= 5 ? ['tatebayashi_bunkazai_center'] : []), 'tatebayashi_kaei_jokamachi', 'zendoji_garan'].map(id => ['overlay', id] as [Kind, string])),
      ...idsOf('base', n).slice(1).concat(idsOf('base', n)[0]).map(id => ['base', id] as [Kind, string])
    ];
    for (const [k, id] of plan) {
      const cur = await activeData(page, k);
      if (cur === id) continue;
      await page.evaluate(({ k, id }) => {
        const w = window as any;
        const slider = (document.querySelector('maplat-ui') as any).slider(k);
        w.__m9inject = 0;
        if (!slider.__m9origSetSelected) slider.__m9origSetSelected = slider.setSelectedMapID;
        const orig = slider.__m9origSetSelected;
        let armed = true;
        slider.setSelectedMapID = function (...args: any[]) {
          const r = orig.apply(this, args);
          // 最初の位置合わせの直後に 1 回だけ再配置を割り込ませる（旧 observerUpdate の言い換え）
          if (armed && args[0] === id) {
            armed = false;
            w.__m9inject++;
            slider.refresh();
          }
          return r;
        };
        location.hash = `#!s:${id}`;
      }, { k, id });
      const wait = await waitActive(page, k, id, 8000, 1000);
      const info = await page.evaluate(({ k }) => {
        const w = window as any;
        const slider = (document.querySelector('maplat-ui') as any).slider(k);
        slider.setSelectedMapID = slider.__m9origSetSelected;
        return { calls: w.__m9changeMap.splice(0), inject: w.__m9inject };
      }, { k });
      const title = await titleState(page, id);
      rec.hash.push({ k, id, from: cur, wait, ...info, title });
      expect.soft(info.calls, `AC-13 (2) #!s:${id} が changeMap(${id}) を呼ぶ`).toContain(id);
      expect.soft(info.inject, `AC-13 (2) #!s:${id} で競合の順序を作れた`).toBe(1);
      expect.soft(wait, `AC-13 (2) ${k} #!s:${id} from ${cur} の active`).toEqual({ reached: true, stable: true });
      expect.soft(title.actual, `AC-13 (2) #!s:${id} の地図タイトル`).toBe(title.expected);
      await page.waitForTimeout(300);
    }
    record(test.info().title, rec);
    expect(warns, 'AC-4 Swiper Loop Warning').toEqual([]);
  });
}
