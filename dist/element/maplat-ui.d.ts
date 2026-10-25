import { LngLat, Localized, MaplatAppElement, Restore } from '@maplat/core/common';
import { ShareUrlType } from './share';
import { MapSlider } from './slider';
/** @maplat/ui の版（package.json の version と一致することを spec/element.spec.ts が確かめる）。 */
export declare const MAPLAT_UI_VERSION = "1.1.0";
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
    at?: {
        x: number;
        y: number;
    };
    /** 読み上げ名（既定は POI の候補の文言） */
    label?: string;
}
declare const BaseElement: typeof HTMLElement;
/**
 * <maplat-ui> の実装（最小版）。層 B の公開面のうち、最小の機能に要るものを持つ:
 *   - 属性: lang（自分の属性だけを見る）・compass-action・set-document-title・層 A の全属性（子へ流す）
 *   - プロパティ: 層 A のプロパティのみのキー（子へ流す）・restore（拡張キーを分ける）・appOption
 *   - 読み取り: ready・implementation・version・app・currentLang
 *   - メソッド: translateText・t・openMarker
 *   - イベント: uiReady（層 A のイベントは子から泡立って通る）
 */
export declare class MaplatUiElement extends BaseElement {
    #private;
    static get observedAttributes(): string[];
    /** 層 B の実装名。 */
    readonly implementation: "ui";
    /** 実装の版。 */
    readonly version: string;
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
    /** 子の ready の後、UI の部品（地図の一覧・題名・ボタンの状態）が揃ったときに解決する。 */
    get ready(): Promise<void>;
    /** 使っている子（層 A の公開面だけを持つ要素）。子を見つける・作る前は null。 */
    get app(): MaplatAppElement | null;
    /**
     * 解決後の言語（lang 属性 → appOption.lang（移行用・起動時の値）→ 設定ファイルの lang → ブラウザ）。
     * appOption は起動時だけ効くので、起動後に代入してもこの解決は変わらない。
     */
    get currentLang(): string;
    /** 多言語の文字列から currentLang の値を選ぶ（旧 MaplatUi.translate。HTMLElement.translate と衝突させない）。 */
    translateText(fragment?: Localized): string | undefined;
    /** UI の文言（旧 MaplatUi.t。言語ファイルを読み終えるまでは内蔵の辞書を使う）。 */
    t(key: string, option?: object): string;
    /** POI の吹き出しを id で開く（旧 handleMarkerActionById）。地図の準備前・見つからないときは何もしない。 */
    openMarker(id: string): void;
    /**
     * 枠線の表示を切り替える（旧 setShowBorder）。層 A の状態に拡張キー showBorder（1/0）として載せ
     * （restoreSession の localStorage・updateState に乗る）、層 A の setEnvelopes で地図の範囲を描く
     * （supports("envelopes") が偽の層 A では何も描かない）。状態 URL の sb にも書く。地図の準備前は何もしない。
     */
    setShowBorder(flag: boolean): void;
    /**
     * 指定した経緯度に重なる（範囲を持つ）地図の mapID を、範囲の狭い順に返す（旧 ui_marker.ts の
     * xyToMapIDs）。層 A の公開面だけで求める: 画面の 4 隅（getViewExtent）と各地図の範囲
     * （getMapEnvelope）を経緯度で比べる（old は merc と turf を使っていた）。
     * 今の地図は候補から外し、範囲の面積が画面の面積の threshold 倍以上の地図は外す（旧と同じ既定 10）。
     * 地図の準備前は空の配列。
     */
    mapsAt(point: LngLat, threshold?: number): Promise<string[]>;
    /**
     * マーカーの表示を切り替える（旧 setHideMarker）。層 A の hideAllMarkers / showAllMarkers を呼ぶ
     * （層 A が同じ値を状態の hideMarker に書くので、restoreSession・updateState・状態 URL の hm に乗る）。
     * 地図の準備前は何もしない。
     */
    setHideMarker(flag: boolean): void;
    /**
     * 共有する URL（旧 getShareUrl と同じ）。"view" は今の表示の URL（state-url なら状態を書いてから読む）、
     * "app" は ? と # を落としたアプリの URL。
     */
    getShareUrl(type: ShareUrlType): string;
    /**
     * 短い知らせを出す（旧 showToast。旧は document.body に置いていた。ここでは Shadow DOM の中に置く）。
     * target を渡すとその近く（.recipient の囲みがあればその中央）に、無ければ下の中央に 1.5 秒出す。
     */
    showToast(message: string, target?: HTMLElement): void;
    /**
     * 言語ファイルの読み込みが済むまで待つ。
     * @internal 旧 UI の onUiConfigure は i18n を読んでから利用者の hook を呼んでいた
     *   （`docs/ui-core-lifecycle.md` の「What Maplat UI does per phase」を参照）。
     *   互換層はこの口を待ってから hook を呼ぶ。読み込みに失敗しても reject しない（en へ落ちる）。
     */
    whenI18nReady(): Promise<void>;
    /** @internal 状態 URL を今の状態で書き直す（旧 MaplatUi.updateUrl）。 */
    refreshStateUrl(): void;
    /** @internal 枠線（envelope）を描き直す（旧 MaplatUi.updateEnvelope）。 */
    refreshEnvelopes(): void;
    /** @internal スライダーの見出しを詰め直す（旧 MaplatUi.ellips の移設先。`ellipsize` を呼ぶ）。 */
    refreshEllipsis(): void;
    /** @internal その地図がその行のスライダーにあるか（旧 checkOverlayID。overlay は重ねる地図の行）。 */
    hasMap(mapID: string, kind?: "base" | "overlay"): boolean;
    /**
     * @internal 旧 API の `pwaWorker: false / null`（Service Worker を登録しない。manifest は足す）。
     *   互換層が起動前に呼ぶ。属性の `pwa-worker` には「登録しない」の値が無いので、移行期の口として置く。
     */
    disablePwaWorker(): void;
    /**
     * @internal POI のメディアの表示部品（`@c4h/chuci` の `cc-swiper` 等）を先に読み込む。
     *   旧 UI は起動時に Chuci を静的に import して登録していた（旧 ui_marker.ts）。旧 API の利用者は
     *   起動の後に `cc-swiper` を自分のページで使えたので、互換層が起動時に呼ぶ（新 UI は最初のメディアで読む）。
     */
    preloadMediaViewer(): Promise<void>;
    /**
     * @internal 透過度のスライダーを使える・使えないにする（旧 `sliderNew.setEnable`。互換層が委譲する）。
     *   旧と同じく次の地図の切り替えで「重ね地図のときだけ使える」に戻る。
     */
    setTransparencyEnabled(flag: boolean): void;
    /** @internal 地図の切り替えスライダー（旧 baseSwiper / overlaySwiper の facade が委譲する先）。 */
    slider(kind: "base" | "overlay"): MapSlider | null;
    /** @internal 文言のキーが訳せるか（旧 i18n.exists の近似。キーのままなら訳が無い）。 */
    hasTranslation(key: string): boolean;
    /**
     * 旧 modalSetting(type) の名前で画面を開く。
     * @internal 旧 UI は 1 つのモーダルに class を付け替えていた。ここでは画面ごとの部品を開く。
     *   種類: load（スプラッシュ）・poi・share・help・map（地図情報）・marker_list・gpsD（範囲外）。
     *   地図の準備前は何もしない（旧は core-ready の後に配線していた）。
     */
    openModalByLegacyName(type: string): void;
    /**
     * 汎用のメニューを開く。
     * @internal 旧 UI の互換層（showContextMenu）と POI の重なりの両方が使う。移行期の口。
     */
    showMenu(options: MaplatMenuOptions): void;
    /** メニューを閉じる。@internal 互換層の contextMenu facade も使う。 */
    closeMenu(): void;
}
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
export {};
