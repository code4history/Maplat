import { q as k, m as D, Y as v, p as L, a as U, r as C, t as A, h as R } from "./index-DJ11YeAw.js";
class N {
  constructor() {
    this.disposed = !1;
  }
  /**
   * Clean up.
   */
  dispose() {
    this.disposed || (this.disposed = !0, this.disposeInternal());
  }
  /**
   * Extension point for disposable objects.
   * @protected
   */
  disposeInternal() {
  }
}
function S() {
}
function P(c) {
  for (const e in c)
    delete c[e];
}
class O {
  /**
   * @param {string} type Type.
   */
  constructor(e) {
    this.propagationStopped, this.defaultPrevented, this.type = e, this.target = null;
  }
  /**
   * Prevent default. This means that no emulated `click`, `singleclick` or `doubleclick` events
   * will be fired.
   * @api
   */
  preventDefault() {
    this.defaultPrevented = !0;
  }
  /**
   * Stop event propagation.
   * @api
   */
  stopPropagation() {
    this.propagationStopped = !0;
  }
}
class T extends N {
  /**
   * @param {*} [target] Default event target for dispatched events.
   */
  constructor(e) {
    super(), this.eventTarget_ = e, this.pendingRemovals_ = null, this.dispatching_ = null, this.listeners_ = null;
  }
  /**
   * @param {string} type Type.
   * @param {import("../events.js").Listener} listener Listener.
   */
  addEventListener(e, t) {
    if (!e || !t)
      return;
    const n = this.listeners_ || (this.listeners_ = {}), s = n[e] || (n[e] = []);
    s.includes(t) || s.push(t);
  }
  /**
   * Dispatches an event and calls all listeners listening for events
   * of this type. The event parameter can either be a string or an
   * Object with a `type` property.
   *
   * @param {import("./Event.js").default|string} event Event object.
   * @return {boolean|undefined} `false` if anyone called preventDefault on the
   *     event object or if any of the listeners returned false.
   * @api
   */
  dispatchEvent(e) {
    const t = typeof e == "string", n = t ? e : e.type, s = this.listeners_ && this.listeners_[n];
    if (!s)
      return;
    const l = t ? new O(e) : (
      /** @type {Event} */
      e
    );
    l.target || (l.target = this.eventTarget_ || this);
    const i = this.dispatching_ || (this.dispatching_ = {}), r = this.pendingRemovals_ || (this.pendingRemovals_ = {});
    n in i || (i[n] = 0, r[n] = 0), ++i[n];
    let d;
    for (let u = 0, g = s.length; u < g; ++u)
      if ("handleEvent" in s[u] ? d = /** @type {import("../events.js").ListenerObject} */
      s[u].handleEvent(l) : d = /** @type {import("../events.js").ListenerFunction} */
      s[u].call(this, l), d === !1 || l.propagationStopped) {
        d = !1;
        break;
      }
    if (--i[n] === 0) {
      let u = r[n];
      for (delete r[n]; u--; )
        this.removeEventListener(n, S);
      delete i[n];
    }
    return (
      /** @type {boolean|undefined} */
      d
    );
  }
  /**
   * Clean up.
   * @override
   */
  disposeInternal() {
    this.listeners_ && P(this.listeners_);
  }
  /**
   * Get the listeners for a specified event type. Listeners are returned in the
   * order that they will be called in.
   *
   * @param {string} type Type.
   * @return {Array<import("../events.js").Listener>|undefined} Listeners.
   */
  getListeners(e) {
    return this.listeners_ && this.listeners_[e] || void 0;
  }
  /**
   * @param {string} [type] Type. If not provided,
   *     `true` will be returned if this event target has any listeners.
   * @return {boolean} Has listeners.
   */
  hasListener(e) {
    return this.listeners_ ? e ? e in this.listeners_ : Object.keys(this.listeners_).length > 0 : !1;
  }
  /**
   * @param {string} type Type.
   * @param {import("../events.js").Listener} listener Listener.
   */
  removeEventListener(e, t) {
    if (!this.listeners_)
      return;
    const n = this.listeners_[e];
    if (!n)
      return;
    const s = n.indexOf(t);
    s !== -1 && (this.pendingRemovals_ && e in this.pendingRemovals_ ? (n[s] = S, ++this.pendingRemovals_[e]) : (n.splice(s, 1), n.length === 0 && delete this.listeners_[e]));
  }
}
let b = null;
function B() {
  return typeof customElements > "u" || customElements.get(k) ? Promise.resolve() : b || (b = import("./maplat_core_element-bzNs4P6z.js").then(
    () => {
    },
    (c) => {
      throw b = null, c;
    }
  ), b);
}
function H(c) {
  const e = [], t = /* @__PURE__ */ new Map();
  let n = {}, s = !1, l = null;
  const i = () => c(), r = (a, h) => {
    a === "open" && (s = !0), a === "close" && (s = !1);
    for (const m of [...t.get(a) ?? []])
      m({ type: a, ...h });
  }, d = (a) => typeof a == "string" ? { text: a } : {
    icon: typeof a.icon == "string" ? a.icon : void 0,
    text: typeof a.text == "string" ? a.text : "",
    // 旧 contextmenu の text は HTML（「層 B でサニタイズする」なので、ここでは HTML のまま渡す）
    html: !0,
    callback: () => {
      const h = i(), m = h?.app ? h.app.app : void 0, w = {
        coordinate: n.coordinate ?? null,
        data: a.data ?? null
      };
      typeof a.callback == "function" && a.callback(
        w,
        m?.mapObject
      );
    }
  }, u = () => e.filter((a) => typeof a == "string" || a.separator !== !0).map(d), g = (a, h) => {
    const m = i();
    if (!m) return;
    n = {
      pixel: Array.isArray(a) ? a : n.pixel,
      coordinate: Array.isArray(h) ? h : n.coordinate
    };
    const w = Array.isArray(n.pixel) ? { x: n.pixel[0], y: n.pixel[1] } : void 0;
    m.showMenu({
      items: u(),
      at: w,
      label: m.t("menu.poi_candidates")
    });
  }, o = () => {
    i()?.closeMenu(), s && r("close");
  }, p = {
    get container() {
      const a = i();
      return a?.shadowRoot ? a.shadowRoot.querySelector(".poi-menu") : null;
    },
    Internal: {
      openMenu: g,
      closeMenu: o,
      get opened() {
        return s;
      }
    },
    extend: (a) => {
      if (Array.isArray(a))
        for (const h of a) e.push(h);
    },
    clear: () => {
      e.length = 0;
    },
    push: (a) => {
      e.push(a);
    },
    pop: () => {
      e.pop();
    },
    shift: () => {
      e.shift();
    },
    countItems: () => e.length,
    isOpen: () => s,
    close: o,
    updatePosition: (a) => {
      s && g(a, n.coordinate);
    },
    on: (a, h) => {
      const m = t.get(a) ?? /* @__PURE__ */ new Set();
      m.add(h), t.set(a, m);
    },
    un: (a, h) => {
      t.get(a)?.delete(h);
    },
    off: (a, h) => {
      t.get(a)?.delete(h);
    },
    attach: (a) => {
      p.detach(), l = a, a.addEventListener("menuopen", f), a.addEventListener("menuclose", y);
    },
    detach: () => {
      l && (l.removeEventListener("menuopen", f), l.removeEventListener("menuclose", y), l = null, s = !1);
    }
  };
  function f() {
    r("open", n);
  }
  function y() {
    s && r("close");
  }
  return p;
}
const $ = /* @__PURE__ */ new Set([
  "init",
  "use",
  "services",
  "store",
  "addResource",
  "addResources",
  "addResourceBundle",
  "hasResourceBundle",
  "getResourceBundle",
  "getDataByLanguage",
  "loadNamespaces",
  "loadLanguages",
  "reloadResources",
  "isInitialized",
  "isInitializing",
  "format",
  "dir",
  "languages",
  "resolvedLanguage"
]);
function V(c) {
  const e = /* @__PURE__ */ new Set(), t = /* @__PURE__ */ new Set(), n = () => c(), l = {
    get language() {
      const i = n();
      return i ? i.currentLang : "";
    },
    t: (i, r) => {
      const d = n();
      return d ? d.t(i, r) : i;
    },
    exists: (i) => {
      const r = n();
      return r ? r.hasTranslation(i) : !1;
    },
    changeLanguage: async (i) => {
      const r = n();
      if (!r) return;
      r.setAttribute("lang", i), await r.whenI18nReady();
      const d = r.currentLang;
      for (const u of [...e]) u(d);
    },
    on: (i, r) => {
      i === "languageChanged" ? e.add(r) : I(t, i);
    },
    off: (i, r) => {
      i === "languageChanged" && e.delete(r);
    }
  };
  return new Proxy(l, {
    get(i, r, d) {
      return r in i || typeof r != "string" || !$.has(r) ? Reflect.get(i, r, d) : (I(
        t,
        r,
        `ui.i18n.${r}() is not available on the compatibility layer (backed by <maplat-ui>).`
      ), () => {
      });
    }
  });
}
function I(c, e, t) {
  c.has(e) || (c.add(e), console.warn(
    t ?? `ui.i18n: "${e}" is not supported by the compatibility layer; ignored.`
  ));
}
function F(c) {
  const e = /* @__PURE__ */ new Set();
  let t = null, n = -1;
  const s = () => c(), l = (o) => o?.querySelector(":scope > maplat-app") ?? null, i = (o) => {
    const p = o?.getAttribute("transparency");
    if (p == null || p === "") return;
    const f = Number(p);
    return Number.isFinite(f) ? f : void 0;
  }, r = () => {
    const o = s();
    let p = i(l(o));
    if (p === void 0)
      try {
        const f = o?.app?.app, y = Number(f?.getTransparency?.());
        f && Number.isFinite(y) && (p = y);
      } catch {
      }
    return p === void 0 && (p = i(o)), p === void 0 ? 0 : Math.min(1, Math.max(0, p / 100));
  }, d = () => {
    const o = r();
    if (o === n) return;
    const p = n;
    n = o;
    for (const f of [...e])
      f({
        type: "propertychange",
        key: "slidervalue",
        oldValue: p,
        newValue: o
      });
  }, u = () => {
    const o = s();
    !o || t || typeof MutationObserver > "u" || (n = r(), t = new MutationObserver(() => d()), t.observe(o, {
      attributes: !0,
      attributeFilter: ["transparency"],
      subtree: !0
    }));
  }, g = {
    get element() {
      const o = s();
      return o?.shadowRoot ? o.shadowRoot.querySelector("input.slider") : null;
    },
    get: (o) => o === "slidervalue" ? r() : void 0,
    set: (o, p) => {
      if (o !== "slidervalue") return;
      const f = s();
      if (!f) return;
      const y = Number(p);
      if (!Number.isFinite(y)) return;
      const a = Math.min(1, Math.max(0, y));
      u(), f.setAttribute("transparency", `${Math.round(a * 100)}`);
    },
    setValue: (o) => g.set("slidervalue", o),
    // 層 B の部品へ委譲する（Shadow DOM の中の input を直接触らない）
    setEnable: (o) => s()?.setTransparencyEnabled(!!o),
    on: (o, p) => {
      o === "propertychange" && (e.add(p), u());
    },
    off: (o, p) => {
      o === "propertychange" && e.delete(p);
    },
    un: (o, p) => {
      o === "propertychange" && e.delete(p);
    },
    // 起動の前に `on` された購読も、ホストができたら見張りを始める
    attach: () => {
      e.size > 0 && u();
    },
    detach: () => {
      t?.disconnect(), t = null;
    }
  };
  return g;
}
function _(c, e) {
  const t = () => c()?.slider(e) ?? null, n = () => t()?.items ?? [], s = () => t()?.selectedMapID ?? null;
  return {
    get el() {
      return t()?.element ?? null;
    },
    get slides() {
      const i = s();
      return n().map((r, d) => {
        const u = i === r.mapID;
        return {
          mapID: r.mapID,
          dataset: { swiperSlideIndex: `${d}` },
          classList: {
            contains: (g) => g === "selected" ? u : !1
          },
          getAttribute: (g) => g === "data" ? r.mapID : null
        };
      });
    },
    get activeIndex() {
      return t()?.activeIndex ?? 0;
    },
    get count() {
      return n().length;
    },
    // 旧 Swiper の `destroyed`。層 B のスライダーは破棄しない（地図の切り替えで作り直す）
    destroyed: !1,
    slideToMapID: (i) => t()?.setSelectedMapID(i),
    setSlideMapID: (i) => t()?.setSelectedMapID(i),
    setSlideMapIDAsSelected: (i) => t()?.setSelectedOnly(i),
    slideToIndex: (i) => {
      const r = n()[i];
      r && t()?.setSelectedMapID(r.mapID);
    },
    setSlideIndex: (i) => {
      const r = n()[i];
      r && t()?.setSelectedMapID(r.mapID);
    },
    setSlideIndexAsSelected: (i) => {
      const r = n()[i];
      t()?.setSelectedOnly(r ? r.mapID : null);
    },
    // 旧 UI は「次の地図 / 前の地図」を 1 つ送っていた（`step` は端で止まる）
    slideNext: () => {
      t()?.step(1);
    },
    slidePrev: () => {
      t()?.step(-1);
    },
    update: () => t()?.refresh(),
    destroy: () => {
    }
  };
}
async function G(c, e, t, n = 10) {
  if (!c || !e || !Array.isArray(t) || t.length < 2) return [];
  const s = c.from;
  if (!s || typeof s.sysCoord2MercAsync != "function") return [];
  const l = await s.sysCoord2MercAsync(t);
  return !Array.isArray(l) || !l.every((i) => Number.isFinite(Number(i))) ? [] : e.mapsAt(D(l.map(Number)), n);
}
const j = [
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
], q = [
  "mobileIF",
  "disableNoimage",
  "northTop",
  "markerList",
  "translateUI"
];
let x = !1;
const z = "MaplatUi: the MaplatUi class is deprecated and will be removed in 2.0. Use the <maplat-ui> element (@maplat/ui/element) with <maplat-app> instead.";
function K() {
  x || (x = !0, console.warn(z));
}
class E extends T {
  /** Core の `MaplatApp`（`lifecycle:setting-loaded` で入る。それまでは undefined）。 */
  core;
  appOption;
  waitReady;
  waitReadyBridge;
  pathThatSet;
  swipers = {};
  mobile_if = !1;
  ui_func = "default";
  datum = "default";
  selected_layer = "default";
  toms = 0;
  cache_messages = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  last_toast;
  share_enable;
  sliderNew;
  baseSwiper;
  overlaySwiper;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sliderCommon;
  contextMenu;
  splashPromise;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _selectCandidateSources;
  appEnvelope;
  restoring = !1;
  poiSwiper;
  html;
  enablePoiHtmlNoScroll = !1;
  enableShare = !1;
  enableHideMarker = !1;
  enableBorder = !1;
  enableMarkerList = !1;
  disableNoimage = !1;
  alwaysGpsOn = !1;
  isTouch = !1;
  html_id_seed;
  lastClickPixel;
  lastClickCoordinate;
  lastGPSError;
  selectedMarkerNamespaceID;
  #e;
  // 層 A のイベントの再送出を外す関数
  #s;
  #i;
  #t = !1;
  #o = /* @__PURE__ */ new Set();
  #r;
  #l;
  /** 旧 API のコンストラクタ。`stateUrl` のときだけ、旧と同じく自分から起動を始める。 */
  constructor(e) {
    super(), K(), this.appOption = e ?? {}, this.html_id_seed = `${Math.floor(Math.random() * 9e3) + 1e3}`, this.#r = Y(e), this.sliderNew = F(() => this.#e ?? null), this.contextMenu = H(() => this.#e ?? null), this.baseSwiper = _(() => this.#e ?? null, "base"), this.overlaySwiper = _(
      () => this.#e ?? null,
      "overlay"
    ), this.swipers = { base: this.baseSwiper, overlay: this.overlaySwiper }, this.enableShare = e.enableShare === !0, this.enableBorder = e.enableBorder === !0, this.enableHideMarker = e.enableHideMarker === !0, this.enableMarkerList = e.enableMarkerList === !0, this.enablePoiHtmlNoScroll = e.enablePoiHtmlNoScroll === !0, this.alwaysGpsOn = e.alwaysGpsOn === !0, this.disableNoimage = e.disableNoimage === !0, this.isTouch = typeof window < "u" && "ontouchstart" in window, this.appEnvelope = e.appEnvelope, this.waitReady = () => this.#a(), this.appOption.stateUrl === !0 && queueMicrotask(() => {
      this.#t || this.#a().catch((t) => {
        console.warn(
          `<${v}>: MaplatUi startup failed (stateUrl).`,
          t
        );
      });
    });
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
  static async createObject(e) {
    return new E(e).waitReady();
  }
  // ---- 公開メソッド 19 本（旧と同じ名前・同じ並び。増やさない）----
  /** 旧 `initializer`（UI の初期化。互換層では起動を 1 回だけ始める）。 */
  async initializer(e) {
    return this.#a();
  }
  /** 旧 `t`（UI の文言）。 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t(e, t) {
    return this.#e ? this.#e.t(e, t) : e;
  }
  /** 旧 `translate`（多言語の値から今の言語を選ぶ）。 */
  translate(e) {
    return !e || typeof e == "string" ? e : this.#e ? this.#e.translateText(e) : L(e, this.lang);
  }
  /** 旧 `getShareUrl`（共有の URL）。 */
  getShareUrl(e) {
    return this.#e ? this.#e.getShareUrl(e) : typeof location > "u" ? "" : e === "view" ? location.href : location.href.split("?")[0].split("#")[0];
  }
  /** 旧 `setShowBorder`（枠線の表示）。 */
  setShowBorder(e) {
    this.#e?.setShowBorder(!!e);
  }
  /** 旧 `updateEnvelope`（枠線の描き直し）。 */
  updateEnvelope() {
    this.#e?.refreshEnvelopes();
  }
  /** 旧 `setHideMarker`（マーカーの非表示）。 */
  setHideMarker(e) {
    this.#e?.setHideMarker(!!e);
  }
  /** 旧 `handleMarkerAction`（POI の吹き出しを開く）。 */
  handleMarkerAction(e) {
    const t = e ?? {}, n = typeof t.namespaceID == "string" && t.namespaceID !== "" ? t.namespaceID : typeof t.id == "string" || typeof t.id == "number" ? String(t.id) : void 0;
    n !== void 0 && this.#e?.openMarker(n);
  }
  /** 旧 `handleMarkerActionById`（id で POI の吹き出しを開く）。 */
  handleMarkerActionById(e) {
    this.#e?.openMarker(e);
  }
  /** 旧 `showContextMenu`（汎用メニュー。POI の重なりの選択も同じ部品）。 */
  showContextMenu(e) {
    this.contextMenu && (this.contextMenu.clear(), this.contextMenu.extend(e), this.contextMenu.Internal.openMenu(
      this.lastClickPixel,
      this.lastClickCoordinate
    ));
  }
  /** 旧 `xyToMapIDs`（点に重なる地図の mapID。範囲の狭い順）。 */
  async xyToMapIDs(e, t = 10) {
    return G(this.core, this.#e, e, t);
  }
  /** 旧 `areaIndex`（4 点の多角形の面積）。 */
  areaIndex(e) {
    return U(e);
  }
  /** 旧 `checkOverlayID`（重ねる地図の行にその地図があるか）。 */
  checkOverlayID(e) {
    return this.#e?.hasMap(e, "overlay") === !0;
  }
  /** 旧 `modalSetting`（画面の切り替え）。 */
  modalSetting(e) {
    this.#e?.openModalByLegacyName(e);
  }
  /** 旧 `ellips`（見出しの省略表示）。移設先は `src/shared/text.ts` の `ellipsize`。 */
  ellips() {
    this.#e?.refreshEllipsis();
  }
  /** 旧 `updateUrl`（状態 URL の書き直し）。 */
  updateUrl() {
    this.#e?.refreshStateUrl();
  }
  /** 旧 `resolveRelativeLink`（相対 URL の解決）。 */
  resolveRelativeLink(e, t) {
    return C(e, t);
  }
  /** 旧 `showToast`（短い知らせ）。 */
  showToast(e, t) {
    this.#e?.showToast(e, t);
  }
  /** 旧 `remove`（UI の後片付け。地図（子の要素）ごと外す）。 */
  remove() {
    this.#t = !0, this.#s?.(), this.#s = void 0, this.contextMenu?.detach(), this.sliderNew?.detach(), this.#e?.remove(), this.#e = void 0, this.core = void 0;
  }
  // ---- 旧のフィールドのうち、層 B の今の値を読むもの（getter なのでメソッドに数えない）----
  /** 旧 `ui.lang`（今の言語）。 */
  get lang() {
    return this.#e ? this.#e.currentLang : this.#r;
  }
  /**
   * 旧 `ui.lang = …`（旧は書き換えられるフィールド。レビュー m2）。ホストの `lang` 属性へ流す
   * （起動前は、起動するまでの `lang` の読み値として覚える）。文字列でなければ警告して無視する。
   *
   * **起動前の代入は起動後の言語にならない**（積み残しの Info）。`#createHost` は `option.lang`
   * しか流さないので、起動後は要素が言語を決める（`lang` 属性 → 設定ファイル → ブラウザ）。
   * 旧も `ui_init` が起動時に言語を上書きしていたので、振る舞いは旧と同じ。
   */
  set lang(e) {
    if (typeof e != "string" || e === "") {
      this.#n(
        "set:lang",
        `<${v}>: MaplatUi.lang must be a non-empty string; the assignment was ignored.`
      );
      return;
    }
    this.#e ? this.#e.lang = e : this.#r = e;
  }
  /** 旧 `ui.mapID`（今の地図の id。ホストの `map-id` 属性を読む）。 */
  get mapID() {
    if (this.#e)
      try {
        return this.#e.mapId ?? this.core?.from?.mapID ?? void 0;
      } catch {
        return this.core?.from?.mapID ?? void 0;
      }
  }
  /** 旧 `ui.transparency`（透過度。ホストの `transparency` 属性を読む）。 */
  get transparency() {
    if (!this.#e) return;
    const e = this.#e.getAttribute("transparency");
    if (e !== null && e !== "") {
      const t = Number(e);
      if (Number.isFinite(t)) return t;
    }
    try {
      return this.core?.getTransparency();
    } catch {
      return;
    }
  }
  /** 旧 `ui._t`（訳の関数。i18n が入るまでは undefined）。 */
  get _t() {
    const e = this.#e;
    if (e)
      return (t, n) => e.t(t, n);
  }
  /** 旧 `ui._t = …` は受けない（訳は `<maplat-ui>` が持つ）。strict でも例外にせず、警告して無視する（m2）。 */
  set _t(e) {
    this.#n(
      "set:_t",
      `<${v}>: MaplatUi._t is read-only now (translations live in <maplat-ui>); the assignment was ignored.`
    );
  }
  /** 旧 `ui.i18n`（限定 facade。`docs/api/migration-ui-shadow-dom.md` の「型の変化」を参照）。 */
  get i18n() {
    if (this.#e)
      return this.#l ??= V(() => this.#e ?? null), this.#l;
  }
  /**
   * 旧 `ui.i18n = …` は受けない（翻訳ライブラリのインスタンスはもう無い。限定 facade だけを返す）。
   * strict でも例外にせず、警告して無視する（m2）。
   */
  set i18n(e) {
    this.#n(
      "set:i18n",
      `<${v}>: MaplatUi.i18n is read-only now (a limited facade over <maplat-ui>); the assignment was ignored.`
    );
  }
  // ---- 起動 ----
  #c() {
    return this.appOption.stateUrl === !0;
  }
  /** 起動を 1 回だけ始める（`waitReady`・`initializer`・stateUrl の自動起動が同じ Promise を共有する）。 */
  #a() {
    return this.#i || (this.#i = this.#d()), this.#i;
  }
  async #d() {
    if (await B(), this.#t) return this;
    const e = this.appOption, t = typeof location < "u" ? location.hash : "";
    this.#c() && /[#!&/]s:/.test(t) && (this.restoring = !0);
    const n = this.#h();
    this.#e = n, n.preloadMediaViewer(), this.splashPromise = n.ready.then(
      () => {
      },
      () => {
      }
    ), this.contextMenu.attach(n), this.sliderNew.attach(), this.#s = this.#u(n), n.addEventListener(
      "pointerdown",
      (l) => {
        const i = l, r = n.getBoundingClientRect(), d = [
          Math.round(i.clientX - r.left),
          Math.round(i.clientY - r.top)
        ];
        this.lastClickPixel = d;
        try {
          this.lastClickCoordinate = this.core?.mapObject?.getCoordinateFromPixel(d);
        } catch {
          this.lastClickCoordinate = void 0;
        }
      },
      !0
    );
    const s = this.#c();
    return await new Promise((l, i) => {
      let r = !1;
      const d = (u) => {
        r || (r = !0, u === void 0 ? l() : i(u));
      };
      n.addEventListener("lifecycle:setting-loaded", () => {
        if (this.#t) {
          d();
          return;
        }
        this.core = M(n) ?? this.core, s || (this.restoring = !1, d());
      }), n.addEventListener("lifecycle:appdata-ready", () => {
        this.#f(n);
      }), n.addEventListener("lifecycle:error", (u) => {
        d(W(u));
      }), s && n.ready.then(
        () => {
          this.core = M(n) ?? this.core, this.restoring = !1, d();
        },
        (u) => d(u)
      ), this.#p(e).appendChild(n);
    }), this.#t && n.remove(), this;
  }
  /**
   * 層 A のイベント（子の `<maplat-app>` が出し、ホストまで泡立つ）を `MaplatUi` 自身へ出し直す。
   * 旧 `app.addEventListener("clickMarker", fn)`（`demo/dev.ts`）が意味を持つ。
   * `ol/events/Target` の `dispatchEvent` は `target` を代入するので、DOM の Event ではなく
   * `{ type, detail }` のプレーンなオブジェクトで出す（m4）。`uiReady` は要素だけのイベントなので出さない。
   * 子を繋ぐ前に張る（起動の lifecycle も届くように）。
   */
  #u(e) {
    const t = [...A, ...R], n = (s) => {
      this.#t || this.dispatchEvent({
        type: s.type,
        detail: s.detail
      });
    };
    for (const s of t) e.addEventListener(s, n);
    return () => {
      for (const s of t) e.removeEventListener(s, n);
    };
  }
  /** 地図を置く要素（旧 `div`。要素ならそれ、id ならその要素、無ければ `#map_div` か新しい div）。 */
  #p(e) {
    const t = e.div;
    if (t instanceof HTMLElement) return t;
    if (typeof t == "string" && t !== "") {
      const l = document.getElementById(t);
      if (l) return l;
    }
    const n = document.getElementById("map_div");
    if (n) return n;
    const s = document.createElement("div");
    return s.id = "map_div", document.body.appendChild(s), s;
  }
  /**
   * `<maplat-ui>` を作り、旧 `option` を属性・プロパティへ流す。
   * 文書へ繋ぐ前に済ませる（繋がった拍で層 A の起動が始まるため）。
   */
  #h() {
    const e = document.createElement(v);
    e.style.display = "block", e.style.position = "absolute", e.style.top = "0", e.style.left = "0", e.style.right = "0", e.style.bottom = "0", e.style.width = "auto", e.style.height = "auto";
    const t = this.appOption;
    for (const [r, d] of j) {
      const u = t[r];
      u != null && (e[d] = u);
    }
    const n = t.pwaWorker;
    typeof n == "string" && n !== "" ? e.pwaWorker = n : (n === !1 || n === null) && e.disablePwaWorker();
    const s = t.pwaScope;
    typeof s == "string" && s !== "" && (e.pwaScope = s), e.appId = typeof t.appid == "string" && t.appid !== "" ? t.appid : "sample", t.setting !== void 0 && (e.setting = t.setting);
    const l = t.restore;
    l && typeof l == "object" && (e.restore = l);
    const i = {
      ...t,
      __maplatCompat: !0
    };
    delete i.div, delete i.uiHooks, delete i.setting, e.appOption = i, e.uiHooks = X(e, t.uiHooks);
    for (const r of q)
      t[r] !== void 0 && this.#n(
        `dead:${r}`,
        `<${v}>: appOption.${r} is no longer used and was ignored.`
      );
    return e;
  }
  /**
   * 設定ファイルの機能系キーのうち、層 B が自分で読む 2 つ。
   * `lifecycle:appdata-ready` のとき、option に無ければ `appData` から読んで属性へ流す。
   * **設定ファイルを読み直さない**（すでに Core が読んだ `appData` を見る）。
   */
  #f(e) {
    const t = this.appOption, n = M(e)?.appData;
    if (n) {
      if (t.tapDuration === void 0) {
        const s = n.tapDuration;
        typeof s == "number" && Number.isFinite(s) && (e.tapDuration = s);
      }
      if (t.tapUIVanish === void 0) {
        const s = n.tapUIVanish;
        typeof s == "boolean" && (e.tapUiVanish = s);
      }
    }
  }
  #n(e, t) {
    this.#o.has(e) || (this.#o.add(e), console.warn(t));
  }
}
function M(c) {
  return c.app?.app;
}
function W(c) {
  const e = c.detail;
  return e?.error instanceof Error ? e.error : typeof e?.message == "string" ? new Error(e.message) : new Error(`<${v}>: the lifecycle failed.`);
}
function Y(c) {
  return typeof c.lang == "string" && c.lang !== "" ? c.lang : typeof navigator < "u" && navigator.language ? navigator.language : "ja";
}
function X(c, e) {
  const t = { ...e ?? {} }, n = e?.onUiConfigure;
  return t.onUiConfigure = async (s) => {
    try {
      await c.whenI18nReady();
    } catch (l) {
      console.warn(
        `<${v}>: failed to load the language files before onUiConfigure.`,
        l
      );
    }
    if (n) return n(s);
  }, t;
}
export {
  E as MaplatUi
};
