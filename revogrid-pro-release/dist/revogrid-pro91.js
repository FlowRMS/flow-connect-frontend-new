import { dispatchByEvent as o } from "@revolist/revogrid";
import { ROW_MASTER as n } from "./revogrid-pro78.js";
const s = {
  size: 30,
  readonly: !0,
  cellProperties: () => ({
    class: "cell-expand"
  }),
  cellTemplate: (t, r) => t(
    "button",
    {
      class: {
        "expand-button": !0
      },
      onMouseDown(e) {
        e.preventDefault();
      },
      onClick(e) {
        o(e, n, r);
      }
    }
  )
};
export {
  s as EXPAND_COLUMN
};
