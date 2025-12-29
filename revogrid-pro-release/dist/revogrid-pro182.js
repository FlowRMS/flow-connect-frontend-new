import { EXPAND_ICON as c } from "./revogrid-pro39.js";
const f = (l, d, t = {}, a) => function(o, p) {
  const { rowIndex: n } = p;
  if (typeof t.hideExpand == "function" ? t.hideExpand(n, a(n)) : t.hideExpand)
    return o("div", { class: { "cell-expand": !0 } });
  const r = d(n), s = o(
    "span",
    {
      onMouseDown: (e) => e.preventDefault(),
      onDblClick: (e) => e.preventDefault(),
      onClick: (e) => {
        e.preventDefault(), l(n);
      },
      class: { "expand-toggle": !0 }
    },
    c
  );
  return o(
    "div",
    {
      class: {
        "cell-expand": !0
      },
      expanded: r
    },
    s
  );
};
export {
  f as ExpandCellTemplate
};
