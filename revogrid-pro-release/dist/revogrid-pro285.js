import { __require as _ } from "./revogrid-pro310.js";
import { __require as o } from "./revogrid-pro311.js";
import { __require as a } from "./revogrid-pro241.js";
var e, r;
function n() {
  if (r) return e;
  r = 1;
  var s = _(), t = o(), i = a();
  function l(u) {
    return s(u, i, t);
  }
  return e = l, e;
}
export {
  n as __require
};
