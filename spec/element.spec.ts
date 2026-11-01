// @vitest-environment jsdom
// <maplat-ui>（src/element/）の単体テスト。@maplat/core/conformance の**模擬の層 A**（公開面だけを持つ
// <maplat-app>。中身は closed の Shadow DOM に隠れ、地図も OpenLayers も持たない）の上で動かす
// ＝ <maplat-ui> が層 A の公開面だけで動くことの確認（形・流し方・公開面だけ）。
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  defineMockMaplatApp,
  getMockLayerAController
} from "@maplat/core/conformance";
import {
  MAPLAT_UI_ATTRIBUTES,
  MAPLAT_UI_TAG,
  MAPLAT_APP_TAG
} from "@maplat/core/common";
import {
  MaplatUiElement,
  MAPLAT_UI_VERSION,
  defineMaplatUi
} from "../src/element";
import { MAPLAT_UI_CSS } from "../src/element/styles";

defineMockMaplatApp();

const SETTING = {
  appName: { ja: "テストアプリ", en: "Test App" },
  lang: "en",
  homePosition: [139.7, 35.7],
  defaultZoom: 14,
  startFrom: "old1",
  sources: [
    {
      mapID: "osm",
      label: { ja: "OSM（現在）", en: "OSM (now)" },
      isBasemap: true,
      thumbnail: "tmbs/osm.jpg"
    },
    { mapID: "gsi", label: "GSI", isBasemap: true },
    {
      mapID: "old1",
      label: { ja: "古地図1", en: "Old map 1" },
      isOldMap: true,
      meta: { title: { ja: "古地図の題", en: "Old map title" } }
    },
    { mapID: "broken", label: "Broken", usable: false }
  ],
  pois: [
    {
      id: "p1",
      namespaceID: "main#p1",
      name: { ja: "城", en: "Castle" },
      address: { ja: "住所", en: "Address" },
      desc: '<b>bold</b><img src="x" onerror="alert(1)">\nline2',
      image: "castle.jpg"
    }
  ]
};

type Ui = MaplatUiElement & HTMLElement;

function shadow(ui: Ui) {
  return ui.shadowRoot!;
}
function part(ui: Ui, name: string) {
  return shadow(ui).querySelector(`[part~="${name}"]`) as HTMLElement;
}
function click(el: Element) {
  (el as HTMLElement).click();
}
const tick = () => new Promise(r => setTimeout(r, 0));

/** <maplat-ui> を作って繋ぐ（子は UI が作る）。 */
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

describe("<maplat-ui> の形（B-形）", () => {
  it("登録される・Shadow DOM は open・地図のスロットを持つ", () => {
    expect(customElements.get(MAPLAT_UI_TAG)).toBe(MaplatUiElement);
    const ui = document.createElement(MAPLAT_UI_TAG) as Ui;
    expect(ui.shadowRoot).not.toBeNull();
    expect(ui.shadowRoot!.mode).toBe("open");
    expect(ui.shadowRoot!.querySelector('slot[name="map"]')).not.toBeNull();
    expect(ui.implementation).toBe("ui");
    expect(ui.version).toBe(MAPLAT_UI_VERSION);
  });

  it("版は package.json の version と同じ", () => {
    const pkg = JSON.parse(
      readFileSync(resolve(__dirname, "../package.json"), "utf-8")
    );
    expect(MAPLAT_UI_VERSION).toBe(pkg.version);
  });

  it("二重登録は上書きせず英語で警告する", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(defineMaplatUi()).toBe(false);
    expect(customElements.get(MAPLAT_UI_TAG)).toBe(MaplatUiElement);
    expect(warn).toHaveBeenCalledWith(
      "<maplat-ui> is already defined; it was not redefined."
    );
    class Other extends HTMLElement {}
    customElements.define("maplat-ui-other-test", Other);
    expect(defineMaplatUi("maplat-ui-other-test")).toBe(false);
    expect(warn).toHaveBeenLastCalledWith(
      "<maplat-ui-other-test> is already defined by another implementation; this implementation did not redefine it."
    );
  });

  it("lang は HTMLElement の lang を上書きしない（自分の属性だけを見る）", () => {
    expect(
      Object.getOwnPropertyDescriptor(MaplatUiElement.prototype, "lang")
    ).toBeUndefined();
  });

  it('<maplat-ui> だけ書いたら light DOM の子に <maplat-app slot="map"> を作り、層 A のキーを流す', async () => {
    const ui = await mountUi(u => {
      u.setAttribute("transparency", "40");
      u.poiTemplate = "<b>${name}</b>";
    });
    const app = ui.app!;
    expect(app).not.toBeNull();
    expect(app.localName).toBe(MAPLAT_APP_TAG);
    expect(app.parentElement).toBe(ui); // Shadow DOM の中ではなく light DOM
    expect(app.getAttribute("slot")).toBe("map");
    expect(ui.shadowRoot!.querySelector(MAPLAT_APP_TAG)).toBeNull();
    expect(app.implementation).toBe("core"); // 模擬の層 A
    // 属性で表せるキーは属性で、プロパティのみのキーはプロパティで流れる
    expect(app.getAttribute("transparency")).toBe("40");
    expect(app.poiTemplate).toBe("<b>${name}</b>");
    expect(app.setting).toEqual(SETTING);
    expect(app.getTransparency()).toBe(40);
  });

  it("ready は子の ready の後に解決し、uiReady を出す", async () => {
    const ui = document.createElement(MAPLAT_UI_TAG) as Ui;
    ui.setting = structuredClone(SETTING);
    const events: string[] = [];
    ui.addEventListener("uiReady", () => events.push("uiReady"));
    ui.addEventListener("lifecycle:ui-ready", () =>
      events.push("child:ui-ready")
    );
    document.body.appendChild(ui);
    await ui.ready;
    await ui.app!.ready;
    expect(events).toEqual(["child:ui-ready", "uiReady"]);
  });
});

// m3（文書のレビュー 2026-10-24）: 実行時にあるのに `interface MaplatUiElement` に無いキーがあった
// （`presentationMode`・`appEnvelope`）。層 B の属性のプロパティは全部 interface に載せる。
// `tsc --noEmit` は spec/ を対象にしない（tsconfig.json の include は src・test・parts）ので、
// interface に載っているかはソースの interface の本文を読んで確かめる（値の側は実行時にも確かめる）。
describe("型（interface MaplatUiElement）", () => {
  const source = readFileSync(
    resolve(__dirname, "../src/element/maplat-ui.ts"),
    "utf-8"
  );
  /** 末尾の `export interface MaplatUiElement { … }` の本文。 */
  const interfaceBody = (() => {
    const start = source.indexOf("export interface MaplatUiElement {");
    expect(start).toBeGreaterThanOrEqual(0);
    return source.slice(start, source.indexOf("\n}", start));
  })();
  /** 宣言されているメンバーの名前（`  prop: T;` の prop）。 */
  const declared = new Set(
    Array.from(interfaceBody.matchAll(/^ {2}(\w+)\??:/gm), m => m[1])
  );

  it("層 B の属性のプロパティが全部載っている（m3 の presentationMode・appEnvelope の抜け）", () => {
    // lang は HTMLElement のものを上書きしない（要素は自分の属性だけを見る）ので interface には無い
    const layerB = MAPLAT_UI_ATTRIBUTES.map(def => def.prop).filter(
      prop => prop !== "lang"
    );
    expect(layerB.length).toBeGreaterThan(0);
    expect(declared.size).toBeGreaterThan(0);
    for (const prop of layerB) expect(declared.has(prop), prop).toBe(true);
    // m3 で名指しされた 2 つ（値の側は型が付いていても実行時に読めることを確かめる）
    for (const prop of ["presentationMode", "appEnvelope"])
      expect(declared.has(prop), prop).toBe(true);
  });

  it("presentationMode・appEnvelope はプロパティと属性が対応する（型と実行時が同じ）", () => {
    const ui = document.createElement(MAPLAT_UI_TAG) as Ui;
    // 起動前は未指定（属性も無い）
    expect(ui.presentationMode).toBeUndefined();
    expect(ui.appEnvelope).toBeUndefined();
    expect(ui.hasAttribute("presentation-mode")).toBe(false);
    expect(ui.hasAttribute("app-envelope")).toBe(false);
    // 真偽のプロパティは属性（空文字）へ、属性はプロパティ（真偽）へ
    ui.presentationMode = true;
    ui.appEnvelope = true;
    expect(ui.getAttribute("presentation-mode")).toBe("");
    expect(ui.getAttribute("app-envelope")).toBe("");
    expect(ui.presentationMode).toBe(true);
    expect(ui.appEnvelope).toBe(true);
    ui.removeAttribute("presentation-mode");
    ui.removeAttribute("app-envelope");
    expect(ui.presentationMode).toBeUndefined();
    expect(ui.appEnvelope).toBeUndefined();
  });
});

