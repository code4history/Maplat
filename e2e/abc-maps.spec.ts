// 変換の形 A・B・C（と比較の相手の V2）の地図が、今の地図（V2）と同じに使えることの e2e（実ブラウザ）。
// MaplatUi#339（1 月トレイン J5）。
//
//   A: CRS＋world file だけ（三角網なし）
//   B: CRS＋三角網。四辺形の外は world file（大域外挿）
//   C: CRS＋三角網。四辺形の外は扇形（扇形外挿）
//   V2: 従来型（3857 固定＋三角網）。同じ試験が通ることで「今の地図と同じ」を示す
//
// 方針:
//   - 変換は Core の中に閉じているので、UI の DOM・class は読まない。`window.__maplatApp`（Core）の
//     公開面だけを見る（地図の切り替え・視点・GPS・POI の層）。
//   - 期待値は **手で書いた数値を使わず**、Core の変換（`from.xy2MercAsync`・`xy2SysCoord`・
//     `merc2SysCoordAsync`・`merc2XyAsync`）を試験の側から直接呼んだ結果にする。入力の座標は
//     すべて fixture の地図 JSON の GCP・頂点・紙の寸法から作る（fixture 側の `window.__abc`）。
//   - 地図データ・タイルは e2e/fixtures/ の小さな写しで、CDN には取りに行かない（オフライン前提）。
//
// 実行（dev サーバーは playwright.config.ts の webServer が立てる。headless なので手元のフォーカスを奪わない）:
//   PLAYWRIGHT_SKIP_BROWSER_GC=1 node_modules/.bin/playwright test e2e/abc-maps.spec.ts
//
// 注意: 変換の形 A・B・C は Core の未公開版（MaplatCore#201）が要る。それより前の Core では
//   abc_a・abc_b・abc_c の読み込みで失敗する。
/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, type Page } from "@playwright/test";

const FIXTURE = "/e2e/fixtures/abc-maps.html";
const MAP_IDS = ["abc_a", "abc_b", "abc_c", "abc_v2"] as const;
type MapId = (typeof MAP_IDS)[number];

/** 擬似の現在地（fixture の POI 1 と同じ点）。 */
const GEO_START = { longitude: 136.792, latitude: 35.998, accuracy: 50 };

/** メルカトルの m 単位の許容（実測は 1 mm 未満でも通る。数値の丸めだけを見込んだ幅）。 */
const MERC_TOLERANCE_M = 0.01;
/** 前面の座標（sysCoord・m）の許容。 */
const SYS_TOLERANCE_M = 0.01;
/** 往復（xy → merc → xy）の画素の許容。 */
const ROUNDTRIP_PX = 0.01;

/**
 * 擬似の現在地。`navigator.geolocation` を差し替え、`window.__fakeGeo.set(経度, 緯度)` で位置を動かせるようにする。
 * Playwright の `context.setGeolocation` は、起動後に位置を動かすと Chromium が位置取得エラー（code 2）を
 * 返して追従しないため使わない（V2 でも同じで、変換の形とは無関係）。
 */
function installFakeGeolocation(start: { longitude: number; latitude: number; accuracy: number }): string {
  return `(() => {
    let cur = ${JSON.stringify(start)};
    let seq = 0;
    const watchers = new Map();
    const make = () => ({
      coords: {
        longitude: cur.longitude, latitude: cur.latitude, accuracy: cur.accuracy,
        altitude: null, altitudeAccuracy: null, heading: null, speed: null
      },
      timestamp: Date.now()
    });
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition(ok) { setTimeout(() => ok(make()), 0); },
        watchPosition(ok) { const id = ++seq; watchers.set(id, ok); setTimeout(() => ok(make()), 0); return id; },
        clearWatch(id) { watchers.delete(id); }
      }
    });
    window.__fakeGeo = {
      set(longitude, latitude, accuracy = 50) {
        cur = { longitude, latitude, accuracy };
        for (const ok of watchers.values()) ok(make());
      }
    };
  })();`;
}

type Opened = { errors: string[] };

/** fixture を開き、`createObject` が解決する（`#status` が READY）まで待つ。 */
async function open(page: Page): Promise<Opened> {
  await page.addInitScript(installFakeGeolocation(GEO_START));
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(String(e.message ?? e)));
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(FIXTURE);
  await page.waitForFunction(
    () => {
      const status = document.getElementById("status")?.textContent || "";
      return status === "READY" || status.startsWith("ERROR");
    },
    null,
    { timeout: 120000 }
  );
  expect(await page.textContent("#status"), "createObject が解決して READY になる").toBe("READY");
  // 起動直後の地図（startFrom の abc_a）が前面に付くのを待つ（READY の直後は `app.from` が未設定のことがある）
  await page.waitForFunction(() => (window as any).__maplatApp?.from?.mapID === "abc_a", null, {
    timeout: 60000
  });
  return { errors };
}

