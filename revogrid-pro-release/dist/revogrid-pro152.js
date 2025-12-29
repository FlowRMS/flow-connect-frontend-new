import T from "./revogrid-pro238.js";
import Pt from "./revogrid-pro239.js";
const Zt = new Error("#NULL!"), G = new Error("#DIV/0!"), s = new Error("#VALUE!"), ot = new Error("#REF!"), Vt = new Error("#NAME?"), h = new Error("#NUM!"), D = new Error("#N/A"), Jt = new Error("#ERROR!"), on = new Error("#GETTING_DATA");
var Yn = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  data: on,
  div0: G,
  error: Jt,
  na: D,
  name: Vt,
  nil: Zt,
  num: h,
  ref: ot,
  value: s
});
let x = !1;
function Xn() {
  x = !0;
}
function Gn() {
  x = !1;
}
function un(t) {
  t < 60 && (t += 1);
  const r = Math.floor(t - 25569) * 86400, e = new Date(r * 1e3), f = t - Math.floor(t) + 1e-7;
  let o = Math.floor(86400 * f);
  const i = o % 60;
  o -= i;
  const l = Math.floor(o / 3600), c = Math.floor(o / 60) % 60;
  let g = e.getUTCDate(), I = e.getUTCMonth();
  return t >= 60 && t < 61 && (g = 29, I = 1), new Date(e.getUTCFullYear(), I, g, l, c, i);
}
function d(t) {
  const n = new Date(1900, 0, 1), r = t > -22038912e5 ? 2 : 1;
  return Math.ceil((t - n) / 864e5) + r;
}
var wn = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  dateToSerial: d,
  get returnSerial() {
    return x;
  },
  serialToDate: un,
  useDate: Gn,
  useSerial: Xn
});
const Hn = "=", jn = [">", ">=", "<", "<=", "=", "<>"], sn = "operator", ln = "literal", pn = [sn, ln], Dt = sn, _ = ln;
function y(t, n) {
  if (pn.indexOf(n) === -1)
    throw new Error("Unsupported token type: " + n);
  return {
    value: t,
    type: n
  };
}
function Bn(t) {
  return typeof t != "string" || /^\d+(\.\d+)?$/.test(t) && (t = t.indexOf(".") === -1 ? parseInt(t, 10) : parseFloat(t)), t;
}
function Wn(t) {
  const n = t.length, r = [];
  let e = 0, f = "", o = "";
  for (; e < n; ) {
    const i = t.charAt(e);
    switch (i) {
      case ">":
      case "<":
      case "=":
        o = o + i, f.length > 0 && (r.push(f), f = "");
        break;
      default:
        o.length > 0 && (r.push(o), o = ""), f = f + i;
        break;
    }
    e++;
  }
  return f.length > 0 && r.push(f), o.length > 0 && r.push(o), r;
}
function Kn(t) {
  let n = "";
  const r = [];
  for (let e = 0; e < t.length; e++) {
    const f = t[e];
    e === 0 && jn.indexOf(f) >= 0 ? r.push(y(f, Dt)) : n += f;
  }
  return n.length > 0 && r.push(y(Bn(n), _)), r.length > 0 && r[0].type !== Dt && r.unshift(y(Hn, Dt)), r;
}
function qn(t) {
  const n = [];
  let r;
  for (let e = 0; e < t.length; e++) {
    const f = t[e];
    switch (f.type) {
      case Dt:
        r = f.value;
        break;
      case _:
        n.push(f.value);
        break;
    }
  }
  return Qn(n, r);
}
function Qn(t, n) {
  let r = !1;
  switch (n) {
    case ">":
      r = t[0] > t[1];
      break;
    case ">=":
      r = t[0] >= t[1];
      break;
    case "<":
      r = t[0] < t[1];
      break;
    case "<=":
      r = t[0] <= t[1];
      break;
    case "=":
      r = t[0] == t[1];
      break;
    case "<>":
      r = t[0] != t[1];
      break;
  }
  return r;
}
function ht(t) {
  return Kn(Wn(t));
}
const gt = qn;
function Ft(t) {
  const n = [];
  return w(t, (r) => {
    n.push(r);
  }), n;
}
function w(t, n) {
  let r = -1;
  const e = t.length;
  for (; ++r < e && n(t[r], r, t) !== !1; )
    ;
  return t;
}
function kt(t) {
  let n = t.length, r;
  for (; n--; )
    if (r = t[n], typeof r != "number") {
      if (r === !0) {
        t[n] = 1;
        continue;
      }
      if (r === !1) {
        t[n] = 0;
        continue;
      }
      if (typeof r == "string") {
        const e = u(r);
        t[n] = e instanceof Error ? 0 : e;
      }
    }
  return t;
}
function cn(t, n) {
  if (!t)
    return s;
  (!t.every((f) => Array.isArray(f)) || t.length === 0) && (t = [[...t]]), t.map((f, o) => {
    f.map((i, l) => {
      i || (t[o][l] = 0);
    });
  });
  const r = t.reduce((f, o, i) => o.length > t[f].length ? i : f, 0), e = t[r].length;
  return t.map((f) => [...f, ...Array(e - f.length).fill(0)]);
}
function E() {
  let t;
  if (arguments.length === 1) {
    const n = arguments[0];
    t = zn(n) ? Ft.apply(null, arguments) : [n];
  } else
    t = Array.from(arguments);
  for (; !Zn(t); )
    t = qt(t);
  return t;
}
function qt(t) {
  return !t || !t.reduce ? [t] : t.reduce((n, r) => {
    const e = Array.isArray(n), f = Array.isArray(r);
    return e && f ? n.concat(r) : e ? (n.push(r), n) : f ? [n].concat(r) : [n, r];
  });
}
function $n(t, n) {
  return n = n || 1, !t || typeof t.slice != "function" ? t : t.slice(0, t.length - n);
}
function zn(t) {
  return t != null && typeof t.length == "number" && typeof t != "string";
}
function Zn(t) {
  if (!t)
    return !1;
  for (let n = 0; n < t.length; ++n)
    if (Array.isArray(t[n]))
      return !1;
  return !0;
}
function F(t, n) {
  return n = n || 1, !t || typeof t.slice != "function" ? t : t.slice(n);
}
function at(t) {
  return t ? t[0].map((n, r) => t.map((e) => e[r])) : s;
}
function Q(t, n) {
  let r = null;
  return w(t, (e, f) => {
    if (e[0] === n)
      return r = f, !1;
  }), r ?? s;
}
function C() {
  for (let t = 0; t < arguments.length; t++)
    if (arguments[t] instanceof Error)
      return arguments[t];
}
function M() {
  let t = arguments.length;
  for (; t--; )
    if (arguments[t] instanceof Error)
      return !0;
  return !1;
}
function hn(t) {
  return Math.round(t * 1e14) / 1e14;
}
function v() {
  return E.apply(null, arguments).filter((n) => typeof n == "number");
}
function yt(t) {
  if (typeof t == "boolean" || t instanceof Error)
    return t;
  if (typeof t == "number")
    return t !== 0;
  if (typeof t == "string") {
    const n = t.toUpperCase();
    if (n === "TRUE")
      return !0;
    if (n === "FALSE")
      return !1;
  }
  return t instanceof Date && !isNaN(t) ? !0 : s;
}
function O(t) {
  if (!isNaN(t)) {
    if (t instanceof Date)
      return new Date(t);
    const n = parseFloat(t);
    return n < 0 || n >= 2958466 ? h : un(n);
  }
  return typeof t == "string" && (t = /(\d{4})-(\d\d?)-(\d\d?)$/.test(t) ? /* @__PURE__ */ new Date(t + "T00:00:00.000") : new Date(t), !isNaN(t)) ? t : s;
}
function gn(t) {
  let n = t.length, r;
  for (; n--; ) {
    if (r = O(t[n]), r === s)
      return r;
    t[n] = r;
  }
  return t;
}
function u(t) {
  return t instanceof Error ? t : t == null ? 0 : (typeof t == "boolean" && (t = +t), !isNaN(t) && t !== "" ? parseFloat(t) : s);
}
function S(t) {
  let n;
  if (!t || (n = t.length) === 0)
    return s;
  let r;
  for (; n--; ) {
    if (t[n] instanceof Error)
      return t[n];
    if (r = u(t[n]), r instanceof Error)
      return r;
    t[n] = r;
  }
  return t;
}
function U(t) {
  return t instanceof Error ? t : t == null ? "" : t.toString();
}
function Ut() {
  let t = arguments.length;
  for (; t--; )
    if (typeof arguments[t] == "string")
      return !0;
  return !1;
}
function Yt() {
  const t = Ft(arguments), n = S(E(t.shift()));
  if (n instanceof Error)
    return n;
  const r = t, e = r.length / 2;
  for (let o = 0; o < e; o++)
    r[o * 2] = E(r[o * 2]);
  let f = [];
  for (let o = 0; o < n.length; o++) {
    let i = !1;
    for (let l = 0; l < e; l++) {
      const c = r[l * 2][o], g = r[l * 2 + 1], I = g === void 0 || g === "*";
      let N = !1;
      if (I)
        N = !0;
      else {
        const a = ht(g + ""), A = [y(c, _)].concat(
          a
        );
        N = gt(A);
      }
      if (!N) {
        i = !1;
        break;
      }
      i = !0;
    }
    i && f.push(n[o]);
  }
  return f;
}
function et(t) {
  return t != null;
}
const Jn = {};
Jn.TYPE = (t) => {
  switch (t) {
    case Zt:
      return 1;
    case G:
      return 2;
    case s:
      return 3;
    case ot:
      return 4;
    case Vt:
      return 5;
    case h:
      return 6;
    case D:
      return 7;
    case on:
      return 8;
  }
  return D;
};
function jr(t) {
  return t === null;
}
function kn(t) {
  return [s, ot, G, h, Vt, Zt].indexOf(t) >= 0 || typeof t == "number" && (isNaN(t) || !isFinite(t));
}
function dt(t) {
  return kn(t) || t === D;
}
function pr(t) {
  return !(Math.floor(Math.abs(t)) & 1);
}
function yn(t) {
  return t === !0 || t === !1;
}
function Br(t) {
  return t === D;
}
function Wr(t) {
  return typeof t != "string";
}
function xt(t) {
  return typeof t == "number" && !isNaN(t) && isFinite(t);
}
function Kr(t) {
  return !!(Math.floor(Math.abs(t)) & 1);
}
function dn(t) {
  return typeof t == "string";
}
function qr(t) {
  return xt(t) ? t : t instanceof Date ? t.getTime() : t === !0 ? 1 : t === !1 ? 0 : dt(t) ? t : 0;
}
function Qr() {
  return D;
}
function $r(t) {
  if (xt(t))
    return 1;
  if (dn(t))
    return 2;
  if (yn(t))
    return 4;
  if (dt(t))
    return 16;
  if (Array.isArray(t))
    return 64;
}
function zr() {
  if (arguments.length < 2)
    return D;
  const t = arguments[0];
  return t < 1 || t > 254 || arguments.length < t + 1 ? s : arguments[t];
}
function Zr(t, n) {
  if (arguments.length !== 2)
    return D;
  if (n < 0)
    return h;
  if (!(t instanceof Array) || typeof n != "number")
    return s;
  if (t.length !== 0)
    return T.col(t, n);
}
function Jr(t) {
  return arguments.length !== 1 ? D : t instanceof Array ? t.length === 0 ? 0 : T.cols(t) : s;
}
function kr(t, n, r, e) {
  return xn(t, at(n), r, e);
}
function yr(t, n, r) {
  const e = C(t, n, r);
  if (e)
    return e;
  if (!Array.isArray(t))
    return s;
  const f = t.length > 0 && !Array.isArray(t[0]);
  return f && !r ? (r = n, n = 1) : (r = r || 1, n = n || 1), r < 0 || n < 0 ? s : f && n === 1 && r <= t.length ? t[r - 1] : n <= t.length && r <= t[n - 1].length ? t[n - 1][r - 1] : ot;
}
function dr(t, n, r) {
  n = E(n), r = r ? E(r) : n;
  const e = typeof t == "number";
  let f = D;
  for (let o = 0; o < n.length; o++) {
    if (n[o] === t)
      return r[o];
    if (e && n[o] <= t || typeof n[o] == "string" && n[o].localeCompare(t) < 0)
      f = r[o];
    else if (e && n[o] > t)
      return f;
  }
  return f;
}
function xr(t, n, r) {
  if (!t && t !== 0 || !n || (arguments.length === 2 && (r = 1), n = E(n), !(n instanceof Array)) || r !== -1 && r !== 0 && r !== 1)
    return D;
  let e, f;
  for (let o = 0; o < n.length; o++)
    if (r === 1) {
      if (n[o] === t)
        return o + 1;
      n[o] < t && (f ? n[o] > f && (e = o + 1, f = n[o]) : (e = o + 1, f = n[o]));
    } else if (r === 0) {
      if (typeof t == "string" && typeof n[o] == "string") {
        const i = t.toLowerCase().replace(/\?/g, ".").replace(/\*/g, ".*").replace(/~/g, "\\").replace(/\+/g, "\\+").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/\[/g, "\\[").replace(/\]/g, "\\]");
        if (new RegExp("^" + i + "$").test(n[o].toLowerCase()))
          return o + 1;
      } else if (n[o] === t)
        return o + 1;
    } else if (r === -1) {
      if (n[o] === t)
        return o + 1;
      n[o] > t && (f ? n[o] < f && (e = o + 1, f = n[o]) : (e = o + 1, f = n[o]));
    }
  return e || D;
}
function vr(t) {
  return arguments.length !== 1 ? D : t instanceof Array ? t.length === 0 ? 0 : T.rows(t) : s;
}
function mr(t, n = 1, r = 1, e = !1) {
  if (!t || !Array.isArray(t))
    return D;
  if (t.length === 0)
    return 0;
  if (n = u(n), !n || n < 1 || (r = u(r), r !== 1 && r !== -1))
    return s;
  if (e = yt(e), typeof e != "boolean")
    return Vt;
  const f = (l) => l.sort((c, g) => (c = U(c[n - 1]), g = U(g[n - 1]), r === 1 ? c < g ? r * -1 : r : c > g ? r : r * -1)), o = cn(t), i = e ? at(o) : o;
  return n >= 1 && n <= i[0].length ? e ? at(f(i)) : f(i) : s;
}
function br(t) {
  if (!t)
    return D;
  const n = cn(t);
  return at(n);
}
function Mn() {
  const t = [];
  for (let n = 0; n < arguments.length; ++n) {
    let r = !1;
    const e = arguments[n];
    for (let f = 0; f < t.length && (r = t[f] === e, !r); ++f)
      ;
    r || t.push(e);
  }
  return t;
}
function xn(t, n, r, e) {
  if (!n || !r)
    return D;
  e = !(e === 0 || e === !1);
  let f = D, o = !1;
  const i = typeof t == "number", l = typeof t == "string" ? t.toLowerCase() : t;
  for (let c = 0; c < n.length; c++) {
    const g = n[c], I = typeof g[0] == "string" ? g[0].toLowerCase() : g[0];
    if (I === l) {
      f = r < g.length + 1 ? g[r - 1] : ot;
      break;
    } else !o && (i && e && I <= t || e && typeof I == "string" && I.localeCompare(t) < 0) && (f = r < g.length + 1 ? g[r - 1] : ot);
    i && I > t && (o = !0);
  }
  return f;
}
function vn(t) {
  return t = u(t), t === 0 ? s : t instanceof Error ? t : String.fromCharCode(t);
}
function _r(t) {
  if (M(t))
    return t;
  t = t || "";
  const n = /[\0-\x1F]/g;
  return t.replace(n, "");
}
function mn(t) {
  if (M(t))
    return t;
  t = t || "";
  let n = t.charCodeAt(0);
  return isNaN(n) && (n = s), n;
}
function bn() {
  const t = E(arguments), n = C.apply(void 0, t);
  if (n)
    return n;
  let r = 0;
  for (; (r = t.indexOf(!0)) > -1; )
    t[r] = "TRUE";
  let e = 0;
  for (; (e = t.indexOf(!1)) > -1; )
    t[e] = "FALSE";
  return t.join("");
}
const te = bn;
function ne(t, n = 2) {
  if (t = u(t), isNaN(t))
    return s;
  t = hr(t, n);
  const r = {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: n >= 0 ? n : 0,
    maximumFractionDigits: n >= 0 ? n : 0
  }, e = t.toLocaleString("en-US", r);
  return t < 0 ? "$(" + e.slice(2) + ")" : e;
}
function re(t, n) {
  if (arguments.length !== 2)
    return D;
  const r = C(t, n);
  return r || (t = U(t), n = U(n), t === n);
}
function ee(t, n, r) {
  if (arguments.length < 2)
    return D;
  t = U(t), n = U(n), r = r === void 0 ? 0 : r;
  const e = n.indexOf(t, r - 1);
  return e === -1 ? s : e + 1;
}
function _n(t, n = 2, r = !1) {
  if (t = u(t), isNaN(t) || (n = u(n), isNaN(n)))
    return s;
  if (n < 0) {
    const e = Math.pow(10, -n);
    t = Math.round(t / e) * e;
  } else
    t = t.toFixed(n);
  if (r)
    t = t.toString().replace(/,/g, "");
  else {
    const e = t.toString().split(".");
    e[0] = e[0].replace(/\B(?=(\d{3})+$)/g, ","), t = e.join(".");
  }
  return t;
}
function fe(t, n) {
  const r = C(t, n);
  return r || (t = U(t), n = n === void 0 ? 1 : n, n = u(n), n instanceof Error || typeof t != "string" ? s : t.substring(0, n));
}
function oe(t) {
  return arguments.length === 0 ? Jt : t instanceof Error ? t : Array.isArray(t) ? s : U(t).length;
}
function ue(t) {
  return arguments.length !== 1 ? s : (t = U(t), M(t) ? t : t.toLowerCase());
}
function ie(t, n, r) {
  if (n == null)
    return s;
  if (n = u(n), r = u(r), M(n, r) || typeof t != "string")
    return r;
  const e = n - 1, f = e + r;
  return t.substring(e, f);
}
function se(t, n, r) {
  return t = et(t) ? t : "", typeof t == "number" ? t : typeof t != "string" ? D : (n = typeof n > "u" ? "." : n, r = typeof r > "u" ? "," : r, Number(t.replace(n, ".").replace(r, "")));
}
function le(t) {
  return M(t) ? t : isNaN(t) && typeof t == "number" ? s : (t = U(t), t.replace(/\w\S*/g, (n) => n.charAt(0).toUpperCase() + n.substr(1).toLowerCase()));
}
function ce(t, n, r, e) {
  return n = u(n), r = u(r), M(n, r) || typeof t != "string" || typeof e != "string" ? s : t.substr(0, n - 1) + e + t.substr(n - 1 + r);
}
function q(t, n) {
  const r = C(t, n);
  return r || (t = U(t), n = u(n), n instanceof Error ? n : new Array(n + 1).join(t));
}
function he(t, n) {
  const r = C(t, n);
  return r || (t = U(t), n = n === void 0 ? 1 : n, n = u(n), n instanceof Error ? n : t.substring(t.length - n));
}
function ge(t, n, r) {
  let e;
  return typeof t != "string" || typeof n != "string" ? s : (r = r === void 0 ? 0 : r, e = n.toLowerCase().indexOf(t.toLowerCase(), r - 1) + 1, e === 0 ? s : e);
}
function Me(t, n, r, e) {
  if (arguments.length < 3)
    return D;
  if (!t || !n)
    return t;
  if (e === void 0)
    return t.split(n).join(r);
  {
    if (e = Math.floor(Number(e)), Number.isNaN(e) || e <= 0)
      return s;
    let f = 0, o = 0;
    for (; f > -1 && t.indexOf(n, f) > -1; )
      if (f = t.indexOf(n, f + 1), o++, f > -1 && o === e)
        return t.substring(0, f) + r + t.substring(f + n.length);
    return t;
  }
}
function W(t) {
  return t instanceof Error || typeof t == "string" ? t : "";
}
function Ee(t, n) {
  if (t === void 0 || t instanceof Error || n instanceof Error)
    return D;
  if (t instanceof Date)
    return t.toISOString().slice(0, 10);
  if (n == null)
    return "";
  if (typeof n == "number")
    return String(n);
  if (typeof n != "string")
    return s;
  const r = n.startsWith("$") ? "$" : "", e = n.endsWith("%");
  n = n.replace(/%/g, "").replace(/\$/g, "");
  const f = n.includes(".") ? n.split(".")[1].match(/0/g).length : 0, o = !n.includes(",");
  return e && (t = t * 100), t = _n(t, f, o), t.startsWith("-") ? (t = t.replace("-", ""), t = "-" + r + t) : t = r + t, e && (t = t + "%"), t;
}
function Ie(t, n, ...r) {
  if (typeof n != "boolean" && (n = yt(n)), arguments.length < 3)
    return D;
  t = t ?? "";
  let e = E(r), f = n ? e.filter((o) => o) : e;
  if (Array.isArray(t)) {
    t = E(t);
    let o = f.map((l) => [l]), i = 0;
    for (let l = 0; l < o.length - 1; l++)
      o[l].push(t[i]), i++, i === t.length && (i = 0);
    return f = E(o), f.join("");
  }
  return f.join(t);
}
function Ne(t) {
  return t = U(t), t instanceof Error ? t : t.replace(/\s+/g, " ").trim();
}
const Te = vn, Se = mn;
function Ae(t) {
  return t = U(t), t instanceof Error ? t : t.toUpperCase();
}
function De(t) {
  const n = C(t);
  if (n)
    return n;
  if (typeof t == "number")
    return t;
  if (et(t) || (t = ""), typeof t != "string")
    return s;
  const r = /(%)$/.test(t) || /^(%)/.test(t);
  if (t = t.replace(/^[^0-9-]{0,3}/, ""), t = t.replace(/[^0-9]{0,3}$/, ""), t = t.replace(/[ ,]/g, ""), t === "")
    return 0;
  let e = Number(t);
  return isNaN(e) ? s : (e = e || 0, r && (e = e * 0.01), e);
}
const tr = 2.5066282746310002;
function ae() {
  const n = E(arguments).filter(et);
  if (n.length === 0)
    return h;
  const r = S(n);
  return r instanceof Error ? r : T.sum(T(r).subtract(T.mean(r)).abs()[0]) / r.length;
}
function ut() {
  const n = E(arguments).filter(et);
  if (n.length === 0)
    return G;
  const r = C.apply(void 0, n);
  if (r)
    return r;
  const e = v(n), f = e.length;
  let o = 0, i = 0, l;
  for (let c = 0; c < f; c++)
    o += e[c], i += 1;
  return l = o / i, isNaN(l) && (l = h), l;
}
function En() {
  const n = E(arguments).filter(et);
  if (n.length === 0)
    return G;
  const r = C.apply(void 0, n);
  if (r)
    return r;
  const e = n, f = e.length;
  let o = 0, i = 0, l;
  for (let c = 0; c < f; c++) {
    const g = e[c];
    typeof g == "number" && (o += g), g === !0 && o++, g !== null && i++;
  }
  return l = o / i, isNaN(l) && (l = h), l;
}
function Ce(t, n, r) {
  if (arguments.length <= 1)
    return D;
  r = r || t;
  const f = E(r).filter(et);
  if (r = S(f), t = E(t), r instanceof Error)
    return r;
  let o = 0, i = 0;
  const l = n === void 0 || n === "*", c = l ? null : ht(n + "");
  for (let g = 0; g < t.length; g++) {
    const I = t[g];
    if (l)
      i += r[g], o++;
    else {
      const N = [y(I, _)].concat(c);
      gt(N) && (i += r[g], o++);
    }
  }
  return i / o;
}
function Re() {
  const t = Yt(...arguments), r = t.reduce((e, f) => e + f, 0) / t.length;
  return isNaN(r) ? 0 : r;
}
const Xt = {};
Xt.DIST = function(t, n, r, e, f, o) {
  return arguments.length < 4 || (f = f === void 0 ? 0 : f, o = o === void 0 ? 1 : o, t = u(t), n = u(n), r = u(r), f = u(f), o = u(o), M(t, n, r, f, o)) ? s : (t = (t - f) / (o - f), e ? T.beta.cdf(t, n, r) : T.beta.pdf(t, n, r));
};
Xt.INV = (t, n, r, e, f) => (e = e === void 0 ? 0 : e, f = f === void 0 ? 1 : f, t = u(t), n = u(n), r = u(r), e = u(e), f = u(f), M(t, n, r, e, f) ? s : T.beta.inv(t, n, r) * (f - e) + e);
const It = {};
It.DIST = (t, n, r, e) => (t = u(t), n = u(n), r = u(r), e = u(e), M(t, n, r, e) ? s : e ? T.binomial.cdf(t, n, r) : T.binomial.pdf(t, n, r));
It.DIST.RANGE = (t, n, r, e) => {
  if (e = e === void 0 ? r : e, t = u(t), n = u(n), r = u(r), e = u(e), M(t, n, r, e))
    return s;
  let f = 0;
  for (let o = r; o <= e; o++)
    f += Et(t, o) * Math.pow(n, o) * Math.pow(1 - n, t - o);
  return f;
};
It.INV = (t, n, r) => {
  if (t = u(t), n = u(n), r = u(r), M(t, n, r))
    return s;
  let e = 0;
  for (; e <= t; ) {
    if (T.binomial.cdf(e, t, n) >= r)
      return e;
    e++;
  }
};
const Z = {};
Z.DIST = (t, n, r) => (t = u(t), n = u(n), M(t, n) ? s : r ? T.chisquare.cdf(t, n) : T.chisquare.pdf(t, n));
Z.DIST.RT = (t, n) => !t | !n ? D : t < 1 || n > Math.pow(10, 10) ? h : typeof t != "number" || typeof n != "number" ? s : 1 - T.chisquare.cdf(t, n);
Z.INV = (t, n) => (t = u(t), n = u(n), M(t, n) ? s : T.chisquare.inv(t, n));
Z.INV.RT = (t, n) => !t | !n ? D : t < 0 || t > 1 || n < 1 || n > Math.pow(10, 10) ? h : typeof t != "number" || typeof n != "number" ? s : T.chisquare.inv(1 - t, n);
Z.TEST = function(t, n) {
  if (arguments.length !== 2)
    return D;
  if (!(t instanceof Array) || !(n instanceof Array) || t.length !== n.length || t[0] && n[0] && t[0].length !== n[0].length)
    return s;
  const r = t.length;
  let e, f, o;
  for (f = 0; f < r; f++)
    t[f] instanceof Array || (e = t[f], t[f] = [], t[f].push(e)), n[f] instanceof Array || (e = n[f], n[f] = [], n[f].push(e));
  const i = t[0].length, l = i === 1 ? r - 1 : (r - 1) * (i - 1);
  let c = 0;
  const g = Math.PI;
  for (f = 0; f < r; f++)
    for (o = 0; o < i; o++)
      c += Math.pow(t[f][o] - n[f][o], 2) / n[f][o];
  function I(N, a) {
    let A = Math.exp(-0.5 * N);
    a % 2 === 1 && (A = A * Math.sqrt(2 * N / g));
    let L = a;
    for (; L >= 2; )
      A = A * N / L, L = L - 2;
    let R = A, Y = a;
    for (; R > 1e-10 * A; )
      Y = Y + 2, R = R * N / Y, A = A + R;
    return 1 - A;
  }
  return Math.round(I(c, l) * 1e6) / 1e6;
};
const In = {};
In.NORM = (t, n, r) => (t = u(t), n = u(n), r = u(r), M(t, n, r) ? s : T.normalci(1, t, n, r)[1] - 1);
In.T = (t, n, r) => (t = u(t), n = u(n), r = u(r), M(t, n, r) ? s : T.tci(1, t, n, r)[1] - 1);
function Oe(t, n) {
  return t = S(E(t)), n = S(E(n)), M(t, n) ? s : T.corrcoeff(t, n);
}
function Ct() {
  const t = E(arguments);
  return v(t).length;
}
function Rt() {
  const t = E(arguments);
  return t.length - nr(t);
}
function nr() {
  const t = E(arguments);
  let n = 0, r;
  for (let e = 0; e < t.length; e++)
    r = t[e], (r == null || r === "") && n++;
  return n;
}
function Le(t, n) {
  if (t = E(t), n === void 0 || n === "*")
    return t.length;
  let e = 0;
  const f = ht(n + "");
  for (let o = 0; o < t.length; o++) {
    const i = t[o], l = [y(i, _)].concat(f);
    gt(l) && e++;
  }
  return e;
}
function Pe() {
  const t = Ft(arguments), n = new Array(E(t[0]).length);
  for (let e = 0; e < n.length; e++)
    n[e] = !0;
  for (let e = 0; e < t.length; e += 2) {
    const f = E(t[e]), o = t[e + 1];
    if (!(o === void 0 || o === "*")) {
      const l = ht(o + "");
      for (let c = 0; c < f.length; c++) {
        const g = f[c], I = [y(g, _)].concat(l);
        n[c] = n[c] && gt(I);
      }
    }
  }
  let r = 0;
  for (let e = 0; e < n.length; e++)
    n[e] && r++;
  return r;
}
const Nt = {};
Nt.P = (t, n) => {
  if (t = S(E(t)), n = S(E(n)), M(t, n))
    return s;
  const r = T.mean(t), e = T.mean(n);
  let f = 0;
  const o = t.length;
  for (let i = 0; i < o; i++)
    f += (t[i] - r) * (n[i] - e);
  return f / o;
};
Nt.S = (t, n) => (t = S(E(t)), n = S(E(n)), M(t, n) ? s : T.covariance(t, n));
function Ve() {
  const t = S(E(arguments));
  if (t instanceof Error)
    return t;
  const n = T.mean(t);
  let r = 0;
  for (let e = 0; e < t.length; e++)
    r += Math.pow(t[e] - n, 2);
  return r;
}
const Nn = {};
Nn.DIST = (t, n, r) => (t = u(t), n = u(n), M(t, n) ? s : r ? T.exponential.cdf(t, n) : T.exponential.pdf(t, n));
const J = {};
J.DIST = (t, n, r, e) => (t = u(t), n = u(n), r = u(r), M(t, n, r) ? s : e ? T.centralF.cdf(t, n, r) : T.centralF.pdf(t, n, r));
J.DIST.RT = function(t, n, r) {
  return arguments.length !== 3 ? D : t < 0 || n < 1 || r < 1 ? h : typeof t != "number" || typeof n != "number" || typeof r != "number" ? s : 1 - T.centralF.cdf(t, n, r);
};
J.INV = (t, n, r) => (t = u(t), n = u(n), r = u(r), M(t, n, r) ? s : t <= 0 || t > 1 ? h : T.centralF.inv(t, n, r));
J.INV.RT = function(t, n, r) {
  return arguments.length !== 3 ? D : t < 0 || t > 1 || n < 1 || n > Math.pow(10, 10) || r < 1 || r > Math.pow(10, 10) ? h : typeof t != "number" || typeof n != "number" || typeof r != "number" ? s : T.centralF.inv(1 - t, n, r);
};
J.TEST = (t, n) => {
  if (!t || !n || !(t instanceof Array) || !(n instanceof Array))
    return D;
  if (t.length < 2 || n.length < 2)
    return G;
  const r = (l, c) => {
    let g = 0;
    for (let I = 0; I < l.length; I++)
      g += Math.pow(l[I] - c, 2);
    return g;
  }, e = b(t) / t.length, f = b(n) / n.length, o = r(t, e) / (t.length - 1), i = r(n, f) / (n.length - 1);
  return o / i;
};
function Fe(t) {
  return t = u(t), t instanceof Error ? t : Math.log((1 + t) / (1 - t)) / 2;
}
function Ue(t) {
  if (t = u(t), t instanceof Error)
    return t;
  const n = Math.exp(2 * t);
  return (n - 1) / (n + 1);
}
function rr(t, n, r) {
  if (t = u(t), n = S(E(n)), r = S(E(r)), M(t, n, r))
    return s;
  const e = T.mean(r), f = T.mean(n), o = r.length;
  let i = 0, l = 0;
  for (let I = 0; I < o; I++)
    i += (r[I] - e) * (n[I] - f), l += Math.pow(r[I] - e, 2);
  const c = i / l;
  return f - c * e + c * t;
}
function Ye(t, n) {
  if (t = S(E(t)), n = S(E(n)), M(t, n))
    return s;
  const r = t.length, e = n.length, f = [];
  for (let o = 0; o <= e; o++) {
    f[o] = 0;
    for (let i = 0; i < r; i++)
      o === 0 ? t[i] <= n[0] && (f[0] += 1) : o < e ? t[i] > n[o - 1] && t[i] <= n[o] && (f[o] += 1) : o === e && t[i] > n[e - 1] && (f[e] += 1);
  }
  return f;
}
function Gt(t) {
  return t = u(t), t instanceof Error ? t : t === 0 || parseInt(t, 10) === t && t < 0 ? h : T.gammafn(t);
}
Gt.DIST = function(t, n, r, e) {
  return arguments.length !== 4 ? D : t < 0 || n <= 0 || r <= 0 || typeof t != "number" || typeof n != "number" || typeof r != "number" ? s : e ? T.gamma.cdf(t, n, r, !0) : T.gamma.pdf(t, n, r, !1);
};
Gt.INV = function(t, n, r) {
  return arguments.length !== 3 ? D : t < 0 || t > 1 || n <= 0 || r <= 0 ? h : typeof t != "number" || typeof n != "number" || typeof r != "number" ? s : T.gamma.inv(t, n, r);
};
function Tn(t) {
  return t = u(t), t instanceof Error ? t : T.gammaln(t);
}
Tn.PRECISE = function(t) {
  return arguments.length !== 1 ? D : t <= 0 ? h : typeof t != "number" ? s : T.gammaln(t);
};
function Xe(t) {
  return t = u(t), t instanceof Error ? t : T.normal.cdf(t, 0, 1) - 0.5;
}
function Ge() {
  const t = S(E(arguments));
  return t instanceof Error ? t : T.geomean(t);
}
function we(t, n, r, e) {
  if (t = S(E(t)), t instanceof Error)
    return t;
  let f;
  if (n === void 0)
    for (n = [], f = 1; f <= t.length; f++)
      n.push(f);
  if (r === void 0 && (r = n), n = S(E(n)), r = S(E(r)), M(n, r))
    return s;
  e === void 0 && (e = !0);
  const o = t.length;
  let i = 0, l = 0, c = 0, g = 0;
  for (f = 0; f < o; f++) {
    const A = n[f], L = Math.log(t[f]);
    i += A, l += L, c += A * L, g += A * A;
  }
  i /= o, l /= o, c /= o, g /= o;
  let I, N;
  e ? (I = (c - i * l) / (g - i * i), N = l - I * i) : (I = c / g, N = 0);
  const a = [];
  for (f = 0; f < r.length; f++)
    a.push(Math.exp(N + I * r[f]));
  return a;
}
function He() {
  const t = S(E(arguments));
  if (t instanceof Error)
    return t;
  const n = t.length;
  let r = 0;
  for (let e = 0; e < n; e++)
    r += 1 / t[e];
  return n / r;
}
const Sn = {};
Sn.DIST = (t, n, r, e, f) => {
  if (t = u(t), n = u(n), r = u(r), e = u(e), M(t, n, r, e))
    return s;
  function o(l, c, g, I) {
    return Et(g, l) * Et(I - g, c - l) / Et(I, c);
  }
  function i(l, c, g, I) {
    let N = 0;
    for (let a = 0; a <= l; a++)
      N += o(a, c, g, I);
    return N;
  }
  return f ? i(t, n, r, e) : o(t, n, r, e);
};
function je(t, n) {
  return t = S(t), n = S(n), M(t, n) ? s : t.length !== n.length ? D : rr(0, t, n);
}
function pe() {
  const t = S(E(arguments));
  if (t instanceof Error)
    return t;
  const n = T.mean(t), r = t.length;
  let e = 0;
  for (let f = 0; f < r; f++)
    e += Math.pow(t[f] - n, 4);
  return e = e / Math.pow(T.stdev(t, !0), 4), r * (r + 1) / ((r - 1) * (r - 2) * (r - 3)) * e - 3 * (r - 1) * (r - 1) / ((r - 2) * (r - 3));
}
function er(t, n) {
  const r = C.apply(void 0, t);
  return r || (M(n) ? n : (t = v(E(t)), n = u(n), n < 0 || t.length < n ? s : t.sort((e, f) => f - e)[n - 1]));
}
function An(t, n) {
  if (t = S(E(t)), n = S(E(n)), M(t, n))
    return s;
  const r = T.mean(t), e = T.mean(n), f = n.length;
  let o = 0, i = 0;
  for (let g = 0; g < f; g++)
    o += (n[g] - e) * (t[g] - r), i += Math.pow(n[g] - e, 2);
  const l = o / i, c = r - l * e;
  return [l, c];
}
function Be(t, n) {
  if (t = S(E(t)), n = S(E(n)), M(t, n) || t.length !== n.length)
    return s;
  for (let e = 0; e < t.length; e++)
    t[e] = Math.log(t[e]);
  const r = An(t, n);
  return r[0] = Math.round(Math.exp(r[0]) * 1e6) / 1e6, r[1] = Math.round(Math.exp(r[1]) * 1e6) / 1e6, r;
}
const Tt = {};
Tt.DIST = (t, n, r, e) => (t = u(t), n = u(n), r = u(r), M(t, n, r) ? s : e ? T.lognormal.cdf(t, n, r) : T.lognormal.pdf(t, n, r));
Tt.INV = (t, n, r) => (t = u(t), n = u(n), r = u(r), M(t, n, r) ? s : T.lognormal.inv(t, n, r));
function Qt() {
  const t = E(arguments), n = C.apply(void 0, t);
  if (n)
    return n;
  const r = v(t);
  return r.length === 0 ? 0 : Math.max.apply(Math, r);
}
function We() {
  const t = E(arguments), n = C.apply(void 0, t);
  if (n)
    return n;
  let r = kt(t);
  return r = r.map((e) => e ?? 0), r.length === 0 ? 0 : Math.max.apply(Math, r);
}
function Ke() {
  const t = Yt(...arguments);
  return t.length === 0 ? 0 : Math.max.apply(Math, t);
}
function fr() {
  const t = E(arguments), n = C.apply(void 0, t);
  if (n)
    return n;
  const r = kt(t);
  let e = T.median(r);
  return isNaN(e) && (e = h), e;
}
function $t() {
  const t = E(arguments), n = C.apply(void 0, t);
  if (n)
    return n;
  const r = v(t);
  return r.length === 0 ? 0 : Math.min.apply(Math, r);
}
function qe() {
  const t = E(arguments), n = C.apply(void 0, t);
  if (n)
    return n;
  let r = kt(t);
  return r = r.map((e) => e ?? 0), r.length === 0 ? 0 : Math.min.apply(Math, r);
}
function Qe() {
  const t = Yt(...arguments);
  return t.length === 0 ? 0 : Math.min.apply(Math, t);
}
const it = {};
it.MULT = function() {
  const t = S(E(arguments));
  if (t instanceof Error)
    return t;
  const n = t.length, r = {};
  let e = [], f = 0, o;
  for (let i = 0; i < n; i++)
    o = t[i], r[o] = r[o] ? r[o] + 1 : 1, r[o] > f && (f = r[o], e = []), r[o] === f && (e[e.length] = o);
  return e;
};
it.SNGL = function() {
  const t = S(E(arguments));
  return t instanceof Error ? t : it.MULT(t).sort((n, r) => n - r)[0];
};
const Dn = {};
Dn.DIST = (t, n, r, e) => (t = u(t), n = u(n), r = u(r), M(t, n, r) ? s : e ? T.negbin.cdf(t, n, r) : T.negbin.pdf(t, n, r));
const k = {};
k.DIST = (t, n, r, e) => (t = u(t), n = u(n), r = u(r), M(t, n, r) ? s : r <= 0 ? h : e ? T.normal.cdf(t, n, r) : T.normal.pdf(t, n, r));
k.INV = (t, n, r) => (t = u(t), n = u(n), r = u(r), M(t, n, r) ? s : T.normal.inv(t, n, r));
k.S = {};
k.S.DIST = (t, n) => (t = u(t), t instanceof Error ? s : n ? T.normal.cdf(t, 0, 1) : T.normal.pdf(t, 0, 1));
k.S.INV = (t) => (t = u(t), t instanceof Error ? s : T.normal.inv(t, 0, 1));
function or(t, n) {
  if (n = S(E(n)), t = S(E(t)), M(n, t))
    return s;
  const r = T.mean(t), e = T.mean(n), f = t.length;
  let o = 0, i = 0, l = 0;
  for (let c = 0; c < f; c++)
    o += (t[c] - r) * (n[c] - e), i += Math.pow(t[c] - r, 2), l += Math.pow(n[c] - e, 2);
  return o / Math.sqrt(i * l);
}
const K = {};
K.EXC = (t, n) => {
  if (t = S(E(t)), n = u(n), M(t, n))
    return s;
  t = t.sort((o, i) => o - i);
  const r = t.length;
  if (n < 1 / (r + 1) || n > 1 - 1 / (r + 1))
    return h;
  const e = n * (r + 1) - 1, f = Math.floor(e);
  return hn(e === f ? t[e] : t[f] + (e - f) * (t[f + 1] - t[f]));
};
K.INC = (t, n) => {
  if (t = S(E(t)), n = u(n), M(t, n))
    return s;
  t = t.sort((o, i) => o - i);
  const r = t.length, e = n * (r - 1), f = Math.floor(e);
  return hn(e === f ? t[e] : t[f] + (e - f) * (t[f + 1] - t[f]));
};
const wt = {};
wt.EXC = (t, n, r) => {
  if (r = r === void 0 ? 3 : r, t = S(E(t)), n = u(n), r = u(r), M(t, n, r))
    return s;
  t = t.sort((I, N) => I - N);
  const e = Mn.apply(null, t), f = t.length, o = e.length, i = Math.pow(10, r);
  let l = 0, c = !1, g = 0;
  for (; !c && g < o; )
    n === e[g] ? (l = (t.indexOf(e[g]) + 1) / (f + 1), c = !0) : n >= e[g] && (n < e[g + 1] || g === o - 1) && (l = (t.indexOf(e[g]) + 1 + (n - e[g]) / (e[g + 1] - e[g])) / (f + 1), c = !0), g++;
  return Math.floor(l * i) / i;
};
wt.INC = (t, n, r) => {
  if (r = r === void 0 ? 3 : r, t = S(E(t)), n = u(n), r = u(r), M(t, n, r))
    return s;
  t = t.sort((I, N) => I - N);
  const e = Mn.apply(null, t), f = t.length, o = e.length, i = Math.pow(10, r);
  let l = 0, c = !1, g = 0;
  for (; !c && g < o; )
    n === e[g] ? (l = t.indexOf(e[g]) / (f - 1), c = !0) : n >= e[g] && (n < e[g + 1] || g === o - 1) && (l = (t.indexOf(e[g]) + (n - e[g]) / (e[g + 1] - e[g])) / (f - 1), c = !0), g++;
  return Math.floor(l * i) / i;
};
function $e(t, n) {
  return t = u(t), n = u(n), M(t, n) ? s : m(t) / m(t - n);
}
function ze(t, n) {
  return t = u(t), n = u(n), M(t, n) ? s : Math.pow(t, n);
}
function Ze(t) {
  return t = u(t), t instanceof Error ? s : Math.exp(-0.5 * t * t) / tr;
}
const an = {};
an.DIST = (t, n, r) => (t = u(t), n = u(n), M(t, n) ? s : r ? T.poisson.cdf(t, n) : T.poisson.pdf(t, n));
function Je(t, n, r, e) {
  if (r === void 0)
    return 0;
  if (e = e === void 0 ? r : e, t = S(E(t)), n = S(E(n)), r = u(r), e = u(e), M(t, n, r, e))
    return s;
  if (r === e)
    return t.indexOf(r) >= 0 ? n[t.indexOf(r)] : 0;
  const f = t.sort((l, c) => l - c), o = f.length;
  let i = 0;
  for (let l = 0; l < o; l++)
    f[l] >= r && f[l] <= e && (i += n[t.indexOf(f[l])]);
  return i;
}
const st = {};
st.EXC = (t, n) => {
  if (t = S(v(E(t))), n = u(n), M(t, n))
    return s;
  switch (n) {
    case 1:
      return K.EXC(t, 0.25);
    case 2:
      return K.EXC(t, 0.5);
    case 3:
      return K.EXC(t, 0.75);
    default:
      return h;
  }
};
st.INC = (t, n) => {
  if (t = S(v(E(t))), n = u(n), M(t, n))
    return s;
  switch (n) {
    case 1:
      return K.INC(t, 0.25);
    case 2:
      return K.INC(t, 0.5);
    case 3:
      return K.INC(t, 0.75);
    default:
      return h;
  }
};
const Ht = {};
Ht.AVG = (t, n, r) => {
  if (t = u(t), n = S(E(n)), M(t, n))
    return s;
  n = E(n), r = r || !1;
  const e = r ? (i, l) => i - l : (i, l) => l - i;
  n = n.sort(e);
  const f = n.length;
  let o = 0;
  for (let i = 0; i < f; i++)
    n[i] === t && o++;
  return o > 1 ? (2 * n.indexOf(t) + o + 1) / 2 : n.indexOf(t) + 1;
};
Ht.EQ = (t, n, r) => {
  if (t = u(t), n = S(E(n)), M(t, n))
    return s;
  r = r || !1;
  const e = r ? (f, o) => f - o : (f, o) => o - f;
  return n = n.sort(e), n.indexOf(t) + 1;
};
function ke(t, n) {
  if (arguments.length !== 2)
    return D;
  if (n < 0)
    return h;
  if (!(t instanceof Array) || typeof n != "number")
    return s;
  if (t.length !== 0)
    return T.row(t, n);
}
function ye(t, n) {
  return t = S(E(t)), n = S(E(n)), M(t, n) ? s : Math.pow(or(t, n), 2);
}
function Cn() {
  const t = S(E(arguments));
  if (t instanceof Error)
    return t;
  const n = T.mean(t), r = t.length;
  let e = 0;
  for (let f = 0; f < r; f++)
    e += Math.pow(t[f] - n, 3);
  return r * e / ((r - 1) * (r - 2) * Math.pow(T.stdev(t, !0), 3));
}
Cn.P = function() {
  const t = S(E(arguments));
  if (t instanceof Error)
    return t;
  const n = T.mean(t), r = t.length;
  let e = 0, f = 0;
  for (let o = 0; o < r; o++)
    f += Math.pow(t[o] - n, 3), e += Math.pow(t[o] - n, 2);
  return f = f / r, e = e / r, f / Math.pow(e, 3 / 2);
};
function de(t, n) {
  if (t = S(E(t)), n = S(E(n)), M(t, n))
    return s;
  const r = T.mean(n), e = T.mean(t), f = n.length;
  let o = 0, i = 0;
  for (let l = 0; l < f; l++)
    o += (n[l] - r) * (t[l] - e), i += Math.pow(n[l] - r, 2);
  return o / i;
}
function ur(t, n) {
  return t = S(E(t)), n = u(n), M(t, n) ? t : t.sort((r, e) => r - e)[n - 1];
}
function xe(t, n, r) {
  return t = u(t), n = u(n), r = u(r), M(t, n, r) ? s : (t - n) / r;
}
const B = {};
B.P = function() {
  const t = p.P.apply(this, arguments);
  let n = Math.sqrt(t);
  return isNaN(n) && (n = h), n;
};
B.S = function() {
  const t = p.S.apply(this, arguments);
  return Math.sqrt(t);
};
function ve() {
  const t = ir.apply(this, arguments);
  return Math.sqrt(t);
}
function me() {
  const t = sr.apply(this, arguments);
  let n = Math.sqrt(t);
  return isNaN(n) && (n = h), n;
}
function be(t, n) {
  if (t = S(E(t)), n = S(E(n)), M(t, n))
    return s;
  const r = T.mean(n), e = T.mean(t), f = n.length;
  let o = 0, i = 0, l = 0;
  for (let c = 0; c < f; c++)
    o += Math.pow(t[c] - e, 2), i += (n[c] - r) * (t[c] - e), l += Math.pow(n[c] - r, 2);
  return Math.sqrt((o - i * i / l) / (f - 2));
}
W.DIST = (t, n, r) => r !== 1 && r !== 2 ? h : r === 1 ? W.DIST.RT(t, n) : W.DIST["2T"](t, n);
W.DIST["2T"] = function(t, n) {
  return arguments.length !== 2 ? D : t < 0 || n < 1 ? h : typeof t != "number" || typeof n != "number" ? s : (1 - T.studentt.cdf(t, n)) * 2;
};
W.DIST.RT = function(t, n) {
  return arguments.length !== 2 ? D : t < 0 || n < 1 ? h : typeof t != "number" || typeof n != "number" ? s : 1 - T.studentt.cdf(t, n);
};
W.INV = (t, n) => (t = u(t), n = u(n), M(t, n) ? s : T.studentt.inv(t, n));
W.INV["2T"] = (t, n) => (t = u(t), n = u(n), t <= 0 || t > 1 || n < 1 ? h : M(t, n) ? s : Math.abs(T.studentt.inv(t / 2, n)));
W.TEST = (t, n) => {
  if (t = S(E(t)), n = S(E(n)), M(t, n))
    return s;
  const r = T.mean(t), e = T.mean(n);
  let f = 0, o = 0, i;
  for (i = 0; i < t.length; i++)
    f += Math.pow(t[i] - r, 2);
  for (i = 0; i < n.length; i++)
    o += Math.pow(n[i] - e, 2);
  f = f / (t.length - 1), o = o / (n.length - 1);
  const l = Math.abs(r - e) / Math.sqrt(f / t.length + o / n.length);
  return W.DIST["2T"](l, t.length + n.length - 2);
};
function _e(t, n, r) {
  if (t = S(E(t)), n = S(E(n)), r = S(E(r)), M(t, n, r))
    return s;
  const e = An(t, n), f = e[0], o = e[1], i = [];
  return r.forEach((l) => {
    i.push(f * l + o);
  }), i;
}
function tf(t, n) {
  if (t = S(E(t)), n = u(n), M(t, n))
    return s;
  const r = lt(t.length * n, 2) / 2;
  return T.mean(
    $n(
      F(
        t.sort((e, f) => e - f),
        r
      ),
      r
    )
  );
}
const p = {};
p.P = function() {
  const t = v(E(arguments)), n = t.length;
  let r = 0;
  const e = ut(t);
  let f;
  for (let o = 0; o < n; o++)
    r += Math.pow(t[o] - e, 2);
  return f = r / n, isNaN(f) && (f = h), f;
};
p.S = function() {
  const t = v(E(arguments)), n = t.length;
  let r = 0;
  const e = ut(t);
  for (let f = 0; f < n; f++)
    r += Math.pow(t[f] - e, 2);
  return r / (n - 1);
};
function ir() {
  const t = E(arguments), n = t.length;
  let r = 0, e = 0;
  const f = En(t);
  for (let o = 0; o < n; o++) {
    const i = t[o];
    typeof i == "number" ? r += Math.pow(i - f, 2) : i === !0 ? r += Math.pow(1 - f, 2) : r += Math.pow(0 - f, 2), i !== null && e++;
  }
  return r / (e - 1);
}
function sr() {
  const t = E(arguments), n = t.length;
  let r = 0, e = 0;
  const f = En(t);
  let o;
  for (let i = 0; i < n; i++) {
    const l = t[i];
    typeof l == "number" ? r += Math.pow(l - f, 2) : l === !0 ? r += Math.pow(1 - f, 2) : r += Math.pow(0 - f, 2), l !== null && e++;
  }
  return o = r / e, isNaN(o) && (o = h), o;
}
const Rn = {};
Rn.DIST = (t, n, r, e) => (t = u(t), n = u(n), r = u(r), M(t, n, r) ? s : e ? 1 - Math.exp(-Math.pow(t / r, n)) : Math.pow(t, n - 1) * Math.exp(-Math.pow(t / r, n)) * n / Math.pow(r, n));
const On = {};
On.TEST = (t, n, r) => {
  if (t = S(E(t)), n = u(n), M(t, n))
    return s;
  r = r || B.S(t);
  const e = t.length;
  return 1 - k.S.DIST((ut(t) - n) / (r / Math.sqrt(e)), !0);
};
function nf(t) {
  return t = u(t), t instanceof Error ? t : Math.abs(t);
}
function rf(t) {
  if (t = u(t), t instanceof Error)
    return t;
  let n = Math.acos(t);
  return isNaN(n) && (n = h), n;
}
function ef(t) {
  if (t = u(t), t instanceof Error)
    return t;
  let n = Math.log(t + Math.sqrt(t * t - 1));
  return isNaN(n) && (n = h), n;
}
function ff(t) {
  return t = u(t), t instanceof Error ? t : Math.atan(1 / t);
}
function of(t) {
  if (t = u(t), t instanceof Error)
    return t;
  let n = 0.5 * Math.log((t + 1) / (t - 1));
  return isNaN(n) && (n = h), n;
}
function uf(t, n, r, e) {
  if (t = u(t), n = u(t), M(t, n))
    return s;
  switch (t) {
    case 1:
      return ut(r);
    case 2:
      return Ct(r);
    case 3:
      return Rt(r);
    case 4:
      return Qt(r);
    case 5:
      return $t(r);
    case 6:
      return zt(r);
    case 7:
      return B.S(r);
    case 8:
      return B.P(r);
    case 9:
      return b(r);
    case 10:
      return p.S(r);
    case 11:
      return p.P(r);
    case 12:
      return fr(r);
    case 13:
      return it.SNGL(r);
    case 14:
      return er(r, e);
    case 15:
      return ur(r, e);
    case 16:
      return K.INC(r, e);
    case 17:
      return st.INC(r, e);
    case 18:
      return K.EXC(r, e);
    case 19:
      return st.EXC(r, e);
  }
}
function sf(t) {
  if (t == null)
    return 0;
  if (t instanceof Error)
    return t;
  if (!/^M*(?:D?C{0,3}|C[MD])(?:L?X{0,3}|X[CL])(?:V?I{0,3}|I[XV])$/.test(t))
    return s;
  let n = 0;
  return t.replace(/[MDLV]|C[MD]?|X[CL]?|I[XV]?/g, (r) => {
    n += {
      M: 1e3,
      CM: 900,
      D: 500,
      CD: 400,
      C: 100,
      XC: 90,
      L: 50,
      XL: 40,
      X: 10,
      IX: 9,
      V: 5,
      IV: 4,
      I: 1
    }[r];
  }), n;
}
function lf(t) {
  if (t = u(t), t instanceof Error)
    return t;
  let n = Math.asin(t);
  return isNaN(n) && (n = h), n;
}
function cf(t) {
  return t = u(t), t instanceof Error ? t : Math.log(t + Math.sqrt(t * t + 1));
}
function hf(t) {
  return t = u(t), t instanceof Error ? t : Math.atan(t);
}
function gf(t, n) {
  t = u(t), n = u(n);
  const r = C(t, n);
  return r || Math.atan2(t, n);
}
function Mf(t) {
  if (t = u(t), t instanceof Error)
    return t;
  let n = Math.log((1 + t) / (1 - t)) / 2;
  return isNaN(n) && (n = h), n;
}
function Ef(t, n, r) {
  t = u(t), n = u(n), r = u(r);
  const e = C(t, n, r);
  if (e)
    return e;
  if (n === 0)
    return h;
  const f = t.toString(n);
  return new Array(Math.max(r + 1 - f.length, 0)).join("0") + f;
}
function nt(t, n) {
  t = u(t), n = u(n);
  const r = C(t, n);
  return r || (n === 0 ? 0 : t > 0 && n < 0 ? h : Math.ceil(t / n) * n);
}
nt.MATH = (t, n, r = 0) => {
  n === void 0 && (n = t > 0 ? 1 : -1), t = u(t), n = u(n), r = u(r);
  const e = C(t, n, r);
  return e || (n === 0 ? 0 : (n = Math.abs(n), r === 0 || t > 0 ? Math.ceil(t / n) * n : Math.floor(t / n) * n));
};
nt.PRECISE = (t, n) => nt.MATH(t, n);
function Et(t, n) {
  t = u(t), n = u(n);
  const r = C(t, n);
  return r || (t < n ? h : m(t) / (m(n) * m(t - n)));
}
function If(t, n) {
  t = u(t), n = u(n);
  const r = C(t, n);
  return r || (t < n ? h : t === 0 && n === 0 ? 1 : Et(t + n - 1, t - 1));
}
function Nf(t) {
  return t = u(t), t instanceof Error ? t : Math.cos(t);
}
function Tf(t) {
  return t = u(t), t instanceof Error ? t : (Math.exp(t) + Math.exp(-t)) / 2;
}
function Sf(t) {
  return t = u(t), t instanceof Error ? t : t === 0 ? G : 1 / Math.tan(t);
}
function Af(t) {
  if (t = u(t), t instanceof Error)
    return t;
  if (t === 0)
    return G;
  const n = Math.exp(2 * t);
  return (n + 1) / (n - 1);
}
function Df(t) {
  return t = u(t), t instanceof Error ? t : t === 0 ? G : 1 / Math.sin(t);
}
function af(t) {
  return t = u(t), t instanceof Error ? t : t === 0 ? G : 2 / (Math.exp(t) - Math.exp(-t));
}
function Cf(t, n) {
  if (arguments.length < 2)
    return D;
  t = t || "0", n = u(n);
  const r = C(t, n);
  if (r)
    return r;
  if (n === 0)
    return h;
  const e = parseInt(t, n);
  return isNaN(e) ? h : e;
}
function Rf(t) {
  return t = u(t), t instanceof Error ? t : t * 180 / Math.PI;
}
function Of(t) {
  return t = u(t), t instanceof Error ? t : nt.MATH(t, -2, -1);
}
function Lf(t) {
  return arguments.length < 1 ? D : arguments.length > 1 ? Jt : (t = u(t), t instanceof Error || (t = Math.exp(t)), t);
}
const St = [];
function m(t) {
  if (t = u(t), t instanceof Error)
    return t;
  const n = Math.floor(t);
  return n === 0 || n === 1 ? 1 : (St[n] > 0 || (St[n] = m(n - 1) * n), St[n]);
}
function lr(t) {
  if (t = u(t), t instanceof Error)
    return t;
  const n = Math.floor(t);
  return n <= 0 ? 1 : n * lr(n - 2);
}
function lt(t, n) {
  t = u(t), n = u(n);
  const r = C(t, n);
  return r || (n ? t > 0 && n < 0 ? h : Math.floor(t / n) * n : G);
}
lt.MATH = (t, n = 1, r = 0) => {
  t = u(t), n = u(n), r = u(r);
  const e = C(t, n, r);
  return e || (n === 0 ? 0 : (n = Math.abs(n), r === 0 || t > 0 ? Math.floor(t / n) * n : Math.ceil(t / n) * n));
};
lt.PRECISE = (t, n) => lt.MATH(t, n);
function Pf() {
  const t = S(E(arguments));
  if (t instanceof Error)
    return t;
  const n = t.length, r = t[0];
  let e = r < 0 ? -r : r;
  for (let f = 1; f < n; f++) {
    const o = t[f];
    let i = o < 0 ? -o : o;
    for (; e && i; )
      e > i ? e %= i : i %= e;
    e += i;
  }
  return e;
}
function Vf(t) {
  return t = u(t), t instanceof Error ? t : Math.floor(t);
}
const Ff = {
  CEILING: nt
};
function Uf() {
  const t = S(E(arguments));
  if (t instanceof Error)
    return t;
  for (var n, r, e, f, o = 1; (e = t.pop()) !== void 0; ) {
    if (e === 0)
      return 0;
    for (; e > 1; ) {
      if (e % 2) {
        for (n = 3, r = Math.floor(Math.sqrt(e)); n <= r && e % n; n += 2)
          ;
        f = n <= r ? n : e;
      } else
        f = 2;
      for (e /= f, o *= f, n = t.length; n; t[--n] % f === 0 && (t[n] /= f) === 1 && t.splice(n, 1))
        ;
    }
  }
  return o;
}
function Yf(t) {
  return t = u(t), t instanceof Error ? t : t === 0 ? h : Math.log(t);
}
function Xf(t, n) {
  t = u(t), n = n ? u(n) : 10;
  const r = C(t, n);
  return r || (t === 0 || n === 0 ? h : Math.log(t) / Math.log(n));
}
function Gf(t) {
  return t = u(t), t instanceof Error ? t : t === 0 ? h : Math.log(t) / Math.log(10);
}
function wf(t, n) {
  return (
    //Arguments are not arrays
    !Array.isArray(t) || !Array.isArray(n) || // There are empty arrays
    t.some((e) => !e.length) || n.some((e) => !e.length) || // Not all array elements are numbers
    qt(t).some((e) => typeof e != "number") || qt(n).some((e) => typeof e != "number") || // Number of columns in array1 is different from the number of rows in array2
    t[0].length !== n.length ? s : Array(t.length).fill(0).map(() => Array(n[0].length).fill(0)).map((e, f) => e.map((o, i) => t[f].reduce((l, c, g) => l + c * n[g][i], 0)))
  );
}
function Hf(t, n) {
  t = u(t), n = u(n);
  const r = C(t, n);
  if (r)
    return r;
  if (n === 0)
    return G;
  let e = Math.abs(t % n);
  return e = t < 0 ? n - e : e, n > 0 ? e : -e;
}
function jf(t, n) {
  t = u(t), n = u(n);
  const r = C(t, n);
  return r || (t * n === 0 ? 0 : t * n < 0 ? h : Math.round(t / n) * n);
}
function pf() {
  const t = S(E(arguments));
  if (t instanceof Error)
    return t;
  let n = 0, r = 1;
  for (let e = 0; e < t.length; e++)
    n += t[e], r *= m(t[e]);
  return m(n) / r;
}
function Bf(t) {
  return arguments.length > 1 ? D : (t = parseInt(t), !t || t <= 0 ? s : Array(t).fill(0).map(() => Array(t).fill(0)).map((n, r) => (n[r] = 1, n)));
}
function Wf(t) {
  if (t = u(t), t instanceof Error)
    return t;
  let n = Math.ceil(Math.abs(t));
  return n = n & 1 ? n : n + 1, t >= 0 ? n : -n;
}
function Kf() {
  return Math.PI;
}
function cr(t, n) {
  t = u(t), n = u(n);
  const r = C(t, n);
  if (r)
    return r;
  if (t === 0 && n === 0)
    return h;
  const e = Math.pow(t, n);
  return isNaN(e) ? h : e;
}
function zt() {
  const n = E(arguments).filter((f) => f != null);
  if (n.length === 0)
    return 0;
  const r = S(n);
  if (r instanceof Error)
    return r;
  let e = 1;
  for (let f = 0; f < r.length; f++)
    e *= r[f];
  return e;
}
function qf(t, n) {
  t = u(t), n = u(n);
  const r = C(t, n);
  return r || parseInt(t / n, 10);
}
function Qf(t) {
  return t = u(t), t instanceof Error ? t : t * Math.PI / 180;
}
function $f() {
  return Math.random();
}
function zf(t, n) {
  t = u(t), n = u(n);
  const r = C(t, n);
  return r || t + Math.ceil((n - t + 1) * Math.random()) - 1;
}
function Zf(t) {
  if (t = u(t), t instanceof Error)
    return t;
  const n = String(t).split(""), r = [
    "",
    "C",
    "CC",
    "CCC",
    "CD",
    "D",
    "DC",
    "DCC",
    "DCCC",
    "CM",
    "",
    "X",
    "XX",
    "XXX",
    "XL",
    "L",
    "LX",
    "LXX",
    "LXXX",
    "XC",
    "",
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX"
  ];
  let e = "", f = 3;
  for (; f--; )
    e = (r[+n.pop() + f * 10] || "") + e;
  return new Array(+n.join("") + 1).join("M") + e;
}
function hr(t, n) {
  t = u(t), n = u(n);
  const r = C(t, n);
  return r || +(Math.round(+(t + "e" + n)) + "e" + n * -1);
}
function Jf(t, n) {
  t = u(t), n = u(n);
  const r = C(t, n);
  return r || (t > 0 ? 1 : -1) * Math.floor(Math.abs(t) * Math.pow(10, n)) / Math.pow(10, n);
}
function kf(t, n) {
  t = u(t), n = u(n);
  const r = C(t, n);
  return r || (t > 0 ? 1 : -1) * Math.ceil(Math.abs(t) * Math.pow(10, n)) / Math.pow(10, n);
}
function yf(t) {
  return t = u(t), t instanceof Error ? t : 1 / Math.cos(t);
}
function df(t) {
  return t = u(t), t instanceof Error ? t : 2 / (Math.exp(t) + Math.exp(-t));
}
function xf(t, n, r, e) {
  if (t = u(t), n = u(n), r = u(r), e = S(e), M(t, n, r, e))
    return s;
  let f = e[0] * Math.pow(t, n);
  for (let o = 1; o < e.length; o++)
    f += e[o] * Math.pow(t, n + o * r);
  return f;
}
function vf(t) {
  return t = u(t), t instanceof Error ? t : t < 0 ? -1 : t === 0 ? 0 : 1;
}
function mf(t) {
  return t = u(t), t instanceof Error ? t : Math.sin(t);
}
function bf(t) {
  return t = u(t), t instanceof Error ? t : (Math.exp(t) - Math.exp(-t)) / 2;
}
function _f(t) {
  return t = u(t), t instanceof Error ? t : t < 0 ? h : Math.sqrt(t);
}
function to(t) {
  return t = u(t), t instanceof Error ? t : Math.sqrt(t * Math.PI);
}
function no(t, n) {
  if (t = u(t), t instanceof Error)
    return t;
  switch (t) {
    case 1:
      return ut(n);
    case 2:
      return Ct(n);
    case 3:
      return Rt(n);
    case 4:
      return Qt(n);
    case 5:
      return $t(n);
    case 6:
      return zt(n);
    case 7:
      return B.S(n);
    case 8:
      return B.P(n);
    case 9:
      return b(n);
    case 10:
      return p.S(n);
    case 11:
      return p.P(n);
    // no hidden values for us
    case 101:
      return ut(n);
    case 102:
      return Ct(n);
    case 103:
      return Rt(n);
    case 104:
      return Qt(n);
    case 105:
      return $t(n);
    case 106:
      return zt(n);
    case 107:
      return B.S(n);
    case 108:
      return B.P(n);
    case 109:
      return b(n);
    case 110:
      return p.S(n);
    case 111:
      return p.P(n);
  }
}
function b() {
  let t = 0;
  return w(Ft(arguments), (n) => {
    if (t instanceof Error)
      return !1;
    if (n instanceof Error)
      t = n;
    else if (typeof n == "number")
      t += n;
    else if (typeof n == "string") {
      const r = parseFloat(n);
      !isNaN(r) && (t += r);
    } else if (Array.isArray(n)) {
      const r = b.apply(null, n);
      r instanceof Error ? t = r : t += r;
    }
  }), t;
}
function ro(t, n, r) {
  if (t = E(t), r = r ? E(r) : t, t instanceof Error)
    return t;
  if (n == null || n instanceof Error)
    return 0;
  let e = 0;
  const f = n === "*", o = f ? null : ht(n + "");
  for (let i = 0; i < t.length; i++) {
    const l = t[i], c = r[i];
    if (f)
      e += l;
    else {
      const g = [y(l, _)].concat(o);
      e += gt(g) ? c : 0;
    }
  }
  return e;
}
function eo() {
  const t = Yt(...arguments);
  return b(t);
}
function fo() {
  if (!arguments || arguments.length === 0)
    return s;
  const t = arguments.length + 1;
  let n = 0, r, e, f, o;
  for (let i = 0; i < arguments[0].length; i++)
    if (arguments[0][i] instanceof Array)
      for (let l = 0; l < arguments[0][i].length; l++) {
        for (r = 1, e = 1; e < t; e++) {
          const c = arguments[e - 1][i][l];
          if (c instanceof Error)
            return c;
          if (o = u(c), o instanceof Error)
            return o;
          r *= o;
        }
        n += r;
      }
    else {
      for (r = 1, e = 1; e < t; e++) {
        const l = arguments[e - 1][i];
        if (l instanceof Error)
          return l;
        if (f = u(l), f instanceof Error)
          return f;
        r *= f;
      }
      n += r;
    }
  return n;
}
function oo() {
  const t = S(E(arguments));
  if (t instanceof Error)
    return t;
  let n = 0;
  const r = t.length;
  for (let e = 0; e < r; e++)
    n += xt(t[e]) ? t[e] * t[e] : 0;
  return n;
}
function uo(t, n) {
  if (t = S(E(t)), n = S(E(n)), M(t, n))
    return s;
  let r = 0;
  for (let e = 0; e < t.length; e++)
    r += t[e] * t[e] - n[e] * n[e];
  return r;
}
function io(t, n) {
  if (t = S(E(t)), n = S(E(n)), M(t, n))
    return s;
  let r = 0;
  t = S(E(t)), n = S(E(n));
  for (let e = 0; e < t.length; e++)
    r += t[e] * t[e] + n[e] * n[e];
  return r;
}
function so(t, n) {
  if (t = S(E(t)), n = S(E(n)), M(t, n))
    return s;
  let r = 0;
  t = E(t), n = E(n);
  for (let e = 0; e < t.length; e++)
    r += Math.pow(t[e] - n[e], 2);
  return r;
}
function lo(t) {
  return t = u(t), t instanceof Error ? t : Math.tan(t);
}
function co(t) {
  if (t = u(t), t instanceof Error)
    return t;
  const n = Math.exp(2 * t);
  return (n - 1) / (n + 1);
}
function ho(t, n) {
  t = u(t), n = u(n);
  const r = C(t, n);
  return r || (t > 0 ? 1 : -1) * Math.floor(Math.abs(t) * Math.pow(10, n)) / Math.pow(10, n);
}
function gr(t, n) {
  if (arguments.length !== 2)
    return D;
  t = u(t), n = u(n);
  const r = C(t, n);
  return r || t + n;
}
function Mr(t, n) {
  if (arguments.length !== 2)
    return D;
  t = u(t), n = u(n);
  const r = C(t, n);
  return r || (n === 0 ? G : t / n);
}
function Er(t, n) {
  return arguments.length !== 2 ? D : t instanceof Error ? t : n instanceof Error ? n : (t === null && (t = void 0), n === null && (n = void 0), t === n);
}
function Ir(t, n) {
  if (arguments.length !== 2)
    return D;
  if (t instanceof Error)
    return t;
  if (n instanceof Error)
    return n;
  Ut(t, n) ? (t = U(t), n = U(n)) : (t = u(t), n = u(n));
  const r = C(t, n);
  return r || t > n;
}
function Nr(t, n) {
  if (arguments.length !== 2)
    return D;
  Ut(t, n) ? (t = U(t), n = U(n)) : (t = u(t), n = u(n));
  const r = C(t, n);
  return r || t >= n;
}
function Tr(t, n) {
  if (arguments.length !== 2)
    return D;
  Ut(t, n) ? (t = U(t), n = U(n)) : (t = u(t), n = u(n));
  const r = C(t, n);
  return r || t < n;
}
function Sr(t, n) {
  if (arguments.length !== 2)
    return D;
  Ut(t, n) ? (t = U(t), n = U(n)) : (t = u(t), n = u(n));
  const r = C(t, n);
  return r || t <= n;
}
function Ar(t, n) {
  if (arguments.length !== 2)
    return D;
  t = u(t), n = u(n);
  const r = C(t, n);
  return r || t - n;
}
function Dr(t, n) {
  if (arguments.length !== 2)
    return D;
  t = u(t), n = u(n);
  const r = C(t, n);
  return r || t * n;
}
function ar(t, n) {
  return arguments.length !== 2 ? D : t instanceof Error ? t : n instanceof Error ? n : (t === null && (t = void 0), n === null && (n = void 0), t !== n);
}
function Cr(t, n) {
  return arguments.length !== 2 ? D : cr(t, n);
}
var Rr = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  ADD: gr,
  DIVIDE: Mr,
  EQ: Er,
  GT: Ir,
  GTE: Nr,
  LT: Tr,
  LTE: Sr,
  MINUS: Ar,
  MULTIPLY: Dr,
  NE: ar,
  POW: Cr
});
const Or = [
  void 0,
  0,
  1,
  void 0,
  void 0,
  void 0,
  void 0,
  void 0,
  void 0,
  void 0,
  void 0,
  void 0,
  1,
  2,
  3,
  4,
  5,
  6,
  0
], Lr = [
  [],
  [1, 2, 3, 4, 5, 6, 7],
  [7, 1, 2, 3, 4, 5, 6],
  [6, 0, 1, 2, 3, 4, 5],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [7, 1, 2, 3, 4, 5, 6],
  [6, 7, 1, 2, 3, 4, 5],
  [5, 6, 7, 1, 2, 3, 4],
  [4, 5, 6, 7, 1, 2, 3],
  [3, 4, 5, 6, 7, 1, 2],
  [2, 3, 4, 5, 6, 7, 1],
  [1, 2, 3, 4, 5, 6, 7]
], Ot = [
  [],
  [6, 0],
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  void 0,
  void 0,
  void 0,
  [0, 0],
  [1, 1],
  [2, 2],
  [3, 3],
  [4, 4],
  [5, 5],
  [6, 6]
];
function go(t, n, r) {
  let e;
  return t = u(t), n = u(n), r = u(r), M(t, n, r) ? e = s : (e = new Date(t, n - 1, r), e.getFullYear() < 0 && (e = h)), x ? d(e) : e;
}
function tt(t, n, r) {
  r = r.toUpperCase(), t = O(t), n = O(n);
  const e = t.getFullYear(), f = t.getMonth(), o = t.getDate(), i = n.getFullYear(), l = n.getMonth(), c = n.getDate();
  let g;
  switch (r) {
    case "Y":
      g = Math.floor(Ln(t, n));
      break;
    case "D":
      g = ft(n, t);
      break;
    case "M":
      g = l - f + 12 * (i - e), c < o && g--;
      break;
    case "MD":
      o <= c ? g = c - o : (l === 0 ? (t.setFullYear(i - 1), t.setMonth(12)) : (t.setFullYear(i), t.setMonth(l - 1)), g = ft(n, t));
      break;
    case "YM":
      g = l - f + 12 * (i - e), c < o && g--, g = g % 12;
      break;
    case "YD":
      l > f || l === f && c < o ? t.setFullYear(i) : t.setFullYear(i - 1), g = ft(n, t);
      break;
  }
  return g;
}
function Mo(t) {
  if (typeof t != "string")
    return s;
  const n = Date.parse(t);
  if (isNaN(n))
    return s;
  const r = new Date(t);
  return x ? d(r) : r;
}
function Eo(t) {
  const n = O(t);
  return n instanceof Error ? n : n.getDate();
}
function Lt(t) {
  const n = new Date(t);
  return n.setHours(0, 0, 0, 0), n;
}
function ft(t, n) {
  return t = O(t), n = O(n), t instanceof Error ? t : n instanceof Error ? n : d(Lt(t)) - d(Lt(n));
}
function rt(t, n, r) {
  if (r = yt(r || "false"), t = O(t), n = O(n), t instanceof Error)
    return t;
  if (n instanceof Error)
    return n;
  if (r instanceof Error)
    return r;
  const e = t.getMonth();
  let f = n.getMonth(), o, i;
  if (r)
    o = t.getDate() === 31 ? 30 : t.getDate(), i = n.getDate() === 31 ? 30 : n.getDate();
  else {
    const l = new Date(t.getFullYear(), e + 1, 0).getDate(), c = new Date(n.getFullYear(), f + 1, 0).getDate();
    o = t.getDate() === l ? 30 : t.getDate(), n.getDate() === c ? o < 30 ? (f++, i = 1) : i = 30 : i = n.getDate();
  }
  return 360 * (n.getFullYear() - t.getFullYear()) + 30 * (f - e) + (i - o);
}
function Io(t, n) {
  if (t = O(t), t instanceof Error)
    return t;
  if (isNaN(n))
    return s;
  let r = t.getDate();
  t.setDate(1), n = parseInt(n, 10), t.setMonth(t.getMonth() + n);
  let e = t.getMonth();
  if (r > 28) {
    let f = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][e], o = t.getFullYear();
    e === 1 && (o % 4 === 0 && o % 100 !== 0 || o % 400 === 0) && (f = 29), r = Math.min(r, f);
  }
  return t.setDate(r), x ? d(t) : t;
}
function No(t, n) {
  if (t = O(t), t instanceof Error)
    return t;
  if (isNaN(n))
    return s;
  n = parseInt(n, 10);
  const r = new Date(t.getFullYear(), t.getMonth() + n + 1, 0);
  return x ? d(r) : r;
}
function To(t) {
  return t = O(t), t instanceof Error ? t : t.getHours();
}
function Pr(t) {
  if (t = O(t), t instanceof Error)
    return t;
  t = Lt(t), t.setDate(t.getDate() + 4 - (t.getDay() || 7));
  const n = new Date(t.getFullYear(), 0, 1);
  return Math.ceil(((t - n) / 864e5 + 1) / 7);
}
function So(t) {
  return t = O(t), t instanceof Error ? t : t.getMinutes();
}
function Ao(t) {
  return t = O(t), t instanceof Error ? t : t.getMonth() + 1;
}
function vt(t, n, r) {
  return vt.INTL(t, n, 1, r);
}
vt.INTL = (t, n, r, e) => {
  if (t = O(t), t instanceof Error)
    return t;
  if (n = O(n), n instanceof Error)
    return n;
  let f = !1;
  const o = [], i = [1, 2, 3, 4, 5, 6, 0], l = new RegExp("^[0|1]{7}$");
  if (r === void 0)
    r = Ot[1];
  else if (typeof r == "string" && l.test(r)) {
    f = !0, r = r.split("");
    for (let N = 0; N < r.length; N++)
      r[N] === "1" && o.push(i[N]);
  } else
    r = Ot[r];
  if (!(r instanceof Array))
    return s;
  e === void 0 ? e = [] : e instanceof Array || (e = [e]);
  for (let N = 0; N < e.length; N++) {
    const a = O(e[N]);
    if (a instanceof Error)
      return a;
    e[N] = a;
  }
  const c = Math.round((n - t) / (1e3 * 60 * 60 * 24)) + 1;
  let g = c;
  const I = t;
  for (let N = 0; N < c; N++) {
    const a = (/* @__PURE__ */ new Date()).getTimezoneOffset() > 0 ? I.getUTCDay() : I.getDay();
    let A = f ? o.includes(a) : a === r[0] || a === r[1];
    for (let L = 0; L < e.length; L++) {
      const R = e[L];
      if (R.getDate() === I.getDate() && R.getMonth() === I.getMonth() && R.getFullYear() === I.getFullYear()) {
        A = !0;
        break;
      }
    }
    A && g--, I.setDate(I.getDate() + 1);
  }
  return g;
};
function Do() {
  return x ? d(/* @__PURE__ */ new Date()) : /* @__PURE__ */ new Date();
}
function ao(t) {
  return t = O(t), t instanceof Error ? t : t.getSeconds();
}
function Co(t, n, r) {
  return t = u(t), n = u(n), r = u(r), M(t, n, r) ? s : t < 0 || n < 0 || r < 0 ? h : (3600 * t + 60 * n + r) / 86400;
}
function Ro(t) {
  return t = O(t), t instanceof Error ? t : (3600 * t.getHours() + 60 * t.getMinutes() + t.getSeconds()) / 86400;
}
function Oo() {
  const t = Lt(/* @__PURE__ */ new Date());
  return x ? d(t) : t;
}
function Lo(t, n) {
  if (t = O(t), t instanceof Error)
    return t;
  n === void 0 && (n = 1);
  const r = t.getDay();
  return Lr[n][r];
}
function Po(t, n) {
  if (t = O(t), t instanceof Error)
    return t;
  if (n === void 0 && (n = 1), n === 21)
    return Pr(t);
  const r = Or[n];
  let e = new Date(t.getFullYear(), 0, 1);
  const f = e.getDay() < r ? 1 : 0;
  return e -= Math.abs(e.getDay() - r) * 24 * 60 * 60 * 1e3, Math.floor((t - e) / (1e3 * 60 * 60 * 24) / 7 + 1) + f;
}
function mt(t, n, r) {
  return mt.INTL(t, n, 1, r);
}
mt.INTL = (t, n, r, e) => {
  if (t = O(t), t instanceof Error)
    return t;
  if (n = u(n), n instanceof Error)
    return n;
  if (r === void 0 ? r = Ot[1] : r = Ot[r], !(r instanceof Array))
    return s;
  e === void 0 ? e = [] : e instanceof Array || (e = [e]);
  for (let i = 0; i < e.length; i++) {
    const l = O(e[i]);
    if (l instanceof Error)
      return l;
    e[i] = l;
  }
  let f = 0;
  const o = Math.sign(n);
  for (; f < n * o; ) {
    t.setDate(t.getDate() + o);
    const i = t.getDay();
    if (!(i === r[0] || i === r[1])) {
      for (let l = 0; l < e.length; l++) {
        const c = e[l];
        if (c.getDate() === t.getDate() && c.getMonth() === t.getMonth() && c.getFullYear() === t.getFullYear()) {
          f--;
          break;
        }
      }
      f++;
    }
  }
  return t.getFullYear() < 1900 ? s : t;
};
function Vo(t) {
  return t = O(t), t instanceof Error ? t : t.getFullYear();
}
function Bt(t) {
  return new Date(t, 1, 29).getMonth() === 1;
}
function At(t, n) {
  return Math.ceil((n - t) / 1e3 / 60 / 60 / 24);
}
function Ln(t, n, r) {
  if (t = O(t), t instanceof Error)
    return t;
  if (n = O(n), n instanceof Error)
    return n;
  r = r || 0;
  let e = t.getDate();
  const f = t.getMonth() + 1, o = t.getFullYear();
  let i = n.getDate();
  const l = n.getMonth() + 1, c = n.getFullYear();
  switch (r) {
    case 0:
      return e === 31 && i === 31 ? (e = 30, i = 30) : e === 31 ? e = 30 : e === 30 && i === 31 && (i = 30), (i + l * 30 + c * 360 - (e + f * 30 + o * 360)) / 360;
    case 1: {
      const g = (L, R) => {
        const Y = L.getFullYear(), H = new Date(Y, 2, 1);
        if (Bt(Y) && L < H && R >= H)
          return !0;
        const X = R.getFullYear(), z = new Date(X, 2, 1);
        return Bt(X) && R >= z && L < z;
      };
      let I = 365;
      if (o === c || o + 1 === c && (f > l || f === l && e >= i))
        return (o === c && Bt(o) || g(t, n) || l === 1 && i === 29) && (I = 366), At(t, n) / I;
      const N = c - o + 1, A = (new Date(c + 1, 0, 1) - new Date(o, 0, 1)) / 1e3 / 60 / 60 / 24 / N;
      return At(t, n) / A;
    }
    case 2:
      return At(t, n) / 360;
    case 3:
      return At(t, n) / 365;
    case 4:
      return (i + l * 30 + c * 360 - (e + f * 30 + o * 360)) / 360;
  }
}
function bt(t) {
  return /^[01]{1,10}$/.test(t);
}
function Fo(t, n) {
  return t = u(t), n = u(n), M(t, n) ? s : Pt.besseli(t, n);
}
function Uo(t, n) {
  return t = u(t), n = u(n), M(t, n) ? s : Pt.besselj(t, n);
}
function Yo(t, n) {
  return t = u(t), n = u(n), M(t, n) ? s : Pt.besselk(t, n);
}
function Xo(t, n) {
  return t = u(t), n = u(n), M(t, n) ? s : Pt.bessely(t, n);
}
function Go(t) {
  if (!bt(t))
    return h;
  const n = parseInt(t, 2), r = t.toString();
  return r.length === 10 && r.substring(0, 1) === "1" ? parseInt(r.substring(1), 2) - 512 : n;
}
function wo(t, n) {
  if (!bt(t))
    return h;
  const r = t.toString();
  if (r.length === 10 && r.substring(0, 1) === "1")
    return (1099511627264 + parseInt(r.substring(1), 2)).toString(16);
  const e = parseInt(t, 2).toString(16);
  return n === void 0 ? e : isNaN(n) ? s : n < 0 ? h : (n = Math.floor(n), n >= e.length ? q("0", n - e.length) + e : h);
}
function Ho(t, n) {
  if (!bt(t))
    return h;
  const r = t.toString();
  if (r.length === 10 && r.substring(0, 1) === "1")
    return (1073741312 + parseInt(r.substring(1), 2)).toString(8);
  const e = parseInt(t, 2).toString(8);
  return n === void 0 ? e : isNaN(n) ? s : n < 0 ? h : (n = Math.floor(n), n >= e.length ? q("0", n - e.length) + e : h);
}
function jo(t, n) {
  return t = u(t), n = u(n), M(t, n) ? s : t < 0 || n < 0 || Math.floor(t) !== t || Math.floor(n) !== n || t > 281474976710655 || n > 281474976710655 ? h : t & n;
}
function po(t, n) {
  return t = u(t), n = u(n), M(t, n) ? s : t < 0 || Math.floor(t) !== t || t > 281474976710655 || Math.abs(n) > 53 ? h : n >= 0 ? t << n : t >> -n;
}
function Bo(t, n) {
  return t = u(t), n = u(n), M(t, n) ? s : t < 0 || n < 0 || Math.floor(t) !== t || Math.floor(n) !== n || t > 281474976710655 || n > 281474976710655 ? h : t | n;
}
function Wo(t, n) {
  return t = u(t), n = u(n), M(t, n) ? s : t < 0 || Math.floor(t) !== t || t > 281474976710655 || Math.abs(n) > 53 ? h : n >= 0 ? t >> n : t << -n;
}
function Ko(t, n) {
  return t = u(t), n = u(n), M(t, n) ? s : t < 0 || n < 0 || Math.floor(t) !== t || Math.floor(n) !== n || t > 281474976710655 || n > 281474976710655 ? h : t ^ n;
}
function j(t, n, r) {
  if (t = u(t), n = u(n), M(t, n))
    return t;
  if (r = r === void 0 ? "i" : r, r !== "i" && r !== "j")
    return s;
  if (t === 0 && n === 0)
    return 0;
  if (t === 0)
    return n === 1 ? r : n.toString() + r;
  if (n === 0)
    return t.toString();
  {
    const e = n > 0 ? "+" : "";
    return t.toString() + e + (n === 1 ? r : n.toString() + r);
  }
}
function qo(t, n, r) {
  if (t = u(t), t instanceof Error)
    return t;
  const e = [
    ["a.u. of action", "?", null, "action", !1, !1, 105457168181818e-48],
    ["a.u. of charge", "e", null, "electric_charge", !1, !1, 160217653141414e-33],
    ["a.u. of energy", "Eh", null, "energy", !1, !1, 435974417757576e-32],
    ["a.u. of length", "a?", null, "length", !1, !1, 529177210818182e-25],
    ["a.u. of mass", "m?", null, "mass", !1, !1, 910938261616162e-45],
    ["a.u. of time", "?/Eh", null, "time", !1, !1, 241888432650516e-31],
    ["admiralty knot", "admkn", null, "speed", !1, !0, 0.514773333],
    ["ampere", "A", null, "electric_current", !0, !1, 1],
    ["ampere per meter", "A/m", null, "magnetic_field_intensity", !0, !1, 1],
    ["ångström", "Å", ["ang"], "length", !1, !0, 1e-10],
    ["are", "ar", null, "area", !1, !0, 100],
    ["astronomical unit", "ua", null, "length", !1, !1, 149597870691667e-25],
    ["bar", "bar", null, "pressure", !1, !1, 1e5],
    ["barn", "b", null, "area", !1, !1, 1e-28],
    ["becquerel", "Bq", null, "radioactivity", !0, !1, 1],
    ["bit", "bit", ["b"], "information", !1, !0, 1],
    ["btu", "BTU", ["btu"], "energy", !1, !0, 1055.05585262],
    ["byte", "byte", null, "information", !1, !0, 8],
    ["candela", "cd", null, "luminous_intensity", !0, !1, 1],
    ["candela per square metre", "cd/m?", null, "luminance", !0, !1, 1],
    ["coulomb", "C", null, "electric_charge", !0, !1, 1],
    ["cubic ångström", "ang3", ["ang^3"], "volume", !1, !0, 1e-30],
    ["cubic foot", "ft3", ["ft^3"], "volume", !1, !0, 0.028316846592],
    ["cubic inch", "in3", ["in^3"], "volume", !1, !0, 16387064e-12],
    ["cubic light-year", "ly3", ["ly^3"], "volume", !1, !0, 846786664623715e-61],
    ["cubic metre", "m3", ["m^3"], "volume", !0, !0, 1],
    ["cubic mile", "mi3", ["mi^3"], "volume", !1, !0, 416818182544058e-5],
    ["cubic nautical mile", "Nmi3", ["Nmi^3"], "volume", !1, !0, 6352182208],
    ["cubic Pica", "Pica3", ["Picapt3", "Pica^3", "Picapt^3"], "volume", !1, !0, 758660370370369e-22],
    ["cubic yard", "yd3", ["yd^3"], "volume", !1, !0, 0.764554857984],
    ["cup", "cup", null, "volume", !1, !0, 2365882365e-13],
    ["dalton", "Da", ["u"], "mass", !1, !1, 166053886282828e-41],
    ["day", "d", ["day"], "time", !1, !0, 86400],
    ["degree", "°", null, "angle", !1, !1, 0.0174532925199433],
    ["degrees Rankine", "Rank", null, "temperature", !1, !0, 0.555555555555556],
    ["dyne", "dyn", ["dy"], "force", !1, !0, 1e-5],
    ["electronvolt", "eV", ["ev"], "energy", !1, !0, 1.60217656514141],
    ["ell", "ell", null, "length", !1, !0, 1.143],
    ["erg", "erg", ["e"], "energy", !1, !0, 1e-7],
    ["farad", "F", null, "electric_capacitance", !0, !1, 1],
    ["fluid ounce", "oz", null, "volume", !1, !0, 295735295625e-16],
    ["foot", "ft", null, "length", !1, !0, 0.3048],
    ["foot-pound", "flb", null, "energy", !1, !0, 1.3558179483314],
    ["gal", "Gal", null, "acceleration", !1, !1, 0.01],
    ["gallon", "gal", null, "volume", !1, !0, 0.003785411784],
    ["gauss", "G", ["ga"], "magnetic_flux_density", !1, !0, 1],
    ["grain", "grain", null, "mass", !1, !0, 647989e-10],
    ["gram", "g", null, "mass", !1, !0, 1e-3],
    ["gray", "Gy", null, "absorbed_dose", !0, !1, 1],
    ["gross registered ton", "GRT", ["regton"], "volume", !1, !0, 2.8316846592],
    ["hectare", "ha", null, "area", !1, !0, 1e4],
    ["henry", "H", null, "inductance", !0, !1, 1],
    ["hertz", "Hz", null, "frequency", !0, !1, 1],
    ["horsepower", "HP", ["h"], "power", !1, !0, 745.69987158227],
    ["horsepower-hour", "HPh", ["hh", "hph"], "energy", !1, !0, 2684519538e-3],
    ["hour", "h", ["hr"], "time", !1, !0, 3600],
    ["imperial gallon (U.K.)", "uk_gal", null, "volume", !1, !0, 454609e-8],
    ["imperial hundredweight", "lcwt", ["uk_cwt", "hweight"], "mass", !1, !0, 50.802345],
    ["imperial quart (U.K)", "uk_qt", null, "volume", !1, !0, 0.0011365225],
    ["imperial ton", "brton", ["uk_ton", "LTON"], "mass", !1, !0, 1016.046909],
    ["inch", "in", null, "length", !1, !0, 0.0254],
    ["international acre", "uk_acre", null, "area", !1, !0, 4046.8564224],
    ["IT calorie", "cal", null, "energy", !1, !0, 4.1868],
    ["joule", "J", null, "energy", !0, !0, 1],
    ["katal", "kat", null, "catalytic_activity", !0, !1, 1],
    ["kelvin", "K", ["kel"], "temperature", !0, !0, 1],
    ["kilogram", "kg", null, "mass", !0, !0, 1],
    ["knot", "kn", null, "speed", !1, !0, 0.514444444444444],
    ["light-year", "ly", null, "length", !1, !0, 9460730472580800],
    ["litre", "L", ["l", "lt"], "volume", !1, !0, 1e-3],
    ["lumen", "lm", null, "luminous_flux", !0, !1, 1],
    ["lux", "lx", null, "illuminance", !0, !1, 1],
    ["maxwell", "Mx", null, "magnetic_flux", !1, !1, 1e-18],
    ["measurement ton", "MTON", null, "volume", !1, !0, 1.13267386368],
    ["meter per hour", "m/h", ["m/hr"], "speed", !1, !0, 27777777777778e-17],
    ["meter per second", "m/s", ["m/sec"], "speed", !0, !0, 1],
    ["meter per second squared", "m?s??", null, "acceleration", !0, !1, 1],
    ["parsec", "pc", ["parsec"], "length", !1, !0, 30856775814671900],
    ["meter squared per second", "m?/s", null, "kinematic_viscosity", !0, !1, 1],
    ["metre", "m", null, "length", !0, !0, 1],
    ["miles per hour", "mph", null, "speed", !1, !0, 0.44704],
    ["millimetre of mercury", "mmHg", null, "pressure", !1, !1, 133.322],
    ["minute", "?", null, "angle", !1, !1, 290888208665722e-18],
    ["minute", "min", ["mn"], "time", !1, !0, 60],
    ["modern teaspoon", "tspm", null, "volume", !1, !0, 5e-6],
    ["mole", "mol", null, "amount_of_substance", !0, !1, 1],
    ["morgen", "Morgen", null, "area", !1, !0, 2500],
    ["n.u. of action", "?", null, "action", !1, !1, 105457168181818e-48],
    ["n.u. of mass", "m?", null, "mass", !1, !1, 910938261616162e-45],
    ["n.u. of speed", "c?", null, "speed", !1, !1, 299792458],
    ["n.u. of time", "?/(me?c??)", null, "time", !1, !1, 128808866778687e-35],
    ["nautical mile", "M", ["Nmi"], "length", !1, !0, 1852],
    ["newton", "N", null, "force", !0, !0, 1],
    ["œrsted", "Oe ", null, "magnetic_field_intensity", !1, !1, 79.5774715459477],
    ["ohm", "Ω", null, "electric_resistance", !0, !1, 1],
    ["ounce mass", "ozm", null, "mass", !1, !0, 0.028349523125],
    ["pascal", "Pa", null, "pressure", !0, !1, 1],
    ["pascal second", "Pa?s", null, "dynamic_viscosity", !0, !1, 1],
    ["pferdestärke", "PS", null, "power", !1, !0, 735.49875],
    ["phot", "ph", null, "illuminance", !1, !1, 1e-4],
    ["pica (1/6 inch)", "pica", null, "length", !1, !0, 35277777777778e-17],
    ["pica (1/72 inch)", "Pica", ["Picapt"], "length", !1, !0, 0.00423333333333333],
    ["poise", "P", null, "dynamic_viscosity", !1, !1, 0.1],
    ["pond", "pond", null, "force", !1, !0, 980665e-8],
    ["pound force", "lbf", null, "force", !1, !0, 4.4482216152605],
    ["pound mass", "lbm", null, "mass", !1, !0, 0.45359237],
    ["quart", "qt", null, "volume", !1, !0, 946352946e-12],
    ["radian", "rad", null, "angle", !0, !1, 1],
    ["second", "?", null, "angle", !1, !1, 484813681109536e-20],
    ["second", "s", ["sec"], "time", !0, !0, 1],
    ["short hundredweight", "cwt", ["shweight"], "mass", !1, !0, 45.359237],
    ["siemens", "S", null, "electrical_conductance", !0, !1, 1],
    ["sievert", "Sv", null, "equivalent_dose", !0, !1, 1],
    ["slug", "sg", null, "mass", !1, !0, 14.59390294],
    ["square ångström", "ang2", ["ang^2"], "area", !1, !0, 1e-20],
    ["square foot", "ft2", ["ft^2"], "area", !1, !0, 0.09290304],
    ["square inch", "in2", ["in^2"], "area", !1, !0, 64516e-8],
    ["square light-year", "ly2", ["ly^2"], "area", !1, !0, 895054210748189e17],
    ["square meter", "m?", null, "area", !0, !0, 1],
    ["square mile", "mi2", ["mi^2"], "area", !1, !0, 2589988110336e-6],
    ["square nautical mile", "Nmi2", ["Nmi^2"], "area", !1, !0, 3429904],
    ["square Pica", "Pica2", ["Picapt2", "Pica^2", "Picapt^2"], "area", !1, !0, 1792111111111e-17],
    ["square yard", "yd2", ["yd^2"], "area", !1, !0, 0.83612736],
    ["statute mile", "mi", null, "length", !1, !0, 1609.344],
    ["steradian", "sr", null, "solid_angle", !0, !1, 1],
    ["stilb", "sb", null, "luminance", !1, !1, 1e-4],
    ["stokes", "St", null, "kinematic_viscosity", !1, !1, 1e-4],
    ["stone", "stone", null, "mass", !1, !0, 6.35029318],
    ["tablespoon", "tbs", null, "volume", !1, !0, 147868e-10],
    ["teaspoon", "tsp", null, "volume", !1, !0, 492892e-11],
    ["tesla", "T", null, "magnetic_flux_density", !0, !0, 1],
    ["thermodynamic calorie", "c", null, "energy", !1, !0, 4.184],
    ["ton", "ton", null, "mass", !1, !0, 907.18474],
    ["tonne", "t", null, "mass", !1, !1, 1e3],
    ["U.K. pint", "uk_pt", null, "volume", !1, !0, 56826125e-11],
    ["U.S. bushel", "bushel", null, "volume", !1, !0, 0.03523907],
    ["U.S. oil barrel", "barrel", null, "volume", !1, !0, 0.158987295],
    ["U.S. pint", "pt", ["us_pt"], "volume", !1, !0, 473176473e-12],
    ["U.S. survey mile", "survey_mi", null, "length", !1, !0, 1609.347219],
    ["U.S. survey/statute acre", "us_acre", null, "area", !1, !0, 4046.87261],
    ["volt", "V", null, "voltage", !0, !1, 1],
    ["watt", "W", null, "power", !0, !0, 1],
    ["watt-hour", "Wh", ["wh"], "energy", !1, !0, 3600],
    ["weber", "Wb", null, "magnetic_flux", !0, !1, 1],
    ["yard", "yd", null, "length", !1, !0, 0.9144],
    ["year", "yr", null, "time", !1, !0, 31557600]
  ], f = {
    Yi: ["yobi", 80, 12089258196146292e8, "Yi", "yotta"],
    Zi: ["zebi", 70, 11805916207174113e5, "Zi", "zetta"],
    Ei: ["exbi", 60, 1152921504606847e3, "Ei", "exa"],
    Pi: ["pebi", 50, 1125899906842624, "Pi", "peta"],
    Ti: ["tebi", 40, 1099511627776, "Ti", "tera"],
    Gi: ["gibi", 30, 1073741824, "Gi", "giga"],
    Mi: ["mebi", 20, 1048576, "Mi", "mega"],
    ki: ["kibi", 10, 1024, "ki", "kilo"]
  }, o = {
    Y: ["yotta", 1e24, "Y"],
    Z: ["zetta", 1e21, "Z"],
    E: ["exa", 1e18, "E"],
    P: ["peta", 1e15, "P"],
    T: ["tera", 1e12, "T"],
    G: ["giga", 1e9, "G"],
    M: ["mega", 1e6, "M"],
    k: ["kilo", 1e3, "k"],
    h: ["hecto", 100, "h"],
    e: ["dekao", 10, "e"],
    d: ["deci", 0.1, "d"],
    c: ["centi", 0.01, "c"],
    m: ["milli", 1e-3, "m"],
    u: ["micro", 1e-6, "u"],
    n: ["nano", 1e-9, "n"],
    p: ["pico", 1e-12, "p"],
    f: ["femto", 1e-15, "f"],
    a: ["atto", 1e-18, "a"],
    z: ["zepto", 1e-21, "z"],
    y: ["yocto", 1e-24, "y"]
  };
  let i = null, l = null, c = n, g = r, I = 1, N = 1, a;
  for (let A = 0; A < e.length; A++)
    a = e[A][2] === null ? [] : e[A][2], (e[A][1] === c || a.indexOf(c) >= 0) && (i = e[A]), (e[A][1] === g || a.indexOf(g) >= 0) && (l = e[A]);
  if (i === null) {
    const A = f[n.substring(0, 2)];
    let L = o[n.substring(0, 1)];
    n.substring(0, 2) === "da" && (L = ["dekao", 10, "da"]), A ? (I = A[2], c = n.substring(2)) : L && (I = L[1], c = n.substring(L[2].length));
    for (let R = 0; R < e.length; R++)
      a = e[R][2] === null ? [] : e[R][2], (e[R][1] === c || a.indexOf(c) >= 0) && (i = e[R]);
  }
  if (l === null) {
    const A = f[r.substring(0, 2)];
    let L = o[r.substring(0, 1)];
    r.substring(0, 2) === "da" && (L = ["dekao", 10, "da"]), A ? (N = A[2], g = r.substring(2)) : L && (N = L[1], g = r.substring(L[2].length));
    for (let R = 0; R < e.length; R++)
      a = e[R][2] === null ? [] : e[R][2], (e[R][1] === g || a.indexOf(g) >= 0) && (l = e[R]);
  }
  return i === null || l === null || i[3] !== l[3] ? D : t * i[6] * I / (l[6] * N);
}
function Qo(t, n) {
  if (t = u(t), t instanceof Error)
    return t;
  if (!/^-?[0-9]{1,3}$/.test(t) || t < -512 || t > 511)
    return h;
  if (t < 0)
    return "1" + q("0", 9 - (512 + t).toString(2).length) + (512 + t).toString(2);
  const r = parseInt(t, 10).toString(2);
  return typeof n > "u" ? r : isNaN(n) ? s : n < 0 ? h : (n = Math.floor(n), n >= r.length ? q("0", n - r.length) + r : h);
}
function $o(t, n) {
  if (t = u(t), t instanceof Error)
    return t;
  if (!/^-?[0-9]{1,12}$/.test(t) || t < -549755813888 || t > 549755813887)
    return h;
  if (t < 0)
    return (1099511627776 + t).toString(16);
  const r = parseInt(t, 10).toString(16);
  return typeof n > "u" ? r : isNaN(n) ? s : n < 0 ? h : (n = Math.floor(n), n >= r.length ? q("0", n - r.length) + r : h);
}
function zo(t, n) {
  if (t = u(t), t instanceof Error)
    return t;
  if (!/^-?[0-9]{1,9}$/.test(t) || t < -536870912 || t > 536870911)
    return h;
  if (t < 0)
    return (1073741824 + t).toString(8);
  const r = parseInt(t, 10).toString(8);
  return typeof n > "u" ? r : isNaN(n) ? s : n < 0 ? h : (n = Math.floor(n), n >= r.length ? q("0", n - r.length) + r : h);
}
function Zo(t, n) {
  return n = n === void 0 ? 0 : n, t = u(t), n = u(n), M(t, n) ? s : t === n ? 1 : 0;
}
function Vr(t, n) {
  return n = n === void 0 ? 0 : n, t = u(t), n = u(n), M(t, n) ? s : T.erf(t);
}
function Fr(t) {
  return isNaN(t) ? s : T.erfc(t);
}
function Jo(t, n) {
  return n = n || 0, t = u(t), M(n, t) ? t : t >= n ? 1 : 0;
}
function ko(t, n) {
  if (!/^[0-9A-Fa-f]{1,10}$/.test(t))
    return h;
  const r = t.length === 10 && t.substring(0, 1).toLowerCase() === "f", e = r ? parseInt(t, 16) - 1099511627776 : parseInt(t, 16);
  if (e < -512 || e > 511)
    return h;
  if (r)
    return "1" + q("0", 9 - (512 + e).toString(2).length) + (512 + e).toString(2);
  const f = e.toString(2);
  return n === void 0 ? f : isNaN(n) ? s : n < 0 ? h : (n = Math.floor(n), n >= f.length ? q("0", n - f.length) + f : h);
}
function yo(t) {
  if (!/^[0-9A-Fa-f]{1,10}$/.test(t))
    return h;
  const n = parseInt(t, 16);
  return n >= 549755813888 ? n - 1099511627776 : n;
}
function xo(t, n) {
  if (!/^[0-9A-Fa-f]{1,10}$/.test(t))
    return h;
  const r = parseInt(t, 16);
  if (r > 536870911 && r < 1098974756864)
    return h;
  if (r >= 1098974756864)
    return (r - 1098437885952).toString(8);
  const e = r.toString(8);
  return n === void 0 ? e : isNaN(n) ? s : n < 0 ? h : (n = Math.floor(n), n >= e.length ? q("0", n - e.length) + e : h);
}
function Pn(t) {
  const n = V(t), r = P(t);
  return M(n, r) ? s : Math.sqrt(Math.pow(n, 2) + Math.pow(r, 2));
}
function P(t) {
  if (t === void 0 || t === !0 || t === !1)
    return s;
  if (t === 0 || t === "0")
    return 0;
  if (["i", "j"].indexOf(t) >= 0)
    return 1;
  t = t + "", t = t.replace("+i", "+1i").replace("-i", "-1i").replace("+j", "+1j").replace("-j", "-1j");
  let n = t.indexOf("+"), r = t.indexOf("-");
  n === 0 && (n = t.indexOf("+", 1)), r === 0 && (r = t.indexOf("-", 1));
  const e = t.substring(t.length - 1, t.length), f = e === "i" || e === "j";
  return n >= 0 || r >= 0 ? f ? n >= 0 ? isNaN(t.substring(0, n)) || isNaN(t.substring(n + 1, t.length - 1)) ? h : Number(t.substring(n + 1, t.length - 1)) : isNaN(t.substring(0, r)) || isNaN(t.substring(r + 1, t.length - 1)) ? h : -Number(t.substring(r + 1, t.length - 1)) : h : f ? isNaN(t.substring(0, t.length - 1)) ? h : t.substring(0, t.length - 1) : isNaN(t) ? h : 0;
}
function Vn(t) {
  const n = V(t), r = P(t);
  return M(n, r) ? s : n === 0 && r === 0 ? G : n === 0 && r > 0 ? Math.PI / 2 : n === 0 && r < 0 ? -Math.PI / 2 : r === 0 && n > 0 ? 0 : r === 0 && n < 0 ? -Math.PI : n > 0 ? Math.atan(r / n) : n < 0 && r >= 0 ? Math.atan(r / n) + Math.PI : Math.atan(r / n) - Math.PI;
}
function vo(t) {
  const n = V(t), r = P(t);
  if (M(n, r))
    return s;
  let e = t.substring(t.length - 1);
  return e = e === "i" || e === "j" ? e : "i", r !== 0 ? j(n, -r, e) : t;
}
function _t(t) {
  const n = V(t), r = P(t);
  if (M(n, r))
    return s;
  let e = t.substring(t.length - 1);
  return e = e === "i" || e === "j" ? e : "i", j(
    Math.cos(n) * (Math.exp(r) + Math.exp(-r)) / 2,
    -Math.sin(n) * (Math.exp(r) - Math.exp(-r)) / 2,
    e
  );
}
function Ur(t) {
  const n = V(t), r = P(t);
  if (M(n, r))
    return s;
  let e = t.substring(t.length - 1);
  return e = e === "i" || e === "j" ? e : "i", j(
    Math.cos(r) * (Math.exp(n) + Math.exp(-n)) / 2,
    Math.sin(r) * (Math.exp(n) - Math.exp(-n)) / 2,
    e
  );
}
function mo(t) {
  const n = V(t), r = P(t);
  return M(n, r) ? s : Mt(_t(t), tn(t));
}
function Mt(t, n) {
  const r = V(t), e = P(t), f = V(n), o = P(n);
  if (M(r, e, f, o))
    return s;
  const i = t.substring(t.length - 1), l = n.substring(n.length - 1);
  let c = "i";
  if ((i === "j" || l === "j") && (c = "j"), f === 0 && o === 0)
    return h;
  const g = f * f + o * o;
  return j((r * f + e * o) / g, (e * f - r * o) / g, c);
}
function bo(t) {
  const n = V(t), r = P(t);
  if (M(n, r))
    return s;
  let e = t.substring(t.length - 1);
  e = e === "i" || e === "j" ? e : "i";
  const f = Math.exp(n);
  return j(f * Math.cos(r), f * Math.sin(r), e);
}
function _o(t) {
  const n = V(t), r = P(t);
  if (M(n, r))
    return s;
  let e = t.substring(t.length - 1);
  return e = e === "i" || e === "j" ? e : "i", j(Math.log(Math.sqrt(n * n + r * r)), Math.atan(r / n), e);
}
function tu(t) {
  const n = V(t), r = P(t);
  if (M(n, r))
    return s;
  let e = t.substring(t.length - 1);
  return e = e === "i" || e === "j" ? e : "i", j(Math.log(Math.sqrt(n * n + r * r)) / Math.log(10), Math.atan(r / n) / Math.log(10), e);
}
function nu(t) {
  const n = V(t), r = P(t);
  if (M(n, r))
    return s;
  let e = t.substring(t.length - 1);
  return e = e === "i" || e === "j" ? e : "i", j(Math.log(Math.sqrt(n * n + r * r)) / Math.log(2), Math.atan(r / n) / Math.log(2), e);
}
function ru(t, n) {
  n = u(n);
  const r = V(t), e = P(t);
  if (M(n, r, e))
    return s;
  let f = t.substring(t.length - 1);
  f = f === "i" || f === "j" ? f : "i";
  const o = Math.pow(Pn(t), n), i = Vn(t);
  return j(o * Math.cos(n * i), o * Math.sin(n * i), f);
}
function eu() {
  let t = arguments[0];
  if (!arguments.length)
    return s;
  for (let n = 1; n < arguments.length; n++) {
    const r = V(t), e = P(t), f = V(arguments[n]), o = P(arguments[n]);
    if (M(r, e, f, o))
      return s;
    t = j(r * f - e * o, r * o + e * f);
  }
  return t;
}
function V(t) {
  if (t === void 0 || t === !0 || t === !1)
    return s;
  if (t === 0 || t === "0" || ["i", "+i", "1i", "+1i", "-i", "-1i", "j", "+j", "1j", "+1j", "-j", "-1j"].indexOf(t) >= 0)
    return 0;
  t = t + "";
  let n = t.indexOf("+"), r = t.indexOf("-");
  n === 0 && (n = t.indexOf("+", 1)), r === 0 && (r = t.indexOf("-", 1));
  const e = t.substring(t.length - 1, t.length), f = e === "i" || e === "j";
  return n >= 0 || r >= 0 ? f ? n >= 0 ? isNaN(t.substring(0, n)) || isNaN(t.substring(n + 1, t.length - 1)) ? h : Number(t.substring(0, n)) : isNaN(t.substring(0, r)) || isNaN(t.substring(r + 1, t.length - 1)) ? h : Number(t.substring(0, r)) : h : f ? isNaN(t.substring(0, t.length - 1)) ? h : 0 : isNaN(t) ? h : t;
}
function fu(t) {
  if (t === !0 || t === !1)
    return s;
  const n = V(t), r = P(t);
  return M(n, r) ? s : Mt("1", _t(t));
}
function ou(t) {
  const n = V(t), r = P(t);
  return M(n, r) ? s : Mt("1", Ur(t));
}
function tn(t) {
  const n = V(t), r = P(t);
  if (M(n, r))
    return s;
  let e = t.substring(t.length - 1);
  return e = e === "i" || e === "j" ? e : "i", j(
    Math.sin(n) * (Math.exp(r) + Math.exp(-r)) / 2,
    Math.cos(n) * (Math.exp(r) - Math.exp(-r)) / 2,
    e
  );
}
function Yr(t) {
  const n = V(t), r = P(t);
  if (M(n, r))
    return s;
  let e = t.substring(t.length - 1);
  return e = e === "i" || e === "j" ? e : "i", j(
    Math.cos(r) * (Math.exp(n) - Math.exp(-n)) / 2,
    Math.sin(r) * (Math.exp(n) + Math.exp(-n)) / 2,
    e
  );
}
function uu(t) {
  const n = V(t), r = P(t);
  if (M(n, r))
    return s;
  let e = t.substring(t.length - 1);
  e = e === "i" || e === "j" ? e : "i";
  const f = Math.sqrt(Pn(t)), o = Vn(t);
  return j(f * Math.cos(o / 2), f * Math.sin(o / 2), e);
}
function iu(t) {
  if (t === !0 || t === !1)
    return s;
  const n = V(t), r = P(t);
  return M(n, r) ? h : Mt("1", tn(t));
}
function su(t) {
  if (t === !0 || t === !1)
    return s;
  const n = V(t), r = P(t);
  return M(n, r) ? h : Mt("1", Yr(t));
}
function lu(t, n) {
  const r = V(t), e = P(t), f = V(n), o = P(n);
  if (M(r, e, f, o))
    return s;
  const i = t.substring(t.length - 1), l = n.substring(n.length - 1);
  let c = "i";
  return (i === "j" || l === "j") && (c = "j"), j(r - f, e - o, c);
}
function cu() {
  if (!arguments.length)
    return s;
  const t = E(arguments);
  let n = 0, r = 0;
  for (const e of t) {
    const f = +V(e), o = +P(e);
    if (M(f, o))
      return s;
    n += f, r += o;
  }
  return j(n, r, "i");
}
function hu(t) {
  if (t === !0 || t === !1)
    return s;
  const n = V(t), r = P(t);
  return M(n, r) ? s : Mt(tn(t), _t(t));
}
function gu(t, n) {
  if (!/^[0-7]{1,10}$/.test(t))
    return h;
  const r = t.length === 10 && t.substring(0, 1) === "7", e = r ? parseInt(t, 8) - 1073741824 : parseInt(t, 8);
  if (e < -512 || e > 511)
    return h;
  if (r)
    return "1" + q("0", 9 - (512 + e).toString(2).length) + (512 + e).toString(2);
  const f = e.toString(2);
  return typeof n > "u" ? f : isNaN(n) ? s : n < 0 ? h : (n = Math.floor(n), n >= f.length ? q("0", n - f.length) + f : h);
}
function Mu(t) {
  if (!/^[0-7]{1,10}$/.test(t))
    return h;
  const n = parseInt(t, 8);
  return n >= 536870912 ? n - 1073741824 : n;
}
function Eu(t, n) {
  if (!/^[0-7]{1,10}$/.test(t))
    return h;
  const r = parseInt(t, 8);
  if (r >= 536870912)
    return "ff" + (r + 3221225472).toString(16);
  const e = r.toString(16);
  return n === void 0 ? e : isNaN(n) ? s : n < 0 ? h : (n = Math.floor(n), n >= e.length ? q("0", n - e.length) + e : h);
}
const Iu = Xt.DIST, Nu = Xt.INV, Tu = It.DIST, Su = nt.MATH, Au = nt.PRECISE, Du = Z.DIST, au = Z.DIST.RT, Cu = Z.INV, Ru = Z.INV.RT, Ou = Z.TEST, Lu = Nt.P, Pu = Nt.P, Vu = Nt.S, Fu = It.INV, Uu = Fr.PRECISE, Yu = Vr.PRECISE, Xu = Nn.DIST, Gu = J.DIST, wu = J.DIST.RT, Hu = J.INV, ju = J.INV.RT, pu = lt.MATH, Bu = lt.PRECISE, Wu = J.TEST, Ku = Gt.DIST, qu = Gt.INV, Qu = Tn.PRECISE, $u = Sn.DIST, zu = Tt.INV, Zu = Tt.DIST, Ju = Tt.INV, ku = it.MULT, yu = it.SNGL, du = Dn.DIST, xu = vt.INTL, vu = k.DIST, mu = k.INV, bu = k.S.DIST, _u = k.S.INV, ti = K.EXC, ni = K.INC, ri = wt.EXC, ei = wt.INC, fi = an.DIST, oi = st.EXC, ui = st.INC, ii = Ht.AVG, si = Ht.EQ, li = Cn.P, ci = B.P, hi = B.S, gi = W.DIST, Mi = W.DIST.RT, Ei = W.INV, Ii = W.TEST, Ni = p.P, Ti = p.S, Si = Rn.DIST, Ai = mt.INTL, Di = On.TEST;
function nn(t) {
  const n = [];
  return w(t, (r) => {
    r && n.push(r);
  }), n;
}
function $(t, n) {
  const r = {};
  for (let o = 1; o < t[0].length; ++o)
    r[o] = !0;
  let e = n[0].length;
  for (let o = 1; o < n.length; ++o)
    n[o].length > e && (e = n[o].length);
  for (let o = 1; o < t.length; ++o)
    for (let i = 1; i < t[o].length; ++i) {
      let l = !1, c = !1;
      for (let g = 0; g < n.length; ++g) {
        const I = n[g];
        if (I.length < e)
          continue;
        const N = I[0];
        if (t[o][0] === N) {
          c = !0;
          for (let a = 1; a < I.length; ++a)
            if (!l)
              if (I[a] === void 0 || I[a] === "*")
                l = !0;
              else {
                const L = ht(I[a] + ""), R = [y(t[o][i], _)].concat(
                  L
                );
                l = gt(R);
              }
        }
      }
      c && (r[i] = r[i] && l);
    }
  const f = [];
  for (let o = 0; o < t[0].length; ++o)
    r[o] && f.push(o - 1);
  return f;
}
function ai(t, n, r) {
  if (isNaN(n) && typeof n != "string")
    return s;
  const e = $(t, r);
  let f = [];
  if (typeof n == "string") {
    const i = Q(t, n);
    f = F(t[i]);
  } else
    f = F(t[n]);
  let o = 0;
  return w(e, (i) => {
    o += f[i];
  }), e.length === 0 ? G : o / e.length;
}
function Ci(t, n, r) {
  if (isNaN(n) && typeof n != "string")
    return s;
  const e = $(t, r);
  let f = [];
  if (typeof n == "string") {
    const i = Q(t, n);
    f = F(t[i]);
  } else
    f = F(t[n]);
  const o = [];
  return w(e, (i) => {
    o.push(f[i]);
  }), Ct(o);
}
function Ri(t, n, r) {
  if (isNaN(n) && typeof n != "string")
    return s;
  const e = $(t, r);
  let f = [];
  if (typeof n == "string") {
    const i = Q(t, n);
    f = F(t[i]);
  } else
    f = F(t[n]);
  const o = [];
  return w(e, (i) => {
    o.push(f[i]);
  }), Rt(o);
}
function Oi(t, n, r) {
  if (isNaN(n) && typeof n != "string")
    return s;
  const e = $(t, r);
  let f = [];
  if (typeof n == "string") {
    const o = Q(t, n);
    f = F(t[o]);
  } else
    f = F(t[n]);
  return e.length === 0 ? s : e.length > 1 ? h : f[e[0]];
}
function Li(t, n, r) {
  if (isNaN(n) && typeof n != "string")
    return s;
  const e = $(t, r);
  let f = [];
  if (typeof n == "string") {
    const i = Q(t, n);
    f = F(t[i]);
  } else
    f = F(t[n]);
  let o = f[e[0]];
  return w(e, (i) => {
    o < f[i] && (o = f[i]);
  }), o;
}
function Pi(t, n, r) {
  if (isNaN(n) && typeof n != "string")
    return s;
  const e = $(t, r);
  let f = [];
  if (typeof n == "string") {
    const i = Q(t, n);
    f = F(t[i]);
  } else
    f = F(t[n]);
  let o = f[e[0]];
  return w(e, (i) => {
    o > f[i] && (o = f[i]);
  }), o;
}
function Vi(t, n, r) {
  if (isNaN(n) && typeof n != "string")
    return s;
  const e = $(t, r);
  let f = [];
  if (typeof n == "string") {
    const l = Q(t, n);
    f = F(t[l]);
  } else
    f = F(t[n]);
  let o = [];
  w(e, (l) => {
    o.push(f[l]);
  }), o = nn(o);
  let i = 1;
  return w(o, (l) => {
    i *= l;
  }), i;
}
function Fi(t, n, r) {
  if (isNaN(n) && typeof n != "string")
    return s;
  const e = $(t, r);
  let f = [];
  if (typeof n == "string") {
    const i = Q(t, n);
    f = F(t[i]);
  } else
    f = F(t[n]);
  let o = [];
  return w(e, (i) => {
    o.push(f[i]);
  }), o = nn(o), B.S(o);
}
function Ui(t, n, r) {
  if (isNaN(n) && typeof n != "string")
    return s;
  const e = $(t, r);
  let f = [];
  if (typeof n == "string") {
    const i = Q(t, n);
    f = F(t[i]);
  } else
    f = F(t[n]);
  let o = [];
  return w(e, (i) => {
    o.push(f[i]);
  }), o = nn(o), B.P(o);
}
function Yi(t, n, r) {
  if (isNaN(n) && typeof n != "string")
    return s;
  const e = $(t, r);
  let f = [];
  if (typeof n == "string") {
    const i = Q(t, n);
    f = F(t[i]);
  } else
    f = F(t[n]);
  const o = [];
  return w(e, (i) => {
    o.push(f[i]);
  }), b(o);
}
function Xi(t, n, r) {
  if (isNaN(n) && typeof n != "string")
    return s;
  const e = $(t, r);
  let f = [];
  if (typeof n == "string") {
    const i = Q(t, n);
    f = F(t[i]);
  } else
    f = F(t[n]);
  const o = [];
  return w(e, (i) => {
    o.push(f[i]);
  }), p.S(o);
}
function Gi(t, n, r) {
  if (isNaN(n) && typeof n != "string")
    return s;
  const e = $(t, r);
  let f = [];
  if (typeof n == "string") {
    const i = Q(t, n);
    f = F(t[i]);
  } else
    f = F(t[n]);
  const o = [];
  return w(e, (i) => {
    o.push(f[i]);
  }), p.P(o);
}
function Wt(t) {
  return t && t.getTime && !isNaN(t.getTime());
}
function Kt(t) {
  return t instanceof Date ? t : new Date(t);
}
function Xr(t, n, r) {
  let e = O(n);
  for (e.setFullYear(t.getFullYear()), e < t && e.setFullYear(e.getFullYear() + 1); e > t; )
    e.setMonth(e.getMonth() + -12 / r);
  return e;
}
function Fn(t) {
  return t = u(t), [1, 2, 4].indexOf(t) === -1 ? h : t;
}
function Un(t) {
  return t = u(t), [0, 1, 2, 3, 4].indexOf(t) === -1 ? h : t;
}
function wi(t, n, r, e, f, o, i) {
  return t = Kt(t), n = Kt(n), r = Kt(r), o = Fn(o), i = Un(i), C(o, i) ? h : !Wt(t) || !Wt(n) || !Wt(r) ? s : e <= 0 || f <= 0 || r <= t ? h : (f = f || 0, i = i || 0, f * e * Ln(t, r, i));
}
function Hi(t, n, r, e) {
  if (e = Un(e), r = Fn(r), t = O(t), n = O(n), C(t, n))
    return s;
  if (C(r, e) || t >= n)
    return h;
  if (e === 1) {
    let o = Xr(t, n, r), i = O(o);
    return i.setMonth(i.getMonth() + 12 / r), tt(o, i, "D");
  }
  let f;
  switch (e) {
    case 0:
    case 2:
    case 4:
      f = 360;
      break;
    case 3:
      f = 365;
      break;
    default:
      return h;
  }
  return f / r;
}
function ji(t, n, r, e, f, o) {
  if (t = u(t), n = u(n), r = u(r), M(t, n, r))
    return s;
  if (t <= 0 || n <= 0 || r <= 0 || e < 1 || f < 1 || e > f || o !== 0 && o !== 1)
    return h;
  const i = jt(t, n, r, 0, o);
  let l = 0;
  e === 1 && (o === 0 && (l = -r), e++);
  for (let c = e; c <= f; c++)
    l += o === 1 ? ct(t, c - 2, i, r, 1) - i : ct(t, c - 1, i, r, 0);
  return l *= t, l;
}
function pi(t, n, r, e, f, o) {
  if (t = u(t), n = u(n), r = u(r), M(t, n, r))
    return s;
  if (t <= 0 || n <= 0 || r <= 0 || e < 1 || f < 1 || e > f || o !== 0 && o !== 1)
    return h;
  const i = jt(t, n, r, 0, o);
  let l = 0;
  e === 1 && (l = o === 0 ? i + r * t : i, e++);
  for (let c = e; c <= f; c++)
    l += o > 0 ? i - (ct(t, c - 2, i, r, 1) - i) * t : i - ct(t, c - 1, i, r, 0) * t;
  return l;
}
function Bi(t, n, r, e, f) {
  if (f = f === void 0 ? 12 : f, t = u(t), n = u(n), r = u(r), e = u(e), f = u(f), M(t, n, r, e, f))
    return s;
  if (t < 0 || n < 0 || r < 0 || e < 0 || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].indexOf(f) === -1 || e > r)
    return h;
  if (n >= t)
    return 0;
  const o = (1 - Math.pow(n / t, 1 / r)).toFixed(3), i = t * o * f / 12;
  let l = i, c = 0;
  const g = e === r ? r - 1 : e;
  for (let I = 2; I <= g; I++)
    c = (t - l) * o, l += c;
  return e === 1 ? i : e === r ? (t - l) * o : c;
}
function Wi(t, n, r, e, f) {
  if (f = f === void 0 ? 2 : f, t = u(t), n = u(n), r = u(r), e = u(e), f = u(f), M(t, n, r, e, f))
    return s;
  if (t < 0 || n < 0 || r < 0 || e < 0 || f <= 0 || e > r)
    return h;
  if (n >= t)
    return 0;
  let o = 0, i = 0;
  for (let l = 1; l <= e; l++)
    i = Math.min((t - o) * (f / r), t - n - o), o += i;
  return i;
}
function Ki(t, n, r, e, f) {
  if (t = O(t), n = O(n), r = u(r), e = u(e), f = u(f), f = f || 0, M(t, n, r, e, f))
    return s;
  if (r <= 0 || e <= 0)
    return h;
  if (t >= n)
    return s;
  let o, i;
  switch (f) {
    case 0:
      o = 360, i = rt(t, n, !1);
      break;
    case 1:
      o = 365, i = tt(t, n, "D");
      break;
    case 2:
      o = 360, i = tt(t, n, "D");
      break;
    case 3:
      o = 365, i = tt(t, n, "D");
      break;
    case 4:
      o = 360, i = rt(t, n, !0);
      break;
    default:
      return h;
  }
  return (e - r) / e * o / i;
}
function qi(t, n) {
  if (t = u(t), n = u(n), M(t, n))
    return s;
  if (n < 0)
    return h;
  if (n >= 0 && n < 1)
    return G;
  n = parseInt(n, 10);
  let r = parseInt(t, 10);
  r += t % 1 * Math.pow(10, Math.ceil(Math.log(n) / Math.LN10)) / n;
  const e = Math.pow(10, Math.ceil(Math.log(n) / Math.LN2) + 1);
  return r = Math.round(r * e) / e, r;
}
function Qi(t, n) {
  if (t = u(t), n = u(n), M(t, n))
    return s;
  if (n < 0)
    return h;
  if (n >= 0 && n < 1)
    return G;
  n = parseInt(n, 10);
  let r = parseInt(t, 10);
  return r += t % 1 * Math.pow(10, -Math.ceil(Math.log(n) / Math.LN10)) * n, r;
}
function $i(t, n) {
  return t = u(t), n = u(n), M(t, n) ? s : t <= 0 || n < 1 ? h : (n = parseInt(n, 10), Math.pow(1 + t / n, n) - 1);
}
function ct(t, n, r, e, f) {
  if (e = e || 0, f = f || 0, t = u(t), n = u(n), r = u(r), e = u(e), f = u(f), M(t, n, r, e, f))
    return s;
  let o;
  if (t === 0)
    o = e + r * n;
  else {
    const i = Math.pow(1 + t, n);
    o = f === 1 ? e * i + r * (1 + t) * (i - 1) / t : e * i + r * (i - 1) / t;
  }
  return -o;
}
function zi(t, n) {
  if (t = u(t), n = S(E(n)), M(t, n))
    return s;
  const r = n.length;
  let e = t;
  for (let f = 0; f < r; f++)
    e *= 1 + n[f];
  return e;
}
function Gr(t, n, r, e, f, o) {
  if (f = f || 0, o = o || 0, t = u(t), n = u(n), r = u(r), e = u(e), f = u(f), o = u(o), M(t, n, r, e, f, o))
    return s;
  const i = jt(t, r, e, f, o);
  return (n === 1 ? o === 1 ? 0 : -e : o === 1 ? ct(t, n - 2, i, e, 1) - i : ct(t, n - 1, i, e, 0)) * t;
}
function Zi(t, n) {
  if (n = typeof n == "number" ? n : typeof n > "u" ? 0.1 : u(n), t = E(t).filter(et), t = S(t), M(t, n))
    return s;
  const r = new Float64Array(t.length);
  let e = !1, f = !1;
  for (let g = 0; g < t.length; g++)
    r[g] = t[g], r[g] > 0 && (e = !0), r[g] < 0 && (f = !0);
  if (!e || !f)
    return h;
  const o = (g) => {
    g <= -1 && (g = -0.999999999);
    let I = r[0];
    const N = 1 + g;
    let a = 1;
    for (let A = 1; A < r.length; A++)
      a *= N, I += r[A] / a;
    return I;
  }, i = /* @__PURE__ */ new Map(), l = function(g) {
    const I = Math.round(g * 1e10) / 1e10;
    if (i.has(I))
      return i.get(I);
    const N = o(I);
    return i.set(I, N), N;
  };
  return function() {
    let N = n, a = N, A = 0;
    for (; A < 1e3; ) {
      const X = l(N);
      if (Math.abs(X) < 1e-10)
        return N;
      if (A > 0 && Math.abs(N - a) < 1e-10 * 10)
        break;
      const z = Math.max(1e-4, Math.abs(N * 1e-4)), rn = (l(N + z) - X) / z;
      if (Math.abs(rn) < 1e-10)
        break;
      a = N;
      const pt = X / rn, en = Math.max(0.1, Math.abs(N) * 0.5);
      Math.abs(pt) > en ? N -= Math.sign(pt) * en : N -= pt, N <= -1 && (N = -0.99999999), N > 1e3 && (N = 1e3), A++;
    }
    let L = l(N);
    if (Math.abs(L) < 1e-10)
      return N;
    let R, Y;
    if (L > 0) {
      for (R = N, Y = N + 0.1; l(Y) > 0 && Y < 1e3; )
        Y = Y * 2 + 0.1;
      if (Y >= 1e3) return N;
    } else {
      for (Y = N, R = Math.max(-0.99999999, N - 0.1); l(R) < 0 && R > -0.99999999; )
        R = Math.max(-0.99999999, R - 0.1);
      if (R <= -0.99999999) return N;
    }
    let H;
    for (let X = 0; X < 1e3; X++) {
      H = (R + Y) / 2;
      const z = l(H);
      if (Math.abs(z) < 1e-10 || Math.abs(Y - R) < 1e-10)
        return H;
      z * l(R) < 0 ? Y = H : R = H;
    }
    return H;
  }();
}
function Ji(t, n, r, e) {
  return t = u(t), n = u(n), r = u(r), e = u(e), M(t, n, r, e) ? s : e * t * (n / r - 1);
}
function ki(t, n, r) {
  if (t = S(E(t)), n = u(n), r = u(r), M(t, n, r))
    return s;
  const e = t.length, f = [], o = [];
  for (let c = 0; c < e; c++)
    t[c] < 0 ? f.push(t[c]) : o.push(t[c]);
  const i = -fn(r, o) * Math.pow(1 + r, e - 1), l = fn(n, f) * (1 + n);
  return Math.pow(i / l, 1 / (e - 1)) - 1;
}
function yi(t, n) {
  return t = u(t), n = u(n), M(t, n) ? s : t <= 0 || n < 1 ? h : (n = parseInt(n, 10), (Math.pow(t + 1, 1 / n) - 1) * n);
}
function di(t, n, r, e, f) {
  if (f = f === void 0 ? 0 : f, e = e === void 0 ? 0 : e, t = u(t), n = u(n), r = u(r), e = u(e), f = u(f), M(t, n, r, e, f))
    return s;
  if (t === 0)
    return -(r + e) / n;
  {
    const o = n * (1 + t * f) - e * t, i = r * t + n * (1 + t * f);
    return Math.log(o / i) / Math.log(1 + t);
  }
}
function fn() {
  const t = S(E(arguments));
  if (t instanceof Error)
    return t;
  const n = t[0];
  let r = 0;
  for (let e = 1; e < t.length; e++)
    r += t[e] / Math.pow(1 + n, e);
  return r;
}
function xi(t, n, r) {
  return t = u(t), n = u(n), r = u(r), M(t, n, r) ? s : t <= 0 ? h : (Math.log(r) - Math.log(n)) / Math.log(1 + t);
}
function jt(t, n, r, e, f) {
  if (e = e || 0, f = f || 0, t = u(t), n = u(n), r = u(r), e = u(e), f = u(f), M(t, n, r, e, f))
    return s;
  let o;
  if (t === 0)
    o = (r + e) / n;
  else {
    const i = Math.pow(1 + t, n);
    o = f === 1 ? (e * t / (i - 1) + r * t / (1 - 1 / i)) / (1 + t) : e * t / (i - 1) + r * t / (1 - 1 / i);
  }
  return -o;
}
function vi(t, n, r, e, f, o) {
  return f = f || 0, o = o || 0, t = u(t), r = u(r), e = u(e), f = u(f), o = u(o), M(t, r, e, f, o) ? s : jt(t, r, e, f, o) - Gr(t, n, r, e, f, o);
}
function mi(t, n, r, e, f) {
  if (t = O(t), n = O(n), r = u(r), e = u(e), f = u(f), f = f || 0, M(t, n, r, e, f))
    return s;
  if (r <= 0 || e <= 0)
    return h;
  if (t >= n)
    return s;
  let o, i;
  switch (f) {
    case 0:
      o = 360, i = rt(t, n, !1);
      break;
    case 1:
      o = 365, i = tt(t, n, "D");
      break;
    case 2:
      o = 360, i = tt(t, n, "D");
      break;
    case 3:
      o = 365, i = tt(t, n, "D");
      break;
    case 4:
      o = 360, i = rt(t, n, !0);
      break;
    default:
      return h;
  }
  return e - r * e * i / o;
}
function bi(t, n, r, e, f) {
  return e = e || 0, f = f || 0, t = u(t), n = u(n), r = u(r), e = u(e), f = u(f), M(t, n, r, e, f) ? s : t === 0 ? -r * n - e : ((1 - Math.pow(1 + t, n)) / t * r * (1 + t * f) - e) / Math.pow(1 + t, n);
}
function _i(t, n, r, e, f, o) {
  if (o = o === void 0 ? 0.1 : o, e = e === void 0 ? 0 : e, f = f === void 0 ? 0 : f, t = u(t), n = u(n), r = u(r), e = u(e), f = u(f), o = u(o), M(t, n, r, e, f, o))
    return s;
  const i = 1e-10, l = 100;
  let c = o;
  f = f ? 1 : 0;
  for (let g = 0; g < l; g++) {
    if (c <= -1)
      return h;
    let I, N;
    if (Math.abs(c) < i ? I = r * (1 + t * c) + n * (1 + c * f) * t + e : (N = Math.pow(1 + c, t), I = r * N + n * (1 / c + f) * (N - 1) + e), Math.abs(I) < i)
      return c;
    let a;
    if (Math.abs(c) < i)
      a = r * t + n * f * t;
    else {
      N = Math.pow(1 + c, t);
      const A = t * Math.pow(1 + c, t - 1);
      a = r * A + n * (1 / c + f) * A + n * (-1 / (c * c)) * (N - 1);
    }
    c -= I / a;
  }
  return c;
}
function ts(t, n, r) {
  return t = u(t), n = u(n), r = u(r), M(t, n, r) ? s : t === 0 || n === 0 ? h : Math.pow(r / n, 1 / t) - 1;
}
function ns(t, n, r) {
  return t = u(t), n = u(n), r = u(r), M(t, n, r) ? s : r === 0 ? h : (t - n) / r;
}
function rs(t, n, r, e) {
  return t = u(t), n = u(n), r = u(r), e = u(e), M(t, n, r, e) ? s : r === 0 || e < 1 || e > r ? h : (e = parseInt(e, 10), (t - n) * (r - e + 1) * 2 / (r * (r + 1)));
}
function es(t, n, r) {
  return t = O(t), n = O(n), r = u(r), M(t, n, r) ? s : r <= 0 || t > n || n - t > 365 * 24 * 60 * 60 * 1e3 ? h : 365 * r / (360 - r * rt(t, n, !1));
}
function fs(t, n, r) {
  return t = O(t), n = O(n), r = u(r), M(t, n, r) ? s : r <= 0 || t > n || n - t > 365 * 24 * 60 * 60 * 1e3 ? h : 100 * (1 - r * rt(t, n, !1) / 360);
}
function os(t, n, r) {
  return t = O(t), n = O(n), r = u(r), M(t, n, r) ? s : r <= 0 || t > n || n - t > 365 * 24 * 60 * 60 * 1e3 ? h : (100 - r) * 360 / (r * rt(t, n, !1));
}
function us(t, n, r) {
  if (t = S(E(t)), n = gn(E(n)), r = u(r), M(t, n, r))
    return s;
  const e = (A, L, R) => {
    const Y = R + 1;
    let H = A[0];
    for (let X = 1; X < A.length; X++)
      H += A[X] / Math.pow(Y, ft(L[X], L[0]) / 365);
    return H;
  }, f = (A, L, R) => {
    const Y = R + 1;
    let H = 0;
    for (let X = 1; X < A.length; X++) {
      const z = ft(L[X], L[0]) / 365;
      H -= z * A[X] / Math.pow(Y, z + 1);
    }
    return H;
  };
  let o = !1, i = !1;
  for (let A = 0; A < t.length; A++)
    t[A] > 0 && (o = !0), t[A] < 0 && (i = !0);
  if (!o || !i)
    return h;
  r = r || 0.1;
  let l = r;
  const c = 1e-10;
  let g, I, N, a = !0;
  do
    N = e(t, n, l), g = l - N / f(t, n, l), I = Math.abs(g - l), l = g, a = I > c && Math.abs(N) > c;
  while (a);
  return l;
}
function is(t, n, r) {
  if (t = u(t), n = S(E(n)), r = gn(E(r)), M(t, n, r))
    return s;
  let e = 0;
  for (let f = 0; f < n.length; f++)
    e += n[f] / Math.pow(1 + t, ft(r[f], r[0]) / 365);
  return e;
}
function ss() {
  const t = E(arguments);
  let n = s;
  for (let r = 0; r < t.length; r++) {
    if (t[r] instanceof Error)
      return t[r];
    t[r] === void 0 || t[r] === null || typeof t[r] == "string" || (n === s && (n = !0), t[r] || (n = !1));
  }
  return n;
}
function ls() {
  return !1;
}
function cs(t, n, r) {
  return t instanceof Error ? t : (n = arguments.length >= 2 ? n : !0, n == null && (n = 0), r = arguments.length === 3 ? r : !1, r == null && (r = 0), t ? n : r);
}
function hs() {
  for (let t = 0; t < arguments.length / 2; t++)
    if (arguments[t * 2])
      return arguments[t * 2 + 1];
  return D;
}
function gs(t, n) {
  return dt(t) ? n : t;
}
function Ms(t, n) {
  return t === D ? n : t;
}
function Es(t) {
  return typeof t == "string" ? s : t instanceof Error ? t : !t;
}
function Is() {
  const t = E(arguments);
  let n = s;
  for (let r = 0; r < t.length; r++) {
    if (t[r] instanceof Error)
      return t[r];
    t[r] === void 0 || t[r] === null || typeof t[r] == "string" || (n === s && (n = !1), t[r] && (n = !0));
  }
  return n;
}
function Ns() {
  return !0;
}
function Ts() {
  const t = E(arguments);
  let n = s;
  for (let r = 0; r < t.length; r++) {
    if (t[r] instanceof Error)
      return t[r];
    t[r] === void 0 || t[r] === null || typeof t[r] == "string" || (n === s && (n = 0), t[r] && n++);
  }
  return n === s ? n : !!(Math.floor(Math.abs(n)) & 1);
}
function Ss() {
  let t;
  if (arguments.length > 0) {
    const n = arguments[0], r = arguments.length - 1, e = Math.floor(r / 2);
    let f = !1;
    const o = r % 2 !== 0, i = r % 2 === 0 ? null : arguments[arguments.length - 1];
    if (e) {
      for (let l = 0; l < e; l++)
        if (n === arguments[l * 2 + 1]) {
          t = arguments[l * 2 + 2], f = !0;
          break;
        }
    }
    f || (t = o ? i : D);
  } else
    t = s;
  return t;
}
const As = { errors: Yn, symbols: Rr, date: wn };
export {
  nf as ABS,
  wi as ACCRINT,
  rf as ACOS,
  ef as ACOSH,
  ff as ACOT,
  of as ACOTH,
  uf as AGGREGATE,
  ss as AND,
  sf as ARABIC,
  lf as ASIN,
  cf as ASINH,
  hf as ATAN,
  gf as ATAN2,
  Mf as ATANH,
  ae as AVEDEV,
  ut as AVERAGE,
  En as AVERAGEA,
  Ce as AVERAGEIF,
  Re as AVERAGEIFS,
  Ef as BASE,
  Fo as BESSELI,
  Uo as BESSELJ,
  Yo as BESSELK,
  Xo as BESSELY,
  Xt as BETA,
  Iu as BETADIST,
  Nu as BETAINV,
  Go as BIN2DEC,
  wo as BIN2HEX,
  Ho as BIN2OCT,
  It as BINOM,
  Tu as BINOMDIST,
  jo as BITAND,
  po as BITLSHIFT,
  Bo as BITOR,
  Wo as BITRSHIFT,
  Ko as BITXOR,
  nt as CEILING,
  Su as CEILINGMATH,
  Au as CEILINGPRECISE,
  vn as CHAR,
  Du as CHIDIST,
  au as CHIDISTRT,
  Cu as CHIINV,
  Ru as CHIINVRT,
  Z as CHISQ,
  Ou as CHITEST,
  zr as CHOOSE,
  _r as CLEAN,
  mn as CODE,
  Zr as COLUMN,
  Jr as COLUMNS,
  Et as COMBIN,
  If as COMBINA,
  j as COMPLEX,
  te as CONCAT,
  bn as CONCATENATE,
  In as CONFIDENCE,
  qo as CONVERT,
  Oe as CORREL,
  Nf as COS,
  Tf as COSH,
  Sf as COT,
  Af as COTH,
  Ct as COUNT,
  Rt as COUNTA,
  nr as COUNTBLANK,
  Le as COUNTIF,
  Pe as COUNTIFS,
  Hi as COUPDAYS,
  Lu as COVAR,
  Nt as COVARIANCE,
  Pu as COVARIANCEP,
  Vu as COVARIANCES,
  Fu as CRITBINOM,
  Df as CSC,
  af as CSCH,
  ji as CUMIPMT,
  pi as CUMPRINC,
  go as DATE,
  tt as DATEDIF,
  Mo as DATEVALUE,
  ai as DAVERAGE,
  Eo as DAY,
  ft as DAYS,
  rt as DAYS360,
  Bi as DB,
  Ci as DCOUNT,
  Ri as DCOUNTA,
  Wi as DDB,
  Qo as DEC2BIN,
  $o as DEC2HEX,
  zo as DEC2OCT,
  Cf as DECIMAL,
  Rf as DEGREES,
  Zo as DELTA,
  Ve as DEVSQ,
  Oi as DGET,
  Ki as DISC,
  Li as DMAX,
  Pi as DMIN,
  ne as DOLLAR,
  qi as DOLLARDE,
  Qi as DOLLARFR,
  Vi as DPRODUCT,
  Fi as DSTDEV,
  Ui as DSTDEVP,
  Yi as DSUM,
  Xi as DVAR,
  Gi as DVARP,
  Io as EDATE,
  $i as EFFECT,
  No as EOMONTH,
  Vr as ERF,
  Fr as ERFC,
  Uu as ERFCPRECISE,
  Yu as ERFPRECISE,
  Jn as ERROR,
  Of as EVEN,
  re as EXACT,
  Lf as EXP,
  Nn as EXPON,
  Xu as EXPONDIST,
  J as F,
  m as FACT,
  lr as FACTDOUBLE,
  ls as FALSE,
  Gu as FDIST,
  wu as FDISTRT,
  ee as FIND,
  Hu as FINV,
  ju as FINVRT,
  Fe as FISHER,
  Ue as FISHERINV,
  _n as FIXED,
  lt as FLOOR,
  pu as FLOORMATH,
  Bu as FLOORPRECISE,
  rr as FORECAST,
  Ye as FREQUENCY,
  Wu as FTEST,
  ct as FV,
  zi as FVSCHEDULE,
  Gt as GAMMA,
  Ku as GAMMADIST,
  qu as GAMMAINV,
  Tn as GAMMALN,
  Qu as GAMMALNPRECISE,
  Xe as GAUSS,
  Pf as GCD,
  Ge as GEOMEAN,
  Jo as GESTEP,
  we as GROWTH,
  He as HARMEAN,
  ko as HEX2BIN,
  yo as HEX2DEC,
  xo as HEX2OCT,
  kr as HLOOKUP,
  To as HOUR,
  Sn as HYPGEOM,
  $u as HYPGEOMDIST,
  cs as IF,
  gs as IFERROR,
  Ms as IFNA,
  hs as IFS,
  Pn as IMABS,
  P as IMAGINARY,
  Vn as IMARGUMENT,
  vo as IMCONJUGATE,
  _t as IMCOS,
  Ur as IMCOSH,
  mo as IMCOT,
  iu as IMCSC,
  su as IMCSCH,
  Mt as IMDIV,
  bo as IMEXP,
  _o as IMLN,
  tu as IMLOG10,
  nu as IMLOG2,
  ru as IMPOWER,
  eu as IMPRODUCT,
  V as IMREAL,
  fu as IMSEC,
  ou as IMSECH,
  tn as IMSIN,
  Yr as IMSINH,
  uu as IMSQRT,
  lu as IMSUB,
  cu as IMSUM,
  hu as IMTAN,
  yr as INDEX,
  Vf as INT,
  je as INTERCEPT,
  Gr as IPMT,
  Zi as IRR,
  jr as ISBLANK,
  kn as ISERR,
  dt as ISERROR,
  pr as ISEVEN,
  yn as ISLOGICAL,
  Br as ISNA,
  Wr as ISNONTEXT,
  xt as ISNUMBER,
  Ff as ISO,
  Kr as ISODD,
  Pr as ISOWEEKNUM,
  Ji as ISPMT,
  dn as ISTEXT,
  pe as KURT,
  er as LARGE,
  Uf as LCM,
  fe as LEFT,
  oe as LEN,
  An as LINEST,
  Yf as LN,
  Xf as LOG,
  Gf as LOG10,
  Be as LOGEST,
  zu as LOGINV,
  Tt as LOGNORM,
  Zu as LOGNORMDIST,
  Ju as LOGNORMINV,
  dr as LOOKUP,
  ue as LOWER,
  xr as MATCH,
  Qt as MAX,
  We as MAXA,
  Ke as MAXIFS,
  fr as MEDIAN,
  ie as MID,
  $t as MIN,
  qe as MINA,
  Qe as MINIFS,
  So as MINUTE,
  ki as MIRR,
  wf as MMULT,
  Hf as MOD,
  it as MODE,
  ku as MODEMULT,
  yu as MODESNGL,
  Ao as MONTH,
  jf as MROUND,
  pf as MULTINOMIAL,
  Bf as MUNIT,
  qr as N,
  Qr as NA,
  Dn as NEGBINOM,
  du as NEGBINOMDIST,
  vt as NETWORKDAYS,
  xu as NETWORKDAYSINTL,
  yi as NOMINAL,
  k as NORM,
  vu as NORMDIST,
  mu as NORMINV,
  bu as NORMSDIST,
  _u as NORMSINV,
  Es as NOT,
  Do as NOW,
  di as NPER,
  fn as NPV,
  se as NUMBERVALUE,
  gu as OCT2BIN,
  Mu as OCT2DEC,
  Eu as OCT2HEX,
  Wf as ODD,
  Is as OR,
  xi as PDURATION,
  or as PEARSON,
  K as PERCENTILE,
  ti as PERCENTILEEXC,
  ni as PERCENTILEINC,
  wt as PERCENTRANK,
  ri as PERCENTRANKEXC,
  ei as PERCENTRANKINC,
  $e as PERMUT,
  ze as PERMUTATIONA,
  Ze as PHI,
  Kf as PI,
  jt as PMT,
  an as POISSON,
  fi as POISSONDIST,
  cr as POWER,
  vi as PPMT,
  mi as PRICEDISC,
  Je as PROB,
  zt as PRODUCT,
  le as PROPER,
  bi as PV,
  st as QUARTILE,
  oi as QUARTILEEXC,
  ui as QUARTILEINC,
  qf as QUOTIENT,
  Qf as RADIANS,
  $f as RAND,
  zf as RANDBETWEEN,
  Ht as RANK,
  ii as RANKAVG,
  si as RANKEQ,
  _i as RATE,
  ce as REPLACE,
  q as REPT,
  he as RIGHT,
  Zf as ROMAN,
  hr as ROUND,
  Jf as ROUNDDOWN,
  kf as ROUNDUP,
  ke as ROW,
  vr as ROWS,
  ts as RRI,
  ye as RSQ,
  ge as SEARCH,
  yf as SEC,
  df as SECH,
  ao as SECOND,
  xf as SERIESSUM,
  vf as SIGN,
  mf as SIN,
  bf as SINH,
  Cn as SKEW,
  li as SKEWP,
  ns as SLN,
  de as SLOPE,
  ur as SMALL,
  mr as SORT,
  _f as SQRT,
  to as SQRTPI,
  xe as STANDARDIZE,
  B as STDEV,
  ve as STDEVA,
  ci as STDEVP,
  me as STDEVPA,
  hi as STDEVS,
  be as STEYX,
  Me as SUBSTITUTE,
  no as SUBTOTAL,
  b as SUM,
  ro as SUMIF,
  eo as SUMIFS,
  fo as SUMPRODUCT,
  oo as SUMSQ,
  uo as SUMX2MY2,
  io as SUMX2PY2,
  so as SUMXMY2,
  Ss as SWITCH,
  rs as SYD,
  W as T,
  lo as TAN,
  co as TANH,
  es as TBILLEQ,
  fs as TBILLPRICE,
  os as TBILLYIELD,
  gi as TDIST,
  Mi as TDISTRT,
  Ee as TEXT,
  Ie as TEXTJOIN,
  Co as TIME,
  Ro as TIMEVALUE,
  Ei as TINV,
  Oo as TODAY,
  br as TRANSPOSE,
  _e as TREND,
  Ne as TRIM,
  tf as TRIMMEAN,
  Ns as TRUE,
  ho as TRUNC,
  Ii as TTEST,
  $r as TYPE,
  Te as UNICHAR,
  Se as UNICODE,
  Mn as UNIQUE,
  Ae as UPPER,
  De as VALUE,
  p as VAR,
  ir as VARA,
  Ni as VARP,
  sr as VARPA,
  Ti as VARS,
  xn as VLOOKUP,
  Lo as WEEKDAY,
  Po as WEEKNUM,
  Rn as WEIBULL,
  Si as WEIBULLDIST,
  mt as WORKDAY,
  Ai as WORKDAYINTL,
  us as XIRR,
  is as XNPV,
  Ts as XOR,
  Vo as YEAR,
  Ln as YEARFRAC,
  On as Z,
  Di as ZTEST,
  As as utils
};
