// <maplat-ui>: MaplatUI の Custom Element（最小版。スクラッチ実装・ライブラリ不使用・Shadow DOM（open））。
//
//   <maplat-ui app-id="sample" lang="ja">
//     <maplat-app slot="map"></maplat-app>   <!-- 省略可。省略したら <maplat-ui> が作る -->
//   </maplat-ui>
//
// 地図（層 A の <maplat-app>）に、操作ボタン（ズーム・ホーム・コンパス・GPS・透過度・地図情報・枠線・
// マーカーの非表示）・地図の切り替えスライダー（旧 UI の `.base-swiper` / `.overlay-swiper`）・
// POI の吹き出し（メディアは Chuci のスワイパー）・マーカー一覧・
// 重なった POI の選択メニュー・地図情報（メタデータ・ライセンス・タイルキャッシュ）・共有（SNS・コピー・QR）・
// 状態 URL（state-url）・PWA（pwa-manifest 等）を重ねる。
// 残りの機能（ヘルプ等の画面と全言語化）は後で移す。
//
// **依存の規則**: 層 A は `<maplat-app>` の公開面（属性・プロパティ・メソッド・イベント）
// だけを使う。`@maplat/core` の本体（MaplatApp・mapObject・source）・`@maplat/core/element`・OpenLayers を
// import・参照しない。外部の import は `@maplat/core/common` と、POI のメディアの表示部品 `@c4h/chuci`
// （地図も層 A も持たない Web Components。初めてメディアを出すときに動的 import する）と、QR の符号化の
// `qrcode`（共有の QR を初めて出すときに share.ts が動的 import する）だけ（spec/element-deps.spec.ts が機械的に確かめる）。
// `<maplat-app>` を登録する入口（Core の "@maplat/core/element" か、別の層 A の実装の要素）はページが import する。
//
// 公開の仕様: docs/api/maplat-ui-element.md（属性・プロパティ・メソッド・イベントの一覧）。
//   移行の手引き: docs/api/migration-ui-shadow-dom.md
import {
  ELEMENT_ATTRIBUTES,
  ELEMENT_PROPERTIES,
  LAYER_A_PRO_ATTRIBUTES,
  LAYER_A_PRO_PROPERTIES,
  MAPLAT_APP_TAG,
  MAPLAT_UI_ATTRIBUTES,
  MAPLAT_UI_TAG,
  META_KEYS,
  assets,
  buildSlideAttrs,
  formatAttributeValue,
  parseAttributeValue,
  sanitizeHtml,
  type AttrDef,
  type EnvelopeSpec,
  type LngLat,
  type Localized,
  type MapListItem,
  type MapMeta,
  type MaplatAppElement,
  type MaplatAppEventDetailMap,
  type MaplatPoi,
  type MaplatPoiMedia,
  type PoiLayer,
  type PropDef,
  type Restore,
  type TileCacheProgress,
  type TileCacheProgressType,
  type TileCacheStats,
  type Viewpoint
} from "@maplat/core/common";
import { getIcon } from "../icons";
import { LICENSE_ICONS } from "./license_images";
import { safeImageUrl, safeWebUrl } from "../poi_safe";
import browserLanguage from "../browserlanguage";
import {
  loadLanguage,
  normalizeLang,
  pickLocalized,
  translateKey
} from "./i18n";
import { initPwa } from "./pwa";
import { buildPoiBody } from "./poi-html";
import {
  facebookShareUrl,
  renderQr,
  shareUrlOf,
  twitterShareUrl,
  type ShareUrlType
} from "./share";
import { buildStatePath, parseStateHash } from "./state-url";
import { MapSlider, type MapSliderItem } from "./slider";
import { pointInPolygon, polygonArea } from "../shared/geo";
import { resolveRelativeLink } from "../shared/text";
import { MAPLAT_UI_CSS } from "./styles";

// @maplat/ui の版。ビルド時に vite の define で package.json の version を埋め込む（vite.config.js・
// vitest.config.ts。@maplat/core と同じ）。決め打ちにすると、RC の commit が package.json の版だけを上げたときに
// 置き去りになる。一致は spec/element.spec.ts が確かめる。
declare const __MAPLAT_UI_VERSION__: string | undefined;
/** @maplat/ui の版（package.json の version と同じ）。 */
export const MAPLAT_UI_VERSION: string =
  typeof __MAPLAT_UI_VERSION__ !== "undefined"
    ? __MAPLAT_UI_VERSION__
    : "0.0.0-dev";

/** コンパスを押したときの動き（層 B が決める）。auto は north-up が真なら北へ、偽なら回転を 0 へ。 */
export type CompassAction = "auto" | "north" | "rotation";

/**
 * 汎用のメニュー（`part="poi-menu"`）の 1 項目。
 *
 * メニューは**1 つだけ**持つ。重なった POI の選択はこの一般形の使い方の 1 つで、
 * 旧 API の `showContextMenu([{icon, text, callback}])` も同じ部品へ委譲する（二重にしない）。
 * `text` は `html: false` のとき文字として、それ以外は `sanitizeHtml` を通した HTML として入れる
 * （旧 `contextmenu/html.ts:94` は HTML として差し込んでいた）。
 *
 * @internal 旧 UI の互換層（`src/legacy/`）が使う移行期の口。層 B の公開面には数えない。
 */
export interface MaplatMenuItem {
  /** 画像の URL（http/https・相対 URL だけを画像にする。`poi_safe.ts` の許可リスト） */
  icon?: string;
  /** 文言（`html: false` のときは文字として入れる） */
  text: string;
  /** `text` を HTML として入れるか（既定: 真。POI の名前は偽で文字として入れる） */
  html?: boolean;
  /** 押したときの処理（メニューは押す前に閉じる） */
  callback?: () => void;
}

/** `showMenu()` の引数。 */
export interface MaplatMenuOptions {
  items: MaplatMenuItem[];
  /**
   * 位置。**`<maplat-ui>` の枠（`.frame`。ホストの内側いっぱい）の左上を原点にした px**（client 座標ではない）。
   * 旧 API の `lastClickPixel`（旧は OL の viewport 基準、互換層はホスト基準）をそのまま渡せる。
   * 省略すると最後の pointerdown の位置（こちらは client 座標から枠の座標へ直す）。どちらも無ければ枠の中央
   */
  at?: { x: number; y: number };
  /** 読み上げ名（既定は POI の候補の文言） */
  label?: string;
}

/** 層 A へ流す属性（層 A の属性と同期するキー・層 A 固有の機能に結びつく属性）。 */
const LAYER_A_ATTRS: readonly AttrDef[] = [
  ...ELEMENT_ATTRIBUTES,
  ...LAYER_A_PRO_ATTRIBUTES
];
/** 層 A へ流すプロパティのみのキー（restore は層 B の拡張キーを分けてから流す）。 */
const LAYER_A_PROPS: readonly PropDef[] = [
  ...ELEMENT_PROPERTIES,
  ...LAYER_A_PRO_PROPERTIES
];
const LAYER_A_ATTR_BY_NAME = new Map(LAYER_A_ATTRS.map(d => [d.attr, d]));
const LAYER_A_ATTR_BY_PROP = new Map(LAYER_A_ATTRS.map(d => [d.prop, d]));
/**
 * 層 A の状態のキー（map-id・transparency・display-mode。内部の操作で変わり、子が自分の属性へ書き戻す）。
 * 子が書き戻した属性を「子が自分で持つキー」と取り違えないよう、子が自分で持つかは最初に繋いだ時点で決める。
 */
const LAYER_A_STATE_ATTRS: readonly AttrDef[] = LAYER_A_ATTRS.filter(
  d => d.state
);
// 子ごとの「層 B が流したキー」と「最初に繋いだ時点で子が自分で持っていた状態のキー」（繋ぎ直しても取り違えない）
const FLOWED_BY_CHILD = new WeakMap<Element, Set<string>>();
const OWNED_STATE_BY_CHILD = new WeakMap<Element, Set<string>>();
/** restore のうち層 B が使う拡張キー（子へは流さない）。 */
const LAYER_B_RESTORE_KEYS = ["showBorder", "openedMarker"];

/** 層 B の属性の定義を共有の表（@maplat/core/common の MAPLAT_UI_ATTRIBUTES）から引く。 */
function uiAttr(attr: string): AttrDef {
  const def = MAPLAT_UI_ATTRIBUTES.find(d => d.attr === attr);
  if (!def)
    throw new Error(`<${MAPLAT_UI_TAG}>: unknown layer B attribute "${attr}"`);
  return def;
}
const ATTR_COMPASS_ACTION: AttrDef = {
  attr: "compass-action",
  prop: "compassAction",
  kind: "string"
};
const ATTR_SET_DOCUMENT_TITLE = uiAttr("set-document-title");
const ATTR_ENABLE_BORDER = uiAttr("enable-border");
const ATTR_ENABLE_HIDE_MARKER = uiAttr("enable-hide-marker");
const ATTR_ENABLE_MARKER_LIST = uiAttr("enable-marker-list");
const ATTR_ENABLE_POI_HTML_NO_SCROLL = uiAttr("enable-poi-html-no-scroll");
const ATTR_ENABLE_SHARE = uiAttr("enable-share");
const ATTR_PRESENTATION_MODE = uiAttr("presentation-mode");
const ATTR_TAP_DURATION = uiAttr("tap-duration");
const ATTR_TAP_UI_VANISH = uiAttr("tap-ui-vanish");
const ATTR_APP_ENVELOPE = uiAttr("app-envelope");
// 起動時だけ効くキー（state-url・pwa-*。起動後の変更は警告して無視する）
const ATTR_STATE_URL = uiAttr("state-url");
const ATTR_PWA_MANIFEST = uiAttr("pwa-manifest");
const ATTR_PWA_WORKER = uiAttr("pwa-worker");
const ATTR_PWA_SCOPE = uiAttr("pwa-scope");
/** 層 B が自分で持つ属性（今の版で効くものだけ。compass-action は本実装で決めた）。 */
const UI_ATTRS: readonly AttrDef[] = [
  ATTR_COMPASS_ACTION,
  ATTR_SET_DOCUMENT_TITLE,
  ATTR_ENABLE_BORDER,
  ATTR_ENABLE_HIDE_MARKER,
  ATTR_ENABLE_MARKER_LIST,
  ATTR_ENABLE_POI_HTML_NO_SCROLL,
  ATTR_ENABLE_SHARE,
  ATTR_PRESENTATION_MODE,
  ATTR_TAP_DURATION,
  ATTR_TAP_UI_VANISH,
  ATTR_APP_ENVELOPE,
  ATTR_STATE_URL,
  ATTR_PWA_MANIFEST,
  ATTR_PWA_WORKER,
  ATTR_PWA_SCOPE
];
const UI_ATTR_BY_NAME = new Map(UI_ATTRS.map(d => [d.attr, d]));
/** ヘルプの付随の行を出し入れする属性（旧 CSS の .share_help・.border_help 等と同じ条件）。 */
const HELP_GATED_ATTRS = new Set<AttrDef>([
  ATTR_ENABLE_SHARE,
  ATTR_ENABLE_BORDER,
  ATTR_ENABLE_HIDE_MARKER,
  ATTR_ENABLE_MARKER_LIST
]);

/**
 * 枠線（setEnvelopes）の線と塗り。旧 UI（src/ui_init.ts:441-467 の colors）は範囲を持つ地図に
 * 25 色を順に割り振っていた（色の割り振りは層 B が持つ）。同じ 25 色を 16 進で持つ。
 * 線はその色、塗りは同じ色の透明度 0.4（旧 index.ts の setFillEnvelope が色の 4 番目を 0.4 にしていた）。
 */
const ENVELOPE_COLORS = [
  "#800000", // maroon
  "#ff1493", // deeppink
  "#4b0082", // indigo
  "#808000", // olive
  "#4169e1", // royalblue
  "#ff0000", // red
  "#ff69b4", // hotpink
  "#008000", // green
  "#ffff00", // yellow
  "#000080", // navy
  "#8b4513", // saddlebrown
  "#ff00ff", // fuchsia
  "#2f4f4f", // darkslategray
  "#9acd32", // yellowgreen
  "#0000ff", // blue
  "#c71585", // mediumvioletred
  "#800080", // purple
  "#00ff00", // lime
  "#ff8c00", // darkorange
  "#008080", // teal
  "#dc143c", // crimson
  "#9400d3", // darkviolet
  "#556b2f", // darkolivegreen
  "#4682b4", // steelblue
  "#00ffff" // aqua
];
const ENVELOPE_STROKE = {
  width: 2,
  lineDash: [6, 6] as [number, number]
};
/** 範囲の塗り（同じ色の透明度 0.4。旧は OpenLayers の色の配列の 4 番目を 0.4 にしていた）。 */
function envelopeFill(color: string): string {
  const hex = color.replace(/^#/, "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.4)`;
}
/** アイコンを持たないライセンスの語彙（旧 ui_utils の LICENSE_WITHOUT_ICON と同じ文字列）。 */
const LICENSE_WITHOUT_ICON = "Custom";

/** 層 A のイベントのうち <maplat-ui> が聞くもの。 */
const SUBSCRIBED_EVENTS = [
  "lifecycle:appdata-ready",
  "mapChanged",
  "changeViewpoint",
  "gpsEnabledChanged",
  "updateState",
  "clickMarker",
  "clickMarkers",
  "poi_number",
  "outOfMap",
  "gps_error",
  "gps_result",
  "moveEnd"
] as const;

interface Deferred {
  promise: Promise<void>;
  resolve: () => void;
  reject: (err: unknown) => void;
  settled: boolean;
}
function deferred(): Deferred {
  const d = { settled: false } as Deferred;
  d.promise = new Promise<void>((resolve, reject) => {
    d.resolve = () => {
      d.settled = true;
      resolve();
    };
    d.reject = (err: unknown) => {
      d.settled = true;
      reject(err);
    };
  });
  // 利用側が ready を await しなくても未処理の reject を報告させない
  d.promise.catch(() => undefined);
  return d;
}

// SSR 等の HTMLElement が無い環境でもモジュールの評価で落とさない
const BaseElement: typeof HTMLElement =
  typeof HTMLElement !== "undefined"
    ? HTMLElement
    : (class {} as unknown as typeof HTMLElement);

/** 角度（度）を (-180, 180] へ。 */
function normalizeDegree(deg: number): number {
  const d = ((((deg + 180) % 360) + 360) % 360) - 180;
  return d === -180 ? 180 : d;
}

/** バイト数の表し方（旧 ui_utils.encBytes と同じ規則・同じ刻み）。 */
function encBytes(bytes: number): string {
  const suffixes = ["Bytes", "KBytes", "MBytes", "GBytes"];
  let suffix = "Bytes";
  for (const s of suffixes) {
    suffix = s;
    if (bytes < 1000) break;
    bytes = bytes / 1000;
  }
  return `${Math.floor(bytes * 10) / 10} ${suffix}`;
}

/**
 * ライセンスが空のときの既定値（旧 ui_utils.resolveLicenseFallback と同じ規則）。
 * 旧は source の isWmts() で分けていたが、層 B には無いので listMaps() の isOldMap で代用する
 * （古地図＝Maplat の地図、それ以外＝WMTS のベースマップ。同じ分岐になる）。
 */
function licenseFallback(
  key: "license" | "dataLicense",
  value: string | undefined,
  isWmts: boolean
): string {
  if (value) return value;
  if (key === "license") return "All right reserved";
  return isWmts ? "All right reserved" : "CC BY-SA";
}

/** 旧 ui_marker.detectMediaType と同じ判定。 */
function detectMediaType(src: string): string {
  if (src.includes("youtube.com") || src.includes("youtu.be")) return "youtube";
  const ext = src.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "mp4":
    case "webm":
      return "video";
    case "obj":
      return "3dmodel";
    case "splat":
    case "ply":
      return "gaussian";
    default:
      return "image";
  }
}

/** POI のマーカーの画像（旧 UI と同じく POI → レイヤー → 既定のピン（fallback）の順）。 */
function poiIconUrl(fallback: string, ...candidates: unknown[]): string {
  for (const c of candidates) {
    const url = safeImageUrl(c);
    if (url !== undefined) return url;
  }
  return fallback;
}

/**
 * listPoiLayers の戻り値（層 A の公開面の値。PoiLayer）を一覧に使う形へ。値は設定ファイル由来の信頼できないもの:
 * 形の合わない要素は捨て、namespaceID（showPoiLayer / hidePoiLayer に渡す id。無ければ id）・hide（真偽）・
 * pois（オブジェクトだけ）を確かめた複製にする（層 A の持つレイヤーそのものは書き換えない）。
 */
function toLayerViews(raw: unknown): PoiLayer[] {
  if (!Array.isArray(raw)) return [];
  const out: PoiLayer[] = [];
  for (const layer of raw as unknown[]) {
    if (!layer || typeof layer !== "object") continue;
    const l = layer as Partial<PoiLayer>;
    const key =
      typeof l.namespaceID === "string" && l.namespaceID !== ""
        ? l.namespaceID
        : typeof l.id === "string" && l.id !== ""
          ? l.id
          : undefined;
    if (key === undefined) continue;
    const pois = Array.isArray(l.pois)
      ? (l.pois as unknown[]).filter(
          (p): p is MaplatPoi => !!p && typeof p === "object"
        )
      : [];
    out.push({
      ...l,
      id: typeof l.id === "string" ? l.id : key,
      namespaceID: key,
      hide: !!l.hide,
      pois
    });
  }
  return out;
}

/** POI の id（selectMarker・getMarker に渡すもの。namespaceID が無ければ id）。 */
function poiKey(poi: MaplatPoi): string | undefined {
  if (typeof poi.namespaceID === "string" && poi.namespaceID !== "")
    return poi.namespaceID;
  if (typeof poi.id === "string" || typeof poi.id === "number")
    return String(poi.id);
  return undefined;
}

/** Chuci（cc-swiper 等）の読み込み。最初にメディアを出すときに 1 回だけ。読めなければ次の機会に読み直す。 */
let chuciLoading: Promise<void> | null = null;
function loadChuci(): Promise<void> {
  if (typeof customElements !== "undefined" && customElements.get("cc-swiper"))
    return Promise.resolve();
  if (!chuciLoading) {
    chuciLoading = import("@c4h/chuci").then(
      () => undefined,
      (err: unknown) => {
        chuciLoading = null;
        console.warn(
          `<${MAPLAT_UI_TAG}>: failed to load @c4h/chuci (POI media viewer)`,
          err
        );
      }
    );
  }
  return chuciLoading;
}

const CLOSE_BUTTON = (part: string) =>
  `<button type="button" class="close" part="${part}"><span aria-hidden="true">&#215;</span><span class="sr-only"></span></button>`;

// 共有のボタンのアイコン（旧 ui_init.ts の共有モーダルと同じ SVG）
const SHARE_ICONS = {
  cp: "M224 0c-35.3 0-64 28.7-64 64V96H96c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H288c35.3 0 64-28.7 64-64V384h64c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64H224zM288 384H96V160H224c0-17.7 14.3-32 32-32h64V256c0 17.7 14.3 32 32 32h96V384H288z",
  tw: "M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z",
  fb: "M504 256C504 119 393 8 256 8S8 119 8 256c0 121.3 87.1 222.4 203 240.5V327.9h-61v-71.9h61V203c0-60.8 35.8-93.7 89.2-93.7 25.5 0 50.4 1.8 56.1 2.6v62.4h-35.4c-29.5 0-37.4 18.2-37.4 42.1v59.6h68.9l-11 71.9h-57.9V496.5C416.9 478.4 504 377.3 504 256z"
} as const;
/**
 * ヘルプの文章の ${xxx.png} に置くアイコン（旧 pointer_images の名前 → src/icons.ts の名前）。
 * 旧の画像に対応する SVG が無い名前（loading 等）は何も置かない。
 */
const HELP_ICONS: Record<string, string> = {
  home: "house",
  compass: "compass",
  gps: "location-crosshairs",
  help: "circle-question",
  attr: "circle-info",
  share: "share-from-square",
  border: "layer-group",
  hide_marker: "map-pin",
  marker_list: "list"
};

/** GPS のエラーの種類 → 文言のキー（旧 initGpsHandlers の errorMap）。 */
const GPS_ERROR_KEYS: Record<string, string> = {
  user_gps_deny: "app.user_gps_deny",
  gps_miss: "app.gps_miss",
  gps_timeout: "app.gps_timeout"
};

/** 共有のボタンの組（コピー・Twitter・Facebook。data-share は旧の data 属性と同じ "cp_app" 等）。 */
const SHARE_BUTTONS = (kind: ShareUrlType) => `
      <div class="share-buttons">
        <button type="button" class="share-button" part="share-button" data-share="cp_${kind}"><svg viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="${SHARE_ICONS.cp}"/></svg><small class="share-copy-label"></small></button>
        <button type="button" class="share-button" part="share-button" data-share="tw_${kind}" title="Twitter"><svg viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="${SHARE_ICONS.tw}"/></svg><small>Twitter</small></button>
        <button type="button" class="share-button" part="share-button" data-share="fb_${kind}" title="Facebook"><svg viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="${SHARE_ICONS.fb}"/></svg><small>Facebook</small></button>
      </div>`;

