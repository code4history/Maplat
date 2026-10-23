// 自前のスライダー（`src/element/slider.ts`）と見出しの省略（`src/shared/text.ts`）の単体（設計 v2 §4.7.1・§6.2）。
//
// このファイルが固定するもの:
//   - 純関数の境界（`mod`・`perViewFor`・`cardWidthFor`・`slotIndex`・`snapSteps`・`baseXFor`）
//     **P1**: 幅 480px 以下で 1.4 枚・gap 10／481px 以上で 2 枚・gap 15（v4 時代の見た目）
//     **P2**: 速さのしきい値 0.35px/ms・1 操作 1 枚・250ms・遠いは 160ms で連続・drag は 1 枚上限＋抵抗 0.3 倍
//   - 5 スロットの循環（複製なし）: 押した要素が同じノードのまま中央へ来る・N=2 は押した側へ動く・
//     遠端の付け替えで可視のノードの画面座標が動かない
//   - 地図を変えるのは `onSelect` だけ（矢印・drag・`onActiveChange` では変えない。D5・N5）
//   - 押した直後に `onSelect` を呼ぶ（step の完了を待たない。D5）
//   - XSS 3 種（`label` の HTML・`thumbnail` の `javascript:`・`mapID` の属性注入）
//   - 見出しの 2 行省略（旧 `ellips` と同じ手順。`line-clamp` を第一手段にしない。D8）。
//     ただし 1 文字の見出しはそのまま出す（旧は `…` だけになっていた。不具合として直した。N5）
//
// 時間について: jsdom は CSS の transition を実行しないので、このファイルは `SLIDER_TUNING` の
// 時間を 0 にして（`beforeEach`）確定を待つ。時間が要る検査（transition が付くこと）だけは
// 実際の既定値のまま 1 件だけ置く。
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  MapSlider,
  SLIDER_TUNING,
  baseXFor,
  cardWidthFor,
  mod,
  perViewFor,
  slotIndex,
  snapSteps
} from "../src/element/slider";
import { ellipsize } from "../src/shared/text";
import { MAPLAT_UI_CSS } from "../src/element/styles";

/** 出荷時の調整値（テストは時間を 0 にするので、比較用に読み込み時の写しを持つ） */
const SHIPPED_TUNING = { ...SLIDER_TUNING };

const makeItems = (mapIDs: string[]) =>
  mapIDs.map((mapID, i) => ({
    mapID,
    label: `地図${i + 1}`,
    thumbnail: null as string | null,
    isBasemap: i === 0
  }));

type Made = { slider: MapSlider; calls: any[] };

function make(mapIDs: string[], overrides: Record<string, any> = {}): Made {
  const calls: any[] = [];
  const slider = new MapSlider({
    kind: "overlay",
    items: makeItems(mapIDs),
    translate: (v: any) => (typeof v === "string" ? v : (v?.ja ?? "")),
    groupLabel: "重ね地図",
    ...overrides,
    onSelect: (id: string, offset: number) => {
      calls.push({
        id,
        offset,
        activeAtCall: slider.activeMapID,
        activeIndexAtCall: slider.activeIndex
      });
    }
  });
  document.body.appendChild(slider.element);
  return { slider, calls };
}

/** 容器の幅を決める（jsdom はレイアウトしないので明示） */
function setWidth(slider: MapSlider, width: number) {
  Object.defineProperty(slider.element, "clientWidth", {
    value: width,
    configurable: true
  });
  slider.refresh();
}

const slotX = (el: HTMLElement) => {
  const m = /translate3d\((-?[\d.]+)px/.exec(el.style.transform || "");
  return m ? Number(m[1]) : NaN;
};
const trackX = (slider: MapSlider) => {
  const track = slider.element.querySelector(
    ".map-slider-track"
  ) as HTMLElement;
  const m = /translate3d\((-?[\d.]+)px/.exec(track.style.transform || "");
  return m ? Number(m[1]) : NaN;
};
const track = (slider: MapSlider) =>
  slider.element.querySelector(".map-slider-track") as HTMLElement;
const selectedSlots = (slider: MapSlider) =>
  Array.from(
    slider.element.querySelectorAll(".map-slide.selected")
  ) as HTMLElement[];
const live = (slider: MapSlider) =>
  slider.element.querySelector(".map-slider-live") as HTMLElement;

function pointer(type: string, init: Record<string, any> = {}) {
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    button: 0,
    ...init
  });
}

/**
 * jsdom には `matchMedia` も `ResizeObserver` も無い（実測。`spec/zz-probe-mm.spec.ts` が固定していた
 * 前提はここに書く）。
 *   - `matchMedia` が無いと `#canAnimate()` が偽になるので、時間を見る検査だけ、`transitionend` の
 *     代わりに保険のタイマー（時間 + 120ms）で確定する経路を通すために、ここで置き換える。
 *   - `ResizeObserver` が無いことは差し替えず、そのまま「ResizeObserver が無い環境でも動き、
 *     幅を変えると active を動かさずに測り直す」検査の前提にしている（`#observeResize` は
 *     `window` の `resize` リスナーへ落ちる）。
 */
function stubMatchMedia(matches = false) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false
    })
  });
}

/** 時間を見る検査のための、出荷時の時間へ戻す（`beforeEach` は 0 にしている） */
function useShippedDurations() {
  SLIDER_TUNING.stepDurationMs = SHIPPED_TUNING.stepDurationMs;
  SLIDER_TUNING.farStepDurationMs = SHIPPED_TUNING.farStepDurationMs;
}

/** drag: dx は指の移動量（右が正）。steps 分割で動かし、遅延を入れると速度が小さくなる。 */
async function drag(
  slider: MapSlider,
  dx: number,
  options: { steps?: number; delayMs?: number; release?: boolean } = {}
) {
  const { steps = 1, delayMs = 0, release = true } = options;
  const center = slider.slots.find(s => s.offset === 0)!.element;
  const x0 = 100;
  center.dispatchEvent(pointer("pointerdown", { clientX: x0 }));
  for (let i = 1; i <= steps; i++) {
    if (delayMs) await new Promise(r => setTimeout(r, delayMs));
    window.dispatchEvent(
      pointer("pointermove", { clientX: x0 + (dx * i) / steps })
    );
  }
  if (release) {
    if (delayMs) await new Promise(r => setTimeout(r, delayMs));
    window.dispatchEvent(pointer("pointerup", { clientX: x0 + dx }));
  }
}

let savedTuning: typeof SLIDER_TUNING;
beforeEach(() => {
  savedTuning = { ...SLIDER_TUNING };
  SLIDER_TUNING.stepDurationMs = 0;
  SLIDER_TUNING.farStepDurationMs = 0;
  Object.defineProperty(window, "innerWidth", {
    value: 1280,
    configurable: true,
    writable: true
  });
});
afterEach(() => {
  Object.assign(SLIDER_TUNING, savedTuning);
  document.body.innerHTML = "";
  // `stubMatchMedia` を戻す（jsdom の元の状態 = `matchMedia` が無い）
  delete (window as any).matchMedia;
  Object.defineProperty(window, "innerWidth", {
    value: 1024,
    configurable: true,
    writable: true
  });
  vi.restoreAllMocks();
});

