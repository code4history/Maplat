// @vitest-environment jsdom
// 旧 API（`MaplatUi`）の振る舞いを固定する回帰テスト（設計 v2 §2.5.1・§6.1・再レビュー D4）。
//
// 位置付け:
//   - 判定は **API の水準**（戻り値・`uiHooks` の段階・公開フィールド・`ui.core`・送られた文字）だけで行う。
//     DOM のセレクタ（`.swiper-slide`・`.map-title span`・`.ol-xxx` 等）は使わない。文字は文書全体と
//     shadow root を再帰で探す（Stage 3 で UI が Shadow DOM に移っても同じ判定になるように）。
//   - **旧の実装で緑になるように書く**（D4）。Stage 3 で `MaplatUi` を `<maplat-ui>` の互換層に
//     差し替えたあと、このファイルを **`git diff` で無変更のまま緑**にすることが受け入れ条件。
//   - 段階の境目（設計 §3 L11 の onAppdataReady・onCoreReady・onUiReady。D7 により onCoreReady も
//     こちら）は別の describe にまとめ、**旧でも互換層でも成り立つ assert だけ**を置く（M5・N3。
//     旧の振る舞いだけを固定する assert は置かない）。Stage 3 で変わるのは assert ではなく待ち方。
//
// 層 A（`MaplatApp`）は実物を使う。地図の実体（OpenLayers）は `sources: []` で起動する
// （`MaplatCore/spec/wc-legacy-startup-feature-keys.spec.ts` と同じ作り方）。地図の切り替え・題名・
// `#!` の復元など「地図が要る」ものは実ブラウザ側の `e2e/legacy-api.spec.ts` で判定する。
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { MaplatUi } from "../src/index";

/** 旧 `MaplatUi` の公開メソッド 19 本（`src/index.ts` のプロトタイプ。実測）。 */
const METHODS = [
  "areaIndex",
  "checkOverlayID",
  "ellips",
  "getShareUrl",
  "handleMarkerAction",
  "handleMarkerActionById",
  "initializer",
  "modalSetting",
  "remove",
  "resolveRelativeLink",
  "setHideMarker",
  "setShowBorder",
  "showContextMenu",
  "showToast",
  "t",
  "translate",
  "updateEnvelope",
  "updateUrl",
  "xyToMapIDs"
];

/** 旧 `MaplatUi` の公開フィールド 41 個（`src/index.ts` のクラス本体。実測）。 */
const FIELDS = [
  "core",
  "appOption",
  "waitReady",
  "waitReadyBridge",
  "pathThatSet",
  "swipers",
  "mobile_if",
  "ui_func",
  "datum",
  "selected_layer",
  "toms",
  "cache_messages",
  "last_toast",
  "share_enable",
  "sliderNew",
  "baseSwiper",
  "overlaySwiper",
  "sliderCommon",
  "contextMenu",
  "splashPromise",
  "_selectCandidateSources",
  "appEnvelope",
  "restoring",
  "poiSwiper",
  "html",
  "enablePoiHtmlNoScroll",
  "enableShare",
  "enableHideMarker",
  "enableBorder",
  "enableMarkerList",
  "disableNoimage",
  "alwaysGpsOn",
  "isTouch",
  "html_id_seed",
  "lastClickPixel",
  "lastClickCoordinate",
  "lastGPSError",
  "selectedMarkerNamespaceID",
  "lang",
  "_t",
  "i18n"
];

/** 生成した直後（起動前）に型が確定しているフィールド。残りは起動の途中で代入される。 */
const FIELD_TYPES_AT_CONSTRUCTION: Record<string, string> = {
  appOption: "object",
  waitReady: "function",
  swipers: "object",
  mobile_if: "boolean",
  ui_func: "string",
  datum: "string",
  selected_layer: "string",
  toms: "number",
  cache_messages: "object",
  restoring: "boolean",
  enablePoiHtmlNoScroll: "boolean",
  enableShare: "boolean",
  enableHideMarker: "boolean",
  enableBorder: "boolean",
  enableMarkerList: "boolean",
  disableNoimage: "boolean",
  alwaysGpsOn: "boolean",
  isTouch: "boolean",
  html_id_seed: "string",
  lang: "string"
};

