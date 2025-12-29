import { dispatchByEvent as n, dispatch as r } from "@revolist/revogrid";
import { ROW_SELECT_EVENT as o, ROW_ALL_SELECT_EVENT as i } from "./revogrid-pro78.js";
class u {
  cellTemplate = (c, t) => c("input", {
    type: "checkbox",
    checked: !!t.selected,
    onClick(e) {
      e.preventDefault();
      const l = {
        ...t,
        originalEvent: e
      };
      n(e, o, l);
    }
  });
  cellProperties = () => ({
    class: "cell-checkbox"
  });
  columnProperties = () => ({
    class: "cell-checkbox"
  });
  columnTemplate = (c, t) => c("div", {
    class: "cell-header-checkbox-container"
  }, c("input", {
    ref(e) {
      e && r(e, "ref");
    },
    type: "checkbox",
    checked: !!t.allSelected,
    indeterminate: !t.allSelected && !!t.allIndeterminate,
    onClick(e) {
      if (e.preventDefault(), !(e.target instanceof HTMLInputElement))
        return;
      const l = {
        ...t,
        type: t.providers.type,
        selected: !!e.target.checked
      };
      n(e, i, l);
    }
  }));
  readonly = !0;
}
export {
  u as RowSelectColumnType
};
