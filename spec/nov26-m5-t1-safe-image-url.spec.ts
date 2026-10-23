// @vitest-environment jsdom
//
// nov26-m5-t1: 画像の URL の許可リスト（safeImageUrl。Maplat#274 の受け口でも使う）の単体テスト。
//
// - AC6 (a): safeImageUrl の通す／通さない
//
// Stage 4 の仕上げ: 旧 UI のスワイパーの HTML を組み立てる `swiperThumbUrl`・`swiperSlideHtml` を消したので、
// その単体（AC3・AC4・AC5 (a)）も消した。地図の切り替えのカードの無害化（mapID の属性注入・label のタグ化・
// thumbnail の不正スキーム）は `<maplat-ui>` のスライダーの側（`spec/slider.spec.ts` と
// `e2e/nov26-m5-t1-swiper-xss.spec.ts`）が確かめる。
import { describe, it, expect } from "vitest";
import { safeImageUrl } from "../src/poi_safe";

describe("safeImageUrl（AC6 (a)）", () => {
  const PASS = [
    "x.png",
    "./x.png",
    "/x.png",
    "https://a/b.png",
    "http://a/b.png",
    "data:image/png;base64,AA",
    " DATA:image/svg+xml,<svg/>"
  ];
  const REJECT: unknown[] = [
    "javascript:alert(1)",
    "JaVaScRiPt:x",
    "\tjavascript:x",
    "data:text/html,x",
    "data:,x",
    "vbscript:x",
    "",
    null,
    undefined,
    123,
    {}
  ];

  it.each(PASS)("通す: %j（戻り値は引数そのもの）", value => {
    expect(safeImageUrl(value)).toBe(value);
  });

  it.each(REJECT)("通さない: %j", value => {
    expect(safeImageUrl(value)).toBeUndefined();
  });
});
