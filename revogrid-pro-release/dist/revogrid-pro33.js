import { columnTypes as l } from "@revolist/revogrid";
import { COLUMN_UPDATED_EVENT as r, ADDITIONAL_DATA_EVENT as c } from "./revogrid-pro78.js";
import { CorePlugin as a } from "./revogrid-pro106.js";
import { getColumnAttribute as C } from "./revogrid-pro80.js";
const o = "column-hidden";
class D extends a {
  hiddenColumns = /* @__PURE__ */ new Set();
  constructor(t, i) {
    super(t, i), this.initializeHiddenColumns(!0), this.observeAttribute("hide-columns", () => {
      this.initializeHiddenColumns();
    }), this.addEventListener(r, () => {
      this.initializeHiddenColumns();
    }), this.addEventListener(c, ({ detail: e }) => {
      e?.hiddenColumns && (this.hiddenColumns = new Set(e.hiddenColumns), this.updateColumnVisibility(this.hiddenColumns), this.emit("hiddencolumnsupdated", { hiddenColumns: this.hiddenColumns }));
    }), t.additionalData?.hiddenColumns && (this.hiddenColumns = new Set(t.additionalData.hiddenColumns), this.updateColumnVisibility(this.hiddenColumns), this.emit("hiddencolumnsupdated", { hiddenColumns: this.hiddenColumns }));
  }
  initializeHiddenColumns(t = !1) {
    const i = C(this.revogrid, "hide-columns");
    t && !i.length || (this.hiddenColumns = new Set(i), this.updateColumnVisibility(this.hiddenColumns), this.emit("hiddencolumnsupdated", { hiddenColumns: this.hiddenColumns }));
  }
  getIndexesWithoutTrimmed(t) {
    const i = this.providers.column.dataSources[t], e = i.store.get("proxyItems"), n = new Set(i.store.get("items")), d = i.store.get("trimmed")?.[o] || {};
    return e.filter((m, s) => n.has(s) || d[s]);
  }
  updateColumnVisibility(t) {
    l.forEach((i) => {
      const { store: e } = this.providers.column.dataSources[i], n = {}, d = e.get("source");
      this.getIndexesWithoutTrimmed(i).forEach((s, u) => {
        const h = d[s];
        t.has(h.prop) && (n[u] = !0);
      }), this.setColumnTrimmed({
        [o]: n
      }, i);
    });
  }
}
export {
  D as ColumnHidePlugin
};
