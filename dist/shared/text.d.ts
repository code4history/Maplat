/**
 * 文字の詰めもの（設計 v2 §2.3.1・§4.5.2・D8）。
 *
 * 旧 UI の `ellips()`（`src/ui_utils.ts:45-104`）と同じ手順を、そのまま 1 本だけ置く:
 *   1. 文字を 1 つずつ `<span>` に分け、末尾に省略記号（`…`）の span を置く
 *   2. 先頭から 1 文字ずつ出していき、**行の高さが増えたら** 1 行あふれたと見なす
 *   3. 最初のあふれでは `minimize` を付けて文字を縮める（CSS 側で `.8em`。タッチは `.6em`）
 *   4. 縮めてもなおあふれて `lines` 行に達したら、そこから先を隠して省略記号だけ残す
 *
 * 旧との違いは 4 点（いずれも設計・orchestrator の決定で決めたもの）:
 *   - `innerHTML` を使わず、`textContent` と DOM の組み立てだけで作る（XSS を作らない）
 *   - `letter-spacing` は触らない（旧の実装も触っていない。D8）
 *   - 同じ要素に何度呼んでも文字が増えないよう、元の文字を覚えておく（`options.text` で上書き可）
 *   - **1 文字の見出しはそのまま出す**（旧は `…` だけになっていた。不具合として直した。N5）
 *
 * `-webkit-line-clamp` は第一手段にしない（D8）。CSS 側の予備は `styles.ts` が持ち、
 * この関数は「JS が通るときの本命」として動く。
 */
/** `ellipsize` の調整値（呼び出し側が変えられるようにオプションで受ける） */
export interface EllipsizeOptions {
    /** 何行で切るか（既定 2） */
    lines?: number;
    /** 省略記号（既定 `…`） */
    omitMark?: string;
    /** 縮めたことを示す class（既定 `minimize`） */
    minimizeClass?: string;
    /**
     * 元の文字。省略のたびに呼び直す用途で、`textContent` から元の文字を復元できないときに渡す。
     * 省略すると「この要素に最初に渡された文字」を使う（2 回目以降も同じ文字から作り直す）。
     */
    text?: string;
    /** 高さの測り方（既定 `offsetHeight`。テストで差し替えられるようにしている） */
    measure?: (element: HTMLElement) => number;
}
/** 元の文字の記録を捨てる（見出しの文字そのものが変わったとき） */
export declare function resetEllipsize(element: HTMLElement): void;
/**
 * 要素の文字を `lines` 行に収め、あふれた分を省略記号にする。
 * 高さを測れない環境（jsdom など）では「分けるだけで、隠さない」動きになる（旧と同じ）。
 */
export declare function ellipsize(element: HTMLElement, lines?: number, options?: EllipsizeOptions): void;
/**
 * 相対リンクの解決（旧 `ui_utils.ts` の `resolveRelativeLink` と同じ規則。Stage 3 のレビュー m4 で 1 か所にした）。
 * `/` を含む名前はそのまま、含まない名前は `fallbackPath` の下（`null`・空は `.`）。
 * 層 B（`<maplat-ui>`）と旧 API の互換層（`MaplatUi.resolveRelativeLink`）の両方が使う。
 */
export declare function resolveRelativeLink(file: string, fallbackPath: string | null): string;
