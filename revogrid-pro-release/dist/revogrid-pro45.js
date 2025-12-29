/* empty css                */
import { CELL_EDIT_EVENT as E, CELL_EDIT_CANCEL_EVENT as s, CELL_EDIT_SAVE_EVENT as p, BEFORE_CELL_RENDER_EVENT as u } from "./revogrid-pro78.js";
import { CorePlugin as c } from "./revogrid-pro106.js";
import { mergeCellProperties as m } from "./revogrid-pro80.js";
import "@revolist/revogrid";
function a(l, t) {
  return `${l}_${t}`;
}
class C extends c {
  editingRow = null;
  // Store the index of the row being edited
  rowEditedModel = {};
  constructor(t, d) {
    super(t, d), this.addEventListener(
      E,
      (e) => {
        this.editingRow = a(e.detail.type, e.detail.rowIndex), t.clearFocus(), t.refresh();
      }
    ), this.addEventListener(
      s,
      () => {
        this.editingRow = null, this.rowEditedModel = {}, t.refresh();
      }
    ), this.addEventListener(p, (e) => {
      let r = this.providers.data.getModel(e.detail.rowIndex, e.detail.type) || {};
      Object.keys(this.rowEditedModel).forEach((o) => {
        r[o] = this.rowEditedModel[o];
      }), this.providers.data.stores[e.detail.type].setSourceData(
        { [e.detail.rowIndex]: r },
        !0
      ), this.rowEditedModel = {}, this.editingRow = null, t.refresh();
    }), this.addEventListener(u, (e) => {
      if (e.detail.model.column.readonly !== !0 && this.editingRow !== null && a(e.detail.model.type, e.detail.model.rowIndex) === this.editingRow) {
        const r = e.detail.model.column, o = r.cellProperties;
        e.detail.model = {
          ...e.detail.model,
          column: {
            ...r,
            cellProperties: m(o, (n) => ({
              "row-edit": !0
            })),
            // Override cell template to render editor
            cellTemplate: this.renderEditorTemplate(r, e.detail.model)
          }
        };
      }
    }), this.addEventListener("beforekeyup", (e) => {
      e.detail.original.key === "Escape" && this.emit(s);
    });
  }
  // Function to render the editor template for a given column
  renderEditorTemplate(t, d) {
    const e = h(t, this.revogrid.editors);
    return (r, o) => {
      const n = o.value ?? o.model?.[o.column.prop];
      return r(
        "div",
        {
          class: "edit-row-cell",
          onMouseDown: (i) => i.stopPropagation()
        },
        [
          r("revogr-edit", {
            editor: e,
            column: d,
            editCell: {
              ...o,
              val: n
            },
            onFocusout: (i) => {
              (i.target instanceof HTMLInputElement || i.target instanceof HTMLTextAreaElement) && (this.rowEditedModel[o.prop] = i.target.value);
            },
            onCelledit: (i) => {
              i.stopPropagation(), this.rowEditedModel[i.detail.prop] = i.detail.val;
            },
            onCloseedit: (i) => {
              i.stopPropagation();
            }
          })
        ]
      );
    };
  }
}
function h(l, t = {}) {
  const d = l?.editor;
  if (d)
    return typeof d == "string" ? t[d] : d;
}
export {
  C as RowEditPlugin
};