describe("純関数", () => {
  it("mod は負でも 0..m-1 に畳む", () => {
    expect(mod(0, 5)).toBe(0);
    expect(mod(4, 5)).toBe(4);
    expect(mod(5, 5)).toBe(0);
    expect(mod(-1, 5)).toBe(4);
    expect(mod(-6, 5)).toBe(4);
    expect(mod(2, 1)).toBe(0);
    expect(mod(3, 0)).toBe(0); // 0 除算は 0（例外にしない）
  });

  it("perViewFor は P1 の境界（480 は 1.4 枚・481 は 2 枚）", () => {
    expect(perViewFor(320)).toEqual({ perView: 1.4, gap: 10 });
    expect(perViewFor(375)).toEqual({ perView: 1.4, gap: 10 });
    expect(perViewFor(479)).toEqual({ perView: 1.4, gap: 10 });
    expect(perViewFor(480)).toEqual({ perView: 1.4, gap: 10 });
    expect(perViewFor(481)).toEqual({ perView: 2, gap: 15 });
    expect(perViewFor(640)).toEqual({ perView: 2, gap: 15 });
    expect(perViewFor(1280)).toEqual({ perView: 2, gap: 15 });
  });

  it("cardWidthFor は Swiper と同じ式で、旧 CSS の幅と一致する", () => {
    // 224 = 1280px 画面の `.overlay-swiper` の幅。旧の 1.4 枚・gap 10 で 157.14
    expect(cardWidthFor(224, 1.4, 10)).toBeCloseTo(157.142857, 5);
    // 2 枚・gap 15 なら 104.5
    expect(cardWidthFor(224, 2, 15)).toBeCloseTo(104.5, 5);
    // 375px 画面の幅 131（旧 CSS は 35%）。設計 §4.3.2 の例では 58
    expect(cardWidthFor(131, 2, 15)).toBeCloseTo(58, 5);
    // 320px 画面の幅 112（旧 CSS の @media 320px）。1.4 枚・gap 10 で 77.14
    expect(cardWidthFor(112, 1.4, 10)).toBeCloseTo(77.142857, 5);
    expect(cardWidthFor(0, 2, 15)).toBe(0);
    expect(cardWidthFor(224, 0, 10)).toBe(0);
  });

  it("baseXFor は C/2 - (2.5W + 2g) で、中央のスロットが容器の中央に来る", () => {
    const C = 224;
    const W = cardWidthFor(C, 1.4, 10);
    const g = 10;
    const baseX = baseXFor(C, W, g);
    expect(baseX).toBeCloseTo(C / 2 - (2.5 * W + 2 * g), 5);
    // 中央スロット（物理 index 2）の中心 = baseX + 2*(W+g) + W/2
    expect(baseX + 2 * (W + g) + W / 2).toBeCloseTo(C / 2, 5);
    // 別の幅でも同じ（375px 相当）
    const C2 = 131;
    const W2 = cardWidthFor(C2, 2, 15);
    const baseX2 = baseXFor(C2, W2, 15);
    expect(baseX2 + 2 * (W2 + 15) + W2 / 2).toBeCloseTo(C2 / 2, 5);
  });

  it("slotIndex は active±2 を循環させる（N=1,2,3,5,6）", () => {
    expect(slotIndex(0, 0, 1)).toBe(0);
    expect(slotIndex(0, -2, 1)).toBe(0);
    for (const n of [2, 3, 5, 6]) {
      const active = 0;
      expect(slotIndex(active, 0, n)).toBe(0);
      expect(slotIndex(active, 1, n)).toBe(1 % n);
      expect(slotIndex(active, 2, n)).toBe(2 % n);
      expect(slotIndex(active, -1, n)).toBe(mod(-1, n));
      expect(slotIndex(active, -2, n)).toBe(mod(-2, n));
    }
    // active が末尾でも負の mod で回る
    expect(slotIndex(4, 1, 5)).toBe(0);
    expect(slotIndex(4, 2, 5)).toBe(1);
    expect(slotIndex(0, -1, 5)).toBe(4);
    expect(slotIndex(1, -2, 2)).toBe(mod(-1, 2));
  });

  it("snapSteps は dx の向きと速さで 1 枚だけ決める（符号: 右へ動いたら前へ）", () => {
    const step = 100;
    expect(snapSteps(0, step, 0)).toBe(0);
    expect(snapSteps(0, step, 0.5)).toBe(-1); // 速度だけで決まる（右へ払ったら前へ）
    expect(snapSteps(0, step, -0.5)).toBe(1);
    expect(snapSteps(0, step, 0.34)).toBe(0); // しきい値 0.35 未満
    expect(snapSteps(step / 4, step, 0)).toBe(0);
    expect(snapSteps(step / 2, step, 0)).toBe(-1);
    expect(snapSteps(-step / 2, step, 0)).toBe(1);
    expect(snapSteps(step, step, 0)).toBe(-1);
    expect(snapSteps(-step, step, 0)).toBe(1);
    // 逆向きの速度でも、dx がしきい値以上なら dx を優先する
    expect(snapSteps(step, step, -0.9)).toBe(-1);
  });

  it("しきい値と時間は P2 の数値（0.35px/ms・250ms・160ms・抵抗 0.3・1 枚上限）", () => {
    // 出荷時の値（このファイルの `beforeEach` は時間を 0 にするので、module 読み込み時の写しを見る）
    expect(SHIPPED_TUNING.thresholdVelocity).toBe(0.35);
    expect(SHIPPED_TUNING.stepDurationMs).toBe(250);
    expect(SHIPPED_TUNING.farStepDurationMs).toBe(160);
    expect(SHIPPED_TUNING.dragResistance).toBe(0.3);
    expect(SHIPPED_TUNING.dragLimitCards).toBe(1);
    expect(SHIPPED_TUNING.maxStepsPerGesture).toBe(1);
    expect(SHIPPED_TUNING.easing).toBe("cubic-bezier(.22,.61,.36,1)");
    expect(SHIPPED_TUNING.breakpointWidth).toBe(480);
  });
});

