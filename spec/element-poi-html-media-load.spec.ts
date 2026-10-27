// @vitest-environment jsdom
// POI の html（テンプレートの結果）に `<qy-swiper>` があるときの、表示部品（@c4h/quyuan）の読み込み。
//
// メディア（media・image）の POI を一度も開かずに、html の中の `qy-swiper` だけで読み込みが起きることを
// 確かめるため、**このファイルは要素の登録表がまっさらな状態から始める**（同じファイルの中の別の検査で
// Quyuan を先に読むと空振りになる ∴ spec/element.spec.ts とは分けた）。テストは書いた順に走る:
//   1. `<qy-swiper>` を含まない html では読み込まない
//   2. `<qy-swiper>` を含む html を描くと読み込む（判定はサニタイズの後の DOM で行う）
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

function part(ui: Ui, name: string) {
  return ui.shadowRoot!.querySelector(`[part~="${name}"]`) as HTMLElement;
}

async function mountUi(): Promise<Ui> {
  const ui = document.createElement(MAPLAT_UI_TAG) as Ui;
  ui.setting = structuredClone(SETTING);
  document.body.appendChild(ui);
  await ui.ready;
  return ui;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("POI の html の中の qy-swiper で表示部品を読み込む", () => {
  it("<qy-swiper> を含まない html では読み込まない", async () => {
    expect(customElements.get("qy-swiper")).toBeUndefined();
    const ui = await mountUi();
    getMockLayerAController(ui.app!)!.fire("clickMarkers", [
      {
        namespaceID: "plain",
        name: "Plain",
        html: '<b>見出し</b><img src="a.jpg">'
      }
    ]);
    const host = part(ui, "poi-html");
    expect(host).not.toBeNull();
    expect(host.shadowRoot!.querySelector("b")!.textContent).toBe("見出し");
    // 読み込みは非同期 ∴ 少し待ってもまだ登録されていない（import が起きていない）
    await sleep(200);
    expect(customElements.get("qy-swiper")).toBeUndefined();
    expect(customElements.get("cc-swiper")).toBeUndefined();
  });

  it("<qy-swiper> を含む html を描くと（メディアの POI を開かずに）qy-swiper が登録される", async () => {
    expect(customElements.get("qy-swiper")).toBeUndefined();
    const ui = await mountUi();
    getMockLayerAController(ui.app!)!.fire("clickMarkers", [
      {
        namespaceID: "tpl",
        name: "Template",
        html: '<qy-swiper><qy-swiper-slide image-url="a.jpg" image-type="image"></qy-swiper-slide></qy-swiper>'
      }
    ]);
    const host = part(ui, "poi-html");
    // サニタイズの後も qy-swiper と属性が残っている（Core の sanitizer が qy-* を許す）
    const slide = host.shadowRoot!.querySelector(
      "qy-swiper > qy-swiper-slide"
    )!;
    expect(slide).not.toBeNull();
    expect(slide.getAttribute("image-url")).toBe("a.jpg");
    await vi.waitFor(
      () => expect(customElements.get("qy-swiper")).toBeTruthy(),
      { timeout: 20_000 }
    );
  }, 30_000);
});
