import { dispatchByEvent as g } from "@revolist/revogrid";
import { CELL_EDIT_ORIGINAL_EVENT as f } from "./revogrid-pro78.js";
import { getThresholdClasses as p } from "./revogrid-pro127.js";
/* empty css                */
const $ = (s, e, y) => {
  const l = e.column?.min ?? 0, a = e.column?.max ?? 100, i = e.column?.step ?? 1, n = e.value ?? l, d = (n - l) / (a - l) * 100, u = e.column?.hideValue ?? !1, m = p(n, e.column), r = Object.entries(m).filter(([t, o]) => o).map(([t]) => t).join(" "), v = (t) => {
    const o = parseFloat(t.target.value), h = {
      rgCol: e.colIndex,
      rgRow: e.rowIndex,
      type: e.type,
      prop: e.prop,
      val: o,
      preventFocus: !0
    };
    g(t, f, h);
  }, c = [
    s("div", { class: `revo-slider-container ${r}` }, [
      s("div", {
        class: "revo-slider-fill",
        style: { width: `${d}%` }
      }),
      s("input", {
        class: "revo-slider-input",
        type: "range",
        min: l,
        max: a,
        step: i,
        value: n,
        onChange: v,
        onMouseDown: (t) => {
          t.stopPropagation();
        }
      }),
      // Render threshold markers
      ...(e.column?.thresholds ?? []).map((t) => {
        const o = (t.value - l) / (a - l) * 100;
        return s("div", {
          class: `revo-slider-threshold ${t.className}`,
          style: {
            left: `${o}%`
          }
        });
      })
    ])
  ];
  return u || c.push(s("span", {
    class: `revo-slider-value ${r}`
  }, n)), s("div", { class: "revo-slider" }, c);
};
export {
  $ as editorSlider
};
