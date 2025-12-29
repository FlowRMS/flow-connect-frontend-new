/* empty css                */
import { h as v } from "@revolist/revogrid";
import E from "./revogrid-pro115.js";
import w from "./revogrid-pro183.js";
import { OrderHandler as R } from "./revogrid-pro184.js";
import { rowInRange as y } from "./revogrid-pro79.js";
import { getTopRelative as S, getRow as O } from "./revogrid-pro185.js";
import { DRAG_EVENT as T, DRAG_START_EVENT as x, DATA_RENDER_EVENT as b, BEFORE_ROW_RENDER_EVENT as _, SCROLL_EVENT as N, BEFORE_CELL_RENDER_EVENT as I, MOVE_EVENT as L, DRAG_END_EVENT as A, DRAG_INPROGRESS_EVENT as M, ORDER_CHANGED_EVENT as C } from "./revogrid-pro78.js";
import { draggableRender as V } from "./revogrid-pro186.js";
import { extendTemplates as P, defaultTemplate as k } from "./revogrid-pro80.js";
import { CorePlugin as U } from "./revogrid-pro106.js";
const h = "dragging", p = "rv-drag-plugin";
class X extends U {
  orderUi;
  staticDragData = null;
  rowOrderService;
  dragData = null;
  rowMoveFunc = E((t) => {
    if (!this.staticDragData)
      return;
    const r = this.dragData = this.getData(this.staticDragData);
    if (!r)
      return;
    const s = S(t.y, r);
    this.orderUi?.moveTip(t), this.orderUi.autoscroll(s, r.elRect.height);
    const e = this.rowOrderService.move(t, r);
    e !== null && (this.emit(T, e), this.orderUi.showHandler(
      e.end + r.yOffset,
      r.gridRect.height
    ));
  }, 5);
  localSubscriptions = {};
  trimmedRows = /* @__PURE__ */ new Set();
  highlightedRows = [];
  config;
  constructor(t, r) {
    super(t, r), t.canDrag = !1, this.orderUi = new R();
    const s = this.revogrid.registerVNode.filter(
      (e) => typeof e == "object" && !e.$attrs$?.[p]
    );
    this.revogrid.registerVNode = [
      ...s,
      this.orderUi.render(v, p)
    ], this.config = t.additionalData?.rowOrder || {}, this.localSubscriptions.mouseleave = {
      target: document,
      callback: (e) => this.onMouseOut(e)
    }, this.localSubscriptions.mouseup = {
      target: document,
      callback: (e) => this.onMouseUp(e)
    }, this.localSubscriptions.mousemove = {
      target: document,
      callback: (e) => this.move(e)
    }, this.addEventListener(
      x,
      ({ detail: e }) => this.dragStart(e)
    ), this.addEventListener(b, () => {
      this.trimmedRows.size && this.clearHighlight();
    }), this.addEventListener(
      _,
      (e) => {
        if (!this.trimmedRows.size)
          return;
        const i = this.getKey(e.detail.rowType, e.detail.item.itemIndex), o = e.detail.node.$attrs$;
        this.trimmedRows.has(i) && !o[h] ? o[h] = !0 : o[h] && (o[h] = !1);
      }
    ), this.addEventListener(N, () => this.dragData = null), this.addEventListener(I, ({ detail: e }) => {
      const i = e.model.column;
      (i?.rowDrag || typeof i?.rowDrag == "function" && i.rowDrag(e.model)) && (e.model.column = {
        ...i,
        cellTemplate: P(
          V,
          k(i.cellTemplate)
        )
      });
    }), this.rowOrderService = new w({
      dimension: r.dimension,
      orderStart: (e) => this.orderStart(e),
      positionChanged: (e, i) => this.onPositionChanged(e, i)
    });
  }
  /**
   * Drop trigger event
   */
  onMouseOut(t) {
    this.clearOrder();
  }
  /**
   * Final event
   */
  onMouseUp(t) {
    this.dragData && this.rowOrderService.endOrder(t, this.dragData), this.clearOrder();
  }
  /**
   * Initial event when drag begins
   */
  dragStart({ originalEvent: t, model: r }) {
    t.preventDefault(), this.clearOrder();
    const { mouseleave: s, mouseup: e, mousemove: i } = this.localSubscriptions;
    s.target.addEventListener("mouseleave", s.callback), e.target.addEventListener("mouseup", e.callback);
    const o = t.target.closest("revogr-data"), a = t.target.closest(".vertical-inner");
    !o || !a || (this.staticDragData = {
      dataItem: r,
      dataEl: o,
      scrollEl: a,
      gridEl: this.revogrid,
      items: /* @__PURE__ */ new Map()
    }, this.dragData = this.getData(this.staticDragData), this.rowOrderService.start(t), i.target.addEventListener("mousemove", i.callback));
  }
  /**
   * Initial row move
   */
  move(t) {
    this.emit(L, { ...t }), this.rowMoveFunc(t);
  }
  clearOrder() {
    this.trimClear(), this.clearHighlight(), this.clearLocalSubscriptions(), this.rowOrderService.clear(), this.dragData = null, this.emit(A), this.orderUi.stop();
  }
  /**
   * Start grid reordering
   */
  orderStart(t) {
    if (!this.dragData || !this.staticDragData)
      return;
    const { range: r, items: s, trimmed: e } = this.getActive(this.dragData.dataItem);
    this.highlightedRows = [...e.keys()].flatMap((l) => {
      const c = this.getDataFromKey(l), g = this.revogrid.querySelectorAll(
        `:not(revo-grid) revogr-data[type="${c.type}"] .rgRow[data-rgrow="${c.index}"]`
      );
      return g.forEach((m) => m.setAttribute(h, "true")), [...g.values()];
    }), this.providers.selection.clearAll(), this.trimmedRows = e, this.staticDragData.items = s;
    const i = {
      x: 0,
      y: r.from
    };
    this.rowOrderService.startOrder(i);
    const o = O(t.y, this.dragData);
    if (this.emit(M, {
      cell: i,
      pos: o,
      event: t
    }).defaultPrevented) {
      this.clearOrder();
      return;
    }
    const n = this.config?.prop;
    let d = "";
    if (n) {
      const l = [...this.staticDragData.items.values()].find(
        (c) => c[n]
      );
      l && (d = `${l[n]}`, this.staticDragData.items.size > 1 && (d += ` + ${this.staticDragData.items.size - 1}`));
    }
    this.orderUi.start(t, this.dragData, d);
  }
  getItemsFromStore(t, r) {
    const s = this.providers.data.stores[r].store, e = s.get("items"), i = s.get("source"), o = /* @__PURE__ */ new Map();
    for (let a = t.from; a <= t.to; a++) {
      const n = e[a];
      o.set(n, i[n]);
    }
    return o;
  }
  /**
   * Change happened
   * Call updates
   */
  onPositionChanged(t, r) {
    if (!this.staticDragData)
      return;
    const s = this.staticDragData.items || /* @__PURE__ */ new Map(), e = r.to - (r.from < r.to ? s.size - 1 : 0), i = {
      ...this.staticDragData,
      ...r,
      to: e,
      items: this.staticDragData.items || /* @__PURE__ */ new Map(),
      originalEvent: t
    };
    if (this.emit(C, i).defaultPrevented || r.from === r.to)
      return;
    const a = this.providers.data.stores[r.type], n = [...a.store.get("items")], d = [...n], l = n.splice(r.from, s.size);
    n.splice(e, 0, ...l), this.providers.dimension.updateSizesPositionByNewDataIndexes(
      r.type,
      n,
      d
    );
    const c = [...a.store.get("proxyItems")], g = c.filter(
      (f) => !s.has(f)
    ), m = c.indexOf(d[r.from]), u = c.indexOf(d[r.to]), D = u - (m < u ? s.size - 1 : 0);
    g.splice(
      D,
      0,
      ...s.keys()
    ), a.setData({ proxyItems: g });
  }
  /**
   * Aggregate data for farther usage
   */
  getData({
    gridEl: t,
    dataEl: r,
    scrollEl: s,
    dataItem: e
  }) {
    const i = t.getBoundingClientRect(), o = r.getBoundingClientRect();
    return {
      el: r,
      elScroll: s,
      elRect: o,
      gridRect: i,
      dataItem: e,
      type: e.providers.type,
      yOffset: o.top - i.top,
      rows: this.providers.dimension.stores.rgRow.getCurrentState(),
      cols: this.providers.dimension.stores.rgCol.getCurrentState()
    };
  }
  clearLocalSubscriptions() {
    for (const [t, { target: r, callback: s }] of Object.entries(
      this.localSubscriptions
    ))
      r.removeEventListener(t, s);
  }
  /**
   * Clearing local subscription
   */
  clearSubscriptions() {
    super.clearSubscriptions(), this.clearLocalSubscriptions();
  }
  clearHighlight() {
    this.highlightedRows.forEach((t) => t.removeAttribute(h)), this.highlightedRows = [];
  }
  trimClear() {
    const t = /* @__PURE__ */ new Map();
    this.trimmedRows.forEach((r) => {
      const { type: s, index: e } = this.getDataFromKey(r);
      t.has(s) || t.set(s, /* @__PURE__ */ new Set()), t.get(s)?.add(e);
    }), this.trimmedRows.clear();
  }
  getActive(t, r = t.providers.type) {
    let s = {
      from: t.rowIndex,
      to: t.rowIndex
    };
    const e = /* @__PURE__ */ new Set(), i = y(t);
    if (i) {
      s = {
        from: i.y,
        to: i.y1
      };
      for (let a = i.y; a <= i.y1; a++)
        e.add(this.getKey(r, a));
    }
    const o = this.getItemsFromStore(s, r);
    return e.size || e.add(this.getKey(r, t.rowIndex)), {
      range: s,
      items: o,
      trimmed: e
    };
  }
  getKey(t, r) {
    return `${t}_${r}`;
  }
  getDataFromKey(t) {
    const r = t.split("_");
    return {
      type: r[0],
      index: parseInt(r[1], 10)
    };
  }
}
export {
  X as RowOrderPlugin
};
