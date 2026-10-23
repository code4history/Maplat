// @vitest-environment jsdom
// <maplat-ui>（src/element/）の「共有と状態の保存」の単体テスト: 共有（getShareUrl・SNS・コピー・QR）・
// 状態 URL（state-url）・PWA（pwa-manifest 等）。spec/element.spec.ts と同じく @maplat/core/conformance の
// **模擬の層 A**（公開面だけを持つ <maplat-app>）の上で動かす。
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import {
  defineMockMaplatApp,
  getMockLayerAController
} from "@maplat/core/conformance";
import { MAPLAT_UI_TAG, MAPLAT_APP_TAG } from "@maplat/core/common";
// 入口の import の副作用で <maplat-ui> を登録する
import { MaplatUiElement } from "../src/element";
import { buildStatePath, parseStateHash } from "../src/element/state-url";
import { shareUrlOf } from "../src/element/share";
import { resetPwaRegistryForTest } from "../src/element/pwa";

defineMockMaplatApp();

const SETTING = {
  appName: { ja: "テストアプリ", en: "Test App" },
  lang: "en",
  homePosition: [139.7, 35.7],
  defaultZoom: 14,
  startFrom: "old1",
  sources: [
    { mapID: "osm", label: "OSM", isBasemap: true },
    { mapID: "old1", label: "Old map 1", isOldMap: true },
    { mapID: "old2", label: "Old map 2", isOldMap: true }
  ],
  pois: [
    {
      id: "p1",
      namespaceID: "main#p1",
      name: { ja: "城", en: "Castle" },
      lnglat: [139.7, 35.7]
    }
  ]
};

type Ui = MaplatUiElement & HTMLElement;

const shadow = (ui: Ui) => ui.shadowRoot!;
const part = (ui: Ui, name: string) =>
  shadow(ui).querySelector(`[part~="${name}"]`) as HTMLElement;
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
const BASE = "http://localhost:3000/";

/** <maplat-ui> を作って繋ぐ（子は UI が作る）。 */
async function mountUi(setup?: (ui: Ui) => void): Promise<Ui> {
  const ui = document.createElement(MAPLAT_UI_TAG) as Ui;
  ui.setting = structuredClone(SETTING);
  setup?.(ui);
  document.body.appendChild(ui);
  await ui.ready;
  return ui;
}

/** navigator の口（serviceWorker・clipboard。jsdom には無い）を差し替える。afterEach で外す。 */
function stubNavigator(name: "serviceWorker" | "clipboard", value: unknown) {
  Object.defineProperty(navigator, name, {
    configurable: true,
    get: () => value
  });
}

/** URL の "#!" の後ろ（無ければ ""）。 */
const statePath = () =>
  location.hash.startsWith("#!")
    ? decodeURIComponent(location.hash.slice(2))
    : "";

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
  document.head
    .querySelectorAll('link[rel="manifest"], link[rel="apple-touch-icon"]')
    .forEach(l => l.remove());
  resetPwaRegistryForTest();
  delete (navigator as any).serviceWorker;
  delete (navigator as any).clipboard;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  history.replaceState(null, "", BASE);
});

