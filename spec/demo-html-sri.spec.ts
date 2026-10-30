// デモのページが読み込む第三者の配布物（CDN の script・stylesheet）は、中身の差し替えを
// ブラウザが検出できるように integrity と crossorigin を持つこと。
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const TAG = /<(script|link)\b[^>]*>/g;
const EXTERNAL = /\b(?:src|href)=["'](?:https?:)?\/\//;
const PRECONNECT = /\brel=["']preconnect["']/;
const INTEGRITY = /\bintegrity=["']sha384-[A-Za-z0-9+/]+={0,2}["']/;
const CROSSORIGIN = /\bcrossorigin=["']anonymous["']/;

describe("index.html の第三者の配布物", () => {
  const html = readFileSync(resolve(__dirname, "../index.html"), "utf8");
  const thirdParty = [...html.matchAll(TAG)]
    .map(match => match[0])
    .filter(tag => EXTERNAL.test(tag) && !PRECONNECT.test(tag));

  it(`第三者の要素を拾えている（${thirdParty.length} 件）`, () => {
    expect(thirdParty.length).toBeGreaterThan(0);
  });

  it("すべてが sha384 の integrity を持つ", () => {
    expect(thirdParty.filter(tag => !INTEGRITY.test(tag))).toEqual([]);
  });

  it('すべてが crossorigin="anonymous" を持つ', () => {
    expect(thirdParty.filter(tag => !CROSSORIGIN.test(tag))).toEqual([]);
  });
});
