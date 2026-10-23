// @vitest-environment jsdom
// `<maplat-ui>` と地図の切り替えスライダーの配線（Stage 2・設計 §4.6・§5.2 B12/B13）。
//
// 部品そのもの（循環・drag・キュー）は `spec/slider.spec.ts` が見る。このファイルは要素側:
//   - 左右 2 本（背景の地図・重ねる地図）に `listMaps` を分けて渡す
//   - 起動時は animate=false（旧 Swiper の initialSlide と同じ。動かさずに置く）
//   - 地図を変えるのは onSelect だけ（D5）。矢印・キーボードの移動では changeMap を呼ばない
//   - 1 枚のスライダーは `single-map`（枠を描かない・矢印を出さない。P3・S8）
//   - `overlay: false` でもスライダーを隠さない（P3）
//   - `mapChanged` で選択が追従し、遠い移動は 160ms の連続（N8・M3 の入口）
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  defineMockMaplatApp,
  getMockLayerAController
} from "@maplat/core/conformance";
import { MAPLAT_UI_TAG } from "@maplat/core/common";
import { MaplatUiElement, defineMaplatUi } from "../src/element";
import { SLIDER_TUNING } from "../src/element/slider";

defineMockMaplatApp();
defineMaplatUi();

type Ui = MaplatUiElement & HTMLElement;

const BASE = {
  appName: { ja: "テスト", en: "Test" },
  lang: "en",
  homePosition: [139.7, 35.7],
  defaultZoom: 14,
  startFrom: "old1",
  sources: [
    { mapID: "osm", label: "OSM", isBasemap: true },
    { mapID: "gsi", label: "GSI", isBasemap: true },
    {
      mapID: "old1",
      label: "Old 1",
      isOldMap: true,
      envelope: [
        [139, 35],
        [140, 35],
        [140, 36],
        [139, 36]
      ]
    },
    {
      mapID: "old2",
      label: "Old 2",
      isOldMap: true,
      envelope: [
        [139, 35],
        [140, 35],
        [140, 36],
        [139, 36]
      ]
    },
    {
      mapID: "old3",
      label: "Old 3",
      isOldMap: true,
      envelope: [
        [139, 35],
        [140, 35],
        [140, 36],
        [139, 36]
      ]
    }
  ],
  pois: []
};

async function mountUi(setting: any = BASE): Promise<Ui> {
  const ui = document.createElement(MAPLAT_UI_TAG) as Ui;
  ui.setting = structuredClone(setting);
  document.body.appendChild(ui);
  await ui.ready;
  return ui;
}

const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const shadow = (ui: Ui) => ui.shadowRoot!;
const slider = (ui: Ui, kind: "base" | "overlay") =>
  shadow(ui).querySelector(
    `[part="map-slider"][data-kind="${kind}"]`
  ) as HTMLElement;
const track = (ui: Ui, kind: "base" | "overlay") =>
  slider(ui, kind).querySelector(".map-slider-track") as HTMLElement;
const selected = (ui: Ui, kind: "base" | "overlay") =>
  new Set(
    Array.from(slider(ui, kind).querySelectorAll("[part~=map-slide]"))
      .filter(card => card.classList.contains("selected"))
      .map(card => (card as HTMLElement).dataset.mapId)
  );
const key = (el: Element, value: string) =>
  el.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: value,
      bubbles: true,
      cancelable: true
    })
  );

const saved = {
  step: SLIDER_TUNING.stepDurationMs,
  far: SLIDER_TUNING.farStepDurationMs
};
beforeEach(() => {
  // jsdom は transition を流さないので、`#canAnimate` が真でも待たないよう 0 にする
  SLIDER_TUNING.stepDurationMs = 0;
  SLIDER_TUNING.farStepDurationMs = 0;
});
afterEach(() => {
  SLIDER_TUNING.stepDurationMs = saved.step;
  SLIDER_TUNING.farStepDurationMs = saved.far;
  document.body.replaceChildren();
});

