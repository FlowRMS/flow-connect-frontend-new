import { options as j } from "./revogrid-pro119.js";
var s, o, H, y, v = 0, U = [], n = j, A = n.__b, k = n.__r, q = n.diffed, F = n.__c, g = n.unmount, C = n.__;
function d(_, t) {
  n.__h && n.__h(o, _, v || t), v = 0;
  var r = o.__H || (o.__H = { __: [], __h: [] });
  return _ >= r.__.length && r.__.push({}), r.__[_];
}
function D(_) {
  return v = 1, w(S, _);
}
function w(_, t, r) {
  var u = d(s++, 2);
  if (u.t = _, !u.__c && (u.__ = [r ? r(t) : S(void 0, t), function(i) {
    var c = u.__N ? u.__N[0] : u.__[0], f = u.t(c, i);
    c !== f && (u.__N = [f, u.__[1]], u.__c.setState({}));
  }], u.__c = o, !o.__f)) {
    var a = function(i, c, f) {
      if (!u.__c.__H) return !0;
      var m = u.__c.__H.__.filter(function(e) {
        return !!e.__c;
      });
      if (m.every(function(e) {
        return !e.__N;
      })) return !h || h.call(this, i, c, f);
      var E = u.__c.props !== i;
      return m.forEach(function(e) {
        if (e.__N) {
          var W = e.__[0];
          e.__ = e.__N, e.__N = void 0, W !== e.__[0] && (E = !0);
        }
      }), h && h.call(this, i, c, f) || E;
    };
    o.__f = !0;
    var h = o.shouldComponentUpdate, N = o.componentWillUpdate;
    o.componentWillUpdate = function(i, c, f) {
      if (this.__e) {
        var m = h;
        h = void 0, a(i, c, f), h = m;
      }
      N && N.call(this, i, c, f);
    }, o.shouldComponentUpdate = a;
  }
  return u.__N || u.__;
}
function M(_, t) {
  var r = d(s++, 3);
  !n.__s && R(r.__H, t) && (r.__ = _, r.u = t, o.__H.__h.push(r));
}
function P(_) {
  return v = 5, b(function() {
    return { current: _ };
  }, []);
}
function b(_, t) {
  var r = d(s++, 7);
  return R(r.__H, t) && (r.__ = _(), r.__H = t, r.__h = _), r.__;
}
function $(_, t) {
  return v = 8, b(function() {
    return _;
  }, t);
}
function x() {
  for (var _; _ = U.shift(); ) if (_.__P && _.__H) try {
    _.__H.__h.forEach(l), _.__H.__h.forEach(p), _.__H.__h = [];
  } catch (t) {
    _.__H.__h = [], n.__e(t, _.__v);
  }
}
n.__b = function(_) {
  o = null, A && A(_);
}, n.__ = function(_, t) {
  _ && t.__k && t.__k.__m && (_.__m = t.__k.__m), C && C(_, t);
}, n.__r = function(_) {
  k && k(_), s = 0;
  var t = (o = _.__c).__H;
  t && (H === o ? (t.__h = [], o.__h = [], t.__.forEach(function(r) {
    r.__N && (r.__ = r.__N), r.u = r.__N = void 0;
  })) : (t.__h.forEach(l), t.__h.forEach(p), t.__h = [], s = 0)), H = o;
}, n.diffed = function(_) {
  q && q(_);
  var t = _.__c;
  t && t.__H && (t.__H.__h.length && (U.push(t) !== 1 && y === n.requestAnimationFrame || ((y = n.requestAnimationFrame) || z)(x)), t.__H.__.forEach(function(r) {
    r.u && (r.__H = r.u), r.u = void 0;
  })), H = o = null;
}, n.__c = function(_, t) {
  t.some(function(r) {
    try {
      r.__h.forEach(l), r.__h = r.__h.filter(function(u) {
        return !u.__ || p(u);
      });
    } catch (u) {
      t.some(function(a) {
        a.__h && (a.__h = []);
      }), t = [], n.__e(u, r.__v);
    }
  }), F && F(_, t);
}, n.unmount = function(_) {
  g && g(_);
  var t, r = _.__c;
  r && r.__H && (r.__H.__.forEach(function(u) {
    try {
      l(u);
    } catch (a) {
      t = a;
    }
  }), r.__H = void 0, t && n.__e(t, r.__v));
};
var T = typeof requestAnimationFrame == "function";
function z(_) {
  var t, r = function() {
    clearTimeout(u), T && cancelAnimationFrame(t), setTimeout(_);
  }, u = setTimeout(r, 35);
  T && (t = requestAnimationFrame(r));
}
function l(_) {
  var t = o, r = _.__c;
  typeof r == "function" && (_.__c = void 0, r()), o = t;
}
function p(_) {
  var t = o;
  _.__c = _.__(), o = t;
}
function R(_, t) {
  return !_ || _.length !== t.length || t.some(function(r, u) {
    return r !== _[u];
  });
}
function S(_, t) {
  return typeof t == "function" ? t(_) : t;
}
export {
  $ as useCallback,
  M as useEffect,
  b as useMemo,
  w as useReducer,
  P as useRef,
  D as useState
};