describe("DOM の骨格", () => {
  it("N>=2 は 5 スロットで、offset -2..2 に mod で地図が並ぶ", () => {
    const { slider } = make(["a", "b", "c"]);
    setWidth(slider, 224);
    expect(slider.count).toBe(3);
    expect(slider.slots.map(s => s.offset)).toEqual([-2, -1, 0, 1, 2]);
    expect(slider.activeMapID).toBe("a");
    // N=3: active=a のとき offset -2 -> b(1), -1 -> c(2), 0 -> a, 1 -> b, 2 -> c
    expect(slider.slots.map(s => s.mapID)).toEqual(["b", "c", "a", "b", "c"]);
    expect(slider.element.getAttribute("role")).toBe("group");
    expect(slider.element.getAttribute("aria-label")).toBe("重ね地図");
    expect(slider.element.getAttribute("part")).toBe("map-slider");
  });

  it("矢印は旧 UI の Swiper v12 と同じ山形の SVG を持ち、読み上げからは隠す（仕上げ）", () => {
    const { slider } = make(["a", "b", "c"]);
    for (const kind of ["prev", "next"]) {
      const nav = slider.element.querySelector(`.map-slider-nav.${kind}`)!;
      const svg = nav.querySelector("svg.map-slider-nav-icon")!;
      expect(svg).not.toBeNull();
      expect(svg.getAttribute("viewBox")).toBe("0 0 11 20");
      expect(svg.getAttribute("aria-hidden")).toBe("true");
      expect(svg.querySelector("path")!.getAttribute("d")).toMatch(
        /^M0\.38296 20\.0762/
      );
      // 読み上げ名は button の aria-label のまま
      expect(nav.getAttribute("aria-label")).toBeTruthy();
    }
  });

  it("hasMap はこの行にある地図だけを真にする（要素が無い側の選択を外すのに使う）", () => {
    const { slider } = make(["a", "b"]);
    expect(slider.hasMap("a")).toBe(true);
    expect(slider.hasMap("zzz")).toBe(false);
    expect(slider.hasMap(null)).toBe(false);
  });

  it("N=1 は 1 スロットだけで、single-map・矢印は隠れ・step は動かない", async () => {
    const { slider, calls } = make(["only"]);
    setWidth(slider, 224);
    expect(slider.count).toBe(1);
    expect(slider.slots.length).toBe(1);
    expect(slider.element.classList.contains("single-map")).toBe(true);
    const arrows = Array.from(
      slider.element.querySelectorAll(".map-slider-nav")
    ) as HTMLElement[];
    expect(arrows.length).toBe(2);
    for (const arrow of arrows)
      expect(arrow.hidden || arrow.getAttribute("aria-hidden") === "true").toBe(
        true
      );
    const before = slider.activeMapID;
    const prevCalls = calls.length;
    await slider.step(1);
    await slider.step(-1);
    expect(slider.activeMapID).toBe(before);
    expect(calls.length).toBe(prevCalls); // 矢印では地図を変えない
  });

  it("幅 480 と 481 で perView と gap が入れ替わる（P1）", async () => {
    const { slider } = make(["a", "b", "c", "d"]);
    (window as any).innerWidth = 480;
    setWidth(slider, 131);
    expect(slider.perView).toBe(1.4);
    expect(slider.gap).toBe(10);
    (window as any).innerWidth = 481;
    slider.refresh();
    expect(slider.perView).toBe(2);
    expect(slider.gap).toBe(15);
    (window as any).innerWidth = 1280;
    slider.refresh();
    expect(slider.perView).toBe(2);
  });

  it("カードの幅とトラックの位置は式どおり（baseX・中心）", () => {
    const { slider } = make(["a", "b", "c"]);
    setWidth(slider, 224);
    const W = cardWidthFor(224, slider.perView, slider.gap);
    expect(trackX(slider)).toBeCloseTo(baseXFor(224, W, slider.gap), 4);
    for (const slot of slider.slots) {
      expect((slot.element as HTMLElement).style.width).toBe(`${W}px`);
    }
    // 中央のスロットの中心 = 画面（容器）の中央
    const center = slider.slots.find(s => s.offset === 0)!.element;
    expect(trackX(slider) + slotX(center) + W / 2).toBeCloseTo(224 / 2, 4);
    // 隣は 1 枚 + gap だけ離れている
    const right = slider.slots.find(s => s.offset === 1)!.element;
    expect(slotX(right) - slotX(center)).toBeCloseTo(W + slider.gap, 4);
  });

  it("ResizeObserver が無い環境でも動き、幅を変えると active を動かさずに測り直す", () => {
    const { slider } = make(["a", "b", "c"]);
    setWidth(slider, 224);
    const before = slider.activeMapID;
    Object.defineProperty(slider.element, "clientWidth", {
      value: 300,
      configurable: true
    });
    slider.refresh();
    expect(slider.activeMapID).toBe(before);
    expect(trackX(slider)).toBeCloseTo(
      baseXFor(300, cardWidthFor(300, slider.perView, slider.gap), slider.gap),
      4
    );
  });
});

describe("循環（リングバッファ）", () => {
  it("1 枚進めても押した要素は同じノードのまま中央へ来る", async () => {
    const { slider } = make(["a", "b", "c", "d"]);
    setWidth(slider, 224);
    const right = slider.slots.find(s => s.offset === 1)!;
    const rightEl = right.element;
    const rightMap = right.mapID;
    await slider.step(1);
    const now = slider.slots.find(s => s.offset === 0)!;
    expect(now.element).toBe(rightEl); // ノードは使い回す（貼り直さない）
    expect(now.mapID).toBe(rightMap);
    expect(slider.activeMapID).toBe(rightMap);
    expect(rightEl.isConnected).toBe(true);
  });

  it("遠端の付け替えで可視のノードの画面座標が動かない（±2 は容器の外）", async () => {
    const { slider } = make(["a", "b", "c", "d", "e"]);
    setWidth(slider, 224);
    const W = cardWidthFor(224, slider.perView, slider.gap);
    const stepWidth = W + slider.gap;
    const before = slider.slots.map(s => ({
      offset: s.offset,
      el: s.element,
      absX: trackX(slider) + slotX(s.element)
    }));
    await slider.step(1);
    const after = slider.slots.map(s => ({
      offset: s.offset,
      el: s.element,
      absX: trackX(slider) + slotX(s.element)
    }));
    // 同じノードは 1 枚分だけ左へ動く（見えている 3 枚）
    for (const b of before.filter(b => Math.abs(b.offset) <= 1)) {
      const a = after.find(a => a.el === b.el)!;
      expect(a.absX).toBeCloseTo(b.absX - stepWidth, 4);
    }
    // 中央だったノードは -1 へ、+1 だったノードは中央へ
    expect(after.find(a => a.offset === 0)!.el).toBe(
      before.find(b => b.offset === 1)!.el
    );
    expect(after.find(a => a.offset === -1)!.el).toBe(
      before.find(b => b.offset === 0)!.el
    );
    // 一番遠いノードだけが付け替わる
    expect(after.find(a => a.offset === 2)!.el).toBe(
      before.find(b => b.offset === -2)!.el
    );
  });

  it("N=2 は左右どちらの覗きを押しても押した側へ動く（M4(b)・M8）", async () => {
    // N=2 では「次」も「前」も同じ地図 b なので、`activeMapID` が "b" になることだけでは
    // 向きを確かめられない（M8）。**押したノードが offset 0 に来る**ことと、`onSelect` に渡った
    // `offset` の符号で確かめる。
    for (const [peekOffset, sign] of [
      [-1, -1],
      [1, 1]
    ] as const) {
      const { slider, calls } = make(["a", "b"]);
      setWidth(slider, 224);
      expect(slider.slots.map(s => s.mapID)).toEqual(["a", "b", "a", "b", "a"]);
      const peek = slider.slots.find(s => s.offset === peekOffset)!;
      const pressed = peek.element;
      pressed.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
      // onSelect は同期で呼ばれ、offset の符号が押した側
      expect(calls, `offset=${peekOffset}`).toHaveLength(1);
      expect(calls[0].id).toBe("b");
      expect(calls[0].offset).toBe(peekOffset);
      expect(Math.sign(calls[0].offset)).toBe(sign);
      // 押した側へ 1 枚動く: 押したノードが（同じノードのまま）offset 0 に来る
      await vi.waitFor(() =>
        expect(
          slider.slots.find(s => s.offset === 0)!.element,
          `offset=${peekOffset}`
        ).toBe(pressed)
      );
      expect(slider.activeMapID).toBe("b");
      slider.destroy();
    }
  });

  it("N=2 で 2 回進むと元の地図へ戻る（ずれない）", async () => {
    const { slider } = make(["a", "b"]);
    setWidth(slider, 224);
    await slider.step(1);
    expect(slider.activeMapID).toBe("b");
    await slider.step(1);
    expect(slider.activeMapID).toBe("a");
    expect(slider.activeIndex).toBe(0);
    await slider.step(-1);
    expect(slider.activeMapID).toBe("b");
  });
});

