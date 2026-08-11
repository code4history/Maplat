// @vitest-environment jsdom
//
// m1-t5: POI html 経路の隔離（iframe 廃止・サニタイズ + Shadow DOM 化）
//
// 設計書 v2.1 の AC1 / AC2 / AC5 に対応する unit テスト。
// AC3 / AC4（走査）と AC6 / AC10（実ブラウザ挙動）は別手段で検証する。
import { describe, it, expect, beforeEach, vi } from "vitest";

// @maplat/core は OpenLayers 等を引き込むため、本 spec では sanitize 系だけをスタブする。
// スタブは「呼ばれたかどうか」を記録するだけで、実ロジックは再現しない。
// （実サニタイズの正しさは MaplatCore 側の spec と m1-t4 のブラウザ E2E で担保済み）
const sanitizeCalls: string[] = [];
vi.mock("@maplat/core", () => ({
  sanitizeHtml: (dirty: string) => {
    sanitizeCalls.push(dirty);
    // 実装が戻り値をそのまま使っていることを検出できるよう、印を付けて返す
    return `<span data-sanitized="1">${dirty.replace(/<[^>]*>/g, "")}</span>`;
  },
  buildSlideAttrs: () => "",
  // ui_utils.ts が @maplat/core の createElement を再輸出しているため、
  // モジュール全体を差し替える以上ここにも用意する必要がある。
  // MaplatCore/src/functions.ts:4-22 の実装をそのまま写して挙動を一致させる
  // （短縮記法の展開と、一時 div の子要素を配列で返す契約）。
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

import { poiWebControl } from "../src/ui_marker";
import type { MaplatUi } from "../src/index";
import type { MarkerData } from "../src/types";

function makeUi(enablePoiHtmlNoScroll: boolean): MaplatUi {
  return {
    enablePoiHtmlNoScroll,
    translate: (x: unknown) => x as string
  } as unknown as MaplatUi;
}

function render(data: Partial<MarkerData>, noScroll = true): HTMLElement {
  const div = document.createElement("div");
  document.body.appendChild(div);
  poiWebControl(makeUi(noScroll), div, data as MarkerData, false);
  return div;
}

beforeEach(() => {
  sanitizeCalls.length = 0;
  document.body.innerHTML = "";
});

describe("m1-t5 AC1: data.html は Shadow root へ描画される", () => {
  it("host 要素に shadow root が作られ、その中に描画される", () => {
    const div = render({ html: "<b>hello</b>" });
    const host = div.querySelector(".poi_html_host") as HTMLElement;
    expect(host).not.toBeNull();
    expect(host.shadowRoot).not.toBeNull();
    expect(host.shadowRoot!.innerHTML).toContain("hello");
  });

  it("iframe を生成しない（html 経路）", () => {
    const div = render({ html: "<b>hello</b>" });
    expect(div.querySelector("iframe")).toBeNull();
  });
});

describe("m1-t5 AC2: 描画されるのは sanitizeHtml の戻り値だけである", () => {
  it("sanitizeHtml が data.html を引数に呼ばれる", () => {
    render({ html: "<img src=x onerror=alert(1)>" });
    expect(sanitizeCalls).toEqual(["<img src=x onerror=alert(1)>"]);
  });

  it("shadow root の内容は sanitizeHtml の戻り値である（生の html が入らない）", () => {
    const div = render({ html: "<script>alert(1)</script>plain" });
    const host = div.querySelector(".poi_html_host") as HTMLElement;
    const html = host.shadowRoot!.innerHTML;
    // スタブが付けた印があること＝戻り値を使っている
    expect(html).toContain('data-sanitized="1"');
    // 生の入力がそのまま入っていないこと
    expect(html).not.toContain("<script>");
  });
});

describe("m1-t5 AC5: enablePoiHtmlNoScroll による host のクラス", () => {
  it("true なら .poi_html_host のみ（自然高）", () => {
    const div = render({ html: "x" }, true);
    const host = div.querySelector(".poi_html_host") as HTMLElement;
    expect(host.classList.contains("poi_html_host--scroll")).toBe(false);
  });

  it("false なら .poi_html_host--scroll が付く（60vh + 内部スクロール）", () => {
    const div = render({ html: "x" }, false);
    const host = div.querySelector(".poi_html_host") as HTMLElement;
    expect(host.classList.contains("poi_html_host--scroll")).toBe(true);
  });
});

describe("m1-t5 AC1/AC10: html と url の両方がある場合は html を優先する（既存契約）", () => {
  it("html host のみを生成し url iframe は生成しない", () => {
    const div = render({ html: "<b>x</b>", url: "https://example.com/" });
    expect(div.querySelector(".poi_html_host")).not.toBeNull();
    expect(div.querySelector("iframe")).toBeNull();
  });
});

describe("m1-t5 AC10: url のみの場合は従来どおり iframe を生成する", () => {
  it("iframe が生成され src が設定される", () => {
    const div = render({ url: "https://example.com/" });
    const iframe = div.querySelector("iframe") as HTMLIFrameElement;
    expect(iframe).not.toBeNull();
    expect(iframe.getAttribute("src")).toBe("https://example.com/");
    expect(div.querySelector(".poi_html_host")).toBeNull();
  });

  it("iframe にインライン onload 属性が付かない（message リスナを登録しない）", () => {
    for (const noScroll of [true, false]) {
      document.body.innerHTML = "";
      const div = render({ url: "https://example.com/" }, noScroll);
      const iframe = div.querySelector("iframe") as HTMLIFrameElement;
      expect(iframe.getAttribute("onload")).toBeNull();
    }
  });

  it("url 経路では sanitizeHtml を呼ばない", () => {
    render({ url: "https://example.com/" });
    expect(sanitizeCalls).toEqual([]);
  });
});
