var $l = Object.defineProperty;
var na = (r) => {
  throw TypeError(r);
};
var tg = (r, i, t) => i in r ? $l(r, i, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[i] = t;
var Or = (r, i, t) => tg(r, typeof i != "symbol" ? i + "" : i, t), Xr = (r, i, t) => i.has(r) || na("Cannot " + t);
var a = (r, i, t) => (Xr(r, i, "read from private field"), t ? t.call(r) : i.get(r)), v = (r, i, t) => i.has(r) ? na("Cannot add the same private member more than once") : i instanceof WeakSet ? i.add(r) : i.set(r, t), d = (r, i, t, e) => (Xr(r, i, "write to private field"), e ? e.call(r, t) : i.set(r, t), t), A = (r, i, t) => (Xr(r, i, "access private method"), t);
var Et = (r, i, t, e) => ({
  set _(n) {
    d(r, i, n, t);
  },
  get _() {
    return a(r, i, e);
  }
});
var eg = Object.defineProperty, tA = (r) => {
  throw TypeError(r);
}, ig = (r, i, t) => i in r ? eg(r, i, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[i] = t, Dr = (r, i, t) => ig(r, typeof i != "symbol" ? i + "" : i, t), fo = (r, i, t) => i.has(r) || tA("Cannot " + t), b = (r, i, t) => (fo(r, i, "read from private field"), t ? t.call(r) : i.get(r)), $ = (r, i, t) => i.has(r) ? tA("Cannot add the same private member more than once") : i instanceof WeakSet ? i.add(r) : i.set(r, t), O = (r, i, t, e) => (fo(r, i, "write to private field"), i.set(r, t), t), S = (r, i, t) => (fo(r, i, "access private method"), t), ra = (r, i, t, e) => ({
  set _(n) {
    O(r, i, n);
  },
  get _() {
    return b(r, i, e);
  }
});
function sa(r, i) {
  (i == null || i > r.length) && (i = r.length);
  for (var t = 0, e = Array(i); t < i; t++) e[t] = r[t];
  return e;
}
function ng(r) {
  if (Array.isArray(r)) return r;
}
function rg(r, i) {
  var t = r == null ? null : typeof Symbol < "u" && r[Symbol.iterator] || r["@@iterator"];
  if (t != null) {
    var e, n, o, g, c = [], C = !0, h = !1;
    try {
      if (o = (t = t.call(r)).next, i !== 0) for (; !(C = (e = o.call(t)).done) && (c.push(e.value), c.length !== i); C = !0) ;
    } catch (f) {
      h = !0, n = f;
    } finally {
      try {
        if (!C && t.return != null && (g = t.return(), Object(g) !== g)) return;
      } finally {
        if (h) throw n;
      }
    }
    return c;
  }
}
function sg() {
  throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function og(r, i) {
  return ng(r) || rg(r, i) || ag(r, i) || sg();
}
function ag(r, i) {
  if (r) {
    if (typeof r == "string") return sa(r, i);
    var t = {}.toString.call(r).slice(8, -1);
    return t === "Object" && r.constructor && (t = r.constructor.name), t === "Map" || t === "Set" ? Array.from(r) : t === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? sa(r, i) : void 0;
  }
}
const eA = Object.entries, oa = Object.setPrototypeOf, Ag = Object.isFrozen, iA = Object.getPrototypeOf, nA = Object.getOwnPropertyDescriptor;
let it = Object.freeze, at = Object.seal, Ci = Object.create, rA = typeof Reflect < "u" && Reflect, hs = rA.apply, ps = rA.construct;
it || (it = function(r) {
  return r;
});
at || (at = function(r) {
  return r;
});
hs || (hs = function(r, i) {
  for (var t = arguments.length, e = new Array(t > 2 ? t - 2 : 0), n = 2; n < t; n++) e[n - 2] = arguments[n];
  return r.apply(i, e);
});
ps || (ps = function(r) {
  for (var i = arguments.length, t = new Array(i > 1 ? i - 1 : 0), e = 1; e < i; e++) t[e - 1] = arguments[e];
  return new r(...t);
});
const te = Y(Array.prototype.forEach), lg = Y(Array.prototype.lastIndexOf), aa = Y(Array.prototype.pop), ji = Y(Array.prototype.push), gg = Y(Array.prototype.slice), cg = Y(Array.prototype.splice), xi = Array.isArray, Nr = sA(Set), Wr = Y(Set.prototype.add), Zi = Y(Set.prototype.has), je = Y(String.prototype.toLowerCase), jr = Y(String.prototype.toString), Aa = Y(String.prototype.match), Gi = Y(String.prototype.replace), la = Y(String.prototype.indexOf), Ig = Y(String.prototype.trim), Cg = Y(Number.prototype.toString), hg = Y(Boolean.prototype.toString), ga = typeof BigInt > "u" ? null : Y(BigInt.prototype.toString), ca = typeof Symbol > "u" ? null : Y(Symbol.prototype.toString), dt = Y(Object.prototype.hasOwnProperty), Hi = Y(Object.prototype.toString), st = Y(RegExp.prototype.test), ee = sA(TypeError);
function Y(r) {
  return function(i) {
    i instanceof RegExp && (i.lastIndex = 0);
    for (var t = arguments.length, e = new Array(t > 1 ? t - 1 : 0), n = 1; n < t; n++) e[n - 1] = arguments[n];
    return hs(r, i, e);
  };
}
function sA(r) {
  return function() {
    for (var i = arguments.length, t = new Array(i), e = 0; e < i; e++) t[e] = arguments[e];
    return ps(r, t);
  };
}
function D(r, i) {
  let t = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : je;
  if (oa && oa(r, null), !xi(i)) return r;
  let e = i.length;
  for (; e--; ) {
    let n = i[e];
    if (typeof n == "string") {
      const o = t(n);
      o !== n && (Ag(i) || (i[e] = o), n = o);
    }
    r[n] = !0;
  }
  return r;
}
function pg(r) {
  for (let i = 0; i < r.length; i++) dt(r, i) || (r[i] = null);
  return r;
}
function mt(r) {
  const i = Ci(null);
  for (const e of eA(r)) {
    var t = og(e, 2);
    const n = t[0], o = t[1];
    dt(r, n) && (xi(o) ? i[n] = pg(o) : o && typeof o == "object" && o.constructor === Object ? i[n] = mt(o) : i[n] = o);
  }
  return i;
}
function dg(r) {
  switch (typeof r) {
    case "string":
      return r;
    case "number":
      return Cg(r);
    case "boolean":
      return hg(r);
    case "bigint":
      return ga ? ga(r) : "0";
    case "symbol":
      return ca ? ca(r) : "Symbol()";
    case "undefined":
      return Hi(r);
    case "function":
    case "object": {
      if (r === null) return Hi(r);
      const i = r, t = xt(i, "toString");
      if (typeof t == "function") {
        const e = t(i);
        return typeof e == "string" ? e : Hi(e);
      }
      return Hi(r);
    }
    default:
      return Hi(r);
  }
}
function xt(r, i) {
  for (; r !== null; ) {
    const e = nA(r, i);
    if (e) {
      if (e.get) return Y(e.get);
      if (typeof e.value == "function") return Y(e.value);
    }
    r = iA(r);
  }
  function t() {
    return null;
  }
  return t;
}
function ug(r, i) {
  for (; r !== null; ) {
    const t = nA(r, i);
    if (t) return t.get ? Y(t.get) : null;
    r = iA(r);
  }
  return null;
}
function mg(r) {
  try {
    return st(r, ""), !0;
  } catch {
    return !1;
  }
}
const Ia = it([
  "a",
  "abbr",
  "acronym",
  "address",
  "area",
  "article",
  "aside",
  "audio",
  "b",
  "bdi",
  "bdo",
  "big",
  "blink",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "center",
  "cite",
  "code",
  "col",
  "colgroup",
  "content",
  "data",
  "datalist",
  "dd",
  "decorator",
  "del",
  "details",
  "dfn",
  "dialog",
  "dir",
  "div",
  "dl",
  "dt",
  "element",
  "em",
  "fieldset",
  "figcaption",
  "figure",
  "font",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hgroup",
  "hr",
  "html",
  "i",
  "img",
  "input",
  "ins",
  "kbd",
  "label",
  "legend",
  "li",
  "main",
  "map",
  "mark",
  "marquee",
  "menu",
  "menuitem",
  "meter",
  "nav",
  "nobr",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "picture",
  "pre",
  "progress",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "search",
  "section",
  "select",
  "shadow",
  "slot",
  "small",
  "source",
  "spacer",
  "span",
  "strike",
  "strong",
  "style",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "template",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "tr",
  "track",
  "tt",
  "u",
  "ul",
  "var",
  "video",
  "wbr"
]), Zr = it([
  "svg",
  "a",
  "altglyph",
  "altglyphdef",
  "altglyphitem",
  "animatecolor",
  "animatemotion",
  "animatetransform",
  "circle",
  "clippath",
  "defs",
  "desc",
  "ellipse",
  "enterkeyhint",
  "exportparts",
  "filter",
  "font",
  "g",
  "glyph",
  "glyphref",
  "hkern",
  "image",
  "inputmode",
  "line",
  "lineargradient",
  "marker",
  "mask",
  "metadata",
  "mpath",
  "part",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialgradient",
  "rect",
  "stop",
  "style",
  "switch",
  "symbol",
  "text",
  "textpath",
  "title",
  "tref",
  "tspan",
  "view",
  "vkern"
]), Gr = it([
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence"
]), fg = it([
  "animate",
  "color-profile",
  "cursor",
  "discard",
  "font-face",
  "font-face-format",
  "font-face-name",
  "font-face-src",
  "font-face-uri",
  "foreignobject",
  "hatch",
  "hatchpath",
  "mesh",
  "meshgradient",
  "meshpatch",
  "meshrow",
  "missing-glyph",
  "script",
  "set",
  "solidcolor",
  "unknown",
  "use"
]), Hr = it([
  "math",
  "menclose",
  "merror",
  "mfenced",
  "mfrac",
  "mglyph",
  "mi",
  "mlabeledtr",
  "mmultiscripts",
  "mn",
  "mo",
  "mover",
  "mpadded",
  "mphantom",
  "mroot",
  "mrow",
  "ms",
  "mspace",
  "msqrt",
  "mstyle",
  "msub",
  "msup",
  "msubsup",
  "mtable",
  "mtd",
  "mtext",
  "mtr",
  "munder",
  "munderover",
  "mprescripts"
]), bg = it([
  "maction",
  "maligngroup",
  "malignmark",
  "mlongdiv",
  "mscarries",
  "mscarry",
  "msgroup",
  "mstack",
  "msline",
  "msrow",
  "semantics",
  "annotation",
  "annotation-xml",
  "mprescripts",
  "none"
]), Ca = it(["#text"]), ha = it([
  "accept",
  "action",
  "align",
  "alt",
  "autocapitalize",
  "autocomplete",
  "autopictureinpicture",
  "autoplay",
  "background",
  "bgcolor",
  "border",
  "capture",
  "cellpadding",
  "cellspacing",
  "checked",
  "cite",
  "class",
  "clear",
  "color",
  "cols",
  "colspan",
  "command",
  "commandfor",
  "controls",
  "controlslist",
  "coords",
  "crossorigin",
  "datetime",
  "decoding",
  "default",
  "dir",
  "disabled",
  "disablepictureinpicture",
  "disableremoteplayback",
  "download",
  "draggable",
  "enctype",
  "enterkeyhint",
  "exportparts",
  "face",
  "for",
  "headers",
  "height",
  "hidden",
  "high",
  "href",
  "hreflang",
  "id",
  "inert",
  "inputmode",
  "integrity",
  "ismap",
  "kind",
  "label",
  "lang",
  "list",
  "loading",
  "loop",
  "low",
  "max",
  "maxlength",
  "media",
  "method",
  "min",
  "minlength",
  "multiple",
  "muted",
  "name",
  "nonce",
  "noshade",
  "novalidate",
  "nowrap",
  "open",
  "optimum",
  "part",
  "pattern",
  "placeholder",
  "playsinline",
  "popover",
  "popovertarget",
  "popovertargetaction",
  "poster",
  "preload",
  "pubdate",
  "radiogroup",
  "readonly",
  "rel",
  "required",
  "rev",
  "reversed",
  "role",
  "rows",
  "rowspan",
  "spellcheck",
  "scope",
  "selected",
  "shape",
  "size",
  "sizes",
  "slot",
  "span",
  "srclang",
  "start",
  "src",
  "srcset",
  "step",
  "style",
  "summary",
  "tabindex",
  "title",
  "translate",
  "type",
  "usemap",
  "valign",
  "value",
  "width",
  "wrap",
  "xmlns"
]), Br = it([
  "accent-height",
  "accumulate",
  "additive",
  "alignment-baseline",
  "amplitude",
  "ascent",
  "attributename",
  "attributetype",
  "azimuth",
  "basefrequency",
  "baseline-shift",
  "begin",
  "bias",
  "by",
  "class",
  "clip",
  "clippathunits",
  "clip-path",
  "clip-rule",
  "color",
  "color-interpolation",
  "color-interpolation-filters",
  "color-profile",
  "color-rendering",
  "cx",
  "cy",
  "d",
  "dx",
  "dy",
  "diffuseconstant",
  "direction",
  "display",
  "divisor",
  "dominant-baseline",
  "dur",
  "edgemode",
  "elevation",
  "end",
  "exponent",
  "fill",
  "fill-opacity",
  "fill-rule",
  "filter",
  "filterunits",
  "flood-color",
  "flood-opacity",
  "font-family",
  "font-size",
  "font-size-adjust",
  "font-stretch",
  "font-style",
  "font-variant",
  "font-weight",
  "fx",
  "fy",
  "g1",
  "g2",
  "glyph-name",
  "glyphref",
  "gradientunits",
  "gradienttransform",
  "height",
  "href",
  "id",
  "image-rendering",
  "in",
  "in2",
  "intercept",
  "k",
  "k1",
  "k2",
  "k3",
  "k4",
  "kerning",
  "keypoints",
  "keysplines",
  "keytimes",
  "lang",
  "lengthadjust",
  "letter-spacing",
  "kernelmatrix",
  "kernelunitlength",
  "lighting-color",
  "local",
  "marker-end",
  "marker-mid",
  "marker-start",
  "markerheight",
  "markerunits",
  "markerwidth",
  "maskcontentunits",
  "maskunits",
  "max",
  "mask",
  "mask-type",
  "media",
  "method",
  "mode",
  "min",
  "name",
  "numoctaves",
  "offset",
  "operator",
  "opacity",
  "order",
  "orient",
  "orientation",
  "origin",
  "overflow",
  "paint-order",
  "path",
  "pathlength",
  "patterncontentunits",
  "patterntransform",
  "patternunits",
  "pointer-events",
  "points",
  "preservealpha",
  "preserveaspectratio",
  "primitiveunits",
  "r",
  "rx",
  "ry",
  "radius",
  "refx",
  "refy",
  "repeatcount",
  "repeatdur",
  "restart",
  "result",
  "rotate",
  "scale",
  "seed",
  "shape-rendering",
  "slope",
  "specularconstant",
  "specularexponent",
  "spreadmethod",
  "startoffset",
  "stddeviation",
  "stitchtiles",
  "stop-color",
  "stop-opacity",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-opacity",
  "stroke",
  "stroke-width",
  "style",
  "surfacescale",
  "systemlanguage",
  "tabindex",
  "tablevalues",
  "targetx",
  "targety",
  "transform",
  "transform-origin",
  "text-anchor",
  "text-decoration",
  "text-orientation",
  "text-rendering",
  "textlength",
  "type",
  "u1",
  "u2",
  "unicode",
  "values",
  "vector-effect",
  "viewbox",
  "visibility",
  "version",
  "vert-adv-y",
  "vert-origin-x",
  "vert-origin-y",
  "width",
  "word-spacing",
  "wrap",
  "writing-mode",
  "xchannelselector",
  "ychannelselector",
  "x",
  "x1",
  "x2",
  "xmlns",
  "y",
  "y1",
  "y2",
  "z",
  "zoomandpan"
]), pa = it([
  "accent",
  "accentunder",
  "align",
  "bevelled",
  "close",
  "columnalign",
  "columnlines",
  "columnspacing",
  "columnspan",
  "denomalign",
  "depth",
  "dir",
  "display",
  "displaystyle",
  "encoding",
  "fence",
  "frame",
  "height",
  "href",
  "id",
  "largeop",
  "length",
  "linethickness",
  "lquote",
  "lspace",
  "mathbackground",
  "mathcolor",
  "mathsize",
  "mathvariant",
  "maxsize",
  "minsize",
  "movablelimits",
  "notation",
  "numalign",
  "open",
  "rowalign",
  "rowlines",
  "rowspacing",
  "rowspan",
  "rspace",
  "rquote",
  "scriptlevel",
  "scriptminsize",
  "scriptsizemultiplier",
  "selection",
  "separator",
  "separators",
  "stretchy",
  "subscriptshift",
  "supscriptshift",
  "symmetric",
  "voffset",
  "width",
  "xmlns"
]), Pn = it([
  "xlink:href",
  "xml:id",
  "xlink:title",
  "xml:space",
  "xmlns:xlink"
]), vg = at(/{{[\w\W]*|^[\w\W]*}}/g), yg = at(/<%[\w\W]*|^[\w\W]*%>/g), wg = at(/\${[\w\W]*/g), xg = at(/^data-[\-\w.\u00B7-\uFFFF]+$/), kg = at(/^aria-[\-\w]+$/), da = at(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i), Mg = at(/^(?:\w+script|data):/i), Sg = at(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g), zg = at(/^html$/i), Pg = at(/^[a-z][.\w]*(-[.\w]+)+$/i), Ur = at(/<[/\w!]/g), ua = at(/<[/\w]/g), Eg = at(/<\/no(script|embed|frames)/i), ma = at(/\/>/i), Q = {
  element: 1,
  attribute: 2,
  text: 3,
  cdataSection: 4,
  entityReference: 5,
  entityNode: 6,
  processingInstruction: 7,
  comment: 8,
  document: 9,
  documentType: 10,
  documentFragment: 11,
  notation: 12
}, Tg = it(D({}, [
  "style",
  "script",
  "xmp",
  "iframe",
  "noembed",
  "noframes",
  "plaintext",
  "noscript"
])), Lg = function() {
  return typeof window > "u" ? null : window;
}, Rg = function(r, i) {
  if (typeof r != "object" || typeof r.createPolicy != "function") return null;
  let t = null;
  const e = "data-tt-policy-suffix";
  i && i.hasAttribute(e) && (t = i.getAttribute(e));
  const n = "dompurify" + (t ? "#" + t : "");
  try {
    return r.createPolicy(n, {
      createHTML(o) {
        return o;
      },
      createScriptURL(o) {
        return o;
      }
    });
  } catch {
    return console.warn("TrustedTypes policy " + n + " could not be created."), null;
  }
}, fa = function() {
  return {
    afterSanitizeAttributes: [],
    afterSanitizeElements: [],
    afterSanitizeShadowDOM: [],
    beforeSanitizeAttributes: [],
    beforeSanitizeElements: [],
    beforeSanitizeShadowDOM: [],
    uponSanitizeAttribute: [],
    uponSanitizeElement: [],
    uponSanitizeShadowNode: []
  };
}, he = function(r, i, t, e) {
  return dt(r, i) && xi(r[i]) ? D(e.base ? mt(e.base) : {}, r[i], e.transform) : t;
}, Vr = function(r, i, t) {
  const e = dt(r, i) ? r[i] : void 0;
  return e && typeof e == "object" ? mt(e) : t();
};
function oA() {
  let r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : Lg();
  const i = (l) => oA(l);
  if (i.version = "3.4.17", i.removed = [], !r || !r.document || r.document.nodeType !== Q.document || !r.Element)
    return i.isSupported = !1, i;
  let t = r.document;
  const e = t, n = e.currentScript;
  r.DocumentFragment;
  const o = r.HTMLTemplateElement, g = r.Node, c = r.Element, C = r.NodeFilter;
  r.NamedNodeMap === void 0 && (r.NamedNodeMap || r.MozNamedAttrMap), r.HTMLFormElement;
  const h = r.DOMParser, f = r.trustedTypes, w = c.prototype, z = xt(w, "cloneNode"), L = xt(w, "remove"), N = xt(w, "removeAttributeNode"), M = xt(w, "nextSibling"), y = xt(w, "childNodes"), P = xt(w, "parentNode"), _ = xt(w, "shadowRoot"), yt = xt(w, "attributes"), H = g && g.prototype ? xt(g.prototype, "nodeType") : null, nt = g && g.prototype ? xt(g.prototype, "nodeName") : null, Le = g && g.prototype ? xt(g.prototype, "ownerDocument") : null, ct = function(l) {
    return H ? H(l) : l.nodeType;
  }, Ri = function(l) {
    return nt ? nt(l) : l.nodeName;
  }, xo = ug(w, "namespaceURI"), lr = function(l) {
    return xo ? xo(l) : l.namespaceURI;
  };
  if (typeof o == "function") {
    const l = t.createElement("template");
    l.content && l.content.ownerDocument && (t = l.content.ownerDocument);
  }
  let It, Re = "", gr, ko = !1, Oi = 0;
  const Mo = function() {
    if (Oi > 0) throw ee('A configured TRUSTED_TYPES_POLICY callback (createHTML or createScriptURL) must not call DOMPurify.sanitize, as that causes infinite recursion. Do not pass a policy whose callbacks wrap DOMPurify as TRUSTED_TYPES_POLICY; see the "DOMPurify and Trusted Types" section of the README.');
  }, ri = function(l) {
    Mo(), Oi++;
    try {
      return It.createHTML(l);
    } finally {
      Oi--;
    }
  }, vl = function(l) {
    Mo(), Oi++;
    try {
      return It.createScriptURL(l);
    } finally {
      Oi--;
    }
  }, yl = function() {
    return ko || (gr = Rg(f, n), ko = !0), gr;
  }, fn = t, cr = fn.implementation, So = fn.createNodeIterator, wl = fn.createDocumentFragment, xl = fn.getElementsByTagName, kl = e.importNode;
  let Z = fa();
  i.isSupported = typeof eA == "function" && typeof P == "function" && cr && cr.createHTMLDocument !== void 0;
  const Ml = vg, Sl = yg, zl = wg, Pl = xg, El = kg, Tl = Mg, zo = Sg, Ll = Pg;
  let Po = da, B = null;
  const Ir = D({}, [
    ...Ia,
    ...Zr,
    ...Gr,
    ...Hr,
    ...Ca
  ]);
  let U = null;
  const Cr = D({}, [
    ...ha,
    ...Br,
    ...pa,
    ...Pn
  ]);
  let Zt = Object.seal(Ci(null, {
    tagNameCheck: {
      writable: !0,
      configurable: !1,
      enumerable: !0,
      value: null
    },
    attributeNameCheck: {
      writable: !0,
      configurable: !1,
      enumerable: !0,
      value: null
    },
    allowCustomizedBuiltInElements: {
      writable: !0,
      configurable: !1,
      enumerable: !0,
      value: !1
    }
  })), Xi = null, Eo = null;
  const ce = Object.seal(Ci(null, {
    tagCheck: {
      writable: !0,
      configurable: !1,
      enumerable: !0,
      value: null
    },
    attributeCheck: {
      writable: !0,
      configurable: !1,
      enumerable: !0,
      value: null
    }
  }));
  let To = !0, hr = !0, Lo = !1, pr = !0, $t = !1, Oe = !0, Xe = !1, dr = !1, bn = null, vn = null, ur = !1, si = !1, yn = !1, wn = !1, Ro = !0, Oo = !1;
  const Xo = "user-content-";
  let mr = !0, fr = !1, De = null, oi = {}, Ne = null;
  const Do = D({}, [
    "annotation-xml",
    "audio",
    "colgroup",
    "desc",
    "foreignobject",
    "head",
    "iframe",
    "math",
    "mi",
    "mn",
    "mo",
    "ms",
    "mtext",
    "noembed",
    "noframes",
    "noscript",
    "plaintext",
    "script",
    "selectedcontent",
    "style",
    "svg",
    "template",
    "thead",
    "title",
    "video",
    "xmp"
  ]);
  let No = null;
  const Wo = D({}, [
    "audio",
    "video",
    "img",
    "source",
    "image",
    "track"
  ]);
  let jo = null;
  const Zo = D({}, [
    "alt",
    "class",
    "for",
    "id",
    "label",
    "name",
    "pattern",
    "placeholder",
    "role",
    "summary",
    "title",
    "value",
    "style",
    "xmlns"
  ]), xn = "http://www.w3.org/1998/Math/MathML", kn = "http://www.w3.org/2000/svg", Gt = "http://www.w3.org/1999/xhtml";
  let ai = Gt, br = !1, vr = null;
  const Rl = D({}, [
    xn,
    kn,
    Gt
  ], jr), Go = it([
    "mi",
    "mo",
    "mn",
    "ms",
    "mtext"
  ]);
  let yr = D({}, Go);
  const Ho = it(["annotation-xml"]);
  let wr = D({}, Ho);
  const Ol = D({}, [
    "title",
    "style",
    "font",
    "a",
    "script"
  ]);
  let Di = null;
  const Xl = ["application/xhtml+xml", "text/html"], Dl = "text/html";
  let q = null, Ai = null;
  const Nl = t.createElement("form"), Bo = function(l) {
    return l instanceof RegExp || l instanceof Function;
  }, xr = function() {
    let l = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    if (Ai && Ai === l) return;
    (!l || typeof l != "object") && (l = {}), l = mt(l), Di = Xl.indexOf(l.PARSER_MEDIA_TYPE) === -1 ? Dl : l.PARSER_MEDIA_TYPE, q = Di === "application/xhtml+xml" ? jr : je, B = he(l, "ALLOWED_TAGS", Ir, { transform: q }), U = he(l, "ALLOWED_ATTR", Cr, { transform: q }), vr = he(l, "ALLOWED_NAMESPACES", Rl, { transform: jr }), jo = he(l, "ADD_URI_SAFE_ATTR", Zo, {
      transform: q,
      base: Zo
    }), No = he(l, "ADD_DATA_URI_TAGS", Wo, {
      transform: q,
      base: Wo
    }), Ne = he(l, "FORBID_CONTENTS", Do, { transform: q }), Xi = he(l, "FORBID_TAGS", mt({}), { transform: q }), Eo = he(l, "FORBID_ATTR", mt({}), { transform: q }), oi = dt(l, "USE_PROFILES") ? l.USE_PROFILES && typeof l.USE_PROFILES == "object" ? mt(l.USE_PROFILES) : l.USE_PROFILES : !1, To = l.ALLOW_ARIA_ATTR !== !1, hr = l.ALLOW_DATA_ATTR !== !1, Lo = l.ALLOW_UNKNOWN_PROTOCOLS || !1, pr = l.ALLOW_SELF_CLOSE_IN_ATTR !== !1, $t = l.SAFE_FOR_TEMPLATES || !1, Oe = l.SAFE_FOR_XML !== !1, Xe = l.WHOLE_DOCUMENT || !1, si = l.RETURN_DOM || !1, yn = l.RETURN_DOM_FRAGMENT || !1, wn = l.RETURN_TRUSTED_TYPE || !1, ur = l.FORCE_BODY || !1, Ro = l.SANITIZE_DOM !== !1, Oo = l.SANITIZE_NAMED_PROPS || !1, mr = l.KEEP_CONTENT !== !1, fr = l.IN_PLACE || !1, Po = mg(l.ALLOWED_URI_REGEXP) ? l.ALLOWED_URI_REGEXP : da, ai = typeof l.NAMESPACE == "string" ? l.NAMESPACE : Gt, yr = Vr(l, "MATHML_TEXT_INTEGRATION_POINTS", () => D({}, Go)), wr = Vr(l, "HTML_INTEGRATION_POINTS", () => D({}, Ho));
    const I = Vr(l, "CUSTOM_ELEMENT_HANDLING", () => Ci(null));
    if (Zt = Ci(null), dt(I, "tagNameCheck") && Bo(I.tagNameCheck) && (Zt.tagNameCheck = I.tagNameCheck), dt(I, "attributeNameCheck") && Bo(I.attributeNameCheck) && (Zt.attributeNameCheck = I.attributeNameCheck), dt(I, "allowCustomizedBuiltInElements") && typeof I.allowCustomizedBuiltInElements == "boolean" && (Zt.allowCustomizedBuiltInElements = I.allowCustomizedBuiltInElements), at(Zt), $t && (hr = !1), yn && (si = !0), oi && (B = D({}, Ca), U = Ci(null), oi.html === !0 && (D(B, Ia), D(U, ha)), oi.svg === !0 && (D(B, Zr), D(U, Br), D(U, Pn)), oi.svgFilters === !0 && (D(B, Gr), D(U, Br), D(U, Pn)), oi.mathMl === !0 && (D(B, Hr), D(U, pa), D(U, Pn))), ce.tagCheck = null, ce.attributeCheck = null, dt(l, "ADD_TAGS") && (typeof l.ADD_TAGS == "function" ? ce.tagCheck = l.ADD_TAGS : xi(l.ADD_TAGS) && (B === Ir && (B = mt(B)), D(B, l.ADD_TAGS, q))), dt(l, "ADD_ATTR") && (typeof l.ADD_ATTR == "function" ? ce.attributeCheck = l.ADD_ATTR : xi(l.ADD_ATTR) && (U === Cr && (U = mt(U)), D(U, l.ADD_ATTR, q))), dt(l, "ADD_FORBID_CONTENTS") && xi(l.ADD_FORBID_CONTENTS) && (Ne === Do && (Ne = mt(Ne)), D(Ne, l.ADD_FORBID_CONTENTS, q)), mr && (B["#text"] = !0), Xe && D(B, [
      "html",
      "head",
      "body"
    ]), B.table && (D(B, ["tbody"]), delete Xi.tbody), l.TRUSTED_TYPES_POLICY) {
      if (typeof l.TRUSTED_TYPES_POLICY.createHTML != "function") throw ee('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
      if (typeof l.TRUSTED_TYPES_POLICY.createScriptURL != "function") throw ee('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
      const p = It;
      It = l.TRUSTED_TYPES_POLICY;
      try {
        Re = ri("");
      } catch (u) {
        throw It = p, u;
      }
    } else l.TRUSTED_TYPES_POLICY === null ? (It = void 0, Re = "") : (It === void 0 && (It = yl()), It && typeof Re == "string" && (Re = ri("")));
    it && it(l), Ai = l;
  }, Uo = D({}, [
    ...Zr,
    ...Gr,
    ...fg
  ]), Vo = D({}, [...Hr, ...bg]), Wl = function(l, I, p) {
    return I.namespaceURI === Gt ? l === "svg" : I.namespaceURI === xn ? l === "svg" && (p === "annotation-xml" || yr[p]) : !!Uo[l];
  }, jl = function(l, I, p) {
    return I.namespaceURI === Gt ? l === "math" : I.namespaceURI === kn ? l === "math" && wr[p] : !!Vo[l];
  }, Zl = function(l, I, p) {
    return I.namespaceURI === kn && !wr[p] || I.namespaceURI === xn && !yr[p] ? !1 : !Vo[l] && (Ol[l] || !Uo[l]);
  }, Gl = function(l) {
    const I = lr(l), p = je(Ri(l)), u = P(l);
    let x, E;
    return u && ct(u) === Q.element ? (x = { namespaceURI: lr(u) }, E = je(Ri(u))) : (x = { namespaceURI: ai }, E = "template"), vr[I] ? I === kn ? Wl(p, x, E) : I === xn ? jl(p, x, E) : I === Gt ? Zl(p, x, E) : !!(Di === "application/xhtml+xml" && vr[I]) : !1;
  }, We = function(l) {
    ji(i.removed, { element: l });
    try {
      P(l).removeChild(l);
    } catch {
      if (L(l), !P(l)) throw ee("a node selected for removal could not be detached from its tree and cannot be safely returned; refusing to sanitize in place");
    }
  }, Yo = function(l, I, p) {
    try {
      N(l, I);
    } catch {
      try {
        l.removeAttribute(p);
      } catch {
      }
    }
  }, kr = function(l) {
    Sr(l);
    const I = y(l);
    I && te(gg(I), (u) => {
      try {
        L(u);
      } catch {
      }
    });
    const p = ct(l) === Q.element ? yt(l) : null;
    if (p) for (let u = p.length - 1; u >= 0; --u) {
      const x = p[u], E = x && x.name;
      typeof E == "string" && Yo(l, x, E);
    }
  }, li = function(l, I, p) {
    if (!p) try {
      p = I.getAttributeNode(l);
    } catch {
      p = null;
    }
    ji(i.removed, {
      attribute: p || null,
      from: I
    });
    try {
      p ? N(I, p) : I.removeAttribute(l);
    } catch {
      try {
        I.removeAttribute(l);
      } catch {
      }
    }
    if (l === "is")
      if (si || yn) try {
        We(I);
      } catch {
      }
      else try {
        I.setAttribute(l, "");
      } catch {
      }
  }, Fo = function(l) {
    const I = yt(l);
    if (I)
      for (let p = I.length - 1; p >= 0; --p) {
        const u = I[p], x = u && u.name;
        typeof x != "string" || U[q(x)] || Yo(l, u, x);
      }
  }, Mr = function(l, I) {
    let p = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : !1;
    const u = [l];
    for (; u.length > 0; ) {
      const x = u.pop();
      if (I(x) === !1) continue;
      if (p && ct(x) === Q.element) {
        const T = _(x);
        Ie(T) && u.push(T);
      }
      const E = y(x);
      if (E) for (let T = E.length - 1; T >= 0; --T) u.push(E[T]);
    }
  }, Sr = function(l) {
    Mr(l, (I) => {
      ct(I) === Q.element && Fo(I);
    });
  }, zr = function(l) {
    const I = [];
    return Mr(l, (p) => {
      I.push(p);
    }, !0), I;
  }, Hl = function(l, I) {
    const p = Nr();
    te(zr(l), (u) => {
      ct(u) === Q.element && Wr(p, u);
    }), te(I, (u) => {
      ct(u) === Q.element && !Zi(p, u) && Fo(u);
    });
  }, Jo = function(l, I) {
    let p = !1;
    return te(i.removed, (u) => {
      u.element && (p = p || u.element === l, Sr(u.element));
    }), Hl(l, I), p;
  }, Bl = 8, Ul = function(l, I) {
    const p = De;
    let u = null;
    const x = () => (u || (u = Nr(), te(I, (E) => {
      Wr(u, E);
    })), u);
    for (let E = 0; ; E++) {
      const T = zr(l), F = [l];
      let Ce = !1;
      if (te(T, (wt) => {
        ct(wt) === Q.documentFragment ? ji(F, wt) : !Ce && !Zi(p, wt) && (Ce = Zi(x(), wt));
      }), !Ce) return;
      if (E >= Bl) throw ee("the tree kept changing during in-place sanitization; refusing to return it");
      te(F, (wt, Ct) => {
        Vl(wt, Ct > 0, l, x());
      });
    }
  }, Vl = function(l, I, p, u) {
    const x = Pr(l);
    let E;
    for (; E = x.nextNode(); )
      !Zi(u, E) || Zi(De, E) || (I && Pt(Z.uponSanitizeShadowNode, E, null), Tr(E, p), Lr(E, p), Ie(E.content) && Wi(E.content));
  }, Yl = function(l) {
    De && Wr(De, l);
  }, Ko = function(l, I) {
    return Oe ? l === "patchsrc" ? !0 : l === "for" && I !== "label" && I !== "output" : !1;
  }, Fl = function(l) {
    Oe && Mr(l, (I) => {
      const p = ct(I);
      if (p === Q.processingInstruction || p === Q.comment && st(ua, I.data)) {
        try {
          L(I);
        } catch {
        }
        return !1;
      }
      if (p === Q.element) {
        const u = I, x = q(Ri(I));
        try {
          u.hasAttribute && u.hasAttribute("patchsrc") && u.removeAttribute("patchsrc"), u.hasAttribute && u.hasAttribute("for") && Ko("for", x) && u.removeAttribute("for");
        } catch {
        }
      }
      return !0;
    });
  }, qo = function(l) {
    let I = null, p = null;
    if (ur) l = "<remove></remove>" + l;
    else {
      const E = Aa(l, /^[\r\n\t ]+/);
      p = E && E[0];
    }
    Di === "application/xhtml+xml" && ai === Gt && (l = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + l + "</body></html>");
    const u = It ? ri(l) : l;
    if (ai === Gt) try {
      I = new h().parseFromString(u, Di);
    } catch {
    }
    if (!I || !I.documentElement) {
      I = cr.createDocument(ai, "template", null);
      try {
        I.documentElement.innerHTML = br ? Re : u;
      } catch {
      }
    }
    const x = I.body || I.documentElement;
    return l && p && x.insertBefore(t.createTextNode(p), x.childNodes[0] || null), ai === Gt ? xl.call(I, Xe ? "html" : "body")[0] : Xe ? I.documentElement : x;
  }, Pr = function(l) {
    const I = Le ? Le(l) : l.ownerDocument;
    return So.call(I || l, l, C.SHOW_ELEMENT | C.SHOW_COMMENT | C.SHOW_TEXT | C.SHOW_PROCESSING_INSTRUCTION | C.SHOW_CDATA_SECTION, null);
  }, Mn = function(l) {
    return l = Gi(l, Ml, " "), l = Gi(l, Sl, " "), l = Gi(l, zl, " "), l;
  }, Er = function(l) {
    var I;
    Qo(l);
    const p = (I = l.querySelectorAll) === null || I === void 0 ? void 0 : I.call(l, "template");
    p && te(p, (u) => {
      Ie(u.content) && Er(u.content);
    });
  }, Qo = function(l) {
    l.normalize();
    const I = Le ? Le(l) : l.ownerDocument, p = So.call(I || l, l, C.SHOW_TEXT | C.SHOW_COMMENT | C.SHOW_CDATA_SECTION | C.SHOW_PROCESSING_INSTRUCTION, null);
    let u = p.nextNode();
    for (; u; )
      u.data = Mn(u.data), u = p.nextNode();
  }, Sn = function(l) {
    const I = nt ? nt(l) : null;
    return typeof I != "string" || q(I) !== "form" ? !1 : typeof l.nodeName != "string" || typeof l.textContent != "string" || typeof l.removeChild != "function" || l.attributes !== yt(l) || typeof l.removeAttribute != "function" || typeof l.removeAttributeNode != "function" || typeof l.getAttributeNode != "function" || typeof l.setAttribute != "function" || typeof l.namespaceURI != "string" || typeof l.insertBefore != "function" || typeof l.hasChildNodes != "function" || l.nodeType !== H(l) || l.childNodes !== y(l);
  }, Ie = function(l) {
    if (!H || typeof l != "object" || l === null) return !1;
    try {
      return H(l) === Q.documentFragment;
    } catch {
      return !1;
    }
  }, Ni = function(l) {
    if (!H || typeof l != "object" || l === null) return !1;
    try {
      return typeof H(l) == "number";
    } catch {
      return !1;
    }
  };
  function Pt(l, I, p) {
    l.length !== 0 && te(l, (u) => {
      u.call(i, I, p, Ai);
    });
  }
  const Jl = function(l, I) {
    return !!(Oe && l.hasChildNodes() && !Ni(l.firstElementChild) && st(Ur, l.textContent) && st(Ur, l.innerHTML) || Oe && Tg[I] && ct(l) === Q.element && lr(l) === Gt && (Ni(l.firstElementChild) || typeof l.textContent == "string" && st(Ur, l.textContent)) || l.nodeType === Q.processingInstruction || Oe && l.nodeType === Q.comment && st(ua, l.data));
  }, zn = function(l, I) {
    if (l instanceof RegExp) return st(l, I);
    if (l instanceof Function) {
      for (var p = arguments.length, u = new Array(p > 2 ? p - 2 : 0), x = 2; x < p; x++) u[x - 2] = arguments[x];
      return !!l(I, ...u);
    }
    return !1;
  }, Kl = function(l, I, p) {
    if (!Xi[I] && ta(I) && zn(Zt.tagNameCheck, I)) return !1;
    if (mr && !Ne[I] && !Ne[je(I)]) {
      const u = P(l), x = y(l);
      if (x && u) {
        const E = x.length;
        for (let T = E - 1; T >= 0; --T) {
          const F = l === p ? z(x[T], !0) : x[T];
          u.insertBefore(F, M(l));
        }
      }
    }
    return We(l), !0;
  }, _o = function(l, I, p, u) {
    return l.length === 0 ? I : I === p || I === u ? mt(I) : I;
  }, gi = function(l, I) {
    return l === I || P(l) !== null ? !1 : (fr && Sr(l), !0);
  }, Tr = function(l, I) {
    if (Yl(l), Pt(Z.beforeSanitizeElements, l, null), gi(l, I)) return !0;
    if (Sn(l))
      return We(l), !0;
    const p = q(Ri(l));
    if (B = _o(Z.uponSanitizeElement, B, Ir, bn), Pt(Z.uponSanitizeElement, l, {
      tagName: p,
      allowedTags: B
    }), gi(l, I)) return !0;
    if (Jl(l, p))
      return We(l), !0;
    if (Xi[p] || !(ce.tagCheck instanceof Function && ce.tagCheck(p)) && !B[p]) {
      const u = Kl(l, p, I);
      return u === !1 && (Pt(Z.afterSanitizeElements, l, null), gi(l, I)) ? !0 : u;
    }
    if (ct(l) === Q.element && !Gl(l) || (p === "noscript" || p === "noembed" || p === "noframes") && st(Eg, l.innerHTML))
      return We(l), !0;
    if ($t && l.nodeType === Q.text) {
      const u = Mn(l.textContent);
      l.textContent !== u && (ji(i.removed, { element: l.cloneNode() }), l.textContent = u);
    }
    return Pt(Z.afterSanitizeElements, l, null), gi(l, I);
  }, $o = function(l, I, p) {
    if (Eo[I] || Ko(I, l) || Ro && (I === "id" || I === "name") && (p in t || p in Nl)) return !1;
    const u = U[I] || ce.attributeCheck instanceof Function && ce.attributeCheck(I, l);
    return hr && st(Pl, I) || To && st(El, I) ? !0 : u ? jo[I] || st(Po, Gi(p, zo, "")) || (I === "src" || I === "xlink:href" || I === "href") && l !== "script" && la(p, "data:") === 0 && No[l] || Lo && !st(Tl, Gi(p, zo, "")) ? !0 : !p : ta(l) && zn(Zt.tagNameCheck, l) && zn(Zt.attributeNameCheck, I, l) || I === "is" && Zt.allowCustomizedBuiltInElements && zn(Zt.tagNameCheck, p);
  }, ql = D({}, [
    "annotation-xml",
    "color-profile",
    "font-face",
    "font-face-format",
    "font-face-name",
    "font-face-src",
    "font-face-uri",
    "missing-glyph"
  ]), ta = function(l) {
    return !ql[je(l)] && st(Ll, l);
  }, Ql = function(l, I, p, u) {
    if (It && typeof f == "object" && typeof f.getAttributeType == "function" && !p) switch (f.getAttributeType(l, I)) {
      case "TrustedHTML":
        return ri(u);
      case "TrustedScriptURL":
        return vl(u);
    }
    return u;
  }, _l = function(l, I, p, u) {
    try {
      return p ? l.setAttributeNS(p, I, u) : l.setAttribute(I, u), Sn(l) ? (We(l), !1) : !0;
    } catch {
      return li(I, l), !1;
    }
  }, ea = function(l, I) {
    return Oe && st(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i, I) ? !0 : je(l) === "attributename" && Aa(I, "href") !== null;
  }, Lr = function(l, I) {
    if (Pt(Z.beforeSanitizeAttributes, l, null), gi(l, I)) return;
    const p = l.attributes;
    if (!p || Sn(l)) return;
    U = _o(Z.uponSanitizeAttribute, U, Cr, vn);
    const u = {
      attrName: "",
      attrValue: "",
      keepAttr: !0,
      allowedAttributes: U,
      forceKeepAttr: void 0
    };
    let x = p.length;
    const E = q(l.nodeName);
    for (; x--; ) {
      const T = p[x], F = T.name, Ce = T.namespaceURI, wt = T.value, Ct = q(F), Ht = wt;
      let rt = F === "value" ? Ht : Ig(Ht), ia = !1;
      if (u.attrName = Ct, u.attrValue = rt, u.keepAttr = !0, u.forceKeepAttr = void 0, Pt(Z.uponSanitizeAttribute, l, u), rt = u.attrValue, Oo && (Ct === "id" || Ct === "name") && la(rt, Xo) !== 0 && (li(F, l, T), rt = Xo + rt, ia = !0), ea(F, rt)) {
        li(F, l, T);
        continue;
      }
      if (!u.forceKeepAttr) {
        if (!u.keepAttr) {
          li(F, l, T);
          continue;
        }
        if (!pr && st(ma, rt)) {
          li(F, l, T);
          continue;
        }
        if ($t && (rt = Mn(rt)), !$o(E, Ct, rt)) {
          li(F, l, T);
          continue;
        }
        rt = Ql(E, Ct, Ce, rt), rt !== Ht && _l(l, F, Ce, rt) && ia && aa(i.removed);
      }
    }
    Pt(Z.afterSanitizeAttributes, l, null), gi(l, I);
  }, Wi = function(l) {
    let I = null;
    const p = Pr(l);
    for (Pt(Z.beforeSanitizeShadowDOM, l, null); I = p.nextNode(); )
      if (Pt(Z.uponSanitizeShadowNode, I, null), Tr(I, l), Lr(I, l), Ie(I.content) && Wi(I.content), ct(I) === Q.element) {
        const u = _(I);
        Ie(u) && (Rr(u), Wi(u));
      }
    $t && Qo(l), Pt(Z.afterSanitizeShadowDOM, l, null);
  }, Rr = function(l) {
    const I = [{
      node: l,
      shadow: null
    }];
    for (; I.length > 0; ) {
      const p = I.pop();
      if (p.shadow) {
        Wi(p.shadow);
        continue;
      }
      const u = p.node, x = ct(u) === Q.element, E = y(u);
      if (E) for (let T = E.length - 1; T >= 0; --T) I.push({
        node: E[T],
        shadow: null
      });
      if (x) {
        const T = nt ? nt(u) : null;
        if (typeof T == "string" && q(T) === "template") {
          const F = u.content;
          Ie(F) && I.push({
            node: F,
            shadow: null
          });
        }
      }
      if (x) {
        const T = _(u);
        Ie(T) && I.push({
          node: null,
          shadow: T
        }, {
          node: T,
          shadow: null
        });
      }
    }
  };
  return i.sanitize = function(l) {
    let I = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, p = null, u = null, x = null, E = null;
    if (br = !l, br && (l = "<!-->"), typeof l != "string" && !Ni(l) && (l = dg(l), typeof l != "string"))
      throw ee("dirty is not a string, aborting");
    if (!i.isSupported) return l;
    dr ? (B = bn, U = vn) : xr(I), (Z.uponSanitizeElement.length > 0 || Z.uponSanitizeAttribute.length > 0) && (B = mt(B)), Z.uponSanitizeAttribute.length > 0 && (U = mt(U)), i.removed = [];
    const T = fr && typeof l != "string" && Ni(l);
    let F = [];
    const Ce = De;
    if (T) {
      Fl(l);
      const Ht = Ri(l);
      if (typeof Ht == "string") {
        const rt = q(Ht);
        if (!B[rt] || Xi[rt])
          throw kr(l), ee("root node is forbidden and cannot be sanitized in-place");
      }
      if (Sn(l))
        throw kr(l), ee("root node is clobbered and cannot be sanitized in-place");
      F = zr(l), De = Nr();
    } else if (Ni(l))
      p = qo("<!---->"), u = p.ownerDocument.importNode(l, !0), u.nodeType === Q.element && u.nodeName === "BODY" || u.nodeName === "HTML" ? p = u : p.appendChild(u), Rr(p);
    else {
      if (!si && !$t && !Xe && l.indexOf("<") === -1) return It && wn ? ri(l) : l;
      if (p = qo(l), !p) return si ? null : wn ? Re : "";
    }
    p && ur && We(p.firstChild);
    const wt = T ? l : p;
    try {
      T && Rr(l);
      const Ht = Pr(wt);
      for (; x = Ht.nextNode(); )
        Tr(x, wt), Lr(x, wt), Ie(x.content) && Wi(x.content);
      T && Ul(l, F);
    } catch (Ht) {
      throw T && (kr(l), Jo(l, F)), Ht;
    } finally {
      De = Ce;
    }
    if (T) {
      if (Jo(l, F)) throw ee("a node selected for removal could not be safely returned; refusing to sanitize in place");
      return $t && Er(l), l;
    }
    if (si) {
      if ($t && Er(p), yn)
        for (E = wl.call(p.ownerDocument); p.firstChild; ) E.appendChild(p.firstChild);
      else E = p;
      return (U.shadowroot || U.shadowrootmode) && (E = kl.call(e, E, !0)), E;
    }
    let Ct = Xe ? p.outerHTML : p.innerHTML;
    return Xe && B["!doctype"] && p.ownerDocument && p.ownerDocument.doctype && p.ownerDocument.doctype.name && st(zg, p.ownerDocument.doctype.name) && (Ct = "<!DOCTYPE " + p.ownerDocument.doctype.name + `>
` + Ct), $t && (Ct = Mn(Ct)), It && wn ? ri(Ct) : Ct;
  }, i.setConfig = function() {
    let l = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    xr(l), dr = !0, bn = B, vn = U;
  }, i.clearConfig = function() {
    Ai = null, dr = !1, bn = null, vn = null, It = gr, Re = "";
  }, i.isValidAttribute = function(l, I, p) {
    Ai || xr({});
    const u = q(l), x = q(I);
    return typeof p == "string" && (ea(I, p) || !pr && st(ma, p)) ? !1 : $o(u, x, p);
  }, i.addHook = function(l, I) {
    typeof I == "function" && dt(Z, l) && ji(Z[l], I);
  }, i.removeHook = function(l, I) {
    if (dt(Z, l)) {
      if (I !== void 0) {
        const p = lg(Z[l], I);
        return p === -1 ? void 0 : cg(Z[l], p, 1)[0];
      }
      return aa(Z[l]);
    }
  }, i.removeHooks = function(l) {
    dt(Z, l) && (Z[l] = []);
  }, i.removeAllHooks = function() {
    Z = fa();
  }, i;
}
var aA = oA();
const Og = ["b", "strong", "i", "em", "u", "s", "br", "p", "span", "div", "ul", "ol", "li", "a", "img", "small", "sub", "sup", "code", "pre", "table", "thead", "tbody", "tr", "th", "td", "qy-swiper", "qy-swiper-slide"], Xg = ["href", "src", "alt", "title", "class", "target", "rel", "width", "height"], Dg = { values: ["target", "rel", "width", "height"] }, Ng = ["script", "style", "iframe", "object", "embed", "form", "input", "textarea", "link", "meta", "base"], Wg = ["srcdoc", "style", "formaction", "xlink:href"], jg = { valueAttributes: ["image-url", "image-type", "thumbnail-url", "caption", "material-url", "camera-position", "camera-target", "show-texture"], booleanAttributes: ["fit-to-container", "debug-mode"], urlAttributes: ["image-url", "thumbnail-url", "material-url"], textAttributes: { values: ["caption"] } }, Zg = { booleanAttributes: ["has-thumb", "autoplay"] }, Gg = { tags: ["a", "b", "br", "i", "p", "small", "span", "sub", "sup"], attributes: ["href"], forbidContents: { tags: ["annotation-xml", "audio", "colgroup", "desc", "foreignobject", "head", "iframe", "math", "mi", "mn", "mo", "ms", "mtext", "noembed", "noframes", "noscript", "plaintext", "script", "selectedcontent", "style", "svg", "template", "title", "video", "xmp"] } }, vt = {
  tags: Og,
  attributes: Xg,
  uriSafeAttributes: Dg,
  forbidTags: Ng,
  forbidAttributes: Wg,
  slide: jg,
  swiper: Zg,
  iiif: Gg
}, Hg = vt.tags, Bg = vt.attributes, Ug = /^(?:https?|mailto|tel|data):/i, Vg = vt.uriSafeAttributes.values, Yg = vt.forbidTags, Fg = vt.forbidAttributes, Jg = vt.iiif.tags, Kg = vt.iiif.attributes, qg = /^https?:/i, Qg = vt.iiif.forbidContents.tags;
let Dn;
const _g = /^data:image\/(png|jpeg|gif|webp|avif);/i, ba = (r) => !!r && /^\s*data:/i.test(r);
function $g(r) {
  if (r.tagName === "A" && r.getAttribute("target") === "_blank" && r.setAttribute("rel", "noopener noreferrer"), Dn === "iiif" && r.tagName === "A" && r.hasAttribute("href") && (r.setAttribute("target", "_blank"), r.setAttribute("rel", "noopener noreferrer")), r.tagName === "IMG") {
    const i = r.getAttribute("src");
    ba(i) && !_g.test(i.trim()) && r.removeAttribute("src"), r.hasAttribute("srcset") && r.removeAttribute("srcset");
  } else
    for (const i of ["src", "href", "xlink:href"])
      ba(r.getAttribute(i)) && r.removeAttribute(i);
}
let ci;
function tc() {
  if (ci) return ci;
  const r = globalThis.window;
  if (!r)
    throw new Error(
      "sanitizeHtml: window の無い環境では使用できません（DOMPurify の初期化に必要）"
    );
  return ci = aA(r), ci.addHook("afterSanitizeAttributes", $g), ci.addHook("uponSanitizeAttribute", ic), ci;
}
let En;
function ec() {
  if (En) return En;
  const r = globalThis.window;
  if (!r)
    throw new Error(
      "sanitizeHtml: window の無い環境では使用できません（DOMPurify の初期化に必要）"
    );
  return En = aA(r), En;
}
function ic(r, i) {
  const t = r.nodeName.toLowerCase(), e = i.attrName;
  if (t === "qy-swiper-slide") {
    const n = bo.has(e) ? "" : AA(e, i.attrValue);
    if (n === null) {
      i.keepAttr = !1;
      return;
    }
    r.setAttribute(e, n), i.forceKeepAttr = !0;
    return;
  }
  t === "qy-swiper" && (oc.has(e) ? (r.setAttribute(e, ""), i.forceKeepAttr = !0) : i.keepAttr = !1);
}
function Ue(r, i) {
  if (r == null) return "";
  const t = i?.profile === "iiif", e = Dn;
  Dn = t ? "iiif" : void 0;
  try {
    return tc().sanitize(String(r), {
      ALLOWED_TAGS: t ? Jg : Hg,
      ALLOWED_ATTR: t ? Kg : Bg,
      ALLOWED_URI_REGEXP: t ? qg : Ug,
      ADD_URI_SAFE_ATTR: Vg,
      FORBID_TAGS: Yg,
      FORBID_ATTR: Fg,
      ALLOW_DATA_ATTR: !1,
      // aria-* も許可表の外に出さない（IIIF の値で残す属性は href だけ）
      ALLOW_ARIA_ATTR: !t,
      // 禁止タグを落としても中身のテキストは残す（実データの可読性を保つ）
      KEEP_CONTENT: !0,
      // profile: "iiif" のときだけ、文字も捨てる要素の一覧を差し替える
      ...t ? { FORBID_CONTENTS: Qg } : {}
    });
  } finally {
    Dn = e;
  }
}
function va(r) {
  return Ue(r, { profile: "iiif" });
}
function nc(r) {
  return r == null ? "" : String(r).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function rc(r) {
  if (r == null) return "";
  const i = ec().sanitize(String(r), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: !0
  }), t = globalThis.window.document.createElement("div");
  return t.innerHTML = i, t.textContent || "";
}
const sc = new Set(vt.slide.valueAttributes), bo = new Set(vt.slide.booleanAttributes), oc = new Set(vt.swiper.booleanAttributes), ac = new Set(vt.slide.textAttributes.values), Ac = new Set(vt.slide.urlAttributes), lc = (r) => /^(?:https?:)?\/\/|^\/|^[^:]*$/i.test(r.trim()), gc = /["'`<>\s]/;
function AA(r, i) {
  if (bo.has(r)) return i ? "" : null;
  if (!sc.has(r) || i == null) return null;
  let t = String(i);
  return Ac.has(r) && (!lc(t) || gc.test(t)) ? null : (ac.has(r) && (t = rc(t)), t);
}
function cc(r) {
  const i = [];
  for (const [t, e] of Object.entries(r || {})) {
    const n = String(t).toLowerCase(), o = AA(n, e);
    o !== null && i.push(bo.has(n) ? n : `${n}="${nc(o)}"`);
  }
  return i.join(" ");
}
const Ic = [
  "title",
  "officialTitle",
  "author",
  "createdAt",
  "era",
  "contributor",
  "mapper",
  "license",
  "dataLicense",
  // ライセンスの自由記述欄。META_KEYS_OPTION と lockstep (同じ index) で足す。
  "licenseNote",
  "dataLicenseNote",
  "attr",
  "dataAttr",
  "reference",
  "description"
];
function Cc() {
  const r = /* @__PURE__ */ new Set();
  return (i, t) => {
    r.has(i) || (r.add(i), console.warn(t));
  };
}
const hc = "data:image/png;base64,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", pc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAiCAYAAAA6RwvCAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAABBF0RVh0WE1MOmNvbS5hZG9iZS54bXAAPD94cGFja2V0IGJlZ2luPSIgICAiIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNC4xLWMwMzQgNDYuMjcyOTc2LCBTYXQgSmFuIDI3IDIwMDcgMjI6MTE6NDEgICAgICAgICI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnhhcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyI+CiAgICAgICAgIDx4YXA6Q3JlYXRvclRvb2w+QWRvYmUgRmlyZXdvcmtzIENTMzwveGFwOkNyZWF0b3JUb29sPgogICAgICAgICA8eGFwOkNyZWF0ZURhdGU+MjAxMS0xMC0yNlQyMTo1MjoxOFo8L3hhcDpDcmVhdGVEYXRlPgogICAgICAgICA8eGFwOk1vZGlmeURhdGU+MjAxMS0xMC0yN1QxNzo0MjowN1o8L3hhcDpNb2RpZnlEYXRlPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIj4KICAgICAgICAgPGRjOmZvcm1hdD5pbWFnZS9wbmc8L2RjOmZvcm1hdD4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgkVIwmwAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTM5jWRgMAAAAWdEVYdENyZWF0aW9uIFRpbWUAMTAvMjYvMTHjwOqVAAARQHByVld4nMWbB3wURdvAd6/u3V6/27sts/PMQQhFpEU6SlNBRXqTfgkkQOhFSigHIgIWkJqAIJ1QBCz0KkJoQYrSQaQjioBKC+XezWU5fH2/3+/L8fu+fWd3bubZKf95nnlmdjeX2/dk602qD9UnooRc5YjkKp9KyIrkZikfkazcSFaWcuZmpUZScyOpWcqZm6rkU3OTIpGk3EhSViQpVTlzk5IiSUm5VCRC5UaorAiVqpy5VFKESspND6UY03O6U0oYGHo3NCg0ODSj59BQRmhYaHhoaDofFsJiGIVfC78e/hnOwwW4CI1Ttve/AlehLClH6oTrhl8N1wu3CIcFKhqWiwVpWvrG9EcjmXC2nC/1Sd+dHgonh1PCpxQ5nN4pfHHk3qGzOlFUepiiPk5PC/cO9wn3DfcL59deGOqWXC95Saigp/fCY8Lvh0e9Xm94q3DBlXLd2qm5kmRpSrdw9/CEqNwneWQ4HH6hXul6FHVs5Gfh2eGbI6eFp0fLxoZqhE/KC6P5Oa9lhzN7ymofy5PN4anhCRlfFpSVXxNeG26UQf0jyBSO5R1UcjTdF/3c8o+a66j11AbqhCrtpvZQe6lzqnSRukRdjtU8Q52lfqJuqNJt6g/qTzW/ltpKbaO2U99SO9QrF6j71AMqL9b2OvUr9VtMYmgLbaU9dIHkpwM0r+YdtJN20W76ytOa/zZWjpZpTANdNlr7NJVEv0RXpCtFpR+panR1ugZdPCodoGrTdei69MNou3p0ffoN+k36aT+rqcZqfheVQzWiW9HUP0Kn6BVEJ9DF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zV6+JT3q/K+UUkoppZ5Tl9rnzXTvZS/51pTrIJewYX0bzb5r+vfUX7X2ebU/rDnUmslszXqN0v99bSO/80ff/EtrIayb9PNrKMs56kf84zG7v5Te6HqW1yytUb8m7mzNaVbmv4r9stz7I1/WPPKc9sIzuc6ebST3XjlnDZd7OSawd7MmvNs6y5nriXWP9WbWmvq6UoX3Ota9TCttV8f0GZBXXqMep8R6JfdJl73upTKfo+6XbG+j/s9aG7ZmP75rNPZXvNzHLegjrPOtCT9WL+yXY17/tyH3IRB7GXXMtcq0VabZ8xrZt/8TQZzR/ZH/R2U+R33+P8X/GX/2/pB24py9GY74M//JWBN+ar36nJd7Avh6VKf0QbdPXs/yyrDRPhP3sz9znXmPynyutvB/30cpn1CmPC8x1jF+MpbRnteGn1Ivwhg3+I8AG9O+EHNt938fc3KP8pj/+X8i8yj1+93/szKfq2P+z7kdO/R+knUt9fEpfYO/iMs8tlX4MbtnGLbk/TrnYcZw4mLntDV7nfgz9yiPlYN/a/EhbSdtyp7ZyP+jMp/zLsh+W9YpfUffzrpij9FYRdxMr+fX/dn7wZpwwpbqlWHUg7mk+zfn8tE3GM/350Z59TDaQN+LTBsTP/Oelbn3tUtoab1APb70v1JKKaWUUkoppZRSSl1NOxERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERGRO+Qfh5eOajemXSYAAAFTbWtCVPrOyv4Af1WJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4nO3W4WmDYBSGUQdxEQdxEBdxEAdxEQexvIELt6Yh/4oJ54FDm0/7601szlOSJEmSJEmSJEmSJEmSJEmSJEkf0XEc577vT+c5y7V397+6T/dvXddzHMdzmqbHz+wY/Sz31L11FsuyPF7HMAx/vod077JjlX2zYXatzfs9tX/VN7/+je5ftut7Vjnrn+V6nX37xtm/ul7T/ctzvu9f/9fneX7aP9fs/31l23ru1+/btv36zPfnv/2/r/oe1/er90Cu1Xf7nEXVnx3Xa5IkSZIkSZIk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b24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyI+CiAgICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2UvcG5nPC9kYzpmb3JtYXQ+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo8P3hwYWNrZXQgZW5kPSJ3Ij8+zWqGFQAACShJREFUWIWVmGusXFUVx39r73POzJy5M3fmPtrblj7p7btYGigGmojExISHQQ0miDFA4lc0SCBRNH4gRhNJ/aIfNAIxUkKIkMgjBBKMCHwQEGKhpbS39HXfve+5M3fmnr23H84+M7e1PDyTlbPPnDl7//da//Vf64zwBQ9jjCilAiDyFgIaUP4nFjDAMtACWtbaRGvtPmte59Lb8gUW137hGCgDFaDkrzMwrABRBxaAWWDeX7esteZyoD4XSJIkorXO+cV7gQFg9fMvLdz74bHm+hOnTP/QsOmeaxBYoJTDbF2n5wa36At7d+XOfOOW0uPAmLcpYN4Y0wyC4LIeuiwQ55wC8kA/sHF62tz5+F/mDz7zytKOTxpBMKsCEq1BCWjBiQAOcRAYQylpcWW0bG6/Kf/Rvd/rfmP1Kn0YOANMAksiYj8XiAcRew9se/ZvtR8/+seFr3xQj3QtDHGhQCCIFtAqDYxI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", Yr = {
  defaultpin: hc,
  bluedot: pc
}, zt = "maplat-app", tt = "maplat-ui", lA = [
  "lifecycle:setting-loaded",
  "lifecycle:appdata-ready",
  "lifecycle:ui-configure",
  "lifecycle:core-dom-ready",
  "lifecycle:ui-dom-ready",
  "lifecycle:core-ready",
  "lifecycle:ui-ready",
  "lifecycle:error",
  "sourceLoaded",
  "mapChanged",
  "changeViewpoint",
  "updateState",
  "outOfMap",
  "poi_number",
  "clickMarker",
  "clickMarkers",
  "clickMap",
  "clickMapXy",
  "clickMapMerc",
  "pointerMoveOnMapXy",
  "pointerMoveOnMapMerc",
  "gps_request",
  "gps_result",
  "gps_error"
], dc = ["gpsEnabledChanged", "moveStart", "moveEnd"], ya = [
  "handleGPS",
  "getGPSEnabled",
  "getRotation",
  "getDirection",
  "currentMapInfo",
  "mapInfo",
  "clientPointToLngLat",
  "lngLatToClientPoint",
  "selectMarker",
  "unselectMarker",
  "getMarker",
  "updateMarker",
  "addMarker",
  "removeMarker",
  "clearMarker",
  "showAllMarkers",
  "hideAllMarkers",
  "listPoiLayers",
  "showPoiLayer",
  "hidePoiLayer",
  "getPoiLayer",
  "addPoiLayer",
  "removePoiLayer",
  "addLine",
  "addVector",
  // #91: 線・面を id で 1 件だけ消す
  "removeVector",
  "removeLine",
  "clearLine",
  "clearVector",
  "setGPSMarker",
  "changeMap",
  "requestUpdateState",
  "setTransparency",
  "getTransparency",
  "setViewpoint",
  "goHome",
  "resetRotation",
  "resetDirection",
  "resetCirculation",
  "getMapMeta",
  "getMapCacheEnable",
  "getMapTileCacheStatsAsync",
  "getMapTileCacheSizeAsync",
  "clearMapTileCacheAsync",
  "fetchAllMapTileCacheAsync",
  "cancelMapTileCacheAsync"
], gA = {
  "display-mode": { core: !1, "core-pro": !0 },
  "display-mode:map-warp": { core: !1, "core-pro": !0 },
  "tile-cache": { core: !0, "core-pro": !0 },
  mapbox: { core: !0, "core-pro": !1 },
  "pointer-move": { core: !0, "core-pro": !0 },
  envelopes: { core: !0, "core-pro": !0 }
}, uc = Object.keys(gA);
function FI(r) {
  const i = {};
  for (const t of uc)
    i[t] = !!gA[t][r];
  return i;
}
const Ar = [
  { attr: "app-id", prop: "appId", kind: "string", startup: !0, option: "appid" },
  { attr: "app-src", prop: "appSrc", kind: "string", startup: !0 },
  { attr: "map-id", prop: "mapId", kind: "string", state: "change" },
  { attr: "transparency", prop: "transparency", kind: "number", state: "frame" },
  { attr: "no-rotate", prop: "noRotate", kind: "boolean", startup: !0, option: "noRotate" },
  { attr: "north-up", prop: "northUp", kind: "boolean", option: "northUp" },
  { attr: "home-margin-pixels", prop: "homeMarginPixels", kind: "number", option: "homeMarginPixels" },
  { attr: "always-gps-on", prop: "alwaysGpsOn", kind: "boolean", startup: !0, option: "alwaysGpsOn" },
  { attr: "fake", prop: "fake", kind: "boolean", startup: !0, option: "fake" },
  { attr: "enable-cache", prop: "enableCache", kind: "boolean", startup: !0, option: "enableCache" },
  { attr: "restore-session", prop: "restoreSession", kind: "boolean", startup: !0, option: "restoreSession" },
  { attr: "overlay", prop: "overlay", kind: "boolean", startup: !0, option: "overlay" },
  { attr: "debug", prop: "debug", kind: "boolean", option: "debug" },
  { attr: "icon", prop: "icon", kind: "string", option: "icon" },
  { attr: "selected-icon", prop: "selectedIcon", kind: "string", option: "selectedIcon" },
  // 中心の目印（既定で表示。消す・画像を差し替える口）
  { attr: "no-center-marker", prop: "noCenterMarker", kind: "boolean", dom: !0 },
  { attr: "center-marker-src", prop: "centerMarkerSrc", kind: "string", dom: !0 },
  // 範囲外の POI を描かない指定（起動後にも変えられる）
  { attr: "hide-outside-pois", prop: "hideOutsidePois", kind: "boolean", option: "hideOutsidePois" }
], vo = [
  { prop: "setting", startup: !0, option: "setting" },
  { prop: "restore", startup: !0, option: "restore" },
  { prop: "restoreExtensionKeys", startup: !0, option: "restoreExtensionKeys" },
  { prop: "googleApiKey", startup: !0, option: "googleApiKey" },
  { prop: "mapboxToken", startup: !0, option: "mapboxToken" },
  { prop: "maplibregl", startup: !0, option: "maplibregl" },
  { prop: "mapboxgl", startup: !0, option: "mapboxgl" },
  { prop: "uiHooks", startup: !0, option: "uiHooks" },
  { prop: "appOption", startup: !0 },
  { prop: "poiTemplate", option: "poiTemplate" },
  { prop: "poiStyle", option: "poiStyle" },
  { prop: "iconTemplate", option: "iconTemplate" }
], yo = [
  { attr: "display-mode", prop: "displayMode", kind: "string", feature: "display-mode", state: "change" }
], cA = [], IA = [
  ...Ar.filter((r) => r.startup).map((r) => r.prop),
  ...vo.filter((r) => r.startup).map((r) => r.prop)
], mc = {
  appId: "appid",
  tapUiVanish: "tapUIVanish"
};
function fc(r) {
  return r.replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2").replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}
const bc = [
  "onSettingLoaded",
  "onAppdataReady",
  "onUiConfigure",
  "onCoreDomReady",
  "onUiDomReady",
  "onCoreReady",
  "onUiReady"
];
function wa(r, i) {
  const t = {}, e = /* @__PURE__ */ new Set([...bc, ...Object.keys(r)]);
  for (const n of e) {
    if (n === "__proto__") continue;
    const o = r[n];
    t[n] = typeof o == "function" ? (g) => o.call(r, {
      ...g,
      core: i,
      mapDivDocument: i
    }) : o;
  }
  return t;
}
function CA(r, i, t, e = zt) {
  if (i != null)
    switch (r.kind) {
      case "boolean-or-string":
        return i === "" || i === "true" || i === r.attr ? !0 : i === "false" ? !1 : i;
      case "boolean":
        if (i === "" || i === "true" || i === r.attr) return !0;
        if (i === "false") return !1;
        t?.(
          `<${e}>: invalid boolean value "${i}" for attribute "${r.attr}" (use "true" / "false"); treated as unspecified.`
        );
        return;
      case "number": {
        if (i === "") return;
        const n = Number(i);
        if (Number.isNaN(n)) {
          t?.(`<${e}>: invalid number "${i}" for attribute "${r.attr}"; treated as unspecified.`);
          return;
        }
        return n;
      }
      default:
        return i === "" ? void 0 : i;
    }
}
function nn(r, i) {
  return i == null ? null : r.kind === "boolean" || r.kind === "boolean-or-string" && typeof i == "boolean" ? i ? "" : "false" : String(i);
}
function vc(r, i, t = zt) {
  return i === "attribute" ? `<${t}>: ignored unsupported attribute "${r.attr ?? fc(r.prop)}"` : `<${t}>: ignored unsupported property "${r.prop}"`;
}
const yc = [
  { attr: "lang", prop: "lang", kind: "string" },
  { attr: "enable-share", prop: "enableShare", kind: "boolean" },
  { attr: "enable-border", prop: "enableBorder", kind: "boolean" },
  { attr: "enable-hide-marker", prop: "enableHideMarker", kind: "boolean" },
  { attr: "enable-marker-list", prop: "enableMarkerList", kind: "boolean" },
  { attr: "enable-poi-html-no-scroll", prop: "enablePoiHtmlNoScroll", kind: "boolean" },
  { attr: "presentation-mode", prop: "presentationMode", kind: "boolean" },
  { attr: "state-url", prop: "stateUrl", kind: "boolean", startup: !0 },
  // "" と "true" は true（既定のパス）・"false" は false・それ以外は URL
  { attr: "pwa-manifest", prop: "pwaManifest", kind: "boolean-or-string", startup: !0 },
  { attr: "pwa-worker", prop: "pwaWorker", kind: "string", startup: !0 },
  { attr: "pwa-scope", prop: "pwaScope", kind: "string", startup: !0 },
  { attr: "app-envelope", prop: "appEnvelope", kind: "boolean", startup: !0 },
  { attr: "tap-duration", prop: "tapDuration", kind: "number", option: "tapDuration" },
  { attr: "tap-ui-vanish", prop: "tapUiVanish", kind: "boolean", option: "tapUIVanish" },
  { attr: "set-document-title", prop: "setDocumentTitle", kind: "boolean" }
];
function ds() {
  const r = { settled: !1 };
  return r.promise = new Promise((i, t) => {
    r.resolve = () => {
      r.settled = !0, i();
    }, r.reject = (e) => {
      r.settled = !0, t(e);
    };
  }), r.promise.catch(() => {
  }), r;
}
const xa = "maplat-app-element-style", wc = ":where(maplat-app){display:block;position:relative;overflow:hidden;height:400px;}";
function xc(r) {
  if (r.getElementById(xa)) return;
  const i = r.createElement("style");
  i.id = xa, i.textContent = wc, (r.head || r.documentElement).appendChild(i);
}
function kc(r) {
  if (typeof requestAnimationFrame == "function") {
    const t = requestAnimationFrame(() => r());
    return () => cancelAnimationFrame(t);
  }
  const i = setTimeout(r, 16);
  return () => clearTimeout(i);
}
const Mc = typeof HTMLElement < "u" ? HTMLElement : class {
}, Sc = Ar, ki = [...Ar, ...yo], us = [...vo, ...cA], zc = new Map(ki.map((r) => [r.attr, r])), Nn = new Map(ki.map((r) => [r.prop, r])), Fr = new Set(IA), Pc = /* @__PURE__ */ new Set(["clientPointToLngLat", "lngLatToClientPoint"]);
var K, se, Rt, Bt, ie, ms, Vt, fe, Ui, Ze, hi, pe, Vi, Mi, Ge, Ve, rn, Te, k, fs, bs, Jr, vs, sn, Tn, Wn, Tt, jn, ys, on, ka, Ma, Sa, za, Kr, Ln, Pa, hA, pA;
const Yi = class extends Mc {
  constructor() {
    super(...arguments), $(this, k), $(this, K, null), $(this, se, ds()), $(this, Rt, !1), $(this, Bt, /* @__PURE__ */ new Map()), $(this, ie, null), $(this, ms, Cc()), $(this, Vt, /* @__PURE__ */ new Set()), $(this, fe, !1), $(this, Ui, !1), $(this, Ze, 0), $(this, hi, null), $(this, pe, null), $(this, Vi, Promise.resolve()), $(this, Mi, null), $(this, Ge, null), $(this, Ve, !1), $(this, rn, /* @__PURE__ */ new Map()), $(this, Te, null);
  }
  static get observedAttributes() {
    return ki.map((i) => i.attr);
  }
  // ---- ライフサイクル ----
  connectedCallback() {
    for (const i of ki) S(this, k, ys).call(this, i.prop);
    for (const i of us) S(this, k, ys).call(this, i.prop);
    for (const i of ki)
      i.feature && this.hasAttribute(i.attr) && S(this, k, sn).call(this, i, "attribute");
    this.ownerDocument && xc(this.ownerDocument), b(this, K) || (O(this, fe, !0), S(this, k, on).call(this)), S(this, k, hA).call(this);
  }
  disconnectedCallback() {
    queueMicrotask(() => {
      this.isConnected || S(this, k, pA).call(this);
    });
  }
  attributeChangedCallback(i, t, e) {
    if (t === e || b(this, Ve)) return;
    const n = zc.get(i);
    n && (n.feature && !S(this, k, sn).call(this, n, "attribute") || S(this, k, jn).call(this, n.prop, `attribute "${i}"`));
  }
  // ---- 状態の読み取り ----
  /**
   * 地図の準備完了で解決する。要素を置き直したときだけ新しい Promise になる: DOM から外して破棄が
   * 決まった時点（外した拍の後のマイクロタスク）で、前の Promise が決着していれば新しい Promise に替わる
   * （同じ拍の付け替えでは破棄しないので替わらない）。
   */
  get ready() {
    return b(this, se).promise;
  }
  /** 設定ファイルの中身（凍結した浅い複製）。lifecycle:appdata-ready の発火時から読める。 */
  get appData() {
    const i = b(this, K)?.appData;
    return i ? Object.freeze({ ...i }) : null;
  }
  /** 起動時に使った復元値（restore・map-id・transparency・restoreSession の localStorage）。 */
  get initialRestore() {
    return Object.freeze({ ...b(this, K)?.initialRestore || {} });
  }
  /** 現在の状態（旧 stateBuffer の複製）。変化は updateState イベントで知る。 */
  get state() {
    return Object.freeze({ ...b(this, K)?.stateBuffer || {} });
  }
  /** 表示中の地図の mapID。 */
  get currentMapId() {
    const i = b(this, K);
    if (!i || typeof i.currentMapInfo != "function") return null;
    try {
      return i.currentMapInfo()?.mapID ?? null;
    } catch {
      return null;
    }
  }
  /** 現在の視点（最後の changeViewpoint の detail）。 */
  get viewpoint() {
    return b(this, Mi) ? { ...b(this, Mi) } : null;
  }
  /** GPS の追跡が有効か（getGPSEnabled() と同じ）。 */
  get gpsEnabled() {
    return b(this, K) ? !!b(this, K).getGPSEnabled() : !1;
  }
  // ---- 自前のメソッド ----
  /** 現在の視点。地図の準備前は null。 */
  getViewpoint() {
    return this.viewpoint;
  }
  /** 機能の問い合わせ。未知の名前は false。地図の準備前でも答える。 */
  supports(i) {
    return this.features()[i] === !0;
  }
  /** 中身を破棄する（既定では初期化の完了後に呼ぶ。canDisposeDuringStartup も見よ）。既定は impl.remove()。 */
  disposeImplementation(i) {
    i.remove?.();
  }
  /**
   * 中身が初期化の途中でも破棄できるか（破棄の口が途中の初期化を中断して同期で後始末を済ませる実装なら true）。
   * 既定の false では、初期化の途中で外された中身は waitReady の完了を待ってから破棄し、次の中身はその後に作る
   * （途中で消すと残りの初期化が消えた箱へ書き込む実装のため）。true なら外した時点で破棄し、待たない。
   */
  canDisposeDuringStartup() {
    return !1;
  }
  /** 中身を作った直後（イベントの購読の後・ready の前）。 */
  onImplementationCreated(i) {
  }
  /** 中身の準備が済んだとき（ready の解決の直前）。 */
  onImplementationReady(i) {
  }
  /** 中身を外すとき（購読の解除と同時。破棄の前）。 */
  onImplementationDetached(i) {
  }
  /** 中身のイベントを出し直した直後（派生クラスの控え・描き直しに使う）。 */
  onImplementationEvent(i, t, e) {
  }
  /** 要素の大きさが変わったとき（ready 後）。 */
  onResize(i) {
  }
  /** DOM だけで当てるキー（AttrDef.dom）が変わったとき・中身を作った直後。 */
  applyDomKeys() {
  }
  /**
   * 起動後の (ii) のキーの変更を中身へ反映する。map-id・transparency は基底が先に当てる。
   * resolve はプロパティ／属性 ＞ appOption ＞ fallback の順で値を引く。
   */
  applyRuntimeChanges(i, t, e) {
  }
  /** 中身の detail → 要素のイベントの detail。派生クラスは super を呼んでから足す。 */
  convertEventDetail(i, t, e) {
    return i === "lifecycle:error" ? { phaseId: t?.phaseId, error: t?.error } : i.startsWith("lifecycle:") ? { phaseId: t?.phaseId, appData: t?.appData ?? null } : t;
  }
  /** 委譲メソッドの戻り値の調整（undefined → null）。 */
  convertMethodResult(i, t) {
    return Pc.has(i) ? Promise.resolve(t).then((e) => e === void 0 ? null : e) : t;
  }
  /** 中身が出し直す対象のイベント名。既定は MAPLAT_APP_EVENTS。 */
  forwardedEvents() {
    return lA;
  }
  // ---- 派生クラスが使う道具 ----
  /** 今の中身（作る前・破棄の後は null）。層 A の公開面ではない。 */
  currentImplementation() {
    return b(this, K);
  }
  /** 中身の準備が済んでいるか。 */
  isImplementationReady() {
    return b(this, Rt);
  }
  /** 中身が無ければ「まだ作っていない」の例外を投げる。 */
  requireImplementation(i) {
    return S(this, k, vs).call(this, i);
  }
  /** キーの現在値（起動時キーは起動後なら起動時の値）。 */
  readKey(i) {
    return S(this, k, Wn).call(this, i);
  }
  /**
   * 実装が実際に使っているキーの値（任意）。`{ value }` を返すと #readKey はその値を返す。
   * 既定は undefined（実装から値を受け取らない＝今までどおり属性・起動時の値を返す）。
   * 設定ファイル等から実装が読んだ値と要素の見せかけの値が食い違う実装だけが上書きする（Core の互換モード）。
   */
  implementationKeyValue(i, t) {
  }
  /**
   * キーを「反映待ち」に積む（ready 後に applyRuntimeChanges へ渡る）。作成時の材料で渡せないキーを
   * 準備の完了後に当てたいとき、onImplementationReady から呼ぶ（そこで積んだ分は ready の解決の直後に反映する）。
   */
  markPending(i) {
    b(this, Vt).add(i), S(this, k, on).call(this);
  }
  /** 要素から DOM の CustomEvent を出す（bubbles・composed なし・cancelable なし）。 */
  dispatchLayerAEvent(i, t) {
    this.dispatchEvent(new CustomEvent(i, { bubbles: !0, composed: !1, cancelable: !1, detail: t }));
  }
  /**
   * 内部の操作（UI・メソッド・状態 URL の復元・中身自身の切り替え）で変わった状態を属性へ書き戻す
   * （対象は AttrDef.state を持つキー: map-id・transparency・Pro の display-mode）。
   * 書き戻しは属性の変更として扱わない（attributeChangedCallback が何もしない＝二重に処理しない）。
   * state が "frame" のキーは描画 1 回につき 1 回にまとめ、書く時点で read() から値を読む（最後の値が残る）。
   * 利用者の変更が反映待ちのキー・値が無い（undefined）・既に同じ値のときは書かない。
   */
  reflectState(i, t) {
    const e = Nn.get(i);
    if (e?.state) {
      if (e.state !== "frame") {
        S(this, k, fs).call(this, e, t());
        return;
      }
      b(this, rn).set(i, t), !b(this, Te) && O(this, Te, kc(() => {
        O(this, Te, null), S(this, k, bs).call(this);
      }));
    }
  }
  /** 同じ鍵では 1 回だけ警告する（名前は公開の基底クラスのメソッドなので残す）。 */
  warnOnce(i, t) {
    b(this, ms).call(this, i, t);
  }
};
K = /* @__PURE__ */ new WeakMap(), se = /* @__PURE__ */ new WeakMap(), Rt = /* @__PURE__ */ new WeakMap(), Bt = /* @__PURE__ */ new WeakMap(), ie = /* @__PURE__ */ new WeakMap(), ms = /* @__PURE__ */ new WeakMap(), Vt = /* @__PURE__ */ new WeakMap(), fe = /* @__PURE__ */ new WeakMap(), Ui = /* @__PURE__ */ new WeakMap(), Ze = /* @__PURE__ */ new WeakMap(), hi = /* @__PURE__ */ new WeakMap(), pe = /* @__PURE__ */ new WeakMap(), Vi = /* @__PURE__ */ new WeakMap(), Mi = /* @__PURE__ */ new WeakMap(), Ge = /* @__PURE__ */ new WeakMap(), Ve = /* @__PURE__ */ new WeakMap(), rn = /* @__PURE__ */ new WeakMap(), Te = /* @__PURE__ */ new WeakMap(), k = /* @__PURE__ */ new WeakSet(), // ---- 内部 ----
fs = function(r, i) {
  if (i == null || b(this, Vt).has(r.prop) || r.feature && !this.supports(r.feature) || S(this, k, Tt).call(this, r.prop) === i) return;
  const t = nn(r, i);
  if (t != null) {
    O(this, Ve, !0);
    try {
      this.setAttribute(r.attr, t);
    } finally {
      O(this, Ve, !1);
    }
  }
}, bs = function() {
  b(this, Te) && (b(this, Te).call(this), O(this, Te, null));
  const r = [...b(this, rn)];
  b(this, rn).clear();
  for (const [i, t] of r) {
    const e = Nn.get(i);
    e && S(this, k, fs).call(this, e, t());
  }
}, /** 透過度を属性へ書き戻す（描画 1 回にまとめる。値は書く時点の getTransparency()）。 */
Jr = function() {
  this.reflectState("transparency", () => {
    const r = b(this, K);
    if (!(!r || typeof r.getTransparency != "function"))
      try {
        const i = Number(r.getTransparency());
        return Number.isFinite(i) ? i : void 0;
      } catch {
        return;
      }
  });
}, vs = function(r) {
  const i = b(this, K);
  if (!i)
    throw new DOMException(
      `<${zt}>.${r}(): the map is not created yet (connect the element with app-id, app-src or setting, then await element.ready).`,
      "InvalidStateError"
    );
  return i;
}, /** Pro 固有キー: 対応していれば true。していなければキーごとに 1 回警告して false。 */
sn = function(r, i) {
  return !r.feature || this.supports(r.feature) ? !0 : (this.warnOnce(`unsupported:${r.prop}`, vc(r, i)), !1);
}, /** 起動後の起動時キーへの書き込みなら警告して true を返す。 */
Tn = function(r, i) {
  return !b(this, ie) || !Fr.has(r) ? !1 : (this.warnOnce(
    `startup:${r}`,
    `<${zt}>: ${i} is fixed at startup and cannot be changed after the map is created; the change was ignored.`
  ), !0);
}, Wn = function(r) {
  if (b(this, K) && b(this, Rt)) {
    const i = this.implementationKeyValue(r, b(this, K));
    if (i) return i.value;
  }
  return b(this, ie) && b(this, ie).has(r) ? b(this, ie).get(r) : S(this, k, Tt).call(this, r);
}, Tt = function(r) {
  const i = Nn.get(r);
  if (i) {
    const t = this.getAttribute(i.attr);
    return CA(i, t, (e) => this.warnOnce(`parse:${i.attr}:${t}`, e));
  }
  return b(this, Bt).get(r);
}, jn = function(r, i) {
  if (b(this, ie) && Fr.has(r)) {
    i && S(this, k, Tn).call(this, r, i);
    return;
  }
  if (Fr.has(r)) {
    this.isConnected && (O(this, fe, !0), S(this, k, on).call(this));
    return;
  }
  if (Nn.get(r)?.dom) {
    this.applyDomKeys();
    return;
  }
  b(this, Vt).add(r), S(this, k, on).call(this);
}, ys = function(r) {
  if (Object.prototype.hasOwnProperty.call(this, r)) {
    const i = this[r];
    delete this[r], this[r] = i;
  }
}, on = function() {
  b(this, Ui) || (O(this, Ui, !0), queueMicrotask(() => {
    O(this, Ui, !1), S(this, k, Ma).call(this);
  }));
}, ka = function() {
  return !!(S(this, k, Tt).call(this, "appId") || S(this, k, Tt).call(this, "appSrc") || b(this, Bt).get("setting") || b(this, Bt).get("appOption"));
}, Ma = function() {
  if (this.isConnected) {
    if (b(this, fe))
      if (b(this, K))
        O(this, fe, !1);
      else {
        if (!S(this, k, ka).call(this)) return;
        O(this, fe, !1), S(this, k, za).call(this);
        return;
      }
    b(this, K) && b(this, Rt) && S(this, k, Kr).call(this);
  }
}, /** 起動時の材料を組む（優先順位: 個別のキー ＞ appOption ＞ 設定ファイル ＞ 既定値）。 */
Sa = function() {
  const r = { ...b(this, Bt).get("appOption") || {} };
  for (const [n, o] of Object.entries(mc))
    r[n] !== void 0 && (r[o] === void 0 && (r[o] = r[n]), delete r[n]);
  const i = {};
  for (const n of Sc) {
    const o = S(this, k, Tt).call(this, n.prop);
    o !== void 0 && (i[n.prop] = o);
  }
  for (const n of yo) {
    if (n.feature && !this.supports(n.feature)) continue;
    const o = S(this, k, Tt).call(this, n.prop);
    o !== void 0 && (i[n.prop] = o);
  }
  for (const n of us) {
    if (n.feature && !this.supports(n.feature)) continue;
    const o = b(this, Bt).get(n.prop);
    o !== void 0 && (i[n.prop] = o);
  }
  i.uiHooks && (i.uiHooks = wa(i.uiHooks, this)), r.uiHooks && (r.uiHooks = wa(r.uiHooks, this));
  let t = i.setting ?? r.setting;
  const e = i.appSrc;
  return !t && e && (t = fetch(e).then((n) => {
    if (!n.ok) throw new Error(`<${zt}>: failed to load ${e} (${n.status})`);
    return n.json();
  })), { values: i, appOption: r, setting: t, element: this };
}, za = function() {
  const r = ++ra(this, Ze)._;
  b(this, se).settled && O(this, se, ds());
  const i = b(this, se);
  b(this, Vt).clear();
  const t = /* @__PURE__ */ new Map();
  for (const e of IA) t.set(e, S(this, k, Tt).call(this, e));
  O(this, ie, t), b(this, Vi).then(() => {
    if (r !== b(this, Ze) || !this.isConnected) return;
    let e;
    try {
      e = this.createImplementation(S(this, k, Sa).call(this));
    } catch (n) {
      i.reject(n);
      return;
    }
    O(this, K, e), O(this, Rt, !1), O(this, Mi, null), O(this, Ge, null), O(this, hi, S(this, k, Pa).call(this, e)), this.onImplementationCreated(e), this.applyDomKeys(), Promise.resolve(e.waitReady).then(
      () => {
        r === b(this, Ze) && (O(this, Rt, !0), this.onImplementationReady(e), S(this, k, Ln).call(this), i.resolve(), S(this, k, Kr).call(this));
      },
      (n) => {
        r === b(this, Ze) && i.reject(n);
      }
    );
  });
}, /** (ii) のキーの変更を中身へ反映する（ready 後）。 */
Kr = function() {
  const r = b(this, K);
  if (!r || b(this, Vt).size === 0) return;
  const i = new Set(b(this, Vt));
  b(this, Vt).clear();
  const t = b(this, Bt).get("appOption") || {}, e = (n, o, g) => {
    const c = S(this, k, Tt).call(this, n);
    return c !== void 0 ? c : o && t[o] != null ? t[o] : g;
  };
  if (i.has("mapId")) {
    const n = S(this, k, Tt).call(this, "mapId");
    let o;
    try {
      o = r.currentMapInfo?.()?.mapID;
    } catch {
      o = void 0;
    }
    if (n && n !== o) {
      const g = this.listMaps();
      g.length > 0 && !g.some((c) => c.mapID === n) ? (console.warn(`<${zt}>: map-id "${n}" is not a usable map of this app; ignored.`), o && this.reflectState("mapId", () => o)) : r.changeMap(n);
    }
  }
  if (i.has("transparency")) {
    const n = S(this, k, Tt).call(this, "transparency") ?? 0;
    r.setTransparency(n);
  }
  this.applyRuntimeChanges(r, i, e);
}, Ln = function() {
  const r = b(this, K);
  if (!r) return;
  const i = !!r.getGPSEnabled();
  if (b(this, Ge) === null) {
    if (O(this, Ge, i), !i) return;
  } else if (b(this, Ge) === i)
    return;
  O(this, Ge, i), this.dispatchLayerAEvent("gpsEnabledChanged", { enabled: i });
}, Pa = function(r) {
  const i = [];
  for (const t of this.forwardedEvents()) {
    const e = (n) => {
      const o = n && "detail" in n ? n.detail : null;
      if (t === "changeViewpoint" && o && O(this, Mi, { ...o }), t === "mapChanged") {
        const c = o?.mapID;
        this.reflectState("mapId", () => typeof c == "string" && c !== "" ? c : this.currentMapId);
      }
      if (t === "modechange") {
        const c = o?.mode;
        this.reflectState("displayMode", () => typeof c == "string" ? c : void 0);
      }
      t === "updateState" && o && typeof o == "object" && "transparency" in o && S(this, k, Jr).call(this);
      const g = this.convertEventDetail(t, o, r);
      this.dispatchLayerAEvent(t, g), t.startsWith("gps_") && S(this, k, Ln).call(this), this.onImplementationEvent(t, o, r);
    };
    r.addEventListener(t, e), i.push([t, e]);
  }
  return () => {
    for (const [t, e] of i) r.removeEventListener(t, e);
  };
}, hA = function() {
  b(this, pe) || typeof ResizeObserver > "u" || (O(this, pe, new ResizeObserver(() => {
    const r = b(this, K);
    !r || !b(this, Rt) || this.onResize(r);
  })), b(this, pe).observe(this));
}, pA = function() {
  S(this, k, bs).call(this), ra(this, Ze)._++, O(this, fe, !1), b(this, se).settled && O(this, se, ds()), O(this, Rt, !1), O(this, ie, null), b(this, Vt).clear(), b(this, pe) && (b(this, pe).disconnect(), O(this, pe, null));
  const r = b(this, K);
  if (!r) return;
  O(this, K, null), O(this, Rt, !1), b(this, hi) && (b(this, hi).call(this), O(this, hi, null)), this.onImplementationDetached(r);
  const i = () => this.disposeImplementation(r);
  if (this.canDisposeDuringStartup()) {
    try {
      i();
    } catch (t) {
      console.warn(`<${zt}>: failed to dispose the map`, t);
    }
    return;
  }
  O(this, Vi, b(this, Vi).then(
    () => Promise.resolve(r.waitReady).then(i, i).catch((t) => {
      console.warn(`<${zt}>: failed to dispose the map`, t);
    })
  ));
}, Dr(Yi, "events", lA), Dr(Yi, "ownEvents", dc), Dr(Yi, "methods", ya), (() => {
  const r = Yi.prototype;
  for (const i of ki)
    Object.defineProperty(r, i.prop, {
      configurable: !0,
      enumerable: !0,
      get() {
        if (!(i.feature && !this.supports(i.feature)))
          return S(this, k, Wn).call(this, i.prop);
      },
      set(t) {
        if (i.feature && !S(this, k, sn).call(this, i, "property") || S(this, k, Tn).call(this, i.prop, `property "${i.prop}"`)) return;
        const e = nn(i, t);
        O(this, Ve, !0);
        try {
          e == null ? this.removeAttribute(i.attr) : this.setAttribute(i.attr, e);
        } finally {
          O(this, Ve, !1);
        }
        S(this, k, jn).call(this, i.prop, null);
      }
    });
  for (const i of us)
    Object.defineProperty(r, i.prop, {
      configurable: !0,
      enumerable: !0,
      get() {
        if (!(i.feature && !this.supports(i.feature)))
          return S(this, k, Wn).call(this, i.prop);
      },
      set(t) {
        i.feature && !S(this, k, sn).call(this, i, "property") || S(this, k, Tn).call(this, i.prop, `property "${i.prop}"`) || (t == null ? b(this, Bt).delete(i.prop) : b(this, Bt).set(i.prop, t), S(this, k, jn).call(this, i.prop, null));
      }
    });
  for (const i of ya)
    Object.defineProperty(r, i, {
      configurable: !0,
      writable: !0,
      enumerable: !1,
      value(...t) {
        const e = S(this, k, vs).call(this, i), n = () => {
          const o = e[i](...t);
          return i === "handleGPS" && S(this, k, Ln).call(this), i === "setTransparency" && S(this, k, Jr).call(this), this.convertMethodResult(i, o);
        };
        return b(this, Rt) ? n() : b(this, se).promise.then(n);
      }
    });
})();
let KI = Yi;
function qI(r, i = zt, t = "this implementation") {
  if (typeof customElements > "u") return !1;
  const e = customElements.get(i);
  return e ? (e !== r && console.warn(`<${i}> is already defined by another implementation; ${t} did not redefine it.`), !1) : (customElements.define(i, r), !0);
}
const Ec = {
  house: {
    viewBox: "0 0 512 512",
    path: "M240 6.1c9.1-8.2 22.9-8.2 32 0l232 208c9.9 8.8 10.7 24 1.8 33.9s-24 10.7-33.9 1.8l-8-7.2 0 205.3c0 35.3-28.7 64-64 64l-288 0c-35.3 0-64-28.7-64-64l0-205.3-8 7.2c-9.9 8.8-25 8-33.9-1.8s-8-25 1.8-33.9L240 6.1zm16 50.1L96 199.7 96 448c0 8.8 7.2 16 16 16l48 0 0-104c0-39.8 32.2-72 72-72l48 0c39.8 0 72 32.2 72 72l0 104 48 0c8.8 0 16-7.2 16-16l0-248.3-160-143.4zM208 464l96 0 0-104c0-13.3-10.7-24-24-24l-48 0c-13.3 0-24 10.7-24 24l0 104z"
  },
  "location-crosshairs": {
    viewBox: "0 0 576 512",
    path: "M288-16c17.7 0 32 14.3 32 32l0 18.3c98.1 14 175.7 91.6 189.7 189.7l18.3 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-18.3 0c-14 98.1-91.6 175.7-189.7 189.7l0 18.3c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-18.3C157.9 463.7 80.3 386.1 66.3 288L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l18.3 0C80.3 125.9 157.9 48.3 256 34.3L256 16c0-17.7 14.3-32 32-32zM128 256a160 160 0 1 0 320 0 160 160 0 1 0 -320 0zm160-96a96 96 0 1 1 0 192 96 96 0 1 1 0-192z"
  },
  compass: {
    viewBox: "0 0 512 512",
    path: "M464 256a208 208 0 1 0 -416 0 208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0zm306.7 69.1L162.4 380.6c-19.4 7.5-38.5-11.6-31-31l55.5-144.3c3.3-8.5 9.9-15.1 18.4-18.4l144.3-55.5c19.4-7.5 38.5 11.6 31 31L325.1 306.7c-3.3 8.5-9.9 15.1-18.4 18.4zM288 256a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"
  },
  "share-from-square": {
    viewBox: "0 0 576 512",
    path: "M425.5 7c-6.9-6.9-17.2-8.9-26.2-5.2S384.5 14.3 384.5 24l0 56-48 0c-88.4 0-160 71.6-160 160 0 46.7 20.7 80.4 43.6 103.4 8.1 8.2 16.5 14.9 24.3 20.4 9.2 6.5 21.7 5.7 30.1-1.9s10.2-20 4.5-29.8c-3.6-6.3-6.5-14.9-6.5-26.7 0-36.2 29.3-65.5 65.5-65.5l46.5 0 0 56c0 9.7 5.8 18.5 14.8 22.2s19.3 1.7 26.2-5.2l136-136c9.4-9.4 9.4-24.6 0-33.9L425.5 7zm7 97l0-22.1 78.1 78.1-78.1 78.1 0-22.1c0-13.3-10.7-24-24-24L338 192c-50.9 0-93.9 33.5-108.3 79.6-3.3-9.4-5.2-19.8-5.2-31.6 0-61.9 50.1-112 112-112l72 0c13.3 0 24-10.7 24-24zm-320-8c-44.2 0-80 35.8-80 80l0 256c0 44.2 35.8 80 80 80l256 0c44.2 0 80-35.8 80-80l0-24c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 24c0 17.7-14.3 32-32 32l-256 0c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l24 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-24 0z"
  },
  "layer-group": {
    viewBox: "0 0 512 512",
    path: "M232.5 5.2c14.9-6.9 32.1-6.9 47 0l218.6 101c8.5 3.9 13.9 12.4 13.9 21.8s-5.4 17.9-13.9 21.8l-218.6 101c-14.9 6.9-32.1 6.9-47 0L13.9 149.8C5.4 145.8 0 137.3 0 128s5.4-17.9 13.9-21.8L232.5 5.2zM48.1 218.4l164.3 75.9c27.7 12.8 59.6 12.8 87.3 0l164.3-75.9 34.1 15.8c8.5 3.9 13.9 12.4 13.9 21.8s-5.4 17.9-13.9 21.8l-218.6 101c-14.9 6.9-32.1 6.9-47 0L13.9 277.8C5.4 273.8 0 265.3 0 256s5.4-17.9 13.9-21.8l34.1-15.8zM13.9 362.2l34.1-15.8 164.3 75.9c27.7 12.8 59.6 12.8 87.3 0l164.3-75.9 34.1 15.8c8.5 3.9 13.9 12.4 13.9 21.8s-5.4 17.9-13.9 21.8l-218.6 101c-14.9 6.9-32.1 6.9-47 0L13.9 405.8C5.4 401.8 0 393.3 0 384s5.4-17.9 13.9-21.8z"
  },
  "circle-question": {
    viewBox: "0 0 512 512",
    path: "M464 256a208 208 0 1 0 -416 0 208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0zm256-80c-17.7 0-32 14.3-32 32 0 13.3-10.7 24-24 24s-24-10.7-24-24c0-44.2 35.8-80 80-80s80 35.8 80 80c0 47.2-36 67.2-56 74.5l0 3.8c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-8.1c0-20.5 14.8-35.2 30.1-40.2 6.4-2.1 13.2-5.5 18.2-10.3 4.3-4.2 7.7-10 7.7-19.6 0-17.7-14.3-32-32-32zM224 368a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"
  },
  "circle-info": {
    viewBox: "0 0 512 512",
    path: "M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zM224 160a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm-8 64l48 0c13.3 0 24 10.7 24 24l0 88 8 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-80 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l24 0 0-64-24 0c-13.3 0-24-10.7-24-24s10.7-24 24-24z"
  },
  "map-pin": {
    viewBox: "0 0 320 512",
    path: "M192 284.4C256.1 269.9 304 212.5 304 144 304 64.5 239.5 0 160 0S16 64.5 16 144c0 68.5 47.9 125.9 112 140.4L128 480c0 17.7 14.3 32 32 32s32-14.3 32-32l0-195.6zM168 96c-30.9 0-56 25.1-56 56 0 13.3-10.7 24-24 24s-24-10.7-24-24c0-57.4 46.6-104 104-104 13.3 0 24 10.7 24 24s-10.7 24-24 24z"
  },
  list: {
    viewBox: "0 0 512 512",
    path: "M40 48C26.7 48 16 58.7 16 72l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24L40 48zM192 64c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L192 64zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-288 0zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-288 0zM16 232l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24l-48 0c-13.3 0-24 10.7-24 24zM40 368c-13.3 0-24 10.7-24 24l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24l-48 0z"
  }
};
function Ot(r, i = "") {
  const t = Ec[r];
  return t ? `<svg class="${i}" viewBox="${t.viewBox}" xmlns="http://www.w3.org/2000/svg" style="fill: currentColor; height: 1em; width: 1em; vertical-align: -0.125em;"><path d="${t.path}" /></svg>` : "";
}
const Tc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAOCAYAAADNGCeJAAABfWlDQ1BJQ0MgUHJvZmlsZQAAeNqtjjFLW1EYhp8TY1UMGEqwDiIHFOlwU1IdNNYlJmAiDhItJNlubm6icJMcbk5I+wPcXHQQXRT1L4guDo7ioIMgCMHfIAiClHA7XDRT26Xv9HzP8H4vBLSplBMEqjXtZhcXZC5fkH1tBgnxkTk+mVZDJVZWlvljXu4RAHdRUymnnHl9mN9sHZ5+WNofm9MGf89gyW5YIPoBq9SwqiAcwLCUq0HsAdGWVhrEFRBxc/kCiDYQqfj8BESKuXwBAkEg4q5lkxAYAcJFnz8D4YrPs0DYWjdLEEgDhr8BgIF0Ss7E4tEE/zlVp/n2QwAhu/Z9FQgDo6RJIZkhRpwoCW3/0ADJuvrpblTWtUwo5dgyWa+qprZdQ2Zq1hdDTsW+xgBy+YL0q5+zCEAM33Zd/Qji49Cz1XXFXTi/gJHrrps4gKFvcHajTNd8Hy5egv+6G+XpKZ9DC9D76HnPk9C3A51tz/t17HmdE+hpw6XzGyR3aeBUQPO7AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4QgNBwsm52C7KAAAAk1JREFUOMttkztrVFEUhb99MpMxiRkTgkQjaHwVWlgKKSzEyiJFsNLCzloQf4C/QC1sRAVtRfANAUVRUIuAWEhEfBXJRM3DzCSZmUwyZy+Le3Nngh44cNhn32+ftfa+Vir7haFtdgxosHkVfGbiVseuo0+ySN7z6w0e5cwqWUwCs6BaeYlSReOSSy5JkntycElamn7ZTn/+TWeTu1Z+llstR35WvP/BB+2ur6sp15o3Y8KU5PU/SwBXHrw3gNKKHkpSjM0E5x4V1+WzH096rTLIr7obwNcFX5ak758n36TVXB6lZxeHkQBYrHtFkuZmpt6mMtbVXJPfONEvibCjKwigI5gBDMSZ+ysRDBkW4Mjpc5hx6YX2F7dYkVijUs3fzSwD6CyYmRFajiTVu3KN6mqTt2AATu+eMYCxwzofAKoLr2LvYG0j39INtMPShoXYnGswDgLJ1FE4BNjefkYBaFTuGeRa5VurDZby84Xum5PcA0slbGVq4vFoCDYsgM/Xn4ZAZ9sXGfQfmShXuDxinxYbYIYZUDxw/GZPDqjPux279iNAfgOl/8u0TVVqDR4lMykV+3q2C7DV8p1sUFGWm72sJm/dA+bJYXZVDyXDzEySzCOqz99tl5eZHzoTWLcljyt2JaaybccgwJnb9jhpAgKawrFTI68B1nK2s12O7RvpBaBU8avRNZ8NamxK8hLA75oW0njU8vQXgGVpPsaN/8jlLrnHRa+W3wUzdgXTACCTUOhA2BDAwiq3QBgEVqavpg4NhJB4mXZIZqHP4OBfhGGQCkGsJ74AAAAASUVORK5CYII=", Lc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFgAAAAfCAQAAADJwcJrAAAAAmJLR0QA/4ePzL8AAAdXSURBVFjD1dh5cFX1FcDxz7tvyYskECKmbMq+iIpgFYFilTU6VWs72BHtUBdqx6lLa9UyVG3tuLWdabWjDi5lFHRaWxDUQBEHRW1VhLBYN4ILIBARNBAhydv7Ry7PgInVaem0vzPvzu+ce++73zn33HPO70cyvibIKfzvSyQXr5WMxJ/rNO6uYKisnKy8jI1etcl2uzVpkZeQ1MURuhtmuCoxMTFRcTExCTFxcQlxUYdyrFSd2/dCJMjNDkbIyMrK2Wa1Nd7SKPeZG0r0dbSTHKtrCBwPgRP/JeSnnZ4L8sExUlJSWrzqUX+2SoOcQHfDfd0Eow1WJiJlg6fMt9RWKWlpKRkpGWlpGRkZBXzVWPCA04rHVj0iImGMXW2s+8fsoqXepR0AT5SPxsjKyMpYbal/aEKZEww3RA9dxDX52CZvWmWTZuvs1miCvgoKKIBIKIGPrBWx0xHtPLCXm+1zg7mqVXTox+e80sGZADEy0rLesNAGKYERJptkhEpB8dK0zV7ylBXqvadZYLJeIfKnsIFAjREaLHZhOw/sbKpP/F7OSx421T7n2OBkh5uN3capt8xMm81wuXPVu8Jtn4VOydiqxkYpcRNd41oTdRMgKy2PhEG+a5YZBon6wIte8VH4Zlrjf7/UmKTak+166E3lekr6Xqg/ZKM5VhbP/kS5R1xqgGvd5xRPqJM+6D9iZLVYbr0WgSmuNkYp6r3mHQ2yknoYZrAyx7hMhfts8K5VuhnVxrOtkrXcNM2ulGoHuJ+bzfAzVaG+ztkmOVsWjPQty+w2SpkhBrnGZj+SaA/4HS9rUjDCVcZKynjZEs97Q6O8mF5OMNnp+ujuAg0eUO9VA/TRsw1sVM7L9pkGVrQDfJjzrXS5s0I9L0cxHyURlQ+1K1WY65s2GHRwSKQ9p0FOmRlGScpY6lZ3edFueWRtttBt7vaWvCrf8TUJzV6zMQyDXFGWGaPGU0Z3EBRcrcG8cD7SIn/x2Gd8uNMrrrLCryU1fTaGP/a6Fow1RRc87zeetVdMX2ONN1JXgffNMcdmHK1aH9TZYa+cvJx8KE87x6nGO69D4D7OdXc4v8hQM40SO+CKkxTM8wOrjXeh4w+6P6Jwhbn2iLrfucrscLm/2qfceJMMVWqnVWpskNbbjc7XSZ3rzVdwpkkGSyhRIiGhJJyXSIh8gULwmOXOM8tZrvuCpSMixkYZfMVInbBCrX2iqv3U8eJgsv7u8KatnjHGsfoaoswnttthgLycnPwBhf+LjZF+aY6R7abAjkaMD2QxTFcRLLcLfVxSxKXMdEdap0WlOBL6qfKJXVqKeK0h8SnyF/FwP+u+dHmO0SiPHhLIqdOEMQYVcSGhWnUbvVIFGmVCvNZv+8v7+MuPWMQWOZSLIqVJDj2Ufu5tpUrQ7AULREQIf5GiljlUwAVxBTkpeUTFBfIa/8UDM7KIiykr1ricbJgzWiP6EAFTYZec7dIo0VuJZmts07tNs1iw3YcyEo5SiQZ70FmJPlrCbi8ddm1piun/Pz8CSgV4214FnKIS6z1hU7EGtXjWNCc62SxvI2erXegi1c7SwCGMYAJhdnhXnRSqDVUi4w/u9bw6m7zmcberldfVaQbiQxs0oLNEsWTsx51un7SUF3X7t8DuMLujkKgUl5bzpBP1NsgF6tXZ5Q7POFYn9V5RL6/UFJNVKljpdflwafQp6v7ZdjdIusV0vz00Hk6qEOBxtVowzYWhl2s95B4LbZNXYYLLDMcHlnoD3e0TDT+xVh+3IjdaYKGdoii3zMeuN1ydvW5pY7nGah8aZ62L8YKZoZ1yz9pieMfAeUdJCnzkfq/JSLrC1SbqH6a6uG6Oc55fGCeq0SIrNEnopiyEzbUJC4babbsW83CZuOlmut3ffNswsaKlr6F+bI3Fpig3Wp+i/SJ9XWJox1ki53BVtspYoqerDJF0kVOtsNJWaeWGGu8kFdhrmQfVieglkJQ6yMN5BZvM8oCf+wAnG+1hgYjperlTtmgZrNYjWOwJE72tqmg/ziJPq+nYw1k5fXURKJhntnWa0d/F7vW4xea71WQVCnZa4k5rFXSR1DnMvvmDPrwmf3Sfe5Qg6lcqDHSm70uoMahoWWZvuHiPuMKSNvbW95T5POCMTgYoF2hxj5vUeFezAmISAuR8bL373ejvMspU6SZ2QCecPyAsfucIF6DWVGfYYr5TXafFYUVL72IPstQES9rY1/iG4c7oOCSyAoEqLTZrlFfjRWepNkhnJQIZLXaqtcBazSLKVeimVKpN+97Wy7DFAj80x53GedRNFvmTZz1ovfdCS7OBIcJiZ3vBqtC+1VxTLbGmwwazMFpCXELCDu/aHe4uRPXTX3cJe2zzlgYFxHVS6UjJNnUtU9yVaN0wyB3SzZRIUDhGWbhvE7fXJrs0ybVTraJKJfVUJRoitj1mi6vn/CEG3lPaeaDDxEMJfOR9e6SL6SoqGm5NVekhGS7tD5Rsm8X+IcXdE1EZbC2UFvw/jEhzoec/AWfkjZOBxoGGAAAAAElFTkSuQmCC", Rc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAhCAYAAABX5MJvAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAARySURBVFhHxZjtU5RVGMb5N/oH+pgQqaiVNqVALOBiTuaIsuDU5EyUlZY09iEdE5nixd1lwQ1YYwbiRbIWUEN5WW2ZxkgCAReIhAQJ4iVakH3h6j6Hs7LLnmf32caZrplrlnnOnHP/9jn3fZ+zRFV9vA9mXTzMh8gZof2VLoG7THxyZ665LDPxscuF/Z8FWEfjWYmoPZmOqOI9L6I47QVls/F1Nvn7te1Sl6h06esvEYT2eXnwAIcB4f6PMDQ3Sh5UwTRBn7IFhYmxyN8VjfydG1Cw8xnyBhTGR+N80kawLxUpjGoIfXIcChNiUHYwCdZTH6LVcBYdpV/CdiEfHSVf4EbhaXybc4QHLHr1OT5HLYgqiPOaTTx4q/5zDNvbsfT3HGSan/gDPc0NaDx9DMbd28hbg0BkDg2hXQWofjcd99qvwuNaFuFCyzkzjc7KEpQfSoJRu00a2N8hIfTJmznAaFenWF69vG43ur+rRrlOQyDyPPFZEcJACWg5rMWQ7QexbORyP1qC3WLkELyiJADMUgg2yZC6BfavTbQFLrGkXCsrK+IvueYfjvMcYYn9uJzVQLA8qHk/A5ND/WIpiSi4o+Ma2oznMP2bQzyUq7+lEeb9uyjHKD98IH6WQrAS6zDl8depJK/bhfaSPJTuexmDthbxVK65B6O4/Gk29JrN6iAMqVtRdiARA9ebxBLKetD7C27XVPAgoeRefoS24nPUZ55VB6GnrajKTsd4X7dYIlgs82dGRzB25ydMDd+Da9EpRpTVVV8JI+UZixEWgrXe+hNv46/7w2J6sJyzM7BSsp2KfQoVumT8fvtHMaIsB22ZJTOVQKiBqYG4FAbCtbSIgdYraDxznN7aAfS1WMWIshy267Bk7VYJwStDh0nHXTFdWXNUfs1nT6D3aoN4oqxfrXV0TuxYPeDCQbAmVaFLwdCtG2K6smbHx9Ccm4OBtiviiVxejxs2cz4K4mOCAKQQrFGxds06HUtAmZYpEXua6tHwyRFqy8moPX6Y8uKWYuNamJ5E05mPUJS0KeBOwruoDIK5iO4Ll0++Q6fimFgmUM65WdqGHORtf5p6SiyKNBvxc51FEeJ+lx2Vb+3lXbh4D8VYByKFYMewae8O9FhrxDKB8no8WPjzIS/PKeqWUyODWJyfFaOBWlqYR6sxF3oOwM4QBuFvBQhm1t1qjmZg4u4dsVzk8no96LbW8q5qoLtFMMCqFSGY9SlxsH72QchyDaXhzjZcfDONtiFOGtznkBBsW9g+sn4wOdgnlg4vdvlhh1tV9n56A748UHZICGYfSPV7B6ki6jAzNsJLTqZl5z+Y6O+B/aIBF954Jewb8DksBDclFNsaVrrfEExnpYmO5+8xeLOF9xOH7Rp6my/RsZ6L8gwNb3hGrXIOrLdKCOE0dtmJ42VZQDfvArrmcydE08+AGF6qoRJQyeogmCWTIzMrT3+vjf2PEGtWD8EsXTwSPwkIZuniav2kIJilAdRYAYL9b0IaKJylQcI5GMCcFY9/ARsgfHzrCSGJAAAAAElFTkSuQmCC", Oc = "data:image/png;base64,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", Xc = "data:image/png;base64,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", Dc = "data:image/png;base64,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", Nc = "data:image/png;base64,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", Wc = "data:image/png;base64,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", jc = "data:image/png;base64,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", Zc = "data:image/png;base64,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", Gc = "data:image/png;base64,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", Hc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFgAAAAfCAQAAADJwcJrAAAAAmJLR0QA/4ePzL8AAAUASURBVFjD1dh9bJ1VGQDwp12/lm3ANuqFfcjoRANKJpQs0wE2MCGCDtQ00whubKDiooxMVExYhelsLJuuCkGnUTBGM2fMYGHiJmNuGQNqILpAFUm28jG1rGx2bG1p+/OPnr67t+uyy2Js+j5/3fec+97fPfec5znnxpVtu7tbnEo80/3UoVOJJ/fveuVUYse+i5+L6+Nxo+d6oq/sntg2isDbnb1mWPDfNFnko+b5lGU2OZK17NQ4gvF5U5qPA+8wWwyJ8RocBj0WHtf6/4wpPywAd7lZiRDOd6tGq9xmngohTLcL9LlpBMFn5YNfN0cIdf6gP+9rHNJoolDpIfCWuf8zQInxbw/8gwzc4wqh0r0F2MHrNZcIZbaC55Vnj8ilL9FitvCyu4TwT18X2sCrVghzHDQzved+m4RSDQ7iz84tGpw7Br5TKLE+D9mrQ2/26k0fECb5N1hWAF7iPL/z9DDgtWrcpU+lS/Hu9J4HbRc+64j5zrfdY8WDBxfdK8YKSzPe710uhHIX+VW6t99Zwu3g5WyMc7hWaNY6DPgRn7PBRjEM+DG/FMLpzikaXD0IHhixUh+3EysLOp3njUS+X6jSTkIemxIctWAY8E6NttrrHcOAn7FWCBUmFg9eG9vQb5pQlW5epFQIM9zhM2bYl417j5zwM3BfHniBicqE8KxmocpRNwltvimMR/0w4B/bo1JY5aWiwZMHwM8KJfZZ54KsqcKeNHL51y3CJ8HTQ6bEQCzXY5MW7XJCm5ds8YIOU12K5+y22wUJPF2bv9us1+Liwd+PbdggvAv025g1nuZ2e4dki58Ks0BH6lWl3tl5j7zScl+UE8K16tWrlxNylqQ40+WuEcKZlljug28jrU0aADenRQH7CjqUmufhPPBmoToVkNIRKByTvpeB5ybSP1LT3b6UJfW5fqsPbMnA/Qk8Ro0aU/MeWu592TKarkaZUKImywW5rPcZxglTVA+UXZNOCj5jAPwbYUYCH06QpejQmD18pmadfn7clBjMEgfcKISP6ADNSoVWzBfmoD39ZnsdNkEIe6wWdnhdtbDNd08OXpO36F5NHz03zeC/gG4PeX/qPtGF2aJ7siBL1GjSbaZqBzUqN8dRi4VWfR4UVnkrget06XBDAZifFAk+bU1eWrsvgR/OFt2n3eA6Xfija9K2aDCtNQ/JEhW6LXY9ThfCRhuEVlv9R5UXPZrAv7DBAx4vAD+q2+ziwKvzCkeNnkRemeFC+ETaXTyvLq9wXD0EXOJNX7BAv0oh/NojQquv+pdv6HSrdmG8Tg2W6TM9D/wd3/ZXO4sATxgEv2acsCrLBltcYYJQ5sOeyGbpFOGOVJrHDAEv0u9C79TtFmGqA74itFruR45Yb6F2YZGjWrTodGcBeJy9eosB35ttfu4RxthYkHXfyCsbR9QJubSklhZsfjod0m+FEL6syws6bTU2gS/DdQm8wzohrPaikjxwuIoiwOOOgXtdJZRbN+xpar/LhHJ/SpOjMi+J1apVm0pFCNPMV5sm1XvllKpVYbJZwsUphU1Wq0ytGuE9KRPNMu3k4Ka8DfyBtIG/2lNDxrlJdd4GvsslI3biGNt0giPSORZaoVGDjxmbxm1XKhg3j+ARaQj4xIfQFekQyua0PxiJqDO28YTH/Bt9yGzz3VZwzB/p/yWqvjXK/kgZdeCKldFg/aiJu1WsjPjaqIra/wK5cxOubJVgiQAAAABJRU5ErkJggg==", Bc = {
  "maplat.png": Tc,
  "all_right_reserved.png": Lc,
  "attr.png": Rc,
  "cc0.png": Oc,
  "cc_by-nc-nd.png": Xc,
  "cc_by-nc-sa.png": Dc,
  "cc_by-nc.png": Nc,
  "cc_by-nd.png": Wc,
  "cc_by-sa.png": jc,
  "cc_by.png": Zc,
  "odbl.png": Gc,
  "pd.png": Hc
}, Uc = ["http:", "https:"];
function jt(r) {
  if (typeof r != "string" || r === "") return;
  let i;
  try {
    i = new URL(r, window.location.href).protocol;
  } catch {
    return;
  }
  return Uc.includes(i) ? r : void 0;
}
function Ye(r) {
  if (typeof r == "string")
    return /^\s*data:image\//i.test(r) ? r : jt(r);
}
const Vc = () => {
  const r = window.navigator, i = r.userAgent.toLowerCase();
  try {
    let t;
    if (i.indexOf("chrome") != -1) {
      const e = r.languages[0] || r.browserLanguage || r.language || r.userLanguage;
      return e ? (t = e.split(";"), t[0]) : "";
    } else {
      const e = r.browserLanguage || r.language || r.userLanguage;
      return e ? (t = e.split(";"), t[0]) : "";
    }
  } catch {
    return "";
  }
}, Zn = {
  ja: {
    "control.zoom_in": "拡大",
    "control.zoom_out": "縮小",
    "control.home": "ホーム位置復帰",
    "control.compass": "回転解除",
    "control.compass_north": "北を上にする",
    "control.gps": "GPS位置取得",
    "control.trans": "地図透明度変更",
    "slider.base": "ベースマップ",
    "slider.overlay": "重ねる地図",
    "slider.prev": "前の地図",
    "slider.next": "次の地図",
    "menu.poi_candidates": "スポットを選ぶ",
    "control.marker_list": "マーカー一覧表示",
    "html.marker_list_title": "マーカー一覧表示",
    "html.close": "閉じる",
    "control.share": "共有",
    "html.share_title": "共有",
    "html.share_app_title": "このアプリを共有",
    "html.share_state_title": "現在の表示場所を共有",
    "html.share_copy": "コピー",
    "html.share_qr": "QR コード",
    "app.copy_toast": "クリップボードにコピーされました",
    // 範囲外・GPS のエラー（旧 assets/locales/ja/translation.json の app.* と同じ文言）
    "app.out_of_map": "地図範囲外",
    "app.out_of_map_area": "表示位置が地図範囲外です。地図標準位置に戻します。",
    "app.out_of_map_desc": "GPSの取得結果が地図範囲外です。GPS機能をオフにします。",
    // POI のリンクが安全でない URL で開かなかったとき（assets/locales/ja/translation.json の app.* と同じ文言）
    "app.cannot_open_link": "このリンクは開けません",
    "app.gps_error": "位置情報を使用できません",
    "app.user_gps_deny": "現在位置を表示するには、webブラウザの「位置情報の使用」を許可にして、QRコードかURLをもう一度読み込んでください。",
    "app.gps_miss": "システムは位置取得に失敗しました。GPS衛星の電波を受けやすい場所などで再度お試しください。",
    "app.gps_timeout": "位置取得処理がタイムアウトしました。GPS衛星の電波を受けやすい場所などで再度お試しください。",
    "control.border": "地図境界表示",
    "control.hide_marker": "マーカー非表示",
    "control.info": "地図情報表示",
    "html.author": "製作者",
    "html.createdAt": "作成時期",
    "html.era": "対象時期",
    "html.contributor": "所蔵者等",
    "html.mapper": "マッパー",
    "html.iiif": "IIIF の書誌",
    "html.iiif_manifest": "Manifest の書誌",
    "html.iiif_canvas": "コマの書誌",
    "html.iiif_copied_at": "写した日時",
    "html.iiif_manifest_link": "Manifest を開く",
    "html.license": "地図画像ライセンス",
    "html.dataLicense": "データライセンス",
    "html.attr": "地図画像帰属",
    "html.dataAttr": "データ帰属",
    "html.attributions": "表示中の地図の帰属表記",
    "html.reference": "典拠",
    "html.description": "説明",
    "html.cache_handle": "地図キャッシュサイズ",
    "html.cache_fetch": "一括ダウンロード",
    "html.cache_delete": "キャッシュ削除",
    "html.cache_cancel": "ダウンロード停止",
    "html.cache_processing": "計算中...",
    // ヘルプ（旧 assets/locales/ja/translation.json の control.help・html.help_* と同じ文言）
    "control.help": "ヘルプ表示",
    "html.app_loading_body": "アプリを読み込み中です...",
    "html.help_title": "Maplat ヘルプ",
    "html.help_using_maplat": "このサイトはオープンソース絵地図・古地図ビューア<a href='https://www.maplat.jp/' target='_blank'>Maplat</a>を使って構築されています。",
    "html.help_operation_title": "地図の操作方法",
    "html.help_operation_content": "地図の移動はPCの場合はマウスのドラッグ、スマートフォンの場合は指でのスワイプ動作で行います。<br>地図の拡大縮小は、PCでは左上の${plus.png} ${minus.png}ボタン、スマートフォンでは2本指でのピンチインアウトで行います。<br>スマートフォンでは2本指でのひねる操作により、地図の回転も行えます。<br>左上の${home.png}ボタンを使うと、表示中の地図のホームポジションに移動できます。<br>${compass.png}ボタン上に表示されているコンパスは、現在の北の方角を示しており、またこのボタンを押すことによって、地図の回転状態を正位置に戻すことができます。<br>地図の移動中は、地図の全体を表示するためボタンが消えますが、消えたボタンの表示を戻すには、しばらく待つか画面を1回クリックまたはタップしてください。",
    "html.help_selection_title": "地図の変更方法",
    "html.help_gps_title": "地図上への現在地表示",
    "html.help_gps_content": "${gps.png}ボタンを押すと、GPS機能が有効になり、ユーザの現在地が${bluedot.png}で地図上に表示されます。<br>もう一度ボタンを押すとGPS機能はオフになります。<br>もし、ユーザの現在地が表示中の地図上になかった場合、メッセージが表示され、GPS機能は自動的にオフになります。",
    "html.help_poi_title": "スポット情報の表示",
    "html.help_poi_content": "地図上に${defaultpin.png}のようなマーカーが表示される場合がありますが、これはスポット情報が提供されている場所になります。<br>マーカーをクリックまたはタップすると、スポットの情報が表示されます。",
    "html.help_etc_title": "その他",
    "html.help_etc_attr": "${attr.png}ボタン: 現在表示中の地図の作成者、所有者、ライセンス等各種情報が表示されます。",
    "html.help_etc_help": "${help.png}ボタン: このヘルプが表示されます。",
    "html.help_share_help": "${share.png}ボタン: SNS等へのアプリシェア画面が表示されます。",
    "html.help_etc_border": "${border.png}ボタン: 地図の境界を表示します。<br>パソコンではマウスオーバーで地図を選びクリックで地図を切り替え、スマホではワンクリックで地図を選びもう一度クリックで地図を切り替えます。",
    "html.help_etc_hide_marker": "${hide_marker.png}ボタン: マーカーの表示/非表示を切り替えます。",
    "html.help_etc_marker_list": "${marker_list.png}ボタン: マーカーのレイヤー毎に表示/非表示を切り替える画面が表示されます。",
    "html.help_etc_slider": "${slider.png}スライダ: 表示中の地図の透明度を変更して、ベースマップが透けて見えるようにします。<br>絵地図、古地図の表示中にのみ動作し、ベースマップ表示時は動作しません。"
  },
  en: {
    "control.zoom_in": "Zoom in",
    "control.zoom_out": "Zoom out",
    "control.home": "Return to Home Position",
    "control.compass": "Reset Rotation",
    "control.compass_north": "Turn North Up",
    "control.gps": "Acquire GPS Position",
    "control.trans": "Change Map Transparency",
    "slider.base": "Base maps",
    "slider.overlay": "Overlay maps",
    "slider.prev": "Previous map",
    "slider.next": "Next map",
    "menu.poi_candidates": "Choose a spot",
    "control.marker_list": "Marker list",
    "html.marker_list_title": "Marker list",
    "html.close": "Close",
    "control.share": "Share",
    "html.share_title": "Share",
    "html.share_app_title": "Share this app",
    "html.share_state_title": "Share current viewpoint",
    "html.share_copy": "Copy",
    "html.share_qr": "QR code",
    "app.copy_toast": "Copied to clipboard",
    // Out of map / GPS errors (same wording as the legacy assets/locales/en/translation.json app.*)
    "app.out_of_map": "Out of map",
    "app.out_of_map_desc": "The GPS position is outside the map. GPS turns off.",
    "app.out_of_map_area": "The displayed area is outside the map. Returning to the default position.",
    // A POI link was not opened because its URL is unsafe (same wording as assets/locales/en/translation.json app.*)
    "app.cannot_open_link": "This link cannot be opened",
    "app.gps_error": "Location information is not available",
    "app.user_gps_deny": 'To display the current location, please enable "Use Location" in your web browser and read the QR code or URL again.',
    "app.gps_miss": "The system could not acquire your location. Try again where GPS satellite signals are easier to receive.",
    "app.gps_timeout": "Acquiring the position timed out. Try again where GPS satellite signals are easier to receive.",
    "control.border": "Show Map Border",
    "control.hide_marker": "Hide Markers",
    "control.info": "Show Map Information",
    "html.author": "Author",
    "html.createdAt": "Created at",
    "html.era": "Era",
    "html.contributor": "Contributor",
    "html.mapper": "Mapper",
    "html.iiif": "IIIF bibliographic data",
    "html.iiif_manifest": "Manifest",
    "html.iiif_canvas": "Canvas",
    "html.iiif_copied_at": "Copied at",
    "html.iiif_manifest_link": "Open the manifest",
    "html.license": "Map image license",
    "html.dataLicense": "Data license",
    "html.attr": "Map image attribution",
    "html.dataAttr": "Data attribution",
    "html.attributions": "Attributions of the displayed maps",
    "html.reference": "Source",
    "html.description": "Description",
    "html.cache_handle": "Size of map cache",
    "html.cache_fetch": "Bulk download",
    "html.cache_delete": "Clear cache",
    "html.cache_cancel": "Cancel download",
    "html.cache_processing": "Processing...",
    // Help（same wording as the legacy assets/locales/en/translation.json control.help / html.help_*）
    "control.help": "Show Help",
    "html.app_loading_body": "Loading app...",
    "html.help_title": "Maplat Help",
    "html.help_using_maplat": "This site is built with open-source pictorial and historical map viewer <a href='https://www.maplat.jp/' target='_blank'>Maplat</a>.",
    "html.help_operation_title": "How to operate the map",
    "html.help_operation_content": "Move the map by dragging with a mouse on a PC or swiping with a finger on a smartphone.<br>Zoom the map with the upper-left ${plus.png} ${minus.png} buttons on a PC, or by pinching in and out with two fingers on a smartphone.<br>On a smartphone, rotate the map by twisting two fingers.<br>Use the upper-left ${home.png} button to return to the home position of the displayed map.<br>The compass on the ${compass.png} button points north; press it to reset the map rotation.<br>While the map is moving, the buttons disappear to show the entire map. To bring them back, wait a moment or click or tap the screen once.",
    "html.help_selection_title": "How to change the map",
    "html.help_selection_content": "Two sliders with thumbnails like ${overlay.png} appear at the lower left and lower right of the screen. Use them to select a map to display.<br>Slide to choose a map, then click its thumbnail to switch to it.<br>The lower-left slider selects base maps (accurate maps); the lower-right slider selects historical or illustrated maps.",
    "html.help_gps_title": "Showing current position on the map",
    "html.help_gps_content": "When you press the ${gps.png} button, the GPS function turns on and the user's current location is displayed on the map as ${bluedot.png}. <br>If you press the button again, the GPS function turns off. <br>If the user's current location is not on the map being displayed, a message will be displayed and the GPS function will be turned off automatically.",
    "html.help_poi_title": "Showing spot information",
    "html.help_poi_content": "Markers such as ${defaultpin.png} may appear on the map where spot information is available.<br>Click or tap a marker to display the spot information.",
    "html.help_etc_title": "Others",
    "html.help_etc_attr": "${attr.png} Button: Shows information about the currently displayed map, such as its creator, contributor, and license.",
    "html.help_etc_help": "${help.png} Button: Shows this help.",
    "html.help_share_help": "${share.png} Button: Opens a screen for sharing this app on social networks and elsewhere.",
    "html.help_etc_border": "${border.png} Button: Shows map borders.<br>On a PC, hover over a map to select it and click to switch; on a smartphone, tap once to select a map and tap again to switch.",
    "html.help_etc_hide_marker": "${hide_marker.png} Button: Toggles marker visibility.",
    "html.help_etc_marker_list": "${marker_list.png} Button: Opens a screen for showing or hiding each marker layer.",
    "html.help_etc_slider": "${slider.png} Slider: Adjusts the transparency of the displayed map so that the base map can be seen through it.<br>This works only while historical or illustrated maps are displayed; it does not work with base maps."
  }
}, qr = {
  ja: {
    "html.help_etc_border": "<img src='${border.png}'>ボタン: 地図の境界を表示します。<br>パソコンではマウスオーバーで地図を選びクリックで地図を切り替え、スマホではワンクリックで地図を選びもう一度クリックで地図を切り替えます。"
  },
  en: {
    "html.help_etc_border": "<img src='${border.png}'> Button: Shows map borders.<br>On a PC, hover over a map to select it and click to switch; on a smartphone, tap once to select a map and tap again to switch."
  },
  de: {
    "control.zoom_in": "Vergrößern",
    "control.zoom_out": "Verkleinern",
    "control.compass_north": "Norden nach oben drehen",
    "slider.base": "Basiskarten",
    "slider.overlay": "Historische Karten / Überlagerungen",
    "slider.prev": "Vorherige Karte",
    "slider.next": "Nächste Karte",
    "menu.poi_candidates": "Standort wählen",
    "html.share_qr": "QR-Code",
    "html.help_etc_border": "<img src='${border.png}'>-Taste: Zeigt die Kartenrandlinien an.<br>Auf einem PC wählen Sie eine Karte mit der Maus aus und wechseln sie durch einen Klick, auf einem Smartphone wählen Sie eine Karte durch einen Klick aus und wechseln sie durch einen weiteren Klick."
  },
  es: {
    "control.zoom_in": "Acercar",
    "control.zoom_out": "Alejar",
    "control.compass_north": "Orientar al norte",
    "slider.base": "Mapas base",
    "slider.overlay": "Mapas históricos / superposiciones",
    "slider.prev": "Mapa anterior",
    "slider.next": "Mapa siguiente",
    "menu.poi_candidates": "Elegir un lugar",
    "html.share_qr": "Código QR",
    "html.help_etc_border": "Botón <img src='${border.png}'>: muestra los límites de los mapas.<br>En un PC, seleccione un mapa pasando el ratón por encima y cambie de mapa con un clic; en un teléfono, seleccione un mapa con un clic y cambie de mapa con otro clic."
  },
  fr: {
    "control.zoom_in": "Zoom avant",
    "control.zoom_out": "Zoom arrière",
    "control.compass_north": "Orienter vers le nord",
    "slider.base": "Fonds de carte",
    "slider.overlay": "Cartes historiques / superpositions",
    "slider.prev": "Carte précédente",
    "slider.next": "Carte suivante",
    "menu.poi_candidates": "Choisir un lieu",
    "html.share_qr": "Code QR",
    "html.help_etc_border": "Bouton <img src='${border.png}'> : affiche les limites des cartes.<br>Sur PC, sélectionnez une carte en la survolant avec la souris puis changez de carte d'un clic ; sur smartphone, sélectionnez une carte d'un premier clic et changez de carte d'un second clic."
  },
  id: {
    "control.zoom_in": "Perbesar",
    "control.zoom_out": "Perkecil",
    "control.compass_north": "Arahkan ke utara",
    "slider.base": "Peta dasar",
    "slider.overlay": "Peta lama / lapisan",
    "slider.prev": "Peta sebelumnya",
    "slider.next": "Peta berikutnya",
    "menu.poi_candidates": "Pilih tempat",
    "html.share_qr": "Kode QR",
    "html.help_etc_border": "Tombol <img src='${border.png}'>: menampilkan garis batas peta.<br>Di PC, pilih peta dengan mengarahkan mouse lalu klik untuk mengganti peta; di ponsel, pilih peta dengan satu ketukan dan ganti peta dengan ketukan berikutnya."
  },
  ko: {
    "control.zoom_in": "확대",
    "control.zoom_out": "축소",
    "control.compass_north": "북쪽을 위로",
    "slider.base": "베이스맵",
    "slider.overlay": "고지도 / 중첩 지도",
    "slider.prev": "이전 지도",
    "slider.next": "다음 지도",
    "menu.poi_candidates": "스팟 선택",
    "html.share_qr": "QR 코드",
    "html.help_etc_border": "<img src='${border.png}'>버튼: 지도의 경계를 표시합니다.<br>PC에서는 마우스를 올려 지도를 선택하고 클릭하여 전환합니다. 스마트폰에서는 한 번 탭하여 지도를 선택하고, 다시 탭하여 전환합니다."
  },
  th: {
    "control.zoom_in": "ซูมเข้า",
    "control.zoom_out": "ซูมออก",
    "control.compass_north": "หันทิศเหนือขึ้นด้านบน",
    "slider.base": "แผนที่พื้นฐาน",
    "slider.overlay": "แผนที่เก่า / แผนที่ซ้อนทับ",
    "slider.prev": "แผนที่ก่อนหน้า",
    "slider.next": "แผนที่ถัดไป",
    "menu.poi_candidates": "เลือกสถานที่",
    "html.share_qr": "คิวอาร์โค้ด",
    "html.help_etc_border": "ปุ่ม <img src='${border.png}'>: แสดงเส้นขอบเขตของแผนที่<br>บนคอมพิวเตอร์ ให้เลื่อนเมาส์ไปเลือกแผนที่แล้วคลิกเพื่อสลับ ส่วนบนสมาร์ตโฟน ให้แตะหนึ่งครั้งเพื่อเลือกแผนที่ แล้วแตะอีกครั้งเพื่อสลับ"
  },
  vi: {
    "control.zoom_in": "Phóng to",
    "control.zoom_out": "Thu nhỏ",
    "control.compass_north": "Hướng bắc lên trên",
    "slider.base": "Bản đồ nền",
    "slider.overlay": "Bản đồ cũ / lớp phủ",
    "slider.prev": "Bản đồ trước",
    "slider.next": "Bản đồ tiếp theo",
    "menu.poi_candidates": "Chọn điểm đánh dấu",
    "html.share_qr": "Mã QR",
    "html.help_etc_border": "Nút <img src='${border.png}'>: Hiển thị đường viền bản đồ.<br>Trên máy tính, chọn bản đồ bằng cách di chuột và nhấp để chuyển bản đồ, trên điện thoại, nhấp một lần để chọn và nhấp lần nữa để chuyển."
  },
  zh: {
    "control.zoom_in": "放大",
    "control.zoom_out": "缩小",
    "control.compass_north": "正北朝上",
    "slider.base": "底图",
    "slider.overlay": "历史地图 / 叠加地图",
    "slider.prev": "上一张地图",
    "slider.next": "下一张地图",
    "menu.poi_candidates": "选择场所",
    "html.share_qr": "二维码",
    "html.help_etc_border": "<img src='${border.png}'>按钮：显示地图边界。<br>在电脑上用鼠标移到想看的地图上并点击切换；在手机上先点击选择地图，再次点击即可切换。"
  },
  "zh-TW": {
    "control.zoom_in": "放大",
    "control.zoom_out": "縮小",
    "control.compass_north": "北方朝上",
    "slider.base": "底圖",
    "slider.overlay": "古地圖 / 疊圖",
    "slider.prev": "上一張地圖",
    "slider.next": "下一張地圖",
    "menu.poi_candidates": "選擇景點",
    "html.share_qr": "QR 碼",
    "html.help_etc_border": "<img src='${border.png}'>按鈕：顯示地圖邊界線。<br>在電腦上以滑鼠移到想看的地圖上並點擊切換；在手機上先點一下選擇地圖，再點一下即可切換。"
  }
}, dA = {
  de: () => import("./translation-Btntc7C8.js"),
  en: () => import("./translation-DZcoj4OV.js"),
  es: () => import("./translation-v5drVM8h.js"),
  fr: () => import("./translation-DmNXVQfQ.js"),
  id: () => import("./translation-VMK1Dw2M.js"),
  ja: () => import("./translation-B_s7hSRl.js"),
  ko: () => import("./translation-BMrNWiSc.js"),
  th: () => import("./translation-CJrqgByM.js"),
  vi: () => import("./translation-Bo8lzKsU.js"),
  zh: () => import("./translation-D5w742Iu.js"),
  "zh-TW": () => import("./translation-jXOdna8Z.js")
};
function uA(r, i, t) {
  if (!(r == null || typeof r != "object"))
    for (const [e, n] of Object.entries(r)) {
      const o = i ? `${i}.${e}` : e;
      n != null && typeof n == "object" ? uA(n, o, t) : typeof n == "string" && (t[o] = n);
    }
}
function mA(r) {
  const i = r.split("-")[0];
  return { ...Zn.en, ...Zn[r] ?? Zn[i] ?? {} };
}
function fA(r) {
  const i = r.split("-")[0];
  return {
    ...qr.en ?? {},
    ...qr[i] ?? {},
    ...qr[r] ?? {}
  };
}
function Qr(r, i) {
  return { ...mA(r), ...i, ...fA(r) };
}
function Ea(r) {
  const i = r.toLowerCase();
  return Object.keys(dA).find((t) => t.toLowerCase() === i);
}
function Yc(r) {
  const i = bA(r || "en"), t = Ea(i);
  if (t) return t;
  const e = i.split("-")[0];
  return Ea(e) ?? "en";
}
async function Ta(r) {
  const i = dA[r];
  if (!i) return null;
  try {
    const t = await i(), e = t?.default ?? t, n = {};
    return uA(e, "", n), n;
  } catch (t) {
    return console.warn(
      `<maplat-ui>: failed to load translations for "${r}".`,
      t
    ), null;
  }
}
const La = /* @__PURE__ */ new Map();
function Fc(r) {
  const i = Yc(r), t = La.get(i);
  if (t) return t;
  const e = (async () => {
    const n = await Ta(i);
    if (n) return Qr(i, n);
    if (i !== "en") {
      console.warn(
        `<maplat-ui>: falling back to English translations for "${i}".`
      );
      const o = await Ta("en");
      if (o) return Qr("en", o);
    }
    return console.warn(
      "<maplat-ui>: failed to load the English translations; using the built-in English strings."
    ), Qr("en", {});
  })();
  return La.set(i, e), e;
}
function bA(r) {
  const i = r.toLowerCase();
  return i === "zh-hk" || i === "zh-hant" ? "zh-TW" : r;
}
function vA(r, i, t = 0) {
  return t > 10 || !r.includes("$t(") ? r : r.replace(/\$t\(\s*([\w.-]+)\s*\)/g, (e, n) => {
    const o = i[n];
    return typeof o == "string" ? vA(o, i, t + 1) : e;
  });
}
function Jc(r, i) {
  return r.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (t, e) => {
    const n = e.split(".").reduce(
      (o, g) => o?.[g],
      i
    );
    return n === void 0 ? t : String(n);
  });
}
function Kc(r, i, t, e) {
  const n = e ?? { ...mA(r), ...fA(r) }, o = n[i] ?? Zn.en[i] ?? i, g = vA(o, n);
  return t ? Jc(g, t) : g;
}
function qc(r, i) {
  if (r == null) return;
  if (typeof r == "string") return r;
  if (typeof r != "object") return String(r);
  let t, e;
  for (const [n, o] of Object.entries(r))
    if (o) {
      if (n === i) return o;
      n === "en" && e === void 0 && (e = o), t === void 0 && (t = o);
    }
  return e ?? t ?? "";
}
function Qc(r, i) {
  const t = r.split("/"), e = i.split("/");
  t.pop();
  for (let n = 0; n < e.length; n++)
    e[n] != "." && (e[n] == ".." ? t.pop() : t.push(e[n]));
  return t.join("/");
}
const Ra = /* @__PURE__ */ new Map(), Oa = /* @__PURE__ */ new Set();
function _r(r) {
  try {
    return new URL(r, document.baseURI).href;
  } catch {
    return r;
  }
}
function Xa(r, i) {
  const t = document.createElement("link");
  for (const [e, n] of Object.entries(i)) t.setAttribute(e, n);
  r.appendChild(t);
}
function _c(r, i) {
  return typeof navigator > "u" || !navigator.serviceWorker ? (console.error(
    "Failed to register service worker:",
    "Service worker is not supported"
  ), Promise.resolve(void 0)) : navigator.serviceWorker.register(r, { scope: i }).then(
    (t) => t,
    (t) => {
      console.error("Failed to register service worker:", t);
    }
  );
}
function $c(r) {
  if (typeof document > "u") return;
  const i = jt(r.manifest), e = r.worker === null ? null : jt(r.worker ?? "./service-worker.js"), n = jt(r.scope ?? "./");
  if (i === void 0 || e === void 0 || n === void 0) {
    console.warn(
      "<maplat-ui>: PWA was not enabled because pwa-manifest / pwa-worker / pwa-scope is not an http(s) or relative URL."
    );
    return;
  }
  const o = document.head;
  o && !o.querySelector('link[rel="manifest"]') && Xa(o, { rel: "manifest", href: i });
  let g;
  if (e === null)
    g = Promise.resolve(void 0);
  else {
    const C = `${_r(e)}|${_r(n)}`, h = Ra.get(C);
    g = h ?? _c(e, n), h || Ra.set(C, g);
  }
  const c = _r(i);
  return o && !o.querySelector('link[rel="apple-touch-icon"]') && !Oa.has(c) && (Oa.add(c), fetch(i).then((C) => C.json()).then((C) => {
    if (Array.isArray(C?.icons))
      for (const h of C.icons) {
        if (!h || jt(h.src) === void 0) continue;
        const f = jt(Qc(i, h.src));
        if (f === void 0) continue;
        const w = {
          rel: "apple-touch-icon",
          href: f
        };
        typeof h.sizes == "string" && (w.sizes = h.sizes), Xa(o, w);
      }
  }).catch((C) => {
    console.error("Failed to fetch PWA manifest:", C);
  })), g;
}
const Da = /* @__PURE__ */ new WeakMap();
function Na(r, i = 2, t = {}) {
  const e = t.omitMark ?? "…", n = t.minimizeClass ?? "minimize", o = t.measure ?? ((M) => M.offsetHeight), g = t.text ?? Da.get(r) ?? r.textContent ?? "";
  Da.set(r, g), r.classList.remove(n);
  const c = Array.from(g), C = document.createDocumentFragment(), h = [];
  for (const M of c) {
    const y = document.createElement("span");
    y.textContent = M, C.appendChild(y), h.push(y);
  }
  const f = document.createElement("span");
  if (f.className = "omit-mark", f.textContent = e, C.appendChild(f), r.textContent = "", r.appendChild(C), i <= 0 || h.length === 0) return;
  if (h.length === 1) {
    h[0].style.display = "", f.style.display = "none";
    return;
  }
  h[0].style.display = "";
  for (let M = 1; M < h.length; M++) h[M].style.display = "none";
  f.style.display = "";
  let w = o(r), z = !1, L = 0, N = -1;
  for (let M = 1; M < h.length; M++) {
    h[M].style.display = "";
    const y = o(r);
    if (y > w && (z ? (w = y, L++) : (z = !0, r.classList.add(n))), L >= i) {
      N = M - 2;
      break;
    }
    if (M >= h.length - 1) {
      f.style.display = "none";
      return;
    }
  }
  if (!(N < 0))
    for (let M = Math.max(0, N); M < h.length; M++)
      h[M].style.display = "none";
}
function $r(r, i) {
  const t = i || ".";
  return r.match(/\//) ? r : `${t}/${r}`;
}
function tI(r) {
  try {
    const i = getComputedStyle(r).transform;
    if (!i || i === "none") return 0;
    const t = window.DOMMatrixReadOnly;
    return t ? new t(i).m41 : null;
  } catch {
    return null;
  }
}
const Wa = "http://www.w3.org/2000/svg", eI = "M0.38296 20.0762C0.111788 19.805 0.111788 19.3654 0.38296 19.0942L9.19758 10.2796L0.38296 1.46497C0.111788 1.19379 0.111788 0.754138 0.38296 0.482966C0.654131 0.211794 1.09379 0.211794 1.36496 0.482966L10.4341 9.55214C10.8359 9.9539 10.8359 10.6053 10.4341 11.007L1.36496 20.0762C1.09379 20.3474 0.654131 20.3474 0.38296 20.0762Z", G = {
  /** この幅（px）**以下**を「狭い」とし、1.4 枚・gap 10 にする */
  breakpointWidth: 480,
  /** 狭いときの枚数・間隔 */
  perViewNarrow: 1.4,
  gapNarrow: 10,
  /** 広いときの枚数・間隔 */
  perViewWide: 2,
  gapWide: 15,
  /** 1 枚動かすアニメの時間 */
  stepDurationMs: 250,
  /** 遠い地図を続けて動かすときの 1 枚あたりの時間 */
  farStepDurationMs: 160,
  /** アニメの曲線 */
  easing: "cubic-bezier(.22,.61,.36,1)",
  /** `transitionend` が来ない環境で確定するまでの余裕（ms。遷移がまだ走っていれば、その終わりを待つ） */
  transitionFallbackSlackMs: 120,
  /**
   * 保険の時間が来ても遷移が**進んでいる**（`getAnimations()` の進み具合が前回と違う）あいだは待ち直す、
   * その回数の上限（止まった遷移・観測できない環境では 1 回だけ待って確定する。待ち続ける経路は無い）
   */
  transitionWatchMaxRounds: 8,
  /** 払いの速さのしきい値（px/ms） */
  thresholdVelocity: 0.35,
  /** drag で 1 枚を超えた分に掛ける抵抗 */
  dragResistance: 0.3,
  /** drag で指に追従させる枚数の上限 */
  dragLimitCards: 1,
  /** これ未満の移動はクリックとして扱う（px） */
  clickThresholdPx: 2,
  /** 矢印の連打で積む枚数の上限 */
  maxQueuedSteps: 3,
  /** 見出しの行数 */
  labelLines: 2,
  /** 1 画面に置くスロットの数 */
  slotCount: 5,
  /** カードの高さ（旧 CSS と同じ 60px。見た目の基準は baseline JSON） */
  cardHeightPx: 60
};
function ws(r, i) {
  if (!Number.isFinite(r) || !Number.isFinite(i) || i <= 0) return 0;
  const t = (r % i + i) % i;
  return t === 0 ? 0 : t;
}
function iI(r) {
  return r <= G.breakpointWidth ? { perView: G.perViewNarrow, gap: G.gapNarrow } : { perView: G.perViewWide, gap: G.gapWide };
}
function nI(r, i, t) {
  return !(i > 0) || !(r > 0) ? 0 : Math.max(0, (r - t * (i - 1)) / i);
}
function rI(r, i, t) {
  return r / 2 - (2.5 * i + 2 * t);
}
function sI(r, i, t) {
  return ws(r + i, t);
}
function ja(r, i, t) {
  const e = (n) => n > 0 ? -1 : 1;
  return i > 0 && Math.abs(r) >= i / 2 ? e(r) : Math.abs(t) > G.thresholdVelocity ? e(t) : 0;
}
const Za = () => typeof performance < "u" ? performance.now() : Date.now();
class oI {
  element;
  #a;
  #t;
  #A = 0;
  #c = null;
  #s = [];
  #e = [];
  #o = [];
  #l = [];
  // サムネイルの `<img>` か、プレースホルダ（呼び手から渡された `span.thumb.none`）
  #i = [];
  #R;
  #I;
  #r;
  #f;
  #b;
  #v;
  #Z = G.perViewWide;
  #G = G.gapWide;
  #y = 0;
  #d = 0;
  #w = 0;
  #u = [];
  #x = !1;
  /** 動いているキューが空になるまで解決しない Promise（`step()` がすぐ解決しないように） */
  #O = null;
  #z = null;
  /** 読み込みに失敗したサムネイルの URL（プレースホルダで出す） */
  #X = /* @__PURE__ */ new Set();
  /** 続きを呼ぶときも「遠い地図の連続」の時間を使うか（積める数を超えた移動の続き） */
  #P = !1;
  #k = !1;
  #C = null;
  #M = !1;
  #g = !0;
  #n = !1;
  #D = null;
  #H = (i) => this.#at(i);
  // サムネイルの画像などをブラウザが drag し始めると pointercancel でスライダーの drag が取り消される
  #B = (i) => i.preventDefault();
  #U = (i) => this.#At(i);
  #E = (i) => this.#lt(i);
  #V = (i) => this.#ct(i);
  #Y = () => this.refresh();
  constructor(i) {
    this.#a = i, this.#t = i.items ? [...i.items] : [], this.#R = { ...i.navLabels ?? {} }, this.#A = 0;
    const t = document.createElement("div");
    t.className = "map-slider", t.setAttribute("part", "map-slider"), t.setAttribute("role", "group"), t.setAttribute("aria-label", i.groupLabel || ""), t.dataset.kind = i.kind, t.tabIndex = 0, typeof window < "u" && window.matchMedia?.("(pointer: coarse)")?.matches && t.classList.add("touch"), this.#I = document.createElement("div"), this.#I.className = "map-slider-viewport", this.#r = document.createElement("div"), this.#r.className = "map-slider-track", this.#I.appendChild(this.#r), this.#f = this.#F("prev"), this.#b = this.#F("next"), this.#v = document.createElement("span"), this.#v.className = "map-slider-live", this.#v.setAttribute("aria-live", "polite"), t.append(this.#f, this.#I, this.#b, this.#v), this.element = t, this.#f.addEventListener("click", () => {
      this.step(-1);
    }), this.#b.addEventListener("click", () => {
      this.step(1);
    }), t.addEventListener("keydown", this.#V), this.#I.addEventListener("pointerdown", this.#H), this.#I.addEventListener("dragstart", this.#B), this.#K(), this.#c = this.#h(), this.refresh(), this.#S(), this.#T(), this.#et();
  }
  // ───────────────────────── 公開 API
  get activeMapID() {
    return this.#h();
  }
  /** この行（背景／重ねる）にその地図があるか（要素が「無い側の選択を外す」ために使う） */
  hasMap(i) {
    return i !== null && this.#t.some((t) => t.mapID === i);
  }
  get selectedMapID() {
    return this.#c;
  }
  get activeIndex() {
    return this.#A;
  }
  get count() {
    return this.#t.length;
  }
  /**
   * この行の地図の一覧（設定ファイルの sources の順）。
   * @internal 旧 UI の地図切り替えの facade（`src/legacy/legacy_swiper.ts`）が `slides` を組み立てるために読む。
   *   移行期の逃げ道（互換層だけが使う）。層 B の公開面には数えない。
   */
  get items() {
    return this.#t;
  }
  /**
   * 動いているか（キューを流している・1 歩のアニメの途中・drag の途中）。
   * @internal テスト専用（旧 e2e の `swiper.animating` の移植先）。
   */
  get animating() {
    return this.#x || this.#k || this.#C !== null;
  }
  get perView() {
    return this.#Z;
  }
  get gap() {
    return this.#G;
  }
  get slots() {
    return this.#s.map((i, t) => ({
      offset: i,
      mapID: this.#o[t]?.mapID ?? "",
      element: this.#e[t]
    }));
  }
  setItems(i) {
    if (this.#n) return;
    const t = this.#h();
    this.#t = i ? [...i] : [], this.#X.clear();
    const e = t ? this.#t.findIndex((g) => g.mapID === t) : -1;
    this.#A = e >= 0 ? e : 0, this.#e.length === this.#J() || this.#K(), this.#c !== null && this.#t.some((g) => g.mapID === this.#c) || (this.#c = this.#h()), this.refresh(), this.#S(), this.#N(), this.#T();
  }
  /**
   * 地図の選択を合わせる。隣は 1 枚のアニメ、遠いは飛ばさずに 1 枚ずつ連続で動かす。
   * 中央は変わらないので `.selected` だけ先に合わせる（押した直後の見た目のため）。
   */
  setSelectedMapID(i, t = !0) {
    if (this.#n) return;
    if (i === null) {
      this.#m(null);
      return;
    }
    const e = this.#t.findIndex((n) => n.mapID === i);
    if (!(e < 0)) {
      if (!t) {
        this.#A = e, this.#m(i), this.#S(), this.#W(), this.#T(), this.#j();
        return;
      }
      if (this.#x || this.#k) {
        this.#z = i, this.#P = !1, this.#m(i);
        return;
      }
      this.#m(i), this.#Q(e);
    }
  }
  /** `.selected` だけを更新する（中央は動かさない。クリック直後の見た目用） */
  setSelectedOnly(i) {
    this.#n || this.#m(i);
  }
  /** 1 枚動かし、確定まで待つ（矢印・押した直後の移動用。地図は変えない） */
  step(i) {
    return this.#L(i);
  }
  setShowBorder(i) {
    this.element.classList.toggle("show-border", !!i);
  }
  setGroupLabel(i) {
    this.element.setAttribute("aria-label", i || "");
  }
  /** 矢印の読み上げ名を差し替える（言語の切り替えで呼ぶ） */
  setNavLabels(i) {
    this.#R = { ...i }, this.#f.setAttribute("aria-label", i.prev ?? "前の地図"), this.#b.setAttribute("aria-label", i.next ?? "次の地図");
  }
  setEnabled(i) {
    this.#g = !!i, this.element.classList.toggle("disabled", !this.#g), this.element.setAttribute(
      "aria-disabled",
      this.#g ? "false" : "true"
    ), !this.#g && this.#C && this.#$(-1, 0);
  }
  /** 幅・言語・画像の再計算（active は動かさない） */
  refresh() {
    if (!this.#n) {
      this.#W();
      for (let i = 0; i < this.#l.length; i++) {
        const t = this.#o[i];
        if (!t) continue;
        const e = this.#p(t);
        this.#e[i].setAttribute("aria-label", e);
        const n = this.#i[i];
        n && n.tagName !== "IMG" && (n.textContent = Array.from(e)[0] ?? "?"), Na(this.#l[i], G.labelLines, { text: e });
      }
    }
  }
  destroy() {
    this.#n || (this.#n = !0, this.#u = [], this.#tt(), this.#D?.disconnect(), this.#D = null, window.removeEventListener("resize", this.#Y), this.element.removeEventListener("keydown", this.#V), this.#I.removeEventListener("pointerdown", this.#H), this.#I.removeEventListener("dragstart", this.#B), this.element.remove());
  }
  // ───────────────────────── 組み立て
  #F(i) {
    const t = document.createElement("button");
    t.type = "button", t.className = `map-slider-nav ${i}`, t.setAttribute(
      "part",
      i === "prev" ? "map-slider-prev" : "map-slider-next"
    );
    const e = this.#R;
    t.setAttribute(
      "aria-label",
      i === "prev" ? e.prev ?? "前の地図" : e.next ?? "次の地図"
    );
    const n = document.createElementNS(Wa, "svg");
    n.setAttribute("class", "map-slider-nav-icon"), n.setAttribute("viewBox", "0 0 11 20"), n.setAttribute("aria-hidden", "true"), n.setAttribute("focusable", "false");
    const o = document.createElementNS(Wa, "path");
    return o.setAttribute("d", eI), o.setAttribute("fill", "currentColor"), n.appendChild(o), t.appendChild(n), t;
  }
  #J() {
    return this.#t.length >= 2 ? G.slotCount : 1;
  }
  #K() {
    const i = this.#J();
    this.#r.textContent = "", this.#s = [], this.#e = [], this.#o = [], this.#l = [], this.#i = [];
    const t = Math.floor(i / 2);
    for (let n = 0; n < i; n++) {
      const o = document.createElement("button");
      o.type = "button", o.className = "map-slide", o.setAttribute("part", "map-slide"), o.tabIndex = -1;
      const g = document.createElement("span");
      g.className = "map-slide-label", g.setAttribute("part", "map-slide-label"), o.appendChild(g);
      const c = n;
      o.addEventListener(
        "click",
        (C) => this.#ot(C, c)
      ), this.#r.appendChild(o), this.#s.push(n - t), this.#e.push(o), this.#o.push(null), this.#l.push(g), this.#i.push(null);
    }
    const e = i === 1;
    this.element.classList.toggle("single-map", e);
    for (const n of [this.#f, this.#b])
      n.hidden = e, n.setAttribute("aria-hidden", e ? "true" : "false");
  }
  #p(i) {
    return this.#a.translate(i.label);
  }
  #S() {
    for (let i = 0; i < this.#e.length; i++) {
      const t = this.#s[i], e = this.count > 0 ? this.#t[sI(this.#A, t, this.count)] : null, n = (this.#o[i]?.mapID ?? null) !== (e?.mapID ?? null);
      this.#o[i] = e;
      const o = this.#e[i];
      if (!e) {
        o.dataset.mapId = "", o.setAttribute("aria-label", ""), this.#l[i].textContent = "", this.#i[i]?.remove(), this.#i[i] = null, o.classList.remove("has-envelope"), o.style.removeProperty("--maplat-envelope-color");
        continue;
      }
      o.dataset.mapId = e.mapID, o.setAttribute("aria-label", this.#p(e));
      const g = Ye(e.thumbnail ?? void 0), c = g && !this.#X.has(g) ? g : void 0;
      if (c) {
        const C = this.#i[i];
        if (!C || C.tagName !== "IMG") {
          C?.remove();
          const h = document.createElement("img");
          h.className = "map-slide-thumb", h.setAttribute("part", "map-slide-thumb"), h.alt = "", h.draggable = !1, h.addEventListener("error", () => {
            const f = h.getAttribute("src");
            !f || this.#n || (this.#X.add(f), this.#i.includes(h) && this.#S());
          }), o.insertBefore(h, this.#l[i]), this.#i[i] = h;
        }
        this.#i[i].setAttribute("src", c);
      } else if (this.#a.placeholder) {
        const C = this.#i[i];
        if (C && C.tagName !== "IMG" && !n)
          C.textContent = Array.from(this.#p(e))[0] ?? "?";
        else {
          C?.remove();
          const h = this.#a.placeholder(this.#p(e));
          o.insertBefore(h, this.#l[i]), this.#i[i] = h;
        }
      } else this.#i[i] && (this.#i[i].remove(), this.#i[i] = null);
      e.envelopeColor ? (o.style.setProperty("--maplat-envelope-color", e.envelopeColor), o.classList.add("has-envelope")) : (o.style.removeProperty("--maplat-envelope-color"), o.classList.remove("has-envelope")), n && (this.#l[i].textContent = this.#p(e), Na(this.#l[i], G.labelLines, {
        text: this.#p(e)
      }));
    }
    this.#N();
  }
  #N() {
    for (let i = 0; i < this.#e.length; i++) {
      const t = this.#o[i], e = !!t && this.#c !== null && t.mapID === this.#c;
      this.#e[i].classList.toggle("selected", e), this.#e[i].setAttribute(
        "part",
        e ? "map-slide map-slide-selected" : "map-slide"
      ), e ? this.#e[i].setAttribute("aria-current", "true") : this.#e[i].removeAttribute("aria-current");
    }
  }
  #T() {
    const i = this.#o[this.#s.indexOf(0)];
    this.#v.textContent = i ? this.#p(i) : "";
  }
  #h() {
    return this.count > 0 ? this.#t[this.#A]?.mapID ?? null : null;
  }
  #m(i) {
    this.#c = i, this.#N();
  }
  #et() {
    const i = window.ResizeObserver;
    if (!i) {
      window.addEventListener("resize", this.#Y);
      return;
    }
    const t = new i(() => this.refresh());
    t.observe(this.element), this.#D = t;
  }
  // ───────────────────────── 位置
  #W() {
    const i = this.element.clientWidth || 0, { perView: t, gap: e } = iI(
      typeof window < "u" ? window.innerWidth : 1024
    );
    this.#Z = t, this.#G = e, this.#y = nI(i, t, e), this.#d = this.#y + e, this.#w = rI(i, this.#y, e), this.#C || (this.#r.style.transform = `translate3d(${this.#w}px, 0, 0)`), this.element.style.setProperty("--map-slide-width", `${this.#y}px`), this.element.style.setProperty("--map-slide-gap", `${e}px`);
    for (let n = 0; n < this.#e.length; n++) {
      const o = this.#e[n];
      o.style.width = `${this.#y}px`, o.style.transform = `translate3d(${(this.#s[n] + 2) * this.#d}px, 0, 0)`;
    }
  }
  // ───────────────────────── 移動
  #L(i, t = G.stepDurationMs) {
    return this.#n || this.count < 2 || !this.#g ? Promise.resolve() : this.#u.length >= G.maxQueuedSteps ? this.#q() : (this.#u.push({ dir: i, duration: t }), this.#q());
  }
  /**
   * キューを 1 本ずつ流す。**返す Promise はキューが空になるまで解決しない**
   * （動いている最中の `step()` がすぐ解決していたのを直す）。
   */
  #q() {
    if (this.#x) return this.#O ?? Promise.resolve();
    this.#x = !0;
    let i;
    return this.#O = new Promise((e) => i = e), (async () => {
      try {
        for (; this.#u.length > 0; ) {
          const { dir: e, duration: n } = this.#u.shift();
          this.#k = !0, await this.#it(e, n), this.#st(e), this.#k = !1;
        }
      } finally {
        this.#x = !1, this.#O = null;
        const e = this.#z, n = this.#P;
        if (this.#z = null, this.#P = !1, e !== null && e !== this.#h()) {
          const o = this.#t.findIndex((g) => g.mapID === e);
          o >= 0 && (this.#m(e), this.#Q(o, n));
        }
        i();
      }
    })();
  }
  /**
   * 遠い地図へは 1 枚ずつ動かす（飛ばさない）。
   * `farContinuation` は「積める数を超えた続き」から呼ばれたことを示す。
   */
  #Q(i, t = !1) {
    let e = ws(i - this.#A, this.count);
    if (this.count > 1 && e > this.count / 2 && (e -= this.count), e === 0) {
      this.#j();
      return;
    }
    const n = e > 0 ? 1 : -1, o = t || Math.abs(e) >= 2, g = o ? G.farStepDurationMs : G.stepDurationMs;
    for (let c = 0; c < Math.abs(e); c++) {
      if (this.#u.length >= G.maxQueuedSteps) {
        this.#z = this.#t[i].mapID, this.#P = o;
        break;
      }
      this.#L(n, g);
    }
  }
  #it(i, t) {
    const e = this.#w - i * this.#d;
    return this.#_(e, t);
  }
  #_(i, t) {
    const e = this.#r;
    if (this.#n) return Promise.resolve();
    const n = t > 0 && this.#rt();
    return e.style.transition = `transform ${t}ms ${G.easing}`, e.style.transform = `translate3d(${i}px, 0, 0)`, n ? new Promise((o) => {
      let g = !1, c = 0, C = 0;
      const h = () => {
        g || (g = !0, e.removeEventListener("transitionrun", w), e.removeEventListener("transitionend", z), e.removeEventListener("transitioncancel", L), window.clearTimeout(c), C && typeof window.cancelAnimationFrame == "function" && window.cancelAnimationFrame(C), o());
      };
      let f = !1;
      const w = (H) => {
        H.propertyName === "transform" && (f = !0);
      }, z = (H) => {
        H.propertyName === "transform" && h();
      }, L = (H) => {
        f && H.propertyName === "transform" && h();
      };
      e.addEventListener("transitionrun", w), e.addEventListener("transitionend", z), e.addEventListener("transitioncancel", L);
      const N = G.transitionFallbackSlackMs;
      let M = 0, y = null, P = !1;
      const _ = () => {
        const H = typeof window.requestAnimationFrame == "function" ? window.requestAnimationFrame.bind(window) : null;
        H && (C = H(() => h())), c = window.setTimeout(h, t + N * 2);
      }, yt = () => {
        if (g) return;
        const H = tI(e);
        if (H === null || Math.abs(H - i) < 0.5) {
          _();
          return;
        }
        const nt = this.#nt(e);
        if (nt) {
          const Le = `${nt.playState}:${nt.pending}:${nt.currentTime ?? "-"}`;
          if (Le !== y && M < G.transitionWatchMaxRounds) {
            M++, y = Le;
            const ct = nt.currentTime === null ? t : Math.max(0, t - nt.currentTime);
            c = window.setTimeout(yt, ct + N);
            return;
          }
        } else if (!P) {
          P = !0, c = window.setTimeout(yt, t + N * 2);
          return;
        }
        h();
      };
      c = window.setTimeout(yt, t + N);
    }) : Promise.resolve();
  }
  /**
   * トラックの `transform` の遷移の進み具合（`getAnimations()`）。遷移が無い・観測できない環境
   * （`getAnimations` を持たない jsdom など）では null。
   */
  #nt(i) {
    try {
      if (typeof i.getAnimations != "function") return null;
      const t = i.getAnimations().find(
        (n) => n.transitionProperty === "transform"
      );
      if (!t) return null;
      const e = t.currentTime;
      return {
        playState: t.playState,
        pending: !!t.pending,
        currentTime: typeof e == "number" ? e : null
      };
    } catch {
      return null;
    }
  }
  /**
   * アニメを待てる環境か。
   * `matchMedia` を持たない環境（jsdom などのテスト）と `prefers-reduced-motion: reduce` では
   * `transitionend` が来ない（来ても意味がない）ので、待たずに確定する。
   */
  #rt() {
    return typeof window > "u" || typeof window.matchMedia != "function" ? !1 : !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  #st(i) {
    if (this.#n || this.count < 2) return;
    this.#A = ws(this.#A + i, this.count);
    const t = this.#s.length, e = Math.floor(t / 2);
    for (let n = 0; n < this.#s.length; n++) {
      let o = this.#s[n] - i;
      o > e && (o -= t), o < -e && (o += t), this.#s[n] = o;
    }
    this.#r.style.transition = "none", this.#S(), this.#W(), this.#r.offsetWidth, this.#r.style.transition = "", this.#T(), this.#j();
  }
  #j() {
    this.#a.onActiveChange?.(this.#h());
  }
  // ───────────────────────── クリック
  #ot(i, t) {
    if (this.#n || !this.#g) return;
    if (this.#M) {
      this.#M = !1, i.preventDefault(), i.stopPropagation();
      return;
    }
    const e = this.slots[t], n = this.#o[t];
    if (!(!e || !n))
      if (i.preventDefault(), i.stopPropagation(), this.count > 1 && e.offset !== 0) {
        const o = e.offset > 0 ? 1 : -1;
        this.#L(o), this.#a.onSelect(n.mapID, e.offset);
      } else
        this.#a.onSelect(n.mapID, 0);
  }
  // ───────────────────────── drag
  #at(i) {
    if (this.#M = !1, this.#n || !this.#g || this.count < 2 || this.#k || typeof i.button == "number" && i.button !== 0) return;
    const t = Za();
    this.#C = {
      pointerId: typeof i.pointerId == "number" ? i.pointerId : 1,
      startX: i.clientX,
      lastX: i.clientX,
      prevX: i.clientX,
      lastT: t,
      prevT: t,
      applied: 0,
      moved: !1
    }, this.#r.style.transition = "none", window.addEventListener("pointermove", this.#U), window.addEventListener("pointerup", this.#E), window.addEventListener("pointercancel", this.#E);
  }
  #At(i) {
    const t = this.#C;
    if (!t || this.#n) return;
    t.prevX = t.lastX, t.prevT = t.lastT, t.lastX = i.clientX, t.lastT = Za();
    const e = i.clientX - t.startX;
    Math.abs(e) > G.clickThresholdPx && (t.moved = !0);
    const n = this.#d * G.dragLimitCards, o = Math.max(0, Math.abs(e) - n), g = Math.abs(e) <= n ? e : Math.sign(e) * (n + o * G.dragResistance);
    t.applied = g, this.#r.style.transform = `translate3d(${this.#w + g}px, 0, 0)`, this.#gt(g);
  }
  #lt(i) {
    const t = this.#C;
    if (!t) return;
    const e = Math.max(1, t.lastT - t.prevT), n = (t.lastX - t.prevX) / e, o = t.moved;
    this.#$(t.applied, n), o && (this.#M = !0, window.setTimeout(() => {
      this.#M = !1;
    }, 0));
  }
  #$(i, t) {
    if (!this.#C) return;
    this.#C = null, this.#tt();
    const e = this.#g ? ja(i, this.#d, t) : 0;
    e !== 0 ? this.#L(e) : this.#_(this.#w, G.stepDurationMs);
  }
  #tt() {
    window.removeEventListener("pointermove", this.#U), window.removeEventListener("pointerup", this.#E), window.removeEventListener("pointercancel", this.#E);
  }
  #gt(i) {
    const t = ja(i, this.#d, 0), e = this.#s.indexOf(t), n = e >= 0 ? this.#o[e] : null;
    this.#a.onActivePreview?.(n?.mapID ?? null);
  }
  // ───────────────────────── キーボード
  #ct(i) {
    if (!(this.#n || !this.#g))
      switch (i.key) {
        case "ArrowLeft":
          i.preventDefault(), this.step(-1);
          return;
        case "ArrowRight":
          i.preventDefault(), this.step(1);
          return;
        case "Home":
          i.preventDefault(), this.count > 0 && this.setSelectedMapID(this.#t[0].mapID);
          return;
        case "End":
          i.preventDefault(), this.count > 0 && this.setSelectedMapID(this.#t[this.count - 1].mapID);
          return;
        case "Enter":
        case " ":
          i.preventDefault(), this.#h() && this.#a.onSelect(this.#h(), 0);
          return;
        default:
          return;
      }
  }
}
const yA = "display: block; height: 300px; --cc-slider-theme-color: var(--maplat-poi-media-theme-color, #007aff); --cc-slider-navigation-color: var(--maplat-poi-media-navigation-color, #007aff);", aI = `
:host {
  display: block;
  position: relative;
  height: 400px;
  overflow: hidden;
  /* 書体・文字の大きさ・行の高さ・色はページから継承する（旧 UI と同じ。旧の bootstrap は .maplat の
     下に閉じ込めてあり、body の規則（14px・1.42857・#333）は当たらない＝操作ボタン・スライダーの容器・
     モーダルの本文はページの文字を継ぐ。基準 JSON の計算値は 16px・黒・normal＝ページ既定。
     積み残し「字の大きさと色をページから継承する」）。
     ここでは何も決めない。大きさを決めるのは、旧も自分で決めていたもの（題名 18px・カード 18px・
     モーダルの見出し 18px・POI のメニュー 13px・知らせ 17px）だけ */
  -webkit-tap-highlight-color: transparent;
}
:host([hidden]) { display: none; }
.frame { position: absolute; inset: 0; }
/* 地図（light DOM の <maplat-app>）を枠いっぱいに置く。文書側の既定の箱
   (:where(maplat-app){height:400px}) より強くするため important（Shadow DOM の important は外に勝つ） */
::slotted(maplat-app) {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
}
[hidden] { display: none !important; }

/* ---- 操作ボタン（旧 .ol-control・node_modules/ol/ol.css と src/styles/maplat-specific.scss） ----
   位置は旧 CSS（src/styles/maplat-specific.scss）の px/em をそのまま使う。em の基準は旧と同じ 16px（下の .ctl）。 */
/* 旧 .ol-control の文字はページから継ぐ（基準 JSON の 16px はページ既定の 16px）。位置の .5em も
   ページの文字の大きさに従う（ページが 20px なら 10px。旧と同じ）。容器には何も置かない */
.ctl {
  position: absolute;
  background-color: rgba(128, 128, 128, .25);
  border-radius: 4px;
}
.ctl button {
  display: block;
  margin: 0;
  padding: 0;
  height: 2.0625em;
  width: 2.0625em;
  /* 旧 bootstrap の .maplat button は font-family・font-size・line-height とも inherit（行の高さは normal）。
     旧 ol.css の .ol-control button も font-size: inherit。UA の button の 13.333px を受けず、容器（＝ページ）
     の大きさを継ぐ */
  font-family: inherit;
  font-size: inherit;
  font-weight: normal;
  line-height: normal;
  color: rgb(255, 255, 255);
  border: none;
  border-radius: 2px;
  cursor: pointer;
  text-align: center;
  touch-action: manipulation;
}
/* 実物の操作ボタンとヘルプの印（アイコン・＋−）・透過度スライダーのつまみで同じ背景色を使う（1 か所） */
.ctl button,
.help-modal .help-icon,
.help-modal .help-key,
.help-modal .help-slider::after { background-color: rgba(120, 5, 8, .5); }
.ctl button:focus-visible { outline: 2px solid rgba(120, 5, 8, .9); outline-offset: 1px; }
@media (hover: hover) {
  .ctl button:hover { background-color: rgba(120, 5, 8, .7); }
}
.ctl.disable button,
.ctl button:disabled {
  color: rgba(255, 255, 255, .7);
  background-color: rgba(120, 5, 8, .2);
}
/* アイコンは旧 UI と同じ src/icons.ts の SVG（1em 角）。旧は getIcon(…, "far fa-lg") の class を付けるが、
   旧 CSS に .fa-lg の規則は無いので、実際の大きさはボタンの文字の大きさ（16px・タッチ 24px）と同じ 1em。
   新も 1em にする（仕上げで実測。旧 16×16・ボタンの左上から 8.5px/7.5px） */
.ctl .icon { display: inline-block; font-size: 1em; line-height: 1; }
.ctl-zoom button { height: 2.0625em; width: 2.0625em; font-weight: normal; }
.ctl-zoom button:first-child { border-radius: 2px 2px 0 0; }
.ctl-zoom button:last-child { border-radius: 0 0 2px 2px; }
.ctl-compass { top: .5em; right: .5em; right: calc(.5em + env(safe-area-inset-right)); }
.ctl-compass .needle { display: inline-block; will-change: transform; }
.ctl-compass .needle svg { transform: rotate(-33deg); }
/* 操作ボタンの列（旧 .ol-copyright・.ol-border・.ol-hide-marker・.ol-marker-list の積み方）。
   右下は下から 地図情報・枠線・マーカーの非表示・マーカー一覧、左上は上から ズーム・GPS・ホーム、
   左下は上から 共有・ヘルプ。列は flex なので、隠れているボタンの分だけ詰めて積まれる。
   間隔は 1 か所（この gap）で決め、左上・左下・右下のすべてが同じ値を使う（既定 7px）。 */
.ctl-column {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: var(--maplat-ui-control-gap, 7px);
  /* ボタンの間の隙間では地図を操作できるようにする（列そのものは押せない） */
  pointer-events: none;
}
.ctl-column-top-left {
  top: .5em;
  left: .5em;
  left: calc(.5em + env(safe-area-inset-left));
}
.ctl-column-bottom-left {
  left: .5em;
  left: calc(.5em + env(safe-area-inset-left));
  bottom: calc(65px + .5em);
  bottom: calc(65px + .5em + env(safe-area-inset-bottom));
  flex-direction: column-reverse;
}
.ctl-column-bottom-right {
  right: .5em;
  right: calc(.5em + env(safe-area-inset-right));
  bottom: calc(65px + .5em);
  bottom: calc(65px + .5em + env(safe-area-inset-bottom));
  flex-direction: column-reverse;
}
.ctl-column > .ctl {
  pointer-events: auto;
  position: relative;
  top: auto;
  right: auto;
  bottom: auto;
  left: auto;
}
/* 押されている状態（旧は class の付け替えで表していた） */
.ctl button[aria-pressed="true"] { background-color: rgba(120, 5, 8, .9); }
/* 操作ボタンの自動非表示（旧 .ol-control.fade / .ol-slidercommon.fade） */
.ctl.fade,
.slider.fade,
.map-title.fade,
.map-slider.fade { display: none; }
/* タッチ端末ではズームのボタンを隠す（旧 &.ol-touch .ol-zoom { display: none; }） */
.frame.touch .ctl-zoom { display: none; }
/* タッチ端末はボタンを指で押せる大きさにする（旧 ol.css の
   .ol-touch .ol-control button { font-size: 1.5em }＝ページ既定の 16px なら 24px）。
   間隔はタッチでも同じ変数（左上・左下・右下とも同じ値）を使う。 */
.frame.touch .ctl button { font-size: 1.5em; }

/* ---- 透過度のスライダー（旧 .ol-slidernew） ---- */
.slider {
  position: absolute;
  appearance: none;
  -webkit-appearance: none;
  margin: 0;
  bottom: .5em;
  bottom: calc(.5em + env(safe-area-inset-bottom));
  left: calc(50% - 80px);
  width: 160px;
  height: 25px;
  background: rgba(255, 255, 255, .5);
  border: 2px solid #666;
  border-radius: 4px;
  box-sizing: border-box;
  /* <input> は UA の 13.333px を持つ。旧は bootstrap の input の font-size: inherit でページの大きさ
     （基準 JSON の 16px はページ既定）を継いでいたので、新も継ぐ（bottom の .5em はページに従う） */
  font-size: inherit;
}
.slider[disabled] { background: rgba(255, 255, 255, .7); }
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 25px;
  background-color: rgba(120, 5, 8, .5);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.slider::-moz-range-thumb {
  width: 20px;
  height: 25px;
  background-color: rgba(120, 5, 8, .5);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.slider[disabled]::-webkit-slider-thumb { background-color: rgba(120, 5, 8, .2); cursor: default; }
.slider[disabled]::-moz-range-thumb { background-color: rgba(120, 5, 8, .2); cursor: default; }
@media (hover: hover) {
  .slider:not([disabled])::-webkit-slider-thumb:hover { background-color: rgba(120, 5, 8, .7); }
  .slider:not([disabled])::-moz-range-thumb:hover { background-color: rgba(120, 5, 8, .7); }
}
@media screen and (max-width: 640px) {
  .slider { left: 37.5%; width: 25%; }
}
@media screen and (max-width: 320px) {
  .slider { left: 120px; width: 80px; }
}

/* ---- 地図の題名（旧 .map-title。旧 UI と同じく div + span） ---- */
.map-title {
  position: absolute;
  top: .5em;
  left: calc(50% - 250px);
  width: 500px;
  margin: auto;
  background-color: rgba(32, 32, 32, .5);
  border-radius: 4px;
  color: #fff;
  font-size: 18px;
  text-align: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
/* 旧 .map-title は高さも line-height も指定せず normal（ページの書体の normal）。新も同じにする */
.map-title,
.map-title .text { line-height: normal; }
.map-title .text { display: inline; }
@media screen and (max-width: 600px) {
  .map-title { width: calc(100% - 100px); left: 50px; }
  .frame.touch .map-title { width: calc(100% - 130px); left: 65px; }
}

/* ---- 地図の切り替えスライダー（旧 .base-swiper / .overlay-swiper） ----
   位置は旧 CSS の値をそのまま使う（左＝背景の地図、右＝重ねる地図）。overlay: false でも
   隠さない。地図が 1 枚しかないスライダーは枠（背景）を描かないが、位置と幅は変えないので
   左右の釣り合いは保たれる。 */
.map-switcher { position: absolute; inset: 0; pointer-events: none; }
.map-slider {
  position: absolute;
  z-index: 1;
  bottom: .5em;
  bottom: calc(.5em + env(safe-area-inset-bottom));
  height: ${G.cardHeightPx}px;
  width: 224px;
  background-color: rgba(32, 32, 32, .5);
  border-radius: 4px;
  color: #fff;
  /* 旧 .swiper の容器はページの文字を継ぐ（基準 JSON の 16px はページ既定。bottom の .5em はページに従う）。
     カード（.swiper-slide）は旧が自分で 18px を決めていたので、下の .map-slide で 18px */
  -webkit-user-select: none;
  user-select: none;
  touch-action: pan-y;
  pointer-events: auto;
}
.map-slider[data-kind="base"] { left: calc(50% - 312px); }
.map-slider[data-kind="overlay"] { left: calc(50% + 88px); }
/* 1 枚（と 0 枚）のスライダーは枠を描かない（位置は動かさない） */
.map-slider.single-map { background-color: transparent; }
.map-slider:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.map-slider-viewport { position: relative; overflow: hidden; width: 100%; height: 100%; }
.map-slider-track { position: absolute; top: 0; left: 0; width: 100%; height: 100%; will-change: transform; }
/* カードは <button>。UA の button の文字（13.333px）を受けず、旧 .swiper-slide と同じ 18px にする */
.map-slide { position: absolute; top: 0; left: 0; height: 100%; margin: 0; padding: 0; border: 0; box-sizing: border-box; font: inherit; font-size: 18px; background-color: rgba(0, 0, 0, 0); display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer; }
.map-slide:focus-visible { outline: 2px solid #fff; outline-offset: -2px; }
.map-slide-thumb { position: absolute; top: 0; right: 0; bottom: 0; left: 0; margin: auto; z-index: 0; max-width: 100%; max-height: 100%; -webkit-user-drag: none; -webkit-touch-callout: none; }
/* 旧 #thumbPlaceholder と同じ見た目（頭文字）。要素の 1 つだけを使い、2 つ目を作らない */
.map-slide .thumb.none { position: absolute; top: 0; right: 0; bottom: 0; left: 0; width: 52px; height: 52px; max-width: 100%; max-height: 100%; margin: auto; z-index: 0; display: flex; align-items: center; justify-content: center; color: rgba(255, 255, 255, .75); font-size: 1.6em; }
.map-slide-label { position: absolute; right: 0; bottom: .1em; left: 0; margin: auto; z-index: 1; font-size: 1em; line-height: normal; color: #fff; background-color: rgba(32, 32, 32, .5); text-align: center; }
.map-slide-label.minimize { font-size: .8em; }
@media screen and (max-width: ${G.breakpointWidth}px) {
  .map-slider.touch .map-slide-label { font-size: .8em; }
  .map-slider.touch .map-slide-label.minimize { font-size: .6em; }
}
.map-slide.selected { background-color: rgba(0, 0, 255, .1); }
/* 範囲を持つ地図の枠（旧 .show-border .swiper-slide.<色>）。色は要素が割り当てた 12 色 */
.map-slider.show-border .map-slide.has-envelope { border: 2px dashed var(--maplat-envelope-color, maroon); }
/* 矢印（旧 .base-prev 等＋旧ライブラリ v12 の .swiper-button-prev/next）。箱は 18×30・top 15px、
   形は旧ライブラリの山形の SVG、色は旧の既定の #007aff（旧の swiper-button-white は v12 では効かない） */
.map-slider-nav { position: absolute; top: 15px; width: 18px; height: 30px; margin: 0; padding: 0; border: 0; background-color: transparent; display: flex; align-items: center; justify-content: center; color: #007aff; z-index: 10; cursor: pointer; }
.map-slider-nav.prev { left: 4px; }
.map-slider-nav.next { left: calc(100% - 22px); }
.map-slider-nav-icon { width: 100%; height: 100%; object-fit: contain; transform-origin: center; fill: currentColor; pointer-events: none; }
.map-slider-nav.prev .map-slider-nav-icon { transform: rotate(180deg); }
.map-slider-nav[hidden] { display: none; }
.map-slider.single-map .map-slider-nav { display: none; }
.map-slider.disabled .map-slide { cursor: default; }
.map-slider-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media screen and (max-width: 640px) {
  .map-slider { width: 35%; }
  .map-slider[data-kind="base"] { left: 1.25%; }
  .map-slider[data-kind="overlay"] { left: 63.75%; }
}
@media screen and (max-width: 320px) {
  .map-slider { width: 112px; }
  .map-slider[data-kind="base"] { left: 4px; }
  .map-slider[data-kind="overlay"] { left: 204px; }
}
@media (prefers-reduced-motion: reduce) { .map-slider-track { transition: none !important; } }

/* ---- POI の吹き出し（旧 .modal / .modal_poi） ---- */
.modal {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  background: rgba(0, 0, 0, .5);
}
.modal .dialog {
  position: relative;
  box-sizing: border-box;
  width: 600px;
  max-width: calc(100% - 20px);
  margin: 30px 10px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, .2);
  border-radius: 6px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, .5);
}
@media (max-width: 767px) {
  .modal .dialog { margin: 10px; }
}
.modal .header {
  display: flex;
  align-items: flex-start;
  gap: .5em;
  padding: 15px;
  border-bottom: 1px solid #e5e5e5;
}
.modal .title { flex: 1; margin: 0; font-size: 18px; font-weight: 500; line-height: 1.42857; overflow-wrap: anywhere; }
.modal .close {
  flex: none;
  margin: -6px -4px 0 0;
  padding: 0 4px;
  border: 0;
  background: transparent;
  font-size: 32px;
  font-weight: bold;
  line-height: 1;
  color: #000;
  opacity: .2;
  cursor: pointer;
}
.modal .close:hover { opacity: .5; }
.modal .close:focus-visible { outline: 2px solid rgba(120, 5, 8, .9); outline-offset: 1px; opacity: 1; }
.modal .close[data-focus-origin="script"]:focus-visible { outline: none; opacity: .2; }
.modal .close[data-focus-origin="script"]:focus-visible:hover { opacity: .5; }
.modal .body { padding: 15px; overflow-wrap: anywhere; }
.poi-html { display: block; width: 100%; }
.poi-html.scroll { max-height: 60vh; overflow-y: auto; }
.poi-iframe { width: 100%; min-height: 50vh; border: 0; }
.poi-iframe.no-scroll { min-height: 0; height: 60vh; }
/* POI のメディア（旧 .poi_img_swiper と、旧が文書の head に入れていた Chuci のスライダーの style） */
.poi-media { margin-bottom: 10px; }
.poi-media qy-swiper { ${yA} }
.poi-address { color: #555; margin: 0 0 10px; }
.poi-desc { margin: 0 0 10px; }
/* ---- マーカー一覧（旧 .modal_marker_list・.list-group-item.layer / .poi） ---- */
.marker-list-modal .body { padding: 0; }
.marker-list-modal ul { list-style: none; margin: 0; padding: 0; }
.marker-list-modal li.layer { border-bottom: 1px solid #ddd; }
.marker-list-modal li.layer:last-child { border-bottom: 0; }
.marker-list-modal .layer-row { display: flex; align-items: center; justify-content: space-between; }
.marker-list-modal button.layer-label,
.marker-list-modal button.poi {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 8px;
  margin: 0;
  padding: 8px 10px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.marker-list-modal ul.pois { padding-inline-start: 15px; }
.marker-list-modal ul.pois li { border-top: 1px solid #eee; }
@media (hover: hover) {
  .marker-list-modal button.layer-label:hover,
  .marker-list-modal button.poi:hover { background-color: #ccc; }
}
.marker-list-modal button.layer-label:active,
.marker-list-modal button.poi:active { background-color: #ccc; }
.marker-list-modal .icon { flex: none; width: 32px; height: 32px; object-fit: contain; }
.marker-list-modal .name { overflow-wrap: anywhere; }
/* 旧 .dli-chevron（閉じて右向き・開いて下向き） */
.marker-list-modal .chevron {
  flex: none;
  display: inline-block;
  width: .7em;
  height: .7em;
  margin: 0 4px;
  border: .1em solid #333;
  border-left: 0;
  border-bottom: 0;
  box-sizing: border-box;
  transform: rotate(45deg);
}
.marker-list-modal li.layer.open > .layer-row .chevron { transform: rotate(135deg); }
/* 旧 input.markerlist + label.check（ON/OFF の切り替え） */
.marker-list-modal .switch { flex: none; position: relative; display: inline-block; width: 60px; height: 28px; margin: 0 15px 0 8px; cursor: pointer; }
.marker-list-modal .switch input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
.marker-list-modal .switch .track {
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  border: 1px solid #a3a3a3;
  border-radius: 3px;
  background-color: #fff;
  color: #969696;
  pointer-events: none;
}
.marker-list-modal .switch .track::before { content: "OFF"; position: absolute; top: 4px; right: 6px; }
.marker-list-modal .switch .track::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 22px;
  box-sizing: border-box;
  border: 1px solid #a3a3a3;
  border-radius: 3px;
  background-color: #fff;
  transition: .2s;
}
.marker-list-modal .switch input:checked + .track { border-color: #4db4e4; background-color: #4db4e4; }
.marker-list-modal .switch input:checked + .track::before { content: "ON"; left: 6px; right: auto; color: #fff; }
.marker-list-modal .switch input:checked + .track::after { border-color: transparent; left: 44px; }
.marker-list-modal .switch input:focus-visible + .track { outline: 2px solid rgba(120, 5, 8, .9); outline-offset: 1px; }

/* ---- 重なった POI の選択メニュー（旧 .ol-ctx-menu-container・幅 170px） ---- */
.poi-menu {
  position: absolute;
  z-index: 5;
  width: 170px;
  box-sizing: border-box;
  padding: 8px;
  background: #fff;
  color: #222;
  font-size: 13px;
  border-radius: 5px;
  box-shadow: rgba(0, 0, 0, .2) 3px 3px 5px;
}
.poi-menu ul { list-style: none; margin: 0; padding: 0; max-height: 50vh; overflow-y: auto; }
.poi-menu button {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  margin: 0;
  padding: 2px 5px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  line-height: 20px;
  text-align: left;
  cursor: pointer;
}
.poi-menu button:hover,
.poi-menu button:focus-visible { background-color: #333; color: #eee; outline: none; }
.poi-menu .icon { flex: none; width: auto; height: 20px; }
.poi-menu .name { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

/* ---- 共有（旧 .modal_share・.poi_share_buttons・.qr_view 等。旧は Bootstrap の btn-light を 3 列に並べていた） ---- */
.share-section + .share-section { margin-top: 15px; padding-top: 10px; border-top: 1px solid #e5e5e5; }
.share-heading { margin: 0 0 10px; font-size: 18px; font-weight: 500; }
.share-buttons { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 10px; }
.share-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .35em;
  padding: 6px 12px;
  border: 1px solid #f8f9fa;
  border-radius: 4px;
  background-color: #f8f9fa;
  color: #212529;
  font: inherit;
  /* 旧 .btn（bootstrap の button-size の $font-size-base・$line-height-base）は文字を自分で決めていた */
  font-size: 14px;
  line-height: 1.42857;
  cursor: pointer;
}
.share-button:hover { background-color: #e2e6ea; border-color: #dae0e5; }
.share-button:focus-visible { outline: 2px solid rgba(120, 5, 8, .9); outline-offset: 1px; }
.share-button svg { width: 14px; height: 14px; flex: none; }
.qr { display: block; width: 128px; min-height: 128px; margin: 0 auto; }
.qr svg { display: block; width: 128px; height: 128px; }
.poi-share { padding: 0 15px 15px; }
/* 知らせ（旧 .custom-toast。旧は document.body に置いていた） */
.toast {
  position: fixed;
  z-index: 30;
  visibility: hidden;
  min-width: 250px;
  box-sizing: border-box;
  padding: 16px;
  border-radius: 2px;
  background-color: #333;
  color: #fff;
  font-size: 17px;
  text-align: center;
  overflow-wrap: break-word;
  opacity: 0;
  transition: opacity .3s;
  pointer-events: none;
}
.toast.show { visibility: visible; opacity: 1; }

/* ---- 地図情報（旧 .modal_map・modal_cache_content。旧は Bootstrap の dl-horizontal と btn を並べていた） ---- */
.map-info-modal .body { padding: 15px; }
.map-info-modal dl.map-meta {
  display: grid;
  grid-template-columns: 9em 1fr;
  gap: .35em .9em;
  margin: 0;
}
.map-info-modal dl.map-meta dt { color: #555; font-weight: bold; }
.map-info-modal dl.map-meta dd { margin: 0; min-width: 0; }
/* 旧 bootstrap の dt, dd { line-height: $line-height-base } は .maplat の下でも当たっていた */
.map-info-modal dl.map-meta dt,
.map-info-modal dl.map-meta dd { line-height: 1.42857; }
.map-info-modal img.license { display: block; max-height: 2.2em; max-width: 100%; }
/* アイコンの無い語彙は文言だけを出す（相対 URL の画像を取りに行かない） */
.map-info-modal .license-text { display: block; }
.map-info-modal .license_note { margin-top: .3em; font-size: .85em; color: #555; }
.map-info-modal .map-cache { margin-top: 15px; padding-top: 10px; border-top: 1px solid #e5e5e5; }
/* IIIF の書誌の表（項目名は折り返さず、長い値を折り返す） */
[part="map-meta-iiif"] table { width: 100%; border-collapse: collapse; font-size: .85em; }
[part="map-meta-iiif"] th, [part="map-meta-iiif"] td { text-align: left; vertical-align: top; padding: .15em .4em .15em 0; }
[part="map-meta-iiif"] th { white-space: nowrap; font-weight: normal; color: #555; }
[part="map-meta-iiif"] td { overflow-wrap: anywhere; }
[part="map-meta-iiif"] h4 { margin: .6em 0 .2em; font-size: .9em; }
/* 表示中の地図の帰属表記（地図ごとに題名の見出しと全文。長い値も切らずに折り返す） */
[part="map-meta-attributions"] .attribution-map + .attribution-map { margin-top: .5em; }
[part="map-meta-attributions"] h4 { margin: 0 0 .15em; font-size: .9em; }
[part="map-meta-attributions"] .attribution-item { overflow-wrap: anywhere; }
[part="map-meta-attributions"] .attribution-item p { margin: 0; }
[part="map-meta-attributions"] .attribution-item img { max-width: 100%; }
.map-info-modal .cache-heading { margin: 0 0 .4em; font-size: .95em; font-weight: bold; color: #555; }
.map-info-modal .cache-size { margin: 0 0 .6em; overflow-wrap: anywhere; }
.map-info-modal .cache-buttons { margin: 0; text-align: right; }
.map-info-modal .cache-buttons button {
  margin-left: .5em;
  padding: .3em .9em;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f4f4f4;
  color: #212529;
  font: inherit;
  /* 旧 .btn（bootstrap の button-size の $font-size-base・$line-height-base）は文字を自分で決めていた */
  font-size: 14px;
  line-height: 1.42857;
  cursor: pointer;
}
.map-info-modal .cache-buttons button:hover:not([disabled]) { background-color: #e2e6ea; border-color: #dae0e5; }
.map-info-modal .cache-buttons button:focus-visible { outline: 2px solid rgba(120, 5, 8, .9); outline-offset: 1px; }
.map-info-modal .cache-buttons button.btn-danger { background-color: #d9534f; border-color: #d43f3a; color: #fff; }
.map-info-modal .cache-buttons button.btn-danger:hover:not([disabled]) { background-color: #c9302c; border-color: #ac2925; }
.map-info-modal .cache-buttons button[disabled] { opacity: .5; cursor: default; }

/* ---- ヘルプ（旧 .modal_help_content・.help_content・.help_img） ---- */
.help-modal .help-body { max-height: 70vh; overflow-y: auto; }
.help-modal .help-text { margin: 0 0 .6em; }
.help-modal h4 { margin: 1em 0 .3em; font-size: 1em; font-weight: bold; color: #333; }
.help-modal .help-list { margin: 0 0 .6em; padding-inline-start: 1.4em; }
.help-modal .help-list li { margin: 0 0 .4em; }
/* 実物の操作ボタン（.ctl button）と同じ見た目: 赤茶の半透明の背景・白いアイコンか文字・角の丸み 2px。
   大きさは実物と同じではないが、行の中に収まる 1.4em 角の小さな四角にする */
.help-modal .help-icon,
.help-modal .help-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 1.4em;
  height: 1.4em;
  padding: 0;
  border: 0;
  border-radius: 2px;
  color: #fff;
  font-weight: normal;
  line-height: 1;
  text-align: center;
  vertical-align: middle;
}
/* アイコンは箱の半分（実物は 2.0625em の箱に 1em のアイコン）。大きいと塗りつぶしのアイコン（ⓘ・一覧）が
   箱からはみ出して見える */
/* getIcon の SVG は style 属性に 1em を持つので、ここは !important で上書きする */
.help-modal .help-icon svg { height: 50% !important; width: 50% !important; vertical-align: 0 !important; }
/* 本文の中の印は少し大きく（旧のヘルプは 33px のボタンの画像を文の中に置いていた）。全体の図の中は 1.4em のまま */
.help-modal .help-text .help-icon,
.help-modal .help-text .help-key,
.help-modal .help-list .help-icon,
.help-modal .help-list .help-key { width: 1.8em; height: 1.8em; }
.help-modal .help-img { max-height: 1.4em; width: auto; vertical-align: middle; }
/* 実物の透過度のスライダー（.slider）に似せる: 白い半透明の可動部分（灰色の枠・丸角）の上に、
   右端へ赤茶のつまみを置く。つまみと可動部分のそれぞれに影を付ける */
.help-modal .help-slider {
  position: relative;
  display: inline-block;
  box-sizing: border-box;
  width: 3.5em;
  height: .95em;
  border: 2px solid #666;
  border-radius: 4px;
  background: rgba(255, 255, 255, .6);
  box-shadow: 0 1px 2px rgba(0, 0, 0, .35);
  vertical-align: middle;
}
.help-modal .help-slider::after {
  content: "";
  position: absolute;
  top: -1px;
  right: 1px;
  bottom: -1px;
  width: .8em;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, .45);
}
/* ヘルプの冒頭の全体の図（旧 fullscreen.png の位置）。その場にスマホの画面を組む。
   背景は今の地図を写したもの（canvas）。写せないときは先頭の古地図のサムネイル（どちらも object-fit: cover） */
.help-modal .help-figure { margin: 0 0 1em; text-align: center; }
.help-modal .help-phone {
  position: relative;
  display: inline-block;
  box-sizing: border-box;
  width: 180px;
  padding: 6px;
  background: #111;
  border-radius: 24px;
  vertical-align: middle;
}
.help-modal .help-phone-screen {
  position: relative;
  width: 100%;
  aspect-ratio: 200 / 394;
  overflow: hidden;
  border-radius: 18px;
  background: #d9d9d9;
}
.help-modal .help-phone-map {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.help-modal .help-phone-ui { position: absolute; inset: 0; }
.help-modal .help-phone-title {
  position: absolute;
  top: 8px;
  right: 18%;
  left: 18%;
  height: 10px;
  border-radius: 2px;
  background: rgba(32, 32, 32, .5);
}
.help-modal .help-phone-stack {
  position: absolute;
  display: flex;
  gap: 2px;
}
.help-modal .help-phone-stack-top-left {
  top: 8px;
  left: 8px;
  flex-direction: column;
}
.help-modal .help-phone-stack-top-right { top: 8px; right: 8px; }
.help-modal .help-phone-stack-bottom-left,
.help-modal .help-phone-stack-bottom-right {
  bottom: 40px;
  flex-direction: column-reverse;
}
.help-modal .help-phone-stack-bottom-left { left: 8px; }
.help-modal .help-phone-stack-bottom-right { right: 8px; }
/* 地図の切り替えスライダー: サムネイル付きのカードを簡略化したもの（サムネイルの上に見出しの帯） */
.help-modal .help-phone-map-slider {
  position: absolute;
  bottom: 8px;
  width: 35%;
  height: 24px;
  overflow: hidden;
  border-radius: 3px;
  background: rgba(32, 32, 32, .5);
}
.help-modal .help-phone-map-slider[data-kind="base"] { left: 1.25%; }
.help-modal .help-phone-map-slider[data-kind="overlay"] { right: 1.25%; }
.help-modal .help-phone-card-thumb {
  position: absolute;
  inset: 0;
  max-width: 100%;
  max-height: 100%;
  margin: auto;
}
.help-modal .help-phone-card-label {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 6px;
  background: rgba(32, 32, 32, .5);
}
/* 透過度のスライダーは 2 本の地図スライダーの間に置く（実物の幅の比に合わせる） */
.help-modal .help-phone-transparency {
  position: absolute;
  bottom: 13px;
  left: 37.5%;
  width: 25%;
  font-size: 11px;
}
.help-modal .help-phone-transparency .help-slider {
  display: block;
  width: 100%;
}
.help-modal .help-footer { margin: 1em 0 0; font-size: .9em; color: #555; }

/* ---- 範囲外・GPS のエラー（旧 modal_gpsD。題名と本文だけ） ---- */
.gps-modal .gps-message { margin: 0; line-height: 1.6; }

/* ---- スプラッシュ（旧 initSplash・.modal_load_content・.splash_div） ---- */
.splash {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, .92);
  text-align: center;
}
.splash-inner { max-width: 90%; max-height: 90%; overflow: hidden; }
/* 旧は h4.modal-title 内の .modal_load_title（18px） */
.splash-title { margin: 0 0 .6em; font-size: 18px; font-weight: bold; }
.splash-loading { margin: 0; color: #555; }
.splash-image { margin: .8em 0 0; }
.splash-image img { max-width: 100%; max-height: 60vh; }

.sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); border: 0; }
`, AI = `img { width: 100%; } qy-swiper { ${yA} }`;
function lI(r, i) {
  const t = document.createElement("div");
  t.className = i ? "poi-html" : "poi-html scroll", t.setAttribute("part", "poi-html");
  const e = t.attachShadow({ mode: "open" }), n = document.createElement("style");
  n.textContent = AI, e.appendChild(n);
  const o = document.createElement("div");
  return o.innerHTML = Ue(r), e.appendChild(o), t;
}
function gI(r, i) {
  const t = jt(r);
  if (t === void 0) return;
  const e = document.createElement("iframe");
  return e.className = i ? "poi-iframe no-scroll" : "poi-iframe", e.setAttribute("part", "poi-iframe"), i && e.setAttribute("scrolling", "no"), e.src = t, e;
}
function cI(r, i, t = (e) => typeof e == "string" ? e : "") {
  return r.html ? {
    kind: "html",
    node: lI(t(r.html) || "", i)
  } : r.url ? {
    kind: "url",
    node: gI(t(r.url) || "", i) ?? null
  } : { kind: "none", node: null };
}
function II(r, i) {
  return r === "view" ? i : i.split("?")[0].split("#")[0];
}
function CI(r, i) {
  return `https://twitter.com/intent/tweet?url=${encodeURIComponent(r)}&text=${encodeURIComponent(i)}&hashtags=Maplat`;
}
function hI(r) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(r)}&display=popup&ref=plugin&src=like&kid_directed_site=0`;
}
let Rn = null;
function pI() {
  return Rn || (Rn = import("./browser-ey6Iih3j.js").then((r) => r.b).then((r) => {
    const i = r, t = typeof i.create == "function" ? i : i.default;
    if (!t || typeof t.create != "function")
      throw new Error("qrcode has no create()");
    return t;
  }).catch((r) => (Rn = null, console.warn("<maplat-ui>: failed to load qrcode (QR code)", r), null))), Rn;
}
const On = "http://www.w3.org/2000/svg", Ga = 128, ts = 1;
function dI(r, i, t) {
  const e = r.size + ts * 2, n = document.createElementNS(On, "svg");
  n.setAttribute("xmlns", On), n.setAttribute("viewBox", `0 0 ${e} ${e}`), n.setAttribute("width", `${Ga}`), n.setAttribute("height", `${Ga}`), n.setAttribute("shape-rendering", "crispEdges"), n.setAttribute("role", "img"), n.setAttribute("aria-label", t), n.setAttribute("data-url", i), n.setAttribute("part", "qr-code");
  const o = document.createElementNS(On, "rect");
  o.setAttribute("width", `${e}`), o.setAttribute("height", `${e}`), o.setAttribute("fill", "#ffffff"), n.appendChild(o);
  let g = "";
  for (let C = 0; C < r.size; C++)
    for (let h = 0; h < r.size; h++)
      r.get(C, h) && (g += `M${h + ts} ${C + ts}h1v1h-1z`);
  const c = document.createElementNS(On, "path");
  return c.setAttribute("d", g), c.setAttribute("fill", "#000000"), n.appendChild(c), n;
}
const Ha = /* @__PURE__ */ new WeakMap();
async function es(r, i, t) {
  Ha.set(r, i);
  const e = await pI();
  if (Ha.get(r) !== i || !e) return !1;
  let n;
  try {
    n = e.create(i, { errorCorrectionLevel: "M" }).modules;
  } catch (o) {
    return console.warn("<maplat-ui>: failed to make a QR code", o), !1;
  }
  return r.replaceChildren(dI(n, i, t)), !0;
}
function uI(r) {
  try {
    return decodeURIComponent(r);
  } catch {
    return r;
  }
}
function Bi(r) {
  const i = parseFloat(r);
  return Number.isFinite(i) ? i : void 0;
}
function Ba(r) {
  if (typeof r != "string" || !r.startsWith("#!")) return null;
  const i = r.slice(2).split("?")[0], t = { rotation: 0 }, e = { transparency: 0, position: t };
  for (const n of i.split("/")) {
    if (!n) continue;
    const o = n.indexOf(":");
    if (o < 0) continue;
    const g = n.slice(0, o), c = uI(n.slice(o + 1));
    switch (g) {
      case "s":
        c && (e.mapID = c);
        break;
      case "b":
        c && (e.backgroundID = c);
        break;
      case "t": {
        const C = Bi(c);
        C !== void 0 && (e.transparency = C);
        break;
      }
      case "r": {
        const C = Bi(c);
        C !== void 0 && (t.rotation = C);
        break;
      }
      case "z": {
        const C = Bi(c);
        C !== void 0 && (t.zoom = C);
        break;
      }
      case "x": {
        const C = Bi(c);
        C !== void 0 && (t.x = C);
        break;
      }
      case "y": {
        const C = Bi(c);
        C !== void 0 && (t.y = C);
        break;
      }
      case "sb":
        e.showBorder = !!parseInt(c, 10);
        break;
      case "hm":
        e.hideMarker = parseInt(c, 10) ? 1 : 0;
        break;
      case "hl":
        c && (e.hideLayer = c);
        break;
      case "om":
        c && (e.openedMarker = c);
        break;
    }
  }
  return e.mapID ? e : null;
}
function mI(r) {
  let i = `s:${r.mapID}`;
  return r.backgroundID && r.backgroundID !== r.mapID && (i += `/b:${r.backgroundID}`), typeof r.transparency == "number" && r.transparency > 0 && (i += `/t:${r.transparency}`), typeof r.x == "number" && typeof r.y == "number" && (i += `/x:${r.x}`, i += `/y:${r.y}`), typeof r.zoom == "number" && (i += `/z:${r.zoom}`), typeof r.rotation == "number" && r.rotation !== 0 && (i += `/r:${r.rotation}`), r.showBorder && (i += "/sb:1"), r.hideMarker && (i += "/hm:1"), r.hideLayer && (i += `/hl:${r.hideLayer}`), r.openedMarker && (i += `/om:${r.openedMarker}`), i;
}
const Ua = 6378137;
function QI(r) {
  return 0.5 * Math.abs(
    [0, 1, 2, 3].reduce((i, t, e) => {
      const n = r[e], o = r[e + 1];
      return i + (n[0] - o[0]) * (n[1] + o[1]);
    }, 0)
  );
}
function Va(r) {
  let i = 0;
  for (let t = 0; t < r.length; t++) {
    const e = r[t], n = r[(t + 1) % r.length];
    i += e.longitude * n.latitude - n.longitude * e.latitude;
  }
  return Math.abs(i) / 2;
}
function fI(r, i) {
  let t = !1;
  for (let e = 0, n = i.length - 1; e < i.length; n = e++) {
    const o = i[e], g = i[n];
    o.latitude > r.latitude != g.latitude > r.latitude && r.longitude < (g.longitude - o.longitude) * (r.latitude - o.latitude) / (g.latitude - o.latitude) + o.longitude && (t = !t);
  }
  return t;
}
function _I(r) {
  const [i, t] = r;
  return {
    longitude: i / Ua * 180 / Math.PI,
    latitude: (2 * Math.atan(Math.exp(t / Ua)) - Math.PI / 2) * 180 / Math.PI
  };
}
const bI = "1.2.0", Je = [
  ...Ar,
  ...yo
], is = [
  ...vo,
  ...cA
], vI = new Map(Je.map((r) => [r.attr, r])), ns = new Map(Je.map((r) => [r.prop, r])), rs = Je.filter(
  (r) => r.state
), Ya = /* @__PURE__ */ new WeakMap(), ss = /* @__PURE__ */ new WeakMap(), os = ["showBorder", "openedMarker"];
function ut(r) {
  const i = yc.find((t) => t.attr === r);
  if (!i)
    throw new Error(`<${tt}>: unknown layer B attribute "${r}"`);
  return i;
}
const xs = {
  attr: "compass-action",
  prop: "compassAction",
  kind: "string"
}, ks = ut("set-document-title"), wi = ut("enable-border"), an = ut("enable-hide-marker"), Fe = ut("enable-marker-list"), wA = ut("enable-poi-html-no-scroll"), be = ut("enable-share"), xA = ut("presentation-mode"), kA = ut("tap-duration"), MA = ut("tap-ui-vanish"), SA = ut("app-envelope"), zA = ut("state-url"), PA = ut("pwa-manifest"), EA = ut("pwa-worker"), TA = ut("pwa-scope"), Fi = [
  xs,
  ks,
  wi,
  an,
  Fe,
  wA,
  be,
  xA,
  kA,
  MA,
  SA,
  zA,
  PA,
  EA,
  TA
], Fa = new Map(Fi.map((r) => [r.attr, r])), yI = /* @__PURE__ */ new Set([
  be,
  wi,
  an,
  Fe
]), as = [
  "#800000",
  // maroon
  "#ff1493",
  // deeppink
  "#4b0082",
  // indigo
  "#808000",
  // olive
  "#4169e1",
  // royalblue
  "#ff0000",
  // red
  "#ff69b4",
  // hotpink
  "#008000",
  // green
  "#ffff00",
  // yellow
  "#000080",
  // navy
  "#8b4513",
  // saddlebrown
  "#ff00ff",
  // fuchsia
  "#2f4f4f",
  // darkslategray
  "#9acd32",
  // yellowgreen
  "#0000ff",
  // blue
  "#c71585",
  // mediumvioletred
  "#800080",
  // purple
  "#00ff00",
  // lime
  "#ff8c00",
  // darkorange
  "#008080",
  // teal
  "#dc143c",
  // crimson
  "#9400d3",
  // darkviolet
  "#556b2f",
  // darkolivegreen
  "#4682b4",
  // steelblue
  "#00ffff"
  // aqua
], wI = {
  width: 2,
  lineDash: [6, 6]
};
function xI(r) {
  const i = r.replace(/^#/, ""), t = parseInt(i.slice(0, 2), 16), e = parseInt(i.slice(2, 4), 16), n = parseInt(i.slice(4, 6), 16);
  return `rgba(${t}, ${e}, ${n}, 0.4)`;
}
const kI = "Custom", Ja = "attributionChanged", MI = [
  "lifecycle:appdata-ready",
  "mapChanged",
  "changeViewpoint",
  "gpsEnabledChanged",
  "updateState",
  "clickMarker",
  "clickMarkers",
  "poi_number",
  "outOfMap",
  "gps_error",
  "gps_result",
  "moveEnd"
];
function Ka() {
  const r = { settled: !1 };
  return r.promise = new Promise((i, t) => {
    r.resolve = () => {
      r.settled = !0, i();
    }, r.reject = (e) => {
      r.settled = !0, t(e);
    };
  }), r.promise.catch(() => {
  }), r;
}
const SI = typeof HTMLElement < "u" ? HTMLElement : class {
};
function qa(r) {
  const i = ((r + 180) % 360 + 360) % 360 - 180;
  return i === -180 ? 180 : i;
}
function zI(r) {
  const i = ["Bytes", "KBytes", "MBytes", "GBytes"];
  let t = "Bytes";
  for (const e of i) {
    if (t = e, r < 1e3) break;
    r = r / 1e3;
  }
  return `${Math.floor(r * 10) / 10} ${t}`;
}
function PI(r, i, t) {
  return i || (r === "license" || t ? "All right reserved" : "CC BY-SA");
}
function As(r) {
  return (r ?? "").replace(/\s+/g, " ").trim();
}
function EI(r) {
  const i = document.createElement("div");
  return i.appendChild(r.cloneNode(!0)), i.innerHTML;
}
function TI(r) {
  if (r.includes("youtube.com") || r.includes("youtu.be")) return "youtube";
  switch (r.split(".").pop()?.toLowerCase()) {
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
function ls(r, ...i) {
  for (const t of i) {
    const e = Ye(t);
    if (e !== void 0) return e;
  }
  return r;
}
function LI(r) {
  if (!Array.isArray(r)) return [];
  const i = [];
  for (const t of r) {
    if (!t || typeof t != "object") continue;
    const e = t, n = typeof e.namespaceID == "string" && e.namespaceID !== "" ? e.namespaceID : typeof e.id == "string" && e.id !== "" ? e.id : void 0;
    if (n === void 0) continue;
    const o = Array.isArray(e.pois) ? e.pois.filter(
      (g) => !!g && typeof g == "object"
    ) : [];
    i.push({
      ...e,
      id: typeof e.id == "string" ? e.id : n,
      namespaceID: n,
      hide: !!e.hide,
      pois: o
    });
  }
  return i;
}
function Qa(r) {
  if (typeof r.namespaceID == "string" && r.namespaceID !== "")
    return r.namespaceID;
  if (typeof r.id == "string" || typeof r.id == "number")
    return String(r.id);
}
let Xn = null;
function gs() {
  return typeof customElements < "u" && customElements.get("qy-swiper") ? Promise.resolve() : (Xn || (Xn = import("./quyuan-BgsE8LzX.js").then(
    () => {
    },
    (r) => {
      Xn = null, console.warn(
        `<${tt}>: failed to load @c4h/quyuan (POI media viewer)`,
        r
      );
    }
  )), Xn);
}
const Ii = (r) => `<button type="button" class="close" part="${r}"><span aria-hidden="true">&#215;</span><span class="sr-only"></span></button>`, cs = {
  cp: "M224 0c-35.3 0-64 28.7-64 64V96H96c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H288c35.3 0 64-28.7 64-64V384h64c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64H224zM288 384H96V160H224c0-17.7 14.3-32 32-32h64V256c0 17.7 14.3 32 32 32h96V384H288z",
  tw: "M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z",
  fb: "M504 256C504 119 393 8 256 8S8 119 8 256c0 121.3 87.1 222.4 203 240.5V327.9h-61v-71.9h61V203c0-60.8 35.8-93.7 89.2-93.7 25.5 0 50.4 1.8 56.1 2.6v62.4h-35.4c-29.5 0-37.4 18.2-37.4 42.1v59.6h68.9l-11 71.9h-57.9V496.5C416.9 478.4 504 377.3 504 256z"
}, RI = {
  home: "house",
  compass: "compass",
  gps: "location-crosshairs",
  help: "circle-question",
  attr: "circle-info",
  share: "share-from-square",
  border: "layer-group",
  hide_marker: "map-pin",
  marker_list: "list"
}, OI = 1500, Is = {
  view: "app.out_of_map_area",
  gpsOff: "app.out_of_map_desc",
  gpsKept: "app.out_of_map"
}, XI = "app.cannot_open_link", DI = 3e3, NI = 30, WI = 8, _a = 500, jI = 1.5, ZI = 2e3, GI = 12e4;
function $a(r) {
  return `${r.size ?? ""}/${r.count ?? ""}/${r.total ?? ""}`;
}
function HI(r) {
  return typeof r.total == "number" && r.total > 0 && typeof r.count == "number" && r.count >= r.total;
}
const BI = {
  user_gps_deny: "app.user_gps_deny",
  gps_miss: "app.gps_miss",
  gps_timeout: "app.gps_timeout"
}, Cs = (r) => `
      <div class="share-buttons">
        <button type="button" class="share-button" part="share-button" data-share="cp_${r}"><svg viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="${cs.cp}"/></svg><small class="share-copy-label"></small></button>
        <button type="button" class="share-button" part="share-button" data-share="tw_${r}" title="X"><svg viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="${cs.tw}"/></svg><small>X</small></button>
        <button type="button" class="share-button" part="share-button" data-share="fb_${r}" title="Facebook"><svg viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="${cs.fb}"/></svg><small>Facebook</small></button>
      </div>`, UI = `
<div class="frame" part="frame">
  <slot name="map"></slot>
  <div class="map-title" part="map-title" hidden><span class="text"></span></div>
  <div class="map-switcher" part="map-switcher"></div>
  <div class="ctl-column ctl-column-top-left">
    <div class="ctl ctl-zoom" part="zoom">
      <button type="button" class="zoom-in" part="zoom-in">+</button>
      <button type="button" class="zoom-out" part="zoom-out">&#8722;</button>
    </div>
    <div class="ctl ctl-gps disable" part="gps"><button type="button"><span class="icon">${Ot("location-crosshairs")}</span></button></div>
    <div class="ctl ctl-home" part="home"><button type="button"><span class="icon">${Ot("house")}</span></button></div>
  </div>
  <div class="ctl ctl-compass disable" part="compass"><button type="button"><span class="icon needle">${Ot("compass")}</span></button></div>
  <div class="ctl-column ctl-column-bottom-right">
    <div class="ctl ctl-info" part="info" hidden><button type="button" aria-haspopup="dialog"><span class="icon">${Ot("circle-info")}</span></button></div>
    <div class="ctl ctl-border" part="border" hidden><button type="button" aria-pressed="false"><span class="icon">${Ot("layer-group")}</span></button></div>
    <div class="ctl ctl-hide-marker" part="hide-marker" hidden><button type="button" aria-pressed="false"><span class="icon">${Ot("map-pin")}</span></button></div>
    <div class="ctl ctl-marker-list" part="marker-list" hidden><button type="button" aria-haspopup="dialog"><span class="icon">${Ot("list")}</span></button></div>
  </div>
  <div class="ctl-column ctl-column-bottom-left">
    <div class="ctl ctl-help" part="help"><button type="button" aria-haspopup="dialog"><span class="icon">${Ot("circle-question")}</span></button></div>
    <div class="ctl ctl-share" part="share" hidden><button type="button" aria-haspopup="dialog"><span class="icon">${Ot("share-from-square")}</span></button></div>
  </div>
  <input class="slider" part="slider" type="range" min="0" max="100" step="1" value="100" hidden>
  <div class="poi-menu" part="poi-menu" role="menu" hidden><ul></ul></div>
  <div class="modal map-info-modal" part="map-info-modal" hidden>
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="map-info-title">
      <div class="header">
        <h4 class="title" id="map-info-title" part="map-info-title"></h4>
        ${Ii("map-info-close")}
      </div>
      <div class="body">
        <dl class="map-meta" part="map-meta"></dl>
        <section class="map-cache" part="map-cache" hidden>
          <h5 class="cache-heading" part="cache-heading"></h5>
          <p class="cache-size" part="cache-size"></p>
          <p class="cache-buttons">
            <button type="button" class="cache-fetch btn-default" part="cache-fetch" hidden></button>
            <button type="button" class="cache-delete btn-default" part="cache-delete" disabled></button>
          </p>
        </section>
      </div>
    </div>
  </div>
  <div class="modal marker-list-modal" part="marker-list-modal" hidden>
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="marker-list-title">
      <div class="header">
        <h4 class="title" id="marker-list-title" part="marker-list-title"></h4>
        ${Ii("marker-list-close")}
      </div>
      <div class="body"><ul class="layers" part="marker-list-layers"></ul></div>
    </div>
  </div>
  <div class="modal poi-modal" part="poi-modal" hidden>
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="poi-title">
      <div class="header">
        <h4 class="title" id="poi-title" part="poi-title"></h4>
        ${Ii("poi-close")}
      </div>
      <div class="body" part="poi-body"></div>
      <div class="poi-share recipient" part="poi-share" hidden>${Cs("view")}
        <div class="qr" part="poi-qr"></div>
      </div>
    </div>
  </div>
  <div class="modal share-modal" part="share-modal" hidden>
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <div class="header">
        <h4 class="title" id="share-title" part="share-title"></h4>
        ${Ii("share-close")}
      </div>
      <div class="body">
        <section class="share-section recipient" part="share-app" data-share-kind="app">
          <h5 class="share-heading"></h5>${Cs("app")}
          <div class="qr" part="share-qr-app"></div>
        </section>
        <section class="share-section recipient" part="share-view" data-share-kind="view" hidden>
          <h5 class="share-heading"></h5>${Cs("view")}
          <div class="qr" part="share-qr-view"></div>
        </section>
      </div>
    </div>
  </div>
  <div class="modal gps-modal" part="gps-modal" hidden>
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="gps-title">
      <div class="header">
        <h4 class="title" id="gps-title" part="gps-title"></h4>
        ${Ii("gps-close")}
      </div>
      <div class="body"><p class="gps-message" part="gps-message"></p></div>
    </div>
  </div>
  <div class="modal help-modal" part="help-modal" hidden>
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="help-title">
      <div class="header">
        <h4 class="title" id="help-title" part="help-title"></h4>
        ${Ii("help-close")}
      </div>
      <div class="body help-body" part="help-body"></div>
    </div>
  </div>
  <div class="splash" part="splash" hidden>
    <div class="splash-inner">
      <p class="splash-title" part="splash-title"></p>
      <p class="splash-loading" part="splash-loading"></p>
      <p class="splash-image" part="splash-image" hidden><img class="splash-img" part="splash-img" alt=""></p>
    </div>
  </div>
  <div class="toast" part="toast" role="status" aria-live="polite"></div>
</div>`;
var et, m, Ke, An, ln, Yt, R, Xt, Si, Ft, qe, Qe, X, V, J, ve, W, Jt, Dt, Kt, St, zi, ye, _e, Pi, we, xe, gn, $e, ft, bt, ti, cn, ei, In, ke, lt, Cn, hn, pt, oe, Ei, ii, ae, ot, qt, Nt, Qt, Wt, gt, Me, Se, Ti, pn, Ae, dn, un, le, ge, ze, ni, Li, _t, Pe, Ee, mn, ar, s, Gn, Ms, Ss, LA, He, Hn, zs, Ji, Be, Bn, RA, OA, XA, Ps, DA, NA, Es, WA, Ts, jA, Ls, Rs, ZA, Ki, GA, HA, BA, Os, UA, kt, VA, At, de, ue, me, YA, Xs, Un, FA, Ds, Ns, JA, Ws, qi, js, Zs, Vn, Yn, KA, qA, QA, _A, $A, Gs, tl, Hs, Bs, Fn, Jn, Kn, qn, el, Us, il, pi, Qi, Vs, Ys, Ut, Qn, nl, rl, Fs, _n, _i, Js, $i, Ks, di, $n, sl, ol, tn, ui, mi, qs, Qs, _s, $s, to, al, eo, Lt, tr, io, Al, ll, no, gl, ro, so, fi, cl, oo, Il, er, en, bi, ao, ne, Cl, hl, pl, ir, Ao, lo, nr, go, Mt, rr, dl, ul, ml, co, Io, ht, vi, re, Co, ho, fl, po, bl, uo, sr, j, mo, yi;
const wo = class wo extends SI {
  constructor() {
    super();
    v(this, s);
    /** 層 B の実装名。 */
    Or(this, "implementation", "ui");
    /** 実装の版。 */
    Or(this, "version", bI);
    v(this, et);
    v(this, m);
    v(this, Ke, "none");
    v(this, An, (t) => {
      if (["Shift", "Control", "Alt", "Meta"].includes(t.key)) return;
      d(this, Ke, "keyboard");
      const e = a(this, et).activeElement;
      e instanceof HTMLButtonElement && e.matches(".modal .close") && delete e.dataset.focusOrigin;
    });
    v(this, ln, () => {
      d(this, Ke, "pointer");
    });
    // プロパティのみのキー（層 A へ流すもの・restore・appOption）の値
    v(this, Yt, /* @__PURE__ */ new Map());
    v(this, R, null);
    // 今の子へ層 B が流したキー（近い方が勝つ: 子が自分で持つキーには触れない）。子ごとに持つ（FLOWED_BY_CHILD）
    v(this, Xt, /* @__PURE__ */ new Set());
    // 層 B の属性を自分で書き戻している最中（attributeChangedCallback で子へ流し直さない）
    v(this, Si, !1);
    // 状態 URL の値で、起動時に層 B の map-id・transparency より強くするもの（「属性への書き戻し」）
    v(this, Ft, /* @__PURE__ */ new Map());
    v(this, qe, null);
    v(this, Qe, Ka());
    v(this, X, !1);
    v(this, V, 0);
    v(this, J, []);
    // 範囲を持つ地図に割り振った枠線の色（mapID → 16 進の色。listMaps の順に ENVELOPE_COLORS を回す）
    v(this, ve, /* @__PURE__ */ new Map());
    v(this, W, null);
    // 最後に選んだ古地図（重ね地図）。ベースマップの上でもこの地図の範囲を塗る（旧 UI のスワイパーの選択）
    v(this, Jt, null);
    v(this, Dt, null);
    v(this, Kt, null);
    v(this, St, null);
    // 表示中の POI の数（poi_number。0 ならマーカー一覧のボタンを隠す＝旧 no_poi）
    v(this, zi, 0);
    // 汎用メニュー（part="poi-menu"。旧 UI の contextmenu）。ボタンの data-index で引く。
    // 1 つだけ持ち、重なった POI の選択も旧 API の showContextMenu もこの一般形を使う（二重にしない）。
    v(this, ye, []);
    // メニューの項目を作り直す関数（言語の切り替え用）。null なら #menuItems のまま
    v(this, _e, null);
    v(this, Pi, "");
    // 重なった POI のメニューに出している POI（言語の切り替えで項目を作り直すために持つ）
    v(this, we, []);
    // clickMarker を受けて、同じ拍に clickMarkers が来なければ単独で開く（旧 UI は clickMarkers だけを見る）
    v(this, xe, null);
    // 地図（子の要素）の最後の pointerdown の位置（選択メニューの位置。子の要素の DOM の pointerdown）
    v(this, gn, null);
    v(this, $e, !1);
    // 地図の切り替えスライダー（左＝背景の地図・右＝重ねる地図）
    v(this, ft, null);
    v(this, bt, null);
    // 重ねる地図のスライダーの中央のカード（枠線の塗りを先に追従させる。旧 updateEnvelope の isActive）
    v(this, ti, null);
    v(this, cn, /* @__PURE__ */ new Set());
    v(this, ei, null);
    // 読み込んだ言語ファイルの辞書（内蔵の辞書 + 旧 UI の言語ファイル。null は内蔵の辞書だけ）。
    // 読み込みは非同期なので、ready と言語の切り替えのときに読み終えてから描く（#reloadLang）。
    v(this, In, null);
    // 言語の読み込みの世代（読み込み中に言語を切り替えたら、古い読み込みの結果で描かない）
    v(this, ke, 0);
    // 起動時だけ効く層 B のキーの起動時の値（最初の #setup で取る。以後の変更は警告して無視）
    v(this, lt, null);
    // appOption の起動時の値（同上。層 B の appOption は起動時だけ効くので、要素自身の読み
    // （currentLang・pwa-manifest の既定の appId・プロパティの読み）はこの値を見る。起動後の代入は子へ流すだけ）
    v(this, Cn);
    // 旧 API の pwaWorker: false / null（disablePwaWorker）。Service Worker を登録しない
    v(this, hn, !1);
    // 状態 URL（state-url）: 起動時に URL から読んだ復元値（子の restore として流す）
    v(this, pt, null);
    // 子が restore を自分で持つ・子の作成が先に始まっていた → ready の後に changeMap で当てる
    v(this, oe, !1);
    // URL から状態を当てている間は URL を書かない（旧 restoring）
    v(this, Ei, !1);
    // 最後に書いた状態 URL（"#!" の後ろ。同じなら書かない。旧 pathThatSet）
    v(this, ii);
    v(this, ae, null);
    // 枠線の表示（層 B の拡張キー showBorder。描画は #updateEnvelope が層 A の setEnvelopes で行う）
    v(this, ot, !1);
    // マーカーの非表示（旧 setHideMarker。層 A の hideAllMarkers / showAllMarkers が真実を持つ）
    v(this, qt, !1);
    // タイルキャッシュ（地図情報の画面）: 一括取得の実行中か・取得中の地図・最後に読んだ統計・描画のまとめ
    v(this, Nt, !1);
    // 取得中の地図（取得を始めたときの mapID。表示は今の地図と同じときだけ「取得中」にする）
    v(this, Qt, null);
    v(this, Wt);
    v(this, gt, 0);
    // 統計の読み取りの世代（地図情報を閉じた・地図を替えた・言語を変えたら古い読み取りを捨てる）。
    // 一括取得の印とは分ける（取得は閉じる・言語・地図の切り替えでは捨てない）
    v(this, Me, 0);
    // 一括取得の印（進み具合と終わりの受け取り。取得を始めるたび・止めるときに増やす）
    v(this, Se, 0);
    // 起動時の拡張キー（restore・状態 URL・restoreSession の showBorder・openedMarker）を当てたか
    v(this, Ti, !1);
    v(this, pn, !1);
    // 最後の GPS の結果のエラー（旧 lastGPSError。alwaysGpsOn のときの GPS ボタンの再表示に使う）
    v(this, Ae);
    // 範囲外・GPS エラーのモーダルに出している内容（開いたまま言語を変えたら、これで題名と本文を描き直す）
    v(this, dn, !1);
    v(this, un);
    // 開いているモーダルと、開く前にフォーカスがあった要素（閉じたときにそこへ戻す。<dialog> を使わずに
    // WAI-ARIA の dialog の作法を満たすための要件: フォーカスを戻す・背景を inert にする）
    v(this, le, /* @__PURE__ */ new Map());
    // モーダルを開いたときに自分で inert を付けた背景の要素（閉じるときはこれだけを外す。
    // ページ側が light DOM の子に付けていた inert は触らない）
    v(this, ge, /* @__PURE__ */ new Set());
    // モーダルを開いている間だけ light DOM の子の出し入れを見張る（足された子にも inert を付け、
    // 外へ移された子からは自分が付けた inert を外す）
    v(this, ze, null);
    v(this, ni);
    // スプラッシュ（旧 initSplash）: 起動時に 1 回だけ出し、fade の後に隠す
    v(this, Li, !1);
    v(this, _t);
    // スプラッシュの時間（200/1000 ms）は来たが、地図の準備がまだ（旧 ui_init.ts:501 は準備の後に隠す）
    v(this, Pe, !1);
    // 操作ボタンの自動非表示（旧 setMapOnOff。層 A から層 B へ移した tap-duration / tap-ui-vanish）
    v(this, Ee);
    // app-envelope（開発用）: 起動時に 1 回だけ範囲の包囲矩形を console に出す
    v(this, mn, !1);
    // タッチ端末（旧 "ontouchstart" in window。ズームのボタンを隠す）
    v(this, ar, typeof window < "u" && "ontouchstart" in window);
    d(this, et, this.attachShadow({ mode: "open" }));
    const t = document.createElement("style");
    t.textContent = aI, a(this, et).appendChild(t);
    const e = document.createElement("template");
    e.innerHTML = UI, a(this, et).appendChild(e.content);
    const n = (o) => a(this, et).querySelector(o);
    d(this, m, {
      frame: n(".frame"),
      title: n(".map-title"),
      titleText: n(".map-title .text"),
      switcher: n(".map-switcher"),
      zoomIn: n(".zoom-in"),
      zoomOut: n(".zoom-out"),
      gps: n(".ctl-gps"),
      home: n(".ctl-home"),
      compass: n(".ctl-compass"),
      needle: n(".ctl-compass .needle"),
      infoButton: n(".ctl-info"),
      borderButton: n(".ctl-border"),
      hideMarkerButton: n(".ctl-hide-marker"),
      info: n(".map-info-modal"),
      infoTitle: n(".map-info-modal .title"),
      infoClose: n(".map-info-modal .close"),
      infoMeta: n(".map-info-modal dl.map-meta"),
      cacheSection: n(".map-info-modal .map-cache"),
      cacheHeading: n(".map-info-modal .cache-heading"),
      cacheSize: n(".map-info-modal .cache-size"),
      cacheFetch: n(".map-info-modal .cache-fetch"),
      cacheDelete: n(".map-info-modal .cache-delete"),
      slider: n(".slider"),
      markerListButton: n(".ctl-marker-list"),
      markerList: n(".marker-list-modal"),
      markerListTitle: n(".marker-list-modal .title"),
      markerListClose: n(".marker-list-modal .close"),
      markerLayers: n(".marker-list-modal ul.layers"),
      poiMenu: n(".poi-menu"),
      poiMenuList: n(".poi-menu ul"),
      modal: n(".poi-modal"),
      poiTitle: n(".poi-modal .title"),
      poiClose: n(".poi-modal .close"),
      poiBody: n(".poi-modal .body"),
      poiShare: n(".poi-modal .poi-share"),
      poiQr: n(".poi-modal .poi-share .qr"),
      shareButton: n(".ctl-share"),
      share: n(".share-modal"),
      shareTitle: n(".share-modal .title"),
      shareClose: n(".share-modal .close"),
      shareApp: n('.share-modal [data-share-kind="app"]'),
      shareView: n('.share-modal [data-share-kind="view"]'),
      qrApp: n('.share-modal [data-share-kind="app"] .qr'),
      qrView: n('.share-modal [data-share-kind="view"] .qr'),
      gpsModal: n(".gps-modal"),
      gpsTitle: n(".gps-modal .title"),
      gpsMessage: n(".gps-modal .gps-message"),
      gpsClose: n(".gps-modal .close"),
      helpButton: n(".ctl-help"),
      help: n(".help-modal"),
      helpTitle: n(".help-modal .title"),
      helpClose: n(".help-modal .close"),
      helpBody: n(".help-modal .body"),
      splash: n(".splash"),
      splashTitle: n(".splash .splash-title"),
      splashLoading: n(".splash .splash-loading"),
      splashImage: n(".splash .splash-image"),
      splashImg: n(".splash .splash-img"),
      toast: n(".toast")
    }), a(this, ar) && a(this, m).frame.classList.add("touch"), A(this, s, JA).call(this), A(this, s, Ws).call(this);
  }
  static get observedAttributes() {
    return [
      "lang",
      ...Fi.map((t) => t.attr),
      ...Je.map((t) => t.attr)
    ];
  }
  // ---- ライフサイクル ----
  connectedCallback() {
    for (const t of [...Je, ...Fi])
      A(this, s, mo).call(this, t.prop);
    for (const t of is) A(this, s, mo).call(this, t.prop);
    if (typeof document < "u" && document.readyState === "loading") {
      a(this, ei) || (d(this, ei, () => {
        d(this, ei, null), A(this, s, Ss).call(this);
      }), document.addEventListener("DOMContentLoaded", a(this, ei), {
        once: !0
      }));
      return;
    }
    A(this, s, Ss).call(this);
  }
  disconnectedCallback() {
    queueMicrotask(() => {
      this.isConnected || (A(this, s, Ts).call(this), a(this, ae) && typeof window < "u" && window.removeEventListener("hashchange", a(this, ae)), d(this, ae, null));
    });
  }
  attributeChangedCallback(t, e, n) {
    if (e === n || a(this, Si)) return;
    if (t === "lang") {
      A(this, s, qi).call(this);
      return;
    }
    const o = Fa.get(t);
    if (o) {
      if (o.startup) {
        a(this, lt) && A(this, s, uo).call(this, o, `attribute "${t}"`);
        return;
      }
      o === be && (A(this, s, Vs).call(this), A(this, s, j).call(this, be) !== !0 && A(this, s, Ut).call(this), A(this, s, Qn).call(this)), o === xs && A(this, s, Jn).call(this), o === ks && A(this, s, Vn).call(this), o === wi && (A(this, s, j).call(this, wi) !== !0 && a(this, ot) && this.setShowBorder(!1), A(this, s, qn).call(this)), o === an && A(this, s, Qi).call(this), o === Fe && (A(this, s, nr).call(this), A(this, s, j).call(this, Fe) !== !0 && A(this, s, Mt).call(this)), yI.has(o) && !a(this, m).help.hidden && A(this, s, $n).call(this);
      return;
    }
    const g = vI.get(t);
    g && (a(this, Ft).delete(g.prop), A(this, s, Ki).call(this, g.prop));
  }
  // ---- 状態の読み取り----
  /** 子の ready の後、UI の部品（地図の一覧・題名・ボタンの状態）が揃ったときに解決する。 */
  get ready() {
    return a(this, Qe).promise;
  }
  /** 使っている子（層 A の公開面だけを持つ要素）。子を見つける・作る前は null。 */
  get app() {
    return a(this, R);
  }
  /**
   * 解決後の言語（lang 属性 → appOption.lang（移行用・起動時の値）→ 設定ファイルの lang → ブラウザ）。
   * appOption は起動時だけ効くので、起動後に代入してもこの解決は変わらない。
   */
  get currentLang() {
    const t = this.getAttribute("lang"), e = A(this, s, Hn).call(this)?.lang, n = A(this, s, sr).call(this)?.lang, o = t || typeof e == "string" && e || typeof n == "string" && n || Vc() || "en";
    return bA(o);
  }
  // ---- メソッド----
  /** 多言語の文字列から currentLang の値を選ぶ（旧 MaplatUi.translate。HTMLElement.translate と衝突させない）。 */
  translateText(t) {
    return qc(t, this.currentLang);
  }
  /** UI の文言（旧 MaplatUi.t。言語ファイルを読み終えるまでは内蔵の辞書を使う）。 */
  t(t, e) {
    return Kc(
      this.currentLang,
      t,
      e,
      a(this, In) ?? void 0
    );
  }
  /** POI の吹き出しを id で開く（旧 handleMarkerActionById）。地図の準備前・見つからないときは何もしない。 */
  openMarker(t) {
    const e = a(this, R);
    if (!e || !a(this, X)) return;
    let n;
    try {
      n = e.getMarker(t);
    } catch {
      n = void 0;
    }
    n && A(this, s, vi).call(this, n);
  }
  /**
   * 枠線の表示を切り替える（旧 setShowBorder）。層 A の状態に拡張キー showBorder（1/0）として載せ
   * （restoreSession の localStorage・updateState に乗る）、層 A の setEnvelopes で地図の範囲を描く
   * （supports("envelopes") が偽の層 A では何も描かない）。状態 URL の sb にも書く。地図の準備前は何もしない。
   */
  setShowBorder(t) {
    !a(this, R) || !a(this, X) || (d(this, ot, !!t), a(this, ft)?.setShowBorder(a(this, ot)), a(this, bt)?.setShowBorder(a(this, ot)), A(this, s, At).call(this, "requestUpdateState", (e) => e.requestUpdateState({ showBorder: t ? 1 : 0 })), A(this, s, pi).call(this), A(this, s, qn).call(this), A(this, s, kt).call(this));
  }
  /**
   * 指定した経緯度に重なる（範囲を持つ）地図の mapID を、範囲の狭い順に返す（旧 ui_marker.ts の
   * xyToMapIDs）。層 A の公開面だけで求める: 画面の 4 隅（getViewExtent）と各地図の範囲
   * （getMapEnvelope）を経緯度で比べる（old は merc と turf を使っていた）。
   * 今の地図は候補から外し、範囲の面積が画面の面積の threshold 倍以上の地図は外す（旧と同じ既定 10）。
   * 地図の準備前は空の配列。
   */
  async mapsAt(t, e = 10) {
    const n = a(this, R);
    if (!n || !a(this, X) || !t) return [];
    const o = A(this, s, Gn).call(this, () => n.getViewExtent()), g = Array.isArray(o) && o.length >= 3 ? Va(o) : 0, c = n.currentMapId ?? a(this, W), C = [];
    for (const h of a(this, J)) {
      if (!h.hasEnvelope || h.mapID === c) continue;
      const f = A(this, s, Gn).call(this, () => n.getMapEnvelope(h.mapID));
      if (!Array.isArray(f) || f.length < 3 || !fI(t, f)) continue;
      const w = Va(f);
      g > 0 && w / g < e && C.push({ mapID: h.mapID, area: w });
    }
    return C.sort((h, f) => h.area - f.area), C.map((h) => h.mapID);
  }
  /**
   * マーカーの表示を切り替える（旧 setHideMarker）。層 A の hideAllMarkers / showAllMarkers を呼ぶ
   * （層 A が同じ値を状態の hideMarker に書くので、restoreSession・updateState・状態 URL の hm に乗る）。
   * 地図の準備前は何もしない。
   */
  setHideMarker(t) {
    !a(this, R) || !a(this, X) || (d(this, qt, !!t), t ? A(this, s, At).call(this, "hideAllMarkers", (e) => e.hideAllMarkers()) : A(this, s, At).call(this, "showAllMarkers", (e) => e.showAllMarkers()), A(this, s, Qi).call(this), A(this, s, kt).call(this));
  }
  /**
   * 共有する URL（旧 getShareUrl と同じ）。"view" は今の表示の URL（state-url なら状態を書いてから読む）、
   * "app" は ? と # を落としたアプリの URL。
   */
  getShareUrl(t) {
    return t === "view" && A(this, s, kt).call(this), II(
      t,
      typeof location < "u" ? location.href : ""
    );
  }
  /**
   * 短い知らせを出す（旧 showToast。旧は document.body に置いていた。ここでは Shadow DOM の中に置く）。
   * target を渡すとその近く（.recipient の囲みがあればその中央）に、無ければ下の中央に 1.5 秒出す。
   */
  showToast(t, e) {
    const n = e && typeof e.getBoundingClientRect == "function" ? e.closest?.(".recipient") ?? e : null;
    A(this, s, Ms).call(this, t, OI, (o) => {
      if (n) {
        const g = n.getBoundingClientRect();
        o.left = `${g.left + g.width / 2}px`, o.top = `${g.top + g.height / 2}px`, o.bottom = "auto", o.transform = "translate(-50%, -50%)";
      } else
        o.left = "50%", o.top = "auto", o.bottom = "30px", o.transform = "translateX(-50%)";
    });
  }
  // ---- 旧 UI の互換層（src/legacy/）のための口（移行期だけ）----
  //
  // ここから下はすべて @internal。層 B の公開面（公開の 8 メソッド）には数えない。
  // 旧 API（MaplatUi）の外形を保つために、互換層が要素の部品へ委譲するだけの口を置く。
  // 旧 API は 1.x の間ずっと残す（メジャー版まで）ので、この口も残す。
  /**
   * 言語ファイルの読み込みが済むまで待つ。
   * @internal 旧 UI の onUiConfigure は i18n を読んでから利用者の hook を呼んでいた
   *   （`docs/ui-core-lifecycle.md` の「What Maplat UI does per phase」を参照）。
   *   互換層はこの口を待ってから hook を呼ぶ。読み込みに失敗しても reject しない（en へ落ちる）。
   */
  whenI18nReady() {
    return A(this, s, js).call(this);
  }
  /** @internal 状態 URL を今の状態で書き直す（旧 MaplatUi.updateUrl）。 */
  refreshStateUrl() {
    A(this, s, kt).call(this);
  }
  /** @internal 枠線（envelope）を描き直す（旧 MaplatUi.updateEnvelope）。 */
  refreshEnvelopes() {
    A(this, s, pi).call(this);
  }
  /** @internal スライダーの見出しを詰め直す（旧 MaplatUi.ellips の移設先。`ellipsize` を呼ぶ）。 */
  refreshEllipsis() {
    a(this, ft)?.refresh(), a(this, bt)?.refresh();
  }
  /** @internal その地図がその行のスライダーにあるか（旧 checkOverlayID。overlay は重ねる地図の行）。 */
  hasMap(t, e = "overlay") {
    return typeof t == "string" && t !== "" ? this.slider(e)?.hasMap(t) === !0 : !1;
  }
  /**
   * @internal 旧 API の `pwaWorker: false / null`（Service Worker を登録しない。manifest は足す）。
   *   互換層が起動前に呼ぶ。属性の `pwa-worker` には「登録しない」の値が無いので、移行期の口として置く。
   */
  disablePwaWorker() {
    d(this, hn, !0);
  }
  /**
   * @internal POI のメディアの表示部品（`@c4h/quyuan` の `qy-swiper` 等）を先に読み込む。
   *   旧 UI は起動時に Chuci を静的に import して登録していた（旧 ui_marker.ts）。旧 API の利用者は
   *   起動の後に `cc-swiper` を自分のページで使えたので、互換層が起動時に呼ぶ（新 UI は最初のメディアで読む）。
   *   Quyuan は同梱の Chuci の `cc-*` を未登録のときだけ登録する ∴ 起動の後も `cc-swiper` は使える。
   */
  preloadMediaViewer() {
    return gs();
  }
  /**
   * @internal 透過度のスライダーを使える・使えないにする（旧 `sliderNew.setEnable`。互換層が委譲する）。
   *   旧と同じく次の地図の切り替えで「重ね地図のときだけ使える」に戻る。
   */
  setTransparencyEnabled(t) {
    a(this, m).slider.disabled = !t;
  }
  /** @internal 地図の切り替えスライダー（旧 baseSwiper / overlaySwiper の facade が委譲する先）。 */
  slider(t) {
    return t === "base" ? a(this, ft) : a(this, bt);
  }
  /** @internal 文言のキーが訳せるか（旧 i18n.exists の近似。キーのままなら訳が無い）。 */
  hasTranslation(t) {
    return this.t(t) !== t;
  }
  /**
   * 旧 modalSetting(type) の名前で画面を開く。
   * @internal 旧 UI は 1 つのモーダルに class を付け替えていた。ここでは画面ごとの部品を開く。
   *   種類: load（スプラッシュ）・poi・share・help・map（地図情報）・marker_list・gpsD（範囲外）。
   *   地図の準備前は何もしない（旧は core-ready の後に配線していた）。
   */
  openModalByLegacyName(t) {
    switch (t) {
      case "load":
        A(this, s, Ps).call(this);
        return;
      case "poi":
        a(this, St) && A(this, s, ue).call(this, a(this, m).modal);
        return;
      case "share":
        A(this, s, Ys).call(this);
        return;
      case "help":
        A(this, s, Ks).call(this);
        return;
      case "map":
        A(this, s, eo).call(this);
        return;
      case "marker_list":
        A(this, s, go).call(this);
        return;
      case "gpsD":
        A(this, s, _i).call(this, !0);
        return;
      case "gpsW":
        A(this, s, _i).call(this, !1);
        return;
      default:
        A(this, s, yi).call(this, `modal:${t}`, `<${tt}>: unknown legacy modal "${t}"; nothing was opened.`);
    }
  }
  /**
   * 汎用のメニューを開く。
   * @internal 旧 UI の互換層（showContextMenu）と POI の重なりの両方が使う。移行期の口。
   */
  showMenu(t) {
    !t || !Array.isArray(t.items) || (d(this, we, []), A(this, s, co).call(this, () => t.items, {
      at: t.at,
      label: t.label
    }));
  }
  /** メニューを閉じる。@internal 互換層の contextMenu facade も使う。 */
  closeMenu() {
    A(this, s, ht).call(this);
  }
};
et = new WeakMap(), m = new WeakMap(), Ke = new WeakMap(), An = new WeakMap(), ln = new WeakMap(), Yt = new WeakMap(), R = new WeakMap(), Xt = new WeakMap(), Si = new WeakMap(), Ft = new WeakMap(), qe = new WeakMap(), Qe = new WeakMap(), X = new WeakMap(), V = new WeakMap(), J = new WeakMap(), ve = new WeakMap(), W = new WeakMap(), Jt = new WeakMap(), Dt = new WeakMap(), Kt = new WeakMap(), St = new WeakMap(), zi = new WeakMap(), ye = new WeakMap(), _e = new WeakMap(), Pi = new WeakMap(), we = new WeakMap(), xe = new WeakMap(), gn = new WeakMap(), $e = new WeakMap(), ft = new WeakMap(), bt = new WeakMap(), ti = new WeakMap(), cn = new WeakMap(), ei = new WeakMap(), In = new WeakMap(), ke = new WeakMap(), lt = new WeakMap(), Cn = new WeakMap(), hn = new WeakMap(), pt = new WeakMap(), oe = new WeakMap(), Ei = new WeakMap(), ii = new WeakMap(), ae = new WeakMap(), ot = new WeakMap(), qt = new WeakMap(), Nt = new WeakMap(), Qt = new WeakMap(), Wt = new WeakMap(), gt = new WeakMap(), Me = new WeakMap(), Se = new WeakMap(), Ti = new WeakMap(), pn = new WeakMap(), Ae = new WeakMap(), dn = new WeakMap(), un = new WeakMap(), le = new WeakMap(), ge = new WeakMap(), ze = new WeakMap(), ni = new WeakMap(), Li = new WeakMap(), _t = new WeakMap(), Pe = new WeakMap(), Ee = new WeakMap(), mn = new WeakMap(), ar = new WeakMap(), s = new WeakSet(), /** 公開面のメソッドを呼び、失敗したら undefined（mapsAt の補助）。 */
Gn = function(t) {
  try {
    return t();
  } catch (e) {
    console.warn(`<${tt}>: mapsAt failed`, e);
    return;
  }
}, /**
 * トーストの本体。1 枚を使い回すので、続けて出すと文言を替えて時間を測り直す（後の知らせが見える）。
 * 位置は place が決める。幅の指定は毎回消してから place に渡す。
 */
Ms = function(t, e, n) {
  const o = a(this, m).toast;
  o.textContent = String(t), o.style.width = "", o.style.maxWidth = "", n(o.style), o.classList.add("show"), a(this, ni) && clearTimeout(a(this, ni)), d(this, ni, setTimeout(() => {
    d(this, ni, void 0), o.classList.remove("show");
  }, e));
}, // ---- 子の <maplat-app> ----
Ss = function() {
  if (!this.isConnected) return;
  A(this, s, LA).call(this);
  const t = A(this, s, NA).call(this);
  if (t)
    (t !== a(this, R) || !a(this, qe)) && A(this, s, Es).call(this, t);
  else {
    const e = document.createElement(zt);
    e.setAttribute("slot", "map"), A(this, s, Es).call(this, e), this.appendChild(e);
  }
  document.addEventListener("keydown", a(this, An), !0), document.addEventListener("pointerdown", a(this, ln), !0), A(this, s, DA).call(this);
}, /** 起動（最初の #setup）: 起動時だけ効く層 B のキーの値を取り、状態 URL の監視を始める。 */
LA = function() {
  if (!a(this, lt)) {
    const t = /* @__PURE__ */ new Map();
    for (const e of Fi)
      e.startup && t.set(e.prop, A(this, s, j).call(this, e));
    d(this, lt, t), d(this, Cn, a(this, Yt).get("appOption"));
  }
  A(this, s, He).call(this) && !a(this, ae) && typeof window < "u" && (d(this, ae, () => A(this, s, UA).call(this)), window.addEventListener("hashchange", a(this, ae)));
}, /** state-url が起動時に真だったか。 */
He = function() {
  return a(this, lt)?.get(zA.prop) === !0;
}, /**
 * 要素自身が読む appOption（層 B の appOption は起動時だけ効く）。
 * 起動後は起動時の値（起動前は与えられた値）を返す。起動後の代入は子へ流すだけで、
 * 層 B の読み（言語の解決・pwa-manifest の既定の appId・このプロパティの読み）には効かせない。
 */
Hn = function() {
  return a(this, lt) ? a(this, Cn) : a(this, Yt).get("appOption");
}, // ---- 操作ボタンの自動非表示（旧 src/index.ts:1070-1123 の setMapOnOff）----
/**
 * 自動非表示の対象（旧 Core の setMapOnOff が隠す .ol-control 全部）。旧は透過度のスライダー・
 * 地図の切り替えのスワイパー・題名も .ol-control だった（旧 ui_init.ts:1486-1492）。
 */
zs = function() {
  return Array.from(
    a(this, et).querySelectorAll(
      ".ctl, .slider, .map-title, .map-slider"
    )
  );
}, Ji = function(t) {
  for (const e of A(this, s, zs).call(this))
    e.classList.toggle("fade", t);
}, Be = function() {
  a(this, Ee) && (clearTimeout(a(this, Ee)), d(this, Ee, void 0));
}, /** tap-duration の後にボタンを戻す（旧 moveend の setTimeout）。 */
Bn = function() {
  A(this, s, Be).call(this), d(this, Ee, setTimeout(() => {
    d(this, Ee, void 0), A(this, s, Ji).call(this, !1);
  }, A(this, s, OA).call(this)));
}, /**
 * 地図のクリック（旧 mapObject の click）。表示中ならすぐ戻し、隠れていれば tapUIVanish のときだけ
 * 隠して tap-duration の後に戻す（旧と同じ分岐）。
 */
RA = function() {
  A(this, s, Be).call(this);
  const t = A(this, s, zs).call(this), e = t.length > 0 && t[0].classList.contains("fade");
  if (!A(this, s, XA).call(this) || e) {
    A(this, s, Ji).call(this, !1);
    return;
  }
  A(this, s, Ji).call(this, !0), A(this, s, Bn).call(this);
}, /**
 * tap-duration（属性 → 3000。0 も有効）。
 * 要素（新インタフェース）は設定ファイルの機能系キーを読まない
 * （`tapDuration`・`tapUIVanish` が名指しされている）。旧クラスだけが設定ファイルを読む。
 */
OA = function() {
  const t = A(this, s, j).call(this, kA);
  return typeof t == "number" && Number.isFinite(t) && t >= 0 ? t : 3e3;
}, /**
 * tap-ui-vanish（属性 → false。旧名 tapUIVanish）。
 * 設定ファイルの `tapUIVanish` は読まない（上の `#tapDuration` の注釈と同じ）。
 */
XA = function() {
  const t = A(this, s, j).call(this, MA);
  return typeof t == "boolean" ? t : !1;
}, /**
 * スプラッシュ（旧 initSplash）。旧と同じく、起動時に復元する地図（initialRestore.mapID。
 * 状態 URL・restore・map-id で決まったものを含む）が無いときだけ出す。題名は appName、
 * 設定ファイルの splash があれば img/ の下の画像を出す（無ければ読み込み中の文言だけ）。
 * 表示は旧と同じく、画像ありは 1000 ms・無しは 200 ms で隠す。
 */
Ps = function() {
  if (a(this, Li)) return;
  d(this, Li, !0);
  const t = a(this, R);
  if (t)
    try {
      if (t.initialRestore?.mapID) return;
    } catch {
    }
  const e = A(this, s, sr).call(this), n = a(this, m);
  n.splashTitle.textContent = this.translateText(e?.appName) || "";
  const o = typeof e?.splash == "string" ? e.splash : "", g = o !== "" ? Ye($r(o, "img")) : void 0;
  g !== void 0 ? (n.splashImg.src = g, n.splashImage.hidden = !1) : (n.splashImg.removeAttribute("src"), n.splashImage.hidden = !0), n.splash.hidden = !1, d(this, Pe, !1), a(this, _t) && clearTimeout(a(this, _t)), d(this, _t, setTimeout(
    () => {
      if (d(this, _t, void 0), !a(this, X)) {
        d(this, Pe, !0);
        return;
      }
      n.splash.hidden = !0;
    },
    g !== void 0 ? 1e3 : 200
  ));
}, /**
 * PWA を有効にする（pwa-manifest が起動時に与えられていたら 1 回だけ。旧 initPwa）。
 * pwa-manifest が true なら既定のパス ./pwa/${appId}_manifest.json（appId は子の app-id ＞ appOption ＞ "sample"）。
 */
DA = function() {
  if (a(this, pn) || !a(this, lt)) return;
  const t = a(this, lt).get(PA.prop);
  if (t === void 0 || t === !1) return;
  d(this, pn, !0);
  let e;
  if (t === !0) {
    const n = A(this, s, Hn).call(this);
    e = `./pwa/${a(this, R)?.appId ?? // 子の登録の前（公開面がまだ無い）でも属性は読める
    a(this, R)?.getAttribute("app-id") ?? (typeof n?.appid == "string" ? n.appid : void 0) ?? (typeof n?.appId == "string" ? n.appId : void 0) ?? "sample"}_manifest.json`;
  } else
    e = String(t);
  $c({
    manifest: e,
    worker: a(this, hn) ? null : a(this, lt).get(EA.prop),
    scope: a(this, lt).get(TA.prop)
  });
}, NA = function() {
  for (const t of Array.from(this.children))
    if (t.localName === zt && t.getAttribute("slot") === "map")
      return t;
  return null;
}, Es = function(t) {
  A(this, s, Ts).call(this);
  const e = ++Et(this, V)._;
  d(this, R, t);
  let n = Ya.get(t);
  n || (n = /* @__PURE__ */ new Set(), Ya.set(t, n)), d(this, Xt, n), ss.has(t) || ss.set(
    t,
    new Set(
      rs.filter((y) => t.hasAttribute(y.attr)).map(
        (y) => y.prop
      )
    )
  ), d(this, X, !1), d(this, J, []), a(this, ve).clear(), d(this, W, null), d(this, Jt, null), d(this, Dt, null), d(this, Kt, null), d(this, ii, void 0), d(this, pt, A(this, s, He).call(this) ? Ba(typeof location < "u" ? location.hash : "") : null), d(this, oe, !1), d(this, Ft, /* @__PURE__ */ new Map()), a(this, pt) && (typeof a(this, pt).mapID == "string" && a(this, Ft).set("mapId", a(this, pt).mapID), typeof a(this, pt).transparency == "number" && a(this, Ft).set("transparency", a(this, pt).transparency)), a(this, Qe).settled && d(this, Qe, Ka());
  const o = a(this, Qe);
  A(this, s, jA).call(this), A(this, s, qi).call(this);
  const g = MI.map((y) => [
    y,
    (P) => {
      e === a(this, V) && A(this, s, GA).call(this, y, P.detail);
    }
  ]);
  for (const [y, P] of g) t.addEventListener(y, P);
  const c = (y) => {
    if (e !== a(this, V)) return;
    const P = y;
    d(this, gn, { clientX: P.clientX, clientY: P.clientY }), a(this, m).poiMenu.hidden || (A(this, s, ht).call(this), y.stopPropagation());
  };
  t.addEventListener("pointerdown", c, !0);
  const C = () => {
    e === a(this, V) && (a(this, m).info.hidden || A(this, s, gl).call(this));
  };
  t.addEventListener(Ja, C);
  let h = null, f = !1;
  const w = (y) => {
    if (e !== a(this, V)) return;
    const P = y;
    P.pointerType === "mouse" && P.button !== 0 || (f = !1, h = { x: P.clientX, y: P.clientY });
  }, z = (y) => {
    if (e !== a(this, V) || !h) return;
    const P = y;
    Math.hypot(P.clientX - h.x, P.clientY - h.y) < 4 || (f = !0, A(this, s, Be).call(this), A(this, s, Ji).call(this, !0));
  }, L = () => {
    h = null, f && A(this, s, Bn).call(this);
  }, N = () => {
    e === a(this, V) && (f || A(this, s, RA).call(this));
  };
  t.addEventListener("pointerdown", w, !0), t.addEventListener("pointermove", z, !0), t.addEventListener("pointerup", L, !0), t.addEventListener("pointercancel", L, !0), t.addEventListener("click", N);
  const M = typeof MutationObserver < "u" ? new MutationObserver(() => {
    e === a(this, V) && A(this, s, Rs).call(this, t);
  }) : null;
  M?.observe(t, {
    attributes: !0,
    attributeFilter: rs.map((y) => y.attr)
  }), d(this, qe, () => {
    for (const [y, P] of g)
      t.removeEventListener(y, P);
    t.removeEventListener("pointerdown", c, !0), t.removeEventListener(Ja, C), t.removeEventListener("pointerdown", w, !0), t.removeEventListener("pointermove", z, !0), t.removeEventListener("pointerup", L, !0), t.removeEventListener("pointercancel", L, !0), t.removeEventListener("click", N), A(this, s, Be).call(this), M?.disconnect();
  }), A(this, s, WA).call(this, t, e).then(
    async (y) => {
      !y || e !== a(this, V) || (await A(this, s, js).call(this), e === a(this, V) && (A(this, s, HA).call(this, t), o.resolve(), this.dispatchEvent(
        new CustomEvent("uiReady", {
          bubbles: !0,
          composed: !1,
          detail: {}
        })
      )));
    },
    (y) => {
      e === a(this, V) && o.reject(y);
    }
  );
}, WA = async function(t, e) {
  return typeof customElements < "u" && await customElements.whenDefined(zt), e !== a(this, V) ? !1 : (await t.ready, e === a(this, V));
}, Ts = function() {
  var t;
  document.removeEventListener("keydown", a(this, An), !0), document.removeEventListener(
    "pointerdown",
    a(this, ln),
    !0
  ), d(this, Ke, "none"), Et(this, V)._++, Et(this, ke)._++, (t = a(this, qe)) == null || t.call(this), d(this, qe, null), d(this, X, !1), d(this, xe, null), Et(this, Me)._++, Et(this, Se)._++, d(this, Nt, !1), d(this, Qt, null), d(this, Wt, void 0), a(this, gt) && (cancelAnimationFrame(a(this, gt)), d(this, gt, 0)), A(this, s, ht).call(this), A(this, s, Mt).call(this), A(this, s, Lt).call(this), A(this, s, re).call(this), A(this, s, Ut).call(this), A(this, s, di).call(this), A(this, s, $i).call(this), A(this, s, Ds).call(this), d(this, Ae, void 0), A(this, s, Be).call(this), a(this, _t) && (clearTimeout(a(this, _t)), d(this, _t, void 0)), d(this, Pe, !1), a(this, m).splash.hidden = !0, d(this, Li, !1);
}, // ---- 層 A のキーの流し方----
jA = function() {
  for (const t of Je) A(this, s, Ki).call(this, t.prop);
  for (const t of is) A(this, s, Ki).call(this, t.prop);
}, /**
 * 子が自分で持つキーか（子に属性で書かれた・子のプロパティが undefined でない）。状態のキー（map-id 等）は
 * 子が内部の操作の結果を自分の属性へ書き戻すので、最初に繋いだ時点で子に書かれていたかで決める。
 */
Ls = function(t, e) {
  const n = ns.get(e);
  if (n?.state) {
    const o = ss.get(t);
    return o ? o.has(e) : t.hasAttribute(n.attr);
  }
  return n ? t.hasAttribute(n.attr) : t[e] !== void 0;
}, /** 子が書き戻した状態を、層 B が流しているキーに限り層 B の属性へ映す（流し直さない）。 */
Rs = function(t) {
  for (const e of rs) {
    if (!a(this, Xt).has(e.prop) || !this.hasAttribute(e.attr)) continue;
    const n = t.getAttribute(e.attr);
    if (!(n === null || n === this.getAttribute(e.attr))) {
      d(this, Si, !0);
      try {
        this.setAttribute(e.attr, n);
      } finally {
        d(this, Si, !1);
      }
    }
  }
}, /**
 * 層 B に与えられた値。restore は状態 URL の復元値があればそれ（URL が restore より強い。旧と同じく丸ごと
 * 置き換える）、層 B の拡張キーを除く。restoreExtensionKeys は層 B の拡張キー showBorder を足す
 * （restoreSession の localStorage から層 A が読む）。
 */
ZA = function(t) {
  const e = ns.get(t);
  if (e) return A(this, s, j).call(this, e);
  const n = a(this, Yt).get(t);
  if (t === "restore") {
    const o = a(this, pt) ?? n;
    if (!o || typeof o != "object") return;
    const g = { ...o };
    for (const c of os) delete g[c];
    return Object.keys(g).length > 0 ? g : void 0;
  }
  if (t === "restoreExtensionKeys") {
    const o = Array.isArray(n) ? n.filter((g) => typeof g == "string") : [];
    return o.includes("showBorder") ? o : [...o, "showBorder"];
  }
  return n;
}, Ki = function(t) {
  const e = a(this, R);
  if (!e) return;
  const n = ns.get(t);
  if (n && a(this, Ft).has(t)) {
    if (!a(this, Xt).has(t) && A(this, s, Ls).call(this, e, t)) {
      d(this, oe, !0);
      return;
    }
    A(this, s, j).call(this, n) !== void 0 && a(this, Xt).add(t);
    const g = nn(n, a(this, Ft).get(t));
    g != null && e.getAttribute(n.attr) !== g && e.setAttribute(n.attr, g);
    return;
  }
  if (!a(this, Xt).has(t) && A(this, s, Ls).call(this, e, t)) {
    t === "restore" && a(this, pt) && d(this, oe, !0);
    return;
  }
  const o = A(this, s, ZA).call(this, t);
  if (o === void 0) {
    if (!a(this, Xt).has(t)) return;
    a(this, Xt).delete(t), n ? e.removeAttribute(n.attr) : e[t] = null;
    return;
  }
  if (a(this, Xt).add(t), n) {
    const g = nn(n, o);
    g == null ? e.removeAttribute(n.attr) : e.getAttribute(n.attr) !== g && e.setAttribute(n.attr, g);
  } else
    e[t] = o, t === "restore" && a(this, pt) && e.restore !== o && d(this, oe, !0);
}, // ---- 層 A のイベント ----
GA = function(t, e) {
  switch (t) {
    case "lifecycle:appdata-ready":
      A(this, s, Ps).call(this), A(this, s, qi).call(this), A(this, s, Vn).call(this);
      break;
    case "mapChanged":
      d(this, W, e?.mapID ?? null), A(this, s, Us).call(this, a(this, W)), d(this, Dt, e ?? null), A(this, s, Yn).call(this), A(this, s, _A).call(this), A(this, s, Hs).call(this), a(this, we).length > 0 && A(this, s, ht).call(this), a(this, X) && A(this, s, lo).call(this), a(this, m).markerList.hidden || A(this, s, rr).call(this), A(this, s, pi).call(this), a(this, m).info.hidden || A(this, s, tr).call(this), A(this, s, kt).call(this);
      break;
    case "changeViewpoint":
      e && typeof e == "object" && d(this, Kt, { ...e }), A(this, s, Jn).call(this);
      break;
    case "gpsEnabledChanged":
      A(this, s, Bs).call(this, !!e?.enabled);
      break;
    case "updateState": {
      const n = e && typeof e == "object" ? e : void 0, o = n?.transparency;
      typeof o == "number" && !a(this, $e) && (a(this, m).slider.value = `${100 - o}`), typeof n?.hideMarker == "number" && (d(this, qt, n.hideMarker !== 0), A(this, s, Qi).call(this)), A(this, s, kt).call(this);
      break;
    }
    case "outOfMap":
      A(this, s, Fs).call(this, Is.view);
      break;
    case "gps_error":
      A(this, s, _i).call(this, !1, typeof e == "string" ? e : void 0);
      break;
    case "gps_result": {
      const n = e && typeof e == "object" ? e.error : void 0;
      if (typeof n != "string") {
        d(this, Ae, void 0);
        break;
      }
      if (n === "gps_off") {
        d(this, Ae, void 0);
        break;
      }
      if (n === "gps_out_hide") {
        d(this, Ae, "gps_out");
        break;
      }
      if (d(this, Ae, n), a(this, R)?.alwaysGpsOn === !0 && n === "gps_out") break;
      n === "gps_out" ? A(this, s, _n).call(this, Is.gpsOff) : A(this, s, _i).call(this, !1, n);
      break;
    }
    case "moveEnd":
      e && typeof e == "object" && d(this, Kt, { ...e }), A(this, s, kt).call(this), A(this, s, Be).call(this), A(this, s, Bn).call(this);
      break;
    case "clickMarker": {
      if (!e || typeof e != "object") break;
      const n = e;
      d(this, xe, n), queueMicrotask(() => {
        a(this, xe) === n && (d(this, xe, null), A(this, s, vi).call(this, n));
      });
      break;
    }
    case "clickMarkers": {
      d(this, xe, null);
      const n = Array.isArray(e) ? e.filter(
        (o) => !!o && typeof o == "object"
      ) : [];
      n.length === 1 ? A(this, s, vi).call(this, n[0]) : n.length > 1 && A(this, s, ul).call(this, n);
      break;
    }
    case "poi_number":
      typeof e == "number" && (d(this, zi, e), A(this, s, nr).call(this));
      break;
  }
}, HA = function(t) {
  d(this, X, !0), a(this, Ft).clear(), A(this, s, Rs).call(this, t);
  try {
    d(this, J, t.listMaps());
  } catch {
    d(this, J, []);
  }
  if (A(this, s, el).call(this), d(this, W, t.currentMapId ?? a(this, W)), A(this, s, Us).call(this, a(this, W)), a(this, W) && (!a(this, Dt) || a(this, Dt).mapID !== a(this, W)))
    try {
      d(this, Dt, t.getMapMeta(a(this, W)) ?? null);
    } catch {
      d(this, Dt, null);
    }
  d(this, Kt, t.viewpoint ?? a(this, Kt)), a(this, m).title.hidden = !1, A(this, s, QA).call(this), A(this, s, KA).call(this), A(this, s, Yn).call(this), A(this, s, Hs).call(this), A(this, s, Bs).call(this, t.gpsEnabled), A(this, s, Jn).call(this), A(this, s, lo).call(this), A(this, s, Vs).call(this), A(this, s, al).call(this), A(this, s, qn).call(this), A(this, s, Qi).call(this), A(this, s, Zs).call(this), A(this, s, Vn).call(this), A(this, s, BA).call(this, t), a(this, Pe) && (d(this, Pe, !1), a(this, m).splash.hidden = !0);
}, /**
 * 起動時の状態を当てる（旧 initUiFromAppData の restore・restoreSession の分岐と、状態 URL の 2 回目以降の経路）。
 *   - 状態 URL を子の restore で渡せなかったら（子が restore を持つ・子の作成が先に始まっていた）changeMap で当てる
 *   - 層 B の拡張キー: restore（状態 URL を含む）が与えられていればその showBorder・hideMarker・openedMarker、
 *     無ければ restoreSession の localStorage の showBorder・hideMarker（層 A が restoreExtensionKeys で読んだ
 *     initialRestore。hideMarker は層 A の initialRestore に元から載る）
 * 2 回目以降（子を繋ぎ直した）は今の showBorder・hideMarker を新しい子に載せ直すだけ。
 */
BA = function(t) {
  const e = a(this, V);
  let n = a(this, ot), o = a(this, qt), g;
  if (!a(this, Ti)) {
    d(this, Ti, !0);
    const h = a(this, pt) ?? a(this, Yt).get("restore");
    if (h && typeof h == "object")
      n = !!h.showBorder, o = !!h.hideMarker, typeof h.openedMarker == "string" && h.openedMarker && (g = h.openedMarker);
    else if (t.restoreSession === !0) {
      const f = A(this, s, bl).call(this, t);
      n = !!parseInt(String(f.showBorder ?? "0"), 10), o = !!parseInt(String(f.hideMarker ?? "0"), 10);
    } else
      n = !1, o = !1;
  }
  const c = () => {
    e === a(this, V) && (this.setShowBorder(n), (o || a(this, qt)) && this.setHideMarker(o), g && this.openMarker(g), A(this, s, kt).call(this));
  }, C = a(this, pt);
  C && a(this, oe) && C.mapID ? (d(this, oe, !1), A(this, s, Os).call(this, C, c)) : c();
}, /** URL から読んだ復元値を changeMap で当てる（旧 index.ts の 2 回目以降の経路）。当てている間は URL を書かない。 */
Os = function(t, e) {
  const n = a(this, R), o = t.mapID;
  if (!n || !o) return;
  const g = a(this, V), c = { ...t };
  for (const C of os) delete c[C];
  d(this, Ei, !0), Promise.resolve(n.ready).then(() => n.changeMap(o, c)).catch(
    (C) => console.warn(`<${tt}>: failed to restore the state URL`, C)
  ).finally(() => {
    g === a(this, V) && (d(this, Ei, !1), e ? e() : A(this, s, kt).call(this));
  });
}, /** URL の hash が変わった（戻る・進む・手で書き換えた）: 地図があればその状態へ移す（旧 page.js の処理）。 */
UA = function() {
  if (!A(this, s, He).call(this) || !a(this, R) || !a(this, X)) return;
  const t = Ba(location.hash);
  t && (d(this, ii, void 0), A(this, s, Os).call(this, t));
}, /**
 * 今の状態を URL の "#!" の後ろに書く（旧 updateUrl。state-url のときだけ）。地図・背景地図・透過度は層 A の
 * state、視点は viewpoint（x・y・zoom・rotation）、枠線・開いた POI は層 B の状態から。
 * 履歴は増やさない（history.replaceState。旧 page.js は pushState だった）。
 */
kt = function() {
  if (!A(this, s, He).call(this) || a(this, Ei)) return;
  const t = a(this, R);
  if (!t || !a(this, X) || typeof location > "u") return;
  const e = t.currentMapId ?? a(this, W);
  if (!e) return;
  let n;
  try {
    n = t.state ?? {};
  } catch {
    n = {};
  }
  const o = t.viewpoint ?? a(this, Kt), g = typeof n.transparency == "number" ? n.transparency : A(this, s, po).call(this, t), c = a(this, St)?.namespaceID, C = mI({
    mapID: e,
    backgroundID: typeof n.backgroundID == "string" ? n.backgroundID : void 0,
    transparency: g,
    x: o?.x,
    y: o?.y,
    zoom: o?.zoom,
    rotation: o?.rotation,
    showBorder: a(this, ot),
    hideMarker: typeof n.hideMarker == "number" ? n.hideMarker !== 0 : a(this, qt),
    hideLayer: typeof n.hideLayer == "string" ? n.hideLayer : void 0,
    openedMarker: typeof c == "string" ? c : void 0
  });
  if (C !== a(this, ii)) {
    d(this, ii, C);
    try {
      const h = new URL(location.href);
      h.hash = `!${C}`, history.replaceState(history.state, "", h.href);
    } catch (h) {
      console.warn(`<${tt}>: failed to update the state URL`, h);
    }
  }
}, /** restore を起動後に代入した: 層 B の拡張キーは起動時だけ読む（i'）ので警告する（層 A の分は子が警告する）。 */
VA = function(t) {
  if (!a(this, Ti) || !t || typeof t != "object")
    return;
  const e = t;
  os.some((n) => e[n] !== void 0) && A(this, s, yi).call(this, "startup:restore", `<${tt}>: "showBorder" / "openedMarker" of property "restore" are read only at startup; the change was ignored (use setShowBorder() / openMarker()).`);
}, /** 準備の済んだ子にだけ操作を渡す（準備前の押下は何もしない）。 */
At = function(t, e) {
  const n = a(this, R);
  if (!(!n || !a(this, X)))
    try {
      const o = e(n);
      o && typeof o.catch == "function" && o.catch(
        (g) => console.warn(`<${tt}>: ${t} failed`, g)
      );
    } catch (o) {
      console.warn(`<${tt}>: ${t} failed`, o);
    }
}, /** フォーカスは保ち、キーボードの操作が無い移動だけ囲いを抑える。 */
de = function(t) {
  a(this, Ke) === "keyboard" ? delete t.dataset.focusOrigin : t.dataset.focusOrigin = "script", t.focus({ preventScroll: !0 });
}, /** モーダルを開く共通の入口: 開く前のフォーカスを覚え、背景を inert にする。 */
ue = function(t) {
  if (!a(this, le).has(t)) {
    const e = a(this, et).activeElement ?? document.activeElement;
    a(this, le).set(t, e), A(this, s, Xs).call(this);
  }
  t.hidden = !1;
}, /** モーダルを閉じる共通の出口: 背景の inert を外し、開く前にフォーカスがあった要素へ戻す。 */
me = function(t) {
  t.hidden = !0;
  const e = a(this, le).get(t);
  a(this, le).delete(t) && (A(this, s, Xs).call(this), !(!this.isConnected || !A(this, s, YA).call(this, e)) && e.focus({ preventScroll: !0 }));
}, /** フォーカスを戻せる要素か（まだ DOM にあり、hidden で隠されていないこと）。 */
YA = function(t) {
  if (!t || !t.isConnected) return !1;
  for (let e = t; e; e = e.parentElement)
    if (e.hasAttribute("hidden")) return !1;
  return !0;
}, /**
 * モーダルを開いている間だけ背景（地図・コントロール類）を inert にする。モーダル自身とトーストは
 * 除く（トーストは開いたままのモーダルから出す知らせなので、知らせを届けるために残す）。
 * 入れ子があり得るので、最後のモーダルを閉じたときに外す。開く前から inert だった要素
 * （ページ側が付けたもの）は覚えておかず、閉じても外さない。
 */
Xs = function() {
  if (a(this, le).size === 0) {
    A(this, s, Ds).call(this);
    for (const t of a(this, ge)) t.removeAttribute("inert");
    a(this, ge).clear();
    return;
  }
  A(this, s, FA).call(this);
  for (const t of a(this, m).frame.children) A(this, s, Un).call(this, t);
  for (const t of this.children) A(this, s, Un).call(this, t);
}, /** 背景の 1 要素に inert を付けて覚える（モーダル・トースト・前から inert の要素は除く）。 */
Un = function(t) {
  t.classList.contains("modal") || t === a(this, m).toast || t.hasAttribute("inert") || (t.setAttribute("inert", ""), a(this, ge).add(t));
}, FA = function() {
  a(this, ze) || typeof MutationObserver > "u" || (d(this, ze, new MutationObserver(
    (t) => A(this, s, Ns).call(this, t)
  )), a(this, ze).observe(this, {
    childList: !0,
    subtree: !0,
    attributes: !0,
    attributeFilter: ["inert"],
    attributeOldValue: !0
  }));
}, /** 見張りを止める。止める前に届いていない知らせは処理する（外へ移された子の扱いを取りこぼさない）。 */
Ds = function() {
  const t = a(this, ze);
  if (!t) return;
  d(this, ze, null);
  const e = t.takeRecords();
  t.disconnect(), A(this, s, Ns).call(this, e);
}, /**
 * light DOM の出し入れと inert の変更を背景の規則に合わせる。
 * - 足された子: モーダルが開いていれば、ほかの背景と同じ規則で inert を付ける
 * - 外へ移された子: もう背景ではないので、自分が付けた inert をその時点で外して忘れる
 *   （同じ拍でページが inert を付け直していれば、それはページのものなので外さない）
 * - 自分が付けた inert をページが付け直した・外した: ページのものとして扱い、閉じても触らない
 */
Ns = function(t) {
  t.forEach((e, n) => {
    if (e.type === "attributes") {
      e.oldValue !== null && a(this, ge).delete(e.target);
      return;
    }
    for (const o of e.removedNodes) {
      if (!(o instanceof Element) || !a(this, ge).has(o) || o.parentNode === this) continue;
      a(this, ge).delete(o), t.slice(n + 1).some((c) => c.type === "attributes" && c.target === o) || o.removeAttribute("inert");
    }
    if (a(this, le).size !== 0)
      for (const o of e.addedNodes)
        o instanceof Element && o.parentNode === this && A(this, s, Un).call(this, o);
  });
}, // ---- 部品 ----
JA = function() {
  const t = a(this, m);
  a(this, et).addEventListener("focusout", (e) => {
    const n = e.target;
    n instanceof HTMLButtonElement && n.matches(".modal .close") && delete n.dataset.focusOrigin;
  }), t.zoomIn.addEventListener(
    "click",
    () => A(this, s, At).call(this, "zoomBy", (e) => e.zoomBy(1))
  ), t.zoomOut.addEventListener(
    "click",
    () => A(this, s, At).call(this, "zoomBy", (e) => e.zoomBy(-1))
  ), t.home.querySelector("button").addEventListener(
    "click",
    () => A(this, s, At).call(this, "goHome", (e) => e.goHome())
  ), t.compass.querySelector("button").addEventListener(
    "click",
    () => A(this, s, At).call(this, "compass", (e) => A(this, s, Fn).call(this) ? e.resetDirection() : e.resetRotation())
  ), t.gps.querySelector("button").addEventListener(
    "click",
    () => A(this, s, At).call(this, "handleGPS", (e) => {
      if (e.alwaysGpsOn === !0) {
        const n = e.handleGPS(!0);
        return a(this, Ae) === "gps_out" && A(this, s, Fs).call(this, Is.gpsKept), n;
      }
      return e.handleGPS(!e.gpsEnabled);
    })
  ), t.slider.addEventListener("pointerdown", () => {
    d(this, $e, !0);
  }), t.slider.addEventListener("change", () => {
    d(this, $e, !1);
  }), t.slider.addEventListener("input", () => {
    const e = 100 - Number(t.slider.value);
    A(this, s, At).call(this, "setTransparency", (n) => n.setTransparency(e));
  }), A(this, s, qA).call(this), t.poiClose.addEventListener("click", () => A(this, s, re).call(this)), t.modal.addEventListener("click", (e) => {
    e.target === t.modal && A(this, s, re).call(this);
  }), t.infoButton.querySelector("button").addEventListener("click", () => A(this, s, eo).call(this)), t.infoClose.addEventListener("click", () => A(this, s, Lt).call(this)), t.info.addEventListener("click", (e) => {
    e.target === t.info && A(this, s, Lt).call(this);
  }), t.cacheFetch.addEventListener("click", () => {
    A(this, s, Cl).call(this);
  }), t.cacheDelete.addEventListener("click", () => {
    A(this, s, pl).call(this);
  }), t.borderButton.querySelector("button").addEventListener("click", () => this.setShowBorder(!a(this, ot))), t.hideMarkerButton.querySelector("button").addEventListener("click", () => this.setHideMarker(!a(this, qt))), t.markerListButton.querySelector("button").addEventListener("click", () => A(this, s, go).call(this)), t.markerListClose.addEventListener("click", () => A(this, s, Mt).call(this)), t.markerList.addEventListener("click", (e) => {
    e.target === t.markerList && A(this, s, Mt).call(this);
  }), t.shareButton.querySelector("button").addEventListener("click", () => A(this, s, Ys).call(this)), t.shareClose.addEventListener("click", () => A(this, s, Ut).call(this)), t.share.addEventListener("click", (e) => {
    e.target === t.share && A(this, s, Ut).call(this);
  }), t.helpButton.querySelector("button").addEventListener("click", () => A(this, s, Ks).call(this)), t.helpClose.addEventListener("click", () => A(this, s, di).call(this)), t.help.addEventListener("click", (e) => {
    e.target === t.help && A(this, s, di).call(this);
  }), t.gpsClose.addEventListener("click", () => A(this, s, $i).call(this)), t.gpsModal.addEventListener("click", (e) => {
    e.target === t.gpsModal && A(this, s, $i).call(this);
  }), a(this, et).addEventListener("click", (e) => {
    const n = e.target?.closest?.(
      "button[data-share]"
    );
    n && A(this, s, nl).call(this, n);
  }), t.poiMenu.addEventListener("click", (e) => {
    const n = e.target?.closest?.(
      "button[data-index]"
    );
    if (!n) return;
    const o = a(this, ye)[Number(n.dataset.index)];
    if (A(this, s, ht).call(this), !!o?.callback)
      try {
        o.callback();
      } catch (g) {
        console.warn(
          `<${tt}>: a menu item callback threw an error.`,
          g
        );
      }
  }), a(this, et).addEventListener("pointerdown", (e) => {
    if (t.poiMenu.hidden) return;
    const n = e.composedPath();
    n.includes(t.poiMenu) || a(this, R) && n.includes(a(this, R)) || A(this, s, ht).call(this);
  }), a(this, et).addEventListener("keydown", (e) => {
    e.key === "Escape" && (t.share.hidden ? t.help.hidden ? t.gpsModal.hidden ? t.info.hidden ? t.modal.hidden ? t.poiMenu.hidden ? t.markerList.hidden || A(this, s, Mt).call(this) : A(this, s, ht).call(this) : A(this, s, re).call(this) : A(this, s, Lt).call(this) : A(this, s, $i).call(this) : A(this, s, di).call(this) : A(this, s, Ut).call(this));
  });
}, Ws = function() {
  const t = a(this, m);
  t.zoomIn.title = this.t("control.zoom_in"), t.zoomIn.setAttribute("aria-label", t.zoomIn.title), t.zoomOut.title = this.t("control.zoom_out"), t.zoomOut.setAttribute("aria-label", t.zoomOut.title);
  const e = (o, g) => {
    const c = o.querySelector("button");
    c.title = this.t(g), c.setAttribute("aria-label", c.title);
  };
  e(t.home, "control.home"), e(t.gps, "control.gps"), e(
    t.compass,
    A(this, s, Fn).call(this) ? "control.compass_north" : "control.compass"
  ), t.slider.title = this.t("control.trans"), t.slider.setAttribute("aria-label", t.slider.title);
  const n = [
    [a(this, ft), "slider.base"],
    [a(this, bt), "slider.overlay"]
  ];
  for (const [o, g] of n)
    o && (o.setGroupLabel(this.t(g)), o.setNavLabels({
      prev: this.t("slider.prev"),
      next: this.t("slider.next")
    }), o.refresh());
  for (const o of [t.poiClose, t.markerListClose])
    o.querySelector(".sr-only").textContent = this.t("html.close"), o.title = this.t("html.close");
  e(t.markerListButton, "control.marker_list"), t.markerListTitle.textContent = this.t("html.marker_list_title"), e(t.infoButton, "control.info"), e(t.borderButton, "control.border"), e(t.hideMarkerButton, "control.hide_marker"), t.infoClose.querySelector(".sr-only").textContent = this.t("html.close"), t.infoClose.title = this.t("html.close"), t.cacheFetch.textContent = this.t(
    A(this, s, en).call(this) ? "html.cache_cancel" : "html.cache_fetch"
  ), t.cacheDelete.textContent = this.t("html.cache_delete"), t.poiMenu.setAttribute(
    "aria-label",
    a(this, Pi) || this.t("menu.poi_candidates")
  ), e(t.shareButton, "control.share"), t.shareTitle.textContent = this.t("html.share_title"), t.shareApp.querySelector(".share-heading").textContent = this.t(
    "html.share_app_title"
  ), t.shareView.querySelector(".share-heading").textContent = this.t(
    "html.share_state_title"
  ), t.shareClose.querySelector(".sr-only").textContent = this.t("html.close"), t.shareClose.title = this.t("html.close"), e(t.helpButton, "control.help"), t.helpTitle.textContent = this.t("html.help_title"), t.helpClose.querySelector(".sr-only").textContent = this.t("html.close"), t.helpClose.title = this.t("html.close"), t.gpsClose.querySelector(".sr-only").textContent = this.t("html.close"), t.gpsClose.title = this.t("html.close"), t.splashLoading.textContent = this.t("html.app_loading_body");
  for (const o of Array.from(
    a(this, et).querySelectorAll(".share-copy-label")
  ))
    o.textContent = this.t("html.share_copy");
  for (const o of Array.from(
    a(this, et).querySelectorAll(
      'button[data-share^="cp_"]'
    )
  ))
    o.title = this.t("html.share_copy");
  for (const o of Array.from(a(this, et).querySelectorAll("svg[data-url]")))
    o.setAttribute("aria-label", this.t("html.share_qr"));
}, /**
 * 言語ファイルを読み直してから描く（旧 UI の i18nLoader に当たる。ready と言語の切り替えで待つ）。
 * 読み込み中に言語が変わっていたら、古い読み込みの結果では描かない（最後の言語が勝つ）。
 */
qi = function() {
  const t = ++Et(this, ke)._;
  return Fc(this.currentLang).then((n) => {
    t === a(this, ke) && (d(this, In, n), A(this, s, Zs).call(this));
  });
}, js = async function() {
  for (; ; ) {
    const t = A(this, s, qi).call(this), e = a(this, ke);
    if (await t, e === a(this, ke)) return;
  }
}, Zs = function() {
  A(this, s, Ws).call(this), A(this, s, Yn).call(this), a(this, m).markerList.hidden || A(this, s, rr).call(this), a(this, m).poiMenu.hidden || (a(this, _e) && d(this, ye, a(this, _e).call(this)), A(this, s, Io).call(this)), a(this, m).info.hidden || A(this, s, tr).call(this), a(this, m).help.hidden || A(this, s, $n).call(this), a(this, m).gpsModal.hidden || A(this, s, Js).call(this), a(this, St) && A(this, s, ho).call(this, a(this, St));
}, Vn = function() {
  if (A(this, s, j).call(this, ks) === !1 || typeof document > "u")
    return;
  const t = A(this, s, sr).call(this)?.appName;
  if (t == null) return;
  const e = this.translateText(t);
  e && (document.title = e);
}, Yn = function() {
  const t = a(this, Dt), e = t ? this.translateText(t.officialTitle || t.title || t.label) : void 0;
  a(this, m).titleText.textContent = e || t?.mapID || "";
}, /**
 * app-envelope（開発用。旧 ui_init.ts:471-499 の appBbox）。範囲を持つ全地図の包囲矩形を
 * [minLng, minLat, maxLng, maxLat] の順で 1 回だけ console に出す。起動時のみのキー（i'）。
 */
KA = function() {
  if (a(this, mn) || (d(this, mn, !0), A(this, s, j).call(this, SA) !== !0)) return;
  const t = a(this, R);
  if (!t) return;
  const e = [];
  for (const n of a(this, J)) {
    if (!n.hasEnvelope) continue;
    const o = A(this, s, Gn).call(this, () => t.getMapEnvelope(n.mapID));
    if (Array.isArray(o))
      for (const g of o)
        e.length === 0 ? (e[0] = e[2] = g.longitude, e[1] = e[3] = g.latitude) : (g.longitude < e[0] && (e[0] = g.longitude), g.longitude > e[2] && (e[2] = g.longitude), g.latitude < e[1] && (e[1] = g.latitude), g.latitude > e[3] && (e[3] = g.latitude));
  }
  console.log(`This app's envelope is: ${e}`);
}, /**
 * 地図の切り替えスライダーを 2 本作る（左＝背景の地図・右＝重ねる地図）。
 * `listMaps` の並びは `#renderMaps` で渡す。地図を変えるのは `onSelect` だけで、
 * 部品が自分で動き始めるので、ここから `step()` は呼ばない。
 */
qA = function() {
  const t = (e) => new oI({
    kind: e,
    items: [],
    translate: (n) => this.translateText(n) ?? "",
    groupLabel: this.t(e === "base" ? "slider.base" : "slider.overlay"),
    navLabels: {
      prev: this.t("slider.prev"),
      next: this.t("slider.next")
    },
    // サムネイルの無い地図は、要素が既に持っているプレースホルダを使う（2 つ目を作らない）
    placeholder: (n) => A(this, s, tl).call(this, n),
    onSelect: (n, o) => A(this, s, $A).call(this, e, n, o),
    onActiveChange: e === "overlay" ? (n) => A(this, s, Gs).call(this, n) : void 0,
    onActivePreview: e === "overlay" ? (n) => A(this, s, Gs).call(this, n) : void 0
  });
  d(this, ft, t("base")), d(this, bt, t("overlay")), a(this, m).switcher.append(
    a(this, ft).element,
    a(this, bt).element
  ), a(this, ft).setShowBorder(a(this, ot)), a(this, bt).setShowBorder(a(this, ot));
}, /** `listMaps` を背景の地図と重ねる地図に分けて、2 本のスライダーへ渡す（旧 UI の 2 本）。 */
QA = function() {
  const t = a(this, ft), e = a(this, bt);
  if (!t || !e) return;
  const n = [], o = [];
  for (const c of a(this, J)) {
    const C = {
      mapID: c.mapID,
      label: c.label,
      thumbnail: c.thumbnail ?? null,
      hasEnvelope: !!c.hasEnvelope,
      envelopeColor: a(this, ve).get(c.mapID),
      isBasemap: !!c.isBasemap
    };
    (c.isBasemap ? n : o).push(C);
  }
  if (t.setItems(n), e.setItems(o), a(this, W))
    for (const c of [t, e])
      c.hasMap(a(this, W)) ? c.setSelectedMapID(a(this, W), !1) : c.setSelectedOnly(null);
  const g = a(this, J).find((c) => c.mapID === a(this, W));
  d(this, ti, g && !g.isBasemap ? a(this, W) : e.activeMapID ?? a(this, Jt)), t.setShowBorder(a(this, ot)), e.setShowBorder(a(this, ot)), A(this, s, pi).call(this);
}, /**
 * 今の地図に 2 本の選択を合わせる（`mapChanged`）。旧 ui_init.ts:173-174 と同じく両方に今の地図を
 * 渡し、今の地図が無い側は位置を保って `.selected` だけ外す（選択は今の地図にだけ付く）。
 */
_A = function() {
  const t = a(this, J).find((e) => e.mapID === a(this, W));
  for (const e of [a(this, ft), a(this, bt)])
    e && (e.hasMap(a(this, W)) ? e.setSelectedMapID(a(this, W)) : e.setSelectedOnly(null));
  t && !t.isBasemap && d(this, ti, t.mapID);
}, /**
 * スライダーのカードを選んだ（クリック・Enter）。押したカードは部品がもう動かし始めているので、
 * `step()` は呼ばない（呼ぶと 2 枚動く）。`.selected` だけ先に合わせてから地図を変える
 * （旧 ui_init.ts:582-585 と同じ順序）。
 */
$A = function(t, e, n) {
  t === "base" ? a(this, ft)?.setSelectedOnly(e) : a(this, bt)?.setSelectedOnly(e), e !== a(this, W) && A(this, s, At).call(this, "changeMap", (o) => o.changeMap(e));
}, /** 重ねる地図のスライダーの中央が変わった（drag 中は先に枠線の塗りだけ追従）。 */
Gs = function(t) {
  d(this, ti, t ?? a(this, Jt)), a(this, ot) && A(this, s, pi).call(this);
}, tl = function(t) {
  const e = document.createElement("span");
  return e.className = "thumb none", e.setAttribute("aria-hidden", "true"), e.textContent = Array.from(t)[0] ?? "?", e;
}, Hs = function() {
  const t = a(this, R), e = a(this, m).slider;
  if (!t || !a(this, X)) return;
  e.hidden = t.overlay === !1;
  const n = a(this, J).find((o) => o.mapID === a(this, W));
  e.disabled = !n || n.isBasemap, a(this, $e) || (e.value = `${100 - A(this, s, po).call(this, t)}`);
}, Bs = function(t) {
  a(this, m).gps.classList.toggle("disable", !t), a(this, m).gps.dataset.enabled = t ? "true" : "false";
}, /** コンパスを押したら北へ向けるか。auto は子の north-up に従う。 */
Fn = function() {
  const t = A(this, s, j).call(this, xs);
  return t === "north" ? !0 : t === "rotation" ? !1 : (t !== void 0 && t !== "auto" && A(this, s, yi).call(this, `compass-action:${t}`, `<${tt}>: invalid value "${t}" for attribute "compass-action" (use "auto" / "north" / "rotation"); treated as "auto".`), a(this, R)?.northUp === !0);
}, Jn = function() {
  const t = a(this, Kt), e = qa(t?.direction ?? 0), n = qa(t?.rotation ?? 0);
  a(this, m).needle.style.transform = `rotate(${e}deg)`;
  const o = A(this, s, Fn).call(this), g = o ? Math.abs(e) < 0.1 * 180 / Math.PI : Math.abs(n) < 1e-6;
  a(this, m).compass.classList.toggle("disable", g), a(this, m).compass.dataset.action = o ? "north" : "rotation";
  const c = a(this, m).compass.querySelector("button");
  c.title = this.t(o ? "control.compass_north" : "control.compass"), c.setAttribute("aria-label", c.title);
}, // ---- 枠線（旧 index.ts の updateEnvelope・setShowBorder・maplat_control.ts の Border）----
/** 層 A の機能の問い合わせ。実装による分岐には implementation を使わない。 */
Kn = function(t) {
  const e = a(this, R);
  if (!e || typeof e.supports != "function") return !1;
  try {
    return e.supports(t) === !0;
  } catch {
    return !1;
  }
}, /** enable-border が真で、層 A が範囲を描ける（supports("envelopes")）ときだけボタンを出す。 */
qn = function() {
  const t = A(this, s, j).call(this, wi) === !0 && a(this, X) && A(this, s, Kn).call(this, "envelopes");
  a(this, m).borderButton.hidden = !t, a(this, m).borderButton.querySelector("button").setAttribute("aria-pressed", a(this, ot) ? "true" : "false");
}, /**
 * 範囲を持つ地図に、listMaps の順で 25 色を順に割り振る（旧 ui_init.ts:473-497 と同じ規則。
 * 25 色を使い切ったら先頭へ戻る）。`#maps` を作り直すたびに呼ぶ。
 */
el = function() {
  a(this, ve).clear();
  let t = 0;
  for (const e of a(this, J))
    e.hasEnvelope && (a(this, ve).set(
      e.mapID,
      as[t % as.length]
    ), t++);
}, /** 地図が古地図（重ね地図）なら、最後に選んだ古地図として覚える（ベースマップでは変えない）。 */
Us = function(t) {
  if (!t) return;
  if (a(this, J).find((n) => n.mapID === t)?.isOldMap) {
    d(this, Jt, t);
    return;
  }
  a(this, Jt) || d(this, Jt, a(this, J).find((n) => n.isOldMap)?.mapID ?? null);
}, /**
 * 範囲を塗る地図: 今の地図が古地図ならその地図、ベースマップの上なら重ねる地図のスライダーの
 * 中央のカード（旧の isActive。drag 中は preview に追従する）。
 */
il = function() {
  return a(this, J).find((e) => e.mapID === a(this, W))?.isOldMap ? a(this, W) : a(this, ti) ?? a(this, Jt);
}, /**
 * 枠線を描き直す（旧 updateEnvelope）。層 A の setEnvelopes に、範囲を持つ地図（listMaps の hasEnvelope）の
 * 一覧を渡し、色は地図ごとの割り当て（ENVELOPE_COLORS）を使う。塗るのは今の古地図の範囲で、
 * ベースマップの上では最後に選んだ古地図の範囲（旧は重ね地図のスワイパーの選択中スライドを塗っていた）。
 * 非表示のときは空の配列で消す。supports("envelopes") が偽の層 A では何もしない。
 */
pi = function() {
  if (!a(this, R) || !a(this, X) || !A(this, s, Kn).call(this, "envelopes")) return;
  const e = [];
  if (a(this, ot)) {
    const n = A(this, s, il).call(this);
    for (const o of a(this, J)) {
      if (!o.hasEnvelope) continue;
      const g = a(this, ve).get(o.mapID) ?? as[0], c = {
        mapID: o.mapID,
        stroke: { ...wI, color: g }
      };
      o.mapID === n && (c.fill = xI(g)), e.push(c);
    }
  }
  A(this, s, At).call(this, "setEnvelopes", (n) => n.setEnvelopes(e));
}, // ---- マーカーの非表示（旧 ui_marker.ts の setHideMarker・maplat_control.ts の HideMarker）----
/** enable-hide-marker が真のときだけボタンを出す（押されている状態は aria-pressed で表す）。 */
Qi = function() {
  a(this, m).hideMarkerButton.hidden = !(A(this, s, j).call(this, an) === !0 && a(this, X)), a(this, m).hideMarkerButton.querySelector("button").setAttribute("aria-pressed", a(this, qt) ? "true" : "false");
}, // ---- 共有（旧 maplat_control.ts の Share・ui_init.ts の共有モーダルと共有ボタンの処理・ui_marker.ts の吹き出しの共有）----
/** enable-share が真のときだけボタンを出す（旧 enable_share）。 */
Vs = function() {
  a(this, m).shareButton.hidden = !(A(this, s, j).call(this, be) === !0 && a(this, X));
}, /** 共有のモーダルを開く: アプリの URL（と state-url なら今の表示の URL）の QR を出す。 */
Ys = function() {
  if (!a(this, X) || A(this, s, j).call(this, be) !== !0) return;
  A(this, s, ht).call(this), A(this, s, Mt).call(this), A(this, s, Lt).call(this), A(this, s, re).call(this);
  const t = a(this, m), e = A(this, s, He).call(this);
  t.shareView.hidden = !e, A(this, s, ue).call(this, t.share);
  const n = this.t("html.share_qr");
  es(t.qrApp, this.getShareUrl("app"), n), e && es(t.qrView, this.getShareUrl("view"), n), A(this, s, de).call(this, t.shareClose);
}, Ut = function() {
  A(this, s, me).call(this, a(this, m).share);
}, /** 吹き出しの共有（旧: enable-share かつ state-url のときだけ。QR は今の表示の URL＝開いた POI を含む）。 */
Qn = function() {
  const t = a(this, m), e = A(this, s, j).call(this, be) === !0 && A(this, s, He).call(this) && !!a(this, St);
  t.poiShare.hidden = !e, e ? es(
    t.poiQr,
    this.getShareUrl("view"),
    this.t("html.share_qr")
  ) : t.poiQr.replaceChildren();
}, /** 共有のボタン（data-share="cp_app" 等。旧と同じ「操作_種類」の形）。 */
nl = function(t) {
  const [e, n] = (t.dataset.share ?? "").split("_"), o = this.getShareUrl(n === "view" ? "view" : "app");
  e === "cp" ? A(this, s, rl).call(this, o).then(
    () => this.showToast(this.t("app.copy_toast"), t),
    (g) => console.warn(`<${tt}>: failed to copy the URL`, g)
  ) : e === "tw" ? window.open(
    CI(o, document.title),
    "_blank",
    "noopener,noreferrer"
  ) : e === "fb" && window.open(
    hI(o),
    "_blank",
    "width=650,height=450,menubar=no,toolbar=no,scrollbars=yes,noopener,noreferrer"
  );
}, rl = async function(t) {
  if (typeof navigator < "u" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(t);
    return;
  }
  const e = document.createElement("textarea");
  e.value = t, e.setAttribute("readonly", ""), e.style.position = "fixed", e.style.opacity = "0", document.body.appendChild(e);
  try {
    if (e.select(), !document.execCommand("copy")) throw new Error("copy was rejected");
  } finally {
    e.remove();
  }
}, // ---- 範囲外・GPS のエラー（旧 ui_init.ts:341-419 の initGpsHandlers・modal_gpsD）----
/** 範囲外を知らせる（旧 outOfMap の処理。presentation-mode が真なら出さない）。 */
Fs = function(t) {
  A(this, s, j).call(this, xA) !== !0 && A(this, s, _n).call(this, t);
}, /**
 * 知らせ（範囲外・開けないリンク）を、<maplat-ui> の箱の下端の中央にトーストで出す。操作を止めない知らせなので、
 * 開いている画面は閉じず、フォーカスも動かさない。地図の準備前は出さない。
 * トーストは position: fixed で CSS の割合が画面基準になるので、見えている箱の大きさを読んで幅を決める。
 */
_n = function(t) {
  if (!a(this, R) || !a(this, X)) return;
  const e = this.getBoundingClientRect(), n = Math.max(e.left, 0), o = Math.min(e.right, window.innerWidth), g = Math.min(e.bottom, window.innerHeight);
  A(this, s, Ms).call(this, this.t(t), DI, (c) => {
    c.left = `${(n + o) / 2}px`, c.top = `${g - NI}px`, c.bottom = "auto", c.transform = "translate(-50%, -100%)", c.width = "max-content", c.maxWidth = `${o - n - WI * 2}px`;
  });
}, /**
 * GPS のエラーのモーダル（旧 modal_gpsD。題名と本文だけの画面）。範囲外の文言は旧 API の
 * modalSetting("gpsD") から開くときだけ使う（範囲外の知らせ自体はトースト）。
 * 旧と同じ文言: 範囲外は app.out_of_map / app.out_of_map_area、エラーは app.gps_error と
 * 種類ごとの app.user_gps_deny・app.gps_miss・app.gps_timeout（知らない種類は app.gps_error）。
 * 地図の準備前は出さない（旧も core-ready の後に購読していた）。
 */
_i = function(t, e) {
  if (!a(this, R) || !a(this, X)) return;
  const n = a(this, m);
  d(this, dn, t), d(this, un, e), A(this, s, Js).call(this), A(this, s, ht).call(this), A(this, s, Mt).call(this), A(this, s, Lt).call(this), A(this, s, Ut).call(this), A(this, s, di).call(this), A(this, s, re).call(this), A(this, s, ue).call(this, n.gpsModal), A(this, s, de).call(this, n.gpsClose);
}, /**
 * モーダルの題名と本文を、覚えている内容（範囲外か・エラーの種類）と今の言語で描く
 * （開いたまま lang を変えたら #applyLang がここを呼ぶ）。
 */
Js = function() {
  const t = a(this, m), e = a(this, dn);
  t.gpsTitle.textContent = this.t(
    e ? "app.out_of_map" : "app.gps_error"
  ), t.gpsMessage.textContent = e ? this.t("app.out_of_map_area") : this.t(BI[a(this, un) ?? ""] ?? "app.gps_error");
}, $i = function() {
  A(this, s, me).call(this, a(this, m).gpsModal);
}, // ---- ヘルプ（旧 maplat_control.ts の Maplat ボタン・ui_init.ts の modal_help・html.help_*）----
/** ヘルプを開く（旧: 地図の click_control の "help"。地図の準備後だけ）。 */
Ks = function() {
  a(this, X) && (A(this, s, ht).call(this), A(this, s, Mt).call(this), A(this, s, Lt).call(this), A(this, s, Ut).call(this), A(this, s, re).call(this), A(this, s, $n).call(this), A(this, s, ue).call(this, a(this, m).help), A(this, s, de).call(this, a(this, m).helpClose));
}, di = function() {
  A(this, s, me).call(this, a(this, m).help);
}, /**
 * ヘルプの本文（旧 ui_init.ts:1527-1549 の modal_help_content と同じ並び: はじめに → 地図の操作 →
 * 地図の変更 → 現在地 → スポット → その他）。文言は html.help_*（値は信頼できるが、DOM へ入れる前に
 * sanitizeHtml を通す）。旧は ${xxx.png} を pointer_images の URL に差し替えていたが、層 B は画像を
 * 持たないので、同じ位置にボタンの SVG（src/icons.ts）と共通の画像（既定のピン・GPS の点）を置く。
 * その他の行（共有・枠線・マーカーの非表示・マーカー一覧）は enable-* のときだけ出す
 * （旧 CSS の &.enable_share .share_help 等と同じ規則）。
 * 冒頭の説明の後には、旧の fullscreen.png の位置に全体の図（#helpFigure）をその場で組む。
 */
$n = function() {
  const t = a(this, m).helpBody;
  t.replaceChildren();
  const e = (C, h) => {
    const f = document.createElement(C);
    return C === "p" && (f.className = "help-text"), A(this, s, _s).call(this, f, this.t(h)), t.appendChild(f), f;
  };
  e("p", "html.help_using_maplat"), t.appendChild(A(this, s, ol).call(this)), e("h4", "html.help_operation_title"), e("p", "html.help_operation_content"), e("h4", "html.help_selection_title"), e("p", "html.help_selection_content"), e("h4", "html.help_gps_title"), e("p", "html.help_gps_content"), e("h4", "html.help_poi_title"), e("p", "html.help_poi_content"), e("h4", "html.help_etc_title");
  const n = document.createElement("ul");
  n.className = "help-list";
  const o = (C) => {
    const h = document.createElement("li");
    A(this, s, _s).call(this, h, this.t(C)), n.appendChild(h);
  };
  o("html.help_etc_attr"), o("html.help_etc_help"), A(this, s, j).call(this, be) === !0 && o("html.help_share_help"), A(this, s, j).call(this, wi) === !0 && o("html.help_etc_border"), A(this, s, j).call(this, an) === !0 && o("html.help_etc_hide_marker"), A(this, s, j).call(this, Fe) === !0 && o("html.help_etc_marker_list"), o("html.help_etc_slider"), t.appendChild(n);
  const g = document.createElement("p");
  g.className = "help-footer";
  const c = document.createElement("a");
  c.href = "https://www.maplat.jp/", c.target = "_blank", c.rel = "noopener noreferrer", c.textContent = "Maplat", g.append(
    c,
    document.createTextNode(" © 2015- Kohei Otsuka, Code for History")
  ), t.appendChild(g);
}, /**
 * 全体の図の背景: 子（slot="map"）の地図の canvas（2D）を、画面に見えている位置と不透明度のまま
 * 1 枚の canvas に重ねて写す（背景の地図と重ねる地図の 2 つの層を含む）。縦長への切り出しは CSS の
 * object-fit: cover。画素は読み出さず写して見せるだけなので、タイルのサーバーが CORS を返さなくても描ける。
 * 写せる canvas が無いときは null。
 */
sl = function() {
  const t = a(this, R);
  if (!t || typeof t.querySelectorAll != "function") return null;
  const e = t.getBoundingClientRect();
  if (!(e.width > 0 && e.height > 0)) return null;
  const n = [...t.querySelectorAll("canvas")].filter((C) => {
    const h = C.getBoundingClientRect();
    if (!(h.width > 0 && h.height > 0) || !(C.width > 0 && C.height > 0))
      return !1;
    try {
      return C.getContext("2d") !== null;
    } catch {
      return !1;
    }
  });
  if (n.length === 0) return null;
  const o = Math.min(1, 720 / Math.max(e.width, e.height)) * 2, g = document.createElement("canvas");
  g.width = Math.round(e.width * o), g.height = Math.round(e.height * o);
  const c = g.getContext("2d");
  if (!c) return null;
  for (const C of n) {
    let h = 1;
    for (let w = C; w && w !== t.parentElement; w = w.parentElement) {
      const z = getComputedStyle(w);
      (z.visibility === "hidden" || z.display === "none") && (h = 0);
      const L = parseFloat(z.opacity);
      Number.isFinite(L) && (h *= L);
    }
    if (h <= 0) continue;
    const f = C.getBoundingClientRect();
    c.globalAlpha = h;
    try {
      c.drawImage(
        C,
        (f.left - e.left) * o,
        (f.top - e.top) * o,
        f.width * o,
        f.height * o
      );
    } catch {
      return null;
    }
  }
  return g.setAttribute("aria-hidden", "true"), g;
}, /**
 * ヘルプの冒頭に出す「全体の図」。旧 UI の fullscreen.png（iPhone の枠の中の画面）と同じ位置に、
 * その場で組む。スマホの枠の中に今の地図を写し（写せないときは先頭の古地図のサムネイル）、
 * タッチ端末の配置（ズーム無し・左上に GPS とホーム・右上にコンパス・左下にヘルプと共有・右下の列・
 * 下に 2 本の地図スライダーと透過度・上に題名）を小さな部品で並べる。出すボタンは、実物で今
 * 出ているものだけ。図は読み上げない（説明は既存の html.help_* の文が担う）。
 */
ol = function() {
  const t = document.createElement("div");
  t.className = "help-figure", t.setAttribute("aria-hidden", "true");
  const e = document.createElement("div");
  e.className = "help-phone";
  const n = document.createElement("div");
  n.className = "help-phone-screen", e.appendChild(n);
  const o = A(this, s, sl).call(this), g = o ? void 0 : A(this, s, Qs).call(this);
  if (o)
    o.className = "help-phone-map", n.appendChild(o);
  else if (g) {
    const M = document.createElement("img");
    M.className = "help-phone-map", M.alt = "", M.src = g, n.appendChild(M);
  }
  const c = document.createElement("div");
  c.className = "help-phone-ui", n.appendChild(c);
  const C = document.createElement("span");
  C.className = "help-phone-title", c.appendChild(C);
  const h = A(this, s, tn).call(this, "help-phone-stack-top-left");
  h.appendChild(A(this, s, ui).call(this, "gps", "location-crosshairs")), h.appendChild(A(this, s, ui).call(this, "home", "house")), c.appendChild(h);
  const f = A(this, s, tn).call(this, "help-phone-stack-top-right");
  f.appendChild(A(this, s, ui).call(this, "compass", "compass")), c.appendChild(f);
  const w = A(this, s, tn).call(this, "help-phone-stack-bottom-right");
  A(this, s, mi).call(this, w, "info", "circle-info", !0), A(this, s, mi).call(this, w, "border", "layer-group", !a(this, m).borderButton.hidden), A(this, s, mi).call(this, w, "hide-marker", "map-pin", !a(this, m).hideMarkerButton.hidden), A(this, s, mi).call(this, w, "marker-list", "list", !a(this, m).markerListButton.hidden), c.appendChild(w);
  const z = A(this, s, tn).call(this, "help-phone-stack-bottom-left");
  z.appendChild(A(this, s, ui).call(this, "help", "circle-question")), A(this, s, mi).call(this, z, "share", "share-from-square", !a(this, m).shareButton.hidden), c.appendChild(z), c.appendChild(A(this, s, qs).call(this, "base")), c.appendChild(A(this, s, qs).call(this, "overlay"));
  const L = document.createElement("div");
  L.className = "help-phone-transparency";
  const N = A(this, s, to).call(this, "slider");
  return N && L.appendChild(N), c.appendChild(L), t.appendChild(e), t;
}, /** 図の中のボタンの列（見た目は本文の中の印（.help-icon）の小さなボタンを使い回す）。 */
tn = function(t) {
  const e = document.createElement("div");
  return e.className = `help-phone-stack ${t}`, e;
}, /** 図の中の 1 つのボタン。実物のボタンと同じ背景・白いアイコン・角の丸み 2px。 */
ui = function(t, e) {
  const n = document.createElement("span");
  return n.className = "help-icon", n.dataset.control = t, n.setAttribute("aria-hidden", "true"), n.innerHTML = Ot(e), n;
}, /** 図の列へ、実際に出ているボタンだけを足す（実物のボタンの hidden に従う。属性・層 A の機能・POI の有無で出し分けている）。 */
mi = function(t, e, n, o) {
  o && t.appendChild(A(this, s, ui).call(this, e, n));
}, /** 図の中の地図の切り替えスライダー（サムネイル付きのカードを簡略化したもの）。 */
qs = function(t) {
  const e = document.createElement("div");
  e.className = "help-phone-map-slider", e.dataset.kind = t;
  const n = a(this, J).find(
    (c) => t === "base" ? c.isBasemap : c.isOldMap
  ), o = Ye(n?.thumbnail);
  if (o) {
    const c = document.createElement("img");
    c.className = "help-phone-card-thumb", c.alt = "", c.src = o, e.appendChild(c);
  }
  const g = document.createElement("span");
  return g.className = "help-phone-card-label", e.appendChild(g), e;
}, /** 今の地図の一覧の先頭の古地図のサムネイル（旧 UI の overlay の絵と同じ選び方）。 */
Qs = function() {
  return Ye(a(this, J).find((t) => t.isOldMap)?.thumbnail);
}, /**
 * ヘルプの 1 つの文言を、${xxx.png} の位置に画像・アイコンを挟みながら入れる。
 * 旧 UI の言語ファイルは `<img src='${xxx.png}'>` の形で書いてある（旧の translateDom が
 * ${xxx.png} を画像の URL に差し替えていた）。層 B は同じ位置にアイコンを置くので、
 * 囲みの <img> ごと置き換える。内蔵の辞書の裸の ${xxx.png} も同じように扱う。
 */
_s = function(t, e) {
  const n = String(e ?? ""), o = /<img\s+src=(['"])\$\{([a-z_]+)\.png\}\1\s*>|\$\{([a-z_]+)\.png\}/gi;
  let g = 0, c;
  for (; c = o.exec(n); ) {
    A(this, s, $s).call(this, t, n.slice(g, c.index));
    const C = A(this, s, to).call(this, c[2] ?? c[3]);
    C && t.appendChild(C), g = c.index + c[0].length;
  }
  A(this, s, $s).call(this, t, n.slice(g));
}, /** HTML の断片を sanitizeHtml に通して入れる（許可リストの外は落ちる）。 */
$s = function(t, e) {
  if (!e) return;
  const n = document.createElement("template");
  n.innerHTML = Ue(e), t.appendChild(n.content);
}, /** 旧 pointer_images の ${xxx.png} に当たるもの。用意できない名前は何も置かない。 */
to = function(t) {
  switch (t) {
    case "plus":
    case "minus": {
      const o = document.createElement("span");
      return o.className = "help-key", o.setAttribute("aria-hidden", "true"), o.textContent = t === "plus" ? "+" : "−", o;
    }
    case "slider": {
      const o = document.createElement("span");
      return o.className = "help-slider", o.setAttribute("aria-hidden", "true"), o;
    }
    case "defaultpin":
    case "bluedot": {
      const o = t === "defaultpin" ? Yr.defaultpin : Yr.bluedot, g = document.createElement("img");
      return g.className = "help-img", g.alt = "", g.src = o, g;
    }
    case "overlay": {
      const o = A(this, s, Qs).call(this);
      if (o === void 0) return null;
      const g = document.createElement("img");
      return g.className = "help-img", g.alt = "", g.src = o, g;
    }
  }
  const e = RI[t];
  if (!e) return null;
  const n = document.createElement("span");
  return n.className = "help-icon", n.setAttribute("aria-hidden", "true"), n.innerHTML = Ot(e), n;
}, // ---- 地図情報・ライセンス・タイルキャッシュ
//      （旧 maplat_control.ts の Copyright・ui_init.ts の modal_map の処理・ui_utils.ts の renderLicenseCell）----
/** 地図情報のボタンは地図の準備ができたら出す（旧は操作ボタンに常に並べていた）。 */
al = function() {
  a(this, m).infoButton.hidden = !a(this, X);
}, eo = function() {
  a(this, X) && (A(this, s, ht).call(this), A(this, s, Mt).call(this), A(this, s, Ut).call(this), A(this, s, re).call(this), A(this, s, tr).call(this), A(this, s, ue).call(this, a(this, m).info), A(this, s, de).call(this, a(this, m).infoClose));
}, Lt = function() {
  A(this, s, me).call(this, a(this, m).info), Et(this, Me)._++, d(this, Wt, void 0), a(this, gt) && (cancelAnimationFrame(a(this, gt)), d(this, gt, 0));
}, /**
 * 地図情報の中身（題名・メタデータ・ライセンス・キャッシュ）を作り直す（旧 ui_init.ts の copyright の処理）。
 * 値は設定ファイル由来の信頼できないもの: HTML は sanitizeHtml を通し、ライセンスの注意書きは textContent。
 * 題名は旧と同じく多言語から今の言語を選ぶ。
 * 表示中の現代の地図（ベースマップ・重ね地図・背面の地図）の帰属表記は、地図ごとに見出しを付けて 1 行に
 * まとめる（#appendDisplayedAttributions）。提供元の申告だけが変わったときはこの作り直しをせず、
 * 帰属表記のセルだけを更新する（#updateAttributionsCell。フォーカスと他の行を保つ）。
 */
tr = function() {
  const t = a(this, R);
  if (!t || !a(this, X)) return;
  const e = a(this, m), n = t.currentMapId ?? a(this, W) ?? void 0;
  let o;
  if (n)
    try {
      o = t.getMapMeta(n) ?? void 0;
    } catch {
      o = void 0;
    }
  const g = o ?? a(this, Dt) ?? void 0, c = g, C = a(this, J).find(
    (z) => z.mapID === (n ?? g?.mapID)
  ), h = C ? !C.isOldMap : !0;
  e.infoTitle.textContent = this.translateText(
    g?.title || g?.officialTitle || g?.label
  ) || (typeof g?.mapID == "string" ? g.mapID : ""), e.infoMeta.replaceChildren();
  const f = A(this, s, io).call(this, t, n), w = !!n && f.includes(n);
  for (const z of Ic) {
    if (z === "title" || z === "officialTitle" || z === "attr" && w || z === "licenseNote" || z === "dataLicenseNote") continue;
    const L = c?.[z];
    if (z === "license" || z === "dataLicense") {
      const y = PI(
        z,
        typeof L == "string" ? L : void 0,
        h
      ), P = z === "license" ? "licenseNote" : "dataLicenseNote", _ = this.translateText(c?.[P]) || "";
      A(this, s, fi).call(this, z, A(this, s, Il).call(this, y, _));
      continue;
    }
    const N = this.translateText(L);
    if (!N) continue;
    const M = document.createElement("dd");
    M.innerHTML = Ue(N), A(this, s, fi).call(this, z, M);
  }
  A(this, s, ll).call(this, t, f), A(this, s, cl).call(this, g?.iiif), A(this, s, bi).call(this);
}, /**
 * 表示中の現代の地図の mapID（重ね地図 → ベースマップの順。地図の右下の出典の箱の上から下と同じ）。
 *   - 前面が古地図: 背面のベースマップ（層 A の状態の backgroundID。背面が無ければ無し）。
 *   - 前面が重ね地図: その地図と、下のベースマップ（backgroundID）。
 *   - 前面がベースマップ: その地図。
 * 地図の一覧に無い mapID は外す。
 */
io = function(t, e) {
  const n = e ? a(this, J).find((c) => c.mapID === e) : void 0;
  if (!n) return [];
  let o;
  try {
    o = t.state?.backgroundID;
  } catch {
    o = void 0;
  }
  const g = typeof o == "string" && o !== n.mapID ? a(this, J).find((c) => c.mapID === o && !c.isOldMap) : void 0;
  return n.isOldMap ? g ? [g.mapID] : [] : n.isOverlay ? g ? [n.mapID, g.mapID] : [n.mapID] : [n.mapID];
}, /**
 * 層 A の実装が出す、地図ごとの提供元の申告（Core の `<maplat-app>` の providerAttributions。
 * Google の Map Tiles API の著作権・TileJSON の attribution など）。口の無い実装・形の違う値は空。
 */
Al = function(t) {
  const e = /* @__PURE__ */ new Map();
  let n;
  try {
    n = t.providerAttributions;
  } catch {
    n = void 0;
  }
  if (!Array.isArray(n)) return e;
  for (const o of n) {
    if (!o || typeof o != "object") continue;
    const { mapID: g, attributions: c } = o;
    if (typeof g != "string" || !Array.isArray(c)) continue;
    const C = c.filter(
      (h) => typeof h == "string"
    );
    e.set(g, [...e.get(g) ?? [], ...C]);
  }
  return e;
}, /**
 * 表示中の現代の地図の帰属表記の行（項目名 html.attributions）。地図ごとに見出し（地図の題名）と本文を並べる。
 * 本文に出すのは、地図の定義の attr（今までの「地図画像帰属」と同じく sanitizeHtml）と、提供元の申告
 * （狭い許可表 sanitizeIiifHtml で洗い直す）の 2 つだけ。表示される文字とリンク（a[href]）の URL の並びが
 * 同じものは 1 回だけ出す（同じ文でも href が違えば別の出典なので落とさない。リンクの無いものは今までどおり
 * 文字だけで比べる）。どちらも無い地図は見出しごと出さず、出す地図が無ければ行ごと出さない
 * （値の無い項目の行を出さない、地図情報の他の行と同じ規則。「記載なし」のような文言で補わない）。
 */
ll = function(t, e) {
  const n = A(this, s, no).call(this, t, e);
  n && A(this, s, fi).call(this, "attributions", n);
}, /** 帰属表記の行の中身（地図ごとの組の並び）。出す物が無ければ null。 */
no = function(t, e) {
  if (e.length === 0) return null;
  const n = A(this, s, Al).call(this, t), o = document.createDocumentFragment();
  for (const g of e) {
    let c;
    try {
      c = t.getMapMeta(g) ?? void 0;
    } catch {
      c = void 0;
    }
    const C = [], h = this.translateText(c?.attr);
    h && h.trim() && C.push(Ue(h));
    for (const N of n.get(g) ?? [])
      C.push(va(N));
    const f = [], w = /* @__PURE__ */ new Set();
    for (const N of C) {
      const M = document.createElement("div");
      M.className = "attribution-item", M.innerHTML = N;
      const y = Array.from(
        M.querySelectorAll("a[href]"),
        (yt) => yt.getAttribute("href") ?? ""
      ), P = As(M.textContent) || N.trim(), _ = y.length > 0 ? `${P}\0${y.join("\0")}` : P;
      !_ || w.has(_) || (w.add(_), f.push(M));
    }
    if (f.length === 0) continue;
    const z = document.createElement("section");
    z.className = "attribution-map", z.dataset.mapId = g;
    const L = document.createElement("h4");
    L.textContent = this.translateText(
      c?.title || c?.officialTitle || c?.label
    ) || g, z.append(L, ...f), o.appendChild(z);
  }
  return o.hasChildNodes() ? o : null;
}, /**
 * 提供元の申告の更新（attributionChanged）だけを、開いている地図情報の帰属表記のセルに反映する。
 * 行ごとの作り直し（#renderMapInfo）をしないので、他の行とフォーカスが壊れない。中身が変わらなければ
 * DOM を差し替えない。差し替えたときは、フォーカスのあったリンクに相当する所へ戻し、相当する所が
 * 無ければモーダルの中に留める（フォーカスを外に出さない）。
 */
gl = function() {
  const t = a(this, R);
  if (!t || !a(this, X) || a(this, m).info.hidden) return;
  const e = t.currentMapId ?? a(this, W) ?? void 0, n = A(this, s, io).call(this, t, e), o = A(this, s, no).call(this, t, n), g = a(this, m).infoMeta.querySelector(
    'dd[part~="map-meta-attributions"]'
  );
  if (!o) {
    if (!g) return;
    const C = A(this, s, ro).call(this, g), h = g.previousElementSibling;
    h?.tagName === "DT" && h.remove(), g.remove(), A(this, s, so).call(this, C, null);
    return;
  }
  if (g) {
    if (g.innerHTML === EI(o)) return;
    const C = A(this, s, ro).call(this, g);
    g.replaceChildren(o), A(this, s, so).call(this, C, g);
    return;
  }
  const c = a(this, m).infoMeta.querySelector('dd[part~="map-meta-iiif"]');
  A(this, s, fi).call(this, "attributions", o, c?.previousElementSibling ?? null);
}, /**
 * 帰属表記のセルの中でフォーカスのある要素の、差し替え後の当たり（地図の mapID・リンクの URL・本文の文字）。
 * フォーカスがセルの外にあれば null（触らなくてよい）。
 */
ro = function(t) {
  const e = a(this, et).activeElement ?? document.activeElement;
  if (!e || !t.contains(e)) return null;
  const n = e.closest(
    "section.attribution-map"
  ), o = e.closest(".attribution-item"), g = e.closest("a[href]");
  return {
    mapID: n?.dataset.mapId,
    href: g?.getAttribute("href") ?? null,
    text: As(o?.textContent ?? e.textContent)
  };
}, /**
 * 差し替えの後のフォーカスの戻し先: まず同じ URL のリンク、次に同じ本文のリンクを、同じ地図の組の中で探す。
 * どちらも無ければモーダルの中に留める（閉じるボタンへ）。セルごと外したときは cell に null を渡す。
 */
so = function(t, e) {
  if (!t) return;
  let n = null;
  if (e) {
    const o = t.mapID ? Array.from(e.querySelectorAll("section.attribution-map")).find(
      (c) => c.dataset.mapId === t.mapID
    ) : void 0, g = Array.from(
      (o ?? e).querySelectorAll("a[href]")
    );
    n = (t.href !== null ? g.find((c) => c.getAttribute("href") === t.href) : void 0) ?? g.find(
      (c) => As(
        c.closest(".attribution-item")?.textContent ?? c.textContent
      ) === t.text
    ) ?? null;
  }
  if (n) {
    n.focus({ preventScroll: !0 });
    return;
  }
  A(this, s, de).call(this, a(this, m).infoClose);
}, /** メタデータの 1 行（dt が項目名・dd が値。項目名は旧と同じく html.<キー> の文言）。before を渡すとその行の前に作る。 */
fi = function(t, e, n) {
  const o = document.createElement("dt");
  o.textContent = this.t(`html.${t}`);
  const g = document.createElement("dd");
  g.setAttribute("part", `map-meta-${t}`), g.appendChild(e), n ? (a(this, m).infoMeta.insertBefore(o, n), a(this, m).infoMeta.insertBefore(g, n)) : a(this, m).infoMeta.append(o, g);
}, /**
 * IIIF の書誌の表（地図情報の最後の行）。地図データに写した書誌があり、アプリの設定で表を出す（display が
 * "all"）ときだけ足す。書誌は地図データに写した値だけを使い、Manifest は取りに行かない。
 * 項目名は文字のまま、値は Core の IIIF 向けのサニタイズを通して入れる。
 */
cl = function(t) {
  if (!t || t.display !== "all") return;
  const e = {
    manifest: [],
    canvas: []
  };
  for (const g of Array.isArray(t.metadata) ? t.metadata : []) {
    if (!g) continue;
    const { from: c } = g;
    (c === "manifest" || c === "canvas") && e[c].push(g);
  }
  if (e.manifest.length + e.canvas.length === 0) return;
  const n = document.createDocumentFragment();
  if (A(this, s, oo).call(this, n, "manifest", e.manifest), A(this, s, oo).call(this, n, "canvas", e.canvas), typeof t.copiedAt == "string" && t.copiedAt) {
    const g = document.createElement("p");
    g.setAttribute("part", "iiif-copied-at"), g.textContent = `${this.t("html.iiif_copied_at")} ${t.copiedAt}`, n.appendChild(g);
  }
  const o = jt(t.manifest);
  if (o && /^https?:\/\//i.test(o)) {
    const g = document.createElement("a");
    g.setAttribute("part", "iiif-manifest-link"), g.href = o, g.target = "_blank", g.rel = "noopener noreferrer", g.textContent = this.t("html.iiif_manifest_link"), n.appendChild(g);
  }
  A(this, s, fi).call(this, "iiif", n);
}, /** 書誌の表の 1 群（Manifest か canvas）。空の群は見出しごと出さない。 */
oo = function(t, e, n) {
  if (n.length === 0) return;
  const o = document.createElement("h4");
  o.textContent = this.t(`html.iiif_${e}`);
  const g = document.createElement("table");
  g.setAttribute("part", `iiif-${e}`);
  const c = document.createElement("tbody");
  for (const C of n) {
    const h = document.createElement("tr"), f = document.createElement("th");
    f.scope = "row", f.textContent = this.translateText(C.label) || "";
    const w = document.createElement("td");
    w.innerHTML = va(this.translateText(C.value) || ""), h.append(f, w), c.appendChild(h);
  }
  g.appendChild(c), t.append(o, g);
}, /**
 * ライセンスのセル（旧 ui_utils.renderLicenseCell と同じ規則: アイコンがあれば出し、注意書きがあれば
 * その下に文章で出す。アイコンを持たない語彙 "Custom" は文章だけ）。アイコンの URL は PNG を import した
 * 表（license_images）から引き、表にない語彙は画像を出さずに文言だけを出す（相対 URL を取りに行かない）。
 */
Il = function(t, e) {
  const n = document.createDocumentFragment();
  if (t && t !== kI) {
    const o = `${t.toLowerCase().replace(/ /g, "_")}.png`, g = Bc[o];
    if (g !== void 0) {
      const c = document.createElement("img");
      c.className = "license", c.alt = t, c.src = g, n.appendChild(c);
    } else {
      const c = document.createElement("span");
      c.className = "license-text", c.textContent = t, n.appendChild(c);
    }
  }
  if (e) {
    const o = document.createElement("div");
    o.className = "license_note", o.textContent = e, n.appendChild(o);
  }
  return n;
}, /** 今の地図のキャッシュを扱えるか（supports("tile-cache")・enable-cache・地図の cacheEnable の 3 つ）。 */
er = function(t) {
  if (!A(this, s, Kn).call(this, "tile-cache") || t.enableCache !== !0) return !1;
  try {
    return t.getMapCacheEnable(t.currentMapId ?? void 0) === !0;
  } catch {
    return !1;
  }
}, /**
 * 一括取得の表示を「取得中」にするか。取得中の地図が今の地図と同じときだけ取得中の表示にする
 * （地図を替えたら、裏で続いている取得は今の地図の欄に出さない）。
 */
en = function() {
  return a(this, Nt) ? a(this, Qt) === (a(this, R)?.currentMapId ?? null) : !1;
}, bi = async function() {
  const t = a(this, R), e = ++Et(this, Me)._, n = a(this, m).cacheSection;
  if (!t || !a(this, X) || !A(this, s, er).call(this, t)) {
    n.hidden = !0, d(this, Wt, void 0);
    return;
  }
  n.hidden = !1, a(this, m).cacheHeading.textContent = this.t("html.cache_handle");
  const o = async () => {
    try {
      return await t.getMapTileCacheStatsAsync(
        t.currentMapId ?? void 0
      ) ?? {};
    } catch (f) {
      return console.warn(
        `<${tt}>: getMapTileCacheStatsAsync failed`,
        f
      ), {};
    }
  };
  let g = await o();
  if (e !== a(this, Me)) return;
  d(this, Wt, g), A(this, s, ne).call(this);
  let c = $a(g), C = _a, h = 0;
  for (; !HI(g); ) {
    if (h + C > GI || (await new Promise((w) => setTimeout(w, C)), h += C, !A(this, s, ao).call(this, e)) || (g = await o(), !A(this, s, ao).call(this, e))) return;
    d(this, Wt, g), A(this, s, ne).call(this);
    const f = $a(g);
    C = f === c ? Math.min(C * jI, ZI) : _a, c = f;
  }
}, /** 統計の読み直しを続けてよいか（同じ読み取りの回で、地図情報が開いていて、一括取得の表示中でない）。 */
ao = function(t) {
  return t === a(this, Me) && !a(this, m).info.hidden && !A(this, s, en).call(this);
}, /** キャッシュの大きさと 2 つのボタンの状態（旧 showStats・updateButtons と同じ規則）。 */
ne = function() {
  const t = a(this, m);
  if (t.cacheSection.hidden) return;
  const e = A(this, s, en).call(this), n = a(this, Wt), o = typeof n?.size == "number" ? n.size : 0, g = typeof n?.count == "number" ? n.count : 0, c = typeof n?.total == "number" ? n.total : 0, C = e ? this.t("html.cache_processing") : zI(o);
  t.cacheSize.textContent = c ? `${C} (${g} / ${c} tiles [${Math.floor(1e3 * g / c) / 10}%])` : `${C} (${g} tiles)`, t.cacheFetch.textContent = this.t(
    e ? "html.cache_cancel" : "html.cache_fetch"
  ), t.cacheFetch.classList.toggle("btn-danger", e), t.cacheFetch.hidden = c === 0 && !e, t.cacheFetch.disabled = !e && c > 0 && g === c, t.cacheDelete.textContent = this.t("html.cache_delete"), t.cacheDelete.disabled = e || o <= 0;
}, Cl = async function() {
  const t = a(this, R);
  if (!t || !a(this, X) || !A(this, s, er).call(this, t)) return;
  if (a(this, Nt)) {
    const g = a(this, Qt) ?? t.currentMapId ?? void 0;
    Et(this, Se)._++, d(this, Nt, !1), d(this, Qt, null), A(this, s, ne).call(this);
    try {
      await t.cancelMapTileCacheAsync(g);
    } catch (c) {
      console.warn(`<${tt}>: cancelMapTileCacheAsync failed`, c);
    }
    await A(this, s, bi).call(this);
    return;
  }
  const e = t.currentMapId ?? void 0, n = ++Et(this, Se)._, o = a(this, V);
  d(this, Nt, !0), d(this, Qt, e ?? null), A(this, s, ne).call(this);
  try {
    await t.fetchAllMapTileCacheAsync(e, (g, c) => {
      n !== a(this, Se) || o !== a(this, V) || A(this, s, hl).call(this, g, c);
    });
  } catch (g) {
    console.warn(`<${tt}>: fetchAllMapTileCacheAsync failed`, g);
  }
  n !== a(this, Se) || o !== a(this, V) || (d(this, Nt, !1), d(this, Qt, null), A(this, s, ne).call(this), await A(this, s, bi).call(this));
}, /**
 * 一括ダウンロードの進み具合（旧 fetchHandler。proceed は描画 1 回にまとめ、finish・stop・canceled で
 * 統計を読み直す）。detail の値は実装のもの: 数でない値は前の値で補う。取得中の地図が今の地図と
 * 違うときは、表示（統計）には反映しない。
 */
hl = function(t, e) {
  if (t === "proceed") {
    if (!A(this, s, en).call(this)) return;
    const n = a(this, Wt) ?? {}, o = typeof e?.size == "number" ? e.size : n.size, g = typeof e?.processed == "number" ? e.processed : typeof e?.count == "number" ? e.count : n.count, c = typeof e?.total == "number" ? e.total : n.total;
    d(this, Wt, { size: o, count: g, total: c }), typeof requestAnimationFrame == "function" ? a(this, gt) || d(this, gt, requestAnimationFrame(() => {
      d(this, gt, 0), A(this, s, ne).call(this);
    })) : A(this, s, ne).call(this);
    return;
  }
  a(this, gt) && (cancelAnimationFrame(a(this, gt)), d(this, gt, 0)), d(this, Nt, !1), d(this, Qt, null), A(this, s, ne).call(this), A(this, s, bi).call(this);
}, pl = async function() {
  const t = a(this, R);
  if (!(!t || !a(this, X) || a(this, Nt)) && A(this, s, er).call(this, t)) {
    try {
      await t.clearMapTileCacheAsync(t.currentMapId ?? void 0);
    } catch (e) {
      console.warn(`<${tt}>: clearMapTileCacheAsync failed`, e);
    }
    await A(this, s, bi).call(this);
  }
}, // ---- マーカー一覧（旧 maplat_control.ts の MarkerList・ui_init.ts の marker_list モーダル）----
/**
 * 既定のピンの画像（層 A の getDefaultPinIcon。地図が描く既定のピンと同じ絵にする。実装の確認 6）。
 * 問い合わせの口を持たない層 A・使えない値なら共通の assets の既定のピン。
 */
ir = function() {
  const t = a(this, R);
  if (t && typeof t.getDefaultPinIcon == "function")
    try {
      const e = Ye(
        t.getDefaultPinIcon(!1)
      );
      if (e !== void 0) return e;
    } catch {
    }
  return Yr.defaultpin;
}, /** 層 A の POI レイヤー（listPoiLayers の公開面。app のレイヤー → 現在の地図のレイヤー、POI の無い層は除く）。 */
Ao = function() {
  const t = a(this, R);
  if (!t || !a(this, X)) return [];
  try {
    return LI(t.listPoiLayers(!1, !0)).filter(
      (e) => e.pois.length > 0
    );
  } catch {
    return [];
  }
}, lo = function() {
  d(this, zi, A(this, s, Ao).call(this).reduce((t, e) => t + e.pois.length, 0)), A(this, s, nr).call(this);
}, /** enable-marker-list が真で、POI があるときだけボタンを出す（旧 enable_marker_list・no_poi）。 */
nr = function() {
  const t = A(this, s, j).call(this, Fe) === !0 && a(this, X) && a(this, zi) > 0;
  a(this, m).markerListButton.hidden = !t;
}, go = function() {
  a(this, X) && A(this, s, j).call(this, Fe) === !0 && (A(this, s, ht).call(this), A(this, s, Lt).call(this), A(this, s, rr).call(this), A(this, s, ue).call(this, a(this, m).markerList), A(this, s, de).call(this, a(this, m).markerListClose));
}, Mt = function() {
  A(this, s, me).call(this, a(this, m).markerList);
}, /** 一覧を作り直す（開くたび・地図の切り替え・言語の変更で。層の表示状態は listPoiLayers の hide から）。 */
rr = function() {
  const t = a(this, m).markerLayers, e = t.querySelector("li.layer.open")?.dataset.layerKey;
  t.replaceChildren();
  for (const n of A(this, s, Ao).call(this)) {
    const o = this.translateText(n.name) || "", g = document.createElement("li");
    g.className = "layer", g.setAttribute("part", "marker-list-layer"), g.dataset.layerKey = n.namespaceID;
    const c = document.createElement("div");
    c.className = "layer-row";
    const C = document.createElement("button");
    C.type = "button", C.className = "layer-label", C.setAttribute("part", "marker-list-layer-label"), C.setAttribute("aria-expanded", "false");
    const h = document.createElement("span");
    h.className = "chevron", h.setAttribute("aria-hidden", "true");
    const f = document.createElement("img");
    f.className = "icon", f.alt = "", f.src = ls(A(this, s, ir).call(this), n.icon);
    const w = document.createElement("span");
    w.className = "name", w.textContent = o, C.append(h, f, w);
    const z = document.createElement("label");
    z.className = "switch";
    const L = document.createElement("input");
    L.type = "checkbox", L.setAttribute("part", "marker-list-layer-switch"), L.checked = !n.hide, L.setAttribute("aria-label", o || n.namespaceID);
    const N = document.createElement("span");
    N.className = "track", N.setAttribute("aria-hidden", "true"), z.append(L, N), L.addEventListener("change", () => {
      const y = n.namespaceID;
      L.checked ? A(this, s, At).call(this, "showPoiLayer", (P) => P.showPoiLayer(y)) : A(this, s, At).call(this, "hidePoiLayer", (P) => P.hidePoiLayer(y));
    }), c.append(C, z);
    const M = document.createElement("ul");
    M.className = "pois", M.hidden = !0;
    for (const y of n.pois) {
      const P = document.createElement("li"), _ = document.createElement("button");
      _.type = "button", _.className = "poi", _.setAttribute("part", "marker-list-poi");
      const yt = Qa(y);
      yt !== void 0 && (_.dataset.poiId = yt);
      const H = document.createElement("img");
      H.className = "icon", H.alt = "", H.src = ls(A(this, s, ir).call(this), y.icon, n.icon);
      const nt = document.createElement("span");
      nt.className = "name", nt.textContent = this.translateText(y.name) || "", _.append(H, nt), _.addEventListener("click", () => A(this, s, dl).call(this, y)), P.appendChild(_), M.appendChild(P);
    }
    C.addEventListener("click", () => {
      const y = !g.classList.contains("open");
      for (const P of Array.from(
        t.querySelectorAll("li.layer.open")
      ))
        P !== g && (P.classList.remove("open"), P.querySelector("ul.pois").toggleAttribute("hidden", !0), P.querySelector(".layer-label").setAttribute("aria-expanded", "false"));
      g.classList.toggle("open", y), M.hidden = !y, C.setAttribute("aria-expanded", y ? "true" : "false");
    }), e === n.namespaceID && (g.classList.add("open"), M.hidden = !1, C.setAttribute("aria-expanded", "true")), g.append(c, M), t.appendChild(g);
  }
}, /** 一覧の POI を選ぶ: 一覧を閉じ、その POI の吹き出しを開く（selectMarker がその POI へ視点を移す）。 */
dl = function(t) {
  const e = Qa(t);
  let n;
  if (e !== void 0)
    try {
      n = a(this, R)?.getMarker(e);
    } catch {
      n = void 0;
    }
  A(this, s, Mt).call(this), A(this, s, vi).call(this, n ?? t);
}, // ---- 汎用メニュー（旧 contextmenu/*・ui_marker.ts の showContextMenu・POI の重なりの選択）----
//
// メニューは 1 つだけ。重なった POI の選択はその使い方の 1 つで、
// 旧 API の showContextMenu もここへ委譲する。part 名は既存の poi-menu / poi-menu-item を引き継ぐ
// （「map-menu 以外」。map-menu は地図の切り替えメニューとともに消えた）。
/** 重なった POI のメニュー（旧 ui_marker.ts の showContextMenu の POI 版）。 */
ul = function(t) {
  A(this, s, Lt).call(this), d(this, we, t), A(this, s, co).call(this, () => A(this, s, ml).call(this), {
    label: this.t("menu.poi_candidates")
  });
}, /** 重なった POI を項目にする（言語の切り替えのたびに作り直す）。 */
ml = function() {
  return a(this, we).map((t) => ({
    icon: ls(A(this, s, ir).call(this), t.icon),
    // 名前は信頼できない POI データ: 文字として入れる（旧は escapeHtml して HTML に組んでいた）
    text: this.translateText(t.name) || "",
    html: !1,
    callback: () => A(this, s, vi).call(this, t)
  }));
}, co = function(t, e = {}) {
  const n = a(this, m).poiMenu;
  d(this, _e, t), d(this, ye, t()), d(this, Pi, e.label ?? this.t("menu.poi_candidates")), A(this, s, Io).call(this), n.hidden = !1;
  const o = a(this, et).querySelector(".frame").getBoundingClientRect(), g = n.getBoundingClientRect(), c = a(this, gn);
  let C = e.at ? e.at.x : c ? c.clientX - o.left : o.width / 2, h = e.at ? e.at.y : c ? c.clientY - o.top : o.height / 2;
  C + g.width > o.width && (C = Math.max(0, C - g.width)), h + g.height > o.height && (h = Math.max(0, h - g.height)), n.style.left = `${Math.round(C)}px`, n.style.top = `${Math.round(h)}px`, n.querySelector("button")?.focus({ preventScroll: !0 }), this.dispatchEvent(new CustomEvent("menuopen"));
}, Io = function() {
  const t = a(this, m).poiMenu, e = a(this, m).poiMenuList;
  t.setAttribute("aria-label", a(this, Pi)), e.replaceChildren(), a(this, ye).forEach((n, o) => {
    const g = document.createElement("li");
    g.setAttribute("role", "none");
    const c = document.createElement("button");
    c.type = "button", c.setAttribute("role", "menuitem"), c.setAttribute("part", "poi-menu-item"), c.dataset.index = `${o}`;
    const C = n.icon === void 0 ? void 0 : Ye(n.icon);
    if (C !== void 0) {
      const f = document.createElement("img");
      f.className = "icon", f.alt = "", f.src = C, c.appendChild(f);
    }
    const h = document.createElement("span");
    h.className = "name", n.html === !1 ? h.textContent = n.text : h.innerHTML = Ue(n.text), c.appendChild(h), g.appendChild(c), e.appendChild(g);
  });
}, ht = function() {
  const t = a(this, m).poiMenu, e = !t.hidden;
  t.hidden = !0, d(this, ye, []), d(this, _e, null), d(this, we, []), a(this, m).poiMenuList.replaceChildren(), e && this.dispatchEvent(new CustomEvent("menuclose"));
}, // ---- POI の吹き出し（旧 ui_marker.ts の handleMarkerAction・poiWebControl）----
// 値は設定ファイル・POI ファイル由来の信頼できないもの: 型は形の約束であって、描く前に値を確かめる
vi = function(t) {
  if (t.directgo) {
    const n = typeof t.directgo == "string" ? t.directgo : t.directgo?.href, o = typeof t.directgo == "object" && !!t.directgo?.blank, g = jt(n);
    if (g === void 0) {
      A(this, s, _n).call(this, XI);
      return;
    }
    o ? window.open(g, "_blank", "noopener,noreferrer") : window.location.href = g;
    return;
  }
  a(this, St) && A(this, s, Co).call(this), d(this, St, t), A(this, s, ht).call(this), A(this, s, Mt).call(this), A(this, s, Lt).call(this), A(this, s, Ut).call(this), A(this, s, ho).call(this, t), A(this, s, ue).call(this, a(this, m).modal);
  const e = t.namespaceID;
  e !== void 0 && A(this, s, At).call(this, "selectMarker", (n) => n.selectMarker(e)), A(this, s, kt).call(this), A(this, s, Qn).call(this), A(this, s, de).call(this, a(this, m).poiClose);
}, re = function() {
  if (!a(this, St)) {
    A(this, s, me).call(this, a(this, m).modal);
    return;
  }
  A(this, s, Co).call(this), d(this, St, null), A(this, s, me).call(this, a(this, m).modal), a(this, m).poiBody.replaceChildren(), A(this, s, Qn).call(this), A(this, s, kt).call(this);
}, Co = function() {
  A(this, s, At).call(this, "unselectMarker", (t) => t.unselectMarker());
}, ho = function(t) {
  const e = a(this, m), n = A(this, s, j).call(this, wA) === !0;
  e.poiTitle.textContent = this.translateText(t.name) || "", e.poiBody.replaceChildren();
  const o = cI(
    t,
    n,
    (h) => this.translateText(h) || ""
  );
  if (o.kind !== "none") {
    o.node && e.poiBody.appendChild(o.node), o.kind === "html" && o.node.shadowRoot?.querySelector("qy-swiper") && gs();
    return;
  }
  const g = A(this, s, fl).call(this, t);
  if (g) {
    const h = document.createElement("div");
    h.className = "poi-media", h.setAttribute("part", "poi-media"), h.appendChild(g), e.poiBody.appendChild(h), gs();
  }
  const c = this.translateText(t.address);
  if (c) {
    const h = document.createElement("p");
    h.className = "poi-address", h.textContent = c, e.poiBody.appendChild(h);
  }
  const C = this.translateText(t.desc);
  if (C) {
    const h = document.createElement("p");
    h.className = "poi-desc", h.innerHTML = Ue(C).replace(/\n/g, "<br>"), e.poiBody.appendChild(h);
  }
}, /**
 * POI の image / media を Quyuan のスライダー（<qy-swiper> と <qy-swiper-slide>）にする（旧 poiWebControl と同じ組み方）。
 * 種類（image・video・youtube・3dmodel・gaussian・panorama）は type か src の拡張子で決め、表示は Quyuan の
 * ビューア（中身は同梱の Chuci）に任せる。属性は共有の buildSlideAttrs（スライドの許可リスト・URL と文字の無害化）で組む。
 * @returns メディアが 1 件も無ければ null
 */
fl = function(t) {
  const e = t.media ?? t.image, n = e ? Array.isArray(e) ? e : [e] : [], o = [];
  for (const C of n) {
    const h = typeof C == "string" ? { src: C } : C && typeof C == "object" ? { ...C } : {};
    if (typeof h.src != "string" || h.src === "") continue;
    const f = typeof h.type == "string" && h.type !== "" ? h.type : TI(h.src), w = jt($r(h.src, "img"));
    if (w === void 0) continue;
    const z = {
      "image-url": w,
      "image-type": f
    }, L = typeof h.thumbnail == "string" && h.thumbnail !== "" ? jt($r(h.thumbnail, "img")) : f === "image" ? w : void 0;
    L !== void 0 && (z["thumbnail-url"] = L);
    for (const [y, P] of Object.entries(h))
      ["src", "type", "thumbnail", "desc", "caption"].includes(y) || (z[y] = P);
    const N = this.translateText(
      h.caption ?? h.desc
    );
    N && (z.caption = N);
    const M = cc(z);
    /(^|\s)image-url="/.test(M) && o.push(`<qy-swiper-slide ${M}></qy-swiper-slide>`);
  }
  if (o.length === 0) return null;
  const g = document.createElement("template");
  g.innerHTML = `<qy-swiper>${o.join("")}</qy-swiper>`;
  const c = g.content.firstElementChild;
  return c.setAttribute("part", "poi-swiper"), document.importNode(c, !0);
}, // ---- 道具 ----
po = function(t) {
  try {
    return Number(t.getTransparency()) || 0;
  } catch {
    return 0;
  }
}, bl = function(t) {
  try {
    return t.initialRestore ?? {};
  } catch {
    return {};
  }
}, /** 起動時だけ効く層 B のキーへの起動後の書き込みを警告して無視する。 */
uo = function(t, e) {
  A(this, s, yi).call(this, `startup:${t.prop}`, `<${tt}>: ${e} is fixed at startup and cannot be changed after the UI has started; the change was ignored.`);
}, sr = function() {
  try {
    return a(this, R)?.appData ?? null;
  } catch {
    return null;
  }
}, j = function(t) {
  const e = this.getAttribute(t.attr);
  return CA(
    t,
    e,
    (n) => A(this, s, yi).call(this, `parse:${t.attr}:${e}`, n),
    tt
  );
}, mo = function(t) {
  const e = this;
  if (Object.prototype.hasOwnProperty.call(e, t)) {
    const n = e[t];
    delete e[t], e[t] = n;
  }
}, yi = function(t, e) {
  a(this, cn).has(t) || (a(this, cn).add(t), console.warn(e));
}, (() => {
  const t = wo.prototype;
  for (const e of [...Je, ...Fi])
    Object.defineProperty(t, e.prop, {
      configurable: !0,
      enumerable: !0,
      get() {
        return a(this, lt)?.has(e.prop) ? a(this, lt).get(e.prop) : A(this, s, j).call(this, e);
      },
      set(n) {
        if (e.startup && a(this, lt) && Fa.get(e.attr)) {
          A(this, s, uo).call(this, e, `property "${e.prop}"`);
          return;
        }
        const o = nn(e, n);
        o == null ? this.removeAttribute(e.attr) : this.setAttribute(e.attr, o);
      }
    });
  for (const e of is)
    Object.defineProperty(t, e.prop, {
      configurable: !0,
      enumerable: !0,
      get() {
        return e.prop === "appOption" ? A(this, s, Hn).call(this) : a(this, Yt).get(e.prop);
      },
      set(n) {
        e.prop === "restore" && A(this, s, VA).call(this, n), n == null ? a(this, Yt).delete(e.prop) : a(this, Yt).set(e.prop, n), A(this, s, Ki).call(this, e.prop);
      }
    });
})();
let or = wo;
function VI(r = tt) {
  if (typeof customElements > "u") return !1;
  const i = customElements.get(r);
  return i ? (console.warn(
    i === or ? `<${r}> is already defined; it was not redefined.` : `<${r}> is already defined by another implementation; this implementation did not redefine it.`
  ), !1) : (customElements.define(r, or), !0);
}
VI();
export {
  IA as $,
  FI as C,
  lA as D,
  bI as M,
  Ar as O,
  ya as P,
  KI as X,
  tt as _,
  qc as a,
  QI as b,
  qI as c,
  yo as d,
  or as e,
  VI as f,
  dc as h,
  _I as m,
  zt as p,
  vo as q,
  $r as r
};
