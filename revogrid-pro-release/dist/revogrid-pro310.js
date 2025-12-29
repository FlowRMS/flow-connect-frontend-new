import { __require as y } from "./revogrid-pro329.js";
import { __require as n } from "./revogrid-pro213.js";
var e, s;
function f() {
  if (s) return e;
  s = 1;
  var u = y(), i = n();
  function t(r, _, l) {
    var a = _(r);
    return i(r) ? a : u(a, l(r));
  }
  return e = t, e;
}
export {
  f as __require
};
