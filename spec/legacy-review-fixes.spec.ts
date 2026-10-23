// Stage 3 のレビュー（`_prompts/2026-10-24-ui-stage3-review.md`）の直しの単体テスト。
//
//  M1 `xyToMapIDs`: 層 A の `sysCoord2MercAsync`（`Promise<[x, y]>`）を待ってから経緯度に直し、
//     層 B の `mapsAt` に渡す（直す前は `Promise.all(Promise)` で必ず reject していた）。`areaIndex` は `shared/geo.ts`
//  M2 `showContextMenu` の位置: `at` は枠の中の座標。ホストが画面の左上に無いページでも二重に引かない
//  m1 `sliderNew`: 利用者の操作（子の `transparency` 属性の書き戻し）を `get`・`propertychange` に映す。`setEnable` は委譲
//  m2 `lang`・`_t`・`i18n` は代入しても例外にならない（`lang` は属性へ、`_t`・`i18n` は警告して無視）
//  m3 起動前の `translate` は `pickLocalized` と同じ（全言語が空なら ""。旧 #251）
//  m4 `resolveRelativeLink` は 1 本（`null` は "."）
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MaplatUi } from "../src/index";
import "../src/element";
// eslint-disable-next-line no-duplicate-imports
import type { MaplatUiElement } from "../src/element";
import { areaIndex, mercToLngLat } from "../src/shared/geo";
import { resolveRelativeLink } from "../src/shared/text";
import { xyToMapIDs } from "../src/legacy/legacy_geo";

const SETTING = {
  appName: { ja: "レビューの直し", en: "Review fixes" },
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

afterEach(() => {
  vi.restoreAllMocks();
});

const rect = (left: number, top: number, width: number, height: number) =>
  ({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({})
  }) as DOMRect;

describe("M1 xyToMapIDs（sysCoord2MercAsync の Promise を待ち、mapsAt に経緯度で渡す）", () => {
  it("merc を経緯度に直す式（EPSG:3857）", () => {
    const p = mercToLngLat([15532269.24, 4334586.92]);
    expect(p.longitude).toBeCloseTo(139.53, 2);
    expect(p.latitude).toBeCloseTo(36.249, 2);
    const o = mercToLngLat([0, 0]);
    expect(o.longitude).toBeCloseTo(0, 9);
    expect(o.latitude).toBeCloseTo(0, 9);
  });

  it("層 A の Promise<[x, y]> を待ち、mapsAt(経緯度, threshold) の結果をそのまま返す", async () => {
    const sysCoord2MercAsync = vi.fn(async (xy: number[]) => [
      xy[0] * 2,
      xy[1] * 2
    ]);
    const core = { from: { sysCoord2MercAsync } } as any;
    const mapsAt = vi.fn(async () => ["b", "c"]);
    const host = { mapsAt } as any;
    await expect(xyToMapIDs(core, host, [100, 200], 7)).resolves.toEqual([
      "b",
      "c"
    ]);
    expect(sysCoord2MercAsync).toHaveBeenCalledWith([100, 200]);
    const [point, threshold] = mapsAt.mock.calls[0] as unknown as [
      { longitude: number; latitude: number },
      number
    ];
    expect(threshold).toBe(7);
    const expected = mercToLngLat([200, 400]);
    expect(point.longitude).toBeCloseTo(expected.longitude, 12);
    expect(point.latitude).toBeCloseTo(expected.latitude, 12);
  });

  it("層 A・ホストが無い・変換の口が無いときは空の配列（reject しない）", async () => {
    await expect(xyToMapIDs(undefined, undefined, [0, 0])).resolves.toEqual([]);
    await expect(
      xyToMapIDs({ from: {} } as any, { mapsAt: vi.fn() } as any, [0, 0])
    ).resolves.toEqual([]);
  });

  it("起動後の ui.xyToMapIDs も reject しない（地図 0 枚の実物の層 A）", async () => {
    const ui = await MaplatUi.createObject({
      appid: "review-xy",
      setting: { ...SETTING }
    } as any);
    try {
      await expect(ui.xyToMapIDs([0, 0])).resolves.toEqual([]);
    } finally {
      ui.remove();
    }
  }, 120000);

  it("areaIndex は旧の式（shared/geo.ts の純関数。ui.areaIndex も同じ値）", () => {
    const square = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0]
    ];
    expect(areaIndex(square)).toBe(100);
    expect(new MaplatUi({} as any).areaIndex(square)).toBe(100);
  });
});

