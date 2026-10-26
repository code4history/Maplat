// 旧 API `MaplatUi` の互換層。
//
// 外形は旧 `MaplatUi`（`src/index.legacy.ts` に退避したあと、消した実装。
// 必要なら git の履歴から読める）と同じ:
//   - `new MaplatUi(option)`・`MaplatUi.createObject(option)`・`waitReady()`（関数プロパティ）
//   - 公開メソッド 19 本・公開フィールド 41 個・`uiHooks` の 7 段階・`ui.core`（Core の `MaplatApp`）
//   - `addEventListener` は `ol/events/Target` の外形のまま。層 A のイベント（`MAPLAT_APP_EVENTS`・
//     `ELEMENT_OWN_EVENTS`）を `{ type, detail }` で自分へ出し直す（旧は配っていなかった。
//     `docs/api/migration-ui-shadow-dom.md` の「旧 API（`MaplatUi`）を使い続ける場合」を参照）
//
// 中は `<maplat-ui>`（層 B）に委譲する。地図は層 B が作る `<maplat-app slot="map">`（層 A）。
// 旧 UI のファイル（`ui_init.ts` 等）は消したので、もう import しようがない
// （互換層が旧 UI を読まないことを `spec/legacy-deps.spec.ts`、消えていることを
// `spec/unification-removal.spec.ts` が機械で確かめる）。
//
// 差分（設計からの意図的なもの）:
//   - 設定ファイルの機能系キー: 子へ `appOption` を渡し、Core の互換モード
//     （`appOption.__maplatCompat === true`）で旧クラスと同じ読み方をする。`div`・`uiHooks`・
//     `setting` は複製しない。
//   - `tapDuration`・`tapUIVanish` は `lifecycle:appdata-ready` で `appData` から読み、
//     option に無ければ `<maplat-ui>` の属性へ流す（設定ファイルは読み直さない）。
//   - 解決時点: stateUrl なしは子の `lifecycle:setting-loaded`、ありは `host.ready`。
//     リスナーは子を繋ぐ前に張る。`lifecycle:error` は reject。
//   - uiHooks: `onUiConfigure` だけ i18n の読み込みを待ってから利用者の hook を呼ぶ。
//     他の段階はそのまま通す（`onAppdataReady`・`onCoreReady`・`onUiReady` の「UI の仕事が
//     済んでいること」は保証しない。互換層は段階の順だけを保つ）。
//   - showContextMenu・contextMenu: 層 B の汎用メニュー 1 つ（`part="poi-menu"`）へ
//     委譲する。POI の重なりの選択も同じ部品。
//   - `ui.mapID`・`ui.transparency` はホストの属性を読む。

import EventTarget from "ol/events/Target.js";
import type { MaplatApp } from "@maplat/core";
import {
  ELEMENT_OWN_EVENTS,
  MAPLAT_APP_EVENTS,
  MAPLAT_UI_TAG
} from "@maplat/core/common";

// 副作用 import で <maplat-ui> を登録する（型だけの import は消えるため、値の import と分ける）
import "../element";
// eslint-disable-next-line no-duplicate-imports
import type { MaplatUiElement } from "../element";
import { ensureMaplatAppElement } from "./core_bootstrap";
import {
  createLegacyContextMenu,
  type LegacyContextMenuFacade
} from "./legacy_context_menu";
import { createLegacyI18n, type LegacyI18n } from "./legacy_i18n";
import { createLegacySlider, type LegacySliderFacade } from "./legacy_slider";
import { createLegacySwiper } from "./legacy_swiper";
import { xyToMapIDs } from "./legacy_geo";
import { areaIndex } from "../shared/geo";
import { pickLocalized } from "../element/i18n";
import { resolveRelativeLink } from "../shared/text";
import type {
  ContextMenuItem,
  MaplatAppOption,
  MaplatUiHooks,
  MaplatUiLegacyOption,
  SwiperInstance
} from "./legacy_types";

