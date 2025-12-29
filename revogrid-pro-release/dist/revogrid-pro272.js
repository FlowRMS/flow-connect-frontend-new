import { __require as p } from "./revogrid-pro312.js";
import { __require as C } from "./revogrid-pro313.js";
import { __require as q } from "./revogrid-pro314.js";
import { __require as m } from "./revogrid-pro315.js";
import { __require as f } from "./revogrid-pro316.js";
var t, s;
function g() {
  if (s) return t;
  s = 1;
  var o = p(), l = C(), h = q(), _ = m(), c = f();
  function e(r) {
    var i = -1, u = r == null ? 0 : r.length;
    for (this.clear(); ++i < u; ) {
      var a = r[i];
      this.set(a[0], a[1]);
    }
  }
  return e.prototype.clear = o, e.prototype.delete = l, e.prototype.get = h, e.prototype.has = _, e.prototype.set = c, t = e, t;
}
export {
  g as __require
};
