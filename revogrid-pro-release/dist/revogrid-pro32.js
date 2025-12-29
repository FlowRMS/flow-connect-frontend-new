/* empty css                */
import { isGroupingColumn as u } from "@revolist/revogrid";
import { DELETE_SVG as g } from "./revogrid-pro114.js";
import { CorePlugin as d } from "./revogrid-pro106.js";
const l = "Drag columns here to group by row.";
class G extends d {
  groupings = [];
  groupPanel;
  config;
  constructor(e, r) {
    super(e, r), this.config = e.additionalData?.columnGroupPanel || {}, this.groupPanel = this.createGroupPanel(), e.classList.add("group-panel"), e.appendChild(this.groupPanel), this.groupPanel.addEventListener("dragover", (t) => t.preventDefault()), this.groupPanel.addEventListener("drop", this.onDrop.bind(this)), this.addEventListener("beforeheaderrender", (t) => {
      if (!t.detail.data || u(t.detail.data)) return;
      const n = t.detail.data?.columnProperties?.(t.detail.data), o = (i) => ({
        ...n,
        draggable: !0,
        onDragStart: (p) => {
          if (c(i)) return;
          p.dataTransfer?.setData("column-prop", String(i.prop));
          const a = document.createElement("div");
          a.className = "rv-drag-ghost", a.textContent = String(i.name || i.prop), document.body.appendChild(a), p.dataTransfer?.setDragImage(a, 0, 0), setTimeout(() => a.remove(), 0);
        }
      });
      t.detail.data.columnProperties = o;
    }), this.addEventListener("additionaldatachanged", ({ detail: t }) => {
      t?.columnGroupPanel && (this.config = t.columnGroupPanel, this.renderGroupPanel());
    });
  }
  createGroupPanel() {
    const e = document.createElement("div");
    return e.className = "group-panel", e.slot = "header", e.textContent = this.getEmptyPanelText(), e;
  }
  getEmptyPanelText() {
    return this.config.emptyPanelText || l;
  }
  renderGroupPanel() {
    if (this.groupPanel.innerHTML = "", this.groupings.length === 0) {
      this.groupPanel.textContent = this.getEmptyPanelText();
      return;
    }
    this.groupings.forEach((e, r) => {
      const t = this.createGroupItem(e, r);
      this.groupPanel.appendChild(t);
    });
  }
  createGroupItem(e, r) {
    const t = document.createElement("div");
    t.className = "group-item", t.draggable = !0, t.dataset.index = String(r), t.dataset.prop = String(e), t.textContent = String(e);
    const n = document.createElement("button");
    return n.className = "group-delete", n.innerHTML = g, n.addEventListener("click", (o) => {
      o.stopPropagation(), this.removeGrouping(r);
    }), t.appendChild(n), t.addEventListener(
      "dragstart",
      (o) => this.onGroupItemDragStart(o, e)
    ), t;
  }
  onDrop(e) {
    const r = e.dataTransfer?.getData("column-prop"), t = e.dataTransfer?.getData("group-item-prop");
    if (r)
      this.addGrouping(r);
    else if (t) {
      const n = t, o = this.getDropIndex(e.clientX);
      this.reorderGrouping(n, o);
    }
  }
  onGroupItemDragStart(e, r) {
    e.dataTransfer?.setData("group-item-prop", String(r));
  }
  getDropIndex(e) {
    const r = Array.from(this.groupPanel.children);
    for (let t = 0; t < r.length; t++) {
      const n = r[t].getBoundingClientRect();
      if (e < n.right)
        return t;
    }
    return r.length;
  }
  addGrouping(e) {
    this.groupings.includes(e) || (this.groupings.push(e), this.updateGrouping());
  }
  removeGrouping(e) {
    this.groupings.splice(e, 1), this.updateGrouping();
  }
  reorderGrouping(e, r) {
    const t = this.groupings.indexOf(e);
    t === -1 || t === r || (this.groupings.splice(t, 1), this.groupings.splice(r, 0, e), this.updateGrouping());
  }
  updateGrouping() {
    this.renderGroupPanel(), this.revogrid.grouping = {
      props: this.groupings
    };
  }
}
function c(s) {
  return !!s.children;
}
export {
  G as ColumnGroupPanelPlugin
};
