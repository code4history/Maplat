// <maplat-ui>: MaplatUI の Custom Element（最小版。スクラッチ実装・ライブラリ不使用・Shadow DOM（open））。
//
//   <maplat-ui app-id="sample" lang="ja">
//     <maplat-app slot="map"></maplat-app>   <!-- 省略可。省略したら <maplat-ui> が作る -->
//   </maplat-ui>
//
// 地図（層 A の <maplat-app>）に、操作ボタン（ズーム・ホーム・コンパス・GPS・透過度）・地図の切り替え
// メニュー・POI の吹き出し（メディアは Chuci のスワイパー）・マーカー一覧・重なった POI の選択メニュー・
// 共有（SNS・コピー・QR）・状態 URL（state-url）・PWA（pwa-manifest 等）を重ねる。
// 残りの機能（枠線・マーカーの非表示・ヘルプ等の画面と全言語化）は後で移す。
//
// **依存の規則（仕様 §4.6）**: 層 A は `<maplat-app>` の公開面（属性・プロパティ・メソッド・イベント）
// だけを使う。`@maplat/core` の本体（MaplatApp・mapObject・source）・`@maplat/core/element`・OpenLayers を
// import・参照しない。外部の import は `@maplat/core/common` と、POI のメディアの表示部品 `@c4h/chuci`
// （地図も層 A も持たない Web Components。初めてメディアを出すときに動的 import する）と、QR の符号化の
// `qrcode`（共有の QR を初めて出すときに share.ts が動的 import する）だけ（spec/element-deps.spec.ts が機械的に確かめる）。
// `<maplat-app>` を登録する入口（Core の "@maplat/core/element" か、別の層 A の実装の要素）はページが import する。
//
// 正本の仕様: NayutaProducts/docs/superpowers/specs/2026-10-10-maplat-web-components-interface.md
//   §4（層 B）・§4.3（層 A のキーの流し方）・§5（割り当て表）・§6.4（層 B のキー）・§10.1（人間の決定）
import {
  ELEMENT_ATTRIBUTES,
  ELEMENT_PROPERTIES,
  LAYER_A_PRO_ATTRIBUTES,
  LAYER_A_PRO_PROPERTIES,
  MAPLAT_APP_TAG,
  MAPLAT_UI_ATTRIBUTES,
  MAPLAT_UI_TAG,
  assets,
  buildSlideAttrs,
  formatAttributeValue,
  parseAttributeValue,
  sanitizeHtml,
  type AttrDef,
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
  type Viewpoint
} from "@maplat/core/common";
import { getIcon } from "../icons";
import { safeWebUrl } from "../poi_safe";
import browserLanguage from "../browserlanguage";
import { normalizeLang, pickLocalized, translateKey } from "./i18n";
import { initPwa } from "./pwa";
import {
  facebookShareUrl,
  renderQr,
  shareUrlOf,
  twitterShareUrl,
  type ShareUrlType
} from "./share";
import { buildStatePath, parseStateHash } from "./state-url";
import { MAPLAT_UI_CSS } from "./styles";

/** @maplat/ui の版（package.json の version と一致することを spec/element.spec.ts が確かめる）。 */
export const MAPLAT_UI_VERSION = "1.1.0";

/** コンパスを押したときの動き（U6: 層 B が決める）。auto は north-up が真なら北へ、偽なら回転を 0 へ。 */
export type CompassAction = "auto" | "north" | "rotation";

/** 層 A へ流す属性（§3.2 の属性と同期するキー・実装固有の機能に結びつく属性（U3））。 */
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
 * 層 A の状態のキー（map-id・transparency・display-mode。内部の操作で変わり、子が自分の属性へ書き戻す。§6.2.3）。
 * 子が書き戻した属性を「子が自分で持つキー」と取り違えないよう、子が自分で持つかは最初に繋いだ時点で決める。
 */
