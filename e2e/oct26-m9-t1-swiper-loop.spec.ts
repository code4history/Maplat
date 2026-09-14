import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * oct26-m9-t1: 地図切り替えスワイパーの少数枚ループ（code4history/Maplat#259）— 実 UI E2E
 *
 * 設計書: docs/superpowers/specs/2026-09-14-oct26-m9-t1-design.md v2 §8
 * fixture: e2e/fixtures/swiper-loop.html?base=<n>&overlay=<n>
 *
 * - AC-1（主判定）: 矢印の実クリックで active mapID が正順 / 逆順の巡回と完全一致（幅 1280・375）
 * - AC-2: スワイパー中央（上端寄りの高さ）からの実ドラッグ（1 枚分の 0.75 倍の距離）で同上
 * - AC-3: 1 枚は loop: false・single-map・矢印は swiper-button-lock で display: none・ドラッグで不変
 * - AC-4: 全ページで Swiper Loop Warning が 0 件
 * - AC-5: 右のカードの実クリック・setSlideMapID・core.changeMap 後の active mapID と .selected（(c) は既知の遷移を含め常に判定）
 * - AC-6: 初期 DOM の巡回で隣り合う 2 枚が同じ地図にならない・slidesPerView・左右に別の地図が覗く
 * - AC-12: 覗いているカードの実クリックで、クリックした側へ 1 枚分アニメーションし、クリックした要素が中央に来る
 * - 破壊試験（R2 MIN-R2-2）: 遷移中の連打・ドラッグ直後・矢印直後のクリックで、地図・選択表示・タイトルが正しい
 * - AC-12 補助（IR1 MAJ-1）: 保留中の onResize があってもカードのクリック後に中央のカードと地図が揃う
 * - AC-13（人間の指示による範囲追加・OF-1）: 状態復元（URL の #! 経由の changeMap）の後にスワイパーの active が目的の地図に合う
 *
 * active mapID は各スワイパーの `.swiper-slide-active` の `data` 属性で読む（§8.1。realIndex は複製環境で使わない）。
 * 待ち方は経路で分ける（§8.1）: 矢印・ドラッグは `!swiper.animating`、カードのクリック・setSlideMapID・changeMap は
 * 「active mapID が期待値になるのを期限付きで待つ → 一定時間置いても同値」。
 *
 * 環境変数 M9_RECORD_DIR を与えると、各テストの観測記録（JSON）をそのディレクトリへ書く（証跡用。CI では不要）。
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
 * AC-5 (c)（外部からの core.changeMap 後に active mapID が合う）: 実装 IR1 までは、swiper の observeParents が親要素の属性変化
 * （changeMap で .maplat の class が変わる等）を拾って onResize → slideToLoop(その時点の realIndex) を requestAnimationFrame に積み、
 * Maplat の slideToMapID が積んだ slideTo の後に走って元の位置へ戻す既知の不具合（M9T1-OF-1・変更前 695415e から存在）のため、
 * 既定では判定から外していた。人間の指示による範囲追加（2026-09-14）で OF-1 を本タスクで直したので、既知の遷移
 * （tatebayashi_kaei_jokamachi → zendoji_garan）を含めて常に判定する（src/swiper_ex.ts の位置合わせの見張り）。
 */

