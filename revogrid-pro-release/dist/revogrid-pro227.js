import { __require as u } from "./revogrid-pro222.js";
var r, n;
function o() {
  if (n) return r;
  n = 1;
  var i = u();
  function e(t) {
    return typeof t == "function" ? t : i;
  }
  return r = e, r;
}
export {
  o as __require
};
