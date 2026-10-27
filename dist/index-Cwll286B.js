import { t as D, m as L, u as v, p as A, a as U, r as C, h as R, W as N } from "./index-DRoncYsZ.js";
class T {
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
function ee(i, e, t) {
  let n, s;
  t = t || E;
  let o = 0, r = i.length, a = !1;
  for (; o < r; )
    n = o + (r - o >> 1), s = +t(i[n], e), s < 0 ? o = n + 1 : (r = n, a = !s);
  return a ? o : ~o;
}
function E(i, e) {
  return i > e ? 1 : i < e ? -1 : 0;
}
function te(i, e) {
  return i < e ? 1 : i > e ? -1 : 0;
}
function ne(i, e, t) {
  if (i[0] <= e)
    return 0;
  const n = i.length;
  if (e <= i[n - 1])
    return n - 1;
  if (typeof t == "function") {
    for (let s = 1; s < n; ++s) {
      const o = i[s];
      if (o === e)
        return s;
      if (o < e)
        return t(e, i[s - 1], o) > 0 ? s - 1 : s;
    }
    return n - 1;
  }
  if (t > 0) {
    for (let s = 1; s < n; ++s)
      if (i[s] < e)
        return s - 1;
    return n - 1;
  }
  if (t < 0) {
    for (let s = 1; s < n; ++s)
      if (i[s] <= e)
        return s;
    return n - 1;
  }
  for (let s = 1; s < n; ++s) {
    if (i[s] == e)
      return s;
    if (i[s] < e)
      return i[s - 1] - e < e - i[s] ? s - 1 : s;
  }
  return n - 1;
}
function se(i, e, t) {
  for (; e < t; ) {
    const n = i[e];
    i[e] = i[t], i[t] = n, ++e, --t;
  }
}
function ie(i, e) {
  const t = Array.isArray(e) ? e : [e], n = t.length;
  for (let s = 0; s < n; s++)
    i[i.length] = t[s];
}
function O(i, e) {
  const t = i.length;
  if (t !== e.length)
    return !1;
  for (let n = 0; n < t; n++)
    if (i[n] !== e[n])
      return !1;
  return !0;
}
function re(i, e, t) {
  const n = e || E;
  return i.every(function(s, o) {
    if (o === 0)
      return !0;
    const r = n(i[o - 1], s);
    return !(r > 0 || r === 0);
  });
}
function ae() {
  return !0;
}
function S() {
}
function oe(i) {
  let e, t, n;
  return function() {
    const s = Array.prototype.slice.call(arguments);
    return (!t || this !== n || !O(s, t)) && (n = this, t = s, e = i.apply(this, s)), e;
  };
}
function P(i) {
  for (const e in i)
    delete i[e];
}
function le(i) {
  let e;
  for (e in i)
    return !1;
  return !e;
}
class B {
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
class H extends T {
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
    const o = t ? new B(e) : (
      /** @type {Event} */
      e
    );
    o.target || (o.target = this.eventTarget_ || this);
    const r = this.dispatching_ || (this.dispatching_ = {}), a = this.pendingRemovals_ || (this.pendingRemovals_ = {});
    n in r || (r[n] = 0, a[n] = 0), ++r[n];
    let u;
    for (let d = 0, g = s.length; d < g; ++d)
      if ("handleEvent" in s[d] ? u = /** @type {import("../events.js").ListenerObject} */
      s[d].handleEvent(o) : u = /** @type {import("../events.js").ListenerFunction} */
      s[d].call(this, o), u === !1 || o.propagationStopped) {
        u = !1;
        break;
      }
    if (--r[n] === 0) {
      let d = a[n];
      for (delete a[n]; d--; )
        this.removeEventListener(n, S);
      delete r[n];
    }
    return (
      /** @type {boolean|undefined} */
      u
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
function $() {
  return typeof customElements > "u" || customElements.get(D) ? Promise.resolve() : b || (b = import("./maplat_core_element-CL77UEaI.js").then(
    () => {
    },
    (i) => {
      throw b = null, i;
    }
  ), b);
}
function V(i) {
  const e = [], t = /* @__PURE__ */ new Map();
  let n = {}, s = !1, o = null;
  const r = () => i(), a = (l, h) => {
    l === "open" && (s = !0), l === "close" && (s = !1);
    for (const m of [...t.get(l) ?? []])
      m({ type: l, ...h });
  }, u = (l) => typeof l == "string" ? { text: l } : {
    icon: typeof l.icon == "string" ? l.icon : void 0,
    text: typeof l.text == "string" ? l.text : "",
    // 旧 contextmenu の text は HTML（「層 B でサニタイズする」なので、ここでは HTML のまま渡す）
    html: !0,
    callback: () => {
      const h = r(), m = h?.app ? h.app.app : void 0, w = {
        coordinate: n.coordinate ?? null,
        data: l.data ?? null
      };
      typeof l.callback == "function" && l.callback(
        w,
        m?.mapObject
      );
    }
  }, d = () => e.filter((l) => typeof l == "string" || l.separator !== !0).map(u), g = (l, h) => {
    const m = r();
    if (!m) return;
    n = {
      pixel: Array.isArray(l) ? l : n.pixel,
      coordinate: Array.isArray(h) ? h : n.coordinate
    };
    const w = Array.isArray(n.pixel) ? { x: n.pixel[0], y: n.pixel[1] } : void 0;
    m.showMenu({
      items: d(),
      at: w,
      label: m.t("menu.poi_candidates")
    });
  }, c = () => {
    r()?.closeMenu(), s && a("close");
  }, p = {
    get container() {
      const l = r();
      return l?.shadowRoot ? l.shadowRoot.querySelector(".poi-menu") : null;
    },
    Internal: {
      openMenu: g,
      closeMenu: c,
      get opened() {
        return s;
      }
    },
    extend: (l) => {
      if (Array.isArray(l))
        for (const h of l) e.push(h);
    },
    clear: () => {
      e.length = 0;
    },
    push: (l) => {
      e.push(l);
    },
    pop: () => {
      e.pop();
    },
    shift: () => {
      e.shift();
    },
    countItems: () => e.length,
    isOpen: () => s,
    close: c,
    updatePosition: (l) => {
      s && g(l, n.coordinate);
    },
    on: (l, h) => {
      const m = t.get(l) ?? /* @__PURE__ */ new Set();
      m.add(h), t.set(l, m);
    },
    un: (l, h) => {
      t.get(l)?.delete(h);
    },
    off: (l, h) => {
      t.get(l)?.delete(h);
    },
    attach: (l) => {
      p.detach(), o = l, l.addEventListener("menuopen", f), l.addEventListener("menuclose", y);
    },
    detach: () => {
      o && (o.removeEventListener("menuopen", f), o.removeEventListener("menuclose", y), o = null, s = !1);
    }
  };
  function f() {
    a("open", n);
  }
  function y() {
    s && a("close");
  }
  return p;
}
const F = /* @__PURE__ */ new Set([
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
function G(i) {
  const e = /* @__PURE__ */ new Set(), t = /* @__PURE__ */ new Set(), n = () => i(), o = {
    get language() {
      const r = n();
      return r ? r.currentLang : "";
    },
    t: (r, a) => {
      const u = n();
      return u ? u.t(r, a) : r;
    },
    exists: (r) => {
      const a = n();
      return a ? a.hasTranslation(r) : !1;
    },
    changeLanguage: async (r) => {
      const a = n();
      if (!a) return;
      a.setAttribute("lang", r), await a.whenI18nReady();
      const u = a.currentLang;
      for (const d of [...e]) d(u);
    },
    on: (r, a) => {
      r === "languageChanged" ? e.add(a) : I(t, r);
    },
    off: (r, a) => {
      r === "languageChanged" && e.delete(a);
    }
  };
  return new Proxy(o, {
    get(r, a, u) {
      return a in r || typeof a != "string" || !F.has(a) ? Reflect.get(r, a, u) : (I(
        t,
        a,
        `ui.i18n.${a}() is not available on the compatibility layer (backed by <maplat-ui>).`
      ), () => {
      });
    }
  });
}
function I(i, e, t) {
  i.has(e) || (i.add(e), console.warn(
    t ?? `ui.i18n: "${e}" is not supported by the compatibility layer; ignored.`
  ));
}
function j(i) {
  const e = /* @__PURE__ */ new Set();
  let t = null, n = -1;
  const s = () => i(), o = (c) => c?.querySelector(":scope > maplat-app") ?? null, r = (c) => {
    const p = c?.getAttribute("transparency");
    if (p == null || p === "") return;
    const f = Number(p);
    return Number.isFinite(f) ? f : void 0;
  }, a = () => {
    const c = s();
    let p = r(o(c));
    if (p === void 0)
      try {
        const f = c?.app?.app, y = Number(f?.getTransparency?.());
        f && Number.isFinite(y) && (p = y);
      } catch {
      }
    return p === void 0 && (p = r(c)), p === void 0 ? 0 : Math.min(1, Math.max(0, p / 100));
  }, u = () => {
    const c = a();
    if (c === n) return;
    const p = n;
    n = c;
    for (const f of [...e])
      f({
        type: "propertychange",
        key: "slidervalue",
        oldValue: p,
        newValue: c
      });
  }, d = () => {
    const c = s();
    !c || t || typeof MutationObserver > "u" || (n = a(), t = new MutationObserver(() => u()), t.observe(c, {
      attributes: !0,
      attributeFilter: ["transparency"],
      subtree: !0
    }));
  }, g = {
    get element() {
      const c = s();
      return c?.shadowRoot ? c.shadowRoot.querySelector("input.slider") : null;
    },
    get: (c) => c === "slidervalue" ? a() : void 0,
    set: (c, p) => {
      if (c !== "slidervalue") return;
      const f = s();
      if (!f) return;
      const y = Number(p);
      if (!Number.isFinite(y)) return;
      const l = Math.min(1, Math.max(0, y));
      d(), f.setAttribute("transparency", `${Math.round(l * 100)}`);
    },
    setValue: (c) => g.set("slidervalue", c),
    // 層 B の部品へ委譲する（Shadow DOM の中の input を直接触らない）
    setEnable: (c) => s()?.setTransparencyEnabled(!!c),
    on: (c, p) => {
      c === "propertychange" && (e.add(p), d());
    },
    off: (c, p) => {
      c === "propertychange" && e.delete(p);
    },
    un: (c, p) => {
      c === "propertychange" && e.delete(p);
    },
    // 起動の前に `on` された購読も、ホストができたら見張りを始める
    attach: () => {
      e.size > 0 && d();
    },
    detach: () => {
      t?.disconnect(), t = null;
    }
  };
  return g;
}
function _(i, e) {
  const t = () => i()?.slider(e) ?? null, n = () => t()?.items ?? [], s = () => t()?.selectedMapID ?? null;
  return {
    get el() {
      return t()?.element ?? null;
    },
    get slides() {
      const r = s();
      return n().map((a, u) => {
        const d = r === a.mapID;
        return {
          mapID: a.mapID,
          dataset: { swiperSlideIndex: `${u}` },
          classList: {
            contains: (g) => g === "selected" ? d : !1
          },
          getAttribute: (g) => g === "data" ? a.mapID : null
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
    slideToMapID: (r) => t()?.setSelectedMapID(r),
    setSlideMapID: (r) => t()?.setSelectedMapID(r),
    setSlideMapIDAsSelected: (r) => t()?.setSelectedOnly(r),
    slideToIndex: (r) => {
      const a = n()[r];
      a && t()?.setSelectedMapID(a.mapID);
    },
    setSlideIndex: (r) => {
      const a = n()[r];
      a && t()?.setSelectedMapID(a.mapID);
    },
    setSlideIndexAsSelected: (r) => {
      const a = n()[r];
      t()?.setSelectedOnly(a ? a.mapID : null);
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
async function z(i, e, t, n = 10) {
  if (!i || !e || !Array.isArray(t) || t.length < 2) return [];
  const s = i.from;
  if (!s || typeof s.sysCoord2MercAsync != "function") return [];
  const o = await s.sysCoord2MercAsync(t);
  return !Array.isArray(o) || !o.every((r) => Number.isFinite(Number(r))) ? [] : e.mapsAt(L(o.map(Number)), n);
}
const W = [
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
const K = "MaplatUi: the MaplatUi class is deprecated and will be removed in 2.0. Use the <maplat-ui> element (@maplat/ui/element) with <maplat-app> instead.";
function Y() {
  x || (x = !0, console.warn(K));
}
class k extends H {
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
    super(), Y(), this.appOption = e ?? {}, this.html_id_seed = `${Math.floor(Math.random() * 9e3) + 1e3}`, this.#r = J(e), this.sliderNew = j(() => this.#e ?? null), this.contextMenu = V(() => this.#e ?? null), this.baseSwiper = _(() => this.#e ?? null, "base"), this.overlaySwiper = _(
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
    return new k(e).waitReady();
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
    return !e || typeof e == "string" ? e : this.#e ? this.#e.translateText(e) : A(e, this.lang);
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
    return z(this.core, this.#e, e, t);
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
      return this.#l ??= G(() => this.#e ?? null), this.#l;
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
    return this.#i || (this.#i = this.#u()), this.#i;
  }
  async #u() {
    if (await $(), this.#t) return this;
    const e = this.appOption, t = typeof location < "u" ? location.hash : "";
    this.#c() && /[#!&/]s:/.test(t) && (this.restoring = !0);
    const n = this.#h();
    this.#e = n, n.preloadMediaViewer(), this.splashPromise = n.ready.then(
      () => {
      },
      () => {
      }
    ), this.contextMenu.attach(n), this.sliderNew.attach(), this.#s = this.#d(n), n.addEventListener(
      "pointerdown",
      (o) => {
        const r = o, a = n.getBoundingClientRect(), u = [
          Math.round(r.clientX - a.left),
          Math.round(r.clientY - a.top)
        ];
        this.lastClickPixel = u;
        try {
          this.lastClickCoordinate = this.core?.mapObject?.getCoordinateFromPixel(u);
        } catch {
          this.lastClickCoordinate = void 0;
        }
      },
      !0
    );
    const s = this.#c();
    return await new Promise((o, r) => {
      let a = !1;
      const u = (d) => {
        a || (a = !0, d === void 0 ? o() : r(d));
      };
      n.addEventListener("lifecycle:setting-loaded", () => {
        if (this.#t) {
          u();
          return;
        }
        this.core = M(n) ?? this.core, s || (this.restoring = !1, u());
      }), n.addEventListener("lifecycle:appdata-ready", () => {
        this.#f(n);
      }), n.addEventListener("lifecycle:error", (d) => {
        u(X(d));
      }), s && n.ready.then(
        () => {
          this.core = M(n) ?? this.core, this.restoring = !1, u();
        },
        (d) => u(d)
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
  #d(e) {
    const t = [...R, ...N], n = (s) => {
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
      const o = document.getElementById(t);
      if (o) return o;
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
    for (const [a, u] of W) {
      const d = t[a];
      d != null && (e[u] = d);
    }
    const n = t.pwaWorker;
    typeof n == "string" && n !== "" ? e.pwaWorker = n : (n === !1 || n === null) && e.disablePwaWorker();
    const s = t.pwaScope;
    typeof s == "string" && s !== "" && (e.pwaScope = s), e.appId = typeof t.appid == "string" && t.appid !== "" ? t.appid : "sample", t.setting !== void 0 && (e.setting = t.setting);
    const o = t.restore;
    o && typeof o == "object" && (e.restore = o);
    const r = {
      ...t,
      __maplatCompat: !0
    };
    delete r.div, delete r.uiHooks, delete r.setting, e.appOption = r, e.uiHooks = Q(e, t.uiHooks);
    for (const a of q)
      t[a] !== void 0 && this.#n(
        `dead:${a}`,
        `<${v}>: appOption.${a} is no longer used and was ignored.`
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
function M(i) {
  return i.app?.app;
}
function X(i) {
  const e = i.detail;
  return e?.error instanceof Error ? e.error : typeof e?.message == "string" ? new Error(e.message) : new Error(`<${v}>: the lifecycle failed.`);
}
function J(i) {
  return typeof i.lang == "string" && i.lang !== "" ? i.lang : typeof navigator < "u" && navigator.language ? navigator.language : "ja";
}
function Q(i, e) {
  const t = { ...e ?? {} }, n = e?.onUiConfigure;
  return t.onUiConfigure = async (s) => {
    try {
      await i.whenI18nReady();
    } catch (o) {
      console.warn(
        `<${v}>: failed to load the language files before onUiConfigure.`,
        o
      );
    }
    if (n) return n(s);
  }, t;
}
export {
  B,
  T as D,
  k as M,
  H as T,
  S as V,
  E as a,
  ee as b,
  P as c,
  ie as d,
  O as e,
  ae as f,
  te as g,
  re as h,
  le as i,
  ne as l,
  oe as m,
  se as r
};
