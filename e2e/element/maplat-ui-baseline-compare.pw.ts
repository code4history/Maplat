// `<maplat-ui>` の見た目を、旧 UI の基準（`spec/fixtures/legacy-baseline/*.json`）と比べる e2e（Stage 2）。
//
// 基準は `e2e/fixtures/legacy-api.html?buttons=1&base=3&overlay=3` を旧 UI（`MaplatUi`）で開いて
// 採ったもの（採取スクリプト `e2e/legacy-baseline-capture.spec.ts` は、旧 UI の実装を消したあとは旧の画面を開けず
// 凍結した基準を新 UI の値で上書きしうるので消した。基準 JSON は凍結のまま読むだけ）。このファイルは、同じ地図の設定・同じ題名・
// 同じ枚数・同じボタンを `<maplat-ui>`（`e2e/fixtures/element-baseline.html`）で開いて、
// 「同じはずのもの」が ±1px（計算値は文字列。委任の基準）で一致することを確かめる。
//
// **意図して違うもの（比較から外すもの）とその理由**:
//   1. P1（人間の決定。幅 480px 以下で 1.4 枚・gap 10／481px 以上で 2 枚・gap 15。v4 時代の見た目に戻す）:
//      旧 Swiper は逆（480px 以上で 1.4 枚／未満で 2 枚）なので、1280・640・481 は旧 1.4 枚 → 新 2 枚、
//      375・320 は旧 2 枚 → 新 1.4 枚になる。カードの幅・横位置・見えている枚数と、カードの幅で決まる
//      見出しの縮小（`minimize`）・省略・行数は、これらの幅では比べない。代わりに perView・gap を
//      `expectedPerViewByP1` と比べ、幅に依らないもの（中央の地図・カードの縦の位置と高さ・計算値・
//      見出しの色・サムネイルの大きさと縦の位置）は比べる。480 は旧も新も 1.4 枚なので全部比べる。
//   2. P3（人間の決定）: 地図が 1 枚しかないスライダーは枠（背景）を描かない（旧は描く）。位置と幅は
//      旧と同じで左右の釣り合いを保つ。位置と大きさは下の「P3: 地図が 1 枚のスライダーの位置」で
//      **基準 JSON**（`{width}.json` の `base-slider`・`overlay-slider`）と比べ（旧も容器の寸法は地図の
//      枚数に依らない）、枠（背景）と矢印が無いことだけを新の値として確かめる。
//   2'. 選択表示の枚数: 旧は Swiper の loop の複製を含む（overlay 2・base 0）。新は 5 スロットなので、
//      枚数ではなく「選ばれている地図」を比べる。
//   3. マーカー一覧のボタン（Stage 1 からの差。報告 §3-7）: `<maplat-ui>` は POI が 0 件のとき隠す
//      （旧 UI は出す）。右列の他のボタンは下（地図情報）から積むので、隠れても位置は動かない。
//      ここでは「隠れていること」だけを確かめる。
//   4. サムネイルが無い地図: 旧は `no_image.png`、新は頭文字のプレースホルダ（要素の `#thumbPlaceholder` を
//      使うと決めた結果。読めなかった画像も頭文字に替える）。この画面の地図はサムネイルを持つので出ない。
//   5. POI が 0 件のとき: 旧は `poi_number` で `.no_poi` が付くとマーカー非表示のボタンも隠す
//      （`maplat-specific.scss:833-836`）。新はマーカー一覧だけを隠す（Stage 1 からの差）。
//   6. 地図が 0 枚のスライダー: 透明な空の箱が 224×60 の範囲で地図の操作を受け止める（旧も同じ）。
//   7. 文字の大きさと色: 旧はページから継承する。新は `:host` で 14px・#333 を決めている（書体だけは
//      継承に揃えた。画面全体の基準を `:host` で決めない方向が旧と同じで、Stage 3 以降の課題）。
//
// 意図した差ではないもの（旧に合わせ、ここで比べている）: 書体（旧も新もページの書体を継承する。fixture は
// 書体を指定しないので Chromium の既定の Times。新旧の lang の条件を揃えるため、比較用の fixture は
// `<maplat-ui lang>` を付けず `setting.lang` で言語を決める）・行の高さ（normal）・カードの文字の大きさ（18px）・
// 選択表示は今の地図にだけ付く・ボタンのアイコンの大きさ（1em）・スライダーの矢印の形と色（Swiper v12 の
// 山形・#007aff）・位置の em の基準（16px）・タッチ端末の配置・P3 の 1 枚のスライダーの位置。
// Stage 4 で旧の実装（`src/index.legacy.ts`）を消したので、**旧 UI の画面をその場で開いて比べる**
// ことはもうできない（`e2e/fixtures/legacy-api-old-impl.html` も消した）。基準 JSON に無い場面のうち
//   - P3（1 枚のスライダー）: 下で基準 JSON の容器の矩形と比べる（容器の寸法は枚数に依らない）。
//   - ボタンの中のアイコンの大きさ・位置: 基準 JSON にアイコンの矩形が無いので、比べる相手が無い。
//     アイコンの大きさ（1em）と矢印の形・色は、要素の単体テストと CSS（`src/element/styles.ts`）が持つ。
//   - タッチ端末の操作ボタンの配置（幅 480・375）: タッチの基準 JSON は題名などの文字だけを持ち、
//     矩形を持たない（`touch-*.json`）。∴ 比べる相手が無く、この比較は消した。
//
// 実行:
//   PLAYWRIGHT_SKIP_BROWSER_GC=1 node_modules/.bin/playwright test \
//     --config playwright-element.config.ts --workers=1 \
//     e2e/element/maplat-ui-baseline-compare.pw.ts
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/* eslint-disable @typescript-eslint/no-explicit-any */

