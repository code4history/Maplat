/**
 * 地図切替スライダー（1 本ぶん）。設計 v2 §4・§6.2。
 *
 * - **OL 非依存・Shadow DOM 非依存**（DOM だけ。外から `element` を差し込む側が影に入れる）
 * - Swiper を使わない。**5 スロットの循環（リングバッファ）**で、DOM ノードは作り直さない。
 *   移動のたびに論理 offset を回し、遠端の 1 個だけを付け替える（§4.3.3）。
 * - 地図を変えるのは `onSelect` だけ。矢印・drag・`onActiveChange` からは呼ばない（D5・N5）。
 *   覗いているカードを押したら、**動かし始めてすぐ** `onSelect(mapID, offset)` を呼ぶ（step の完了を待たない）。
 *
 * 数値はすべて先頭の `SLIDER_TUNING` に集めてある（P1・P2 の人間の決定を含む）。
 * `src/legacy`・`ol`・`swiper` は import しない（`spec/element-deps.spec.ts`）。
 */
import type { Localized } from "@maplat/core/common";
import { safeImageUrl } from "../poi_safe";
import { ellipsize } from "../shared/text";

/** 今描かれている横の位置（遷移の途中の値）。読めない環境では null */
function currentTranslateX(el: HTMLElement): number | null {
  try {
    const value = getComputedStyle(el).transform;
    if (!value || value === "none") return 0;
    const Matrix = (
      window as unknown as { DOMMatrixReadOnly?: typeof DOMMatrixReadOnly }
    ).DOMMatrixReadOnly;
    if (!Matrix) return null;
    return new Matrix(value).m41;
  } catch {
    return null;
  }
}

const SVG_NS = "http://www.w3.org/2000/svg";
/** 旧 UI が使っていたスライダー部品（v12）の矢印（navigation の `arrowSvg`）と同じ山形の線 */
const NAV_ARROW_PATH =
  "M0.38296 20.0762C0.111788 19.805 0.111788 19.3654 0.38296 19.0942L9.19758 10.2796L0.38296 1.46497C0.111788 1.19379 0.111788 0.754138 0.38296 0.482966C0.654131 0.211794 1.09379 0.211794 1.36496 0.482966L10.4341 9.55214C10.8359 9.9539 10.8359 10.6053 10.4341 11.007L1.36496 20.0762C1.09379 20.3474 0.654131 20.3474 0.38296 20.0762Z";

/**
 * スライダーの調整値。**数値はここ 1 か所だけ**に置く（設計 §4.7.1・P1・P2）。
 *
 * P1（幅ごとの枚数。v4 時代の見た目に戻す）:
 *   幅 480px 以下 → 1.4 枚・gap 10 ／ 481px 以上 → 2 枚・gap 15
 * P2（操作）:
 *   速さのしきい値 0.35px/ms・1 操作で 1 枚・250ms（`cubic-bezier(.22,.61,.36,1)`）・
 *   遠い地図は 160ms で 1 枚ずつ連続・drag は 1 枚上限＋はみ出しは 0.3 倍の抵抗・drag 中は地図を変えない
 */
export const SLIDER_TUNING = {
  /** P1: この幅（px）**以下**を「狭い」とし、1.4 枚・gap 10 にする */
  breakpointWidth: 480,
  /** P1: 狭いときの枚数・間隔 */
  perViewNarrow: 1.4,
  gapNarrow: 10,
  /** P1: 広いときの枚数・間隔 */
  perViewWide: 2,
  gapWide: 15,

  /** 1 枚動かすアニメの時間（P2） */
  stepDurationMs: 250,
  /** 遠い地図を続けて動かすときの 1 枚あたりの時間（P2） */
  farStepDurationMs: 160,
  /** アニメの曲線（P2） */
  easing: "cubic-bezier(.22,.61,.36,1)",
  /** `transitionend` が来ない環境で確定するまでの余裕（ms。遷移がまだ走っていれば、その終わりを待つ） */
  transitionFallbackSlackMs: 120,
  /** 払いの速さのしきい値（px/ms。P2） */
  thresholdVelocity: 0.35,
  /** 1 操作で動かす枚数の上限（P2） */
  maxStepsPerGesture: 1,
  /** drag で 1 枚を超えた分に掛ける抵抗（P2） */
  dragResistance: 0.3,
  /** drag で指に追従させる枚数の上限（P2） */
  dragLimitCards: 1,
  /** これ未満の移動はクリックとして扱う（px。S12） */
  clickThresholdPx: 2,
  /** 矢印の連打で積む枚数の上限 */
  maxQueuedSteps: 3,

  /** 見出しの行数（D8） */
  labelLines: 2,
  /** 1 画面に置くスロットの数（§4.3.1） */
  slotCount: 5,
  /** カードの高さ（旧 CSS と同じ 60px。見た目の基準は baseline JSON） */
  cardHeightPx: 60
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
   * **部品はこの呼び出しのすぐ後に自分で 1 枚動き始める**（D5。step の完了を待たない）。
   * したがって呼ぶ側は `step()` を呼ばない（呼ぶと 2 枚動く）。設計 §4.6 の擬似コードの
   * `await slider.step(...)` は D5 で古くなっている（Minor 7）。
   */
  onSelect: (mapID: string, offset: number) => void;
  /** 中央のカードが変わった（確定）。 */
  onActiveChange?: (mapID: string | null) => void;
  /** drag 中に中央へ来そうなカード（枠線の塗りだけ先に追従させる）。 */
  onActivePreview?: (mapID: string | null) => void;
  /** 読み上げ用のグループ名（"背景地図" / "重ね地図"） */
  groupLabel: string;
  /**
   * 矢印の読み上げ名（既定「前の地図」「次の地図」。Minor 9）。既定は**新しい名前**で、旧 UI には
   * この文字が無い（N6）ので、呼び手は言語に合わせて渡す。
   */
  navLabels?: { prev?: string; next?: string };
  /**
   * サムネイルが無い（または許可リストを通らない）ときの代わりの要素。`<maplat-ui>` は
   * 要素が既に持っている `#thumbPlaceholder`（頭文字の入った `span.thumb.none`）を渡す
   * （Stage 2 の申し送り: プレースホルダを 2 つ作らない）。省略すると何も置かない。
   */
  placeholder?: (label: string) => HTMLElement;
}

