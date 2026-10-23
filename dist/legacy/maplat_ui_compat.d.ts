import { default as EventTarget } from 'ol/events/Target.js';
import { MaplatApp } from '@maplat/core';
import { LegacyContextMenuFacade } from './legacy_context_menu';
import { LegacyI18n } from './legacy_i18n';
import { LegacySliderFacade } from './legacy_slider';
import { ContextMenuItem, MaplatAppOption, SwiperInstance } from './legacy_types';
/** 旧 `MaplatUi` の互換層。外形は旧と同じ、中は `<maplat-ui>`。 */
export declare class MaplatUi extends EventTarget {
    #private;
    /** Core の `MaplatApp`（`lifecycle:setting-loaded` で入る。それまでは undefined）。 */
    core?: MaplatApp;
    appOption: MaplatAppOption;
    waitReady: () => Promise<MaplatUi>;
    waitReadyBridge?: (arg: MaplatUi) => void;
    pathThatSet?: string;
    swipers: Record<string, SwiperInstance>;
    mobile_if: boolean;
    ui_func: string;
    datum: string;
    selected_layer: string;
    toms: number;
    cache_messages: Record<string, string>;
    last_toast: any;
    share_enable: boolean;
    sliderNew: LegacySliderFacade;
    baseSwiper: SwiperInstance;
    overlaySwiper: SwiperInstance;
    sliderCommon: any;
    contextMenu: LegacyContextMenuFacade;
    splashPromise: Promise<void>;
    _selectCandidateSources?: Record<string, any>;
    appEnvelope?: boolean;
    restoring: boolean;
    poiSwiper: SwiperInstance | undefined;
    html: string;
    enablePoiHtmlNoScroll: boolean;
    enableShare: boolean;
    enableHideMarker: boolean;
    enableBorder: boolean;
    enableMarkerList: boolean;
    disableNoimage: boolean;
    alwaysGpsOn: boolean;
    isTouch: boolean;
    html_id_seed: string;
    lastClickPixel: number[] | undefined;
    lastClickCoordinate: number[] | undefined;
    lastGPSError: string | undefined;
    selectedMarkerNamespaceID: string | undefined;
    /** 旧 API のコンストラクタ。`stateUrl` のときだけ、旧と同じく自分から起動を始める。 */
    constructor(appOption: MaplatAppOption);
    /** 旧 `MaplatUi.createObject`（文書化された入口）。 */
    static createObject(option: MaplatAppOption): Promise<MaplatUi>;
    /** 旧 `initializer`（UI の初期化。互換層では起動を 1 回だけ始める）。 */
    initializer(_appOption?: MaplatAppOption): Promise<MaplatUi>;
    /** 旧 `t`（UI の文言）。 */
    t(x: string, option?: any): string;
    /** 旧 `translate`（多言語の値から今の言語を選ぶ）。 */
    translate(dataFragment?: Record<string, string> | string): string | undefined;
    /** 旧 `getShareUrl`（共有の URL）。 */
    getShareUrl(type: string): string;
    /** 旧 `setShowBorder`（枠線の表示）。 */
    setShowBorder(flag: boolean): void;
    /** 旧 `updateEnvelope`（枠線の描き直し）。 */
    updateEnvelope(): void;
    /** 旧 `setHideMarker`（マーカーの非表示）。 */
    setHideMarker(flag: boolean): void;
    /** 旧 `handleMarkerAction`（POI の吹き出しを開く）。 */
    handleMarkerAction(data: unknown): void;
    /** 旧 `handleMarkerActionById`（id で POI の吹き出しを開く）。 */
    handleMarkerActionById(id: string): void;
    /** 旧 `showContextMenu`（汎用メニュー。POI の重なりの選択も同じ部品）。 */
    showContextMenu(list: ContextMenuItem[]): void;
    /** 旧 `xyToMapIDs`（点に重なる地図の mapID。範囲の狭い順）。 */
    xyToMapIDs(xy: number[], threshold?: number): Promise<string[]>;
    /** 旧 `areaIndex`（4 点の多角形の面積）。 */
    areaIndex(xys: number[][]): number;
    /** 旧 `checkOverlayID`（重ねる地図の行にその地図があるか）。 */
    checkOverlayID(mapID: string): boolean;
    /** 旧 `modalSetting`（画面の切り替え）。 */
    modalSetting(type: string): void;
    /** 旧 `ellips`（見出しの省略表示）。移設先は `src/shared/text.ts` の `ellipsize`。 */
    ellips(): void;
    /** 旧 `updateUrl`（状態 URL の書き直し）。 */
    updateUrl(): void;
    /** 旧 `resolveRelativeLink`（相対 URL の解決）。 */
    resolveRelativeLink(file: string, fallbackPath: string | null): string;
    /** 旧 `showToast`（短い知らせ）。 */
    showToast(message: string, target?: HTMLElement): void;
    /** 旧 `remove`（UI の後片付け。地図（子の要素）ごと外す）。 */
    remove(): void;
    /** 旧 `ui.lang`（今の言語）。 */
    get lang(): string;
    /**
     * 旧 `ui.lang = …`（旧は書き換えられるフィールド。レビュー m2）。ホストの `lang` 属性へ流す
     * （起動前は、起動するまでの `lang` の読み値として覚える）。文字列でなければ警告して無視する。
     *
     * **起動前の代入は起動後の言語にならない**（積み残しの Info）。`#createHost` は `option.lang`
     * しか流さないので、起動後は要素が言語を決める（`lang` 属性 → 設定ファイル → ブラウザ）。
     * 旧も `ui_init` が起動時に言語を上書きしていたので、振る舞いは旧と同じ。
     */
    set lang(value: string);
    /** 旧 `ui.mapID`（今の地図の id。ホストの `map-id` 属性を読む）。 */
    get mapID(): string | undefined;
    /** 旧 `ui.transparency`（透過度。ホストの `transparency` 属性を読む。M6）。 */
    get transparency(): number | undefined;
    /** 旧 `ui._t`（訳の関数。i18n が入るまでは undefined）。 */
    get _t(): ((x: string, option?: Record<string, unknown>) => string) | undefined;
    /** 旧 `ui._t = …` は受けない（訳は `<maplat-ui>` が持つ）。strict でも例外にせず、警告して無視する（m2）。 */
    set _t(_value: unknown);
    /** 旧 `ui.i18n`（限定 facade。設計 §3 L8・L9）。 */
    get i18n(): LegacyI18n | undefined;
    /**
     * 旧 `ui.i18n = …` は受けない（翻訳ライブラリのインスタンスはもう無い。限定 facade だけを返す）。
     * strict でも例外にせず、警告して無視する（m2）。
     */
    set i18n(_value: unknown);
}
