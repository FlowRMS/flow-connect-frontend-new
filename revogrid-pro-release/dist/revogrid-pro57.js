/* empty css                */
import { h as u } from "@revolist/revogrid";
import { LOADER_EVENT as r } from "./revogrid-pro78.js";
import { CorePlugin as l } from "./revogrid-pro106.js";
class f extends l {
  constructor(e, o) {
    super(e, o);
    let s;
    const i = u(
      "div",
      {
        class: { loader: !0 },
        ref: (t) => {
          s = t;
        }
      }
    );
    e.registerVNode = [...e.registerVNode, i], this.addEventListener(r, ({ detail: t }) => {
      s && (t ? s.classList.add("busy") : s.classList.remove("busy"));
    });
  }
  busy(e) {
    this.emit(r, e);
  }
}
export {
  f as LoaderPlugin
};