/** `uiHooks` の 7 段階（`docs/ui-core-lifecycle.md`・`src/ui_init.ts:201-249`）。 */
const PHASES = [
  "onSettingLoaded",
  "onAppdataReady",
  "onUiConfigure",
  "onCoreDomReady",
  "onUiDomReady",
  "onCoreReady",
  "onUiReady"
];

/** 各段階で「旧 UI が済ませているもの」を、DOM に依らない公開面だけで写し取る。 */
type Snapshot = {
  core: boolean;
  mapDivDocument: boolean;
  appData: boolean;
  enableShare: boolean;
  enableBorder: boolean;
  enableHideMarker: boolean;
  enableMarkerList: boolean;
  i18n: boolean;
  t: string;
  lang: string;
  restoring: boolean;
  /** 操作ボタン・透過度のスライダー・右クリックメニュー（旧は `initControls` で作る公開フィールド） */
  controls: boolean;
  splashPromise: string;
};

function snapshot(ui: MaplatUi): Snapshot {
  return {
    core: !!ui.core,
    mapDivDocument: !!ui.core?.mapDivDocument,
    appData: !!ui.core?.appData,
    enableShare: ui.enableShare === true,
    enableBorder: ui.enableBorder === true,
    enableHideMarker: ui.enableHideMarker === true,
    enableMarkerList: ui.enableMarkerList === true,
    i18n: !!ui.i18n,
    t: typeof ui._t,
    lang: ui.lang,
    restoring: ui.restoring === true,
    controls: !!(ui.sliderNew && ui.contextMenu),
    splashPromise: typeof ui.splashPromise
  };
}

/**
 * hook に渡される `context`（層 A の契約。`MaplatCore/src/index.ts` の `buildLifecycleContext`）。
 * 旧でも互換層でも同じ層 A が作るので、**hook の中では `ui.core` ではなくこちらを見る**（M4）。
 */
type HookContext = {
  core: boolean;
  appDataSources: boolean;
  mapDivDocument: boolean;
  /** その段階で `ui.translate()` が返した appName（呼べない段階・例外のときは null。N2） */
  appName: string | null;
  /** その段階で `ui.t()` が返した文字（`t()` は `_t` が無ければキーを返す。呼べなければ null） */
  knownT: string | null;
  documentTitle: string;
};

/**
 * その段階で `translate()`・`t()` が呼べるかを記録する。**例外は投げない**（N2）。
 *
 * 旧では i18n が入る前（onSettingLoaded 等）に `translate()` を呼ぶと `this.i18n!.exists` で落ちる。
 * 互換層は辞書を同梱して onSettingLoaded の時点から呼ばれるので、**記録の失敗で起動（層 A が
 * await する hook）を止めてはならない**。記録できなかった段階は null にする。
 * 「訳が読めているか」の判定は記録ではなく assert（onUiConfigure の `appName`）が担う。
 */
function recordContext(ui: MaplatUi, context: any): HookContext {
  const record = <T>(fn: () => T): T | null => {
    try {
      return fn();
    } catch {
      return null;
    }
  };
  return {
    core: !!context?.core,
    appDataSources: Array.isArray(context?.appData?.sources),
    mapDivDocument: !!context?.mapDivDocument,
    appName: record(() => ui.translate(SETTING.appName) ?? null),
    knownT: record(() => ui.t("control.zoom")),
    documentTitle: typeof document === "undefined" ? "" : document.title
  };
}

