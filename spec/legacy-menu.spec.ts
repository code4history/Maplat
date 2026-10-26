// 汎用メニュー（`part="poi-menu"`）の単体テスト。
//
// 旧 API の `showContextMenu([{icon, text, callback}])` と、重なった POI の選択は同じ部品を使う。
// ここでは層 A（地図）を繋がずに、`<maplat-ui>` のメニューだけを動かす（地図の起動は待たない）。
import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/element";
// eslint-disable-next-line no-duplicate-imports
import type { MaplatUiElement } from "../src/element";

function mount(): MaplatUiElement {
  document.body.innerHTML = "<maplat-ui></maplat-ui>";
  return document.querySelector("maplat-ui") as MaplatUiElement;
}

const menu = (host: MaplatUiElement) =>
  host.shadowRoot!.querySelector<HTMLElement>('[part="poi-menu"]')!;
const items = (host: MaplatUiElement) =>
  Array.from(
    host.shadowRoot!.querySelectorAll<HTMLElement>('[part="poi-menu-item"]')
  );

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("汎用メニュー（part 名は poi-menu / poi-menu-item のまま）", () => {
  it("項目を出し、part 名は poi-menu・poi-menu-item（map-menu は使わない）", () => {
    const host = mount();
    host.showMenu({
      items: [{ text: "項目A" }, { text: "項目B", icon: "img/no_image.png" }]
    });
    expect(menu(host).hidden).toBe(false);
    expect(items(host).map(i => i.textContent)).toEqual(["項目A", "項目B"]);
    expect(host.shadowRoot!.querySelector(".map-menu")).toBeNull();
    // アイコンは許可リストを通した URL だけを画像にする
    const icon = items(host)[1].querySelector("img");
    expect(icon?.getAttribute("src")).toContain("img/no_image.png");
  });

  it("text は HTML（旧 showContextMenu と同じ）だが、サニタイズを通す", () => {
    const host = mount();
    host.showMenu({
      items: [
        {
          text: '<b>太字</b><script>window.__x=1</script><img src=x onerror="window.__x=2">'
        }
      ]
    });
    const text = items(host)[0].querySelector(".name")!;
    expect(text.querySelector("b")?.textContent).toBe("太字");
    expect(text.querySelector("script")).toBeNull();
    expect(text.querySelector("img")?.getAttribute("onerror")).toBeNull();
  });

  it("html: false の text は文字として入れる（POI の名前）", () => {
    const host = mount();
    host.showMenu({ items: [{ text: "<b>名前</b>", html: false }] });
    const text = items(host)[0].querySelector(".name")!;
    expect(text.querySelector("b")).toBeNull();
    expect(text.textContent).toBe("<b>名前</b>");
  });

  it("押すと callback が呼ばれ、メニューは閉じる（menuopen / menuclose を配る）", () => {
    const host = mount();
    const events: string[] = [];
    host.addEventListener("menuopen", () => events.push("open"));
    host.addEventListener("menuclose", () => events.push("close"));
    const clicked: string[] = [];
    host.showMenu({
      items: [
        { text: "A", callback: () => clicked.push("A") },
        { text: "B", callback: () => clicked.push("B") }
      ]
    });
    expect(events).toEqual(["open"]);
    items(host)[1].click();
    expect(clicked).toEqual(["B"]);
    expect(menu(host).hidden).toBe(true);
    expect(events).toEqual(["open", "close"]);
  });

  it("callback が投げても UI は壊れない（閉じた後なので警告だけ）", () => {
    const host = mount();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    host.showMenu({
      items: [
        {
          text: "壊れる",
          callback: () => {
            throw new Error("boom");
          }
        }
      ]
    });
    expect(() => items(host)[0].click()).not.toThrow();
    expect(menu(host).hidden).toBe(true);
    warn.mockRestore();
  });

  it("closeMenu() と Escape と外側の押下で閉じる", () => {
    const host = mount();
    host.showMenu({ items: [{ text: "A" }] });
    host.closeMenu();
    expect(menu(host).hidden).toBe(true);
    expect(items(host)).toEqual([]);

    host.showMenu({ items: [{ text: "A" }] });
    host
      .shadowRoot!.querySelector(".frame")!
      .dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
      );
    expect(menu(host).hidden).toBe(true);

    host.showMenu({ items: [{ text: "A" }] });
    host
      .shadowRoot!.querySelector(".map-title")!
      .dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(menu(host).hidden).toBe(true);
  });

  it("読み上げ名（label）をメニューに付ける", () => {
    const host = mount();
    host.showMenu({ items: [{ text: "A" }], label: "候補" });
    expect(menu(host).getAttribute("aria-label")).toBe("候補");
  });

  it("位置は指定（at）が無ければ最後の pointerdown（無ければ中央）。指定は枠の中に寄せる", () => {
    const host = mount();
    host.showMenu({ items: [{ text: "A" }], at: { x: 40, y: 50 } });
    // jsdom の getBoundingClientRect は 0 なので、指定の座標がそのまま入る
    expect(menu(host).style.left).toBe("40px");
    expect(menu(host).style.top).toBe("50px");
  });
});

