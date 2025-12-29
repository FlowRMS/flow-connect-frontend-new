import { __require as n } from "./revogrid-pro213.js";
import { __require as q } from "./revogrid-pro248.js";
import { __require as f } from "./revogrid-pro321.js";
import { __require as m } from "./revogrid-pro322.js";
var i, t;
function g() {
  if (t) return i;
  t = 1;
  var e = n(), a = q(), s = f(), o = m();
  function _(r, u) {
    return e(r) ? r : a(r, u) ? [r] : s(o(r));
  }
  return i = _, i;
}
export {
  g as __require
};