/** shadow root をまたいで、文字が完全一致する最も深い要素を返す（セレクタを使わない）。 */
function findDeepest(needle: string): HTMLElement | null {
  const stack: (Document | ShadowRoot)[] = [document];
  let found: HTMLElement | null = null;
  while (stack.length) {
    const root = stack.pop()!;
    for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
      if (el.textContent?.trim() === needle && !found?.contains(el)) found = el;
      if (el.shadowRoot) stack.push(el.shadowRoot);
    }
  }
  // 一番深い（子に同じ文字を持たない）要素を選ぶ
  let node: HTMLElement | null = found;
  while (node) {
    const same = Array.from(node.children).some(
      c => c.textContent?.trim() === needle
    ) as boolean;
    if (!same) return node;
    node = Array.from(node.children).find(
      c => c.textContent?.trim() === needle
    ) as HTMLElement;
  }
  return found;
}

/** 「メニューが開いている」= 自身も祖先も hidden / display:none で隠されていない。 */
function isShown(el: HTMLElement): boolean {
  let node: HTMLElement | null = el;
  while (node) {
    if (
      node.hidden ||
      node.style.display === "none" ||
      node.classList.contains("hidden")
    )
      return false;
    node = node.parentElement;
  }
  return true;
}

const SETTING = {
  appName: { ja: "旧 API の基準", en: "Legacy API baseline" },
  sources: [],
  homePosition: [139.5, 36.2],
  defaultZoom: 14,
  // 機能系キー（U1 追補）。旧クラスの経路では設定ファイルから読む（C1(a) の中身）
  noRotate: true
};

/**
 * この環境（jsdom）で `appName` がどの言語へ落ちるか。
 * 旧 `ui_init.ts` は `appOption.lang || appData.lang || browserLanguage()` の順に言語を決める。
 * `SETTING` は `lang` を持たないので jsdom の `navigator.language`（実測 "en-US"）に落ちる。
 * `lang` が "ja" で始まる環境では ja の値を期待する（環境で決まることを明示しておく）。
 */
const appNameFor = (lang: string) =>
  lang.toLowerCase().startsWith("ja") ? SETTING.appName.ja : SETTING.appName.en;

const tick = () => new Promise(r => setTimeout(r, 0));

/** 起動を 1 回だけ行い、その観測を共有する（1 回の起動が 10 秒前後かかるため）。 */
type Boot = {
  ui: MaplatUi;
  resolved: MaplatUi;
  order: string[];
  atPhase: Record<string, Snapshot>;
  /** hook に渡された `context`（M4・M7 の判定に使う） */
  contexts: Record<string, HookContext>;
  atResolve: Snapshot;
  orderAtResolve: string[];
  noRotate: boolean;
  warned: string[];
  menu: { found: boolean; shown: boolean; clicked: string[] };
};

let booted: Boot;
/** `MaplatUi.createObject` の戻り値（最小の設定で 1 回だけ起動する）。 */
let created: MaplatUi;

