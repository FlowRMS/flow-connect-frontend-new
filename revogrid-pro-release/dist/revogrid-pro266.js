import { __require as p } from "./revogrid-pro304.js";
import { __require as v } from "./revogrid-pro305.js";
var t, a;
function q() {
  if (a) return t;
  a = 1;
  var i = p(), o = v(), u = Object.prototype, n = u.hasOwnProperty;
  function _(r) {
    if (!i(r))
      return o(r);
    var s = [];
    for (var e in Object(r))
      n.call(r, e) && e != "constructor" && s.push(e);
    return s;
  }
  return t = _, t;
}
export {
  q as __require
};
