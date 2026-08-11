// @vitest-environment jsdom
// M6-T2 spec: ライセンスセル描画の共通関数 renderLicenseCell (AC14)。
//
// AC14 (a) 既知語彙でアイコンを出す (b) Custom でアイコンを出さない (c) Note を textContent で出す
//       (d) innerHTML を使わない。
// AC15 の「license 行が val || note のときに表示される」は ui_init 側の表示条件であり、
//       ここでは抽出関数の sink を厳密に検証する。
import { describe, it, expect } from "vitest";
import { renderLicenseCell } from "../src/ui_utils";

function iconUrlFor(fileName: string): string {
  return `assets/parts/${fileName}`;
}

function freshContentEl(): HTMLElement {
  return document.createElement("div");
}

describe("renderLicenseCell (m6-t2)", () => {
  it("AC14a: 既知語彙はアイコン img を表示し、Note が無ければ Note 要素を作らない", () => {
    const el = freshContentEl();
    renderLicenseCell(el, "CC BY", "", iconUrlFor);
    const img = el.querySelector("img.license");
    expect(img).toBeTruthy();
    // 保存値 → ファイル名規則: toLowerCase + 空白→アンダースコア
    expect((img as HTMLImageElement).src).toContain("assets/parts/cc_by.png");
    expect(el.querySelector("div.license_note")).toBeNull();
  });

  it("AC14b: Custom はアイコンを出さず、Note の文章だけを出す", () => {
    const el = freshContentEl();
    renderLicenseCell(el, "Custom", "ODbL 1.0", iconUrlFor);
    expect(el.querySelector("img.license")).toBeNull();
    const note = el.querySelector("div.license_note");
    expect(note).toBeTruthy();
    expect(note?.textContent).toBe("ODbL 1.0");
  });

  it("AC14c: Note は textContent で入る (HTML 文字列がエスケープされる)", () => {
    const el = freshContentEl();
    const malicious = '<img src=x onerror="alert(1)"> 出典';
    renderLicenseCell(el, "Custom", malicious, iconUrlFor);
    const note = el.querySelector("div.license_note");
    expect(note).toBeTruthy();
    // textContent なので HTML として解釈されず、リテラル文字列として入る
    expect(note?.textContent).toBe(malicious);
    // 挿入された要素が実在しない (HTML が解釈されていない) こと
    expect(el.querySelector("img[src=x]")).toBeNull();
    expect(el.querySelector("div.license_note img")).toBeNull();
  });

  it("AC14d: innerHTML を使わない (replaceChildren + textContent のみ)", () => {
    // スパイではなく、Note に HTML を入れても raw のまま text として保持されることで証明する
    const el = freshContentEl();
    renderLicenseCell(el, "CC BY", "<b>bold</b>", iconUrlFor);
    const img = el.querySelector("img.license");
    expect(img).toBeTruthy();
    const note = el.querySelector("div.license_note");
    expect(note?.textContent).toBe("<b>bold</b>");
    expect(el.querySelector("div.license_note b")).toBeNull();
  });

  it("AC14e: license 空かつ note 空のときは何も描画しない", () => {
    const el = freshContentEl();
    renderLicenseCell(el, "", "", iconUrlFor);
    expect(el.childNodes.length).toBe(0);
  });
});
