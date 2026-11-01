/**
 * `value` が http/https の URL（相対 URL は現在の文書を基点に解決して判定）のときだけ
 * `value` をそのまま返す。それ以外（javascript:・data:・vbscript: など、文字列でない値、
 * 空文字、解析できない値）は undefined を返す。
 *
 * 判定には WHATWG URL パーサ（ブラウザが実際に遷移先を解釈するのと同じもの）を使うので、
 * 大文字混じり・前後の空白・途中のタブや改行によるスキームの偽装も同じ規則で正規化される。
 */
export declare function safeWebUrl(value: unknown): string | undefined;
/**
 * 画像の URL として許すもの: safeWebUrl が通すもの（http/https・相対）と、
 * `data:image/` で始まるもの（前後の空白を除き大文字小文字を区別しない）。
 * それ以外（javascript:・data:text/html・vbscript:・文字列でない値・空文字）は undefined。
 *
 * **画像の文脈（`<img src>`・CSS の `background-image`）専用。** `data:image/svg+xml` を通すので、
 * 遷移・埋め込み（`<a href>`・`<iframe src>`・`<object data>`・`window.open`・`location`）には
 * 使ってはならない。そちらは safeWebUrl を使う。
 * Web Components 化の試作（wc-work/Maplat d7c61e0d:src/element/maplat-ui.ts:166-173）の非公開 safeImageUrl と同じ意味。
 */
export declare function safeImageUrl(value: unknown): string | undefined;
