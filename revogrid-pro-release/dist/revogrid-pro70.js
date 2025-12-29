/* empty css                */
import a from "./revogrid-pro170.js";
import { pivotColumns as l } from "./revogrid-pro94.js";
import { createPivotData as p } from "./revogrid-pro93.js";
import { definePivotConfigurator as v } from "./revogrid-pro71.js";
import { PIVOT_CFG_UPDATE_EVENT as n } from "./revogrid-pro78.js";
import { CorePlugin as h } from "./revogrid-pro106.js";
const m = "pivot-plugin", s = "pivot-grid";
class y extends h {
  pivotData = [];
  pivotColumns = [];
  pivotConfig = null;
  pivotConfigElement;
  pivotOriginalData = [];
  pivotOriginalColumns = [];
  currentTheme = "default";
  isApplyingPivot = !1;
  constructor(t, e) {
    super(t, e), t.parentElement?.classList.add(m);
    let i = t.additionalData?.pivot;
    this.addEventListener("additionaldatachanged", ({ detail: o }) => {
      a(i, o.pivot) || (i = o.pivot, this.updateConfigurator(i), this.applyPivot(i));
    }), this.addEventListener("afterthemechanged", (o) => this.setTheme(o.detail)), this.addEventListener("aftersourceset", ({ detail: o }) => {
      !this.pivotConfig || this.isApplyingPivot || o.source !== this.pivotData && (this.pivotOriginalData = o.source, this.applyPivot(this.pivotConfig));
    }), this.addEventListener("aftercolumnsset", ({ detail: o }) => {
      if (!this.pivotConfig || this.isApplyingPivot) return;
      const r = this.revogrid.columns;
      r !== this.pivotColumns && (this.pivotOriginalColumns = r, this.applyPivot(this.pivotConfig));
    }), setTimeout(() => {
      this.updateConfigurator(i), this.applyPivot(i), this.setTheme(t.theme);
    }, 0);
  }
  setTheme(t = "default") {
    this.currentTheme = t, this.revogrid.parentElement?.setAttribute("data-theme", this.currentTheme), this.pivotConfigElement?.setAttribute("data-theme", this.currentTheme);
  }
  createConfiguratorElement(t) {
    let e;
    if (t.mountTo) {
      if (!(t.mountTo instanceof Element)) {
        console.error("Invalid mountTo element specified in pivot configuration");
        return;
      }
      e = this.pivotConfigElement = t.mountTo;
    } else {
      const i = this.revogrid.parentElement;
      i && (e = this.pivotConfigElement = document.createElement("div"), i.prepend(this.pivotConfigElement), i.classList.add(s), this.setTheme(this.revogrid.theme));
    }
    return e;
  }
  updateConfigurator(t) {
    if (!t?.hasConfigurator) {
      this.revogrid.parentElement?.classList.remove(s), this.pivotConfigElement?.remove(), this.pivotConfigElement = void 0;
      return;
    }
    this.pivotConfigElement || this.createConfiguratorElement(t), this.pivotConfigElement && v(this.pivotConfigElement, t, {
      onUpdateColumns: (e) => {
        const i = this.emit(n, {
          ...this.pivotConfig,
          columns: e
        });
        i.defaultPrevented || this.applyPivot(i.detail);
      },
      onUpdateRows: (e) => {
        const i = this.emit(n, {
          ...this.pivotConfig,
          rows: e
        });
        i.defaultPrevented || this.applyPivot(i.detail);
      },
      onUpdateValues: (e) => {
        const i = this.emit(n, {
          ...this.pivotConfig,
          values: [...e]
        });
        i.defaultPrevented || this.applyPivot(i.detail);
      }
    });
  }
  /**
   * Apply a pivot configuration to the grid.
   */
  applyPivot(t) {
    if (!t) {
      this.pivotConfig && this.clearPivot();
      return;
    }
    this.pivotConfig || (this.pivotOriginalData = this.revogrid.source, this.pivotOriginalColumns = this.revogrid.columns), this.pivotConfig = t;
    const e = this.pivotOriginalData;
    this.pivotData = p(e, t), this.isApplyingPivot = !0;
    try {
      this.revogrid.columns = this.pivotColumns = l(t, this.pivotOriginalData), this.revogrid.source = this.pivotData;
    } finally {
      this.isApplyingPivot = !1;
    }
  }
  /**
   * Clear the pivot view and restore the original data.
   */
  clearPivot() {
    this.revogrid.parentElement?.classList.remove(s);
    const t = this.pivotOriginalColumns || this.pivotConfig?.columns?.map((e) => ({ name: e, prop: e }));
    this.pivotData = [], this.pivotColumns = [], this.pivotConfig = null, this.renderOriginalGrid(t), this.pivotOriginalColumns = [], this.pivotOriginalData = [];
  }
  /**
   * Restore the original grid state.
   */
  async renderOriginalGrid(t = []) {
    this.isApplyingPivot = !0;
    try {
      this.pivotData = this.revogrid.source = this.pivotOriginalData, this.pivotColumns = this.revogrid.columns = t;
    } finally {
      this.isApplyingPivot = !1;
    }
  }
}
export {
  y as PivotPlugin,
  p as createPivotData,
  l as pivotColumns
};
