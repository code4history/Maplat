import { Localized } from '@maplat/core/common';
/**
 * スライダーの調整値。**数値はここ 1 か所だけ**に置く。
 *
 * 幅ごとの枚数（v4 時代の見た目に戻す）:
 *   幅 480px 以下 → 1.4 枚・gap 10 ／ 481px 以上 → 2 枚・gap 15
 * 操作:
 *   速さのしきい値 0.35px/ms・1 操作で 1 枚・250ms（`cubic-bezier(.22,.61,.36,1)`）・
 *   遠い地図は 160ms で 1 枚ずつ連続・drag は 1 枚上限＋はみ出しは 0.3 倍の抵抗・drag 中は地図を変えない
 */
export declare const SLIDER_TUNING: {
    /** この幅（px）**以下**を「狭い」とし、1.4 枚・gap 10 にする */
    breakpointWidth: number;
    /** 狭いときの枚数・間隔 */
    perViewNarrow: number;
    gapNarrow: number;
    /** 広いときの枚数・間隔 */
    perViewWide: number;
    gapWide: number;
    /** 1 枚動かすアニメの時間 */
    stepDurationMs: number;
    /** 遠い地図を続けて動かすときの 1 枚あたりの時間 */
    farStepDurationMs: number;
    /** アニメの曲線 */
    easing: string;
    /** `transitionend` が来ない環境で確定するまでの余裕（ms。遷移がまだ走っていれば、その終わりを待つ） */
    transitionFallbackSlackMs: number;
    /**
     * 保険の時間が来ても遷移が**進んでいる**（`getAnimations()` の進み具合が前回と違う）あいだは待ち直す、
     * その回数の上限（止まった遷移・観測できない環境では 1 回だけ待って確定する。待ち続ける経路は無い）
     */
    transitionWatchMaxRounds: number;
    /** 払いの速さのしきい値（px/ms） */
    thresholdVelocity: number;
    /** 1 操作で動かす枚数の上限 */
    maxStepsPerGesture: number;
    /** drag で 1 枚を超えた分に掛ける抵抗 */
    dragResistance: number;
    /** drag で指に追従させる枚数の上限 */
    dragLimitCards: number;
    /** これ未満の移動はクリックとして扱う（px） */
    clickThresholdPx: number;
    /** 矢印の連打で積む枚数の上限 */
    maxQueuedSteps: number;
    /** 見出しの行数 */
    labelLines: number;
    /** 1 画面に置くスロットの数 */
    slotCount: number;
    /** カードの高さ（旧 CSS と同じ 60px。見た目の基準は baseline JSON） */
    cardHeightPx: number;
};
/** スライダーの 1 枚分 */
export interface MapSliderItem {
    mapID: string;
    label: Localized | string;
    thumbnail?: string | null;
    hasEnvelope?: boolean;
    envelopeColor?: string;
    isBasemap: boolean;
}
export interface MapSliderOptions {
    kind: "base" | "overlay";
    items: MapSliderItem[];
    translate: (value: Localized | string | undefined) => string;
    /**
     * クリック/Enter で地図を切り替える。`offset` は押したスロットの相対位置（-2..2）。
     *
     * **部品はこの呼び出しのすぐ後に自分で 1 枚動き始める**（step の完了を待たない）。
     * したがって呼ぶ側は `step()` を呼ばない（呼ぶと 2 枚動く。`step()` の完了を待つ必要もない）。
     */
    onSelect: (mapID: string, offset: number) => void;
    /** 中央のカードが変わった（確定）。 */
    onActiveChange?: (mapID: string | null) => void;
    /** drag 中に中央へ来そうなカード（枠線の塗りだけ先に追従させる）。 */
    onActivePreview?: (mapID: string | null) => void;
    /** 読み上げ用のグループ名（"背景地図" / "重ね地図"） */
    groupLabel: string;
    /**
     * 矢印の読み上げ名（既定「前の地図」「次の地図」）。既定は**新しい名前**で、旧 UI には
     * この文字が無いので、呼び手は言語に合わせて渡す。
     */
    navLabels?: {
        prev?: string;
        next?: string;
    };
    /**
     * サムネイルが無い（または許可リストを通らない）ときの代わりの要素。`<maplat-ui>` は
     * 要素が既に持っている `#thumbPlaceholder`（頭文字の入った `span.thumb.none`）を渡す
     * （申し送り: プレースホルダを 2 つ作らない）。省略すると何も置かない。
     */
    placeholder?: (label: string) => HTMLElement;
}
/** 負でも 0..m-1 に畳む（`m <= 0` は 0） */
export declare function mod(n: number, m: number): number;
/** 画面の幅から枚数と間隔を決める（480px 以下は 1.4 枚・gap 10） */
export declare function perViewFor(width: number): {
    perView: number;
    gap: number;
};
/** 1 枚の幅。Swiper の `(C - g*(P-1)) / P` と同じ式 */
export declare function cardWidthFor(containerWidth: number, perView: number, gap: number): number;
/**
 * トラックの基準位置。5 スロットを等間隔に並べたとき、中央スロット（物理 index 2）の中心を
 * 容器の中心へ持ってくる（v1 の `C/2 - 1.5W - g` は 3 スロット前提で 1 枚ずれる）。
 */
