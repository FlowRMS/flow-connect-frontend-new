/* empty css                */
import { getSourceItem as h, columnTypes as g } from "@revolist/revogrid";
import m from "./revogrid-pro115.js";
import { ROW_AUTO_SIZE_CONFIG_UPDATE_EVENT as f } from "./revogrid-pro78.js";
import { CorePlugin as p } from "./revogrid-pro106.js";
const r = 24, E = 200, C = 10, u = "revo-row-autosize";
class I extends p {
  constructor(t, i) {
    super(t, i), this.revogrid = t, this.providers = i, this.revogrid.classList.add(u), this.config = t.additionalData?.rowAutoSize || {}, this.config.preciseSize && (this.calculationElement = this.createCalculationElement(), t.appendChild(this.calculationElement));
    let n = !1, o = !1;
    this.addEventListener("aftersourceset", () => {
      e();
    }), this.addEventListener("afteredit", ({ detail: s }) => {
      this.handleEdit(s);
    }), this.addEventListener("aftergridrender", () => {
      n = !0, o && e();
    });
    const e = () => {
      if (o = !0, !n) return;
      const s = this.providers.viewport.stores.rgRow.store.get("items");
      if (!s?.length) return;
      const { store: c } = this.providers.data.stores.rgRow, l = [];
      s.forEach((a) => {
        l[a.itemIndex] = h(c, a.itemIndex);
      }), this.calculateHeights(l);
    };
    this.addEventListener("viewportscroll", m(() => {
      e();
    }, C)), this.addEventListener(
      "additionaldatachanged",
      ({ detail: s }) => {
        s?.rowAutoSize ? (this.config = s.rowAutoSize, this.heightCache.clear(), e()) : (this.heightCache.clear(), this.pendingCalculations.clear());
      }
    );
  }
  config;
  heightCache = /* @__PURE__ */ new Map();
  calculationElement = null;
  pendingCalculations = /* @__PURE__ */ new Set();
  async calculateHeights(t) {
    if (!this.providers.column.getColumns()) return;
    const n = {}, o = [];
    for (let e = 0; e < t.length; e++) {
      const s = t[e];
      if (!s || this.pendingCalculations.has(e)) continue;
      if (this.heightCache.has(e)) {
        n[e] = this.heightCache.get(e);
        continue;
      }
      this.pendingCalculations.add(e);
      const c = this.calculateRowHeight(s).then((l) => {
        this.heightCache.set(e, l), n[e] = l, this.pendingCalculations.delete(e);
      });
      o.push(c);
    }
    await Promise.all(o), Object.keys(n).length > 0 && (this.emit(f, n), this.providers.dimension.setCustomSizes("rgRow", n, !0));
  }
  async calculateRowHeight(t) {
    if (this.config.calculateHeight) {
      const n = await this.config.calculateHeight(t, this.providers.column.getColumns() || []);
      return this.clampHeight(n);
    }
    let i = r;
    return g.forEach((n) => {
      const { store: o } = this.providers.column.dataSources[n], e = o.get("source");
      o.get("items").forEach((s) => {
        const c = e[s];
        if (!c || typeof c.prop > "u") return;
        const l = t[c.prop];
        if (l == null || typeof l > "u") return;
        const a = this.getColumnWidth(n, s), d = this.calculateContentHeight(l.toString(), c, a);
        i = Math.max(i, d);
      });
    }), this.clampHeight(i);
  }
  calculateContentHeight(t, i, n) {
    if (this.config.preciseSize && this.calculationElement)
      return this.calculatePreciseHeight(t, i);
    const o = t.split(`
`), e = Math.floor(n / 8);
    let s = 0;
    for (const c of o)
      s += Math.ceil(c.length / e);
    return Math.max(r, s * 20);
  }
  getColumnWidth(t, i) {
    return this.providers.dimension.stores[t].store.get("sizes")?.[i] || 0 || this.revogrid.colSize || 100;
  }
  calculatePreciseHeight(t, i) {
    return this.calculationElement ? (this.calculationElement.style.width = `${i.size || this.revogrid.colSize || 100}px`, this.calculationElement.hidden = !1, this.calculationElement.innerText = t, this.calculationElement.scrollHeight + 8) : r;
  }
  clampHeight(t) {
    const i = this.config.minHeight || r, n = this.config.maxHeight || E;
    return Math.min(Math.max(t, i), n);
  }
  handleEdit(t) {
    const { store: i } = this.providers.data.stores.rgRow;
    if (i.get("items").length) {
      if ("rowIndex" in t) {
        const o = [], e = t.rowIndex;
        this.heightCache.delete(e), o[e] = h(i, e), this.calculateHeights(o);
      } else if ("newRange" in t) {
        const o = [];
        Object.keys(t.data).forEach((e) => {
          const s = parseInt(e);
          this.heightCache.delete(s), o[s] = h(i, s);
        }), this.calculateHeights(o);
      }
    }
  }
  createCalculationElement() {
    const t = document.createElement("div"), i = {};
    return Object.assign(t.style, i), t;
  }
  destroy() {
    super.destroy(), this.revogrid.classList.remove(u), this.calculationElement?.remove(), this.heightCache.clear(), this.pendingCalculations.clear();
  }
}
export {
  I as RowAutoSizePlugin
};
