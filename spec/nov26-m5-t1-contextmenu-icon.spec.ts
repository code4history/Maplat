// @vitest-environment jsdom
//
// nov26-m5-t1（code4history/Maplat#274・SR2-UI-L-1）: 重なったマーカーのメニューで、
// POI の icon（信頼できない POI データ）が CSS の文字列へ生で入り、他のプロパティを足せた。
// 受け口（src/contextmenu/html.ts）で、画像の URL として通るものだけを CSSOM の 1 プロパティで入れる。
//
// AC1 (b): Html#addMenuEntry({ text: "p", icon }) の結果の li.style を検査する。
import { describe, it, expect, vi } from "vitest";
import { Html } from "../src/contextmenu/html";
import { CSS_VARS } from "../src/contextmenu/constants";
import type Base from "../src/contextmenu/base";

function makeHtml() {
  const container = document.createElement("div");
  container.appendChild(document.createElement("ul"));
  const base = {
    container,
    options: { defaultItems: false, items: [], width: 150 },
    Internal: {
      items: {} as Record<string, unknown>,
      setItemListener: vi.fn(),
      submenu: { left: "0px", lastLeft: "" }
    }
  };
  const html = new Html(base as unknown as Base);
  return { html, base };
}

function addIcon(icon: unknown): HTMLElement {
  const { html, base } = makeHtml();
  // icon は型の上では string だが、POI データ由来なので任意の値が来うる
  html.addMenuEntry({ text: "p", icon: icon as string });
  const ul = base.container.querySelector("ul") as HTMLElement;
  return ul.children[0] as HTMLElement;
}

describe("Maplat#274: icon の CSS への注入を断つ（AC1 (b)）", () => {
  it("x);position:fixed;… で他のプロパティへはみ出さない", () => {
    const li = addIcon(
      "x);position:fixed;inset:0;z-index:99999;background:url(y"
    );
    expect(li.style.position).toBe("");
    expect(li.style.zIndex).toBe("");
    expect(li.style.length).toBeLessThanOrEqual(1);
    if (li.style.length === 1) {
      expect(li.style.item(0)).toBe("background-image");
    }
  });

  it("引用符・改行・バックスラッシュを含む値でも CSS の文字列から抜けない", () => {
    const li = addIcon('a.png");position:fixed;\\";\nz-index:9;(');
    expect(li.style.position).toBe("");
    expect(li.style.zIndex).toBe("");
    expect(li.style.length).toBeLessThanOrEqual(1);
    if (li.style.length === 1) {
      expect(li.style.item(0)).toBe("background-image");
    }
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:x",
    "",
    123
  ])("画像の URL でない値 %j は background-image を設定しない", icon => {
    const li = addIcon(icon);
    expect(li.style.backgroundImage).toBe("");
    expect(li.getAttribute("style") ?? "").not.toContain("javascript:");
  });

  it.each(["x.png", "https://example.com/a.png", "data:image/png;base64,AAAA"])(
    "画像の URL %j は url( で始まりその URL を含む background-image になる",
    icon => {
      const li = addIcon(icon);
      expect(li.style.backgroundImage.startsWith("url(")).toBe(true);
      expect(li.style.backgroundImage).toContain(icon);
      expect(li.classList.contains(CSS_VARS.icon)).toBe(true);
    }
  );

  it("icon が通らなくても icon クラス（余白）は従来どおり付く", () => {
    const li = addIcon("javascript:alert(1)");
    expect(li.classList.contains(CSS_VARS.icon)).toBe(true);
  });
});
