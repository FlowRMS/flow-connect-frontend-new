import { CorePlugin as i } from "./revogrid-pro106.js";
class s extends i {
  /**
   * Providers give you access to the grid core functions like selections, data order, row/cell sizes, viewports 
   */
  constructor(o, r) {
    super(o, r), this.addEventListener(
      "beforecellfocusinit",
      (e) => {
        const { column: t } = e.detail;
        t && t.focus && !t.focus?.(e.detail) && e.preventDefault();
      }
    );
  }
}
export {
  s as CellColumnFocusVerifyPlugin
};
