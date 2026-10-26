// @vitest-environment jsdom
// <maplat-ui>（src/element/）の「残りの画面（前半）」の単体テスト: 枠線（enable-border）・マーカーの非表示
// （enable-hide-marker）・地図情報／ライセンス／タイルキャッシュ。spec/element.spec.ts と同じく
// @maplat/core/conformance の**模擬の層 A**（公開面だけを持つ <maplat-app>）の上で動かす
// ＝ <maplat-ui> が層 A の公開面だけで動くことの確認（形・公開面だけ）。
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  defineMockMaplatApp,
  getMockLayerAController
} from "@maplat/core/conformance";
import { MAPLAT_UI_TAG } from "@maplat/core/common";
// 入口の import の副作用で <maplat-ui> を登録する
import { MaplatUiElement } from "../src/element";
// ライセンスのアイコンの URL の表（バンドラが解いた URL と突き合わせる）
import { LICENSE_ICONS } from "../src/element/license_images";

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
      label: "OSM",
      isBasemap: true,
      cacheEnable: true,
      meta: {
        license: "ODbL",
        dataLicense: "ODbL",
        attr: '<b>OSM</b> contributors<img src="x" onerror="alert(1)">'
      }
    },
    {
      mapID: "old1",
      label: { ja: "古地図1", en: "Old map 1" },
      isOldMap: true,
      // 範囲（経緯度の多角形）。listMaps の hasEnvelope が真になる
      envelope: [
        [139, 35],
        [140, 35],
        [140, 36],
        [139, 36]
      ],
      meta: {
        title: { ja: "古地図の題", en: "Old map title" },
        author: "Author A",
        license: "CC BY",
        licenseNote: { ja: "出典の注意", en: "A note" }
      }
    },
    { mapID: "old2", label: "Old map 2", isOldMap: true }
  ]
};

type Ui = MaplatUiElement & HTMLElement;

const shadow = (ui: Ui) => ui.shadowRoot!;
const part = (ui: Ui, name: string) =>
  shadow(ui).querySelector(`[part~="${name}"]`) as HTMLElement;
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
const BASE = "http://localhost:3000/";

/** URL の "#!" の後ろ（無ければ ""）。 */
const statePath = () =>
  location.hash.startsWith("#!")
    ? decodeURIComponent(location.hash.slice(2))
    : "";

/** <maplat-ui> を作って繋ぐ（子は UI が作る）。 */
async function mountUi(
  setup?: (ui: Ui) => void,
  setting: typeof SETTING = SETTING
): Promise<Ui> {
  const ui = document.createElement(MAPLAT_UI_TAG) as Ui;
  ui.setting = structuredClone(setting);
  setup?.(ui);
  document.body.appendChild(ui);
  await ui.ready;
  return ui;
}

/** 古地図 old1 でもキャッシュの欄を出す設定（地図の切り替えの試験に使う）。 */
function withOld1Cache() {
  return {
    ...structuredClone(SETTING),
    sources: SETTING.sources.map(source =>
      source.mapID === "old1"
        ? { ...structuredClone(source), cacheEnable: true }
        : structuredClone(source)
    )
  } as typeof SETTING;
}
/** 範囲（envelope）を持つ古地図が 2 つある設定（色の割り当てと塗りの確認に使う）。 */
function withTwoEnvelopes() {
  return {
    ...structuredClone(SETTING),
    sources: [
      structuredClone(SETTING.sources[0]),
      structuredClone(SETTING.sources[1]),
      {
        ...structuredClone(SETTING.sources[2]),
        // 古1 と重ならない範囲
        envelope: [
          [140, 35],
          [141, 35],
          [141, 36],
          [140, 36]
        ]
      }
    ]
  } as typeof SETTING;
}

/** 押す（ボタンは .ctl の入れ子）。 */
function press(ui: Ui, name: string) {
  (part(ui, name).querySelector("button") as HTMLButtonElement).click();
}

beforeEach(() => {
  history.replaceState(null, "", BASE);
  try {
    localStorage.clear();
  } catch {
    // 使えない環境では何もしない
  }
});

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  history.replaceState(null, "", BASE);
});

describe("この spec の前提（登録）", () => {
  // 入口の副作用で <maplat-ui> が登録される（登録が無いと以下は素の要素のまま動いてしまう）
  it("<maplat-ui> と模擬の層 A が登録されている", () => {
    expect(customElements.get(MAPLAT_UI_TAG)).toBe(MaplatUiElement);
    expect(customElements.get("maplat-app")).toBeTruthy();
  });
});