describe("層 A の状態の書き戻し（map-id・transparency。「属性への書き戻し」）", () => {
  it("子が内部の操作で書き戻した状態を、<maplat-ui> が流しているキーなら <maplat-ui> の属性へも映す（流し直さない）", async () => {
    const ui = await mountUi(u => {
      u.setAttribute("map-id", "old1");
      u.setAttribute("transparency", "20");
    });
    const app = ui.app! as any;
    const changed: string[] = [];
    app.addEventListener("mapChanged", (e: CustomEvent) =>
      changed.push(e.detail.mapID)
    );
    // UI の地図の切り替え（メニュー）と同じく、子のメソッドで替える
    await app.changeMap("osm");
    await vi.waitFor(() => expect(ui.getAttribute("map-id")).toBe("osm"));
    expect(app.getAttribute("map-id")).toBe("osm");
    expect(ui.mapId).toBe("osm");
    await tick();
    expect(changed).toEqual(["osm"]); // 書き戻しで二重に切り替えない
    // スライダーと同じく setTransparency（子は描画 1 回にまとめて書き戻す）
    app.setTransparency(40);
    app.setTransparency(45);
    await vi.waitFor(() => expect(ui.getAttribute("transparency")).toBe("45"));
    expect(app.getAttribute("transparency")).toBe("45");
    expect(app.getTransparency()).toBe(45);
    // 書き戻しの後に元の値を書くと戻せる（<maplat-ui> の属性の変更は子へ流れる）
    ui.setAttribute("map-id", "old1");
    await vi.waitFor(() => expect(app.currentMapId).toBe("old1"));
    expect(app.getAttribute("map-id")).toBe("old1");
  });

  it("<maplat-ui> に書かれていない状態のキーは映さず、子の書き戻しを「子が自分で持つキー」と取り違えない", async () => {
    const ui = await mountUi();
    const app = ui.app! as any;
    // 子は起動した地図を自分の map-id へ書き戻す
    await vi.waitFor(() => expect(app.getAttribute("map-id")).toBe("old1"));
    await app.changeMap("osm");
    await vi.waitFor(() => expect(app.getAttribute("map-id")).toBe("osm"));
    await tick();
    expect(ui.hasAttribute("map-id")).toBe(false);
    // 後から <maplat-ui> に書いた map-id は子へ流れる（子が書き戻した属性は「子が持つキー」ではない）
    ui.setAttribute("map-id", "gsi");
    await vi.waitFor(() => expect(app.currentMapId).toBe("gsi"));
  });

  it("<maplat-ui> ごと外して付け直しても、今の地図のまま（古い map-id から作り直さない）", async () => {
    const ui = await mountUi(u => u.setAttribute("map-id", "old1"));
    await (ui.app as any).changeMap("osm");
    await vi.waitFor(() => expect(ui.getAttribute("map-id")).toBe("osm"));
    ui.remove();
    await new Promise(r => setTimeout(r, 20));
    document.body.appendChild(ui);
    await ui.ready;
    expect(ui.app!.currentMapId).toBe("osm");
    expect(ui.getAttribute("map-id")).toBe("osm");
    // 繋ぎ直した後も <maplat-ui> の map-id は子へ流れる（前に流したキーを「子が持つキー」と取り違えない）
    ui.setAttribute("map-id", "gsi");
    await vi.waitFor(() => expect(ui.app!.currentMapId).toBe("gsi"));
  });
});

