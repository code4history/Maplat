// 地図の作り手が書いた HTML（POI の desc・地図のメタ情報・帰属表記・汎用メニューの text）を
// `<maplat-ui>` の Shadow DOM の中へ入れる口。
//
// 決まり:
//   - `innerHTML` へ入れてよいのは `SanitizedHtml` 型の値だけ。この型の値を作れるのは、サニタイザを
//     呼ぶ下の 2 つの関数（と、その値に `<br>` を足す `newlinesToBr`）だけ。素の文字列は型で弾く。
//   - 作り手の HTML は `<maplat-ui>` の部品と同じ Shadow DOM に入る ∴ 許可表が残す `class` のうち、
//     `<maplat-ui>` 自身の CSS（`MAPLAT_UI_CSS`）が使う名前（予約 class）は、入れた後に外す。
//     作り手が自分で付けたそれ以外の class は変えない。予約 class の一覧は CSS から作る
//     （CSS に class を足せば自動で予約になる。一覧を別に持たない）。
//   - POI の `html` は専用の Shadow DOM に描く（poi-html.ts）ので、ここを通さない。
import { sanitizeHtml, sanitizeIiifHtml } from "@maplat/core/common";
import { MAPLAT_UI_CSS } from "./styles";

declare const sanitizedHtmlBrand: unique symbol;

/** サニタイザを通った HTML の文字列。素の `string` からは代入できない。 */
export type SanitizedHtml = string & { readonly [sanitizedHtmlBrand]: true };

/** 作り手の HTML を、広い許可表（`sanitizeHtml`）で洗う。 */
export function sanitizeAuthorHtml(html: string): SanitizedHtml {
  return sanitizeHtml(html) as SanitizedHtml;
}

/** 外部の提供元が申告した HTML を、狭い許可表（`sanitizeIiifHtml`）で洗う。 */
export function sanitizeProviderHtml(html: string): SanitizedHtml {
  return sanitizeIiifHtml(html) as SanitizedHtml;
}

/** サニタイズ済みの HTML の改行を `<br>` にする（サニタイズの前に行うと `<br>` が入力扱いになる）。 */
export function newlinesToBr(html: SanitizedHtml): SanitizedHtml {
  return html.replace(/\n/g, "<br>") as SanitizedHtml;
}

/** CSS のセレクタに出てくる class 名を集める（コメントと宣言の中身は見ない）。 */
export function classNamesInCss(css: string): Set<string> {
  const selectors = css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\{[^{}]*\}/g, "{}");
  const names = new Set<string>();
  for (const match of selectors.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g))
    names.add(match[1]);
  return names;
}

/** `<maplat-ui>` の CSS が使う class（作り手の HTML には付けたままにしない）。 */
export const UI_RESERVED_CLASSES: ReadonlySet<string> =
  classNamesInCss(MAPLAT_UI_CSS);

// 互換モード（doctype の無いページ）では class のセレクタが大文字・小文字を区別しない ∴ 小文字に揃えて比べる
const RESERVED_LOWER: ReadonlySet<string> = new Set(
  Array.from(UI_RESERVED_CLASSES, name => name.toLowerCase())
);

/** `root` の子孫から予約 class を外す（`root` 自身は UI が作った容器なので触らない）。 */
function dropReservedClasses(root: Element) {
  for (const el of Array.from(root.querySelectorAll("[class]"))) {
    const tokens = (el.getAttribute("class") ?? "")
      .split(/\s+/)
      .filter(Boolean);
    const kept = tokens.filter(
      token => !RESERVED_LOWER.has(token.toLowerCase())
    );
    if (kept.length === tokens.length) continue;
    if (kept.length === 0) el.removeAttribute("class");
    else el.setAttribute("class", kept.join(" "));
  }
}

/**
 * サニタイズ済みの HTML を `target` の中身にする。入れた後、子孫から `<maplat-ui>` の予約 class を外す。
 * @param target UI が作った容器（中身は置き換わる）
 * @param sanitized `sanitizeAuthorHtml`／`sanitizeProviderHtml` の戻り値
 */
export function setSanitizedHtml(target: Element, sanitized: SanitizedHtml) {
  target.innerHTML = sanitized;
  dropReservedClasses(target);
}
