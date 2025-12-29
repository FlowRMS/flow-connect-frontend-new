import { __require as s } from "./revogrid-pro307.js";
import { __require as u } from "./revogrid-pro308.js";
import { __require as c } from "./revogrid-pro309.js";
var t, i;
function q() {
  if (i) return t;
  i = 1;
  var h = s(), _ = u(), o = c();
  function e(r) {
    var a = -1, p = r == null ? 0 : r.length;
    for (this.__data__ = new h(); ++a < p; )
      this.add(r[a]);
  }
  return e.prototype.add = e.prototype.push = _, e.prototype.has = o, t = e, t;
}
export {
  q as __require
};