describe("層 A のキーの流し方（流し方）", () => {
  it("ページが置いた子を使い、子が自分で持つキーには触れない（近い方が勝つ）", async () => {
    const ui = document.createElement(MAPLAT_UI_TAG) as Ui;
    ui.setAttribute("map-id", "gsi");
    ui.setAttribute("transparency", "20");
    ui.poiTemplate = "ui";
    const app = document.createElement(MAPLAT_APP_TAG) as any;
    app.setAttribute("slot", "map");
    app.setAttribute("map-id", "osm");
    app.poiTemplate = "child";
    app.setting = structuredClone(SETTING);
    ui.appendChild(app);
    document.body.appendChild(ui);
    await ui.ready;
    expect(ui.app).toBe(app);
    expect(app.getAttribute("map-id")).toBe("osm");
    expect(app.currentMapId).toBe("osm");
    expect(app.poiTemplate).toBe("child");
    expect(app.getAttribute("transparency")).toBe("20");

    // <maplat-ui> 側の値が変わったら流し直す。子が持つキーは引き続き触れない
    ui.transparency = 55;
    expect(app.getAttribute("transparency")).toBe("55");
    ui.setAttribute("map-id", "old1");
    expect(app.getAttribute("map-id")).toBe("osm");
    // 流したキーを外したら子からも外す
    ui.removeAttribute("transparency");
    expect(app.hasAttribute("transparency")).toBe(false);
  });

  it('真偽のキーは値で流す（north-up="false" も流れる）', async () => {
    const ui = await mountUi(u => u.setAttribute("north-up", "false"));
    expect(ui.app!.getAttribute("north-up")).toBe("false");
    expect(ui.app!.northUp).toBe(false);
    ui.northUp = true;
    expect(ui.app!.getAttribute("north-up")).toBe("");
    expect(ui.app!.northUp).toBe(true);
  });

  it("restore は層 B の拡張キー（showBorder・openedMarker）を除いて子へ流す", async () => {
    const ui = await mountUi(u => {
      u.restore = {
        mapID: "gsi",
        transparency: 10,
        showBorder: 1,
        openedMarker: "main#p1"
      };
    });
    expect(ui.app!.restore).toEqual({ mapID: "gsi", transparency: 10 });
    expect(ui.app!.currentMapId).toBe("gsi");
  });

  it("起動時だけのキーを起動後に変えると、子が英語で警告して無視する（作り直さない）", async () => {
    const ui = await mountUi(u => u.setAttribute("app-id", "first"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const ready = ui.app!.ready;
    ui.setAttribute("app-id", "second");
    expect(ui.app!.getAttribute("app-id")).toBe("second");
    expect(ui.app!.appId).toBe("first");
    expect(ui.app!.ready).toBe(ready);
    expect(
      warn.mock.calls.some(c => /fixed at startup/.test(String(c[0])))
    ).toBe(true);
  });
});

describe("操作ボタン（公開メソッドを呼ぶ）", () => {
  let ui: Ui;
  let app: any;
  beforeEach(async () => {
    ui = await mountUi();
    app = ui.app!;
  });

  it("＋／− は zoomBy(+1) / zoomBy(-1)", () => {
    const zoomBy = vi.spyOn(app, "zoomBy");
    const before = app.viewpoint.zoom;
    click(part(ui, "zoom-in"));
    expect(zoomBy).toHaveBeenLastCalledWith(1);
    click(part(ui, "zoom-out"));
    click(part(ui, "zoom-out"));
    expect(zoomBy).toHaveBeenLastCalledWith(-1);
    expect(app.viewpoint.zoom).toBe(before - 1);
  });

  it("ホームは goHome()", () => {
    const goHome = vi.spyOn(app, "goHome");
    click(part(ui, "home").querySelector("button")!);
    expect(goHome).toHaveBeenCalledTimes(1);
  });

  it("GPS は handleGPS で切り替え、gpsEnabledChanged で点灯する", () => {
    const handleGPS = vi.spyOn(app, "handleGPS");
    const gps = part(ui, "gps");
    expect(gps.classList.contains("disable")).toBe(true);
    click(gps.querySelector("button")!);
    expect(handleGPS).toHaveBeenLastCalledWith(true);
    expect(app.gpsEnabled).toBe(true);
    expect(gps.classList.contains("disable")).toBe(false);
    click(gps.querySelector("button")!);
    expect(handleGPS).toHaveBeenLastCalledWith(false);
    expect(gps.classList.contains("disable")).toBe(true);
    // 中身の都合で切れた（handleGPS(false, true) 相当）ときも消える
    click(gps.querySelector("button")!);
    getMockLayerAController(app)!.setGpsEnabledInternally(false);
    expect(gps.classList.contains("disable")).toBe(true);
  });

  it("always-gps-on なら GPS ボタンは常に handleGPS(true)", async () => {
    const ui2 = await mountUi(u => u.setAttribute("always-gps-on", ""));
    const app2 = ui2.app! as any;
    const handleGPS = vi.spyOn(app2, "handleGPS");
    click(part(ui2, "gps").querySelector("button")!);
    click(part(ui2, "gps").querySelector("button")!);
    expect(handleGPS.mock.calls).toEqual([[true], [true]]);
  });

  it("透過度のスライダーは setTransparency。背景地図では動かせない", async () => {
    const slider = part(ui, "slider") as HTMLInputElement;
    expect(slider.hidden).toBe(false);
    expect(app.currentMapId).toBe("old1");
    expect(slider.disabled).toBe(false);
    expect(slider.value).toBe("100");
    const setTransparency = vi.spyOn(app, "setTransparency");
    slider.value = "70";
    slider.dispatchEvent(new Event("input"));
    expect(setTransparency).toHaveBeenLastCalledWith(30);
    expect(app.getTransparency()).toBe(30);
    await app.changeMap("osm");
    expect(slider.disabled).toBe(true);
  });

  it('overlay="false" ならスライダーを出さない', async () => {
    const ui2 = await mountUi(u => u.setAttribute("overlay", "false"));
    expect((part(ui2, "slider") as HTMLInputElement).hidden).toBe(true);
  });

  it("準備前の押下は何もしない", () => {
    const ui2 = document.createElement(MAPLAT_UI_TAG) as Ui;
    document.body.appendChild(ui2); // app-id も setting も無い ⇒ 子は作成を待つ
    expect(() => click(part(ui2, "zoom-in"))).not.toThrow();
    expect(() =>
      click(part(ui2, "home").querySelector("button")!)
    ).not.toThrow();
  });
});

describe("コンパス（層 B の設定で resetDirection / resetRotation を呼び分ける）", () => {
  it("north-up が無ければ resetRotation、north-up なら resetDirection（compass-action 既定の auto）", async () => {
    const ui = await mountUi();
    const app = ui.app! as any;
    const resetRotation = vi.spyOn(app, "resetRotation");
    const resetDirection = vi.spyOn(app, "resetDirection");
    const compass = part(ui, "compass");
    click(compass.querySelector("button")!);
    expect(resetRotation).toHaveBeenCalledTimes(1);
    expect(resetDirection).not.toHaveBeenCalled();
    expect(compass.dataset.action).toBe("rotation");

    ui.setAttribute("north-up", "");
    app.setViewpoint({ direction: 10 });
    expect(compass.dataset.action).toBe("north");
    click(compass.querySelector("button")!);
    expect(resetDirection).toHaveBeenCalledTimes(1);
  });

  it("compass-action で固定できる（north / rotation）", async () => {
    const ui = await mountUi(u => {
      u.setAttribute("north-up", "");
      u.setAttribute("compass-action", "rotation");
    });
    const app = ui.app! as any;
    const resetRotation = vi.spyOn(app, "resetRotation");
    const resetDirection = vi.spyOn(app, "resetDirection");
    click(part(ui, "compass").querySelector("button")!);
    expect(resetRotation).toHaveBeenCalledTimes(1);
    ui.compassAction = "north";
    ui.removeAttribute("north-up");
    click(part(ui, "compass").querySelector("button")!);
    expect(resetDirection).toHaveBeenCalledTimes(1);
  });

  it("針は方位を指し、押しても変わらない状態なら薄く出す", async () => {
    const ui = await mountUi();
    const app = ui.app! as any;
    const compass = part(ui, "compass");
    const needle = compass.querySelector(".needle") as HTMLElement;
    expect(compass.classList.contains("disable")).toBe(true);
    app.setViewpoint({ rotation: 30, direction: 45 });
    expect(needle.style.transform).toBe("rotate(45deg)");
    expect(compass.classList.contains("disable")).toBe(false);
    app.resetRotation();
    expect(compass.classList.contains("disable")).toBe(true);
  });
});

describe("地図の切り替えスライダー（listMaps と changeMap）", () => {
  const slides = (root: HTMLElement) =>
    Array.from(root.querySelectorAll<HTMLElement>('[part~="map-slide"]'));
  const slider = (ui: Ui, kind: "base" | "overlay") =>
    part(ui, "map-switcher").querySelector<HTMLElement>(
      `[part="map-slider"][data-kind="${kind}"]`
    )!;

  it("使える地図を 2 本のスライダーに分け、カードを押すと changeMap で切り替わる", async () => {
    const ui = await mountUi(u => u.setAttribute("lang", "ja"));
    const app = ui.app! as any;
    // 題名は旧 UI と同じ div + span。地図の切り替えメニューは無い（スライダーへ変えた）
    const title = part(ui, "map-title");
    expect(title.hidden).toBe(false);
    expect(title.querySelector(".text")!.textContent).toBe("古地図の題");
    expect(shadow(ui).querySelector(".map-menu")).toBeNull();
    expect(shadow(ui).querySelector('[part="map-menu"]')).toBeNull();
    expect(part(ui, "map-title").querySelector("button")).toBeNull();

    const base = slider(ui, "base");
    const overlay = slider(ui, "overlay");
    // 背景 2 枚（osm・gsi）・重ねる地図 1 枚（old1。broken は載らない）
    expect(new Set(slides(base).map(b => b.dataset.mapId))).toEqual(
      new Set(["osm", "gsi"])
    );
    expect(new Set(slides(overlay).map(b => b.dataset.mapId))).toEqual(
      new Set(["old1"])
    );
    // 1 枚のスライダー: 枠を描かず、矢印を出さない。位置は CSS が保つ
    expect(overlay.classList.contains("single-map")).toBe(true);
    expect(
      overlay.querySelector<HTMLButtonElement>(".map-slider-nav.next")!.hidden
    ).toBe(true);
    // 押したカードが .selected になる（今の地図 old1）
    expect(slides(overlay)[0].classList.contains("selected")).toBe(true);

    const changeMap = vi.spyOn(app, "changeMap");
    click(base.querySelector('[data-map-id="gsi"]') as HTMLElement);
    expect(changeMap).toHaveBeenCalledWith("gsi");
    await tick();
    expect(app.currentMapId).toBe("gsi");
    expect(
      base.querySelector('[data-map-id="gsi"]')!.classList.contains("selected")
    ).toBe(true);
    // 背景の地図に切り替えると、重ねる地図のスライダーは位置（中央の old1）を保ち、`.selected` は外れる
    // （旧 ui_init.ts:173-174 は両方に setSlideMapID(今の地図) を呼び、無い側は選択を外すだけ）
    expect(
      overlay
        .querySelector('[data-map-id="old1"]')!
        .classList.contains("selected")
    ).toBe(false);
    expect(overlay.querySelectorAll(".map-slide.selected").length).toBe(0);
    expect(
      overlay.querySelector('[data-map-id="old1"]')!.closest(".map-slider")
    ).toBe(overlay);
    expect(title.querySelector(".text")!.textContent).toBe("GSI");
  });

  it("ページが map-id で切り替えても題名と選択が追従する", async () => {
    const ui = await mountUi();
    ui.mapId = "gsi";
    await tick();
    expect(ui.app!.currentMapId).toBe("gsi");
    expect(part(ui, "map-title").querySelector(".text")!.textContent).toBe(
      "GSI"
    );
    expect(
      slider(ui, "base")
        .querySelector('[data-map-id="gsi"]')!
        .classList.contains("selected")
    ).toBe(true);
  });
});

describe("POI の吹き出し（clickMarkers / clickMarker）", () => {
  it("clickMarkers が 1 件なら名前・住所・説明・メディアを出す（説明は sanitizeHtml を通す）", async () => {
    const ui = await mountUi(u => u.setAttribute("lang", "ja"));
    const app = ui.app! as any;
    const selectMarker = vi.spyOn(app, "selectMarker");
    const unselectMarker = vi.spyOn(app, "unselectMarker");
    const modal = part(ui, "poi-modal");
    expect(modal.hidden).toBe(true);
    getMockLayerAController(app)!.fire("clickMarkers", [
      app.getMarker("main#p1")
    ]);
    expect(modal.hidden).toBe(false);
    expect(part(ui, "poi-title").textContent).toBe("城");
    const body = part(ui, "poi-body");
    expect(body.querySelector(".poi-address")!.textContent).toBe("住所");
    const desc = body.querySelector(".poi-desc")!;
    expect(desc.querySelector("b")!.textContent).toBe("bold");
    expect(desc.innerHTML).not.toMatch(/onerror/);
    expect(desc.innerHTML).toMatch(/<br>line2/);
    // 画像は Chuci のスワイパー（旧 poiWebControl と同じ組み方）。相対の名前は img/ の下
    const slide = body.querySelector(
      '[part="poi-media"] cc-swiper[part="poi-swiper"] > cc-swiper-slide'
    )!;
    expect(slide.getAttribute("image-url")).toBe("img/castle.jpg");
    expect(slide.getAttribute("image-type")).toBe("image");
    expect(slide.getAttribute("thumbnail-url")).toBe("img/castle.jpg");
    expect(selectMarker).toHaveBeenCalledWith("main#p1");
    // 言語を替えると開いている吹き出しも描き直す（言語ファイルの読み込みを待つ）
    ui.setAttribute("lang", "en");
    await vi.waitFor(() =>
      expect(part(ui, "poi-title").textContent).toBe("Castle")
    );

    click(part(ui, "poi-close"));
    expect(modal.hidden).toBe(true);
    expect(unselectMarker).toHaveBeenCalled();
  });

  it("clickMarker だけを出す実装でも開く（同じ拍に clickMarkers が来なければ単独で開く）", async () => {
    const ui = await mountUi();
    const ctl = getMockLayerAController(ui.app!)!;
    const modal = part(ui, "poi-modal");
    ctl.fire("clickMarker", (ui.app as any).getMarker("main#p1"));
    expect(modal.hidden).toBe(true); // clickMarkers を待つ
    await Promise.resolve();
    expect(modal.hidden).toBe(false);
    expect(part(ui, "poi-title").textContent).toBe("Castle");
  });

  it("clickMarker に続く clickMarkers が複数なら、吹き出しを開かず選択メニューを出す", async () => {
    const ui = await mountUi();
    const ctl = getMockLayerAController(ui.app!)!;
    const a = { namespaceID: "a", id: "a", name: "A" };
    const b = { namespaceID: "b", id: "b", name: "B" };
    ctl.fire("clickMarker", a);
    ctl.fire("clickMarkers", [a, b]);
    await tick();
    expect(part(ui, "poi-modal").hidden).toBe(true);
    expect(part(ui, "poi-menu").hidden).toBe(false);
  });

  it("html の POI は入れ子の Shadow DOM に sanitizeHtml を通して描く", async () => {
    const ui = await mountUi();
    const app = ui.app! as any;
    getMockLayerAController(app)!.fire("clickMarkers", [
      {
        namespaceID: "x",
        name: "H",
        html: '<p class="ok">hello</p><script>window.__pwned = 1</script><img src="a.png" onerror="alert(1)">'
      }
    ]);
    const host = part(ui, "poi-html");
    expect(host).not.toBeNull();
    expect(host.classList.contains("scroll")).toBe(true);
    const inner = host.shadowRoot!.innerHTML;
    expect(inner).toMatch(/<p class="ok">hello<\/p>/);
    expect(inner).not.toMatch(/script/);
    expect(inner).not.toMatch(/onerror/);
  });

  it("enable-poi-html-no-scroll なら html・url の本文に内部のスクロールを持たせない（次に開く POI から）", async () => {
    const ui = await mountUi();
    const ctl = getMockLayerAController(ui.app!)!;
    ui.setAttribute("enable-poi-html-no-scroll", "");
    expect(ui.enablePoiHtmlNoScroll).toBe(true);
    ctl.fire("clickMarkers", [
      { namespaceID: "h", name: "H", html: "<p>x</p>" }
    ]);
    expect(part(ui, "poi-html").classList.contains("scroll")).toBe(false);
    ctl.fire("clickMarkers", [
      { namespaceID: "u", name: "U", url: "https://example.com/" }
    ]);
    const iframe = part(ui, "poi-iframe") as HTMLIFrameElement;
    expect(iframe.getAttribute("scrolling")).toBe("no");
    ui.enablePoiHtmlNoScroll = false;
    ctl.fire("clickMarkers", [
      { namespaceID: "u", name: "U", url: "https://example.com/" }
    ]);
    expect(part(ui, "poi-iframe").hasAttribute("scrolling")).toBe(false);
  });

  it("url の POI は http/https のときだけ iframe にする", async () => {
    const ui = await mountUi();
    const ctl = getMockLayerAController(ui.app!)!;
    ctl.fire("clickMarkers", [
      { namespaceID: "a", name: "A", url: "javascript:alert(1)" }
    ]);
    expect(part(ui, "poi-body").querySelector("iframe")).toBeNull();
    ctl.fire("clickMarkers", [
      { namespaceID: "b", name: "B", url: "https://example.com/" }
    ]);
    expect(
      (part(ui, "poi-body").querySelector("iframe") as HTMLIFrameElement).src
    ).toBe("https://example.com/");
  });

  // ---- 旧 ui_marker.ts を消したので、その回帰をここへ移した（旧 spec の名前を行頭に書く） ----

  // 旧 ui_marker_poi_html.spec.ts（m1-t5 AC1/AC10）: html と url の両方なら html を優先する
  it("html と url が両方あるときは html を優先し、iframe を作らない（m1-t5 AC1/AC10）", async () => {
    const ui = await mountUi();
    getMockLayerAController(ui.app!)!.fire("clickMarkers", [
      {
        namespaceID: "both",
        name: "B",
        html: "<p>ok</p>",
        url: "https://example.com/"
      }
    ]);
    expect(part(ui, "poi-body").querySelector("iframe")).toBeNull();
    expect(part(ui, "poi-html")).not.toBeNull();
  });

  // 旧 ui_marker_poi_html.spec.ts（m1-t5 AC1/AC10）: url の経路は sanitize の経路（Shadow DOM の html
  // host）を作らない。iframe にインラインの onload 属性も付けない（message の受け口を置かない）
  it("url だけなら iframe を作り、html host と onload 属性を作らない（m1-t5 AC1/AC10）", async () => {
    const ui = await mountUi();
    getMockLayerAController(ui.app!)!.fire("clickMarkers", [
      { namespaceID: "u", name: "U", url: "https://example.com/" }
    ]);
    expect(part(ui, "poi-html")).toBeNull();
    const iframe = part(ui, "poi-body").querySelector("iframe")!;
    expect(iframe.hasAttribute("onload")).toBe(false);
    expect(
      Array.from(iframe.attributes)
        .map(a => a.name)
        .sort()
    ).toEqual(["class", "part", "src"]);
  });

  // 旧 oct26-m16-t1-ui-marker-url.spec.ts（B-UI-2）: url の許可リスト（同じ一覧をそのまま使う）
  it("url は http/https（相対 URL を含む）のときだけ iframe に入れる（B-UI-2）", async () => {
    const REJECTED_URLS = [
      "javascript:alert(1)",
      "JaVaScRiPt:alert(1)",
      "  javascript:alert(1)  ",
      "\tjava\nscript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "DATA:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
      "vbscript:msgbox(1)",
      " VBScript:msgbox(1)",
      "blob:https://example.com/uuid",
      "file:///etc/passwd"
    ];
    const ACCEPTED_URLS = [
      "https://example.com/",
      "http://example.com/a?b=c#d",
      "HTTPS://EXAMPLE.COM/",
      "./poi/1.html",
      "poi/1.html",
      "/abs/path.html",
      "?q=1",
      "//example.com/x"
    ];
    const ui = await mountUi();
    const ctl = getMockLayerAController(ui.app!)!;
    let id = 0;
    for (const url of REJECTED_URLS) {
      ctl.fire("clickMarkers", [{ namespaceID: `r${id++}`, name: "R", url }]);
      expect(
        part(ui, "poi-body").querySelector("iframe"),
        `rejected ${url}`
      ).toBeNull();
    }
    for (const url of ACCEPTED_URLS) {
      ctl.fire("clickMarkers", [{ namespaceID: `a${id++}`, name: "A", url }]);
      const iframe = part(ui, "poi-body").querySelector("iframe");
      expect(iframe, `accepted ${url}`).not.toBeNull();
      expect(iframe!.getAttribute("src"), `accepted ${url}`).toBe(url);
    }
  });

  // 旧 oct26-m16-t1-ui-marker-url.spec.ts（B-UI-3）: directgo は http/https のときだけ遷移する
  // （旧と同じ一覧をそのまま使う: 拒否 10 件・許可 8 件。旧 UI の実装の削除の仕上げで、減っていた件数を旧に戻した）
  describe("directgo は http/https のときだけ遷移する（B-UI-3）", () => {
    const REJECTED_URLS = [
      "javascript:alert(1)",
      "JaVaScRiPt:alert(1)",
      "  javascript:alert(1)  ",
      "\tjava\nscript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "DATA:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
      "vbscript:msgbox(1)",
      " VBScript:msgbox(1)",
      "blob:https://example.com/uuid",
      "file:///etc/passwd"
    ];
    const ACCEPTED_URLS = [
      "https://example.com/",
      "http://example.com/a?b=c#d",
      "HTTPS://EXAMPLE.COM/",
      "./poi/1.html",
      "poi/1.html",
      "/abs/path.html",
      "?q=1",
      "//example.com/x"
    ];
    let openSpy: ReturnType<typeof vi.fn>;
    let hrefSet: string[];
    let originalLocation: PropertyDescriptor | undefined;

    // location の差し替えは**起動のあと**に入れる（起動は location.href を読むので先に壊さない）。
    // jsdom は代入を「Not implemented: navigation」にするので、記録だけする偽物に替える
    const installFakeLocation = () => {
      const fakeLocation = {
        get href() {
          return "https://maplat.example/app/";
        },
        set href(v: string) {
          hrefSet.push(v);
        }
      };
      Object.defineProperty(globalThis, "location", {
        configurable: true,
        get: () => fakeLocation
      });
    };

    beforeEach(() => {
      openSpy = vi.fn(() => null);
      vi.stubGlobal("open", openSpy);
      hrefSet = [];
      originalLocation = Object.getOwnPropertyDescriptor(
        globalThis,
        "location"
      );
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      if (originalLocation) {
        Object.defineProperty(globalThis, "location", originalLocation);
      }
    });

    const fire = async (directgo: unknown) => {
      const ui = await mountUi();
      installFakeLocation();
      getMockLayerAController(ui.app!)!.fire("clickMarkers", [
        { namespaceID: "d", name: "D", directgo }
      ]);
      // directgo は吹き出しを出さない（旧と同じ）
      expect(part(ui, "poi-modal").hidden).toBe(true);
    };

    it("テストの前提: window.location の差し替えが効いている", () => {
      installFakeLocation();
      window.location.href = "https://probe.example/";
      expect(hrefSet).toEqual(["https://probe.example/"]);
    });

    it.each(REJECTED_URLS)("文字列 %s では遷移しない", async url => {
      await fire(url);
      expect(hrefSet).toEqual([]);
      expect(openSpy).not.toHaveBeenCalled();
    });

    it.each(REJECTED_URLS)(
      "blank 指定 %s では window.open しない",
      async url => {
        await fire({ href: url, blank: true });
        expect(openSpy).not.toHaveBeenCalled();
        expect(hrefSet).toEqual([]);
      }
    );

    it.each(ACCEPTED_URLS)(
      "文字列 %s では location.href へ代入する",
      async url => {
        await fire(url);
        expect(hrefSet).toEqual([url]);
        expect(openSpy).not.toHaveBeenCalled();
      }
    );

    // SR-NOV26-B-3: 逆タブナビング対策で noopener,noreferrer を付ける（旧 `oct26-m16-t1-ui-marker-url.spec.ts` と同じ期待値）
    it.each(ACCEPTED_URLS)(
      "blank 指定 %s では window.open(_blank, noopener,noreferrer)",
      async url => {
        await fire({ href: url, blank: true });
        expect(openSpy).toHaveBeenCalledWith(
          url,
          "_blank",
          "noopener,noreferrer"
        );
        expect(hrefSet).toEqual([]);
      }
    );

    it("オブジェクト形で blank が無ければ location.href へ代入する", async () => {
      await fire({ href: "https://example.com/" });
      expect(hrefSet).toEqual(["https://example.com/"]);
    });
  });

  it("背景のクリック・Escape で閉じる。openMarker(id) で開ける", async () => {
    const ui = await mountUi();
    const modal = part(ui, "poi-modal");
    ui.openMarker("main#p1");
    expect(modal.hidden).toBe(false);
    modal.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(modal.hidden).toBe(true);
    ui.openMarker("p1");
    expect(modal.hidden).toBe(false);
    part(ui, "poi-close").dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        composed: true
      })
    );
    expect(modal.hidden).toBe(true);
    ui.openMarker("no-such-id");
    expect(modal.hidden).toBe(true);
  });
});