const LAYER_A_STATE_ATTRS: readonly AttrDef[] = LAYER_A_ATTRS.filter(
  d => d.state
);
// 子ごとの「層 B が流したキー」と「最初に繋いだ時点で子が自分で持っていた状態のキー」（繋ぎ直しても取り違えない）
const FLOWED_BY_CHILD = new WeakMap<Element, Set<string>>();
const OWNED_STATE_BY_CHILD = new WeakMap<Element, Set<string>>();
/** restore のうち層 B が使う拡張キー（§4.3。子へは流さない）。 */
const LAYER_B_RESTORE_KEYS = ["showBorder", "openedMarker"];

/** 層 B の属性の定義を共有の表（§4.2・§6.4。@maplat/core/common の MAPLAT_UI_ATTRIBUTES）から引く。 */
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
const ATTR_ENABLE_MARKER_LIST = uiAttr("enable-marker-list");
const ATTR_ENABLE_POI_HTML_NO_SCROLL = uiAttr("enable-poi-html-no-scroll");
const ATTR_ENABLE_SHARE = uiAttr("enable-share");
// 起動時だけ効くキー（§6.4・§6.5: state-url は (i)、pwa-* は (i')。起動後の変更は警告して無視する。U2）
const ATTR_STATE_URL = uiAttr("state-url");
const ATTR_PWA_MANIFEST = uiAttr("pwa-manifest");
const ATTR_PWA_WORKER = uiAttr("pwa-worker");
const ATTR_PWA_SCOPE = uiAttr("pwa-scope");
/** 層 B が自分で持つ属性（今の版で効くものだけ。§4.2 にない compass-action は本実装で決めた）。 */
const UI_ATTRS: readonly AttrDef[] = [
  ATTR_COMPASS_ACTION,
  ATTR_SET_DOCUMENT_TITLE,
  ATTR_ENABLE_MARKER_LIST,
  ATTR_ENABLE_POI_HTML_NO_SCROLL,
  ATTR_ENABLE_SHARE,
  ATTR_STATE_URL,
  ATTR_PWA_MANIFEST,
  ATTR_PWA_WORKER,
  ATTR_PWA_SCOPE
];
const UI_ATTR_BY_NAME = new Map(UI_ATTRS.map(d => [d.attr, d]));

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

