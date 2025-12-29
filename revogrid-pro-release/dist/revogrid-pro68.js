/* empty css                */
import { rowTypes as m, getSourcePhysicalIndex as f, columnTypes as p } from "@revolist/revogrid";
import { ROW_SELECT_EVENT as _, ROW_ALL_SELECT_EVENT as L, BEFORE_HEADER_RENDER_EVENT as g, BEFORE_CELL_RENDER_EVENT as N, BEFORE_ROW_RENDER_EVENT as v, TREE_ROW_SELECT_EVENT as C, ROW_SELECTED_EVENT as O } from "./revogrid-pro78.js";
import { extendTemplates as E, defaultColumnTemplate as y, defaultTemplate as R } from "./revogrid-pro80.js";
import { RowSelectColumnType as u } from "./revogrid-pro92.js";
import { CorePlugin as P } from "./revogrid-pro106.js";
const B = "selected";
class M extends P {
  lastSelectedIndex;
  selected;
  constructor(h, c) {
    super(h, c), this.selected = /* @__PURE__ */ new Map(), m.forEach((t) => {
      this.selected.set(t, /* @__PURE__ */ new Set());
    });
    const a = new u(), T = () => {
      let t = !0, e = !1, s = 0, l = 0;
      return this.selected.forEach((n, o) => {
        l += n.size, c.data.stores[o].store.get("items").forEach((d) => {
          n.has(d) && (e = !0, s++), n.has(d) || (t = !1);
        });
      }), {
        isSelected: t,
        anySelected: e,
        visibleSelectedItems: s,
        allSelectedItems: l
      };
    }, r = () => {
      const t = T();
      this.emit(O, {
        selected: this.selected,
        count: t.allSelectedItems,
        allRowsCount: m.reduce(
          (e, s) => e + c.data.stores[s].store.get("proxyItems").length,
          0
        ),
        visibleCount: t.visibleSelectedItems,
        visibleRowsCount: m.reduce(
          (e, s) => e + c.data.stores[s].store.get("items").length,
          0
        )
      });
    };
    this.addEventListener("afterfilterapply", () => {
      r();
    }), this.addEventListener(_, (t) => {
      if (t.defaultPrevented)
        return;
      const { detail: e } = t, s = this.selected.get(e.type);
      if (!s)
        return;
      const l = e.originalEvent.shiftKey, n = c.data.stores[e.type], o = f(n.store, e.rowIndex);
      if (l && this.lastSelectedIndex !== void 0) {
        const i = this.lastSelectedIndex, d = Math.min(i, o), w = Math.max(i, o);
        for (let S = d; S <= w; S++)
          s.add(S);
        this.lastSelectedIndex = o;
      } else
        s.has(o) ? (s.delete(o), this.lastSelectedIndex = void 0) : (s.add(o), this.lastSelectedIndex = o);
      r(), p.forEach((i) => {
        const { store: d } = c.viewport.stores[i];
        d.set("items", [...d.get("items")]);
      });
    }), this.addEventListener(L, ({ detail: t }) => {
      this.lastSelectedIndex = void 0, m.forEach((e) => {
        const s = this.selected.get(e);
        if (!s)
          return;
        c.data.stores[e].store.get("items").forEach((n) => {
          t.selected ? s.add(n) : s.delete(n);
        });
      }), r(), p.forEach((e) => {
        const { store: s } = c.viewport.stores[e];
        s.set("items", [...s.get("items")]);
      });
    });
    const I = (...t) => {
      const e = T();
      return t[1].allSelected = e.isSelected, t[1].allIndeterminate = e.anySelected, "";
    }, x = (...t) => {
      const e = c.data.stores[t[1].providers.type], s = f(e.store, t[1].rowIndex), l = this.selected.get(t[1].type)?.has(s);
      return t[1].selected = !!l, "";
    };
    this.addEventListener(g, (t) => {
      const e = t.detail.data;
      e.columnType && h.columnTypes?.[e.columnType] instanceof u ? t.detail.data = {
        ...a,
        ...e,
        columnTemplate: E(
          I,
          y(e.columnTemplate)
        )
      } : e.rowSelect && (t.detail.data = {
        ...a,
        ...e,
        columnTemplate: E(
          I,
          a.columnTemplate,
          y(e.columnTemplate)
        )
      });
    }), this.addEventListener(N, ({ detail: t }) => {
      let e = t.model.column;
      e.columnType && h.columnTypes?.[e.columnType] instanceof u ? e = {
        ...e,
        cellTemplate: E(
          x,
          R(e.cellTemplate)
        )
      } : e.rowSelect && !(typeof e.rowSelect == "function" && !e.rowSelect(t.model)) && (e = {
        ...a,
        ...e,
        cellTemplate: E(
          x,
          a.cellTemplate,
          R(e.cellTemplate)
        )
      }), t.model = {
        ...t.model,
        column: e
      };
    }), this.addEventListener(v, ({ detail: t }) => {
      const e = c.data.stores[t.rowType], s = f(e.store, t.item.itemIndex), l = this.selected.get(t.rowType)?.has(s);
      t.node.$attrs$ = {
        ...t.node.$attrs$,
        selected: !!l
      };
    }), this.addEventListener(C, ({ detail: t }) => {
      const e = this.selected.get(t.type);
      if (!e)
        return;
      !e.has(t.parentIndex) ? (e.add(t.parentIndex), t.childrenIndices.forEach((l) => e.add(l))) : (t.childrenIndices.forEach(
        (l) => e.delete(l)
      ), e.delete(t.parentIndex)), r(), p.forEach((l) => {
        const { store: n } = c.viewport.stores[l];
        n.set("items", [...n.get("items")]);
      });
    });
  }
  /**
   * Returns physical selected row indexes
   */
  getSelectedIndexes() {
    return this.selected;
  }
}
export {
  B as DEFAULT_SEL_PROP,
  u as RowSelectColumnType,
  M as RowSelectPlugin
};
