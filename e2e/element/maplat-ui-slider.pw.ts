// `<maplat-ui>` の地図の切り替えスライダーの e2e（Stage 2・設計 §4.5・§5.2 B12/B13）。
//
// 確かめること:
//   - 幅 480px 以下で 1.4 枚・gap 10／481px 以上で 2 枚・gap 15（P1。実測）
//   - 幅 1280・375 で、矢印の実クリックが 1 枚ずつ巡回し、地図を変えない（D5）
//   - n=2〜6 の枚数で矢印が出て、巡回する（5 スロットの仮想循環）
//   - 1 枚（と 0 枚）のスライダーは枠を描かず、矢印を出さない（P3・S8）
//   - 遠い地図への移動・矢印の連打・遷移中のクリックでも、1 枚より大きく跳ばず、
//     transitionend が来る（M3。連続する中央のカードが隣どうしであることを記録して確かめる）
//   - 主スレッドが止まって遷移の開始と終わりの通知が遅れても、保険で早く確定して遷移を消さない
//     （積み残し「スライダーの連打の跳び」の再現。transitionend が 1 歩に 1 回来て、cancel は来ない）
//   - カードの実クリックで mapChanged と `.selected` が一致し、Enter でも変わる
//
// 地図の設定は `e2e/fixtures/element-baseline.html`（旧 UI の基準と同じ題名・ラベル・枚数）。
// 外部タイルは単色の PNG に差し替える（maplat-ui-element.pw.ts と同じ）。
//
// 実行（Playwright はエージェント実行禁止。人間が流す）:
//   PLAYWRIGHT_SKIP_BROWSER_GC=1 node_modules/.bin/playwright test \
//     --config playwright-element.config.ts --workers=1 \
//     e2e/element/maplat-ui-slider.pw.ts
import { test, expect, type Page } from "@playwright/test";

/* eslint-disable @typescript-eslint/no-explicit-any */

const TILE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAIAAADTED8xAAACD0lEQVR42u3TQQ0AIAwEwfqXUhU8EYGBftBQBOCgk8wZuGRjr4Sx4u3WgZkEgAAcgQBAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAAAhAAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACQABeQAAgABAACAAEAAIAAYAAQAAgABAACAAEAAIAAYAAQAAgABAACAAEAAIAAYAAQAAgABAACAAEAAIAAYAAQAAgABAACAAEAAIAAYAAQAAgABAACAAEAAIAAYAAQAAgAAQgAATgCAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAkAAAkAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACAAGAAEAAIAAQAAgABAACgJ8GcPkm8F11ptMAAAAASUVORK5CYII=",
  "base64"
);
const realTiles = process.env.MAPLAT_UI_REAL_TILES === "1";
const EXTERNAL_TILES =
  /t\.tilemap\.jp|cyberjapandata\.gsi\.go\.jp|tile\.openstreetmap\.org|api\.mapbox\.com|mt\d?\.google/;
const FIXTURE = "/e2e/fixtures/element-baseline.html";

const currentMap = (page: Page) =>
  page.evaluate(() => (window as any).__maplatUi.app.currentMapId as string);

async function openFixture(page: Page, query: string, width: number) {
  const errors: string[] = [];
  page.on("pageerror", err => errors.push(String(err.stack ?? err)));
  await page.setViewportSize({ width, height: 800 });
  if (!realTiles) {
    await page.route(EXTERNAL_TILES, route =>
      route.fulfill({ status: 200, contentType: "image/png", body: TILE_PNG })
    );
  }
  await page.goto(`${FIXTURE}?${query}`);
  await expect(page.locator("#status")).toHaveAttribute("data-state", "ready", {
    timeout: 90_000
  });
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            (window as any).__maplatUi?.shadowRoot?.querySelectorAll(
              '[part="map-slider"] [part~="map-slide"]'
            ).length ?? 0
        ),
      { timeout: 30_000 }
    )
    .toBeGreaterThan(0);
  return errors;
}

const slider = (page: Page, kind: "base" | "overlay") =>
  page.locator(`[part="map-slider"][data-kind="${kind}"]`);

