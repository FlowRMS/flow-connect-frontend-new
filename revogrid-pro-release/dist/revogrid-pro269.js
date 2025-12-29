import { __require as q } from "./revogrid-pro306.js";
import { __require as f } from "./revogrid-pro250.js";
var u, n;
function d() {
  if (n) return u;
  n = 1;
  var t = q(), _ = f();
  function s(e, r) {
    r = t(r, e);
    for (var i = 0, a = r.length; e != null && i < a; )
      e = e[_(r[i++])];
    return i && i == a ? e : void 0;
  }
  return u = s, u;
}
export {
  d as __require
};
