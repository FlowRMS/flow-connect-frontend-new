import { __require as n } from "./revogrid-pro269.js";
var e, r;
function p() {
  if (r) return e;
  r = 1;
  var t = n();
  function a(u) {
    return function(i) {
      return t(i, u);
    };
  }
  return e = a, e;
}
export {
  p as __require
};
