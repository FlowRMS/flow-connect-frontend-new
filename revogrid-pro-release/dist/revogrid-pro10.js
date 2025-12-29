/* empty css                */
import { getItemByIndex as f } from "@revolist/revogrid";
import { ADDITIONAL_DATA_EVENT as p, APPLY_RANGE_EVENT as u, FOCUS_APPLY_EVENT as m, EDIT_RENDER_EVENT as S, FOCUS_BEFORE_RENDER_EVENT as v, BEFORE_CELL_RENDER_EVENT as E, RANGE_AUTOFILL_EVENT as R } from "./revogrid-pro78.js";
import { MergeCacheService as y, dataChange as w } from "./revogrid-pro109.js";
import { CorePlugin as C } from "./revogrid-pro106.js";
const h = ["cell-merge-plugin", "cell-border"];
class T extends C {
  constructor(r, t) {
    super(r, t), this.revogrid = r, this.cacheService = new y(), this.revogrid.classList.add(...h), this.setMergeConfig(), this.addEventListener(
      p,
      ({ detail: e }) => {
        this.setMergeConfig();
      }
    ), this.addEventListener(
      u,
      ({
        detail: e
      }) => this.focusRender(e)
    ), this.addEventListener(
      m,
      ({
        detail: e
      }) => this.focusRender(e)
    ), this.addEventListener(
      S,
      ({
        detail: e
      }) => this.focusRender(e)
    ), this.addEventListener(
      v,
      ({ detail: e }) => this.focusRender(e)
    ), this.addEventListener(
      E,
      (e) => this.mergeCells(e)
    ), this.addEventListener(
      R,
      (e) => {
        const { detail: n } = e;
        this.hasMergedCell(n) && e.preventDefault();
      }
    );
  }
  cacheService;
  canRangePrev = null;
  setMergeConfig() {
    const r = this.revogrid.additionalData?.cellMerge;
    this.cacheService.setMerge(r), r && (this.revogrid.additionalData.cellMerge = w(
      r,
      (t, e, n, o) => {
        this.cacheService.setMerge(o), this.revogrid.refresh();
      }
    ));
  }
  /**
   * Overrides focus range based on hidden and merged values
   */
  focusRender(r) {
    const t = this.rangeApply(r, r.range.x, r.range.y), { x: e, y: n, x1: o, y1: s } = t;
    return typeof e == "number" && (r.range.x = e), typeof o == "number" && (r.range.x1 = o), typeof n == "number" && (r.range.y = n), typeof s == "number" && (r.range.y1 = s), t;
  }
  hasMergedCell(r) {
    const t = { ...r.newRange };
    return t.x < 0 && (t.x = 0), t.y < 0 && (t.y = 0), this.cacheService.getSpans({
      rowType: r.type,
      colType: r.colType
    }, t.x, t.y);
  }
  /**
   * For range we do trick extending range area
   * But we should block range ability for merged cells
   */
  rangeApply(r, t, e) {
    t < 0 && (t = 0), e < 0 && (e = 0);
    let n = this.cacheService.getSpans(r, t, e), o = !0, s, i, l, c;
    const d = n?.hide;
    if (d) {
      const a = d;
      if (r.next) {
        const g = r.next;
        if (typeof g.x == "number" && g.x > 0 && a.colSpan)
          return c = i = a.column + a.colSpan, this.blockRange(!0), { x: c, x1: i };
        if (typeof g.y == "number" && g.y > 0 && a.rowSpan)
          return l = s = a.row + a.rowSpan, this.blockRange(!0), { y: l, y1: s };
      }
      o = !1, this.blockRange(), t = c = a.column, e = l = a.row, n = this.cacheService.getSpans(r, t, e);
    }
    return n && (typeof n.rowSpan == "number" && n.rowSpan > 1 && (s = e + n.rowSpan - 1, o = !1, this.blockRange()), typeof n?.colSpan == "number" && n.colSpan > 1 && (i = t + n.colSpan - 1, o = !1, this.blockRange())), o && this.blockRange(!0), {
      x: c,
      x1: i,
      y: l,
      y1: s,
      hide: d
    };
  }
  /**
   * Block range ability in grid or unblock it to initial if @dropBlock = true
   */
  blockRange(r = !1) {
    !r && this.canRangePrev === null && (this.canRangePrev = this.revogrid.range), r || (this.revogrid.range = !1), r && this.canRangePrev !== null && (this.revogrid.range = this.canRangePrev, this.canRangePrev = null);
  }
  checkIfMergedItemNotVisibleRequireAndCorrect(r, t, e) {
    const n = this.providers.viewport.stores[e].store, o = n.get("start"), s = n.get("items")[o], i = { ...t };
    if (s?.itemIndex === i.itemIndex && r < s?.itemIndex) {
      const l = this.providers.dimension.stores[e].getCurrentState(), c = f(l, r);
      return c && (i.start = c.start), i.itemIndex = r, i;
    }
    return null;
  }
  /**
   * UI render high level
   * Specify new sizes if visible
   */
  mergeCells(r) {
    const { detail: t } = r, e = this.cacheService.getSpans(
      t,
      t.column.itemIndex,
      t.row.itemIndex
    );
    if (e) {
      if (e?.hide) {
        const n = this.checkIfMergedItemNotVisibleRequireAndCorrect(
          e.hide.column,
          t.column,
          e.hide.colType || "rgCol"
        ), o = this.checkIfMergedItemNotVisibleRequireAndCorrect(
          e.hide.row,
          t.row,
          e.hide.rowType || "rgRow"
        );
        if (n || o) {
          n && (t.column = n), o && (t.row = o), this.mergeCells(r);
          return;
        } else {
          r.preventDefault();
          return;
        }
      }
      if (e?.rowSpan > 1 && (t.row = this.updateCellParams(t.rowType, e.rowSpan, t.row)), e?.colSpan > 1 && (t.column = this.updateCellParams(t.colType, e.colSpan, t.column)), e?.rowSpan > 1 || e?.colSpan > 1) {
        const n = r.detail.model, o = r.detail.model.column.cellProperties;
        r.detail.model = {
          ...n,
          column: {
            ...n.column,
            cellProperties(...s) {
              const i = o?.(...s) || {};
              return {
                ...{
                  merged: !0,
                  colSpan: e?.colSpan,
                  rowSpan: e?.rowSpan,
                  "aria-colspan": e?.colSpan?.toString(),
                  "aria-rowspan": e?.rowSpan?.toString()
                },
                ...i
              };
            }
          }
        };
      }
    }
  }
  /**
   * Get cell sizes to render in ui
   */
  updateCellParams(r, t, e) {
    const n = this.providers.dimension.stores[r].store, o = n.get("sizes"), s = n.get("originItemSize"), i = { ...e };
    i.size = 0;
    for (let c = 0; c < t; c++)
      i.size += o[i.itemIndex + c] || s;
    const l = n.get("realSize");
    return i.size > l && (i.size = l), i.end = i.start + i.size, i;
  }
  destroy() {
    super.destroy(), this.revogrid.classList.remove(...h);
  }
}
export {
  T as CellMergePlugin
};