describe("POI のメディア（Chuci のスワイパー・旧 ui_marker.ts の poiWebControl）", () => {
  const slidesOf = (ui: Ui) =>
    Array.from(
      part(ui, "poi-body").querySelectorAll("cc-swiper > cc-swiper-slide")
    ).map(el => {
      const attrs: Record<string, string> = {};
      for (const a of Array.from(el.attributes)) attrs[a.name] = a.value;
      return attrs;
    });

  it("種類を type か src の拡張子で描き分ける（image・youtube・video・3dmodel・gaussian・panorama）", async () => {
    const ui = await mountUi(u => u.setAttribute("lang", "ja"));
    getMockLayerAController(ui.app!)!.fire("clickMarkers", [
      {
        namespaceID: "m",
        name: "M",
        media: [
          "photo.jpg",
          {
            src: "https://www.youtube.com/watch?v=abc",
            caption: { ja: "動画", en: "Video" }
          },
          {
            src: "https://example.com/v.mp4",
            thumbnail: "v.jpg",
            desc: "旧名の説明"
          },
          {
            src: "model.obj",
            "material-url": "https://example.com/model.mtl",
            "camera-position": "0,0,5",
            "debug-mode": true
          },
          "scene.splat",
          { src: "https://example.com/pano.jpg", type: "panorama" }
        ]
      }
    ]);
    expect(slidesOf(ui)).toEqual([
      {
        "image-url": "img/photo.jpg",
        "image-type": "image",
        "thumbnail-url": "img/photo.jpg"
      },
      {
        "image-url": "https://www.youtube.com/watch?v=abc",
        "image-type": "youtube",
        caption: "動画"
      },
      {
        "image-url": "https://example.com/v.mp4",
        "image-type": "video",
        "thumbnail-url": "img/v.jpg",
        caption: "旧名の説明"
      },
      {
        "image-url": "img/model.obj",
        "image-type": "3dmodel",
        "material-url": "https://example.com/model.mtl",
        "camera-position": "0,0,5",
        "debug-mode": ""
      },
      { "image-url": "img/scene.splat", "image-type": "gaussian" },
      // 画像以外はサムネイルを指定したときだけ付ける（旧と同じ）
      { "image-url": "https://example.com/pano.jpg", "image-type": "panorama" }
    ]);
  });

  it("危ない URL・許可リストの外の属性を落とし、caption は文字にする（buildSlideAttrs・safeWebUrl）", async () => {
    const ui = await mountUi();
    getMockLayerAController(ui.app!)!.fire("clickMarkers", [
      {
        namespaceID: "x",
        name: "X",
        image: [
          // "/" を含むので img/ の下にしない → http/https でないので落とす
          { src: "javascript://x/%0aalert(1)" },
          // "/" を含まない名前は img/ の下の相対パスになるが、":" を含むので buildSlideAttrs が URL を落とす → スライドにしない
          { src: "javascript:alert(1)" },
          {
            src: "a.png",
            onerror: "alert(1)",
            caption: '<img src=x onerror="alert(1)">cap'
          },
          { src: "b.png", thumbnail: "javascript:alert(2)" }
        ]
      }
    ]);
    const slides = slidesOf(ui);
    expect(slides.map(s => s["image-url"])).toEqual(["img/a.png", "img/b.png"]);
    expect(slides[0]).not.toHaveProperty("onerror");
    expect(slides[0].caption).not.toMatch(/</);
    expect(slides[0].caption).toMatch(/cap$/);
    // サムネイルの URL が危なければサムネイルを付けない（本体の URL は付け替えない）
    expect(slides[1]).not.toHaveProperty("thumbnail-url");
  });

  it("メディアが無ければスワイパーを作らない。メディアを出すと Chuci（cc-swiper）を読み込む", async () => {
    const ui = await mountUi();
    const ctl = getMockLayerAController(ui.app!)!;
    ctl.fire("clickMarkers", [
      { namespaceID: "n", name: "N", desc: "only text" }
    ]);
    expect(part(ui, "poi-body").querySelector("cc-swiper")).toBeNull();
    ctl.fire("clickMarkers", [{ namespaceID: "i", name: "I", image: "i.jpg" }]);
    await vi.waitFor(
      () => expect(customElements.get("cc-swiper")).toBeTruthy(),
      {
        timeout: 20_000
      }
    );
    const swiper = part(ui, "poi-body").querySelector("cc-swiper")!;
    expect(swiper.shadowRoot).not.toBeNull(); // 文書の中で Chuci の要素に格上げされた
  });
});