describe("状態 URL の書式（旧 page.js の hashbang・updateUrl と同じ）", () => {
  it("旧の URL を読む（地図・背景・透過度・視点・枠線・マーカーの非表示・層・開いた POI）", () => {
    expect(
      parseStateHash(
        "#!s:old1/b:osm/t:30/x:100.5/y:-20/z:14.5/r:45/sb:1/hm:1/hl:main,sub/om:main%23p1"
      )
    ).toEqual({
      mapID: "old1",
      backgroundID: "osm",
      transparency: 30,
      position: { x: 100.5, y: -20, zoom: 14.5, rotation: 45 },
      showBorder: true,
      hideMarker: 1,
      hideLayer: "main,sub",
      openedMarker: "main#p1"
    });
  });

  it("旧と同じく透過度と回転は 0 から始める。地図が無い・#! で始まらないなら null", () => {
    expect(parseStateHash("#!s:osm/x:1/y:2/z:3")).toEqual({
      mapID: "osm",
      transparency: 0,
      position: { x: 1, y: 2, zoom: 3, rotation: 0 }
    });
    expect(parseStateHash("#!x:1/y:2")).toBeNull();
    expect(parseStateHash("#s:osm")).toBeNull();
    expect(parseStateHash("")).toBeNull();
    // 数でない値は読まない（旧は NaN を入れていた）・?以降は捨てる（旧と同じ）
    expect(parseStateHash("#!s:osm/t:abc/z:5?foo=1")).toEqual({
      mapID: "osm",
      transparency: 0,
      position: { zoom: 5, rotation: 0 }
    });
  });

  it("書く: 旧 updateUrl と同じ並び。0 の透過度・回転・同じ背景は省き、書いた URL を読み戻せる", () => {
    const path = buildStatePath({
      mapID: "old1",
      backgroundID: "osm",
      transparency: 30,
      x: 1.5,
      y: 2.5,
      zoom: 14,
      rotation: -10,
      showBorder: true,
      hideMarker: true,
      hideLayer: "main",
      openedMarker: "main#p1"
    });
    expect(path).toBe(
      "s:old1/b:osm/t:30/x:1.5/y:2.5/z:14/r:-10/sb:1/hm:1/hl:main/om:main#p1"
    );
    expect(
      buildStatePath({
        mapID: "osm",
        backgroundID: "osm",
        transparency: 0,
        x: 1,
        y: 2,
        zoom: 3,
        rotation: 0
      })
    ).toBe("s:osm/x:1/y:2/z:3");
    expect(parseStateHash(`#!${path}`)).toMatchObject({
      mapID: "old1",
      backgroundID: "osm",
      transparency: 30,
      position: { x: 1.5, y: 2.5, zoom: 14, rotation: -10 },
      showBorder: true,
      openedMarker: "main#p1"
    });
  });
});

describe("共有の URL（getShareUrl）", () => {
  it("app は ? と # を落とし、view は今の URL のまま（旧と同じ）", () => {
    const href = "https://example.com/app/index.html?lang=ja#!s:osm/z:3";
    expect(shareUrlOf("app", href)).toBe("https://example.com/app/index.html");
    expect(shareUrlOf("view", href)).toBe(href);
  });

  it("要素の getShareUrl は文書の URL を使い、state-url なら view の前に状態を書く", async () => {
    history.replaceState(null, "", `${BASE}page.html?x=1`);
    const ui = await mountUi(u => u.setAttribute("state-url", ""));
    expect(ui.getShareUrl("app")).toBe(`${BASE}page.html`);
    const view = ui.getShareUrl("view");
    expect(view.startsWith(`${BASE}page.html?x=1#!s:old1/`)).toBe(true);
  });
});

