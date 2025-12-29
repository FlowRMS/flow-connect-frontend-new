import { __require as f } from "./revogrid-pro196.js";
import { __require as R } from "./revogrid-pro197.js";
import { __require as g } from "./revogrid-pro198.js";
var n, o;
function s() {
  if (o) return n;
  o = 1;
  var a = f(), u = R(), _ = g();
  function q(i, e, r) {
    return e = u(e), r === void 0 ? (r = e, e = 0) : r = u(r), i = _(i), a(i, e, r);
  }
  return n = q, n;
}
export {
  s as __require
};
