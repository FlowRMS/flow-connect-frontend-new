/* empty css                */
import { rowTypes as w, REVOGRID_EVENTS as g, h as x, dispatch as u } from "@revolist/revogrid";
import * as I from "./revogrid-pro78.js";
import { AFTER_GRID_RENDER_EVENT as v, ROW_MASTER as _, BEFORE_ROW_RENDER_EVENT as S, OVERLAY_NODE as T, BEFORE_CELL_RENDER_EVENT as y, AFTER_SOURCE_EVENT as D, DRAG_START_EVENT as N, APPLY_RANGE_EVENT as L, FOCUS_APPLY_EVENT as A, EDIT_RENDER_EVENT as M, EVENT_ROW_FOCUS_SIMPLE as $, OVERLAY_CLEAR_NODES as R } from "./revogrid-pro78.js";
import { directAncestor as O, removeMultipleAndShift as P, addAndShift as V } from "./revogrid-pro79.js";
import { CorePlugin as b } from "./revogrid-pro106.js";
class H extends b {
  // {rowType:physicalIndex}
  constructor(t, s) {
    super(t, s), this.providers = s, this.config = t.additionalData?.masterRow || {};
    let r = null;
    this.addEventListener(v, () => {
      r = O(
        t,
        ".main-viewport > .viewports > .rgCol"
      );
    });
    const a = (e, i) => {
      const n = s.data.stores[i].store.get("items"), o = {
        nodeIds: []
      }, l = e.reduce((p, h) => {
        const E = h.itemIndex, m = n[E];
        return n[E - 1] === m && p.add(m), p;
      }, /* @__PURE__ */ new Set());
      this.expandedMasters.forEach((p, h) => {
        const [E, m] = h.split(":");
        if (E === i) {
          const f = parseInt(m, 10);
          l.has(f) || o.nodeIds.push(h);
        }
      }), o.nodeIds.length && u(t, R, o);
    };
    w.forEach((e) => {
      const i = s.viewport.stores[e].store.onChange(
        "items",
        (n) => {
          this.expandedMasters.size && a(n, e);
        }
      );
      this.unsubscribe.push(i);
    }), this.addEventListener(
      _,
      ({ detail: e }) => {
        const i = s.data.stores[e.type].store, n = e.rowIndex, o = i.get("items")[n], l = `${e.type}:${o}`;
        this.expandedMasters.has(l) ? this.collapseRow(e.type, [n]) : this.expandRow(e.type, n);
      }
    );
    const d = [...g.values(), ...Object.values(I)].reduce(
      (e, i) => (e[`on${i.charAt(0).toUpperCase() + i.slice(1)}`] = (n) => {
        n.stopPropagation();
      }, e),
      {}
    );
    this.addEventListener(
      S,
      (e) => {
        const i = s.data.stores[e.detail.rowType].store, n = i.get("items");
        if (this.isMasterRowExpanded(
          n,
          e.detail.rowType,
          e.detail.item.itemIndex
        )) {
          e.detail.node.$attrs$ && (e.detail.node.$attrs$.expanded = !0);
          return;
        }
        const o = this.isExpandedRow(
          n,
          e.detail.rowType,
          e.detail.item.itemIndex
        );
        if (!o)
          return;
        const l = parseInt(o.split(":")[1]), p = i.get("source")[l], h = this.config.template?.(
          x,
          {
            ...e.detail,
            model: p
          },
          {}
        );
        if (!h)
          return;
        const E = x(
          "div",
          {
            class: { "revo-master-row": !0 },
            key: o,
            style: {
              height: `${e.detail.item.size}px`,
              transform: `translateY(${e.detail.item.start}px)`
            },
            ...d,
            // Handle mouse wheel
            onWheel(f) {
              f.defaultPrevented || (u(r, "mousewheel-vertical", f), f.preventDefault());
            }
          },
          h
        );
        u(t, T, {
          nodeId: o,
          vnode: E
        });
      }
    ), this.addEventListener(
      y,
      (e) => {
        this.isExpandedRow(
          this.providers.data.stores[e.detail.rowType].store.get("items"),
          e.detail.rowType,
          e.detail.row.itemIndex
        ) && e.preventDefault();
      }
    );
    const c = () => {
      const e = {
        nodeIds: [...this.expandedMasters.keys()]
      }, i = s.data.stores, n = /* @__PURE__ */ new Map();
      w.forEach((o) => {
        const p = i[o].store.get("items"), h = p.filter((E, m) => this.getExpandedId(o, m, p[E + 1]) ? (n.has(o) || n.set(o, []), n.get(o).push(m), !1) : !0);
        (n.get(o)?.length || 0) > 0 && i[o].setData({ items: h });
      }), n.forEach((o, l) => {
        this.clearDimensions(l, o);
      }), this.expandedMasters.clear(), u(t, R, e);
    };
    this.addEventListener(D, () => {
      c();
    }), this.addEventListener(N, () => {
      c();
    }), this.addEventListener(
      L,
      (e) => this.focusRender(e)
    ), this.addEventListener(
      A,
      (e) => this.focusRender(e)
    ), this.addEventListener(
      M,
      (e) => this.focusRender(e)
    );
  }
  unsubscribe = [];
  config;
  // Store expanded master rows
  expandedMasters = /* @__PURE__ */ new Set();
  /**
   * Overrides focus range based on hidden and merged values
   */
  focusRender(t) {
    const s = t.detail;
    s.range.y === s.range.y1 && this.isExpandedRow(
      this.providers.data.stores[t.detail.rowType].store.get("items"),
      s.rowType,
      s.range.y
    ) && (t.preventDefault(), u(this.revogrid, $, {
      rowType: s.rowType,
      rowIndex: s.range.y
    }));
  }
  isMasterRowExpanded(t, s, r) {
    const a = t[r], d = t[r + 1];
    return this.getExpandedId(s, a, d);
  }
  isExpandedRow(t, s, r) {
    const a = t[r], d = t[r - 1];
    return this.getExpandedId(s, a, d);
  }
  /**
   * This method checks if a row is expanded by verifying two conditions:
   * 1. The row's ID (nodeId) is present in the expandedMasters collection.
   * 2. The physical row index (physRowIndex) is the same as the neighoring physical row index (sibPhysRowIndex).
   */
  getExpandedId(t, s, r) {
    const a = `${t}:${s}`;
    return this.expandedMasters.has(a) && s === r ? a : null;
  }
  clearDimensions(t, s) {
    if (this.config.rowHeight) {
      const r = this.providers.dimension.stores[t].store, a = P(
        r.get("sizes"),
        s.reduce((d, c) => (d.add(c + 1), d), /* @__PURE__ */ new Set())
      );
      this.providers.dimension.setCustomSizes(t, a);
    }
  }
  collapseRow(t, s) {
    const r = this.providers.data.stores[t];
    let d = [...r.store.get("items")];
    const c = {
      nodeIds: []
    };
    s.forEach((e) => {
      const i = d[e], n = `${t}:${i}`;
      this.expandedMasters.delete(n), c.nodeIds.push(n);
    }), d = d.filter((e, i) => !s.includes(i - 1)), u(this.revogrid, R, c), r.setData({ items: d, proxyItems: d }), this.clearDimensions(t, s), this.providers.dimension.setData(d.length, t);
  }
  expandRow(t, s) {
    const r = this.providers.data.stores[t], a = [...r.store.get("items")], d = a[s], c = `${t}:${d}`;
    if (this.expandedMasters.add(c), a.splice(s + 1, 0, d), r.setData({ items: a, proxyItems: a }), this.config.rowHeight) {
      let e = this.providers.dimension.stores[t].store.get("sizes");
      e = V(e, s + 1, this.config.rowHeight), this.providers.dimension.setCustomSizes(t, e);
    }
    this.providers.dimension.setData(a.length, t);
  }
  destroy() {
    this.unsubscribe.forEach((t) => t()), super.destroy();
  }
}
export {
  H as MasterRowPlugin
};
