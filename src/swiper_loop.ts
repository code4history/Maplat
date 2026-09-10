// Swiper 12 の loopFix() が要求するスライド枚数。現行オプション
// slidesPerView: 2 + centeredSlides: true（480px 以下は slidesPerView: 1.4）では
// 必要枚数は 5（issue #259 実測）。
const REQUIRED_LOOP_SLIDES = 5;

/** source 数から loop を有効化するか判定する。1 枚のみ無効（single-map）。 */
export function shouldLoop(sourceCount: number): boolean {
  return sourceCount >= 2;
}

/** 必要枚数を満たすまでソース配列を何回繰り返して append するか。1 枚は複製しない。 */
export function slideRepeatCount(sourceCount: number): number {
  if (sourceCount < 2) return 1;
  return Math.ceil(REQUIRED_LOOP_SLIDES / sourceCount);
}
