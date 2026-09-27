// @vitest-environment jsdom
//
// oct26-m16-t1: セキュリティレビュー B の B-UI-2・B-UI-3 の是正（ui_marker.ts の挙動）
//
// 前提（m1-t4 の脅威モデル）: 外から取ってくる POI の JSON は信頼できない。
//
// - B-UI-2: POI の url をスキーム検査なしで iframe の src へ入れていた。
// - B-UI-3: POI の directgo をスキーム検査なしで location.href / window.open へ渡していた。
//
// 許可リストは http: / https: だけ。相対 URL は location.href を基点に解決すれば
// http(s) になるので、従来どおり通す（値は書き換えない）。
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ui_marker_poi_html.spec.ts と同じ方針: @maplat/core は OpenLayers 等を引き込むため、
// 本 spec が触れる関数だけをスタブする。
vi.mock("@maplat/core", () => ({
  sanitizeHtml: (dirty: string) => dirty,
  buildSlideAttrs: () => "",
  // MaplatCore/src/functions.ts:4-22 の実装を写したもの（ui_marker_poi_html.spec.ts と同一）
  createElement: (domStr: string) => {
    const expanded = domStr
      .replace(/(<\/?)d([ >])/g, "$1div$2")
      .replace(/(<\/?)s([ >])/g, "$1span$2")
      .replace(/ din="/g, ' data-i18n="')
      .replace(/ dinh="/g, ' data-i18n-html="')
      .replace(/ c="/g, ' class="');
    const tmp = document.createElement("div");
    tmp.innerHTML = expanded;
    return Array.from(tmp.childNodes).filter(
      n => n.nodeType === Node.ELEMENT_NODE
    ) as HTMLElement[];
  }
}));

// handleMarkerAction が冒頭で呼ぶ prepareModal（bootstrap.native）だけを差し替える。
vi.mock("../src/ui_utils", async importOriginal => {
  const orig = await importOriginal<typeof import("../src/ui_utils")>();
  return {
    ...orig,
    prepareModal: () => ({ show: () => {}, hide: () => {} })
  };
});

import { poiWebControl, handleMarkerAction } from "../src/ui_marker";
import type { MaplatUi } from "../src/index";
import type { MarkerData } from "../src/types";

const uiMarkerSource = readFileSync(
  resolve(__dirname, "../src/ui_marker.ts"),
  "utf8"
);

// oct26-m16-t1-poi-xss.spec.ts の safeWebUrl 単体テストと同じ一覧
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

function makeUi(extra: Record<string, unknown> = {}): MaplatUi {
  return {
    enablePoiHtmlNoScroll: true,
    translate: (x: unknown) => x as string,
    ...extra
  } as unknown as MaplatUi;
}

function renderPoi(data: Partial<MarkerData>): HTMLElement {
  const div = document.createElement("div");
  document.body.appendChild(div);
  poiWebControl(makeUi(), div, data as MarkerData, false);
  return div;
}

describe("B-UI-2: POI の url は http/https のときだけ iframe へ入れる", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it.each(REJECTED_URLS)("%s では iframe を出さない", url => {
    const div = renderPoi({ url });
    expect(div.querySelector("iframe")).toBeNull();
  });

  it.each(ACCEPTED_URLS)("%s では iframe の src にそのまま入る", url => {
    const div = renderPoi({ url });
    const iframe = div.querySelector("iframe") as HTMLIFrameElement;
    expect(iframe).not.toBeNull();
    expect(iframe.getAttribute("src")).toBe(url);
  });

  it("ui_marker.ts が safeWebUrl を使っている（ソーステキスト）", () => {
    expect(uiMarkerSource).toMatch(/safeWebUrl\(/);
  });
});

function makeMarkerUi(): MaplatUi {
  const doc = document.createElement("div");
  doc.innerHTML = `<div class="modalBase"></div>`;
  return makeUi({
    core: { mapDivDocument: doc }
  });
}

describe("B-UI-3: POI の directgo は http/https のときだけ遷移する", () => {
  let openSpy: ReturnType<typeof vi.fn>;
  let hrefSet: string[];
  let originalLocation: PropertyDescriptor | undefined;

  beforeEach(() => {
    openSpy = vi.fn();
    vi.stubGlobal("open", openSpy);
    hrefSet = [];
    originalLocation = Object.getOwnPropertyDescriptor(globalThis, "location");
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
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalLocation) {
      Object.defineProperty(globalThis, "location", originalLocation);
    }
  });

  it("テストの前提: window.location の差し替えが効いている", () => {
    window.location.href = "https://probe.example/";
    expect(hrefSet).toEqual(["https://probe.example/"]);
  });

  it.each(REJECTED_URLS)("文字列 %s では location.href に代入しない", url => {
    handleMarkerAction(makeMarkerUi(), { directgo: url } as MarkerData);
    expect(hrefSet).toEqual([]);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it.each(REJECTED_URLS)("blank 指定 %s では window.open しない", url => {
    handleMarkerAction(makeMarkerUi(), {
      directgo: { href: url, blank: true }
    } as MarkerData);
    expect(openSpy).not.toHaveBeenCalled();
    expect(hrefSet).toEqual([]);
  });

  it.each(ACCEPTED_URLS)(
    "文字列 %s では location.href へそのまま代入する",
    url => {
      handleMarkerAction(makeMarkerUi(), { directgo: url } as MarkerData);
      expect(hrefSet).toEqual([url]);
      expect(openSpy).not.toHaveBeenCalled();
    }
  );

  it.each(ACCEPTED_URLS)("blank 指定 %s では window.open(_blank) する", url => {
    handleMarkerAction(makeMarkerUi(), {
      directgo: { href: url, blank: true }
    } as MarkerData);
    expect(openSpy).toHaveBeenCalledWith(url, "_blank");
    expect(hrefSet).toEqual([]);
  });

  it("オブジェクト形で blank が無ければ location.href へ代入する（既存挙動）", () => {
    handleMarkerAction(makeMarkerUi(), {
      directgo: { href: "https://example.com/" }
    } as MarkerData);
    expect(hrefSet).toEqual(["https://example.com/"]);
  });
});
