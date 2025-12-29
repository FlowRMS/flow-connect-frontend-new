import { __module as e } from "./revogrid-pro317.js";
import { __require as l } from "./revogrid-pro237.js";
e.exports;
var a;
function v() {
  return a ? e.exports : (a = 1, (function(o, t) {
    var s = l(), n = t && !t.nodeType && t, r = n && !0 && o && !o.nodeType && o, f = r && r.exports === n, i = f && s.process, p = (function() {
      try {
        var u = r && r.require && r.require("util").types;
        return u || i && i.binding && i.binding("util");
      } catch {
      }
    })();
    o.exports = p;
  })(e, e.exports), e.exports);
}
export {
  v as __require
};
