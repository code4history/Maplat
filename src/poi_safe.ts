// oct26-m16-t1: POI データ（信頼できない外部 JSON。m1-t4 の脅威モデル）を
// DOM や遷移先へ渡す前の無害化ヘルパー。セキュリティレビュー B の B-UI-1〜3 の是正。
//
// Stage 4 の仕上げ: 旧 UI の画面の HTML を文字列で組み立てるための関数（`escapeHtml`・`layerListItemHtml`・
// `poiListItemHtml` と、地図の切り替えのカードのサムネイル・カードの組み立て 2 本）は、呼び手（旧 UI）が無くなったので消した。
// `<maplat-ui>` は DOM を組み立てて `textContent` で文字を入れ、URL は下の 2 本で検査する。

/**
 * 遷移先・iframe の src として許すスキーム（許可リスト）。
 * B-UI-2（iframe の src）と B-UI-3（directgo の遷移先）はこの 1 つの関数で判定する。
 */
const ALLOWED_PROTOCOLS = ["http:", "https:"];

/**
 * `value` が http/https の URL（相対 URL は現在の文書を基点に解決して判定）のときだけ
 * `value` をそのまま返す。それ以外（javascript:・data:・vbscript: など、文字列でない値、
 * 空文字、解析できない値）は undefined を返す。
 *
 * 判定には WHATWG URL パーサ（ブラウザが実際に遷移先を解釈するのと同じもの）を使うので、
 * 大文字混じり・前後の空白・途中のタブや改行によるスキームの偽装も同じ規則で正規化される。
 */
export function safeWebUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value === "") return undefined;
  let protocol: string;
  try {
    protocol = new URL(value, window.location.href).protocol;
  } catch {
    return undefined;
  }
  return ALLOWED_PROTOCOLS.includes(protocol) ? value : undefined;
}

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
export function safeImageUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (/^\s*data:image\//i.test(value)) return value;
  return safeWebUrl(value);
}
