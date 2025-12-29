import { dispatchByEvent as a, getSourceItem as u } from "@revolist/revogrid";
import f from "./revogrid-pro162.js";
import { EVENT_ROW_FOCUS as m, EVENT_ROW_FOCUS_SIMPLE as v, ROW_MENU_EVENT as _, EVENT_ROW_CLICK as y, EVENT_BEFORE_CELL_FOCUS as p, EVENT_BEFORE_FOCUS_LOST as R, DRAG_START_EVENT as O, EVENT_BEFORE_RANGE as T } from "./revogrid-pro78.js";
import { rowInRange as H } from "./revogrid-pro79.js";
import { CorePlugin as S } from "./revogrid-pro106.js";
/* empty css                */
class I extends S {
  /**
   * Observable of active header selection
   */
  activeHeader = null;
  /**
   * Constructor
   *
   * @param revogrid - RevoGrid component
   * @param providers - Plugin providers
   */
  constructor(s, t) {
    super(s, t), this.addEventListener(
      m,
      (e) => this.select(e)
    ), this.addEventListener(
      v,
      ({ detail: e }) => {
        this.focusRow(e.rowIndex, e.rowType);
      }
    ), this.addEventListener(
      _,
      (e) => {
        const o = this.select(e);
        a(e, y, o);
      }
    ), this.addEventListener(
      p,
      () => this.dropHeaderSelection()
    ), this.addEventListener(
      R,
      () => this.dropHeaderSelection()
    ), this.addEventListener(O, (e) => {
      e.defaultPrevented || this.dropHeaderSelection();
    });
  }
  /**
   * Handle row selection
   *
   * @param e - CustomEvent
   * @returns Selected row details
   */
  select(s) {
    const { detail: t } = s, e = [], o = H(t);
    if (this.setHeader(t.providers), !o)
      a(s, p), this.focusRow(t.rowIndex, t.providers.type), e.push(t.model), a(s, T, [
        {
          ...t,
          type: t.providers.type
        }
      ]);
    else {
      const i = t.providers.data;
      for (let r = o.y; r <= o.y1; r++)
        e.push(u(i, r));
    }
    return {
      dataItem: t,
      models: e
    };
  }
  /**
   * Set header selection
   *
   * @param providers - Providers
   */
  setHeader(s) {
    this.activeHeader = s.selection;
  }
  /**
   * Focus row
   *
   * @param dataItem - Data item
   */
  focusRow(s, t) {
    const { column: e, selection: o } = this.providers;
    Object.values(o.stores).forEach(
      (d) => Object.values(d).forEach((c) => c.clearFocus())
    ), this.activeHeader?.set("focus", { x: 0, y: s });
    const n = o.storesByType[t];
    if (typeof n != "number")
      return;
    const i = o.stores[n], r = [];
    Object.entries(i).forEach(([d, c]) => {
      const l = parseInt(d, 10);
      r.push(l);
      const h = o.storesXToType[l];
      c.setRange(
        {
          x: 0,
          y: s
        },
        {
          x: e.getColumns(h).length - 1,
          y: s
        }
      );
    });
    const E = f(r);
    typeof E < "u" && i[E].setFocus({
      x: 0,
      y: s
    });
  }
  /**
   * Drop header selection
   */
  dropHeaderSelection() {
    this.activeHeader?.set("focus", null), this.activeHeader = null;
  }
}
export {
  I as RowHeaderPlugin
};
