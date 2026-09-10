// oct26-m3-t2 / AC1（主判定）: 少数地図 Swiper ループ閾値と副作用対応（index→mapID 統一・
// appendSlide 配列 1 回化・n=0 guard）の回帰を検出するソーステキスト assert。
// 検証対象は既存の src/ui_init.ts であり、import 解決に依存しない（src/swiper_loop を import しない）。
// 変更前（閾値 >=3 のまま・index 基準のまま）で FAIL、変更後（shouldLoop 配線 = 閾値 >=2・
// mapID 基準・appendSlide(配列) 1 回）で PASS する。
//
// oct26-m3-t2 fix-forward: CI の Run linter（eslint --fix → prettier --write）は Run tests より前に
// 作業ツリーを整形し直す。この spec が照合する式について整形が変えるのは空白と改行だけなので、
// 空白を全て除いた本文に対して assert し、整形の前（ローカル）と後（CI）で結果が変わらないようにする。
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(
  resolve(__dirname, "../src/ui_init.ts"),
  "utf8"
).replace(/\s+/g, "");

// ループ判定の「実効閾値」を読む。
// 変更後: shouldLoop(xxxSources.length) 配線（shouldLoop の契約は sourceCount >= 2）。
// 変更前: xxxSources.length >= N のリテラル閾値。
function loopThreshold(swiper: "base" | "overlay"): "shouldLoop" | number {
  const plural = swiper === "base" ? "baseSources" : "overlaySources";
  const name = swiper === "base" ? "baseShouldLoop" : "overlayShouldLoop";
  const wired = new RegExp(
    `${name}\\s*=\\s*shouldLoop\\(${plural}\\.length\\)`
  ).test(source);
  if (wired) return "shouldLoop";
  const m = source.match(
    new RegExp(`${name}\\s*=\\s*${plural}\\.length\\s*>=\\s*(\\d+)`)
  );
  if (m) return Number(m[1]);
  throw new Error(`ループ判定が読み取れない: ${name}`);
}

describe("少数地図 Swiper ループ閾値（oct26-m3-t2 主判定 AC1）", () => {
  it("base のループ有効化閾値が 2 枚以上（>=2）である", () => {
    const t = loopThreshold("base");
    expect(t === "shouldLoop" ? 2 : t).toBe(2);
  });

  it("overlay のループ有効化閾値が 2 枚以上（>=2）である", () => {
    const t = loopThreshold("overlay");
    expect(t === "shouldLoop" ? 2 : t).toBe(2);
  });

  it("旧閾値（>=3）のリテラルが base/overlay のいずれにも残っていない", () => {
    expect(source).not.toMatch(/baseSources\.length\s*>=\s*3/);
    expect(source).not.toMatch(/overlaySources\.length\s*>=\s*3/);
  });

  it("base/overlay のループ判定が shouldLoop を実際に呼ぶ（配線。INFO-R2-1）", () => {
    // 「>= 2 リテラル」でも実効閾値は 2 になり PASS してしまうため、配線自体を機械固定する。
    expect(source).toMatch(
      /baseShouldLoop\s*=\s*shouldLoop\(baseSources\.length\)/
    );
    expect(source).toMatch(
      /overlayShouldLoop\s*=\s*shouldLoop\(overlaySources\.length\)/
    );
  });

  it("base の click ハンドラが mapID 基準（setSlideMapIDAsSelected）で選択状態を更新する", () => {
    expect(source).toMatch(
      /baseSwiper\.setSlideMapIDAsSelected\(slide\.getAttribute\("data"\)!\)/
    );
    expect(source).not.toMatch(/baseSwiper\.setSlideIndexAsSelected\(/);
  });

  it("overlay の click ハンドラが mapID 基準（setSlideMapIDAsSelected）で選択状態を更新する", () => {
    expect(source).toMatch(
      /overlaySwiper\.setSlideMapIDAsSelected\(slide\.getAttribute\("data"\)!\)/
    );
    expect(source).not.toMatch(/overlaySwiper\.setSlideIndexAsSelected\(/);
  });

  it("初期化が slideToMapID（mapID 基準）で、n=0 guard を付す", () => {
    expect(source).toMatch(
      /if\(baseSources\.length\)baseSwiper\.slideToMapID\(baseSources\[0\]\.mapID\)/
    );
    expect(source).toMatch(
      /if\(overlaySources\.length\)overlaySwiper\.slideToMapID\(overlaySources\[0\]\.mapID\)/
    );
    expect(source).not.toMatch(/baseSwiper\.slideToIndex\(0\)/);
    expect(source).not.toMatch(/overlaySwiper\.slideToIndex\(0\)/);
  });

  it("appendSlide が slideRepeatCount で複製したスライド HTML 配列を 1 回の appendSlide(配列) で渡す", () => {
    expect(source).toMatch(/slideRepeatCount\(baseSources\.length\)/);
    expect(source).toMatch(/slideRepeatCount\(overlaySources\.length\)/);
    expect(source).toMatch(/baseSwiper\.appendSlide\(baseSlides\)/);
    expect(source).toMatch(/overlaySwiper\.appendSlide\(overlaySlides\)/);
    // 1 回の appendSlide（配列渡し）。逐次 appendSlide（forEach 内で都度呼ぶ）ではない。
    expect((source.match(/baseSwiper\.appendSlide\(/g) || []).length).toBe(1);
    expect((source.match(/overlaySwiper\.appendSlide\(/g) || []).length).toBe(
      1
    );
  });
});
