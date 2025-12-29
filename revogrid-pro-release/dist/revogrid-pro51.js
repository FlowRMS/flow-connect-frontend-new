import { dispatch as n } from "@revolist/revogrid";
import { defineDropdown as d } from "./revogrid-pro41.js";
/* empty css              */
/* empty css              */
/* empty css              */
import "./revogrid-pro134.js";
import { CELL_EDIT_ORIGINAL_EVENT as l } from "./revogrid-pro78.js";
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css               */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
import "./revogrid-pro111.js";
import "./revogrid-pro112.js";
/* empty css                */
import "./revogrid-pro115.js";
/* empty css               */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
import "./revogrid-pro152.js";
/* empty css                */
import "./revogrid-pro154.js";
import "./revogrid-pro88.js";
import "./revogrid-pro119.js";
import "./revogrid-pro121.js";
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
import "./revogrid-pro162.js";
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
import "./revogrid-pro170.js";
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
/* empty css                */
const a = (i, o, c) => i("div", {
  class: "revo-dropdown-container",
  key: "editor-dropdown",
  ref: (t) => {
    if (!o.column.dropdown || !t)
      return;
    let m;
    const p = t.closest("revo-grid");
    if (p) {
      const r = p.getAttribute("theme");
      r && (m = r);
    }
    d(t, {
      ...o.column.dropdown,
      config: {
        ...o.column.dropdown.config,
        theme: m
      },
      value: o.value,
      onChange: (r) => {
        const e = {
          rgCol: o.colIndex,
          rgRow: o.rowIndex,
          type: o.type,
          prop: o.prop,
          val: r,
          preventFocus: !0
        };
        n(t, l, e);
      }
    });
  }
}), _o = {
  cellTemplate: a,
  cellProperties: (i) => ({ style: { padding: "0" }, class: { disabled: !1 } }),
  readonly: !0
};
export {
  _o as ColumnDropdown,
  a as editorDropdown
};
