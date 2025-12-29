/* empty css                */
import { PaginationPanel as r } from "./revogrid-pro181.js";
import { PAGE_CHANGE_EVENT as p } from "./revogrid-pro78.js";
import { CorePlugin as l } from "./revogrid-pro106.js";
class d extends l {
  constructor(t, n) {
    super(t, n), this.revogrid = t, this.providers = n;
    let e = this.getConfig(t.additionalData?.pagination);
    this.panel = new r(e, (i) => {
      this.emit(p, {
        skip: i
      });
    });
    function a(i) {
      return this.panel?.setRefresh(i?.refresh), this.panel?.render() || this.h("span");
    }
    const o = "rv-pagination-panel", s = t.registerVNode.filter(
      (i) => typeof i != "function" || i?.prototype?.name !== o
    );
    a.prototype.name = o;
    const g = a.bind(this);
    t.registerVNode = [...s, g], this.addEventListener(
      "additionaldatachanged",
      ({ detail: i }) => {
        (i.pagination?.itemsPerPage !== e.itemsPerPage || i.pagination?.initialPage !== e.initialPage || i.pagination?.total !== e.total) && this.setConfig(i.pagination);
      }
    );
  }
  /**
   * Instance of PaginationPanel
   */
  panel = null;
  setConfig(t) {
    this.panel?.update(this.getConfig(t));
  }
  /**
   * Initialize pagination config from user provided config
   */
  getConfig(t = {
    itemsPerPage: 0,
    initialPage: 0,
    total: 0
  }) {
    return {
      ...t,
      itemsPerPage: t.itemsPerPage ?? 0,
      initialPage: t.initialPage ?? 0,
      total: t.total ?? 0
    };
  }
}
export {
  d as PaginationPlugin
};