describe("マーカー一覧（enable-marker-list・listPoiLayers / showPoiLayer / hidePoiLayer）", () => {
  /** main（設定ファイルの p1）に加えて、アイコン付きの層「spots」（2 件）を足す。 */
  async function mountWithLayers(setup?: (ui: Ui) => void) {
    const ui = await mountUi(u => {
      u.setAttribute("enable-marker-list", "");
      setup?.(u);
    });
    const app = ui.app! as any;
    app.addPoiLayer("spots", {
      name: { ja: "名所", en: "Spots" },
      icon: "img/spot.png",
      pois: [
        { id: "s1", namespaceID: "spots#s1", name: { ja: "寺", en: "Temple" } },
        {
          id: "s2",
          namespaceID: "spots#s2",
          name: '<img src=x onerror="alert(1)">Shrine',
          icon: "img/shrine.png"
        }
      ]
    });
    getMockLayerAController(app)!.fire("poi_number", 3);
    return { ui, app };
  }
  const layers = (ui: Ui) =>
    Array.from(
      shadow(ui).querySelectorAll<HTMLElement>('[part="marker-list-layer"]')
    );

  it("enable-marker-list が真で POI があるときだけボタンを出す（poi_number が 0 なら隠す）", async () => {
    const plain = await mountUi();
    expect(part(plain, "marker-list").hidden).toBe(true);
    document.body.replaceChildren();
    const { ui } = await mountWithLayers();
    const button = part(ui, "marker-list");
    expect(button.hidden).toBe(false);
    expect(button.querySelector("button")!.title).toBe("Marker list");
    getMockLayerAController(ui.app!)!.fire("poi_number", 0);
    expect(button.hidden).toBe(true);
    getMockLayerAController(ui.app!)!.fire("poi_number", 2);
    expect(button.hidden).toBe(false);
    ui.enableMarkerList = false;
    expect(button.hidden).toBe(true);
  });

  it("層ごとの一覧（名前・アイコン・表示状態）を listPoiLayers から作る", async () => {
    const { ui } = await mountWithLayers(u => u.setAttribute("lang", "ja"));
    click(part(ui, "marker-list").querySelector("button")!);
    const modal = part(ui, "marker-list-modal");
    expect(modal.hidden).toBe(false);
    expect(part(ui, "marker-list-title").textContent).toBe("マーカー一覧表示");
    const ls = layers(ui);
    expect(ls.map(l => l.dataset.layerKey)).toEqual(["main", "spots"]);
    expect(ls[1].querySelector(".name")!.textContent).toBe("名所");
    expect(
      ls[1]
        .querySelector<HTMLImageElement>(".layer-label img")!
        .getAttribute("src")
    ).toBe("img/spot.png");
    // POI のアイコンは POI → 層 → 既定のピン
    const pois = Array.from(
      ls[1].querySelectorAll<HTMLElement>('[part="marker-list-poi"]')
    );
    expect(pois.map(p => p.dataset.poiId)).toEqual(["spots#s1", "spots#s2"]);
    expect(pois[0].querySelector("img")!.getAttribute("src")).toBe(
      "img/spot.png"
    );
    expect(pois[1].querySelector("img")!.getAttribute("src")).toBe(
      "img/shrine.png"
    );
    // 名前は文字として入れる（HTML にしない）
    expect(pois[1].querySelector(".name")!.textContent).toBe(
      '<img src=x onerror="alert(1)">Shrine'
    );
    expect(pois[1].querySelector(".name img")).toBeNull();
    // 層にも POI にも icon が無ければ、層 A の既定のピン（地図の上のピンと同じ絵。getDefaultPinIcon）
    expect(
      ls[0]
        .querySelector<HTMLImageElement>('[part="marker-list-poi"] img')!
        .getAttribute("src")
    ).toBe((ui.app as any).getDefaultPinIcon());
    expect(
      ls[0]
        .querySelector<HTMLImageElement>(".layer-label img")!
        .getAttribute("src")
    ).toBe((ui.app as any).getDefaultPinIcon());
    const switches = ls.map(l =>
      l.querySelector<HTMLInputElement>('[part="marker-list-layer-switch"]')!
    );
    expect(switches.map(s => s.checked)).toEqual([true, true]);
  });

  it("層の切り替えは showPoiLayer / hidePoiLayer。開き直すと hide の状態を映す", async () => {
    const { ui, app } = await mountWithLayers();
    const hide = vi.spyOn(app, "hidePoiLayer");
    const show = vi.spyOn(app, "showPoiLayer");
    click(part(ui, "marker-list").querySelector("button")!);
    const sw = layers(ui)[1].querySelector<HTMLInputElement>(
      '[part="marker-list-layer-switch"]'
    )!;
    click(sw);
    expect(sw.checked).toBe(false);
    expect(hide).toHaveBeenCalledWith("spots");
    expect(app.getPoiLayer("spots").hide).toBe(true);
    click(part(ui, "marker-list-close"));
    expect(part(ui, "marker-list-modal").hidden).toBe(true);
    click(part(ui, "marker-list").querySelector("button")!);
    const again = layers(ui)[1].querySelector<HTMLInputElement>(
      '[part="marker-list-layer-switch"]'
    )!;
    expect(again.checked).toBe(false);
    click(again);
    expect(show).toHaveBeenCalledWith("spots");
    expect(app.getPoiLayer("spots").hide).toBe(false);
  });

  it("層の名前で POI の一覧を開閉する（ほかの層は閉じる）", async () => {
    const { ui } = await mountWithLayers();
    click(part(ui, "marker-list").querySelector("button")!);
    const [main, spots] = layers(ui);
    const label = (l: HTMLElement) =>
      l.querySelector<HTMLButtonElement>(".layer-label")!;
    const list = (l: HTMLElement) => l.querySelector<HTMLElement>("ul.pois")!;
    expect(list(main).hidden).toBe(true);
    click(label(main));
    expect(list(main).hidden).toBe(false);
    expect(label(main).getAttribute("aria-expanded")).toBe("true");
    click(label(spots));
    expect(list(spots).hidden).toBe(false);
    expect(list(main).hidden).toBe(true);
    click(label(spots));
    expect(list(spots).hidden).toBe(true);
  });

  it("POI を選ぶと一覧を閉じ、その POI の吹き出しを開く（selectMarker で視点が移る）", async () => {
    const { ui, app } = await mountWithLayers(u =>
      u.setAttribute("lang", "en")
    );
    const select = vi.spyOn(app, "selectMarker");
    click(part(ui, "marker-list").querySelector("button")!);
    const spots = layers(ui)[1];
    click(spots.querySelector(".layer-label")!);
    click(
      spots.querySelector('[part="marker-list-poi"][data-poi-id="spots#s1"]')!
    );
    expect(part(ui, "marker-list-modal").hidden).toBe(true);
    expect(part(ui, "poi-modal").hidden).toBe(false);
    expect(part(ui, "poi-title").textContent).toBe("Temple");
    expect(select).toHaveBeenCalledWith("spots#s1");
    expect(getMockLayerAController(app)!.selectedMarker).toBe("spots#s1");
  });

  it("Escape・背景のクリックで閉じる。言語を替えると開いている一覧も描き直す", async () => {
    const { ui } = await mountWithLayers(u => u.setAttribute("lang", "ja"));
    click(part(ui, "marker-list").querySelector("button")!);
    const modal = part(ui, "marker-list-modal");
    ui.setAttribute("lang", "en");
    await vi.waitFor(() =>
      expect(part(ui, "marker-list-title").textContent).toBe("Marker list")
    );
    expect(layers(ui)[1].querySelector(".name")!.textContent).toBe("Spots");
    part(ui, "marker-list-close").dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        composed: true
      })
    );
    expect(modal.hidden).toBe(true);
    click(part(ui, "marker-list").querySelector("button")!);
    modal.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(modal.hidden).toBe(true);
  });
});

