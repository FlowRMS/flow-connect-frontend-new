import { __require as m } from "./revogrid-pro260.js";
import { __require as y } from "./revogrid-pro340.js";
import { __require as q } from "./revogrid-pro213.js";
import { __require as b } from "./revogrid-pro224.js";
var i, a;
function T() {
  if (a) return i;
  a = 1;
  var e = m(), u = y(), _ = q(), f = b(), o = e ? e.prototype : void 0, t = o ? o.toString : void 0;
  function n(r) {
    if (typeof r == "string")
      return r;
    if (_(r))
      return u(r, n) + "";
    if (f(r))
      return t ? t.call(r) : "";
    var s = r + "";
    return s == "0" && 1 / r == -1 / 0 ? "-0" : s;
  }
  return i = n, i;
}
export {
  T as __require
};