const FIXTURE = "/e2e/fixtures/element-baseline.html";
const BASELINE_DIR = fileURLToPath(
  new URL("../../spec/fixtures/legacy-baseline/", import.meta.url)
);
const WIDTHS = [1280, 640, 481, 480, 375, 320] as const;
// P1 で意図してカードの枚数・幅が変わる幅（480 だけは旧も新も 1.4 枚なので比べる）
const CARD_DIFF_WIDTHS = new Set([1280, 640, 481, 375, 320]);

type Baseline = any;

const baselineFor = (width: number): Baseline =>
  JSON.parse(readFileSync(`${BASELINE_DIR}${width}.json`, "utf8"));
const baselineElement = (baseline: Baseline, key: string) => {
  const element = baseline.elements.find((e: any) => e.key === key);
  if (!element)
    throw new Error(`the baseline has no element "${key}" (${baseline.width})`);
  return element;
};

async function openBaseline(page: Page) {
  await page.goto(`${FIXTURE}?buttons=1&base=3&overlay=3`);
  // fixture の状態表示は `id="status"`（data-testid ではない。旧 legacy-api.html と同じ形）
  await expect(page.locator("#status")).toHaveAttribute("data-state", "ready", {
    timeout: 90_000
  });
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            (window as any).__maplatUi?.shadowRoot?.querySelectorAll(
              '[part="map-slider"][data-kind="base"] [part~="map-slide"]'
            ).length ?? 0
        ),
      { timeout: 30_000 }
    )
    .toBeGreaterThan(0);
  // サムネイルの読み込みを待つ（読み込み前の <img> は 0×0 で、矩形の比較が揺れる）
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Array.from(
            ((window as any).__maplatUi?.shadowRoot?.querySelectorAll(
              '[part="map-slide-thumb"]'
            ) ?? []) as NodeListOf<HTMLImageElement>
          ).every(img => img.tagName !== "IMG" || img.complete)
        ),
      { timeout: 30_000 }
    )
    .toBe(true);
  // 題名は app の mapChanged（currentMeta）で入る。空のまま測らない
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
}

