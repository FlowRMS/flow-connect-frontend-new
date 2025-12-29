class i {
  mergeCache = {};
  /**
   * Clears the entire merge cache
   */
  clearCache() {
    this.mergeCache = {};
  }
  /**
   * Gets the current merge cache
   */
  getCache() {
    return this.mergeCache;
  }
  /**
   * Check cache for merged cells and return spans
   */
  getSpans(n, e, r) {
    const t = this.mergeCache[n.rowType]?.[r];
    if (!t)
      return null;
    const o = t[n.colType];
    if (!o)
      return null;
    const c = o.hiddenX[e];
    if (c)
      return {
        hide: c
      };
    const s = o.startY[r];
    if (!s)
      return null;
    const l = o.startX[e];
    return l ? {
      rowSpan: s,
      colSpan: l
    } : null;
  }
  /**
   * High level mapping start
   */
  setMerge(n) {
    this.clearCache(), n?.forEach((e) => {
      const r = e.rowType || "rgRow";
      let t = this.mergeCache[r];
      t || (t = this.mergeCache[r] = {}), this.setMergeRow(t, e);
    });
  }
  /**
   * Mapping for rows
   */
  setMergeRow(n, e) {
    let r = n[e.row];
    if (r || (r = n[e.row] = {}), this.setMergeCells(r, e), typeof e.rowSpan == "number" && e.rowSpan > 1) {
      r = {
        ...n[e.row + 1]
      }, this.setMergeCells(r, e, 0);
      for (let t = 1; t < e.rowSpan; t++)
        n[e.row + t] = r;
    }
  }
  /**
   * Low level mapping for cells
   */
  setMergeCells(n, e, r = 1) {
    const t = e.colType || "rgCol";
    let o = n[t];
    if (o || (o = n[t] = {
      startX: {},
      hiddenX: {},
      startY: {}
    }), e.colSpan || e.rowSpan) {
      const c = e.colSpan || 1, s = e.rowSpan || 1;
      o.startX[e.column] = c, o.startY[e.row] = s;
      for (let l = r; l < c; l++)
        o.hiddenX[e.column + l] = e;
    }
  }
}
function h(a, n) {
  return new Proxy(a, {
    set(e, r, t, o) {
      const c = e[parseInt(r.toString(), 10)] === void 0 ? "add" : "update";
      return Reflect.set(e, r, t, o), n(c, r, t, e), !0;
    },
    deleteProperty(e, r) {
      return Reflect.deleteProperty(e, r), n("delete", r, void 0, e), !0;
    }
  });
}
export {
  i as MergeCacheService,
  h as dataChange
};