beforeAll(async () => {
  // OpenLayers の Map は ResizeObserver を使う（jsdom には無い）
  if (typeof (globalThis as any).ResizeObserver === "undefined") {
    const noop = () => undefined;
    (globalThis as any).ResizeObserver = class {
      observe = noop;
      unobserve = noop;
      disconnect = noop;
    };
  }
  document.head.innerHTML = "<title></title>";
  document.body.innerHTML = '<div id="map_div"></div>';

  const warned: string[] = [];
  const warn = vi.spyOn(console, "warn").mockImplementation((...args) => {
    warned.push(args.map(a => String(a)).join(" "));
  });

  const order: string[] = [];
  const atPhase: Record<string, Snapshot> = {};
  const contexts: Record<string, HookContext> = {};
  const hook = (name: string) => async (context?: unknown) => {
    order.push(name);
    atPhase[name] = snapshot(ui);
    contexts[name] = recordContext(ui, context);
  };

  // `createObject(option)` は `new MaplatUi(option).waitReady!()` と同じ（src/index.ts:30-33）。
  // hook の中からインスタンスを観測するため、ここだけ順序を分けて書く。
  const ui = new MaplatUi({
    appid: "legacy-api",
    setting: { ...SETTING },
    enableShare: true,
    enableBorder: true,
    enableHideMarker: true,
    enableMarkerList: true,
    uiHooks: {
      onSettingLoaded: hook("onSettingLoaded"),
      onAppdataReady: hook("onAppdataReady"),
      onUiConfigure: hook("onUiConfigure"),
      onCoreDomReady: hook("onCoreDomReady"),
      onUiDomReady: hook("onUiDomReady"),
      onCoreReady: hook("onCoreReady"),
      onUiReady: hook("onUiReady")
    }
  } as any);
  const resolved = await ui.waitReady!();
  const atResolve = snapshot(ui);
  const orderAtResolve = [...order];

  // 起動（層 A）が最後まで通ることを確かめてから、機能系キーの値を読む
  await ui.core!.waitReady;
  const noRotate = ui.core!.noRotate === true;

  // `showContextMenu([{ icon, text, callback }])` が項目を出す（C1(d)）
  (ui as any).lastClickPixel = [40, 40];
  (ui as any).lastClickCoordinate = [0, 0];
  const clicked: string[] = [];
  ui.showContextMenu([
    {
      icon: "img/no_image.png",
      text: "旧APIの項目A",
      callback: () => clicked.push("A")
    } as any
  ]);
  await tick();
  const item = findDeepest("旧APIの項目A");
  const menu = {
    found: !!item,
    shown: item ? isShown(item) : false,
    clicked
  };
  item?.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true })
  );
  await tick();

  const warnedAtBoot = [...warned];
  warn.mockRestore();
  booted = {
    ui,
    resolved,
    order,
    atPhase,
    contexts,
    atResolve,
    orderAtResolve,
    noRotate,
    warned: warnedAtBoot,
    menu
  };

  // 静的 createObject の経路（文書化された入口）
  document.body.innerHTML = '<div id="map_div"></div>';
  created = await MaplatUi.createObject({
    appid: "legacy-api-create",
    setting: { ...SETTING, noRotate: undefined }
  } as any);
  // 起動が終わるまで待ってから後片付けする（途中で remove() すると残りの起動が落ちる）
  await created.core!.waitReady;
}, 180000);

afterAll(() => {
  vi.restoreAllMocks();
});

describe("公開面（静的 createObject・19 メソッド・41 フィールド）", () => {
  it("静的 createObject は関数で、MaplatUi を解決する", () => {
    expect(typeof MaplatUi.createObject).toBe("function");
    expect(created).toBeInstanceOf(MaplatUi);
    expect(created.core).toBeTruthy();
  });

  it("19 メソッドはすべてプロトタイプの関数（19 本ちょうど）", () => {
    const proto = MaplatUi.prototype as any;
    for (const name of METHODS)
      expect(typeof proto[name], name).toBe("function");
    expect(METHODS.length).toBe(19);
    // 既知の 19 本以外の公開**メソッド**を増やしていない（constructor と getter/setter は数えない。
    // 互換層は `lang`・`enableShare` 等を getter/setter で持つ設計（§2.3.6）なので、
    // `Object.getOwnPropertyNames` をそのまま比べると Stage 3 で落ちる（M6）。
    const methodNames = Object.getOwnPropertyNames(MaplatUi.prototype)
      .filter(name => name !== "constructor")
      .filter(
        name =>
          typeof Object.getOwnPropertyDescriptor(MaplatUi.prototype, name)
            ?.value === "function"
      );
    expect(methodNames.sort()).toEqual([...METHODS].sort());
  });

  it("41 フィールドはすべて存在する", () => {
    const ui = new MaplatUi({ appid: "surface" } as any);
    for (const name of FIELDS) expect(name in ui, name).toBe(true);
    expect(FIELDS.length).toBe(41);
  });

  it("生成した直後に型が確定しているフィールドはその型", () => {
    const ui = new MaplatUi({ appid: "surface" } as any);
    for (const [name, type] of Object.entries(FIELD_TYPES_AT_CONSTRUCTION)) {
      const value = (ui as any)[name];
      const actual =
        value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
      expect(actual, name).toBe(type);
    }
    // 起動の途中で代入されるフィールドも、起動後にはこの型になる
    expect(typeof booted.ui.core).toBe("object");
    expect(typeof (booted.ui.core as any).changeMap).toBe("function");
    expect(booted.ui.swipers).toBeTypeOf("object");
  });

  it("waitReady は「関数プロパティ」で、プロトタイプには無い（L13 の不変条件）", () => {
    const ui = new MaplatUi({ appid: "surface" } as any);
    expect(typeof ui.waitReady).toBe("function");
    expect("waitReady" in MaplatUi.prototype).toBe(false);
  });
});