describe("クリック（D5: 押した直後に onSelect・地図を変えるのは onSelect だけ）", () => {
  it("中央を押すと onSelect(mapID, 0) で、動かない", async () => {
    const { slider, calls } = make(["a", "b", "c"]);
    setWidth(slider, 224);
    slider.slots
      .find(s => s.offset === 0)!
      .element.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
    await Promise.resolve();
    expect(calls).toHaveLength(1);
    expect(calls[0].id).toBe("a");
    expect(calls[0].offset).toBe(0);
    expect(slider.activeMapID).toBe("a");
  });

  it("右の覗きを押すと、動かし始めてすぐ onSelect(mapID, +1) を呼ぶ（step の完了を待たない）", async () => {
    const { slider, calls } = make(["a", "b", "c"]);
    setWidth(slider, 224);
    const right = slider.slots.find(s => s.offset === 1)!;
    right.element.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true })
    );
    // 同期のうちに呼ばれている（＝ step の完了を待っていない）
    expect(calls).toHaveLength(1);
    expect(calls[0].id).toBe("b");
    expect(calls[0].offset).toBe(1);
    expect(calls[0].activeAtCall).toBe("a"); // 呼ばれた時点ではまだ動いていない
    await vi.waitFor(() => expect(slider.activeMapID).toBe("b"));
    expect(slider.slots.find(s => s.offset === 0)!.element).toBe(right.element);
  });

  it("左の覗きを押すと onSelect(mapID, -1)", async () => {
    const { slider, calls } = make(["a", "b", "c"]);
    setWidth(slider, 224);
    slider.slots
      .find(s => s.offset === -1)!
      .element.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
    expect(calls).toHaveLength(1);
    expect(calls[0].id).toBe("c");
    expect(calls[0].offset).toBe(-1);
    await vi.waitFor(() => expect(slider.activeMapID).toBe("c"));
  });

  it("矢印は onSelect を呼ばない（地図は変わらない）", async () => {
    const { slider, calls } = make(["a", "b", "c"]);
    setWidth(slider, 224);
    const next = slider.element.querySelector(
      ".map-slider-nav.next"
    ) as HTMLElement;
    next.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true })
    );
    await vi.waitFor(() => expect(slider.activeMapID).toBe("b"));
    expect(calls).toHaveLength(0);
  });
});

describe("drag（P2: 1 枚上限＋抵抗 0.3 倍・drag 中は地図を変えない）", () => {
  it("1 枚を超えた分は 0.3 倍に落として、1 枚分を上限にする", async () => {
    const { slider } = make(["a", "b", "c"]);
    setWidth(slider, 224);
    const W = cardWidthFor(224, slider.perView, slider.gap);
    const stepWidth = W + slider.gap;
    const baseX = baseXFor(224, W, slider.gap);
    await drag(slider, -1.5 * stepWidth, {
      release: false,
      delayMs: 5,
      steps: 2
    });
    // 左へ 1.5 枚 → 1 枚 + 0.5 枚 * 0.3
    expect(trackX(slider) - baseX).toBeCloseTo(
      -(stepWidth + 0.5 * stepWidth * SLIDER_TUNING.dragResistance),
      3
    );
    window.dispatchEvent(pointer("pointerup", {}));
  });

  it("drag 中は onSelect を呼ばず、onActivePreview だけ出す", async () => {
    const previews: (string | null)[] = [];
    const { slider, calls } = make(["a", "b", "c"], {
      onActivePreview: (id: string | null) => previews.push(id)
    });
    setWidth(slider, 224);
    const W = cardWidthFor(224, slider.perView, slider.gap);
    const stepWidth = W + slider.gap;
    await drag(slider, -stepWidth * 0.8, {
      release: false,
      delayMs: 5,
      steps: 2
    });
    expect(calls).toHaveLength(0);
    expect(previews).toContain("b");
    window.dispatchEvent(pointer("pointerup", {}));
  });

  it("drag を離したとき、半分未満で速度も小さいと元へ戻る（地図は変わらない）", async () => {
    const { slider, calls } = make(["a", "b", "c"]);
    setWidth(slider, 224);
    const W = cardWidthFor(224, slider.perView, slider.gap);
    await drag(slider, -(W + slider.gap) * 0.25, { steps: 2, delayMs: 60 });
    await vi.waitFor(() =>
      expect(trackX(slider)).toBeCloseTo(baseXFor(224, W, slider.gap), 3)
    );
    expect(slider.activeMapID).toBe("a");
    expect(calls).toHaveLength(0);
  });

  it("drag を離したとき、半分以上なら 1 枚だけ動く（地図は変わらない）", async () => {
    const { slider, calls } = make(["a", "b", "c"]);
    setWidth(slider, 224);
    const W = cardWidthFor(224, slider.perView, slider.gap);
    await drag(slider, -(W + slider.gap) * 0.75, { steps: 2, delayMs: 5 });
    await vi.waitFor(() => expect(slider.activeMapID).toBe("b"));
    expect(calls).toHaveLength(0);
  });
});

describe("setSelectedMapID / setSelectedOnly / setItems", () => {
  it("隣は 1 枚のアニメ、遠いは 1 枚ずつ連続（飛ばさない）", async () => {
    const activeChanges: (string | null)[] = [];
    const { slider, calls } = make(["a", "b", "c", "d", "e"], {
      onActiveChange: (id: string | null) => activeChanges.push(id)
    });
    setWidth(slider, 224);
    slider.setSelectedMapID("b");
    await vi.waitFor(() => expect(slider.activeMapID).toBe("b"));
    expect(activeChanges).toEqual(["b"]);
    // 遠い（a から d へ = 3 枚）。active の変化は 1 枚ずつ
    activeChanges.length = 0;
    slider.setSelectedMapID("d");
    await vi.waitFor(() => expect(slider.activeMapID).toBe("d"));
    expect(activeChanges).toEqual(["c", "d"]);
    expect(calls).toHaveLength(0);
  });

  it("積める数（3）を超える遠い地図でも、1 枚ずつ最後まで動く（飛ばさない）", async () => {
    const activeChanges: (string | null)[] = [];
    const ids = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
    const { slider } = make(ids, {
      onActiveChange: (id: string | null) => activeChanges.push(id)
    });
    setWidth(slider, 224);
    slider.setSelectedMapID("f"); // 5 枚先（積める 3 を超える）
    await vi.waitFor(() => expect(slider.activeMapID).toBe("f"));
    // 途中で 1 枚より大きく飛ばない（1 枚ずつ b, c, d, e, f）
    expect(activeChanges).toEqual(["b", "c", "d", "e", "f"]);
    expect(slider.activeIndex).toBe(5);
  });

  it("無い mapID は無視し、null は選択を外す", async () => {
    const { slider } = make(["a", "b", "c"]);
    setWidth(slider, 224);
    slider.setSelectedMapID("zzz");
    expect(slider.activeMapID).toBe("a");
    expect(selectedSlots(slider).length).toBe(1);
    slider.setSelectedMapID(null);
    expect(slider.selectedMapID).toBe(null);
    expect(selectedSlots(slider).length).toBe(0);
  });

  it(".selected の数は N ごとに決まる（N=2 で 3・N>=3 で 1）", () => {
    for (const [ids, expected] of [
      [["a"], 1],
      [["a", "b"], 3],
      [["a", "b", "c"], 1],
      [["a", "b", "c", "d", "e"], 1]
    ] as [string[], number][]) {
      const { slider } = make(ids);
      setWidth(slider, 224);
      expect(selectedSlots(slider).length, `N=${ids.length}`).toBe(expected);
      slider.destroy();
    }
  });

  it("setSelectedOnly は .selected だけ動かし、active は動かさない", () => {
    const { slider } = make(["a", "b", "c"]);
    setWidth(slider, 224);
    slider.setSelectedOnly("b");
    expect(slider.activeMapID).toBe("a");
    expect(slider.selectedMapID).toBe("b");
    // N=3 で active=a のとき b は offset -2 と +1 に出るので、`.selected` は 2 枚（§4.3.4 の式）
    expect(selectedSlots(slider).map(el => el.dataset.mapId)).toEqual([
      "b",
      "b"
    ]);
  });

  it("setItems で選択中の地図が消えたら active に戻す", async () => {
    const { slider } = make(["a", "b", "c"]);
    setWidth(slider, 224);
    slider.setSelectedOnly("b");
    slider.setItems(makeItems(["a", "c", "d"]));
    expect(slider.count).toBe(3);
    expect(slider.activeMapID).toBe("a");
    expect(slider.selectedMapID).toBe("a");
  });

  it("setItems で N=1 と N>=2 を行き来するとスロット数が変わる", () => {
    const { slider } = make(["a", "b", "c"]);
    setWidth(slider, 224);
    expect(slider.slots.length).toBe(5);
    slider.setItems(makeItems(["a"]));
    expect(slider.slots.length).toBe(1);
    expect(slider.element.classList.contains("single-map")).toBe(true);
    slider.setItems(makeItems(["a", "b"]));
    expect(slider.slots.length).toBe(5);
    expect(slider.element.classList.contains("single-map")).toBe(false);
  });

  it("showBorder / setGroupLabel / setEnabled", () => {
    const { slider } = make(["a", "b", "c"]);
    setWidth(slider, 224);
    slider.setShowBorder(true);
    expect(slider.element.classList.contains("show-border")).toBe(true);
    slider.setShowBorder(false);
    expect(slider.element.classList.contains("show-border")).toBe(false);
    slider.setGroupLabel("背景地図");
    expect(slider.element.getAttribute("aria-label")).toBe("背景地図");
    slider.setEnabled(false);
    expect(slider.element.classList.contains("disabled")).toBe(true);
  });
});

