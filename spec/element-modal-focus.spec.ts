// @vitest-environment jsdom
// モーダルのフォーカスの復帰と背景の inert（<dialog> を使わずに WAI-ARIA の dialog の作法を満たすための要件）。
// 共有・POI・地図の情報・ヘルプ・GPS を、閉じるボタンと Escape の両方で閉じて確かめる。
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
  },
  {
    name: "ヘルプ",
    opener: "help",
    modal: "help-modal",
    close: "help-close",
    open: (ui: MaplatUiElement, opener: HTMLButtonElement) => opener.click()
  },
  {
    name: "GPS",
    opener: "gps",
    modal: "gps-modal",
    close: "gps-close",
    open: (ui: MaplatUiElement) =>
      getMockLayerAController(ui.app!)!.fire("gps_error", "gps_miss")
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
  "$name: 開いている間は背景（地図・コントロール）が inert、閉じると外れる",
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
it("ページ側が付けていた inert は、モーダルを閉じても残る", async () => {
  const ui = await mountUi();
  const pageChild = document.createElement("div");
  pageChild.setAttribute("inert", "");
  ui.append(pageChild);
  const opener = part(ui, "share").querySelector("button") as HTMLButtonElement;
  opener.focus();
  opener.click();
  expect(pageChild.hasAttribute("inert")).toBe(true);
  expect(ui.app!.hasAttribute("inert")).toBe(true);
  (part(ui, "share-close") as HTMLButtonElement).click();
  // 自分が付けたもの（地図）だけを外し、ページが付けていたものは残す
  expect(ui.app!.hasAttribute("inert")).toBe(false);
  expect(pageChild.hasAttribute("inert")).toBe(true);
});
// MutationObserver の知らせ（マイクロタスク）を待つ
const flushObserver = () =>
  new Promise<void>(resolve => setTimeout(resolve, 0));
const openShare = (ui: MaplatUiElement) => {
  const opener = part(ui, "share").querySelector("button") as HTMLButtonElement;
  opener.focus();
  opener.click();
  expect(part(ui, "share-modal").hidden).toBe(false);
};
const closeShare = (ui: MaplatUiElement) =>
  (part(ui, "share-close") as HTMLButtonElement).click();
it("モーダルを開いている間に足された light DOM の子にも inert を付け、閉じると外す", async () => {
  const ui = await mountUi();
  openShare(ui);
  const added = document.createElement("button");
  ui.append(added);
  await flushObserver();
  expect(added.hasAttribute("inert")).toBe(true);
  closeShare(ui);
  expect(added.hasAttribute("inert")).toBe(false);
});
it("開いている間に足された子でも、ページ側が付けていた inert は閉じても残す", async () => {
  const ui = await mountUi();
  openShare(ui);
  const added = document.createElement("div");
  added.setAttribute("inert", "");
  ui.append(added);
  await flushObserver();
  closeShare(ui);
  expect(added.hasAttribute("inert")).toBe(true);
});
it("開いている間に light DOM から外して移した子は、その時点で自分の付けた inert を外す", async () => {
  const ui = await mountUi();
  const moved = document.createElement("button");
  ui.append(moved);
  openShare(ui);
  expect(moved.hasAttribute("inert")).toBe(true);
  const elsewhere = document.createElement("div");
  document.body.append(elsewhere);
  elsewhere.append(moved);
  await flushObserver();
  // 移した先（<maplat-ui> の外）はモーダルの背景ではない
  expect(moved.hasAttribute("inert")).toBe(false);
  closeShare(ui);
  expect(moved.hasAttribute("inert")).toBe(false);
});
it("開いている間に外して移した子にページが付け直した inert は、閉じても残る", async () => {
  const ui = await mountUi();
  // （移すのと同じ拍で付け直す場合は、外した子への変更も知らせに含める DOM の仕組み
  // （transient registered observer）に頼る。jsdom はこれを持たないので、ここでは別の拍で付け直す）
  const later = document.createElement("div");
  ui.append(later);
  openShare(ui);
  const elsewhere = document.createElement("div");
  document.body.append(elsewhere);
  elsewhere.append(later);
  await flushObserver();
  later.setAttribute("inert", "");
  await flushObserver();
  closeShare(ui);
  expect(later.hasAttribute("inert")).toBe(true);
});
it("入れ子・ページ側の inert・開いている間の出し入れを 3 回くり返しても inert が漏れない", async () => {
  const ui = await mountUi();
  const pageInert = document.createElement("div");
  pageInert.setAttribute("inert", "");
  ui.append(pageInert);
  const elsewhere = document.createElement("div");
  document.body.append(elsewhere);
  const extras: HTMLElement[] = [];
  for (let round = 0; round < 3; round++) {
    openPoi(ui);
    ui.openModalByLegacyName("marker_list");
    const added = document.createElement("button");
    ui.append(added);
    extras.push(added);
    await flushObserver();
    expect(added.hasAttribute("inert")).toBe(true);
    // 前の回に足した子を外へ移す
    if (round > 0) elsewhere.append(extras[round - 1]);
    await flushObserver();
    (part(ui, "marker-list-close") as HTMLButtonElement).click();
    expect(part(ui, "compass").hasAttribute("inert")).toBe(true);
    expect(added.hasAttribute("inert")).toBe(true);
    (part(ui, "poi-close") as HTMLButtonElement).click();
    const stray = [
      ...Array.from(ui.shadowRoot!.querySelectorAll("[inert]")),
      ...Array.from(document.querySelectorAll("[inert]"))
    ];
    expect(stray).toEqual([pageInert]);
  }
});
it("開いている間にページが付け直した inert は、閉じても残す", async () => {
  const ui = await mountUi();
  const child = document.createElement("div");
  ui.append(child);
  openShare(ui);
  expect(child.hasAttribute("inert")).toBe(true);
  // 開いている間に、ページが自分でも inert にする
  child.setAttribute("inert", "");
  await flushObserver();
  closeShare(ui);
  expect(child.hasAttribute("inert")).toBe(true);
  expect(ui.app!.hasAttribute("inert")).toBe(false);
});
it("外したとき（#detach）は light DOM の見張りを止める", async () => {
  const ui = await mountUi();
  const observe = vi.spyOn(MutationObserver.prototype, "observe");
  const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
  openShare(ui);
  // light DOM（<maplat-ui> 自身）を見張る observer
  const watchers = observe.mock.contexts.filter(
    (_, i) => observe.mock.calls[i][0] === ui
  );
  expect(watchers.length).toBeGreaterThan(0);
  ui.remove();
  await flushObserver();
  for (const w of watchers) expect(disconnect.mock.contexts).toContain(w);
  const added = document.createElement("button");
  ui.append(added);
  await flushObserver();
  expect(added.hasAttribute("inert")).toBe(false);
});
