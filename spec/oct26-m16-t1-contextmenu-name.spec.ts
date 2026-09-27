// @vitest-environment jsdom
//
// oct26-m16-t1 実装レビュー r1 の M-1:
//   重なったマーカーをクリックしたときのコンテキストメニューが、POI の name を
//   生のまま innerHTML に入れていた。
//   経路: src/ui_init.ts の clickMarkers リスナ（text: ui.translate!(datum.name)）
//         → src/contextmenu/html.ts の `<span>${cItem.text}</span>`
//         → src/contextmenu/helpers/dom.ts の createFragment（temp.innerHTML）
//
// clickMarkers リスナは initMapEventListeners（非公開）の中にあり単体で呼べないため、
// ui_init.ts のソースから「メニュー項目の text に入れる式」をそのまま取り出して評価し、
// 実際の Html クラス（contextmenu-html.spec.ts と同じフェイク Base）でメニューを描く。
// これにより、ui_init.ts の式を変えない限りテストは緑にならない。
import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Html } from "../src/contextmenu/html";
import { escapeHtml } from "../src/poi_safe";
import type { ContextMenuItem } from "../src/types";
import type Base from "../src/contextmenu/base";

const uiInitSource = readFileSync(
  resolve(__dirname, "../src/ui_init.ts"),
  "utf8"
);

// clickMarkers リスナの本体
const clickMarkersBlock = (() => {
  const m = uiInitSource.match(
    /core\.addEventListener\("clickMarkers",([\s\S]*?)ui\.showContextMenu\(list\);/
  );
  if (!m) throw new Error("clickMarkers リスナが見つからない");
  return m[1];
})();

// list.push({ … text: <式>, … }) の <式>
const textExpr = (() => {
  const m = clickMarkersBlock.match(/\btext:\s*([^\n]+?),\s*\n/);
  if (!m) throw new Error("clickMarkers リスナの text: が見つからない");
  return m[1];
})();

// TypeScript の非 null 表明（`ui.translate!(`）だけを外して JS として評価する
const textOf = new Function(
  "ui",
  "datum",
  "escapeHtml",
  `return (${textExpr.replace(/!\(/g, "(")});`
) as (
  ui: { translate: (x: unknown) => string },
  datum: { name: unknown },
  esc: typeof escapeHtml
) => string;

const ui = { translate: (x: unknown) => x as string };

function renderMenu(names: string[]): HTMLElement {
  const items: ContextMenuItem[] = names.map(name => ({
    icon: "pin.png",
    text: textOf(ui, { name }, escapeHtml)
  }));
  const container = document.createElement("div");
  container.appendChild(document.createElement("ul"));
  const base = {
    container,
    options: { defaultItems: false, items, width: 150 },
    Internal: {
      items: {} as Record<string, unknown>,
      setItemListener: vi.fn(),
      submenu: { left: "0px", lastLeft: "" }
    }
  };
  new Html(base as unknown as Base).createMenu();
  return container.querySelector("ul") as HTMLElement;
}

const XSS_NAMES = [
  "<img src=x onerror=alert(1)>",
  "<script>alert(1)</script>",
  '"><svg onload=alert(1)>',
  "a & b <b>bold</b>"
];

describe("M-1: 重なったマーカーのコンテキストメニューは POI の name を文字として表示する", () => {
  it("ui_init.ts の clickMarkers リスナは name を escapeHtml に通す（ソーステキスト）", () => {
    expect(textExpr).toBe("escapeHtml(ui.translate!(datum.name))");
  });

  it.each(XSS_NAMES)(
    "name %s の POI 2 つで、メニューの DOM に要素として現れず文字として出る",
    name => {
      const ul = renderMenu([name, name]);
      const lis = Array.from(ul.children) as HTMLElement[];
      expect(lis.length).toBe(2);
      for (const li of lis) {
        // 各項目の中身は骨組みの span 1 つだけ
        expect(Array.from(li.querySelectorAll("*")).map(e => e.tagName)).toEqual(
          ["SPAN"]
        );
        expect(li.textContent).toBe(name);
      }
      expect(ul.querySelectorAll("img,script,svg,b").length).toBe(0);
    }
  );

  it("無害な名前では、メニューの DOM（文字列）が変更前（生の name）と同じである", () => {
    const names = ["東大寺", "Todai-ji Temple", "法隆寺（斑鳩）"];
    const escapedMenu = renderMenu(names);
    // 変更前の式（ui.translate!(datum.name)）で描いたメニュー
    const items: ContextMenuItem[] = names.map(name => ({
      icon: "pin.png",
      text: ui.translate(name)
    }));
    const container = document.createElement("div");
    container.appendChild(document.createElement("ul"));
    const base = {
      container,
      options: { defaultItems: false, items, width: 150 },
      Internal: {
        items: {} as Record<string, unknown>,
        setItemListener: vi.fn(),
        submenu: { left: "0px", lastLeft: "" }
      }
    };
    new Html(base as unknown as Base).createMenu();
    const rawMenu = container.querySelector("ul") as HTMLElement;
    // id は getUniqueId() で毎回変わるので比較から外す
    const strip = (s: string) => s.replace(/ id="[^"]*"/g, "");
    expect(strip(escapedMenu.innerHTML)).toBe(strip(rawMenu.innerHTML));
    expect(escapedMenu.children.length).toBe(3);
  });
});
