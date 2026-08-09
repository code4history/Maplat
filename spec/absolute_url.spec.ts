// m19-t9: src/absolute_url.ts の未カバー中核ロジックを単体テストする。
// base をパス分解し、relative の各セグメントを "."(無視) / ".."(pop) / それ以外(push) で
// 畳み込んで相対パスを絶対パス風に解決する純関数。
import { describe, it, expect } from "vitest";
import absoluteUrl from "../src/absolute_url";

describe("absoluteUrl", () => {
  it("baseと同じ階層のファイル名を解決する", () => {
    expect(absoluteUrl("a/b/c.txt", "d.txt")).toBe("a/b/d.txt");
  });

  it("先頭の ./ は無視される", () => {
    expect(absoluteUrl("a/b/c.txt", "./d.txt")).toBe("a/b/d.txt");
  });

  it("../ は1階層 pop する", () => {
    expect(absoluteUrl("a/b/c.txt", "../d.txt")).toBe("a/d.txt");
  });

  it("複数セグメントの相対パスを解決する", () => {
    expect(absoluteUrl("a/b/c.txt", "x/y.txt")).toBe("a/b/x/y.txt");
  });

  it("baseがディレクトリを持たない場合はrelativeのみになる", () => {
    expect(absoluteUrl("c.txt", "d.txt")).toBe("d.txt");
  });

  it("空配列への pop() は例外を投げず安全なエッジケースとして固定する", () => {
    expect(absoluteUrl("c.txt", "../d.txt")).toBe("d.txt");
  });
});