/** スライダーの実測（P1）。CSS 変数と幅から perView を出す。 */
async function sliderMetrics(page: Page, kind: "base" | "overlay") {
  return page.evaluate(kind => {
    const root = (window as any).__maplatUi.shadowRoot;
    const el = root.querySelector(
      `[part="map-slider"][data-kind="${kind}"]`
    ) as HTMLElement;
    const style = getComputedStyle(el);
    const cardWidth = parseFloat(style.getPropertyValue("--map-slide-width"));
    const gap = parseFloat(style.getPropertyValue("--map-slide-gap"));
    return {
      perView: (el.clientWidth + gap) / (cardWidth + gap),
      cardWidth,
      gap,
      width: el.clientWidth
    };
  }, kind);
}

/**
 * `transitionend` のたびに「中央に来たカードの mapID」を記録する。
 * `transitionend` は `#commit` より先に配られるので、その時点の画面の中央が
 * 1 枚ぶん動いた先になる（M3 の跳びの検出）。
 */
async function watchCenters(page: Page, kind: "base" | "overlay") {
  await page.evaluate(kind => {
    const w = window as any;
    const root = w.__maplatUi.shadowRoot;
    const el = root.querySelector(
      `[part="map-slider"][data-kind="${kind}"]`
    ) as HTMLElement;
    const track = el.querySelector(".map-slider-track") as HTMLElement;
    const probe = {
      centers: [] as string[],
      ends: 0,
      // 落ちたときの手がかり: 遷移のイベントと確定（transition: none）の時刻と描かれている位置
      events: [] as { t: number; ev: string; x: number }[]
    };
    w.__probe = probe;
    w.__centers = probe.centers;
    w.__ends = 0;
    w.__events = probe.events;
    const t0 = performance.now();
    const xOf = () => {
      const v = getComputedStyle(track).transform;
      if (!v || v === "none") return 0;
      return Math.round(new DOMMatrixReadOnly(v).m41 * 10) / 10;
    };
    const note = (ev: string) => {
      try {
        probe.events.push({
          t: Math.round((performance.now() - t0) * 10) / 10,
          ev,
          x: xOf()
        });
      } catch {
        /* 記録だけ */
      }
    };
    for (const type of ["transitionrun", "transitionstart", "transitioncancel"])
      track.addEventListener(type, ev => {
        if ((ev as TransitionEvent).propertyName !== "transform") return;
        if (w.__probe !== probe) return;
        note(type);
      });
    if (!w.__transitionTrapped) {
      // 部品が `track.style.transition` を書く瞬間（確定＝"none"・動かし始め＝"transform …"）を横取りして記録する。
      // 記録に失敗しても部品の動きは変えない
      w.__transitionTrapped = true;
      Object.defineProperty(track.style, "transition", {
        configurable: true,
        get() {
          return (this as CSSStyleDeclaration).getPropertyValue("transition");
        },
        set(v: string) {
          try {
            const current = w.__probe;
            if (current?.events)
              current.events.push({
                t: Math.round((performance.now() - (current.t0 ?? 0)) * 10) / 10,
                ev: v === "none" ? "commit" : v === "" ? "reset" : "animate " + v,
                x: xOf()
              });
          } catch {
            /* 記録だけ */
          }
          if (v === "") (this as CSSStyleDeclaration).removeProperty("transition");
          else (this as CSSStyleDeclaration).setProperty("transition", v);
        }
      });
    }
    (probe as any).t0 = t0;
    const center = () => {
      const r = el.getBoundingClientRect();
      let best: HTMLElement | null = null;
      let distance = Infinity;
      for (const card of Array.from(
        el.querySelectorAll<HTMLElement>("[part~=map-slide]")
      )) {
        if (!card.dataset.mapId) continue;
        const b = card.getBoundingClientRect();
        const d = Math.abs(b.left + b.width / 2 - (r.left + r.width / 2));
        if (d < distance) {
          distance = d;
          best = card;
        }
      }
      return best?.dataset.mapId ?? "";
    };
    track.addEventListener("transitionend", ev => {
      if ((ev as TransitionEvent).propertyName !== "transform") return;
      if (w.__probe !== probe) return;
      probe.ends++;
      w.__ends = probe.ends;
      probe.centers.push(center());
      note("transitionend");
    });
  }, kind);
}