/** ページの中の部品の矩形・計算値・スライダーの実測を、JSON にできる形で写す。 */
async function measure(page: Page) {
  return page.evaluate(() => {
    const ui = (window as any).__maplatUi as HTMLElement;
    const root = ui.shadowRoot!;
    const q = (selector: string) => root.querySelector(selector);
    const rect = (el: Element | null) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        top: r.top,
        right: r.right,
        bottom: r.bottom,
        left: r.left
      };
    };
    const css = (el: Element | null, props: string[]) =>
      el
        ? Object.fromEntries(
            props.map(prop => [prop, getComputedStyle(el)[prop as any]])
          )
        : null;
    const cardProps = [
      "backgroundColor",
      "border",
      "fontSize",
      "opacity",
      "borderTopWidth",
      "borderTopStyle",
      "borderTopColor",
      "borderRadius"
    ];
    const labelProps = [
      "fontSize",
      "lineHeight",
      "letterSpacing",
      "color",
      "textAlign"
    ];
    const cardInfo = (card: Element) => {
      const label = card.querySelector('[part="map-slide-label"]');
      const thumb = card.querySelector('[part="map-slide-thumb"]');
      return {
        mapID: (card as HTMLElement).dataset.mapId,
        className: card.className,
        rect: rect(card),
        computed: css(card, cardProps),
        text: label?.textContent ?? "",
        label: {
          rect: rect(label),
          computed: css(label, labelProps)
        },
        thumb: {
          rect: rect(thumb),
          objectFit: thumb ? getComputedStyle(thumb).objectFit : null
        }
      };
    };
    const centerCard = (slider: Element) => {
      const r = slider.getBoundingClientRect();
      const cards = Array.from(
        slider.querySelectorAll('[part~="map-slide"]')
      ).filter(card => (card as HTMLElement).dataset.mapId);
      let best: Element | null = null;
      let distance = Infinity;
      for (const card of cards) {
        const b = card.getBoundingClientRect();
        const d = Math.abs(b.left + b.width / 2 - (r.left + r.width / 2));
        if (d < distance) {
          distance = d;
          best = card;
        }
      }
      return best;
    };
    const sliderInfo = (kind: "base" | "overlay") => {
      const slider = q(`[part="map-slider"][data-kind="${kind}"]`)!;
      const style = getComputedStyle(slider);
      const width = parseFloat(style.getPropertyValue("--map-slide-width"));
      const gap = parseFloat(style.getPropertyValue("--map-slide-gap"));
      const containerWidth = slider.clientWidth;
      const center = centerCard(slider);
      return {
        rect: rect(slider),
        className: slider.className,
        computed: css(slider, [
          "backgroundColor",
          "borderRadius",
          "fontSize",
          "zIndex"
        ]),
        perView: (containerWidth + gap) / (width + gap),
        selectedMapIDs: Array.from(
          new Set(
            Array.from(slider.querySelectorAll('[part~="map-slide"]'))
              .filter(card => card.classList.contains("selected"))
              .map(card => (card as HTMLElement).dataset.mapId)
          )
        ).sort(),
        cardWidth: width,
        gap,
        containerWidth,
        center: center ? cardInfo(center) : null,
        cards: Array.from(slider.querySelectorAll('[part~="map-slide"]'))
          .filter(card => (card as HTMLElement).dataset.mapId)
          .map(card => cardInfo(card))
      };
    };
    const controlInfo = (part: string) => {
      const el = q(`[part="${part}"]`);
      return {
        rect: rect(el),
        computed: css(el, ["backgroundColor", "borderRadius"])
      };
    };
    const buttonInfo = (selector: string) => {
      const el = q(selector);
      return {
        rect: rect(el),
        computed: css(el, [
          "color",
          "backgroundColor",
          "fontSize",
          "fontWeight",
          "fontFamily",
          "lineHeight",
          "borderRadius",
          "borderTopWidth",
          "borderTopStyle"
        ])
      };
    };
    return {
      title: {
        rect: rect(q('[part="map-title"]')),
        computed: css(q('[part="map-title"]'), [
          "backgroundColor",
          "color",
          "fontSize",
          "fontFamily",
          "lineHeight",
          "borderRadius",
          "textAlign"
        ]),
        text: q('[part="map-title"] .text')?.textContent ?? "",
        textRect: rect(q('[part="map-title"] .text'))
      },
      sliders: {
        base: sliderInfo("base"),
        overlay: sliderInfo("overlay")
      },
      arrows: {
        basePrev: rect(q('[part="map-slider-prev"]')),
        baseNext: rect(q('[part="map-slider-next"]')),
        overlayPrev: rect(
          q('[part="map-slider"][data-kind="overlay"] [part="map-slider-prev"]')
        ),
        overlayNext: rect(
          q('[part="map-slider"][data-kind="overlay"] [part="map-slider-next"]')
        )
      },
      transparency: {
        rect: rect(q('[part="slider"]')),
        computed: css(q('[part="slider"]'), [
          "backgroundColor",
          "borderTopWidth",
          "borderTopStyle",
          "borderTopColor",
          "borderRadius",
          "fontSize",
          "lineHeight"
        ]),
        // 基準の採り方と同じ（Chromium は ::-webkit-slider-thumb の計算値を返さず、入力そのものの値を返す。
        // つまみ自体の大きさは画面の写しで見る）
        thumbWebkit: (() => {
          const el = q('[part="slider"]');
          if (!el) return null;
          const cs = getComputedStyle(el, "::-webkit-slider-thumb");
          return {
            width: cs.width,
            height: cs.height,
            backgroundColor: cs.backgroundColor,
            borderRadius: cs.borderRadius
          };
        })()
      },
      controls: {
        info: controlInfo("info"),
        border: controlInfo("border"),
        hideMarker: controlInfo("hide-marker"),
        share: controlInfo("share"),
        help: controlInfo("help"),
        zoom: controlInfo("zoom"),
        gps: controlInfo("gps"),
        home: controlInfo("home"),
        compass: controlInfo("compass")
      },
      buttons: {
        info: buttonInfo('[part="info"] button'),
        border: buttonInfo('[part="border"] button'),
        hideMarker: buttonInfo('[part="hide-marker"] button'),
        share: buttonInfo('[part="share"] button'),
        help: buttonInfo('[part="help"] button'),
        gps: buttonInfo('[part="gps"] button'),
        home: buttonInfo('[part="home"] button'),
        compass: buttonInfo('[part="compass"] button'),
        zoomIn: buttonInfo('[part="zoom-in"]'),
        zoomOut: buttonInfo('[part="zoom-out"]')
      },
      markerList: {
        hidden:
          (q('[part="marker-list"]') as HTMLElement | null)?.hidden ?? null
      },
      borderState: {
        base: Array.from(
          q('[part="map-slider"][data-kind="base"]')!.querySelectorAll(
            '[part~="map-slide"]'
          )
        )
          .filter(card => (card as HTMLElement).dataset.mapId)
          .map(card => ({
            mapID: (card as HTMLElement).dataset.mapId,
            computed: css(card, [
              "borderTopWidth",
              "borderTopStyle",
              "borderTopColor"
            ])
          })),
        overlay: Array.from(
          q('[part="map-slider"][data-kind="overlay"]')!.querySelectorAll(
            '[part~="map-slide"]'
          )
        )
          .filter(card => (card as HTMLElement).dataset.mapId)
          .map(card => ({
            mapID: (card as HTMLElement).dataset.mapId,
            computed: css(card, [
              "borderTopWidth",
              "borderTopStyle",
              "borderTopColor"
            ])
          }))
      }
    };
  });
}

