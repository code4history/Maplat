// @vitest-environment jsdom
// <maplat-ui> の全言語化: 言語ファイルの読み込みに失敗したら en に落ちて、英語で警告する。
// このファイルだけ th の言語ファイルの import を失敗させる（ほかの spec には影響しない）。
import { describe, it, expect, afterEach, vi } from "vitest";
import { defineMockMaplatApp } from "@maplat/core/conformance";
import { MAPLAT_UI_TAG } from "@maplat/core/common";
import { defineMaplatUi, type MaplatUiElement } from "../src/element";

vi.mock("../assets/locales/th/translation.json", () => {
  throw new Error("boom");
});

defineMockMaplatApp();
defineMaplatUi();

const SETTING = {
  appName: "Test App",
  lang: "en",
  homePosition: [139.7, 35.7],
  defaultZoom: 14,
  sources: [{ mapID: "osm", label: "OSM", isBasemap: true }],
  pois: []
};

type Ui = MaplatUiElement & HTMLElement;

async function mountUi(setup?: (ui: Ui) => void): Promise<Ui> {
  const ui = document.createElement(MAPLAT_UI_TAG) as Ui;
  ui.setting = structuredClone(SETTING);
  setup?.(ui);
  document.body.appendChild(ui);
  await ui.ready;
  return ui;
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("言語ファイルの読み込みの失敗", () => {
  it("en に落ちて、英語で警告する", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const ui = await mountUi(u => u.setAttribute("lang", "th"));
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('failed to load translations for "th".'),
      expect.any(Error)
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('falling back to English translations for "th".')
    );
    // 言語ファイルの en（内蔵の en ではなく旧 UI の en が正）
    expect(ui.t("control.home")).toBe("Go Home Position");
    expect(ui.t("html.help_operation_content")).toContain(
      "<img src='${plus.png}'> <img src='${minus.png}'>"
    );
    // 落ちた先の en の言語ファイルは、旧 UI のスライダーの説明（地図の切り替えがスライダーになって上書きをやめた）
    expect(ui.t("html.help_selection_content")).toContain(
      "two sliders with thumbnail"
    );
    // 言語ファイルに無いキーは内蔵の en
    expect(ui.t("control.zoom_in")).toBe("Zoom in");
    expect(ui.t("no.such.key")).toBe("no.such.key");
  });
});
