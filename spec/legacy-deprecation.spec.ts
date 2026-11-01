// @vitest-environment jsdom
// 旧 UI API（`MaplatUi` クラス）の非推奨の告知の検査（
// 「実行時に 1 回だけ警告を出す」）。
//   - 文言は英語（人間の決定）。粒度は**同一プロセスで 1 回**（インスタンスごとではない）。
//     ∴ 2 つ作っても警告は 1 回。
//   - `<maplat-ui>`（要素）の経路は内部で `MaplatUi` を作らないので警告しない
//     （`grep -rn "new MaplatUi" src` で確かめられる。旧クラスを作るのは互換層の 1 か所だけ）。
//   - 旧 API の互換層は Core の `<maplat-app>` を経由して起動するので、Core の `MaplatApp` の
//     非推奨の警告（「MaplatApp: the MaplatApp class is deprecated」）は旧 API の利用者には出ない。
//
// 層 A（Core の `MaplatApp`）は実物を使い、地図の実体（OpenLayers）は `sources: []` で起動する
// （`spec/legacy-lifecycle.spec.ts` と同じ作り方）。
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "@maplat/core/element";
import { MaplatApp } from "@maplat/core";
import { MaplatUi } from "../src/index";
import { resetMaplatUiDeprecationWarning } from "../src/legacy/maplat_ui_compat";

/** 互換層が出す警告（`src/legacy/maplat_ui_compat.ts` の MAPLAT_UI_DEPRECATION_MESSAGE） */
const DEPRECATION_MESSAGE =
  "MaplatUi: the MaplatUi class is deprecated and will be removed in 2.0. " +
  "Use the <maplat-ui> element (@maplat/ui/element) with <maplat-app> instead.";

/** Core の旧クラスの警告（`@maplat/core` が出す。旧 UI API の利用者には出てはならない） */
const MAPLAT_APP_DEPRECATION_PREFIX =
  "MaplatApp: the MaplatApp class is deprecated";

/** 旧 UI API の警告だけを取り出す（ほかの警告は判定に混ぜない） */
const said = (warn: { mock: { calls: unknown[][] } }) =>
  warn.mock.calls.map(c => String(c[0])).filter(m => m === DEPRECATION_MESSAGE);

/** Core の旧クラスの警告だけを取り出す */
const saidCore = (warn: { mock: { calls: unknown[][] } }) =>
  warn.mock.calls
    .map(c => String(c[0]))
    .filter(m => m.startsWith(MAPLAT_APP_DEPRECATION_PREFIX));

const SETTING = {
  appName: { ja: "非推奨の告知", en: "Deprecation notice" },
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
  // 「1 回だけ」の記憶はモジュール水準なので、どのテストも未警告の状態から始める
  resetMaplatUiDeprecationWarning();
});

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
  resetMaplatUiDeprecationWarning();
});

describe("旧 UI API の非推奨の告知", () => {
  it("直接 new すると 1 回だけ警告する。2 つ作っても 1 回（同一プロセスで重複させない）", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const first = new MaplatUi({ appid: "deprecation" } as any);
    const second = new MaplatUi({ appid: "deprecation" } as any);
    try {
      expect(said(warn)).toEqual([DEPRECATION_MESSAGE]);
    } finally {
      first.remove();
      second.remove();
    }
  }, 120000);

  it("createObject から作っても 1 回だけ警告する（中で new する）", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const ui = await MaplatUi.createObject({
      appid: "deprecation-create-object",
      setting: { ...SETTING }
    } as any);
    try {
      expect(ui).toBeInstanceOf(MaplatUi);
      expect(said(warn)).toEqual([DEPRECATION_MESSAGE]);
    } finally {
      ui.remove();
    }
  }, 120000);

  it("<maplat-ui> を単独で使うと警告しない（要素は内部で MaplatUi を作らない）", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const el = document.createElement("maplat-ui") as any;
    el.setting = { ...SETTING };
    document.body.appendChild(el);
    await el.ready;
    try {
      // 要素の経路は Core の実物を作っている（警告しない理由が「作っていないから」ではない）
      expect(el.app).toBeTruthy();
      expect(said(warn)).toEqual([]);
      // 要素の経路の Core も警告しない（要素は `__maplatElementMode` 付きで作るため）
      expect(saidCore(warn)).toEqual([]);
    } finally {
      el.remove();
    }
  }, 120000);

  it("旧 API の利用者には Core の MaplatApp の非推奨の警告が出ない（互換層は <maplat-app> を経由する）", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const ui = await MaplatUi.createObject({
      appid: "deprecation-core",
      setting: { ...SETTING }
    } as any);
    try {
      // 内部で Core の実物の MaplatApp を作っている（警告が出ない理由が「作っていないから」ではない）
      expect(ui.core).toBeInstanceOf(MaplatApp);
      expect(said(warn)).toEqual([DEPRECATION_MESSAGE]);
      expect(saidCore(warn)).toEqual([]);
    } finally {
      ui.remove();
    }
  }, 120000);
});
