import { Component as s, options as l, createElement as p, Fragment as h, toChildArray as d, render as m } from "./revogrid-pro119.js";
import { useCallback as q, useEffect as J, useMemo as K, useReducer as Q, useRef as X, useState as Y } from "./revogrid-pro121.js";
function w(e, t) {
  for (var r in t) e[r] = t[r];
  return e;
}
function y(e, t) {
  for (var r in e) if (r !== "__source" && !(r in t)) return !0;
  for (var o in t) if (o !== "__source" && e[o] !== t[o]) return !0;
  return !1;
}
function b(e, t) {
  this.props = e, this.context = t;
}
(b.prototype = new s()).isPureReactComponent = !0, b.prototype.shouldComponentUpdate = function(e, t) {
  return y(this.props, e) || y(this.state, t);
};
var g = l.__b;
l.__b = function(e) {
  e.type && e.type.__f && e.ref && (e.props.ref = e.ref, e.ref = null), g && g(e);
};
var R = l.__e;
l.__e = function(e, t, r, o) {
  if (e.then) {
    for (var n, a = t; a = a.__; ) if ((n = a.__c) && n.__c) return t.__e == null && (t.__e = r.__e, t.__k = r.__k), n.__c(e, t);
  }
  R(e, t, r, o);
};
var k = l.unmount;
function S(e, t, r) {
  return e && (e.__c && e.__c.__H && (e.__c.__H.__.forEach(function(o) {
    typeof o.__c == "function" && o.__c();
  }), e.__c.__H = null), (e = w({}, e)).__c != null && (e.__c.__P === r && (e.__c.__P = t), e.__c.__e = !0, e.__c = null), e.__k = e.__k && e.__k.map(function(o) {
    return S(o, t, r);
  })), e;
}
function E(e, t, r) {
  return e && r && (e.__v = null, e.__k = e.__k && e.__k.map(function(o) {
    return E(o, t, r);
  }), e.__c && e.__c.__P === t && (e.__e && r.appendChild(e.__e), e.__c.__e = !0, e.__c.__P = r)), e;
}
function v() {
  this.__u = 0, this.o = null, this.__b = null;
}
function U(e) {
  var t = e.__.__c;
  return t && t.__a && t.__a(e);
}
function f() {
  this.i = null, this.l = null;
}
l.unmount = function(e) {
  var t = e.__c;
  t && t.__R && t.__R(), t && 32 & e.__u && (e.type = null), k && k(e);
}, (v.prototype = new s()).__c = function(e, t) {
  var r = t.__c, o = this;
  o.o == null && (o.o = []), o.o.push(r);
  var n = U(o.__v), a = !1, _ = function() {
    a || (a = !0, r.__R = null, n ? n(i) : i());
  };
  r.__R = _;
  var i = function() {
    if (!--o.__u) {
      if (o.state.__a) {
        var u = o.state.__a;
        o.__v.__k[0] = E(u, u.__c.__P, u.__c.__O);
      }
      var c;
      for (o.setState({ __a: o.__b = null }); c = o.o.pop(); ) c.forceUpdate();
    }
  };
  o.__u++ || 32 & t.__u || o.setState({ __a: o.__b = o.__v.__k[0] }), e.then(_, _);
}, v.prototype.componentWillUnmount = function() {
  this.o = [];
}, v.prototype.render = function(e, t) {
  if (this.__b) {
    if (this.__v.__k) {
      var r = document.createElement("div"), o = this.__v.__k[0].__c;
      this.__v.__k[0] = S(this.__b, r, o.__O = o.__P);
    }
    this.__b = null;
  }
  var n = t.__a && p(h, null, e.fallback);
  return n && (n.__u &= -33), [p(h, null, t.__a ? null : e.children), n];
};
var C = function(e, t, r) {
  if (++r[1] === r[0] && e.l.delete(t), e.props.revealOrder && (e.props.revealOrder[0] !== "t" || !e.l.size)) for (r = e.i; r; ) {
    for (; r.length > 3; ) r.pop()();
    if (r[1] < r[0]) break;
    e.i = r = r[2];
  }
};
function W(e) {
  return this.getChildContext = function() {
    return e.context;
  }, e.children;
}
function A(e) {
  var t = this, r = e.h;
  if (t.componentWillUnmount = function() {
    m(null, t.v), t.v = null, t.h = null;
  }, t.h && t.h !== r && t.componentWillUnmount(), !t.v) {
    for (var o = t.__v; o !== null && !o.__m && o.__ !== null; ) o = o.__;
    t.h = r, t.v = { nodeType: 1, parentNode: r, childNodes: [], __k: { __m: o.__m }, contains: function() {
      return !0;
    }, insertBefore: function(n, a) {
      this.childNodes.push(n), t.h.insertBefore(n, a);
    }, removeChild: function(n) {
      this.childNodes.splice(this.childNodes.indexOf(n) >>> 1, 1), t.h.removeChild(n);
    } };
  }
  m(p(W, { context: t.context }, e.__v), t.v);
}
function z(e, t) {
  var r = p(A, { __v: e, h: t });
  return r.containerInfo = t, r;
}
(f.prototype = new s()).__a = function(e) {
  var t = this, r = U(t.__v), o = t.l.get(e);
  return o[0]++, function(n) {
    var a = function() {
      t.props.revealOrder ? (o.push(n), C(t, e, o)) : n();
    };
    r ? r(a) : a();
  };
}, f.prototype.render = function(e) {
  this.i = null, this.l = /* @__PURE__ */ new Map();
  var t = d(e.children);
  e.revealOrder && e.revealOrder[0] === "b" && t.reverse();
  for (var r = t.length; r--; ) this.l.set(t[r], this.i = [1, 0, this.i]);
  return e.children;
}, f.prototype.componentDidUpdate = f.prototype.componentDidMount = function() {
  var e = this;
  this.l.forEach(function(t, r) {
    C(e, r, t);
  });
};
var H = typeof Symbol < "u" && Symbol.for && /* @__PURE__ */ Symbol.for("react.element") || 60103, V = /^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/, $ = /^on(Ani|Tra|Tou|BeforeInp|Compo)/, B = /[A-Z0-9]/g, j = typeof document < "u", F = function(e) {
  return (typeof Symbol < "u" && typeof /* @__PURE__ */ Symbol() == "symbol" ? /fil|che|rad/ : /fil|che|ra/).test(e);
};
s.prototype.isReactComponent = {}, ["componentWillMount", "componentWillReceiveProps", "componentWillUpdate"].forEach(function(e) {
  Object.defineProperty(s.prototype, e, { configurable: !0, get: function() {
    return this["UNSAFE_" + e];
  }, set: function(t) {
    Object.defineProperty(this, e, { configurable: !0, writable: !0, value: t });
  } });
});
var P = l.event;
function L() {
}
function M() {
  return this.cancelBubble;
}
function T() {
  return this.defaultPrevented;
}
l.event = function(e) {
  return P && (e = P(e)), e.persist = L, e.isPropagationStopped = M, e.isDefaultPrevented = T, e.nativeEvent = e;
};
var D = { enumerable: !1, configurable: !0, get: function() {
  return this.class;
} }, x = l.vnode;
l.vnode = function(e) {
  typeof e.type == "string" && (function(t) {
    var r = t.props, o = t.type, n = {}, a = o.indexOf("-") === -1;
    for (var _ in r) {
      var i = r[_];
      if (!(_ === "value" && "defaultValue" in r && i == null || j && _ === "children" && o === "noscript" || _ === "class" || _ === "className")) {
        var u = _.toLowerCase();
        _ === "defaultValue" && "value" in r && r.value == null ? _ = "value" : _ === "download" && i === !0 ? i = "" : u === "translate" && i === "no" ? i = !1 : u[0] === "o" && u[1] === "n" ? u === "ondoubleclick" ? _ = "ondblclick" : u !== "onchange" || o !== "input" && o !== "textarea" || F(r.type) ? u === "onfocus" ? _ = "onfocusin" : u === "onblur" ? _ = "onfocusout" : $.test(_) && (_ = u) : u = _ = "oninput" : a && V.test(_) ? _ = _.replace(B, "-$&").toLowerCase() : i === null && (i = void 0), u === "oninput" && n[_ = u] && (_ = "oninputCapture"), n[_] = i;
      }
    }
    o == "select" && n.multiple && Array.isArray(n.value) && (n.value = d(r.children).forEach(function(c) {
      c.props.selected = n.value.indexOf(c.props.value) != -1;
    })), o == "select" && n.defaultValue != null && (n.value = d(r.children).forEach(function(c) {
      c.props.selected = n.multiple ? n.defaultValue.indexOf(c.props.value) != -1 : n.defaultValue == c.props.value;
    })), r.class && !r.className ? (n.class = r.class, Object.defineProperty(n, "className", D)) : (r.className && !r.class || r.class && r.className) && (n.class = n.className = r.className), t.props = n;
  })(e), e.$$typeof = H, x && x(e);
};
var N = l.__r;
l.__r = function(e) {
  N && N(e), e.__c;
};
var O = l.diffed;
l.diffed = function(e) {
  O && O(e);
  var t = e.props, r = e.__e;
  r != null && e.type === "textarea" && "value" in t && t.value !== r.value && (r.value = t.value == null ? "" : t.value);
};
export {
  s as Component,
  h as Fragment,
  b as PureComponent,
  v as Suspense,
  f as SuspenseList,
  p as createElement,
  z as createPortal,
  q as useCallback,
  J as useEffect,
  K as useMemo,
  Q as useReducer,
  X as useRef,
  Y as useState
};