describe("状態 URL（state-url）", () => {
  it("起動後に今の状態を URL に書き、地図・透過度を替えると書き直す（履歴は増やさない）", async () => {
    const before = history.length;
    const ui = await mountUi(u => u.setAttribute("state-url", ""));
    const app = ui.app!;
    const vp = app.viewpoint!;
    expect(statePath()).toBe(`s:old1/x:${vp.x}/y:${vp.y}/z:${vp.zoom}`);
    await app.changeMap("old2");
    await wait(80); // updateState は 50 ms で間引かれる
    expect(statePath().startsWith("s:old2/")).toBe(true);
    app.setTransparency(40);
    await wait(80);
    expect(statePath()).toContain("/t:40/");
    expect(history.length).toBe(before);
  });

  it("その URL で開き直すと同じ地図・視点・透過度になり、開いた POI と枠線も戻る", async () => {
    history.replaceState(
      null,
      "",
      `${BASE}#!s:old2/t:25/x:15550000/y:4260000/z:12/sb:1/om:main%23p1`
    );
    const ui = await mountUi(u => u.setAttribute("state-url", ""));
    const app = ui.app!;
    // URL の値は子の restore として流れる（層 B の拡張キーは除く）
    expect(app.restore).toEqual({
      mapID: "old2",
      transparency: 25,
      position: { x: 15550000, y: 4260000, zoom: 12, rotation: 0 }
    });
    expect(app.currentMapId).toBe("old2");
    expect(app.getTransparency()).toBe(25);
    expect(app.viewpoint!.x).toBe(15550000);
    expect(app.viewpoint!.zoom).toBe(12);
    // openedMarker: 吹き出しが開く・showBorder: 層 A の状態に拡張キーとして載る
    expect(part(ui, "poi-modal").hidden).toBe(false);
    expect(part(ui, "poi-title").textContent).toBe("Castle");
    await wait(80);
    expect(app.state.showBorder).toBe(1);
    expect(statePath()).toContain("/sb:1");
    expect(statePath()).toContain("/om:main#p1");
    // 吹き出しを閉じると om を消す
    (part(ui, "poi-close") as HTMLButtonElement).click();
    expect(statePath()).not.toContain("/om:");
  });

  it("URL は <maplat-ui> の restore より強い（旧と同じく丸ごと置き換える）", async () => {
    history.replaceState(null, "", `${BASE}#!s:osm/z:10`);
    const ui = await mountUi(u => {
      u.setAttribute("state-url", "");
      u.restore = { mapID: "old2", transparency: 50, showBorder: true };
    });
    expect(ui.app!.currentMapId).toBe("osm");
    expect(ui.app!.getTransparency()).toBe(0);
    await wait(80);
    expect(ui.app!.state.showBorder).toBe(0);
  });

  it("状態 URL は起動時の map-id・transparency より強く、起動後は実際の地図が map-id に書き戻される", async () => {
    history.replaceState(
      null,
      "",
      `${BASE}#!s:old2/t:25/x:15550000/y:4260000/z:12`
    );
    const ui = await mountUi(u => {
      u.setAttribute("state-url", "");
      u.setAttribute("map-id", "osm");
      u.setAttribute("transparency", "70");
    });
    const app = ui.app! as any;
    expect(app.currentMapId).toBe("old2");
    expect(app.getTransparency()).toBe(25);
    expect(app.viewpoint!.x).toBe(15550000);
    // 起動後は実際の地図・透過度が子と <maplat-ui> の属性に載る
    expect(app.getAttribute("map-id")).toBe("old2");
    await vi.waitFor(() => expect(ui.getAttribute("map-id")).toBe("old2"));
    await vi.waitFor(() => expect(ui.getAttribute("transparency")).toBe("25"));
    // 起動後の <maplat-ui> の属性の変更はそのまま流れる（状態 URL が強いのは起動時だけ）
    ui.setAttribute("map-id", "osm");
    await vi.waitFor(() => expect(app.currentMapId).toBe("osm"));
    await vi.waitFor(() => expect(statePath().startsWith("s:osm/")).toBe(true));
  });

  it("子が map-id を自分で持つときも、状態 URL の地図で始まる（ready の後に changeMap で当てる）", async () => {
    history.replaceState(null, "", `${BASE}#!s:old2/t:15/z:11`);
    const ui = document.createElement(MAPLAT_UI_TAG) as Ui;
    ui.setAttribute("state-url", "");
    const app = document.createElement(MAPLAT_APP_TAG) as any;
    app.setAttribute("slot", "map");
    app.setAttribute("map-id", "osm");
    app.setting = structuredClone(SETTING);
    ui.appendChild(app);
    document.body.appendChild(ui);
    await ui.ready;
    await vi.waitFor(() => expect(app.currentMapId).toBe("old2"));
    expect(app.getTransparency()).toBe(15);
    // 子の map-id は実際の地図へ書き戻される
    await vi.waitFor(() => expect(app.getAttribute("map-id")).toBe("old2"));
  });

  it("子が restore を自分で持つときは、ready の後に changeMap で URL の状態を当てる（§5.2）", async () => {
    history.replaceState(
      null,
      "",
      `${BASE}#!s:old2/t:10/x:15560000/y:4250000/z:11`
    );
    const ui = document.createElement(MAPLAT_UI_TAG) as Ui;
    ui.setAttribute("state-url", "");
    const app = document.createElement(MAPLAT_APP_TAG) as any;
    app.setAttribute("slot", "map");
    app.setting = structuredClone(SETTING);
    app.restore = { mapID: "osm" };
    ui.appendChild(app);
    document.body.appendChild(ui);
    await ui.ready;
    expect(app.restore).toEqual({ mapID: "osm" }); // 子の restore（子が自分で持つキー）は触らない
    // 状態 URL の地図は map-id で流れる（状態 URL ＞ map-id ＞ restore）∴ 子は URL の地図で起動する（osm を経由しない）
    expect(app.initialRestore.mapID).toBe("old2");
    await vi.waitFor(() => expect(app.currentMapId).toBe("old2"));
    expect(app.getTransparency()).toBe(10);
    expect(app.viewpoint.x).toBe(15560000);
    await vi.waitFor(() =>
      expect(statePath().startsWith("s:old2/t:10/")).toBe(true)
    );
  });

  it("hash が変わったら（戻る・進む・書き換え）その状態へ移す", async () => {
    const ui = await mountUi(u => u.setAttribute("state-url", ""));
    const app = ui.app!;
    history.replaceState(null, "", `${BASE}#!s:osm/x:15570000/y:4240000/z:9`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    await vi.waitFor(() => expect(app.currentMapId).toBe("osm"));
    expect(app.viewpoint!.zoom).toBe(9);
  });

  it("state-url が無ければ URL を読みも書きもしない", async () => {
    history.replaceState(null, "", `${BASE}#!s:osm/z:10`);
    const ui = await mountUi();
    expect(ui.app!.currentMapId).toBe("old1");
    await ui.app!.changeMap("old2");
    await wait(80);
    expect(location.hash).toBe("#!s:osm/z:10");
  });

  it("state-url は起動時のみ: 起動後の変更は英語で警告して無視し、読み取りは起動時の値を返す（U2）", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const ui = await mountUi();
    expect(ui.stateUrl).toBeUndefined();
    ui.setAttribute("state-url", "");
    expect(warn).toHaveBeenCalledWith(
      '<maplat-ui>: attribute "state-url" is fixed at startup and cannot be changed after the UI has started; the change was ignored.'
    );
    expect(ui.stateUrl).toBeUndefined();
    ui.pwaManifest = true;
    expect(ui.hasAttribute("pwa-manifest")).toBe(false);
    expect(warn).toHaveBeenCalledWith(
      '<maplat-ui>: property "pwaManifest" is fixed at startup and cannot be changed after the UI has started; the change was ignored.'
    );
    await ui.app!.changeMap("old2");
    await wait(80);
    expect(location.hash).toBe("");
  });

  it("restore-session: 層 B の拡張キー showBorder を層 A に読ませ（restoreExtensionKeys）、起動時に戻す", async () => {
    const now = Math.floor(Date.now() / 1000);
    localStorage.setItem("epoch", `${now}`);
    localStorage.setItem("mapID", "old2");
    localStorage.setItem("showBorder", "1");
    const ui = await mountUi(u => u.setAttribute("restore-session", ""));
    const app = ui.app!;
    expect(app.restoreExtensionKeys).toEqual(["showBorder"]);
    expect(app.currentMapId).toBe("old2");
    expect(app.initialRestore.showBorder).toBe("1");
    await wait(80);
    expect(app.state.showBorder).toBe(1);
    // setShowBorder は層 A の状態（＝ localStorage）に載せる
    ui.setShowBorder(false);
    await wait(80);
    expect(localStorage.getItem("showBorder")).toBe("0");
  });
});