/** 旧 ui_utils.resolveRelativeLink と同じ（"/" を含まない名前は既定の置き場 img/ の下）。 */
function resolveRelativeLink(file: string, fallbackPath: string): string {
  return /\//.test(file) ? file : `${fallbackPath}/${file}`;
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

/** 画像（アイコン）の URL として通すもの: http/https・相対 URL（safeWebUrl）と data:image/。それ以外は undefined。 */
function safeImageUrl(value: unknown): string | undefined {
  const web = safeWebUrl(value);
  if (web !== undefined) return web;
  return typeof value === "string" && /^data:image\//i.test(value.trim())
    ? value
    : undefined;
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
  <div class="map-title" part="map-title" hidden>
    <button type="button" class="map-title-button" part="map-title-button" aria-haspopup="true" aria-expanded="false">
      <span class="text"></span><span class="caret" aria-hidden="true">&#9660;</span>
    </button>
  </div>
  <div class="map-menu" part="map-menu" hidden>
    <section data-kind="overlay"><h3></h3><ul></ul></section>
    <section data-kind="base"><h3></h3><ul></ul></section>
  </div>
  <div class="ctl ctl-zoom" part="zoom">
    <button type="button" class="zoom-in" part="zoom-in">+</button>
    <button type="button" class="zoom-out" part="zoom-out">&#8722;</button>
  </div>
  <div class="ctl ctl-gps disable" part="gps"><button type="button"><span class="icon">${getIcon("location-crosshairs")}</span></button></div>
  <div class="ctl ctl-home" part="home"><button type="button"><span class="icon">${getIcon("house")}</span></button></div>
  <div class="ctl ctl-compass disable" part="compass"><button type="button"><span class="icon needle">${getIcon("compass")}</span></button></div>
  <div class="ctl ctl-marker-list" part="marker-list" hidden><button type="button" aria-haspopup="dialog"><span class="icon">${getIcon("list")}</span></button></div>
  <div class="ctl ctl-share" part="share" hidden><button type="button" aria-haspopup="dialog"><span class="icon">${getIcon("share-from-square")}</span></button></div>
  <input class="slider" part="slider" type="range" min="0" max="100" step="1" value="100" hidden>
  <div class="poi-menu" part="poi-menu" role="menu" hidden><ul></ul></div>
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
  <div class="toast" part="toast" role="status" aria-live="polite"></div>
</div>`;

interface Parts {
  title: HTMLElement;
  titleButton: HTMLButtonElement;
  titleText: HTMLElement;
  menu: HTMLElement;
  zoomIn: HTMLButtonElement;
  zoomOut: HTMLButtonElement;
  gps: HTMLElement;
  home: HTMLElement;
  compass: HTMLElement;
  needle: HTMLElement;
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
  toast: HTMLElement;
}

/** POI の画像・動画の 1 件をオブジェクトの形にしたもの（文字列は src だけの形）。 */
type PoiMediaObject = Exclude<MaplatPoiMedia, string>;

/**
 * <maplat-ui> の実装（最小版）。層 B の公開面（仕様 §4）のうち、最小の機能に要るものを持つ:
 *   - 属性: lang（自分の属性だけを見る。§6.2.1）・compass-action・set-document-title・層 A の全属性（子へ流す）
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

  /** 層 B の実装名（§4.4）。 */
  readonly implementation = "ui" as const;
  /** 実装の版。 */
  readonly version: string = MAPLAT_UI_VERSION;

  #root: ShadowRoot;
  #el: Parts;
  // プロパティのみのキー（層 A へ流すもの・restore・appOption）の値
  #props = new Map<string, unknown>();
  #app: MaplatAppElement | null = null;
  // 今の子へ層 B が流したキー（近い方が勝つ: 子が自分で持つキーには触れない。§4.3）。子ごとに持つ（FLOWED_BY_CHILD）
  #flowed = new Set<string>();
  // 層 B の属性を自分で書き戻している最中（attributeChangedCallback で子へ流し直さない）
  #reflecting = false;
  // 状態 URL の値で、起動時に層 B の map-id・transparency より強くするもの（§6.1・人間の決定「属性への書き戻し」）
  #urlOverrides = new Map<string, unknown>();
  #unsubscribe: (() => void) | null = null;
  #ready: Deferred = deferred();
  #appReady = false;
  #generation = 0;
  #maps: MapListItem[] = [];
  #currentMapId: string | null = null;
  #currentMeta: MapMeta | null = null;
  #viewpoint: Viewpoint | null = null;
  #poi: MaplatPoi | null = null;
  // 表示中の POI の数（poi_number。0 ならマーカー一覧のボタンを隠す＝旧 no_poi）
  #poiCount = 0;
  // 選択メニューに出している POI（ボタンの data-index で引く）
  #poiMenuItems: MaplatPoi[] = [];
  // clickMarker を受けて、同じ拍に clickMarkers が来なければ単独で開く（旧 UI は clickMarkers だけを見る）
  #pendingMarker: MaplatPoi | null = null;
  // 地図（子の要素）の最後の pointerdown の位置（選択メニューの位置。仕様 §3.7: 子の要素の DOM の pointerdown）
  #lastPointer: { clientX: number; clientY: number } | null = null;
  #sliderDragging = false;
  #warned = new Set<string>();
  #setupListener: (() => void) | null = null;
  // 起動時だけ効く層 B のキーの起動時の値（最初の #setup で取る。以後の変更は警告して無視。U2）
  #startup: Map<string, unknown> | null = null;
  // 状態 URL（state-url）: 起動時に URL から読んだ復元値（子の restore として流す。§6.1）
  #urlRestore: Restore | null = null;
  // 子が restore を自分で持つ・子の作成が先に始まっていた → ready の後に changeMap で当てる（§5.2）
  #urlRestoreLate = false;
  // URL から状態を当てている間は URL を書かない（旧 restoring）
  #restoring = false;
  // 最後に書いた状態 URL（"#!" の後ろ。同じなら書かない。旧 pathThatSet）
  #pathThatSet: string | undefined;
  #hashListener: (() => void) | null = null;
  // 枠線の表示（層 B の拡張キー showBorder。描画は後のまとまりで移す。今は受け渡しの口だけ）
  #showBorder = false;
  // 起動時の拡張キー（restore・状態 URL・restoreSession の showBorder・openedMarker）を当てたか
  #startupStateApplied = false;
  #pwaStarted = false;
  #toastTimer: ReturnType<typeof setTimeout> | undefined;

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
      title: q(".map-title"),
      titleButton: q<HTMLButtonElement>(".map-title-button"),
      titleText: q(".map-title .text"),
      menu: q(".map-menu"),
      zoomIn: q<HTMLButtonElement>(".zoom-in"),
      zoomOut: q<HTMLButtonElement>(".zoom-out"),
      gps: q(".ctl-gps"),
      home: q(".ctl-home"),
      compass: q(".ctl-compass"),
      needle: q(".ctl-compass .needle"),
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
      toast: q(".toast")
    };
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
      this.#applyLang();
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
      if (uiDef === ATTR_ENABLE_MARKER_LIST) {
        this.#renderMarkerListButton();
        if (this.#parseOwnAttribute(ATTR_ENABLE_MARKER_LIST) !== true)
          this.#closeMarkerList();
      }
      // enable-poi-html-no-scroll は次に開く POI から効く（§6.4 (ii)）
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
    // 属性と同期するキー（層 A へ流すもの・層 B のもの）。値の解釈は層 A と同じ（§6.2.2）
    for (const def of [...LAYER_A_ATTRS, ...UI_ATTRS]) {
      Object.defineProperty(proto, def.prop, {
        configurable: true,
        enumerable: true,
        get(this: MaplatUiElement) {
          // 起動時だけ効くキーは起動後は起動時の値を返す（U2）
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
          return this.#props.get(def.prop);
        },
        set(this: MaplatUiElement, value: unknown) {
          if (def.prop === "restore") this.#checkLateRestore(value);
          if (value == null) this.#props.delete(def.prop);
          else this.#props.set(def.prop, value);
          this.#flowKey(def.prop);
          if (def.prop === "appOption") this.#applyLang();
        }
      });
    }
  }

  // ---- 状態の読み取り（§4.4）----

  /** 子の ready の後、UI の部品（地図の一覧・題名・ボタンの状態）が揃ったときに解決する。 */
  get ready(): Promise<void> {
    return this.#ready.promise;
  }

  /** 使っている子（層 A の公開面だけを持つ要素）。子を見つける・作る前は null。 */
  get app(): MaplatAppElement | null {
    return this.#app;
  }

  /** 解決後の言語（lang 属性 → appOption.lang（移行用）→ 設定ファイルの lang → ブラウザ）。 */
  get currentLang(): string {
    const own = this.getAttribute("lang");
    const option = (
      this.#props.get("appOption") as Record<string, unknown> | undefined
    )?.lang;
    const fromFile = this.#readAppData()?.lang;
    const lang =
      own ||
      (typeof option === "string" && option) ||
      (typeof fromFile === "string" && fromFile) ||
      browserLanguage() ||
      "en";
    return normalizeLang(lang);
  }

  // ---- メソッド（§4.4）----

  /** 多言語の文字列から currentLang の値を選ぶ（旧 MaplatUi.translate。HTMLElement.translate と衝突させない）。 */
  translateText(fragment?: Localized): string | undefined {
    return pickLocalized(fragment, this.currentLang);
  }

  /** UI の文言（旧 MaplatUi.t。最小版は操作ボタン・メニュー・吹き出しの文言だけを持つ）。 */
  t(key: string, option?: object): string {
    return translateKey(
      this.currentLang,
      key,
      option as Record<string, unknown> | undefined
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
   * 枠線の表示を切り替える（旧 setShowBorder）。今の版は状態の受け渡しだけを持つ: 層 A の状態に拡張キー
   * showBorder（1/0）として載せ（restoreSession の localStorage・updateState に乗る）、状態 URL の sb に書く。
   * 枠線の描画（setEnvelopes）とボタンは後のまとまりで移す。地図の準備前は何もしない。
   */
  setShowBorder(flag: boolean): void {
    if (!this.#app || !this.#appReady) return;
    this.#showBorder = !!flag;
    this.#call("requestUpdateState", app =>
      app.requestUpdateState({ showBorder: flag ? 1 : 0 })
    );
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

  // ---- 子の <maplat-app> ----

  #setup() {
    if (!this.isConnected) return;
    this.#start();
    const found = this.#findChild();
    if (found) {
      if (found !== this.#app || !this.#unsubscribe) this.#bind(found);
    } else {
      // 子が無ければ <maplat-app slot="map"> を自分の light DOM の子として作る（§4.1）。
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
      const option = this.#props.get("appOption") as
        Record<string, unknown> | undefined;
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
      worker: this.#startup.get(ATTR_PWA_WORKER.prop) as string | undefined,
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
    this.#currentMapId = null;
    this.#currentMeta = null;
    this.#viewpoint = null;
    this.#pathThatSet = undefined;
    // 状態 URL: 子へ流す復元値を今の URL から読む（URL は restore より強い。§6.1・旧 index.ts:158-160）
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

    const handlers: Array<[string, (evt: Event) => void]> =
      SUBSCRIBED_EVENTS.map(type => [
        type,
        (evt: Event) => {
          if (generation !== this.#generation) return;
          this.#onAppEvent(type, (evt as CustomEvent).detail);
        }
      ]);
    for (const [type, handler] of handlers) app.addEventListener(type, handler);
    // 子の要素そのものの pointerdown（仕様 §3.7。子の中身には触れない）: 選択メニューの位置を覚える。
    // メニューが開いていれば閉じ、その押下は地図へ渡さない（旧 showContextMenu と同じ）
    const onPointerDown = (evt: Event) => {
      if (generation !== this.#generation) return;
      const pe = evt as PointerEvent;
      this.#lastPointer = { clientX: pe.clientX, clientY: pe.clientY };
      if (!this.#el.poiMenu.hidden) {
        this.#closePoiMenu();
        evt.stopPropagation();
      }
    };
    app.addEventListener("pointerdown", onPointerDown, true);
    // 子が書き戻した状態（map-id・transparency・display-mode）を、層 B が流しているキーなら層 B の属性へも映す
    // （内部の操作の後に <maplat-ui> の属性が古い値のまま残らないように。§6.2.3）
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
      observer?.disconnect();
    };

    this.#waitAppReady(app, generation).then(
      ok => {
        if (!ok || generation !== this.#generation) return;
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
   * Promise に替わる（仕様 §3.3）ので、繋ぎ直した直後に読んでも前の解決済みの Promise は掴まない。
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
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#appReady = false;
    this.#pendingMarker = null;
    this.#closeMenu();
    this.#closePoiMenu();
    this.#closeMarkerList();
    this.#closePoi();
    this.#closeShare();
  }

  // ---- 層 A のキーの流し方（§4.3）----

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
   * （restoreSession の localStorage から層 A が読む。§5.2）。
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
        this.#applyLang();
        this.#applyDocumentTitle();
        break;
      case "mapChanged":
        this.#currentMapId = (detail as MapMeta | undefined)?.mapID ?? null;
        this.#currentMeta = (detail as MapMeta | undefined) ?? null;
        this.#renderTitle();
        this.#renderMenuSelection();
        this.#renderSlider();
        // 地図の POI レイヤーは地図ごとに替わる（旧 UI は一覧を地図ごとに作り直す）
        this.#closePoiMenu();
        if (this.#appReady) this.#countPois();
        if (!this.#el.markerList.hidden) this.#renderMarkerList();
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
        const transparency = (detail as { transparency?: unknown } | undefined)
          ?.transparency;
        if (typeof transparency === "number" && !this.#sliderDragging) {
          this.#el.slider.value = `${100 - transparency}`;
        }
        this.#updateUrl();
        break;
      }
      case "moveEnd":
        // 視点の連続変化が止まったら URL を書く（旧 mapObject の moveend）
        if (detail && typeof detail === "object")
          this.#viewpoint = { ...(detail as Viewpoint) };
        this.#updateUrl();
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
    this.#currentMapId = app.currentMapId ?? this.#currentMapId;
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
    this.#renderMenu();
    this.#renderTitle();
    this.#renderSlider();
    this.#renderGps(app.gpsEnabled);
    this.#renderCompass();
    this.#countPois();
    this.#renderShareButton();
    this.#applyLang();
    this.#applyDocumentTitle();
    this.#applyStartupState(app);
  }

  /**
   * 起動時の状態を当てる（旧 initUiFromAppData の restore・restoreSession の分岐と、状態 URL の 2 回目以降の経路）。
   *   - 状態 URL を子の restore で渡せなかったら（子が restore を持つ・子の作成が先に始まっていた）changeMap で当てる
   *   - 層 B の拡張キー: restore（状態 URL を含む）が与えられていればその showBorder・openedMarker、
   *     無ければ restoreSession の localStorage の showBorder（層 A が restoreExtensionKeys で読んだ initialRestore）
   * 2 回目以降（子を繋ぎ直した）は今の showBorder を新しい子に載せ直すだけ。
   */
  #applyStartupState(app: MaplatAppElement) {
    const generation = this.#generation;
    let showBorder = this.#showBorder;
    let opened: string | undefined;
    if (!this.#startupStateApplied) {
      this.#startupStateApplied = true;
      const given = (this.#urlRestore ?? this.#props.get("restore")) as
        Restore | undefined;
      if (given && typeof given === "object") {
        showBorder = !!given.showBorder;
        if (typeof given.openedMarker === "string" && given.openedMarker)
          opened = given.openedMarker;
      } else if (app.restoreSession === true) {
        const saved = this.#readInitialRestore(app).showBorder;
        showBorder = !!parseInt(String(saved ?? "0"), 10);
      } else {
        showBorder = false;
      }
    }
    const finish = () => {
      if (generation !== this.#generation) return;
      this.setShowBorder(showBorder);
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
      hideMarker: !!state.hideMarker,
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
        // 旧 SetGPS と同じ: always-gps-on なら常に開始、そうでなければ切り替え
        if (app.alwaysGpsOn === true) return app.handleGPS(true);
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
    el.titleButton.addEventListener("click", () => {
      if (el.menu.hidden) this.#openMenu();
      else this.#closeMenu();
    });
    el.menu.addEventListener("click", evt => {
      const button = (evt.target as Element | null)?.closest?.(
        "button[data-map-id]"
      ) as HTMLButtonElement | null;
      if (!button) return;
      const mapID = button.dataset.mapId!;
      this.#closeMenu();
      if (mapID !== this.#currentMapId)
        this.#call("changeMap", app => app.changeMap(mapID));
    });
    el.poiClose.addEventListener("click", () => this.#closePoi());
    el.modal.addEventListener("click", evt => {
      if (evt.target === el.modal) this.#closePoi();
    });
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
    this.#root.addEventListener("click", evt => {
      const button = (evt.target as Element | null)?.closest?.(
        "button[data-share]"
      ) as HTMLButtonElement | null;
      if (button) this.#onShareCommand(button);
    });
    // ---- 重なった POI の選択メニュー ----
    el.poiMenu.addEventListener("click", evt => {
      const button = (evt.target as Element | null)?.closest?.(
        "button[data-index]"
      ) as HTMLButtonElement | null;
      if (!button) return;
      const datum = this.#poiMenuItems[Number(button.dataset.index)];
      this.#closePoiMenu();
      if (datum) this.#openPoi(datum);
    });
    // 自分の部品（メニューの外）を押したらメニューを閉じる。地図の押下は子の要素の pointerdown で閉じる
    this.#root.addEventListener("pointerdown", evt => {
      if (el.poiMenu.hidden) return;
      const path = evt.composedPath();
      if (path.includes(el.poiMenu)) return;
      if (this.#app && path.includes(this.#app)) return;
      this.#closePoiMenu();
    });
    this.#root.addEventListener("keydown", evt => {
      if ((evt as KeyboardEvent).key !== "Escape") return;
      if (!el.share.hidden) this.#closeShare();
      else if (!el.modal.hidden) this.#closePoi();
      else if (!el.poiMenu.hidden) this.#closePoiMenu();
      else if (!el.markerList.hidden) this.#closeMarkerList();
      else if (!el.menu.hidden) this.#closeMenu();
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
    el.titleButton.title = this.t("control.map_menu");
    el.menu.setAttribute("aria-label", this.t("control.map_menu"));
    el.menu.querySelector('section[data-kind="base"] h3')!.textContent =
      this.t("menu.base_maps");
    el.menu.querySelector('section[data-kind="overlay"] h3')!.textContent =
      this.t("menu.overlay_maps");
    for (const close of [el.poiClose, el.markerListClose]) {
      close.querySelector(".sr-only")!.textContent = this.t("html.close");
      close.title = this.t("html.close");
    }
    label(el.markerListButton, "control.marker_list");
    el.markerListTitle.textContent = this.t("html.marker_list_title");
    el.poiMenu.setAttribute("aria-label", this.t("menu.poi_candidates"));
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

  #applyLang() {
    this.#renderTexts();
    this.#renderTitle();
    this.#renderMenu();
    if (!this.#el.markerList.hidden) this.#renderMarkerList();
    if (!this.#el.poiMenu.hidden) this.#renderPoiMenuItems();
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

  #renderMenu() {
    const lists: Record<"base" | "overlay", HTMLUListElement> = {
      base: this.#el.menu.querySelector('section[data-kind="base"] ul')!,
      overlay: this.#el.menu.querySelector('section[data-kind="overlay"] ul')!
    };
    lists.base.replaceChildren();
    lists.overlay.replaceChildren();
    for (const item of this.#maps) {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.mapId = item.mapID;
      button.setAttribute("part", "map-menu-item");
      const label = this.translateText(item.label) || item.mapID;
      if (item.thumbnail) {
        const img = document.createElement("img");
        img.className = "thumb";
        img.alt = "";
        img.loading = "lazy";
        img.src = item.thumbnail;
        img.addEventListener(
          "error",
          () => img.replaceWith(this.#thumbPlaceholder(label)),
          { once: true }
        );
        button.appendChild(img);
      } else {
        button.appendChild(this.#thumbPlaceholder(label));
      }
      const span = document.createElement("span");
      span.className = "label";
      span.textContent = label;
      button.appendChild(span);
      li.appendChild(button);
      lists[item.isBasemap ? "base" : "overlay"].appendChild(li);
    }
    lists.base.parentElement!.hidden = lists.base.children.length === 0;
    lists.overlay.parentElement!.hidden = lists.overlay.children.length === 0;
    this.#renderMenuSelection();
  }

  #thumbPlaceholder(label: string): HTMLElement {
    const span = document.createElement("span");
    span.className = "thumb none";
    span.textContent = Array.from(label)[0] ?? "?";
    return span;
  }

  #renderMenuSelection() {
    for (const button of Array.from(
      this.#el.menu.querySelectorAll<HTMLButtonElement>("button[data-map-id]")
    )) {
      if (button.dataset.mapId === this.#currentMapId)
        button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    }
  }

  #openMenu() {
    if (!this.#appReady) return;
    this.#el.menu.hidden = false;
    this.#el.titleButton.setAttribute("aria-expanded", "true");
  }

  #closeMenu() {
    this.#el.menu.hidden = true;
    this.#el.titleButton.setAttribute("aria-expanded", "false");
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

  /** コンパスを押したら北へ向けるか（U6）。auto は子の north-up に従う。 */
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
    this.#closePoiMenu();
    this.#closeMarkerList();
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
      window.open(twitterShareUrl(uri, document.title), "_blank", "noopener");
    } else if (cmd === "fb") {
      window.open(
        facebookShareUrl(uri),
        "_blank",
        "width=650,height=450,menubar=no,toolbar=no,scrollbars=yes,noopener"
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
    this.#closePoiMenu();
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

  // ---- 重なった POI の選択メニュー（旧 contextmenu/*・ui_marker.ts の showContextMenu）----

  #openPoiMenu(list: MaplatPoi[]) {
    this.#closeMenu();
    this.#poiMenuItems = list;
    this.#renderPoiMenuItems();
    const menu = this.#el.poiMenu;
    menu.hidden = false;
    // 位置: 地図を押した位置（子の要素の pointerdown）を <maplat-ui> の枠の中の座標へ。枠からはみ出さないよう寄せる
    const frame = this.#root
      .querySelector<HTMLElement>(".frame")!
      .getBoundingClientRect();
    const box = menu.getBoundingClientRect();
    const p = this.#lastPointer;
    let x = p ? p.clientX - frame.left : frame.width / 2;
    let y = p ? p.clientY - frame.top : frame.height / 2;
    if (x + box.width > frame.width) x = Math.max(0, x - box.width);
    if (y + box.height > frame.height) y = Math.max(0, y - box.height);
    menu.style.left = `${Math.round(x)}px`;
    menu.style.top = `${Math.round(y)}px`;
    menu
      .querySelector<HTMLButtonElement>("button")
      ?.focus({ preventScroll: true });
  }

  #renderPoiMenuItems() {
    const ul = this.#el.poiMenuList;
    ul.replaceChildren();
    this.#poiMenuItems.forEach((datum, index) => {
      const li = document.createElement("li");
      li.setAttribute("role", "none");
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("role", "menuitem");
      button.setAttribute("part", "poi-menu-item");
      button.dataset.index = `${index}`;
      const id = poiKey(datum);
      if (id !== undefined) button.dataset.poiId = id;
      const icon = document.createElement("img");
      icon.className = "icon";
      icon.alt = "";
      icon.src = poiIconUrl(this.#defaultPin(), datum.icon);
      const text = document.createElement("span");
      text.className = "name";
      // 名前は信頼できない POI データ: textContent で入れる（旧は escapeHtml して HTML に組んでいた）
      text.textContent = this.translateText(datum.name) || "";
      button.append(icon, text);
      li.appendChild(button);
      ul.appendChild(li);
    });
  }

  #closePoiMenu() {
    this.#el.poiMenu.hidden = true;
    this.#poiMenuItems = [];
    this.#el.poiMenuList.replaceChildren();
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
      if (blank) window.open(safe, "_blank", "noopener");
      else window.location.href = safe;
      return;
    }
    if (this.#poi) this.#unselect();
    this.#poi = data;
    this.#closeMenu();
    this.#closePoiMenu();
    this.#closeMarkerList();
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
    if (data.html) {
      // 旧 m1-t5 と同じく iframe を使わず Shadow DOM（スタイルの隔離）へ描く。防御は sanitizeHtml
      // （Shadow DOM はセキュリティ境界ではない）。生の data.html を描く分岐を作らない
      const host = document.createElement("div");
      host.className = noScroll ? "poi-html" : "poi-html scroll";
      host.setAttribute("part", "poi-html");
      const shadow = host.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = "img { width: 100%; }";
      shadow.appendChild(style);
      const body = document.createElement("div");
      body.innerHTML = sanitizeHtml(this.translateText(data.html) || "");
      shadow.appendChild(body);
      el.poiBody.appendChild(host);
      return;
    }
    if (data.url) {
      // url は信頼できない POI データ: http/https（相対 URL を含む）のときだけ iframe に入れる
      const safe = safeWebUrl(this.translateText(data.url));
      if (safe === undefined) return;
      const iframe = document.createElement("iframe");
      iframe.className = noScroll ? "poi-iframe no-scroll" : "poi-iframe";
      iframe.setAttribute("part", "poi-iframe");
      if (noScroll) iframe.setAttribute("scrolling", "no");
      iframe.src = safe;
      el.poiBody.appendChild(iframe);
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
      // 改行の置換はサニタイズの後（前だと <br> が入力扱いになる。旧 m1-t4 S1 と同じ）
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

  /** 起動時だけ効く層 B のキーへの起動後の書き込みを警告して無視する（U2）。 */
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
  stateUrl: boolean | undefined;
  pwaManifest: string | boolean | undefined;
  pwaWorker: string | undefined;
  pwaScope: string | undefined;
  enableMarkerList: boolean | undefined;
  enablePoiHtmlNoScroll: boolean | undefined;
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