describe("重なった POI の選択メニュー（clickMarkers が複数・旧 showContextMenu）", () => {
  const A = {
    namespaceID: "main#a",
    id: "a",
    name: { ja: "甲", en: "A" },
    icon: "img/a.png"
  };
  const B = { namespaceID: "main#b", id: "b", name: '<b onclick="x()">B</b>' };
  const pointerDown = (target: Element, x: number, y: number) =>
    target.dispatchEvent(
      new ((window as any).PointerEvent ?? MouseEvent)("pointerdown", {
        bubbles: true,
        composed: true,
        clientX: x,
        clientY: y
      })
    );

  it("地図を押した位置に候補を出し、選んだ POI の吹き出しを開く", async () => {
    const ui = await mountUi(u => u.setAttribute("lang", "ja"));
    const app = ui.app! as any;
    const select = vi.spyOn(app, "selectMarker");
    pointerDown(app, 120, 80);
    getMockLayerAController(app)!.fire("clickMarkers", [A, B]);
    const menu = part(ui, "poi-menu");
    expect(menu.hidden).toBe(false);
    expect(menu.getAttribute("role")).toBe("menu");
    expect(menu.style.left).toBe("120px");
    expect(menu.style.top).toBe("80px");
    const items = Array.from(
      menu.querySelectorAll<HTMLElement>('[part="poi-menu-item"]')
    );
    expect(items.map(i => i.querySelector(".name")!.textContent)).toEqual([
      "甲",
      '<b onclick="x()">B</b>'
    ]);
    expect(items[1].querySelector("b")).toBeNull(); // 名前は文字として入れる
    expect(items[0].querySelector("img")!.getAttribute("src")).toBe(
      "img/a.png"
    );
    // icon の無い POI は層 A の既定のピン（getDefaultPinIcon）
    expect(items[1].querySelector("img")!.getAttribute("src")).toBe(
      app.getDefaultPinIcon()
    );
    expect(part(ui, "poi-modal").hidden).toBe(true);
    expect(select).not.toHaveBeenCalled();
    click(items[1]);
    expect(menu.hidden).toBe(true);
    expect(part(ui, "poi-modal").hidden).toBe(false);
    expect(select).toHaveBeenCalledWith("main#b");
  });

  it("地図の次の押下・Escape・ほかの部品の押下で閉じる（閉じる押下は地図へ渡さない）", async () => {
    const ui = await mountUi();
    const app = ui.app! as any;
    const ctl = getMockLayerAController(app)!;
    const menu = part(ui, "poi-menu");
    const seen = vi.fn();
    document.addEventListener("pointerdown", seen);
    ctl.fire("clickMarkers", [A, B]);
    expect(menu.hidden).toBe(false);
    pointerDown(app, 10, 10);
    expect(menu.hidden).toBe(true);
    expect(seen).not.toHaveBeenCalled();
    // 閉じている間の押下はそのまま通る
    pointerDown(app, 10, 10);
    expect(seen).toHaveBeenCalledTimes(1);
    document.removeEventListener("pointerdown", seen);

    ctl.fire("clickMarkers", [A, B]);
    menu.querySelector("button")!.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        composed: true
      })
    );
    expect(menu.hidden).toBe(true);

    ctl.fire("clickMarkers", [A, B]);
    pointerDown(part(ui, "zoom-in"), 5, 5);
    expect(menu.hidden).toBe(true);
    // メニューの中の押下では閉じない
    ctl.fire("clickMarkers", [A, B]);
    pointerDown(menu.querySelector("button")!, 5, 5);
    expect(menu.hidden).toBe(false);
  });

  it("押した位置が枠の端なら、メニューを枠の内側へ寄せる", async () => {
    const ui = await mountUi();
    const app = ui.app! as any;
    const frame = shadow(ui).querySelector(".frame") as HTMLElement;
    vi.spyOn(frame, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 300,
      height: 200,
      right: 300,
      bottom: 200,
      x: 0,
      y: 0
    } as DOMRect);
    const menu = part(ui, "poi-menu");
    vi.spyOn(menu, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 170,
      height: 60,
      right: 170,
      bottom: 60,
      x: 0,
      y: 0
    } as DOMRect);
    pointerDown(app, 290, 190);
    getMockLayerAController(app)!.fire("clickMarkers", [A, B]);
    expect(menu.style.left).toBe("120px");
    expect(menu.style.top).toBe("130px");
  });
});

