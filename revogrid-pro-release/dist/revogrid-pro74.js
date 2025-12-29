/* empty css                */
import { CorePlugin as r } from "./revogrid-pro106.js";
class g extends r {
  tooltipContainer;
  constructor(t, o) {
    super(t, o), this.tooltipContainer = this.createTooltipContainer(), t.appendChild(this.tooltipContainer), this.addEventListener("mouseover", (i) => this.onHover(i)), this.addEventListener("mouseout", () => this.hideTooltip()), this.addEventListener("mousemove", (i) => this.updateTooltipPosition(i));
  }
  createTooltipContainer() {
    const t = document.createElement("div");
    return t.className = "grid-tooltip", t;
  }
  onHover(t) {
    const o = t.target?.closest("[data-tooltip], [title]"), i = o?.getAttribute("data-tooltip") || o?.getAttribute("title");
    if (o && i) {
      const s = o.getAttribute("tooltip-type"), e = o.getAttribute("tooltip-position") || "top";
      this.showTooltip(i, s, e, t);
    } else
      this.hideTooltip();
  }
  showTooltip(t, o, i, s) {
    this.tooltipContainer.textContent = t, this.tooltipContainer.className = "grid-tooltip", o && this.tooltipContainer.classList.add(`tooltip-${o}`), this.tooltipContainer.style.display = "block", this.updateTooltipPosition(s, i);
  }
  hideTooltip() {
    this.tooltipContainer.style.display = "none";
  }
  updateTooltipPosition(t, o = "top") {
    const { clientX: i, clientY: s } = t, e = this.tooltipContainer.getBoundingClientRect(), a = this.revogrid.getBoundingClientRect(), l = 10;
    let n = s - a.top, p = i - a.left;
    switch (o) {
      case "top":
        n -= e.height + l;
        break;
      case "bottom":
        n += l;
        break;
      case "left":
        p -= e.width + l;
        break;
      case "right":
        p += l;
        break;
      default:
        n -= e.height + l;
        break;
    }
    n = Math.max(0, Math.min(n, a.height - e.height)), p = Math.max(0, Math.min(p, a.width - e.width)), this.tooltipContainer.style.top = `${n}px`, this.tooltipContainer.style.left = `${p}px`;
  }
}
export {
  g as TooltipPlugin
};
