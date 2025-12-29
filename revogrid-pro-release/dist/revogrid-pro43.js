import { dispatchByEvent as g } from "@revolist/revogrid";
import { CELL_EDIT_ORIGINAL_EVENT as D } from "./revogrid-pro78.js";
/* empty css                */
const E = (e, t, I) => {
  const a = t.column?.min ?? 0, u = t.column?.max ?? 100, s = t.column?.step ?? 1, n = t.value ?? a, d = t.column?.hideValue ?? !1, i = (o, p) => {
    const v = Math.min(Math.max(p, a), u), x = {
      rgCol: t.colIndex,
      rgRow: t.rowIndex,
      type: t.type,
      prop: t.prop,
      val: v,
      preventFocus: !0
    };
    g(o, D, x);
  }, m = (o) => {
    o.stopPropagation(), i(o, n - s);
  }, b = (o) => {
    o.stopPropagation(), i(o, n + s);
  }, l = n <= a, r = n >= u, c = [
    e("button", {
      class: {
        "revo-counter-button": !0,
        "revo-counter-button-disabled": l
      },
      onMouseDown: (o) => {
        o.stopPropagation();
      },
      onClick: m,
      disabled: l,
      type: "button"
    }, "-")
  ];
  return d || c.push(e("span", { class: "revo-counter-value" }, n.toString())), c.push(
    e("button", {
      class: {
        "revo-counter-button": !0,
        "revo-counter-button-disabled": r
      },
      onClick: b,
      disabled: r,
      type: "button"
    }, "+")
  ), e("div", { class: "revo-counter" }, c);
};
export {
  E as editorCounter
};
