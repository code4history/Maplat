// @vitest-environment jsdom
// ページが先に（別の版の）Chuci の `cc-swiper` を登録していても、メディアを出すと `qy-swiper` が定義される。
//
// 読み込み済みの判定を `cc-swiper` で行うと、ページの Chuci を見て Quyuan を読まず、`qy-swiper` が永遠に
// 定義されない。判定は `qy-swiper` で行う。登録表がまっさらな状態から始める必要があるので、ファイルを分けた。
import { describe, it, expect, afterEach, vi } from "vitest";
import {
  defineMockMaplatApp,
  getMockLayerAController
} from "@maplat/core/conformance";
import { MAPLAT_UI_TAG } from "@maplat/core/common";
// 入口の読み込みで <maplat-ui> が登録される（defineMaplatUi は二重登録しない）
import { defineMaplatUi, type MaplatUiElement } from "../src/element";

defineMockMaplatApp();
defineMaplatUi();

type Ui = MaplatUiElement & HTMLElement;

const SETTING = {
  appName: "Test App",
  lang: "en",
  homePosition: [139.7, 35.7],
  defaultZoom: 14,
  startFrom: "osm",
  sources: [{ mapID: "osm", label: "OSM", isBasemap: true }],
  pois: []
};

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("ページが先に cc-swiper を登録していた場合", () => {
  it("メディアを出すと qy-swiper が定義される（ページの cc-swiper はそのまま）", async () => {
    // ページの（別の版の）Chuci の代わりのダミー
    class PageCcSwiper extends HTMLElement {}
    customElements.define("cc-swiper", PageCcSwiper);
    expect(customElements.get("qy-swiper")).toBeUndefined();

    const ui = document.createElement(MAPLAT_UI_TAG) as Ui;
    ui.setting = structuredClone(SETTING);
    document.body.appendChild(ui);
    await ui.ready;
    getMockLayerAController(ui.app!)!.fire("clickMarkers", [
      { namespaceID: "m", name: "M", image: "m.jpg" }
    ]);
    await vi.waitFor(
      () => expect(customElements.get("qy-swiper")).toBeTruthy(),
      { timeout: 20_000 }
    );
    // 未登録のときだけ登録する ∴ ページの cc-swiper は上書きされない
    expect(customElements.get("cc-swiper")).toBe(PageCcSwiper);
  }, 30_000);
});