// ---- 旧の実装（contextmenu/html.ts）を消したので、その XSS の回帰をここへ移した ----
//
// 旧 nov26-m5-t1-contextmenu-icon.spec.ts: 重なったマーカーのメニューの icon（信頼できない POI
// データ）が CSS の文字列へ生で入り、他のプロパティを足せた（Maplat#274）。旧は受け口で URL を
// 検査して CSSOM の 1 プロパティへ入れていたが、いまは **`<img src>` の属性**として置くので
// CSS の文字列は作らない。ここでは「画像の URL として通る値だけを画像にする」ことを固定する。
describe("アイコンの URL は許可リストを通す（旧 nov26-m5-t1-contextmenu-icon の移植）", () => {
  const addIcon = (icon: unknown) => {
    const host = mount();
    host.showMenu({ items: [{ text: "p", icon: icon as string }] });
    const item = items(host)[0];
    return { item, img: item.querySelector("img") };
  };

  it.each([
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:x",
    "",
    123
  ])("画像の URL でない値 %j は画像にせず、CSS も触らない", icon => {
    const { item, img } = addIcon(icon);
    expect(img).toBeNull();
    // 旧は style に入れていた（CSS 文字列への注入）。いまは style を使わない
    expect(item.getAttribute("style")).toBeNull();
    expect(item.innerHTML).not.toContain("javascript:");
  });

  // 旧の CSS 注入の値（スキームを持たないので相対 URL として通る）。属性に入るだけで、
  // CSS の文字列にはならない（他のプロパティを足せない）
  it.each([
    "x.png",
    "https://example.com/a.png",
    "data:image/png;base64,AAAA",
    "x);position:fixed;inset:0;z-index:99999;background:url(y",
    'a.png");position:fixed;\\";\nz-index:9;('
  ])("画像の URL %j は img の src そのものになり、style は付かない", icon => {
    const { item, img } = addIcon(icon);
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toBe(icon);
    expect(
      Array.from(img!.attributes)
        .map(a => a.name)
        .sort()
    ).toEqual(["alt", "class", "src"]);
    expect(item.getAttribute("style")).toBeNull();
  });
});

// 旧 oct26-m16-t1-contextmenu-name.spec.ts: 重なったマーカーのメニューが POI の name を生のまま
// 入れていた（経路は ui_init.ts の clickMarkers リスナ → contextmenu/html.ts の innerHTML）。
// いまは要素が `html: false` で文字として入れる（旧 ui_init はもう無い。`spec/element.spec.ts` の
// 「重なった POI の選択メニュー」も同じことを確かめる）。
describe("名前は要素にならない（旧 oct26-m16-t1-contextmenu-name の移植）", () => {
  const XSS_NAMES = [
    "<img src=x onerror=alert(1)>",
    "<script>alert(1)</script>",
    '"><svg onload=alert(1)>',
    "a & b <b>bold</b>"
  ];

  it.each(XSS_NAMES)("name %s は文字として入る", name => {
    const host = mount();
    host.showMenu({ items: [{ icon: "pin.png", text: name, html: false }] });
    const text = items(host)[0].querySelector(".name")!;
    expect(text.querySelector("script")).toBeNull();
    expect(text.querySelector("svg")).toBeNull();
    expect(text.querySelector("b")).toBeNull();
    expect(text.querySelector("img[onerror]")).toBeNull();
    expect(text.textContent).toBe(name);
  });
});
