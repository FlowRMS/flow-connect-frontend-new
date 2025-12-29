import { __require as t } from "./revogrid-pro336.js";
import { __require as h } from "./revogrid-pro272.js";
import { __require as u } from "./revogrid-pro287.js";
var r, a;
function C() {
  if (a) return r;
  a = 1;
  var e = t(), i = h(), _ = u();
  function s() {
    this.size = 0, this.__data__ = {
      hash: new e(),
      map: new (_ || i)(),
      string: new e()
    };
  }
  return r = s, r;
}
export {
  C as __require
};
