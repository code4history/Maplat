// oct26-m16-t1: POI データ（信頼できない外部 JSON。m1-t4 の脅威モデル）を
// DOM や遷移先へ渡す前の無害化ヘルパー。セキュリティレビュー B の B-UI-1〜3 の是正。

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
 * HTML のテキスト・属性値（二重引用符・単一引用符のどちらで囲んでも）へ
 * 補間するための実体参照化。文字列以外は、変更前のテンプレート補間と同じく String() で文字列にする。
 */
export function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * POI 一覧（マーカーリスト）のレイヤ行。
 * テンプレートは変更前（src/ui_init.ts, 5a27bb77）と同一で、icon と label を実体参照化する点だけが違う。
 */
export function layerListItemHtml(
  icon: unknown,
  label: unknown,
  hide: boolean
): string {
  return `<li class="list-group-item layer">
                        <div class="row layer_row">
                           <div class="layer_label">
                              <span class="dli-chevron"></span>
                              <img src="${escapeHtml(icon)}" class="markerlist"> ${escapeHtml(label)}
                           </div>
                           <div class="layer_onoff">
                              <input type="checkbox" class="markerlist" ${hide ? "" : "checked"}>
                              <label class="check"><div></div></label>
                           </div>
                        </div>
                    </li>`;
}

/**
 * POI 一覧（マーカーリスト）の POI 行。
 * テンプレートは変更前（src/ui_init.ts, 5a27bb77）と同一で、icon と label を実体参照化する点だけが違う。
 */
export function poiListItemHtml(icon: unknown, label: unknown): string {
  return `<li class="list-group-item poi">
                                <div class="row poi_row">
                                   <div class="poi_label">
                                      <span class="dli-chevron"></span>
                                      <img src="${escapeHtml(icon)}" class="markerlist"> ${escapeHtml(label)}
                                   </div>
                                </div>
                            </li>`;
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

/**
 * スワイパーのサムネイルの URL。thumbnail のファイル名が images（pointer_images の表）の
 * **自身のキー**で値が文字列ならその値、そうでなければ thumbnail を使い、safeImageUrl を通らなければ fallback。
 * 継承キー（`__proto__`・`constructor` 等）は使わない（nov26-m5-t1）。
 */
export function swiperThumbUrl(
  thumbnail: unknown,
  images: Record<string, unknown>,
  fallback: string
): string {
  let candidate: unknown = thumbnail;
  if (typeof thumbnail === "string" && thumbnail !== "") {
    const key = thumbnail.split("/").pop()!;
    if (
      Object.prototype.hasOwnProperty.call(images, key) &&
      typeof images[key] === "string"
    ) {
      candidate = images[key];
    }
  }
  return safeImageUrl(candidate) ?? fallback;
}

/**
 * 地図切替スワイパーの 1 枚。テンプレートは変更前（src/ui_init.ts:524-527・537-540, 26fbb36a）と同一で、
 * mapID・thumbUrl・label・extraClass を実体参照化する点だけが違う。
 * thumbUrl は呼び出し側で swiperThumbUrl を通した値を渡す（ここでは実体参照化だけをする）。
 */
export function swiperSlideHtml(
  mapID: unknown,
  thumbUrl: unknown,
  label: unknown,
  extraClass = ""
): string {
  const cls = extraClass ? ` ${escapeHtml(extraClass)}` : "";
  return (
    `<div class="swiper-slide${cls}" data="${escapeHtml(mapID)}">` +
    `<img crossorigin="anonymous" src="${escapeHtml(thumbUrl)}"><div> ${escapeHtml(label)}</div> </div> `
  );
}
