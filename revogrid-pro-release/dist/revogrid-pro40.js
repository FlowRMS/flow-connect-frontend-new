/* empty css                */
import { timeout as g } from "@revolist/revogrid";
import { ROW_MENU_EVENT as u } from "./revogrid-pro78.js";
import { POP_EL as a, contextPopUp as f } from "./revogrid-pro117.js";
import { CorePlugin as d } from "./revogrid-pro106.js";
class b extends d {
  contextMenu;
  config;
  localsubscriptions = [];
  /**
   * Providers give you access to the grid core functions like selections, data order, row/cell sizes, viewports
   */
  constructor(n, r) {
    super(n, r);
    const i = n.registerVNode.filter(
      (e) => typeof e != "function" || e?.prototype?.name !== a
    );
    f.prototype.name = a;
    const t = f.bind(this);
    n.registerVNode = [...i, t];
    function o(e) {
      if (!this.contextMenu)
        return;
      e.composedPath().includes(this.contextMenu) || this.close();
    }
    const h = o.bind(this);
    this.localsubscriptions = [h], document.addEventListener("click", h), this.addEventListener(
      u,
      (e) => this.open(e.target)
    ), this.revogrid.addEventListener("contextmenu", (e) => {
      if (this.config?.rightClick) {
        const s = e.target;
        this.isTargetElement(s) && (e.preventDefault(), this.open(s, e));
      }
    }), this.revogrid.addEventListener("click", (e) => {
      if (this.config?.leftClick) {
        const s = e.target;
        this.isTargetElement(s) && (e.preventDefault(), this.open(s, e));
      }
    }), this.addEventListener(
      "additionaldatachanged",
      ({ detail: e }) => {
        this.config = this.getConfig(e?.rowContextMenu);
      }
    ), this.config = this.getConfig(n.additionalData?.rowContextMenu);
  }
  getConfig(n = {}) {
    return {
      items: [],
      rightClick: !0,
      leftClick: !1,
      targetSelectors: [".rgCell"],
      anchorToTarget: !1,
      ...n
    };
  }
  // Close the context menu
  close() {
    this.contextMenu && (this.contextMenu.style.display = "none");
  }
  isTargetElement(n) {
    return (this.config?.targetSelectors || [".rgCell"]).some((i) => n.closest(i) || n.matches(i));
  }
  // Open the context menu
  async open(n, r) {
    if (!(n instanceof HTMLElement && this.contextMenu) || !this.isTargetElement(n))
      return;
    await g(0), this.contextMenu.style.display = "flex";
    const i = n.getBoundingClientRect(), t = this.revogrid.getBoundingClientRect(), o = this.contextMenu.getBoundingClientRect(), h = t.height - (i.top - t.top + i.height), e = i.top - t.top, s = t.width - (i.left - t.left + i.width), p = i.left - t.left;
    let c = 0, l = 0;
    this.config?.anchorToTarget || !r ? (h >= o.height || h > e ? c = i.top - t.top + i.height : c = i.top - t.top - o.height, s >= o.width || s > p ? l = i.left - t.left + i.width : l = i.left - t.left - o.width) : (c = r.clientY - t.top, l = r.clientX - t.left), c < 0 ? c = 0 : c + o.height > t.height && (c = t.height - o.height), l < 0 ? l = 0 : l + o.width > t.width && (l = t.width - o.width), this.contextMenu.style.top = `${c}px`, this.contextMenu.style.left = `${l}px`;
  }
  clearSubscriptions() {
    super.clearSubscriptions(), this.localsubscriptions.forEach((n) => n()), this.localsubscriptions = [];
  }
}
export {
  b as ContextMenuPlugin
};
