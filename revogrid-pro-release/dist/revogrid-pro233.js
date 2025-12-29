import { __require as C } from "./revogrid-pro253.js";
import { __require as G } from "./revogrid-pro254.js";
import { __require as M } from "./revogrid-pro255.js";
import { __require as H } from "./revogrid-pro256.js";
import { __require as J } from "./revogrid-pro257.js";
import { __require as K } from "./revogrid-pro213.js";
import { __require as N } from "./revogrid-pro258.js";
import { __require as Q } from "./revogrid-pro259.js";
var n, w;
function h() {
  if (w) return n;
  w = 1;
  var p = C(), E = G(), P = M(), b = H(), o = J(), A = K(), v = N(), j = Q(), B = 1, T = "[object Arguments]", m = "[object Array]", q = "[object Object]", D = Object.prototype, I = D.hasOwnProperty;
  function d(r, a, u, f, s, e) {
    var l = A(r), R = A(a), _ = l ? m : o(r), i = R ? m : o(a);
    _ = _ == T ? q : _, i = i == T ? q : i;
    var y = _ == q, S = i == q, g = _ == i;
    if (g && v(r)) {
      if (!v(a))
        return !1;
      l = !0, y = !1;
    }
    if (g && !y)
      return e || (e = new p()), l || j(r) ? E(r, a, u, f, s, e) : P(r, a, _, u, f, s, e);
    if (!(u & B)) {
      var O = y && I.call(r, "__wrapped__"), t = S && I.call(a, "__wrapped__");
      if (O || t) {
        var L = O ? r.value() : r, x = t ? a.value() : a;
        return e || (e = new p()), s(L, x, u, f, e);
      }
    }
    return g ? (e || (e = new p()), b(r, a, u, f, s, e)) : !1;
  }
  return n = d, n;
}
export {
  h as __require
};
