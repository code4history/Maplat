// oct26-m3-t2 / AC1（主判定）: 少数地図 Swiper ループ判定の回帰を固定する単位試験。
// 変更前（現状）では src/swiper_loop.ts が存在しないため、この試験は import 解決に失敗して
// FAIL する（主判定の検出力の実測に用いる probe）。
import { describe, it, expect } from "vitest";
import { shouldLoop, slideRepeatCount } from "../src/swiper_loop";

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