describe("M2 showContextMenu の位置（ホストが画面の左上に無いページ）", () => {
  it("at は枠の中の座標: 枠が (100, 50) にあっても引き直さない", () => {
    document.body.innerHTML = "<maplat-ui></maplat-ui>";
    const host = document.querySelector("maplat-ui") as MaplatUiElement;
    const frame = host.shadowRoot!.querySelector(".frame") as HTMLElement;
    vi.spyOn(frame, "getBoundingClientRect").mockReturnValue(
      rect(100, 50, 800, 600)
    );
    host.showMenu({ items: [{ text: "A" }], at: { x: 40, y: 30 } });
    const menu =
      host.shadowRoot!.querySelector<HTMLElement>('[part="poi-menu"]')!;
    expect(menu.style.left).toBe("40px");
    expect(menu.style.top).toBe("30px");
  });

  it("旧 API: ホスト基準の lastClickPixel（pointerdown の client − ホストの位置）の位置に出る", async () => {
    document.body.innerHTML =
      '<div style="position:relative"><div id="map_div"></div></div>';
    const ui = await MaplatUi.createObject({
      appid: "review-menu",
      setting: { ...SETTING }
    } as any);
    try {
      const host = document.querySelector("maplat-ui") as MaplatUiElement;
      const frame = host.shadowRoot!.querySelector(".frame") as HTMLElement;
      vi.spyOn(host, "getBoundingClientRect").mockReturnValue(
        rect(100, 50, 800, 600)
      );
      vi.spyOn(frame, "getBoundingClientRect").mockReturnValue(
        rect(100, 50, 800, 600)
      );
      // 地図（子）の上の pointerdown。client (140, 80) ＝ ホストの中の (40, 30)
      const app = host.querySelector("maplat-app") as HTMLElement;
      const down = new MouseEvent("pointerdown", {
        bubbles: true,
        clientX: 140,
        clientY: 80
      });
      app.dispatchEvent(down);
      expect(ui.lastClickPixel).toEqual([40, 30]);
      ui.showContextMenu([{ text: "項目", callback: () => undefined }] as any);
      const menu =
        host.shadowRoot!.querySelector<HTMLElement>('[part="poi-menu"]')!;
      expect(menu.hidden).toBe(false);
      // 直す前は 40 − 100 → 0（左上へずれた）
      expect(menu.style.left).toBe("40px");
      expect(menu.style.top).toBe("30px");
    } finally {
      ui.remove();
    }
  }, 120000);
});

describe("m1 sliderNew（利用者の操作を映す・setEnable は委譲）", () => {
  it("子の transparency 属性（層 A の書き戻し）を get と propertychange に映す", async () => {
    const ui = new MaplatUi({
      appid: "review-slider",
      setting: { ...SETTING }
    } as any);
    const events: any[] = [];
    // 起動前に購読しても、ホストができたら見張りを始める
    ui.sliderNew.on("propertychange", e => events.push(e));
    await ui.waitReady();
    try {
      const app = document.querySelector("maplat-app") as HTMLElement;
      app.setAttribute("transparency", "30");
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(ui.sliderNew.get("slidervalue")).toBeCloseTo(0.3, 9);
      expect(events.at(-1)).toMatchObject({
        type: "propertychange",
        key: "slidervalue",
        newValue: 0.3
      });
    } finally {
      ui.remove();
    }
  }, 120000);

  it("setEnable は要素の setTransparencyEnabled へ委譲する", async () => {
    const spy = vi.spyOn(
      (customElements.get("maplat-ui") as any).prototype,
      "setTransparencyEnabled"
    );
    const ui = await MaplatUi.createObject({
      appid: "review-slider-enable",
      setting: { ...SETTING }
    } as any);
    try {
      ui.sliderNew.setEnable(false);
      expect(spy).toHaveBeenLastCalledWith(false);
      expect(ui.sliderNew.element?.disabled).toBe(true);
      ui.sliderNew.setEnable(true);
      expect(ui.sliderNew.element?.disabled).toBe(false);
    } finally {
      ui.remove();
    }
  }, 120000);
});