/** 負でも 0..m-1 に畳む（`m <= 0` は 0） */
export function mod(n: number, m: number): number {
  if (!Number.isFinite(n) || !Number.isFinite(m) || m <= 0) return 0;
  const r = ((n % m) + m) % m;
  return r === 0 ? 0 : r;
}

/** P1: 画面の幅から枚数と間隔を決める（480px 以下は 1.4 枚・gap 10） */
export function perViewFor(width: number): { perView: number; gap: number } {
  return width <= SLIDER_TUNING.breakpointWidth
    ? { perView: SLIDER_TUNING.perViewNarrow, gap: SLIDER_TUNING.gapNarrow }
    : { perView: SLIDER_TUNING.perViewWide, gap: SLIDER_TUNING.gapWide };
}

/** 1 枚の幅。Swiper の `(C - g*(P-1)) / P` と同じ式 */
export function cardWidthFor(
  containerWidth: number,
  perView: number,
  gap: number
): number {
  if (!(perView > 0) || !(containerWidth > 0)) return 0;
  return Math.max(0, (containerWidth - gap * (perView - 1)) / perView);
}

/**
 * トラックの基準位置。5 スロットを等間隔に並べたとき、中央スロット（物理 index 2）の中心を
 * 容器の中心へ持ってくる（§4.3.2。v1 の `C/2 - 1.5W - g` は 3 スロット前提で 1 枚ずれる）。
 */
export function baseXFor(
  containerWidth: number,
  cardWidth: number,
  gap: number
): number {
  return containerWidth / 2 - (2.5 * cardWidth + 2 * gap);
}

/** 論理 offset から実際の地図の index へ（負の mod） */
export function slotIndex(
  active: number,
  offset: number,
  count: number
): number {
  return mod(active + offset, count);
}

/**
 * 払い（dx）と速さ（velocity）から、動かす枚数を決める（-1・0・+1 のいずれか。P2）。
 * 符号: **右へ払ったら前（-1）**、左へ払ったら次（+1）。`dx` が半分以上なら dx を優先する。
 */
export function snapSteps(
  dx: number,
  stepWidth: number,
  velocity: number
): -1 | 0 | 1 {
  const toStep = (value: number): -1 | 1 => (value > 0 ? -1 : 1);
  if (stepWidth > 0 && Math.abs(dx) >= stepWidth / 2) return toStep(dx);
  if (Math.abs(velocity) > SLIDER_TUNING.thresholdVelocity)
    return toStep(velocity);
  return 0;
}

// 見た目は `src/element/styles.ts` の `MAPLAT_UI_CSS` が持つ（Stage 2 で移した。設計 §6.3・Minor 4・5）。
// この部品は Shadow DOM を知らないので、外から `element` を影に入れる呼び手（`<maplat-ui>`）が
// 同じスタイルを当てる。数値は `SLIDER_TUNING` から `styles.ts` が埋め込む（1 か所）。

type DragState = {
  pointerId: number;
  startX: number;
  lastX: number;
  prevX: number;
  lastT: number;
  prevT: number;
  applied: number;
  moved: boolean;
};

/** キューに積む 1 手（`duration` は「遠い地図か」で決まる。Minor 1） */
type QueuedStep = { dir: -1 | 1; duration: number };

const now = () =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

export class MapSlider {
  readonly element: HTMLDivElement;

  #options: MapSliderOptions;
  #items: MapSliderItem[];
  #active = 0;
  #selected: string | null = null;
  #offsets: number[] = [];
  #slotEls: HTMLButtonElement[] = [];
  #slotItems: (MapSliderItem | null)[] = [];
  #labels: HTMLElement[] = [];
  // サムネイルの `<img>` か、プレースホルダ（呼び手から渡された `span.thumb.none`）
  #thumbs: (HTMLElement | null)[] = [];
  #navLabels: { prev?: string; next?: string };

  #viewport: HTMLDivElement;
  #track: HTMLDivElement;
  #prev: HTMLButtonElement;
  #next: HTMLButtonElement;
  #live: HTMLSpanElement;

  #perView = SLIDER_TUNING.perViewWide;
  #gap = SLIDER_TUNING.gapWide;
  #cardWidth = 0;
  #stepWidth = 0;
  #baseX = 0;

