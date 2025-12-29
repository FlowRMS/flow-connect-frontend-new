var W, d, Y, S, J, Z, ee, _e, O, R, j, D = {}, te = [], ue = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i, U = Array.isArray;
function k(_, e) {
  for (var t in e) _[t] = e[t];
  return _;
}
function z(_) {
  _ && _.parentNode && _.parentNode.removeChild(_);
}
function pe(_, e, t) {
  var l, o, r, i = {};
  for (r in e) r == "key" ? l = e[r] : r == "ref" ? o = e[r] : i[r] = e[r];
  if (arguments.length > 2 && (i.children = arguments.length > 3 ? W.call(arguments, 2) : t), typeof _ == "function" && _.defaultProps != null) for (r in _.defaultProps) i[r] === void 0 && (i[r] = _.defaultProps[r]);
  return F(_, i, l, o, null);
}
function F(_, e, t, l, o) {
  var r = { type: _, props: e, key: t, ref: l, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: o ?? ++Y, __i: -1, __u: 0 };
  return o == null && d.vnode != null && d.vnode(r), r;
}
function I(_) {
  return _.children;
}
function N(_, e) {
  this.props = _, this.context = e;
}
function C(_, e) {
  if (e == null) return _.__ ? C(_.__, _.__i + 1) : null;
  for (var t; e < _.__k.length; e++) if ((t = _.__k[e]) != null && t.__e != null) return t.__e;
  return typeof _.type == "function" ? C(_) : null;
}
function ne(_) {
  var e, t;
  if ((_ = _.__) != null && _.__c != null) {
    for (_.__e = _.__c.base = null, e = 0; e < _.__k.length; e++) if ((t = _.__k[e]) != null && t.__e != null) {
      _.__e = _.__c.base = t.__e;
      break;
    }
    return ne(_);
  }
}
function K(_) {
  (!_.__d && (_.__d = !0) && S.push(_) && !H.__r++ || J != d.debounceRendering) && ((J = d.debounceRendering) || Z)(H);
}
function H() {
  for (var _, e, t, l, o, r, i, u = 1; S.length; ) S.length > u && S.sort(ee), _ = S.shift(), u = S.length, _.__d && (t = void 0, l = void 0, o = (l = (e = _).__v).__e, r = [], i = [], e.__P && ((t = k({}, l)).__v = l.__v + 1, d.vnode && d.vnode(t), V(e.__P, t, l, e.__n, e.__P.namespaceURI, 32 & l.__u ? [o] : null, r, o ?? C(l), !!(32 & l.__u), i), t.__v = l.__v, t.__.__k[t.__i] = t, le(r, t, i), l.__e = l.__ = null, t.__e != o && ne(t)));
  H.__r = 0;
}
function re(_, e, t, l, o, r, i, u, f, s, c) {
  var n, v, p, y, g, m, h, a = l && l.__k || te, w = e.length;
  for (f = ce(t, e, a, f, w), n = 0; n < w; n++) (p = t.__k[n]) != null && (v = p.__i == -1 ? D : a[p.__i] || D, p.__i = n, m = V(_, p, v, o, r, i, u, f, s, c), y = p.__e, p.ref && v.ref != p.ref && (v.ref && q(v.ref, null, p), c.push(p.ref, p.__c || y, p)), g == null && y != null && (g = y), (h = !!(4 & p.__u)) || v.__k === p.__k ? f = oe(p, f, _, h) : typeof p.type == "function" && m !== void 0 ? f = m : y && (f = y.nextSibling), p.__u &= -7);
  return t.__e = g, f;
}
function ce(_, e, t, l, o) {
  var r, i, u, f, s, c = t.length, n = c, v = 0;
  for (_.__k = new Array(o), r = 0; r < o; r++) (i = e[r]) != null && typeof i != "boolean" && typeof i != "function" ? (typeof i == "string" || typeof i == "number" || typeof i == "bigint" || i.constructor == String ? i = _.__k[r] = F(null, i, null, null, null) : U(i) ? i = _.__k[r] = F(I, { children: i }, null, null, null) : i.constructor == null && i.__b > 0 ? i = _.__k[r] = F(i.type, i.props, i.key, i.ref ? i.ref : null, i.__v) : _.__k[r] = i, f = r + v, i.__ = _, i.__b = _.__b + 1, u = null, (s = i.__i = ae(i, t, f, n)) != -1 && (n--, (u = t[s]) && (u.__u |= 2)), u == null || u.__v == null ? (s == -1 && (o > c ? v-- : o < c && v++), typeof i.type != "function" && (i.__u |= 4)) : s != f && (s == f - 1 ? v-- : s == f + 1 ? v++ : (s > f ? v-- : v++, i.__u |= 4))) : _.__k[r] = null;
  if (n) for (r = 0; r < c; r++) (u = t[r]) != null && (2 & u.__u) == 0 && (u.__e == l && (l = C(u)), se(u, u));
  return l;
}
function oe(_, e, t, l) {
  var o, r;
  if (typeof _.type == "function") {
    for (o = _.__k, r = 0; o && r < o.length; r++) o[r] && (o[r].__ = _, e = oe(o[r], e, t, l));
    return e;
  }
  _.__e != e && (l && (e && _.type && !e.parentNode && (e = C(_)), t.insertBefore(_.__e, e || null)), e = _.__e);
  do
    e = e && e.nextSibling;
  while (e != null && e.nodeType == 8);
  return e;
}
function fe(_, e) {
  return e = e || [], _ == null || typeof _ == "boolean" || (U(_) ? _.some(function(t) {
    fe(t, e);
  }) : e.push(_)), e;
}
function ae(_, e, t, l) {
  var o, r, i, u = _.key, f = _.type, s = e[t], c = s != null && (2 & s.__u) == 0;
  if (s === null && u == null || c && u == s.key && f == s.type) return t;
  if (l > (c ? 1 : 0)) {
    for (o = t - 1, r = t + 1; o >= 0 || r < e.length; ) if ((s = e[i = o >= 0 ? o-- : r++]) != null && (2 & s.__u) == 0 && u == s.key && f == s.type) return i;
  }
  return -1;
}
function Q(_, e, t) {
  e[0] == "-" ? _.setProperty(e, t ?? "") : _[e] = t == null ? "" : typeof t != "number" || ue.test(e) ? t : t + "px";
}
function A(_, e, t, l, o) {
  var r, i;
  e: if (e == "style") if (typeof t == "string") _.style.cssText = t;
  else {
    if (typeof l == "string" && (_.style.cssText = l = ""), l) for (e in l) t && e in t || Q(_.style, e, "");
    if (t) for (e in t) l && t[e] == l[e] || Q(_.style, e, t[e]);
  }
  else if (e[0] == "o" && e[1] == "n") r = e != (e = e.replace(_e, "$1")), i = e.toLowerCase(), e = i in _ || e == "onFocusOut" || e == "onFocusIn" ? i.slice(2) : e.slice(2), _.l || (_.l = {}), _.l[e + r] = t, t ? l ? t.u = l.u : (t.u = O, _.addEventListener(e, r ? j : R, r)) : _.removeEventListener(e, r ? j : R, r);
  else {
    if (o == "http://www.w3.org/2000/svg") e = e.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
    else if (e != "width" && e != "height" && e != "href" && e != "list" && e != "form" && e != "tabIndex" && e != "download" && e != "rowSpan" && e != "colSpan" && e != "role" && e != "popover" && e in _) try {
      _[e] = t ?? "";
      break e;
    } catch {
    }
    typeof t == "function" || (t == null || t === !1 && e[4] != "-" ? _.removeAttribute(e) : _.setAttribute(e, e == "popover" && t == 1 ? "" : t));
  }
}
function X(_) {
  return function(e) {
    if (this.l) {
      var t = this.l[e.type + _];
      if (e.t == null) e.t = O++;
      else if (e.t < t.u) return;
      return t(d.event ? d.event(e) : e);
    }
  };
}
function V(_, e, t, l, o, r, i, u, f, s) {
  var c, n, v, p, y, g, m, h, a, w, x, E, T, G, L, M, $, b = e.type;
  if (e.constructor != null) return null;
  128 & t.__u && (f = !!(32 & t.__u), r = [u = e.__e = t.__e]), (c = d.__b) && c(e);
  e: if (typeof b == "function") try {
    if (h = e.props, a = "prototype" in b && b.prototype.render, w = (c = b.contextType) && l[c.__c], x = c ? w ? w.props.value : c.__ : l, t.__c ? m = (n = e.__c = t.__c).__ = n.__E : (a ? e.__c = n = new b(h, x) : (e.__c = n = new N(h, x), n.constructor = b, n.render = de), w && w.sub(n), n.state || (n.state = {}), n.__n = l, v = n.__d = !0, n.__h = [], n._sb = []), a && n.__s == null && (n.__s = n.state), a && b.getDerivedStateFromProps != null && (n.__s == n.state && (n.__s = k({}, n.__s)), k(n.__s, b.getDerivedStateFromProps(h, n.__s))), p = n.props, y = n.state, n.__v = e, v) a && b.getDerivedStateFromProps == null && n.componentWillMount != null && n.componentWillMount(), a && n.componentDidMount != null && n.__h.push(n.componentDidMount);
    else {
      if (a && b.getDerivedStateFromProps == null && h !== p && n.componentWillReceiveProps != null && n.componentWillReceiveProps(h, x), e.__v == t.__v || !n.__e && n.shouldComponentUpdate != null && n.shouldComponentUpdate(h, n.__s, x) === !1) {
        for (e.__v != t.__v && (n.props = h, n.state = n.__s, n.__d = !1), e.__e = t.__e, e.__k = t.__k, e.__k.some(function(P) {
          P && (P.__ = e);
        }), E = 0; E < n._sb.length; E++) n.__h.push(n._sb[E]);
        n._sb = [], n.__h.length && i.push(n);
        break e;
      }
      n.componentWillUpdate != null && n.componentWillUpdate(h, n.__s, x), a && n.componentDidUpdate != null && n.__h.push(function() {
        n.componentDidUpdate(p, y, g);
      });
    }
    if (n.context = x, n.props = h, n.__P = _, n.__e = !1, T = d.__r, G = 0, a) {
      for (n.state = n.__s, n.__d = !1, T && T(e), c = n.render(n.props, n.state, n.context), L = 0; L < n._sb.length; L++) n.__h.push(n._sb[L]);
      n._sb = [];
    } else do
      n.__d = !1, T && T(e), c = n.render(n.props, n.state, n.context), n.state = n.__s;
    while (n.__d && ++G < 25);
    n.state = n.__s, n.getChildContext != null && (l = k(k({}, l), n.getChildContext())), a && !v && n.getSnapshotBeforeUpdate != null && (g = n.getSnapshotBeforeUpdate(p, y)), M = c, c != null && c.type === I && c.key == null && (M = ie(c.props.children)), u = re(_, U(M) ? M : [M], e, t, l, o, r, i, u, f, s), n.base = e.__e, e.__u &= -161, n.__h.length && i.push(n), m && (n.__E = n.__ = null);
  } catch (P) {
    if (e.__v = null, f || r != null) if (P.then) {
      for (e.__u |= f ? 160 : 128; u && u.nodeType == 8 && u.nextSibling; ) u = u.nextSibling;
      r[r.indexOf(u)] = null, e.__e = u;
    } else {
      for ($ = r.length; $--; ) z(r[$]);
      B(e);
    }
    else e.__e = t.__e, e.__k = t.__k, P.then || B(e);
    d.__e(P, e, t);
  }
  else r == null && e.__v == t.__v ? (e.__k = t.__k, e.__e = t.__e) : u = e.__e = he(t.__e, e, t, l, o, r, i, f, s);
  return (c = d.diffed) && c(e), 128 & e.__u ? void 0 : u;
}
function B(_) {
  _ && _.__c && (_.__c.__e = !0), _ && _.__k && _.__k.forEach(B);
}
function le(_, e, t) {
  for (var l = 0; l < t.length; l++) q(t[l], t[++l], t[++l]);
  d.__c && d.__c(e, _), _.some(function(o) {
    try {
      _ = o.__h, o.__h = [], _.some(function(r) {
        r.call(o);
      });
    } catch (r) {
      d.__e(r, o.__v);
    }
  });
}
function ie(_) {
  return typeof _ != "object" || _ == null || _.__b && _.__b > 0 ? _ : U(_) ? _.map(ie) : k({}, _);
}
function he(_, e, t, l, o, r, i, u, f) {
  var s, c, n, v, p, y, g, m = t.props || D, h = e.props, a = e.type;
  if (a == "svg" ? o = "http://www.w3.org/2000/svg" : a == "math" ? o = "http://www.w3.org/1998/Math/MathML" : o || (o = "http://www.w3.org/1999/xhtml"), r != null) {
    for (s = 0; s < r.length; s++) if ((p = r[s]) && "setAttribute" in p == !!a && (a ? p.localName == a : p.nodeType == 3)) {
      _ = p, r[s] = null;
      break;
    }
  }
  if (_ == null) {
    if (a == null) return document.createTextNode(h);
    _ = document.createElementNS(o, a, h.is && h), u && (d.__m && d.__m(e, r), u = !1), r = null;
  }
  if (a == null) m === h || u && _.data == h || (_.data = h);
  else {
    if (r = r && W.call(_.childNodes), !u && r != null) for (m = {}, s = 0; s < _.attributes.length; s++) m[(p = _.attributes[s]).name] = p.value;
    for (s in m) if (p = m[s], s != "children") {
      if (s == "dangerouslySetInnerHTML") n = p;
      else if (!(s in h)) {
        if (s == "value" && "defaultValue" in h || s == "checked" && "defaultChecked" in h) continue;
        A(_, s, null, p, o);
      }
    }
    for (s in h) p = h[s], s == "children" ? v = p : s == "dangerouslySetInnerHTML" ? c = p : s == "value" ? y = p : s == "checked" ? g = p : u && typeof p != "function" || m[s] === p || A(_, s, p, m[s], o);
    if (c) u || n && (c.__html == n.__html || c.__html == _.innerHTML) || (_.innerHTML = c.__html), e.__k = [];
    else if (n && (_.innerHTML = ""), re(e.type == "template" ? _.content : _, U(v) ? v : [v], e, t, l, a == "foreignObject" ? "http://www.w3.org/1999/xhtml" : o, r, i, r ? r[0] : t.__k && C(t, 0), u, f), r != null) for (s = r.length; s--; ) z(r[s]);
    u || (s = "value", a == "progress" && y == null ? _.removeAttribute("value") : y != null && (y !== _[s] || a == "progress" && !y || a == "option" && y != m[s]) && A(_, s, y, m[s], o), s = "checked", g != null && g != _[s] && A(_, s, g, m[s], o));
  }
  return _;
}
function q(_, e, t) {
  try {
    if (typeof _ == "function") {
      var l = typeof _.__u == "function";
      l && _.__u(), l && e == null || (_.__u = _(e));
    } else _.current = e;
  } catch (o) {
    d.__e(o, t);
  }
}
function se(_, e, t) {
  var l, o;
  if (d.unmount && d.unmount(_), (l = _.ref) && (l.current && l.current != _.__e || q(l, null, e)), (l = _.__c) != null) {
    if (l.componentWillUnmount) try {
      l.componentWillUnmount();
    } catch (r) {
      d.__e(r, e);
    }
    l.base = l.__P = null;
  }
  if (l = _.__k) for (o = 0; o < l.length; o++) l[o] && se(l[o], e, t || typeof _.type != "function");
  t || z(_.__e), _.__c = _.__ = _.__e = void 0;
}
function de(_, e, t) {
  return this.constructor(_, t);
}
function ve(_, e, t) {
  var l, o, r, i;
  e == document && (e = document.documentElement), d.__ && d.__(_, e), o = (l = !1) ? null : e.__k, r = [], i = [], V(e, _ = e.__k = pe(I, null, [_]), o || D, D, e.namespaceURI, o ? null : e.firstChild ? W.call(e.childNodes) : null, r, o ? o.__e : e.firstChild, l, i), le(r, _, i);
}
W = te.slice, d = { __e: function(_, e, t, l) {
  for (var o, r, i; e = e.__; ) if ((o = e.__c) && !o.__) try {
    if ((r = o.constructor) && r.getDerivedStateFromError != null && (o.setState(r.getDerivedStateFromError(_)), i = o.__d), o.componentDidCatch != null && (o.componentDidCatch(_, l || {}), i = o.__d), i) return o.__E = o;
  } catch (u) {
    _ = u;
  }
  throw _;
} }, Y = 0, N.prototype.setState = function(_, e) {
  var t;
  t = this.__s != null && this.__s != this.state ? this.__s : this.__s = k({}, this.state), typeof _ == "function" && (_ = _(k({}, t), this.props)), _ && k(t, _), _ != null && this.__v && (e && this._sb.push(e), K(this));
}, N.prototype.forceUpdate = function(_) {
  this.__v && (this.__e = !0, _ && this.__h.push(_), K(this));
}, N.prototype.render = I, S = [], Z = typeof Promise == "function" ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, ee = function(_, e) {
  return _.__v.__b - e.__v.__b;
}, H.__r = 0, _e = /(PointerCapture)$|Capture$/i, O = 0, R = X(!1), j = X(!0);
export {
  N as Component,
  I as Fragment,
  pe as createElement,
  pe as h,
  d as options,
  ve as render,
  fe as toChildArray
};
