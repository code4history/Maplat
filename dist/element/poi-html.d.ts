/**
 * POI の html を Shadow DOM の中へ描いた入れ物を返す。
 * @param html 表示する HTML（多言語の値は呼び出し側で選んでから渡す）
 * @param noScroll 真なら内部のスクロールを持たせない（旧 enablePoiHtmlNoScroll・`enable-poi-html-no-scroll`）
 */
export declare function buildPoiHtml(html: string, noScroll: boolean): HTMLElement;
/**
 * POI の url を iframe にしたものを返す。http/https（相対 URL を含む）でなければ undefined
 * （呼び出し側は何も出さない）。
 */
export declare function buildPoiIframe(url: string, noScroll: boolean): HTMLIFrameElement | undefined;
/** `buildPoiBody` の結果。`kind: "none"` のときは html も url も無い（呼び出し側がメディア・住所などを描く）。 */
export type PoiBody = {
    kind: "html";
    node: HTMLElement;
}
/** url があった。許可されない URL なら `node` は null（何も出さない。メディア等にも進まない） */
 | {
    kind: "url";
    node: HTMLIFrameElement | null;
} | {
    kind: "none";
    node: null;
};
/**
 * POI の吹き出しの本文の分岐（**html があれば url は見ない**。旧 `poiWebControl` と同じ優先順）。
 * 要素の `#renderPoi` と、実ブラウザの隔離の検証（`e2e/fixtures/poi-html-probe.ts`）の両方がこれを呼ぶ
 * （テスト側に分岐を写さない。m1-t5 の約束）。
 *
 * @param data POI の `html`・`url`（多言語の値でもよい。分岐は値があるかどうかで決め、文字は `translate` で選ぶ）
 * @param noScroll 真なら内部のスクロールを持たせない
 * @param translate 多言語の値から文字を選ぶ関数（既定: 文字列はそのまま、それ以外は ""）
 */
export declare function buildPoiBody(data: {
    html?: unknown;
    url?: unknown;
}, noScroll: boolean, translate?: (value: unknown) => string): PoiBody;
