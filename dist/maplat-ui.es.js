var al = Object.defineProperty;
var ol = (t, e, n) => e in t ? al(t, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : t[e] = n;
var m = (t, e, n) => ol(t, typeof e != "symbol" ? e + "" : e, n);
import { assets as ke, createElement as ce, MaplatApp as ll } from "@maplat/core";
import { MapEvent as Qt } from "ol";
class cl {
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
function Lr() {
}
function da(t) {
  for (const e in t)
    delete t[e];
}
function dl(t) {
  let e;
  for (e in t)
    return !1;
  return !e;
}
class Aa {
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
class ua extends cl {
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
  addEventListener(e, n) {
    if (!e || !n)
      return;
    const r = this.listeners_ || (this.listeners_ = {}), i = r[e] || (r[e] = []);
    i.includes(n) || i.push(n);
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
    const n = typeof e == "string", r = n ? e : e.type, i = this.listeners_ && this.listeners_[r];
    if (!i)
      return;
    const s = n ? new Aa(e) : (
      /** @type {Event} */
      e
    );
    s.target || (s.target = this.eventTarget_ || this);
    const a = this.dispatching_ || (this.dispatching_ = {}), o = this.pendingRemovals_ || (this.pendingRemovals_ = {});
    r in a || (a[r] = 0, o[r] = 0), ++a[r];
    let l;
    for (let c = 0, d = i.length; c < d; ++c)
      if ("handleEvent" in i[c] ? l = /** @type {import("../events.js").ListenerObject} */
      i[c].handleEvent(s) : l = /** @type {import("../events.js").ListenerFunction} */
      i[c].call(this, s), l === !1 || s.propagationStopped) {
        l = !1;
        break;
      }
    if (--a[r] === 0) {
      let c = o[r];
      for (delete o[r]; c--; )
        this.removeEventListener(r, Lr);
      delete a[r];
    }
    return l;
  }
  /**
   * Clean up.
   * @override
   */
  disposeInternal() {
    this.listeners_ && da(this.listeners_);
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
  removeEventListener(e, n) {
    if (!this.listeners_)
      return;
    const r = this.listeners_[e];
    if (!r)
      return;
    const i = r.indexOf(n);
    i !== -1 && (this.pendingRemovals_ && e in this.pendingRemovals_ ? (r[i] = Lr, ++this.pendingRemovals_[e]) : (r.splice(i, 1), r.length === 0 && delete this.listeners_[e]));
  }
}
const wt = typeof navigator < "u" && typeof navigator.userAgent < "u" ? navigator.userAgent.toLowerCase() : "", Al = wt.includes("safari") && !wt.includes("chrom");
Al && (wt.includes("version/15.4") || /cpu (os|iphone os) 15_4 like mac os x/.test(wt));
wt.includes("webkit") && wt.includes("edge");
wt.includes("macintosh");
const ul = typeof WorkerGlobalScope < "u" && typeof OffscreenCanvas < "u" && self instanceof WorkerGlobalScope;
(function() {
  let t = !1;
  try {
    const e = Object.defineProperty({}, "passive", {
      get: function() {
        t = !0;
      }
    });
    window.addEventListener("_", null, e), window.removeEventListener("_", null, e);
  } catch {
  }
  return t;
})();
function fl(t, e, n, r) {
  let i;
  return ul ? i = new class extends OffscreenCanvas {
    constructor() {
      super(...arguments);
      m(this, "style", {});
    }
  }(t, e) : i = document.createElement("canvas"), i.width = t, i.height = e, /** @type {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} */
  i.getContext("2d", r);
}
function zn(t, e, n) {
  return Math.min(Math.max(t, e), n);
}
function pl(t, e) {
  const n = Math.pow(10, e);
  return Math.round(t * n) / n;
}
const hl = [NaN, NaN, NaN, 0];
let Cr;
function gl() {
  return Cr || (Cr = fl(1, 1, void 0, {
    willReadFrequently: !0,
    desynchronized: !0
  })), Cr;
}
const ml = /^rgba?\(\s*(\d+%?)\s+(\d+%?)\s+(\d+%?)(?:\s*\/\s*(\d+%|\d*\.\d+|[01]))?\s*\)$/i, vl = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(\d+%|\d*\.\d+|[01]))?\s*\)$/i, wl = /^rgba?\(\s*(\d+%)\s*,\s*(\d+%)\s*,\s*(\d+%)(?:\s*,\s*(\d+%|\d*\.\d+|[01]))?\s*\)$/i, Cl = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i;
function Pn(t, e) {
  return t.endsWith("%") ? Number(t.substring(0, t.length - 1)) / e : Number(t);
}
function Jt(t) {
  throw new Error('failed to parse "' + t + '" as color');
}
function fa(t) {
  if (t.toLowerCase().startsWith("rgb")) {
    const s = t.match(vl) || t.match(ml) || t.match(wl);
    if (s) {
      const a = s[4], o = 100 / 255;
      return [
        zn(Pn(s[1], o) + 0.5 | 0, 0, 255),
        zn(Pn(s[2], o) + 0.5 | 0, 0, 255),
        zn(Pn(s[3], o) + 0.5 | 0, 0, 255),
        a !== void 0 ? zn(Pn(a, 100), 0, 1) : 1
      ];
    }
    Jt(t);
  }
  if (t.startsWith("#")) {
    if (Cl.test(t)) {
      const s = t.substring(1), a = s.length <= 4 ? 1 : 2, o = [0, 0, 0, 255];
      for (let l = 0, c = s.length; l < c; l += a) {
        let d = parseInt(s.substring(l, l + a), 16);
        a === 1 && (d += d << 4), o[l / a] = d;
      }
      return o[3] = o[3] / 255, o;
    }
    Jt(t);
  }
  const e = gl();
  e.fillStyle = "#abcdef";
  let n = e.fillStyle;
  e.fillStyle = t, e.fillStyle === n && (e.fillStyle = "#fedcba", n = e.fillStyle, e.fillStyle = t, e.fillStyle === n && Jt(t));
  const r = e.fillStyle;
  if (r.startsWith("#") || r.startsWith("rgba"))
    return fa(r);
  e.clearRect(0, 0, 1, 1), e.fillRect(0, 0, 1, 1);
  const i = Array.from(e.getImageData(0, 0, 1, 1).data);
  return i[3] = pl(i[3] / 255, 3), i;
}
const bl = 1024, Zt = {};
let br = 0;
function El(t) {
  if (t === "none")
    return hl;
  if (Zt.hasOwnProperty(t))
    return Zt[t];
  if (br >= bl) {
    let n = 0;
    for (const r in Zt)
      n++ & 3 || (delete Zt[r], --br);
  }
  const e = fa(t);
  e.length !== 4 && Jt(t);
  for (const n of e)
    isNaN(n) && Jt(t);
  return Zt[t] = e, ++br, e;
}
function Il(t) {
  return Array.isArray(t) ? t : El(t);
}
function Ji(t) {
  return t !== null && typeof t == "object" && "constructor" in t && t.constructor === Object;
}
function bi(t, e) {
  t === void 0 && (t = {}), e === void 0 && (e = {}), Object.keys(e).forEach(function(n) {
    typeof t[n] > "u" ? t[n] = e[n] : Ji(e[n]) && Ji(t[n]) && Object.keys(e[n]).length > 0 && bi(t[n], e[n]);
  });
}
var pa = {
  body: {},
  addEventListener: function() {
  },
  removeEventListener: function() {
  },
  activeElement: {
    blur: function() {
    },
    nodeName: ""
  },
  querySelector: function() {
    return null;
  },
  querySelectorAll: function() {
    return [];
  },
  getElementById: function() {
    return null;
  },
  createEvent: function() {
    return {
      initEvent: function() {
      }
    };
  },
  createElement: function() {
    return {
      children: [],
      childNodes: [],
      style: {},
      setAttribute: function() {
      },
      getElementsByTagName: function() {
        return [];
      }
    };
  },
  createElementNS: function() {
    return {};
  },
  importNode: function() {
    return null;
  },
  location: {
    hash: "",
    host: "",
    hostname: "",
    href: "",
    origin: "",
    pathname: "",
    protocol: "",
    search: ""
  }
};
function he() {
  var t = typeof document < "u" ? document : {};
  return bi(t, pa), t;
}
var Ml = {
  document: pa,
  navigator: {
    userAgent: ""
  },
  location: {
    hash: "",
    host: "",
    hostname: "",
    href: "",
    origin: "",
    pathname: "",
    protocol: "",
    search: ""
  },
  history: {
    replaceState: function() {
    },
    pushState: function() {
    },
    go: function() {
    },
    back: function() {
    }
  },
  CustomEvent: function() {
    return this;
  },
  addEventListener: function() {
  },
  removeEventListener: function() {
  },
  getComputedStyle: function() {
    return {
      getPropertyValue: function() {
        return "";
      }
    };
  },
  Image: function() {
  },
  Date: function() {
  },
  screen: {},
  setTimeout: function() {
  },
  clearTimeout: function() {
  },
  matchMedia: function() {
    return {};
  },
  requestAnimationFrame: function(t) {
    return typeof setTimeout > "u" ? (t(), null) : setTimeout(t, 0);
  },
  cancelAnimationFrame: function(t) {
    typeof setTimeout > "u" || clearTimeout(t);
  }
};
function ee() {
  var t = typeof window < "u" ? window : {};
  return bi(t, Ml), t;
}
function yl(t, e) {
  t.prototype = Object.create(e.prototype), t.prototype.constructor = t, t.__proto__ = e;
}
function Kr(t) {
  return Kr = Object.setPrototypeOf ? Object.getPrototypeOf : function(n) {
    return n.__proto__ || Object.getPrototypeOf(n);
  }, Kr(t);
}
function Zn(t, e) {
  return Zn = Object.setPrototypeOf || function(r, i) {
    return r.__proto__ = i, r;
  }, Zn(t, e);
}
function xl() {
  if (typeof Reflect > "u" || !Reflect.construct || Reflect.construct.sham) return !1;
  if (typeof Proxy == "function") return !0;
  try {
    return Date.prototype.toString.call(Reflect.construct(Date, [], function() {
    })), !0;
  } catch {
    return !1;
  }
}
function On(t, e, n) {
  return xl() ? On = Reflect.construct : On = function(i, s, a) {
    var o = [null];
    o.push.apply(o, s);
    var l = Function.bind.apply(i, o), c = new l();
    return a && Zn(c, a.prototype), c;
  }, On.apply(null, arguments);
}
function Vl(t) {
  return Function.toString.call(t).indexOf("[native code]") !== -1;
}
function Hr(t) {
  var e = typeof Map == "function" ? /* @__PURE__ */ new Map() : void 0;
  return Hr = function(r) {
    if (r === null || !Vl(r)) return r;
    if (typeof r != "function")
      throw new TypeError("Super expression must either be null or a function");
    if (typeof e < "u") {
      if (e.has(r)) return e.get(r);
      e.set(r, i);
    }
    function i() {
      return On(r, arguments, Kr(this).constructor);
    }
    return i.prototype = Object.create(r.prototype, {
      constructor: {
        value: i,
        enumerable: !1,
        writable: !0,
        configurable: !0
      }
    }), Zn(i, r);
  }, Hr(t);
}
function Rl(t) {
  if (t === void 0)
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  return t;
}
function Sl(t) {
  var e = t.__proto__;
  Object.defineProperty(t, "__proto__", {
    get: function() {
      return e;
    },
    set: function(r) {
      e.__proto__ = r;
    }
  });
}
var nt = /* @__PURE__ */ function(t) {
  yl(e, t);
  function e(n) {
    var r;
    return r = t.call.apply(t, [this].concat(n)) || this, Sl(Rl(r)), r;
  }
  return e;
}(/* @__PURE__ */ Hr(Array));
function mn(t) {
  t === void 0 && (t = []);
  var e = [];
  return t.forEach(function(n) {
    Array.isArray(n) ? e.push.apply(e, mn(n)) : e.push(n);
  }), e;
}
function ha(t, e) {
  return Array.prototype.filter.call(t, e);
}
function Tl(t) {
  for (var e = [], n = 0; n < t.length; n += 1)
    e.indexOf(t[n]) === -1 && e.push(t[n]);
  return e;
}
function zl(t, e) {
  if (typeof t != "string")
    return [t];
  for (var n = [], r = e.querySelectorAll(t), i = 0; i < r.length; i += 1)
    n.push(r[i]);
  return n;
}
function V(t, e) {
  var n = ee(), r = he(), i = [];
  if (!e && t instanceof nt)
    return t;
  if (!t)
    return new nt(i);
  if (typeof t == "string") {
    var s = t.trim();
    if (s.indexOf("<") >= 0 && s.indexOf(">") >= 0) {
      var a = "div";
      s.indexOf("<li") === 0 && (a = "ul"), s.indexOf("<tr") === 0 && (a = "tbody"), (s.indexOf("<td") === 0 || s.indexOf("<th") === 0) && (a = "tr"), s.indexOf("<tbody") === 0 && (a = "table"), s.indexOf("<option") === 0 && (a = "select");
      var o = r.createElement(a);
      o.innerHTML = s;
      for (var l = 0; l < o.childNodes.length; l += 1)
        i.push(o.childNodes[l]);
    } else
      i = zl(t.trim(), e || r);
  } else if (t.nodeType || t === n || t === r)
    i.push(t);
  else if (Array.isArray(t)) {
    if (t instanceof nt) return t;
    i = t;
  }
  return new nt(Tl(i));
}
V.fn = nt.prototype;
function Pl() {
  for (var t = arguments.length, e = new Array(t), n = 0; n < t; n++)
    e[n] = arguments[n];
  var r = mn(e.map(function(i) {
    return i.split(" ");
  }));
  return this.forEach(function(i) {
    var s;
    (s = i.classList).add.apply(s, r);
  }), this;
}
function Dl() {
  for (var t = arguments.length, e = new Array(t), n = 0; n < t; n++)
    e[n] = arguments[n];
  var r = mn(e.map(function(i) {
    return i.split(" ");
  }));
  return this.forEach(function(i) {
    var s;
    (s = i.classList).remove.apply(s, r);
  }), this;
}
function Bl() {
  for (var t = arguments.length, e = new Array(t), n = 0; n < t; n++)
    e[n] = arguments[n];
  var r = mn(e.map(function(i) {
    return i.split(" ");
  }));
  this.forEach(function(i) {
    r.forEach(function(s) {
      i.classList.toggle(s);
    });
  });
}
function Gl() {
  for (var t = arguments.length, e = new Array(t), n = 0; n < t; n++)
    e[n] = arguments[n];
  var r = mn(e.map(function(i) {
    return i.split(" ");
  }));
  return ha(this, function(i) {
    return r.filter(function(s) {
      return i.classList.contains(s);
    }).length > 0;
  }).length > 0;
}
function kl(t, e) {
  if (arguments.length === 1 && typeof t == "string")
    return this[0] ? this[0].getAttribute(t) : void 0;
  for (var n = 0; n < this.length; n += 1)
    if (arguments.length === 2)
      this[n].setAttribute(t, e);
    else
      for (var r in t)
        this[n][r] = t[r], this[n].setAttribute(r, t[r]);
  return this;
}
function Nl(t) {
  for (var e = 0; e < this.length; e += 1)
    this[e].removeAttribute(t);
  return this;
}
function Ol(t) {
  for (var e = 0; e < this.length; e += 1)
    this[e].style.transform = t;
  return this;
}
function Fl(t) {
  for (var e = 0; e < this.length; e += 1)
    this[e].style.transitionDuration = typeof t != "string" ? t + "ms" : t;
  return this;
}
function Ul() {
  for (var t = arguments.length, e = new Array(t), n = 0; n < t; n++)
    e[n] = arguments[n];
  var r = e[0], i = e[1], s = e[2], a = e[3];
  typeof e[1] == "function" && (r = e[0], s = e[1], a = e[2], i = void 0), a || (a = !1);
  function o(v) {
    var g = v.target;
    if (g) {
      var C = v.target.dom7EventData || [];
      if (C.indexOf(v) < 0 && C.unshift(v), V(g).is(i)) s.apply(g, C);
      else
        for (var b = V(g).parents(), w = 0; w < b.length; w += 1)
          V(b[w]).is(i) && s.apply(b[w], C);
    }
  }
  function l(v) {
    var g = v && v.target ? v.target.dom7EventData || [] : [];
    g.indexOf(v) < 0 && g.unshift(v), s.apply(this, g);
  }
  for (var c = r.split(" "), d, A = 0; A < this.length; A += 1) {
    var u = this[A];
    if (i)
      for (d = 0; d < c.length; d += 1) {
        var h = c[d];
        u.dom7LiveListeners || (u.dom7LiveListeners = {}), u.dom7LiveListeners[h] || (u.dom7LiveListeners[h] = []), u.dom7LiveListeners[h].push({
          listener: s,
          proxyListener: o
        }), u.addEventListener(h, o, a);
      }
    else
      for (d = 0; d < c.length; d += 1) {
        var f = c[d];
        u.dom7Listeners || (u.dom7Listeners = {}), u.dom7Listeners[f] || (u.dom7Listeners[f] = []), u.dom7Listeners[f].push({
          listener: s,
          proxyListener: l
        }), u.addEventListener(f, l, a);
      }
  }
  return this;
}
function Ql() {
  for (var t = arguments.length, e = new Array(t), n = 0; n < t; n++)
    e[n] = arguments[n];
  var r = e[0], i = e[1], s = e[2], a = e[3];
  typeof e[1] == "function" && (r = e[0], s = e[1], a = e[2], i = void 0), a || (a = !1);
  for (var o = r.split(" "), l = 0; l < o.length; l += 1)
    for (var c = o[l], d = 0; d < this.length; d += 1) {
      var A = this[d], u = void 0;
      if (!i && A.dom7Listeners ? u = A.dom7Listeners[c] : i && A.dom7LiveListeners && (u = A.dom7LiveListeners[c]), u && u.length)
        for (var f = u.length - 1; f >= 0; f -= 1) {
          var h = u[f];
          s && h.listener === s || s && h.listener && h.listener.dom7proxy && h.listener.dom7proxy === s ? (A.removeEventListener(c, h.proxyListener, a), u.splice(f, 1)) : s || (A.removeEventListener(c, h.proxyListener, a), u.splice(f, 1));
        }
    }
  return this;
}
function jl() {
  for (var t = ee(), e = arguments.length, n = new Array(e), r = 0; r < e; r++)
    n[r] = arguments[r];
  for (var i = n[0].split(" "), s = n[1], a = 0; a < i.length; a += 1)
    for (var o = i[a], l = 0; l < this.length; l += 1) {
      var c = this[l];
      if (t.CustomEvent) {
        var d = new t.CustomEvent(o, {
          detail: s,
          bubbles: !0,
          cancelable: !0
        });
        c.dom7EventData = n.filter(function(A, u) {
          return u > 0;
        }), c.dispatchEvent(d), c.dom7EventData = [], delete c.dom7EventData;
      }
    }
  return this;
}
function ql(t) {
  var e = this;
  function n(r) {
    r.target === this && (t.call(this, r), e.off("transitionend", n));
  }
  return t && e.on("transitionend", n), this;
}
function Zl(t) {
  if (this.length > 0) {
    if (t) {
      var e = this.styles();
      return this[0].offsetWidth + parseFloat(e.getPropertyValue("margin-right")) + parseFloat(e.getPropertyValue("margin-left"));
    }
    return this[0].offsetWidth;
  }
  return null;
}
function Yl(t) {
  if (this.length > 0) {
    if (t) {
      var e = this.styles();
      return this[0].offsetHeight + parseFloat(e.getPropertyValue("margin-top")) + parseFloat(e.getPropertyValue("margin-bottom"));
    }
    return this[0].offsetHeight;
  }
  return null;
}
function Ll() {
  if (this.length > 0) {
    var t = ee(), e = he(), n = this[0], r = n.getBoundingClientRect(), i = e.body, s = n.clientTop || i.clientTop || 0, a = n.clientLeft || i.clientLeft || 0, o = n === t ? t.scrollY : n.scrollTop, l = n === t ? t.scrollX : n.scrollLeft;
    return {
      top: r.top + o - s,
      left: r.left + l - a
    };
  }
  return null;
}
function Kl() {
  var t = ee();
  return this[0] ? t.getComputedStyle(this[0], null) : {};
}
function Hl(t, e) {
  var n = ee(), r;
  if (arguments.length === 1)
    if (typeof t == "string") {
      if (this[0]) return n.getComputedStyle(this[0], null).getPropertyValue(t);
    } else {
      for (r = 0; r < this.length; r += 1)
        for (var i in t)
          this[r].style[i] = t[i];
      return this;
    }
  if (arguments.length === 2 && typeof t == "string") {
    for (r = 0; r < this.length; r += 1)
      this[r].style[t] = e;
    return this;
  }
  return this;
}
function Xl(t) {
  return t ? (this.forEach(function(e, n) {
    t.apply(e, [e, n]);
  }), this) : this;
}
function Wl(t) {
  var e = ha(this, t);
  return V(e);
}
function Jl(t) {
  if (typeof t > "u")
    return this[0] ? this[0].innerHTML : null;
  for (var e = 0; e < this.length; e += 1)
    this[e].innerHTML = t;
  return this;
}
function _l(t) {
  if (typeof t > "u")
    return this[0] ? this[0].textContent.trim() : null;
  for (var e = 0; e < this.length; e += 1)
    this[e].textContent = t;
  return this;
}
function $l(t) {
  var e = ee(), n = he(), r = this[0], i, s;
  if (!r || typeof t > "u") return !1;
  if (typeof t == "string") {
    if (r.matches) return r.matches(t);
    if (r.webkitMatchesSelector) return r.webkitMatchesSelector(t);
    if (r.msMatchesSelector) return r.msMatchesSelector(t);
    for (i = V(t), s = 0; s < i.length; s += 1)
      if (i[s] === r) return !0;
    return !1;
  }
  if (t === n)
    return r === n;
  if (t === e)
    return r === e;
  if (t.nodeType || t instanceof nt) {
    for (i = t.nodeType ? [t] : t, s = 0; s < i.length; s += 1)
      if (i[s] === r) return !0;
    return !1;
  }
  return !1;
}
function ec() {
  var t = this[0], e;
  if (t) {
    for (e = 0; (t = t.previousSibling) !== null; )
      t.nodeType === 1 && (e += 1);
    return e;
  }
}
function tc(t) {
  if (typeof t > "u") return this;
  var e = this.length;
  if (t > e - 1)
    return V([]);
  if (t < 0) {
    var n = e + t;
    return n < 0 ? V([]) : V([this[n]]);
  }
  return V([this[t]]);
}
function nc() {
  for (var t, e = he(), n = 0; n < arguments.length; n += 1) {
    t = n < 0 || arguments.length <= n ? void 0 : arguments[n];
    for (var r = 0; r < this.length; r += 1)
      if (typeof t == "string") {
        var i = e.createElement("div");
        for (i.innerHTML = t; i.firstChild; )
          this[r].appendChild(i.firstChild);
      } else if (t instanceof nt)
        for (var s = 0; s < t.length; s += 1)
          this[r].appendChild(t[s]);
      else
        this[r].appendChild(t);
  }
  return this;
}
function rc(t) {
  var e = he(), n, r;
  for (n = 0; n < this.length; n += 1)
    if (typeof t == "string") {
      var i = e.createElement("div");
      for (i.innerHTML = t, r = i.childNodes.length - 1; r >= 0; r -= 1)
        this[n].insertBefore(i.childNodes[r], this[n].childNodes[0]);
    } else if (t instanceof nt)
      for (r = 0; r < t.length; r += 1)
        this[n].insertBefore(t[r], this[n].childNodes[0]);
    else
      this[n].insertBefore(t, this[n].childNodes[0]);
  return this;
}
function ic(t) {
  return this.length > 0 ? t ? this[0].nextElementSibling && V(this[0].nextElementSibling).is(t) ? V([this[0].nextElementSibling]) : V([]) : this[0].nextElementSibling ? V([this[0].nextElementSibling]) : V([]) : V([]);
}
function sc(t) {
  var e = [], n = this[0];
  if (!n) return V([]);
  for (; n.nextElementSibling; ) {
    var r = n.nextElementSibling;
    t ? V(r).is(t) && e.push(r) : e.push(r), n = r;
  }
  return V(e);
}
function ac(t) {
  if (this.length > 0) {
    var e = this[0];
    return t ? e.previousElementSibling && V(e.previousElementSibling).is(t) ? V([e.previousElementSibling]) : V([]) : e.previousElementSibling ? V([e.previousElementSibling]) : V([]);
  }
  return V([]);
}
function oc(t) {
  var e = [], n = this[0];
  if (!n) return V([]);
  for (; n.previousElementSibling; ) {
    var r = n.previousElementSibling;
    t ? V(r).is(t) && e.push(r) : e.push(r), n = r;
  }
  return V(e);
}
function lc(t) {
  for (var e = [], n = 0; n < this.length; n += 1)
    this[n].parentNode !== null && (t ? V(this[n].parentNode).is(t) && e.push(this[n].parentNode) : e.push(this[n].parentNode));
  return V(e);
}
function cc(t) {
  for (var e = [], n = 0; n < this.length; n += 1)
    for (var r = this[n].parentNode; r; )
      t ? V(r).is(t) && e.push(r) : e.push(r), r = r.parentNode;
  return V(e);
}
function dc(t) {
  var e = this;
  return typeof t > "u" ? V([]) : (e.is(t) || (e = e.parents(t).eq(0)), e);
}
function Ac(t) {
  for (var e = [], n = 0; n < this.length; n += 1)
    for (var r = this[n].querySelectorAll(t), i = 0; i < r.length; i += 1)
      e.push(r[i]);
  return V(e);
}
function uc(t) {
  for (var e = [], n = 0; n < this.length; n += 1)
    for (var r = this[n].children, i = 0; i < r.length; i += 1)
      (!t || V(r[i]).is(t)) && e.push(r[i]);
  return V(e);
}
function fc() {
  for (var t = 0; t < this.length; t += 1)
    this[t].parentNode && this[t].parentNode.removeChild(this[t]);
  return this;
}
var _i = {
  addClass: Pl,
  removeClass: Dl,
  hasClass: Gl,
  toggleClass: Bl,
  attr: kl,
  removeAttr: Nl,
  transform: Ol,
  transition: Fl,
  on: Ul,
  off: Ql,
  trigger: jl,
  transitionEnd: ql,
  outerWidth: Zl,
  outerHeight: Yl,
  styles: Kl,
  offset: Ll,
  css: Hl,
  each: Xl,
  html: Jl,
  text: _l,
  is: $l,
  index: ec,
  eq: tc,
  append: nc,
  prepend: rc,
  next: ic,
  nextAll: sc,
  prev: ac,
  prevAll: oc,
  parent: lc,
  parents: cc,
  closest: dc,
  find: Ac,
  children: uc,
  filter: Wl,
  remove: fc
};
Object.keys(_i).forEach(function(t) {
  Object.defineProperty(V.fn, t, {
    value: _i[t],
    writable: !0
  });
});
function pc(t) {
  var e = t;
  Object.keys(e).forEach(function(n) {
    try {
      e[n] = null;
    } catch {
    }
    try {
      delete e[n];
    } catch {
    }
  });
}
function Xr(t, e) {
  return e === void 0 && (e = 0), setTimeout(t, e);
}
function st() {
  return Date.now();
}
function hc(t) {
  var e = ee(), n;
  return e.getComputedStyle && (n = e.getComputedStyle(t, null)), !n && t.currentStyle && (n = t.currentStyle), n || (n = t.style), n;
}
function gc(t, e) {
  e === void 0 && (e = "x");
  var n = ee(), r, i, s, a = hc(t);
  return n.WebKitCSSMatrix ? (i = a.transform || a.webkitTransform, i.split(",").length > 6 && (i = i.split(", ").map(function(o) {
    return o.replace(",", ".");
  }).join(", ")), s = new n.WebKitCSSMatrix(i === "none" ? "" : i)) : (s = a.MozTransform || a.OTransform || a.MsTransform || a.msTransform || a.transform || a.getPropertyValue("transform").replace("translate(", "matrix(1, 0, 0, 1,"), r = s.toString().split(",")), e === "x" && (n.WebKitCSSMatrix ? i = s.m41 : r.length === 16 ? i = parseFloat(r[12]) : i = parseFloat(r[4])), e === "y" && (n.WebKitCSSMatrix ? i = s.m42 : r.length === 16 ? i = parseFloat(r[13]) : i = parseFloat(r[5])), i || 0;
}
function Lt(t) {
  return typeof t == "object" && t !== null && t.constructor && Object.prototype.toString.call(t).slice(8, -1) === "Object";
}
function mc(t) {
  return typeof window < "u" && typeof window.HTMLElement < "u" ? t instanceof HTMLElement : t && (t.nodeType === 1 || t.nodeType === 11);
}
function Z() {
  for (var t = Object(arguments.length <= 0 ? void 0 : arguments[0]), e = ["__proto__", "constructor", "prototype"], n = 1; n < arguments.length; n += 1) {
    var r = n < 0 || arguments.length <= n ? void 0 : arguments[n];
    if (r != null && !mc(r))
      for (var i = Object.keys(Object(r)).filter(function(c) {
        return e.indexOf(c) < 0;
      }), s = 0, a = i.length; s < a; s += 1) {
        var o = i[s], l = Object.getOwnPropertyDescriptor(r, o);
        l !== void 0 && l.enumerable && (Lt(t[o]) && Lt(r[o]) ? r[o].__swiper__ ? t[o] = r[o] : Z(t[o], r[o]) : !Lt(t[o]) && Lt(r[o]) ? (t[o] = {}, r[o].__swiper__ ? t[o] = r[o] : Z(t[o], r[o])) : t[o] = r[o]);
      }
  }
  return t;
}
function Ei(t, e) {
  Object.keys(e).forEach(function(n) {
    Lt(e[n]) && Object.keys(e[n]).forEach(function(r) {
      typeof e[n][r] == "function" && (e[n][r] = e[n][r].bind(t));
    }), t[n] = e[n];
  });
}
function Rt(t) {
  return t === void 0 && (t = ""), "." + t.trim().replace(/([\.:!\/])/g, "\\$1").replace(/ /g, ".");
}
function ga(t, e, n, r) {
  var i = he();
  return n && Object.keys(r).forEach(function(s) {
    if (!e[s] && e.auto === !0) {
      var a = i.createElement("div");
      a.className = r[s], t.append(a), e[s] = a;
    }
  }), e;
}
var Er;
function vc() {
  var t = ee(), e = he();
  return {
    touch: !!("ontouchstart" in t || t.DocumentTouch && e instanceof t.DocumentTouch),
    pointerEvents: !!t.PointerEvent && "maxTouchPoints" in t.navigator && t.navigator.maxTouchPoints >= 0,
    observer: function() {
      return "MutationObserver" in t || "WebkitMutationObserver" in t;
    }(),
    passiveListener: function() {
      var r = !1;
      try {
        var i = Object.defineProperty({}, "passive", {
          // eslint-disable-next-line
          get: function() {
            r = !0;
          }
        });
        t.addEventListener("testPassiveListener", null, i);
      } catch {
      }
      return r;
    }(),
    gestures: function() {
      return "ongesturestart" in t;
    }()
  };
}
function ma() {
  return Er || (Er = vc()), Er;
}
var Ir;
function wc(t) {
  var e = t === void 0 ? {} : t, n = e.userAgent, r = ma(), i = ee(), s = i.navigator.platform, a = n || i.navigator.userAgent, o = {
    ios: !1,
    android: !1
  }, l = i.screen.width, c = i.screen.height, d = a.match(/(Android);?[\s\/]+([\d.]+)?/), A = a.match(/(iPad).*OS\s([\d_]+)/), u = a.match(/(iPod)(.*OS\s([\d_]+))?/), f = !A && a.match(/(iPhone\sOS|iOS)\s([\d_]+)/), h = s === "Win32", v = s === "MacIntel", g = ["1024x1366", "1366x1024", "834x1194", "1194x834", "834x1112", "1112x834", "768x1024", "1024x768", "820x1180", "1180x820", "810x1080", "1080x810"];
  return !A && v && r.touch && g.indexOf(l + "x" + c) >= 0 && (A = a.match(/(Version)\/([\d.]+)/), A || (A = [0, 1, "13_0_0"]), v = !1), d && !h && (o.os = "android", o.android = !0), (A || f || u) && (o.os = "ios", o.ios = !0), o;
}
function Cc(t) {
  return t === void 0 && (t = {}), Ir || (Ir = wc(t)), Ir;
}
var Mr;
function bc() {
  var t = ee();
  function e() {
    var n = t.navigator.userAgent.toLowerCase();
    return n.indexOf("safari") >= 0 && n.indexOf("chrome") < 0 && n.indexOf("android") < 0;
  }
  return {
    isEdge: !!t.navigator.userAgent.match(/Edge/g),
    isSafari: e(),
    isWebView: /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(t.navigator.userAgent)
  };
}
function Ec() {
  return Mr || (Mr = bc()), Mr;
}
var Ic = function() {
  var e = ee();
  return typeof e.ResizeObserver < "u";
};
const Mc = {
  name: "resize",
  create: function() {
    var e = this;
    Z(e, {
      resize: {
        observer: null,
        createObserver: function() {
          !e || e.destroyed || !e.initialized || (e.resize.observer = new ResizeObserver(function(r) {
            var i = e.width, s = e.height, a = i, o = s;
            r.forEach(function(l) {
              var c = l.contentBoxSize, d = l.contentRect, A = l.target;
              A && A !== e.el || (a = d ? d.width : (c[0] || c).inlineSize, o = d ? d.height : (c[0] || c).blockSize);
            }), (a !== i || o !== s) && e.resize.resizeHandler();
          }), e.resize.observer.observe(e.el));
        },
        removeObserver: function() {
          e.resize.observer && e.resize.observer.unobserve && e.el && (e.resize.observer.unobserve(e.el), e.resize.observer = null);
        },
        resizeHandler: function() {
          !e || e.destroyed || !e.initialized || (e.emit("beforeResize"), e.emit("resize"));
        },
        orientationChangeHandler: function() {
          !e || e.destroyed || !e.initialized || e.emit("orientationchange");
        }
      }
    });
  },
  on: {
    init: function(e) {
      var n = ee();
      if (e.params.resizeObserver && Ic()) {
        e.resize.createObserver();
        return;
      }
      n.addEventListener("resize", e.resize.resizeHandler), n.addEventListener("orientationchange", e.resize.orientationChangeHandler);
    },
    destroy: function(e) {
      var n = ee();
      e.resize.removeObserver(), n.removeEventListener("resize", e.resize.resizeHandler), n.removeEventListener("orientationchange", e.resize.orientationChangeHandler);
    }
  }
};
function Wr() {
  return Wr = Object.assign || function(t) {
    for (var e = 1; e < arguments.length; e++) {
      var n = arguments[e];
      for (var r in n)
        Object.prototype.hasOwnProperty.call(n, r) && (t[r] = n[r]);
    }
    return t;
  }, Wr.apply(this, arguments);
}
var yc = {
  attach: function(e, n) {
    n === void 0 && (n = {});
    var r = ee(), i = this, s = r.MutationObserver || r.WebkitMutationObserver, a = new s(function(o) {
      if (o.length === 1) {
        i.emit("observerUpdate", o[0]);
        return;
      }
      var l = function() {
        i.emit("observerUpdate", o[0]);
      };
      r.requestAnimationFrame ? r.requestAnimationFrame(l) : r.setTimeout(l, 0);
    });
    a.observe(e, {
      attributes: typeof n.attributes > "u" ? !0 : n.attributes,
      childList: typeof n.childList > "u" ? !0 : n.childList,
      characterData: typeof n.characterData > "u" ? !0 : n.characterData
    }), i.observer.observers.push(a);
  },
  init: function() {
    var e = this;
    if (!(!e.support.observer || !e.params.observer)) {
      if (e.params.observeParents)
        for (var n = e.$el.parents(), r = 0; r < n.length; r += 1)
          e.observer.attach(n[r]);
      e.observer.attach(e.$el[0], {
        childList: e.params.observeSlideChildren
      }), e.observer.attach(e.$wrapperEl[0], {
        attributes: !1
      });
    }
  },
  destroy: function() {
    var e = this;
    e.observer.observers.forEach(function(n) {
      n.disconnect();
    }), e.observer.observers = [];
  }
};
const xc = {
  name: "observer",
  params: {
    observer: !1,
    observeParents: !1,
    observeSlideChildren: !1
  },
  create: function() {
    var e = this;
    Ei(e, {
      observer: Wr({}, yc, {
        observers: []
      })
    });
  },
  on: {
    init: function(e) {
      e.observer.init();
    },
    destroy: function(e) {
      e.observer.destroy();
    }
  }
}, Vc = {
  useParams: function(e) {
    var n = this;
    n.modules && Object.keys(n.modules).forEach(function(r) {
      var i = n.modules[r];
      i.params && Z(e, i.params);
    });
  },
  useModules: function(e) {
    e === void 0 && (e = {});
    var n = this;
    n.modules && Object.keys(n.modules).forEach(function(r) {
      var i = n.modules[r], s = e[r] || {};
      i.on && n.on && Object.keys(i.on).forEach(function(a) {
        n.on(a, i.on[a]);
      }), i.create && i.create.bind(n)(s);
    });
  }
}, Rc = {
  on: function(e, n, r) {
    var i = this;
    if (typeof n != "function") return i;
    var s = r ? "unshift" : "push";
    return e.split(" ").forEach(function(a) {
      i.eventsListeners[a] || (i.eventsListeners[a] = []), i.eventsListeners[a][s](n);
    }), i;
  },
  once: function(e, n, r) {
    var i = this;
    if (typeof n != "function") return i;
    function s() {
      i.off(e, s), s.__emitterProxy && delete s.__emitterProxy;
      for (var a = arguments.length, o = new Array(a), l = 0; l < a; l++)
        o[l] = arguments[l];
      n.apply(i, o);
    }
    return s.__emitterProxy = n, i.on(e, s, r);
  },
  onAny: function(e, n) {
    var r = this;
    if (typeof e != "function") return r;
    var i = n ? "unshift" : "push";
    return r.eventsAnyListeners.indexOf(e) < 0 && r.eventsAnyListeners[i](e), r;
  },
  offAny: function(e) {
    var n = this;
    if (!n.eventsAnyListeners) return n;
    var r = n.eventsAnyListeners.indexOf(e);
    return r >= 0 && n.eventsAnyListeners.splice(r, 1), n;
  },
  off: function(e, n) {
    var r = this;
    return r.eventsListeners && e.split(" ").forEach(function(i) {
      typeof n > "u" ? r.eventsListeners[i] = [] : r.eventsListeners[i] && r.eventsListeners[i].forEach(function(s, a) {
        (s === n || s.__emitterProxy && s.__emitterProxy === n) && r.eventsListeners[i].splice(a, 1);
      });
    }), r;
  },
  emit: function() {
    var e = this;
    if (!e.eventsListeners) return e;
    for (var n, r, i, s = arguments.length, a = new Array(s), o = 0; o < s; o++)
      a[o] = arguments[o];
    typeof a[0] == "string" || Array.isArray(a[0]) ? (n = a[0], r = a.slice(1, a.length), i = e) : (n = a[0].events, r = a[0].data, i = a[0].context || e), r.unshift(i);
    var l = Array.isArray(n) ? n : n.split(" ");
    return l.forEach(function(c) {
      e.eventsAnyListeners && e.eventsAnyListeners.length && e.eventsAnyListeners.forEach(function(d) {
        d.apply(i, [c].concat(r));
      }), e.eventsListeners && e.eventsListeners[c] && e.eventsListeners[c].forEach(function(d) {
        d.apply(i, r);
      });
    }), e;
  }
};
function Sc() {
  var t = this, e, n, r = t.$el;
  typeof t.params.width < "u" && t.params.width !== null ? e = t.params.width : e = r[0].clientWidth, typeof t.params.height < "u" && t.params.height !== null ? n = t.params.height : n = r[0].clientHeight, !(e === 0 && t.isHorizontal() || n === 0 && t.isVertical()) && (e = e - parseInt(r.css("padding-left") || 0, 10) - parseInt(r.css("padding-right") || 0, 10), n = n - parseInt(r.css("padding-top") || 0, 10) - parseInt(r.css("padding-bottom") || 0, 10), Number.isNaN(e) && (e = 0), Number.isNaN(n) && (n = 0), Z(t, {
    width: e,
    height: n,
    size: t.isHorizontal() ? e : n
  }));
}
function Tc() {
  var t = this;
  function e(se) {
    return t.isHorizontal() ? se : {
      width: "height",
      "margin-top": "margin-left",
      "margin-bottom ": "margin-right",
      "margin-left": "margin-top",
      "margin-right": "margin-bottom",
      "padding-left": "padding-top",
      "padding-right": "padding-bottom",
      marginRight: "marginBottom"
    }[se];
  }
  function n(se, ut) {
    return parseFloat(se.getPropertyValue(e(ut)) || 0);
  }
  var r = t.params, i = t.$wrapperEl, s = t.size, a = t.rtlTranslate, o = t.wrongRTL, l = t.virtual && r.virtual.enabled, c = l ? t.virtual.slides.length : t.slides.length, d = i.children("." + t.params.slideClass), A = l ? t.virtual.slides.length : d.length, u = [], f = [], h = [], v = r.slidesOffsetBefore;
  typeof v == "function" && (v = r.slidesOffsetBefore.call(t));
  var g = r.slidesOffsetAfter;
  typeof g == "function" && (g = r.slidesOffsetAfter.call(t));
  var C = t.snapGrid.length, b = t.slidesGrid.length, w = r.spaceBetween, p = -v, E = 0, M = 0;
  if (!(typeof s > "u")) {
    typeof w == "string" && w.indexOf("%") >= 0 && (w = parseFloat(w.replace("%", "")) / 100 * s), t.virtualSize = -w, a ? d.css({
      marginLeft: "",
      marginBottom: "",
      marginTop: ""
    }) : d.css({
      marginRight: "",
      marginBottom: "",
      marginTop: ""
    });
    var I;
    r.slidesPerColumn > 1 && (Math.floor(A / r.slidesPerColumn) === A / t.params.slidesPerColumn ? I = A : I = Math.ceil(A / r.slidesPerColumn) * r.slidesPerColumn, r.slidesPerView !== "auto" && r.slidesPerColumnFill === "row" && (I = Math.max(I, r.slidesPerView * r.slidesPerColumn)));
    for (var y, x = r.slidesPerColumn, D = I / x, B = Math.floor(A / r.slidesPerColumn), F = 0; F < A; F += 1) {
      y = 0;
      var T = d.eq(F);
      if (r.slidesPerColumn > 1) {
        var H = void 0, Q = void 0, q = void 0;
        if (r.slidesPerColumnFill === "row" && r.slidesPerGroup > 1) {
          var te = Math.floor(F / (r.slidesPerGroup * r.slidesPerColumn)), ye = F - r.slidesPerColumn * r.slidesPerGroup * te, xe = te === 0 ? r.slidesPerGroup : Math.min(Math.ceil((A - te * x * r.slidesPerGroup) / x), r.slidesPerGroup);
          q = Math.floor(ye / xe), Q = ye - q * xe + te * r.slidesPerGroup, H = Q + q * I / x, T.css({
            "-webkit-box-ordinal-group": H,
            "-moz-box-ordinal-group": H,
            "-ms-flex-order": H,
            "-webkit-order": H,
            order: H
          });
        } else r.slidesPerColumnFill === "column" ? (Q = Math.floor(F / x), q = F - Q * x, (Q > B || Q === B && q === x - 1) && (q += 1, q >= x && (q = 0, Q += 1))) : (q = Math.floor(F / D), Q = F - q * D);
        T.css(e("margin-top"), q !== 0 ? r.spaceBetween && r.spaceBetween + "px" : "");
      }
      if (T.css("display") !== "none") {
        if (r.slidesPerView === "auto") {
          var Ve = getComputedStyle(T[0]), ct = T[0].style.transform, Re = T[0].style.webkitTransform;
          if (ct && (T[0].style.transform = "none"), Re && (T[0].style.webkitTransform = "none"), r.roundLengths)
            y = t.isHorizontal() ? T.outerWidth(!0) : T.outerHeight(!0);
          else {
            var Se = n(Ve, "width"), jt = n(Ve, "padding-left"), dt = n(Ve, "padding-right"), He = n(Ve, "margin-left"), Xe = n(Ve, "margin-right"), We = Ve.getPropertyValue("box-sizing");
            if (We && We === "border-box")
              y = Se + He + Xe;
            else {
              var At = T[0], qt = At.clientWidth, fr = At.offsetWidth;
              y = Se + jt + dt + He + Xe + (fr - qt);
            }
          }
          ct && (T[0].style.transform = ct), Re && (T[0].style.webkitTransform = Re), r.roundLengths && (y = Math.floor(y));
        } else
          y = (s - (r.slidesPerView - 1) * w) / r.slidesPerView, r.roundLengths && (y = Math.floor(y)), d[F] && (d[F].style[e("width")] = y + "px");
        d[F] && (d[F].swiperSlideSize = y), h.push(y), r.centeredSlides ? (p = p + y / 2 + E / 2 + w, E === 0 && F !== 0 && (p = p - s / 2 - w), F === 0 && (p = p - s / 2 - w), Math.abs(p) < 1 / 1e3 && (p = 0), r.roundLengths && (p = Math.floor(p)), M % r.slidesPerGroup === 0 && u.push(p), f.push(p)) : (r.roundLengths && (p = Math.floor(p)), (M - Math.min(t.params.slidesPerGroupSkip, M)) % t.params.slidesPerGroup === 0 && u.push(p), f.push(p), p = p + y + w), t.virtualSize += y + w, E = y, M += 1;
      }
    }
    t.virtualSize = Math.max(t.virtualSize, s) + g;
    var Vt;
    if (a && o && (r.effect === "slide" || r.effect === "coverflow") && i.css({
      width: t.virtualSize + r.spaceBetween + "px"
    }), r.setWrapperSize) {
      var pr;
      i.css((pr = {}, pr[e("width")] = t.virtualSize + r.spaceBetween + "px", pr));
    }
    if (r.slidesPerColumn > 1) {
      var hr;
      if (t.virtualSize = (y + r.spaceBetween) * I, t.virtualSize = Math.ceil(t.virtualSize / r.slidesPerColumn) - r.spaceBetween, i.css((hr = {}, hr[e("width")] = t.virtualSize + r.spaceBetween + "px", hr)), r.centeredSlides) {
        Vt = [];
        for (var Rn = 0; Rn < u.length; Rn += 1) {
          var gr = u[Rn];
          r.roundLengths && (gr = Math.floor(gr)), u[Rn] < t.virtualSize + u[0] && Vt.push(gr);
        }
        u = Vt;
      }
    }
    if (!r.centeredSlides) {
      Vt = [];
      for (var Sn = 0; Sn < u.length; Sn += 1) {
        var mr = u[Sn];
        r.roundLengths && (mr = Math.floor(mr)), u[Sn] <= t.virtualSize - s && Vt.push(mr);
      }
      u = Vt, Math.floor(t.virtualSize - s) - Math.floor(u[u.length - 1]) > 1 && u.push(t.virtualSize - s);
    }
    if (u.length === 0 && (u = [0]), r.spaceBetween !== 0) {
      var vr, sl = t.isHorizontal() && a ? "marginLeft" : e("marginRight");
      d.filter(function(se, ut) {
        return r.cssMode ? ut !== d.length - 1 : !0;
      }).css((vr = {}, vr[sl] = w + "px", vr));
    }
    if (r.centeredSlides && r.centeredSlidesBounds) {
      var wr = 0;
      h.forEach(function(se) {
        wr += se + (r.spaceBetween ? r.spaceBetween : 0);
      }), wr -= r.spaceBetween;
      var Xi = wr - s;
      u = u.map(function(se) {
        return se < 0 ? -v : se > Xi ? Xi + g : se;
      });
    }
    if (r.centerInsufficientSlides) {
      var Tn = 0;
      if (h.forEach(function(se) {
        Tn += se + (r.spaceBetween ? r.spaceBetween : 0);
      }), Tn -= r.spaceBetween, Tn < s) {
        var Wi = (s - Tn) / 2;
        u.forEach(function(se, ut) {
          u[ut] = se - Wi;
        }), f.forEach(function(se, ut) {
          f[ut] = se + Wi;
        });
      }
    }
    Z(t, {
      slides: d,
      snapGrid: u,
      slidesGrid: f,
      slidesSizesGrid: h
    }), A !== c && t.emit("slidesLengthChange"), u.length !== C && (t.params.watchOverflow && t.checkOverflow(), t.emit("snapGridLengthChange")), f.length !== b && t.emit("slidesGridLengthChange"), (r.watchSlidesProgress || r.watchSlidesVisibility) && t.updateSlidesOffset();
  }
}
function zc(t) {
  var e = this, n = [], r = e.virtual && e.params.virtual.enabled, i = 0, s;
  typeof t == "number" ? e.setTransition(t) : t === !0 && e.setTransition(e.params.speed);
  var a = function(d) {
    return r ? e.slides.filter(function(A) {
      return parseInt(A.getAttribute("data-swiper-slide-index"), 10) === d;
    })[0] : e.slides.eq(d)[0];
  };
  if (e.params.slidesPerView !== "auto" && e.params.slidesPerView > 1)
    if (e.params.centeredSlides)
      e.visibleSlides.each(function(c) {
        n.push(c);
      });
    else
      for (s = 0; s < Math.ceil(e.params.slidesPerView); s += 1) {
        var o = e.activeIndex + s;
        if (o > e.slides.length && !r) break;
        n.push(a(o));
      }
  else
    n.push(a(e.activeIndex));
  for (s = 0; s < n.length; s += 1)
    if (typeof n[s] < "u") {
      var l = n[s].offsetHeight;
      i = l > i ? l : i;
    }
  i && e.$wrapperEl.css("height", i + "px");
}
function Pc() {
  for (var t = this, e = t.slides, n = 0; n < e.length; n += 1)
    e[n].swiperSlideOffset = t.isHorizontal() ? e[n].offsetLeft : e[n].offsetTop;
}
function Dc(t) {
  t === void 0 && (t = this && this.translate || 0);
  var e = this, n = e.params, r = e.slides, i = e.rtlTranslate;
  if (r.length !== 0) {
    typeof r[0].swiperSlideOffset > "u" && e.updateSlidesOffset();
    var s = -t;
    i && (s = t), r.removeClass(n.slideVisibleClass), e.visibleSlidesIndexes = [], e.visibleSlides = [];
    for (var a = 0; a < r.length; a += 1) {
      var o = r[a], l = (s + (n.centeredSlides ? e.minTranslate() : 0) - o.swiperSlideOffset) / (o.swiperSlideSize + n.spaceBetween);
      if (n.watchSlidesVisibility || n.centeredSlides && n.autoHeight) {
        var c = -(s - o.swiperSlideOffset), d = c + e.slidesSizesGrid[a], A = c >= 0 && c < e.size - 1 || d > 1 && d <= e.size || c <= 0 && d >= e.size;
        A && (e.visibleSlides.push(o), e.visibleSlidesIndexes.push(a), r.eq(a).addClass(n.slideVisibleClass));
      }
      o.progress = i ? -l : l;
    }
    e.visibleSlides = V(e.visibleSlides);
  }
}
function Bc(t) {
  var e = this;
  if (typeof t > "u") {
    var n = e.rtlTranslate ? -1 : 1;
    t = e && e.translate && e.translate * n || 0;
  }
  var r = e.params, i = e.maxTranslate() - e.minTranslate(), s = e.progress, a = e.isBeginning, o = e.isEnd, l = a, c = o;
  i === 0 ? (s = 0, a = !0, o = !0) : (s = (t - e.minTranslate()) / i, a = s <= 0, o = s >= 1), Z(e, {
    progress: s,
    isBeginning: a,
    isEnd: o
  }), (r.watchSlidesProgress || r.watchSlidesVisibility || r.centeredSlides && r.autoHeight) && e.updateSlidesProgress(t), a && !l && e.emit("reachBeginning toEdge"), o && !c && e.emit("reachEnd toEdge"), (l && !a || c && !o) && e.emit("fromEdge"), e.emit("progress", s);
}
function Gc() {
  var t = this, e = t.slides, n = t.params, r = t.$wrapperEl, i = t.activeIndex, s = t.realIndex, a = t.virtual && n.virtual.enabled;
  e.removeClass(n.slideActiveClass + " " + n.slideNextClass + " " + n.slidePrevClass + " " + n.slideDuplicateActiveClass + " " + n.slideDuplicateNextClass + " " + n.slideDuplicatePrevClass);
  var o;
  a ? o = t.$wrapperEl.find("." + n.slideClass + '[data-swiper-slide-index="' + i + '"]') : o = e.eq(i), o.addClass(n.slideActiveClass), n.loop && (o.hasClass(n.slideDuplicateClass) ? r.children("." + n.slideClass + ":not(." + n.slideDuplicateClass + ')[data-swiper-slide-index="' + s + '"]').addClass(n.slideDuplicateActiveClass) : r.children("." + n.slideClass + "." + n.slideDuplicateClass + '[data-swiper-slide-index="' + s + '"]').addClass(n.slideDuplicateActiveClass));
  var l = o.nextAll("." + n.slideClass).eq(0).addClass(n.slideNextClass);
  n.loop && l.length === 0 && (l = e.eq(0), l.addClass(n.slideNextClass));
  var c = o.prevAll("." + n.slideClass).eq(0).addClass(n.slidePrevClass);
  n.loop && c.length === 0 && (c = e.eq(-1), c.addClass(n.slidePrevClass)), n.loop && (l.hasClass(n.slideDuplicateClass) ? r.children("." + n.slideClass + ":not(." + n.slideDuplicateClass + ')[data-swiper-slide-index="' + l.attr("data-swiper-slide-index") + '"]').addClass(n.slideDuplicateNextClass) : r.children("." + n.slideClass + "." + n.slideDuplicateClass + '[data-swiper-slide-index="' + l.attr("data-swiper-slide-index") + '"]').addClass(n.slideDuplicateNextClass), c.hasClass(n.slideDuplicateClass) ? r.children("." + n.slideClass + ":not(." + n.slideDuplicateClass + ')[data-swiper-slide-index="' + c.attr("data-swiper-slide-index") + '"]').addClass(n.slideDuplicatePrevClass) : r.children("." + n.slideClass + "." + n.slideDuplicateClass + '[data-swiper-slide-index="' + c.attr("data-swiper-slide-index") + '"]').addClass(n.slideDuplicatePrevClass)), t.emitSlidesClasses();
}
function kc(t) {
  var e = this, n = e.rtlTranslate ? e.translate : -e.translate, r = e.slidesGrid, i = e.snapGrid, s = e.params, a = e.activeIndex, o = e.realIndex, l = e.snapIndex, c = t, d;
  if (typeof c > "u") {
    for (var A = 0; A < r.length; A += 1)
      typeof r[A + 1] < "u" ? n >= r[A] && n < r[A + 1] - (r[A + 1] - r[A]) / 2 ? c = A : n >= r[A] && n < r[A + 1] && (c = A + 1) : n >= r[A] && (c = A);
    s.normalizeSlideIndex && (c < 0 || typeof c > "u") && (c = 0);
  }
  if (i.indexOf(n) >= 0)
    d = i.indexOf(n);
  else {
    var u = Math.min(s.slidesPerGroupSkip, c);
    d = u + Math.floor((c - u) / s.slidesPerGroup);
  }
  if (d >= i.length && (d = i.length - 1), c === a) {
    d !== l && (e.snapIndex = d, e.emit("snapIndexChange"));
    return;
  }
  var f = parseInt(e.slides.eq(c).attr("data-swiper-slide-index") || c, 10);
  Z(e, {
    snapIndex: d,
    realIndex: f,
    previousIndex: a,
    activeIndex: c
  }), e.emit("activeIndexChange"), e.emit("snapIndexChange"), o !== f && e.emit("realIndexChange"), (e.initialized || e.params.runCallbacksOnInit) && e.emit("slideChange");
}
function Nc(t) {
  var e = this, n = e.params, r = V(t.target).closest("." + n.slideClass)[0], i = !1, s;
  if (r) {
    for (var a = 0; a < e.slides.length; a += 1)
      if (e.slides[a] === r) {
        i = !0, s = a;
        break;
      }
  }
  if (r && i)
    e.clickedSlide = r, e.virtual && e.params.virtual.enabled ? e.clickedIndex = parseInt(V(r).attr("data-swiper-slide-index"), 10) : e.clickedIndex = s;
  else {
    e.clickedSlide = void 0, e.clickedIndex = void 0;
    return;
  }
  n.slideToClickedSlide && e.clickedIndex !== void 0 && e.clickedIndex !== e.activeIndex && e.slideToClickedSlide();
}
const Oc = {
  updateSize: Sc,
  updateSlides: Tc,
  updateAutoHeight: zc,
  updateSlidesOffset: Pc,
  updateSlidesProgress: Dc,
  updateProgress: Bc,
  updateSlidesClasses: Gc,
  updateActiveIndex: kc,
  updateClickedSlide: Nc
};
function Fc(t) {
  t === void 0 && (t = this.isHorizontal() ? "x" : "y");
  var e = this, n = e.params, r = e.rtlTranslate, i = e.translate, s = e.$wrapperEl;
  if (n.virtualTranslate)
    return r ? -i : i;
  if (n.cssMode)
    return i;
  var a = gc(s[0], t);
  return r && (a = -a), a || 0;
}
function Uc(t, e) {
  var n = this, r = n.rtlTranslate, i = n.params, s = n.$wrapperEl, a = n.wrapperEl, o = n.progress, l = 0, c = 0, d = 0;
  n.isHorizontal() ? l = r ? -t : t : c = t, i.roundLengths && (l = Math.floor(l), c = Math.floor(c)), i.cssMode ? a[n.isHorizontal() ? "scrollLeft" : "scrollTop"] = n.isHorizontal() ? -l : -c : i.virtualTranslate || s.transform("translate3d(" + l + "px, " + c + "px, " + d + "px)"), n.previousTranslate = n.translate, n.translate = n.isHorizontal() ? l : c;
  var A, u = n.maxTranslate() - n.minTranslate();
  u === 0 ? A = 0 : A = (t - n.minTranslate()) / u, A !== o && n.updateProgress(t), n.emit("setTranslate", n.translate, e);
}
function Qc() {
  return -this.snapGrid[0];
}
function jc() {
  return -this.snapGrid[this.snapGrid.length - 1];
}
function qc(t, e, n, r, i) {
  t === void 0 && (t = 0), e === void 0 && (e = this.params.speed), n === void 0 && (n = !0), r === void 0 && (r = !0);
  var s = this, a = s.params, o = s.wrapperEl;
  if (s.animating && a.preventInteractionOnTransition)
    return !1;
  var l = s.minTranslate(), c = s.maxTranslate(), d;
  if (r && t > l ? d = l : r && t < c ? d = c : d = t, s.updateProgress(d), a.cssMode) {
    var A = s.isHorizontal();
    if (e === 0)
      o[A ? "scrollLeft" : "scrollTop"] = -d;
    else if (o.scrollTo) {
      var u;
      o.scrollTo((u = {}, u[A ? "left" : "top"] = -d, u.behavior = "smooth", u));
    } else
      o[A ? "scrollLeft" : "scrollTop"] = -d;
    return !0;
  }
  return e === 0 ? (s.setTransition(0), s.setTranslate(d), n && (s.emit("beforeTransitionStart", e, i), s.emit("transitionEnd"))) : (s.setTransition(e), s.setTranslate(d), n && (s.emit("beforeTransitionStart", e, i), s.emit("transitionStart")), s.animating || (s.animating = !0, s.onTranslateToWrapperTransitionEnd || (s.onTranslateToWrapperTransitionEnd = function(h) {
    !s || s.destroyed || h.target === this && (s.$wrapperEl[0].removeEventListener("transitionend", s.onTranslateToWrapperTransitionEnd), s.$wrapperEl[0].removeEventListener("webkitTransitionEnd", s.onTranslateToWrapperTransitionEnd), s.onTranslateToWrapperTransitionEnd = null, delete s.onTranslateToWrapperTransitionEnd, n && s.emit("transitionEnd"));
  }), s.$wrapperEl[0].addEventListener("transitionend", s.onTranslateToWrapperTransitionEnd), s.$wrapperEl[0].addEventListener("webkitTransitionEnd", s.onTranslateToWrapperTransitionEnd))), !0;
}
const Zc = {
  getTranslate: Fc,
  setTranslate: Uc,
  minTranslate: Qc,
  maxTranslate: jc,
  translateTo: qc
};
function Yc(t, e) {
  var n = this;
  n.params.cssMode || n.$wrapperEl.transition(t), n.emit("setTransition", t, e);
}
function Lc(t, e) {
  t === void 0 && (t = !0);
  var n = this, r = n.activeIndex, i = n.params, s = n.previousIndex;
  if (!i.cssMode) {
    i.autoHeight && n.updateAutoHeight();
    var a = e;
    if (a || (r > s ? a = "next" : r < s ? a = "prev" : a = "reset"), n.emit("transitionStart"), t && r !== s) {
      if (a === "reset") {
        n.emit("slideResetTransitionStart");
        return;
      }
      n.emit("slideChangeTransitionStart"), a === "next" ? n.emit("slideNextTransitionStart") : n.emit("slidePrevTransitionStart");
    }
  }
}
function Kc(t, e) {
  t === void 0 && (t = !0);
  var n = this, r = n.activeIndex, i = n.previousIndex, s = n.params;
  if (n.animating = !1, !s.cssMode) {
    n.setTransition(0);
    var a = e;
    if (a || (r > i ? a = "next" : r < i ? a = "prev" : a = "reset"), n.emit("transitionEnd"), t && r !== i) {
      if (a === "reset") {
        n.emit("slideResetTransitionEnd");
        return;
      }
      n.emit("slideChangeTransitionEnd"), a === "next" ? n.emit("slideNextTransitionEnd") : n.emit("slidePrevTransitionEnd");
    }
  }
}
const Hc = {
  setTransition: Yc,
  transitionStart: Lc,
  transitionEnd: Kc
};
function Xc(t, e, n, r, i) {
  if (t === void 0 && (t = 0), e === void 0 && (e = this.params.speed), n === void 0 && (n = !0), typeof t != "number" && typeof t != "string")
    throw new Error("The 'index' argument cannot have type other than 'number' or 'string'. [" + typeof t + "] given.");
  if (typeof t == "string") {
    var s = parseInt(t, 10), a = isFinite(s);
    if (!a)
      throw new Error("The passed-in 'index' (string) couldn't be converted to 'number'. [" + t + "] given.");
    t = s;
  }
  var o = this, l = t;
  l < 0 && (l = 0);
  var c = o.params, d = o.snapGrid, A = o.slidesGrid, u = o.previousIndex, f = o.activeIndex, h = o.rtlTranslate, v = o.wrapperEl, g = o.enabled;
  if (o.animating && c.preventInteractionOnTransition || !g && !r && !i)
    return !1;
  var C = Math.min(o.params.slidesPerGroupSkip, l), b = C + Math.floor((l - C) / o.params.slidesPerGroup);
  b >= d.length && (b = d.length - 1), (f || c.initialSlide || 0) === (u || 0) && n && o.emit("beforeSlideChangeStart");
  var w = -d[b];
  if (o.updateProgress(w), c.normalizeSlideIndex)
    for (var p = 0; p < A.length; p += 1) {
      var E = -Math.floor(w * 100), M = Math.floor(A[p] * 100), I = Math.floor(A[p + 1] * 100);
      typeof A[p + 1] < "u" ? E >= M && E < I - (I - M) / 2 ? l = p : E >= M && E < I && (l = p + 1) : E >= M && (l = p);
    }
  if (o.initialized && l !== f && (!o.allowSlideNext && w < o.translate && w < o.minTranslate() || !o.allowSlidePrev && w > o.translate && w > o.maxTranslate() && (f || 0) !== l))
    return !1;
  var y;
  if (l > f ? y = "next" : l < f ? y = "prev" : y = "reset", h && -w === o.translate || !h && w === o.translate)
    return o.updateActiveIndex(l), c.autoHeight && o.updateAutoHeight(), o.updateSlidesClasses(), c.effect !== "slide" && o.setTranslate(w), y !== "reset" && (o.transitionStart(n, y), o.transitionEnd(n, y)), !1;
  if (c.cssMode) {
    var x = o.isHorizontal(), D = -w;
    if (h && (D = v.scrollWidth - v.offsetWidth - D), e === 0)
      v[x ? "scrollLeft" : "scrollTop"] = D;
    else if (v.scrollTo) {
      var B;
      v.scrollTo((B = {}, B[x ? "left" : "top"] = D, B.behavior = "smooth", B));
    } else
      v[x ? "scrollLeft" : "scrollTop"] = D;
    return !0;
  }
  return e === 0 ? (o.setTransition(0), o.setTranslate(w), o.updateActiveIndex(l), o.updateSlidesClasses(), o.emit("beforeTransitionStart", e, r), o.transitionStart(n, y), o.transitionEnd(n, y)) : (o.setTransition(e), o.setTranslate(w), o.updateActiveIndex(l), o.updateSlidesClasses(), o.emit("beforeTransitionStart", e, r), o.transitionStart(n, y), o.animating || (o.animating = !0, o.onSlideToWrapperTransitionEnd || (o.onSlideToWrapperTransitionEnd = function(T) {
    !o || o.destroyed || T.target === this && (o.$wrapperEl[0].removeEventListener("transitionend", o.onSlideToWrapperTransitionEnd), o.$wrapperEl[0].removeEventListener("webkitTransitionEnd", o.onSlideToWrapperTransitionEnd), o.onSlideToWrapperTransitionEnd = null, delete o.onSlideToWrapperTransitionEnd, o.transitionEnd(n, y));
  }), o.$wrapperEl[0].addEventListener("transitionend", o.onSlideToWrapperTransitionEnd), o.$wrapperEl[0].addEventListener("webkitTransitionEnd", o.onSlideToWrapperTransitionEnd))), !0;
}
function Wc(t, e, n, r) {
  t === void 0 && (t = 0), e === void 0 && (e = this.params.speed), n === void 0 && (n = !0);
  var i = this, s = t;
  return i.params.loop && (s += i.loopedSlides), i.slideTo(s, e, n, r);
}
function Jc(t, e, n) {
  t === void 0 && (t = this.params.speed), e === void 0 && (e = !0);
  var r = this, i = r.params, s = r.animating, a = r.enabled;
  if (!a) return r;
  var o = r.activeIndex < i.slidesPerGroupSkip ? 1 : i.slidesPerGroup;
  if (i.loop) {
    if (s && i.loopPreventsSlide) return !1;
    r.loopFix(), r._clientLeft = r.$wrapperEl[0].clientLeft;
  }
  return r.slideTo(r.activeIndex + o, t, e, n);
}
function _c(t, e, n) {
  t === void 0 && (t = this.params.speed), e === void 0 && (e = !0);
  var r = this, i = r.params, s = r.animating, a = r.snapGrid, o = r.slidesGrid, l = r.rtlTranslate, c = r.enabled;
  if (!c) return r;
  if (i.loop) {
    if (s && i.loopPreventsSlide) return !1;
    r.loopFix(), r._clientLeft = r.$wrapperEl[0].clientLeft;
  }
  var d = l ? r.translate : -r.translate;
  function A(g) {
    return g < 0 ? -Math.floor(Math.abs(g)) : Math.floor(g);
  }
  var u = A(d), f = a.map(function(g) {
    return A(g);
  }), h = a[f.indexOf(u) - 1];
  typeof h > "u" && i.cssMode && a.forEach(function(g) {
    !h && u >= g && (h = g);
  });
  var v;
  return typeof h < "u" && (v = o.indexOf(h), v < 0 && (v = r.activeIndex - 1)), r.slideTo(v, t, e, n);
}
function $c(t, e, n) {
  t === void 0 && (t = this.params.speed), e === void 0 && (e = !0);
  var r = this;
  return r.slideTo(r.activeIndex, t, e, n);
}
function ed(t, e, n, r) {
  t === void 0 && (t = this.params.speed), e === void 0 && (e = !0), r === void 0 && (r = 0.5);
  var i = this, s = i.activeIndex, a = Math.min(i.params.slidesPerGroupSkip, s), o = a + Math.floor((s - a) / i.params.slidesPerGroup), l = i.rtlTranslate ? i.translate : -i.translate;
  if (l >= i.snapGrid[o]) {
    var c = i.snapGrid[o], d = i.snapGrid[o + 1];
    l - c > (d - c) * r && (s += i.params.slidesPerGroup);
  } else {
    var A = i.snapGrid[o - 1], u = i.snapGrid[o];
    l - A <= (u - A) * r && (s -= i.params.slidesPerGroup);
  }
  return s = Math.max(s, 0), s = Math.min(s, i.slidesGrid.length - 1), i.slideTo(s, t, e, n);
}
function td() {
  var t = this, e = t.params, n = t.$wrapperEl, r = e.slidesPerView === "auto" ? t.slidesPerViewDynamic() : e.slidesPerView, i = t.clickedIndex, s;
  if (e.loop) {
    if (t.animating) return;
    s = parseInt(V(t.clickedSlide).attr("data-swiper-slide-index"), 10), e.centeredSlides ? i < t.loopedSlides - r / 2 || i > t.slides.length - t.loopedSlides + r / 2 ? (t.loopFix(), i = n.children("." + e.slideClass + '[data-swiper-slide-index="' + s + '"]:not(.' + e.slideDuplicateClass + ")").eq(0).index(), Xr(function() {
      t.slideTo(i);
    })) : t.slideTo(i) : i > t.slides.length - r ? (t.loopFix(), i = n.children("." + e.slideClass + '[data-swiper-slide-index="' + s + '"]:not(.' + e.slideDuplicateClass + ")").eq(0).index(), Xr(function() {
      t.slideTo(i);
    })) : t.slideTo(i);
  } else
    t.slideTo(i);
}
const nd = {
  slideTo: Xc,
  slideToLoop: Wc,
  slideNext: Jc,
  slidePrev: _c,
  slideReset: $c,
  slideToClosest: ed,
  slideToClickedSlide: td
};
function rd() {
  var t = this, e = he(), n = t.params, r = t.$wrapperEl;
  r.children("." + n.slideClass + "." + n.slideDuplicateClass).remove();
  var i = r.children("." + n.slideClass);
  if (n.loopFillGroupWithBlank) {
    var s = n.slidesPerGroup - i.length % n.slidesPerGroup;
    if (s !== n.slidesPerGroup) {
      for (var a = 0; a < s; a += 1) {
        var o = V(e.createElement("div")).addClass(n.slideClass + " " + n.slideBlankClass);
        r.append(o);
      }
      i = r.children("." + n.slideClass);
    }
  }
  n.slidesPerView === "auto" && !n.loopedSlides && (n.loopedSlides = i.length), t.loopedSlides = Math.ceil(parseFloat(n.loopedSlides || n.slidesPerView, 10)), t.loopedSlides += n.loopAdditionalSlides, t.loopedSlides > i.length && (t.loopedSlides = i.length);
  var l = [], c = [];
  i.each(function(u, f) {
    var h = V(u);
    f < t.loopedSlides && c.push(u), f < i.length && f >= i.length - t.loopedSlides && l.push(u), h.attr("data-swiper-slide-index", f);
  });
  for (var d = 0; d < c.length; d += 1)
    r.append(V(c[d].cloneNode(!0)).addClass(n.slideDuplicateClass));
  for (var A = l.length - 1; A >= 0; A -= 1)
    r.prepend(V(l[A].cloneNode(!0)).addClass(n.slideDuplicateClass));
}
function id() {
  var t = this;
  t.emit("beforeLoopFix");
  var e = t.activeIndex, n = t.slides, r = t.loopedSlides, i = t.allowSlidePrev, s = t.allowSlideNext, a = t.snapGrid, o = t.rtlTranslate, l;
  t.allowSlidePrev = !0, t.allowSlideNext = !0;
  var c = -a[e], d = c - t.getTranslate();
  if (e < r) {
    l = n.length - r * 3 + e, l += r;
    var A = t.slideTo(l, 0, !1, !0);
    A && d !== 0 && t.setTranslate((o ? -t.translate : t.translate) - d);
  } else if (e >= n.length - r) {
    l = -n.length + e + r, l += r;
    var u = t.slideTo(l, 0, !1, !0);
    u && d !== 0 && t.setTranslate((o ? -t.translate : t.translate) - d);
  }
  t.allowSlidePrev = i, t.allowSlideNext = s, t.emit("loopFix");
}
function sd() {
  var t = this, e = t.$wrapperEl, n = t.params, r = t.slides;
  e.children("." + n.slideClass + "." + n.slideDuplicateClass + ",." + n.slideClass + "." + n.slideBlankClass).remove(), r.removeAttr("data-swiper-slide-index");
}
const ad = {
  loopCreate: rd,
  loopFix: id,
  loopDestroy: sd
};
function od(t) {
  var e = this;
  if (!(e.support.touch || !e.params.simulateTouch || e.params.watchOverflow && e.isLocked || e.params.cssMode)) {
    var n = e.el;
    n.style.cursor = "move", n.style.cursor = t ? "-webkit-grabbing" : "-webkit-grab", n.style.cursor = t ? "-moz-grabbin" : "-moz-grab", n.style.cursor = t ? "grabbing" : "grab";
  }
}
function ld() {
  var t = this;
  t.support.touch || t.params.watchOverflow && t.isLocked || t.params.cssMode || (t.el.style.cursor = "");
}
const cd = {
  setGrabCursor: od,
  unsetGrabCursor: ld
};
function dd(t) {
  var e = this, n = e.$wrapperEl, r = e.params;
  if (r.loop && e.loopDestroy(), typeof t == "object" && "length" in t)
    for (var i = 0; i < t.length; i += 1)
      t[i] && n.append(t[i]);
  else
    n.append(t);
  r.loop && e.loopCreate(), r.observer && e.support.observer || e.update();
}
function Ad(t) {
  var e = this, n = e.params, r = e.$wrapperEl, i = e.activeIndex;
  n.loop && e.loopDestroy();
  var s = i + 1;
  if (typeof t == "object" && "length" in t) {
    for (var a = 0; a < t.length; a += 1)
      t[a] && r.prepend(t[a]);
    s = i + t.length;
  } else
    r.prepend(t);
  n.loop && e.loopCreate(), n.observer && e.support.observer || e.update(), e.slideTo(s, 0, !1);
}
function ud(t, e) {
  var n = this, r = n.$wrapperEl, i = n.params, s = n.activeIndex, a = s;
  i.loop && (a -= n.loopedSlides, n.loopDestroy(), n.slides = r.children("." + i.slideClass));
  var o = n.slides.length;
  if (t <= 0) {
    n.prependSlide(e);
    return;
  }
  if (t >= o) {
    n.appendSlide(e);
    return;
  }
  for (var l = a > t ? a + 1 : a, c = [], d = o - 1; d >= t; d -= 1) {
    var A = n.slides.eq(d);
    A.remove(), c.unshift(A);
  }
  if (typeof e == "object" && "length" in e) {
    for (var u = 0; u < e.length; u += 1)
      e[u] && r.append(e[u]);
    l = a > t ? a + e.length : a;
  } else
    r.append(e);
  for (var f = 0; f < c.length; f += 1)
    r.append(c[f]);
  i.loop && n.loopCreate(), i.observer && n.support.observer || n.update(), i.loop ? n.slideTo(l + n.loopedSlides, 0, !1) : n.slideTo(l, 0, !1);
}
function fd(t) {
  var e = this, n = e.params, r = e.$wrapperEl, i = e.activeIndex, s = i;
  n.loop && (s -= e.loopedSlides, e.loopDestroy(), e.slides = r.children("." + n.slideClass));
  var a = s, o;
  if (typeof t == "object" && "length" in t) {
    for (var l = 0; l < t.length; l += 1)
      o = t[l], e.slides[o] && e.slides.eq(o).remove(), o < a && (a -= 1);
    a = Math.max(a, 0);
  } else
    o = t, e.slides[o] && e.slides.eq(o).remove(), o < a && (a -= 1), a = Math.max(a, 0);
  n.loop && e.loopCreate(), n.observer && e.support.observer || e.update(), n.loop ? e.slideTo(a + e.loopedSlides, 0, !1) : e.slideTo(a, 0, !1);
}
function pd() {
  for (var t = this, e = [], n = 0; n < t.slides.length; n += 1)
    e.push(n);
  t.removeSlide(e);
}
const hd = {
  appendSlide: dd,
  prependSlide: Ad,
  addSlide: ud,
  removeSlide: fd,
  removeAllSlides: pd
};
function gd(t, e) {
  e === void 0 && (e = this);
  function n(r) {
    if (!r || r === he() || r === ee()) return null;
    r.assignedSlot && (r = r.assignedSlot);
    var i = r.closest(t);
    return i || n(r.getRootNode().host);
  }
  return n(e);
}
function md(t) {
  var e = this, n = he(), r = ee(), i = e.touchEventsData, s = e.params, a = e.touches, o = e.enabled;
  if (o && !(e.animating && s.preventInteractionOnTransition)) {
    var l = t;
    l.originalEvent && (l = l.originalEvent);
    var c = V(l.target);
    if (!(s.touchEventsTarget === "wrapper" && !c.closest(e.wrapperEl).length) && (i.isTouchEvent = l.type === "touchstart", !(!i.isTouchEvent && "which" in l && l.which === 3) && !(!i.isTouchEvent && "button" in l && l.button > 0) && !(i.isTouched && i.isMoved))) {
      var d = !!s.noSwipingClass && s.noSwipingClass !== "";
      d && l.target && l.target.shadowRoot && t.path && t.path[0] && (c = V(t.path[0]));
      var A = s.noSwipingSelector ? s.noSwipingSelector : "." + s.noSwipingClass, u = !!(l.target && l.target.shadowRoot);
      if (s.noSwiping && (u ? gd(A, l.target) : c.closest(A)[0])) {
        e.allowClick = !0;
        return;
      }
      if (!(s.swipeHandler && !c.closest(s.swipeHandler)[0])) {
        a.currentX = l.type === "touchstart" ? l.targetTouches[0].pageX : l.pageX, a.currentY = l.type === "touchstart" ? l.targetTouches[0].pageY : l.pageY;
        var f = a.currentX, h = a.currentY, v = s.edgeSwipeDetection || s.iOSEdgeSwipeDetection, g = s.edgeSwipeThreshold || s.iOSEdgeSwipeThreshold;
        if (v && (f <= g || f >= r.innerWidth - g))
          if (v === "prevent")
            t.preventDefault();
          else
            return;
        if (Z(i, {
          isTouched: !0,
          isMoved: !1,
          allowTouchCallbacks: !0,
          isScrolling: void 0,
          startMoving: void 0
        }), a.startX = f, a.startY = h, i.touchStartTime = st(), e.allowClick = !0, e.updateSize(), e.swipeDirection = void 0, s.threshold > 0 && (i.allowThresholdMove = !1), l.type !== "touchstart") {
          var C = !0;
          c.is(i.focusableElements) && (C = !1), n.activeElement && V(n.activeElement).is(i.focusableElements) && n.activeElement !== c[0] && n.activeElement.blur();
          var b = C && e.allowTouchMove && s.touchStartPreventDefault;
          (s.touchStartForcePreventDefault || b) && !c[0].isContentEditable && l.preventDefault();
        }
        e.emit("touchStart", l);
      }
    }
  }
}
function vd(t) {
  var e = he(), n = this, r = n.touchEventsData, i = n.params, s = n.touches, a = n.rtlTranslate, o = n.enabled;
  if (o) {
    var l = t;
    if (l.originalEvent && (l = l.originalEvent), !r.isTouched) {
      r.startMoving && r.isScrolling && n.emit("touchMoveOpposite", l);
      return;
    }
    if (!(r.isTouchEvent && l.type !== "touchmove")) {
      var c = l.type === "touchmove" && l.targetTouches && (l.targetTouches[0] || l.changedTouches[0]), d = l.type === "touchmove" ? c.pageX : l.pageX, A = l.type === "touchmove" ? c.pageY : l.pageY;
      if (l.preventedByNestedSwiper) {
        s.startX = d, s.startY = A;
        return;
      }
      if (!n.allowTouchMove) {
        n.allowClick = !1, r.isTouched && (Z(s, {
          startX: d,
          startY: A,
          currentX: d,
          currentY: A
        }), r.touchStartTime = st());
        return;
      }
      if (r.isTouchEvent && i.touchReleaseOnEdges && !i.loop) {
        if (n.isVertical()) {
          if (A < s.startY && n.translate <= n.maxTranslate() || A > s.startY && n.translate >= n.minTranslate()) {
            r.isTouched = !1, r.isMoved = !1;
            return;
          }
        } else if (d < s.startX && n.translate <= n.maxTranslate() || d > s.startX && n.translate >= n.minTranslate())
          return;
      }
      if (r.isTouchEvent && e.activeElement && l.target === e.activeElement && V(l.target).is(r.focusableElements)) {
        r.isMoved = !0, n.allowClick = !1;
        return;
      }
      if (r.allowTouchCallbacks && n.emit("touchMove", l), !(l.targetTouches && l.targetTouches.length > 1)) {
        s.currentX = d, s.currentY = A;
        var u = s.currentX - s.startX, f = s.currentY - s.startY;
        if (!(n.params.threshold && Math.sqrt(Math.pow(u, 2) + Math.pow(f, 2)) < n.params.threshold)) {
          if (typeof r.isScrolling > "u") {
            var h;
            n.isHorizontal() && s.currentY === s.startY || n.isVertical() && s.currentX === s.startX ? r.isScrolling = !1 : u * u + f * f >= 25 && (h = Math.atan2(Math.abs(f), Math.abs(u)) * 180 / Math.PI, r.isScrolling = n.isHorizontal() ? h > i.touchAngle : 90 - h > i.touchAngle);
          }
          if (r.isScrolling && n.emit("touchMoveOpposite", l), typeof r.startMoving > "u" && (s.currentX !== s.startX || s.currentY !== s.startY) && (r.startMoving = !0), r.isScrolling) {
            r.isTouched = !1;
            return;
          }
          if (r.startMoving) {
            n.allowClick = !1, !i.cssMode && l.cancelable && l.preventDefault(), i.touchMoveStopPropagation && !i.nested && l.stopPropagation(), r.isMoved || (i.loop && n.loopFix(), r.startTranslate = n.getTranslate(), n.setTransition(0), n.animating && n.$wrapperEl.trigger("webkitTransitionEnd transitionend"), r.allowMomentumBounce = !1, i.grabCursor && (n.allowSlideNext === !0 || n.allowSlidePrev === !0) && n.setGrabCursor(!0), n.emit("sliderFirstMove", l)), n.emit("sliderMove", l), r.isMoved = !0;
            var v = n.isHorizontal() ? u : f;
            s.diff = v, v *= i.touchRatio, a && (v = -v), n.swipeDirection = v > 0 ? "prev" : "next", r.currentTranslate = v + r.startTranslate;
            var g = !0, C = i.resistanceRatio;
            if (i.touchReleaseOnEdges && (C = 0), v > 0 && r.currentTranslate > n.minTranslate() ? (g = !1, i.resistance && (r.currentTranslate = n.minTranslate() - 1 + Math.pow(-n.minTranslate() + r.startTranslate + v, C))) : v < 0 && r.currentTranslate < n.maxTranslate() && (g = !1, i.resistance && (r.currentTranslate = n.maxTranslate() + 1 - Math.pow(n.maxTranslate() - r.startTranslate - v, C))), g && (l.preventedByNestedSwiper = !0), !n.allowSlideNext && n.swipeDirection === "next" && r.currentTranslate < r.startTranslate && (r.currentTranslate = r.startTranslate), !n.allowSlidePrev && n.swipeDirection === "prev" && r.currentTranslate > r.startTranslate && (r.currentTranslate = r.startTranslate), !n.allowSlidePrev && !n.allowSlideNext && (r.currentTranslate = r.startTranslate), i.threshold > 0)
              if (Math.abs(v) > i.threshold || r.allowThresholdMove) {
                if (!r.allowThresholdMove) {
                  r.allowThresholdMove = !0, s.startX = s.currentX, s.startY = s.currentY, r.currentTranslate = r.startTranslate, s.diff = n.isHorizontal() ? s.currentX - s.startX : s.currentY - s.startY;
                  return;
                }
              } else {
                r.currentTranslate = r.startTranslate;
                return;
              }
            !i.followFinger || i.cssMode || ((i.freeMode || i.watchSlidesProgress || i.watchSlidesVisibility) && (n.updateActiveIndex(), n.updateSlidesClasses()), i.freeMode && (r.velocities.length === 0 && r.velocities.push({
              position: s[n.isHorizontal() ? "startX" : "startY"],
              time: r.touchStartTime
            }), r.velocities.push({
              position: s[n.isHorizontal() ? "currentX" : "currentY"],
              time: st()
            })), n.updateProgress(r.currentTranslate), n.setTranslate(r.currentTranslate));
          }
        }
      }
    }
  }
}
function wd(t) {
  var e = this, n = e.touchEventsData, r = e.params, i = e.touches, s = e.rtlTranslate, a = e.$wrapperEl, o = e.slidesGrid, l = e.snapGrid, c = e.enabled;
  if (c) {
    var d = t;
    if (d.originalEvent && (d = d.originalEvent), n.allowTouchCallbacks && e.emit("touchEnd", d), n.allowTouchCallbacks = !1, !n.isTouched) {
      n.isMoved && r.grabCursor && e.setGrabCursor(!1), n.isMoved = !1, n.startMoving = !1;
      return;
    }
    r.grabCursor && n.isMoved && n.isTouched && (e.allowSlideNext === !0 || e.allowSlidePrev === !0) && e.setGrabCursor(!1);
    var A = st(), u = A - n.touchStartTime;
    if (e.allowClick && (e.updateClickedSlide(d), e.emit("tap click", d), u < 300 && A - n.lastClickTime < 300 && e.emit("doubleTap doubleClick", d)), n.lastClickTime = st(), Xr(function() {
      e.destroyed || (e.allowClick = !0);
    }), !n.isTouched || !n.isMoved || !e.swipeDirection || i.diff === 0 || n.currentTranslate === n.startTranslate) {
      n.isTouched = !1, n.isMoved = !1, n.startMoving = !1;
      return;
    }
    n.isTouched = !1, n.isMoved = !1, n.startMoving = !1;
    var f;
    if (r.followFinger ? f = s ? e.translate : -e.translate : f = -n.currentTranslate, !r.cssMode) {
      if (r.freeMode) {
        if (f < -e.minTranslate()) {
          e.slideTo(e.activeIndex);
          return;
        }
        if (f > -e.maxTranslate()) {
          e.slides.length < l.length ? e.slideTo(l.length - 1) : e.slideTo(e.slides.length - 1);
          return;
        }
        if (r.freeModeMomentum) {
          if (n.velocities.length > 1) {
            var h = n.velocities.pop(), v = n.velocities.pop(), g = h.position - v.position, C = h.time - v.time;
            e.velocity = g / C, e.velocity /= 2, Math.abs(e.velocity) < r.freeModeMinimumVelocity && (e.velocity = 0), (C > 150 || st() - h.time > 300) && (e.velocity = 0);
          } else
            e.velocity = 0;
          e.velocity *= r.freeModeMomentumVelocityRatio, n.velocities.length = 0;
          var b = 1e3 * r.freeModeMomentumRatio, w = e.velocity * b, p = e.translate + w;
          s && (p = -p);
          var E = !1, M, I = Math.abs(e.velocity) * 20 * r.freeModeMomentumBounceRatio, y;
          if (p < e.maxTranslate())
            r.freeModeMomentumBounce ? (p + e.maxTranslate() < -I && (p = e.maxTranslate() - I), M = e.maxTranslate(), E = !0, n.allowMomentumBounce = !0) : p = e.maxTranslate(), r.loop && r.centeredSlides && (y = !0);
          else if (p > e.minTranslate())
            r.freeModeMomentumBounce ? (p - e.minTranslate() > I && (p = e.minTranslate() + I), M = e.minTranslate(), E = !0, n.allowMomentumBounce = !0) : p = e.minTranslate(), r.loop && r.centeredSlides && (y = !0);
          else if (r.freeModeSticky) {
            for (var x, D = 0; D < l.length; D += 1)
              if (l[D] > -p) {
                x = D;
                break;
              }
            Math.abs(l[x] - p) < Math.abs(l[x - 1] - p) || e.swipeDirection === "next" ? p = l[x] : p = l[x - 1], p = -p;
          }
          if (y && e.once("transitionEnd", function() {
            e.loopFix();
          }), e.velocity !== 0) {
            if (s ? b = Math.abs((-p - e.translate) / e.velocity) : b = Math.abs((p - e.translate) / e.velocity), r.freeModeSticky) {
              var B = Math.abs((s ? -p : p) - e.translate), F = e.slidesSizesGrid[e.activeIndex];
              B < F ? b = r.speed : B < 2 * F ? b = r.speed * 1.5 : b = r.speed * 2.5;
            }
          } else if (r.freeModeSticky) {
            e.slideToClosest();
            return;
          }
          r.freeModeMomentumBounce && E ? (e.updateProgress(M), e.setTransition(b), e.setTranslate(p), e.transitionStart(!0, e.swipeDirection), e.animating = !0, a.transitionEnd(function() {
            !e || e.destroyed || !n.allowMomentumBounce || (e.emit("momentumBounce"), e.setTransition(r.speed), setTimeout(function() {
              e.setTranslate(M), a.transitionEnd(function() {
                !e || e.destroyed || e.transitionEnd();
              });
            }, 0));
          })) : e.velocity ? (e.updateProgress(p), e.setTransition(b), e.setTranslate(p), e.transitionStart(!0, e.swipeDirection), e.animating || (e.animating = !0, a.transitionEnd(function() {
            !e || e.destroyed || e.transitionEnd();
          }))) : (e.emit("_freeModeNoMomentumRelease"), e.updateProgress(p)), e.updateActiveIndex(), e.updateSlidesClasses();
        } else if (r.freeModeSticky) {
          e.slideToClosest();
          return;
        } else r.freeMode && e.emit("_freeModeNoMomentumRelease");
        (!r.freeModeMomentum || u >= r.longSwipesMs) && (e.updateProgress(), e.updateActiveIndex(), e.updateSlidesClasses());
        return;
      }
      for (var T = 0, H = e.slidesSizesGrid[0], Q = 0; Q < o.length; Q += Q < r.slidesPerGroupSkip ? 1 : r.slidesPerGroup) {
        var q = Q < r.slidesPerGroupSkip - 1 ? 1 : r.slidesPerGroup;
        typeof o[Q + q] < "u" ? f >= o[Q] && f < o[Q + q] && (T = Q, H = o[Q + q] - o[Q]) : f >= o[Q] && (T = Q, H = o[o.length - 1] - o[o.length - 2]);
      }
      var te = (f - o[T]) / H, ye = T < r.slidesPerGroupSkip - 1 ? 1 : r.slidesPerGroup;
      if (u > r.longSwipesMs) {
        if (!r.longSwipes) {
          e.slideTo(e.activeIndex);
          return;
        }
        e.swipeDirection === "next" && (te >= r.longSwipesRatio ? e.slideTo(T + ye) : e.slideTo(T)), e.swipeDirection === "prev" && (te > 1 - r.longSwipesRatio ? e.slideTo(T + ye) : e.slideTo(T));
      } else {
        if (!r.shortSwipes) {
          e.slideTo(e.activeIndex);
          return;
        }
        var xe = e.navigation && (d.target === e.navigation.nextEl || d.target === e.navigation.prevEl);
        xe ? d.target === e.navigation.nextEl ? e.slideTo(T + ye) : e.slideTo(T) : (e.swipeDirection === "next" && e.slideTo(T + ye), e.swipeDirection === "prev" && e.slideTo(T));
      }
    }
  }
}
function Jr() {
  var t = this, e = t.params, n = t.el;
  if (!(n && n.offsetWidth === 0)) {
    e.breakpoints && t.setBreakpoint();
    var r = t.allowSlideNext, i = t.allowSlidePrev, s = t.snapGrid;
    t.allowSlideNext = !0, t.allowSlidePrev = !0, t.updateSize(), t.updateSlides(), t.updateSlidesClasses(), (e.slidesPerView === "auto" || e.slidesPerView > 1) && t.isEnd && !t.isBeginning && !t.params.centeredSlides ? t.slideTo(t.slides.length - 1, 0, !1, !0) : t.slideTo(t.activeIndex, 0, !1, !0), t.autoplay && t.autoplay.running && t.autoplay.paused && t.autoplay.run(), t.allowSlidePrev = i, t.allowSlideNext = r, t.params.watchOverflow && s !== t.snapGrid && t.checkOverflow();
  }
}
function Cd(t) {
  var e = this;
  e.enabled && (e.allowClick || (e.params.preventClicks && t.preventDefault(), e.params.preventClicksPropagation && e.animating && (t.stopPropagation(), t.stopImmediatePropagation())));
}
function bd() {
  var t = this, e = t.wrapperEl, n = t.rtlTranslate, r = t.enabled;
  if (r) {
    t.previousTranslate = t.translate, t.isHorizontal() ? n ? t.translate = e.scrollWidth - e.offsetWidth - e.scrollLeft : t.translate = -e.scrollLeft : t.translate = -e.scrollTop, t.translate === -0 && (t.translate = 0), t.updateActiveIndex(), t.updateSlidesClasses();
    var i, s = t.maxTranslate() - t.minTranslate();
    s === 0 ? i = 0 : i = (t.translate - t.minTranslate()) / s, i !== t.progress && t.updateProgress(n ? -t.translate : t.translate), t.emit("setTranslate", t.translate, !1);
  }
}
var $i = !1;
function Ed() {
}
function Id() {
  var t = this, e = he(), n = t.params, r = t.touchEvents, i = t.el, s = t.wrapperEl, a = t.device, o = t.support;
  t.onTouchStart = md.bind(t), t.onTouchMove = vd.bind(t), t.onTouchEnd = wd.bind(t), n.cssMode && (t.onScroll = bd.bind(t)), t.onClick = Cd.bind(t);
  var l = !!n.nested;
  if (!o.touch && o.pointerEvents)
    i.addEventListener(r.start, t.onTouchStart, !1), e.addEventListener(r.move, t.onTouchMove, l), e.addEventListener(r.end, t.onTouchEnd, !1);
  else {
    if (o.touch) {
      var c = r.start === "touchstart" && o.passiveListener && n.passiveListeners ? {
        passive: !0,
        capture: !1
      } : !1;
      i.addEventListener(r.start, t.onTouchStart, c), i.addEventListener(r.move, t.onTouchMove, o.passiveListener ? {
        passive: !1,
        capture: l
      } : l), i.addEventListener(r.end, t.onTouchEnd, c), r.cancel && i.addEventListener(r.cancel, t.onTouchEnd, c), $i || (e.addEventListener("touchstart", Ed), $i = !0);
    }
    (n.simulateTouch && !a.ios && !a.android || n.simulateTouch && !o.touch && a.ios) && (i.addEventListener("mousedown", t.onTouchStart, !1), e.addEventListener("mousemove", t.onTouchMove, l), e.addEventListener("mouseup", t.onTouchEnd, !1));
  }
  (n.preventClicks || n.preventClicksPropagation) && i.addEventListener("click", t.onClick, !0), n.cssMode && s.addEventListener("scroll", t.onScroll), n.updateOnWindowResize ? t.on(a.ios || a.android ? "resize orientationchange observerUpdate" : "resize observerUpdate", Jr, !0) : t.on("observerUpdate", Jr, !0);
}
function Md() {
  var t = this, e = he(), n = t.params, r = t.touchEvents, i = t.el, s = t.wrapperEl, a = t.device, o = t.support, l = !!n.nested;
  if (!o.touch && o.pointerEvents)
    i.removeEventListener(r.start, t.onTouchStart, !1), e.removeEventListener(r.move, t.onTouchMove, l), e.removeEventListener(r.end, t.onTouchEnd, !1);
  else {
    if (o.touch) {
      var c = r.start === "onTouchStart" && o.passiveListener && n.passiveListeners ? {
        passive: !0,
        capture: !1
      } : !1;
      i.removeEventListener(r.start, t.onTouchStart, c), i.removeEventListener(r.move, t.onTouchMove, l), i.removeEventListener(r.end, t.onTouchEnd, c), r.cancel && i.removeEventListener(r.cancel, t.onTouchEnd, c);
    }
    (n.simulateTouch && !a.ios && !a.android || n.simulateTouch && !o.touch && a.ios) && (i.removeEventListener("mousedown", t.onTouchStart, !1), e.removeEventListener("mousemove", t.onTouchMove, l), e.removeEventListener("mouseup", t.onTouchEnd, !1));
  }
  (n.preventClicks || n.preventClicksPropagation) && i.removeEventListener("click", t.onClick, !0), n.cssMode && s.removeEventListener("scroll", t.onScroll), t.off(a.ios || a.android ? "resize orientationchange observerUpdate" : "resize observerUpdate", Jr);
}
const yd = {
  attachEvents: Id,
  detachEvents: Md
};
function xd() {
  var t = this, e = t.activeIndex, n = t.initialized, r = t.loopedSlides, i = r === void 0 ? 0 : r, s = t.params, a = t.$el, o = s.breakpoints;
  if (!(!o || o && Object.keys(o).length === 0)) {
    var l = t.getBreakpoint(o, t.params.breakpointsBase, t.el);
    if (!(!l || t.currentBreakpoint === l)) {
      var c = l in o ? o[l] : void 0;
      c && ["slidesPerView", "spaceBetween", "slidesPerGroup", "slidesPerGroupSkip", "slidesPerColumn"].forEach(function(C) {
        var b = c[C];
        typeof b > "u" || (C === "slidesPerView" && (b === "AUTO" || b === "auto") ? c[C] = "auto" : C === "slidesPerView" ? c[C] = parseFloat(b) : c[C] = parseInt(b, 10));
      });
      var d = c || t.originalParams, A = s.slidesPerColumn > 1, u = d.slidesPerColumn > 1, f = s.enabled;
      A && !u ? (a.removeClass(s.containerModifierClass + "multirow " + s.containerModifierClass + "multirow-column"), t.emitContainerClasses()) : !A && u && (a.addClass(s.containerModifierClass + "multirow"), (d.slidesPerColumnFill && d.slidesPerColumnFill === "column" || !d.slidesPerColumnFill && s.slidesPerColumnFill === "column") && a.addClass(s.containerModifierClass + "multirow-column"), t.emitContainerClasses());
      var h = d.direction && d.direction !== s.direction, v = s.loop && (d.slidesPerView !== s.slidesPerView || h);
      h && n && t.changeDirection(), Z(t.params, d);
      var g = t.params.enabled;
      Z(t, {
        allowTouchMove: t.params.allowTouchMove,
        allowSlideNext: t.params.allowSlideNext,
        allowSlidePrev: t.params.allowSlidePrev
      }), f && !g ? t.disable() : !f && g && t.enable(), t.currentBreakpoint = l, t.emit("_beforeBreakpoint", d), v && n && (t.loopDestroy(), t.loopCreate(), t.updateSlides(), t.slideTo(e - i + t.loopedSlides, 0, !1)), t.emit("breakpoint", d);
    }
  }
}
function Vd(t, e, n) {
  if (e === void 0 && (e = "window"), !(!t || e === "container" && !n)) {
    var r = !1, i = ee(), s = e === "window" ? i.innerHeight : n.clientHeight, a = Object.keys(t).map(function(A) {
      if (typeof A == "string" && A.indexOf("@") === 0) {
        var u = parseFloat(A.substr(1)), f = s * u;
        return {
          value: f,
          point: A
        };
      }
      return {
        value: A,
        point: A
      };
    });
    a.sort(function(A, u) {
      return parseInt(A.value, 10) - parseInt(u.value, 10);
    });
    for (var o = 0; o < a.length; o += 1) {
      var l = a[o], c = l.point, d = l.value;
      e === "window" ? i.matchMedia("(min-width: " + d + "px)").matches && (r = c) : d <= n.clientWidth && (r = c);
    }
    return r || "max";
  }
}
const Rd = {
  setBreakpoint: xd,
  getBreakpoint: Vd
};
function Sd(t, e) {
  var n = [];
  return t.forEach(function(r) {
    typeof r == "object" ? Object.keys(r).forEach(function(i) {
      r[i] && n.push(e + i);
    }) : typeof r == "string" && n.push(e + r);
  }), n;
}
function Td() {
  var t = this, e = t.classNames, n = t.params, r = t.rtl, i = t.$el, s = t.device, a = t.support, o = Sd(["initialized", n.direction, {
    "pointer-events": a.pointerEvents && !a.touch
  }, {
    "free-mode": n.freeMode
  }, {
    autoheight: n.autoHeight
  }, {
    rtl: r
  }, {
    multirow: n.slidesPerColumn > 1
  }, {
    "multirow-column": n.slidesPerColumn > 1 && n.slidesPerColumnFill === "column"
  }, {
    android: s.android
  }, {
    ios: s.ios
  }, {
    "css-mode": n.cssMode
  }], n.containerModifierClass);
  e.push.apply(e, o), i.addClass([].concat(e).join(" ")), t.emitContainerClasses();
}
function zd() {
  var t = this, e = t.$el, n = t.classNames;
  e.removeClass(n.join(" ")), t.emitContainerClasses();
}
const Pd = {
  addClasses: Td,
  removeClasses: zd
};
function Dd(t, e, n, r, i, s) {
  var a = ee(), o;
  function l() {
    s && s();
  }
  var c = V(t).parent("picture")[0];
  !c && (!t.complete || !i) && e ? (o = new a.Image(), o.onload = l, o.onerror = l, r && (o.sizes = r), n && (o.srcset = n), e && (o.src = e)) : l();
}
function Bd() {
  var t = this;
  t.imagesToLoad = t.$el.find("img");
  function e() {
    typeof t > "u" || t === null || !t || t.destroyed || (t.imagesLoaded !== void 0 && (t.imagesLoaded += 1), t.imagesLoaded === t.imagesToLoad.length && (t.params.updateOnImagesReady && t.update(), t.emit("imagesReady")));
  }
  for (var n = 0; n < t.imagesToLoad.length; n += 1) {
    var r = t.imagesToLoad[n];
    t.loadImage(r, r.currentSrc || r.getAttribute("src"), r.srcset || r.getAttribute("srcset"), r.sizes || r.getAttribute("sizes"), !0, e);
  }
}
const Gd = {
  loadImage: Dd,
  preloadImages: Bd
};
function kd() {
  var t = this, e = t.params, n = t.isLocked, r = t.slides.length > 0 && e.slidesOffsetBefore + e.spaceBetween * (t.slides.length - 1) + t.slides[0].offsetWidth * t.slides.length;
  e.slidesOffsetBefore && e.slidesOffsetAfter && r ? t.isLocked = r <= t.size : t.isLocked = t.snapGrid.length === 1, t.allowSlideNext = !t.isLocked, t.allowSlidePrev = !t.isLocked, n !== t.isLocked && t.emit(t.isLocked ? "lock" : "unlock"), n && n !== t.isLocked && (t.isEnd = !1, t.navigation && t.navigation.update());
}
const Nd = {
  checkOverflow: kd
}, es = {
  init: !0,
  direction: "horizontal",
  touchEventsTarget: "container",
  initialSlide: 0,
  speed: 300,
  cssMode: !1,
  updateOnWindowResize: !0,
  resizeObserver: !1,
  nested: !1,
  createElements: !1,
  enabled: !0,
  focusableElements: "input, select, option, textarea, button, video, label",
  // Overrides
  width: null,
  height: null,
  //
  preventInteractionOnTransition: !1,
  // ssr
  userAgent: null,
  url: null,
  // To support iOS's swipe-to-go-back gesture (when being used in-app).
  edgeSwipeDetection: !1,
  edgeSwipeThreshold: 20,
  // Free mode
  freeMode: !1,
  freeModeMomentum: !0,
  freeModeMomentumRatio: 1,
  freeModeMomentumBounce: !0,
  freeModeMomentumBounceRatio: 1,
  freeModeMomentumVelocityRatio: 1,
  freeModeSticky: !1,
  freeModeMinimumVelocity: 0.02,
  // Autoheight
  autoHeight: !1,
  // Set wrapper width
  setWrapperSize: !1,
  // Virtual Translate
  virtualTranslate: !1,
  // Effects
  effect: "slide",
  // 'slide' or 'fade' or 'cube' or 'coverflow' or 'flip'
  // Breakpoints
  breakpoints: void 0,
  breakpointsBase: "window",
  // Slides grid
  spaceBetween: 0,
  slidesPerView: 1,
  slidesPerColumn: 1,
  slidesPerColumnFill: "column",
  slidesPerGroup: 1,
  slidesPerGroupSkip: 0,
  centeredSlides: !1,
  centeredSlidesBounds: !1,
  slidesOffsetBefore: 0,
  // in px
  slidesOffsetAfter: 0,
  // in px
  normalizeSlideIndex: !0,
  centerInsufficientSlides: !1,
  // Disable swiper and hide navigation when container not overflow
  watchOverflow: !1,
  // Round length
  roundLengths: !1,
  // Touches
  touchRatio: 1,
  touchAngle: 45,
  simulateTouch: !0,
  shortSwipes: !0,
  longSwipes: !0,
  longSwipesRatio: 0.5,
  longSwipesMs: 300,
  followFinger: !0,
  allowTouchMove: !0,
  threshold: 0,
  touchMoveStopPropagation: !1,
  touchStartPreventDefault: !0,
  touchStartForcePreventDefault: !1,
  touchReleaseOnEdges: !1,
  // Unique Navigation Elements
  uniqueNavElements: !0,
  // Resistance
  resistance: !0,
  resistanceRatio: 0.85,
  // Progress
  watchSlidesProgress: !1,
  watchSlidesVisibility: !1,
  // Cursor
  grabCursor: !1,
  // Clicks
  preventClicks: !0,
  preventClicksPropagation: !0,
  slideToClickedSlide: !1,
  // Images
  preloadImages: !0,
  updateOnImagesReady: !0,
  // loop
  loop: !1,
  loopAdditionalSlides: 0,
  loopedSlides: null,
  loopFillGroupWithBlank: !1,
  loopPreventsSlide: !0,
  // Swiping/no swiping
  allowSlidePrev: !0,
  allowSlideNext: !0,
  swipeHandler: null,
  // '.swipe-handler',
  noSwiping: !0,
  noSwipingClass: "swiper-no-swiping",
  noSwipingSelector: null,
  // Passive Listeners
  passiveListeners: !0,
  // NS
  containerModifierClass: "swiper-container-",
  // NEW
  slideClass: "swiper-slide",
  slideBlankClass: "swiper-slide-invisible-blank",
  slideActiveClass: "swiper-slide-active",
  slideDuplicateActiveClass: "swiper-slide-duplicate-active",
  slideVisibleClass: "swiper-slide-visible",
  slideDuplicateClass: "swiper-slide-duplicate",
  slideNextClass: "swiper-slide-next",
  slideDuplicateNextClass: "swiper-slide-duplicate-next",
  slidePrevClass: "swiper-slide-prev",
  slideDuplicatePrevClass: "swiper-slide-duplicate-prev",
  wrapperClass: "swiper-wrapper",
  // Callbacks
  runCallbacksOnInit: !0,
  // Internals
  _emitClasses: !1
};
function Od(t, e) {
  for (var n = 0; n < e.length; n++) {
    var r = e[n];
    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(t, r.key, r);
  }
}
function Fd(t, e, n) {
  return n && Od(t, n), t;
}
var yr = {
  modular: Vc,
  eventsEmitter: Rc,
  update: Oc,
  translate: Zc,
  transition: Hc,
  slide: nd,
  loop: ad,
  grabCursor: cd,
  manipulation: hd,
  events: yd,
  breakpoints: Rd,
  checkOverflow: Nd,
  classes: Pd,
  images: Gd
}, xr = {}, me = /* @__PURE__ */ function() {
  function t() {
    for (var n, r, i = arguments.length, s = new Array(i), a = 0; a < i; a++)
      s[a] = arguments[a];
    if (s.length === 1 && s[0].constructor && Object.prototype.toString.call(s[0]).slice(8, -1) === "Object" ? r = s[0] : (n = s[0], r = s[1]), r || (r = {}), r = Z({}, r), n && !r.el && (r.el = n), r.el && V(r.el).length > 1) {
      var o = [];
      return V(r.el).each(function(d) {
        var A = Z({}, r, {
          el: d
        });
        o.push(new t(A));
      }), o;
    }
    var l = this;
    l.__swiper__ = !0, l.support = ma(), l.device = Cc({
      userAgent: r.userAgent
    }), l.browser = Ec(), l.eventsListeners = {}, l.eventsAnyListeners = [], typeof l.modules > "u" && (l.modules = {}), Object.keys(l.modules).forEach(function(d) {
      var A = l.modules[d];
      if (A.params) {
        var u = Object.keys(A.params)[0], f = A.params[u];
        if (typeof f != "object" || f === null || (["navigation", "pagination", "scrollbar"].indexOf(u) >= 0 && r[u] === !0 && (r[u] = {
          auto: !0
        }), !(u in r && "enabled" in f))) return;
        r[u] === !0 && (r[u] = {
          enabled: !0
        }), typeof r[u] == "object" && !("enabled" in r[u]) && (r[u].enabled = !0), r[u] || (r[u] = {
          enabled: !1
        });
      }
    });
    var c = Z({}, es);
    return l.useParams(c), l.params = Z({}, c, xr, r), l.originalParams = Z({}, l.params), l.passedParams = Z({}, r), l.params && l.params.on && Object.keys(l.params.on).forEach(function(d) {
      l.on(d, l.params.on[d]);
    }), l.params && l.params.onAny && l.onAny(l.params.onAny), l.$ = V, Z(l, {
      enabled: l.params.enabled,
      el: n,
      // Classes
      classNames: [],
      // Slides
      slides: V(),
      slidesGrid: [],
      snapGrid: [],
      slidesSizesGrid: [],
      // isDirection
      isHorizontal: function() {
        return l.params.direction === "horizontal";
      },
      isVertical: function() {
        return l.params.direction === "vertical";
      },
      // Indexes
      activeIndex: 0,
      realIndex: 0,
      //
      isBeginning: !0,
      isEnd: !1,
      // Props
      translate: 0,
      previousTranslate: 0,
      progress: 0,
      velocity: 0,
      animating: !1,
      // Locks
      allowSlideNext: l.params.allowSlideNext,
      allowSlidePrev: l.params.allowSlidePrev,
      // Touch Events
      touchEvents: function() {
        var A = ["touchstart", "touchmove", "touchend", "touchcancel"], u = ["mousedown", "mousemove", "mouseup"];
        return l.support.pointerEvents && (u = ["pointerdown", "pointermove", "pointerup"]), l.touchEventsTouch = {
          start: A[0],
          move: A[1],
          end: A[2],
          cancel: A[3]
        }, l.touchEventsDesktop = {
          start: u[0],
          move: u[1],
          end: u[2]
        }, l.support.touch || !l.params.simulateTouch ? l.touchEventsTouch : l.touchEventsDesktop;
      }(),
      touchEventsData: {
        isTouched: void 0,
        isMoved: void 0,
        allowTouchCallbacks: void 0,
        touchStartTime: void 0,
        isScrolling: void 0,
        currentTranslate: void 0,
        startTranslate: void 0,
        allowThresholdMove: void 0,
        // Form elements to match
        focusableElements: l.params.focusableElements,
        // Last click time
        lastClickTime: st(),
        clickTimeout: void 0,
        // Velocities
        velocities: [],
        allowMomentumBounce: void 0,
        isTouchEvent: void 0,
        startMoving: void 0
      },
      // Clicks
      allowClick: !0,
      // Touches
      allowTouchMove: l.params.allowTouchMove,
      touches: {
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        diff: 0
      },
      // Images
      imagesToLoad: [],
      imagesLoaded: 0
    }), l.useModules(), l.emit("_swiper"), l.params.init && l.init(), l;
  }
  var e = t.prototype;
  return e.enable = function() {
    var r = this;
    r.enabled || (r.enabled = !0, r.params.grabCursor && r.setGrabCursor(), r.emit("enable"));
  }, e.disable = function() {
    var r = this;
    r.enabled && (r.enabled = !1, r.params.grabCursor && r.unsetGrabCursor(), r.emit("disable"));
  }, e.setProgress = function(r, i) {
    var s = this;
    r = Math.min(Math.max(r, 0), 1);
    var a = s.minTranslate(), o = s.maxTranslate(), l = (o - a) * r + a;
    s.translateTo(l, typeof i > "u" ? 0 : i), s.updateActiveIndex(), s.updateSlidesClasses();
  }, e.emitContainerClasses = function() {
    var r = this;
    if (!(!r.params._emitClasses || !r.el)) {
      var i = r.el.className.split(" ").filter(function(s) {
        return s.indexOf("swiper-container") === 0 || s.indexOf(r.params.containerModifierClass) === 0;
      });
      r.emit("_containerClasses", i.join(" "));
    }
  }, e.getSlideClasses = function(r) {
    var i = this;
    return r.className.split(" ").filter(function(s) {
      return s.indexOf("swiper-slide") === 0 || s.indexOf(i.params.slideClass) === 0;
    }).join(" ");
  }, e.emitSlidesClasses = function() {
    var r = this;
    if (!(!r.params._emitClasses || !r.el)) {
      var i = [];
      r.slides.each(function(s) {
        var a = r.getSlideClasses(s);
        i.push({
          slideEl: s,
          classNames: a
        }), r.emit("_slideClass", s, a);
      }), r.emit("_slideClasses", i);
    }
  }, e.slidesPerViewDynamic = function() {
    var r = this, i = r.params, s = r.slides, a = r.slidesGrid, o = r.size, l = r.activeIndex, c = 1;
    if (i.centeredSlides) {
      for (var d = s[l].swiperSlideSize, A, u = l + 1; u < s.length; u += 1)
        s[u] && !A && (d += s[u].swiperSlideSize, c += 1, d > o && (A = !0));
      for (var f = l - 1; f >= 0; f -= 1)
        s[f] && !A && (d += s[f].swiperSlideSize, c += 1, d > o && (A = !0));
    } else
      for (var h = l + 1; h < s.length; h += 1)
        a[h] - a[l] < o && (c += 1);
    return c;
  }, e.update = function() {
    var r = this;
    if (!r || r.destroyed) return;
    var i = r.snapGrid, s = r.params;
    s.breakpoints && r.setBreakpoint(), r.updateSize(), r.updateSlides(), r.updateProgress(), r.updateSlidesClasses();
    function a() {
      var l = r.rtlTranslate ? r.translate * -1 : r.translate, c = Math.min(Math.max(l, r.maxTranslate()), r.minTranslate());
      r.setTranslate(c), r.updateActiveIndex(), r.updateSlidesClasses();
    }
    var o;
    r.params.freeMode ? (a(), r.params.autoHeight && r.updateAutoHeight()) : ((r.params.slidesPerView === "auto" || r.params.slidesPerView > 1) && r.isEnd && !r.params.centeredSlides ? o = r.slideTo(r.slides.length - 1, 0, !1, !0) : o = r.slideTo(r.activeIndex, 0, !1, !0), o || a()), s.watchOverflow && i !== r.snapGrid && r.checkOverflow(), r.emit("update");
  }, e.changeDirection = function(r, i) {
    i === void 0 && (i = !0);
    var s = this, a = s.params.direction;
    return r || (r = a === "horizontal" ? "vertical" : "horizontal"), r === a || r !== "horizontal" && r !== "vertical" || (s.$el.removeClass("" + s.params.containerModifierClass + a).addClass("" + s.params.containerModifierClass + r), s.emitContainerClasses(), s.params.direction = r, s.slides.each(function(o) {
      r === "vertical" ? o.style.width = "" : o.style.height = "";
    }), s.emit("changeDirection"), i && s.update()), s;
  }, e.mount = function(r) {
    var i = this;
    if (i.mounted) return !0;
    var s = V(r || i.params.el);
    if (r = s[0], !r)
      return !1;
    r.swiper = i;
    var a = function() {
      return "." + (i.params.wrapperClass || "").trim().split(" ").join(".");
    }, o = function() {
      if (r && r.shadowRoot && r.shadowRoot.querySelector) {
        var u = V(r.shadowRoot.querySelector(a()));
        return u.children = function(f) {
          return s.children(f);
        }, u;
      }
      return s.children(a());
    }, l = o();
    if (l.length === 0 && i.params.createElements) {
      var c = he(), d = c.createElement("div");
      l = V(d), d.className = i.params.wrapperClass, s.append(d), s.children("." + i.params.slideClass).each(function(A) {
        l.append(A);
      });
    }
    return Z(i, {
      $el: s,
      el: r,
      $wrapperEl: l,
      wrapperEl: l[0],
      mounted: !0,
      // RTL
      rtl: r.dir.toLowerCase() === "rtl" || s.css("direction") === "rtl",
      rtlTranslate: i.params.direction === "horizontal" && (r.dir.toLowerCase() === "rtl" || s.css("direction") === "rtl"),
      wrongRTL: l.css("display") === "-webkit-box"
    }), !0;
  }, e.init = function(r) {
    var i = this;
    if (i.initialized) return i;
    var s = i.mount(r);
    return s === !1 || (i.emit("beforeInit"), i.params.breakpoints && i.setBreakpoint(), i.addClasses(), i.params.loop && i.loopCreate(), i.updateSize(), i.updateSlides(), i.params.watchOverflow && i.checkOverflow(), i.params.grabCursor && i.enabled && i.setGrabCursor(), i.params.preloadImages && i.preloadImages(), i.params.loop ? i.slideTo(i.params.initialSlide + i.loopedSlides, 0, i.params.runCallbacksOnInit, !1, !0) : i.slideTo(i.params.initialSlide, 0, i.params.runCallbacksOnInit, !1, !0), i.attachEvents(), i.initialized = !0, i.emit("init"), i.emit("afterInit")), i;
  }, e.destroy = function(r, i) {
    r === void 0 && (r = !0), i === void 0 && (i = !0);
    var s = this, a = s.params, o = s.$el, l = s.$wrapperEl, c = s.slides;
    return typeof s.params > "u" || s.destroyed || (s.emit("beforeDestroy"), s.initialized = !1, s.detachEvents(), a.loop && s.loopDestroy(), i && (s.removeClasses(), o.removeAttr("style"), l.removeAttr("style"), c && c.length && c.removeClass([a.slideVisibleClass, a.slideActiveClass, a.slideNextClass, a.slidePrevClass].join(" ")).removeAttr("style").removeAttr("data-swiper-slide-index")), s.emit("destroy"), Object.keys(s.eventsListeners).forEach(function(d) {
      s.off(d);
    }), r !== !1 && (s.$el[0].swiper = null, pc(s)), s.destroyed = !0), null;
  }, t.extendDefaults = function(r) {
    Z(xr, r);
  }, t.installModule = function(r) {
    t.prototype.modules || (t.prototype.modules = {});
    var i = r.name || Object.keys(t.prototype.modules).length + "_" + st();
    t.prototype.modules[i] = r;
  }, t.use = function(r) {
    return Array.isArray(r) ? (r.forEach(function(i) {
      return t.installModule(i);
    }), t) : (t.installModule(r), t);
  }, Fd(t, null, [{
    key: "extendedDefaults",
    get: function() {
      return xr;
    }
  }, {
    key: "defaults",
    get: function() {
      return es;
    }
  }]), t;
}();
Object.keys(yr).forEach(function(t) {
  Object.keys(yr[t]).forEach(function(e) {
    me.prototype[e] = yr[t][e];
  });
});
me.use([Mc, xc]);
function _r() {
  return _r = Object.assign || function(t) {
    for (var e = 1; e < arguments.length; e++) {
      var n = arguments[e];
      for (var r in n)
        Object.prototype.hasOwnProperty.call(n, r) && (t[r] = n[r]);
    }
    return t;
  }, _r.apply(this, arguments);
}
var Ud = {
  toggleEl: function(e, n) {
    e[n ? "addClass" : "removeClass"](this.params.navigation.disabledClass), e[0] && e[0].tagName === "BUTTON" && (e[0].disabled = n);
  },
  update: function() {
    var e = this, n = e.params.navigation, r = e.navigation.toggleEl;
    if (!e.params.loop) {
      var i = e.navigation, s = i.$nextEl, a = i.$prevEl;
      a && a.length > 0 && (e.isBeginning ? r(a, !0) : r(a, !1), e.params.watchOverflow && e.enabled && a[e.isLocked ? "addClass" : "removeClass"](n.lockClass)), s && s.length > 0 && (e.isEnd ? r(s, !0) : r(s, !1), e.params.watchOverflow && e.enabled && s[e.isLocked ? "addClass" : "removeClass"](n.lockClass));
    }
  },
  onPrevClick: function(e) {
    var n = this;
    e.preventDefault(), !(n.isBeginning && !n.params.loop) && n.slidePrev();
  },
  onNextClick: function(e) {
    var n = this;
    e.preventDefault(), !(n.isEnd && !n.params.loop) && n.slideNext();
  },
  init: function() {
    var e = this, n = e.params.navigation;
    if (e.params.navigation = ga(e.$el, e.params.navigation, e.params.createElements, {
      nextEl: "swiper-button-next",
      prevEl: "swiper-button-prev"
    }), !!(n.nextEl || n.prevEl)) {
      var r, i;
      n.nextEl && (r = V(n.nextEl), e.params.uniqueNavElements && typeof n.nextEl == "string" && r.length > 1 && e.$el.find(n.nextEl).length === 1 && (r = e.$el.find(n.nextEl))), n.prevEl && (i = V(n.prevEl), e.params.uniqueNavElements && typeof n.prevEl == "string" && i.length > 1 && e.$el.find(n.prevEl).length === 1 && (i = e.$el.find(n.prevEl))), r && r.length > 0 && r.on("click", e.navigation.onNextClick), i && i.length > 0 && i.on("click", e.navigation.onPrevClick), Z(e.navigation, {
        $nextEl: r,
        nextEl: r && r[0],
        $prevEl: i,
        prevEl: i && i[0]
      }), e.enabled || (r && r.addClass(n.lockClass), i && i.addClass(n.lockClass));
    }
  },
  destroy: function() {
    var e = this, n = e.navigation, r = n.$nextEl, i = n.$prevEl;
    r && r.length && (r.off("click", e.navigation.onNextClick), r.removeClass(e.params.navigation.disabledClass)), i && i.length && (i.off("click", e.navigation.onPrevClick), i.removeClass(e.params.navigation.disabledClass));
  }
};
const va = {
  name: "navigation",
  params: {
    navigation: {
      nextEl: null,
      prevEl: null,
      hideOnClick: !1,
      disabledClass: "swiper-button-disabled",
      hiddenClass: "swiper-button-hidden",
      lockClass: "swiper-button-lock"
    }
  },
  create: function() {
    var e = this;
    Ei(e, {
      navigation: _r({}, Ud)
    });
  },
  on: {
    init: function(e) {
      e.navigation.init(), e.navigation.update();
    },
    toEdge: function(e) {
      e.navigation.update();
    },
    fromEdge: function(e) {
      e.navigation.update();
    },
    destroy: function(e) {
      e.navigation.destroy();
    },
    "enable disable": function(e) {
      var n = e.navigation, r = n.$nextEl, i = n.$prevEl;
      r && r[e.enabled ? "removeClass" : "addClass"](e.params.navigation.lockClass), i && i[e.enabled ? "removeClass" : "addClass"](e.params.navigation.lockClass);
    },
    click: function(e, n) {
      var r = e.navigation, i = r.$nextEl, s = r.$prevEl, a = n.target;
      if (e.params.navigation.hideOnClick && !V(a).is(s) && !V(a).is(i)) {
        if (e.pagination && e.params.pagination && e.params.pagination.clickable && (e.pagination.el === a || e.pagination.el.contains(a))) return;
        var o;
        i ? o = i.hasClass(e.params.navigation.hiddenClass) : s && (o = s.hasClass(e.params.navigation.hiddenClass)), o === !0 ? e.emit("navigationShow") : e.emit("navigationHide"), i && i.toggleClass(e.params.navigation.hiddenClass), s && s.toggleClass(e.params.navigation.hiddenClass);
      }
    }
  }
};
function $r() {
  return $r = Object.assign || function(t) {
    for (var e = 1; e < arguments.length; e++) {
      var n = arguments[e];
      for (var r in n)
        Object.prototype.hasOwnProperty.call(n, r) && (t[r] = n[r]);
    }
    return t;
  }, $r.apply(this, arguments);
}
var Qd = {
  update: function() {
    var e = this, n = e.rtl, r = e.params.pagination;
    if (!(!r.el || !e.pagination.el || !e.pagination.$el || e.pagination.$el.length === 0)) {
      var i = e.virtual && e.params.virtual.enabled ? e.virtual.slides.length : e.slides.length, s = e.pagination.$el, a, o = e.params.loop ? Math.ceil((i - e.loopedSlides * 2) / e.params.slidesPerGroup) : e.snapGrid.length;
      if (e.params.loop ? (a = Math.ceil((e.activeIndex - e.loopedSlides) / e.params.slidesPerGroup), a > i - 1 - e.loopedSlides * 2 && (a -= i - e.loopedSlides * 2), a > o - 1 && (a -= o), a < 0 && e.params.paginationType !== "bullets" && (a = o + a)) : typeof e.snapIndex < "u" ? a = e.snapIndex : a = e.activeIndex || 0, r.type === "bullets" && e.pagination.bullets && e.pagination.bullets.length > 0) {
        var l = e.pagination.bullets, c, d, A;
        if (r.dynamicBullets && (e.pagination.bulletSize = l.eq(0)[e.isHorizontal() ? "outerWidth" : "outerHeight"](!0), s.css(e.isHorizontal() ? "width" : "height", e.pagination.bulletSize * (r.dynamicMainBullets + 4) + "px"), r.dynamicMainBullets > 1 && e.previousIndex !== void 0 && (e.pagination.dynamicBulletIndex += a - e.previousIndex, e.pagination.dynamicBulletIndex > r.dynamicMainBullets - 1 ? e.pagination.dynamicBulletIndex = r.dynamicMainBullets - 1 : e.pagination.dynamicBulletIndex < 0 && (e.pagination.dynamicBulletIndex = 0)), c = a - e.pagination.dynamicBulletIndex, d = c + (Math.min(l.length, r.dynamicMainBullets) - 1), A = (d + c) / 2), l.removeClass(r.bulletActiveClass + " " + r.bulletActiveClass + "-next " + r.bulletActiveClass + "-next-next " + r.bulletActiveClass + "-prev " + r.bulletActiveClass + "-prev-prev " + r.bulletActiveClass + "-main"), s.length > 1)
          l.each(function(x) {
            var D = V(x), B = D.index();
            B === a && D.addClass(r.bulletActiveClass), r.dynamicBullets && (B >= c && B <= d && D.addClass(r.bulletActiveClass + "-main"), B === c && D.prev().addClass(r.bulletActiveClass + "-prev").prev().addClass(r.bulletActiveClass + "-prev-prev"), B === d && D.next().addClass(r.bulletActiveClass + "-next").next().addClass(r.bulletActiveClass + "-next-next"));
          });
        else {
          var u = l.eq(a), f = u.index();
          if (u.addClass(r.bulletActiveClass), r.dynamicBullets) {
            for (var h = l.eq(c), v = l.eq(d), g = c; g <= d; g += 1)
              l.eq(g).addClass(r.bulletActiveClass + "-main");
            if (e.params.loop)
              if (f >= l.length - r.dynamicMainBullets) {
                for (var C = r.dynamicMainBullets; C >= 0; C -= 1)
                  l.eq(l.length - C).addClass(r.bulletActiveClass + "-main");
                l.eq(l.length - r.dynamicMainBullets - 1).addClass(r.bulletActiveClass + "-prev");
              } else
                h.prev().addClass(r.bulletActiveClass + "-prev").prev().addClass(r.bulletActiveClass + "-prev-prev"), v.next().addClass(r.bulletActiveClass + "-next").next().addClass(r.bulletActiveClass + "-next-next");
            else
              h.prev().addClass(r.bulletActiveClass + "-prev").prev().addClass(r.bulletActiveClass + "-prev-prev"), v.next().addClass(r.bulletActiveClass + "-next").next().addClass(r.bulletActiveClass + "-next-next");
          }
        }
        if (r.dynamicBullets) {
          var b = Math.min(l.length, r.dynamicMainBullets + 4), w = (e.pagination.bulletSize * b - e.pagination.bulletSize) / 2 - A * e.pagination.bulletSize, p = n ? "right" : "left";
          l.css(e.isHorizontal() ? p : "top", w + "px");
        }
      }
      if (r.type === "fraction" && (s.find(Rt(r.currentClass)).text(r.formatFractionCurrent(a + 1)), s.find(Rt(r.totalClass)).text(r.formatFractionTotal(o))), r.type === "progressbar") {
        var E;
        r.progressbarOpposite ? E = e.isHorizontal() ? "vertical" : "horizontal" : E = e.isHorizontal() ? "horizontal" : "vertical";
        var M = (a + 1) / o, I = 1, y = 1;
        E === "horizontal" ? I = M : y = M, s.find(Rt(r.progressbarFillClass)).transform("translate3d(0,0,0) scaleX(" + I + ") scaleY(" + y + ")").transition(e.params.speed);
      }
      r.type === "custom" && r.renderCustom ? (s.html(r.renderCustom(e, a + 1, o)), e.emit("paginationRender", s[0])) : e.emit("paginationUpdate", s[0]), e.params.watchOverflow && e.enabled && s[e.isLocked ? "addClass" : "removeClass"](r.lockClass);
    }
  },
  render: function() {
    var e = this, n = e.params.pagination;
    if (!(!n.el || !e.pagination.el || !e.pagination.$el || e.pagination.$el.length === 0)) {
      var r = e.virtual && e.params.virtual.enabled ? e.virtual.slides.length : e.slides.length, i = e.pagination.$el, s = "";
      if (n.type === "bullets") {
        var a = e.params.loop ? Math.ceil((r - e.loopedSlides * 2) / e.params.slidesPerGroup) : e.snapGrid.length;
        e.params.freeMode && !e.params.loop && a > r && (a = r);
        for (var o = 0; o < a; o += 1)
          n.renderBullet ? s += n.renderBullet.call(e, o, n.bulletClass) : s += "<" + n.bulletElement + ' class="' + n.bulletClass + '"></' + n.bulletElement + ">";
        i.html(s), e.pagination.bullets = i.find(Rt(n.bulletClass));
      }
      n.type === "fraction" && (n.renderFraction ? s = n.renderFraction.call(e, n.currentClass, n.totalClass) : s = '<span class="' + n.currentClass + '"></span> / ' + ('<span class="' + n.totalClass + '"></span>'), i.html(s)), n.type === "progressbar" && (n.renderProgressbar ? s = n.renderProgressbar.call(e, n.progressbarFillClass) : s = '<span class="' + n.progressbarFillClass + '"></span>', i.html(s)), n.type !== "custom" && e.emit("paginationRender", e.pagination.$el[0]);
    }
  },
  init: function() {
    var e = this;
    e.params.pagination = ga(e.$el, e.params.pagination, e.params.createElements, {
      el: "swiper-pagination"
    });
    var n = e.params.pagination;
    if (n.el) {
      var r = V(n.el);
      r.length !== 0 && (e.params.uniqueNavElements && typeof n.el == "string" && r.length > 1 && (r = e.$el.find(n.el)), n.type === "bullets" && n.clickable && r.addClass(n.clickableClass), r.addClass(n.modifierClass + n.type), n.type === "bullets" && n.dynamicBullets && (r.addClass("" + n.modifierClass + n.type + "-dynamic"), e.pagination.dynamicBulletIndex = 0, n.dynamicMainBullets < 1 && (n.dynamicMainBullets = 1)), n.type === "progressbar" && n.progressbarOpposite && r.addClass(n.progressbarOppositeClass), n.clickable && r.on("click", Rt(n.bulletClass), function(s) {
        s.preventDefault();
        var a = V(this).index() * e.params.slidesPerGroup;
        e.params.loop && (a += e.loopedSlides), e.slideTo(a);
      }), Z(e.pagination, {
        $el: r,
        el: r[0]
      }), e.enabled || r.addClass(n.lockClass));
    }
  },
  destroy: function() {
    var e = this, n = e.params.pagination;
    if (!(!n.el || !e.pagination.el || !e.pagination.$el || e.pagination.$el.length === 0)) {
      var r = e.pagination.$el;
      r.removeClass(n.hiddenClass), r.removeClass(n.modifierClass + n.type), e.pagination.bullets && e.pagination.bullets.removeClass(n.bulletActiveClass), n.clickable && r.off("click", Rt(n.bulletClass));
    }
  }
};
const wa = {
  name: "pagination",
  params: {
    pagination: {
      el: null,
      bulletElement: "span",
      clickable: !1,
      hideOnClick: !1,
      renderBullet: null,
      renderProgressbar: null,
      renderFraction: null,
      renderCustom: null,
      progressbarOpposite: !1,
      type: "bullets",
      // 'bullets' or 'progressbar' or 'fraction' or 'custom'
      dynamicBullets: !1,
      dynamicMainBullets: 1,
      formatFractionCurrent: function(e) {
        return e;
      },
      formatFractionTotal: function(e) {
        return e;
      },
      bulletClass: "swiper-pagination-bullet",
      bulletActiveClass: "swiper-pagination-bullet-active",
      modifierClass: "swiper-pagination-",
      // NEW
      currentClass: "swiper-pagination-current",
      totalClass: "swiper-pagination-total",
      hiddenClass: "swiper-pagination-hidden",
      progressbarFillClass: "swiper-pagination-progressbar-fill",
      progressbarOppositeClass: "swiper-pagination-progressbar-opposite",
      clickableClass: "swiper-pagination-clickable",
      // NEW
      lockClass: "swiper-pagination-lock"
    }
  },
  create: function() {
    var e = this;
    Ei(e, {
      pagination: $r({
        dynamicBulletIndex: 0
      }, Qd)
    });
  },
  on: {
    init: function(e) {
      e.pagination.init(), e.pagination.render(), e.pagination.update();
    },
    activeIndexChange: function(e) {
      (e.params.loop || typeof e.snapIndex > "u") && e.pagination.update();
    },
    snapIndexChange: function(e) {
      e.params.loop || e.pagination.update();
    },
    slidesLengthChange: function(e) {
      e.params.loop && (e.pagination.render(), e.pagination.update());
    },
    snapGridLengthChange: function(e) {
      e.params.loop || (e.pagination.render(), e.pagination.update());
    },
    destroy: function(e) {
      e.pagination.destroy();
    },
    "enable disable": function(e) {
      var n = e.pagination.$el;
      n && n[e.enabled ? "removeClass" : "addClass"](e.params.pagination.lockClass);
    },
    click: function(e, n) {
      var r = n.target;
      if (e.params.pagination.el && e.params.pagination.hideOnClick && e.pagination.$el.length > 0 && !V(r).hasClass(e.params.pagination.bulletClass)) {
        if (e.navigation && (e.navigation.nextEl && r === e.navigation.nextEl || e.navigation.prevEl && r === e.navigation.prevEl)) return;
        var i = e.pagination.$el.hasClass(e.params.pagination.hiddenClass);
        i === !0 ? e.emit("paginationShow") : e.emit("paginationHide"), e.pagination.$el.toggleClass(e.params.pagination.hiddenClass);
      }
    }
  }
};
me.prototype.slideToMapID = function(t) {
  const e = this.$el[0].querySelector(".swiper-slide-active");
  if (e && e.getAttribute("data") == t) return;
  const n = this.$el[0].querySelectorAll(".swiper-slide");
  for (let r = 0; r < n.length; r++) {
    const i = n[r];
    if (i.getAttribute("data") == t)
      return this.slideToLoop(
        parseInt(i.getAttribute("data-swiper-slide-index") || "0")
      );
  }
};
me.prototype.slideToIndex = function(t) {
  const e = this.$el[0].querySelector(".swiper-slide-active");
  e && parseInt(e.getAttribute("data-swiper-slide-index") || "0") == t || this.slideToLoop(t);
};
me.prototype.setSlideMapID = function(t) {
  this.slideToMapID(t), this.setSlideMapIDAsSelected(t);
};
me.prototype.setSlideIndex = function(t) {
  this.slideToIndex(t), this.setSlideIndexAsSelected(t);
};
me.prototype.setSlideIndexAsSelected = function(t) {
  const e = this.$el[0].querySelectorAll(".swiper-slide");
  for (let n = 0; n < e.length; n++) {
    const r = e[n];
    r.getAttribute("data-swiper-slide-index") == t ? r.classList.add("selected") : r.classList.remove("selected");
  }
};
me.prototype.setSlideMapIDAsSelected = function(t) {
  const e = this.$el[0].querySelectorAll(".swiper-slide");
  for (let n = 0; n < e.length; n++) {
    const r = e[n];
    r.getAttribute("data") == t ? r.classList.add("selected") : r.classList.remove("selected");
  }
};
var ei = Array.isArray || function(t) {
  return Object.prototype.toString.call(t) == "[object Array]";
}, vn = Ia, jd = Ii, qd = Kd, Zd = Ca, Yd = Ea, Ld = new RegExp([
  // Match escaped characters that would otherwise appear in future matches.
  // This allows the user to escape special characters that won't transform.
  "(\\\\.)",
  // Match Express-style parameters and un-named parameters with a prefix
  // and optional suffixes. Matches appear as:
  //
  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
  // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
  // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
  "([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^()])+)\\))?|\\(((?:\\\\.|[^()])+)\\))([+*?])?|(\\*))"
].join("|"), "g");
function Ii(t) {
  for (var e = [], n = 0, r = 0, i = "", s; (s = Ld.exec(t)) != null; ) {
    var a = s[0], o = s[1], l = s.index;
    if (i += t.slice(r, l), r = l + a.length, o) {
      i += o[1];
      continue;
    }
    i && (e.push(i), i = "");
    var c = s[2], d = s[3], A = s[4], u = s[5], f = s[6], h = s[7], v = f === "+" || f === "*", g = f === "?" || f === "*", C = c || "/", b = A || u || (h ? ".*" : "[^" + C + "]+?");
    e.push({
      name: d || n++,
      prefix: c || "",
      delimiter: C,
      optional: g,
      repeat: v,
      pattern: Hd(b)
    });
  }
  return r < t.length && (i += t.substr(r)), i && e.push(i), e;
}
function Kd(t) {
  return Ca(Ii(t));
}
function Ca(t) {
  for (var e = new Array(t.length), n = 0; n < t.length; n++)
    typeof t[n] == "object" && (e[n] = new RegExp("^" + t[n].pattern + "$"));
  return function(r) {
    for (var i = "", s = r || {}, a = 0; a < t.length; a++) {
      var o = t[a];
      if (typeof o == "string") {
        i += o;
        continue;
      }
      var l = s[o.name], c;
      if (l == null) {
        if (o.optional)
          continue;
        throw new TypeError('Expected "' + o.name + '" to be defined');
      }
      if (ei(l)) {
        if (!o.repeat)
          throw new TypeError('Expected "' + o.name + '" to not repeat, but received "' + l + '"');
        if (l.length === 0) {
          if (o.optional)
            continue;
          throw new TypeError('Expected "' + o.name + '" to not be empty');
        }
        for (var d = 0; d < l.length; d++) {
          if (c = encodeURIComponent(l[d]), !e[a].test(c))
            throw new TypeError('Expected all "' + o.name + '" to match "' + o.pattern + '", but received "' + c + '"');
          i += (d === 0 ? o.prefix : o.delimiter) + c;
        }
        continue;
      }
      if (c = encodeURIComponent(l), !e[a].test(c))
        throw new TypeError('Expected "' + o.name + '" to match "' + o.pattern + '", but received "' + c + '"');
      i += o.prefix + c;
    }
    return i;
  };
}
function ts(t) {
  return t.replace(/([.+*?=^!:${}()[\]|\/])/g, "\\$1");
}
function Hd(t) {
  return t.replace(/([=!:$\/()])/g, "\\$1");
}
function Mi(t, e) {
  return t.keys = e, t;
}
function ba(t) {
  return t.sensitive ? "" : "i";
}
function Xd(t, e) {
  var n = t.source.match(/\((?!\?)/g);
  if (n)
    for (var r = 0; r < n.length; r++)
      e.push({
        name: r,
        prefix: null,
        delimiter: null,
        optional: !1,
        repeat: !1,
        pattern: null
      });
  return Mi(t, e);
}
function Wd(t, e, n) {
  for (var r = [], i = 0; i < t.length; i++)
    r.push(Ia(t[i], e, n).source);
  var s = new RegExp("(?:" + r.join("|") + ")", ba(n));
  return Mi(s, e);
}
function Jd(t, e, n) {
  for (var r = Ii(t), i = Ea(r, n), s = 0; s < r.length; s++)
    typeof r[s] != "string" && e.push(r[s]);
  return Mi(i, e);
}
function Ea(t, e) {
  e = e || {};
  for (var n = e.strict, r = e.end !== !1, i = "", s = t[t.length - 1], a = typeof s == "string" && /\/$/.test(s), o = 0; o < t.length; o++) {
    var l = t[o];
    if (typeof l == "string")
      i += ts(l);
    else {
      var c = ts(l.prefix), d = l.pattern;
      l.repeat && (d += "(?:" + c + d + ")*"), l.optional ? c ? d = "(?:" + c + "(" + d + "))?" : d = "(" + d + ")?" : d = c + "(" + d + ")", i += d;
    }
  }
  return n || (i = (a ? i.slice(0, -2) : i) + "(?:\\/(?=$))?"), r ? i += "$" : i += n && a ? "" : "(?=\\/|$)", new RegExp("^" + i, ba(e));
}
function Ia(t, e, n) {
  return e = e || [], ei(e) ? n || (n = {}) : (n = e, e = []), t instanceof RegExp ? Xd(t, e) : ei(t) ? Wd(t, e, n) : Jd(t, e, n);
}
vn.parse = jd;
vn.compile = qd;
vn.tokensToFunction = Zd;
vn.tokensToRegExp = Yd;
var Bt = typeof document < "u", Ce = typeof window < "u", Jn = typeof history < "u", _d = typeof process < "u", ti = Bt && document.ontouchstart ? "touchstart" : "click", Qe = Ce && !!(window.history.location || window.location);
function _() {
  this.callbacks = [], this.exits = [], this.current = "", this.len = 0, this._decodeURLComponents = !0, this._base = "", this._strict = !1, this._running = !1, this._hashbang = !1, this.clickHandler = this.clickHandler.bind(this), this._onpopstate = this._onpopstate.bind(this);
}
_.prototype.configure = function(t) {
  var e = t || {};
  this._window = e.window || Ce && window, this._decodeURLComponents = e.decodeURLComponents !== !1, this._popstate = e.popstate !== !1 && Ce, this._click = e.click !== !1 && Bt, this._hashbang = !!e.hashbang;
  var n = this._window;
  this._popstate ? n.addEventListener("popstate", this._onpopstate, !1) : Ce && n.removeEventListener("popstate", this._onpopstate, !1), this._click ? n.document.addEventListener(ti, this.clickHandler, !1) : Bt && n.document.removeEventListener(ti, this.clickHandler, !1), this._hashbang && Ce && !Jn ? n.addEventListener("hashchange", this._onpopstate, !1) : Ce && n.removeEventListener("hashchange", this._onpopstate, !1);
};
_.prototype.base = function(t) {
  if (arguments.length === 0) return this._base;
  this._base = t;
};
_.prototype._getBase = function() {
  var t = this._base;
  if (t) return t;
  var e = Ce && this._window && this._window.location;
  return Ce && this._hashbang && e && e.protocol === "file:" && (t = e.pathname), t;
};
_.prototype.strict = function(t) {
  if (arguments.length === 0) return this._strict;
  this._strict = t;
};
_.prototype.start = function(t) {
  var e = t || {};
  if (this.configure(e), e.dispatch !== !1) {
    this._running = !0;
    var n;
    if (Qe) {
      var r = this._window, i = r.location;
      this._hashbang && ~i.hash.indexOf("#!") ? n = i.hash.substr(2) + i.search : this._hashbang ? n = i.search + i.hash : n = i.pathname + i.search + i.hash;
    }
    this.replace(n, null, !0, e.dispatch);
  }
};
_.prototype.stop = function() {
  if (this._running) {
    this.current = "", this.len = 0, this._running = !1;
    var t = this._window;
    this._click && t.document.removeEventListener(ti, this.clickHandler, !1), Ce && t.removeEventListener("popstate", this._onpopstate, !1), Ce && t.removeEventListener("hashchange", this._onpopstate, !1);
  }
};
_.prototype.show = function(t, e, n, r) {
  var i = new wn(t, e, this), s = this.prevContext;
  return this.prevContext = i, this.current = i.path, n !== !1 && this.dispatch(i, s), i.handled !== !1 && r !== !1 && i.pushState(), i;
};
_.prototype.back = function(t, e) {
  var n = this;
  if (this.len > 0) {
    var r = this._window;
    Jn && r.history.back(), this.len--;
  } else setTimeout(t ? function() {
    n.show(t, e);
  } : function() {
    n.show(n._getBase(), e);
  });
};
_.prototype.redirect = function(t, e) {
  var n = this;
  typeof t == "string" && typeof e == "string" && _n.call(this, t, function(r) {
    setTimeout(function() {
      n.replace(
        /** @type {!string} */
        e
      );
    }, 0);
  }), typeof t == "string" && typeof e > "u" && setTimeout(function() {
    n.replace(t);
  }, 0);
};
_.prototype.replace = function(t, e, n, r) {
  var i = new wn(t, e, this), s = this.prevContext;
  return this.prevContext = i, this.current = i.path, i.init = n, i.save(), r !== !1 && this.dispatch(i, s), i;
};
_.prototype.dispatch = function(t, e) {
  var n = 0, r = 0, i = this;
  function s() {
    var o = i.exits[r++];
    if (!o) return a();
    o(e, s);
  }
  function a() {
    var o = i.callbacks[n++];
    if (t.path !== i.current) {
      t.handled = !1;
      return;
    }
    if (!o) return $d.call(i, t);
    o(t, a);
  }
  e ? s() : a();
};
_.prototype.exit = function(t, e) {
  if (typeof t == "function")
    return this.exit("*", t);
  for (var n = new Cn(t, null, this), r = 1; r < arguments.length; ++r)
    this.exits.push(n.middleware(arguments[r]));
};
_.prototype.clickHandler = function(t) {
  if (this._which(t) === 1 && !(t.metaKey || t.ctrlKey || t.shiftKey) && !t.defaultPrevented) {
    var e = t.target, n = t.path || (t.composedPath ? t.composedPath() : null);
    if (n) {
      for (var r = 0; r < n.length; r++)
        if (n[r].nodeName && n[r].nodeName.toUpperCase() === "A" && n[r].href) {
          e = n[r];
          break;
        }
    }
    for (; e && e.nodeName.toUpperCase() !== "A"; ) e = e.parentNode;
    if (!(!e || e.nodeName.toUpperCase() !== "A")) {
      var i = typeof e.href == "object" && e.href.constructor.name === "SVGAnimatedString";
      if (!(e.hasAttribute("download") || e.getAttribute("rel") === "external")) {
        var s = e.getAttribute("href");
        if (!(!this._hashbang && this._samePath(e) && (e.hash || s === "#")) && !(s && s.indexOf("mailto:") > -1) && !(i ? e.target.baseVal : e.target) && !(!i && !this.sameOrigin(e.href))) {
          var a = i ? e.href.baseVal : e.pathname + e.search + (e.hash || "");
          a = a[0] !== "/" ? "/" + a : a, _d && a.match(/^\/[a-zA-Z]:\//) && (a = a.replace(/^\/[a-zA-Z]:\//, "/"));
          var o = a, l = this._getBase();
          a.indexOf(l) === 0 && (a = a.substr(l.length)), this._hashbang && (a = a.replace("#!", "")), !(l && o === a && (!Qe || this._window.location.protocol !== "file:")) && (t.preventDefault(), this.show(o));
        }
      }
    }
  }
};
_.prototype._onpopstate = function() {
  var t = !1;
  return Ce ? (Bt && document.readyState === "complete" ? t = !0 : window.addEventListener("load", function() {
    setTimeout(function() {
      t = !0;
    }, 0);
  }), function(n) {
    if (t) {
      var r = this;
      if (n.state) {
        var i = n.state.path;
        r.replace(i, n.state);
      } else if (Qe) {
        var s = r._window.location;
        r.show(s.pathname + s.search + s.hash, void 0, void 0, !1);
      }
    }
  }) : function() {
  };
}();
_.prototype._which = function(t) {
  return t = t || Ce && this._window.event, t.which == null ? t.button : t.which;
};
_.prototype._toURL = function(t) {
  var e = this._window;
  if (typeof URL == "function" && Qe)
    return new URL(t, e.location.toString());
  if (Bt) {
    var n = e.document.createElement("a");
    return n.href = t, n;
  }
};
_.prototype.sameOrigin = function(t) {
  if (!t || !Qe) return !1;
  var e = this._toURL(t), n = this._window, r = n.location;
  return r.protocol === e.protocol && r.hostname === e.hostname && (r.port === e.port || r.port === "" && (e.port == 80 || e.port == 443));
};
_.prototype._samePath = function(t) {
  if (!Qe) return !1;
  var e = this._window, n = e.location;
  return t.pathname === n.pathname && t.search === n.search;
};
_.prototype._decodeURLEncodedURIComponent = function(t) {
  return typeof t != "string" ? t : this._decodeURLComponents ? decodeURIComponent(t.replace(/\+/g, " ")) : t;
};
function Ma() {
  var t = new _();
  function e() {
    return _n.apply(t, arguments);
  }
  return e.callbacks = t.callbacks, e.exits = t.exits, e.base = t.base.bind(t), e.strict = t.strict.bind(t), e.start = t.start.bind(t), e.stop = t.stop.bind(t), e.show = t.show.bind(t), e.back = t.back.bind(t), e.redirect = t.redirect.bind(t), e.replace = t.replace.bind(t), e.dispatch = t.dispatch.bind(t), e.exit = t.exit.bind(t), e.configure = t.configure.bind(t), e.sameOrigin = t.sameOrigin.bind(t), e.clickHandler = t.clickHandler.bind(t), e.create = Ma, Object.defineProperty(e, "len", {
    get: function() {
      return t.len;
    },
    set: function(n) {
      t.len = n;
    }
  }), Object.defineProperty(e, "current", {
    get: function() {
      return t.current;
    },
    set: function(n) {
      t.current = n;
    }
  }), e.Context = wn, e.Route = Cn, e;
}
function _n(t, e) {
  if (typeof t == "function")
    return _n.call(this, "*", t);
  if (typeof e == "function")
    for (var n = new Cn(
      /** @type {string} */
      t,
      null,
      this
    ), r = 1; r < arguments.length; ++r)
      this.callbacks.push(n.middleware(arguments[r]));
  else typeof t == "string" ? this[typeof e == "string" ? "redirect" : "show"](t, e) : this.start(t);
}
function $d(t) {
  if (!t.handled) {
    var e, n = this, r = n._window;
    n._hashbang ? e = Qe && this._getBase() + r.location.hash.replace("#!", "") : e = Qe && r.location.pathname + r.location.search, e !== t.canonicalPath && (n.stop(), t.handled = !1, Qe && (r.location.href = t.canonicalPath));
  }
}
function eA(t) {
  return t.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
function wn(t, e, n) {
  var r = this.page = n || _n, i = r._window, s = r._hashbang, a = r._getBase();
  t[0] === "/" && t.indexOf(a) !== 0 && (t = a + (s ? "#!" : "") + t);
  var o = t.indexOf("?");
  this.canonicalPath = t;
  var l = new RegExp("^" + eA(a));
  if (this.path = t.replace(l, "") || "/", s && (this.path = this.path.replace("#!", "") || "/"), this.title = Bt && i.document.title, this.state = e || {}, this.state.path = t, this.querystring = ~o ? r._decodeURLEncodedURIComponent(t.slice(o + 1)) : "", this.pathname = r._decodeURLEncodedURIComponent(~o ? t.slice(0, o) : t), this.params = {}, this.hash = "", !s) {
    if (!~this.path.indexOf("#")) return;
    var c = this.path.split("#");
    this.path = this.pathname = c[0], this.hash = r._decodeURLEncodedURIComponent(c[1]) || "", this.querystring = this.querystring.split("#")[0];
  }
}
wn.prototype.pushState = function() {
  var t = this.page, e = t._window, n = t._hashbang;
  t.len++, Jn && e.history.pushState(
    this.state,
    this.title,
    n && this.path !== "/" ? "#!" + this.path : this.canonicalPath
  );
};
wn.prototype.save = function() {
  var t = this.page;
  Jn && t._window.history.replaceState(
    this.state,
    this.title,
    t._hashbang && this.path !== "/" ? "#!" + this.path : this.canonicalPath
  );
};
function Cn(t, e, n) {
  var r = this.page = n || yi, i = e || {};
  i.strict = i.strict || r._strict, this.path = t === "*" ? "(.*)" : t, this.method = "GET", this.regexp = vn(this.path, this.keys = [], i);
}
Cn.prototype.middleware = function(t) {
  var e = this;
  return function(n, r) {
    if (e.match(n.path, n.params))
      return n.routePath = e.path, t(n, r);
    r();
  };
};
Cn.prototype.match = function(t, e) {
  var n = this.keys, r = t.indexOf("?"), i = ~r ? t.slice(0, r) : t, s = this.regexp.exec(decodeURIComponent(i));
  if (!s) return !1;
  delete e[0];
  for (var a = 1, o = s.length; a < o; ++a) {
    var l = n[a - 1], c = this.page._decodeURLEncodedURIComponent(s[a]);
    (c !== void 0 || !hasOwnProperty.call(e, l.name)) && (e[l.name] = c);
  }
  return !0;
};
var yi = Ma(), Kt = yi, tA = yi;
Kt.default = tA;
const ya = "aria-describedby", Yn = "aria-expanded", bn = "aria-hidden", $n = "aria-modal", ns = "aria-pressed", Vr = "aria-selected", xi = "focus", Vi = "focusin", xa = "focusout", er = "keydown", nA = "keyup", $ = "click", Va = "mousedown", rA = "hover", tr = "mouseenter", Ri = "mouseleave", Ra = "pointerdown", iA = "pointermove", sA = "pointerup", nr = "touchstart", aA = "dragstart", oA = 'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"]', ni = "ArrowDown", ri = "ArrowUp", rs = "ArrowLeft", is = "ArrowRight", Si = "Escape", lA = "transitionDuration", cA = "transitionDelay", Rr = "transitionend", Sa = "transitionProperty", Ta = () => {
  var e;
  const t = /iPhone|iPad|iPod|Android/i;
  return ((e = navigator == null ? void 0 : navigator.userAgentData) == null ? void 0 : e.brands.some(
    (n) => t.test(n.brand)
  )) || t.test(navigator == null ? void 0 : navigator.userAgent) || !1;
}, dA = () => {
  var e;
  const t = /(iPhone|iPod|iPad)/;
  return ((e = navigator == null ? void 0 : navigator.userAgentData) == null ? void 0 : e.brands.some(
    (n) => t.test(n.brand)
  )) || t.test(
    navigator == null ? void 0 : navigator.userAgent
  ) || !1;
}, Ln = () => {
}, AA = (t, e, n, r) => {
  t.addEventListener(
    e,
    n,
    !1
  );
}, uA = (t, e, n, r) => {
  t.removeEventListener(
    e,
    n,
    !1
  );
}, Ee = (t, e) => t.getAttribute(e), cn = (t, e) => t.hasAttribute(e), ne = (t, e, n) => t.setAttribute(e, n), Ct = (t, e) => t.removeAttribute(e), R = (t, ...e) => {
  t.classList.add(...e);
}, G = (t, ...e) => {
  t.classList.remove(...e);
}, S = (t, e) => t.classList.contains(e), En = (t) => t != null && typeof t == "object" || !1, W = (t) => En(t) && typeof t.nodeType == "number" && [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].some(
  (e) => t.nodeType === e
) || !1, fe = (t) => W(t) && t.nodeType === 1 || !1, St = /* @__PURE__ */ new Map(), Pt = {
  data: St,
  set: (t, e, n) => {
    fe(t) && (St.has(e) || St.set(e, /* @__PURE__ */ new Map()), St.get(e).set(t, n));
  },
  getAllFor: (t) => St.get(t) || null,
  get: (t, e) => {
    if (!fe(t) || !e) return null;
    const n = Pt.getAllFor(e);
    return t && n && n.get(t) || null;
  },
  remove: (t, e) => {
    const n = Pt.getAllFor(e);
    !n || !fe(t) || (n.delete(t), n.size === 0 && St.delete(e));
  }
}, Ae = (t, e) => Pt.get(t, e), ss = (t) => t == null ? void 0 : t.trim().replace(
  /(?:^\w|[A-Z]|\b\w)/g,
  (e, n) => n === 0 ? e.toLowerCase() : e.toUpperCase()
).replace(/\s+/g, ""), In = (t) => typeof t == "string" || !1, za = (t) => En(t) && t.constructor.name === "Window" || !1, Pa = (t) => W(t) && t.nodeType === 9 || !1, N = (t) => Pa(t) ? t : W(t) ? t.ownerDocument : za(t) ? t.document : globalThis.document, qe = (t, ...e) => Object.assign(t, ...e), et = (t) => {
  if (!t) return;
  if (In(t))
    return N().createElement(t);
  const { tagName: e } = t, n = et(e);
  if (!n) return;
  const r = { ...t };
  return delete r.tagName, qe(n, r);
}, k = (t, e) => t.dispatchEvent(e), de = (t, e, n) => {
  const r = getComputedStyle(t, n), i = e.replace("webkit", "Webkit").replace(/([A-Z])/g, "-$1").toLowerCase();
  return r.getPropertyValue(i);
}, fA = (t) => {
  const e = de(t, Sa), n = de(t, cA), r = n.includes("ms") ? 1 : 1e3, i = e && e !== "none" ? parseFloat(n) * r : 0;
  return Number.isNaN(i) ? 0 : i;
}, Mn = (t) => {
  const e = de(t, Sa), n = de(t, lA), r = n.includes("ms") ? 1 : 1e3, i = e && e !== "none" ? parseFloat(n) * r : 0;
  return Number.isNaN(i) ? 0 : i;
}, L = (t, e) => {
  let n = 0;
  const r = new Event(Rr), i = Mn(t), s = fA(t);
  if (i) {
    const a = (o) => {
      o.target === t && (e.apply(t, [o]), t.removeEventListener(Rr, a), n = 1);
    };
    t.addEventListener(Rr, a), setTimeout(() => {
      n || k(t, r);
    }, i + s + 17);
  } else
    e.apply(t, [r]);
}, Ze = (t, e) => t.focus(e), as = (t) => ["true", !0].includes(t) ? !0 : ["false", !1].includes(t) ? !1 : ["null", "", null, void 0].includes(t) ? null : t !== "" && !Number.isNaN(+t) ? +t : t, Fn = (t) => Object.entries(t), pA = (t, e, n, r) => {
  if (!fe(t)) return e;
  const i = { ...n }, s = { ...t.dataset }, a = { ...e }, o = {}, l = "title";
  return Fn(s).forEach(([c, d]) => {
    const A = typeof c == "string" && c.includes(r) ? ss(c.replace(r, "")) : ss(c);
    o[A] = as(d);
  }), Fn(i).forEach(([c, d]) => {
    i[c] = as(d);
  }), Fn(e).forEach(([c, d]) => {
    c in i ? a[c] = i[c] : c in o ? a[c] = o[c] : a[c] = c === l ? Ee(t, l) : d;
  }), a;
}, os = (t) => Object.keys(t), O = (t, e) => {
  const n = new CustomEvent(t, {
    cancelable: !0,
    bubbles: !0
  });
  return En(e) && qe(n, e), n;
}, dn = { passive: !0 }, Mt = (t) => t.offsetHeight, K = (t, e) => {
  Fn(e).forEach(([n, r]) => {
    if (r && In(n) && n.includes("--"))
      t.style.setProperty(n, r);
    else {
      const i = {};
      i[n] = r, qe(t.style, i);
    }
  });
}, ii = (t) => En(t) && t.constructor.name === "Map" || !1, hA = (t) => typeof t == "number" || !1, Je = /* @__PURE__ */ new Map(), z = {
  set: (t, e, n, r) => {
    fe(t) && (r && r.length ? (Je.has(t) || Je.set(t, /* @__PURE__ */ new Map()), Je.get(t).set(r, setTimeout(e, n))) : Je.set(t, setTimeout(e, n)));
  },
  get: (t, e) => {
    if (!fe(t)) return null;
    const n = Je.get(t);
    return e && n && ii(n) ? n.get(e) || null : hA(n) ? n : null;
  },
  clear: (t, e) => {
    if (!fe(t)) return;
    const n = Je.get(t);
    e && e.length && ii(n) ? (clearTimeout(n.get(e)), n.delete(e), n.size === 0 && Je.delete(t)) : (clearTimeout(n), Je.delete(t));
  }
}, An = (t) => t.toLowerCase(), be = (t, e) => (W(e) ? e : N()).querySelectorAll(t), Ti = /* @__PURE__ */ new Map();
function Da(t) {
  const { shiftKey: e, code: n } = t, r = N(this), i = [
    ...be(oA, this)
  ].filter(
    (o) => !cn(o, "disabled") && !Ee(o, bn)
  );
  if (!i.length) return;
  const s = i[0], a = i[i.length - 1];
  n === "Tab" && (e && r.activeElement === s ? (a.focus(), t.preventDefault()) : !e && r.activeElement === a && (s.focus(), t.preventDefault()));
}
const zi = (t) => Ti.has(t) === !0, gA = (t) => {
  zi(t) || (AA(t, "keydown", Da), Ti.set(t, !0));
}, mA = (t) => {
  zi(t) && (uA(t, "keydown", Da), Ti.delete(t));
}, rr = (t) => {
  zi(t) ? mA(t) : gA(t);
}, X = (t) => fe(t) && "offsetWidth" in t || !1, bt = (t, e) => {
  const { width: n, height: r, top: i, right: s, bottom: a, left: o } = t.getBoundingClientRect();
  let l = 1, c = 1;
  if (e && X(t)) {
    const { offsetWidth: d, offsetHeight: A } = t;
    l = d > 0 ? Math.round(n) / d : 1, c = A > 0 ? Math.round(r) / A : 1;
  }
  return {
    width: n / l,
    height: r / c,
    top: i / c,
    right: s / l,
    bottom: a / c,
    left: o / l,
    x: o / l,
    y: i / c
  };
}, yt = (t) => N(t).body, Ye = (t) => N(t).documentElement, vA = (t) => {
  const e = za(t), n = e ? t.scrollX : t.scrollLeft, r = e ? t.scrollY : t.scrollTop;
  return { x: n, y: r };
}, Ba = (t) => W(t) && t.constructor.name === "ShadowRoot" || !1, wA = (t) => t.nodeName === "HTML" ? t : fe(t) && t.assignedSlot || W(t) && t.parentNode || Ba(t) && t.host || Ye(t), Ga = (t) => {
  var e;
  return t ? Pa(t) ? t.defaultView : W(t) ? (e = t == null ? void 0 : t.ownerDocument) == null ? void 0 : e.defaultView : t : window;
}, CA = (t) => W(t) && ["TABLE", "TD", "TH"].includes(t.nodeName) || !1, ka = (t, e) => t.matches(e), bA = (t) => {
  if (!X(t)) return !1;
  const { width: e, height: n } = bt(t), { offsetWidth: r, offsetHeight: i } = t;
  return Math.round(e) !== r || Math.round(n) !== i;
}, EA = (t, e, n) => {
  const r = X(e), i = bt(
    t,
    r && bA(e)
  ), s = { x: 0, y: 0 };
  if (r) {
    const a = bt(e, !0);
    s.x = a.x + e.clientLeft, s.y = a.y + e.clientTop;
  }
  return {
    x: i.left + n.x - s.x,
    y: i.top + n.y - s.y,
    width: i.width,
    height: i.height
  };
};
let ls = 0, cs = 0;
const Tt = /* @__PURE__ */ new Map(), Na = (t, e) => {
  let n = e ? ls : cs;
  if (e) {
    const r = Na(t), i = Tt.get(r) || /* @__PURE__ */ new Map();
    Tt.has(r) || Tt.set(r, i), ii(i) && !i.has(e) ? (i.set(e, n), ls += 1) : n = i.get(e);
  } else {
    const r = t.id || t;
    Tt.has(r) ? n = Tt.get(r) : (Tt.set(r, n), cs += 1);
  }
  return n;
}, IA = (t) => Array.isArray(t) || !1, Oa = (t) => {
  if (!W(t)) return !1;
  const { top: e, bottom: n } = bt(t), { clientHeight: r } = Ye(t);
  return e <= r && n >= 0;
}, Fa = (t) => typeof t == "function" || !1, MA = (t) => En(t) && t.constructor.name === "NodeList" || !1, at = (t) => Ye(t).dir === "rtl", le = (t, e) => !t || !e ? null : t.closest(e) || le(t.getRootNode().host, e) || null, Y = (t, e) => fe(t) ? t : (fe(e) ? e : N()).querySelector(t), Pi = (t, e) => (W(e) ? e : N()).getElementsByTagName(
  t
), yA = (t, e) => N(e).getElementById(t), Ue = (t, e) => (e && W(e) ? e : N()).getElementsByClassName(
  t
), Dt = {}, Ua = (t) => {
  const { type: e, currentTarget: n } = t;
  Dt[e].forEach((r, i) => {
    n === i && r.forEach((s, a) => {
      a.apply(i, [t]), typeof s == "object" && s.once && ie(i, e, a, s);
    });
  });
}, re = (t, e, n, r) => {
  Dt[e] || (Dt[e] = /* @__PURE__ */ new Map());
  const i = Dt[e];
  i.has(t) || i.set(t, /* @__PURE__ */ new Map());
  const s = i.get(
    t
  ), { size: a } = s;
  s.set(n, r), a || t.addEventListener(
    e,
    Ua,
    r
  );
}, ie = (t, e, n, r) => {
  const i = Dt[e], s = i && i.get(t), a = s && s.get(n), o = a !== void 0 ? a : r;
  s && s.has(n) && s.delete(n), i && (!s || !s.size) && i.delete(t), (!i || !i.size) && delete Dt[e], (!s || !s.size) && t.removeEventListener(
    e,
    Ua,
    o
  );
}, ae = "fade", P = "show", ir = "data-bs-dismiss", sr = "alert", Qa = "Alert", De = (t) => S(t, "disabled") || Ee(t, "disabled") === "true", xA = "5.1.6", VA = xA;
class Pe {
  constructor(e, n) {
    m(this, "_toggleEventListeners", () => {
    });
    let r;
    try {
      if (fe(e))
        r = e;
      else if (In(e)) {
        if (r = Y(e), !r) throw Error(`"${e}" is not a valid selector.`);
      } else
        throw Error("your target is not an instance of HTMLElement.");
    } catch (s) {
      throw Error(`${this.name} Error: ${s.message}`);
    }
    const i = Pt.get(r, this.name);
    i && i._toggleEventListeners(), this.element = r, this.options = this.defaults && os(this.defaults).length ? pA(r, this.defaults, n || {}, "bs") : {}, Pt.set(r, this.name, this);
  }
  get version() {
    return VA;
  }
  get name() {
    return "BaseComponent";
  }
  get defaults() {
    return {};
  }
  dispose() {
    Pt.remove(this.element, this.name), os(this).forEach((e) => {
      delete this[e];
    });
  }
}
const RA = `.${sr}`, SA = `[${ir}="${sr}"]`, TA = (t) => Ae(t, Qa), zA = (t) => new _t(t), ds = O(
  `close.bs.${sr}`
), PA = O(
  `closed.bs.${sr}`
), As = (t) => {
  const { element: e } = t;
  k(e, PA), t._toggleEventListeners(), t.dispose(), e.remove();
};
class _t extends Pe {
  constructor(n) {
    super(n);
    m(this, "dismiss");
    m(this, "close", (n) => {
      const { element: r, dismiss: i } = this;
      !r || !S(r, P) || n && i && De(i) || (k(r, ds), !ds.defaultPrevented && (G(r, P), S(r, ae) ? L(r, () => As(this)) : As(this)));
    });
    m(this, "_toggleEventListeners", (n) => {
      const r = n ? re : ie, { dismiss: i, close: s } = this;
      i && r(i, $, s);
    });
    this.dismiss = Y(
      SA,
      this.element
    ), this._toggleEventListeners(!0);
  }
  get name() {
    return Qa;
  }
  dispose() {
    this._toggleEventListeners(), super.dispose();
  }
}
m(_t, "selector", RA), m(_t, "init", zA), m(_t, "getInstance", TA);
const j = "active", Be = "data-bs-toggle", DA = "button", ja = "Button", BA = `[${Be}="${DA}"]`, GA = (t) => Ae(t, ja), kA = (t) => new $t(t);
class $t extends Pe {
  constructor(n) {
    super(n);
    m(this, "toggle", (n) => {
      n && n.preventDefault();
      const { element: r, isActive: i } = this;
      De(r) || ((i ? G : R)(r, j), ne(r, ns, i ? "false" : "true"), this.isActive = S(r, j));
    });
    m(this, "_toggleEventListeners", (n) => {
      (n ? re : ie)(this.element, $, this.toggle);
    });
    const { element: r } = this;
    this.isActive = S(r, j), ne(r, ns, String(!!this.isActive)), this._toggleEventListeners(!0);
  }
  get name() {
    return ja;
  }
  dispose() {
    this._toggleEventListeners(), super.dispose();
  }
}
m($t, "selector", BA), m($t, "init", kA), m($t, "getInstance", GA);
const si = "data-bs-target", mt = "carousel", qa = "Carousel", us = "data-bs-parent", NA = "data-bs-container", pe = (t) => {
  const e = [si, us, NA, "href"], n = N(t);
  return e.map((r) => {
    const i = Ee(t, r);
    return i ? r === us ? le(t, i) : Y(i, n) : null;
  }).filter((r) => r)[0];
}, yn = `[data-bs-ride="${mt}"]`, Te = `${mt}-item`, ai = "data-bs-slide-to", $e = "data-bs-slide", tt = "paused", OA = Ta() ? nr : Ra;
console.log({ isMobile: Ta(), touchEvent: OA });
const fs = {
  pause: "hover",
  keyboard: !1,
  touch: !0,
  interval: 5e3
}, Le = (t) => Ae(t, qa), FA = (t) => new en(t);
let Ht = 0, Un = 0, Sr = 0;
const Tr = O(`slide.bs.${mt}`), oi = O(`slid.bs.${mt}`), ps = (t) => {
  const { index: e, direction: n, element: r, slides: i, options: s } = t;
  if (t.isAnimating) {
    const a = li(t), o = n === "left" ? "next" : "prev", l = n === "left" ? "start" : "end";
    R(i[e], j), G(i[e], `${Te}-${o}`), G(i[e], `${Te}-${l}`), G(i[a], j), G(i[a], `${Te}-${l}`), k(r, oi), z.clear(r, $e), t.cycle && !N(r).hidden && s.interval && !t.isPaused && t.cycle();
  }
};
function UA() {
  const t = Le(this);
  t && !t.isPaused && !z.get(this, tt) && R(this, tt);
}
function QA() {
  const t = Le(this);
  t && t.isPaused && !z.get(this, tt) && t.cycle();
}
function jA(t) {
  t.preventDefault();
  const e = le(this, yn) || pe(this), n = e && Le(e);
  if (De(this) || !n || n.isAnimating) return;
  const r = +(Ee(this, ai) || 0);
  this && !S(this, j) && !Number.isNaN(r) && n.to(r);
}
function qA(t) {
  t.preventDefault();
  const e = le(this, yn) || pe(this), n = e && Le(e);
  if (De(this) || !n || n.isAnimating) return;
  const r = Ee(this, $e);
  r === "next" ? n.next() : r === "prev" && n.prev();
}
const ZA = ({ code: t, target: e }) => {
  const n = N(e), [r] = [...be(yn, n)].filter((a) => Oa(a)), i = Le(r);
  if (!i || i.isAnimating || /textarea|input|select/i.test(e.nodeName)) return;
  const s = at(r);
  t === (s ? is : rs) ? i.prev() : t === (s ? rs : is) && i.next();
};
function hs(t) {
  const { target: e } = t, n = Le(this);
  n && n.isTouch && !n.controls.includes(e) && !n.controls.includes(e == null ? void 0 : e.parentElement) && (!n.indicator || !n.indicator.contains(e)) && t.preventDefault();
}
function YA(t) {
  const { target: e } = t, n = Le(this);
  if (!n || n.isAnimating || n.isTouch) return;
  const { controls: r, indicator: i } = n;
  ![...r, i].every(
    (s) => s && (s === e || s.contains(e))
  ) && this.contains(e) && (Ht = t.pageX, n.isTouch = !0, Za(n, !0));
}
const LA = (t) => {
  Un = t.pageX;
}, KA = (t) => {
  var o;
  const { target: e } = t, n = N(e), r = [...be(yn, n)].map((l) => Le(l)).find((l) => l.isTouch);
  if (!r) return;
  const { element: i, index: s } = r, a = at(i);
  Sr = t.pageX, r.isTouch = !1, Za(r), !((o = n.getSelection()) != null && o.toString().length) && i.contains(e) && Math.abs(Ht - Sr) > 120 && (Un < Ht ? r.to(s + (a ? -1 : 1)) : Un > Ht && r.to(s + (a ? 1 : -1))), Ht = 0, Un = 0, Sr = 0;
}, zr = (t, e) => {
  const { indicators: n } = t;
  [...n].forEach((r) => G(r, j)), t.indicators[e] && R(n[e], j);
}, Za = (t, e) => {
  const { element: n } = t, r = e ? re : ie;
  r(
    N(n),
    iA,
    LA,
    dn
  ), r(
    N(n),
    sA,
    KA,
    dn
  );
}, li = (t) => {
  const { slides: e, element: n } = t, r = Y(
    `.${Te}.${j}`,
    n
  );
  return r ? [...e].indexOf(r) : -1;
};
class en extends Pe {
  constructor(n, r) {
    super(n, r);
    m(this, "_toggleEventListeners", (n) => {
      const { element: r, options: i, slides: s, controls: a, indicators: o } = this, { touch: l, pause: c, interval: d, keyboard: A } = i, u = n ? re : ie;
      c && d && (u(r, tr, UA), u(r, Ri, QA)), l && s.length > 2 && (u(
        r,
        Ra,
        YA,
        dn
      ), u(r, nr, hs, { passive: !1 }), u(r, aA, hs, { passive: !1 })), a.length && a.forEach((f) => {
        u(f, $, qA);
      }), o.length && o.forEach((f) => {
        u(f, $, jA);
      }), A && u(N(r), er, ZA);
    });
    const { element: i } = this;
    this.direction = at(i) ? "right" : "left", this.isTouch = !1, this.slides = Ue(Te, i);
    const { slides: s } = this;
    if (s.length < 2) return;
    const a = li(this), o = [...s].find(
      (d) => ka(d, `.${Te}-next`)
    );
    this.index = a;
    const l = N(i);
    this.controls = [
      ...be(`[${$e}]`, i),
      ...be(
        `[${$e}][${si}="#${i.id}"]`,
        l
      )
    ].filter((d, A, u) => A === u.indexOf(d)), this.indicator = Y(
      `.${mt}-indicators`,
      i
    ), this.indicators = [
      ...this.indicator ? be(`[${ai}]`, this.indicator) : [],
      ...be(
        `[${ai}][${si}="#${i.id}"]`,
        l
      )
    ].filter((d, A, u) => A === u.indexOf(d));
    const { options: c } = this;
    this.options.interval = c.interval === !0 ? fs.interval : c.interval, o ? this.index = [...s].indexOf(o) : a < 0 && (this.index = 0, R(s[0], j), this.indicators.length && zr(this, 0)), this.indicators.length && zr(this, this.index), this._toggleEventListeners(!0), c.interval && this.cycle();
  }
  get name() {
    return qa;
  }
  get defaults() {
    return fs;
  }
  get isPaused() {
    return S(this.element, tt);
  }
  get isAnimating() {
    return Y(
      `.${Te}-next,.${Te}-prev`,
      this.element
    ) !== null;
  }
  cycle() {
    const { element: n, options: r, isPaused: i, index: s } = this;
    z.clear(n, mt), i && (z.clear(n, tt), G(n, tt)), z.set(
      n,
      () => {
        this.element && !this.isPaused && !this.isTouch && Oa(n) && this.to(s + 1);
      },
      r.interval,
      mt
    );
  }
  pause() {
    const { element: n, options: r } = this;
    this.isPaused || !r.interval || (R(n, tt), z.set(
      n,
      () => {
      },
      1,
      tt
    ));
  }
  next() {
    this.isAnimating || this.to(this.index + 1);
  }
  prev() {
    this.isAnimating || this.to(this.index - 1);
  }
  to(n) {
    const { element: r, slides: i, options: s } = this, a = li(this), o = at(r);
    let l = n;
    if (this.isAnimating || a === l || z.get(r, $e)) return;
    a < l || a === 0 && l === i.length - 1 ? this.direction = o ? "right" : "left" : (a > l || a === i.length - 1 && l === 0) && (this.direction = o ? "left" : "right");
    const { direction: c } = this;
    l < 0 ? l = i.length - 1 : l >= i.length && (l = 0);
    const d = c === "left" ? "next" : "prev", A = c === "left" ? "start" : "end", u = {
      relatedTarget: i[l],
      from: a,
      to: l,
      direction: c
    };
    qe(Tr, u), qe(oi, u), k(r, Tr), !Tr.defaultPrevented && (this.index = l, zr(this, l), Mn(i[l]) && S(r, "slide") ? z.set(
      r,
      () => {
        R(i[l], `${Te}-${d}`), Mt(i[l]), R(i[l], `${Te}-${A}`), R(i[a], `${Te}-${A}`), L(
          i[l],
          () => this.slides && this.slides.length && ps(this)
        );
      },
      0,
      $e
    ) : (R(i[l], j), G(i[a], j), z.set(
      r,
      () => {
        z.clear(r, $e), r && s.interval && !this.isPaused && this.cycle(), k(r, oi);
      },
      0,
      $e
    )));
  }
  dispose() {
    const { isAnimating: n } = this, r = {
      ...this,
      isAnimating: n
    };
    this._toggleEventListeners(), super.dispose(), r.isAnimating && L(r.slides[r.index], () => {
      ps(r);
    });
  }
}
m(en, "selector", yn), m(en, "init", FA), m(en, "getInstance", Le);
const Et = "collapsing", ue = "collapse", Ya = "Collapse", HA = `.${ue}`, La = `[${Be}="${ue}"]`, XA = { parent: null }, Qn = (t) => Ae(t, Ya), WA = (t) => new tn(t), gs = O(`show.bs.${ue}`), JA = O(`shown.bs.${ue}`), ms = O(`hide.bs.${ue}`), _A = O(`hidden.bs.${ue}`), $A = (t) => {
  const { element: e, parent: n, triggers: r } = t;
  k(e, gs), gs.defaultPrevented || (z.set(e, Ln, 17), n && z.set(n, Ln, 17), R(e, Et), G(e, ue), K(e, { height: `${e.scrollHeight}px` }), L(e, () => {
    z.clear(e), n && z.clear(n), r.forEach((i) => ne(i, Yn, "true")), G(e, Et), R(e, ue), R(e, P), K(e, { height: "" }), k(e, JA);
  }));
}, vs = (t) => {
  const { element: e, parent: n, triggers: r } = t;
  k(e, ms), ms.defaultPrevented || (z.set(e, Ln, 17), n && z.set(n, Ln, 17), K(e, { height: `${e.scrollHeight}px` }), G(e, ue), G(e, P), R(e, Et), Mt(e), K(e, { height: "0px" }), L(e, () => {
    z.clear(e), n && z.clear(n), r.forEach((i) => ne(i, Yn, "false")), G(e, Et), R(e, ue), K(e, { height: "" }), k(e, _A);
  }));
}, eu = (t) => {
  const { target: e } = t, n = e && le(e, La), r = n && pe(n), i = r && Qn(r);
  n && De(n) || i && (i.toggle(), (n == null ? void 0 : n.tagName) === "A" && t.preventDefault());
};
class tn extends Pe {
  constructor(n, r) {
    super(n, r);
    m(this, "_toggleEventListeners", (n) => {
      const r = n ? re : ie, { triggers: i } = this;
      i.length && i.forEach((s) => {
        r(s, $, eu);
      });
    });
    const { element: i, options: s } = this, a = N(i);
    this.triggers = [...be(La, a)].filter(
      (o) => pe(o) === i
    ), this.parent = X(s.parent) ? s.parent : In(s.parent) ? pe(i) || Y(s.parent, a) : null, this._toggleEventListeners(!0);
  }
  get name() {
    return Ya;
  }
  get defaults() {
    return XA;
  }
  hide() {
    const { triggers: n, element: r } = this;
    z.get(r) || (vs(this), n.length && n.forEach((i) => R(i, `${ue}d`)));
  }
  show() {
    const { element: n, parent: r, triggers: i } = this;
    let s, a;
    r && (s = [
      ...be(`.${ue}.${P}`, r)
    ].find((o) => Qn(o)), a = s && Qn(s)), (!r || !z.get(r)) && !z.get(n) && (a && s !== n && (vs(a), a.triggers.forEach((o) => {
      R(o, `${ue}d`);
    })), $A(this), i.length && i.forEach((o) => G(o, `${ue}d`)));
  }
  toggle() {
    S(this.element, P) ? this.hide() : this.show();
  }
  dispose() {
    this._toggleEventListeners(), super.dispose();
  }
}
m(tn, "selector", HA), m(tn, "init", WA), m(tn, "getInstance", Qn);
var tu = "1.1.0";
const nu = [
  "all",
  "intersecting",
  "update"
], ws = "PositionObserver Error";
var Yr, Di = (Yr = class {
  /**
  * The constructor takes two arguments, a `callback`, which is called
  * whenever the position of an observed element changes and an `options` object.
  * The callback function takes an array of `PositionObserverEntry` objects
  * as its first argument and the PositionObserver instance as its second argument.
  *
  * @param callback the callback that applies to all targets of this observer
  * @param options the options of this observer
  */
  constructor(t, e) {
    m(this, "entries");
    /** `PositionObserver.tick` */
    m(this, "_t");
    /** `PositionObserver.root` */
    m(this, "_r");
    /** `PositionObserver.callbackMode` */
    m(this, "_cm");
    /** `PositionObserver.root.clientWidth` */
    m(this, "_w");
    /** `PositionObserver.root.clientHeight` */
    m(this, "_h");
    /** `IntersectionObserver.options.rootMargin` */
    m(this, "_rm");
    /** `IntersectionObserver.options.threshold` */
    m(this, "_th");
    /** `PositionObserver.callback` */
    m(this, "_c");
    /**
    * Start observing the position of the specified element.
    * If the element is not currently attached to the DOM,
    * it will NOT be added to the entries.
    *
    * @param target an `Element` target
    */
    m(this, "observe", (t) => {
      if (!fe(t)) throw new Error(`${ws}: ${t} is not an instance of Element.`);
      this._r.contains(t) && this._n(t).then((e) => {
        e.boundingClientRect && !this.getEntry(t) && this.entries.set(t, e), this._t || (this._t = requestAnimationFrame(this._rc));
      });
    });
    /**
    * Stop observing the position of the specified element.
    *
    * @param target an `Element` target
    */
    m(this, "unobserve", (t) => {
      this.entries.has(t) && this.entries.delete(t);
    });
    /**
    * Private method responsible for all the heavy duty,
    * the observer's runtime.
    * `PositionObserver.runCallback`
    */
    m(this, "_rc", () => {
      if (!this.entries.size) {
        this._t = 0;
        return;
      }
      const { clientWidth: t, clientHeight: e } = this._r, n = new Promise((r) => {
        const i = [];
        this.entries.forEach(({ target: s, boundingClientRect: a, isIntersecting: o }) => {
          this._r.contains(s) && this._n(s).then((l) => {
            if (!l.isIntersecting) {
              if (this._cm === 1) return;
              if (this._cm === 2) {
                o && (this.entries.set(s, l), i.push(l));
                return;
              }
            }
            const { left: c, top: d } = l.boundingClientRect;
            (a.top !== d || a.left !== c || this._w !== t || this._h !== e) && (this.entries.set(s, l), i.push(l));
          });
        }), this._w = t, this._h = e, r(i);
      });
      this._t = requestAnimationFrame(async () => {
        const r = await n;
        r.length && this._c(r, this), this._rc();
      });
    });
    /**
    * Check intersection status and resolve it
    * right away.
    *
    * `PositionObserver.newEntryForTarget`
    *
    * @param target an `Element` target
    */
    m(this, "_n", (t) => new Promise((e) => {
      new IntersectionObserver(([n], r) => {
        r.disconnect(), e(n);
      }, {
        threshold: this._th,
        rootMargin: this._rm
      }).observe(t);
    }));
    /**
    * Find the entry for a given target.
    *
    * @param target an `HTMLElement` target
    */
    m(this, "getEntry", (t) => this.entries.get(t));
    /**
    * Immediately stop observing all elements.
    */
    m(this, "disconnect", () => {
      cancelAnimationFrame(this._t), this.entries.clear(), this._t = 0;
    });
    if (!Fa(t)) throw new Error(`${ws}: ${t} is not a function.`);
    this.entries = /* @__PURE__ */ new Map(), this._c = t, this._t = 0;
    const n = fe(e == null ? void 0 : e.root) ? e.root : document == null ? void 0 : document.documentElement;
    this._r = n, this._rm = e == null ? void 0 : e.rootMargin, this._th = e == null ? void 0 : e.threshold, this._cm = nu.indexOf((e == null ? void 0 : e.callbackMode) || "intersecting"), this._w = n.clientWidth, this._h = n.clientHeight;
  }
}, m(Yr, "version", tu), Yr);
const It = ["dropdown", "dropup", "dropstart", "dropend"], Ka = "Dropdown", Ha = "dropdown-menu", Xa = (t) => {
  var n, r;
  const e = le(t, "A");
  return t.tagName === "A" && cn(t, "href") && ((n = Ee(t, "href")) == null ? void 0 : n.slice(-1)) === "#" || e && cn(e, "href") && ((r = Ee(e, "href")) == null ? void 0 : r.slice(-1)) === "#";
}, [ze, ci, di, Ai] = It, ru = `[${Be}="${ze}"]`, un = (t) => Ae(t, Ka), iu = (t) => new nn(t), su = `${Ha}-end`, Cs = [ze, ci], bs = [di, Ai], Es = ["A", "BUTTON"], au = {
  offset: 5,
  display: "dynamic"
}, Pr = O(
  `show.bs.${ze}`
), Is = O(
  `shown.bs.${ze}`
), Dr = O(
  `hide.bs.${ze}`
), Ms = O(`hidden.bs.${ze}`), Wa = O(`updated.bs.${ze}`), ys = (t) => {
  const { element: e, menu: n, parentElement: r, options: i } = t, { offset: s } = i;
  if (de(n, "position") === "static") return;
  const a = at(e), o = S(n, su);
  ["margin", "top", "bottom", "left", "right"].forEach((B) => {
    const F = {};
    F[B] = "", K(n, F);
  });
  let l = It.find((B) => S(r, B)) || ze;
  const c = {
    dropdown: [s, 0, 0],
    dropup: [0, 0, s],
    dropstart: a ? [-1, 0, 0, s] : [-1, s, 0],
    dropend: a ? [-1, s, 0] : [-1, 0, 0, s]
  }, d = {
    dropdown: { top: "100%" },
    dropup: { top: "auto", bottom: "100%" },
    dropstart: a ? { left: "100%", right: "auto" } : { left: "auto", right: "100%" },
    dropend: a ? { left: "auto", right: "100%" } : { left: "100%", right: "auto" },
    menuStart: a ? { right: "0", left: "auto" } : { right: "auto", left: "0" },
    menuEnd: a ? { right: "auto", left: "0" } : { right: "0", left: "auto" }
  }, { offsetWidth: A, offsetHeight: u } = n, { clientWidth: f, clientHeight: h } = Ye(e), {
    left: v,
    top: g,
    width: C,
    height: b
  } = bt(e), w = v - A - s < 0, p = v + A + C + s >= f, E = g + u + s >= h, M = g + u + b + s >= h, I = g - u - s < 0, y = (!a && o || a && !o) && v + C - A < 0, x = (a && o || !a && !o) && v + A >= f;
  if (bs.includes(l) && w && p && (l = ze), l === di && (a ? p : w) && (l = Ai), l === Ai && (a ? w : p) && (l = di), l === ci && I && !M && (l = ze), l === ze && M && !I && (l = ci), bs.includes(l) && E && qe(d[l], {
    top: "auto",
    bottom: 0
  }), Cs.includes(l) && (y || x)) {
    let B = { left: "auto", right: "auto" };
    !y && x && !a && (B = { left: "auto", right: 0 }), y && !x && a && (B = { left: 0, right: "auto" }), B && qe(d[l], B);
  }
  const D = c[l];
  K(n, {
    ...d[l],
    margin: `${D.map((B) => B && `${B}px`).join(" ")}`
  }), Cs.includes(l) && o && o && K(n, d[!a && y || a && x ? "menuStart" : "menuEnd"]), k(r, Wa);
}, ou = (t) => Array.from(t.children).map((e) => {
  if (e && Es.includes(e.tagName)) return e;
  const { firstElementChild: n } = e;
  return n && Es.includes(n.tagName) ? n : null;
}).filter((e) => e), xs = (t) => {
  const { element: e, options: n, menu: r } = t, i = t.open ? re : ie, s = N(e);
  i(s, $, Vs), i(s, xi, Vs), i(s, er, cu), i(s, nA, du), n.display === "dynamic" && (t.open ? t._observer.observe(r) : t._observer.disconnect());
}, Bi = (t) => {
  const e = [...It, "btn-group", "input-group"].map(
    (n) => Ue(`${n} ${P}`, N(t))
  ).find((n) => n.length);
  if (e && e.length)
    return [...e[0].children].find(
      (n) => It.some((r) => r === Ee(n, Be))
    );
}, Vs = (t) => {
  const { target: e, type: n } = t;
  if (!X(e)) return;
  const r = Bi(e), i = r && un(r);
  if (!i) return;
  const { parentElement: s, menu: a } = i, o = s && s.contains(e) && (e.tagName === "form" || le(e, "form") !== null);
  [$, Va].includes(n) && Xa(e) && t.preventDefault(), !o && n !== xi && e !== r && e !== a && i.hide();
};
function lu(t) {
  const e = un(this);
  De(this) || e && (t.stopPropagation(), e.toggle(), Xa(this) && t.preventDefault());
}
const cu = (t) => {
  [ni, ri].includes(t.code) && t.preventDefault();
};
function du(t) {
  const { code: e } = t, n = Bi(this);
  if (!n) return;
  const r = un(n), { activeElement: i } = N(n);
  if (!r || !i) return;
  const { menu: s, open: a } = r, o = ou(s);
  if (o && o.length && [ni, ri].includes(e)) {
    let l = o.indexOf(i);
    i === n ? l = 0 : e === ri ? l = l > 1 ? l - 1 : 0 : e === ni && (l = l < o.length - 1 ? l + 1 : l), o[l] && Ze(o[l]);
  }
  Si === e && a && (r.toggle(), Ze(n));
}
class nn extends Pe {
  constructor(n, r) {
    super(n, r);
    m(this, "_toggleEventListeners", (n) => {
      (n ? re : ie)(this.element, $, lu);
    });
    const { parentElement: i } = this.element, [s] = Ue(
      Ha,
      i
    );
    s && (this.parentElement = i, this.menu = s, this._observer = new Di(
      () => ys(this)
    ), this._toggleEventListeners(!0));
  }
  get name() {
    return Ka;
  }
  get defaults() {
    return au;
  }
  toggle() {
    this.open ? this.hide() : this.show();
  }
  show() {
    const { element: n, open: r, menu: i, parentElement: s } = this;
    if (r) return;
    const a = Bi(n), o = a && un(a);
    o && o.hide(), [Pr, Is, Wa].forEach(
      (l) => {
        l.relatedTarget = n;
      }
    ), k(s, Pr), !Pr.defaultPrevented && (R(i, P), R(s, P), ne(n, Yn, "true"), ys(this), this.open = !r, Ze(n), xs(this), k(s, Is));
  }
  hide() {
    const { element: n, open: r, menu: i, parentElement: s } = this;
    r && ([Dr, Ms].forEach((a) => {
      a.relatedTarget = n;
    }), k(s, Dr), !Dr.defaultPrevented && (G(i, P), G(s, P), ne(n, Yn, "false"), this.open = !r, xs(this), k(s, Ms)));
  }
  dispose() {
    this.open && this.hide(), this._toggleEventListeners(), super.dispose();
  }
}
m(nn, "selector", ru), m(nn, "init", iu), m(nn, "getInstance", un);
const ve = "modal", Gi = "Modal", ki = "Offcanvas", Au = "fixed-top", uu = "fixed-bottom", Ja = "sticky-top", _a = "position-sticky", $a = (t) => [
  ...Ue(Au, t),
  ...Ue(uu, t),
  ...Ue(Ja, t),
  ...Ue(_a, t),
  ...Ue("is-fixed", t)
], fu = (t) => {
  const e = yt(t);
  K(e, {
    paddingRight: "",
    overflow: ""
  });
  const n = $a(e);
  n.length && n.forEach((r) => {
    K(r, {
      paddingRight: "",
      marginRight: ""
    });
  });
}, eo = (t) => {
  const { clientWidth: e } = Ye(t), { innerWidth: n } = Ga(t);
  return Math.abs(n - e);
}, to = (t, e) => {
  const n = yt(t), r = parseInt(de(n, "paddingRight"), 10), i = de(n, "overflow") === "hidden" && r ? 0 : eo(t), s = $a(n);
  e && (K(n, {
    overflow: "hidden",
    paddingRight: `${r + i}px`
  }), s.length && s.forEach((a) => {
    const o = de(a, "paddingRight");
    if (a.style.paddingRight = `${parseInt(o, 10) + i}px`, [Ja, _a].some((l) => S(a, l))) {
      const l = de(a, "marginRight");
      a.style.marginRight = `${parseInt(l, 10) - i}px`;
    }
  }));
}, Ie = "offcanvas", rt = et({
  tagName: "div",
  className: "popup-container"
}), no = (t, e) => {
  const n = W(e) && e.nodeName === "BODY", r = W(e) && !n ? e : rt, i = n ? e : yt(t);
  W(t) && (r === rt && i.append(rt), r.append(t));
}, ro = (t, e) => {
  const n = W(e) && e.nodeName === "BODY", r = W(e) && !n ? e : rt;
  W(t) && (t.remove(), r === rt && !rt.children.length && rt.remove());
}, Ni = (t, e) => {
  const n = W(e) && e.nodeName !== "BODY" ? e : rt;
  return W(t) && n.contains(t);
}, io = "backdrop", Rs = `${ve}-${io}`, Ss = `${Ie}-${io}`, so = `.${ve}.${P}`, Oi = `.${Ie}.${P}`, J = et("div"), xt = (t) => Y(
  `${so},${Oi}`,
  N(t)
), Fi = (t) => {
  const e = t ? Rs : Ss;
  [Rs, Ss].forEach((n) => {
    G(J, n);
  }), R(J, e);
}, ao = (t, e, n) => {
  Fi(n), no(J, yt(t)), e && R(J, ae);
}, oo = () => {
  S(J, P) || (R(J, P), Mt(J));
}, ar = () => {
  G(J, P);
}, lo = (t) => {
  xt(t) || (G(J, ae), ro(J, yt(t)), fu(t));
}, co = (t) => X(t) && de(t, "visibility") !== "hidden" && t.offsetParent !== null, pu = `.${ve}`, hu = `[${Be}="${ve}"]`, gu = `[${ir}="${ve}"]`, Ao = `${ve}-static`, mu = {
  backdrop: !0,
  keyboard: !0
}, fn = (t) => Ae(t, Gi), vu = (t) => new oe(t), jn = O(
  `show.bs.${ve}`
), Ts = O(
  `shown.bs.${ve}`
), Br = O(
  `hide.bs.${ve}`
), zs = O(
  `hidden.bs.${ve}`
), uo = (t) => {
  const { element: e } = t, n = eo(e), { clientHeight: r, scrollHeight: i } = Ye(e), { clientHeight: s, scrollHeight: a } = e, o = s !== a;
  if (!o && n) {
    const l = { [at(e) ? "paddingLeft" : "paddingRight"]: `${n}px` };
    K(e, l);
  }
  to(e, o || r !== i);
}, fo = (t, e) => {
  const n = e ? re : ie, { element: r } = t;
  n(r, $, bu), n(N(r), er, Cu), e ? t._observer.observe(r) : t._observer.disconnect();
}, Ps = (t) => {
  const { triggers: e, element: n, relatedTarget: r } = t;
  lo(n), K(n, { paddingRight: "", display: "" }), fo(t);
  const i = jn.relatedTarget || e.find(co);
  i && Ze(i), zs.relatedTarget = r || void 0, k(n, zs), rr(n);
}, Ds = (t) => {
  const { element: e, relatedTarget: n } = t;
  Ze(e), fo(t, !0), Ts.relatedTarget = n || void 0, k(e, Ts), rr(e);
}, Bs = (t) => {
  const { element: e, hasFade: n } = t;
  K(e, { display: "block" }), uo(t), xt(e) || K(yt(e), { overflow: "hidden" }), R(e, P), Ct(e, bn), ne(e, $n, "true"), n ? L(e, () => Ds(t)) : Ds(t);
}, Gs = (t) => {
  const { element: e, options: n, hasFade: r } = t;
  n.backdrop && r && S(J, P) && !xt(e) ? (ar(), L(J, () => Ps(t))) : Ps(t);
};
function wu(t) {
  const e = pe(this), n = e && fn(e);
  De(this) || n && (this.tagName === "A" && t.preventDefault(), n.relatedTarget = this, n.toggle());
}
const Cu = ({ code: t, target: e }) => {
  const n = Y(so, N(e)), r = n && fn(n);
  if (!r) return;
  const { options: i } = r;
  i.keyboard && t === Si && S(n, P) && (r.relatedTarget = null, r.hide());
}, bu = (t) => {
  var A, u;
  const { currentTarget: e } = t, n = e && fn(e);
  if (!n || !e || z.get(e)) return;
  const { options: r, isStatic: i, modalDialog: s } = n, { backdrop: a } = r, { target: o } = t, l = (u = (A = N(e)) == null ? void 0 : A.getSelection()) == null ? void 0 : u.toString().length, c = s.contains(o), d = o && le(o, gu);
  i && !c ? z.set(
    e,
    () => {
      R(e, Ao), L(s, () => Eu(n));
    },
    17
  ) : (d || !l && !i && !c && a) && (n.relatedTarget = d || null, n.hide(), t.preventDefault());
}, Eu = (t) => {
  const { element: e, modalDialog: n } = t, r = (Mn(n) || 0) + 17;
  G(e, Ao), z.set(e, () => z.clear(e), r);
};
class oe extends Pe {
  constructor(n, r) {
    super(n, r);
    m(this, "update", () => {
      S(this.element, P) && uo(this);
    });
    m(this, "_toggleEventListeners", (n) => {
      const r = n ? re : ie, { triggers: i } = this;
      i.length && i.forEach((s) => {
        r(s, $, wu);
      });
    });
    const { element: i } = this, s = Y(
      `.${ve}-dialog`,
      i
    );
    s && (this.modalDialog = s, this.triggers = [
      ...be(
        hu,
        N(i)
      )
    ].filter(
      (a) => pe(a) === i
    ), this.isStatic = this.options.backdrop === "static", this.hasFade = S(i, ae), this.relatedTarget = null, this._observer = new ResizeObserver(() => this.update()), this._toggleEventListeners(!0));
  }
  get name() {
    return Gi;
  }
  get defaults() {
    return mu;
  }
  toggle() {
    S(this.element, P) ? this.hide() : this.show();
  }
  show() {
    const { element: n, options: r, hasFade: i, relatedTarget: s } = this, { backdrop: a } = r;
    let o = 0;
    if (S(n, P) || (jn.relatedTarget = s || void 0, k(n, jn), jn.defaultPrevented)) return;
    const l = xt(n);
    if (l && l !== n) {
      const c = fn(l) || Ae(
        l,
        ki
      );
      c && c.hide();
    }
    a ? (Ni(J) ? Fi(!0) : ao(n, i, !0), o = Mn(J), oo(), setTimeout(() => Bs(this), o)) : (Bs(this), l && S(J, P) && ar());
  }
  hide() {
    const { element: n, hasFade: r, relatedTarget: i } = this;
    S(n, P) && (Br.relatedTarget = i || void 0, k(n, Br), !Br.defaultPrevented && (G(n, P), ne(n, bn, "true"), Ct(n, $n), r ? L(n, () => Gs(this)) : Gs(this)));
  }
  dispose() {
    const n = { ...this }, { modalDialog: r, hasFade: i } = n, s = () => setTimeout(() => super.dispose(), 17);
    this.hide(), this._toggleEventListeners(), i ? L(r, s) : s();
  }
}
m(oe, "selector", pu), m(oe, "init", vu), m(oe, "getInstance", fn);
const Iu = `.${Ie}`, po = `[${Be}="${Ie}"]`, Mu = `[${ir}="${Ie}"]`, or = `${Ie}-toggling`, yu = {
  backdrop: !0,
  keyboard: !0,
  scroll: !1
}, pn = (t) => Ae(t, ki), xu = (t) => new rn(t), qn = O(`show.bs.${Ie}`), ho = O(`shown.bs.${Ie}`), Gr = O(`hide.bs.${Ie}`), go = O(`hidden.bs.${Ie}`), Vu = (t) => {
  const { element: e } = t, { clientHeight: n, scrollHeight: r } = Ye(e);
  to(e, n !== r);
}, mo = (t, e) => {
  const n = e ? re : ie, r = N(t.element);
  n(r, er, zu), n(r, $, Tu);
}, ks = (t) => {
  const { element: e, options: n } = t;
  n.scroll || (Vu(t), K(yt(e), { overflow: "hidden" })), R(e, or), R(e, P), K(e, { visibility: "visible" }), L(e, () => Pu(t));
}, Ru = (t) => {
  const { element: e, options: n } = t, r = xt(e);
  e.blur(), !r && n.backdrop && S(J, P) && ar(), L(e, () => Du(t));
};
function Su(t) {
  const e = pe(this), n = e && pn(e);
  De(this) || n && (n.relatedTarget = this, n.toggle(), this.tagName === "A" && t.preventDefault());
}
const Tu = (t) => {
  const { target: e } = t, n = Y(
    Oi,
    N(e)
  );
  if (!n) return;
  const r = Y(
    Mu,
    n
  ), i = pn(n);
  if (!i) return;
  const { options: s, triggers: a } = i, { backdrop: o } = s, l = le(e, po), c = N(n).getSelection();
  J.contains(e) && o === "static" || (!(c && c.toString().length) && (!n.contains(e) && o && (!l || a.includes(e)) || r && r.contains(e)) && (i.relatedTarget = r && r.contains(e) ? r : void 0, i.hide()), l && l.tagName === "A" && t.preventDefault());
}, zu = ({ code: t, target: e }) => {
  const n = Y(
    Oi,
    N(e)
  ), r = n && pn(n);
  r && r.options.keyboard && t === Si && (r.relatedTarget = void 0, r.hide());
}, Pu = (t) => {
  const { element: e } = t;
  G(e, or), Ct(e, bn), ne(e, $n, "true"), ne(e, "role", "dialog"), k(e, ho), mo(t, !0), Ze(e), rr(e);
}, Du = (t) => {
  const { element: e, triggers: n } = t;
  ne(e, bn, "true"), Ct(e, $n), Ct(e, "role"), K(e, { visibility: "" });
  const r = qn.relatedTarget || n.find(co);
  r && Ze(r), lo(e), k(e, go), G(e, or), rr(e), xt(e) || mo(t);
};
class rn extends Pe {
  constructor(n, r) {
    super(n, r);
    m(this, "_toggleEventListeners", (n) => {
      const r = n ? re : ie;
      this.triggers.forEach((i) => {
        r(i, $, Su);
      });
    });
    const { element: i } = this;
    this.triggers = [
      ...be(
        po,
        N(i)
      )
    ].filter(
      (s) => pe(s) === i
    ), this.relatedTarget = void 0, this._toggleEventListeners(!0);
  }
  get name() {
    return ki;
  }
  get defaults() {
    return yu;
  }
  toggle() {
    S(this.element, P) ? this.hide() : this.show();
  }
  show() {
    const { element: n, options: r, relatedTarget: i } = this;
    let s = 0;
    if (S(n, P) || (qn.relatedTarget = i || void 0, ho.relatedTarget = i || void 0, k(n, qn), qn.defaultPrevented)) return;
    const a = xt(n);
    if (a && a !== n) {
      const o = pn(a) || Ae(
        a,
        Gi
      );
      o && o.hide();
    }
    r.backdrop ? (Ni(J) ? Fi() : ao(n, !0), s = Mn(J), oo(), setTimeout(() => ks(this), s)) : (ks(this), a && S(J, P) && ar());
  }
  hide() {
    const { element: n, relatedTarget: r } = this;
    S(n, P) && (Gr.relatedTarget = r || void 0, go.relatedTarget = r || void 0, k(n, Gr), !Gr.defaultPrevented && (R(n, or), G(n, P), Ru(this)));
  }
  dispose() {
    const { element: n } = this, r = S(n, P), i = () => setTimeout(() => super.dispose(), 1);
    this.hide(), this._toggleEventListeners(), r ? L(n, i) : i();
  }
}
m(rn, "selector", Iu), m(rn, "init", xu), m(rn, "getInstance", pn);
const vt = "popover", Ui = "Popover", je = "tooltip", vo = (t) => {
  const e = t === je, n = e ? `${t}-inner` : `${t}-body`, r = e ? "" : `<h3 class="${t}-header"></h3>`, i = `<div class="${t}-arrow"></div>`, s = `<div class="${n}"></div>`;
  return `<div class="${t}" role="${je}">${r + i + s}</div>`;
}, wo = {
  top: "top",
  bottom: "bottom",
  left: "start",
  right: "end"
}, ui = (t) => {
  requestAnimationFrame(() => {
    const e = /\b(top|bottom|start|end)+/, { element: n, tooltip: r, container: i, offsetParent: s, options: a, arrow: o } = t;
    if (!r) return;
    const l = at(n), { x: c, y: d } = vA(s);
    K(r, {
      top: "",
      left: "",
      right: "",
      bottom: ""
    });
    const { offsetWidth: A, offsetHeight: u } = r, { clientWidth: f, clientHeight: h, offsetWidth: v } = Ye(n);
    let { placement: g } = a;
    const { clientWidth: C, offsetWidth: b } = i, w = de(
      i,
      "position"
    ) === "fixed", p = Math.abs(w ? C - b : f - v), E = l && w ? p : 0, M = f - (l ? 0 : p) - 1, I = t._observer.getEntry(n), {
      width: y,
      height: x,
      left: D,
      right: B,
      top: F
    } = (I == null ? void 0 : I.boundingClientRect) || bt(n, !0), {
      x: T,
      y: H
    } = EA(
      n,
      s,
      { x: c, y: d }
    );
    K(o, {
      top: "",
      left: "",
      right: "",
      bottom: ""
    });
    let Q = 0, q = "", te = 0, ye = "", xe = "", Ve = "", ct = "";
    const Re = o.offsetWidth || 0, Se = o.offsetHeight || 0, jt = Re / 2;
    let dt = F - u - Se < 0, He = F + u + x + Se >= h, Xe = D - A - Re < E, We = D + A + y + Re >= M;
    const At = ["left", "right"], qt = ["top", "bottom"];
    dt = At.includes(g) ? F + x / 2 - u / 2 - Se < 0 : dt, He = At.includes(g) ? F + u / 2 + x / 2 + Se >= h : He, Xe = qt.includes(g) ? D + y / 2 - A / 2 < E : Xe, We = qt.includes(g) ? D + A / 2 + y / 2 >= M : We, g = At.includes(g) && Xe && We ? "top" : g, g = g === "top" && dt ? "bottom" : g, g = g === "bottom" && He ? "top" : g, g = g === "left" && Xe ? "right" : g, g = g === "right" && We ? "left" : g, r.className.includes(g) || (r.className = r.className.replace(
      e,
      wo[g]
    )), At.includes(g) ? (g === "left" ? te = T - A - Re : te = T + y + Re, dt && He ? (Q = 0, q = 0, xe = H + x / 2 - Se / 2) : dt ? (Q = H, q = "", xe = x / 2 - Re) : He ? (Q = H - u + x, q = "", xe = u - x / 2 - Re) : (Q = H - u / 2 + x / 2, xe = u / 2 - Se / 2)) : qt.includes(g) && (g === "top" ? Q = H - u - Se : Q = H + x + Se, Xe ? (te = 0, Ve = T + y / 2 - jt) : We ? (te = "auto", ye = 0, ct = y / 2 + M - B - jt) : (te = T - A / 2 + y / 2, Ve = A / 2 - jt)), K(r, {
      top: `${Q}px`,
      bottom: q === "" ? "" : `${q}px`,
      left: te === "auto" ? te : `${te}px`,
      right: ye !== "" ? `${ye}px` : ""
    }), X(o) && (xe !== "" && (o.style.top = `${xe}px`), Ve !== "" ? o.style.left = `${Ve}px` : ct !== "" && (o.style.right = `${ct}px`));
    const fr = O(
      `updated.bs.${An(t.name)}`
    );
    k(n, fr);
  });
}, fi = {
  template: vo(je),
  title: "",
  customClass: "",
  trigger: "hover focus",
  placement: "top",
  sanitizeFn: void 0,
  animation: !0,
  delay: 200,
  container: document.body,
  content: "",
  dismissible: !1,
  btnClose: ""
}, Co = "data-original-title", ht = "Tooltip", _e = (t, e, n) => {
  if (In(e) && e.length) {
    let r = e.trim();
    Fa(n) && (r = n(r));
    const i = new DOMParser().parseFromString(r, "text/html");
    t.append(...i.body.childNodes);
  } else X(e) ? t.append(e) : (MA(e) || IA(e) && e.every(W)) && t.append(...e);
}, Bu = (t) => {
  const e = t.name === ht, { id: n, element: r, options: i } = t, {
    title: s,
    placement: a,
    template: o,
    animation: l,
    customClass: c,
    sanitizeFn: d,
    dismissible: A,
    content: u,
    btnClose: f
  } = i, h = e ? je : vt, v = { ...wo };
  let g = [], C = [];
  at(r) && (v.left = "end", v.right = "start");
  const b = `bs-${h}-${v[a]}`;
  let w;
  if (X(o))
    w = o;
  else {
    const x = et("div");
    _e(x, o, d), w = x.firstChild;
  }
  if (!X(w)) return;
  t.tooltip = w.cloneNode(!0);
  const { tooltip: p } = t;
  ne(p, "id", n), ne(p, "role", je);
  const E = e ? `${je}-inner` : `${vt}-body`, M = e ? null : Y(`.${vt}-header`, p), I = Y(`.${E}`, p);
  t.arrow = Y(
    `.${h}-arrow`,
    p
  );
  const { arrow: y } = t;
  if (X(s)) g = [s.cloneNode(!0)];
  else {
    const x = et("div");
    _e(x, s, d), g = [...x.childNodes];
  }
  if (X(u)) C = [u.cloneNode(!0)];
  else {
    const x = et("div");
    _e(x, u, d), C = [...x.childNodes];
  }
  if (A)
    if (s)
      if (X(f))
        g = [...g, f.cloneNode(!0)];
      else {
        const x = et("div");
        _e(x, f, d), g = [...g, x.firstChild];
      }
    else if (M && M.remove(), X(f))
      C = [...C, f.cloneNode(!0)];
    else {
      const x = et("div");
      _e(x, f, d), C = [...C, x.firstChild];
    }
  e ? s && I && _e(I, s, d) : (s && M && _e(M, g, d), u && I && _e(I, C, d), t.btn = Y(".btn-close", p) || void 0), R(p, "position-absolute"), R(y, "position-absolute"), S(p, h) || R(p, h), l && !S(p, ae) && R(p, ae), c && !S(p, c) && R(p, c), S(p, b) || R(p, b);
}, Gu = (t) => {
  const e = ["HTML", "BODY"], n = [];
  let { parentNode: r } = t;
  for (; r && !e.includes(r.nodeName); )
    r = wA(r), Ba(r) || CA(r) || n.push(r);
  return n.find((i, s) => (de(i, "position") !== "relative" || de(i, "position") === "relative" && i.offsetHeight !== i.scrollHeight) && n.slice(s + 1).every(
    (a) => de(a, "position") === "static"
  ) ? i : null) || N(t).body;
}, ku = `[${Be}="${je}"],[data-tip="${je}"]`, bo = "title";
let Ns = (t) => Ae(t, ht);
const Nu = (t) => new gt(t), Ou = (t) => {
  const { element: e, tooltip: n, container: r } = t;
  Ct(e, ya), ro(
    n,
    r
  );
}, Yt = (t) => {
  const { tooltip: e, container: n } = t;
  return e && Ni(e, n);
}, Fu = (t, e) => {
  const { element: n } = t;
  t._toggleEventListeners(), cn(n, Co) && t.name === ht && Io(t), e && e();
}, Eo = (t, e) => {
  const n = e ? re : ie, { element: r } = t;
  n(
    N(r),
    nr,
    t.handleTouch,
    dn
  );
}, Os = (t) => {
  const { element: e } = t, n = O(
    `shown.bs.${An(t.name)}`
  );
  Eo(t, !0), k(e, n), z.clear(e, "in");
}, Fs = (t) => {
  const { element: e } = t, n = O(
    `hidden.bs.${An(t.name)}`
  );
  Eo(t), Ou(t), k(e, n), z.clear(e, "out");
}, Us = (t, e) => {
  const n = e ? re : ie, { element: r, tooltip: i } = t, s = le(r, `.${ve}`), a = le(r, `.${Ie}`);
  e ? [r, i].forEach((o) => t._observer.observe(o)) : t._observer.disconnect(), s && n(s, `hide.bs.${ve}`, t.handleHide), a && n(a, `hide.bs.${Ie}`, t.handleHide);
}, Io = (t, e) => {
  const n = [Co, bo], { element: r } = t;
  ne(
    r,
    n[e ? 0 : 1],
    e || Ee(r, n[0]) || ""
  ), Ct(r, n[e ? 1 : 0]);
};
class gt extends Pe {
  constructor(n, r) {
    super(n, r);
    m(this, "handleFocus", () => Ze(this.element));
    m(this, "handleShow", () => this.show());
    m(this, "handleHide", () => this.hide());
    m(this, "update", () => {
      ui(this);
    });
    m(this, "toggle", () => {
      const { tooltip: n } = this;
      n && !Yt(this) ? this.show() : this.hide();
    });
    m(this, "handleTouch", ({ target: n }) => {
      const { tooltip: r, element: i } = this;
      r && r.contains(n) || n === i || n && i.contains(n) || this.hide();
    });
    m(this, "_toggleEventListeners", (n) => {
      const r = n ? re : ie, { element: i, options: s, btn: a } = this, { trigger: o } = s, l = !!(this.name !== ht && s.dismissible);
      o.includes("manual") || (this.enabled = !!n, o.split(" ").forEach((c) => {
        c === rA ? (r(i, Va, this.handleShow), r(i, tr, this.handleShow), l || (r(i, Ri, this.handleHide), r(
          N(i),
          nr,
          this.handleTouch,
          dn
        ))) : c === $ ? r(i, c, l ? this.handleShow : this.toggle) : c === xi && (r(i, Vi, this.handleShow), l || r(i, xa, this.handleHide), dA() && r(i, $, this.handleFocus)), l && a && r(a, $, this.handleHide);
      }));
    });
    const { element: i } = this, s = this.name === ht, a = s ? je : vt, o = s ? ht : Ui;
    Ns = (A) => Ae(A, o), this.enabled = !0, this.id = `${a}-${Na(i, a)}`;
    const { options: l } = this;
    if (!l.title && s || !s && !l.content)
      return;
    qe(fi, { titleAttr: "" }), cn(i, bo) && s && typeof l.title == "string" && Io(this, l.title);
    const c = Gu(i), d = ["sticky", "fixed", "relative"].some(
      (A) => de(c, "position") === A
    ) ? c : Ga(i);
    this.container = c, this.offsetParent = d, Bu(this), this.tooltip && (this._observer = new Di(() => this.update()), this._toggleEventListeners(!0));
  }
  get name() {
    return ht;
  }
  get defaults() {
    return fi;
  }
  show() {
    const { options: n, tooltip: r, element: i, container: s, id: a } = this, { animation: o } = n, l = z.get(i, "out");
    z.clear(i, "out"), r && !l && !Yt(this) && z.set(
      i,
      () => {
        const c = O(
          `show.bs.${An(this.name)}`
        );
        k(i, c), c.defaultPrevented || (no(r, s), ne(i, ya, `#${a}`), this.update(), Us(this, !0), S(r, P) || R(r, P), o ? L(r, () => Os(this)) : Os(this));
      },
      17,
      "in"
    );
  }
  hide() {
    const { options: n, tooltip: r, element: i } = this, { animation: s, delay: a } = n;
    z.clear(i, "in"), r && Yt(this) && z.set(
      i,
      () => {
        const o = O(
          `hide.bs.${An(this.name)}`
        );
        k(i, o), o.defaultPrevented || (this.update(), G(r, P), Us(this), s ? L(r, () => Fs(this)) : Fs(this));
      },
      a + 17,
      "out"
    );
  }
  enable() {
    const { enabled: n } = this;
    n || (this._toggleEventListeners(!0), this.enabled = !n);
  }
  disable() {
    const { tooltip: n, enabled: r } = this;
    r && (n && Yt(this) && this.hide(), this._toggleEventListeners(), this.enabled = !r);
  }
  toggleEnabled() {
    this.enabled ? this.disable() : this.enable();
  }
  dispose() {
    const { tooltip: n, options: r } = this, i = { ...this, name: this.name }, s = () => setTimeout(
      () => Fu(i, () => super.dispose()),
      17
    );
    r.animation && Yt(i) ? (this.options.delay = 0, this.hide(), L(n, s)) : s();
  }
}
m(gt, "selector", ku), m(gt, "init", Nu), m(gt, "getInstance", Ns), m(gt, "styleTip", ui);
const Uu = `[${Be}="${vt}"],[data-tip="${vt}"]`, Qu = qe({}, fi, {
  template: vo(vt),
  content: "",
  dismissible: !1,
  btnClose: '<button class="btn-close position-absolute top-0 end-0 m-1" aria-label="Close"></button>'
}), ju = (t) => Ae(t, Ui), qu = (t) => new zt(t);
class zt extends gt {
  constructor(n, r) {
    super(n, r);
    m(this, "show", () => {
      super.show();
      const { options: n, btn: r } = this;
      n.dismissible && r && setTimeout(() => Ze(r), 17);
    });
  }
  get name() {
    return Ui;
  }
  get defaults() {
    return Qu;
  }
}
m(zt, "selector", Uu), m(zt, "init", qu), m(zt, "getInstance", ju), m(zt, "styleTip", ui);
const Zu = "scrollspy", Mo = "ScrollSpy", Yu = '[data-bs-spy="scroll"]', Lu = "[href]", Ku = {
  offset: 10,
  target: void 0
}, Hu = (t) => Ae(t, Mo), Xu = (t) => new sn(t), Qs = O(`activate.bs.${Zu}`), Wu = (t) => {
  const {
    target: e,
    _itemsLength: n,
    _observables: r
  } = t, i = Pi("A", e), s = N(e);
  !i.length || n === r.size || (r.clear(), Array.from(i).forEach((a) => {
    var c;
    const o = (c = Ee(a, "href")) == null ? void 0 : c.slice(1), l = o != null && o.length ? s.getElementById(o) : null;
    l && !De(a) && t._observables.set(l, a);
  }), t._itemsLength = t._observables.size);
}, yo = (t) => {
  Array.from(Pi("A", t)).forEach(
    (e) => {
      S(e, j) && G(e, j);
    }
  );
}, js = (t, e) => {
  const { target: n, element: r } = t;
  yo(n), t._activeItem = e, R(e, j);
  let i = e;
  for (; i !== n; )
    if (i = i.parentElement, ["nav", "dropdown-menu", "list-group"].some(
      (s) => S(i, s)
    )) {
      const s = i.previousElementSibling;
      s && !S(s, j) && R(s, j);
    }
  Qs.relatedTarget = e, k(r, Qs);
}, kr = (t, e) => {
  const { scrollTarget: n, element: r, options: i } = t;
  return (n !== r ? bt(e).top + n.scrollTop : e.offsetTop) - (i.offset || 10);
};
class sn extends Pe {
  constructor(n, r) {
    super(n, r);
    m(this, "refresh", () => {
      var u, f, h;
      const { target: n, scrollTarget: r } = this;
      if (!n || n.offsetHeight === 0) return;
      Wu(this);
      const { _itemsLength: i, _observables: s, _activeItem: a } = this;
      if (!i) return;
      const o = s.entries().toArray(), { scrollTop: l, scrollHeight: c, clientHeight: d } = r;
      if (l >= c - d) {
        const v = (u = o[i - 1]) == null ? void 0 : u[1];
        a !== v && js(this, v);
        return;
      }
      const A = (f = o[0]) != null && f[0] ? kr(this, o[0][0]) : null;
      if (A !== null && l < A && A > 0) {
        this._activeItem = null, yo(n);
        return;
      }
      for (let v = 0; v < i; v += 1) {
        const [g, C] = o[v], b = kr(this, g), w = (h = o[v + 1]) == null ? void 0 : h[0], p = w ? kr(this, w) : null;
        if (a !== C && l >= b && (p === null || l < p)) {
          js(this, C);
          break;
        }
      }
    });
    m(this, "_scrollTo", (n) => {
      var a;
      const r = le(n.target, Lu), i = r && ((a = Ee(r, "href")) == null ? void 0 : a.slice(1)), s = i && yA(i, this.target);
      s && (this.scrollTarget.scrollTo({
        top: s.offsetTop,
        behavior: "smooth"
      }), n.preventDefault());
    });
    m(this, "_toggleEventListeners", (n) => {
      const { target: r, _observables: i, _observer: s, _scrollTo: a } = this;
      (n ? re : ie)(r, $, a), n ? i == null || i.forEach((o, l) => s.observe(l)) : s.disconnect();
    });
    const { element: i, options: s } = this, a = Y(
      s.target,
      N(i)
    );
    a && (this.target = a, this.scrollTarget = i.clientHeight < i.scrollHeight ? i : Ye(i), this._observables = /* @__PURE__ */ new Map(), this.refresh(), this._observer = new Di(() => {
      requestAnimationFrame(() => this.refresh());
    }, {
      root: this.scrollTarget
    }), this._toggleEventListeners(!0));
  }
  get name() {
    return Mo;
  }
  get defaults() {
    return Ku;
  }
  dispose() {
    this._toggleEventListeners(), super.dispose();
  }
}
m(sn, "selector", Yu), m(sn, "init", Xu), m(sn, "getInstance", Hu);
const xn = "tab", xo = "Tab", pi = `[${Be}="${xn}"]`, Vo = (t) => Ae(t, xo), Ju = (t) => new an(t), Nr = O(
  `show.bs.${xn}`
), qs = O(
  `shown.bs.${xn}`
), Or = O(
  `hide.bs.${xn}`
), Zs = O(
  `hidden.bs.${xn}`
), hn = /* @__PURE__ */ new Map(), Ys = (t) => {
  const { tabContent: e, nav: n } = t;
  e && S(e, Et) && (e.style.height = "", G(e, Et)), n && z.clear(n);
}, Ls = (t) => {
  const { element: e, tabContent: n, content: r, nav: i } = t, { tab: s } = X(i) && hn.get(i) || { tab: null };
  if (n && r && S(r, ae)) {
    const { currentHeight: a, nextHeight: o } = hn.get(e) || { currentHeight: 0, nextHeight: 0 };
    a !== o ? setTimeout(() => {
      n.style.height = `${o}px`, Mt(n), L(n, () => Ys(t));
    }, 50) : Ys(t);
  } else i && z.clear(i);
  qs.relatedTarget = s, k(e, qs);
}, Ks = (t) => {
  const { element: e, content: n, tabContent: r, nav: i } = t, { tab: s, content: a } = i && hn.get(i) || { tab: null, content: null };
  let o = 0;
  if (r && n && S(n, ae) && ([a, n].forEach((l) => {
    l && R(l, "overflow-hidden");
  }), o = a ? a.scrollHeight : 0), Nr.relatedTarget = s, Zs.relatedTarget = e, k(e, Nr), !Nr.defaultPrevented) {
    if (n && R(n, j), a && G(a, j), r && n && S(n, ae)) {
      const l = n.scrollHeight;
      hn.set(e, {
        currentHeight: o,
        nextHeight: l,
        tab: null,
        content: null
      }), R(r, Et), r.style.height = `${o}px`, Mt(r), [a, n].forEach((c) => {
        c && G(c, "overflow-hidden");
      });
    }
    n && n && S(n, ae) ? setTimeout(() => {
      R(n, P), L(n, () => {
        Ls(t);
      });
    }, 1) : (n && R(n, P), Ls(t)), s && k(s, Zs);
  }
}, Hs = (t) => {
  const { nav: e } = t;
  if (!X(e))
    return { tab: null, content: null };
  const n = Ue(
    j,
    e
  );
  let r = null;
  n.length === 1 && !It.some(
    (s) => S(n[0].parentElement, s)
  ) ? [r] = n : n.length > 1 && (r = n[n.length - 1]);
  const i = X(r) ? pe(r) : null;
  return { tab: r, content: i };
}, Xs = (t) => {
  if (!X(t)) return null;
  const e = le(t, `.${It.join(",.")}`);
  return e ? Y(`.${It[0]}-toggle`, e) : null;
}, _u = (t) => {
  const e = le(t.target, pi), n = e && Vo(e);
  n && (t.preventDefault(), n.show());
};
class an extends Pe {
  constructor(n) {
    super(n);
    m(this, "_toggleEventListeners", (n) => {
      (n ? re : ie)(this.element, $, _u);
    });
    const { element: r } = this, i = pe(r);
    if (!i) return;
    const s = le(r, ".nav"), a = le(
      i,
      ".tab-content"
    );
    this.nav = s, this.content = i, this.tabContent = a, this.dropdown = Xs(r);
    const { tab: o } = Hs(this);
    if (s && !o) {
      const l = Y(pi, s), c = l && pe(l);
      c && (R(l, j), R(c, P), R(c, j), ne(r, Vr, "true"));
    }
    this._toggleEventListeners(!0);
  }
  get name() {
    return xo;
  }
  show() {
    const { element: n, content: r, nav: i, dropdown: s } = this;
    if (i && z.get(i) || S(n, j)) return;
    const { tab: a, content: o } = Hs(this);
    if (i && a && hn.set(i, { tab: a, content: o, currentHeight: 0, nextHeight: 0 }), Or.relatedTarget = n, !X(a) || (k(a, Or), Or.defaultPrevented)) return;
    R(n, j), ne(n, Vr, "true");
    const l = X(a) && Xs(a);
    if (l && S(l, j) && G(l, j), i) {
      const c = () => {
        a && (G(a, j), ne(a, Vr, "false")), s && !S(s, j) && R(s, j);
      };
      o && (S(o, ae) || r && S(r, ae)) ? z.set(i, c, 1) : c();
    }
    o && (G(o, P), S(o, ae) ? L(o, () => Ks(this)) : Ks(this));
  }
  dispose() {
    this._toggleEventListeners(), super.dispose();
  }
}
m(an, "selector", pi), m(an, "init", Ju), m(an, "getInstance", Vo);
const Me = "toast", Ro = "Toast", $u = `.${Me}`, ef = `[${ir}="${Me}"]`, tf = `[${Be}="${Me}"]`, Gt = "showing", So = "hide", nf = {
  animation: !0,
  autohide: !0,
  delay: 5e3
}, Qi = (t) => Ae(t, Ro), rf = (t) => new on(t), Ws = O(
  `show.bs.${Me}`
), sf = O(
  `shown.bs.${Me}`
), Js = O(
  `hide.bs.${Me}`
), af = O(
  `hidden.bs.${Me}`
), _s = (t) => {
  const { element: e, options: n } = t;
  G(e, Gt), z.clear(e, Gt), k(e, sf), n.autohide && z.set(e, () => t.hide(), n.delay, Me);
}, $s = (t) => {
  const { element: e } = t;
  G(e, Gt), G(e, P), R(e, So), z.clear(e, Me), k(e, af);
}, of = (t) => {
  const { element: e, options: n } = t;
  R(e, Gt), n.animation ? (Mt(e), L(e, () => $s(t))) : $s(t);
}, lf = (t) => {
  const { element: e, options: n } = t;
  z.set(
    e,
    () => {
      G(e, So), Mt(e), R(e, P), R(e, Gt), n.animation ? L(e, () => _s(t)) : _s(t);
    },
    17,
    Gt
  );
};
function cf(t) {
  const e = pe(this), n = e && Qi(e);
  De(this) || n && (this.tagName === "A" && t.preventDefault(), n.relatedTarget = this, n.show());
}
const df = (t) => {
  const e = t.target, n = Qi(e), { type: r, relatedTarget: i } = t;
  !n || e === i || e.contains(i) || ([tr, Vi].includes(r) ? z.clear(e, Me) : z.set(e, () => n.hide(), n.options.delay, Me));
};
class on extends Pe {
  constructor(n, r) {
    super(n, r);
    m(this, "show", () => {
      const { element: n, isShown: r } = this;
      !n || r || (k(n, Ws), Ws.defaultPrevented || lf(this));
    });
    m(this, "hide", () => {
      const { element: n, isShown: r } = this;
      !n || !r || (k(n, Js), Js.defaultPrevented || of(this));
    });
    m(this, "_toggleEventListeners", (n) => {
      const r = n ? re : ie, { element: i, triggers: s, dismiss: a, options: o, hide: l } = this;
      a && r(a, $, l), o.autohide && [Vi, xa, tr, Ri].forEach(
        (c) => r(i, c, df)
      ), s.length && s.forEach((c) => {
        r(c, $, cf);
      });
    });
    const { element: i, options: s } = this;
    s.animation && !S(i, ae) ? R(i, ae) : !s.animation && S(i, ae) && G(i, ae), this.dismiss = Y(ef, i), this.triggers = [
      ...be(
        tf,
        N(i)
      )
    ].filter(
      (a) => pe(a) === i
    ), this._toggleEventListeners(!0);
  }
  get name() {
    return Ro;
  }
  get defaults() {
    return nf;
  }
  get isShown() {
    return S(this.element, P);
  }
  dispose() {
    const { element: n, isShown: r } = this;
    this._toggleEventListeners(), z.clear(n, Me), r && G(n, P), super.dispose();
  }
}
m(on, "selector", $u), m(on, "init", rf), m(on, "getInstance", Qi);
const To = /* @__PURE__ */ new Map();
[
  _t,
  $t,
  en,
  tn,
  nn,
  oe,
  rn,
  zt,
  sn,
  an,
  on,
  gt
].forEach((t) => To.set(t.prototype.name, t));
const Af = (t, e) => {
  [...e].forEach((n) => t(n));
}, ea = (t) => {
  const e = document, n = [...Pi("*", e)];
  To.forEach((r) => {
    const { init: i, selector: s } = r;
    Af(
      i,
      n.filter((a) => ka(a, s))
    );
  });
};
document.body ? ea() : re(document, "DOMContentLoaded", () => ea(), {
  once: !0
});
const uf = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAOCAYAAADNGCeJAAABfWlDQ1BJQ0MgUHJvZmlsZQAAeNqtjjFLW1EYhp8TY1UMGEqwDiIHFOlwU1IdNNYlJmAiDhItJNlubm6icJMcbk5I+wPcXHQQXRT1L4guDo7ioIMgCMHfIAiClHA7XDRT26Xv9HzP8H4vBLSplBMEqjXtZhcXZC5fkH1tBgnxkTk+mVZDJVZWlvljXu4RAHdRUymnnHl9mN9sHZ5+WNofm9MGf89gyW5YIPoBq9SwqiAcwLCUq0HsAdGWVhrEFRBxc/kCiDYQqfj8BESKuXwBAkEg4q5lkxAYAcJFnz8D4YrPs0DYWjdLEEgDhr8BgIF0Ss7E4tEE/zlVp/n2QwAhu/Z9FQgDo6RJIZkhRpwoCW3/0ADJuvrpblTWtUwo5dgyWa+qprZdQ2Zq1hdDTsW+xgBy+YL0q5+zCEAM33Zd/Qji49Cz1XXFXTi/gJHrrps4gKFvcHajTNd8Hy5egv+6G+XpKZ9DC9D76HnPk9C3A51tz/t17HmdE+hpw6XzGyR3aeBUQPO7AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4QgNBwsm52C7KAAAAk1JREFUOMttkztrVFEUhb99MpMxiRkTgkQjaHwVWlgKKSzEyiJFsNLCzloQf4C/QC1sRAVtRfANAUVRUIuAWEhEfBXJRM3DzCSZmUwyZy+Le3Nngh44cNhn32+ftfa+Vir7haFtdgxosHkVfGbiVseuo0+ySN7z6w0e5cwqWUwCs6BaeYlSReOSSy5JkntycElamn7ZTn/+TWeTu1Z+llstR35WvP/BB+2ur6sp15o3Y8KU5PU/SwBXHrw3gNKKHkpSjM0E5x4V1+WzH096rTLIr7obwNcFX5ak758n36TVXB6lZxeHkQBYrHtFkuZmpt6mMtbVXJPfONEvibCjKwigI5gBDMSZ+ysRDBkW4Mjpc5hx6YX2F7dYkVijUs3fzSwD6CyYmRFajiTVu3KN6mqTt2AATu+eMYCxwzofAKoLr2LvYG0j39INtMPShoXYnGswDgLJ1FE4BNjefkYBaFTuGeRa5VurDZby84Xum5PcA0slbGVq4vFoCDYsgM/Xn4ZAZ9sXGfQfmShXuDxinxYbYIYZUDxw/GZPDqjPux279iNAfgOl/8u0TVVqDR4lMykV+3q2C7DV8p1sUFGWm72sJm/dA+bJYXZVDyXDzEySzCOqz99tl5eZHzoTWLcljyt2JaaybccgwJnb9jhpAgKawrFTI68B1nK2s12O7RvpBaBU8avRNZ8NamxK8hLA75oW0njU8vQXgGVpPsaN/8jlLrnHRa+W3wUzdgXTACCTUOhA2BDAwiq3QBgEVqavpg4NhJB4mXZIZqHP4OBfhGGQCkGsJ74AAAAASUVORK5CYII=", ff = "data:image/png;base64,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", pf = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAhCAYAAABX5MJvAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAARySURBVFhHxZjtU5RVGMb5N/oH+pgQqaiVNqVALOBiTuaIsuDU5EyUlZY09iEdE5nixd1lwQ1YYwbiRbIWUEN5WW2ZxkgCAReIhAQJ4iVakH3h6j6Hs7LLnmf32caZrplrlnnOnHP/9jn3fZ+zRFV9vA9mXTzMh8gZof2VLoG7THxyZ665LDPxscuF/Z8FWEfjWYmoPZmOqOI9L6I47QVls/F1Nvn7te1Sl6h06esvEYT2eXnwAIcB4f6PMDQ3Sh5UwTRBn7IFhYmxyN8VjfydG1Cw8xnyBhTGR+N80kawLxUpjGoIfXIcChNiUHYwCdZTH6LVcBYdpV/CdiEfHSVf4EbhaXybc4QHLHr1OT5HLYgqiPOaTTx4q/5zDNvbsfT3HGSan/gDPc0NaDx9DMbd28hbg0BkDg2hXQWofjcd99qvwuNaFuFCyzkzjc7KEpQfSoJRu00a2N8hIfTJmznAaFenWF69vG43ur+rRrlOQyDyPPFZEcJACWg5rMWQ7QexbORyP1qC3WLkELyiJADMUgg2yZC6BfavTbQFLrGkXCsrK+IvueYfjvMcYYn9uJzVQLA8qHk/A5ND/WIpiSi4o+Ma2oznMP2bQzyUq7+lEeb9uyjHKD98IH6WQrAS6zDl8depJK/bhfaSPJTuexmDthbxVK65B6O4/Gk29JrN6iAMqVtRdiARA9ebxBLKetD7C27XVPAgoeRefoS24nPUZ55VB6GnrajKTsd4X7dYIlgs82dGRzB25ydMDd+Da9EpRpTVVV8JI+UZixEWgrXe+hNv46/7w2J6sJyzM7BSsp2KfQoVumT8fvtHMaIsB22ZJTOVQKiBqYG4FAbCtbSIgdYraDxznN7aAfS1WMWIshy267Bk7VYJwStDh0nHXTFdWXNUfs1nT6D3aoN4oqxfrXV0TuxYPeDCQbAmVaFLwdCtG2K6smbHx9Ccm4OBtiviiVxejxs2cz4K4mOCAKQQrFGxds06HUtAmZYpEXua6tHwyRFqy8moPX6Y8uKWYuNamJ5E05mPUJS0KeBOwruoDIK5iO4Ll0++Q6fimFgmUM65WdqGHORtf5p6SiyKNBvxc51FEeJ+lx2Vb+3lXbh4D8VYByKFYMewae8O9FhrxDKB8no8WPjzIS/PKeqWUyODWJyfFaOBWlqYR6sxF3oOwM4QBuFvBQhm1t1qjmZg4u4dsVzk8no96LbW8q5qoLtFMMCqFSGY9SlxsH72QchyDaXhzjZcfDONtiFOGtznkBBsW9g+sn4wOdgnlg4vdvlhh1tV9n56A748UHZICGYfSPV7B6ki6jAzNsJLTqZl5z+Y6O+B/aIBF954Jewb8DksBDclFNsaVrrfEExnpYmO5+8xeLOF9xOH7Rp6my/RsZ6L8gwNb3hGrXIOrLdKCOE0dtmJ42VZQDfvArrmcydE08+AGF6qoRJQyeogmCWTIzMrT3+vjf2PEGtWD8EsXTwSPwkIZuniav2kIJilAdRYAYL9b0IaKJylQcI5GMCcFY9/ARsgfHzrCSGJAAAAAElFTkSuQmCC", hf = "data:image/png;base64,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", gf = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAhCAYAAABX5MJvAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAAUOSURBVFhHrZaLU9RVFMf3b+pFoVZUPhGI8MGAjIbSmE2vsXFGCx11CksqDBaWheVNCItEESoMQSAECyxvFOUlCPKQQKDlsTy+nXP5Lexv97IsW2fmO8zwu/ecz557zrlXY4wMQ9opX6SGH0Dqye0rxVNxvFMHYLwYBo3+iA/0h9/0WIn/UfpgH4I49IbUuSeSBdlSFF8jc+audO/tQsK73kgMel31f2kwF/IIIiFwB+IOvoLkkD3I+iAIusCdiN3/ooByXCsL6qhtQSQEeiPO9yWkn/RHhfYauiruYLDJhLaiPJRcuwDDsb30/WWC2Sndz/IMgs6Mf7mWfnn26cOoMdzAQFMtlhYXYG8LM9PoqS5HRew3SDvuS+u9RIakPkluQ+iCdiHe3ws5H4ei4WYKRrrasLK0pISV26LFgsFmE6qTY5AVEUT7X107JkkDuIagDfFUcPlfhKOVUj3xuAerKytKGPdsaWEeYw87UZ+TjJwzwVTAO5zjkKQQTJ0eHgCzMR0zYyOKS8+NMzc52Ify2K+lGZFCxAd4I+/zE5T6dsXN/2MddwthCN0r7SDn4yBSHfV90aXP0FtTAcvkhOJm+8ZZmB4dQmdJIYxn34fukHqe2LRpTeiUWfDL+Q9xv7RQpHR1ZVlx79qs83NUDx1oLsikog6B1o+KkwcaXxGSa0IC4SNaMjn4HTqW4/iT5kFZzGXSFTEPRumYlpesSji1Lf4zK9q3MS8VpdcjcS/xe5TfuIqfqTDZL49oKQQXhv0/uC1TwvajNl2LmfGNwhzvfoC/UmNR9uMVCpKGJy31WLYuim9z01N4VFkCU6YOpdGRMOenY9Zu7xjtLfn2KyQdfVsUoiOIE0R8wGswUmE+6+1SXKjt74E+NFDbVcRFEVScAKs2xBDcZcpULixTk8pKtXWV/Q5DyG6qC1s2NkCcIPgyMoTuQfHVs+iuKsUCpVhm06PDaPk1B1W6aHT9USyOQmYzY0/RXmzErXMRIsvrdWGTDcIJhGh/2vcCkmhR4ZcfoakgS3U07th4TxfqMhPEwOPxrfXzoqBvuQ/BvZxCPX2XLqWWwhzcLytCY24KGkhTQ4+VMDJbxciDNtxL+gHmWxkiQ2Yq0sILZ+gHEYDtKBzkBMGtmRERiPbb+ZinS8lmk0/60VNTDlN2IhVtPNVGL/13VXxbWlzEUKuZOikKTcYM9NdViWOwGWexmi6+5GAqTAmIEwQ/UnI/OYannc2KC7Wx80FzHeqz9aJ9TdlJ4ubkIxtuN2863DpuF9D7Y7d7EJyypKM+uEk3J6f0+cgwVpadh9Tc80nRQSOdreKCW5idUb5s2LLVimd9D0UXZdLjR8RxAFBB2IMwrXiY0IKs00dgytJjor97fS5sZdY5C2WyBZUJ1+ky9Eci+VFNTAepIOxBBAxtZBj+m3bCDzVpWgyTc+u8RQmntnkaWgONNWKgceo5MLel7AjWRXE0vMAViIChi4c7ht8EPEMqdd9hwFwrjoRfWFx4j2im3Ik6Dz1NRR77vEf4kgW2SfG/BuEAYg/gKF6rpdeSgR65pdEXxcT87dKnYh8/A8Sv5rWyoPay87kB4S6I4oTX8+uLgcQvt/vmUo7+SBqe5azNYKRAMufuSOaLtA6xbRCWLNBmku1XpIJwAmHRIpcwsoD2ku1xkEa0EQVzCcKixdsGka2VaA3CA5AtgWTfJGIfGkP4PmWoeAYjc+yueH9axEH8C3eTOZ+/XBfEAAAAAElFTkSuQmCC", mf = "data:image/png;base64,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", vf = "data:image/png;base64,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", wf = "data:image/png;base64,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", Cf = "data:image/png;base64,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", bf = "data:image/png;base64,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", Ef = "data:image/png;base64,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", If = "data:image/png;base64,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", Mf = "data:image/png;base64,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", yf = "data:image/png;base64,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", xf = "data:image/png;base64,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bzAzDVvF7a9fNa1hoWGfgFbKN4cvy7nGBy2C1IKWD7WwvFuR23q4Afdjjz1WfOMb3yjOP//8GOCuhoNenaphWGbXdnR0/K+gLr744oZGo+GF74HKLbfcsgk168GyH0I/pzZwGCYz/ZcvX1585zvfiabLRPUTsWohmWArZ/ieruY4wuwp/FB/i/SZNWCeerrc9r/6vbf3atjunpthtArXlzCt4jX7VeGY56GmY0/wmsu4u/cqjGpl24xvji+v6BSQ9evXF3feeWdx1llnhfVK/qw4N6vm6MU4neoXn/zkJ6NBoIvRMDTZMJIOcEfRFZJOOiz37N69+3qATMG/1oL42WF7W5H9jEx+7WtfKzo6Ooply5aFvmdQC0LncwIXr7WfCriaX28POU4Vns+BGRgH0jR0NtCBrB/09MfHuPklNeERJn01UC2OMG2acx7i4xvgR3p4XohMFHSNPCd6SZ1GutZpGHSPYJUwmV616IkPchnmew42ZHfKXPzTWN2e4p577il+8IMfFNdeey3HQDSebksej3EhR+P3MrTxXyUO49CkGscAWyAnd5947rnnJiJV/845fe8lUZsi8sU5YjgzWPb8owm7+eabi49//ONxspQ2Z11mMIk9JC4YnoIZKnjdICV8x3h27dzFRMt0JFo3QV833panRzB4mKn594DTJAJDn0XTilptiMtRuF7uN6AwfO973ytuvPHG4uqrrw5/BwsrvKPonoCHx3KE3l0f/vCHb3rXu9516H3ve9/Yu+++u6EF6cK9JAKcpFLdeuut1z355JN3MmruIRNGZPJ6ciKT7cq//OUvCyQPhG6AyLND98s1URaUHG+w90omBwuqIb742izbOtos33DDDbF2RMudswZer66jo6PYtGlT8cEPfjDK0HcruaEut0w/+WYoXRVeFo777ruvgHfjoFbX/zTP+oCHjlLe4/l2EPXrhi9+8Yv/AU7ydoNwiGeDiqVHKRzRinzuc5/7Maavu7EE3IAEQrM2Zh6nVkRGlXlkqssuuyyIK2El9OLFi+irpNOIcgYyY+e7aeVvPp8KTnzEz0N7xo4bV7z5zemoMvP5enUykAKiZVIT/intqM5D1SuFLJeXwmxlrcp/7733FkydKhYuXBjDEXbUqzzHM8cbHue8V06omjbt+1/4whf+EwEpaD0KWo8u2e/SgpQh9Pc68dnPfnbV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", Vf = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAhCAYAAABX5MJvAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAAUhSURBVFhHrVf5U1RHEOY/SqpyVA7RxGASwFLOFUhQi1OKcERTMVbwqPxgUhHyg+deyHILiBQimgBlkWwqsZDDwEIIlwZYYCOXIovh2E53v/d2376dPcR01VdTM6+3v29menpmw8wpEaBP2MUwKEh8zw2jFrr3vWBS48BuvzCLkBwB9V8mQ5gXuUZEIAEvRZ70gRvlGdEQ5iH3zN5HgEz8IgKE5ASVAI8ImTQUAV7E2F6JfRcu7X0T9NiaDkjjQmIFGgEsIlMgwiPA/+ypb07aDQ1HD0PbuSJoKDwIpRiQvoVKTv6ECo8IDKxAJhGRK0utj9sBNTmJMP57J6w/d8LYr3ehNkcHBhz3R6pAIfcSISJWQyuAxi5GvQb1BamwMPkQyBanHnH/UvTr6EOrFJoAjwiZTATfFQjnrbp5Mg9stxth7ekyi6DWdqcRWk7lsb8hfmdQcgUBRbgF6KTZG/EEXT+WBkNtzbDy2AEu1xYLUIz6K4/n+HvjF+lgQrG0NSJiNfyKUMgl4MxQQMupfJgbHpApJXO5XLC1ucmt2ub+7IdbpwtYSKlWCBao0uQgItzk8hYYE3ZCXf6nMN3fLVMArK85YeLez9D2fRF/oxNC/fW1NdkD2L8B88ScuEsjQIa3CFpuCT4CSBjOpvvaVdja2ODgq0vz8Iu+GCwHI6EmOwGqETVHdGA5FAVWfQl/J9vaWIfuujIwYwzeFrUAhlqETKiFPnYHn4LKzFiwD/Zx4E0M3FN3FSrT9kFfYwU4lxZYHLXUr0zbDz31ZexHZh98AFWZcXA5+g0wYrL6iECwCJEAOma1n6VAy+lC6KoxgnN5iYPOT4xA01fZ0FVtAhfmgtqoT+NNJ3LYj2x1eQHHDNB6phDq8j5xE6uFCEUYMAcq0mNg1NrBgdQ28dtdXP5EsNukldGafaAXqo9gEUM/rY1Z23FVYjBZMUfcYvyJiA/HQDqY7OuSf+6xkc4fcf8TwTEyKI94m+MvG1ZSHU6gXR7x2FTvPf5mwkm6E1XJCa0IOpJUYG59cxS6as1Ykjtg3bnKgWZsvXhPHAJbayP3tTbQeh0aPj8Ms3hEyf51PuMVuI9xWjEeEyMHtUoh4wvMRwQDb8j9b8P5D1+B2twk+Gd8WAq6ugpWQzHU56fC9EAPjyk23d+DxzUVrMYS9HvGY46xYf79hY9eBQPetEr1VAQEESFDh1UPHQewRCsFaf7RKCZsAVRlxcFP352Ajh/OcFuVFY8FqhC/j7EfVVDb7Ru473swlv/7JKgIOt9GzJHmr3NhcXKCg5M9mbXzqanOjofzOEtqqf9kbkb2wEttchyai3K52InIFYQkQik2nRfOwsq8Q6aQSvZTxwzMPxzlVl266Q7pvHgWSeQYAnIF/LISkWtBVbM0KQLai0/iPg+5q6fWaHx26A8u57QNVHFFxGqELIKBQugmrcqI4eSzY2JuPJfuCmqpbzWUQCXWGPJTTlkwvJgIBN8luMd0cpqOZ8Hi9N8sYglb6tO4WwD683YEQXlGFIpQXVih4krMO1iGU3D2UuWcenAfruFR1OM4k/tDQBFa4A8CgXMkZQ/c+fY49N2o5LcDkbhXIBBUAkwIi0eE8pDRAH/kF/idHryX972FD9xwMaEGPjEUEdJDJghEAQQISOgHlnRZhAKhAAWCAP8HLOmRouddIIgDvQwkEcH+8IggCLZdWNI+pufdNkQQBAG3g/KsvRBWe0wHZajGF5GoMghwKbcN5CABN89lw3+ZHqR2AaB1yQAAAABJRU5ErkJggg==", Rf = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAhCAYAAABX5MJvAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAATPSURBVFhHrZb7U1RlGMf9h8oZ0bhZOBOIglwWFsqMuAtOY9Zojd3sF6uhMmDZC7cl7hAXTZpCKC5DhKQwoQ4TKJRmMaFDCCG3Bb49z7vvYc/unrPsZs/MZ87s2fd93s8573Oec3Y1nDHCnhm9TaVCxpNhzzwkqFLIot9q6Fx17hFcKsjFrtKU51BqdGFL3olnnSR5oDmWcqoxRnhRlR1DEuJPFfRbK5k7GhJqeEySRDXPSyg5AvZXokhCLSBRT/TEkhiG4pi9KIzejcKop1EY+RRBx6jdKD68B5aEUG8hFW4ihD39oP8SlsRwWiQIFUcjcfmD19FT8hEGyi/gh/LPMVB2AT2mD3H53ClUvBiJ4kMsE+aXjK6EgjLBHB+Kckre/dk5TPR1YmnuIbSCz0/0dqLr0/dR9sLzMMeFCAGrWkZB5q5M19kOBRvBArXHk3Hz6xasLS3K5XzH6tI/uEHja3OTUBIXLCQUApawGkiAEk3S1WNLruBv0PjJ/iuooQswx4foilToFSZjSwpHxbGDdEVfYmtzQ2YOLLY2NzHW0UxbGSUKWl/Co08omOOeQS8V24reFmxtYdPhcLKhL7my+IiK9jxMsft2kFCQAtbEUNTlJePe6FWZyj3mZ+6jz1qA6sx4VKXHoulkGsa+atKtmXujQ876oG1RC7hqIoWaxjYsEUHWQej65D0sL8zLNK7YWF/DT40VYlx1ZhyqsxJogWTY0w7j1rcX6QZ5F8/ywt/oLHgXRdRHnAI+JQi6E1zR15rsMoV7bDjWcXugG7e+aRNCHAuzf6L5tZfRa/4YjrVVcc4zWJy3xJa0f1tAV8JqCENtjgFTQ/1yun7wVT+Y+gVXCt4RVzjaXkf14ZD/usfUUB9qshOdHVUKcLPSlLBQPTSefAl/3ByR0/Xj4a930HwqTXRTrpFHVCt6wfkaXj0qHle/JJr8lLh/YwQXz+ZjpKVGdxuU4HyNKgnRtmnrK0Xb9pIIQ/2JVPx2/Uc5XT+4M87dncb6yrI8ox+cry4vRXRgISGeRHqLakko3ws/X2qU0/Vj4a8Z3L0+iMXZGXlGPzif1bBfoAgIiQwNCaY4Jgg9xeextvxYptAOLkRT7F5x9BWch/MV0duV30d+SXBdtJ7OwuztcZlGOyb7u9ByOkMcfcWD6Qm0nsmhrQiWEk4BnxJsajWEY7ihlHrBukzlHY7VVTyenxNHveBeMlxfBgvl421W3wWnRLSOBMH9oua4AdPDO/cLXzF9lfoD9R1zIj0VHgI7SjAWEml7Kwcz42MyZWDB81rfzBbbywKaEvRlv6s09QAtqOAScOLclva38/H72DXxavYneByPbz+bJx55m5GeOA0BdwkFLRmazCK1eUaMttVQkU3qNiY+z/+P0Dj+GhMC/Mjr3AXO7y2xLeMcoMZCL56ShBDUnUjB4BclGP+uA3cGvxfvBD6Od3dgsMqEuvwUemUHi61UFrfRgoynAONDgnENZGwC+uqmLy4TffBwLymK2SNezwx/iZuO7PNY3CXgJqHKqy+hoBrslNBheyHvhbehcep8CjtLMHKw18JaeCzqiXpxBf8kGBqslTRQPAWYACQOaCYNlP8uIR9b2/8goitRdizS5+LuEk8m4iZAdVOaGoH6N4z4F4ltgtiZBjuxAAAAAElFTkSuQmCC", Sf = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAhCAYAAABX5MJvAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAANySURBVFhHvZf7S5NRGMf3FwXdlbKCEm9ZmUo3KieSkYUoBGKUZGU/VOqcu9nmIIOZWnmjm2JeE8qgkkzdNIUidbO85nTTp+ec7dV3xzPf17k88OFl87zP97PnPedsKsqzT4MpORJMSYgyQJIiKMb1cB5RRoAF8xX6xAOgT9gP+vh9eEXINUB0sgkD3XEPJFtBCxAJAfJ6A/BDOXgldHF7UUIsECQRAjeYB4rwJcTgRBZNbAioIrZCYfgWKEDIVRW5DTRHQlfN5QYzSEuIIK0rjt0NlitnoEV/Dz6Um6CrwgzvLUZoUt+BsgvxKBJC57EyawnJltBiYV1cGDQW3oKR3m5gh3thHoY/dkLNjXTQHtuDbZYvIkvCs5r3QVNRHsxNTtDQ8eFB6Hykhe4XVeCad9L3yBizfoNnWRdRmIjg6scQKRGFgRPqA5mIn6oiQwmOQSsNGnjXDG0l+dDX/ApGrT2w6HbR94XR3/IaSk4cpB1hBcT4SIhhJcgkckObsYC23DFkg1YU+NXz2Ru5ekyO/ITn2Wm0G3o/3RDgSrAiwoHypa6CBozZeuFTjQUWXb6fXjzmpiehUXWb3uvvkYjhSgj4SNRXYfklWFp0Y0cWPGl+hnNmCndLXnAkCHpclESi3awGl3POG7P2mLaPQN3NDBTAHcUJZZGUMJCJWKwSF6bd1ueNWXtY2xqg5OQh3Na4JrDGMky4gLQEQrshbNEpzxb1N+yD/VB9/bLnUZAQcr8YRkC2BIGcggYs/Baf9WjfV2/kynAvOOlhVZuDhxU52LyPkUugEgTyWDR4bD9JPwuthvvQUVoE7SYVdCCNhblQlpoAmqOhy4tZFuuVEFBH7wDjqXBoeJADbQ/z4eXdLHo4qQ/v4gdJEJBEccxOqM6+BLO/7fRROIYGoDJTSbskzOGF+SNwiWtpMPvHQSXI9wgrIcALZdlQJ2bGx6iE47vNr4QAL1xg0yQIPAHCpkoIBE2iBtfE34lxKuFZE8myJQjSEvhvgA/M34txKz69moJf2T+oxHBXJzxOTQQt/sZk50rBSDDBPLxzyelZei6K/s7seVML9bmZWMxz+q3Ukw9KcMJkQAJJ+9VR20GLpySvuFwUvADZcAoGwsYkxHCKyyV4EgKcECmCLyHACfPH/5MQ4ISyKMwp0fybgw0nnGBOiYF/Afga1FffGGwAAAAASUVORK5CYII=", Tf = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAhCAYAAABX5MJvAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAAOJSURBVFhHzZX5TxNBFMf7D6kRD+QQRUFaKacIQVGg0aAx0fQHjEqC+gMkJEopbZejWxAkAQxGBSEVY0U8YrwSDEbKFQ8IBozEiyiHz3nT3XbZnS67hB+Y5JNN3sy+7zcz780YWs/ngqfQCHx+EvAFa4dbBb5QwGKC1pI8MNRk7YKaA3GrYKcqXJA4BdI8tQd3ExOZ+NPyCX0oDYRgrZdB9A3MCd2wDCCstUrWyISIfgPIGptYHWwTpFhdadFgN0ZAVdJmSnXyNnp+ztQdUGUMxDRD1jtTo2helh7TBArdPFcE73o7YfSpj/KsyQXuQ/ugp/ws+Pu8wbgW/H33oPPiGag2b1doIUwTdtMW6K+/CtIxM+aHpuOZ4H/UK0T0jfcPesB9OAlc6TEKvbAmHrsrya//AhnImBkbhkZLKrxo4+Hv3C9YWljQzPzcb7qTrvRo4BhXgqFWFkDw/L0VF2B28hP8+fmdgtuKx1GfmwDXi7Kg5US2ZnC9OzcRuAzlLiBME9hiddl7wHPEBA1HkyloAOdwOx0pkbphHYMINaEwQqoYi9OWuAkqEzZQ7KYIoTui6HFh52iGrHemqXQHywSXEQuNhSlwq+QUdF6yUtqt+eSej4dmUpx3Sk8H41rA9dcsaQEjMi0kaEJqxL5/K/iqy2Bxfl4oS4DJwTe0MAe62oWIvvG6o5nuJJceS75ER4TosU2Q7XvitsHS4qKQAmB6ZIi0aAZptW4hom8Mem9Dfc5e4MglSB9NiZFlJkQjaKKPqxB+D4zp0SHgSaF2FB+D5y118LKtYQU8QXD9DWsBOMyBW1eOwgSC/dxyMgd8jnJyX9go3WXFtCawfWnBJm5URyhoxEZwiLelVhOh7gglqyJVTn8i7YuFuyKkJaXUkJhcXIRtgoA3G+5IiECfo8DyOAPSBXKoEZm4CNOEwxwJXZet8HngFcyMD1Pe3m0HPs8IPmc5TPkHg3EtfCHre6+U6quJ0NsRGviA4R0x3H9fiOgbQw+9wOMDFuyOVZj4Oj4CDQVm+rp+m/gAP6anNDM78ZEWOS1OmYGwJpjH0d1BHy+sCXxX6nJkYCw7ng3pKioYpjj1FyaNxygh26wGmmcZQMKawEkuU9Jy+IM4x0KSVC/hTeiBkVgPTBMIU0wNRnKtrG8TCFNMDYaAFlRNIEwxNRgiK7E+THgsRqa4FKaYGgwhFtj2vMUI/wEAF0bZnjkGWwAAAABJRU5ErkJggg==", zf = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAhCAYAAABX5MJvAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAATFSURBVFhHrVdrTxxVGH5mZnfZZaXulksRsLRIi0JJpVq30Vg/aBPT0MaIpibYGlOT1i9G/4H/wjTGmGhjE79o/GQaEy/V9CLR1ngJLQjlIgULC8zC3mZ3fN8zM8vMzuzsAj7k7Jw57znnfeY9z3vOQfpo+Jiu5fKQYIPkeHPB1+o/FLr5FBVZQsPDzZCZgNW2AefbpuAz1GFisrqOzNIqZKPFQK1EqlK0deCqVSrBQaKEql6ck/uVWuAiURooKhWmIc3oxQKyaylkVpeRS6/Te9E0mqiVAcE7EhYqENEyaQTqIug/PoRnzr6L7mdfgKQoKGiGvkrgoVbxgXKib8/7Zr0El8Bt2aJls4g8GMehV9/Ak6fOor3/ENoPDKBYKGBx/DYK+RxkIuQJj8yRg4EaSRD4Y4oFDfGOTiSGz+GxY4OQAwFhC4YjaO3pgxKqw8KdP6HlspWJlEEOVSDBsBPh9ebS2nMAiTNvY2/iKAXHuZJKMIiWfb2IxOJE5C/k1tcgy9Snyp5TEwkOM790HDyMI6fPo633cdPiBn99U9d+RJtbsTx7F+mVpBgr+RCRQ4o/iaKmQZIV7CPhJU6fQ+OebsPoA3bYuLsLsfZOqPdmkbp/z2yXPfWpUCQoXt7S1fJ5+rIA+l58CU+9fh6xtt2mpTZ09D+Bp998hyKYIA86CqSnSr6UQYqE5FAAUCBhBcNhDLw8jIGhM6inbNgKojub0Nzdg2wqheT03xTZgilYi4wkImGSMBoYrIH6+E4cfu0tHDx5Sih/O4jsiGHX/l5K3TwWJ8bEU6YltiCEyST4xdLAA00tZgqerDnNqiEUiWIXZRZHePHuOHT6UEusTKKkFn5wfjd2PoKuI8/5KnorqIs24NHnjyNOgtVoQ7PDSHZmQEUOBLE8N42JG1ewQsrms2G74OVN0/myNDOJ8as/QL0/L/yYLsWvMti7kaIc/rS6goXRP0hIE2hoacOOllbTujUUaZMbu3IZ1y9ewNQv15BRl2ljCxlG/nAjRZ1g0agLc5gf/R25/yESvKwr8/9g5tbPdNquGQT4xKULjRULFwkGh0sJhWmj8jSL03LmtxH8+sVF3PzyEm5+dQmLk3dMqxsKzRcM1xtZYfh1wNuLwAbTcmTUVYx++zWuf/YhRj7/GNc+uYDb31+mEzZj9qgMa9ZSoR8fEpXBKcYXmTwXulvk1+lyo6okwrKLjQ2WUzd0yN4GYy0rpim1s4h5WxdPOtL5UrMp2FiJSLiIkG/OZVa2F1gr5QT5oPPSkOhr2yHtzi3QKKPV+uM6D0wtLiA5OyU6lSNPd4X08hL922A6JUI5WhLXPZPB1/qUWqpb/uyF9olO91FOk+p6ERpfYGn91X/nkKTNhsvS1ATGfvwG07duiD5WQLLrqthxM7TPWH2T05OYHPkJE1e/ExtfeaSYAl/vpA9eOcp1T/BZouUy9IW2LuSUUzhAVzn7knAUODvEJcgCDZMUmfqGHeeQ3WEgSvP4kdg0qszkZWYSbiV5gUfbixcqtRM8h5UaKUX5sWlYE9hLGZwm2xuL0yFQzg7j6Q9nNvrCmNruxObAVi2B2uQtxsIFe4q74NPMm5z06XtDOv97vh3oIry1w1gN2o8CCmLdD+E/4YUVT2wGYzwAAAAASUVORK5CYII=", Pf = "data:image/png;base64,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", Df = "data:image/png;base64,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", Bf = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAhCAYAAABX5MJvAAABfGlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGAqSSwoyGFhYGDIzSspCnJ3UoiIjFJgv8PAzcDDIMRgxSCemFxc4BgQ4MOAE3y7xsAIoi/rgsxK8/x506a1fP4WNq+ZclYlOrj1gQF3SmpxMgMDIweQnZxSnJwLZOcA2TrJBUUlQPYMIFu3vKQAxD4BZIsUAR0IZN8BsdMh7A8gdhKYzcQCVhMS5AxkSwDZAkkQtgaInQ5hW4DYyRmJKUC2B8guiBvAgNPDRcHcwFLXkYC7SQa5OaUwO0ChxZOaFxoMcgcQyzB4MLgwKDCYMxgwWDLoMjiWpFaUgBQ65xdUFmWmZ5QoOAJDNlXBOT+3oLQktUhHwTMvWU9HwcjA0ACkDhRnEKM/B4FNZxQ7jxDLX8jAYKnMwMDcgxBLmsbAsH0PA4PEKYSYyjwGBn5rBoZt5woSixLhDmf8xkKIX5xmbARh8zgxMLDe+///sxoDA/skBoa/E////73o//+/i4H2A+PsQA4AJHdp4IxrEg8AAAILaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA1LjQuMCI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIj4KICAgICAgICAgPHRpZmY6UmVzb2x1dGlvblVuaXQ+MjwvdGlmZjpSZXNvbHV0aW9uVW5pdD4KICAgICAgICAgPHRpZmY6Q29tcHJlc3Npb24+MTwvdGlmZjpDb21wcmVzc2lvbj4KICAgICAgICAgPHRpZmY6T3JpZW50YXRpb24+MTwvdGlmZjpPcmllbnRhdGlvbj4KICAgICAgICAgPHRpZmY6UGhvdG9tZXRyaWNJbnRlcnByZXRhdGlvbj4yPC90aWZmOlBob3RvbWV0cmljSW50ZXJwcmV0YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgoPRSqTAAAAu0lEQVRYCWPc1tz2n2GAAdMA2w+2ftQRsFgYDYnRkICFAIweTROjIQELARg9miZGQwIWAjCaBcYglla0NGfgFhLCqfzvnz8Mt/cfZPjz6xdONegSJDtCWleXgVdMFN0cOP////8Mj8+eY/jy5i1cjBCDZEd8//iRgUtIkOEf0MfYwP+/fxlADiEFkOyIsytXk2I+UWpHywlYMI2GxGhIwEIARo+midGQgIUAjB5NE/CQULWzhbEHhAbZDwD01yRQcPLsTAAAAABJRU5ErkJggg==", Gf = "data:image/png;base64,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", kf = "data:image/png;base64,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", Nf = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFgAAAAfCAQAAADJwcJrAAAAAmJLR0QA/4ePzL8AAAUASURBVFjD1dh9bJ1VGQDwp12/lm3ANuqFfcjoRANKJpQs0wE2MCGCDtQ00whubKDiooxMVExYhelsLJuuCkGnUTBGM2fMYGHiJmNuGQNqILpAFUm28jG1rGx2bG1p+/OPnr67t+uyy2Js+j5/3fec+97fPfec5znnxpVtu7tbnEo80/3UoVOJJ/fveuVUYse+i5+L6+Nxo+d6oq/sntg2isDbnb1mWPDfNFnko+b5lGU2OZK17NQ4gvF5U5qPA+8wWwyJ8RocBj0WHtf6/4wpPywAd7lZiRDOd6tGq9xmngohTLcL9LlpBMFn5YNfN0cIdf6gP+9rHNJoolDpIfCWuf8zQInxbw/8gwzc4wqh0r0F2MHrNZcIZbaC55Vnj8ilL9FitvCyu4TwT18X2sCrVghzHDQzved+m4RSDQ7iz84tGpw7Br5TKLE+D9mrQ2/26k0fECb5N1hWAF7iPL/z9DDgtWrcpU+lS/Hu9J4HbRc+64j5zrfdY8WDBxfdK8YKSzPe710uhHIX+VW6t99Zwu3g5WyMc7hWaNY6DPgRn7PBRjEM+DG/FMLpzikaXD0IHhixUh+3EysLOp3njUS+X6jSTkIemxIctWAY8E6NttrrHcOAn7FWCBUmFg9eG9vQb5pQlW5epFQIM9zhM2bYl417j5zwM3BfHniBicqE8KxmocpRNwltvimMR/0w4B/bo1JY5aWiwZMHwM8KJfZZ54KsqcKeNHL51y3CJ8HTQ6bEQCzXY5MW7XJCm5ds8YIOU12K5+y22wUJPF2bv9us1+Liwd+PbdggvAv025g1nuZ2e4dki58Ks0BH6lWl3tl5j7zScl+UE8K16tWrlxNylqQ40+WuEcKZlljug28jrU0aADenRQH7CjqUmufhPPBmoToVkNIRKByTvpeB5ybSP1LT3b6UJfW5fqsPbMnA/Qk8Ro0aU/MeWu592TKarkaZUKImywW5rPcZxglTVA+UXZNOCj5jAPwbYUYCH06QpejQmD18pmadfn7clBjMEgfcKISP6ADNSoVWzBfmoD39ZnsdNkEIe6wWdnhdtbDNd08OXpO36F5NHz03zeC/gG4PeX/qPtGF2aJ7siBL1GjSbaZqBzUqN8dRi4VWfR4UVnkrget06XBDAZifFAk+bU1eWrsvgR/OFt2n3eA6Xfija9K2aDCtNQ/JEhW6LXY9ThfCRhuEVlv9R5UXPZrAv7DBAx4vAD+q2+ziwKvzCkeNnkRemeFC+ETaXTyvLq9wXD0EXOJNX7BAv0oh/NojQquv+pdv6HSrdmG8Tg2W6TM9D/wd3/ZXO4sATxgEv2acsCrLBltcYYJQ5sOeyGbpFOGOVJrHDAEv0u9C79TtFmGqA74itFruR45Yb6F2YZGjWrTodGcBeJy9eosB35ttfu4RxthYkHXfyCsbR9QJubSklhZsfjod0m+FEL6syws6bTU2gS/DdQm8wzohrPaikjxwuIoiwOOOgXtdJZRbN+xpar/LhHJ/SpOjMi+J1apVm0pFCNPMV5sm1XvllKpVYbJZwsUphU1Wq0ytGuE9KRPNMu3k4Ka8DfyBtIG/2lNDxrlJdd4GvsslI3biGNt0giPSORZaoVGDjxmbxm1XKhg3j+ARaQj4xIfQFekQyua0PxiJqDO28YTH/Bt9yGzz3VZwzB/p/yWqvjXK/kgZdeCKldFg/aiJu1WsjPjaqIra/wK5cxOubJVgiQAAAABJRU5ErkJggg==", Of = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAhCAYAAABX5MJvAAABfGlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGAqSSwoyGFhYGDIzSspCnJ3UoiIjFJgv8PAzcDDIMRgxSCemFxc4BgQ4MOAE3y7xsAIoi/rgsxK8/x506a1fP4WNq+ZclYlOrj1gQF3SmpxMgMDIweQnZxSnJwLZOcA2TrJBUUlQPYMIFu3vKQAxD4BZIsUAR0IZN8BsdMh7A8gdhKYzcQCVhMS5AxkSwDZAkkQtgaInQ5hW4DYyRmJKUC2B8guiBvAgNPDRcHcwFLXkYC7SQa5OaUwO0ChxZOaFxoMcgcQyzB4MLgwKDCYMxgwWDLoMjiWpFaUgBQ65xdUFmWmZ5QoOAJDNlXBOT+3oLQktUhHwTMvWU9HwcjA0ACkDhRnEKM/B4FNZxQ7jxDLX8jAYKnMwMDcgxBLmsbAsH0PA4PEKYSYyjwGBn5rBoZt5woSixLhDmf8xkKIX5xmbARh8zgxMLDe+///sxoDA/skBoa/E////73o//+/i4H2A+PsQA4AJHdp4IxrEg8AAAILaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA1LjQuMCI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIj4KICAgICAgICAgPHRpZmY6UmVzb2x1dGlvblVuaXQ+MjwvdGlmZjpSZXNvbHV0aW9uVW5pdD4KICAgICAgICAgPHRpZmY6Q29tcHJlc3Npb24+MTwvdGlmZjpDb21wcmVzc2lvbj4KICAgICAgICAgPHRpZmY6T3JpZW50YXRpb24+MTwvdGlmZjpPcmllbnRhdGlvbj4KICAgICAgICAgPHRpZmY6UGhvdG9tZXRyaWNJbnRlcnByZXRhdGlvbj4yPC90aWZmOlBob3RvbWV0cmljSW50ZXJwcmV0YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgoPRSqTAAABU0lEQVRYCWO8ffDw/9uHDjMMBGBiZmZQtrZiYBooB4A8/e/vX4a7R48xMA1ECCDbCXLIgDsC5KBRR8CiZTQkRkMCFgIwejRNDKqQYIG5hhxa28uDgV9SkuH17TsMlNRBFKUJQWlpoCMkGKT1dcnxA1wPRY4AVT4g8Pf3b7iB5DBIjg5FS3MGbiEhhj8/fzKwcXOB7WTn4WHQdHVhYGZjZfj75w/D7f0HGf78+kW0e0h2hLSuLgOvmCiKBawcHAwK5qZgsf///zM8PnuO4cubtyhq8HFIjo7vHz+Cffvr+3e4uSCLf//4AcHfvjGA+KQAkkPi7MrVcPMt4mMZBGVlGL6+fctweMZsuDipDJJDAtkCZlZWMJeRiSJjKGvU/Pz8GeyI///+IbuNZDbJ0YFswxmkqEEWJ5VNWTiSahsO9aOOgAXMaEiMhgQsBGD0aJoYVCEBADSyXGYw+pZvAAAAAElFTkSuQmCC", Ff = "data:image/png;base64,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", Uf = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHQAAAAhCAIAAACHuxg0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAIGSURBVGhD7ZrPT9swFMdrk4SSpChoYtJWcYEzZ8Rfv6m7gWDsiHboxi4RAmVpm4Y4/rGvW4shTUINq095H6lOnmPl8Onzy+GZmRVKKSEExgHxVoIgCMMQo4sHA6a1rut6sViQWYcxAkZmM91JiLE/yE3T0V68Nxzt76YJq6qqLEv4TpIEzxhj68X9BJt4WRQ/rq4eplMpxErZRpiBQZqKRmijkzR9Nx6fnJ+zPM8551mWwaxb2GOQrb9uvt1OJmK5dFNdWJcB/EXpaDQ+PeVSyjiOX1aKPmMzt/zdPj25uCNI0ygKldZt2y4eH7gxthL3vBq8xGhs8Y3LwT9wxqHS4C3acFgls9vECnW33F0JD5Bcj5Bcj5Bcj5Bcj5Bcj5Bcj5Bcj5Bcj5Bcj5Bcj5Bcj5Bcj5Bcj5Bcj5Bcj5Bcj5Bcj1i55j9aRsQrcDK7XaxPa9T20Wzmtm1rp4ltoLWG2HXPl4dhWFUV+d0KSqm2FXwFQlbXdVEUCJIkiaKo5212JeX3yZfp5aVBAnbDKKVhVmszHA6RstnHD/YgXtM08/lcCIElf5vuvcQeZ/p6/fPiAqrc1AasPlsG6vjODhI0CAIk6+HJsT1CiifIZyklRCPss198jGZ5fvvpc5nnnfwCbHrIxcg4j7Ps+OzMySWeQUGY3d8/3t3Jxm7lNwDF++8PD46O/gBK2P0OZOpxlgAAAABJRU5ErkJggg==", Ne = {
  "Maplat.png": uf,
  "all_right_reserved.png": ff,
  "attr.png": pf,
  "basemap.png": hf,
  "bluedot.png": ke.bluedot,
  "bluedot_transparent.png": ke.bluedot_transparent,
  "bluedot_small.png": ke.bluedot_small,
  "border.png": gf,
  "cc0.png": mf,
  "cc_by-nc-nd.png": vf,
  "cc_by-nc-sa.png": wf,
  "cc_by-nc.png": Cf,
  "cc_by-nd.png": bf,
  "cc_by-sa.png": Ef,
  "cc_by.png": If,
  "compass.png": Mf,
  "defaultpin.png": ke.defaultpin,
  "defaultpin_selected.png": ke.defaultpin_selected,
  "favicon.png": yf,
  "fullscreen.png": xf,
  "gps.png": Vf,
  "gsi.jpg": ke.gsi,
  "gsi_ortho.jpg": ke.gsi_ortho,
  "help.png": Rf,
  "hide_marker.png": Sf,
  "marker_list.png": Tf,
  "home.png": zf,
  "loading.png": Pf,
  "loading_image.png": Df,
  "minus.png": Bf,
  "no_image.png": Gf,
  "osm.jpg": ke.osm,
  "overlay.png": kf,
  "pd.png": Nf,
  "plus.png": Of,
  "redcircle.png": ke.redcircle,
  "share.png": Ff,
  "slider.png": Uf
}, Dn = "ol-hidden", ji = "ol-unselectable", qi = "ol-control", Kn = {
  /**
   * Generic change event. Triggered when the revision counter is increased.
   * @event module:ol/events/Event~BaseEvent#change
   * @api
   */
  CHANGE: "change",
  CLICK: "click"
}, Qf = {
  /**
   * Triggered after a map frame is rendered.
   * @event module:ol/MapEvent~MapEvent#postrender
   * @api
   */
  POSTRENDER: "postrender"
}, jf = {
  /**
   * Triggered when a property is changed.
   * @event module:ol/Object.ObjectEvent#propertychange
   * @api
   */
  PROPERTYCHANGE: "propertychange"
};
function Hn(t, e, n, r, i) {
  if (i) {
    const a = n;
    n = function(o) {
      return t.removeEventListener(e, n), a.call(r ?? this, o);
    };
  } else r && r !== t && (n = n.bind(r));
  const s = {
    target: t,
    type: e,
    listener: n
  };
  return t.addEventListener(e, n), s;
}
function ta(t, e, n, r) {
  return Hn(t, e, n, r, !0);
}
function hi(t) {
  t && t.target && (t.target.removeEventListener(t.type, t.listener), da(t));
}
class lr extends ua {
  constructor() {
    super(), this.on = /** @type {ObservableOnSignature<import("./events").EventsKey>} */
    this.onInternal, this.once = /** @type {ObservableOnSignature<import("./events").EventsKey>} */
    this.onceInternal, this.un = /** @type {ObservableOnSignature<void>} */
    this.unInternal, this.revision_ = 0;
  }
  /**
   * Increases the revision counter and dispatches a 'change' event.
   * @api
   */
  changed() {
    ++this.revision_, this.dispatchEvent(Kn.CHANGE);
  }
  /**
   * Get the version number for this object.  Each time the object is modified,
   * its version number will be incremented.
   * @return {number} Revision.
   * @api
   */
  getRevision() {
    return this.revision_;
  }
  /**
   * @param {string|Array<string>} type Type.
   * @param {function((Event|import("./events/Event").default)): ?} listener Listener.
   * @return {import("./events.js").EventsKey|Array<import("./events.js").EventsKey>} Event key.
   * @protected
   */
  onInternal(e, n) {
    if (Array.isArray(e)) {
      const r = e.length, i = new Array(r);
      for (let s = 0; s < r; ++s)
        i[s] = Hn(this, e[s], n);
      return i;
    }
    return Hn(
      this,
      /** @type {string} */
      e,
      n
    );
  }
  /**
   * @param {string|Array<string>} type Type.
   * @param {function((Event|import("./events/Event").default)): ?} listener Listener.
   * @return {import("./events.js").EventsKey|Array<import("./events.js").EventsKey>} Event key.
   * @protected
   */
  onceInternal(e, n) {
    let r;
    if (Array.isArray(e)) {
      const i = e.length;
      r = new Array(i);
      for (let s = 0; s < i; ++s)
        r[s] = ta(this, e[s], n);
    } else
      r = ta(
        this,
        /** @type {string} */
        e,
        n
      );
    return n.ol_key = r, r;
  }
  /**
   * Unlisten for a certain type of event.
   * @param {string|Array<string>} type Type.
   * @param {function((Event|import("./events/Event").default)): ?} listener Listener.
   * @protected
   */
  unInternal(e, n) {
    const r = (
      /** @type {Object} */
      n.ol_key
    );
    if (r)
      qf(r);
    else if (Array.isArray(e))
      for (let i = 0, s = e.length; i < s; ++i)
        this.removeEventListener(e[i], n);
    else
      this.removeEventListener(e, n);
  }
}
lr.prototype.on;
lr.prototype.once;
lr.prototype.un;
function qf(t) {
  if (Array.isArray(t))
    for (let e = 0, n = t.length; e < n; ++e)
      hi(t[e]);
  else
    hi(
      /** @type {import("./events.js").EventsKey} */
      t
    );
}
let Zf = 0;
function Yf(t) {
  return t.ol_uid || (t.ol_uid = String(++Zf));
}
class na extends Aa {
  /**
   * @param {string} type The event type.
   * @param {string} key The property name.
   * @param {*} oldValue The old value for `key`.
   */
  constructor(e, n, r) {
    super(e), this.key = n, this.oldValue = r;
  }
}
class Lf extends lr {
  /**
   * @param {Object<string, *>} [values] An object with key-value pairs.
   */
  constructor(e) {
    super(), this.on, this.once, this.un, Yf(this), this.values_ = null, e !== void 0 && this.setProperties(e);
  }
  /**
   * Gets a value.
   * @param {string} key Key name.
   * @return {*} Value.
   * @api
   */
  get(e) {
    let n;
    return this.values_ && this.values_.hasOwnProperty(e) && (n = this.values_[e]), n;
  }
  /**
   * Get a list of object property names.
   * @return {Array<string>} List of property names.
   * @api
   */
  getKeys() {
    return this.values_ && Object.keys(this.values_) || [];
  }
  /**
   * Get an object of all property names and values.
   * @return {Object<string, *>} Object.
   * @api
   */
  getProperties() {
    return this.values_ && Object.assign({}, this.values_) || {};
  }
  /**
   * Get an object of all property names and values.
   * @return {Object<string, *>?} Object.
   */
  getPropertiesInternal() {
    return this.values_;
  }
  /**
   * @return {boolean} The object has properties.
   */
  hasProperties() {
    return !!this.values_;
  }
  /**
   * @param {string} key Key name.
   * @param {*} oldValue Old value.
   */
  notify(e, n) {
    let r;
    r = `change:${e}`, this.hasListener(r) && this.dispatchEvent(new na(r, e, n)), r = jf.PROPERTYCHANGE, this.hasListener(r) && this.dispatchEvent(new na(r, e, n));
  }
  /**
   * @param {string} key Key name.
   * @param {import("./events.js").Listener} listener Listener.
   */
  addChangeListener(e, n) {
    this.addEventListener(`change:${e}`, n);
  }
  /**
   * @param {string} key Key name.
   * @param {import("./events.js").Listener} listener Listener.
   */
  removeChangeListener(e, n) {
    this.removeEventListener(`change:${e}`, n);
  }
  /**
   * Sets a value.
   * @param {string} key Key name.
   * @param {*} value Value.
   * @param {boolean} [silent] Update without triggering an event.
   * @api
   */
  set(e, n, r) {
    const i = this.values_ || (this.values_ = {});
    if (r)
      i[e] = n;
    else {
      const s = i[e];
      i[e] = n, s !== n && this.notify(e, s);
    }
  }
  /**
   * Sets a collection of key-value pairs.  Note that this changes any existing
   * properties and adds new ones (it does not remove any existing properties).
   * @param {Object<string, *>} values Values.
   * @param {boolean} [silent] Update without triggering an event.
   * @api
   */
  setProperties(e, n) {
    for (const r in e)
      this.set(r, e[r], n);
  }
  /**
   * Apply any properties from another object without triggering events.
   * @param {BaseObject} source The source object.
   * @protected
   */
  applyProperties(e) {
    e.values_ && Object.assign(this.values_ || (this.values_ = {}), e.values_);
  }
  /**
   * Unsets a property.
   * @param {string} key Key name.
   * @param {boolean} [silent] Unset without triggering an event.
   * @api
   */
  unset(e, n) {
    if (this.values_ && e in this.values_) {
      const r = this.values_[e];
      delete this.values_[e], dl(this.values_) && (this.values_ = null), n || this.notify(e, r);
    }
  }
}
class kt extends Lf {
  /**
   * @param {Options} options Control options.
   */
  constructor(e) {
    super();
    const n = e.element;
    n && !e.target && !n.style.pointerEvents && (n.style.pointerEvents = "auto"), this.element = n || null, this.target_ = null, this.map_ = null, this.listenerKeys = [], e.render && (this.render = e.render), e.target && this.setTarget(e.target);
  }
  /**
   * Clean up.
   * @override
   */
  disposeInternal() {
    var e;
    (e = this.element) == null || e.remove(), super.disposeInternal();
  }
  /**
   * Get the map associated with this control.
   * @return {import("../Map.js").default|null} Map.
   * @api
   */
  getMap() {
    return this.map_;
  }
  /**
   * Remove the control from its current map and attach it to the new map.
   * Pass `null` to just remove the control from the current map.
   * Subclasses may set up event handlers to get notified about changes to
   * the map here.
   * @param {import("../Map.js").default|null} map Map.
   * @api
   */
  setMap(e) {
    var n;
    this.map_ && ((n = this.element) == null || n.remove());
    for (let r = 0, i = this.listenerKeys.length; r < i; ++r)
      hi(this.listenerKeys[r]);
    if (this.listenerKeys.length = 0, this.map_ = e, e) {
      const r = this.target_ ?? e.getOverlayContainerStopEvent();
      this.element && r.appendChild(this.element), this.render !== Lr && this.listenerKeys.push(
        Hn(e, Qf.POSTRENDER, this.render, this)
      ), e.render();
    }
  }
  /**
   * Renders the control.
   * @param {import("../MapEvent.js").default} mapEvent Map event.
   * @api
   */
  render(e) {
  }
  /**
   * This function is used to set a target element for the control. It has no
   * effect if it is called after the control has been added to the map (i.e.
   * after `setMap` is called on the control). If no `target` is set in the
   * options passed to the control constructor and if `setTarget` is not called
   * then the control is added to the map's overlay container.
   * @param {HTMLElement|string} target Target.
   * @api
   */
  setTarget(e) {
    this.target_ = typeof e == "string" ? document.getElementById(e) : e;
  }
}
function Kf(t) {
  return Math.pow(t, 3);
}
function zo(t) {
  return 1 - Kf(1 - t);
}
class Hf extends kt {
  /**
   * @param {Options} [options] Rotate options.
   */
  constructor(e) {
    e = e || {}, super({
      element: document.createElement("div"),
      render: e.render,
      target: e.target
    });
    const n = e.className !== void 0 ? e.className : "ol-rotate", r = e.label !== void 0 ? e.label : "⇧", i = e.compassClassName !== void 0 ? e.compassClassName : "ol-compass";
    this.label_ = null, typeof r == "string" ? (this.label_ = document.createElement("span"), this.label_.className = i, this.label_.textContent = r) : (this.label_ = r, this.label_.classList.add(i));
    const s = e.tipLabel ? e.tipLabel : "Reset rotation", a = document.createElement("button");
    a.className = n + "-reset", a.setAttribute("type", "button"), a.title = s, a.appendChild(this.label_), a.addEventListener(
      Kn.CLICK,
      this.handleClick_.bind(this),
      !1
    );
    const o = n + " " + ji + " " + qi, l = this.element;
    l.className = o, l.appendChild(a), this.callResetNorth_ = e.resetNorth ? e.resetNorth : void 0, this.duration_ = e.duration !== void 0 ? e.duration : 250, this.autoHide_ = e.autoHide !== void 0 ? e.autoHide : !0, this.rotation_ = void 0, this.autoHide_ && this.element.classList.add(Dn);
  }
  /**
   * @param {MouseEvent} event The event to handle
   * @private
   */
  handleClick_(e) {
    e.preventDefault(), this.callResetNorth_ !== void 0 ? this.callResetNorth_() : this.resetNorth_();
  }
  /**
   * @private
   */
  resetNorth_() {
    const n = this.getMap().getView();
    if (!n)
      return;
    const r = n.getRotation();
    r !== void 0 && (this.duration_ > 0 && r % (2 * Math.PI) !== 0 ? n.animate({
      rotation: 0,
      duration: this.duration_,
      easing: zo
    }) : n.setRotation(0));
  }
  /**
   * Update the rotate control element.
   * @param {import("../MapEvent.js").default} mapEvent Map event.
   * @override
   */
  render(e) {
    const n = e.frameState;
    if (!n)
      return;
    const r = n.viewState.rotation;
    if (r != this.rotation_) {
      const i = "rotate(" + r + "rad)";
      if (this.autoHide_) {
        const s = this.element.classList.contains(Dn);
        !s && r === 0 ? this.element.classList.add(Dn) : s && r !== 0 && this.element.classList.remove(Dn);
      }
      this.label_.style.transform = i;
    }
    this.rotation_ = r;
  }
}
let Xf = class extends kt {
  /**
   * @param {Options} [options] Zoom options.
   */
  constructor(e) {
    e = e || {}, super({
      element: document.createElement("div"),
      target: e.target
    });
    const n = e.className !== void 0 ? e.className : "ol-zoom", r = e.delta !== void 0 ? e.delta : 1, i = e.zoomInClassName !== void 0 ? e.zoomInClassName : n + "-in", s = e.zoomOutClassName !== void 0 ? e.zoomOutClassName : n + "-out", a = e.zoomInLabel !== void 0 ? e.zoomInLabel : "+", o = e.zoomOutLabel !== void 0 ? e.zoomOutLabel : "–", l = e.zoomInTipLabel !== void 0 ? e.zoomInTipLabel : "Zoom in", c = e.zoomOutTipLabel !== void 0 ? e.zoomOutTipLabel : "Zoom out", d = document.createElement("button");
    d.className = i, d.setAttribute("type", "button"), d.title = l, d.appendChild(
      typeof a == "string" ? document.createTextNode(a) : a
    ), d.addEventListener(
      Kn.CLICK,
      this.handleClick_.bind(this, r),
      !1
    );
    const A = document.createElement("button");
    A.className = s, A.setAttribute("type", "button"), A.title = c, A.appendChild(
      typeof o == "string" ? document.createTextNode(o) : o
    ), A.addEventListener(
      Kn.CLICK,
      this.handleClick_.bind(this, -r),
      !1
    );
    const u = n + " " + ji + " " + qi, f = this.element;
    f.className = u, f.appendChild(d), f.appendChild(A), this.duration_ = e.duration !== void 0 ? e.duration : 250;
  }
  /**
   * @param {number} delta Zoom delta.
   * @param {MouseEvent} event The event to handle
   * @private
   */
  handleClick_(e, n) {
    n.preventDefault(), this.zoomByDelta_(e);
  }
  /**
   * @param {number} delta Zoom delta.
   * @private
   */
  zoomByDelta_(e) {
    const r = this.getMap().getView();
    if (!r)
      return;
    const i = r.getZoom();
    if (i !== void 0) {
      const s = r.getConstrainedZoom(i + e);
      this.duration_ > 0 ? (r.getAnimating() && r.cancelAnimations(), r.animate({
        zoom: s,
        duration: this.duration_,
        easing: zo
      })) : r.setZoom(s);
    }
  }
};
const Wf = {
  house: { viewBox: "0 0 512 512", path: "M240 6.1c9.1-8.2 22.9-8.2 32 0l232 208c9.9 8.8 10.7 24 1.8 33.9s-24 10.7-33.9 1.8l-8-7.2 0 205.3c0 35.3-28.7 64-64 64l-288 0c-35.3 0-64-28.7-64-64l0-205.3-8 7.2c-9.9 8.8-25 8-33.9-1.8s-8-25 1.8-33.9L240 6.1zm16 50.1L96 199.7 96 448c0 8.8 7.2 16 16 16l48 0 0-104c0-39.8 32.2-72 72-72l48 0c39.8 0 72 32.2 72 72l0 104 48 0c8.8 0 16-7.2 16-16l0-248.3-160-143.4zM208 464l96 0 0-104c0-13.3-10.7-24-24-24l-48 0c-13.3 0-24 10.7-24 24l0 104z" },
  "location-crosshairs": { viewBox: "0 0 576 512", path: "M288-16c17.7 0 32 14.3 32 32l0 18.3c98.1 14 175.7 91.6 189.7 189.7l18.3 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-18.3 0c-14 98.1-91.6 175.7-189.7 189.7l0 18.3c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-18.3C157.9 463.7 80.3 386.1 66.3 288L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l18.3 0C80.3 125.9 157.9 48.3 256 34.3L256 16c0-17.7 14.3-32 32-32zM128 256a160 160 0 1 0 320 0 160 160 0 1 0 -320 0zm160-96a96 96 0 1 1 0 192 96 96 0 1 1 0-192z" },
  compass: { viewBox: "0 0 512 512", path: "M464 256a208 208 0 1 0 -416 0 208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0zm306.7 69.1L162.4 380.6c-19.4 7.5-38.5-11.6-31-31l55.5-144.3c3.3-8.5 9.9-15.1 18.4-18.4l144.3-55.5c19.4-7.5 38.5 11.6 31 31L325.1 306.7c-3.3 8.5-9.9 15.1-18.4 18.4zM288 256a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z" },
  "share-from-square": { viewBox: "0 0 576 512", path: "M425.5 7c-6.9-6.9-17.2-8.9-26.2-5.2S384.5 14.3 384.5 24l0 56-48 0c-88.4 0-160 71.6-160 160 0 46.7 20.7 80.4 43.6 103.4 8.1 8.2 16.5 14.9 24.3 20.4 9.2 6.5 21.7 5.7 30.1-1.9s10.2-20 4.5-29.8c-3.6-6.3-6.5-14.9-6.5-26.7 0-36.2 29.3-65.5 65.5-65.5l46.5 0 0 56c0 9.7 5.8 18.5 14.8 22.2s19.3 1.7 26.2-5.2l136-136c9.4-9.4 9.4-24.6 0-33.9L425.5 7zm7 97l0-22.1 78.1 78.1-78.1 78.1 0-22.1c0-13.3-10.7-24-24-24L338 192c-50.9 0-93.9 33.5-108.3 79.6-3.3-9.4-5.2-19.8-5.2-31.6 0-61.9 50.1-112 112-112l72 0c13.3 0 24-10.7 24-24zm-320-8c-44.2 0-80 35.8-80 80l0 256c0 44.2 35.8 80 80 80l256 0c44.2 0 80-35.8 80-80l0-24c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 24c0 17.7-14.3 32-32 32l-256 0c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l24 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-24 0z" },
  "layer-group": { viewBox: "0 0 512 512", path: "M232.5 5.2c14.9-6.9 32.1-6.9 47 0l218.6 101c8.5 3.9 13.9 12.4 13.9 21.8s-5.4 17.9-13.9 21.8l-218.6 101c-14.9 6.9-32.1 6.9-47 0L13.9 149.8C5.4 145.8 0 137.3 0 128s5.4-17.9 13.9-21.8L232.5 5.2zM48.1 218.4l164.3 75.9c27.7 12.8 59.6 12.8 87.3 0l164.3-75.9 34.1 15.8c8.5 3.9 13.9 12.4 13.9 21.8s-5.4 17.9-13.9 21.8l-218.6 101c-14.9 6.9-32.1 6.9-47 0L13.9 277.8C5.4 273.8 0 265.3 0 256s5.4-17.9 13.9-21.8l34.1-15.8zM13.9 362.2l34.1-15.8 164.3 75.9c27.7 12.8 59.6 12.8 87.3 0l164.3-75.9 34.1 15.8c8.5 3.9 13.9 12.4 13.9 21.8s-5.4 17.9-13.9 21.8l-218.6 101c-14.9 6.9-32.1 6.9-47 0L13.9 405.8C5.4 401.8 0 393.3 0 384s5.4-17.9 13.9-21.8z" },
  "circle-question": { viewBox: "0 0 512 512", path: "M464 256a208 208 0 1 0 -416 0 208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0zm256-80c-17.7 0-32 14.3-32 32 0 13.3-10.7 24-24 24s-24-10.7-24-24c0-44.2 35.8-80 80-80s80 35.8 80 80c0 47.2-36 67.2-56 74.5l0 3.8c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-8.1c0-20.5 14.8-35.2 30.1-40.2 6.4-2.1 13.2-5.5 18.2-10.3 4.3-4.2 7.7-10 7.7-19.6 0-17.7-14.3-32-32-32zM224 368a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z" },
  "circle-info": { viewBox: "0 0 512 512", path: "M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zM224 160a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm-8 64l48 0c13.3 0 24 10.7 24 24l0 88 8 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-80 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l24 0 0-64-24 0c-13.3 0-24-10.7-24-24s10.7-24 24-24z" },
  "map-pin": { viewBox: "0 0 320 512", path: "M192 284.4C256.1 269.9 304 212.5 304 144 304 64.5 239.5 0 160 0S16 64.5 16 144c0 68.5 47.9 125.9 112 140.4L128 480c0 17.7 14.3 32 32 32s32-14.3 32-32l0-195.6zM168 96c-30.9 0-56 25.1-56 56 0 13.3-10.7 24-24 24s-24-10.7-24-24c0-57.4 46.6-104 104-104 13.3 0 24 10.7 24 24s-10.7 24-24 24z" },
  list: { viewBox: "0 0 512 512", path: "M40 48C26.7 48 16 58.7 16 72l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24L40 48zM192 64c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L192 64zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-288 0zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-288 0zM16 232l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24l-48 0c-13.3 0-24 10.7-24 24zM40 368c-13.3 0-24 10.7-24 24l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24l-48 0z" }
};
function Ke(t, e = "") {
  const n = Wf[t];
  return n ? `<svg class="${e}" viewBox="${n.viewBox}" xmlns="http://www.w3.org/2000/svg" style="fill: currentColor; height: 1em; width: 1em; vertical-align: -0.125em;"><path d="${n.path}" /></svg>` : "";
}
let U = {};
function Jf(t) {
  const e = {};
  return t.match(/^#?([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i) ? (e.red = parseInt(RegExp.$1, 16), e.green = parseInt(RegExp.$2, 16), e.blue = parseInt(RegExp.$3, 16)) : t.match(/^#?([0-9A-F])([0-9A-F])([0-9A-F])$/i) && (e.red = parseInt(`${RegExp.$1}${RegExp.$1}`, 16), e.green = parseInt(`${RegExp.$2}${RegExp.$2}`, 16), e.blue = parseInt(`${RegExp.$3}${RegExp.$3}`, 16)), e;
}
class _f extends kt {
  constructor(e) {
    const n = e || {}, r = document.createElement("input");
    r.type = "range", r.min = "0", r.max = "1", r.max = "1";
    const i = n.initialValue || 0;
    r.value = `${1 - i}`, r.step = "0.01";
    const s = n.render ? n.render : function(o) {
      o.frameState;
    };
    super({
      element: r,
      render: s
    });
    const a = n.className !== void 0 ? n.className : "ol-slidernew";
    if (this.set("slidervalue", i), r.title = n.tipLabel, r.className = `${a} ${ji} ${qi}`, r.addEventListener("click", (o) => {
      o.stopPropagation();
    }), r.addEventListener("pointerdown", (o) => {
      o.stopPropagation();
    }), r.addEventListener("pointerup", (o) => {
      o.stopPropagation();
    }), r.addEventListener("input", (o) => {
      this.set("slidervalue", 1 - parseFloat(this.element.value));
    }), U.slider_color) {
      const o = Jf(U.slider_color);
      r.classList.add("ol-slider-originalcolor");
      const l = document.styleSheets, c = l[l.length - 1];
      try {
        c.insertRule(`.maplat.with-opacity .ol-slider-originalcolor.${a}::-webkit-slider-thumb {
          background: rgba(${o.red},${o.green},${o.blue}, 0.5);
        }`, c.cssRules.length), c.insertRule(`.maplat.with-opacity .ol-slider-originalcolor.${a}::-moz-range-thumb {
          background: rgba(${o.red},${o.green},${o.blue}, 0.5);
        }`, c.cssRules.length), c.insertRule(`.maplat.with-opacity .ol-slider-originalcolor.${a}[disabled]::-webkit-slider-thumb {
          background: rgba(${o.red},${o.green},${o.blue}, 0.2);
        }`, c.cssRules.length), c.insertRule(`.maplat.with-opacity .ol-slider-originalcolor.${a}[disabled]::-moz-range-thumb {
          background: rgba(${o.red},${o.green},${o.blue}, 0.2);
        }`, c.cssRules.length), c.insertRule(`.maplat.with-opacity .ol-slider-originalcolor.${a}:not([disabled])::-webkit-slider-thumb:hover {
          background: rgba(${o.red},${o.green},${o.blue}, 0.7);
        }`, c.cssRules.length), c.insertRule(`.maplat.with-opacity .ol-slider-originalcolor.${a}:not([disabled])::-moz-range-thumb:hover {
          background: rgba(${o.red},${o.green},${o.blue}, 0.7);
        }`, c.cssRules.length);
      } catch (d) {
        console.error(d);
      }
    }
  }
  setMap(e) {
    super.setMap(e), e && e.render();
  }
  setEnable(e) {
    const n = this.element;
    e ? n.disabled = !1 : n.disabled = !0;
  }
  setValue(e) {
    this.set("slidervalue", e), this.element.value = (1 - e).toString();
  }
}
class ot extends kt {
  constructor(n) {
    const r = n || {}, i = document.createElement("div");
    super({
      element: i,
      target: r.target,
      render: r.render
    });
    m(this, "center_");
    m(this, "zoom_");
    m(this, "callResetNorth_");
    m(this, "rotation_");
    m(this, "label_");
    m(this, "ui");
    m(this, "moveTo_", !1);
    const s = document.createElement("button");
    s.setAttribute("type", "button"), s.title = r.tipLabel;
    const a = document.createElement("span");
    a.innerHTML = r.character, s.appendChild(a);
    let o, l;
    const c = this;
    s.addEventListener("click", (d) => {
      d.stopPropagation();
    }), s.addEventListener(
      "mouseup",
      (d) => {
        l || o && (r.long_callback && clearTimeout(o), o = null, r.callback.apply(c)), d.stopPropagation();
      },
      !1
    ), s.addEventListener(
      "mousemove",
      (d) => {
        d.stopPropagation();
      },
      !1
    ), s.addEventListener(
      "mousedown",
      (d) => {
        l || (r.long_callback ? o = setTimeout(() => {
          o = null, r.long_callback.apply(c);
        }, 1500) : o = !0), d.stopPropagation();
      },
      !1
    ), s.addEventListener(
      "touchstart",
      (d) => {
        l = !0, r.long_callback ? o = setTimeout(() => {
          o = null, r.long_callback.apply(c);
        }, 1500) : o = !0, d.stopPropagation();
      },
      !1
    ), s.addEventListener(
      "touchend",
      (d) => {
        o && (r.long_callback && clearTimeout(o), o = null, r.callback.apply(c)), d.stopPropagation();
      },
      !1
    ), s.addEventListener(
      "mouseout",
      (d) => {
        r.long_callback && clearTimeout(o), o = null, d.stopPropagation();
      },
      !1
    ), s.addEventListener(
      "dblclick",
      (d) => {
        d.preventDefault();
      },
      !1
    ), i.className = `${r.cls} ol-unselectable ol-control`, i.appendChild(s);
  }
}
class $f extends ot {
  constructor(e) {
    const n = e || {};
    if (n.character = U.home ? `<img src="${U.home}">` : Ke("house", "far fa-lg"), n.cls = "home", n.callback = function() {
      const r = this.getMap();
      if (r) {
        const i = r.getLayers().item(0).getSource();
        i && i.goHome && i.goHome();
      }
    }, super(n), U.home) {
      const r = this.element.querySelector("button");
      r && (r.style.backgroundColor = "rgba(0,0,0,0)");
    }
  }
}
class ep extends ot {
  constructor(e) {
    const n = e || {};
    if (n.character = U.gps ? `<img src="${U.gps}">` : Ke("location-crosshairs", "far fa-lg"), n.cls = "gps", n.render = function(r) {
      if (!r.frameState)
        return;
      const s = this, a = s.ui.core;
      if (a && a.getGPSEnabled) {
        const o = a.getGPSEnabled(), l = s.element.classList.contains("disable");
        o && l ? s.element.classList.remove("disable") : !o && !l && s.element.classList.add("disable");
      }
    }, n.callback = function() {
      const i = this.ui.core, s = i.getGPSEnabled();
      i.alwaysGpsOn ? i.handleGPS(!0) : i.handleGPS(!s);
    }, super(n), this.ui = n.ui, this.moveTo_ = !1, this.ui && this.ui.core && (this.ui.core.addEventListener("gps_error", (r) => {
      console.log("GPS Error:", r);
      const i = {
        user_gps_deny: "app.user_gps_deny",
        gps_miss: "app.gps_miss",
        gps_timeout: "app.gps_timeout"
      };
      this.ui.core.mapDivDocument.querySelector(".modal_title").innerText = this.ui.core.t("app.gps_error"), this.ui.core.mapDivDocument.querySelector(".modal_gpsD_content").innerText = this.ui.core.t(i[r.detail] || "app.gps_error");
      const s = this.ui.core.mapDivDocument.querySelector(".modalBase"), a = new oe(s, { root: this.ui.core.mapDivDocument });
      this.ui.modalSetting("gpsD"), a.show();
    }), this.ui.core.addEventListener("gps_result", (r) => {
      if (console.log("GPS Result:", r), r.detail && r.detail.error) {
        const i = {
          user_gps_deny: "app.user_gps_deny",
          gps_miss: "app.gps_miss",
          gps_timeout: "app.gps_timeout",
          gps_off: "app.out_of_map"
        };
        this.ui.core.mapDivDocument.querySelector(".modal_title").innerText = this.ui.core.t("app.gps_error"), this.ui.core.mapDivDocument.querySelector(".modal_gpsD_content").innerText = this.ui.core.t(i[r.detail.error] || "app.gps_error");
        const s = this.ui.core.mapDivDocument.querySelector(".modalBase"), a = new oe(s, { root: this.ui.core.mapDivDocument });
        this.ui.modalSetting("gpsD"), a.show();
      }
    })), U.gps) {
      const r = this.element.querySelector("button");
      r && (r.style.backgroundColor = "rgba(0,0,0,0)");
    }
  }
}
class tp extends Hf {
  constructor(n) {
    const r = n || {};
    r.autoHide = !1;
    const i = document.createElement("span");
    i.innerHTML = U.compass ? `<img src="${U.compass}">` : Ke("compass", "far fa-lg ol-compass-fa"), r.label = i, r.render = function(s) {
      const a = s.frameState;
      if (!a)
        return;
      const o = this, l = o.getMap().getView(), c = a.viewState.rotation, d = l.getCenter(), A = l.getDecimalZoom();
      if (c != o.rotation_ || d[0] != o.center_[0] || d[1] != o.center_[1] || A != o.zoom_) {
        if (!o.getMap().northUp) {
          const h = o.element.classList.contains("disable");
          !h && c === 0 ? o.element.classList.add("disable") : h && c !== 0 && o.element.classList.remove("disable");
        }
        const u = o.getMap().getLayers().item(0), f = u.getSource ? u.getSource() : u.getLayers().item(0).getSource();
        if (!f) {
          const h = "rotate(0rad)";
          o.customLabel_.style.msTransform = h, o.customLabel_.style.webkitTransform = h, o.customLabel_.style.transform = h;
          return;
        }
        f.viewpoint2MercsAsync && f.viewpoint2MercsAsync().then((h) => {
          const v = f.mercs2MercViewpoint(h)[2], g = `rotate(${v}rad)`;
          if (o.customLabel_.style.msTransform = g, o.customLabel_.style.webkitTransform = g, o.customLabel_.style.transform = g, o.getMap().northUp) {
            const C = o.element.classList.contains("disable");
            !C && Math.abs(v) < 0.1 ? o.element.classList.add("disable") : C && Math.abs(v) >= 0.1 && o.element.classList.remove("disable");
          }
        });
      }
      o.rotation_ = c, o.center_ = d, o.zoom_ = A;
    };
    super(r);
    m(this, "center_");
    m(this, "zoom_");
    m(this, "customLabel_");
    this.customLabel_ = i;
  }
}
class np extends ot {
  constructor(e) {
    const n = e || {};
    if (n.character = U.share ? `<img src="${U.share}">` : Ke("share-from-square", "far fa-lg"), n.cls = "ol-share", n.callback = function() {
      const r = this.getMap();
      r && r.dispatchEvent(
        new Qt("click_control", r, { control: "share" })
      );
    }, super(n), U.share) {
      const r = this.element.querySelector("button");
      r && (r.style.backgroundColor = "rgba(0,0,0,0)");
    }
  }
}
class rp extends ot {
  constructor(e) {
    const n = e || {};
    if (n.character = U.border ? `<img src="${U.border}">` : Ke("layer-group", "far fa-lg"), n.cls = "ol-border", n.callback = function() {
      const r = this.getMap();
      r && r.dispatchEvent(
        new Qt("click_control", r, { control: "border" })
      );
    }, super(n), U.border) {
      const r = this.element.querySelector("button");
      r && (r.style.backgroundColor = "rgba(0,0,0,0)");
    }
  }
}
class ip extends ot {
  constructor(e) {
    const n = e || {};
    if (n.character = U.help ? `<img src="${U.help}">` : Ke("circle-question", "far fa-lg"), n.cls = "ol-maplat", n.callback = function() {
      const r = this.getMap();
      r && r.dispatchEvent(
        new Qt("click_control", r, { control: "help" })
      );
    }, super(n), U.help) {
      const r = this.element.querySelector("button");
      r && (r.style.backgroundColor = "rgba(0,0,0,0)");
    }
  }
}
class sp extends ot {
  constructor(e) {
    const n = e || {};
    if (n.character = U.attr ? `<img src="${U.attr}">` : Ke("circle-info", "far fa-lg"), n.cls = "ol-copyright", n.callback = function() {
      const r = this.getMap();
      r && r.dispatchEvent(
        new Qt("click_control", r, { control: "copyright" })
      );
    }, super(n), U.attr) {
      const r = this.element.querySelector("button");
      r && (r.style.backgroundColor = "rgba(0,0,0,0)");
    }
  }
}
class ap extends ot {
  constructor(e) {
    const n = e || {};
    if (n.character = U.hide_marker ? `<img src="${U.hide_marker}">` : Ke("map-pin", "far fa-lg"), n.cls = "ol-hide-marker", n.callback = function() {
      const r = this.getMap();
      r && r.dispatchEvent(
        new Qt("click_control", r, { control: "hideMarker" })
      );
    }, super(n), U.hide_marker) {
      const r = this.element.querySelector("button");
      r && (r.style.backgroundColor = "rgba(0,0,0,0)");
    }
  }
}
class op extends ot {
  constructor(e) {
    const n = e || {};
    if (n.character = U.marker_list ? `<img src="${U.marker_list}">` : Ke("list", "far fa-lg"), n.cls = "ol-marker-list", n.callback = function() {
      const r = this.getMap();
      r && r.dispatchEvent(
        new Qt("click_control", r, { control: "markerList" })
      );
    }, super(n), U.marker_list) {
      const r = this.element.querySelector("button");
      r && (r.style.backgroundColor = "rgba(0,0,0,0)");
    }
  }
}
class lp extends Xf {
  constructor(e = {}) {
    U.zoom_plus && (e.zoomInLabel = ce(
      `<img src="${U.zoom_plus}">`
    )[0]), U.zoom_minus && (e.zoomOutLabel = ce(
      `<img src="${U.zoom_minus}">`
    )[0]), super(e), U.compass && this.element.querySelectorAll("button").forEach((r) => {
      r.style.backgroundColor = "rgba(0,0,0,0)";
    });
  }
}
const ft = "ol-ctx-menu", Xt = {
  container: `${ft}-container`,
  separator: `${ft}-separator`,
  submenu: `${ft}-submenu`,
  hidden: `${ft}-hidden`,
  icon: `${ft}-icon`,
  zoomIn: `${ft}-zoom-in`,
  zoomOut: `${ft}-zoom-out`,
  unselectable: "ol-unselectable"
}, ge = Xt, Wt = {
  /**
   * Triggered before context menu is open.
   */
  BEFOREOPEN: "beforeopen",
  /**
   * Triggered when context menu is open.
   */
  OPEN: "open",
  /**
   * Triggered when context menu is closed.
   */
  CLOSE: "close",
  /**
   * Internal.
   */
  CONTEXTMENU: "contextmenu"
}, cp = {
  width: 150,
  scrollAt: 4,
  eventType: Wt.CONTEXTMENU,
  defaultItems: !0
}, gi = [
  {
    text: "Zoom In",
    classname: `${Xt.zoomIn} ${Xt.icon}`,
    callback: (t, e) => {
      const n = e.getView();
      n.animate({
        zoom: +n.getZoom() + 1,
        duration: 700,
        center: t.coordinate
      });
    }
  },
  {
    text: "Zoom Out",
    classname: `${Xt.zoomOut} ${Xt.icon}`,
    callback: (t, e) => {
      const n = e.getView();
      n.animate({
        zoom: +n.getZoom() - 1,
        duration: 700,
        center: t.coordinate
      });
    }
  }
];
function dp(t, e) {
  const n = {};
  for (const r in t) n[r] = t[r];
  for (const r in e) n[r] = e[r];
  return n;
}
function Bn(t, e = "Assertion failed") {
  if (!t)
    throw typeof Error < "u" ? new Error(e) : e;
}
function Ap(t, e) {
  return !!~e.indexOf(t);
}
function up(t = "id_") {
  return `${t}${Math.random().toString(36).substring(2, 11)}`;
}
function fp(t) {
  return t != null;
}
function Po(t, e, n) {
  if (Array.isArray(t)) {
    t.forEach((s) => Po(s, e));
    return;
  }
  const r = Array.isArray(e) ? e : e.split(/\s+/);
  let i = r.length;
  for (; i--; )
    Bo(t, r[i]) || mp(t, r[i]);
}
function Do(t, e, n) {
  if (Array.isArray(t)) {
    t.forEach((s) => Do(s, e));
    return;
  }
  const r = Array.isArray(e) ? e : e.split(/\s+/);
  let i = r.length;
  for (; i--; )
    Bo(t, r[i]) && vp(t, r[i]);
}
function Bo(t, e) {
  return t.classList ? t.classList.contains(e) : ko(e).test(t.className);
}
function Go(t, e = window.document, n) {
  const r = /^(#?[\w-]+|\.[\w-.]+)$/, i = /\./g, s = Array.prototype.slice;
  let a = [];
  if (r.test(t))
    switch (t[0]) {
      case "#":
        a = [pp(t.substr(1))];
        break;
      case ".":
        a = s.call(
          e.getElementsByClassName(
            t.substr(1).replace(i, " ")
          )
        );
        break;
      default:
        a = s.call(e.getElementsByTagName(t));
    }
  else
    a = s.call(e.querySelectorAll(t));
  return n ? a : a[0];
}
function pp(t) {
  return t = t[0] === "#" ? t.substr(1, t.length) : t, document.getElementById(t);
}
function hp(t) {
  const e = t.getBoundingClientRect(), n = document.documentElement;
  return {
    left: e.left + window.pageXOffset - n.clientLeft,
    top: e.top + window.pageYOffset - n.clientTop,
    width: t.offsetWidth,
    height: t.offsetHeight
  };
}
function gp() {
  return {
    w: window.innerWidth || document.documentElement.clientWidth,
    h: window.innerHeight || document.documentElement.clientHeight
  };
}
function Gn(t, e) {
  const n = document.createDocumentFragment(), r = document.createElement("div");
  for (r.innerHTML = t; r.firstChild; )
    n.appendChild(r.firstChild);
  return n;
}
function ko(t) {
  return new RegExp(`(^|\\s+) ${t} (\\s+|$)`);
}
function mp(t, e, n) {
  t.classList ? t.classList.add(e) : t.className = `${t.className} ${e}`.trim();
}
function vp(t, e, n) {
  t.classList ? t.classList.remove(e) : t.className = t.className.replace(ko(e), " ").trim();
}
class wp {
  /**
   * @constructor
   * @param {Function} base Base class.
   */
  constructor(e) {
    m(this, "Base");
    m(this, "map");
    m(this, "viewport");
    m(this, "coordinateClicked");
    m(this, "pixelClicked");
    m(this, "lineHeight");
    m(this, "items");
    m(this, "opened");
    m(this, "submenu");
    m(this, "eventHandler");
    m(this, "eventMapMoveHandler");
    return this.Base = e, this.map = void 0, this.viewport = void 0, this.coordinateClicked = void 0, this.pixelClicked = void 0, this.lineHeight = 0, this.items = {}, this.opened = !1, this.submenu = {
      left: `${e.options.width - 15}px`,
      lastLeft: ""
      // string + px
    }, this.eventHandler = this.handleEvent.bind(this), this.eventMapMoveHandler = this.handleMapMoveEvent.bind(this), this;
  }
  init(e) {
    this.map = e, this.viewport = e.getViewport(), this.setListeners(), this.Base.Html.createMenu(), this.lineHeight = this.getItemsLength() > 0 ? this.Base.container.offsetHeight / this.getItemsLength() : this.Base.Html.cloneAndGetLineHeight();
  }
  getItemsLength() {
    let e = 0;
    return Object.keys(this.items).forEach((n) => {
      this.items[n].submenu || this.items[n].separator || e++;
    }), e;
  }
  getPixelClicked() {
    return this.pixelClicked;
  }
  getCoordinateClicked() {
    return this.coordinateClicked;
  }
  positionContainer(e) {
    const n = this.Base.container, r = this.map.getSize(), i = r[1] - e[1], s = r[0] - e[0], a = {
      w: n.offsetWidth,
      // a cheap way to recalculate container height
      // since offsetHeight is like cached
      h: Math.round(this.lineHeight * this.getItemsLength())
    }, o = Go(`li.${ge.submenu}>div`, n, !0);
    s >= a.w ? (n.style.right = "auto", n.style.left = `${e[0] + 5}px`) : (n.style.left = "auto", n.style.right = "15px"), i >= a.h ? (n.style.bottom = "auto", n.style.top = `${e[1] - 10}px`) : (n.style.top = "auto", n.style.bottom = 0), Do(n, ge.hidden), o.length && (s < a.w * 2 ? this.submenu.lastLeft = `-${a.w}px` : this.submenu.lastLeft = this.submenu.left, o.forEach((l) => {
      const c = gp(), d = hp(l), A = d.height;
      let u = i - A;
      u < 0 && (u = A - (c.h - d.top), l.style.top = `-${u}px`), l.style.left = this.submenu.lastLeft;
    }));
  }
  openMenu(e, n) {
    this.Base.dispatchEvent({
      type: Wt.OPEN,
      pixel: e,
      coordinate: n
    }), this.opened = !0, this.positionContainer(e);
  }
  closeMenu() {
    this.opened = !1, Po(this.Base.container, ge.hidden), this.Base.dispatchEvent({
      type: Wt.CLOSE
    });
  }
  setListeners() {
    this.viewport.addEventListener(
      this.Base.options.eventType,
      this.eventHandler,
      !1
    ), this.map.on("movestart", this.eventMapMoveHandler);
  }
  removeListeners() {
    this.viewport.removeEventListener(
      this.Base.options.eventType,
      this.eventHandler,
      !1
    ), this.map.un("movestart", this.eventMapMoveHandler);
  }
  handleEvent(e) {
    const n = this;
    this.coordinateClicked = this.map.getEventCoordinate(e), this.pixelClicked = this.map.getEventPixel(e), this.Base.dispatchEvent({
      type: Wt.BEFOREOPEN,
      pixel: this.pixelClicked,
      coordinate: this.coordinateClicked
    }), !this.Base.disabled && (this.Base.options.eventType === Wt.CONTEXTMENU && (e.stopPropagation(), e.preventDefault()), this.openMenu(this.pixelClicked, this.coordinateClicked), e.target.addEventListener(
      "pointerdown",
      {
        handleEvent: (r) => {
          n.opened && (n.closeMenu(), r.stopPropagation(), e.target.removeEventListener(r.type, this, !1));
        }
      },
      !1
    ));
  }
  handleMapMoveEvent(e) {
    this.closeMenu();
  }
  setItemListener(e, n) {
    const r = this;
    e && typeof this.items[n].callback == "function" && function(i) {
      e.addEventListener(
        "click",
        (s) => {
          s.preventDefault();
          const a = {
            coordinate: r.getCoordinateClicked(),
            data: r.items[n].data || null
          };
          r.closeMenu(), i(a, r.map);
        },
        !1
      );
    }(this.items[n].callback);
  }
}
class Cp {
  /**
   * @constructor
   * @param {Function} base Base class.
   */
  constructor(e) {
    m(this, "Base");
    m(this, "container");
    return this.Base = e, this.container = this.Base.container, this;
  }
  createMenu() {
    let e = [];
    if ("items" in this.Base.options ? e = this.Base.options.defaultItems ? this.Base.options.items.concat(gi) : this.Base.options.items : this.Base.options.defaultItems && (e = gi), e.length === 0) return !1;
    e.forEach(this.addMenuEntry, this);
  }
  addMenuEntry(e) {
    if (e.items && Array.isArray(e.items)) {
      e.classname = e.classname || "", Ap(ge.submenu, e.classname) || (e.classname = e.classname.length ? ` ${ge.submenu}` : ge.submenu);
      const n = this.generateHtmlAndPublish(this.container, e), r = No(!1, this.Base.options.width);
      r.style.left = this.Base.Internal.submenu.lastLeft || this.Base.Internal.submenu.left, n.appendChild(r), e.items.forEach((i) => {
        this.generateHtmlAndPublish(r, i, !0);
      });
    } else
      this.generateHtmlAndPublish(this.container, e);
  }
  generateHtmlAndPublish(e, n, r = void 0) {
    const i = up();
    let s, a, o, l = !1;
    return typeof n == "string" && n.trim() === "-" ? (s = `<li id="${i}" class="${ge.separator}"><hr></li>`, a = Gn(s), o = [].slice.call(a.childNodes, 0)[0], e.firstChild.appendChild(a), l = !0) : (n.classname = n.classname || "", s = `<span>${n.text}</span>`, a = Gn(s), o = document.createElement("li"), n.icon && (n.classname === "" ? n.classname = ge.icon : n.classname.indexOf(ge.icon) === -1 && (n.classname += ` ${ge.icon}`), o.setAttribute("style", `background-image:url(${n.icon})`)), o.id = i, o.className = n.classname, o.appendChild(a), e.firstChild.appendChild(o)), this.Base.Internal.items[i] = {
      id: i,
      submenu: r || 0,
      separator: l,
      callback: n.callback,
      data: n.data || null
    }, this.Base.Internal.setItemListener(o, i), o;
  }
  removeMenuEntry(e) {
    const n = Go(`#${e}`, this.container.firstChild, !1);
    n && this.container.firstChild.removeChild(n), delete this.Base.Internal.items[e];
  }
  cloneAndGetLineHeight() {
    const e = this.container.cloneNode(), n = Gn("<span>Foo</span>"), r = Gn("<span>Foo</span>"), i = document.createElement("li"), s = document.createElement("li");
    i.appendChild(n), s.appendChild(r), e.appendChild(i), e.appendChild(s), this.container.parentNode.appendChild(e);
    const a = e.offsetHeight / 2;
    return this.container.parentNode.removeChild(e), a;
  }
}
/* Fork from ol-comtextmenu 4.1.0
 * https://github.com/jonataswalker/ol-contextmenu/tree/4.1.0
 * (c) Jonatas Walker
 * @license MIT
 **/
const No = (t, e) => {
  const n = document.createElement("div"), r = document.createElement("ul"), i = [ge.container, ge.unselectable];
  return t && i.push(ge.hidden), n.className = i.join(" "), n.style.width = `${parseInt(
    /*this.Base.options.*/
    e,
    10
  )}px`, n.appendChild(r), n;
};
class bp extends kt {
  /**
   * @constructor
   * @param {object|undefined} opt_options Options.
   */
  constructor(n = {}) {
    Bn(
      typeof n == "object",
      "@param `opt_options` should be object type!"
    );
    const r = dp(cp, n), i = No(!0, r.width);
    super({ element: i });
    m(this, "options");
    m(this, "container");
    m(this, "disabled");
    m(this, "Internal");
    m(this, "Html");
    this.options = r, this.container = i, this.disabled = !1, this.Internal = new wp(this), this.Html = new Cp(this);
  }
  /**
   * Remove all elements from the menu.
   */
  clear() {
    Object.keys(this.Internal.items).forEach(
      this.Html.removeMenuEntry,
      this.Html
    );
  }
  /**
   * Close the menu programmatically.
   */
  close() {
    this.Internal.closeMenu();
  }
  /**
   * Enable menu
   */
  enable() {
    this.disabled = !1;
  }
  /**
   * Disable menu
   */
  disable() {
    this.disabled = !0;
  }
  /**
   * @return {Array} Returns default items
   */
  getDefaultItems() {
    return gi;
  }
  /**
   * @return {Number} Returns how many items
   */
  countItems() {
    return Object.keys(this.Internal.items).length;
  }
  /**
   * Add items to the menu. This pushes each item in the provided array
   * to the end of the menu.
   * @param {Array} arr Array.
   */
  extend(n) {
    Bn(Array.isArray(n), "@param `arr` should be an Array."), n.forEach(this.push, this);
  }
  isOpen() {
    return this.Internal.opened;
  }
  /**
   * Update the menu's position.
   */
  updatePosition(n) {
    Bn(Array.isArray(n), "@param `pixel` should be an Array."), this.isOpen() && this.Internal.positionContainer(n);
  }
  /**
   * Remove the last item of the menu.
   */
  pop() {
    const n = Object.keys(this.Internal.items);
    this.Html.removeMenuEntry(n[n.length - 1]);
  }
  /**
   * Insert the provided item at the end of the menu.
   * @param {Object|String} item Item.
   */
  push(n) {
    Bn(fp(n), "@param `item` must be informed."), this.Html.addMenuEntry(n);
  }
  /**
   * Remove the first item of the menu.
   */
  shift() {
    this.Html.removeMenuEntry(Object.keys(this.Internal.items)[0]);
  }
  /**
   * Not supposed to be used on app.
   */
  setMap(n) {
    kt.prototype.setMap.call(this, n), n ? this.Internal.init(n) : this.Internal.removeListeners();
  }
}
class Ep extends bp {
  constructor(e = {}) {
    super(e), this.Internal.setItemListener = function(n, r) {
      const i = this;
      n && typeof this.items[r].callback == "function" && function(s) {
        n.addEventListener("pointerdown", (a) => {
          a.stopPropagation();
        }), n.addEventListener(
          "click",
          (a) => {
            a.preventDefault();
            const o = {
              coordinate: i.getCoordinateClicked(),
              data: i.items[r].data || null
            };
            s(o, i.map) || i.closeMenu();
          },
          !1
        );
      }(this.items[r].callback);
    };
  }
}
const Oe = "https://weiwudi.example.com/api/";
let Fr, pt;
(function() {
  if (typeof window.CustomEvent == "function") return !1;
  function t(e, n) {
    n = n || { bubbles: !1, cancelable: !1, detail: void 0 };
    var r = document.createEvent("CustomEvent");
    return r.initCustomEvent(e, n.bubbles, n.cancelable, n.detail), r;
  }
  t.prototype = window.Event.prototype, window.CustomEvent = t;
})();
class Ip {
  constructor() {
    this.listeners = {};
  }
  addEventListener(e, n) {
    e in this.listeners || (this.listeners[e] = []), this.listeners[e].push(n);
  }
  removeEventListener(e, n) {
    if (!(e in this.listeners))
      return;
    const r = this.listeners[e];
    for (let i = 0, s = r.length; i < s; i++)
      if (r[i] === n) {
        r.splice(i, 1);
        return;
      }
  }
  dispatchEvent(e) {
    if (!(e.type in this.listeners))
      return !0;
    const n = this.listeners[e.type].slice();
    for (let r = 0, i = n.length; r < i; r++)
      n[r].call(this, e);
    return !e.defaultPrevented;
  }
}
class Fe extends Ip {
  static async registerSW(e, n) {
    if ("serviceWorker" in navigator)
      try {
        const r = await navigator.serviceWorker.register(e, n), i = r.installing, s = r.waiting;
        return i && (i.state === "activated" && !s && window.location.reload(), i.addEventListener("statechange", (a) => {
          i.state === "activated" && !s && window.location.reload();
        })), r.onupdatefound = () => {
          r.update();
        }, await Fe.swCheck(), r;
      } catch (r) {
        throw `Error: Service worker registration failed with ${r}`;
      }
    else
      throw "Error: Service worker is not supported";
  }
  static async swCheck() {
    return pt !== void 0 ? pt : (Fr === void 0 && (Fr = new Promise(async (e, n) => {
      try {
        pt = await fetch(`${Oe}ping`), pt = !!pt;
      } catch {
        pt = !1;
      }
      e(pt);
    })), Fr);
  }
  static async registerMap(e, n) {
    if (!await Fe.swCheck()) throw "Weiwudi service worker is not implemented.";
    let i;
    try {
      const s = ["type", "url", "width", "height", "tileSize", "minZoom", "maxZoom", "maxLng", "maxLat", "minLng", "minLat"].reduce((l, c) => (typeof n[c] < "u" && (n[c] instanceof Array ? n[c].map((d) => {
        l.append(c, d);
      }) : l.append(c, n[c])), l), new URLSearchParams());
      s.append("mapID", e);
      const a = new URL(`${Oe}add`);
      a.search = s, i = await (await fetch(a.href)).text();
    } catch (s) {
      throw s;
    }
    if (i.match(/^Error: /))
      throw i;
    return new Fe(e, JSON.parse(i));
  }
  static async retrieveMap(e) {
    if (!await Fe.swCheck()) throw "Weiwudi service worker is not implemented.";
    let r;
    try {
      r = await (await fetch(`${Oe}info?mapID=${e}`)).text();
    } catch (i) {
      throw i;
    }
    if (r.match(/^Error: /))
      throw r;
    return console.log(r), new Fe(e, JSON.parse(r));
  }
  static async removeMap(e) {
    if (!await Fe.swCheck()) throw "Weiwudi service worker is not implemented.";
    let r;
    try {
      r = await (await fetch(`${Oe}delete?mapID=${e}`)).text();
    } catch (i) {
      throw i;
    }
    if (r.match(/^Error: /))
      throw r;
  }
  constructor(e, n) {
    if (super(), !e) throw "MapID is necessary.";
    this.mapID = e, n && Object.assign(this, n), this.url = `${Oe}cache/${e}/{z}/{x}/{y}`, this.listener = (r) => {
      r.data.mapID === e && this.dispatchEvent(new CustomEvent(r.data.type, { detail: r.data }));
    }, navigator.serviceWorker.addEventListener("message", this.listener);
  }
  release() {
    navigator.serviceWorker.removeEventListener("message", this.listener), delete this.mapID;
  }
  checkAspect() {
    if (!this.mapID) throw "This instance is already released.";
  }
  async stats() {
    let e;
    this.checkAspect();
    try {
      e = await (await fetch(`${Oe}stats?mapID=${this.mapID}`)).text();
    } catch (n) {
      throw n;
    }
    if (typeof e == "string" && e.match(/^Error: /))
      throw e;
    return JSON.parse(e);
  }
  async clean() {
    let e;
    this.checkAspect();
    try {
      e = await (await fetch(`${Oe}clean?mapID=${this.mapID}`)).text();
    } catch (n) {
      throw n;
    }
    if (e.match(/^Error: /))
      throw e;
  }
  async fetchAll() {
    let e;
    this.checkAspect();
    try {
      e = await (await fetch(`${Oe}fetchAll?mapID=${this.mapID}`)).text();
    } catch (n) {
      throw n;
    }
    if (e.match(/^Error: /))
      throw e;
  }
  async remove() {
    this.checkAspect(), await Fe.removeMap(this.mapID), this.release();
  }
  async cancel() {
    let e;
    this.checkAspect();
    try {
      e = await (await fetch(`${Oe}cancel?mapID=${this.mapID}`)).text();
    } catch (n) {
      throw n;
    }
    if (e.match(/^Error: /))
      throw e;
  }
}
function Mp(t, e) {
  const n = t.split("/"), r = e.split("/");
  n.pop();
  for (let i = 0; i < r.length; i++)
    r[i] != "." && (r[i] == ".." ? n.pop() : n.push(r[i]));
  return n.join("/");
}
var yp = function() {
  return typeof Promise == "function" && Promise.prototype && Promise.prototype.then;
}, Oo = {}, we = {};
let Zi;
const xp = [
  0,
  // Not used
  26,
  44,
  70,
  100,
  134,
  172,
  196,
  242,
  292,
  346,
  404,
  466,
  532,
  581,
  655,
  733,
  815,
  901,
  991,
  1085,
  1156,
  1258,
  1364,
  1474,
  1588,
  1706,
  1828,
  1921,
  2051,
  2185,
  2323,
  2465,
  2611,
  2761,
  2876,
  3034,
  3196,
  3362,
  3532,
  3706
];
we.getSymbolSize = function(e) {
  if (!e) throw new Error('"version" cannot be null or undefined');
  if (e < 1 || e > 40) throw new Error('"version" should be in range from 1 to 40');
  return e * 4 + 17;
};
we.getSymbolTotalCodewords = function(e) {
  return xp[e];
};
we.getBCHDigit = function(t) {
  let e = 0;
  for (; t !== 0; )
    e++, t >>>= 1;
  return e;
};
we.setToSJISFunction = function(e) {
  if (typeof e != "function")
    throw new Error('"toSJISFunc" is not a valid function.');
  Zi = e;
};
we.isKanjiModeEnabled = function() {
  return typeof Zi < "u";
};
we.toSJIS = function(e) {
  return Zi(e);
};
var cr = {};
(function(t) {
  t.L = { bit: 1 }, t.M = { bit: 0 }, t.Q = { bit: 3 }, t.H = { bit: 2 };
  function e(n) {
    if (typeof n != "string")
      throw new Error("Param is not a string");
    switch (n.toLowerCase()) {
      case "l":
      case "low":
        return t.L;
      case "m":
      case "medium":
        return t.M;
      case "q":
      case "quartile":
        return t.Q;
      case "h":
      case "high":
        return t.H;
      default:
        throw new Error("Unknown EC Level: " + n);
    }
  }
  t.isValid = function(r) {
    return r && typeof r.bit < "u" && r.bit >= 0 && r.bit < 4;
  }, t.from = function(r, i) {
    if (t.isValid(r))
      return r;
    try {
      return e(r);
    } catch {
      return i;
    }
  };
})(cr);
function Fo() {
  this.buffer = [], this.length = 0;
}
Fo.prototype = {
  get: function(t) {
    const e = Math.floor(t / 8);
    return (this.buffer[e] >>> 7 - t % 8 & 1) === 1;
  },
  put: function(t, e) {
    for (let n = 0; n < e; n++)
      this.putBit((t >>> e - n - 1 & 1) === 1);
  },
  getLengthInBits: function() {
    return this.length;
  },
  putBit: function(t) {
    const e = Math.floor(this.length / 8);
    this.buffer.length <= e && this.buffer.push(0), t && (this.buffer[e] |= 128 >>> this.length % 8), this.length++;
  }
};
var Vp = Fo;
function Vn(t) {
  if (!t || t < 1)
    throw new Error("BitMatrix size must be defined and greater than 0");
  this.size = t, this.data = new Uint8Array(t * t), this.reservedBit = new Uint8Array(t * t);
}
Vn.prototype.set = function(t, e, n, r) {
  const i = t * this.size + e;
  this.data[i] = n, r && (this.reservedBit[i] = !0);
};
Vn.prototype.get = function(t, e) {
  return this.data[t * this.size + e];
};
Vn.prototype.xor = function(t, e, n) {
  this.data[t * this.size + e] ^= n;
};
Vn.prototype.isReserved = function(t, e) {
  return this.reservedBit[t * this.size + e];
};
var Rp = Vn, Uo = {};
(function(t) {
  const e = we.getSymbolSize;
  t.getRowColCoords = function(r) {
    if (r === 1) return [];
    const i = Math.floor(r / 7) + 2, s = e(r), a = s === 145 ? 26 : Math.ceil((s - 13) / (2 * i - 2)) * 2, o = [s - 7];
    for (let l = 1; l < i - 1; l++)
      o[l] = o[l - 1] - a;
    return o.push(6), o.reverse();
  }, t.getPositions = function(r) {
    const i = [], s = t.getRowColCoords(r), a = s.length;
    for (let o = 0; o < a; o++)
      for (let l = 0; l < a; l++)
        o === 0 && l === 0 || // top-left
        o === 0 && l === a - 1 || // bottom-left
        o === a - 1 && l === 0 || i.push([s[o], s[l]]);
    return i;
  };
})(Uo);
var Qo = {};
const Sp = we.getSymbolSize, ra = 7;
Qo.getPositions = function(e) {
  const n = Sp(e);
  return [
    // top-left
    [0, 0],
    // top-right
    [n - ra, 0],
    // bottom-left
    [0, n - ra]
  ];
};
var jo = {};
(function(t) {
  t.Patterns = {
    PATTERN000: 0,
    PATTERN001: 1,
    PATTERN010: 2,
    PATTERN011: 3,
    PATTERN100: 4,
    PATTERN101: 5,
    PATTERN110: 6,
    PATTERN111: 7
  };
  const e = {
    N1: 3,
    N2: 3,
    N3: 40,
    N4: 10
  };
  t.isValid = function(i) {
    return i != null && i !== "" && !isNaN(i) && i >= 0 && i <= 7;
  }, t.from = function(i) {
    return t.isValid(i) ? parseInt(i, 10) : void 0;
  }, t.getPenaltyN1 = function(i) {
    const s = i.size;
    let a = 0, o = 0, l = 0, c = null, d = null;
    for (let A = 0; A < s; A++) {
      o = l = 0, c = d = null;
      for (let u = 0; u < s; u++) {
        let f = i.get(A, u);
        f === c ? o++ : (o >= 5 && (a += e.N1 + (o - 5)), c = f, o = 1), f = i.get(u, A), f === d ? l++ : (l >= 5 && (a += e.N1 + (l - 5)), d = f, l = 1);
      }
      o >= 5 && (a += e.N1 + (o - 5)), l >= 5 && (a += e.N1 + (l - 5));
    }
    return a;
  }, t.getPenaltyN2 = function(i) {
    const s = i.size;
    let a = 0;
    for (let o = 0; o < s - 1; o++)
      for (let l = 0; l < s - 1; l++) {
        const c = i.get(o, l) + i.get(o, l + 1) + i.get(o + 1, l) + i.get(o + 1, l + 1);
        (c === 4 || c === 0) && a++;
      }
    return a * e.N2;
  }, t.getPenaltyN3 = function(i) {
    const s = i.size;
    let a = 0, o = 0, l = 0;
    for (let c = 0; c < s; c++) {
      o = l = 0;
      for (let d = 0; d < s; d++)
        o = o << 1 & 2047 | i.get(c, d), d >= 10 && (o === 1488 || o === 93) && a++, l = l << 1 & 2047 | i.get(d, c), d >= 10 && (l === 1488 || l === 93) && a++;
    }
    return a * e.N3;
  }, t.getPenaltyN4 = function(i) {
    let s = 0;
    const a = i.data.length;
    for (let l = 0; l < a; l++) s += i.data[l];
    return Math.abs(Math.ceil(s * 100 / a / 5) - 10) * e.N4;
  };
  function n(r, i, s) {
    switch (r) {
      case t.Patterns.PATTERN000:
        return (i + s) % 2 === 0;
      case t.Patterns.PATTERN001:
        return i % 2 === 0;
      case t.Patterns.PATTERN010:
        return s % 3 === 0;
      case t.Patterns.PATTERN011:
        return (i + s) % 3 === 0;
      case t.Patterns.PATTERN100:
        return (Math.floor(i / 2) + Math.floor(s / 3)) % 2 === 0;
      case t.Patterns.PATTERN101:
        return i * s % 2 + i * s % 3 === 0;
      case t.Patterns.PATTERN110:
        return (i * s % 2 + i * s % 3) % 2 === 0;
      case t.Patterns.PATTERN111:
        return (i * s % 3 + (i + s) % 2) % 2 === 0;
      default:
        throw new Error("bad maskPattern:" + r);
    }
  }
  t.applyMask = function(i, s) {
    const a = s.size;
    for (let o = 0; o < a; o++)
      for (let l = 0; l < a; l++)
        s.isReserved(l, o) || s.xor(l, o, n(i, l, o));
  }, t.getBestMask = function(i, s) {
    const a = Object.keys(t.Patterns).length;
    let o = 0, l = 1 / 0;
    for (let c = 0; c < a; c++) {
      s(c), t.applyMask(c, i);
      const d = t.getPenaltyN1(i) + t.getPenaltyN2(i) + t.getPenaltyN3(i) + t.getPenaltyN4(i);
      t.applyMask(c, i), d < l && (l = d, o = c);
    }
    return o;
  };
})(jo);
var dr = {};
const it = cr, kn = [
  // L  M  Q  H
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  2,
  2,
  1,
  2,
  2,
  4,
  1,
  2,
  4,
  4,
  2,
  4,
  4,
  4,
  2,
  4,
  6,
  5,
  2,
  4,
  6,
  6,
  2,
  5,
  8,
  8,
  4,
  5,
  8,
  8,
  4,
  5,
  8,
  11,
  4,
  8,
  10,
  11,
  4,
  9,
  12,
  16,
  4,
  9,
  16,
  16,
  6,
  10,
  12,
  18,
  6,
  10,
  17,
  16,
  6,
  11,
  16,
  19,
  6,
  13,
  18,
  21,
  7,
  14,
  21,
  25,
  8,
  16,
  20,
  25,
  8,
  17,
  23,
  25,
  9,
  17,
  23,
  34,
  9,
  18,
  25,
  30,
  10,
  20,
  27,
  32,
  12,
  21,
  29,
  35,
  12,
  23,
  34,
  37,
  12,
  25,
  34,
  40,
  13,
  26,
  35,
  42,
  14,
  28,
  38,
  45,
  15,
  29,
  40,
  48,
  16,
  31,
  43,
  51,
  17,
  33,
  45,
  54,
  18,
  35,
  48,
  57,
  19,
  37,
  51,
  60,
  19,
  38,
  53,
  63,
  20,
  40,
  56,
  66,
  21,
  43,
  59,
  70,
  22,
  45,
  62,
  74,
  24,
  47,
  65,
  77,
  25,
  49,
  68,
  81
], Nn = [
  // L  M  Q  H
  7,
  10,
  13,
  17,
  10,
  16,
  22,
  28,
  15,
  26,
  36,
  44,
  20,
  36,
  52,
  64,
  26,
  48,
  72,
  88,
  36,
  64,
  96,
  112,
  40,
  72,
  108,
  130,
  48,
  88,
  132,
  156,
  60,
  110,
  160,
  192,
  72,
  130,
  192,
  224,
  80,
  150,
  224,
  264,
  96,
  176,
  260,
  308,
  104,
  198,
  288,
  352,
  120,
  216,
  320,
  384,
  132,
  240,
  360,
  432,
  144,
  280,
  408,
  480,
  168,
  308,
  448,
  532,
  180,
  338,
  504,
  588,
  196,
  364,
  546,
  650,
  224,
  416,
  600,
  700,
  224,
  442,
  644,
  750,
  252,
  476,
  690,
  816,
  270,
  504,
  750,
  900,
  300,
  560,
  810,
  960,
  312,
  588,
  870,
  1050,
  336,
  644,
  952,
  1110,
  360,
  700,
  1020,
  1200,
  390,
  728,
  1050,
  1260,
  420,
  784,
  1140,
  1350,
  450,
  812,
  1200,
  1440,
  480,
  868,
  1290,
  1530,
  510,
  924,
  1350,
  1620,
  540,
  980,
  1440,
  1710,
  570,
  1036,
  1530,
  1800,
  570,
  1064,
  1590,
  1890,
  600,
  1120,
  1680,
  1980,
  630,
  1204,
  1770,
  2100,
  660,
  1260,
  1860,
  2220,
  720,
  1316,
  1950,
  2310,
  750,
  1372,
  2040,
  2430
];
dr.getBlocksCount = function(e, n) {
  switch (n) {
    case it.L:
      return kn[(e - 1) * 4 + 0];
    case it.M:
      return kn[(e - 1) * 4 + 1];
    case it.Q:
      return kn[(e - 1) * 4 + 2];
    case it.H:
      return kn[(e - 1) * 4 + 3];
    default:
      return;
  }
};
dr.getTotalCodewordsCount = function(e, n) {
  switch (n) {
    case it.L:
      return Nn[(e - 1) * 4 + 0];
    case it.M:
      return Nn[(e - 1) * 4 + 1];
    case it.Q:
      return Nn[(e - 1) * 4 + 2];
    case it.H:
      return Nn[(e - 1) * 4 + 3];
    default:
      return;
  }
};
var qo = {}, Ar = {};
const ln = new Uint8Array(512), Xn = new Uint8Array(256);
(function() {
  let e = 1;
  for (let n = 0; n < 255; n++)
    ln[n] = e, Xn[e] = n, e <<= 1, e & 256 && (e ^= 285);
  for (let n = 255; n < 512; n++)
    ln[n] = ln[n - 255];
})();
Ar.log = function(e) {
  if (e < 1) throw new Error("log(" + e + ")");
  return Xn[e];
};
Ar.exp = function(e) {
  return ln[e];
};
Ar.mul = function(e, n) {
  return e === 0 || n === 0 ? 0 : ln[Xn[e] + Xn[n]];
};
(function(t) {
  const e = Ar;
  t.mul = function(r, i) {
    const s = new Uint8Array(r.length + i.length - 1);
    for (let a = 0; a < r.length; a++)
      for (let o = 0; o < i.length; o++)
        s[a + o] ^= e.mul(r[a], i[o]);
    return s;
  }, t.mod = function(r, i) {
    let s = new Uint8Array(r);
    for (; s.length - i.length >= 0; ) {
      const a = s[0];
      for (let l = 0; l < i.length; l++)
        s[l] ^= e.mul(i[l], a);
      let o = 0;
      for (; o < s.length && s[o] === 0; ) o++;
      s = s.slice(o);
    }
    return s;
  }, t.generateECPolynomial = function(r) {
    let i = new Uint8Array([1]);
    for (let s = 0; s < r; s++)
      i = t.mul(i, new Uint8Array([1, e.exp(s)]));
    return i;
  };
})(qo);
const Zo = qo;
function Yi(t) {
  this.genPoly = void 0, this.degree = t, this.degree && this.initialize(this.degree);
}
Yi.prototype.initialize = function(e) {
  this.degree = e, this.genPoly = Zo.generateECPolynomial(this.degree);
};
Yi.prototype.encode = function(e) {
  if (!this.genPoly)
    throw new Error("Encoder not initialized");
  const n = new Uint8Array(e.length + this.degree);
  n.set(e);
  const r = Zo.mod(n, this.genPoly), i = this.degree - r.length;
  if (i > 0) {
    const s = new Uint8Array(this.degree);
    return s.set(r, i), s;
  }
  return r;
};
var Tp = Yi, Yo = {}, lt = {}, Li = {};
Li.isValid = function(e) {
  return !isNaN(e) && e >= 1 && e <= 40;
};
var Ge = {};
const Lo = "[0-9]+", zp = "[A-Z $%*+\\-./:]+";
let gn = "(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";
gn = gn.replace(/u/g, "\\u");
const Pp = "(?:(?![A-Z0-9 $%*+\\-./:]|" + gn + `)(?:.|[\r
]))+`;
Ge.KANJI = new RegExp(gn, "g");
Ge.BYTE_KANJI = new RegExp("[^A-Z0-9 $%*+\\-./:]+", "g");
Ge.BYTE = new RegExp(Pp, "g");
Ge.NUMERIC = new RegExp(Lo, "g");
Ge.ALPHANUMERIC = new RegExp(zp, "g");
const Dp = new RegExp("^" + gn + "$"), Bp = new RegExp("^" + Lo + "$"), Gp = new RegExp("^[A-Z0-9 $%*+\\-./:]+$");
Ge.testKanji = function(e) {
  return Dp.test(e);
};
Ge.testNumeric = function(e) {
  return Bp.test(e);
};
Ge.testAlphanumeric = function(e) {
  return Gp.test(e);
};
(function(t) {
  const e = Li, n = Ge;
  t.NUMERIC = {
    id: "Numeric",
    bit: 1,
    ccBits: [10, 12, 14]
  }, t.ALPHANUMERIC = {
    id: "Alphanumeric",
    bit: 2,
    ccBits: [9, 11, 13]
  }, t.BYTE = {
    id: "Byte",
    bit: 4,
    ccBits: [8, 16, 16]
  }, t.KANJI = {
    id: "Kanji",
    bit: 8,
    ccBits: [8, 10, 12]
  }, t.MIXED = {
    bit: -1
  }, t.getCharCountIndicator = function(s, a) {
    if (!s.ccBits) throw new Error("Invalid mode: " + s);
    if (!e.isValid(a))
      throw new Error("Invalid version: " + a);
    return a >= 1 && a < 10 ? s.ccBits[0] : a < 27 ? s.ccBits[1] : s.ccBits[2];
  }, t.getBestModeForData = function(s) {
    return n.testNumeric(s) ? t.NUMERIC : n.testAlphanumeric(s) ? t.ALPHANUMERIC : n.testKanji(s) ? t.KANJI : t.BYTE;
  }, t.toString = function(s) {
    if (s && s.id) return s.id;
    throw new Error("Invalid mode");
  }, t.isValid = function(s) {
    return s && s.bit && s.ccBits;
  };
  function r(i) {
    if (typeof i != "string")
      throw new Error("Param is not a string");
    switch (i.toLowerCase()) {
      case "numeric":
        return t.NUMERIC;
      case "alphanumeric":
        return t.ALPHANUMERIC;
      case "kanji":
        return t.KANJI;
      case "byte":
        return t.BYTE;
      default:
        throw new Error("Unknown mode: " + i);
    }
  }
  t.from = function(s, a) {
    if (t.isValid(s))
      return s;
    try {
      return r(s);
    } catch {
      return a;
    }
  };
})(lt);
(function(t) {
  const e = we, n = dr, r = cr, i = lt, s = Li, a = 7973, o = e.getBCHDigit(a);
  function l(u, f, h) {
    for (let v = 1; v <= 40; v++)
      if (f <= t.getCapacity(v, h, u))
        return v;
  }
  function c(u, f) {
    return i.getCharCountIndicator(u, f) + 4;
  }
  function d(u, f) {
    let h = 0;
    return u.forEach(function(v) {
      const g = c(v.mode, f);
      h += g + v.getBitsLength();
    }), h;
  }
  function A(u, f) {
    for (let h = 1; h <= 40; h++)
      if (d(u, h) <= t.getCapacity(h, f, i.MIXED))
        return h;
  }
  t.from = function(f, h) {
    return s.isValid(f) ? parseInt(f, 10) : h;
  }, t.getCapacity = function(f, h, v) {
    if (!s.isValid(f))
      throw new Error("Invalid QR Code version");
    typeof v > "u" && (v = i.BYTE);
    const g = e.getSymbolTotalCodewords(f), C = n.getTotalCodewordsCount(f, h), b = (g - C) * 8;
    if (v === i.MIXED) return b;
    const w = b - c(v, f);
    switch (v) {
      case i.NUMERIC:
        return Math.floor(w / 10 * 3);
      case i.ALPHANUMERIC:
        return Math.floor(w / 11 * 2);
      case i.KANJI:
        return Math.floor(w / 13);
      case i.BYTE:
      default:
        return Math.floor(w / 8);
    }
  }, t.getBestVersionForData = function(f, h) {
    let v;
    const g = r.from(h, r.M);
    if (Array.isArray(f)) {
      if (f.length > 1)
        return A(f, g);
      if (f.length === 0)
        return 1;
      v = f[0];
    } else
      v = f;
    return l(v.mode, v.getLength(), g);
  }, t.getEncodedBits = function(f) {
    if (!s.isValid(f) || f < 7)
      throw new Error("Invalid QR Code version");
    let h = f << 12;
    for (; e.getBCHDigit(h) - o >= 0; )
      h ^= a << e.getBCHDigit(h) - o;
    return f << 12 | h;
  };
})(Yo);
var Ko = {};
const mi = we, Ho = 1335, kp = 21522, ia = mi.getBCHDigit(Ho);
Ko.getEncodedBits = function(e, n) {
  const r = e.bit << 3 | n;
  let i = r << 10;
  for (; mi.getBCHDigit(i) - ia >= 0; )
    i ^= Ho << mi.getBCHDigit(i) - ia;
  return (r << 10 | i) ^ kp;
};
var Xo = {};
const Np = lt;
function Nt(t) {
  this.mode = Np.NUMERIC, this.data = t.toString();
}
Nt.getBitsLength = function(e) {
  return 10 * Math.floor(e / 3) + (e % 3 ? e % 3 * 3 + 1 : 0);
};
Nt.prototype.getLength = function() {
  return this.data.length;
};
Nt.prototype.getBitsLength = function() {
  return Nt.getBitsLength(this.data.length);
};
Nt.prototype.write = function(e) {
  let n, r, i;
  for (n = 0; n + 3 <= this.data.length; n += 3)
    r = this.data.substr(n, 3), i = parseInt(r, 10), e.put(i, 10);
  const s = this.data.length - n;
  s > 0 && (r = this.data.substr(n), i = parseInt(r, 10), e.put(i, s * 3 + 1));
};
var Op = Nt;
const Fp = lt, Ur = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  " ",
  "$",
  "%",
  "*",
  "+",
  "-",
  ".",
  "/",
  ":"
];
function Ot(t) {
  this.mode = Fp.ALPHANUMERIC, this.data = t;
}
Ot.getBitsLength = function(e) {
  return 11 * Math.floor(e / 2) + 6 * (e % 2);
};
Ot.prototype.getLength = function() {
  return this.data.length;
};
Ot.prototype.getBitsLength = function() {
  return Ot.getBitsLength(this.data.length);
};
Ot.prototype.write = function(e) {
  let n;
  for (n = 0; n + 2 <= this.data.length; n += 2) {
    let r = Ur.indexOf(this.data[n]) * 45;
    r += Ur.indexOf(this.data[n + 1]), e.put(r, 11);
  }
  this.data.length % 2 && e.put(Ur.indexOf(this.data[n]), 6);
};
var Up = Ot;
const Qp = lt;
function Ft(t) {
  this.mode = Qp.BYTE, typeof t == "string" ? this.data = new TextEncoder().encode(t) : this.data = new Uint8Array(t);
}
Ft.getBitsLength = function(e) {
  return e * 8;
};
Ft.prototype.getLength = function() {
  return this.data.length;
};
Ft.prototype.getBitsLength = function() {
  return Ft.getBitsLength(this.data.length);
};
Ft.prototype.write = function(t) {
  for (let e = 0, n = this.data.length; e < n; e++)
    t.put(this.data[e], 8);
};
var jp = Ft;
const qp = lt, Zp = we;
function Ut(t) {
  this.mode = qp.KANJI, this.data = t;
}
Ut.getBitsLength = function(e) {
  return e * 13;
};
Ut.prototype.getLength = function() {
  return this.data.length;
};
Ut.prototype.getBitsLength = function() {
  return Ut.getBitsLength(this.data.length);
};
Ut.prototype.write = function(t) {
  let e;
  for (e = 0; e < this.data.length; e++) {
    let n = Zp.toSJIS(this.data[e]);
    if (n >= 33088 && n <= 40956)
      n -= 33088;
    else if (n >= 57408 && n <= 60351)
      n -= 49472;
    else
      throw new Error(
        "Invalid SJIS character: " + this.data[e] + `
Make sure your charset is UTF-8`
      );
    n = (n >>> 8 & 255) * 192 + (n & 255), t.put(n, 13);
  }
};
var Yp = Ut, Wo = { exports: {} };
(function(t) {
  var e = {
    single_source_shortest_paths: function(n, r, i) {
      var s = {}, a = {};
      a[r] = 0;
      var o = e.PriorityQueue.make();
      o.push(r, 0);
      for (var l, c, d, A, u, f, h, v, g; !o.empty(); ) {
        l = o.pop(), c = l.value, A = l.cost, u = n[c] || {};
        for (d in u)
          u.hasOwnProperty(d) && (f = u[d], h = A + f, v = a[d], g = typeof a[d] > "u", (g || v > h) && (a[d] = h, o.push(d, h), s[d] = c));
      }
      if (typeof i < "u" && typeof a[i] > "u") {
        var C = ["Could not find a path from ", r, " to ", i, "."].join("");
        throw new Error(C);
      }
      return s;
    },
    extract_shortest_path_from_predecessor_list: function(n, r) {
      for (var i = [], s = r; s; )
        i.push(s), n[s], s = n[s];
      return i.reverse(), i;
    },
    find_path: function(n, r, i) {
      var s = e.single_source_shortest_paths(n, r, i);
      return e.extract_shortest_path_from_predecessor_list(
        s,
        i
      );
    },
    /**
     * A very naive priority queue implementation.
     */
    PriorityQueue: {
      make: function(n) {
        var r = e.PriorityQueue, i = {}, s;
        n = n || {};
        for (s in r)
          r.hasOwnProperty(s) && (i[s] = r[s]);
        return i.queue = [], i.sorter = n.sorter || r.default_sorter, i;
      },
      default_sorter: function(n, r) {
        return n.cost - r.cost;
      },
      /**
       * Add a new item to the queue and ensure the highest priority element
       * is at the front of the queue.
       */
      push: function(n, r) {
        var i = { value: n, cost: r };
        this.queue.push(i), this.queue.sort(this.sorter);
      },
      /**
       * Return the highest priority element in the queue.
       */
      pop: function() {
        return this.queue.shift();
      },
      empty: function() {
        return this.queue.length === 0;
      }
    }
  };
  t.exports = e;
})(Wo);
var Lp = Wo.exports;
(function(t) {
  const e = lt, n = Op, r = Up, i = jp, s = Yp, a = Ge, o = we, l = Lp;
  function c(C) {
    return unescape(encodeURIComponent(C)).length;
  }
  function d(C, b, w) {
    const p = [];
    let E;
    for (; (E = C.exec(w)) !== null; )
      p.push({
        data: E[0],
        index: E.index,
        mode: b,
        length: E[0].length
      });
    return p;
  }
  function A(C) {
    const b = d(a.NUMERIC, e.NUMERIC, C), w = d(a.ALPHANUMERIC, e.ALPHANUMERIC, C);
    let p, E;
    return o.isKanjiModeEnabled() ? (p = d(a.BYTE, e.BYTE, C), E = d(a.KANJI, e.KANJI, C)) : (p = d(a.BYTE_KANJI, e.BYTE, C), E = []), b.concat(w, p, E).sort(function(I, y) {
      return I.index - y.index;
    }).map(function(I) {
      return {
        data: I.data,
        mode: I.mode,
        length: I.length
      };
    });
  }
  function u(C, b) {
    switch (b) {
      case e.NUMERIC:
        return n.getBitsLength(C);
      case e.ALPHANUMERIC:
        return r.getBitsLength(C);
      case e.KANJI:
        return s.getBitsLength(C);
      case e.BYTE:
        return i.getBitsLength(C);
    }
  }
  function f(C) {
    return C.reduce(function(b, w) {
      const p = b.length - 1 >= 0 ? b[b.length - 1] : null;
      return p && p.mode === w.mode ? (b[b.length - 1].data += w.data, b) : (b.push(w), b);
    }, []);
  }
  function h(C) {
    const b = [];
    for (let w = 0; w < C.length; w++) {
      const p = C[w];
      switch (p.mode) {
        case e.NUMERIC:
          b.push([
            p,
            { data: p.data, mode: e.ALPHANUMERIC, length: p.length },
            { data: p.data, mode: e.BYTE, length: p.length }
          ]);
          break;
        case e.ALPHANUMERIC:
          b.push([
            p,
            { data: p.data, mode: e.BYTE, length: p.length }
          ]);
          break;
        case e.KANJI:
          b.push([
            p,
            { data: p.data, mode: e.BYTE, length: c(p.data) }
          ]);
          break;
        case e.BYTE:
          b.push([
            { data: p.data, mode: e.BYTE, length: c(p.data) }
          ]);
      }
    }
    return b;
  }
  function v(C, b) {
    const w = {}, p = { start: {} };
    let E = ["start"];
    for (let M = 0; M < C.length; M++) {
      const I = C[M], y = [];
      for (let x = 0; x < I.length; x++) {
        const D = I[x], B = "" + M + x;
        y.push(B), w[B] = { node: D, lastCount: 0 }, p[B] = {};
        for (let F = 0; F < E.length; F++) {
          const T = E[F];
          w[T] && w[T].node.mode === D.mode ? (p[T][B] = u(w[T].lastCount + D.length, D.mode) - u(w[T].lastCount, D.mode), w[T].lastCount += D.length) : (w[T] && (w[T].lastCount = D.length), p[T][B] = u(D.length, D.mode) + 4 + e.getCharCountIndicator(D.mode, b));
        }
      }
      E = y;
    }
    for (let M = 0; M < E.length; M++)
      p[E[M]].end = 0;
    return { map: p, table: w };
  }
  function g(C, b) {
    let w;
    const p = e.getBestModeForData(C);
    if (w = e.from(b, p), w !== e.BYTE && w.bit < p.bit)
      throw new Error('"' + C + '" cannot be encoded with mode ' + e.toString(w) + `.
 Suggested mode is: ` + e.toString(p));
    switch (w === e.KANJI && !o.isKanjiModeEnabled() && (w = e.BYTE), w) {
      case e.NUMERIC:
        return new n(C);
      case e.ALPHANUMERIC:
        return new r(C);
      case e.KANJI:
        return new s(C);
      case e.BYTE:
        return new i(C);
    }
  }
  t.fromArray = function(b) {
    return b.reduce(function(w, p) {
      return typeof p == "string" ? w.push(g(p, null)) : p.data && w.push(g(p.data, p.mode)), w;
    }, []);
  }, t.fromString = function(b, w) {
    const p = A(b, o.isKanjiModeEnabled()), E = h(p), M = v(E, w), I = l.find_path(M.map, "start", "end"), y = [];
    for (let x = 1; x < I.length - 1; x++)
      y.push(M.table[I[x]].node);
    return t.fromArray(f(y));
  }, t.rawSplit = function(b) {
    return t.fromArray(
      A(b, o.isKanjiModeEnabled())
    );
  };
})(Xo);
const ur = we, Qr = cr, Kp = Vp, Hp = Rp, Xp = Uo, Wp = Qo, vi = jo, wi = dr, Jp = Tp, Wn = Yo, _p = Ko, $p = lt, jr = Xo;
function eh(t, e) {
  const n = t.size, r = Wp.getPositions(e);
  for (let i = 0; i < r.length; i++) {
    const s = r[i][0], a = r[i][1];
    for (let o = -1; o <= 7; o++)
      if (!(s + o <= -1 || n <= s + o))
        for (let l = -1; l <= 7; l++)
          a + l <= -1 || n <= a + l || (o >= 0 && o <= 6 && (l === 0 || l === 6) || l >= 0 && l <= 6 && (o === 0 || o === 6) || o >= 2 && o <= 4 && l >= 2 && l <= 4 ? t.set(s + o, a + l, !0, !0) : t.set(s + o, a + l, !1, !0));
  }
}
function th(t) {
  const e = t.size;
  for (let n = 8; n < e - 8; n++) {
    const r = n % 2 === 0;
    t.set(n, 6, r, !0), t.set(6, n, r, !0);
  }
}
function nh(t, e) {
  const n = Xp.getPositions(e);
  for (let r = 0; r < n.length; r++) {
    const i = n[r][0], s = n[r][1];
    for (let a = -2; a <= 2; a++)
      for (let o = -2; o <= 2; o++)
        a === -2 || a === 2 || o === -2 || o === 2 || a === 0 && o === 0 ? t.set(i + a, s + o, !0, !0) : t.set(i + a, s + o, !1, !0);
  }
}
function rh(t, e) {
  const n = t.size, r = Wn.getEncodedBits(e);
  let i, s, a;
  for (let o = 0; o < 18; o++)
    i = Math.floor(o / 3), s = o % 3 + n - 8 - 3, a = (r >> o & 1) === 1, t.set(i, s, a, !0), t.set(s, i, a, !0);
}
function qr(t, e, n) {
  const r = t.size, i = _p.getEncodedBits(e, n);
  let s, a;
  for (s = 0; s < 15; s++)
    a = (i >> s & 1) === 1, s < 6 ? t.set(s, 8, a, !0) : s < 8 ? t.set(s + 1, 8, a, !0) : t.set(r - 15 + s, 8, a, !0), s < 8 ? t.set(8, r - s - 1, a, !0) : s < 9 ? t.set(8, 15 - s - 1 + 1, a, !0) : t.set(8, 15 - s - 1, a, !0);
  t.set(r - 8, 8, 1, !0);
}
function ih(t, e) {
  const n = t.size;
  let r = -1, i = n - 1, s = 7, a = 0;
  for (let o = n - 1; o > 0; o -= 2)
    for (o === 6 && o--; ; ) {
      for (let l = 0; l < 2; l++)
        if (!t.isReserved(i, o - l)) {
          let c = !1;
          a < e.length && (c = (e[a] >>> s & 1) === 1), t.set(i, o - l, c), s--, s === -1 && (a++, s = 7);
        }
      if (i += r, i < 0 || n <= i) {
        i -= r, r = -r;
        break;
      }
    }
}
function sh(t, e, n) {
  const r = new Kp();
  n.forEach(function(l) {
    r.put(l.mode.bit, 4), r.put(l.getLength(), $p.getCharCountIndicator(l.mode, t)), l.write(r);
  });
  const i = ur.getSymbolTotalCodewords(t), s = wi.getTotalCodewordsCount(t, e), a = (i - s) * 8;
  for (r.getLengthInBits() + 4 <= a && r.put(0, 4); r.getLengthInBits() % 8 !== 0; )
    r.putBit(0);
  const o = (a - r.getLengthInBits()) / 8;
  for (let l = 0; l < o; l++)
    r.put(l % 2 ? 17 : 236, 8);
  return ah(r, t, e);
}
function ah(t, e, n) {
  const r = ur.getSymbolTotalCodewords(e), i = wi.getTotalCodewordsCount(e, n), s = r - i, a = wi.getBlocksCount(e, n), o = r % a, l = a - o, c = Math.floor(r / a), d = Math.floor(s / a), A = d + 1, u = c - d, f = new Jp(u);
  let h = 0;
  const v = new Array(a), g = new Array(a);
  let C = 0;
  const b = new Uint8Array(t.buffer);
  for (let I = 0; I < a; I++) {
    const y = I < l ? d : A;
    v[I] = b.slice(h, h + y), g[I] = f.encode(v[I]), h += y, C = Math.max(C, y);
  }
  const w = new Uint8Array(r);
  let p = 0, E, M;
  for (E = 0; E < C; E++)
    for (M = 0; M < a; M++)
      E < v[M].length && (w[p++] = v[M][E]);
  for (E = 0; E < u; E++)
    for (M = 0; M < a; M++)
      w[p++] = g[M][E];
  return w;
}
function oh(t, e, n, r) {
  let i;
  if (Array.isArray(t))
    i = jr.fromArray(t);
  else if (typeof t == "string") {
    let c = e;
    if (!c) {
      const d = jr.rawSplit(t);
      c = Wn.getBestVersionForData(d, n);
    }
    i = jr.fromString(t, c || 40);
  } else
    throw new Error("Invalid data");
  const s = Wn.getBestVersionForData(i, n);
  if (!s)
    throw new Error("The amount of data is too big to be stored in a QR Code");
  if (!e)
    e = s;
  else if (e < s)
    throw new Error(
      `
The chosen QR Code version cannot contain this amount of data.
Minimum version required to store current data is: ` + s + `.
`
    );
  const a = sh(e, n, i), o = ur.getSymbolSize(e), l = new Hp(o);
  return eh(l, e), th(l), nh(l, e), qr(l, n, 0), e >= 7 && rh(l, e), ih(l, a), isNaN(r) && (r = vi.getBestMask(
    l,
    qr.bind(null, l, n)
  )), vi.applyMask(r, l), qr(l, n, r), {
    modules: l,
    version: e,
    errorCorrectionLevel: n,
    maskPattern: r,
    segments: i
  };
}
Oo.create = function(e, n) {
  if (typeof e > "u" || e === "")
    throw new Error("No input text");
  let r = Qr.M, i, s;
  return typeof n < "u" && (r = Qr.from(n.errorCorrectionLevel, Qr.M), i = Wn.from(n.version), s = vi.from(n.maskPattern), n.toSJISFunc && ur.setToSJISFunction(n.toSJISFunc)), oh(e, i, r, s);
};
var Jo = {}, Ki = {};
(function(t) {
  function e(n) {
    if (typeof n == "number" && (n = n.toString()), typeof n != "string")
      throw new Error("Color should be defined as hex string");
    let r = n.slice().replace("#", "").split("");
    if (r.length < 3 || r.length === 5 || r.length > 8)
      throw new Error("Invalid hex color: " + n);
    (r.length === 3 || r.length === 4) && (r = Array.prototype.concat.apply([], r.map(function(s) {
      return [s, s];
    }))), r.length === 6 && r.push("F", "F");
    const i = parseInt(r.join(""), 16);
    return {
      r: i >> 24 & 255,
      g: i >> 16 & 255,
      b: i >> 8 & 255,
      a: i & 255,
      hex: "#" + r.slice(0, 6).join("")
    };
  }
  t.getOptions = function(r) {
    r || (r = {}), r.color || (r.color = {});
    const i = typeof r.margin > "u" || r.margin === null || r.margin < 0 ? 4 : r.margin, s = r.width && r.width >= 21 ? r.width : void 0, a = r.scale || 4;
    return {
      width: s,
      scale: s ? 4 : a,
      margin: i,
      color: {
        dark: e(r.color.dark || "#000000ff"),
        light: e(r.color.light || "#ffffffff")
      },
      type: r.type,
      rendererOpts: r.rendererOpts || {}
    };
  }, t.getScale = function(r, i) {
    return i.width && i.width >= r + i.margin * 2 ? i.width / (r + i.margin * 2) : i.scale;
  }, t.getImageWidth = function(r, i) {
    const s = t.getScale(r, i);
    return Math.floor((r + i.margin * 2) * s);
  }, t.qrToImageData = function(r, i, s) {
    const a = i.modules.size, o = i.modules.data, l = t.getScale(a, s), c = Math.floor((a + s.margin * 2) * l), d = s.margin * l, A = [s.color.light, s.color.dark];
    for (let u = 0; u < c; u++)
      for (let f = 0; f < c; f++) {
        let h = (u * c + f) * 4, v = s.color.light;
        if (u >= d && f >= d && u < c - d && f < c - d) {
          const g = Math.floor((u - d) / l), C = Math.floor((f - d) / l);
          v = A[o[g * a + C] ? 1 : 0];
        }
        r[h++] = v.r, r[h++] = v.g, r[h++] = v.b, r[h] = v.a;
      }
  };
})(Ki);
(function(t) {
  const e = Ki;
  function n(i, s, a) {
    i.clearRect(0, 0, s.width, s.height), s.style || (s.style = {}), s.height = a, s.width = a, s.style.height = a + "px", s.style.width = a + "px";
  }
  function r() {
    try {
      return document.createElement("canvas");
    } catch {
      throw new Error("You need to specify a canvas element");
    }
  }
  t.render = function(s, a, o) {
    let l = o, c = a;
    typeof l > "u" && (!a || !a.getContext) && (l = a, a = void 0), a || (c = r()), l = e.getOptions(l);
    const d = e.getImageWidth(s.modules.size, l), A = c.getContext("2d"), u = A.createImageData(d, d);
    return e.qrToImageData(u.data, s, l), n(A, c, d), A.putImageData(u, 0, 0), c;
  }, t.renderToDataURL = function(s, a, o) {
    let l = o;
    typeof l > "u" && (!a || !a.getContext) && (l = a, a = void 0), l || (l = {});
    const c = t.render(s, a, l), d = l.type || "image/png", A = l.rendererOpts || {};
    return c.toDataURL(d, A.quality);
  };
})(Jo);
var _o = {};
const lh = Ki;
function sa(t, e) {
  const n = t.a / 255, r = e + '="' + t.hex + '"';
  return n < 1 ? r + " " + e + '-opacity="' + n.toFixed(2).slice(1) + '"' : r;
}
function Zr(t, e, n) {
  let r = t + e;
  return typeof n < "u" && (r += " " + n), r;
}
function ch(t, e, n) {
  let r = "", i = 0, s = !1, a = 0;
  for (let o = 0; o < t.length; o++) {
    const l = Math.floor(o % e), c = Math.floor(o / e);
    !l && !s && (s = !0), t[o] ? (a++, o > 0 && l > 0 && t[o - 1] || (r += s ? Zr("M", l + n, 0.5 + c + n) : Zr("m", i, 0), i = 0, s = !1), l + 1 < e && t[o + 1] || (r += Zr("h", a), a = 0)) : i++;
  }
  return r;
}
_o.render = function(e, n, r) {
  const i = lh.getOptions(n), s = e.modules.size, a = e.modules.data, o = s + i.margin * 2, l = i.color.light.a ? "<path " + sa(i.color.light, "fill") + ' d="M0 0h' + o + "v" + o + 'H0z"/>' : "", c = "<path " + sa(i.color.dark, "stroke") + ' d="' + ch(a, s, i.margin) + '"/>', d = 'viewBox="0 0 ' + o + " " + o + '"', u = '<svg xmlns="http://www.w3.org/2000/svg" ' + (i.width ? 'width="' + i.width + '" height="' + i.width + '" ' : "") + d + ' shape-rendering="crispEdges">' + l + c + `</svg>
`;
  return typeof r == "function" && r(null, u), u;
};
const dh = yp, Ci = Oo, $o = Jo, Ah = _o;
function Hi(t, e, n, r, i) {
  const s = [].slice.call(arguments, 1), a = s.length, o = typeof s[a - 1] == "function";
  if (!o && !dh())
    throw new Error("Callback required as last argument");
  if (o) {
    if (a < 2)
      throw new Error("Too few arguments provided");
    a === 2 ? (i = n, n = e, e = r = void 0) : a === 3 && (e.getContext && typeof i > "u" ? (i = r, r = void 0) : (i = r, r = n, n = e, e = void 0));
  } else {
    if (a < 1)
      throw new Error("Too few arguments provided");
    return a === 1 ? (n = e, e = r = void 0) : a === 2 && !e.getContext && (r = n, n = e, e = void 0), new Promise(function(l, c) {
      try {
        const d = Ci.create(n, r);
        l(t(d, e, r));
      } catch (d) {
        c(d);
      }
    });
  }
  try {
    const l = Ci.create(n, r);
    i(null, t(l, e, r));
  } catch (l) {
    i(l);
  }
}
Ci.create;
var aa = Hi.bind(null, $o.render);
Hi.bind(null, $o.renderToDataURL);
Hi.bind(null, function(t, e, n) {
  return Ah.render(t, n);
});
function el(t, e) {
  return e || (e = "."), t.match(/\//) ? t : `${e}/${t}`;
}
function tl(t) {
  const e = "…", r = function(a) {
    const o = a.innerText.split("");
    let l = "";
    for (let c = 0; c < o.length; c++)
      l += `<span>${o[c]}</span>`;
    l += `<span class="omit-mark">${e}</span>`, a.innerHTML = l;
  }, i = function(a) {
    const o = a.querySelectorAll("span"), l = a.querySelector(".omit-mark");
    let c = 0, d = 0;
    o[0].style.display = "";
    for (let f = 1; f < o.length; f++)
      o[f].style.display = "none";
    l.style.display = "";
    let A = a.offsetHeight, u = !1;
    for (let f = 1; f < o.length - 1; f++) {
      if (o[f].style.display = "", a.offsetHeight > A && (u ? (A = a.offsetHeight, c++) : (u = !0, a.classList.add("minimize"))), c >= 2) {
        d = f - 2;
        break;
      }
      if (f >= o.length - 2) {
        l.style.display = "none";
        return;
      }
    }
    for (let f = d; f < o.length - 1; f++)
      o[f].style.display = "none";
  }, s = t.querySelectorAll(".swiper-slide div");
  for (let a = 0; a < s.length; a++) {
    const o = s[a];
    r(o), i(o);
  }
}
function uh(t) {
  return t && typeof t.setGPSMarkerAsync == "function";
}
function fh(t) {
  return !uh(t) || t.constructor && t.constructor.isBasemap_ === !1 ? !1 : (t.constructor && t.constructor.isBasemap_ === !0, !0);
}
function nl(t, e, n) {
  n === void 0 && (n = {});
  var r = { type: "Feature" };
  return (n.id === 0 || n.id) && (r.id = n.id), n.bbox && (r.bbox = n.bbox), r.properties = {}, r.geometry = t, r;
}
function ph(t, e, n) {
  if (n === void 0 && (n = {}), !t)
    throw new Error("coordinates is required");
  if (!Array.isArray(t))
    throw new Error("coordinates must be an Array");
  if (t.length < 2)
    throw new Error("coordinates must be at least 2 numbers long");
  if (!oa(t[0]) || !oa(t[1]))
    throw new Error("coordinates must contain numbers");
  var r = {
    type: "Point",
    coordinates: t
  };
  return nl(r, e, n);
}
function hh(t, e, n) {
  n === void 0 && (n = {});
  for (var r = 0, i = t; r < i.length; r++) {
    var s = i[r];
    if (s.length < 4)
      throw new Error("Each LinearRing of a Polygon must have 4 or more Positions.");
    for (var a = 0; a < s[s.length - 1].length; a++)
      if (s[s.length - 1][a] !== s[0][a])
        throw new Error("First and last Position are not equivalent.");
  }
  var o = {
    type: "Polygon",
    coordinates: t
  };
  return nl(o, e, n);
}
function oa(t) {
  return !isNaN(t) && t !== null && !Array.isArray(t);
}
function gh(t) {
  if (!t)
    throw new Error("coord is required");
  if (!Array.isArray(t)) {
    if (t.type === "Feature" && t.geometry !== null && t.geometry.type === "Point")
      return t.geometry.coordinates;
    if (t.type === "Point")
      return t.coordinates;
  }
  if (Array.isArray(t) && t.length >= 2 && !Array.isArray(t[0]) && !Array.isArray(t[1]))
    return t;
  throw new Error("coord must be GeoJSON Point or an Array of numbers");
}
function mh(t) {
  return t.type === "Feature" ? t.geometry : t;
}
function vh(t, e, n) {
  if (n === void 0 && (n = {}), !t)
    throw new Error("point is required");
  if (!e)
    throw new Error("polygon is required");
  var r = gh(t), i = mh(e), s = i.type, a = e.bbox, o = i.coordinates;
  if (a && wh(r, a) === !1)
    return !1;
  s === "Polygon" && (o = [o]);
  for (var l = !1, c = 0; c < o.length && !l; c++)
    if (la(r, o[c][0], n.ignoreBoundary)) {
      for (var d = !1, A = 1; A < o[c].length && !d; )
        la(r, o[c][A], !n.ignoreBoundary) && (d = !0), A++;
      d || (l = !0);
    }
  return l;
}
function la(t, e, n) {
  var r = !1;
  e[0][0] === e[e.length - 1][0] && e[0][1] === e[e.length - 1][1] && (e = e.slice(0, e.length - 1));
  for (var i = 0, s = e.length - 1; i < e.length; s = i++) {
    var a = e[i][0], o = e[i][1], l = e[s][0], c = e[s][1], d = t[1] * (a - l) + o * (l - t[0]) + c * (t[0] - a) === 0 && (a - t[0]) * (l - t[0]) <= 0 && (o - t[1]) * (c - t[1]) <= 0;
    if (d)
      return !n;
    var A = o > t[1] != c > t[1] && t[0] < (l - a) * (t[1] - o) / (c - o) + a;
    A && (r = !r);
  }
  return r;
}
function wh(t, e) {
  return e[0] <= t[0] && e[1] <= t[1] && e[2] >= t[0] && e[3] >= t[1];
}
function rl(t, e, n) {
  let r, i, s;
  if (e.innerHTML = "", n.url || n.html) {
    const a = ce(`<div class="${t.enablePoiHtmlNoScroll ? "" : " embed-responsive embed-responsive-60vh"}">
    <iframe class="poi_iframe iframe_poi" frameborder="0" src=""${t.enablePoiHtmlNoScroll ? ` onload="window.addEventListener('message', (e) =>{if (e.data[0] == 'setHeight') {this.style.height = e.data[1];}});" scrolling="no"` : ""}></iframe>
    </div>`)[0];
    e.appendChild(a);
    const o = a.querySelector(".poi_iframe");
    if (n.html) {
      const l = (c) => {
        c.currentTarget.removeEventListener(c.type, l);
        const d = ce(
          `<style type="text/css">html, body { height: 100vh; }
 img { width: 100%; }</style>`
        ), A = ce(
          `<script>
                const heightGetter = document.querySelector("#heightGetter");
                const resizeObserver = new ResizeObserver(entries => {
                  window.parent.postMessage(["setHeight", (entries[0].target.clientHeight + 16) + "px"], "*");
                });
                if(heightGetter) resizeObserver.observe(heightGetter);
              <\/script>`
        );
        o.contentDocument.head.appendChild(d[0]), o.contentDocument.head.appendChild(A[0]);
      };
      o.addEventListener("load", l), o.removeAttribute("src"), o.setAttribute(
        "srcdoc",
        `<div id="heightGetter">${t.core.translate(n.html) || ""}</div>`
      );
    } else
      o.removeAttribute("srcdoc"), o.setAttribute("src", t.core.translate(n.url) || "");
  } else {
    const a = ce(`<div class="poi_data">
    <div class="col-xs-12 swiper-container poi_img_swiper">
      <div class="swiper-wrapper"></div>
      <div class="swiper-pagination poi-pagination"></div>
      <div class="swiper-button-next poi-img-next"></div>
      <div class="swiper-button-prev poi-img-prev"></div>
    </div>
    <p class="recipient poi_address"></p>
    <p class="recipient poi_desc"></p>
    </div>`)[0];
    e.appendChild(a);
    const o = [];
    n.image && n.image !== "" && (Array.isArray(n.image) ? n.image : [n.image]).forEach((c) => {
      typeof c == "string" && (c = { src: c });
      const d = el(c.src, "img");
      let A = `<a target="_blank" href="${d}"><img src="${d}"></a>`;
      c.desc && (A = `${A}<div>${c.desc}</div>`), o.push(`<div class="swiper-slide">${A}</div>`);
    }), r = (l) => {
      const c = a.querySelector(".swiper-container.poi_img_swiper");
      if (o.length === 0)
        c.classList.add("hide");
      else {
        if (c.classList.remove("hide"), !document.getElementById("poi-swiper-style")) {
          const d = document.createElement("style");
          d.id = "poi-swiper-style", d.innerHTML = `
                .poi_img_swiper { --swiper-theme-color: #007aff; }
                .poi_img_swiper .swiper-button-next, .poi_img_swiper .swiper-button-prev { color: #007aff !important; }
                .poi_img_swiper .swiper-button-disabled { opacity: 0.35 !important; filter: blur(2px) !important; color: #007aff !important; pointer-events: none; }
                .poi_img_swiper .swiper-pagination-bullet { background: #007aff !important; opacity: 0.4 !important; filter: blur(1px); }
                .poi_img_swiper .swiper-pagination-bullet-active { opacity: 1 !important; filter: none !important; }
              `, document.head.appendChild(d);
        }
        s = new me(c, {
          lazy: !0,
          pagination: {
            el: a.querySelector(".poi-pagination"),
            clickable: !0
          },
          navigation: {
            nextEl: a.querySelector(".poi-img-next"),
            prevEl: a.querySelector(".poi-img-prev")
          },
          observer: !0,
          observeParents: !0
        }), o.forEach((d) => s.appendSlide(d));
      }
    }, i = () => {
      s && (s.destroy(!0, !0), s = void 0);
    }, a.querySelector(".poi_address").innerText = t.core.translate(n.address) || "", a.querySelector(".poi_desc").innerHTML = (t.core.translate(n.desc) || "").replace(/\n/g, "<br>");
  }
  return r ? [r, i] : void 0;
}
function Ch(t, e) {
  const n = t.core.mapDivDocument.querySelector(".modalBase"), r = oe.getInstance(n) || new oe(n), i = n.querySelectorAll(".close, .modal-footer button");
  for (let l = 0; l < i.length; l++)
    i[l].addEventListener("click", () => {
      r.hide();
    });
  if (e.directgo) {
    let l = !1, c = "";
    typeof e.directgo == "string" ? c = e.directgo : (c = e.directgo.href, l = e.directgo.blank || !1), l ? window.open(c, "_blank") : window.location.href = c;
    return;
  }
  const s = t.core.mapDivDocument.querySelector(".modal_poi_title") || t.core.mapDivDocument.querySelector(".modal_title");
  s && (s.innerText = t.core.translate(e.name) || "");
  let a = t.core.mapDivDocument.querySelector(".poi_web_div");
  if (!a) {
    const l = t.core.mapDivDocument.querySelector(".modal_poi_content");
    l && (a = ce('<div class="poi_web_div"></div>')[0], l.insertBefore(a, l.firstChild));
  }
  const o = rl(t, a, e);
  if (o) {
    const l = o[0], c = o[1], d = () => {
      n.removeEventListener("shown.bs.modal", d, !1), l && l();
    };
    n.addEventListener("shown.bs.modal", d, !1);
    const A = (u) => {
      n.removeEventListener("hidden.bs.modal", A, !1), c && c(), t.core.unselectMarker();
    };
    n.addEventListener("hidden.bs.modal", A, !1);
  } else {
    const l = (c) => {
      n.removeEventListener("hidden.bs.modal", l, !1), t.core.unselectMarker();
    };
    n.addEventListener("hidden.bs.modal", l, !1);
  }
  t.core.selectMarker(e.namespaceID), t.modalSetting("poi"), r.show();
}
function bh(t, e) {
  var o;
  if (!t.contextMenu) return;
  t.contextMenu.clear(), t.contextMenu.extend(e);
  const n = t.lastClickPixel, r = t.lastClickCoordinate;
  if (!n) {
    console.warn("[Debug] No lastClickPixel for ContextMenu");
    return;
  }
  const i = () => {
    t.contextMenu.un("open", i);
    const l = () => {
      t.contextMenu.un("close", l);
    };
    t.contextMenu.on("close", l);
  };
  t.contextMenu.on("open", i), (o = t.contextMenu.Internal) == null || o.openMenu(n, r);
  const s = t.core.mapObject.getViewport(), a = (l) => {
    var c;
    t.contextMenu.Internal.opened && ((c = t.contextMenu.Internal) == null || c.closeMenu(), l.stopPropagation(), s.removeEventListener(l.type, a, !1));
  };
  s.addEventListener("pointerdown", a, !1);
}
async function Eh(t, e, n = 10) {
  const r = ph(e), i = t.core.mapObject, s = i.getSize(), o = [[0, 0], [s[0], 0], s, [0, s[1]], [0, 0]].map((d) => i.getCoordinateFromPixel(d)), l = await (typeof t.core.from.xy2SysCoord != "function" ? Promise.resolve(o) : Promise.all(
    o.map((d) => t.core.from.sysCoord2MercAsync(d))
  )), c = t.areaIndex(l);
  return Promise.all(
    Object.keys(t.core.cacheHash).filter((d) => t.core.cacheHash[d].envelope).map((d) => {
      const A = t.core.cacheHash[d];
      return Promise.all([
        Promise.resolve(A),
        Promise.all(
          A.envelope.geometry.coordinates[0].map(
            (u) => t.core.from.merc2SysCoordAsync(u)
          )
        )
      ]);
    })
  ).then((d) => d.reduce((u, f) => {
    const h = f[0], v = f[1];
    if (h.mapID !== t.core.from.mapID) {
      const g = hh([v]);
      vh(r, g) && u.push(h);
    }
    return u;
  }, []).filter((u) => u.envelopeAreaIndex / c < n).sort((u, f) => u.envelopeAreaIndex - f.envelopeAreaIndex).map((u) => u.mapID));
}
function Ih(t, e) {
  t.core.requestUpdateState({ hideMarker: e ? 1 : 0 }), e ? (t.core.hideAllMarkers && t.core.hideAllMarkers(), t.core.mapDivDocument.classList.add("hide-marker")) : (t.core.showAllMarkers && t.core.showAllMarkers(), t.core.mapDivDocument.classList.remove("hide-marker")), t.core.restoreSession && t.core.requestUpdateState({ hideMarker: e ? 1 : 0 });
}
function Mh(t, e) {
  const r = t.overlaySwiper.$el[0].querySelectorAll(".swiper-slide");
  for (let i = 0; i < r.length; i++)
    if (r[i].getAttribute("data") === e)
      return !0;
  return !1;
}
function yh(t, e) {
  console.log(`Open marker: ${e}`);
}
me.use([va, wa]);
const ca = [
  "title",
  "officialTitle",
  "author",
  "epoch",
  "createdAt",
  "era",
  "contributor",
  "mapper",
  "license",
  "dataLicense",
  "attr",
  "dataAttr",
  "reference",
  "description"
];
async function xh(t, e) {
  if (e.translateUI = !0, t.core = new ll(e), e.icon && (Ne["defaultpin.png"] = e.icon), e.restore)
    t.setShowBorder(e.restore.showBorder || !1), e.restore.hideMarker && t.core.waitReady.then(() => {
      t.setHideMarker(e.restore.hideMarker);
    }), e.restore.openedMarker && (console.log(e.restore.openedMarker), t.core.waitReady.then(() => {
      console.log(`Timeout ${e.restore.openedMarker} `), t.handleMarkerActionById(e.restore.openedMarker);
    }));
  else if (e.restoreSession) {
    const A = parseInt(String(localStorage.getItem("epoch") || "0"), 10), u = Math.floor((/* @__PURE__ */ new Date()).getTime() / 1e3);
    A && u - A < 3600 && t.setShowBorder(!!parseInt(String(localStorage.getItem("showBorder") || "0"), 10)), t.core.initialRestore.hideMarker && t.core.waitReady.then(() => {
      t.setHideMarker(!0);
    });
  } else
    t.setShowBorder(!1);
  const n = !t.core.initialRestore.mapID, r = t.core.initialRestore.transparency || (e.restore ? e.restore.transparency : void 0), i = !e.presentationMode;
  t.enablePoiHtmlNoScroll = e.enablePoiHtmlNoScroll || !1, e.enableShare && (t.core.mapDivDocument.classList.add("enable_share"), t.enableShare = !0), e.enableHideMarker && (t.core.mapDivDocument.classList.add("enable_hide_marker"), t.enableHideMarker = !0), e.enableBorder && (t.core.mapDivDocument.classList.add("enable_border"), t.enableBorder = !0), e.enableMarkerList && (t.core.mapDivDocument.classList.add("enable_marker_list"), t.enableMarkerList = !0), e.disableNoimage && (t.disableNoimage = !0), e.stateUrl && t.core.mapDivDocument.classList.add("state_url"), e.alwaysGpsOn && (t.alwaysGpsOn = !0), t.core.enableCache && t.core.mapDivDocument.classList.add("enable_cache"), "ontouchstart" in window && (t.core.mapDivDocument.classList.add("ol-touch"), t.isTouch = !0), e.mobileIF && (e.debug = !0), e.appEnvelope && (t.appEnvelope = !0);
  const s = document.createElement("style");
  s.innerHTML = `
      .custom-toast {
        visibility: hidden;
        min-width: 250px;
        margin-left: -125px;
        background-color: #333;
        color: #fff;
        text-align: center;
        border-radius: 2px;
        padding: 16px;
        position: fixed;
        z-index: 9999;
        left: 50%;
        bottom: 30px;
        font-size: 17px;
        opacity: 0;
        transition: opacity 0.3s;
      }
      .custom-toast.show {
        visibility: visible;
        opacity: 1;
      }
    `, document.head.appendChild(s);
  let a = e.pwaManifest, o = e.pwaWorker, l = e.pwaScope, c = ce(`<d c="ol-control map-title"><s></s></d>
  <d c="swiper-container ol-control base-swiper prevent-default-ui">
    <d c="swiper-wrapper"> </d>
      <d c="swiper-button-next base-next swiper-button-white"> </d>
        <d c="swiper-button-prev base-prev swiper-button-white"> </d>
          </d>
          <d c="swiper-container ol-control overlay-swiper prevent-default-ui">
            <d c="swiper-wrapper"> </d>
              <d c="swiper-button-next overlay-next swiper-button-white"> </d>
                <d c="swiper-button-prev overlay-prev swiper-button-white"> </d>
                  </d> `);
  for (let A = c.length - 1; A >= 0; A--)
    t.core.mapDivDocument.insertBefore(
      c[A],
      t.core.mapDivDocument.firstChild
    );
  t.core.mapDivDocument.addEventListener("click", (A) => {
    const f = A.target.closest(".share");
    if (!f) return;
    console.log("Share button clicked:", f);
    const h = f.getAttribute("data");
    if (!h) return;
    const v = h.split("_");
    let g = t.getShareUrl(v[1] || "app");
    if (console.log("Share URI:", g), v[0] === "cp") {
      const C = document.querySelector("body"), b = t.core.t ? t.core.t("app.copy_toast") : "URL Copied";
      if (navigator.clipboard)
        navigator.clipboard.writeText(g).then(() => {
          t.showToast(b, f);
        });
      else {
        const w = document.createElement("textarea");
        w.textContent = g, C.appendChild(w), w.select(), document.execCommand("copy"), C.removeChild(w), t.showToast(b, f);
      }
    } else if (v[0] === "tw") {
      const C = document.title, b = `https://twitter.com/intent/tweet?url=${encodeURIComponent(g)}&text=${encodeURIComponent(C)}&hashtags=Maplat`;
      window.open(b, "_blank");
    } else if (v[0] === "fb") {
      const C = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(g)}&display=popup&ref=plugin&src=like&kid_directed_site=0`;
      window.open(C, "_blank", "width=650,height=450,menubar=no,toolbar=no,scrollbars=yes");
    }
  });
  const d = t.core.mapDivDocument.querySelectorAll(
    ".prevent-default-ui"
  );
  for (let A = 0; A < d.length; A++)
    d[A].addEventListener("touchstart", (f) => {
      f.preventDefault();
    });
  c = ce(`<d c="modal modalBase" tabindex="-1" role="dialog"
    aria-labelledby="staticModalLabel" aria-hidden="true" data-show="true" data-keyboard="false"
    data-backdrop="static">
  <d c="modal-dialog">
    <d c="modal-content">
      <d c="modal-header">
        <button type="button" c="close" data-dismiss="modal">
          <s aria-hidden="true">&#215;</s><s c="sr-only" din="html.close"></s>
        </button>
        <h4 c="modal-title">

          <s c="modal_title"></s>
          <s c="modal_load_title"></s>
          <s c="modal_gpsW_title" din="html.acquiring_gps"></s>
          <s c="modal_help_title" din="html.help_title"></s>
          <s c="modal_share_title" din="html.share_title"></s>
          <s c="modal_marker_list_title" din="html.marker_list_title"></s>

        </h4>
      </d> 
      <d c="modal-body">

        <d c="modal_help_content">
          <d c="help_content">
            <s dinh="html.help_using_maplat"></s>
            <p c="col-xs-12 help_img"><img src="${Ne["fullscreen.png"]}"></p>
            <h4 din="html.help_operation_title"></h4>
            <p dinh="html.help_operation_content" c="recipient"></p>
            <h4 din="html.help_selection_title"></h4>
            <p dinh="html.help_selection_content" c="recipient"></p>
            <h4 din="html.help_gps_title"></h4>
            <p dinh="html.help_gps_content" c="recipient"></p>
            <h4 din="html.help_poi_title"></h4>
            <p dinh="html.help_poi_content" c="recipient"></p>
            <h4 din="html.help_etc_title"></h4>
            <ul>
              <li dinh="html.help_etc_attr" c="recipient"></li>
              <li dinh="html.help_etc_help" c="recipient"></li>
              <s c="share_help"><li dinh="html.help_share_help" c="recipient"></li></s>
              <s c="border_help"><li dinh="html.help_etc_border" c="recipient"></li></s>
              <s c="hide_marker_help"><li dinh="html.help_etc_hide_marker" c="recipient"></li></s>
              <s c="marker_list_help"><li dinh="html.help_etc_marker_list" c="recipient"></li></s>
              <li dinh="html.help_etc_slider" c="recipient"></li>
            </ul>
            <p><a href="https://www.maplat.jp/" target="_blank">Maplat</a>
              © 2015- Kohei Otsuka, Code for History</p>
          </d> 
        </d> 

        <d c="modal_poi_content">
          <d c="poi_web_div"></d>
          <d c="modal_share_poi"></d>
          <p><img src="" height="0px" width="0px"></p>
        </d> 

        <div class="modal_share_content">
          <h4 din="html.share_app_title"></h4>
          <div id="___maplat_app_toast_${t.html_id_seed}"></div>
          <div class="recipient row">
            <div class="form-group col-xs-4 text-center"><button title="Copy to clipboard" class="share btn btn-light" data="cp_app"><svg style="width:14px;height:14px;vertical-align:text-bottom;" viewBox="0 0 512 512"><path fill="currentColor" d="M224 0c-35.3 0-64 28.7-64 64V96H96c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H288c35.3 0 64-28.7 64-64V384h64c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64H224zM288 384H96V160H224c0-17.7 14.3-32 32-32h64V256c0 17.7 14.3 32 32 32h96V384H288z"/></svg>&nbsp;<small din="html.share_copy"></small></button></div>
            <div class="form-group col-xs-4 text-center"><button title="Twitter" class="share btn btn-light" data="tw_app"><svg style="width:14px;height:14px;vertical-align:text-bottom;" viewBox="0 0 512 512"><path fill="currentColor" d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/></svg>&nbsp;<small>Twitter</small></button></div>
            <div class="form-group col-xs-4 text-center"><button title="Facebook" class="share btn btn-light" data="fb_app"><svg style="width:14px;height:14px;vertical-align:text-bottom;" viewBox="0 0 512 512"><path fill="currentColor" d="M504 256C504 119 393 8 256 8S8 119 8 256c0 121.3 87.1 222.4 203 240.5V327.9h-61v-71.9h61V203c0-60.8 35.8-93.7 89.2-93.7 25.5 0 50.4 1.8 56.1 2.6v62.4h-35.4c-29.5 0-37.4 18.2-37.4 42.1v59.6h68.9l-11 71.9h-57.9V496.5C416.9 478.4 504 377.3 504 256z"/></svg>&nbsp;<small>Facebook</small></button></div>
          </div>
          <div class="qr_app center-block" style="width:128px;"></div>
          <div class="modal_share_state">
            <h4 din="html.share_state_title"></h4>
            <div id="___maplat_view_toast_${t.html_id_seed}"></div>
            <div class="recipient row">
              <div class="form-group col-xs-4 text-center"><button title="Copy to clipboard" class="share btn btn-light" data="cp_view"><svg style="width:14px;height:14px;vertical-align:text-bottom;" viewBox="0 0 512 512"><path fill="currentColor" d="M224 0c-35.3 0-64 28.7-64 64V96H96c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H288c35.3 0 64-28.7 64-64V384h64c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64H224zM288 384H96V160H224c0-17.7 14.3-32 32-32h64V256c0 17.7 14.3 32 32 32h96V384H288z"/></svg>&nbsp;<small din="html.share_copy"></small></button></div>
              <div class="form-group col-xs-4 text-center"><button title="Twitter" class="share btn btn-light" data="tw_view"><svg style="width:14px;height:14px;vertical-align:text-bottom;" viewBox="0 0 512 512"><path fill="currentColor" d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/></svg>&nbsp;<small>Twitter</small></button></div>
              <div class="form-group col-xs-4 text-center"><button title="Facebook" class="share btn btn-light" data="fb_view"><svg style="width:14px;height:14px;vertical-align:text-bottom;" viewBox="0 0 512 512"><path fill="currentColor" d="M504 256C504 119 393 8 256 8S8 119 8 256c0 121.3 87.1 222.4 203 240.5V327.9h-61v-71.9h61V203c0-60.8 35.8-93.7 89.2-93.7 25.5 0 50.4 1.8 56.1 2.6v62.4h-35.4c-29.5 0-37.4 18.2-37.4 42.1v59.6h68.9l-11 71.9h-57.9V496.5C416.9 478.4 504 377.3 504 256z"/></svg>&nbsp;<small>Facebook</small></button></div>
            </div>
            <div class="qr_view center-block" style="width:128px;"></div>
          </div>
          <p><img src="" height="0px" width="0px"></p>
        </div>

        <d c="modal_map_content">
            ${ca.map((A) => A == "title" || A == "officialTitle" ? "" : `<d c="recipients ${A}_div"><dl c="dl-horizontal">
                      <dt din="html.${A}"></dt>
                      <dd c="${A}_dd"></dd>
                    </dl></d> `).join("")}
          <d c="recipients modal_cache_content"><dl c="dl-horizontal">
            <dt din="html.cache_handle"></dt>
            <dd><s c="cache_size"></s></dd>
            <dt></dt>
            <dd><s c="pull-right"><button c="cache_fetch btn btn-default" href="#" din="html.cache_fetch"></button>
              <button c="cache_delete btn btn-default" href="#" din="html.cache_delete"></button></s></dd>
          </dl></d> 
        </d>

        <d c="modal_load_content">
          <p c="recipient"><img src="${Ne["loading.png"]}"><s din="html.app_loading_body"></s></p>
          <d c="splash_div hide row"><p c="col-xs-12 poi_img"><img c="splash_img" src=""></p></d> 
          <p><img src="" height="0px" width="0px"></p>
        </d> 

        <d c="modal_marker_list_content">
          <ul c="list-group"></ul>
        </d> 

        <p c="modal_gpsD_content" c="recipient"></p>
        <p c="modal_gpsW_content" c="recipient"></p>

      </d> 
    </d> 
  </d> 
</d> `);
  for (let A = c.length - 1; A >= 0; A--)
    t.core.mapDivDocument.insertBefore(
      c[A],
      t.core.mapDivDocument.firstChild
    );
  if (a) {
    a === !0 && (a = `./pwa/${t.core.appid}_manifest.json`), o || (o = "./service-worker.js"), l || (l = "./");
    const A = document.querySelector("head");
    A && (A.querySelector('link[rel="manifest"]') || A.appendChild(
      ce(`<link rel="manifest" href="${a}">`)[0]
    ));
    try {
      Fe.registerSW(o, { scope: l });
    } catch {
    }
    if (A && !A.querySelector('link[rel="apple-touch-icon"]')) {
      const u = new XMLHttpRequest();
      u.open("GET", a, !0), u.responseType = "json", u.onload = function(f) {
        let h = this.response;
        if (h && (typeof h != "object" && (h = JSON.parse(h)), h.icons))
          for (let v = 0; v < h.icons.length; v++) {
            const g = Mp(a, h.icons[v].src), b = `<link rel="apple-touch-icon" sizes="${h.icons[v].sizes}" href="${g}">`;
            A.appendChild(ce(b)[0]);
          }
      }, u.send();
    }
  }
  t.core.addEventListener("uiPrepare", (A) => {
    const u = function(g) {
      const C = /\$\{([a-zA-Z0-9_\.\/\-]+)\}/g;
      let b = g, w;
      for (; (w = C.exec(g)) != null; )
        b = b.replace(w[0], Ne[w[1]]);
      return b;
    };
    let f = t.core.mapDivDocument.querySelectorAll("[data-i18n], [din]");
    for (let g = 0; g < f.length; g++) {
      const C = f[g], b = C.getAttribute("data-i18n") || C.getAttribute("din");
      C.innerText = u(t.core.t(b));
    }
    f = t.core.mapDivDocument.querySelectorAll("[data-i18n-html], [dinh]");
    for (let g = 0; g < f.length; g++) {
      const C = f[g], b = C.getAttribute("data-i18n-html") || C.getAttribute("dinh");
      C.innerHTML = u(t.core.t(b));
    }
    const h = t.core.mapDivDocument.querySelector('[data-i18n="html.app_loading_body"], [din="html.app_loading_body"]');
    h && (h.innerHTML = u(t.core.t("html.app_loading_body")));
    const v = {
      reverse: !0,
      tipLabel: t.core.t("control.trans", { ns: "translation" })
    };
    if (r && (v.initialValue = r / 100), t.sliderNew = new _f(v), t.core.appData.controls = [
      new sp({
        tipLabel: t.core.t("control.info", { ns: "translation" })
      }),
      new tp({
        tipLabel: t.core.t("control.compass", { ns: "translation" })
      }),
      new lp({
        tipLabel: t.core.t("control.zoom", { ns: "translation" })
      }),
      new ep({
        ui: t,
        tipLabel: t.core.t("control.gps", { ns: "translation" })
      }),
      new $f({
        tipLabel: t.core.t("control.home", { ns: "translation" })
      }),
      t.sliderNew,
      new ip({
        tipLabel: t.core.t("control.help", { ns: "translation" })
      })
    ], t.enableShare && t.core.appData.controls.push(
      new np({
        tipLabel: t.core.t("control.share", { ns: "translation" })
      })
    ), t.enableBorder && t.core.appData.controls.push(
      new rp({
        tipLabel: t.core.t("control.border", { ns: "translation" })
      })
    ), t.enableHideMarker && t.core.appData.controls.push(
      new ap({
        tipLabel: t.core.t("control.hide_marker", { ns: "translation" })
      })
    ), t.enableMarkerList && t.core.appData.controls.push(
      new op({
        tipLabel: t.core.t("control.marker_list", { ns: "translation" })
      })
    ), t.contextMenu = new Ep({
      eventType: "__dummy__",
      width: 170,
      defaultItems: !1,
      items: []
    }), t.core.appData.controls.push(t.contextMenu), t.sliderNew.on("propertychange", (g) => {
      g.key === "slidervalue" && (t.core.setTransparency(t.sliderNew.get(g.key) * 100), t.updateUrl());
    }), n) {
      let g = !1;
      t.core.appData.splash && (g = !0);
      const C = t.core.mapDivDocument.querySelector(".modalBase"), b = new oe(C, { root: t.core.mapDivDocument });
      t.core.mapDivDocument.querySelector(".modal_load_title").innerText = t.core.translate(t.core.appData.appName) || "", g && (t.core.mapDivDocument.querySelector(".splash_img").setAttribute("src", `img/${t.core.appData.splash}`), t.core.mapDivDocument.querySelector(".splash_div").classList.remove("hide")), t.modalSetting("load"), b.show();
      const w = g ? 1e3 : 200;
      t.splashPromise = new Promise((p) => {
        setTimeout(() => {
          p();
        }, w);
      });
    }
    document.querySelector("title").innerHTML = t.core.translate(
      t.core.appName
    ) || "";
  }), t.core.addEventListener("mapChanged", (A) => {
    const u = A.detail;
    t.baseSwiper.setSlideMapID(u.mapID), t.overlaySwiper.setSlideMapID(u.mapID);
    const f = u.officialTitle || u.title || u.label;
    t.core.mapDivDocument.querySelector(".map-title span").innerText = t.core.translate(f) || "", t.checkOverlayID(u.mapID) ? t.sliderNew.setEnable(!0) : t.sliderNew.setEnable(!1);
    const h = t.sliderNew.get("slidervalue") * 100;
    t.core.mapObject.setTransparency(h), t.updateEnvelope(), t.updateUrl();
  }), t.core.addEventListener("poi_number", (A) => {
    A.detail ? t.core.mapDivDocument.classList.remove("no_poi") : t.core.mapDivDocument.classList.add("no_poi");
  }), t.core.addEventListener("outOfMap", (A) => {
    if (i) {
      t.core.mapDivDocument.querySelector(".modal_title").innerText = t.core.t("app.out_of_map") || "", t.core.mapDivDocument.querySelector(".modal_gpsD_content").innerText = t.core.t("app.out_of_map_area") || "";
      const u = t.core.mapDivDocument.querySelector(".modalBase"), f = new oe(u, { root: t.core.mapDivDocument });
      t.modalSetting("gpsD"), f.show();
    }
  }), t.core.addEventListener("sourceLoaded", (A) => {
    const u = A.detail, f = ["maroon", "deeppink", "indigo", "olive", "royalblue", "red", "hotpink", "green", "yellow", "navy", "saddlebrown", "fuchsia", "darkslategray", "yellowgreen", "blue", "mediumvioletred", "purple", "lime", "darkorange", "teal", "crimson", "darkviolet", "darkolivegreen", "steelblue", "aqua"], h = [];
    let v = 0;
    for (let p = 0; p < u.length; p++) {
      const E = u[p];
      if (E.envelope) {
        t.appEnvelope && E.envelope.geometry.coordinates[0].map((I) => {
          h.length === 0 ? (h[0] = h[2] = I[0], h[1] = h[3] = I[1]) : (I[0] < h[0] && (h[0] = I[0]), I[0] > h[2] && (h[2] = I[0]), I[1] < h[1] && (h[1] = I[1]), I[1] > h[3] && (h[3] = I[1]));
        }), E.envelopeColor = f[v], v++, v === f.length && (v = 0);
        const M = E.envelope.geometry.coordinates[0];
        E.envelopeAreaIndex = t.areaIndex(M);
      }
    }
    t.appEnvelope && console.log(`This app's envelope is: ${h}`), t.splashPromise && t.splashPromise.then(() => {
      const p = t.core.mapDivDocument.querySelector(".modalBase"), E = oe.getInstance(p) || new oe(p, { root: t.core.mapDivDocument });
      t.modalSetting("load"), E.hide();
    });
    const g = [], C = [];
    for (let p = 0; p < u.length; p++) {
      const E = u[p];
      fh(E) ? g.push(E) : C.push(E);
    }
    const b = t.baseSwiper = new me(".base-swiper", {
      slidesPerView: 2,
      spaceBetween: 15,
      breakpoints: {
        480: {
          slidesPerView: 1.4,
          spaceBetween: 10
        }
      },
      centeredSlides: !0,
      threshold: 2,
      preventClicks: !0,
      preventClicksPropagation: !0,
      observer: !0,
      observeParents: !0,
      loop: g.length >= 2,
      navigation: {
        nextEl: ".base-next",
        prevEl: ".base-prev"
      }
    });
    b.on("click", (p) => {
      if (!b.clickedSlide) return;
      const E = b.clickedSlide;
      t.core.changeMap(E.getAttribute("data")), delete t._selectCandidateSources, b.setSlideIndexAsSelected(
        parseInt(E.getAttribute("data-swiper-slide-index") || "0", 10)
      );
    }), g.length < 2 && t.core.mapDivDocument.querySelector(".base-swiper").classList.add("single-map");
    const w = t.overlaySwiper = new me(".overlay-swiper", {
      slidesPerView: 2,
      spaceBetween: 15,
      breakpoints: {
        480: {
          slidesPerView: 1.4,
          spaceBetween: 10
        }
      },
      centeredSlides: !0,
      threshold: 2,
      preventClicks: !0,
      preventClicksPropagation: !0,
      observer: !0,
      observeParents: !0,
      loop: C.length >= 2,
      navigation: {
        nextEl: ".overlay-next",
        prevEl: ".overlay-prev"
      }
    });
    w.on("click", (p) => {
      if (!w.clickedSlide) return;
      const E = w.clickedSlide;
      t.core.changeMap(E.getAttribute("data")), delete t._selectCandidateSources, w.setSlideIndexAsSelected(
        parseInt(E.getAttribute("data-swiper-slide-index") || "0", 10)
      );
    }), C.length < 2 && t.core.mapDivDocument.querySelector(".overlay-swiper").classList.add("single-map");
    for (let p = 0; p < g.length; p++) {
      const E = g[p], M = E.thumbnail ? E.thumbnail.split("/").pop() : "", I = Ne[M] || E.thumbnail;
      b.appendSlide(
        `<div class="swiper-slide" data="${E.mapID}"><img crossorigin="anonymous" src="${I}"><div> ${t.core.translate(E.label)}</div> </div> `
      );
    }
    for (let p = 0; p < C.length; p++) {
      const E = C[p], M = E.envelope ? ` ${E.envelopeColor}` : "", I = E.thumbnail ? E.thumbnail.split("/").pop() : "", y = Ne[I] || E.thumbnail;
      w.appendSlide(
        `<div class="swiper-slide${M}" data="${E.mapID}"><img crossorigin="anonymous" src="${y}"><div> ${t.core.translate(E.label)}</div> </div> `
      );
    }
    w.on("slideChange", () => {
      t.updateEnvelope();
    }), b.slideToLoop(0), w.slideToLoop(0), tl(t.core.mapDivDocument);
  }), t.core.waitReady.then(() => {
    t.core.mapObject.getViewport().addEventListener("pointerdown", (A) => {
      t.lastClickPixel = t.core.mapObject.getEventPixel(A), t.lastClickCoordinate = t.core.mapObject.getCoordinateFromPixel(t.lastClickPixel);
    }, !0);
  }), t.core.addEventListener("clickMarkers", (A) => {
    const u = A.detail;
    if (u.length === 1)
      t.handleMarkerAction(u[0]);
    else {
      const f = [];
      u.forEach((h) => {
        f.push({
          icon: h.icon || Ne["defaultpin.png"],
          text: t.core.translate(h.name),
          callback: () => {
            t.handleMarkerAction(h);
          }
        });
      }), t.showContextMenu(f);
    }
  }), t.core.waitReady.then(() => {
    t.core.mapObject.on("click_control", (A) => {
      const u = A.control || A.frameState && A.frameState.control, f = t.core.mapDivDocument.querySelector(".modalBase"), h = oe.getInstance(f) || new oe(f), v = f.querySelectorAll(".close, .modal-footer button");
      for (let g = 0; g < v.length; g++)
        v[g].addEventListener("click", () => {
          h.hide();
        });
      if (u === "help")
        t.modalSetting("help"), h.show();
      else if (u === "share") {
        t.modalSetting("share");
        const g = f.querySelector(".modal-body"), C = t.getShareUrl("app"), b = t.getShareUrl("view"), w = g.querySelector(".qr_app"), p = g.querySelector(".qr_view");
        w && aa(C, { width: 128, margin: 1 }, (E, M) => {
          E || (w.innerHTML = "", w.appendChild(M));
        }), p && aa(b, { width: 128, margin: 1 }, (E, M) => {
          E || (p.innerHTML = "", p.appendChild(M));
        }), h.show();
      } else if (u === "markerList") {
        t.modalSetting("marker_list"), h.show();
        const g = f.querySelector(".modal_marker_list_content ul.list-group");
        g.innerHTML = "", t.core.listPoiLayers(!1, !0).forEach((b) => {
          const w = ce(`<li class="list-group-item layer">
                        <div class="row layer_row">
                           <div class="layer_label">
                              <span class="dli-chevron"></span>
                              <img src="${b.icon || Ne["defaultpin.png"]}" class="markerlist"> ${t.core.translate(b.name)}
                           </div>
                           <div class="layer_onoff">
                              <input type="checkbox" class="markerlist" ${b.hide ? "" : "checked"}>
                              <label class="check"><div></div></label>
                           </div>
                        </div>
                    </li>`)[0], p = w.querySelector("input[type=checkbox]");
          w.querySelector("label.check").addEventListener("click", (I) => {
            I.stopPropagation(), p.disabled || (p.checked = !p.checked, p.dispatchEvent(new Event("change")));
          }), p.addEventListener("click", (I) => I.stopPropagation()), p.addEventListener("change", (I) => {
            I.target.checked ? t.core.showPoiLayer(b.id) : t.core.hidePoiLayer(b.id);
          });
          const M = ce('<ul class="list_poiitems_div"></ul>')[0];
          w.querySelector(".layer_label").addEventListener("click", () => {
            M.classList.toggle("open");
          }), g.appendChild(w), g.appendChild(M), b.pois && b.pois.forEach((I) => {
            const y = ce(`<li class="list-group-item poi">
                                <div class="row poi_row">
                                   <div class="poi_label">
                                      <span class="dli-chevron"></span>
                                      <img src="${I.icon || b.icon || Ne["defaultpin.png"]}" class="markerlist"> ${t.core.translate(I.name)}
                                   </div>
                                </div>
                            </li>`)[0], x = ce('<div class="list_poicontent_div"></div>')[0];
            let D;
            y.addEventListener("click", () => {
              var B, F, T, H;
              if (x.classList.contains("open"))
                x.classList.remove("open"), D && D(), x.innerHTML = "", (H = (T = t.core).unselectMarker) == null || H.call(T);
              else {
                x.classList.add("open");
                const Q = rl(t, x, I);
                if (Q) {
                  const [q, te] = Q;
                  D = te, q && q();
                }
                (F = (B = t.core).selectMarker) == null || F.call(B, I.namespaceID);
              }
            }), M.appendChild(y), M.appendChild(x);
          });
        });
      } else if (u === "copyright") {
        t.modalSetting("map");
        const g = t.core.from, C = t.core.mapDivDocument, b = C.querySelector(".modal_map .modal_title");
        if (b) {
          const w = g.get ? g.get("title") : g.title;
          b.innerText = t.core.translate(w) || "";
        }
        ca.forEach((w) => {
          if (w === "title" || w === "officialTitle") return;
          const p = g.get ? g.get(w) : g[w], E = C.querySelector(`.modal_map .${w}_div`);
          if (E)
            if (p) {
              E.style.display = "block";
              const M = E.querySelector(`.${w}_dd`);
              if (M)
                if (w === "license" || w === "dataLicense") {
                  const I = p.toLowerCase().replace(/ /g, "_");
                  M.innerHTML = `<img src="assets/parts/${I}.png" class="license" />`;
                } else
                  M.innerHTML = t.core.translate(p) || "";
            } else
              E.style.display = "none";
        }), h.show();
      } else if (u === "border")
        t.setShowBorder(!t.core.stateBuffer.showBorder);
      else if (u === "hideMarker") {
        const g = t.core.mapDivDocument.classList.contains("hide-marker");
        t.setHideMarker(!g);
      }
      t.updateUrl();
    }), t.core.mapObject.on("moveend", (A) => {
      t.updateUrl();
    });
  });
}
me.use([va, wa]);
class il extends ua {
  constructor(n) {
    super();
    m(this, "core");
    m(this, "appOption");
    m(this, "waitReady");
    m(this, "waitReadyBridge");
    m(this, "pathThatSet");
    m(this, "swipers", {});
    m(this, "mobile_if");
    m(this, "ui_func");
    m(this, "datum");
    m(this, "selected_layer");
    m(this, "toms");
    m(this, "cache_messages");
    m(this, "last_toast");
    m(this, "share_enable");
    m(this, "sliderNew");
    m(this, "baseSwiper");
    m(this, "overlaySwiper");
    m(this, "sliderCommon");
    m(this, "contextMenu");
    m(this, "splashPromise");
    m(this, "_selectCandidateSources");
    m(this, "appEnvelope");
    m(this, "restoring", !1);
    m(this, "poiSwiper");
    m(this, "html");
    m(this, "enablePoiHtmlNoScroll", !1);
    m(this, "enableShare", !1);
    m(this, "enableHideMarker", !1);
    m(this, "enableBorder", !1);
    m(this, "enableMarkerList", !1);
    m(this, "disableNoimage", !1);
    m(this, "alwaysGpsOn", !1);
    m(this, "isTouch", !1);
    m(this, "html_id_seed");
    m(this, "lastClickPixel");
    m(this, "lastClickCoordinate");
    const r = this;
    this.html_id_seed = `${Math.floor(Math.random() * 9e3) + 1e3}`, this.appOption = n, n.stateUrl ? (Kt((i, s) => {
      let a = i.canonicalPath.split("#!"), o = a.length > 1 ? a[1] : a[0];
      if (console.log(`[Debug] Page callback.Canonical: ${i.canonicalPath}, Path: ${o} `), a = o.split("?"), o = a[0], o === r.pathThatSet) {
        delete r.pathThatSet;
        return;
      }
      const l = {
        transparency: 0,
        position: {
          rotation: 0
        }
      };
      if (o.split("/").forEach((c) => {
        if (!c) return;
        const d = c.split(":");
        switch (console.log(`[Debug] Parsing state: ${c} `, d), d[0]) {
          case "s":
            l.mapID = d[1];
            break;
          case "b":
            l.backgroundID = d[1];
            break;
          case "t":
            l.transparency = parseFloat(d[1]);
            break;
          case "r":
            l.position.rotation = parseFloat(d[1]);
            break;
          case "z":
            l.position.zoom = parseFloat(d[1]);
            break;
          case "x":
          case "y":
            l.position[d[0]] = parseFloat(d[1]);
            break;
          case "sb":
            l.showBorder = !!parseInt(d[1]);
            break;
          case "hm":
            l.hideMarker = !!parseInt(d[1]);
            break;
          case "hl":
            l.hideLayer = d[1];
            break;
          case "om":
            l.openedMarker = d[1];
            break;
          case "c":
            if (r.core) {
              const A = r.core.mapDivDocument.querySelector(".modalBase");
              new oe(A, {
                root: r.core.mapDivDocument
              }).hide();
            }
            break;
        }
      }), r.core)
        l.mapID && (console.log("[Debug] ChangeMap with restore: ", JSON.parse(JSON.stringify(l))), r.restoring = !0, r.core.waitReady.then(() => {
          const c = r.core.changeMap(l.mapID, l);
          Promise.resolve(c).then(() => {
            if (r.sliderNew) {
              const A = (l.transparency || 0) / 100;
              r.sliderNew.set("slidervalue", A), r.sliderNew.element && (r.sliderNew.element.value = (1 - A).toString());
            }
            r.restoring = !1, console.log("[Debug] Calling updateUrl from ChangeMap"), r.updateUrl();
          });
        }));
      else {
        l.mapID && (console.log("[Debug] Init with restore: ", JSON.parse(JSON.stringify(l))), n.restore = l, r.restoring = !0);
        const c = l.position ? l.position.rotation : "undefined";
        console.log(`[Debug] Before initializer: rotation = ${c} `), r.initializer(n).then(() => {
          r.core.waitReady.then(() => {
            if (r.sliderNew) {
              const d = r.sliderNew.get("slidervalue") * 100;
              console.log(`[Debug] Slider transparency: ${d} `);
            } else
              console.log("[Debug] Slider not ready yet");
            r.restoring = !1, console.log("[Debug] Calling updateUrl from Init"), r.updateUrl();
          });
        });
      }
    }), Kt({
      hashbang: !0
    }), Kt(), r.waitReady = new Promise((i, s) => {
      r.waitReadyBridge = i;
    })) : r.waitReady = r.initializer(n);
  }
  static createObject(n) {
    const r = new il(n);
    return r.waitReady.then(() => r);
  }
  async initializer(n) {
    return xh(this, n);
  }
  handleMarkerAction(n) {
    Ch(this, n);
  }
  showContextMenu(n) {
    bh(this, n);
  }
  async xyToMapIDs(n, r = 10) {
    return Eh(this, n, r);
  }
  setShowBorder(n) {
    this.core.requestUpdateState({ showBorder: n ? 1 : 0 }), this.updateEnvelope(), n ? this.core.mapDivDocument.classList.add("show-border") : this.core.mapDivDocument.classList.remove("show-border"), this.core.restoreSession && this.core.requestUpdateState({ showBorder: n ? 1 : 0 });
  }
  setHideMarker(n) {
    Ih(this, n);
  }
  handleMarkerActionById(n) {
    yh(this, n);
  }
  updateUrl() {
    const n = this;
    if (!n.appOption.stateUrl || n.restoring) return;
    const r = n.core.mapObject;
    if (!r) return;
    const i = r.getView(), s = i.getCenter(), a = i.getZoom(), o = i.getRotation(), l = n.core.from ? n.core.from.mapID : "";
    if (!l) return;
    let c = "";
    if (n.baseSwiper) {
      const u = n.baseSwiper.slides[n.baseSwiper.activeIndex];
      u && (c = u.getAttribute("data") || "");
    }
    const d = n.sliderNew ? n.sliderNew.get("slidervalue") * 100 : 0;
    let A = `s:${l}`;
    c && c !== l && (A += `/b:${c}`), d > 0 && (A += `/t:${d}`), A += `/x:${s[0]}`, A += `/y:${s[1]}`, A += `/z:${a}`, o !== 0 && (A += `/r:${o * 180 / Math.PI}`), n.core.stateBuffer.showBorder && (A += "/sb:1"), n.core.mapDivDocument.classList.contains("hide-marker") && (A += "/hm:1"), n.enableMarkerList && n.core.stateBuffer.markerList && (A += `/om:${n.core.stateBuffer.markerList}`), n.pathThatSet !== A && (n.pathThatSet = A, Kt(`#!${A}`));
  }
  updateEnvelope() {
    const n = this;
    if (n.core.mapObject && (n.core.mapObject.resetEnvelope(), n._selectCandidateSources && Object.keys(n._selectCandidateSources).forEach((r) => {
      n.core.mapObject.removeEnvelope && (console.log(`[Debug] Removing envelope for ${r}`), n.core.mapObject.removeEnvelope(n._selectCandidateSources[r]));
    }), n._selectCandidateSources = {}, n.core.stateBuffer.showBorder)) {
      if (!n.core.from) return;
      let r = null;
      if (n.overlaySwiper) {
        const i = n.overlaySwiper.slides[n.overlaySwiper.activeIndex];
        i && (r = i.getAttribute("data"));
      }
      Object.keys(n.core.cacheHash).filter((i) => n.core.cacheHash[i].envelope).map((i) => {
        const s = n.core.cacheHash[i], a = i === r, o = i === n.core.from.mapID && typeof s.xy2SysCoord == "function" ? [
          [0, 0],
          [s.width, 0],
          [s.width, s.height],
          [0, s.height],
          [0, 0]
        ].map((l) => Promise.resolve(s.xy2SysCoord(l))) : s.envelope.geometry.coordinates[0].map(
          (l) => n.core.from.merc2SysCoordAsync(l)
        );
        Promise.all(o).then((l) => {
          const c = {
            color: s.envelopeColor,
            width: 2,
            lineDash: [6, 6]
          };
          if (n.core.mapObject.setEnvelope(l, c), a && n.core.mapObject.setFillEnvelope) {
            console.log(`[Debug] Setting fill envelope for ${i}`);
            const d = Il(s.envelopeColor || "#000000");
            d[3] = 0.4;
            const A = n.core.mapObject.setFillEnvelope(l, null, { color: d });
            n._selectCandidateSources[i] = A;
          }
        });
      });
    }
  }
  resolveRelativeLink(n, r) {
    return el(n, r);
  }
  checkOverlayID(n) {
    return Mh(this, n);
  }
  areaIndex(n) {
    return 0.5 * Math.abs(
      [0, 1, 2, 3].reduce((r, i, s) => {
        const a = n[s], o = n[s + 1];
        return r + (a[0] - o[0]) * (a[1] + o[1]);
      }, 0)
    );
  }
  getShareUrl(n) {
    return n === "view" ? window.location.href : window.location.href.split("?")[0].split("#")[0];
  }
  showToast(n, r) {
    let i = document.querySelector(".custom-toast");
    if (i || (i = document.createElement("div"), i.className = "custom-toast", document.body.appendChild(i)), i.innerText = n, r) {
      const a = (r.closest(".recipient") || r).getBoundingClientRect();
      i.style.position = "fixed", i.style.left = a.left + a.width / 2 + "px", i.style.top = a.top + a.height / 2 + "px", i.style.transform = "translate(-50%, -50%)", i.style.bottom = "auto", i.style.margin = "0";
    } else
      i.style.position = "fixed", i.style.left = "50%", i.style.bottom = "30px", i.style.top = "auto", i.style.transform = "", i.style.marginLeft = "-125px";
    i.classList.add("show"), setTimeout(() => {
      i.classList.remove("show");
    }, 1500);
  }
  modalSetting(n) {
    const r = this.core.mapDivDocument.querySelector(".modalBase");
    r.classList.remove("modal_load", "modal_poi", "modal_share", "modal_help", "modal_gpsW", "modal_gpsD", "modal_map", "modal_marker_list"), r.classList.add(`modal_${n}`);
  }
  ellips() {
    tl(this.core.mapDivDocument);
  }
  remove() {
    this.core.remove(), delete this.core;
  }
}
export {
  il as MaplatUi
};