function expectRect(actual: any, expected: any, label: string, tolerance = 1) {
  expect(actual, `${label}: no element`).not.toBeNull();
  if (!actual) return;
  // 1 か所の差で止めず、全部の差を一度に出す（soft）。判定は甘くしない
  for (const key of ["x", "y", "width", "height"]) {
    expect
      .soft(
        Math.abs(actual[key] - expected[key]),
        `${label}.${key}: ${actual[key]} vs ${expected[key]}`
      )
      .toBeLessThanOrEqual(tolerance);
  }
}

function expectComputed(
  actual: any,
  expected: any,
  keys: string[],
  label: string
) {
  expect(actual, `${label}: no element`).not.toBeNull();
  if (!actual) return;
  for (const key of keys) {
    expect.soft(actual[key], `${label}.${key}`).toBe(expected[key]);
  }
}

for (const width of WIDTHS) {
  test.describe(`旧 UI の基準と比べる（幅 ${width}px）`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("題名・スライダーの容器と矢印・ボタン・透過度の位置が一致する", async ({
      page
    }) => {
      test.setTimeout(180_000);
      const baseline = baselineFor(width);
      await openBaseline(page);
      const measured = await measure(page);

      // ---- 題名（旧 .map-title は div + span） ----
      const title = baselineElement(baseline, "title");
      const titleText = baselineElement(baseline, "title-text");
      expectRect(measured.title.rect, title.rect, "title");
      expectRect(measured.title.textRect, titleText.rect, "title-text");
      expectComputed(
        measured.title.computed,
        title.computed,
        [
          "backgroundColor",
          "color",
          "fontSize",
          "fontFamily",
          "lineHeight",
          "textAlign",
          "borderRadius"
        ],
        "title"
      );
      expect(measured.title.text).toBe(titleText.text.replace(/…$/, ""));

      // ---- スライダーの容器と矢印（旧 Swiper の 2 本） ----
      for (const kind of ["base", "overlay"] as const) {
        const expected = baseline.sliders[kind];
        expectRect(
          measured.sliders[kind].rect,
          baselineElement(baseline, `${kind}-slider`).rect,
          `${kind}-slider`
        );
        expectComputed(
          measured.sliders[kind].computed,
          baselineElement(baseline, `${kind}-slider`).computed,
          ["backgroundColor", "borderRadius", "fontSize", "zIndex"],
          `${kind}-slider`
        );
        // 選択表示: 旧は Swiper の複製を含めて `selectedCount` 枚（overlay 2・base 0）。新は 5 スロットなので
        // 枚数ではなく「選ばれている地図」で比べる（旧のカードの class から読む）
        const expectedSelected = Array.from(
          new Set(
            baseline.elements
              .filter(
                (e: any) =>
                  e.key.startsWith(`${kind}-card-`) &&
                  /\bselected\b/.test(e.className ?? "")
              )
              .map((e: any) => e.mapID)
          )
        ).sort();
        expect(
          expectedSelected.length > 0,
          `${kind}: baseline selectedCount`
        ).toBe(expected.selectedCount > 0);
        expect
          .soft(measured.sliders[kind].selectedMapIDs, `${kind}: selected maps`)
          .toEqual(expectedSelected);
        // P1 の意図差分はカードの枚数・幅だけ。perView は意図した値になっている
        const wanted =
          width === 480
            ? expected.perView
            : baseline.expectedPerViewByP1.slidesPerView;
        expect(
          Math.abs(measured.sliders[kind].perView - wanted),
          `${kind}: perView ${measured.sliders[kind].perView} vs ${wanted}`
        ).toBeLessThan(0.02);
        expect(measured.sliders[kind].gap).toBe(
          width === 480 ? expected.gap : baseline.expectedPerViewByP1.gap
        );
      }
      expectRect(
        measured.arrows.basePrev,
        baselineElement(baseline, "base-arrow-prev").rect,
        "base-arrow-prev"
      );
      expectRect(
        measured.arrows.baseNext,
        baselineElement(baseline, "base-arrow-next").rect,
        "base-arrow-next"
      );
      expectRect(
        measured.arrows.overlayPrev,
        baselineElement(baseline, "overlay-arrow-prev").rect,
        "overlay-arrow-prev"
      );
      expectRect(
        measured.arrows.overlayNext,
        baselineElement(baseline, "overlay-arrow-next").rect,
        "overlay-arrow-next"
      );

      // ---- カード（480 だけ。それ以外は P1 の意図差分） ----
      if (!CARD_DIFF_WIDTHS.has(width)) {
        for (const kind of ["base", "overlay"] as const) {
          const expected = baselineElement(baseline, `${kind}-card-3`);
          const actual = measured.sliders[kind].center!;
          expect(actual.mapID, `${kind}-card-3.mapID`).toBe(expected.mapID);
          expectRect(actual.rect, expected.rect, `${kind}-card-3`);
          expectComputed(
            actual.computed,
            expected.computed,
            // 基準のカードの計算値は backgroundColor・border・fontSize・opacity だけを採っている
            ["backgroundColor", "border", "fontSize", "opacity"],
            `${kind}-card-3`
          );
          expectRect(
            actual.label.rect,
            expected.label.rect,
            `${kind}-card-3-label`
          );
          expect
            .soft(
              actual.label.computed!.fontSize,
              `${kind}-card-3-label.fontSize`
            )
            .toBe(expected.label.fontSize);
          expect
            .soft(actual.label.computed!.color, `${kind}-card-3-label.color`)
            .toBe(expected.label.color);
          expect
            .soft(
              actual.label.computed!.lineHeight,
              `${kind}-card-3-label.lineHeight`
            )
            .toBe(expected.label.lineHeight);
          if (expected.thumb)
            expectRect(
              actual.thumb.rect,
              expected.thumb.rect,
              `${kind}-card-3-thumb`
            );
        }
      } else {
        // P1 でカードの幅と横位置が変わる幅でも、幅に依らないもの（中央の地図・カードの縦の位置と高さ・
        // 計算値・見出しの色・サムネイルの大きさと縦の位置）は旧と同じでなければならない。
        // 見出しの文字の大きさ（`minimize` で 0.8em になるか）と省略はカードの幅で決まるので比べない
        for (const kind of ["base", "overlay"] as const) {
          const expected = baselineElement(baseline, `${kind}-card-3`);
          const actual = measured.sliders[kind].center!;
          const label = `${kind}-card-3(P1)`;
          expect.soft(actual.mapID, `${label}.mapID`).toBe(expected.mapID);
          for (const key of ["y", "height"])
            expect
              .soft(
                Math.abs(actual.rect![key] - expected.rect[key]),
                `${label}.${key}: ${actual.rect![key]} vs ${expected.rect[key]}`
              )
              .toBeLessThanOrEqual(1);
          expectComputed(
            actual.computed,
            expected.computed,
            ["backgroundColor", "border", "fontSize", "opacity"],
            label
          );
          expect
            .soft(actual.label.computed!.color, `${label}-label.color`)
            .toBe(expected.label.color);
          expect
            .soft(
              actual.label.computed!.lineHeight,
              `${label}-label.lineHeight`
            )
            .toBe(expected.label.lineHeight);
          if (expected.thumb)
            for (const key of ["y", "width", "height"])
              expect
                .soft(
                  Math.abs(actual.thumb.rect![key] - expected.thumb.rect[key]),
                  `${label}-thumb.${key}: ${actual.thumb.rect![key]} vs ${expected.thumb.rect[key]}`
                )
                .toBeLessThanOrEqual(1);
        }
      }

      // ---- 透過度のスライダー（旧 .ol-slidernew） ----
      expectRect(
        measured.transparency.rect,
        baselineElement(baseline, "transparency").rect,
        "transparency"
      );
      expectComputed(
        measured.transparency.computed,
        baselineElement(baseline, "transparency").computed,
        [
          "backgroundColor",
          "borderTopWidth",
          "borderTopStyle",
          "borderTopColor",
          "borderRadius",
          "fontSize",
          "lineHeight"
        ],
        "transparency"
      );
      const transparencyInput = baselineElement(baseline, "transparency-input");
      expectRect(
        measured.transparency.rect,
        transparencyInput.rect,
        "transparency-input"
      );
      expectComputed(
        measured.transparency.thumbWebkit,
        transparencyInput.thumbWebkit,
        ["width", "height", "backgroundColor", "borderRadius"],
        "transparency-input.thumbWebkit"
      );

      // ---- 操作ボタン（旧 .ol-control の容器とボタン） ----
      const controlMap: Array<[keyof typeof measured.controls, string]> = [
        ["info", "control:ol-copyright"],
        ["border", "control:ol-border"],
        ["hideMarker", "control:ol-hide-marker"],
        ["share", "control:ol-share"],
        ["help", "control:ol-maplat"],
        ["zoom", "control:ol-zoom"],
        ["gps", "control:gps.disable"],
        ["home", "control:home"],
        ["compass", "control:ol-rotate.disable"]
      ];
      for (const [key, baselineKey] of controlMap) {
        const expected = baselineElement(baseline, baselineKey);
        expectRect(
          measured.controls[key].rect,
          expected.rect,
          `control:${baselineKey}`
        );
        expectComputed(
          measured.controls[key].computed,
          expected.computed,
          ["backgroundColor", "borderRadius"],
          `control:${baselineKey}`
        );
      }
      // マーカー一覧だけは POI 0 件で隠れる（既知の差分）。隠れても下から積むので他は動かない
      expect(measured.markerList.hidden).toBe(true);

      const buttonMap: Array<[keyof typeof measured.buttons, string]> = [
        ["info", "button:ol-copyright:0"],
        ["border", "button:ol-border:0"],
        ["hideMarker", "button:ol-hide-marker:0"],
        ["share", "button:ol-share:0"],
        ["help", "button:ol-maplat:0"],
        ["gps", "button:gps.disable:0"],
        ["home", "button:home:0"],
        ["compass", "button:ol-rotate.disable:0"],
        ["zoomIn", "button:ol-zoom:0"],
        ["zoomOut", "button:ol-zoom:1"]
      ];
      for (const [key, baselineKey] of buttonMap) {
        const expected = baselineElement(baseline, baselineKey);
        expectRect(measured.buttons[key].rect, expected.rect, baselineKey);
        expectComputed(
          measured.buttons[key].computed,
          expected.computed,
          [
            "color",
            "backgroundColor",
            "fontSize",
            "fontWeight",
            "fontFamily",
            "lineHeight",
            "borderRadius",
            "borderTopWidth",
            "borderTopStyle"
          ],
          baselineKey
        );
      }
    });

    test("枠線の表示中は、範囲を持つ地図のカードに旧と同じ枠が出る", async ({
      page
    }) => {
      test.setTimeout(180_000);
      const baseline = baselineFor(width);
      await openBaseline(page);
      await page.evaluate(() => (window as any).__maplatUi.setShowBorder(true));
      const measured = await measure(page);
      const dedupe = (cards: any[]) => {
        const seen = new Set<string>();
        return cards.filter(card => {
          if (seen.has(card.mapID)) return false;
          seen.add(card.mapID);
          return true;
        });
      };
      for (const kind of ["base", "overlay"] as const) {
        const actual = dedupe(measured.borderState[kind]);
        const expected = dedupe(baseline.borderState[kind]);
        expect(actual.length, `${kind}: card count`).toBe(expected.length);
        for (const expectedCard of expected) {
          const actualCard = actual.find(c => c.mapID === expectedCard.mapID);
          expect(actualCard, `${kind}: ${expectedCard.mapID}`).toBeTruthy();
          // 基準の borderState のカードは計算値を平らに持つ（`computed` の入れ子ではない）
          expectComputed(
            actualCard!.computed,
            expectedCard,
            ["borderTopWidth", "borderTopStyle", "borderTopColor"],
            `${kind}: ${expectedCard.mapID}`
          );
        }
      }
    });
  });
}

