/* empty css                */
import { dispatchByEvent as p } from "@revolist/revogrid";
import { ROW_MENU_EVENT as i, EVENT_ROW_FOCUS as f } from "./revogrid-pro78.js";
const h = ({
  showHeaderFocusBtn: e = !1,
  rowDrag: o = !1
}) => ({
  size: 80,
  // Set the column size based on fullSize.
  rowDrag: o,
  // Enable row drag.
  prop: "_revo_row_header",
  // Set the column property.
  cellProperties: () => ({
    class: "custom-row-header-cell flex row-header-holder"
  }),
  cellTemplate: (c, r) => w(c, r, e)
  // Set the cell template.
});
function u(e, o) {
  e.preventDefault(), p(e, i, o);
}
function d(e, o) {
  e.preventDefault(), p(e, f, o);
}
const w = function(e, o, l, c) {
  const {
    rowIndex: r,
    providers: { type: m }
  } = o, t = {
    ...o
  }, s = [];
  return l ? s.push(
    e(
      "button",
      {
        class: "row-menu",
        onContextMenu: (n) => u(n, t),
        onClick: (n) => u(n, t)
      },
      a(r)
    )
  ) : s.push(
    e(
      "span",
      {
        class: "row-menu",
        onMouseDown: (n) => d(n, t)
      },
      a(r)
    )
  ), [e("div", { class: "grow" }, s)];
};
function a(e, o) {
  return (e + 1).toString();
}
export {
  w as rowHeaderTemplate,
  h as rowHeaders
};