const TEMPLATE = `
<div class="frame" part="frame">
  <slot name="map"></slot>
  <div class="map-title" part="map-title" hidden><span class="text"></span></div>
  <div class="map-switcher" part="map-switcher"></div>
  <div class="ctl-column ctl-column-top-left">
    <div class="ctl ctl-zoom" part="zoom">
      <button type="button" class="zoom-in" part="zoom-in">+</button>
      <button type="button" class="zoom-out" part="zoom-out">&#8722;</button>
    </div>
    <div class="ctl ctl-gps disable" part="gps"><button type="button"><span class="icon">${getIcon("location-crosshairs")}</span></button></div>
    <div class="ctl ctl-home" part="home"><button type="button"><span class="icon">${getIcon("house")}</span></button></div>
  </div>
  <div class="ctl ctl-compass disable" part="compass"><button type="button"><span class="icon needle">${getIcon("compass")}</span></button></div>
  <div class="ctl-column ctl-column-bottom-right">
    <div class="ctl ctl-info" part="info" hidden><button type="button" aria-haspopup="dialog"><span class="icon">${getIcon("circle-info")}</span></button></div>
    <div class="ctl ctl-border" part="border" hidden><button type="button" aria-pressed="false"><span class="icon">${getIcon("layer-group")}</span></button></div>
    <div class="ctl ctl-hide-marker" part="hide-marker" hidden><button type="button" aria-pressed="false"><span class="icon">${getIcon("map-pin")}</span></button></div>
    <div class="ctl ctl-marker-list" part="marker-list" hidden><button type="button" aria-haspopup="dialog"><span class="icon">${getIcon("list")}</span></button></div>
  </div>
  <div class="ctl-column ctl-column-bottom-left">
    <div class="ctl ctl-help" part="help"><button type="button" aria-haspopup="dialog"><span class="icon">${getIcon("circle-question")}</span></button></div>
    <div class="ctl ctl-share" part="share" hidden><button type="button" aria-haspopup="dialog"><span class="icon">${getIcon("share-from-square")}</span></button></div>
  </div>
  <input class="slider" part="slider" type="range" min="0" max="100" step="1" value="100" hidden>
  <div class="poi-menu" part="poi-menu" role="menu" hidden><ul></ul></div>
  <div class="modal map-info-modal" part="map-info-modal" hidden>
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="map-info-title">
      <div class="header">
        <h4 class="title" id="map-info-title" part="map-info-title"></h4>
        ${CLOSE_BUTTON("map-info-close")}
      </div>
      <div class="body">
        <dl class="map-meta" part="map-meta"></dl>
        <section class="map-cache" part="map-cache" hidden>
          <h5 class="cache-heading" part="cache-heading"></h5>
          <p class="cache-size" part="cache-size"></p>
          <p class="cache-buttons">
            <button type="button" class="cache-fetch btn-default" part="cache-fetch" hidden></button>
            <button type="button" class="cache-delete btn-default" part="cache-delete" disabled></button>
          </p>
        </section>
      </div>
    </div>
  </div>
  <div class="modal marker-list-modal" part="marker-list-modal" hidden>
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="marker-list-title">
      <div class="header">
        <h4 class="title" id="marker-list-title" part="marker-list-title"></h4>
        ${CLOSE_BUTTON("marker-list-close")}
      </div>
      <div class="body"><ul class="layers" part="marker-list-layers"></ul></div>
    </div>
  </div>
  <div class="modal poi-modal" part="poi-modal" hidden>
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="poi-title">
      <div class="header">
        <h4 class="title" id="poi-title" part="poi-title"></h4>
        ${CLOSE_BUTTON("poi-close")}
      </div>
      <div class="body" part="poi-body"></div>
      <div class="poi-share recipient" part="poi-share" hidden>${SHARE_BUTTONS("view")}
        <div class="qr" part="poi-qr"></div>
      </div>
    </div>
  </div>
  <div class="modal share-modal" part="share-modal" hidden>
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <div class="header">
        <h4 class="title" id="share-title" part="share-title"></h4>
        ${CLOSE_BUTTON("share-close")}
      </div>
      <div class="body">
        <section class="share-section recipient" part="share-app" data-share-kind="app">
          <h5 class="share-heading"></h5>${SHARE_BUTTONS("app")}
          <div class="qr" part="share-qr-app"></div>
        </section>
        <section class="share-section recipient" part="share-view" data-share-kind="view" hidden>
          <h5 class="share-heading"></h5>${SHARE_BUTTONS("view")}
          <div class="qr" part="share-qr-view"></div>
        </section>
      </div>
    </div>
  </div>
  <div class="modal gps-modal" part="gps-modal" hidden>
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="gps-title">
      <div class="header">
        <h4 class="title" id="gps-title" part="gps-title"></h4>
        ${CLOSE_BUTTON("gps-close")}
      </div>
      <div class="body"><p class="gps-message" part="gps-message"></p></div>
    </div>
  </div>
  <div class="modal help-modal" part="help-modal" hidden>
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="help-title">
      <div class="header">
        <h4 class="title" id="help-title" part="help-title"></h4>
        ${CLOSE_BUTTON("help-close")}
      </div>
      <div class="body help-body" part="help-body"></div>
    </div>
  </div>
  <div class="splash" part="splash" hidden>
    <div class="splash-inner">
      <p class="splash-title" part="splash-title"></p>
      <p class="splash-loading" part="splash-loading"></p>
      <p class="splash-image" part="splash-image" hidden><img class="splash-img" part="splash-img" alt=""></p>
    </div>
  </div>
  <div class="toast" part="toast" role="status" aria-live="polite"></div>
</div>`;

interface Parts {
  frame: HTMLElement;
  title: HTMLElement;
  titleText: HTMLElement;
  switcher: HTMLElement;
  zoomIn: HTMLButtonElement;
  zoomOut: HTMLButtonElement;
  gps: HTMLElement;
  home: HTMLElement;
  compass: HTMLElement;
  needle: HTMLElement;
  infoButton: HTMLElement;
  borderButton: HTMLElement;
  hideMarkerButton: HTMLElement;
  info: HTMLElement;
  infoTitle: HTMLElement;
  infoClose: HTMLButtonElement;
  infoMeta: HTMLElement;
  cacheSection: HTMLElement;
  cacheHeading: HTMLElement;
  cacheSize: HTMLElement;
  cacheFetch: HTMLButtonElement;
  cacheDelete: HTMLButtonElement;
  slider: HTMLInputElement;
  markerListButton: HTMLElement;
  markerList: HTMLElement;
  markerListTitle: HTMLElement;
  markerListClose: HTMLButtonElement;
  markerLayers: HTMLUListElement;
  poiMenu: HTMLElement;
  poiMenuList: HTMLUListElement;
  modal: HTMLElement;
  poiTitle: HTMLElement;
  poiClose: HTMLButtonElement;
  poiBody: HTMLElement;
  poiShare: HTMLElement;
  poiQr: HTMLElement;
  shareButton: HTMLElement;
  share: HTMLElement;
  shareTitle: HTMLElement;
  shareClose: HTMLButtonElement;
  shareApp: HTMLElement;
  shareView: HTMLElement;
  qrApp: HTMLElement;
  qrView: HTMLElement;
  gpsModal: HTMLElement;
  gpsTitle: HTMLElement;
  gpsMessage: HTMLElement;
  gpsClose: HTMLButtonElement;
  helpButton: HTMLElement;
  help: HTMLElement;
  helpTitle: HTMLElement;
  helpClose: HTMLButtonElement;
  helpBody: HTMLElement;
  splash: HTMLElement;
  splashTitle: HTMLElement;
  splashLoading: HTMLElement;
  splashImage: HTMLElement;
  splashImg: HTMLImageElement;
  toast: HTMLElement;
}

/** POI の画像・動画の 1 件をオブジェクトの形にしたもの（文字列は src だけの形）。 */
type PoiMediaObject = Exclude<MaplatPoiMedia, string>;

/**
 * <maplat-ui> の実装（最小版）。層 B の公開面のうち、最小の機能に要るものを持つ:
 *   - 属性: lang（自分の属性だけを見る）・compass-action・set-document-title・層 A の全属性（子へ流す）
 *   - プロパティ: 層 A のプロパティのみのキー（子へ流す）・restore（拡張キーを分ける）・appOption
 *   - 読み取り: ready・implementation・version・app・currentLang
 *   - メソッド: translateText・t・openMarker
 *   - イベント: uiReady（層 A のイベントは子から泡立って通る）
 */