test.describe("タッチ端末の見出し（旧 UI の .ol-touch と同じ縮小）", () => {
  test.use({
    viewport: { width: 480, height: 800 },
    hasTouch: true,
    isMobile: true
  });

  test("見出しが 0.8em になり、1 行に収まる", async ({ page }) => {
    test.setTimeout(180_000);
    const baseline = JSON.parse(
      readFileSync(`${BASELINE_DIR}touch-480.json`, "utf8")
    );
    const expectedLabels: any[] = baseline.touch.labels;
    expect(expectedLabels.length).toBeGreaterThan(0);
    await openBaseline(page);
    // 旧は Swiper の複製を含む 6 枚、新は 5 個の物理スロット。DOM の並び順は比べられないので、
    // 地図ごと（mapID）に、文字の大きさ・縮小の有無・行数・表示中の文字を比べる
    const measured = await page.evaluate(() => {
      const root = (window as any).__maplatUi.shadowRoot!;
      const out: any[] = [];
      for (const kind of ["base", "overlay"]) {
        const slider = root.querySelector(
          `[part="map-slider"][data-kind="${kind}"]`
        ) as HTMLElement;
        for (const card of Array.from(
          slider.querySelectorAll('[part~="map-slide"]')
        ) as HTMLElement[]) {
          if (!card.dataset.mapId) continue;
          const label = card.querySelector(
            '[part="map-slide-label"]'
          ) as HTMLElement;
          const spans = Array.from(label.querySelectorAll("span")).filter(
            s => s.getClientRects().length > 0
          );
          const tops = new Set(
            spans.map(s => Math.round(s.getBoundingClientRect().top))
          );
          out.push({
            kind,
            touch: slider.classList.contains("touch"),
            mapID: card.dataset.mapId,
            fontSize: getComputedStyle(label).fontSize,
            minimize: label.classList.contains("minimize"),
            lines: spans.length ? tops.size : null,
            visibleText: spans.length
              ? spans
                  .map(s => s.textContent ?? "")
                  .join("")
                  .trim()
              : (label.textContent ?? "").trim()
          });
        }
      }
      return out;
    });
    expect(measured.length).toBeGreaterThan(0);
    for (const actual of measured) {
      const expected = expectedLabels.find(
        (l: any) => l.kind === actual.kind && l.mapID === actual.mapID
      );
      const label = `${actual.kind}:${actual.mapID}`;
      expect(expected, `${label}: not in the baseline`).toBeTruthy();
      expect.soft(actual.touch, `${label}.touch`).toBe(true);
      expect.soft(actual.fontSize, `${label}.fontSize`).toBe(expected.fontSize);
      expect
        .soft(actual.minimize, `${label}.minimize`)
        .toBe(expected.className.includes("minimize"));
      expect.soft(actual.lines, `${label}.lines`).toBe(expected.lines);
      expect
        .soft(actual.visibleText, `${label}.visibleText`)
        .toBe(expected.visibleText);
    }
  });
});

