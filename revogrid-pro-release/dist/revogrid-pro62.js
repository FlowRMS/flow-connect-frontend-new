/* empty css                */
import { h as R } from "@revolist/revogrid";
import w from "./revogrid-pro115.js";
import { EVENT_BEFORE_SORTING as u, BEFORE_FILTER_EVENT as g, AFTER_FILTER_EVENT as v, EVENT_AFTER_SORTING as _, AFTER_SOURCE_SET_EVENT as L, ADDITIONAL_DATA_EVENT as T, BEFORE_ROW_RENDER_EVENT as y, BEFORE_CELL_RENDER_EVENT as S, ROW_EXPAND as A, ROW_COLLAPSE as N, ROW_EXPAND_ALL as P, ROW_COLLAPSE_ALL as C, APPLY_RANGE_EVENT as O, FOCUS_APPLY_EVENT as D, EDIT_RENDER_EVENT as I } from "./revogrid-pro78.js";
import { extendTemplates as F, defaultTemplate as V } from "./revogrid-pro80.js";
import { ExpandCellTemplate as k } from "./revogrid-pro182.js";
import { CorePlugin as $ } from "./revogrid-pro106.js";
import { overrideEvents as b } from "./revogrid-pro81.js";
class j extends $ {
  // Store physical indices of expanded rows
  expandedPhysicalRows = /* @__PURE__ */ new Set();
  config = {};
  constructor(t, d) {
    super(t, d);
    let i = t.additionalData?.rowExpand, a = !1;
    this.setConfig(i), setTimeout(() => {
      !a && t.source.length && n(this.config.expandedRows ?? /* @__PURE__ */ new Set());
    }, 100);
    let r;
    const n = w((e) => {
      this.applyDefaultExpandedRows(e), a = !0, this.expandedPhysicalRows = new Set(e), r = void 0;
    }, 150);
    this.addEventListener(u, ({ detail: e }) => {
      r || (r = new Set(this.expandedPhysicalRows)), this.collapseAllRows();
    }), this.addEventListener(g, ({ detail: e }) => {
      r || (r = new Set(this.expandedPhysicalRows)), this.collapseAllRows();
    }), this.addEventListener(v, ({ detail: e }) => {
      n(r ?? /* @__PURE__ */ new Set());
    }), this.addEventListener(_, ({ detail: e }) => {
      n(r ?? /* @__PURE__ */ new Set());
    }), this.addEventListener(L, ({ detail: e }) => {
      e.type === "rgRow" && (a || n(this.config.expandedRows ?? /* @__PURE__ */ new Set()));
    }), this.addEventListener(T, ({ detail: e }) => {
      i !== e.rowExpand && (i = e.rowExpand, this.collapseAllRows(), this.setConfig(i));
    });
    const l = b({
      onMouseUp: () => t.clearFocus()
    });
    this.addEventListener(y, (e) => {
      const { detail: s } = e;
      if (!this.isExpandedRowContent(s.item.itemIndex))
        return;
      const o = this.providers.data.stores.rgRow.store, h = o.get("items"), E = h[s.item.itemIndex];
      if (this.expandedPhysicalRows.has(E) && s.node.$attrs$ && (s.node.$attrs$.expanded = !0), e.detail.colType !== "rgCol") return;
      const f = s.item.itemIndex - 1, m = o.get("source")[h[f]], x = R(
        "div",
        {
          class: { "revo-expanded-row": !0 },
          ...l
        },
        [
          this.config.template ? this.config.template(R, { ...s, model: m, physIndex: E }) : "No content"
        ]
      );
      s.node.$children$ = [x];
    });
    const p = (e) => {
      const s = this.providers.data.stores.rgRow.store.get("items");
      return this.expandedPhysicalRows.has(s[e]);
    }, c = (e) => {
      const s = this.providers.data.stores.rgRow.store;
      return s.get("source")[s.get("items")[e]];
    };
    this.addEventListener(S, ({ detail: e }) => {
      const s = e.model.column;
      s?.expand && (e.model = {
        ...e.model,
        column: {
          ...s,
          cellTemplate: F(
            k(
              (o) => this.toggleRowExpanded(o),
              p,
              this.config,
              c
            ),
            V(s.cellTemplate)
          )
        }
      });
    }), this.addEventListener(A, (e) => {
      this.expandRow(e.detail.rowIndex);
    }), this.addEventListener(N, (e) => {
      this.collapseRow(e.detail.rowIndex);
    }), this.addEventListener(P, () => {
      this.expandAllRows();
    }), this.addEventListener(C, () => {
      this.collapseAllRows();
    }), this.addEventListener(
      O,
      (e) => this.focusRender(e)
    ), this.addEventListener(
      D,
      (e) => this.focusRender(e)
    ), this.addEventListener(
      I,
      (e) => this.focusRender(e)
    );
  }
  setConfig(t = {}) {
    this.config = t;
  }
  /**
   * Check if this is an expanded row's content
   */
  isExpandedRowContent(t) {
    const d = this.providers.data.stores.rgRow.store.get("items");
    return t > 0 && d[t] === d[t - 1];
  }
  focusRender(t) {
    this.isExpandedRowContent(t.detail.range.y) && t.preventDefault();
  }
  /**
   * Helper function to shift size indexes when adding or removing rows
   * @param sizes The sizes object to modify
   * @param startIndex The index where the shift begins
   * @param shift The amount to shift by (positive for expansion, negative for collapse)
   */
  shiftSizeIndexes(t, d, i) {
    const a = Object.keys(t).map(Number), r = Math.max(...a);
    if (i > 0)
      for (let n = r; n >= d; n--)
        t[n] !== void 0 && (t[n + i] = t[n], delete t[n]);
    else {
      const n = t[d - 1];
      for (let l = d; l <= r; l++)
        t[l + 1] !== void 0 ? t[l] = t[l + 1] : delete t[l];
      n !== void 0 && (t[d - 1] = n);
    }
  }
  /**
   * Central handler for all row expansion operations
   * @param config Configuration for the expansion operation
   */
  handleExpansion(t) {
    const i = [...this.providers.data.stores.rgRow.store.get("items")], a = this.config.expandedRowHeight !== void 0 ? { ...this.providers.dimension.stores.rgRow.store.get("sizes") } : null, r = this.providers.selection.focused;
    let n = !1;
    const l = (e, s) => {
      const o = i[e], h = this.expandedPhysicalRows.has(o);
      return r?.y === e + 1 && (n = !0), !t.skipStateCheck && s === h ? 0 : s ? (this.expandedPhysicalRows.add(o), i.splice(e + 1, 0, o), a && this.config.expandedRowHeight !== void 0 && (this.shiftSizeIndexes(a, e + 1, 1), a[e + 1] = this.config.expandedRowHeight), 1) : (this.expandedPhysicalRows.delete(o), i.splice(e + 1, 1), a && this.shiftSizeIndexes(a, e + 1, -1), -1);
    };
    let p = 0;
    switch (t.target.type) {
      case "multiple": {
        const e = [...t.target.rowIndexes];
        t.operation === "collapse" ? e.sort((s, o) => o - s) : e.sort((s, o) => s - o), e.forEach((s) => {
          const o = t.operation === "expand" || t.operation === "toggle" && !this.expandedPhysicalRows.has(i[s + p]);
          p += l(
            s + (o ? p : 0),
            o
          );
        });
        break;
      }
      case "all": {
        const e = new Set(i);
        if (t.operation === "collapse")
          for (let s = i.length - 1; s >= 0; s--) {
            const o = i[s];
            this.expandedPhysicalRows.has(o) && l(s - 1, !1);
          }
        else
          i.forEach((s, o) => {
            !this.expandedPhysicalRows.has(s) && e.has(s) && (p += l(o + p, !0));
          });
        break;
      }
    }
    const { store: c } = this.providers.data.stores.rgRow;
    c.set("items", i), a && this.providers.dimension.setCustomSizes("rgRow", a), this.providers.dimension.setData(i.length, "rgRow"), n && this.providers.selection.clearAll();
  }
  /**
   * Expand a specific row
   */
  expandRow(t) {
    this.handleExpansion({
      operation: "expand",
      target: { type: "multiple", rowIndexes: [t] }
    });
  }
  /**
   * Collapse a specific row
   */
  collapseRow(t) {
    this.handleExpansion({
      operation: "collapse",
      target: { type: "multiple", rowIndexes: [t] }
    });
  }
  /**
   * Toggle row expansion state
   */
  toggleRowExpanded(t) {
    this.handleExpansion({
      operation: "toggle",
      target: { type: "multiple", rowIndexes: [t] }
    });
  }
  /**
   * Expand all rows
   */
  expandAllRows() {
    this.handleExpansion({
      operation: "expand",
      target: { type: "all" }
    });
  }
  /**
   * Collapse all rows
   */
  collapseAllRows() {
    this.handleExpansion({
      operation: "collapse",
      target: { type: "all" }
    });
  }
  /**
   * Apply default expanded state from config
   */
  applyDefaultExpandedRows(t) {
    if (!t?.size) return;
    const d = [];
    this.providers.data.stores.rgRow.store.get("items").forEach((i, a) => {
      t.has(i) && d.push(a);
    }), this.handleExpansion({
      operation: "expand",
      target: {
        type: "multiple",
        rowIndexes: d
      },
      skipStateCheck: !0
      // Force expansion regardless of current state
    });
  }
}
export {
  j as RowExpandPlugin
};
