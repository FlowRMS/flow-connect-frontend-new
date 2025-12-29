/* empty css                */
import { getSourceItem as D } from "@revolist/revogrid";
import { ADDITIONAL_DATA_EVENT as F, BEFORE_ROW_SOURCE_SET_EVENT as _, BEFORE_CELL_RENDER_EVENT as x, ORDER_CHANGED_EVENT as P, BEFORE_ROW_RENDER_EVENT as C, ROW_SELECT_EVENT as L, TREE_ROW_SELECT_EVENT as N, TREE_BEFORE_PARENT_CHANGE_EVENT as O } from "./revogrid-pro78.js";
import { extendTemplates as y, defaultTemplate as A } from "./revogrid-pro80.js";
import { TreeCellTemplate as V } from "./revogrid-pro187.js";
import { CorePlugin as S } from "./revogrid-pro106.js";
const R = "tree-collapsed";
class H extends S {
  idField = "id";
  parentIdField = "parentId";
  rootParentId;
  expandedRowIds = /* @__PURE__ */ new Set();
  /**
   * Stores computed tree metadata for each row keyed by the row's id.
   */
  metaData = /* @__PURE__ */ new Map();
  constructor(s, a) {
    super(s, a);
    let l = s.additionalData?.tree, h = !1;
    this.setConfig(l), this.addEventListener(F, ({ detail: t }) => {
      l !== t.tree && (l = t.tree, this.setConfig(l), h = !0, this.updateTree());
    }), this.addEventListener(_, ({ detail: t }) => {
      t.type === "rgRow" && (h = !0, this.updateTree());
    }), this.addEventListener(x, ({ detail: t }) => {
      const n = t.model.column;
      n?.tree && (t.model = {
        ...t.model,
        column: {
          ...n,
          cellTemplate: y(
            V(
              (d) => this.toggleRowExpanded(d),
              (d) => this.getMeta(d)
            ),
            A(n.cellTemplate)
          )
        }
      });
    }), this.addEventListener("aftersortingapply", () => {
      h = !0, this.updateTree();
    }), this.addEventListener("afterfilterapply", () => {
      h = !0, this.updateTree();
    }), this.addEventListener(P, (t) => {
      t.defaultPrevented || this.handleRowDrop(t);
    }), this.addEventListener(C, (t) => {
      const { detail: n } = t, { store: d } = this.providers.data.stores[n.rowType], c = d.get("source"), o = d.get("items")[n.item.itemIndex], e = c[o];
      if (e) {
        const r = e[this.idField];
        this.metaData.get(r)?.expanded && n.node.$attrs$ && (n.node.$attrs$.expanded = !0);
      }
    }), this.addEventListener(L, (t) => {
      const { detail: n } = t, d = a.data.stores[n.type], c = d.store.get("source"), p = d.store.get("items")[n.rowIndex], e = c[p][this.idField], r = this.getAllDescendantPhysicalIndices(e);
      if (r.length > 0) {
        const i = {
          type: n.type,
          parentIndex: p,
          childrenIndices: r,
          originalEvent: n.originalEvent
        };
        this.emit(N, i), t.preventDefault();
      }
    }), setTimeout(() => {
      s.source.length && !h && (h = !0, this.updateTree());
    }, 0);
  }
  setConfig(s = {}) {
    this.idField = s.idField || "id", this.parentIdField = s.parentIdField || "parentId", this.rootParentId = s.rootParentId !== void 0 ? s.rootParentId : "", this.expandedRowIds = s.expandedRowIds || /* @__PURE__ */ new Set();
  }
  /**
   * Returns the computed tree metadata for the given row.
   */
  getMeta(s) {
    const a = s[this.idField];
    return this.metaData.get(a) || {
      level: 0,
      expanded: !1,
      hasChildren: !1,
      visible: !0,
      parentId: this.rootParentId
    };
  }
  /**
   * Recomputes the tree metadata for every row in the original data and builds a trimmed map.
   * Call this method after the original data/order/visibility/set changes
   *
   * This method builds a parent→children mapping (without modifying the original data) and then
   * recursively computes for each row:
   *  - its level (indentation),
   *  - whether it is expanded (based on the expandedRowIds set),
   *  - whether it has children,
   *  - and whether it should be visible (i.e. none of its ancestors are collapsed).
   *
   * The trimmed map is then applied via providers.data.setTrimmed().
   */
  updateTree() {
    const { store: s } = this.providers.data.stores.rgRow, a = s.get("source"), l = s.get("proxyItems"), { [R]: h, ...t } = s.get("trimmed"), n = Object.entries(t).reduce(
      (e, [r, i]) => ({
        ...e,
        ...i
      }),
      {}
    ), d = /* @__PURE__ */ new Map();
    l.forEach((e) => {
      const r = a[e], i = r[this.parentIdField] ?? this.rootParentId;
      d.has(i) || d.set(i, []), d.get(i).push({ row: r, physIndex: e });
    }), this.metaData.clear();
    let c = [];
    const p = (e, r, i, m) => {
      const E = d.get(e);
      if (!E) return;
      const T = i && m;
      E.forEach(({ row: w, physIndex: f }) => {
        c.push(f);
        const u = w[this.idField], I = this.expandedRowIds.has(u), v = (d.get(u)?.length ?? 0) > 0, g = T && !n[f];
        this.metaData.set(u, {
          level: r,
          expanded: I,
          hasChildren: v,
          visible: g,
          parentId: e
        }), p(u, r + 1, g, I);
      });
    };
    p(this.rootParentId, 0, !0, !0), l.forEach((e) => {
      const i = a[e][this.idField];
      if (!this.metaData.has(i)) {
        c.push(e);
        const m = this.expandedRowIds.has(i);
        this.metaData.set(i, {
          level: 0,
          expanded: m,
          hasChildren: !1,
          visible: !0,
          parentId: this.rootParentId
        });
      }
    });
    const o = {};
    c.forEach((e) => {
      const r = a[e], i = this.metaData.get(r[this.idField]);
      return i && !i.visible ? (o[e] = !0, !1) : !0;
    }), this.providers.data.setTrimmed({ [R]: o }, "rgRow"), this.providers.data.stores.rgRow.setData({
      proxyItems: c
    });
  }
  /**
   * Toggle the expanded state for a row and then re-calculate tree metadata.
   */
  toggleRowExpanded(s) {
    const a = s[this.idField];
    this.expandedRowIds.has(a) ? this.expandedRowIds.delete(a) : this.expandedRowIds.add(a), this.updateTree();
  }
  /**
   * Handles row drag-and-drop events by updating the parent id for moved rows.
   * After the parent is updated, the tree metadata is re-calculated.
   */
  async handleRowDrop(s) {
    const { from: a, to: l, type: h, items: t } = s.detail, { store: n } = this.providers.data.stores[h], d = (o) => {
      const e = (r, i) => {
        if (r === i) return !0;
        const m = this.metaData.get(i)?.parentId;
        return !m || m === this.rootParentId ? !1 : e(r, m);
      };
      return [...t.values()].some(
        (r) => e(r[this.idField], o)
      );
    }, c = a < l ? l : l - 1;
    let p = this.rootParentId;
    if (c >= 0) {
      const o = D(n, c);
      if (o) {
        const e = o[this.idField];
        if (this.expandedRowIds.has(e) ? p = e : o[this.parentIdField] && (p = o[this.parentIdField]), d(p)) {
          s.preventDefault();
          return;
        }
      }
    }
    for (let o = 0; o < t.size; o++) {
      const e = t.get(o), r = {
        ...s.detail.dataItem,
        rowIndex: a + o,
        model: e,
        prop: this.parentIdField,
        val: p
      }, i = this.emit(O, r);
      i.defaultPrevented || this.providers.data.setCellData(i.detail);
    }
    setTimeout(() => {
      this.updateTree();
    }, 0);
  }
  /**
   * Gets all descendant row IDs (children, grandchildren, etc.) for a given row
   * @param rowId - The ID of the row to get descendants for
   * @returns Array of physical indices of all descendant rows
   */
  getAllDescendantPhysicalIndices(s) {
    const { store: a } = this.providers.data.stores.rgRow, l = a.get("source"), h = [], t = (n) => {
      l.forEach((d, c) => {
        d[this.parentIdField] === n && (h.push(c), t(d[this.idField]));
      });
    };
    return t(s), h;
  }
}
export {
  H as TreeDataPlugin
};