describe("キーボード", () => {
  it("←/→/Home/End は 1 枚ずつ動き、Enter で active を選ぶ", async () => {
    const { slider, calls } = make(["a", "b", "c", "d"]);
    setWidth(slider, 224);
    const key = (k: string) =>
      slider.element.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: k,
          bubbles: true,
          cancelable: true
        })
      );
    key("ArrowRight");
    await vi.waitFor(() => expect(slider.activeMapID).toBe("b"));
    key("ArrowLeft");
    await vi.waitFor(() => expect(slider.activeMapID).toBe("a"));
    key("End");
    await vi.waitFor(() => expect(slider.activeMapID).toBe("d"));
    key("Home");
    await vi.waitFor(() => expect(slider.activeMapID).toBe("a"));
    expect(calls).toHaveLength(0); // キーの移動では地図を変えない
    key("Enter");
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ id: "a", offset: 0 });
  });
});

describe("読み上げ", () => {
  it("active の変化を aria-live で知らせ、選択中に aria-current を付ける", async () => {
    const { slider } = make(["a", "b", "c"]);
    setWidth(slider, 224);
    expect(live(slider).textContent).toBe("地図1");
    await slider.step(1);
    expect(live(slider).textContent).toBe("地図2");
    // `mapChanged` 相当（要素側が呼ぶ）で選択を合わせる
    slider.setSelectedOnly(slider.activeMapID);
    const selected = selectedSlots(slider);
    expect(selected).toHaveLength(1);
    expect(selected[0].getAttribute("aria-current")).toBe("true");
    const others = slider.slots.filter(s => s.offset !== 0).map(s => s.element);
    for (const el of others) expect(el.getAttribute("aria-current")).toBe(null);
  });
});

describe("destroy", () => {
  it("要素を外し、以後のイベントで例外を投げない", async () => {
    const { slider, calls } = make(["a", "b", "c"]);
    setWidth(slider, 224);
    const el = slider.element;
    slider.destroy();
    expect(el.isConnected).toBe(false);
    expect(() => {
      el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      el.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })
      );
      window.dispatchEvent(pointer("pointermove", { clientX: 10 }));
      window.dispatchEvent(pointer("pointerup", { clientX: 10 }));
    }).not.toThrow();
    await slider.step(1);
    slider.setSelectedMapID("b");
    slider.refresh();
    expect(calls).toHaveLength(0);
  });
});

describe("XSS（3 種）", () => {
  it("label の HTML はタグにならず文字のまま", () => {
    const { slider } = make([]);
    slider.setItems([
      {
        mapID: "a",
        label: `<img src=x onerror="window.__xss=1">`,
        thumbnail: null,
        isBasemap: false
      },
      { mapID: "b", label: "b", thumbnail: null, isBasemap: false }
    ]);
    setWidth(slider, 224);
    const label = slider.slots
      .find(s => s.offset === 0)!
      .element.querySelector(".map-slide-label") as HTMLElement;
    expect(label.querySelector("img")).toBe(null);
    expect(label.textContent).toContain("<img src=x");
    expect((window as any).__xss).toBeUndefined();
  });

  it("thumbnail の javascript: は画像にしない", () => {
    const { slider } = make([]);
    slider.setItems([
      {
        mapID: "a",
        label: "a",
        thumbnail: "javascript:alert(1)",
        isBasemap: false
      },
      {
        mapID: "b",
        label: "b",
        thumbnail: "https://example.com/ok.png",
        isBasemap: false
      }
    ]);
    setWidth(slider, 224);
    const bad = slider.slots.find(s => s.offset === 0)!.element;
    const badImg = bad.querySelector("img");
    expect(
      badImg === null ||
        !String(badImg.getAttribute("src") || "").startsWith("javascript:")
    ).toBe(true);
    const good = slider.slots
      .find(s => s.offset === 1)!
      .element.querySelector("img") as HTMLImageElement;
    expect(good.getAttribute("src")).toBe("https://example.com/ok.png");
  });

  it("mapID の属性注入は起きない（data-map-id は生の文字列）", () => {
    const evil = `x" onmouseover="window.__xss=1`;
    const { slider } = make([]);
    slider.setItems([
      { mapID: evil, label: "a", thumbnail: null, isBasemap: false },
      { mapID: "b", label: "b", thumbnail: null, isBasemap: false }
    ]);
    setWidth(slider, 224);
    const el = slider.slots.find(s => s.offset === 0)!.element;
    expect(el.dataset.mapId).toBe(evil);
    expect(el.hasAttribute("onmouseover")).toBe(false);
    expect(slider.element.querySelector("[onmouseover]")).toBe(null);
  });
});

