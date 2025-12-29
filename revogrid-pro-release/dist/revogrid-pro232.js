import { __require as s } from "./revogrid-pro251.js";
import { __require as y } from "./revogrid-pro252.js";
import { __require as a } from "./revogrid-pro248.js";
import { __require as q } from "./revogrid-pro250.js";
var e, o;
function b() {
  if (o) return e;
  o = 1;
  var i = s(), t = y(), u = a(), p = q();
  function _(r) {
    return u(r) ? i(p(r)) : t(r);
  }
  return e = _, e;
}
export {
  b as __require
};
