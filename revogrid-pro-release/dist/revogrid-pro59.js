/* empty css                */
import V from "./revogrid-pro115.js";
import { h as y } from "@revolist/revogrid";
import { OVERLAY_NODE as x, OVERLAY_CLEAR_NODES as b, VIRTUAL_SCROLL_EVENT as S, BEFORE_SCROLL_EVENTS as _ } from "./revogrid-pro78.js";
import { directAncestor as R } from "./revogrid-pro79.js";
import { CorePlugin as A } from "./revogrid-pro106.js";
class k extends A {
  unsubscribe = [];
  constructor(t, c) {
    super(t, c);
    const d = V(() => {
      const e = R(t, "revogr-extra");
      w(e) && e.refresh();
    }, 0), o = "rv-overlay";
    let u = 0, f = 0, p = 0, r, n;
    const E = () => {
      r && (r.style.height = `${u}px`);
    }, g = () => {
      n && (n.style.top = `${f}px`, n.style.height = `${p}px`);
    }, h = (e) => {
      n && e.dimension === "rgRow" && (n.scrollTop = e.coordinate);
    }, v = c.dimension.stores;
    this.unsubscribe.push(
      v.rgRow.store.onChange("realSize", (e) => {
        u = e, E();
      })
    );
    const L = t.registerVNode.filter(
      (e) => typeof e != "function" || e?.prototype?.name !== o
    );
    let i = /* @__PURE__ */ new Map([]);
    function m() {
      return y(
        "div",
        {
          class: { [o]: !0 },
          key: "overlay",
          ref: (e) => {
            n = e, O();
          }
        },
        [
          y(
            "div",
            {
              class: { "overlay-content": !0 },
              key: "overlay-content",
              ref: (e) => {
                r = e, E();
              }
            },
            [...i.values()]
          )
        ]
      );
    }
    m.prototype.name = o, t.registerVNode = [...L, m];
    function C(e, s) {
      const l = e.getBoundingClientRect(), N = s.getBoundingClientRect();
      l && (f = l.top - N.top, p = l.height, g());
    }
    function O() {
      const e = R(
        t,
        ".main-viewport > .viewports > .rgCol > .inner-content-table > .vertical-inner"
      );
      e && C(e, t);
    }
    this.addEventListener(
      x,
      (e) => {
        i.set(e.detail.nodeId, e.detail.vnode), d();
      }
    ), this.addEventListener(
      b,
      (e) => {
        e.detail.nodeIds.forEach((s) => i.delete(s)), d();
      }
    ), this.addEventListener(S, (e) => {
      h(e.detail);
    }), this.addEventListener(
      _,
      (e) => {
        h(e.detail);
      }
    );
  }
  destroy() {
    this.unsubscribe.forEach((t) => t()), super.destroy();
  }
}
function w(a) {
  return a?.tagName === "REVOGR-EXTRA";
}
export {
  k as OverlayPlugin
};
