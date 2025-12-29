import { dispatchByEvent as n } from "@revolist/revogrid";
import r from "./revogrid-pro188.js";
import e from "./revogrid-pro189.js";
import l from "./revogrid-pro190.js";
import { CELL_EDIT_SAVE_EVENT as p, CELL_EDIT_CANCEL_EVENT as a, CELL_EDIT_EVENT as s } from "./revogrid-pro78.js";
const u = {
  // The cellTemplate function for the editorRowActionColumn. It renders a button with an edit icon.
  cellProperties: (t) => ({
    ...t,
    onDblClick: (o) => {
      o.preventDefault();
    }
  }),
  cellTemplate: (t, o) => t("button", {
    class: "edit-row-action",
    innerHTML: l,
    onMouseDown: (i) => {
      i.stopPropagation();
    },
    onClick: (i) => {
      i.stopPropagation(), n(i, s, o);
    }
  }),
  // The editor function for the editorRowActionColumn. It renders a button with a save icon and a cancel icon.
  editor: () => ({
    render(t) {
      return [
        t("button", {
          class: "edit-row-action",
          innerHTML: r,
          onMouseUp: (o) => {
            o.stopPropagation();
          },
          onClick: (o) => {
            n(o, p, this.editCell);
          }
        }),
        t("button", {
          class: "edit-row-action",
          innerHTML: e,
          onMouseUp: (o) => {
            o.stopPropagation();
          },
          onClick: (o) => {
            n(o, a, this.editCell);
          }
        })
      ];
    }
  })
};
export {
  u as editorRowActionColumn
};