export declare function baseXFor(containerWidth: number, cardWidth: number, gap: number): number;
/** 論理 offset から実際の地図の index へ（負の mod） */
export declare function slotIndex(active: number, offset: number, count: number): number;
/**
 * 払い（dx）と速さ（velocity）から、動かす枚数を決める（-1・0・+1 のいずれか）。
 * 符号: **右へ払ったら前（-1）**、左へ払ったら次（+1）。`dx` が半分以上なら dx を優先する。
 */
export declare function snapSteps(dx: number, stepWidth: number, velocity: number): -1 | 0 | 1;
export declare class MapSlider {
    #private;
    readonly element: HTMLDivElement;
    constructor(options: MapSliderOptions);
    get activeMapID(): string | null;
    /** この行（背景／重ねる）にその地図があるか（要素が「無い側の選択を外す」ために使う） */
    hasMap(mapID: string | null): boolean;
    get selectedMapID(): string | null;
    get activeIndex(): number;
    get count(): number;
    /**
     * この行の地図の一覧（設定ファイルの sources の順）。
     * @internal 旧 UI の地図切り替えの facade（`src/legacy/legacy_swiper.ts`）が `slides` を組み立てるために読む。
     *   移行期の逃げ道（互換層だけが使う）。層 B の公開面には数えない。
     */
    get items(): ReadonlyArray<MapSliderItem>;
    /**
     * 動いているか（キューを流している・1 歩のアニメの途中・drag の途中）。
     * @internal テスト専用（旧 e2e の `swiper.animating` の移植先）。
     */
    get animating(): boolean;
    get perView(): number;
    get gap(): number;
    get slots(): ReadonlyArray<{
        offset: number;
        mapID: string;
        element: HTMLElement;
    }>;
    setItems(items: MapSliderItem[]): void;
    /**
     * 地図の選択を合わせる。隣は 1 枚のアニメ、遠いは飛ばさずに 1 枚ずつ連続で動かす。
     * 中央は変わらないので `.selected` だけ先に合わせる（押した直後の見た目のため）。
     */
    setSelectedMapID(mapID: string | null, animate?: boolean): void;
    /** `.selected` だけを更新する（中央は動かさない。クリック直後の見た目用） */
    setSelectedOnly(mapID: string | null): void;
    /** 1 枚動かし、確定まで待つ（矢印・押した直後の移動用。地図は変えない） */
    step(dir: -1 | 1): Promise<void>;
    setShowBorder(on: boolean): void;
    setGroupLabel(label: string): void;
    /** 矢印の読み上げ名を差し替える（言語の切り替えで呼ぶ） */
    setNavLabels(labels: {
        prev?: string;
        next?: string;
    }): void;
    setEnabled(on: boolean): void;
    /** 幅・言語・画像の再計算（active は動かさない） */
    refresh(): void;
    destroy(): void;
}