describe("言語（translateText・t・currentLang）", () => {
  it("lang 属性 → 設定ファイルの lang → ブラウザの順。zh-hk は zh-TW", async () => {
    const ui = await mountUi();
    expect(ui.currentLang).toBe("en"); // 設定ファイルの lang
    expect(ui.translateText({ ja: "日本語", en: "English" })).toBe("English");
    ui.setAttribute("lang", "ja");
    expect(ui.currentLang).toBe("ja");
    expect(ui.translateText({ ja: "日本語", en: "English" })).toBe("日本語");
    ui.setAttribute("lang", "zh-hk");
    expect(ui.currentLang).toBe("zh-TW");
  });

  // 層 B の appOption は起動時だけ効く。起動後の代入は
  // 子へ流す（流し方はそのまま。子は自分の規則で警告して無視する）が、要素自身の読み
  // （言語の解決）には効かない。
  it("起動後に appOption を代入しても言語は変わらない（起動時の appOption.lang のまま）", async () => {
    const ui = await mountUi(u => {
      u.appOption = { lang: "ja" };
    });
    expect(ui.currentLang).toBe("ja"); // 起動時の appOption.lang が効いている
    expect(ui.t("control.home")).toBe("ホーム位置復帰");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const option = { lang: "en", appid: "later" };
    ui.appOption = option;
    await tick();
    // 言語（要素の読み）は起動時のまま
    expect(ui.currentLang).toBe("ja");
    expect(ui.t("control.home")).toBe("ホーム位置復帰");
    expect(part(ui, "home").querySelector("button")!.title).toBe(
      "ホーム位置復帰"
    );
    // 子へは流れている（子が自分の規則で警告して無視する＝層 A の規則は変えない）
    expect(
      warn.mock.calls.some(c =>
        /property "appOption" is fixed at startup/.test(String(c[0]))
      )
    ).toBe(true);
    // プロパティの読みも起動時の値
    expect(ui.appOption).toEqual({ lang: "ja" });
    expect((ui.app as any).appOption).toEqual({ lang: "ja" });
  });

  it("起動前に appOption が無ければ、起動後の代入でも設定ファイルの lang のまま", async () => {
    const ui = await mountUi();
    expect(ui.currentLang).toBe("en"); // 設定ファイルの lang
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    ui.appOption = { lang: "ja" };
    await tick();
    expect(ui.currentLang).toBe("en");
    expect(ui.t("control.home")).toBe("Go Home Position");
    expect(ui.appOption).toBeUndefined();
    expect(
      warn.mock.calls.some(c =>
        /property "appOption" is fixed at startup/.test(String(c[0]))
      )
    ).toBe(true);
  });

  it("translateText は旧 translate の選び方（現在の言語 → en → 最初の空でない言語・全部空なら空文字）", async () => {
    const ui = await mountUi(u => u.setAttribute("lang", "fr"));
    expect(ui.translateText("plain")).toBe("plain");
    expect(ui.translateText(undefined)).toBeUndefined();
    expect(ui.translateText({ ja: "日本語", en: "English" })).toBe("English");
    expect(ui.translateText({ ja: "日本語", de: "Deutsch" })).toBe("日本語");
    expect(ui.translateText({ fr: "", ja: "日本語" })).toBe("日本語");
    expect(ui.translateText({ ja: "", en: "" })).toBe("");
  });

  it("t() は UI の文言を返し、lang を替えると操作ボタンの説明も替わる", async () => {
    const ui = await mountUi(u => u.setAttribute("lang", "ja"));
    expect(ui.t("control.home")).toBe("ホーム位置復帰");
    expect(part(ui, "home").querySelector("button")!.title).toBe(
      "ホーム位置復帰"
    );
    ui.setAttribute("lang", "en");
    await vi.waitFor(() =>
      expect(part(ui, "home").querySelector("button")!.title).toBe(
        "Go Home Position"
      )
    );
    expect(ui.t("no.such.key")).toBe("no.such.key");
  });

  it('文書の題名を設定ファイルの appName にする（set-document-title="false" で止める）', async () => {
    document.title = "before";
    await mountUi(u => u.setAttribute("lang", "ja"));
    expect(document.title).toBe("テストアプリ");
    document.body.replaceChildren();
    document.title = "kept";
    await mountUi(u => u.setAttribute("set-document-title", "false"));
    expect(document.title).toBe("kept");
  });
});