describe("枠線（enable-border・層 A の setEnvelopes）", () => {
  it("enable-border が真で層 A が範囲を描けるときだけボタンを出し、起動後の変更も効く", async () => {
    const ui = await mountUi();
    expect(part(ui, "border").hidden).toBe(true);
    ui.enableBorder = true;
    expect(part(ui, "border").hidden).toBe(false);
    expect(part(ui, "border").querySelector("button")!.title).toBe(
      "Show Map Border"
    );
    // 属性でも同じ（ii: 起動後に反映する）
    ui.enableBorder = false;
    expect(part(ui, "border").hidden).toBe(true);
    ui.setAttribute("enable-border", "");
    expect(part(ui, "border").hidden).toBe(false);
  });

  it("押すと範囲を持つ地図の枠線を描き、今の地図の範囲だけを塗る（もう一度押すと消える）", async () => {
    const ui = await mountUi(u => u.setAttribute("enable-border", ""));
    const app = ui.app!;
    const controller = getMockLayerAController(app)!;
    expect(controller.envelopes).toEqual([]);
    expect(
      part(ui, "border").querySelector("button")!.getAttribute("aria-pressed")
    ).toBe("false");

    press(ui, "border");
    // 範囲を持つのは old1 だけ（osm と old2 は envelope を持たない）。今の地図（old1）は塗る。
    // 色は listMaps の順に割り振った 1 色目（旧 ui_init.ts の colors[0] = maroon）
    expect(controller.envelopes).toEqual([
      {
        mapID: "old1",
        stroke: { color: "#800000", width: 2, lineDash: [6, 6] },
        fill: "rgba(128, 0, 0, 0.4)"
      }
    ]);
    expect(
      part(ui, "border").querySelector("button")!.getAttribute("aria-pressed")
    ).toBe("true");
    expect((app as any).state.showBorder).toBe(1);

    // 枠線の状態は層 A の状態に載る（restoreSession の localStorage に乗る）
    await wait(80);
    expect((app as any).state.showBorder).toBe(1);

    press(ui, "border");
    expect(controller.envelopes).toEqual([]);
    expect(
      part(ui, "border").querySelector("button")!.getAttribute("aria-pressed")
    ).toBe("false");
    expect((app as any).state.showBorder).toBe(0);
  });

  it("範囲を持つ地図に listMaps の順で違う色を割り振り、塗りはその色の透明度 0.4", async () => {
    const ui = await mountUi(
      u => u.setAttribute("enable-border", ""),
      withTwoEnvelopes()
    );
    const controller = getMockLayerAController(ui.app!)!;
    press(ui, "border");
    // listMaps の順（old1・old2）に 25 色の先頭から割り当てる（旧 ui_init.ts:473-497）
    expect(
      controller.envelopes.map((e: any) => [e.mapID, e.stroke.color])
    ).toEqual([
      ["old1", "#800000"],
      ["old2", "#ff1493"]
    ]);
    // 塗りは今の地図（old1）の色で、ほかの地図は塗らない
    expect(controller.envelopes[0].fill).toBe("rgba(128, 0, 0, 0.4)");
    expect(controller.envelopes[1].fill).toBeUndefined();
    // 地図の切り替えスライダーのカードにも同じ色を渡す（旧 UI のスライドの枠と同じ役。任意）
    const colorOf = (mapID: string) =>
      Array.from(
        shadow(ui).querySelectorAll<HTMLElement>('[part~="map-slide"]')
      )
        .find(slide => slide.dataset.mapId === mapID)
        ?.style.getPropertyValue("--maplat-envelope-color");
    expect([colorOf("old1"), colorOf("old2")]).toEqual(["#800000", "#ff1493"]);
  });

  it("地図を切り替えると塗る範囲が今の古地図へ移る（旧 updateEnvelope の isActive）", async () => {
    const ui = await mountUi(
      u => u.setAttribute("enable-border", ""),
      withTwoEnvelopes()
    );
    const controller = getMockLayerAController(ui.app!)!;
    press(ui, "border");
    expect(controller.envelopes[0].fill).toBe("rgba(128, 0, 0, 0.4)");
    await ui.app!.changeMap("old2");
    // 今の地図（old2）へ塗りが移り、old1 は線だけになる
    expect(controller.envelopes[0].fill).toBeUndefined();
    expect(controller.envelopes[1].fill).toBe("rgba(255, 20, 147, 0.4)");
    await ui.app!.changeMap("old1");
    expect(controller.envelopes[0].fill).toBe("rgba(128, 0, 0, 0.4)");
    expect(controller.envelopes[1].fill).toBeUndefined();
  });

  it("ベースマップの上でも、メニューで最後に選んだ古地図の範囲を塗る", async () => {
    const setting = withTwoEnvelopes();
    // 起動時からベースマップの上（旧 UI では重ね地図のスワイパーが先頭の古地図を選んでいる状態）
    Object.assign(setting, { startFrom: "osm" });
    const ui = await mountUi(u => u.setAttribute("enable-border", ""), setting);
    const controller = getMockLayerAController(ui.app!)!;
    press(ui, "border");
    expect(controller.envelopes.map((e: any) => [e.mapID, e.fill])).toEqual([
      ["old1", "rgba(128, 0, 0, 0.4)"],
      ["old2", undefined]
    ]);
    // 古地図を選んでからベースマップへ戻ると、最後に選んだ古地図（old2）を塗る
    await ui.app!.changeMap("old2");
    await ui.app!.changeMap("osm");
    expect(controller.envelopes.map((e: any) => [e.mapID, e.fill])).toEqual([
      ["old1", undefined],
      ["old2", "rgba(255, 20, 147, 0.4)"]
    ]);
  });

  it('supports("envelopes") が偽の層 A ではボタンを出さず、描きもしない', async () => {
    const ui = await mountUi(u => u.setAttribute("enable-border", ""));
    const app = ui.app!;
    // 範囲を描けない層 A（機能の問い合わせが偽）
    app.supports = (() => false) as any;
    const setEnvelopes = vi.spyOn(app, "setEnvelopes");
    // 属性を書き直すとボタンの判定をやり直す
    ui.setAttribute("enable-border", "false");
    expect(part(ui, "border").hidden).toBe(true);
    ui.setAttribute("enable-border", "");
    expect(part(ui, "border").hidden).toBe(true);
    ui.setShowBorder(true);
    expect(setEnvelopes).not.toHaveBeenCalled();
  });

  it("状態 URL の sb と整合する（URL から枠線が戻り、切り替えると sb を書く）", async () => {
    history.replaceState(null, "", `${BASE}#!s:old1/sb:1`);
    const ui = await mountUi(u => u.setAttribute("state-url", ""));
    const controller = getMockLayerAController(ui.app!)!;
    await vi.waitFor(() => expect(controller.envelopes.length).toBe(1));
    expect(statePath()).toContain("/sb:1");
    // 状態 URL の sb は層 B の拡張キーとして層 A の状態にも載る（旧 setShowBorder）
    await wait(80);
    expect((ui.app as any).state.showBorder).toBe(1);

    ui.setShowBorder(false);
    expect(controller.envelopes).toEqual([]);
    expect(statePath()).not.toContain("sb:");
  });

  it("restore の showBorder で起動時に描く", async () => {
    const ui = await mountUi(u => {
      u.setAttribute("enable-border", "");
      u.restore = { mapID: "old1", showBorder: 1 };
    });
    const controller = getMockLayerAController(ui.app!)!;
    expect(controller.envelopes.map((e: any) => e.mapID)).toEqual(["old1"]);
    expect(
      part(ui, "border").querySelector("button")!.getAttribute("aria-pressed")
    ).toBe("true");
  });

  it("起動後に enable-border を外すと、描いた枠線も消す", async () => {
    const ui = await mountUi(u => u.setAttribute("enable-border", ""));
    const controller = getMockLayerAController(ui.app!)!;
    press(ui, "border");
    expect(controller.envelopes.length).toBe(1);
    expect((ui.app as any).state.showBorder).toBe(1);
    ui.enableBorder = false;
    expect(part(ui, "border").hidden).toBe(true);
    // 枠線を消す（setShowBorder(false)）ので、描いた範囲が残らない
    expect(controller.envelopes).toEqual([]);
    expect((ui.app as any).state.showBorder).toBe(0);
    // 戻すとボタンが出て、押せばまた描ける
    ui.enableBorder = true;
    expect(part(ui, "border").hidden).toBe(false);
    press(ui, "border");
    expect(controller.envelopes.length).toBe(1);
  });
});

