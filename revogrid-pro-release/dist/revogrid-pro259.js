import { __require as p } from "./revogrid-pro294.js";
import { __require as u } from "./revogrid-pro295.js";
import { __require as _ } from "./revogrid-pro296.js";
var r, i;
function t() {
  if (i) return r;
  i = 1;
  var y = p(), s = u(), e = _(), a = e && e.isTypedArray, d = a ? s(a) : y;
  return r = d, r;
}
export {
  t as __require
};
