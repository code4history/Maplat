// POI の吹き出しの本文（html・url の 2 つ）。
//
// 旧 `src/ui_marker.ts` の `poiWebControl` のうち、`<maplat-ui>` が使う組み立てだけを残したもの
// （旧の実装を消したときに、要素の中の非公開メソッドから出した）。要素の
// `#renderPoi` が呼ぶ。**実ブラウザでの隔離の検証**（`e2e/fixtures/poi-html-probe.ts`）も同じ関数を
// 読む（テスト側にロジックを写さない。m1-t5 の約束）。
//
// 安全の前提（m1-t4 の脅威モデル）: `html`・`url` は外から取ってくる POI の JSON 由来で信頼できない。
//   - html は iframe ではなく Shadow DOM へ描く（スタイルの隔離）。**Shadow DOM はセキュリティ境界では
//     ない**ので、防御は `sanitizeHtml`（@maplat/core/common）。生の html を innerHTML へ入れる分岐は作らない。
//   - url は http/https（相対 URL を含む）のときだけ iframe の src へ入れる（`safeWebUrl`）。
//     iframe にインラインの `onload` は付けない（message の受け口を置かない）。
import { sanitizeHtml } from "@maplat/core/common";
import { safeWebUrl } from "../poi_safe";
import { POI_HTML_SHADOW_CSS } from "./styles";

/**
 * POI の html を Shadow DOM の中へ描いた入れ物を返す。
 * @param html 表示する HTML（多言語の値は呼び出し側で選んでから渡す）
 * @param noScroll 真なら内部のスクロールを持たせない（旧 enablePoiHtmlNoScroll・`enable-poi-html-no-scroll`）
 */
export function buildPoiHtml(html: string, noScroll: boolean): HTMLElement {
  const host = document.createElement("div");
  host.className = noScroll ? "poi-html" : "poi-html scroll";
  host.setAttribute("part", "poi-html");
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = POI_HTML_SHADOW_CSS;
  shadow.appendChild(style);
  const body = document.createElement("div");
  body.innerHTML = sanitizeHtml(html);
  shadow.appendChild(body);
  return host;
}

/**
 * POI の url を iframe にしたものを返す。http/https（相対 URL を含む）でなければ undefined
 * （呼び出し側は何も出さない）。
 */
export function buildPoiIframe(
  url: string,
  noScroll: boolean
): HTMLIFrameElement | undefined {
  const safe = safeWebUrl(url);
  if (safe === undefined) return undefined;
  const iframe = document.createElement("iframe");
  iframe.className = noScroll ? "poi-iframe no-scroll" : "poi-iframe";
  iframe.setAttribute("part", "poi-iframe");
  if (noScroll) iframe.setAttribute("scrolling", "no");
  iframe.src = safe;
  return iframe;
}

/** `buildPoiBody` の結果。`kind: "none"` のときは html も url も無い（呼び出し側がメディア・住所などを描く）。 */
export type PoiBody =
  | { kind: "html"; node: HTMLElement }
  /** url があった。許可されない URL なら `node` は null（何も出さない。メディア等にも進まない） */
  | { kind: "url"; node: HTMLIFrameElement | null }
  | { kind: "none"; node: null };

/**
 * POI の吹き出しの本文の分岐（**html があれば url は見ない**。旧 `poiWebControl` と同じ優先順）。
 * 要素の `#renderPoi` と、実ブラウザの隔離の検証（`e2e/fixtures/poi-html-probe.ts`）の両方がこれを呼ぶ
 * （テスト側に分岐を写さない。m1-t5 の約束）。
 *
 * @param data POI の `html`・`url`（多言語の値でもよい。分岐は値があるかどうかで決め、文字は `translate` で選ぶ）
 * @param noScroll 真なら内部のスクロールを持たせない
 * @param translate 多言語の値から文字を選ぶ関数（既定: 文字列はそのまま、それ以外は ""）
 */
export function buildPoiBody(
  data: { html?: unknown; url?: unknown },
  noScroll: boolean,
  translate: (value: unknown) => string = value =>
    typeof value === "string" ? value : ""
): PoiBody {
  if (data.html) {
    return {
      kind: "html",
      node: buildPoiHtml(translate(data.html) || "", noScroll)
    };
  }
  if (data.url) {
    return {
      kind: "url",
      node: buildPoiIframe(translate(data.url) || "", noScroll) ?? null
    };
  }
  return { kind: "none", node: null };
}
