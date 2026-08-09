// m19-t9: src/contextmenu/html.ts の未カバー中核ロジックを単体テストする。
// Html クラスは constructor(base) で base.container を保持するのみで、OpenLayers の
// Control（Base 全体）を要求しない。最小限のフェイク Base で単体構築できる
// （設計書 §4.5・実機確認済み）。
import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Html } from "../src/contextmenu/html";
import { CSS_VARS } from "../src/contextmenu/constants";
import type { ContextMenuItem } from "../src/types";
import type Base from "../src/contextmenu/base";

// AC3: html.ts 自身が直接 innerHTML 代入・insertAdjacentHTML 呼び出しへ戻っていないことの
// 回帰検出（既存のセキュリティ是正の再発防止）。createFragment（helpers/dom.ts 内で
// innerHTML を使う）の呼び出し自体は許容範囲であり、対象は html.ts 自身のソーステキストのみ。
describe("html.ts ソーステキスト（AC3: innerHTML/insertAdjacentHTML 不使用の回帰検出）", () => {
  const htmlTsPath = resolve(__dirname, "../src/contextmenu/html.ts");
  const source = readFileSync(htmlTsPath, "utf8");

  it(".innerHTML = への直接代入を含まない", () => {
    expect(source).not.toMatch(/\.innerHTML\s*=/);
  });

  it("insertAdjacentHTML( の呼び出しを含まない", () => {
    expect(source).not.toContain("insertAdjacentHTML(");
  });
});

function makeFakeBase(
  overrides: Partial<{
    items: ContextMenuItem[];
    defaultItems: boolean;
    width: number;
  }> = {}
) {
  const container = document.createElement("div");
  const ul = document.createElement("ul");
  container.appendChild(ul);
  return {
    container,
    options: {
      defaultItems: overrides.defaultItems ?? false,
      items: overrides.items ?? [],
      width: overrides.width ?? 150
    },
    Internal: {
      items: {} as Record<string, unknown>,
      setItemListener: vi.fn(),
      submenu: { left: "0px", lastLeft: "" }
    }
  };
}

function makeHtml(overrides?: Parameters<typeof makeFakeBase>[0]) {
  const base = makeFakeBase(overrides);
  const html = new Html(base as unknown as Base);
  return { html, base };
}

describe("createMenu", () => {
  it("defaultItems:false かつ items:[] の場合はfalseを返し<li>を生成しない", () => {
    const { html, base } = makeHtml({ defaultItems: false, items: [] });
    const result = html.createMenu();
    expect(result).toBe(false);
    expect(base.container.querySelectorAll("li").length).toBe(0);
  });

  it("items:[{text:'A'},{text:'B'}] の場合はulの直下に<li>が2つ生成される", () => {
    const { html, base } = makeHtml({
      defaultItems: false,
      items: [{ text: "A" }, { text: "B" }]
    });
    html.createMenu();
    const ul = base.container.querySelector("ul") as HTMLElement;
    const lis = ul.children;
    expect(lis.length).toBe(2);
    expect(lis[0].textContent).toBe("A");
    expect(lis[1].textContent).toBe("B");
  });
});

describe("addMenuEntry", () => {
  it("通常項目を追加すると<li>が1つ生成され、Internal.itemsに登録されsetItemListenerが呼ばれる", () => {
    const { html, base } = makeHtml();
    html.addMenuEntry({ text: "Hello" });
    const ul = base.container.querySelector("ul") as HTMLElement;
    expect(ul.children.length).toBe(1);
    expect(ul.children[0].textContent).toBe("Hello");
    expect(Object.keys(base.Internal.items).length).toBe(1);
    expect(base.Internal.setItemListener).toHaveBeenCalledTimes(1);
  });

  it('"-" を渡すとセパレータ（<hr>を含み、classにseparatorが付いた<li>）が生成される', () => {
    const { html, base } = makeHtml();
    // addMenuEntry(item: ContextMenuItem) の型に対し文字列を渡すためキャストが要る（INF-t9-3）。
    html.addMenuEntry("-" as unknown as ContextMenuItem);
    const ul = base.container.querySelector("ul") as HTMLElement;
    const li = ul.children[0] as HTMLElement;
    expect(li.classList.contains(CSS_VARS.separator)).toBe(true);
    expect(li.querySelector("hr")).not.toBeNull();
    const entry = Object.values(base.Internal.items)[0] as {
      separator: boolean;
    };
    expect(entry.separator).toBe(true);
  });

  it("iconを指定するとstyleにbackground-imageが設定されiconクラスが付与される", () => {
    const { html, base } = makeHtml();
    html.addMenuEntry({ text: "Icon", icon: "x.png" });
    const ul = base.container.querySelector("ul") as HTMLElement;
    const li = ul.children[0] as HTMLElement;
    expect(li.getAttribute("style")).toContain("background-image:url(x.png)");
    expect(li.classList.contains(CSS_VARS.icon)).toBe(true);
  });

  it("itemsを持つ項目（サブメニュー）はネストしたコンテナを子に持ち、子項目がその中に生成される", () => {
    const { html, base } = makeHtml();
    html.addMenuEntry({ text: "Parent", items: [{ text: "Child" }] });
    const ul = base.container.querySelector("ul") as HTMLElement;
    expect(ul.children.length).toBe(1);
    const parentLi = ul.children[0] as HTMLElement;
    expect(parentLi.classList.contains(CSS_VARS.submenu)).toBe(true);

    const nestedContainer = parentLi.querySelector(
      `.${CSS_VARS.container}`
    ) as HTMLElement;
    expect(nestedContainer).not.toBeNull();
    const childLi = nestedContainer.querySelector("ul > li") as HTMLElement;
    expect(childLi).not.toBeNull();
    expect(childLi.textContent).toBe("Child");
  });
});

describe("removeMenuEntry", () => {
  it("対象要素をDOMから除去し、Internal.itemsからも削除する", () => {
    // helpers/dom.ts の find() は "#id" 形式のセレクタを document.getElementById(id) へ
    // 委譲しており、渡した context 引数を無視する（実装の実際の挙動。実走で判明）。
    // そのため removeMenuEntry は container が document に接続されていないと対象要素を
    // 発見できない。この前提を document.body への接続で満たす。
    const { html, base } = makeHtml();
    document.body.appendChild(base.container);

    html.addMenuEntry({ text: "X" });
    const id = Object.keys(base.Internal.items)[0];
    expect(document.getElementById(id)).not.toBeNull();

    html.removeMenuEntry(id);

    expect(document.getElementById(id)).toBeNull();
    expect(base.Internal.items[id]).toBeUndefined();

    document.body.removeChild(base.container);
  });
});

describe("cloneAndGetLineHeight", () => {
  it("containerがparentNodeを持つ場合は例外を投げず数値を返し、クローンをDOMに残さない", () => {
    const { html, base } = makeHtml();
    const wrapper = document.createElement("div");
    wrapper.appendChild(base.container);
    document.body.appendChild(wrapper);

    const childCountBefore = wrapper.childElementCount;
    const height = html.cloneAndGetLineHeight();

    // jsdomはoffsetHeightを常に0で返すため、戻り値は0に固定してよい（設計書 §4.5）。
    expect(height).toBe(0);
    expect(wrapper.childElementCount).toBe(childCountBefore);

    document.body.removeChild(wrapper);
  });

  it("container.parentNodeが無い場合は0を返しDOMに副作用を残さない", () => {
    const { html, base } = makeHtml();
    expect(base.container.parentNode).toBeNull();

    const height = html.cloneAndGetLineHeight();

    expect(height).toBe(0);
    expect(base.container.parentNode).toBeNull();
  });
});
