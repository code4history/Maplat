// 旧 API の互換層の仕上げ（実ブラウザの e2e で見つかった互換層・要素の直し）の単体テスト。
//
//  1. ホストの寸法: 旧 Core の地図の箱と同じく、いちばん近い位置指定の祖先を埋める（絶対配置）
//     （`e2e/fixtures/legacy-api.html` 等は `#map_div` の高さが 0 で、旧は子の絶対配置で埋めていた）
//  2. 層 A のイベントの再送出: `ui.addEventListener("clickMarker", fn)` に
//     `{ type, detail }` が届く。`uiReady` は出さない。`remove()` の後は出さない
//  3. 旧 `pwaWorker: false / null` は Service Worker を登録しない（`disablePwaWorker`。e2e nov26-m5-t3）
//  4. 旧 UI と同じく、起動時にメディアの表示部品を先に読む（Quyuan。同梱の Chuci の cc-swiper も登録される。`preloadMediaViewer`。e2e oct26-m9-t1-chuci-arrow）
//  5. 汎用メニュー（旧 showContextMenu）は地図の切り替え（mapChanged）では閉じない（e2e legacy-api で確認する）
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MaplatUi } from "../src/index";
import { MaplatUiElement } from "../src/element";
import { initPwa } from "../src/element/pwa";

const SETTING = {
  appName: { ja: "仕上げの基準", en: "Finish baseline" },
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

describe("ホストの寸法（旧 Core の地図の箱と同じ絶対配置）", () => {
  it("<maplat-ui> は position:absolute で上下左右 0（width/height は auto）", async () => {
    const ui = await MaplatUi.createObject({
      appid: "legacy-finish-size",
      setting: { ...SETTING }
    } as any);
    try {
      const host = document.querySelector("maplat-ui") as HTMLElement;
      expect(host.style.position).toBe("absolute");
      for (const side of ["top", "left", "right", "bottom"] as const)
        expect(host.style[side]).toMatch(/^0(px)?$/);
      expect(host.style.width).toBe("auto");
      expect(host.style.height).toBe("auto");
    } finally {
      ui.remove();
    }
  }, 120000);
});

describe("層 A のイベントの再送出", () => {
  it("子が出した clickMarker が ui の listener に { type, detail } で届き、uiReady は届かない", async () => {
    const ui = await MaplatUi.createObject({
      appid: "legacy-finish-events",
      setting: { ...SETTING }
    } as any);
    const got: Array<{ type: string; detail: unknown }> = [];
    try {
      ui.addEventListener("clickMarker", (evt: any) =>
        got.push({ type: evt.type, detail: evt.detail })
      );
      ui.addEventListener("uiReady", (evt: any) =>
        got.push({ type: evt.type, detail: evt.detail })
      );
      const app = document.querySelector("maplat-app") as HTMLElement;
      const datum = { id: "p1", name: "POI" };
      app.dispatchEvent(
        new CustomEvent("clickMarker", { bubbles: true, detail: datum })
      );
      app.dispatchEvent(
        new CustomEvent("uiReady", { bubbles: true, detail: {} })
      );
      expect(got).toEqual([{ type: "clickMarker", detail: datum }]);
    } finally {
      ui.remove();
    }
    // remove() の後は出さない（ホストは文書から外れているが、listener も外れている）
    got.length = 0;
    const detached = document.createElement("maplat-app");
    document.body.appendChild(detached);
    detached.dispatchEvent(
      new CustomEvent("clickMarker", { bubbles: true, detail: {} })
    );
    expect(got).toEqual([]);
  }, 120000);
});

describe("旧 pwaWorker: false / null（Service Worker を登録しない）", () => {
  it("互換層は pwaWorker が false / null のとき disablePwaWorker を呼び、文字列のときは呼ばない", async () => {
    const spy = vi.spyOn(MaplatUiElement.prototype, "disablePwaWorker");
    for (const [pwaWorker, calls] of [
      [false, 1],
      [null, 2],
      ["./sw.js", 2]
    ] as const) {
      document.body.innerHTML = '<div id="map_div"></div>';
      const ui = await MaplatUi.createObject({
        appid: "legacy-finish-pwa",
        setting: { ...SETTING },
        pwaWorker
      } as any);
      ui.remove();
      expect(spy).toHaveBeenCalledTimes(calls);
    }
  }, 120000);

  // 旧 `spec/nov26-m5-t3-pwa-worker.spec.ts` の表のうち、互換層の経路の分（旧 UI の実装の削除の仕上げ・レビュー m7）:
  // 空文字・true・数値・オブジェクトは「登録しない」ではなく、旧と同じく既定の ./service-worker.js で登録する
  it.each([
    ["空文字", ""],
    ["true", true],
    ["数値", 1],
    ["オブジェクト", { url: "./x.js" }]
  ] as const)(
    "互換層: pwaWorker が %s なら既定の ./service-worker.js で登録する",
    async (_label, pwaWorker) => {
      const register = vi.fn(() => Promise.resolve(undefined));
      const original = Object.getOwnPropertyDescriptor(
        navigator,
        "serviceWorker"
      );
      Object.defineProperty(navigator, "serviceWorker", {
        configurable: true,
        value: { register }
      });
      vi.spyOn(globalThis, "fetch").mockImplementation(() =>
        Promise.reject(new Error("no network"))
      );
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const disable = vi.spyOn(MaplatUiElement.prototype, "disablePwaWorker");
      // 同じ worker・scope の登録は 1 度にまとめる（pwa.ts）ので、場合ごとに scope を変える
      const scope = `./finish-${String(_label)}/`;
      try {
        const ui = await MaplatUi.createObject({
          appid: "legacy-finish-pwa-default",
          setting: { ...SETTING },
          pwaManifest: "./pwa/finish_manifest.json",
          pwaWorker,
          pwaScope: scope
        } as any);
        try {
          await vi.waitFor(() => expect(register).toHaveBeenCalled());
          expect(register).toHaveBeenCalledWith("./service-worker.js", {
            scope
          });
          expect(disable).not.toHaveBeenCalled();
        } finally {
          ui.remove();
        }
      } finally {
        if (original)
          Object.defineProperty(navigator, "serviceWorker", original);
        else delete (navigator as any).serviceWorker;
      }
    },
    120000
  );

  it("initPwa は worker: null で register を呼ばず、manifest の link は足す", async () => {
    const register = vi.fn(() => Promise.resolve(undefined));
    const original = Object.getOwnPropertyDescriptor(
      navigator,
      "serviceWorker"
    );
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { register }
    });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(() => Promise.reject(new Error("no network")));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      const result = await initPwa({
        manifest: "./pwa/finish_manifest.json",
        worker: null
      });
      expect(result).toBeUndefined();
      expect(register).not.toHaveBeenCalled();
      expect(
        document.head
          .querySelector('link[rel="manifest"]')
          ?.getAttribute("href")
      ).toBe("./pwa/finish_manifest.json");
    } finally {
      fetchSpy.mockRestore();
      if (original) Object.defineProperty(navigator, "serviceWorker", original);
      else delete (navigator as any).serviceWorker;
    }
  });
});

