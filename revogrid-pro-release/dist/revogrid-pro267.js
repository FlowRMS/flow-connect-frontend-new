import { __require as f } from "./revogrid-pro236.js";
import { __require as g } from "./revogrid-pro202.js";
var e, t;
function F() {
  if (t) return e;
  t = 1;
  var i = f(), o = g(), a = "[object AsyncFunction]", u = "[object Function]", c = "[object GeneratorFunction]", s = "[object Proxy]";
  function b(n) {
    if (!o(n))
      return !1;
    var r = i(n);
    return r == u || r == c || r == a || r == s;
  }
  return e = b, e;
}
export {
  F as __require
};
