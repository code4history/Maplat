/** source 数から loop を有効化するか判定する。1 枚のみ無効（single-map）。 */
export declare function shouldLoop(sourceCount: number): boolean;
/** 必要枚数を満たすまでソース配列を何回繰り返すか（buildLoopSlides が使う）。1 枚は複製しない。 */
export declare function slideRepeatCount(sourceCount: number): number;
/**
 * ループ用のスライド列を作る。ソース配列「全体」を slideRepeatCount 回繰り返す
 * （A,B,A,B,A,B。ソースごとに固めた A,A,A,B,B,B にはしない = 隣り合うスライドが同じ地図にならない）。
 * 1 枚は複製しない。0 枚は空配列。入力配列は書き換えない。
 */
export declare function buildLoopSlides<T>(slides: T[]): T[];
/**
 * クリックされたスライドが active の隣なら、その向き（次 = 1・前 = -1）を返す。
 * active 自身・隣でない・index 不明は 0（呼び出し側は動かさず slideToMapID に任せる）。
 */
export declare function clickedSlideStep(activeIndex: number, clickedIndex: number | undefined): -1 | 0 | 1;