describe("Quyuan の先読み（旧 UI は起動時に cc-swiper を登録していた。Quyuan が同梱の Chuci を登録する）", () => {
  it("互換層は起動時に preloadMediaViewer を 1 回呼ぶ", async () => {
    const spy = vi
      .spyOn(MaplatUiElement.prototype, "preloadMediaViewer")
      .mockImplementation(() => Promise.resolve());
    const ui = await MaplatUi.createObject({
      appid: "legacy-finish-chuci",
      setting: { ...SETTING }
    } as any);
    try {
      expect(spy).toHaveBeenCalledTimes(1);
    } finally {
      ui.remove();
    }
  }, 120000);
});

describe("汎用メニューは地図の切り替えで閉じない（旧 contextmenu と同じ）", () => {
  it("showContextMenu で開いたメニューは、子の mapChanged の後も開いたまま", async () => {
    const ui = await MaplatUi.createObject({
      appid: "legacy-finish-menu",
      setting: { ...SETTING }
    } as any);
    try {
      ui.lastClickPixel = [10, 10];
      ui.showContextMenu([{ text: "項目", callback: () => undefined }] as any);
      const host = document.querySelector("maplat-ui") as MaplatUiElement;
      const menu =
        host.shadowRoot!.querySelector<HTMLElement>('[part="poi-menu"]')!;
      expect(menu.hidden).toBe(false);
      const app = document.querySelector("maplat-app") as HTMLElement;
      app.dispatchEvent(
        new CustomEvent("mapChanged", {
          bubbles: true,
          detail: { mapID: "finish_map", title: "t" }
        })
      );
      expect(menu.hidden).toBe(false);
      expect(ui.contextMenu.isOpen()).toBe(true);
    } finally {
      ui.remove();
    }
  }, 120000);
});
