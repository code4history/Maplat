// @vitest-environment jsdom
// モーダルのフォーカスの復帰と背景の inert（手引き dialog の <dialog> を使わない場合の要件）。
// 共有・POI・地図の情報を、閉じるボタンと Escape の両方で閉じて確かめる。
import { it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  defineMockMaplatApp,
  getMockLayerAController
} from "@maplat/core/conformance";
import { MAPLAT_UI_TAG } from "@maplat/core/common";
import { MaplatUiElement } from "../src/element";

defineMockMaplatApp();
const part = (ui: MaplatUiElement, name: string) =>
  ui.shadowRoot!.querySelector(`[part="${name}"]`) as HTMLElement;
async function mountUi() {
  expect(customElements.get(MAPLAT_UI_TAG)).toBe(MaplatUiElement);
  const ui = document.createElement(MAPLAT_UI_TAG) as MaplatUiElement;
  ui.setting = { sources: [{ mapID: "osm", label: "OSM", isBasemap: true }] };
  ui.enableShare = true;
  ui.enableMarkerList = true;
  document.body.append(ui);
  await ui.ready;
  return ui;
}
const openPoi = (ui: MaplatUiElement) => {
  getMockLayerAController(ui.app!)!.fire("clickMarkers", [
    { namespaceID: "main#spot", id: "spot", name: "Spot" }
  ]);
};
const escape = (ui: MaplatUiElement) =>
  ui.shadowRoot!.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
  );
beforeEach(() => {
  history.replaceState(null, "", "http://localhost:3000/");
  localStorage.clear();
});
afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});
const cases: Array<{
  name: string;
  opener: string;
  modal: string;
  close: string;
  open: (ui: MaplatUiElement, opener: HTMLButtonElement) => void;
}> = [
  {
    name: "共有",
    opener: "share",
    modal: "share-modal",
    close: "share-close",
    open: (ui: MaplatUiElement, opener: HTMLButtonElement) => opener.click()
  },
  {
    name: "POI",
    opener: "help",
    modal: "poi-modal",
    close: "poi-close",
    open: (ui: MaplatUiElement) => openPoi(ui)
  },
  {
    name: "地図の情報",
    opener: "info",
    modal: "map-info-modal",
    close: "map-info-close",
    open: (ui: MaplatUiElement, opener: HTMLButtonElement) => opener.click()
  }
];
it.each(cases)(
  "$name: 閉じるボタンで閉じると開いたボタンへフォーカスが戻る",
  async c => {
    const ui = await mountUi();
    const opener = part(ui, c.opener).querySelector(
      "button"
    ) as HTMLButtonElement;
    opener.focus();
    c.open(ui, opener);
    expect(part(ui, c.modal).hidden).toBe(false);
    expect(ui.shadowRoot!.activeElement).toBe(part(ui, c.close));
    (part(ui, c.close) as HTMLButtonElement).click();
    expect(part(ui, c.modal).hidden).toBe(true);
    expect(ui.shadowRoot!.activeElement).toBe(opener);
  }
);
it.each(cases)(
  "$name: Escape で閉じても開いたボタンへフォーカスが戻る",
  async c => {
    const ui = await mountUi();
    const opener = part(ui, c.opener).querySelector(
      "button"
    ) as HTMLButtonElement;
    opener.focus();
    c.open(ui, opener);
    expect(part(ui, c.modal).hidden).toBe(false);
    escape(ui);
    expect(part(ui, c.modal).hidden).toBe(true);
    expect(ui.shadowRoot!.activeElement).toBe(opener);
  }
);
it.each(cases)(
  "$name: 開いている間は背景（地図・コントロール）が inert、閉じると外る",
  async c => {
    const ui = await mountUi();
    const opener = part(ui, c.opener).querySelector(
      "button"
    ) as HTMLButtonElement;
    opener.focus();
    c.open(ui, opener);
    expect(part(ui, "compass").hasAttribute("inert")).toBe(true);
    expect(ui.app!.hasAttribute("inert")).toBe(true);
    // モーダル自身は操作できるまま
    expect(part(ui, c.modal).hasAttribute("inert")).toBe(false);
    (part(ui, c.close) as HTMLButtonElement).click();
    expect(part(ui, "compass").hasAttribute("inert")).toBe(false);
    expect(ui.app!.hasAttribute("inert")).toBe(false);
  }
);
it("トーストは開いたモーダルから出す知らせなので inert にしない", async () => {
  const ui = await mountUi();
  const opener = part(ui, "share").querySelector("button") as HTMLButtonElement;
  opener.focus();
  opener.click();
  expect(part(ui, "share-modal").hidden).toBe(false);
  expect(part(ui, "toast").hasAttribute("inert")).toBe(false);
});
it("モーダルを重ねたときは、最後に閉じたときに背景の inert を外す", async () => {
  const ui = await mountUi();
  openPoi(ui);
  ui.openModalByLegacyName("marker_list");
  expect(part(ui, "poi-modal").hidden).toBe(false);
  expect(part(ui, "marker-list-modal").hidden).toBe(false);
  expect(part(ui, "compass").hasAttribute("inert")).toBe(true);
  (part(ui, "marker-list-close") as HTMLButtonElement).click();
  // POI がまだ開いているので inert は残る
  expect(part(ui, "compass").hasAttribute("inert")).toBe(true);
  (part(ui, "poi-close") as HTMLButtonElement).click();
  expect(part(ui, "compass").hasAttribute("inert")).toBe(false);
});
