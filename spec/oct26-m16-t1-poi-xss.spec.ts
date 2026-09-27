// @vitest-environment jsdom
//
// oct26-m16-t1: セキュリティレビュー B の B-UI-1〜3 の是正
//
// 前提（m1-t4 の脅威モデル）: 外から取ってくる POI の JSON は信頼できない。
//
// - B-UI-1: POI 一覧（マーカーリスト）が POI／レイヤの name・icon を無害化せずに
//           HTML 文字列へ補間していた（src/ui_init.ts）。
// - B-UI-2: POI の url をスキーム検査なしで iframe の src へ入れていた（src/ui_marker.ts）。
// - B-UI-3: POI の directgo をスキーム検査なしで location.href / window.open へ
//           渡していた（src/ui_marker.ts）。
//
// 本ファイルはヘルパー（src/poi_safe.ts）の単体テストと ui_init.ts の配線を扱う。
// ui_marker.ts の挙動（B-UI-2/3）は oct26-m16-t1-ui-marker-url.spec.ts で扱う。
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  safeWebUrl,
  escapeHtml,
  layerListItemHtml,
  poiListItemHtml
} from "../src/poi_safe";

const uiInitSource = readFileSync(
  resolve(__dirname, "../src/ui_init.ts"),
  "utf8"
);

function parse(html: string): HTMLElement {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.firstElementChild as HTMLElement;
}

// 変更前（5a27bb77）の src/ui_init.ts:880-891 のテンプレートをそのまま写したもの。
// 無害な入力に対して、新しい組み立て結果が文字列として完全一致することを確かめる
// （＝見た目・DOM 構造・クラス名・属性が変わっていないことの根拠）。
function legacyLayerHtml(icon: string, label: string, hide: boolean) {
  return `<li class="list-group-item layer">
                        <div class="row layer_row">
                           <div class="layer_label">
                              <span class="dli-chevron"></span>
                              <img src="${icon}" class="markerlist"> ${label}
                           </div>
                           <div class="layer_onoff">
                              <input type="checkbox" class="markerlist" ${hide ? "" : "checked"}>
                              <label class="check"><div></div></label>
                           </div>
                        </div>
                    </li>`;
}

// 変更前（5a27bb77）の src/ui_init.ts:966-973 のテンプレートをそのまま写したもの。
function legacyPoiHtml(icon: string, label: string) {
  return `<li class="list-group-item poi">
                                <div class="row poi_row">
                                   <div class="poi_label">
                                      <span class="dli-chevron"></span>
                                      <img src="${icon}" class="markerlist"> ${label}
                                   </div>
                                </div>
                            </li>`;
}

const XSS_NAMES = [
  "<img src=x onerror=alert(1)>",
  "<script>alert(1)</script>",
  '"><svg onload=alert(1)>',
  "a & b <b>bold</b>"
];

const XSS_ICONS = [
  '"><img src=x onerror=alert(1)>',
  'x" onerror="alert(1)',
  "javascript:alert(1)",
  "a'b\"c<d>&e"
];

describe("B-UI-1: POI 一覧のレイヤ行は name・icon を無害化する", () => {
  it.each(XSS_NAMES)("name %s は要素にならず文字として表示される", name => {
    const li = parse(layerListItemHtml("icon.png", name, false));
    const label = li.querySelector(".layer_label") as HTMLElement;
    // 要素は骨組みの span と img の 2 つだけ
    expect(Array.from(label.children).map(e => e.tagName)).toEqual([
      "SPAN",
      "IMG"
    ]);
    expect(li.querySelectorAll("script").length).toBe(0);
    expect(li.querySelectorAll("svg").length).toBe(0);
    expect(li.querySelectorAll("b").length).toBe(0);
    expect(label.textContent!.trim()).toBe(name);
  });

  it.each(XSS_ICONS)("icon %s でも img の属性が壊れない", icon => {
    const li = parse(layerListItemHtml(icon, "Layer", false));
    const imgs = li.querySelectorAll("img");
    expect(imgs.length).toBe(1);
    const img = imgs[0];
    expect(img.getAttribute("src")).toBe(icon);
    expect(img.getAttribute("onerror")).toBeNull();
    expect(Array.from(img.attributes).map(a => a.name).sort()).toEqual([
      "class",
      "src"
    ]);
    expect(img.className).toBe("markerlist");
    expect(li.querySelector(".layer_label")!.textContent!.trim()).toBe(
      "Layer"
    );
  });

  it("無害な入力では変更前のテンプレートと文字列として完全一致する（見た目を変えない）", () => {
    for (const hide of [true, false]) {
      expect(layerListItemHtml("pins/a.png", "寺社", hide)).toBe(
        legacyLayerHtml("pins/a.png", "寺社", hide)
      );
    }
  });

  it("hide に応じて checkbox の checked が付く／付かない（既存挙動）", () => {
    const shown = parse(layerListItemHtml("a.png", "L", false));
    const hidden = parse(layerListItemHtml("a.png", "L", true));
    expect(
      (shown.querySelector("input[type=checkbox]") as HTMLInputElement).checked
    ).toBe(true);
    expect(
      (hidden.querySelector("input[type=checkbox]") as HTMLInputElement)
        .checked
    ).toBe(false);
  });
});