const centers = (page: Page) => page.evaluate(() => (window as any).__centers);
const ends = (page: Page) => page.evaluate(() => (window as any).__ends);
/** `transitionend` の数を待つ。足りなければ、記録した遷移のイベントを失敗の文言に入れる（落ちたときの手がかり） */
async function expectEnds(page: Page, expected: number, timeout = 30_000) {
  try {
    await expect.poll(() => ends(page), { timeout }).toBe(expected);
  } catch (err) {
    const events = await page.evaluate(() => (window as any).__events);
    throw new Error(
      `transitionend: expected ${expected}, received ${await ends(page)}\n` +
        `events: ${JSON.stringify(events)}\n` +
        String((err as Error).message)
    );
  }
}

test("幅 480/481 で 1.4 枚・2 枚（P1）と、1 枚のスライダー（P3・S8）", async ({
  page
}) => {
  test.setTimeout(240_000);
  const errors480 = await openFixture(page, "base=3&overlay=3", 480);
  const m480 = await sliderMetrics(page, "overlay");
  expect(m480.perView).toBeCloseTo(1.4, 1);
  expect(m480.gap).toBe(10);
  expect(m480.width).toBeCloseTo(168, 0);

  await page.setViewportSize({ width: 481, height: 800 });
  await page.reload();
  await expect(page.locator("#status")).toHaveAttribute("data-state", "ready", {
    timeout: 90_000
  });
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            (window as any).__maplatUi?.shadowRoot?.querySelectorAll(
              '[part="map-slider"] [part~="map-slide"]'
            ).length ?? 0
        ),
      { timeout: 30_000 }
    )
    .toBeGreaterThan(0);
  const m481 = await sliderMetrics(page, "overlay");
  expect(m481.perView).toBeCloseTo(2, 1);
  expect(m481.gap).toBe(15);
  expect(m481.width).toBeCloseTo(168.35, 0);

  // 1 枚ずつ: 枠を描かず（single-map）、矢印を出さない
  const errors1 = await openFixture(page, "base=1&overlay=1", 1280);
  for (const kind of ["base", "overlay"] as const) {
    await expect(slider(page, kind)).toHaveClass(/single-map/);
    await expect(
      slider(page, kind).locator('[part="map-slider-prev"]')
    ).toBeHidden();
    await expect(
      slider(page, kind).locator('[part="map-slider-next"]')
    ).toBeHidden();
  }
  expect([...errors480, ...errors1], "page errors").toEqual([]);
});

