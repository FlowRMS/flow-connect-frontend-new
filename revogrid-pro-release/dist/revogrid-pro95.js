import { jsx as n } from "./revogrid-pro118.js";
import { useState as d, useMemo as R } from "./revogrid-pro121.js";
/* empty css                */
import j from "./revogrid-pro214.js";
import A from "./revogrid-pro215.js";
import E from "./revogrid-pro216.js";
import { commonAggregators as B } from "./revogrid-pro5.js";
import { DimensionsPanel as F } from "./revogrid-pro96.js";
import { DropZone as x } from "./revogrid-pro97.js";
import { ValueSelector as G } from "./revogrid-pro98.js";
import { PIVOT_CONFIG_EN as Z } from "./revogrid-pro99.js";
const se = ({
  dimensions: y = [],
  columns: b = [],
  rows: N = [],
  values: O = [],
  i18n: c = Z,
  showColumns: T = !0,
  showRows: V = !0,
  showValues: M = !0,
  onUpdateColumns: g,
  onUpdateRows: i,
  onUpdateValues: u
} = {}) => {
  const w = y.reduce(
    (e, r) => (e[r.prop] = r, e),
    {}
  ), H = (e) => w[e]?.aggregators ?? B, [a, h] = d([...b]), [t, f] = d([...N]), [l, p] = d([
    ...O
  ]), [D, I] = d(null), L = R(
    () => (e) => t.includes(e) || a.includes(e) || l.some((r) => r.prop === e),
    [t, a, l]
  ), P = (e, r) => {
    if (r) {
      if (!L(e)) {
        const s = [...t, e];
        f(s), i && i(s);
      }
    } else {
      if (t.includes(e)) {
        const s = t.filter((o) => o !== e);
        f(s), i && i(s);
      }
      if (a.includes(e)) {
        const s = a.filter((o) => o !== e);
        h(s), g && g(s);
      }
      if (l.some((s) => s.prop === e)) {
        const s = l.filter((o) => o.prop !== e);
        p(s), u && u(s);
      }
    }
  }, v = (e, r, s) => {
    I({ source: e, index: r, prop: s });
  }, S = (e) => {
    e.preventDefault();
  }, C = (e) => {
    e.preventDefault();
  }, _ = (e) => {
    if (!D) return;
    const { source: r, prop: s } = D;
    if (r === e) {
      I(null);
      return;
    }
    switch (r) {
      case "rows": {
        const o = t.filter((m) => m !== s);
        f(o), i?.(o);
        break;
      }
      case "columns": {
        const o = a.filter((m) => m !== s);
        h(o), g?.(o);
        break;
      }
      case "values": {
        const o = l.filter((m) => m.prop !== s);
        p(o), u?.(o);
        break;
      }
    }
    if (e === "rows" && !t.includes(s)) {
      const o = [...t, s];
      f(o), i?.(o);
    } else if (e === "columns" && !a.includes(s)) {
      const o = [...a, s];
      h(o), g?.(o);
    } else if (e === "values" && !l.find((o) => o.prop === s)) {
      const o = [
        ...l,
        {
          prop: s,
          aggregator: Object.keys(H(s))[0]
        }
      ];
      p(o), u?.(o);
    }
    I(null);
  }, k = (e, r) => {
    if (e === "columns") {
      const s = [...a];
      s.splice(r, 1), h(s), g && g(s);
    } else if (e === "rows") {
      const s = [...t];
      s.splice(r, 1), f(s), i && i(s);
    } else if (e === "values") {
      const s = [...l];
      s.splice(r, 1), p(s), u && u(s);
    }
  };
  return /* @__PURE__ */ n("div", { className: "text-sm flex flex-col gap-3 grow", children: [
    /* @__PURE__ */ n(
      F,
      {
        dimensions: y,
        draggingItem: D,
        onDragStart: (e, r) => v("dimensions", e, r),
        isSelected: L,
        onCheckboxChange: P
      }
    ),
    /* @__PURE__ */ n("div", { className: "panels-container flex flex-col gap-1 max-h-80", children: [
      V && /* @__PURE__ */ n(
        x,
        {
          title: /* @__PURE__ */ n("span", { children: [
            /* @__PURE__ */ n("span", { dangerouslySetInnerHTML: { __html: j } }),
            c.rows
          ] }),
          panel: "rows",
          items: t,
          dimensions: w,
          i18n: c,
          placeholder: c.dragHereRows,
          onRemove: (e) => k("rows", e),
          onDrop: _,
          onDragOver: S,
          onDragEnter: C,
          onItemDragStart: (e, r) => v("rows", e, r)
        }
      ),
      T && /* @__PURE__ */ n(
        x,
        {
          title: /* @__PURE__ */ n("span", { children: [
            /* @__PURE__ */ n("span", { dangerouslySetInnerHTML: { __html: A } }),
            c.columns
          ] }),
          panel: "columns",
          items: a,
          dimensions: w,
          i18n: c,
          placeholder: c.dragHereColumns,
          onRemove: (e) => k("columns", e),
          onDrop: _,
          onDragOver: S,
          onDragEnter: C,
          onItemDragStart: (e, r) => v("columns", e, r)
        }
      ),
      M && /* @__PURE__ */ n(
        x,
        {
          title: /* @__PURE__ */ n("span", { children: [
            /* @__PURE__ */ n("span", { dangerouslySetInnerHTML: { __html: E } }),
            c.values
          ] }),
          panel: "values",
          items: l.map((e) => e.prop),
          dimensions: w,
          i18n: c,
          placeholder: c.dragHereValues,
          onRemove: (e) => k("values", e),
          onDrop: _,
          onDragOver: S,
          onDragEnter: C,
          onItemDragStart: (e, r) => v("values", e, r),
          renderItem: (e, r) => {
            if (!r) return;
            const s = H(r.prop);
            return /* @__PURE__ */ n("span", { className: "flex items-center gap-1", children: [
              r.name ?? r.prop,
              /* @__PURE__ */ n(
                G,
                {
                  aggregators: Object.keys(s),
                  value: l.find((o) => o.prop === r.prop)?.aggregator,
                  onUpdateValue: (o) => {
                    const m = [...l];
                    m[e].aggregator = o, p(m), u?.(m);
                  }
                }
              )
            ] });
          }
        }
      )
    ] })
  ] });
};
export {
  se as PivotConfigurator
};
