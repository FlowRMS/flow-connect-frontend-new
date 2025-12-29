import { __require as n } from "./revogrid-pro226.js";
import { __require as q } from "./revogrid-pro210.js";
import { __require as f } from "./revogrid-pro227.js";
import { __require as h } from "./revogrid-pro213.js";
var r, e;
function y() {
  if (e) return r;
  e = 1;
  var i = n(), u = q(), o = f(), _ = h();
  function c(a, t) {
    var s = _(a) ? i : u;
    return s(a, o(t));
  }
  return r = c, r;
}
export {
  y as __require
};