/** 旧 `appOption` のキー → 層 A／層 B の要素のプロパティ（旧の対応表と同じ）。 */
const OPTION_PROPS: ReadonlyArray<readonly [string, string]> = [
  ["noRotate", "noRotate"],
  ["northUp", "northUp"],
  ["homeMarginPixels", "homeMarginPixels"],
  ["alwaysGpsOn", "alwaysGpsOn"],
  ["fake", "fake"],
  ["enableCache", "enableCache"],
  ["restoreSession", "restoreSession"],
  ["overlay", "overlay"],
  ["debug", "debug"],
  ["icon", "icon"],
  ["selectedIcon", "selectedIcon"],
  ["enableShare", "enableShare"],
  ["enableBorder", "enableBorder"],
  ["enableHideMarker", "enableHideMarker"],
  ["enableMarkerList", "enableMarkerList"],
  ["enablePoiHtmlNoScroll", "enablePoiHtmlNoScroll"],
  ["presentationMode", "presentationMode"],
  ["stateUrl", "stateUrl"],
  ["pwaManifest", "pwaManifest"],
  ["appEnvelope", "appEnvelope"],
  ["tapDuration", "tapDuration"],
  ["tapUIVanish", "tapUiVanish"],
  ["setDocumentTitle", "setDocumentTitle"],
  ["lang", "lang"],
  ["googleApiKey", "googleApiKey"],
  ["mapboxToken", "mapboxToken"],
  ["mapboxgl", "mapboxgl"],
  ["maplibregl", "maplibregl"]
];

/** 旧 UI で廃止したキー。警告して無視する（旧の値を写さない）。 */
const DEAD_KEYS = [
  "mobileIF",
  "disableNoimage",
  "northTop",
  "markerList",
  "translateUI"
] as const;

// 旧 API `MaplatUi` の非推奨の告知（「実行時に 1 回だけ警告」）。
// 粒度は「同一プロセスで 1 回」なので、クラスの中の `#warnOnce`（廃止した設定ファイルのキー・
// `ui._t`／`ui.i18n` への代入の警告。インスタンスごとに 1 回）ではなく、このモジュールの水準で
// 覚える。∴ `new MaplatUi` を 2 つ作っても警告は 1 回。
// `<maplat-ui>`（要素）は内部でこのクラスを作らない（要素だけを使うページでは警告しない）。
// 警告するかどうかの見分けは要らない（旧クラスを作るのは互換層の `new` の 1 か所だけ）。
let maplatUiDeprecationWarned = false;

const MAPLAT_UI_DEPRECATION_MESSAGE =
  "MaplatUi: the MaplatUi class is deprecated and will be removed in 2.0. " +
  "Use the <maplat-ui> element (@maplat/ui/element) with <maplat-app> instead.";

/**
 * 旧 API `MaplatUi` の非推奨を、同一プロセスで 1 回だけ警告する。
 * 呼ぶのは `MaplatUi` のコンストラクタだけ（`createObject` も中で `new` するので、ここ 1 か所で足りる）。
 */
function warnMaplatUiDeprecated(): void {
  if (maplatUiDeprecationWarned) return;
  maplatUiDeprecationWarned = true;
  console.warn(MAPLAT_UI_DEPRECATION_MESSAGE);
}

/**
 * 「1 回だけ」の記憶を戻す（テストの間の初期化用）。
 * `warnMaplatUiDeprecated` の付属品で、公開面ではない（`src/index.ts` の入口からは出さない）。
 * @internal
 */
export function resetMaplatUiDeprecationWarning(): void {
  maplatUiDeprecationWarned = false;
}

/**
 * 旧 `MaplatUi` の互換層。外形は旧と同じ、中は `<maplat-ui>`。
 *
 * @deprecated 旧 UI API です。1.x の間は外形（`createObject`・`waitReady`・公開メソッド・
 *   公開フィールド・`uiHooks`・`ui.core`）を変えずに残し、**次のメジャー版（2.0）で閉じます**。
 *   代わりに `<maplat-ui>` 要素（`@maplat/ui/element`）と `<maplat-app>` 要素
 *   （`@maplat/core/element`）を組み合わせて使ってください（要素が地図の上にビューアを重ねます）。
 *   移行の案内は `docs/api/maplat-ui-element.md`（要素の属性・プロパティ・メソッド・イベントと
 *   このクラスとの対応）と `docs/api/migration-ui-shadow-dom.md`（旧 UI の DOM からの移行）に
 *   あります。
 *   `new MaplatUi(...)`（`createObject` も同じ）は、同一プロセスで 1 回だけこの旨を
 *   `console.warn` で警告します。
 */