describe("共有のモーダル（enable-share）", () => {
  it("enable-share が真のときだけボタンを出す（起動後の切り替えも効く）", async () => {
    const ui = await mountUi();
    expect(part(ui, "share").hidden).toBe(true);
    ui.enableShare = true;
    expect(part(ui, "share").hidden).toBe(false);
    ui.setAttribute("enable-share", "false");
    expect(part(ui, "share").hidden).toBe(true);
  });

  it("開くとアプリの URL の QR を出す。state-url が無ければ今の表示の欄は出さない", async () => {
    history.replaceState(null, "", `${BASE}index.html?a=1`);
    const ui = await mountUi(u => u.setAttribute("enable-share", ""));
    (part(ui, "share").querySelector("button") as HTMLButtonElement).click();
    expect(part(ui, "share-modal").hidden).toBe(false);
    expect(part(ui, "share-title").textContent).toBe("Share");
    expect(part(ui, "share-view").hidden).toBe(true);
    await vi.waitFor(() =>
      expect(part(ui, "share-qr-app").querySelector("svg")).not.toBeNull()
    );
    const svg = part(ui, "share-qr-app").querySelector("svg")!;
    expect(svg.getAttribute("data-url")).toBe(`${BASE}index.html`);
    expect(svg.getAttribute("width")).toBe("128");
    expect(svg.getAttribute("aria-label")).toBe("QR code");
    expect(svg.querySelector("path")!.getAttribute("d")).toMatch(
      /^M\d+ \d+h1v1h-1z/
    );
    // Escape・背景のクリックで閉じる
    part(ui, "share-modal").dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        composed: true
      })
    );
    expect(part(ui, "share-modal").hidden).toBe(true);
  });

  it("state-url なら今の表示の URL（#! 付き）の QR も出す", async () => {
    const ui = await mountUi(u => {
      u.setAttribute("enable-share", "");
      u.setAttribute("state-url", "");
    });
    (part(ui, "share").querySelector("button") as HTMLButtonElement).click();
    expect(part(ui, "share-view").hidden).toBe(false);
    await vi.waitFor(() =>
      expect(part(ui, "share-qr-view").querySelector("svg")).not.toBeNull()
    );
    const url = part(ui, "share-qr-view")
      .querySelector("svg")!
      .getAttribute("data-url")!;
    expect(url).toBe(location.href);
    expect(url).toContain("#!s:old1/");
  });

  it("コピーは Clipboard API に URL を渡して知らせを出す。Twitter・Facebook は旧と同じ共有先を開く", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    stubNavigator("clipboard", { writeText });
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const ui = await mountUi(u => u.setAttribute("enable-share", ""));
    document.title = "Doc title";
    (part(ui, "share").querySelector("button") as HTMLButtonElement).click();
    const modal = part(ui, "share-modal");
    (modal.querySelector('[data-share="cp_app"]') as HTMLButtonElement).click();
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith(BASE));
    await vi.waitFor(() =>
      expect(part(ui, "toast").classList.contains("show")).toBe(true)
    );
    expect(part(ui, "toast").textContent).toBe("Copied to clipboard");
    (modal.querySelector('[data-share="tw_app"]') as HTMLButtonElement).click();
    expect(open).toHaveBeenLastCalledWith(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(BASE)}&text=Doc%20title&hashtags=Maplat`,
      "_blank",
      "noopener,noreferrer"
    );
    (modal.querySelector('[data-share="fb_app"]') as HTMLButtonElement).click();
    expect(open.mock.lastCall![0]).toBe(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(BASE)}&display=popup&ref=plugin&src=like&kid_directed_site=0`
    );
    // SR-NOV26-B-3（逆タブナビング）: 旧 spec `nov26-m12-noopener-window-open.spec.ts` の移植（期待値も旧と同じ）。
    // Twitter は features がちょうど "noopener,noreferrer"、Facebook はポップアップ指定を保ったまま noopener と
    // noreferrer の両方を持つ
    const twCall = open.mock.calls.find(c =>
      String(c[0]).includes("twitter.com/intent/tweet")
    )!;
    expect(twCall[1]).toBe("_blank");
    expect(twCall[2]).toBe("noopener,noreferrer");
    const fbCall = open.mock.calls.find(c =>
      String(c[0]).includes("facebook.com/sharer/sharer.php")
    )!;
    expect(fbCall[1]).toBe("_blank");
    expect(String(fbCall[2])).toContain("noopener");
    expect(String(fbCall[2])).toContain("noreferrer");
    expect(String(fbCall[2])).toContain("width=650");
    expect(String(fbCall[2])).toContain("height=450");
  });

  it("吹き出しの共有は enable-share かつ state-url のときだけ。QR は開いた POI を含む今の表示の URL", async () => {
    const plain = await mountUi(u => u.setAttribute("enable-share", ""));
    plain.openMarker("main#p1");
    expect(part(plain, "poi-modal").hidden).toBe(false);
    expect(part(plain, "poi-share").hidden).toBe(true);
    document.body.replaceChildren();

    const ui = await mountUi(u => {
      u.setAttribute("enable-share", "");
      u.setAttribute("state-url", "");
    });
    ui.openMarker("main#p1");
    expect(part(ui, "poi-share").hidden).toBe(false);
    await vi.waitFor(() =>
      expect(part(ui, "poi-qr").querySelector("svg")).not.toBeNull()
    );
    const url = part(ui, "poi-qr")
      .querySelector("svg")!
      .getAttribute("data-url")!;
    expect(url).toBe(location.href);
    expect(decodeURIComponent(url)).toContain("/om:main#p1");
  });
});

