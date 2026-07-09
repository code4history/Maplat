import { c as A, g as $ } from "./index-D6Tkf7zm.js";
function X(g, d) {
  for (var b = 0; b < d.length; b++) {
    const y = d[b];
    if (typeof y != "string" && !Array.isArray(y)) {
      for (const h in y)
        if (h !== "default" && !(h in g)) {
          const p = Object.getOwnPropertyDescriptor(y, h);
          p && Object.defineProperty(g, h, p.get ? p : {
            enumerable: !0,
            get: () => y[h]
          });
        }
    }
  }
  return Object.freeze(Object.defineProperty(g, Symbol.toStringTag, { value: "Module" }));
}
var E = { exports: {} }, M;
function J() {
  return M || (M = 1, (function(g, d) {
    var b = typeof globalThis < "u" && globalThis || typeof self < "u" && self || typeof A < "u" && A, y = (function() {
      function p() {
        this.fetch = !1, this.DOMException = b.DOMException;
      }
      return p.prototype = b, new p();
    })();
    (function(p) {
      (function(l) {
        var a = typeof p < "u" && p || typeof self < "u" && self || // eslint-disable-next-line no-undef
        typeof A < "u" && A || {}, u = {
          searchParams: "URLSearchParams" in a,
          iterable: "Symbol" in a && "iterator" in Symbol,
          blob: "FileReader" in a && "Blob" in a && (function() {
            try {
              return new Blob(), !0;
            } catch {
              return !1;
            }
          })(),
          formData: "FormData" in a,
          arrayBuffer: "ArrayBuffer" in a
        };
        function S(e) {
          return e && DataView.prototype.isPrototypeOf(e);
        }
        if (u.arrayBuffer)
          var F = [
            "[object Int8Array]",
            "[object Uint8Array]",
            "[object Uint8ClampedArray]",
            "[object Int16Array]",
            "[object Uint16Array]",
            "[object Int32Array]",
            "[object Uint32Array]",
            "[object Float32Array]",
            "[object Float64Array]"
          ], q = ArrayBuffer.isView || function(e) {
            return e && F.indexOf(Object.prototype.toString.call(e)) > -1;
          };
        function v(e) {
          if (typeof e != "string" && (e = String(e)), /[^a-z0-9\-#$%&'*+.^_`|~!]/i.test(e) || e === "")
            throw new TypeError('Invalid character in header field name: "' + e + '"');
          return e.toLowerCase();
        }
        function T(e) {
          return typeof e != "string" && (e = String(e)), e;
        }
        function B(e) {
          var t = {
            next: function() {
              var r = e.shift();
              return { done: r === void 0, value: r };
            }
          };
          return u.iterable && (t[Symbol.iterator] = function() {
            return t;
          }), t;
        }
        function s(e) {
          this.map = {}, e instanceof s ? e.forEach(function(t, r) {
            this.append(r, t);
          }, this) : Array.isArray(e) ? e.forEach(function(t) {
            if (t.length != 2)
              throw new TypeError("Headers constructor: expected name/value pair to be length 2, found" + t.length);
            this.append(t[0], t[1]);
          }, this) : e && Object.getOwnPropertyNames(e).forEach(function(t) {
            this.append(t, e[t]);
          }, this);
        }
        s.prototype.append = function(e, t) {
          e = v(e), t = T(t);
          var r = this.map[e];
          this.map[e] = r ? r + ", " + t : t;
        }, s.prototype.delete = function(e) {
          delete this.map[v(e)];
        }, s.prototype.get = function(e) {
          return e = v(e), this.has(e) ? this.map[e] : null;
        }, s.prototype.has = function(e) {
          return this.map.hasOwnProperty(v(e));
        }, s.prototype.set = function(e, t) {
          this.map[v(e)] = T(t);
        }, s.prototype.forEach = function(e, t) {
          for (var r in this.map)
            this.map.hasOwnProperty(r) && e.call(t, this.map[r], r, this);
        }, s.prototype.keys = function() {
          var e = [];
          return this.forEach(function(t, r) {
            e.push(r);
          }), B(e);
        }, s.prototype.values = function() {
          var e = [];
          return this.forEach(function(t) {
            e.push(t);
          }), B(e);
        }, s.prototype.entries = function() {
          var e = [];
          return this.forEach(function(t, r) {
            e.push([r, t]);
          }), B(e);
        }, u.iterable && (s.prototype[Symbol.iterator] = s.prototype.entries);
        function O(e) {
          if (!e._noBody) {
            if (e.bodyUsed)
              return Promise.reject(new TypeError("Already read"));
            e.bodyUsed = !0;
          }
        }
        function D(e) {
          return new Promise(function(t, r) {
            e.onload = function() {
              t(e.result);
            }, e.onerror = function() {
              r(e.error);
            };
          });
        }
        function C(e) {
          var t = new FileReader(), r = D(t);
          return t.readAsArrayBuffer(e), r;
        }
        function I(e) {
          var t = new FileReader(), r = D(t), n = /charset=([A-Za-z0-9_-]+)/.exec(e.type), i = n ? n[1] : "utf-8";
          return t.readAsText(e, i), r;
        }
        function L(e) {
          for (var t = new Uint8Array(e), r = new Array(t.length), n = 0; n < t.length; n++)
            r[n] = String.fromCharCode(t[n]);
          return r.join("");
        }
        function R(e) {
          if (e.slice)
            return e.slice(0);
          var t = new Uint8Array(e.byteLength);
          return t.set(new Uint8Array(e)), t.buffer;
        }
        function U() {
          return this.bodyUsed = !1, this._initBody = function(e) {
            this.bodyUsed = this.bodyUsed, this._bodyInit = e, e ? typeof e == "string" ? this._bodyText = e : u.blob && Blob.prototype.isPrototypeOf(e) ? this._bodyBlob = e : u.formData && FormData.prototype.isPrototypeOf(e) ? this._bodyFormData = e : u.searchParams && URLSearchParams.prototype.isPrototypeOf(e) ? this._bodyText = e.toString() : u.arrayBuffer && u.blob && S(e) ? (this._bodyArrayBuffer = R(e.buffer), this._bodyInit = new Blob([this._bodyArrayBuffer])) : u.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(e) || q(e)) ? this._bodyArrayBuffer = R(e) : this._bodyText = e = Object.prototype.toString.call(e) : (this._noBody = !0, this._bodyText = ""), this.headers.get("content-type") || (typeof e == "string" ? this.headers.set("content-type", "text/plain;charset=UTF-8") : this._bodyBlob && this._bodyBlob.type ? this.headers.set("content-type", this._bodyBlob.type) : u.searchParams && URLSearchParams.prototype.isPrototypeOf(e) && this.headers.set("content-type", "application/x-www-form-urlencoded;charset=UTF-8"));
          }, u.blob && (this.blob = function() {
            var e = O(this);
            if (e)
              return e;
            if (this._bodyBlob)
              return Promise.resolve(this._bodyBlob);
            if (this._bodyArrayBuffer)
              return Promise.resolve(new Blob([this._bodyArrayBuffer]));
            if (this._bodyFormData)
              throw new Error("could not read FormData body as blob");
            return Promise.resolve(new Blob([this._bodyText]));
          }), this.arrayBuffer = function() {
            if (this._bodyArrayBuffer) {
              var e = O(this);
              return e || (ArrayBuffer.isView(this._bodyArrayBuffer) ? Promise.resolve(
                this._bodyArrayBuffer.buffer.slice(
                  this._bodyArrayBuffer.byteOffset,
                  this._bodyArrayBuffer.byteOffset + this._bodyArrayBuffer.byteLength
                )
              ) : Promise.resolve(this._bodyArrayBuffer));
            } else {
              if (u.blob)
                return this.blob().then(C);
              throw new Error("could not read as ArrayBuffer");
            }
          }, this.text = function() {
            var e = O(this);
            if (e)
              return e;
            if (this._bodyBlob)
              return I(this._bodyBlob);
            if (this._bodyArrayBuffer)
              return Promise.resolve(L(this._bodyArrayBuffer));
            if (this._bodyFormData)
              throw new Error("could not read FormData body as text");
            return Promise.resolve(this._bodyText);
          }, u.formData && (this.formData = function() {
            return this.text().then(z);
          }), this.json = function() {
            return this.text().then(JSON.parse);
          }, this;
        }
        var N = ["CONNECT", "DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT", "TRACE"];
        function k(e) {
          var t = e.toUpperCase();
          return N.indexOf(t) > -1 ? t : e;
        }
        function w(e, t) {
          if (!(this instanceof w))
            throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.');
          t = t || {};
          var r = t.body;
          if (e instanceof w) {
            if (e.bodyUsed)
              throw new TypeError("Already read");
            this.url = e.url, this.credentials = e.credentials, t.headers || (this.headers = new s(e.headers)), this.method = e.method, this.mode = e.mode, this.signal = e.signal, !r && e._bodyInit != null && (r = e._bodyInit, e.bodyUsed = !0);
          } else
            this.url = String(e);
          if (this.credentials = t.credentials || this.credentials || "same-origin", (t.headers || !this.headers) && (this.headers = new s(t.headers)), this.method = k(t.method || this.method || "GET"), this.mode = t.mode || this.mode || null, this.signal = t.signal || this.signal || (function() {
            if ("AbortController" in a) {
              var o = new AbortController();
              return o.signal;
            }
          })(), this.referrer = null, (this.method === "GET" || this.method === "HEAD") && r)
            throw new TypeError("Body not allowed for GET or HEAD requests");
          if (this._initBody(r), (this.method === "GET" || this.method === "HEAD") && (t.cache === "no-store" || t.cache === "no-cache")) {
            var n = /([?&])_=[^&]*/;
            if (n.test(this.url))
              this.url = this.url.replace(n, "$1_=" + (/* @__PURE__ */ new Date()).getTime());
            else {
              var i = /\?/;
              this.url += (i.test(this.url) ? "&" : "?") + "_=" + (/* @__PURE__ */ new Date()).getTime();
            }
          }
        }
        w.prototype.clone = function() {
          return new w(this, { body: this._bodyInit });
        };
        function z(e) {
          var t = new FormData();
          return e.trim().split("&").forEach(function(r) {
            if (r) {
              var n = r.split("="), i = n.shift().replace(/\+/g, " "), o = n.join("=").replace(/\+/g, " ");
              t.append(decodeURIComponent(i), decodeURIComponent(o));
            }
          }), t;
        }
        function G(e) {
          var t = new s(), r = e.replace(/\r?\n[\t ]+/g, " ");
          return r.split("\r").map(function(n) {
            return n.indexOf(`
`) === 0 ? n.substr(1, n.length) : n;
          }).forEach(function(n) {
            var i = n.split(":"), o = i.shift().trim();
            if (o) {
              var _ = i.join(":").trim();
              try {
                t.append(o, _);
              } catch (x) {
                console.warn("Response " + x.message);
              }
            }
          }), t;
        }
        U.call(w.prototype);
        function c(e, t) {
          if (!(this instanceof c))
            throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.');
          if (t || (t = {}), this.type = "default", this.status = t.status === void 0 ? 200 : t.status, this.status < 200 || this.status > 599)
            throw new RangeError("Failed to construct 'Response': The status provided (0) is outside the range [200, 599].");
          this.ok = this.status >= 200 && this.status < 300, this.statusText = t.statusText === void 0 ? "" : "" + t.statusText, this.headers = new s(t.headers), this.url = t.url || "", this._initBody(e);
        }
        U.call(c.prototype), c.prototype.clone = function() {
          return new c(this._bodyInit, {
            status: this.status,
            statusText: this.statusText,
            headers: new s(this.headers),
            url: this.url
          });
        }, c.error = function() {
          var e = new c(null, { status: 200, statusText: "" });
          return e.ok = !1, e.status = 0, e.type = "error", e;
        };
        var V = [301, 302, 303, 307, 308];
        c.redirect = function(e, t) {
          if (V.indexOf(t) === -1)
            throw new RangeError("Invalid status code");
          return new c(null, { status: t, headers: { location: e } });
        }, l.DOMException = a.DOMException;
        try {
          new l.DOMException();
        } catch {
          l.DOMException = function(t, r) {
            this.message = t, this.name = r;
            var n = Error(t);
            this.stack = n.stack;
          }, l.DOMException.prototype = Object.create(Error.prototype), l.DOMException.prototype.constructor = l.DOMException;
        }
        function P(e, t) {
          return new Promise(function(r, n) {
            var i = new w(e, t);
            if (i.signal && i.signal.aborted)
              return n(new l.DOMException("Aborted", "AbortError"));
            var o = new XMLHttpRequest();
            function _() {
              o.abort();
            }
            o.onload = function() {
              var f = {
                statusText: o.statusText,
                headers: G(o.getAllResponseHeaders() || "")
              };
              i.url.indexOf("file://") === 0 && (o.status < 200 || o.status > 599) ? f.status = 200 : f.status = o.status, f.url = "responseURL" in o ? o.responseURL : f.headers.get("X-Request-URL");
              var m = "response" in o ? o.response : o.responseText;
              setTimeout(function() {
                r(new c(m, f));
              }, 0);
            }, o.onerror = function() {
              setTimeout(function() {
                n(new TypeError("Network request failed"));
              }, 0);
            }, o.ontimeout = function() {
              setTimeout(function() {
                n(new TypeError("Network request timed out"));
              }, 0);
            }, o.onabort = function() {
              setTimeout(function() {
                n(new l.DOMException("Aborted", "AbortError"));
              }, 0);
            };
            function x(f) {
              try {
                return f === "" && a.location.href ? a.location.href : f;
              } catch {
                return f;
              }
            }
            if (o.open(i.method, x(i.url), !0), i.credentials === "include" ? o.withCredentials = !0 : i.credentials === "omit" && (o.withCredentials = !1), "responseType" in o && (u.blob ? o.responseType = "blob" : u.arrayBuffer && (o.responseType = "arraybuffer")), t && typeof t.headers == "object" && !(t.headers instanceof s || a.Headers && t.headers instanceof a.Headers)) {
              var j = [];
              Object.getOwnPropertyNames(t.headers).forEach(function(f) {
                j.push(v(f)), o.setRequestHeader(f, T(t.headers[f]));
              }), i.headers.forEach(function(f, m) {
                j.indexOf(m) === -1 && o.setRequestHeader(m, f);
              });
            } else
              i.headers.forEach(function(f, m) {
                o.setRequestHeader(m, f);
              });
            i.signal && (i.signal.addEventListener("abort", _), o.onreadystatechange = function() {
              o.readyState === 4 && i.signal.removeEventListener("abort", _);
            }), o.send(typeof i._bodyInit > "u" ? null : i._bodyInit);
          });
        }
        return P.polyfill = !0, a.fetch || (a.fetch = P, a.Headers = s, a.Request = w, a.Response = c), l.Headers = s, l.Request = w, l.Response = c, l.fetch = P, l;
      })({});
    })(y), y.fetch.ponyfill = !0, delete y.fetch.polyfill;
    var h = b.fetch ? b : y;
    d = h.fetch, d.default = h.fetch, d.fetch = h.fetch, d.Headers = h.Headers, d.Request = h.Request, d.Response = h.Response, g.exports = d;
  })(E, E.exports)), E.exports;
}
var H = J();
const Z = /* @__PURE__ */ $(H), Q = /* @__PURE__ */ X({
  __proto__: null,
  default: Z
}, [H]);
typeof window < "u" && window.MaplatUi && window.MaplatUi.MaplatUi && (window.MaplatUi = window.MaplatUi.MaplatUi);
export {
  Q as b
};
