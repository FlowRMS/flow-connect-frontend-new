import { dispatchByEvent as r } from "@revolist/revogrid";
import { DRAG_START_EVENT as a } from "./revogrid-pro78.js";
function d(e, o, t) {
  return e(
    "span",
    {
      class: "revo-draggable",
      onMouseDown: (n) => {
        r(n, a, {
          originalEvent: n,
          model: o
        });
      }
    },
    [e("span", { class: "revo-drag-icon" })]
  );
}
export {
  d as draggableRender
};
