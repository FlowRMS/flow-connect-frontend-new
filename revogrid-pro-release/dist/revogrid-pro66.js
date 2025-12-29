/* empty css                */
import { CorePlugin as t } from "./revogrid-pro106.js";
class i extends t {
  /**
   * Providers give you access to the grid core functions like selections, data order, row/cell sizes, viewports 
   */
  constructor(r, o) {
    super(r, o), this.addEventListener(
      "beforerowrender",
      ({
        detail: e
      }) => {
        e.node.$attrs$ = {
          ...e.node.$attrs$,
          odd: e.item.itemIndex % 2 !== 0
        };
      }
    );
  }
}
export {
  i as RowOddPlugin
};
