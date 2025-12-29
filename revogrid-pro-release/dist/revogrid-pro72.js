/* empty css                */
import { BEFORE_CELL_RENDER_EVENT as w } from "./revogrid-pro78.js";
import { CorePlugin as h } from "./revogrid-pro106.js";
const g = ["same-value-merge-plugin", "cell-border"];
class b extends h {
  constructor(e, o) {
    super(e, o), this.revogrid = e, this.revogrid.classList.add(...g), this.addEventListener(
      w,
      (t) => this.mergeCells(t)
    );
  }
  /**
   * Handles cell rendering for merged cells
   */
  mergeCells(e) {
    const { detail: o } = e, t = o.row.itemIndex, r = o.model.column;
    if (r?.merge !== !0)
      return;
    const d = o.model, n = this.providers.data.stores[o.rowType].store, s = n.get("items"), c = n.get("source"), m = t + 1, p = s[m] !== void 0 ? c[s[m]] : void 0, a = t > 0 ? c[s[t - 1]] : void 0, u = a && d.model[r.prop] === a?.[r.prop], l = p && d.model[r.prop] === p[r.prop];
    if (u || l) {
      const E = e.detail.model.column?.cellProperties;
      e.detail.model = {
        ...e.detail.model,
        column: {
          ...e.detail.model.column,
          cellProperties(...v) {
            let i = E?.(...v) ?? {};
            return i = {
              ...i,
              "auto-merge": u && l ? "child" : l ? "main" : "last"
            }, i;
          }
        }
      };
    }
  }
  destroy() {
    super.destroy(), this.revogrid.classList.remove(...g);
  }
}
export {
  b as SameValueMergePlugin
};
