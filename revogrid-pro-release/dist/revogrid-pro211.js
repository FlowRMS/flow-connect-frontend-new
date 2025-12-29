import { __require as u } from "./revogrid-pro230.js";
import { __require as f } from "./revogrid-pro231.js";
import { __require as p } from "./revogrid-pro222.js";
import { __require as q } from "./revogrid-pro213.js";
import { __require as m } from "./revogrid-pro232.js";
var e, t;
function M() {
  if (t) return e;
  t = 1;
  var i = u(), o = f(), s = p(), a = q(), _ = m();
  function n(r) {
    return typeof r == "function" ? r : r == null ? s : typeof r == "object" ? a(r) ? o(r[0], r[1]) : i(r) : _(r);
  }
  return e = n, e;
}
export {
  M as __require
};
