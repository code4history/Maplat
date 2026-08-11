// m19-t9: src/browserlanguage.ts の未カバー中核ロジックを単体テストする。
// navigator.userAgent の内容で Chrome/非Chrome を分岐し、各種フォールバック
// プロパティから言語を検出、";" 区切りの先頭要素のみ返す。例外時は "" を返す。
//
// 設計レビュー MNR-t9-1: 設計 §4.3 のケース2（languages が空/undefined で
// language にフォールバックし "en-US" を返す）は、実装
// （navigator.languages[0] を無条件評価）の都合上 languages:[] でしか
// 成立しない。languages:undefined は navigator.languages[0] が TypeError を
// 投げ try/catch に捕まって "" が返る（レビューで実走確認済み）。
// このテストではケース2を (2a) languages:[] と (2b) languages:undefined に
// 分割し、両方の分岐（正常フォールバック / catch 経路）を固定する。
import { describe, it, expect, afterEach } from "vitest";
import browserLanguage from "../src/browserlanguage";

const originalNavigator = window.navigator;

function setNavigator(overrides: Record<string, unknown>) {
  Object.defineProperty(window, "navigator", {
    value: { ...window.navigator, ...overrides },
    configurable: true
  });
}

afterEach(() => {
  Object.defineProperty(window, "navigator", {
    value: originalNavigator,
    configurable: true
  });
});

describe("browserLanguage", () => {
  it("Chrome + languages[0] が Accept-Language形式（;区切り）の場合は先頭のみ返す", () => {
    setNavigator({
      userAgent: "Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0",
      languages: ["ja-JP;q=0.9", "en"]
    });
    expect(browserLanguage()).toBe("ja-JP");
  });

  it("(2a) Chrome + languages:[] は language へフォールバックする", () => {
    setNavigator({
      userAgent: "Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0",
      languages: [],
      language: "en-US"
    });
    expect(browserLanguage()).toBe("en-US");
  });

  it("(2b) Chrome + languages:undefined は TypeError が catch され空文字を返す", () => {
    setNavigator({
      userAgent: "Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0",
      languages: undefined,
      language: "en-US"
    });
    expect(browserLanguage()).toBe("");
  });

  it("非Chrome（Firefox相当）は language をそのまま返す", () => {
    setNavigator({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; rv:120.0) Gecko/20100101 Firefox/120.0",
      language: "fr-FR"
    });
    expect(browserLanguage()).toBe("fr-FR");
  });

  it("非Chromeでフォールバック候補が全てundefinedなら空文字を返す", () => {
    setNavigator({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; rv:120.0) Gecko/20100101 Firefox/120.0",
      browserLanguage: undefined,
      language: undefined,
      userLanguage: undefined
    });
    expect(browserLanguage()).toBe("");
  });

  it("languages[0] が ; を含む値なら ; より前のみ返す", () => {
    setNavigator({
      userAgent: "Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0",
      languages: ["th;q=0.8"]
    });
    expect(browserLanguage()).toBe("th");
  });

  it("(INF-t9-4) userAgent自体が取得できない場合はtryの外なのでcatchされず例外が漏れる", () => {
    setNavigator({ userAgent: undefined });
    expect(() => browserLanguage()).toThrow();
  });
});
