import { linearNumericSequenceStrategy as d } from "./revogrid-pro101.js";
import { dateSequenceStrategy as u } from "./revogrid-pro102.js";
import { dateSequenceWithIntervalStrategy as f } from "./revogrid-pro103.js";
import { textSequenceStrategy as h } from "./revogrid-pro104.js";
import { RANGE_AUTOFILL_EVENT as m } from "./revogrid-pro78.js";
import { getDataFromRange as y } from "./revogrid-pro105.js";
import { CorePlugin as S } from "./revogrid-pro106.js";
class I extends S {
  strategies = [];
  constructor(e, t) {
    super(e, t), this.registerStrategy(d), this.registerStrategy(u), this.registerStrategy(f), this.registerStrategy(h), this.addEventListener(m, this.onBeforeAutofill.bind(this));
  }
  /**
   * Register a new autofill strategy
   */
  registerStrategy(e) {
    this.strategies.push(e);
  }
  onBeforeAutofill(e) {
    const { detail: t } = e, { newRange: o, oldRange: r } = t, a = y(
      r,
      this.providers.data.stores[t.type].store,
      this.providers.column.stores[t.colType].store
    ), l = "both";
    for (const s of this.strategies) {
      const i = s(a, l, o);
      if (i) {
        this.applyDataToGrid(i, o, e.detail), e.preventDefault(), this.providers.selection.focusedStore?.entity.setRangeArea(o);
        break;
      }
    }
  }
  applyDataToGrid(e, t, o) {
    const r = {}, a = t.y1 - t.y + 1, l = t.x1 - t.x + 1;
    for (let s = 0; s < a; s++) {
      const i = t.y + s;
      r[i] || (r[i] = {});
      for (let n = 0; n < l; n++) {
        const p = t.x + n, c = this.providers.column.getColumn(p, o.colType);
        if (c) {
          const g = e[s % e.length][n % e[0].length];
          r[i][c.prop] = g;
        }
      }
    }
    this.providers.data.setRangeData(r, o.type);
  }
}
export {
  I as AutoFillPlugin
};