// ---- P3: 地図が 1 枚のスライダー（Stage 4 で旧 UI との突き合わせを基準 JSON へ置き換えた） ----
// 1 枚の側も、容器の位置と大きさは 2 枚のときと同じ（旧も容器の寸法は地図の枚数に依らない）ことを
// **基準 JSON**（`{width}.json` は base=3&overlay=3 のときの旧 UI の矩形）と比べる。
// 併せて、1 枚の側だけ `single-map`（枠＝背景を描かず、矢印を出さない）であることを確かめる。
async function openElementWith(page: Page, query: string) {
  await page.goto(`${FIXTURE}?${query}`);
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
}

const measureP3 = (page: Page) =>
  page.evaluate(() => {
    const root = (window as any).__maplatUi.shadowRoot as ShadowRoot;
    const rectOf = (selector: string) => {
      const el = root.querySelector(selector) as HTMLElement | null;
      if (!el || el.getClientRects().length === 0) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    };
    return {
      base: rectOf('[part="map-slider"][data-kind="base"]'),
      overlay: rectOf('[part="map-slider"][data-kind="overlay"]'),
      title: rectOf('[part="map-title"]'),
      transparency: rectOf('[part="slider"]'),
      state: ["base", "overlay"].map(kind => {
        const el = root.querySelector(
          `[part="map-slider"][data-kind="${kind}"]`
        ) as HTMLElement;
        return {
          kind,
          single: el.classList.contains("single-map"),
          background: getComputedStyle(el).backgroundColor,
          // 1 枚の側は矢印を出さない（`.single-map .map-slider-nav { display: none }`）
          navRendered: ["prev", "next"].filter(dir => {
            const nav = el.querySelector(
              `[part="map-slider-${dir}"]`
            ) as HTMLElement | null;
            return (nav?.getClientRects().length ?? 0) > 0;
          }).length
        };
      })
    };
  });