describe("B-UI-1: POI 一覧の POI 行は name・icon を無害化する", () => {
  it.each(XSS_NAMES)("name %s は要素にならず文字として表示される", name => {
    const li = parse(poiListItemHtml("icon.png", name));
    const label = li.querySelector(".poi_label") as HTMLElement;
    expect(Array.from(label.children).map(e => e.tagName)).toEqual([
      "SPAN",
      "IMG"
    ]);
    expect(li.querySelectorAll("script").length).toBe(0);
    expect(li.querySelectorAll("svg").length).toBe(0);
    expect(li.querySelectorAll("b").length).toBe(0);
    expect(label.textContent!.trim()).toBe(name);
  });

  it.each(XSS_ICONS)("icon %s でも img の属性が壊れない", icon => {
    const li = parse(poiListItemHtml(icon, "POI"));
    const imgs = li.querySelectorAll("img");
    expect(imgs.length).toBe(1);
    expect(imgs[0].getAttribute("src")).toBe(icon);
    expect(imgs[0].getAttribute("onerror")).toBeNull();
    expect(Array.from(imgs[0].attributes).map(a => a.name).sort()).toEqual([
      "class",
      "src"
    ]);
  });

  it("無害な入力では変更前のテンプレートと文字列として完全一致する（見た目を変えない）", () => {
    expect(poiListItemHtml("pins/b.png", "東大寺")).toBe(
      legacyPoiHtml("pins/b.png", "東大寺")
    );
  });
});

describe("B-UI-1: escapeHtml", () => {
  it("& < > \" ' を実体参照にする", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
  });
  it("文字列以外は変更前のテンプレート補間と同じく String() で文字列にする", () => {
    expect(escapeHtml(undefined)).toBe("undefined");
    expect(escapeHtml(3)).toBe("3");
  });
});

describe("B-UI-1: ui_init.ts の配線（ソーステキスト）", () => {
  it("レイヤ行・POI 行を poi_safe の組み立て関数で作る", () => {
    expect(uiInitSource).toMatch(/layerListItemHtml\(/);
    expect(uiInitSource).toMatch(/poiListItemHtml\(/);
  });

  it("name を生のまま HTML へ補間する箇所が残っていない", () => {
    expect(uiInitSource).not.toContain("${ui.translate!(layer.name)}");
    expect(uiInitSource).not.toContain("${ui.translate!(poi.name)}");
  });

  it("icon を生のまま src 属性へ補間する箇所が残っていない", () => {
    expect(uiInitSource).not.toMatch(/<img src="\$\{layer\.icon/);
    expect(uiInitSource).not.toMatch(/<img src="\$\{poi\.icon/);
  });
});

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

describe("B-UI-2/B-UI-3: safeWebUrl（http/https の許可リスト）", () => {
  it.each(REJECTED_URLS)("%s を拒否する", url => {
    expect(safeWebUrl(url)).toBeUndefined();
  });

  it.each(ACCEPTED_URLS)("%s を通し、値は変えない", url => {
    expect(safeWebUrl(url)).toBe(url);
  });

  it("文字列以外・空文字は拒否する", () => {
    expect(safeWebUrl(undefined)).toBeUndefined();
    expect(safeWebUrl(null)).toBeUndefined();
    expect(safeWebUrl({ href: "https://example.com/" })).toBeUndefined();
    expect(safeWebUrl("")).toBeUndefined();
  });

  it("解析できない URL は拒否する", () => {
    expect(safeWebUrl("http://[::1")).toBeUndefined();
  });
});