// 下の同名の interface で、prototype に置くアクセサの型を足す（実体は static ブロック。層 A の基底と同じ形）
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class MaplatUiElement extends BaseElement {
  static get observedAttributes(): string[] {
    return [
      "lang",
      ...UI_ATTRS.map(d => d.attr),
      ...LAYER_A_ATTRS.map(d => d.attr)
    ];
  }

  /** 層 B の実装名。 */
  readonly implementation = "ui" as const;
  /** 実装の版。 */
  readonly version: string = MAPLAT_UI_VERSION;

  #root: ShadowRoot;
  #el: Parts;
  // プロパティのみのキー（層 A へ流すもの・restore・appOption）の値
  #props = new Map<string, unknown>();
  #app: MaplatAppElement | null = null;
  // 今の子へ層 B が流したキー（近い方が勝つ: 子が自分で持つキーには触れない）。子ごとに持つ（FLOWED_BY_CHILD）
  #flowed = new Set<string>();
  // 層 B の属性を自分で書き戻している最中（attributeChangedCallback で子へ流し直さない）
  #reflecting = false;
  // 状態 URL の値で、起動時に層 B の map-id・transparency より強くするもの（「属性への書き戻し」）
  #urlOverrides = new Map<string, unknown>();
  #unsubscribe: (() => void) | null = null;
  #ready: Deferred = deferred();
  #appReady = false;
  #generation = 0;
  #maps: MapListItem[] = [];
  // 範囲を持つ地図に割り振った枠線の色（mapID → 16 進の色。listMaps の順に ENVELOPE_COLORS を回す）
  #mapColors = new Map<string, string>();
  #currentMapId: string | null = null;
  // 最後に選んだ古地図（重ね地図）。ベースマップの上でもこの地図の範囲を塗る（旧 UI のスワイパーの選択）
  #lastOldMapId: string | null = null;
  #currentMeta: MapMeta | null = null;
  #viewpoint: Viewpoint | null = null;
  #poi: MaplatPoi | null = null;
  // 表示中の POI の数（poi_number。0 ならマーカー一覧のボタンを隠す＝旧 no_poi）
  #poiCount = 0;
  // 汎用メニュー（part="poi-menu"。旧 UI の contextmenu）。ボタンの data-index で引く。
  // 1 つだけ持ち、重なった POI の選択も旧 API の showContextMenu もこの一般形を使う（二重にしない）。
  #menuItems: MaplatMenuItem[] = [];
  // メニューの項目を作り直す関数（言語の切り替え用）。null なら #menuItems のまま
  #menuProvider: (() => MaplatMenuItem[]) | null = null;
  #menuLabel = "";
  // 重なった POI のメニューに出している POI（言語の切り替えで項目を作り直すために持つ）
  #poiMenuList: MaplatPoi[] = [];
  // clickMarker を受けて、同じ拍に clickMarkers が来なければ単独で開く（旧 UI は clickMarkers だけを見る）
  #pendingMarker: MaplatPoi | null = null;
  // 地図（子の要素）の最後の pointerdown の位置（選択メニューの位置。子の要素の DOM の pointerdown）
  #lastPointer: { clientX: number; clientY: number } | null = null;
  #sliderDragging = false;
  // 地図の切り替えスライダー（左＝背景の地図・右＝重ねる地図）
  #baseSlider: MapSlider | null = null;
  #overlaySlider: MapSlider | null = null;
  // 重ねる地図のスライダーの中央のカード（枠線の塗りを先に追従させる。旧 updateEnvelope の isActive）
  #activeOverlayMapId: string | null = null;
  #warned = new Set<string>();
  #setupListener: (() => void) | null = null;
  // 読み込んだ言語ファイルの辞書（内蔵の辞書 + 旧 UI の言語ファイル。null は内蔵の辞書だけ）。
  // 読み込みは非同期なので、ready と言語の切り替えのときに読み終えてから描く（#reloadLang）。
  #strings: Record<string, string> | null = null;
  // 言語の読み込みの世代（読み込み中に言語を切り替えたら、古い読み込みの結果で描かない）
  #localeGeneration = 0;
  // 起動時だけ効く層 B のキーの起動時の値（最初の #setup で取る。以後の変更は警告して無視）
  #startup: Map<string, unknown> | null = null;
  // appOption の起動時の値（同上。層 B の appOption は起動時だけ効くので、要素自身の読み
  // （currentLang・pwa-manifest の既定の appId・プロパティの読み）はこの値を見る。起動後の代入は子へ流すだけ）
  #startupAppOption: Record<string, unknown> | undefined;
  // 旧 API の pwaWorker: false / null（disablePwaWorker）。Service Worker を登録しない
  #pwaNoWorker = false;
  // 状態 URL（state-url）: 起動時に URL から読んだ復元値（子の restore として流す）
  #urlRestore: Restore | null = null;
  // 子が restore を自分で持つ・子の作成が先に始まっていた → ready の後に changeMap で当てる
  #urlRestoreLate = false;
  // URL から状態を当てている間は URL を書かない（旧 restoring）
  #restoring = false;
  // 最後に書いた状態 URL（"#!" の後ろ。同じなら書かない。旧 pathThatSet）
  #pathThatSet: string | undefined;
  #hashListener: (() => void) | null = null;
  // 枠線の表示（層 B の拡張キー showBorder。描画は #updateEnvelope が層 A の setEnvelopes で行う）
  #showBorder = false;
  // マーカーの非表示（旧 setHideMarker。層 A の hideAllMarkers / showAllMarkers が真実を持つ）
  #hideMarker = false;
  // タイルキャッシュ（地図情報の画面）: 一括取得の実行中か・取得中の地図・最後に読んだ統計・描画のまとめ
  #cacheFetching = false;
  // 取得中の地図（取得を始めたときの mapID。表示は今の地図と同じときだけ「取得中」にする）
  #cacheFetchingMapId: string | null = null;
  #cacheStats: TileCacheStats | undefined;
  #cacheFrame = 0;
  // 統計の読み取りの世代（地図情報を閉じた・地図を替えた・言語を変えたら古い読み取りを捨てる）。
  // 一括取得の印とは分ける（取得は閉じる・言語・地図の切り替えでは捨てない）
  #cacheGeneration = 0;
  // 一括取得の印（進み具合と終わりの受け取り。取得を始めるたび・止めるときに増やす）
  #cacheFetchToken = 0;
  // 起動時の拡張キー（restore・状態 URL・restoreSession の showBorder・openedMarker）を当てたか
  #startupStateApplied = false;
  #pwaStarted = false;
  // 最後の GPS の結果のエラー（旧 lastGPSError。alwaysGpsOn のときの GPS ボタンの再表示に使う）
  #lastGpsError: string | undefined;
  // 範囲外・GPS エラーのモーダルに出している内容（開いたまま言語を変えたら、これで題名と本文を描き直す）
  #gpsModalOutOfMap = false;
  #gpsModalError: string | undefined;
  #toastTimer: ReturnType<typeof setTimeout> | undefined;
  // スプラッシュ（旧 initSplash）: 起動時に 1 回だけ出し、fade の後に隠す
  #splashShown = false;
  #splashTimer: ReturnType<typeof setTimeout> | undefined;
  // スプラッシュの時間（200/1000 ms）は来たが、地図の準備がまだ（旧 ui_init.ts:501 は準備の後に隠す）
  #splashDue = false;
  // 操作ボタンの自動非表示（旧 setMapOnOff。層 A から層 B へ移した tap-duration / tap-ui-vanish）
  #fadeTimer: ReturnType<typeof setTimeout> | undefined;
  // app-envelope（開発用）: 起動時に 1 回だけ範囲の包囲矩形を console に出す
  #appEnvelopeLogged = false;
  // タッチ端末（旧 "ontouchstart" in window。ズームのボタンを隠す）
  #isTouch = typeof window !== "undefined" && "ontouchstart" in window;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = MAPLAT_UI_CSS;
    this.#root.appendChild(style);
    const holder = document.createElement("template");
    holder.innerHTML = TEMPLATE;
    this.#root.appendChild(holder.content);
    const q = <T extends Element = HTMLElement>(selector: string) =>
      this.#root.querySelector(selector) as T;
    this.#el = {
      frame: q(".frame"),
      title: q(".map-title"),
      titleText: q(".map-title .text"),
      switcher: q(".map-switcher"),
      zoomIn: q<HTMLButtonElement>(".zoom-in"),
      zoomOut: q<HTMLButtonElement>(".zoom-out"),
      gps: q(".ctl-gps"),
      home: q(".ctl-home"),
      compass: q(".ctl-compass"),
      needle: q(".ctl-compass .needle"),
      infoButton: q(".ctl-info"),
      borderButton: q(".ctl-border"),
      hideMarkerButton: q(".ctl-hide-marker"),
      info: q(".map-info-modal"),
      infoTitle: q(".map-info-modal .title"),
      infoClose: q<HTMLButtonElement>(".map-info-modal .close"),
      infoMeta: q(".map-info-modal dl.map-meta"),
      cacheSection: q(".map-info-modal .map-cache"),
      cacheHeading: q(".map-info-modal .cache-heading"),
      cacheSize: q(".map-info-modal .cache-size"),
      cacheFetch: q<HTMLButtonElement>(".map-info-modal .cache-fetch"),
      cacheDelete: q<HTMLButtonElement>(".map-info-modal .cache-delete"),
      slider: q<HTMLInputElement>(".slider"),
      markerListButton: q(".ctl-marker-list"),
      markerList: q(".marker-list-modal"),
      markerListTitle: q(".marker-list-modal .title"),
      markerListClose: q<HTMLButtonElement>(".marker-list-modal .close"),
      markerLayers: q<HTMLUListElement>(".marker-list-modal ul.layers"),
      poiMenu: q(".poi-menu"),
      poiMenuList: q<HTMLUListElement>(".poi-menu ul"),
      modal: q(".poi-modal"),
      poiTitle: q(".poi-modal .title"),
      poiClose: q<HTMLButtonElement>(".poi-modal .close"),
      poiBody: q(".poi-modal .body"),
      poiShare: q(".poi-modal .poi-share"),
      poiQr: q(".poi-modal .poi-share .qr"),
      shareButton: q(".ctl-share"),
      share: q(".share-modal"),
      shareTitle: q(".share-modal .title"),
      shareClose: q<HTMLButtonElement>(".share-modal .close"),
      shareApp: q('.share-modal [data-share-kind="app"]'),
      shareView: q('.share-modal [data-share-kind="view"]'),
      qrApp: q('.share-modal [data-share-kind="app"] .qr'),
      qrView: q('.share-modal [data-share-kind="view"] .qr'),
      gpsModal: q(".gps-modal"),
      gpsTitle: q(".gps-modal .title"),
      gpsMessage: q(".gps-modal .gps-message"),
      gpsClose: q<HTMLButtonElement>(".gps-modal .close"),
      helpButton: q(".ctl-help"),
      help: q(".help-modal"),
      helpTitle: q(".help-modal .title"),
      helpClose: q<HTMLButtonElement>(".help-modal .close"),
      helpBody: q(".help-modal .body"),
      splash: q(".splash"),
      splashTitle: q(".splash .splash-title"),
      splashLoading: q(".splash .splash-loading"),
      splashImage: q(".splash .splash-image"),
      splashImg: q<HTMLImageElement>(".splash .splash-img"),
      toast: q(".toast")
    };
    // タッチ端末はズームのボタンを隠す（旧 "ontouchstart" in window → .ol-touch .ol-zoom）
    if (this.#isTouch) this.#el.frame.classList.add("touch");
    this.#wire();
    this.#renderTexts();
  }

  // ---- ライフサイクル ----

  connectedCallback() {
    // 登録前に代入されたプロパティを拾い直す（lazy property upgrade）
    for (const def of [...LAYER_A_ATTRS, ...UI_ATTRS])
      this.#upgradeProperty(def.prop);
    for (const def of LAYER_A_PROPS) this.#upgradeProperty(def.prop);
    if (typeof document !== "undefined" && document.readyState === "loading") {
      // 文書の解析中に繋がったときは、子（<maplat-app slot="map">）が解析されるのを待つ
      if (!this.#setupListener) {
        this.#setupListener = () => {
          this.#setupListener = null;
          this.#setup();
        };
        document.addEventListener("DOMContentLoaded", this.#setupListener, {
          once: true
        });
      }
      return;
    }
    this.#setup();
  }

  disconnectedCallback() {
    // DOM 内の移動（外して同じ拍で差し戻す）では外さない
    queueMicrotask(() => {
      if (this.isConnected) return;
      this.#detach();
      if (this.#hashListener && typeof window !== "undefined")
        window.removeEventListener("hashchange", this.#hashListener);
      this.#hashListener = null;
    });
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ) {
    if (oldValue === newValue || this.#reflecting) return;
    if (name === "lang") {
      // 言語ファイルの読み込みは非同期なので、読み終えてから描く（#reloadLang）
      void this.#reloadLang();
      return;
    }
    const uiDef = UI_ATTR_BY_NAME.get(name);
    if (uiDef) {
      if (uiDef.startup) {
        // 起動後の変更は警告して無視する（作り直さない。読み取りは起動時の値を返す）
        if (this.#startup)
          this.#rejectStartupWrite(uiDef, `attribute "${name}"`);
        return;
      }
      if (uiDef === ATTR_ENABLE_SHARE) {
        this.#renderShareButton();
        if (this.#parseOwnAttribute(ATTR_ENABLE_SHARE) !== true)
          this.#closeShare();
        this.#renderPoiShare();
      }
      if (uiDef === ATTR_COMPASS_ACTION) this.#renderCompass();
      if (uiDef === ATTR_SET_DOCUMENT_TITLE) this.#applyDocumentTitle();
      if (uiDef === ATTR_ENABLE_BORDER) {
        // 起動後に外されたら、描いた枠線も消す
        if (this.#parseOwnAttribute(ATTR_ENABLE_BORDER) !== true) {
          if (this.#showBorder) this.setShowBorder(false);
        }
        this.#renderBorderButton();
      }
      if (uiDef === ATTR_ENABLE_HIDE_MARKER) this.#renderHideMarkerButton();
      if (uiDef === ATTR_ENABLE_MARKER_LIST) {
        this.#renderMarkerListButton();
        if (this.#parseOwnAttribute(ATTR_ENABLE_MARKER_LIST) !== true)
          this.#closeMarkerList();
      }
      // ヘルプの付随の行（共有・枠線・マーカーの非表示・マーカー一覧）と全体の図は enable-* に従う。
      // 全体の図は実物のボタンの出し分けを読むので、ボタンを更新した後で作り直す
      if (HELP_GATED_ATTRS.has(uiDef) && !this.#el.help.hidden)
        this.#renderHelp();
      // enable-poi-html-no-scroll は次に開く POI から効く
      return;
    }
    const def = LAYER_A_ATTR_BY_NAME.get(name);
    if (def) {
      // 利用者が起動前に書いた値は状態 URL より強い（後から書いた方が値）
      this.#urlOverrides.delete(def.prop);
      this.#flowKey(def.prop);
    }
  }

  static {
    const proto = MaplatUiElement.prototype as unknown as Record<
      string,
      unknown
    >;
    // 属性と同期するキー（層 A へ流すもの・層 B のもの）。値の解釈は層 A と同じ
    for (const def of [...LAYER_A_ATTRS, ...UI_ATTRS]) {
      Object.defineProperty(proto, def.prop, {
        configurable: true,
        enumerable: true,
        get(this: MaplatUiElement) {
          // 起動時だけ効くキーは起動後は起動時の値を返す
          if (this.#startup?.has(def.prop)) return this.#startup.get(def.prop);
          return this.#parseOwnAttribute(def);
        },
        set(this: MaplatUiElement, value: unknown) {
          if (def.startup && this.#startup && UI_ATTR_BY_NAME.get(def.attr)) {
            this.#rejectStartupWrite(def, `property "${def.prop}"`);
            return;
          }
          const text = formatAttributeValue(def, value);
          if (text == null) this.removeAttribute(def.attr);
          else this.setAttribute(def.attr, text);
        }
      });
    }
    // プロパティのみのキー
    for (const def of LAYER_A_PROPS) {
      Object.defineProperty(proto, def.prop, {
        configurable: true,
        enumerable: true,
        get(this: MaplatUiElement) {
          // appOption は起動時だけ効く（起動後は起動時の値を返す。子へは今の値が流れる）
          if (def.prop === "appOption") return this.#ownAppOption();
          return this.#props.get(def.prop);
        },
        set(this: MaplatUiElement, value: unknown) {
          if (def.prop === "restore") this.#checkLateRestore(value);
          if (value == null) this.#props.delete(def.prop);
          else this.#props.set(def.prop, value);
          this.#flowKey(def.prop);
        }
      });
    }
  }

  // ---- 状態の読み取り----

  /** 子の ready の後、UI の部品（地図の一覧・題名・ボタンの状態）が揃ったときに解決する。 */
  get ready(): Promise<void> {
    return this.#ready.promise;
  }

  /** 使っている子（層 A の公開面だけを持つ要素）。子を見つける・作る前は null。 */
  get app(): MaplatAppElement | null {
    return this.#app;
  }

  /**
   * 解決後の言語（lang 属性 → appOption.lang（移行用・起動時の値）→ 設定ファイルの lang → ブラウザ）。
   * appOption は起動時だけ効くので、起動後に代入してもこの解決は変わらない。
   */
  get currentLang(): string {
    const own = this.getAttribute("lang");
    const option = this.#ownAppOption()?.lang;
    const fromFile = this.#readAppData()?.lang;
    const lang =
      own ||
      (typeof option === "string" && option) ||
      (typeof fromFile === "string" && fromFile) ||
      browserLanguage() ||
      "en";
    return normalizeLang(lang);
  }

  // ---- メソッド----

  /** 多言語の文字列から currentLang の値を選ぶ（旧 MaplatUi.translate。HTMLElement.translate と衝突させない）。 */
  translateText(fragment?: Localized): string | undefined {
    return pickLocalized(fragment, this.currentLang);
  }

  /** UI の文言（旧 MaplatUi.t。言語ファイルを読み終えるまでは内蔵の辞書を使う）。 */
  t(key: string, option?: object): string {
    return translateKey(
      this.currentLang,
      key,
      option as Record<string, unknown> | undefined,
      this.#strings ?? undefined
    );
  }

  /** POI の吹き出しを id で開く（旧 handleMarkerActionById）。地図の準備前・見つからないときは何もしない。 */
  openMarker(id: string): void {
    const app = this.#app;
    if (!app || !this.#appReady) return;
    let datum: MaplatPoi | undefined;
    try {
      datum = app.getMarker(id);
    } catch {
      datum = undefined;
    }
    if (datum) this.#openPoi(datum);
  }

  /**
   * 枠線の表示を切り替える（旧 setShowBorder）。層 A の状態に拡張キー showBorder（1/0）として載せ
   * （restoreSession の localStorage・updateState に乗る）、層 A の setEnvelopes で地図の範囲を描く
   * （supports("envelopes") が偽の層 A では何も描かない）。状態 URL の sb にも書く。地図の準備前は何もしない。
   */
  setShowBorder(flag: boolean): void {
    if (!this.#app || !this.#appReady) return;
    this.#showBorder = !!flag;
    // 枠線の表示中だけ、スライダーの範囲を持つ地図のカードに枠を出す（旧 .show-border のスライドの枠）
    this.#baseSlider?.setShowBorder(this.#showBorder);
    this.#overlaySlider?.setShowBorder(this.#showBorder);
    this.#call("requestUpdateState", app =>
      app.requestUpdateState({ showBorder: flag ? 1 : 0 })
    );
    this.#updateEnvelope();
    this.#renderBorderButton();
    this.#updateUrl();
  }

  /**
   * 指定した経緯度に重なる（範囲を持つ）地図の mapID を、範囲の狭い順に返す（旧 ui_marker.ts の
   * xyToMapIDs）。層 A の公開面だけで求める: 画面の 4 隅（getViewExtent）と各地図の範囲
   * （getMapEnvelope）を経緯度で比べる（old は merc と turf を使っていた）。
   * 今の地図は候補から外し、範囲の面積が画面の面積の threshold 倍以上の地図は外す（旧と同じ既定 10）。
   * 地図の準備前は空の配列。
   */
  async mapsAt(point: LngLat, threshold = 10): Promise<string[]> {
    const app = this.#app;
    if (!app || !this.#appReady || !point) return [];
    const view = this.#safeCall(() => app.getViewExtent());
    const viewArea =
      Array.isArray(view) && view.length >= 3 ? polygonArea(view) : 0;
    const current = app.currentMapId ?? this.#currentMapId;
    const found: { mapID: string; area: number }[] = [];
    for (const item of this.#maps) {
      if (!item.hasEnvelope) continue;
      if (item.mapID === current) continue;
      const envelope = this.#safeCall(() => app.getMapEnvelope(item.mapID));
      if (!Array.isArray(envelope) || envelope.length < 3) continue;
      if (!pointInPolygon(point, envelope)) continue;
      const area = polygonArea(envelope);
      // 旧: envelopeAreaIndex / areaIndex < threshold（画面の面積が取れないときは通さない）
      if (!(viewArea > 0 && area / viewArea < threshold)) continue;
      found.push({ mapID: item.mapID, area });
    }
    found.sort((a, b) => a.area - b.area);
    return found.map(f => f.mapID);
  }

  /** 公開面のメソッドを呼び、失敗したら undefined（mapsAt の補助）。 */
  #safeCall<T>(fn: () => T): T | undefined {
    try {
      return fn();
    } catch (err) {
      console.warn(`<${MAPLAT_UI_TAG}>: mapsAt failed`, err);
      return undefined;
    }
  }

  /**
   * マーカーの表示を切り替える（旧 setHideMarker）。層 A の hideAllMarkers / showAllMarkers を呼ぶ
   * （層 A が同じ値を状態の hideMarker に書くので、restoreSession・updateState・状態 URL の hm に乗る）。
   * 地図の準備前は何もしない。
   */
  setHideMarker(flag: boolean): void {
    if (!this.#app || !this.#appReady) return;
    this.#hideMarker = !!flag;
    if (flag) this.#call("hideAllMarkers", app => app.hideAllMarkers());
    else this.#call("showAllMarkers", app => app.showAllMarkers());
    this.#renderHideMarkerButton();
    this.#updateUrl();
  }

  /**
   * 共有する URL（旧 getShareUrl と同じ）。"view" は今の表示の URL（state-url なら状態を書いてから読む）、
   * "app" は ? と # を落としたアプリの URL。
   */
  getShareUrl(type: ShareUrlType): string {
    if (type === "view") this.#updateUrl();
    return shareUrlOf(
      type,
      typeof location !== "undefined" ? location.href : ""
    );
  }

  /**
   * 短い知らせを出す（旧 showToast。旧は document.body に置いていた。ここでは Shadow DOM の中に置く）。
   * target を渡すとその近く（.recipient の囲みがあればその中央）に、無ければ下の中央に 1.5 秒出す。
   */
  showToast(message: string, target?: HTMLElement): void {
    const toast = this.#el.toast;
    toast.textContent = String(message);
    const anchor =
      target && typeof target.getBoundingClientRect === "function"
        ? ((target.closest?.(".recipient") as HTMLElement | null) ?? target)
        : null;
    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      toast.style.left = `${rect.left + rect.width / 2}px`;
      toast.style.top = `${rect.top + rect.height / 2}px`;
      toast.style.bottom = "auto";
      toast.style.transform = "translate(-50%, -50%)";
    } else {
      toast.style.left = "50%";
      toast.style.top = "auto";
      toast.style.bottom = "30px";
      toast.style.transform = "translateX(-50%)";
    }
    toast.classList.add("show");
    if (this.#toastTimer) clearTimeout(this.#toastTimer);
    this.#toastTimer = setTimeout(() => {
      this.#toastTimer = undefined;
      toast.classList.remove("show");
    }, 1500);
  }

  // ---- 旧 UI の互換層（src/legacy/）のための口（移行期だけ）----
  //
  // ここから下はすべて @internal。層 B の公開面（公開の 8 メソッド）には数えない。
  // 旧 API（MaplatUi）の外形を保つために、互換層が要素の部品へ委譲するだけの口を置く。
  // 旧 API は 1.x の間ずっと残す（メジャー版まで）ので、この口も残す。

  /**
   * 言語ファイルの読み込みが済むまで待つ。
   * @internal 旧 UI の onUiConfigure は i18n を読んでから利用者の hook を呼んでいた
   *   （`docs/ui-core-lifecycle.md` の「What Maplat UI does per phase」を参照）。
   *   互換層はこの口を待ってから hook を呼ぶ。読み込みに失敗しても reject しない（en へ落ちる）。
   */
  whenI18nReady(): Promise<void> {
    return this.#ensureLanguage();
  }

  /** @internal 状態 URL を今の状態で書き直す（旧 MaplatUi.updateUrl）。 */
  refreshStateUrl(): void {
    this.#updateUrl();
  }

  /** @internal 枠線（envelope）を描き直す（旧 MaplatUi.updateEnvelope）。 */
  refreshEnvelopes(): void {
    this.#updateEnvelope();
  }

  /** @internal スライダーの見出しを詰め直す（旧 MaplatUi.ellips の移設先。`ellipsize` を呼ぶ）。 */
  refreshEllipsis(): void {
    this.#baseSlider?.refresh();
    this.#overlaySlider?.refresh();
  }

  /** @internal その地図がその行のスライダーにあるか（旧 checkOverlayID。overlay は重ねる地図の行）。 */
  hasMap(mapID: string, kind: "base" | "overlay" = "overlay"): boolean {
    return typeof mapID === "string" && mapID !== ""
      ? this.slider(kind)?.hasMap(mapID) === true
      : false;
  }

  /**
   * @internal 旧 API の `pwaWorker: false / null`（Service Worker を登録しない。manifest は足す）。
   *   互換層が起動前に呼ぶ。属性の `pwa-worker` には「登録しない」の値が無いので、移行期の口として置く。
   */
  disablePwaWorker(): void {
    this.#pwaNoWorker = true;
  }

  /**
   * @internal POI のメディアの表示部品（`@c4h/chuci` の `cc-swiper` 等）を先に読み込む。
   *   旧 UI は起動時に Chuci を静的に import して登録していた（旧 ui_marker.ts）。旧 API の利用者は
   *   起動の後に `cc-swiper` を自分のページで使えたので、互換層が起動時に呼ぶ（新 UI は最初のメディアで読む）。
   */
  preloadMediaViewer(): Promise<void> {
    return loadChuci();
  }

  /**
   * @internal 透過度のスライダーを使える・使えないにする（旧 `sliderNew.setEnable`。互換層が委譲する）。
   *   旧と同じく次の地図の切り替えで「重ね地図のときだけ使える」に戻る。
   */
  setTransparencyEnabled(flag: boolean): void {
    this.#el.slider.disabled = !flag;
  }

  /** @internal 地図の切り替えスライダー（旧 baseSwiper / overlaySwiper の facade が委譲する先）。 */
  slider(kind: "base" | "overlay"): MapSlider | null {
    return kind === "base" ? this.#baseSlider : this.#overlaySlider;
  }

  /** @internal 文言のキーが訳せるか（旧 i18n.exists の近似。キーのままなら訳が無い）。 */
  hasTranslation(key: string): boolean {
    return this.t(key) !== key;
  }

  /**
   * 旧 modalSetting(type) の名前で画面を開く。
   * @internal 旧 UI は 1 つのモーダルに class を付け替えていた。ここでは画面ごとの部品を開く。
   *   種類: load（スプラッシュ）・poi・share・help・map（地図情報）・marker_list・gpsD（範囲外）。
   *   地図の準備前は何もしない（旧は core-ready の後に配線していた）。
   */
  openModalByLegacyName(type: string): void {
    switch (type) {
      case "load":
        this.#showSplash();
        return;
      case "poi":
        if (this.#poi) this.#el.modal.hidden = false;
        return;
      case "share":
        this.#openShare();
        return;
      case "help":
        this.#openHelp();
        return;
      case "map":
        this.#openMapInfo();
        return;
      case "marker_list":
        this.#openMarkerList();
        return;
      case "gpsD":
        this.#showGpsModal(true);
        return;
      case "gpsW":
        this.#showGpsModal(false);
        return;
      default:
        this.#warnOnce(
          `modal:${type}`,
          `<${MAPLAT_UI_TAG}>: unknown legacy modal "${type}"; nothing was opened.`
        );
    }
  }

  // ---- 子の <maplat-app> ----

  #setup() {
    if (!this.isConnected) return;
    this.#start();
    const found = this.#findChild();
    if (found) {
      if (found !== this.#app || !this.#unsubscribe) this.#bind(found);
    } else {
      // 子が無ければ <maplat-app slot="map"> を自分の light DOM の子として作る。
      // 層 A のキーは繋ぐ前に流す（子は繋がった拍の後で作成を始めるので、同じ拍の値を取りこぼさない）
      const app = document.createElement(MAPLAT_APP_TAG) as MaplatAppElement;
      app.setAttribute("slot", "map");
      this.#bind(app);
      this.appendChild(app);
    }
    this.#startPwa();
  }

  /** 起動（最初の #setup）: 起動時だけ効く層 B のキーの値を取り、状態 URL の監視を始める。 */
  #start() {
    if (!this.#startup) {
      const snapshot = new Map<string, unknown>();
      for (const def of UI_ATTRS)
        if (def.startup) snapshot.set(def.prop, this.#parseOwnAttribute(def));
      this.#startup = snapshot;
      // appOption も起動時の値で固定する（層 B の appOption は起動時だけ効く）
      this.#startupAppOption = this.#props.get("appOption") as
        Record<string, unknown> | undefined;
    }
    if (
      this.#stateUrlOn() &&
      !this.#hashListener &&
      typeof window !== "undefined"
    ) {
      this.#hashListener = () => this.#onHashChange();
      window.addEventListener("hashchange", this.#hashListener);
    }
  }

  /** state-url が起動時に真だったか。 */
  #stateUrlOn(): boolean {
    return this.#startup?.get(ATTR_STATE_URL.prop) === true;
  }

  /**
   * 要素自身が読む appOption（層 B の appOption は起動時だけ効く）。
   * 起動後は起動時の値（起動前は与えられた値）を返す。起動後の代入は子へ流すだけで、
   * 層 B の読み（言語の解決・pwa-manifest の既定の appId・このプロパティの読み）には効かせない。
   */
  #ownAppOption(): Record<string, unknown> | undefined {
    if (this.#startup) return this.#startupAppOption;
    return this.#props.get("appOption") as Record<string, unknown> | undefined;
  }

  // ---- 操作ボタンの自動非表示（旧 src/index.ts:1070-1123 の setMapOnOff）----

  /**
   * 自動非表示の対象（旧 Core の setMapOnOff が隠す .ol-control 全部）。旧は透過度のスライダー・
   * 地図の切り替えのスワイパー・題名も .ol-control だった（旧 ui_init.ts:1486-1492）。
   */
  #controls(): HTMLElement[] {
    return Array.from(
      this.#root.querySelectorAll<HTMLElement>(
        ".ctl, .slider, .map-title, .map-slider"
      )
    );
  }

  #setFade(on: boolean) {
    for (const control of this.#controls())
      control.classList.toggle("fade", on);
  }

  #clearFadeTimer() {
    if (!this.#fadeTimer) return;
    clearTimeout(this.#fadeTimer);
    this.#fadeTimer = undefined;
  }

  /** tap-duration の後にボタンを戻す（旧 moveend の setTimeout）。 */
  #scheduleFade() {
    this.#clearFadeTimer();
    this.#fadeTimer = setTimeout(() => {
      this.#fadeTimer = undefined;
      this.#setFade(false);
    }, this.#tapDuration());
  }

  /**
   * 地図のクリック（旧 mapObject の click）。表示中ならすぐ戻し、隠れていれば tapUIVanish のときだけ
   * 隠して tap-duration の後に戻す（旧と同じ分岐）。
   */
  #onMapClick() {
    this.#clearFadeTimer();
    const controls = this.#controls();
    const hasFade =
      controls.length > 0 && controls[0].classList.contains("fade");
    if (!this.#tapUiVanish() || hasFade) {
      this.#setFade(false);
      return;
    }
    this.#setFade(true);
    this.#scheduleFade();
  }

  /**
   * tap-duration（属性 → 3000。0 も有効）。
   * 要素（新インタフェース）は設定ファイルの機能系キーを読まない
   * （`tapDuration`・`tapUIVanish` が名指しされている）。旧クラスだけが設定ファイルを読む。
   */
  #tapDuration(): number {
    const own = this.#parseOwnAttribute(ATTR_TAP_DURATION);
    if (typeof own === "number" && Number.isFinite(own) && own >= 0) return own;
    return 3000;
  }

  /**
   * tap-ui-vanish（属性 → false。旧名 tapUIVanish）。
   * 設定ファイルの `tapUIVanish` は読まない（上の `#tapDuration` の注釈と同じ）。
   */
  #tapUiVanish(): boolean {
    const own = this.#parseOwnAttribute(ATTR_TAP_UI_VANISH);
    return typeof own === "boolean" ? own : false;
  }

  /**
   * スプラッシュ（旧 initSplash）。旧と同じく、起動時に復元する地図（initialRestore.mapID。
   * 状態 URL・restore・map-id で決まったものを含む）が無いときだけ出す。題名は appName、
   * 設定ファイルの splash があれば img/ の下の画像を出す（無ければ読み込み中の文言だけ）。
   * 表示は旧と同じく、画像ありは 1000 ms・無しは 200 ms で隠す。
   */
  #showSplash() {
    if (this.#splashShown) return;
    this.#splashShown = true;
    const app = this.#app;
    if (app) {
      try {
        if (app.initialRestore?.mapID) return;
      } catch {
        // 読めない実装では出さない判断はせず、そのまま出す（旧と同じ既定）
      }
    }
    const data = this.#readAppData();
    const el = this.#el;
    el.splashTitle.textContent =
      this.translateText(data?.appName as Localized | undefined) || "";
    const splash = typeof data?.splash === "string" ? data.splash : "";
    const src =
      splash !== ""
        ? safeImageUrl(resolveRelativeLink(splash, "img"))
        : undefined;
    if (src !== undefined) {
      el.splashImg.src = src;
      el.splashImage.hidden = false;
    } else {
      el.splashImg.removeAttribute("src");
      el.splashImage.hidden = true;
    }
    el.splash.hidden = false;
    this.#splashDue = false;
    if (this.#splashTimer) clearTimeout(this.#splashTimer);
    this.#splashTimer = setTimeout(
      () => {
        this.#splashTimer = undefined;
        // 旧と同じく、地図の準備ができてから隠す（旧 ui_init.ts:501 の splashPromise.then は
        // initSwipers の中＝準備の後）。時間だけ先に来たら印を立てて #onAppReady で隠す
        if (!this.#appReady) {
          this.#splashDue = true;
          return;
        }
        el.splash.hidden = true;
      },
      src !== undefined ? 1000 : 200
    );
  }

  /**
   * PWA を有効にする（pwa-manifest が起動時に与えられていたら 1 回だけ。旧 initPwa）。
   * pwa-manifest が true なら既定のパス ./pwa/${appId}_manifest.json（appId は子の app-id ＞ appOption ＞ "sample"）。
   */
  #startPwa() {
    if (this.#pwaStarted || !this.#startup) return;
    const manifest = this.#startup.get(ATTR_PWA_MANIFEST.prop);
    if (manifest === undefined || manifest === false) return;
    this.#pwaStarted = true;
    let url: string;
    if (manifest === true) {
      const option = this.#ownAppOption();
      const appId =
        this.#app?.appId ??
        // 子の登録の前（公開面がまだ無い）でも属性は読める
        this.#app?.getAttribute("app-id") ??
        (typeof option?.appid === "string" ? option.appid : undefined) ??
        (typeof option?.appId === "string" ? option.appId : undefined) ??
        "sample";
      url = `./pwa/${appId}_manifest.json`;
    } else {
      url = String(manifest);
    }
    void initPwa({
      manifest: url,
      worker: this.#pwaNoWorker
        ? null
        : (this.#startup.get(ATTR_PWA_WORKER.prop) as string | undefined),
      scope: this.#startup.get(ATTR_PWA_SCOPE.prop) as string | undefined
    });
  }

  #findChild(): MaplatAppElement | null {
    for (const child of Array.from(this.children)) {
      if (
        child.localName === MAPLAT_APP_TAG &&
        child.getAttribute("slot") === "map"
      )
        return child as MaplatAppElement;
    }
    return null;
  }

  #bind(app: MaplatAppElement) {
    this.#detach();
    const generation = ++this.#generation;
    this.#app = app;
    // 層 B が流したキーは子ごとに覚える（繋ぎ直したときに、前に流したキーを「子が自分で持つキー」と取り違えない）
    let flowed = FLOWED_BY_CHILD.get(app);
    if (!flowed) {
      flowed = new Set();
      FLOWED_BY_CHILD.set(app, flowed);
    }
    this.#flowed = flowed;
    // 子が自分で持つ状態のキー（map-id 等）は最初に繋いだ時点で決める（後から子が書き戻した属性は含めない）
    if (!OWNED_STATE_BY_CHILD.has(app)) {
      OWNED_STATE_BY_CHILD.set(
        app,
        new Set(
          LAYER_A_STATE_ATTRS.filter(d => app.hasAttribute(d.attr)).map(
            d => d.prop
          )
        )
      );
    }
    this.#appReady = false;
    this.#maps = [];
    this.#mapColors.clear();
    this.#currentMapId = null;
    this.#lastOldMapId = null;
    this.#currentMeta = null;
    this.#viewpoint = null;
    this.#pathThatSet = undefined;
    // 状態 URL: 子へ流す復元値を今の URL から読む（URL は restore より強い。旧 index.ts:158-160）
    this.#urlRestore = this.#stateUrlOn()
      ? parseStateHash(typeof location !== "undefined" ? location.hash : "")
      : null;
    this.#urlRestoreLate = false;
    // 状態 URL は起動時の map-id・transparency より強い（人間の決定「属性への書き戻し」）。起動後は子が実際の
    // 地図・透過度を自分の属性へ書き戻し、層 B が流しているキーなら層 B の属性へも映す（#mirrorChildState）
    this.#urlOverrides = new Map();
    if (this.#urlRestore) {
      if (typeof this.#urlRestore.mapID === "string")
        this.#urlOverrides.set("mapId", this.#urlRestore.mapID);
      if (typeof this.#urlRestore.transparency === "number")
        this.#urlOverrides.set("transparency", this.#urlRestore.transparency);
    }
    if (this.#ready.settled) this.#ready = deferred();
    const ready = this.#ready;
    this.#flowAll();
    // 地図の準備を待つ間に言語ファイルを読み始める（読み終えるまでは内蔵の辞書で描く）
    void this.#reloadLang();

    const handlers: Array<[string, (evt: Event) => void]> =
      SUBSCRIBED_EVENTS.map(type => [
        type,
        (evt: Event) => {
          if (generation !== this.#generation) return;
          this.#onAppEvent(type, (evt as CustomEvent).detail);
        }
      ]);
    for (const [type, handler] of handlers) app.addEventListener(type, handler);
    // 子の要素そのものの pointerdown（子の中身には触れない）: 選択メニューの位置を覚える。
    // メニューが開いていれば閉じ、その押下は地図へ渡さない（旧 showContextMenu と同じ）
    const onPointerDown = (evt: Event) => {
      if (generation !== this.#generation) return;
      const pe = evt as PointerEvent;
      this.#lastPointer = { clientX: pe.clientX, clientY: pe.clientY };
      if (!this.#el.poiMenu.hidden) {
        this.#closeMenu();
        evt.stopPropagation();
      }
    };
    app.addEventListener("pointerdown", onPointerDown, true);
    // ---- 操作ボタンの自動非表示（旧 src/index.ts:1070-1123 の setMapOnOff）----
    // 旧は OL の click / pointerdrag / moveend を見ていた。層 B は地図（子の要素）の DOM の click と
    // pointerdown/pointermove（ドラッグ）と、層 A の moveEnd で知る。
    let dragStart: { x: number; y: number } | null = null;
    // ドラッグと判定したか。実ブラウザはマウスのドラッグの後にも DOM の click を出すが、旧 OL の click は
    // 出ないので、ドラッグの後の click では戻さない（moveEnd が tap-duration の後に戻す）
    let dragged = false;
    const onMapPointerDown = (evt: Event) => {
      if (generation !== this.#generation) return;
      const pe = evt as PointerEvent;
      if (pe.pointerType === "mouse" && pe.button !== 0) return;
      dragged = false;
      dragStart = { x: pe.clientX, y: pe.clientY };
    };
    const onMapPointerMove = (evt: Event) => {
      if (generation !== this.#generation || !dragStart) return;
      const pe = evt as PointerEvent;
      if (Math.hypot(pe.clientX - dragStart.x, pe.clientY - dragStart.y) < 4)
        return;
      // 旧 pointerdrag: タイマーを止めて、フェードさせる（止まったら moveEnd が戻す）
      dragged = true;
      this.#clearFadeTimer();
      this.#setFade(true);
    };
    const onMapPointerUp = () => {
      dragStart = null;
      // ドラッグとみなしたら、地図が動かず moveEnd が来ない場合でも tap-duration の後に戻す
      // （moveEnd が来れば #scheduleFade が張り直すので、旧の「moveEnd の後」の挙動は保たれる。n2）
      if (dragged) this.#scheduleFade();
    };
    const onMapClick = () => {
      if (generation !== this.#generation) return;
      // ドラッグの後に実ブラウザが出す click では戻さない（戻すのは moveEnd の tap-duration の後）
      if (dragged) return;
      this.#onMapClick();
    };
    app.addEventListener("pointerdown", onMapPointerDown, true);
    app.addEventListener("pointermove", onMapPointerMove, true);
    app.addEventListener("pointerup", onMapPointerUp, true);
    app.addEventListener("pointercancel", onMapPointerUp, true);
    app.addEventListener("click", onMapClick);
    // 子が書き戻した状態（map-id・transparency・display-mode）を、層 B が流しているキーなら層 B の属性へも映す
    // （内部の操作の後に <maplat-ui> の属性が古い値のまま残らないように）
    const observer =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(() => {
            if (generation !== this.#generation) return;
            this.#mirrorChildState(app);
          })
        : null;
    observer?.observe(app, {
      attributes: true,
      attributeFilter: LAYER_A_STATE_ATTRS.map(d => d.attr)
    });
    this.#unsubscribe = () => {
      for (const [type, handler] of handlers)
        app.removeEventListener(type, handler);
      app.removeEventListener("pointerdown", onPointerDown, true);
      app.removeEventListener("pointerdown", onMapPointerDown, true);
      app.removeEventListener("pointermove", onMapPointerMove, true);
      app.removeEventListener("pointerup", onMapPointerUp, true);
      app.removeEventListener("pointercancel", onMapPointerUp, true);
      app.removeEventListener("click", onMapClick);
      this.#clearFadeTimer();
      observer?.disconnect();
    };

    this.#waitAppReady(app, generation).then(
      async ok => {
        if (!ok || generation !== this.#generation) return;
        // 言語ファイルを読み終えてから描く（読み込み中に言語が変わっていたら、最新の言語で読み直す）
        await this.#ensureLanguage();
        if (generation !== this.#generation) return;
        this.#onAppReady(app);
        ready.resolve();
        this.dispatchEvent(
          new CustomEvent("uiReady", {
            bubbles: true,
            composed: false,
            detail: {}
          })
        );
      },
      (err: unknown) => {
        if (generation !== this.#generation) return;
        ready.reject(err);
      }
    );
  }

  /**
   * 子の地図の準備を待つ（公開面の ready だけで判定する）。子の ready は破棄が決まった時点で新しい
   * Promise に替わるので、繋ぎ直した直後に読んでも前の解決済みの Promise は掴まない。
   * @returns 待ちの途中で外された・作り直されたら false
   */
  async #waitAppReady(
    app: MaplatAppElement,
    generation: number
  ): Promise<boolean> {
    // 登録の前の子は ready を持たない
    if (typeof customElements !== "undefined")
      await customElements.whenDefined(MAPLAT_APP_TAG);
    if (generation !== this.#generation) return false;
    await app.ready;
    return generation === this.#generation;
  }

  #detach() {
    this.#generation++;
    // 読み込み中の言語ファイルの結果で、外した後の UI を描き直さない
    this.#localeGeneration++;
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#appReady = false;
    this.#pendingMarker = null;
    // キャッシュの統計の読み取り・進捗の描画を止める（古い子の値を書き戻さない）
    this.#cacheGeneration++;
    this.#cacheFetchToken++;
    this.#cacheFetching = false;
    this.#cacheFetchingMapId = null;
    this.#cacheStats = undefined;
    if (this.#cacheFrame) {
      cancelAnimationFrame(this.#cacheFrame);
      this.#cacheFrame = 0;
    }
    this.#closeMenu();
    this.#closeMarkerList();
    this.#closeMapInfo();
    this.#closePoi();
    this.#closeShare();
    this.#closeHelp();
    this.#closeGpsModal();
    this.#lastGpsError = undefined;
    this.#clearFadeTimer();
    if (this.#splashTimer) {
      clearTimeout(this.#splashTimer);
      this.#splashTimer = undefined;
    }
    this.#splashDue = false;
    this.#el.splash.hidden = true;
    this.#splashShown = false;
  }

  // ---- 層 A のキーの流し方----

  #flowAll() {
    for (const def of LAYER_A_ATTRS) this.#flowKey(def.prop);
    for (const def of LAYER_A_PROPS) this.#flowKey(def.prop);
  }

  /**
   * 子が自分で持つキーか（子に属性で書かれた・子のプロパティが undefined でない）。状態のキー（map-id 等）は
   * 子が内部の操作の結果を自分の属性へ書き戻すので、最初に繋いだ時点で子に書かれていたかで決める。
   */
  #childOwns(app: MaplatAppElement, prop: string): boolean {
    const def = LAYER_A_ATTR_BY_PROP.get(prop);
    if (def?.state) {
      const owned = OWNED_STATE_BY_CHILD.get(app);
      return owned ? owned.has(prop) : app.hasAttribute(def.attr);
    }
    if (def) return app.hasAttribute(def.attr);
    return (app as unknown as Record<string, unknown>)[prop] !== undefined;
  }

  /** 子が書き戻した状態を、層 B が流しているキーに限り層 B の属性へ映す（流し直さない）。 */
  #mirrorChildState(app: MaplatAppElement) {
    for (const def of LAYER_A_STATE_ATTRS) {
      // 層 B が流しているキーだけ（子が自分で持つキー・層 B に書かれていないキーには触れない）
      if (!this.#flowed.has(def.prop) || !this.hasAttribute(def.attr)) continue;
      const value = app.getAttribute(def.attr);
      if (value === null || value === this.getAttribute(def.attr)) continue;
      this.#reflecting = true;
      try {
        this.setAttribute(def.attr, value);
      } finally {
        this.#reflecting = false;
      }
    }
  }

  /**
   * 層 B に与えられた値。restore は状態 URL の復元値があればそれ（URL が restore より強い。旧と同じく丸ごと
   * 置き換える）、層 B の拡張キーを除く。restoreExtensionKeys は層 B の拡張キー showBorder を足す
   * （restoreSession の localStorage から層 A が読む）。
   */
  #layerAValue(prop: string): unknown {
    const def = LAYER_A_ATTR_BY_PROP.get(prop);
    if (def) return this.#parseOwnAttribute(def);
    const value = this.#props.get(prop);
    if (prop === "restore") {
      const source = this.#urlRestore ?? value;
      if (!source || typeof source !== "object") return undefined;
      const restore: Restore = { ...(source as Restore) };
      for (const key of LAYER_B_RESTORE_KEYS) delete restore[key];
      return Object.keys(restore).length > 0 ? restore : undefined;
    }
    if (prop === "restoreExtensionKeys") {
      const own = Array.isArray(value)
        ? (value as unknown[]).filter((k): k is string => typeof k === "string")
        : [];
      return own.includes("showBorder") ? own : [...own, "showBorder"];
    }
    return value;
  }

  #flowKey(prop: string) {
    const app = this.#app;
    if (!app) return;
    const def = LAYER_A_ATTR_BY_PROP.get(prop);
    if (def && this.#urlOverrides.has(prop)) {
      // 状態 URL の値（起動時のみ。map-id・transparency より強い）。子が自分で持つキーなら ready の後に当てる
      if (!this.#flowed.has(prop) && this.#childOwns(app, prop)) {
        this.#urlRestoreLate = true;
        return;
      }
      // 層 B に書かれたキーのときだけ「層 B が流したキー」にする（書かれていなければ、後で外すことも無い）
      if (this.#parseOwnAttribute(def) !== undefined) this.#flowed.add(prop);
      const text = formatAttributeValue(def, this.#urlOverrides.get(prop));
      if (text != null && app.getAttribute(def.attr) !== text)
        app.setAttribute(def.attr, text);
      return;
    }
    // 近い方が勝つ: 子が自分で持つキー（層 B が流したものでない）には触れない
    if (!this.#flowed.has(prop) && this.#childOwns(app, prop)) {
      // 状態 URL は restore より強いので、子が restore を持つなら ready の後に当てる
      if (prop === "restore" && this.#urlRestore) this.#urlRestoreLate = true;
      return;
    }
    const value = this.#layerAValue(prop);
    if (value === undefined) {
      if (!this.#flowed.has(prop)) return;
      this.#flowed.delete(prop);
      if (def) app.removeAttribute(def.attr);
      else (app as unknown as Record<string, unknown>)[prop] = null;
      return;
    }
    this.#flowed.add(prop);
    if (def) {
      // 属性で表せるキーは属性で流す（子の「プロパティ ＞ 属性」を崩さない）
      const text = formatAttributeValue(def, value);
      if (text == null) app.removeAttribute(def.attr);
      else if (app.getAttribute(def.attr) !== text)
        app.setAttribute(def.attr, text);
    } else {
      (app as unknown as Record<string, unknown>)[prop] = value;
      // 子の作成が先に始まっていたら restore は受け取られない（起動時のみのキー）。状態 URL なら ready の後に当てる
      if (
        prop === "restore" &&
        this.#urlRestore &&
        (app as unknown as Record<string, unknown>).restore !== value
      )
        this.#urlRestoreLate = true;
    }
  }

  // ---- 層 A のイベント ----

  #onAppEvent(type: string, detail: unknown) {
    switch (type) {
      case "lifecycle:appdata-ready":
        this.#showSplash();
        // 設定ファイルの lang が決まった時点で読み直す（読み終えてから描く）
        void this.#reloadLang();
        this.#applyDocumentTitle();
        break;
      case "mapChanged":
        this.#currentMapId = (detail as MapMeta | undefined)?.mapID ?? null;
        this.#rememberOldMap(this.#currentMapId);
        this.#currentMeta = (detail as MapMeta | undefined) ?? null;
        this.#renderTitle();
        this.#syncSliders();
        this.#renderSlider();
        // 地図の POI レイヤーは地図ごとに替わる（旧 UI は一覧を地図ごとに作り直す）。閉じるのは
        // POI の重なりのメニューだけ: 旧 API の showContextMenu の汎用メニューは、旧 UI でも地図の
        // 切り替えでは閉じなかった（閉じるのは地図の pointerdown。旧 ui_marker.ts の closeMenuHandler）
        if (this.#poiMenuList.length > 0) this.#closeMenu();
        if (this.#appReady) this.#countPois();
        if (!this.#el.markerList.hidden) this.#renderMarkerList();
        // 枠線の塗りは現在の地図の範囲だけ（旧 updateEnvelope の isActive）。地図情報も今の地図で描き直す
        this.#updateEnvelope();
        if (!this.#el.info.hidden) this.#renderMapInfo();
        this.#updateUrl();
        break;
      case "changeViewpoint":
        if (detail && typeof detail === "object")
          this.#viewpoint = { ...(detail as Viewpoint) };
        this.#renderCompass();
        break;
      case "gpsEnabledChanged":
        this.#renderGps(
          !!(detail as { enabled?: boolean } | undefined)?.enabled
        );
        break;
      case "updateState": {
        const state =
          detail && typeof detail === "object"
            ? (detail as { transparency?: unknown; hideMarker?: unknown })
            : undefined;
        const transparency = state?.transparency;
        if (typeof transparency === "number" && !this.#sliderDragging) {
          this.#el.slider.value = `${100 - transparency}`;
        }
        // マーカーの非表示は層 A の状態が真実（hideAllMarkers / showAllMarkers が書く）
        if (typeof state?.hideMarker === "number") {
          this.#hideMarker = state.hideMarker !== 0;
          this.#renderHideMarkerButton();
        }
        this.#updateUrl();
        break;
      }
      case "outOfMap":
        // 旧 initGpsHandlers: presentation-mode が真なら出さない（enableOutOfMap）
        if (this.#parseOwnAttribute(ATTR_PRESENTATION_MODE) !== true)
          this.#showGpsModal(true);
        break;
      case "gps_error":
        this.#showGpsModal(
          false,
          typeof detail === "string" ? detail : undefined
        );
        break;
      case "gps_result": {
        const error =
          detail && typeof detail === "object"
            ? (detail as { error?: unknown }).error
            : undefined;
        if (typeof error !== "string") {
          this.#lastGpsError = undefined;
          break;
        }
        if (error === "gps_off") {
          this.#lastGpsError = undefined;
          break;
        }
        if (error === "gps_out_hide") {
          // 層 A の契約（element_contract.ts の gps_result）: always-gps-on の範囲外。
          // モーダルは出さず、GPS のボタンで出し直せるよう「範囲外」としてだけ覚えておく
          this.#lastGpsError = "gps_out";
          break;
        }
        this.#lastGpsError = error;
        // 旧と同じ: always-gps-on のときの gps_out は黙って戻る（モーダルを出さない）
        if (this.#app?.alwaysGpsOn === true && error === "gps_out") break;
        if (error === "gps_out") this.#showGpsModal(true);
        else this.#showGpsModal(false, error);
        break;
      }
      case "moveEnd":
        // 視点の連続変化が止まったら URL を書く（旧 mapObject の moveend）
        if (detail && typeof detail === "object")
          this.#viewpoint = { ...(detail as Viewpoint) };
        this.#updateUrl();
        // 視点が止まったら、旧 moveend と同じく tap-duration の後にボタンを戻す
        this.#clearFadeTimer();
        this.#scheduleFade();
        break;
      case "clickMarker": {
        // 実装は clickMarker に続けて同じ拍で clickMarkers（重なる全部）を出す。clickMarkers が来なければ
        // （clickMarker だけを出す実装）単独で開く
        if (!detail || typeof detail !== "object") break;
        const datum = detail as MaplatAppEventDetailMap["clickMarker"];
        this.#pendingMarker = datum;
        queueMicrotask(() => {
          if (this.#pendingMarker !== datum) return;
          this.#pendingMarker = null;
          this.#openPoi(datum);
        });
        break;
      }
      case "clickMarkers": {
        this.#pendingMarker = null;
        const list = Array.isArray(detail)
          ? (detail as unknown[]).filter(
              (d): d is MaplatPoi => !!d && typeof d === "object"
            )
          : [];
        // 1 件なら吹き出し、複数なら選択メニュー（旧 ui_init.ts の clickMarkers の処理）
        if (list.length === 1) this.#openPoi(list[0]);
        else if (list.length > 1) this.#openPoiMenu(list);
        break;
      }
      case "poi_number":
        if (typeof detail === "number") {
          this.#poiCount = detail;
          this.#renderMarkerListButton();
        }
        break;
      default:
        break;
    }
  }

  #onAppReady(app: MaplatAppElement) {
    this.#appReady = true;
    // 状態 URL が map-id・transparency より強いのは起動時だけ（以後は層 B の属性の変更をそのまま流す）
    this.#urlOverrides.clear();
    // 起動した地図・透過度（状態 URL で決まったものを含む）を、層 B が流しているキーなら層 B の属性へも映す
    // （繋ぐ前に流した値・子の書き戻しは監視を始める前のこともある）
    this.#mirrorChildState(app);
    try {
      this.#maps = app.listMaps();
    } catch {
      this.#maps = [];
    }
    this.#assignEnvelopeColors();
    this.#currentMapId = app.currentMapId ?? this.#currentMapId;
    this.#rememberOldMap(this.#currentMapId);
    if (
      this.#currentMapId &&
      (!this.#currentMeta || this.#currentMeta.mapID !== this.#currentMapId)
    ) {
      try {
        this.#currentMeta = app.getMapMeta(this.#currentMapId) ?? null;
      } catch {
        this.#currentMeta = null;
      }
    }
    this.#viewpoint = app.viewpoint ?? this.#viewpoint;
    this.#el.title.hidden = false;
    this.#renderMaps();
    this.#logAppEnvelope();
    this.#renderTitle();
    this.#renderSlider();
    this.#renderGps(app.gpsEnabled);
    this.#renderCompass();
    this.#countPois();
    this.#renderShareButton();
    this.#renderInfoButton();
    this.#renderBorderButton();
    this.#renderHideMarkerButton();
    this.#applyLang();
    this.#applyDocumentTitle();
    this.#applyStartupState(app);
    // スプラッシュの時間が先に来ていたら、準備ができたここで隠す（旧と同じ順序）
    if (this.#splashDue) {
      this.#splashDue = false;
      this.#el.splash.hidden = true;
    }
  }

  /**
   * 起動時の状態を当てる（旧 initUiFromAppData の restore・restoreSession の分岐と、状態 URL の 2 回目以降の経路）。
   *   - 状態 URL を子の restore で渡せなかったら（子が restore を持つ・子の作成が先に始まっていた）changeMap で当てる
   *   - 層 B の拡張キー: restore（状態 URL を含む）が与えられていればその showBorder・hideMarker・openedMarker、
   *     無ければ restoreSession の localStorage の showBorder・hideMarker（層 A が restoreExtensionKeys で読んだ
   *     initialRestore。hideMarker は層 A の initialRestore に元から載る）
   * 2 回目以降（子を繋ぎ直した）は今の showBorder・hideMarker を新しい子に載せ直すだけ。
   */
  #applyStartupState(app: MaplatAppElement) {
    const generation = this.#generation;
    let showBorder = this.#showBorder;
    let hideMarker = this.#hideMarker;
    let opened: string | undefined;
    if (!this.#startupStateApplied) {
      this.#startupStateApplied = true;
      const given = (this.#urlRestore ?? this.#props.get("restore")) as
        Restore | undefined;
      if (given && typeof given === "object") {
        showBorder = !!given.showBorder;
        hideMarker = !!given.hideMarker;
        if (typeof given.openedMarker === "string" && given.openedMarker)
          opened = given.openedMarker;
      } else if (app.restoreSession === true) {
        const saved = this.#readInitialRestore(app);
        showBorder = !!parseInt(String(saved.showBorder ?? "0"), 10);
        hideMarker = !!parseInt(String(saved.hideMarker ?? "0"), 10);
      } else {
        showBorder = false;
        hideMarker = false;
      }
    }
    const finish = () => {
      if (generation !== this.#generation) return;
      this.setShowBorder(showBorder);
      // 隠すとき・隠れていたのを戻すときだけ呼ぶ（新しく繋いだ子は既定でマーカーを表示している）
      if (hideMarker || this.#hideMarker) this.setHideMarker(hideMarker);
      if (opened) this.openMarker(opened);
      this.#updateUrl();
    };
    const late = this.#urlRestore;
    if (late && this.#urlRestoreLate && late.mapID) {
      this.#urlRestoreLate = false;
      this.#applyUrlRestore(late, finish);
    } else {
      finish();
    }
  }

  /** URL から読んだ復元値を changeMap で当てる（旧 index.ts の 2 回目以降の経路）。当てている間は URL を書かない。 */
  #applyUrlRestore(restore: Restore, then?: () => void) {
    const app = this.#app;
    const mapID = restore.mapID;
    if (!app || !mapID) return;
    const generation = this.#generation;
    const layerA: Restore = { ...restore };
    for (const key of LAYER_B_RESTORE_KEYS) delete layerA[key];
    this.#restoring = true;
    Promise.resolve(app.ready)
      .then(() => app.changeMap(mapID, layerA))
      .catch((err: unknown) =>
        console.warn(`<${MAPLAT_UI_TAG}>: failed to restore the state URL`, err)
      )
      .finally(() => {
        if (generation !== this.#generation) return;
        this.#restoring = false;
        if (then) then();
        else this.#updateUrl();
      });
  }

  /** URL の hash が変わった（戻る・進む・手で書き換えた）: 地図があればその状態へ移す（旧 page.js の処理）。 */
  #onHashChange() {
    if (!this.#stateUrlOn() || !this.#app || !this.#appReady) return;
    const restore = parseStateHash(location.hash);
    if (!restore) return;
    this.#pathThatSet = undefined;
    this.#applyUrlRestore(restore);
  }

  /**
   * 今の状態を URL の "#!" の後ろに書く（旧 updateUrl。state-url のときだけ）。地図・背景地図・透過度は層 A の
   * state、視点は viewpoint（x・y・zoom・rotation）、枠線・開いた POI は層 B の状態から。
   * 履歴は増やさない（history.replaceState。旧 page.js は pushState だった）。
   */
  #updateUrl() {
    if (!this.#stateUrlOn() || this.#restoring) return;
    const app = this.#app;
    if (!app || !this.#appReady || typeof location === "undefined") return;
    const mapID = app.currentMapId ?? this.#currentMapId;
    if (!mapID) return;
    let state: Readonly<Restore>;
    try {
      state = app.state ?? {};
    } catch {
      state = {};
    }
    const vp = app.viewpoint ?? this.#viewpoint;
    const transparency =
      typeof state.transparency === "number"
        ? state.transparency
        : this.#readTransparency(app);
    const opened = this.#poi?.namespaceID;
    const path = buildStatePath({
      mapID,
      backgroundID:
        typeof state.backgroundID === "string" ? state.backgroundID : undefined,
      transparency,
      x: vp?.x,
      y: vp?.y,
      zoom: vp?.zoom,
      rotation: vp?.rotation,
      showBorder: this.#showBorder,
      hideMarker:
        typeof state.hideMarker === "number"
          ? state.hideMarker !== 0
          : this.#hideMarker,
      hideLayer:
        typeof state.hideLayer === "string" ? state.hideLayer : undefined,
      openedMarker: typeof opened === "string" ? opened : undefined
    });
    if (path === this.#pathThatSet) return;
    this.#pathThatSet = path;
    try {
      const url = new URL(location.href);
      url.hash = `!${path}`;
      history.replaceState(history.state, "", url.href);
    } catch (err) {
      console.warn(`<${MAPLAT_UI_TAG}>: failed to update the state URL`, err);
    }
  }

  /** restore を起動後に代入した: 層 B の拡張キーは起動時だけ読む（i'）ので警告する（層 A の分は子が警告する）。 */
  #checkLateRestore(value: unknown) {
    if (!this.#startupStateApplied || !value || typeof value !== "object")
      return;
    const v = value as Record<string, unknown>;
    if (LAYER_B_RESTORE_KEYS.some(k => v[k] !== undefined)) {
      this.#warnOnce(
        "startup:restore",
        `<${MAPLAT_UI_TAG}>: "showBorder" / "openedMarker" of property "restore" are read only at startup; the change was ignored (use setShowBorder() / openMarker()).`
      );
    }
  }

  /** 準備の済んだ子にだけ操作を渡す（準備前の押下は何もしない）。 */
  #call(name: string, fn: (app: MaplatAppElement) => unknown) {
    const app = this.#app;
    if (!app || !this.#appReady) return;
    try {
      const result = fn(app);
      if (result && typeof (result as Promise<unknown>).catch === "function") {
        (result as Promise<unknown>).catch(err =>
          console.warn(`<${MAPLAT_UI_TAG}>: ${name} failed`, err)
        );
      }
    } catch (err) {
      console.warn(`<${MAPLAT_UI_TAG}>: ${name} failed`, err);
    }
  }

  // ---- 部品 ----

  #wire() {
    const el = this.#el;
    el.zoomIn.addEventListener("click", () =>
      this.#call("zoomBy", app => app.zoomBy(1))
    );
    el.zoomOut.addEventListener("click", () =>
      this.#call("zoomBy", app => app.zoomBy(-1))
    );
    el.home
      .querySelector("button")!
      .addEventListener("click", () =>
        this.#call("goHome", app => app.goHome())
      );
    el.compass
      .querySelector("button")!
      .addEventListener("click", () =>
        this.#call("compass", app =>
          this.#compassUsesNorth() ? app.resetDirection() : app.resetRotation()
        )
      );
    el.gps.querySelector("button")!.addEventListener("click", () =>
      this.#call("handleGPS", app => {
        // 旧 SetGPS と同じ: always-gps-on なら常に開始、そうでなければ切り替え。
        // 範囲外のまま（最後の結果が gps_out）なら、旧は outOfMap を出し直していた（範囲外モーダル）
        if (app.alwaysGpsOn === true) {
          const result = app.handleGPS(true);
          if (this.#lastGpsError === "gps_out") this.#notifyOutOfMap();
          return result;
        }
        return app.handleGPS(!app.gpsEnabled);
      })
    );
    el.slider.addEventListener("pointerdown", () => {
      this.#sliderDragging = true;
    });
    el.slider.addEventListener("change", () => {
      this.#sliderDragging = false;
    });
    el.slider.addEventListener("input", () => {
      const transparency = 100 - Number(el.slider.value);
      this.#call("setTransparency", app => app.setTransparency(transparency));
    });
    this.#createSliders();
    el.poiClose.addEventListener("click", () => this.#closePoi());
    el.modal.addEventListener("click", evt => {
      if (evt.target === el.modal) this.#closePoi();
    });
    // ---- 地図情報・枠線・マーカーの非表示（旧 Copyright・Border・HideMarker の操作ボタン）----
    el.infoButton
      .querySelector("button")!
      .addEventListener("click", () => this.#openMapInfo());
    el.infoClose.addEventListener("click", () => this.#closeMapInfo());
    el.info.addEventListener("click", evt => {
      if (evt.target === el.info) this.#closeMapInfo();
    });
    el.cacheFetch.addEventListener("click", () => void this.#onCacheFetch());
    el.cacheDelete.addEventListener("click", () => void this.#onCacheDelete());
    el.borderButton
      .querySelector("button")!
      .addEventListener("click", () => this.setShowBorder(!this.#showBorder));
    el.hideMarkerButton
      .querySelector("button")!
      .addEventListener("click", () => this.setHideMarker(!this.#hideMarker));
    // ---- マーカー一覧 ----
    el.markerListButton
      .querySelector("button")!
      .addEventListener("click", () => this.#openMarkerList());
    el.markerListClose.addEventListener("click", () => this.#closeMarkerList());
    el.markerList.addEventListener("click", evt => {
      if (evt.target === el.markerList) this.#closeMarkerList();
    });
    // ---- 共有（旧 Share の操作ボタン・共有モーダル・POI の吹き出しの共有ボタン）----
    el.shareButton
      .querySelector("button")!
      .addEventListener("click", () => this.#openShare());
    el.shareClose.addEventListener("click", () => this.#closeShare());
    el.share.addEventListener("click", evt => {
      if (evt.target === el.share) this.#closeShare();
    });
    // ---- ヘルプ（旧 maplat_control.ts の Maplat ボタン・ui_init.ts の modal_help）----
    el.helpButton
      .querySelector("button")!
      .addEventListener("click", () => this.#openHelp());
    el.helpClose.addEventListener("click", () => this.#closeHelp());
    el.help.addEventListener("click", evt => {
      if (evt.target === el.help) this.#closeHelp();
    });
    // ---- 範囲外・GPS のエラー（旧 initGpsHandlers の modal_gpsD）----
    el.gpsClose.addEventListener("click", () => this.#closeGpsModal());
    el.gpsModal.addEventListener("click", evt => {
      if (evt.target === el.gpsModal) this.#closeGpsModal();
    });
    this.#root.addEventListener("click", evt => {
      const button = (evt.target as Element | null)?.closest?.(
        "button[data-share]"
      ) as HTMLButtonElement | null;
      if (button) this.#onShareCommand(button);
    });
    // ---- 汎用メニュー（重なった POI の選択・旧 API の showContextMenu の両方がここを通る）----
    el.poiMenu.addEventListener("click", evt => {
      const button = (evt.target as Element | null)?.closest?.(
        "button[data-index]"
      ) as HTMLButtonElement | null;
      if (!button) return;
      const item = this.#menuItems[Number(button.dataset.index)];
      // メニューは押す前に閉じる（旧 showContextMenu と同じ。callback の中で開き直せる）
      this.#closeMenu();
      if (!item?.callback) return;
      try {
        item.callback();
      } catch (err) {
        // 利用者の callback の失敗で UI を壊さない（旧はそのまま伝播していたが、閉じた後の処理なので）
        console.warn(
          `<${MAPLAT_UI_TAG}>: a menu item callback threw an error.`,
          err
        );
      }
    });
    // 自分の部品（メニューの外）を押したらメニューを閉じる。地図の押下は子の要素の pointerdown で閉じる
    this.#root.addEventListener("pointerdown", evt => {
      if (el.poiMenu.hidden) return;
      const path = evt.composedPath();
      if (path.includes(el.poiMenu)) return;
      if (this.#app && path.includes(this.#app)) return;
      this.#closeMenu();
    });
    this.#root.addEventListener("keydown", evt => {
      if ((evt as KeyboardEvent).key !== "Escape") return;
      if (!el.share.hidden) this.#closeShare();
      else if (!el.help.hidden) this.#closeHelp();
      else if (!el.gpsModal.hidden) this.#closeGpsModal();
      else if (!el.info.hidden) this.#closeMapInfo();
      else if (!el.modal.hidden) this.#closePoi();
      else if (!el.poiMenu.hidden) this.#closeMenu();
      else if (!el.markerList.hidden) this.#closeMarkerList();
    });
  }

  #renderTexts() {
    const el = this.#el;
    el.zoomIn.title = this.t("control.zoom_in");
    el.zoomIn.setAttribute("aria-label", el.zoomIn.title);
    el.zoomOut.title = this.t("control.zoom_out");
    el.zoomOut.setAttribute("aria-label", el.zoomOut.title);
    const label = (part: HTMLElement, key: string) => {
      const button = part.querySelector("button")!;
      button.title = this.t(key);
      button.setAttribute("aria-label", button.title);
    };
    label(el.home, "control.home");
    label(el.gps, "control.gps");
    label(
      el.compass,
      this.#compassUsesNorth() ? "control.compass_north" : "control.compass"
    );
    el.slider.title = this.t("control.trans");
    el.slider.setAttribute("aria-label", el.slider.title);
    // 地図の切り替えスライダー（グループ名と矢印の読み上げ名）
    const groupLabels: Array<[MapSlider | null, string]> = [
      [this.#baseSlider, "slider.base"],
      [this.#overlaySlider, "slider.overlay"]
    ];
    for (const [slider, key] of groupLabels) {
      if (!slider) continue;
      slider.setGroupLabel(this.t(key));
      slider.setNavLabels({
        prev: this.t("slider.prev"),
        next: this.t("slider.next")
      });
      slider.refresh();
    }
    for (const close of [el.poiClose, el.markerListClose]) {
      close.querySelector(".sr-only")!.textContent = this.t("html.close");
      close.title = this.t("html.close");
    }
    label(el.markerListButton, "control.marker_list");
    el.markerListTitle.textContent = this.t("html.marker_list_title");
    label(el.infoButton, "control.info");
    label(el.borderButton, "control.border");
    label(el.hideMarkerButton, "control.hide_marker");
    el.infoClose.querySelector(".sr-only")!.textContent = this.t("html.close");
    el.infoClose.title = this.t("html.close");
    el.cacheFetch.textContent = this.t(
      this.#isCacheFetchingCurrent() ? "html.cache_cancel" : "html.cache_fetch"
    );
    el.cacheDelete.textContent = this.t("html.cache_delete");
    el.poiMenu.setAttribute(
      "aria-label",
      this.#menuLabel || this.t("menu.poi_candidates")
    );
    label(el.shareButton, "control.share");
    el.shareTitle.textContent = this.t("html.share_title");
    el.shareApp.querySelector(".share-heading")!.textContent = this.t(
      "html.share_app_title"
    );
    el.shareView.querySelector(".share-heading")!.textContent = this.t(
      "html.share_state_title"
    );
    el.shareClose.querySelector(".sr-only")!.textContent = this.t("html.close");
    el.shareClose.title = this.t("html.close");
    label(el.helpButton, "control.help");
    el.helpTitle.textContent = this.t("html.help_title");
    el.helpClose.querySelector(".sr-only")!.textContent = this.t("html.close");
    el.helpClose.title = this.t("html.close");
    el.gpsClose.querySelector(".sr-only")!.textContent = this.t("html.close");
    el.gpsClose.title = this.t("html.close");
    el.splashLoading.textContent = this.t("html.app_loading_body");
    for (const small of Array.from(
      this.#root.querySelectorAll(".share-copy-label")
    ))
      small.textContent = this.t("html.share_copy");
    for (const button of Array.from(
      this.#root.querySelectorAll<HTMLButtonElement>(
        'button[data-share^="cp_"]'
      )
    ))
      button.title = this.t("html.share_copy");
    for (const qr of Array.from(this.#root.querySelectorAll("svg[data-url]")))
      qr.setAttribute("aria-label", this.t("html.share_qr"));
  }

  /**
   * 言語ファイルを読み直してから描く（旧 UI の i18nLoader に当たる。ready と言語の切り替えで待つ）。
   * 読み込み中に言語が変わっていたら、古い読み込みの結果では描かない（最後の言語が勝つ）。
   */
  #reloadLang(): Promise<void> {
    const generation = ++this.#localeGeneration;
    const task = loadLanguage(this.currentLang).then(strings => {
      if (generation !== this.#localeGeneration) return;
      this.#strings = strings;
      this.#applyLang();
    });
    return task;
  }

  /** 今の言語を読み終えるまで待つ（読み込み中に言語が変わっていたら、その読み込みも待つ）。 */
  async #ensureLanguage(): Promise<void> {
    for (;;) {
      const task = this.#reloadLang();
      const generation = this.#localeGeneration;
      await task;
      if (generation === this.#localeGeneration) return;
    }
  }

  #applyLang() {
    this.#renderTexts();
    this.#renderTitle();
    if (!this.#el.markerList.hidden) this.#renderMarkerList();
    if (!this.#el.poiMenu.hidden) {
      if (this.#menuProvider) this.#menuItems = this.#menuProvider();
      this.#renderMenuItems();
    }
    if (!this.#el.info.hidden) this.#renderMapInfo();
    if (!this.#el.help.hidden) this.#renderHelp();
    if (!this.#el.gpsModal.hidden) this.#renderGpsModal();
    if (this.#poi) this.#renderPoi(this.#poi);
  }

  #applyDocumentTitle() {
    if (
      this.#parseOwnAttribute(ATTR_SET_DOCUMENT_TITLE) === false ||
      typeof document === "undefined"
    )
      return;
    const appName = this.#readAppData()?.appName as Localized | undefined;
    if (appName == null) return;
    const title = this.translateText(appName);
    if (title) document.title = title;
  }

  #renderTitle() {
    const meta = this.#currentMeta;
    const text = meta
      ? this.translateText(meta.officialTitle || meta.title || meta.label)
      : undefined;
    this.#el.titleText.textContent = text || meta?.mapID || "";
  }

  /**
   * app-envelope（開発用。旧 ui_init.ts:471-499 の appBbox）。範囲を持つ全地図の包囲矩形を
   * [minLng, minLat, maxLng, maxLat] の順で 1 回だけ console に出す。起動時のみのキー（i'）。
   */
  #logAppEnvelope() {
    if (this.#appEnvelopeLogged) return;
    this.#appEnvelopeLogged = true;
    if (this.#parseOwnAttribute(ATTR_APP_ENVELOPE) !== true) return;
    const app = this.#app;
    if (!app) return;
    const bbox: number[] = [];
    for (const item of this.#maps) {
      if (!item.hasEnvelope) continue;
      const envelope = this.#safeCall(() => app.getMapEnvelope(item.mapID));
      if (!Array.isArray(envelope)) continue;
      for (const xy of envelope) {
        if (bbox.length === 0) {
          bbox[0] = bbox[2] = xy.longitude;
          bbox[1] = bbox[3] = xy.latitude;
        } else {
          if (xy.longitude < bbox[0]) bbox[0] = xy.longitude;
          if (xy.longitude > bbox[2]) bbox[2] = xy.longitude;
          if (xy.latitude < bbox[1]) bbox[1] = xy.latitude;
          if (xy.latitude > bbox[3]) bbox[3] = xy.latitude;
        }
      }
    }
    console.log(`This app's envelope is: ${bbox}`);
  }

  /**
   * 地図の切り替えスライダーを 2 本作る（左＝背景の地図・右＝重ねる地図）。
   * `listMaps` の並びは `#renderMaps` で渡す。地図を変えるのは `onSelect` だけで、
   * 部品が自分で動き始めるので、ここから `step()` は呼ばない。
   */
  #createSliders() {
    const make = (kind: "base" | "overlay") =>
      new MapSlider({
        kind,
        items: [],
        translate: value => this.translateText(value) ?? "",
        groupLabel: this.t(kind === "base" ? "slider.base" : "slider.overlay"),
        navLabels: {
          prev: this.t("slider.prev"),
          next: this.t("slider.next")
        },
        // サムネイルの無い地図は、要素が既に持っているプレースホルダを使う（2 つ目を作らない）
        placeholder: label => this.#thumbPlaceholder(label),
        onSelect: (mapID, offset) => this.#onSliderSelect(kind, mapID, offset),
        onActiveChange:
          kind === "overlay"
            ? mapID => this.#onOverlayActive(mapID)
            : undefined,
        onActivePreview:
          kind === "overlay" ? mapID => this.#onOverlayActive(mapID) : undefined
      });
    this.#baseSlider = make("base");
    this.#overlaySlider = make("overlay");
    this.#el.switcher.append(
      this.#baseSlider.element,
      this.#overlaySlider.element
    );
    this.#baseSlider.setShowBorder(this.#showBorder);
    this.#overlaySlider.setShowBorder(this.#showBorder);
  }

  /** `listMaps` を背景の地図と重ねる地図に分けて、2 本のスライダーへ渡す（旧 UI の 2 本）。 */
  #renderMaps() {
    const base = this.#baseSlider;
    const overlay = this.#overlaySlider;
    if (!base || !overlay) return;
    const baseItems: MapSliderItem[] = [];
    const overlayItems: MapSliderItem[] = [];
    for (const item of this.#maps) {
      const view: MapSliderItem = {
        mapID: item.mapID,
        label: item.label,
        thumbnail: item.thumbnail ?? null,
        hasEnvelope: !!item.hasEnvelope,
        envelopeColor: this.#mapColors.get(item.mapID),
        isBasemap: !!item.isBasemap
      };
      (item.isBasemap ? baseItems : overlayItems).push(view);
    }
    base.setItems(baseItems);
    overlay.setItems(overlayItems);
    // 起動時は旧 Swiper の initialSlide と同じく、動かさずに今の地図へ置く。
    // 今の地図が無い側は位置を保ち、`.selected` を付けない（旧 ui_init.ts:173-174 と旧の
    // setSlideMapID は、両方に今の地図を渡し、無い側は選択を外すだけ）
    if (this.#currentMapId) {
      for (const slider of [base, overlay]) {
        if (slider.hasMap(this.#currentMapId))
          slider.setSelectedMapID(this.#currentMapId, false);
        else slider.setSelectedOnly(null);
      }
    }
    const current = this.#maps.find(m => m.mapID === this.#currentMapId);
    this.#activeOverlayMapId =
      current && !current.isBasemap
        ? this.#currentMapId
        : (overlay.activeMapID ?? this.#lastOldMapId);
    base.setShowBorder(this.#showBorder);
    overlay.setShowBorder(this.#showBorder);
    this.#updateEnvelope();
  }

  /**
   * 今の地図に 2 本の選択を合わせる（`mapChanged`）。旧 ui_init.ts:173-174 と同じく両方に今の地図を
   * 渡し、今の地図が無い側は位置を保って `.selected` だけ外す（選択は今の地図にだけ付く）。
   */
  #syncSliders() {
    const current = this.#maps.find(m => m.mapID === this.#currentMapId);
    for (const slider of [this.#baseSlider, this.#overlaySlider]) {
      if (!slider) continue;
      if (slider.hasMap(this.#currentMapId))
        slider.setSelectedMapID(this.#currentMapId);
      else slider.setSelectedOnly(null);
    }
    if (current && !current.isBasemap) this.#activeOverlayMapId = current.mapID;
  }

  /**
   * スライダーのカードを選んだ（クリック・Enter）。押したカードは部品がもう動かし始めているので、
   * `step()` は呼ばない（呼ぶと 2 枚動く）。`.selected` だけ先に合わせてから地図を変える
   * （旧 ui_init.ts:582-585 と同じ順序）。
   */
  #onSliderSelect(kind: "base" | "overlay", mapID: string, offset: number) {
    void offset;
    if (kind === "base") this.#baseSlider?.setSelectedOnly(mapID);
    else this.#overlaySlider?.setSelectedOnly(mapID);
    if (mapID !== this.#currentMapId)
      this.#call("changeMap", app => app.changeMap(mapID));
  }

  /** 重ねる地図のスライダーの中央が変わった（drag 中は先に枠線の塗りだけ追従）。 */
  #onOverlayActive(mapID: string | null) {
    this.#activeOverlayMapId = mapID ?? this.#lastOldMapId;
    if (this.#showBorder) this.#updateEnvelope();
  }

  #thumbPlaceholder(label: string): HTMLElement {
    const span = document.createElement("span");
    span.className = "thumb none";
    span.setAttribute("aria-hidden", "true");
    span.textContent = Array.from(label)[0] ?? "?";
    return span;
  }

  #renderSlider() {
    const app = this.#app;
    const slider = this.#el.slider;
    if (!app || !this.#appReady) return;
    // 透過度は重ね表示（overlay、既定 true）のときだけ意味がある
    slider.hidden = app.overlay === false;
    // 背景地図の上に古地図・重ね地図を重ねているときだけ動かせる（旧 checkOverlayID）
    const current = this.#maps.find(m => m.mapID === this.#currentMapId);
    slider.disabled = !current || current.isBasemap;
    if (!this.#sliderDragging)
      slider.value = `${100 - this.#readTransparency(app)}`;
  }

  #renderGps(enabled: boolean) {
    this.#el.gps.classList.toggle("disable", !enabled);
    this.#el.gps.dataset.enabled = enabled ? "true" : "false";
  }

  /** コンパスを押したら北へ向けるか。auto は子の north-up に従う。 */
  #compassUsesNorth(): boolean {
    const action = this.#parseOwnAttribute(ATTR_COMPASS_ACTION) as
      string | undefined;
    if (action === "north") return true;
    if (action === "rotation") return false;
    if (action !== undefined && action !== "auto") {
      this.#warnOnce(
        `compass-action:${action}`,
        `<${MAPLAT_UI_TAG}>: invalid value "${action}" for attribute "compass-action" (use "auto" / "north" / "rotation"); treated as "auto".`
      );
    }
    return this.#app?.northUp === true;
  }

  #renderCompass() {
    const vp = this.#viewpoint;
    const direction = normalizeDegree(vp?.direction ?? 0);
    const rotation = normalizeDegree(vp?.rotation ?? 0);
    // 針は実世界の方位を指す（旧 CompassRotate と同じ）
    this.#el.needle.style.transform = `rotate(${direction}deg)`;
    const north = this.#compassUsesNorth();
    // 押しても変わらない状態なら薄く出す（旧: north-up なら方位 0.1 rad 未満、そうでなければ回転 0）
    const settled = north
      ? Math.abs(direction) < (0.1 * 180) / Math.PI
      : Math.abs(rotation) < 1e-6;
    this.#el.compass.classList.toggle("disable", settled);
    this.#el.compass.dataset.action = north ? "north" : "rotation";
    const button = this.#el.compass.querySelector("button")!;
    button.title = this.t(north ? "control.compass_north" : "control.compass");
    button.setAttribute("aria-label", button.title);
  }

  // ---- 枠線（旧 index.ts の updateEnvelope・setShowBorder・maplat_control.ts の Border）----

  /** 層 A の機能の問い合わせ。実装による分岐には implementation を使わない。 */
  #supports(feature: string): boolean {
    const app = this.#app;
    if (!app || typeof app.supports !== "function") return false;
    try {
      return app.supports(feature) === true;
    } catch {
      return false;
    }
  }

  /** enable-border が真で、層 A が範囲を描ける（supports("envelopes")）ときだけボタンを出す。 */
  #renderBorderButton() {
    const show =
      this.#parseOwnAttribute(ATTR_ENABLE_BORDER) === true &&
      this.#appReady &&
      this.#supports("envelopes");
    this.#el.borderButton.hidden = !show;
    this.#el.borderButton
      .querySelector("button")!
      .setAttribute("aria-pressed", this.#showBorder ? "true" : "false");
  }

  /**
   * 範囲を持つ地図に、listMaps の順で 25 色を順に割り振る（旧 ui_init.ts:473-497 と同じ規則。
   * 25 色を使い切ったら先頭へ戻る）。`#maps` を作り直すたびに呼ぶ。
   */
  #assignEnvelopeColors() {
    this.#mapColors.clear();
    let index = 0;
    for (const item of this.#maps) {
      if (!item.hasEnvelope) continue;
      this.#mapColors.set(
        item.mapID,
        ENVELOPE_COLORS[index % ENVELOPE_COLORS.length]
      );
      index++;
    }
  }

  /** 地図が古地図（重ね地図）なら、最後に選んだ古地図として覚える（ベースマップでは変えない）。 */
  #rememberOldMap(mapID: string | null) {
    if (!mapID) return;
    const item = this.#maps.find(m => m.mapID === mapID);
    if (item?.isOldMap) {
      this.#lastOldMapId = mapID;
      return;
    }
    // まだ古地図を選んでいなければ、旧 UI の重ね地図のスワイパーの既定（先頭の古地図）に合わせる
    if (!this.#lastOldMapId)
      this.#lastOldMapId = this.#maps.find(m => m.isOldMap)?.mapID ?? null;
  }

  /**
   * 範囲を塗る地図: 今の地図が古地図ならその地図、ベースマップの上なら重ねる地図のスライダーの
   * 中央のカード（旧の isActive。drag 中は preview に追従する）。
   */
  #envelopeFillMapId(): string | null {
    const current = this.#maps.find(m => m.mapID === this.#currentMapId);
    if (current?.isOldMap) return this.#currentMapId;
    return this.#activeOverlayMapId ?? this.#lastOldMapId;
  }

  /**
   * 枠線を描き直す（旧 updateEnvelope）。層 A の setEnvelopes に、範囲を持つ地図（listMaps の hasEnvelope）の
   * 一覧を渡し、色は地図ごとの割り当て（ENVELOPE_COLORS）を使う。塗るのは今の古地図の範囲で、
   * ベースマップの上では最後に選んだ古地図の範囲（旧は重ね地図のスワイパーの選択中スライドを塗っていた）。
   * 非表示のときは空の配列で消す。supports("envelopes") が偽の層 A では何もしない。
   */
  #updateEnvelope() {
    const app = this.#app;
    if (!app || !this.#appReady || !this.#supports("envelopes")) return;
    const items: EnvelopeSpec[] = [];
    if (this.#showBorder) {
      const fillMapId = this.#envelopeFillMapId();
      for (const item of this.#maps) {
        if (!item.hasEnvelope) continue;
        const color = this.#mapColors.get(item.mapID) ?? ENVELOPE_COLORS[0];
        const spec: EnvelopeSpec = {
          mapID: item.mapID,
          stroke: { ...ENVELOPE_STROKE, color }
        };
        if (item.mapID === fillMapId) spec.fill = envelopeFill(color);
        items.push(spec);
      }
    }
    this.#call("setEnvelopes", target => target.setEnvelopes(items));
  }

  // ---- マーカーの非表示（旧 ui_marker.ts の setHideMarker・maplat_control.ts の HideMarker）----

  /** enable-hide-marker が真のときだけボタンを出す（押されている状態は aria-pressed で表す）。 */
  #renderHideMarkerButton() {
    this.#el.hideMarkerButton.hidden = !(
      this.#parseOwnAttribute(ATTR_ENABLE_HIDE_MARKER) === true &&
      this.#appReady
    );
    this.#el.hideMarkerButton
      .querySelector("button")!
      .setAttribute("aria-pressed", this.#hideMarker ? "true" : "false");
  }

  // ---- 共有（旧 maplat_control.ts の Share・ui_init.ts の共有モーダルと共有ボタンの処理・ui_marker.ts の吹き出しの共有）----

  /** enable-share が真のときだけボタンを出す（旧 enable_share）。 */
  #renderShareButton() {
    this.#el.shareButton.hidden = !(
      this.#parseOwnAttribute(ATTR_ENABLE_SHARE) === true && this.#appReady
    );
  }

  /** 共有のモーダルを開く: アプリの URL（と state-url なら今の表示の URL）の QR を出す。 */
  #openShare() {
    if (!this.#appReady) return;
    if (this.#parseOwnAttribute(ATTR_ENABLE_SHARE) !== true) return;
    this.#closeMenu();
    this.#closeMarkerList();
    this.#closeMapInfo();
    this.#closePoi();
    const el = this.#el;
    // 状態 URL の欄は state-url のときだけ（旧 .state_url .modal_share_state）
    const view = this.#stateUrlOn();
    el.shareView.hidden = !view;
    el.share.hidden = false;
    const label = this.t("html.share_qr");
    void renderQr(el.qrApp, this.getShareUrl("app"), label);
    if (view) void renderQr(el.qrView, this.getShareUrl("view"), label);
    el.shareClose.focus({ preventScroll: true });
  }

  #closeShare() {
    this.#el.share.hidden = true;
  }

  /** 吹き出しの共有（旧: enable-share かつ state-url のときだけ。QR は今の表示の URL＝開いた POI を含む）。 */
  #renderPoiShare() {
    const el = this.#el;
    const show =
      this.#parseOwnAttribute(ATTR_ENABLE_SHARE) === true &&
      this.#stateUrlOn() &&
      !!this.#poi;
    el.poiShare.hidden = !show;
    if (show)
      void renderQr(
        el.poiQr,
        this.getShareUrl("view"),
        this.t("html.share_qr")
      );
    else el.poiQr.replaceChildren();
  }

  /** 共有のボタン（data-share="cp_app" 等。旧と同じ「操作_種類」の形）。 */
  #onShareCommand(button: HTMLButtonElement) {
    const [cmd, kind] = (button.dataset.share ?? "").split("_");
    const uri = this.getShareUrl(kind === "view" ? "view" : "app");
    if (cmd === "cp") {
      this.#copyText(uri).then(
        () => this.showToast(this.t("app.copy_toast"), button),
        (err: unknown) =>
          console.warn(`<${MAPLAT_UI_TAG}>: failed to copy the URL`, err)
      );
    } else if (cmd === "tw") {
      window.open(
        twitterShareUrl(uri, document.title),
        "_blank",
        "noopener,noreferrer"
      );
    } else if (cmd === "fb") {
      window.open(
        facebookShareUrl(uri),
        "_blank",
        "width=650,height=450,menubar=no,toolbar=no,scrollbars=yes,noopener,noreferrer"
      );
    }
  }

  /** クリップボードへ写す（旧と同じく Clipboard API が無ければ textarea と execCommand で）。 */
  async #copyText(text: string): Promise<void> {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    try {
      area.select();
      if (!document.execCommand("copy")) throw new Error("copy was rejected");
    } finally {
      area.remove();
    }
  }

  // ---- 範囲外・GPS のエラー（旧 ui_init.ts:341-419 の initGpsHandlers・modal_gpsD）----

  /** 範囲外を知らせる（旧 outOfMap の処理。presentation-mode が真なら出さない）。 */
  #notifyOutOfMap() {
    if (this.#parseOwnAttribute(ATTR_PRESENTATION_MODE) === true) return;
    this.#showGpsModal(true);
  }

  /**
   * 範囲外／GPS のエラーのモーダル（旧 modal_gpsD。題名と本文だけの画面）。
   * 旧と同じ文言: 範囲外は app.out_of_map / app.out_of_map_area、エラーは app.gps_error と
   * 種類ごとの app.user_gps_deny・app.gps_miss・app.gps_timeout（知らない種類は app.gps_error）。
   * 地図の準備前は出さない（旧も core-ready の後に購読していた）。
   */
  #showGpsModal(outOfMap: boolean, error?: string) {
    if (!this.#app || !this.#appReady) return;
    const el = this.#el;
    this.#gpsModalOutOfMap = outOfMap;
    this.#gpsModalError = error;
    this.#renderGpsModal();
    this.#closeMenu();
    this.#closeMarkerList();
    this.#closeMapInfo();
    this.#closeShare();
    this.#closeHelp();
    this.#closePoi();
    el.gpsModal.hidden = false;
    el.gpsClose.focus({ preventScroll: true });
  }

  /**
   * モーダルの題名と本文を、覚えている内容（範囲外か・エラーの種類）と今の言語で描く
   * （開いたまま lang を変えたら #applyLang がここを呼ぶ）。
   */
  #renderGpsModal() {
    const el = this.#el;
    const outOfMap = this.#gpsModalOutOfMap;
    el.gpsTitle.textContent = this.t(
      outOfMap ? "app.out_of_map" : "app.gps_error"
    );
    el.gpsMessage.textContent = outOfMap
      ? this.t("app.out_of_map_area")
      : this.t(GPS_ERROR_KEYS[this.#gpsModalError ?? ""] ?? "app.gps_error");
  }

  #closeGpsModal() {
    this.#el.gpsModal.hidden = true;
  }

  // ---- ヘルプ（旧 maplat_control.ts の Maplat ボタン・ui_init.ts の modal_help・html.help_*）----

  /** ヘルプを開く（旧: 地図の click_control の "help"。地図の準備後だけ）。 */
  #openHelp() {
    if (!this.#appReady) return;
    this.#closeMenu();
    this.#closeMarkerList();
    this.#closeMapInfo();
    this.#closeShare();
    this.#closePoi();
    this.#renderHelp();
    this.#el.help.hidden = false;
    this.#el.helpClose.focus({ preventScroll: true });
  }

  #closeHelp() {
    this.#el.help.hidden = true;
  }

  /**
   * ヘルプの本文（旧 ui_init.ts:1527-1549 の modal_help_content と同じ並び: はじめに → 地図の操作 →
   * 地図の変更 → 現在地 → スポット → その他）。文言は html.help_*（値は信頼できるが、DOM へ入れる前に
   * sanitizeHtml を通す）。旧は ${xxx.png} を pointer_images の URL に差し替えていたが、層 B は画像を
   * 持たないので、同じ位置にボタンの SVG（src/icons.ts）と共通の画像（既定のピン・GPS の点）を置く。
   * その他の行（共有・枠線・マーカーの非表示・マーカー一覧）は enable-* のときだけ出す
   * （旧 CSS の &.enable_share .share_help 等と同じ規則）。
   * 冒頭の説明の後には、旧の fullscreen.png の位置に全体の図（#helpFigure）をその場で組む。
   */
  #renderHelp() {
    const body = this.#el.helpBody;
    body.replaceChildren();
    const section = (tag: "p" | "h4", key: string) => {
      const node = document.createElement(tag);
      if (tag === "p") node.className = "help-text";
      this.#appendHelpHtml(node, this.t(key));
      body.appendChild(node);
      return node;
    };
    section("p", "html.help_using_maplat");
    body.appendChild(this.#helpFigure());
    section("h4", "html.help_operation_title");
    section("p", "html.help_operation_content");
    section("h4", "html.help_selection_title");
    section("p", "html.help_selection_content");
    section("h4", "html.help_gps_title");
    section("p", "html.help_gps_content");
    section("h4", "html.help_poi_title");
    section("p", "html.help_poi_content");
    section("h4", "html.help_etc_title");
    const list = document.createElement("ul");
    list.className = "help-list";
    const item = (key: string) => {
      const li = document.createElement("li");
      this.#appendHelpHtml(li, this.t(key));
      list.appendChild(li);
    };
    item("html.help_etc_attr");
    item("html.help_etc_help");
    if (this.#parseOwnAttribute(ATTR_ENABLE_SHARE) === true)
      item("html.help_share_help");
    if (this.#parseOwnAttribute(ATTR_ENABLE_BORDER) === true)
      item("html.help_etc_border");
    if (this.#parseOwnAttribute(ATTR_ENABLE_HIDE_MARKER) === true)
      item("html.help_etc_hide_marker");
    if (this.#parseOwnAttribute(ATTR_ENABLE_MARKER_LIST) === true)
      item("html.help_etc_marker_list");
    item("html.help_etc_slider");
    body.appendChild(list);
    // 旧と同じ末尾のクレジット（href は固定値。DOM で組む）
    const footer = document.createElement("p");
    footer.className = "help-footer";
    const link = document.createElement("a");
    link.href = "https://www.maplat.jp/";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Maplat";
    footer.append(
      link,
      document.createTextNode(" © 2015- Kohei Otsuka, Code for History")
    );
    body.appendChild(footer);
  }

  /**
   * 全体の図の背景: 子（slot="map"）の地図の canvas（2D）を、画面に見えている位置と不透明度のまま
   * 1 枚の canvas に重ねて写す（背景の地図と重ねる地図の 2 つの層を含む）。縦長への切り出しは CSS の
   * object-fit: cover。画素は読み出さず写して見せるだけなので、タイルのサーバーが CORS を返さなくても描ける。
   * 写せる canvas が無いときは null。
   */
  #helpMapSnapshot(): HTMLCanvasElement | null {
    const host = this.#app as unknown as HTMLElement | null;
    if (!host || typeof host.querySelectorAll !== "function") return null;
    const box = host.getBoundingClientRect();
    if (!(box.width > 0 && box.height > 0)) return null;
    const layers = [...host.querySelectorAll("canvas")].filter(c => {
      const r = c.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0) || !(c.width > 0 && c.height > 0))
        return false;
      try {
        return c.getContext("2d") !== null;
      } catch {
        return false;
      }
    });
    if (layers.length === 0) return null;
    // 地図の表示の大きさの 2 倍で写し、長い辺は 1440px まで（図は 168px 幅なので、高い画素密度の画面でも足りる）
    const scale = Math.min(1, 720 / Math.max(box.width, box.height)) * 2;
    const out = document.createElement("canvas");
    out.width = Math.round(box.width * scale);
    out.height = Math.round(box.height * scale);
    const ctx = out.getContext("2d");
    if (!ctx) return null;
    for (const layer of layers) {
      let alpha = 1;
      for (
        let el: Element | null = layer;
        el && el !== host.parentElement;
        el = el.parentElement
      ) {
        const style = getComputedStyle(el);
        if (style.visibility === "hidden" || style.display === "none")
          alpha = 0;
        const opacity = parseFloat(style.opacity);
        if (Number.isFinite(opacity)) alpha *= opacity;
      }
      if (alpha <= 0) continue;
      const r = layer.getBoundingClientRect();
      ctx.globalAlpha = alpha;
      try {
        ctx.drawImage(
          layer,
          (r.left - box.left) * scale,
          (r.top - box.top) * scale,
          r.width * scale,
          r.height * scale
        );
      } catch {
        return null;
      }
    }
    out.setAttribute("aria-hidden", "true");
    return out;
  }

  /**
   * ヘルプの冒頭に出す「全体の図」。旧 UI の fullscreen.png（iPhone の枠の中の画面）と同じ位置に、
   * その場で組む。スマホの枠の中に今の地図を写し（写せないときは先頭の古地図のサムネイル）、
   * タッチ端末の配置（ズーム無し・左上に GPS とホーム・右上にコンパス・左下にヘルプと共有・右下の列・
   * 下に 2 本の地図スライダーと透過度・上に題名）を小さな部品で並べる。出すボタンは、実物で今
   * 出ているものだけ。図は読み上げない（説明は既存の html.help_* の文が担う）。
   */
  #helpFigure(): HTMLElement {
    const figure = document.createElement("div");
    figure.className = "help-figure";
    figure.setAttribute("aria-hidden", "true");

    const phone = document.createElement("div");
    phone.className = "help-phone";
    const screen = document.createElement("div");
    screen.className = "help-phone-screen";
    phone.appendChild(screen);

    // 背景は今の地図を写す。写せないとき（地図がまだ描かれていない・2D の canvas が無い）は
    // 先頭の古地図のサムネイル（小さい画像なので引き伸ばすとぼやける）
    const snapshot = this.#helpMapSnapshot();
    const thumbnail = snapshot ? undefined : this.#helpOldMapThumbnail();
    if (snapshot) {
      snapshot.className = "help-phone-map";
      screen.appendChild(snapshot);
    } else if (thumbnail) {
      const map = document.createElement("img");
      map.className = "help-phone-map";
      map.alt = "";
      map.src = thumbnail;
      screen.appendChild(map);
    }

    const ui = document.createElement("div");
    ui.className = "help-phone-ui";
    screen.appendChild(ui);

    const title = document.createElement("span");
    title.className = "help-phone-title";
    ui.appendChild(title);

    const topLeft = this.#helpFigureStack("help-phone-stack-top-left");
    topLeft.appendChild(this.#helpFigureButton("gps", "location-crosshairs"));
    topLeft.appendChild(this.#helpFigureButton("home", "house"));
    ui.appendChild(topLeft);

    const topRight = this.#helpFigureStack("help-phone-stack-top-right");
    topRight.appendChild(this.#helpFigureButton("compass", "compass"));
    ui.appendChild(topRight);

    // 右列は実物と同じく下から 地図情報・枠線・マーカーの非表示・マーカー一覧
    const bottomRight = this.#helpFigureStack("help-phone-stack-bottom-right");
    this.#helpFigureVisible(bottomRight, "info", "circle-info", true);
    this.#helpFigureVisible(
      bottomRight,
      "border",
      "layer-group",
      !this.#el.borderButton.hidden
    );
    this.#helpFigureVisible(
      bottomRight,
      "hide-marker",
      "map-pin",
      !this.#el.hideMarkerButton.hidden
    );
    this.#helpFigureVisible(
      bottomRight,
      "marker-list",
      "list",
      !this.#el.markerListButton.hidden
    );
    ui.appendChild(bottomRight);

    // 左下は実物と同じく下から ヘルプ・共有
    const bottomLeft = this.#helpFigureStack("help-phone-stack-bottom-left");
    bottomLeft.appendChild(this.#helpFigureButton("help", "circle-question"));
    this.#helpFigureVisible(
      bottomLeft,
      "share",
      "share-from-square",
      !this.#el.shareButton.hidden
    );
    ui.appendChild(bottomLeft);

    ui.appendChild(this.#helpFigureMapSlider("base"));
    ui.appendChild(this.#helpFigureMapSlider("overlay"));

    const transparency = document.createElement("div");
    transparency.className = "help-phone-transparency";
    const slider = this.#helpImage("slider");
    if (slider) transparency.appendChild(slider);
    ui.appendChild(transparency);

    figure.appendChild(phone);
    return figure;
  }

  /** 図の中のボタンの列（見た目は本文の中の印（.help-icon）の小さなボタンを使い回す）。 */
  #helpFigureStack(className: string): HTMLElement {
    const stack = document.createElement("div");
    stack.className = `help-phone-stack ${className}`;
    return stack;
  }

  /** 図の中の 1 つのボタン。実物のボタンと同じ背景・白いアイコン・角の丸み 2px。 */
  #helpFigureButton(control: string, icon: string): HTMLElement {
    const span = document.createElement("span");
    span.className = "help-icon";
    span.dataset.control = control;
    span.setAttribute("aria-hidden", "true");
    span.innerHTML = getIcon(icon);
    return span;
  }

  /** 図の列へ、実際に出ているボタンだけを足す（実物のボタンの hidden に従う。属性・層 A の機能・POI の有無で出し分けている）。 */
  #helpFigureVisible(
    stack: HTMLElement,
    control: string,
    icon: string,
    show: boolean
  ) {
    if (!show) return;
    stack.appendChild(this.#helpFigureButton(control, icon));
  }

  /** 図の中の地図の切り替えスライダー（サムネイル付きのカードを簡略化したもの）。 */
  #helpFigureMapSlider(kind: "base" | "overlay"): HTMLElement {
    const card = document.createElement("div");
    card.className = "help-phone-map-slider";
    card.dataset.kind = kind;
    const item = this.#maps.find(map =>
      kind === "base" ? map.isBasemap : map.isOldMap
    );
    const thumbnail = safeImageUrl(item?.thumbnail);
    if (thumbnail) {
      const img = document.createElement("img");
      img.className = "help-phone-card-thumb";
      img.alt = "";
      img.src = thumbnail;
      card.appendChild(img);
    }
    const label = document.createElement("span");
    label.className = "help-phone-card-label";
    card.appendChild(label);
    return card;
  }

  /** 今の地図の一覧の先頭の古地図のサムネイル（旧 UI の overlay の絵と同じ選び方）。 */
  #helpOldMapThumbnail(): string | undefined {
    return safeImageUrl(this.#maps.find(m => m.isOldMap)?.thumbnail);
  }

  /**
   * ヘルプの 1 つの文言を、${xxx.png} の位置に画像・アイコンを挟みながら入れる。
   * 旧 UI の言語ファイルは `<img src='${xxx.png}'>` の形で書いてある（旧の translateDom が
   * ${xxx.png} を画像の URL に差し替えていた）。層 B は同じ位置にアイコンを置くので、
   * 囲みの <img> ごと置き換える。内蔵の辞書の裸の ${xxx.png} も同じように扱う。
   */
  #appendHelpHtml(parent: HTMLElement, text: string) {
    const source = String(text ?? "");
    const pattern =
      /<img\s+src=(['"])\$\{([a-z_]+)\.png\}\1\s*>|\$\{([a-z_]+)\.png\}/gi;
    let last = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source))) {
      this.#appendSanitized(parent, source.slice(last, match.index));
      const node = this.#helpImage(match[2] ?? match[3]);
      if (node) parent.appendChild(node);
      last = match.index + match[0].length;
    }
    this.#appendSanitized(parent, source.slice(last));
  }

  /** HTML の断片を sanitizeHtml に通して入れる（許可リストの外は落ちる）。 */
  #appendSanitized(parent: HTMLElement, html: string) {
    if (!html) return;
    const holder = document.createElement("template");
    holder.innerHTML = sanitizeHtml(html);
    parent.appendChild(holder.content);
  }

  /** 旧 pointer_images の ${xxx.png} に当たるもの。用意できない名前は何も置かない。 */
  #helpImage(name: string): Element | null {
    switch (name) {
      case "plus":
      case "minus": {
        const span = document.createElement("span");
        span.className = "help-key";
        span.setAttribute("aria-hidden", "true");
        span.textContent = name === "plus" ? "+" : "−";
        return span;
      }
      case "slider": {
        const span = document.createElement("span");
        span.className = "help-slider";
        span.setAttribute("aria-hidden", "true");
        return span;
      }
      case "defaultpin":
      case "bluedot": {
        const src = name === "defaultpin" ? assets.defaultpin : assets.bluedot;
        const img = document.createElement("img");
        img.className = "help-img";
        img.alt = "";
        img.src = src;
        return img;
      }
      case "overlay": {
        // 旧はスライダーのサムネイルの絵。今の地図の一覧の先頭の古地図の画像を使う
        const src = this.#helpOldMapThumbnail();
        if (src === undefined) return null;
        const img = document.createElement("img");
        img.className = "help-img";
        img.alt = "";
        img.src = src;
        return img;
      }
      default:
        break;
    }
    const icon = HELP_ICONS[name];
    if (!icon) return null;
    const span = document.createElement("span");
    span.className = "help-icon";
    span.setAttribute("aria-hidden", "true");
    span.innerHTML = getIcon(icon);
    return span;
  }

  // ---- 地図情報・ライセンス・タイルキャッシュ
  //      （旧 maplat_control.ts の Copyright・ui_init.ts の modal_map の処理・ui_utils.ts の renderLicenseCell）----

  /** 地図情報のボタンは地図の準備ができたら出す（旧は操作ボタンに常に並べていた）。 */
  #renderInfoButton() {
    this.#el.infoButton.hidden = !this.#appReady;
  }

  #openMapInfo() {
    if (!this.#appReady) return;
    this.#closeMenu();
    this.#closeMarkerList();
    this.#closeShare();
    this.#closePoi();
    this.#renderMapInfo();
    this.#el.info.hidden = false;
    this.#el.infoClose.focus({ preventScroll: true });
  }

  #closeMapInfo() {
    this.#el.info.hidden = true;
    // 開いている間に始まった統計の読み取り・描画を捨てる（一括取得は止めない・捨てない）
    this.#cacheGeneration++;
    this.#cacheStats = undefined;
    if (this.#cacheFrame) {
      cancelAnimationFrame(this.#cacheFrame);
      this.#cacheFrame = 0;
    }
  }

  /**
   * 地図情報の中身（題名・メタデータ・ライセンス・キャッシュ）を作り直す（旧 ui_init.ts の copyright の処理）。
   * 値は設定ファイル由来の信頼できないもの: HTML は sanitizeHtml を通し、ライセンスの注意書きは textContent。
   * 題名は旧と同じく多言語から今の言語を選ぶ。
   */
  #renderMapInfo() {
    const app = this.#app;
    if (!app || !this.#appReady) return;
    const el = this.#el;
    const mapID = app.currentMapId ?? this.#currentMapId ?? undefined;
    let meta: MapMeta | undefined;
    if (mapID) {
      try {
        meta = app.getMapMeta(mapID) ?? undefined;
      } catch {
        meta = undefined;
      }
    }
    const current = meta ?? this.#currentMeta ?? undefined;
    const values = current as Record<string, unknown> | undefined;
    const item = this.#maps.find(
      m => m.mapID === (mapID ?? (current?.mapID as string | undefined))
    );
    // 旧は source の isWmts() で分けた（古地図＝Maplat の地図、それ以外＝WMTS のベースマップ）
    const isWmts = item ? !item.isOldMap : true;
    el.infoTitle.textContent =
      this.translateText(
        (current?.title || current?.officialTitle || current?.label) as
          Localized | undefined
      ) || (typeof current?.mapID === "string" ? current.mapID : "");
    el.infoMeta.replaceChildren();
    for (const key of META_KEYS) {
      if (key === "title" || key === "officialTitle") continue;
      // 注意書きはライセンスのセルの中で出す（独立の行にはしない。旧 m6-t2 の設計と同じ）
      if (key === "licenseNote" || key === "dataLicenseNote") continue;
      const raw = values?.[key];
      if (key === "license" || key === "dataLicense") {
        // 空のときの既定値は地図の種類で決まる（旧 resolveLicenseFallback）
        const license = licenseFallback(
          key,
          typeof raw === "string" ? raw : undefined,
          isWmts
        );
        const noteKey = key === "license" ? "licenseNote" : "dataLicenseNote";
        const note =
          this.translateText(values?.[noteKey] as Localized | undefined) || "";
        this.#appendMetaRow(key, this.#licenseCell(license, note));
        continue;
      }
      const text = this.translateText(raw as Localized | undefined);
      if (!text) continue;
      const dd = document.createElement("dd");
      dd.innerHTML = sanitizeHtml(text);
      this.#appendMetaRow(key, dd);
    }
    void this.#refreshCache();
  }

  /** メタデータの 1 行（dt が項目名・dd が値。項目名は旧と同じく html.<キー> の文言）。 */
  #appendMetaRow(key: string, content: Node) {
    const dt = document.createElement("dt");
    dt.textContent = this.t(`html.${key}`);
    const dd = document.createElement("dd");
    dd.setAttribute("part", `map-meta-${key}`);
    dd.appendChild(content);
    this.#el.infoMeta.append(dt, dd);
  }

  /**
   * ライセンスのセル（旧 ui_utils.renderLicenseCell と同じ規則: アイコンがあれば出し、注意書きがあれば
   * その下に文章で出す。アイコンを持たない語彙 "Custom" は文章だけ）。アイコンの URL は PNG を import した
   * 表（license_images）から引き、表にない語彙は画像を出さずに文言だけを出す（相対 URL を取りに行かない）。
   */
  #licenseCell(license: string, note: string): DocumentFragment {
    const fragment = document.createDocumentFragment();
    if (license && license !== LICENSE_WITHOUT_ICON) {
      const fileName = `${license.toLowerCase().replace(/ /g, "_")}.png`;
      const icon = LICENSE_ICONS[fileName];
      if (icon !== undefined) {
        const img = document.createElement("img");
        img.className = "license";
        img.alt = license;
        img.src = icon;
        fragment.appendChild(img);
      } else {
        const span = document.createElement("span");
        span.className = "license-text";
        span.textContent = license;
        fragment.appendChild(span);
      }
    }
    if (note) {
      const div = document.createElement("div");
      div.className = "license_note";
      div.textContent = note;
      fragment.appendChild(div);
    }
    return fragment;
  }

  /** 今の地図のキャッシュを扱えるか（supports("tile-cache")・enable-cache・地図の cacheEnable の 3 つ）。 */
  #cacheAvailable(app: MaplatAppElement): boolean {
    if (!this.#supports("tile-cache")) return false;
    if (app.enableCache !== true) return false;
    try {
      return app.getMapCacheEnable(app.currentMapId ?? undefined) === true;
    } catch {
      return false;
    }
  }

  /**
   * 一括取得の表示を「取得中」にするか。取得中の地図が今の地図と同じときだけ取得中の表示にする
   * （地図を替えたら、裏で続いている取得は今の地図の欄に出さない）。
   */
  #isCacheFetchingCurrent(): boolean {
    if (!this.#cacheFetching) return false;
    return this.#cacheFetchingMapId === (this.#app?.currentMapId ?? null);
  }

  /**
   * キャッシュの欄の出し入れと統計の読み直し（地図情報を開いたとき・地図を切り替えたとき）。
   * 統計の読み取りだけを `#cacheGeneration` で捨てる（一括取得の印 `#cacheFetchToken` とは別）。
   */
  async #refreshCache() {
    const app = this.#app;
    const token = ++this.#cacheGeneration;
    const section = this.#el.cacheSection;
    if (!app || !this.#appReady || !this.#cacheAvailable(app)) {
      section.hidden = true;
      this.#cacheStats = undefined;
      return;
    }
    section.hidden = false;
    this.#el.cacheHeading.textContent = this.t("html.cache_handle");
    let stats: TileCacheStats = {};
    try {
      stats =
        (await app.getMapTileCacheStatsAsync(app.currentMapId ?? undefined)) ??
        {};
    } catch (err) {
      console.warn(`<${MAPLAT_UI_TAG}>: getMapTileCacheStatsAsync failed`, err);
    }
    if (token !== this.#cacheGeneration) return;
    this.#cacheStats = stats;
    this.#renderCache();
  }

  /** キャッシュの大きさと 2 つのボタンの状態（旧 showStats・updateButtons と同じ規則）。 */
  #renderCache() {
    const el = this.#el;
    if (el.cacheSection.hidden) return;
    const fetching = this.#isCacheFetchingCurrent();
    const stats = this.#cacheStats;
    const size = typeof stats?.size === "number" ? stats.size : 0;
    const count = typeof stats?.count === "number" ? stats.count : 0;
    const total = typeof stats?.total === "number" ? stats.total : 0;
    const sizeText = fetching
      ? this.t("html.cache_processing")
      : encBytes(size);
    el.cacheSize.textContent = total
      ? `${sizeText} (${count} / ${total} tiles [${Math.floor((1000 * count) / total) / 10}%])`
      : `${sizeText} (${count} tiles)`;
    el.cacheFetch.textContent = this.t(
      fetching ? "html.cache_cancel" : "html.cache_fetch"
    );
    el.cacheFetch.classList.toggle("btn-danger", fetching);
    // 全部取り終えていれば一括ダウンロードは押せない（旧と同じく隠さずに無効化する）
    el.cacheFetch.hidden = total === 0 && !fetching;
    el.cacheFetch.disabled = !fetching && total > 0 && count === total;
    el.cacheDelete.textContent = this.t("html.cache_delete");
    el.cacheDelete.disabled = fetching || size <= 0;
  }

  /** 一括ダウンロードの開始・停止（旧 cache_fetch のボタン）。 */
  async #onCacheFetch() {
    const app = this.#app;
    if (!app || !this.#appReady || !this.#cacheAvailable(app)) return;
    if (this.#cacheFetching) {
      // 実行中に押したら止める（旧: ボタンが「ダウンロード停止」になる）。止めたら印を進めて、
      // 走っている取得の終わり（進み具合・後始末）を捨てる
      const mapID = this.#cacheFetchingMapId ?? app.currentMapId ?? undefined;
      this.#cacheFetchToken++;
      this.#cacheFetching = false;
      this.#cacheFetchingMapId = null;
      this.#renderCache();
      try {
        await app.cancelMapTileCacheAsync(mapID);
      } catch (err) {
        console.warn(`<${MAPLAT_UI_TAG}>: cancelMapTileCacheAsync failed`, err);
      }
      await this.#refreshCache();
      return;
    }
    const mapID = app.currentMapId ?? undefined;
    const token = ++this.#cacheFetchToken;
    const generation = this.#generation;
    this.#cacheFetching = true;
    this.#cacheFetchingMapId = mapID ?? null;
    this.#renderCache();
    try {
      await app.fetchAllMapTileCacheAsync(mapID, (type, detail) => {
        // 進み具合と終わりは取得の印と #generation だけで判定する（閉じる・言語・地図の切り替えでは捨てない）
        if (token !== this.#cacheFetchToken || generation !== this.#generation)
          return;
        this.#onCacheProgress(type, detail);
      });
    } catch (err) {
      console.warn(`<${MAPLAT_UI_TAG}>: fetchAllMapTileCacheAsync failed`, err);
    }
    if (token !== this.#cacheFetchToken || generation !== this.#generation)
      return;
    // 取得が終わったら、必ず取得中の印を下ろしてから統計を読み直す
    this.#cacheFetching = false;
    this.#cacheFetchingMapId = null;
    this.#renderCache();
    await this.#refreshCache();
  }

  /**
   * 一括ダウンロードの進み具合（旧 fetchHandler。proceed は描画 1 回にまとめ、finish・stop・canceled で
   * 統計を読み直す）。detail の値は実装のもの: 数でない値は前の値で補う。取得中の地図が今の地図と
   * 違うときは、表示（統計）には反映しない。
   */
  #onCacheProgress(
    type: TileCacheProgressType,
    detail: TileCacheProgress | undefined
  ) {
    if (type === "proceed") {
      if (!this.#isCacheFetchingCurrent()) return;
      const prev = this.#cacheStats ?? {};
      const size = typeof detail?.size === "number" ? detail.size : prev.size;
      const count =
        typeof detail?.processed === "number"
          ? detail.processed
          : typeof detail?.count === "number"
            ? detail.count
            : prev.count;
      const total =
        typeof detail?.total === "number" ? detail.total : prev.total;
      this.#cacheStats = { size, count, total };
      if (typeof requestAnimationFrame === "function") {
        if (!this.#cacheFrame)
          this.#cacheFrame = requestAnimationFrame(() => {
            this.#cacheFrame = 0;
            this.#renderCache();
          });
      } else {
        this.#renderCache();
      }
      return;
    }
    if (this.#cacheFrame) {
      cancelAnimationFrame(this.#cacheFrame);
      this.#cacheFrame = 0;
    }
    this.#cacheFetching = false;
    this.#cacheFetchingMapId = null;
    this.#renderCache();
    void this.#refreshCache();
  }

  /** キャッシュの削除（旧 cache_delete のボタン）。取得の実行中は何もしない（旧と同じく押せない）。 */
  async #onCacheDelete() {
    const app = this.#app;
    if (!app || !this.#appReady || this.#cacheFetching) return;
    if (!this.#cacheAvailable(app)) return;
    try {
      await app.clearMapTileCacheAsync(app.currentMapId ?? undefined);
    } catch (err) {
      console.warn(`<${MAPLAT_UI_TAG}>: clearMapTileCacheAsync failed`, err);
    }
    await this.#refreshCache();
  }

  // ---- マーカー一覧（旧 maplat_control.ts の MarkerList・ui_init.ts の marker_list モーダル）----

  /**
   * 既定のピンの画像（層 A の getDefaultPinIcon。地図が描く既定のピンと同じ絵にする。実装の確認 6）。
   * 問い合わせの口を持たない層 A・使えない値なら共通の assets の既定のピン。
   */
  #defaultPin(): string {
    const app = this.#app as
      (MaplatAppElement & { getDefaultPinIcon?: unknown }) | null;
    if (app && typeof app.getDefaultPinIcon === "function") {
      try {
        const url = safeImageUrl(
          (app.getDefaultPinIcon as (selected?: boolean) => unknown)(false)
        );
        if (url !== undefined) return url;
      } catch {
        // 口が投げたら共通の既定のピン
      }
    }
    return assets.defaultpin;
  }

  /** 層 A の POI レイヤー（listPoiLayers の公開面。app のレイヤー → 現在の地図のレイヤー、POI の無い層は除く）。 */
  #poiLayers(): PoiLayer[] {
    const app = this.#app;
    if (!app || !this.#appReady) return [];
    try {
      return toLayerViews(app.listPoiLayers(false, true)).filter(
        l => l.pois.length > 0
      );
    } catch {
      return [];
    }
  }

  #countPois() {
    this.#poiCount = this.#poiLayers().reduce((n, l) => n + l.pois.length, 0);
    this.#renderMarkerListButton();
  }

  /** enable-marker-list が真で、POI があるときだけボタンを出す（旧 enable_marker_list・no_poi）。 */
  #renderMarkerListButton() {
    const enabled =
      this.#parseOwnAttribute(ATTR_ENABLE_MARKER_LIST) === true &&
      this.#appReady &&
      this.#poiCount > 0;
    this.#el.markerListButton.hidden = !enabled;
  }

  #openMarkerList() {
    if (!this.#appReady) return;
    if (this.#parseOwnAttribute(ATTR_ENABLE_MARKER_LIST) !== true) return;
    this.#closeMenu();
    this.#closeMapInfo();
    this.#renderMarkerList();
    this.#el.markerList.hidden = false;
    this.#el.markerListClose.focus({ preventScroll: true });
  }

  #closeMarkerList() {
    this.#el.markerList.hidden = true;
  }

  /** 一覧を作り直す（開くたび・地図の切り替え・言語の変更で。層の表示状態は listPoiLayers の hide から）。 */
  #renderMarkerList() {
    const ul = this.#el.markerLayers;
    const opened =
      ul.querySelector<HTMLElement>("li.layer.open")?.dataset.layerKey;
    ul.replaceChildren();
    for (const layer of this.#poiLayers()) {
      const name = this.translateText(layer.name) || "";
      const li = document.createElement("li");
      li.className = "layer";
      li.setAttribute("part", "marker-list-layer");
      li.dataset.layerKey = layer.namespaceID;

      const row = document.createElement("div");
      row.className = "layer-row";
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "layer-label";
      toggle.setAttribute("part", "marker-list-layer-label");
      toggle.setAttribute("aria-expanded", "false");
      const chevron = document.createElement("span");
      chevron.className = "chevron";
      chevron.setAttribute("aria-hidden", "true");
      const icon = document.createElement("img");
      icon.className = "icon";
      icon.alt = "";
      icon.src = poiIconUrl(this.#defaultPin(), layer.icon);
      const text = document.createElement("span");
      text.className = "name";
      text.textContent = name;
      toggle.append(chevron, icon, text);

      // 層の表示・非表示（旧 layer_onoff の ON/OFF の切り替え）
      const sw = document.createElement("label");
      sw.className = "switch";
      const check = document.createElement("input");
      check.type = "checkbox";
      check.setAttribute("part", "marker-list-layer-switch");
      check.checked = !layer.hide;
      check.setAttribute("aria-label", name || layer.namespaceID);
      const track = document.createElement("span");
      track.className = "track";
      track.setAttribute("aria-hidden", "true");
      sw.append(check, track);
      check.addEventListener("change", () => {
        const key = layer.namespaceID;
        if (check.checked)
          this.#call("showPoiLayer", app => app.showPoiLayer(key));
        else this.#call("hidePoiLayer", app => app.hidePoiLayer(key));
      });
      row.append(toggle, sw);

      const pois = document.createElement("ul");
      pois.className = "pois";
      pois.hidden = true;
      for (const poi of layer.pois) {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "poi";
        button.setAttribute("part", "marker-list-poi");
        const id = poiKey(poi);
        if (id !== undefined) button.dataset.poiId = id;
        const pin = document.createElement("img");
        pin.className = "icon";
        pin.alt = "";
        pin.src = poiIconUrl(this.#defaultPin(), poi.icon, layer.icon);
        const label = document.createElement("span");
        label.className = "name";
        label.textContent = this.translateText(poi.name) || "";
        button.append(pin, label);
        button.addEventListener("click", () => this.#openPoiFromList(poi));
        item.appendChild(button);
        pois.appendChild(item);
      }

      // 層の名前を押すと POI の一覧を開閉する（ほかの層は閉じる。旧と同じアコーディオン）
      toggle.addEventListener("click", () => {
        const open = !li.classList.contains("open");
        for (const other of Array.from(
          ul.querySelectorAll<HTMLElement>("li.layer.open")
        )) {
          if (other === li) continue;
          other.classList.remove("open");
          other.querySelector("ul.pois")!.toggleAttribute("hidden", true);
          other
            .querySelector(".layer-label")!
            .setAttribute("aria-expanded", "false");
        }
        li.classList.toggle("open", open);
        pois.hidden = !open;
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      if (opened === layer.namespaceID) {
        li.classList.add("open");
        pois.hidden = false;
        toggle.setAttribute("aria-expanded", "true");
      }

      li.append(row, pois);
      ul.appendChild(li);
    }
  }

  /** 一覧の POI を選ぶ: 一覧を閉じ、その POI の吹き出しを開く（selectMarker がその POI へ視点を移す）。 */
  #openPoiFromList(poi: MaplatPoi) {
    const id = poiKey(poi);
    let datum: MaplatPoi | undefined;
    if (id !== undefined) {
      try {
        datum = this.#app?.getMarker(id);
      } catch {
        datum = undefined;
      }
    }
    this.#closeMarkerList();
    this.#openPoi(datum ?? poi);
  }

  // ---- 汎用メニュー（旧 contextmenu/*・ui_marker.ts の showContextMenu・POI の重なりの選択）----
  //
  // メニューは 1 つだけ。重なった POI の選択はその使い方の 1 つで、
  // 旧 API の showContextMenu もここへ委譲する。part 名は既存の poi-menu / poi-menu-item を引き継ぐ
  // （「map-menu 以外」。map-menu は地図の切り替えメニューとともに消えた）。

  /** 重なった POI のメニュー（旧 ui_marker.ts の showContextMenu の POI 版）。 */
  #openPoiMenu(list: MaplatPoi[]) {
    this.#closeMapInfo();
    this.#poiMenuList = list;
    this.#showMenuInternal(() => this.#poiMenuItems(), {
      label: this.t("menu.poi_candidates")
    });
  }

  /** 重なった POI を項目にする（言語の切り替えのたびに作り直す）。 */
  #poiMenuItems(): MaplatMenuItem[] {
    return this.#poiMenuList.map(datum => ({
      icon: poiIconUrl(this.#defaultPin(), datum.icon),
      // 名前は信頼できない POI データ: 文字として入れる（旧は escapeHtml して HTML に組んでいた）
      text: this.translateText(datum.name) || "",
      html: false,
      callback: () => this.#openPoi(datum)
    }));
  }

  /**
   * 汎用のメニューを開く。
   * @internal 旧 UI の互換層（showContextMenu）と POI の重なりの両方が使う。移行期の口。
   */
  showMenu(options: MaplatMenuOptions): void {
    if (!options || !Array.isArray(options.items)) return;
    // 汎用のメニューに替えたら、POI の重なりのメニューではない（地図の切り替えで閉じない）
    this.#poiMenuList = [];
    this.#showMenuInternal(() => options.items, {
      at: options.at,
      label: options.label
    });
  }

  #showMenuInternal(
    provider: () => MaplatMenuItem[],
    options: { at?: { x: number; y: number }; label?: string } = {}
  ) {
    const menu = this.#el.poiMenu;
    this.#menuProvider = provider;
    this.#menuItems = provider();
    this.#menuLabel = options.label ?? this.t("menu.poi_candidates");
    this.#renderMenuItems();
    menu.hidden = false;
    // 位置: 指定（旧 API の pixel）＞ 地図を押した位置（子の要素の pointerdown）。枠の中の座標へ寄せる
    const frame = this.#root
      .querySelector<HTMLElement>(".frame")!
      .getBoundingClientRect();
    const box = menu.getBoundingClientRect();
    // `at` は枠の中の座標（引かない）。最後の pointerdown は client 座標なので枠の左上を引く
    const p = this.#lastPointer;
    let x = options.at
      ? options.at.x
      : p
        ? p.clientX - frame.left
        : frame.width / 2;
    let y = options.at
      ? options.at.y
      : p
        ? p.clientY - frame.top
        : frame.height / 2;
    if (x + box.width > frame.width) x = Math.max(0, x - box.width);
    if (y + box.height > frame.height) y = Math.max(0, y - box.height);
    menu.style.left = `${Math.round(x)}px`;
    menu.style.top = `${Math.round(y)}px`;
    menu
      .querySelector<HTMLButtonElement>("button")
      ?.focus({ preventScroll: true });
    // `menuopen`・`menuclose`（detail なし・泡立たない）は @internal: 互換層の `ui.contextMenu.on("open"/"close")` の
    // ためだけに出す移行期のイベント。層 B の公開イベントには数えない
    this.dispatchEvent(new CustomEvent("menuopen"));
  }

  #renderMenuItems() {
    const menu = this.#el.poiMenu;
    const ul = this.#el.poiMenuList;
    menu.setAttribute("aria-label", this.#menuLabel);
    ul.replaceChildren();
    this.#menuItems.forEach((item, index) => {
      const li = document.createElement("li");
      li.setAttribute("role", "none");
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("role", "menuitem");
      button.setAttribute("part", "poi-menu-item");
      button.dataset.index = `${index}`;
      const src = item.icon === undefined ? undefined : safeImageUrl(item.icon);
      if (src !== undefined) {
        const icon = document.createElement("img");
        icon.className = "icon";
        icon.alt = "";
        icon.src = src;
        button.appendChild(icon);
      }
      const text = document.createElement("span");
      text.className = "name";
      if (item.html === false) text.textContent = item.text;
      // 旧 showContextMenu の text は HTML（旧 contextmenu/html.ts:94）。サニタイザを通す
      else text.innerHTML = sanitizeHtml(item.text);
      button.appendChild(text);
      li.appendChild(button);
      ul.appendChild(li);
    });
  }

  /** メニューを閉じる。@internal 互換層の contextMenu facade も使う。 */
  closeMenu(): void {
    this.#closeMenu();
  }

  #closeMenu() {
    const menu = this.#el.poiMenu;
    const wasOpen = !menu.hidden;
    menu.hidden = true;
    this.#menuItems = [];
    this.#menuProvider = null;
    this.#poiMenuList = [];
    this.#el.poiMenuList.replaceChildren();
    // @internal の `menuclose`（上の `menuopen` の注記を参照）
    if (wasOpen) this.dispatchEvent(new CustomEvent("menuclose"));
  }

  // ---- POI の吹き出し（旧 ui_marker.ts の handleMarkerAction・poiWebControl）----

  // 値は設定ファイル・POI ファイル由来の信頼できないもの: 型は形の約束であって、描く前に値を確かめる
  #openPoi(data: MaplatPoi) {
    if (data.directgo) {
      // 旧と同じく、directgo は吹き出しを出さずに遷移する（http/https・相対 URL のときだけ）
      const href =
        typeof data.directgo === "string" ? data.directgo : data.directgo?.href;
      const blank = typeof data.directgo === "object" && !!data.directgo?.blank;
      // safeWebUrl は通した値をそのまま返す（http/https・相対 URL のとき）
      const safe = safeWebUrl(href);
      if (safe === undefined) return;
      // SR-NOV26-B-3（逆タブナビング・Referer を渡さない）: 旧と同じく noopener,noreferrer
      if (blank) window.open(safe, "_blank", "noopener,noreferrer");
      else window.location.href = safe;
      return;
    }
    if (this.#poi) this.#unselect();
    this.#poi = data;
    this.#closeMenu();
    this.#closeMarkerList();
    this.#closeMapInfo();
    this.#closeShare();
    this.#renderPoi(data);
    this.#el.modal.hidden = false;
    const id = data.namespaceID;
    if (id !== undefined)
      this.#call("selectMarker", app => app.selectMarker(id));
    // 状態 URL に開いた POI（om）を書いてから、吹き出しの共有の QR を作る
    this.#updateUrl();
    this.#renderPoiShare();
    this.#el.poiClose.focus({ preventScroll: true });
  }

  #closePoi() {
    if (!this.#poi) {
      this.#el.modal.hidden = true;
      return;
    }
    this.#unselect();
    this.#poi = null;
    this.#el.modal.hidden = true;
    this.#el.poiBody.replaceChildren();
    this.#renderPoiShare();
    this.#updateUrl();
  }

  #unselect() {
    this.#call("unselectMarker", app => app.unselectMarker());
  }

  #renderPoi(data: MaplatPoi) {
    const el = this.#el;
    // enable-poi-html-no-scroll（旧 enablePoiHtmlNoScroll）: html・url の本文に内部のスクロールを持たせない
    const noScroll =
      this.#parseOwnAttribute(ATTR_ENABLE_POI_HTML_NO_SCROLL) === true;
    el.poiTitle.textContent = this.translateText(data.name) || "";
    el.poiBody.replaceChildren();
    // html があれば Shadow DOM（スタイルの隔離。防御は sanitizeHtml）、無くて url があれば http/https の
    // ときだけ iframe。分岐と組み立ては poi-html.ts の buildPoiBody（実ブラウザの検証 m1-t5 と共有）
    const body = buildPoiBody(
      data,
      noScroll,
      value => this.translateText(value as Localized) || ""
    );
    if (body.kind !== "none") {
      if (body.node) el.poiBody.appendChild(body.node);
      return;
    }
    const swiper = this.#buildMediaSwiper(data);
    if (swiper) {
      const media = document.createElement("div");
      media.className = "poi-media";
      media.setAttribute("part", "poi-media");
      media.appendChild(swiper);
      el.poiBody.appendChild(media);
      void loadChuci();
    }
    const address = this.translateText(data.address);
    if (address) {
      const p = document.createElement("p");
      p.className = "poi-address";
      p.textContent = address;
      el.poiBody.appendChild(p);
    }
    const desc = this.translateText(data.desc);
    if (desc) {
      const p = document.createElement("p");
      p.className = "poi-desc";
      // 改行の置換はサニタイズの後（前だと <br> が入力扱いになる）
      p.innerHTML = sanitizeHtml(desc).replace(/\n/g, "<br>");
      el.poiBody.appendChild(p);
    }
  }

  /**
   * POI の image / media を Chuci のスワイパー（<cc-swiper> と <cc-swiper-slide>）にする（旧 poiWebControl と同じ組み方）。
   * 種類（image・video・youtube・3dmodel・gaussian・panorama）は type か src の拡張子で決め、表示は Chuci の
   * ビューアに任せる。属性は共有の buildSlideAttrs（cc-swiper-slide の許可リスト・URL と文字の無害化）で組む。
   * @returns メディアが 1 件も無ければ null
   */
  #buildMediaSwiper(data: MaplatPoi): HTMLElement | null {
    const raw = data.media ?? data.image;
    const items: unknown[] = raw ? (Array.isArray(raw) ? raw : [raw]) : [];
    const slides: string[] = [];
    for (const item of items) {
      const obj: Partial<PoiMediaObject> =
        typeof item === "string"
          ? { src: item }
          : item && typeof item === "object"
            ? { ...(item as PoiMediaObject) }
            : {};
      if (typeof obj.src !== "string" || obj.src === "") continue;
      const type =
        typeof obj.type === "string" && obj.type !== ""
          ? obj.type
          : detectMediaType(obj.src);
      // URL は http/https・相対 URL だけ（safeWebUrl）。buildSlideAttrs も URL の属性を同じく絞る
      const src = safeWebUrl(resolveRelativeLink(obj.src, "img"));
      if (src === undefined) continue;
      const slide: Record<string, unknown> = {
        "image-url": src,
        "image-type": type
      };
      const thumbnail =
        typeof obj.thumbnail === "string" && obj.thumbnail !== ""
          ? safeWebUrl(resolveRelativeLink(obj.thumbnail, "img"))
          : type === "image"
            ? src // 旧と同じく画像は本体をサムネイルにする
            : undefined;
      if (thumbnail !== undefined) slide["thumbnail-url"] = thumbnail;
      // ビューアに渡す追加の属性（material-url・camera-position 等。許可リストの外は buildSlideAttrs が捨てる）
      for (const [key, value] of Object.entries(obj)) {
        if (["src", "type", "thumbnail", "desc", "caption"].includes(key))
          continue;
        slide[key] = value;
      }
      // 説明（caption、旧名 desc）は多言語の値を選んでから渡す（旧は {ja,en} をそのまま文字列にしていた）
      const caption = this.translateText(
        (obj.caption ?? obj.desc) as Localized | undefined
      );
      if (caption) slide.caption = caption;
      const attrs = buildSlideAttrs(slide);
      // 本体の URL を buildSlideAttrs が落としたら（":" を含む相対パス等）スライドにしない
      if (!/(^|\s)image-url="/.test(attrs)) continue;
      slides.push(`<cc-swiper-slide ${attrs}></cc-swiper-slide>`);
    }
    if (slides.length === 0) return null;
    // 値は buildSlideAttrs が属性の文脈へエスケープ済み。<template> の中で組み（登録・実行されない）、
    // 子まで揃えてから文書へ入れる（cc-swiper は繋がった時点の子からスライドを作る）
    const holder = document.createElement("template");
    holder.innerHTML = `<cc-swiper>${slides.join("")}</cc-swiper>`;
    const swiper = holder.content.firstElementChild as HTMLElement;
    swiper.setAttribute("part", "poi-swiper");
    return document.importNode(swiper, true) as HTMLElement;
  }

  // ---- 道具 ----

  #readTransparency(app: MaplatAppElement): number {
    try {
      return Number(app.getTransparency()) || 0;
    } catch {
      return 0;
    }
  }

  #readInitialRestore(app: MaplatAppElement): Readonly<Restore> {
    try {
      return app.initialRestore ?? {};
    } catch {
      return {};
    }
  }

  /** 起動時だけ効く層 B のキーへの起動後の書き込みを警告して無視する。 */
  #rejectStartupWrite(def: AttrDef, what: string) {
    this.#warnOnce(
      `startup:${def.prop}`,
      `<${MAPLAT_UI_TAG}>: ${what} is fixed at startup and cannot be changed after the UI has started; the change was ignored.`
    );
  }

  #readAppData(): Readonly<Record<string, unknown>> | null {
    try {
      return (
        (this.#app?.appData as
          Readonly<Record<string, unknown>> | null | undefined) ?? null
      );
    } catch {
      return null;
    }
  }

  #parseOwnAttribute(def: AttrDef): unknown {
    const raw = this.getAttribute(def.attr);
    return parseAttributeValue(
      def,
      raw,
      msg => this.#warnOnce(`parse:${def.attr}:${raw}`, msg),
      MAPLAT_UI_TAG
    );
  }

  #upgradeProperty(prop: string) {
    const self = this as unknown as Record<string, unknown>;
    if (Object.prototype.hasOwnProperty.call(self, prop)) {
      const value = self[prop];
      delete self[prop];
      self[prop] = value;
    }
  }

  #warnOnce(key: string, message: string) {
    if (this.#warned.has(key)) return;
    this.#warned.add(key);
    console.warn(message);
  }
}

