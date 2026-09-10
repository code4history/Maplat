/** source 数から loop を有効化するか判定する。1 枚のみ無効（single-map）。 */
export declare function shouldLoop(sourceCount: number): boolean;
/** 必要枚数を満たすまでソース配列を何回繰り返して append するか。1 枚は複製しない。 */
export declare function slideRepeatCount(sourceCount: number): number;