describe("見出しの 2 行省略（D8: 旧 ellips と同じ手順・letter-spacing は触らない。1 文字だけは除く＝N5）", () => {
  const heads = (el: HTMLElement) => Array.from(el.querySelectorAll("span"));
  /** 1 行 N 文字とし、表示中の span の数から `offsetHeight` を作る（jsdom はレイアウトしない） */
  function stubLines(el: HTMLElement, perLine: number, lineHeight = 20) {
    Object.defineProperty(el, "offsetHeight", {
      configurable: true,
      get: () =>
        lineHeight *
        Math.max(
          1,
          Math.ceil(
            heads(el).filter(s => s.style.display !== "none").length / perLine
          )
        )
    });
  }

  it("1 文字ずつ span に分け、末尾に省略記号を置く（文字は失わない）", () => {
    const el = document.createElement("span");
    el.textContent = "あいうえお";
    document.body.appendChild(el);
    ellipsize(el);
    const spans = heads(el);
    expect(spans.length).toBe(6);
    expect(spans.slice(0, 5).map(s => s.textContent)).toEqual([
      "あ",
      "い",
      "う",
      "え",
      "お"
    ]);
    expect(spans[5].className).toBe("omit-mark");
    expect(spans[5].textContent).toBe("…");
    expect(el.textContent).toBe("あいうえお…");
    expect(el.style.letterSpacing).toBe("");
  });

  it("1 行に収まらないときは minimize（.8em 相当）を付けて縮める", () => {
    const el = document.createElement("span");
    el.textContent = "あ".repeat(40);
    document.body.appendChild(el);
    stubLines(el, 10);
    ellipsize(el);
    expect(el.classList.contains("minimize")).toBe(true);
    // 縮めたうえで 2 行に収まる分だけ出す（全部出し切らない）
    const shown = heads(el).filter(
      s => s.style.display !== "none" && s.className !== "omit-mark"
    ).length;
    expect(shown).toBeGreaterThan(10);
    expect(shown).toBeLessThan(40);
  });

  it("2 行を超える分は隠し、省略記号だけ残す", () => {
    const el = document.createElement("span");
    el.textContent = "あ".repeat(200);
    document.body.appendChild(el);
    stubLines(el, 10);
    ellipsize(el);
    const spans = heads(el);
    const omitted = spans.find(s => s.className === "omit-mark")!;
    expect(omitted.style.display).not.toBe("none");
    const visible = spans.filter(
      s => s.style.display !== "none" && s.className !== "omit-mark"
    ).length;
    expect(visible).toBeLessThanOrEqual(20);
  });

  const visibleChars = (el: HTMLElement) =>
    heads(el)
      .filter(s => s.style.display !== "none" && s.className !== "omit-mark")
      .map(s => s.textContent)
      .join("");
  const omitMarkOf = (el: HTMLElement) =>
    heads(el).find(s => s.className === "omit-mark") as HTMLElement;

  it("収まるときは省略記号を出さない", () => {
    const el = document.createElement("span");
    el.textContent = "あいう";
    document.body.appendChild(el);
    stubLines(el, 10);
    ellipsize(el);
    const omitted = heads(el).find(
      s => s.className === "omit-mark"
    ) as HTMLElement;
    expect(omitted.style.display).toBe("none");
  });

  // M1: 旧 `ellips` は `thisSpan`（実文字 + 省略記号）で数えていたので、収まるときは
  // 最後の 1 文字まで表示していた。新は省略記号を別に持つため、判定を `spans.length - 2` に
  // すると最後の 1 文字が隠れたまま残る（「あいう」→「あい」）。
  it("収まるときは全部の文字が表示される（M1）", () => {
    for (const [text, perLine] of [
      ["あいう", 10],
      ["あいうえお", 10],
      ["あい", 10]
    ] as [string, number][]) {
      const el = document.createElement("span");
      el.textContent = text;
      document.body.appendChild(el);
      stubLines(el, perLine);
      ellipsize(el);
      expect(visibleChars(el), `「${text}」の表示中の文字`).toBe(text);
      expect(omitMarkOf(el).style.display, `「${text}」の省略記号`).toBe(
        "none"
      );
    }
  });

  it("1 文字の見出しはそのまま出す（旧の癖を直した。N5）", () => {
    // 旧 `ellips` は `thisSpan.length - 1 === 1` なので「全部隠す」のループが先頭の文字を
    // 隠し、`…` だけが残っていた（実測の再現）。1 文字の見出しが `…` だけになるのは
    // 不具合なので、orchestrator の決定（N5）で「そのまま出す」に変えた。
    for (const text of ["A", "あ"]) {
      const el = document.createElement("span");
      el.textContent = text;
      document.body.appendChild(el);
      stubLines(el, 10);
      ellipsize(el);
      expect(visibleChars(el), `「${text}」の表示中の文字`).toBe(text);
      expect(omitMarkOf(el).style.display, `「${text}」の省略記号`).toBe(
        "none"
      );
      // 縮めもしない（1 文字は 2 行にあふれようがない）
      expect(el.classList.contains("minimize"), text).toBe(false);
    }
  });

  it("省略が解けたら minimize を外す（Minor 3）", () => {
    const el = document.createElement("span");
    el.textContent = "あ".repeat(40);
    document.body.appendChild(el);
    stubLines(el, 10);
    ellipsize(el);
    expect(el.classList.contains("minimize")).toBe(true);
    // 短い文字で呼び直す（`refresh()` と同じ経路）。前回の縮小を引きずらない
    ellipsize(el, 2, { text: "あいう" });
    expect(el.classList.contains("minimize")).toBe(false);
    expect(visibleChars(el)).toBe("あいう");
    expect(omitMarkOf(el).style.display).toBe("none");
  });

  it("HTML を入れても要素は増えない（文字のまま）", () => {
    const el = document.createElement("span");
    el.textContent = "<b>太字</b>";
    document.body.appendChild(el);
    ellipsize(el);
    expect(el.querySelector("b")).toBe(null);
    expect(el.textContent).toBe("<b>太字</b>…");
  });
});

describe("transition の付き方（既定の時間で 1 件だけ）", () => {
  it("step の移動には SLIDER_TUNING の時間と easing が付く", async () => {
    Object.assign(SLIDER_TUNING, savedTuning); // 既定の時間へ戻す
    SLIDER_TUNING.stepDurationMs = 250;
    SLIDER_TUNING.farStepDurationMs = 160;
    const { slider } = make(["a", "b", "c"]);
    setWidth(slider, 224);
    const promise = slider.step(1);
    const transition = track(slider).style.transition;
    expect(transition).toContain("transform");
    expect(transition).toContain("250ms");
    expect(transition).toContain("cubic-bezier(.22,.61,.36,1)");
    // jsdom には `matchMedia` が無いので `#canAnimate()` が偽になり、**この検査では待たずに
    // 即座に確定する**（`transitionend` も保険のタイマーも通らない。Minor 17）。
    // 実際の `transitionend` と「時間 + 120ms」の保険のタイマーの経路は Stage 2 の e2e で確かめる
    // （「時間を見る」検査は下の `stubMatchMedia` を使う describe）。
    await promise;
    expect(slider.activeMapID).toBe("b");
  }, 5000);
});

