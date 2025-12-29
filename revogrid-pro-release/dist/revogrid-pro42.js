import { dispatchByEvent as a } from "@revolist/revogrid";
import { CELL_EDIT_ORIGINAL_EVENT as d } from "./revogrid-pro78.js";
const k = (o, e, i) => {
  const c = (t) => {
    const n = t.target.checked, r = {
      rgCol: e.colIndex,
      rgRow: e.rowIndex,
      type: e.type,
      prop: e.prop,
      val: n,
      preventFocus: !0
    };
    a(t, d, r);
  };
  return o("input", {
    type: "checkbox",
    checked: e.value || !1,
    onChange: c
  });
};
export {
  k as editorCheckbox
};
