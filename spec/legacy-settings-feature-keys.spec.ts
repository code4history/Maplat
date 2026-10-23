// 設定ファイルの機能系キー（設計 v2 §2.3.1 C1(a)・§1.2.1・差分 D2・D10）。
//
// 旧 `MaplatUi` は設定ファイル（`setting`）の `noRotate`・`fakeGps` 等を Core が読む経路
// （`__maplatElementMode === false`）を通していた。互換層は子へ `appOption.__maplatCompat = true`
// を渡し、Core の互換モードで同じ経路を通す。`tapDuration`・`tapUIVanish` は層 B が自分で読むので、
// `lifecycle:appdata-ready` で `appData` から読んで属性へ流す（option が優先。D2）。
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MaplatUi } from "../src/index";

const SETTING = {
  appName: { ja: "機能系キー", en: "feature keys" },
  sources: [],
  homePosition: [139.5, 36.2],
  defaultZoom: 14
};

function shim() {
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
}

let ui: MaplatUi | undefined;

beforeEach(() => {
  shim();
});

afterEach(() => {
  try {
    ui?.remove();
  } catch {
    /* 後片付けの失敗は判定に影響しない */
  }
  ui = undefined;
  vi.restoreAllMocks();
});

async function boot(
  setting: Record<string, unknown>,
  option: Record<string, unknown> = {}
): Promise<string[]> {
  const warned: string[] = [];
  vi.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
    warned.push(args.map(a => String(a)).join(" "));
  });
  ui = await MaplatUi.createObject({
    appid: "legacy-settings",
    setting: { ...SETTING, ...setting },
    ...option
  } as any);
  await ui.splashPromise;
  return warned;
}

const host = () => document.querySelector("maplat-ui") as any;

describe("設定ファイルの機能系キー（C1(a)・D10）", () => {
  it("noRotate / fakeGps は設定ファイルから読む（互換モード）。tapDuration / tapUIVanish は層 B の属性へ（D2）", async () => {
    const warned = await boot(
      {
        noRotate: true,
        fakeGps: [139.51, 36.21],
        tapDuration: 1234,
        tapUIVanish: true
      },
      { fake: true }
    );
    // Core の互換モードで、旧クラスと同じく設定ファイルの機能系キーが効く
    expect(ui!.core!.noRotate).toBe(true);
    expect(ui!.core!.fakeGps).toEqual([139.51, 36.21]);
    // 廃止の警告はキーごとに 1 回だけ
    expect(warned.filter(w => w.includes('"noRotate"')).length).toBe(1);
    // 層 B が自分で読む 2 つは、設定ファイルの値が属性へ流れる
    expect(host().getAttribute("tap-duration")).toBe("1234");
    expect(host().tapUiVanish).toBe(true);
  }, 120000);

  it("option（旧 API の appOption）が設定ファイルより強い。廃止したキーは警告して無視する", async () => {
    const warned = await boot(
      { noRotate: true, tapDuration: 1234, tapUIVanish: true },
      {
        noRotate: false,
        tapDuration: 777,
        tapUIVanish: false,
        // 旧 UI で廃止したキー（§1.2.1。警告して無視する）
        mobileIF: true
      }
    );
    expect(ui!.core!.noRotate).toBe(false);
    // option が与えられているので、設定ファイルの廃止警告は出ない（Core の判定と同じ）
    expect(warned.filter(w => w.includes('"noRotate"')).length).toBe(0);
    expect(host().getAttribute("tap-duration")).toBe("777");
    expect(host().tapUiVanish).toBe(false);
    // 廃止したキーは 1 回だけ警告する
    expect(warned.filter(w => w.includes("mobileIF")).length).toBe(1);
  }, 120000);
});