describe("createObject → waitReady（文書化された振る舞い）", () => {
  it("stateUrl なし: waitReady は MaplatUi を返し、解決したとき ui.core が非 null", () => {
    expect(booted.resolved).toBe(booted.ui);
    expect(booted.resolved).toBeInstanceOf(MaplatUi);
    expect(booted.atResolve.core).toBe(true);
    expect(booted.atResolve.mapDivDocument).toBe(true);
  });

  it("stateUrl なし: 解決は層 A の起動完了を待たない（旧の不変条件。C1(b)）", () => {
    // 解決した時点で `onCoreReady`・`onUiReady` はまだ呼ばれていない
    expect(booted.orderAtResolve).not.toContain("onCoreReady");
    expect(booted.orderAtResolve).not.toContain("onUiReady");
    expect(booted.orderAtResolve.length).toBeLessThan(PHASES.length);
  });

  it(
    "stateUrl あり: waitReady は MaplatUi を返し、解決したとき ui.core が非 null で、復元中ではない",
    { timeout: 120000 },
    async () => {
      document.body.innerHTML =
        '<div id="map_div" style="width:320px;height:240px"></div>';
      const ui = new MaplatUi({
        appid: "legacy-api-state-url",
        stateUrl: true,
        setting: { ...SETTING, noRotate: undefined }
      } as any);
      const resolved = await ui.waitReady!();
      expect(resolved).toBe(ui);
      expect(resolved).toBeInstanceOf(MaplatUi);
      expect(ui.core).toBeTruthy();
      expect(ui.restoring).toBe(false);
      expect(ui.pathThatSet).toBeUndefined();
      try {
        ui.remove();
      } catch {
        /* 旧実装は core.remove()。後片付けに失敗しても判定に影響しない */
      }
    }
  );
});