for (const width of [1280, 375] as const) {
  test.describe(`P3: 地図が 1 枚のスライダーの位置（幅 ${width}px）`, () => {
    test.use({ viewport: { width, height: 800 } });
    for (const query of ["base=1&overlay=3", "base=3&overlay=1"]) {
      test(`${query}: 2 本の容器の位置と大きさが基準 JSON と同じ（枠を描かないだけ）`, async ({
        page
      }) => {
        test.setTimeout(180_000);
        const baseline = baselineFor(width);
        await openElementWith(page, query);
        const measured = await measureP3(page);
        // 1 枚の側も、容器の位置と大きさは 2 枚のとき（基準 JSON）と同じ
        expectRect(
          measured.base,
          baselineElement(baseline, "base-slider").rect,
          "base-slider"
        );
        expectRect(
          measured.overlay,
          baselineElement(baseline, "overlay-slider").rect,
          "overlay-slider"
        );
        expectRect(
          measured.transparency,
          baselineElement(baseline, "transparency").rect,
          "transparency"
        );
        expectRect(
          measured.title,
          baselineElement(baseline, "title").rect,
          "title"
        );
        // 1 枚の側は single-map（枠＝背景を描かず、矢印を出さない）。もう片方は枠を描く
        const singleKind = query.startsWith("base=1") ? "base" : "overlay";
        for (const s of measured.state) {
          const single = s.kind === singleKind;
          expect(s.single, `${s.kind}.single`).toBe(single);
          expect(s.background, `${s.kind}.background`).toBe(
            single ? "rgba(0, 0, 0, 0)" : "rgba(32, 32, 32, 0.5)"
          );
          // 矢印は 1 枚の側だけ出さず、もう片方は 2 本とも出す（実装は `nav.hidden = single` だけ。slider.ts）
          expect(s.navRendered, `${s.kind}.nav`).toBe(single ? 0 : 2);
        }
      });
    }
  });
}
