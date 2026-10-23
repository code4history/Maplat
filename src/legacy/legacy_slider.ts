// 旧 `ui.sliderNew`（透過度のスライダー）の限定 facade（設計 v2 §3 L13・§2.3.6 (7)・M6）。
//
// 旧 UI の透過度のスライダーは OL の Control（`src/maplat_control.ts` の `SliderNew`）で、
// `get("slidervalue")` / `set("slidervalue", 0..1)` と `propertychange` を持っていた。
// 互換層では層 B の `<maplat-ui>` の `transparency` 属性（0..100。**0 が不透明・100 が透明**。
// 旧 `slidervalue` × 100 ＝ 透過度。旧 `ui_init.ts:1451`）へ書き、値は子の `<maplat-app>` が書き戻す
// `transparency` 属性（利用者がスライダーを動かしても層 A が書き戻す）から読む（レビュー m1）。
//
// **旧 UI のファイル（`maplat_control.ts`）は import しない**（`spec/legacy-deps.spec.ts`）。

import type { MaplatUiElement } from "../element";

export interface LegacySlider {
  /** 旧 `control.element`（層 B の中の input。無ければ null） */
  readonly element: HTMLInputElement | null;
  /** 旧 `control.get("slidervalue")`（0..1。0 が不透明） */
  get: (key: string) => number | undefined;
  /** 旧 `control.set("slidervalue", 0..1)`（`transparency` 属性を書く） */
  set: (key: string, value: number) => void;
  /** 旧 `setValue`（0..1） */
  setValue: (value: number) => void;
  /** 旧 `setEnable`（地図の準備前は無効） */
  setEnable: (flag: boolean) => void;
  on: (type: "propertychange", handler: (event: unknown) => void) => void;
  off: (type: "propertychange", handler: (event: unknown) => void) => void;
  un: (type: "propertychange", handler: (event: unknown) => void) => void;
}

/** 互換層だけが使う口（ホストができた・外れたときに見張りを付け外しする）。 */
export interface LegacySliderBinding {
  attach: () => void;
  detach: () => void;
}

export type LegacySliderFacade = LegacySlider & LegacySliderBinding;

export function createLegacySlider(
  host: () => MaplatUiElement | null
): LegacySliderFacade {
  const listeners = new Set<(event: unknown) => void>();
  let observer: MutationObserver | null = null;
  let last = -1;

  const current = (): MaplatUiElement | null => host();

  /** 子の `<maplat-app>`（層 A。操作のたびに `transparency` 属性を書き戻す）。 */
  const child = (el: MaplatUiElement | null): Element | null =>
    el?.querySelector(":scope > maplat-app") ?? null;

  /** 0..100 の数を読む（読めなければ undefined）。 */
  const readAttr = (el: Element | null | undefined): number | undefined => {
    const attr = el?.getAttribute("transparency");
    if (attr === null || attr === undefined || attr === "") return undefined;
    const n = Number(attr);
    return Number.isFinite(n) ? n : undefined;
  };

  /**
   * 今の透過度（0..1）。子が書き戻した属性 ＞ 層 A の `getTransparency()` ＞ ホストの属性 ＞ 0。
   * 利用者のスライダー操作は層 B が層 A の `setTransparency` を呼ぶので、ホストの属性は変わらない（m1）。
   */
  const valueOf = (): number => {
    const el = current();
    let raw = readAttr(child(el));
    if (raw === undefined) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const core = (el?.app as any)?.app;
        const n = Number(core?.getTransparency?.());
        if (core && Number.isFinite(n)) raw = n;
      } catch {
        // 層 A がまだ無い
      }
    }
    if (raw === undefined) raw = readAttr(el);
    return raw === undefined ? 0 : Math.min(1, Math.max(0, raw / 100));
  };

  const emit = () => {
    const value = valueOf();
    if (value === last) return;
    const oldValue = last;
    last = value;
    for (const listener of [...listeners]) {
      listener({
        type: "propertychange",
        key: "slidervalue",
        oldValue,
        newValue: value
      });
    }
  };

  /**
   * ホストと子（light DOM の `<maplat-app>`）の `transparency` 属性を見張る（subtree で子も入る。
   * 子は起動の後に作られるので、ホストの subtree を見る）。購読（`on`）か `set` の時点で始める。
   */
  const watch = () => {
    const el = current();
    if (!el || observer || typeof MutationObserver === "undefined") return;
    last = valueOf();
    observer = new MutationObserver(() => emit());
    observer.observe(el, {
      attributes: true,
      attributeFilter: ["transparency"],
      subtree: true
    });
  };

  const facade: LegacySliderFacade = {
    get element() {
      const el = current();
      return el?.shadowRoot
        ? el.shadowRoot.querySelector<HTMLInputElement>("input.slider")
        : null;
    },
    get: key => (key === "slidervalue" ? valueOf() : undefined),
    set: (key, value) => {
      if (key !== "slidervalue") return;
      const el = current();
      if (!el) return;
      const number = Number(value);
      if (!Number.isFinite(number)) return;
      const clamped = Math.min(1, Math.max(0, number));
      watch();
      el.setAttribute("transparency", `${Math.round(clamped * 100)}`);
    },
    setValue: value => facade.set("slidervalue", value),
    // 層 B の部品へ委譲する（Shadow DOM の中の input を直接触らない）
    setEnable: flag => current()?.setTransparencyEnabled(!!flag),
    on: (type, handler) => {
      if (type !== "propertychange") return;
      listeners.add(handler);
      watch();
    },
    off: (type, handler) => {
      if (type === "propertychange") listeners.delete(handler);
    },
    un: (type, handler) => {
      if (type === "propertychange") listeners.delete(handler);
    },
    // 起動の前に `on` された購読も、ホストができたら見張りを始める
    attach: () => {
      if (listeners.size > 0) watch();
    },
    detach: () => {
      observer?.disconnect();
      observer = null;
    }
  };
  return facade;
}