describe("m2 lang・_t・i18n への代入（strict でも例外にしない）", () => {
  it("lang は属性へ流し、_t・i18n は警告して無視する", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const ui = await MaplatUi.createObject({
      appid: "review-lang",
      setting: { ...SETTING }
    } as any);
    try {
      // ES モジュールは strict（旧の getter だけだと、ここで TypeError になっていた）
      expect(() => {
        ui.lang = "en";
      }).not.toThrow();
      const host = document.querySelector("maplat-ui") as HTMLElement;
      expect(host.getAttribute("lang")).toBe("en");
      const t = ui._t;
      expect(() => {
        (ui as any)._t = () => "x";
      }).not.toThrow();
      expect(() => {
        (ui as any).i18n = {};
      }).not.toThrow();
      expect(typeof ui._t).toBe(typeof t);
      expect(
        warn.mock.calls.filter(c =>
          /_t is read-only|i18n is read-only/.test(String(c[0]))
        )
      ).toHaveLength(2);
    } finally {
      ui.remove();
    }
  }, 120000);

  // 積み残し（Stage 3 の再レビューの Info）: 起動前の代入は**起動するまでの読み値だけ**。
  // 起動すると `#createHost` は `option.lang` しか流さないので、言語は要素が決める
  // （旧も `ui_init` が起動時に言語を上書きしていたので、振る舞いは旧と同じ）。
  it("起動前の lang の代入は、起動するまでの読み値にだけ出る", () => {
    const ui = new MaplatUi({ setting: { ...SETTING } } as any);
    ui.lang = "en";
    expect(ui.lang).toBe("en");
    // 起動前の断片の選択にも効く（ホストが無いので pickLocalized で選ぶ）
    expect(ui.translate({ ja: "J", en: "E" })).toBe("E");
  });
});

describe("m3 起動前の translate（要素の pickLocalized と同じ。旧 #251）", () => {
  it("全言語が空なら空文字、今の言語が空なら en、無ければ最初の非空", () => {
    const ui = new MaplatUi({ lang: "ja", setting: { ...SETTING } } as any);
    expect(ui.translate({ ja: "", en: "" })).toBe("");
    expect(ui.translate({ ja: "", en: "E", de: "D" })).toBe("E");
    expect(ui.translate({ ja: "", de: "D" })).toBe("D");
    expect(ui.translate({ ja: "J", en: "E" })).toBe("J");
    expect(ui.translate("文字")).toBe("文字");
  });
});

describe("m4 resolveRelativeLink（shared/text.ts の 1 本）", () => {
  it("/ を含めばそのまま、含まなければ fallbackPath の下（null・空は .）", () => {
    expect(resolveRelativeLink("a/b.png", "img")).toBe("a/b.png");
    expect(resolveRelativeLink("b.png", "img")).toBe("img/b.png");
    expect(resolveRelativeLink("b.png", null)).toBe("./b.png");
    expect(resolveRelativeLink("b.png", "")).toBe("./b.png");
    const ui = new MaplatUi({} as any);
    expect(ui.resolveRelativeLink("b.png", null)).toBe("./b.png");
  });
});