describe("PWA（pwa-manifest・pwa-worker・pwa-scope）", () => {
  function stubServiceWorker() {
    const register = vi.fn(() => Promise.resolve({ scope: BASE } as any));
    stubNavigator("serviceWorker", { register });
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            icons: [
              { src: "sample/icon-192.png", sizes: "192x192" },
              { src: "javascript:alert(1)", sizes: "1x1" }
            ]
          })
      } as any)
    );
    vi.stubGlobal("fetch", fetchMock);
    return { register, fetchMock };
  }

  it('pwa-manifest（"" は既定のパス）で manifest の link・Service Worker・apple-touch-icon を入れる', async () => {
    const { register, fetchMock } = stubServiceWorker();
    await mountUi(u => {
      u.setAttribute("app-id", "sample");
      u.setAttribute("pwa-manifest", "");
    });
    const link = document.head.querySelector('link[rel="manifest"]')!;
    expect(link.getAttribute("href")).toBe("./pwa/sample_manifest.json");
    expect(register).toHaveBeenCalledTimes(1);
    expect(register).toHaveBeenCalledWith("./service-worker.js", {
      scope: "./"
    });
    expect(fetchMock).toHaveBeenCalledWith("./pwa/sample_manifest.json");
    await vi.waitFor(() =>
      expect(
        document.head.querySelectorAll('link[rel="apple-touch-icon"]')
      ).toHaveLength(1)
    );
    const icon = document.head.querySelector('link[rel="apple-touch-icon"]')!;
    expect(icon.getAttribute("href")).toBe("./pwa/sample/icon-192.png");
    expect(icon.getAttribute("sizes")).toBe("192x192");
  });

  it("URL を与えたらそれを使い、二つ目の <maplat-ui> は同じ Service Worker を二重に登録しない", async () => {
    const { register } = stubServiceWorker();
    await mountUi(u => {
      u.setAttribute("pwa-manifest", "pwa/app.json");
      u.setAttribute("pwa-worker", "sw.js");
      u.setAttribute("pwa-scope", "./app/");
    });
    await mountUi(u => {
      u.setAttribute("pwa-manifest", "pwa/app.json");
      u.setAttribute("pwa-worker", "sw.js");
      u.setAttribute("pwa-scope", "./app/");
    });
    expect(register).toHaveBeenCalledTimes(1);
    expect(register).toHaveBeenCalledWith("sw.js", { scope: "./app/" });
    expect(document.head.querySelectorAll('link[rel="manifest"]')).toHaveLength(
      1
    );
  });

  it('pwa-manifest が無い・"false"・http(s) でない URL なら登録しない。enable-cache だけでは登録しない（旧と同じ）', async () => {
    const { register } = stubServiceWorker();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await mountUi(u => u.setAttribute("enable-cache", ""));
    await mountUi(u => u.setAttribute("pwa-manifest", "false"));
    await mountUi(u => u.setAttribute("pwa-manifest", "javascript:alert(1)"));
    expect(register).not.toHaveBeenCalled();
    expect(document.head.querySelector('link[rel="manifest"]')).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      "<maplat-ui>: PWA was not enabled because pwa-manifest / pwa-worker / pwa-scope is not an http(s) or relative URL."
    );
  });

  it("Service Worker の登録に失敗してもアプリは止めず、旧と同じ文言で console.error に出す", async () => {
    const register = vi.fn(() => Promise.reject(new Error("boom")));
    stubNavigator("serviceWorker", { register });
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("offline")))
    );
    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const ui = await mountUi(u => u.setAttribute("pwa-manifest", "true"));
    expect(ui.app!.currentMapId).toBe("old1");
    await vi.waitFor(() =>
      expect(error).toHaveBeenCalledWith(
        "Failed to register service worker:",
        expect.any(Error)
      )
    );
    await vi.waitFor(() =>
      expect(error).toHaveBeenCalledWith(
        "Failed to fetch PWA manifest:",
        expect.any(Error)
      )
    );
  });

  it("pwa-manifest は起動時のみ（起動後の変更は警告して無視・登録し直さない）", async () => {
    const { register } = stubServiceWorker();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const ui = await mountUi(u => u.setAttribute("pwa-manifest", "pwa/a.json"));
    ui.setAttribute("pwa-manifest", "pwa/b.json");
    expect(ui.pwaManifest).toBe("pwa/a.json");
    expect(warn).toHaveBeenCalledWith(
      '<maplat-ui>: attribute "pwa-manifest" is fixed at startup and cannot be changed after the UI has started; the change was ignored.'
    );
    expect(register).toHaveBeenCalledTimes(1);
  });
});

describe("公開面だけを使う", () => {
  it("模擬の層 A の中身に触れずに状態 URL と共有が動く（getMockLayerAController は確認にだけ使う）", async () => {
    const ui = await mountUi(u => {
      u.setAttribute("enable-share", "");
      u.setAttribute("state-url", "");
    });
    expect(customElements.get(MAPLAT_UI_TAG)).toBe(MaplatUiElement);
    expect(getMockLayerAController(ui.app!)).not.toBeNull();
    expect(statePath().startsWith("s:old1/")).toBe(true);
  });
});
