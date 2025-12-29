import { __require as C } from "./revogrid-pro323.js";
import { __require as q } from "./revogrid-pro324.js";
import { __require as l } from "./revogrid-pro325.js";
import { __require as s } from "./revogrid-pro326.js";
import { __require as f } from "./revogrid-pro327.js";
var a, i;
function g() {
  if (i) return a;
  i = 1;
  var o = C(), h = q(), m = l(), _ = s(), c = f();
  function e(r) {
    var t = -1, u = r == null ? 0 : r.length;
    for (this.clear(); ++t < u; ) {
      var p = r[t];
      this.set(p[0], p[1]);
    }
  }
  return e.prototype.clear = o, e.prototype.delete = h, e.prototype.get = m, e.prototype.has = _, e.prototype.set = c, a = e, a;
}
export {
  g as __require
};