// 属性・プロパティのキーの型（実体は上の static ブロックで prototype に置く）
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface MaplatUiElement {
  compassAction: CompassAction | undefined;
  setDocumentTitle: boolean | undefined;
  enableShare: boolean | undefined;
  enableBorder: boolean | undefined;
  enableHideMarker: boolean | undefined;
  stateUrl: boolean | undefined;
  pwaManifest: string | boolean | undefined;
  pwaWorker: string | undefined;
  pwaScope: string | undefined;
  appEnvelope: boolean | undefined;
  enableMarkerList: boolean | undefined;
  enablePoiHtmlNoScroll: boolean | undefined;
  presentationMode: boolean | undefined;
  tapDuration: number | undefined;
  tapUiVanish: boolean | undefined;
  appId: string | undefined;
  appSrc: string | undefined;
  mapId: string | undefined;
  transparency: number | undefined;
  noRotate: boolean | undefined;
  northUp: boolean | undefined;
  homeMarginPixels: number | undefined;
  alwaysGpsOn: boolean | undefined;
  fake: boolean | undefined;
  enableCache: boolean | undefined;
  restoreSession: boolean | undefined;
  overlay: boolean | undefined;
  debug: boolean | undefined;
  icon: string | undefined;
  selectedIcon: string | undefined;
  noCenterMarker: boolean | undefined;
  centerMarkerSrc: string | undefined;
  displayMode: string | undefined;
  setting: Record<string, unknown> | undefined;
  restore: Restore | undefined;
  restoreExtensionKeys: string[] | undefined;
  googleApiKey: string | undefined;
  mapboxToken: string | undefined;
  maplibregl: unknown;
  mapboxgl: unknown;
  uiHooks: Record<string, unknown> | undefined;
  appOption: Record<string, unknown> | undefined;
  poiTemplate: string | undefined;
  poiStyle: string | undefined;
  iconTemplate: string | undefined;
}