/** src/swiper_loop.ts の slideRepeatCount と同じ契約（e2e は src を import しない） */
const repeatCount = (n: number) => (n < 2 ? 1 : Math.ceil(5 / n));
const idsOf = (k: Kind, n: number) => (k === 'base' ? BASE_IDS : OVERLAY_IDS).slice(0, n);

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
  await page.waitForFunction(
    () => ['base', 'overlay'].every(k => (document.querySelector(`.${k}-swiper`) as any)?.swiper),
    null,
    { timeout: 30000 }
  );
  // 初期化の slideToMapID の遷移が終わるのを待つ（設計 §5.6 の記録: 2 秒では 1 回目の操作が遷移の途中になる回があった）
  await page.waitForTimeout(4000);
  // changeMap の呼び出しを記録する（破壊試験で「最後に選ばれた地図」を知るため。呼び出しはそのまま通す）
  await page.evaluate(() => {
    const ui = (window as any).__maplatUi;
    const w = window as any;
    w.__m9changeMap = [];
    // 地図タイトルの期待値は mapChanged の detail から ui_init.ts applyMapChanged と同じ式で求める
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

const activeData = (page: Page, k: Kind) =>
  page.evaluate(k => document.querySelector(`.${k}-swiper .swiper-slide-active`)?.getAttribute('data') ?? null, k);

const waitNotAnimating = (page: Page, k: Kind) =>
  page.waitForFunction(k => !(document.querySelector(`.${k}-swiper`) as any).swiper.animating, k, { timeout: 5000 });

/** 期待値を期限付きで待ち、settle ms 置いても同値かを返す（§8.1・R1 MIN-1） */
async function waitActive(page: Page, k: Kind, id: string, timeout: number, settle: number) {
  let reached = true;
  try {
    await page.waitForFunction(
      ({ k, id }) => document.querySelector(`.${k}-swiper .swiper-slide-active`)?.getAttribute('data') === id,
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
    k => [...document.querySelectorAll(`.${k}-swiper .swiper-slide.selected`)].map(e => e.getAttribute('data')),
    k
  );

/** 地図タイトルの期待値（mapChanged の detail から ui_init.ts applyMapChanged と同じ式で求めたもの）と実際の表示 */
const titleState = (page: Page, id: string) =>
  page.evaluate(id => {
    const expected = (window as any).__m9titles?.[id];
    return {
      expected: expected === undefined ? null : expected,
      actual: (document.querySelector('.map-title span') as HTMLElement | null)?.innerText ?? null
    };
  }, id);

/**
 * 覗いているカード（.swiper-slide-next / .swiper-slide-prev）の「見えていてカードに当たる点」を求め、印を付ける。
 * locator.click() は矩形の中心を押し、覗いているカードの中心は容器の外（地図の canvas の上）なので使えない（設計 §8.1）。
 * 走査: まずカードの縦の中央の行を、容器の内側の端から横に 1px ずつ（設計者 probe と同じ）。見つからなければ
 * 交わりの矩形全体を上の行から走査する。`elementFromPoint(x, y).closest('.swiper-slide')` がそのカード自身の点だけを採る
 * （矢印ボタンなど他の要素に覆われた点は採らない）。
 */
const markPeek = (page: Page, k: Kind, side: Side) =>
  page.evaluate(
    ({ k, side }) => {
      const root = document.querySelector(`.${k}-swiper`) as any;
      const sw = root.swiper;
      root.querySelectorAll('.swiper-slide').forEach((e: Element) => e.removeAttribute('data-m9-mark'));
      const peek = root.querySelector(`.swiper-slide-${side}`) as HTMLElement | null;
      const act = root.querySelector('.swiper-slide-active') as HTMLElement | null;
      if (!peek || !act) return null;
      peek.setAttribute('data-m9-mark', '1');
      const cr = root.getBoundingClientRect();
      const pr = peek.getBoundingClientRect();
      const ar = act.getBoundingClientRect();
      const lo = Math.max(pr.left, cr.left) + 1;
      const hi = Math.min(pr.right, cr.right) - 1;
      const top = Math.max(pr.top, cr.top) + 1;
      const bottom = Math.min(pr.bottom, cr.bottom) - 1;
      const hits = (x: number, y: number) => document.elementFromPoint(x, y)?.closest('.swiper-slide') === peek;
      const xs: number[] = [];
      for (let i = 0; i <= Math.floor(hi - lo); i++) xs.push(side === 'next' ? lo + i : hi - i);
      let pt: { x: number; y: number } | null = null;
      const midY = pr.top + pr.height / 2;
      for (const x of xs) if (hits(x, midY)) { pt = { x, y: midY }; break; }
      for (let y = top; !pt && y <= bottom; y++) for (const x of xs) if (hits(x, y)) { pt = { x, y }; break; }
      return {
        id: peek.getAttribute('data'),
        from: act.getAttribute('data'),
        point: pt,
        step: ar.width + (sw.params.spaceBetween || 0),
        peekCx0: pr.left + pr.width / 2,
        containerCx: cr.left + cr.width / 2
      };
    },
    { k, side }
  );

/**
 * 遷移中など `.swiper-slide-next` / `-prev` のクラスがまだ画面上の位置と一致しないときに使う。
 * 容器の右端（side=next）/ 左端（side=prev）から内側 60px の帯を走査し、その瞬間に見えていて
 * `elementFromPoint` がスライドに当たる最初の点を返す（そのスライドに印を付ける）。
 */
const markEdgeCard = (page: Page, k: Kind, side: Side) =>
  page.evaluate(
    ({ k, side }) => {
      const root = document.querySelector(`.${k}-swiper`) as any;
      root.querySelectorAll('.swiper-slide').forEach((e: Element) => e.removeAttribute('data-m9-mark'));
      const cr = root.getBoundingClientRect();
      for (let y = Math.ceil(cr.top) + 1; y < cr.bottom - 1; y += 2) {
        for (let i = 1; i < 60; i++) {
          const x = side === 'next' ? cr.right - i : cr.left + i;
          const slide = document.elementFromPoint(x, y)?.closest('.swiper-slide') as HTMLElement | null;
          if (slide && root.contains(slide)) {
            slide.setAttribute('data-m9-mark', '1');
            return { id: slide.getAttribute('data'), point: { x, y } };
          }
        }
      }
      return null;
    },
    { k, side }
  );

/** wrapperEl の transform の CSS transition を記録する（loopFix の補正は duration 0 で transition を生まない） */
const hookTransitions = (page: Page, k: Kind) =>
  page.evaluate(k => {
    const sw = (document.querySelector(`.${k}-swiper`) as any).swiper;
    const w = window as any;
    w.__m9runs = w.__m9runs || {};
    w.__m9runs[k] = [];
    w.__m9hooked = w.__m9hooked || {};
    if (w.__m9hooked[k]) return;
    w.__m9hooked[k] = true;
    const px = (v: string) => {
      const m = /translate3d\(\s*(-?[\d.e+-]+)px/.exec(v || '');
      if (m) return Number(m[1]);
      const mm = /matrix\(([^)]+)\)/.exec(v || '');
      return mm ? Number(mm[1].split(',')[4]) : NaN;
    };
    sw.wrapperEl.addEventListener('transitionrun', (ev: TransitionEvent) => {
      if (ev.target !== sw.wrapperEl || ev.propertyName !== 'transform') return;
      for (const a of sw.wrapperEl.getAnimations()) {
        if ((a as any).transitionProperty !== 'transform') continue;
        const kf = (a.effect as KeyframeEffect).getKeyframes();
        w.__m9runs[k].push(Math.round(px(kf[kf.length - 1].transform as string) - px(kf[0].transform as string)));
      }
    });
  }, k);

/** AC-12 の 1 クリック分の観測と判定 */
async function clickPeekAndJudge(page: Page, k: Kind, side: Side, n: number) {
  const pre = await markPeek(page, k, side);
  if (!pre || !pre.point) return { k, side, ok: false, reason: pre ? 'no clickable point' : 'no peek slide', pre };
  await hookTransitions(page, k);
  // 補助の読み取り軸: requestAnimationFrame ごとに、印を付けたカードの中心 x と wrapperEl の実行中アニメーション数を記録する
  const sampling = page.evaluate(
    k =>
      new Promise<{ t: number; x: number; anim: number }[]>(resolve => {
        const root = document.querySelector(`.${k}-swiper`) as any;
        const sw = root.swiper;
        const t0 = performance.now();
        const w = window as any;
        w.__m9stop = false;
        const out: { t: number; x: number; anim: number }[] = [];
        const tick = () => {
          const m = root.querySelector('[data-m9-mark="1"]') as HTMLElement;
          const r = m.getBoundingClientRect();
          out.push({ t: Math.round(performance.now() - t0), x: r.left + r.width / 2, anim: sw.wrapperEl.getAnimations().length });
          // クリック後の待ち（期待値の到達 → 1.2 秒）が終わるまで採る（上限 15 秒）
          if (!w.__m9stop && performance.now() - t0 < 15000) requestAnimationFrame(tick);
          else resolve(out);
        };
        requestAnimationFrame(tick);
      }),
    k
  );
  await page.mouse.click(pre.point.x, pre.point.y);
  const wait = await waitActive(page, k, pre.id!, 8000, 1200);
  await page.evaluate(() => { (window as any).__m9stop = true; });
  const frames = await sampling;
  const post = await page.evaluate(k => {
    const root = document.querySelector(`.${k}-swiper`) as any;
    const cr = root.getBoundingClientRect();
    const mark = root.querySelector('[data-m9-mark="1"]') as HTMLElement;
    const r = mark.getBoundingClientRect();
    const hit = document.elementFromPoint(cr.left + cr.width / 2, cr.top + cr.height / 2)?.closest('.swiper-slide');
    const act = root.querySelector('.swiper-slide-active');
    return {
      runs: ((window as any).__m9runs[k] as number[]).slice(),
      markCx: r.left + r.width / 2,
      centerIsMark: hit === mark,
      activeIsMark: act === mark,
      selected: [...root.querySelectorAll('.swiper-slide.selected')].map((e: Element) => e.getAttribute('data'))
    };
  }, k);
  const sign = side === 'next' ? -1 : 1;
  const animSum = post.runs.reduce((a, b) => a + b, 0);
  const markMove = post.markCx - pre.peekCx0;
  const dirOk = post.runs.length > 0 && post.runs.every(d => Math.sign(d) === sign);
  const amountOk = Math.abs(animSum - sign * pre.step) <= 3;
  const visualOk = Math.abs(markMove - animSum) <= 3;
  const centerOk = post.centerIsMark && post.activeIsMark;
  const selectedOk = post.selected.length === repeatCount(n) && post.selected.every(s => s === pre.id);
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
  const box = (await page.locator(`.${k}-swiper`).boundingBox())!;
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

/** AC-6: 初期 DOM・slidesPerView・覗き */
const initialLayout = (page: Page, k: Kind) =>
  page.evaluate(k => {
    const root = document.querySelector(`.${k}-swiper`) as any;
    const sw = root.swiper;
    const cr = root.getBoundingClientRect();
    const overlapW = (el: Element | null) => {
      if (!el) return -1;
      const r = el.getBoundingClientRect();
      return Math.min(r.right, cr.right) - Math.max(r.left, cr.left);
    };
    const prev = root.querySelector('.swiper-slide-prev');
    const next = root.querySelector('.swiper-slide-next');
    const act = root.querySelector('.swiper-slide-active');
    return {
      order: [...root.querySelectorAll('.swiper-slide')].map((e: Element) => e.getAttribute('data')),
      loop: sw.params.loop,
      slidesPerView: sw.params.slidesPerView,
      active: act?.getAttribute('data') ?? null,
      prev: prev?.getAttribute('data') ?? null,
      next: next?.getAttribute('data') ?? null,
      prevOverlap: overlapW(prev),
      nextOverlap: overlapW(next)
    };
  }, k);

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
        expect.soft(lay.order.length, `AC-6 ${k} 総スライド数`).toBe(n * repeatCount(n));
        const adjacentSame = lay.order.filter((d, i) => d === lay.order[(i + 1) % lay.order.length]).length;
        expect.soft(adjacentSame, `AC-6 ${k} 巡回で隣り合う同じ地図の数 order=${lay.order.join(',')}`).toBe(0);
        expect.soft(lay.slidesPerView, `AC-6 ${k} slidesPerView`).toBe(width >= 480 ? 1.4 : 2);
        expect.soft(lay.prevOverlap, `AC-6 ${k} 左のカードが容器内に覗く`).toBeGreaterThanOrEqual(1);
        expect.soft(lay.nextOverlap, `AC-6 ${k} 右のカードが容器内に覗く`).toBeGreaterThanOrEqual(1);
        expect.soft(lay.prev !== null && lay.prev !== lay.active, `AC-6 ${k} 左は active と別の地図 (${lay.prev}/${lay.active})`).toBe(true);
        expect.soft(lay.next !== null && lay.next !== lay.active, `AC-6 ${k} 右は active と別の地図 (${lay.next}/${lay.active})`).toBe(true);

        // AC-1（主判定）: 矢印の実クリック
        for (const [dir, sign] of [['next', 1], ['prev', -1]] as const) {
          const start = (await activeData(page, k))!;
          const seq: (string | null)[] = [];
          for (let i = 0; i < 2 * n + 1; i++) {
            await page.locator(`.${k}-${dir}`).click({ timeout: 5000 });
            await waitNotAnimating(page, k);
            seq.push(await activeData(page, k));
          }
          rec[`${k}Arrow_${dir}`] = { start, seq };
          expect.soft(seq, `AC-1 ${k} ${dir} 矢印 ${2 * n + 1} 回の active mapID 列`).toEqual(cyclic(ids, start, sign, 2 * n + 1));
        }

        // AC-2: 実ドラッグ（左へ = 次へ、右へ = 前へ）
        // 設計の「中央から 80px」から次の 2 点を変えている（実装記録の H-6 計測・設計逸脱として記録）:
        // (1) 距離を 1 枚分（active の幅 + spaceBetween）の 0.75 倍にする。80px は幅 1280 で 1 枚分 167px の 0.48 倍で、
        //     ドラッグが swiper の longSwipesMs（300ms）を超えると long swipe（longSwipesRatio 0.5 未満）として元へ戻る。
        //     headless の描画負荷でマウス移動が 300ms を超える回があり、同じ実装で結果が揺れた。
        // (2) 縦位置を上端から 8px にする。swiper は short swipe を矢印ボタンの上で離すと prev ボタンでは動かさない
        //     （swiper-core の onTouchEnd の isNavButtonTarget 分岐）ため、終点が矢印に重ならない高さでドラッグする。
        const dist = await page.evaluate(k => {
          const root = document.querySelector(`.${k}-swiper`) as any;
          const act = root.querySelector('.swiper-slide-active') as HTMLElement;
          return Math.round((act.getBoundingClientRect().width + (root.swiper.params.spaceBetween || 0)) * 0.75);
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
    expect.soft(lay.order.length, `AC-6 ${k} 総スライド数`).toBe(n * repeatCount(n));
    const adjacentSame = lay.order.filter((d, i) => d === lay.order[(i + 1) % lay.order.length]).length;
    expect.soft(adjacentSame, `AC-6 ${k} 巡回で隣り合う同じ地図の数`).toBe(0);
  }
  rec.warns = warns;
  record(test.info().title, rec);
  expect(warns, 'AC-4 Swiper Loop Warning').toEqual([]);
});

for (const width of WIDTHS) {
  test(`AC-3 AC-4 w=${width} n=1: 1 枚は loop しない・矢印は lock で非表示・ドラッグで不変`, async ({ page }) => {
    test.setTimeout(120000);
    const warns = await openFixture(page, width, 1, 1);
    const rec: any = {};
    for (const k of KINDS) {
      const info = await page.evaluate(k => {
        const root = document.querySelector(`.${k}-swiper`) as any;
        const btn = (s: string) => {
          const b = document.querySelector(`.${k}-${s}`) as HTMLElement;
          return { lock: b.classList.contains('swiper-button-lock'), display: getComputedStyle(b).display };
        };
        return {
          loop: root.swiper.params.loop,
          single: root.classList.contains('single-map'),
          slides: root.querySelectorAll('.swiper-slide').length,
          next: btn('next'),
          prev: btn('prev')
        };
      }, k);
      expect.soft(info.loop, `AC-3 ${k} params.loop`).toBe(false);
      expect.soft(info.single, `AC-3 ${k} single-map`).toBe(true);
      expect.soft(info.slides, `AC-3 ${k} スライド数`).toBe(1);
      for (const s of ['next', 'prev'] as const) {
        expect.soft(info[s].lock, `AC-3 ${k}-${s} swiper-button-lock`).toBe(true);
        expect.soft(info[s].display, `AC-3 ${k}-${s} display`).toBe('none');
      }
      const before = await activeData(page, k);
      await drag(page, k, -80);
      await page.waitForTimeout(800);
      const afterLeft = await activeData(page, k);
      await drag(page, k, 80);
      await page.waitForTimeout(800);
      const afterRight = await activeData(page, k);
      rec[k] = { info, before, afterLeft, afterRight };
      expect.soft([afterLeft, afterRight], `AC-3 ${k} ドラッグ後の active`).toEqual([before, before]);
    }
    rec.warns = warns;
    record(test.info().title, rec);
    expect(warns, 'AC-4 Swiper Loop Warning').toEqual([]);
  });
}

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
        expect.soft(sel, `AC-5 (a) ${k} .selected`).toEqual(Array(repeatCount(n)).fill(pre.id));
        expect.soft(title.actual, `AC-5 (a) ${k} 地図タイトル`).toBe(title.expected);
      }
      // (a') 中央のカードのクリックでは動かない（R2 Info 2）
      {
        const center = await page.evaluate(k => {
          const root = document.querySelector(`.${k}-swiper`) as any;
          const act = root.querySelector('.swiper-slide-active') as HTMLElement;
          const r = act.getBoundingClientRect();
          const cr = root.getBoundingClientRect();
          const x = r.left + r.width / 2;
          const y = Math.max(r.top, cr.top) + 6;
          return { x, y, id: act.getAttribute('data'), hit: document.elementFromPoint(x, y)?.closest('.swiper-slide') === act, translate: root.swiper.translate };
        }, k);
        expect.soft(center.hit, `AC-5 (a') ${k} 中央のカードの押せる点`).toBe(true);
        await page.mouse.click(center.x, center.y);
        await page.waitForTimeout(1200);
        const after = await page.evaluate(k => {
          const root = document.querySelector(`.${k}-swiper`) as any;
          return { translate: root.swiper.translate, active: root.querySelector('.swiper-slide-active')?.getAttribute('data') };
        }, k);
        r.center = { center, after };
        expect.soft(after, `AC-5 (a') ${k} 中央のカードのクリック後に translate と active が変わらない`).toEqual({ translate: center.translate, active: center.id });
        expect.soft(await selectedData(page, k), `AC-5 (a') ${k} .selected`).toEqual(Array(repeatCount(n)).fill(center.id));
      }
      // (b) setSlideMapID
      r.b = [];
      for (const id of [...ids.slice(1), ids[0]]) {
        const cur = await activeData(page, k);
        if (cur === id) continue; // 期待値が操作前と同じ回は判定から外す（偽 PASS を避ける）
        await page.evaluate(({ k, id }) => (window as any).__maplatUi[`${k}Swiper`].setSlideMapID(id), { k, id });
        const wait = await waitActive(page, k, id, 5000, 700);
        const sel = await selectedData(page, k);
        r.b.push({ id, from: cur, wait, sel });
        expect.soft(wait, `AC-5 (b) ${k} setSlideMapID(${id})`).toEqual({ reached: true, stable: true });
        expect.soft(sel, `AC-5 (b) ${k} setSlideMapID(${id}) の .selected`).toEqual(Array(repeatCount(n)).fill(id));
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
 * 「中央に来るのがクリックした要素ではなく同じ地図の別の複製になる」ことは既知の限界（設計 §5.6 / §9.3）なので判定せず記録だけする。
 */
for (const n of [2, 3]) {
  test(`破壊試験 w=1280 n=${n}: 遷移中の連打・ドラッグ直後・矢印直後のクリックで地図・選択表示・タイトルが揃う`, async ({ page }) => {
    test.setTimeout(240000);
    const warns = await openFixture(page, 1280, n, n);
    const rec: any[] = [];
    const settleAndJudge = async (k: Kind, scenario: string, extra: any) => {
      const calls: string[] = await page.evaluate(() => (window as any).__m9changeMap.slice());
      const last = calls[calls.length - 1];
      const wait = last ? await waitActive(page, k, last, 8000, 1200) : { reached: false, stable: false };
      const sel = await selectedData(page, k);
      const title = last ? await titleState(page, last) : { expected: null, actual: null };
      const centerIsMark = await page.evaluate(k => {
        const root = document.querySelector(`.${k}-swiper`) as any;
        const cr = root.getBoundingClientRect();
        const hit = document.elementFromPoint(cr.left + cr.width / 2, cr.top + cr.height / 2)?.closest('.swiper-slide');
        return hit ? hit.getAttribute('data-m9-mark') === '1' : null;
      }, k);
      rec.push({ k, scenario, calls, last, wait, sel, title, centerIsClickedElement: centerIsMark, ...extra });
      expect.soft(calls.length, `${scenario} ${k}: カードのクリックが changeMap まで届いた`).toBeGreaterThan(0);
      expect.soft(wait, `${scenario} ${k}: active mapID = 最後に選ばれた地図 ${last}`).toEqual({ reached: true, stable: true });
      expect.soft(sel, `${scenario} ${k}: .selected`).toEqual(Array(repeatCount(n)).fill(last));
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
          await page.mouse.click(q.point.x, q.point.y);
          await settleAndJudge(k, 'D3 ドラッグ直後', { clicked: q.id });
        }
      }
      // D4: 矢印を押した 40ms 後（遷移中）に、その時点の右隣をクリック
      {
        await page.locator(`.${k}-next`).click({ timeout: 5000 });
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
 * AC-12 補助（実装レビュー IR1 MAJ-1）: 保留中の onResize とカードのクリックの競合
 *
 * swiper の observeParents の MutationObserver は、親要素の属性変化を拾うと observerUpdate → onResize を呼び、
 * onResize は slideToLoop(その時点の realIndex, 0, false, true) で「その時点の DOM の並びでの index」を計算してから
 * slideTo を requestAnimationFrame に積む。この rAF が走る前にカードのクリックが来ると、click ハンドラの先回り
 * （slideNext / slidePrev = 同期の loopFix による DOM の並べ替え）で index の意味が変わり、後から走る slideTo(…, 0) が
 * 位置を直前の地図へ戻す。後から来る mapChanged → slideToMapID は「active が既に同じ mapID」を見て早期 return
 * していたため、中央のカードと地図が持続的に食い違っていた（IR1 §4.2: 修正前は左のカード 0/5）。
 *
 * 自然発生は headless では 1 フレーム程度の窓で稀なので、実クリックの pointerup の直前（window の capture）で
 * swiper 自身の observerUpdate を発火し、onResize の rAF が保留中の状態を毎回作る。クリックは実マウス（page.mouse.click）で、
 * swiper の onTouchEnd → click → Maplat の click ハンドラの実経路を通す。
 * 判定: 毎回、active mapID がクリックした地図に到達し 1 秒後も同値・.selected・地図タイトルが揃う。
 */
for (const n of [2, 5]) {
  test(`AC-12 補助 w=375 n=${n}: 保留中の onResize があってもカードのクリック後に中央のカードと地図が揃う（IR1 MAJ-1）`, async ({ page }) => {
    test.setTimeout(300000);
    const warns = await openFixture(page, 375, n, n);
    const rec: any[] = [];
    for (const k of KINDS) {
      for (const side of CLICK_ORDER) {
        const pre = await markPeek(page, k, side);
        expect.soft(pre?.point, `MAJ-1 ${k} ${side}: 押せる点`).toBeTruthy();
        if (!pre?.point) continue;
        await page.evaluate(k => {
          const sw = (document.querySelector(`.${k}-swiper`) as any).swiper;
          const w = window as any;
          w.__m9resize = 0;
          const once = () => {
            window.removeEventListener('pointerup', once, true);
            // MutationObserver が 1 件の変化を拾ったときと同じ同期の emit（swiper-core observer モジュール）
            sw.emit('observerUpdate');
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
          sel.length === repeatCount(n) &&
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
 * 経路: index.ts の page.js ハンドラ（stateUrl: true）→ core.changeMap(restore.mapID) → mapChanged → applyMapChanged →
 * setSlideMapID → slideToMapID → slideToLoop（slideTo は requestAnimationFrame に積まれる）。
 * OF-1 の競合は「この rAF が走る前に、地図の切り替えで親要素の属性が変わり、observeParents の MutationObserver が
 * onResize → slideToLoop(まだ動く前の realIndex, 0) を後から積む」ことで起きる。自然発生は直前の操作列に依存して揺れるので、
 * Maplat の slideToMapID が slideToLoop を呼んだ同じタスクの中で swiper 自身の observerUpdate を発火し（MutationObserver が
 * 1 件の変化を拾ったときと同じ同期の emit）、毎回その順序を作る。slideToLoop の包みは観測用で、元の関数をそのまま呼ぶ。
 * 判定: 毎回、active mapID が目的の地図に到達し 1 秒後も同値・地図タイトル・changeMap が URL から呼ばれたこと。
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
    // (2) 読み込み後の #! の変更（戻る・進む・URL の編集と同じ popstate 経路）。既知の遷移 kaei_jokamachi → zendoji_garan を含む
    const plan: [Kind, string][] = [
      ...(['tatebayashi_castle_akimoto', 'tatebayashi_kaei_jokamachi', 'zendoji_garan', 'tatebayashi_ojozu', ...(n >= 5 ? ['tatebayashi_bunkazai_center'] : []), 'tatebayashi_kaei_jokamachi', 'zendoji_garan'].map(id => ['overlay', id] as [Kind, string])),
      ...idsOf('base', n).slice(1).concat(idsOf('base', n)[0]).map(id => ['base', id] as [Kind, string])
    ];
    for (const [k, id] of plan) {
      const cur = await activeData(page, k);
      if (cur === id) continue;
      await page.evaluate(({ k, id }) => {
        const w = window as any;
        const sw = (document.querySelector(`.${k}-swiper`) as any).swiper;
        w.__m9inject = 0;
        if (!sw.__m9origSlideToLoop) sw.__m9origSlideToLoop = sw.slideToLoop;
        const orig = sw.__m9origSlideToLoop;
        let armed = true;
        sw.slideToLoop = function (...args: any[]) {
          const r = orig.apply(this, args);
          // internal（onResize 自身の呼び出し）は除く。最初の位置合わせの直後に 1 回だけ observerUpdate を発火する
          if (armed && !args[3]) {
            armed = false;
            w.__m9inject++;
            sw.emit('observerUpdate');
          }
          return r;
        };
        location.hash = `#!s:${id}`;
      }, { k, id });
      const wait = await waitActive(page, k, id, 8000, 1000);
      const info = await page.evaluate(({ k }) => {
        const w = window as any;
        const sw = (document.querySelector(`.${k}-swiper`) as any).swiper;
        sw.slideToLoop = sw.__m9origSlideToLoop;
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