  #queue: QueuedStep[] = [];
  #pumping = false;
  /** 動いているキューが空になるまで解決しない Promise（`step()` がすぐ解決しないように。Minor 2） */
  #drained: Promise<void> | null = null;
  #pendingSelected: string | null = null;
  /** 読み込みに失敗したサムネイルの URL（プレースホルダで出す） */
  #brokenThumbs = new Set<string>();
  /** 続きを呼ぶときも「遠い地図の連続」の時間を使うか（積める数を超えた移動の続き。N8） */
  #pendingFar = false;
  #animating = false;
  #drag: DragState | null = null;
  #suppressClick = false;
  #enabled = true;
  #destroyed = false;
  #observer: { disconnect(): void } | null = null;

  #onPointerDown = (ev: Event) => this.#handlePointerDown(ev as PointerEvent);
  #onPointerMove = (ev: Event) => this.#handlePointerMove(ev as PointerEvent);
  #onPointerUp = (ev: Event) => this.#handlePointerUp(ev as PointerEvent);
  #onKeyDown = (ev: Event) => this.#handleKeyDown(ev as KeyboardEvent);
  #onResize = () => this.refresh();

  constructor(options: MapSliderOptions) {
    this.#options = options;
    this.#items = options.items ? [...options.items] : [];
    this.#navLabels = { ...(options.navLabels ?? {}) };
    this.#active = 0;

    const root = document.createElement("div");
    root.className = "map-slider";
    root.setAttribute("part", "map-slider");
    root.setAttribute("role", "group");
    root.setAttribute("aria-label", options.groupLabel || "");
    root.dataset.kind = options.kind;
    // キーボード（←/→/Home/End/Enter）を受ける。矢印のボタンからも泡立って届く
    root.tabIndex = 0;
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(pointer: coarse)")?.matches
    ) {
      root.classList.add("touch");
    }
    this.#viewport = document.createElement("div");
    this.#viewport.className = "map-slider-viewport";
    this.#track = document.createElement("div");
    this.#track.className = "map-slider-track";
    this.#viewport.appendChild(this.#track);
    this.#prev = this.#createNav("prev");
    this.#next = this.#createNav("next");
    this.#live = document.createElement("span");
    this.#live.className = "map-slider-live";
    this.#live.setAttribute("aria-live", "polite");
    root.append(this.#prev, this.#viewport, this.#next, this.#live);
    this.element = root;

    this.#prev.addEventListener("click", () => void this.step(-1));
    this.#next.addEventListener("click", () => void this.step(1));
    root.addEventListener("keydown", this.#onKeyDown);
    this.#viewport.addEventListener("pointerdown", this.#onPointerDown);

    this.#buildSlots();
    this.#selected = this.#activeMapID();
    this.refresh();
    this.#renderSlots();
    this.#updateLive();
    this.#observeResize();
  }

  // ───────────────────────── 公開 API

  get activeMapID(): string | null {
    return this.#activeMapID();
  }

  /** この行（背景／重ねる）にその地図があるか（要素が「無い側の選択を外す」ために使う。設計 S9・S14） */
  hasMap(mapID: string | null): boolean {
    return mapID !== null && this.#items.some(item => item.mapID === mapID);
  }

  get selectedMapID(): string | null {
    return this.#selected;
  }

  get activeIndex(): number {
    return this.#active;
  }

  get count(): number {
    return this.#items.length;
  }

  /**
   * この行の地図の一覧（設定ファイルの sources の順）。
   * @internal 旧 UI の地図切り替えの facade（`src/legacy/legacy_swiper.ts`）が `slides` を組み立てるために読む。
   *   移行期の逃げ道（互換層だけが使う）。層 B の公開面には数えない。
   */
  get items(): ReadonlyArray<MapSliderItem> {
    return this.#items;
  }

  /**
   * 動いているか（キューを流している・1 歩のアニメの途中・drag の途中）。
   * @internal テスト専用（旧 e2e の `swiper.animating` の移植先。設計 v2 §4.7.3 の対応表）。
   */
  get animating(): boolean {
    return this.#pumping || this.#animating || this.#drag !== null;
  }

  get perView(): number {
    return this.#perView;
  }

  get gap(): number {
    return this.#gap;
  }

  get slots(): ReadonlyArray<{
    offset: number;
    mapID: string;
    element: HTMLElement;
  }> {
    return this.#offsets.map((offset, i) => ({
      offset,
      mapID: this.#slotItems[i]?.mapID ?? "",
      element: this.#slotEls[i]
    }));
  }

  setItems(items: MapSliderItem[]): void {
    if (this.#destroyed) return;
    const previous = this.#activeMapID();
    this.#items = items ? [...items] : [];
    const index = previous
      ? this.#items.findIndex(i => i.mapID === previous)
      : -1;
    this.#active = index >= 0 ? index : 0;
    const keep = this.#slotEls.length === this.#slotCount();
    if (!keep) this.#buildSlots();
    const selectedStillThere =
      this.#selected !== null &&
      this.#items.some(i => i.mapID === this.#selected);
    if (!selectedStillThere) this.#selected = this.#activeMapID();
    this.refresh();
    this.#renderSlots();
    this.#updateSelected();
    this.#updateLive();
  }

  /**
   * 地図の選択を合わせる。隣は 1 枚のアニメ、遠いは飛ばさずに 1 枚ずつ連続で動かす（§4.3.4・P2）。
   * 中央は変わらないので `.selected` だけ先に合わせる（押した直後の見た目のため）。
   */
  setSelectedMapID(mapID: string | null, animate = true): void {
    if (this.#destroyed) return;
    if (mapID === null) {
      this.#setSelected(null);
      return;
    }
    const index = this.#items.findIndex(item => item.mapID === mapID);
    if (index < 0) return;
    if (!animate) {
      // 起動時の同期（旧 Swiper の `initialSlide` と同じ。動かさずに置く）
      this.#active = index;
      this.#setSelected(mapID);
      this.#renderSlots();
      this.#applyLayout();
      this.#updateLive();
      this.#notifyActive();
      return;
    }
    if (this.#pumping || this.#animating) {
      // 遷移中は 1 つだけ覚えておき、確定後に処理する（連打で列を伸ばさない）。
      // 利用者の選び直しは「近い移動」から数え直す（N8 の続きの扱いを持ち越さない）
      this.#pendingSelected = mapID;
      this.#pendingFar = false;
      this.#setSelected(mapID);
      return;
    }
    this.#setSelected(mapID);
    this.#moveTo(index);
  }

  /** `.selected` だけを更新する（中央は動かさない。クリック直後の見た目用） */
  setSelectedOnly(mapID: string | null): void {
    if (this.#destroyed) return;
    this.#setSelected(mapID);
  }

  /** 1 枚動かし、確定まで待つ（矢印・押した直後の移動用。地図は変えない） */
  step(dir: -1 | 1): Promise<void> {
    return this.#enqueue(dir);
  }

  setShowBorder(on: boolean): void {
    this.element.classList.toggle("show-border", !!on);
  }

  setGroupLabel(label: string): void {
    this.element.setAttribute("aria-label", label || "");
  }

  /** 矢印の読み上げ名を差し替える（言語の切り替えで呼ぶ。Minor 9・Stage 2） */
  setNavLabels(labels: { prev?: string; next?: string }): void {
    this.#navLabels = { ...labels };
    this.#prev.setAttribute("aria-label", labels.prev ?? "前の地図");
    this.#next.setAttribute("aria-label", labels.next ?? "次の地図");
  }

  setEnabled(on: boolean): void {
    this.#enabled = !!on;
    this.element.classList.toggle("disabled", !this.#enabled);
    this.element.setAttribute(
      "aria-disabled",
      this.#enabled ? "false" : "true"
    );
    if (!this.#enabled && this.#drag) this.#endDrag(-1, 0);
  }

  /** 幅・言語・画像の再計算（active は動かさない） */
  refresh(): void {
    if (this.#destroyed) return;
    this.#applyLayout();
    // `minimize` は `ellipsize` が毎回外して付け直す（Minor 3。ここで外す必要はない）
    for (let i = 0; i < this.#labels.length; i++) {
      const item = this.#slotItems[i];
      if (!item) continue;
      const text = this.#labelText(item);
      // 言語の切り替えで読み上げ名と、プレースホルダの頭文字も更新する
      this.#slotEls[i].setAttribute("aria-label", text);
      const thumb = this.#thumbs[i];
      if (thumb && thumb.tagName !== "IMG")
        thumb.textContent = Array.from(text)[0] ?? "?";
      ellipsize(this.#labels[i], SLIDER_TUNING.labelLines, { text });
    }
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#queue = [];
    this.#detachDragListeners();
    this.#observer?.disconnect();
    this.#observer = null;
    // `ResizeObserver` が無い環境で足したリスナーも外す（Minor 6）
    window.removeEventListener("resize", this.#onResize);
    this.element.removeEventListener("keydown", this.#onKeyDown);
    this.#viewport.removeEventListener("pointerdown", this.#onPointerDown);
    this.element.remove();
  }

  // ───────────────────────── 組み立て

  #createNav(kind: "prev" | "next"): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `map-slider-nav ${kind}`;
    button.setAttribute(
      "part",
      kind === "prev" ? "map-slider-prev" : "map-slider-next"
    );
    // 読み上げ名は呼び手が差し替えられる（Minor 9）。既定の「前の地図」「次の地図」は**新しい名前**で、
    // 旧 UI には無い（`src/` にこの文字は無い。旧の切り替えは Swiper の `navigation`
    // `src/ui_init.ts:573-576`・`:611-614` で、ボタンの名は Swiper の a11y の既定（英語）任せ。N6）。
    // 呼び手が言語に合わせて `navLabels` で渡す（`setNavLabels` で切り替えられる）。
    const labels = this.#navLabels;
    button.setAttribute(
      "aria-label",
      kind === "prev"
        ? (labels.prev ?? "前の地図")
        : (labels.next ?? "次の地図")
    );
    // 矢印の形は旧 UI が使っていたスライダー部品（v12）の矢印（navigation の `arrowSvg`。11×20 の
    // 山形）と同じ。旧は 18×30 の箱に `object-fit: contain` で描き、色はその部品の既定
    // （#007aff）、prev は 180 度回す（仕上げで実測）
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "map-slider-nav-icon");
    svg.setAttribute("viewBox", "0 0 11 20");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", NAV_ARROW_PATH);
    path.setAttribute("fill", "currentColor");
    svg.appendChild(path);
    button.appendChild(svg);
    return button;
  }

  #slotCount(): number {
    return this.#items.length >= 2 ? SLIDER_TUNING.slotCount : 1;
  }

  #buildSlots(): void {
    const count = this.#slotCount();
    this.#track.textContent = "";
    this.#offsets = [];
    this.#slotEls = [];
    this.#slotItems = [];
    this.#labels = [];
    this.#thumbs = [];
    const half = Math.floor(count / 2);
    for (let i = 0; i < count; i++) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "map-slide";
      button.setAttribute("part", "map-slide");
      button.tabIndex = -1;
      const label = document.createElement("span");
      label.className = "map-slide-label";
      label.setAttribute("part", "map-slide-label");
      button.appendChild(label);
      const index = i;
      button.addEventListener("click", (ev: MouseEvent) =>
        this.#handleClick(ev, index)
      );
      this.#track.appendChild(button);
      this.#offsets.push(i - half);
      this.#slotEls.push(button);
      this.#slotItems.push(null);
      this.#labels.push(label);
      this.#thumbs.push(null);
    }
    const single = count === 1;
    this.element.classList.toggle("single-map", single);
    for (const nav of [this.#prev, this.#next]) {
      nav.hidden = single;
      nav.setAttribute("aria-hidden", single ? "true" : "false");
    }
  }

  #labelText(item: MapSliderItem): string {
    return this.#options.translate(item.label);
  }

  #renderSlots(): void {
    for (let i = 0; i < this.#slotEls.length; i++) {
      const offset = this.#offsets[i];
      const item =
        this.count > 0
          ? this.#items[slotIndex(this.#active, offset, this.count)]
          : null;
      const changed =
        (this.#slotItems[i]?.mapID ?? null) !== (item?.mapID ?? null);
      this.#slotItems[i] = item;
      const button = this.#slotEls[i];
      if (!item) {
        button.dataset.mapId = "";
        button.setAttribute("aria-label", "");
        this.#labels[i].textContent = "";
        this.#thumbs[i]?.remove();
        this.#thumbs[i] = null;
        button.classList.remove("has-envelope");
        button.style.removeProperty("--maplat-envelope-color");
        continue;
      }
      button.dataset.mapId = item.mapID;
      button.setAttribute("aria-label", this.#labelText(item));
      // サムネイル: `javascript:` などは画像にしない（`poi_safe.ts` の許可リスト）。
      // 無いときは呼び手から渡されたプレースホルダ（`<maplat-ui>` の `#thumbPlaceholder`）を使う。
      // 読めなかった画像（404・壊れた画像）は頭文字のプレースホルダに替える（レビュー Major 5）
      const safe = safeImageUrl(item.thumbnail ?? undefined);
      const url = safe && !this.#brokenThumbs.has(safe) ? safe : undefined;
      if (url) {
        const current = this.#thumbs[i];
        if (!current || current.tagName !== "IMG") {
          current?.remove();
          const img = document.createElement("img");
          img.className = "map-slide-thumb";
          img.setAttribute("part", "map-slide-thumb");
          img.alt = "";
          // crossOrigin は付けない（旧 UI も付けていない。キャンバスに描かないので要らず、付けると
          // CORS の応答ヘッダを返さないサーバーのサムネイルが壊れた画像になる。レビュー Major 5）
          img.addEventListener("error", () => {
            const src = img.getAttribute("src");
            if (!src || this.#destroyed) return;
            this.#brokenThumbs.add(src);
            if (this.#thumbs.includes(img)) this.#renderSlots();
          });
          button.insertBefore(img, this.#labels[i]);
          this.#thumbs[i] = img;
        }
        this.#thumbs[i]!.setAttribute("src", url);
      } else if (this.#options.placeholder) {
        const current = this.#thumbs[i];
        if (current && current.tagName !== "IMG" && !changed) {
          // 言語が変わっただけなら、頭文字だけ直す
          current.textContent = Array.from(this.#labelText(item))[0] ?? "?";
        } else {
          current?.remove();
          const placeholder = this.#options.placeholder(this.#labelText(item));
          button.insertBefore(placeholder, this.#labels[i]);
          this.#thumbs[i] = placeholder;
        }
      } else if (this.#thumbs[i]) {
        this.#thumbs[i]!.remove();
        this.#thumbs[i] = null;
      }
      if (item.envelopeColor) {
        button.style.setProperty("--maplat-envelope-color", item.envelopeColor);
        button.classList.add("has-envelope");
      } else {
        button.style.removeProperty("--maplat-envelope-color");
        button.classList.remove("has-envelope");
      }
      if (changed) {
        this.#labels[i].textContent = this.#labelText(item);
        ellipsize(this.#labels[i], SLIDER_TUNING.labelLines, {
          text: this.#labelText(item)
        });
      }
    }
    this.#updateSelected();
  }

  #updateSelected(): void {
    for (let i = 0; i < this.#slotEls.length; i++) {
      const item = this.#slotItems[i];
      const selected =
        !!item && this.#selected !== null && item.mapID === this.#selected;
      this.#slotEls[i].classList.toggle("selected", selected);
      // P4 の part 名（設計 §4.5.4）: 選択中のカードは `map-slide map-slide-selected`（レビュー Major 4）
      this.#slotEls[i].setAttribute(
        "part",
        selected ? "map-slide map-slide-selected" : "map-slide"
      );
      if (selected) this.#slotEls[i].setAttribute("aria-current", "true");
      else this.#slotEls[i].removeAttribute("aria-current");
    }
  }

  #updateLive(): void {
    const item = this.#slotItems[this.#offsets.indexOf(0)];
    this.#live.textContent = item ? this.#labelText(item) : "";
  }

  #activeMapID(): string | null {
    return this.count > 0 ? (this.#items[this.#active]?.mapID ?? null) : null;
  }

  #setSelected(mapID: string | null): void {
    this.#selected = mapID;
    this.#updateSelected();
  }

  #observeResize(): void {
    const Observer = (
      window as unknown as { ResizeObserver?: typeof ResizeObserver }
    ).ResizeObserver;
    if (!Observer) {
      window.addEventListener("resize", this.#onResize);
      return;
    }
    const observer = new Observer(() => this.refresh());
    observer.observe(this.element);
    this.#observer = observer;
  }

  // ───────────────────────── 位置

  #applyLayout(): void {
    const width = this.element.clientWidth || 0;
    const { perView, gap } = perViewFor(
      typeof window !== "undefined" ? window.innerWidth : 1024
    );
    this.#perView = perView;
    this.#gap = gap;
    this.#cardWidth = cardWidthFor(width, perView, gap);
    this.#stepWidth = this.#cardWidth + gap;
    this.#baseX = baseXFor(width, this.#cardWidth, gap);
    if (!this.#drag)
      this.#track.style.transform = `translate3d(${this.#baseX}px, 0, 0)`;
    this.element.style.setProperty("--map-slide-width", `${this.#cardWidth}px`);
    this.element.style.setProperty("--map-slide-gap", `${gap}px`);
    for (let i = 0; i < this.#slotEls.length; i++) {
      const el = this.#slotEls[i];
      el.style.width = `${this.#cardWidth}px`;
      el.style.transform = `translate3d(${(this.#offsets[i] + 2) * this.#stepWidth}px, 0, 0)`;
    }
  }

  // ───────────────────────── 移動

  #enqueue(
    dir: -1 | 1,
    duration = SLIDER_TUNING.stepDurationMs
  ): Promise<void> {
    if (this.#destroyed || this.count < 2 || !this.#enabled)
      return Promise.resolve();
    if (this.#queue.length >= SLIDER_TUNING.maxQueuedSteps) return this.#pump();
    this.#queue.push({ dir, duration });
    return this.#pump();
  }

  /**
   * キューを 1 本ずつ流す。**返す Promise はキューが空になるまで解決しない**
   * （動いている最中の `step()` がすぐ解決していたのを直す。Minor 2）。
   */
  #pump(): Promise<void> {
    if (this.#pumping) return this.#drained ?? Promise.resolve();
    this.#pumping = true;
    let resolveDrained!: () => void;
    this.#drained = new Promise<void>(resolve => (resolveDrained = resolve));
    const run = async () => {
      try {
        while (this.#queue.length > 0) {
          const { dir, duration } = this.#queue.shift()!;
          this.#animating = true;
          await this.#animateStep(dir, duration);
          this.#commit(dir);
          this.#animating = false;
        }
      } finally {
        this.#pumping = false;
        this.#drained = null;
        const pending = this.#pendingSelected;
        const far = this.#pendingFar;
        this.#pendingSelected = null;
        this.#pendingFar = false;
        if (pending !== null && pending !== this.#activeMapID()) {
          const index = this.#items.findIndex(item => item.mapID === pending);
          if (index >= 0) {
            this.#setSelected(pending);
            // 積める数を超えた続きは、遠い移動の一部なので 160ms を引き継ぐ（N8）
            this.#moveTo(index, far);
          }
        }
        resolveDrained();
      }
    };
    return run();
  }

  /**
   * 遠い地図へは 1 枚ずつ動かす（飛ばさない。P2）。
   * `farContinuation` は「積める数を超えた続き」から呼ばれたことを示す（N8）。
   */
  #moveTo(index: number, farContinuation = false): void {
    let delta = mod(index - this.#active, this.count);
    if (this.count > 1 && delta > this.count / 2) delta -= this.count;
    if (delta === 0) {
      this.#notifyActive();
      return;
    }
    const dir: -1 | 1 = delta > 0 ? 1 : -1;
    // 1 枚だけなら 250ms、2 枚以上先なら 1 枚あたり 160ms（P2・§4.3.4）。
    // 「キューに残っている数」で決めると、最初の 1 枚が必ず 250ms になり、
    // 3 枚先が 250・160・250ms になっていた（Minor 1）。
    // 積める数を超えた続きも「遠い移動の一部」なので 160ms のまま（N8。ここで続きを近い移動と
    // 数えると、5 枚先が 160×4 + 250ms になる）
    const far = farContinuation || Math.abs(delta) >= 2;
    const duration = far
      ? SLIDER_TUNING.farStepDurationMs
      : SLIDER_TUNING.stepDurationMs;
    for (let i = 0; i < Math.abs(delta); i++) {
      if (this.#queue.length >= SLIDER_TUNING.maxQueuedSteps) {
        // 積める数を超えたら、残りは確定後にもう一度呼ぶ（飛ばさない）
        this.#pendingSelected = this.#items[index].mapID;
        this.#pendingFar = far;
        break;
      }
      void this.#enqueue(dir, duration);
    }
  }

  #animateStep(dir: -1 | 1, duration: number): Promise<void> {
    const target = this.#baseX - dir * this.#stepWidth;
    return this.#animateTo(target, duration);
  }

  #animateTo(target: number, duration: number): Promise<void> {
    const track = this.#track;
    if (this.#destroyed) return Promise.resolve();
    const animate = duration > 0 && this.#canAnimate();
    track.style.transition = `transform ${duration}ms ${SLIDER_TUNING.easing}`;
    // 同じフレームで transform を変えないと遷移が始まらない
    track.style.transform = `translate3d(${target}px, 0, 0)`;
    if (!animate) return Promise.resolve();
    return new Promise<void>(resolve => {
      let settled = false;
      let lastTimer = 0;
      const finish = () => {
        if (settled) return;
        settled = true;
        track.removeEventListener("transitionrun", onRun);
        track.removeEventListener("transitionend", onEnd);
        track.removeEventListener("transitioncancel", onCancel);
        window.clearTimeout(timer);
        window.clearTimeout(lastTimer);
        resolve();
      };
      // この 1 歩の遷移が始まったか（`transitionrun` を受けたか）。前の 1 歩の遷移の
      // `transitioncancel` が遅れて届くことがあるので（仕上げで実測）、始まる前の cancel は無視する
      let started = false;
      const onRun = (ev: Event) => {
        if ((ev as TransitionEvent).propertyName === "transform")
          started = true;
      };
      const onEnd = (ev: Event) => {
        if ((ev as TransitionEvent).propertyName === "transform") finish();
      };
      // 遷移が途中で消された（自動非表示の display:none・大きさの変化の描き直し等）ときは、
      // 保険の時間を待たずに確定する（レビュー Major 1）
      const onCancel = (ev: Event) => {
        if (started && (ev as TransitionEvent).propertyName === "transform")
          finish();
      };
      track.addEventListener("transitionrun", onRun);
      track.addEventListener("transitionend", onEnd);
      track.addEventListener("transitioncancel", onCancel);
      const slack = SLIDER_TUNING.transitionFallbackSlackMs;
      const timer = window.setTimeout(() => {
        // 保険の時間が来ても、すぐには確定しない（仕上げで実測: 負荷の高い機械では 250ms の遷移が
        // 340〜390ms かかり、`transitionend` が 120ms の余裕より遅れて配られる。ここで確定すると、
        // 着いている遷移でも `transitioncancel` になり、まだ途中なら最後の数 px が跳ぶ）。
        //  - まだ目標の位置に着いていない: 着くまで待ち、来なければもう 1 回分（＋余裕）の保険で確定する
        //  - 着いている: 遷移のイベントは次の描画の更新で配られるので、次のフレームまで待つ
        //    （rAF が回らない隠れたタブ等のために、同じ長さの保険も置く）
        // `getAnimations()` は遷移が始まる前だと空を返すので、描かれている位置で見る。
        const x = currentTranslateX(track);
        if (x === null || Math.abs(x - target) < 0.5) {
          const raf = window.requestAnimationFrame?.bind(window);
          if (!raf) {
            finish();
            return;
          }
          raf(() => finish());
        }
        // 最後の保険（1 回目より長くする: 1 回目と同じ長さだと、時間で数える試験と見分けがつかない）
        lastTimer = window.setTimeout(finish, duration + slack * 2);
      }, duration + slack);
    });
  }

  /**
   * アニメを待てる環境か。
   * `matchMedia` を持たない環境（jsdom などのテスト）と `prefers-reduced-motion: reduce` では
   * `transitionend` が来ない（来ても意味がない）ので、待たずに確定する。
   */
  #canAnimate(): boolean {
    if (typeof window === "undefined") return false;
    if (typeof window.matchMedia !== "function") return false;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  #commit(dir: -1 | 1): void {
    if (this.#destroyed || this.count < 2) return;
    this.#active = mod(this.#active + dir, this.count);
    const count = this.#offsets.length;
    const half = Math.floor(count / 2);
    for (let i = 0; i < this.#offsets.length; i++) {
      let offset = this.#offsets[i] - dir;
      if (offset > half) offset -= count;
      if (offset < -half) offset += count;
      this.#offsets[i] = offset;
    }
    // 循環のつなぎ目: 位置と中身を同じフレームで更新する
    this.#track.style.transition = "none";
    this.#renderSlots();
    this.#applyLayout();
    // 強制リフロー（設計 §4.3.3 (3)）。これが無いと、続けて動かすときに
    // 次の `#animateTo` と同じタスクで transform を書き換えることになり、
    // 「transition: none の付け替え」がコミットされないまま次のアニメが始まる
    // ＝1 枚分の跳びが出て `transitionend` も来ない（毎回「時間 + 120ms」の保険待ち）。
    // 遠い地図・矢印の連打・遷移中のクリックで出る（M3）。
    // jsdom ではレイアウトが無いので**再現できない**。Stage 2 の e2e で確かめる。
    void this.#track.offsetWidth;
    // transition を戻す（次に動かすときに `#animateTo` が付け直す）
    this.#track.style.transition = "";
    this.#updateLive();
    this.#notifyActive();
  }

  #notifyActive(): void {
    this.#options.onActiveChange?.(this.#activeMapID());
  }

  // ───────────────────────── クリック

  #handleClick(ev: MouseEvent, index: number): void {
    if (this.#destroyed || !this.#enabled) return;
    if (this.#suppressClick) {
      // drag の直後の click は地図へ渡さない（S12）
      this.#suppressClick = false;
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
    const slot = this.slots[index];
    const item = this.#slotItems[index];
    if (!slot || !item) return;
    ev.preventDefault();
    ev.stopPropagation();
    if (this.count > 1 && slot.offset !== 0) {
      const dir: -1 | 1 = slot.offset > 0 ? 1 : -1;
      // 動かし始めてすぐに onSelect を呼ぶ（step の完了は待たない。D5）
      void this.#enqueue(dir);
      this.#options.onSelect(item.mapID, slot.offset);
    } else {
      this.#options.onSelect(item.mapID, 0);
    }
  }

  // ───────────────────────── drag

  #handlePointerDown(ev: PointerEvent): void {
    if (this.#destroyed || !this.#enabled || this.count < 2) return;
    // 動いている最中に drag を始めると `transition: none` で遷移が打ち切られ、
    // 途中の位置から確定してしまう（Minor 8）
    if (this.#animating) return;
    if (typeof ev.button === "number" && ev.button !== 0) return;
    const t = now();
    this.#drag = {
      pointerId: typeof ev.pointerId === "number" ? ev.pointerId : 1,
      startX: ev.clientX,
      lastX: ev.clientX,
      prevX: ev.clientX,
      lastT: t,
      prevT: t,
      applied: 0,
      moved: false
    };
    this.#track.style.transition = "none";
    window.addEventListener("pointermove", this.#onPointerMove);
    window.addEventListener("pointerup", this.#onPointerUp);
    window.addEventListener("pointercancel", this.#onPointerUp);
  }

  #handlePointerMove(ev: PointerEvent): void {
    const drag = this.#drag;
    if (!drag || this.#destroyed) return;
    drag.prevX = drag.lastX;
    drag.prevT = drag.lastT;
    drag.lastX = ev.clientX;
    drag.lastT = now();
    const dx = ev.clientX - drag.startX;
    if (Math.abs(dx) > SLIDER_TUNING.clickThresholdPx) drag.moved = true;
    const limit = this.#stepWidth * SLIDER_TUNING.dragLimitCards;
    const overshoot = Math.max(0, Math.abs(dx) - limit);
    const applied =
      Math.abs(dx) <= limit
        ? dx
        : Math.sign(dx) * (limit + overshoot * SLIDER_TUNING.dragResistance);
    drag.applied = applied;
    this.#track.style.transform = `translate3d(${this.#baseX + applied}px, 0, 0)`;
    this.#emitPreview(applied);
  }

  #handlePointerUp(ev: PointerEvent): void {
    const drag = this.#drag;
    if (!drag) return;
    const elapsed = Math.max(1, drag.lastT - drag.prevT);
    const velocity = (drag.lastX - drag.prevX) / elapsed;
    const moved = drag.moved;
    this.#endDrag(drag.applied, velocity);
    if (moved) {
      this.#suppressClick = true;
      // 次の click が来なかったときのために、次のタスクで解除する
      window.setTimeout(() => {
        this.#suppressClick = false;
      }, 0);
    }
    void ev;
  }

  #endDrag(applied: number, velocity: number): void {
    if (!this.#drag) return;
    this.#drag = null;
    this.#detachDragListeners();
    const steps = this.#enabled
      ? snapSteps(applied, this.#stepWidth, velocity)
      : 0;
    if (steps !== 0) {
      void this.#enqueue(steps);
    } else {
      // 元の位置へ戻す（アニメ）
      void this.#animateTo(this.#baseX, SLIDER_TUNING.stepDurationMs);
    }
  }

  #detachDragListeners(): void {
    window.removeEventListener("pointermove", this.#onPointerMove);
    window.removeEventListener("pointerup", this.#onPointerUp);
    window.removeEventListener("pointercancel", this.#onPointerUp);
  }

  #emitPreview(applied: number): void {
    const steps = snapSteps(applied, this.#stepWidth, 0);
    // `steps` は「動かす向き」。+1 なら offset +1 のカードが中央へ来る。
    // 中心が物理スロットのどこにあるかは commit で回るので、**物理位置で数えない**。
    // `indexOf(steps)` で「offset === steps のスロット」を引く（循環の境目で null に
    // ならなかったのを直す。M2。旧 `index + steps` は 5 枚の環の端で範囲外になっていた）。
    const slot = this.#offsets.indexOf(steps);
    const target = slot >= 0 ? this.#slotItems[slot] : null;
    this.#options.onActivePreview?.(target?.mapID ?? null);
  }

  // ───────────────────────── キーボード

  #handleKeyDown(ev: KeyboardEvent): void {
    if (this.#destroyed || !this.#enabled) return;
    switch (ev.key) {
      case "ArrowLeft":
        ev.preventDefault();
        void this.step(-1);
        return;
      case "ArrowRight":
        ev.preventDefault();
        void this.step(1);
        return;
      case "Home":
        ev.preventDefault();
        if (this.count > 0) this.setSelectedMapID(this.#items[0].mapID);
        return;
      case "End":
        ev.preventDefault();
        if (this.count > 0)
          this.setSelectedMapID(this.#items[this.count - 1].mapID);
        return;
      case "Enter":
      case " ":
        ev.preventDefault();
        if (this.#activeMapID())
          this.#options.onSelect(this.#activeMapID()!, 0);
        return;
      default:
        return;
    }
  }
}
