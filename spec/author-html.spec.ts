// @vitest-environment jsdom
// 作り手の HTML を入れる口（src/element/author-html.ts）の単体。
// 要素の上での確認は spec/element-author-html-classes.spec.ts。
import { describe, it, expect } from "vitest";
import {
  UI_RESERVED_CLASSES,
  classNamesInCss,
  newlinesToBr,
  sanitizeAuthorHtml,
  sanitizeProviderHtml,
  setSanitizedHtml
} from "../src/element/author-html";

describe("classNamesInCss（セレクタの class 名だけを集める）", () => {
  it("セレクタの class を集め、宣言の値・コメント・小数は拾わない", () => {
    const css = `
      /* .in-comment は拾わない */
      .a, .b-1 > .c_d:hover, p.e.f [part="x"] .g { margin: .5em; background: url(img.png); }
      @media (max-width: 767.5px) { .h .i { line-height: 1.42857; } }
      :host(.j) ::slotted(.k) { color: red; }
    `;
    expect([...classNamesInCss(css)].sort()).toEqual(
      ["a", "b-1", "c_d", "e", "f", "g", "h", "i", "j", "k"].sort()
    );
  });
});

describe("UI_RESERVED_CLASSES（<maplat-ui> の CSS から作る）", () => {
  it("UI の部品の class を含み、単位・拡張子・数字は含まない", () => {
    for (const name of ["splash", "modal", "dialog", "frame", "sr-only"])
      expect(UI_RESERVED_CLASSES.has(name)).toBe(true);
    for (const name of ["em", "px", "png", "s", "my-note"])
      expect(UI_RESERVED_CLASSES.has(name)).toBe(false);
    for (const name of UI_RESERVED_CLASSES)
      expect(name).toMatch(/^-?[_a-zA-Z][\w-]*$/);
  });
});

describe("setSanitizedHtml", () => {
  const holder = () => {
    const div = document.createElement("div");
    div.className = "modal";
    return div;
  };

  it("予約 class だけを外し、作り手の class・並び・他の属性は変えない", () => {
    const div = holder();
    setSanitizedHtml(
      div,
      sanitizeAuthorHtml(
        '<p class="lead">text <a href="https://example.com/" title="t" class="ext splash">link</a></p>' +
          '<img src="https://example.com/a.png" alt="a" class="modal">'
      )
    );
    expect(div.innerHTML).toBe(
      '<p class="lead">text <a href="https://example.com/" title="t" class="ext">link</a></p>' +
        '<img src="https://example.com/a.png" alt="a">'
    );
    // 容器そのもの（UI が作った要素）の class は触らない
    expect(div.className).toBe("modal");
  });

  it("予約 class が無ければ、サニタイザの出力をそのまま入れる（class の書き方も変えない）", () => {
    const html =
      '<table class="spec  wide"><tbody><tr><td class="num">1</td></tr></tbody></table>' +
      '<ul><li class="item">a</li></ul><span class="Lead">case</span>';
    const sanitized = sanitizeAuthorHtml(html);
    const div = holder();
    setSanitizedHtml(div, sanitized);
    expect(div.innerHTML).toBe(sanitized);
    expect(div.querySelector("table")!.getAttribute("class")).toBe(
      "spec  wide"
    );
  });

  it("大文字・小文字の違う予約 class も外す（互換モードのページでは区別されない）", () => {
    const div = holder();
    setSanitizedHtml(
      div,
      sanitizeAuthorHtml('<span class="MODAL Splash mine">case</span>')
    );
    expect(div.innerHTML).toBe('<span class="mine">case</span>');
  });

  it("中身を置き換える（前の中身は残らない）", () => {
    const div = holder();
    div.textContent = "before";
    setSanitizedHtml(div, sanitizeAuthorHtml("<b>after</b>"));
    expect(div.innerHTML).toBe("<b>after</b>");
  });

  it("狭い許可表の値も同じ口で入る", () => {
    const div = holder();
    setSanitizedHtml(
      div,
      sanitizeProviderHtml('<a href="https://example.com/">© Example</a>')
    );
    expect(div.querySelector("a")!.textContent).toBe("© Example");
  });
});

describe("newlinesToBr", () => {
  it("サニタイズの後の改行を <br> にする", () => {
    expect(newlinesToBr(sanitizeAuthorHtml("<b>a</b>\nb\nc"))).toBe(
      "<b>a</b><br>b<br>c"
    );
  });
});
