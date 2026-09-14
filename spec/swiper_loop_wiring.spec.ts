// oct26-m3-t2 / AC1（主判定）: 少数地図 Swiper ループ閾値と副作用対応（index→mapID 統一・
// appendSlide 配列 1 回化・n=0 guard）の回帰を検出するソーステキスト assert。
// 検証対象は既存の src/ui_init.ts であり、import 解決に依存しない（src/swiper_loop を import しない）。
// 変更前（閾値 >=3 のまま・index 基準のまま）で FAIL、変更後（shouldLoop 配線 = 閾値 >=2・
// mapID 基準・appendSlide(配列) 1 回）で PASS する。
//
// oct26-m9-t1（AC-7）: m3-t2 の「appendSlide(配列) 1 回」は、複製をソースごとに固めた並び（A,A,A,B,B,B）と
// 0 枚のまま loop: true で Swiper を生成すること（Loop Warning）を残していた。これを
// 「buildLoopSlides（配列全体の繰り返し）をラッパへ置いてから new Swiper する」配線の assert に置き換え、
// カードのクリックで changeMap より前に slideTowardClickedSlide を呼ぶ配線の assert を足す。
// 変更前（695415e）では appendSlide が残り・配置が無い・先回りが無いため FAIL する。
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

  it("appendSlide を使わず、buildLoopSlides の結果をラッパへ置いてから new Swiper する（oct26-m9-t1 AC-7）", () => {
    expect(source).not.toMatch(/\.appendSlide\(/);
    const basePlace = source.indexOf(
      'querySelector(".base-swiper.swiper-wrapper")!.innerHTML=buildLoopSlides(baseSlides).join("")'
    );
    const overlayPlace = source.indexOf(
      'querySelector(".overlay-swiper.swiper-wrapper")!.innerHTML=buildLoopSlides(overlaySlides).join("")'
    );
    expect(basePlace).toBeGreaterThanOrEqual(0);
    expect(overlayPlace).toBeGreaterThanOrEqual(0);
    const baseNew = source.indexOf('newSwiper(".base-swiper"');
    const overlayNew = source.indexOf('newSwiper(".overlay-swiper"');
    expect(baseNew).toBeGreaterThanOrEqual(0);
    expect(overlayNew).toBeGreaterThanOrEqual(0);
    expect(basePlace).toBeLessThan(baseNew);
    expect(overlayPlace).toBeLessThan(overlayNew);
  });

  it("ソースごとに固めて複製するループ（A,A,A,B,B,B）が残っていない（oct26-m9-t1 AC-7）", () => {
    expect(source).not.toMatch(/for\(leti=0;i<baseRepeat;i\+\+\)/);
    expect(source).not.toMatch(/for\(leti=0;i<overlayRepeat;i\+\+\)/);
    expect(source).not.toMatch(/slideRepeatCount\(baseSources\.length\)/);
    expect(source).not.toMatch(/slideRepeatCount\(overlaySources\.length\)/);
  });

  it("base / overlay の click ハンドラで slideTowardClickedSlide が core.changeMap より前に呼ばれる（oct26-m9-t1 AC-7・AC-12）", () => {
    for (const k of ["base", "overlay"]) {
      const handler = source.indexOf(`${k}Swiper.on("click"`);
      expect(handler, `${k} の click ハンドラ`).toBeGreaterThanOrEqual(0);
      const toward = source.indexOf(
        `slideTowardClickedSlide(${k}Swiper)`,
        handler
      );
      const change = source.indexOf("core.changeMap(", handler);
      expect(toward, `${k} の slideTowardClickedSlide`).toBeGreaterThan(
        handler
      );
      expect(change).toBeGreaterThan(handler);
      expect(toward).toBeLessThan(change);
    }
  });

  it("slideTowardClickedSlide が clickedSlideStep(activeIndex, clickedIndex) の結果で slideNext / slidePrev を呼ぶ（oct26-m9-t1 AC-7）", () => {
    const body = towardBody();
    expect(body).toMatch(
      /conststep=clickedSlideStep\(swiper\.activeIndex,swiper\.clickedIndex\)/
    );
    expect(body).toMatch(/if\(step===1\)swiper\.slideNext\(\)/);
    expect(body).toMatch(/elseif\(step===-1\)swiper\.slidePrev\(\)/);
  });

  it("slideTowardClickedSlide が先回りの後にクリックしたスライドの mapID で slideToMapID を呼び、位置合わせの見張りに目的を渡す（oct26-m9-t1 IR1 MAJ-1）", () => {
    const body = towardBody();
    const step = body.indexOf("swiper.slidePrev()");
    const toMapID = body.indexOf("swiper.slideToMapID(");
    expect(body).toMatch(/swiper\.clickedSlide\?\.getAttribute\("data"\)/);
    expect(toMapID, "slideToMapID の呼び出し").toBeGreaterThanOrEqual(0);
    expect(step).toBeGreaterThanOrEqual(0);
    expect(toMapID).toBeGreaterThan(step);
  });
});

// slideTowardClickedSlide の本体（直後の initSwipers の定義まで。IR1 INFO-1: 本体内の波括弧やコメントの有無に依存しない）
function towardBody(): string {
  const start = source.indexOf("functionslideTowardClickedSlide(swiper:any){");
  expect(start, "slideTowardClickedSlide の定義").toBeGreaterThanOrEqual(0);
  const end = source.indexOf("functioninitSwipers(", start);
  expect(
    end,
    "initSwipers の定義（slideTowardClickedSlide の直後）"
  ).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe("位置合わせの見張りの配線（oct26-m9-t1 IR1 MAJ-1・OF-1）", () => {
  it("applyMapChanged は従来どおり base / overlay の setSlideMapID（→ slideToMapID）で合わせる", () => {
    expect(source).toMatch(/ui\.baseSwiper\.setSlideMapID\(map\.mapID\)/);
    expect(source).toMatch(/ui\.overlaySwiper\.setSlideMapID\(map\.mapID\)/);
  });
});