test("矢印の実クリックは 1 枚ずつ巡回し、地図を変えない（幅 1280・375・n=2〜6）", async ({
  page
}) => {
  test.setTimeout(300_000);
  const errors = await openFixture(page, "base=3&overlay=6", 1280);
  await watchCenters(page, "overlay");
  const start = await currentMap(page);
  // 矢印を 3 回押す: 1 枚ずつ動く（中央のカードが隣どうし）。地図は変えない
  for (let i = 0; i < 3; i++)
    await slider(page, "overlay").locator('[part="map-slider-next"]').click();
  await expectEnds(page, 3, 20_000);
  expect(await centers(page)).toHaveLength(3);
  expect(await currentMap(page)).toBe(start);
  const order = await page.evaluate(() =>
    (window as any).__maplatUi.app
      .listMaps()
      .filter((m: any) => !m.isBasemap)
      .map((m: any) => m.mapID)
  );
  const visited = await centers(page);
  for (let i = 1; i < visited.length; i++) {
    const prev = order.indexOf(visited[i - 1]);
    const next = order.indexOf(visited[i]);
    expect(
      Math.min(Math.abs(next - prev), order.length - Math.abs(next - prev)),
      `arrow click ${i}: ${visited[i - 1]} -> ${visited[i]}`
    ).toBe(1);
  }
  expect(await currentMap(page)).toBe(start);

  // 幅 375 でも同じ（カードは 1.4 枚）
  await page.setViewportSize({ width: 375, height: 800 });
  await page.reload();
  await expect(page.locator("#status")).toHaveAttribute("data-state", "ready", {
    timeout: 90_000
  });
  await watchCenters(page, "overlay");
  const start375 = await currentMap(page);
  for (let i = 0; i < 2; i++)
    await slider(page, "overlay").locator('[part="map-slider-next"]').click();
  await expectEnds(page, 2, 20_000);
  expect(await currentMap(page)).toBe(start375);
  expect((await sliderMetrics(page, "overlay")).perView).toBeCloseTo(1.4, 1);

  // n=2〜6: どの枚数でも矢印が出て、1 回で隣へ動く（地図は変わらない）
  for (const n of [2, 3, 4, 5, 6]) {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${FIXTURE}?base=3&overlay=${n}`);
    await expect(page.locator("#status")).toHaveAttribute(
      "data-state",
      "ready",
      { timeout: 90_000 }
    );
    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              (window as any).__maplatUi?.shadowRoot?.querySelectorAll(
                '[part="map-slider"][data-kind="overlay"] [part~="map-slide"]'
              ).length ?? 0
          ),
        { timeout: 30_000 }
      )
      .toBeGreaterThan(0);
    await expect(
      slider(page, "overlay").locator('[part="map-slider-next"]')
    ).toBeVisible();
    if (n > 1) {
      await watchCenters(page, "overlay");
      const before = await currentMap(page);
      await slider(page, "overlay").locator('[part="map-slider-next"]').click();
      await expectEnds(page, 1, 20_000);
      expect(await currentMap(page)).toBe(before);
    }
  }
  expect(errors, errors.join("\n")).toEqual([]);
});

test("カードの実クリックと Enter で地図が変わり、mapChanged と .selected が一致する", async ({
  page
}) => {
  test.setTimeout(240_000);
  const errors = await openFixture(page, "base=3&overlay=3", 1280);
  await page.evaluate(() => {
    const w = window as any;
    w.__mapChanged = [];
    w.__maplatUi.addEventListener("mapChanged", (ev: CustomEvent) =>
      w.__mapChanged.push(ev.detail.mapID)
    );
  });
  const overlay = slider(page, "overlay");
  // 起動時は今の地図（tatebayashi_ojozu）が選ばれている
  await expect(
    overlay
      .locator('[part~="map-slide"][data-map-id="tatebayashi_ojozu"]')
      .first()
  ).toHaveClass(/selected/);
  // ←/→ では地図は変わらない（中央の読み上げが次の地図になるだけ）
  await overlay.focus();
  const start = await currentMap(page);
  await page.keyboard.press("ArrowRight");
  await expect(overlay.locator(".map-slider-live")).toHaveText("カード・B");
  expect(await currentMap(page)).toBe(start);
  // Enter は中央のカードを選ぶ
  await page.keyboard.press("Enter");
  await expect
    .poll(() => currentMap(page), { timeout: 20_000 })
    .toBe("tatebayashi_castle_akimoto");
  let changed = await page.evaluate(() => (window as any).__mapChanged);
  expect(changed.at(-1)).toBe("tatebayashi_castle_akimoto");
  await expect(
    overlay
      .locator('[part~="map-slide"][data-map-id="tatebayashi_castle_akimoto"]')
      .first()
  ).toHaveClass(/selected/);

  // 背景の地図のカードを実クリック
  const base = slider(page, "base");
  await base.locator('[part~="map-slide"][data-map-id="osm"]').first().click();
  await expect.poll(() => currentMap(page), { timeout: 20_000 }).toBe("osm");
  changed = await page.evaluate(() => (window as any).__mapChanged);
  expect(changed.at(-1)).toBe("osm");
  await expect(
    base.locator('[part~="map-slide"][data-map-id="osm"]').first()
  ).toHaveClass(/selected/);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("遠い地図・矢印の連打・遷移中のクリックでも 1 枚より大きく跳ばず、transitionend が来る（M3）", async ({
  page
}) => {
  test.setTimeout(240_000);
  const errors = await openFixture(page, "base=3&overlay=6", 1280);
  const order = await page.evaluate(() =>
    (window as any).__maplatUi.app
      .listMaps()
      .filter((m: any) => !m.isBasemap)
      .map((m: any) => m.mapID)
  );
  const adjacent = (a: string, b: string) => {
    const prev = order.indexOf(a);
    const next = order.indexOf(b);
    return (
      Math.min(Math.abs(next - prev), order.length - Math.abs(next - prev)) ===
      1
    );
  };
  const assertNoJump = (visited: string[], label: string) => {
    expect(visited.length, `${label}: transitionend count`).toBeGreaterThan(0);
    for (let i = 1; i < visited.length; i++) {
      expect(
        adjacent(visited[i - 1], visited[i]),
        `${label}: ${visited[i - 1]} -> ${visited[i]}`
      ).toBe(true);
    }
  };

  // 遠い地図へ（別の古地図へ changeMap する）。中央は 1 枚ずつ動く
  await watchCenters(page, "overlay");
  await page.evaluate(() =>
    (window as any).__maplatUi.app.changeMap("tatebayashi_rekishinokomichi_1")
  );
  await expect
    .poll(() => currentMap(page), { timeout: 30_000 })
    .toBe("tatebayashi_rekishinokomichi_1");
  await expect
    .poll(
      async () => {
        const visited = await centers(page);
        return visited.at(-1) === "tatebayashi_rekishinokomichi_1";
      },
      { timeout: 30_000 }
    )
    .toBe(true);
  assertNoJump(await centers(page), "far");

  // 矢印の連打（3 回）。キューが積まれ、1 枚ずつ動く
  await watchCenters(page, "overlay");
  const before = await currentMap(page);
  for (let i = 0; i < 3; i++)
    await slider(page, "overlay").locator('[part="map-slider-next"]').click();
  await expectEnds(page, 3);
  assertNoJump(await centers(page), "rapid arrows");
  expect(await currentMap(page)).toBe(before);

  // 遷移中のクリック: 矢印で動かしている最中に、矢印をもう 1 回押す
  await watchCenters(page, "overlay");
  await slider(page, "overlay").locator('[part="map-slider-next"]').click();
  await page.waitForTimeout(60);
  await slider(page, "overlay").locator('[part="map-slider-next"]').click();
  await expectEnds(page, 2);
  assertNoJump(await centers(page), "during transition");
  expect(await currentMap(page)).toBe(before);

  // 遷移中に**カード**を押す（レビュー Minor）: 矢印で動かしている最中に、覗いているカードを
  // 実クリックする。押したカードの地図に切り替わり、中央もそこへ着き、途中で 1 枚より大きく跳ばない
  await watchCenters(page, "overlay");
  await page.evaluate(() => {
    const w = window as any;
    w.__pressed = null;
    const el = w.__maplatUi.shadowRoot.querySelector(
      '[part="map-slider"][data-kind="overlay"]'
    ) as HTMLElement;
    el.addEventListener(
      "click",
      ev => {
        const card = (ev.composedPath() as any[]).find(
          n => n?.dataset?.mapId
        ) as HTMLElement | undefined;
        if (card) w.__pressed = card.dataset.mapId;
      },
      { capture: true }
    );
  });
  const box = (await slider(page, "overlay").boundingBox())!;
  await slider(page, "overlay").locator('[part="map-slider-next"]').click();
  await page.waitForTimeout(60);
  // 左に覗いているカード（prev の矢印の右。幅 1280 は 2 枚で、中央のカードは x 60〜164・左は 〜45）。
  // 矢印で右へ送っている最中に、逆向きのカードを押す（今の地図は中央へ向かうカードなので、別の地図になる）
  await page.mouse.click(box.x + 35, box.y + 20);
  const pressed = await page.evaluate(() => (window as any).__pressed);
  expect(pressed, "a card was pressed").toBeTruthy();
  expect(pressed).not.toBe(before);
  await expect.poll(() => currentMap(page), { timeout: 30_000 }).toBe(pressed);
  await expect
    .poll(async () => (await centers(page)).at(-1), { timeout: 30_000 })
    .toBe(pressed);
  expect(await ends(page)).toBeGreaterThanOrEqual(2);
  assertNoJump(await centers(page), "card during transition");
  expect(errors, errors.join("\n")).toEqual([]);
});

/**
 * 主スレッドを止める仕掛け（積み残し「スライダーの連打の跳び」の再現）。
 *
 * 矢印の `click` の後（部品のリスナーの後に登録するので、1 歩の transform を書いた直後）に
 * `stallStartMs` 止める。遷移はスタイルが解決されるまで始まらないので、**開始がそのぶん遅れる**
 * （1 回目の保険の時間 250+120ms より長く止めると、保険は「まだ着いていない」を見る）。
 * 続けて、遅れて始まった遷移が終わる頃をまたいで `stallEndMs` 止める＝**終わりの通知（transitionend）が
 * 遅れる**。直す前の部品は、ここで固定の時間（1 回分＋余裕×2＝約 860ms）で確定して `transition: none`
 * を書くので、遷移が消されて `transitioncancel` だけが来た（transitionend が 1 つ足りない）。
 */
async function installStall(
  page: Page,
  kind: "base" | "overlay",
  stall: { startMs: number; endMs: number; endDelayMs: number }
) {
  await page.evaluate(
    ({ kind, stall }) => {
      const w = window as any;
      const root = w.__maplatUi.shadowRoot;
      const el = root.querySelector(
        `[part="map-slider"][data-kind="${kind}"]`
      ) as HTMLElement;
      const next = el.querySelector('[part="map-slider-next"]') as HTMLElement;
      const track = el.querySelector(".map-slider-track") as HTMLElement;
      const busy = (ms: number) => {
        const t0 = performance.now();
        while (performance.now() - t0 < ms) {
          /* 主スレッドを止める */
        }
      };
      w.__cancels = 0;
      w.__stalls = 0;
      track.addEventListener("transitioncancel", ev => {
        if ((ev as TransitionEvent).propertyName === "transform") w.__cancels++;
      });
      if (w.__stallHandler) next.removeEventListener("click", w.__stallHandler);
      w.__stallHandler = () => {
        w.__stalls++;
        busy(stall.startMs);
        window.setTimeout(() => busy(stall.endMs), stall.endDelayMs);
      };
      next.addEventListener("click", w.__stallHandler);
    },
    { kind, stall }
  );
}

test("主スレッドが止まって遷移の開始と終わりの通知が遅れても、1 歩ごとに transitionend で確定し、遷移を消さない（連打の跳び）", async ({
  page
}) => {
  test.setTimeout(240_000);
  const errors = await openFixture(page, "base=3&overlay=6", 1280);
  const order = await page.evaluate(() =>
    (window as any).__maplatUi.app
      .listMaps()
      .filter((m: any) => !m.isBasemap)
      .map((m: any) => m.mapID)
  );
  const adjacent = (a: string, b: string) => {
    const prev = order.indexOf(a);
    const next = order.indexOf(b);
    return (
      Math.min(Math.abs(next - prev), order.length - Math.abs(next - prev)) ===
      1
    );
  };
  // 開始の遅れ 450ms（1 回目の保険 370ms より長い）・終わりの通知の遅れ 520ms（遅れて始まった遷移
  // 450〜700ms の終わりをまたぎ、直す前の最後の保険 450+490=940ms より後まで止める）
  const stall = { startMs: 450, endMs: 520, endDelayMs: 10 };

  // 1 回: transitionend が 1 回、cancel は 0
  await watchCenters(page, "overlay");
  await installStall(page, "overlay", stall);
  const before = await currentMap(page);
  await slider(page, "overlay").locator('[part="map-slider-next"]').click();
  await expectEnds(page, 1);
  // 確定（commit）まで待ってから数える（最後の保険が遅れて走る余地を残さない）
  await page.waitForTimeout(1500);
  expect(await ends(page), "single step: transitionend").toBe(1);
  expect(
    await page.evaluate(() => (window as any).__cancels),
    "single step: transitioncancel"
  ).toBe(0);
  expect(await page.evaluate(() => (window as any).__stalls)).toBe(1);

  // 連打 3 回（毎回止める）: transitionend が 3 回、1 枚ずつ、cancel は 0
  await watchCenters(page, "overlay");
  await installStall(page, "overlay", stall);
  for (let i = 0; i < 3; i++)
    await slider(page, "overlay").locator('[part="map-slider-next"]').click();
  await expectEnds(page, 3);
  await page.waitForTimeout(1500);
  expect(await ends(page), "rapid: transitionend").toBe(3);
  expect(
    await page.evaluate(() => (window as any).__cancels),
    "rapid: transitioncancel"
  ).toBe(0);
  const visited = await centers(page);
  expect(visited).toHaveLength(3);
  for (let i = 1; i < visited.length; i++)
    expect(
      adjacent(visited[i - 1], visited[i]),
      `rapid: ${visited[i - 1]} -> ${visited[i]}`
    ).toBe(true);
  expect(await currentMap(page)).toBe(before);
  expect(errors, errors.join("\n")).toEqual([]);
});
