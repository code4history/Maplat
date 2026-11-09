// @vitest-environment jsdom
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
function openPoi(ui: MaplatUiElement) {
  getMockLayerAController(ui.app!)!.fire("clickMarkers", [
    { namespaceID: "main#spot", id: "spot", name: "Spot" }
  ]);
  return part(ui, "poi-close");
}
const key = (value: string) =>
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: value, bubbles: true })
  );
const pointer = () =>
  document.dispatchEvent(new Event("pointerdown", { bubbles: true }));
beforeEach(() => {
  history.replaceState(null, "", "http://localhost:3000/");
  localStorage.clear();
});
afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});
it("入力なしで開くとスクリプト由来の属性が付く", async () => {
  const ui = await mountUi();
  const close = openPoi(ui);
  expect(ui.shadowRoot!.activeElement).toBe(close);
  expect(close.dataset.focusOrigin).toBe("script");
});
it("キーボードで開くと属性が付かない", async () => {
  const ui = await mountUi();
  key("Tab");
  expect(openPoi(ui).dataset.focusOrigin).toBeUndefined();
});
it("ポインタで開くと属性が付く", async () => {
  const ui = await mountUi();
  key("Tab");
  pointer();
  expect(openPoi(ui).dataset.focusOrigin).toBe("script");
});
it.each(["ArrowRight", "Tab", "Enter"])("%s で属性を外す", async value => {
  const ui = await mountUi();
  const close = openPoi(ui);
  expect(close.dataset.focusOrigin).toBe("script");
  key(value);
  expect(close.dataset.focusOrigin).toBeUndefined();
});
it.each(["Shift", "Control", "Alt", "Meta"])(
  "修飾キー %s だけでは属性を外さない",
  async value => {
    const ui = await mountUi();
    const close = openPoi(ui);
    key(value);
    expect(close.dataset.focusOrigin).toBe("script");
    close.blur();
    expect(openPoi(ui).dataset.focusOrigin).toBe("script");
  }
);
it("blur で属性を外す", async () => {
  const ui = await mountUi();
  const close = openPoi(ui);
  expect(close.dataset.focusOrigin).toBe("script");
  close.blur();
  expect(close.dataset.focusOrigin).toBeUndefined();
});
it("取り外すと document の捕捉リスナーを解除し、再接続で復帰する", async () => {
  const add = vi.spyOn(document, "addEventListener");
  const remove = vi.spyOn(document, "removeEventListener");
  const ui = await mountUi();
  const handlers = add.mock.calls.filter(
    ([type, , capture]) =>
      ["keydown", "pointerdown"].includes(type) && capture === true
  );
  expect(handlers.map(([type]) => type)).toEqual(
    expect.arrayContaining(["keydown", "pointerdown"])
  );
  ui.remove();
  for (const [type, handler, capture] of handlers)
    expect(remove).toHaveBeenCalledWith(type, handler, capture);
  const close = part(ui, "poi-close");
  close.dataset.focusOrigin = "script";
  expect(() => {
    key("ArrowRight");
    pointer();
  }).not.toThrow();
  expect(close.dataset.focusOrigin).toBe("script");
  document.body.append(ui);
  await ui.ready;
  openPoi(ui);
  key("ArrowRight");
  expect(close.dataset.focusOrigin).toBeUndefined();
});
it.each([
  ["share", "share"],
  ["gpsW", "gps"],
  ["help", "help"],
  ["map", "map-info"],
  ["marker_list", "marker-list"],
  ["poi", "poi"]
])("%s の閉じるボタンも同じ規則でフォーカスする", async (name, prefix) => {
  const ui = await mountUi();
  if (name === "poi") openPoi(ui);
  else ui.openModalByLegacyName(name);
  const close = part(ui, `${prefix}-close`);
  expect(ui.shadowRoot!.activeElement).toBe(close);
  expect(close.dataset.focusOrigin).toBe("script");
});