describe("uiHooks の 7 段階（§3 L11）", () => {
  it("7 段階がこの順に、ちょうど 1 回ずつ呼ばれる", () => {
    expect(booted.order).toEqual(PHASES);
  });

  it("onSettingLoaded: 設定ファイルが読めている（context.appData に sources がある）", () => {
    // 旧・新のどちらでも通る: 層 A が hook に渡す `context` をそのまま受け取る（pass-through）。
    // **`ui.core` では判定しない**（互換層は setting-loaded の「イベント」で `this.core` を入れる。
    // Core は hook を await してからイベントを出すので、Stage 3 では hook の中で `ui.core` が無い。
    // M4・設計 §2.3.2 (6)・§3 L11）。`context.core` は層 A が作るので旧でも互換層でも真になる。
    const at = booted.contexts.onSettingLoaded;
    expect(at.core).toBe(true);
    expect(at.appDataSources).toBe(true);
    expect(at.mapDivDocument).toBeTypeOf("boolean");
    // `snapshot().appData` は**旧でも互換層でも false**（旧: `ui.core.appData` はまだ入っていない。
    // 互換層: `setting-loaded` のイベントは hook を await した後に出る）。したがってこれは
    // 「Stage 3 で変わる assert」ではなく、両方で成り立つ assert（N3）。
    expect(booted.atPhase.onSettingLoaded.appData).toBe(false);
  });

  it("onAppdataReady: 属性の解釈が済んでいる（enable 系のフィールドが真）", () => {
    const at = booted.atPhase.onAppdataReady;
    expect(at.enableShare).toBe(true);
    expect(at.enableBorder).toBe(true);
    expect(at.enableHideMarker).toBe(true);
    expect(at.enableMarkerList).toBe(true);
  });

  it("onUiConfigure: 翻訳が読めている（i18n と _t があり、その段階で訳が返る）", () => {
    const at = booted.atPhase.onUiConfigure;
    expect(at.i18n).toBe(true);
    expect(at.t).toBe("function");
    expect(at.lang).toBeTypeOf("string");
    expect(at.lang.length).toBeGreaterThan(0);
    // typeof だけでは「whenI18nReady を待たずに hook を呼ぶ」不具合を見逃す（M7）。
    // その段階で `translate()` が実際に訳を返すことまで確かめる（設計 §3 L11 の表・M7）。
    // 旧 `translate` は `this.i18n!.exists` を使うので、i18n が入っていなければここで落ちる。
    const expected = appNameFor(at.lang);
    expect(booted.contexts.onUiConfigure.appName).toBe(expected);
    // `ui.t()` が呼べて、空でない文字を返すことまで見る（N1）。**訳そのものは assert しない**:
    // jsdom は `assets/locales/<lang>/translation.json` を HTTP で読めない（開発サーバーが無い。
    // 実測: 旧 UI はキー "control.zoom" をそのまま返す）ので `"control.zoom"` を固定すると
    // 「辞書を読めないこと」を固定してしまう。Stage 3 の互換層は辞書を同梱して `whenI18nReady()`
    // を待つため、**正しく動くほど "Change Map Zoom" が返って落ちる**（D4 違反）。
    // 訳が読めているかは、上の `translate(appName)` の assert が担う。
    const knownT = booted.contexts.onUiConfigure.knownT;
    expect(knownT).toBeTypeOf("string");
    expect(
      knownT!.length,
      "onUiConfigure で ui.t() が空でない文字を返す"
    ).toBeGreaterThan(0);
  });

  it("onCoreDomReady: 地図の箱ができている", () => {
    expect(booted.atPhase.onCoreDomReady.mapDivDocument).toBe(true);
  });

  it("onUiDomReady: 翻訳が済んだ状態で呼ばれる（題名も設定済み）", () => {
    const at = booted.atPhase.onUiDomReady;
    expect(at.i18n).toBe(true);
    expect(at.t).toBe("function");
    // 旧 `initDocumentTitle` は onUiDomReady で `document.title` に appName を入れる
    // （`ui_init.ts:1362-1365`）。旧でも互換層でも成り立つ（M7）
    expect(booted.contexts.onUiDomReady.documentTitle).toBe(
      appNameFor(at.lang)
    );
  });
});