describe("公開面だけを使う（B-公開面だけ）", () => {
  it("子の中身（closed の Shadow DOM）にも light DOM の子孫にも触れずに動く", async () => {
    const ui = await mountUi();
    const app = ui.app! as any;
    expect(app.shadowRoot).toBeNull(); // 模擬の中身は closed の Shadow DOM
    expect(app.children.length).toBe(0);
    // 試作の内部への逃げ道（app）は模擬の層 A に無い
    expect("app" in app).toBe(false);
  });

  it("子を DOM から外すと購読をやめ、繋ぎ直すと再び動く", async () => {
    const ui = await mountUi();
    const app = ui.app! as any;
    document.body.removeChild(ui);
    await tick();
    expect(app.isConnected).toBe(false);
    // 子の ready は破棄の時点で新しい Promise に替わっている（前の解決済みの Promise を掴まない）
    const childReady = app.ready;
    document.body.appendChild(ui);
    await ui.ready;
    expect(ui.app).toBe(app);
    expect(app.ready).toBe(childReady);
    // ui.ready の解決の時点で子は作り直し済み（中身がある）
    expect(app.appData).not.toBeNull();
    expect(app.currentMapId).not.toBeNull();
    const zoomBy = vi.spyOn(app, "zoomBy");
    click(part(ui, "zoom-in"));
    expect(zoomBy).toHaveBeenCalledWith(1);
  });
});

// 再レビューの Info: ページから変えられる色の**変数の名前**を固定する。名前は外から見える
// 契約（`docs/api/migration-ui-shadow-dom.md` の表）なので、改名は利用者の CSS を壊す。
// Chuci の変数（`--cc-slider-*`）を要素が中で包んでいる理由も、ここで固定しておく。
describe("POI のメディアの色の CSS 変数（ページが指定する名前）", () => {
  const NAMES = [
    [
      "--maplat-poi-media-theme-color",
      "--cc-slider-theme-color: var(--maplat-poi-media-theme-color, #007aff);"
    ],
    [
      "--maplat-poi-media-navigation-color",
      "--cc-slider-navigation-color: var(--maplat-poi-media-navigation-color, #007aff);"
    ]
  ] as const;

  it.each(NAMES)("%s を Chuci の変数へ渡している", (name, rule) => {
    // 名前は要素の CSS（Shadow DOM の中）で決めている
    expect(MAPLAT_UI_CSS).toContain(rule);
    expect(MAPLAT_UI_CSS).toContain(name);
  });

  it("名前は移行のドキュメント（CSS 変数の表）と同じ", () => {
    const doc = readFileSync(
      resolve(__dirname, "../docs/api/migration-ui-shadow-dom.md"),
      "utf-8"
    );
    for (const [name] of NAMES) expect(doc, name).toContain(`\`${name}\``);
  });

  it("Chuci の変数を直接ページで指定しても効かない（中の指定が勝つ）ので、包んだ名前を公開している", () => {
    // 要素の CSS は Shadow DOM の中にあり、継承でページの値を上書きするため
    expect(MAPLAT_UI_CSS).toContain(
      "var(--maplat-poi-media-theme-color, #007aff)"
    );
    // ページ側の既定値は要素が持つ（Chuci の既定と同じ #007aff）
    expect(MAPLAT_UI_CSS).not.toContain("--cc-slider-theme-color: #007aff");
  });
});