export class MaplatUi extends EventTarget {
  /** Core の `MaplatApp`（`lifecycle:setting-loaded` で入る。それまでは undefined）。 */
  core?: MaplatApp;
  appOption: MaplatAppOption;
  waitReady: () => Promise<MaplatUi>;
  waitReadyBridge?: (arg: MaplatUi) => void;
  pathThatSet?: string;
  swipers: Record<string, SwiperInstance> = {};
  mobile_if = false;
  ui_func = "default";
  datum = "default";
  selected_layer = "default";
  toms = 0;
  cache_messages: Record<string, string> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  last_toast: any;
  share_enable!: boolean;
  sliderNew!: LegacySliderFacade;
  baseSwiper!: SwiperInstance;
  overlaySwiper!: SwiperInstance;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sliderCommon: any;
  contextMenu!: LegacyContextMenuFacade;
  splashPromise!: Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _selectCandidateSources?: Record<string, any>;
  appEnvelope?: boolean;
  restoring = false;
  poiSwiper: SwiperInstance | undefined;
  html!: string;
  enablePoiHtmlNoScroll = false;
  enableShare = false;
  enableHideMarker = false;
  enableBorder = false;
  enableMarkerList = false;
  disableNoimage = false;
  alwaysGpsOn = false;
  isTouch = false;
  html_id_seed: string;
  lastClickPixel: number[] | undefined;
  lastClickCoordinate: number[] | undefined;
  lastGPSError: string | undefined;
  selectedMarkerNamespaceID: string | undefined;

  #host: MaplatUiElement | undefined;
  // 層 A のイベントの再送出を外す関数
  #unforward: (() => void) | undefined;
  #starting: Promise<MaplatUi> | undefined;
  #removed = false;
  #warned = new Set<string>();
  #initialLang: string;
  #i18n: LegacyI18n | undefined;

