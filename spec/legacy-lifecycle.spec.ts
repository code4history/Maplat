// 旧 API の互換層のライフサイクル。
//
// 判定は API の水準だけ（戻り値・`ui.core` の型・DOM の親子・`remove()`）で行う。
// 層 A（Core の `MaplatApp`）は実物を使い、地図の実体は `sources: []` で起動する
// （`spec/legacy-api.spec.ts` と同じ作り方）。
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { MaplatApp } from "@maplat/core";
import { MaplatUi } from "../src/index";

const SETTING = {
  appName: { ja: "互換層の基準", en: "Compatibility baseline" },
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

describe("createObject → waitReady の外形（旧と同じ）", () => {
  it("createObject は MaplatUi を返し、ui.core は Core の MaplatApp（層 A の要素ではない）", async () => {
    const ui = await MaplatUi.createObject({
      appid: "legacy-lifecycle",
      setting: { ...SETTING }
    } as any);
    try {
      expect(ui).toBeInstanceOf(MaplatUi);
      expect(ui.core).toBeInstanceOf(MaplatApp);
      expect(ui.core?.mapDivDocument).toBeTruthy();
      // 地図は旧と同じ `#map_div` の中に置く（`<maplat-ui>` のホスト → 子の `<maplat-app>`）
      const host = document.querySelector("maplat-ui") as HTMLElement | null;
      expect(host).toBeTruthy();
      expect(host!.parentElement?.id).toBe("map_div");
      expect(host!.querySelector("maplat-app")).toBeTruthy();
      // `appOption` は渡したものと同じ（複製しない）
      const option = { appid: "legacy-lifecycle", setting: { ...SETTING } };
      const ui2 = new MaplatUi(option as any);
      expect(ui2.appOption).toBe(option);
      // 旧の `waitReady` は関数プロパティ（プロトタイプには無い）
      expect(typeof ui2.waitReady).toBe("function");
      expect("waitReady" in MaplatUi.prototype).toBe(false);
      await ui.core!.waitReady;
    } finally {
      ui.remove();
    }
    expect(document.querySelector("maplat-ui")).toBeNull();
    expect(ui.core).toBeUndefined();
  }, 120000);

  it("stateUrl なし: waitReady は setting-loaded の時点で解決し、その後も 7 段階が通る", async () => {
    const events: string[] = [];
    const ui = new MaplatUi({
      appid: "legacy-lifecycle-hooks",
      setting: { ...SETTING },
      uiHooks: {
        onSettingLoaded: () => {
          events.push("onSettingLoaded");
        },
        onAppdataReady: () => {
          events.push("onAppdataReady");
        },
        onUiConfigure: () => {
          events.push("onUiConfigure");
        },
        onCoreDomReady: () => {
          events.push("onCoreDomReady");
        },
        onUiDomReady: () => {
          events.push("onUiDomReady");
        },
        onCoreReady: () => {
          events.push("onCoreReady");
        },
        onUiReady: () => {
          events.push("onUiReady");
        }
      }
    } as any);
    const resolved = await ui.waitReady();
    const coreAtResolve = !!ui.core;
    const orderAtResolve = [...events];
    expect(resolved).toBe(ui);
    expect(coreAtResolve).toBe(true);
    // 解決は層 A の起動完了を待たない（旧の不変条件）
    expect(orderAtResolve).not.toContain("onUiReady");
    expect(orderAtResolve).not.toContain("onCoreReady");
    // その後の 7 段階は全部通る
    await ui.splashPromise;
    expect(events).toContain("onUiReady");
    expect(events.indexOf("onSettingLoaded")).toBeLessThan(
      events.indexOf("onUiReady")
    );
    ui.remove();
  }, 120000);

  it("div を要素で渡すと、その中に置く（旧 Core の div）", async () => {
    const container = document.createElement("div");
    container.id = "own_map";
    document.body.appendChild(container);
    const ui = await MaplatUi.createObject({
      appid: "legacy-lifecycle-div",
      div: container,
      setting: { ...SETTING }
    } as any);
    const host = container.querySelector("maplat-ui");
    expect(host).toBeTruthy();
    ui.remove();
    expect(container.querySelector("maplat-ui")).toBeNull();
  }, 120000);
});
