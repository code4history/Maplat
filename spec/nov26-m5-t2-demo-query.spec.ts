import { describe, expect, it } from "vitest";
import { parseDemoQuery } from "../demo/query";
import {
  CHECKS,
  decideExit,
  READY_TIMEOUT_MS,
  SETTLE_MS,
  XSS_PAYLOAD,
  XSS_PAYLOAD_NUNJUCKS
} from "../scripts/nov26-m5/demo-query-checks.mjs";

// nov26-m5-t2（NayutaProducts#28 B-UI-5）: 開発用デモのクエリ許可リストと、配備後検査の終了コードの判定。
// 設計書: docs/superpowers/specs/2026-10-11-nov26-m5-t2-task-design.md v2（AC1・AC4 (a)）

const expectEmpty = (r: object) => {
  expect(Object.keys(r).length).toBe(0);
  expect(Object.getPrototypeOf(r)).toBe(Object.prototype);
  expect(({} as Record<string, unknown>).x).toBeUndefined();
};

describe("parseDemoQuery（AC1）", () => {
  it("appid・lang の正しい値を採る", () => {
    expect(parseDemoQuery("?appid=sample_old&lang=en")).toEqual({
      appid: "sample_old",
      lang: "en"
    });
    expect(parseDemoQuery("?lang=zh-TW")).toEqual({ lang: "zh-TW" });
  });

  it.each([
    "?poiTemplate=${alert(1)}",
    "?iconTemplate=x",
    "?__proto__=x",
    "?constructor=x",
    "?enableCache=false",
    "?pwaManifest=x",
    "?pwaWorker=x"
  ])("許可リスト外のキー %s は捨てる", search => {
    const r = parseDemoQuery(search);
    expectEmpty(r);
  });

  it("__proto__ のキーで原型を汚さない", () => {
    const r = parseDemoQuery(
      "?__proto__[x]=1&__proto__=x&constructor[prototype][x]=1"
    );
    expectEmpty(r);
    expect((Object.prototype as Record<string, unknown>).x).toBeUndefined();
  });

  it.each([
    "?appid=../x",
    "?appid=a/b",
    "?appid=a.json",
    "?appid=%2e%2e",
    `?appid=${"a".repeat(65)}`,
    "?appid="
  ])("appid の形が合わない %s は採らない", search => {
    const r = parseDemoQuery(search);
    expect("appid" in r).toBe(false);
  });

  it.each(['?lang=ja"><x', "?lang=%22%3E%3Cx", "?lang=e"])(
    "lang の形が合わない %s は採らない",
    search => {
      const r = parseDemoQuery(search);
      expect("lang" in r).toBe(false);
    }
  );

  it("appid は 64 文字まで採る", () => {
    const a = "a".repeat(64);
    expect(parseDemoQuery(`?appid=${a}`)).toEqual({ appid: a });
  });

  it("同じキーが複数あれば最初の 1 つ", () => {
    expect(parseDemoQuery("?appid=a&appid=b")).toEqual({ appid: "a" });
  });

  it("片方だけ不正ならもう片方は採る", () => {
    expect(parseDemoQuery("?appid=../x&lang=en")).toEqual({ lang: "en" });
  });

  it.each([
    "#!s:x",
    "?appid=sample_old#!s:x",
    "",
    "?",
    undefined as unknown as string,
    null as unknown as string,
    42 as unknown as string
  ])("%s でも例外を出さない", search => {
    expect(() => parseDemoQuery(search)).not.toThrow();
  });

  it.each([
    "#!s:x",
    "",
    "?",
    undefined as unknown as string,
    null as unknown as string
  ])("%s は {} を返す", search => {
    expectEmpty(parseDemoQuery(search));
  });
});

describe("demo-query-checks の定義", () => {
  it("検査は C1〜C3n で、C3 は lodash 用・C3n は Nunjucks 用の payload を持つ", () => {
    expect(CHECKS.map((c: { id: string }) => c.id)).toEqual([
      "C1",
      "C2",
      "C3",
      "C3n"
    ]);
    const c3 = CHECKS.find((c: { id: string }) => c.id === "C3");
    expect(c3.xss).toBe(true);
    expect(c3.query).toBe(`appid=sample&poiTemplate=${XSS_PAYLOAD}`);
    expect(c3.expectStatus).toBe("READY appid=sample lang=ja");
    const c3n = CHECKS.find((c: { id: string }) => c.id === "C3n");
    expect(c3n.xss).toBe(true);
    expect(c3n.query).toBe(`appid=sample&poiTemplate=${XSS_PAYLOAD_NUNJUCKS}`);
    expect(c3n.expectStatus).toBe("READY appid=sample lang=ja");
    expect(READY_TIMEOUT_MS).toBe(60_000);
    expect(SETTLE_MS).toBe(10_000);
  });

  it("lodash 用の payload は符号化しない生の形（是正前のデモで発火する形）", () => {
    expect(XSS_PAYLOAD).toBe("${Reflect.set(window,/__nov26m5t2/.source,1)}");
  });

  it("Nunjucks 用の payload は空白を含まず、同じ印（window.__nov26m5t2）を立てる", () => {
    expect(XSS_PAYLOAD_NUNJUCKS).toBe(
      '{{range.constructor("Reflect.set(window,/__nov26m5t2/.source,1)")()}}'
    );
    expect(XSS_PAYLOAD_NUNJUCKS).not.toMatch(/\s/);
    // lodash の記法（${ … }・<% … %>）を含まない ∴ lodash の Core では発火しない
    expect(XSS_PAYLOAD_NUNJUCKS).not.toMatch(/\$\{|<%/);
  });
});

describe("decideExit（AC4 (a)）", () => {
  const r = (id: string, verdict: string) => ({ id, verdict });
  it("全 pass 4 件 → 0", () => {
    expect(
      decideExit([
        r("C1", "pass"),
        r("C2", "pass"),
        r("C3", "pass"),
        r("C3n", "pass")
      ])
    ).toBe(0);
  });
  it("red 1 件 → 1", () => {
    expect(
      decideExit([
        r("C1", "pass"),
        r("C2", "pass"),
        r("C3", "pass"),
        r("C3n", "red")
      ])
    ).toBe(1);
  });
  it("error 1 件 → 2", () => {
    expect(
      decideExit([
        r("C1", "pass"),
        r("C2", "error"),
        r("C3", "pass"),
        r("C3n", "pass")
      ])
    ).toBe(2);
  });
  it("error と red の混在 → 2", () => {
    expect(
      decideExit([
        r("C1", "red"),
        r("C2", "error"),
        r("C3", "red"),
        r("C3n", "pass")
      ])
    ).toBe(2);
  });
  it("空配列 → 2", () => {
    expect(decideExit([])).toBe(2);
  });
  it("3 件だけ（件数不足。C3n の欠落）→ 2", () => {
    expect(
      decideExit([r("C1", "pass"), r("C2", "pass"), r("C3", "pass")])
    ).toBe(2);
  });
  it("未知の verdict → 2（pass へ落とさない）", () => {
    expect(
      decideExit([
        r("C1", "pass"),
        r("C2", "pass"),
        r("C3", "pass"),
        r("C3n", "maybe")
      ])
    ).toBe(2);
  });
  it("配列でない → 2", () => {
    expect(decideExit(undefined)).toBe(2);
  });
});