describe("マーカーの非表示（enable-hide-marker・hideAllMarkers / showAllMarkers）", () => {
  it("enable-hide-marker が真のときだけボタンを出し、起動後の変更も効く", async () => {
    const ui = await mountUi();
    expect(part(ui, "hide-marker").hidden).toBe(true);
    ui.enableHideMarker = true;
    expect(part(ui, "hide-marker").hidden).toBe(false);
    expect(part(ui, "hide-marker").querySelector("button")!.title).toBe(
      "Hide Markers"
    );
    ui.setAttribute("enable-hide-marker", "false");
    expect(part(ui, "hide-marker").hidden).toBe(true);
  });

  it("押すと層 A の hideAllMarkers / showAllMarkers を呼び、状態と aria-pressed を合わせる", async () => {
    const ui = await mountUi(u => u.setAttribute("enable-hide-marker", ""));
    const app = ui.app!;
    const hide = vi.spyOn(app, "hideAllMarkers");
    const show = vi.spyOn(app, "showAllMarkers");
    const button = part(ui, "hide-marker").querySelector("button")!;
    expect(button.getAttribute("aria-pressed")).toBe("false");

    press(ui, "hide-marker");
    expect(hide).toHaveBeenCalledTimes(1);
    expect(show).not.toHaveBeenCalled();
    // 層 A が同じ値を状態の hideMarker に書く（requestUpdateState は層 A に任せる）
    expect((app as any).state.hideMarker).toBe(1);
    expect(button.getAttribute("aria-pressed")).toBe("true");

    press(ui, "hide-marker");
    expect(show).toHaveBeenCalledTimes(1);
    expect((app as any).state.hideMarker).toBe(0);
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });

  it("層 A 側で状態が変わったらボタンの状態も追従する（updateState の hideMarker）", async () => {
    const ui = await mountUi(u => u.setAttribute("enable-hide-marker", ""));
    const app = ui.app!;
    app.hideAllMarkers();
    await wait(80); // updateState は 50 ms で間引かれる
    expect(
      part(ui, "hide-marker")
        .querySelector("button")!
        .getAttribute("aria-pressed")
    ).toBe("true");
    app.showAllMarkers();
    await wait(80);
    expect(
      part(ui, "hide-marker")
        .querySelector("button")!
        .getAttribute("aria-pressed")
    ).toBe("false");
  });

  it("状態 URL の hm と整合する（切り替えると hm を書き、URL から戻る）", async () => {
    const ui = await mountUi(u => {
      u.setAttribute("enable-hide-marker", "");
      u.setAttribute("state-url", "");
    });
    expect(statePath()).not.toContain("hm:");
    press(ui, "hide-marker");
    expect(statePath()).toContain("/hm:1");
    press(ui, "hide-marker");
    expect(statePath()).not.toContain("hm:");

    // URL に hm:1 がある状態で開き直すと、層 A の restore で隠れる
    ui.remove();
    await wait(20);
    history.replaceState(null, "", `${BASE}#!s:old1/hm:1`);
    const reopened = await mountUi(u => {
      u.setAttribute("enable-hide-marker", "");
      u.setAttribute("state-url", "");
    });
    expect((reopened.app as any).state.hideMarker).toBe(1);
    expect(
      part(reopened, "hide-marker")
        .querySelector("button")!
        .getAttribute("aria-pressed")
    ).toBe("true");
  });

  it("restore の hideMarker で起動時に隠れる（旧 initUiFromAppData）", async () => {
    const ui = await mountUi(u => {
      u.setAttribute("enable-hide-marker", "");
      u.restore = { mapID: "old1", hideMarker: 1 };
    });
    expect((ui.app as any).state.hideMarker).toBe(1);
    expect(
      part(ui, "hide-marker")
        .querySelector("button")!
        .getAttribute("aria-pressed")
    ).toBe("true");
  });
});

