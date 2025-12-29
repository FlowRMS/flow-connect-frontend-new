import { __require as P } from "./revogrid-pro306.js";
import { __require as v } from "./revogrid-pro302.js";
import { __require as I } from "./revogrid-pro213.js";
import { __require as d } from "./revogrid-pro303.js";
import { __require as p } from "./revogrid-pro268.js";
import { __require as x } from "./revogrid-pro250.js";
var n, t;
function z() {
  if (t) return n;
  t = 1;
  var _ = P(), q = v(), h = I(), m = d(), f = p(), l = x();
  function o(r, i, g) {
    i = _(i, r);
    for (var a = -1, e = i.length, s = !1; ++a < e; ) {
      var u = l(i[a]);
      if (!(s = r != null && g(r, u)))
        break;
      r = r[u];
    }
    return s || ++a != e ? s : (e = r == null ? 0 : r.length, !!e && f(e) && m(u, e) && (h(r) || q(r)));
  }
  return n = o, n;
}
export {
  z as __require
};
