import { dispatchByEvent as l } from "@revolist/revogrid";
import { COLUMN_UPDATED_EVENT as f, EVENT_HEADER_FOCUS as h, EVENT_BEFORE_CELL_FOCUS as d, EVENT_BEFORE_FOCUS_LOST as m, EVENT_COLUMN_SELECTION as v } from "./revogrid-pro78.js";
import { CorePlugin as y } from "./revogrid-pro106.js";
class _ extends y {
  // Store current active header, null if not active
  activeHeader = null;
  /**
   * Constructor for ColumnSelectionPlugin
   * @param revogrid - The Grid element
   * @param providers - The Plugin providers
   */
  constructor(t, e) {
    super(t, e), this.addEventListener(f, this.onColumnUpdated), this.addEventListener(h, this.onHeaderFocus), this.addEventListener(d, this.dropHeaderSelection), this.addEventListener(m, this.dropHeaderSelection);
  }
  /**
   * Handle column updates
   * @param e - CustomEvent with column collection
   */
  onColumnUpdated = (t) => {
    const e = this.activeHeader;
    if (e)
      for (const n in t.detail.columns.columns) {
        const o = n;
        if (!Object.prototype.hasOwnProperty.call(t.detail.columns.columns, o))
          continue;
        const s = t.detail.columns.columns[o];
        for (let r = 0; r < s.length; r++)
          if (s[r].prop === e.prop) {
            e.store.set("focus", { x: r, y: 0 }), this.applyHeaderSelection({
              store: e.store,
              prop: e.prop,
              index: r,
              type: o
            });
            break;
          }
      }
  };
  /**
   * Handle header focus
   * @param e - CustomEvent with template prop
   */
  onHeaderFocus = (t) => {
    const {
      detail: { prop: e, index: n, providers: o }
    } = t;
    typeof e == null || l(t, v).defaultPrevented || (l(t, d), this.applyHeaderSelection({
      store: o.selection,
      index: n,
      prop: e,
      type: o.type
    }));
  };
  /**
   * Apply header selection
   * @param param0 - Object with selection store, index, prop and type
   */
  applyHeaderSelection({
    store: t,
    index: e,
    prop: n,
    type: o
  }) {
    if (o === "rowHeaders")
      return;
    const { selection: s, data: r } = this.providers;
    this.activeHeader = {
      store: t,
      prop: n
    };
    for (const i of Object.values(s.stores))
      for (const c of Object.values(i))
        c.clearFocus();
    this.activeHeader?.store.set("focus", { x: e, y: 0 });
    const a = s.storesByType[o];
    typeof a == "number" && Object.entries(s.stores).forEach(([i, c]) => {
      const p = c[a], u = s.storesYToType[parseInt(i, 10)], E = r.stores[u].store.get("items");
      p.setRange(
        {
          x: e,
          y: 0
        },
        {
          x: e,
          y: E.length - 1
        }
      );
    });
  }
  /**
   * Clear header focus
   */
  dropHeaderSelection = () => {
    this.activeHeader?.store.set("focus", null), this.activeHeader = null;
  };
}
export {
  _ as ColumnSelectionPlugin
};
