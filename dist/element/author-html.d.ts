declare const sanitizedHtmlBrand: unique symbol;
/** サニタイザを通った HTML の文字列。素の `string` からは代入できない。 */
export type SanitizedHtml = string & {
    readonly [sanitizedHtmlBrand]: true;
};
/** 作り手の HTML を、広い許可表（`sanitizeHtml`）で洗う。 */
export declare function sanitizeAuthorHtml(html: string): SanitizedHtml;
/** 外部の提供元が申告した HTML を、狭い許可表（`sanitizeIiifHtml`）で洗う。 */
export declare function sanitizeProviderHtml(html: string): SanitizedHtml;
/** サニタイズ済みの HTML の改行を `<br>` にする（サニタイズの前に行うと `<br>` が入力扱いになる）。 */
export declare function newlinesToBr(html: SanitizedHtml): SanitizedHtml;
/** CSS のセレクタに出てくる class 名を集める（コメントと宣言の中身は見ない）。 */
export declare function classNamesInCss(css: string): Set<string>;
/** `<maplat-ui>` の CSS が使う class（作り手の HTML には付けたままにしない）。 */
export declare const UI_RESERVED_CLASSES: ReadonlySet<string>;
/**
 * サニタイズ済みの HTML を `target` の中身にする。入れた後、子孫から `<maplat-ui>` の予約 class を外す。
 * @param target UI が作った容器（中身は置き換わる）
 * @param sanitized `sanitizeAuthorHtml`／`sanitizeProviderHtml` の戻り値
 */
export declare function setSanitizedHtml(target: Element, sanitized: SanitizedHtml): void;
export {};
