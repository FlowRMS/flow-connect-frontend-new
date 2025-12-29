/* empty css                */
import { CorePlugin as l } from "./revogrid-pro106.js";
const r = "info-panel";
class h extends l {
  panel;
  // Reference to the info panel
  isVisible = !1;
  // State to track visibility of the panel
  selectedRowData = null;
  // Data of the selected row
  wrapper;
  // Wrapper for grid and panel
  displayedKeys = [];
  // Keys to display in the panel
  constructor(s, n) {
    super(s, n);
    const e = s.parentElement;
    e?.classList.add("rv-wrapper"), e && (this.wrapper = e, this.panel = document.createElement("div"), this.panel.className = `${r}`, this.panel.setAttribute("hidden", "true"), this.wrapper.appendChild(this.panel), this.addEventListener("afterfocus", (i) => {
      const t = i.detail.model;
      this.beforeShowPanel(t) && this.showPanel(t);
    }), this.displayedKeys = s.additionalData?.infoPanel?.keys || []);
  }
  // Event emitter for before showing the panel
  beforeShowPanel(s) {
    return !this.emit("beforeinfopanelshow", { detail: s }).defaultPrevented;
  }
  // Function to create info panel content
  createInfoPanel() {
    if (this.panel) {
      if (this.panel.innerHTML = "", this.isVisible)
        this.panel.removeAttribute("hidden");
      else {
        this.panel.setAttribute("hidden", "true");
        return;
      }
      this.selectedRowData && (this.displayedKeys.length > 0 ? this.displayedKeys : Object.keys(this.selectedRowData)).map((e) => {
        let i, t = this.selectedRowData[e];
        if (t) {
          if (typeof t == "string" && t.startsWith("<") && t.endsWith(">"))
            i = document.createElement("div"), i.innerHTML = t;
          else {
            i = document.createElement("p");
            const a = document.createElement("strong");
            a.appendChild(document.createTextNode(e)), i.appendChild(a), i.appendChild(document.createTextNode(`: ${t}`));
          }
          return i;
        }
      }).forEach((e) => e && this.panel?.appendChild(e));
    }
  }
  showPanel(s) {
    this.selectedRowData = s, this.isVisible = !0, this.createInfoPanel();
  }
}
export {
  h as InfoPanelPlugin
};