describe("地図情報・ライセンス・タイルキャッシュ（操作ボタンの Copyright）", () => {
  /** 地図情報を開く。 */
  function open(ui: Ui) {
    press(ui, "info");
    return part(ui, "map-info-modal");
  }
  /** メタデータの値のセル（dt/dd の組の dd）。 */
  const cell = (ui: Ui, key: string) => part(ui, `map-meta-${key}`);

  it("地図の準備ができたら地図情報のボタンを出し、押すと今の地図の題名とメタデータを出す", async () => {
    const ui = await mountUi(u => u.setAttribute("lang", "ja"));
    expect(part(ui, "info").hidden).toBe(false);
    const modal = open(ui);
    expect(modal.hidden).toBe(false);
    // 題名は多言語の値を選ぶ（今の言語）
    expect(part(ui, "map-info-title").textContent).toBe("古地図の題");
    expect(cell(ui, "author").textContent).toBe("Author A");
    // 項目名は旧と同じ html.<キー> の文言
    const labels = Array.from(part(ui, "map-meta").querySelectorAll("dt")).map(
      dt => dt.textContent
    );
    expect(labels).toEqual([
      "製作者",
      "地図画像ライセンス",
      "データライセンス"
    ]);
    // ライセンスはアイコンと注意書き（注意書きは独立の行にしない）
    const license = cell(ui, "license");
    expect(license.querySelector("img.license")!.getAttribute("src")).toBe(
      LICENSE_ICONS["cc_by.png"]
    );
    expect(license.querySelector(".license_note")!.textContent).toBe(
      "出典の注意"
    );
  });

  it("ライセンスが空なら地図の種類に応じた既定値を使う（古地図のデータライセンスは CC BY-SA）", async () => {
    const ui = await mountUi(u => u.setAttribute("lang", "en"));
    open(ui);
    // old1 は古地図（isOldMap）: license は与えられている・dataLicense は空
    expect(cell(ui, "license").querySelector("img")!.getAttribute("src")).toBe(
      LICENSE_ICONS["cc_by.png"]
    );
    expect(
      cell(ui, "dataLicense").querySelector("img")!.getAttribute("src")
    ).toBe(LICENSE_ICONS["cc_by-sa.png"]);
    // ベースマップ（WMTS）のデータライセンスの既定値は All right reserved
    await ui.app!.changeMap("osm");
    await vi.waitFor(() =>
      expect(part(ui, "map-info-title").textContent).toBe("OSM")
    );
    expect(
      cell(ui, "dataLicense").querySelector("img")!.getAttribute("src")
    ).toBe(LICENSE_ICONS["odbl.png"]);
    // ライセンスの無い地図（old2）は All right reserved
    await ui.app!.changeMap("old2");
    await vi.waitFor(() =>
      expect(part(ui, "map-info-title").textContent).toBe("Old map 2")
    );
    expect(cell(ui, "license").querySelector("img")!.getAttribute("src")).toBe(
      LICENSE_ICONS["all_right_reserved.png"]
    );
  });

  it("ライセンスのアイコンは import した URL で、表にない語彙は画像を出さず文言だけにする", async () => {
    const setting = structuredClone(SETTING) as typeof SETTING;
    // アイコンの表に無い語彙のライセンス（旧は存在しない相対 URL を取りに行っていた）
    (setting.sources[2] as any).meta = { license: "Mystery License" };
    const ui = await mountUi(u => u.setAttribute("lang", "en"), setting);
    open(ui);
    // 既知の語彙: PNG を import した表の URL（ページの基点に依らない）
    const src = cell(ui, "license")
      .querySelector("img.license")!
      .getAttribute("src")!;
    expect(src).toBe(LICENSE_ICONS["cc_by.png"]);
    expect(src.startsWith("assets/")).toBe(false);
    // 表にない語彙: 画像を出さず、alt に当たる文言だけを出す
    await ui.app!.changeMap("old2");
    await vi.waitFor(() =>
      expect(part(ui, "map-info-title").textContent).toBe("Old map 2")
    );
    const license = cell(ui, "license");
    expect(license.querySelector("img")).toBeNull();
    expect(license.querySelector(".license-text")!.textContent).toBe(
      "Mystery License"
    );
  });

  // 旧 `spec/m6-t2-license-cell.spec.ts` の AC14b・AC14c の移植（旧 UI の実装の削除の仕上げ。旧の renderLicenseCell は消した）
  it("AC14b: ライセンスが Custom ならアイコンを出さず、注意書きの文章だけを出す", async () => {
    const setting = structuredClone(SETTING) as typeof SETTING;
    (setting.sources[1] as any).meta = {
      ...(setting.sources[1] as any).meta,
      license: "Custom",
      licenseNote: "ODbL 1.0"
    };
    const ui = await mountUi(u => u.setAttribute("lang", "en"), setting);
    open(ui);
    const license = cell(ui, "license");
    expect(license.querySelector("img")).toBeNull();
    expect(license.querySelector(".license-text")).toBeNull();
    const note = license.querySelector(".license_note");
    expect(note).toBeTruthy();
    expect(note!.textContent).toBe("ODbL 1.0");
  });

  it("AC14c: 注意書きは textContent で入る（悪意ある HTML も文字のまま・要素にならない）", async () => {
    const malicious = '<img src=x onerror="alert(1)"> 出典';
    const setting = structuredClone(SETTING) as typeof SETTING;
    (setting.sources[1] as any).meta = {
      ...(setting.sources[1] as any).meta,
      license: "Custom",
      licenseNote: malicious
    };
    const ui = await mountUi(u => u.setAttribute("lang", "en"), setting);
    open(ui);
    const license = cell(ui, "license");
    const note = license.querySelector(".license_note");
    expect(note!.textContent).toBe(malicious);
    expect(license.querySelector('img[src="x"]')).toBeNull();
    expect(note!.querySelector("img")).toBeNull();
    expect(note!.children).toHaveLength(0);
  });

  it("HTML の値は sanitizeHtml を通す（属性・帰属の HTML。onerror は落ちる）", async () => {
    const ui = await mountUi(u => u.setAttribute("lang", "en"));
    await ui.app!.changeMap("osm");
    open(ui);
    const attr = cell(ui, "attr");
    expect(attr.querySelector("b")!.textContent).toBe("OSM");
    expect(attr.innerHTML).not.toContain("onerror");
    expect(attr.querySelector("img")!.hasAttribute("onerror")).toBe(false);
  });

  it("閉じる（×・背景・Escape）と、地図の切り替えでの中身の作り直し", async () => {
    const ui = await mountUi(u => u.setAttribute("lang", "en"));
    const modal = open(ui);
    expect(part(ui, "map-info-title").textContent).toBe("Old map title");
    // 地図を切り替えると今の地図で描き直す
    await ui.app!.changeMap("osm");
    await vi.waitFor(() =>
      expect(part(ui, "map-info-title").textContent).toBe("OSM")
    );
    // × で閉じる
    (part(ui, "map-info-close") as HTMLButtonElement).click();
    expect(modal.hidden).toBe(true);
    // 背景の押下で閉じる
    open(ui);
    modal.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(modal.hidden).toBe(true);
    // Escape で閉じる
    open(ui);
    shadow(ui).dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );
    expect(modal.hidden).toBe(true);
  });

  it("言語を変えると地図情報の文言を描き直す", async () => {
    const ui = await mountUi(u => u.setAttribute("lang", "en"));
    open(ui);
    expect(part(ui, "map-info-title").textContent).toBe("Old map title");
    expect(
      cell(ui, "license").querySelector(".license_note")!.textContent
    ).toBe("A note");
    ui.setAttribute("lang", "ja");
    await vi.waitFor(() =>
      expect(part(ui, "map-info-title").textContent).toBe("古地図の題")
    );
    expect(
      cell(ui, "license").querySelector(".license_note")!.textContent
    ).toBe("出典の注意");
  });

  it('キャッシュは enable-cache・supports("tile-cache")・地図の cacheEnable が揃ったときだけ出す', async () => {
    // enable-cache が無い → 出さない
    const off = await mountUi();
    open(off);
    await wait(0);
    expect(part(off, "map-cache").hidden).toBe(true);

    // enable-cache は起動時のみ（層 A のキー）。与えた上で、地図がキャッシュを持たない間は出さない
    const ui = await mountUi(u => u.setAttribute("enable-cache", ""));
    open(ui);
    await wait(0);
    expect(part(ui, "map-cache").hidden).toBe(true);
    await ui.app!.changeMap("osm");
    await vi.waitFor(() => expect(part(ui, "map-cache").hidden).toBe(false));
    expect(part(ui, "cache-heading").textContent).toBe("Size of map cache");
  });

  it('supports("tile-cache") が偽の層 A ではキャッシュの欄を出さない', async () => {
    const ui = await mountUi(u => u.setAttribute("enable-cache", ""));
    const app = ui.app!;
    const real = app.supports.bind(app);
    app.supports = ((feature: string) =>
      feature === "tile-cache" ? false : real(feature)) as any;
    await app.changeMap("osm");
    open(ui);
    await wait(0);
    expect(part(ui, "map-cache").hidden).toBe(true);
  });

  it("キャッシュの統計・一括ダウンロード・削除（旧 showStats・fetchAll・clean）", async () => {
    const ui = await mountUi(u => u.setAttribute("enable-cache", ""));
    const app = ui.app!;
    let stats = { size: 1500, count: 3, total: 10 };
    const statsAsync = vi
      .spyOn(app, "getMapTileCacheStatsAsync")
      .mockImplementation(async () => ({ ...stats }));
    const fetchAll = vi
      .spyOn(app, "fetchAllMapTileCacheAsync")
      .mockImplementation(async (_mapID, callback) => {
        callback("proceed", { processed: 5, total: 10, size: 3000 });
        stats = { size: 3000, count: 5, total: 10 };
      });
    const clear = vi.spyOn(app, "clearMapTileCacheAsync").mockResolvedValue();
    await app.changeMap("osm");
    open(ui);
    await vi.waitFor(() =>
      expect(part(ui, "cache-size").textContent).toBe(
        "1.5 KBytes (3 / 10 tiles [30%])"
      )
    );
    expect(statsAsync).toHaveBeenCalled();
    // 取得のボタンは「一括ダウンロード」。削除は大きさがあるので押せる
    const fetchButton = part(ui, "cache-fetch") as HTMLButtonElement;
    const deleteButton = part(ui, "cache-delete") as HTMLButtonElement;
    expect(fetchButton.textContent).toBe("Bulk download");
    expect(fetchButton.hidden).toBe(false);
    expect(fetchButton.disabled).toBe(false);
    expect(deleteButton.textContent).toBe("Clear cache");
    expect(deleteButton.disabled).toBe(false);

    // 一括ダウンロード: 進み具合を受けて大きさを書き換え、終わったら統計を読み直す
    fetchButton.click();
    await vi.waitFor(() => expect(fetchAll).toHaveBeenCalled());
    await vi.waitFor(() =>
      expect(part(ui, "cache-size").textContent).toBe(
        "3 KBytes (5 / 10 tiles [50%])"
      )
    );
    expect(part(ui, "cache-fetch").textContent).toBe("Bulk download");

    // 削除: 統計を読み直す（取得の実行中は押せない）
    deleteButton.click();
    await vi.waitFor(() => expect(clear).toHaveBeenCalled());
  });

  it("取得の実行中はボタンが「停止」になり、全部取り終えると取得のボタンは押せない", async () => {
    const ui = await mountUi(u => u.setAttribute("enable-cache", ""));
    const app = ui.app!;
    let finish: (() => void) | undefined;
    vi.spyOn(app, "getMapTileCacheStatsAsync").mockResolvedValue({
      size: 3000,
      count: 10,
      total: 10
    });
    vi.spyOn(app, "fetchAllMapTileCacheAsync").mockImplementation(
      async (_mapID, callback) => {
        callback("proceed", { processed: 1, total: 10, size: 100 });
        await new Promise<void>(resolve => (finish = resolve));
      }
    );
    const cancel = vi.spyOn(app, "cancelMapTileCacheAsync").mockResolvedValue();
    await app.changeMap("osm");
    open(ui);
    await vi.waitFor(() =>
      expect(part(ui, "cache-size").textContent).toContain("10 / 10")
    );
    const fetchButton = part(ui, "cache-fetch") as HTMLButtonElement;
    // 全部取り終えているので押せない
    expect(fetchButton.disabled).toBe(true);

    // 取得を始める（統計を未完了に戻してから）
    (app.getMapTileCacheStatsAsync as any).mockResolvedValue({
      size: 0,
      count: 0,
      total: 10
    });
    await ui.app!.changeMap("old1");
    await ui.app!.changeMap("osm");
    await vi.waitFor(() => expect(part(ui, "cache-fetch").hidden).toBe(false));
    (part(ui, "cache-fetch") as HTMLButtonElement).click();
    await vi.waitFor(() =>
      expect(part(ui, "cache-fetch").textContent).toBe("Cancel download")
    );
    expect(part(ui, "cache-fetch").classList.contains("btn-danger")).toBe(true);
    expect((part(ui, "cache-delete") as HTMLButtonElement).disabled).toBe(true);
    // 実行中に押すと停止する
    (part(ui, "cache-fetch") as HTMLButtonElement).click();
    await vi.waitFor(() => expect(cancel).toHaveBeenCalled());
    finish?.();
  });

  /**
   * 一括取得を始めて、終わりを外から解決できるようにする。統計は地図ごとに違う値を返す
   * （osm は取得の前 0/10・後 10/10、old1 は 4/8）。地図の切り替えの 3 経路（閉じる・言語・地図）で使う。
   */
  async function startFetch(ui: Ui) {
    const app = ui.app!;
    let finish: (() => void) | undefined;
    const stats = new Map<string, any>([
      ["osm", { size: 0, count: 0, total: 10 }],
      ["old1", { size: 2000, count: 4, total: 8 }]
    ]);
    vi.spyOn(app, "getMapTileCacheStatsAsync").mockImplementation(
      async mapID => ({ ...(stats.get(mapID ?? "") ?? {}) })
    );
    vi.spyOn(app, "fetchAllMapTileCacheAsync").mockImplementation(
      async (_mapID, callback) => {
        callback("proceed", { processed: 1, total: 10, size: 100 });
        await new Promise<void>(resolve => (finish = resolve));
        // 取得が終わった時点の統計（取得中の地図 = osm）
        stats.set("osm", { size: 1000, count: 10, total: 10 });
      }
    );
    await app.changeMap("osm");
    open(ui);
    await vi.waitFor(() => expect(part(ui, "cache-fetch").hidden).toBe(false));
    (part(ui, "cache-fetch") as HTMLButtonElement).click();
    await vi.waitFor(() =>
      expect(part(ui, "cache-fetch").textContent).toBe("Cancel download")
    );
    return {
      finish: async () => {
        finish?.();
        await wait(0);
      }
    };
  }

  it("取得中に地図情報を閉じても、終わった後に開き直すと「一括ダウンロード」と新しい統計に戻る", async () => {
    const ui = await mountUi(u => u.setAttribute("enable-cache", ""));
    const { finish } = await startFetch(ui);
    const modal = part(ui, "map-info-modal");
    // Escape で閉じる（取得は止めない）
    shadow(ui).dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );
    expect(modal.hidden).toBe(true);
    await finish();
    open(ui);
    await vi.waitFor(() =>
      expect(part(ui, "cache-fetch").textContent).toBe("Bulk download")
    );
    expect(part(ui, "cache-size").textContent).toBe(
      "1 KBytes (10 / 10 tiles [100%])"
    );
    expect(part(ui, "cache-fetch").classList.contains("btn-danger")).toBe(
      false
    );
    expect((part(ui, "cache-delete") as HTMLButtonElement).disabled).toBe(
      false
    );
  });

  it("取得中に言語を変えても、終わった後に「一括ダウンロード」と新しい統計に戻る", async () => {
    const ui = await mountUi(u => {
      u.setAttribute("enable-cache", "");
      u.setAttribute("lang", "en");
    });
    const { finish } = await startFetch(ui);
    ui.setAttribute("lang", "ja");
    await vi.waitFor(() =>
      expect(part(ui, "cache-fetch").textContent).toBe("ダウンロード停止")
    );
    await finish();
    await vi.waitFor(() =>
      expect(part(ui, "cache-fetch").textContent).toBe("一括ダウンロード")
    );
    expect(part(ui, "cache-size").textContent).toBe(
      "1 KBytes (10 / 10 tiles [100%])"
    );
    expect(part(ui, "cache-fetch").classList.contains("btn-danger")).toBe(
      false
    );
  });

  it("取得中に地図を替えても、終わった後に「一括ダウンロード」と替えた先の統計に戻る", async () => {
    const ui = await mountUi(
      u => u.setAttribute("enable-cache", ""),
      withOld1Cache()
    );
    const { finish } = await startFetch(ui);
    await ui.app!.changeMap("old1");
    // 取得中の地図（osm）と今の地図（old1）が違うので、取得中の表示にはしない
    await vi.waitFor(() =>
      expect(part(ui, "cache-size").textContent).toBe(
        "2 KBytes (4 / 8 tiles [50%])"
      )
    );
    expect(part(ui, "cache-fetch").textContent).toBe("Bulk download");
    await finish();
    await vi.waitFor(() =>
      expect(part(ui, "cache-size").textContent).toBe(
        "2 KBytes (4 / 8 tiles [50%])"
      )
    );
    expect(part(ui, "cache-fetch").textContent).toBe("Bulk download");
    expect(part(ui, "cache-fetch").classList.contains("btn-danger")).toBe(
      false
    );
  });
});