/** 地図を切り替え、切り替えが済んだ（`app.from` が差し替わった）ことを確かめて返す。 */
async function changeMap(page: Page, id: MapId): Promise<void> {
  await page.evaluate(async mapId => {
    const app = (window as any).__maplatApp;
    await app.changeMap(mapId);
    // 切り替え後の描画（postrender で背景の地図が追従する）を 1 回通す
    app.mapObject.updateSize();
    app.mapObject.render();
  }, id);
  expect(await page.evaluate(() => (window as any).__maplatApp.from.mapID)).toBe(id);
}

type Pt = [number, number];
const dist = (a: number[], b: number[]) => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!);

test.describe("変換の形 A・B・C と V2", () => {
  test("fixture の地図が、それぞれの形で書かれている（試験が形を踏んでいる前提）", async ({ page }) => {
    await open(page);
    const forms = await page.evaluate(() => (window as any).__abc.forms);
    // A: 三角網なし・world file のみ・compiled なし
    expect(forms.abc_a).toEqual({ tinEnabledFalse: true, worldFile: true, noCompiled: true });
    // B: 大域外挿（outerTransform が world file 系）・扇形の頂点パラメータなし
    expect(forms.abc_b.noVerticesParams).toBe(true);
    expect(forms.abc_b.outerTransform).toBeTruthy();
    // C: 扇形外挿（頂点パラメータあり）
    expect(forms.abc_c.verticesParams).toBe(true);
    // V2: CRS を持たない従来型
    expect(forms.abc_v2).toEqual({ noCrs: true, hasCompiled: true });
  });

  test("A・B・C・V2 を続けて切り替えられる（往復も）", async ({ page }) => {
    const { errors } = await open(page);
    const order: MapId[] = ["abc_a", "abc_b", "abc_c", "abc_v2", "abc_a", "abc_c", "abc_b", "abc_v2"];
    for (const id of order) {
      await changeMap(page, id);
      const state = await page.evaluate(() => {
        const app = (window as any).__maplatApp;
        const center = app.mapObject.getView().getCenter();
        return {
          mapID: app.from.mapID,
          center,
          hasBack: !!app.backMap
        };
      });
      expect(state.mapID).toBe(id);
      expect(state.hasBack, "背景の地図が付いている").toBe(true);
      expect(state.center.every((v: number) => Number.isFinite(v)), "視点の中心が有限").toBe(true);
    }
    expect(errors, "切り替え中に pageerror が出ない").toEqual([]);
  });

  for (const id of MAP_IDS) {
    test.describe(id, () => {
      test("視点の同期: 古地図の中心を動かすと、背景の地図の中心が Core の変換の位置に来る", async ({ page }) => {
        const { errors } = await open(page);
        await changeMap(page, id);

        const result = await page.evaluate(
          async ({ mapId }) => {
            const app = (window as any).__maplatApp;
            const abc = (window as any).__abc;
            const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
            const samples = [...abc.samplePx[mapId], ...abc.cornerPx[mapId]] as Pt[];
            const rows: any[] = [];
            for (const px of samples) {
              // 期待値: Core の変換を直接呼ぶ（紙の画素 → 3857）
              const expectedMerc = await app.from.xy2MercAsync(px);
              // 古地図の中心を紙の画素 px に動かす（setViewpoint の x・y は前面の座標 sysCoord）
              const sys = app.from.xy2SysCoord(px);
              let evMerc: number[] | null = null;
              const handler = (e: any) => {
                evMerc = [e.detail.mercator_x, e.detail.mercator_y];
              };
              app.addEventListener("changeViewpoint", handler);
              app.setViewpoint({ x: sys[0], y: sys[1], zoom: 3 });
              // 背景の地図の中心が収束するまで描画を促しながら待つ
              let backCenter: number[] = [NaN, NaN];
              for (let i = 0; i < 40; i++) {
                app.mapObject.render();
                await sleep(100);
                backCenter = app.backMap.getView().getCenter();
                const dx = backCenter[0] - expectedMerc[0];
                const dy = backCenter[1] - expectedMerc[1];
                if (Math.hypot(dx, dy) < 0.01 && evMerc) break;
              }
              app.removeEventListener("changeViewpoint", handler);
              rows.push({
                px,
                expectedMerc,
                backCenter,
                evMerc,
                frontCenter: app.mapObject.getView().getCenter(),
                sys
              });
            }
            return rows;
          },
          { mapId: id }
        );

        expect(result.length).toBeGreaterThanOrEqual(7);
        for (const row of result) {
          const label = `${id} px=${JSON.stringify(row.px)}`;
          // 前面の中心は指定どおり
          expect(dist(row.frontCenter, row.sys), `${label}: 前面の中心`).toBeLessThan(SYS_TOLERANCE_M);
          // 背景の地図の中心が Core の xy2Merc の位置
          expect(dist(row.backCenter, row.expectedMerc), `${label}: 背景の中心`).toBeLessThan(MERC_TOLERANCE_M);
          // changeViewpoint イベントが出す 3857 の中心も同じ
          expect(row.evMerc, `${label}: changeViewpoint が出た`).not.toBeNull();
          expect(dist(row.evMerc, row.expectedMerc), `${label}: イベントの 3857`).toBeLessThan(MERC_TOLERANCE_M);
        }
        expect(errors).toEqual([]);
      });

      test("往復: 紙の画素 → 3857 → 紙の画素が戻る（紙の外側の四隅を含む）", async ({ page }) => {
        await open(page);
        await changeMap(page, id);
        const rows = await page.evaluate(
          async ({ mapId }) => {
            const app = (window as any).__maplatApp;
            const abc = (window as any).__abc;
            const out: any[] = [];
            for (const px of [...abc.samplePx[mapId], ...abc.cornerPx[mapId]] as Pt[]) {
              const merc = await app.from.xy2MercAsync(px);
              const back = await app.from.merc2XyAsync(merc);
              out.push({ px, merc, back });
            }
            return out;
          },
          { mapId: id }
        );
        for (const row of rows) {
          expect(
            row.merc.every((v: number) => Number.isFinite(v)),
            `${id} px=${JSON.stringify(row.px)}: 3857 が有限`
          ).toBe(true);
          expect(dist(row.back, row.px), `${id} px=${JSON.stringify(row.px)}: 往復`).toBeLessThan(ROUNDTRIP_PX);
        }
      });

      test("GPS: 擬似の現在地を入れると、古地図の上の位置が Core の変換どおりになり、現在地を変えると追従する", async ({
        page
      }) => {
        const { errors } = await open(page);
        await changeMap(page, id);

        const gpsPoint = async () =>
          page.evaluate(() => {
            const app = (window as any).__maplatApp;
            const src = app.mapObject.getSource("gps");
            const feats = src ? src.getFeatures() : [];
            const point = feats.find((f: any) => f.getGeometry()?.getType() === "Point");
            return point ? (point.getGeometry().getCoordinates() as number[]) : null;
          });
        const expectedFor = (lngLat: number[]) =>
          page.evaluate(
            async ({ ll }) => {
              const app = (window as any).__maplatApp;
              const abc = (window as any).__abc;
              const merc = abc.mercOf(ll);
              return {
                sys: await app.from.merc2SysCoordAsync(merc),
                xy: await app.from.merc2XyAsync(merc),
                wh: abc.paperWh[app.from.mapID]
              };
            },
            { ll: lngLat }
          );

        // 現在地 1（fixture の POI 1 と同じ点）
        await page.evaluate(() => (window as any).__maplatApp.handleGPS(true));
        await expect.poll(gpsPoint, { timeout: 15000 }).not.toBeNull();
        const first = await expectedFor([GEO_START.longitude, GEO_START.latitude]);
        const got1 = (await gpsPoint())!;
        expect(dist(got1, first.sys), `${id}: GPS 現在地 1 の前面座標`).toBeLessThan(SYS_TOLERANCE_M);
        // 重心に近い点なので、紙の内側に来る
        expect(first.xy[0]).toBeGreaterThan(0);
        expect(first.xy[0]).toBeLessThan(first.wh[0]);
        expect(first.xy[1]).toBeGreaterThan(0);
        expect(first.xy[1]).toBeLessThan(first.wh[1]);

        // 現在地を別の点（fixture の POI 2）へ動かす → GPS の印も追従する
        const poi2 = await page.evaluate(() => (window as any).__abc.poiLngLats[1] as number[]);
        await page.evaluate(([lon, lat]) => (window as any).__fakeGeo.set(lon, lat), poi2);
        const second = await expectedFor(poi2);
        await expect
          .poll(async () => {
            const g = await gpsPoint();
            return g ? dist(g, second.sys) : Infinity;
          }, { timeout: 15000, message: `${id}: GPS の印が現在地 2 へ追従する` })
          .toBeLessThan(SYS_TOLERANCE_M);

        // GPS を入れたまま別の地図へ切り替えても、その地図の変換で位置が決まる
        const other: MapId = id === "abc_a" ? "abc_b" : "abc_a";
        await changeMap(page, other);
        const third = await expectedFor(poi2);
        await expect
          .poll(async () => {
            const g = await gpsPoint();
            return g ? dist(g, third.sys) : Infinity;
          }, { timeout: 15000, message: `${id} → ${other}: 切り替え後の GPS の印` })
          .toBeLessThan(SYS_TOLERANCE_M);
        expect(errors).toEqual([]);
      });

      test("POI: 地図の上の位置が Core の変換どおり。ほかの地図から切り替えても同じ", async ({ page }) => {
        const { errors } = await open(page);

        const markers = () =>
          page.evaluate(() => {
            const app = (window as any).__maplatApp;
            const src = app.mapObject.getSource("marker");
            const back = app.backMap?.getSource("marker");
            return {
              front: (src ? src.getFeatures() : []).map((f: any) => ({
                id: f.get("datum")?.id as string,
                g: f.getGeometry().getCoordinates() as number[]
              })),
              backCount: back ? back.getFeatures().length : 0
            };
          });
        const expected = () =>
          page.evaluate(async () => {
            const app = (window as any).__maplatApp;
            const abc = (window as any).__abc;
            const wh = abc.paperWh[app.from.mapID];
            const rows: any[] = [];
            for (let i = 0; i < abc.poiLngLats.length; i++) {
              const merc = abc.mercOf(abc.poiLngLats[i]);
              rows.push({
                id: `abc_poi_${i + 1}`,
                sys: await app.from.merc2SysCoordAsync(merc),
                xy: await app.from.merc2XyAsync(merc),
                wh
              });
            }
            return rows;
          });

        // 別の地図から切り替えて来た状態で確かめる（切り替えで POI の位置が取り直される）
        const other: MapId = id === "abc_a" ? "abc_b" : "abc_a";
        await changeMap(page, other);
        await changeMap(page, id);

        const exp = await expected();
        expect(exp.length).toBe(3);
        await expect
          .poll(async () => (await markers()).front.length, { timeout: 15000, message: `${id}: POI が前面に立つ` })
          .toBe(exp.length);
        const got = await markers();
        expect(got.backCount, `${id}: 紙の内側の POI は背面に立たない`).toBe(0);
        for (const e of exp) {
          const m = got.front.find((f: any) => f.id === e.id);
          expect(m, `${id}: ${e.id} が前面にある`).toBeTruthy();
          expect(dist(m!.g, e.sys), `${id}: ${e.id} の前面座標`).toBeLessThan(SYS_TOLERANCE_M);
          expect(e.xy[0], `${id}: ${e.id} は紙の内側（x）`).toBeGreaterThan(0);
          expect(e.xy[0]).toBeLessThan(e.wh[0]);
          expect(e.xy[1], `${id}: ${e.id} は紙の内側（y）`).toBeGreaterThan(0);
          expect(e.xy[1]).toBeLessThan(e.wh[1]);
        }
        expect(errors).toEqual([]);
      });
    });
  }

  test("B と C は紙の内側（三角網の中）で同じ位置になり、外側（四隅）は外挿の違いが出る", async ({ page }) => {
    // B と C は同じ三角網で、外挿だけが違う。fixture が両方の外挿を実際に踏んでいる（取り違えていない）ことの確認。
    await open(page);
    const res = await page.evaluate(async () => {
      const app = (window as any).__maplatApp;
      const abc = (window as any).__abc;
      const out: any = { inside: [], corners: [] };
      for (const id of ["abc_b", "abc_c"]) {
        await app.changeMap(id);
        const inside: number[][] = [];
        for (const px of abc.samplePx[id] as number[][]) inside.push(await app.from.xy2MercAsync(px));
        const corners: number[][] = [];
        for (const px of abc.cornerPx[id] as number[][]) corners.push(await app.from.xy2MercAsync(px));
        out.inside.push(inside);
        out.corners.push(corners);
      }
      return out;
    });
    const [insideB, insideC] = res.inside as number[][][];
    const [cornersB, cornersC] = res.corners as number[][][];
    insideB!.forEach((m, i) => {
      expect(dist(m, insideC![i]!), `内側の点 ${i}`).toBeLessThan(MERC_TOLERANCE_M);
    });
    const maxCornerGap = Math.max(...cornersB!.map((m, i) => dist(m, cornersC![i]!)));
    expect(maxCornerGap, "四隅のどれかで B（大域外挿）と C（扇形外挿）が違う").toBeGreaterThan(MERC_TOLERANCE_M);
  });
});