describe("地図の切り替えスライダーの配線", () => {
  it("左右 2 本に分け、起動時は動かさずに今の地図へ置く（animate=false）", async () => {
    const ui = await mountUi();
    const base = slider(ui, "base");
    const overlay = slider(ui, "overlay");
    expect(base).not.toBeNull();
    expect(overlay).not.toBeNull();
    // 背景 2 枚・重ねる地図 3 枚（usable だけ）
    expect(
      new Set(
        Array.from(base.querySelectorAll("[part~=map-slide]")).map(
          card => (card as HTMLElement).dataset.mapId
        )
      )
    ).toEqual(new Set(["osm", "gsi"]));
    expect(
      new Set(
        Array.from(overlay.querySelectorAll("[part~=map-slide]")).map(
          card => (card as HTMLElement).dataset.mapId
        )
      )
    ).toEqual(new Set(["old1", "old2", "old3"]));
    // 今の地図 old1 が選ばれ、中央に来ている（起動時は transition を付けない）
    expect(selected(ui, "overlay")).toEqual(new Set(["old1"]));
    expect(track(ui, "overlay").style.transition).toBe("");
    expect(track(ui, "overlay").style.transform).toContain("0px");
  });

  it("矢印・キーボードでは地図を変えず、Enter とカードの押下だけで changeMap する（D5）", async () => {
    const ui = await mountUi();
    const overlay = slider(ui, "overlay");
    const app = ui.app! as any;

    const live = () => overlay.querySelector(".map-slider-live")!.textContent;
    // 矢印: 中央は隣へ動くが、選択も地図も変わらない（地図を変えるのは onSelect だけ。D5）
    (overlay.querySelector('[part="map-slider-next"]') as HTMLElement).click();
    await tick();
    await tick();
    expect(app.currentMapId).toBe("old1");
    expect(selected(ui, "overlay")).toEqual(new Set(["old1"]));
    expect(live()).toBe("Old 2");

    // キーボードの ←/→ も同じ（地図は変わらない）
    key(overlay, "ArrowRight");
    await tick();
    await tick();
    expect(app.currentMapId).toBe("old1");
    expect(selected(ui, "overlay")).toEqual(new Set(["old1"]));
    expect(live()).toBe("Old 3");

    // Enter は中央のカードを選ぶ＝地図を変える
    key(overlay, "Enter");
    await tick();
    expect(app.currentMapId).toBe("old3");
    expect(selected(ui, "overlay")).toEqual(new Set(["old3"]));

    // Home は先頭へ動かすだけ（地図は変えない）、Enter で変わる
    key(overlay, "Home");
    await tick();
    await tick();
    expect(app.currentMapId).toBe("old3");
    expect(live()).toBe("Old 1");
    key(overlay, "Enter");
    await tick();
    expect(app.currentMapId).toBe("old1");
    expect(selected(ui, "overlay")).toEqual(new Set(["old1"]));
  });

  it("1 枚のスライダーは single-map（枠を描かず、矢印を出さない）。overlay: false でも隠さない（P3・S8）", async () => {
    const setting: any = structuredClone(BASE);
    setting.sources = [
      { mapID: "osm", label: "OSM", isBasemap: true },
      { mapID: "old1", label: "Old 1", isOldMap: true }
    ];
    const ui = document.createElement(MAPLAT_UI_TAG) as Ui;
    ui.setting = setting;
    ui.setAttribute("overlay", "false");
    document.body.appendChild(ui);
    await ui.ready;
    const base = slider(ui, "base");
    const overlay = slider(ui, "overlay");
    expect(base.classList.contains("single-map")).toBe(true);
    expect(overlay.classList.contains("single-map")).toBe(true);
    for (const root of [base, overlay]) {
      expect(
        (root.querySelector('[part="map-slider-prev"]') as HTMLElement).hidden
      ).toBe(true);
      expect(
        (root.querySelector('[part="map-slider-next"]') as HTMLElement).hidden
      ).toBe(true);
    }
    // P3: overlay: false でも 2 本とも隠さない（旧 UI は透過度のスライダーだけを隠していた）
    expect(base.hidden).toBe(false);
    expect(overlay.hidden).toBe(false);
    expect(shadow(ui).querySelectorAll('[part="map-slider"]').length).toBe(2);
  });

  it("mapChanged で選択と中央が追従する（遠い地図も飛ばさずに最後まで動く）", async () => {
    // 時間を 0 にして、動きの途中ではなく「最後にどこへ来たか」を見る（飛ばしの検出は e2e の M3）
    const setting: any = structuredClone(BASE);
    setting.sources.push({
      mapID: "old4",
      label: "Old 4",
      isOldMap: true,
      envelope: [
        [139, 35],
        [140, 35],
        [140, 36],
        [139, 36]
      ]
    });
    const ui = await mountUi(setting);
    const live = () =>
      slider(ui, "overlay").querySelector(".map-slider-live")!.textContent;
    ui.mapId = "old2";
    await tick();
    await tick();
    expect(live()).toBe("Old 2");
    ui.mapId = "old4";
    await tick();
    await tick();
    await tick();
    await tick();
    expect(live()).toBe("Old 4");
    expect(selected(ui, "overlay")).toEqual(new Set(["old4"]));
    expect(ui.app!.currentMapId).toBe("old4");
  });

  it("範囲の塗りは、重ねる地図のスライダーの中央のカードに追従する（旧 updateEnvelope）", async () => {
    // 背景の地図を表示中は、重ねる地図のスライダーの中央のカードで塗る（旧 UI の isActive）
    const setting: any = structuredClone(BASE);
    setting.startFrom = "osm";
    const ui = await mountUi(setting);
    // 選択は今の地図（osm）にだけ付く。重ねる地図の側は選択を付けない（旧 swiper_ex.ts の
    // setSlideMapID は無い側の .selected を外すだけ。設計 S9）
    expect(selected(ui, "base")).toEqual(new Set(["osm"]));
    expect(selected(ui, "overlay")).toEqual(new Set());
    const controller = getMockLayerAController(ui.app!)!;
    ui.setShowBorder(true);
    expect(controller.envelopes.map((e: any) => e.fill)).toEqual([
      "rgba(128, 0, 0, 0.4)",
      undefined,
      undefined
    ]);
    // 矢印で中央を old2 へ動かすと、地図は変わらないが塗りは先に追従する（設計 §4.6）
    (
      slider(ui, "overlay").querySelector(
        '[part="map-slider-next"]'
      ) as HTMLElement
    ).click();
    await tick();
    await tick();
    expect(ui.app!.currentMapId).toBe("osm");
    expect(controller.envelopes.map((e: any) => e.fill)).toEqual([
      undefined,
      "rgba(255, 20, 147, 0.4)",
      undefined
    ]);
  });
});
