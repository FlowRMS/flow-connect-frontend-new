import { columnTypes as E } from "@revolist/revogrid";
import T from "./revogrid-pro115.js";
import { getScrollbarWidth as g, directAncestor as W } from "./revogrid-pro79.js";
import { CorePlugin as x } from "./revogrid-pro106.js";
class P extends x {
  constructor(e, n) {
    if (super(e, n), this.providers = n, !e.additionalData?.stretch)
      return;
    this.config = e.additionalData.stretch;
    let o = 0, i;
    this.addEventListener(
      "beforecolumnapplied",
      ({ detail: { columns: t } }) => {
        i = t, this.applyStretch(e, t, o);
      }
    );
    const m = () => {
      o = g(document), i && (this.applyStretch(e, i, o), this.removeEventListener("scrollchange"));
    };
    this.addEventListener("scrollchange", m), this.addEventListener(
      "additionaldatachanged",
      ({ detail: t }) => {
        t?.stretch && t?.stretch !== this.config && i && (this.config = t.stretch, e.columns = [...e.columns]);
      }
    ), new ResizeObserver(() => {
      i && this.applyStretch(e, i, o);
    }).observe(e);
    const r = n.column.collection;
    o = g(document), e.columns.length && r && (i = r.columns, this.applyStretch(e, i, o));
  }
  config = "none";
  applyStretch = T(
    (e, n, o) => {
      const i = W(
        e,
        ".main-viewport > .viewports > .rowHeaders"
      )?.clientWidth || 0, m = e.clientWidth - 2 - o - i, u = E.reduce((s, c) => {
        const f = this.providers.dimension.stores[c].store;
        return s - f.get("realSize");
      }, m);
      let r, t, l = "rgCol";
      if (u <= 0)
        return;
      if (this.config === "all") {
        const s = /* @__PURE__ */ new Map();
        let c = 0, f = 0;
        for (let z in n) {
          const h = z, a = [];
          n[h].forEach((p, y) => {
            if (p.autoSize || p.size)
              return;
            const C = this.providers.dimension.stores[h].store.get("sizes")?.[y] || 0 || e.colSize || 0;
            f += C, c++, a.push(y);
          }), s.set(h, a);
        }
        if (!c)
          return;
        const w = (u + f) / c;
        s.forEach((z, h) => {
          this.providers.dimension.setCustomSizes(
            h,
            z.reduce((a, p) => (a[p] = w, a), {}),
            !0
          );
        });
      } else if (typeof this.config == "number") {
        const s = e.columns[this.config];
        if (!s || !L(s))
          return;
        r = s, l = s.pin || "rgCol", t = n[l].findIndex(
          (c) => c.prop === s.prop
        );
      } else this.config === "last" && (t = n[l].length - 1, r = n[l][t]);
      if (!r || r.autoSize || typeof t != "number")
        return;
      const S = this.providers.dimension.stores[l].store.get("sizes")?.[t] || 0 || r.size || e.colSize || 0, b = u + S - 1;
      S < b && this.providers.dimension.setCustomSizes(l, {
        [t]: b
      }, !0);
    },
    10
  );
}
function L(d) {
  return !!d.prop || !d.children;
}
export {
  P as ColumnStretchPlugin
};