describe("段階の境目（旧・互換層の両方で成り立つ assert。D4・D7）", () => {
  // 段階の境目の記録（N3）。層 A の `runLifecyclePhase` は「hook を await → 段階のイベントを出す」
  // 順なので、段階のイベント側で走る UI の仕事を同じ段階の hook からは観測できない（設計 §3 L11）。
  // ここに置く assert は**旧でも互換層でも成り立つものだけ**に絞った（M5・N3）。旧だけの保証
  // （「onCoreDomReady ではまだ配線されていない」等）は置かない。「Stage 3 で変わる」のは assert
  // ではなく**待ち方**（`splashPromise` ／ `host.ready` で待つ）だけ。
  it("onCoreReady の時点で操作ボタンの配線が済んでいる（旧はここで initControls を通す）", () => {
    // 旧: ui_init.ts:241-249 の `onCoreReady` が `initControls` を await してから利用者の hook を呼ぶ。
    // **両方で成り立つ assert だけを置く**（M5）。互換層では `sliderNew`・`contextMenu` は限定 facade
    // として早くから在る（設計 §2.3.6）ので、この assert は Stage 3 でも真になる。
    // 旧だけの保証（「onCoreDomReady の時点ではまだ配線されていない」＝ `controls === false`）は
    // ここでは assert しない: 互換層は onCoreDomReady でも facade を持つため、Stage 3 で落ちる（M5）。
    expect(booted.atPhase.onCoreReady.controls).toBe(true);
    expect(booted.ui.core).toBeTruthy();
  });

  it("onUiReady の時点では全面の描画がまだ（旧の約束は「何もしない」）", () => {
    // 旧: `onUiReady` を上書きしていない（ui_init.ts:201-249 に無い）ので、この段階の UI の仕事は無い。
    // Stage 3 で変わる assert: 無し。新は「`#onAppReady` の全面描画はまだ」で、
    // 描画完了を待つ手段は `splashPromise`（＝ host.ready）になる（§2.3.6）。
    expect(booted.atPhase.onUiReady.restoring).toBe(false);
    // 旧は `onUiDomReady`（initSplash）で `splashPromise` を公開フィールドとして置く。
    // Stage 3 でも `splashPromise` は `host.ready` に結ばれる（§2.3.6）ので、この型は変わらない。
    expect(booted.atPhase.onUiDomReady.splashPromise).toBe("object");
    expect(booted.atPhase.onUiReady.splashPromise).toBe("object");
  });

  it("onAppdataReady の時点ではスプラッシュ・題名はまだ出ていない（旧も「この段階の後」）", () => {
    // 旧: initSplash / initDocumentTitle は `onUiDomReady`（ui_init.ts:230-239）で走る。
    // onAppdataReady では `.enable_*` の class とテンプレート（initDom）までが済んでいる。
    // Stage 3 で変わる assert: 待ち方だけが変わる（スプラッシュ・題名は `appdata-ready` の
    // イベント、＝ hook の後。`host.ready` / `splashPromise` で待つ）。判定する assert は
    // 「onAppdataReady で enable 系が真」（上の describe）だけで、この項目は順序の記録に留める。
    expect(booted.order.indexOf("onAppdataReady")).toBeLessThan(
      booted.order.indexOf("onUiDomReady")
    );
  });
});

describe("設計 v2 C1 の 4 件のうち旧で確かめられるもの", () => {
  it("(a) 設定ファイルの機能系キーが効く（noRotate を appOption でなく設定ファイルから読む）", () => {
    // 旧クラスの経路（`__maplatElementMode` でない）では設定ファイルの noRotate を読む。
    // 互換層も `__maplatCompat: true` で同じ経路を通す（C1(a) の全体）。
    expect(booted.noRotate).toBe(true);
    expect(booted.warned.join("\n")).toContain("noRotate");
  });

  it("(b) waitReady の解決時点（上の describe と同じ不変条件を 1 か所に集約）", () => {
    expect(booted.atResolve.core).toBe(true);
    expect(booted.orderAtResolve).not.toContain("onUiReady");
  });

  it("(c) uiHooks の段階（上の describe と同じ。ここでは 7 段階が揃っていることだけ）", () => {
    expect(booted.order).toEqual(PHASES);
    for (const name of PHASES) expect(booted.atPhase[name], name).toBeTruthy();
  });

  it("(d) showContextMenu([{ icon, text, callback }]) が項目を出し、押すと callback が呼ばれる", () => {
    expect(booted.menu.found).toBe(true);
    expect(booted.menu.shown).toBe(true);
    expect(booted.menu.clicked).toEqual(["A"]);
  });
});
