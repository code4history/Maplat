// @vitest-environment jsdom
// 旧 UI API（`MaplatUi` クラス）の互換層でも、操作ボタンの列とヘルプの全体の図が
// 同じ `<maplat-ui>` の中に組まれることの確認（互換層は要素を作って使うので、要素側の
// 変更がそのまま効く）。
//
// 層 A（Core の `MaplatApp`）は実物を使い、地図の実体（OpenLayers）は `sources: []` で起動する
// （spec/legacy-lifecycle.spec.ts と同じ作り方）。
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import "@maplat/core/element";
import { MaplatUi } from "../src/index";
import type { MaplatUiElement } from "../src/element";

const SETTING = {
  appName: { ja: "互換層の操作ボタン", en: "Legacy control spacing" },
  sources: [],
  homePosition: [139.5, 36.2],
  defaultZoom: 14
};

beforeEach(() => {
  if (typeof (globalThis as any).ResizeObserver === "undefined") {
    const noop = () => undefined;
    (globalThis as any).ResizeObserver = class {
      observe = noop;
      unobserve = noop;
      disconnect = noop;
    };
  }
  document.head.innerHTML = "<title></title>";
  document.body.innerHTML = '<div id="map_div"></div>';
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe("旧 UI API（MaplatUi）と操作ボタンの列・ヘルプの図", () => {
  it("互換層の <maplat-ui> でも 3 つの列と全体の図が組み立てられる", async () => {
    const ui = await MaplatUi.createObject({
      appid: "legacy-control-spacing",
      setting: { ...SETTING }
    } as any);
    try {
      await ui.splashPromise;
      const host = document.querySelector("maplat-ui") as
        (MaplatUiElement & HTMLElement) | null;
      expect(host).toBeTruthy();
      await host!.ready;
      const root = host!.shadowRoot!;
      // 左上（ズーム・GPS・ホーム）・左下（ヘルプ・共有）・右下の 3 つの列
      expect(root.querySelectorAll(".ctl-column").length).toBe(3);
      expect(root.querySelector(".ctl-column-top-left")).not.toBeNull();
      expect(root.querySelector(".ctl-column-bottom-left")).not.toBeNull();
      expect(root.querySelector(".ctl-column-bottom-right")).not.toBeNull();
      // ヘルプを開くと、同じ要素の中に全体の図が出る
      (root.querySelector(".ctl-help button") as HTMLButtonElement).click();
      const figure = root.querySelector(".help-figure") as HTMLElement | null;
      expect(figure).not.toBeNull();
      expect(figure!.getAttribute("aria-hidden")).toBe("true");
    } finally {
      ui.remove();
    }
  }, 120000);
});
