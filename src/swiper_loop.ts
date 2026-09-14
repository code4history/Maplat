// Swiper 12 の loopFix() が要求するスライド枚数。現行オプション
// slidesPerView: 2 + centeredSlides: true（480px 以下は slidesPerView: 1.4）では
// 必要枚数は 5（issue #259 実測）。
const REQUIRED_LOOP_SLIDES = 5;

/** source 数から loop を有効化するか判定する。1 枚のみ無効（single-map）。 */
export function shouldLoop(sourceCount: number): boolean {
  return sourceCount >= 2;
}

/** 必要枚数を満たすまでソース配列を何回繰り返すか（buildLoopSlides が使う）。1 枚は複製しない。 */
export function slideRepeatCount(sourceCount: number): number {
  if (sourceCount < 2) return 1;
  return Math.ceil(REQUIRED_LOOP_SLIDES / sourceCount);
}

/**
 * ループ用のスライド列を作る。ソース配列「全体」を slideRepeatCount 回繰り返す
 * （A,B,A,B,A,B。ソースごとに固めた A,A,A,B,B,B にはしない = 隣り合うスライドが同じ地図にならない）。
 * 1 枚は複製しない。0 枚は空配列。入力配列は書き換えない。
 */
export function buildLoopSlides<T>(slides: T[]): T[] {
  const repeat = slideRepeatCount(slides.length);
  const out: T[] = [];
  for (let r = 0; r < repeat; r++) out.push(...slides);
  return out;
}

/**
 * クリックされたスライドが active の隣なら、その向き（次 = 1・前 = -1）を返す。
 * active 自身・隣でない・index 不明は 0（呼び出し側は動かさず slideToMapID に任せる）。
 */
export function clickedSlideStep(
  activeIndex: number,
  clickedIndex: number | undefined
): -1 | 0 | 1 {
  if (clickedIndex === undefined || Number.isNaN(clickedIndex)) return 0;
  const d = clickedIndex - activeIndex;
  return d === 1 ? 1 : d === -1 ? -1 : 0;
}
