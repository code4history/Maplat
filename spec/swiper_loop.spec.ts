// oct26-m3-t2 / AC1（主判定）: 少数地図 Swiper ループ判定の回帰を固定する単位試験。
// 変更前（現状）では src/swiper_loop.ts が存在しないため、この試験は import 解決に失敗して
// FAIL する（主判定の検出力の実測に用いる probe）。
import { describe, it, expect } from "vitest";
import {
  buildLoopSlides,
  clickedSlideStep,
  shouldLoop,
  slideRepeatCount
} from "../src/swiper_loop";

describe("少数地図 Swiper ループ判定（oct26-m3-t2 AC1）", () => {
  it("source 数2以上で loop を有効化する（1 枚のみ無効 = single-map）", () => {
    expect(shouldLoop(1)).toBe(false);
    expect(shouldLoop(2)).toBe(true);
    expect(shouldLoop(3)).toBe(true);
    expect(shouldLoop(4)).toBe(true);
    expect(shouldLoop(5)).toBe(true);
  });

  it("Swiper 12 の必要枚数 5 を満たす複製回数を返す", () => {
    expect(slideRepeatCount(1)).toBe(1);
    expect(slideRepeatCount(2)).toBe(3);
    expect(slideRepeatCount(3)).toBe(2);
    expect(slideRepeatCount(4)).toBe(2);
    expect(slideRepeatCount(5)).toBe(1);
  });

  it("source 数2〜8 で総スライド数 n×repeat が Swiper 12 の必要枚数 5 以上になる", () => {
    for (let n = 2; n <= 8; n++) {
      expect(n * slideRepeatCount(n)).toBeGreaterThanOrEqual(5);
    }
  });
});

// oct26-m9-t1 AC-7: 複製の並び順（D-1）とカードのクリックの向き（R1 MAJ-1）の純関数。
// 変更前（695415e）では buildLoopSlides / clickedSlideStep が export されていないため FAIL する。
describe("ループ用スライド列の導出 buildLoopSlides（oct26-m9-t1 AC-7）", () => {
  it("ソース配列「全体」を slideRepeatCount 回繰り返す（ソースごとに固めない）", () => {
    expect(buildLoopSlides(["A", "B"])).toEqual(["A", "B", "A", "B", "A", "B"]);
    expect(buildLoopSlides(["A", "B", "C"])).toEqual([
      "A",
      "B",
      "C",
      "A",
      "B",
      "C"
    ]);
    expect(buildLoopSlides(["A", "B", "C", "D"])).toEqual([
      "A",
      "B",
      "C",
      "D",
      "A",
      "B",
      "C",
      "D"
    ]);
  });

  it("5 件以上は複製しない・1 件は 1 件・0 件は空", () => {
    expect(buildLoopSlides(["A", "B", "C", "D", "E"])).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E"
    ]);
    expect(buildLoopSlides(["A", "B", "C", "D", "E", "F"])).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "F"
    ]);
    expect(buildLoopSlides(["A"])).toEqual(["A"]);
    expect(buildLoopSlides([])).toEqual([]);
  });

  it("n=2〜8 で総数が n×slideRepeatCount(n) になり、巡回として隣り合う 2 枚が同じにならない", () => {
    for (let n = 2; n <= 8; n++) {
      const src = Array.from({ length: n }, (_, i) => `m${i}`);
      const out = buildLoopSlides(src);
      expect(out.length).toBe(n * slideRepeatCount(n));
      for (let i = 0; i < out.length; i++) {
        expect(out[i]).not.toBe(out[(i + 1) % out.length]);
      }
    }
  });

  it("入力配列を書き換えない", () => {
    const src = ["A", "B"];
    buildLoopSlides(src);
    expect(src).toEqual(["A", "B"]);
  });
});

describe("カードのクリックで動かす向き clickedSlideStep（oct26-m9-t1 AC-7・AC-12）", () => {
  it("active の次なら 1、前なら -1", () => {
    expect(clickedSlideStep(3, 4)).toBe(1);
    expect(clickedSlideStep(3, 2)).toBe(-1);
    expect(clickedSlideStep(0, 1)).toBe(1);
  });

  it("active 自身・隣でない・index 不明は 0（動かさず slideToMapID に任せる）", () => {
    expect(clickedSlideStep(3, 3)).toBe(0);
    expect(clickedSlideStep(3, 5)).toBe(0);
    expect(clickedSlideStep(3, 1)).toBe(0);
    expect(clickedSlideStep(0, undefined)).toBe(0);
    expect(clickedSlideStep(0, NaN)).toBe(0);
  });
});