  /** 旧 API のコンストラクタ。`stateUrl` のときだけ、旧と同じく自分から起動を始める。 */
  constructor(appOption: MaplatAppOption) {
    super();
    // 旧 UI API の非推奨を、同一プロセスで 1 回だけ告知する
    // （重複の排除は warnMaplatUiDeprecated がモジュール水準で持つ。インスタンスごとではない）
    warnMaplatUiDeprecated();
    this.appOption = appOption ?? {};
    this.html_id_seed = `${Math.floor(Math.random() * 9000) + 1000}`;
    this.#initialLang = resolveInitialLang(appOption);
    // 起動前から在る外形。中身は `#host` ができるまで空を返す
    this.sliderNew = createLegacySlider(() => this.#host ?? null);
    this.contextMenu = createLegacyContextMenu(() => this.#host ?? null);
    this.baseSwiper = createLegacySwiper(() => this.#host ?? null, "base");
    this.overlaySwiper = createLegacySwiper(
      () => this.#host ?? null,
      "overlay"
    );
    this.swipers = { base: this.baseSwiper, overlay: this.overlaySwiper };
    // 旧 `ui_init` は appdata-ready で option の enable 系を写していた。外形は同じ（起動後に値は同じ）
    this.enableShare = appOption.enableShare === true;
    this.enableBorder = appOption.enableBorder === true;
    this.enableHideMarker = appOption.enableHideMarker === true;
    this.enableMarkerList = appOption.enableMarkerList === true;
    this.enablePoiHtmlNoScroll = appOption.enablePoiHtmlNoScroll === true;
    this.alwaysGpsOn = appOption.alwaysGpsOn === true;
    this.disableNoimage =
      (appOption as Record<string, unknown>).disableNoimage === true;
    this.isTouch = typeof window !== "undefined" && "ontouchstart" in window;
    this.appEnvelope = appOption.appEnvelope;
    this.waitReady = () => this.#ensure();
    // 旧は stateUrl のとき、コンストラクタから page.js で起動していた（waitReady を呼ばなくても動く）
    if (this.appOption.stateUrl === true) {
      queueMicrotask(() => {
        if (this.#removed) return;
        this.#ensure().catch(err => {
          console.warn(
            `<${MAPLAT_UI_TAG}>: MaplatUi startup failed (stateUrl).`,
            err
          );
        });
      });
    }
  }

  /**
   * 旧 `MaplatUi.createObject`（文書化された入口）。
   *
   * @deprecated 旧 UI API です（中で `new MaplatUi(...)` するので、同じく非推奨）。1.x の間は
   *   この口を変えずに残し、**次のメジャー版（2.0）で閉じます**。代わりに `<maplat-ui>` 要素
   *   （`@maplat/ui/element`）と `<maplat-app>` 要素（`@maplat/core/element`）を組み合わせて
   *   使ってください。移行の案内は `docs/api/maplat-ui-element.md` と
   *   `docs/api/migration-ui-shadow-dom.md` にあります。
   */
  static async createObject(option: MaplatAppOption): Promise<MaplatUi> {
    const app = new MaplatUi(option);
    return app.waitReady();
  }

  // ---- 公開メソッド 19 本（旧と同じ名前・同じ並び。増やさない）----

  /** 旧 `initializer`（UI の初期化。互換層では起動を 1 回だけ始める）。 */
  async initializer(_appOption?: MaplatAppOption): Promise<MaplatUi> {
    return this.#ensure();
  }

  /** 旧 `t`（UI の文言）。 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t(x: string, option?: any): string {
    return this.#host ? this.#host.t(x, option) : x;
  }

  /** 旧 `translate`（多言語の値から今の言語を選ぶ）。 */
  translate(
    dataFragment?: Record<string, string> | string
  ): string | undefined {
    if (!dataFragment || typeof dataFragment === "string") return dataFragment;
    if (this.#host) return this.#host.translateText(dataFragment);
    // 起動前（`<maplat-ui>` が無い）: 要素と同じ選び方（今の言語 → en → 最初の非空。全部空なら ""。
    // 旧 #251 と同じ）を `pickLocalized` 1 本で行う（写しを持たない。レビュー m3）
    return pickLocalized(dataFragment, this.lang);
  }

  /** 旧 `getShareUrl`（共有の URL）。 */
  getShareUrl(type: string): string {
    if (this.#host) return this.#host.getShareUrl(type as "app" | "view");
    if (typeof location === "undefined") return "";
    return type === "view"
      ? location.href
      : location.href.split("?")[0].split("#")[0];
  }

  /** 旧 `setShowBorder`（枠線の表示）。 */
  setShowBorder(flag: boolean): void {
    this.#host?.setShowBorder(!!flag);
  }

  /** 旧 `updateEnvelope`（枠線の描き直し）。 */
  updateEnvelope(): void {
    this.#host?.refreshEnvelopes();
  }

  /** 旧 `setHideMarker`（マーカーの非表示）。 */
  setHideMarker(flag: boolean): void {
    this.#host?.setHideMarker(!!flag);
  }

  /** 旧 `handleMarkerAction`（POI の吹き出しを開く）。 */
  handleMarkerAction(data: unknown): void {
    const datum = (data ?? {}) as {
      namespaceID?: unknown;
      id?: unknown;
    };
    const id =
      typeof datum.namespaceID === "string" && datum.namespaceID !== ""
        ? datum.namespaceID
        : typeof datum.id === "string" || typeof datum.id === "number"
          ? String(datum.id)
          : undefined;
    if (id !== undefined) this.#host?.openMarker(id);
  }

  /** 旧 `handleMarkerActionById`（id で POI の吹き出しを開く）。 */
  handleMarkerActionById(id: string): void {
    this.#host?.openMarker(id);
  }

  /** 旧 `showContextMenu`（汎用メニュー。POI の重なりの選択も同じ部品）。 */
  showContextMenu(list: ContextMenuItem[]): void {
    if (!this.contextMenu) return;
    this.contextMenu.clear();
    this.contextMenu.extend(list);
    // 旧は `lastClickPixel` が無いと開かなかった。互換層は位置が無ければ中央に出す（旧の警告は出さない）
    this.contextMenu.Internal.openMenu(
      this.lastClickPixel,
      this.lastClickCoordinate
    );
  }

  /** 旧 `xyToMapIDs`（点に重なる地図の mapID。範囲の狭い順）。 */
  async xyToMapIDs(xy: number[], threshold = 10): Promise<string[]> {
    return xyToMapIDs(this.core, this.#host, xy, threshold);
  }

  /** 旧 `areaIndex`（4 点の多角形の面積）。 */
  areaIndex(xys: number[][]): number {
    return areaIndex(xys);
  }

  /** 旧 `checkOverlayID`（重ねる地図の行にその地図があるか）。 */
  checkOverlayID(mapID: string): boolean {
    return this.#host?.hasMap(mapID, "overlay") === true;
  }

  /** 旧 `modalSetting`（画面の切り替え）。 */
  modalSetting(type: string): void {
    this.#host?.openModalByLegacyName(type);
  }

  /** 旧 `ellips`（見出しの省略表示）。移設先は `src/shared/text.ts` の `ellipsize`。 */
  ellips(): void {
    this.#host?.refreshEllipsis();
  }

  /** 旧 `updateUrl`（状態 URL の書き直し）。 */
  updateUrl(): void {
    this.#host?.refreshStateUrl();
  }

  /** 旧 `resolveRelativeLink`（相対 URL の解決）。 */
  resolveRelativeLink(file: string, fallbackPath: string | null): string {
    return resolveRelativeLink(file, fallbackPath);
  }

  /** 旧 `showToast`（短い知らせ）。 */
  showToast(message: string, target?: HTMLElement): void {
    this.#host?.showToast(message, target);
  }

  /** 旧 `remove`（UI の後片付け。地図（子の要素）ごと外す）。 */
  remove(): void {
    this.#removed = true;
    this.#unforward?.();
    this.#unforward = undefined;
    this.contextMenu?.detach();
    this.sliderNew?.detach();
    this.#host?.remove();
    this.#host = undefined;
    this.core = undefined;
  }

  // ---- 旧のフィールドのうち、層 B の今の値を読むもの（getter なのでメソッドに数えない）----

  /** 旧 `ui.lang`（今の言語）。 */
  get lang(): string {
    return this.#host ? this.#host.currentLang : this.#initialLang;
  }

  /**
   * 旧 `ui.lang = …`（旧は書き換えられるフィールド。レビュー m2）。ホストの `lang` 属性へ流す
   * （起動前は、起動するまでの `lang` の読み値として覚える）。文字列でなければ警告して無視する。
   *
   * **起動前の代入は起動後の言語にならない**（積み残しの Info）。`#createHost` は `option.lang`
   * しか流さないので、起動後は要素が言語を決める（`lang` 属性 → 設定ファイル → ブラウザ）。
   * 旧も `ui_init` が起動時に言語を上書きしていたので、振る舞いは旧と同じ。
   */
  set lang(value: string) {
    if (typeof value !== "string" || value === "") {
      this.#warnOnce(
        "set:lang",
        `<${MAPLAT_UI_TAG}>: MaplatUi.lang must be a non-empty string; the assignment was ignored.`
      );
      return;
    }
    if (this.#host) this.#host.lang = value;
    else this.#initialLang = value;
  }

  /** 旧 `ui.mapID`（今の地図の id。ホストの `map-id` 属性を読む）。 */
  get mapID(): string | undefined {
    if (!this.#host) return undefined;
    try {
      return this.#host.mapId ?? this.core?.from?.mapID ?? undefined;
    } catch {
      return this.core?.from?.mapID ?? undefined;
    }
  }

  /** 旧 `ui.transparency`（透過度。ホストの `transparency` 属性を読む）。 */
  get transparency(): number | undefined {
    if (!this.#host) return undefined;
    const attr = this.#host.getAttribute("transparency");
    if (attr !== null && attr !== "") {
      const n = Number(attr);
      if (Number.isFinite(n)) return n;
    }
    try {
      return this.core?.getTransparency();
    } catch {
      return undefined;
    }
  }

  /** 旧 `ui._t`（訳の関数。i18n が入るまでは undefined）。 */
  get _t():
    ((x: string, option?: Record<string, unknown>) => string) | undefined {
    const host = this.#host;
    if (!host) return undefined;
    return (x: string, option?: Record<string, unknown>) => host.t(x, option);
  }

  /** 旧 `ui._t = …` は受けない（訳は `<maplat-ui>` が持つ）。strict でも例外にせず、警告して無視する（m2）。 */
  set _t(_value: unknown) {
    this.#warnOnce(
      "set:_t",
      `<${MAPLAT_UI_TAG}>: MaplatUi._t is read-only now (translations live in <maplat-ui>); the assignment was ignored.`
    );
  }

  /** 旧 `ui.i18n`（限定 facade。`docs/api/migration-ui-shadow-dom.md` の「型の変化」を参照）。 */
  get i18n(): LegacyI18n | undefined {
    if (!this.#host) return undefined;
    this.#i18n ??= createLegacyI18n(() => this.#host ?? null);
    return this.#i18n;
  }

  /**
   * 旧 `ui.i18n = …` は受けない（翻訳ライブラリのインスタンスはもう無い。限定 facade だけを返す）。
   * strict でも例外にせず、警告して無視する（m2）。
   */
  set i18n(_value: unknown) {
    this.#warnOnce(
      "set:i18n",
      `<${MAPLAT_UI_TAG}>: MaplatUi.i18n is read-only now (a limited facade over <maplat-ui>); the assignment was ignored.`
    );
  }

  // ---- 起動 ----

  #stateUrl(): boolean {
    return (this.appOption as Record<string, unknown>).stateUrl === true;
  }

  /** 起動を 1 回だけ始める（`waitReady`・`initializer`・stateUrl の自動起動が同じ Promise を共有する）。 */
  #ensure(): Promise<MaplatUi> {
    if (!this.#starting) this.#starting = this.#startup();
    return this.#starting;
  }

  async #startup(): Promise<MaplatUi> {
    await ensureMaplatAppElement();
    if (this.#removed) return this;
    const option = this.appOption as MaplatUiLegacyOption &
      Record<string, unknown>;
    // 状態 URL の復元があるときは、旧と同じく復元中は URL を書かない
    const hash = typeof location !== "undefined" ? location.hash : "";
    if (this.#stateUrl() && /[#!&/]s:/.test(hash)) this.restoring = true;

    const host = this.#createHost();
    this.#host = host;
    // 旧 UI は起動時に `@c4h/chuci`（cc-swiper 等）を登録していた。旧 API の利用者のために先に読む
    void host.preloadMediaViewer();
    // 旧 `splashPromise`（onUiDomReady で置かれていた）は、層 B の `ready` に結ぶ
    this.splashPromise = host.ready.then(
      () => undefined,
      () => undefined
    );
    this.contextMenu.attach(host);
    this.sliderNew.attach();
    this.#unforward = this.#forwardEvents(host);
    // 旧 `lastClickPixel` / `lastClickCoordinate`（メニューの位置・利用者が読む値）。子の pointerdown を
    // ホストで受けて、<maplat-ui> の枠の中の座標と地図の座標に直す（旧 ui_init と同じ役割）
    host.addEventListener(
      "pointerdown",
      (evt: Event) => {
        const pe = evt as PointerEvent;
        const rect = host.getBoundingClientRect();
        const pixel = [
          Math.round(pe.clientX - rect.left),
          Math.round(pe.clientY - rect.top)
        ];
        this.lastClickPixel = pixel;
        try {
          this.lastClickCoordinate =
            this.core?.mapObject?.getCoordinateFromPixel(pixel) as
              number[] | undefined;
        } catch {
          this.lastClickCoordinate = undefined;
        }
      },
      true
    );

    const stateUrl = this.#stateUrl();
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const settle = (err?: unknown) => {
        if (settled) return;
        settled = true;
        if (err === undefined) resolve();
        else reject(err);
      };
      // **子を繋ぐ前に**張る。`lifecycle:setting-loaded` は hook を await した後に出る
      host.addEventListener("lifecycle:setting-loaded", () => {
        if (this.#removed) {
          settle();
          return;
        }
        this.core = readCore(host) ?? this.core;
        if (!stateUrl) {
          this.restoring = false;
          settle();
        }
      });
      host.addEventListener("lifecycle:appdata-ready", () => {
        this.#applyFeatureKeys(host);
      });
      host.addEventListener("lifecycle:error", (evt: Event) => {
        settle(errorOf(evt));
      });
      if (stateUrl) {
        host.ready.then(
          () => {
            this.core = readCore(host) ?? this.core;
            this.restoring = false;
            settle();
          },
          (err: unknown) => settle(err)
        );
      }
      // ここで初めて文書へ繋ぐ（`connectedCallback` から層 A の起動が始まる）
      this.#container(option).appendChild(host);
    });
    if (this.#removed) host.remove();
    return this;
  }

  /**
   * 層 A のイベント（子の `<maplat-app>` が出し、ホストまで泡立つ）を `MaplatUi` 自身へ出し直す。
   * 旧 `app.addEventListener("clickMarker", fn)`（`demo/dev.ts`）が意味を持つ。
   * `ol/events/Target` の `dispatchEvent` は `target` を代入するので、DOM の Event ではなく
   * `{ type, detail }` のプレーンなオブジェクトで出す（m4）。`uiReady` は要素だけのイベントなので出さない。
   * 子を繋ぐ前に張る（起動の lifecycle も届くように）。
   */
  #forwardEvents(host: MaplatUiElement): () => void {
    const types = [...MAPLAT_APP_EVENTS, ...ELEMENT_OWN_EVENTS] as string[];
    const handler = (evt: Event) => {
      if (this.#removed) return;
      this.dispatchEvent({
        type: evt.type,
        detail: (evt as CustomEvent).detail
      } as unknown as Parameters<EventTarget["dispatchEvent"]>[0]);
    };
    for (const type of types) host.addEventListener(type, handler);
    return () => {
      for (const type of types) host.removeEventListener(type, handler);
    };
  }

  /** 地図を置く要素（旧 `div`。要素ならそれ、id ならその要素、無ければ `#map_div` か新しい div）。 */
  #container(option: Record<string, unknown>): HTMLElement {
    const div = option.div;
    if (div instanceof HTMLElement) return div;
    if (typeof div === "string" && div !== "") {
      const found = document.getElementById(div);
      if (found) return found;
    }
    const existing = document.getElementById("map_div");
    if (existing) return existing;
    const created = document.createElement("div");
    created.id = "map_div";
    document.body.appendChild(created);
    return created;
  }

  /**
   * `<maplat-ui>` を作り、旧 `option` を属性・プロパティへ流す。
   * 文書へ繋ぐ前に済ませる（繋がった拍で層 A の起動が始まるため）。
   */
  #createHost(): MaplatUiElement {
    const host = document.createElement(MAPLAT_UI_TAG) as MaplatUiElement;
    // 旧 API の地図（旧 Core の `<div id="map_div_front" class="map">`）と旧 UI の部品は、
    // `position:absolute; top:0; left:0; right:0; bottom:0` で**いちばん近い位置指定の祖先**を
    // 埋めていた（`#map_div` 自体は高さ 0 のままでもよかった。旧 fixture・旧デモはこの形）。
    // その契約を保つため、ホストも同じ絶対配置で広げる（`<maplat-ui>` 単体の既定 400px は上書き）
    host.style.display = "block";
    host.style.position = "absolute";
    host.style.top = "0";
    host.style.left = "0";
    host.style.right = "0";
    host.style.bottom = "0";
    host.style.width = "auto";
    host.style.height = "auto";
    const option = this.appOption as MaplatUiLegacyOption &
      Record<string, unknown>;
    for (const [key, prop] of OPTION_PROPS) {
      const value = option[key];
      if (value === undefined || value === null) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (host as any)[prop] = value;
    }
    // `pwaWorker` は false/null で「Service Worker を登録しない」なので、属性には流さない
    const worker = option.pwaWorker;
    if (typeof worker === "string" && worker !== "") host.pwaWorker = worker;
    // 旧 pwa_init.ts: false / null は「登録しない」（manifest と apple-touch-icon は足す）
    else if (worker === false || worker === null) host.disablePwaWorker();
    const scope = option.pwaScope;
    if (typeof scope === "string" && scope !== "") host.pwaScope = scope;
    // 旧 Core の appid の既定は "sample"
    host.appId =
      typeof option.appid === "string" && option.appid !== ""
        ? option.appid
        : "sample";
    // 設定ファイルの中身（層 B のプロパティ。旧 Core の `setting`）
    if (option.setting !== undefined)
      host.setting = option.setting as Record<string, unknown>;
    const restore = option.restore;
    if (restore && typeof restore === "object") {
      host.restore = restore as unknown as MaplatUiElement["restore"];
    }
    // 子へ渡す `appOption`。`div`・`uiHooks`・`setting` は複製しない。
    // `__maplatCompat: true` で Core は旧クラスと同じく設定ファイルの機能系キーを読む。
    const appOptionCopy: Record<string, unknown> = {
      ...option,
      __maplatCompat: true
    };
    delete appOptionCopy.div;
    delete appOptionCopy.uiHooks;
    delete appOptionCopy.setting;
    host.appOption = appOptionCopy;
    // uiHooks: `onUiConfigure` だけ i18n の読み込みを待ってから利用者の hook を呼ぶ
    host.uiHooks = wrapUiHooks(host, option.uiHooks);
    // 廃止したキーは警告して無視する（旧の値を写さない）
    for (const key of DEAD_KEYS) {
      if (option[key] !== undefined) {
        this.#warnOnce(
          `dead:${key}`,
          `<${MAPLAT_UI_TAG}>: appOption.${key} is no longer used and was ignored.`
        );
      }
    }
    return host;
  }

  /**
   * 設定ファイルの機能系キーのうち、層 B が自分で読む 2 つ。
   * `lifecycle:appdata-ready` のとき、option に無ければ `appData` から読んで属性へ流す。
   * **設定ファイルを読み直さない**（すでに Core が読んだ `appData` を見る）。
   */
  #applyFeatureKeys(host: MaplatUiElement) {
    const option = this.appOption as Record<string, unknown>;
    const appData = readCore(host)?.appData as
      Record<string, unknown> | undefined;
    if (!appData) return;
    if (option.tapDuration === undefined) {
      const value = appData.tapDuration;
      if (typeof value === "number" && Number.isFinite(value))
        host.tapDuration = value;
    }
    if (option.tapUIVanish === undefined) {
      const value = appData.tapUIVanish;
      if (typeof value === "boolean") host.tapUiVanish = value;
    }
  }

  #warnOnce(key: string, message: string) {
    if (this.#warned.has(key)) return;
    this.#warned.add(key);
    console.warn(message);
  }
}

/** 旧 Core の `MaplatApp` を子の要素から取り出す（移行期の逃げ道。`@internal get app()`）。 */
function readCore(host: MaplatUiElement): MaplatApp | undefined {
  const element = host.app as
    (MaplatUiElement["app"] & { app?: MaplatApp }) | null;
  return element?.app;
}

/** `lifecycle:error` の detail から Error を取り出す。 */
function errorOf(evt: Event): unknown {
  const detail = (evt as CustomEvent).detail as
    { error?: unknown; message?: unknown } | undefined;
  if (detail?.error instanceof Error) return detail.error;
  if (typeof detail?.message === "string") return new Error(detail.message);
  return new Error(`<${MAPLAT_UI_TAG}>: the lifecycle failed.`);
}

/** 旧 `ui.lang` の起動前の値（旧の既定 "ja" と同じ決め方）。 */
function resolveInitialLang(option: MaplatAppOption): string {
  if (typeof option.lang === "string" && option.lang !== "") return option.lang;
  if (typeof navigator !== "undefined" && navigator.language)
    return navigator.language;
  return "ja";
}

/**
 * 旧 `uiHooks` を層 B へ渡す形にする。
 * `onUiConfigure` だけ、旧と同じく i18n を読み終えてから利用者の hook を呼ぶ。
 * それ以外の段階はそのまま通す（UI の仕事が済んでいることは保証しない）。
 */
function wrapUiHooks(
  host: MaplatUiElement,
  userHooks: MaplatUiHooks | undefined
): Record<string, unknown> {
  const hooks: Record<string, unknown> = { ...(userHooks ?? {}) };
  const userUiConfigure = userHooks?.onUiConfigure;
  hooks.onUiConfigure = async (context: unknown) => {
    try {
      await host.whenI18nReady();
    } catch (err) {
      console.warn(
        `<${MAPLAT_UI_TAG}>: failed to load the language files before onUiConfigure.`,
        err
      );
    }
    if (userUiConfigure) return userUiConfigure(context);
    return undefined;
  };
  return hooks;
}