// ─────────────────────────────────────────────────────────────────────────────
// レビュー（2026-10-23）の指摘の直しのうち、jsdom で再現できるもの。
// M3（確定後の強制リフロー）だけは jsdom にレイアウトが無いので再現できない（Stage 2 の e2e）。
describe("レビュー指摘の直し（M2・Minor 1・2・4〜9・N8）", () => {
  it("drag 中に環の端でも preview が null にならない（M2）", async () => {
    const previews: (string | null)[] = [];
    const { slider } = make(["a", "b", "c", "d", "e"], {
      onActivePreview: (id: string | null) => previews.push(id)
    });
    setWidth(slider, 224);
    const W = cardWidthFor(224, slider.perView, slider.gap);
    const stepWidth = W + slider.gap;
    // 2 枚進むと active は c で、中心の物理スロットは 4（環の端）。
    // そこで「次」へ払うと、旧実装は `centerIndex + 1 === 5` で undefined → null を出していた。
    await slider.step(1);
    await slider.step(1);
    expect(slider.activeMapID).toBe("c");
    previews.length = 0;
    await drag(slider, -stepWidth * 0.8, {
      release: false,
      delayMs: 5,
      steps: 2
    });
    expect(previews.at(-1)).toBe("d");
    // 離すと 1 枚進み、active は d（中心の物理スロットは 0 になる）
    window.dispatchEvent(pointer("pointerup", {}));
    await vi.waitFor(() => expect(slider.activeMapID).toBe("d"));
    previews.length = 0;
    await drag(slider, stepWidth * 0.8, {
      release: false,
      delayMs: 5,
      steps: 2
    });
    expect(previews.at(-1)).toBe("c");
    window.dispatchEvent(pointer("pointerup", {}));
    expect(previews.every(id => id !== null)).toBe(true);
  });

  it("遠い地図は 1 枚あたり farStepDurationMs（160ms + 120ms の保険）で連続する（Minor 1）", async () => {
    stubMatchMedia();
    useShippedDurations();
    const delays: number[] = [];
    const originalSetTimeout = window.setTimeout.bind(window);
    const spy = vi.spyOn(window, "setTimeout").mockImplementation(((
      fn: any,
      ms?: number,
      ...args: any[]
    ) => {
      delays.push(Number(ms ?? 0));
      return originalSetTimeout(fn, ms, ...args);
    }) as any);
    const { slider } = make(["a", "b", "c", "d", "e"]);
    setWidth(slider, 224);
    slider.setSelectedMapID("c"); // 2 枚先
    await vi.waitFor(() => expect(slider.activeMapID).toBe("c"), {
      timeout: 5000
    });
    // `vi.waitFor` など他の道具のタイマーを拾わないよう、保険の待ちの範囲に絞る
    const waits = delays.filter(
      d =>
        d >= SLIDER_TUNING.transitionFallbackSlackMs &&
        d <=
          SLIDER_TUNING.farStepDurationMs +
            SLIDER_TUNING.transitionFallbackSlackMs
    );
    // 2 枚先はどちらも 160ms（+ 保険 120ms）。旧実装は「キューに残った数」で決めていたので
    // 250 + 250 になっていた
    expect(waits).toEqual([
      SHIPPED_TUNING.farStepDurationMs +
        SLIDER_TUNING.transitionFallbackSlackMs,
      SHIPPED_TUNING.farStepDurationMs + SLIDER_TUNING.transitionFallbackSlackMs
    ]);
    expect(spy).toHaveBeenCalled();
  }, 15000);

  it("積める数（3）を超える遠い地図でも、続きの 1 枚まで 160ms で動く（N8）", async () => {
    // 5 枚先だと「キューに積める 3 枚」を超える。旧実装は残りを確定後にもう一度 `#moveTo` で
    // 呼び直していたので、そのときの差が 1 枚（＝近い移動）になり、**最後の 1 枚だけ 250ms** に
    // なっていた（160×4 + 250）。続きも「遠い地図の連続」なので 160ms でなければならない。
    stubMatchMedia();
    useShippedDurations();
    const delays: number[] = [];
    const originalSetTimeout = window.setTimeout.bind(window);
    const spy = vi.spyOn(window, "setTimeout").mockImplementation(((
      fn: any,
      ms?: number,
      ...args: any[]
    ) => {
      delays.push(Number(ms ?? 0));
      return originalSetTimeout(fn, ms, ...args);
    }) as any);
    const { slider } = make(["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"]);
    setWidth(slider, 224);
    slider.setSelectedMapID("f"); // 5 枚先（積める 3 を超える）
    await vi.waitFor(() => expect(slider.activeMapID).toBe("f"), {
      timeout: 15000
    });
    // 保険の待ちは `transitionFallbackSlackMs` 〜 `stepDurationMs + slack` の範囲に絞る
    // （`vi.waitFor` などのタイマーを拾わないため）
    const waits = delays.filter(
      d =>
        d >= SLIDER_TUNING.transitionFallbackSlackMs &&
        d <=
          SHIPPED_TUNING.stepDurationMs +
            SLIDER_TUNING.transitionFallbackSlackMs
    );
    const far =
      SHIPPED_TUNING.farStepDurationMs +
      SLIDER_TUNING.transitionFallbackSlackMs;
    expect(waits).toEqual([far, far, far, far, far]);
    expect(spy).toHaveBeenCalled();
  }, 30000);

  it("step() の Promise は、動いている間はすぐ解決しない（Minor 2）", async () => {
    stubMatchMedia();
    useShippedDurations();
    const { slider } = make(["a", "b", "c"]);
    setWidth(slider, 224);
    const first = slider.step(1);
    let secondDone = false;
    const second = slider.step(1).then(() => {
      secondDone = true;
    });
    await Promise.resolve();
    // 旧実装は `#pump` が動いていると `Promise.resolve()` を返していたので、2 回目はすぐ解決した
    expect(secondDone).toBe(false);
    await Promise.all([first, second]);
    expect(secondDone).toBe(true);
    expect(slider.activeMapID).toBe("c");
  }, 15000);

  it("refresh() は前回の minimize を引きずらない（Minor 3）", async () => {
    const { slider } = make(["a", "b", "c"]);
    setWidth(slider, 224);
    const centerLabel = () =>
      slider.slots
        .find(s => s.offset === 0)!
        .element.querySelector(".map-slide-label") as HTMLElement;
    // 長い見出しにしてから、行数を 2 行と見なす測り方で refresh する
    slider.setItems([
      { mapID: "x", label: "あ".repeat(40), thumbnail: null, isBasemap: false },
      { mapID: "y", label: "b", thumbnail: null, isBasemap: false },
      { mapID: "z", label: "c", thumbnail: null, isBasemap: false }
    ]);
    const label = centerLabel();
    Object.defineProperty(label, "offsetHeight", {
      configurable: true,
      get: () =>
        20 *
        Math.max(
          1,
          Math.ceil(
            Array.from(label.querySelectorAll("span")).filter(
              s => s.style.display !== "none"
            ).length / 10
          )
        )
    });
    slider.refresh();
    expect(label.classList.contains("minimize")).toBe(true);
    // 短い見出しに戻して refresh すると minimize が外れる（旧実装は refresh で外さなかった）
    slider.setItems(makeItems(["a", "b", "c"]));
    slider.refresh();
    expect(centerLabel().classList.contains("minimize")).toBe(false);
  });

  it("CSS の幅の境界は SLIDER_TUNING.breakpointWidth と一致する（Minor 4・5）", () => {
    // Stage 2 で見た目は `styles.ts` の `MAPLAT_UI_CSS` へ移した。部品は自分の `<style>` を持たない。
    const css = MAPLAT_UI_CSS;
    const media = `@media screen and (max-width: ${SLIDER_TUNING.breakpointWidth}px) {`;
    expect(css).toContain(media);
    // `.touch` の縮小は、旧 UI と同じくそのメディアの中だけ（画面幅を問わず効かせない）
    const startAt = css.indexOf(media);
    let depth = 0;
    let endAt = startAt;
    for (let i = startAt; i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") {
        depth--;
        if (depth === 0) {
          endAt = i;
          break;
        }
      }
    }
    const outside = css.slice(0, startAt) + css.slice(endAt + 1);
    expect(outside).not.toContain(".map-slider.touch .map-slide-label");
    expect(css).toContain(
      ".map-slider.touch .map-slide-label.minimize { font-size: .6em; }"
    );
    expect(css).toContain(
      ".map-slider.touch .map-slide-label { font-size: .8em; }"
    );
  });

  it("ResizeObserver が無い環境で足した resize のリスナーを destroy が外す（Minor 6）", () => {
    const saved = (window as any).ResizeObserver;
    delete (window as any).ResizeObserver;
    try {
      const { slider } = make(["a", "b", "c"]);
      const remove = vi.spyOn(window, "removeEventListener");
      slider.destroy();
      expect(remove.mock.calls.some(call => call[0] === "resize")).toBe(true);
    } finally {
      if (saved) (window as any).ResizeObserver = saved;
    }
  });

  it("動いている最中は drag を始めない（Minor 8）", async () => {
    stubMatchMedia();
    useShippedDurations();
    const { slider } = make(["a", "b", "c"]);
    setWidth(slider, 224);
    void slider.step(1);
    const add = vi.spyOn(window, "addEventListener");
    const center = slider.slots.find(s => s.offset === 0)!.element;
    center.dispatchEvent(pointer("pointerdown", { clientX: 100 }));
    // drag のリスナー（window の pointermove）を張らない
    expect(
      add.mock.calls.filter(call => call[0] === "pointermove").length
    ).toBe(0);
    await vi.waitFor(() => expect(slider.activeMapID).toBe("b"), {
      timeout: 5000
    });
  }, 15000);

  it("矢印の読み上げ名を差し替えられる（Minor 9）", () => {
    const { slider } = make(["a", "b"], {
      navLabels: { prev: "前の地図（英語）", next: "次の地図（英語）" }
    });
    const label = (kind: string) =>
      slider.element
        .querySelector(`.map-slider-nav.${kind}`)!
        .getAttribute("aria-label");
    expect(label("prev")).toBe("前の地図（英語）");
    expect(label("next")).toBe("次の地図（英語）");
    // 指定しなければ既定（「次の地図」＝新しい名前。旧 UI にはこの文字は無い。N6）
    const { slider: plain } = make(["a", "b"]);
    expect(
      plain.element
        .querySelector(".map-slider-nav.next")!
        .getAttribute("aria-label")
    ).toBe("次の地図");
  });
});

describe("レビュー指摘の直し（Stage 2 の Major・Minor）", () => {
  it("遷移の保険: 時間が来ても目標に着いていなければ待ち、transitionend で確定する（Minor）", async () => {
    stubMatchMedia();
    useShippedDurations();
    vi.useFakeTimers();
    // jsdom にはレイアウトと DOMMatrixReadOnly が無いので、描かれている位置を差し替える
    let drawnX = 0;
    (window as any).DOMMatrixReadOnly = class {
      m41: number;
      constructor() {
        this.m41 = drawnX;
      }
    };
    const realGetComputedStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, "getComputedStyle").mockImplementation(((
      el: Element,
      pseudo?: string | null
    ) => {
      const cs = realGetComputedStyle(el, pseudo);
      if ((el as HTMLElement).classList?.contains("map-slider-track"))
        return { ...cs, transform: "matrix(1, 0, 0, 1, 0, 0)" } as any;
      return cs;
    }) as any);
    try {
      const { slider } = make(["a", "b", "c"]);
      setWidth(slider, 224);
      const track = slider.element.querySelector(
        ".map-slider-track"
      ) as HTMLElement;
      drawnX = 99999; // 目標から遠い＝まだ動いている
      void slider.step(1);
      const slack = SLIDER_TUNING.transitionFallbackSlackMs;
      await vi.advanceTimersByTimeAsync(SHIPPED_TUNING.stepDurationMs + slack);
      // 1 回目の保険の時点では確定しない（遷移を切らない）
      expect(slider.activeMapID).toBe("a");
      // transitionend が来たら確定する
      const end = new Event("transitionend") as any;
      end.propertyName = "transform";
      track.dispatchEvent(end);
      await vi.advanceTimersByTimeAsync(0);
      expect(slider.activeMapID).toBe("b");

      // transitionend が来なくても、最後の保険（時間 + 保険 × 2）で確定する（止まらない）
      void slider.step(1);
      await vi.advanceTimersByTimeAsync(SHIPPED_TUNING.stepDurationMs + slack);
      expect(slider.activeMapID).toBe("b");
      await vi.advanceTimersByTimeAsync(
        SHIPPED_TUNING.stepDurationMs + slack * 2
      );
      expect(slider.activeMapID).toBe("c");
    } finally {
      vi.useRealTimers();
      delete (window as any).DOMMatrixReadOnly;
    }
  });

  it("遷移が始まった後に消されたら（transitioncancel）待たずに確定する。始まる前の cancel は無視（Major 1）", async () => {
    stubMatchMedia();
    useShippedDurations();
    vi.useFakeTimers();
    try {
      const { slider } = make(["a", "b", "c"]);
      setWidth(slider, 224);
      const track = slider.element.querySelector(
        ".map-slider-track"
      ) as HTMLElement;
      const fire = (type: string) => {
        const ev = new Event(type) as any;
        ev.propertyName = "transform";
        track.dispatchEvent(ev);
      };
      void slider.step(1);
      // 前の 1 歩の遅れた cancel（この 1 歩の transitionrun の前）は無視する
      fire("transitioncancel");
      await vi.advanceTimersByTimeAsync(0);
      expect(slider.activeMapID).toBe("a");
      fire("transitionrun");
      fire("transitioncancel");
      await vi.advanceTimersByTimeAsync(0);
      expect(slider.activeMapID).toBe("b");
    } finally {
      vi.useRealTimers();
    }
  });

  it("選択中のカードは part に map-slide-selected も持つ（P4・Major 4）", () => {
    const { slider } = make(["a", "b", "c"]);
    setWidth(slider, 224);
    slider.setSelectedMapID("a", false);
    const parts = () =>
      Array.from(
        slider.element.querySelectorAll<HTMLElement>('[part~="map-slide"]')
      ).map(el => [el.dataset.mapId, el.getAttribute("part")]);
    for (const [mapID, part] of parts())
      expect(part).toBe(
        mapID === "a" ? "map-slide map-slide-selected" : "map-slide"
      );
    slider.setSelectedOnly("b");
    for (const [mapID, part] of parts())
      expect(part).toBe(
        mapID === "b" ? "map-slide map-slide-selected" : "map-slide"
      );
  });

  it("サムネイルは crossOrigin を付けず、読めなければ頭文字のプレースホルダに替える（Major 5）", () => {
    const items = makeItems(["a", "b", "c"]).map(item => ({
      ...item,
      thumbnail: `./tmbs/${item.mapID}.jpg`
    }));
    const { slider } = make(["a", "b", "c"], {
      items,
      placeholder: (label: string) => {
        const span = document.createElement("span");
        span.className = "thumb none";
        span.textContent = Array.from(label)[0] ?? "?";
        return span;
      }
    });
    setWidth(slider, 224);
    const imgs = Array.from(
      slider.element.querySelectorAll<HTMLImageElement>("img.map-slide-thumb")
    );
    expect(imgs.length).toBeGreaterThan(0);
    for (const img of imgs) expect(img.hasAttribute("crossorigin")).toBe(false);
    const broken = imgs.find(
      img => img.getAttribute("src") === "./tmbs/b.jpg"
    )!;
    broken.dispatchEvent(new Event("error"));
    const cardsOf = (mapID: string) =>
      Array.from(
        slider.element.querySelectorAll<HTMLElement>(
          `[part~="map-slide"][data-map-id="${mapID}"]`
        )
      );
    for (const card of cardsOf("b")) {
      expect(card.querySelector("img")).toBeNull();
      expect(card.querySelector(".thumb.none")!.textContent).toBe("地");
    }
    for (const card of cardsOf("a"))
      expect(card.querySelector("img.map-slide-thumb")).not.toBeNull();
  });

  it("CSS: 自動非表示は題名とスライダーにも効き、タッチの右列は安全領域を消さず、書体を固定しない（Major 1〜3）", () => {
    const css = MAPLAT_UI_CSS;
    expect(css).toContain(".map-title.fade");
    expect(css).toContain(".map-slider.fade { display: none; }");
    expect(css).toMatch(/\.frame\.touch \.ctl-column \{ gap: \.5px; \}/);
    expect(css).not.toMatch(/\.frame\.touch \.ctl-column \{[^}]*bottom/);
    expect(css).not.toContain("font-family: Times");
    expect(css).not.toContain("Helvetica");
    expect(css).toMatch(/\.ctl button \{[^}]*font-family: inherit;/);
    expect(css).toMatch(/\.ctl button \{[^}]*line-height: normal;/);
  });
});
